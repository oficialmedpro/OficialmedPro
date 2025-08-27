import React, { useState, useEffect } from 'react';
import './DashboardPage.css';
import MetricsSidebar from '../components/MetricsSidebar';
import MetricsCards from '../components/MetricsCards';
import FilterBar from '../components/FilterBar';
import TopMenuBar from '../components/TopMenuBar';
import Sidebar from '../components/Sidebar';
import FunnelChart from '../components/FunnelChart';
import StatsSection from '../components/StatsSection';
import HeaderComponents from '../components/HeaderComponents';
import { translations } from '../data/translations';
import { getStatsCards, getMenuItems } from '../data/statsData';
import { 
  formatCurrency, 
  updateMarketData, 
  fetchUsdRate, 
  handleDatePreset 
} from '../utils/utils';

const DashboardPage = () => {
  // Estados para o dashboard
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
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
  const [marketData, setMarketData] = useState({
    usd: 5.20,
    eur: 5.45,
    ibov: 125432,
    lastUpdate: new Date()
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

  // Funções de controle
  const toggleSidebar = () => setSidebarExpanded(!sidebarExpanded);
  
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

      {/* Top Menu Bar */}
      <TopMenuBar 
        sidebarExpanded={sidebarExpanded}
        toggleSidebar={toggleSidebar}
        toggleFullscreen={toggleFullscreen}
        toggleTheme={toggleTheme}
        isDarkMode={isDarkMode}
        currentLanguage={currentLanguage}
        changeLanguage={changeLanguage}
      />

      {/* Main Content */}
      <main className="main-content">
        <div className="content-header">
          {/* Indicadores de mercado, data e horário */}
          <HeaderComponents marketData={marketData} />

          {/* Filtros à direita */}
          <div className="header-actions">
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
            />
          </div>
        </div>

        {/* Stats Section */}
        <StatsSection statsCards={statsCards} />

        {/* Chart Section */}
        <section className="chart-section">
          <FunnelChart t={t} />
          <MetricsSidebar formatCurrency={formatCurrencyLocal} t={t} />
        </section>

        {/* Metrics Cards Section */}
        <MetricsCards formatCurrency={formatCurrencyLocal} t={t} />
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="mobile-bottom-nav">
        {menuItems.map((item, index) => (
          <div key={index} className={`bottom-nav-item ${item.active ? 'active' : ''}`}>
            <div className="nav-icon">
              <span style={{ fontSize: '20px' }}>📊</span>
            </div>
            <span className="nav-label">{item.label}</span>
          </div>
        ))}
      </nav>
    </div>
  );
};

export default DashboardPage;


