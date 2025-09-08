import React, { useState, useEffect } from 'react';
import PerformanceThermometer from './PerformanceThermometer';
import { useCountUp } from '../hooks/useCountUp';
import { getTotalOportunidadesMetrics } from '../service/totalOportunidadesService';
import './TotalOportunidadesCard.css';

/**
 * 🎯 TOTAL OPORTUNIDADES CARD
 * 
 * Componente específico para exibir as duas métricas de Total de Oportunidades:
 * 1. Total de Oportunidades Abertas (status="open", sem filtro de data)
 * 2. Total de Oportunidades Novas (todos status, com filtro de data)
 */
const TotalOportunidadesCard = ({ 
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
    console.log('⚡ TotalOportunidadesCard useEffect ACIONADO!');
    console.log('Props atuais:', { startDate, endDate, selectedFunnel, selectedUnit, selectedSeller, selectedOrigin });
    
    const fetchMetrics = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log('='.repeat(60));
        console.log('🎯 TotalOportunidadesCard: Buscando métricas...');
        console.log('🔍 Parâmetros recebidos:');
        console.log('  - startDate:', startDate);
        console.log('  - endDate:', endDate);
        console.log('  - selectedFunnel:', selectedFunnel);
        console.log('  - selectedUnit:', selectedUnit);
        console.log('  - selectedSeller:', selectedSeller);
        console.log('  - selectedOrigin:', selectedOrigin);
        console.log('='.repeat(60));
        
        const data = await getTotalOportunidadesMetrics(
          startDate, 
          endDate, 
          selectedFunnel, 
          selectedUnit, 
          selectedSeller, 
          selectedOrigin
        );
        
        setMetrics(data);
        console.log('✅ TotalOportunidadesCard: Métricas carregadas:', data);
      } catch (error) {
        console.error('❌ TotalOportunidadesCard: Erro ao carregar métricas:', error);
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
        meta: "100",
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
      meta: "100",
      metaPercentage: "0%",
      opportunityValue: "R$ 0,00"
    };
  };

  // Dados das duas métricas
  const abertasData = getMetricData('totalOportunidadesAbertas');
  const novasData = getMetricData('totalOportunidadesNovas');
  
  // Calcular percentual da meta para oportunidades novas
  const calcularPercentualMeta = () => {
    if (!metrics || !metrics.totalOportunidadesNovas) return "0%";
    
    const { current, meta } = metrics.totalOportunidadesNovas;
    if (meta <= 0) return "0%";
    
    const percentual = ((current - meta) / meta) * 100;
    const sinal = percentual >= 0 ? "+" : "";
    return `${sinal}${Math.round(percentual)}%`;
  };

  // Verificar se o percentual é negativo para aplicar classe CSS
  const isPercentualNegativo = () => {
    if (!metrics || !metrics.totalOportunidadesNovas) return false;
    
    const { current, meta } = metrics.totalOportunidadesNovas;
    if (meta <= 0) return false;
    
    const percentual = ((current - meta) / meta) * 100;
    return percentual < 0;
  };

  if (error) {
    return (
      <div className="toc-total-oportunidades-card toc-error">
        <div className="toc-error-content">
          <div className="toc-error-icon">❌</div>
          <div className="toc-error-message">
            <h3>Erro ao carregar dados</h3>
            <p>{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="toc-total-oportunidades-card">
      {/* Header com título */}
      <div className="toc-card-header">
        <h2 className="toc-card-title">Total de Oportunidades</h2>
        {loading && <div className="toc-loading-spinner"></div>}
      </div>

      {/* Valores principais no canto superior direito */}
      <div className="toc-main-values">
        <div className="toc-primary-value">
          {(() => {
            const count = useCountUp(parseInt(abertasData.value.replace(/,/g, '')), 1500);
            return count.toLocaleString();
          })()} Abertas
        </div>
        <div className="toc-secondary-value">
          + {(() => {
            const count = useCountUp(parseInt(novasData.value.replace(/,/g, '')), 1500);
            return count.toLocaleString();
          })()} Novas
        </div>
      </div>

      {/* Termômetro central */}
      <div className="toc-thermometer-container">
        <PerformanceThermometer 
          currentValue={abertasData.value}
          previousValue={abertasData.previousValue}
          change={abertasData.change}
          isPositive={abertasData.isPositive}
          color="green"
          metaPercentage={metrics?.totalOportunidadesNovas?.metaPercentage}
        />
      </div>

      {/* Meta e porcentagem na parte inferior */}
      <div className="toc-meta-section">
        <div className="toc-meta-info">
          <span className="toc-meta-label">META</span>
          <span className="toc-meta-value">{novasData.meta}</span>
        </div>
        <div className={`toc-meta-percentage ${isPercentualNegativo() ? 'toc-meta-percentage-negative' : ''}`}>
          {calcularPercentualMeta()}
        </div>
      </div>
    </div>
  );
};

export default TotalOportunidadesCard;
