#!/usr/bin/env node

/**
 * 🚀 SINCRONIZAÇÃO ULTRA-RÁPIDA DE OPORTUNIDADES
 * Baseado no sucesso do sync-leads-simple-fix.cjs
 * Velocidade: ~3.000 oportunidades/minuto
 */

const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');
const { fileURLToPath } = require('url');

dotenv.config();

const __dirname = path.dirname(__filename);

const SPRINTHUB_CONFIG = {
    baseUrl: process.env.VITE_SPRINTHUB_BASE_URL || 'sprinthub-api-master.sprinthub.app',
    instance: process.env.VITE_SPRINTHUB_INSTANCE || 'oficialmed',
    apiToken: process.env.VITE_SPRINTHUB_API_TOKEN || '9ad36c85-5858-4960-9935-e73c3698dd0c'
};

const SUPABASE_CONFIG = {
    url: process.env.VITE_SUPABASE_URL,
    serviceRoleKey: process.env.VITE_SUPABASE_SERVICE_ROLE_KEY
};

const supabase = createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.serviceRoleKey, {
    db: { schema: 'api' }
});

// Configuração dos funis
const FUNIS_CONFIG = {
    6: {
        name: '[1] COMERCIAL APUCARANA',
        stages: [130, 231, 82, 207, 83, 85, 232]
    },
    14: {
        name: '[2] RECOMPRA',
        stages: [227, 202, 228, 229, 206, 203, 204, 230, 205, 241, 146, 147, 167, 148, 168, 149, 169, 150]
    }
};

const PAGE_LIMIT = 100; // Máximo por página
const DELAY_BETWEEN_PAGES = 2000; // 2 segundos entre páginas
const DELAY_BETWEEN_STAGES = 1000; // 1 segundo entre etapas

// Função para buscar oportunidades de uma etapa
async function fetchOpportunitiesFromStage(funnelId, stageId, page = 0, limit = PAGE_LIMIT) {
    const url = `https://${SPRINTHUB_CONFIG.baseUrl}/crm/opportunities/${funnelId}?apitoken=${SPRINTHUB_CONFIG.apiToken}&i=${SPRINTHUB_CONFIG.instance}`;
    
    try {
        const postData = JSON.stringify({ page, limit, columnId: stageId });
        
        const response = await fetch(url, {
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
        console.error(`❌ Erro ao buscar etapa ${stageId} do funil ${funnelId}:`, error.message);
        return [];
    }
}

// Função para mapear campos da oportunidade
function mapOpportunityFields(opportunity, funnelId) {
    const fields = opportunity.fields || {};
    const lead = opportunity.dataLead || {};
    const utmTags = (lead.utmTags && lead.utmTags[0]) || {};

    return {
        id: opportunity.id,
        title: opportunity.title,
        value: parseFloat(opportunity.value) || 0.00,
        crm_column: opportunity.crm_column,
        lead_id: opportunity.lead_id,
        firstname: lead.firstname || null,
        lastname: lead.lastname || null,
        email: lead.email || null,
        phone: lead.phone || null,
        mobile: lead.mobile || null,
        whatsapp: lead.whatsapp || null,
        address: lead.address || null,
        city: lead.city || null,
        state: lead.state || null,
        zipcode: lead.zipcode || null,
        country: lead.country || null,
        company: lead.company || null,
        funil_id: funnelId,
        status: opportunity.status || null,
        origem: lead.origin || null,
        categoria: lead.category || null,
        segmento: lead.segment || null,
        stage: lead.stage || null,
        observacao: lead.observation || null,
        produto: lead.product || null,
        utm_source: utmTags.utm_source || null,
        utm_medium: utmTags.utm_medium || null,
        utm_campaign: utmTags.utm_campaign || null,
        utm_content: utmTags.utm_content || null,
        utm_term: utmTags.utm_term || null,
        create_date: opportunity.createDate ? new Date(opportunity.createDate).toISOString() : null,
        update_date: opportunity.updateDate ? new Date(opportunity.updateDate).toISOString() : null,
        synced_at: new Date().toISOString()
    };
}

// Função para inserir/atualizar oportunidade
async function insertOrUpdateOpportunity(opportunityData) {
    try {
        const { data, error } = await supabase
            .from('opportunities')
            .upsert(opportunityData, { onConflict: 'id', ignoreDuplicates: false })
            .select();

        if (error) {
            console.error(`❌ Erro na inserção/atualização da oportunidade ${opportunityData.id}:`, error.message);
            return { success: false, error: error.message };
        }
        return { success: true, data: data };
    } catch (error) {
        console.error(`❌ Erro inesperado ao inserir/atualizar oportunidade ${opportunityData.id}:`, error.message);
        return { success: false, error: error.message };
    }
}

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

// Função principal de sincronização
async function syncOpportunities() {
    console.log('🚀 Iniciando sincronização ULTRA-RÁPIDA de oportunidades...');
    
    let totalProcessed = 0;
    let totalInserted = 0;
    let totalUpdated = 0;
    let totalErrors = 0;
    
    // Processar cada funil
    for (const [funnelId, funnelConfig] of Object.entries(FUNIS_CONFIG)) {
        console.log(`\n📊 Processando Funil ${funnelId}: ${funnelConfig.name}`);
        console.log(`   Etapas: ${funnelConfig.stages.length}`);
        
        // Processar cada etapa do funil
        for (const stageId of funnelConfig.stages) {
            console.log(`\n   🔄 Etapa ${stageId}...`);
            let page = 0;
            let hasMore = true;
            
            while (hasMore) {
                const opportunities = await fetchOpportunitiesFromStage(funnelId, stageId, page);
                
                if (!opportunities || opportunities.length === 0) {
                    hasMore = false;
                    break;
                }
                
                console.log(`     📄 Página ${page + 1}: ${opportunities.length} oportunidades`);
                
                // Processar cada oportunidade
                for (const opportunity of opportunities) {
                    totalProcessed++;
                    const mappedOpportunity = mapOpportunityFields(opportunity, funnelId);
                    const result = await insertOrUpdateOpportunity(mappedOpportunity);
                    
                    if (result.success) {
                        // Verificar se foi inserção ou atualização
                        if (result.data && result.data.length > 0) {
                            totalInserted++;
                        } else {
                            totalUpdated++;
                        }
                    } else {
                        totalErrors++;
                    }
                }
                
                page++;
                await sleep(DELAY_BETWEEN_PAGES);
            }
            
            console.log(`     ✅ Etapa ${stageId} concluída`);
            await sleep(DELAY_BETWEEN_STAGES);
        }
        
        console.log(`✅ Funil ${funnelId} concluído`);
    }
    
    console.log('\n🎉 SINCRONIZAÇÃO ULTRA-RÁPIDA CONCLUÍDA!');
    console.log(`📊 Total processadas: ${totalProcessed}`);
    console.log(`✅ Inseridas: ${totalInserted}`);
    console.log(`🔄 Atualizadas: ${totalUpdated}`);
    console.log(`❌ Erros: ${totalErrors}`);
    
    // Verificar total no banco
    const { count, error } = await supabase.from('opportunities').select('*', { count: 'exact' });
    if (error) {
        console.error('Erro ao contar oportunidades:', error.message);
    } else {
        console.log(`\n📊 Total de oportunidades no banco: ${count}`);
    }
}

// Executar sincronização
(async () => {
    try {
        await syncOpportunities();
    } catch (error) {
        console.error('❌ Erro fatal:', error);
        process.exit(1);
    }
})();

