/**
 * 🕒 DAILY SYNC SERVICE
 * 
 * Serviço para sincronização diária automática
 * Busca todas as oportunidades criadas no dia anterior em TODAS as etapas do funil 6
 * Executa automaticamente a cada dia às 08:00
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

// 📋 TODAS AS ETAPAS DO FUNIL 6 (COMERCIAL APUCARANA)
const FUNIL_6_STAGES = [
    { id: 130, name: "[0] ENTRADA" },
    { id: 231, name: "[1] ACOLHIMENTO/TRIAGEM" },
    { id: 82, name: "[2] QUALIFICADO" },
    { id: 207, name: "[3] ORÇAMENTO REALIZADO" },
    { id: 83, name: "[4] NEGOCIAÇÃO" },
    { id: 85, name: "[5] FOLLOW UP" },
    { id: 232, name: "[6] CADASTRO" }
];

// 📅 UTILITÁRIO DE DATAS
function getYesterdayDate() {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return {
        iso: yesterday.toISOString().split('T')[0], // YYYY-MM-DD
        br: yesterday.toLocaleDateString('pt-BR'), // DD/MM/YYYY
        date: yesterday
    };
}

function isDateMatch(createDate, targetDate) {
    if (!createDate) return false;
    
    try {
        const oppDate = new Date(createDate);
        const oppDateBR = oppDate.toLocaleDateString('pt-BR');
        const oppDateISO = oppDate.toISOString().split('T')[0];
        
        return oppDateBR === targetDate.br || oppDateISO === targetDate.iso;
    } catch (error) {
        return false;
    }
}

// 🔍 BUSCAR OPORTUNIDADES DE UMA ETAPA
async function fetchStageOpportunities(stageId, stageName, targetDate) {
    try {
        console.log(`🔍 Buscando ${stageName} (ID: ${stageId})...`);
        
        const postData = JSON.stringify({ page: 0, limit: 100, columnId: stageId });
        
        const response = await fetch(`https://${SPRINTHUB_CONFIG.baseUrl}/crm/opportunities/6?apitoken=${SPRINTHUB_CONFIG.apiToken}&i=${SPRINTHUB_CONFIG.instance}`, {
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
        const allOpportunities = Array.isArray(data) ? data : [];
        
        // Filtrar por data de criação
        const filteredOpps = allOpportunities.filter(opp => 
            isDateMatch(opp.createDate, targetDate)
        );
        
        console.log(`   📊 Total encontrado: ${allOpportunities.length} | Criadas no dia: ${filteredOpps.length}`);
        
        return filteredOpps;
        
    } catch (error) {
        console.error(`❌ Erro ao buscar ${stageName}:`, error);
        return [];
    }
}

// 💾 MAPEAR CAMPOS DA OPORTUNIDADE
function mapOpportunityFields(opportunity) {
    const fields = opportunity.fields || {};
    const lead = opportunity.dataLead || {};
    const utmTags = (lead.utmTags && lead.utmTags[0]) || {};

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
        
        // Datas importantes
        create_date: opportunity.createDate ? new Date(opportunity.createDate).toISOString() : null,
        update_date: opportunity.updateDate ? new Date(opportunity.updateDate).toISOString() : null,
        lost_date: opportunity.lost_date || null,
        gain_date: opportunity.gain_date || null,
        
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
        funil_id: 6,
        unidade_id: '[1]'
    };
}

// 🔍 VERIFICAR SE EXISTE NO SUPABASE
async function checkInSupabase(opportunityId) {
    try {
        const response = await fetch(`${SUPABASE_CONFIG.url}/rest/v1/oportunidade_sprint?id=eq.${opportunityId}&select=id`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Authorization': `Bearer ${SUPABASE_CONFIG.serviceRoleKey}`,
                'apikey': SUPABASE_CONFIG.serviceRoleKey,
                'Accept-Profile': 'api'
            }
        });

        if (!response.ok) return false;
        
        const data = await response.json();
        return Array.isArray(data) && data.length > 0;
        
    } catch (error) {
        console.error(`❌ Erro ao verificar ID ${opportunityId}:`, error);
        return false;
    }
}

// 💾 INSERIR NO SUPABASE
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

// 📊 EXECUTAR SINCRONIZAÇÃO DIÁRIA
export async function runDailySync(options = {}) {
    const { date = null, dryRun = false } = options;
    
    // Usar data específica ou ontem por padrão
    const targetDate = date || getYesterdayDate();
    
    console.log('🕒 SINCRONIZAÇÃO DIÁRIA INICIADA');
    console.log('='.repeat(60));
    console.log(`📅 Data alvo: ${targetDate.br} (${targetDate.iso})`);
    console.log(`🧪 Modo teste: ${dryRun ? 'SIM' : 'NÃO'}`);
    console.log('='.repeat(60));
    
    const results = {
        targetDate: targetDate.br,
        startTime: new Date(),
        endTime: null,
        totalFound: 0,
        totalInserted: 0,
        totalSkipped: 0,
        totalErrors: 0,
        stages: {},
        errorDetails: []
    };
    
    try {
        // Processar todas as etapas do funil 6
        for (const stage of FUNIL_6_STAGES) {
            try {
                console.log(`\n🔄 Processando ${stage.name}...`);
                
                // Buscar oportunidades da etapa
                const opportunities = await fetchStageOpportunities(stage.id, stage.name, targetDate);
                
                const stageResult = {
                    name: stage.name,
                    found: opportunities.length,
                    inserted: 0,
                    skipped: 0,
                    errors: 0,
                    errorDetails: []
                };
                
                if (opportunities.length === 0) {
                    console.log(`   ✅ Nenhuma oportunidade criada em ${targetDate.br}`);
                } else {
                    console.log(`   📋 Processando ${opportunities.length} oportunidades...`);
                    
                    for (const opp of opportunities) {
                        try {
                            // Verificar se já existe
                            const exists = await checkInSupabase(opp.id);
                            
                            if (exists) {
                                stageResult.skipped++;
                                console.log(`      ⚪ Já existe: ${opp.id} - ${opp.title}`);
                            } else {
                                if (!dryRun) {
                                    // Inserir no Supabase
                                    const mappedData = mapOpportunityFields(opp);
                                    const insertResult = await insertToSupabase(mappedData);
                                    
                                    if (insertResult.success) {
                                        stageResult.inserted++;
                                        console.log(`      ✅ Inserido: ${opp.id} - ${opp.title}`);
                                    } else {
                                        stageResult.errors++;
                                        const errorDetail = {
                                            id: opp.id,
                                            title: opp.title,
                                            stage: stage.name,
                                            error: insertResult.error || `HTTP ${insertResult.status}`
                                        };
                                        stageResult.errorDetails.push(errorDetail);
                                        console.log(`      ❌ Erro: ${opp.id} - ${errorDetail.error}`);
                                    }
                                } else {
                                    stageResult.inserted++;
                                    console.log(`      ✅ [TESTE] Inseriria: ${opp.id} - ${opp.title}`);
                                }
                            }
                            
                            // Rate limiting
                            await new Promise(resolve => setTimeout(resolve, 100));
                            
                        } catch (error) {
                            stageResult.errors++;
                            const errorDetail = {
                                id: opp.id,
                                title: opp.title,
                                stage: stage.name,
                                error: error.message
                            };
                            stageResult.errorDetails.push(errorDetail);
                            console.error(`      ❌ Erro processando ${opp.id}:`, error);
                        }
                    }
                }
                
                results.stages[stage.id] = stageResult;
                results.totalFound += stageResult.found;
                results.totalInserted += stageResult.inserted;
                results.totalSkipped += stageResult.skipped;
                results.totalErrors += stageResult.errors;
                results.errorDetails.push(...stageResult.errorDetails);
                
                console.log(`   📊 ${stage.name}: ${stageResult.found} encontradas | ${stageResult.inserted} inseridas | ${stageResult.skipped} já existiam | ${stageResult.errors} erros`);
                
                // Rate limiting entre etapas
                await new Promise(resolve => setTimeout(resolve, 500));
                
            } catch (error) {
                console.error(`❌ Erro na etapa ${stage.name}:`, error);
                results.stages[stage.id] = {
                    name: stage.name,
                    error: error.message,
                    found: 0,
                    inserted: 0,
                    skipped: 0,
                    errors: 1
                };
                results.totalErrors++;
            }
        }
        
        results.endTime = new Date();
        results.duration = Math.round((results.endTime - results.startTime) / 1000);
        results.success = true;
        
        // Relatório final
        console.log('\n' + '='.repeat(60));
        console.log('📊 RELATÓRIO FINAL - SINCRONIZAÇÃO DIÁRIA');
        console.log('='.repeat(60));
        console.log(`📅 Data processada: ${targetDate.br}`);
        console.log(`⏱️ Duração: ${results.duration}s`);
        console.log(`🔍 Total encontradas: ${results.totalFound}`);
        console.log(`✅ Total inseridas: ${results.totalInserted}`);
        console.log(`⚪ Total já existiam: ${results.totalSkipped}`);
        console.log(`❌ Total erros: ${results.totalErrors}`);
        
        if (results.totalErrors > 0) {
            console.log(`\n❌ DETALHES DOS ERROS:`);
            results.errorDetails.forEach((error, index) => {
                console.log(`   ${index + 1}. [${error.stage}] ${error.id} - ${error.title}: ${error.error}`);
            });
        }
        
        console.log('='.repeat(60));
        
        return results;
        
    } catch (error) {
        console.error('❌ Erro geral na sincronização diária:', error);
        results.success = false;
        results.error = error.message;
        results.endTime = new Date();
        return results;
    }
}

// 🕒 CONFIGURAÇÃO DO AGENDAMENTO AUTOMÁTICO
let dailySyncInterval = null;

export function startDailySync(options = {}) {
    const { hour = 8, minute = 0, runNow = false } = options;
    
    console.log(`🕒 Configurando sincronização diária para ${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`);
    
    // Parar sincronização anterior se existir
    if (dailySyncInterval) {
        clearInterval(dailySyncInterval);
        dailySyncInterval = null;
    }
    
    // Função para calcular próxima execução
    function getNextRunTime() {
        const now = new Date();
        const nextRun = new Date();
        nextRun.setHours(hour, minute, 0, 0);
        
        // Se já passou da hora hoje, agendar para amanhã
        if (nextRun <= now) {
            nextRun.setDate(nextRun.getDate() + 1);
        }
        
        return nextRun;
    }
    
    // Função para executar sincronização
    async function executeDailySync() {
        try {
            console.log('\n🚀 EXECUTANDO SINCRONIZAÇÃO DIÁRIA AUTOMÁTICA');
            const result = await runDailySync();
            
            if (result.success) {
                console.log(`✅ Sincronização concluída: ${result.totalInserted} inseridas, ${result.totalErrors} erros`);
            } else {
                console.error('❌ Sincronização falhou:', result.error);
            }
            
            return result;
            
        } catch (error) {
            console.error('❌ Erro na execução automática:', error);
            return { success: false, error: error.message };
        }
    }
    
    if (runNow) {
        // Executar imediatamente E configurar agendamento
        console.log('🚀 Executando sincronização AGORA...');
        
        // Executar imediatamente (assíncrono)
        executeDailySync().then(result => {
            console.log('✅ Primeira execução concluída:', result.success ? 'Sucesso' : 'Erro');
        });
        
        // Configurar próxima execução para amanhã no horário especificado
        const nextRun = getNextRunTime();
        const msUntilNextRun = nextRun.getTime() - Date.now();
        
        console.log(`⏰ Próxima sincronização automática: ${nextRun.toLocaleString('pt-BR')}`);
        
        setTimeout(() => {
            // Executar no horário agendado
            executeDailySync();
            
            // Depois executar a cada 24 horas
            dailySyncInterval = setInterval(executeDailySync, 24 * 60 * 60 * 1000);
            
        }, msUntilNextRun);
        
        return {
            nextRun: nextRun.toISOString(),
            status: 'running_now_and_scheduled',
            message: 'Executando agora e agendada para repetir diariamente'
        };
    } else {
        // Apenas agendar para o horário especificado
        const nextRun = getNextRunTime();
        const msUntilNextRun = nextRun.getTime() - Date.now();
        
        console.log(`⏰ Próxima sincronização em: ${nextRun.toLocaleString('pt-BR')}`);
        
        setTimeout(() => {
            // Executar primeira vez
            executeDailySync();
            
            // Depois executar a cada 24 horas
            dailySyncInterval = setInterval(executeDailySync, 24 * 60 * 60 * 1000);
            
        }, msUntilNextRun);
        
        return {
            nextRun: nextRun.toISOString(),
            status: 'scheduled'
        };
    }
}

export function stopDailySync() {
    if (dailySyncInterval) {
        clearInterval(dailySyncInterval);
        dailySyncInterval = null;
        console.log('🛑 Sincronização diária parada');
        return { status: 'stopped' };
    } else {
        console.log('⚪ Nenhuma sincronização ativa para parar');
        return { status: 'not_running' };
    }
}

export function getDailySyncStatus() {
    return {
        isRunning: dailySyncInterval !== null,
        message: dailySyncInterval ? 'Sincronização diária ativa' : 'Sincronização diária parada'
    };
}

// 🧪 FUNÇÃO DE TESTE
export async function testDailySync(specificDate = null) {
    console.log('🧪 TESTANDO SINCRONIZAÇÃO DIÁRIA (DRY RUN)');
    
    const testDate = specificDate ? {
        iso: specificDate,
        br: new Date(specificDate).toLocaleDateString('pt-BR'),
        date: new Date(specificDate)
    } : getYesterdayDate();
    
    return await runDailySync({ 
        date: testDate, 
        dryRun: true 
    });
}

export default {
    runDailySync,
    startDailySync,
    stopDailySync,
    getDailySyncStatus,
    testDailySync
};