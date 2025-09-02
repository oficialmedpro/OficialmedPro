import React from 'react';
import './PerformanceThermometer.css';

const PerformanceThermometer = ({ currentValue, previousValue, change, isPositive, color }) => {
  const current = parseInt(currentValue.toString().replace(/[^\d]/g, ''));
  const previous = parseInt(previousValue.toString().replace(/[^\d]/g, ''));
  
  // Calcular performance relativa (0-100)
  const performanceRatio = previous > 0 ? (current / previous) : 1;
  const performanceScore = Math.min(Math.max(performanceRatio * 100, 0), 200); // 0 a 200%
  
  // Determinar cor baseada na performance
  const getThermometerColor = () => {
    if (performanceScore >= 120) return '#10b981'; // Verde - Excelente
    if (performanceScore >= 100) return '#fbbf24'; // Amarelo - Bom
    if (performanceScore >= 80) return '#f59e0b'; // Laranja - Regular
    return '#ef4444'; // Vermelho - Ruim
  };
  
  // Calcular ângulo do ponteiro (0° = vermelho/esquerda, 180° = verde/direita)
  const angle = Math.min((performanceScore / 200) * 180, 180);
  
  return (
    <div className="performance-thermometer-container">
      {/* Termômetro semicircular */}
      <div className="performance-thermometer-gauge">
        <svg width="240" height="135" viewBox="0 0 240 135" className="performance-thermometer-svg">
          {/* Gradiente do termômetro */}
          <defs>
            <linearGradient id={`thermo-gradient-${color}`} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#ef4444" />
              <stop offset="40%" stopColor="#f59e0b" />
              <stop offset="70%" stopColor="#fbbf24" />
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
