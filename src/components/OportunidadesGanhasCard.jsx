import React, { useState, useEffect } from 'react';
import PerformanceThermometer from './PerformanceThermometer';
import { useCountUp } from '../hooks/useCountUp';
import { getOportunidadesGanhasMetrics } from '../service/oportunidadesGanhasService';
import './OportunidadesGanhasCard.css';

/**
 * 🟢 OPORTUNIDADES GANHAS CARD
 * 
 * Componente específico para exibir as duas métricas de Oportunidades Ganhas:
 * 1. Total de Oportunidades Ganhas (gain_date=hoje, status="gain")
 * 2. Ganhas Novas (create_date no período, status="gain")
 */
const OportunidadesGanhasCard = ({ 
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
    console.log('⚡ OportunidadesGanhasCard useEffect ACIONADO!');
    console.log('Props atuais:', { startDate, endDate, selectedFunnel, selectedUnit, selectedSeller, selectedOrigin });
    
    const fetchMetrics = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log('='.repeat(60));
        console.log('🟢 OportunidadesGanhasCard: Buscando métricas...');
        console.log('🔍 Parâmetros recebidos:');
        console.log('  - startDate:', startDate);
        console.log('  - endDate:', endDate);
        console.log('  - selectedFunnel:', selectedFunnel, 'tipo:', typeof selectedFunnel);
        console.log('  - selectedUnit:', selectedUnit);
        console.log('  - selectedSeller:', selectedSeller);
        console.log('  - selectedOrigin:', selectedOrigin);
        console.log('='.repeat(60));
        
        const data = await getOportunidadesGanhasMetrics(
          startDate, 
          endDate, 
          selectedFunnel, 
          selectedUnit, 
          selectedSeller, 
          selectedOrigin
        );
        
        setMetrics(data);
        console.log('✅ OportunidadesGanhasCard: Métricas carregadas:', data);
      } catch (error) {
        console.error('❌ OportunidadesGanhasCard: Erro ao carregar métricas:', error);
        setError(error.message);
        setMetrics(null);
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
        meta: "50",
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
      meta: "50",
      metaPercentage: "0%",
      opportunityValue: "R$ 0,00"
    };
  };

  // Dados das duas métricas
  const ganhasTotalData = getMetricData('totalOportunidadesGanhas');
  const ganhasNovasData = getMetricData('ganhasNovas');
  
  // Calcular percentual da meta para total de ganhas
  const calcularPercentualMeta = () => {
    if (!metrics || !metrics.totalOportunidadesGanhas) return "0%";
    
    const { current, meta } = metrics.totalOportunidadesGanhas;
    if (meta <= 0) return "0%";
    
    const percentual = ((current - meta) / meta) * 100;
    const sinal = percentual >= 0 ? "+" : "";
    const textoExplicativo = percentual > 0 ? " ganhas a mais" : percentual < 0 ? " ganhas a menos" : "";
    return `${sinal}${Math.round(percentual)}%${textoExplicativo}`;
  };

  // Verificar se está acima da meta (para ganhas, acima da meta é bom - verde)
  const isAcimaDaMeta = () => {
    if (!metrics || !metrics.totalOportunidadesGanhas) return false;
    
    const { current, meta } = metrics.totalOportunidadesGanhas;
    if (meta <= 0) return false;
    
    const percentual = ((current - meta) / meta) * 100;
    return percentual > 0; // Para ganhas, mais que a meta é bom (verde)
  };

  // Verificar se está abaixo da meta (para ganhas, abaixo da meta é ruim - vermelho)
  const isAbaixoDaMeta = () => {
    if (!metrics || !metrics.totalOportunidadesGanhas) return false;
    
    const { current, meta } = metrics.totalOportunidadesGanhas;
    if (meta <= 0) return false;
    
    const percentual = ((current - meta) / meta) * 100;
    return percentual < 0; // Para ganhas, menos que a meta é ruim (vermelho)
  };

  return (
    <div className="ogc-oportunidades-ganhas-card">
      {/* Header com título */}
      <div className="ogc-card-header">
        <h2 className="ogc-card-title">Oportunidades Ganhas</h2>
        {loading && <div className="ogc-loading-spinner"></div>}
      </div>

      {/* Tratamento de erro */}
      {error && (
        <div className="ogc-error-content">
          <div className="ogc-error-icon">❌</div>
          <div className="ogc-error-message">
            <h3>Erro ao carregar dados</h3>
            <p>{error}</p>
          </div>
        </div>
      )}

      {/* Valores principais no canto superior direito */}
      <div className="ogc-main-values">
        <div className="ogc-primary-value">
          {(() => {
            const count = useCountUp(parseInt(ganhasTotalData.value.replace(/,/g, '')), 1500);
            return count.toLocaleString();
          })()} Total
        </div>
        <div className="ogc-secondary-value">
          {(() => {
            const count = useCountUp(parseInt(ganhasNovasData.value.replace(/,/g, '')), 1500);
            return count.toLocaleString();
          })()} Novas
        </div>
      </div>

      {/* Termômetro central */}
      <div className="ogc-thermometer-container">
        <PerformanceThermometer 
          currentValue={ganhasTotalData.value}
          previousValue={ganhasTotalData.previousValue}
          change={ganhasTotalData.change}
          isPositive={isAcimaDaMeta()} // Para ganhas, acima da meta é positivo (verde)
          color="green"
          metaPercentage={metrics?.totalOportunidadesGanhas?.metaPercentage ? metrics.totalOportunidadesGanhas.metaPercentage : null}
        />
      </div>

      {/* Meta e porcentagem na parte inferior */}
      <div className="ogc-meta-section">
        <div className="ogc-meta-info">
          <span className="ogc-meta-label">META</span>
          <span className="ogc-meta-value">{ganhasTotalData.meta}</span>
        </div>
        <div className={`ogc-meta-percentage ${isAcimaDaMeta() ? 'ogc-meta-percentage-acima' : isAbaixoDaMeta() ? 'ogc-meta-percentage-abaixo' : ''}`}>
          {calcularPercentualMeta()}
        </div>
      </div>
    </div>
  );
};

export default OportunidadesGanhasCard;
