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

  // Carregar dados iniciais
  useEffect(() => {
    const initializePage = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Verificar se o serviço está configurado
        if (!googlePatrocinadoService.isConfigured()) {
          setError('Google Ads não está configurado. Verifique as credenciais.');
          setIsLoading(false);
          return;
        }

        // Carregar campanhas com métricas
        await loadCampaignsWithMetrics();
        
        // Carregar contas disponíveis
        await loadAccounts();

        console.log('✅ Google Patrocinado Page inicializada com sucesso');
      } catch (error) {
        console.error('❌ Erro ao inicializar Google Patrocinado Page:', error);
        setError(error.message || 'Erro ao carregar dados');
      } finally {
        setIsLoading(false);
      }
    };

    initializePage();
  }, []);

  // Carregar campanhas com métricas
  const loadCampaignsWithMetrics = async () => {
    try {
      console.log('📊 Carregando campanhas com métricas...', dateRange);
      
      let campaignsData;
      if (selectedAccount === 'all') {
        campaignsData = await googlePatrocinadoService.getAllCampaignsWithMetrics(dateRange);
      } else {
        campaignsData = await googlePatrocinadoService.getCampaignsWithMetrics(dateRange, selectedAccount);
      }

      setCampaigns(campaignsData);
      console.log(`✅ ${campaignsData.length} campanhas carregadas`);

      // Extrair tipos de campanha únicos
      const types = [...new Set(campaignsData.map(c => c.advertising_channel_type).filter(Boolean))];
      setCampaignTypes(types);

      // Carregar estatísticas
      await loadStatistics();
    } catch (error) {
      console.error('❌ Erro ao carregar campanhas:', error);
      throw error;
    }
  };

  // Carregar estatísticas
  const loadStatistics = async () => {
    try {
      console.log('📈 Carregando estatísticas...');
      
      let stats;
      if (selectedAccount === 'all') {
        stats = await googlePatrocinadoService.getAllGoogleAdsStats(dateRange, searchTerm);
      } else {
        stats = await googlePatrocinadoService.getGoogleAdsStats(dateRange, searchTerm, selectedAccount);
      }

      setGooglePatrocinadoStats(stats);
      console.log('✅ Estatísticas carregadas');
    } catch (error) {
      console.error('❌ Erro ao carregar estatísticas:', error);
    }
  };

  // Carregar contas disponíveis
  const loadAccounts = async () => {
    try {
      // Simular contas disponíveis (baseado no serviço)
      const accountsData = [
        { key: 'ACCOUNT_1', name: 'Conta Principal', active: true },
        { key: 'ACCOUNT_2', name: 'Conta Secundária', active: true }
      ];
      setAccounts(accountsData);
    } catch (error) {
      console.error('❌ Erro ao carregar contas:', error);
    }
  };

  // Filtrar campanhas baseado nos filtros ativos
  useEffect(() => {
    let filtered = campaigns;

    // Filtro por termo de busca
    if (searchTerm) {
      filtered = filtered.filter(campaign =>
        campaign.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtro por status
    if (selectedCampaignStatus !== 'all') {
      filtered = filtered.filter(campaign => campaign.status === selectedCampaignStatus);
    }

    // Filtro por tipo de campanha
    if (selectedCampaignType !== 'all') {
      filtered = filtered.filter(campaign => campaign.advertising_channel_type === selectedCampaignType);
    }

    // Filtro por conta
    if (selectedAccount !== 'all') {
      filtered = filtered.filter(campaign => campaign.accountKey === selectedAccount);
    }

    setFilteredCampaigns(filtered);
    console.log(`🔍 ${filtered.length} campanhas após filtros`);
  }, [campaigns, searchTerm, selectedCampaignStatus, selectedCampaignType, selectedAccount]);

  // Handlers para filtros
  const handleDateRangeChange = (newDateRange) => {
    setDateRange(newDateRange);
    // Recarregar dados com novo período
    setTimeout(() => {
      loadCampaignsWithMetrics();
    }, 100);
  };

  const handleSearchChange = (newSearchTerm) => {
    setSearchTerm(newSearchTerm);
  };

  const handleAccountChange = (accountKey) => {
    setSelectedAccount(accountKey);
    // Recarregar dados para nova conta
    setTimeout(() => {
      loadCampaignsWithMetrics();
    }, 100);
  };

  const handleStatusChange = (status) => {
    setSelectedCampaignStatus(status);
  };

  const handleCampaignTypeChange = (type) => {
    setSelectedCampaignType(type);
  };

  const handleRefresh = () => {
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
          subtitle="Dashboard de campanhas Google Ads"
        />

        {/* Content Area */}
        <div className="google-patrocinado-content">
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
              <h3>Campanhas ({filteredCampaigns.length})</h3>
              <p>
                Mostrando {filteredCampaigns.length} de {campaigns.length} campanhas
                {searchTerm && ` para "${searchTerm}"`}
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
                  <div key={campaign.id || index} className="google-patrocinado-campaign-card">
                    <div className="google-patrocinado-campaign-header">
                      <h4>{campaign.name}</h4>
                      <span className={`google-patrocinado-campaign-status ${campaign.status.toLowerCase()}`}>
                        {campaign.status === 'ENABLED' ? 'Ativa' : 
                         campaign.status === 'PAUSED' ? 'Pausada' : 'Removida'}
                      </span>
                    </div>
                    
                    <div className="google-patrocinado-campaign-info">
                      <p><strong>Tipo:</strong> {campaign.advertising_channel_type || 'N/A'}</p>
                      <p><strong>Conta:</strong> {campaign.accountName || campaign.accountKey}</p>
                      {campaign.budget_amount_micros && (
                        <p><strong>Orçamento:</strong> {formatCurrency(campaign.budget_amount_micros / 1000000)}</p>
                      )}
                    </div>

                    {campaign.metrics && (
                      <div className="google-patrocinado-campaign-metrics">
                        <div className="google-patrocinado-metric-item">
                          <span className="google-patrocinado-metric-label">Gasto</span>
                          <span className="google-patrocinado-metric-value">
                            {formatCurrency(campaign.metrics.cost_micros / 1000000)}
                          </span>
                        </div>
                        <div className="google-patrocinado-metric-item">
                          <span className="google-patrocinado-metric-label">Impressões</span>
                          <span className="google-patrocinado-metric-value">
                            {campaign.metrics.impressions.toLocaleString('pt-BR')}
                          </span>
                        </div>
                        <div className="google-patrocinado-metric-item">
                          <span className="google-patrocinado-metric-label">Cliques</span>
                          <span className="google-patrocinado-metric-value">
                            {campaign.metrics.clicks.toLocaleString('pt-BR')}
                          </span>
                        </div>
                        <div className="google-patrocinado-metric-item">
                          <span className="google-patrocinado-metric-label">Conversões</span>
                          <span className="google-patrocinado-metric-value">
                            {campaign.metrics.conversions.toLocaleString('pt-BR')}
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
