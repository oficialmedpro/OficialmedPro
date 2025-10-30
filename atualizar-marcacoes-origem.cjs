const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Inicializar Supabase
const supabase = createClient(
  process.env.VITE_SUPABASE_URL, 
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY,
  { db: { schema: 'api' } }
);

// Função para log
function log(message) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${message}`);
}

// Função para atualizar marcações de origem
async function atualizarMarcacoesOrigem() {
  log('🏷️ Iniciando atualização das marcações de origem...');
  
  try {
    // 1. Marcar clientes da PRIME como "prime"
    log('📊 Atualizando marcações PRIME...');
    const { data: primeData, error: primeError } = await supabase
      .from('clientes_mestre')
      .update({ 
        origem_marcas: supabase.raw('array_append(origem_marcas, \'prime\')')
      })
      .eq('fontes_dados', ['prime_clientes']);

    if (primeError) {
      log(`❌ Erro ao atualizar PRIME: ${primeError.message}`);
    } else {
      log(`✅ PRIME atualizado: ${primeData?.length || 0} registros`);
    }

    // 2. Marcar clientes da GREATPAGE como "google"
    log('📊 Atualizando marcações GOOGLE (Greatpage)...');
    const { data: greatpageData, error: greatpageError } = await supabase
      .from('clientes_mestre')
      .update({ 
        origem_marcas: supabase.raw('array_append(origem_marcas, \'google\')')
      })
      .eq('fontes_dados', ['greatpage_leads']);

    if (greatpageError) {
      log(`❌ Erro ao atualizar GOOGLE: ${greatpageError.message}`);
    } else {
      log(`✅ GOOGLE atualizado: ${greatpageData?.length || 0} registros`);
    }

    // 3. Marcar clientes da BLACKLABS como "blacklabs"
    log('📊 Atualizando marcações BLACKLABS...');
    const { data: blacklabsData, error: blacklabsError } = await supabase
      .from('clientes_mestre')
      .update({ 
        origem_marcas: supabase.raw('array_append(origem_marcas, \'blacklabs\')')
      })
      .eq('fontes_dados', ['blacklabs']);

    if (blacklabsError) {
      log(`❌ Erro ao atualizar BLACKLABS: ${blacklabsError.message}`);
    } else {
      log(`✅ BLACKLABS atualizado: ${blacklabsData?.length || 0} registros`);
    }

    // 4. Marcar clientes da LEADS como "sprint"
    log('📊 Atualizando marcações SPRINT (Leads)...');
    const { data: leadsData, error: leadsError } = await supabase
      .from('clientes_mestre')
      .update({ 
        origem_marcas: supabase.raw('array_append(origem_marcas, \'sprint\')')
      })
      .eq('fontes_dados', ['leads']);

    if (leadsError) {
      log(`❌ Erro ao atualizar SPRINT: ${leadsError.message}`);
    } else {
      log(`✅ SPRINT atualizado: ${leadsData?.length || 0} registros`);
    }

    // 5. Atualizar clientes com múltiplas fontes
    log('📊 Atualizando marcações MÚLTIPLAS...');
    
    // Clientes com PRIME + outras fontes
    const { data: primeMultiData, error: primeMultiError } = await supabase
      .from('clientes_mestre')
      .update({ 
        origem_marcas: supabase.raw('array_append(origem_marcas, \'prime\')')
      })
      .contains('fontes_dados', ['prime_clientes'])
      .not('origem_marcas', 'cs', ['prime']);

    if (primeMultiError) {
      log(`❌ Erro ao atualizar PRIME múltiplo: ${primeMultiError.message}`);
    } else {
      log(`✅ PRIME múltiplo atualizado: ${primeMultiData?.length || 0} registros`);
    }

    // Clientes com GREATPAGE + outras fontes
    const { data: greatpageMultiData, error: greatpageMultiError } = await supabase
      .from('clientes_mestre')
      .update({ 
        origem_marcas: supabase.raw('array_append(origem_marcas, \'google\')')
      })
      .contains('fontes_dados', ['greatpage_leads'])
      .not('origem_marcas', 'cs', ['google']);

    if (greatpageMultiError) {
      log(`❌ Erro ao atualizar GOOGLE múltiplo: ${greatpageMultiError.message}`);
    } else {
      log(`✅ GOOGLE múltiplo atualizado: ${greatpageMultiData?.length || 0} registros`);
    }

    // Clientes com BLACKLABS + outras fontes
    const { data: blacklabsMultiData, error: blacklabsMultiError } = await supabase
      .from('clientes_mestre')
      .update({ 
        origem_marcas: supabase.raw('array_append(origem_marcas, \'blacklabs\')')
      })
      .contains('fontes_dados', ['blacklabs'])
      .not('origem_marcas', 'cs', ['blacklabs']);

    if (blacklabsMultiError) {
      log(`❌ Erro ao atualizar BLACKLABS múltiplo: ${blacklabsMultiError.message}`);
    } else {
      log(`✅ BLACKLABS múltiplo atualizado: ${blacklabsMultiData?.length || 0} registros`);
    }

    // Clientes com LEADS + outras fontes
    const { data: leadsMultiData, error: leadsMultiError } = await supabase
      .from('clientes_mestre')
      .update({ 
        origem_marcas: supabase.raw('array_append(origem_marcas, \'sprint\')')
      })
      .contains('fontes_dados', ['leads'])
      .not('origem_marcas', 'cs', ['sprint']);

    if (leadsMultiError) {
      log(`❌ Erro ao atualizar SPRINT múltiplo: ${leadsMultiError.message}`);
    } else {
      log(`✅ SPRINT múltiplo atualizado: ${leadsMultiData?.length || 0} registros`);
    }

    log('🎉 Atualização das marcações concluída!');

  } catch (error) {
    log(`💥 Erro fatal: ${error.message}`);
  }
}

// Função para verificar resultados
async function verificarResultados() {
  log('📊 Verificando resultados das marcações...');
  
  try {
    // Contar por marcação
    const { data: contagem, error: contagemError } = await supabase
      .from('clientes_mestre')
      .select('origem_marcas');

    if (contagemError) {
      log(`❌ Erro ao verificar contagem: ${contagemError.message}`);
      return;
    }

    const stats = {
      prime: 0,
      google: 0,
      blacklabs: 0,
      sprint: 0,
      multiplas: 0,
      sem_marcacao: 0
    };

    contagem.forEach(record => {
      const marcas = record.origem_marcas || [];
      
      if (marcas.length === 0) {
        stats.sem_marcacao++;
      } else if (marcas.length === 1) {
        if (marcas.includes('prime')) stats.prime++;
        if (marcas.includes('google')) stats.google++;
        if (marcas.includes('blacklabs')) stats.blacklabs++;
        if (marcas.includes('sprint')) stats.sprint++;
      } else {
        stats.multiplas++;
      }
    });

    log('📊 ESTATÍSTICAS DAS MARCAÇÕES:');
    log(`  🏷️ PRIME: ${stats.prime} clientes`);
    log(`  🏷️ GOOGLE: ${stats.google} clientes`);
    log(`  🏷️ BLACKLABS: ${stats.blacklabs} clientes`);
    log(`  🏷️ SPRINT: ${stats.sprint} clientes`);
    log(`  🏷️ MÚLTIPLAS: ${stats.multiplas} clientes`);
    log(`  ❌ SEM MARCAÇÃO: ${stats.sem_marcacao} clientes`);

  } catch (error) {
    log(`❌ Erro ao verificar resultados: ${error.message}`);
  }
}

// Executar
(async () => {
  await atualizarMarcacoesOrigem();
  await verificarResultados();
})();

