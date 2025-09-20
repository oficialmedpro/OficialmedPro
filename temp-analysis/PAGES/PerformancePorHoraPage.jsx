import React, { useState, useEffect } from 'react';
import './PerformancePorHoraPage.css';
import FilterBar from '../components/FilterBar';
import TopMenuBar from '../components/TopMenuBar';
import Sidebar from '../components/Sidebar';
import HourlyPerformanceTable from '../components/HourlyPerformanceTable';
import { translations } from '../data/translations';
import { 
  formatCurrency, 
  updateMarketData, 
  fetchUsdRate, 
  handleDatePreset 
} from '../utils/utils';

// Importar bandeiras
import BandeiraEUA from '../../icones/eua.svg';
import BandeiraBrasil from '../../icones/brasil.svg';

const PerformancePorHoraPage = ({ onLogout }) => {
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
  const [selectedPeriod, setSelectedPeriod] = useState('today');
  const [selectedFunnel, setSelectedFunnel] = useState('all');
  const [selectedUnit, setSelectedUnit] = useState('all');
  const [selectedOrigin, setSelectedOrigin] = useState('all');
  const [unitFilterValue, setUnitFilterValue] = useState(null);
  const [statusFilterValue, setStatusFilterValue] = useState(null);
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
  }, []);

  // Inicializar datas padrão
  useEffect(() => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    setStartDate(today.toISOString().split('T')[0]);
    setEndDate(today.toISOString().split('T')[0]);
  }, []);

  // Funções de controle do sidebar
  const toggleSidebar = () => {
    setSidebarExpanded(!sidebarExpanded);
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  // Funções de controle do tema
  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  // Função de controle de tela cheia
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  // Função de mudança de idioma
  const changeLanguage = (language) => {
    setCurrentLanguage(language);
  };

  // Handlers para filtros
  const handleUnitFilterChange = (filterValue) => {
    console.log('🎯 PerformancePorHoraPage: Filtro de unidade alterado:', filterValue);
    setUnitFilterValue(filterValue);
  };

  const handleSellerFilterChange = (filterValue) => {
    console.log('🎯 PerformancePorHoraPage: Filtro de vendedor alterado:', filterValue);
    setStatusFilterValue(filterValue);
  };

  const handleOriginFilterChange = (filterValue) => {
    console.log('🎯 PerformancePorHoraPage: Filtro de origem alterado:', filterValue);
    // Implementar lógica de filtro de origem se necessário
  };

  const handleStatusFilterChange = (filterValue) => {
    console.log('🎯 PerformancePorHoraPage: Filtro de status alterado:', filterValue);
    setStatusFilterValue(filterValue);
  };

  return (
    <div className={`dashboard-container ${isDarkMode ? 'dark-theme' : 'light-theme'}`}>
      {/* Menu Mobile Overlay */}
      {mobileMenuOpen && (
        <div className="mobile-menu-overlay" onClick={closeMobileMenu}>
          <div className="mobile-menu-content" onClick={(e) => e.stopPropagation()}>
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
        <div className="dashboard-layout">
          {/* Sidebar */}
          <Sidebar 
            sidebarExpanded={sidebarExpanded}
            isDarkMode={isDarkMode}
            currentLanguage={currentLanguage}
            translations={t}
            isMobile={false}
            onClose={closeMobileMenu}
            toggleTheme={toggleTheme}
            toggleFullscreen={toggleFullscreen}
            changeLanguage={changeLanguage}
          />

          {/* Content Area */}
          <div className="content-area">
            {/* Header da página */}
            <div className="page-header">
              <div className="page-title">
                <h1>Performance por Ronda</h1>
                <p>Análise de performance por horário de rondas comerciais</p>
              </div>
            </div>

            {/* Componente principal - Tabela de Performance por Hora */}
            <HourlyPerformanceTable
              startDate={startDate}
              endDate={endDate}
              selectedFunnel={selectedFunnel}
              selectedUnit={selectedUnit}
              selectedSeller={selectedSeller}
              selectedSellerName={selectedSellerName}
              selectedOrigin={selectedOrigin}
              t={t}
            />
          </div>
        </div>
      </main>
    </div>
  );
};

export default PerformancePorHoraPage;

