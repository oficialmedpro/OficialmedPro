const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL, 
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY, 
  { db: { schema: 'api' } }
);

async function debugLeadSearch() {
  try {
    console.log('🔍 DEBUG: Investigando leads com IDs altos...\n');
    
    // 1. Buscar leads com IDs altos
    console.log('📊 Buscando leads com IDs >= 117000...');
    const { data: highIdLeads, error: highIdError } = await supabase
      .from('leads')
      .select('id, firstname, lastname, email, synced_at')
      .gte('id', 117000)
      .order('id', { ascending: false })
      .limit(10);
    
    if (highIdError) {
      console.error('❌ Erro ao buscar leads com IDs altos:', highIdError.message);
      return;
    }
    
    console.log(`📊 Encontrados ${highIdLeads.length} leads com IDs altos:`);
    highIdLeads.forEach(lead => {
      console.log(`  - ID: ${lead.id} | Nome: "${lead.firstname}" "${lead.lastname}" | Email: "${lead.email}" | Sync: ${lead.synced_at}`);
    });
    
    // 2. Buscar leads com strings "null"
    console.log('\n📊 Buscando leads com firstname = "null"...');
    const { data: nullStringLeads, error: nullStringError } = await supabase
      .from('leads')
      .select('id, firstname, lastname, email, synced_at')
      .eq('firstname', 'null')
      .order('id', { ascending: false })
      .limit(10);
    
    if (nullStringError) {
      console.error('❌ Erro ao buscar leads com strings "null":', nullStringError.message);
      return;
    }
    
    console.log(`📊 Encontrados ${nullStringLeads.length} leads com firstname = "null":`);
    nullStringLeads.forEach(lead => {
      console.log(`  - ID: ${lead.id} | Nome: "${lead.firstname}" "${lead.lastname}" | Email: "${lead.email}" | Sync: ${lead.synced_at}`);
    });
    
    // 3. Buscar leads com valores null reais
    console.log('\n📊 Buscando leads com firstname IS NULL...');
    const { data: nullLeads, error: nullError } = await supabase
      .from('leads')
      .select('id, firstname, lastname, email, synced_at')
      .is('firstname', null)
      .order('id', { ascending: false })
      .limit(10);
    
    if (nullError) {
      console.error('❌ Erro ao buscar leads com firstname IS NULL:', nullError.message);
      return;
    }
    
    console.log(`📊 Encontrados ${nullLeads.length} leads com firstname IS NULL:`);
    nullLeads.forEach(lead => {
      console.log(`  - ID: ${lead.id} | Nome: "${lead.firstname}" "${lead.lastname}" | Email: "${lead.email}" | Sync: ${lead.synced_at}`);
    });
    
    // 4. Contar total de cada tipo
    console.log('\n📈 CONTAGEM GERAL:');
    
    const { count: totalCount, error: totalError } = await supabase
      .from('leads')
      .select('*', { count: 'exact' });
    
    const { count: nullStringCount, error: nullStringCountError } = await supabase
      .from('leads')
      .select('*', { count: 'exact' })
      .eq('firstname', 'null');
    
    const { count: nullCount, error: nullCountError } = await supabase
      .from('leads')
      .select('*', { count: 'exact' })
      .is('firstname', null);
    
    const { count: validCount, error: validCountError } = await supabase
      .from('leads')
      .select('*', { count: 'exact' })
      .not('firstname', 'is', null)
      .neq('firstname', '');
    
    if (!totalError) console.log(`📊 Total de leads: ${totalCount}`);
    if (!nullStringCountError) console.log(`❌ Leads com firstname = "null": ${nullStringCount}`);
    if (!nullCountError) console.log(`🔍 Leads com firstname IS NULL: ${nullCount}`);
    if (!validCountError) console.log(`✅ Leads com firstname válido: ${validCount}`);
    
  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

debugLeadSearch();

