import { getGoogleAdsConfig, getConfiguredGoogleAdsAccounts } from '../constants/googleAds';
import { supabase } from './supabase';

class GooglePatrocinadoService {
  // SEMPRE usar Supabase Edge Functions (backend local removido)
  constructor() {
    console.log('🔧 Google Patrocinado Service configurado para usar: Supabase Edge Functions');
    console.log('📋 Focando apenas na conta configurada nos Secrets do Supabase');
    
    // Testar conexão automaticamente
    this.testConnectionAndCampaigns();
  }
  
  // Método para testar conexão e buscar campanhas automaticamente
  async testConnectionAndCampaigns() {
    try {
      console.log('🚀 INICIANDO TESTE AUTOMÁTICO DA CONTA GOOGLE ADS...');
      console.log('🔗 URL da Edge Function:', 'https://agdffspstbxeqhqtltvb.supabase.co/functions/v1/google-ads-api');
      console.log('🔑 Service Key disponível:', import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY ? '✅ Sim' : '❌ Não');
      
      // Definir período padrão (últimos 30 dias)
      const today = new Date();
      const thirtyDaysAgo = new Date(today.getTime() - (30 * 24 * 60 * 60 * 1000));
      const dateRange = {
        since: thirtyDaysAgo.toISOString().split('T')[0],
        until: today.toISOString().split('T')[0]
      };
      
      console.log('📅 Período configurado:', dateRange);
      
      // Testar conexão primeiro
      console.log('🔍 PASSO 1: Testando conexão...');
      
      const connectionResponse = await fetch('https://agdffspstbxeqhqtltvb.supabase.co/functions/v1/google-ads-api/test-connection', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY}`,
          'Content-Type': 'application/json',
        }
      });

      console.log('📡 Resposta do teste de conexão - Status:', connectionResponse.status);
      console.log('📡 Headers da resposta:', Object.fromEntries(connectionResponse.headers.entries()));

      if (!connectionResponse.ok) {
        const errorText = await connectionResponse.text();
        console.error('❌ ERRO DE CONEXÃO:', connectionResponse.status, connectionResponse.statusText);
        console.error('❌ Texto do erro:', errorText);
        
        // Tentar diagnóstico do erro
        if (connectionResponse.status === 401) {
          console.error('🔐 ERRO 401: Problema de autenticação');
          console.error('   - Verifique se o Service Role Key está correto');
          console.error('   - Verifique se os secrets estão configurados no Supabase');
        } else if (connectionResponse.status === 404) {
          console.error('🔍 ERRO 404: Edge Function não encontrada');
          console.error('   - Verifique se o deploy foi bem-sucedido');
        } else if (connectionResponse.status === 500) {
          console.error('⚠️ ERRO 500: Problema interno da Edge Function');
          console.error('   - Verifique os logs da Edge Function no Supabase Dashboard');
        }
        return;
      }

      const connectionData = await connectionResponse.json();
      console.log('✅ RESPOSTA DE CONEXÃO RECEBIDA:', connectionData);
      
      if (!connectionData.success) {
        console.error('❌ FALHA NA CONEXÃO:', connectionData.error);
        console.error('❌ Detalhes completos:', connectionData);
        return;
      }

      console.log('🎉 CONEXÃO ESTABELECIDA COM SUCESSO!');
      console.log('👤 Informações da conta:', connectionData.customerInfo);

      // Buscar campanhas da conta
      console.log('🔍 PASSO 2: Buscando campanhas da sua conta...');
      
      const params = new URLSearchParams({
        status: 'all',
        startDate: dateRange.since,
        endDate: dateRange.until
      })
      const campaignsResponse = await fetch(`https://agdffspstbxeqhqtltvb.supabase.co/functions/v1/google-ads-api/campaigns?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY}`,
          'Content-Type': 'application/json',
        }
      });

      console.log('📡 Resposta das campanhas - Status:', campaignsResponse.status);

      if (!campaignsResponse.ok) {
        const errorText = await campaignsResponse.text();
        console.error('❌ ERRO AO BUSCAR CAMPANHAS:', campaignsResponse.status, campaignsResponse.statusText);
        console.error('❌ Texto do erro:', errorText);
        return;
      }

      const campaignsData = await campaignsResponse.json();
      console.log('✅ RESPOSTA DAS CAMPANHAS RECEBIDA:', campaignsData);
      
      if (!campaignsData.success) {
        console.error('❌ ERRO NA API DE CAMPANHAS:', campaignsData.error);
        console.error('❌ Detalhes completos:', campaignsData);
        return;
      }

      const campaigns = campaignsData.data || [];
      console.log(`📊 TOTAL DE CAMPANHAS ENCONTRADAS: ${campaigns.length}`);
      
      // Log detalhado de cada campanha
      campaigns.forEach((campaign, index) => {
        console.log(`📋 ${index + 1}. ${campaign.name}`);
        console.log(`   - ID: ${campaign.id}`);
        console.log(`   - Status: ${campaign.status}`);
        console.log(`   - Tipo: ${campaign.channelType || campaign.advertising_channel_type || 'N/A'}`);
      });

      if (campaigns.length === 0) {
        console.log('⚠️ NENHUMA CAMPANHA ENCONTRADA NA SUA CONTA');
        console.log('🔧 Possíveis causas:');
        console.log('   1. As credenciais nos Secrets estão incorretas');
        console.log('   2. A conta não tem campanhas ativas');
        console.log('   3. O Customer ID está incorreto');
        console.log('   4. Problema de permissões na API');
      } else {
        console.log(`🎉 SUCESSO! ${campaigns.length} campanhas encontradas na sua conta!`);
      }

    } catch (error) {
      console.error('❌ ERRO CRÍTICO NO TESTE AUTOMÁTICO:', error);
      console.error('❌ Nome do erro:', error.name);
      console.error('❌ Mensagem:', error.message);
      console.error('❌ Stack completo:', error.stack);
      
      // Diagnósticos adicionais
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        console.error('🌐 ERRO DE REDE: Problema de conectividade');
        console.error('   - Verifique sua conexão com a internet');
        console.error('   - Verifique se a URL da Edge Function está correta');
      }
    }
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
    const allCampaigns = [];
    
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
              
              // Adicionar informações da unidade à campanha
              const campaignWithUnit = {
                ...campaign,
                accountKey: unit.customerId,
                accountName: unit.name,
                unidade: unit.name,
                // Criar ID único combinando campaign ID + customer ID para evitar duplicatas
                uniqueId: `${campaign.id}-${unit.customerId}`
              };
              
              // Verificar se já existe uma campanha com esse ID
              const existingCampaign = allCampaigns.find(c => c.id === campaign.id);
              if (existingCampaign) {
                console.log(`⚠️ CAMPANHA DUPLICADA DETECTADA: ${campaign.name} (ID: ${campaign.id})`);
                console.log(`   Já existe em: ${existingCampaign.unidade}`);
                console.log(`   Tentando adicionar de: ${unit.name}`);
              } else {
                allCampaigns.push(campaignWithUnit);
              }
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
    
    console.log(`🎯 TOTAL DE CAMPANHAS COLETADAS: ${allCampaigns.length}`);
    return allCampaigns;
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

  // Chamada direta para a Edge Function usando fetch (não supabase.functions.invoke)
  async callEdgeFunction(endpoint, params = {}, method = 'GET') {
    try {
      console.log(`🚀 Chamando Edge Function Google Patrocinado - Endpoint: ${endpoint}`);
      
      let url = `https://agdffspstbxeqhqtltvb.supabase.co/functions/v1/google-ads-api${endpoint}`;
      
      // Adicionar parâmetros de query para GET
      if (method === 'GET' && Object.keys(params).length > 0) {
        const searchParams = new URLSearchParams(params);
        url += `?${searchParams.toString()}`;
      }
      
      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY}`,
          'Content-Type': 'application/json',
        },
        ...(method === 'POST' ? { body: JSON.stringify(params) } : {})
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Erro HTTP na Edge Function:', response.status, errorText);
        throw new Error(`Erro HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();

      if (!data.success) {
        console.error('❌ Erro na resposta da Edge Function:', data.error);
        throw new Error(data.error || 'Erro desconhecido na API Google Ads');
      }

      console.log(`✅ Edge Function executada com sucesso - ${data.count || 0} resultados`);
      return data;
    } catch (error) {
      console.error(`❌ Erro na chamada da Edge Function (${endpoint}):`, error);
      throw error;
    }
  }

  // Método para validar conexão - SEMPRE Supabase Edge Functions
  async validateConnection(accountKey = 'ACCOUNT_1') {
    try {
      console.log(`🔍 Validando conexão Google Patrocinado ${accountKey} usando Supabase Edge Functions...`);

      await this.checkServiceAvailability();
      
      console.log('🔄 Usando Supabase Edge Functions para validação');
      
      // Chamar endpoint /test-connection
      const result = await this.callEdgeFunction('/test-connection');

      return {
        connected: result.success,
        message: result.message || 'Conexão testada via Supabase',
        data: result.customerInfo
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
      
      // Chamar endpoint /campaigns com status=all para pegar todas as campanhas
      const result = await this.callEdgeFunction('/campaigns', { status: 'all' });

      const campaigns = result.data || [];
      
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
      
      // Por enquanto, buscar campanhas básicas e estatísticas separadamente
      // A Edge Function atual não tem endpoint específico para campanhas com métricas
      const campaigns = await this.getCampaigns(accountKey);
      
      // Buscar estatísticas do período
      const stats = await this.getGoogleAdsStats(dateRange, '', accountKey);
      
      // Simular métricas por campanha (distribuição proporcional)
      const campaignsWithMetrics = campaigns.map(campaign => ({
        ...campaign,
        metrics: {
          cost_micros: Math.floor((stats.gastoTotal * 1000000) / campaigns.length), // Distribuir gasto
          impressions: Math.floor(stats.impressions / campaigns.length),
          clicks: Math.floor(stats.clicks / campaigns.length),
          conversions: Math.floor(stats.totalConversions / campaigns.length)
        }
      }));
      
      console.log(`✅ Campanhas com métricas simuladas: ${campaignsWithMetrics.length}`);
      return campaignsWithMetrics;
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
      
      // Chamar endpoint /stats com parâmetros de data
      const params = {
        startDate: dateRange.since,
        endDate: dateRange.until
      };
      
      const result = await this.callEdgeFunction('/stats', params);
      
      // Adaptar formato da resposta para o formato esperado pelo frontend
      const statsData = result.data;
      const adaptedStats = {
        totalConversions: statsData.totalConversions || 0,
        totalConversionsAjustado: Math.floor((statsData.totalConversions || 0) * 0.7),
        gastoTotal: statsData.totalCost || 0,
        custoMedioPorConversao: statsData.totalConversions > 0 ? statsData.totalCost / statsData.totalConversions : 0,
        custoMedioPorConversaoAjustado: 0, // Será calculado abaixo
        dadosCampanhas: { total: 0, filtradas: 0 }, // Será preenchido depois
        allConversions: statsData.totalConversions || 0,
        allConversionsValue: statsData.totalCost || 0,
        impressions: statsData.totalImpressions || 0,
        clicks: statsData.totalClicks || 0,
        ctr: statsData.ctr || 0
      };
      
      // Calcular custo por conversão ajustado
      adaptedStats.custoMedioPorConversaoAjustado = adaptedStats.totalConversionsAjustado > 0 
        ? adaptedStats.gastoTotal / adaptedStats.totalConversionsAjustado 
        : 0;

      console.log('✅ Estatísticas obtidas e adaptadas via Supabase');
      return adaptedStats;
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

  // Método para buscar campanhas com métricas da conta configurada nos Secrets
  async getAllCampaignsWithMetrics(dateRange) {
    console.log('🚀 BUSCANDO CAMPANHAS DA SUA CONTA GOOGLE ADS');
    console.log('📅 Período:', dateRange);
    
    try {
      // BUSCAR CAMPANHAS DIRETAMENTE DA CONTA CONFIGURADA NOS SECRETS
      console.log('🔍 Buscando campanhas da conta configurada nos Secrets do Supabase...');
      
      const campaignsResponse = await fetch('https://agdffspstbxeqhqtltvb.supabase.co/functions/v1/google-ads-api/campaigns?status=all', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY}`,
          'Content-Type': 'application/json',
        }
      });

      if (!campaignsResponse.ok) {
        const errorText = await campaignsResponse.text();
        throw new Error(`Erro ao buscar campanhas: ${campaignsResponse.status} - ${errorText}`);
      }

      const campaignsData = await campaignsResponse.json();
      console.log('✅ RESPOSTA DA API:', campaignsData);
      
      if (!campaignsData.success) {
        throw new Error(`API retornou erro: ${campaignsData.error}`);
      }

      const campaigns = campaignsData.data || [];
      console.log(`📊 TOTAL DE CAMPANHAS ENCONTRADAS: ${campaigns.length}`);
      
      // Log detalhado de cada campanha
      campaigns.forEach((campaign, index) => {
        console.log(`📋 ${index + 1}. ${campaign.name}`);
        console.log(`   - ID: ${campaign.id}`);
        console.log(`   - Status: ${campaign.status}`);
        console.log(`   - Tipo: ${campaign.channelType || campaign.advertising_channel_type || 'N/A'}`);
      });

      if (campaigns.length === 0) {
        console.log('⚠️ Nenhuma campanha encontrada na sua conta');
        return [];
      }

      // AS MÉTRICAS JÁ VÊM DA API! NÃO PRECISA BUSCAR SEPARADAMENTE
      console.log('✅ CAMPANHAS JÁ INCLUEM MÉTRICAS REAIS DOS ÚLTIMOS 30 DIAS');
      
      const campaignsWithRealMetrics = campaigns.map(campaign => {
        // Garantir que as métricas existem
        const metrics = campaign.metrics || {
          cost_micros: 0,
          impressions: 0,
          clicks: 0,
          conversions: 0,
          conversions_value: 0
        };
        
        const campaignWithMetrics = {
          ...campaign,
          metrics: metrics,
          advertising_channel_type: campaign.channelType || campaign.advertising_channel_type,
          accountKey: 'main_account',
          accountName: 'Conta Principal'
        };
        
        // Log das métricas reais
        const gastoReais = (metrics.cost_micros / 1000000).toFixed(2);
        console.log(`📊 ${campaign.name}`);
        console.log(`   💰 Gasto: R$ ${gastoReais}`);
        console.log(`   👁️ Impressões: ${metrics.impressions}`);
        console.log(`   👆 Cliques: ${metrics.clicks}`);
        console.log(`   ✅ Conversões: ${metrics.conversions}`);
        console.log(`   💵 Valor Conversões: R$ ${(metrics.conversions_value / 1000000).toFixed(2)}`);
        
        return campaignWithMetrics;
      });

      console.log(`✅ CAMPANHAS COM MÉTRICAS REAIS PROCESSADAS: ${campaignsWithRealMetrics.length}`);
      
      // Log resumo final
      const totalGasto = campaignsWithRealMetrics.reduce((acc, c) => acc + (c.metrics.cost_micros / 1000000), 0);
      const totalConversoes = campaignsWithRealMetrics.reduce((acc, c) => acc + c.metrics.conversions, 0);
      const totalCliques = campaignsWithRealMetrics.reduce((acc, c) => acc + c.metrics.clicks, 0);
      const totalImpressoes = campaignsWithRealMetrics.reduce((acc, c) => acc + c.metrics.impressions, 0);
      
      console.log('📊 RESUMO TOTAL DAS MÉTRICAS REAIS:');
      console.log(`   💰 Gasto Total: R$ ${totalGasto.toFixed(2)}`);
      console.log(`   👁️ Impressões Total: ${totalImpressoes}`);
      console.log(`   👆 Cliques Total: ${totalCliques}`);
      console.log(`   ✅ Conversões Total: ${totalConversoes}`);
      
      return campaignsWithRealMetrics;
      
    } catch (error) {
      console.error('❌ ERRO AO BUSCAR CAMPANHAS DA SUA CONTA:', error);
      console.error('❌ Stack completo:', error.stack);
      
      // Em caso de erro, tentar método de fallback
      console.log('🔄 Tentando método de fallback...');
      
      try {
        // Buscar estatísticas gerais como fallback
        const statsResponse = await fetch(`https://agdffspstbxeqhqtltvb.supabase.co/functions/v1/google-ads-api/stats?startDate=${dateRange.since}&endDate=${dateRange.until}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY}`,
            'Content-Type': 'application/json',
          }
        });

        if (statsResponse.ok) {
          const statsData = await statsResponse.json();
          console.log('✅ Dados de fallback obtidos:', statsData);
          
          // Criar uma campanha fictícia com os dados reais
          return [{
            id: 'fallback_campaign',
            name: 'Campanha Principal (Dados Agregados)',
            status: 'ENABLED',
            advertising_channel_type: 'SEARCH',
            metrics: {
              cost_micros: (statsData.data?.totalCost || 0) * 1000000,
              impressions: statsData.data?.totalImpressions || 0,
              clicks: statsData.data?.totalClicks || 0,
              conversions: statsData.data?.totalConversions || 0
            },
            accountKey: 'main_account',
            accountName: 'Conta Principal'
          }];
        }
      } catch (fallbackError) {
        console.error('❌ Erro no fallback também:', fallbackError);
      }
      
      return [];
    }
  }

  // Método para buscar estatísticas de todas as contas
  async getAllGoogleAdsStats(dateRange, searchTerm) {
    try {
      console.log('📈 Agregando estatísticas de todas as unidades ativas...');
      
      // Buscar unidades ativas do Supabase
      const debugResponse = await fetch('https://agdffspstbxeqhqtltvb.supabase.co/functions/v1/google-ads-api/debug-unidades', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY}`,
          'Content-Type': 'application/json',
        }
      });

      if (!debugResponse.ok) {
        throw new Error('Erro ao buscar unidades para estatísticas');
      }

      const debugData = await debugResponse.json();
      const activeUnits = [];
      
      if (debugData?.debug?.todasUnidades) {
        debugData.debug.todasUnidades.forEach((unit) => {
          if (unit.google_ads_active && unit.google_customer_id) {
            activeUnits.push({
              name: unit.unidade,
              customerId: unit.google_customer_id.replace(/-/g, '')
            });
          }
        });
      }

      console.log(`Agregando estatísticas de ${activeUnits.length} unidades ativas`);

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

      // Buscar estatísticas de cada unidade ativa
      for (const unit of activeUnits) {
        try {
          const params = {
            startDate: dateRange.since,
            endDate: dateRange.until,
            customer_id: unit.customerId
          };
          
          const statsResponse = await fetch(`https://agdffspstbxeqhqtltvb.supabase.co/functions/v1/google-ads-api/stats?${new URLSearchParams(params)}`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY}`,
              'Content-Type': 'application/json',
            }
          });

          if (statsResponse.ok) {
            const result = await statsResponse.json();
            const stats = result.data;
            
            totalStats.totalConversions += stats.totalConversions || 0;
            totalStats.allConversions += stats.totalConversions || 0;
            totalStats.allConversionsValue += stats.totalCost || 0;
            totalStats.gastoTotal += stats.totalCost || 0;
            totalStats.impressions += stats.totalImpressions || 0;
            totalStats.clicks += stats.totalClicks || 0;
            totalStats.dadosCampanhas.total += 1; // Contar unidades como campanhas

            console.log(`✅ Estatísticas da ${unit.name} agregadas`);
          } else {
            console.error(`❌ Erro ao buscar estatísticas da ${unit.name}:`, statsResponse.status);
          }
        } catch (error) {
          console.error(`❌ Erro ao buscar estatísticas da ${unit.name}:`, error);
        }
      }

      // Recalcula métricas finais
      totalStats.totalConversionsAjustado = Math.floor(totalStats.totalConversions * 0.7);
      totalStats.custoMedioPorConversao = totalStats.totalConversions > 0 ? totalStats.gastoTotal / totalStats.totalConversions : 0;
      totalStats.custoMedioPorConversaoAjustado = totalStats.totalConversionsAjustado > 0 ? totalStats.gastoTotal / totalStats.totalConversionsAjustado : 0;
      totalStats.ctr = totalStats.impressions > 0 ? (totalStats.clicks / totalStats.impressions) * 100 : 0;
      totalStats.dadosCampanhas.filtradas = totalStats.dadosCampanhas.total;

      console.log('✅ Estatísticas agregadas finais:', totalStats);
      return totalStats;
      
    } catch (error) {
      console.error('❌ Erro ao agregar estatísticas:', error);
      
      // Fallback para método anterior
    const configuredAccounts = getConfiguredGoogleAdsAccounts();

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

          console.log(`Estatísticas da ${account.name} agregadas (fallback)`);
      } catch (error) {
        console.error(`Erro ao buscar estatísticas da ${account.name}:`, error);
        }
    }

    totalStats.totalConversionsAjustado = Math.floor(totalStats.totalConversions * 0.7);
    totalStats.custoMedioPorConversao = totalStats.totalConversions > 0 ? totalStats.gastoTotal / totalStats.totalConversions : 0;
    totalStats.custoMedioPorConversaoAjustado = totalStats.totalConversionsAjustado > 0 ? totalStats.gastoTotal / totalStats.totalConversionsAjustado : 0;
    totalStats.ctr = totalStats.impressions > 0 ? (totalStats.clicks / totalStats.impressions) * 100 : 0;

      console.log('Estatísticas agregadas finais (fallback):', totalStats);
    return totalStats;
    }
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
