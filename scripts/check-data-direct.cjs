// Node.js v18+ já tem fetch nativo
const supabaseUrl = 'https://agdffspstbxeqhqtltvb.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFnZGZmc3BzdGJ4ZXFocXRsdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDQ1MzY2NiwiZXhwIjoyMDY2MDI5NjY2fQ.grInwGHFAH2WYvYerwfHkUsM08wXCJASg4CPMD2cTaA';

async function checkData() {
  console.log('🔍 Verificando dados de prime_pedidos via REST API...\n');

  try {
    // 1. Buscar amostra de pedidos
    const response = await fetch(`${supabaseUrl}/rest/v1/prime_pedidos?select=id,data_criacao,data_aprovacao,created_at,status_aprovacao&limit=10`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'apikey': supabaseServiceKey,
        'Accept-Profile': 'api',
        'Content-Profile': 'api',
        'Prefer': 'count=exact'
      }
    });

    if (!response.ok) {
      console.error('❌ Erro HTTP:', response.status, response.statusText);
      const text = await response.text();
      console.error('Resposta:', text);
      return;
    }

    const data = await response.json();
    const contentRange = response.headers.get('content-range');

    console.log(`📊 Content-Range: ${contentRange}\n`);

    if (data && data.length > 0) {
      console.log(`📋 Amostra de ${data.length} pedidos:`);

      let comDataCriacao = 0;
      data.forEach((p, i) => {
        if (p.data_criacao) comDataCriacao++;
        console.log(`\n${i + 1}. ID: ${p.id} | Status: ${p.status_aprovacao}`);
        console.log(`   data_criacao:   ${p.data_criacao || '❌ NULL'}`);
        console.log(`   data_aprovacao: ${p.data_aprovacao || 'NULL'}`);
        console.log(`   created_at:     ${p.created_at}`);
      });

      console.log(`\n✅ ${comDataCriacao} de ${data.length} pedidos com data_criacao preenchida`);
      console.log(`📈 Percentual na amostra: ${((comDataCriacao / data.length) * 100).toFixed(2)}%`);
    } else {
      console.log('⚠️  Nenhum pedido encontrado na tabela');
    }

    // 2. Buscar contagem com data_criacao
    const response2 = await fetch(`${supabaseUrl}/rest/v1/prime_pedidos?select=id&data_criacao=not.is.null`, {
      method: 'HEAD',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'apikey': supabaseServiceKey,
        'Accept-Profile': 'api',
        'Content-Profile': 'api',
        'Prefer': 'count=exact'
      }
    });

    const contentRange2 = response2.headers.get('content-range');
    if (contentRange2) {
      const match = contentRange2.match(/\/(\d+)/);
      if (match) {
        const totalComData = parseInt(match[1]);
        console.log(`\n📊 Total geral de pedidos com data_criacao: ${totalComData.toLocaleString()}`);
      }
    }

  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

checkData();
