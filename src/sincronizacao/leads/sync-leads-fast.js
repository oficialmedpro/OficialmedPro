#!/usr/bin/env node

/**
 * ⚡ SINCRONIZAÇÃO RÁPIDA DE LEADS - VERSÃO OTIMIZADA
 *
 * Versão otimizada para máxima velocidade:
 * - Delays reduzidos
 * - Processamento paralelo aumentado
 * - Verificação inteligente de atualizações
 * - Skip automático de leads já atualizados
 */

import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const CONFIG = {
  SPRINTHUB: {
    baseUrl: process.env.VITE_SPRINTHUB_BASE_URL || 'sprinthub-api-master.sprinthub.app',
    apiToken: process.env.VITE_SPRINTHUB_API_TOKEN || '9ad36c85-5858-4960-9935-e73c3698dd0c',
    instance: process.env.VITE_SPRINTHUB_INSTANCE || 'oficialmed'
  },
  SUPABASE: {
    url: process.env.VITE_SUPABASE_URL || 'https://agdffspstbxeqhqtltvb.supabase.co',
    key: process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFnZGZmc3BzdGJ4ZXFocXRsdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDQ1MzY2NiwiZXhwIjoyMDY2MDI5NjY2fQ.grInwGHFAH2WYvYerwfHkUsM08wXCJASg4CPMD2cTaA'
  },

  // Configurações otimizadas para velocidade
  PAGE_LIMIT: 100,     // Páginas maiores
  BATCH_SIZE: 10,      // Processar 10 leads em paralelo
  DELAY_BETWEEN_REQUESTS: 200,  // 200ms entre requisições (muito mais rápido)
  DELAY_BETWEEN_PAGES: 10000,   // 10 segundos entre páginas
  DELAY_BETWEEN_BATCHES: 500,   // 500ms entre batches

  CHECKPOINT_FILE: path.join(__dirname, 'checkpoint-fast.json')
};

const colors = {
  reset: '\x1b[0m', red: '\x1b[31m', green: '\x1b[32m', yellow: '\x1b[33m',
  blue: '\x1b[34m', magenta: '\x1b[35m', cyan: '\x1b[36m'
};

const stats = {
  startTime: Date.now(),
  totalProcessed: 0,
  totalInserted: 0,
  totalUpdated: 0,
  totalSkipped: 0,
  totalErrors: 0,
  totalApiCalls: 0,
  currentPage: 0,
  estimatedTotal: 71410
};

// Rate limiter mais agressivo
let requestCount = 0;
let lastMinute = Date.now();

async function rateLimitedRequest(url, options) {
  const now = Date.now();

  // Reset contador a cada minuto
  if (now - lastMinute > 60000) {
    requestCount = 0;
    lastMinute = now;
  }

  // Se chegou ao limite, esperar menos tempo
  if (requestCount >= 90) { // Mais agressivo
    console.log(`${colors.yellow}⏳ Rate limit atingido, aguardando 30 segundos...${colors.reset}`);
    await new Promise(resolve => setTimeout(resolve, 30000));
    requestCount = 0;
    lastMinute = Date.now();
  }

  requestCount++;
  stats.totalApiCalls++;

  return await fetch(url, options);
}

