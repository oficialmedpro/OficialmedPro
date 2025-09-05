/**
 * 🔄 SERVIÇO UNIFICADO DE SINCRONIZAÇÃO SPRINTHUB ↔ SUPABASE
 * 
 * Versão corrigida que resolve:
 * - Problemas de parsing de datas brasileiras
 * - Duplicatas e inconsistências
 * - Validação de dados
 * - Logs detalhados para debug
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

// 🛠️ UTILITÁRIOS

/**
 * Parsear data brasileira (DD/MM/YYYY) ou ISO
 */
function parseBrazilianDate(dateString) {
    if (!dateString) return null;
    
    try {
        if (dateString.includes('/')) {
            // Formato brasileiro DD/MM/YYYY
            const parts = dateString.split('/');
            if (parts.length === 3) {
                const [day, month, year] = parts;
                const date = new Date(year, month - 1, day);
                return date.toISOString();
            }
        } else if (dateString.includes('T')) {
            // Formato ISO
            return new Date(dateString).toISOString();
        } else {
            // Tentar parsear como data normal
            return new Date(dateString).toISOString();
        }
    } catch (error) {
        console.warn(`⚠️ Erro ao parsear data: ${dateString}`, error);
        return null;
    }
    
    return null;
}

/**
 * Verificar se data é de hoje
 */
function isToday(dateString) {
    if (!dateString) return false;
    
    try {
        let date;
        if (dateString.includes('/')) {
            // Formato brasileiro DD/MM/YYYY
            const [day, month, year] = dateString.split('/');
            date = new Date(year, month - 1, day);
        } else {
            date = new Date(dateString);
        }
        
        const today = new Date();
        return date.toDateString() === today.toDateString();
    } catch (error) {
        return false;
    }
}

/**
 * Rate limiting
 */
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// 🔍 BUSCAR OPORTUNIDADES DO SPRINTHUB

/**
 * Buscar oportunidades de uma etapa específica
 */
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

/**
 * Buscar TODAS as oportunidades de uma etapa (com paginação)
 */
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
            await delay(200); // Rate limiting
        } catch (error) {
            console.log(`   ❌ Erro na página ${page}: ${error.message}`);
            break;
        }
    }

    return allOpportunities;
}

// 🔍 VERIFICAR NO SUPABASE

/**
 * Verificar se oportunidade existe no Supabase
 */
