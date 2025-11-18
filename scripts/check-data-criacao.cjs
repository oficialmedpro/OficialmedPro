const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://agdffspstbxeqhqtltvb.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFnZGZmc3BzdGJ4ZXFocXRsdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcxNzUyNTUzNSwiZXhwIjoyMDMzMTAxNTM1fQ.gxoHQn-5MwRqgMgXoFOyGCcFrCH7GzHE4ZQXQPNIRV4';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  db: {
    schema: 'api'
  },
  global: {
    headers: {
      'Accept-Profile': 'api',
      'Content-Profile': 'api'
    }
  }
});

async function checkDataCriacao() {
  console.log('🔍 Verificando campo data_criacao em prime_pedidos...\n');

  // 1. Verificar total de pedidos (sem filtro)
  const { count: totalGeral, error: errorTotal } = await supabase
    .from('prime_pedidos')
    .select('*', { count: 'exact', head: true });

  if (errorTotal) {
    console.error('❌ Erro ao buscar total geral:', errorTotal);
    return;
  }

  console.log(`📊 Total de pedidos na tabela: ${totalGeral || 0}\n`);

  // 2. Verificar pedidos aprovados
  const { count: totalAprovados, error: errorAprovados } = await supabase
    .from('prime_pedidos')
    .select('*', { count: 'exact', head: true })
    .eq('status_aprovacao', 'APROVADO');

  if (errorAprovados) {
    console.error('❌ Erro ao buscar aprovados:', errorAprovados);
  } else {
    console.log(`✅ Pedidos aprovados: ${totalAprovados || 0}`);
  }

  // 3. Verificar pedidos com data_criacao
  const { count: comDataCriacao, error: errorDataCriacao } = await supabase
    .from('prime_pedidos')
    .select('*', { count: 'exact', head: true })
    .not('data_criacao', 'is', null);

  if (errorDataCriacao) {
    console.error('❌ Erro ao buscar com data_criacao:', errorDataCriacao);
  } else {
    console.log(`✅ Pedidos com data_criacao: ${comDataCriacao || 0}`);
    console.log(`📈 Percentual preenchido: ${totalGeral ? ((comDataCriacao / totalGeral) * 100).toFixed(2) : 0}%\n`);
  }

  // 4. Buscar amostra de pedidos com data_criacao
  const { data: sample, error: errorSample } = await supabase
    .from('prime_pedidos')
    .select('id, data_criacao, data_aprovacao, created_at, status_aprovacao')
    .not('data_criacao', 'is', null)
    .limit(10);

  if (errorSample) {
    console.error('❌ Erro ao buscar amostra:', errorSample);
  } else if (sample && sample.length > 0) {
    console.log(`📋 Amostra de ${sample.length} pedidos com data_criacao preenchida:`);
    sample.forEach((p, i) => {
      console.log(`  ${i + 1}. ID: ${p.id} | Status: ${p.status_aprovacao}`);
      console.log(`     data_criacao: ${p.data_criacao}`);
      console.log(`     data_aprovacao: ${p.data_aprovacao}`);
      console.log(`     created_at: ${p.created_at}\n`);
    });
  } else {
    console.log('⚠️  Ainda nenhum pedido com data_criacao preenchida.');
  }

  // 5. Buscar amostra geral para debug
  const { data: sampleGeral, error: errorSampleGeral } = await supabase
    .from('prime_pedidos')
    .select('id, data_criacao, data_aprovacao, created_at, status_aprovacao')
    .limit(5);

  if (errorSampleGeral) {
    console.error('❌ Erro ao buscar amostra geral:', errorSampleGeral);
  } else if (sampleGeral && sampleGeral.length > 0) {
    console.log(`\n📋 Amostra geral de ${sampleGeral.length} pedidos (primeiros da tabela):`);
    sampleGeral.forEach((p, i) => {
      console.log(`  ${i + 1}. ID: ${p.id} | Status: ${p.status_aprovacao}`);
      console.log(`     data_criacao: ${p.data_criacao || 'NULL'}`);
      console.log(`     data_aprovacao: ${p.data_aprovacao || 'NULL'}`);
      console.log(`     created_at: ${p.created_at}\n`);
    });
  }
}

checkDataCriacao().catch(console.error);