// Função para mapear campos do lead (versão otimizada)
function mapLeadFields(lead) {
  const parseDate = (dateStr) => {
    if (!dateStr || dateStr === 'null' || dateStr === 'undefined') return null;
    try {
      const date = new Date(dateStr);
      return isNaN(date.getTime()) ? null : date.toISOString();
    } catch {
      return null;
    }
  };

  const parseDateOnly = (dateStr) => {
    if (!dateStr || dateStr === 'null' || dateStr === 'undefined') return null;
    try {
      const date = new Date(dateStr);
      return isNaN(date.getTime()) ? null : date.toISOString().split('T')[0];
    } catch {
      return null;
    }
  };

  const cleanString = (str) => {
    if (!str || str === 'null' || str === 'undefined') return null;
    return typeof str === 'string' ? str.trim() : String(str).trim();
  };

  return {
    id: lead.id,
    firstname: cleanString(lead.firstname),
    lastname: cleanString(lead.lastname),
    email: cleanString(lead.email),
    phone: cleanString(lead.phone),
    whatsapp: cleanString(lead.whatsapp),
    mobile: cleanString(lead.mobile),
    photo_url: cleanString(lead.photoUrl),
    address: cleanString(lead.address),
    city: cleanString(lead.city),
    state: cleanString(lead.state),
    country: cleanString(lead.country),
    zipcode: cleanString(lead.zipcode),
    timezone: cleanString(lead.timezone),
    bairro: cleanString(lead.bairro),
    complemento: cleanString(lead.complemento),
    numero_entrega: cleanString(lead.numero_entrega),
    rua_entrega: cleanString(lead.rua_entrega),
    company: cleanString(lead.company),
    points: parseInt(lead.points) || 0,
    owner: cleanString(lead.owner),
    stage: cleanString(lead.stage),
    preferred_locale: cleanString(lead.preferred_locale),
    user_access: lead.userAccess ? JSON.stringify(lead.userAccess) : null,
    department_access: lead.departmentAccess ? JSON.stringify(lead.departmentAccess) : null,
    ignore_sub_departments: lead.ignoreSubDepartments || false,
    create_date: parseDate(lead.createDate),
    updated_date: parseDate(lead.updatedDate),
    last_active: parseDate(lead.lastActive),
    created_by: cleanString(lead.createdBy),
    created_by_name: cleanString(lead.createdByName),
    created_by_type: cleanString(lead.createdByType),
    updated_by: cleanString(lead.updatedBy),
    updated_by_name: cleanString(lead.updatedByName),
    synced_at: new Date().toISOString(),
    archived: lead.archived || false,
    third_party_data: lead.thirdPartyData ? JSON.stringify(lead.thirdPartyData) : null,
    capital_de_investimento: cleanString(lead.capital_de_investimento),
    tipo_de_compra: cleanString(lead.tipo_de_compra),
    pedidos_shopify: cleanString(lead.pedidos_shopify),
    categoria: cleanString(lead.categoria),
    classificacao_google: cleanString(lead.classificacao_google),
    grau_de_interesse: cleanString(lead.grau_de_interesse),
    star_score: cleanString(lead.star_score),
    avaliacao_atendente: cleanString(lead.avaliacao_atendente),
    avaliacao_atendimento: cleanString(lead.avaliacao_atendimento),
    qualificacao_callix: cleanString(lead.qualificacao_callix),
    origem: cleanString(lead.origem),
    origem_manipulacao: cleanString(lead.origem_manipulacao),
    lista_de_origem: cleanString(lead.lista_de_origem),
    criativo: cleanString(lead.criativo),
    plataforma: cleanString(lead.plataforma),
    redes_sociais: cleanString(lead.redes_sociais),
    site: cleanString(lead.site),
    atendente: cleanString(lead.atendente),
    atendente_atual: cleanString(lead.atendente_atual),
    feedback: cleanString(lead.feedback),
    observacao: cleanString(lead.observacao),
    observacoes_do_lead: cleanString(lead.observacoes_do_lead),
    comportamento_da_ia: cleanString(lead.comportamento_da_ia),
    retorno: cleanString(lead.retorno),
    prescritor: cleanString(lead.prescritor),
    produto: cleanString(lead.produto),
    drograria: cleanString(lead.drograria),
    data_recompra: parseDateOnly(lead.data_recompra),
    mes_que_entrou: cleanString(lead.mes_que_entrou),
    cpf: cleanString(lead.cpf),
    rg: cleanString(lead.rg),
    arquivo_receita: cleanString(lead.arquivo_receita),
    id_t56: cleanString(lead.id_t56),
    empresa: cleanString(lead.empresa),
    sexo: cleanString(lead.sexo),
    data_de_nascimento: parseDateOnly(lead.data_de_nascimento),
    objetivos_do_cliente: cleanString(lead.objetivos_do_cliente),
    perfil_do_cliente: cleanString(lead.perfil_do_cliente),
    recebedor: cleanString(lead.recebedor),
    whatsapp_remote_lid: cleanString(lead.whatsapp_remote_lid),
    status: cleanString(lead.status),
    sh_status: cleanString(lead.sh_status),
    data_do_contato: parseDateOnly(lead.data_do_contato)
  };
}

