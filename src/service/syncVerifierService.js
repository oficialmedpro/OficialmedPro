/**
 * 🔍 VERIFICADOR DE SINCRONIZAÇÃO SPRINTHUB ↔ SUPABASE
 * 
 * Migrado de NEON/roda_na_vps/verificador-sincronizacao.js
 * Adaptado para ambiente React/frontend
 * 
 * Compara TODAS as oportunidades do SprintHub com o Supabase
 * Detecta: ausentes, desatualizadas, inconsistências
 */

const SPRINTHUB_CONFIG = {
    baseUrl: 'sprinthub-api-master.sprinthub.app',
    instance: 'oficialmed',
    apiToken: '9ad36c85-5858-4960-9935-e73c3698dd0c'
};

const SUPABASE_CONFIG = {
    url: import.meta.env.VITE_SUPABASE_URL,
    serviceRoleKey: import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY
};

// 📋 CONFIGURAÇÃO COMPLETA DOS FUNIS E ETAPAS
const FUNIS_CONFIG = {
    6: {
        name: "[1] COMERCIAL APUCARANA",
        stages: [
            { id: 130, name: "[0] ENTRADA" },
            { id: 231, name: "[1] ACOLHIMENTO/TRIAGEM" },
            { id: 82, name: "[2] QUALIFICADO" },
            { id: 207, name: "[3] ORÇAMENTO REALIZADO" },
            { id: 83, name: "[4] NEGOCIAÇÃO" },
            { id: 85, name: "[5] FOLLOW UP" },
            { id: 232, name: "[6] CADASTRO" }
        ]
    },
    14: {
        name: "[2] RECOMPRA",
        stages: [
            { id: 227, name: "[X] PROMO" },
            { id: 202, name: "[0] ENTRADA" },
            { id: 228, name: "[1] ACOLHIMENTO/TRIAGEM" },
            { id: 229, name: "[2] QUALIFICAÇÃO" },
            { id: 206, name: "[3] ORÇAMENTOS" },
            { id: 203, name: "[4] NEGOCIAÇÃO" },
            { id: 204, name: "[5] FOLLOW UP" },
            { id: 230, name: "[6] CADASTRO" },
            { id: 205, name: "[X] PARCEIROS" },
            { id: 241, name: "[0] MONITORAMENTO" },
            { id: 146, name: "[1] DISPARO" },
            { id: 147, name: "[2] DIA 1 - 1º TENTATIVA" },
            { id: 167, name: "[3] DIA 1 - 2º TENTATIVA" },
            { id: 148, name: "[4] DIA 2 - 1º TENTATIVA" },
            { id: 168, name: "[5] DIA 2 - 2º TENTATIVA" },
            { id: 149, name: "[6] DIA 3 - 1º TENTATIVA" },
            { id: 169, name: "[7] DIA 3 - 2º TENTATIVA" },
            { id: 150, name: "[8] FOLLOW UP INFINITO" }
        ]
    }
};

