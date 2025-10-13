#!/usr/bin/env node

/**
 * 🚀 sync-leads-ultra.js | Sincronização ultrarrápida de todos os leads do SprintHub para Supabase
 *
 * - Busca todos os leads do SprintHub em páginas grandes (PAGE_LIMIT = 200)
 * - Busca detalhes completos de cada lead em paralelo (BATCH_SIZE = 20+)
 * - Faz bulk insert de TODOS os leads de cada página via uma única requisição no Supabase
 * - NÃO faz update nem checagem de existência (útil para importação incial/forçada)
 * - DELAY mínimo entre páginas
 *
 * Edite as variáveis do bloco CONFIG para ajustar ao seu ambiente, se necessário!
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ---- CONFIG----
const CONFIG = {
  SPRINTHUB: {
    baseUrl: process.env.VITE_SPRINTHUB_BASE_URL || 'sprinthub-api-master.sprinthub.app',
    apiToken: process.env.VITE_SPRINTHUB_API_TOKEN || '',
    instance: process.env.VITE_SPRINTHUB_INSTANCE || 'oficialmed',
    PAGE_LIMIT: 200, // <<---- maior possível (máximo aceito pela API)
    BATCH_SIZE: 20,  // <<---- maior possível (número de detalhes feitos em paralelo por página)
    DELAY_BETWEEN_PAGES: 2000 // ms (ajuste para 1000 se não der erro! monitore)
  },
  SUPABASE: {
    url: process.env.VITE_SUPABASE_URL,
    key: process.env.VITE_SUPABASE_SERVICE_ROLE_KEY
  },
  CHECKPOINT_FILE: path.join(__dirname, 'checkpoint-leads-ultra.json')
};

const stats = {
  totalApiCalls: 0,
  totalInserted: 0,
  totalErrors: 0,
  startTime: null
};

// Utilitário simple delay
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

// Utilitário de fetch agnóstico
async function makeRequest(url, options = {}) {
  try {
    const fetchOptions = {
      method: options.method || 'GET',
      headers: options.headers || {},
      body: options.body || null,
      timeout: 35000
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

// Bulk insert of leads no Supabase
async function bulkInsertLeads(leads) {
  const { url, key } = CONFIG.SUPABASE;
  const url_ = `${url}/rest/v1/leads`;
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${key}`,
    'apikey': key,
    'Accept-Profile': 'api',
    'Content-Profile': 'api',
    'Prefer': 'return=minimal'
  };
  
  const response = await makeRequest(url_, {
    method: 'POST',
    headers,
    body: JSON.stringify(leads)
  });
  
  if (!response.ok) {
    console.error('Erro ao fazer bulk insert no Supabase:', response.data);
    stats.totalErrors++;
    return { ok: false, error: response.data };
  }
  stats.totalInserted += leads.length;
  return { ok: true, data: response.data };
}

// Função principal para sincronizar leads
async function syncLeads() {
  stats.startTime = new Date();
  console.log('Iniciando sincronização de leads...');

  // Carregar checkpoint (se existir)
  let checkpoint = { lastPage: 0 };
  if (fs.existsSync(CONFIG.CHECKPOINT_FILE)) {
    try {
      checkpoint = JSON.parse(fs.readFileSync(CONFIG.CHECKPOINT_FILE, 'utf8'));
      console.log(`Checkpoint carregado: Última página processada ${checkpoint.lastPage}`);
    } catch (e) {
      console.error('Erro ao ler checkpoint:', e);
      process.exit(1);
    }
  }

  let currentPage = checkpoint.lastPage + 1;
  let allLeads = [];

  while (true) {
    console.log(`Buscando página ${currentPage}...`);
    const response = await fetchLeadsPage(currentPage);
    console.log('Resposta SprintHub:', response); // Debug: veja o formato real!
    let data = [];
    if (response.ok && response.data && response.data.data && Array.isArray(response.data.data.leads)) {
      data = response.data.data.leads;
    } else {
      console.error('Erro: formato inesperado na resposta da API ou requisição falhou. Veja detalhes acima.');
      if (!response.ok) {
        console.error('Status HTTP', response.status, response.data);
      }
      break;
    }

    if (!data.length) {
      console.log('Fim dos leads!');
      break;
    }

    allLeads = [...allLeads, ...data];

    // Salvar checkpoint após cada página
    try {
      fs.writeFileSync(CONFIG.CHECKPOINT_FILE, JSON.stringify(checkpoint));
      console.log(`Checkpoint salvo: Última página processada ${currentPage}`);
    } catch (e) {
      console.error('Erro ao salvar checkpoint:', e);
      process.exit(1);
    }

    // Aguardar DELAY_BETWEEN_PAGES
    await sleep(CONFIG.SPRINTHUB.DELAY_BETWEEN_PAGES);
    currentPage++;
  }

  if (allLeads.length === 0) {
    console.log('Nenhum lead encontrado para sincronizar. Finalizando.');
    return;
  }

  console.log(`Total de leads encontrados: ${allLeads.length}`);

  // Processar leads em lotes
  const BATCH_SIZE = CONFIG.SPRINTHUB.BATCH_SIZE;
  for (let i = 0; i < allLeads.length; i += BATCH_SIZE) {
    const batch = allLeads.slice(i, i + BATCH_SIZE);
    console.log(`Processando lote ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(allLeads.length / BATCH_SIZE)} (Leads: ${batch.length})...`);

    const leadsToInsert = await Promise.all(batch.map(async lead => {
      const details = await fetchLeadDetails(lead.id);
      if (details.ok) {
        return mapLeadFields(details.data);
      } else {
        console.error(`Erro ao buscar detalhes do lead ${lead.id}:`, details.status, details.data);
        stats.totalErrors++;
        return null; // Não incluir leads com erro
      }
    }));

    const validLeads = leadsToInsert.filter(lead => lead !== null);

    if (validLeads.length > 0) {
      const { ok, error } = await bulkInsertLeads(validLeads);
      if (!ok) {
        console.error('Erro ao fazer bulk insert de leads:', error);
        stats.totalErrors++;
      } else {
        console.log(`Bulk insert de ${validLeads.length} leads realizado com sucesso.`);
      }
    } else {
      console.log('Nenhum lead válido para inserção no lote.');
    }

    // Aguardar DELAY_BETWEEN_PAGES entre lotes
    await sleep(CONFIG.SPRINTHUB.DELAY_BETWEEN_PAGES);
  }

  const endTime = new Date();
  const duration = (endTime - stats.startTime) / 1000;
  console.log(`Sincronização finalizada. Total de leads inseridos: ${stats.totalInserted}`);
  console.log(`Total de chamadas à API: ${stats.totalApiCalls}`);
  console.log(`Tempo total de execução: ${duration} segundos.`);
}

// Executar a sincronização
syncLeads().catch(e => { console.error(e); process.exit(1); });
