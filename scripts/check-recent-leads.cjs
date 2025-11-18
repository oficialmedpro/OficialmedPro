const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL, 
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY, 
  { db: { schema: 'api' } }
);

async function checkRecentLeads() {
  try {
    console.log('🔍 Verificando leads mais recentes...\n');
    
    // Buscar leads mais recentes por ID (maiores IDs = mais recentes)
    const { data: recentLeads, error } = await supabase
      .from('leads')
      .select('id, firstname, lastname, email, phone, whatsapp, mobile, synced_at')
      .order('id', { ascending: false })
      .limit(20);
    
    if (error) {
      console.error('❌ Erro ao buscar leads recentes:', error.message);
      return;
    }
    
    console.log(`📊 Últimos 20 leads (IDs mais altos):`);
    console.log('=' .repeat(80));
    
    let validLeads = 0;
    let leadsWithNames = 0;
    let leadsWithWhatsapp = 0;
    
    recentLeads.forEach((lead, index) => {
      const hasName = lead.firstname && lead.firstname !== 'null' && lead.firstname !== '';
      const hasWhatsapp = lead.whatsapp && lead.whatsapp !== 'null' && lead.whatsapp !== '';
      const hasEmail = lead.email && lead.email !== 'null' && lead.email !== '';
      
      if (hasName || hasWhatsapp || hasEmail) {
        validLeads++;
        if (hasName) leadsWithNames++;
        if (hasWhatsapp) leadsWithWhatsapp++;
      }
      
      console.log(`${index + 1}. ID: ${lead.id}`);
      console.log(`   Nome: "${lead.firstname}" "${lead.lastname}"`);
      console.log(`   Email: "${lead.email}"`);
      console.log(`   Phone: "${lead.phone}"`);
      console.log(`   WhatsApp: "${lead.whatsapp}"`);
      console.log(`   Mobile: "${lead.mobile}"`);
      console.log(`   Sync: ${lead.synced_at}`);
      console.log(`   Status: ${hasName || hasWhatsapp || hasEmail ? '✅ VÁLIDO' : '❌ VAZIO'}`);
      console.log('-'.repeat(60));
    });
    
    console.log(`\n📈 RESUMO DOS ÚLTIMOS 20 LEADS:`);
    console.log(`✅ Leads com dados válidos: ${validLeads}/20 (${(validLeads/20*100).toFixed(1)}%)`);
    console.log(`👤 Leads com nomes: ${leadsWithNames}/20 (${(leadsWithNames/20*100).toFixed(1)}%)`);
    console.log(`📱 Leads com WhatsApp: ${leadsWithWhatsapp}/20 (${(leadsWithWhatsapp/20*100).toFixed(1)}%)`);
    
    // Verificar progresso geral
    const { count: totalCount, error: countError } = await supabase
      .from('leads')
      .select('*', { count: 'exact' });
    
    if (!countError) {
      console.log(`\n📊 TOTAL GERAL: ${totalCount} leads`);
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

checkRecentLeads();

