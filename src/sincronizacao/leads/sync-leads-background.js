import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

// ---- CONFIG CONSERVADORA ----
const CONFIG = {
  SPRINTHUB: {
    baseUrl: process.env.VITE_SPRINTHUB_BASE_URL || 'sprinthub-api-master.sprinthub.app',
    apiToken: process.env.VITE_SPRINTHUB_API_TOKEN || '',
    instance: process.env.VITE_SPRINTHUB_INSTANCE || 'oficialmed',
    PAGE_LIMIT: 200, // Máximo por página
    DELAY_BETWEEN_PAGES: 1000, // 1 segundo entre páginas (60 req/min)
    MAX_RETRIES: 3
  },
  SUPABASE: {
    url: process.env.VITE_SUPABASE_URL,
    key: process.env.VITE_SUPABASE_SERVICE_ROLE_KEY
  },
  CHECKPOINT_FILE: path.join(__dirname, 'checkpoint-leads-background.json'),
  LOG_FILE: path.join(__dirname, 'sync-leads-background.log')
};

// Inicializar Supabase
const supabase = createClient(CONFIG.SUPABASE.url, CONFIG.SUPABASE.key, {
  db: { schema: 'api' }
});

// Função para log
function log(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}`;
  console.log(logMessage);
  fs.appendFileSync(CONFIG.LOG_FILE, logMessage + '\n');
}

// Função para fazer requisição com retry
async function fetchWithRetry(url, retries = CONFIG.SPRINTHUB.MAX_RETRIES) {
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
          log(`⚠️ Rate limit atingido. Aguardando 60 segundos...`);
          await new Promise(resolve => setTimeout(resolve, 60000));
          continue;
        }
      }

      if (response.ok) {
        return await response.json();
      }

      throw new Error(`HTTP ${response.status}`);
    } catch (error) {
      log(`❌ Tentativa ${i + 1}/${retries} falhou: ${error.message}`);
      if (i === retries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 2000 * (i + 1)));
    }
  }
}

// Função para buscar detalhes dos leads
async function fetchLeadDetails(leadIds) {
  const details = [];
  
  for (const id of leadIds) {
    try {
      const url = `https://${CONFIG.SPRINTHUB.baseUrl}/leads/${id}?i=${CONFIG.SPRINTHUB.instance}&apitoken=${CONFIG.SPRINTHUB.apiToken}`;
      const data = await fetchWithRetry(url);
      
      if (data && data.data) {
        details.push(data.data);
      }
    } catch (error) {
      log(`❌ Erro ao buscar detalhes do lead ${id}: ${error.message}`);
    }
  }
  
  return details;
}

// Função para inserir leads no Supabase
async function insertLeads(leads) {
  if (leads.length === 0) return { success: 0, errors: 0 };

  const batchSize = 100;
  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < leads.length; i += batchSize) {
    const batch = leads.slice(i, i + batchSize);
    
    try {
      const { data, error } = await supabase
        .from('leads')
        .upsert(batch, { 
          onConflict: 'id',
          ignoreDuplicates: false 
        });

      if (error) {
        log(`❌ Erro no lote ${Math.floor(i/batchSize) + 1}: ${error.message}`);
        errorCount += batch.length;
      } else {
        successCount += batch.length;
      }
    } catch (err) {
      log(`❌ Erro no lote ${Math.floor(i/batchSize) + 1}: ${err.message}`);
      errorCount += batch.length;
    }
  }

  return { success: successCount, errors: errorCount };
}

