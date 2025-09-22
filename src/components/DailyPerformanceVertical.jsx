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
        setDebugInfo(data.debugInfo || []);  // Capturar info de debug
        setMetasDebugInfo(data.metasDebugInfo || {});  // Capturar debug das metas

        // Calcular dados de fechamento
        const fechamento = calculateFechamentoData(data.performanceData);
        setFechamentoData(fechamento);

        console.log('✅ Dados carregados:', { rondas: data.rondas, performance: data.performanceData, fechamento });
        console.log('🔍 ESTRUTURA performanceData:', Object.keys(data.performanceData));
        console.log('🔍 EXEMPLO ronda 10:', data.performanceData['10']);
        console.log('🔍 ESTADO rondas:', data.rondas);
        console.log('🔍 ESTADO performanceData:', data.performanceData);

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

  // Função para obter o valor de uma métrica específica
  const getMetricValue = (rondaNome, metrica, tipo) => {
    console.log(`🔍 getMetricValue: ronda=${rondaNome}, metrica=${metrica}, tipo=${tipo}`);
    console.log(`🔍 performanceData[${rondaNome}]:`, performanceData[rondaNome]);

    // LOGS ESPECIAIS PARA LEADS META E REALIZADO
    if (metrica === 'leads' && tipo === 'meta') {
      console.log(`🎯 FOCO: Buscando Meta de Leads para ronda ${rondaNome}`);
      console.log(`🎯 ESTRUTURA COMPLETA performanceData:`, performanceData);
      console.log(`🎯 DADOS DA RONDA:`, performanceData[rondaNome]);
      if (performanceData[rondaNome]) {
        console.log(`🎯 LEADS DA RONDA:`, performanceData[rondaNome].leads);
        if (performanceData[rondaNome].leads) {
          console.log(`🎯 META LEADS:`, performanceData[rondaNome].leads.meta);
        }
      }
    }

    // LOGS ESPECIAIS PARA LEADS REALIZADO
    if (metrica === 'leads' && tipo === 'realizado') {
      console.log(`🎯 FOCO: Buscando Realizado de Leads para ronda ${rondaNome}`);
      if (performanceData[rondaNome] && performanceData[rondaNome].leads) {
        console.log(`🎯 LEADS REALIZADO:`, performanceData[rondaNome].leads.realizado);
        if (rondaNome === '10' && performanceData[rondaNome].leads.realizado === 27) {
          console.log(`✅ COMPONENTE: 27 registros chegaram ao componente React!`);
        }
      }
    }

    if (!performanceData[rondaNome] || !performanceData[rondaNome][metrica]) {
      console.log(`⚠️ Dados não encontrados para ronda ${rondaNome}, métrica ${metrica}`);
      return '';
    }

    const valor = performanceData[rondaNome][metrica][tipo];
    console.log(`✅ Valor encontrado: ${valor} para ${rondaNome}.${metrica}.${tipo}`);

    // LOGS ESPECIAIS PARA LEADS META
    if (metrica === 'leads' && tipo === 'meta') {
      console.log(`🎯 RESULTADO FINAL Meta de Leads: ${valor}`);
    }

    // Formatação baseada na métrica
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

    // Formatação baseada na métrica
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

          {/* APENAS SQLs DAS METAS */}
          <div style={{
            backgroundColor: '#000080',
            color: '#ffffff',
            padding: '10px',
            margin: '10px 0',
            fontSize: '12px',
            fontFamily: 'monospace'
          }}>
            <h3 style={{ color: '#ffff00' }}>🔍 SQLs DAS METAS:</h3>
            <div style={{ backgroundColor: '#222', padding: '5px', margin: '5px 0' }}>
              SELECT id, nome_meta, valor_da_meta, dashboard FROM api.metas WHERE dashboard = 'oportunidades_ronda';
            </div>
            <div style={{ backgroundColor: '#222', padding: '5px', margin: '5px 0' }}>
              SELECT id, nome_meta, valor_da_meta, dashboard FROM api.metas WHERE dashboard = 'ganhas_ronda';
            </div>
            <div style={{ backgroundColor: '#222', padding: '5px', margin: '5px 0' }}>
              SELECT id, nome_meta, valor_da_meta, dashboard FROM api.metas WHERE dashboard = 'faturamento_ronda';
            </div>
            <div style={{ backgroundColor: '#222', padding: '5px', margin: '5px 0' }}>
              SELECT id, nome_meta, valor_da_meta, dashboard FROM api.metas WHERE dashboard = 'conversao_ronda';
            </div>
            <div style={{ backgroundColor: '#222', padding: '5px', margin: '5px 0' }}>
              SELECT id, nome_meta, valor_da_meta, dashboard FROM api.metas WHERE dashboard = 'ticketmedio_ronda';
            </div>
          </div>
        </div>


        <div className="daily-performance-vertical-table-wrapper">
          <table className="daily-performance-vertical-table">
            <thead>
              <tr className="header-row">
                {/* Coluna fixa: Métricas */}
                <th className="metrics-column">Métricas</th>

                {/* Colunas dinâmicas: Rondas */}
                {rondas.map((ronda, index) => (
                  <th key={index} className="ronda-column">
                    {ronda.nome}
                  </th>
                ))}

                {/* Coluna fixa: Fechamento */}
                <th className="fechamento-column">Fechamento</th>
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

                {/* Coluna fixa: vazia */}
                <td className="leads-cell" style={{background: '#263355', padding: '2px'}}></td>
              </tr>

              <tr className="header-row">
                {/* Coluna fixa: Realizado */}
                <th className="metrics-column" style={{background: 'rgb(38, 51, 85)', fontWeight: 400}}>Realizado</th>

                {/* Colunas dinâmicas: Rondas */}
                {rondas.map((ronda, index) => {
                  const valor = getMetricValue(ronda.nome, 'leads', 'realizado');
                  console.log(`🔍 RENDERIZAÇÃO: Ronda ${ronda.nome}, valor: ${valor}`);
                  return (
                    <td key={index} className="ronda-column">
                      {valor}
                    </td>
                  );
                })}

                {/* Coluna fixa: Fechamento */}
                <td className="fechamento-column">
                  {getFechamentoValue('leads', 'realizado')}
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
              </tr>

              <tr className="header-row">
                {/* Coluna fixa: Gap */}
                <th className="metrics-column" style={{background: 'rgb(38, 51, 85)', fontWeight: 400}}>Gap</th>

                {/* Colunas dinâmicas: Rondas */}
                {rondas.map((ronda, index) => (
                  <td key={index} className="ronda-column">
                    {getMetricValue(ronda.nome, 'leads', 'gap')}
                  </td>
                ))}

                {/* Coluna fixa: Fechamento */}
                <td className="fechamento-column">
                  {getFechamentoValue('leads', 'gap')}
                </td>
              </tr>

              {/* SEGUNDA SEÇÃO */}
              <tr className="leads-row" style={{background: '#254a36'}}>
                <td className="leads-label" style={{background: '#254a36', padding: '2px 12px'}}>Nº VENDAS</td>
                {rondas.map((ronda, index) => (
                  <td key={index} className="leads-cell" style={{background: '#254a36', padding: '2px'}}></td>
                ))}
                <td className="leads-cell" style={{background: '#254a36', padding: '2px'}}></td>
              </tr>

              <tr className="header-row">
                <th className="metrics-column" style={{background: '#254a36', fontWeight: 400}}>Realizado</th>
                {rondas.map((ronda, index) => (
                  <td key={index} className="ronda-column">
                    {getMetricValue(ronda.nome, 'vendas', 'realizado')}
                  </td>
                ))}
                <td className="fechamento-column">
                  {getFechamentoValue('vendas', 'realizado')}
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
              </tr>

              <tr className="header-row">
                <th className="metrics-column" style={{background: '#254a36', fontWeight: 400}}>Gap</th>
                {rondas.map((ronda, index) => (
                  <td key={index} className="ronda-column">
                    {getMetricValue(ronda.nome, 'vendas', 'gap')}
                  </td>
                ))}
                <td className="fechamento-column">
                  {getFechamentoValue('vendas', 'gap')}
                </td>
              </tr>

              {/* TERCEIRA SEÇÃO */}
              <tr className="leads-row" style={{background: '#2d673e'}}>
                <td className="leads-label" style={{background: '#2d673e', padding: '2px 12px'}}>FATURAMENTO</td>
                {rondas.map((ronda, index) => (
                  <td key={index} className="leads-cell" style={{background: '#2d673e', padding: '2px'}}></td>
                ))}
                <td className="leads-cell" style={{background: '#2d673e', padding: '2px'}}></td>
              </tr>

              <tr className="header-row">
                <th className="metrics-column" style={{background: '#2d673e', fontWeight: 400}}>Realizado</th>
                {rondas.map((ronda, index) => (
                  <td key={index} className="ronda-column">
                    {getMetricValue(ronda.nome, 'faturamento', 'realizado')}
                  </td>
                ))}
                <td className="fechamento-column">
                  {getFechamentoValue('faturamento', 'realizado')}
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
              </tr>

              <tr className="header-row">
                <th className="metrics-column" style={{background: '#2d673e', fontWeight: 400}}>Gap</th>
                {rondas.map((ronda, index) => (
                  <td key={index} className="ronda-column">
                    {getMetricValue(ronda.nome, 'faturamento', 'gap')}
                  </td>
                ))}
                <td className="fechamento-column">
                  {getFechamentoValue('faturamento', 'gap')}
                </td>
              </tr>

              {/* QUARTA SEÇÃO */}
              <tr className="leads-row" style={{background: '#5a3623'}}>
                <td className="leads-label" style={{background: '#5a3623', padding: '2px 12px'}}>TAXA DE CONVERSÃO</td>
                {rondas.map((ronda, index) => (
                  <td key={index} className="leads-cell" style={{background: '#5a3623', padding: '2px'}}></td>
                ))}
                <td className="leads-cell" style={{background: '#5a3623', padding: '2px'}}></td>
              </tr>

              <tr className="header-row">
                <th className="metrics-column" style={{background: '#5a3623', fontWeight: 400}}>Realizado</th>
                {rondas.map((ronda, index) => (
                  <td key={index} className="ronda-column">
                    {getMetricValue(ronda.nome, 'conversao', 'realizado')}
                  </td>
                ))}
                <td className="fechamento-column">
                  {getFechamentoValue('conversao', 'realizado')}
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
              </tr>

              <tr className="header-row">
                <th className="metrics-column" style={{background: '#5a3623', fontWeight: 400}}>Gap</th>
                {rondas.map((ronda, index) => (
                  <td key={index} className="ronda-column">
                    {getMetricValue(ronda.nome, 'conversao', 'gap')}
                  </td>
                ))}
                <td className="fechamento-column">
                  {getFechamentoValue('conversao', 'gap')}
                </td>
              </tr>

              {/* QUINTA SEÇÃO */}
              <tr className="leads-row" style={{background: '#17515c'}}>
                <td className="leads-label" style={{background: '#17515c', padding: '2px 12px'}}>TICKET MÉDIO</td>
                {rondas.map((ronda, index) => (
                  <td key={index} className="leads-cell" style={{background: '#17515c', padding: '2px'}}></td>
                ))}
                <td className="leads-cell" style={{background: '#17515c', padding: '2px'}}></td>
              </tr>

              <tr className="header-row">
                <th className="metrics-column" style={{background: '#17515c', fontWeight: 400}}>Realizado</th>
                {rondas.map((ronda, index) => (
                  <td key={index} className="ronda-column">
                    {getMetricValue(ronda.nome, 'ticketMedio', 'realizado')}
                  </td>
                ))}
                <td className="fechamento-column">
                  {getFechamentoValue('ticketMedio', 'realizado')}
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
              </tr>

              <tr className="header-row">
                <th className="metrics-column" style={{background: '#17515c', fontWeight: 400}}>Gap</th>
                {rondas.map((ronda, index) => (
                  <td key={index} className="ronda-column">
                    {getMetricValue(ronda.nome, 'ticketMedio', 'gap')}
                  </td>
                ))}
                <td className="fechamento-column">
                  {getFechamentoValue('ticketMedio', 'gap')}
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
