/**
 * 🔄 SINCRONIZAÇÃO INCREMENTAL SPRINTHUB ↔ SUPABASE
 * 
 * Sistema de sincronização otimizada para buscar e inserir apenas
 * dados novos ou atualizados, evitando sobrecarga desnecessária
 */

const SPRINTHUB_CONFIG = {
    baseUrl: 'sprinthub-api-master.sprinthub.app',
    instance: 'oficialmed',
    apiToken: '9ad36c85-5858-4960-9935-e73c3698dd0c'
};

import { supabaseUrl, supabaseAnonKey } from '../config/supabase.js';

const SUPABASE_CONFIG = {
    url: supabaseUrl,
    serviceRoleKey: supabaseAnonKey
};

// 📋 CONFIGURAÇÃO COMPLETA DAS ETAPAS DO FUNIL 6
const FUNIL_6_STAGES = [
    { id: 130, name: "[0] ENTRADA" },
    { id: 231, name: "[1] ACOLHIMENTO/TRIAGEM" },
    { id: 82, name: "[2] QUALIFICADO" },
    { id: 207, name: "[3] ORÇAMENTO REALIZADO" },
    { id: 83, name: "[4] NEGOCIAÇÃO" },
    { id: 85, name: "[5] FOLLOW UP" },
    { id: 232, name: "[6] CADASTRO" }
];

// 📅 VERIFICAR SE DATA É HOJE
function isToday(dateString) {
    if (!dateString) return false;
    
    try {
        const today = new Date();
        const todayBR = today.toLocaleDateString('pt-BR'); // DD/MM/YYYY
        
        // Extrair apenas a parte da data (sem hora)
        const datePart = dateString.toString().split(' ')[0];
        
        return datePart === todayBR;
        
    } catch (error) {
        console.error('❌ Erro ao verificar data:', error);
        return false;
    }
}

// 🔍 BUSCAR OPORTUNIDADES DE UMA ETAPA ESPECÍFICA
async function fetchOpportunitiesFromStage(stageId, stageName, page = 0, limit = 50) {
    try {
        console.log(`   🔍 Buscando etapa ${stageName} (${stageId}) - página ${page}...`);
        
        const postData = JSON.stringify({ page, limit, columnId: stageId });
        
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
        const opportunities = Array.isArray(data) ? data : [];
        
        console.log(`   📊 ${stageName}: ${opportunities.length} oportunidades encontradas`);
        
        return opportunities;
        
    } catch (error) {
        console.error(`❌ Erro ao buscar etapa ${stageName}:`, error);
        return [];
    }
}

// 🔍 BUSCAR TODAS AS OPORTUNIDADES DE UMA ETAPA (COM PAGINAÇÃO)
async function fetchAllOpportunitiesFromStage(stageId, stageName) {
    let allOpportunities = [];
    let page = 0;
    const limit = 50;

    console.log(`🔍 Buscando TODAS as oportunidades da etapa ${stageName}...`);

    while (true) {
        try {
            const opportunities = await fetchOpportunitiesFromStage(stageId, stageName, page, limit);
            
            if (opportunities.length === 0) break;
            
            allOpportunities = allOpportunities.concat(opportunities);
            
            // Se retornou menos que o limit, chegou ao fim
            if (opportunities.length < limit) break;
            
            page++;
            
            // Rate limiting para não sobrecarregar a API
            await new Promise(resolve => setTimeout(resolve, 200));
            
        } catch (error) {
            console.error(`❌ Erro na página ${page}:`, error);
            break;
        }
    }

    console.log(`📊 ${stageName}: Total de ${allOpportunities.length} oportunidades`);
    return allOpportunities;
}

// 🆕 MAPEAR CAMPOS DA OPORTUNIDADE PARA O SUPABASE
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
        
        // Datas importantes - converter para ISO
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

        return { 
            success: response.ok, 
            status: response.status,
            statusText: response.statusText
        };
        
    } catch (error) {
        console.error('❌ Erro ao inserir no Supabase:', error);
        return { success: false, error: error.message };
    }
}

