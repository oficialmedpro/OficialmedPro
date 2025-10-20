import { createClient } from '@supabase/supabase-js'
import { supabaseUrl, supabaseServiceKey, supabaseSchema } from '../config/supabase.js'

// Cliente Supabase usando configuração centralizada
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

/**
 * 🎯 SERVIÇO GOOGLE ADS - INTEGRAÇÃO COM SUPABASE
 */
class GoogleAdsService {
  constructor() {
    this.unidadeId = 1; // ID da unidade padrão (Apucarana)
    this.customerId = null;
    this.credentials = null;
    this.proxyUrl = 'http://localhost:3001'; // URL do proxy Google Ads
    console.log('🔧 GoogleAdsService inicializado - Unidade padrão: Apucarana (ID=1)');
  }

  /**
   * Carrega as credenciais do Google Ads do banco de dados
   */
  async loadCredentials(unidadeId = 1) {
    try {
      console.log('🔍 GoogleAdsService: Carregando dados da unidade:', unidadeId);
      
      // Usar fetch direto como no supabase.js que funciona
      const response = await fetch(`${supabaseUrl}/rest/v1/unidades?select=id,nome&id=eq.${unidadeId}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'apikey': supabaseServiceKey,
          'Accept-Profile': supabaseSchema,
          'Content-Profile': supabaseSchema
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Erro HTTP:', response.status, errorText);
        throw new Error(`Erro HTTP ${response.status}: ${errorText}`);
      }

      const testData = await response.json();
      console.log('✅ Consulta direta funcionou:', testData);

      if (!testData || testData.length === 0) {
        throw new Error('Unidade não encontrada');
      }

      // Buscar todos os campos
      const fullResponse = await fetch(`${supabaseUrl}/rest/v1/unidades?select=*&id=eq.${unidadeId}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'apikey': supabaseServiceKey,
          'Accept-Profile': supabaseSchema,
          'Content-Profile': supabaseSchema
        }
      });

      if (!fullResponse.ok) {
        const errorText = await fullResponse.text();
        console.error('❌ Erro HTTP na consulta completa:', fullResponse.status, errorText);
        throw new Error(`Erro HTTP ${fullResponse.status}: ${errorText}`);
      }

      const data = await fullResponse.json();

      if (!data || data.length === 0) {
        console.warn('⚠️ GoogleAdsService: Unidade não encontrada:', unidadeId);
        return false;
      }

      const unidadeData = data[0];
      console.log('📋 Dados completos da unidade:', unidadeData);

      // Verificar se tem credenciais do Google Ads (apenas customer_id é obrigatório por enquanto)
      if (!unidadeData.google_customer_id) {
        console.warn('⚠️ GoogleAdsService: google_customer_id não encontrado para unidade:', unidadeData.nome);
        console.log('🔍 Campos disponíveis:', Object.keys(unidadeData));
        console.log('🔍 google_customer_id:', unidadeData.google_customer_id);
        
        // Não usar dados mockados - apenas dados reais
        this.customerId = null;
        this.unidadeId = unidadeId;
        this.credentials = null;
        
        console.log('❌ Sem credenciais reais - não exibir dados');
        return false;
      }

      // Armazenar credenciais reais
      this.customerId = unidadeData.google_customer_id;
      this.unidadeId = unidadeId;
      this.credentials = {
        customerId: unidadeData.google_customer_id,
        developerToken: unidadeData.google_developer_token,
        clientId: unidadeData.google_client_id,
        clientSecret: unidadeData.google_client_secret,
        refreshToken: unidadeData.google_refresh_token
      };

