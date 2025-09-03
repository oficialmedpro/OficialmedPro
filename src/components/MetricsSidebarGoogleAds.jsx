import React from 'react';
import './MetricsSidebarGoogleAds.css';

const MetricsSidebarGoogleAds = ({ isDarkMode }) => {
  return (
    <div className="metrics-sidebar-google-ads">
      <div className="metrics-sidebar-header">
        <h3>Google Ads Metrics</h3>
        <div className="metrics-sidebar-status">
          <span className="status-indicator active"></span>
          <span>Conectado</span>
        </div>
      </div>
      
      <div className="metrics-sidebar-content">
        <div className="metric-item">
          <span className="metric-label">Contas Ativas</span>
          <span className="metric-value">1</span>
        </div>
        
        <div className="metric-item">
          <span className="metric-label">Campanhas</span>
          <span className="metric-value">12</span>
        </div>
        
        <div className="metric-item">
          <span className="metric-label">Grupos de Anúncios</span>
          <span className="metric-value">24</span>
        </div>
        
        <div className="metric-item">
          <span className="metric-label">Anúncios</span>
          <span className="metric-value">60</span>
        </div>
      </div>
    </div>
  );
};

export default MetricsSidebarGoogleAds;
