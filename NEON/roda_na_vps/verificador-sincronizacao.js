/**
 * 🔍 VERIFICADOR DE SINCRONIZAÇÃO SPRINTHUB ↔ SUPABASE
 * 
 * Compara TODAS as oportunidades do SprintHub com o Supabase
 * Detecta: ausentes, desatualizadas, inconsistências
 * 
 * 📊 Relatório completo por funil/etapa
 * 
 * LOCALIZAÇÃO NO SERVIDOR: /opt/sprinthub-sync/verificador-sincronizacao.js
 */

const https = require('https');

const SPRINTHUB_CONFIG = {
    baseUrl: 'sprinthub-api-master.sprinthub.app',
    instance: 'oficialmed',
    apiToken: '9ad36c85-5858-4960-9935-e73c3698dd0c'
};

const SUPABASE_CONFIG = {
    url: 'https://agdffspstbxeqhqtltvb.supabase.co',
    serviceRoleKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFnZGZmc3BzdGJ4ZXFocXRsdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDQ1MzY2NiwiZXhwIjoyMDY2MDI5NjY2fQ.grInwGHFAH2WYvYerwfHkUsM08wXCJASg4CPMD2cTaA'
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
function fetchOpportunitiesFromStage(funnelId, stageId, page = 0, limit = 50) {
    return new Promise((resolve, reject) => {
        const postData = JSON.stringify({ page, limit, columnId: stageId });
        const options = {
            hostname: SPRINTHUB_CONFIG.baseUrl,
            port: 443,
            path: `/crm/opportunities/${funnelId}?apitoken=${SPRINTHUB_CONFIG.apiToken}&i=${SPRINTHUB_CONFIG.instance}`,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Content-Length': Buffer.byteLength(postData)
            }
        };

        const req = https.request(options, (res) => {
            let responseData = '';
            res.on('data', (chunk) => responseData += chunk);
            res.on('end', () => {
                try {
                    const jsonData = JSON.parse(responseData);
                    resolve(Array.isArray(jsonData) ? jsonData : []);
                } catch (error) {
                    reject(error);
                }
            });
        });

        req.on('error', reject);
        req.write(postData);
        req.end();
    });
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
function checkInSupabase(opportunityId) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'agdffspstbxeqhqtltvb.supabase.co',
            port: 443,
            path: `/rest/v1/oportunidade_sprint?id=eq.${opportunityId}&select=id,update_date,synced_at`,
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Authorization': `Bearer ${SUPABASE_CONFIG.serviceRoleKey}`,
                'apikey': SUPABASE_CONFIG.serviceRoleKey,
                'Accept-Profile': 'api'
            }
        };

        const req = https.request(options, (res) => {
            let responseData = '';
            res.on('data', (chunk) => responseData += chunk);
            res.on('end', () => {
                try {
                    const jsonData = JSON.parse(responseData);
                    resolve(Array.isArray(jsonData) && jsonData.length > 0 ? jsonData[0] : null);
                } catch (error) {
                    reject(error);
                }
            });
        });

        req.on('error', reject);
        req.end();
    });
}

