/**
 * 🔄 SCRIPT DE SINCRONIZAÇÃO DE LEADS CORRIGIDO
 * 
 * Usa apenas os campos que existem na tabela api.leads
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

// Função para buscar leads do SprintHub
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

// Função para mapear campos do lead (usando apenas campos que existem na tabela)
function mapLeadFields(lead) {
    return {
        id: lead.id,
        firstname: lead.firstname || lead.nome_completo || lead.name || '',
        lastname: lead.lastname || '',
        email: lead.email || '',
        phone: lead.phone || lead.telefone || '',
        mobile: lead.mobile || lead.telefone || lead.whatsapp || '',
        whatsapp: lead.whatsapp || '',
        address: lead.address || lead.endereco_logradouro || '',
        city: lead.city || lead.endereco_cidade || '',
        state: lead.state || lead.endereco_estado || '',
        zipcode: lead.zipcode || lead.endereco_cep || '',
        country: lead.country || lead.endereco_pais || 'Brasil',
        company: lead.company || lead.empresa || '',
        status: lead.status || 'Novo',
        origem: lead.origem || lead.source || '',
        categoria: lead.categoria || lead.category || '',
        segmento: lead.segmento || lead.segment || null,
        stage: lead.stage || lead.etapa_venda || '',
        observacao: lead.observacao || lead.observacoes || lead.notes || '',
        produto: lead.produto || lead.produto_interesse || '',
        create_date: lead.create_date || lead.data_cadastro || lead.created_at || new Date().toISOString(),
        updated_date: lead.updated_date || lead.data_ultima_atualizacao || lead.updated_at || new Date().toISOString(),
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
async function syncLeadsCorrected() {
    log('🚀 Iniciando sincronização de leads corrigida...');
    
    let currentPage = 0;
    let totalProcessed = 0;
    let totalInserted = 0;
    let totalErrors = 0;
    let hasMorePages = true;
    const limit = 50;

    while (hasMorePages) {
        try {
            log(`📄 Processando página ${currentPage + 1}...`);
            
            // Buscar página de leads
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

            // Processar cada lead individualmente
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
syncLeadsCorrected().catch(error => {
    log(`💥 Erro fatal: ${error.message}`);
    process.exit(1);
});