// Função otimizada para processar lead
async function processLead(leadBasic) {
  try {
    // Verificar se já existe primeiro (otimização)
    const checkUrl = `${CONFIG.SUPABASE.url}/rest/v1/leads?select=id,synced_at,updated_date&id=eq.${leadBasic.id}`;
    const checkResponse = await fetch(checkUrl, {
      headers: {
        'Authorization': `Bearer ${CONFIG.SUPABASE.key}`,
        'apikey': CONFIG.SUPABASE.key,
        'Accept-Profile': 'api'
      }
    });

    if (checkResponse.ok) {
      const existing = await checkResponse.json();
      if (existing.length > 0) {
        const existingRecord = existing[0];
        
        // Verificar se precisa atualizar (comparar datas)
        const lastSync = new Date(existingRecord.synced_at);
        const now = new Date();
        const timeDiff = now - lastSync;
        
        // Se foi sincronizado há menos de 1 hora, pular
        if (timeDiff < 3600000) { // 1 hora em ms
          stats.totalSkipped++;
          return { status: 'skipped', reason: 'recently_synced' };
        }
      }
    }

    // Buscar detalhes completos apenas se necessário
    const detailUrl = `https://${CONFIG.SPRINTHUB.baseUrl}/leads/${leadBasic.id}?i=${CONFIG.SPRINTHUB.instance}&allFields=1&apitoken=${CONFIG.SPRINTHUB.apiToken}`;

    const detailResponse = await rateLimitedRequest(detailUrl, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${CONFIG.SPRINTHUB.apiToken}`,
        'apitoken': CONFIG.SPRINTHUB.apiToken
      }
    });

    if (!detailResponse.ok) {
      throw new Error(`HTTP ${detailResponse.status}`);
    }

    const detailData = await detailResponse.json();
    const leadDetails = detailData.data.lead;
    const mappedData = mapLeadFields(leadDetails);

    // Verificar novamente se existe (race condition)
    const finalCheck = await fetch(checkUrl, {
      headers: {
        'Authorization': `Bearer ${CONFIG.SUPABASE.key}`,
        'apikey': CONFIG.SUPABASE.key,
        'Accept-Profile': 'api'
      }
    });

    const exists = finalCheck.ok && (await finalCheck.json()).length > 0;

    if (!exists) {
      // Inserir
      const insertResponse = await fetch(`${CONFIG.SUPABASE.url}/rest/v1/leads`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${CONFIG.SUPABASE.key}`,
          'apikey': CONFIG.SUPABASE.key,
          'Accept-Profile': 'api',
          'Content-Profile': 'api'
        },
        body: JSON.stringify(mappedData)
      });

      if (insertResponse.ok) {
        stats.totalInserted++;
        return { status: 'inserted' };
      } else {
        stats.totalErrors++;
        return { status: 'error', error: insertResponse.status };
      }
    } else {
      // Atualizar
      const updateResponse = await fetch(`${CONFIG.SUPABASE.url}/rest/v1/leads?id=eq.${leadBasic.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${CONFIG.SUPABASE.key}`,
          'apikey': CONFIG.SUPABASE.key,
          'Accept-Profile': 'api',
          'Content-Profile': 'api'
        },
        body: JSON.stringify(mappedData)
      });

      if (updateResponse.ok) {
        stats.totalUpdated++;
        return { status: 'updated' };
      } else {
        stats.totalErrors++;
        return { status: 'error', error: updateResponse.status };
      }
    }

  } catch (error) {
    stats.totalErrors++;
    return { status: 'error', error: error.message };
  }
}

