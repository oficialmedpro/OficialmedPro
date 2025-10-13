import React, { useState, useEffect } from 'react';
import './RFVMetricsCards.css';
// Não alterar serviço existente. Usar serviço NOVO baseado nos padrões de consulta reais
import { rfvRealService } from '../service/rfvRealService';

const RFVMetricsCards = ({
  startDate,
  endDate,
  selectedFunnel,
  selectedUnit,
  selectedSeller,
  selectedOrigin,
  isDarkMode,
  loading
}) => {
  const [metrics, setMetrics] = useState({
    totalClientes: 0,
    faturamento: 0,
    ticketMedio: 0,
    clientesAtivos: 0,
    clientesEmAtencao: 0,
    clientesNovos: 0,
    clientesEmRisco: 0
  });

  const [isLoading, setIsLoading] = useState(true);

  // Carregar dados reais do RFV
  useEffect(() => {
    const loadMetrics = async () => {
      setIsLoading(true);

      try {
        console.log('🔄 RFVMetricsCards: Carregando métricas com parâmetros:', {
          startDate, endDate, selectedFunnel, selectedUnit, selectedSeller, selectedOrigin
        });

        // Forçar nova requisição adicionando timestamp
        const timestamp = Date.now();
        console.log('⏰ RFVMetricsCards: Timestamp da requisição:', timestamp);

        // Buscar métricas RFV reais usando o novo service
        const rfvMetrics = await rfvRealService.getRFVMetrics({
          startDate,
          endDate,
          selectedFunnel,
          selectedUnit,
          selectedSeller,
          selectedOrigin
        });

        console.log('✅ RFVMetricsCards: Métricas recebidas:', rfvMetrics);
        setMetrics(rfvMetrics);
      } catch (error) {
        console.error('❌ Erro ao carregar métricas RFV:', error);

        // Sem fallback - mostrar estado vazio em caso de erro
        setMetrics({
          totalClientes: 0,
          faturamento: 0,
          ticketMedio: 0,
          clientesAtivos: 0,
          clientesNovos: 0,
          clientesEmRisco: 0
        });
      }

      setIsLoading(false);
    };

    loadMetrics();
  }, [startDate, endDate, selectedFunnel, selectedUnit, selectedSeller, selectedOrigin]);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatNumber = (value) => {
    return new Intl.NumberFormat('pt-BR').format(value);
  };

  const cards = [
    {
      title: 'Total de Clientes',
      value: formatNumber(metrics.totalClientes),
      color: 'blue',
      description: 'Clientes únicos no período'
    },
    {
      title: 'Faturamento Total',
      value: formatCurrency(metrics.faturamento),
      color: 'green',
      description: 'Receita gerada pelos clientes'
    },
    {
      title: 'Ticket Médio',
      value: formatCurrency(metrics.ticketMedio),
      color: 'purple',
      description: 'Valor médio por cliente'
    },
    {
      title: 'Clientes Ativos',
      value: formatNumber(metrics.clientesAtivos),
      color: 'cyan',
      description: 'Clientes com atividade recente'
    },
    {
      title: 'Clientes em Atenção',
      value: formatNumber(metrics.clientesEmAtencao),
      color: 'orange',
      description: '31-35 dias sem recompra (lembrete)'
    },
    {
      title: 'Clientes Novos',
      value: formatNumber(metrics.clientesNovos),
      color: 'green',
      description: 'Novos clientes no período'
    },
    {
      title: 'Clientes em Risco',
      value: formatNumber(metrics.clientesEmRisco),
      color: 'red',
      description: 'Clientes com baixa atividade'
    }
  ];

  return (
    <div className="rfv-metrics-cards">
      {cards.map((card, index) => (
        <div
          key={index}
          className={`rfv-metric-card rfv-metric-card-${card.color} ${isDarkMode ? 'dark' : 'light'}`}
        >
          <div className="rfv-metric-header">
            <div className="rfv-metric-title">{card.title}</div>
          </div>

          <div className="rfv-metric-content">
            {isLoading ? (
              <div className="rfv-metric-loading">
                <div className="rfv-loading-spinner"></div>
              </div>
            ) : (
              <>
                <div className="rfv-metric-value">{card.value}</div>
                <div className="rfv-metric-description">{card.description}</div>
              </>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default RFVMetricsCards;