import axios from 'axios';

/**
 * Serviço para integração com a API do Meta Ads (Facebook Ads)
 * Baseado na referência TypeScript mas adaptado para JavaScript
 */
class MetaAdsService {
  constructor() {
    // Ler credenciais das variáveis de ambiente
    this.appId = import.meta.env.VITE_META_APP_ID;
    this.businessId = import.meta.env.VITE_META_BUSINESS_ID;
    this.accessToken = import.meta.env.VITE_META_ACCESS_TOKEN;
    this.baseUrl = 'https://graph.facebook.com/v18.0';
    
    console.log('🔧 MetaAdsService inicializado com:', {
      appId: this.appId ? '✅ Configurado' : '❌ Não configurado',
      businessId: this.businessId ? '✅ Configurado' : '❌ Não configurado',
      accessToken: this.accessToken ? '✅ Configurado' : '❌ Não configurado'
    });
  }

  /**
   * Verifica se as credenciais estão configuradas
   * @returns {boolean}
   */
  isConfigured() {
    return !!(this.appId && this.businessId && this.accessToken);
  }

  /**
   * Obtém informações da conta de anúncios
   * @returns {Promise<Object>}
   */
  async getAccountInfo() {
    try {
      if (!this.isConfigured()) {
        throw new Error('Credenciais do Meta Ads não configuradas');
      }

      // Para contas pessoais, sempre usar prefixo 'act_'
      const cleanAdAccountId = this.businessId.startsWith('act_') 
        ? this.businessId 
        : `act_${this.businessId}`;
      
      console.log('🔍 Buscando informações da conta:', cleanAdAccountId);

      const response = await axios.get(
        `${this.baseUrl}/${cleanAdAccountId}`,
        {
          params: {
            access_token: this.accessToken,
            fields: 'id,name,account_status,currency,timezone_name'
          }
        }
      );

      console.log('✅ Informações da conta obtidas:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Erro ao buscar informações da conta:', error.response?.data || error);
      throw this.handleApiError(error);
    }
  }

  /**
   * Busca campanhas com insights para um período específico
   * @param {Object} dateRange - Intervalo de datas {since: 'YYYY-MM-DD', until: 'YYYY-MM-DD'}
   * @returns {Promise<Array>}
   */
  async getCampaignsWithInsights(dateRange) {
    try {
      if (!this.isConfigured()) {
        throw new Error('Credenciais do Meta Ads não configuradas');
      }

      const cleanAdAccountId = this.businessId.startsWith('act_') 
        ? this.businessId 
        : `act_${this.businessId}`;

      console.log('🔍 Buscando campanhas para período:', dateRange);
      console.log('📊 Usando conta:', cleanAdAccountId);

      const response = await axios.get(
        `${this.baseUrl}/${cleanAdAccountId}/campaigns`,
        {
          params: {
            access_token: this.accessToken,
            limit: 500,
            fields: `id,name,status,objective,budget_remaining,budget_remaining_currency,spend_cap,spend_cap_currency,daily_budget,daily_budget_currency,lifetime_budget,lifetime_budget_currency,created_time,updated_time,start_time,stop_time,insights.time_range({"since":"${dateRange.since}","until":"${dateRange.until}"}){impressions,clicks,spend,reach,frequency,cpm,cpc,ctr,actions,action_values}`
          }
        }
      );

      console.log('✅ Total de campanhas encontradas:', response.data.data.length);

      // Processa os insights das campanhas
      const campaignsWithInsights = response.data.data.map((campaign) => {
        let insights = null;
        
        if (campaign.insights && campaign.insights.data && campaign.insights.data.length > 0) {
          const insightData = campaign.insights.data[0];
          insights = {
            impressions: Number(insightData.impressions) || 0,
            clicks: Number(insightData.clicks) || 0,
            spend: Number(insightData.spend) || 0,
            reach: Number(insightData.reach) || 0,
            frequency: Number(insightData.frequency) || 0,
            cpm: Number(insightData.cpm) || 0,
            cpc: Number(insightData.cpc) || 0,
            ctr: Number(insightData.ctr) || 0,
            actions: insightData.actions || []
          };
        }

        return {
          ...campaign,
          insights
        };
      });

      return campaignsWithInsights;
    } catch (error) {
      console.error('❌ Erro ao buscar campanhas com insights:', error.response?.data || error);
      throw this.handleApiError(error);
    }
  }

