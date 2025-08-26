import React from 'react';
import './MetricsSidebar.css';

const MetricsSidebar = ({ formatCurrency, t }) => {
  return (
    <div className="users-sidebar">
      <div className="users-header">
        <h3>{t.financialMetrics}</h3>
      </div>

      <div className="financial-metrics-new">
        {/* Google Metrics Card */}
        <div className="metric-card google-card">
          <div className="metric-card-header">
            <div className="platform-icon google-icon">G</div>
            <span className="platform-name">Google</span>
            <div className="roas-badge roas-excellent">ROAS 3.47x</div>
          </div>
          
          <div className="metrics-grid">
            <div className="metric-item-visual">
              <div className="metric-info">
                <span className="metric-label">Investido</span>
                <span className="metric-value">{formatCurrency(45000, 'BRL')}</span>
                <div className="metric-bar">
                  <div className="metric-fill" style={{width: '85%', background: 'linear-gradient(90deg, #ef4444, #dc2626)'}}></div>
                </div>
              </div>
            </div>

            <div className="metric-item-visual">
              <div className="metric-info">
                <span className="metric-label">Taxa Conversão</span>
                <span className="metric-value">78 → 5 (6.4%)</span>
                <div className="metric-bar">
                  <div className="metric-fill" style={{width: '64%', background: 'linear-gradient(90deg, #3b82f6, #1d4ed8)'}}></div>
                </div>
              </div>
            </div>

            <div className="metric-item-visual">
              <div className="metric-info">
                <span className="metric-label">Valor Ganho</span>
                <span className="metric-value">{formatCurrency(156000, 'BRL')}</span>
                <div className="metric-bar">
                  <div className="metric-fill" style={{width: '92%', background: 'linear-gradient(90deg, #10b981, #059669)'}}></div>
                </div>
              </div>
            </div>

            <div className="metric-item-visual">
              <div className="metric-info">
                <span className="metric-label">Oportunidades Perdidas</span>
                <span className="metric-value">73</span>
                <div className="metric-bar">
                  <div className="metric-fill" style={{width: '73%', background: 'linear-gradient(90deg, #f59e0b, #d97706)'}}></div>
                </div>
              </div>
            </div>

            <div className="metric-item-visual">
              <div className="metric-info">
                <span className="metric-label">Oportunidades Abertas</span>
                <span className="metric-value">12</span>
                <div className="metric-bar">
                  <div className="metric-fill" style={{width: '30%', background: 'linear-gradient(90deg, #8b5cf6, #7c3aed)'}}></div>
                </div>
              </div>
            </div>

            <div className="metric-item-visual">
              <div className="metric-info">
                <span className="metric-label">Valor Perda</span>
                <span className="metric-value">{formatCurrency(89000, 'BRL')}</span>
                <div className="metric-bar">
                  <div className="metric-fill" style={{width: '57%', background: 'linear-gradient(90deg, #ef4444, #dc2626)'}}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Meta Metrics Card */}
        <div className="metric-card meta-card">
          <div className="metric-card-header">
            <div className="platform-icon meta-icon">M</div>
            <span className="platform-name">Meta</span>
            <div className="roas-badge roas-good">ROAS 3.06x</div>
          </div>
          
          <div className="metrics-grid">
            <div className="metric-item-visual">
              <div className="metric-info">
                <span className="metric-label">Investido</span>
                <span className="metric-value">{formatCurrency(32000, 'BRL')}</span>
                <div className="metric-bar">
                  <div className="metric-fill" style={{width: '60%', background: 'linear-gradient(90deg, #ef4444, #dc2626)'}}></div>
                </div>
              </div>
            </div>

            <div className="metric-item-visual">
              <div className="metric-info">
                <span className="metric-label">Taxa Conversão</span>
                <span className="metric-value">45 → 3 (6.7%)</span>
                <div className="metric-bar">
                  <div className="metric-fill" style={{width: '67%', background: 'linear-gradient(90deg, #3b82f6, #1d4ed8)'}}></div>
                </div>
              </div>
            </div>

            <div className="metric-item-visual">
              <div className="metric-info">
                <span className="metric-label">Valor Ganho</span>
                <span className="metric-value">{formatCurrency(98000, 'BRL')}</span>
                <div className="metric-bar">
                  <div className="metric-fill" style={{width: '63%', background: 'linear-gradient(90deg, #10b981, #059669)'}}></div>
                </div>
              </div>
            </div>

            <div className="metric-item-visual">
              <div className="metric-info">
                <span className="metric-label">Oportunidades Perdidas</span>
                <span className="metric-value">42</span>
                <div className="metric-bar">
                  <div className="metric-fill" style={{width: '42%', background: 'linear-gradient(90deg, #f59e0b, #d97706)'}}></div>
                </div>
              </div>
            </div>

            <div className="metric-item-visual">
              <div className="metric-info">
                <span className="metric-label">Oportunidades Abertas</span>
                <span className="metric-value">8</span>
                <div className="metric-bar">
                  <div className="metric-fill" style={{width: '20%', background: 'linear-gradient(90deg, #8b5cf6, #7c3aed)'}}></div>
                </div>
              </div>
            </div>

            <div className="metric-item-visual">
              <div className="metric-info">
                <span className="metric-label">Valor Perda</span>
                <span className="metric-value">{formatCurrency(67000, 'BRL')}</span>
                <div className="metric-bar">
                  <div className="metric-fill" style={{width: '43%', background: 'linear-gradient(90deg, #ef4444, #dc2626)'}}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="metric-card sources-card">
        <div className="metric-card-header">
          <div className="platform-icon sources-icon">O</div>
          <span className="platform-name">Origem das Oportunidades</span>
        </div>
        
        <div className="sources-list">
          <div className="source-line">
            <div className="source-content">
              <span className="source-name">Google Ads</span>
              <div className="source-metrics">
                <span className="source-count">1,035</span>
                <span className="source-percent">45%</span>
              </div>
            </div>
            <div className="source-color-bar" style={{background: '#4285f4', width: '45%'}}></div>
          </div>
          <div className="source-line">
            <div className="source-content">
              <span className="source-name">Meta Ads</span>
              <div className="source-metrics">
                <span className="source-count">644</span>
                <span className="source-percent">28%</span>
              </div>
            </div>
            <div className="source-color-bar" style={{background: '#1877f2', width: '28%'}}></div>
          </div>
          <div className="source-line">
            <div className="source-content">
              <span className="source-name">Orgânico</span>
              <div className="source-metrics">
                <span className="source-count">345</span>
                <span className="source-percent">15%</span>
              </div>
            </div>
            <div className="source-color-bar" style={{background: '#10b981', width: '15%'}}></div>
          </div>
          <div className="source-line">
            <div className="source-content">
              <span className="source-name">Indicação</span>
              <div className="source-metrics">
                <span className="source-count">184</span>
                <span className="source-percent">8%</span>
              </div>
            </div>
            <div className="source-color-bar" style={{background: '#f59e0b', width: '8%'}}></div>
          </div>
          <div className="source-line">
            <div className="source-content">
              <span className="source-name">Prescritor</span>
              <div className="source-metrics">
                <span className="source-count">69</span>
                <span className="source-percent">3%</span>
              </div>
            </div>
            <div className="source-color-bar" style={{background: '#8b5cf6', width: '3%'}}></div>
          </div>
          <div className="source-line">
            <div className="source-content">
              <span className="source-name">Campanha</span>
              <div className="source-metrics">
                <span className="source-count">45</span>
                <span className="source-percent">2%</span>
              </div>
            </div>
            <div className="source-color-bar" style={{background: '#06b6d4', width: '2%'}}></div>
          </div>
          <div className="source-line">
            <div className="source-content">
              <span className="source-name">Monitoramento</span>
              <div className="source-metrics">
                <span className="source-count">38</span>
                <span className="source-percent">2%</span>
              </div>
            </div>
            <div className="source-color-bar" style={{background: '#f59e0b', width: '2%'}}></div>
          </div>
          <div className="source-line">
            <div className="source-content">
              <span className="source-name">Colaborador</span>
              <div className="source-metrics">
                <span className="source-count">32</span>
                <span className="source-percent">1%</span>
              </div>
            </div>
            <div className="source-color-bar" style={{background: '#3b82f6', width: '1%'}}></div>
          </div>
          <div className="source-line">
            <div className="source-content">
              <span className="source-name">Franquia</span>
              <div className="source-metrics">
                <span className="source-count">28</span>
                <span className="source-percent">1%</span>
              </div>
            </div>
            <div className="source-color-bar" style={{background: '#ef4444', width: '1%'}}></div>
          </div>
          <div className="source-line">
            <div className="source-content">
              <span className="source-name">Farmácia Parceira</span>
              <div className="source-metrics">
                <span className="source-count">18</span>
                <span className="source-percent">1%</span>
              </div>
            </div>
            <div className="source-color-bar" style={{background: '#10b981', width: '1%'}}></div>
          </div>
          <div className="source-line">
            <div className="source-content">
              <span className="source-name">Monitoramento/Disp</span>
              <div className="source-metrics">
                <span className="source-count">15</span>
                <span className="source-percent">1%</span>
              </div>
            </div>
            <div className="source-color-bar" style={{background: '#06b6d4', width: '1%'}}></div>
          </div>
          <div className="source-line">
            <div className="source-content">
              <span className="source-name">Site</span>
              <div className="source-metrics">
                <span className="source-count">12</span>
                <span className="source-percent">1%</span>
              </div>
            </div>
            <div className="source-color-bar" style={{background: '#8b5cf6', width: '1%'}}></div>
          </div>
          <div className="source-line">
            <div className="source-content">
              <span className="source-name">Phusion/Disparo</span>
              <div className="source-metrics">
                <span className="source-count">10</span>
                <span className="source-percent">1%</span>
              </div>
            </div>
            <div className="source-color-bar" style={{background: '#f59e0b', width: '1%'}}></div>
          </div>
          <div className="source-line">
            <div className="source-content">
              <span className="source-name">Contato Rosana</span>
              <div className="source-metrics">
                <span className="source-count">8</span>
                <span className="source-percent">1%</span>
              </div>
            </div>
            <div className="source-color-bar" style={{background: '#ec4899', width: '1%'}}></div>
          </div>
          <div className="source-line">
            <div className="source-content">
              <span className="source-name">Contato Poliana</span>
              <div className="source-metrics">
                <span className="source-count">6</span>
                <span className="source-percent">1%</span>
              </div>
            </div>
            <div className="source-color-bar" style={{background: '#8b5cf6', width: '1%'}}></div>
          </div>
          <div className="source-line">
            <div className="source-content">
              <span className="source-name">Yampi Parceiro</span>
              <div className="source-metrics">
                <span className="source-count">4</span>
                <span className="source-percent">1%</span>
              </div>
            </div>
            <div className="source-color-bar" style={{background: '#06b6d4', width: '1%'}}></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MetricsSidebar;
