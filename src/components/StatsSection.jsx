import React, { useState, useEffect } from 'react';
import PerformanceThermometer from './PerformanceThermometer';
import { useCountUp } from '../hooks/useCountUp';
import { getThermometerMetrics } from '../service/thermometerService';
import TotalOportunidadesCard from './TotalOportunidadesCard';
import OportunidadesPerdidasCard from './OportunidadesPerdidasCard';
import OportunidadesGanhasCard from './OportunidadesGanhasCard';
import TicketMedioCard from './TicketMedioCard';
import OrcamentoNegociacaoCard from './OrcamentoNegociacaoCard';

const StatsSection = ({ statsCards, startDate, endDate, selectedFunnel, selectedUnit, selectedSeller, selectedOrigin, vendedorId = null, title = "Stats" }) => {
  const [realMetrics, setRealMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  // Buscar dados reais do Supabase
  useEffect(() => {
    console.log('⚡ StatsSection useEffect ACIONADO!');
    console.log('Props atuais:', { startDate, endDate, selectedFunnel, selectedUnit, selectedSeller, selectedOrigin, vendedorId, title });
    
    const fetchRealMetrics = async () => {
      try {
        setLoading(true);
        console.log('='.repeat(60));
        console.log(`🌡️ StatsSection (${title}): Buscando métricas reais...`);
        console.log('🔍 StatsSection: Parâmetros recebidos:');
        console.log('  - startDate:', startDate);
        console.log('  - endDate:', endDate);
        console.log('  - selectedFunnel:', selectedFunnel, 'tipo:', typeof selectedFunnel);
        console.log('  - selectedUnit:', selectedUnit);
        console.log('  - selectedSeller:', selectedSeller);
        console.log('  - selectedOrigin:', selectedOrigin);
        console.log('  - vendedorId:', vendedorId);
        console.log('  - title:', title);
        console.log('='.repeat(60));
        
        // Se vendedorId for fornecido, usar ele ao invés de selectedSeller
        // Se vendedorId for null, forçar "all" para dados gerais
        const sellerFilter = vendedorId || (vendedorId === null ? "all" : selectedSeller);
        const metrics = await getThermometerMetrics(startDate, endDate, selectedFunnel, selectedUnit, sellerFilter);
        setRealMetrics(metrics);
        
        console.log(`✅ StatsSection (${title}): Métricas carregadas:`, metrics);
        console.log('🔍 StatsSection: Primeiro card será:', metrics?.totalOportunidades);
      } catch (error) {
        console.error(`❌ StatsSection (${title}): Erro ao carregar métricas:`, error);
        setRealMetrics(null);
      } finally {
        setLoading(false);
      }
    };

    fetchRealMetrics();
  }, [startDate, endDate, selectedFunnel, selectedUnit, selectedSeller, vendedorId, title]);

  // Função para obter dados do card (APENAS dados reais)
  const getCardData = (card, index) => {
    // Se ainda está carregando ou não tem dados reais, mostrar valores zerados
    if (!realMetrics || loading) {
      return {
        ...card,
        value: "0",
        previousValue: "0",
        change: 0,
        isPositive: true,
        meta: card.meta || "100",
        metaPercentage: "0%",
        opportunityValue: "R$ 0,00"
      };
    }

    // Mapear cards para métricas reais
    const metricKeys = ['totalOportunidades', 'oportunidadesPerdidas', 'ticketMedio', 'orcamentoNegociacao', 'oportunidadesGanhas'];
    const metricKey = metricKeys[index];
    
    if (metricKey && realMetrics[metricKey]) {
      const metric = realMetrics[metricKey];
      // Tratamento especial para Ticket Médio (index 2)
      const isTicketMedio = index === 2;
      const displayValue = isTicketMedio ? 
        Math.round(metric.current).toString() : 
        metric.current.toString();
      
      return {
        ...card,
        value: displayValue,
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
      ...card,
      value: "0",
      previousValue: "0", 
      change: 0,
      isPositive: true,
      meta: card.meta || "100",
      metaPercentage: "0%",
      opportunityValue: "R$ 0,00"
    };
  };

  return (
    <section className="stats-section">
      {/* Linha superior com cinco colunas: Total Oportunidades + Oportunidades Perdidas + Ticket Médio + Orçamento em Negociação + Oportunidades Ganhas */}
      <div className="top-row-cards">
        <TotalOportunidadesCard 
          startDate={startDate}
          endDate={endDate}
          selectedFunnel={selectedFunnel}
          selectedUnit={selectedUnit}
          selectedSeller={vendedorId || (vendedorId === null ? "all" : selectedSeller)}
          selectedOrigin={selectedOrigin}
        />
        <OportunidadesPerdidasCard 
          startDate={startDate}
          endDate={endDate}
          selectedFunnel={selectedFunnel}
          selectedUnit={selectedUnit}
          selectedSeller={vendedorId || (vendedorId === null ? "all" : selectedSeller)}
          selectedOrigin={selectedOrigin}
        />
        <TicketMedioCard 
          startDate={startDate}
          endDate={endDate}
          selectedFunnel={selectedFunnel}
          selectedUnit={selectedUnit}
          selectedSeller={vendedorId || (vendedorId === null ? "all" : selectedSeller)}
          selectedOrigin={selectedOrigin}
        />
        <OrcamentoNegociacaoCard 
          startDate={startDate}
          endDate={endDate}
          selectedFunnel={selectedFunnel}
          selectedUnit={selectedUnit}
          selectedSeller={vendedorId || (vendedorId === null ? "all" : selectedSeller)}
          selectedOrigin={selectedOrigin}
        />
        <OportunidadesGanhasCard 
          startDate={startDate}
          endDate={endDate}
          selectedFunnel={selectedFunnel}
          selectedUnit={selectedUnit}
          selectedSeller={vendedorId || (vendedorId === null ? "all" : selectedSeller)}
          selectedOrigin={selectedOrigin}
          isVendedorView={vendedorId !== null}
        />
      </div>
      
      {/* Grid com os outros cards */}
      <div className="stats-grid">
        {/* Outros cards (excluindo Oportunidades Perdidas, Ticket Médio e Orçamento em Negociação) */}
        {statsCards.slice(1).filter((card, index) => {
          // Remover o card vermelho de Oportunidades Perdidas (index 1), o card roxo de Ticket Médio (index 2) e o card laranja de Orçamento em Negociação (index 3)
          const adjustedIndex = index + 1;
          return adjustedIndex !== 1 && adjustedIndex !== 2 && adjustedIndex !== 3; // Remove os cards de índice 1, 2 e 3
        }).map((card, index) => {
          // Reajustar o índice considerando que removemos três cards
          const adjustedIndex = index === 0 ? 4 : 5; // Mapear para índices 4, 5
          const cardData = getCardData(card, adjustedIndex);
          return (
            <div key={adjustedIndex} className={`stat-card ${cardData.color}`}>
              {/* Header com título e métricas */}
              <div className="stat-header-new">
                <div className="header-content">
                  <span className="stat-title">{cardData.title}</span>
                  <div className="header-metrics">
                    <div className="stat-value">
                      {(() => {
                        const count = useCountUp(parseInt(cardData.value.replace(/,/g, '')), 1500);
                        if (cardData.isCurrency) {
                          return `R$ ${count.toLocaleString()}`;
                        } else {
                          return count.toLocaleString();
                        }
                      })()}
                    </div>
                    {(cardData.isOpportunity || cardData.isCurrency) && (
                      <div className="opportunity-value">
                        {cardData.opportunityValue}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Termômetro grande no centro */}
              <div className="stat-thermometer-center">
                <PerformanceThermometer 
                  currentValue={cardData.value}
                  previousValue={cardData.previousValue}
                  change={cardData.change}
                  isPositive={cardData.isPositive}
                  color={cardData.color}
                />
              </div>
              
              {/* Meta na parte inferior */}
              <div className="stat-meta">
                <div className="meta-info">
                  <span className="meta-label">META</span>
                  <span className="meta-value">
                    {cardData.isCurrency ? `R$ ${parseInt(cardData.meta).toLocaleString()}` : cardData.meta}
                  </span>
                </div>
                <div className="meta-percentage">
                  {cardData.metaPercentage}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default StatsSection;
