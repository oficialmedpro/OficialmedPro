import { getGoogleAdsConfig, getConfiguredGoogleAdsAccounts } from '../constants/googleAds';
import { supabase } from './supabase';

class GooglePatrocinadoService {
  // SEMPRE usar Supabase Edge Functions (backend local removido)
  constructor() {
    console.log('🔧 Google Patrocinado Service configurado para usar: Supabase Edge Functions');
    // Testar a conexão automaticamente
    this.testConnection();
  }
  
  // Método para testar a conexão e buscar campanhas
  async testConnection() {
    try {
      console.log('🚀 TESTE: Iniciando teste da Edge Function Google Ads...');
      
      // PRIMEIRO: Debug das unidades para ver as credenciais
      console.log('🔍 DEBUG: Verificando unidades no Supabase...');
      const debugResponse = await fetch('https://agdffspstbxeqhqtltvb.supabase.co/functions/v1/google-ads-api/debug-unidades', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY}`,
          'Content-Type': 'application/json',
        }
      });

      if (debugResponse.ok) {
        const debugData = await debugResponse.json();
        console.log('🔍 DEBUG: Dados das unidades:', debugData);
        
        // Verificar se há unidades com credenciais
        if (debugData?.debug?.todasUnidades) {
          console.log('📋 DEBUG: Unidades encontradas:', debugData.debug.todasUnidades.length);
          const activeUnits = [];
          
          debugData.debug.todasUnidades.forEach((unit, index) => {
            console.log(`   ${index + 1}. ${unit.unidade} - Google Customer ID: ${unit.google_customer_id || '❌ Não configurado'}`);
            console.log(`      Google Ads Ativo: ${unit.google_ads_active ? '✅' : '❌'}`);
            console.log(`      Developer Token: ${unit.google_developer_token ? '✅ Presente' : '❌ Ausente'}`);
            console.log(`      Refresh Token: ${unit.google_refresh_token ? '✅ Presente' : '❌ Ausente'}`);
            
            // Coletar unidades ativas para buscar campanhas
            if (unit.google_ads_active && unit.google_customer_id) {
              activeUnits.push({
                name: unit.unidade,
                customerId: unit.google_customer_id.replace(/-/g, '')
              });
            }
          });
          
          // Buscar campanhas de todas as unidades ativas
          if (activeUnits.length > 0) {
            console.log(`🎯 BUSCANDO CAMPANHAS de ${activeUnits.length} unidades ativas...`);
            await this.fetchCampaignsForAllUnits(activeUnits);
          }
        }
      } else {
        console.error('❌ DEBUG: Erro ao buscar unidades:', debugResponse.status);
      }
      
      // SEGUNDO: Teste de conexão (vai falhar mas vamos ver o erro específico)
      console.log('🔍 TESTE 1: Testando conexão direta...');
      const connectionResponse = await fetch('https://agdffspstbxeqhqtltvb.supabase.co/functions/v1/google-ads-api/test-connection', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY}`,
          'Content-Type': 'application/json',
        }
      });

      if (!connectionResponse.ok) {
        console.error('❌ TESTE 1: Erro HTTP:', connectionResponse.status, connectionResponse.statusText);
        const errorText = await connectionResponse.text();
        console.error('❌ TESTE 1: Resposta:', errorText);
        
        // Tentar parsear o erro para mais detalhes
        try {
          const errorData = JSON.parse(errorText);
          console.error('❌ TESTE 1: Erro detalhado:', errorData);
        } catch (e) {
          console.error('❌ TESTE 1: Erro não é JSON válido');
        }
        return;
      }

      const connectionData = await connectionResponse.json();
      console.log('✅ TESTE 1: Conexão estabelecida:', connectionData);

    } catch (error) {
      console.error('❌ TESTE: Erro geral no teste:', error);
    }
  }

  // Método para buscar campanhas de todas as unidades ativas
  async fetchCampaignsForAllUnits(activeUnits) {
    for (const unit of activeUnits) {
      try {
        console.log(`🔍 BUSCANDO campanhas para ${unit.name} (${unit.customerId})...`);
        
        const campaignsResponse = await fetch(`https://agdffspstbxeqhqtltvb.supabase.co/functions/v1/google-ads-api/campaigns?customer_id=${unit.customerId}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY}`,
            'Content-Type': 'application/json',
          }
        });

        if (campaignsResponse.ok) {
          const campaignsData = await campaignsResponse.json();
          console.log(`✅ ${unit.name}: ${campaignsData?.count || 0} campanhas encontradas`);
          
          if (campaignsData?.data && campaignsData.data.length > 0) {
            console.log(`📋 Campanhas de ${unit.name}:`);
            campaignsData.data.forEach((campaign, index) => {
              console.log(`   ${index + 1}. ${campaign.name} (${campaign.status}) - Tipo: ${campaign.channelType}`);
            });
          } else {
            console.log(`   ℹ️ Nenhuma campanha ativa encontrada para ${unit.name}`);
          }
        } else {
          const errorText = await campaignsResponse.text();
          console.error(`❌ ${unit.name}: Erro ao buscar campanhas:`, errorText);
        }
      } catch (error) {
        console.error(`❌ ${unit.name}: Erro geral:`, error);
      }
    }
  }
  
  // Método para verificar qual serviço está sendo usado
  getServiceType() {
    return 'supabase';
  }
  
  // Método para verificar disponibilidade do serviço
  async checkServiceAvailability() {
    try {
      // Verificar se o Supabase está configurado
      if (!supabase) {
        throw new Error('Supabase não está configurado');
      }
      
      console.log('🔍 Supabase Edge Functions: ✅ Disponível');
      return true;
    } catch (error) {
      console.error('❌ Erro ao verificar disponibilidade do serviço:', error);
      throw new Error('Supabase Edge Functions não está disponível');
    }
  }

  // Método para verificar se as credenciais estão configuradas
  isConfigured(accountKey = 'ACCOUNT_1') {
    const config = getGoogleAdsConfig(accountKey);
    return !!(
      config.CLIENT_ID && 
      config.CLIENT_SECRET && 
      config.REFRESH_TOKEN && 
      config.CUSTOMER_ID && 
      config.DEVELOPER_TOKEN
    );
  }

  // Chamada genérica para a Edge Function
  async callEdgeFunction(action, params = {}, accountKey = 'ACCOUNT_1') {
    try {
      const config = getGoogleAdsConfig(accountKey);
      
      console.log(`Chamando Edge Function Google Patrocinado - Ação: ${action}, Conta: ${accountKey}`);
      
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
  async validateConnection(accountKey = 'ACCOUNT_1') {
    try {
      console.log(`🔍 Validando conexão Google Patrocinado ${accountKey} usando Supabase Edge Functions...`);

      await this.checkServiceAvailability();
      
      console.log('🔄 Usando Supabase Edge Functions para validação');
      
      // Implementar validação diretamente
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
      console.error(`❌ Erro ao validar conexão ${accountKey}:`, error);
      return {
        connected: false,
        message: error instanceof Error ? error.message : 'Erro ao validar conexão'
      };
    }
  }

  // Método auxiliar para verificar configuração da edge function
  isConfiguredForEdgeFunction(accountKey = 'ACCOUNT_1') {
    const config = getGoogleAdsConfig(accountKey);
    return !!(config.CLIENT_ID && config.CLIENT_SECRET && config.REFRESH_TOKEN && config.CUSTOMER_ID && config.DEVELOPER_TOKEN);
  }

  // Método para obter informações da conta
  async getAccountInfo(accountKey = 'ACCOUNT_1') {
    try {
      if (!this.isConfigured(accountKey)) {
        throw new Error(`Credenciais do Google Ads não configuradas para ${accountKey}`);
      }

      console.log(`Buscando informações da conta Google Patrocinado ${accountKey}`);

      const result = await this.callEdgeFunction('getAccountInfo', {}, accountKey);
      return result.data;
    } catch (error) {
      console.error(`Erro ao buscar informações da conta ${accountKey}:`, error);
      throw error;
    }
  }

  // Método para buscar campanhas básicas - SEMPRE Supabase Edge Functions
  async getCampaigns(accountKey = 'ACCOUNT_1') {
    try {
      console.log(`Buscando campanhas do Google Patrocinado ${accountKey} via Supabase Edge Functions`);

      await this.checkServiceAvailability();
      console.log('🔄 Usando Supabase Edge Functions para campanhas');
      
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

      const campaigns = data.data || [];
      
      // Adicionar informações da conta a cada campanha
      const campaignsWithAccount = campaigns.map(campaign => ({
        ...campaign,
        accountKey,
        accountName: this.getAccountName(accountKey)
      }));
      
      console.log(`✅ Campanhas carregadas via Supabase: ${campaignsWithAccount.length}`);
      return campaignsWithAccount;
    } catch (error) {
      console.error(`Erro ao buscar campanhas ${accountKey}:`, error);
      throw error;
    }
  }

  // Método para buscar campanhas com métricas - SEMPRE Supabase Edge Functions
  async getCampaignsWithMetrics(dateRange, accountKey = 'ACCOUNT_1') {
    try {
      console.log(`📊 Buscando campanhas com métricas ${accountKey} via Supabase Edge Functions:`, dateRange);

      await this.checkServiceAvailability();
      
      console.log('🔄 Usando Supabase Edge Functions para campanhas com métricas');
      
      const requestBody = {
        action: 'campaigns-metrics',
        account: accountKey,
        dateRange
      };
      
      const { data, error } = await supabase.functions.invoke('google-ads-api', {
        body: requestBody,
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
        const errorMsg = data.error || 'Erro ao buscar campanhas com métricas';
        console.error('❌ Erro da Edge Function - campanhas com métricas:', data);
        throw new Error(`API Google Ads: ${errorMsg}`);
      }

      const campaigns = data.data || [];
      
      // Adicionar informações da conta a cada campanha
      const campaignsWithAccount = campaigns.map(campaign => ({
        ...campaign,
        accountKey,
        accountName: this.getAccountName(accountKey)
      }));
      
      console.log(`✅ Campanhas obtidas via Supabase: ${campaignsWithAccount.length}`);
      return campaignsWithAccount;
    } catch (error) {
      console.error(`❌ Erro ao buscar campanhas com métricas ${accountKey}:`, error);
      throw new Error(`Falha ao obter campanhas: ${error.message}`);
    }
  }

  // Método para calcular estatísticas - SEMPRE Supabase Edge Functions
  async getGoogleAdsStats(dateRange, searchTerm, accountKey = 'ACCOUNT_1') {
    try {
      console.log(`📈 Buscando estatísticas Google Patrocinado ${accountKey} via Supabase Edge Functions:`, dateRange, 'filtro:', searchTerm);

      await this.checkServiceAvailability();
      
      console.log('🔄 Usando Supabase Edge Functions para estatísticas');
      
      const requestBody = {
        action: 'stats',
        account: accountKey,
        dateRange,
        searchTerm
      };
      
      const { data, error } = await supabase.functions.invoke('google-ads-api', {
        body: requestBody,
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
        const errorMsg = data.error || 'Erro ao buscar estatísticas';
        console.error('❌ Erro da Edge Function - estatísticas:', data);
        throw new Error(`API Google Ads: ${errorMsg}`);
      }

      console.log('✅ Estatísticas obtidas via Supabase');
      return data.data;
    } catch (error) {
      console.error(`❌ Erro ao buscar estatísticas Google Patrocinado ${accountKey}:`, error);
      throw new Error(`Falha ao obter estatísticas: ${error.message}`);
    }
  }

  // Método adaptado para compatibilidade com o padrão do sistema
  async getGoogleAdsStatsAdapted(unidadeNome, accountKey = 'ACCOUNT_1') {
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

      console.log(`Buscando estatísticas adaptadas Google Patrocinado ${accountKey}:`, {
        dateRange,
        unidadeNome,
        searchTerm
      });

      return await this.getGoogleAdsStats(dateRange, searchTerm, accountKey);
    } catch (error) {
      console.error(`Erro ao buscar estatísticas adaptadas Google Patrocinado ${accountKey}:`, error);
      throw error;
    }
  }

  // Método para buscar de todas as contas configuradas
  async getAllCampaigns() {
    const configuredAccounts = getConfiguredGoogleAdsAccounts();
    const allCampaigns = [];

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
  async getAllCampaignsWithMetrics(dateRange) {
    console.log('🚀 FRONTEND: getAllCampaignsWithMetrics CHAMADO - Google Patrocinado Supabase Edge Functions!');
    console.log('📅 FRONTEND: Período solicitado:', dateRange);
    
    const configuredAccounts = getConfiguredGoogleAdsAccounts();
    const allCampaigns = [];

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
  async getAllGoogleAdsStats(dateRange, searchTerm) {
    const configuredAccounts = getConfiguredGoogleAdsAccounts();
    
    console.log(`Agregando estatísticas de ${configuredAccounts.length} contas configuradas`);

    let totalStats = {
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
  async testAllConnections() {
    const configuredAccounts = getConfiguredGoogleAdsAccounts();
    const results = {};

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

  // Método utilitário para obter nome da conta
  getAccountName(accountKey) {
    const accounts = getConfiguredGoogleAdsAccounts();
    const account = accounts.find(acc => acc.key === accountKey);
    return account ? account.name : accountKey;
  }

  // Método para formatar moeda
  formatCurrency(value) {
    if (typeof value !== 'number') return 'R$ 0,00';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  }

  // Método para formatar números
  formatNumber(value) {
    if (typeof value !== 'number') return '0';
    return new Intl.NumberFormat('pt-BR').format(value);
  }

  // Método para calcular CTR
  calculateCTR(clicks, impressions) {
    if (!impressions || impressions === 0) return 0;
    return ((clicks / impressions) * 100);
  }

  // Método para calcular CPC médio
  calculateCPC(cost, clicks) {
    if (!clicks || clicks === 0) return 0;
    return cost / clicks;
  }

  // Método para converter micros para valor real
  convertMicrosToReal(micros) {
    return micros / 1000000;
  }
}

export const googlePatrocinadoService = new GooglePatrocinadoService();
export default googlePatrocinadoService;
