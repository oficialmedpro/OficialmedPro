import { supabase } from './supabase.js';

/**
 * Serviço proxy para integração com Google Ads API
 * Usa fetch para fazer requisições para um backend Node.js que processa a API do Google Ads
 */
class GoogleAdsApiProxy {
  constructor() {
    // Detectar ambiente automaticamente
    // Verificar se window.location está disponível e válido
    const hasValidLocation = typeof window !== 'undefined' && 
                             window.location && 
                             window.location.protocol && 
                             window.location.hostname &&
                             window.location.protocol.trim() !== '' &&
                             window.location.hostname.trim() !== '';
    
    const isProduction = hasValidLocation &&
                        window.location.hostname !== 'localhost' && 
                        window.location.hostname !== '127.0.0.1' &&
                        !window.location.hostname.includes('192.168.');
    
    // Validar URL antes de construir
    try {
      if (isProduction && hasValidLocation) {
        // Garantir que protocol e hostname são válidos
        const protocol = window.location.protocol?.trim() || 'https:';
        const hostname = window.location.hostname?.trim() || '';
        
        if (!hostname || hostname === '') {
          throw new Error('hostname vazio');
        }
        
        // Construir URL de forma segura
        const constructedUrl = `${protocol}//${hostname}/api/google-ads`;
        
        // Validar URL construída
        new URL(constructedUrl);
        this.baseUrl = constructedUrl;
      } else {
        this.baseUrl = 'http://localhost:3001/api/google-ads';
      }
    } catch (e) {
      console.warn('⚠️ Erro ao construir URL do GoogleAdsApiProxy, usando fallback:', e.message);
      this.baseUrl = 'http://localhost:3001/api/google-ads';
    }
    
    this.customerId = null;
    this.unidadeId = 1; // ID da unidade padrão
    
    console.log('🔧 GoogleAdsApiProxy inicializado - usando:', this.baseUrl);
    console.log('🌍 Ambiente:', isProduction ? 'Produção (VPS)' : 'Desenvolvimento (Local)');
  }

