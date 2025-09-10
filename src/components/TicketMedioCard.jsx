import React, { useState, useEffect } from 'react';
import PerformanceThermometer from './PerformanceThermometer';
import { useCountUp } from '../hooks/useCountUp';
import { getTicketMedioMetrics } from '../service/ticketMedioService';
import './TicketMedioCard.css';

/**
 * 🟣 TICKET MÉDIO CARD
 * 
 * Componente específico para exibir as métricas de Ticket Médio:
 * 1. Ticket Médio do Período (valor total / quantidade total de oportunidades ganhas)
 * 2. Ticket Médio Geral (valor total / quantidade total de todas as oportunidades ganhas)
 */
const TicketMedioCard = ({ 
  startDate, 
  endDate, 
  selectedFunnel, 
  selectedUnit, 
  selectedSeller, 
  selectedOrigin 
}) => {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Buscar dados reais do Supabase
  useEffect(() => {
    console.log('⚡ TicketMedioCard useEffect ACIONADO!');
    console.log('Props atuais:', { startDate, endDate, selectedFunnel, selectedUnit, selectedSeller, selectedOrigin });
    
    const fetchMetrics = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log('='.repeat(60));
        console.log('🟣 TicketMedioCard: Buscando métricas...');
        console.log('🔍 Parâmetros recebidos:');
        console.log('  - startDate:', startDate);
        console.log('  - endDate:', endDate);
        console.log('  - selectedFunnel:', selectedFunnel, 'tipo:', typeof selectedFunnel);
        console.log('  - selectedUnit:', selectedUnit);
        console.log('  - selectedSeller:', selectedSeller);
        console.log('  - selectedOrigin:', selectedOrigin);
        console.log('='.repeat(60));
        
        const data = await getTicketMedioMetrics(
          startDate, 
          endDate, 
          selectedFunnel, 
          selectedUnit, 
          selectedSeller, 
          selectedOrigin
        );
        
        console.log('✅ TicketMedioCard: Dados recebidos:', data);
        setMetrics(data);
      } catch (err) {
        console.error('❌ TicketMedioCard: Erro ao buscar métricas:', err);
        setError(err.message || 'Erro ao carregar dados do ticket médio');
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, [startDate, endDate, selectedFunnel, selectedUnit, selectedSeller, selectedOrigin]);

  // Função para obter dados da métrica (APENAS dados reais)
  const getMetricData = (metricKey) => {
    // Se ainda está carregando ou não tem dados reais, mostrar valores zerados
    if (!metrics || loading) {
      return {
        value: "0",
        previousValue: "0",
        change: 0,
        isPositive: true,
        meta: "0",
        metaPercentage: "0%",
        opportunityValue: "R$ 0,00"
      };
    }

    if (metrics[metricKey]) {
      const metric = metrics[metricKey];
      return {
        value: metric.current.toString(),
        previousValue: metric.previous.toString(),
        change: metric.change,
        isPositive: metric.isPositive,
        meta: metric.meta.toString(),
        metaPercentage: `${Math.round((metric.current / metric.meta) * 100)}%`,
        opportunityValue: metric.value ? `R$ ${metric.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : "R$ 0,00"
      };
    }

    // Se não encontrar a métrica, retornar valores zerados  
    return {
      value: "0",
      previousValue: "0", 
      change: 0,
      isPositive: true,
      meta: "0",
      metaPercentage: "0%",
      opportunityValue: "R$ 0,00"
    };
  };

  // Dados das duas métricas
  const ticketMedioPeriodoData = getMetricData('ticketMedioPeriodo');
  const ticketMedioGeralData = getMetricData('ticketMedioGeral');
  
  // Calcular percentual da meta para ticket médio do período
  const calcularPercentualMeta = () => {
    if (!metrics || !metrics.ticketMedioPeriodo) return "0%";

    const { value, meta } = metrics.ticketMedioPeriodo;
    if (meta <= 0) return "0%";

    const percentual = ((value - meta) / meta) * 100;
    const sinal = percentual >= 0 ? "+" : "";
    const textoExplicativo = percentual > 0 ? " acima da meta" : percentual < 0 ? " abaixo da meta" : "";
    return `${sinal}${Math.round(percentual)}%${textoExplicativo}`;
  };

  // Verificar se está acima da meta (para ticket médio, acima da meta é bom - verde)
  const isAcimaDaMeta = () => {
    if (!metrics || !metrics.ticketMedioPeriodo) return false;
    
    const { value, meta } = metrics.ticketMedioPeriodo;
    if (meta <= 0) return false;
    
    return value > meta; // Para ticket médio, mais que a meta é bom (verde)
  };

  // Verificar se está abaixo da meta (para ticket médio, abaixo da meta é ruim - vermelho)
  const isAbaixoDaMeta = () => {
    if (!metrics || !metrics.ticketMedioPeriodo) return false;
    
    const { value, meta } = metrics.ticketMedioPeriodo;
    if (meta <= 0) return false;
    
    return value < meta; // Para ticket médio, menos que a meta é ruim (vermelho)
  };

  // Verificar se a taxa de conversão é positiva (verde) ou negativa (vermelho)
  const isTaxaPositiva = () => {
    if (!metrics || !metrics.ticketMedioPeriodo) return false;
    
    const { change } = metrics.ticketMedioPeriodo;
    return change >= 0; // Taxa positiva = verde, negativa = vermelho
  };

  return (
    <div className="tmc-ticket-medio-card">
      {/* Header com título */}
      <div className="tmc-card-header">
        <h2 className="tmc-card-title">Ticket<br/>Médio</h2>
        {loading && <div className="tmc-loading-spinner"></div>}
      </div>

      {/* Tratamento de erro */}
      {error && (
        <div className="tmc-error-content">
          <div className="tmc-error-icon">❌</div>
          <div className="tmc-error-message">
            <h3>Erro ao carregar dados</h3>
            <p>{error}</p>
          </div>
        </div>
      )}

      {/* Valores principais no canto superior direito */}
      <div className="tmc-main-values">
        <div className="tmc-primary-value">
          {(() => {
            const count = useCountUp(parseInt(ticketMedioPeriodoData.value.replace(/,/g, '')), 1500);
            return `R$ ${count.toLocaleString()}`;
          })()} período
        </div>
        <div className="tmc-primary-value-amount">
          {ticketMedioPeriodoData.opportunityValue}
        </div>
        <div className="tmc-secondary-value">
          {(() => {
            const count = useCountUp(parseInt(ticketMedioGeralData.value.replace(/,/g, '')), 1500);
            return `R$ ${count.toLocaleString()}`;
          })()} geral
        </div>
        <div className="tmc-secondary-value-amount">
          {ticketMedioGeralData.opportunityValue}
        </div>
      </div>

      {/* Termômetro central */}
      <div className="tmc-thermometer-container">
        <PerformanceThermometer 
          currentValue={ticketMedioPeriodoData.value}
          previousValue={ticketMedioPeriodoData.previousValue}
          change={ticketMedioPeriodoData.change}
          isPositive={isTaxaPositiva()} // Verde se taxa positiva, vermelho se negativa
          color={isTaxaPositiva() ? "green" : "red"}
          metaPercentage={metrics?.ticketMedioPeriodo?.metaPercentage ? metrics.ticketMedioPeriodo.metaPercentage : null}
        />
      </div>

      {/* Meta e porcentagem na parte inferior */}
      <div className="tmc-meta-section">
        <div className="tmc-meta-info">
          <span className="tmc-meta-label">META</span>
          <span className="tmc-meta-value">
            {ticketMedioPeriodoData.meta ? `R$ ${parseFloat(ticketMedioPeriodoData.meta).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : 'R$ 0,00'}
          </span>
        </div>
        <div className={`tmc-meta-percentage ${isAcimaDaMeta() ? 'tmc-meta-percentage-acima' : isAbaixoDaMeta() ? 'tmc-meta-percentage-abaixo' : ''}`}>
          {calcularPercentualMeta()}
        </div>
      </div>
    </div>
  );
};

export default TicketMedioCard;
