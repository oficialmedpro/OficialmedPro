import React, { useState, useEffect } from 'react';
import './MetasPage.css';
import FilterBar from '../components/FilterBar';
import TopMenuBar from '../components/TopMenuBar';
import Sidebar from '../components/Sidebar';
import MetasManager from '../components/MetasManager';
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

const MetasPage = ({ onLogout }) => {
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

  // Estados específicos para Metas (página customizada)
  const [metasData, setMetasData] = useState(null);
  const [loading, setLoading] = useState(false);

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

  // Configurar datas padrão (últimos 30 dias)
  useEffect(() => {
    const today = new Date();
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 30);

    setStartDate(thirtyDaysAgo.toISOString().split('T')[0]);
    setEndDate(today.toISOString().split('T')[0]);
  }, []);

  // Debug: Log quando os filtros mudam
  useEffect(() => {
    console.log('🔄 MetasPage: Filtros atualizados:', {
      startDate, endDate, selectedFunnel, selectedUnit, selectedSeller, selectedOrigin
    });
  }, [startDate, endDate, selectedFunnel, selectedUnit, selectedSeller, selectedOrigin]);

  // Funções do dashboard
  const toggleSidebar = () => setSidebarExpanded(!sidebarExpanded);
  const toggleMobileMenu = () => setMobileMenuOpen(!mobileMenuOpen);
  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  const changeLanguage = (lang) => setCurrentLanguage(lang);

  const updateUsdRate = async () => {
    setIsLoadingRate(true);
    const rate = await fetchUsdRate();
    if (rate) setUsdRate(rate);
    setIsLoadingRate(false);
  };

  const handleFilterChange = (filterType, value, displayName = null) => {
    console.log(`🔍 Filtro ${filterType} alterado para:`, value, displayName);

    switch (filterType) {
      case 'status':
        setSelectedStatus(value);
        setStatusFilterValue(displayName);
        break;
      case 'seller':
        setSelectedSeller(value);
        setSelectedSellerName(displayName);
        break;
      case 'period':
        setSelectedPeriod(value);
        break;
      case 'funnel':
        setSelectedFunnel(value);
        break;
      case 'unit':
        setSelectedUnit(value);
        setUnitFilterValue(displayName);
        break;
      case 'origin':
        setSelectedOrigin(value);
        break;
      case 'dateRange':
        if (value && value.startDate && value.endDate) {
          setStartDate(value.startDate);
          setEndDate(value.endDate);
        }
        break;
      default:
        console.log('Tipo de filtro não reconhecido:', filterType);
    }
  };

  // Callbacks específicos esperados pelo FilterBar (sem alterar o FilterBar)
  const onUnitFilterChange = (codigoSprintOrNull) => {
    // Quando vier null = todas as unidades
    setSelectedUnit(codigoSprintOrNull || 'all');
    setUnitFilterValue(null);
  };

  const onSellerFilterChange = (sellerIdOrNull) => {
    setSelectedSeller(sellerIdOrNull || 'all');
  };

  const onOriginFilterChange = (originOrNull) => {
    setSelectedOrigin(originOrNull || 'all');
  };

  const onSellerNameChange = (nameOrNull) => {
    setSelectedSellerName(nameOrNull || null);
  };

  const handleDatePresetClick = (preset) => {
    const dates = handleDatePreset(preset);
    if (dates) {
      setStartDate(dates.startDate);
      setEndDate(dates.endDate);
      setSelectedPeriod(preset);
    }
  };

  // Dados das bandeiras para o FilterBar
  const bandeiraData = [
    { src: BandeiraBrasil, alt: 'Brasil', isActive: currentLanguage === 'pt-BR' },
    { src: BandeiraEUA, alt: 'EUA', isActive: currentLanguage === 'en-US' }
  ];

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
        <div className="mobile-menu-overlay" onClick={toggleMobileMenu}>
          <div className="mobile-menu-content" onClick={(e) => e.stopPropagation()}>
            <Sidebar
              sidebarExpanded={true}
              isDarkMode={isDarkMode}
              currentLanguage={currentLanguage}
              translations={t}
              isMobile={true}
              onClose={toggleMobileMenu}
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
        // Estados atuais
        selectedSeller={selectedSeller}
        selectedPeriod={selectedPeriod}
        selectedFunnel={selectedFunnel}
        selectedUnit={selectedUnit}
        selectedOrigin={selectedOrigin}
        startDate={startDate}
        endDate={endDate}
        // Setters que o FilterBar espera
        setSelectedSeller={setSelectedSeller}
        setSelectedPeriod={setSelectedPeriod}
        setSelectedFunnel={setSelectedFunnel}
        setSelectedUnit={setSelectedUnit}
        setSelectedOrigin={setSelectedOrigin}
        setStartDate={setStartDate}
        setEndDate={setEndDate}
        // Callbacks de filtro específicos
        onUnitFilterChange={onUnitFilterChange}
        onSellerFilterChange={onSellerFilterChange}
        onOriginFilterChange={onOriginFilterChange}
        onSellerNameChange={onSellerNameChange}
        // Indicadores de mercado
        marketData={marketData}
      />

      {/* Main Content */}
      <main className="main-content">
        {/* Gerenciador de Metas */}
        <MetasManager
          selectedUnit={selectedUnit}
          selectedFunnel={selectedFunnel}
          selectedOrigin={selectedOrigin}
        />
      </main>
    </div>
  );
};

export default MetasPage;