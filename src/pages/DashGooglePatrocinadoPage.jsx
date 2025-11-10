import React, { useState, useEffect } from 'react';
import './DashboardPage.css';
import './DashboardPageFunnel.css';
import './GooglePatrocinadoPage.css';
import FilterBar from '../components/FilterBar';
import TopMenuBar from '../components/TopMenuBar';
import Sidebar from '../components/Sidebar';
import GooglePatrocinadoDashboard from '../components/google_patrocinado/GooglePatrocinadoDashboard';
import GooglePatrocinadoStats from '../components/google_patrocinado/GooglePatrocinadoStats';
import GooglePatrocinadoFilters from '../components/google_patrocinado/GooglePatrocinadoFilters';
import { googlePatrocinadoService } from '../service/googlePatrocinadoService';
import { translations } from '../data/translations';
import {
  formatCurrency,
  updateMarketData,
  fetchUsdRate,
  handleDatePreset
} from '../utils/utils';
import { supabaseAnonKey } from '../config/supabase.js';

// Importar bandeiras
import BandeiraEUA from '../../icones/eua.svg';
import BandeiraBrasil from '../../icones/brasil.svg';

const DashGooglePatrocinadoPage = ({ onLogout }) => {
  // Estados para o dashboard
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [showCalendar, setShowCalendar] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState('pt-BR');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [usdRate, setUsdRate] = useState(5.0);
  const [isLoadingRate, setIsLoadingRate] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('sale');
  const [selectedSeller, setSelectedSeller] = useState('all');
  const [selectedSellerName, setSelectedSellerName] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState('last7Days');
  const [selectedFunnel, setSelectedFunnel] = useState('all');
  const [selectedUnit, setSelectedUnit] = useState('[1]');
  const [selectedOrigin, setSelectedOrigin] = useState('all');
  const [unitFilterValue, setUnitFilterValue] = useState(null);
  const [statusFilterValue, setStatusFilterValue] = useState(null);
  const [marketData, setMarketData] = useState({
    usd: 5.20,
    eur: 5.45,
    ibov: 125432,
    lastUpdate: new Date()
  });

  // Estados específicos do Google Patrocinado
  const [campaigns, setCampaigns] = useState([]);
  const [filteredCampaigns, setFilteredCampaigns] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [googlePatrocinadoStats, setGooglePatrocinadoStats] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAccount, setSelectedAccount] = useState('all');
  const [selectedCampaignStatus, setSelectedCampaignStatus] = useState('all');
  const [selectedCampaignType, setSelectedCampaignType] = useState('all');
  const [accounts, setAccounts] = useState([]);
  const [campaignTypes, setCampaignTypes] = useState([]);

  // Traduções
  const t = translations[currentLanguage];

  // Definir período padrão (últimos 30 dias)
  const getDefaultDateRange = () => {
    const today = new Date();
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 30);
    
    return {
      since: thirtyDaysAgo.toISOString().split('T')[0],
      until: today.toISOString().split('T')[0]
    };
  };

  const [dateRange, setDateRange] = useState(getDefaultDateRange());

  // Carregar dados iniciais REAIS da Google Ads API
  useEffect(() => {
    const initializePage = async () => {
      try {
        setIsLoading(true);
        setError(null);

        console.log('🚀 INICIANDO TESTE AUTOMÁTICO DA CONTA GOOGLE ADS...');
        console.log('🔗 URL da Edge Function:', 'https://agdffspstbxeqhqtltvb.supabase.co/functions/v1/google-ads-api');
        console.log('🔑 Anon key disponível:', supabaseAnonKey ? '✅ Sim' : '❌ Não');

        // PASSO 1: Testar conexão
        console.log('🔍 PASSO 1: Testando conexão...');
        await testConnection();

        // PASSO 2: Carregar campanhas reais
        console.log('🔍 PASSO 2: Buscando campanhas da sua conta...');
        await loadCampaignsWithMetrics();
        
        // PASSO 3: Carregar contas disponíveis
        console.log('🔍 PASSO 3: Carregando contas disponíveis...');
        await loadAccounts();

        console.log('✅ PÁGINA: Dash Google Patrocinado Page inicializada com dados REAIS da API');
      } catch (error) {
        console.error('❌ PÁGINA: Erro ao inicializar Dash Google Patrocinado Page:', error);
        setError(error.message || 'Erro ao carregar dados');
      } finally {
        setIsLoading(false);
      }
    };

    // Aguardar um pouco para garantir que o serviço foi inicializado
    setTimeout(initializePage, 1000);
  }, []);

  // Testar conexão com a Google Ads API
  const testConnection = async () => {
    try {
      const connectionResponse = await fetch('https://agdffspstbxeqhqtltvb.supabase.co/functions/v1/google-ads-api/test-connection', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'Content-Type': 'application/json',
        }
      });

      console.log('📡 Resposta do teste de conexão - Status:', connectionResponse.status);

      if (!connectionResponse.ok) {
        const errorText = await connectionResponse.text();
        throw new Error(`Erro de conexão: ${connectionResponse.status} - ${errorText}`);
      }

      const connectionData = await connectionResponse.json();
      console.log('✅ RESPOSTA DE CONEXÃO RECEBIDA:', connectionData);
      
      if (!connectionData.success) {
        throw new Error(`Falha na conexão: ${connectionData.error}`);
      }

      console.log('🎉 CONEXÃO ESTABELECIDA COM SUCESSO!');
      console.log('👤 Informações da conta:', connectionData.customerInfo);
      
    } catch (error) {
      console.error('❌ ERRO CRÍTICO NO TESTE AUTOMÁTICO:', error);
      console.error('❌ Nome do erro:', error.name);
      console.error('❌ Mensagem:', error.message);
      console.error('❌ Stack completo:', error.stack);
      throw error;
    }
  };

  // Carregar campanhas com métricas REAIS da Edge Function
  const loadCampaignsWithMetrics = async () => {
    try {
      console.log('🚀 CARREGANDO CAMPANHAS REAIS DA GOOGLE ADS API...');
      console.log('📅 Período:', dateRange);
      
      // USAR A MESMA LÓGICA QUE FUNCIONOU NO CONSOLE
      const params = new URLSearchParams({
        status: 'all',
        startDate: dateRange.since,
        endDate: dateRange.until
      });

      console.log('🔗 URL da API:', `https://agdffspstbxeqhqtltvb.supabase.co/functions/v1/google-ads-api/campaigns?${params.toString()}`);
      
      const campaignsResponse = await fetch(
        `https://agdffspstbxeqhqtltvb.supabase.co/functions/v1/google-ads-api/campaigns?${params.toString()}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${supabaseAnonKey}`,
            'Content-Type': 'application/json',
          }
        }
      );

      if (!campaignsResponse.ok) {
        const errorText = await campaignsResponse.text();
        throw new Error(`Erro ao buscar campanhas: ${campaignsResponse.status} - ${errorText}`);
      }

      const campaignsData = await campaignsResponse.json();
      console.log('✅ RESPOSTA DA API GOOGLE ADS:', campaignsData);
      
      if (!campaignsData.success) {
        throw new Error(`API retornou erro: ${campaignsData.error}`);
      }

      const campaigns = campaignsData.data || [];
      console.log(`📊 TOTAL DE CAMPANHAS REAIS ENCONTRADAS: ${campaigns.length}`);
      console.log('📊 Dados brutos:', JSON.stringify(campaigns, null, 2));
      
      // Log detalhado de cada campanha (igual ao console)
      campaigns.forEach((campaign, index) => {
        console.log(`📋 ${index + 1}. ${campaign.name}`);
        console.log(`   - ID: ${campaign.id}`);
        console.log(`   - Status: ${campaign.status}`);
        console.log(`   - Tipo: ${campaign.type || campaign.channelType || campaign.advertising_channel_type || 'N/A'}`);
        if (campaign.metrics) {
          console.log(`   - Impressões: ${campaign.metrics.impressions}`);
          console.log(`   - Cliques: ${campaign.metrics.clicks}`);
          console.log(`   - CTR: ${campaign.metrics.ctr}`);
          console.log(`   - CPC: ${campaign.metrics.average_cpc}`);
          console.log(`   - Gasto (micros): ${campaign.metrics.cost_micros}`);
          console.log(`   - Gasto (reais): ${(campaign.metrics.cost_micros || 0) / 1000000}`);
          console.log(`   - Conversões: ${campaign.metrics.conversions}`);
          console.log(`   - Valor Conversões: ${campaign.metrics.conversions_value}`);
          
          // Debug específico para custos
          console.log(`💰 DEBUG CUSTOS - ${campaign.name}:`, {
            cost_micros: campaign.metrics.cost_micros,
            cost_micros_type: typeof campaign.metrics.cost_micros,
            cost_reais: (campaign.metrics.cost_micros || 0) / 1000000,
            cost_micros_raw: campaign.metrics.cost_micros,
            average_cpc: campaign.metrics.average_cpc,
            clicks: campaign.metrics.clicks,
            metrics_complete: campaign.metrics
          });
          console.log(`💰 DEBUG CUSTOS DETALHADO - ${campaign.name}:`, JSON.stringify(campaign.metrics, null, 2));
          
          // Debug adicional para investigar custos zerados
          if (campaign.metrics.cost_micros === 0 && campaign.metrics.clicks > 0) {
            console.log(`⚠️ INVESTIGAÇÃO CUSTO ZERO - ${campaign.name}:`, {
              tem_cliques: campaign.metrics.clicks > 0,
              tem_impressoes: campaign.metrics.impressions > 0,
              cost_micros_zero: campaign.metrics.cost_micros === 0,
              average_cpc: campaign.metrics.average_cpc,
              possivel_causa: 'Conta pode estar em modo teste ou sem dados de custo no período'
            });
          }
        }
      });

      // Mapear campanhas para o formato esperado pelo frontend
      const mappedCampaigns = campaigns.map((campaign, index) => ({
        ...campaign,
        uniqueId: `${campaign.id}-${index}`,
        accountKey: 'ACCOUNT_1', // Conta configurada nos secrets
        accountName: 'Apucarana (Google Ads)',
        advertising_channel_type: campaign.type || campaign.channelType || campaign.advertising_channel_type || 'SEARCH',
        channelType: campaign.type || campaign.channelType || campaign.advertising_channel_type || 'SEARCH'
      }));

      setCampaigns(mappedCampaigns);
      console.log(`✅ ${mappedCampaigns.length} campanhas reais carregadas na interface`);
      console.log('✅ Campanhas mapeadas:', JSON.stringify(mappedCampaigns, null, 2));

      // Extrair tipos de campanha únicos
      const types = [...new Set(mappedCampaigns.map(c => c.advertising_channel_type || c.channelType).filter(Boolean))];
      setCampaignTypes(types);
      console.log('🏷️ Tipos de campanha encontrados:', types);

      // Carregar estatísticas
      await loadStatistics();

      // Testar custos com período mais amplo para debug
      await testCostsWithWiderRange();
    } catch (error) {
      console.error('❌ Erro ao carregar campanhas reais:', error);
      console.error('❌ Detalhes completos:', error);
      setError(error.message || 'Erro ao carregar campanhas');
      throw error;
    }
  };

  // Função para testar custos com período mais amplo
  const testCostsWithWiderRange = async () => {
    try {
      console.log('🔍 TESTANDO CUSTOS COM PERÍODO MAIS AMPLO...');
      
      // Testar com período de 90 dias para ver se há custos
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
      const today = new Date();
      
      const testParams = new URLSearchParams({
        status: 'all',
        startDate: ninetyDaysAgo.toISOString().split('T')[0],
        endDate: today.toISOString().split('T')[0]
      });

      console.log('🔗 Testando URL:', `https://agdffspstbxeqhqtltvb.supabase.co/functions/v1/google-ads-api/campaigns?${testParams.toString()}`);
      
      const testResponse = await fetch(
        `https://agdffspstbxeqhqtltvb.supabase.co/functions/v1/google-ads-api/campaigns?${testParams.toString()}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${supabaseAnonKey}`,
            'Content-Type': 'application/json',
          }
        }
      );

      if (testResponse.ok) {
        const testData = await testResponse.json();
        if (testData.success && testData.data) {
          console.log('📊 TESTE DE CUSTOS - 90 DIAS:');
          testData.data.forEach((campaign, index) => {
            if (campaign.metrics && campaign.metrics.cost_micros > 0) {
              console.log(`✅ ${campaign.name}: R$ ${(campaign.metrics.cost_micros / 1000000).toFixed(2)}`);
            } else {
              console.log(`❌ ${campaign.name}: R$ 0,00`);
            }
          });
        }
      }
    } catch (error) {
      console.error('❌ Erro no teste de custos:', error);
    }
  };

  // Carregar estatísticas REAIS da Edge Function
  const loadStatistics = async () => {
    try {
      console.log('📈 CARREGANDO ESTATÍSTICAS REAIS DA GOOGLE ADS API...');
      console.log('📅 Período:', dateRange);
      
      // USAR A MESMA LÓGICA QUE FUNCIONOU NO CONSOLE
      const params = new URLSearchParams({
        startDate: dateRange.since,
        endDate: dateRange.until
      });

      console.log('🔗 URL da API Stats:', `https://agdffspstbxeqhqtltvb.supabase.co/functions/v1/google-ads-api/stats?${params.toString()}`);
      
      const statsResponse = await fetch(
        `https://agdffspstbxeqhqtltvb.supabase.co/functions/v1/google-ads-api/stats?${params.toString()}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${supabaseAnonKey}`,
            'Content-Type': 'application/json',
          }
        }
      );

      if (!statsResponse.ok) {
        const errorText = await statsResponse.text();
        console.warn(`⚠️ Erro ao buscar estatísticas: ${statsResponse.status} - ${errorText}`);
        return;
      }

      const statsData = await statsResponse.json();
      console.log('✅ RESPOSTA DAS ESTATÍSTICAS:', statsData);
      console.log('📊 Dados brutos das estatísticas:', JSON.stringify(statsData, null, 2));
      
      if (!statsData.success) {
        console.warn(`⚠️ API retornou erro nas estatísticas: ${statsData.error}`);
        return;
      }

      // Mapear estatísticas para o formato esperado pelo frontend
      const mappedStats = {
        // Propriedades para GooglePatrocinadoStats
        gastoTotal: statsData.data?.totalCost || 0, // Já vem em reais da API
        impressions: statsData.data?.totalImpressions || 0,
        clicks: statsData.data?.totalClicks || 0,
        totalConversions: statsData.data?.totalConversions || 0,
        ctr: statsData.data?.ctr || 0,
        cpc: statsData.data?.cpc || 0,
        conversionRate: statsData.data?.conversionRate || 0,
        period: statsData.data?.period || dateRange,
        
        // Propriedades adicionais que podem estar faltando
        totalConversionsAjustado: statsData.data?.totalConversions || 0,
        custoMedioPorConversao: statsData.data?.totalCost > 0 && statsData.data?.totalConversions > 0 
          ? statsData.data.totalCost / statsData.data.totalConversions 
          : 0,
        custoMedioPorConversaoAjustado: statsData.data?.totalCost > 0 && statsData.data?.totalConversions > 0 
          ? statsData.data.totalCost / statsData.data.totalConversions 
          : 0,
        dadosCampanhas: { 
          total: campaigns?.length || 0, 
          filtradas: filteredCampaigns?.length || 0 
        },
        allConversions: statsData.data?.totalConversions || 0,
        allConversionsValue: statsData.data?.totalConversions || 0,
        
        // Manter propriedades originais para compatibilidade
        totalClicks: statsData.data?.totalClicks || 0,
        totalImpressions: statsData.data?.totalImpressions || 0,
        totalCost: statsData.data?.totalCost || 0,
      };

      console.log('💰 DEBUG CUSTOS - Dados da API:', {
        totalCost: statsData.data?.totalCost,
        totalCostType: typeof statsData.data?.totalCost,
        totalCostRaw: statsData.data
      });
      console.log('💰 DEBUG CUSTOS DETALHADO - Dados da API:', JSON.stringify(statsData.data, null, 2));

      setGooglePatrocinadoStats(mappedStats);
      console.log('✅ Estatísticas reais carregadas:', mappedStats);
      console.log('✅ Estatísticas mapeadas:', JSON.stringify(mappedStats, null, 2));
    } catch (error) {
      console.error('❌ Erro ao carregar estatísticas reais:', error);
      console.error('❌ Detalhes completos:', error);
    }
  };

  // Carregar contas disponíveis (conta real configurada nos secrets)
  const loadAccounts = async () => {
    try {
      console.log('🏢 Carregando contas disponíveis...');
      
      // CONTA REAL CONFIGURADA NOS SECRETS DO SUPABASE
      const accountsData = [
        { key: 'ACCOUNT_1', name: 'Apucarana (Google Ads)', active: true }
      ];
      
      setAccounts(accountsData);
      console.log('✅ Contas carregadas:', accountsData);
    } catch (error) {
      console.error('❌ Erro ao carregar contas:', error);
    }
  };

  // Atualizar dados de mercado automaticamente
  useEffect(() => {
    const updateData = async () => {
      const data = await updateMarketData();
      if (data) setMarketData(data);
    };

    updateData();
    const interval = setInterval(updateData, 30000);
    return () => clearInterval(interval);
  }, []);

  // Atualizar horário em tempo real
  useEffect(() => {
    const updateTime = () => {
      const timeElement = document.getElementById('current-time');
      if (timeElement) {
        timeElement.textContent = new Date().toLocaleTimeString('pt-BR', {
          hour: '2-digit',
          minute: '2-digit'
        });
      }
    };

    updateTime();
    const timeInterval = setInterval(updateTime, 60000);
    return () => clearInterval(timeInterval);
  }, []);

  // Buscar cotação do dólar
  useEffect(() => {
    const fetchRate = async () => {
      try {
        setIsLoadingRate(true);
        const rate = await fetchUsdRate();
        setUsdRate(rate);
      } catch (error) {
        console.log('Erro ao buscar cotação, usando taxa padrão:', error);
        setUsdRate(5.0);
      } finally {
        setIsLoadingRate(false);
      }
    };

    fetchRate();
    const interval = setInterval(fetchRate, 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Inicializar datas baseado no período padrão
  useEffect(() => {
    if (selectedPeriod === 'last7Days' && !startDate && !endDate) {
      console.log('🗓️ Inicializando datas para o período padrão:', selectedPeriod);
      const { start, end } = handleDatePreset(selectedPeriod);
      if (start && end) {
        setStartDate(start);
        setEndDate(end);
        console.log('📅 Datas inicializadas para Dash Google Patrocinado:', { start, end });
      } else {
        console.warn('⚠️ Falha ao obter datas do preset:', selectedPeriod);
      }
    }
  }, [selectedPeriod]);

  // Reagir às mudanças de período (igual à DashboardPage)
  useEffect(() => {
    if (selectedPeriod && selectedPeriod !== 'custom') {
      console.log('📅 Dash Google Patrocinado: Período alterado para:', selectedPeriod);
      const { start, end } = handleDatePreset(selectedPeriod);
      if (start && end) {
        console.log('📅 Dash Google Patrocinado: Aplicando datas:', { start, end });
        setStartDate(start);
        setEndDate(end);
        
        // Atualizar dateRange para o Google Ads
        const newDateRange = {
          since: start,
          until: end
        };
        console.log('📅 Dash Google Patrocinado: Atualizando dateRange:', newDateRange);
        setDateRange(newDateRange);
        
        // Recarregar dados com novo período
        setTimeout(() => {
          console.log('🔄 Dash Google Patrocinado: Recarregando campanhas com novo período...');
          loadCampaignsWithMetrics();
        }, 100);
      }
    }
  }, [selectedPeriod]);

  // Debug das datas para o dashboard Google Patrocinado
  useEffect(() => {
    console.log('🔥 Dash Google Patrocinado - Estado das datas:', { startDate, endDate, selectedPeriod });
    console.log('🔥 Dash Google Patrocinado - dateRange atual:', dateRange);
  }, [startDate, endDate, selectedPeriod, dateRange]);

  // Funções de controle

  // 🎯 Função para lidar com mudanças no filtro de unidade
  const handleUnitFilterChange = (filterValue) => {
    setUnitFilterValue(filterValue);
    console.log(`🎯 Dash Google Patrocinado: Filtro de unidade alterado para:`, filterValue);

    if (filterValue) {
      console.log(`🔍 Filtrando leads com unidade_id = "${filterValue}"`);
    } else {
      console.log(`🌐 Mostrando todos os leads (sem filtro de unidade)`);
    }
  };

  // 🎯 Função para lidar com mudanças no filtro de status
  const handleStatusFilterChange = (filterData) => {
    setStatusFilterValue(filterData);
    console.log(`🎯 Dash Google Patrocinado: Filtro de status alterado para:`, filterData);

    console.log(`🔍 Filtrando leads com ${filterData.field} = "${filterData.value}"`);
    console.log(`📝 Descrição: ${filterData.description}`);
  };

  // 🎯 Função para lidar com mudanças no filtro de vendedor
  const handleSellerFilterChange = (filterValue) => {
    console.log(`🎯 Dash Google Patrocinado: Filtro de vendedor alterado para:`, filterValue);

    if (filterValue) {
      console.log(`🔍 Filtrando leads com user_id = "${filterValue}"`);
    } else {
      console.log(`🌐 Mostrando todos os vendedores (sem filtro de vendedor)`);
    }
  };

  // 🎯 Função para lidar com mudanças no filtro de origem
  const handleOriginFilterChange = (filterValue) => {
    console.log(`🎯 Dash Google Patrocinado: Filtro de origem alterado para:`, filterValue);

    if (filterValue) {
      console.log(`🔍 Filtrando leads com origem_oportunidade = "${filterValue}"`);
    } else {
      console.log(`🌐 Mostrando todas as origens (sem filtro de origem)`);
    }
  };

  // Filtrar campanhas baseado nos filtros ativos
  useEffect(() => {
    console.log('🔍 INICIANDO FILTROS DE CAMPANHAS REAIS:');
    console.log('📋 Total de campanhas:', campaigns.length);
    console.log('🔍 Termo de busca:', searchTerm);
    console.log('📊 Status selecionado:', selectedCampaignStatus);
    console.log('🏷️ Tipo selecionado:', selectedCampaignType);
    console.log('🏢 Conta selecionada:', selectedAccount);
    console.log('📅 Período:', dateRange);
    
    let filtered = campaigns;

    // Filtro por termo de busca
    if (searchTerm) {
      const beforeSearch = filtered.length;
      filtered = filtered.filter(campaign =>
        campaign.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      console.log(`🔍 Após filtro de busca "${searchTerm}": ${beforeSearch} → ${filtered.length}`);
    }

    // Filtro por status
    if (selectedCampaignStatus !== 'all') {
      const beforeStatus = filtered.length;
      filtered = filtered.filter(campaign => campaign.status === selectedCampaignStatus);
      console.log(`📊 Após filtro de status "${selectedCampaignStatus}": ${beforeStatus} → ${filtered.length}`);
    }

    // Filtro por tipo de campanha
    if (selectedCampaignType !== 'all') {
      const beforeType = filtered.length;
      filtered = filtered.filter(campaign => 
        campaign.advertising_channel_type === selectedCampaignType || 
        campaign.channelType === selectedCampaignType
      );
      console.log(`🏷️ Após filtro de tipo "${selectedCampaignType}": ${beforeType} → ${filtered.length}`);
    }

    // Filtro por conta
    if (selectedAccount !== 'all') {
      const beforeAccount = filtered.length;
      filtered = filtered.filter(campaign => campaign.accountKey === selectedAccount);
      console.log(`🏢 Após filtro de conta "${selectedAccount}": ${beforeAccount} → ${filtered.length}`);
    }

    setFilteredCampaigns(filtered);
    console.log(`✅ RESULTADO FINAL DOS FILTROS: ${filtered.length} campanhas após todos os filtros`);
    
    if (filtered.length > 0) {
      console.log('📋 Campanhas filtradas:', filtered.map(c => `${c.name} (${c.status})`));
      // Log detalhado das métricas das campanhas filtradas
      filtered.forEach((campaign, index) => {
        console.log(`📊 ${index + 1}. ${campaign.name} - Métricas:`);
        if (campaign.metrics) {
          console.log(`   - Impressões: ${campaign.metrics.impressions}`);
          console.log(`   - Cliques: ${campaign.metrics.clicks}`);
          console.log(`   - CTR: ${campaign.metrics.ctr}`);
          console.log(`   - CPC: ${campaign.metrics.average_cpc}`);
          console.log(`   - Gasto: ${campaign.metrics.cost_micros}`);
          console.log(`   - Conversões: ${campaign.metrics.conversions}`);
        }
      });
    } else {
      console.log('❌ Nenhuma campanha encontrada com os filtros aplicados');
    }

    // Recarregar estatísticas quando as campanhas filtradas mudarem
    setTimeout(() => {
      console.log('🔄 Recarregando estatísticas devido a mudança nas campanhas filtradas...');
      loadStatistics();
    }, 200);
  }, [campaigns, searchTerm, selectedCampaignStatus, selectedCampaignType, selectedAccount, dateRange]);

  // Handlers para filtros
  const handleDateRangeChange = (newDateRange) => {
    console.log('📅 Alterando período de datas:', newDateRange);
    setDateRange(newDateRange);
    // Recarregar dados com novo período
    setTimeout(() => {
      console.log('🔄 Recarregando campanhas com novo período...');
      loadCampaignsWithMetrics();
    }, 100);
  };


  const handleSearchChange = (newSearchTerm) => {
    console.log('🔍 Alterando termo de busca:', newSearchTerm);
    setSearchTerm(newSearchTerm);
  };

  const handleAccountChange = (accountKey) => {
    console.log('🏢 Alterando conta selecionada:', accountKey);
    setSelectedAccount(accountKey);
    // Recarregar dados para nova conta
    setTimeout(() => {
      console.log('🔄 Recarregando campanhas para nova conta...');
      loadCampaignsWithMetrics();
    }, 100);
  };

  const handleStatusChange = (status) => {
    console.log('📊 Alterando status selecionado:', status);
    setSelectedCampaignStatus(status);
  };

  const handleCampaignTypeChange = (type) => {
    console.log('🏷️ Alterando tipo de campanha selecionado:', type);
    setSelectedCampaignType(type);
  };

  const handleRefresh = () => {
    console.log('🔄 Atualizando dados das campanhas...');
    loadCampaignsWithMetrics();
    // Também recarregar estatísticas
    setTimeout(() => {
      loadStatistics();
    }, 500);
  };

  const toggleSidebar = () => {
    // No mobile, alterna o menu mobile
    if (window.innerWidth <= 768) {
      console.log('Toggle mobile menu:', !mobileMenuOpen);
      setMobileMenuOpen(!mobileMenuOpen);
    } else {
      // No desktop, alterna a sidebar
      setSidebarExpanded(!sidebarExpanded);
    }
  };

  const closeMobileMenu = () => setMobileMenuOpen(false);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
    const container = document.querySelector('.dashboard-container');
    if (container) {
      if (isDarkMode) {
        container.classList.add('light-theme');
      } else {
        container.classList.remove('light-theme');
      }
    }
  };

  const changeLanguage = (language) => setCurrentLanguage(language);

  const handleDatePresetChange = (preset) => {
    const { start, end } = handleDatePreset(preset);
    if (start && end) {
      setStartDate(start);
      setEndDate(end);
      setShowCalendar(false);
    }
  };

  const applyCustomDates = () => {
    if (startDate && endDate && startDate <= endDate) {
      setShowCalendar(false);
    }
  };

  // Função formatCurrency local que usa o estado
  const formatCurrencyLocal = (value, originalCurrency = 'BRL') => {
    if (currentLanguage === 'pt-BR') {
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      }).format(value);
    } else {
      const usdValue = originalCurrency === 'USD' ? value : value / usdRate;
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
      }).format(usdValue);
    }
  };

  return (
    <div className={`dashboard-container ${isDarkMode ? '' : 'light-theme'}`}>
      {/* Sidebar */}
      <Sidebar 
        sidebarExpanded={sidebarExpanded}
        isDarkMode={isDarkMode}
        currentLanguage={currentLanguage}
        translations={t}
        isMobile={mobileMenuOpen}
        onClose={closeMobileMenu}
        toggleTheme={toggleTheme}
        toggleFullscreen={toggleFullscreen}
        changeLanguage={changeLanguage}
      />
      
      {/* Overlay para mobile */}
      {mobileMenuOpen && <div className="mobile-overlay" onClick={closeMobileMenu}></div>}

      {/* Top Menu Bar */}
      <TopMenuBar 
        sidebarExpanded={sidebarExpanded}
        toggleSidebar={toggleSidebar}
        isDarkMode={isDarkMode}
        toggleTheme={toggleTheme}
        toggleFullscreen={toggleFullscreen}
        currentLanguage={currentLanguage}
        changeLanguage={changeLanguage}
        marketData={marketData}
      />

      {/* FilterBar Fixo */}
      <FilterBar
        t={t}
        selectedStatus={selectedStatus}
        setSelectedStatus={setSelectedStatus}
        selectedSeller={selectedSeller}
        setSelectedSeller={setSelectedSeller}
        onSellerNameChange={setSelectedSellerName}
        selectedPeriod={selectedPeriod}
        setSelectedPeriod={setSelectedPeriod}
        selectedFunnel={selectedFunnel}
        setSelectedFunnel={setSelectedFunnel}
        selectedUnit={selectedUnit}
        setSelectedUnit={setSelectedUnit}
        selectedOrigin={selectedOrigin}
        setSelectedOrigin={setSelectedOrigin}
        startDate={startDate}
        setStartDate={setStartDate}
        endDate={endDate}
        setEndDate={setEndDate}
        onUnitFilterChange={handleUnitFilterChange}
        onSellerFilterChange={handleSellerFilterChange}
        onOriginFilterChange={handleOriginFilterChange}
        onStatusFilterChange={handleStatusFilterChange}
        marketData={marketData}
      />

      {/* Main Content */}
      <main className="main-content">

          {/* Indicador de Erro */}
          {error && (
            <div style={{ 
              background: '#f44336', 
              color: 'white', 
              padding: '10px', 
              borderRadius: '5px', 
              marginBottom: '20px',
              textAlign: 'center'
            }}>
              <strong>❌ Erro ao carregar dados:</strong> {error}
            </div>
          )}

          {/* Filtros (sem filtro de data) */}
          <GooglePatrocinadoFilters
            searchTerm={searchTerm}
            onSearchChange={handleSearchChange}
            selectedAccount={selectedAccount}
            onAccountChange={handleAccountChange}
            selectedStatus={selectedCampaignStatus}
            onStatusChange={handleStatusChange}
            selectedCampaignType={selectedCampaignType}
            onCampaignTypeChange={handleCampaignTypeChange}
            accounts={accounts}
            campaignTypes={campaignTypes}
            onRefresh={handleRefresh}
            isLoading={isLoading}
          />

          {/* Stats Section */}
          <section className="stats-section">
            <GooglePatrocinadoStats
              stats={googlePatrocinadoStats}
              dateRange={dateRange}
              isLoading={isLoading}
            />
          </section>

          {/* Chart Section */}
          <section className="chart-section">
            <GooglePatrocinadoDashboard
              dateRange={dateRange}
              filteredCampaigns={filteredCampaigns}
              onRefresh={() => console.log('Refresh')}
              isLoading={isLoading}
              error={error}
            />
          </section>
      </main>
    </div>
  );
};

export default DashGooglePatrocinadoPage;
