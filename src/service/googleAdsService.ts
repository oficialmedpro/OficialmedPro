// Usando Edge Functions para Google Ads (credenciais seguras)
import { supabase } from './supabase';
import { googleAdsSupabaseService } from './googleAdsSupabaseService';

interface GoogleAdsCampaign {
  id: string;
  name: string;
  status: string;
  advertising_channel_type: string;
  start_date: string;
  end_date: string;
  budget_amount_micros: number;
  delivery_method: string;
  accountKey?: 'ACCOUNT_1' | 'ACCOUNT_2';
  accountName?: string;
  metrics?: {
    impressions: number;
    clicks: number;
    cost_micros: number;
    conversions: number;
    conversions_value: number;
    ctr: number;
    average_cpc: number;
    all_conversions: number;
    all_conversions_value: number;
  };
}

interface GoogleAdsStats {
  totalConversions: number;
  totalConversionsAjustado: number;
  gastoTotal: number;
  custoMedioPorConversao: number;
  custoMedioPorConversaoAjustado: number;
  dadosCampanhas: {
    total: number;
    filtradas: number;
  };
  allConversions: number;
  allConversionsValue: number;
  impressions: number;
  clicks: number;
  ctr: number;
}

interface GoogleAdsResponse {
  success: boolean;
  data: any[];
  error?: string;
  accountKey?: 'ACCOUNT_1' | 'ACCOUNT_2';
  accountName?: string;
  count?: number;
}

class GoogleAdsService {
  // SEMPRE usar Supabase Edge Functions (backend local removido)
  private readonly useSupabase = true;
  
  constructor() {
    console.log(`🔧 Google Ads Service configurado para usar: Supabase Edge Functions (backend local removido)`);
  }
  
  // Método para verificar qual serviço está sendo usado
  getServiceType(): 'supabase' {
    return 'supabase';
  }
  
  // Método para verificar disponibilidade do serviço
  private async checkServiceAvailability(): Promise<boolean> {
    try {
      // SEMPRE usar Supabase Edge Functions
      const isSupabaseAvailable = await googleAdsSupabaseService.isServiceAvailable();
      console.log(`🔍 Supabase Edge Functions: ${isSupabaseAvailable ? '✅ Disponível' : '❌ Não disponível'}`);
      
      if (!isSupabaseAvailable) {
        throw new Error('Supabase Edge Functions não está disponível');
      }
      
      return isSupabaseAvailable;
    } catch (error) {
      console.error('❌ Erro ao verificar disponibilidade do serviço:', error);
      throw new Error('Supabase Edge Functions não está disponível');
    }
  }

  // Método para verificar se as credenciais estão configuradas
  isConfigured(accountKey: 'ACCOUNT_1' | 'ACCOUNT_2' = 'ACCOUNT_1'): boolean {
    return googleAdsSupabaseService.isConfigured(accountKey);
  }

  // Chamada genérica para a Edge Function
  private async callEdgeFunction(action: string, params: any = {}, accountKey: 'ACCOUNT_1' | 'ACCOUNT_2' = 'ACCOUNT_1'): Promise<GoogleAdsResponse> {
    try {
      // Configuração está na Edge Function (seguro)
      
      console.log(`Chamando Edge Function Google Ads - Ação: ${action}, Conta: ${accountKey}`);
      
      const { data, error } = await supabase.functions.invoke('google-ads-api', {
        body: {
          action,
          accountConfig: {
            ...config,
            accountKey,
          },
          ...params
        }
      });

      if (error) {
        console.error('Erro na Edge Function:', error);
        throw new Error(`Erro na Edge Function: ${error.message}`);
      }

      if (!data.success) {
        console.error('Erro na resposta da API:', data.error);
        throw new Error(data.error || 'Erro desconhecido na API Google Ads');
      }

      console.log(`Edge Function executada com sucesso - ${data.count || 0} resultados`);
      return data;
    } catch (error) {
      console.error(`Erro na chamada da Edge Function (${action}):`, error);
      throw error;
    }
  }

  // Método para validar conexão - SEMPRE Supabase Edge Functions
  async validateConnection(accountKey: 'ACCOUNT_1' | 'ACCOUNT_2' = 'ACCOUNT_1'): Promise<{ connected: boolean; message: string; data?: any }> {
    try {
      console.log(`🔍 Validando conexão Google Ads ${accountKey} usando Supabase Edge Functions...`);

      await this.checkServiceAvailability();
      
      console.log('🔄 Usando Supabase Edge Functions para validação');
      return await googleAdsSupabaseService.validateConnection(accountKey);
    } catch (error) {
      console.error(`❌ Erro ao validar conexão ${accountKey}:`, error);
      return {
        connected: false,
        message: error instanceof Error ? error.message : 'Erro ao validar conexão'
      };
    }
  }

  // Método auxiliar para verificar configuração da edge function
  private isConfiguredForEdgeFunction(accountKey: 'ACCOUNT_1' | 'ACCOUNT_2' = 'ACCOUNT_1'): boolean {
    // Configuração está na Edge Function (seguro);
    return !!(config.CLIENT_ID && config.CLIENT_SECRET && config.REFRESH_TOKEN && config.CUSTOMER_ID && config.DEVELOPER_TOKEN);
  }

