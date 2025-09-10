#!/usr/bin/env node

/**
 * 🔄 SINCRONIZAÇÃO COMPLETA FUNIL 14 (RECOMPRA) - SCRIPT NODE.JS
 * 
 * Sincroniza TODAS as 3.137 oportunidades do funil 14 do SprintHub para o Supabase
 * Estimativa: 5-10 minutos (muito mais rápido que no browser)
 */

import https from 'https';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente do arquivo .env
dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Configurações
const CONFIG = {
  // SprintHub
  SPRINTHUB: {
    baseUrl: process.env.VITE_SPRINTHUB_BASE_URL || 'sprinthub-api-master.sprinthub.app',
    apiToken: process.env.VITE_SPRINTHUB_API_TOKEN || '9ad36c85-5858-4960-9935-e73c3698dd0c',
    instance: process.env.VITE_SPRINTHUB_INSTANCE || 'oficialmed'
  },
  
  // Supabase
  SUPABASE: {
    url: process.env.VITE_SUPABASE_URL,
    key: process.env.VITE_SUPABASE_SERVICE_ROLE_KEY
  },
  
  // Funil 14 (RECOMPRA)
  FUNIL_14_STAGES: [202, 228, 229, 206, 203, 204, 230, 205, 241, 146, 167, 148, 168, 149, 169, 150], // Etapas corretas do Funil 14 RECOMPRA
  TARGET_FUNNEL: 14,
  PAGE_LIMIT: 100,
  BATCH_SIZE: 10, // Processar 10 oportunidades em paralelo
  
  // Checkpoint para recuperação
  CHECKPOINT_FILE: './sync-checkpoint.json'
};

// Cores para terminal
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

// Estatísticas globais
let stats = {
  startTime: Date.now(),
  totalProcessed: 0,
  totalInserted: 0,
  totalUpdated: 0,
  totalSkipped: 0,
  totalErrors: 0,
  totalApiCalls: 0,
  currentStage: 0,
  currentPage: 0
};

// Função para fazer requisições HTTP
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const isHttps = url.startsWith('https://');
    const lib = isHttps ? https : http;
    
    const req = lib.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ ok: res.statusCode >= 200 && res.statusCode < 300, status: res.statusCode, data: parsed });
        } catch (error) {
          resolve({ ok: res.statusCode >= 200 && res.statusCode < 300, status: res.statusCode, data });
        }
      });
    });
    
    req.on('error', reject);
    
    if (options.body) {
      req.write(options.body);
    }
    
    req.end();
  });
}

// Função para fazer POST
async function postRequest(url, data, headers = {}) {
  const body = JSON.stringify(data);
  const options = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(body),
      ...headers
    },
    body
  };
  
  return makeRequest(url, options);
}

// Função para fazer GET
async function getRequest(url, headers = {}) {
  const options = {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...headers
    }
  };
  
  return makeRequest(url, options);
}

