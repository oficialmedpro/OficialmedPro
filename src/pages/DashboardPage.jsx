import React, { useState, useEffect } from 'react';
import { User } from 'lucide-react';
import MetaMesBar from '../components/MetaMesBar';
import './DashboardPage.css';
import './DashboardPageFunnel.css';
import FilterBar from '../components/FilterBar';
import TopMenuBar from '../components/TopMenuBar';
import Sidebar from '../components/Sidebar';
import FunnelChart from '../components/FunnelChart';
import StatsSection from '../components/StatsSection';
import MetricsSidebar from '../components/MetricsSidebar';
import { translations } from '../data/translations';
import { getStatsCards, getMenuItems } from '../data/statsData';
import {
  formatCurrency,
  updateMarketData,
  fetchUsdRate,
  handleDatePreset
} from '../utils/utils';
import { getFunilCompraPorUnidade } from '../service/FilterBarService';

// Importar bandeiras
import BandeiraEUA from '../../icones/eua.svg';
import BandeiraBrasil from '../../icones/brasil.svg';

const DashboardPage = ({ onLogout }) => {
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
  const [selectedUnit, setSelectedUnit] = useState('[1]'); // Unidade padrão Apucarana
  const [selectedOrigin, setSelectedOrigin] = useState('all');
  const [unitFilterValue, setUnitFilterValue] = useState(null); // Novo estado para o valor do filtro
  const [statusFilterValue, setStatusFilterValue] = useState(null); // Novo estado para o filtro de status
  const [marketData, setMarketData] = useState({
    usd: 5.20,
    eur: 5.45,
    ibov: 125432,
    lastUpdate: new Date()
  });

  // Traduções
  const t = translations[currentLanguage];

  // Filtrar funis automaticamente quando a unidade for [1] (Apucarana)
  useEffect(() => {
    if (selectedUnit === '[1]') {
      console.log('🏢 DashboardPage: Unidade [1] selecionada - filtrando funis da Apucarana');
      // Atualizar o unitFilterValue para mostrar a unidade selecionada no FilterBar
      setUnitFilterValue('[1]');
      // Manter 'all' para mostrar todos os funis da unidade [1]
      // O FunnelChart já filtra por unidade automaticamente
    }
  }, [selectedUnit]);

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

  // Inicializar datas baseado no período padrão (apenas uma vez)
  useEffect(() => {
    if (selectedPeriod === 'today' && !startDate && !endDate) {
      console.log('🗓️ Inicializando datas para o período padrão:', selectedPeriod);
      const { start, end } = handleDatePreset(selectedPeriod);
      if (start && end) {
        setStartDate(start);
        setEndDate(end);
        console.log('📅 Datas inicializadas:', { start, end });
      }
    }
  }, [selectedPeriod]);

  // 🎯 Auto-configurar página de análise de funil
  useEffect(() => {
    const currentPath = window.location.pathname;

    console.log('🔍 DashboardPage useEffect - URL atual:', currentPath);
    console.log('🔍 DashboardPage useEffect - selectedUnit:', selectedUnit);

    if (currentPath === '/analise-funil') {
      console.log('🎯 Detectada página de análise de funil - configurando automaticamente');

      // Se já temos uma unidade selecionada, buscar funil de compra
      if (selectedUnit && selectedUnit !== 'all') {
        console.log('🎯 Unidade já selecionada:', selectedUnit, '- Buscando funil de compra');
        handleAutoSelectFunnelForAnalysis(selectedUnit);
      } else {
        // Se não há unidade, forçar exibição de funil assim que uma for selecionada
        console.log('💡 Aguardando seleção de unidade para mostrar funil de compra. Unidade atual:', selectedUnit);
      }
    } else {
      console.log('📄 Não é página de análise de funil. URL atual:', currentPath);
    }
  }, [selectedUnit]); // Reexecutar quando selectedUnit mudar

  // 🎯 Função para auto-selecionar funil de compra na análise de funil
  const handleAutoSelectFunnelForAnalysis = async (unitId) => {
    if (!unitId || unitId === 'all') return;

    try {
      console.log('🔍 Página Análise Funil: Buscando funil de compra para unidade:', unitId);
      const funilCompra = await getFunilCompraPorUnidade(unitId);

      if (funilCompra) {
        console.log('✅ Página Análise Funil: Funil de compra encontrado:', funilCompra.nome_funil, 'ID:', funilCompra.id_funil_sprint);
        setSelectedFunnel(funilCompra.id_funil_sprint.toString());
      } else {
        console.log('⚠️ Página Análise Funil: Nenhum funil de compra encontrado para unidade:', unitId);
      }
    } catch (error) {
      console.error('❌ Página Análise Funil: Erro ao buscar funil de compra:', error);
    }
  };

  // Funções de controle
  
  // 🎯 Função para lidar com mudanças no filtro de unidade
  const handleUnitFilterChange = (filterValue) => {
    setUnitFilterValue(filterValue);
    console.log(`🎯 Dashboard: Filtro de unidade alterado para:`, filterValue);
    
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
    console.log(`🎯 Dashboard: Filtro de status alterado para:`, filterData);
    
    // Aqui você pode implementar a lógica para filtrar as oportunidades
    // baseado no status selecionado
    console.log(`🔍 Filtrando oportunidades com ${filterData.field} = "${filterData.value}"`);
    console.log(`📝 Descrição: ${filterData.description}`);
    
    // TODO: Implementar filtro nas oportunidades
    // Exemplo: filtrar oportunidades onde filterData.field = filterData.value
  };

  // 🎯 Função para lidar com mudanças no filtro de vendedor
  const handleSellerFilterChange = (filterValue) => {
    console.log(`🎯 Dashboard: Filtro de vendedor alterado para:`, filterValue);
    
    // Aqui você pode implementar a lógica para filtrar as oportunidades
    // baseado no vendedor selecionado
    if (filterValue) {
      console.log(`🔍 Filtrando oportunidades com user_id = "${filterValue}"`);
    } else {
      console.log(`🌐 Mostrando todos os vendedores (sem filtro de vendedor)`);
    }
  };

  // 🎯 Função para lidar com mudanças no filtro de origem
  const handleOriginFilterChange = (filterValue) => {
    console.log(`🎯 Dashboard: Filtro de origem alterado para:`, filterValue);
    
    // Aqui você pode implementar a lógica para filtrar as oportunidades
    // baseado na origem selecionada
    if (filterValue) {
      console.log(`🔍 Filtrando oportunidades com origem_oportunidade = "${filterValue}"`);
    } else {
      console.log(`🌐 Mostrando todas as origens (sem filtro de origem)`);
    }
    
    // CORREÇÃO: O filtro estava sendo aplicado mas não passado para os componentes
    // Isso acontece porque o selectedOrigin já é atualizado pelo FilterBar via setSelectedOrigin
    // e os componentes já recebem selectedOrigin como prop
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
          {/* Meta do Mês Bar - Sempre visível, antes do StatsSection */}
          <MetaMesBar 
            startDate={startDate}
            endDate={endDate}
            selectedFunnel={selectedFunnel}
            selectedUnit={selectedUnit}
            selectedSeller={selectedSeller}
            selectedOrigin={selectedOrigin}
          />

          {/* Stats Section - Mostra dados de todas as unidades por padrão, filtra quando unidade selecionada */}
          <>
            {/* Debug: Verificar valores antes de passar para StatsSection */}
            {console.log('🎨 DashboardPage: Passando para StatsSection:', {
              startDate,
              endDate,
              selectedFunnel,
              selectedUnit,
              selectedSeller,
              selectedOrigin
            })}
            <StatsSection 
                statsCards={statsCards} 
                startDate={startDate}
                endDate={endDate}
                selectedFunnel={selectedFunnel}
                selectedUnit={selectedUnit}
                selectedSeller="all" // Sempre "all" para dados gerais
                selectedOrigin={selectedOrigin}
                vendedorId={null} // Sempre dados gerais
                title="Dados Gerais"
              />
          </>

          {/* Stats Section do Vendedor - Aparece apenas quando vendedor específico está selecionado */}
          {selectedSeller && selectedSeller !== 'all' && (
            <>
              {/* Linha com nome do vendedor */}
              <div className="vendedor-separator">
                <div className="vendedor-separator-line"></div>
                <div className="vendedor-separator-name">
                  <User size={20} />
                  Vendedor: {selectedSellerName || 'Vendedor Selecionado'}
                </div>
                <div className="vendedor-separator-line"></div>
              </div>
              
              <StatsSection 
                  statsCards={statsCards} 
                  startDate={startDate}
                  endDate={endDate}
                  selectedFunnel={selectedFunnel}
                  selectedUnit={selectedUnit}
                  selectedSeller={selectedSeller}
                  selectedOrigin={selectedOrigin}
                  vendedorId={selectedSeller} // Dados filtrados por vendedor
                  title="Dados do Vendedor"
                />
            </>
          )}

          {/* Chart Section - lógica especial para página de análise de funil */}
          {(() => {
            const currentPath = window.location.pathname;
            const isAnalisisFunilPage = currentPath === '/analise-funil';

            // Na página de análise de funil, mostrar quando tiver unidade selecionada
            const shouldShowChart = isAnalisisFunilPage
              ? (selectedUnit && selectedUnit !== 'all')
              : (selectedUnit && selectedUnit !== 'all' && selectedFunnel && selectedFunnel !== 'all');

            console.log('🎨 CHART-SECTION: Verificando condições para mostrar funil:', {
              currentPath,
              isAnalisisFunilPage,
              selectedUnit,
              selectedUnitType: typeof selectedUnit,
              selectedUnitNotAll: selectedUnit !== 'all',
              selectedFunnel,
              selectedFunnelType: typeof selectedFunnel,
              selectedFunnelNotAll: selectedFunnel !== 'all',
              shouldShowChart,
              decision: shouldShowChart ? 'MOSTRAR CHART' : 'NÃO MOSTRAR CHART'
            });

            return shouldShowChart;
          })() && (
            <section className="chart-section">
              {console.log('🔍 DashboardPage: Props sendo passadas para FunnelChart:', {
                selectedFunnel,
                selectedUnit,
                selectedSeller,
                selectedOrigin,
                selectedOriginType: typeof selectedOrigin
              })}
              <FunnelChart 
                t={t} 
                selectedFunnel={selectedFunnel}
                selectedUnit={selectedUnit}
                selectedSeller={selectedSeller}
                selectedOrigin={selectedOrigin}
                startDate={startDate}
                endDate={endDate}
                selectedPeriod={selectedPeriod}
              />
            </section>
          )}

          {/* Metrics Sidebar - Aparece apenas quando chart-section estiver visível */}
          {(() => {
            const currentPath = window.location.pathname;
            const isAnalisisFunilPage = currentPath === '/analise-funil';

            // Mesma lógica que determina se chart-section aparece
            const shouldShowMetrics = isAnalisisFunilPage
              ? (selectedUnit && selectedUnit !== 'all')
              : (selectedUnit && selectedUnit !== 'all' && selectedFunnel && selectedFunnel !== 'all');

            return shouldShowMetrics;
          })() && (
            <section className="metrics-sidebar-section">
              <MetricsSidebar
                formatCurrency={formatCurrencyLocal}
                t={t}
                selectedPeriod={selectedPeriod}
                startDate={startDate}
                endDate={endDate}
                selectedUnit={selectedUnit}
                selectedFunnel={selectedFunnel}
                selectedSeller={selectedSeller}
              />
            </section>
          )}

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

export default DashboardPage;


