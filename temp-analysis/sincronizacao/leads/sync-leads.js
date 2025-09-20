#!/usr/bin/env node

/**
 * 🎯 SINCRONIZAÇÃO COMPLETA DE LEADS - SCRIPT NODE.JS
 *
 * Sincroniza TODOS os leads do SprintHub para o Supabase
 * Estimativa: 1.134 leads (baseado na resposta da API)
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

  // Configurações dos leads
  PAGE_LIMIT: 100,
  BATCH_SIZE: 5, // Processar 5 leads em paralelo (reduzido para rate limit)
  DELAY_BETWEEN_BATCHES: 1000, // 1 segundo entre batches
  DELAY_BETWEEN_PAGES: 60000, // 60 segundos entre páginas (respeitar rate limit)

  // Arquivos
  CHECKPOINT_FILE: path.join(__dirname, 'checkpoint-leads.json')
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

// Função para mapear campos do lead (TODOS os 79 campos)
function mapLeadFields(lead) {
  // Função auxiliar para converter datas
  const parseDate = (dateStr) => {
    if (!dateStr) return null;
    try {
      return new Date(dateStr).toISOString();
    } catch {
      return null;
    }
  };

  // Função auxiliar para converter datas simples (sem hora)
  const parseDateOnly = (dateStr) => {
    if (!dateStr) return null;
    try {
      const date = new Date(dateStr);
      return date.toISOString().split('T')[0];
    } catch {
      return null;
    }
  };

  return {
    // 🔑 CHAVE PRIMÁRIA
    id: lead.id,

    // 👤 DADOS PESSOAIS BÁSICOS
    firstname: lead.firstname || null,
    lastname: lead.lastname || null,
    email: lead.email || null,
    phone: lead.phone || null,
    whatsapp: lead.whatsapp || null,
    mobile: lead.mobile || null,
    photo_url: lead.photoUrl || null,

    // 📍 ENDEREÇO
    address: lead.address || null,
    city: lead.city || null,
    state: lead.state || null,
    country: lead.country || null,
    zipcode: lead.zipcode || null,
    timezone: lead.timezone || null,
    bairro: lead.bairro || null,
    complemento: lead.complemento || null,
    numero_entrega: lead.numero_entrega || null,
    rua_entrega: lead.rua_entrega || null,

    // 🏢 DADOS COMERCIAIS
    company: lead.company || null,
    points: parseInt(lead.points) || 0,
    owner: lead.owner || null,
    stage: lead.stage || null,
    preferred_locale: lead.preferred_locale || null,

    // 📋 CONTROLE DE ACESSO
    user_access: lead.userAccess ? JSON.stringify(lead.userAccess) : null,
    department_access: lead.departmentAccess ? JSON.stringify(lead.departmentAccess) : null,
    ignore_sub_departments: lead.ignoreSubDepartments || false,

    // 📅 DATAS E CONTROLE
    create_date: parseDate(lead.createDate),
    updated_date: parseDate(lead.updatedDate),
    last_active: parseDate(lead.lastActive),
    created_by: lead.createdBy || null,
    created_by_name: lead.createdByName || null,
    created_by_type: lead.createdByType || null,
    updated_by: lead.updatedBy || null,
    updated_by_name: lead.updatedByName || null,
    synced_at: new Date().toISOString(),

    // 🗂️ DADOS EXTRAS (CAMPOS PERSONALIZADOS)
    archived: lead.archived || false,
    third_party_data: lead.thirdPartyData ? JSON.stringify(lead.thirdPartyData) : null,

    // 💰 FINANCEIRO E INVESTIMENTOS
    capital_de_investimento: lead.capital_de_investimento || null,
    tipo_de_compra: lead.tipo_de_compra || null,
    pedidos_shopify: lead.pedidos_shopify || null,

    // 📊 CLASSIFICAÇÃO E AVALIAÇÃO
    categoria: lead.categoria || null,
    classificacao_google: lead.classificacao_google || null,
    grau_de_interesse: lead.grau_de_interesse || null,
    star_score: lead.star_score || null,
    avaliacao_atendente: lead.avaliacao_atendente || null,
    avaliacao_atendimento: lead.avaliacao_atendimento || null,
    qualificacao_callix: lead.qualificacao_callix || null,

    // 🎯 MARKETING E ORIGEM
    origem: lead.origem || null,
    origem_manipulacao: lead.origem_manipulacao || null,
    lista_de_origem: lead.lista_de_origem || null,
    criativo: lead.criativo || null,
    plataforma: lead.plataforma || null,
    redes_sociais: lead.redes_sociais || null,
    site: lead.site || null,

    // 📞 ATENDIMENTO
    atendente: lead.atendente || null,
    atendente_atual: lead.atendente_atual || null,
    feedback: lead.feedback || null,
    observacao: lead.observacao || null,
    observacoes_do_lead: lead.observacoes_do_lead || null,
    comportamento_da_ia: lead.comportamento_da_ia || null,
    retorno: lead.retorno || null,

    // 🏥 DADOS ESPECÍFICOS (FARMÁCIA/MEDICINA)
    prescritor: lead.prescritor || null,
    produto: lead.produto || null,
    drograria: lead.drograria || null,
    data_recompra: parseDateOnly(lead.data_recompra),
    mes_que_entrou: lead.mes_que_entrou || null,

    // 📄 DOCUMENTOS E IDENTIFICAÇÃO
    cpf: lead.cpf || null,
    rg: lead.rg || null,
    arquivo_receita: lead.arquivo_receita || null,
    id_t56: lead.id_t56 || null,

    // 👥 DADOS PESSOAIS EXTRAS
    empresa: lead.empresa || null,
    sexo: lead.sexo || null,
    data_de_nascimento: parseDateOnly(lead.data_de_nascimento),
    objetivos_do_cliente: lead.objetivos_do_cliente || null,
    perfil_do_cliente: lead.perfil_do_cliente || null,
    recebedor: lead.recebedor || null,

    // 📱 WHATSAPP E INTEGRAÇÕES
    whatsapp_remote_lid: lead.whatsapp_remote_lid || null,

    // 📋 STATUS E CONTROLE
    status: lead.status || null,
    sh_status: lead.sh_status || null,
    data_do_contato: parseDateOnly(lead.data_do_contato)
  };
}

// Função para buscar detalhes completos de um lead
async function fetchLeadDetails(leadId) {
  try {
    const url = `https://${CONFIG.SPRINTHUB.baseUrl}/leads/${leadId}?i=${CONFIG.SPRINTHUB.instance}&allFields=1&apitoken=${CONFIG.SPRINTHUB.apiToken}`;

    const response = await getRequest(url, {
      'Authorization': `Bearer ${CONFIG.SPRINTHUB.apiToken}`,
      'apitoken': CONFIG.SPRINTHUB.apiToken
    });

    if (response.ok && response.data.data && response.data.data.lead) {
      return response.data.data.lead;
    }

    return null;
  } catch (error) {
    console.error(`${colors.red}❌ Erro ao buscar detalhes do lead ${leadId}:${colors.reset}`, error.message);
    return null;
  }
}

// Função para verificar se lead existe no Supabase
async function checkInSupabase(leadId) {
  try {
    const url = `${CONFIG.SUPABASE.url}/rest/v1/leads?select=id,synced_at&id=eq.${leadId}`;
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
    console.error(`${colors.red}❌ Erro ao verificar lead ${leadId}:${colors.reset}`, error.message);
    return null;
  }
}

// Função para inserir no Supabase
async function insertToSupabase(data) {
  try {
    const url = `${CONFIG.SUPABASE.url}/rest/v1/leads`;
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
async function updateInSupabase(leadId, data) {
  try {
    const url = `${CONFIG.SUPABASE.url}/rest/v1/leads?id=eq.${leadId}`;
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

// Função para processar um lead individual
async function processLead(leadBasic) {
  try {
    // Buscar detalhes completos do lead
    const leadDetails = await fetchLeadDetails(leadBasic.id);

    if (!leadDetails) {
      stats.totalErrors++;
      return { status: 'error', id: leadBasic.id, error: 'Failed to fetch lead details' };
    }

    const existingRecord = await checkInSupabase(leadBasic.id);
    const mappedData = mapLeadFields(leadDetails);

    if (!existingRecord) {
      // INSERIR: Registro não existe
      const result = await insertToSupabase(mappedData);

      if (result.success) {
        stats.totalInserted++;
        return { status: 'inserted', id: leadBasic.id, name: leadBasic.fullname };
      } else {
        stats.totalErrors++;
        return { status: 'error', id: leadBasic.id, error: `Insert failed: ${result.status}` };
      }
    } else {
      // ATUALIZAR: Registro existe, verificar se precisa atualizar
      const shouldUpdate = !existingRecord.synced_at ||
                          (leadDetails.updatedAt && new Date(leadDetails.updatedAt) > new Date(existingRecord.synced_at));

      if (shouldUpdate) {
        const result = await updateInSupabase(leadBasic.id, mappedData);

        if (result.success) {
          stats.totalUpdated++;
          return { status: 'updated', id: leadBasic.id, name: leadBasic.fullname };
        } else {
          stats.totalErrors++;
          return { status: 'error', id: leadBasic.id, error: `Update failed: ${result.status}` };
        }
      } else {
        stats.totalSkipped++;
        return { status: 'skipped', id: leadBasic.id, name: leadBasic.fullname };
      }
    }
  } catch (error) {
    stats.totalErrors++;
    return { status: 'error', id: leadBasic.id, error: error.message };
  }
}

// Função para buscar leads de uma página
async function fetchLeadsPage(page) {
  try {
    stats.totalApiCalls++;

    const url = `https://${CONFIG.SPRINTHUB.baseUrl}/leads?i=${CONFIG.SPRINTHUB.instance}&page=${page}&limit=${CONFIG.PAGE_LIMIT}&apitoken=${CONFIG.SPRINTHUB.apiToken}`;

    console.log(`${colors.yellow}🔍 DEBUG: Fazendo requisição para página ${page + 1}${colors.reset}`);
    console.log(`${colors.yellow}🔍 DEBUG: URL: ${url}${colors.reset}`);

    const response = await getRequest(url, {
      'Authorization': `Bearer ${CONFIG.SPRINTHUB.apiToken}`,
      'apitoken': CONFIG.SPRINTHUB.apiToken
    });

    console.log(`${colors.yellow}🔍 DEBUG: Resposta recebida - Status: ${response.status}, OK: ${response.ok}${colors.reset}`);

    if (response.ok && response.data.data && response.data.data.leads) {
      const leads = response.data.data.leads;
      console.log(`${colors.yellow}🔍 DEBUG: ${leads.length} leads retornados${colors.reset}`);
      return leads;
    } else {
      throw new Error(`HTTP ${response.status}: ${JSON.stringify(response.data)}`);
    }
  } catch (error) {
    console.error(`${colors.red}❌ Erro na página ${page + 1}:${colors.reset}`, error.message);
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
  console.log(`${colors.cyan}🎯 SINCRONIZAÇÃO COMPLETA DE LEADS${colors.reset}`);
  console.log(`${colors.cyan}======================================${colors.reset}`);
  console.log(`${colors.blue}📊 Objetivo: Sincronizar TODOS os leads do SprintHub${colors.reset}`);
  console.log(`${colors.blue}📊 Estimativa: ~1.134 leads${colors.reset}`);
  console.log(`${colors.blue}⏱️ Tempo estimado: 5-15 minutos${colors.reset}`);
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

  // Verificar checkpoint anterior
  const checkpoint = loadCheckpoint();
  if (checkpoint) {
    console.log(`${colors.yellow}📂 Checkpoint encontrado de ${checkpoint.timestamp}${colors.reset}`);
    console.log(`${colors.yellow}   Processados: ${checkpoint.totalProcessed}${colors.reset}`);
    console.log(`${colors.blue}🔄 Iniciando sincronização completa...${colors.reset}\n`);
  }

  stats.startTime = performance.now();

  let currentPage = 0;
  let hasMorePages = true;
  let totalLeadsProcessed = 0;

  // Paginação completa
  while (hasMorePages) {
    console.log(`${colors.blue}📄 Buscando página ${currentPage + 1}...${colors.reset}`);

    const leads = await fetchLeadsPage(currentPage);

    if (leads.length === 0) {
      console.log(`${colors.blue}🏁 Fim da paginação${colors.reset}`);
      hasMorePages = false;
      continue;
    }

    console.log(`${colors.blue}📊 ${leads.length} leads encontrados na página ${currentPage + 1}${colors.reset}`);

    // Processar leads em paralelo (batches)
    for (let i = 0; i < leads.length; i += CONFIG.BATCH_SIZE) {
      const batch = leads.slice(i, i + CONFIG.BATCH_SIZE);
      const batchPromises = batch.map(processLead);

      try {
        const results = await Promise.all(batchPromises);

        // Contar resultados
        results.forEach(result => {
          if (result) {
            stats.totalProcessed++;
            totalLeadsProcessed++;

            if (result.status === 'error') {
              console.error(`${colors.red}❌ Erro ID ${result.id}: ${result.error}${colors.reset}`);
            }
          }
        });

        // Mostrar progresso
        showProgress(i + batch.length, leads.length, `Página ${currentPage + 1}`);

        // Delay entre batches para evitar rate limit
        if (i + CONFIG.BATCH_SIZE < leads.length) {
          await new Promise(resolve => setTimeout(resolve, CONFIG.DELAY_BETWEEN_BATCHES));
        }

      } catch (error) {
        console.error(`${colors.red}❌ Erro no batch:${colors.reset}`, error);
        stats.totalErrors += CONFIG.BATCH_SIZE;
      }

      // Salvar checkpoint periodicamente
      if (stats.totalProcessed % 50 === 0) {
        saveCheckpoint();
      }
    }

    currentPage++;

    // Verificar se deve continuar (se retornou menos que o limite, provavelmente acabou)
    if (leads.length < CONFIG.PAGE_LIMIT) {
      hasMorePages = false;
    }

    // Delay entre páginas para respeitar rate limit
    if (hasMorePages) {
      console.log(`${colors.yellow}⏳ Aguardando 60 segundos para respeitar rate limit...${colors.reset}`);
      await new Promise(resolve => setTimeout(resolve, CONFIG.DELAY_BETWEEN_PAGES));
    }
  }

  // Relatório final
  const endTime = performance.now();
  const totalTime = (endTime - stats.startTime) / 1000; // em segundos
  const totalMinutes = totalTime / 60;
  const successRate = stats.totalProcessed > 0 ?
    ((stats.totalInserted + stats.totalUpdated + stats.totalSkipped) / stats.totalProcessed) * 100 : 0;

  console.log(`${colors.cyan}${'='.repeat(60)}${colors.reset}`);
  console.log(`${colors.cyan}📊 RELATÓRIO FINAL - SINCRONIZAÇÃO COMPLETA DE LEADS${colors.reset}`);
  console.log(`${colors.cyan}${'='.repeat(60)}${colors.reset}`);
  console.log(`${colors.blue}🕒 Tempo de execução: ${totalTime.toFixed(2)}s (${totalMinutes.toFixed(1)} minutos)${colors.reset}`);
  console.log(`${colors.blue}🔄 Total de chamadas à API: ${stats.totalApiCalls}${colors.reset}`);
  console.log(`${colors.blue}📊 Total leads processados: ${stats.totalProcessed}${colors.reset}`);
  console.log(`${colors.blue}💾 ESTATÍSTICAS DE SINCRONIZAÇÃO:${colors.reset}`);
  console.log(`${colors.blue}   ✅ Inseridos: ${stats.totalInserted}${colors.reset}`);
  console.log(`${colors.blue}   🔄 Atualizados: ${stats.totalUpdated}${colors.reset}`);
  console.log(`${colors.blue}   ⚪ Já atualizados: ${stats.totalSkipped}${colors.reset}`);
  console.log(`${colors.blue}   ❌ Erros: ${stats.totalErrors}${colors.reset}`);
  console.log(`${colors.blue}📈 Taxa de sucesso: ${successRate.toFixed(2)}%${colors.reset}`);
  console.log(`${colors.cyan}${'='.repeat(60)}${colors.reset}`);
  console.log(`${colors.green}✅ SINCRONIZAÇÃO COMPLETA DE LEADS CONCLUÍDA!${colors.reset}`);
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