// Inserir registro na tabela api.sincronizacao (via perfil "api")
async function insertSyncRecord(description) {
  try {
    const url = `${CONFIG.SUPABASE.url}/rest/v1/sincronizacao`;
    const payload = {
      created_at: new Date().toISOString(),
      data: new Date().toISOString(),
      descricao: description
    };
    const response = await postRequest(url, payload, {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Bearer ${CONFIG.SUPABASE.key}`,
      'apikey': CONFIG.SUPABASE.key,
      'Accept-Profile': 'api',
      'Content-Profile': 'api',
      'Prefer': 'return=minimal'
    });
    if (response.ok) {
      console.log(`${colors.green}📝 Registro de sincronização salvo em api.sincronizacao${colors.reset}`);
    } else {
      console.log(`${colors.yellow}⚠️ Falha ao salvar registro de sincronização (HTTP ${response.status})${colors.reset}`);
    }
  } catch (error) {
    console.log(`${colors.yellow}⚠️ Erro ao registrar sincronização: ${error.message}${colors.reset}`);
  }
}

// Função para fazer PATCH
async function patchRequest(url, data, headers = {}) {
  const body = JSON.stringify(data);
  const options = {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(body),
      'Prefer': 'return=minimal',
      ...headers
    },
    body
  };
  
  return makeRequest(url, options);
}

// Função para mostrar progress
function showProgress(current, total, details = '') {
  const percentage = Math.round((current / total) * 100);
  const barLength = 40;
  const filledLength = Math.round(barLength * (current / total));
  const bar = '█'.repeat(filledLength) + '░'.repeat(barLength - filledLength);
  
  process.stdout.write(`\r${colors.cyan}[${bar}] ${percentage}% (${current}/${total}) ${details}${colors.reset}`);
  
  if (current === total) {
    process.stdout.write('\n');
  }
}

// Função para mapear funil → unidade
function getFunnelUnit(funnelId) {
  const funnelUnitMap = {
    6: '[1]',   // Funil COMERCIAL → Apucarana  
    14: '[1]',  // Funil RECOMPRA → Apucarana
    // Futuras unidades podem ser adicionadas aqui:
    // 7: '[2]',   // Exemplo: Funil X → Unidade Y
    // 15: '[3]',  // Exemplo: Funil Z → Unidade Z
  };
  
  return funnelUnitMap[funnelId] || '[1]'; // Default para Apucarana se não mapeado
}

// Função para mapear campos da oportunidade
function mapOpportunityFields(opportunity) {
  const fields = opportunity.fields || {};
  const lead = opportunity.dataLead || {};
  const utmTags = (lead.utmTags && lead.utmTags[0]) || {};

  return {
    id: opportunity.id,
    title: opportunity.title,
    value: parseFloat(opportunity.value) || 0.00,
    crm_column: opportunity.crm_column,
    lead_id: opportunity.lead_id,
    status: opportunity.status,
    loss_reason: opportunity.loss_reason || null,
    gain_reason: opportunity.gain_reason || null,
    user_id: opportunity.user || null,
    
    // Datas importantes
    create_date: opportunity.createDate ? new Date(opportunity.createDate).toISOString() : null,
    update_date: opportunity.updateDate ? new Date(opportunity.updateDate).toISOString() : null,
    lost_date: opportunity.lost_date || null,
    gain_date: opportunity.gain_date || null,
    
    // Campos específicos
    origem_oportunidade: fields["ORIGEM OPORTUNIDADE"] || null,
    qualificacao: fields["QUALIFICACAO"] || null,
    status_orcamento: fields["Status Orcamento"] || null,
    
    // UTM
    utm_source: utmTags.utmSource || null,
    utm_campaign: utmTags.utmCampaign || null,
    utm_medium: utmTags.utmMedium || null,
    
    // Lead
    lead_firstname: lead.firstname || null,
    lead_email: lead.email || null,
    lead_whatsapp: lead.whatsapp || null,
    
    // Controle
    archived: opportunity.archived || 0,
    synced_at: new Date().toISOString(),
    
    // Funil
    funil_id: CONFIG.TARGET_FUNNEL,
    unidade_id: getFunnelUnit(CONFIG.TARGET_FUNNEL)
  };
}

// Função para verificar se oportunidade existe no Supabase
async function checkInSupabase(opportunityId) {
  try {
    const url = `${CONFIG.SUPABASE.url}/rest/v1/oportunidade_sprint?select=id,synced_at&id=eq.${opportunityId}`;
    const response = await getRequest(url, {
      'Accept': 'application/json',
      'Authorization': `Bearer ${CONFIG.SUPABASE.key}`,
      'apikey': CONFIG.SUPABASE.key,
      'Accept-Profile': 'api'
    });

    if (response.ok && Array.isArray(response.data) && response.data.length > 0) {
      return response.data[0];
    }
    return null;
  } catch (error) {
    console.error(`${colors.red}❌ Erro ao verificar ID ${opportunityId}:${colors.reset}`, error.message);
    return null;
  }
}

// Função para inserir no Supabase
async function insertToSupabase(data) {
  try {
    const url = `${CONFIG.SUPABASE.url}/rest/v1/oportunidade_sprint`;
    const response = await postRequest(url, data, {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Bearer ${CONFIG.SUPABASE.key}`,
      'apikey': CONFIG.SUPABASE.key,
      'Accept-Profile': 'api',
      'Content-Profile': 'api',
      'Prefer': 'return=representation'
    });

    return { success: response.ok, status: response.status, data: response.data };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Função para atualizar no Supabase
async function updateInSupabase(opportunityId, data) {
  try {
    const url = `${CONFIG.SUPABASE.url}/rest/v1/oportunidade_sprint?id=eq.${opportunityId}`;
    const response = await patchRequest(url, data, {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Bearer ${CONFIG.SUPABASE.key}`,
      'apikey': CONFIG.SUPABASE.key,
      'Accept-Profile': 'api',
      'Content-Profile': 'api',
      'Prefer': 'return=representation'
    });

    return { success: response.ok, status: response.status };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Função para processar oportunidade individual
async function processOpportunity(opp) {
  try {
    stats.totalProcessed++;
    
    // Verificar se já existe
    const existingRecord = await checkInSupabase(opp.id);
    const mappedData = mapOpportunityFields(opp);

    if (!existingRecord) {
      // INSERIR: Registro não existe
      const result = await insertToSupabase(mappedData);
      
      if (result.success) {
        stats.totalInserted++;
        return { status: 'inserted', id: opp.id, title: opp.title };
      } else {
        stats.totalErrors++;
        return { status: 'error', id: opp.id, error: `Insert failed: ${result.status}` };
      }
    } else {
      // ATUALIZAR: Registro existe, verificar se precisa atualizar
      const existingSyncedAt = new Date(existingRecord.synced_at || 0);
      const daysSinceSync = (Date.now() - existingSyncedAt.getTime()) / (1000 * 60 * 60 * 24);
      
      if (daysSinceSync > 1) { // Atualizar se não foi sincronizado há mais de 1 dia
        const result = await updateInSupabase(opp.id, mappedData);
        
        if (result.success) {
          stats.totalUpdated++;
          return { status: 'updated', id: opp.id, title: opp.title };
        } else {
          stats.totalErrors++;
          return { status: 'error', id: opp.id, error: `Update failed: ${result.status}` };
        }
      } else {
        stats.totalSkipped++;
        return { status: 'skipped', id: opp.id, title: opp.title };
      }
    }
  } catch (error) {
    stats.totalErrors++;
    return { status: 'error', id: opp.id, error: error.message };
  }
}

// Função para processar batch de oportunidades
async function processBatch(opportunities) {
  const promises = opportunities.map(processOpportunity);
  return await Promise.all(promises);
}

// Função para buscar oportunidades de uma página
async function fetchOpportunitiesPage(stageId, page) {
  try {
    stats.totalApiCalls++;
    
    const postData = {
      page,
      limit: CONFIG.PAGE_LIMIT,
      columnId: stageId
    };

    const url = `https://${CONFIG.SPRINTHUB.baseUrl}/crm/opportunities/${CONFIG.TARGET_FUNNEL}?apitoken=${CONFIG.SPRINTHUB.apiToken}&i=${CONFIG.SPRINTHUB.instance}`;
    const response = await postRequest(url, postData);

    if (response.ok) {
      return Array.isArray(response.data) ? response.data : [];
    } else {
      throw new Error(`HTTP ${response.status}: ${JSON.stringify(response.data)}`);
    }
  } catch (error) {
    console.error(`${colors.red}❌ Erro na página ${page + 1} da etapa ${stageId}:${colors.reset}`, error.message);
    return [];
  }
}

// Função para salvar checkpoint
function saveCheckpoint() {
  const checkpoint = {
    ...stats,
    timestamp: new Date().toISOString()
  };
  
  try {
    fs.writeFileSync(CONFIG.CHECKPOINT_FILE, JSON.stringify(checkpoint, null, 2));
  } catch (error) {
    console.error(`${colors.yellow}⚠️ Erro ao salvar checkpoint:${colors.reset}`, error.message);
  }
}

// Função para carregar checkpoint
function loadCheckpoint() {
  try {
    if (fs.existsSync(CONFIG.CHECKPOINT_FILE)) {
      const data = fs.readFileSync(CONFIG.CHECKPOINT_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error(`${colors.yellow}⚠️ Erro ao carregar checkpoint:${colors.reset}`, error.message);
  }
  return null;
}

// Função principal
async function main() {
  console.log(`${colors.cyan}🔄 SINCRONIZAÇÃO COMPLETA FUNIL 14 (RECOMPRA)${colors.reset}`);
  console.log(`${colors.cyan}===============================================${colors.reset}`);
  console.log(`${colors.blue}🎯 Objetivo: Sincronizar TODAS as oportunidades do funil 14${colors.reset}`);
  console.log(`${colors.blue}📊 Estimativa: ~3.137 oportunidades${colors.reset}`);
  console.log(`${colors.blue}⏱️ Tempo estimado: 5-10 minutos${colors.reset}`);
  console.log(`${colors.blue}🔧 Processamento paralelo: ${CONFIG.BATCH_SIZE} por vez${colors.reset}`);
  console.log('');

  // Verificar se as variáveis de ambiente estão definidas
  if (!CONFIG.SUPABASE.url || !CONFIG.SUPABASE.key) {
    console.error(`${colors.red}❌ ERRO: Variáveis de ambiente não encontradas${colors.reset}`);
    console.log(`${colors.yellow}💡 Verifique se o arquivo .env existe e contém:${colors.reset}`);
    console.log(`${colors.yellow}VITE_SUPABASE_URL=https://...${colors.reset}`);
    console.log(`${colors.yellow}VITE_SUPABASE_SERVICE_ROLE_KEY=eyJ...${colors.reset}`);
    process.exit(1);
  }

  console.log(`${colors.green}✅ Configurações carregadas:${colors.reset}`);
  console.log(`${colors.blue}   Supabase URL: ${CONFIG.SUPABASE.url}${colors.reset}`);
  console.log(`${colors.blue}   SprintHub: ${CONFIG.SPRINTHUB.baseUrl}${colors.reset}`);
  console.log(`${colors.blue}   Instância: ${CONFIG.SPRINTHUB.instance}${colors.reset}`);
  console.log(`${colors.blue}   Funil: ${CONFIG.TARGET_FUNNEL} → Unidade: ${getFunnelUnit(CONFIG.TARGET_FUNNEL)}${colors.reset}`);

  // Verificar checkpoint anterior
  const checkpoint = loadCheckpoint();
  if (checkpoint) {
    console.log(`${colors.yellow}📂 Checkpoint encontrado de ${checkpoint.timestamp}${colors.reset}`);
    console.log(`${colors.yellow}   Processadas: ${checkpoint.totalProcessed}${colors.reset}`);
    console.log(`${colors.yellow}   Continuar de onde parou? (s/N)${colors.reset}`);
    
    // Por simplicidade, sempre começar do zero
    console.log(`${colors.blue}🔄 Iniciando sincronização completa...${colors.reset}\n`);
  }

  // Processar cada etapa do funil 14
  for (let stageIndex = 0; stageIndex < CONFIG.FUNIL_14_STAGES.length; stageIndex++) {
    const stageId = CONFIG.FUNIL_14_STAGES[stageIndex];
    stats.currentStage = stageIndex;
    
    console.log(`${colors.magenta}📋 ETAPA ${stageId} (${stageIndex + 1}/${CONFIG.FUNIL_14_STAGES.length})${colors.reset}`);
    console.log(`${colors.magenta}${'─'.repeat(50)}${colors.reset}`);

    let currentPage = 0;
    let hasMorePages = true;
    let stageInserted = 0;
    let stageUpdated = 0;
    let stageSkipped = 0;
    let stageErrors = 0;

    // Paginação completa para esta etapa
    while (hasMorePages) {
      stats.currentPage = currentPage;
      
      console.log(`${colors.blue}📄 Buscando página ${currentPage + 1}...${colors.reset}`);
      
      const opportunities = await fetchOpportunitiesPage(stageId, currentPage);
      
      if (opportunities.length === 0) {
        console.log(`${colors.blue}🏁 Fim da paginação da etapa ${stageId}${colors.reset}`);
        hasMorePages = false;
        break;
      }

      console.log(`${colors.blue}📊 ${opportunities.length} oportunidades encontradas na página ${currentPage + 1}${colors.reset}`);

      // Processar em batches
      for (let i = 0; i < opportunities.length; i += CONFIG.BATCH_SIZE) {
        const batch = opportunities.slice(i, i + CONFIG.BATCH_SIZE);
        const results = await processBatch(batch);
        
        // Contar resultados do batch
        results.forEach(result => {
          switch (result.status) {
            case 'inserted':
              stageInserted++;
              break;
            case 'updated':
              stageUpdated++;
              break;
            case 'skipped':
              stageSkipped++;
              break;
            case 'error':
              stageErrors++;
              console.error(`${colors.red}❌ Erro ID ${result.id}: ${result.error}${colors.reset}`);
              break;
          }
        });
        
        // Mostrar progress
        showProgress(i + batch.length, opportunities.length, `Etapa ${stageId}`);
      }

      currentPage++;
      if (opportunities.length < CONFIG.PAGE_LIMIT) {
        hasMorePages = false;
      }

      // Salvar checkpoint a cada página
      saveCheckpoint();
    }

    console.log(`${colors.green}✅ ETAPA ${stageId} CONCLUÍDA:${colors.reset}`);
    console.log(`${colors.green}   Inseridas: ${stageInserted}${colors.reset}`);
    console.log(`${colors.green}   Atualizadas: ${stageUpdated}${colors.reset}`);
    console.log(`${colors.green}   Já atualizadas: ${stageSkipped}${colors.reset}`);
    console.log(`${colors.red}   Erros: ${stageErrors}${colors.reset}`);
    console.log('');
  }

  // Relatório final
  const totalTime = (Date.now() - stats.startTime) / 1000;
  const successRate = ((stats.totalInserted + stats.totalUpdated + stats.totalSkipped) / stats.totalProcessed) * 100;

  console.log(`${colors.cyan}${'='.repeat(60)}${colors.reset}`);
  console.log(`${colors.cyan}📊 RELATÓRIO FINAL - SINCRONIZAÇÃO COMPLETA FUNIL 14${colors.reset}`);
  console.log(`${colors.cyan}${'='.repeat(60)}${colors.reset}`);
  console.log(`${colors.blue}🕒 Tempo de execução: ${totalTime.toFixed(2)}s (${(totalTime/60).toFixed(1)} minutos)${colors.reset}`);
  console.log(`${colors.blue}🔄 Total de chamadas à API: ${stats.totalApiCalls}${colors.reset}`);
  console.log(`${colors.blue}📊 Total registros processados: ${stats.totalProcessed}${colors.reset}`);
  console.log(`${colors.blue}💾 ESTATÍSTICAS DE SINCRONIZAÇÃO:${colors.reset}`);
  console.log(`${colors.green}   ✅ Inseridos: ${stats.totalInserted}${colors.reset}`);
  console.log(`${colors.green}   🔄 Atualizados: ${stats.totalUpdated}${colors.reset}`);
  console.log(`${colors.yellow}   ⚪ Já atualizados: ${stats.totalSkipped}${colors.reset}`);
  console.log(`${colors.red}   ❌ Erros: ${stats.totalErrors}${colors.reset}`);
  console.log(`${colors.blue}📈 Taxa de sucesso: ${successRate.toFixed(2)}%${colors.reset}`);
  console.log(`${colors.cyan}${'='.repeat(60)}${colors.reset}`);
  console.log(`${colors.green}✅ SINCRONIZAÇÃO COMPLETA FUNIL 14 CONCLUÍDA!${colors.reset}`);
  console.log(`${colors.cyan}${'='.repeat(60)}${colors.reset}`);

  // Registrar na tabela sincronizacao
  const description = `Sync completa F14: processadas ${stats.totalProcessed} | inseridas ${stats.totalInserted} | atualizadas ${stats.totalUpdated} | ignoradas ${stats.totalSkipped} | erros ${stats.totalErrors}`;
  await insertSyncRecord(description);

  // Limpar checkpoint
  if (fs.existsSync(CONFIG.CHECKPOINT_FILE)) {
    fs.unlinkSync(CONFIG.CHECKPOINT_FILE);
  }
}

// Executar script sempre (quando não for importado)
main().catch(error => {
  console.error(`${colors.red}❌ ERRO FATAL:${colors.reset}`, error);
  process.exit(1);
});

export { main, CONFIG };