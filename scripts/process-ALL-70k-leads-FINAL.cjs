const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const SPRINTHUB_CONFIG = {
    baseUrl: process.env.VITE_SPRINTHUB_BASE_URL || 'sprinthub-api-master.sprinthub.app',
    instance: process.env.VITE_SPRINTHUB_INSTANCE || 'oficialmed',
    apiToken: process.env.VITE_SPRINTHUB_API_TOKEN
};

const SUPABASE_CONFIG = {
    url: process.env.VITE_SUPABASE_URL,
    serviceRoleKey: process.env.VITE_SUPABASE_SERVICE_ROLE_KEY
};

const supabase = createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.serviceRoleKey, {
    db: { schema: 'api' }
});

// Função auxiliar para dividir nome completo
function splitFullName(fullName) {
    if (!fullName) return { firstname: null, lastname: null };
    const parts = fullName.split(' ');
    const firstname = parts[0] || null;
    const lastname = parts.slice(1).join(' ') || null;
    return { firstname, lastname };
}

// Função para buscar leads da API do SprintHub
async function fetchLeadsFromSprintHub(page = 0, limit = 100) {
    const url = `https://${SPRINTHUB_CONFIG.baseUrl}/leads?i=${SPRINTHUB_CONFIG.instance}&page=${page}&limit=${limit}&apitoken=${SPRINTHUB_CONFIG.apiToken}`;
    
    try {
        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${SPRINTHUB_CONFIG.apiToken}`,
                'apitoken': SPRINTHUB_CONFIG.apiToken
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data.data.leads;
    } catch (error) {
        console.error(`❌ Erro ao buscar leads da página ${page + 1}:`, error.message);
        return null;
    }
}

// Função para inserir/atualizar lead
async function insertOrUpdateLead(leadData) {
    try {
        const { data, error } = await supabase
            .from('leads')
            .upsert(leadData, { onConflict: 'id', ignoreDuplicates: false })
            .select();

        if (error) {
            console.error(`❌ Erro na inserção/atualização do lead ${leadData.id}:`, error.message);
            return { success: false, error: error.message };
        }
        return { success: true, data: data };
    } catch (error) {
        console.error(`❌ Erro inesperado ao inserir/atualizar lead ${leadData.id}:`, error.message);
        return { success: false, error: error.message };
    }
}

// Função para mapear lead do SprintHub para Supabase
function mapLeadToSupabase(sprintHubLead) {
    const { firstname, lastname } = splitFullName(sprintHubLead.fullname);
    return {
        id: sprintHubLead.id,
        id_sprinthub: sprintHubLead.id,
        firstname: firstname,
        lastname: lastname,
        email: sprintHubLead.email || null,
        phone: sprintHubLead.phone || null,
        mobile: sprintHubLead.mobile || null,
        whatsapp: sprintHubLead.whatsapp || null,
        address: sprintHubLead.address || null,
        city: sprintHubLead.city || null,
        state: sprintHubLead.state || null,
        zipcode: sprintHubLead.zipcode || null,
        country: sprintHubLead.country || null,
        company: sprintHubLead.company || null,
        status: sprintHubLead.status || null,
        origem: sprintHubLead.origin || null,
        categoria: sprintHubLead.category || null,
        segmento: sprintHubLead.segment || null,
        stage: sprintHubLead.stage || null,
        observacao: sprintHubLead.observation || null,
        produto: sprintHubLead.product || null,
        create_date: sprintHubLead.createDate ? new Date(sprintHubLead.createDate).toISOString() : null,
        updated_date: sprintHubLead.updateDate ? new Date(sprintHubLead.updateDate).toISOString() : null,
        synced_at: new Date().toISOString(),
    };
}

// Função para fazer match entre leads exportados e API
async function findMatchInApiLeads(exportedLead, apiLeads) {
    const exportedName = exportedLead.nome_completo ? exportedLead.nome_completo.toLowerCase().trim() : '';
    
    // Tentar match exato por nome completo
    let apiLead = apiLeads.find(apiLead => {
        const apiName = apiLead.fullname ? apiLead.fullname.toLowerCase().trim() : '';
        return exportedName === apiName;
    });
    
    if (apiLead) {
        return { match: apiLead, method: 'nome_completo' };
    }
    
    // Tentar match por primeiro nome + último nome
    if (exportedLead.primeiro_nome && exportedLead.ultimo_nome) {
        const exportedFirstLast = `${exportedLead.primeiro_nome.toLowerCase().trim()} ${exportedLead.ultimo_nome.toLowerCase().trim()}`;
        apiLead = apiLeads.find(apiLead => {
            const apiFirstLast = `${apiLead.firstname || ''} ${apiLead.lastname || ''}`.toLowerCase().trim();
            return exportedFirstLast === apiFirstLast;
        });
        
        if (apiLead) {
            return { match: apiLead, method: 'primeiro_ultimo_nome' };
        }
    }
    
    // Tentar match por email
    if (exportedLead.email) {
        apiLead = apiLeads.find(apiLead => 
            apiLead.email && apiLead.email.toLowerCase().trim() === exportedLead.email.toLowerCase().trim()
        );
        
        if (apiLead) {
            return { match: apiLead, method: 'email' };
        }
    }
    
    // Tentar match por telefone/whatsapp
    if (exportedLead.telefone || exportedLead.whatsapp) {
        apiLead = apiLeads.find(apiLead => {
            const exportedPhone = exportedLead.telefone || exportedLead.whatsapp;
            const apiPhone = apiLead.phone || apiLead.whatsapp || apiLead.mobile;
            return exportedPhone && apiPhone && exportedPhone === apiPhone;
        });
        
        if (apiLead) {
            return { match: apiLead, method: 'telefone' };
        }
    }
    
    return { match: null, method: 'nenhum' };
}

// Função principal para processar TODOS os 70 mil leads
async function processAll70kLeads() {
    console.log('🚀 PROCESSANDO TODOS OS 70 MIL LEADS - VERSÃO FINAL!');
    console.log('⏰ Início:', new Date().toLocaleString());
    
    try {
        // 1. Buscar TODOS os leads exportados (SEM LIMITE!)
        console.log('\n🔍 Buscando TODOS os leads exportados...');
        
        let allExportedLeads = [];
        let offset = 0;
        const BATCH_SIZE = 1000;
        
        while (true) {
            const { data: batchLeads, error: batchError } = await supabase
                .from('leads_exportados_sprinthub')
                .select('*')
                .not('primeiro_nome', 'is', null)
                .neq('primeiro_nome', '')
                .range(offset, offset + BATCH_SIZE - 1);
            
            if (batchError) {
                console.error('❌ Erro ao buscar batch de leads:', batchError.message);
                break;
            }
            
            if (!batchLeads || batchLeads.length === 0) {
                break;
            }
            
            allExportedLeads = allExportedLeads.concat(batchLeads);
            console.log(`📦 Batch ${Math.floor(offset / BATCH_SIZE) + 1}: ${batchLeads.length} leads | Total: ${allExportedLeads.length}`);
            
            offset += BATCH_SIZE;
        }
        
        console.log(`\n📊 TOTAL DE LEADS EXPORTADOS ENCONTRADOS: ${allExportedLeads.length}`);
        
        // 2. Buscar MUITO MAIS dados da API do SprintHub
        console.log('\n🔄 Buscando dados da API do SprintHub...');
        
        let apiLeads = [];
        let page = 0;
        const PAGE_LIMIT = 100;
        const MAX_PAGES = 500; // Buscar até 50.000 leads da API
        
        while (page < MAX_PAGES) {
            const leadsPage = await fetchLeadsFromSprintHub(page, PAGE_LIMIT);
            if (!leadsPage || leadsPage.length === 0) {
                console.log(`🏁 Página ${page + 1} vazia. Finalizando busca da API.`);
                break;
            }
            
            apiLeads = apiLeads.concat(leadsPage);
            if (page % 50 === 0) {
                console.log(`📄 Página ${page + 1}: ${leadsPage.length} leads | Total API: ${apiLeads.length}`);
            }
            page++;
            
            await new Promise(resolve => setTimeout(resolve, 200));
        }
        
        console.log(`📊 Total de leads da API: ${apiLeads.length}`);
        
        // 3. Processar TODOS os leads em lotes
        console.log('\n🔗 Processando TODOS os matches...');
        
        const PROCESS_BATCH_SIZE = 500;
        let totalProcessed = 0;
        let totalMatched = 0;
        let totalUpdated = 0;
        let totalErrors = 0;
        const matchMethods = {};
        
        for (let i = 0; i < allExportedLeads.length; i += PROCESS_BATCH_SIZE) {
            const batch = allExportedLeads.slice(i, i + PROCESS_BATCH_SIZE);
            const batchNumber = Math.floor(i / PROCESS_BATCH_SIZE) + 1;
            const totalBatches = Math.ceil(allExportedLeads.length / PROCESS_BATCH_SIZE);
            
            console.log(`\n📦 Processando lote ${batchNumber}/${totalBatches} (${batch.length} leads)`);
            
            for (const exportedLead of batch) {
                totalProcessed++;
                const { match: apiLead, method } = await findMatchInApiLeads(exportedLead, apiLeads);
                
                if (apiLead) {
                    totalMatched++;
                    matchMethods[method] = (matchMethods[method] || 0) + 1;
                    
                    if (totalMatched % 100 === 0) {
                        console.log(`✅ Match ${totalMatched}: ${exportedLead.nome_completo} -> ID ${apiLead.id}`);
                    }
                    
                    const mappedLead = mapLeadToSupabase(apiLead);
                    const result = await insertOrUpdateLead(mappedLead);
                    
                    if (result.success) {
                        totalUpdated++;
                    } else {
                        totalErrors++;
                    }
                }
                
                if (totalProcessed % 1000 === 0) {
                    console.log(`📊 Progresso: ${totalProcessed}/${allExportedLeads.length} | Matches: ${totalMatched} | Atualizados: ${totalUpdated}`);
                }
            }
            
            await new Promise(resolve => setTimeout(resolve, 500));
        }
        
        // 4. Relatório final
        const endTime = new Date();
        const duration = Math.round((endTime - new Date()) / 1000 / 60);
        
        console.log('\n🎉 PROCESSO COMPLETO FINALIZADO!');
        console.log(`⏰ Duração total: ${duration} minutos`);
        console.log(`📊 Leads exportados processados: ${totalProcessed}`);
        console.log(`🔗 Matches encontrados: ${totalMatched}`);
        console.log(`✅ Leads inseridos/atualizados: ${totalUpdated}`);
        console.log(`❌ Erros: ${totalErrors}`);
        
        console.log('\n📈 Métodos de match utilizados:');
        Object.entries(matchMethods).forEach(([method, count]) => {
            console.log(`  - ${method}: ${count} matches`);
        });
        
        // 5. Verificar resultado final
        console.log('\n📊 Verificando resultado final...');
        const { count: totalCount } = await supabase.from('leads').select('*', { count: 'exact' });
        const { count: idSprintCount } = await supabase.from('leads').select('*', { count: 'exact' }).not('id_sprinthub', 'is', null);
        
        console.log(`📊 Total de leads na tabela: ${totalCount}`);
        console.log(`🎯 Leads com id_sprinthub: ${idSprintCount}`);
        
        const percentage = ((idSprintCount / totalCount) * 100).toFixed(1);
        console.log(`📈 Percentual de leads com ID SprintHub: ${percentage}%`);
        
    } catch (error) {
        console.error('❌ Erro geral:', error.message);
    }
}

processAll70kLeads();

