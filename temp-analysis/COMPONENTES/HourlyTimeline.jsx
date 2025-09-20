import React, { useState, useEffect } from 'react';
import './HourlyTimeline.css';

/**
 * 🎯 HOURLY TIMELINE
 * 
 * Timeline animada mostrando as rondas comerciais
 * Com animação em tempo real e indicadores visuais
 */
const HourlyTimeline = ({ 
  roundHours, 
  postRoundHours, 
  closingPeriod 
}) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [currentHour, setCurrentHour] = useState(null);

  // Atualizar hora atual a cada minuto
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now);
      setCurrentHour(now.getHours());
    };

    updateTime();
    const interval = setInterval(updateTime, 60000); // Atualizar a cada minuto
    return () => clearInterval(interval);
  }, []);

  // Função para determinar o status de uma hora
  const getHourStatus = (hour) => {
    const hourNum = parseInt(hour.split(':')[0]);
    
    if (hourNum === currentHour) {
      return 'current';
    } else if (hourNum < currentHour) {
      return 'past';
    } else {
      return 'future';
    }
  };

  // Função para verificar se é a hora atual
  const isCurrentHour = (hour) => {
    const hourNum = parseInt(hour.split(':')[0]);
    return hourNum === currentHour;
  };

  // Função para calcular progresso do dia
  const getDayProgress = () => {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 8, 0, 0); // 8:00
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 22, 0, 0); // 22:00
    
    const totalMinutes = (endOfDay - startOfDay) / (1000 * 60);
    const elapsedMinutes = (now - startOfDay) / (1000 * 60);
    
    return Math.max(0, Math.min(100, (elapsedMinutes / totalMinutes) * 100));
  };

  return (
    <div className="hourly-timeline-container">
      <div className="timeline-header">
        <h3>Timeline das Rondas Comerciais</h3>
        <div className="timeline-time">
          <span className="current-time-label">Hora Atual:</span>
          <span className="current-time-value">
            {currentTime.toLocaleTimeString('pt-BR', { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </span>
        </div>
      </div>

      <div className="timeline-track">
        {/* Barra de progresso do dia */}
        <div className="timeline-progress-bar">
          <div 
            className="timeline-progress-fill"
            style={{ width: `${getDayProgress()}%` }}
          />
        </div>

        {/* Rondas Principais (8:00 às 20:00) */}
        <div className="timeline-section timeline-rounds">
          <div className="timeline-section-label">Rondas Principais (8:00 - 20:00)</div>
          <div className="timeline-hours">
            {roundHours.map(hour => (
              <div 
                key={hour}
                className={`timeline-hour timeline-round-hour ${getHourStatus(hour)} ${
                  isCurrentHour(hour) ? 'pulse' : ''
                }`}
                data-hour={hour}
                title={`Ronda ${hour}`}
              >
                <div className="timeline-hour-label">{hour}</div>
                <div className="timeline-hour-indicator">
                  {isCurrentHour(hour) && (
                    <div className="timeline-current-pulse" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Legenda */}
      <div className="timeline-legend">
        <div className="legend-item">
          <div className="legend-color legend-past"></div>
          <span>Horas Passadas</span>
        </div>
        <div className="legend-item">
          <div className="legend-color legend-current"></div>
          <span>Hora Atual</span>
        </div>
        <div className="legend-item">
          <div className="legend-color legend-future"></div>
          <span>Horas Futuras</span>
        </div>
      </div>
    </div>
  );
};

export default HourlyTimeline;
