const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_SERVICE_ROLE_KEY, {
    db: { schema: 'api' }
});

const SPRINTHUB_CONFIG = {
    baseUrl: process.env.VITE_SPRINTHUB_BASE_URL || 'sprinthub-api-master.sprinthub.app',
    instance: process.env.VITE_SPRINTHUB_INSTANCE || 'oficialmed',
    apiToken: process.env.VITE_SPRINTHUB_API_TOKEN
};

const PAGE_LIMIT = 100;
const DELAY_BETWEEN_PAGES = 2000; // 2 segundos entre páginas

async function fetchLeadsFromSprintHub(page = 0, limit = PAGE_LIMIT) {
    const url = `https://${SPRINTHUB_CONFIG.baseUrl}/leads?i=${SPRINTHUB_CONFIG.instance}&page=${page}&limit=${limit}&apitoken=${SPRINTHUB_CONFIG.apiToken}`;
    console.log(`📄 Processando página ${page + 1}...`);
    
    try {
        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${SPRINTHUB_CONFIG.apiToken}`,
                'apitoken': SPRINTHUB_CONFIG.apiToken
            }
        });

        if (response.status === 401) {
            const errorData = await response.json();
            console.error(`❌ Erro de autenticação: ${errorData.msg}`);
            return null;
        }

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log(`📊 ${data.data.leads.length} leads encontrados na página ${page + 1}`);
        return data.data.leads;
    } catch (error) {
        console.error(`❌ Erro ao buscar leads da página ${page + 1}:`, error.message);
        return null;
    }
}

async function insertLeads(leads) {
    if (leads.length === 0) return { success: 0, errors: 0 };

    try {
        const { data, error } = await supabase
            .from('leads')
            .upsert(leads, { onConflict: 'id', ignoreDuplicates: false })
            .select();

        if (error) {
            console.error(`❌ Erro na inserção:`, error.message);
            return { success: 0, errors: leads.length };
        }
        
        console.log(`✅ ${leads.length} leads inseridos/atualizados`);
        return { success: leads.length, errors: 0 };
    } catch (error) {
        console.error(`❌ Erro inesperado:`, error.message);
        return { success: 0, errors: leads.length };
    }
}

function mapLeadToSupabase(sprintHubLead) {
    return {
        id: sprintHubLead.id,
        firstname: sprintHubLead.firstname || null,
        lastname: sprintHubLead.lastname || null,
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
        synced_at: new Date().toISOString()
    };
}

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

async function syncLeads() {
    console.log('🚀 Iniciando sincronização SIMPLES de leads...');
    let page = 0;
    let totalProcessed = 0;
    let totalInserted = 0;
    let totalErrors = 0;

    while (true) {
        const leadsPage = await fetchLeadsFromSprintHub(page);
        if (!leadsPage || leadsPage.length === 0) {
            console.log('🏁 Nenhuma lead encontrada. Finalizando sincronização.');
            break;
        }

        // Mapear leads diretamente SEM buscar detalhes individuais
        const mappedLeads = leadsPage.map(mapLeadToSupabase);
        
        const result = await insertLeads(mappedLeads);
        
        totalProcessed += leadsPage.length;
        totalInserted += result.success;
        totalErrors += result.errors;

        console.log(`✅ Página ${page + 1}: ${result.success} inseridos, ${result.errors} erros`);
        console.log(`📊 Total: ${totalProcessed} processados, ${totalInserted} inseridos, ${totalErrors} erros`);

        page++;
        await sleep(DELAY_BETWEEN_PAGES);
    }

    console.log('\n🎉 Sincronização concluída!');
    console.log(`Total de leads processados: ${totalProcessed}`);
    console.log(`Total de leads inseridos/atualizados: ${totalInserted}`);
    console.log(`Total de erros: ${totalErrors}`);
}

syncLeads();

