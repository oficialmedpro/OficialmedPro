import React from 'react';
import LogoIcon from '../../icones/icone_logo.svg';
import Sidebar from './Sidebar';

const MobileComponents = ({ 
  isDarkMode, 
  currentLanguage, 
  translations: t 
}) => {
  return (
    <>
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
    </>
  );
};

export default MobileComponents;