// 📊 VERIFICAÇÃO PRINCIPAL
async function verificarSincronizacao() {
    try {
        console.log('🔍 VERIFICADOR DE SINCRONIZAÇÃO SPRINTHUB ↔ SUPABASE');
        console.log('=' * 60);
        console.log(`📅 ${new Date().toLocaleString('pt-BR', {timeZone: 'America/Sao_Paulo'})}`);
        console.log('');

        let totalSprintHub = 0;
        let totalSupabase = 0;
        let totalAusentes = 0;
        let totalDesatualizadas = 0;
        const idsAusentes = [];
        const idsDesatualizadas = [];

        for (const [funnelId, funnelConfig] of Object.entries(FUNIS_CONFIG)) {
            console.log(`🎯 ${funnelConfig.name}`);
            console.log('-'.repeat(50));

            for (const stage of funnelConfig.stages) {
                try {
                    console.log(`   📂 ${stage.name} (ID: ${stage.id})`);
                    
                    // Buscar TODAS as oportunidades desta etapa
                    const sprintHubOpps = await fetchAllOpportunitiesFromStage(parseInt(funnelId), stage.id);
                    const stageSprintHubCount = sprintHubOpps.length;
                    totalSprintHub += stageSprintHubCount;

                    let stageSupabaseCount = 0;
                    let stageAusentes = 0;
                    let stageDesatualizadas = 0;

                    console.log(`      📊 SprintHub: ${stageSprintHubCount} oportunidades`);

                    // Verificar cada oportunidade no Supabase
                    for (const opp of sprintHubOpps) {
                        try {
                            const supabaseRecord = await checkInSupabase(opp.id);
                            
                            if (!supabaseRecord) {
                                // ❌ AUSENTE NO SUPABASE
                                stageAusentes++;
                                totalAusentes++;
                                idsAusentes.push({
                                    id: opp.id,
                                    title: opp.title,
                                    funil: funnelConfig.name,
                                    etapa: stage.name,
                                    createDate: opp.createDate
                                });
                            } else {
                                // ✅ EXISTE NO SUPABASE
                                stageSupabaseCount++;
                                totalSupabase++;

                                // Verificar se está desatualizada
                                const sprintHubDate = new Date(opp.updateDate);
                                const supabaseDate = new Date(supabaseRecord.update_date);

                                if (sprintHubDate > supabaseDate) {
                                    stageDesatualizadas++;
                                    totalDesatualizadas++;
                                    idsDesatualizadas.push({
                                        id: opp.id,
                                        title: opp.title,
                                        funil: funnelConfig.name,
                                        etapa: stage.name,
                                        sprintHubDate: opp.updateDate,
                                        supabaseDate: supabaseRecord.update_date
                                    });
                                }
                            }

                            // Rate limiting
                            await new Promise(resolve => setTimeout(resolve, 50));

                        } catch (error) {
                            console.log(`      ❌ Erro verificando ID ${opp.id}`);
                        }
                    }

                    // 📊 RELATÓRIO DA ETAPA
                    const percentual = stageSprintHubCount > 0 ? 
                        ((stageSupabaseCount / stageSprintHubCount) * 100).toFixed(1) : 0;

                    console.log(`      ✅ Supabase: ${stageSupabaseCount}/${stageSprintHubCount} (${percentual}%)`);
                    
                    if (stageAusentes > 0) {
                        console.log(`      ❌ Ausentes: ${stageAusentes}`);
                    }
                    
                    if (stageDesatualizadas > 0) {
                        console.log(`      🔄 Desatualizadas: ${stageDesatualizadas}`);
                    }

                    console.log('');

                } catch (error) {
                    console.log(`   ❌ Erro na etapa ${stage.name}: ${error.message}`);
                }
            }

            console.log('');
        }

        // 📊 RELATÓRIO FINAL COMPLETO
        console.log('=' * 60);
        console.log('📊 RELATÓRIO FINAL DE VERIFICAÇÃO');
        console.log('=' * 60);
        console.log(`📈 Total SprintHub: ${totalSprintHub.toLocaleString()} oportunidades`);
        console.log(`✅ Total Supabase: ${totalSupabase.toLocaleString()} oportunidades`);
        console.log(`❌ Total Ausentes: ${totalAusentes.toLocaleString()} oportunidades`);
        console.log(`🔄 Total Desatualizadas: ${totalDesatualizadas.toLocaleString()} oportunidades`);
        
        const percentualGeral = totalSprintHub > 0 ? 
            ((totalSupabase / totalSprintHub) * 100).toFixed(2) : 0;
        console.log(`📊 Taxa de Sincronização: ${percentualGeral}%`);
        console.log('');

        // 📋 DETALHES DOS PROBLEMAS ENCONTRADOS
        if (idsAusentes.length > 0) {
            console.log('❌ OPORTUNIDADES AUSENTES NO SUPABASE:');
            console.log('-'.repeat(50));
            idsAusentes.slice(0, 20).forEach(item => {
                console.log(`   ID: ${item.id} | ${item.title} | ${item.funil} > ${item.etapa}`);
            });
            if (idsAusentes.length > 20) {
                console.log(`   ... e mais ${idsAusentes.length - 20} registros ausentes`);
            }
            console.log('');
        }

        if (idsDesatualizadas.length > 0) {
            console.log('🔄 OPORTUNIDADES DESATUALIZADAS:');
            console.log('-'.repeat(50));
            idsDesatualizadas.slice(0, 10).forEach(item => {
                console.log(`   ID: ${item.id} | ${item.title}`);
                console.log(`      SprintHub: ${item.sprintHubDate}`);
                console.log(`      Supabase:  ${item.supabaseDate}`);
            });
            if (idsDesatualizadas.length > 10) {
                console.log(`   ... e mais ${idsDesatualizadas.length - 10} registros desatualizados`);
            }
            console.log('');
        }

        // 🎯 RECOMENDAÇÕES
        console.log('🎯 RECOMENDAÇÕES:');
        console.log('-'.repeat(30));
        
        if (totalAusentes > 0) {
            console.log(`   ➕ Execute sync-incremental.js para inserir ${totalAusentes} registros ausentes`);
        }
        
        if (totalDesatualizadas > 0) {
            console.log(`   🔄 Execute sync-incremental.js para atualizar ${totalDesatualizadas} registros`);
        }
        
        if (totalAusentes === 0 && totalDesatualizadas === 0) {
            console.log('   🎉 PERFEITO! Todos os dados estão sincronizados!');
        }

        console.log('');
        console.log('✅ Verificação concluída!');

        // 💾 SALVAR RELATÓRIO EM ARQUIVO (OPCIONAL)
        const relatorio = {
            dataVerificacao: new Date().toISOString(),
            totalSprintHub,
            totalSupabase,
            totalAusentes,
            totalDesatualizadas,
            percentualSincronizacao: percentualGeral,
            idsAusentes: idsAusentes.slice(0, 100), // Primeiros 100
            idsDesatualizadas: idsDesatualizadas.slice(0, 50) // Primeiros 50
        };

        console.log('💾 Relatório salvo em: relatorio-verificacao.json');
        require('fs').writeFileSync('relatorio-verificacao.json', JSON.stringify(relatorio, null, 2));

    } catch (error) {
        console.log('❌ ERRO GERAL:', error.message);
    }
}

// 🚀 EXECUTAR VERIFICAÇÃO
console.log('🔍 Iniciando verificação completa...');
verificarSincronizacao();


