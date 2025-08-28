import React, { useState, useEffect } from 'react';
import './DashboardPage.css';
import './MetaAdsDashboard.css';
import FilterBar from '../components/FilterBar';
import TopMenuBar from '../components/TopMenuBar';
import Sidebar from '../components/Sidebar';
import HeaderComponents from '../components/HeaderComponents';
import CampaignCard from '../components/CampaignCard';
import MetaAdsStats from '../components/MetaAdsStats';
import { metaAdsService } from '../service/metaAdsService';
import { mockMetaAdsService } from '../service/mockMetaAdsService';
import { translations } from '../data/translations';
import { 
  formatCurrency, 
  updateMarketData 
} from '../utils/utils';

// Importar bandeiras
import BandeiraEUA from '../../icones/eua.svg';
import BandeiraBrasil from '../../icones/brasil.svg';

const MetaAdsDashboard = () => {
  // Estados básicos do dashboard
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [currentLanguage, setCurrentLanguage] = useState('pt-BR');
  const [selectedStatus, setSelectedStatus] = useState('sale');
  const [selectedSeller, setSelectedSeller] = useState('all');
  const [selectedPeriod, setSelectedPeriod] = useState('thisMonth');
  const [selectedFunnel, setSelectedFunnel] = useState('all');
  const [selectedUnit, setSelectedUnit] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  // Estados específicos do Meta Ads
  const [campaigns, setCampaigns] = useState([]);
  const [filteredCampaigns, setFilteredCampaigns] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [metaStats, setMetaStats] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [useMockData, setUseMockData] = useState(true); // Usar dados simulados por padrão
  
  // Estados de mercado
  const [marketData, setMarketData] = useState({
    usd: 5.20,
    eur: 5.45,
    ibov: 125432,
    lastUpdate: new Date()
  });

  // Traduções
  const t = translations[currentLanguage];

  // Atualizar dados de mercado
  useEffect(() => {
    const updateData = async () => {
      const data = await updateMarketData();
      if (data) setMarketData(data);
    };
    
    updateData();
    const interval = setInterval(updateData, 30000);
    return () => clearInterval(interval);
  }, []);

  // Calcular período baseado na seleção
  const calculateDateRange = () => {
    const today = new Date();
    let since, until;

    switch (selectedPeriod) {
      case 'today':
        since = until = today.toISOString().split('T')[0];
        break;
      case 'yesterday':
        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);
        since = until = yesterday.toISOString().split('T')[0];
        break;
      case 'last7Days':
        const last7Days = new Date(today);
        last7Days.setDate(today.getDate() - 7);
        since = last7Days.toISOString().split('T')[0];
        until = today.toISOString().split('T')[0];
        break;
      case 'thisMonth':
        since = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
        until = today.toISOString().split('T')[0];
        break;
      case 'thisQuarter':
        const quarter = Math.floor(today.getMonth() / 3);
        since = new Date(today.getFullYear(), quarter * 3, 1).toISOString().split('T')[0];
        until = today.toISOString().split('T')[0];
        break;
      case 'thisYear':
        since = new Date(today.getFullYear(), 0, 1).toISOString().split('T')[0];
        until = today.toISOString().split('T')[0];
        break;
      case 'custom':
        since = startDate;
        until = endDate;
        break;
      default:
        since = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
        until = today.toISOString().split('T')[0];
    }

    return { since, until };
  };

  // Carregar campanhas do Meta Ads
  const loadCampaigns = async () => {
    try {
      setIsLoading(true);
      setError(null);

      console.log('🔄 Carregando campanhas do Meta Ads...');
      
      // Escolher qual service usar baseado no estado
      const service = useMockData ? mockMetaAdsService : metaAdsService;
      const serviceType = useMockData ? '[MOCK]' : '[API]';
      
      console.log(`📊 Usando ${serviceType} para carregar dados`);
      
      // Verificar se o serviço está configurado (apenas para API real)
      if (!useMockData && !metaAdsService.isConfigured()) {
        throw new Error('Credenciais do Meta Ads não configuradas. Verifique o arquivo .env');
      }

      const dateRange = calculateDateRange();
      console.log('📅 Período selecionado:', dateRange);

      // Buscar campanhas com insights
      const campaignsData = await service.getCampaignsWithInsights(dateRange);
      console.log('✅ Campanhas carregadas:', campaignsData.length);

      setCampaigns(campaignsData);
      
      // Buscar estatísticas gerais
      const statsData = await service.getMetaStats(dateRange, searchTerm);
      setMetaStats(statsData);
      
    } catch (error) {
      console.error('❌ Erro ao carregar campanhas:', error);
      setError(error.message);
      setCampaigns([]);
      setMetaStats(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Carregar campanhas inicialmente e quando os filtros mudarem
  useEffect(() => {
    loadCampaigns();
  }, [selectedPeriod, startDate, endDate, searchTerm, useMockData]); // Adicionar useMockData como dependência

  // Filtrar campanhas baseado nos filtros
  useEffect(() => {
    let filtered = campaigns;

    // Filtrar por termo de busca
    if (searchTerm) {
      filtered = filtered.filter(campaign => 
        campaign.name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtrar por status da campanha
    if (selectedStatus && selectedStatus !== 'all') {
      const statusMap = {
        'active': 'ACTIVE',
        'paused': 'PAUSED', 
        'archived': 'ARCHIVED'
      };
      if (statusMap[selectedStatus]) {
        filtered = filtered.filter(campaign => 
          campaign.status === statusMap[selectedStatus]
        );
      }
    }

    setFilteredCampaigns(filtered);
  }, [campaigns, searchTerm, selectedStatus]);

  // Handlers
  const toggleSidebar = () => setSidebarExpanded(!sidebarExpanded);
  const toggleMobileMenu = () => setMobileMenuOpen(!mobileMenuOpen);
  const toggleTheme = () => setIsDarkMode(!isDarkMode);
  const changeLanguage = (lang) => setCurrentLanguage(lang);
  
  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  const handleSearchChange = (value) => {
    setSearchTerm(value);
  };

  const handleRefresh = () => {
    loadCampaigns();
  };

  return (
    <div className={`dashboard-page ${isDarkMode ? 'dark-mode' : 'light-mode'}`}>
      <TopMenuBar
        sidebarExpanded={sidebarExpanded}
        toggleSidebar={toggleSidebar}
        toggleMobileMenu={toggleMobileMenu}
        isDarkMode={isDarkMode}
        toggleTheme={toggleTheme}
        currentLanguage={currentLanguage}
        changeLanguage={changeLanguage}
        toggleFullscreen={handleToggleFullscreen}
        onSearchChange={handleSearchChange}
        searchValue={searchTerm}
        t={t}
      />

      <div className="dashboard-container">
        <Sidebar 
          sidebarExpanded={sidebarExpanded}
          isDarkMode={isDarkMode}
          currentLanguage={currentLanguage}
          translations={t}
          toggleTheme={toggleTheme}
          toggleFullscreen={handleToggleFullscreen}
          changeLanguage={changeLanguage}
        />

        {/* Mobile Menu Overlay */}
        {mobileMenuOpen && (
          <>
            <div className="mobile-overlay" onClick={() => setMobileMenuOpen(false)}></div>
            <Sidebar 
              sidebarExpanded={true}
              isDarkMode={isDarkMode}
              currentLanguage={currentLanguage}
              translations={t}
              isMobile={true}
              onClose={() => setMobileMenuOpen(false)}
              toggleTheme={toggleTheme}
              toggleFullscreen={handleToggleFullscreen}
              changeLanguage={changeLanguage}
            />
          </>
        )}

        <main className="dashboard-content">
          <HeaderComponents 
            isDarkMode={isDarkMode}
            currentLanguage={currentLanguage}
            marketData={marketData}
            BandeiraEUA={BandeiraEUA}
            BandeiraBrasil={BandeiraBrasil}
            formatCurrency={formatCurrency}
            t={t}
          />

          <div className="meta-ads-header">
            <div className="meta-ads-title-section">
              <h1 className="meta-ads-title">📊 Dashboard Meta Ads</h1>
              <p className="meta-ads-subtitle">Visualize e analise suas campanhas do Facebook Ads</p>
            </div>
            
            <div className="meta-ads-actions">
              <button 
                className={`mock-toggle-btn ${useMockData ? 'mock-active' : 'api-active'}`}
                onClick={() => setUseMockData(!useMockData)}
                title={useMockData ? 'Usar dados reais da API' : 'Usar dados simulados'}
              >
                {useMockData ? '🎭 Mock' : '🔌 API'}
              </button>
              <button 
                className="refresh-btn"
                onClick={handleRefresh}
                disabled={isLoading}
                title="Atualizar dados"
              >
                {isLoading ? '🔄' : '↻'} Atualizar
              </button>
            </div>
          </div>

          <FilterBar 
            t={t}
            selectedStatus={selectedStatus}
            setSelectedStatus={setSelectedStatus}
            selectedSeller={selectedSeller}
            setSelectedSeller={setSelectedSeller}
            selectedPeriod={selectedPeriod}
            setSelectedPeriod={setSelectedPeriod}
            selectedFunnel={selectedFunnel}
            setSelectedFunnel={setSelectedFunnel}
            selectedUnit={selectedUnit}
            setSelectedUnit={setSelectedUnit}
            startDate={startDate}
            setStartDate={setStartDate}
            endDate={endDate}
            setEndDate={setEndDate}
            onUnitFilterChange={(value) => console.log('Unit filter:', value)}
            onStatusFilterChange={(value) => console.log('Status filter:', value)}
          />

          {/* Stats Section */}
          {metaStats && (
            <MetaAdsStats 
              stats={metaStats}
              isLoading={isLoading}
              formatCurrency={formatCurrency}
            />
          )}

          {/* Error State */}
          {error && (
            <div className="error-state">
              <div className="error-card">
                <h3>❌ Erro ao carregar dados</h3>
                <p>{error}</p>
                <button onClick={handleRefresh} className="retry-btn">
                  Tentar Novamente
                </button>
              </div>
            </div>
          )}

          {/* Loading State */}
          {isLoading && !error && (
            <div className="loading-state">
              <div className="loading-card">
                <div className="loading-spinner"></div>
                <p>Carregando campanhas do Meta Ads...</p>
              </div>
            </div>
          )}

          {/* Campaigns Grid */}
          {!isLoading && !error && (
            <div className="campaigns-section">
              <div className="campaigns-header">
                <h2>Campanhas ({filteredCampaigns.length})</h2>
                <div className="campaigns-filters">
                  <select 
                    value={selectedStatus} 
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="campaign-status-filter"
                  >
                    <option value="all">Todos os Status</option>
                    <option value="active">Ativas</option>
                    <option value="paused">Pausadas</option>
                    <option value="archived">Arquivadas</option>
                  </select>
                </div>
              </div>

              {filteredCampaigns.length === 0 ? (
                <div className="no-campaigns">
                  <h3>📭 Nenhuma campanha encontrada</h3>
                  <p>Não há campanhas para os filtros selecionados.</p>
                </div>
              ) : (
                <div className="campaigns-grid">
                  {filteredCampaigns.map((campaign) => (
                    <CampaignCard 
                      key={campaign.id}
                      campaign={campaign}
                      formatCurrency={formatCurrency}
                      isDarkMode={isDarkMode}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default MetaAdsDashboard;