  /**
   * Busca campanhas básicas (sem insights)
   * @returns {Promise<Array>}
   */
  async getCampaigns() {
    try {
      if (!this.isConfigured()) {
        throw new Error('Credenciais do Meta Ads não configuradas');
      }

      const cleanAdAccountId = this.businessId.startsWith('act_') 
        ? this.businessId 
        : `act_${this.businessId}`;

      console.log('🔍 Buscando campanhas básicas da conta:', cleanAdAccountId);

      const response = await axios.get(
        `${this.baseUrl}/${cleanAdAccountId}/campaigns`,
        {
          params: {
            access_token: this.accessToken,
            limit: 500,
            fields: 'id,name,status,objective,budget_remaining,budget_remaining_currency,spend_cap,spend_cap_currency,daily_budget,daily_budget_currency,lifetime_budget,lifetime_budget_currency,created_time,updated_time,start_time,stop_time'
          }
        }
      );

      console.log('✅ Campanhas básicas encontradas:', response.data.data.length);
      return response.data.data || [];
    } catch (error) {
      console.error('❌ Erro ao buscar campanhas:', error.response?.data || error);
      throw this.handleApiError(error);
    }
  }

  /**
   * Busca insights de uma campanha específica
   * @param {string} campaignId - ID da campanha
   * @param {Object} dateRange - Intervalo de datas
   * @returns {Promise<Object|null>}
   */
  async getCampaignInsights(campaignId, dateRange) {
    try {
      if (!this.isConfigured()) {
        throw new Error('Credenciais do Meta Ads não configuradas');
      }

      const response = await axios.get(
        `${this.baseUrl}/${campaignId}/insights`,
        {
          params: {
            access_token: this.accessToken,
            fields: 'impressions,clicks,spend,reach,frequency,cpm,cpc,ctr,actions,action_values',
            time_range: JSON.stringify(dateRange),
            limit: 1
          }
        }
      );

      return response.data.data?.[0] || null;
    } catch (error) {
      console.error('❌ Erro ao buscar insights da campanha:', error.response?.data || error);
      throw this.handleApiError(error);
    }
  }

  /**
   * Calcula estatísticas de leads para um período e unidade específicos
   * @param {Object} dateRange - Intervalo de datas
   * @param {string} searchTerm - Termo para filtrar campanhas (opcional)
   * @returns {Promise<Object>}
   */
  async getMetaStats(dateRange, searchTerm = '') {
    try {
      if (!this.isConfigured()) {
        throw new Error('Credenciais do Meta Ads não configuradas');
      }

      const cleanAdAccountId = this.businessId.startsWith('act_') 
        ? this.businessId 
        : `act_${this.businessId}`;
      
      const searchFilter = searchTerm ? searchTerm.toLowerCase() : '';

      console.log('📊 Buscando stats para período:', dateRange, 'filtro:', searchFilter);
      console.log('🎯 Usando conta:', cleanAdAccountId);

      const response = await axios.get(
        `${this.baseUrl}/${cleanAdAccountId}/campaigns`,
        {
          params: {
            access_token: this.accessToken,
            limit: 500,
            fields: `name,insights.time_range({"since":"${dateRange.since}","until":"${dateRange.until}"}){spend,actions,action_values}`
          }
        }
      );

      console.log('✅ Total de campanhas encontradas:', response.data.data.length);

      // Filtra campanhas se um termo de busca foi fornecido
      const relevantCampaigns = searchFilter 
        ? response.data.data.filter((campaign) => 
            campaign.name && campaign.name.toLowerCase().includes(searchFilter)
          )
        : response.data.data;

      console.log('🎯 Campanhas relevantes:', relevantCampaigns.length);

      // Processa os resultados para métricas
      let totalLeads = 0;
      let gastoTotal = 0;

      relevantCampaigns.forEach((campaign) => {
        if (campaign.insights && campaign.insights.data && campaign.insights.data.length > 0) {
          const insights = campaign.insights.data[0];
          
          // Adiciona o gasto
          const spend = Number(insights.spend) || 0;
          gastoTotal += spend;
          
          // Busca as ações de lead
          if (insights.actions) {
            const leadAction = insights.actions.find((action) => 
              action.action_type === 'onsite_conversion.messaging_conversation_started_7d'
            );
            
            if (leadAction) {
              totalLeads += Number(leadAction.value) || 0;
            }
          }
        }
      });

      // Calcula métricas ajustadas (-30%)
      const totalLeadsAjustado = Math.floor(totalLeads * 0.7);
      const custoMedioPorLead = totalLeads > 0 ? gastoTotal / totalLeads : 0;
      const custoMedioPorLeadAjustado = totalLeadsAjustado > 0 ? gastoTotal / totalLeadsAjustado : 0;

      const stats = {
        totalLeads,
        totalLeadsAjustado,
        gastoTotal,
        custoMedioPorLead,
        custoMedioPorLeadAjustado,
        dadosAnuncios: {
          total: response.data.data.length,
          filtrados: relevantCampaigns.length
        }
      };

      console.log('📈 Stats calculados:', stats);
      return stats;
    } catch (error) {
      console.error('❌ Erro ao buscar dados do Meta:', error.response?.data || error);
      throw this.handleApiError(error);
    }
  }

