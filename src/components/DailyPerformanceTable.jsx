import React, { useState, useEffect } from 'react';
import './DailyPerformanceTable.css';
import { getDailyPerformanceData } from '../service/dailyPerformanceService';

/**
 * 🎯 DAILY PERFORMANCE TABLE
 * 
 * Tabela de performance diária que mostra métricas por dia do mês
 * Estrutura similar à imagem fornecida com padrão visual da dashboard
 */
const DailyPerformanceTable = ({ 
  startDate, 
  endDate, 
  selectedFunnel, 
  selectedUnit, 
  selectedSeller, 
  selectedSellerName,
  selectedOrigin,
  t // traduções
}) => {
  const [dailyData, setDailyData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [summaryData, setSummaryData] = useState(null);

  // Buscar dados diários
  useEffect(() => {
    console.log('📊 DailyPerformanceTable: Buscando dados diários...');
    console.log('Parâmetros:', { startDate, endDate, selectedFunnel, selectedUnit, selectedSeller, selectedOrigin });
    
    const fetchDailyData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const data = await getDailyPerformanceData(
          startDate, 
          endDate, 
          selectedFunnel, 
          selectedUnit, 
          selectedSeller, 
          selectedOrigin
        );
        
        setDailyData(data.dailyData);
        setSummaryData(data.summaryData);
        console.log('✅ DailyPerformanceTable: Dados carregados:', data);
      } catch (error) {
        console.error('❌ DailyPerformanceTable: Erro ao carregar dados:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDailyData();
  }, [startDate, endDate, selectedFunnel, selectedUnit, selectedSeller, selectedOrigin]);

  // Gerar array de dias baseado no período selecionado
  const generateDaysOfPeriod = () => {
    const today = new Date();
    let periodStart, periodEnd;

    if (startDate && endDate) {
      // Usar período fornecido - forçar timezone local
      const [startYear, startMonth, startDay] = startDate.split('-').map(Number);
      const [endYear, endMonth, endDay] = endDate.split('-').map(Number);
      periodStart = new Date(startYear, startMonth - 1, startDay);
      periodEnd = new Date(endYear, endMonth - 1, endDay);
    } else {
      // Fallback: mês atual
      periodStart = new Date(today.getFullYear(), today.getMonth(), 1);
      periodEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    }

    const days = [];
    const current = new Date(periodStart);

    while (current <= periodEnd) {
      days.push({
        date: new Date(current),
        day: current.getDate(),
        month: current.getMonth() + 1,
        year: current.getFullYear(),
        isToday: current.toDateString() === today.toDateString(),
        isWeekend: current.getDay() === 0 || current.getDay() === 6
      });
      current.setDate(current.getDate() + 1);
    }

    return days;
  };

  const days = generateDaysOfPeriod();

  // Paginação por blocos de 10 dias
  const rowsPerPage = 10;
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(days.length / rowsPerPage));
  const pageStartIndex = (currentPage - 1) * rowsPerPage;
  const pageEndIndex = pageStartIndex + rowsPerPage;
  const pagedDays = days.slice(pageStartIndex, pageEndIndex);

  const goPrev = () => setCurrentPage((p) => Math.max(1, p - 1));
  const goNext = () => setCurrentPage((p) => Math.min(totalPages, p + 1));

  // Função para formatar moeda
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value || 0);
  };

  // Função para formatar percentual
  const formatPercentage = (value) => {
    return `${Math.round(value || 0)}%`;
  };

  // Função para calcular gap
  const calculateGap = (realizado, meta) => {
    return (realizado || 0) - (meta || 0);
  };

  // Função para obter classe CSS do gap
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
      // Verificar se começa com número positivo sem sinal (ex: "238 (+7%)")
      if (trimmedGap.match(/^\d/)) {
        return 'gap-positive';
      }
      return 'gap-neutral';
    }

    // Para gaps numéricos (conversão)
    if (typeof gap === 'number') {
      if (gap > 0) return 'gap-positive';
      if (gap < 0) return 'gap-negative';
    }

    return 'gap-neutral';
  };

  if (loading) {
    return (
      <div className="daily-performance-table-container">
        <div className="daily-performance-loading">
          <div className="loading-spinner"></div>
          <p>Carregando dados de performance...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="daily-performance-table-container">
        <div className="daily-performance-error">
          <div className="error-icon">❌</div>
          <div className="error-message">
            <h3>Erro ao carregar dados</h3>
            <p>{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="main-chart">
      <div className="daily-performance-table-container">
      <div className="daily-performance-header">
        <h2>Performance Diária - {(() => {
          if (startDate && endDate) {
            const [startYear, startMonth, startDay] = startDate.split('-').map(Number);
            const [endYear, endMonth, endDay] = endDate.split('-').map(Number);
            const start = new Date(startYear, startMonth - 1, startDay);
            const end = new Date(endYear, endMonth - 1, endDay);

            if (startMonth === endMonth && startYear === endYear) {
              // Mesmo mês
              return start.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
            } else {
              // Período customizado
              return `${start.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })} a ${end.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })}`;
            }
          } else {
            // Mês atual
            return new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
          }
        })()}</h2>
      </div>

      <div className="daily-performance-table-wrapper">
        <table className="daily-performance-table">
          <colgroup>
            <col style={{ width: '160px' }} />
            {/* Leads */}
            <col style={{ width: '80px' }} />
            <col style={{ width: '80px' }} />
            <col style={{ width: '80px' }} />
            {/* Vendas */}
            <col style={{ width: '80px' }} />
            <col style={{ width: '80px' }} />
            <col style={{ width: '80px' }} />
            {/* Faturamento */}
            <col style={{ width: '140px' }} />
            <col style={{ width: '140px' }} />
            <col style={{ width: '140px' }} />
            {/* Conversão */}
            <col style={{ width: '90px' }} />
            <col style={{ width: '90px' }} />
            <col style={{ width: '90px' }} />
            {/* Ticket Médio */}
            <col style={{ width: '120px' }} />
            <col style={{ width: '120px' }} />
            <col style={{ width: '120px' }} />
          </colgroup>
          <thead>
            <tr className="header-row-groups">
              <th rowSpan="2" className="indicators-column">Indicadores / Data 2025</th>
              <th colSpan="3" className="metric-group metric-leads">Leads</th>
              <th colSpan="3" className="metric-group metric-vendas">N° Vendas</th>
              <th colSpan="3" className="metric-group metric-faturamento">Faturamento</th>
              <th colSpan="3" className="metric-group metric-conversao">Taxa Conversão</th>
              <th colSpan="3" className="metric-group metric-ticket">Ticket Médio</th>
            </tr>
            <tr className="header-row-sub">
              <th className="subheader sub-leads">Realizado</th>
              <th className="subheader sub-leads">Meta</th>
              <th className="subheader sub-leads">Gap</th>
              <th className="subheader sub-vendas">Realizado</th>
              <th className="subheader sub-vendas">Meta</th>
              <th className="subheader sub-vendas">Gap</th>
              <th className="subheader sub-faturamento">Realizado</th>
              <th className="subheader sub-faturamento">Meta</th>
              <th className="subheader sub-faturamento">Gap</th>
              <th className="subheader sub-conversao">Realizado</th>
              <th className="subheader sub-conversao">Meta</th>
              <th className="subheader sub-conversao">Gap</th>
              <th className="subheader sub-ticket">Realizado</th>
              <th className="subheader sub-ticket">Meta</th>
              <th className="subheader sub-ticket">Gap</th>
            </tr>
          </thead>
          <tbody>
            {/* Linha de resumo do mês */}
            {summaryData && (
              <tr className="summary-row">
                <td className="indicators-cell summary-indicator">
                  {(() => {
                    let periodLabel;

                    if (startDate && endDate) {
                      const [startYear, startMonth, startDay] = startDate.split('-').map(Number);
                      const [endYear, endMonth, endDay] = endDate.split('-').map(Number);
                      const startDateObj = new Date(startYear, startMonth - 1, startDay);
                      const endDateObj = new Date(endYear, endMonth - 1, endDay);

                      if (startMonth === endMonth && startYear === endYear) {
                        // Mesmo mês
                        const monthName = startDateObj.toLocaleDateString('pt-BR', { month: 'long' });
                        periodLabel = monthName.charAt(0).toUpperCase() + monthName.slice(1);
                      } else {
                        // Período customizado
                        periodLabel = `${startDateObj.toLocaleDateString('pt-BR', { month: 'short' })} a ${endDateObj.toLocaleDateString('pt-BR', { month: 'short' })}`;
                      }
                    } else {
                      // Mês atual (fallback)
                      const monthName = new Date().toLocaleDateString('pt-BR', { month: 'long' });
                      periodLabel = monthName.charAt(0).toUpperCase() + monthName.slice(1);
                    }

                    return selectedSeller && selectedSeller !== 'all' && selectedSellerName
                      ? (
                          <div>
                            <div>{periodLabel}</div>
                            <div className="seller-name">{selectedSellerName}</div>
                          </div>
                        )
                      : periodLabel;
                  })()}
                </td>
                <td className="metric-cell">{summaryData.leads.realizado}</td>
                <td className="metric-cell">{summaryData.leads.meta}</td>
                <td className={`metric-cell gap-cell ${getGapClass(summaryData.leads.gap)}`}>
                  {summaryData.leads.gap}
                </td>
                <td className="metric-cell">{summaryData.vendas.realizado}</td>
                <td className="metric-cell">{summaryData.vendas.meta}</td>
                <td className={`metric-cell gap-cell ${getGapClass(summaryData.vendas.gap)}`}>
                  {summaryData.vendas.gap}
                </td>
                <td className="metric-cell">{formatCurrency(summaryData.faturamento.realizado)}</td>
                <td className="metric-cell">{formatCurrency(summaryData.faturamento.meta)}</td>
                <td className={`metric-cell gap-cell ${getGapClass(summaryData.faturamento.gap)}`}>
                  {summaryData.faturamento.gap}
                </td>
                <td className="metric-cell">{formatPercentage(summaryData.conversao.realizado)}</td>
                <td className="metric-cell">{formatPercentage(summaryData.conversao.meta)}</td>
                <td className={`metric-cell gap-cell ${getGapClass(summaryData.conversao.gap)}`}>
                  {summaryData.conversao.gap > 0 ? '+' : ''}{formatPercentage(summaryData.conversao.gap)}
                </td>
                <td className="metric-cell">{formatCurrency(summaryData.ticketMedio.realizado)}</td>
                <td className="metric-cell">{formatCurrency(summaryData.ticketMedio.meta)}</td>
                <td className={`metric-cell gap-cell ${getGapClass(summaryData.ticketMedio.gap)}`}>
                  {summaryData.ticketMedio.gap}
                </td>
              </tr>
            )}

            {/* Linhas dos dias */}
            {pagedDays.map((day, index) => {
              const dayKey = day.date.toLocaleDateString('sv-SE');
              const dayData = dailyData.find(d => {
                const found = d.date === dayKey;
                if (dayKey === '2025-09-16') { // Debug para hoje
                  console.log('🔍 DEBUG HOJE:', {
                    dayKey,
                    searchingFor: dayKey,
                    foundData: found,
                    dailyDataSample: dailyData.slice(0, 3),
                    allDatesInDailyData: dailyData.map(d => d.date)
                  });
                }
                return found;
              }) || {
                leads: { realizado: 0, meta: 0, gap: 0 },
                vendas: { realizado: 0, meta: 0, gap: 0 },
                faturamento: { realizado: 0, meta: 0, gap: 0 },
                conversao: { realizado: 0, meta: 0, gap: 0 },
                ticketMedio: { realizado: 0, meta: 0, gap: 0 }
              };

              return (
                <tr 
                  key={day.date.toISOString()} 
                  className={`day-row ${day.isToday ? 'today-row' : ''} ${day.isWeekend ? 'weekend-row' : ''}`}
                >
                  <td className="indicators-cell day-indicator">
                    {day.day.toString().padStart(2, '0')}/{day.month.toString().padStart(2, '0')}/{day.year}
                  </td>
                  
                  {/* Leads */}
                  <td className="metric-cell">{dayData.leads.realizado}</td>
                  <td className="metric-cell">{dayData.leads.meta}</td>
                  <td className={`metric-cell gap-cell ${getGapClass(dayData.leads.gap)}`}>
                    {dayData.leads.gap}
                  </td>
                  
                  {/* Vendas */}
                  <td className="metric-cell">{dayData.vendas.realizado}</td>
                  <td className="metric-cell">{dayData.vendas.meta}</td>
                  <td className={`metric-cell gap-cell ${getGapClass(dayData.vendas.gap)}`}>
                    {dayData.vendas.gap}
                  </td>
                  
                  {/* Faturamento */}
                  <td className="metric-cell">{formatCurrency(dayData.faturamento.realizado)}</td>
                  <td className="metric-cell">{formatCurrency(dayData.faturamento.meta)}</td>
                  <td className={`metric-cell gap-cell ${getGapClass(dayData.faturamento.gap)}`}>
                    {dayData.faturamento.gap}
                  </td>
                  
                  {/* Taxa Conversão */}
                  <td className="metric-cell">{formatPercentage(dayData.conversao.realizado)}</td>
                  <td className="metric-cell">{formatPercentage(dayData.conversao.meta)}</td>
                  <td className={`metric-cell gap-cell ${getGapClass(dayData.conversao.gap)}`}>
                    {dayData.conversao.gap > 0 ? '+' : ''}{formatPercentage(dayData.conversao.gap)}
                  </td>
                  
                  {/* Ticket Médio */}
                  <td className="metric-cell">{formatCurrency(dayData.ticketMedio.realizado)}</td>
                  <td className="metric-cell">{formatCurrency(dayData.ticketMedio.meta)}</td>
                  <td className={`metric-cell gap-cell ${getGapClass(dayData.ticketMedio.gap)}`}>
                    {dayData.ticketMedio.gap}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div className="daily-performance-pager">
          <button className="pager-btn" onClick={goPrev} disabled={currentPage <= 1}>« Anterior</button>
          <span className="pager-info">{currentPage} / {totalPages}</span>
          <button className="pager-btn" onClick={goNext} disabled={currentPage >= totalPages}>Próximo »</button>
        </div>
      </div>
      </div>
    </div>
  );
};

export default DailyPerformanceTable;
