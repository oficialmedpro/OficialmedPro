import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Hash, 
  LogOut,
  User,
  Menu,
  X
} from 'lucide-react';
import LogoOficialmedLight from '../../../icones/icone_oficialmed_modo_light.svg';
import './MonitoramentoMenu.css';

const MonitoramentoMenu = ({ onLogout }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [userData, setUserData] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    // Carregar dados do usuário do localStorage
    const storedUserData = localStorage.getItem('monitoramento_userData');
    if (storedUserData) {
      try {
        setUserData(JSON.parse(storedUserData));
      } catch (error) {
        console.error('Erro ao parsear userData:', error);
      }
    }
  }, []);

  const menuItems = [
    { path: '/monitoramento', label: 'Dashboard Monitoramento', icon: LayoutDashboard },
    { path: '/monitoramento/1-29', label: '1-29 dias', icon: Hash, color: '#22c55e' },
    { path: '/monitoramento/30-59', label: '30-59 dias', icon: Hash, color: '#eab308' },
    { path: '/monitoramento/60-90', label: '60-90 dias', icon: Hash, color: '#f97316' }
  ];

  const isActive = (path) => {
    if (path === '/monitoramento') {
      return location.pathname === '/monitoramento';
    }
    return location.pathname === path;
  };

  const handleLogout = () => {
    // Limpar dados de autenticação de monitoramento
    localStorage.removeItem('monitoramento_authenticated');
    localStorage.removeItem('monitoramento_loginTime');
    localStorage.removeItem('monitoramento_token');
    localStorage.removeItem('monitoramento_userData');
    
    // Redirecionar para login de monitoramento
    navigate('/monitoramento/login');
  };

  // Fechar menu ao clicar em um item em mobile
  const handleMenuItemClick = (path) => {
    navigate(path);
    setMobileMenuOpen(false);
  };

  return (
    <>
      {/* Botão hamburger para mobile */}
      <button
        className="monitoramento-menu-toggle"
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        aria-label="Toggle menu"
      >
        {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Overlay para fechar menu ao clicar fora */}
      {mobileMenuOpen && (
        <div
          className="monitoramento-menu-overlay"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      <nav className={`monitoramento-menu ${mobileMenuOpen ? 'mobile-open' : ''}`}>
        <div className="monitoramento-menu-container">
        <div className="monitoramento-menu-logo">
          <img src={LogoOficialmedLight} alt="OficialMed" className="monitoramento-menu-logo-img" />
          <span className="monitoramento-menu-title">Monitoramento</span>
        </div>
        
        <div className="monitoramento-menu-items">
          {menuItems.map((item) => {
            const IconComponent = item.icon;
            return (
              <button
                key={item.path}
                className={`monitoramento-menu-item ${isActive(item.path) ? 'active' : ''}`}
                onClick={() => handleMenuItemClick(item.path)}
                style={item.color ? { '--item-color': item.color } : {}}
              >
                <span className="monitoramento-menu-item-icon">
                  {item.color ? (
                    <span 
                      className="monitoramento-menu-color-dot" 
                      style={{ backgroundColor: item.color }}
                    />
                  ) : (
                    <IconComponent size={20} strokeWidth={2} />
                  )}
                </span>
                <span className="monitoramento-menu-item-label">{item.label}</span>
              </button>
            );
          })}
        </div>

        <div className="monitoramento-menu-footer">
          {userData && (
            <div className="monitoramento-menu-user-info">
              <div className="monitoramento-menu-user-icon">
                <User size={16} strokeWidth={2} />
              </div>
              <div className="monitoramento-menu-user-details">
                <div className="monitoramento-menu-user-name">
                  {userData.firstName || userData.name || userData.nome || userData.username || 'Usuário'}
                </div>
                <div className="monitoramento-menu-user-type">
                  {userData.userTypeName === 'vendedor' ? 'Vendedor' : 
                   userData.userTypeName === 'supervisor' ? 'Supervisor' :
                   userData.userTypeName ? userData.userTypeName.charAt(0).toUpperCase() + userData.userTypeName.slice(1) : 
                   'Usuário'}
                </div>
              </div>
            </div>
          )}
          <button className="monitoramento-menu-logout" onClick={handleLogout}>
            <LogOut size={20} strokeWidth={2} />
            <span>Sair</span>
          </button>
        </div>
      </div>
    </nav>
    </>
  );
};

export default MonitoramentoMenu;




