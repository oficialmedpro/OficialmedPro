/**
 * Componente Header do CRM
 * 
 * Menu superior com logo, busca, navegação e ações
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './CrmHeader.css';
import {
  Search,
  Grid3x3,
  Star,
  LayoutGrid,
  Magnet,
  ArrowLeftRight,
  Smile,
  RefreshCw,
  AlertCircle,
  Bell,
  CheckCircle,
  Phone,
  Settings,
  Headphones,
  User
} from 'lucide-react';
import LogoOficialmed from '../../../../icones/icone_oficialmed.svg';

const CrmHeader = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');

  const navItems = [
    { id: 'favoritos', label: 'Favoritos', icon: Star },
    { id: 'geral', label: 'Geral', icon: LayoutGrid },
    { id: 'atrair', label: 'Atrair', icon: Magnet },
    { id: 'converter', label: 'Converter', icon: ArrowLeftRight },
    { id: 'relacionar', label: 'Relacionar', icon: Smile },
    { id: 'analisar', label: 'Analisar', icon: RefreshCw }
  ];

  const actionItems = [
    { id: 'alert', icon: AlertCircle, color: '#ef4444', badge: null },
    { id: 'notifications', icon: Bell, color: '#8b5cf6', badge: 300 },
    { id: 'check', icon: CheckCircle, color: '#10b981', badge: null },
    { id: 'phone', icon: Phone, color: '#3b82f6', badge: null },
    { id: 'settings', icon: Settings, color: '#64748b', badge: null },
    { id: 'support', icon: Headphones, color: '#64748b', badge: null }
  ];

  const handleSearch = (e) => {
    e.preventDefault();
    // Implementar busca
    console.log('Buscar:', searchTerm);
  };

  return (
    <div className="CrmHeader">
      {/* Banner superior laranja/amarelo */}
      <div className="CrmHeader-banner"></div>

      {/* Header principal */}
      <div className="CrmHeader-main">
        {/* Logo e busca */}
        <div className="CrmHeader-left">
          <div className="CrmHeader-logo" onClick={() => navigate('/crm')}>
            <img 
              src={LogoOficialmed} 
              alt="OficialMed" 
              className="CrmHeader-logo-img"
            />
          </div>

          <form className="CrmHeader-search" onSubmit={handleSearch}>
            <Search size={18} className="CrmHeader-search-icon" />
            <input
              type="text"
              placeholder="Encontrar serviço"
              className="CrmHeader-search-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button 
              type="button" 
              className="CrmHeader-search-grid"
              title="Menu de busca"
            >
              <Grid3x3 size={16} />
            </button>
          </form>
        </div>

        {/* Navegação central */}
        <nav className="CrmHeader-nav">
          {navItems.map(item => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                className="CrmHeader-nav-item"
                title={item.label}
              >
                <Icon size={18} />
                <span className="CrmHeader-nav-label">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Ações e perfil */}
        <div className="CrmHeader-right">
          {actionItems.map(item => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                className="CrmHeader-action-btn"
                style={{ backgroundColor: item.color }}
                title={item.label || item.id}
              >
                <Icon size={18} />
                {item.badge && (
                  <span className="CrmHeader-badge">{item.badge}</span>
                )}
              </button>
            );
          })}

          {/* Perfil do usuário */}
          <div className="CrmHeader-profile">
            <div className="CrmHeader-profile-avatar">
              <User size={20} />
            </div>
            <div className="CrmHeader-profile-shield">
              <User size={10} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CrmHeader;

