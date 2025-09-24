import React, { useState, useEffect } from 'react';
import './DashboardPage.css';
import './GooglePatrocinadoPage.css';
import FilterBar from '../components/FilterBar';
import TopMenuBar from '../components/TopMenuBar';
import Sidebar from '../components/Sidebar';
import HeaderComponents from '../components/HeaderComponents';
import GooglePatrocinadoDashboard from '../components/google_patrocinado/GooglePatrocinadoDashboard';
import GooglePatrocinadoStats from '../components/google_patrocinado/GooglePatrocinadoStats';
import GooglePatrocinadoFilters from '../components/google_patrocinado/GooglePatrocinadoFilters';
import { googlePatrocinadoService } from '../service/googlePatrocinadoService';
import { translations } from '../data/translations';
import { 
  formatCurrency, 
  updateMarketData 
} from '../utils/utils';

// Importar bandeiras
import BandeiraEUA from '../../icones/eua.svg';
import BandeiraBrasil from '../../icones/brasil.svg';

const GooglePatrocinadoPage = () => {
  // Estados básicos do dashboard
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [currentLanguage, setCurrentLanguage] = useState('pt-BR');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedSeller, setSelectedSeller] = useState('all');
  const [selectedPeriod, setSelectedPeriod] = useState('thisMonth');
  const [selectedFunnel, setSelectedFunnel] = useState('all');
  const [selectedUnit, setSelectedUnit] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
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

  // Estados de mercado
  const [marketData, setMarketData] = useState({
    usd: 5.20,
    eur: 5.45,
    ibov: 125432,
    lastUpdate: new Date()
  });

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
        console.log('🔑 Service Key disponível:', import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY ? '✅ Sim' : '❌ Não');

        // PASSO 1: Testar conexão
        console.log('🔍 PASSO 1: Testando conexão...');
        await testConnection();

        // PASSO 2: Carregar campanhas reais
        console.log('🔍 PASSO 2: Buscando campanhas da sua conta...');
        await loadCampaignsWithMetrics();
        
        // PASSO 3: Carregar contas disponíveis
        console.log('🔍 PASSO 3: Carregando contas disponíveis...');
        await loadAccounts();

        console.log('✅ PÁGINA: Google Patrocinado Page inicializada com dados REAIS da API');
      } catch (error) {
        console.error('❌ PÁGINA: Erro ao inicializar Google Patrocinado Page:', error);
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
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY}`,
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
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY}`,
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
          console.log(`   - Gasto: ${campaign.metrics.cost_micros}`);
          console.log(`   - Conversões: ${campaign.metrics.conversions}`);
          console.log(`   - Valor Conversões: ${campaign.metrics.conversions_value}`);
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
    } catch (error) {
      console.error('❌ Erro ao carregar campanhas reais:', error);
      console.error('❌ Detalhes completos:', error);
      setError(error.message || 'Erro ao carregar campanhas');
      throw error;
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
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY}`,
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
        totalClicks: statsData.data?.totalClicks || 0,
        totalImpressions: statsData.data?.totalImpressions || 0,
        totalCost: statsData.data?.totalCost || 0,
        totalConversions: statsData.data?.totalConversions || 0,
        ctr: statsData.data?.ctr || 0,
        cpc: statsData.data?.cpc || 0,
        conversionRate: statsData.data?.conversionRate || 0,
        period: statsData.data?.period || dateRange
      };

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
  };

  // Handlers do layout principal
  const toggleSidebar = () => {
    if (window.innerWidth <= 768) {
      setMobileMenuOpen(!mobileMenuOpen);
    } else {
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

  // Atualizar dados de mercado
  useEffect(() => {
    const updateMarket = async () => {
      try {
        const newMarketData = await updateMarketData();
        setMarketData(newMarketData);
      } catch (error) {
        console.warn('⚠️ Não foi possível atualizar dados de mercado:', error);
      }
    };

    updateMarket();
    const interval = setInterval(updateMarket, 5 * 60 * 1000); // 5 minutos
    return () => clearInterval(interval);
  }, []);

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
      
      {/* Conteúdo Principal */}
      <main className={`main-content ${sidebarExpanded ? 'sidebar-expanded' : 'sidebar-collapsed'}`}>
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

        {/* Header Components */}
        <HeaderComponents 
          isDarkMode={isDarkMode}
          formatCurrency={formatCurrency}
          marketData={marketData}
          BandeiraEUA={BandeiraEUA}
          BandeiraBrasil={BandeiraBrasil}
          title="Google Patrocinado"
          subtitle="Dashboard de campanhas Google Ads - Dados Reais da API"
        />

        {/* Content Area */}
        <div className="google-patrocinado-content">
          {/* Indicador de Status da API */}
          {!isLoading && !error && (
            <div style={{ 
              background: '#4CAF50', 
              color: 'white', 
              padding: '10px', 
              borderRadius: '5px', 
              marginBottom: '20px',
              textAlign: 'center'
            }}>
              <strong>🚀 Dados Reais da Google Ads API</strong> - {campaigns.length} campanhas carregadas
            </div>
          )}

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

          {/* Filtros */}
          <GooglePatrocinadoFilters
            dateRange={dateRange}
            onDateRangeChange={handleDateRangeChange}
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

          {/* Dashboard Principal */}
          <GooglePatrocinadoDashboard
            dateRange={dateRange}
            filteredCampaigns={filteredCampaigns}
            onRefresh={handleRefresh}
            isLoading={isLoading}
            error={error}
          />

          {/* Estatísticas */}
          {googlePatrocinadoStats && (
            <GooglePatrocinadoStats
              stats={googlePatrocinadoStats}
              dateRange={dateRange}
              isLoading={isLoading}
            />
          )}

          {/* Lista de Campanhas */}
          <div className="google-patrocinado-campaigns-section">
            <div className="google-patrocinado-campaigns-header">
              <h3>
                🚀 Campanhas Reais ({filteredCampaigns.length})
                <span style={{ fontSize: '12px', color: '#4CAF50', marginLeft: '10px' }}>
                  ✅ Dados da Google Ads API
                </span>
              </h3>
              <p>
                Mostrando {filteredCampaigns.length} de {campaigns.length} campanhas reais
                {searchTerm && ` para "${searchTerm}"`}
                <br />
                <small style={{ color: '#4CAF50' }}>
                  📊 Período: {dateRange.since} até {dateRange.until}
                </small>
              </p>
            </div>
            
            {filteredCampaigns.length === 0 ? (
              <div className="google-patrocinado-no-campaigns">
                <p>Nenhuma campanha encontrada com os filtros aplicados.</p>
                {searchTerm && (
                  <button onClick={() => setSearchTerm('')} className="google-patrocinado-clear-search">
                    Limpar busca
                  </button>
                )}
              </div>
            ) : (
              <div className="google-patrocinado-campaigns-grid">
                {filteredCampaigns.map((campaign, index) => (
                  <div key={campaign.uniqueId || `${campaign.id || 'campaign'}-${campaign.accountKey || 'acc'}-${index}`} className="google-patrocinado-campaign-card">
                    <div className="google-patrocinado-campaign-header">
                      <h4>{campaign.name}</h4>
                      <span className={`google-patrocinado-campaign-status ${(campaign.status || 'enabled').toLowerCase()}`}>
                        {campaign.status === 'ENABLED' ? 'Ativa' : 
                         campaign.status === 'PAUSED' ? 'Pausada' : 
                         campaign.status === 'REMOVED' ? 'Removida' : 'Ativa'}
                      </span>
                    </div>
                    
                    <div className="google-patrocinado-campaign-info">
                      <p><strong>Tipo:</strong> {campaign.advertising_channel_type || campaign.channelType || 'SEARCH'}</p>
                      <p><strong>Conta:</strong> {campaign.accountName || 'Apucarana (Google Ads)'}</p>
                      <p><strong>ID:</strong> {campaign.id}</p>
                    </div>

                    {campaign.metrics && (
                      <div className="google-patrocinado-campaign-metrics">
                        <div className="google-patrocinado-metric-item">
                          <span className="google-patrocinado-metric-label">💰 Gasto</span>
                          <span className="google-patrocinado-metric-value">
                            {formatCurrency((campaign.metrics.cost_micros || 0) / 1000000)}
                          </span>
                        </div>
                        <div className="google-patrocinado-metric-item">
                          <span className="google-patrocinado-metric-label">👁️ Impressões</span>
                          <span className="google-patrocinado-metric-value">
                            {(campaign.metrics.impressions || 0).toLocaleString('pt-BR')}
                          </span>
                        </div>
                        <div className="google-patrocinado-metric-item">
                          <span className="google-patrocinado-metric-label">🖱️ Cliques</span>
                          <span className="google-patrocinado-metric-value">
                            {(campaign.metrics.clicks || 0).toLocaleString('pt-BR')}
                          </span>
                        </div>
                        <div className="google-patrocinado-metric-item">
                          <span className="google-patrocinado-metric-label">🎯 CTR</span>
                          <span className="google-patrocinado-metric-value">
                            {((campaign.metrics.ctr || 0) * 100).toFixed(2)}%
                          </span>
                        </div>
                        <div className="google-patrocinado-metric-item">
                          <span className="google-patrocinado-metric-label">📈 Conversões</span>
                          <span className="google-patrocinado-metric-value">
                            {(campaign.metrics.conversions || 0).toLocaleString('pt-BR')}
                          </span>
                        </div>
                        <div className="google-patrocinado-metric-item">
                          <span className="google-patrocinado-metric-label">💵 CPC</span>
                          <span className="google-patrocinado-metric-value">
                            {formatCurrency(campaign.metrics.average_cpc || 0)}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default GooglePatrocinadoPage;
