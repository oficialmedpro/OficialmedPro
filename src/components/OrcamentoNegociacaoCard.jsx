import React, { useState, useEffect } from 'react';
import { useCountUp } from '../hooks/useCountUp';
import PerformanceThermometer from './PerformanceThermometer';
import { getOrcamentoNegociacaoMetrics } from '../service/orcamentoNegociacaoService';
import './OrcamentoNegociacaoCard.css';

const OrcamentoNegociacaoCard = ({ 
  startDate, 
  endDate, 
  selectedFunnel, 
  selectedUnit, 
  selectedSeller, 
  selectedOrigin 
}) => {
  const [orcamentoNegociacaoData, setOrcamentoNegociacaoData] = useState({
    value: "0",
    opportunityValue: "R$ 0,00",
    previousValue: "0",
    change: 0,
    isPositive: true,
    meta: "0",
    metaPercentage: "0%"
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Hooks para animação dos números - sempre chamados na mesma ordem
  const primaryCount = useCountUp(parseInt(orcamentoNegociacaoData.value.replace(/,/g, '')), 1500);
  const secondaryCount = useCountUp(parseInt(orcamentoNegociacaoData.previousValue.replace(/,/g, '')), 1500);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log('🔄 OrcamentoNegociacaoCard: Buscando dados...');
        console.log('📅 Período:', startDate, 'até', endDate);
        console.log('🎯 Filtros:', { selectedFunnel, selectedUnit, selectedSeller, selectedOrigin });
        
        const data = await getOrcamentoNegociacaoMetrics(
          startDate, 
          endDate, 
          selectedFunnel, 
          selectedUnit, 
          selectedSeller, 
          selectedOrigin
        );
        
        console.log('✅ OrcamentoNegociacaoCard: Dados recebidos:', data);
        setOrcamentoNegociacaoData(data);
        
      } catch (err) {
        console.error('❌ OrcamentoNegociacaoCard: Erro ao buscar dados:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [startDate, endDate, selectedFunnel, selectedUnit, selectedSeller, selectedOrigin]);

  // Função para calcular percentual da meta
  const calcularPercentualMeta = (atual, meta) => {
    if (!meta || meta === 0) return "0%";
    const percentual = (atual / meta) * 100;
    return `${Math.round(percentual)}%`;
  };

  // Função para determinar se está acima da meta
  const isAcimaDaMeta = (atual, meta) => {
    return atual > meta;
  };

  // Função para determinar se está abaixo da meta
  const isAbaixoDaMeta = (atual, meta) => {
    return atual < meta;
  };

  // Função para determinar se a taxa é positiva (para o termômetro)
  const isTaxaPositiva = () => {
    return orcamentoNegociacaoData.change >= 0;
  };

  const valorAtual = parseFloat(orcamentoNegociacaoData.value.replace(/,/g, '')) || 0;
  const valorMeta = parseFloat(orcamentoNegociacaoData.meta.replace(/,/g, '')) || 0;
  const percentualMeta = calcularPercentualMeta(valorAtual, valorMeta);
  const acimaDaMeta = isAcimaDaMeta(valorAtual, valorMeta);
  const abaixoDaMeta = isAbaixoDaMeta(valorAtual, valorMeta);

  return (
    <div className="onc-orcamento-negociacao-card">
      <div className="onc-card-header">
        <div className="onc-card-title">Orçamento{'\n'}em Negociação</div>
        {loading && <div className="onc-loading-spinner"></div>}
      </div>

      {error ? (
        <div className="onc-error">
          <span>Erro: {error}</span>
        </div>
      ) : (
        <>
          <div className="onc-main-values">
            <div className="onc-primary-value">
              {primaryCount.toLocaleString()} total
            </div>
            <div className="onc-primary-value-amount">
              {orcamentoNegociacaoData.opportunityValue}
            </div>
            <div className="onc-secondary-value">
              {secondaryCount.toLocaleString()} anterior
            </div>
            <div className="onc-secondary-value-amount">
              R$ 0,00
            </div>
          </div>

          <div className="onc-thermometer-container">
            <PerformanceThermometer 
              currentValue={orcamentoNegociacaoData.value}
              previousValue={orcamentoNegociacaoData.previousValue}
              change={orcamentoNegociacaoData.change}
              isPositive={isTaxaPositiva()}
              color="orange"
            />
          </div>

          <div className="onc-meta-section">
            <div className="onc-meta-info">
              <span className="onc-meta-label">META</span>
              <span className="onc-meta-value">
                {orcamentoNegociacaoData.meta
                  ? `R$ ${parseFloat(orcamentoNegociacaoData.meta).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                  : 'R$ 0,00'}
              </span>
            </div>
            <div className={`onc-meta-percentage ${acimaDaMeta ? 'onc-meta-percentage-acima' : abaixoDaMeta ? 'onc-meta-percentage-abaixo' : ''}`}>
              {percentualMeta}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default OrcamentoNegociacaoCard;
