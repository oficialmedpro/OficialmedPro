import axios from 'axios';
import { META_ADS_CONFIG } from '../constants/metaAds';

interface MetaAdsCampaign {
  id: string;
  name: string;
  status: string;
  objective: string;
  budget_remaining: number;
  budget_remaining_currency: string;
  spend_cap: number;
  spend_cap_currency: string;
  daily_budget: number;
  daily_budget_currency: string;
  lifetime_budget: number;
  lifetime_budget_currency: string;
  created_time: string;
  updated_time: string;
  start_time: string;
  stop_time?: string;
  insights?: {
    impressions: number;
    clicks: number;
    spend: number;
    reach: number;
    frequency: number;
    cpm: number;
    cpc: number;
    ctr: number;
    actions?: Array<{
      action_type: string;
      value: string;
    }>;
  };
}

interface MetaAdsResponse {
  data: MetaAdsCampaign[];
  paging?: {
    cursors: {
      before: string;
      after: string;
    };
    next?: string;
  };
}

interface MetaStats {
  totalLeads: number;
  totalLeadsAjustado: number;
  gastoTotal: number;
  custoMedioPorLead: number;
  custoMedioPorLeadAjustado: number;
  dadosAnuncios: {
    total: number;
    filtrados: number;
  };
}

class MetaAdsService {
  private appId: string;
  private adAccountId: string;
  private accessToken: string;
  private baseUrl = 'https://graph.facebook.com/v18.0';

  constructor() {
    this.appId = META_ADS_CONFIG.APP_ID;
    this.adAccountId = META_ADS_CONFIG.AD_ACCOUNT_ID;
    this.accessToken = META_ADS_CONFIG.ACCESS_TOKEN;
  }

  // Método para verificar se as credenciais estão configuradas
  isConfigured(): boolean {
    return !!(this.appId && this.adAccountId && this.accessToken);
  }

  // Método para obter informações da conta
  async getAccountInfo(): Promise<any> {
    try {
      if (!this.isConfigured()) {
        throw new Error('Credenciais do Meta Ads não configuradas');
      }

      // Para contas pessoais, SEMPRE precisamos do prefixo 'act_'
      const cleanAdAccountId = this.adAccountId.startsWith('act_') 
        ? this.adAccountId 
        : `act_${this.adAccountId}`;
      
      console.log('Buscando informações da conta:', cleanAdAccountId);

      const response = await axios.get(
        `${this.baseUrl}/${cleanAdAccountId}`,
        {
          params: {
            access_token: this.accessToken,
            fields: 'id,name,account_status,currency,timezone_name'
          }
        }
      );

      return response.data;
    } catch (error) {
      console.error('Erro ao buscar informações da conta:', error.response?.data || error);
      throw this.handleApiError(error);
    }
  }

