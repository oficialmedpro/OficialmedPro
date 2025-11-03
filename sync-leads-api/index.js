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
const SUPABASE_URL = process.env.SUPABASE_URL || fs.readFileSync(process.env.SUPABASE_URL_FILE, 'utf8').trim();
const SUPABASE_KEY = process.env.SUPABASE_KEY || fs.readFileSync(process.env.SUPABASE_KEY_FILE, 'utf8').trim();

// Configuração do SprintHub
const SPRINTHUB_BASE_URL = process.env.SPRINTHUB_BASE_URL || fs.readFileSync(process.env.SPRINTHUB_BASE_URL_FILE, 'utf8').trim();
const SPRINTHUB_INSTANCE = process.env.SPRINTHUB_INSTANCE || fs.readFileSync(process.env.SPRINTHUB_INSTANCE_FILE, 'utf8').trim();
const SPRINTHUB_TOKEN = process.env.SPRINTHUB_TOKEN || fs.readFileSync(process.env.SPRINTHUB_TOKEN_FILE, 'utf8').trim();

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  db: { schema: 'api' }
});

const SPRINTHUB_CONFIG = {
  baseUrl: SPRINTHUB_BASE_URL,
  instance: SPRINTHUB_INSTANCE,
  apiToken: SPRINTHUB_TOKEN
};

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
  const PAGE_LIMIT = 100;
  const DELAY_BETWEEN_PAGES = 2000;
  
  let page = 0;
  let totalProcessed = 0;
  let totalInserted = 0;
  let totalErrors = 0;

  while (true) {
    const leadsPage = await fetchLeadsFromSprintHub(page);
    if (!leadsPage || leadsPage.length === 0) {
      console.log('🏁 Nenhuma lead encontrada ou erro na API. Finalizando sincronização.');
      break;
    }

    for (const sprintHubLead of leadsPage) {
      totalProcessed++;
      const mappedLead = mapLeadToSupabase(sprintHubLead);
      const result = await insertOrUpdateLead(mappedLead);

      if (result.success) {
        totalInserted++;
      } else {
        totalErrors++;
      }
    }

    console.log(`✅ Página ${page + 1}: ${leadsPage.length} processados`);
    page++;
    await sleep(DELAY_BETWEEN_PAGES);
  }

  return {
    totalProcessed,
    totalInserted,
    totalErrors,
    timestamp: new Date().toISOString()
  };
}

// Função para buscar leads do SprintHub
async function fetchLeadsFromSprintHub(page = 0, limit = 100) {
  const url = `https://${SPRINTHUB_CONFIG.baseUrl}/leads?i=${SPRINTHUB_CONFIG.instance}&page=${page}&limit=${limit}&apitoken=${SPRINTHUB_CONFIG.apiToken}`;
  
  try {
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${SPRINTHUB_CONFIG.apiToken}`,
        'apitoken': SPRINTHUB_CONFIG.apiToken
      }
    });

    if (response.status === 401) {
      const errorData = await response.json();
      if (errorData.msg.includes('too many requests')) {
        console.log(`⏳ Rate limit atingido. Aguardando...`);
        await sleep(DELAY_BETWEEN_PAGES);
        return fetchLeadsFromSprintHub(page, limit);
      }
      return null;
    }

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.data.leads;
  } catch (error) {
    console.error(`❌ Erro ao buscar leads da página ${page + 1}:`, error.message);
    return null;
  }
}

// Função para inserir/atualizar lead no Supabase
async function insertOrUpdateLead(leadData) {
  try {
    const { data, error } = await supabase
      .from('leads')
      .upsert(leadData, { onConflict: 'id', ignoreDuplicates: false })
      .select();

    if (error) {
      console.error(`❌ Erro na inserção/atualização do lead ${leadData.id}:`, error.message);
      return { success: false, error: error.message };
    }
    return { success: true, data: data };
  } catch (error) {
    console.error(`❌ Erro inesperado ao inserir/atualizar lead ${leadData.id}:`, error.message);
    return { success: false, error: error.message };
  }
}

// Função para mapear dados do SprintHub para Supabase
function mapLeadToSupabase(sprintHubLead) {
  return {
    id: sprintHubLead.id,
    firstname: sprintHubLead.firstname || null,
    lastname: sprintHubLead.lastname || null,
    email: sprintHubLead.email || null,
    phone: sprintHubLead.phone || null,
    mobile: sprintHubLead.mobile || null,
    whatsapp: sprintHubLead.whatsapp || null,
    address: sprintHubLead.address || null,
    city: sprintHubLead.city || null,
    state: sprintHubLead.state || null,
    zipcode: sprintHubLead.zipcode || null,
    country: sprintHubLead.country || null,
    company: sprintHubLead.company || null,
    status: sprintHubLead.status || null,
    origem: sprintHubLead.origin || null,
    categoria: sprintHubLead.category || null,
    segmento: sprintHubLead.segment || null,
    stage: sprintHubLead.stage || null,
    observacao: sprintHubLead.observation || null,
    produto: sprintHubLead.product || null,
    create_date: sprintHubLead.createDate ? new Date(sprintHubLead.createDate).toISOString() : null,
    updated_date: sprintHubLead.updateDate ? new Date(sprintHubLead.updateDate).toISOString() : null,
    synced_at: new Date().toISOString(),
  };
}

// Função utilitária para delay
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 API de sincronização de leads rodando na porta ${PORT}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  console.log(`🔄 Sync endpoint: http://localhost:${PORT}/sync`);
});

module.exports = app;

