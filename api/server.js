import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleAdsApi } from 'google-ads-api';
import { runReativacaoAutoSync } from './services/reativacaoAutoSync.js';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Carregar variáveis de ambiente
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const app = express();
const PORT = process.env.PORT || 3002;

// Middleware
app.use(cors());
app.use(express.json());

// Configurações do Supabase (para buscar credenciais)
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_SCHEMA = process.env.VITE_SUPABASE_SCHEMA || 'api';

// Configurações SprintHub (proxy)
const rawSprintBase = process.env.VITE_SPRINTHUB_BASE_URL || 'https://sprinthub-api-master.sprinthub.app';
const SPRINTHUB_BASE_URL = (rawSprintBase.startsWith('http') ? rawSprintBase : `https://${rawSprintBase}`).replace(/\/$/, '');
const SPRINTHUB_API_TOKEN = process.env.VITE_SPRINTHUB_API_TOKEN || '';
const SPRINTHUB_INSTANCE = process.env.VITE_SPRINTHUB_INSTANCE || '';
const REATIVACAO_SYNC_TOKEN = process.env.REATIVACAO_SYNC_TOKEN || process.env.API_TOKEN;

// Mapeamento de status do Google Ads
const statusMap = {
  2: 'ENABLED',
  3: 'PAUSED',
  4: 'REMOVED'
};

const statusStringMap = {
  'ENABLED': 'ENABLED',
  'PAUSED': 'PAUSED', 
  'REMOVED': 'REMOVED'
};

console.log('🚀 Servidor Google Ads API iniciando...');
console.log('📊 Supabase URL:', SUPABASE_URL);
console.log('🔑 Supabase Key:', SUPABASE_KEY ? '✅ Configurada' : '❌ Não configurada');

// Cache de credenciais
let cachedCredentials = null;
let credentialsExpiry = null;

// Importar script de sincronização
import { spawn } from 'child_process';

/**
 * Busca credenciais do Google Ads do Supabase
 */
async function getGoogleAdsCredentials() {
  try {
    // Verificar se o cache ainda é válido (5 minutos)
    if (cachedCredentials && credentialsExpiry && Date.now() < credentialsExpiry) {
      console.log('✅ Usando credenciais em cache');
      return cachedCredentials;
    }

    console.log('🔍 Buscando credenciais do Supabase...');
    
    const response = await fetch(`${SUPABASE_URL}/rest/v1/unidades?select=*&codigo_sprint=eq.[1]`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'apikey': SUPABASE_KEY,
        'Accept-Profile': SUPABASE_SCHEMA,
        'Content-Profile': SUPABASE_SCHEMA
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    }

    const data = await response.json();
    if (!data || data.length === 0) {
      throw new Error('Unidade Apucarana não encontrada');
    }

    const unidade = data[0];
    
    // Validar credenciais
    if (!unidade.google_customer_id || !unidade.google_developer_token || 
        !unidade.google_client_id || !unidade.google_client_secret || 
        !unidade.google_refresh_token || !unidade.google_ads_active) {
      throw new Error('Credenciais incompletas para unidade Apucarana');
    }

    const credentials = {
      customer_id: unidade.google_customer_id.replace(/-/g, ''), // Remover hífens
      developer_token: unidade.google_developer_token,
      client_id: unidade.google_client_id,
      client_secret: unidade.google_client_secret,
      refresh_token: unidade.google_refresh_token,
      unidade_name: unidade.unidade
    };

    // Cache por 5 minutos
    cachedCredentials = credentials;
    credentialsExpiry = Date.now() + (5 * 60 * 1000);

    console.log('✅ Credenciais carregadas para:', unidade.unidade);
    return credentials;

  } catch (error) {
    console.error('❌ Erro ao buscar credenciais:', error);
    throw error;
  }
}

/**
 * Obtém access token do Google OAuth2
 */
async function getAccessToken(credentials) {
  try {
    console.log('🔑 Obtendo access token...');
    
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: credentials.client_id,
        client_secret: credentials.client_secret,
        refresh_token: credentials.refresh_token,
        grant_type: 'refresh_token'
      })
    });

    if (!tokenResponse.ok) {
      const error = await tokenResponse.text();
      throw new Error(`Token error: ${error}`);
    }

    const tokenData = await tokenResponse.json();
    console.log('✅ Access token obtido');
    
    return tokenData.access_token;
  } catch (error) {
    console.error('❌ Erro ao obter access token:', error);
    throw error;
  }
}

