const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Configurações
const API_TOKEN = process.env.API_TOKEN || 'sync-leads-2025-aB3cD7eF9gH2jK5mN8pQ1rS4tU7vW0xY';

// Configuração do Supabase
const readFromFile = (filePath) => {
  if (!filePath) return null;
  try {
    return fs.readFileSync(filePath, 'utf8').trim();
  } catch (error) {
    console.warn(`⚠️ Não foi possível ler o arquivo ${filePath}: ${error.message}`);
    return null;
  }
};

const requireEnv = (candidates, label) => {
  for (const candidate of candidates) {
    if (!candidate) continue;
    if (candidate.startsWith('file://')) {
      const value = readFromFile(candidate.replace('file://', ''));
      if (value) return value;
    } else {
      return candidate;
    }
  }
  throw new Error(`Variável de ambiente obrigatória ausente: ${label}`);
};

const SUPABASE_URL = requireEnv([
  process.env.SUPABASE_URL,
  process.env.VITE_SUPABASE_URL,
  readFromFile(process.env.SUPABASE_URL_FILE)
], 'SUPABASE_URL');

const SUPABASE_KEY = requireEnv([
  process.env.SUPABASE_KEY,
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY,
  process.env.VITE_SUPABASE_KEY,
  readFromFile(process.env.SUPABASE_KEY_FILE)
], 'SUPABASE_KEY');

// Configuração do SprintHub
const SPRINTHUB_BASE_URL = requireEnv([
  process.env.SPRINTHUB_BASE_URL,
  process.env.VITE_SPRINTHUB_BASE_URL,
  readFromFile(process.env.SPRINTHUB_BASE_URL_FILE)
], 'SPRINTHUB_BASE_URL');

const SPRINTHUB_INSTANCE = requireEnv([
  process.env.SPRINTHUB_INSTANCE,
  process.env.VITE_SPRINTHUB_INSTANCE,
  readFromFile(process.env.SPRINTHUB_INSTANCE_FILE)
], 'SPRINTHUB_INSTANCE');

const SPRINTHUB_TOKEN = requireEnv([
  process.env.SPRINTHUB_TOKEN,
  process.env.VITE_SPRINTHUB_API_TOKEN,
  readFromFile(process.env.SPRINTHUB_TOKEN_FILE)
], 'SPRINTHUB_TOKEN');

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  db: { schema: 'api' }
});

const SPRINTHUB_CONFIG = {
  baseUrl: SPRINTHUB_BASE_URL,
  instance: SPRINTHUB_INSTANCE,
  apiToken: SPRINTHUB_TOKEN
};

const PAGE_LIMIT = parseInt(process.env.SPRINTHUB_PAGE_LIMIT || '200', 10);
const DELAY_BETWEEN_PAGES = parseInt(process.env.SPRINTHUB_DELAY_MS || '500', 10);
const RATE_LIMIT_DELAY = parseInt(process.env.SPRINTHUB_RATE_LIMIT_DELAY_MS || '4000', 10);

// Middleware de autenticação
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token || token !== API_TOKEN) {
    return res.status(401).json({ 
      error: 'Token de acesso inválido',
      message: 'Forneça um token válido no header Authorization: Bearer <token>'
    });
  }

  next();
};

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    service: 'sync-leads-api',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Endpoint principal de sincronização
app.post('/sync', authenticateToken, async (req, res) => {
  console.log('🚀 Iniciando sincronização de leads...');
  
  try {
    const result = await syncLeads();
    res.json({
      success: true,
      message: 'Sincronização de leads concluída com sucesso',
      data: result
    });
  } catch (error) {
    console.error('❌ Erro na sincronização:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno na sincronização',
      message: error.message
    });
  }
});

