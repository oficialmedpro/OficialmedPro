import React from 'react';
import './TrafficFunnel.css';

const TrafficFunnel = () => {
  return (
    <div className="traffic-funnel-section">
      <div className="section-header">
        <h3 className="section-title">📊 Funil de Tráfego & Performance</h3>
        <span className="section-subtitle">Análise completa de conversão e custos</span>
      </div>
      
      <div className="funnel-metrics-grid">
        {/* Coluna 1: Funil de Tráfego (25%) */}
        <div className="funnel-container">
          <h4 className="funnel-title">🔄 Funil de Tráfego</h4>
          <div className="funnel-stages">
            <div className="funnel-stage" data-stage="0">
              <div className="funnel-bar">
                <div className="funnel-content">
                  <span className="funnel-label">Impressões</span>
                  <div className="funnel-values">
                    <span className="funnel-value">286 mil</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="funnel-stage" data-stage="1">
              <div className="funnel-bar">
                <div className="funnel-content">
                  <span className="funnel-label">Alcance</span>
                  <div className="funnel-values">
                    <span className="funnel-value">219 mil</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="funnel-stage" data-stage="2">
              <div className="funnel-bar">
                <div className="funnel-content">
                  <span className="funnel-label">Cliques</span>
                  <div className="funnel-values">
                    <span className="funnel-value">1.941</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="funnel-stage" data-stage="3">
              <div className="funnel-bar">
                <div className="funnel-content">
                  <span className="funnel-label">Leads</span>
                  <div className="funnel-values">
                    <span className="funnel-value">397</span>
                  </div>
                </div>
              </div>
              <div className="conversion-rate-box">20.5%</div>
            </div>
            
            <div className="funnel-stage" data-stage="4">
              <div className="funnel-bar">
                <div className="funnel-content">
                  <span className="funnel-label">Qualificado</span>
                  <div className="funnel-values">
                    <span className="funnel-value">198</span>
                  </div>
                </div>
              </div>
              <div className="conversion-rate-box">49.9%</div>
            </div>
            
            <div className="funnel-stage" data-stage="5">
              <div className="funnel-bar">
                <div className="funnel-content">
                  <span className="funnel-label">Ganho</span>
                  <div className="funnel-values">
                    <span className="funnel-value">89</span>
                  </div>
                </div>
              </div>
              <div className="conversion-rate-box">44.9%</div>
            </div>
            
            {/* Métricas abaixo do ganho */}
            <div className="funnel-metrics-row">
              <div className="funnel-metric-item">
                <div className="funnel-metric-label">CTR</div>
                <div className="funnel-metric-value">0,94%</div>
              </div>
              <div className="funnel-metric-item">
                <div className="funnel-metric-label">Frequência</div>
                <div className="funnel-metric-value">1,31</div>
              </div>
              <div className="funnel-metric-item">
                <div className="funnel-metric-label">CPM</div>
                <div className="funnel-metric-value">R$ 12,43</div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Colunas 2, 3 e 4 divididas em 2 linhas (3 colunas cada) */}
        <div className="right-columns-grid">
          {/* Primeira linha: 3 colunas */}
          <div className="top-row">
            <div className="small-column">
              <h4 className="column-title">📊 Coluna 2</h4>
              <div className="column-content">
                {/* Conteúdo removido - apenas estrutura */}
              </div>
            </div>
            <div className="small-column">
              <h4 className="column-title">📈 Coluna 3</h4>
              <div className="column-content">
                {/* Conteúdo removido - apenas estrutura */}
              </div>
            </div>
            <div className="small-column">
              <h4 className="column-title">✅ Coluna 4</h4>
              <div className="column-content">
                {/* Conteúdo removido - apenas estrutura */}
              </div>
            </div>
          </div>
          
          {/* Segunda linha: 3 colunas */}
          <div className="bottom-row">
            <div className="small-column">
              <h4 className="column-title">📊 Coluna 5</h4>
              <div className="column-content">
                {/* Conteúdo removido - apenas estrutura */}
              </div>
            </div>
            <div className="small-column">
              <h4 className="column-title">📈 Coluna 6</h4>
              <div className="column-content">
                {/* Conteúdo removido - apenas estrutura */}
              </div>
            </div>
            <div className="small-column">
              <h4 className="column-title">✅ Coluna 7</h4>
              <div className="column-content">
                {/* Conteúdo removido - apenas estrutura */}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Gráficos de Performance */}
      <div className="charts-section">
        <div className="chart-container">
          <h4 className="chart-title">📊 Investimento x Leads (Últimos 15 dias)</h4>
          <div className="line-chart-placeholder">
            <div className="chart-legend">
              <div className="legend-item">
                <span className="legend-color leads"></span>
                <span>Leads</span>
              </div>
              <div className="legend-item">
                <span className="legend-color investment"></span>
                <span>Investimento</span>
              </div>
            </div>
            <div className="chart-data">
              <div className="data-point" style={{left: '10%', top: '60%'}}>122 leads</div>
              <div className="data-point" style={{left: '20%', top: '70%'}}>45 leads</div>
              <div className="data-point" style={{left: '30%', top: '50%'}}>66 leads</div>
              <div className="data-point" style={{left: '40%', top: '40%'}}>137 leads</div>
              <div className="data-point" style={{left: '50%', top: '80%'}}>89 leads</div>
              <div className="data-point" style={{left: '60%', top: '30%'}}>156 leads</div>
              <div className="data-point" style={{left: '70%', top: '90%'}}>23 leads</div>
              <div className="data-point" style={{left: '80%', top: '20%'}}>78 leads</div>
              <div className="data-point" style={{left: '90%', top: '85%'}}>34 leads</div>
            </div>
          </div>
        </div>
        
        <div className="chart-container">
          <h4 className="chart-title">🎯 Melhores Anúncios</h4>
          <div className="donut-chart-placeholder">
            <div className="donut-chart">
              <div className="donut-segment ad3" style={{transform: 'rotate(0deg)'}}></div>
              <div className="donut-segment ad5" style={{transform: 'rotate(165deg)'}}></div>
              <div className="donut-segment ad1" style={{transform: 'rotate(291deg)'}}></div>
              <div className="donut-segment ad4" style={{transform: 'rotate(330deg)'}}></div>
              <div className="donut-segment ad2" style={{transform: 'rotate(350deg)'}}></div>
            </div>
            <div className="donut-legend">
              <div className="legend-item">
                <span className="legend-color ad3"></span>
                <span>AD 3 - 45.8%</span>
              </div>
              <div className="legend-item">
                <span className="legend-color ad5"></span>
                <span>AD 5 - 30.7%</span>
              </div>
              <div className="legend-item">
                <span className="legend-color ad1"></span>
                <span>AD 1 - 20.7%</span>
              </div>
              <div className="legend-item">
                <span className="legend-color ad4"></span>
                <span>AD 4 - 2.5%</span>
              </div>
              <div className="legend-item">
                <span className="legend-color ad2"></span>
                <span>AD 2 - 0.3%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Tabela de Campanhas */}
      <div className="campaigns-table-container">
        <h4 className="table-title">📋 Campanhas e Performance</h4>
        <div className="campaigns-table">
          <div className="table-header">
            <div className="header-cell">Campanhas</div>
            <div className="header-cell">Conjuntos</div>
            <div className="header-cell">Anúncios</div>
            <div className="header-cell">Leads</div>
            <div className="header-cell">Perdas</div>
            <div className="header-cell">Aberto</div>
            <div className="header-cell">Ganho</div>
            <div className="header-cell">ROAS</div>
          </div>
          <div className="table-row">
            <div className="table-cell">[ENET] [FORM] [PME] - V3</div>
            <div className="table-cell">PUB 1</div>
            <div className="table-cell">AD 5</div>
            <div className="table-cell">122</div>
            <div className="table-cell">45</div>
            <div className="table-cell">67</div>
            <div className="table-cell">10</div>
            <div className="table-cell">3.2x</div>
          </div>
          <div className="table-row">
            <div className="table-cell">[ENET] [FORM] [PME] - V3</div>
            <div className="table-cell">PUB 2</div>
            <div className="table-cell">AD 3</div>
            <div className="table-cell">156</div>
            <div className="table-cell">78</div>
            <div className="table-cell">45</div>
            <div className="table-cell">33</div>
            <div className="table-cell">4.1x</div>
          </div>
          <div className="table-row">
            <div className="table-cell">[ENET] [FORM] [PME] - V3</div>
            <div className="table-cell">PUB 3</div>
            <div className="table-cell">AD 1</div>
            <div className="table-cell">89</div>
            <div className="table-cell">34</div>
            <div className="table-cell">23</div>
            <div className="table-cell">32</div>
            <div className="table-cell">2.8x</div>
          </div>
          <div className="table-row">
            <div className="table-cell">[ENET] [FORM] [PME] - V3</div>
            <div className="table-cell">PUB 1</div>
            <div className="table-cell">AD 2</div>
            <div className="table-cell">45</div>
            <div className="table-cell">23</div>
            <div className="table-cell">12</div>
            <div className="table-cell">10</div>
            <div className="table-cell">1.9x</div>
          </div>
          <div className="table-row">
            <div className="table-cell">[ENET] [FORM] [PME] - V3</div>
            <div className="table-cell">PUB 2</div>
            <div className="table-cell">AD 4</div>
            <div className="table-cell">67</div>
            <div className="table-cell">34</div>
            <div className="table-cell">18</div>
            <div className="table-cell">15</div>
            <div className="table-cell">2.4x</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrafficFunnel;
