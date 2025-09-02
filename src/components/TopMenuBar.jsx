import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { syncFollowUpStage, checkFollowUpSync } from '../service/sprintHubSyncService';
import autoSyncService from '../service/autoSyncService';
import './TopMenuBar.css';

// Importar ícones SVG
import BandeiraEUA from '../../icones/eua.svg';
import BandeiraBrasil from '../../icones/brasil.svg';
import LogoOficialmed from '../../icones/icone_oficialmed.svg';

const TopMenuBar = ({ 
  sidebarExpanded, 
  toggleSidebar, 
  toggleFullscreen, 
  toggleTheme, 
  isDarkMode,
  currentLanguage,
  changeLanguage,
  onLogout
}) => {
  const navigate = useNavigate();
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const languageDropdownRef = useRef(null);
  
  // Verificar se é admin (temporário - baseado nas credenciais fixas)
  const isAdmin = true; // Por enquanto sempre admin, depois implementar lógica real

  const toggleLanguageDropdown = () => {
    setShowLanguageDropdown(!showLanguageDropdown);
  };

  // Função para sincronização manual
  const handleSync = async () => {
    if (isSyncing) return;
    
    setIsSyncing(true);
    try {
      // Usar o serviço de sincronização automática para manter consistência
      await autoSyncService.forcSync();
      
      // Status será atualizado automaticamente via evento
    } catch (error) {
      console.error('❌ Erro na sincronização manual:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  // Carregar status do serviço de sincronização ao montar
  useEffect(() => {
    const status = autoSyncService.getStatus();
    setLastSyncTime(status.lastSyncTime);
    
    // Escutar atualizações do serviço
    const handleSyncUpdate = (event) => {
      setLastSyncTime(event.detail.lastSyncTime);
    };
    
    window.addEventListener('syncStatusUpdated', handleSyncUpdate);
    
    return () => {
      window.removeEventListener('syncStatusUpdated', handleSyncUpdate);
    };
  }, []);

  // Não é mais necessário - o autoSyncService já gerencia isso

  // Formatar data/hora da última sincronização
  const formatSyncTime = (date) => {
    if (!date) return 'Nunca';
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit', 
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Fechar dropdown quando clicar fora dele
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (languageDropdownRef.current && !languageDropdownRef.current.contains(event.target)) {
        setShowLanguageDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <header className="tmb-top-menu-bar">
      {/* Botão hamburger - sempre visível */}
      <button className="tmb-sidebar-toggle" onClick={toggleSidebar}>
        <div className="tmb-sidebar-toggle-discrete">
          <div className="tmb-hamburger-lines"></div>
          <div className="tmb-hamburger-lines"></div>
          <div className="tmb-hamburger-lines"></div>
        </div>
      </button>

      {/* Logo - visível no mobile */}
      <div className="tmb-logo-mobile" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
        <img src={LogoOficialmed} alt="OficialMed" />
      </div>

      {/* Container de busca - sempre visível */}
      <div className="tmb-search-container">
        <input 
          type="text" 
          className="tmb-search-input" 
          placeholder="Buscar..."
        />
      </div>

      {/* Status de Sincronização */}
      <div className="tmb-sync-status">
        <div className="tmb-sync-info">
          <span className="tmb-sync-label">Última sincronização:</span>
          <span className="tmb-sync-time">{formatSyncTime(lastSyncTime)}</span>
        </div>
        
        {/* Botão de sincronização - apenas para admin */}
        {isAdmin && (
          <button 
            className={`tmb-sync-btn ${isSyncing ? 'syncing' : ''}`}
            onClick={handleSync}
            disabled={isSyncing}
            title="Sincronizar dados do SprintHub"
          >
            {isSyncing ? (
              <>
                <span className="tmb-sync-spinner"></span>
                Sincronizando...
              </>
            ) : (
              <>
                🔄 Sincronizar
              </>
            )}
          </button>
        )}
      </div>

      {/* Container para os ícones da direita - apenas no desktop */}
      <div className="tmb-right-icons-container">
        {/* Seletor de idioma */}
        <div className="tmb-language-selector" ref={languageDropdownRef}>
          <button 
            className="tmb-language-btn"
            onClick={toggleLanguageDropdown}
          >
            <img 
              src={currentLanguage === 'pt-BR' ? BandeiraBrasil : BandeiraEUA} 
              alt={currentLanguage === 'pt-BR' ? 'Brasil' : 'United States'} 
            />
            <span>{currentLanguage === 'pt-BR' ? 'BR' : 'US'}</span>
          </button>
          
          {/* Dropdown de idiomas */}
          {showLanguageDropdown && (
            <div className="tmb-language-dropdown">
              <div 
                className="tmb-language-option" 
                onClick={() => {
                  changeLanguage('pt-BR');
                  setShowLanguageDropdown(false);
                }}
              >
                <img src={BandeiraBrasil} alt="Brasil" />
                <span>Português</span>
              </div>
              <div 
                className="tmb-language-option" 
                onClick={() => {
                  changeLanguage('en-US');
                  setShowLanguageDropdown(false);
                }}
              >
                <img src={BandeiraEUA} alt="English" />
                <span>English</span>
              </div>
            </div>
          )}
        </div>

        <button className="tmb-top-menu-btn" onClick={toggleFullscreen} title="Tela cheia">
          <svg viewBox="0 0 24 24">
            <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/>
          </svg>
        </button>

        <button className="tmb-top-menu-btn" onClick={toggleTheme} title="Alternar tema">
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

        {/* Botão de Logout */}
        {onLogout && (
          <button 
            className="tmb-logout-btn" 
            title="Sair" 
            onClick={onLogout}
          >
            🚪
          </button>
        )}
      </div>
    </header>
  );
};

export default TopMenuBar;
