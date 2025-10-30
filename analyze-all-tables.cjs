#!/usr/bin/env node

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY,
  { db: { schema: 'api' } }
);

async function analyze() {
  console.log('📊 Análise completa das 3 tabelas\n');

  // 1. oportunidade_sprint - buscar TODAS em lotes
  console.log('Buscando todas as oportunidades...');
  let allOpp = [];
  let offset = 0;
  const limit = 1000;

  while (true) {
    const { data: opp } = await supabase
      .from('oportunidade_sprint')
      .select('lead_id')
      .range(offset, offset + limit - 1);

    if (!opp || opp.length === 0) break;
    allOpp.push(...opp);
    offset += limit;
    console.log(`  Buscados: ${allOpp.length}...`);
  }

  const uniqueLeads = new Set(allOpp.filter(o => o.lead_id).map(o => o.lead_id));

  console.log('\n🔹 oportunidade_sprint:');
  console.log(`   Total oportunidades: ${allOpp.length}`);
  console.log(`   Leads únicos: ${uniqueLeads.size}`);

  // 2. leads
  const { count: leadsTotal } = await supabase
    .from('leads')
    .select('*', { count: 'exact', head: true });

  console.log('\n🔹 leads:');
  console.log(`   Total: ${leadsTotal}`);

  // 3. leads_exportados_sprinthub
  const { count: exportedTotal } = await supabase
    .from('leads_exportados_sprinthub')
    .select('*', { count: 'exact', head: true });

  const { count: withId } = await supabase
    .from('leads_exportados_sprinthub')
    .select('*', { count: 'exact', head: true })
    .not('id_sprinthub', 'is', null);

  console.log('\n🔹 leads_exportados_sprinthub:');
  console.log(`   Total: ${exportedTotal}`);
  console.log(`   Com id_sprinthub: ${withId}`);
  console.log(`   Sem id_sprinthub: ${exportedTotal - withId}`);

  console.log('\n' + '='.repeat(60));
  console.log('💡 CONCLUSÃO:');
  console.log(`   Leads únicos no SprintHub: ~${uniqueLeads.size}`);
  console.log(`   Leads na planilha exportada: ${exportedTotal}`);
  console.log(`   Diferença: ${exportedTotal - uniqueLeads.size}`);
  console.log('\n   ⚠️  A maioria dos leads da planilha NÃO estão');
  console.log('      na base de oportunidades do SprintHub!');
  console.log('='.repeat(60));
}

analyze().catch(console.error);