  /**
   * Carrega as credenciais do banco de dados
   * @param {number} unidadeId - ID da unidade
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

      this.customerId = data.google_customer_id;
      this.unidadeId = unidadeId;

      console.log('✅ Credenciais carregadas com sucesso para unidade:', data.nome);
      return true;
    } catch (error) {
      console.error('❌ Erro ao carregar credenciais:', error);
      return false;
    }
  }

  /**
   * Faz uma requisição para o proxy backend
   * @param {string} endpoint - Endpoint da API
   * @param {Object} options - Opções da requisição
   * @returns {Promise<Object>}
   */
  async makeRequest(endpoint, options = {}) {
    try {
      const url = `${this.baseUrl}${endpoint}`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          unidadeId: this.unidadeId,
          customerId: this.customerId,
          ...options
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Erro desconhecido na API');
      }

      return data.data;
    } catch (error) {
      console.error('❌ Erro na requisição para proxy:', error);
      throw error;
    }
  }

  /**
   * Testa a conexão com a API
   * @returns {Promise<Object>}
   */
  async testConnection() {
    try {
      console.log('🔍 Testando conexão com Google Ads API via proxy...');
      
      if (!this.customerId) {
        const loaded = await this.loadCredentials();
        if (!loaded) {
          throw new Error('Credenciais do Google Ads não encontradas no banco de dados');
        }
      }

      const result = await this.makeRequest('/test-connection');
      
      console.log('✅ Conexão testada com sucesso:', result.customerName);
      return {
        success: true,
        customerName: result.customerName,
        customerId: result.customerId,
        campaignsCount: result.campaignsCount,
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
   * Obtém informações da conta
   * @returns {Promise<Object>}
   */
  async getCustomerInfo() {
    try {
      console.log('🔍 Buscando informações da conta via proxy...');
      
      const result = await this.makeRequest('/customer-info');
      
      console.log('✅ Informações da conta obtidas:', result.name);
      return result;
    } catch (error) {
      console.error('❌ Erro ao buscar informações da conta:', error);
      throw error;
    }
  }

  /**
   * Lista campanhas
   * @returns {Promise<Array>}
   */
  async getCampaigns() {
    try {
      console.log('🔍 Buscando campanhas via proxy...');
      
      const result = await this.makeRequest('/campaigns');
      
      console.log('✅ Campanhas encontradas:', result.length);
      return result;
    } catch (error) {
      console.error('❌ Erro ao buscar campanhas:', error);
      throw error;
    }
  }

  /**
   * Busca campanhas com métricas
   * @param {Object} dateRange - Intervalo de datas
   * @returns {Promise<Array>}
   */
  async getCampaignsWithMetrics(dateRange) {
    try {
      console.log('🔍 Buscando campanhas com métricas via proxy...');
      
      const result = await this.makeRequest('/campaigns-with-metrics', { dateRange });
      
      console.log('✅ Campanhas com métricas encontradas:', result.length);
      return result;
    } catch (error) {
      console.error('❌ Erro ao buscar campanhas com métricas:', error);
      throw error;
    }
  }

  /**
   * Calcula estatísticas
   * @param {Object} dateRange - Intervalo de datas
   * @param {string} searchTerm - Termo de busca
   * @returns {Promise<Object>}
   */
  async getGoogleAdsStats(dateRange, searchTerm = '') {
    try {
      console.log('📊 Buscando stats via proxy...');
      
      const result = await this.makeRequest('/stats', { dateRange, searchTerm });
      
      console.log('✅ Stats calculados:', result);
      return result;
    } catch (error) {
      console.error('❌ Erro ao buscar dados do Google Ads:', error);
      throw error;
    }
  }

  /**
   * Busca grupos de anúncios
   * @param {string} campaignId - ID da campanha
   * @returns {Promise<Array>}
   */
  async getAdGroups(campaignId) {
    try {
      console.log('🔍 Buscando grupos de anúncios via proxy...');
      
      const result = await this.makeRequest('/ad-groups', { campaignId });
      
      console.log('✅ Grupos de anúncios encontrados:', result.length);
      return result;
    } catch (error) {
      console.error('❌ Erro ao buscar grupos de anúncios:', error);
      throw error;
    }
  }

  /**
   * Busca anúncios
   * @param {string} adGroupId - ID do grupo de anúncios
   * @returns {Promise<Array>}
   */
  async getAds(adGroupId) {
    try {
      console.log('🔍 Buscando anúncios via proxy...');
      
      const result = await this.makeRequest('/ads', { adGroupId });
      
      console.log('✅ Anúncios encontrados:', result.length);
      return result;
    } catch (error) {
      console.error('❌ Erro ao buscar anúncios:', error);
      throw error;
    }
  }

  /**
   * Obtém estatísticas para uma unidade específica
   * @param {string} unidadeNome - Nome da unidade
   * @returns {Promise<Object>}
   */
  async getGoogleAdsStatsForUnit(unidadeNome = '') {
    try {
      const searchTerm = unidadeNome?.toLowerCase().includes('londrina') ? 'londrina' : unidadeNome?.toLowerCase() || '';

      // Define intervalo do mês atual
      const today = new Date();
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);

      const dateRange = {
        startDate: firstDay.toISOString().split('T')[0],
        endDate: lastDay.toISOString().split('T')[0]
      };

      console.log('📊 Buscando stats da unidade via proxy:', unidadeNome);

      const stats = await this.getGoogleAdsStats(dateRange, searchTerm);
      const campanhas = await this.getCampaignsWithMetrics(dateRange);
      
      const result = {
        ...stats,
        campanhas: campanhas,
        periodo: dateRange
      };

      console.log('📈 Stats da unidade calculados:', result);
      return result;
    } catch (error) {
      console.error('❌ Erro ao buscar dados do Google Ads:', error);
      throw error;
    }
  }
}

// Lazy initialization - não criar instância automaticamente
let _googleAdsApiProxyInstance = null;

// Função para obter instância (lazy loading)
export const getGoogleAdsApiProxy = () => {
  if (!_googleAdsApiProxyInstance) {
    _googleAdsApiProxyInstance = new GoogleAdsApiProxy();
  }
  return _googleAdsApiProxyInstance;
};

// Exportar instância única do serviço (para compatibilidade, mas só inicializa quando necessário)
export const googleAdsApiProxy = new Proxy({}, {
  get(target, prop) {
    const instance = getGoogleAdsApiProxy();
    return instance[prop];
  }
});

// Exportar também a classe para casos específicos
export default GoogleAdsApiProxy;
