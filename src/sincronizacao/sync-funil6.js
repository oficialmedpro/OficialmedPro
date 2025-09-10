#!/usr/bin/env node

/**
 * 🔄 SINCRONIZAÇÃO COMPLETA FUNIL 6 (COMERCIAL) - SCRIPT NODE.JS
 * 
 * Sincroniza TODAS as oportunidades do funil 6 do SprintHub para o Supabase
 * Estimativa: 10-15 minutos (funil com mais oportunidades que o 14)
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
  
  // Funil 6 (COMERCIAL) - Etapas corretas confirmadas pelo usuário
  FUNIL_6_STAGES: [130, 231, 82, 207, 83, 85, 232], // [0] ENTRADA: 130, [1] ACOLHIMENTO/TRIAGEM: 231, [2] QUALIFICADO: 82, [3] ORÇAMENTO REALIZADO: 207, [4] NEGOCIAÇÃO: 83, [5] FOLLOW UP: 85, [6] CADASTRO: 232
  TARGET_FUNNEL: 6,
  PAGE_LIMIT: 100,
  BATCH_SIZE: 10, // Processar 10 oportunidades em paralelo
  
  // Arquivos
  CHECKPOINT_FILE: path.join(__dirname, 'checkpoint-funil6.json')
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
  totalApiCalls: 0,
  totalProcessed: 0,
  totalInserted: 0,
  totalUpdated: 0,
  totalSkipped: 0,
  totalErrors: 0,
  currentStage: 0,
  startTime: null
};

// Função para fazer requisições HTTP usando fetch (mais confiável)
async function makeRequest(url, options = {}) {
  try {
    const fetchOptions = {
      method: options.method || 'GET',
      headers: options.headers || {},
      body: options.body || null,
      timeout: 30000
    };

    const response = await fetch(url, fetchOptions);
    let data;
    
    try {
      data = await response.json();
    } catch {
      data = await response.text();
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

// Função para processar uma oportunidade individual
async function processOpportunity(opp) {
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
    
    console.log(`${colors.yellow}🔍 DEBUG: Fazendo requisição para etapa ${stageId}, página ${page + 1}${colors.reset}`);
    console.log(`${colors.yellow}🔍 DEBUG: URL: ${url}${colors.reset}`);
    console.log(`${colors.yellow}🔍 DEBUG: POST data: ${JSON.stringify(postData)}${colors.reset}`);
    
    const response = await postRequest(url, postData);
    
    console.log(`${colors.yellow}🔍 DEBUG: Resposta recebida - Status: ${response.status}, OK: ${response.ok}${colors.reset}`);

    if (response.ok) {
      const data = Array.isArray(response.data) ? response.data : [];
      console.log(`${colors.yellow}🔍 DEBUG: ${data.length} oportunidades retornadas${colors.reset}`);
      return data;
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
    console.error(`${colors.yellow}⚠️ Não foi possível salvar checkpoint:${colors.reset}`, error.message);
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
  console.log(`${colors.cyan}🔄 SINCRONIZAÇÃO COMPLETA FUNIL 6 (COMERCIAL)${colors.reset}`);
  console.log(`${colors.cyan}===============================================${colors.reset}`);
  console.log(`${colors.blue}🎯 Objetivo: Sincronizar TODAS as oportunidades do funil 6${colors.reset}`);
  console.log(`${colors.blue}📊 Estimativa: ~13.700 oportunidades${colors.reset}`);
  console.log(`${colors.blue}⏱️ Tempo estimado: 10-15 minutos${colors.reset}`);
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

  // Processar cada etapa do funil 6
  for (let stageIndex = 0; stageIndex < CONFIG.FUNIL_6_STAGES.length; stageIndex++) {
    const stageId = CONFIG.FUNIL_6_STAGES[stageIndex];
    stats.currentStage = stageIndex;
    
    console.log(`${colors.magenta}📋 ETAPA ${stageId} (${stageIndex + 1}/${CONFIG.FUNIL_6_STAGES.length})${colors.reset}`);
    console.log(`${colors.magenta}${'─'.repeat(50)}${colors.reset}`);

    let currentPage = 0;
    let hasMorePages = true;
    let stageInserted = 0;
    let stageUpdated = 0;
    let stageSkipped = 0;
    let stageErrors = 0;

    // Paginação completa para esta etapa
    while (hasMorePages) {
      console.log(`${colors.blue}📄 Buscando página ${currentPage + 1}...${colors.reset}`);
      
      const opportunities = await fetchOpportunitiesPage(stageId, currentPage);
      
      if (opportunities.length === 0) {
        console.log(`${colors.blue}🏁 Fim da paginação da etapa ${stageId}${colors.reset}`);
        hasMorePages = false;
        continue;
      }

      console.log(`${colors.blue}📊 ${opportunities.length} oportunidades encontradas na página ${currentPage + 1}${colors.reset}`);
      
      // Processar oportunidades em paralelo (batches)
      for (let i = 0; i < opportunities.length; i += CONFIG.BATCH_SIZE) {
        const batch = opportunities.slice(i, i + CONFIG.BATCH_SIZE);
        const batchPromises = batch.map(processOpportunity);
        
        try {
          const results = await Promise.all(batchPromises);
          
          // Contar resultados
          results.forEach(result => {
            if (result) {
              stats.totalProcessed++;
              
              if (result.status === 'inserted') {
                stageInserted++;
              } else if (result.status === 'updated') {
                stageUpdated++;
              } else if (result.status === 'skipped') {
                stageSkipped++;
              } else if (result.status === 'error') {
                stageErrors++;
                console.error(`${colors.red}❌ Erro ID ${result.id}: ${result.error}${colors.reset}`);
              }
            }
          });
          
          // Mostrar progresso
          showProgress(i + batch.length, opportunities.length, `Etapa ${stageId}`);
          
        } catch (error) {
          console.error(`${colors.red}❌ Erro no batch:${colors.reset}`, error);
          stageErrors += CONFIG.BATCH_SIZE;
        }
        
        // Salvar checkpoint periodicamente
        if (stats.totalProcessed % 100 === 0) {
          saveCheckpoint();
        }
      }
      
      currentPage++;
      
      // Verificar se deve continuar (se retornou menos que o limite, provavelmente acabou)
      if (opportunities.length < CONFIG.PAGE_LIMIT) {
        hasMorePages = false;
      }
    }
    
    // Resumo da etapa
    console.log(`${colors.green}✅ ETAPA ${stageId} CONCLUÍDA:${colors.reset}`);
    console.log(`${colors.green}   Inseridas: ${stageInserted}${colors.reset}`);
    console.log(`${colors.green}   Atualizadas: ${stageUpdated}${colors.reset}`);
    console.log(`${colors.green}   Já atualizadas: ${stageSkipped}${colors.reset}`);
    console.log(`${colors.green}   Erros: ${stageErrors}${colors.reset}`);
    console.log('');
  }

  // Relatório final
  const endTime = performance.now();
  const totalTime = (endTime - stats.startTime) / 1000; // em segundos
  const totalMinutes = totalTime / 60;
  const successRate = stats.totalProcessed > 0 ? 
    ((stats.totalInserted + stats.totalUpdated + stats.totalSkipped) / stats.totalProcessed) * 100 : 0;

  console.log(`${colors.cyan}${'='.repeat(60)}${colors.reset}`);
  console.log(`${colors.cyan}📊 RELATÓRIO FINAL - SINCRONIZAÇÃO COMPLETA FUNIL 6${colors.reset}`);
  console.log(`${colors.cyan}${'='.repeat(60)}${colors.reset}`);
  console.log(`${colors.blue}🕒 Tempo de execução: ${totalTime.toFixed(2)}s (${totalMinutes.toFixed(1)} minutos)${colors.reset}`);
  console.log(`${colors.blue}🔄 Total de chamadas à API: ${stats.totalApiCalls}${colors.reset}`);
  console.log(`${colors.blue}📊 Total registros processados: ${stats.totalProcessed}${colors.reset}`);
  console.log(`${colors.blue}💾 ESTATÍSTICAS DE SINCRONIZAÇÃO:${colors.reset}`);
  console.log(`${colors.blue}   ✅ Inseridos: ${stats.totalInserted}${colors.reset}`);
  console.log(`${colors.blue}   🔄 Atualizados: ${stats.totalUpdated}${colors.reset}`);
  console.log(`${colors.blue}   ⚪ Já atualizados: ${stats.totalSkipped}${colors.reset}`);
  console.log(`${colors.blue}   ❌ Erros: ${stats.totalErrors}${colors.reset}`);
  console.log(`${colors.blue}📈 Taxa de sucesso: ${successRate.toFixed(2)}%${colors.reset}`);
  console.log(`${colors.cyan}${'='.repeat(60)}${colors.reset}`);
  console.log(`${colors.green}✅ SINCRONIZAÇÃO COMPLETA FUNIL 6 CONCLUÍDA!${colors.reset}`);
  console.log(`${colors.cyan}${'='.repeat(60)}${colors.reset}`);

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