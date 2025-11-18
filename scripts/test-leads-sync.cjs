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

async function testLeadsSync() {
    console.log('🧪 TESTE: Sincronizando apenas 10 leads para verificar dados...\n');
    
    try {
        // 1. Buscar 10 leads do SprintHub
        console.log('🔍 Buscando 10 leads do SprintHub...');
        const url = `https://${SPRINTHUB_CONFIG.baseUrl}/leads?i=${SPRINTHUB_CONFIG.instance}&page=0&limit=10&apitoken=${SPRINTHUB_CONFIG.apiToken}`;
        
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
        const leads = data.data.leads;
        console.log(`📊 Encontrados ${leads.length} leads no SprintHub\n`);

        // 2. Analisar cada lead antes de inserir
        console.log('🔍 ANALISANDO DADOS BRUTOS DO SPRINTHUB:');
        leads.forEach((lead, index) => {
            console.log(`\n--- LEAD ${index + 1} (ID: ${lead.id}) ---`);
            console.log('Dados brutos:', JSON.stringify(lead, null, 2));
            
            // Verificar campos importantes
            console.log('✅ Campos com dados:');
            if (lead.fullname) console.log(`  - fullname: "${lead.fullname}"`);
            if (lead.email) console.log(`  - email: "${lead.email}"`);
            if (lead.phone) console.log(`  - phone: "${lead.phone}"`);
            if (lead.whatsapp) console.log(`  - whatsapp: "${lead.whatsapp}"`);
            if (lead.mobile) console.log(`  - mobile: "${lead.mobile}"`);
            if (lead.company) console.log(`  - company: "${lead.company}"`);
            if (lead.city) console.log(`  - city: "${lead.city}"`);
            if (lead.state) console.log(`  - state: "${lead.state}"`);
        });

        // 3. Mapear e inserir apenas os primeiros 3 leads para teste
        console.log('\n🔄 MAPEANDO E INSERINDO PRIMEIROS 3 LEADS...');
        
        for (let i = 0; i < Math.min(3, leads.length); i++) {
            const sprintHubLead = leads[i];
            console.log(`\n--- PROCESSANDO LEAD ${i + 1} (ID: ${sprintHubLead.id}) ---`);
            
            // Mapear dados corretamente
            const fullname = sprintHubLead.fullname || '';
            const nameParts = fullname.split(' ');
            const firstname = nameParts[0] || null;
            const lastname = nameParts.slice(1).join(' ') || null;
            
            const mappedLead = {
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
            
            console.log('Lead mapeado:', JSON.stringify(mappedLead, null, 2));
            
            // Inserir no Supabase
            const { data: insertData, error: insertError } = await supabase
                .from('leads')
                .upsert(mappedLead, { onConflict: 'id', ignoreDuplicates: false })
                .select();
            
            if (insertError) {
                console.error(`❌ Erro ao inserir lead ${sprintHubLead.id}:`, insertError.message);
            } else {
                console.log(`✅ Lead ${sprintHubLead.id} inserido com sucesso!`);
            }
        }

        // 4. Verificar resultado
        console.log('\n📊 VERIFICANDO RESULTADO...');
        const { count: totalCount, error: countError } = await supabase
            .from('leads')
            .select('*', { count: 'exact' });
        
        if (countError) {
            console.error('❌ Erro ao contar leads:', countError.message);
        } else {
            console.log(`📊 Total de leads na tabela: ${totalCount}`);
        }

        // 5. Verificar leads com dados válidos
        const { data: validLeads, error: validError } = await supabase
            .from('leads')
            .select('id, firstname, lastname, email, phone, whatsapp, mobile')
            .not('firstname', 'is', null)
            .neq('firstname', '')
            .limit(5);
        
        if (validError) {
            console.error('❌ Erro ao buscar leads válidos:', validError.message);
        } else {
            console.log(`\n✅ Leads com dados válidos encontrados: ${validLeads.length}`);
            validLeads.forEach(lead => {
                console.log(`  - ID: ${lead.id} | Nome: "${lead.firstname} ${lead.lastname}" | Email: "${lead.email}" | WhatsApp: "${lead.whatsapp}"`);
            });
        }
        
        console.log('\n🎯 TESTE CONCLUÍDO!');
        
    } catch (error) {
        console.error('❌ Erro no teste:', error.message);
    }
}

testLeadsSync();

