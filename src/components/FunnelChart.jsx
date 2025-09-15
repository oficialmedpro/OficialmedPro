import React, { useState, useEffect } from 'react';
import './FunnelChart.css';
import { getFunilEtapas } from '../service/supabase.js';
import { getFunnelStagesData } from '../service/funnelStagesService.js';
import { getFunnelSourcesMetrics } from '../service/funnelSourcesService.js';
import { getTodayDateSP } from '../utils/utils.js';

const FunnelChart = ({ t, title, selectedFunnel, selectedUnit, selectedSeller, selectedOrigin, startDate, endDate, selectedPeriod }) => {
  const [etapas, setEtapas] = useState([]);
  const [conversaoGeral, setConversaoGeral] = useState(null);
  const [sourcesData, setSourcesData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [funnelName, setFunnelName] = useState('');
  const [unitName, setUnitName] = useState('');
  const [sellerName, setSellerName] = useState('');
  const [originName, setOriginName] = useState('');

  // Função para formatar números grandes
  const formatNumber = (num) => {
    if (!num || isNaN(num)) return '0';
    // Retornar número completo formatado com pontos
    return num.toLocaleString('pt-BR');
  };

  // Função para formatar valor em R$ com lógica para não mostrar quando for 0
  const formatValue = (valor) => {
    if (!valor || valor === 0) return '';
    return `Valor: R$ ${valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
  };

  // Função para determinar singular/plural
  const getLabel = (num, singular, plural) => {
    return num === 1 ? singular : plural;
  };

  // Função para formatar o título dinâmico
  const getDynamicTitle = () => {
    if (funnelName) {
      return `Funil - ${funnelName}`;
    }
    return 'Funil';
  };

  // Função para formatar o período dinâmico
  const getDynamicPeriod = () => {
    if (startDate && endDate) {
      // Usar fuso horário de São Paulo para formatação
      const start = new Date(startDate + 'T12:00:00');
      const end = new Date(endDate + 'T12:00:00');
      
      // Se for o mesmo dia
      if (startDate === endDate) {
        return start.toLocaleDateString('pt-BR', {timeZone: 'America/Sao_Paulo'});
      }
      
      // Se for um período
      return `${start.toLocaleDateString('pt-BR', {timeZone: 'America/Sao_Paulo'})} - ${end.toLocaleDateString('pt-BR', {timeZone: 'America/Sao_Paulo'})}`;
    }
    
    // Fallback baseado no período selecionado
    switch (selectedPeriod) {
      case 'today':
        const hoje = getTodayDateSP();
        const hojeDate = new Date(hoje + 'T12:00:00');
        return `Hoje - ${hojeDate.toLocaleDateString('pt-BR', {timeZone: 'America/Sao_Paulo'})}`;
      case 'yesterday':
        return 'Ontem';
      case 'last7days':
        return 'Últimos 7 dias';
      case 'last30days':
        return 'Últimos 30 dias';
      case 'thisMonth':
        return 'Este mês';
      case 'lastMonth':
        return 'Mês passado';
      default:
        return 'Período personalizado';
    }
  };

  // Função para buscar nome do funil
  const fetchFunnelName = async (funnelId) => {
    if (!funnelId || funnelId === 'all') {
      setFunnelName('');
      return;
    }

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
      const supabaseSchema = import.meta.env.VITE_SUPABASE_SCHEMA || 'api';

      const response = await fetch(`${supabaseUrl}/rest/v1/funis?select=nome_funil&id_funil_sprint=eq.${funnelId}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'apikey': supabaseServiceKey,
          'Accept-Profile': supabaseSchema,
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data && data.length > 0) {
          setFunnelName(data[0].nome_funil);
          console.log('✅ Nome do funil encontrado:', data[0].nome_funil);
        } else {
          console.log('⚠️ Funil não encontrado para ID:', funnelId);
          setFunnelName('');
        }
      } else {
        console.error('❌ Erro ao buscar nome do funil:', response.status);
        setFunnelName('');
      }
    } catch (error) {
      console.error('❌ Erro ao buscar nome do funil:', error);
      setFunnelName('');
    }
  };

  // Função para buscar nome da unidade
  const fetchUnitName = async (unitId) => {
    if (!unitId || unitId === 'all') {
      setUnitName('');
      return;
    }

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
      const supabaseSchema = import.meta.env.VITE_SUPABASE_SCHEMA || 'api';

      const response = await fetch(`${supabaseUrl}/rest/v1/unidades?select=unidade&codigo_sprint=eq.${encodeURIComponent(unitId)}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'apikey': supabaseServiceKey,
          'Accept-Profile': supabaseSchema,
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data && data.length > 0) {
          setUnitName(data[0].unidade);
        } else {
          setUnitName('');
        }
      } else {
        setUnitName('');
      }
    } catch (error) {
      console.error('❌ Erro ao buscar nome da unidade:', error);
      setUnitName('');
    }
  };

  // Função para buscar nome do vendedor
  const fetchSellerName = async (sellerId) => {
    if (!sellerId || sellerId === 'all') {
      setSellerName('');
      return;
    }

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
      const supabaseSchema = import.meta.env.VITE_SUPABASE_SCHEMA || 'api';

      // Converter sellerId para int4
      const response = await fetch(`${supabaseUrl}/rest/v1/vendedores?select=nome&id_sprint=eq.${parseInt(sellerId)}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'apikey': supabaseServiceKey,
          'Accept-Profile': supabaseSchema,
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data && data.length > 0) {
          setSellerName(data[0].nome);
          console.log('✅ Nome do vendedor encontrado:', data[0].nome);
        } else {
          console.log('⚠️ Vendedor não encontrado para ID:', sellerId);
          setSellerName('');
        }
      } else {
        console.error('❌ Erro ao buscar nome do vendedor:', response.status);
        setSellerName('');
      }
    } catch (error) {
      console.error('❌ Erro ao buscar nome do vendedor:', error);
      setSellerName('');
    }
  };

  // Função para buscar nome da origem
  const fetchOriginName = async (originId) => {
    if (!originId || originId === 'all') {
      setOriginName('');
      return;
    }

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
      const supabaseSchema = import.meta.env.VITE_SUPABASE_SCHEMA || 'api';

      // Usar campo id
      const response = await fetch(`${supabaseUrl}/rest/v1/origem_oportunidade?select=nome&id=eq.${originId}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'apikey': supabaseServiceKey,
          'Accept-Profile': supabaseSchema,
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data && data.length > 0) {
          setOriginName(data[0].nome);
          console.log('✅ Nome da origem encontrado:', data[0].nome);
        } else {
          console.log('⚠️ Origem não encontrada para ID:', originId);
          setOriginName('');
        }
      } else {
        console.error('❌ Erro ao buscar nome da origem:', response.status);
        setOriginName('');
      }
    } catch (error) {
      console.error('❌ Erro ao buscar nome da origem:', error);
      setOriginName('');
    }
  };

  // useEffect para buscar nome do funil quando selectedFunnel mudar
  useEffect(() => {
    fetchFunnelName(selectedFunnel);
  }, [selectedFunnel]);

  // useEffect para buscar nome da unidade quando selectedUnit mudar
  useEffect(() => {
    fetchUnitName(selectedUnit);
  }, [selectedUnit]);

  // useEffect para buscar nome do vendedor quando selectedSeller mudar
  useEffect(() => {
    fetchSellerName(selectedSeller);
  }, [selectedSeller]);

  // useEffect para buscar nome da origem quando selectedOrigin mudar
  useEffect(() => {
    fetchOriginName(selectedOrigin);
  }, [selectedOrigin]);

  // Buscar sources data será feito junto com as etapas para garantir consistência

  // Buscar etapas dinâmicas e dados das oportunidades baseado no funil selecionado
  useEffect(() => {
    const fetchEtapasComDados = async () => {
      try {
        setLoading(true);
        
        console.log('🔍 FunnelChart INÍCIO:', { selectedFunnel, startDate, endDate, selectedPeriod });
        console.log('🔍 FunnelChart TIPOS:', { 
          startDateType: typeof startDate, 
          endDateType: typeof endDate,
          startDateValue: startDate,
          endDateValue: endDate 
        });
        
        // 🎯 LOG ESPECÍFICO PARA PERÍODO PERSONALIZADO
        if (selectedPeriod === 'custom') {
          console.log('🎯 PERÍODO PERSONALIZADO no FunnelChart:', {
            periodo: selectedPeriod,
            inicio: startDate,
            fim: endDate,
            datasValidas: !!(startDate && endDate),
            mensagem: 'Usando datas personalizadas definidas pelo usuário'
          });
        }
        
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
          const hoje = getTodayDateSP();
          dataInicio = hoje;
          dataFim = hoje;
          console.log('⚠️ FunnelChart: Usando datas fallback (hoje SP):', { dataInicio, dataFim });
        }
        
        const dadosCompletos = await getFunnelStagesData(etapasEstrutura, dataInicio, dataFim, selectedFunnel, selectedSeller, selectedOrigin, selectedUnit);
        
        console.log('✅ FunnelChart: Dados das etapas carregados:', dadosCompletos);
        console.log('🔍 FunnelChart: Detalhes das etapas com abertos:');
        dadosCompletos.etapas?.forEach((etapa, index) => {
          console.log(`   ${index + 1}. "${etapa.nome_etapa}": ${etapa.abertos} abertos, valor: R$ ${etapa.valorEmAberto}`);
        });
        
        setEtapas(dadosCompletos.etapas);
        setConversaoGeral(dadosCompletos.conversaoGeral);

        // 🔄 BUSCAR SOURCES DATA COM ETAPAS PARA GARANTIR CONSISTÊNCIA
        console.log('📊 FunnelChart: Buscando sources data com etapas carregadas...');
        try {
          const sourcesResult = await getFunnelSourcesMetrics(
            dataInicio,
            dataFim,
            selectedFunnel,
            selectedSeller,
            selectedUnit,
            null, // selectedOrigin
            dadosCompletos.etapas // usar as etapas recém carregadas
          );

          console.log('✅ FunnelChart: Sources data recebido:', sourcesResult);
          setSourcesData(sourcesResult);
        } catch (error) {
          console.error('❌ FunnelChart: Erro ao buscar sources data:', error);
          setSourcesData(null);
        }
        
      } catch (error) {
        console.error('❌ Erro ao carregar dados do funil:', error);
        setEtapas([]); // Fallback para array vazio
      } finally {
        setLoading(false);
      }
    };

    fetchEtapasComDados();
  }, [selectedFunnel, selectedSeller, selectedOrigin, selectedUnit, startDate, endDate]);

  if (loading) {
    return (
      <div className="main-chart">
        <div className="chart-header">
          <h3>{getDynamicTitle()}</h3>
          <span className="chart-period">{getDynamicPeriod()}</span>
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
        <h3>{getDynamicTitle()}</h3>
        <span className="chart-period">{getDynamicPeriod()}</span>
      </div>

      <div className="fc-funnel-container">
        {/* Sources Bar - só aparece quando há etapas carregadas e dados de sources */}
        {etapas.length > 0 && sourcesData && (
          <div className="fc-sources-bar">
            {/* Card TOTAL */}
            <div className="fc-source-item total">
              <span className="fc-source-label">TOTAL</span>
              <div className="fc-source-value">
                <div className="fc-source-line">
                  <span className="fc-source-count">
                    {formatNumber(sourcesData.totalAbertas || 0)} {getLabel(sourcesData.totalAbertas || 0, 'Aberta', 'Abertas')}
                  </span>
                </div>
                <div className="fc-source-line">
                  <span className="fc-source-count">
                    +{formatNumber(sourcesData.total)} {getLabel(sourcesData.total, 'Nova', 'Novas')}
                  </span>
                </div>
              </div>
            </div>
            
            {/* Cards das origens com percentuais */}
            <div className="fc-source-item google">
              <span className="fc-source-label">{t.google}</span>
              <div className="fc-source-value">
                <div className="fc-source-line">
                  <span className="fc-source-count">{formatNumber(sourcesData.google.abertas)} {getLabel(sourcesData.google.abertas, 'Aberta', 'Abertas')}</span>
                  <span className="fc-source-percentage">
                    ({sourcesData.totalAbertas > 0 ?
                      Math.round((sourcesData.google.abertas / sourcesData.totalAbertas) * 100) : 0}%)
                  </span>
                </div>
                <div className="fc-source-line">
                  <span className="fc-source-count">+{formatNumber(sourcesData.google.criadas)} {getLabel(sourcesData.google.criadas, 'Nova', 'Novas')}</span>
                  <span className="fc-source-percentage">
                    ({sourcesData.total > 0 ? Math.round((sourcesData.google.criadas / sourcesData.total) * 100) : 0}%)
                  </span>
                </div>
              </div>
            </div>
            
            <div className="fc-source-item meta">
              <span className="fc-source-label">{t.meta}</span>
              <div className="fc-source-value">
                <div className="fc-source-line">
                  <span className="fc-source-count">{formatNumber(sourcesData.meta.abertas)} {getLabel(sourcesData.meta.abertas, 'Aberta', 'Abertas')}</span>
                  <span className="fc-source-percentage">
                    ({sourcesData.totalAbertas > 0 ?
                      Math.round((sourcesData.meta.abertas / sourcesData.totalAbertas) * 100) : 0}%)
                  </span>
                </div>
                <div className="fc-source-line">
                  <span className="fc-source-count">+{formatNumber(sourcesData.meta.criadas)} {getLabel(sourcesData.meta.criadas, 'Nova', 'Novas')}</span>
                  <span className="fc-source-percentage">
                    ({sourcesData.total > 0 ? Math.round((sourcesData.meta.criadas / sourcesData.total) * 100) : 0}%)
                  </span>
                </div>
              </div>
            </div>
            
            <div className="fc-source-item organic">
              <span className="fc-source-label">{t.organic}</span>
              <div className="fc-source-value">
                <div className="fc-source-line">
                  <span className="fc-source-count">{formatNumber(sourcesData.organico.abertas)} {getLabel(sourcesData.organico.abertas, 'Aberta', 'Abertas')}</span>
                  <span className="fc-source-percentage">
                    ({sourcesData.totalAbertas > 0 ?
                      Math.round((sourcesData.organico.abertas / sourcesData.totalAbertas) * 100) : 0}%)
                  </span>
                </div>
                <div className="fc-source-line">
                  <span className="fc-source-count">+{formatNumber(sourcesData.organico.criadas)} {getLabel(sourcesData.organico.criadas, 'Nova', 'Novas')}</span>
                  <span className="fc-source-percentage">
                    ({sourcesData.total > 0 ? Math.round((sourcesData.organico.criadas / sourcesData.total) * 100) : 0}%)
                  </span>
                </div>
              </div>
            </div>
            
            <div className="fc-source-item indicacao">
              <span className="fc-source-label">WhatsApp</span>
              <div className="fc-source-value">
                <div className="fc-source-line">
                  <span className="fc-source-count">{formatNumber(sourcesData.whatsapp.abertas)} {getLabel(sourcesData.whatsapp.abertas, 'Aberta', 'Abertas')}</span>
                  <span className="fc-source-percentage">
                    ({sourcesData.totalAbertas > 0 ?
                      Math.round((sourcesData.whatsapp.abertas / sourcesData.totalAbertas) * 100) : 0}%)
                  </span>
                </div>
                <div className="fc-source-line">
                  <span className="fc-source-count">+{formatNumber(sourcesData.whatsapp.criadas)} {getLabel(sourcesData.whatsapp.criadas, 'Nova', 'Novas')}</span>
                  <span className="fc-source-percentage">
                    ({sourcesData.total > 0 ? Math.round((sourcesData.whatsapp.criadas / sourcesData.total) * 100) : 0}%)
                  </span>
                </div>
              </div>
            </div>
            
            <div className="fc-source-item prescritor">
              <span className="fc-source-label">{t.prescriber}</span>
              <div className="fc-source-value">
                <div className="fc-source-line">
                  <span className="fc-source-count">{formatNumber(sourcesData.prescritor.abertas)} {getLabel(sourcesData.prescritor.abertas, 'Aberta', 'Abertas')}</span>
                  <span className="fc-source-percentage">
                    ({sourcesData.totalAbertas > 0 ?
                      Math.round((sourcesData.prescritor.abertas / sourcesData.totalAbertas) * 100) : 0}%)
                  </span>
                </div>
                <div className="fc-source-line">
                  <span className="fc-source-count">+{formatNumber(sourcesData.prescritor.criadas)} {getLabel(sourcesData.prescritor.criadas, 'Nova', 'Novas')}</span>
                  <span className="fc-source-percentage">
                    ({sourcesData.total > 0 ? Math.round((sourcesData.prescritor.criadas / sourcesData.total) * 100) : 0}%)
                  </span>
                </div>
              </div>
            </div>
            
            <div className="fc-source-item franquia">
              <span className="fc-source-label">{t.franchise}</span>
              <div className="fc-source-value">
                <div className="fc-source-line">
                  <span className="fc-source-count">{formatNumber(sourcesData.franquia.abertas)} {getLabel(sourcesData.franquia.abertas, 'Aberta', 'Abertas')}</span>
                  <span className="fc-source-percentage">
                    ({sourcesData.totalAbertas > 0 ?
                      Math.round((sourcesData.franquia.abertas / sourcesData.totalAbertas) * 100) : 0}%)
                  </span>
                </div>
                <div className="fc-source-line">
                  <span className="fc-source-count">+{formatNumber(sourcesData.franquia.criadas)} {getLabel(sourcesData.franquia.criadas, 'Nova', 'Novas')}</span>
                  <span className="fc-source-percentage">
                    ({sourcesData.total > 0 ? Math.round((sourcesData.franquia.criadas / sourcesData.total) * 100) : 0}%)
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Legenda explicativa - só aparece quando há etapas carregadas */}
        {etapas.length > 0 && (
          <div className="fc-legend">
            <div className="fc-legend-item">
              <div className="fc-legend-color fc-legend-active"></div>
              <span className="fc-legend-text">Oportunidades Abertas</span>
            </div>
            <div className="fc-legend-item">
              <div className="fc-legend-color fc-legend-passed"></div>
              <span className="fc-legend-text">Passaram na Etapa</span>
            </div>
            <div className="fc-legend-item">
              <div className="fc-legend-color fc-legend-created"></div>
              <span className="fc-legend-text">Criadas no Período</span>
            </div>
            <div className="fc-legend-item">
              <div className="fc-legend-color fc-legend-lost"></div>
              <span className="fc-legend-text">Perdidas no Período</span>
            </div>
            <div className="fc-legend-item">
              <div className="fc-legend-color fc-legend-conversion"></div>
              <span className="fc-legend-text">Taxa de Passagem</span>
            </div>
          </div>
        )}

        {/* SEÇÃO DE FILTROS APLICADOS */}
        {etapas.length > 0 && (
          <div className="fc-applied-filters">
            <div className="fc-applied-filters-content">
              {/* Funil */}
              <div className="fc-filter-item">
                <span className="fc-filter-label">Funil:</span>
                <span className="fc-filter-value">
                  {funnelName || (selectedFunnel === 'all' ? 'Todos os Funis' : `Funil ${selectedFunnel}`)}
                </span>
              </div>

              {/* Unidade */}
              <div className="fc-filter-item">
                <span className="fc-filter-label">Unidade:</span>
                <span className="fc-filter-value">
                  {selectedUnit === 'all' ? 'Todas as Unidades' : (unitName || selectedUnit)}
                </span>
              </div>

              {/* Vendedor */}
              <div className="fc-filter-item">
                <span className="fc-filter-label">Vendedor:</span>
                <span className="fc-filter-value">
                  {selectedSeller === 'all' ? 'Todos os Vendedores' : (sellerName || selectedSeller)}
                </span>
              </div>

              {/* Origem */}
              <div className="fc-filter-item">
                <span className="fc-filter-label">Origem:</span>
                <span className="fc-filter-value">
                  {!selectedOrigin || selectedOrigin === 'all' ? 'Todas as Origens' : (originName || selectedOrigin)}
                </span>
              </div>

              {/* Período */}
              <div className="fc-filter-item">
                <span className="fc-filter-label">Período:</span>
                <span className="fc-filter-value">{getDynamicPeriod()}</span>
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
                    {/* 🎯 DESTAQUE: Oportunidades abertas (número laranja do CRM) */}
                    <span 
                      className="fc-funnel-value fc-funnel-active" 
                      title={`Total Oportunidades Abertas ${formatValue(etapa.valorEmAberto || 0)}`.trim()}
                    >
                      {formatNumber(etapa.abertos || 0)}
                    </span>
                    
                    {/* 🏆 NOVA MÉTRICA: Oportunidades ganhas no período */}
                    {etapa.ganhasPeriodo > 0 && (
                      <span 
                        className="fc-funnel-value fc-funnel-gained" 
                        title={`Oportunidades Ganhas no Período ${formatValue(etapa.valorGanhasPeriodo || 0)}`.trim()}
                      >
                        {formatNumber(etapa.ganhasPeriodo)}
                      </span>
                    )}
                  </div>
                  {/* 🎯 CONTAINER DOS BADGES - LADO A LADO NO CANTO DIREITO */}
                  <div className="fc-funnel-badges-container">
                    {/* Linha superior com badges principais */}
                    <div className="fc-funnel-badges-row">
                      {/* BADGE AZUL - PASSARAM POR ESTA ETAPA - SEMPRE MOSTRAR PARA DEBUG */}
                      <div className="fc-funnel-passed-through" title="Total Oportunidades que passaram">
                        {formatNumber(etapa.passaramPorEtapa || 0)}
                      </div>
                      {/* BADGE VERDE - CRIADAS */}
                      {etapa.criadasPeriodo > 0 && (
                        <div 
                          className="fc-funnel-created-today"
                          title={`Total Oportunidades Novas ${formatValue(etapa.valorCriadasPeriodo || 0)}`.trim()}
                        >
                          +{formatNumber(etapa.criadasPeriodo)}
                        </div>
                      )}
                      {/* BADGE VERDE ESCURO - CRIADAS ESPECÍFICAS DA ETAPA (apenas para primeira etapa) */}
                      {index === 0 && etapa.criadasEspecificasEtapa > 0 && etapa.criadasEspecificasEtapa !== etapa.criadasPeriodo && (
                        <div className="fc-funnel-created-specific" title={`${etapa.criadasEspecificasEtapa} criadas que ficaram na entrada`}>
                          +{formatNumber(etapa.criadasEspecificasEtapa)}
                        </div>
                      )}
                      {/* BADGE VERMELHO - PERDIDAS - SEMPRE MOSTRAR SE HOUVER DADOS */}
                      {etapa.perdidasPeriodo > 0 && (
                        <div 
                          className="fc-funnel-lost-today"
                          title={`Total Oportunidades Perdidas ${formatValue(etapa.valorPerdidasPeriodo || 0)}`.trim()}
                        >
                          -{formatNumber(etapa.perdidasPeriodo)}
                        </div>
                      )}
                    </div>
                    {/* TAXA DE CONVERSÃO - EMBAIXO DOS BADGES */}
                    {index < etapas.length - 1 && etapas[index + 1]?.ampulheta !== true && etapa.ampulheta !== true && etapa.is_ganho !== true && (
                      <div 
                        className="funildash_conversion-rate-box"
                        title="Taxa de passagem"
                      >
                        {etapas[index + 1]?.taxaPassagem !== null ? `${etapas[index + 1].taxaPassagem}%` : '0%'}
                      </div>
                    )}
                  </div>
                </div>
              </div>
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
