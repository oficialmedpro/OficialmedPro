/**
 * Componente Sidebar do CRM
 * 
 * Menu lateral esquerdo com navegação e tooltips
 */

import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './CrmSidebar.css';
import {
  LayoutDashboard,
  Briefcase,
  Zap,
  Calendar,
  CheckSquare,
  HelpCircle,
  Settings
} from 'lucide-react';

const CrmSidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [hoveredItem, setHoveredItem] = useState(null);

  const menuItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      path: '/crm',
      badge: null
    },
    {
      id: 'oportunidades',
      label: 'Oportunidades',
      icon: Briefcase,
      path: '/crm/kanban',
      badge: null
    },
    {
      id: 'automacoes',
      label: 'Automações',
      icon: Zap,
      path: '/crm/automacoes',
      badge: null
    },
    {
      id: 'planejador',
      label: 'Planejador Campanhas',
      icon: Calendar,
      path: '/crm/planejador',
      badge: null
    },
    {
      id: 'aprovacoes',
      label: 'Aprovações',
      icon: CheckSquare,
      path: '/crm/aprovacoes',
      badge: null
    }
  ];

  const bottomItems = [
    {
      id: 'ajuda',
      label: 'Ajuda',
      icon: HelpCircle,
      path: '/crm/ajuda',
      badge: null
    },
    {
      id: 'configuracoes',
      label: 'Configurações',
      icon: Settings,
      path: '/crm/configuracoes',
      badge: null
    }
  ];

  const isActive = (path) => {
    if (path === '/crm') {
      return location.pathname === '/crm' || location.pathname === '/crm/';
    }
    return location.pathname.startsWith(path);
  };

  const handleClick = (path) => {
    navigate(path);
  };

  return (
    <div className="CrmSidebar">
      <div className="CrmSidebar-content">
        {/* Menu principal */}
        <nav className="CrmSidebar-nav">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            
            return (
              <div
                key={item.id}
                className={`CrmSidebar-item ${active ? 'active' : ''}`}
                onClick={() => handleClick(item.path)}
                onMouseEnter={() => setHoveredItem(item.id)}
                onMouseLeave={() => setHoveredItem(null)}
              >
                <div className="CrmSidebar-icon-wrapper">
                  <Icon size={24} className="CrmSidebar-icon" />
                  {item.badge && (
                    <span className="CrmSidebar-badge">{item.badge}</span>
                  )}
                </div>
                
                {/* Tooltip */}
                {hoveredItem === item.id && (
                  <div className="CrmSidebar-tooltip">
                    {item.label}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Menu inferior */}
        <nav className="CrmSidebar-nav CrmSidebar-nav-bottom">
          {bottomItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            
            return (
              <div
                key={item.id}
                className={`CrmSidebar-item ${active ? 'active' : ''}`}
                onClick={() => handleClick(item.path)}
                onMouseEnter={() => setHoveredItem(item.id)}
                onMouseLeave={() => setHoveredItem(null)}
              >
                <div className="CrmSidebar-icon-wrapper">
                  <Icon size={24} className="CrmSidebar-icon" />
                  {item.badge && (
                    <span className="CrmSidebar-badge">{item.badge}</span>
                  )}
                </div>
                
                {/* Tooltip */}
                {hoveredItem === item.id && (
                  <div className="CrmSidebar-tooltip">
                    {item.label}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </div>
    </div>
  );
};

export default CrmSidebar;




