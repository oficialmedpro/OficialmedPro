const supabaseUrl = 'https://agdffspstbxeqhqtltvb.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFnZGZmc3BzdGJ4ZXFocXRsdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDQ1MzY2NiwiZXhwIjoyMDY2MDI5NjY2fQ.grInwGHFAH2WYvYerwfHkUsM08wXCJASg4CPMD2cTaA';

const headers = {
  'Accept': 'application/json',
  'Authorization': `Bearer ${supabaseServiceKey}`,
  'apikey': supabaseServiceKey,
  'Accept-Profile': 'api',
  'Content-Profile': 'api'
};

async function debug() {
  console.log('🔍 DEBUGANDO JOIN entre clientes_mestre e prime_pedidos\n');

  // 1. Amostra de cliente_id dos pedidos
  console.log('1️⃣  Amostra de cliente_id em prime_pedidos:');
  console.log('-'.repeat(60));
  const resp1 = await fetch(`${supabaseUrl}/rest/v1/prime_pedidos?select=id,cliente_id&status_aprovacao=eq.APROVADO&data_criacao=not.is.null&limit=10`, { headers });
  const pedidos = await resp1.json();

  pedidos.forEach(p => {
    console.log(`  Pedido ${p.id}: cliente_id = ${p.cliente_id}`);
  });
  console.log('');

  // 2. Amostra de id_prime em clientes_mestre
  console.log('2️⃣  Amostra de id_prime em clientes_mestre:');
  console.log('-'.repeat(60));
  const resp2 = await fetch(`${supabaseUrl}/rest/v1/clientes_mestre?select=id,nome_completo,id_prime&id_prime=not.is.null&limit=10`, { headers });
  const clientes = await resp2.json();

  clientes.forEach(c => {
    console.log(`  Cliente ${c.id}: ${c.nome_completo} - id_prime = ${c.id_prime}`);
  });
  console.log('');

  // 3. Verificar se algum cliente_id dos pedidos existe em clientes_mestre
  const clienteIds = pedidos.map(p => p.cliente_id).filter(id => id);

  if (clienteIds.length > 0) {
    console.log('3️⃣  Verificando se cliente_id dos pedidos existe em clientes_mestre:');
    console.log('-'.repeat(60));

    const resp3 = await fetch(`${supabaseUrl}/rest/v1/clientes_mestre?select=id,nome_completo,id_prime&id_prime=in.(${clienteIds.join(',')})`, { headers });
    const match = await resp3.json();

    console.log(`  ${match.length} de ${clienteIds.length} cliente_ids encontrados em clientes_mestre`);

    if (match.length > 0) {
      match.forEach(c => {
        console.log(`  ✅ Match: cliente_id ${c.id_prime} = ${c.nome_completo}`);
      });
    } else {
      console.log('  ❌ Nenhum match encontrado!');
      console.log('');
      console.log('4️⃣  Possível problema: cliente_id nos pedidos não bate com id_prime');
      console.log('-'.repeat(60));
      console.log('  Exemplos de cliente_id nos pedidos:', clienteIds.slice(0, 5));
      console.log('  Exemplos de id_prime em clientes:', clientes.map(c => c.id_prime).slice(0, 5));
    }
  }

  console.log('');

  // 4. Estatísticas gerais
  console.log('5️⃣  ESTATÍSTICAS GERAIS:');
  console.log('-'.repeat(60));

  const resp4 = await fetch(`${supabaseUrl}/rest/v1/clientes_mestre?select=id&id_prime=not.is.null`, {
    method: 'HEAD',
    headers: { ...headers, 'Prefer': 'count=exact' }
  });
  const range4 = resp4.headers.get('content-range');
  const totalClientes = range4 ? parseInt(range4.split('/')[1]) : 0;

  const resp5 = await fetch(`${supabaseUrl}/rest/v1/prime_pedidos?select=id&status_aprovacao=eq.APROVADO&data_criacao=not.is.null`, {
    method: 'HEAD',
    headers: { ...headers, 'Prefer': 'count=exact' }
  });
  const range5 = resp5.headers.get('content-range');
  const totalPedidos = range5 ? parseInt(range5.split('/')[1]) : 0;

  console.log(`  Clientes com id_prime: ${totalClientes.toLocaleString()}`);
  console.log(`  Pedidos com data_criacao: ${totalPedidos.toLocaleString()}`);
  console.log('');

  // 6. Buscar cliente_ids únicos nos pedidos
  console.log('6️⃣  VERIFICANDO CLIENTE_IDS ÚNICOS NOS PEDIDOS:');
  console.log('-'.repeat(60));

  const resp6 = await fetch(`${supabaseUrl}/rest/v1/prime_pedidos?select=cliente_id&status_aprovacao=eq.APROVADO&data_criacao=not.is.null&limit=1000`, { headers });
  const todosPedidos = await resp6.json();

  const clienteIdsUnicos = new Set(todosPedidos.map(p => p.cliente_id).filter(id => id));
  console.log(`  ${clienteIdsUnicos.size} cliente_ids únicos nos primeiros 1000 pedidos`);

  // Testar se alguns desses existem em clientes_mestre
  const amostraIds = Array.from(clienteIdsUnicos).slice(0, 20);
  const resp7 = await fetch(`${supabaseUrl}/rest/v1/clientes_mestre?select=id,id_prime&id_prime=in.(${amostraIds.join(',')})`, { headers });
  const matchTest = await resp7.json();

  console.log(`  ${matchTest.length} de ${amostraIds.length} testados existem em clientes_mestre`);
  console.log(`  Taxa de match: ${((matchTest.length / amostraIds.length) * 100).toFixed(2)}%`);
}

debug().catch(console.error);