/**
 * Inicializa cliente Google Ads API
 */
async function initializeGoogleAdsClient() {
  try {
    const credentials = await getGoogleAdsCredentials();
    const accessToken = await getAccessToken(credentials);

    const client = new GoogleAdsApi({
      client_id: credentials.client_id,
      client_secret: credentials.client_secret,
      developer_token: credentials.developer_token
    });

    // Configurar customer com access token
    const customer = client.Customer({
      customer_id: credentials.customer_id,
      refresh_token: credentials.refresh_token,
      login_customer_id: credentials.customer_id
    });

    return { client, customer, credentials };

  } catch (error) {
    console.error('❌ Erro ao inicializar cliente Google Ads:', error);
    throw error;
  }
}

// ENDPOINTS DA API

/**
 * Teste de conexão
 */
app.get('/api/test-connection', async (req, res) => {
  try {
    const { customer, credentials } = await initializeGoogleAdsClient();
    
    // Testar com query simples
    const response = await customer.query(`
      SELECT 
        customer.id,
        customer.descriptive_name
      FROM customer
      LIMIT 1
    `);

    res.json({
      success: true,
      message: 'Conexão estabelecida com sucesso',
      customerInfo: {
        customerId: credentials.customer_id,
        customerName: response[0]?.customer?.descriptive_name || credentials.unidade_name,
        unidade: credentials.unidade_name
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Erro no teste de conexão:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Proxy SprintHub (evita CORS no frontend)
 */
app.post('/api/sprinthub/proxy', async (req, res) => {
  try {
    // Verificar se as credenciais estão configuradas
    if (!SPRINTHUB_API_TOKEN || !SPRINTHUB_INSTANCE) {
      console.error('❌ Credenciais da SprintHub não configuradas:', {
        hasToken: !!SPRINTHUB_API_TOKEN,
        hasInstance: !!SPRINTHUB_INSTANCE,
        baseUrl: SPRINTHUB_BASE_URL
      });
      return res.status(500).json({ 
        error: 'Credenciais da SprintHub não configuradas no servidor.',
        details: {
          hasToken: !!SPRINTHUB_API_TOKEN,
          hasInstance: !!SPRINTHUB_INSTANCE
        }
      });
    }

    const {
      path: targetPath,
      method = 'GET',
      query = {},
      body,
      headers = {},
    } = req.body || {};

    if (!targetPath || typeof targetPath !== 'string') {
      return res.status(400).json({ error: 'Parâmetro "path" é obrigatório.' });
    }

    let resolvedPath = targetPath.trim();
    if (!resolvedPath.startsWith('http')) {
      if (resolvedPath.startsWith('sprinthub')) {
        resolvedPath = `https://${resolvedPath.replace(/^https?:\/\//, '')}`;
      } else if (resolvedPath.startsWith('/')) {
        resolvedPath = `${SPRINTHUB_BASE_URL}${resolvedPath}`;
      } else {
        resolvedPath = `${SPRINTHUB_BASE_URL}/${resolvedPath}`;
      }
    }

    const url = new URL(resolvedPath);
    url.searchParams.set('i', SPRINTHUB_INSTANCE);
    url.searchParams.set('apitoken', SPRINTHUB_API_TOKEN);

    Object.entries(query || {}).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.set(key, value);
      }
    });

    const finalHeaders = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${SPRINTHUB_API_TOKEN}`,
      apitoken: SPRINTHUB_API_TOKEN,
      ...headers,
    };

    Object.keys(finalHeaders).forEach((key) => {
      if (finalHeaders[key] === undefined || finalHeaders[key] === null || finalHeaders[key] === '') {
        delete finalHeaders[key];
      }
    });

    const response = await fetch(url, {
      method,
      headers: finalHeaders,
      body: body !== undefined && body !== null && method !== 'GET' && method !== 'HEAD'
        ? (typeof body === 'string' ? body : JSON.stringify(body))
        : undefined,
    });

    const responseText = await response.text();
    const responseContentType = response.headers.get('content-type') || '';
    let parsed;

    if (responseContentType.includes('application/json') && responseText) {
      try {
        parsed = JSON.parse(responseText);
      } catch (error) {
        parsed = responseText;
      }
    } else if (!responseText) {
      parsed = null;
    } else {
      parsed = responseText;
    }

    if (!response.ok) {
      return res.status(response.status).json({
        error: parsed || response.statusText || 'Erro desconhecido na SprintHub',
        status: response.status,
      });
    }

    return res.status(response.status).json(parsed);
  } catch (error) {
    console.error('❌ Erro no proxy SprintHub:', error);
    return res.status(500).json({ error: error.message || 'Erro interno no proxy SprintHub' });
  }
});

/**
 * Endpoint para sincronização automática da reativação (usado pelo cron do Supabase)
 */
app.post('/api/reativacao/cron-sync', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(' ')[1] || req.query.token;
    if (!REATIVACAO_SYNC_TOKEN || !token || token !== REATIVACAO_SYNC_TOKEN) {
      return res.status(401).json({
        success: false,
        error: 'Token inválido para sincronização automática.',
      });
    }

    const payload = req.body || {};
    console.log('🔄 Iniciando sincronização automática de reativação...', {
      totalSelecionado: payload?.limit,
      batchSize: payload?.batchSize,
    });

    const result = await runReativacaoAutoSync(payload);

    res.json({
      success: true,
      message: 'Sincronização automática concluída',
      data: result,
    });
  } catch (error) {
    console.error('❌ Erro na sincronização automática de reativação:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Erro interno na sincronização automática',
    });
  }
});

/**
 * Buscar campanhas
 */
app.get('/api/campaigns', async (req, res) => {
  try {
    const { customer } = await initializeGoogleAdsClient();
    const { status = 'active' } = req.query; // Por padrão apenas ativas

    console.log(`🔍 Buscando campanhas (filtro: ${status})...`);

    let whereClause;
    if (status === 'active') {
      whereClause = "WHERE campaign.status = 'ENABLED'"; // Apenas ativas
    } else if (status === 'all') {
      whereClause = "WHERE campaign.status != 'REMOVED'"; // Não removidas
    } else {
      whereClause = "WHERE campaign.status != 'REMOVED'"; // Default: não removidas
    }

    const campaigns = await customer.query(`
      SELECT 
        campaign.id,
        campaign.name,
        campaign.status,
        campaign.advertising_channel_type
      FROM campaign
      ${whereClause}
      ORDER BY campaign.name
    `);


    const mappedCampaigns = campaigns.map(row => ({
      id: row.campaign.id,
      name: row.campaign.name,
      status: statusMap[row.campaign.status] || row.campaign.status, // Converter número para string
      channelType: row.campaign.advertising_channel_type,
      type: 'SEARCH' // Default para compatibilidade
    }));

    console.log(`✅ ${mappedCampaigns.length} campanhas encontradas`);

    res.json({
      success: true,
      data: mappedCampaigns,
      count: mappedCampaigns.length
    });

  } catch (error) {
    console.error('❌ Erro ao buscar campanhas:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Buscar grupos de anúncios
 */
app.get('/api/campaigns/:campaignId/adgroups', async (req, res) => {
  try {
    const { campaignId } = req.params;
    const { customer } = await initializeGoogleAdsClient();

    console.log(`🔍 Buscando grupos de anúncios para campanha: ${campaignId}`);

    const adGroups = await customer.query(`
      SELECT 
        ad_group.id,
        ad_group.name,
        ad_group.status,
        campaign.id
      FROM ad_group
      WHERE campaign.id = ${campaignId}
        AND ad_group.status != 'REMOVED'
      ORDER BY ad_group.name
    `);

    const mappedAdGroups = adGroups.map(row => ({
      id: row.ad_group.id,
      name: row.ad_group.name,
      status: statusMap[row.ad_group.status] || row.ad_group.status, // Converter número para string
      campaignId: row.campaign.id
    }));

    console.log(`✅ ${mappedAdGroups.length} grupos de anúncios encontrados`);

    res.json({
      success: true,
      data: mappedAdGroups,
      count: mappedAdGroups.length
    });

  } catch (error) {
    console.error('❌ Erro ao buscar grupos de anúncios:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Buscar anúncios
 */
app.get('/api/adgroups/:adGroupId/ads', async (req, res) => {
  try {
    const { adGroupId } = req.params;
    const { customer } = await initializeGoogleAdsClient();

    console.log(`🔍 Buscando anúncios para grupo: ${adGroupId}`);

    const ads = await customer.query(`
      SELECT 
        ad_group_ad.ad.id,
        ad_group_ad.ad.name,
        ad_group_ad.status,
        ad_group_ad.ad.type,
        ad_group.id
      FROM ad_group_ad
      WHERE ad_group.id = ${adGroupId}
        AND ad_group_ad.status != 'REMOVED'
      ORDER BY ad_group_ad.ad.id
    `);

    const mappedAds = ads.map(row => ({
      id: row.ad_group_ad.ad.id,
      name: row.ad_group_ad.ad.name || `Anúncio ${row.ad_group_ad.ad.id}`,
      status: statusMap[row.ad_group_ad.status] || row.ad_group_ad.status, // Converter número para string
      type: row.ad_group_ad.ad.type,
      adGroupId: row.ad_group.id
    }));

    console.log(`✅ ${mappedAds.length} anúncios encontrados`);

    res.json({
      success: true,
      data: mappedAds,
      count: mappedAds.length
    });

  } catch (error) {
    console.error('❌ Erro ao buscar anúncios:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Buscar saldo da conta Google Ads
 */
app.get('/api/account-balance', async (req, res) => {
  try {
    const { customer } = await initializeGoogleAdsClient();

    console.log('🔍 Buscando saldo da conta Google Ads...');

    // Consultar informações da conta incluindo orçamento
    const accountData = await customer.query(`
      SELECT 
        customer.id,
        customer.descriptive_name,
        customer.currency_code,
        customer.time_zone,
        customer.status
      FROM customer
      WHERE customer.id = ${customer.id}
    `);

    // Buscar campanhas e seus orçamentos
    const campaignBudgets = await customer.query(`
      SELECT 
        campaign_budget.amount_micros,
        campaign_budget.delivery_method,
        campaign_budget.status,
        campaign_budget.type
      FROM campaign_budget
      WHERE campaign_budget.status = 'ENABLED'
    `);

    // Calcular orçamento total disponível
    const totalBudgetMicros = campaignBudgets.reduce((acc, budget) => {
      return acc + (parseInt(budget.campaign_budget.amount_micros) || 0);
    }, 0);

    const totalBudget = totalBudgetMicros / 1000000; // Converter micros para reais

    const result = {
      accountId: customer.id,
      descriptiveName: accountData[0]?.customer?.descriptive_name || 'Conta Google Ads',
      currencyCode: accountData[0]?.customer?.currency_code || 'BRL',
      timeZone: accountData[0]?.customer?.time_zone || 'America/Sao_Paulo',
      totalBudget: totalBudget,
      activeCampaignBudgets: campaignBudgets.length
    };

    console.log('✅ Saldo da conta calculado:', result);

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('❌ Erro ao buscar saldo da conta:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Buscar métricas de performance
 */
app.get('/api/stats', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const { customer } = await initializeGoogleAdsClient();

    console.log(`🔍 Buscando estatísticas de ${startDate} a ${endDate}`);

    // Função para obter data no fuso de São Paulo (GMT-3)
    const getSaoPauloDate = (dateString) => {
      if (!dateString) return null;
      
      // Se a data já está no formato correto, usar
      if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
        return dateString;
      }
      
      // Converter considerando fuso de São Paulo
      const date = new Date(dateString);
      const saoPauloOffset = -3 * 60; // GMT-3 em minutos
      const utc = date.getTime() + (date.getTimezoneOffset() * 60000);
      const saoPauloTime = new Date(utc + (saoPauloOffset * 60000));
      
      return saoPauloTime.toISOString().split('T')[0];
    };

    // Definir período padrão se não fornecido (usar data atual de SP)
    const hoje = new Date();
    const saoPauloOffset = -3 * 60; // GMT-3 em minutos
    const utc = hoje.getTime() + (hoje.getTimezoneOffset() * 60000);
    const saoPauloTime = new Date(utc + (saoPauloOffset * 60000));
    const dataHojeSP = saoPauloTime.toISOString().split('T')[0];

    const start = getSaoPauloDate(startDate) || dataHojeSP;
    const end = getSaoPauloDate(endDate) || dataHojeSP;

    console.log(`📅 Período ajustado para fuso SP: ${start} a ${end}`);

    const stats = await customer.query(`
      SELECT 
        metrics.clicks,
        metrics.impressions,
        metrics.cost_micros,
        metrics.conversions
      FROM campaign
      WHERE segments.date BETWEEN '${start}' AND '${end}'
    `);

    // Calcular métricas agregadas
    const aggregatedStats = stats.reduce((acc, row) => {
      acc.totalClicks += parseInt(row.metrics.clicks) || 0;
      acc.totalImpressions += parseInt(row.metrics.impressions) || 0;
      acc.totalCost += (parseInt(row.metrics.cost_micros) || 0) / 1000000; // Converter micros para reais
      acc.totalConversions += parseFloat(row.metrics.conversions) || 0;
      return acc;
    }, {
      totalClicks: 0,
      totalImpressions: 0,
      totalCost: 0,
      totalConversions: 0
    });

    // Calcular métricas derivadas
    const ctr = aggregatedStats.totalImpressions > 0 
      ? (aggregatedStats.totalClicks / aggregatedStats.totalImpressions) * 100 
      : 0;

    const cpc = aggregatedStats.totalClicks > 0 
      ? aggregatedStats.totalCost / aggregatedStats.totalClicks 
      : 0;

    const conversionRate = aggregatedStats.totalClicks > 0
      ? (aggregatedStats.totalConversions / aggregatedStats.totalClicks) * 100
      : 0;

    const result = {
      totalClicks: aggregatedStats.totalClicks,
      totalImpressions: aggregatedStats.totalImpressions,
      totalCost: aggregatedStats.totalCost,
      totalConversions: aggregatedStats.totalConversions,
      ctr: parseFloat(ctr.toFixed(2)),
      cpc: parseFloat(cpc.toFixed(2)),
      conversionRate: parseFloat(conversionRate.toFixed(2)),
      period: { start, end }
    };

    console.log('✅ Estatísticas calculadas:', result);

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('❌ Erro ao buscar estatísticas:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// =================== ENDPOINTS DE USUÁRIOS ===================

/**
 * Listar todos os usuários da tabela users do schema api
 */
app.get('/api/users', async (req, res) => {
  try {
    console.log('👥 Listando usuários da tabela users...');

    const response = await fetch(`${SUPABASE_URL}/rest/v1/users?select=*`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'apikey': SUPABASE_KEY,
        'Accept': 'application/json',
        'Accept-Profile': SUPABASE_SCHEMA,
        'Content-Profile': SUPABASE_SCHEMA
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    }

    const users = await response.json();

    // Mapear usuários para o formato esperado pela interface
    const mappedUsers = users.map(user => ({
      id: user.id,
      status: user.status === 'active' ? 'online' : 'offline',
      avatar: user.avatar_url || '/api/placeholder/40/40',
      firstName: user.first_name || 'Nome',
      lastName: user.last_name || 'Sobrenome',
      username: user.username,
      email: user.email,
      access: user.access_status || 'liberado',
      userType: getUserTypeLabel(user.user_type_id),
      createdAt: user.created_at ? new Date(user.created_at).toLocaleString('pt-BR') : '-',
      lastLogin: user.last_login_at ? new Date(user.last_login_at).toLocaleString('pt-BR') : 'Nunca',
      lastAction: user.updated_at ? new Date(user.updated_at).toLocaleString('pt-BR') : '-'
    }));

    console.log(`✅ ${mappedUsers.length} usuários encontrados`);

    res.json({
      success: true,
      data: mappedUsers,
      count: mappedUsers.length
    });

  } catch (error) {
    console.error('❌ Erro ao listar usuários:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Criar novo usuário
 */
app.post('/api/users', async (req, res) => {
  try {
    const { firstName, lastName, username, email, userType, access } = req.body;

    console.log('👤 Criando novo usuário:', email);

    // Gerar senha temporária
    const tempPassword = generateTempPassword();

    const response = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'apikey': SUPABASE_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email,
        password: tempPassword,
        email_confirm: true,
        user_metadata: {
          first_name: firstName,
          last_name: lastName,
          username,
          role: userType || 'padrão',
          created_by: 'admin'
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Erro ao criar usuário: ${errorData}`);
    }

    const data = await response.json();

    // Se o usuário deve estar bloqueado, aplicar ban
    if (access === 'bloqueado') {
      await banUser(data.user.id);
    }

    console.log('✅ Usuário criado com sucesso');

    res.json({
      success: true,
      data: data.user,
      tempPassword,
      message: `Usuário criado com sucesso. Senha temporária: ${tempPassword}`
    });

  } catch (error) {
    console.error('❌ Erro ao criar usuário:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Atualizar usuário
 */
app.put('/api/users/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { firstName, lastName, username, email, userType, access } = req.body;

    console.log('✏️ Atualizando usuário:', userId);

    const response = await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${userId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'apikey': SUPABASE_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email,
        user_metadata: {
          first_name: firstName,
          last_name: lastName,
          username,
          role: userType,
          updated_by: 'admin'
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Erro ao atualizar usuário: ${errorData}`);
    }

    const data = await response.json();

    // Aplicar bloqueio/desbloqueio conforme necessário
    if (access === 'bloqueado') {
      await banUser(userId);
    } else if (access === 'liberado') {
      await unbanUser(userId);
    }

    console.log('✅ Usuário atualizado com sucesso');

    res.json({
      success: true,
      data: data.user,
      message: 'Usuário atualizado com sucesso'
    });

  } catch (error) {
    console.error('❌ Erro ao atualizar usuário:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Reset de senha
 */
app.post('/api/users/:userId/reset-password', async (req, res) => {
  try {
    const { userId } = req.params;
    const { newPassword } = req.body;

    console.log('🔐 Resetando senha do usuário:', userId);

    const password = newPassword || generateTempPassword();

    const response = await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${userId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'apikey': SUPABASE_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        password
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Erro ao resetar senha: ${errorData}`);
    }

    console.log('✅ Senha resetada com sucesso');

    res.json({
      success: true,
      tempPassword: password,
      message: `Senha resetada com sucesso. Nova senha: ${password}`
    });

  } catch (error) {
    console.error('❌ Erro ao resetar senha:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Bloquear usuário
 */
app.post('/api/users/:userId/ban', async (req, res) => {
  try {
    const { userId } = req.params;

    console.log('🚫 Bloqueando usuário:', userId);

    await banUser(userId);

    res.json({
      success: true,
      message: 'Usuário bloqueado com sucesso'
    });

  } catch (error) {
    console.error('❌ Erro ao bloquear usuário:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Desbloquear usuário
 */
app.post('/api/users/:userId/unban', async (req, res) => {
  try {
    const { userId } = req.params;

    console.log('✅ Desbloqueando usuário:', userId);

    await unbanUser(userId);

    res.json({
      success: true,
      message: 'Usuário desbloqueado com sucesso'
    });

  } catch (error) {
    console.error('❌ Erro ao desbloquear usuário:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Deletar usuário
 */
app.delete('/api/users/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    console.log('🗑️ Deletando usuário:', userId);

    const response = await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${userId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'apikey': SUPABASE_KEY,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Erro ao deletar usuário: ${errorData}`);
    }

    console.log('✅ Usuário deletado com sucesso');

    res.json({
      success: true,
      message: 'Usuário deletado com sucesso'
    });

  } catch (error) {
    console.error('❌ Erro ao deletar usuário:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Funções auxiliares para usuários
function getUserStatus(user) {
  if (!user.last_sign_in_at) return 'offline';

  const lastLogin = new Date(user.last_sign_in_at);
  const now = new Date();
  const diffMinutes = (now - lastLogin) / (1000 * 60);

  if (diffMinutes < 15) return 'online';
  if (diffMinutes < 60) return 'ausente';
  return 'offline';
}

function getUserTypeLabel(userTypeId) {
  switch (userTypeId) {
    case 1: return 'administrador';
    case 2: return 'gerente';
    case 3: return 'vendedor';
    case 4: return 'padrão';
    default: return 'padrão';
  }
}

function generateTempPassword() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$';
  let password = '';
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

async function banUser(userId) {
  const response = await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${userId}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'apikey': SUPABASE_KEY,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      ban_duration: 'permanent'
    })
  });

  if (!response.ok) {
    const errorData = await response.text();
    throw new Error(`Erro ao bloquear usuário: ${errorData}`);
  }
}

async function unbanUser(userId) {
  const response = await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${userId}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'apikey': SUPABASE_KEY,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      ban_duration: 'none'
    })
  });

  if (!response.ok) {
    const errorData = await response.text();
    throw new Error(`Erro ao desbloquear usuário: ${errorData}`);
  }
}

// =================== ENDPOINTS DO FIREBIRD ===================

/**
 * Teste de conexão com Firebird
 */
app.get('/api/firebird/test-connection', async (req, res) => {
  try {
    console.log('🧪 Testando conexão Firebird...');
    const result = await firebirdService.testConnection();

    res.json({
      success: result.success,
      message: result.message,
      data: result.success ? {
        serverTime: result.serverTime,
        config: result.config
      } : null,
      error: result.success ? null : result.error,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Erro no teste de conexão Firebird:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Listar todas as tabelas do banco Firebird
 */
app.get('/api/firebird/tables', async (req, res) => {
  try {
    console.log('📋 Listando tabelas Firebird...');
    const tables = await firebirdService.listTables();

    res.json({
      success: true,
      data: tables,
      count: tables.length
    });

  } catch (error) {
    console.error('❌ Erro ao listar tabelas:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Descrever estrutura de uma tabela
 */
app.get('/api/firebird/tables/:tableName/structure', async (req, res) => {
  try {
    const { tableName } = req.params;
    console.log(`📋 Descrevendo tabela: ${tableName}`);

    const fields = await firebirdService.describeTable(tableName);

    res.json({
      success: true,
      data: {
        tableName: tableName.toUpperCase(),
        fields: fields
      },
      count: fields.length
    });

  } catch (error) {
    console.error(`❌ Erro ao descrever tabela ${req.params.tableName}:`, error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Buscar dados de uma tabela
 */
app.get('/api/firebird/tables/:tableName/data', async (req, res) => {
  try {
    const { tableName } = req.params;
    const {
      fields = '*',
      where = '',
      orderBy = '',
      limit = 50,
      offset = 0
    } = req.query;

    console.log(`🔍 Buscando dados da tabela: ${tableName}`);

    const result = await firebirdService.selectFromTable(tableName, {
      fields,
      where,
      orderBy,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      data: result.data,
      count: result.count,
      hasMore: result.hasMore,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    });

  } catch (error) {
    console.error(`❌ Erro ao buscar dados da tabela ${req.params.tableName}:`, error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Executar query customizada
 */
app.post('/api/firebird/query', async (req, res) => {
  try {
    const { sql, params = [], limit = 100, offset = 0 } = req.body;

    if (!sql) {
      return res.status(400).json({
        success: false,
        error: 'SQL query is required'
      });
    }

    console.log('🔍 Executando query customizada...');

    const result = await firebirdService.customQuery(sql, params, {
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      data: result.data,
      count: result.count,
      hasMore: result.hasMore,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    });

  } catch (error) {
    console.error('❌ Erro na query customizada:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Importar endpoint de segmentos
import segmentosRouter from './processar-segmentos-lote.js';

// Usar router de segmentos
app.use('/api', segmentosRouter);

const SYNC_SERVICE_URL = process.env.SYNC_SERVICE_URL
  || process.env.SYNC_MASTER_URL
  || `http://localhost:${process.env.SYNC_SERVICE_PORT || 5001}/sync/all`;
const SYNC_SERVICE_TOKEN = process.env.SYNC_SERVICE_TOKEN || process.env.API_TOKEN || '';

// Endpoint para sincronização automática
app.post('/api/sync-now', async (req, res) => {
  try {
    console.log('🔄 Iniciando sincronização via API...');
    
    const { source = 'api', optimized = true } = req.body || {};
    const headers = {
      'Content-Type': 'application/json'
    };
    if (SYNC_SERVICE_TOKEN) {
      headers['Authorization'] = `Bearer ${SYNC_SERVICE_TOKEN}`;
    }

    console.log(`🚀 Encaminhando para serviço de sincronização (${SYNC_SERVICE_URL})`);

    const response = await fetch(SYNC_SERVICE_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        trigger: source,
        optimized
      })
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      console.error('❌ Erro na sincronização via serviço:', data);
      return res.status(response.status).json({
        success: false,
        message: data?.message || 'Erro na sincronização',
        source,
        optimized,
        timestamp: new Date().toISOString(),
        error: data?.error || null
      });
    }

    res.json({
      success: true,
      message: 'Sincronização encaminhada com sucesso',
      source,
      optimized,
      timestamp: new Date().toISOString(),
      data
    });
  } catch (error) {
    console.error('❌ Erro no endpoint de sincronização:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      source: 'api',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

// Endpoint para status da sincronização
app.get('/api/sync-status', async (req, res) => {
  try {
    // Buscar última sincronização do banco
    const response = await fetch(`${SUPABASE_URL}/rest/v1/sincronizacao?select=created_at,descricao&order=created_at.desc&limit=1`, {
      headers: {
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'apikey': SUPABASE_KEY,
        'Accept-Profile': 'api'
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      const lastSync = data.length > 0 ? data[0] : null;
      
      res.json({
        success: true,
        lastSyncTime: lastSync?.created_at || null,
        lastSyncDescription: lastSync?.descricao || null,
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Erro ao buscar status da sincronização',
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error('❌ Erro ao buscar status:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

// Servir arquivos estáticos do frontend em produção
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '..', 'dist')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'dist', 'index.html'));
  });
}

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`📊 API disponível em: http://localhost:${PORT}/api`);
  if (process.env.NODE_ENV === 'production') {
    console.log('🌐 Modo produção: servindo arquivos estáticos');
  }
  // Iniciar agendador backend (independente do frontend) se habilitado
  if (process.env.ENABLE_BACKEND_SCHEDULER === 'true') {
    startBackendScheduler();
  } else {
    console.log('⏸️ Backend scheduler desabilitado (ENABLE_BACKEND_SCHEDULER != "true")');
  }
});

export default app;

// =============================
//    BACKEND SCHEDULER (TZ BR)
// =============================

// Executa sincronização automática nos horários fixos de Brasília,
// mesmo que ninguém abra o dashboard. Evita duplicidade por minuto.

function getSaoPauloParts(date = new Date()) {
  const dtf = new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
  const parts = dtf.formatToParts(date).reduce((acc, p) => {
    acc[p.type] = p.value; return acc;
  }, {});
  // parts: { year, month, day, hour, minute, second }
  return parts;
}

function startBackendScheduler() {
  const times = [
    { hour: 8, minute: 0 },
    { hour: 9, minute: 50 },
    { hour: 11, minute: 50 },
    { hour: 13, minute: 50 },
    { hour: 15, minute: 50 },
    { hour: 17, minute: 50 },
    { hour: 19, minute: 50 },
    { hour: 20, minute: 50 }
  ];

  let lastRunKey = null; // Ex: '2025-09-29 08:00'

  function shouldRunNow() {
    const p = getSaoPauloParts();
    const h = parseInt(p.hour, 10);
    const m = parseInt(p.minute, 10);
    const match = times.some(t => t.hour === h && t.minute === m);
    if (!match) return false;
    const key = `${p.year}-${p.month}-${p.day} ${p.hour}:${p.minute}`;
    if (lastRunKey === key) return false; // já rodou neste minuto
    lastRunKey = key;
    return true;
  }

  function runSyncNow() {
    try {
      const syncScript = path.join(__dirname, '..', 'src', 'sincronizacao', 'sync-now.js');
      const child = spawn('node', [syncScript], {
        stdio: 'inherit',
        cwd: path.join(__dirname, '..'),
        env: { ...process.env, FORCE_SYNC: 'true' }
      });
      child.on('close', (code) => {
        const status = code === 0 ? 'sucesso' : `erro (codigo ${code})`;
        const when = new Date().toISOString();
        console.log(`🕐 Scheduler backend: sincronização finalizada com ${status} em ${when}`);
      });
      child.on('error', (err) => {
        console.error('❌ Scheduler backend: erro ao spawnar sync-now.js', err);
      });
    } catch (err) {
      console.error('❌ Scheduler backend: erro inesperado ao iniciar sync', err);
    }
  }

  console.log('🕐 Backend scheduler ativado (fuso America/Sao_Paulo).');
  console.log('⏰ Horários: 08:00, 09:50, 11:50, 13:50, 15:50, 17:50, 19:50, 20:50 (Brasília)');

  // Checa a cada 15 segundos para pegar o minuto exato
  setInterval(() => {
    if (shouldRunNow()) {
      console.log('🚀 Scheduler backend: disparando sincronização...');
      runSyncNow();
    }
  }, 15000);
}