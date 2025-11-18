const express = require('express');
const cors = require('cors');
const { GoogleAdsApi } = require('google-ads-api');
const { createClient } = require('@supabase/supabase-js');

// Tentar carregar configuração personalizada, senão usar padrão
let config;
try {
  config = require('./config.js');
} catch (error) {
  console.warn('⚠️ Arquivo config.js não encontrado, usando configuração padrão');
  config = require('./google-ads-proxy-config.js');
}

const app = express();
app.use(cors(config.server.cors));
app.use(express.json());

// Configurar Supabase
const supabase = createClient(config.supabase.url, config.supabase.anonKey);

// Buscar credenciais reais do banco de dados
const getCredentials = async (unidadeId) => {
  try {
    console.log('🔍 Buscando credenciais para unidade:', unidadeId);
    
    const { data, error } = await supabase
      .from('unidades')
      .select(`
        id,
        nome,
        google_customer_id,
        google_developer_token,
        google_client_id,
        google_client_secret,
        google_refresh_token,
        google_ads_active
      `)
      .eq('id', unidadeId)
      .eq('google_ads_active', true)
      .single();

    if (error) {
      console.error('❌ Erro ao buscar credenciais:', error);
      throw new Error(`Erro ao buscar credenciais: ${error.message}`);
    }

    if (!data) {
      throw new Error('Nenhuma credencial ativa encontrada para esta unidade');
    }

    console.log('✅ Credenciais encontradas para:', data.nome);
    
    return {
      customerId: data.google_customer_id,
      developerToken: data.google_developer_token,
      clientId: data.google_client_id,
      clientSecret: data.google_client_secret,
      refreshToken: data.google_refresh_token
    };
  } catch (error) {
    console.error('❌ Erro ao carregar credenciais:', error);
    throw error;
  }
};

// Inicializar cliente Google Ads
const initializeClient = async (credentials) => {
  const client = new GoogleAdsApi({
    client_id: credentials.clientId,
    client_secret: credentials.clientSecret,
    developer_token: credentials.developerToken,
  });

  const formattedCustomerId = credentials.customerId.replace(/-/g, '');
  const customer = client.Customer({
    customer_id: formattedCustomerId,
    refresh_token: credentials.refreshToken,
  });

  return customer;
};

// Endpoint: Teste de conexão
app.post('/api/google-ads/test-connection', async (req, res) => {
  try {
    const { unidadeId, customerId } = req.body;
    
    const credentials = await getCredentials(unidadeId);
    const customer = await initializeClient(credentials);
    
    // Testar conexão buscando informações básicas
    const response = await customer.query(`
      SELECT 
        customer.id,
        customer.descriptive_name
      FROM customer
      LIMIT 1
    `);

    const customerData = response[0].customer;
    
    res.json({
      success: true,
      data: {
        customerName: customerData.descriptive_name,
        customerId: customerData.id,
        campaignsCount: 0 // Será implementado
      }
    });
  } catch (error) {
    console.error('Erro no teste de conexão:', error);
    res.json({
      success: false,
      error: error.message
    });
  }
});

// Endpoint: Informações da conta
app.post('/api/google-ads/customer-info', async (req, res) => {
  try {
    const { unidadeId, customerId } = req.body;
    
    const credentials = await getCredentials(unidadeId);
    const customer = await initializeClient(credentials);
    
    const response = await customer.query(`
      SELECT 
        customer.id,
        customer.descriptive_name,
        customer.currency_code,
        customer.time_zone,
        customer.manager,
        customer.test_account
      FROM customer
      LIMIT 1
    `);

    const customerData = response[0].customer;
    
    res.json({
      success: true,
      data: {
        id: customerData.id,
        name: customerData.descriptive_name,
        currency: customerData.currency_code,
        timezone: customerData.time_zone,
        isManager: customerData.manager,
        isTestAccount: customerData.test_account
      }
    });
  } catch (error) {
    console.error('Erro ao buscar informações da conta:', error);
    res.json({
      success: false,
      error: error.message
    });
  }
});

