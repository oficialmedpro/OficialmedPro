/**
 * 🔍 DEBUG SYNC SERVICE
 * 
 * Busca oportunidades específicas perdidas no Follow Up
 * Para investigar por que não estão sendo sincronizadas
 */

const SPRINTHUB_CONFIG = {
    baseUrl: 'sprinthub-api-master.sprinthub.app',
    instance: 'oficialmed',
    apiToken: '9ad36c85-5858-4960-9935-e73c3698dd0c'
};

import { supabaseUrl, supabaseServiceKey } from '../config/supabase.js';

const SUPABASE_CONFIG = {
    url: supabaseUrl,
    serviceRoleKey: supabaseServiceKey
};

// 📱 Números de WhatsApp que estão faltando
const NUMEROS_FALTANDO = [
    '554791853028',
    '555180570501',  
    '554699789739',
    '554391033346',
    '554384118360',
    '554396087910',
    '5511968959293'
];

// 🔍 BUSCAR TODAS AS OPORTUNIDADES DO FOLLOW UP (COM PAGINAÇÃO COMPLETA)
async function fetchAllFollowUpOpportunities() {
    console.log('🔍 Buscando TODAS as oportunidades do Follow Up...');
    
    let allOpportunities = [];
    let page = 0;
    const limit = 50;

    while (true) {
        try {
            const postData = JSON.stringify({ page, limit, columnId: 85 });
            
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
            
            console.log(`📄 Página ${page}: ${opportunities.length} oportunidades`);
            
            if (opportunities.length === 0) break;
            
            allOpportunities = allOpportunities.concat(opportunities);
            
            if (opportunities.length < limit) break;
            
            page++;
            await new Promise(resolve => setTimeout(resolve, 500)); // Rate limiting
            
        } catch (error) {
            console.error(`❌ Erro na página ${page}:`, error);
            break;
        }
    }

    console.log(`📊 Total encontrado: ${allOpportunities.length} oportunidades`);
    return allOpportunities;
}

// 🔍 ENCONTRAR OPORTUNIDADES PELOS NÚMEROS DE WHATSAPP
function findOpportunitiesByWhatsApp(opportunities, whatsappNumbers) {
    const found = [];
    
    for (const opp of opportunities) {
        const lead = opp.dataLead || {};
        const whatsapp = lead.whatsapp;
        
        if (whatsapp && whatsappNumbers.includes(whatsapp)) {
            found.push({
                id: opp.id,
                title: opp.title,
                whatsapp: whatsapp,
                status: opp.status,
                loss_reason: opp.loss_reason,
                createDate: opp.createDate,
                updateDate: opp.updateDate,
                lost_date: opp.lost_date,
                crm_column: opp.crm_column,
                fullData: opp
            });
        }
    }
    
    return found;
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

// 🆕 MAPEAR CAMPOS DA OPORTUNIDADE
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

// 🎯 FUNÇÃO PRINCIPAL DE DEBUG
export async function debugMissingOpportunities() {
    console.log('🔍 INICIANDO DEBUG DAS OPORTUNIDADES FALTANTES');
    console.log('=' .repeat(60));
    
    try {
        // 1. Buscar TODAS as oportunidades do Follow Up
        const allOpportunities = await fetchAllFollowUpOpportunities();
        
        // 2. Encontrar as específicas pelos números de WhatsApp
        const foundOpportunities = findOpportunitiesByWhatsApp(allOpportunities, NUMEROS_FALTANDO);
        
        console.log('📊 RESULTADO DA BUSCA:');
        console.log(`   Total no SprintHub: ${allOpportunities.length}`);
        console.log(`   Números procurados: ${NUMEROS_FALTANDO.length}`);
        console.log(`   Encontrados: ${foundOpportunities.length}`);
        
        // 3. Mostrar detalhes dos encontrados
        if (foundOpportunities.length > 0) {
            console.log('\n📋 OPORTUNIDADES ENCONTRADAS:');
            foundOpportunities.forEach((opp, index) => {
                console.log(`\n${index + 1}. ID: ${opp.id}`);
                console.log(`   Título: ${opp.title}`);
                console.log(`   WhatsApp: ${opp.whatsapp}`);
                console.log(`   Status: ${opp.status}`);
                console.log(`   Loss Reason: ${opp.loss_reason || 'N/A'}`);
                console.log(`   Data Criação: ${opp.createDate}`);
                console.log(`   Data Update: ${opp.updateDate}`);
            });
            
            // 4. Tentar inserir no Supabase
            console.log('\n💾 INSERINDO NO SUPABASE...');
            
            let inserted = 0;
            let errors = 0;
            
            for (const opp of foundOpportunities) {
                try {
                    const mappedData = mapOpportunityFields(opp.fullData);
                    const result = await insertToSupabase(mappedData);
                    
                    if (result.success) {
                        inserted++;
                        console.log(`   ✅ Inserido: ${opp.id} - ${opp.title}`);
                    } else {
                        errors++;
                        console.log(`   ❌ Erro: ${opp.id} - Status: ${result.status}`);
                    }
                    
                    await new Promise(resolve => setTimeout(resolve, 200));
                    
                } catch (error) {
                    errors++;
                    console.log(`   ❌ Erro: ${opp.id} - ${error.message}`);
                }
            }
            
            console.log('\n📊 RESULTADO FINAL:');
            console.log(`   Inseridas: ${inserted}`);
            console.log(`   Erros: ${errors}`);
            
            return {
                success: true,
                total: allOpportunities.length,
                found: foundOpportunities.length,
                inserted,
                errors,
                opportunities: foundOpportunities
            };
            
        } else {
            console.log('\n❌ NENHUMA OPORTUNIDADE ENCONTRADA pelos números de WhatsApp fornecidos');
            
            // Mostrar alguns exemplos do que tem no Follow Up
            console.log('\n📋 EXEMPLOS DO QUE EXISTE NO FOLLOW UP:');
            allOpportunities.slice(0, 5).forEach((opp, index) => {
                const lead = opp.dataLead || {};
                console.log(`${index + 1}. ID: ${opp.id} | WhatsApp: ${lead.whatsapp || 'N/A'} | Status: ${opp.status}`);
            });
            
            return {
                success: false,
                error: 'Oportunidades não encontradas pelos números de WhatsApp',
                total: allOpportunities.length,
                found: 0
            };
        }
        
    } catch (error) {
        console.error('❌ ERRO GERAL:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

// 🔍 BUSCAR POR ID ESPECÍFICO
export async function debugSpecificOpportunity(opportunityId) {
    console.log(`🔍 Buscando oportunidade específica: ${opportunityId}`);
    
    try {
        const allOpportunities = await fetchAllFollowUpOpportunities();
        const found = allOpportunities.find(opp => opp.id == opportunityId);
        
        if (found) {
            console.log('✅ Encontrada:', found);
            return found;
        } else {
            console.log('❌ Não encontrada');
            return null;
        }
    } catch (error) {
        console.error('❌ Erro:', error);
        return null;
    }
}