  // Método para buscar campanhas com insights (baseado no código que funciona)
  async getCampaignsWithInsights(dateRange: { since: string; until: string }): Promise<MetaAdsCampaign[]> {
    try {
      if (!this.isConfigured()) {
        throw new Error('Credenciais do Meta Ads não configuradas');
      }

      // Para contas pessoais, SEMPRE precisamos do prefixo 'act_'
      const cleanAdAccountId = this.adAccountId.startsWith('act_') 
        ? this.adAccountId 
        : `act_${this.adAccountId}`;

      console.log('Buscando campanhas para período:', dateRange);
      console.log('Usando conta:', cleanAdAccountId);

      const response = await axios.get(
        `${this.baseUrl}/${cleanAdAccountId}/campaigns`,
        {
          params: {
            access_token: this.accessToken,
            limit: 500, // Aumentar limite para buscar mais campanhas
            fields: 'id,name,status,objective,budget_remaining,budget_remaining_currency,spend_cap,spend_cap_currency,daily_budget,daily_budget_currency,lifetime_budget,lifetime_budget_currency,created_time,updated_time,start_time,stop_time,insights.time_range({"since":"' + 
              dateRange.since + 
              '","until":"' + 
              dateRange.until + 
              '"}){impressions,clicks,spend,reach,frequency,cpm,cpc,ctr,actions,action_values}'
          }
        }
      );

      console.log('Total de campanhas encontradas:', response.data.data.length);

      // Processa os insights das campanhas
      const campaignsWithInsights = response.data.data.map((campaign: any) => {
        let insights: any = null;
        
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
      console.error('Erro ao buscar campanhas com insights:', error.response?.data || error);
      throw this.handleApiError(error);
    }
  }

  // Método para buscar campanhas básicas (sem insights)
  async getCampaigns(): Promise<MetaAdsCampaign[]> {
    try {
      if (!this.isConfigured()) {
        throw new Error('Credenciais do Meta Ads não configuradas');
      }

      // Para contas pessoais, SEMPRE precisamos do prefixo 'act_'
      const cleanAdAccountId = this.adAccountId.startsWith('act_') 
        ? this.adAccountId 
        : `act_${this.adAccountId}`;

      console.log('Tentando acessar conta:', cleanAdAccountId);

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

      return response.data.data || [];
    } catch (error) {
      console.error('Erro ao buscar campanhas:', error.response?.data || error);
      throw this.handleApiError(error);
    }
  }

  // Método para buscar insights de uma campanha específica
  async getCampaignInsights(campaignId: string, dateRange: { since: string; until: string }): Promise<any> {
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
      console.error('Erro ao buscar insights da campanha:', error.response?.data || error);
      throw this.handleApiError(error);
    }
  }

  // Método para calcular estatísticas de leads (baseado no código que funciona)
  async getMetaStats(dateRange: { since: string; until: string }, searchTerm?: string): Promise<MetaStats> {
    try {
      if (!this.isConfigured()) {
        throw new Error('Credenciais do Meta Ads não configuradas');
      }

      // Para contas pessoais, SEMPRE precisamos do prefixo 'act_'
      const cleanAdAccountId = this.adAccountId.startsWith('act_') 
        ? this.adAccountId 
        : `act_${this.adAccountId}`;
      
      const searchFilter = searchTerm ? searchTerm.toLowerCase() : '';

      console.log('Buscando dados para período:', dateRange, 'filtro:', searchFilter);
      console.log('Usando conta:', cleanAdAccountId);

      const response = await axios.get(
        `${this.baseUrl}/${cleanAdAccountId}/campaigns`,
        {
          params: {
            access_token: this.accessToken,
            limit: 500,
            fields: 'name,insights.time_range({"since":"' + 
              dateRange.since + 
              '","until":"' + 
              dateRange.until + 
              '"}){spend,actions,action_values}'
          }
        }
      );

      console.log('Total de campanhas encontradas:', response.data.data.length);

      // Filtra campanhas se um termo de busca foi fornecido
      const relevantCampaigns = searchFilter 
        ? response.data.data.filter((campaign: any) => 
            campaign.name && campaign.name.toLowerCase().includes(searchFilter)
          )
        : response.data.data;

      console.log('Campanhas relevantes:', relevantCampaigns.length);

      // Processa os resultados para métricas
      let totalLeads = 0;
      let gastoTotal = 0;

      relevantCampaigns.forEach((campaign: any) => {
        if (campaign.insights && campaign.insights.data && campaign.insights.data.length > 0) {
          const insights = campaign.insights.data[0];
          
          // Adiciona o gasto
          const spend = Number(insights.spend) || 0;
          gastoTotal += spend;
          
          // Busca as ações de lead
          if (insights.actions) {
            const leadAction = insights.actions.find((action: any) => 
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

      return {
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
    } catch (error) {
      console.error('Erro ao buscar dados do Meta:', error.response?.data || error);
      throw this.handleApiError(error);
    }
  }

  // Método adaptado do código fornecido pelo usuário - Versão para Conta Pessoal
  async getMetaStatsAdapted(unidadeNome?: string): Promise<any> {
    try {
      if (!this.isConfigured()) {
        throw new Error('Credenciais do Meta Ads não configuradas');
      }

      if (!this.adAccountId) {
        throw new Error('ID da conta de anúncios não fornecido');
      }

      // Para contas pessoais, SEMPRE precisamos do prefixo 'act_'
      const cleanAdAccountId = this.adAccountId.startsWith('act_') 
        ? this.adAccountId 
        : `act_${this.adAccountId}`;
      
      const searchTerm = unidadeNome?.toLowerCase().includes('londrina') ? 'londrina' : unidadeNome?.toLowerCase() || '';

      // Define intervalo do mês atual
      const today = new Date();
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);

      console.log('Buscando campanhas para período:', {
        since: firstDay.toISOString().split('T')[0],
        until: lastDay.toISOString().split('T')[0]
      });

      console.log('Usando ID da conta:', cleanAdAccountId);

      // 🚨 Requisição ao Graph API do Meta - Versão para Conta Pessoal
      const campaignsResponse = await axios.get(
        `https://graph.facebook.com/v18.0/${cleanAdAccountId}/campaigns`,
        {
          params: {
            access_token: this.accessToken,
            limit: 500,
            fields: `
              name,
              insights.time_range({
                "since":"${firstDay.toISOString().split('T')[0]}",
                "until":"${lastDay.toISOString().split('T')[0]}"
              }){spend,actions,action_values}
            `
          }
        }
      );

      // Aqui você trata os dados (filtra campanhas e calcula métricas)
      console.log('Campanhas retornadas:', campaignsResponse.data.data);

      // Filtra campanhas se um termo de busca foi fornecido
      const relevantCampaigns = searchTerm 
        ? campaignsResponse.data.data.filter((campaign: any) => 
            campaign.name && campaign.name.toLowerCase().includes(searchTerm)
          )
        : campaignsResponse.data.data;

      console.log('Campanhas relevantes:', relevantCampaigns.length);

      // Processa os resultados para métricas
      let totalLeads = 0;
      let gastoTotal = 0;

      relevantCampaigns.forEach((campaign: any) => {
        if (campaign.insights && campaign.insights.data && campaign.insights.data.length > 0) {
          const insights = campaign.insights.data[0];
          
          // Adiciona o gasto
          const spend = Number(insights.spend) || 0;
          gastoTotal += spend;
          
          // Busca as ações de lead
          if (insights.actions) {
            const leadAction = insights.actions.find((action: any) => 
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

      return {
        totalLeads,
        totalLeadsAjustado,
        gastoTotal,
        custoMedioPorLead,
        custoMedioPorLeadAjustado,
        dadosAnuncios: {
          total: campaignsResponse.data.data.length,
          filtrados: relevantCampaigns.length
        },
        campanhas: relevantCampaigns
      };

    } catch (error) {
      console.error('Erro ao buscar dados do Meta:', error.response?.data || error);
      throw this.handleApiError(error);
    }
  }

  // Método para trocar token de curta duração por token de longa duração
  async exchangeShortLivedToken(shortLivedToken: string, appSecret: string): Promise<{ access_token: string; token_type: string; expires_in: number }> {
    try {
      const response = await axios.get('https://graph.facebook.com/v23.0/oauth/access_token', {
        params: {
          grant_type: 'fb_exchange_token',
          client_id: this.appId,
          client_secret: appSecret,
          fb_exchange_token: shortLivedToken
        }
      });

      return response.data;
    } catch (error) {
      console.error('Erro ao trocar token de acesso:', error.response?.data || error);
      throw this.handleApiError(error);
    }
  }

  // Método para validar token de acesso
  async validateAccessToken(): Promise<{ valid: boolean; data?: any; error?: string }> {
    try {
      const response = await axios.get('https://graph.facebook.com/debug_token', {
        params: {
          input_token: this.accessToken,
          access_token: this.accessToken
        }
      });

      return { valid: response.data.data.is_valid, data: response.data.data };
    } catch (error) {
      console.error('Erro ao validar token:', error.response?.data || error);
      return { valid: false, error: 'Erro ao validar token' };
    }
  }

  // Método para tratar erros da API de forma consistente
  private handleApiError(error: any): Error {
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

export const metaAdsService = new MetaAdsService();
export type { MetaAdsCampaign, MetaAdsResponse, MetaStats };