  // Método para obter informações da conta
  async getAccountInfo(accountKey: 'ACCOUNT_1' | 'ACCOUNT_2' = 'ACCOUNT_1'): Promise<any> {
    try {
      if (!this.isConfigured(accountKey)) {
        throw new Error(`Credenciais do Google Ads não configuradas para ${accountKey}`);
      }

      console.log(`Buscando informações da conta Google Ads ${accountKey}`);

      const result = await this.callEdgeFunction('getAccountInfo', {}, accountKey);
      return result.data;
    } catch (error) {
      console.error(`Erro ao buscar informações da conta ${accountKey}:`, error);
      throw error;
    }
  }

  // Método para buscar campanhas básicas - SEMPRE Supabase Edge Functions
  async getCampaigns(accountKey: 'ACCOUNT_1' | 'ACCOUNT_2' = 'ACCOUNT_1'): Promise<GoogleAdsCampaign[]> {
    try {
      console.log(`Buscando campanhas do Google Ads ${accountKey} via Supabase Edge Functions`);

      await this.checkServiceAvailability();
      console.log('🔄 Usando Supabase Edge Functions para campanhas');
      const campaigns = await googleAdsSupabaseService.getCampaigns(accountKey);
      return campaigns as GoogleAdsCampaign[];
    } catch (error) {
      console.error(`Erro ao buscar campanhas ${accountKey}:`, error);
      throw error;
    }
  }

  // Método para buscar campanhas com métricas - SEMPRE Supabase Edge Functions
  async getCampaignsWithMetrics(dateRange: { since: string; until: string }, accountKey: 'ACCOUNT_1' | 'ACCOUNT_2' = 'ACCOUNT_1'): Promise<GoogleAdsCampaign[]> {
    try {
      console.log(`📊 Buscando campanhas com métricas ${accountKey} via Supabase Edge Functions:`, dateRange);

      await this.checkServiceAvailability();
      
      console.log('🔄 Usando Supabase Edge Functions para campanhas com métricas');
      const campaigns = await googleAdsSupabaseService.getCampaignsWithMetrics(dateRange, undefined, accountKey);
      console.log(`✅ Campanhas obtidas via Supabase: ${campaigns.length}`);
      return campaigns as GoogleAdsCampaign[];
    } catch (error) {
      console.error(`❌ Erro ao buscar campanhas com métricas ${accountKey}:`, error);
      throw new Error(`Falha ao obter campanhas: ${error.message}`);
    }
  }

  // Método para calcular estatísticas - SEMPRE Supabase Edge Functions
  async getGoogleAdsStats(dateRange: { since: string; until: string }, searchTerm?: string, accountKey: 'ACCOUNT_1' | 'ACCOUNT_2' = 'ACCOUNT_1'): Promise<GoogleAdsStats> {
    try {
      console.log(`📈 Buscando estatísticas Google Ads ${accountKey} via Supabase Edge Functions:`, dateRange, 'filtro:', searchTerm);

      await this.checkServiceAvailability();
      
      console.log('🔄 Usando Supabase Edge Functions para estatísticas');
      const stats = await googleAdsSupabaseService.getGoogleAdsStats(dateRange, searchTerm, accountKey);
      console.log('✅ Estatísticas obtidas via Supabase');
      return stats as GoogleAdsStats;
    } catch (error) {
      console.error(`❌ Erro ao buscar estatísticas Google Ads ${accountKey}:`, error);
      throw new Error(`Falha ao obter estatísticas: ${error.message}`);
    }
  }