// 🔍 BUSCAR OPORTUNIDADES DO SPRINTHUB
async function fetchOpportunitiesFromStage(funnelId, stageId, page = 0, limit = 50) {
    try {
        const postData = JSON.stringify({ page, limit, columnId: stageId });
        
        const response = await fetch(`https://${SPRINTHUB_CONFIG.baseUrl}/crm/opportunities/${funnelId}?apitoken=${SPRINTHUB_CONFIG.apiToken}&i=${SPRINTHUB_CONFIG.instance}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: postData
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        return Array.isArray(data) ? data : [];
        
    } catch (error) {
        console.error(`❌ Erro ao buscar etapa ${stageId}:`, error);
        return [];
    }
}

// 🔍 BUSCAR TODAS AS OPORTUNIDADES DE UMA ETAPA (COM PAGINAÇÃO)
async function fetchAllOpportunitiesFromStage(funnelId, stageId) {
    let allOpportunities = [];
    let page = 0;
    const limit = 50;

    while (true) {
        try {
            const opportunities = await fetchOpportunitiesFromStage(funnelId, stageId, page, limit);
            
            if (opportunities.length === 0) break;
            
            allOpportunities = allOpportunities.concat(opportunities);
            
            if (opportunities.length < limit) break;
            
            page++;
            await new Promise(resolve => setTimeout(resolve, 200)); // Rate limiting
        } catch (error) {
            console.log(`   ❌ Erro na página ${page}: ${error.message}`);
            break;
        }
    }

    return allOpportunities;
}

// 🔍 VERIFICAR SE EXISTE NO SUPABASE
async function checkInSupabase(opportunityId) {
    try {
        const response = await fetch(`${SUPABASE_CONFIG.url}/rest/v1/oportunidade_sprint?id=eq.${opportunityId}&select=id,update_date,synced_at`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Authorization': `Bearer ${SUPABASE_CONFIG.serviceRoleKey}`,
                'apikey': SUPABASE_CONFIG.serviceRoleKey,
                'Accept-Profile': 'api'
            }
        });

        if (!response.ok) return null;
        
        const data = await response.json();
        return Array.isArray(data) && data.length > 0 ? data[0] : null;
        
    } catch (error) {
        console.error(`❌ Erro ao verificar ID ${opportunityId}:`, error);
        return null;
    }
}

// 📊 VERIFICAR SINCRONIZAÇÃO DE UMA ETAPA ESPECÍFICA
export async function verifyStageSync(funnelId, stageId, stageName, onProgress = null) {
    console.log(`🔍 Verificando sincronização: ${stageName} (ID: ${stageId})`);
    
    if (onProgress) onProgress({ stage: stageName, status: 'Buscando no SprintHub...' });

    try {
        // Buscar TODAS as oportunidades desta etapa
        const sprintHubOpps = await fetchAllOpportunitiesFromStage(funnelId, stageId);
        const stageSprintHubCount = sprintHubOpps.length;

        console.log(`📊 SprintHub: ${stageSprintHubCount} oportunidades`);
        
        if (onProgress) {
            onProgress({ 
                stage: stageName, 
                status: `Verificando ${stageSprintHubCount} oportunidades no Supabase...` 
            });
        }

        let stageSupabaseCount = 0;
        let stageAusentes = 0;
        let stageDesatualizadas = 0;
        const idsAusentes = [];
        const idsDesatualizadas = [];

        // Verificar cada oportunidade no Supabase
        for (let i = 0; i < sprintHubOpps.length; i++) {
            const opp = sprintHubOpps[i];
            
            if (onProgress && i % 10 === 0) {
                onProgress({ 
                    stage: stageName, 
                    status: `Verificando ${i + 1}/${stageSprintHubCount}...`,
                    progress: Math.round((i / stageSprintHubCount) * 100)
                });
            }

            try {
                const supabaseRecord = await checkInSupabase(opp.id);
                
                if (!supabaseRecord) {
                    // ❌ AUSENTE NO SUPABASE
                    stageAusentes++;
                    idsAusentes.push({
                        id: opp.id,
                        title: opp.title,
                        status: opp.status,
                        createDate: opp.createDate,
                        updateDate: opp.updateDate,
                        whatsapp: opp.dataLead?.whatsapp || 'N/A'
                    });
                } else {
                    // ✅ EXISTE NO SUPABASE
                    stageSupabaseCount++;

                    // Verificar se está desatualizada
                    const sprintHubDate = new Date(opp.updateDate);
                    const supabaseDate = new Date(supabaseRecord.update_date);

                    if (sprintHubDate > supabaseDate) {
                        stageDesatualizadas++;
                        idsDesatualizadas.push({
                            id: opp.id,
                            title: opp.title,
                            sprintHubDate: opp.updateDate,
                            supabaseDate: supabaseRecord.update_date
                        });
                    }
                }

                // Rate limiting
                await new Promise(resolve => setTimeout(resolve, 50));

            } catch (error) {
                console.log(`❌ Erro verificando ID ${opp.id}`);
            }
        }

        // 📊 RESULTADO DA ETAPA
        const percentual = stageSprintHubCount > 0 ? 
            ((stageSupabaseCount / stageSprintHubCount) * 100).toFixed(1) : 0;

        const result = {
            stageName,
            stageId,
            sprintHubCount: stageSprintHubCount,
            supabaseCount: stageSupabaseCount,
            ausentes: stageAusentes,
            desatualizadas: stageDesatualizadas,
            percentualSincronizado: percentual,
            idsAusentes,
            idsDesatualizadas
        };

        console.log(`✅ ${stageName}: ${stageSupabaseCount}/${stageSprintHubCount} (${percentual}%)`);
        
        if (stageAusentes > 0) {
            console.log(`❌ Ausentes: ${stageAusentes}`);
        }
        
        if (stageDesatualizadas > 0) {
            console.log(`🔄 Desatualizadas: ${stageDesatualizadas}`);
        }

        if (onProgress) {
            onProgress({ 
                stage: stageName, 
                status: 'Concluído',
                result 
            });
        }

        return result;

    } catch (error) {
        console.error(`❌ Erro na verificação da etapa ${stageName}:`, error);
        
        const errorResult = { 
            error: error.message, 
            stageName, 
            stageId 
        };
        
        if (onProgress) {
            onProgress({ 
                stage: stageName, 
                status: 'Erro',
                error: errorResult 
            });
        }
        
        return errorResult;
    }
}

// 🎯 VERIFICAR FOLLOW UP ESPECÍFICAMENTE
export async function verifyFollowUpSync(onProgress = null) {
    return await verifyStageSync(6, 85, 'FOLLOW UP', onProgress);
}

// 📊 VERIFICAÇÃO COMPLETA DE TODOS OS FUNIS
export async function verifyAllFunnelsSync(onProgress = null) {
    console.log('🔍 VERIFICAÇÃO COMPLETA DE SINCRONIZAÇÃO SPRINTHUB ↔ SUPABASE');
    console.log('='.repeat(60));

    const results = {
        totalSprintHub: 0,
        totalSupabase: 0,
        totalAusentes: 0,
        totalDesatualizadas: 0,
        funnels: {},
        startTime: new Date(),
        endTime: null
    };

    try {
        for (const [funnelId, funnelConfig] of Object.entries(FUNIS_CONFIG)) {
            console.log(`🎯 ${funnelConfig.name}`);
            
            if (onProgress) {
                onProgress({ 
                    funnel: funnelConfig.name, 
                    status: 'Iniciando...' 
                });
            }

            results.funnels[funnelId] = {
                name: funnelConfig.name,
                stages: {}
            };

            for (const stage of funnelConfig.stages) {
                try {
                    const stageResult = await verifyStageSync(
                        parseInt(funnelId), 
                        stage.id, 
                        stage.name,
                        onProgress
                    );

                    if (!stageResult.error) {
                        results.totalSprintHub += stageResult.sprintHubCount;
                        results.totalSupabase += stageResult.supabaseCount;
                        results.totalAusentes += stageResult.ausentes;
                        results.totalDesatualizadas += stageResult.desatualizadas;
                    }

                    results.funnels[funnelId].stages[stage.id] = stageResult;

                } catch (error) {
                    console.log(`❌ Erro na etapa ${stage.name}: ${error.message}`);
                    results.funnels[funnelId].stages[stage.id] = {
                        error: error.message,
                        stageName: stage.name,
                        stageId: stage.id
                    };
                }
            }
        }

        results.endTime = new Date();
        results.duration = Math.round((results.endTime - results.startTime) / 1000);

        // 📊 RELATÓRIO FINAL
        const percentualGeral = results.totalSprintHub > 0 ? 
            ((results.totalSupabase / results.totalSprintHub) * 100).toFixed(2) : 0;

        console.log('='.repeat(60));
        console.log('📊 RELATÓRIO FINAL DE VERIFICAÇÃO');
        console.log('='.repeat(60));
        console.log(`📈 Total SprintHub: ${results.totalSprintHub.toLocaleString()} oportunidades`);
        console.log(`✅ Total Supabase: ${results.totalSupabase.toLocaleString()} oportunidades`);
        console.log(`❌ Total Ausentes: ${results.totalAusentes.toLocaleString()} oportunidades`);
        console.log(`🔄 Total Desatualizadas: ${results.totalDesatualizadas.toLocaleString()} oportunidades`);
        console.log(`📊 Taxa de Sincronização: ${percentualGeral}%`);
        console.log(`⏱️ Duração: ${results.duration}s`);

        results.percentualGeral = percentualGeral;
        results.success = true;

        if (onProgress) {
            onProgress({ 
                status: 'Concluído', 
                finalResult: results 
            });
        }

        return results;

    } catch (error) {
        console.error('❌ ERRO GERAL:', error.message);
        results.error = error.message;
        results.success = false;
        results.endTime = new Date();

        if (onProgress) {
            onProgress({ 
                status: 'Erro', 
                error: results 
            });
        }

        return results;
    }
}

// 🎯 VERIFICAR OPORTUNIDADES ESPECÍFICAS POR IDs
export async function verifySpecificOpportunities(opportunityIds, onProgress = null) {
    console.log(`🔍 Verificando ${opportunityIds.length} oportunidades específicas...`);
    
    const results = {
        total: opportunityIds.length,
        found: 0,
        missing: 0,
        details: []
    };

    for (let i = 0; i < opportunityIds.length; i++) {
        const id = opportunityIds[i];
        
        if (onProgress) {
            onProgress({
                status: `Verificando ID ${id}... (${i + 1}/${opportunityIds.length})`,
                progress: Math.round((i / opportunityIds.length) * 100)
            });
        }

        try {
            const supabaseRecord = await checkInSupabase(id);
            
            const detail = {
                id,
                exists: !!supabaseRecord,
                supabaseData: supabaseRecord
            };

            if (supabaseRecord) {
                results.found++;
            } else {
                results.missing++;
            }

            results.details.push(detail);

            await new Promise(resolve => setTimeout(resolve, 100));

        } catch (error) {
            console.error(`❌ Erro verificando ID ${id}:`, error);
            results.details.push({
                id,
                exists: false,
                error: error.message
            });
            results.missing++;
        }
    }

    console.log(`📊 Resultado: ${results.found}/${results.total} encontradas no Supabase`);
    
    if (onProgress) {
        onProgress({
            status: 'Concluído',
            finalResult: results
        });
    }

    return results;
}