import React, { useState, useEffect } from 'react';
import PerformanceThermometer from './PerformanceThermometer';
import { useCountUp } from '../hooks/useCountUp';
import { getOportunidadesPerdidasMetrics } from '../service/oportunidadesPerdidasService';
import './OportunidadesPerdidasCard.css';

/**
 * 🔴 OPORTUNIDADES PERDIDAS CARD
 * 
 * Componente específico para exibir as duas métricas de Oportunidades Perdidas:
 * 1. Total de Oportunidades Perdidas (lost_date=hoje, status="lost")
 * 2. Perdas Novas (create_date no período, status="lost")
 */
const OportunidadesPerdidasCard = ({ 
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
    console.log('⚡ OportunidadesPerdidasCard useEffect ACIONADO!');
    console.log('Props atuais:', { startDate, endDate, selectedFunnel, selectedUnit, selectedSeller, selectedOrigin });
    
    const fetchMetrics = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log('='.repeat(60));
        console.log('🔴 OportunidadesPerdidasCard: Buscando métricas...');
        console.log('🔍 Parâmetros recebidos:');
        console.log('  - startDate:', startDate);
        console.log('  - endDate:', endDate);
        console.log('  - selectedFunnel:', selectedFunnel, 'tipo:', typeof selectedFunnel);
        console.log('  - selectedUnit:', selectedUnit);
        console.log('  - selectedSeller:', selectedSeller);
        console.log('  - selectedOrigin:', selectedOrigin);
        console.log('='.repeat(60));
        
        const data = await getOportunidadesPerdidasMetrics(
          startDate, 
          endDate, 
          selectedFunnel, 
          selectedUnit, 
          selectedSeller, 
          selectedOrigin
        );
        
        setMetrics(data);
        console.log('✅ OportunidadesPerdidasCard: Métricas carregadas:', data);
      } catch (error) {
        console.error('❌ OportunidadesPerdidasCard: Erro ao carregar métricas:', error);
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
  const perdidasTotalData = getMetricData('totalOportunidadesPerdidas');
  const perdasNovasData = getMetricData('perdasNovas');
  
  // Calcular percentual da meta para total de perdas
  const calcularPercentualMeta = () => {
    if (!metrics || !metrics.totalOportunidadesPerdidas) return "0%";
    
    const { current, meta } = metrics.totalOportunidadesPerdidas;
    if (meta <= 0) return "0%";
    
    const percentual = ((current - meta) / meta) * 100;
    const sinal = percentual >= 0 ? "+" : "";
    const textoExplicativo = percentual < 0 ? " perdas a menos" : percentual > 0 ? " perdas a mais" : "";
    return `${sinal}${Math.round(percentual)}%${textoExplicativo}`;
  };

  // Verificar se está acima da meta (para perdas, acima da meta é ruim - vermelho)
  const isAcimaDaMeta = () => {
    if (!metrics || !metrics.totalOportunidadesPerdidas) return false;
    
    const { current, meta } = metrics.totalOportunidadesPerdidas;
    if (meta <= 0) return false;
    
    const percentual = ((current - meta) / meta) * 100;
    return percentual > 0; // Para perdas, mais que a meta é ruim (vermelho)
  };

  // Verificar se está abaixo da meta (para perdas, abaixo da meta é bom - verde)
  const isAbaixoDaMeta = () => {
    if (!metrics || !metrics.totalOportunidadesPerdidas) return false;
    
    const { current, meta } = metrics.totalOportunidadesPerdidas;
    if (meta <= 0) return false;
    
    const percentual = ((current - meta) / meta) * 100;
    return percentual < 0; // Para perdas, menos que a meta é bom (verde)
  };

  return (
    <div className="opc-oportunidades-perdidas-card">
      {/* Header com título */}
      <div className="opc-card-header">
        <h2 className="opc-card-title">Oportunidades Perdidas</h2>
        {loading && <div className="opc-loading-spinner"></div>}
      </div>

      {/* Tratamento de erro */}
      {error && (
        <div className="opc-error-content">
          <div className="opc-error-icon">❌</div>
          <div className="opc-error-message">
            <h3>Erro ao carregar dados</h3>
            <p>{error}</p>
          </div>
        </div>
      )}

      {/* Valores principais no canto superior direito */}
      <div className="opc-main-values">
        <div className="opc-primary-value">
          {(() => {
            const count = useCountUp(parseInt(perdidasTotalData.value.replace(/,/g, '')), 1500);
            return count.toLocaleString();
          })()} total
        </div>
        <div className="opc-primary-value-amount">
          {perdidasTotalData.opportunityValue}
        </div>
        <div className="opc-secondary-value">
          {(() => {
            const count = useCountUp(parseInt(perdasNovasData.value.replace(/,/g, '')), 1500);
            return count.toLocaleString();
          })()} Novas
        </div>
        <div className="opc-secondary-value-amount">
          {perdasNovasData.opportunityValue}
        </div>
      </div>

      {/* Termômetro central */}
      <div className="opc-thermometer-container">
        <PerformanceThermometer 
          currentValue={perdidasTotalData.value}
          previousValue={perdidasTotalData.previousValue}
          change={perdidasTotalData.change}
          isPositive={isAbaixoDaMeta()} // Para perdas, abaixo da meta é positivo (verde)
          color="red"
          metaPercentage={metrics?.totalOportunidadesPerdidas?.metaPercentage ? -metrics.totalOportunidadesPerdidas.metaPercentage : null}
        />
      </div>

      {/* Meta e porcentagem na parte inferior */}
      <div className="opc-meta-section">
        <div className="opc-meta-info">
          <span className="opc-meta-label">META</span>
          <span className="opc-meta-value">{perdidasTotalData.meta}</span>
        </div>
        <div className={`opc-meta-percentage ${isAcimaDaMeta() ? 'opc-meta-percentage-acima' : isAbaixoDaMeta() ? 'opc-meta-percentage-abaixo' : ''}`}>
          {calcularPercentualMeta()}
        </div>
      </div>
    </div>
  );
};

export default OportunidadesPerdidasCard;