import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Sidebar.css';

// Importar ícones SVG
import FunilCompraAtivo from '../../icones/funil-compra-ativo.svg';
import FunilCompraNormal from '../../icones/funil-compra-normal.svg';
import FunilRecompraAtivo from '../../icones/funil-recompra-ativo.svg';
import FunilRecompraNormal from '../../icones/funil-recompra-normal.svg';
import LogoIcon from '../../icones/icone_logo.svg';
import LogoIconLight from '../../icones/icone_logo_modo_light.svg';
import LogoOficialmed from '../../icones/icone_oficialmed.svg';
import LogoOficialmedLight from '../../icones/icone_oficialmed_modo_light.svg';

const Sidebar = ({ 
  sidebarExpanded, 
  isDarkMode, 
  currentLanguage,
  translations,
  isMobile = false,
  onClose,
  toggleTheme,
  toggleFullscreen,
  changeLanguage
}) => {
  const navigate = useNavigate();
  
  // Estados para os submenus em sanfona
  const [openSubmenus, setOpenSubmenus] = useState({
    funilsAdm: true, // Abrir por padrão quando sidebar estiver expandido
    funilComercial: false
  });

  // Função para alternar submenus
  const toggleSubmenu = (submenuKey) => {
    // Não abre submenu se sidebar está colapsada
    if (!sidebarExpanded) {
      return;
    }
    
    setOpenSubmenus(prev => {
      // Se o submenu clicado já está aberto, fecha ele
      if (prev[submenuKey]) {
        return {
          ...prev,
          [submenuKey]: false
        };
      }
      
      // Se o submenu clicado está fechado, abre ele e fecha todos os outros
      return {
        funilsAdm: false,
        funilComercial: false,
        [submenuKey]: true
      };
    });
  };

  // Funções para os botões do menu mobile - usar props se disponíveis
  const handleToggleFullscreen = () => {
    if (toggleFullscreen) {
      toggleFullscreen();
    } else {
      // Fallback local
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen();
      } else {
        document.exitFullscreen();
      }
    }
  };

  const handleToggleTheme = () => {
    if (toggleTheme) {
      toggleTheme();
    } else {
      console.log('Toggle theme clicked');
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

  // Estrutura dos menus em sanfona
  const accordionMenus = [
    {
      id: 'funilsAdm',
      label: translations.funilsAdm,
      icon: 'funil-compra',
      subItems: [
        { icon: 'funil-compra', label: 'Análise de Funil', path: '/analise-funil', active: false },
        { icon: 'funil-compra', label: 'Dash GoogleAds', path: '/dashgooglepatrocinado', active: false },
        { icon: 'funil-compra', label: 'Performance Diária', path: '/performance-diaria', active: false },
        { icon: 'funil-compra', label: 'Performance por Ronda', path: '/performance-ronda', active: false },
        { icon: 'funil-compra', label: 'Ranking de Performance', path: '/ranking-de-performance', active: false },
        { icon: 'funil-compra', label: 'Matriz RFV', path: '/matriz-rfv', active: false },
        { icon: 'funil-compra', label: 'Mapa de Calor', path: '/mapa-de-calor', active: false },
        { icon: 'dashboard-meta', label: 'Dashboard MetaAds', active: false },
        { icon: 'dashboard-google', label: 'Dashboard GoogleAds', active: false }
      ]
    },
    {
      id: 'funilComercial',
      label: translations.funilComercial,
      icon: 'funil-recompra',
      subItems: [
        // Itens removidos conforme solicitado
      ]
    }
  ];

  return (
    <aside className={`sidebar-component ${sidebarExpanded ? 'expanded' : 'collapsed'} ${isMobile ? 'mobile' : ''}`}>
      {/* Header mobile com botão de fechar */}
      {isMobile && (
        <div className="sidebar-component-mobile-header">
          <div className="sidebar-component-logo" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
            <div className="sidebar-component-logo-text">
              <img 
                src={isDarkMode ? LogoOficialmed : LogoOficialmedLight} 
                alt="OficialMed" 
                style={{ height: '24px', width: 'auto', maxWidth: '120px' }}
              />
            </div>
          </div>
          <button className="sidebar-component-mobile-close" onClick={onClose}>×</button>
        </div>
      )}

      {/* Header normal para desktop */}
      {!isMobile && (
        <div className="sidebar-component-header">
          <div className="sidebar-component-logo" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
            {sidebarExpanded ? (
              <div className="sidebar-component-logo-text">
                <img 
                  src={isDarkMode ? LogoOficialmed : LogoOficialmedLight} 
                  alt="OficialMed" 
                  style={{ height: '24px', width: 'auto', maxWidth: '120px' }}
                />
              </div>
            ) : (
              <div className="sidebar-component-logo-icon">
                <img 
                  src={isDarkMode ? LogoIcon : LogoIconLight} 
                  alt="Logo" 
                  style={{ height: '24px', width: 'auto', maxWidth: '40px' }}
                />
              </div>
            )}
          </div>
        </div>
      )}

      <nav className="sidebar-component-nav">
        {accordionMenus.map((menu, menuIndex) => (
          <div key={menuIndex} className="sidebar-component-accordion-menu">
            {/* Menu Principal */}
            <div 
              className={`sidebar-component-nav-item sidebar-component-nav-item-parent ${openSubmenus[menu.id] ? 'expanded' : ''}`}
              onClick={() => toggleSubmenu(menu.id)}
              data-tooltip={menu.label}
            >
              <div className="sidebar-component-nav-icon">
                {renderIcon(menu.icon, false)}
              </div>
              {sidebarExpanded && (
                <>
                  <span className="sidebar-component-nav-label">{menu.label}</span>
                  <div className={`sidebar-component-nav-arrow ${openSubmenus[menu.id] ? 'rotated' : ''}`}>
                    ▼
                  </div>
                </>
              )}
              
              {/* Tooltip interativa para modo colapsado */}
              {!sidebarExpanded && (
                <div className="sidebar-component-collapsed-submenu">
                  <div className="sidebar-component-collapsed-submenu-header">
                    {menu.label}
                  </div>
                  {menu.subItems.map((subItem, subIndex) => (
                    <div 
                      key={subIndex} 
                      className="sidebar-component-collapsed-submenu-item"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (subItem.path) {
                          navigate(subItem.path);
                        } else if (subItem.label === 'Dashboard MetaAds') {
                          navigate('/meta-ads');
                        } else if (subItem.label === 'Dashboard GoogleAds') {
                          navigate('/google-ads');
                        } else {
                          console.log(`Clicked on ${subItem.label}`);
                        }
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
              <div className={`sidebar-component-submenu open`}>
                {menu.subItems.map((subItem, subIndex) => (
                  <div 
                    key={subIndex} 
                    className={`sidebar-component-nav-item sidebar-component-submenu-item ${subItem.active ? 'active' : ''}`}
                    onClick={() => {
                      if (subItem.path) {
                        navigate(subItem.path);
                      } else if (subItem.label === 'Dashboard MetaAds') {
                        navigate('/meta-ads');
                      } else if (subItem.label === 'Dashboard GoogleAds') {
                        navigate('/google-ads');
                      } else {
                        console.log(`Clicked on ${subItem.label}`);
                      }
                    }}
                  >
                    <span className="sidebar-component-nav-label">{subItem.label}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>

      {/* Container para os ícones da direita - copiado do TopMenuBar */}
      {isMobile && (
        <div className="tmb-right-icons-container">
          {/* Seletor de idioma */}
          <div className="tmb-language-selector">
            <button 
              className="tmb-language-btn"
              onClick={() => changeLanguage(currentLanguage === 'pt-BR' ? 'en-US' : 'pt-BR')}
            >
              <img 
                src={currentLanguage === 'pt-BR' ? '/icones/brasil.svg' : '/icones/eua.svg'} 
                alt={currentLanguage === 'pt-BR' ? 'Brasil' : 'United States'} 
              />
              <span>{currentLanguage === 'pt-BR' ? 'BR' : 'US'}</span>
            </button>
          </div>

          <button className="tmb-top-menu-btn" onClick={handleToggleFullscreen} title="Tela cheia">
            <svg viewBox="0 0 24 24">
              <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/>
            </svg>
          </button>

          <button className="tmb-top-menu-btn" onClick={handleToggleTheme} title="Alternar tema">
            {isDarkMode ? '☀️' : '🌙'}
          </button>

          <button className="tmb-top-menu-btn" title="Mensagens">
            ✉️
            <span className="tmb-notification-badge">3</span>
          </button>

          <button className="tmb-top-menu-btn" title="Notificações">
            🔔
            <span className="tmb-notification-badge">7</span>
          </button>

          <div className="tmb-user-avatar-container">
            <div className="tmb-user-avatar">U</div>
          </div>
        </div>
      )}

      <div className="sidebar-component-footer">
        <div className="sidebar-component-user-profile">
          <div className="sidebar-component-user-avatar">U</div>
          {(sidebarExpanded || isMobile) && (
            <div className="sidebar-component-user-info">
              <div className="sidebar-component-user-name">{translations.userName}</div>
              <div className="sidebar-component-user-email">{translations.userEmail}</div>
            </div>
          )}
        </div>
      </div>


    </aside>
  );
};

export default Sidebar;
