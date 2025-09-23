import React, { useState, useEffect } from 'react';
import './DashboardPage.css';
import './DashboardPageFunnel.css';
import FilterBar from '../components/FilterBar';
import TopMenuBar from '../components/TopMenuBar';
import Sidebar from '../components/Sidebar';
import MapaDeCalorComponent from '../components/MapaDeCalorComponent';
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

const MapaDeCalorPage = ({ onLogout }) => {
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

  // Inicializar datas baseado no período padrão
  useEffect(() => {
    if (selectedPeriod === 'last7Days' && !startDate && !endDate) {
      console.log('🗓️ Inicializando datas para o período padrão:', selectedPeriod);
      const { start, end } = handleDatePreset(selectedPeriod);
      if (start && end) {
        setStartDate(start);
        setEndDate(end);
        console.log('📅 Datas inicializadas para Mapa de Calor:', { start, end });
      } else {
        console.warn('⚠️ Falha ao obter datas do preset:', selectedPeriod);
      }
    }
  }, [selectedPeriod]);

  // Debug das datas para o mapa de calor
  useEffect(() => {
    console.log('🔥 Mapa de Calor - Estado das datas:', { startDate, endDate, selectedPeriod });
  }, [startDate, endDate, selectedPeriod]);

  // Funções de controle

  // 🎯 Função para lidar com mudanças no filtro de unidade
  const handleUnitFilterChange = (filterValue) => {
    setUnitFilterValue(filterValue);
    console.log(`🎯 Mapa de Calor: Filtro de unidade alterado para:`, filterValue);

    if (filterValue) {
      console.log(`🔍 Filtrando leads com unidade_id = "${filterValue}"`);
    } else {
      console.log(`🌐 Mostrando todos os leads (sem filtro de unidade)`);
    }
  };

  // 🎯 Função para lidar com mudanças no filtro de status
  const handleStatusFilterChange = (filterData) => {
    setStatusFilterValue(filterData);
    console.log(`🎯 Mapa de Calor: Filtro de status alterado para:`, filterData);

    console.log(`🔍 Filtrando leads com ${filterData.field} = "${filterData.value}"`);
    console.log(`📝 Descrição: ${filterData.description}`);
  };

  // 🎯 Função para lidar com mudanças no filtro de vendedor
  const handleSellerFilterChange = (filterValue) => {
    console.log(`🎯 Mapa de Calor: Filtro de vendedor alterado para:`, filterValue);

    if (filterValue) {
      console.log(`🔍 Filtrando leads com user_id = "${filterValue}"`);
    } else {
      console.log(`🌐 Mostrando todos os vendedores (sem filtro de vendedor)`);
    }
  };

  // 🎯 Função para lidar com mudanças no filtro de origem
  const handleOriginFilterChange = (filterValue) => {
    console.log(`🎯 Mapa de Calor: Filtro de origem alterado para:`, filterValue);

    if (filterValue) {
      console.log(`🔍 Filtrando leads com origem_oportunidade = "${filterValue}"`);
    } else {
      console.log(`🌐 Mostrando todas as origens (sem filtro de origem)`);
    }
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
        {/* Mapa de Calor Component */}
        <MapaDeCalorComponent
          t={t}
          startDate={startDate}
          endDate={endDate}
          selectedFunnel={selectedFunnel}
          selectedUnit={selectedUnit}
          selectedSeller={selectedSeller}
          selectedOrigin={selectedOrigin}
        />
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

export default MapaDeCalorPage;