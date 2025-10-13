import React, { useState, useEffect, useCallback, useMemo } from 'react';
import './MatrizRFVComponent.css';
// Usar apenas service de dados reais
import { rfvRealService } from '../service/rfvRealService';

import RFVOpportunitiesCard from './RFVOpportunitiesCard';
// Importar ícones Lucide React
import { 
  Crown, 
  Star, 
  Target, 
  Clock, 
  AlertTriangle, 
  Moon, 
  Bed, 
  XCircle, 
  AlertCircle, 
  TrendingUp, 
  Users,
  Zap,
  Download,
  FileSpreadsheet,
  FileText
} from 'lucide-react';

const MatrizRFVComponent = ({
  startDate,
  endDate,
  selectedFunnel,
  selectedUnit,
  selectedSeller,
  selectedOrigin,
  isDarkMode
}) => {
  const [rfvData, setRfvData] = useState(null);
  const [distributionData, setDistributionData] = useState(null);
  const [matrixData, setMatrixData] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  
  const [selectedSegment, setSelectedSegment] = useState('all');
  const [dataSource, setDataSource] = useState(null);
  const [selectedSegmentForDetails, setSelectedSegmentForDetails] = useState(null);
  const [hoveredSegment, setHoveredSegment] = useState(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [selectedSegmentForExport, setSelectedSegmentForExport] = useState(null);
  const [segmentClients, setSegmentClients] = useState([]);
  const [isLoadingClients, setIsLoadingClients] = useState(false);

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
      // Pequeno delay para garantir que o componente esteja totalmente renderizado
      await new Promise(resolve => setTimeout(resolve, 100));
      setIsLoading(true);

      try {
        // Buscar apenas dados reais - sem fallback para dados simulados
        console.log('🔄 Carregando dados REAIS do RFV...');
        const analysis = await rfvRealService.getRFVAnalysis({
          startDate,
          endDate,
          selectedFunnel,
          selectedUnit,
          selectedSeller,
          selectedOrigin
        });
        console.log('✅ Dados REAIS carregados com sucesso:', analysis?.clientes?.length || 0, 'clientes');

        // Processar dados para o treemap
        const segmentosMap = new Map();
        
        // Agrupar clientes por segmento
        (analysis?.clientes || []).forEach(cliente => {
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
        const totalClientes = analysis?.clientes?.length || 0;
        const segmentosData = Array.from(segmentosMap.values()).map(seg => ({
          ...seg,
          percentual: totalClientes > 0 ? (seg.clientes / totalClientes * 100).toFixed(2) : 0
        }));

        console.log('🔄 Atualizando estado com dados RFV...');
        console.log('📊 Segmentos processados:', segmentosData.length);
        console.log('📊 Total de clientes:', analysis.clientes.length);
        console.log('📋 Fonte dos dados:', analysis.dataSource?.message);
        console.log('🎨 Dados do treemap:', segmentosData);
        
        setRfvData(segmentosData);
        setDistributionData(analysis.distributionData);
        setMatrixData(analysis.matrixData);
        setDataSource(analysis.dataSource);
        
        // Só parar de carregar quando tiver dados válidos
        setIsLoading(false);
        setIsInitialized(true);
        
      } catch (error) {
        console.error('❌ Erro ao carregar dados RFV:', error);
        
        // Sem fallback - mostrar estado vazio em caso de erro
        setRfvData(null);
        setDistributionData(null);
        setMatrixData({});
        setDataSource({ 
          isReal: false, 
          message: '❌ Erro ao carregar dados RFV - Verifique a conexão' 
        });
        
        // Parar de carregar mesmo em caso de erro
        setIsLoading(false);
        setIsInitialized(true);
      }
    };

    loadRFVData();
  }, [startDate, endDate, selectedFunnel, selectedUnit, selectedSeller, selectedOrigin]);

  const formatCurrency = useCallback((value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  }, []);

  const formatNumber = useCallback((value) => {
    return new Intl.NumberFormat('pt-BR').format(value);
  }, []);


  // Função para lidar com clique no segmento
  const handleSegmentClick = useCallback((segmento) => {
    setSelectedSegmentForDetails(segmento);
  }, []);

  // Handlers otimizados para efeito hover
  const handleMouseEnter = useCallback((segment, event) => {
    setIsHovering(true);
    setHoveredSegment(segment);
    setMousePosition({ x: event.clientX, y: event.clientY });
  }, []);

  const handleMouseMove = useCallback((event) => {
    if (isHovering) {
      setMousePosition({ x: event.clientX, y: event.clientY });
    }
  }, [isHovering]);

  const handleMouseLeave = useCallback(() => {
    setIsHovering(false);
    setHoveredSegment(null);
  }, []);

  // Funções memoizadas para melhor performance
  const segmentDescriptions = useMemo(() => ({
    'campeoes': 'Seus melhores clientes! Compram frequentemente, recentemente e gastam muito.',
    'clientes_fieis': 'Clientes fiéis que compram regularmente e têm alto valor.',
    'potenciais_fieis': 'Clientes com potencial para se tornarem leais e valiosos.',
    'promissores': 'Novos clientes com bom potencial de crescimento.',
    'clientes_recentes': 'Novos clientes que fizeram primeira compra recentemente.',
    'em_risco': 'Clientes valiosos que podem estar indo embora.',
    'precisam_atencao': 'Bons clientes que precisam de atenção para não se tornarem inativos.',
    'prestes_hibernar': 'Clientes em risco de se tornarem inativos.',
    'hibernando': 'Clientes inativos com baixa frequência e valor.',
    'perdidos': 'Clientes que não compram há muito tempo e com baixo valor.',
    'nao_posso_perder': 'Seus melhores clientes que estão se tornando inativos.',
    'novos_valiosos': 'Novos clientes com alto valor inicial.',
    'recencia_alta_valor_alto': 'Clientes com recência alta mas valor significativo.',
    'outros': 'Outros segmentos de clientes.'
  }), []);

  const segmentRecommendations = useMemo(() => ({
    'campeoes': 'Recompense-os! Ofereça produtos premium e programas VIP.',
    'clientes_fieis': 'Mantenha o relacionamento com ofertas exclusivas.',
    'potenciais_fieis': 'Crie campanhas para aumentar a frequência de compra.',
    'promissores': 'Eduque sobre outros produtos e benefícios.',
    'clientes_recentes': 'Desenvolva programa de onboarding personalizado.',
    'em_risco': 'Campanhas urgentes de retenção personalizadas.',
    'precisam_atencao': 'Campanhas de engajamento e ofertas personalizadas.',
    'prestes_hibernar': 'Ofertas especiais para manter o engajamento.',
    'hibernando': 'Campanhas de reativação com ofertas irresistíveis.',
    'perdidos': 'Campanhas de winback agressivas ou considerar como perdidos.',
    'nao_posso_perder': 'Estratégia VIP de reconquista imediata.',
    'novos_valiosos': 'Programa de fidelização desde o início.',
    'recencia_alta_valor_alto': 'Foque em aumentar a frequência de compra.',
    'outros': 'Desenvolva estratégia específica para este segmento.'
  }), []);

  const segmentIcons = useMemo(() => ({
    'campeoes': <Crown size={20} />,
    'clientes_fieis': <Star size={20} />,
    'potenciais_fieis': <Users size={20} />,
    'promissores': <Target size={20} />,
    'clientes_recentes': <Clock size={20} />,
    'em_risco': <AlertTriangle size={20} />,
    'precisam_atencao': <AlertCircle size={20} />,
    'prestes_hibernar': <Moon size={20} />,
    'hibernando': <Bed size={20} />,
    'perdidos': <XCircle size={20} />,
    'nao_posso_perder': <AlertCircle size={20} />,
    'novos_valiosos': <Zap size={20} />,
    'recencia_alta_valor_alto': <TrendingUp size={20} />,
    'outros': <Users size={20} />
  }), []);

  const getSegmentDescription = useCallback((segment) => {
    return segmentDescriptions[segment.id] || 'Segmento de clientes RFV';
  }, [segmentDescriptions]);

  const getRecommendation = useCallback((segment) => {
    return segmentRecommendations[segment.id] || 'Desenvolva estratégia específica para este segmento.';
  }, [segmentRecommendations]);

  const getSegmentIcon = useCallback((segment) => {
    return segmentIcons[segment.id] || <Users size={20} />;
  }, [segmentIcons]);

  // Função para buscar clientes de um segmento específico
  const fetchSegmentClients = useCallback(async (segmentId) => {
    setIsLoadingClients(true);
    try {
      console.log('🔍 Buscando clientes do segmento:', segmentId);
      console.log('🔍 IMPORTANTE: Usando os MESMOS dados do treemap para manter consistência');
      
      // 🔧 CORREÇÃO: Usar os MESMOS filtros do treemap para manter consistência
      const analysis = await rfvRealService.getRFVAnalysis({
        startDate,
        endDate,
        selectedFunnel,
        selectedUnit,
        selectedSeller,
        selectedOrigin
      });

      console.log(`📊 Total de clientes retornados pela análise histórica: ${analysis.clientes.length}`);
      console.log(`📊 Segmentos encontrados:`, [...new Set(analysis.clientes.map(c => c.segmento))]);

      // Filtrar clientes do segmento específico
      const clients = analysis.clientes.filter(cliente => cliente.segmento === segmentId);
      
      console.log(`📊 Encontrados ${clients.length} clientes no segmento ${segmentId} (dados históricos completos)`);
      console.log(`📊 Primeiros 3 clientes do segmento:`, clients.slice(0, 3));
      
      setSegmentClients(clients);
      return clients;
    } catch (error) {
      console.error('Erro ao buscar clientes do segmento:', error);
      setSegmentClients([]);
      return [];
    } finally {
      setIsLoadingClients(false);
    }
  }, [selectedFunnel, selectedUnit, selectedSeller, selectedOrigin]);

  // Função para exportar dados em CSV
  const exportToCSV = useCallback((clients, segmentName) => {
    if (!clients || clients.length === 0) {
      alert('Nenhum cliente encontrado para exportar');
      return;
    }

    const headers = [
      'Lead ID',
      'Nome',
      'Sobrenome',
      'WhatsApp',
      'Total Valor (R$)',
      'Frequência',
      'Recência (dias)',
      'Score R',
      'Score F', 
      'Score V',
      'Segmento',
      'Última Compra',
      'Ticket Médio (R$)'
    ];

    const csvContent = [
      headers.join(','),
      ...clients.map(client => [
        client.lead_id || '',
        client.nome || '',
        client.sobrenome || '',
        client.whatsapp || '',
        (client.totalValor || 0).toFixed(2),
        client.frequencia || 0,
        client.recencia || 0,
        client.r || 0,
        client.f || 0,
        client.v || 0,
        client.segmento || '',
        client.ultimaCompra ? new Date(client.ultimaCompra).toLocaleDateString('pt-BR') : '',
        ((client.totalValor || 0) / (client.frequencia || 1)).toFixed(2)
      ].join(','))
    ].join('\n');

    // Criar e baixar arquivo
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `clientes_${segmentName}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    console.log(`✅ CSV exportado: ${clients.length} clientes do segmento ${segmentName}`);
  }, []);

  // Função para exportar dados em Excel (formato CSV otimizado para Excel)
  const exportToExcel = useCallback((clients, segmentName) => {
    if (!clients || clients.length === 0) {
      alert('Nenhum cliente encontrado para exportar');
      return;
    }

    // Criar conteúdo CSV otimizado para Excel com separador de ponto e vírgula
    const headers = [
      'Lead ID',
      'Nome',
      'Sobrenome', 
      'WhatsApp',
      'Total Valor (R$)',
      'Frequência',
      'Recência (dias)',
      'Score R',
      'Score F',
      'Score V',
      'Segmento',
      'Última Compra',
      'Ticket Médio (R$)'
    ];

    // Usar ponto e vírgula como separador (padrão brasileiro para Excel)
    const csvContent = [
      headers.join(';'),
      ...clients.map(client => [
        client.lead_id || '',
        `"${client.nome || ''}"`, // Aspas para evitar problemas com vírgulas
        `"${client.sobrenome || ''}"`,
        `"${client.whatsapp || ''}"`,
        (client.totalValor || 0).toFixed(2).replace('.', ','), // Vírgula decimal brasileira
        client.frequencia || 0,
        client.recencia || 0,
        client.r || 0,
        client.f || 0,
        client.v || 0,
        `"${client.segmento || ''}"`,
        client.ultimaCompra ? new Date(client.ultimaCompra).toLocaleDateString('pt-BR') : '',
        ((client.totalValor || 0) / (client.frequencia || 1)).toFixed(2).replace('.', ',')
      ].join(';'))
    ].join('\n');

    // Adicionar BOM para UTF-8 (importante para caracteres especiais no Excel)
    const BOM = '\uFEFF';
    const csvWithBOM = BOM + csvContent;
    
    const blob = new Blob([csvWithBOM], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    // Usar extensão .csv para evitar problemas de corrupção
    link.setAttribute('download', `clientes_${segmentName}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    console.log(`✅ Excel exportado: ${clients.length} clientes do segmento ${segmentName}`);
  }, []);

  // Função para abrir modal de exportação
  const handleExportClick = useCallback(async (segment) => {
    setSelectedSegmentForExport(segment);
    setShowExportModal(true);
    
    // Buscar clientes do segmento
    await fetchSegmentClients(segment.id);
  }, [fetchSegmentClients]);

  // Função para fechar modal
  const closeExportModal = useCallback(() => {
    setShowExportModal(false);
    setSelectedSegmentForExport(null);
    setSegmentClients([]);
  }, []);

  const totalCustomers = rfvData?.reduce((sum, segment) => sum + (segment.clientes || 0), 0) || 0;
  const totalRevenue = rfvData?.reduce((sum, segment) => sum + (segment.faturamento || 0), 0) || 0;

  const filteredData = selectedSegment === 'all'
    ? rfvData || []
    : (rfvData || []).filter(segment => segment.id === selectedSegment);

  // Só renderizar quando o componente estiver inicializado E tiver dados
  if (!isInitialized || !rfvData) {
    return (
      <div className="matriz-rfv-component">
        <div className="rfv-header">
          <div className="rfv-title-section">
            <h2 className="rfv-section-title">CLASSIFICAÇÃO DE CLIENTES - RFV</h2>
            <p className="rfv-section-subtitle">Desenvolvido por: Vitória Vicente</p>
          </div>
        </div>
        <div className="loading-message">Carregando dados RFV...</div>
      </div>
    );
  }

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
        <div className="rfv-treemap">
            {(rfvData || [])
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
                    onMouseEnter={(e) => handleMouseEnter(dados, e)}
                    onMouseMove={handleMouseMove}
                    onMouseLeave={handleMouseLeave}
                  >
                    <div className="treemap-percentage-with-icon">
                      <span className="treemap-percentage">{dados.percentual}%</span>
                      <span className="treemap-icon">
                        {getSegmentIcon(dados)}
                      </span>
                    </div>
                    <div className="treemap-name">{dados.nome}</div>
                    <div className="treemap-count-value">
                      <span className="treemap-count">{dados.clientes} clientes</span>
                      <span className="treemap-separator"> | </span>
                      <span className="treemap-value">{formatCurrency(dados.valorTotal || 0)}</span>
                    </div>
                    <div className="treemap-export-button">
                      <button
                        className="export-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleExportClick(dados);
                        }}
                        title={`Exportar clientes do segmento ${dados.nome}`}
                      >
                        <Download size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
        </div>
      </div>


      {/* Tooltip otimizado */}
      {hoveredSegment && isHovering && (
        <div 
          className="rfv-tooltip"
          style={{
            left: mousePosition.x + 15,
            top: mousePosition.y - 10,
            position: 'fixed',
            zIndex: 1000
          }}
        >
          <div className="rfv-tooltip-header">
            <span className="rfv-tooltip-icon">{getSegmentIcon(hoveredSegment)}</span>
            <span className="rfv-tooltip-title">{hoveredSegment.nome}</span>
          </div>
          
          <div className="rfv-tooltip-stats">
            <div className="rfv-tooltip-stat">
              <span className="rfv-tooltip-label">Clientes:</span>
              <span className="rfv-tooltip-value">{hoveredSegment.clientes}</span>
            </div>
            <div className="rfv-tooltip-stat">
              <span className="rfv-tooltip-label">Percentual:</span>
              <span className="rfv-tooltip-value">{hoveredSegment.percentual}%</span>
            </div>
            <div className="rfv-tooltip-stat">
              <span className="rfv-tooltip-label">Valor Total:</span>
              <span className="rfv-tooltip-value">{formatCurrency(hoveredSegment.valorTotal || 0)}</span>
            </div>
          </div>

          <div className="rfv-tooltip-description">
            <p><strong>Descrição:</strong> {getSegmentDescription(hoveredSegment)}</p>
            <p><strong>Recomendação:</strong> {getRecommendation(hoveredSegment)}</p>
          </div>
        </div>
      )}

      {/* Modal de Exportação */}
      {showExportModal && selectedSegmentForExport && (
        <div className="export-modal-overlay" onClick={closeExportModal}>
          <div className="export-modal" onClick={(e) => e.stopPropagation()}>
            <div className="export-modal-header">
              <h3>Exportar Clientes - {selectedSegmentForExport.nome}</h3>
              <button className="close-btn" onClick={closeExportModal}>×</button>
            </div>
            
            <div className="export-modal-content">
              <div className="export-segment-info">
                <div className="segment-stats">
                  <div className="stat-item">
                    <span className="stat-label">Clientes:</span>
                    <span className="stat-value">{selectedSegmentForExport.clientes}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Valor Total:</span>
                    <span className="stat-value">{formatCurrency(selectedSegmentForExport.valorTotal || 0)}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Percentual:</span>
                    <span className="stat-value">{selectedSegmentForExport.percentual}%</span>
                  </div>
                </div>
              </div>

              {isLoadingClients ? (
                <div className="loading-clients">
                  <div className="loading-spinner"></div>
                  <p>Carregando clientes do segmento...</p>
                </div>
              ) : (
                <div className="export-options">
                  <div className="export-description">
                    <p>Escolha o formato para exportar os {segmentClients.length} clientes deste segmento:</p>
                    <p style={{fontSize: '12px', color: 'var(--text-secondary)', marginTop: '8px'}}>
                      📊 <strong>Dados consistentes</strong> - Mesmos dados exibidos no treemap
                    </p>
                  </div>
                  
                  <div className="export-buttons">
                    <button
                      className="export-btn-csv"
                      onClick={() => exportToCSV(segmentClients, selectedSegmentForExport.nome)}
                      disabled={segmentClients.length === 0}
                    >
                      <FileText size={20} />
                      <span>Exportar CSV</span>
                      <small>{segmentClients.length} clientes</small>
                    </button>
                    
                    <button
                      className="export-btn-excel"
                      onClick={() => exportToExcel(segmentClients, selectedSegmentForExport.nome)}
                      disabled={segmentClients.length === 0}
                    >
                      <FileSpreadsheet size={20} />
                      <span>Exportar para Excel</span>
                      <small>{segmentClients.length} clientes (.csv)</small>
                    </button>
                  </div>

                  {segmentClients.length > 0 && (
                    <div className="export-preview">
                      <h4>Preview dos dados:</h4>
                      <div className="preview-table">
                        <table>
                          <thead>
                            <tr>
                              <th>Lead ID</th>
                              <th>Nome</th>
                              <th>Sobrenome</th>
                              <th>WhatsApp</th>
                              <th>Valor Total</th>
                              <th>Frequência</th>
                              <th>Recência</th>
                              <th>Scores RFV</th>
                            </tr>
                          </thead>
                          <tbody>
                            {segmentClients.slice(0, 5).map((client, index) => (
                              <tr key={index}>
                                <td>{client.lead_id}</td>
                                <td>{client.nome || '-'}</td>
                                <td>{client.sobrenome || '-'}</td>
                                <td>{client.whatsapp || '-'}</td>
                                <td>{formatCurrency(client.totalValor || 0)}</td>
                                <td>{client.frequencia}</td>
                                <td>{client.recencia} dias</td>
                                <td>R{client.r} F{client.f} V{client.v}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        {segmentClients.length > 5 && (
                          <p className="preview-note">... e mais {segmentClients.length - 5} clientes</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

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