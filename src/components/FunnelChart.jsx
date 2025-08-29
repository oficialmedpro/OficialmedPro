import React, { useState, useEffect } from 'react';
import './FunnelChart.css';
import { getFunilEtapas, getOportunidadesPorEtapaFunil } from '../service/supabase.js';

const FunnelChart = ({ t, title, selectedFunnel }) => {
  const [etapas, setEtapas] = useState([]);
  const [loading, setLoading] = useState(true);

  // Função para formatar números grandes
  const formatNumber = (num) => {
    if (!num || isNaN(num)) return '0';
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
    return num.toString();
  };

  // Buscar etapas dinâmicas e dados das oportunidades baseado no funil selecionado
  useEffect(() => {
    const fetchEtapasComDados = async () => {
      try {
        setLoading(true);
        
        if (!selectedFunnel || selectedFunnel === 'all') {
          // Se não há funil específico selecionado, usar dados estáticos como fallback
          setEtapas([]);
          return;
        }

        console.log('🎯 FunnelChart: Buscando etapas para o funil:', selectedFunnel);
        
        // 1. Buscar estrutura das etapas
        const etapasEstrutura = await getFunilEtapas(selectedFunnel);
        
        if (etapasEstrutura.length === 0) {
          setEtapas([]);
          return;
        }

        // 2. Buscar dados reais das oportunidades para cada etapa
        console.log('📊 FunnelChart: Buscando dados das oportunidades...');
        console.log('📊 Etapas estrutura:', etapasEstrutura);
        
        const etapasComDados = await getOportunidadesPorEtapaFunil(etapasEstrutura);
        
        console.log('✅ FunnelChart: Etapas com dados carregadas:', etapasComDados);
        setEtapas(etapasComDados);
        
      } catch (error) {
        console.error('❌ Erro ao carregar dados do funil:', error);
        setEtapas([]); // Fallback para array vazio
      } finally {
        setLoading(false);
      }
    };

    fetchEtapasComDados();
  }, [selectedFunnel]);

  if (loading) {
    return (
      <div className="main-chart">
        <div className="chart-header">
          <h3>{title || t.chartTitle}</h3>
          <span className="chart-period">{t.chartPeriod}</span>
        </div>
        <div className="fc-funnel-container">
          <div>Carregando funil...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="main-chart">
      <div className="chart-header">
        <h3>{title || t.chartTitle}</h3>
        <span className="chart-period">{t.chartPeriod}</span>
      </div>

      <div className="fc-funnel-container">
        <div className="fc-sources-bar">
          <div className="fc-source-item google">
            <span className="fc-source-label">{t.google}</span>
            <div className="fc-source-value">
              <span className="fc-source-percentage">45%</span>
              <span>/</span>
              <span className="fc-source-count">2.3k</span>
            </div>
          </div>
          <div className="fc-source-item meta">
            <span className="fc-source-label">{t.meta}</span>
            <div className="fc-source-value">
              <span className="fc-source-percentage">28%</span>
              <span>/</span>
              <span className="fc-source-count">1.4k</span>
            </div>
          </div>
          <div className="fc-source-item organic">
            <span className="fc-source-label">{t.organic}</span>
            <div className="fc-source-value">
              <span className="fc-source-percentage">15%</span>
              <span>/</span>
              <span className="fc-source-count">750</span>
            </div>
          </div>
          <div className="fc-source-item indicacao">
            <span className="fc-source-label">{t.indication}</span>
            <div className="fc-source-value">
              <span className="fc-source-percentage">8%</span>
              <span>/</span>
              <span className="fc-source-count">400</span>
            </div>
          </div>
          <div className="fc-source-item prescritor">
            <span className="fc-source-label">{t.prescriber}</span>
            <div className="fc-source-value">
              <span className="fc-source-percentage">3%</span>
              <span>/</span>
              <span className="fc-source-count">150</span>
            </div>
          </div>
          <div className="fc-source-item franquia">
            <span className="fc-source-label">{t.franchise}</span>
            <div className="fc-source-value">
              <span className="fc-source-percentage">1%</span>
              <span>/</span>
              <span className="fc-source-count">50</span>
            </div>
          </div>
        </div>

        {/* Renderizar etapas dinamicamente */}
        {etapas.length > 0 ? (
          etapas.map((etapa, index) => {
            console.log(`🎨 Renderizando etapa ${index}:`, etapa);
            return (
            <div key={etapa.id} className="fc-funnel-stage" data-stage={index}>
              <div 
                className="fc-funnel-bar" 
                style={{
                  background: `linear-gradient(135deg, ${etapa.cor_gradiente_inicio}, ${etapa.cor_gradiente_fim})`,
                  width: `${etapa.largura_percentual}%`
                }}
              >
                <div className="fc-funnel-content">
                  <span className="fc-funnel-label">{etapa.nome_etapa}</span>
                  <div className="fc-funnel-values">
                    <span className="fc-funnel-value">{formatNumber(etapa.quantidade)}</span>
                    {index > 0 && etapas[index - 1] && (
                      <span className="fc-funnel-loss">
                        -{formatNumber((etapas[index - 1].quantidade - etapa.quantidade) || 0)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              {/* Taxa de conversão - apenas se não for a última etapa */}
              {index < etapas.length - 1 && etapas[index + 1] && (
                <div className="funildash_conversion-rate-box">
                  {etapas[index + 1].taxaConversao ? `${etapas[index + 1].taxaConversao}%` : '0%'}
                </div>
              )}
            </div>
            );
          })
        ) : (
          // Fallback: mostrar mensagem se não há dados
          selectedFunnel && selectedFunnel !== 'all' ? (
            <div className="fc-no-data">
              <p>Nenhuma etapa encontrada para este funil.</p>
            </div>
          ) : (
            <div className="fc-no-data">
              <p>Selecione um funil específico para visualizar as etapas.</p>
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default FunnelChart;
