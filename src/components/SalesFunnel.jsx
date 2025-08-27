import React from 'react';
import './SalesFunnel.css';

const SalesFunnel = ({ t }) => {
  return (
    <div className="sales-funnel-container">
      <div className="sales-funnel-header">
        <h3>{t.chartTitle}</h3>
        <span className="sales-funnel-period">{t.chartPeriod}</span>
      </div>

      <div className="sales-funnel-wrapper">
        <div className="sales-funnel-sources-bar">
          <div className="sales-funnel-source-item sales-funnel-google">
            <span className="sales-funnel-source-label">{t.google}</span>
            <div className="sales-funnel-source-value">
              <span className="sales-funnel-source-percentage">45%</span>
              <span>/</span>
              <span className="sales-funnel-source-count">2.3k</span>
            </div>
          </div>
          <div className="sales-funnel-source-item sales-funnel-meta">
            <span className="sales-funnel-source-label">{t.meta}</span>
            <div className="sales-funnel-source-value">
              <span className="sales-funnel-source-percentage">28%</span>
              <span>/</span>
              <span className="sales-funnel-source-count">1.4k</span>
            </div>
          </div>
          <div className="sales-funnel-source-item sales-funnel-organic">
            <span className="sales-funnel-source-label">{t.organic}</span>
            <div className="sales-funnel-source-value">
              <span className="sales-funnel-source-percentage">15%</span>
              <span>/</span>
              <span className="sales-funnel-source-count">750</span>
            </div>
          </div>
          <div className="sales-funnel-source-item sales-funnel-indicacao">
            <span className="sales-funnel-source-label">{t.indication}</span>
            <div className="sales-funnel-source-value">
              <span className="sales-funnel-source-percentage">8%</span>
              <span>/</span>
              <span className="sales-funnel-source-count">400</span>
            </div>
          </div>
          <div className="sales-funnel-source-item sales-funnel-prescritor">
            <span className="sales-funnel-source-label">{t.prescriber}</span>
            <div className="sales-funnel-source-value">
              <span className="sales-funnel-source-percentage">3%</span>
              <span>/</span>
              <span className="sales-funnel-source-count">150</span>
            </div>
          </div>
          <div className="sales-funnel-source-item sales-funnel-franquia">
            <span className="sales-funnel-source-label">{t.franchise}</span>
            <div className="sales-funnel-source-value">
              <span className="sales-funnel-source-percentage">1%</span>
              <span>/</span>
              <span className="sales-funnel-source-count">50</span>
            </div>
          </div>
        </div>

        <div className="sales-funnel-stages">
          <div className="sales-funnel-stage" data-stage="0">
            <div className="sales-funnel-bar">
              <div className="sales-funnel-content">
                <span className="sales-funnel-label">{t.entry}</span>
                <div className="sales-funnel-values">
                  <span className="sales-funnel-value">2.3k</span>
                  <span className="sales-funnel-loss">-150</span>
                </div>
              </div>
            </div>
            <div className="sales-funnel-conversion-rate-box">39,0%</div>
          </div>

          <div className="sales-funnel-stage" data-stage="1">
            <div className="sales-funnel-bar">
              <div className="sales-funnel-content">
                <span className="sales-funnel-label">{t.welcome}</span>
                <div className="sales-funnel-values">
                  <span className="sales-funnel-value">897</span>
                  <span className="sales-funnel-loss">-433</span>
                </div>
              </div>
            </div>
            <div className="sales-funnel-conversion-rate-box">70,8%</div>
          </div>

          <div className="sales-funnel-stage" data-stage="2">
            <div className="sales-funnel-bar">
              <div className="sales-funnel-content">
                <span className="sales-funnel-label">{t.qualified}</span>
                <div className="sales-funnel-values">
                  <span className="sales-funnel-value">635</span>
                  <span className="sales-funnel-loss">-262</span>
                </div>
              </div>
            </div>
            <div className="sales-funnel-conversion-rate-box">58,7%</div>
          </div>

          <div className="sales-funnel-stage" data-stage="3">
            <div className="sales-funnel-bar">
              <div className="sales-funnel-content">
                <span className="sales-funnel-label">{t.budget}</span>
                <div className="sales-funnel-values">
                  <span className="sales-funnel-value">373</span>
                  <span className="sales-funnel-loss">-187</span>
                </div>
              </div>
            </div>
            <div className="sales-funnel-conversion-rate-box">49,9%</div>
          </div>

          <div className="sales-funnel-stage" data-stage="4">
            <div className="sales-funnel-bar">
              <div className="sales-funnel-content">
                <span className="sales-funnel-label">{t.negotiation}</span>
                <div className="sales-funnel-values">
                  <span className="sales-funnel-value">186</span>
                  <span className="sales-funnel-loss">-93</span>
                </div>
              </div>
            </div>
            <div className="sales-funnel-conversion-rate-box">50,0%</div>
          </div>

          <div className="sales-funnel-stage" data-stage="5">
            <div className="sales-funnel-bar">
              <div className="sales-funnel-content">
                <span className="sales-funnel-label">{t.followUp}</span>
                <div className="sales-funnel-values">
                  <span className="sales-funnel-value">93</span>
                  <span className="sales-funnel-loss">-47</span>
                </div>
              </div>
            </div>
            <div className="sales-funnel-conversion-rate-box">50,0%</div>
          </div>

          <div className="sales-funnel-stage" data-stage="6">
            <div className="sales-funnel-bar">
              <div className="sales-funnel-content">
                <span className="sales-funnel-label">{t.registration}</span>
                <div className="sales-funnel-values">
                  <span className="sales-funnel-value">46</span>
                  <span className="sales-funnel-gain">+46</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SalesFunnel;