function saveCheckpoint() {
  try {
    fs.writeFileSync(CONFIG.CHECKPOINT_FILE, JSON.stringify({
      ...stats,
      timestamp: new Date().toISOString()
    }, null, 2));
  } catch (error) {
    console.log(`${colors.yellow}⚠️ Erro ao salvar checkpoint:${colors.reset}`, error.message);
  }
}

function showProgress() {
  const percentage = ((stats.totalProcessed / stats.estimatedTotal) * 100).toFixed(2);
  const elapsed = ((Date.now() - stats.startTime) / 1000 / 60).toFixed(1);
  const rate = (stats.totalProcessed / (elapsed || 1)).toFixed(1);
  const remaining = ((stats.estimatedTotal - stats.totalProcessed) / rate).toFixed(0);

  console.log(`${colors.cyan}⚡ Progresso: ${stats.totalProcessed}/${stats.estimatedTotal} (${percentage}%) | ⏱️ ${elapsed}min | 📈 ${rate}/min | ⏳ ~${remaining}min restantes${colors.reset}`);
  console.log(`${colors.blue}   ✅ ${stats.totalInserted} inseridos | 🔄 ${stats.totalUpdated} atualizados | ⚪ ${stats.totalSkipped} pulados | ❌ ${stats.totalErrors} erros | 🔄 ${stats.totalApiCalls} API calls${colors.reset}`);
}

