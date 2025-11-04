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
import './ReativacaoMenu.css';

const ReativacaoMenu = ({ onLogout }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [userData, setUserData] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    // Carregar dados do usuário do localStorage
    const storedUserData = localStorage.getItem('reativacao_userData');
    if (storedUserData) {
      try {
        setUserData(JSON.parse(storedUserData));
      } catch (error) {
        console.error('Erro ao parsear userData:', error);
      }
    }
  }, []);

  const menuItems = [
    { path: '/reativacao', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/reativacao/1x', label: 'Compraram 1x', icon: Hash, number: '1' },
    { path: '/reativacao/2x', label: 'Compraram 2x', icon: Hash, number: '2' },
    { path: '/reativacao/3x', label: 'Compraram 3x', icon: Hash, number: '3' },
    { path: '/reativacao/3x-plus', label: 'Compraram 3+ vezes', icon: Hash, number: '3+' }
  ];

  const isActive = (path) => {
    if (path === '/reativacao') {
      return location.pathname === '/reativacao';
    }
    return location.pathname === path;
  };

  const handleLogout = () => {
    // Limpar dados de autenticação de reativação
    localStorage.removeItem('reativacao_authenticated');
    localStorage.removeItem('reativacao_loginTime');
    localStorage.removeItem('reativacao_token');
    localStorage.removeItem('reativacao_userData');
    
    // Redirecionar para login de reativação
    navigate('/reativacao/login');
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
        className="reativacao-menu-toggle"
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        aria-label="Toggle menu"
      >
        {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Overlay para fechar menu ao clicar fora */}
      {mobileMenuOpen && (
        <div
          className="reativacao-menu-overlay"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      <nav className={`reativacao-menu ${mobileMenuOpen ? 'mobile-open' : ''}`}>
        <div className="reativacao-menu-container">
        <div className="reativacao-menu-logo">
          <img src={LogoOficialmedLight} alt="OficialMed" className="reativacao-menu-logo-img" />
          <span className="reativacao-menu-title">Reativação</span>
        </div>
        
        <div className="reativacao-menu-items">
          {menuItems.map((item) => {
            const IconComponent = item.icon;
            return (
              <button
                key={item.path}
                className={`reativacao-menu-item ${isActive(item.path) ? 'active' : ''}`}
                onClick={() => handleMenuItemClick(item.path)}
              >
                <span className="reativacao-menu-item-icon">
                  {item.number ? (
                    <span className="reativacao-menu-number">{item.number}</span>
                  ) : (
                    <IconComponent size={20} strokeWidth={2} />
                  )}
                </span>
                <span className="reativacao-menu-item-label">{item.label}</span>
              </button>
            );
          })}
        </div>

        <div className="reativacao-menu-footer">
          {userData && (
            <div className="reativacao-menu-user-info">
              <div className="reativacao-menu-user-icon">
                <User size={16} strokeWidth={2} />
              </div>
              <div className="reativacao-menu-user-details">
                <div className="reativacao-menu-user-name">
                  {userData.firstName || userData.name || userData.nome || userData.username || 'Usuário'}
                </div>
                <div className="reativacao-menu-user-type">
                  {userData.userTypeName === 'vendedor' ? 'Vendedor' : 
                   userData.userTypeName === 'supervisor' ? 'Supervisor' :
                   userData.userTypeName ? userData.userTypeName.charAt(0).toUpperCase() + userData.userTypeName.slice(1) : 
                   'Usuário'}
                </div>
              </div>
            </div>
          )}
          <button className="reativacao-menu-logout" onClick={handleLogout}>
            <LogOut size={20} strokeWidth={2} />
            <span>Sair</span>
          </button>
        </div>
      </div>
    </nav>
    </>
  );
};

export default ReativacaoMenu;

