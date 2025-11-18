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

// Função para atualizar marcações de origem usando SQL direto
async function atualizarMarcacoesOrigem() {
  log('🏷️ Iniciando atualização das marcações de origem...');
  
  try {
    // 1. Marcar clientes da PRIME como "prime"
    log('📊 Atualizando marcações PRIME...');
    const { data: primeData, error: primeError } = await supabase.rpc('exec_sql', {
      sql: `
        UPDATE api.clientes_mestre 
        SET origem_marcas = array_append(origem_marcas, 'prime')
        WHERE 'prime_clientes' = ANY(fontes_dados)
        AND NOT ('prime' = ANY(origem_marcas))
      `
    });

    if (primeError) {
      log(`❌ Erro ao atualizar PRIME: ${primeError.message}`);
    } else {
      log(`✅ PRIME atualizado`);
    }

    // 2. Marcar clientes da GREATPAGE como "google"
    log('📊 Atualizando marcações GOOGLE (Greatpage)...');
    const { data: greatpageData, error: greatpageError } = await supabase.rpc('exec_sql', {
      sql: `
        UPDATE api.clientes_mestre 
        SET origem_marcas = array_append(origem_marcas, 'google')
        WHERE 'greatpage_leads' = ANY(fontes_dados)
        AND NOT ('google' = ANY(origem_marcas))
      `
    });

    if (greatpageError) {
      log(`❌ Erro ao atualizar GOOGLE: ${greatpageError.message}`);
    } else {
      log(`✅ GOOGLE atualizado`);
    }

    // 3. Marcar clientes da BLACKLABS como "blacklabs"
    log('📊 Atualizando marcações BLACKLABS...');
    const { data: blacklabsData, error: blacklabsError } = await supabase.rpc('exec_sql', {
      sql: `
        UPDATE api.clientes_mestre 
        SET origem_marcas = array_append(origem_marcas, 'blacklabs')
        WHERE 'blacklabs' = ANY(fontes_dados)
        AND NOT ('blacklabs' = ANY(origem_marcas))
      `
    });

    if (blacklabsError) {
      log(`❌ Erro ao atualizar BLACKLABS: ${blacklabsError.message}`);
    } else {
      log(`✅ BLACKLABS atualizado`);
    }

    // 4. Marcar clientes da LEADS como "sprint"
    log('📊 Atualizando marcações SPRINT (Leads)...');
    const { data: leadsData, error: leadsError } = await supabase.rpc('exec_sql', {
      sql: `
        UPDATE api.clientes_mestre 
        SET origem_marcas = array_append(origem_marcas, 'sprint')
        WHERE 'leads' = ANY(fontes_dados)
        AND NOT ('sprint' = ANY(origem_marcas))
      `
    });

    if (leadsError) {
      log(`❌ Erro ao atualizar SPRINT: ${leadsError.message}`);
    } else {
      log(`✅ SPRINT atualizado`);
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
    // Contar por marcação usando SQL direto
    const { data: contagem, error: contagemError } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT 
          COUNT(CASE WHEN 'prime' = ANY(origem_marcas) THEN 1 END) as prime,
          COUNT(CASE WHEN 'google' = ANY(origem_marcas) THEN 1 END) as google,
          COUNT(CASE WHEN 'blacklabs' = ANY(origem_marcas) THEN 1 END) as blacklabs,
          COUNT(CASE WHEN 'sprint' = ANY(origem_marcas) THEN 1 END) as sprint,
          COUNT(CASE WHEN array_length(origem_marcas, 1) > 1 THEN 1 END) as multiplas,
          COUNT(CASE WHEN array_length(origem_marcas, 1) IS NULL OR array_length(origem_marcas, 1) = 0 THEN 1 END) as sem_marcacao
        FROM api.clientes_mestre
      `
    });

    if (contagemError) {
      log(`❌ Erro ao verificar contagem: ${contagemError.message}`);
      return;
    }

    const stats = contagem[0] || {};

    log('📊 ESTATÍSTICAS DAS MARCAÇÕES:');
    log(`  🏷️ PRIME: ${stats.prime || 0} clientes`);
    log(`  🏷️ GOOGLE: ${stats.google || 0} clientes`);
    log(`  🏷️ BLACKLABS: ${stats.blacklabs || 0} clientes`);
    log(`  🏷️ SPRINT: ${stats.sprint || 0} clientes`);
    log(`  🏷️ MÚLTIPLAS: ${stats.multiplas || 0} clientes`);
    log(`  ❌ SEM MARCAÇÃO: ${stats.sem_marcacao || 0} clientes`);

  } catch (error) {
    log(`❌ Erro ao verificar resultados: ${error.message}`);
  }
}

// Executar
(async () => {
  await atualizarMarcacoesOrigem();
  await verificarResultados();
})();