// Função principal de sincronização
async function syncLeadsBackground() {
  log('🚀 Iniciando sincronização em background...');
  
  // Carregar checkpoint
  let checkpoint = { lastPage: 0, totalProcessed: 0, totalErrors: 0 };
  if (fs.existsSync(CONFIG.CHECKPOINT_FILE)) {
    checkpoint = JSON.parse(fs.readFileSync(CONFIG.CHECKPOINT_FILE, 'utf8'));
    log(`📄 Checkpoint carregado: página ${checkpoint.lastPage}`);
  }

  let currentPage = checkpoint.lastPage + 1;
  let totalProcessed = checkpoint.totalProcessed;
  let totalErrors = checkpoint.totalErrors;
  let hasMorePages = true;

  while (hasMorePages) {
    try {
      log(`📄 Processando página ${currentPage}...`);
      
      // Buscar página de leads
      const url = `https://${CONFIG.SPRINTHUB.baseUrl}/leads?i=${CONFIG.SPRINTHUB.instance}&page=${currentPage}&limit=${CONFIG.SPRINTHUB.PAGE_LIMIT}&apitoken=${CONFIG.SPRINTHUB.apiToken}`;
      const response = await fetchWithRetry(url);
      
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

      // Buscar detalhes dos leads
      const leadIds = leads.map(lead => lead.id).filter(id => id);
      log(`🔍 Buscando detalhes de ${leadIds.length} leads...`);
      
      const leadDetails = await fetchLeadDetails(leadIds);
      log(`✅ ${leadDetails.length} detalhes obtidos`);

      // Preparar dados para inserção
      const leadsToInsert = leadDetails.map(lead => ({
        id: lead.id,
        nome_completo: lead.nome_completo || lead.name || '',
        email: lead.email || '',
        telefone: lead.telefone || lead.phone || '',
        whatsapp: lead.whatsapp || '',
        endereco_logradouro: lead.endereco_logradouro || lead.address || '',
        endereco_numero: lead.endereco_numero || lead.number || '',
        endereco_complemento: lead.endereco_complemento || lead.complement || '',
        endereco_bairro: lead.endereco_bairro || lead.neighborhood || '',
        endereco_cidade: lead.endereco_cidade || lead.city || '',
        endereco_estado: lead.endereco_estado || lead.state || '',
        endereco_cep: lead.endereco_cep || lead.zipcode || '',
        endereco_pais: lead.endereco_pais || lead.country || 'Brasil',
        status: lead.status || 'Novo',
        origem: lead.origem || lead.source || '',
        fonte: lead.fonte || lead.source || '',
        campanha: lead.campanha || lead.campaign || '',
        segmento: lead.segmento || lead.segment || '',
        categoria: lead.categoria || lead.category || '',
        ultimo_contato: lead.ultimo_contato || lead.last_contact || null,
        proximo_contato: lead.proximo_contato || lead.next_contact || null,
        observacoes: lead.observacoes || lead.notes || '',
        notas: lead.notas || lead.notes || '',
        tags: lead.tags || [],
        valor_interesse: lead.valor_interesse || lead.value || null,
        produto_interesse: lead.produto_interesse || lead.product || '',
        probabilidade_venda: lead.probabilidade_venda || lead.probability || null,
        etapa_venda: lead.etapa_venda || lead.stage || '',
        ip_usuario: lead.ip_usuario || lead.ip || '',
        user_agent: lead.user_agent || lead.user_agent || '',
        dispositivo: lead.dispositivo || lead.device || '',
        navegador: lead.navegador || lead.browser || '',
        sistema_operacional: lead.sistema_operacional || lead.os || '',
        data_cadastro: lead.data_cadastro || lead.created_at || new Date().toISOString(),
        data_ultima_atualizacao: lead.data_ultima_atualizacao || lead.updated_at || new Date().toISOString(),
        synced_at: new Date().toISOString()
      }));

      // Inserir no Supabase
      const { success, errors } = await insertLeads(leadsToInsert);
      totalProcessed += success;
      totalErrors += errors;
      
      log(`✅ Página ${currentPage}: ${success} inseridos, ${errors} erros`);
      log(`📊 Total: ${totalProcessed} processados, ${totalErrors} erros`);

      // Salvar checkpoint
      checkpoint = { lastPage: currentPage, totalProcessed, totalErrors };
      fs.writeFileSync(CONFIG.CHECKPOINT_FILE, JSON.stringify(checkpoint));

      // Verificar se há mais páginas
      hasMorePages = leads.length === CONFIG.SPRINTHUB.PAGE_LIMIT;
      currentPage++;

      // Delay entre páginas
      if (hasMorePages) {
        log(`⏳ Aguardando ${CONFIG.SPRINTHUB.DELAY_BETWEEN_PAGES}ms antes da próxima página...`);
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
  log(`  ✅ Total processados: ${totalProcessed}`);
  log(`  ❌ Total erros: ${totalErrors}`);
  
  // Limpar checkpoint
  if (fs.existsSync(CONFIG.CHECKPOINT_FILE)) {
    fs.unlinkSync(CONFIG.CHECKPOINT_FILE);
  }
}

// Executar sincronização
syncLeadsBackground().catch(error => {
  log(`💥 Erro fatal: ${error.message}`);
  process.exit(1);
});