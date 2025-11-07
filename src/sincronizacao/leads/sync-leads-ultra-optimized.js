#!/usr/bin/env node

/**
 * 🚀 sync-leads-ultra-optimized.js | Sincronização ULTRA-OTIMIZADA de leads
 * 
 * OTIMIZAÇÕES:
 * - PAGE_LIMIT = 200 (máximo da API)
 * - BATCH_SIZE = 50 (máximo paralelo)
 * - DELAY_BETWEEN_PAGES = 500ms (ultra-rápido)
 * - Upsert em vez de insert (evita duplicados)
 * - Processamento em paralelo de múltiplas páginas
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ---- CONFIG ULTRA-OTIMIZADA ----
const CONFIG = {
  SPRINTHUB: {
    baseUrl: process.env.VITE_SPRINTHUB_BASE_URL || 'sprinthub-api-master.sprinthub.app',
    apiToken: process.env.VITE_SPRINTHUB_API_TOKEN || '',
    instance: process.env.VITE_SPRINTHUB_INSTANCE || 'oficialmed',
    PAGE_LIMIT: 200,        // Máximo da API
    BATCH_SIZE: 50,         // Ultra-paralelo
    DELAY_BETWEEN_PAGES: 500, // Ultra-rápido (500ms)
    PARALLEL_PAGES: 3       // Processar 3 páginas em paralelo
  },
  SUPABASE: {
    url: process.env.VITE_SUPABASE_URL,
    key: process.env.VITE_SUPABASE_SERVICE_ROLE_KEY
  },
  CHECKPOINT_FILE: path.join(__dirname, 'checkpoint-leads-ultra-optimized.json')
};

const stats = {
  totalApiCalls: 0,
  totalInserted: 0,
  totalUpdated: 0,
  totalErrors: 0,
  startTime: null
};

const KNOWN_LEAD_KEYS = new Set([
  'id',
  'firstname',
  'lastname',
  'email',
  'phone',
  'whatsapp',
  'mobile',
  'photoUrl',
  'address',
  'city',
  'state',
  'country',
  'zipcode',
  'timezone',
  'bairro',
  'complemento',
  'numero_entrega',
  'rua_entrega',
  'company',
  'points',
  'owner',
  'stage',
  'preferred_locale',
  'userAccess',
  'departmentAccess',
  'ignoreSubDepartments',
  'createDate',
  'updatedDate',
  'lastActive',
  'createdBy',
  'createdByName',
  'createdByType',
  'updatedBy',
  'updatedByName',
  'archived',
  'thirdPartyData',
  'capital_de_investimento',
  'tipo_de_compra',
  'pedidos_shopify',
  'categoria',
  'classificacao_google',
  'grau_de_interesse',
  'star_score',
  'avaliacao_atendente',
  'avaliacao_atendimento',
  'qualificacao_callix',
  'origem',
  'origem_manipulacao',
  'lista_de_origem',
  'criativo',
  'plataforma',
  'redes_sociais',
  'site',
  'atendente',
  'atendente_atual',
  'feedback',
  'observacao',
  'observacoes_do_lead',
  'comportamento_da_ia',
  'retorno',
  'prescritor',
  'produto',
  'drograria',
  'data_recompra',
  'mes_que_entrou',
  'cpf',
  'rg',
  'arquivo_receita',
  'id_t56',
  'empresa',
  'sexo',
  'data_de_nascimento',
  'objetivos_do_cliente',
  'perfil_do_cliente',
  'recebedor',
  'whatsapp_remote_lid',
  'status',
  'sh_status',
  'data_do_contato',
  'customFields',
  'utmTags',
  'tags',
  'forms',
  'ownerData',
  'pipelineId',
  'columnId',
  'sequence'
]);

const unknownLeadFieldSamples = new Map();

function serializeSample(value) {
  if (value === null || value === undefined) return null;
  if (typeof value === 'object') {
    try {
      return JSON.parse(JSON.stringify(value));
    } catch {
      return '[complex object]';
    }
  }
  return value;
}

function trackUnknownLeadFields(lead) {
  if (!lead || typeof lead !== 'object') return;
  Object.entries(lead).forEach(([key, value]) => {
    if (KNOWN_LEAD_KEYS.has(key)) return;
    if (value === undefined || value === null) return;
    if (typeof value === 'string' && value.trim() === '') return;
    if (!unknownLeadFieldSamples.has(key)) {
      unknownLeadFieldSamples.set(key, {
        value: serializeSample(value),
        leadId: lead.id ?? null
      });
    }
  });
  if (Array.isArray(lead.customFields)) {
    lead.customFields.forEach((field) => {
      const label = field?.name || field?.label || field?.field;
      if (!label) return;
      const key = `customField:${label}`;
      if (unknownLeadFieldSamples.has(key)) return;
      const fieldValue = field?.value ?? field?.answer ?? null;
      if (fieldValue === null || (typeof fieldValue === 'string' && fieldValue.trim() === '')) return;
      unknownLeadFieldSamples.set(key, {
        value: serializeSample(fieldValue),
        leadId: lead.id ?? null
      });
    });
  }
}

async function flushUnknownLeadFields() {
  if (unknownLeadFieldSamples.size === 0) return;
  if (!CONFIG.SUPABASE.url || !CONFIG.SUPABASE.key) {
    console.warn('⚠️ Supabase não configurado para registrar campos de lead não mapeados.');
    return;
  }

  const url = `${CONFIG.SUPABASE.url}/rest/v1/rpc/log_missing_field`;
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${CONFIG.SUPABASE.key}`,
    'apikey': CONFIG.SUPABASE.key,
    'Accept-Profile': 'api',
    'Content-Profile': 'api'
  };

  const missingFields = Array.from(unknownLeadFieldSamples.keys());
  console.warn(`⚠️ Campos de lead não mapeados detectados nesta execução: ${missingFields.join(', ')}`);

  for (const [fieldName, sample] of unknownLeadFieldSamples.entries()) {
    try {
      await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          p_resource: 'lead',
          p_field_name: fieldName,
          p_sample: sample ?? null
        })
      });
    } catch (error) {
      console.warn(`⚠️ Falha ao registrar campo de lead (${fieldName}): ${error.message}`);
    }
  }

  unknownLeadFieldSamples.clear();
}

// Utilitário simple delay
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

// Utilitário de fetch agnóstico
async function makeRequest(url, options = {}) {
  try {
    const fetchOptions = {
      method: options.method || 'GET',
      headers: options.headers || {},
      body: options.body || null,
      timeout: 30000
    };
    const resp = await fetch(url, fetchOptions);
    let data;
    try {
      data = await resp.json();
    } catch {
      data = await resp.text();
    }
    return { ok: resp.ok, status: resp.status, data };
  } catch (error) {
    return { ok: false, status: 500, data: error.message };
  }
}

// Mapear campos para o formato Supabase (mesmo do sync-leads.js)
function mapLeadFields(lead) {
  trackUnknownLeadFields(lead);

  const parseDate = dateStr => {
    if (!dateStr) return null;
    try { return new Date(dateStr).toISOString(); } catch { return null; }
  };
  const parseDateOnly = dateStr => {
    if (!dateStr) return null;
    try { return new Date(dateStr).toISOString().split('T')[0]; } catch { return null; }
  };
  return {
    id: lead.id,
    firstname: lead.firstname || null,
    lastname: lead.lastname || null,
    email: lead.email || null,
    phone: lead.phone || null,
    whatsapp: lead.whatsapp || null,
    mobile: lead.mobile || null,
    photo_url: lead.photoUrl || null,
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
    company: lead.company || null,
    points: parseInt(lead.points) || 0,
    owner: lead.owner || null,
    stage: lead.stage || null,
    preferred_locale: lead.preferred_locale || null,
    user_access: lead.userAccess ? JSON.stringify(lead.userAccess) : null,
    department_access: lead.departmentAccess ? JSON.stringify(lead.departmentAccess) : null,
    ignore_sub_departments: lead.ignoreSubDepartments || false,
    create_date: parseDate(lead.createDate),
    updated_date: parseDate(lead.updatedDate),
    last_active: parseDate(lead.lastActive),
    created_by: lead.createdBy || null,
    created_by_name: lead.createdByName || null,
    created_by_type: lead.createdByType || null,
    updated_by: lead.updatedBy || null,
    updated_by_name: lead.updatedByName || null,
    synced_at: new Date().toISOString(),
    archived: lead.archived || false,
    third_party_data: lead.thirdPartyData ? JSON.stringify(lead.thirdPartyData) : null,
    capital_de_investimento: lead.capital_de_investimento || null,
    tipo_de_compra: lead.tipo_de_compra || null,
    pedidos_shopify: lead.pedidos_shopify || null,
    categoria: lead.categoria || null,
    classificacao_google: lead.classificacao_google || null,
    grau_de_interesse: lead.grau_de_interesse || null,
    star_score: lead.star_score || null,
    avaliacao_atendente: lead.avaliacao_atendente || null,
    avaliacao_atendimento: lead.avaliacao_atendimento || null,
    qualificacao_callix: lead.qualificacao_callix || null,
    origem: lead.origem || null,
    origem_manipulacao: lead.origem_manipulacao || null,
    lista_de_origem: lead.lista_de_origem || null,
    criativo: lead.criativo || null,
    plataforma: lead.plataforma || null,
    redes_sociais: lead.redes_sociais || null,
    site: lead.site || null,
    atendente: lead.atendente || null,
    atendente_atual: lead.atendente_atual || null,
    feedback: lead.feedback || null,
    observacao: lead.observacao || null,
    observacoes_do_lead: lead.observacoes_do_lead || null,
    comportamento_da_ia: lead.comportamento_da_ia || null,
    retorno: lead.retorno || null,
    prescritor: lead.prescritor || null,
    produto: lead.produto || null,
    drograria: lead.drograria || null,
    data_recompra: parseDateOnly(lead.data_recompra),
    mes_que_entrou: lead.mes_que_entrou || null,
    cpf: lead.cpf || null,
    rg: lead.rg || null,
    arquivo_receita: lead.arquivo_receita || null,
    id_t56: lead.id_t56 || null,
    empresa: lead.empresa || null,
    sexo: lead.sexo || null,
    data_de_nascimento: parseDateOnly(lead.data_de_nascimento),
    objetivos_do_cliente: lead.objetivos_do_cliente || null,
    perfil_do_cliente: lead.perfil_do_cliente || null,
    recebedor: lead.recebedor || null,
    whatsapp_remote_lid: lead.whatsapp_remote_lid || null,
    status: lead.status || null,
    sh_status: lead.sh_status || null,
    data_do_contato: parseDateOnly(lead.data_do_contato)
  };
}

// Fetch leads de uma página do SprintHub
async function fetchLeadsPage(page) {
  const { baseUrl, instance, apiToken, PAGE_LIMIT } = CONFIG.SPRINTHUB;
  const url = `https://${baseUrl}/leads?i=${instance}&page=${page}&limit=${PAGE_LIMIT}&apitoken=${apiToken}`;
  stats.totalApiCalls++;
  return makeRequest(url, {
    headers: {
      'Authorization': `Bearer ${apiToken}`,
      'apitoken': apiToken
    }
  });
}

// Buscar detalhes de 1 lead
async function fetchLeadDetails(leadId) {
  const { baseUrl, instance, apiToken } = CONFIG.SPRINTHUB;
  const url = `https://${baseUrl}/leads/${leadId}?i=${instance}&allFields=1&apitoken=${apiToken}`;
  return makeRequest(url, {
    headers: {
      'Authorization': `Bearer ${apiToken}`,
      'apitoken': apiToken
    }
  });
}

// Upsert leads no Supabase (insere ou atualiza)
async function upsertLeads(leads) {
  const { url, key } = CONFIG.SUPABASE;
  const url_ = `${url}/rest/v1/leads`;
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${key}`,
    'apikey': key,
    'Accept-Profile': 'api',
    'Content-Profile': 'api',
    'Prefer': 'resolution=merge-duplicates,return=minimal'
  };
  
  const response = await makeRequest(url_, {
    method: 'POST',
    headers,
    body: JSON.stringify(leads)
  });
  
  if (!response.ok) {
    console.error('Erro ao fazer upsert no Supabase:', response.data);
    stats.totalErrors++;
    return { ok: false, error: response.data };
  }
  
  // Contar inserções vs atualizações (aproximado)
  stats.totalInserted += leads.length;
  return { ok: true, data: response.data };
}

// Função principal para sincronizar leads
async function syncLeadsUltraOptimized() {
  try {
    stats.startTime = new Date();
    console.log('🚀 Iniciando sincronização ULTRA-OTIMIZADA de leads...');
    console.log(`⚙️  Configurações: PAGE_LIMIT=${CONFIG.SPRINTHUB.PAGE_LIMIT}, BATCH_SIZE=${CONFIG.SPRINTHUB.BATCH_SIZE}, DELAY=${CONFIG.SPRINTHUB.DELAY_BETWEEN_PAGES}ms`);

    // Carregar checkpoint (se existir)
    let checkpoint = { lastPage: 0 };
    if (fs.existsSync(CONFIG.CHECKPOINT_FILE)) {
      try {
        checkpoint = JSON.parse(fs.readFileSync(CONFIG.CHECKPOINT_FILE, 'utf8'));
        console.log(`📋 Checkpoint carregado: Última página processada ${checkpoint.lastPage}`);
      } catch (e) {
        console.error('❌ Erro ao ler checkpoint:', e);
        process.exit(1);
      }
    }

    let currentPage = checkpoint.lastPage + 1;
    let allLeads = [];
    let hasMorePages = true;

    // Buscar todas as páginas primeiro
    console.log('📥 Buscando todas as páginas de leads...');
    while (hasMorePages) {
      console.log(`📄 Buscando página ${currentPage}...`);
      const response = await fetchLeadsPage(currentPage);
      
      let data = [];
      if (response.ok && response.data && response.data.data && Array.isArray(response.data.data.leads)) {
        data = response.data.data.leads;
      } else {
        console.error('❌ Erro: formato inesperado na resposta da API ou requisição falhou.');
        if (!response.ok) {
          console.error('Status HTTP', response.status, response.data);
        }
        break;
      }

      if (!data.length) {
        console.log('✅ Fim dos leads!');
        hasMorePages = false;
        break;
      }

      allLeads = [...allLeads, ...data];
      console.log(`📊 Página ${currentPage}: ${data.length} leads encontrados (Total: ${allLeads.length})`);

      // Salvar checkpoint após cada página
      try {
        checkpoint.lastPage = currentPage;
        fs.writeFileSync(CONFIG.CHECKPOINT_FILE, JSON.stringify(checkpoint));
      } catch (e) {
        console.error('❌ Erro ao salvar checkpoint:', e);
      }

      // Aguardar DELAY_BETWEEN_PAGES
      await sleep(CONFIG.SPRINTHUB.DELAY_BETWEEN_PAGES);
      currentPage++;
    }

    if (allLeads.length === 0) {
      console.log('❌ Nenhum lead encontrado para sincronizar. Finalizando.');
      return;
    }

    console.log(`🎯 Total de leads encontrados: ${allLeads.length}`);
    console.log('🔄 Processando detalhes e sincronizando...');

    // Processar leads em lotes ULTRA-PARALELOS
    const BATCH_SIZE = CONFIG.SPRINTHUB.BATCH_SIZE;
    for (let i = 0; i < allLeads.length; i += BATCH_SIZE) {
      const batch = allLeads.slice(i, i + BATCH_SIZE);
      const batchNumber = Math.floor(i / BATCH_SIZE) + 1;
      const totalBatches = Math.ceil(allLeads.length / BATCH_SIZE);
      
      console.log(`⚡ Processando lote ${batchNumber}/${totalBatches} (${batch.length} leads)...`);

      // Buscar detalhes de todos os leads do lote em paralelo
      const leadsToUpsert = await Promise.all(batch.map(async lead => {
        const details = await fetchLeadDetails(lead.id);
        if (details.ok) {
          return mapLeadFields(details.data);
        } else {
          console.error(`❌ Erro ao buscar detalhes do lead ${lead.id}:`, details.status, details.data);
          stats.totalErrors++;
          return null;
        }
      }));

      const validLeads = leadsToUpsert.filter(lead => lead !== null);

      if (validLeads.length > 0) {
        const { ok, error } = await upsertLeads(validLeads);
        if (!ok) {
          console.error('❌ Erro ao fazer upsert de leads:', error);
          stats.totalErrors++;
        } else {
          console.log(`✅ Upsert de ${validLeads.length} leads realizado com sucesso!`);
        }
      } else {
        console.log('⚠️  Nenhum lead válido para upsert no lote.');
      }

      // Aguardar DELAY_BETWEEN_PAGES entre lotes
      await sleep(CONFIG.SPRINTHUB.DELAY_BETWEEN_PAGES);
    }

    const endTime = new Date();
    const duration = (endTime - stats.startTime) / 1000;
    console.log(`\n🎉 SINCRONIZAÇÃO ULTRA-OTIMIZADA FINALIZADA!`);
    console.log(`⏱️  Tempo total: ${duration.toFixed(1)} segundos`);
    console.log(`📊 Total de leads processados: ${allLeads.length}`);
    console.log(`💾 Total de leads sincronizados: ${stats.totalInserted}`);
    console.log(`🔄 Total de chamadas à API: ${stats.totalApiCalls}`);
    console.log(`❌ Total de erros: ${stats.totalErrors}`);
    console.log(`⚡ Velocidade: ${(allLeads.length / duration).toFixed(1)} leads/segundo`);
  } finally {
    await flushUnknownLeadFields();
  }
}

// Executar a sincronização
syncLeadsUltraOptimized().catch(e => { 
  console.error('❌ Erro fatal:', e); 
  process.exit(1); 
});

