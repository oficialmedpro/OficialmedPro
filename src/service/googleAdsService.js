import { GoogleAdsApi } from 'google-ads-api';
import { supabase } from './supabase.js';

/**
 * Serviço para integração com a API do Google Ads
 * Baseado na estrutura do MetaAdsService mas adaptado para Google Ads
 */
class GoogleAdsService {
  constructor() {
    // Credenciais serão carregadas do banco de dados
    this.customerId = null;
    this.developerToken = null;
    this.clientId = null;
    this.clientSecret = null;
    this.refreshToken = null;
    
    // Inicializar cliente da API
    this.client = null;
    this.customer = null;
    
    console.log('🔧 GoogleAdsService inicializado - credenciais serão carregadas do banco de dados');
  }

  /**
   * Carrega as credenciais do banco de dados (tabela unidades)
   * @param {number} unidadeId - ID da unidade (padrão: 1)
   * @returns {Promise<boolean>}
   */
  async loadCredentials(unidadeId = 1) {
    try {
      console.log('🔍 Carregando credenciais do Google Ads da unidade:', unidadeId);
      
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
        console.error('❌ Erro ao carregar credenciais:', error);
        return false;
      }

      if (!data) {
        console.warn('⚠️ Nenhuma credencial ativa encontrada para a unidade:', unidadeId);
        return false;
      }

      // Atribuir as credenciais
      this.customerId = data.google_customer_id;
      this.developerToken = data.google_developer_token;
      this.clientId = data.google_client_id;
      this.clientSecret = data.google_client_secret;
      this.refreshToken = data.google_refresh_token;

      console.log('✅ Credenciais carregadas com sucesso para unidade:', data.nome, {
        customerId: this.customerId ? '✅ Configurado' : '❌ Não configurado',
        developerToken: this.developerToken ? '✅ Configurado' : '❌ Não configurado',
        clientId: this.clientId ? '✅ Configurado' : '❌ Não configurado',
        clientSecret: this.clientSecret ? '✅ Configurado' : '❌ Não configurado',
        refreshToken: this.refreshToken ? '✅ Configurado' : '❌ Não configurado'
      });

      return true;
    } catch (error) {
      console.error('❌ Erro ao carregar credenciais:', error);
      return false;
    }
  }

  /**
   * Verifica se as credenciais estão configuradas
   * @returns {boolean}
   */
  isConfigured() {
    return !!(
      this.customerId && 
      this.developerToken && 
      this.clientId && 
      this.clientSecret && 
      this.refreshToken
    );
  }

  /**
   * Inicializa o cliente da API do Google Ads
   */
  initializeClient() {
    try {
      this.client = new GoogleAdsApi({
        client_id: this.clientId,
        client_secret: this.clientSecret,
        developer_token: this.developerToken,
      });

      // Formatar customer ID (remover hífens se existirem)
      const formattedCustomerId = this.customerId.replace(/-/g, '');
      this.customer = this.client.Customer({
        customer_id: formattedCustomerId,
        refresh_token: this.refreshToken,
      });

      console.log('✅ Cliente Google Ads inicializado com sucesso');
    } catch (error) {
      console.error('❌ Erro ao inicializar cliente Google Ads:', error);
      throw new Error('Falha ao inicializar cliente da API do Google Ads');
    }
  }

  /**
   * Testa a conexão com a API e verifica permissões
   * @returns {Promise<Object>}
   */
  async testConnection() {
    try {
      console.log('🔍 Testando conexão com Google Ads API...');
      
      // Carregar credenciais do banco se ainda não foram carregadas
      if (!this.isConfigured()) {
        const loaded = await this.loadCredentials();
        if (!loaded) {
          throw new Error('Credenciais do Google Ads não encontradas no banco de dados');
        }
      }

      if (!this.customer) {
        this.initializeClient();
      }

      // Testar conexão buscando informações básicas da conta
      const customerInfo = await this.getCustomerInfo();
      console.log('✅ Informações da conta obtidas:', customerInfo.name);

      // Testar busca de campanhas
      const campaigns = await this.getCampaigns();
      console.log('✅ Campanhas acessíveis:', campaigns.length);

      return {
        success: true,
        customerName: customerInfo.name,
        customerId: customerInfo.id,
        campaignsCount: campaigns.length,
        permissions: 'OK'
      };
    } catch (error) {
      console.error('❌ Teste de conexão falhou:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Garante que as credenciais estão carregadas e o cliente inicializado
   * @returns {Promise<void>}
   */
  async ensureInitialized() {
    if (!this.isConfigured()) {
      const loaded = await this.loadCredentials();
      if (!loaded) {
        throw new Error('Credenciais do Google Ads não encontradas no banco de dados');
      }
    }

    if (!this.customer) {
      this.initializeClient();
    }
  }

  /**
   * Obtém informações básicas da conta do Google Ads
   * @returns {Promise<Object>}
   */
  async getCustomerInfo() {
    try {
      await this.ensureInitialized();

      console.log('🔍 Buscando informações da conta...');
      
      const response = await this.customer.query(`
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

      if (response.length === 0) {
        throw new Error('Nenhuma informação da conta encontrada');
      }

      const customerData = response[0].customer;
      console.log('✅ Informações da conta obtidas:', customerData.descriptive_name);
      
      return {
        id: customerData.id,
        name: customerData.descriptive_name,
        currency: customerData.currency_code,
        timezone: customerData.time_zone,
        isManager: customerData.manager,
        isTestAccount: customerData.test_account
      };
    } catch (error) {
      console.error('❌ Erro ao buscar informações da conta:', error);
      throw this.handleApiError(error);
    }
  }

  /**
   * Lista todas as campanhas da conta
   * @returns {Promise<Array>}
   */
  async getCampaigns() {
    try {
      await this.ensureInitialized();

      console.log('🔍 Buscando campanhas...');
      
      const response = await this.customer.query(`
        SELECT 
          campaign.id,
          campaign.name,
          campaign.status,
          campaign.advertising_channel_type,
          campaign.advertising_channel_sub_type,
          campaign.start_date,
          campaign.end_date,
          campaign_budget.amount_micros,
          campaign_budget.period,
          campaign_budget.delivery_method
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
        endDate: row.campaign.end_date,
        budget: row.campaign_budget ? {
          amountMicros: row.campaign_budget.amount_micros,
          period: row.campaign_budget.period,
          deliveryMethod: row.campaign_budget.delivery_method
        } : null
      }));

      console.log('✅ Campanhas encontradas:', campaigns.length);
      return campaigns;
    } catch (error) {
      console.error('❌ Erro ao buscar campanhas:', error);
      throw this.handleApiError(error);
    }
  }

  /**
   * Busca campanhas com métricas para um período específico
   * @param {Object} dateRange - Intervalo de datas {startDate: 'YYYY-MM-DD', endDate: 'YYYY-MM-DD'}
   * @returns {Promise<Array>}
   */
  async getCampaignsWithMetrics(dateRange) {
    try {
      await this.ensureInitialized();

      console.log('🔍 Buscando campanhas com métricas para período:', dateRange);
      
      const response = await this.customer.query(`
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
          cost: (row.metrics.cost_micros || 0) / 1000000, // Converter micros para moeda
          conversions: row.metrics.conversions || 0,
          conversionsValue: row.metrics.conversions_value || 0,
          ctr: row.metrics.ctr || 0,
          averageCpc: row.metrics.average_cpc || 0,
          costPerConversion: row.metrics.cost_per_conversion || 0,
          conversionRate: row.metrics.conversion_rate || 0
        }
      }));

      console.log('✅ Campanhas com métricas encontradas:', campaignsWithMetrics.length);
      return campaignsWithMetrics;
    } catch (error) {
      console.error('❌ Erro ao buscar campanhas com métricas:', error);
      throw this.handleApiError(error);
    }
  }

  /**
   * Calcula estatísticas de leads para um período específico
   * @param {Object} dateRange - Intervalo de datas
   * @param {string} searchTerm - Termo para filtrar campanhas (opcional)
   * @returns {Promise<Object>}
   */
  async getGoogleAdsStats(dateRange, searchTerm = '') {
    try {
      await this.ensureInitialized();

      console.log('📊 Buscando stats para período:', dateRange, 'filtro:', searchTerm);

      // Buscar campanhas com métricas
      const campaignsWithMetrics = await this.getCampaignsWithMetrics(dateRange);
      
      // Filtrar campanhas se um termo de busca foi fornecido
      const searchFilter = searchTerm ? searchTerm.toLowerCase() : '';
      const relevantCampaigns = searchFilter 
        ? campaignsWithMetrics.filter(campaign => 
            campaign.name && campaign.name.toLowerCase().includes(searchFilter)
          )
        : campaignsWithMetrics;

      console.log('🎯 Campanhas relevantes:', relevantCampaigns.length);

      // Processar os resultados para métricas
      let totalLeads = 0;
      let gastoTotal = 0;
      let totalImpressions = 0;
      let totalClicks = 0;

      relevantCampaigns.forEach(campaign => {
        const metrics = campaign.metrics;
        gastoTotal += metrics.cost;
        totalLeads += metrics.conversions;
        totalImpressions += metrics.impressions;
        totalClicks += metrics.clicks;
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
          total: campaignsWithMetrics.length,
          filtrados: relevantCampaigns.length
        }
      };

      console.log('📈 Stats calculados:', stats);
      return stats;
    } catch (error) {
      console.error('❌ Erro ao buscar dados do Google Ads:', error);
      throw this.handleApiError(error);
    }
  }

  /**
   * Obtém estatísticas adaptadas para uma unidade específica (mês atual)
   * @param {string} unidadeNome - Nome da unidade para filtrar campanhas
   * @returns {Promise<Object>}
   */
  async getGoogleAdsStatsForUnit(unidadeNome = '') {
    try {
      await this.ensureInitialized();

      const searchTerm = unidadeNome?.toLowerCase().includes('londrina') ? 'londrina' : unidadeNome?.toLowerCase() || '';

      // Define intervalo do mês atual
      const today = new Date();
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);

      const dateRange = {
        startDate: firstDay.toISOString().split('T')[0],
        endDate: lastDay.toISOString().split('T')[0]
      };

      console.log('📊 Buscando stats da unidade:', unidadeNome);
      console.log('📅 Período:', dateRange);
      console.log('🔍 Termo de busca:', searchTerm);

      const stats = await this.getGoogleAdsStats(dateRange, searchTerm);
      
      const result = {
        ...stats,
        campanhas: await this.getCampaignsWithMetrics(dateRange),
        periodo: dateRange
      };

      console.log('📈 Stats da unidade calculados:', result);
      return result;
    } catch (error) {
      console.error('❌ Erro ao buscar dados do Google Ads:', error);
      throw this.handleApiError(error);
    }
  }

  /**
   * Busca grupos de anúncios (Ad Groups) de uma campanha específica
   * @param {string} campaignId - ID da campanha
   * @returns {Promise<Array>}
   */
  async getAdGroups(campaignId) {
    try {
      await this.ensureInitialized();

      console.log('🔍 Buscando grupos de anúncios da campanha:', campaignId);
      
      const response = await this.customer.query(`
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

      console.log('✅ Grupos de anúncios encontrados:', adGroups.length);
      return adGroups;
    } catch (error) {
      console.error('❌ Erro ao buscar grupos de anúncios:', error);
      throw this.handleApiError(error);
    }
  }

  /**
   * Busca anúncios de um grupo de anúncios específico
   * @param {string} adGroupId - ID do grupo de anúncios
   * @returns {Promise<Array>}
   */
  async getAds(adGroupId) {
    try {
      await this.ensureInitialized();

      console.log('🔍 Buscando anúncios do grupo:', adGroupId);
      
      const response = await this.customer.query(`
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

      console.log('✅ Anúncios encontrados:', ads.length);
      return ads;
    } catch (error) {
      console.error('❌ Erro ao buscar anúncios:', error);
      throw this.handleApiError(error);
    }
  }

  /**
   * Trata erros da API de forma consistente
   * @param {Error} error - Erro da requisição
   * @returns {Error}
   */
  handleApiError(error) {
    console.error('❌ Erro detalhado da API:', error);
    
    // Tratamento específico para diferentes tipos de erro
    if (error.message?.includes('authentication')) {
      return new Error('Erro de autenticação. Verifique suas credenciais OAuth2.');
    }
    
    if (error.message?.includes('permission')) {
      return new Error('Permissões insuficientes. Verifique se o token tem acesso à conta.');
    }
    
    if (error.message?.includes('quota')) {
      return new Error('Limite de quota excedido. Tente novamente mais tarde.');
    }
    
    if (error.message?.includes('customer_id')) {
      return new Error('ID da conta inválido. Verifique o Customer ID.');
    }
    
    return new Error(`Erro na API do Google Ads: ${error.message || 'Erro desconhecido'}`);
  }
}

// Exportar instância única do serviço
export const googleAdsService = new GoogleAdsService();

// Exportar também a classe para casos específicos
export default GoogleAdsService;
