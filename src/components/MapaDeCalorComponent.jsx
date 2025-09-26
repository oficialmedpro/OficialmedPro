import React, { useState, useEffect, useMemo, useCallback, lazy, Suspense } from 'react';
import './MapaDeCalorComponent.css';
import { getMapaDeCalorData } from '../service/mapaDeCalorService';
import { TrendingUp, Target, HeartCrack, DollarSign, Receipt } from 'lucide-react';

/**
 * 🔥 MAPA DE CALOR - LEADS POR DIA E HORA
 *
 * Componente que exibe um heatmap de leads por dia da semana e hora
 * Baseado na imagem: Segunda-Domingo (eixo Y) x 8h-22h (eixo X)
 */
const MapaDeCalorComponent = ({
  t,
  startDate,
  endDate,
  selectedFunnel,
  selectedUnit,
  selectedSeller,
  selectedOrigin,
  isDarkMode = true
}) => {
  const [heatmapData, setHeatmapData] = useState([]);
  const [rawLeadsData, setRawLeadsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [weekOffset, setWeekOffset] = useState(0); // 0 = semana atual, 1 = semana anterior, etc.
  const [selectedMetric, setSelectedMetric] = useState('opportunities'); // Métrica selecionada

  // Configurações das métricas - memoizada para evitar recriação
  const metricsConfig = useMemo(() => ({
    opportunities: {
      label: 'Oportunidades',
      icon: TrendingUp,
      color: '#3b82f6',
      description: 'Oportunidades criadas'
    },
    wins: {
      label: 'Ganhos',
      icon: Target,
      color: '#10b981',
      description: 'Oportunidades ganhas'
    },
    losses: {
      label: 'Perdas',
      icon: HeartCrack,
      color: '#ef4444',
      description: 'Oportunidades perdidas'
    },
    revenue: {
      label: 'Faturamento',
      icon: DollarSign,
      color: '#f59e0b',
      description: 'Valor total faturado'
    },
    avgTicket: {
      label: 'Ticket Médio',
      icon: Receipt,
      color: '#8b5cf6',
      description: 'Valor médio por oportunidade'
    }
  }), []);

  // Arrays estáticos memoizados
  const diasSemana = useMemo(() => [
    'Segunda',
    'Terça',
    'Quarta',
    'Quinta',
    'Sexta',
    'Sábado',
    'Domingo'
  ], []);

  const horarios = useMemo(() => {
    const horarios = [];
    for (let hora = 8; hora <= 22; hora++) {
      horarios.push(`${hora}h`);
    }
    return horarios;
  }, []);

  // Função de busca memoizada com progresso
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setLoadingProgress(0);

      // Simular progresso durante a busca
      const progressInterval = setInterval(() => {
        setLoadingProgress(prev => {
          if (prev < 80) return prev + 10;
          return prev;
        });
      }, 100);

      const params = {
        startDate,
        endDate,
        selectedFunnel,
        selectedUnit,
        selectedSeller,
        selectedOrigin,
        weekOffset,
        selectedMetric
      };

      setLoadingProgress(30);
      const data = await getMapaDeCalorData(params);

      clearInterval(progressInterval);
      setLoadingProgress(90);

      setHeatmapData(data.heatmapData || []);
      setRawLeadsData(data.rawData || []);

      setLoadingProgress(100);

      // Pequeno delay para mostrar 100%
      setTimeout(() => {
        setLoading(false);
        setLoadingProgress(0);
      }, 200);

    } catch (error) {
      console.error('❌ Erro ao carregar dados do mapa de calor:', error);
      setLoading(false);
      setLoadingProgress(0);
    }
  }, [startDate, endDate, selectedFunnel, selectedUnit, selectedSeller, selectedOrigin, weekOffset, selectedMetric]);

  // Buscar dados do mapa de calor
  useEffect(() => {
    if (startDate && endDate) {
      fetchData();
    } else {
      setLoading(false);
    }
  }, [startDate, endDate, fetchData]);

  // Função memoizada para obter valor do lead em uma célula específica
  const getLeadValue = useCallback((diaSemana, hora) => {
    if (!heatmapData || heatmapData.length === 0) return 0;

    const item = heatmapData.find(d =>
      d.dia_semana === diaSemana && d.hora === hora
    );
    return item ? item.total_leads : 0;
  }, [heatmapData]);

  // Função otimizada para contar leads únicos do dia inteiro
  const getTotalLeadsByDay = useCallback((diaSemana) => {
    if (!rawLeadsData || rawLeadsData.length === 0) return 0;

    const dayMap = {
      1: rawLeadsData.segunda,
      2: rawLeadsData.terca,
      3: rawLeadsData.quarta,
      4: rawLeadsData.quinta,
      5: rawLeadsData.sexta,
      6: rawLeadsData.sabado,
      0: rawLeadsData.domingo
    };

    const dayData = dayMap[diaSemana];
    return dayData ? dayData.length : 0;
  }, [rawLeadsData]);

  // Função otimizada para encontrar as datas de todos os dias da semana
  const getRealDateForDay = useCallback((nomeDia, diaIndex) => {
    const dateMap = {
      0: rawLeadsData.segundaDate,
      1: rawLeadsData.tercaDate,
      2: rawLeadsData.quartaDate,
      3: rawLeadsData.quintaDate,
      4: rawLeadsData.sextaDate,
      5: rawLeadsData.sabadoDate,
      6: rawLeadsData.domingoDate
    };

    const date = dateMap[diaIndex];
    if (!date) return '';

    const [year, month, day] = date.split('-');
    return `${day}/${month}`;
  }, [rawLeadsData]);

  // 🔥 SISTEMA ESTATÍSTICO ROBUSTO DE HEATMAP

  // Função para calcular percentis
  const calculatePercentiles = (values) => {
    const sorted = [...values].sort((a, b) => a - b);
    const n = sorted.length;

    const getPercentile = (p) => {
      const index = (p / 100) * (n - 1);
      const lower = Math.floor(index);
      const upper = Math.ceil(index);
      const weight = index - lower;

      if (upper >= n) return sorted[n - 1];
      return sorted[lower] * (1 - weight) + sorted[upper] * weight;
    };

    return {
      p10: getPercentile(10),
      p50: getPercentile(50),
      p85: getPercentile(85),
      p97: getPercentile(97),
      min: sorted[0],
      max: sorted[n - 1]
    };
  };

  // Função para interpolação de cores do gradiente contínuo
  const interpColor = (t) => {
    // Clamp entre 0 e 1
    t = Math.max(0, Math.min(1, t));

    // Stops do gradiente com posições e cores
    const stops = [
      { pos: 0.00, color: [11, 16, 32] },    // #0B1020 frio profundo
      { pos: 0.10, color: [16, 74, 90] },    // #104A5A teal escuro
      { pos: 0.50, color: [242, 201, 76] },  // #F2C94C âmbar
      { pos: 0.85, color: [242, 100, 25] },  // #F26419 laranja-vermelho
      { pos: 0.97, color: [215, 38, 61] },   // #D7263D vermelho vivo
      { pos: 1.00, color: [127, 29, 29] }    // #7F1D1D vinho brasa
    ];

    // Encontrar os dois stops entre os quais interpolar
    let i = 0;
    while (i < stops.length - 1 && t > stops[i + 1].pos) {
      i++;
    }

    if (i === stops.length - 1) {
      const [r, g, b] = stops[i].color;
      return `rgb(${r}, ${g}, ${b})`;
    }

    const stop1 = stops[i];
    const stop2 = stops[i + 1];
    const localT = (t - stop1.pos) / (stop2.pos - stop1.pos);

    const r = Math.round(stop1.color[0] + (stop2.color[0] - stop1.color[0]) * localT);
    const g = Math.round(stop1.color[1] + (stop2.color[1] - stop1.color[1]) * localT);
    const b = Math.round(stop1.color[2] + (stop2.color[2] - stop1.color[2]) * localT);

    return `rgb(${r}, ${g}, ${b})`;
  };

  // Função principal makeScaler
  const makeScaler = (values) => {
    // Filtrar zeros (considerados "fora de operação")
    const nonZeroValues = values.filter(v => v > 0);

    if (nonZeroValues.length === 0) {
      return {
        p10: 0, p50: 0, p85: 0, p97: 0,
        color: () => '#1e1b3a',
        band: () => 'Sem dados',
        textColor: () => '#94a3b8'
      };
    }

    let processedValues = [...nonZeroValues];

    // Verificar se precisa aplicar log1p
    const { min, max, p50, p85 } = calculatePercentiles(processedValues);
    const needsLog = (max / min) > 10 || (p85 - p50) < 5;

    if (needsLog) {
      processedValues = processedValues.map(v => Math.log1p(v));
    }

    // Recalcular percentis com valores processados
    const stats = calculatePercentiles(processedValues);

    return {
      ...stats,
      needsLog,
      color: (value) => {
        if (value <= 0) return '#1e1b3a'; // Neutro para zeros

        let processedValue = needsLog ? Math.log1p(value) : value;

        // Normalização robusta [p10, p97]
        let t;
        if (processedValue <= stats.p10) {
          t = 0;
        } else if (processedValue >= stats.p97) {
          t = 1;
        } else {
          t = (processedValue - stats.p10) / (stats.p97 - stats.p10);
        }

        return interpColor(t);
      },
      band: (value) => {
        if (value <= 0) return 'Fora de operação';

        let processedValue = needsLog ? Math.log1p(value) : value;

        if (processedValue < stats.p50) return 'Baixa';
        if (processedValue < stats.p85) return 'Média';
        if (processedValue < stats.p97) return 'Alta';
        return 'Muito Alta';
      },
      textColor: (value) => {
        if (value <= 0) return '#94a3b8';

        let processedValue = needsLog ? Math.log1p(value) : value;
        let t;
        if (processedValue <= stats.p10) {
          t = 0;
        } else if (processedValue >= stats.p97) {
          t = 1;
        } else {
          t = (processedValue - stats.p10) / (stats.p97 - stats.p10);
        }

        return t > 0.45 ? '#ffffff' : '#000000';
      }
    };
  };

  // Extrair dados da semana inteira de forma otimizada
  const getDataArrays = useMemo(() => {
    if (!heatmapData || heatmapData.length === 0) {
      return { A: [], T: [] };
    }

    const A = [];
    const T = [];
    const days = [1, 2, 3, 4, 5, 6, 0]; // Segunda a domingo

    // Coletar valores hora-a-hora
    for (const day of days) {
      for (let hora = 8; hora <= 22; hora++) {
        const valor = getLeadValue(day, hora);
        if (valor > 0) A.push(valor);
      }
    }

    // Coletar totais diários
    for (const day of days) {
      const total = getTotalLeadsByDay(day);
      if (total > 0) T.push(total);
    }

    return { A, T };
  }, [heatmapData, getLeadValue, getTotalLeadsByDay]);

  // Função memoizada para determinar se um dia é da semana atual
  const isCurrentWeekDay = useCallback((diaIndex) => {
    if (weekOffset !== 0) return true;

    const today = new Date();
    const todayWeekday = today.getDay();
    const dayWeekday = diaIndex === 6 ? 0 : diaIndex + 1;

    if (todayWeekday === 0) {
      return dayWeekday === 0;
    } else {
      return dayWeekday >= 1 && dayWeekday <= todayWeekday;
    }
  }, [weekOffset]);

  // Criar escaladores memoizados
  const { A, T } = getDataArrays;
  const scalerA = useMemo(() => makeScaler(A), [A]);
  const scalerT = useMemo(() => makeScaler(T), [T]);

  // Componente de loading com barra de progresso
  const LoadingComponent = useMemo(() => (
    <div className={`mapa-calor-container ${!isDarkMode ? 'light-theme' : ''}`}>
      <div className="mapa-calor-loading">
        <div className="loading-content">
          <p>Carregando mapa de calor...</p>
          <div className="progress-container">
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${loadingProgress}%` }}
              ></div>
            </div>
            <span className="progress-text">{loadingProgress}%</span>
          </div>
        </div>
      </div>
    </div>
  ), [loadingProgress, isDarkMode]);

  if (loading) {
    return LoadingComponent;
  }

  return (
    <div className="main-chart">
      <div className={`mapa-calor-container ${!isDarkMode ? 'light-theme' : ''}`}>
        <div className="mapa-calor-header">
          <h2>Leads por Dia e Hora</h2>

          {/* Navegação semanal */}
          <div className="mapa-calor-navigation">
            <button
              className="mapa-nav-btn"
              onClick={() => setWeekOffset(weekOffset + 1)}
              disabled={loading}
            >
              ← Semana Anterior
            </button>

            <div className="mapa-nav-info">
              {weekOffset === 0 ? (
                <span className="current-week">Última Semana</span>
              ) : (
                <span className="offset-week">{weekOffset} semana{weekOffset > 1 ? 's' : ''} atrás</span>
              )}
            </div>

            <button
              className="mapa-nav-btn"
              onClick={() => setWeekOffset(Math.max(0, weekOffset - 1))}
              disabled={weekOffset === 0 || loading}
            >
              Semana Seguinte →
            </button>
          </div>

          {/* Seletor de Métricas */}
          <div className="mapa-metric-selector">
            {Object.entries(metricsConfig).map(([key, config]) => {
              const IconComponent = config.icon;
              return (
                <button
                  key={key}
                  className={`metric-btn ${selectedMetric === key ? 'active' : ''}`}
                  onClick={() => setSelectedMetric(key)}
                  disabled={loading}
                  style={{
                    '--metric-color': config.color
                  }}
                  title={config.description}
                >
                  <IconComponent className="metric-icon" size={18} />
                  <span className="metric-label">{config.label}</span>
                </button>
              );
            })}
          </div>

          <p className="mapa-calor-subtitle">
            {startDate && endDate ? (
              startDate === endDate ?
                `${metricsConfig[selectedMetric].description} em ${startDate}` :
                `${metricsConfig[selectedMetric].description} entre ${startDate} e ${endDate}`
            ) : (
              'Selecione um período para visualizar os dados'
            )}
          </p>
        </div>

        <div className="mapa-calor-wrapper">
          <div className="mapa-calor-grid">
            {/* Cabeçalho com horários */}
            <div className="mapa-calor-header-row">
              <div className="mapa-calor-corner"></div>
              {horarios.map(horario => (
                <div key={horario} className="mapa-calor-hour-header">
                  {horario}
                </div>
              ))}
              {/* Coluna Total */}
              <div className="mapa-calor-total-header">
                Total
              </div>
            </div>

            {/* Linhas dos dias da semana */}
            {diasSemana.map((dia, diaIndex) => {
              const isFromCurrentWeek = isCurrentWeekDay(diaIndex);
              const rowOpacity = isFromCurrentWeek ? 1.0 : 0.3; // Mais apagado: 0.3 ao invés de 0.5

              return (
                <div key={dia} className="mapa-calor-day-row" style={{ opacity: rowOpacity }}>
                  {/* Cabeçalho do dia */}
                  <div className="mapa-calor-day-header">
                    <div className="day-name">{dia}</div>
                    <div className="day-date">{getRealDateForDay(dia, diaIndex)}</div>
                  </div>

                {/* Células de dados */}
                {horarios.map((horario, horaIndex) => {
                  const hora = horaIndex + 8; // Converter índice para hora (8-22)
                  // Ajustar dia_semana: Segunda=1, Terça=2, Quarta=3, Quinta=4, Sexta=5, Sábado=6, Domingo=0
                  const diaSemanaValue = diaIndex === 6 ? 0 : diaIndex + 1;
                  const valor = getLeadValue(diaSemanaValue, hora);

                  return (
                    <div
                      key={`${dia}-${horario}`}
                      className="mapa-calor-cell"
                      style={{
                        backgroundColor: scalerA.color(valor),
                        color: scalerA.textColor(valor)
                      }}
                      title={`${dia} ${horario}: ${valor} leads (${scalerA.band(valor)})`}
                    >
                      <span className="mapa-calor-value">
                        {valor}
                      </span>
                    </div>
                  );
                })}

                {/* Célula Total do dia */}
                {(() => {
                  // Ajustar dia_semana: Segunda=1, Terça=2, Quarta=3, Quinta=4, Sexta=5, Sábado=6, Domingo=0
                  const diaSemanaValue = diaIndex === 6 ? 0 : diaIndex + 1;
                  const totalDia = getTotalLeadsByDay(diaSemanaValue);
                  return (
                    <div
                      key={`${dia}-total`}
                      className="mapa-calor-cell mapa-calor-total-cell"
                      style={{
                        backgroundColor: scalerT.color(totalDia),
                        color: scalerT.textColor(totalDia)
                      }}
                      title={`${dia} - Total: ${totalDia} leads (${scalerT.band(totalDia)})`}
                    >
                      <span className="mapa-calor-value">
                        {totalDia}
                      </span>
                    </div>
                  );
                })()}
                </div>
              );
            })}
          </div>

          {/* Legenda dinâmica baseada nos percentis */}
          <div className="mapa-calor-legend">
            <div className="legend-title">Intensidade (Células):</div>
            <div className="legend-items">
              <div className="legend-item">
                <div className="legend-color" style={{ backgroundColor: '#1e1b3a' }}></div>
                <span>Fora de operação</span>
              </div>
              {A.length > 0 && (
                <>
                  <div className="legend-item">
                    <div className="legend-color" style={{ backgroundColor: scalerA.color(scalerA.needsLog ? Math.exp(scalerA.p10) - 1 : scalerA.p10) }}></div>
                    <span>Baixa (até p50)</span>
                  </div>
                  <div className="legend-item">
                    <div className="legend-color" style={{ backgroundColor: scalerA.color(scalerA.needsLog ? Math.exp(scalerA.p50) - 1 : scalerA.p50) }}></div>
                    <span>Média (p50-p85)</span>
                  </div>
                  <div className="legend-item">
                    <div className="legend-color" style={{ backgroundColor: scalerA.color(scalerA.needsLog ? Math.exp(scalerA.p85) - 1 : scalerA.p85) }}></div>
                    <span>Alta (p85-p97)</span>
                  </div>
                  <div className="legend-item">
                    <div className="legend-color" style={{ backgroundColor: scalerA.color(scalerA.needsLog ? Math.exp(scalerA.p97) - 1 : scalerA.p97) }}></div>
                    <span>Muito Alta (p97+)</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Legenda dinâmica para totais */}
          <div className="mapa-calor-legend">
            <div className="legend-title">Intensidade (Totais):</div>
            <div className="legend-items">
              <div className="legend-item">
                <div className="legend-color" style={{ backgroundColor: '#1e1b3a' }}></div>
                <span>Fora de operação</span>
              </div>
              {T.length > 0 && (
                <>
                  <div className="legend-item">
                    <div className="legend-color" style={{ backgroundColor: scalerT.color(scalerT.needsLog ? Math.exp(scalerT.p10) - 1 : scalerT.p10) }}></div>
                    <span>Baixa (até p50)</span>
                  </div>
                  <div className="legend-item">
                    <div className="legend-color" style={{ backgroundColor: scalerT.color(scalerT.needsLog ? Math.exp(scalerT.p50) - 1 : scalerT.p50) }}></div>
                    <span>Média (p50-p85)</span>
                  </div>
                  <div className="legend-item">
                    <div className="legend-color" style={{ backgroundColor: scalerT.color(scalerT.needsLog ? Math.exp(scalerT.p85) - 1 : scalerT.p85) }}></div>
                    <span>Alta (p85-p97)</span>
                  </div>
                  <div className="legend-item">
                    <div className="legend-color" style={{ backgroundColor: scalerT.color(scalerT.needsLog ? Math.exp(scalerT.p97) - 1 : scalerT.p97) }}></div>
                    <span>Muito Alta (p97+)</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapaDeCalorComponent;