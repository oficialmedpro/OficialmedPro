/**
 * 🔄 SCRIPT DE SINCRONIZAÇÃO DE LEADS BASEADO NO SPRINTHUB SYNC SERVICE
 * 
 * Baseado no sprintHubSyncService.js que está funcionando no TopMenuBar
 * Usa a mesma configuração e método de requisição
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Configuração baseada no sprintHubSyncService.js
const SPRINTHUB_CONFIG = {
    baseUrl: 'sprinthub-api-master.sprinthub.app',
    instance: 'oficialmed',
    apiToken: '9ad36c85-5858-4960-9935-e73c3698dd0c'
};

const SUPABASE_CONFIG = {
    url: process.env.VITE_SUPABASE_URL,
    serviceRoleKey: process.env.VITE_SUPABASE_SERVICE_ROLE_KEY
};

// Inicializar Supabase
const supabase = createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.serviceRoleKey, {
    db: { schema: 'api' }
});

// Função para log
function log(message) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${message}`);
}

// Função para buscar leads do SprintHub (baseada no método que funciona)
async function fetchLeadsFromSprintHub(page = 0, limit = 50) {
    try {
        const url = `https://${SPRINTHUB_CONFIG.baseUrl}/leads?i=${SPRINTHUB_CONFIG.instance}&page=${page}&limit=${limit}&apitoken=${SPRINTHUB_CONFIG.apiToken}`;
        
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Authorization': `Bearer ${SPRINTHUB_CONFIG.apiToken}`,
                'apitoken': SPRINTHUB_CONFIG.apiToken
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        return data;
        
    } catch (error) {
        log(`❌ Erro ao buscar leads página ${page}: ${error.message}`);
        return null;
    }
}

// Função para buscar detalhes de um lead específico
async function fetchLeadDetails(leadId) {
    try {
        const url = `https://${SPRINTHUB_CONFIG.baseUrl}/leads/${leadId}?i=${SPRINTHUB_CONFIG.instance}&apitoken=${SPRINTHUB_CONFIG.apiToken}`;
        
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Authorization': `Bearer ${SPRINTHUB_CONFIG.apiToken}`,
                'apitoken': SPRINTHUB_CONFIG.apiToken
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        return data;
        
    } catch (error) {
        log(`❌ Erro ao buscar detalhes do lead ${leadId}: ${error.message}`);
        return null;
    }
}

// Função para mapear campos do lead (baseada no sprintHubSyncService)
function mapLeadFields(lead) {
    return {
        id: lead.id,
        nome_completo: lead.nome_completo || lead.name || '',
        email: lead.email || '',
        telefone: lead.telefone || lead.phone || '',
        whatsapp: lead.whatsapp || '',
        endereco_logradouro: lead.endereco_logradouro || lead.address || '',
        endereco_numero: lead.endereco_numero || lead.number || '',
        endereco_complemento: lead.endereco_complemento || lead.complement || '',
        endereco_bairro: lead.endereco_bairro || lead.neighborhood || '',
        endereco_cidade: lead.endereco_cidade || lead.city || '',
        endereco_estado: lead.endereco_estado || lead.state || '',
        endereco_cep: lead.endereco_cep || lead.zipcode || '',
        endereco_pais: lead.endereco_pais || lead.country || 'Brasil',
        status: lead.status || 'Novo',
        origem: lead.origem || lead.source || '',
        fonte: lead.fonte || lead.source || '',
        campanha: lead.campanha || lead.campaign || '',
        segmento: lead.segmento || lead.segment || '',
        categoria: lead.categoria || lead.category || '',
        ultimo_contato: lead.ultimo_contato || lead.last_contact || null,
        proximo_contato: lead.proximo_contato || lead.next_contact || null,
        observacoes: lead.observacoes || lead.notes || '',
        notas: lead.notas || lead.notes || '',
        tags: lead.tags || [],
        valor_interesse: lead.valor_interesse || lead.value || null,
        produto_interesse: lead.produto_interesse || lead.product || '',
        probabilidade_venda: lead.probabilidade_venda || lead.probability || null,
        etapa_venda: lead.etapa_venda || lead.stage || '',
        ip_usuario: lead.ip_usuario || lead.ip || '',
        user_agent: lead.user_agent || lead.user_agent || '',
        dispositivo: lead.dispositivo || lead.device || '',
        navegador: lead.navegador || lead.browser || '',
        sistema_operacional: lead.sistema_operacional || lead.os || '',
        data_cadastro: lead.data_cadastro || lead.created_at || new Date().toISOString(),
        data_ultima_atualizacao: lead.data_ultima_atualizacao || lead.updated_at || new Date().toISOString(),
        synced_at: new Date().toISOString()
    };
}

// Função para inserir leads no Supabase
async function insertLeadsToSupabase(leads) {
    if (leads.length === 0) return { success: 0, errors: 0 };

    try {
        const { data, error } = await supabase
            .from('leads')
            .upsert(leads, { 
                onConflict: 'id',
                ignoreDuplicates: false 
            });

        if (error) {
            log(`❌ Erro na inserção: ${error.message}`);
            return { success: 0, errors: leads.length };
        }

        return { success: leads.length, errors: 0 };
    } catch (err) {
        log(`❌ Erro na inserção: ${err.message}`);
        return { success: 0, errors: leads.length };
    }
}

// Função principal de sincronização
async function syncLeadsBasedOnWorkingService() {
    log('🚀 Iniciando sincronização de leads baseada no serviço que funciona...');
    
    let currentPage = 0;
    let totalProcessed = 0;
    let totalInserted = 0;
    let totalErrors = 0;
    let hasMorePages = true;
    const limit = 50; // Usar limite menor para evitar rate limiting

    while (hasMorePages) {
        try {
            log(`📄 Processando página ${currentPage + 1}...`);
            
            // Buscar página de leads usando o método que funciona
            const response = await fetchLeadsFromSprintHub(currentPage, limit);
            
            if (!response || !response.data || !response.data.leads) {
                log('❌ Resposta inválida da API');
                break;
            }

            const leads = response.data.leads;
            log(`📊 ${leads.length} leads encontrados na página ${currentPage + 1}`);

            if (leads.length === 0) {
                log('✅ Não há mais leads para processar');
                hasMorePages = false;
                break;
            }

            // Processar cada lead individualmente para evitar rate limiting
            const leadsToInsert = [];
            
            for (let i = 0; i < leads.length; i++) {
                const lead = leads[i];
                
                // Buscar detalhes completos do lead
                const leadDetails = await fetchLeadDetails(lead.id);
                
                if (leadDetails && leadDetails.data) {
                    const mappedLead = mapLeadFields(leadDetails.data);
                    leadsToInsert.push(mappedLead);
                } else {
                    // Se não conseguir buscar detalhes, usar dados básicos
                    const mappedLead = mapLeadFields(lead);
                    leadsToInsert.push(mappedLead);
                }
                
                // Delay entre requisições para evitar rate limiting
                if (i < leads.length - 1) {
                    await new Promise(resolve => setTimeout(resolve, 1000)); // 1 segundo
                }
            }

            // Inserir leads no Supabase
            const { success, errors } = await insertLeadsToSupabase(leadsToInsert);
            totalProcessed += leads.length;
            totalInserted += success;
            totalErrors += errors;
            
            log(`✅ Página ${currentPage + 1}: ${success} inseridos, ${errors} erros`);
            log(`📊 Total: ${totalProcessed} processados, ${totalInserted} inseridos, ${totalErrors} erros`);

            // Verificar se há mais páginas
            hasMorePages = leads.length === limit;
            currentPage++;

            // Delay entre páginas
            if (hasMorePages) {
                log(`⏳ Aguardando 5 segundos antes da próxima página...`);
                await new Promise(resolve => setTimeout(resolve, 5000));
            }

        } catch (error) {
            log(`❌ Erro na página ${currentPage + 1}: ${error.message}`);
            totalErrors++;
            
            // Aguardar antes de tentar novamente
            await new Promise(resolve => setTimeout(resolve, 10000));
        }
    }

    log('🎉 Sincronização concluída!');
    log(`📊 RESUMO FINAL:`);
    log(`  📄 Total processados: ${totalProcessed}`);
    log(`  ✅ Total inseridos: ${totalInserted}`);
    log(`  ❌ Total erros: ${totalErrors}`);
}

// Executar sincronização
syncLeadsBasedOnWorkingService().catch(error => {
    log(`💥 Erro fatal: ${error.message}`);
    process.exit(1);
});