  /**
   * Obtém estatísticas adaptadas para uma unidade específica (mês atual)
   * @param {string} unidadeNome - Nome da unidade para filtrar campanhas
   * @returns {Promise<Object>}
   */
  async getMetaStatsForUnit(unidadeNome = '') {
    try {
      if (!this.isConfigured()) {
        throw new Error('Credenciais do Meta Ads não configuradas');
      }

      const cleanAdAccountId = this.businessId.startsWith('act_') 
        ? this.businessId 
        : `act_${this.businessId}`;
      
      const searchTerm = unidadeNome?.toLowerCase().includes('londrina') ? 'londrina' : unidadeNome?.toLowerCase() || '';

      // Define intervalo do mês atual
      const today = new Date();
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);

      const dateRange = {
        since: firstDay.toISOString().split('T')[0],
        until: lastDay.toISOString().split('T')[0]
      };

      console.log('📊 Buscando stats da unidade:', unidadeNome);
      console.log('📅 Período:', dateRange);
      console.log('🔍 Termo de busca:', searchTerm);

      const campaignsResponse = await axios.get(
        `${this.baseUrl}/${cleanAdAccountId}/campaigns`,
        {
          params: {
            access_token: this.accessToken,
            limit: 500,
            fields: `name,insights.time_range({"since":"${dateRange.since}","until":"${dateRange.until}"}){spend,actions,action_values}`
          }
        }
      );

      console.log('✅ Campanhas retornadas:', campaignsResponse.data.data.length);

      // Filtra campanhas se um termo de busca foi fornecido
      const relevantCampaigns = searchTerm 
        ? campaignsResponse.data.data.filter((campaign) => 
            campaign.name && campaign.name.toLowerCase().includes(searchTerm)
          )
        : campaignsResponse.data.data;

      console.log('🎯 Campanhas relevantes:', relevantCampaigns.length);

      // Processa os resultados para métricas
      let totalLeads = 0;
      let gastoTotal = 0;

      relevantCampaigns.forEach((campaign) => {
        if (campaign.insights && campaign.insights.data && campaign.insights.data.length > 0) {
          const insights = campaign.insights.data[0];
          
          // Adiciona o gasto
          const spend = Number(insights.spend) || 0;
          gastoTotal += spend;
          
          // Busca as ações de lead
          if (insights.actions) {
            const leadAction = insights.actions.find((action) => 
              action.action_type === 'onsite_conversion.messaging_conversation_started_7d'
            );
            
            if (leadAction) {
              totalLeads += Number(leadAction.value) || 0;
            }
          }
        }
      });

      // Calcula métricas ajustadas (-30%)
      const totalLeadsAjustado = Math.floor(totalLeads * 0.7);
      const custoMedioPorLead = totalLeads > 0 ? gastoTotal / totalLeads : 0;
      const custoMedioPorLeadAjustado = totalLeadsAjustado > 0 ? gastoTotal / totalLeadsAjustado : 0;

      const result = {
        totalLeads,
        totalLeadsAjustado,
        gastoTotal,
        custoMedioPorLead,
        custoMedioPorLeadAjustado,
        dadosAnuncios: {
          total: campaignsResponse.data.data.length,
          filtrados: relevantCampaigns.length
        },
        campanhas: relevantCampaigns,
        periodo: dateRange
      };

      console.log('📈 Stats da unidade calculados:', result);
      return result;

    } catch (error) {
      console.error('❌ Erro ao buscar dados do Meta:', error.response?.data || error);
      throw this.handleApiError(error);
    }
  }

  /**
   * Valida o token de acesso
   * @returns {Promise<Object>}
   */
  async validateAccessToken() {
    try {
      const response = await axios.get('https://graph.facebook.com/debug_token', {
        params: {
          input_token: this.accessToken,
          access_token: this.accessToken
        }
      });

      const isValid = response.data.data.is_valid;
      console.log(`🔐 Token validation: ${isValid ? '✅ Válido' : '❌ Inválido'}`);
      
      return { 
        valid: isValid, 
        data: response.data.data 
      };
    } catch (error) {
      console.error('❌ Erro ao validar token:', error.response?.data || error);
      return { 
        valid: false, 
        error: 'Erro ao validar token' 
      };
    }
  }

  /**
   * Trata erros da API de forma consistente
   * @param {Error} error - Erro da requisição
   * @returns {Error}
   */
  handleApiError(error) {
    if (error.response?.data?.error) {
      const apiError = error.response.data.error;
      
      // Tratamento específico para diferentes tipos de erro
      if (apiError.code === 100 || apiError.message?.includes('does not exist')) {
        return new Error('Conta de anúncios não encontrada ou sem permissões. Verifique o ID da conta e as permissões do token.');
      }
      
      if (apiError.code === 190 || apiError.message?.includes('Invalid OAuth')) {
        return new Error('Token de acesso inválido ou expirado. Renove o token de acesso.');
      }
      
      return new Error(`Erro na API do Meta: ${apiError.message || 'Erro desconhecido'}`);
    }
    
    return new Error(error.message || 'Erro desconhecido na API do Meta');
  }
}

// Exportar instância única do serviço
export const metaAdsService = new MetaAdsService();

// Exportar também a classe para casos específicos
export default MetaAdsService;