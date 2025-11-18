#!/usr/bin/env node

/**
 * Script simples para buscar custos por campanha do Google
 * Consulta diretamente a tabela api.investimento_patrocinados
 */

// Configuração do Supabase (mesmas credenciais do projeto)
const SUPABASE_URL = 'https://agdffspstbxeqhqtltvb.supabase.co';
const SUPABASE_SCHEMA = 'api';

// Tentar obter a chave de várias fontes
let SUPABASE_KEY = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || 
                   process.env.SUPABASE_SERVICE_ROLE_KEY;

// Se não encontrar nas variáveis de ambiente, usar a chave do código
if (!SUPABASE_KEY) {
  console.log('⚠️ Chave não encontrada em variáveis de ambiente, você precisa fornecer manualmente');
  console.log('Execute o script assim:');
  console.log('node get-campaigns-cost-simple.js YOUR_SERVICE_ROLE_KEY');
  console.log('\nOu defina a variável de ambiente:');
  console.log('set VITE_SUPABASE_SERVICE_ROLE_KEY=your_key_here');
  
  // Tentar usar argumento da linha de comando
  if (process.argv[2]) {
    SUPABASE_KEY = process.argv[2];
    console.log('✅ Usando chave fornecida como argumento\n');
  } else {
    process.exit(1);
  }
}

