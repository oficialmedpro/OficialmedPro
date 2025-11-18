const supabaseUrl = 'https://agdffspstbxeqhqtltvb.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFnZGZmc3BzdGJ4ZXFocXRsdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDQ1MzY2NiwiZXhwIjoyMDY2MDI5NjY2fQ.grInwGHFAH2WYvYerwfHkUsM08wXCJASg4CPMD2cTaA';

const headers = {
  'Accept': 'application/json',
  'Authorization': `Bearer ${supabaseServiceKey}`,
  'apikey': supabaseServiceKey,
  'Accept-Profile': 'api',
  'Content-Profile': 'api'
};

async function fetchAllPages(url) {
  let allData = [];
  let offset = 0;
  const limit = 1000;

  while (true) {
    const response = await fetch(`${url}&limit=${limit}&offset=${offset}`, { headers });
    const data = await response.json();

    if (!data || data.length === 0) break;

    allData = allData.concat(data);
    if (data.length < limit) break;

    offset += limit;
  }

  return allData;
}

async function runTests() {
  console.log('🧪 EXECUTANDO TESTES COM DADOS PARCIAIS');
  console.log('='.repeat(70));
  console.log('');

  // Buscar TODOS os pedidos aprovados com data_criacao
  console.log('⏳ Buscando TODOS os pedidos aprovados com data_criacao...');
  const pedidos = await fetchAllPages(`${supabaseUrl}/rest/v1/prime_pedidos?select=cliente_id,data_criacao&status_aprovacao=eq.APROVADO&data_criacao=not.is.null&order=data_criacao.desc`);
  console.log(`✅ ${pedidos.length.toLocaleString()} pedidos carregados\n`);

  // Agrupar por cliente
  const clienteStats = new Map();
  pedidos.forEach(p => {
    const clienteId = p.cliente_id;
    if (!clienteId) return;

    if (!clienteStats.has(clienteId)) {
      clienteStats.set(clienteId, {
        totalPedidos: 0,
        ultimaCompra: p.data_criacao,
        primeiraCompra: p.data_criacao
      });
    }

    const stats = clienteStats.get(clienteId);
    stats.totalPedidos++;

    const dataAtual = new Date(p.data_criacao);
    if (dataAtual > new Date(stats.ultimaCompra)) {
      stats.ultimaCompra = p.data_criacao;
    }
    if (dataAtual < new Date(stats.primeiraCompra)) {
      stats.primeiraCompra = p.data_criacao;
    }
  });

  console.log(`✅ ${clienteStats.size.toLocaleString()} clientes únicos nos pedidos\n`);

  // Buscar clientes_mestre para filtrar apenas os que existem
  console.log('⏳ Buscando clientes em clientes_mestre...');
  const clienteIds = Array.from(clienteStats.keys());

  // Dividir em lotes de 100 para não estourar URL
  const batchSize = 100;
  const clientesComPrime = new Set();

  for (let i = 0; i < clienteIds.length; i += batchSize) {
    const batch = clienteIds.slice(i, i + batchSize);
    const resp = await fetch(`${supabaseUrl}/rest/v1/clientes_mestre?select=id_prime&id_prime=in.(${batch.join(',')})`, { headers });
    const data = await resp.json();
    data.forEach(c => clientesComPrime.add(c.id_prime));
  }

  console.log(`✅ ${clientesComPrime.size.toLocaleString()} clientes encontrados em clientes_mestre\n`);

  // Filtrar apenas clientes que existem em clientes_mestre
  const clientesAtivos = Array.from(clienteStats.entries())
    .filter(([clienteId]) => clientesComPrime.has(clienteId));

  console.log('='.repeat(70));
  console.log('📊 RESULTADOS DOS TESTES');
  console.log('='.repeat(70));
  console.log('');

  // Calcular dias sem compra
  const hoje = new Date();

  // 1️⃣ CLIENTES ATIVOS
  const ativos = clientesAtivos.filter(([_, stats]) => stats.totalPedidos >= 1);
  console.log('1️⃣  CLIENTES ATIVOS (com pelo menos 1 pedido)');
  console.log('-'.repeat(70));
  console.log(`Total: ${ativos.length.toLocaleString()}`);
  console.log('');

  // 2️⃣ REATIVAÇÃO (90+ dias)
  const reativacao = clientesAtivos.filter(([_, stats]) => {
    const diasSemCompra = Math.floor((hoje - new Date(stats.ultimaCompra)) / (1000 * 60 * 60 * 24));
    return stats.totalPedidos >= 1 && diasSemCompra > 90;
  });
  console.log('2️⃣  REATIVAÇÃO (90+ dias sem comprar)');
  console.log('-'.repeat(70));
  console.log(`Total: ${reativacao.length.toLocaleString()}`);
  console.log('');

  // 3️⃣ MONITORAMENTO (0-90 dias)
  const monitoramento = clientesAtivos.filter(([_, stats]) => {
    const diasSemCompra = Math.floor((hoje - new Date(stats.ultimaCompra)) / (1000 * 60 * 60 * 24));
    return stats.totalPedidos >= 1 && diasSemCompra >= 0 && diasSemCompra <= 90;
  });
  console.log('3️⃣  MONITORAMENTO (0-90 dias)');
  console.log('-'.repeat(70));
  console.log(`Total: ${monitoramento.length.toLocaleString()}`);
  console.log('');

  // 4️⃣ MONITORAMENTO 1-29 dias
  const mon1_29 = clientesAtivos.filter(([_, stats]) => {
    const diasSemCompra = Math.floor((hoje - new Date(stats.ultimaCompra)) / (1000 * 60 * 60 * 24));
    return stats.totalPedidos >= 1 && diasSemCompra >= 1 && diasSemCompra <= 29;
  });
  console.log('4️⃣  MONITORAMENTO 1-29 dias');
  console.log('-'.repeat(70));
  console.log(`Total: ${mon1_29.length.toLocaleString()}`);
  console.log('');

  // 5️⃣ MONITORAMENTO 30-59 dias
  const mon30_59 = clientesAtivos.filter(([_, stats]) => {
    const diasSemCompra = Math.floor((hoje - new Date(stats.ultimaCompra)) / (1000 * 60 * 60 * 24));
    return stats.totalPedidos >= 1 && diasSemCompra >= 30 && diasSemCompra <= 59;
  });
  console.log('5️⃣  MONITORAMENTO 30-59 dias');
  console.log('-'.repeat(70));
  console.log(`Total: ${mon30_59.length.toLocaleString()}`);
  console.log('');

  // 6️⃣ MONITORAMENTO 60-90 dias
  const mon60_90 = clientesAtivos.filter(([_, stats]) => {
    const diasSemCompra = Math.floor((hoje - new Date(stats.ultimaCompra)) / (1000 * 60 * 60 * 24));
    return stats.totalPedidos >= 1 && diasSemCompra >= 60 && diasSemCompra <= 90;
  });
  console.log('6️⃣  MONITORAMENTO 60-90 dias');
  console.log('-'.repeat(70));
  console.log(`Total: ${mon60_90.length.toLocaleString()}`);
  console.log('');

  // RESUMO EM ÁRVORE
  console.log('='.repeat(70));
  console.log('📊 RESUMO VISUAL');
  console.log('='.repeat(70));
  console.log(`📦 Total de clientes ativos: ${ativos.length.toLocaleString()}`);
  console.log(`│`);
  console.log(`├─ 👀 Monitoramento (0-90 dias): ${monitoramento.length.toLocaleString()}`);
  console.log(`│   ├─ 🟢 1-29 dias: ${mon1_29.length.toLocaleString()}`);
  console.log(`│   ├─ 🟡 30-59 dias: ${mon30_59.length.toLocaleString()}`);
  console.log(`│   └─ 🟠 60-90 dias: ${mon60_90.length.toLocaleString()}`);
  console.log(`│`);
  console.log(`└─ 🔄 Reativação (90+ dias): ${reativacao.length.toLocaleString()}`);
  console.log('');

  // Amostra de clientes para reativação
  if (reativacao.length > 0) {
    console.log('='.repeat(70));
    console.log('📋 AMOSTRA: CLIENTES PARA REATIVAÇÃO (Top 10)');
    console.log('='.repeat(70));

    const topReativacao = reativacao
      .map(([clienteId, stats]) => {
        const diasSemCompra = Math.floor((hoje - new Date(stats.ultimaCompra)) / (1000 * 60 * 60 * 24));
        return { clienteId, ...stats, diasSemCompra };
      })
      .sort((a, b) => a.diasSemCompra - b.diasSemCompra)
      .slice(0, 10);

    // Buscar nomes
    const clienteIdsTop = topReativacao.map(c => c.clienteId);
    const respNomes = await fetch(`${supabaseUrl}/rest/v1/clientes_mestre?select=id_prime,nome_completo&id_prime=in.(${clienteIdsTop.join(',')})`, { headers });
    const nomesData = await respNomes.json();
    const nomesMap = new Map(nomesData.map(c => [c.id_prime, c.nome_completo]));

    topReativacao.forEach((c, i) => {
      const nome = nomesMap.get(c.clienteId) || 'Nome não encontrado';
      console.log(`${i + 1}. ${nome}`);
      console.log(`   Última compra: ${c.ultimaCompra}`);
      console.log(`   Dias sem compra: ${c.diasSemCompra}`);
      console.log(`   Total de pedidos: ${c.totalPedidos}`);
      console.log('');
    });
  }

  console.log('='.repeat(70));
  console.log('⚠️  DADOS PARCIAIS: Sincronização em andamento!');
  console.log('   Os números aumentarão conforme mais pedidos forem sincronizados.');
  console.log('='.repeat(70));
}

runTests().catch(console.error);