// 🔍 VERIFICAR SE OPORTUNIDADE JÁ EXISTE NO SUPABASE
async function checkExistsInSupabase(opportunityId) {
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

// 🎯 FUNÇÃO 1: INSERIR TODAS AS OPORTUNIDADES CRIADAS HOJE DO FUNIL 6
export async function syncTodayOpportunitiesAllStages() {
    console.log('🔄 SINCRONIZAÇÃO: TODAS AS OPORTUNIDADES CRIADAS HOJE - FUNIL 6');
    console.log('='.repeat(80));
    
    const startTime = new Date();
    const today = new Date().toLocaleDateString('pt-BR');
    
    console.log(`📅 Data de hoje: ${today}`);
    console.log(`🎯 Funil: 6 (COMERCIAL APUCARANA)`);
    console.log(`📋 Etapas: ${FUNIL_6_STAGES.length} etapas`);
    
    const results = {
        startTime,
        today,
        totalFound: 0,
        totalToday: 0,
        totalInserted: 0,
        totalSkipped: 0,
        totalErrors: 0,
        stages: {},
        errors: []
    };

    try {
        // Percorrer todas as etapas do funil 6
        for (const stage of FUNIL_6_STAGES) {
            console.log(`\n🔍 PROCESSANDO: ${stage.name} (ID: ${stage.id})`);
            
            const stageResults = {
                stageName: stage.name,
                stageId: stage.id,
                found: 0,
                today: 0,
                inserted: 0,
                skipped: 0,
                errors: 0,
                todayOpportunities: []
            };

            try {
                // Buscar todas as oportunidades desta etapa
                const opportunities = await fetchAllOpportunitiesFromStage(stage.id, stage.name);
                stageResults.found = opportunities.length;
                results.totalFound += opportunities.length;
                
                if (opportunities.length === 0) {
                    console.log(`   ⚪ Nenhuma oportunidade encontrada`);
                    results.stages[stage.id] = stageResults;
                    continue;
                }
                
                // Filtrar apenas as criadas hoje
                const todayOpportunities = opportunities.filter(opp => {
                    const isFromToday = isToday(opp.createDate);
                    if (isFromToday) {
                        console.log(`   📅 HOJE: ${opp.id} - ${opp.title} (${opp.createDate})`);
                    }
                    return isFromToday;
                });
                
                stageResults.today = todayOpportunities.length;
                stageResults.todayOpportunities = todayOpportunities.map(opp => ({
                    id: opp.id,
                    title: opp.title,
                    createDate: opp.createDate
                }));
                results.totalToday += todayOpportunities.length;
                
                console.log(`   📊 Encontradas: ${opportunities.length} | De hoje: ${todayOpportunities.length}`);
                
                if (todayOpportunities.length === 0) {
                    console.log(`   ⚪ Nenhuma oportunidade criada hoje`);
                    results.stages[stage.id] = stageResults;
                    continue;
                }
                
                // Processar cada oportunidade de hoje
                console.log(`   💾 Processando ${todayOpportunities.length} oportunidades...`);
                
                for (const opp of todayOpportunities) {
                    try {
                        // Verificar se já existe no Supabase
                        const exists = await checkExistsInSupabase(opp.id);
                        
                        if (exists) {
                            stageResults.skipped++;
                            results.totalSkipped++;
                            console.log(`   ⚪ JÁ EXISTE: ${opp.id} - ${opp.title}`);
                        } else {
                            // Mapear e inserir
                            const mappedData = mapOpportunityFields(opp);
                            const insertResult = await insertToSupabase(mappedData);
                            
                            if (insertResult.success) {
                                stageResults.inserted++;
                                results.totalInserted++;
                                console.log(`   ✅ INSERIDO: ${opp.id} - ${opp.title}`);
                            } else {
                                stageResults.errors++;
                                results.totalErrors++;
                                const errorMsg = `Erro ${insertResult.status}: ${insertResult.statusText || insertResult.error}`;
                                results.errors.push({
                                    stage: stage.name,
                                    opportunityId: opp.id,
                                    title: opp.title,
                                    error: errorMsg
                                });
                                console.log(`   ❌ ERRO: ${opp.id} - ${errorMsg}`);
                            }
                        }
                        
                        // Rate limiting
                        await new Promise(resolve => setTimeout(resolve, 100));
                        
                    } catch (error) {
                        stageResults.errors++;
                        results.totalErrors++;
                        results.errors.push({
                            stage: stage.name,
                            opportunityId: opp.id,
                            title: opp.title,
                            error: error.message
                        });
                        console.error(`   ❌ ERRO: ${opp.id} - ${error.message}`);
                    }
                }
                
            } catch (error) {
                console.error(`❌ Erro na etapa ${stage.name}:`, error);
                stageResults.errors++;
                results.totalErrors++;
                results.errors.push({
                    stage: stage.name,
                    error: error.message
                });
            }
            
            results.stages[stage.id] = stageResults;
        }
        
        // Finalizar
        results.endTime = new Date();
        results.duration = Math.round((results.endTime - results.startTime) / 1000);
        results.success = true;
        
        // Relatório final
        console.log('\n' + '='.repeat(80));
        console.log('📊 RELATÓRIO FINAL - SINCRONIZAÇÃO DE HOJE');
        console.log('='.repeat(80));
        console.log(`📅 Data: ${today}`);
        console.log(`⏱️  Duração: ${results.duration}s`);
        console.log(`🔍 Total encontrado: ${results.totalFound} oportunidades`);
        console.log(`📅 Criadas hoje: ${results.totalToday} oportunidades`);
        console.log(`✅ Inseridas: ${results.totalInserted}`);
        console.log(`⚪ Já existiam: ${results.totalSkipped}`);
        console.log(`❌ Erros: ${results.totalErrors}`);
        
        // Resumo por etapa
        console.log('\n📋 RESUMO POR ETAPA:');
        FUNIL_6_STAGES.forEach(stage => {
            const stageResult = results.stages[stage.id];
            if (stageResult && stageResult.today > 0) {
                console.log(`   ${stage.name}: ${stageResult.today} hoje | ${stageResult.inserted} inseridas | ${stageResult.skipped} existiam`);
            }
        });
        
        // Mostrar erros se houver
        if (results.errors.length > 0) {
            console.log('\n❌ ERROS DETALHADOS:');
            results.errors.forEach((error, index) => {
                console.log(`   ${index + 1}. ${error.stage} - ${error.opportunityId || 'N/A'}: ${error.error}`);
            });
        }
        
        return results;
        
    } catch (error) {
        console.error('❌ ERRO GERAL:', error);
        results.success = false;
        results.error = error.message;
        results.endTime = new Date();
        results.duration = Math.round((results.endTime - results.startTime) / 1000);
        return results;
    }
}

export default {
    syncTodayOpportunitiesAllStages
};