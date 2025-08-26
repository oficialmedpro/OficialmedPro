import React from 'react';
import './MetricsSidebar.css';

const MetricsSidebar = ({ formatCurrency, t }) => {
  return (
    <div className="ms-users-sidebar">
      <div className="ms-users-header">
        <h3>{t.financialMetrics}</h3>
      </div>

      <div className="ms-financial-metrics-new">
        {/* Google Metrics Card */}
        <div className="ms-metric-card ms-google-card">
          <div className="ms-metric-card-header">
            <div className="ms-platform-icon ms-google-icon">G</div>
            <span className="ms-platform-name">Google</span>
            <div className="ms-roas-badge ms-roas-excellent">ROAS 3.47x</div>
          </div>
          
          <div className="ms-metrics-grid">
            <div className="ms-metric-item-visual">
              <div className="ms-metric-info">
                <span className="ms-metric-label">Investido</span>
                <span className="ms-metric-value">{formatCurrency(45000, 'BRL')}</span>
                <div className="ms-metric-bar">
                  <div className="ms-metric-fill" style={{width: '85%', background: 'linear-gradient(90deg, #ef4444, #dc2626)'}}></div>
                </div>
              </div>
            </div>

            <div className="ms-metric-item-visual">
              <div className="ms-metric-info">
                <span className="ms-metric-label">Taxa Conversão</span>
                <span className="ms-metric-value">78 → 5 (6.4%)</span>
                <div className="ms-metric-bar">
                  <div className="ms-metric-fill" style={{width: '64%', background: 'linear-gradient(90deg, #3b82f6, #1d4ed8)'}}></div>
                </div>
              </div>
            </div>

            <div className="ms-metric-item-visual">
              <div className="ms-metric-info">
                <span className="ms-metric-label">Valor Ganho</span>
                <span className="ms-metric-value">{formatCurrency(156000, 'BRL')}</span>
                <div className="ms-metric-bar">
                  <div className="ms-metric-fill" style={{width: '92%', background: 'linear-gradient(90deg, #10b981, #059669)'}}></div>
                </div>
              </div>
            </div>

            <div className="ms-metric-item-visual">
              <div className="ms-metric-info">
                <span className="ms-metric-label">Oportunidades Perdidas</span>
                <span className="ms-metric-value">73</span>
                <div className="ms-metric-bar">
                  <div className="ms-metric-fill" style={{width: '73%', background: 'linear-gradient(90deg, #f59e0b, #d97706)'}}></div>
                </div>
              </div>
            </div>

            <div className="ms-metric-item-visual">
              <div className="ms-metric-info">
                <span className="ms-metric-label">Oportunidades Abertas</span>
                <span className="ms-metric-value">12</span>
                <div className="ms-metric-bar">
                  <div className="ms-metric-fill" style={{width: '30%', background: 'linear-gradient(90deg, #8b5cf6, #7c3aed)'}}></div>
                </div>
              </div>
            </div>

            <div className="ms-metric-item-visual">
              <div className="ms-metric-info">
                <span className="ms-metric-label">Valor Perda</span>
                <span className="ms-metric-value">{formatCurrency(89000, 'BRL')}</span>
                <div className="ms-metric-bar">
                  <div className="ms-metric-fill" style={{width: '57%', background: 'linear-gradient(90deg, #ef4444, #dc2626)'}}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Meta Metrics Card */}
        <div className="ms-metric-card ms-meta-card">
          <div className="ms-metric-card-header">
            <div className="ms-platform-icon ms-meta-icon">M</div>
            <span className="ms-platform-name">Meta</span>
            <div className="ms-roas-badge ms-roas-good">ROAS 3.06x</div>
          </div>
          
          <div className="ms-metrics-grid">
            <div className="ms-metric-item-visual">
              <div className="ms-metric-info">
                <span className="ms-metric-label">Investido</span>
                <span className="ms-metric-value">{formatCurrency(32000, 'BRL')}</span>
                <div className="ms-metric-bar">
                  <div className="ms-metric-fill" style={{width: '60%', background: 'linear-gradient(90deg, #ef4444, #dc2626)'}}></div>
                </div>
              </div>
            </div>

            <div className="ms-metric-item-visual">
              <div className="ms-metric-info">
                <span className="ms-metric-label">Taxa Conversão</span>
                <span className="ms-metric-value">45 → 3 (6.7%)</span>
                <div className="ms-metric-bar">
                  <div className="ms-metric-fill" style={{width: '67%', background: 'linear-gradient(90deg, #3b82f6, #1d4ed8)'}}></div>
                </div>
              </div>
            </div>

            <div className="ms-metric-item-visual">
              <div className="ms-metric-info">
                <span className="ms-metric-label">Valor Ganho</span>
                <span className="ms-metric-value">{formatCurrency(98000, 'BRL')}</span>
                <div className="ms-metric-bar">
                  <div className="ms-metric-fill" style={{width: '63%', background: 'linear-gradient(90deg, #10b981, #059669)'}}></div>
                </div>
              </div>
            </div>

            <div className="ms-metric-item-visual">
              <div className="ms-metric-info">
                <span className="ms-metric-label">Oportunidades Perdidas</span>
                <span className="ms-metric-value">42</span>
                <div className="ms-metric-bar">
                  <div className="ms-metric-fill" style={{width: '42%', background: 'linear-gradient(90deg, #f59e0b, #d97706)'}}></div>
                </div>
              </div>
            </div>

            <div className="ms-metric-item-visual">
              <div className="ms-metric-info">
                <span className="ms-metric-label">Oportunidades Abertas</span>
                <span className="ms-metric-value">8</span>
                <div className="ms-metric-bar">
                  <div className="ms-metric-fill" style={{width: '20%', background: 'linear-gradient(90deg, #8b5cf6, #7c3aed)'}}></div>
                </div>
              </div>
            </div>

            <div className="ms-metric-item-visual">
              <div className="ms-metric-info">
                <span className="ms-metric-label">Valor Perda</span>
                <span className="ms-metric-value">{formatCurrency(67000, 'BRL')}</span>
                <div className="ms-metric-bar">
                  <div className="ms-metric-fill" style={{width: '43%', background: 'linear-gradient(90deg, #ef4444, #dc2626)'}}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="ms-metric-card ms-sources-card">
        <div className="ms-metric-card-header">
          <div className="ms-platform-icon ms-sources-icon">O</div>
          <span className="ms-platform-name">Origem das Oportunidades</span>
        </div>
        
        <div className="ms-sources-list">
          <div className="ms-source-line">
            <div className="ms-source-content">
              <span className="ms-source-name">Google Ads</span>
              <div className="ms-source-metrics">
                <span className="ms-source-count">1,035</span>
                <span className="ms-source-percent">45%</span>
              </div>
            </div>
            <div className="ms-source-color-bar" style={{background: '#4285f4', width: '45%'}}></div>
          </div>
          <div className="ms-source-line">
            <div className="ms-source-content">
              <span className="ms-source-name">Meta Ads</span>
              <div className="ms-source-metrics">
                <span className="ms-source-count">644</span>
                <span className="ms-source-percent">28%</span>
              </div>
            </div>
            <div className="ms-source-color-bar" style={{background: '#1877f2', width: '28%'}}></div>
          </div>
          <div className="ms-source-line">
            <div className="ms-source-content">
              <span className="ms-source-name">Orgânico</span>
              <div className="ms-source-metrics">
                <span className="ms-source-count">345</span>
                <span className="ms-source-percent">15%</span>
              </div>
            </div>
            <div className="ms-source-color-bar" style={{background: '#10b981', width: '15%'}}></div>
          </div>
          <div className="ms-source-line">
            <div className="ms-source-content">
              <span className="ms-source-name">Indicação</span>
              <div className="ms-source-metrics">
                <span className="ms-source-count">184</span>
                <span className="ms-source-percent">8%</span>
              </div>
            </div>
            <div className="ms-source-color-bar" style={{background: '#f59e0b', width: '8%'}}></div>
          </div>
          <div className="ms-source-line">
            <div className="ms-source-content">
              <span className="ms-source-name">Prescritor</span>
              <div className="ms-source-metrics">
                <span className="ms-source-count">69</span>
                <span className="ms-source-percent">3%</span>
              </div>
            </div>
            <div className="ms-source-color-bar" style={{background: '#8b5cf6', width: '3%'}}></div>
          </div>
          <div className="ms-source-line">
            <div className="ms-source-content">
              <span className="ms-source-name">Campanha</span>
              <div className="ms-source-metrics">
                <span className="ms-source-count">45</span>
                <span className="ms-source-percent">2%</span>
              </div>
            </div>
            <div className="ms-source-color-bar" style={{background: '#06b6d4', width: '2%'}}></div>
          </div>
          <div className="ms-source-line">
            <div className="ms-source-content">
              <span className="ms-source-name">Monitoramento</span>
              <div className="ms-source-metrics">
                <span className="ms-source-count">38</span>
                <span className="ms-source-percent">2%</span>
              </div>
            </div>
            <div className="ms-source-color-bar" style={{background: '#f59e0b', width: '2%'}}></div>
          </div>
          <div className="ms-source-line">
            <div className="ms-source-content">
              <span className="ms-source-name">Colaborador</span>
              <div className="ms-source-metrics">
                <span className="ms-source-count">32</span>
                <span className="ms-source-percent">1%</span>
              </div>
            </div>
            <div className="ms-source-color-bar" style={{background: '#3b82f6', width: '1%'}}></div>
          </div>
          <div className="ms-source-line">
            <div className="ms-source-content">
              <span className="ms-source-name">Franquia</span>
              <div className="ms-source-metrics">
                <span className="ms-source-count">28</span>
                <span className="ms-source-percent">1%</span>
              </div>
            </div>
            <div className="ms-source-color-bar" style={{background: '#ef4444', width: '1%'}}></div>
          </div>
          <div className="ms-source-line">
            <div className="ms-source-content">
              <span className="ms-source-name">Farmácia Parceira</span>
              <div className="ms-source-metrics">
                <span className="ms-source-count">18</span>
                <span className="ms-source-percent">1%</span>
              </div>
            </div>
            <div className="ms-source-color-bar" style={{background: '#10b981', width: '1%'}}></div>
          </div>
          <div className="ms-source-line">
            <div className="ms-source-content">
              <span className="ms-source-name">Monitoramento/Disp</span>
              <div className="ms-source-metrics">
                <span className="ms-source-count">15</span>
                <span className="ms-source-percent">1%</span>
              </div>
            </div>
            <div className="ms-source-color-bar" style={{background: '#06b6d4', width: '1%'}}></div>
          </div>
          <div className="ms-source-line">
            <div className="ms-source-content">
              <span className="ms-source-name">Site</span>
              <div className="ms-source-metrics">
                <span className="ms-source-count">12</span>
                <span className="ms-source-percent">1%</span>
              </div>
            </div>
            <div className="ms-source-color-bar" style={{background: '#8b5cf6', width: '1%'}}></div>
          </div>
          <div className="ms-source-line">
            <div className="ms-source-content">
              <span className="ms-source-name">Phusion/Disparo</span>
              <div className="ms-source-metrics">
                <span className="ms-source-count">10</span>
                <span className="ms-source-percent">1%</span>
              </div>
            </div>
            <div className="ms-source-color-bar" style={{background: '#f59e0b', width: '1%'}}></div>
          </div>
          <div className="ms-source-line">
            <div className="ms-source-content">
              <span className="ms-source-name">Contato Rosana</span>
              <div className="ms-source-metrics">
                <span className="ms-source-count">8</span>
                <span className="ms-source-percent">1%</span>
              </div>
            </div>
            <div className="ms-source-color-bar" style={{background: '#ec4899', width: '1%'}}></div>
          </div>
          <div className="ms-source-line">
            <div className="ms-source-content">
              <span className="ms-source-name">Contato Poliana</span>
              <div className="ms-source-metrics">
                <span className="ms-source-count">6</span>
                <span className="ms-source-percent">1%</span>
              </div>
            </div>
            <div className="ms-source-color-bar" style={{background: '#8b5cf6', width: '1%'}}></div>
          </div>
          <div className="ms-source-line">
            <div className="ms-source-content">
              <span className="ms-source-name">Yampi Parceiro</span>
              <div className="ms-source-metrics">
                <span className="ms-source-count">4</span>
                <span className="ms-source-percent">1%</span>
              </div>
            </div>
            <div className="ms-source-color-bar" style={{background: '#06b6d4', width: '1%'}}></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MetricsSidebar;
