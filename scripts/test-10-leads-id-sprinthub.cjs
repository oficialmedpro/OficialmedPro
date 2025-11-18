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
async function fetchLeadsFromSprintHub(page = 0, limit = 10) {
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
        id_sprinthub: sprintHubLead.id, // Campo específico para ID do SprintHub
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

// Função principal de teste
async function test10Leads() {
    console.log('🧪 TESTE: Processando 10 leads para verificar id_sprinthub...\n');
    
    try {
        // 1. Buscar 10 leads da API do SprintHub
        console.log('📡 Buscando 10 leads da API do SprintHub...');
        const apiLeads = await fetchLeadsFromSprintHub(0, 10);
        
        if (!apiLeads || apiLeads.length === 0) {
            console.log('❌ Nenhum lead encontrado na API');
            return;
        }
        
        console.log(`✅ Encontrados ${apiLeads.length} leads na API`);
        
        // 2. Mostrar dados brutos dos leads
        console.log('\n🔍 DADOS BRUTOS DOS LEADS DA API:');
        apiLeads.forEach((lead, index) => {
            console.log(`\n--- LEAD ${index + 1} ---`);
            console.log(`ID: ${lead.id}`);
            console.log(`Nome: ${lead.fullname}`);
            console.log(`Email: ${lead.email}`);
            console.log(`Phone: ${lead.phone}`);
            console.log(`WhatsApp: ${lead.whatsapp}`);
            console.log(`Status: ${lead.status}`);
        });
        
        // 3. Mapear e inserir os leads
        console.log('\n🔄 MAPEANDO E INSERINDO LEADS...');
        let successCount = 0;
        let errorCount = 0;
        
        for (let i = 0; i < apiLeads.length; i++) {
            const sprintHubLead = apiLeads[i];
            console.log(`\n--- PROCESSANDO LEAD ${i + 1} (ID: ${sprintHubLead.id}) ---`);
            
            const mappedLead = mapLeadToSupabase(sprintHubLead);
            console.log(`Lead mapeado:`, {
                id: mappedLead.id,
                id_sprinthub: mappedLead.id_sprinthub,
                firstname: mappedLead.firstname,
                lastname: mappedLead.lastname,
                email: mappedLead.email,
                whatsapp: mappedLead.whatsapp
            });
            
            const result = await insertOrUpdateLead(mappedLead);
            
            if (result.success) {
                successCount++;
                console.log(`✅ Lead ${sprintHubLead.id} inserido com sucesso!`);
            } else {
                errorCount++;
                console.log(`❌ Erro ao inserir lead ${sprintHubLead.id}: ${result.error}`);
            }
        }
        
        // 4. Relatório final
        console.log('\n🎉 TESTE CONCLUÍDO!');
        console.log(`📊 Leads processados: ${apiLeads.length}`);
        console.log(`✅ Sucessos: ${successCount}`);
        console.log(`❌ Erros: ${errorCount}`);
        
        // 5. Verificar se os leads foram inseridos com id_sprinthub
        if (successCount > 0) {
            console.log('\n🔍 VERIFICANDO LEADS INSERIDOS...');
            const { data: insertedLeads, error: fetchError } = await supabase
                .from('leads')
                .select('id, id_sprinthub, firstname, lastname, email, whatsapp')
                .not('id_sprinthub', 'is', null)
                .limit(5);
            
            if (fetchError) {
                console.error('❌ Erro ao buscar leads inseridos:', fetchError.message);
            } else if (insertedLeads && insertedLeads.length > 0) {
                console.log('✅ Leads com id_sprinthub encontrados:');
                insertedLeads.forEach((lead, index) => {
                    console.log(`${index + 1}. ID: ${lead.id} | ID Sprint: ${lead.id_sprinthub} | Nome: ${lead.firstname} ${lead.lastname}`);
                });
            } else {
                console.log('⚠️  Nenhum lead com id_sprinthub encontrado');
            }
        }
        
    } catch (error) {
        console.error('❌ Erro geral no teste:', error.message);
    }
}

test10Leads();

