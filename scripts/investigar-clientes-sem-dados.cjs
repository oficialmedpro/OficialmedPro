const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://sxbbmnzvbbvgibdppdgw.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN4YmJtbnp2YmJ2Z2liZHBwZGd3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcyODk5MzQ5NywiZXhwIjoyMDQ0NTY5NDk3fQ.Y9bZ5zqGN8h1aH7xLU8sJ5mP6kBOdVfN9qzWk0L3F7o';

async function investigar() {
  const supabase = createClient(supabaseUrl, supabaseKey, {
    db: { schema: 'api' }
  });
  
  console.log('🔍 INVESTIGANDO CLIENTES COM HISTÓRICO DE ORÇAMENTO MAS SEM DADOS\n');
  console.log('='.repeat(80));
  
  // 1. Buscar clientes da view "com orçamento"
  console.log('\n📊 1. Buscando clientes COM histórico de orçamento...\n');
  
  const { data: comOrcamento, error: erro1, count: totalCom } = await supabase
    .from('vw_inativos_com_orcamento')
    .select('*', { count: 'exact' })
    .order('qualidade_dados', { ascending: true })
    .limit(20);
  
  if (erro1) {
    console.log('❌ Erro ao buscar com orçamento:', erro1);
  } else {
    console.log(`✅ Total COM histórico: ${totalCom}`);
    console.log(`📋 Mostrando os 20 com MENOR qualidade:\n`);
    
    comOrcamento.forEach((cliente, idx) => {
      console.log(`${idx + 1}. ${cliente.nome_completo || 'SEM NOME'}`);
      console.log(`   ├─ Email: ${cliente.email || '❌ VAZIO'}`);
      console.log(`   ├─ WhatsApp: ${cliente.whatsapp || '❌ VAZIO'}`);
      console.log(`   ├─ Telefone: ${cliente.telefone || '❌ VAZIO'}`);
      console.log(`   ├─ CPF: ${cliente.cpf || '❌ VAZIO'}`);
      console.log(`   ├─ Qualidade: ${cliente.qualidade_dados}/100`);
      console.log(`   ├─ Total Orçamentos: ${cliente.total_orcamentos}`);
      console.log(`   ├─ Status: ${cliente.status_historico}`);
      console.log(`   ├─ Origem: ${cliente.origem_marcas || 'NÃO INFORMADA'}`);
      console.log(`   └─ ID Prime: ${cliente.id_prime}`);
      console.log('');
    });
  }
  
  // 2. Buscar clientes SEM orçamento
  console.log('\n' + '='.repeat(80));
  console.log('\n📊 2. Buscando clientes SEM histórico de orçamento...\n');
  
  const { data: semOrcamento, error: erro2, count: totalSem } = await supabase
    .from('vw_inativos_sem_orcamento')
    .select('*', { count: 'exact' })
    .order('qualidade_dados', { ascending: false })
    .limit(10);
  
  if (erro2) {
    console.log('❌ Erro ao buscar sem orçamento:', erro2);
  } else {
    console.log(`✅ Total SEM histórico: ${totalSem}`);
    console.log(`📋 Mostrando os 10 com MAIOR qualidade:\n`);
    
    semOrcamento.forEach((cliente, idx) => {
      console.log(`${idx + 1}. ${cliente.nome_completo || 'SEM NOME'}`);
      console.log(`   ├─ Email: ${cliente.email || '❌ VAZIO'}`);
      console.log(`   ├─ WhatsApp: ${cliente.whatsapp || '❌ VAZIO'}`);
      console.log(`   ├─ Telefone: ${cliente.telefone || '❌ VAZIO'}`);
      console.log(`   ├─ CPF: ${cliente.cpf || '❌ VAZIO'}`);
      console.log(`   ├─ Qualidade: ${cliente.qualidade_dados}/100`);
      console.log(`   ├─ Origem: ${cliente.origem_marcas || 'NÃO INFORMADA'}`);
      console.log(`   └─ ID Prime: ${cliente.id_prime}`);
      console.log('');
    });
  }
  
  // 3. Verificar se os dados existem no Prime mas não no clientes_mestre
  console.log('\n' + '='.repeat(80));
  console.log('\n🔍 3. Verificando se dados existem no Prime mas faltam no clientes_mestre...\n');
  
  if (comOrcamento && comOrcamento.length > 0) {
    const primeIds = comOrcamento.slice(0, 5).map(c => c.id_prime).filter(id => id);
    
    const { data: dadosPrime, error: erro3 } = await supabase
      .from('prime_clientes')
      .select('id, nome, email, telefone, celular, whatsapp, cpf')
      .in('id', primeIds);
    
    if (erro3) {
      console.log('❌ Erro ao buscar no Prime:', erro3);
    } else {
      console.log('📋 Comparando dados Prime vs clientes_mestre:\n');
      
      dadosPrime.forEach((primeCli) => {
        const mestre = comOrcamento.find(c => c.id_prime === primeCli.id);
        console.log(`Cliente ID Prime: ${primeCli.id}`);
        console.log(`Nome no Prime: ${primeCli.nome || '❌ VAZIO'}`);
        console.log(`Nome no Mestre: ${mestre?.nome_completo || '❌ VAZIO'}`);
        console.log(`Email no Prime: ${primeCli.email || '❌ VAZIO'}`);
        console.log(`Email no Mestre: ${mestre?.email || '❌ VAZIO'}`);
        console.log(`WhatsApp no Prime: ${primeCli.whatsapp || '❌ VAZIO'}`);
        console.log(`WhatsApp no Mestre: ${mestre?.whatsapp || '❌ VAZIO'}`);
        console.log(`CPF no Prime: ${primeCli.cpf || '❌ VAZIO'}`);
        console.log(`CPF no Mestre: ${mestre?.cpf || '❌ VAZIO'}`);
        console.log(`${'─'.repeat(60)}\n`);
      });
    }
  }
  
  // 4. Estatísticas gerais
  console.log('\n' + '='.repeat(80));
  console.log('\n📈 4. ESTATÍSTICAS GERAIS\n');
  
  const { data: stats } = await supabase
    .from('vw_inativos_com_orcamento')
    .select('qualidade_dados')
    .gte('qualidade_dados', 0);
  
  if (stats) {
    const qualidade20 = stats.filter(s => s.qualidade_dados === 20).length;
    const qualidade40 = stats.filter(s => s.qualidade_dados === 40).length;
    const qualidade65 = stats.filter(s => s.qualidade_dados === 65).length;
    const qualidade90 = stats.filter(s => s.qualidade_dados >= 90).length;
    
    console.log(`Clientes COM orçamento por qualidade:`);
    console.log(`  🔴 20/100: ${qualidade20} (${((qualidade20/stats.length)*100).toFixed(1)}%)`);
    console.log(`  🟠 40/100: ${qualidade40} (${((qualidade40/stats.length)*100).toFixed(1)}%)`);
    console.log(`  🟡 65/100: ${qualidade65} (${((qualidade65/stats.length)*100).toFixed(1)}%)`);
    console.log(`  🟢 90+/100: ${qualidade90} (${((qualidade90/stats.length)*100).toFixed(1)}%)`);
    console.log(`  📊 Total: ${stats.length}`);
  }
  
  console.log('\n' + '='.repeat(80));
  console.log('\n✅ Investigação concluída!\n');
}

investigar().catch(console.error);

