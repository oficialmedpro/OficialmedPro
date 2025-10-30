const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Configuração
const CONFIG = {
  SPRINTHUB: {
    baseUrl: process.env.VITE_SPRINTHUB_BASE_URL || 'sprinthub-api-master.sprinthub.app',
    apiToken: process.env.VITE_SPRINTHUB_API_TOKEN || '',
    instance: process.env.VITE_SPRINTHUB_INSTANCE || 'oficialmed',
    PAGE_LIMIT: 200,
    DELAY_BETWEEN_PAGES: 120000 // 2 minutos entre páginas (muito conservador)
  },
  SUPABASE: {
    url: process.env.VITE_SUPABASE_URL,
    key: process.env.VITE_SUPABASE_SERVICE_ROLE_KEY
  }
};

// Inicializar Supabase
const supabase = createClient(CONFIG.SUPABASE.url, CONFIG.SUPABASE.key, {
  db: { schema: 'api' }
});

// Função para log
function log(message) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${message}`);
}

// Função para aguardar rate limit
async function waitForRateLimit() {
  log('⏳ Aguardando rate limit resetar (5 minutos)...');
  await new Promise(resolve => setTimeout(resolve, 300000)); // 5 minutos
  log('✅ Aguardou 5 minutos, tentando novamente...');
}

// Função para fazer requisição com retry
async function fetchSprinthubData(url, retries = 5) {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${CONFIG.SPRINTHUB.apiToken}`,
          'apitoken': CONFIG.SPRINTHUB.apiToken
        }
      });

      if (response.status === 401) {
        const errorData = await response.json();
        if (errorData.msg && errorData.msg.includes('too many requests')) {
          log(`⚠️ Rate limit ainda ativo (tentativa ${i + 1}/${retries})`);
          if (i < retries - 1) {
            await waitForRateLimit();
            continue;
          }
        }
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      log(`❌ Tentativa ${i + 1}/${retries} falhou: ${error.message}`);
      if (i === retries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 10000));
    }
  }
}

// Função para inserir leads
async function insertLeads(leads) {
  if (leads.length === 0) return { success: 0, errors: 0 };

  try {
    const { data, error } = await supabase
      .from('leads')
      .upsert(leads, { 
        onConflict: 'id',
        ignoreDuplicates: false 
      });

    if (error) {
      log(`❌ Erro na inserção: ${error.message}`);
      return { success: 0, errors: leads.length };
    }

    return { success: leads.length, errors: 0 };
  } catch (err) {
    log(`❌ Erro na inserção: ${err.message}`);
    return { success: 0, errors: leads.length };
  }
}

// Função principal
async function syncLeadsUltraConservative() {
  log('🚀 Iniciando sincronização ULTRA CONSERVADORA...');
  
  let currentPage = 1;
  let totalProcessed = 0;
  let totalInserted = 0;
  let totalErrors = 0;
  let hasMorePages = true;

  while (hasMorePages) {
    try {
      log(`📄 Processando página ${currentPage}...`);
      
      // Buscar página de leads
      const url = `https://${CONFIG.SPRINTHUB.baseUrl}/leads?i=${CONFIG.SPRINTHUB.instance}&page=${currentPage}&limit=${CONFIG.SPRINTHUB.PAGE_LIMIT}&apitoken=${CONFIG.SPRINTHUB.apiToken}`;
      const response = await fetchSprinthubData(url);
      
      if (!response || !response.data || !response.data.leads) {
        log('❌ Resposta inválida da API');
        break;
      }

      const leads = response.data.leads;
      log(`📊 ${leads.length} leads encontrados na página ${currentPage}`);

      if (leads.length === 0) {
        log('✅ Não há mais leads para processar');
        hasMorePages = false;
        break;
      }

      // Preparar dados para inserção
      const leadsToInsert = leads.map(lead => ({
        id: lead.id,
        nome_completo: lead.nome_completo || lead.name || '',
        email: lead.email || '',
        telefone: lead.telefone || lead.phone || '',
        whatsapp: lead.whatsapp || '',
        status: lead.status || 'Novo',
        origem: lead.origem || lead.source || '',
        fonte: lead.fonte || lead.source || '',
        data_cadastro: lead.data_cadastro || lead.created_at || new Date().toISOString(),
        data_ultima_atualizacao: lead.data_ultima_atualizacao || lead.updated_at || new Date().toISOString(),
        synced_at: new Date().toISOString()
      }));

      // Inserir no Supabase
      const { success, errors } = await insertLeads(leadsToInsert);
      totalProcessed += leads.length;
      totalInserted += success;
      totalErrors += errors;
      
      log(`✅ Página ${currentPage}: ${success} inseridos, ${errors} erros`);
      log(`📊 Total: ${totalProcessed} processados, ${totalInserted} inseridos, ${totalErrors} erros`);

      // Verificar se há mais páginas
      hasMorePages = leads.length === CONFIG.SPRINTHUB.PAGE_LIMIT;
      currentPage++;

      // Delay entre páginas (ULTRA CONSERVADOR)
      if (hasMorePages) {
        log(`⏳ Aguardando ${CONFIG.SPRINTHUB.DELAY_BETWEEN_PAGES/1000} segundos antes da próxima página...`);
        await new Promise(resolve => setTimeout(resolve, CONFIG.SPRINTHUB.DELAY_BETWEEN_PAGES));
      }

    } catch (error) {
      log(`❌ Erro na página ${currentPage}: ${error.message}`);
      totalErrors++;
      
      // Aguardar antes de tentar novamente
      await new Promise(resolve => setTimeout(resolve, 30000)); // 30 segundos
    }
  }

  log('🎉 Sincronização concluída!');
  log(`📊 RESUMO FINAL:`);
  log(`  📄 Total processados: ${totalProcessed}`);
  log(`  ✅ Total inseridos: ${totalInserted}`);
  log(`  ❌ Total erros: ${totalErrors}`);
}

// Executar sincronização
syncLeadsUltraConservative().catch(error => {
  log(`💥 Erro fatal: ${error.message}`);
  process.exit(1);
});

