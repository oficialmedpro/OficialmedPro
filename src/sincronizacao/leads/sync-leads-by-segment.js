#!/usr/bin/env node

/**
 * 🚀 sync-leads-by-segment.js | Sincroniza leads de um segmento específico do SprintHub para Supabase
 *
 * - Busca leads de um segmento usando POST e paginação
 * - Insere ou atualiza no Supabase igual aos scripts existentes
 * - Requer variáveis de ambiente VITE_SPRINTHUB_API_TOKEN, VITE_SUPABASE_URL, VITE_SUPABASE_SERVICE_ROLE_KEY
 *
 * Exemplo de uso:
 *   node sync-leads-by-segment.js 123
 * (onde 123 é o ID do segmento desejado)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const CONFIG = {
  SPRINTHUB: {
    baseUrl: process.env.VITE_SPRINTHUB_BASE_URL || 'sprinthub-api-master.sprinthub.app',
    apiToken: process.env.VITE_SPRINTHUB_API_TOKEN,
    instance: process.env.VITE_SPRINTHUB_INSTANCE || 'oficialmed',
  },
  SUPABASE: {
    url: process.env.VITE_SUPABASE_URL,
    key: process.env.VITE_SUPABASE_SERVICE_ROLE_KEY,
  },
  PAGE_LIMIT: 100,
  CHECKPOINT_FILE: path.join(__dirname, 'checkpoint-leads-by-segment.json')
};

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

const stats = {
  totalApiCalls: 0,
  totalProcessed: 0,
  totalInserted: 0,
  totalUpdated: 0,
  totalSkipped: 0,
  totalErrors: 0,
  startTime: null
};

async function makeRequest(url, options = {}) {
  try {
    const fetchOptions = {
      method: options.method || 'GET',
      headers: options.headers || {},
      body: options.body || null,
      timeout: 35000
    };
    if (fetchOptions.body) {
      // DEBUG: Mostrar body enviado
      console.log(colors.magenta + '\n- Body enviado:\n' + fetchOptions.body + colors.reset);
    }
    const resp = await fetch(url, fetchOptions);
    let data;
    try {
      // tenta sempre parsear como JSON primeiramente
      data = await resp.clone().json();
    } catch {
      // se falhar tenta como texto puro
      data = await resp.text();
    }
    return { ok: resp.ok, status: resp.status, data };
  } catch (error) {
    return { ok: false, status: 500, data: error.message };
  }
}

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

// Mapear apenas campos que EXISTEM na tabela api.leads + segmento
function mapLeadFieldsFromSegment(lead, segmentId) {
  return {
    id: lead.id,
    firstname: lead.fullname?.split(' ')[0] || null, // Primeira palavra do fullname
    lastname: lead.fullname?.split(' ').slice(1).join(' ') || null, // Resto do nome
    email: lead.email || null,
    points: parseInt(lead.points) || 0,
    city: lead.city || null,
    state: lead.state || null,
    country: lead.country || null,
    last_active: lead.lastActive || null,
    archived: lead.archived || false,
    create_date: lead.createDate || null,
    segmento: parseInt(segmentId) // Campo segmento com ID do segmento
  };
}

async function checkInSupabase(leadId) {
  try {
    const url = `${CONFIG.SUPABASE.url}/rest/v1/leads?select=id,synced_at&id=eq.${leadId}`;
    const resp = await makeRequest(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${CONFIG.SUPABASE.key}`,
        'apikey': CONFIG.SUPABASE.key,
        'Accept-Profile': 'api'
      }
    });
    if (resp.ok && Array.isArray(resp.data) && resp.data.length > 0) {
      return resp.data[0];
    }
    return null;
  } catch (error) {
    return null;
  }
}

async function insertToSupabase(data) {
  try {
    const url = `${CONFIG.SUPABASE.url}/rest/v1/leads`;
    const resp = await postRequest(url, data, {
      'Authorization': `Bearer ${CONFIG.SUPABASE.key}`,
      'apikey': CONFIG.SUPABASE.key,
      'Prefer': 'return=representation',
      'Content-Profile': 'api',
      'Accept-Profile': 'api',
    });
    return { success: resp.ok, status: resp.status, data: resp.data };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function updateInSupabase(leadId, data) {
  try {
    const url = `${CONFIG.SUPABASE.url}/rest/v1/leads?id=eq.${leadId}`;
    const resp = await patchRequest(url, data, {
      'Authorization': `Bearer ${CONFIG.SUPABASE.key}`,
      'apikey': CONFIG.SUPABASE.key,
      'Prefer': 'return=representation',
      'Content-Profile': 'api',
      'Accept-Profile': 'api',
    });
    return { success: resp.ok, status: resp.status };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

function showProgress(current, total, details = '') {
  const percentage = Math.round((current / total) * 100);
  const barLength = 40;
  const filledLength = Math.round(barLength * (current / total));
  const bar = '█'.repeat(filledLength) + '░'.repeat(barLength - filledLength);
  process.stdout.write(`\r${colors.cyan}[${bar}] ${percentage}% (${current}/${total}) ${details}${colors.reset}`);
  if (current === total) process.stdout.write('\n');
}

function saveCheckpoint(data) {
  try {
    fs.writeFileSync(CONFIG.CHECKPOINT_FILE, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error(`${colors.yellow}⚠️ Não foi possível salvar checkpoint:${colors.reset}`, error.message);
  }
}

function loadCheckpoint() {
  try {
    if (fs.existsSync(CONFIG.CHECKPOINT_FILE)) {
      const data = fs.readFileSync(CONFIG.CHECKPOINT_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {}
  return { lastPage: 0 };
}

async function main() {
  // Recebe segmento via cli
  const segmentId = process.argv[2];
  if (!segmentId) {
    console.error(`${colors.red}ERRO: Informe o ID do segmento como parâmetro${colors.reset}`);
    process.exit(1);
  }
  if (!CONFIG.SUPABASE.url || !CONFIG.SUPABASE.key || !CONFIG.SPRINTHUB.apiToken) {
    console.error(`${colors.red}ERRO: Variáveis de ambiente não configuradas${colors.reset}`);
    process.exit(1);
  }

  let page = 0;
  let total = 99999;
  let processed = 0;
  stats.startTime = Date.now();
  const checkpoint = loadCheckpoint();
  page = checkpoint.lastPage || 0;
  console.log(`${colors.cyan}== Sincronização de leads do segmento ${segmentId} ==${colors.reset}`);

  while (processed < total) {
    const body = {
      page,
      limit: CONFIG.PAGE_LIMIT,
      orderByKey: 'createDate',
      orderByDirection: 'desc',
      showAnon: false,
      search: '',
      query: '{total,leads{id,fullname,photoUrl,email,points,city,state,country,lastActive,archived,owner{completName},companyData{companyname},createDate}}',
      showArchived: false,
      additionalFilter: null,
      idOnly: false
    };

    let instance = CONFIG.SPRINTHUB.instance || 'oficialmed';
    const url = `https://${CONFIG.SPRINTHUB.baseUrl}/leadsfromtype/segment/${segmentId}?i=${instance}`;
    stats.totalApiCalls++;
    const resp = await postRequest(url, body, {
      'Authorization': `Bearer ${CONFIG.SPRINTHUB.apiToken}`,
      'apitoken': CONFIG.SPRINTHUB.apiToken
    });
    if (!resp.ok) {
      console.error(`${colors.red}Erro na API:${colors.reset}`, resp.status, JSON.stringify(resp.data));
      break;
    }

    // Resposta esperada: {data: {total, leads: [...]}}
    const leads = resp.data.data?.leads || [];
    total = resp.data.data?.total || 0;
    if (leads.length === 0) {
      console.log(`${colors.green}Nenhum lead retornado na página ${page}${colors.reset}`);
      break;
    }
    console.log(`${colors.blue}Página ${page+1}: Recebidos ${leads.length} leads (total: ${total})${colors.reset}`);

    for (let i = 0; i < leads.length; i++) {
      const lead = leads[i];
      const mapped = mapLeadFieldsFromSegment(lead, segmentId);
      const existing = await checkInSupabase(mapped.id);
      let opResult;
      if (!existing) {
        opResult = await insertToSupabase(mapped);
        if (opResult.success) {
          stats.totalInserted++;
        } else {
          console.error(`${colors.red}❌ Erro INSERT no lead ${mapped.id}:${colors.reset}`, opResult.error || opResult.data);
          stats.totalErrors++;
        }
      } else {
        opResult = await updateInSupabase(mapped.id, mapped);
        if (opResult.success) {
          stats.totalUpdated++;
        } else {
          console.error(`${colors.red}❌ Erro UPDATE no lead ${mapped.id}:${colors.reset}`, opResult.error || opResult.data);
          stats.totalErrors++;
        }
      }
      stats.totalProcessed++;
      processed++;
      showProgress(i+1, leads.length, `Página ${page+1}`);
    }
    saveCheckpoint({ lastPage: page });
    page++;
    await new Promise(r => setTimeout(r, 2000)); // pequeno delay entre páginas
  }

  const duration = (Date.now() - stats.startTime)/1000;
  console.log(`${colors.green}Processo concluído. Leads processados: ${stats.totalProcessed}, inseridos: ${stats.totalInserted}, atualizados: ${stats.totalUpdated}, erros: ${stats.totalErrors}${colors.reset}`);
  console.log(`${colors.blue}Tempo total (s): ${duration}${colors.reset}`);
  if (fs.existsSync(CONFIG.CHECKPOINT_FILE)) fs.unlinkSync(CONFIG.CHECKPOINT_FILE);
}

main().catch(e => {console.error(e); process.exit(1);});
