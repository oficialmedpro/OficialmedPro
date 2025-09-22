import React, { useState, useEffect } from 'react';
import './DailyPerformanceVertical.css';
import { getRondasData } from '../service/dailyPerformanceVerticalService';
import { getPerformanceDataByRondaHorario, calculateFechamentoData } from '../service/dailyPerformanceVerticalDataService';

/**
 * 🎯 DAILY PERFORMANCE VERTICAL
 *
 * Componente que exibe tabela de performance por horário das rondas
 * Métricas | 10 | 12 | 14 | 16 | 18 | 20 | Fechamento
 */
const DailyPerformanceVertical = ({
  t,
  startDate,
  endDate,
  selectedFunnel,
  selectedUnit,
  selectedSeller,
  selectedOrigin
}) => {
  const [rondas, setRondas] = useState([]);
  const [performanceData, setPerformanceData] = useState({});
  const [fechamentoData, setFechamentoData] = useState({});
  const [totalData, setTotalData] = useState({});
  const [loading, setLoading] = useState(true);
  const [debugInfo, setDebugInfo] = useState([]);
  const [metasDebugInfo, setMetasDebugInfo] = useState({});

  // Buscar dados das rondas e performance
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Buscar dados de performance por horário
        const params = {
          startDate,
          endDate,
          selectedFunnel,
          selectedUnit,
          selectedSeller,
          selectedOrigin
        };

        const data = await getPerformanceDataByRondaHorario(params);
        setRondas(data.rondas);
        setPerformanceData(data.performanceData);
        setTotalData(data.totalData || {});  // Capturar dados totais do dia
        setDebugInfo(data.debugInfo || []);  // Capturar info de debug
        setMetasDebugInfo(data.metasDebugInfo || {});  // Capturar debug das metas

        // Calcular dados de fechamento (já calculado no service, mas precisa recalcular aqui por questões de sequência)
        const fechamento = calculateFechamentoData(data.performanceData);
        setFechamentoData(fechamento);


      } catch (error) {
        console.error('❌ Erro ao carregar dados de performance:', error);
      } finally {
        setLoading(false);
      }
    };

    // Só buscar se tiver parâmetros obrigatórios
    if (startDate && endDate) {
      fetchData();
    } else {
      // Fallback: buscar apenas rondas se não tiver filtros
      const fetchRondasOnly = async () => {
        try {
          setLoading(true);
          const data = await getRondasData();
          setRondas(data);
        } catch (error) {
          console.error('❌ Erro ao carregar rondas:', error);
        } finally {
          setLoading(false);
        }
      };
      fetchRondasOnly();
    }
  }, [startDate, endDate, selectedFunnel, selectedUnit, selectedSeller, selectedOrigin]);

  // Função para calcular cor do gradiente (amarelo → vermelho)
  const getGradientColor = (index, totalRondas) => {
    if (totalRondas <= 1) return '#FFD700'; // Amarelo padrão se só tiver 1 ronda

    // Calcular posição no gradiente (0 a 1)
    const position = index / (totalRondas - 1);

    // Interpolar entre amarelo (255,215,0) e vermelho (255,0,0)
    const red = 255;
    const green = Math.round(215 * (1 - position)); // De 215 para 0
    const blue = 0;

    return `rgb(${red}, ${green}, ${blue})`;
  };

  // Função para obter classe CSS do gap (igual ao DailyPerformanceTable)
  const getGapClass = (gap) => {
    // Para gaps já formatados como string (faturamento, ticket médio, leads, vendas)
    if (typeof gap === 'string') {
      const trimmedGap = gap.trim();
      if (trimmedGap.startsWith('+')) {
        return 'gap-positive';
      }
      if (trimmedGap.startsWith('-') || trimmedGap.startsWith('−')) {
        return 'gap-negative';
      }
      return 'gap-neutral';
    }

    // Para gaps numéricos (conversão)
    if (typeof gap === 'number') {
      if (gap > 0) {
        return 'gap-positive';
      }
      if (gap < 0) {
        return 'gap-negative';
      }
      return 'gap-neutral';
    }

    return 'gap-neutral';
  };

  // Função para calcular porcentagem do realizado em relação à meta
  const calculatePercentage = (realizado, meta) => {
    if (!meta || meta === 0) return 0;
    return Math.min((realizado / meta) * 100, 150); // Limita a 150% para visualização
  };

  // Função para calcular porcentagem do gap
  const calculateGapPercentage = (gap, meta) => {
    if (!meta || meta === 0) return 0;
    return Math.abs((gap / meta) * 100);
  };

  // Função para extrair valor numérico do gap formatado
  const extractGapValue = (gapString) => {
    if (typeof gapString === 'number') return gapString;
    if (typeof gapString !== 'string') return 0;
    // Remove símbolos e extrai o primeiro número
    const match = gapString.match(/^([+-]?)([0-9,\.]+)/);
    if (match) {
      const sign = match[1] === '-' ? -1 : 1;
      const value = parseFloat(match[2].replace(/,/g, ''));
      return sign * value;
    }
    return 0;
  };

  // Função para obter cor baseada na porcentagem
  const getProgressColor = (percentage) => {
    if (percentage >= 100) {
      return '#10b981'; // Verde total para 100%+
    } else if (percentage >= 76) {
      // Gradiente amarelo para verde (76-99%)
      const intensity = (percentage - 76) / 23; // 0 a 1
      return `url(#gradient-yellow-green-${Math.floor(intensity * 10)})`;
    } else if (percentage >= 51) {
      // Gradiente laranja para amarelo (51-75%)
      const intensity = (percentage - 51) / 24; // 0 a 1
      return `url(#gradient-orange-yellow-${Math.floor(intensity * 10)})`;
    } else if (percentage >= 26) {
      // Gradiente vermelho para laranja (26-50%)
      const intensity = (percentage - 26) / 24; // 0 a 1
      return `url(#gradient-red-orange-${Math.floor(intensity * 10)})`;
    } else {
      return '#ef4444'; // Vermelho puro para muito baixo
    }
  };

  // Função para gerar gradientes SVG
  const generateGradients = () => {
    const gradients = [];

    // Gradientes vermelho para laranja (0-50%)
    for (let i = 0; i <= 10; i++) {
      const intensity = i / 10;
      const red = Math.round(239 + (255 - 239) * intensity); // 239 (vermelho) para 255 (laranja)
      const green = Math.round(68 + (165 - 68) * intensity); // 68 para 165
      const blue = Math.round(68 + (0 - 68) * intensity); // 68 para 0
      gradients.push(
        <linearGradient key={`gradient-red-orange-${i}`} id={`gradient-red-orange-${i}`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#ef4444" />
          <stop offset="100%" stopColor={`rgb(${red}, ${green}, ${blue})`} />
        </linearGradient>
      );
    }

    // Gradientes laranja para amarelo (51-75%)
    for (let i = 0; i <= 10; i++) {
      const intensity = i / 10;
      const red = Math.round(255 + (255 - 255) * intensity); // 255 (laranja) para 255 (amarelo)
      const green = Math.round(165 + (234 - 165) * intensity); // 165 para 234
      const blue = Math.round(0 + (179 - 0) * intensity); // 0 para 179
      gradients.push(
        <linearGradient key={`gradient-orange-yellow-${i}`} id={`gradient-orange-yellow-${i}`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#ffa500" />
          <stop offset="100%" stopColor={`rgb(${red}, ${green}, ${blue})`} />
        </linearGradient>
      );
    }

    // Gradientes amarelo para verde (76-99%)
    for (let i = 0; i <= 10; i++) {
      const intensity = i / 10;
      const red = Math.round(255 + (16 - 255) * intensity); // 255 (amarelo) para 16 (verde)
      const green = Math.round(234 + (185 - 234) * intensity); // 234 para 185
      const blue = Math.round(179 + (129 - 179) * intensity); // 179 para 129
      gradients.push(
        <linearGradient key={`gradient-yellow-green-${i}`} id={`gradient-yellow-green-${i}`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#ffeab3" />
          <stop offset="100%" stopColor={`rgb(${red}, ${green}, ${blue})`} />
        </linearGradient>
      );
    }

    return gradients;
  };

  // Componente Progress Ring
  const ProgressRing = ({ type, realizado, meta, gap }) => {
    let percentage = 0;
    let strokeColor = '#6b7280';

    if (type === 'meta') {
      percentage = 100;
      strokeColor = '#6b7280'; // cinza para meta
    } else if (type === 'realizado') {
      const rawPercentage = calculatePercentage(realizado, meta);

      // Se meta foi batida (>= 100%), sempre mostrar 100% preenchido em verde
      if (rawPercentage >= 100) {
        percentage = 100;
        strokeColor = '#10b981'; // Verde sólido quando meta é batida
      } else {
        percentage = rawPercentage;
        strokeColor = getProgressColor(rawPercentage);
      }
    } else if (type === 'gap') {
      const gapValue = extractGapValue(gap);
      percentage = Math.min(calculateGapPercentage(gapValue, meta), 100);
      strokeColor = gapValue > 0 ? '#10b981' : '#ef4444';
    }

    const radius = 14;
    const strokeWidth = 3;
    const normalizedRadius = radius - strokeWidth * 0.5;
    const circumference = normalizedRadius * 2 * Math.PI;
    const strokeDasharray = `${circumference} ${circumference}`;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    return (
      <div className="progress-ring-container">
        <svg width="32" height="32" className="progress-ring">
          <defs>
            {generateGradients()}
          </defs>
          {/* Círculo de fundo */}
          <circle
            stroke="rgba(255,255,255,0.1)"
            fill="transparent"
            strokeWidth={strokeWidth}
            r={normalizedRadius}
            cx="16"
            cy="16"
          />
          {/* Círculo de progresso */}
          <circle
            stroke={strokeColor}
            fill="transparent"
            strokeWidth={strokeWidth}
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            r={normalizedRadius}
            cx="16"
            cy="16"
            style={{
              transition: 'stroke-dashoffset 0.5s ease-in-out'
            }}
          />
        </svg>
      </div>
    );
  };

  // Função para obter o valor de uma métrica específica
  const getMetricValue = (rondaNome, metrica, tipo) => {
    if (!performanceData[rondaNome] || !performanceData[rondaNome][metrica]) {
      return '';
    }

    const valor = performanceData[rondaNome][metrica][tipo];

    // Formatação especial para gaps
    if (tipo === 'gap') {
      if (metrica === 'faturamento' || metrica === 'ticketMedio') {
        // Para faturamento e ticket médio, formatar como moeda com sinal
        if (valor >= 0) {
          return `+${new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
            minimumFractionDigits: 0
          }).format(valor)}`;
        } else {
          return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
            minimumFractionDigits: 0
          }).format(valor);
        }
      } else if (metrica === 'conversao') {
        // Para conversão, formatar como percentual com sinal
        if (valor >= 0) {
          return `+${valor}%`;
        } else {
          return `${valor}%`;
        }
      } else {
        // Para leads e vendas, formatar como número inteiro com sinal
        if (valor >= 0) {
          return `+${valor}`;
        } else {
          return `${valor}`;
        }
      }
    }

    // Formatação baseada na métrica (para realizado e meta)
    if (metrica === 'faturamento') {
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        minimumFractionDigits: 0
      }).format(valor);
    } else if (metrica === 'conversao') {
      return `${valor}%`;
    } else if (metrica === 'ticketMedio') {
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        minimumFractionDigits: 0
      }).format(valor);
    }

    return valor.toString();
  };

  // Função para obter valor de fechamento
  const getFechamentoValue = (metrica, tipo) => {
    if (!fechamentoData[metrica]) {
      return '';
    }

    const valor = fechamentoData[metrica][tipo];

    // Formatação especial para gaps
    if (tipo === 'gap') {
      if (metrica === 'faturamento' || metrica === 'ticketMedio') {
        // Para faturamento e ticket médio, formatar como moeda com sinal
        if (valor >= 0) {
          return `+${new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
            minimumFractionDigits: 0
          }).format(valor)}`;
        } else {
          return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
            minimumFractionDigits: 0
          }).format(valor);
        }
      } else if (metrica === 'conversao') {
        // Para conversão, formatar como percentual com sinal
        if (valor >= 0) {
          return `+${valor}%`;
        } else {
          return `${valor}%`;
        }
      } else {
        // Para leads e vendas, formatar como número inteiro com sinal
        if (valor >= 0) {
          return `+${valor}`;
        } else {
          return `${valor}`;
        }
      }
    }

    // Formatação baseada na métrica (para realizado e meta)
    if (metrica === 'faturamento') {
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        minimumFractionDigits: 0
      }).format(valor);
    } else if (metrica === 'conversao') {
      return `${valor}%`;
    } else if (metrica === 'ticketMedio') {
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        minimumFractionDigits: 0
      }).format(valor);
    }

    return valor.toString();
  };

  // Função para obter valor da coluna Total
  const getTotalValue = (metrica, tipo) => {
    if (!totalData[metrica]) {
      return '';
    }

    const valor = totalData[metrica][tipo];

    // Formatação especial para gaps
    if (tipo === 'gap') {
      if (metrica === 'faturamento' || metrica === 'ticketMedio') {
        // Para faturamento e ticket médio, formatar como moeda com sinal
        if (valor >= 0) {
          return `+${new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
            minimumFractionDigits: 0
          }).format(valor)}`;
        } else {
          return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
            minimumFractionDigits: 0
          }).format(valor);
        }
      } else if (metrica === 'conversao') {
        // Para conversão, formatar como percentual com sinal
        if (valor >= 0) {
          return `+${valor}%`;
        } else {
          return `${valor}%`;
        }
      } else {
        // Para leads e vendas, formatar como número inteiro com sinal
        if (valor >= 0) {
          return `+${valor}`;
        } else {
          return `${valor}`;
        }
      }
    }

    // Formatação baseada na métrica (para realizado e meta)
    if (metrica === 'faturamento') {
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        minimumFractionDigits: 0
      }).format(valor);
    } else if (metrica === 'conversao') {
      return `${valor}%`;
    } else if (metrica === 'ticketMedio') {
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        minimumFractionDigits: 0
      }).format(valor);
    }

    return valor.toString();
  };

  if (loading) {
    return (
      <div className="daily-performance-vertical-container">
        <div className="daily-performance-loading">
          <div className="loading-spinner"></div>
          <p>Carregando cabeçalho...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="main-chart">
      <div className="daily-performance-vertical-container">
        <div className="daily-performance-vertical-header">
          <h2>Performance Vertical por Ronda</h2>

        </div>


        <div className="daily-performance-vertical-table-wrapper">
          <table className="daily-performance-vertical-table">
            <thead>
              <tr className="header-row">
                {/* Coluna fixa: Métricas */}
                <th className="metrics-column">Métricas</th>

                {/* Colunas dinâmicas: Rondas com gradiente */}
                {rondas.map((ronda, index) => (
                  <th
                    key={index}
                    className="ronda-column"
                    style={{
                      backgroundColor: getGradientColor(index, rondas.length),
                      color: '#000000',
                      fontWeight: 'bold'
                    }}
                  >
                    {ronda.nome}
                  </th>
                ))}

                {/* Coluna fixa: Fechamento (verde) */}
                <th
                  className="fechamento-column"
                  style={{
                    backgroundColor: '#28a745',
                    color: '#ffffff',
                    fontWeight: 'bold'
                  }}
                >
                  Fechamento
                </th>

                {/* Coluna fixa: Total (azul) */}
                <th
                  className="total-column"
                  style={{
                    backgroundColor: '#007bff',
                    color: '#ffffff',
                    fontWeight: 'bold'
                  }}
                >
                  Total
                </th>
              </tr>
            </thead>
            <tbody>
              <tr className="leads-row" style={{background: '#263355'}}>
                {/* Coluna fixa: Leads */}
                <td className="leads-label" style={{background: '#263355', padding: '2px 12px'}}>LEADS</td>

                {/* Colunas dinâmicas: vazias */}
                {rondas.map((ronda, index) => (
                  <td key={index} className="leads-cell" style={{background: '#263355', padding: '2px'}}></td>
                ))}

                {/* Coluna fixa: Fechamento - vazia */}
                <td className="leads-cell" style={{background: '#263355', padding: '2px'}}></td>

                {/* Coluna fixa: Total - vazia */}
                <td className="leads-cell" style={{background: '#263355', padding: '2px'}}></td>
              </tr>

              <tr className="header-row">
                {/* Coluna fixa: Realizado */}
                <th className="metrics-column" style={{background: 'rgb(38, 51, 85)', fontWeight: 400}}>Realizado</th>

                {/* Colunas dinâmicas: Rondas */}
                {rondas.map((ronda, index) => {
                  const realizado = performanceData[ronda.nome]?.leads?.realizado || 0;
                  const meta = performanceData[ronda.nome]?.leads?.meta || 0;
                  const gap = performanceData[ronda.nome]?.leads?.gap || 0;

                  return (
                    <td key={index} className="ronda-column">
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                        <ProgressRing
                          type="realizado"
                          realizado={realizado}
                          meta={meta}
                          gap={gap}
                        />
                        <span>{getMetricValue(ronda.nome, 'leads', 'realizado')}</span>
                      </div>
                    </td>
                  );
                })}

                {/* Coluna fixa: Fechamento */}
                <td className="fechamento-column">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    <ProgressRing
                      type="realizado"
                      realizado={fechamentoData.leads?.realizado || 0}
                      meta={fechamentoData.leads?.meta || 0}
                      gap={fechamentoData.leads?.gap || 0}
                    />
                    <span>{getFechamentoValue('leads', 'realizado')}</span>
                  </div>
                </td>

                {/* Coluna fixa: Total */}
                <td className="total-column">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    <ProgressRing
                      type="realizado"
                      realizado={totalData.leads?.realizado || 0}
                      meta={totalData.leads?.meta || 0}
                      gap={totalData.leads?.gap || 0}
                    />
                    <span>{getTotalValue('leads', 'realizado')}</span>
                  </div>
                </td>
              </tr>

              <tr className="header-row">
                {/* Coluna fixa: Meta */}
                <th className="metrics-column" style={{background: 'rgb(38, 51, 85)', fontWeight: 400}}>Meta</th>

                {/* Colunas dinâmicas: Rondas */}
                {rondas.map((ronda, index) => (
                  <td key={index} className="ronda-column">
                    {getMetricValue(ronda.nome, 'leads', 'meta')}
                  </td>
                ))}

                {/* Coluna fixa: Fechamento */}
                <td className="fechamento-column">
                  {getFechamentoValue('leads', 'meta')}
                </td>

                {/* Coluna fixa: Total */}
                <td className="total-column">
                  {getTotalValue('leads', 'meta')}
                </td>
              </tr>

              <tr className="header-row">
                {/* Coluna fixa: Gap */}
                <th className="metrics-column" style={{background: 'rgb(38, 51, 85)', fontWeight: 400}}>Gap</th>

                {/* Colunas dinâmicas: Rondas */}
                {rondas.map((ronda, index) => {
                  const gapValue = getMetricValue(ronda.nome, 'leads', 'gap');
                  return (
                    <td key={index} className={`ronda-column gap-cell ${getGapClass(gapValue)}`}>
                      {gapValue}
                    </td>
                  );
                })}

                {/* Coluna fixa: Fechamento */}
                <td className={`fechamento-column gap-cell ${getGapClass(getFechamentoValue('leads', 'gap'))}`}>
                  {getFechamentoValue('leads', 'gap')}
                </td>

                {/* Coluna fixa: Total */}
                <td className={`total-column gap-cell ${getGapClass(getTotalValue('leads', 'gap'))}`}>
                  {getTotalValue('leads', 'gap')}
                </td>
              </tr>

              {/* SEGUNDA SEÇÃO */}
              <tr className="leads-row" style={{background: '#254a36'}}>
                <td className="leads-label" style={{background: '#254a36', padding: '2px 12px'}}>Nº VENDAS</td>
                {rondas.map((ronda, index) => (
                  <td key={index} className="leads-cell" style={{background: '#254a36', padding: '2px'}}></td>
                ))}
                <td className="leads-cell" style={{background: '#254a36', padding: '2px'}}></td>
                <td className="leads-cell" style={{background: '#254a36', padding: '2px'}}></td>
              </tr>

              <tr className="header-row">
                <th className="metrics-column" style={{background: '#254a36', fontWeight: 400}}>Realizado</th>
                {rondas.map((ronda, index) => {
                  const realizado = performanceData[ronda.nome]?.vendas?.realizado || 0;
                  const meta = performanceData[ronda.nome]?.vendas?.meta || 0;
                  const gap = performanceData[ronda.nome]?.vendas?.gap || 0;

                  return (
                    <td key={index} className="ronda-column">
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                        <ProgressRing
                          type="realizado"
                          realizado={realizado}
                          meta={meta}
                          gap={gap}
                        />
                        <span>{getMetricValue(ronda.nome, 'vendas', 'realizado')}</span>
                      </div>
                    </td>
                  );
                })}
                <td className="fechamento-column">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    <ProgressRing
                      type="realizado"
                      realizado={fechamentoData.vendas?.realizado || 0}
                      meta={fechamentoData.vendas?.meta || 0}
                      gap={fechamentoData.vendas?.gap || 0}
                    />
                    <span>{getFechamentoValue('vendas', 'realizado')}</span>
                  </div>
                </td>

                <td className="total-column">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    <ProgressRing
                      type="realizado"
                      realizado={totalData.vendas?.realizado || 0}
                      meta={totalData.vendas?.meta || 0}
                      gap={totalData.vendas?.gap || 0}
                    />
                    <span>{getTotalValue('vendas', 'realizado')}</span>
                  </div>
                </td>
              </tr>

              <tr className="header-row">
                <th className="metrics-column" style={{background: '#254a36', fontWeight: 400}}>Meta</th>
                {rondas.map((ronda, index) => (
                  <td key={index} className="ronda-column">
                    {getMetricValue(ronda.nome, 'vendas', 'meta')}
                  </td>
                ))}
                <td className="fechamento-column">
                  {getFechamentoValue('vendas', 'meta')}
                </td>

                <td className="total-column">
                  {getTotalValue('vendas', 'meta')}
                </td>
              </tr>

              <tr className="header-row">
                <th className="metrics-column" style={{background: '#254a36', fontWeight: 400}}>Gap</th>
                {rondas.map((ronda, index) => {
                  const gapValue = getMetricValue(ronda.nome, 'vendas', 'gap');
                  return (
                    <td key={index} className={`ronda-column gap-cell ${getGapClass(gapValue)}`}>
                      {gapValue}
                    </td>
                  );
                })}
                <td className={`fechamento-column gap-cell ${getGapClass(getFechamentoValue('vendas', 'gap'))}`}>
                  {getFechamentoValue('vendas', 'gap')}
                </td>

                <td className={`total-column gap-cell ${getGapClass(getTotalValue('vendas', 'gap'))}`}>
                  {getTotalValue('vendas', 'gap')}
                </td>
              </tr>

              {/* TERCEIRA SEÇÃO */}
              <tr className="leads-row" style={{background: '#2d673e'}}>
                <td className="leads-label" style={{background: '#2d673e', padding: '2px 12px'}}>FATURAMENTO</td>
                {rondas.map((ronda, index) => (
                  <td key={index} className="leads-cell" style={{background: '#2d673e', padding: '2px'}}></td>
                ))}
                <td className="leads-cell" style={{background: '#2d673e', padding: '2px'}}></td>
                <td className="leads-cell" style={{background: '#2d673e', padding: '2px'}}></td>
              </tr>

              <tr className="header-row">
                <th className="metrics-column" style={{background: '#2d673e', fontWeight: 400}}>Realizado</th>
                {rondas.map((ronda, index) => {
                  const realizado = performanceData[ronda.nome]?.faturamento?.realizado || 0;
                  const meta = performanceData[ronda.nome]?.faturamento?.meta || 0;
                  const gap = performanceData[ronda.nome]?.faturamento?.gap || 0;

                  return (
                    <td key={index} className="ronda-column">
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                        <ProgressRing
                          type="realizado"
                          realizado={realizado}
                          meta={meta}
                          gap={gap}
                        />
                        <span>{getMetricValue(ronda.nome, 'faturamento', 'realizado')}</span>
                      </div>
                    </td>
                  );
                })}
                <td className="fechamento-column">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    <ProgressRing
                      type="realizado"
                      realizado={fechamentoData.faturamento?.realizado || 0}
                      meta={fechamentoData.faturamento?.meta || 0}
                      gap={fechamentoData.faturamento?.gap || 0}
                    />
                    <span>{getFechamentoValue('faturamento', 'realizado')}</span>
                  </div>
                </td>

                <td className="total-column">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    <ProgressRing
                      type="realizado"
                      realizado={totalData.faturamento?.realizado || 0}
                      meta={totalData.faturamento?.meta || 0}
                      gap={totalData.faturamento?.gap || 0}
                    />
                    <span>{getTotalValue('faturamento', 'realizado')}</span>
                  </div>
                </td>
              </tr>

              <tr className="header-row">
                <th className="metrics-column" style={{background: '#2d673e', fontWeight: 400}}>Meta</th>
                {rondas.map((ronda, index) => (
                  <td key={index} className="ronda-column">
                    {getMetricValue(ronda.nome, 'faturamento', 'meta')}
                  </td>
                ))}
                <td className="fechamento-column">
                  {getFechamentoValue('faturamento', 'meta')}
                </td>

                <td className="total-column">
                  {getTotalValue('faturamento', 'meta')}
                </td>
              </tr>

              <tr className="header-row">
                <th className="metrics-column" style={{background: '#2d673e', fontWeight: 400}}>Gap</th>
                {rondas.map((ronda, index) => {
                  const gapValue = getMetricValue(ronda.nome, 'faturamento', 'gap');
                  return (
                    <td key={index} className={`ronda-column gap-cell ${getGapClass(gapValue)}`}>
                      {gapValue}
                    </td>
                  );
                })}
                <td className={`fechamento-column gap-cell ${getGapClass(getFechamentoValue('faturamento', 'gap'))}`}>
                  {getFechamentoValue('faturamento', 'gap')}
                </td>

                <td className={`total-column gap-cell ${getGapClass(getTotalValue('faturamento', 'gap'))}`}>
                  {getTotalValue('faturamento', 'gap')}
                </td>
              </tr>

              {/* QUARTA SEÇÃO */}
              <tr className="leads-row" style={{background: '#5a3623'}}>
                <td className="leads-label" style={{background: '#5a3623', padding: '2px 12px'}}>TAXA DE CONVERSÃO</td>
                {rondas.map((ronda, index) => (
                  <td key={index} className="leads-cell" style={{background: '#5a3623', padding: '2px'}}></td>
                ))}
                <td className="leads-cell" style={{background: '#5a3623', padding: '2px'}}></td>
                <td className="leads-cell" style={{background: '#5a3623', padding: '2px'}}></td>
              </tr>

              <tr className="header-row">
                <th className="metrics-column" style={{background: '#5a3623', fontWeight: 400}}>Realizado</th>
                {rondas.map((ronda, index) => {
                  const realizado = performanceData[ronda.nome]?.conversao?.realizado || 0;
                  const meta = performanceData[ronda.nome]?.conversao?.meta || 0;
                  const gap = performanceData[ronda.nome]?.conversao?.gap || 0;

                  return (
                    <td key={index} className="ronda-column">
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                        <ProgressRing
                          type="realizado"
                          realizado={realizado}
                          meta={meta}
                          gap={gap}
                        />
                        <span>{getMetricValue(ronda.nome, 'conversao', 'realizado')}</span>
                      </div>
                    </td>
                  );
                })}
                <td className="fechamento-column">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    <ProgressRing
                      type="realizado"
                      realizado={fechamentoData.conversao?.realizado || 0}
                      meta={fechamentoData.conversao?.meta || 0}
                      gap={fechamentoData.conversao?.gap || 0}
                    />
                    <span>{getFechamentoValue('conversao', 'realizado')}</span>
                  </div>
                </td>

                <td className="total-column">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    <ProgressRing
                      type="realizado"
                      realizado={totalData.conversao?.realizado || 0}
                      meta={totalData.conversao?.meta || 0}
                      gap={totalData.conversao?.gap || 0}
                    />
                    <span>{getTotalValue('conversao', 'realizado')}</span>
                  </div>
                </td>
              </tr>

              <tr className="header-row">
                <th className="metrics-column" style={{background: '#5a3623', fontWeight: 400}}>Meta</th>
                {rondas.map((ronda, index) => (
                  <td key={index} className="ronda-column">
                    {getMetricValue(ronda.nome, 'conversao', 'meta')}
                  </td>
                ))}
                <td className="fechamento-column">
                  {getFechamentoValue('conversao', 'meta')}
                </td>

                <td className="total-column">
                  {getTotalValue('conversao', 'meta')}
                </td>
              </tr>

              <tr className="header-row">
                <th className="metrics-column" style={{background: '#5a3623', fontWeight: 400}}>Gap</th>
                {rondas.map((ronda, index) => {
                  const gapValue = getMetricValue(ronda.nome, 'conversao', 'gap');
                  return (
                    <td key={index} className={`ronda-column gap-cell ${getGapClass(gapValue)}`}>
                      {gapValue}
                    </td>
                  );
                })}
                <td className={`fechamento-column gap-cell ${getGapClass(getFechamentoValue('conversao', 'gap'))}`}>
                  {getFechamentoValue('conversao', 'gap')}
                </td>

                <td className={`total-column gap-cell ${getGapClass(getTotalValue('conversao', 'gap'))}`}>
                  {getTotalValue('conversao', 'gap')}
                </td>
              </tr>

              {/* QUINTA SEÇÃO */}
              <tr className="leads-row" style={{background: '#17515c'}}>
                <td className="leads-label" style={{background: '#17515c', padding: '2px 12px'}}>TICKET MÉDIO</td>
                {rondas.map((ronda, index) => (
                  <td key={index} className="leads-cell" style={{background: '#17515c', padding: '2px'}}></td>
                ))}
                <td className="leads-cell" style={{background: '#17515c', padding: '2px'}}></td>
                <td className="leads-cell" style={{background: '#17515c', padding: '2px'}}></td>
              </tr>

              <tr className="header-row">
                <th className="metrics-column" style={{background: '#17515c', fontWeight: 400}}>Realizado</th>
                {rondas.map((ronda, index) => {
                  const realizado = performanceData[ronda.nome]?.ticketMedio?.realizado || 0;
                  const meta = performanceData[ronda.nome]?.ticketMedio?.meta || 0;
                  const gap = performanceData[ronda.nome]?.ticketMedio?.gap || 0;

                  return (
                    <td key={index} className="ronda-column">
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                        <ProgressRing
                          type="realizado"
                          realizado={realizado}
                          meta={meta}
                          gap={gap}
                        />
                        <span>{getMetricValue(ronda.nome, 'ticketMedio', 'realizado')}</span>
                      </div>
                    </td>
                  );
                })}
                <td className="fechamento-column">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    <ProgressRing
                      type="realizado"
                      realizado={fechamentoData.ticketMedio?.realizado || 0}
                      meta={fechamentoData.ticketMedio?.meta || 0}
                      gap={fechamentoData.ticketMedio?.gap || 0}
                    />
                    <span>{getFechamentoValue('ticketMedio', 'realizado')}</span>
                  </div>
                </td>

                <td className="total-column">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    <ProgressRing
                      type="realizado"
                      realizado={totalData.ticketMedio?.realizado || 0}
                      meta={totalData.ticketMedio?.meta || 0}
                      gap={totalData.ticketMedio?.gap || 0}
                    />
                    <span>{getTotalValue('ticketMedio', 'realizado')}</span>
                  </div>
                </td>
              </tr>

              <tr className="header-row">
                <th className="metrics-column" style={{background: '#17515c', fontWeight: 400}}>Meta</th>
                {rondas.map((ronda, index) => (
                  <td key={index} className="ronda-column">
                    {getMetricValue(ronda.nome, 'ticketMedio', 'meta')}
                  </td>
                ))}
                <td className="fechamento-column">
                  {getFechamentoValue('ticketMedio', 'meta')}
                </td>

                <td className="total-column">
                  {getTotalValue('ticketMedio', 'meta')}
                </td>
              </tr>

              <tr className="header-row">
                <th className="metrics-column" style={{background: '#17515c', fontWeight: 400}}>Gap</th>
                {rondas.map((ronda, index) => {
                  const gapValue = getMetricValue(ronda.nome, 'ticketMedio', 'gap');
                  return (
                    <td key={index} className={`ronda-column gap-cell ${getGapClass(gapValue)}`}>
                      {gapValue}
                    </td>
                  );
                })}
                <td className={`fechamento-column gap-cell ${getGapClass(getFechamentoValue('ticketMedio', 'gap'))}`}>
                  {getFechamentoValue('ticketMedio', 'gap')}
                </td>

                <td className={`total-column gap-cell ${getGapClass(getTotalValue('ticketMedio', 'gap'))}`}>
                  {getTotalValue('ticketMedio', 'gap')}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DailyPerformanceVertical;
