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

async function fixLeadsData() {
    console.log('🔧 Iniciando correção completa dos dados de leads...\n');
    
    try {
        // 1. Verificar dados do SprintHub primeiro
        console.log('🔍 Verificando dados reais do SprintHub...');
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
        console.log(`📊 SprintHub retornou ${data.data.leads.length} leads`);
        
        // Analisar estrutura dos dados
        if (data.data.leads.length > 0) {
            const sampleLead = data.data.leads[0];
            console.log('\n🔍 Estrutura dos dados do SprintHub:');
            console.log(JSON.stringify(sampleLead, null, 2));
            
            // Verificar se realmente tem dados úteis
            const hasUsefulData = sampleLead.fullname || sampleLead.email || sampleLead.phone || sampleLead.whatsapp;
            if (!hasUsefulData) {
                console.log('⚠️  ATENÇÃO: Os dados do SprintHub parecem estar vazios!');
                console.log('   Isso pode indicar que:');
                console.log('   1. A API não está retornando dados completos');
                console.log('   2. Os leads no SprintHub realmente não têm informações');
                console.log('   3. Há um problema de autenticação ou permissão');
            }
        }
        
        // 2. Limpar dados corrompidos
        console.log('\n🧹 Limpando dados corrompidos...');
        
        const { error: updateError } = await supabase
            .from('leads')
            .update({
                firstname: null,
                lastname: null,
                phone: null,
                whatsapp: null,
                mobile: null,
                status: null,
                origem: null,
                categoria: null,
                segmento: null,
                stage: null,
                observacao: null,
                produto: null
            })
            .or('firstname.eq.null,lastname.eq.null,phone.eq.null,whatsapp.eq.null,mobile.eq.null,status.eq.null,origem.eq.null');
        
        if (updateError) {
            console.error('❌ Erro ao limpar dados:', updateError.message);
        } else {
            console.log('✅ Dados corrompidos limpos!');
        }
        
        // 3. Verificar resultado
        console.log('\n📊 Verificando resultado após limpeza...');
        const { count: totalCount, error: countError } = await supabase
            .from('leads')
            .select('*', { count: 'exact' });
        
        if (countError) {
            console.error('❌ Erro ao contar leads:', countError.message);
        } else {
            console.log(`📊 Total de leads: ${totalCount}`);
        }
        
        // 4. Verificar leads com dados válidos
        const { count: validLeads, error: validError } = await supabase
            .from('leads')
            .select('*', { count: 'exact' })
            .not('firstname', 'is', null)
            .neq('firstname', '');
        
        if (validError) {
            console.error('❌ Erro ao contar leads válidos:', validError.message);
        } else {
            console.log(`✅ Leads com firstname válido: ${validLeads}`);
        }
        
        // 5. Verificar leads com email
        const { count: emailLeads, error: emailError } = await supabase
            .from('leads')
            .select('*', { count: 'exact' })
            .not('email', 'is', null)
            .neq('email', '');
        
        if (emailError) {
            console.error('❌ Erro ao contar leads com email:', emailError.message);
        } else {
            console.log(`📧 Leads com email: ${emailLeads}`);
        }
        
        console.log('\n🎯 CONCLUSÃO:');
        if (validLeads === 0 && emailLeads < 1000) {
            console.log('❌ PROBLEMA: Os dados do SprintHub parecem estar vazios ou incompletos');
            console.log('   Recomendação: Verificar se a API do SprintHub está retornando dados corretos');
        } else {
            console.log('✅ Dados corrigidos com sucesso!');
        }
        
    } catch (error) {
        console.error('❌ Erro geral:', error.message);
    }
}

fixLeadsData();

