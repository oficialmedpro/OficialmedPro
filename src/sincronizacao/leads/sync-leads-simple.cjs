const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Configuração simples
const CONFIG = {
  SPRINTHUB: {
    baseUrl: process.env.VITE_SPRINTHUB_BASE_URL || 'sprinthub-api-master.sprinthub.app',
    apiToken: process.env.VITE_SPRINTHUB_API_TOKEN || '',
    instance: process.env.VITE_SPRINTHUB_INSTANCE || 'oficialmed',
    PAGE_LIMIT: 200,
    DELAY_BETWEEN_PAGES: 2000 // 2 segundos entre páginas
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

// Função para fazer requisição
async function fetchSprinthubData(url) {
  try {
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${CONFIG.SPRINTHUB.apiToken}`,
        'apitoken': CONFIG.SPRINTHUB.apiToken
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    log(`❌ Erro na requisição: ${error.message}`);
    throw error;
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
async function syncLeadsSimple() {
  log('🚀 Iniciando sincronização simples...');
  
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

      // Preparar dados para inserção (usando dados básicos da lista)
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

      // Delay entre páginas
      if (hasMorePages) {
        log(`⏳ Aguardando ${CONFIG.SPRINTHUB.DELAY_BETWEEN_PAGES}ms...`);
        await new Promise(resolve => setTimeout(resolve, CONFIG.SPRINTHUB.DELAY_BETWEEN_PAGES));
      }

    } catch (error) {
      log(`❌ Erro na página ${currentPage}: ${error.message}`);
      totalErrors++;
      
      // Aguardar antes de tentar novamente
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }

  log('🎉 Sincronização concluída!');
  log(`📊 RESUMO FINAL:`);
  log(`  📄 Total processados: ${totalProcessed}`);
  log(`  ✅ Total inseridos: ${totalInserted}`);
  log(`  ❌ Total erros: ${totalErrors}`);
}

// Executar sincronização
syncLeadsSimple().catch(error => {
  log(`💥 Erro fatal: ${error.message}`);
  process.exit(1);
});