async function main() {
  console.log(`${colors.cyan}⚡ SINCRONIZAÇÃO RÁPIDA DE LEADS - VERSÃO OTIMIZADA${colors.reset}`);
  console.log(`${colors.cyan}======================================================${colors.reset}`);
  console.log(`${colors.blue}📊 Estimativa: ~${stats.estimatedTotal.toLocaleString()} leads${colors.reset}`);
  console.log(`${colors.blue}⏱️ Tempo estimado: 2-4 horas (versão otimizada)${colors.reset}`);
  console.log(`${colors.blue}🔧 Configuração: ${CONFIG.BATCH_SIZE} leads por lote, delays reduzidos${colors.reset}`);
  console.log(`${colors.yellow}🚀 OTIMIZAÇÕES:${colors.reset}`);
  console.log(`${colors.yellow}   • Verificação inteligente de leads já atualizados${colors.reset}`);
  console.log(`${colors.yellow}   • Processamento paralelo aumentado (10 leads)${colors.reset}`);
  console.log(`${colors.yellow}   • Delays reduzidos (200ms vs 1000ms)${colors.reset}`);
  console.log(`${colors.yellow}   • Skip automático de leads sincronizados há < 1h${colors.reset}`);
  console.log('');

  let currentPage = 0;
  let hasMorePages = true;

  while (hasMorePages) {
    stats.currentPage = currentPage;

    try {
      console.log(`${colors.blue}📄 Processando página ${currentPage + 1}...${colors.reset}`);

      // Buscar leads da página
      const listUrl = `https://${CONFIG.SPRINTHUB.baseUrl}/leads?i=${CONFIG.SPRINTHUB.instance}&page=${currentPage}&limit=${CONFIG.PAGE_LIMIT}&apitoken=${CONFIG.SPRINTHUB.apiToken}`;

      const listResponse = await rateLimitedRequest(listUrl, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${CONFIG.SPRINTHUB.apiToken}`,
          'apitoken': CONFIG.SPRINTHUB.apiToken
        }
      });

      if (!listResponse.ok) {
        if (listResponse.status === 401) {
          console.log(`${colors.yellow}⏳ Rate limit atingido, aguardando 1 minuto...${colors.reset}`);
          await new Promise(resolve => setTimeout(resolve, 60000));
          continue;
        }
        throw new Error(`HTTP ${listResponse.status}`);
      }

      const listData = await listResponse.json();
      const leads = listData.data.leads;

      if (leads.length === 0) {
        console.log(`${colors.blue}🏁 Fim da paginação${colors.reset}`);
        break;
      }

      console.log(`${colors.blue}📊 ${leads.length} leads encontrados na página ${currentPage + 1}${colors.reset}`);

      // Processar leads em lotes paralelos
      for (let i = 0; i < leads.length; i += CONFIG.BATCH_SIZE) {
        const batch = leads.slice(i, i + CONFIG.BATCH_SIZE);

        // Processar em paralelo
        const batchPromises = batch.map(lead => processLead(lead));
        const results = await Promise.all(batchPromises);

        // Atualizar estatísticas
        results.forEach(result => {
          stats.totalProcessed++;
          if (result.status === 'error') {
            console.log(`${colors.red}❌ Erro lead: ${result.error}${colors.reset}`);
          }
        });

        // Mostrar progresso a cada lote
        if (stats.totalProcessed % 20 === 0) {
          showProgress();
          saveCheckpoint();
        }

        // Delay menor entre batches
        if (i + CONFIG.BATCH_SIZE < leads.length) {
          await new Promise(resolve => setTimeout(resolve, CONFIG.DELAY_BETWEEN_BATCHES));
        }
      }

      currentPage++;

      // Delay menor entre páginas
      if (leads.length === CONFIG.PAGE_LIMIT) {
        console.log(`${colors.yellow}⏳ Aguardando 10 segundos antes da próxima página...${colors.reset}`);
        await new Promise(resolve => setTimeout(resolve, CONFIG.DELAY_BETWEEN_PAGES));
      } else {
        hasMorePages = false;
      }

    } catch (error) {
      console.error(`${colors.red}❌ Erro na página ${currentPage + 1}:${colors.reset}`, error.message);
      currentPage++;
    }
  }

  // Relatório final
  const totalTime = (Date.now() - stats.startTime) / 1000 / 60;
  console.log(`${colors.cyan}${'='.repeat(60)}${colors.reset}`);
  console.log(`${colors.cyan}⚡ RELATÓRIO FINAL - SINCRONIZAÇÃO RÁPIDA${colors.reset}`);
  console.log(`${colors.cyan}${'='.repeat(60)}${colors.reset}`);
  console.log(`${colors.blue}🕒 Tempo total: ${totalTime.toFixed(1)} minutos${colors.reset}`);
  console.log(`${colors.blue}📊 Leads processados: ${stats.totalProcessed.toLocaleString()}${colors.reset}`);
  console.log(`${colors.green}✅ Inseridos: ${stats.totalInserted.toLocaleString()}${colors.reset}`);
  console.log(`${colors.blue}🔄 Atualizados: ${stats.totalUpdated.toLocaleString()}${colors.reset}`);
  console.log(`${colors.yellow}⚪ Pulados: ${stats.totalSkipped.toLocaleString()}${colors.reset}`);
  console.log(`${colors.red}❌ Erros: ${stats.totalErrors.toLocaleString()}${colors.reset}`);
  console.log(`${colors.blue}🔄 Total API calls: ${stats.totalApiCalls.toLocaleString()}${colors.reset}`);
  console.log(`${colors.cyan}${'='.repeat(60)}${colors.reset}`);
  console.log(`${colors.green}🎉 SINCRONIZAÇÃO RÁPIDA CONCLUÍDA!${colors.reset}`);

  // Limpar checkpoint
  if (fs.existsSync(CONFIG.CHECKPOINT_FILE)) {
    fs.unlinkSync(CONFIG.CHECKPOINT_FILE);
  }
}

main().catch(error => {
  console.error(`${colors.red}❌ ERRO FATAL:${colors.reset}`, error);
  saveCheckpoint();
  process.exit(1);
});