// Endpoint: Listar campanhas
app.post('/api/google-ads/campaigns', async (req, res) => {
  try {
    const { unidadeId, customerId } = req.body;
    
    const credentials = await getCredentials(unidadeId);
    const customer = await initializeClient(credentials);
    
    const response = await customer.query(`
      SELECT 
        campaign.id,
        campaign.name,
        campaign.status,
        campaign.advertising_channel_type,
        campaign.advertising_channel_sub_type,
        campaign.start_date,
        campaign.end_date
      FROM campaign
      ORDER BY campaign.name
    `);

    const campaigns = response.map(row => ({
      id: row.campaign.id,
      name: row.campaign.name,
      status: row.campaign.status,
      channelType: row.campaign.advertising_channel_type,
      channelSubType: row.campaign.advertising_channel_sub_type,
      startDate: row.campaign.start_date,
      endDate: row.campaign.end_date
    }));
    
    res.json({
      success: true,
      data: campaigns
    });
  } catch (error) {
    console.error('Erro ao buscar campanhas:', error);
    res.json({
      success: false,
      error: error.message
    });
  }
});

// Endpoint: Campanhas com métricas
app.post('/api/google-ads/campaigns-with-metrics', async (req, res) => {
  try {
    const { unidadeId, customerId, dateRange } = req.body;
    
    const credentials = await getCredentials(unidadeId);
    const customer = await initializeClient(credentials);
    
    const response = await customer.query(`
      SELECT 
        campaign.id,
        campaign.name,
        campaign.status,
        campaign.advertising_channel_type,
        metrics.impressions,
        metrics.clicks,
        metrics.cost_micros,
        metrics.conversions,
        metrics.conversions_value,
        metrics.ctr,
        metrics.average_cpc,
        metrics.cost_per_conversion,
        metrics.conversion_rate
      FROM campaign
      WHERE segments.date BETWEEN '${dateRange.startDate}' AND '${dateRange.endDate}'
      ORDER BY metrics.cost_micros DESC
    `);

    const campaignsWithMetrics = response.map(row => ({
      id: row.campaign.id,
      name: row.campaign.name,
      status: row.campaign.status,
      channelType: row.campaign.advertising_channel_type,
      metrics: {
        impressions: row.metrics.impressions || 0,
        clicks: row.metrics.clicks || 0,
        costMicros: row.metrics.cost_micros || 0,
        cost: (row.metrics.cost_micros || 0) / 1000000,
        conversions: row.metrics.conversions || 0,
        conversionsValue: row.metrics.conversions_value || 0,
        ctr: row.metrics.ctr || 0,
        averageCpc: row.metrics.average_cpc || 0,
        costPerConversion: row.metrics.cost_per_conversion || 0,
        conversionRate: row.metrics.conversion_rate || 0
      }
    }));
    
    res.json({
      success: true,
      data: campaignsWithMetrics
    });
  } catch (error) {
    console.error('Erro ao buscar campanhas com métricas:', error);
    res.json({
      success: false,
      error: error.message
    });
  }
});

// Endpoint: Estatísticas
app.post('/api/google-ads/stats', async (req, res) => {
  try {
    const { unidadeId, customerId, dateRange, searchTerm } = req.body;
    
    const credentials = await getCredentials(unidadeId);
    const customer = await initializeClient(credentials);
    
    // Buscar campanhas com métricas
    const response = await customer.query(`
      SELECT 
        campaign.id,
        campaign.name,
        metrics.impressions,
        metrics.clicks,
        metrics.cost_micros,
        metrics.conversions
      FROM campaign
      WHERE segments.date BETWEEN '${dateRange.startDate}' AND '${dateRange.endDate}'
    `);

    // Filtrar campanhas se um termo de busca foi fornecido
    const searchFilter = searchTerm ? searchTerm.toLowerCase() : '';
    const relevantCampaigns = searchFilter 
      ? response.filter(row => 
          row.campaign.name && row.campaign.name.toLowerCase().includes(searchFilter)
        )
      : response;

    // Processar os resultados para métricas
    let totalLeads = 0;
    let gastoTotal = 0;
    let totalImpressions = 0;
    let totalClicks = 0;

    relevantCampaigns.forEach(row => {
      gastoTotal += (row.metrics.cost_micros || 0) / 1000000;
      totalLeads += row.metrics.conversions || 0;
      totalImpressions += row.metrics.impressions || 0;
      totalClicks += row.metrics.clicks || 0;
    });

    // Calcula métricas ajustadas (-30%)
    const totalLeadsAjustado = Math.floor(totalLeads * 0.7);
    const custoMedioPorLead = totalLeads > 0 ? gastoTotal / totalLeads : 0;
    const custoMedioPorLeadAjustado = totalLeadsAjustado > 0 ? gastoTotal / totalLeadsAjustado : 0;
    const ctr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;

    const stats = {
      totalLeads,
      totalLeadsAjustado,
      gastoTotal,
      custoMedioPorLead,
      custoMedioPorLeadAjustado,
      totalImpressions,
      totalClicks,
      ctr,
      dadosAnuncios: {
        total: response.length,
        filtrados: relevantCampaigns.length
      }
    };
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Erro ao buscar stats:', error);
    res.json({
      success: false,
      error: error.message
    });
  }
});

