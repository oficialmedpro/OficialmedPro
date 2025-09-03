import React, { useState, useEffect } from 'react';
import './GoogleAdsDashboard.css';
import MetricsSidebarGoogleAds from '../components/MetricsSidebarGoogleAds';
import MetricsCards from '../components/MetricsCards';
import FilterBar from '../components/FilterBar';
import TopMenuBar from '../components/TopMenuBar';
import Sidebar from '../components/Sidebar';
import GoogleAdsFunnelCards from '../components/GoogleAdsFunnelCards';
import '../components/GoogleAdsFunnelCards.css';
import TrafficFunnel from '../components/TrafficFunnel';
import StatsSection from '../components/StatsSection';
import TimelineChart from '../components/TimelineChart';
import GoogleAdsMetricsBar from '../components/GoogleAdsMetricsBar';
import GoogleAdsMetricsCards from '../components/GoogleAdsMetricsCards';
import { translations } from '../data/translations';
import { getStatsCards, getMenuItems } from '../data/statsData';
import { 
  formatCurrency, 
  updateMarketData, 
  fetchUsdRate, 
  handleDatePreset 
} from '../utils/utils';
import { googleAdsService } from '../service/googleAdsService';

// Importar bandeiras e logos
import BandeiraEUA from '../../icones/eua.svg';
import BandeiraBrasil from '../../icones/brasil.svg';

