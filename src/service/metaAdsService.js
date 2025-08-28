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
   * Obtém informações do Business Manager
   * @returns {Promise<Object>}
   */
  async getBusinessManagerInfo() {
    try {
      if (!this.isConfigured()) {
        throw new Error('Credenciais do Meta Ads não configuradas');
      }

      console.log('🔍 Buscando informações do Business Manager:', this.businessId);
      
      const response = await axios.get(
        `${this.baseUrl}/${this.businessId}`,
        {
          params: {
            access_token: this.accessToken,
            fields: 'id,name,verification_status,created_time'
          }
        }
      );

      console.log('✅ Informações do Business Manager obtidas:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Erro ao buscar informações do Business Manager:', error.response?.data || error);
      throw this.handleApiError(error);
    }
  }

  /**
   * Lista todas as contas de anúncios do Business Manager
   * @returns {Promise<Array>}
   */
  async getAdAccounts() {
    try {
      if (!this.isConfigured()) {
        throw new Error('Credenciais do Meta Ads não configuradas');
      }

      console.log('🔍 Buscando contas de anúncios do Business Manager...');
      
      const response = await axios.get(
        `${this.baseUrl}/${this.businessId}/owned_ad_accounts`,
        {
          params: {
            access_token: this.accessToken,
            fields: 'id,name,account_status,currency,timezone_name,account_id',
            limit: 100
          }
        }
      );

      const adAccounts = response.data.data || [];
      console.log('✅ Contas de anúncios encontradas:', adAccounts.length);
      
      // Filtrar apenas contas ativas
      const activeAccounts = adAccounts.filter(account => 
        account.account_status === 1 || account.account_status === 2
      );
      
      console.log('✅ Contas ativas:', activeAccounts.length);
      return activeAccounts;
    } catch (error) {
      console.error('❌ Erro ao buscar contas de anúncios:', error.response?.data || error);
      throw this.handleApiError(error);
    }
  }

  /**
   * Obtém informações de uma conta de anúncios específica
   * @param {string} adAccountId - ID da conta de anúncios
   * @returns {Promise<Object>}
   */
  async getAdAccountInfo(adAccountId) {
    try {
      if (!this.isConfigured()) {
        throw new Error('Credenciais do Meta Ads não configuradas');
      }

      // Garantir que o ID tenha o prefixo 'act_'
      const cleanAdAccountId = adAccountId.startsWith('act_') 
        ? adAccountId 
        : `act_${adAccountId}`;

      console.log('🔍 Buscando informações da conta de anúncios:', cleanAdAccountId);
      
      const response = await axios.get(
        `${this.baseUrl}/${cleanAdAccountId}`,
        {
          params: {
            access_token: this.accessToken,
            fields: 'id,name,account_status,currency,timezone_name'
          }
        }
      );

      console.log('✅ Informações da conta de anúncios obtidas:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Erro ao buscar informações da conta de anúncios:', error.response?.data || error);
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

      // Primeiro, vamos tentar buscar campanhas básicas para verificar permissões
      console.log('🔍 Testando permissões básicas primeiro...');
      
      const basicCampaigns = await this.getCampaigns();
      console.log('✅ Permissões básicas OK, buscando insights...');

      // Agora vamos buscar insights para cada campanha individualmente
      const campaignsWithInsights = await Promise.all(
        basicCampaigns.map(async (campaign) => {
          try {
            const insights = await this.getCampaignInsights(campaign.id, dateRange);
            return {
              ...campaign,
              insights
            };
          } catch (insightError) {
            console.warn(`⚠️ Não foi possível buscar insights para campanha ${campaign.id}:`, insightError.message);
            return {
              ...campaign,
              insights: null
            };
          }
        })
      );

      console.log('✅ Campanhas com insights processadas:', campaignsWithInsights.length);
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

      // Primeiro, buscar as contas de anúncios disponíveis
      const adAccounts = await this.getAdAccounts();
      if (adAccounts.length === 0) {
        throw new Error('Nenhuma conta de anúncios encontrada no Business Manager');
      }

      // Usar a primeira conta ativa
      const firstAccount = adAccounts[0];
      // Garantir que o ID tenha o prefixo 'act_'
      const workingAccountId = (firstAccount.account_id || firstAccount.id).startsWith('act_') 
        ? (firstAccount.account_id || firstAccount.id)
        : `act_${firstAccount.account_id || firstAccount.id}`;
      
      console.log('🔍 Buscando campanhas da conta:', workingAccountId, '(', firstAccount.name, ')');

      const response = await axios.get(
        `${this.baseUrl}/${workingAccountId}/campaigns`,
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

      // Primeiro, buscar as contas de anúncios disponíveis
      const adAccounts = await this.getAdAccounts();
      if (adAccounts.length === 0) {
        throw new Error('Nenhuma conta de anúncios encontrada no Business Manager');
      }

      // Usar a primeira conta ativa
      const firstAccount = adAccounts[0];
      // Garantir que o ID tenha o prefixo 'act_'
      const workingAccountId = (firstAccount.account_id || firstAccount.id).startsWith('act_') 
        ? (firstAccount.account_id || firstAccount.id)
        : `act_${firstAccount.account_id || firstAccount.id}`;
      
      const searchFilter = searchTerm ? searchTerm.toLowerCase() : '';

      console.log('📊 Buscando stats para período:', dateRange, 'filtro:', searchFilter);
      console.log('🎯 Usando conta:', workingAccountId, '(', firstAccount.name, ')');

      const response = await axios.get(
        `${this.baseUrl}/${workingAccountId}/campaigns`,
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

      // Primeiro, buscar as contas de anúncios disponíveis
      const adAccounts = await this.getAdAccounts();
      if (adAccounts.length === 0) {
        throw new Error('Nenhuma conta de anúncios encontrada no Business Manager');
      }

      // Usar a primeira conta ativa
      const firstAccount = adAccounts[0];
      // Garantir que o ID tenha o prefixo 'act_'
      const workingAccountId = (firstAccount.account_id || firstAccount.id).startsWith('act_') 
        ? (firstAccount.account_id || firstAccount.id)
        : `act_${firstAccount.account_id || firstAccount.id}`;
      
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
      console.log('🎯 Usando conta:', workingAccountId, '(', firstAccount.name, ')');

      const campaignsResponse = await axios.get(
        `${this.baseUrl}/${workingAccountId}/campaigns`,
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
   * Testa a conexão com a API e verifica permissões
   * @returns {Promise<Object>}
   */
  async testConnection() {
    try {
      console.log('🔍 Testando conexão com Meta Ads API...');
      
      // Primeiro, validar o token
      const tokenValidation = await this.validateAccessToken();
      if (!tokenValidation.valid) {
        throw new Error('Token inválido ou expirado');
      }

      // Verificar se conseguimos acessar o Business Manager
      const businessInfo = await this.getBusinessManagerInfo();
      console.log('✅ Business Manager acessível:', businessInfo.name);

      // Verificar se conseguimos listar as contas de anúncios
      const adAccounts = await this.getAdAccounts();
      console.log('✅ Contas de anúncios encontradas:', adAccounts.length);

      if (adAccounts.length === 0) {
        return {
          success: false,
          error: 'Nenhuma conta de anúncios encontrada no Business Manager'
        };
      }

      // Tentar buscar campanhas da primeira conta
      const campaigns = await this.getCampaigns();
      console.log('✅ Campanhas acessíveis:', campaigns.length);

      return {
        success: true,
        businessManagerName: businessInfo.name,
        adAccountsCount: adAccounts.length,
        firstAccountName: adAccounts[0].name,
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