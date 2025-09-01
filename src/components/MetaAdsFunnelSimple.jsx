import React from "react";
import './MetaAdsFunnel.css';

/**
 * MetaAdsFunnelSimple.jsx
 * 
 * Versão simplificada do funil Meta Ads sem dependência do Recharts
 * usando apenas CSS e SVG para os gráficos sparkline
 */

const COLORS = {
  impressoes: { base: "#8B5CF6" }, // purple
  cliques: { base: "#06B6D4" }, // cyan
  leads: { base: "#F59E0B" }, // yellow
  oportunidades: { base: "#EF4444" }, // red
  vendas: { base: "#10B981" }, // green
};

function Arrow({ direction = "up", color = "#16C784", className = "" }) {
  const rotation = direction === "down" ? "rotate-180" : "rotate-0";
  return (
    <svg
      viewBox="0 0 24 24"
      className={`w-3 h-3 ${rotation} transition-transform ${className}`}
      fill="none"
      stroke={color}
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ width: '12px', height: '12px' }}
    >
      <path d="M7 14L12 9L17 14" />
    </svg>
  );
}

// Função para gerar pontos SVG para gráfico de linha
const generateSVGPath = (data, width = 140, height = 40) => {
  if (!data || data.length === 0) return "";
  
  const maxY = Math.max(...data.map(d => d.y));
  const minY = Math.min(...data.map(d => d.y));
  const range = maxY - minY || 1;
  
  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((d.y - minY) / range) * height;
    return `${x},${y}`;
  }).join(' ');
  
  return `M ${points.replace(/,/g, ' L ')}`;
};

// Função para gerar dados de exemplo para os gráficos
const GEN = (count, center, spread) =>
  Array.from({ length: count }, (_, i) => ({
    x: i,
    y: Math.max(0, center + (Math.random() - 0.5) * spread),
  }));

const DEFAULT_FUNNEL_DATA = [
  {
    id: "impressoes",
    title: "Impressões",
    value: "2.534.892",
    metrics: [
      { label: "CPM", value: "R$ 4,93" },
      { label: "Alcance", value: "1.2M" },
      { label: "Frequência", value: "2.11" }
    ],
    delta: "CTR: 4.94%",
    deltaDirection: "up",
    colorKey: "impressoes",
    data: GEN(12, 55, 8),
    conversionRate: "4.94%"
  },
  {
    id: "cliques",
    title: "Cliques no Link",
    value: "125.274",
    metrics: [
      { label: "CPC", value: "R$ 0,99" },
      { label: "CTR", value: "4.94%" },
      { label: "Únicos", value: "98.2K" }
    ],
    delta: "CVR: 6.95%",
    deltaDirection: "up",
    colorKey: "cliques",
    data: GEN(12, 50, 12),
    conversionRate: "6.95%"
  },
  {
    id: "leads",
    title: "Leads",
    value: "8.706",
    metrics: [
      { label: "CPL", value: "R$ 14,26" },
      { label: "CVR", value: "6.95%" },
      { label: "Qualidade", value: "8.2/10" }
    ],
    delta: "Qualif: 73%",
    deltaDirection: "up",
    colorKey: "leads",
    data: GEN(12, 48, 10),
    conversionRate: "73%"
  },
  {
    id: "oportunidades",
    title: "Oportunidades",
    value: "6.355",
    metrics: [
      { label: "Ticket Médio", value: "R$ 2.840" },
      { label: "Taxa Qualif.", value: "73%" },
      { label: "Em Negoc.", value: "2.1K" }
    ],
    delta: "Conv: 18.2%",
    deltaDirection: "up",
    colorKey: "oportunidades",
    data: GEN(12, 45, 15),
    conversionRate: "18.2%"
  },
  {
    id: "vendas",
    title: "Vendas",
    value: "1.157",
    metrics: [
      { label: "CAC", value: "R$ 107,32" },
      { label: "LTV", value: "R$ 3.200" },
      { label: "ROAS", value: "3.2x" }
    ],
    delta: "ROI: 220%",
    deltaDirection: "up",
    colorKey: "vendas",
    data: GEN(12, 52, 8),
    conversionRate: "100%"
  },
];

export default function MetaAdsFunnelSimple({ items = DEFAULT_FUNNEL_DATA, formatCurrency }) {
  return (
    <div className="meta-ads-funnel-sparkline">
      {/* Header */}
      <div className="funnel-header">
        <h2 className="funnel-title">Funil de Conversão Meta Ads</h2>
        <span className="funnel-period">Últimos 30 dias</span>
      </div>

      {/* Funnel Grid */}
      <div className="funnel-grid">
        {items.map((item, index) => {
          const color = COLORS[item.colorKey]?.base || "#6B7280";
          const svgPath = generateSVGPath(item.data);

          return (
            <React.Fragment key={item.id}>
              {/* Funnel Column */}
              <div className="funnel-column">
                {/* Title */}
                <div className="funnel-column-title">
                  {item.title}
                </div>

                {/* Main Value */}
                <div className="funnel-main-value" style={{ color }}>
                  {item.value}
                </div>

                {/* Sparkline Chart SVG */}
                <div className="funnel-chart">
                  <svg 
                    width="100%" 
                    height="100%" 
                    viewBox="0 0 140 40" 
                    className="sparkline-svg"
                  >
                    <defs>
                      <linearGradient id={`gradient-${item.id}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={color} stopOpacity="0.4" />
                        <stop offset="100%" stopColor={color} stopOpacity="0.05" />
                      </linearGradient>
                    </defs>
                    
                    {/* Área preenchida */}
                    <path
                      d={`${svgPath} L 140,40 L 0,40 Z`}
                      fill={`url(#gradient-${item.id})`}
                    />
                    
                    {/* Linha principal */}
                    <path
                      d={svgPath}
                      fill="none"
                      stroke={color}
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>

                {/* Metrics Grid */}
                <div className="funnel-metrics">
                  {item.metrics.map((metric, idx) => (
                    <div key={idx} className="metric-row">
                      <span className="metric-label">{metric.label}</span>
                      <span className="metric-value">{metric.value}</span>
                    </div>
                  ))}
                </div>

                {/* Conversion Rate */}
                <div className="conversion-rate" style={{ 
                  backgroundColor: `${color}20`, 
                  borderColor: `${color}40`,
                  color: color 
                }}>
                  <Arrow direction={item.deltaDirection} color={color} />
                  <span>{item.delta}</span>
                </div>
              </div>

              {/* Arrow between columns (except after last) */}
              {index < items.length - 1 && (
                <div className="funnel-arrow">
                  <svg viewBox="0 0 24 24" className="arrow-svg">
                    <path 
                      d="M7 14L12 9L17 14" 
                      fill="none" 
                      stroke="#6B7280" 
                      strokeWidth="2" 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      transform="rotate(90 12 12)" 
                    />
                  </svg>
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}