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

const PAGE_LIMIT = 100;
const DELAY_BETWEEN_PAGES = 2000;

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
            console.error(`❌ Erro de autenticação ou Rate Limit: ${errorData.msg}`);
            if (errorData.msg.includes('too many requests')) {
                console.log(`⏳ Rate limit atingido. Aguardando ${DELAY_BETWEEN_PAGES / 1000} segundos...`);
                await sleep(DELAY_BETWEEN_PAGES);
                return fetchLeadsFromSprintHub(page, limit);
            }
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

function mapLeadToSupabase(sprintHubLead) {
    // Mapear campos corretos do SprintHub
    const fullname = sprintHubLead.fullname || '';
    const nameParts = fullname.split(' ');
    const firstname = nameParts[0] || null;
    const lastname = nameParts.slice(1).join(' ') || null;
    
    return {
        id: sprintHubLead.id,
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

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

async function syncLeads() {
    console.log('🚀 Iniciando sincronização FINAL de leads com mapeamento correto...');
    let page = 0;
    let totalProcessed = 0;
    let totalInserted = 0;
    let totalErrors = 0;
    let leadsWithData = 0;

    while (true) {
        const leadsPage = await fetchLeadsFromSprintHub(page);
        if (!leadsPage || leadsPage.length === 0) {
            console.log('🏁 Nenhuma lead encontrada ou erro na API. Finalizando sincronização.');
            break;
        }

        for (const sprintHubLead of leadsPage) {
            totalProcessed++;
            const mappedLead = mapLeadToSupabase(sprintHubLead);
            
            // Contar leads com dados úteis
            if (mappedLead.firstname || mappedLead.email || mappedLead.whatsapp || mappedLead.phone) {
                leadsWithData++;
            }
            
            const result = await insertOrUpdateLead(mappedLead);

            if (result.success) {
                totalInserted++;
            } else {
                totalErrors++;
            }
        }

        console.log(`✅ Página ${page + 1}: ${leadsPage.length} processados`);
        console.log(`📊 Total: ${totalProcessed} processados, ${totalInserted} inseridos, ${totalErrors} erros, ${leadsWithData} com dados`);

        page++;
        await sleep(DELAY_BETWEEN_PAGES);
    }

    console.log('\n🎉 Sincronização de leads concluída!');
    console.log(`Total de leads processados: ${totalProcessed}`);
    console.log(`Total de leads inseridos/atualizados: ${totalInserted}`);
    console.log(`Total de erros: ${totalErrors}`);
    console.log(`Leads com dados úteis: ${leadsWithData}`);
}

(async () => {
    await syncLeads();
    
    // Verificar resultado final
    const { count, error } = await supabase.from('leads').select('*', { count: 'exact' });
    if (error) {
        console.error('Erro ao contar leads na tabela:', error.message);
    } else {
        console.log(`\n📊 Total de leads na tabela: ${count}`);
    }
    
    // Verificar leads com dados válidos
    const { count: validCount, error: validError } = await supabase
        .from('leads')
        .select('*', { count: 'exact' })
        .not('firstname', 'is', null)
        .neq('firstname', '');
    
    if (!validError) {
        console.log(`✅ Leads com firstname: ${validCount}`);
    }
    
    // Verificar leads com WhatsApp
    const { count: whatsappCount, error: whatsappError } = await supabase
        .from('leads')
        .select('*', { count: 'exact' })
        .not('whatsapp', 'is', null)
        .neq('whatsapp', '');
    
    if (!whatsappError) {
        console.log(`📱 Leads com WhatsApp: ${whatsappCount}`);
    }
})();