const DashboardGoogleAds = ({ onLogout }) => {
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
  const [selectedPeriod, setSelectedPeriod] = useState('today');
  const [selectedFunnel, setSelectedFunnel] = useState('all');
  const [selectedUnit, setSelectedUnit] = useState('all');
  const [unitFilterValue, setUnitFilterValue] = useState(null); // Novo estado para o valor do filtro
  const [statusFilterValue, setStatusFilterValue] = useState(null); // Novo estado para o filtro de status
  const [marketData, setMarketData] = useState({
    usd: 5.20,
    eur: 5.45,
    ibov: 125432,
    lastUpdate: new Date()
  });

  // Estados para dados do Google Ads
  const [googleAdsData, setGoogleAdsData] = useState({
    stats: null,
    campaigns: [],
    customerInfo: null,
    isLoading: true,
    error: null
  });

  // Traduções
  const t = translations[currentLanguage];

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

  // 🎯 Carregar dados do Google Ads
  useEffect(() => {
    const loadGoogleAdsData = async () => {
      try {
        console.log('🔍 DashboardGoogleAds: Carregando dados do Google Ads...');
        setGoogleAdsData(prev => ({ ...prev, isLoading: true, error: null }));

        // Carregar dados do dashboard
        const dashboardData = await googleAdsService.getDashboardData({
          dateRange: { startDate, endDate },
          unidadeId: unitFilterValue || 1
        });

        console.log('✅ DashboardGoogleAds: Dados carregados com sucesso:', dashboardData);

        setGoogleAdsData({
          stats: dashboardData.stats,
          campaigns: dashboardData.campaigns,
          customerInfo: {
            customerId: dashboardData.customerId,
            unidadeId: dashboardData.unidadeId
          },
          isLoading: false,
          error: null
        });

      } catch (error) {
        console.error('❌ DashboardGoogleAds: Erro ao carregar dados:', error);
        setGoogleAdsData(prev => ({
          ...prev,
          isLoading: false,
          error: error.message || 'Erro ao carregar dados do Google Ads'
        }));
      }
    };

    loadGoogleAdsData();
  }, [startDate, endDate, unitFilterValue]);

  // Funções de controle
  
  // 🎯 Função para lidar com mudanças no filtro de unidade
  const handleUnitFilterChange = (filterValue) => {
    setUnitFilterValue(filterValue);
    console.log(`🎯 Dashboard GoogleAds: Filtro de unidade alterado para:`, filterValue);
    
    // Aqui você pode implementar a lógica para filtrar as oportunidades
    // baseado no unidade_id usando o valor do codigo_sprint
    if (filterValue) {
      console.log(`🔍 Filtrando oportunidades com unidade_id = "${filterValue}"`);
      // TODO: Implementar filtro nas oportunidades
      // Exemplo: filtrar oportunidades onde unidade_id = filterValue
    } else {
      console.log(`🌐 Mostrando todas as oportunidades (sem filtro de unidade)`);
      // TODO: Remover filtro de unidade
    }
  };

  // 🎯 Função para lidar com mudanças no filtro de status
  const handleStatusFilterChange = (filterData) => {
    setStatusFilterValue(filterData);
    console.log(`🎯 Dashboard GoogleAds: Filtro de status alterado para:`, filterData);
    
    // Aqui você pode implementar a lógica para filtrar as oportunidades
    // baseado no status selecionado
    console.log(`🔍 Filtrando oportunidades com ${filterData.field} = "${filterData.value}"`);
    console.log(`📝 Descrição: ${filterData.description}`);
    
    // TODO: Implementar filtro nas oportunidades
    // Exemplo: filtrar oportunidades onde filterData.field = filterData.value
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

  // Dados
  const statsCards = getStatsCards(t);
  const menuItems = getMenuItems(t);

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
    <div className="dashboard-container">
      {/* Sidebar Desktop */}
      <Sidebar 
        sidebarExpanded={sidebarExpanded} 
        isDarkMode={isDarkMode}
        currentLanguage={currentLanguage}
        translations={t}
      />

      {/* Menu Mobile Overlay */}
      {mobileMenuOpen && (
        <div className="mobile-menu-overlay" onClick={closeMobileMenu}>
          <div className="mobile-menu-content" onClick={(e) => e.stopPropagation()}>
                         {/* Usar o mesmo componente Sidebar para manter consistência */}
             <Sidebar 
               sidebarExpanded={true}
               isDarkMode={isDarkMode}
               currentLanguage={currentLanguage}
               translations={t}
               isMobile={true}
               onClose={closeMobileMenu}
               toggleTheme={toggleTheme}
               toggleFullscreen={toggleFullscreen}
               changeLanguage={changeLanguage}
             />
          </div>
        </div>
      )}

      {/* Top Menu Bar */}
      <TopMenuBar 
        sidebarExpanded={sidebarExpanded}
        toggleSidebar={toggleSidebar}
        toggleFullscreen={toggleFullscreen}
        toggleTheme={toggleTheme}
        isDarkMode={isDarkMode}
        currentLanguage={currentLanguage}
        changeLanguage={changeLanguage}
        onLogout={onLogout}
      />

      {/* FilterBar Fixo */}
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
        onUnitFilterChange={handleUnitFilterChange}
        onStatusFilterChange={handleStatusFilterChange}
        marketData={marketData}
      />

      {/* Main Content */}
      <main className="main-content">
        {/* Google Ads Header */}
        <GoogleAdsMetricsBar 
          isDarkMode={isDarkMode}
          onAccountChange={(account) => {
            console.log(`🎯 GoogleAds Conta alterada para:`, account);
          }}
          onCampaignChange={(campaign) => {
            console.log(`🎯 GoogleAds Campanha alterada para:`, campaign);
          }}
          onAdGroupChange={(adGroup) => {
            console.log(`🎯 GoogleAds Grupo de Anúncios alterado para:`, adGroup);
          }}
          onAdChange={(ad) => {
            console.log(`🎯 GoogleAds Anúncio alterado para:`, ad);
          }}
        />

        {/* Google Ads Funnel Section - Cards exatos como tela 28 */}
        <GoogleAdsFunnelCards isDarkMode={isDarkMode}>
          {/* Google Ads Metrics Cards - 4 cards de métricas */}
          <GoogleAdsMetricsCards 
            isDarkMode={isDarkMode}
            formatCurrency={formatCurrencyLocal}
            googleAdsData={googleAdsData.stats || {
              balance: 35000.00,
              balanceChange: '+8.5%',
              campaigns: 12,
              activeCampaigns: 8,
              adGroups: 24,
              activeAdGroups: 20,
              ads: 60,
              activeAds: 55
            }}
            selectedCampaign={null}
            selectedAdGroup={null}
            selectedAd={null}
            isLoading={googleAdsData.isLoading}
            error={googleAdsData.error}
          />
        </GoogleAdsFunnelCards>
        
        {/* CRM Integration Section */}
        <section className="crm-integration-section">
          <div className="crm-section-header">
            <div className="crm-platform-icon crm-sources-icon">G</div>
            <span className="crm-platform-name">Integração Google Ads com CRM</span>
          </div>
          
          <div className="crm-metrics-grid">
            <div className="crm-metric-group">
              <h4 className="crm-group-title">📊 Status dos Leads</h4>
              <div className="crm-metrics-row">
                <div className="crm-metric-item converted">
                  <div className="crm-metric-label">✅ Convertidos</div>
                  <div className="crm-metric-value">2.1K</div>
                  <div className="crm-metric-percentage">18.2%</div>
                </div>
                <div className="crm-metric-item lost">
                  <div className="crm-metric-label">❌ Perdidos</div>
                  <div className="crm-metric-value">2.8K</div>
                  <div className="crm-metric-percentage">24.3%</div>
                </div>
                <div className="crm-metric-item open">
                  <div className="crm-metric-label">🔄 Em Aberto</div>
                  <div className="crm-metric-value">6.6K</div>
                  <div className="crm-metric-percentage">57.5%</div>
                </div>
              </div>
            </div>
            
            <div className="crm-metric-group">
              <h4 className="crm-group-title">💰 Performance Financeira</h4>
              <div className="crm-metrics-row">
                <div className="crm-metric-item roas">
                  <div className="crm-metric-label">ROAS</div>
                  <div className="crm-metric-value">4.1x</div>
                  <div className="crm-metric-percentage">410%</div>
                </div>
                <div className="crm-metric-item roi">
                  <div className="crm-metric-label">ROI</div>
                  <div className="crm-metric-value">310%</div>
                  <div className="crm-metric-percentage">310%</div>
                </div>
                <div className="crm-metric-item conversion">
                  <div className="crm-metric-label">Taxa Conversão</div>
                  <div className="crm-metric-value">18.2%</div>
                  <div className="crm-metric-percentage">18.2%</div>
                </div>
              </div>
            </div>
            
            <div className="crm-metric-group">
              <h4 className="crm-group-title">⏱️ Tempo Médio</h4>
              <div className="crm-metrics-row">
                <div className="crm-metric-item time">
                  <div className="crm-metric-label">Fechamento</div>
                  <div className="crm-metric-value">14 dias</div>
                  <div className="crm-metric-percentage">14 dias</div>
                </div>
                <div className="crm-metric-item loss-rate">
                  <div className="crm-metric-label">Taxa de Perda</div>
                  <div className="crm-metric-value">24.3%</div>
                  <div className="crm-metric-percentage">24.3%</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Traffic Funnel & Performance Section */}
        <TrafficFunnel />

        {/* Timeline Chart - Performance dos Últimos 7 Dias */}
        <TimelineChart selectedDate={endDate} t={t} />

        {/* Metrics Cards Section */}
        <MetricsCards formatCurrency={formatCurrencyLocal} t={t} />
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="mobile-bottom-nav">
        {/* Seletor de idioma - estilo TopMenuBar */}
        <button className="mobile-nav-btn mobile-language-btn" onClick={() => changeLanguage(currentLanguage === 'pt-BR' ? 'en-US' : 'pt-BR')}>
          <img 
            src={currentLanguage === 'pt-BR' ? BandeiraBrasil : BandeiraEUA} 
            alt={currentLanguage === 'pt-BR' ? 'Brasil' : 'United States'} 
            className="flag-img"
          />
        </button>

        {/* Toggle tema */}
        <button className="mobile-nav-btn" onClick={toggleTheme}>
          <span style={{ fontSize: '20px' }}>{isDarkMode ? '☀️' : '🌙'}</span>
        </button>

        {/* Mensagens */}
        <button className="mobile-nav-btn mobile-nav-with-badge">
          <span style={{ fontSize: '20px' }}>✉️</span>
          <span className="mobile-nav-badge">3</span>
        </button>

        {/* Notificações */}
        <button className="mobile-nav-btn mobile-nav-with-badge">
          <span style={{ fontSize: '20px' }}>🔔</span>
          <span className="mobile-nav-badge">7</span>
        </button>

        {/* Avatar usuário */}
        <div className="mobile-user-avatar">U</div>
      </nav>
    </div>
  );
};

export default DashboardGoogleAds;
