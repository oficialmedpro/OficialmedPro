import React from 'react';
import './TimelineChart.css';

const TimelineChart = ({ selectedDate, t }) => {
  // Calcular os últimos 7 dias baseado na data selecionada
  const getLast7Days = (selectedDate) => {
    const endDate = selectedDate ? new Date(selectedDate) : new Date();
    const days = [];
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(endDate);
      date.setDate(date.getDate() - i);
      days.push(date);
    }
    
    return days;
  };

  // Dados fixos para demonstração
  const getMockData = (date) => {
    const day = date.getDate();
    const baseData = {
      21: { 
        opportunities: 34, 
        conversion: 34, 
        loss: { count: 6, value: 20437 }, 
        gain: { count: 89, value: 80257 },
        goal: 100000,
        average: 75000,
        ticket: 1250
      },
      22: { 
        opportunities: 21, 
        conversion: 33, 
        loss: { count: 7, value: 23867 }, 
        gain: { count: 65, value: 18673 },
        goal: 100000,
        average: 75000,
        ticket: 980
      },
      23: { 
        opportunities: 19, 
        conversion: 63, 
        loss: { count: 11, value: 16963 }, 
        gain: { count: 78, value: 19165 },
        goal: 100000,
        average: 75000,
        ticket: 1450
      },
      24: { 
        opportunities: 20, 
        conversion: 36, 
        loss: { count: 5, value: 7031 }, 
        gain: { count: 92, value: 59923 },
        goal: 100000,
        average: 75000,
        ticket: 1100
      },
      25: { 
        opportunities: 13, 
        conversion: 32, 
        loss: { count: 6, value: 12631 }, 
        gain: { count: 45, value: 23715 },
        goal: 100000,
        average: 75000,
        ticket: 850
      },
      26: { 
        opportunities: 17, 
        conversion: 64, 
        loss: { count: 17, value: 8684 }, 
        gain: { count: 88, value: 32386 },
        goal: 100000,
        average: 75000,
        ticket: 1350
      },
      27: { 
        opportunities: 18, 
        conversion: 67, 
        loss: { count: 13, value: 5520 }, 
        gain: { count: 95, value: 45605 },
        goal: 100000,
        average: 75000,
        ticket: 1200
      }
    };
    
    const defaultData = { 
      opportunities: 15, 
      conversion: 45, 
      loss: { count: 8, value: 12000 }, 
      gain: { count: 70, value: 25000 },
      goal: 100000,
      average: 75000,
      ticket: 1000
    };
    
    return baseData[day] || defaultData;
  };

  // Dados comparativos
  const getComparisonData = () => {
    return {
      previousWeek: {
        opportunities: 138,
        conversion: 42,
        loss: { count: 58, value: 125000 },
        gain: { count: 650, value: 198000 },
        goal: 350000,
        average: 300000,
        ticket: 8500
      },
      currentWeek: {
        opportunities: 142,
        conversion: 46,
        loss: { count: 65, value: 112000 },
        gain: { count: 680, value: 234000 },
        goal: 350000,
        average: 300000,
        ticket: 9200
      },
      previousFortnight: {
        opportunities: 280,
        conversion: 44,
        loss: { count: 123, value: 245000 },
        gain: { count: 1350, value: 432000 },
        goal: 700000,
        average: 600000,
        ticket: 17500
      },
      currentFortnight: {
        opportunities: 295,
        conversion: 45,
        loss: { count: 134, value: 232000 },
        gain: { count: 1420, value: 468000 },
        goal: 700000,
        average: 600000,
        ticket: 18500
      },
      previousMonth: {
        opportunities: 585,
        conversion: 37,
        loss: { count: 218, value: 420000 },
        gain: { count: 2800, value: 1680000 },
        goal: 2500000,
        average: 2000000,
        ticket: 35000
      },
      currentMonth: {
        opportunities: 642,
        conversion: 38,
        loss: { count: 245, value: 450000 },
        gain: { count: 2950, value: 1850000 },
        goal: 2500000,
        average: 2000000,
        ticket: 38000
      },
      annualAverage: {
        opportunities: 7200,
        conversion: 41,
        loss: { count: 2620, value: 4800000 },
        gain: { count: 32000, value: 19800000 },
        goal: 25000000,
        average: 20000000,
        ticket: 420000
      }
    };
  };

  const allDays = getLast7Days(selectedDate);
  const comparisonData = getComparisonData();

  // Função para formatar valor monetário
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  // Função para formatar porcentagem
  const formatPercentage = (value) => {
    return `${value}%`;
  };

  // Função para obter dia da semana abreviado
  const getDayOfWeek = (date) => {
    const days = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB'];
    return days[date.getDay()];
  };

  // Função para calcular percentual de variação
  const getVariationPercentage = (current, average) => {
    if (average === 0) return 0;
    const variation = ((current - average) / average) * 100;
    return Math.round(variation);
  };

  // Função para calcular percentual da meta
  const getGoalPercentage = (current, goal) => {
    if (goal === 0) return 0;
    const percentage = (current / goal) * 100;
    return Math.round(percentage);
  };

  // Componente do card individual
  const MetricCard = ({ title, data, isComparison = false }) => {
    const goalPercentage = getGoalPercentage(data.gain.value, data.goal);
    const variationPercentage = getVariationPercentage(data.gain.value, data.average);
    const isPositive = variationPercentage >= 0;
    
    return (
      <div className="metric-card">
        <div className="card-header">
          <span className="card-title">{title}</span>
        </div>
        
        {/* Gráfico em arco para Ganho */}
        <div className="gain-arc-container">
          <div className="gain-arc">
            <svg width="60" height="30" viewBox="0 0 60 30">
              {/* Arco de fundo cinza */}
              <path
                d="M 5 25 A 25 25 0 0 1 55 25"
                fill="none"
                stroke="#374151"
                strokeWidth="3"
                strokeLinecap="round"
              />
              
              {/* Arco de ganho - sempre verde, preenchido proporcionalmente */}
              <path
                d="M 5 25 A 25 25 0 0 1 55 25"
                fill="none"
                stroke="#10B981"
                strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray={`${Math.min(Math.abs(variationPercentage), 100) * 0.4} 100`}
              />
            </svg>
          </div>
          
          <div className="gain-info">
            <div className="gain-metrics">
              {data.gain.count} / {formatCurrency(data.gain.value)}
            </div>
            <div className={`gain-variation ${isPositive ? 'positive' : 'negative'}`}>
              {isPositive ? '+' : ''}{variationPercentage}%
            </div>
          </div>
        </div>

        {/* Métricas detalhadas */}
        <div className="metrics-grid">
          {/* Oportunidades */}
          <div className="metric-item">
            <div className="metric-label">Oportunidades</div>
            <div className="metric-value">{data.opportunities}</div>
            <div className="metric-bar">
              <div 
                className="metric-bar-fill opportunities"
                style={{ width: `${Math.min((data.opportunities / 100) * 100, 100)}%` }}
              ></div>
            </div>
          </div>

          {/* Conversão */}
          <div className="metric-item">
            <div className="metric-label">Conversão</div>
            <div className="metric-value">{formatPercentage(data.conversion)}</div>
            <div className="metric-bar">
              <div 
                className="metric-bar-fill conversion"
                style={{ width: `${data.conversion}%` }}
              ></div>
            </div>
          </div>

          {/* Perda */}
          <div className="metric-item">
            <div className="metric-label">Perda</div>
            <div className="metric-value">{data.loss.count} / {formatCurrency(data.loss.value)}</div>
            <div className="metric-bar">
              <div 
                className="metric-bar-fill loss"
                style={{ width: `${Math.min((data.loss.value / 50000) * 100, 100)}%` }}
              ></div>
            </div>
          </div>

          {/* Ticket M */}
          <div className="metric-item">
            <div className="metric-label">Ticket M</div>
            <div className="metric-value">{formatCurrency(data.ticket)}</div>
            <div className="metric-bar">
              <div 
                className="metric-bar-fill ticket"
                style={{ width: `${Math.min((data.ticket / 2000) * 100, 100)}%` }}
              ></div>
            </div>
          </div>

          {/* Meta */}
          <div className="metric-item">
            <div className="metric-label">Meta</div>
            <div className="metric-value">{formatPercentage(goalPercentage)}</div>
            <div className="metric-bar">
              <div 
                className={`metric-bar-fill goal ${goalPercentage >= 100 ? 'exceeded' : ''}`}
                style={{ width: `${Math.min(goalPercentage, 100)}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="timeline-chart">
      <div className="timeline-content">
        {/* Primeira linha: Últimos 7 dias */}
        <div className="timeline-row">
          <div className="opps-card-header">
            <div className="opps-platform-icon opps-sources-icon">7</div>
            <span className="opps-platform-name">Últimos 7 dias</span>
          </div>
          <div className="cards-container">
            {allDays.map((date, index) => {
              const data = getMockData(date);
              const title = `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')} ${getDayOfWeek(date)}`;
              
              return (
                <MetricCard 
                  key={index} 
                  title={title} 
                  data={data} 
                />
              );
            })}
          </div>
        </div>

        {/* Segunda linha: Comparações */}
        <div className="timeline-row">
          <div className="opps-card-header">
            <div className="opps-platform-icon opps-sources-icon">A</div>
            <span className="opps-platform-name">Análise Comparativa</span>
          </div>
          <div className="cards-container">
            <MetricCard 
              title="Semana Anterior" 
              data={comparisonData.previousWeek} 
              isComparison={true}
            />
            <MetricCard 
              title="Semana Atual" 
              data={comparisonData.currentWeek} 
              isComparison={true}
            />
            <MetricCard 
              title="Quinzena Anterior" 
              data={comparisonData.previousFortnight} 
              isComparison={true}
            />
            <MetricCard 
              title="Quinzena Atual" 
              data={comparisonData.currentFortnight} 
              isComparison={true}
            />
            <MetricCard 
              title="Mês Anterior" 
              data={comparisonData.previousMonth} 
              isComparison={true}
            />
            <MetricCard 
              title="Mês Atual" 
              data={comparisonData.currentMonth} 
              isComparison={true}
            />
            <MetricCard 
              title="Média Anual" 
              data={comparisonData.annualAverage} 
              isComparison={true}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default TimelineChart;