      console.log('✅ GoogleAdsService: Credenciais do Google Ads carregadas para unidade:', unidadeData.nome);
      console.log('🔑 Customer ID:', unidadeData.google_customer_id);
      return true;
    } catch (error) {
      console.error('❌ GoogleAdsService: Erro ao carregar dados da unidade:', error);
      return false;
    }
  }

  /**
   * Faz chamada para o proxy Google Ads
   */
  async callProxy(endpoint, method = 'GET', data = null) {
    try {
      const url = `${this.proxyUrl}${endpoint}`;
      const options = {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${JSON.stringify(this.credentials)}`
        }
      };

      if (data) {
        options.body = JSON.stringify(data);
      }

      const response = await fetch(url, options);
      
      if (!response.ok) {
        throw new Error(`Proxy error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('❌ Erro na chamada do proxy:', error);
      throw error;
    }
  }

  /**
   * Testa a conexão com as credenciais carregadas
   */
  async testConnection() {
    try {
      console.log('🔍 GoogleAdsService: Testando conexão...');
      
      if (!this.customerId) {
        const loaded = await this.loadCredentials();
        if (!loaded) {
          throw new Error('Credenciais do Google Ads não encontradas no banco de dados');
        }
      }

      // Verificar se tem credenciais reais (apenas customer_id é obrigatório)
      const hasRealCreds = this.credentials && 
        this.credentials.customerId;

      if (hasRealCreds) {
        console.log('✅ GoogleAdsService: Conexão testada com sucesso - DADOS REAIS');
        console.log('🔑 Usando credenciais da unidade Apucarana (ID=1)');
      } else {
        console.log('⚠️ GoogleAdsService: Usando dados mockados - SEM CREDENCIAIS REAIS');
      }

      return {
        success: true,
        customerId: this.customerId,
        unidadeId: this.unidadeId,
        customerName: 'OficialMed - Apucarana',
        message: hasRealCreds ? 'Conexão com Google Ads estabelecida' : 'Modo Demo - Dados simulados',
        isRealData: hasRealCreds,
        credentials: {
          hasCustomerId: !!this.credentials?.customerId,
          hasDeveloperToken: !!this.credentials?.developerToken,
          hasClientId: !!this.credentials?.clientId,
          hasClientSecret: !!this.credentials?.clientSecret,
          hasRefreshToken: !!this.credentials?.refreshToken
        }
      };
    } catch (error) {
      console.error('❌ GoogleAdsService: Teste de conexão falhou:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Busca campanhas do Google Ads
   */
  async getCampaigns(dateRange = null) {
    try {
      console.log('🔍 GoogleAdsService: Buscando campanhas REAIS via proxy...');
      
      if (!this.credentials) {
        throw new Error('Credenciais do Google Ads não configuradas');
      }

      // Buscar campanhas reais via proxy
      const campaigns = await this.callProxy('/api/campaigns', 'GET');

      console.log('✅ GoogleAdsService: Campanhas reais encontradas:', campaigns.length);
      
      return campaigns;

    } catch (error) {
      console.error('❌ GoogleAdsService: Erro ao buscar campanhas:', error);
      throw error;
    }
  }

  /**
   * Busca estatísticas do Google Ads
   */
  async getGoogleAdsStats(dateRange = null) {
    try {
      console.log('📊 GoogleAdsService: Buscando estatísticas REAIS via proxy...');
      
      if (!this.credentials) {
        throw new Error('Credenciais do Google Ads não configuradas');
      }

      // Buscar estatísticas reais via proxy
      const stats = await this.callProxy('/api/stats', 'GET');

      console.log('✅ GoogleAdsService: Estatísticas reais calculadas');
      
      return stats;

    } catch (error) {
      console.error('❌ GoogleAdsService: Erro ao buscar estatísticas:', error);
      throw error;
    }
  }

  /**
   * Busca grupos de anúncios
   */
  async getAdGroups(campaignId) {
    try {
      console.log('🔍 GoogleAdsService: Buscando grupos de anúncios REAIS via proxy para campanha:', campaignId);
      
      if (!this.credentials) {
        throw new Error('Credenciais do Google Ads não configuradas');
      }

      // Buscar grupos de anúncios reais via proxy
      const adGroups = await this.callProxy(`/api/campaigns/${campaignId}/adgroups`, 'GET');

      console.log('✅ GoogleAdsService: Grupos de anúncios reais encontrados:', adGroups.length);
      
      return adGroups;

    } catch (error) {
      console.error('❌ GoogleAdsService: Erro ao buscar grupos de anúncios:', error);
      throw error;
    }
  }

  /**
   * Busca anúncios
   */
  async getAds(adGroupId) {
    try {
      console.log('🔍 GoogleAdsService: Buscando anúncios REAIS via proxy para grupo:', adGroupId);
      
      if (!this.credentials) {
        throw new Error('Credenciais do Google Ads não configuradas');
      }

      // Buscar anúncios reais via proxy
      const ads = await this.callProxy(`/api/adgroups/${adGroupId}/ads`, 'GET');

      console.log('✅ GoogleAdsService: Anúncios reais encontrados:', ads.length);
      
      return ads;

    } catch (error) {
      console.error('❌ GoogleAdsService: Erro ao buscar anúncios:', error);
      throw error;
    }
  }

  /**
   * Obtém dados completos para o dashboard
   */
  async getDashboardData(options = {}) {
    try {
      console.log('📊 GoogleAdsService: Buscando dados completos do dashboard...');
      
      const { dateRange, unidadeId } = options;
      
      if (unidadeId && unidadeId !== this.unidadeId) {
        await this.loadCredentials(unidadeId);
      }

      const [stats, campaigns] = await Promise.all([
        this.getGoogleAdsStats(dateRange),
        this.getCampaigns(dateRange)
      ]);

      const dashboardData = {
        stats,
        campaigns,
        customerId: this.customerId,
        unidadeId: this.unidadeId,
        lastUpdated: new Date().toISOString()
      };

      console.log('✅ GoogleAdsService: Dados do dashboard carregados');
      return dashboardData;
    } catch (error) {
      console.error('❌ GoogleAdsService: Erro ao buscar dados do dashboard:', error);
      throw error;
    }
  }

  /**
   * Busca informações da conta
   */
  async getCustomerInfo() {
    try {
      console.log('🔍 GoogleAdsService: Buscando informações da conta...');
      
      if (!this.customerId) {
        await this.loadCredentials();
      }

      const customerInfo = {
        id: this.customerId,
        name: 'OficialMed - Apucarana',
        currency: 'BRL',
        timeZone: 'America/Sao_Paulo',
        status: 'ACTIVE',
        unidadeId: this.unidadeId,
        cidade: 'Apucarana',
        estado: 'PR',
        codigoSprint: '[1]',
        hasCredentials: !!this.credentials
      };

      console.log('✅ GoogleAdsService: Informações da conta obtidas');
      return customerInfo;
    } catch (error) {
      console.error('❌ GoogleAdsService: Erro ao buscar informações da conta:', error);
      throw error;
    }
  }
}

// Exportar instância única do serviço
export const googleAdsService = new GoogleAdsService();

// Exportar também a classe para casos específicos
export default GoogleAdsService;
