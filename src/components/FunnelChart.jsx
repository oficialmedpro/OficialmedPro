import React from 'react';

const FunnelChart = ({ t }) => {
  return (
    <div className="main-chart">
      <div className="chart-header">
        <h3>{t.chartTitle}</h3>
        <span className="chart-period">{t.chartPeriod}</span>
      </div>

      <div className="funnel-container">
        <div className="sources-bar">
          <div className="source-item google">
            <span className="source-label">{t.google}</span>
            <div className="source-value">
              <span className="source-percentage">45%</span>
              <span>/</span>
              <span className="source-count">2.3k</span>
            </div>
          </div>
          <div className="source-item meta">
            <span className="source-label">{t.meta}</span>
            <div className="source-value">
              <span className="source-percentage">28%</span>
              <span>/</span>
              <span className="source-count">1.4k</span>
            </div>
          </div>
          <div className="source-item organic">
            <span className="source-label">{t.organic}</span>
            <div className="source-value">
              <span className="source-percentage">15%</span>
              <span>/</span>
              <span className="source-count">750</span>
            </div>
          </div>
          <div className="source-item indicacao">
            <span className="source-label">{t.indication}</span>
            <div className="source-value">
              <span className="source-percentage">8%</span>
              <span>/</span>
              <span className="source-count">400</span>
            </div>
          </div>
          <div className="source-item prescritor">
            <span className="source-label">{t.prescriber}</span>
            <div className="source-value">
              <span className="source-percentage">3%</span>
              <span>/</span>
              <span className="source-count">150</span>
            </div>
          </div>
          <div className="source-item franquia">
            <span className="source-label">{t.franchise}</span>
            <div className="source-value">
              <span className="source-percentage">1%</span>
              <span>/</span>
              <span className="source-count">50</span>
            </div>
          </div>
        </div>

        <div className="funnel-stage" data-stage="0">
          <div className="funnel-bar">
            <div className="funnel-content">
              <span className="funnel-label">{t.entry}</span>
              <div className="funnel-values">
                <span className="funnel-value">2.3k</span>
                <span className="funnel-loss">-150</span>
              </div>
            </div>
          </div>
          <div className="conversion-rate-box">39,0%</div>
        </div>

        <div className="funnel-stage" data-stage="1">
          <div className="funnel-bar">
            <div className="funnel-content">
              <span className="funnel-label">{t.welcome}</span>
              <div className="funnel-values">
                <span className="funnel-value">897</span>
                <span className="funnel-loss">-433</span>
              </div>
            </div>
          </div>
          <div className="conversion-rate-box">70,8%</div>
        </div>

        <div className="funnel-stage" data-stage="2">
          <div className="funnel-bar">
            <div className="funnel-content">
              <span className="funnel-label">{t.qualified}</span>
              <div className="funnel-values">
                <span className="funnel-value">635</span>
                <span className="funnel-loss">-262</span>
              </div>
            </div>
          </div>
          <div className="conversion-rate-box">58,7%</div>
        </div>

        <div className="funnel-stage" data-stage="3">
          <div className="funnel-bar">
            <div className="funnel-content">
              <span className="funnel-label">{t.budget}</span>
              <div className="funnel-values">
                <span className="funnel-value">373</span>
                <span className="funnel-loss">-187</span>
              </div>
            </div>
          </div>
          <div className="conversion-rate-box">49,9%</div>
        </div>

        <div className="funnel-stage" data-stage="4">
          <div className="funnel-bar">
            <div className="funnel-content">
              <span className="funnel-label">{t.negotiation}</span>
              <div className="funnel-values">
                <span className="funnel-value">186</span>
                <span className="funnel-loss">-93</span>
              </div>
            </div>
          </div>
          <div className="conversion-rate-box">50,0%</div>
        </div>

        <div className="funnel-stage" data-stage="5">
          <div className="funnel-bar">
            <div className="funnel-content">
              <span className="funnel-label">{t.followUp}</span>
              <div className="funnel-values">
                <span className="funnel-value">93</span>
                <span className="funnel-loss">-47</span>
              </div>
            </div>
          </div>
          <div className="conversion-rate-box">50,0%</div>
        </div>

        <div className="funnel-stage" data-stage="6">
          <div className="funnel-bar">
            <div className="funnel-content">
              <span className="funnel-label">{t.registration}</span>
              <div className="funnel-values">
                <span className="funnel-value">46</span>
                <span className="funnel-gain">+46</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FunnelChart;
