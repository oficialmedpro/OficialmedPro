const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const SPRINTHUB_CONFIG = {
    baseUrl: process.env.VITE_SPRINTHUB_BASE_URL || 'sprinthub-api-master.sprinthub.app',
    instance: process.env.VITE_SPRINTHUB_INSTANCE || 'oficialmed',
    apiToken: process.env.VITE_SPRINTHUB_API_TOKEN
};

async function debugSprintHubData() {
    console.log('🔍 Debugando dados do SprintHub...\n');
    
    try {
        // Buscar uma página de leads do SprintHub
        const url = `https://${SPRINTHUB_CONFIG.baseUrl}/leads?i=${SPRINTHUB_CONFIG.instance}&page=0&limit=5&apitoken=${SPRINTHUB_CONFIG.apiToken}`;
        
        console.log('📡 URL da API:', url);
        console.log('🔑 Token:', SPRINTHUB_CONFIG.apiToken ? 'Definido' : 'Não definido');
        
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
        console.log('\n📊 Resposta da API:');
        console.log('Total de leads na resposta:', data.data?.leads?.length || 0);
        
        if (data.data?.leads?.length > 0) {
            console.log('\n🔍 Primeiro lead (dados brutos):');
            const firstLead = data.data.leads[0];
            console.log(JSON.stringify(firstLead, null, 2));
            
            console.log('\n🔍 Mapeamento dos campos:');
            console.log('ID:', firstLead.id);
            console.log('Firstname:', firstLead.firstname, '(tipo:', typeof firstLead.firstname, ')');
            console.log('Lastname:', firstLead.lastname, '(tipo:', typeof firstLead.lastname, ')');
            console.log('Email:', firstLead.email, '(tipo:', typeof firstLead.email, ')');
            console.log('Phone:', firstLead.phone, '(tipo:', typeof firstLead.phone, ')');
            console.log('WhatsApp:', firstLead.whatsapp, '(tipo:', typeof firstLead.whatsapp, ')');
            console.log('Mobile:', firstLead.mobile, '(tipo:', typeof firstLead.mobile, ')');
            console.log('Status:', firstLead.status, '(tipo:', typeof firstLead.status, ')');
            console.log('Origin:', firstLead.origin, '(tipo:', typeof firstLead.origin, ')');
            
            // Testar mapeamento
            const mappedLead = {
                id: firstLead.id,
                firstname: firstLead.firstname || null,
                lastname: firstLead.lastname || null,
                email: firstLead.email || null,
                phone: firstLead.phone || null,
                mobile: firstLead.mobile || null,
                whatsapp: firstLead.whatsapp || null,
                status: firstLead.status || null,
                origem: firstLead.origin || null,
            };
            
            console.log('\n🔍 Lead mapeado:');
            console.log(JSON.stringify(mappedLead, null, 2));
        }
        
    } catch (error) {
        console.error('❌ Erro ao buscar dados do SprintHub:', error.message);
    }
}

debugSprintHubData();

