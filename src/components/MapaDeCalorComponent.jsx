import React, { useState, useEffect } from 'react';
import './MapaDeCalorComponent.css';
import { getMapaDeCalorData } from '../service/mapaDeCalorService';

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
  selectedOrigin
}) => {
  const [heatmapData, setHeatmapData] = useState([]);
  const [rawLeadsData, setRawLeadsData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Mostrar Segunda-feira, Terça-feira e Quarta-feira
  const diasSemana = [
    'Segunda',
    'Terça',
    'Quarta'
  ];

  // Horários de 8h às 22h
  const horarios = [];
  for (let hora = 8; hora <= 22; hora++) {
    horarios.push(`${hora}h`);
  }

  // Buscar dados do mapa de calor
  useEffect(() => {
    console.log('🔥 MapaDeCalorComponent - useEffect chamado:', {
      startDate,
      endDate,
      hasValidDates: !!(startDate && endDate)
    });

    const fetchData = async () => {
      try {
        setLoading(true);
        console.log('🔥 Iniciando busca de dados do mapa de calor...');

        const params = {
          startDate,
          endDate,
          selectedFunnel,
          selectedUnit,
          selectedSeller,
          selectedOrigin
        };

        console.log('🔥 Parâmetros enviados para getMapaDeCalorData:', params);
        const data = await getMapaDeCalorData(params);
        console.log('🔥 Dados recebidos:', data);

        setHeatmapData(data.heatmapData || []);
        setRawLeadsData(data.rawData || []);

      } catch (error) {
        console.error('❌ Erro ao carregar dados do mapa de calor:', error);
      } finally {
        setLoading(false);
      }
    };

    // Só buscar se tiver parâmetros obrigatórios
    if (startDate && endDate) {
      console.log('✅ Datas válidas, chamando fetchData...');
      fetchData();
    } else {
      console.log('⚠️ Datas inválidas, não buscando dados:', { startDate, endDate });
      setLoading(false);
    }
  }, [startDate, endDate, selectedFunnel, selectedUnit, selectedSeller, selectedOrigin]);

  // Função para obter valor do lead em uma célula específica
  const getLeadValue = (diaSemana, hora) => {
    if (!heatmapData || heatmapData.length === 0) return 0;

    const item = heatmapData.find(d =>
      d.dia_semana === diaSemana && d.hora === hora
    );
    return item ? item.total_leads : 0;
  };

  // CORRIGIDO: Contar leads únicos do dia inteiro (independente da hora)
  const getTotalLeadsByDay = (diaSemana) => {
    if (!rawLeadsData || rawLeadsData.length === 0) return 0;

    // Para segunda-feira (dia 1), usar rawLeadsData.segunda
    if (diaSemana === 1 && rawLeadsData.segunda) {
      console.log('🎯 TOTAL SEGUNDA-FEIRA: Contando todos os leads do dia inteiro...');
      console.log(`📊 Total de leads únicos da segunda-feira: ${rawLeadsData.segunda.length}`);
      return rawLeadsData.segunda.length;
    }

    // Para terça-feira (dia 2), usar rawLeadsData.terca
    if (diaSemana === 2 && rawLeadsData.terca) {
      console.log('🎯 TOTAL TERÇA-FEIRA: Contando todos os leads do dia inteiro...');
      console.log(`📊 Total de leads únicos da terça-feira: ${rawLeadsData.terca.length}`);
      return rawLeadsData.terca.length;
    }

    // Para quarta-feira (dia 3), usar rawLeadsData.quarta
    if (diaSemana === 3 && rawLeadsData.quarta) {
      console.log('🎯 TOTAL QUARTA-FEIRA: Contando todos os leads do dia inteiro...');
      console.log(`📊 Total de leads únicos da quarta-feira: ${rawLeadsData.quarta.length}`);
      return rawLeadsData.quarta.length;
    }

    return 0;
  };

  // Função para encontrar as datas da última segunda e terça
  const getRealDateForDay = (nomeDia, diaIndex) => {
    console.log(`📅 CALCULANDO DATA PARA ${nomeDia}:`, { nomeDia, diaIndex });

    // Para segunda-feira (diaIndex = 0)
    if (diaIndex === 0 && rawLeadsData.segundaDate) {
      console.log(`🔍 SEGUNDA - Data recebida: ${rawLeadsData.segundaDate}`);
      // Usar split para evitar problemas de fuso horário
      const [year, month, day] = rawLeadsData.segundaDate.split('-');
      console.log(`🔍 SEGUNDA - Extraído: ${day}/${month}`);
      return `${day}/${month}`;
    }

    // Para terça-feira (diaIndex = 1)
    if (diaIndex === 1 && rawLeadsData.tercaDate) {
      console.log(`🔍 TERÇA - Data recebida: ${rawLeadsData.tercaDate}`);
      // Usar split para evitar problemas de fuso horário
      const [year, month, day] = rawLeadsData.tercaDate.split('-');
      console.log(`🔍 TERÇA - Extraído: ${day}/${month}`);
      return `${day}/${month}`;
    }

    // Para quarta-feira (diaIndex = 2)
    if (diaIndex === 2 && rawLeadsData.quartaDate) {
      console.log(`🔍 QUARTA - Data recebida: ${rawLeadsData.quartaDate}`);
      // Usar split para evitar problemas de fuso horário
      const [year, month, day] = rawLeadsData.quartaDate.split('-');
      console.log(`🔍 QUARTA - Extraído: ${day}/${month}`);
      return `${day}/${month}`;
    }

    return '';
  };

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
      console.log('🔥 Aplicando log1p - razão max/min:', max/min, 'diferença p85-p50:', p85 - p50);
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

  // Extrair dados da Segunda-feira e Terça-feira
  const getDataArrays = () => {
    if (!heatmapData || heatmapData.length === 0) {
      return { A: [], T: [] };
    }

    // A: Valores hora-a-hora de Segunda (dia 1), Terça (dia 2) e Quarta (dia 3), 8h-22h, excluindo zeros
    const A = [];

    // Segunda-feira
    for (let hora = 8; hora <= 22; hora++) {
      const valor = getLeadValue(1, hora); // dia 1 = Segunda-feira
      if (valor > 0) A.push(valor);
    }

    // Terça-feira
    for (let hora = 8; hora <= 22; hora++) {
      const valor = getLeadValue(2, hora); // dia 2 = Terça-feira
      if (valor > 0) A.push(valor);
    }

    // Quarta-feira
    for (let hora = 8; hora <= 22; hora++) {
      const valor = getLeadValue(3, hora); // dia 3 = Quarta-feira
      if (valor > 0) A.push(valor);
    }

    // T: Totais de Segunda-feira, Terça-feira e Quarta-feira
    const T = [];
    const totalSegunda = getTotalLeadsByDay(1); // dia 1 = Segunda-feira
    const totalTerca = getTotalLeadsByDay(2); // dia 2 = Terça-feira
    const totalQuarta = getTotalLeadsByDay(3); // dia 3 = Quarta-feira

    if (totalSegunda > 0) T.push(totalSegunda);
    if (totalTerca > 0) T.push(totalTerca);
    if (totalQuarta > 0) T.push(totalQuarta);

    console.log('📊 Arrays extraídos (Segunda, Terça e Quarta):', {
      A: A.length,
      T: T.length,
      totalSegunda: totalSegunda,
      totalTerca: totalTerca,
      totalQuarta: totalQuarta
    });

    return { A, T };
  };

  // Criar escaladores
  const { A, T } = getDataArrays();
  const scalerA = makeScaler(A); // Para células hora-a-hora
  const scalerT = makeScaler(T); // Para coluna total

  if (loading) {
    return (
      <div className="mapa-calor-container">
        <div className="mapa-calor-loading">
          <div className="loading-spinner"></div>
          <p>Carregando mapa de calor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="main-chart">
      <div className="mapa-calor-container">
        <div className="mapa-calor-header">
          <h2>Leads por Dia e Hora</h2>
          <p className="mapa-calor-subtitle">
            {startDate && endDate ? (
              startDate === endDate ?
                `Distribuição de leads preenchidos em ${startDate}` :
                `Distribuição de leads preenchidos entre ${startDate} e ${endDate}`
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
            {diasSemana.map((dia, diaIndex) => (
              <div key={dia} className="mapa-calor-day-row">
                {/* Cabeçalho do dia */}
                <div className="mapa-calor-day-header">
                  <div className="day-name">{dia}</div>
                  <div className="day-date">{getRealDateForDay(dia, diaIndex)}</div>
                </div>

                {/* Células de dados */}
                {horarios.map((horario, horaIndex) => {
                  const hora = horaIndex + 8; // Converter índice para hora (8-22)
                  const valor = getLeadValue(diaIndex + 1, hora); // dia_semana 1-7

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
                  const totalDia = getTotalLeadsByDay(diaIndex + 1);
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
            ))}
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