// Função de sincronização
async function syncLeads() {
  let page = 0;
  let totalProcessed = 0;
  let totalErrors = 0;
  let totalArchived = 0;
  let totalActive = 0;
  const startedAt = Date.now();

  console.log(`⚙️  Config: limit=${PAGE_LIMIT}, delay=${DELAY_BETWEEN_PAGES}ms`);

  while (true) {
    const pageData = await fetchLeadsFromSprintHub(page);
    if (!pageData || !pageData.leads || pageData.leads.length === 0) {
      console.log('🏁 Nenhuma lead adicional. Sincronização concluída.');
      break;
    }

    const mappedBatch = pageData.leads.map(mapLeadToSupabase);
    mappedBatch.forEach((lead) => {
      if (lead.archived) totalArchived++;
      else totalActive++;
    });

    const upsertResult = await upsertLeadsBatch(mappedBatch);
    if (!upsertResult.success) {
      totalErrors += upsertResult.failed;
    }

    totalProcessed += mappedBatch.length;
    console.log(`✅ Página ${page + 1}: ${mappedBatch.length} leads enviados (total acumulado: ${totalProcessed})`);

    page++;
    await sleep(DELAY_BETWEEN_PAGES);
  }

  const finishedAt = new Date();
  return {
    totalProcessed,
    totalActive,
    totalArchived,
    totalErrors,
    finishedAt: finishedAt.toISOString(),
    durationMs: Date.now() - startedAt
  };
}

