import React, { useState, useEffect } from 'react';
import './DashboardPage.css';

// Importar ícones SVG
import FunilCompraAtivo from '../../icones/funil-compra-ativo.svg';
import FunilCompraNormal from '../../icones/funil-compra-normal.svg';
import FunilRecompraAtivo from '../../icones/funil-recompra-ativo.svg';
import FunilRecompraNormal from '../../icones/funil-recompra-normal.svg';
import LogoIcon from '../../icones/icone_logo.svg';
import LogoIconLight from '../../icones/icone_logo_modo_light.svg';
import LogoOficialmed from '../../icones/icone_oficialmed.svg';
import LogoOficialmedLight from '../../icones/icone_oficialmed_modo_light.svg';
import BandeiraEUA from '../../icones/eua.svg';
import BandeiraBrasil from '../../icones/brasil.svg';

const DashboardPage = () => {
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [showCalendar, setShowCalendar] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState('pt-BR');
  const [usdRate, setUsdRate] = useState(5.0); // Taxa padrão como fallback
  const [isLoadingRate, setIsLoadingRate] = useState(true);

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
      chartTitle: 'Funil de Conversão',
      chartPeriod: 'Últimos 30 dias',
      
      // Estatísticas
      totalOpportunities: 'Total de Oportunidades',
      lostOpportunities: 'Oportunidades Perdidas',
      wonOpportunities: 'Oportunidades Ganhas',
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
      repurchaseFunnel: 'Funil de Recompra'
    },
    'en-US': {
      // Titles and headers
      pageTitle: 'Dashboard',
      pageSubtitle: 'Overview of your metrics and performance',
      statsTitle: 'Key Metrics',
      chartTitle: 'Conversion Funnel',
      chartPeriod: 'Last 30 days',
      
      // Statistics
      totalOpportunities: 'Total Opportunities',
      lostOpportunities: 'Lost Opportunities',
      wonOpportunities: 'Won Opportunities',
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
      repurchaseFunnel: 'Repurchase Funnel'
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

  const toggleLanguageDropdown = () => {
    setShowLanguageDropdown(!showLanguageDropdown);
  };

  const changeLanguage = (language) => {
    setCurrentLanguage(language);
    setShowLanguageDropdown(false);
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

  const renderIcon = (iconType, isActive = false) => {
    switch (iconType) {
      case 'funil-compra':
        return isActive ? <img src={FunilCompraAtivo} alt="Funil Compra Ativo" style={{ height: '20px', width: 'auto' }} /> : <img src={FunilCompraNormal} alt="Funil Compra Normal" style={{ height: '20px', width: 'auto' }} />;
      case 'funil-recompra':
        return isActive ? <img src={FunilRecompraAtivo} alt="Funil Recompra Ativo" style={{ height: '20px', width: 'auto' }} /> : <img src={FunilRecompraNormal} alt="Funil Recompra Normal" style={{ height: '20px', width: 'auto' }} />;
      default:
        return null;
    }
  };

  const menuItems = [
    { icon: 'funil-compra', label: t.funilCompra, active: true },
    { icon: 'funil-recompra', label: t.funilRecompra, active: false }
  ];

  const statsCards = [
    { title: t.totalOpportunities, value: '1,234', icon: '📊', color: 'blue', progress: 75 },
    { title: t.lostOpportunities, value: '89', icon: '❌', color: 'red', progress: 12 },
    { title: t.wonOpportunities, value: '156', icon: '✅', color: 'green', progress: 25 },
    { title: t.totalValue, value: 'R$ 2.5M', icon: '💰', color: 'cyan', progress: 60, isCurrency: true }
  ];

  return (
    <div className="dashboard-container">
      {/* Sidebar Desktop */}
      <aside className={`sidebar ${sidebarExpanded ? 'expanded' : 'collapsed'}`}>
        <div className="sidebar-header">
          <div className="logo">
            {sidebarExpanded ? (
              <div className="logo-text">
                <img 
                  src={isDarkMode ? LogoOficialmed : LogoOficialmedLight} 
                  alt="OficialMed" 
                  style={{ height: '24px', width: 'auto', maxWidth: '120px' }}
                />
              </div>
            ) : (
              <div className="logo-icon">
                <img 
                  src={isDarkMode ? LogoIcon : LogoIconLight} 
                  alt="Logo" 
                  style={{ height: '24px', width: 'auto', maxWidth: '40px' }}
                />
              </div>
            )}
          </div>
        </div>

        <nav className="sidebar-nav">
          {menuItems.map((item, index) => (
            <div key={index} className={`nav-item ${item.active ? 'active' : ''}`}>
              <div className="nav-icon">
                {renderIcon(item.icon, item.active)}
              </div>
              {sidebarExpanded && <span className="nav-label">{item.label}</span>}
            </div>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="user-profile">
            <div className="user-avatar">U</div>
            {sidebarExpanded && (
              <div className="user-info">
                <div className="user-name">{t.userName}</div>
                <div className="user-email">{t.userEmail}</div>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Top Menu Bar */}
      <header className="top-menu-bar">
        <button className="sidebar-toggle-discrete" onClick={toggleSidebar}>
          <div className="hamburger-lines">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </button>

        <div className="search-container">
          <div className="search-input-wrapper">
            <span className="search-icon">🔍</span>
            <input 
              type="text" 
              className="search-input" 
              placeholder={t.searchPlaceholder}
            />
          </div>
        </div>

        <div className="top-menu-right">
          {/* Seletor de idioma */}
          <div className="language-selector" onClick={toggleLanguageDropdown}>
            <img 
              src={currentLanguage === 'pt-BR' ? BandeiraBrasil : BandeiraEUA} 
              alt={currentLanguage === 'pt-BR' ? 'Brasil' : 'United States'} 
              className="flag-br" 
              style={{ width: '20px', height: 'auto' }} 
            />
            <span className="language-text">{currentLanguage === 'pt-BR' ? 'BR' : 'US'}</span>
            
            {/* Dropdown de idiomas */}
            {showLanguageDropdown && (
              <div className="language-dropdown">
                <div 
                  className="language-option" 
                  onClick={() => changeLanguage('pt-BR')}
                >
                  <img src={BandeiraBrasil} alt="Brasil" style={{ width: '20px', height: 'auto' }} />
                  <span>Português</span>
                </div>
                <div 
                  className="language-option" 
                  onClick={() => changeLanguage('en-US')}
                >
                  <img src={BandeiraEUA} alt="United States" style={{ width: '20px', height: 'auto' }} />
                  <span>English</span>
                </div>
              </div>
            )}
          </div>

          <button className="top-menu-btn" onClick={toggleFullscreen} title={t.fullscreen}>
            ⛶
          </button>

          <button className="top-menu-btn" onClick={toggleTheme} title={t.themeToggle}>
            {isDarkMode ? '☀️' : '🌙'}
          </button>

          <button className="top-menu-btn" title={t.messages}>
            ✉️
            <span className="notification-badge">3</span>
          </button>

          <button className="top-menu-btn" title={t.notifications}>
            🔔
            <span className="notification-badge">7</span>
          </button>

          <div className="user-avatar-container">
            <div className="user-avatar-circle">U</div>
          </div>
        </div>
      </header>

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
            {menuItems.map((item, index) => (
              <div key={index} className={`nav-item ${item.active ? 'active' : ''}`}>
                <div className="nav-icon">
                  {renderIcon(item.icon, item.active)}
                </div>
                <span className="nav-label">{item.label}</span>
              </div>
            ))}
          </nav>
        </aside>
      </div>

      {/* Main Content */}
      <main className="main-content">
        <div className="content-header">
          <div className="page-title">
            <h1>{t.pageTitle}</h1>
            <p>{t.pageSubtitle}</p>
          </div>

          <div className="header-actions">
            <select className="filter-selector">
              <option>{t.allFunnels}</option>
              <option>{t.purchaseFunnel}</option>
              <option>{t.repurchaseFunnel}</option>
            </select>

            <select className="date-preset-selector">
              <option value="today" onClick={() => handleDatePreset('today')}>{t.today}</option>
              <option value="yesterday" onClick={() => handleDatePreset('yesterday')}>{t.yesterday}</option>
              <option value="last7Days" onClick={() => handleDatePreset('last7Days')}>{t.last7Days}</option>
              <option value="thisMonth" onClick={() => handleDatePreset('thisMonth')}>{t.thisMonth}</option>
              <option value="thisQuarter" onClick={() => handleDatePreset('thisQuarter')}>{t.thisQuarter}</option>
              <option value="thisYear" onClick={() => handleDatePreset('thisYear')}>{t.thisYear}</option>
            </select>

            <div className="date-filter-container">
              <button 
                className="pick-date-btn" 
                onClick={() => setShowCalendar(!showCalendar)}
              >
                📅 {t.selectPeriod}
              </button>

              {showCalendar && (
                <div className="calendar-popup">
                  <div className="calendar-header">
                    <h4>{t.selectPeriod}</h4>
                    <button className="close-calendar" onClick={() => setShowCalendar(false)}>✕</button>
                  </div>
                  <div className="calendar-content">
                    <div className="date-inputs">
                      <div className="date-input-group">
                        <label>{t.startDate}</label>
                        <input 
                          type="date" 
                          value={startDate} 
                          onChange={(e) => setStartDate(e.target.value)}
                        />
                      </div>
                      <div className="date-input-group">
                        <label>{t.endDate}</label>
                        <input 
                          type="date" 
                          value={endDate} 
                          onChange={(e) => setEndDate(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="calendar-actions">
                      <button className="btn-secondary" onClick={() => setShowCalendar(false)}>
                        {t.cancel}
                      </button>
                      <button 
                        className="btn-primary" 
                        onClick={applyCustomDates}
                        disabled={!startDate || !endDate || startDate > endDate}
                      >
                        {t.apply}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <section className="stats-section">
          <h2>{t.statsTitle}</h2>
          <div className="stats-grid">
            {statsCards.map((card, index) => (
              <div key={index} className={`stat-card ${card.color}`}>
                <div className="stat-header">
                  <span className="stat-title">{card.title}</span>
                  <span className="stat-icon">{card.icon}</span>
                </div>
                <div className="stat-value">
                  {card.isCurrency ? formatLargeNumber(card.value) : card.value}
                </div>
                <div className="stat-progress"></div>
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
                  <span className="source-value">45%</span>
                  <span className="source-percentage">2.3k</span>
                </div>
                <div className="source-item meta">
                  <span className="source-label">{t.meta}</span>
                  <span className="source-value">28%</span>
                  <span className="source-percentage">1.4k</span>
                </div>
                <div className="source-item organic">
                  <span className="source-label">{t.organic}</span>
                  <span className="source-value">15%</span>
                  <span className="source-percentage">750</span>
                </div>
                <div className="source-item indicacao">
                  <span className="source-label">{t.indication}</span>
                  <span className="source-value">8%</span>
                  <span className="source-percentage">400</span>
                </div>
                <div className="source-item prescritor">
                  <span className="source-label">{t.prescriber}</span>
                  <span className="source-value">3%</span>
                  <span className="source-percentage">150</span>
                </div>
                <div className="source-item franquia">
                  <span className="source-label">{t.franchise}</span>
                  <span className="source-value">1%</span>
                  <span className="source-percentage">50</span>
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

          <div className="users-sidebar">
            <div className="users-header">
              <h3>{t.financialMetrics}</h3>
            </div>

            <div className="financial-metrics">
              <div className="metric-item gain">
                <span className="metric-label">{t.gain}</span>
                <span className="metric-value">
                  {formatCurrency(156000, 'BRL')}
                </span>
                <span className="metric-trend">+12.5%</span>
              </div>
              <div className="metric-item loss">
                <span className="metric-label">{t.loss}</span>
                <span className="metric-value">
                  {formatCurrency(89000, 'BRL')}
                </span>
                <span className="metric-trend">-8.2%</span>
              </div>
              <div className="metric-item ticket">
                <span className="metric-label">{t.averageTicket}</span>
                <span className="metric-value">
                  {formatCurrency(2800, 'BRL')}
                </span>
                <span className="metric-trend">+5.1%</span>
              </div>
            </div>

            <div className="sources-section">
              <h4>{t.opportunitySources}</h4>
              <div className="sources-list">
                <div className="source-line">
                  <span className="source-name">{t.google}</span>
                  <div className="source-metrics">
                    <span className="source-count">1,035</span>
                    <span className="source-percent">45%</span>
                  </div>
                </div>
                <div className="source-line">
                  <span className="source-name">{t.meta}</span>
                  <div className="source-metrics">
                    <span className="source-count">644</span>
                    <span className="source-percent">28%</span>
                  </div>
                </div>
                <div className="source-line">
                  <span className="source-name">{t.organic}</span>
                  <div className="source-metrics">
                    <span className="source-count">345</span>
                    <span className="source-percent">15%</span>
                  </div>
                </div>
                <div className="source-line">
                  <span className="source-name">{t.indication}</span>
                  <div className="source-metrics">
                    <span className="source-count">184</span>
                    <span className="source-percent">8%</span>
                  </div>
                </div>
                <div className="source-line">
                  <span className="source-name">{t.prescriber}</span>
                  <div className="source-metrics">
                    <span className="source-count">69</span>
                    <span className="source-percent">3%</span>
                  </div>
                </div>
                <div className="source-line">
                  <span className="source-name">{t.franchise}</span>
                  <div className="source-metrics">
                    <span className="source-count">23</span>
                    <span className="source-percent">1%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="mobile-bottom-nav">
        {menuItems.map((item, index) => (
          <div key={index} className={`bottom-nav-item ${item.active ? 'active' : ''}`}>
            <div className="nav-icon">
              {renderIcon(item.icon, item.active)}
            </div>
            <span className="nav-label">{item.label}</span>
          </div>
        ))}
      </nav>
    </div>
  );
};

export default DashboardPage;


