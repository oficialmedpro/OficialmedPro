import axios from 'axios';

// Configuração do backend local
const API_BASE = 'http://localhost:3003';

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

class GoogleAdsLocalService {
  // Verificar se o servidor backend está rodando
  async isServerRunning(): Promise<boolean> {
    try {
      const response = await axios.get(`${API_BASE}/health`, { timeout: 5000 });
      return response.data.status === 'OK';
    } catch (error) {
      console.warn('⚠️ Servidor backend não está rodando:', error.message);
      return false;
    }
  }

  // Validar conexão
  async validateConnection(): Promise<{ connected: boolean; message: string; data?: any }> {
    try {
      if (!(await this.isServerRunning())) {
        return {
          connected: false,
          message: 'Servidor backend não está rodando. Execute: npm run backend:dev'
        };
      }

      console.log('🔍 Validando conexão via backend local...');

      const response = await axios.post(`${API_BASE}/api/google-ads/validate`);
      
      return {
        connected: response.data.success,
        message: response.data.message || 'Conexão testada',
        data: response.data.data
      };
    } catch (error) {
      console.error('❌ Erro ao validar conexão:', error);
      return {
        connected: false,
        message: error.response?.data?.error || error.message || 'Erro ao validar conexão'
      };
    }
  }

  // Buscar campanhas básicas
  async getCampaigns(): Promise<GoogleAdsCampaign[]> {
    try {
      if (!(await this.isServerRunning())) {
        throw new Error('Servidor backend não está rodando. Execute: npm run backend:dev');
      }

      console.log('📊 Buscando campanhas via backend local...');

      const response = await axios.post(`${API_BASE}/api/google-ads/campaigns`);
      
      if (!response.data.success) {
        throw new Error(response.data.error || 'Erro ao buscar campanhas');
      }

      console.log(`✅ Campanhas carregadas: ${response.data.count}`);
      return response.data.data || [];
    } catch (error) {
      console.error('❌ Erro ao buscar campanhas:', error);
      throw error;
    }
  }

  // Buscar campanhas com métricas
  async getCampaignsWithMetrics(dateRange: { since: string; until: string }, searchTerm?: string): Promise<GoogleAdsCampaign[]> {
    try {
      if (!(await this.isServerRunning())) {
        throw new Error('Servidor backend não está rodando. Execute: npm run backend:dev');
      }

      console.log('📊 Buscando campanhas com métricas via backend local...');

      const response = await axios.post(`${API_BASE}/api/google-ads/campaigns/stats`, {
        dateRange,
        searchTerm
      });
      
      if (!response.data.success) {
        throw new Error(response.data.error || 'Erro ao buscar campanhas com métricas');
      }

      if (response.data.warning) {
        console.warn('⚠️', response.data.warning);
      }

      console.log(`✅ Campanhas com métricas carregadas: ${response.data.count}`);
      return response.data.data || [];
    } catch (error) {
      console.error('❌ Erro ao buscar campanhas com métricas:', error);
      throw error;
    }
  }

  // Buscar estatísticas agregadas
  async getGoogleAdsStats(dateRange: { since: string; until: string }, searchTerm?: string): Promise<GoogleAdsStats> {
    try {
      if (!(await this.isServerRunning())) {
        throw new Error('Servidor backend não está rodando. Execute: npm run backend:dev');
      }

      console.log('📈 Buscando estatísticas via backend local...');

      const response = await axios.post(`${API_BASE}/api/google-ads/stats`, {
        dateRange,
        searchTerm
      });
      
      if (!response.data.success) {
        throw new Error(response.data.error || 'Erro ao buscar estatísticas');
      }

      console.log('✅ Estatísticas carregadas:', response.data.data);
      return response.data.data;
    } catch (error) {
      console.error('❌ Erro ao buscar estatísticas:', error);
      throw error;
    }
  }

  // Buscar informações da conta
  async getAccountInfo(): Promise<any> {
    try {
      if (!(await this.isServerRunning())) {
        throw new Error('Servidor backend não está rodando. Execute: npm run backend:dev');
      }

      console.log('🏢 Buscando informações da conta via backend local...');

      const response = await axios.post(`${API_BASE}/api/google-ads/account-info`);
      
      if (!response.data.success) {
        throw new Error(response.data.error || 'Erro ao buscar informações da conta');
      }

      return response.data.data;
    } catch (error) {
      console.error('❌ Erro ao buscar informações da conta:', error);
      throw error;
    }
  }

  // Descobrir Customer IDs
  async discoverCustomerIds(): Promise<any> {
    try {
      if (!(await this.isServerRunning())) {
        throw new Error('Servidor backend não está rodando. Execute: npm run backend:dev');
      }

      console.log('🔍 Descobrindo Customer IDs via backend local...');

      const response = await axios.post(`${API_BASE}/api/google-ads/discover`);
      
      if (!response.data.success) {
        throw new Error(response.data.error || 'Erro na descoberta');
      }

      return response.data;
    } catch (error) {
      console.error('❌ Erro na descoberta:', error);
      throw error;
    }
  }

  // Método para verificar se está configurado (sempre true para servidor local)
  isConfigured(): boolean {
    return true; // O servidor local gerencia as credenciais
  }
}

export const googleAdsLocalService = new GoogleAdsLocalService();
export type { GoogleAdsResponse };
