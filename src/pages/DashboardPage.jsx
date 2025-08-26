import React, { useState, useEffect, useRef } from 'react';
import './DashboardPage.css';
import MetricsSidebar from '../components/MetricsSidebar';
import FilterBar from '../components/FilterBar';
import TopMenuBar from '../components/TopMenuBar';
import Sidebar from '../components/Sidebar';

// Importar ícones SVG (mantidos para mobile e outros usos)
import LogoIcon from '../../icones/icone_logo.svg';


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
  const [selectedStatus, setSelectedStatus] = useState('sale'); // Status padrão: Venda
  const [selectedSeller, setSelectedSeller] = useState('all'); // Vendedor padrão: Todos
  const [selectedPeriod, setSelectedPeriod] = useState('today'); // Período padrão: Hoje
  const [selectedFunnel, setSelectedFunnel] = useState('all'); // Funil padrão: Todos
  const [selectedUnit, setSelectedUnit] = useState('all'); // Unidade padrão: Todas
  const [marketData, setMarketData] = useState({
    usd: 5.20,
    eur: 5.45,
    ibov: 125432,
    lastUpdate: new Date()
  });
  


  // Atualizar dados de mercado automaticamente
  useEffect(() => {
    // Atualizar imediatamente
    updateMarketData();
    
    // Atualizar a cada 30 segundos
    const interval = setInterval(updateMarketData, 30000);
    
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

    // Atualizar a cada minuto
    const timeInterval = setInterval(updateTime, 60000);
    
    return () => clearInterval(timeInterval);
  }, []);

  // Função para atualizar dados de mercado
  const updateMarketData = async () => {
    try {
      // Simulação de API - em produção, usar APIs reais como Alpha Vantage, Yahoo Finance, etc.
      const mockData = {
        usd: (Math.random() * (5.30 - 5.10) + 5.10).toFixed(2),
        eur: (Math.random() * (5.60 - 5.40) + 5.40).toFixed(2),
        ibov: Math.floor(Math.random() * (127000 - 124000) + 124000),
        lastUpdate: new Date()
      };
      
      setMarketData(mockData);
    } catch (error) {
      console.error('Erro ao atualizar dados de mercado:', error);
    }
  };

  // Hook para animação de contagem
  const useCountUp = (end, duration = 2000) => {
    const [count, setCount] = useState(0);
    const frameRef = useRef();
    
    useEffect(() => {
      let startTime = null;
      const startValue = 0;
      
      const animate = (currentTime) => {
        if (!startTime) startTime = currentTime;
        const progress = Math.min((currentTime - startTime) / duration, 1);
        
        const currentCount = Math.floor(progress * (end - startValue) + startValue);
        setCount(currentCount);
        
        if (progress < 1) {
          frameRef.current = requestAnimationFrame(animate);
        }
      };
      
      frameRef.current = requestAnimationFrame(animate);
      
      return () => {
        if (frameRef.current) {
          cancelAnimationFrame(frameRef.current);
        }
      };
    }, [end, duration]);
    
    return count;
  };

  // Componente para termômetro semicircular de performance
  const PerformanceThermometer = ({ currentValue, previousValue, change, isPositive, color }) => {
    const current = parseInt(currentValue.toString().replace(/[^\d]/g, ''));
    const previous = parseInt(previousValue.toString().replace(/[^\d]/g, ''));
    
    // Calcular performance relativa (0-100)
    const performanceRatio = previous > 0 ? (current / previous) : 1;
    const performanceScore = Math.min(Math.max(performanceRatio * 100, 0), 200); // 0 a 200%
    
    // Determinar cor baseada na performance
    const getThermometerColor = () => {
      if (performanceScore >= 120) return '#10b981'; // Verde - Excelente
      if (performanceScore >= 100) return '#fbbf24'; // Amarelo - Bom
      if (performanceScore >= 80) return '#f59e0b'; // Laranja - Regular
      return '#ef4444'; // Vermelho - Ruim
    };
    
    // Calcular ângulo do ponteiro (0° = vermelho/esquerda, 180° = verde/direita)
    const angle = Math.min((performanceScore / 200) * 180, 180);
    
    return (
      <div className="performance-thermometer">
        {/* Termômetro semicircular */}
        <div className="thermometer-gauge">
          <svg width="240" height="135" viewBox="0 0 240 135" className="thermometer-svg">
            {/* Gradiente do termômetro */}
            <defs>
              <linearGradient id={`thermo-gradient-${color}`} x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#ef4444" />
                <stop offset="40%" stopColor="#f59e0b" />
                <stop offset="70%" stopColor="#fbbf24" />
                <stop offset="100%" stopColor="#10b981" />
              </linearGradient>
            </defs>
            
            {/* Arco do termômetro */}
            <path
              d="M 45 105 A 75 75 0 0 1 195 105"
              stroke={`url(#thermo-gradient-${color})`}
              strokeWidth="15"
              fill="none"
              strokeLinecap="round"
              className="thermometer-arc"
            />
            
            {/* Marcações de escala - apenas pontos sem números */}
            {[0, 50, 100, 150, 200].map((mark, index) => {
              const markAngle = (mark / 200) * 180;
              const radians = (markAngle - 90) * Math.PI / 180;
              const x = 120 + 67 * Math.cos(radians);
              const y = 105 + 67 * Math.sin(radians);
              return (
                <circle
                  key={index}
                  cx={x}
                  cy={y}
                  r="3.5"
                  fill="rgba(255, 255, 255, 0.8)"
                />
              );
            })}
            
            {/* Ponteiro do termômetro */}
            <g 
              className="thermometer-pointer" 
              style={{ 
                transformOrigin: '120px 105px',
                transform: `rotate(${angle - 90}deg)`,
                transition: 'transform 2s cubic-bezier(0.4, 0, 0.2, 1)'
              }}
            >
              <line
                x1="120"
                y1="105"
                x2="120"
                y2="45"
                stroke="#ffffff"
                strokeWidth="7"
                strokeLinecap="round"
                filter="drop-shadow(0 3px 8px rgba(0,0,0,0.4))"
              />
              <circle
                cx="120"
                cy="105"
                r="9"
                fill="#ffffff"
                filter="drop-shadow(0 3px 8px rgba(0,0,0,0.4))"
              />
            </g>
            
          </svg>
        </div>
      </div>
    );
  };



  // Buscar cotação do dólar
  useEffect(() => {
    const fetchUsdRate = async () => {
      try {
        setIsLoadingRate(true);
        // API gratuita para cotação do dólar
        const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
        const data = await response.json();
        
        if (data.rates && data.rates.BRL) {
          setUsdRate(data.rates.BRL);
        }
      } catch (error) {
        console.log('Erro ao buscar cotação, usando taxa padrão:', error);
        // Em caso de erro, mantém a taxa padrão
        setUsdRate(5.0);
      } finally {
        setIsLoadingRate(false);
      }
    };

    fetchUsdRate();
    
    // Atualizar a cada 1 hora
    const interval = setInterval(fetchUsdRate, 60 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  // Função para converter valores
  const convertCurrency = (value, fromCurrency = 'BRL') => {
    if (fromCurrency === 'USD') return value;
    
    // Remove formatação e converte para número
    const numericValue = parseFloat(value.toString().replace(/[^\d.,]/g, '').replace(',', '.'));
    
    if (isNaN(numericValue)) return value;
    
    // Converte para dólar
    const usdValue = numericValue / usdRate;
    
    return usdValue;
  };

  // Função para formatar valores baseado no idioma
  const formatCurrency = (value, originalCurrency = 'BRL') => {
    if (currentLanguage === 'pt-BR') {
      // Formata em reais
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      }).format(value);
    } else {
      // Formata em dólares
      const usdValue = convertCurrency(value, originalCurrency);
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
      }).format(usdValue);
    }
  };

  // Função para formatar valores grandes (k, M, B)
  const formatLargeNumber = (value, originalCurrency = 'BRL') => {
    if (currentLanguage === 'pt-BR') {
      return value; // Mantém formato original em português
    } else {
      // Converte para dólar e formata
      const usdValue = convertCurrency(value, originalCurrency);
      
      if (usdValue >= 1000000000) {
        return `$${(usdValue / 1000000000).toFixed(1)}B`;
      } else if (usdValue >= 1000000) {
        return `$${(usdValue / 1000000).toFixed(1)}M`;
      } else if (usdValue >= 1000) {
        return `$${(usdValue / 1000).toFixed(1)}k`;
      } else {
        return `$${usdValue.toFixed(0)}`;
      }
    }
  };

  // Traduções
  const translations = {
    'pt-BR': {
      // Títulos e cabeçalhos
      pageTitle: 'Dashboard',
      pageSubtitle: 'Visão geral das suas métricas e performance',
      statsTitle: 'Métricas Principais',
      chartTitle: 'Funil Comercial - Unidade Apucarana',
      chartPeriod: 'Últimos 30 dias',
      
             // Estatísticas
       totalOpportunities: 'Total de Oportunidades',
       lostOpportunities: 'Oportunidades Perdidas',
       wonOpportunities: 'Oportunidades Ganhas',
       budgetNegotiation: 'Orçamento em Negociação',
       totalValue: 'Valor Total',
      
      // Funil
      entry: 'ENTRADA',
      welcome: 'ACOLHIMENTO',
      qualified: 'QUALIFICADO',
      budget: 'ORÇAMENTO',
      negotiation: 'NEGOCIAÇÃO',
      followUp: 'FOLLOW UP',
      registration: 'CADASTRO',
      
      // Origens
      google: 'Google',
      meta: 'Meta',
      organic: 'Orgânico',
      indication: 'Indicação',
      prescriber: 'Prescritor',
      franchise: 'Franquia',
      others: 'Outros',
      
      // Métricas financeiras
      financialMetrics: 'Valores & Métricas',
      gain: 'Ganho',
      loss: 'Perda',
      averageTicket: 'Ticket Médio',
      
      // Origens oportunidades
      opportunitySources: 'Origens Oportunidades',
      
      // Filtros
      selectPeriod: 'Selecionar Período',
      today: 'Hoje',
      yesterday: 'Ontem',
      last7Days: 'Últimos 7 dias',
      thisMonth: 'Este mês',
      thisQuarter: 'Este trimestre',
      thisYear: 'Este ano',
      custom: 'Personalizado',
      apply: 'Aplicar',
      cancel: 'Cancelar',
      startDate: 'Data Inicial',
      endDate: 'Data Final',
      
      // Menu
      funilCompra: 'Funil Compra',
      funilRecompra: 'Funil Recompra',
      funilsAdm: 'Funils Adm',
      funilComercial: 'Funil Comercial',
      
      // Busca
      searchPlaceholder: 'Buscar...',
      
      // Botões
      fullscreen: 'Tela cheia',
      themeToggle: 'Alternar tema',
      notifications: 'Notificações',
      messages: 'Mensagens',
      
      // Usuário
      userName: 'Usuário',
      userEmail: 'usuario@oficialmed.com',
      
      // Filtros de funil
      allFunnels: 'Todos os funis',
      purchaseFunnel: 'Funil de Compra',
      repurchaseFunnel: 'Funil de Recompra',
      status: 'Status',
      sale: 'Venda',
      won: 'Ganho',
      registered: 'Cadastrado'
    },
    'en-US': {
      // Titles and headers
      pageTitle: 'Dashboard',
      pageSubtitle: 'Overview of your metrics and performance',
      statsTitle: 'Key Metrics',
      chartTitle: 'Commercial Funnel - Apucarana Unit',
      chartPeriod: 'Last 30 days',
      
             // Statistics
       totalOpportunities: 'Total Opportunities',
       lostOpportunities: 'Lost Opportunities',
       wonOpportunities: 'Won Opportunities',
       budgetNegotiation: 'Budget in Negotiation',
       totalValue: 'Total Value',
      
      // Funnel
      entry: 'ENTRY',
      welcome: 'WELCOME',
      qualified: 'QUALIFIED',
      budget: 'BUDGET',
      negotiation: 'NEGOTIATION',
      followUp: 'FOLLOW UP',
      registration: 'REGISTRATION',
      
      // Sources
      google: 'Google',
      meta: 'Meta',
      organic: 'Organic',
      indication: 'Indication',
      prescriber: 'Prescriber',
      franchise: 'Franchise',
      others: 'Others',
      
      // Financial metrics
      financialMetrics: 'Values & Metrics',
      gain: 'Gain',
      loss: 'Loss',
      averageTicket: 'Average Ticket',
      
      // Opportunity sources
      opportunitySources: 'Opportunity Sources',
      
      // Filters
      selectPeriod: 'Select Period',
      today: 'Today',
      yesterday: 'Yesterday',
      last7Days: 'Last 7 days',
      thisMonth: 'This month',
      thisQuarter: 'This quarter',
      thisYear: 'This year',
      custom: 'Custom',
      apply: 'Apply',
      cancel: 'Cancel',
      startDate: 'Start Date',
      endDate: 'End Date',
      
      // Menu
      funilCompra: 'Purchase Funnel',
      funilRecompra: 'Repurchase Funnel',
      funilsAdm: 'Admin Funnels',
      funilComercial: 'Commercial Funnel',
      
      // Search
      searchPlaceholder: 'Search...',
      
      // Buttons
      fullscreen: 'Fullscreen',
      themeToggle: 'Toggle theme',
      notifications: 'Notifications',
      messages: 'Messages',
      
      // User
      userName: 'User',
      userEmail: 'user@oficialmed.com',
      
      // Funnel filters
      allFunnels: 'All Funnels',
      purchaseFunnel: 'Purchase Funnel',
      repurchaseFunnel: 'Repurchase Funnel',
      status: 'Status',
      sale: 'Sale',
      won: 'Won',
      registered: 'Registered'
    }
  };

  const t = translations[currentLanguage];

     const toggleSidebar = () => {
     setSidebarExpanded(!sidebarExpanded);
   };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
    // Aplicar classe do tema ao container principal
    const container = document.querySelector('.dashboard-container');
    if (container) {
      if (isDarkMode) {
        container.classList.add('light-theme');
      } else {
        container.classList.remove('light-theme');
      }
    }
  };

  const changeLanguage = (language) => {
    setCurrentLanguage(language);
  };

  const handleDatePreset = (preset) => {
    const today = new Date();
    let start, end;
    
    switch (preset) {
      case 'today':
        start = end = today;
        break;
      case 'yesterday':
        start = end = new Date(today.getTime() - 24 * 60 * 60 * 1000);
        break;
      case 'last7Days':
        start = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        end = today;
        break;
      case 'thisMonth':
        start = new Date(today.getFullYear(), today.getMonth(), 1);
        end = today;
        break;
      case 'thisQuarter':
        const quarter = Math.floor(today.getMonth() / 3);
        start = new Date(today.getFullYear(), quarter * 3, 1);
        end = today;
        break;
      case 'thisYear':
        start = new Date(today.getFullYear(), 0, 1);
        end = today;
        break;
      default:
        return;
    }
    
    setStartDate(start.toISOString().split('T')[0]);
    setEndDate(end.toISOString().split('T')[0]);
    setShowCalendar(false);
  };

  const applyCustomDates = () => {
    if (startDate && endDate && startDate <= endDate) {
      setShowCalendar(false);
    }
  };



  const menuItems = [
    { icon: 'funil-compra', label: t.funilCompra, active: true },
    { icon: 'funil-recompra', label: t.funilRecompra, active: false }
  ];



  const statsCards = [
    { 
      title: t.totalOpportunities, 
      value: '1,234', 
      color: 'blue', 
      progress: 75, 
      isOpportunity: true, 
      opportunityValue: 'R$ 3.2M',
      previousValue: '1,156',
      change: '+6.7%',
      isPositive: true,
      meta: '2300',
      metaPercentage: '54%'
    },
    { 
      title: t.lostOpportunities, 
      value: '89', 
      color: 'red', 
      progress: 45, 
      isOpportunity: true, 
      opportunityValue: 'R$ 890k',
      previousValue: '92',
      change: '-3.3%',
      isPositive: false,
      meta: '120',
      metaPercentage: '74%'
    },
    { 
      title: t.averageTicket, 
      value: '2800', 
      color: 'purple', 
      progress: 85, 
      isCurrency: true, 
      opportunityValue: 'R$ 2.500',
      previousValue: '2650',
      change: '+5.7%',
      isPositive: true,
      meta: '3200',
      metaPercentage: '88%'
    },
    { 
      title: t.budgetNegotiation, 
      value: '73', 
      color: 'orange', 
      progress: 62, 
      isOpportunity: true, 
      opportunityValue: 'R$ 420k',
      previousValue: '68',
      change: '+7.4%',
      isPositive: true,
      meta: '95',
      metaPercentage: '77%'
    },
    { 
      title: t.wonOpportunities, 
      value: '156', 
      color: 'green', 
      progress: 68, 
      isOpportunity: true, 
      opportunityValue: 'R$ 1.56M',
      previousValue: '142',
      change: '+9.9%',
      isPositive: true,
      meta: '200',
      metaPercentage: '78%'
    }
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

      {/* Mobile Header */}
      <header className="mobile-header">
        <button className="mobile-menu-toggle">☰</button>
        <div className="mobile-logo">
          <img src={LogoIcon} alt="Logo" style={{ height: '20px', width: 'auto', maxWidth: '32px' }} />
        </div>
        <div className="mobile-actions">
          <button className="mobile-action-btn">🔍</button>
          <button className="mobile-action-btn">🔔</button>
        </div>
      </header>

      {/* Mobile Sidebar */}
      <div className="mobile-sidebar-overlay">
        <aside className="mobile-sidebar">
          <div className="mobile-sidebar-header">
            <div className="mobile-logo">
              <img src={LogoIcon} alt="Logo" style={{ height: '20px', width: 'auto', maxWidth: '32px' }} />
            </div>
            <button className="close-mobile-sidebar">✕</button>
          </div>
          <nav className="mobile-sidebar-nav">
            {/* Usar o mesmo componente Sidebar para mobile */}
            <Sidebar 
              sidebarExpanded={true}
              isDarkMode={isDarkMode}
              currentLanguage={currentLanguage}
              translations={t}
            />
          </nav>
        </aside>
      </div>

      {/* Main Content */}
      <main className="main-content">
        <div className="content-header">
          {/* Indicadores de mercado, data e horário */}
          <div className="header-left-inline">
            <div className="indicator">
              <span className="indicator-label">USD:</span>
              <span className="indicator-value">R$ {marketData.usd}</span>
              <span className={`indicator-change ${marketData.usd > 5.20 ? 'positive' : 'negative'}`}>
                {marketData.usd > 5.20 ? '↗' : '↘'}
              </span>
            </div>
            
            <div className="indicator">
              <span className="indicator-label">EUR:</span>
              <span className="indicator-value">R$ {marketData.eur}</span>
              <span className={`indicator-change ${marketData.eur > 5.50 ? 'positive' : 'negative'}`}>
                {marketData.eur > 5.50 ? '↗' : '↘'}
              </span>
            </div>
            
            <div className="indicator">
              <span className="indicator-label">IBOV:</span>
              <span className="indicator-value">{marketData.ibov.toLocaleString()}</span>
              <span className={`indicator-change ${marketData.ibov > 125000 ? 'positive' : 'negative'}`}>
                {marketData.ibov > 125000 ? '↗' : '↘'}
              </span>
            </div>

            <div className="datetime-box">
              <div className="date-box">
                <span className="datetime-label">📅</span>
                <span className="datetime-value">
                  {new Date().toLocaleDateString('pt-BR', { 
                    day: '2-digit', 
                    month: '2-digit', 
                    year: 'numeric' 
                  })}
                </span>
              </div>
              
              <div className="time-box">
                <span className="datetime-label">🕒</span>
                <span className="datetime-value" id="current-time">
                  {new Date().toLocaleTimeString('pt-BR', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </span>
              </div>
            </div>
          </div>

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
        <section className="stats-section">
          <div className="stats-grid">
            {statsCards.map((card, index) => (
              <div key={index} className={`stat-card ${card.color}`}>
                {/* Header com título e métricas */}
                <div className="stat-header-new">
                  <div className="header-content">
                    <span className="stat-title">{card.title}</span>
                    <div className="header-metrics">
                      <div className="stat-value">
                        {(() => {
                          const count = useCountUp(parseInt(card.value.replace(/,/g, '')), 1500);
                          if (card.isCurrency) {
                            return `R$ ${count.toLocaleString()}`;
                          } else {
                            return count.toLocaleString();
                          }
                        })()}
                      </div>
                      {(card.isOpportunity || card.isCurrency) && (
                        <div className="opportunity-value">
                          {card.opportunityValue}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Termômetro grande no centro */}
                <div className="stat-thermometer-center">
                  <PerformanceThermometer 
                    currentValue={card.value}
                    previousValue={card.previousValue}
                    change={card.change}
                    isPositive={card.isPositive}
                    color={card.color}
                  />
                </div>
                
                {/* Meta na parte inferior */}
                <div className="stat-meta">
                  <div className="meta-info">
                    <span className="meta-label">META</span>
                    <span className="meta-value">
                      {card.isCurrency ? `R$ ${parseInt(card.meta).toLocaleString()}` : card.meta}
                    </span>
                  </div>
                  <div className="meta-percentage">
                    {card.metaPercentage}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Chart Section */}
        <section className="chart-section">
          <div className="main-chart">
            <div className="chart-header">
              <h3>{t.chartTitle}</h3>
              <span className="chart-period">{t.chartPeriod}</span>
            </div>

            <div className="funnel-container">
              <div className="sources-bar">
                <div className="source-item google">
                  <span className="source-label">{t.google}</span>
                  <div className="source-value">
                    <span className="source-percentage">45%</span>
                    <span>/</span>
                    <span className="source-count">2.3k</span>
                  </div>
                </div>
                <div className="source-item meta">
                  <span className="source-label">{t.meta}</span>
                  <div className="source-value">
                    <span className="source-percentage">28%</span>
                    <span>/</span>
                    <span className="source-count">1.4k</span>
                  </div>
                </div>
                <div className="source-item organic">
                  <span className="source-label">{t.organic}</span>
                  <div className="source-value">
                    <span className="source-percentage">15%</span>
                    <span>/</span>
                    <span className="source-count">750</span>
                  </div>
                </div>
                <div className="source-item indicacao">
                  <span className="source-label">{t.indication}</span>
                  <div className="source-value">
                    <span className="source-percentage">8%</span>
                    <span>/</span>
                    <span className="source-count">400</span>
                  </div>
                </div>
                <div className="source-item prescritor">
                  <span className="source-label">{t.prescriber}</span>
                  <div className="source-value">
                    <span className="source-percentage">3%</span>
                    <span>/</span>
                    <span className="source-count">150</span>
                  </div>
                </div>
                <div className="source-item franquia">
                  <span className="source-label">{t.franchise}</span>
                  <div className="source-value">
                    <span className="source-percentage">1%</span>
                    <span>/</span>
                    <span className="source-count">50</span>
                  </div>
                </div>
              </div>

              <div className="funnel-stage" data-stage="0">
                <div className="funnel-bar">
                  <div className="funnel-content">
                    <span className="funnel-label">{t.entry}</span>
                    <div className="funnel-values">
                      <span className="funnel-value">2.3k</span>
                      <span className="funnel-loss">-150</span>
                    </div>
                  </div>
                </div>
                <div className="conversion-rate-box">39,0%</div>
              </div>

              <div className="funnel-stage" data-stage="1">
                <div className="funnel-bar">
                  <div className="funnel-content">
                    <span className="funnel-label">{t.welcome}</span>
                    <div className="funnel-values">
                      <span className="funnel-value">897</span>
                      <span className="funnel-loss">-433</span>
                    </div>
                  </div>
                </div>
                <div className="conversion-rate-box">70,8%</div>
              </div>

              <div className="funnel-stage" data-stage="2">
                <div className="funnel-bar">
                  <div className="funnel-content">
                    <span className="funnel-label">{t.qualified}</span>
                    <div className="funnel-values">
                      <span className="funnel-value">635</span>
                      <span className="funnel-loss">-262</span>
                    </div>
                  </div>
                </div>
                <div className="conversion-rate-box">58,7%</div>
              </div>

              <div className="funnel-stage" data-stage="3">
                <div className="funnel-bar">
                  <div className="funnel-content">
                    <span className="funnel-label">{t.budget}</span>
                    <div className="funnel-values">
                      <span className="funnel-value">373</span>
                      <span className="funnel-loss">-187</span>
                    </div>
                  </div>
                </div>
                <div className="conversion-rate-box">49,9%</div>
              </div>

              <div className="funnel-stage" data-stage="4">
                <div className="funnel-bar">
                  <div className="funnel-content">
                    <span className="funnel-label">{t.negotiation}</span>
                    <div className="funnel-values">
                      <span className="funnel-value">186</span>
                      <span className="funnel-loss">-93</span>
                    </div>
                  </div>
                </div>
                <div className="conversion-rate-box">50,0%</div>
              </div>

              <div className="funnel-stage" data-stage="5">
                <div className="funnel-bar">
                  <div className="funnel-content">
                    <span className="funnel-label">{t.followUp}</span>
                    <div className="funnel-values">
                      <span className="funnel-value">93</span>
                      <span className="funnel-loss">-47</span>
                    </div>
                  </div>
                </div>
                <div className="conversion-rate-box">50,0%</div>
              </div>

              <div className="funnel-stage" data-stage="6">
                <div className="funnel-bar">
                  <div className="funnel-content">
                    <span className="funnel-label">{t.registration}</span>
                    <div className="funnel-values">
                      <span className="funnel-value">46</span>
                      <span className="funnel-gain">+46</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <MetricsSidebar formatCurrency={formatCurrency} t={t} />
        </section>
      </main>

             {/* Mobile Bottom Navigation */}
       <nav className="mobile-bottom-nav">
         {menuItems.map((item, index) => (
           <div key={index} className={`bottom-nav-item ${item.active ? 'active' : ''}`}>
             <div className="nav-icon">
               {/* Ícone simples para mobile - sem renderIcon */}
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


