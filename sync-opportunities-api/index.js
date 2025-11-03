const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3002;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Configurações
const API_TOKEN = process.env.API_TOKEN || 'sync-opportunities-2025-bC4dE8fG0hI3jL6nO9qR2sT5uV8wX1yZ';

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
    service: 'sync-opportunities-api',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Endpoint principal de sincronização
app.post('/sync', authenticateToken, async (req, res) => {
  console.log('🚀 Iniciando sincronização de oportunidades...');
  
  try {
    const result = await syncOpportunities();
    res.json({
      success: true,
      message: 'Sincronização de oportunidades concluída com sucesso',
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
async function syncOpportunities() {
  const FUNNELS = [
    { id: 1, name: 'Funnel Principal' },
    { id: 2, name: 'Funnel Secundário' }
  ];
  
  const STAGES = [
    { id: 1, name: 'Novo' },
    { id: 2, name: 'Qualificado' },
    { id: 3, name: 'Proposta' },
    { id: 4, name: 'Negociação' },
    { id: 5, name: 'Fechado' }
  ];

  let totalProcessed = 0;
  let totalInserted = 0;
  let totalErrors = 0;

  for (const funnel of FUNNELS) {
    for (const stage of STAGES) {
      console.log(`🔄 Processando Funnel ${funnel.name} - Stage ${stage.name}...`);
      
      let page = 0;
      const PAGE_LIMIT = 50;
      
      while (true) {
        const opportunities = await fetchOpportunitiesFromStage(funnel.id, stage.id, page, PAGE_LIMIT);
        
        if (!opportunities || opportunities.length === 0) {
          break;
        }

        for (const opportunity of opportunities) {
          totalProcessed++;
          const mappedOpportunity = mapOpportunityToSupabase(opportunity);
          const result = await insertOrUpdateOpportunity(mappedOpportunity);

          if (result.success) {
            totalInserted++;
          } else {
            totalErrors++;
          }
        }

        page++;
        await sleep(1000); // Delay entre páginas
      }
    }
  }

  return {
    totalProcessed,
    totalInserted,
    totalErrors,
    timestamp: new Date().toISOString()
  };
}

// Função para buscar oportunidades do SprintHub
async function fetchOpportunitiesFromStage(funnelId, stageId, page = 0, limit = 50) {
  const url = `https://${SPRINTHUB_CONFIG.baseUrl}/crm/opportunities/${funnelId}`;
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SPRINTHUB_CONFIG.apiToken}`,
        'apitoken': SPRINTHUB_CONFIG.apiToken
      },
      body: JSON.stringify({
        stage: stageId,
        page: page,
        limit: limit
      })
    });

    if (response.status === 401) {
      const errorData = await response.json();
      if (errorData.msg.includes('too many requests')) {
        console.log(`⏳ Rate limit atingido. Aguardando...`);
        await sleep(2000);
        return fetchOpportunitiesFromStage(funnelId, stageId, page, limit);
      }
      return null;
    }

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.data.opportunities || [];
  } catch (error) {
    console.error(`❌ Erro ao buscar oportunidades:`, error.message);
    return null;
  }
}

// Função para inserir/atualizar oportunidade no Supabase
async function insertOrUpdateOpportunity(opportunityData) {
  try {
    const { data, error } = await supabase
      .from('oportunidades')
      .upsert(opportunityData, { onConflict: 'id', ignoreDuplicates: false })
      .select();

    if (error) {
      console.error(`❌ Erro na inserção/atualização da oportunidade ${opportunityData.id}:`, error.message);
      return { success: false, error: error.message };
    }
    return { success: true, data: data };
  } catch (error) {
    console.error(`❌ Erro inesperado ao inserir/atualizar oportunidade ${opportunityData.id}:`, error.message);
    return { success: false, error: error.message };
  }
}

// Função para mapear dados do SprintHub para Supabase
function mapOpportunityToSupabase(opportunity) {
  return {
    id: opportunity.id,
    title: opportunity.title || null,
    value: opportunity.value || null,
    currency: opportunity.currency || 'BRL',
    stage: opportunity.stage || null,
    funnel: opportunity.funnel || null,
    lead_id: opportunity.leadId || null,
    company: opportunity.company || null,
    contact_name: opportunity.contactName || null,
    contact_email: opportunity.contactEmail || null,
    contact_phone: opportunity.contactPhone || null,
    description: opportunity.description || null,
    source: opportunity.source || null,
    probability: opportunity.probability || null,
    expected_close_date: opportunity.expectedCloseDate ? new Date(opportunity.expectedCloseDate).toISOString() : null,
    actual_close_date: opportunity.actualCloseDate ? new Date(opportunity.actualCloseDate).toISOString() : null,
    created_at: opportunity.createDate ? new Date(opportunity.createDate).toISOString() : null,
    updated_at: opportunity.updateDate ? new Date(opportunity.updateDate).toISOString() : null,
    synced_at: new Date().toISOString(),
  };
}

// Função utilitária para delay
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 API de sincronização de oportunidades rodando na porta ${PORT}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  console.log(`🔄 Sync endpoint: http://localhost:${PORT}/sync`);
});

module.exports = app;

