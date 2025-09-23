import React, { useState, useEffect } from 'react';
import './MatrizRFVComponent.css';
// Usar service novo para dados reais, mantendo o antigo como fallback interno
import { rfvRealService } from '../service/rfvRealService';
import RFVOpportunitiesCard from './RFVOpportunitiesCard';
import { rfvService } from '../service/rfvService';

const MatrizRFVComponent = ({
  startDate,
  endDate,
  selectedFunnel,
  selectedUnit,
  selectedSeller,
  selectedOrigin,
  isDarkMode
}) => {
  const [rfvData, setRfvData] = useState([]);
  const [distributionData, setDistributionData] = useState(null);
  const [matrixData, setMatrixData] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSegment, setSelectedSegment] = useState('all');
  const [dataSource, setDataSource] = useState(null);
  const [selectedSegmentForDetails, setSelectedSegmentForDetails] = useState(null);

  // Funções auxiliares para mapear segmentos
  const getNomeSegmento = (segmento) => {
    const nomes = {
      'campeoes': 'Campeões',
      'clientes_fieis': 'Clientes fiéis',
      'potenciais_fieis': 'Potenciais fiéis',
      'promissores': 'Promissores',
      'clientes_recentes': 'Clientes recentes',
      'em_risco': 'Em risco',
      'precisam_atencao': 'Precisam de atenção',
      'prestes_hibernar': 'Prestes a hibernar',
      'hibernando': 'Hibernando',
      'perdidos': 'Perdidos',
      'nao_posso_perder': 'Não posso perder',
      'novos_valiosos': 'Novos valiosos',
      'recencia_alta_valor_alto': 'Recência alta, valor alto',
      'outros': 'Outros'
    };
    return nomes[segmento] || 'Outros';
  };

  const getCorSegmento = (segmento) => {
    const cores = {
      'campeoes': '#9333EA', // Roxo
      'clientes_fieis': '#7C2D12', // Marrom
      'potenciais_fieis': '#8B5CF6', // Roxo claro
      'promissores': '#06B6D4', // Ciano
      'clientes_recentes': '#10B981', // Verde
      'em_risco': '#DC2626', // Vermelho
      'precisam_atencao': '#F59E0B', // Amarelo
      'prestes_hibernar': '#1E40AF', // Azul escuro
      'hibernando': '#6B7280', // Cinza
      'perdidos': '#374151', // Cinza escuro
      'nao_posso_perder': '#B91C1C', // Vermelho escuro
      'novos_valiosos': '#059669', // Verde escuro
      'recencia_alta_valor_alto': '#7C3AED', // Roxo médio
      'outros': '#6B7280' // Cinza
    };
    return cores[segmento] || '#6B7280';
  };

  // Matriz RFV 5x5 com dados realistas e únicos
  const rfvMatrix = [
    // Linha 5 (R=5, Recência Alta)
    [
      { r: 5, f: 1, v: 1, name: 'Novos', color: '#3B82F6', percentage: 0.8 },
      { r: 5, f: 2, v: 2, name: 'Potenciais', color: '#6366F1', percentage: 4.2 },
      { r: 5, f: 3, v: 3, name: 'Potenciais fiéis', color: '#8B5CF6', percentage: 7.8 },
      { r: 5, f: 4, v: 4, name: 'Potenciais fiéis', color: '#A855F7', percentage: 6.1 },
      { r: 5, f: 5, v: 5, name: 'Campeões', color: '#9333EA', percentage: 11.84 }
    ],
    // Linha 4 (R=4, Recência Boa)
    [
      { r: 4, f: 1, v: 1, name: 'Promissores', color: '#06B6D4', percentage: 3.61 },
      { r: 4, f: 2, v: 2, name: 'Precisam atenção', color: '#DC2626', percentage: 1.63 },
      { r: 4, f: 3, v: 3, name: 'Leais emergentes', color: '#7C3AED', percentage: 8.4 },
      { r: 4, f: 4, v: 4, name: 'Quase fiéis', color: '#9333EA', percentage: 12.2 },
      { r: 4, f: 5, v: 5, name: 'Clientes fiéis', color: '#7C2D12', percentage: 19.35 }
    ],
    // Linha 3 (R=3, Recência Média)
    [
      { r: 3, f: 1, v: 1, name: 'Clientes recentes', color: '#10B981', percentage: 5.10 },
      { r: 3, f: 2, v: 2, name: 'Prestes a hibernar', color: '#1E40AF', percentage: 2.27 },
      { r: 3, f: 3, v: 3, name: 'Requer atenção', color: '#F59E0B', percentage: 6.7 },
      { r: 3, f: 4, v: 4, name: 'Valiosos', color: '#7C3AED', percentage: 9.3 },
      { r: 3, f: 5, v: 5, name: 'Não pode perder', color: '#B91C1C', percentage: 8.9 }
    ],
    // Linha 2 (R=2, Recência Baixa)
    [
      { r: 2, f: 1, v: 1, name: 'Hibernando', color: '#0EA5E9', percentage: 4.2 },
      { r: 2, f: 2, v: 2, name: 'Hibernando', color: '#0284C7', percentage: 3.8 },
      { r: 2, f: 3, v: 3, name: 'Em risco', color: '#0369A1', percentage: 2.9 },
      { r: 2, f: 4, v: 4, name: 'Em risco alto', color: '#075985', percentage: 2.1 },
      { r: 2, f: 5, v: 5, name: 'Críticos', color: '#0C4A6E', percentage: 1.8 }
    ],
    // Linha 1 (R=1, Recência Muito Baixa)
    [
      { r: 1, f: 1, v: 1, name: 'Perdidos', color: '#0284C7', percentage: 8.4 },
      { r: 1, f: 2, v: 2, name: 'Perdidos', color: '#0369A1', percentage: 4.2 },
      { r: 1, f: 3, v: 3, name: 'Perdidos valiosos', color: '#075985', percentage: 2.8 },
      { r: 1, f: 4, v: 4, name: 'Perdidos críticos', color: '#0C4A6E', percentage: 1.2 },
      { r: 1, f: 5, v: 5, name: 'Perdidos VIP', color: '#082F49', percentage: 0.6 }
    ]
  ];

  // Carregar dados RFV reais
  useEffect(() => {
    const loadRFVData = async () => {
      setIsLoading(true);
      console.log('🔄 MatrizRFVComponent: Carregando dados reais...');

      try {
        // Tentar dados reais primeiro
        let analysis;
        try {
          analysis = await rfvRealService.getRFVAnalysis({
            startDate,
            endDate,
            selectedFunnel,
            selectedUnit,
            selectedSeller,
            selectedOrigin
          });
        } catch (e) {
          console.warn('⚠️ RFV real falhou, usando fallback simulado:', e.message);
          analysis = await rfvService.getRFVAnalysis({
            startDate,
            endDate,
            selectedFunnel,
            selectedUnit,
            selectedSeller,
            selectedOrigin
          });
        }

        // Processar dados para o treemap
        const segmentosMap = new Map();
        
        // Agrupar clientes por segmento
        analysis.clientes.forEach(cliente => {
          const segmento = cliente.segmento || 'outros';
          if (!segmentosMap.has(segmento)) {
            segmentosMap.set(segmento, {
              id: segmento,
              nome: getNomeSegmento(segmento),
              clientes: 0,
              valorTotal: 0,
              percentual: 0,
              cor: getCorSegmento(segmento)
            });
          }
          const segmentoData = segmentosMap.get(segmento);
          segmentoData.clientes += 1;
          segmentoData.valorTotal += cliente.totalValor || 0;
        });

        // Calcular percentuais
        const totalClientes = analysis.clientes.length;
        const segmentosData = Array.from(segmentosMap.values()).map(seg => ({
          ...seg,
          percentual: totalClientes > 0 ? (seg.clientes / totalClientes * 100).toFixed(2) : 0
        }));

        setRfvData(segmentosData);
        setDistributionData(analysis.distributionData);
        setMatrixData(analysis.matrixData);
        setDataSource(analysis.dataSource);

        console.log('📊 Dados RFV reais carregados:', segmentosData);
        console.log('📋 Fonte dos dados:', analysis.dataSource?.message);
      } catch (error) {
        console.error('Erro ao carregar dados RFV:', error);

        // Fallback para dados simulados em caso de erro
        const fallbackData = [];
        setRfvData(fallbackData);
        setDistributionData({
          recencia: [
            { score: 1, count: 20, label: 'R1' },
            { score: 2, count: 40, label: 'R2' },
            { score: 3, count: 62, label: 'R3' },
            { score: 4, count: 245, label: 'R4' },
            { score: 5, count: 768, label: 'R5' }
          ],
          frequencia: [
            { score: 1, count: 214, label: 'F1' },
            { score: 2, count: 223, label: 'F2' },
            { score: 3, count: 445, label: 'F3' },
            { score: 4, count: 198, label: 'F4' },
            { score: 5, count: 55, label: 'F5' }
          ],
          valor: [
            { score: 1, count: 207, label: 'V1' },
            { score: 2, count: 164, label: 'V2' },
            { score: 3, count: 311, label: 'V3' },
            { score: 4, count: 201, label: 'V4' },
            { score: 5, count: 252, label: 'V5' }
          ]
        });
        setMatrixData({
          'Clientes fiéis': { percentual: '19.35', clientes: 273 },
          'Campeões': { percentual: '11.84', clientes: 167 },
          'Hibernando': { percentual: '11.84', clientes: 167 },
          'Valiosos': { percentual: '9.3', clientes: 131 },
          'Não pode perder': { percentual: '8.9', clientes: 126 },
          'Potenciais fiéis': { percentual: '7.8', clientes: 110 }
        });
      }

      setIsLoading(false);
    };

    loadRFVData();
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


  // Função para lidar com clique no segmento
  const handleSegmentClick = (segmento) => {
    setSelectedSegmentForDetails(segmento);
  };

  const getSegmentDescription = (segment) => {
    const descriptions = {
      'champions': 'Seus melhores clientes! Compram frequentemente e gastam muito.',
      'loyal': 'Clientes fiéis que compram regularmente.',
      'potential': 'Clientes com potencial para se tornarem leais.',
      'new': 'Novos clientes com alto valor inicial.',
      'promising': 'Novos clientes com bom potencial.',
      'need_attention': 'Bons clientes que não compram há um tempo.',
      'about_to_sleep': 'Clientes em risco de se tornarem inativos.',
      'at_risk': 'Clientes valiosos que podem estar indo embora.',
      'cannot_lose': 'Seus melhores clientes que estão se tornando inativos.',
      'hibernating': 'Clientes inativos de alto valor.'
    };
    return descriptions[segment.id] || 'Segmento de clientes RFV';
  };

  const getRecommendation = (segment) => {
    const recommendations = {
      'champions': 'Recompense-os! Ofereça produtos premium e programas VIP.',
      'loyal': 'Mantenha o relacionamento com ofertas exclusivas.',
      'potential': 'Crie campanhas para aumentar a frequência de compra.',
      'new': 'Desenvolva programa de onboarding personalizado.',
      'promising': 'Eduque sobre outros produtos e benefícios.',
      'need_attention': 'Campanhas de reativação com desconto limitado.',
      'about_to_sleep': 'Ofertas especiais para manter o engajamento.',
      'at_risk': 'Campanhas urgentes de retenção personalizadas.',
      'cannot_lose': 'Estratégia VIP de reconquista imediata.',
      'hibernating': 'Campanhas de winback com ofertas irresistíveis.'
    };
    return recommendations[segment.id] || 'Desenvolva estratégia específica para este segmento.';
  };

  const totalCustomers = rfvData.reduce((sum, segment) => sum + (segment.clientes || 0), 0);
  const totalRevenue = rfvData.reduce((sum, segment) => sum + (segment.faturamento || 0), 0);

  const filteredData = selectedSegment === 'all'
    ? rfvData
    : rfvData.filter(segment => segment.id === selectedSegment);

  return (
    <div className="matriz-rfv-component">
      {/* Header */}
      <div className="rfv-header">
        <div className="rfv-title-section">
          <h2 className="rfv-section-title">CLASSIFICAÇÃO DE CLIENTES - RFV</h2>
          <p className="rfv-section-subtitle">Desenvolvido por: Vitória Vicente</p>

          {/* Indicador de fonte dos dados */}
          {dataSource && (
            <div
              className={`data-source-indicator ${dataSource.isReal ? 'real-data' : 'simulated-data'}`}
              style={{
                marginTop: '8px',
                padding: '6px 12px',
                borderRadius: '12px',
                fontSize: '12px',
                fontWeight: '500',
                backgroundColor: 'rgb(15 23 42)',
                color: 'rgb(176 176 176)',
                border: '1px solid rgb(15 23 42)',
                display: 'inline-block'
              }}
            >
              {dataSource.message}
            </div>
          )}
        </div>
      </div>

      {/* Top Cards */}
      <div className="rfv-top-cards">
        <div className="rfv-card">
          <div className="rfv-card-header">CLIENTES POR RECÊNCIA</div>
          <div className="rfv-chart-bars">
            {isLoading ? (
              <div style={{textAlign: 'center', padding: '60px 0', color: 'var(--text-secondary)'}}>
                Carregando...
              </div>
            ) : (
              distributionData?.recencia?.map((item, index) => {
                const maxCount = Math.max(...(distributionData.recencia.map(r => r.count) || [1]));
                const height = Math.max(20, (item.count / maxCount) * 180);

                return (
                  <div key={index} className="bar-group">
                    <div className="bar" style={{height: `${height}px`, backgroundColor: '#f59e0b'}}>
                      <span>{item.count || 0}</span>
                    </div>
                    <div className="bar-label">{item.label}</div>
                  </div>
                );
              })
            )}
          </div>
          <div className="rfv-card-divider pink"></div>
        </div>

        <div className="rfv-card">
          <div className="rfv-card-header">CLIENTES POR FREQUÊNCIA</div>
          <div className="rfv-chart-bars">
            {isLoading ? (
              <div style={{textAlign: 'center', padding: '60px 0', color: 'var(--text-secondary)'}}>
                Carregando...
              </div>
            ) : (
              distributionData?.frequencia?.map((item, index) => {
                const maxCount = Math.max(...(distributionData.frequencia.map(f => f.count) || [1]));
                const height = Math.max(20, (item.count / maxCount) * 180);

                return (
                  <div key={index} className="bar-group">
                    <div className="bar" style={{height: `${height}px`, backgroundColor: '#ec4899'}}>
                      <span>{item.count || 0}</span>
                    </div>
                    <div className="bar-label">{item.label}</div>
                  </div>
                );
              })
            )}
          </div>
          <div className="rfv-card-divider pink"></div>
        </div>

        <div className="rfv-card">
          <div className="rfv-card-header">CLIENTES POR VALOR</div>
          <div className="rfv-chart-bars">
            {isLoading ? (
              <div style={{textAlign: 'center', padding: '60px 0', color: 'var(--text-secondary)'}}>
                Carregando...
              </div>
            ) : (
              distributionData?.valor?.map((item, index) => {
                const maxCount = Math.max(...(distributionData.valor.map(v => v.count) || [1]));
                const height = Math.max(20, (item.count / maxCount) * 180);
                const valorFormatado = formatCurrency(item.valorTotal || 0);

                return (
                  <div key={index} className="bar-group">
                    <div className="bar" style={{height: `${height}px`, backgroundColor: '#06b6d4'}}>
                      <span className="bar-count">{item.count || 0}</span>
                      <span className="bar-value">{valorFormatado}</span>
                    </div>
                    <div className="bar-label">{item.label}</div>
                  </div>
                );
              })
            )}
          </div>
          <div className="rfv-card-divider cyan"></div>
        </div>
      </div>

      {/* Legenda Explicativa */}
      <div className="rfv-legend-section">
        <h3 className="rfv-legend-title">📋 Legenda RFV - Como Interpretar os Dados</h3>
        
        <div className="rfv-legend-grid">
          {/* Recência */}
          <div className="rfv-legend-card">
            <div className="rfv-legend-header">
              <div className="rfv-legend-color orange"></div>
              <h4>RECÊNCIA (R)</h4>
            </div>
            <div className="rfv-legend-content">
              <div className="rfv-legend-item">
                <span className="legend-label">R1:</span>
                <span className="legend-desc">Clientes que compraram muito recentemente (0-30 dias)</span>
              </div>
              <div className="rfv-legend-item">
                <span className="legend-label">R2:</span>
                <span className="legend-desc">Clientes que compraram recentemente (31-60 dias)</span>
              </div>
              <div className="rfv-legend-item">
                <span className="legend-label">R3:</span>
                <span className="legend-desc">Clientes que compraram há um tempo (61-90 dias)</span>
              </div>
              <div className="rfv-legend-item">
                <span className="legend-label">R4:</span>
                <span className="legend-desc">Clientes que compraram há bastante tempo (91-120 dias)</span>
              </div>
              <div className="rfv-legend-item">
                <span className="legend-label">R5:</span>
                <span className="legend-desc">Clientes que compraram há muito tempo (120+ dias)</span>
              </div>
            </div>
          </div>

          {/* Frequência */}
          <div className="rfv-legend-card">
            <div className="rfv-legend-header">
              <div className="rfv-legend-color pink"></div>
              <h4>FREQUÊNCIA (F)</h4>
            </div>
            <div className="rfv-legend-content">
              <div className="rfv-legend-item">
                <span className="legend-label">F1:</span>
                <span className="legend-desc">Clientes que compraram apenas 1 vez (novos/esporádicos)</span>
              </div>
              <div className="rfv-legend-item">
                <span className="legend-label">F2:</span>
                <span className="legend-desc">Clientes que compraram 2 vezes</span>
              </div>
              <div className="rfv-legend-item">
                <span className="legend-label">F3:</span>
                <span className="legend-desc">Clientes que compraram 3 vezes</span>
              </div>
              <div className="rfv-legend-item">
                <span className="legend-label">F4:</span>
                <span className="legend-desc">Clientes que compraram 4 vezes</span>
              </div>
              <div className="rfv-legend-item">
                <span className="legend-label">F5:</span>
                <span className="legend-desc">Clientes que compraram 5+ vezes (fiéis)</span>
              </div>
            </div>
          </div>

          {/* Valor */}
          <div className="rfv-legend-card">
            <div className="rfv-legend-header">
              <div className="rfv-legend-color cyan"></div>
              <h4>VALOR (V)</h4>
            </div>
            <div className="rfv-legend-content">
              <div className="rfv-legend-item">
                <span className="legend-label">V1:</span>
                <span className="legend-desc">Valores muito baixos (R$ 0 - R$ 100)</span>
              </div>
              <div className="rfv-legend-item">
                <span className="legend-label">V2:</span>
                <span className="legend-desc">Valores baixos (R$ 100 - R$ 300)</span>
              </div>
              <div className="rfv-legend-item">
                <span className="legend-label">V3:</span>
                <span className="legend-desc">Valores médios (R$ 300 - R$ 600)</span>
              </div>
              <div className="rfv-legend-item">
                <span className="legend-label">V4:</span>
                <span className="legend-desc">Valores altos (R$ 600 - R$ 1.500)</span>
              </div>
              <div className="rfv-legend-item">
                <span className="legend-label">V5:</span>
                <span className="legend-desc">Valores muito altos (R$ 1.500+)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Dicas de Interpretação */}
        <div className="rfv-tips-section">
          <h4>💡 Dicas de Interpretação:</h4>
          <div className="rfv-tips-grid">
            <div className="rfv-tip">
              <span className="tip-icon">⚠️</span>
              <span className="tip-text">Muitos F1 indicam necessidade de programa de fidelização</span>
            </div>
            <div className="rfv-tip">
              <span className="tip-icon">🚨</span>
              <span className="tip-text">R4 e R5 precisam de campanhas de reativação</span>
            </div>
            <div className="rfv-tip">
              <span className="tip-icon">📈</span>
              <span className="tip-text">V1-V3 são oportunidades de upselling</span>
            </div>
            <div className="rfv-tip">
              <span className="tip-icon">🎯</span>
              <span className="tip-text">F5 são seus clientes mais valiosos - mantenha-os!</span>
            </div>
          </div>
        </div>
      </div>

      {/* Treemap dos Segmentos Principais */}
      <div className="rfv-treemap-section">
        <h3 className="rfv-treemap-title">Distribuição dos Principais Segmentos</h3>
        {isLoading ? (
          <div className="loading-message">Carregando segmentos RFV...</div>
        ) : (
          <div className="rfv-treemap">
            {rfvData
              .sort((a, b) => parseFloat(b.percentual) - parseFloat(a.percentual))
              // Mostrar todos os segmentos
              .map((dados, index) => {
                const getSegmentColor = (segmento) => {
                  const colors = {
                    'Campeões': '#9333EA',
                    'Clientes fiéis': '#7C3AED',
                    'Potenciais fiéis': '#8B5CF6',
                    'Novos': '#3B82F6',
                    'Potenciais leais': '#6366F1',
                    'Precisam atenção': '#DC2626',
                    'Não pode perder': '#B91C1C',
                    'Em risco': '#F59E0B',
                    'Hibernando': '#0EA5E9',
                    'Prestes a hibernar': '#10B981',
                    'Perdidos': '#0284C7',
                    'Promissores': '#06B6D4',
                    'Clientes recentes': '#14B8A6',
                    'Outros': '#6B7280'
                  };
                  return colors[segmento] || '#6B7280';
                };

                const getItemSize = (percentual) => {
                  const percent = parseFloat(percentual);
                  if (percent >= 15) return 'large';
                  if (percent >= 10) return 'medium';
                  if (percent >= 5) return 'small';
                  return 'xsmall';
                };

                const itemSize = getItemSize(dados.percentual);

                return (
                  <div
                    key={dados.id}
                    className={`treemap-item ${itemSize} ${selectedSegmentForDetails?.id === dados.id ? 'selected' : ''}`}
                    style={{backgroundColor: dados.cor}}
                    onClick={() => handleSegmentClick(dados)}
                  >
                    <div className="treemap-percentage">{dados.percentual}%</div>
                    <div className="treemap-name">{dados.nome}</div>
                    <div className="treemap-count">{dados.clientes} clientes</div>
                    <div className="treemap-value">{formatCurrency(dados.valorTotal || 0)}</div>
                  </div>
                );
              })}
          </div>
        )}
      </div>

      {/* Componente de Oportunidades do RFV */}
      <RFVOpportunitiesCard 
        selectedSegment={selectedSegmentForDetails}
        startDate={startDate}
        endDate={endDate}
        selectedFunnel={selectedFunnel}
        selectedUnit={selectedUnit}
        selectedSeller={selectedSeller}
        selectedOrigin={selectedOrigin}
      />
    </div>
  );
};

export default MatrizRFVComponent;