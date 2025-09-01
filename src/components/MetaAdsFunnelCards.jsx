import React from "react";
import './MetaAdsFunnelCards.css';

/**
 * MetaAdsFunnelCards.jsx
 * 
 * Componente exato baseado na tela 28 - Cards com sparkline area charts
 * Cores, fontes e layout idênticos à referência visual fornecida
 */

const COLORS = {
  investimento: { base: "#16C784", name: "Verde" }, // green
  leads: { base: "#1F6FEB", name: "Azul" }, // blue
  cliques: { base: "#EA3943", name: "Vermelho" }, // red
  impressoes: { base: "#F39C12", name: "Laranja" }, // orange
  alcance: { base: "#9B59B6", name: "Roxo" }, // purple
};

// Componente para seta triangular
function TriangleArrow({ direction = "up", color = "#16C784" }) {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" className="triangle-arrow">
      <path
        d={direction === "up" ? "M6 2 L10 8 L2 8 Z" : "M6 10 L10 4 L2 4 Z"}
        fill={color}
      />
    </svg>
  );
}

// Função para gerar pontos suaves para o gráfico de área
const generateSmoothPath = (data, width = 200, height = 40) => {
  if (!data || data.length < 2) return "";
  
  const maxY = Math.max(...data.map(d => d.y));
  const minY = Math.min(...data.map(d => d.y));
  const range = maxY - minY || 1;
  
  const points = data.map((d, i) => ({
    x: (i / (data.length - 1)) * width,
    y: height - ((d.y - minY) / range) * height
  }));
  
  // Criar curva suave usando quadratic curves
  let path = `M ${points[0].x} ${points[0].y}`;
  
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const next = points[i + 1];
    
    if (i === points.length - 1) {
      // Último ponto
      path += ` L ${curr.x} ${curr.y}`;
    } else {
      // Curva suave
      const cpX = curr.x;
      const cpY = curr.y;
      path += ` Q ${cpX} ${cpY} ${(curr.x + next.x) / 2} ${(curr.y + next.y) / 2}`;
    }
  }
  
  return path;
};

// Dados simulados baseados na tela 28
const GEN = (count, center, spread) =>
  Array.from({ length: count }, (_, i) => ({
    x: i,
    y: Math.max(0, center + (Math.random() - 0.5) * spread + Math.sin(i * 0.5) * (spread * 0.3)),
  }));

const FUNNEL_CARDS_DATA = [
  {
    id: "investimento",
    title: "Investimento",
    value: "R$ 3.561,12",
    delta: "+ 39,7%",
    deltaDirection: "up",
    colorKey: "investimento",
    data: GEN(20, 30, 12),
    conversionRate: "100%"
  },
  {
    id: "leads",
    title: "Leads",
    value: "397",
    delta: "+ 62,7%",
    deltaDirection: "up",
    colorKey: "leads",
    data: GEN(20, 35, 8),
    conversionRate: "73%"
  },
  {
    id: "cliques", 
    title: "Cliques",
    value: "1.941",
    delta: "+ 32,0%",
    deltaDirection: "up",
    colorKey: "cliques",
    data: GEN(20, 25, 10),
    conversionRate: "6.95%"
  },
  {
    id: "impressoes",
    title: "Impressões",
    value: "286.418",
    delta: "+ 53,2%",
    deltaDirection: "up",
    colorKey: "impressoes",
    data: GEN(20, 28, 14),
    conversionRate: "4.94%"
  },
  {
    id: "alcance",
    title: "Alcance",
    value: "218.707", 
    delta: "+ 47,3%",
    deltaDirection: "up",
    colorKey: "alcance",
    data: GEN(20, 32, 6),
    conversionRate: "18.2%"
  },
];

export default function MetaAdsFunnelCards({ items = FUNNEL_CARDS_DATA, children }) {
  return (
    <div className="meta-funnel-cards-container">
      {/* Header */}
      <div className="funnel-cards-header">
        <h2 className="funnel-cards-title">Métricas de Performance Meta Ads</h2>
        <span className="funnel-cards-period">Últimos 30 dias</span>
      </div>

      {/* Conteúdo opcional entre header e grid */}
      {children}

      {/* Cards Grid */}
      <div className="funnel-cards-grid">
        {items.map((item, index) => {
          const color = COLORS[item.colorKey]?.base || "#6B7280";
          const deltaColor = item.deltaDirection === "up" ? "#16C784" : "#EA3943";
          const svgPath = generateSmoothPath(item.data);

          return (
            <React.Fragment key={item.id}>
              {/* Card */}
              <div className="funnel-card">
                {/* Título */}
                <div className="card-title">
                  {item.title}
                </div>

                {/* Valor Principal */}
                <div className="card-main-value">
                  {item.value}
                </div>

                {/* Delta com seta */}
                <div className="card-delta" style={{ color: deltaColor }}>
                  <TriangleArrow direction={item.deltaDirection} color={deltaColor} />
                  <span>{item.delta}</span>
                </div>

                {/* Mini Sparkline Area Chart */}
                <div className="card-sparkline">
                  <svg 
                    width="100%" 
                    height="100%" 
                    viewBox="0 0 200 40"
                    className="sparkline-svg"
                  >
                    <defs>
                      <linearGradient id={`area-gradient-${item.id}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={color} stopOpacity="0.3" />
                        <stop offset="100%" stopColor={color} stopOpacity="0.05" />
                      </linearGradient>
                    </defs>
                    
                    {/* Área preenchida */}
                    <path
                      d={`${svgPath} L 200,40 L 0,40 Z`}
                      fill={`url(#area-gradient-${item.id})`}
                    />
                    
                    {/* Linha principal suave */}
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

                {/* Taxa de conversão na base */}
                <div className="card-conversion" style={{ color }}>
                  {item.conversionRate}
                </div>
              </div>

              {/* Seta entre cards (exceto no último) */}
              {index < items.length - 1 && (
                <div className="card-arrow">
                  <svg viewBox="0 0 24 24" className="arrow-icon">
                    <path 
                      d="M9 18L15 12L9 6" 
                      fill="none" 
                      stroke="#4B5563" 
                      strokeWidth="2" 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
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