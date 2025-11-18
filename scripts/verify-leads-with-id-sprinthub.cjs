const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const SUPABASE_CONFIG = {
    url: process.env.VITE_SUPABASE_URL,
    serviceRoleKey: process.env.VITE_SUPABASE_SERVICE_ROLE_KEY
};

const supabase = createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.serviceRoleKey, {
    db: { schema: 'api' }
});

async function verifyLeadsWithIdSprinthub() {
    console.log('🔍 VERIFICANDO LEADS COM ID_SPRINTHUB...\n');
    
    try {
        // 1. Contar total de leads
        const { count: totalCount, error: totalError } = await supabase
            .from('leads')
            .select('*', { count: 'exact' });
        
        if (totalError) {
            console.error('❌ Erro ao contar leads:', totalError.message);
            return;
        }
        
        console.log(`📊 Total de leads na tabela: ${totalCount}`);
        
        // 2. Contar leads com id_sprinthub preenchido
        const { count: idSprintCount, error: idSprintError } = await supabase
            .from('leads')
            .select('*', { count: 'exact' })
            .not('id_sprinthub', 'is', null);
        
        if (idSprintError) {
            console.error('❌ Erro ao contar leads com id_sprinthub:', idSprintError.message);
            return;
        }
        
        console.log(`🎯 Leads com id_sprinthub preenchido: ${idSprintCount}`);
        
        // 3. Mostrar amostra dos leads com id_sprinthub
        console.log('\n🔍 AMOSTRA DE LEADS COM ID_SPRINTHUB:');
        const { data: sampleLeads, error: sampleError } = await supabase
            .from('leads')
            .select('id, id_sprinthub, firstname, lastname, email, whatsapp, synced_at')
            .not('id_sprinthub', 'is', null)
            .order('synced_at', { ascending: false })
            .limit(10);
        
        if (sampleError) {
            console.error('❌ Erro ao buscar amostra de leads:', sampleError.message);
            return;
        }
        
        if (sampleLeads && sampleLeads.length > 0) {
            console.log(`\n✅ Encontrados ${sampleLeads.length} leads com id_sprinthub:`);
            sampleLeads.forEach((lead, index) => {
                console.log(`${index + 1}. ID: ${lead.id} | ID Sprint: ${lead.id_sprinthub} | Nome: ${lead.firstname} ${lead.lastname} | Email: ${lead.email} | WhatsApp: ${lead.whatsapp} | Sync: ${lead.synced_at}`);
            });
        } else {
            console.log('⚠️  Nenhum lead com id_sprinthub encontrado!');
        }
        
        // 4. Verificar leads recentes (últimos 20)
        console.log('\n🕒 ÚLTIMOS 20 LEADS INSERIDOS:');
        const { data: recentLeads, error: recentError } = await supabase
            .from('leads')
            .select('id, id_sprinthub, firstname, lastname, synced_at')
            .order('synced_at', { ascending: false })
            .limit(20);
        
        if (recentError) {
            console.error('❌ Erro ao buscar leads recentes:', recentError.message);
            return;
        }
        
        if (recentLeads && recentLeads.length > 0) {
            recentLeads.forEach((lead, index) => {
                const hasIdSprint = lead.id_sprinthub ? '✅' : '❌';
                console.log(`${index + 1}. ID: ${lead.id} | ID Sprint: ${lead.id_sprinthub} ${hasIdSprint} | Nome: ${lead.firstname} ${lead.lastname} | Sync: ${lead.synced_at}`);
            });
        }
        
        // 5. Verificar se há leads com IDs específicos que testamos
        console.log('\n🧪 VERIFICANDO LEADS DE TESTE (IDs 2036-2046):');
        const testIds = [2036, 2037, 2038, 2039, 2040, 2041, 2042, 2043, 2044, 2046];
        
        for (const testId of testIds) {
            const { data: testLead, error: testError } = await supabase
                .from('leads')
                .select('id, id_sprinthub, firstname, lastname')
                .eq('id', testId)
                .single();
            
            if (testError) {
                console.log(`❌ Lead ${testId}: Não encontrado`);
            } else {
                const hasIdSprint = testLead.id_sprinthub ? '✅' : '❌';
                console.log(`✅ Lead ${testId}: ID Sprint: ${testLead.id_sprinthub} ${hasIdSprint} | Nome: ${testLead.firstname} ${testLead.lastname}`);
            }
        }
        
    } catch (error) {
        console.error('❌ Erro geral:', error.message);
    }
}

verifyLeadsWithIdSprinthub();

