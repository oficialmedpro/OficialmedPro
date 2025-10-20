import { createClient } from '@supabase/supabase-js';
import { supabaseUrl, supabaseServiceKey } from '../config/supabase.js';

// Usar a configuração centralizada
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

export interface GoogleAdsCampaign {
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

export interface GoogleAdsStats {
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
  data: any;
  error?: string;
  count?: number;
  message?: string;
  warning?: string;
}

class GoogleAdsSupabaseService {
  private async callEdgeFunction(action: string, body?: any, accountKey: string = 'ACCOUNT_1'): Promise<any> {
    try {
      const { data, error } = await supabase.functions.invoke('google-ads-api', {
        body: body || {},
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (error) {
        console.error('❌ Erro na Edge Function:', error);
        throw new Error(error.message || 'Erro na comunicação com Supabase');
      }

      if (!data.success) {
        throw new Error(data.error || 'Erro na resposta da Edge Function');
      }

      return data;
    } catch (error) {
      console.error(`❌ Erro ao chamar ação ${action}:`, error);
      throw error;
    }
  }

  // Verificar se o serviço está configurado
  async isServiceAvailable(): Promise<boolean> {
    try {
      // Primeiro verificar configurações básicas
      if (!this.isConfigured()) {
        console.warn('⚠️ Serviço Supabase não configurado corretamente');
        return false;
      }

      // Verificar apenas se o Supabase está configurado (sem chamar validateConnection para evitar loop)
      if (!supabaseUrl || !supabaseAnonKey) {
        console.warn('⚠️ Supabase URL ou ANON_KEY não configurados');
        return false;
      }

      console.log('✅ Serviço Supabase disponível');
      return true;
    } catch (error) {
      console.warn('⚠️ Serviço Supabase não está disponível:', error.message);
      return false;
    }
  }

  // Validar conexão
  async validateConnection(accountKey: string = 'ACCOUNT_1'): Promise<{ connected: boolean; message: string; data?: any }> {
    try {
      console.log('🔍 Validando conexão via Supabase Edge Function...');

      const { data, error } = await supabase.functions.invoke('google-ads-api', {
        body: {
          action: 'validate',
          account: accountKey
        },
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (error) {
        console.error('❌ Erro detalhado da Edge Function:', error);
        throw new Error(`Erro na Edge Function: ${error.message || error.details || 'Erro desconhecido'}`);
      }

      return {
        connected: data.success,
        message: data.message || 'Conexão testada via Supabase',
        data: data.data
      };
    } catch (error) {
      console.error('❌ Erro ao validar conexão:', error);
      return {
        connected: false,
        message: error.message || 'Erro ao validar conexão via Supabase'
      };
    }
  }

  // Buscar campanhas básicas
  async getCampaigns(accountKey: string = 'ACCOUNT_1'): Promise<GoogleAdsCampaign[]> {
    try {
      console.log('📊 Buscando campanhas via Supabase Edge Function...');

      const { data, error } = await supabase.functions.invoke('google-ads-api', {
        body: {
          action: 'campaigns',
          account: accountKey
        },
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (error) {
        console.error('❌ Erro detalhado da Edge Function:', error);
        throw new Error(`Erro na Edge Function: ${error.message || error.details || 'Erro desconhecido'}`);
      }

      if (!data.success) {
        const errorMsg = data.error || 'Erro ao buscar campanhas';
        console.error('❌ Erro da Edge Function - campanhas:', data);
        throw new Error(`API Google Ads: ${errorMsg}`);
      }

      if (data.warning) {
        console.warn('⚠️', data.warning);
      }

      console.log(`✅ Campanhas carregadas via Supabase: ${data.count}`);
      return data.data || [];
    } catch (error) {
      console.error('❌ Erro ao buscar campanhas:', error);
      throw error;
    }
  }

  // Buscar campanhas com métricas
  async getCampaignsWithMetrics(
    dateRange: { since: string; until: string }, 
    searchTerm?: string,
    accountKey: string = 'ACCOUNT_1'
  ): Promise<GoogleAdsCampaign[]> {
    try {
      console.log('📊 Buscando campanhas com métricas via Supabase Edge Function...');
      console.log('📅 Período:', dateRange);

      const requestBody = {
        action: 'campaigns-metrics',
        account: accountKey,
        dateRange,
        searchTerm
      };
      
      console.log('🔍 Request body sendo enviado:', JSON.stringify(requestBody, null, 2));
      
      console.log('🔍 Cliente Supabase config:', {
        url: supabase.supabaseUrl,
        hasAnonKey: !!supabase.supabaseKey
      });
      
      // Tentar usando fetch direto primeiro
      console.log('🔄 Tentando com fetch direto...');
      const response = await fetch(`${supabase.supabaseUrl}/functions/v1/google-ads-api`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabase.supabaseKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });
      
      console.log('🔍 Status da resposta:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Erro na resposta:', errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
      
      const data = await response.json();
      console.log('🔍 Resposta da Edge Function (fetch):', data);

      if (!data.success) {
        const errorMsg = data.error || 'Erro ao buscar campanhas com métricas';
        console.error('❌ Erro da Edge Function - campanhas com métricas:', data);
        throw new Error(`API Google Ads: ${errorMsg}`);
      }

      if (data.warning) {
        console.warn('⚠️', data.warning);
      }

      console.log(`✅ Campanhas com métricas carregadas via Supabase: ${data.count}`);
      
      // Log detalhado das campanhas e métricas
      if (data.data && data.data.length > 0) {
        console.log('📦 SUPABASE: Resposta COMPLETA da Edge Function:', data);
        console.log('✅ Supabase: Campanhas com métricas recebidas:', data.count);
        
        data.data.forEach((campaign: GoogleAdsCampaign, index: number) => {
          console.log(`📊 SUPABASE: Campanha ${index + 1} "${campaign.name}"`, {
            hasMetrics: !!campaign.metrics,
            metrics: campaign.metrics ? {
              impressions: campaign.metrics.impressions,
              clicks: campaign.metrics.clicks,
              cost_micros: campaign.metrics.cost_micros,
              conversions: campaign.metrics.conversions
            } : null
          });
        });
      }

      return data.data || [];
    } catch (error) {
      console.error('❌ Erro ao buscar campanhas com métricas:', error);
      throw error;
    }
  }

  // Buscar estatísticas agregadas
  async getGoogleAdsStats(
    dateRange: { since: string; until: string }, 
    searchTerm?: string,
    accountKey: string = 'ACCOUNT_1'
  ): Promise<GoogleAdsStats> {
    try {
      console.log('📈 Buscando estatísticas via Supabase Edge Function...');

      const requestBody = {
        action: 'stats',
        account: accountKey,
        dateRange,
        searchTerm
      };
      
      console.log('🔍 Request body sendo enviado (stats):', JSON.stringify(requestBody, null, 2));
      
      // Usar fetch direto
      console.log('🔄 Tentando com fetch direto (stats)...');
      const response = await fetch(`${supabase.supabaseUrl}/functions/v1/google-ads-api`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabase.supabaseKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });
      
      console.log('🔍 Status da resposta (stats):', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Erro na resposta (stats):', errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
      
      const data = await response.json();
      console.log('🔍 Resposta da Edge Function (stats):', data);

      if (!data.success) {
        const errorMsg = data.error || 'Erro ao buscar estatísticas';
        console.error('❌ Erro da Edge Function - estatísticas:', data);
        throw new Error(`API Google Ads: ${errorMsg}`);
      }

      console.log('✅ Estatísticas carregadas via Supabase:', data.data);
      return data.data;
    } catch (error) {
      console.error('❌ Erro ao buscar estatísticas:', error);
      throw error;
    }
  }

  // Buscar informações da conta
  async getAccountInfo(accountKey: string = 'ACCOUNT_1'): Promise<any> {
    try {
      console.log('🏢 Buscando informações da conta via Supabase Edge Function...');

      const { data, error } = await supabase.functions.invoke('google-ads-api', {
        body: {
          action: 'account-info',
          account: accountKey
        },
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (error) {
        console.error('❌ Erro detalhado da Edge Function:', error);
        throw new Error(`Erro na Edge Function: ${error.message || error.details || 'Erro desconhecido'}`);
      }

      if (!data.success) {
        throw new Error(data.error || 'Erro ao buscar informações da conta');
      }

      return data.data;
    } catch (error) {
      console.error('❌ Erro ao buscar informações da conta:', error);
      throw error;
    }
  }

  // Descobrir Customer IDs
  async discoverCustomerIds(accountKey: string = 'ACCOUNT_1'): Promise<any> {
    try {
      console.log('🔍 Descobrindo Customer IDs via Supabase Edge Function...');

      const { data, error } = await supabase.functions.invoke('google-ads-api', {
        body: {
          action: 'discover',
          account: accountKey
        },
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (error) {
        console.error('❌ Erro detalhado da Edge Function:', error);
        throw new Error(`Erro na Edge Function: ${error.message || error.details || 'Erro desconhecido'}`);
      }

      if (!data.success) {
        throw new Error(data.error || 'Erro na descoberta');
      }

      return data;
    } catch (error) {
      console.error('❌ Erro na descoberta:', error);
      throw error;
    }
  }

  // Buscar campanhas com métricas detalhadas (endpoint especializado)
  async getCampaignsWithDetailedMetrics(
    dateRange: { since: string; until: string },
    accountKey: string = 'ACCOUNT_1'
  ): Promise<{ campaigns: GoogleAdsCampaign[]; generalStats: any }> {
    try {
      console.log('📊 Buscando campanhas com métricas detalhadas via Supabase...');
      console.log('📅 Período:', dateRange);

      const { data, error } = await supabase.functions.invoke('google-ads-api', {
        body: {
          action: 'campaigns-metrics',
          account: accountKey,
          dateRange
        },
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (error) {
        console.error('❌ Erro detalhado da Edge Function:', error);
        throw new Error(`Erro na Edge Function: ${error.message || error.details || 'Erro desconhecido'}`);
      }

      if (!data.success) {
        throw new Error(data.error || 'Erro ao buscar métricas detalhadas');
      }

      console.log(`✅ Métricas detalhadas carregadas via Supabase: ${data.count} campanhas`);
      
      // Log detalhado similar ao backend local
      if (data.data && data.data.length > 0) {
        console.log('🔍 SUPABASE: Status da resposta:', 200);
        console.log('📦 SUPABASE: Resposta COMPLETA da Edge Function:', data);
        console.log('✅ Supabase: Campanhas com métricas recebidas:', data.count);
        
        data.data.forEach((campaign: GoogleAdsCampaign, index: number) => {
          const metrics = campaign.metrics;
          console.log(`📊 SUPABASE: Campanha ${index + 1} "${campaign.name}"`, {
            hasMetrics: !!metrics,
            impressions: metrics?.impressions || 0,
            clicks: metrics?.clicks || 0,
            cost: metrics ? (metrics.cost_micros / 1000000).toFixed(2) : '0.00',
            conversions: metrics?.conversions || 0
          });
        });
      }

      return {
        campaigns: data.data || [],
        generalStats: data.generalStats || {}
      };
    } catch (error) {
      console.error('❌ Erro ao buscar métricas detalhadas:', error);
      throw error;
    }
  }

  // Método para verificar se está configurado
  isConfigured(accountKey: 'ACCOUNT_1' | 'ACCOUNT_2' = 'ACCOUNT_1'): boolean {
    // Verificar configuração do Supabase
    if (!supabaseUrl || !supabaseAnonKey) {
      console.warn(`⚠️ Supabase não configurado: URL=${!!supabaseUrl}, ANON_KEY=${!!supabaseAnonKey}`);
      return false;
    }

    // A Edge Function já verifica as configurações automaticamente
    try {
      const isGoogleAdsConfigured = true; // Edge Function tem todas as credenciais

      if (!isGoogleAdsConfigured) {
        console.warn(`⚠️ Google Ads ${accountKey} não configurado completamente`);
        return false;
      }

      return true;
    } catch (error) {
      console.error(`❌ Erro ao verificar configuração ${accountKey}:`, error);
      return false;
    }
  }

  // Método utilitário para testar múltiplas contas
  async testMultipleAccounts(): Promise<{ [key: string]: boolean }> {
    const accounts = ['ACCOUNT_1', 'ACCOUNT_2'];
    const results: { [key: string]: boolean } = {};

    for (const account of accounts) {
      try {
        const result = await this.validateConnection(account);
        results[account] = result.connected;
        console.log(`✅ ${account}: ${result.connected ? 'Conectado' : 'Falhou'}`);
      } catch (error) {
        results[account] = false;
        console.log(`❌ ${account}: Erro - ${error.message}`);
      }
    }

    return results;
  }
}

export const googleAdsSupabaseService = new GoogleAdsSupabaseService();
export type { GoogleAdsResponse };
