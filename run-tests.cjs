const supabaseUrl = 'https://agdffspstbxeqhqtltvb.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFnZGZmc3BzdGJ4ZXFocXRsdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDQ1MzY2NiwiZXhwIjoyMDY2MDI5NjY2fQ.grInwGHFAH2WYvYerwfHkUsM08wXCJASg4CPMD2cTaA';

async function runQuery(queryName, sql) {
  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'apikey': supabaseServiceKey,
        'Accept-Profile': 'api',
        'Content-Profile': 'api'
      },
      body: JSON.stringify({ query: sql })
    });

    if (!response.ok) {
      // Tentar abordagem alternativa com REST direto
      return null;
    }

    const data = await response.json();
    return data;
  } catch (error) {
    return null;
  }
}

async function runTests() {
  console.log('🧪 EXECUTANDO TESTES COM DADOS PARCIAIS (30%)');
  console.log('='.repeat(60));
  console.log('');

  // Usar REST API diretamente para queries mais simples
  const headers = {
    'Accept': 'application/json',
    'Authorization': `Bearer ${supabaseServiceKey}`,
    'apikey': supabaseServiceKey,
    'Accept-Profile': 'api',
    'Content-Profile': 'api',
    'Prefer': 'count=exact'
  };

  // 7️⃣ VERIFICAR data_criacao primeiro
  console.log('7️⃣  PEDIDOS COM data_criacao');
  console.log('-'.repeat(60));

  const resp7 = await fetch(`${supabaseUrl}/rest/v1/prime_pedidos?select=data_criacao&data_criacao=not.is.null&order=data_criacao.asc.nullslast&limit=1`, { headers });
  const data7min = await resp7.json();

  const resp7max = await fetch(`${supabaseUrl}/rest/v1/prime_pedidos?select=data_criacao&data_criacao=not.is.null&order=data_criacao.desc.nullslast&limit=1`, { headers });
  const data7max = await resp7max.json();

  const resp7count = await fetch(`${supabaseUrl}/rest/v1/prime_pedidos?select=id&data_criacao=not.is.null`, {
    method: 'HEAD',
    headers: { ...headers, 'Prefer': 'count=exact' }
  });
  const range7 = resp7count.headers.get('content-range');
  const total7 = range7 ? parseInt(range7.split('/')[1]) : 0;

  console.log(`Total: ${total7.toLocaleString()}`);
  console.log(`Data mais antiga: ${data7min[0]?.data_criacao || 'N/A'}`);
  console.log(`Data mais recente: ${data7max[0]?.data_criacao || 'N/A'}`);
  console.log('');

  // 8️⃣ PEDIDOS APROVADOS
  console.log('8️⃣  PEDIDOS APROVADOS');
  console.log('-'.repeat(60));

  const resp8 = await fetch(`${supabaseUrl}/rest/v1/prime_pedidos?select=id&status_aprovacao=eq.APROVADO`, {
    method: 'HEAD',
    headers: { ...headers, 'Prefer': 'count=exact' }
  });
  const range8 = resp8.headers.get('content-range');
  const total8 = range8 ? parseInt(range8.split('/')[1]) : 0;

  console.log(`Total: ${total8.toLocaleString()}`);
  console.log('');

  // 9️⃣ ÚLTIMAS COMPRAS (AMOSTRA)
  console.log('9️⃣  ÚLTIMAS COMPRAS - AMOSTRA DE 10 CLIENTES');
  console.log('-'.repeat(60));

  // Buscar pedidos com data_criacao agrupados
  const resp9 = await fetch(`${supabaseUrl}/rest/v1/prime_pedidos?select=cliente_id,data_criacao&status_aprovacao=eq.APROVADO&data_criacao=not.is.null&order=data_criacao.desc&limit=100`, { headers });
  const pedidos = await resp9.json();

  // Agrupar por cliente manualmente
  const clienteMap = new Map();
  pedidos.forEach(p => {
    if (!clienteMap.has(p.cliente_id)) {
      clienteMap.set(p.cliente_id, p.data_criacao);
    }
  });

  // Pegar 10 clientes
  const clienteIds = Array.from(clienteMap.keys()).slice(0, 10);

  if (clienteIds.length > 0) {
    // Buscar nomes dos clientes
    const resp9clientes = await fetch(`${supabaseUrl}/rest/v1/clientes_mestre?select=id,nome_completo,id_prime&id_prime=in.(${clienteIds.join(',')})`, { headers });
    const clientes = await resp9clientes.json();

    clientes.forEach((c, i) => {
      const ultimaCompra = clienteMap.get(c.id_prime);
      const diasSemCompra = Math.floor((new Date() - new Date(ultimaCompra)) / (1000 * 60 * 60 * 24));
      console.log(`${i + 1}. ${c.nome_completo || 'N/A'}`);
      console.log(`   Última compra: ${ultimaCompra}`);
      console.log(`   Dias sem compra: ${diasSemCompra}`);
      console.log('');
    });
  } else {
    console.log('⚠️  Nenhum cliente com pedidos aprovados e data_criacao');
    console.log('');
  }

  // AGORA OS TESTES PRINCIPAIS
  console.log('='.repeat(60));
  console.log('📊 TESTES DE CATEGORIZAÇÃO');
  console.log('='.repeat(60));
  console.log('');

  // Buscar todos os pedidos aprovados com data_criacao
  console.log('⏳ Buscando dados para categorização...');
  const respPedidos = await fetch(`${supabaseUrl}/rest/v1/prime_pedidos?select=cliente_id,data_criacao&status_aprovacao=eq.APROVADO&data_criacao=not.is.null`, { headers });
  const todosPedidos = await respPedidos.json();

  // Agrupar por cliente e calcular última compra
  const clienteStats = new Map();
  todosPedidos.forEach(p => {
    const clienteId = p.cliente_id;
    if (!clienteStats.has(clienteId)) {
      clienteStats.set(clienteId, {
        totalPedidos: 0,
        ultimaCompra: p.data_criacao,
        primeiraCompra: p.data_criacao
      });
    }
    const stats = clienteStats.get(clienteId);
    stats.totalPedidos++;
    if (new Date(p.data_criacao) > new Date(stats.ultimaCompra)) {
      stats.ultimaCompra = p.data_criacao;
    }
    if (new Date(p.data_criacao) < new Date(stats.primeiraCompra)) {
      stats.primeiraCompra = p.data_criacao;
    }
  });

  // Buscar clientes_mestre para filtrar apenas os que têm id_prime
  const respClientes = await fetch(`${supabaseUrl}/rest/v1/clientes_mestre?select=id,id_prime&id_prime=not.is.null`, { headers });
  const clientesMestre = await respClientes.json();
  const clientesComPrime = new Set(clientesMestre.map(c => c.id_prime));

  // Filtrar apenas clientes que existem em clientes_mestre
  const clientesAtivos = Array.from(clienteStats.entries())
    .filter(([clienteId]) => clientesComPrime.has(clienteId));

  console.log(`✅ ${clientesAtivos.length.toLocaleString()} clientes com pedidos aprovados\n`);

  // 1️⃣ CLIENTES ATIVOS
  const ativos = clientesAtivos.filter(([_, stats]) => stats.totalPedidos >= 1);
  console.log('1️⃣  CLIENTES ATIVOS');
  console.log('-'.repeat(60));
  console.log(`Total: ${ativos.length.toLocaleString()}`);
  console.log('');

  // 2️⃣ REATIVAÇÃO (90+ dias)
  const hoje = new Date();
  const reativacao = clientesAtivos.filter(([_, stats]) => {
    const diasSemCompra = Math.floor((hoje - new Date(stats.ultimaCompra)) / (1000 * 60 * 60 * 24));
    return stats.totalPedidos >= 1 && diasSemCompra > 90;
  });
  console.log('2️⃣  REATIVAÇÃO (90+ dias sem comprar)');
  console.log('-'.repeat(60));
  console.log(`Total: ${reativacao.length.toLocaleString()}`);
  console.log('');

  // 3️⃣ MONITORAMENTO (0-90 dias)
  const monitoramento = clientesAtivos.filter(([_, stats]) => {
    const diasSemCompra = Math.floor((hoje - new Date(stats.ultimaCompra)) / (1000 * 60 * 60 * 24));
    return stats.totalPedidos >= 1 && diasSemCompra <= 90;
  });
  console.log('3️⃣  MONITORAMENTO (0-90 dias)');
  console.log('-'.repeat(60));
  console.log(`Total: ${monitoramento.length.toLocaleString()}`);
  console.log('');

  // 4️⃣ MONITORAMENTO 1-29 dias
  const mon1_29 = clientesAtivos.filter(([_, stats]) => {
    const diasSemCompra = Math.floor((hoje - new Date(stats.ultimaCompra)) / (1000 * 60 * 60 * 24));
    return stats.totalPedidos >= 1 && diasSemCompra >= 1 && diasSemCompra <= 29;
  });
  console.log('4️⃣  MONITORAMENTO 1-29 dias');
  console.log('-'.repeat(60));
  console.log(`Total: ${mon1_29.length.toLocaleString()}`);
  console.log('');

  // 5️⃣ MONITORAMENTO 30-59 dias
  const mon30_59 = clientesAtivos.filter(([_, stats]) => {
    const diasSemCompra = Math.floor((hoje - new Date(stats.ultimaCompra)) / (1000 * 60 * 60 * 24));
    return stats.totalPedidos >= 1 && diasSemCompra >= 30 && diasSemCompra <= 59;
  });
  console.log('5️⃣  MONITORAMENTO 30-59 dias');
  console.log('-'.repeat(60));
  console.log(`Total: ${mon30_59.length.toLocaleString()}`);
  console.log('');

  // 6️⃣ MONITORAMENTO 60-90 dias
  const mon60_90 = clientesAtivos.filter(([_, stats]) => {
    const diasSemCompra = Math.floor((hoje - new Date(stats.ultimaCompra)) / (1000 * 60 * 60 * 24));
    return stats.totalPedidos >= 1 && diasSemCompra >= 60 && diasSemCompra <= 90;
  });
  console.log('6️⃣  MONITORAMENTO 60-90 dias');
  console.log('-'.repeat(60));
  console.log(`Total: ${mon60_90.length.toLocaleString()}`);
  console.log('');

  // RESUMO
  console.log('='.repeat(60));
  console.log('📊 RESUMO');
  console.log('='.repeat(60));
  console.log(`Total de clientes ativos: ${ativos.length.toLocaleString()}`);
  console.log(`  └─ Monitoramento (0-90 dias): ${monitoramento.length.toLocaleString()}`);
  console.log(`      ├─ 1-29 dias: ${mon1_29.length.toLocaleString()}`);
  console.log(`      ├─ 30-59 dias: ${mon30_59.length.toLocaleString()}`);
  console.log(`      └─ 60-90 dias: ${mon60_90.length.toLocaleString()}`);
  console.log(`  └─ Reativação (90+ dias): ${reativacao.length.toLocaleString()}`);
  console.log('');
  console.log('⚠️  ATENÇÃO: Estes são dados PARCIAIS (~30% dos pedidos)');
  console.log('   Os números vão aumentar conforme a sincronização avançar!');
}

runTests().catch(console.error);