// Função para buscar leads do SprintHub
async function fetchLeadsFromSprintHub(page = 0, limit = PAGE_LIMIT) {
  const params = new URLSearchParams({
    i: SPRINTHUB_CONFIG.instance,
    page: page.toString(),
    limit: limit.toString(),
    allFields: '1',
    apitoken: SPRINTHUB_CONFIG.apiToken
  });

  const url = `https://${SPRINTHUB_CONFIG.baseUrl}/leads?${params.toString()}`;

  try {
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${SPRINTHUB_CONFIG.apiToken}`,
        'apitoken': SPRINTHUB_CONFIG.apiToken
      }
    });

    if (response.status === 401 || response.status === 429) {
      let errorData = {};
      try {
        errorData = await response.json();
      } catch (err) {
        console.warn('⚠️ Falha ao decodificar erro da SprintHub:', err.message);
      }

      if ((errorData.msg || '').toLowerCase().includes('too many requests')) {
        console.log(`⏳ Rate limit atingido. Aguardando ${RATE_LIMIT_DELAY}ms...`);
        await sleep(RATE_LIMIT_DELAY);
        return fetchLeadsFromSprintHub(page, limit);
      }

      throw new Error(`Erro de autenticação SprintHub: ${JSON.stringify(errorData)}`);
    }

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`HTTP ${response.status} - ${body}`);
    }

    const data = await response.json();
    return data?.data || { leads: [] };
  } catch (error) {
    console.error(`❌ Erro ao buscar leads da página ${page + 1}:`, error.message);
    return null;
  }
}

// Função para inserir/atualizar leads no Supabase (batch)
async function upsertLeadsBatch(leads) {
  if (!Array.isArray(leads) || leads.length === 0) {
    return { success: true, inserted: 0, failed: 0 };
  }

  try {
    const { error } = await supabase
      .from('leads')
      .upsert(leads, { onConflict: 'id' });

    if (error) {
      console.error('❌ Erro no upsert em lote:', error.message);
      return { success: false, failed: leads.length };
    }

    return { success: true, inserted: leads.length, failed: 0 };
  } catch (error) {
    console.error('❌ Erro inesperado no upsert em lote:', error.message);
    return { success: false, failed: leads.length };
  }
}

const parseDateTime = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
};

const parseDateOnly = (value) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString().split('T')[0];
};

const toInteger = (value) => {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value === 'number' && Number.isFinite(value)) return Math.trunc(value);
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (/^-?\d+$/.test(trimmed)) {
      const parsed = parseInt(trimmed, 10);
      return Number.isNaN(parsed) ? null : parsed;
    }
  }
  return null;
};

const toBigintField = (value) => {
  const parsed = toInteger(value);
  return parsed === null ? null : parsed;
};

// Função para mapear dados do SprintHub para Supabase
function mapLeadToSupabase(lead) {
  const fullnameParts = [lead.firstname, lead.lastname].filter(Boolean);
  const fullname = lead.fullname || (fullnameParts.length ? fullnameParts.join(' ').trim() : null);

  return {
    id: toBigintField(lead.id),
    firstname: lead.firstname ?? null,
    lastname: lead.lastname ?? null,
    email: lead.email ?? null,
    phone: lead.phone ?? null,
    mobile: lead.mobile ?? null,
    whatsapp: lead.whatsapp ?? null,
    photo_url: lead.photoUrl ?? null,
    address: lead.address ?? null,
    city: lead.city ?? null,
    state: lead.state ?? null,
    zipcode: lead.zipcode ?? null,
    country: lead.country ?? null,
    timezone: lead.timezone ?? null,
    bairro: lead.bairro ?? null,
    complemento: lead.complemento ?? null,
    numero_entrega: lead.numero_entrega ?? null,
    rua_entrega: lead.rua_entrega ?? null,
    company: lead.company ?? null,
    points: toInteger(lead.points) ?? 0,
    owner: toBigintField(lead.owner),
    stage: lead.stage ?? null,
    preferred_locale: lead.preferred_locale ?? null,
    user_access: lead.userAccess ?? null,
    department_access: lead.departmentAccess ?? null,
    ignore_sub_departments: Boolean(lead.ignoreSubDepartments),
    create_date: parseDateTime(lead.createDate),
    updated_date: parseDateTime(lead.updatedDate),
    last_active: parseDateTime(lead.lastActive),
    created_by: toBigintField(lead.createdBy),
    created_by_name: lead.createdByName ?? null,
    created_by_type: lead.createdByType ?? null,
    updated_by: toBigintField(lead.updatedBy),
    updated_by_name: lead.updatedByName ?? null,
    synced_at: new Date().toISOString(),
    archived: Boolean(lead.archived),
    third_party_data: lead.thirdPartyData ?? null,
    capital_de_investimento: lead.capital_de_investimento ?? null,
    tipo_de_compra: lead.tipo_de_compra ?? null,
    pedidos_shopify: lead.pedidos_shopify ?? null,
    categoria: lead.categoria ?? lead.category ?? null,
    classificacao_google: lead.classificacao_google ?? null,
    grau_de_interesse: lead.grau_de_interesse ?? null,
    star_score: lead.star_score ?? null,
    avaliacao_atendente: lead.avaliacao_atendente ?? null,
    avaliacao_atendimento: lead.avaliacao_atendimento ?? null,
    qualificacao_callix: lead.qualificacao_callix ?? null,
    origem: lead.origem ?? lead.origin ?? null,
    origem_manipulacao: lead.origem_manipulacao ?? null,
    lista_de_origem: lead.lista_de_origem ?? null,
    criativo: lead.criativo ?? null,
    plataforma: lead.plataforma ?? null,
    redes_sociais: lead.redes_sociais ?? null,
    site: lead.site ?? null,
    atendente: lead.atendente ?? null,
    atendente_atual: lead.atendente_atual ?? null,
    feedback: lead.feedback ?? null,
    observacao: lead.observacao ?? lead.observation ?? null,
    observacoes_do_lead: lead.observacoes_do_lead ?? null,
    comportamento_da_ia: lead.comportamento_da_ia ?? null,
    retorno: lead.retorno ?? null,
    prescritor: lead.prescritor ?? null,
    produto: lead.produto ?? lead.product ?? null,
    drograria: lead.drograria ?? null,
    data_recompra: parseDateOnly(lead.data_recompra),
    mes_que_entrou: lead.mes_que_entrou ?? null,
    cpf: lead.cpf ?? null,
    rg: lead.rg ?? null,
    arquivo_receita: lead.arquivo_receita ?? null,
    id_t56: lead.id_t56 ?? null,
    empresa: lead.empresa ?? null,
    sexo: lead.sexo ?? null,
    data_de_nascimento: parseDateOnly(lead.data_de_nascimento),
    objetivos_do_cliente: lead.objetivos_do_cliente ?? null,
    perfil_do_cliente: lead.perfil_do_cliente ?? null,
    recebedor: lead.recebedor ?? null,
    whatsapp_remote_lid: lead.whatsapp_remote_lid ?? null,
    status: lead.status ?? null,
    sh_status: lead.sh_status ?? null,
    data_do_contato: parseDateOnly(lead.data_do_contato),
    segmento: lead.segmento ?? lead.segment ?? null,
    fullname
  };
}

// Função utilitária para delay
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

// Iniciar servidor (apenas quando executado diretamente)
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚀 API de sincronização de leads rodando na porta ${PORT}`);
    console.log(`🔗 Health check: http://localhost:${PORT}/health`);
    console.log(`🔄 Sync endpoint: http://localhost:${PORT}/sync`);
  });
}

module.exports = { app, syncLeads };

