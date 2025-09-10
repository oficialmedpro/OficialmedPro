#!/usr/bin/env node

/**
 * 🕐 SINCRONIZAÇÃO HORÁRIA - FUNIS 6 E 14
 * 
 * Sincroniza oportunidades das últimas 48 horas de ambos os funis
 * Executa de hora em hora entre 6h e 23h
 * Otimizado para performance e atualizações incrementais
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
  
  // Funis e etapas
  FUNIS: {
    6: {
      name: 'COMERCIAL',
      stages: [130, 231, 82, 207, 83, 85, 232],
      unit: '[1]'
    },
    14: {
      name: 'RECOMPRA', 
      stages: [202, 228, 229, 206, 203, 204, 230, 205, 241, 146, 167, 148, 168, 149, 169, 150],
      unit: '[1]'
    }
  },
  
  // Configurações de sincronização
  HOURS_BACK: 48, // Últimas 48 horas
  PAGE_LIMIT: 50, // Menor para ser mais rápido
  BATCH_SIZE: 5,  // Menor para não sobrecarregar
  MAX_RETRIES: 3,
  
  // Horário de funcionamento
  START_HOUR: 6,  // 6h da manhã
  END_HOUR: 23,   // 11h da noite
  
  // Arquivos
  LOG_FILE: path.join(__dirname, 'hourly-sync.log')
};

// Cores para terminal
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

// Estatísticas globais
const stats = {
  startTime: Date.now(),
  totalApiCalls: 0,
  totalProcessed: 0,
  totalInserted: 0,
  totalUpdated: 0,
  totalSkipped: 0,
  totalErrors: 0,
  funis: {}
};

// Função para log com timestamp
function log(message, level = 'INFO') {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [${level}] ${message}`;
  
  console.log(logMessage);
  
  // Salvar no arquivo de log
  try {
    fs.appendFileSync(CONFIG.LOG_FILE, logMessage + '\n');
  } catch (error) {
    // Ignorar erros de log para não interromper o processo
  }
}

// Verificar se está no horário de funcionamento
function isWorkingHours() {
  // Se FORCE_SYNC está definido, sempre permitir
  if (process.env.FORCE_SYNC === 'true') {
    return true;
  }
  
  const now = new Date();
  const hour = now.getHours();
  return hour >= CONFIG.START_HOUR && hour <= CONFIG.END_HOUR;
}

// Função para fazer requisições HTTP usando fetch
async function makeRequest(url, options = {}) {
  try {
    const fetchOptions = {
      method: options.method || 'GET',
      headers: options.headers || {},
      body: options.body || null,
      timeout: 30000
    };

    const response = await fetch(url, fetchOptions);
    const rawText = await response.text();
    let data;
    try {
      data = rawText ? JSON.parse(rawText) : null;
    } catch (e) {
      data = rawText;
    }

    return {
      ok: response.ok,
      status: response.status,
      data: data
    };
  } catch (error) {
    throw new Error(`Request failed: ${error.message}`);
  }
}

// Função para POST
async function postRequest(url, data, headers = {}) {
  const options = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...headers
    },
    body: JSON.stringify(data)
  };
  
  return await makeRequest(url, options);
}

// Função para GET
async function getRequest(url, headers = {}) {
  const options = {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...headers
    }
  };
  
  return await makeRequest(url, options);
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
      'Authorization': `Bearer ${CONFIG.SUPABASE.key}`,
      'apikey': CONFIG.SUPABASE.key,
      'Accept-Profile': 'api',
      'Content-Profile': 'api',
      'Prefer': 'return=minimal'
    });
    if (response.ok) {
      log('📝 Registro de sincronização salvo em api.sincronizacao', 'INFO');
    } else {
      log(`⚠️ Falha ao salvar registro de sincronização (HTTP ${response.status}) Body: ${JSON.stringify(response.data)}`, 'ERROR');
    }
  } catch (error) {
    log(`⚠️ Erro ao registrar sincronização: ${error.message}`, 'ERROR');
  }
}

// Função para PATCH
async function patchRequest(url, data, headers = {}) {
  const options = {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...headers
    },
    body: JSON.stringify(data)
  };
  
  return await makeRequest(url, options);
}

// Função para mapear campos da oportunidade
function mapOpportunityFields(opportunity, funnelId) {
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
    funil_id: funnelId,
    unidade_id: CONFIG.FUNIS[funnelId].unit
  };
}

// Função para verificar se oportunidade existe no Supabase
async function checkInSupabase(opportunityId) {
  try {
    const url = `${CONFIG.SUPABASE.url}/rest/v1/oportunidade_sprint?select=id,synced_at,update_date&id=eq.${opportunityId}`;
    const response = await getRequest(url, {
      'Authorization': `Bearer ${CONFIG.SUPABASE.key}`,
      'apikey': CONFIG.SUPABASE.key,
      'Accept-Profile': 'api'
    });

    if (response.ok && Array.isArray(response.data) && response.data.length > 0) {
      return response.data[0];
    }
    return null;
  } catch (error) {
    log(`Erro ao verificar ID ${opportunityId}: ${error.message}`, 'ERROR');
    return null;
  }
}

// Função para inserir no Supabase
async function insertToSupabase(data) {
  try {
    const url = `${CONFIG.SUPABASE.url}/rest/v1/oportunidade_sprint`;
    const response = await postRequest(url, data, {
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

// Função para processar uma oportunidade
async function processOpportunity(opp, funnelId) {
  const existingRecord = await checkInSupabase(opp.id);
  const mappedData = mapOpportunityFields(opp, funnelId);

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
    const shouldUpdate = !existingRecord.synced_at || 
                        new Date(opp.updateDate) > new Date(existingRecord.synced_at);
    
    if (shouldUpdate) {
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
}

// Função para buscar oportunidades das últimas 48h de uma etapa
async function fetchRecentOpportunities(funnelId, stageId, page = 0) {
  try {
    stats.totalApiCalls++;
    
    // Data de 48 horas atrás
    const hoursAgo = new Date();
    hoursAgo.setHours(hoursAgo.getHours() - CONFIG.HOURS_BACK);
    const fromDate = hoursAgo.toISOString().split('T')[0]; // YYYY-MM-DD
    
    const postData = {
      page,
      limit: CONFIG.PAGE_LIMIT,
      columnId: stageId
      // Removido 'fromDate' porque a API não aceita esta propriedade (HTTP 400)
    };

    const url = `https://${CONFIG.SPRINTHUB.baseUrl}/crm/opportunities/${funnelId}?apitoken=${CONFIG.SPRINTHUB.apiToken}&i=${CONFIG.SPRINTHUB.instance}`;
    const response = await postRequest(url, postData);

    if (response.ok) {
      const data = Array.isArray(response.data) ? response.data : [];
      
      // Filtrar apenas oportunidades das últimas 48h
      const recentData = data.filter(opp => {
        if (!opp.updateDate) return false;
        const updateDate = new Date(opp.updateDate);
        return updateDate >= hoursAgo;
      });
      
      return recentData;
    } else {
      throw new Error(`HTTP ${response.status}: ${JSON.stringify(response.data)}`);
    }
  } catch (error) {
    log(`Erro ao buscar etapa ${stageId} do funil ${funnelId}: ${error.message}`, 'ERROR');
    return [];
  }
}

// Função para sincronizar um funil
async function syncFunnel(funnelId) {
  const funnelConfig = CONFIG.FUNIS[funnelId];
  const funnelStats = { inserted: 0, updated: 0, skipped: 0, errors: 0 };
  
  log(`Iniciando sincronização Funil ${funnelId} (${funnelConfig.name})`);
  
  for (const stageId of funnelConfig.stages) {
    log(`Processando etapa ${stageId}...`);
    
    let page = 0;
    let hasMore = true;
    
    while (hasMore) {
      const opportunities = await fetchRecentOpportunities(funnelId, stageId, page);
      
      if (opportunities.length === 0) {
        hasMore = false;
        continue;
      }
      
      // Processar em batches
      for (let i = 0; i < opportunities.length; i += CONFIG.BATCH_SIZE) {
        const batch = opportunities.slice(i, i + CONFIG.BATCH_SIZE);
        const batchPromises = batch.map(opp => processOpportunity(opp, funnelId));
        
        try {
          const results = await Promise.all(batchPromises);
          
          results.forEach(result => {
            if (result) {
              stats.totalProcessed++;
              
              if (result.status === 'inserted') {
                funnelStats.inserted++;
              } else if (result.status === 'updated') {
                funnelStats.updated++;
              } else if (result.status === 'skipped') {
                funnelStats.skipped++;
              } else if (result.status === 'error') {
                funnelStats.errors++;
                log(`Erro ID ${result.id}: ${result.error}`, 'ERROR');
              }
            }
          });
          
        } catch (error) {
          log(`Erro no batch: ${error.message}`, 'ERROR');
          funnelStats.errors += CONFIG.BATCH_SIZE;
        }
      }
      
      page++;
      
      // Se retornou menos que o limite, provavelmente acabou
      if (opportunities.length < CONFIG.PAGE_LIMIT) {
        hasMore = false;
      }
    }
  }
  
  stats.funis[funnelId] = funnelStats;
  log(`Funil ${funnelId} concluído: ${funnelStats.inserted} inseridas, ${funnelStats.updated} atualizadas, ${funnelStats.skipped} ignoradas, ${funnelStats.errors} erros`);
}

// Função principal
async function main() {
  // Verificar horário de funcionamento
  if (!isWorkingHours()) {
    const now = new Date();
    log(`Fora do horário de funcionamento (${now.getHours()}h). Execute entre ${CONFIG.START_HOUR}h e ${CONFIG.END_HOUR}h.`, 'INFO');
    process.exit(0);
  }
  
  log(`🕐 INICIANDO SINCRONIZAÇÃO HORÁRIA - ${new Date().toLocaleString('pt-BR')}`);
  log(`📊 Buscando oportunidades das últimas ${CONFIG.HOURS_BACK} horas`);
  
  // Verificar variáveis de ambiente
  if (!CONFIG.SUPABASE.url || !CONFIG.SUPABASE.key) {
    log('ERRO: Variáveis de ambiente não encontradas', 'ERROR');
    process.exit(1);
  }
  
  try {
    // Sincronizar ambos os funis
    for (const funnelId of Object.keys(CONFIG.FUNIS)) {
      await syncFunnel(parseInt(funnelId));
    }
    
    // Relatório final
    const endTime = Date.now();
    const totalTime = (endTime - stats.startTime) / 1000;
    
    log(`✅ SINCRONIZAÇÃO CONCLUÍDA em ${totalTime.toFixed(1)}s`);
    log(`📊 RESUMO: ${stats.totalProcessed} processadas | ${stats.totalInserted} inseridas | ${stats.totalUpdated} atualizadas | ${stats.totalSkipped} ignoradas | ${stats.totalErrors} erros`);
    log(`🔄 Chamadas API: ${stats.totalApiCalls}`);
    
    // Log por funil
    Object.entries(stats.funis).forEach(([funnelId, funnelStats]) => {
      const funnelName = CONFIG.FUNIS[funnelId].name;
      log(`📋 Funil ${funnelId} (${funnelName}): +${funnelStats.inserted} ~${funnelStats.updated} =${funnelStats.skipped} !${funnelStats.errors}`);
    });

    // Registrar na tabela sincronizacao
    const description = `Sync horária concluída: processadas ${stats.totalProcessed} | inseridas ${stats.totalInserted} | atualizadas ${stats.totalUpdated} | ignoradas ${stats.totalSkipped} | erros ${stats.totalErrors}`;
    await insertSyncRecord(description);
    
  } catch (error) {
    log(`ERRO FATAL: ${error.message}`, 'ERROR');
    process.exit(1);
  }
}

// Executar script
main().catch(error => {
  log(`ERRO FATAL: ${error.message}`, 'ERROR');
  process.exit(1);
});

export { main, CONFIG };