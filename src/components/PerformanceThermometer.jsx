import React from 'react';
import './PerformanceThermometer.css';

const PerformanceThermometer = ({ currentValue, previousValue, change, isPositive, color, metaPercentage }) => {
  const current = parseInt(currentValue.toString().replace(/[^\d]/g, ''));
  const previous = parseInt(previousValue.toString().replace(/[^\d]/g, ''));
  
  // 🎯 NOVA LÓGICA: Usar metaPercentage se disponível, senão usar lógica anterior
  let performanceScore;
  let angle;
  
  if (metaPercentage !== undefined && metaPercentage !== null) {
    // Usar percentual da meta: -100% a +100%
    // -100% = início vermelho, 0% = meio amarelo, +100% = fim verde
    performanceScore = Math.max(Math.min(metaPercentage, 100), -100); // Limitar entre -100% e +100%
    
    // Novo mapeamento: -25% deve estar no amarelo/verde (mais à direita)
    // -100% = 0°, -25% = 135°, 0% = 160°, +100% = 180°
    if (performanceScore <= -25) {
      // -100% a -25% mapear para 0° a 135°
      angle = ((performanceScore + 100) / 75) * 135;
    } else {
      // -25% a +100% mapear para 135° a 180°
      angle = 135 + ((performanceScore + 25) / 125) * 45;
    }
  } else {
    // Lógica anterior para compatibilidade
    const performanceRatio = previous > 0 ? (current / previous) : 1;
    performanceScore = Math.min(Math.max(performanceRatio * 100, 0), 200);
    angle = Math.min((performanceScore / 200) * 180, 180);
  }
  
  // Determinar cor baseada na performance
  const getThermometerColor = () => {
    if (metaPercentage !== undefined && metaPercentage !== null) {
      // Nova lógica baseada no percentual da meta
      if (metaPercentage >= 0) return '#10b981'; // Verde - Meta atingida ou superada (0%+)
      if (metaPercentage >= -25) return '#10b981'; // Verde - Próximo da meta (-25% a 0%)
      if (metaPercentage >= -50) return '#fbbf24'; // Amarelo - Meio da meta (-50% a -25%)
      if (metaPercentage >= -75) return '#f59e0b'; // Laranja - Longe da meta (-75% a -50%)
      return '#ef4444'; // Vermelho - Muito longe da meta (-100% a -75%)
    } else {
      // Lógica anterior
      if (performanceScore >= 120) return '#10b981';
      if (performanceScore >= 100) return '#fbbf24';
      if (performanceScore >= 80) return '#f59e0b';
      return '#ef4444';
    }
  };
  
  return (
    <div className="performance-thermometer-container">
      {/* Termômetro semicircular */}
      <div className="performance-thermometer-gauge">
        <svg width="240" height="135" viewBox="0 0 240 135" className="performance-thermometer-svg">
          {/* Gradiente do termômetro */}
          <defs>
            <linearGradient id={`thermo-gradient-${color}`} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#ef4444" />
              <stop offset="20%" stopColor="#f59e0b" />
              <stop offset="40%" stopColor="#fbbf24" />
              <stop offset="60%" stopColor="#10b981" />
              <stop offset="100%" stopColor="#10b981" />
            </linearGradient>
          </defs>
          
          {/* Arco do termômetro */}
          <path
            d="M 45 105 A 75 75 0 0 1 195 105"
            stroke={`url(#thermo-gradient-${color})`}
            strokeWidth="15"
            fill="none"
            strokeLinecap="round"
            className="performance-thermometer-arc"
          />
          
          {/* Marcações de escala - apenas pontos sem números */}
          {[0, 50, 100, 150, 200].map((mark, index) => {
            const markAngle = (mark / 200) * 180;
            const radians = (markAngle - 90) * Math.PI / 180;
            const x = 120 + 67 * Math.cos(radians);
            const y = 105 + 67 * Math.sin(radians);
            return (
              <circle
                key={index}
                cx={x}
                cy={y}
                r="3.5"
                fill="rgba(255, 255, 255, 0.8)"
              />
            );
          })}
          
          {/* Ponteiro do termômetro */}
          <g 
            className="performance-thermometer-pointer" 
            style={{ 
              transformOrigin: '120px 105px',
              transform: `rotate(${angle - 90}deg)`,
              transition: 'transform 2s cubic-bezier(0.4, 0, 0.2, 1)'
            }}
          >
            <line
              x1="120"
              y1="105"
              x2="120"
              y2="45"
              stroke="#ffffff"
              strokeWidth="7"
              strokeLinecap="round"
              filter="drop-shadow(0 3px 8px rgba(0,0,0,0.4))"
            />
            <circle
              cx="120"
              cy="105"
              r="9"
              fill="#ffffff"
              filter="drop-shadow(0 3px 8px rgba(0,0,0,0.4))"
            />
          </g>
          
        </svg>
      </div>
    </div>
  );
};

export default PerformanceThermometer;