  // Método adaptado para compatibilidade com o padrão do sistema
  async getGoogleAdsStatsAdapted(unidadeNome?: string, accountKey: 'ACCOUNT_1' | 'ACCOUNT_2' = 'ACCOUNT_1'): Promise<GoogleAdsStats> {
    try {
      if (!this.isConfigured(accountKey)) {
        throw new Error(`Credenciais do Google Ads não configuradas para ${accountKey}`);
      }

      // Define intervalo do mês atual
      const today = new Date();
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);

      const dateRange = {
        since: firstDay.toISOString().split('T')[0],
        until: lastDay.toISOString().split('T')[0]
      };

      // Busca pelo nome da unidade nas campanhas
      const searchTerm = unidadeNome?.toLowerCase() || '';

      console.log(`Buscando estatísticas adaptadas Google Ads ${accountKey}:`, {
        dateRange,
        unidadeNome,
        searchTerm
      });

      return await this.getGoogleAdsStats(dateRange, searchTerm, accountKey);
    } catch (error) {
      console.error(`Erro ao buscar estatísticas adaptadas Google Ads ${accountKey}:`, error);
      throw error;
    }
  }

  // Método para buscar de todas as contas configuradas
  async getAllCampaigns(): Promise<GoogleAdsCampaign[]> {
    const configuredAccounts = getConfiguredGoogleAdsAccounts();
    const allCampaigns: GoogleAdsCampaign[] = [];

    console.log(`Buscando campanhas de ${configuredAccounts.length} contas configuradas`);

    for (const account of configuredAccounts) {
      try {
        const campaigns = await this.getCampaigns(account.key);
        allCampaigns.push(...campaigns);
        console.log(`Campanhas da ${account.name}: ${campaigns.length}`);
      } catch (error) {
        console.error(`Erro ao buscar campanhas da ${account.name}:`, error);
        // Continua com as outras contas mesmo se uma falhar
      }
    }

    console.log(`Total de campanhas: ${allCampaigns.length}`);
    return allCampaigns;
  }

  // Método para buscar campanhas com métricas de todas as contas - SEMPRE Supabase Edge Functions
  async getAllCampaignsWithMetrics(dateRange: { since: string; until: string }): Promise<GoogleAdsCampaign[]> {
    console.log('🚀 FRONTEND: getAllCampaignsWithMetrics CHAMADO - Supabase Edge Functions!');
    console.log('📅 FRONTEND: Período solicitado:', dateRange);
    
    const configuredAccounts = getConfiguredGoogleAdsAccounts();
    const allCampaigns: GoogleAdsCampaign[] = [];

    console.log(`Buscando campanhas com métricas de ${configuredAccounts.length} contas configuradas via Supabase`);

    for (const account of configuredAccounts) {
      try {
        const campaigns = await this.getCampaignsWithMetrics(dateRange, account.key);
        allCampaigns.push(...campaigns);
        console.log(`Campanhas com métricas da ${account.name}: ${campaigns.length}`);
      } catch (error) {
        console.error(`Erro ao buscar campanhas com métricas da ${account.name}:`, error);
        // Continua com as outras contas mesmo se uma falhar
      }
    }

    console.log(`Total de campanhas com métricas: ${allCampaigns.length}`);
    return allCampaigns;
  }


  // Método para buscar estatísticas de todas as contas
  async getAllGoogleAdsStats(dateRange: { since: string; until: string }, searchTerm?: string): Promise<GoogleAdsStats> {
    const configuredAccounts = getConfiguredGoogleAdsAccounts();
    
    console.log(`Agregando estatísticas de ${configuredAccounts.length} contas configuradas`);

    let totalStats: GoogleAdsStats = {
      totalConversions: 0,
      totalConversionsAjustado: 0,
      gastoTotal: 0,
      custoMedioPorConversao: 0,
      custoMedioPorConversaoAjustado: 0,
      dadosCampanhas: { total: 0, filtradas: 0 },
      allConversions: 0,
      allConversionsValue: 0,
      impressions: 0,
      clicks: 0,
      ctr: 0
    };

    for (const account of configuredAccounts) {
      try {
        const stats = await this.getGoogleAdsStats(dateRange, searchTerm, account.key);
        
        totalStats.totalConversions += stats.totalConversions;
        totalStats.allConversions += stats.allConversions;
        totalStats.allConversionsValue += stats.allConversionsValue;
        totalStats.gastoTotal += stats.gastoTotal;
        totalStats.impressions += stats.impressions;
        totalStats.clicks += stats.clicks;
        totalStats.dadosCampanhas.total += stats.dadosCampanhas.total;
        totalStats.dadosCampanhas.filtradas += stats.dadosCampanhas.filtradas;

        console.log(`Estatísticas da ${account.name} agregadas`);
      } catch (error) {
        console.error(`Erro ao buscar estatísticas da ${account.name}:`, error);
        // Continua com as outras contas mesmo se uma falhar
      }
    }

    // Recalcula métricas finais
    totalStats.totalConversionsAjustado = Math.floor(totalStats.totalConversions * 0.7);
    totalStats.custoMedioPorConversao = totalStats.totalConversions > 0 ? totalStats.gastoTotal / totalStats.totalConversions : 0;
    totalStats.custoMedioPorConversaoAjustado = totalStats.totalConversionsAjustado > 0 ? totalStats.gastoTotal / totalStats.totalConversionsAjustado : 0;
    totalStats.ctr = totalStats.impressions > 0 ? (totalStats.clicks / totalStats.impressions) * 100 : 0;

    console.log('Estatísticas agregadas finais:', totalStats);
    return totalStats;
  }

  // Método para testar conectividade de todas as contas
  async testAllConnections(): Promise<{ [key: string]: { connected: boolean; message: string; data?: any } }> {
    const configuredAccounts = getConfiguredGoogleAdsAccounts();
    const results: { [key: string]: { connected: boolean; message: string; data?: any } } = {};

    console.log(`Testando conectividade de ${configuredAccounts.length} contas`);

    for (const account of configuredAccounts) {
      try {
        results[account.key] = await this.validateConnection(account.key);
      } catch (error) {
        results[account.key] = {
          connected: false,
          message: error instanceof Error ? error.message : 'Erro desconhecido'
        };
      }
    }

    console.log('Resultados dos testes de conectividade:', results);
    return results;
  }
}

export const googleAdsService = new GoogleAdsService();
export type { GoogleAdsCampaign, GoogleAdsStats, GoogleAdsResponse };
