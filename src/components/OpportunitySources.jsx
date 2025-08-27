import React from 'react';
import './OpportunitySources.css';

const OpportunitySources = ({ formatCurrency, t }) => {
  return (
    <div className="opps-card-main">
      <div className="opps-card-header">
        <div className="opps-platform-icon opps-sources-icon">O</div>
        <span className="opps-platform-name">Origens das Oportunidades</span>
      </div>
      
      <div className="opps-sources-list">
        <div className="opps-source-line">
          <div className="opps-source-content">
            <span className="opps-source-name">Google Ads</span>
            <div className="opps-source-metrics">
              <span className="opps-source-count">1,035</span>
              <span className="opps-source-percent">45%</span>
            </div>
          </div>
          <div className="opps-source-color-bar" style={{background: '#4285f4', width: '45%'}}></div>
        </div>
        <div className="opps-source-line">
          <div className="opps-source-content">
            <span className="opps-source-name">Meta Ads</span>
            <div className="opps-source-metrics">
              <span className="opps-source-count">644</span>
              <span className="opps-source-percent">28%</span>
            </div>
          </div>
          <div className="opps-source-color-bar" style={{background: '#1877f2', width: '28%'}}></div>
        </div>
        <div className="opps-source-line">
          <div className="opps-source-content">
            <span className="opps-source-name">Orgânico</span>
            <div className="opps-source-metrics">
              <span className="opps-source-count">345</span>
              <span className="opps-source-percent">15%</span>
            </div>
          </div>
          <div className="opps-source-color-bar" style={{background: '#10b981', width: '15%'}}></div>
        </div>
        <div className="opps-source-line">
          <div className="opps-source-content">
            <span className="opps-source-name">Indicação</span>
            <div className="opps-source-metrics">
              <span className="opps-source-count">184</span>
              <span className="opps-source-percent">8%</span>
            </div>
          </div>
          <div className="opps-source-color-bar" style={{background: '#f59e0b', width: '8%'}}></div>
        </div>
        <div className="opps-source-line">
          <div className="opps-source-content">
            <span className="opps-source-name">Prescritor</span>
            <div className="opps-source-metrics">
              <span className="opps-source-count">69</span>
              <span className="opps-source-percent">3%</span>
            </div>
          </div>
          <div className="opps-source-color-bar" style={{background: '#8b5cf6', width: '3%'}}></div>
        </div>
        <div className="opps-source-line">
          <div className="opps-source-content">
            <span className="opps-source-name">Campanha</span>
            <div className="opps-source-metrics">
              <span className="opps-source-count">45</span>
              <span className="opps-source-percent">2%</span>
            </div>
          </div>
          <div className="opps-source-color-bar" style={{background: '#06b6d4', width: '2%'}}></div>
        </div>
        <div className="opps-source-line">
          <div className="opps-source-content">
            <span className="opps-source-name">Monitoramento</span>
            <div className="opps-source-metrics">
              <span className="opps-source-count">38</span>
              <span className="opps-source-percent">2%</span>
            </div>
          </div>
          <div className="opps-source-color-bar" style={{background: '#f59e0b', width: '2%'}}></div>
        </div>
        <div className="opps-source-line">
          <div className="opps-source-content">
            <span className="opps-source-name">Colaborador</span>
            <div className="opps-source-metrics">
              <span className="opps-source-count">32</span>
              <span className="opps-source-percent">1%</span>
            </div>
          </div>
          <div className="opps-source-color-bar" style={{background: '#3b82f6', width: '1%'}}></div>
        </div>
        <div className="opps-source-line">
          <div className="opps-source-content">
            <span className="opps-source-name">Franquia</span>
            <div className="opps-source-metrics">
              <span className="opps-source-count">28</span>
              <span className="opps-source-percent">1%</span>
            </div>
          </div>
          <div className="opps-source-color-bar" style={{background: '#ef4444', width: '1%'}}></div>
        </div>
        <div className="opps-source-line">
          <div className="opps-source-content">
            <span className="opps-source-name">Farmácia Parceira</span>
            <div className="opps-source-metrics">
              <span className="opps-source-count">18</span>
              <span className="opps-source-percent">1%</span>
            </div>
          </div>
          <div className="opps-source-color-bar" style={{background: '#10b981', width: '1%'}}></div>
        </div>
        <div className="opps-source-line">
          <div className="opps-source-content">
            <span className="opps-source-name">Monitoramento/Disp</span>
            <div className="opps-source-metrics">
              <span className="opps-source-count">15</span>
              <span className="opps-source-percent">1%</span>
            </div>
          </div>
          <div className="opps-source-color-bar" style={{background: '#06b6d4', width: '1%'}}></div>
        </div>
        <div className="opps-source-line">
          <div className="opps-source-content">
            <span className="opps-source-name">Site</span>
            <div className="opps-source-metrics">
              <span className="opps-source-count">12</span>
              <span className="opps-source-percent">1%</span>
            </div>
          </div>
          <div className="opps-source-color-bar" style={{background: '#8b5cf6', width: '1%'}}></div>
        </div>
        <div className="opps-source-line">
          <div className="opps-source-content">
            <span className="opps-source-name">Phusion/Disparo</span>
            <div className="opps-source-metrics">
              <span className="opps-source-count">10</span>
              <span className="opps-source-percent">1%</span>
            </div>
          </div>
          <div className="opps-source-color-bar" style={{background: '#f59e0b', width: '1%'}}></div>
        </div>
        <div className="opps-source-line">
          <div className="opps-source-content">
            <span className="opps-source-name">Contato Rosana</span>
            <div className="opps-source-metrics">
              <span className="opps-source-count">8</span>
              <span className="opps-source-percent">1%</span>
            </div>
          </div>
          <div className="opps-source-color-bar" style={{background: '#ec4899', width: '1%'}}></div>
        </div>
        <div className="opps-source-line">
          <div className="opps-source-content">
            <span className="opps-source-name">Contato Poliana</span>
            <div className="opps-source-metrics">
              <span className="opps-source-count">6</span>
              <span className="opps-source-percent">1%</span>
            </div>
          </div>
          <div className="opps-source-color-bar" style={{background: '#8b5cf6', width: '1%'}}></div>
        </div>
        <div className="opps-source-line">
          <div className="opps-source-content">
            <span className="opps-source-name">Yampi Parceiro</span>
            <div className="opps-source-metrics">
              <span className="opps-source-count">4</span>
              <span className="opps-source-percent">1%</span>
            </div>
          </div>
          <div className="opps-source-color-bar" style={{background: '#06b6d4', width: '1%'}}></div>
        </div>
      </div>
    </div>
  );
};

export default OpportunitySources;
