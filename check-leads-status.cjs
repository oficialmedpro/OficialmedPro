const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL, 
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY, 
  { db: { schema: 'api' } }
);

async function checkLeadsStatus() {
  try {
    console.log('🔍 Verificando status da sincronização de leads...');
    
    const { count, error } = await supabase
      .from('leads')
      .select('*', { count: 'exact' });
    
    if (error) {
      console.error('❌ Erro ao contar leads:', error.message);
      return;
    }
    
    console.log(`📊 Total de leads na tabela: ${count}`);
    
    // Verificar leads mais recentes
    const { data: recentLeads, error: recentError } = await supabase
      .from('leads')
      .select('id, firstname, lastname, synced_at')
      .order('synced_at', { ascending: false })
      .limit(5);
    
    if (recentError) {
      console.error('❌ Erro ao buscar leads recentes:', recentError.message);
      return;
    }
    
    console.log('\n🕒 Últimos 5 leads sincronizados:');
    recentLeads.forEach(lead => {
      console.log(`  - ID: ${lead.id} | Nome: ${lead.firstname} ${lead.lastname} | Sync: ${lead.synced_at}`);
    });
    
    // Estimativa de progresso
    const targetLeads = 70000;
    const progress = ((count / targetLeads) * 100).toFixed(1);
    console.log(`\n🎯 Progresso: ${count}/${targetLeads} (${progress}%)`);
    
    if (count < targetLeads) {
      const remaining = targetLeads - count;
      console.log(`⏳ Faltam aproximadamente ${remaining} leads para completar`);
    } else {
      console.log('🎉 Sincronização completa!');
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

checkLeadsStatus();

