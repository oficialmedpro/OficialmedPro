import React, { useState, useEffect } from 'react';
import './RFMTreemapChart.css';

const RFMTreemapChart = ({
  startDate,
  endDate,
  selectedFunnel,
  selectedUnit,
  selectedSeller,
  selectedOrigin,
  isDarkMode
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hoveredSegment, setHoveredSegment] = useState(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  // Dados dos segmentos RFM na ordem exata da imagem
  const segmentData = [
    // Linha 1 - 3 blocos grandes
    {
      id: 'campeoes',
      name: 'Campeões',
      icon: '👑',
      color: '#10b981',
      clientes: 91,
      percentual: 19.5,
      recencia: 5,
      frequencia: 5,
      valorMonetario: 5,
      descricao: 'Seus melhores clientes! Compram frequentemente, recentemente e gastam muito.',
      recomendacao: 'Recompense-os! Ofereça produtos premium e programas VIP.',
      size: 'large'
    },
    {
      id: 'nao_posso_perder',
      name: 'Não Posso Perder',
      icon: '⚠️',
      color: '#dc2626',
      clientes: 91,
      percentual: 18.2,
      recencia: 1,
      frequencia: 5,
      valorMonetario: 5,
      descricao: 'Clientes valiosos que não compram há muito tempo.',
      recomendacao: 'Campanhas urgentes de retenção e ofertas especiais.',
      size: 'large'
    },
    {
      id: 'em_risco',
      name: 'Em Risco',
      icon: '🔔',
      color: '#f97316',
      clientes: 91,
      percentual: 16.8,
      recencia: 2,
      frequencia: 4,
      valorMonetario: 4,
      descricao: 'Clientes que costumavam ser bons, mas estão diminuindo as compras.',
      recomendacao: 'Campanhas de reativação com desconto limitado.',
      size: 'large'
    },
    // Linha 2 - 4 blocos médios
    {
      id: 'lealdade_potencial',
      name: 'Lealdade Potencial',
      icon: '💎',
      color: '#3b82f6',
      clientes: 91,
      percentual: 15.1,
      recencia: 4,
      frequencia: 3,
      valorMonetario: 4,
      descricao: 'Clientes recentes com potencial para se tornarem fiéis.',
      recomendacao: 'Programas de fidelização e educação sobre produtos.',
      size: 'medium'
    },
    {
      id: 'precisam_atencao',
      name: 'Precisam Atenção',
      icon: '🔔',
      color: '#eab308',
      clientes: 91,
      percentual: 12.3,
      recencia: 3,
      frequencia: 3,
      valorMonetario: 3,
      descricao: 'Clientes que precisam de atenção para não se tornarem inativos.',
      recomendacao: 'Campanhas de engajamento e ofertas personalizadas.',
      size: 'medium'
    },
    {
      id: 'perdidos',
      name: 'Perdidos',
      icon: '❗',
      color: '#475569',
      clientes: 91,
      percentual: 8.7,
      recencia: 1,
      frequencia: 1,
      valorMonetario: 1,
      descricao: 'Clientes que não compram há muito tempo e com baixo valor.',
      recomendacao: 'Campanhas de winback agressivas ou considerar como perdidos.',
      size: 'medium'
    },
    {
      id: 'hibernando',
      name: 'Hibernando',
      icon: '😴',
      color: '#64748b',
      clientes: 91,
      percentual: 7.2,
      recencia: 2,
      frequencia: 2,
      valorMonetario: 2,
      descricao: 'Clientes inativos com baixa frequência e valor.',
      recomendacao: 'Campanhas de reativação com ofertas irresistíveis.',
      size: 'medium'
    },
    // Linha 3 - 3 blocos pequenos
    {
      id: 'prestes_hibernar',
      name: 'Prestes a Hibernar',
      icon: '🌙',
      color: '#6b7280',
      clientes: 91,
      percentual: 5.9,
      recencia: 3,
      frequencia: 2,
      valorMonetario: 2,
      descricao: 'Clientes em risco de se tornarem inativos.',
      recomendacao: 'Ofertas especiais para manter o engajamento.',
      size: 'small'
    },
    {
      id: 'promissores',
      name: 'Promissores',
      icon: '🎯',
      color: '#7c3aed',
      clientes: 91,
      percentual: 4.8,
      recencia: 4,
      frequencia: 2,
      valorMonetario: 3,
      descricao: 'Novos clientes com bom potencial de crescimento.',
      recomendacao: 'Eduque sobre outros produtos e benefícios.',
      size: 'small'
    },
    {
      id: 'clientes_recentes',
      name: 'Clientes Recentes',
      icon: '⏰',
      color: '#06b6d4',
      clientes: 91,
      percentual: 3.2,
      recencia: 5,
      frequencia: 1,
      valorMonetario: 2,
      descricao: 'Novos clientes que fizeram primeira compra recentemente.',
      recomendacao: 'Programa de onboarding personalizado.',
      size: 'small'
    }
  ];

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      // Simular carregamento
      setTimeout(() => {
        setIsLoading(false);
      }, 1000);
    };
    loadData();
  }, [startDate, endDate, selectedFunnel, selectedUnit, selectedSeller, selectedOrigin]);

  const handleMouseEnter = (segment, event) => {
    setHoveredSegment(segment);
    setMousePosition({ x: event.clientX, y: event.clientY });
  };

  const handleMouseMove = (event) => {
    if (hoveredSegment) {
      setMousePosition({ x: event.clientX, y: event.clientY });
    }
  };

  const handleMouseLeave = () => {
    setHoveredSegment(null);
  };

  const formatPercentual = (valor) => `${valor}%`;

  return (
    <div className="rfm-treemap-chart">
      {/* Header */}
      <div className="rfm-treemap-header">
        <h2 className="rfm-treemap-title">Matriz RFM - Treemap</h2>
        <p className="rfm-treemap-subtitle">Segmentação de clientes por Recência, Frequência e Valor Monetário</p>
      </div>

      {/* Treemap */}
      <div className="rfm-treemap-container">
        {isLoading ? (
          <div className="rfm-treemap-loading">
            <div className="loading-spinner"></div>
            <p>Carregando segmentos RFM...</p>
          </div>
        ) : (
          <div className="rfm-treemap-grid">
            {segmentData.map((segment) => (
              <div
                key={segment.id}
                className={`rfm-treemap-block ${segment.size}`}
                style={{ backgroundColor: segment.color }}
                onMouseEnter={(e) => handleMouseEnter(segment, e)}
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
              >
                <div className="rfm-treemap-block-content">
                  <div className="rfm-treemap-icon">{segment.icon}</div>
                  <div className="rfm-treemap-name">{segment.name}</div>
                  <div className="rfm-treemap-stats">
                    <div className="rfm-treemap-clients">{segment.clientes}</div>
                    <div className="rfm-treemap-percent">{formatPercentual(segment.percentual)}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tooltip */}
      {hoveredSegment && (
        <div 
          className="rfm-tooltip"
          style={{
            left: mousePosition.x + 15,
            top: mousePosition.y - 10,
            position: 'fixed',
            zIndex: 1000
          }}
        >
          <div className="rfm-tooltip-header">
            <span className="rfm-tooltip-icon">{hoveredSegment.icon}</span>
            <span className="rfm-tooltip-title">{hoveredSegment.name}</span>
          </div>
          
          <div className="rfm-tooltip-stats">
            <div className="rfm-tooltip-stat">
              <span className="rfm-tooltip-label">Clientes:</span>
              <span className="rfm-tooltip-value">{hoveredSegment.clientes}</span>
            </div>
            <div className="rfm-tooltip-stat">
              <span className="rfm-tooltip-label">Percentual:</span>
              <span className="rfm-tooltip-value">{formatPercentual(hoveredSegment.percentual)}</span>
            </div>
          </div>

          <div className="rfm-tooltip-rfm">
            <div className="rfm-tooltip-rfm-item">
              <span className="rfm-tooltip-rfm-label">R:</span>
              <span className="rfm-tooltip-rfm-value">{hoveredSegment.recencia}</span>
            </div>
            <div className="rfm-tooltip-rfm-item">
              <span className="rfm-tooltip-rfm-label">F:</span>
              <span className="rfm-tooltip-rfm-value">{hoveredSegment.frequencia}</span>
            </div>
            <div className="rfm-tooltip-rfm-item">
              <span className="rfm-tooltip-rfm-label">M:</span>
              <span className="rfm-tooltip-rfm-value">{hoveredSegment.valorMonetario}</span>
            </div>
          </div>

          <div className="rfm-tooltip-description">
            <p><strong>Descrição:</strong> {hoveredSegment.descricao}</p>
            <p><strong>Recomendação:</strong> {hoveredSegment.recomendacao}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default RFMTreemapChart;
