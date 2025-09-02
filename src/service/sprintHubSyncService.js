/**
 * 🔄 SERVIÇO DE SINCRONIZAÇÃO SPRINTHUB ↔ SUPABASE
 * Integrado ao Dashboard para sincronização manual/automática
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

// 📋 CONFIGURAÇÃO DOS FUNIS E ETAPAS
const FUNIS_CONFIG = {
    6: { 
        name: "[1] COMERCIAL APUCARANA", 
        stages: [130, 231, 82, 207, 83, 85, 232] 
    },
    14: { 
        name: "[2] RECOMPRA", 
        stages: [227, 202, 228, 229, 206, 203, 204, 230, 205, 241, 146, 147, 167, 148, 168, 149, 169, 150] 
    }
};

// 🔍 BUSCAR OPORTUNIDADES DE UMA ETAPA ESPECÍFICA DO SPRINTHUB
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

// 🔍 VERIFICAR SE OPORTUNIDADE EXISTE NO SUPABASE
async function checkInSupabase(opportunityId) {
    try {
        const response = await fetch(`${SUPABASE_CONFIG.url}/rest/v1/oportunidade_sprint?id=eq.${opportunityId}&select=id,update_date,lost_date,status`, {
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
        funil_id: getFunilId(opportunity.crm_column),
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

        return { success: response.ok, status: response.status };
        
    } catch (error) {
        console.error('❌ Erro ao inserir:', error);
        return { success: false, error: error.message };
    }
}

// 🔄 ATUALIZAR NO SUPABASE
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

// 🎯 SINCRONIZAR ETAPA ESPECÍFICA (USADO PARA FOLLOW UP)
export async function syncSpecificStage(funnelId, stageId, stageName = 'Etapa') {
    console.log(`🔄 Sincronizando ${stageName} (ID: ${stageId}) do Funil ${funnelId}...`);
    
    let processed = 0, inserted = 0, updated = 0, errors = 0;
    
    try {
        // Buscar oportunidades da etapa
        const opportunities = await fetchOpportunitiesFromStage(funnelId, stageId, 0, 100);
        console.log(`📊 Encontradas ${opportunities.length} oportunidades no SprintHub`);
        
        for (const opportunity of opportunities) {
            try {
                const existing = await checkInSupabase(opportunity.id);
                const mappedData = mapOpportunityFields(opportunity);
                
                if (!existing) {
                    // Inserir nova
                    const result = await insertToSupabase(mappedData);
                    if (result.success) {
                        inserted++;
                        console.log(`   ➕ Inserido: ${opportunity.id} - ${opportunity.title}`);
                    } else {
                        errors++;
                    }
                } else {
                    // Verificar se precisa atualizar
                    const sprintHubDate = new Date(opportunity.updateDate);
                    const supabaseDate = new Date(existing.update_date);
                    
                    if (sprintHubDate > supabaseDate) {
                        const result = await updateInSupabase(opportunity.id, mappedData);
                        if (result.success) {
                            updated++;
                            console.log(`   🔄 Atualizado: ${opportunity.id} - ${opportunity.title}`);
                        } else {
                            errors++;
                        }
                    }
                }
                
                processed++;
                
                // Rate limiting
                await new Promise(resolve => setTimeout(resolve, 100));
                
            } catch (error) {
                errors++;
                console.error(`❌ Erro processando ${opportunity.id}:`, error);
            }
        }
        
        const result = {
            success: true,
            processed,
            inserted,
            updated,
            errors,
            total: opportunities.length
        };
        
        console.log(`✅ ${stageName} sincronizada: ${processed} processadas | ${inserted} inseridas | ${updated} atualizadas | ${errors} erros`);
        return result;
        
    } catch (error) {
        console.error(`❌ Erro geral na sincronização da ${stageName}:`, error);
        return {
            success: false,
            error: error.message,
            processed: 0,
            inserted: 0,
            updated: 0,
            errors: 0
        };
    }
}

// 🎯 SINCRONIZAR FOLLOW UP ESPECÍFICAMENTE (ID 85)
export async function syncFollowUpStage() {
    return await syncSpecificStage(6, 85, 'FOLLOW UP');
}

// 🔍 VERIFICAR SINCRONIZAÇÃO DE UMA ETAPA
export async function checkStageSync(funnelId, stageId, stageName = 'Etapa') {
    try {
        console.log(`🔍 Verificando sincronização da ${stageName}...`);
        
        const sprintHubOpps = await fetchOpportunitiesFromStage(funnelId, stageId, 0, 100);
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
            
            await new Promise(resolve => setTimeout(resolve, 50));
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

// 🎯 VERIFICAR FOLLOW UP
export async function checkFollowUpSync() {
    return await checkStageSync(6, 85, 'FOLLOW UP');
}