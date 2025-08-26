import React, { useState } from 'react';
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
  translations 
}) => {
  // Estados para os submenus em sanfona
  const [openSubmenus, setOpenSubmenus] = useState({
    funilsAdm: false,
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
        { icon: 'funil-compra', label: translations.funilCompra, active: true },
        { icon: 'funil-recompra', label: translations.funilRecompra, active: false }
      ]
    },
    {
      id: 'funilComercial',
      label: translations.funilComercial,
      icon: 'funil-recompra',
      subItems: [
        { icon: 'funil-compra', label: translations.funilCompra, active: false },
        { icon: 'funil-recompra', label: translations.funilRecompra, active: true }
      ]
    }
  ];

  return (
    <aside className={`sidebar-component ${sidebarExpanded ? 'expanded' : 'collapsed'}`}>
      <div className="sidebar-component-header">
        <div className="sidebar-component-logo">
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
              <div className={`sidebar-component-submenu ${openSubmenus[menu.id] ? 'open' : ''}`}>
                {menu.subItems.map((subItem, subIndex) => (
                  <div key={subIndex} className={`sidebar-component-nav-item sidebar-component-submenu-item ${subItem.active ? 'active' : ''}`}>
                    <span className="sidebar-component-nav-label">{subItem.label}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>

      <div className="sidebar-component-footer">
        <div className="sidebar-component-user-profile">
          <div className="sidebar-component-user-avatar">U</div>
          {sidebarExpanded && (
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
