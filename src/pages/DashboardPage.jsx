import React, { useState, useEffect, useRef } from 'react';
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
  // Estados para o dashboard
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState('pt-BR');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [usdRate, setUsdRate] = useState(5.0);
  const [isLoadingRate, setIsLoadingRate] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('sale'); // Status padrão: Venda
  const [marketData, setMarketData] = useState({
    usd: 5.20,
    eur: 5.45,
    ibov: 125432,
    lastUpdate: new Date()
  });
  
  // Estados para os submenus em sanfona
  const [openSubmenus, setOpenSubmenus] = useState({
    funilsAdm: false,
    funilComercial: false
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

  // Função para alternar submenus
  const toggleSubmenu = (submenuKey) => {
    // Não abre submenu se sidebar está colapsada
    if (!sidebarExpanded) {
      return;
    }
    
    setOpenSubmenus(prev => ({
      ...prev,
      [submenuKey]: !prev[submenuKey]
    }));
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
    
    // Resetar todos os submenus quando colapsar a sidebar
    if (sidebarExpanded) {
      setOpenSubmenus({
        funilsAdm: false,
        funilComercial: false
      });
    }
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

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showLanguageDropdown && !event.target.closest('.language-selector')) {
        setShowLanguageDropdown(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showLanguageDropdown]);

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

  // Estrutura dos menus em sanfona
  const accordionMenus = [
    {
      id: 'funilsAdm',
      label: t.funilsAdm,
      icon: 'funil-compra',
      subItems: [
        { icon: 'funil-compra', label: t.funilCompra, active: true },
        { icon: 'funil-recompra', label: t.funilRecompra, active: false }
      ]
    },
    {
      id: 'funilComercial',
      label: t.funilComercial,
      icon: 'funil-recompra',
      subItems: [
        { icon: 'funil-compra', label: t.funilCompra, active: false },
        { icon: 'funil-recompra', label: t.funilRecompra, active: true }
      ]
    }
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
          {accordionMenus.map((menu, menuIndex) => (
            <div key={menuIndex} className="accordion-menu">
              {/* Menu Principal */}
              <div 
                className={`nav-item nav-item-parent ${openSubmenus[menu.id] ? 'expanded' : ''}`}
                onClick={() => toggleSubmenu(menu.id)}
                data-tooltip={menu.label}
              >
                <div className="nav-icon">
                  {renderIcon(menu.icon, false)}
                </div>
                {sidebarExpanded && (
                  <>
                    <span className="nav-label">{menu.label}</span>
                    <div className={`nav-arrow ${openSubmenus[menu.id] ? 'rotated' : ''}`}>
                      ▼
                    </div>
                  </>
                )}
                
                {/* Tooltip interativa para modo colapsado */}
                {!sidebarExpanded && (
                  <div className="collapsed-submenu">
                    <div className="collapsed-submenu-header">
                      {menu.label}
                    </div>
                    {menu.subItems.map((subItem, subIndex) => (
                      <div 
                        key={subIndex} 
                        className="collapsed-submenu-item"
                        onClick={(e) => {
                          e.stopPropagation();
                          // Aqui você pode adicionar a lógica de navegação
                          console.log(`Clicked on ${subItem.label}`);
                        }}
                      >
                        {subItem.label}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              {/* Submenu */}
              {sidebarExpanded && (
                <div className={`submenu ${openSubmenus[menu.id] ? 'open' : ''}`}>
                  {menu.subItems.map((subItem, subIndex) => (
                    <div key={subIndex} className={`nav-item submenu-item ${subItem.active ? 'active' : ''}`}>
                      <span className="nav-label">{subItem.label}</span>
                    </div>
                  ))}
                </div>
              )}
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
          <div className="language-selector" onClick={(e) => {
            e.stopPropagation();
            toggleLanguageDropdown();
          }}>
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
            {accordionMenus.map((menu, menuIndex) => (
              <div key={menuIndex} className="accordion-menu">
                {/* Menu Principal */}
                <div 
                  className={`nav-item nav-item-parent ${openSubmenus[menu.id] ? 'expanded' : ''}`}
                  onClick={() => toggleSubmenu(menu.id)}
                >
                  <div className="nav-icon">
                    {renderIcon(menu.icon, false)}
                  </div>
                  <span className="nav-label">{menu.label}</span>
                  <div className={`nav-arrow ${openSubmenus[menu.id] ? 'rotated' : ''}`}>
                    ▼
                  </div>
                </div>
                
                {/* Submenu */}
                <div className={`submenu ${openSubmenus[menu.id] ? 'open' : ''}`}>
                  {menu.subItems.map((subItem, subIndex) => (
                    <div key={subIndex} className={`nav-item submenu-item ${subItem.active ? 'active' : ''}`}>
                      <div className="nav-icon">
                        {renderIcon(subItem.icon, subItem.active)}
                      </div>
                      <span className="nav-label">{subItem.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
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
            <select className="filter-selector">
              <option>{t.allFunnels}</option>
              <option>{t.purchaseFunnel}</option>
              <option>{t.repurchaseFunnel}</option>
            </select>

            <select 
              className="status-selector"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              <option value="sale">{t.sale}</option>
              <option value="won">{t.won}</option>
              <option value="registered">{t.registered}</option>
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

          <div className="users-sidebar">
            <div className="users-header">
              <h3>{t.financialMetrics}</h3>
            </div>

            <div className="financial-metrics-new">
              {/* Google Metrics Card */}
              <div className="metric-card google-card">
                <div className="metric-card-header">
                  <div className="platform-icon google-icon">G</div>
                  <span className="platform-name">Google</span>
                  <div className="roas-badge roas-excellent">ROAS 3.47x</div>
                </div>
                
                <div className="metrics-grid">
                  <div className="metric-item-visual">
                    <div className="metric-info">
                      <span className="metric-label">Investido</span>
                      <span className="metric-value">{formatCurrency(45000, 'BRL')}</span>
                      <div className="metric-bar">
                        <div className="metric-fill" style={{width: '85%', background: 'linear-gradient(90deg, #ef4444, #dc2626)'}}></div>
                      </div>
                    </div>
                  </div>

                  <div className="metric-item-visual">
                    <div className="metric-info">
                      <span className="metric-label">Taxa Conversão</span>
                      <span className="metric-value">78 → 5 (6.4%)</span>
                      <div className="metric-bar">
                        <div className="metric-fill" style={{width: '64%', background: 'linear-gradient(90deg, #3b82f6, #1d4ed8)'}}></div>
                      </div>
                    </div>
                  </div>

                  <div className="metric-item-visual">
                    <div className="metric-info">
                      <span className="metric-label">Valor Ganho</span>
                      <span className="metric-value">{formatCurrency(156000, 'BRL')}</span>
                      <div className="metric-bar">
                        <div className="metric-fill" style={{width: '92%', background: 'linear-gradient(90deg, #10b981, #059669)'}}></div>
                      </div>
                    </div>
                  </div>

                  <div className="metric-item-visual">
                    <div className="metric-info">
                      <span className="metric-label">Oportunidades Perdidas</span>
                      <span className="metric-value">73</span>
                      <div className="metric-bar">
                        <div className="metric-fill" style={{width: '73%', background: 'linear-gradient(90deg, #f59e0b, #d97706)'}}></div>
                      </div>
                    </div>
                  </div>

                  <div className="metric-item-visual">
                    <div className="metric-info">
                      <span className="metric-label">Oportunidades Abertas</span>
                      <span className="metric-value">12</span>
                      <div className="metric-bar">
                        <div className="metric-fill" style={{width: '30%', background: 'linear-gradient(90deg, #8b5cf6, #7c3aed)'}}></div>
                      </div>
                    </div>
                  </div>

                  <div className="metric-item-visual">
                    <div className="metric-info">
                      <span className="metric-label">Valor Perda</span>
                      <span className="metric-value">{formatCurrency(89000, 'BRL')}</span>
                      <div className="metric-bar">
                        <div className="metric-fill" style={{width: '57%', background: 'linear-gradient(90deg, #ef4444, #dc2626)'}}></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Meta Metrics Card */}
              <div className="metric-card meta-card">
                <div className="metric-card-header">
                  <div className="platform-icon meta-icon">M</div>
                  <span className="platform-name">Meta</span>
                  <div className="roas-badge roas-good">ROAS 3.06x</div>
                </div>
                
                <div className="metrics-grid">
                  <div className="metric-item-visual">
                    <div className="metric-info">
                      <span className="metric-label">Investido</span>
                      <span className="metric-value">{formatCurrency(32000, 'BRL')}</span>
                      <div className="metric-bar">
                        <div className="metric-fill" style={{width: '60%', background: 'linear-gradient(90deg, #ef4444, #dc2626)'}}></div>
                      </div>
                    </div>
                  </div>

                  <div className="metric-item-visual">
                    <div className="metric-info">
                      <span className="metric-label">Taxa Conversão</span>
                      <span className="metric-value">45 → 3 (6.7%)</span>
                      <div className="metric-bar">
                        <div className="metric-fill" style={{width: '67%', background: 'linear-gradient(90deg, #3b82f6, #1d4ed8)'}}></div>
                      </div>
                    </div>
                  </div>

                  <div className="metric-item-visual">
                    <div className="metric-info">
                      <span className="metric-label">Valor Ganho</span>
                      <span className="metric-value">{formatCurrency(98000, 'BRL')}</span>
                      <div className="metric-bar">
                        <div className="metric-fill" style={{width: '63%', background: 'linear-gradient(90deg, #10b981, #059669)'}}></div>
                      </div>
                    </div>
                  </div>

                  <div className="metric-item-visual">
                    <div className="metric-info">
                      <span className="metric-label">Oportunidades Perdidas</span>
                      <span className="metric-value">42</span>
                      <div className="metric-bar">
                        <div className="metric-fill" style={{width: '42%', background: 'linear-gradient(90deg, #f59e0b, #d97706)'}}></div>
                      </div>
                    </div>
                  </div>

                  <div className="metric-item-visual">
                    <div className="metric-info">
                      <span className="metric-label">Oportunidades Abertas</span>
                      <span className="metric-value">8</span>
                      <div className="metric-bar">
                        <div className="metric-fill" style={{width: '20%', background: 'linear-gradient(90deg, #8b5cf6, #7c3aed)'}}></div>
                      </div>
                    </div>
                  </div>

                  <div className="metric-item-visual">
                    <div className="metric-info">
                      <span className="metric-label">Valor Perda</span>
                      <span className="metric-value">{formatCurrency(67000, 'BRL')}</span>
                      <div className="metric-bar">
                        <div className="metric-fill" style={{width: '43%', background: 'linear-gradient(90deg, #ef4444, #dc2626)'}}></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="metric-card sources-card">
              <div className="metric-card-header">
                <div className="platform-icon sources-icon">O</div>
                <span className="platform-name">Origem das Oportunidades</span>
              </div>
              
              <div className="sources-list">
                <div className="source-line">
                  <div className="source-content">
                    <span className="source-name">Google Ads</span>
                    <div className="source-metrics">
                      <span className="source-count">1,035</span>
                      <span className="source-percent">45%</span>
                    </div>
                  </div>
                  <div className="source-color-bar" style={{background: '#4285f4', width: '45%'}}></div>
                </div>
                <div className="source-line">
                  <div className="source-content">
                    <span className="source-name">Meta Ads</span>
                    <div className="source-metrics">
                      <span className="source-count">644</span>
                      <span className="source-percent">28%</span>
                    </div>
                  </div>
                  <div className="source-color-bar" style={{background: '#1877f2', width: '28%'}}></div>
                </div>
                <div className="source-line">
                  <div className="source-content">
                    <span className="source-name">Orgânico</span>
                    <div className="source-metrics">
                      <span className="source-count">345</span>
                      <span className="source-percent">15%</span>
                    </div>
                  </div>
                  <div className="source-color-bar" style={{background: '#10b981', width: '15%'}}></div>
                </div>
                <div className="source-line">
                  <div className="source-content">
                    <span className="source-name">Indicação</span>
                    <div className="source-metrics">
                      <span className="source-count">184</span>
                      <span className="source-percent">8%</span>
                    </div>
                  </div>
                  <div className="source-color-bar" style={{background: '#f59e0b', width: '8%'}}></div>
                </div>
                <div className="source-line">
                  <div className="source-content">
                    <span className="source-name">Prescritor</span>
                    <div className="source-metrics">
                      <span className="source-count">69</span>
                      <span className="source-percent">3%</span>
                    </div>
                  </div>
                  <div className="source-color-bar" style={{background: '#8b5cf6', width: '3%'}}></div>
                </div>
                <div className="source-line">
                  <div className="source-content">
                    <span className="source-name">Campanha</span>
                    <div className="source-metrics">
                      <span className="source-count">45</span>
                      <span className="source-percent">2%</span>
                    </div>
                  </div>
                  <div className="source-color-bar" style={{background: '#06b6d4', width: '2%'}}></div>
                </div>
                <div className="source-line">
                  <div className="source-content">
                    <span className="source-name">Monitoramento</span>
                    <div className="source-metrics">
                      <span className="source-count">38</span>
                      <span className="source-percent">2%</span>
                    </div>
                  </div>
                  <div className="source-color-bar" style={{background: '#f59e0b', width: '2%'}}></div>
                </div>
                <div className="source-line">
                  <div className="source-content">
                    <span className="source-name">Colaborador</span>
                    <div className="source-metrics">
                      <span className="source-count">32</span>
                      <span className="source-percent">1%</span>
                    </div>
                  </div>
                  <div className="source-color-bar" style={{background: '#3b82f6', width: '1%'}}></div>
                </div>
                <div className="source-line">
                  <div className="source-content">
                    <span className="source-name">Franquia</span>
                    <div className="source-metrics">
                      <span className="source-count">23</span>
                      <span className="source-percent">1%</span>
                    </div>
                  </div>
                  <div className="source-color-bar" style={{background: '#ef4444', width: '1%'}}></div>
                </div>
                <div className="source-line">
                  <div className="source-content">
                    <span className="source-name">Farmácia Parceira</span>
                    <div className="source-metrics">
                      <span className="source-count">18</span>
                      <span className="source-percent">1%</span>
                    </div>
                  </div>
                  <div className="source-color-bar" style={{background: '#10b981', width: '1%'}}></div>
                </div>
                <div className="source-line">
                  <div className="source-content">
                    <span className="source-name">Monitoramento/Disp</span>
                    <div className="source-metrics">
                      <span className="source-count">15</span>
                      <span className="source-percent">1%</span>
                    </div>
                  </div>
                  <div className="source-color-bar" style={{background: '#06b6d4', width: '1%'}}></div>
                </div>
                <div className="source-line">
                  <div className="source-content">
                    <span className="source-name">Site</span>
                    <div className="source-metrics">
                      <span className="source-count">12</span>
                      <span className="source-percent">1%</span>
                    </div>
                  </div>
                  <div className="source-color-bar" style={{background: '#8b5cf6', width: '1%'}}></div>
                </div>
                <div className="source-line">
                  <div className="source-content">
                    <span className="source-name">Phusion/Disparo</span>
                    <div className="source-metrics">
                      <span className="source-count">10</span>
                      <span className="source-percent">1%</span>
                    </div>
                  </div>
                  <div className="source-color-bar" style={{background: '#f59e0b', width: '1%'}}></div>
                </div>
                <div className="source-line">
                  <div className="source-content">
                    <span className="source-name">Contato Rosana</span>
                    <div className="source-metrics">
                      <span className="source-count">8</span>
                      <span className="source-percent">1%</span>
                    </div>
                  </div>
                  <div className="source-color-bar" style={{background: '#ec4899', width: '1%'}}></div>
                </div>
                <div className="source-line">
                  <div className="source-content">
                    <span className="source-name">Contato Poliana</span>
                    <div className="source-metrics">
                      <span className="source-count">6</span>
                      <span className="source-percent">1%</span>
                    </div>
                  </div>
                  <div className="source-color-bar" style={{background: '#8b5cf6', width: '1%'}}></div>
                </div>
                <div className="source-line">
                  <div className="source-content">
                    <span className="source-name">Yampi Parceiro</span>
                    <div className="source-metrics">
                      <span className="source-count">4</span>
                      <span className="source-percent">1%</span>
                    </div>
                  </div>
                  <div className="source-color-bar" style={{background: '#06b6d4', width: '1%'}}></div>
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