// Endpoint: Grupos de anúncios
app.post('/api/google-ads/ad-groups', async (req, res) => {
  try {
    const { unidadeId, customerId, campaignId } = req.body;
    
    const credentials = await getCredentials(unidadeId);
    const customer = await initializeClient(credentials);
    
    const response = await customer.query(`
      SELECT 
        ad_group.id,
        ad_group.name,
        ad_group.status,
        ad_group.type,
        ad_group.cpc_bid_micros,
        ad_group.cpm_bid_micros,
        ad_group.cpv_bid_micros,
        ad_group.target_cpa_micros
      FROM ad_group
      WHERE campaign.id = ${campaignId}
      ORDER BY ad_group.name
    `);

    const adGroups = response.map(row => ({
      id: row.ad_group.id,
      name: row.ad_group.name,
      status: row.ad_group.status,
      type: row.ad_group.type,
      cpcBidMicros: row.ad_group.cpc_bid_micros,
      cpmBidMicros: row.ad_group.cpm_bid_micros,
      cpvBidMicros: row.ad_group.cpv_bid_micros,
      targetCpaMicros: row.ad_group.target_cpa_micros
    }));
    
    res.json({
      success: true,
      data: adGroups
    });
  } catch (error) {
    console.error('Erro ao buscar grupos de anúncios:', error);
    res.json({
      success: false,
      error: error.message
    });
  }
});

// Endpoint: Anúncios
app.post('/api/google-ads/ads', async (req, res) => {
  try {
    const { unidadeId, customerId, adGroupId } = req.body;
    
    const credentials = await getCredentials(unidadeId);
    const customer = await initializeClient(credentials);
    
    const response = await customer.query(`
      SELECT 
        ad_group_ad.ad.id,
        ad_group_ad.ad.name,
        ad_group_ad.status,
        ad_group_ad.ad.type,
        ad_group_ad.ad.responsive_search_ad.headlines,
        ad_group_ad.ad.responsive_search_ad.descriptions
      FROM ad_group_ad
      WHERE ad_group.id = ${adGroupId}
      ORDER BY ad_group_ad.ad.name
    `);

    const ads = response.map(row => ({
      id: row.ad_group_ad.ad.id,
      name: row.ad_group_ad.ad.name,
      status: row.ad_group_ad.status,
      type: row.ad_group_ad.ad.type,
      headlines: row.ad_group_ad.ad.responsive_search_ad?.headlines || [],
      descriptions: row.ad_group_ad.ad.responsive_search_ad?.descriptions || []
    }));
    
    res.json({
      success: true,
      data: ads
    });
  } catch (error) {
    console.error('Erro ao buscar anúncios:', error);
    res.json({
      success: false,
      error: error.message
    });
  }
});

// Iniciar servidor
const PORT = config.server.port;
app.listen(PORT, () => {
  console.log(`🚀 Backend proxy Google Ads rodando na porta ${PORT}`);
  console.log(`📡 Endpoints disponíveis em http://localhost:${PORT}/api/google-ads/`);
  console.log(`🔗 Supabase conectado: ${config.supabase.url}`);
});

module.exports = app;
