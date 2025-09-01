import React, { useState, useEffect } from 'react';
import './FunnelChart.css';
import { getFunilEtapas, getOportunidadesPorEtapaFunil } from '../service/supabase.js';

const FunnelChart = ({ t, title, selectedFunnel, startDate, endDate, selectedPeriod }) => {
  const [etapas, setEtapas] = useState([]);
  const [conversaoGeral, setConversaoGeral] = useState(null);
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
        
        console.log('🔍 FunnelChart INÍCIO:', { selectedFunnel, startDate, endDate, selectedPeriod });
        
        if (!selectedFunnel || selectedFunnel === 'all') {
          // Se não há funil específico selecionado, usar dados estáticos como fallback
          console.log('⚠️ FunnelChart: Sem funil específico selecionado');
          setEtapas([]);
          return;
        }

        console.log('🎯 FunnelChart: Buscando etapas para o funil:', selectedFunnel);
        console.log('📅 FunnelChart: Datas recebidas:', { startDate, endDate, tipoStart: typeof startDate, tipoEnd: typeof endDate });
        
        // 1. Buscar estrutura das etapas
        const etapasEstrutura = await getFunilEtapas(selectedFunnel);
        
        if (etapasEstrutura.length === 0) {
          setEtapas([]);
          return;
        }

        // 2. Buscar dados reais das oportunidades para cada etapa
        console.log('📊 FunnelChart: Buscando dados das oportunidades...');
        console.log('📊 Etapas estrutura:', etapasEstrutura);
        console.log('📅 FunnelChart: Período selecionado:', { startDate, endDate, selectedPeriod });
        
        // Fallback para datas se não estiverem definidas
        let dataInicio = startDate;
        let dataFim = endDate;
        
        if (!dataInicio || !dataFim) {
          const hoje = new Date().toISOString().split('T')[0];
          dataInicio = hoje;
          dataFim = hoje;
          console.log('⚠️ FunnelChart: Usando datas fallback (hoje):', { dataInicio, dataFim });
        }
        
        const dadosCompletos = await getOportunidadesPorEtapaFunil(etapasEstrutura, dataInicio, dataFim, selectedFunnel);
        
        console.log('✅ FunnelChart: Dados completos carregados:', dadosCompletos);
        setEtapas(dadosCompletos.etapas);
        setConversaoGeral(dadosCompletos.conversaoGeral);
        
      } catch (error) {
        console.error('❌ Erro ao carregar dados do funil:', error);
        setEtapas([]); // Fallback para array vazio
      } finally {
        setLoading(false);
      }
    };

    fetchEtapasComDados();
  }, [selectedFunnel, startDate, endDate]);

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
        {/* Sources Bar - só aparece quando há etapas carregadas */}
        {etapas.length > 0 && (
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
        )}

        {/* Renderizar etapas dinamicamente */}
        {etapas.length > 0 ? (
          etapas.map((etapa, index) => {
            console.log(`🎨 Renderizando etapa ${index}:`, etapa);
            console.log(`📊 Dados da etapa ${index}:`, {
              nome: etapa.nome_etapa,
              ativas: etapa.ativas,
              criadasPeriodo: etapa.criadasPeriodo,
              perdidasPeriodo: etapa.perdidasPeriodo,
              passaramPorEtapa: etapa.passaramPorEtapa,
              taxaPassagem: etapa.taxaPassagem
            });
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
                    {/* 🎯 DESTAQUE: Oportunidades ativas (número laranja do CRM) */}
                    <span className="fc-funnel-value fc-funnel-active">{formatNumber(etapa.ativas || 0)}</span>
                  </div>
                  {/* 🎯 CONTAINER DOS BADGES - LADO A LADO NO CANTO DIREITO */}
                  <div className="fc-funnel-badges-container">
                    {/* BADGE AZUL - PASSARAM POR ESTA ETAPA */}
                    <div className="fc-funnel-passed-through">
                      {formatNumber(etapa.passaramPorEtapa || 0)}
                    </div>
                    {/* BADGE VERDE - CRIADAS */}
                    {etapa.criadasPeriodo > 0 && (
                      <div className="fc-funnel-created-today">
                        +{formatNumber(etapa.criadasPeriodo)}
                      </div>
                    )}
                    {/* BADGE VERMELHO - PERDIDAS - SEMPRE MOSTRAR SE HOUVER DADOS */}
                    {etapa.perdidasPeriodo > 0 && (
                      <div className="fc-funnel-lost-today">
                        -{formatNumber(etapa.perdidasPeriodo)}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              {/* Taxa de passagem - apenas se não for a última etapa */}
              {index < etapas.length - 1 && (
                <div className="funildash_conversion-rate-box">
                  {etapas[index + 1]?.taxaPassagem !== null ? `${etapas[index + 1].taxaPassagem}%` : '0%'}
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

        {/* 🎯 SEÇÃO DE CONVERSÃO GERAL DO FUNIL - só aparece quando há etapas carregadas */}
        {etapas.length > 0 && conversaoGeral && (
          <div className="fc-conversao-geral">
            <h4 className="fc-conversao-titulo">CONVERSÃO GERAL DO FUNIL</h4>
            <div className="fc-conversao-metricas">
              <div className="fc-conversao-linha">
                <span className="fc-conversao-item">
                  📊 <strong>Criadas:</strong> {formatNumber(conversaoGeral.totalCriadas)}
                </span>
                <span className="fc-conversao-item">
                  ✅ <strong>Fechadas:</strong> {formatNumber(conversaoGeral.totalFechadas)}
                </span>
                <span className="fc-conversao-item">
                  📈 <strong>Taxa:</strong> {conversaoGeral.taxaConversao.toFixed(2)}%
                </span>
              </div>
              <div className="fc-conversao-linha">
                <span className="fc-conversao-item">
                  💰 <strong>Valor Total:</strong> R$ {conversaoGeral.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
                <span className="fc-conversao-item">
                  💎 <strong>Ticket Médio:</strong> R$ {conversaoGeral.ticketMedio.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FunnelChart;
