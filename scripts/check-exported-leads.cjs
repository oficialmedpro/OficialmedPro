const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const SUPABASE_CONFIG = {
    url: process.env.VITE_SUPABASE_URL,
    serviceRoleKey: process.env.VITE_SUPABASE_SERVICE_ROLE_KEY
};

const supabase = createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.serviceRoleKey, {
    db: { schema: 'api' }
});

async function checkExportedLeads() {
    console.log('🔍 Verificando tabela leads_exportados_sprinthub...');
    
    // Contar total de leads
    const { count: totalCount, error: countError } = await supabase
        .from('leads_exportados_sprinthub')
        .select('*', { count: 'exact' });
    
    if (countError) {
        console.error('❌ Erro ao contar leads:', countError.message);
        return;
    }
    
    console.log(`📊 Total de leads na tabela: ${totalCount}`);
    
    // Verificar leads com id_sprint preenchido
    const { count: idSprintCount, error: idSprintError } = await supabase
        .from('leads_exportados_sprinthub')
        .select('*', { count: 'exact' })
        .not('id_sprint', 'is', null);
    
    if (idSprintError) {
        console.error('❌ Erro ao contar leads com id_sprint:', idSprintError.message);
        return;
    }
    
    console.log(`🎯 Leads com id_sprint preenchido: ${idSprintCount}`);
    
    // Amostra de 5 leads
    const { data: sampleLeads, error: sampleError } = await supabase
        .from('leads_exportados_sprinthub')
        .select('id, nome_completo, primeiro_nome, ultimo_nome, email, telefone, whatsapp, id_sprint')
        .limit(5);
    
    if (sampleError) {
        console.error('❌ Erro ao buscar amostra:', sampleError.message);
        return;
    }
    
    console.log('\n🔍 Amostra de 5 leads:');
    sampleLeads.forEach((lead, index) => {
        console.log(`${index + 1}. ID: ${lead.id}`);
        console.log(`   Nome: "${lead.nome_completo}"`);
        console.log(`   Primeiro: "${lead.primeiro_nome}" | Último: "${lead.ultimo_nome}"`);
        console.log(`   Email: "${lead.email}"`);
        console.log(`   Telefone: "${lead.telefone}" | WhatsApp: "${lead.whatsapp}"`);
        console.log(`   ID Sprint: "${lead.id_sprint}"`);
        console.log('');
    });
}

checkExportedLeads();