async function getCampaignsCost() {
  try {
    console.log('🔍 Buscando custos por campanha do Google...\n');
    console.log('📡 Supabase URL:', SUPABASE_URL);
    console.log('📂 Schema:', SUPABASE_SCHEMA);
    console.log('🔑 Chave:', SUPABASE_KEY ? `${SUPABASE_KEY.substring(0, 20)}...` : '❌ Não definida');
    console.log('');

    // 1. Buscar todos os dados com paginação
    let allData = [];
    let page = 0;
    let hasMore = true;
    const pageSize = 1000;

    while (hasMore) {
      const offset = page * pageSize;
      const url = `${SUPABASE_URL}/rest/v1/investimento_patrocinados?select=*&plataforma=eq.google&order=data.desc&limit=${pageSize}&offset=${offset}`;
      
      console.log(`📄 Buscando página ${page + 1}...`);
      
      const response = await fetch(url, {
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Accept-Profile': SUPABASE_SCHEMA,
          'Content-Profile': SUPABASE_SCHEMA
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const pageData = await response.json();
      
      if (pageData.length === 0) {
        hasMore = false;
      } else {
        allData = allData.concat(pageData);
        console.log(`   ✅ ${pageData.length} registros nesta página | Total acumulado: ${allData.length}`);
        page++;
        
        if (pageData.length < pageSize) {
          hasMore = false;
        }
      }
    }

    console.log(`\n📊 Total de registros encontrados: ${allData.length}\n`);
    
    if (allData.length === 0) {
      console.log('⚠️ Nenhum registro encontrado na tabela investimento_patrocinados para Google');
      return;
    }

    // 2. Mostrar estrutura (colunas disponíveis)
    console.log('📋 Colunas disponíveis nos dados:');
    const sampleRecord = allData[0];
    Object.keys(sampleRecord).forEach(key => {
      const value = sampleRecord[key];
      const type = typeof value;
      console.log(`   - ${key}: ${type} (exemplo: ${JSON.stringify(value).substring(0, 50)})`);
    });
    console.log('');

    // 3. Agrupar por campanha
    const campaigns = {};
    
    allData.forEach(record => {
      // Tentar identificar o campo de campanha
      const campaign = record.campanha || 
                      record.campaign || 
                      record.campaign_name || 
                      record.nome_campanha ||
                      'Sem Campanha';
      
      const cost = parseFloat(record.valor || record.cost || record.custo || 0);
      const date = record.data || record.date || 'N/A';
      
      if (!campaigns[campaign]) {
        campaigns[campaign] = {
          total: 0,
          count: 0,
          dates: []
        };
      }
      
      campaigns[campaign].total += cost;
      campaigns[campaign].count++;
      campaigns[campaign].dates.push(date);
    });
    
    // 4. Ordenar por custo total (decrescente)
    const sorted = Object.entries(campaigns)
      .map(([name, data]) => ({
        campanha: name,
        custo_total: data.total,
        registros: data.count,
        primeira_data: data.dates.sort()[0],
        ultima_data: data.dates.sort().reverse()[0]
      }))
      .sort((a, b) => b.custo_total - a.custo_total);
    
    // 5. Exibir resultado em tabela
    console.log('💰 CUSTO POR CAMPANHA (ordenado por custo total):\n');
    console.log('═'.repeat(120));
    console.log(
      'CAMPANHA'.padEnd(50) + 
      'CUSTO TOTAL'.padEnd(20) + 
      'REGISTROS'.padEnd(15) + 
      'PRIMEIRA DATA'.padEnd(15) +
      'ÚLTIMA DATA'
    );
    console.log('═'.repeat(120));
    
    sorted.forEach((item, index) => {
      const campanha = item.campanha.substring(0, 47) + (item.campanha.length > 47 ? '...' : '');
      const custo = `R$ ${item.custo_total.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      const registros = item.registros.toString();
      const primeira = item.primeira_data ? item.primeira_data.split('T')[0] : 'N/A';
      const ultima = item.ultima_data ? item.ultima_data.split('T')[0] : 'N/A';
      
      console.log(
        `${(index + 1).toString().padStart(3)}. `.padEnd(5) +
        campanha.padEnd(50) + 
        custo.padEnd(20) + 
        registros.padEnd(15) + 
        primeira.padEnd(15) +
        ultima
      );
    });
    
    console.log('═'.repeat(120));
    
    // 6. Resumo total
    const totalGeral = sorted.reduce((sum, item) => sum + item.custo_total, 0);
    const totalRegistros = sorted.reduce((sum, item) => sum + item.registros, 0);
    
    console.log(`\n📈 RESUMO GERAL:`);
    console.log(`   Total investido: R$ ${totalGeral.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
    console.log(`   Total de campanhas: ${sorted.length}`);
    console.log(`   Total de registros: ${totalRegistros}`);
    console.log(`   Custo médio por campanha: R$ ${(totalGeral / sorted.length).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
    console.log(`   Custo médio por registro: R$ ${(totalGeral / totalRegistros).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
    
    // 7. Top 10 campanhas
    console.log(`\n🏆 TOP 10 CAMPANHAS POR CUSTO:\n`);
    sorted.slice(0, 10).forEach((item, index) => {
      const percent = ((item.custo_total / totalGeral) * 100).toFixed(2);
      console.log(
        `   ${index + 1}. ${item.campanha.substring(0, 50)}: ` +
        `R$ ${item.custo_total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} ` +
        `(${percent}%)`
      );
    });
    
    // 8. Últimos 10 registros
    console.log(`\n\n📋 ÚLTIMOS 10 REGISTROS:\n`);
    console.log('─'.repeat(100));
    allData.slice(0, 10).forEach((record, index) => {
      const campanha = record.campanha || record.campaign || 'N/A';
      const valor = parseFloat(record.valor || 0);
      const data = record.data ? record.data.split('T')[0] : 'N/A';
      
      console.log(
        `${(index + 1).toString().padStart(3)}. ${data} | ` +
        `${campanha.substring(0, 40).padEnd(40)} | ` +
        `R$ ${valor.toFixed(2).padStart(10)}`
      );
    });
    console.log('─'.repeat(100));
    
  } catch (error) {
    console.error('\n❌ ERRO:', error.message);
    console.error('\n💡 Dicas:');
    console.error('   1. Verifique se a chave do Supabase está correta');
    console.error('   2. Verifique se a tabela api.investimento_patrocinados existe');
    console.error('   3. Verifique se há registros com plataforma="google"');
    process.exit(1);
  }
}

// Executar
getCampaignsCost();