async function checkInSupabase(opportunityId) {
    try {
        const response = await fetch(`${SUPABASE_CONFIG.url}/rest/v1/oportunidade_sprint?id=eq.${opportunityId}&select=id,update_date,synced_at,create_date`, {
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

// 🆕 MAPEAR CAMPOS DA OPORTUNIDADE

/**
 * Mapear campos da oportunidade do SprintHub para Supabase
 */
function mapOpportunityFields(opportunity) {
    const fields = opportunity.fields || {};
    const lead = opportunity.dataLead || {};
    const utmTags = (lead.utmTags && lead.utmTags[0]) || {};

    // Identificar funil
    const getFunilId = (crmColumn) => {
        if ([130, 231, 82, 207, 83, 85, 232].includes(crmColumn)) return 6;
        if ([227, 202, 228, 229, 206, 203, 204, 230, 205, 241, 146, 147, 167, 148, 168, 149, 169, 150].includes(crmColumn)) return 14;
        return null;
    };

    return {
        id: opportunity.id,
        title: opportunity.title,
        value: parseFloat(opportunity.value) || 0.00,
        crm_column: opportunity.crm_column,
        lead_id: opportunity.lead_id,
        status: opportunity.status,
        loss_reason: opportunity.loss_reason || null,
        gain_reason: opportunity.gain_reason || null,
        user_id: opportunity.user || null,
        
        // Datas importantes - CORRIGIDAS
        create_date: parseBrazilianDate(opportunity.createDate),
        update_date: parseBrazilianDate(opportunity.updateDate),
        lost_date: opportunity.lost_date ? parseBrazilianDate(opportunity.lost_date) : null,
        gain_date: opportunity.gain_date ? parseBrazilianDate(opportunity.gain_date) : null,
        
        // Campos específicos
        origem_oportunidade: fields["ORIGEM OPORTUNIDADE"] || null,
        qualificacao: fields["QUALIFICACAO"] || null,
        status_orcamento: fields["Status Orcamento"] || null,
        
        // UTM
        utm_source: utmTags.utmSource || null,
        utm_campaign: utmTags.utmCampaign || null,
        utm_medium: utmTags.utmMedium || null,
        
        // Lead
        lead_firstname: lead.firstname || null,
        lead_email: lead.email || null,
        lead_whatsapp: lead.whatsapp || null,
        
        // Controle
        archived: opportunity.archived || 0,
        synced_at: new Date().toISOString(),
        
        // Funil
        funil_id: getFunilId(opportunity.crm_column),
        unidade_id: '[1]'
    };
}

// 💾 OPERAÇÕES NO SUPABASE

/**
 * Inserir no Supabase
 */
async function insertToSupabase(data) {
    try {
        const response = await fetch(`${SUPABASE_CONFIG.url}/rest/v1/oportunidade_sprint`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Authorization': `Bearer ${SUPABASE_CONFIG.serviceRoleKey}`,
                'apikey': SUPABASE_CONFIG.serviceRoleKey,
                'Accept-Profile': 'api',
                'Content-Profile': 'api',
                'Prefer': 'return=representation'
            },
            body: JSON.stringify(data)
        });

        return { success: response.ok, status: response.status };
        
    } catch (error) {
        console.error('❌ Erro ao inserir:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Atualizar no Supabase
 */
async function updateInSupabase(opportunityId, data) {
    try {
        const response = await fetch(`${SUPABASE_CONFIG.url}/rest/v1/oportunidade_sprint?id=eq.${opportunityId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Authorization': `Bearer ${SUPABASE_CONFIG.serviceRoleKey}`,
                'apikey': SUPABASE_CONFIG.serviceRoleKey,
                'Accept-Profile': 'api',
                'Content-Profile': 'api',
                'Prefer': 'return=representation'
            },
            body: JSON.stringify(data)
        });

        return { success: response.ok, status: response.status };
        
    } catch (error) {
        console.error('❌ Erro ao atualizar:', error);
        return { success: false, error: error.message };
    }
}

// 🎯 SINCRONIZAÇÃO PRINCIPAL

/**
 * Sincronizar etapa específica
 */
export async function syncStage(funnelId, stageId, stageName = 'Etapa', options = {}) {
    const { 
        onlyToday = false, 
        onProgress = null,
        dryRun = false 
    } = options;
    
    console.log(`🔄 Sincronizando ${stageName} (ID: ${stageId}) do Funil ${funnelId}...`);
    console.log(`📅 Apenas hoje: ${onlyToday} | Dry Run: ${dryRun}`);
    
    let processed = 0, inserted = 0, updated = 0, skipped = 0, errors = 0;
    const errorDetails = [];
    
    try {
        // Buscar oportunidades da etapa
        const opportunities = await fetchAllOpportunitiesFromStage(funnelId, stageId);
        console.log(`📊 Encontradas ${opportunities.length} oportunidades no SprintHub`);
        
        // Filtrar apenas hoje se solicitado
        let filteredOpps = opportunities;
        if (onlyToday) {
            filteredOpps = opportunities.filter(opp => isToday(opp.createDate));
            console.log(`📅 Filtradas ${filteredOpps.length} oportunidades de hoje`);
        }
        
        for (const opportunity of filteredOpps) {
            try {
                if (onProgress) {
                    onProgress({
                        stage: stageName,
                        status: `Processando ${processed + 1}/${filteredOpps.length}...`,
                        progress: Math.round((processed / filteredOpps.length) * 100)
                    });
                }
                
                const existing = await checkInSupabase(opportunity.id);
                const mappedData = mapOpportunityFields(opportunity);
                
                if (!existing) {
                    // ➕ NÃO EXISTE - INSERIR
                    if (!dryRun) {
                        const result = await insertToSupabase(mappedData);
                        if (result.success) {
                            inserted++;
                            console.log(`   ➕ Inserido: ${opportunity.id} - ${opportunity.title}`);
                        } else {
                            errors++;
                            errorDetails.push({
                                id: opportunity.id,
                                action: 'insert',
                                error: result.error || `HTTP ${result.status}`
                            });
                        }
                    } else {
                        console.log(`   ➕ [DRY RUN] Inseriria: ${opportunity.id} - ${opportunity.title}`);
                        inserted++;
                    }
                } else {
                    // 🔄 EXISTE - VERIFICAR SE PRECISA ATUALIZAR
                    const sprintHubDate = new Date(opportunity.updateDate);
                    const supabaseDate = new Date(existing.update_date);
                    
                    if (sprintHubDate > supabaseDate) {
                        if (!dryRun) {
                            const result = await updateInSupabase(opportunity.id, mappedData);
                            if (result.success) {
                                updated++;
                                console.log(`   🔄 Atualizado: ${opportunity.id} - ${opportunity.title}`);
                            } else {
                                errors++;
                                errorDetails.push({
                                    id: opportunity.id,
                                    action: 'update',
                                    error: result.error || `HTTP ${result.status}`
                                });
                            }
                        } else {
                            console.log(`   🔄 [DRY RUN] Atualizaria: ${opportunity.id} - ${opportunity.title}`);
                            updated++;
                        }
                    } else {
                        skipped++;
                        console.log(`   ⚪ Já atualizado: ${opportunity.id}`);
                    }
                }
                
                processed++;
                await delay(100); // Rate limiting
                
            } catch (error) {
                errors++;
                errorDetails.push({
                    id: opportunity.id,
                    action: 'process',
                    error: error.message
                });
                console.error(`❌ Erro processando ${opportunity.id}:`, error);
            }
        }
        
        const result = {
            success: true,
            stageName,
            processed,
            inserted,
            updated,
            skipped,
            errors,
            errorDetails,
            total: filteredOpps.length
        };
        
        console.log(`✅ ${stageName} sincronizada: ${processed} processadas | ${inserted} inseridas | ${updated} atualizadas | ${skipped} já atualizadas | ${errors} erros`);
        
        if (onProgress) {
            onProgress({
                stage: stageName,
                status: 'Concluído',
                result
            });
        }
        
        return result;
        
    } catch (error) {
        console.error(`❌ Erro geral na sincronização da ${stageName}:`, error);
        return {
            success: false,
            error: error.message,
            stageName,
            processed: 0,
            inserted: 0,
            updated: 0,
            skipped: 0,
            errors: 0
        };
    }
}

/**
 * Sincronizar apenas oportunidades de hoje
 */
export async function syncTodayOnly(options = {}) {
    console.log('🔄 SINCRONIZAÇÃO APENAS DE HOJE');
    console.log('='.repeat(50));
    
    const results = {
        totalProcessed: 0,
        totalInserted: 0,
        totalUpdated: 0,
        totalSkipped: 0,
        totalErrors: 0,
        stages: {},
        startTime: new Date(),
        endTime: null
    };
    
    try {
        for (const [funnelId, funnelConfig] of Object.entries(FUNIS_CONFIG)) {
            console.log(`🎯 Processando ${funnelConfig.name}...`);
            
            for (const stage of funnelConfig.stages) {
                try {
                    const stageResult = await syncStage(
                        parseInt(funnelId), 
                        stage.id, 
                        stage.name,
                        { ...options, onlyToday: true }
                    );
                    
                    results.stages[stage.id] = stageResult;
                    results.totalProcessed += stageResult.processed;
                    results.totalInserted += stageResult.inserted;
                    results.totalUpdated += stageResult.updated;
                    results.totalSkipped += stageResult.skipped;
                    results.totalErrors += stageResult.errors;
                    
                } catch (error) {
                    console.error(`❌ Erro na etapa ${stage.name}:`, error);
                    results.stages[stage.id] = {
                        success: false,
                        error: error.message,
                        stageName: stage.name
                    };
                }
            }
        }
        
        results.endTime = new Date();
        results.duration = Math.round((results.endTime - results.startTime) / 1000);
        
        // Relatório final
        console.log('\n' + '='.repeat(60));
        console.log('📊 RELATÓRIO FINAL - SINCRONIZAÇÃO DE HOJE');
        console.log('='.repeat(60));
        console.log(`📅 Data: ${new Date().toLocaleDateString('pt-BR')}`);
        console.log(`⏱️ Duração: ${results.duration}s`);
        console.log(`📈 Total processadas: ${results.totalProcessed}`);
        console.log(`➕ Total inseridas: ${results.totalInserted}`);
        console.log(`🔄 Total atualizadas: ${results.totalUpdated}`);
        console.log(`⚪ Total já atualizadas: ${results.totalSkipped}`);
        console.log(`❌ Total erros: ${results.totalErrors}`);
        console.log('='.repeat(60));
        
        return results;
        
    } catch (error) {
        console.error('❌ Erro na sincronização de hoje:', error);
        results.error = error.message;
        results.success = false;
        return results;
    }
}

/**
 * Sincronização completa (todas as oportunidades)
 */
export async function syncAll(options = {}) {
    console.log('🔄 SINCRONIZAÇÃO COMPLETA');
    console.log('='.repeat(50));
    
    const results = {
        totalProcessed: 0,
        totalInserted: 0,
        totalUpdated: 0,
        totalSkipped: 0,
        totalErrors: 0,
        funnels: {},
        startTime: new Date(),
        endTime: null
    };
    
    try {
        for (const [funnelId, funnelConfig] of Object.entries(FUNIS_CONFIG)) {
            console.log(`🎯 Processando ${funnelConfig.name}...`);
            
            results.funnels[funnelId] = {
                name: funnelConfig.name,
                stages: {}
            };
            
            for (const stage of funnelConfig.stages) {
                try {
                    const stageResult = await syncStage(
                        parseInt(funnelId), 
                        stage.id, 
                        stage.name,
                        options
                    );
                    
                    results.funnels[funnelId].stages[stage.id] = stageResult;
                    results.totalProcessed += stageResult.processed;
                    results.totalInserted += stageResult.inserted;
                    results.totalUpdated += stageResult.updated;
                    results.totalSkipped += stageResult.skipped;
                    results.totalErrors += stageResult.errors;
                    
                } catch (error) {
                    console.error(`❌ Erro na etapa ${stage.name}:`, error);
                    results.funnels[funnelId].stages[stage.id] = {
                        success: false,
                        error: error.message,
                        stageName: stage.name
                    };
                }
            }
        }
        
        results.endTime = new Date();
        results.duration = Math.round((results.endTime - results.startTime) / 1000);
        
        // Relatório final
        console.log('\n' + '='.repeat(60));
        console.log('📊 RELATÓRIO FINAL - SINCRONIZAÇÃO COMPLETA');
        console.log('='.repeat(60));
        console.log(`⏱️ Duração: ${results.duration}s`);
        console.log(`📈 Total processadas: ${results.totalProcessed}`);
        console.log(`➕ Total inseridas: ${results.totalInserted}`);
        console.log(`🔄 Total atualizadas: ${results.totalUpdated}`);
        console.log(`⚪ Total já atualizadas: ${results.totalSkipped}`);
        console.log(`❌ Total erros: ${results.totalErrors}`);
        console.log('='.repeat(60));
        
        return results;
        
    } catch (error) {
        console.error('❌ Erro na sincronização completa:', error);
        results.error = error.message;
        results.success = false;
        return results;
    }
}

// 🔍 VERIFICAÇÃO E VALIDAÇÃO

/**
 * Verificar sincronização de uma etapa
 */
export async function checkStageSync(funnelId, stageId, stageName = 'Etapa') {
    try {
        console.log(`🔍 Verificando sincronização da ${stageName}...`);
        
        const sprintHubOpps = await fetchAllOpportunitiesFromStage(funnelId, stageId);
        let supabaseCount = 0, missing = 0;
        const missingIds = [];
        
        for (const opp of sprintHubOpps) {
            const exists = await checkInSupabase(opp.id);
            if (exists) {
                supabaseCount++;
            } else {
                missing++;
                missingIds.push({
                    id: opp.id,
                    title: opp.title,
                    status: opp.status,
                    createDate: opp.createDate
                });
            }
            
            await delay(50);
        }
        
        const result = {
            stageName,
            sprintHubTotal: sprintHubOpps.length,
            supabaseTotal: supabaseCount,
            missing,
            missingIds,
            syncPercentage: sprintHubOpps.length > 0 ? ((supabaseCount / sprintHubOpps.length) * 100).toFixed(1) : 100
        };
        
        console.log(`📊 ${stageName}: ${supabaseCount}/${sprintHubOpps.length} sincronizadas (${result.syncPercentage}%)`);
        if (missing > 0) {
            console.log(`❌ ${missing} oportunidades faltando no Supabase`);
        }
        
        return result;
        
    } catch (error) {
        console.error(`❌ Erro verificando ${stageName}:`, error);
        return { error: error.message };
    }
}

/**
 * Verificar sincronização completa
 */
export async function checkFullSync() {
    console.log('🔍 VERIFICAÇÃO COMPLETA DE SINCRONIZAÇÃO');
    console.log('='.repeat(50));
    
    const results = {
        totalSprintHub: 0,
        totalSupabase: 0,
        totalMissing: 0,
        funnels: {},
        startTime: new Date(),
        endTime: null
    };
    
    try {
        for (const [funnelId, funnelConfig] of Object.entries(FUNIS_CONFIG)) {
            console.log(`🎯 ${funnelConfig.name}`);
            
            results.funnels[funnelId] = {
                name: funnelConfig.name,
                stages: {}
            };
            
            for (const stage of funnelConfig.stages) {
                try {
                    const stageResult = await checkStageSync(
                        parseInt(funnelId), 
                        stage.id, 
                        stage.name
                    );
                    
                    if (!stageResult.error) {
                        results.totalSprintHub += stageResult.sprintHubTotal;
                        results.totalSupabase += stageResult.supabaseTotal;
                        results.totalMissing += stageResult.missing;
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
        
        // Relatório final
        const percentualGeral = results.totalSprintHub > 0 ? 
            ((results.totalSupabase / results.totalSprintHub) * 100).toFixed(2) : 0;
        
        console.log('='.repeat(60));
        console.log('📊 RELATÓRIO FINAL DE VERIFICAÇÃO');
        console.log('='.repeat(60));
        console.log(`📈 Total SprintHub: ${results.totalSprintHub.toLocaleString()} oportunidades`);
        console.log(`✅ Total Supabase: ${results.totalSupabase.toLocaleString()} oportunidades`);
        console.log(`❌ Total Faltando: ${results.totalMissing.toLocaleString()} oportunidades`);
        console.log(`📊 Taxa de Sincronização: ${percentualGeral}%`);
        console.log(`⏱️ Duração: ${results.duration}s`);
        
        results.percentualGeral = percentualGeral;
        results.success = true;
        
        return results;
        
    } catch (error) {
        console.error('❌ ERRO GERAL:', error.message);
        results.error = error.message;
        results.success = false;
        results.endTime = new Date();
        return results;
    }
}

