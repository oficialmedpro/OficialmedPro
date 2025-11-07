// Novo serviço que usa Edge Functions do Supabase
import { supabaseServiceKey } from '../config/supabase.js';

const API_BASE_URL = 'https://agdffspstbxeqhqtltvb.supabase.co/functions/v1/google-ads-api'; // Sempre usar produção

class GoogleAdsApiService {
  constructor() {
    console.log('🚀 GoogleAdsApiService inicializado');
    console.log('🔗 API URL:', API_BASE_URL);
    // Obter service key de forma segura (runtime ou build-time)
    this.getServiceKey = () => {
      return window.ENV?.VITE_SUPABASE_SERVICE_ROLE_KEY || supabaseServiceKey;
    };
  }

  /**
   * Faz uma requisição para o backend
   */
  async fetchFromBackend(endpoint, options = {}) {
    try {
      const url = `${API_BASE_URL}${endpoint}`;
      console.log(`🔍 Fazendo requisição: ${url}`);

      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getServiceKey()}`,
          ...options.headers
        },
        ...options
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`HTTP ${response.status}: ${error}`);
      }

      const data = await response.json();
      console.log(`✅ Resposta recebida:`, data);
      return data;

    } catch (error) {
      console.error(`❌ Erro na requisição ${endpoint}:`, error);
      throw error;
    }
  }

  /**
   * Testa a conexão com o Google Ads
   */
  async testConnection() {
    try {
      console.log('🧪 Testando conexão com Google Ads...');
      const response = await this.fetchFromBackend('/test-connection');
      
      if (response.success) {
        console.log('✅ Conexão estabelecida:', response.customerInfo);
        return {
          success: true,
          customerName: response.customerInfo.customerName,
          customerId: response.customerInfo.customerId,
          unidade: response.customerInfo.unidade,
          campaignsCount: 0, // Será preenchido depois
          isRealData: true
        };
      } else {
        throw new Error(response.error || 'Falha no teste de conexão');
      }
    } catch (error) {
      console.error('❌ Erro no teste de conexão:', error);
      return {
        success: false,
        error: error.message,
        isRealData: false
      };
    }
  }

  /**
   * Busca campanhas do Google Ads
   */
  async getCampaigns(startDate = null, endDate = null, status = 'active') {
    try {
      console.log(`🔍 Buscando campanhas (${status})...`);
      
      const params = new URLSearchParams();
      if (status) params.append('status', status);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      
      const endpoint = `/campaigns${params.toString() ? '?' + params.toString() : ''}`;
      const response = await this.fetchFromBackend(endpoint);
      
      if (response.success) {
        console.log(`✅ ${response.count} campanhas encontradas`);
        return response.data;
      } else {
        throw new Error(response.error || 'Falha ao buscar campanhas');
      }
    } catch (error) {
      console.error('❌ Erro ao buscar campanhas:', error);
      throw error;
    }
  }

  /**
   * Busca grupos de anúncios de uma campanha
   */
  async getAdGroups(campaignId) {
    try {
      console.log(`🔍 Buscando grupos de anúncios para campanha: ${campaignId}`);
      const response = await this.fetchFromBackend(`/campaigns/${campaignId}/adgroups`);
      
      if (response.success) {
        console.log(`✅ ${response.count} grupos encontrados`);
        return response.data;
      } else {
        throw new Error(response.error || 'Falha ao buscar grupos de anúncios');
      }
    } catch (error) {
      console.error('❌ Erro ao buscar grupos de anúncios:', error);
      throw error;
    }
  }

  /**
   * Busca anúncios de um grupo
   */
  async getAds(adGroupId) {
    try {
      console.log(`🔍 Buscando anúncios para grupo: ${adGroupId}`);
      const response = await this.fetchFromBackend(`/adgroups/${adGroupId}/ads`);
      
      if (response.success) {
        console.log(`✅ ${response.count} anúncios encontrados`);
        return response.data;
      } else {
        throw new Error(response.error || 'Falha ao buscar anúncios');
      }
    } catch (error) {
      console.error('❌ Erro ao buscar anúncios:', error);
      throw error;
    }
  }

  /**
   * Busca saldo da conta Google Ads
   */
  async getAccountBalance() {
    try {
      console.log('🔍 Buscando saldo da conta Google Ads...');
      const response = await this.fetchFromBackend('/account-balance');
      
      if (response.success) {
        console.log('✅ Saldo da conta carregado:', response.data);
        return response.data;
      } else {
        throw new Error(response.error || 'Falha ao buscar saldo da conta');
      }
    } catch (error) {
      console.error('❌ Erro ao buscar saldo da conta:', error);
      throw error;
    }
  }

  /**
   * Busca estatísticas/métricas
   */
  async getStats(startDate, endDate) {
    try {
      console.log(`🔍 Buscando estatísticas de ${startDate} a ${endDate}`);
      
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      
      const endpoint = `/stats${params.toString() ? '?' + params.toString() : ''}`;
      const response = await this.fetchFromBackend(endpoint);
      
      if (response.success) {
        console.log('✅ Estatísticas carregadas:', response.data);
        return response.data;
      } else {
        throw new Error(response.error || 'Falha ao buscar estatísticas');
      }
    } catch (error) {
      console.error('❌ Erro ao buscar estatísticas:', error);
      throw error;
    }
  }

  /**
   * Informações da conta/cliente
   */
  async getCustomerInfo() {
    try {
      const connectionTest = await this.testConnection();
      
      if (connectionTest.success) {
        return {
          id: connectionTest.customerId,
          name: connectionTest.customerName,
          currency: 'BRL',
          timeZone: 'America/Sao_Paulo',
          status: 'ACTIVE',
          unidade: connectionTest.unidade,
          isTestAccount: false
        };
      } else {
        throw new Error(connectionTest.error);
      }
    } catch (error) {
      console.error('❌ Erro ao buscar info do cliente:', error);
      throw error;
    }
  }

  /**
   * Dados completos do dashboard
   */
  async getDashboardData(options = {}) {
    try {
      console.log('📊 Buscando dados do dashboard...', options);

      const { dateRange } = options;
      const startDate = dateRange?.startDate;
      const endDate = dateRange?.endDate;

      // Buscar dados em paralelo
      const [stats, campaigns, customerInfo] = await Promise.all([
        this.getStats(startDate, endDate),
        this.getCampaigns(),
        this.getCustomerInfo()
      ]);

      const dashboardData = {
        stats,
        campaigns,
        customerId: customerInfo.id,
        unidadeId: 1, // Sempre Apucarana
        customerInfo,
        lastUpdated: new Date().toISOString()
      };

      console.log('✅ Dados do dashboard carregados:', dashboardData);
      return dashboardData;

    } catch (error) {
      console.error('❌ Erro ao buscar dados do dashboard:', error);
      throw error;
    }
  }
}

// Lazy initialization - não criar instância automaticamente
let _googleAdsApiServiceInstance = null;

// Função para obter instância (lazy loading)
export const getGoogleAdsApiService = () => {
  if (!_googleAdsApiServiceInstance) {
    _googleAdsApiServiceInstance = new GoogleAdsApiService();
  }
  return _googleAdsApiServiceInstance;
};

// Exportar instância única (para compatibilidade, mas só inicializa quando necessário)
export const googleAdsApiService = new Proxy({}, {
  get(target, prop) {
    const instance = getGoogleAdsApiService();
    return instance[prop];
  }
});

// Exportar também a classe para casos específicos
export default GoogleAdsApiService;