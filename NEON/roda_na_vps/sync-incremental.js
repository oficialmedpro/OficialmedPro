/**
 * 🔄 SINCRONIZAÇÃO INCREMENTAL - TODOS OS 68 CAMPOS
 * Executa a cada 2 horas via cron (6h às 22h)
 * 
 * LOCALIZAÇÃO NO SERVIDOR: /opt/sprinthub-sync/sync-incremental.js
 * CRON: 0 6-22/2 * * * (das 6h às 22h, a cada 2 horas)
 * 
 * 🆕 NOVOS CAMPOS ADICIONADOS:
 * - unidade_id: Identifica a unidade (ex: '[1]' para Apucarana)
 * - funil_id: ID do funil (6 para Compra, 14 para Recompra)
 * - funil_nome: Nome do funil (COMERCIAL APUCARANA, RECOMPRA)
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

const FUNIS_CONFIG = {
    6: { name: "[1] COMERCIAL APUCARANA", stages: [130, 231, 82, 207, 83, 85, 232] },
    14: { name: "[2] RECOMPRA", stages: [227, 202, 228, 229, 206, 203, 204, 230, 205, 241, 146, 147, 167, 148, 168, 149, 169, 150] }
};

// 🆕 FUNÇÃO PARA IDENTIFICAR ID DO FUNIL
function getFunilId(crmColumn) {
    const funilCompra = [130, 231, 82, 207, 83, 85, 232];
    const funilRecompra = [227, 202, 228, 229, 206, 203, 204, 230, 205, 241, 146, 147, 167, 148, 168, 149, 169, 150];
    
    if (funilCompra.includes(crmColumn)) return 6;
    if (funilRecompra.includes(crmColumn)) return 14;
    return null;
}

// 🆕 FUNÇÃO PARA IDENTIFICAR NOME DO FUNIL
function getFunilNome(crmColumn) {
    const funilCompra = [130, 231, 82, 207, 83, 85, 232];
    const funilRecompra = [227, 202, 228, 229, 206, 203, 204, 230, 205, 241, 146, 147, 167, 148, 168, 149, 169, 150];
    
    if (funilCompra.includes(crmColumn)) return '[1] COMERCIAL APUCARANA';
    if (funilRecompra.includes(crmColumn)) return '[1] RECOMPRA';
    return null;
}

function mapAll65Fields(opportunity) {
    const fields = opportunity.fields || {};
    const lead = opportunity.dataLead || {};
    const utmTags = (lead.utmTags && lead.utmTags[0]) || {};

    return {
        // GRUPO 1: CAMPOS PRINCIPAIS (7 campos)
        id: opportunity.id,
        title: opportunity.title,
        value: parseFloat(opportunity.value) || 0.00,
        crm_column: opportunity.crm_column,
        lead_id: opportunity.lead_id,
        sequence: opportunity.sequence || 0,
        status: opportunity.status,

        // GRUPO 2: CAMPOS DE CONTROLE (6 campos)
        loss_reason: opportunity.loss_reason || null,
        gain_reason: opportunity.gain_reason || null,
        expected_close_date: opportunity.expectedCloseDate || null,
        sale_channel: opportunity.sale_channel || null,
        campaign: opportunity.campaign || null,
        user_id: opportunity.user || null,

        // GRUPO 3: CAMPOS DE DATA (7 campos)
        last_column_change: opportunity.last_column_change || null,
        last_status_change: opportunity.last_status_change || null,
        gain_date: opportunity.gain_date || null,
        lost_date: opportunity.lost_date || null,
        reopen_date: opportunity.reopen_date || null,
        create_date: new Date(opportunity.createDate).toISOString(),
        update_date: new Date(opportunity.updateDate).toISOString(),

        // GRUPO 4: CAMPOS CUSTOMIZADOS PRINCIPAIS (5 campos)
        origem_oportunidade: fields["ORIGEM OPORTUNIDADE"] || null,
        tipo_de_compra: fields["Tipo de Compra"] || null,
        qualificacao: fields["QUALIFICACAO"] || null,
        primecadastro: fields["PRIMECADASTRO"] ? parseInt(fields["PRIMECADASTRO"]) : null,
        data_recompra: fields["DATA RECOMPRA"] || null,

        // GRUPO 5: CAMPOS CUSTOMIZADOS ADICIONAIS (18 campos)
        codigo_prime_receita: fields["Codigo Prime Receita"] || null,
        descricao_da_formula: fields["Descricao da Formula"] || null,
        id_api_max: fields["Id ApiMax"] || null,
        id_transacao: fields["Id Transacao"] || null,
        link_pgto: fields["LinkPgto"] || null,
        numero_do_pedido: fields["Numero do pedido"] || null,
        requisicao1: fields["requisicao1"] || null,
        status_getnet: fields["Status Getnet"] || null,
        status_orcamento: fields["Status Orcamento"] || null,
        valorconfere: fields["Valorconfere"] || null,
        forma_pagamento: fields["Forma Pagamento"] || null,
        frete: fields["Frete"] || null,
        local_da_compra: fields["Local da Compra"] || null,
        valorfrete: fields["valorfrete"] || null,
        codigo_id_lead: fields[" Codigo ID Lead"] || null,
        codigo_id_oportunidade: fields[" Codigo ID Oportunidade"] || null,
        id_oportunidade: fields["idoportunidade"] || null,
        req: fields["REQ"] || null,

        // GRUPO 6: CAMPOS UTM (8 campos)
        utm_campaign: utmTags.utmCampaign || null,
        utm_content: utmTags.utmContent || null,
        utm_medium: utmTags.utmMedium || null,
        utm_source: utmTags.utmSource || null,
        utm_term: utmTags.utmTerm || null,
        utm_origin: utmTags.origin || null,
        utm_referer: utmTags.referer || null,
        utm_date_added: utmTags.dateAdded ? new Date(utmTags.dateAdded).toISOString() : null,

        // GRUPO 7: CAMPOS DO LEAD (15 campos)
        lead_firstname: lead.firstname || null,
        lead_lastname: lead.lastname || null,
        lead_cpf: lead.cpf || null,
        lead_city: lead.city || null,
        lead_bairro: lead.bairro || null,
        lead_rua: lead.rua || null,
        lead_numero: lead.numero || null,
        lead_pais: lead.pais || null,
        lead_zipcode: lead.zipcode || null,
        lead_data_nascimento: lead.data_de_nascimento ? new Date(lead.data_de_nascimento).toISOString() : null,
        lead_email: lead.email || null,
        lead_recebedor: lead.recebedor || null,
        lead_whatsapp: lead.whatsapp || null,
        lead_rg: lead.rg || null,
        lead_linkpagamento: lead.linkpagamento || null,

        // GRUPO 8: CAMPOS DE CONTROLE (2 campos)
        archived: opportunity.archived || 0,
        synced_at: new Date().toISOString(),

        // 🆕 NOVOS CAMPOS ADICIONADOS:
        // GRUPO 9: CAMPOS DE UNIDADE E FUNIL (3 campos)
        unidade_id: '[1]', // Unidade Apucarana fixa
        funil_id: opportunity.crm_column ? getFunilId(opportunity.crm_column) : null,
        funil_nome: opportunity.crm_column ? getFunilNome(opportunity.crm_column) : null
    };
}

function fetchOpportunitiesFromStage(funnelId, stageId, page = 0, limit = 50) {
    return new Promise((resolve, reject) => {
        const postData = JSON.stringify({ page, limit, columnId: stageId });
        const options = {
            hostname: SPRINTHUB_CONFIG.baseUrl,
            port: 443,
            path: `/crm/opportunities/${funnelId}?apitoken=${SPRINTHUB_CONFIG.apiToken}&i=${SPRINTHUB_CONFIG.instance}`,
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', 'Content-Length': Buffer.byteLength(postData) }
        };
        const req = https.request(options, (res) => {
            let responseData = '';
            res.on('data', (chunk) => responseData += chunk);
            res.on('end', () => {
                try {
                    const jsonData = JSON.parse(responseData);
                    resolve(Array.isArray(jsonData) ? jsonData : []);
                } catch (error) { reject(error); }
            });
        });
        req.on('error', reject);
        req.write(postData);
        req.end();
    });
}

function checkIfExistsInSupabase(opportunityId) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'agdffspstbxeqhqtltvb.supabase.co',
            port: 443,
            path: `/rest/v1/oportunidade_sprint?id=eq.${opportunityId}&select=id,update_date`,
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
                } catch (error) { reject(error); }
            });
        });
        req.on('error', reject);
        req.end();
    });
}

function insertToSupabase(data) {
    return new Promise((resolve) => {
        const postData = JSON.stringify(data);
        const options = {
            hostname: 'agdffspstbxeqhqtltvb.supabase.co',
            port: 443,
            path: '/rest/v1/oportunidade_sprint',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Authorization': `Bearer ${SUPABASE_CONFIG.serviceRoleKey}`,
                'apikey': SUPABASE_CONFIG.serviceRoleKey,
                'Accept-Profile': 'api',
                'Content-Profile': 'api',
                'Prefer': 'return=representation',
                'Content-Length': Buffer.byteLength(postData)
            }
        };
        const req = https.request(options, (res) => {
            let responseData = '';
            res.on('data', (chunk) => responseData += chunk);
            res.on('end', () => resolve({ success: res.statusCode === 201, status: res.statusCode }));
        });
        req.on('error', () => resolve({ success: false }));
        req.write(postData);
        req.end();
    });
}

function updateInSupabase(opportunityId, data) {
    return new Promise((resolve) => {
        const postData = JSON.stringify(data);
        const options = {
            hostname: 'agdffspstbxeqhqtltvb.supabase.co',
            port: 443,
            path: `/rest/v1/oportunidade_sprint?id=eq.${opportunityId}`,
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Authorization': `Bearer ${SUPABASE_CONFIG.serviceRoleKey}`,
                'apikey': SUPABASE_CONFIG.serviceRoleKey,
                'Accept-Profile': 'api',
                'Content-Profile': 'api',
                'Prefer': 'return=representation',
                'Content-Length': Buffer.byteLength(postData)
            }
        };
        const req = https.request(options, (res) => {
            let responseData = '';
            res.on('data', (chunk) => responseData += chunk);
            res.on('end', () => resolve({ success: res.statusCode === 200, status: res.statusCode }));
        });
        req.on('error', () => resolve({ success: false }));
        req.write(postData);
        req.end();
    });
}

async function syncIncremental() {
    try {
        console.log('🔄 SINCRONIZAÇÃO INCREMENTAL - 65 CAMPOS');
        console.log(`📅 ${new Date().toLocaleString('pt-BR', {timeZone: 'America/Sao_Paulo'})}`);
        
        let totalProcessed = 0, totalInserted = 0, totalUpdated = 0, totalErrors = 0;

        for (const [funnelId, funnelConfig] of Object.entries(FUNIS_CONFIG)) {
            console.log(`🎯 ${funnelConfig.name}`);
            
            for (const stageId of funnelConfig.stages) {
                try {
                    const opportunities = await fetchOpportunitiesFromStage(parseInt(funnelId), stageId, 0, 50);
                    
                    for (const opportunity of opportunities) {
                        try {
                            const existing = await checkIfExistsInSupabase(opportunity.id);
                            const mappedData = mapAll65Fields(opportunity);
                            
                            if (!existing) {
                                const result = await insertToSupabase(mappedData);
                                if (result.success) {
                                    totalInserted++;
                                    console.log(`   ➕ INSERT ID ${opportunity.id}`);
                                } else { totalErrors++; }
                            } else {
                                const sprintHubDate = new Date(opportunity.updateDate);
                                const supabaseDate = new Date(existing.update_date);
                                
                                if (sprintHubDate > supabaseDate) {
                                    const result = await updateInSupabase(opportunity.id, mappedData);
                                    if (result.success) {
                                        totalUpdated++;
                                        console.log(`   🔄 UPDATE ID ${opportunity.id}`);
                                    } else { totalErrors++; }
                                }
                            }
                            
                            totalProcessed++;
                            await new Promise(resolve => setTimeout(resolve, 100));
                            
                        } catch (error) {
                            totalErrors++;
                        }
                    }
                } catch (error) {
                    console.log(`   ❌ Erro etapa ${stageId}`);
                }
            }
        }

        console.log(`📊 ${totalProcessed} processadas | ➕ ${totalInserted} inseridas | 🔄 ${totalUpdated} atualizadas | ❌ ${totalErrors} erros`);
        console.log('✅ Sincronização incremental concluída!');

    } catch (error) {
        console.log('❌ ERRO GERAL:', error.message);
    }
}

syncIncremental();

