import React, { useState, useEffect } from 'react';
import './DashboardPage.css';
import './ClientesConsolidados.css';
import FilterBar from '../components/FilterBar';
import TopMenuBar from '../components/TopMenuBar';
import Sidebar from '../components/Sidebar';
import { translations } from '../data/translations';
import { supabase } from '../service/supabase';
import { updateMarketData } from '../utils/utils';
import { useAuth } from '../hooks/useAuth';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import sprinthubService from '../service/sprinthubService';

const ClientesConsolidadosPage = ({ onLogout }) => {
  const { user } = useAuth();
  // Estados do dashboard
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [currentLanguage, setCurrentLanguage] = useState('pt-BR');
  const [marketData, setMarketData] = useState({
    usd: 5.20,
    eur: 5.45,
    ibov: 125432,
    lastUpdate: new Date()
  });

  // Estados do menu
  const [collapsedGroups, setCollapsedGroups] = useState({
    dashboards: false,
    analises: false,
    qualidade: false,
    marketing: false,
    faltantes: false,
    geografia: false,
    especiais: false,
    historico: false,
    executivo: false
  });

  // Estados específicos da página
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isLoading, setIsLoading] = useState(false);

  // Estados dos dados
  const [dashboardData, setDashboardData] = useState([]);
  const [dashboardSprintData, setDashboardSprintData] = useState(null);
  const [dashboardPrimeData, setDashboardPrimeData] = useState(null);
  const [completudeData, setCompletudeData] = useState(null);
  const [origensData, setOrigensData] = useState(null);
  const [faltaNoPrimeData, setFaltaNoPrimeData] = useState([]);
  const [faltaNoSprintData, setFaltaNoSprintData] = useState([]);
  const [duplicadosData, setDuplicadosData] = useState([]);
  const [dupType, setDupType] = useState('email'); // 'cpf' | 'email' | 'phone'
  const [dupModalOpen, setDupModalOpen] = useState(false);
  const [dupModalIds, setDupModalIds] = useState([]);
  const [dupModalRows, setDupModalRows] = useState([]);
  const [qualidadeData, setQualidadeData] = useState([]);
  const [baixaQualidadeData, setBaixaQualidadeData] = useState([]);
  const [aniversariantesMesData, setAniversariantesMesData] = useState([]);
  const [aniversariantesProximosData, setAniversariantesProximosData] = useState([]);
  const [semCpfData, setSemCpfData] = useState([]);
  const [semEmailData, setSemEmailData] = useState([]);
  const [semContatoData, setSemContatoData] = useState([]);
  const [distribuicaoGeoData, setDistribuicaoGeoData] = useState([]);
  const [topCidadesData, setTopCidadesData] = useState([]);
  const [completosAlcancaveisData, setCompletosAlcancaveisData] = useState([]);
  const [dadosEssenciaisData, setDadosEssenciaisData] = useState([]);
  const [atualizacoes7DiasData, setAtualizacoes7DiasData] = useState([]);
  const [atualizacoes30DiasData, setAtualizacoes30DiasData] = useState([]);
  const [executivoData, setExecutivoData] = useState([]);

  // Estados de Gestão de Clientes
  const [dashboardGestaoData, setDashboardGestaoData] = useState(null);
  const [validacaoIntegridadeData, setValidacaoIntegridadeData] = useState([]);
  
  // Estados de Ativação (Nunca Compraram)
  const [ativacaoGeralData, setAtivacaoGeralData] = useState(null);
  const [duplicadosCount, setDuplicadosCount] = useState(0);
  const [ativacaoPrimeData, setAtivacaoPrimeData] = useState([]);
  const [ativacaoForaPrimeData, setAtivacaoForaPrimeData] = useState([]);
  const [ativacaoComOrcamentoData, setAtivacaoComOrcamentoData] = useState([]);
  const [ativacaoSemOrcamentoData, setAtivacaoSemOrcamentoData] = useState([]);
  
  // Estados de Reativação (90+ dias)
  const [reativacaoGeralData, setReativacaoGeralData] = useState(null);
  const [reativacao1xData, setReativacao1xData] = useState([]);
  const [reativacao2xData, setReativacao2xData] = useState([]);
  const [reativacao3xData, setReativacao3xData] = useState([]);
  const [reativacao3xPlusData, setReativacao3xPlusData] = useState([]);
  const [reativacaoStats, setReativacaoStats] = useState([]);
  
  // Estados de Monitoramento (0-90 dias)
  const [monitoramentoGeralData, setMonitoramentoGeralData] = useState(null);
  const [monitoramento129Data, setMonitoramento129Data] = useState([]);
  const [monitoramento3059Data, setMonitoramento3059Data] = useState([]);
  const [monitoramento6090Data, setMonitoramento6090Data] = useState([]);
  const [monitoramentoD45Data, setMonitoramentoD45Data] = useState([]);
  const [monitoramentoD60Data, setMonitoramentoD60Data] = useState([]);
  const [monitoramentoD75Data, setMonitoramentoD75Data] = useState([]);
  const [monitoramentoD90Data, setMonitoramentoD90Data] = useState([]);
  const [monitoramentoStats, setMonitoramentoStats] = useState([]);
  const [ativacaoStats, setAtivacaoStats] = useState([]);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(50);
  const [sortField, setSortField] = useState(null);
  const [sortDirection, setSortDirection] = useState('desc');
  const [filters, setFilters] = useState({
    hasCpf: false,
    hasEmail: false,
    hasEndereco: false,
    hasSexo: false,
    hasDataNascimento: false,
    phoneStatus: 'any', // 'any' | 'has' | 'none'
    ddd: '', // dois dígitos
    origins: [] // ['prime','sprint','greatpage','blacklabs']
  });
  const [showFilters, setShowFilters] = useState(true);
  const [dddOptions, setDddOptions] = useState([]);
  const [selectedRows, setSelectedRows] = useState([]); // índices da página atual
  const [lastClickedIndex, setLastClickedIndex] = useState(null);
  const [exportFormat, setExportFormat] = useState('csv');
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportMotivo, setExportMotivo] = useState('WHATSAPI');
  const [exportObservacao, setExportObservacao] = useState('');
  const [exportHistory, setExportHistory] = useState({}); // {leadId: [{motivo, observacao, data}]}
  const [exportFilter, setExportFilter] = useState('all'); // 'all' | 'exported' | 'never-exported'
  const [nameFilter, setNameFilter] = useState('all'); // 'all' | 'incomplete' | 'validated'
  const [duplicatesFilter, setDuplicatesFilter] = useState('all'); // 'all' | 'with-duplicates' | 'no-duplicates'
  const [isLoadingDuplicates, setIsLoadingDuplicates] = useState(false);
  const [validatedNames, setValidatedNames] = useState({}); // {clienteId: nome_validado}
  const [showNameModal, setShowNameModal] = useState(false);
  const [selectedClientForName, setSelectedClientForName] = useState(null);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedHistoryLead, setSelectedHistoryLead] = useState(null);
  const [showQualityModal, setShowQualityModal] = useState(false);
  
  // Estados para histórico SprintHub
  const [sprinthubExportFlags, setSprinthubExportFlags] = useState({}); // IDs com export SprintHub
  const [showSprinthubHistoryModal, setShowSprinthubHistoryModal] = useState(false);
  const [showExportHistoryModal, setShowExportHistoryModal] = useState(false);
  const [selectedClientForHistory, setSelectedClientForHistory] = useState(null);
  const [clientExportHistory, setClientExportHistory] = useState([]);
  const [sprinthubHistory, setSprinthubHistory] = useState([]);
  
  // Estados para filtros SprintHub
  const [sprinthubStatusFilter, setSprinthubStatusFilter] = useState('all'); // 'all' | 'sent' | 'not-sent'
  const [sprinthubLeadTagFilter, setSprinthubLeadTagFilter] = useState('all');
  const [availableSprinthubLeadTags, setAvailableSprinthubLeadTags] = useState([]);
  const [sprinthubDataEnvioInicio, setSprinthubDataEnvioInicio] = useState(''); // Data início envio SprintHub
  const [sprinthubDataEnvioFim, setSprinthubDataEnvioFim] = useState(''); // Data fim envio SprintHub
  const [selectedQualityClient, setSelectedQualityClient] = useState(null);
  const [showDuplicatesModal, setShowDuplicatesModal] = useState(false);
  const [selectedDuplicatesClient, setSelectedDuplicatesClient] = useState(null);
  const [duplicatesData, setDuplicatesData] = useState({}); // {clientId: [duplicates]}
  const [selectedMasterLead, setSelectedMasterLead] = useState(null);
  const [fieldSelection, setFieldSelection] = useState({}); // {fieldName: leadId} - qual lead fornece cada campo
  const [primePedidosData, setPrimePedidosData] = useState({}); // {leadId: [{pedido}]} - pedidos do Prime por lead
  const [loadingPrimeData, setLoadingPrimeData] = useState(false);

  // Estados do FilterBar (necessários para habilitar seleção nos dropdowns)
  const [selectedUnit, setSelectedUnit] = useState('all');
  const [selectedFunnel, setSelectedFunnel] = useState('all');
  const [selectedSeller, setSelectedSeller] = useState('all');
  const [selectedOrigin, setSelectedOrigin] = useState('all');
  const [selectedPeriod, setSelectedPeriod] = useState('thisMonth');
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);

  // Callbacks esperados pelo FilterBar (por enquanto, apenas armazenam o valor)
  const handleUnitFilterChange = (codigoSprint) => {
    // Neste módulo (ativação) ainda não filtramos por unidade nas queries.
    // Mantemos o valor disponível para futura integração.
    console.log('🎯 Unidade (codigo_sprint) selecionada no FilterBar:', codigoSprint);
  };
  const handleSellerFilterChange = (sellerId) => {
    console.log('🎯 Vendedor selecionado no FilterBar:', sellerId);
  };
  const handleOriginFilterChange = (origem) => {
    console.log('🎯 Origem selecionada no FilterBar:', origem);
  };
  const handleStatusFilterChange = () => {};
  const [editFields, setEditFields] = useState(null);

  // Configuração do SprintHub
  const SPRINTHUB_CONFIG = sprinthubService.getConfig();
  
  // Constante para prefixo de tags de histórico SprintHub
  const SPRINT_HISTORY_TAG_PREFIX = 'SPRINTHUB_LEADTAG_';
  
  // Função para construir valor de tag de histórico SprintHub
  const buildSprinthubHistoryTagValue = (leadTagId) => {
    if (!leadTagId) return 'SPRINTHUB';
    return `${SPRINT_HISTORY_TAG_PREFIX}${leadTagId}`;
  };
  
  // Função para extrair tag de lead do SprintHub de um valor de tag
  const extractSprinthubLeadTag = (tagValue) => {
    if (!tagValue) return null;
    if (tagValue.startsWith(SPRINT_HISTORY_TAG_PREFIX)) {
      return tagValue.substring(SPRINT_HISTORY_TAG_PREFIX.length);
    }
    if (tagValue.toLowerCase() === 'sprinthub') {
      return 'default';
    }
    return null;
  };
  
  // Função para formatar label de tag SprintHub
  const formatSprinthubTagLabel = (tagValue) => {
    if (!tagValue) return '-';
    const leadTag = extractSprinthubLeadTag(tagValue);
    if (leadTag && leadTag !== 'default') {
      return `SPRINTHUB (Tag ${leadTag})`;
    }
    return tagValue;
  };
  
  // Estados específicos para exportação Sprinthub
  const [sprinthubEtapa, setSprinthubEtapa] = useState(() => {
    if (SPRINTHUB_CONFIG.defaultColumnId != null) {
      return String(SPRINTHUB_CONFIG.defaultColumnId);
    }
    return '167';
  });
  const [sprinthubVendedor, setSprinthubVendedor] = useState(() => {
    if (SPRINTHUB_CONFIG.defaultUserId != null) {
      return String(SPRINTHUB_CONFIG.defaultUserId);
    }
    return '229';
  });
  const [sprinthubTituloPrefix, setSprinthubTituloPrefix] = useState('MONITORAMENTO');
  const [sprinthubFunnelId, setSprinthubFunnelId] = useState(() => {
    if (SPRINTHUB_CONFIG.defaultFunnelId != null) {
      return String(SPRINTHUB_CONFIG.defaultFunnelId);
    }
    return '';
  });
  const [sprinthubSequence, setSprinthubSequence] = useState(() => {
    if (SPRINTHUB_CONFIG.defaultSequenceId != null) {
      return String(SPRINTHUB_CONFIG.defaultSequenceId);
    }
    return '0';
  });
  const [sprinthubOrigemOportunidade, setSprinthubOrigemOportunidade] = useState('Monitoramento');
  const [sprinthubTipoCompra, setSprinthubTipoCompra] = useState('recompra monitoramento');
  const [showSprinthubModal, setShowSprinthubModal] = useState(false);
  const [isSendingToSprinthub, setIsSendingToSprinthub] = useState(false);
  const [sprinthubResults, setSprinthubResults] = useState([]);
  const [sprinthubError, setSprinthubError] = useState(null);
  const [sprinthubAvailableTags, setSprinthubAvailableTags] = useState([]);
  const [isLoadingSprinthubTags, setIsLoadingSprinthubTags] = useState(false);
  const [sprinthubBatchSize, setSprinthubBatchSize] = useState('50');
  const [sprinthubProgress, setSprinthubProgress] = useState(null);
  const [showAutoSyncConfig, setShowAutoSyncConfig] = useState(false);
  const [autoSyncLimit, setAutoSyncLimit] = useState('200');

  const t = translations[currentLanguage];

  // Atualizar dados de mercado
  useEffect(() => {
    const updateData = async () => {
      const data = await updateMarketData();
      if (data) setMarketData(data);
    };
    updateData();
    const interval = setInterval(updateData, 30000);
    return () => clearInterval(interval);
  }, []);

  // Carregar tags do SprintHub
  useEffect(() => {
    let active = true;
    const fetchTagsFromSprint = async () => {
      try {
        setIsLoadingSprinthubTags(true);
        const tags = await sprinthubService.getInstanceTags();
        if (active) {
          setSprinthubAvailableTags(Array.isArray(tags) ? tags : []);
        }
      } catch (error) {
        console.error('Erro ao carregar tags da SprintHub:', error);
      } finally {
        if (active) {
          setIsLoadingSprinthubTags(false);
        }
      }
    };
    fetchTagsFromSprint();
    loadAvailableExportTags(); // Carregar tags de leads do SprintHub
    return () => {
      active = false;
    };
  }, []);

  // Carregar dados ao mudar de aba
  useEffect(() => {
    setCurrentPage(1); // Reset página
    // Limpar dados completos ao mudar de aba (para não usar dados da aba anterior)
    setAllDataForTab([]);
    setDuplicatesFilter('all'); // Resetar filtro de duplicatas também
    
    // Ordenação padrão por nome nas páginas de Ativação e Reativação com lista
    const ativacaoListTabs = ['ativacao-prime', 'ativacao-fora-prime', 'ativacao-com-orcamento', 'ativacao-sem-orcamento'];
    const reativacaoListTabs = ['reativacao-1x', 'reativacao-2x', 'reativacao-3x', 'reativacao-3x-plus'];
    const allListTabs = [...ativacaoListTabs, ...reativacaoListTabs];
    if (allListTabs.includes(activeTab)) {
      setSortField('nome_completo');
      setSortDirection('asc');
    } else {
      setSortField(null);
      setSortDirection('desc');
    }
    setFilters({
      hasCpf: false,
      hasEmail: false,
      hasEndereco: false,
      hasSexo: false,
      hasDataNascimento: false,
      phoneStatus: 'any',
      ddd: '',
      origins: []
    });
    // Carrega DDDs disponíveis (coletados por amostragem das visões de ativação e reativação)
    if (allListTabs.includes(activeTab)) {
      loadAvailableDDDs();
    } else {
      setDddOptions([]);
    }
    loadTabData();
  }, [activeTab]);

  // Recarregar quando mudar página ou tamanho da página (para abas com paginação)
  useEffect(() => {
    // Se filtro de duplicatas está ativo, não recarregar do backend (já temos todos os dados)
    if (duplicatesFilter !== 'all' && allDataForTab.length > 0) {
      // Apenas resetar seleções, os dados já estão carregados
      setSelectedRows([]);
      setLastClickedIndex(null);
      return;
    }
    
    // Caso contrário, recarregar do backend normalmente
    loadTabData();
    setSelectedRows([]);
    setLastClickedIndex(null);
  }, [currentPage, itemsPerPage, sortField, sortDirection, duplicatesFilter, sprinthubStatusFilter, sprinthubLeadTagFilter, sprinthubDataEnvioInicio, sprinthubDataEnvioFim]);

  // Carregar TODOS os dados da aba atual (sem paginação) para detectar duplicatas
  // Buscar TODAS as duplicatas da view atual usando SQL direto
  // Quando o filtro "Com Duplicatas" ou "Sem Duplicatas" é selecionado, busca todas do banco e cria nova paginação
  const loadAllDuplicatesFromTabView = async (filterType) => {
    try {
      const viewMap = {
        'ativacao-prime': 'vw_inativos_prime',
        'ativacao-fora-prime': 'vw_inativos_fora_prime',
        'ativacao-com-orcamento': 'vw_inativos_com_orcamento',
        'ativacao-sem-orcamento': 'vw_inativos_sem_orcamento',
        'reativacao-1x': 'vw_reativacao_1x',
        'reativacao-2x': 'vw_reativacao_2x',
        'reativacao-3x': 'vw_reativacao_3x',
        'reativacao-3x-plus': 'vw_reativacao_3x_plus'
      };
      
      const viewName = viewMap[activeTab];
      if (!viewName) {
        console.warn(`⚠️ [FILTRO] View não encontrada para aba: ${activeTab}`);
        return;
      }
      
      console.log(`🔍 [FILTRO] Buscando TODAS as duplicatas da view: ${viewName}, filtro: ${filterType}`);
      
      // Primeiro, buscar IDs de duplicatas usando a view vw_ids_duplicados
      const { data: duplicateIdsData, error: idsError } = await supabase
        .schema('api')
        .schema('api')
        .from('vw_ids_duplicados')
        .select('id_cliente');
      
      if (idsError) {
        console.error('❌ [FILTRO] Erro ao buscar IDs de duplicatas:', idsError);
        throw idsError;
      }
      
      if (!duplicateIdsData || duplicateIdsData.length === 0) {
        console.log('✅ [FILTRO] Nenhuma duplicata encontrada no banco');
        setAllDataForTab([]);
        setTotalCount(0);
        return;
      }
      
      const duplicateIds = duplicateIdsData.map(row => row.id_cliente);
      console.log(`✅ [FILTRO] ${duplicateIds.length} IDs de duplicatas encontrados`);
      
      // Agora, buscar TODOS os registros da view atual que têm ID em duplicateIds (se "with-duplicates")
      // ou que NÃO têm ID em duplicateIds (se "no-duplicates")
      let query = supabase
        .schema('api')
        .from(viewName)
        .select('*', { count: 'exact' });
      
      // Aplicar filtros normais (unidade, vendedor, origem, etc.)
      query = applyFiltersToQuery(query);
      
      // Aplicar ordenação
      if (sortField) {
        query = query.order(sortField, { ascending: sortDirection === 'asc' });
      }
      
      if (filterType === 'with-duplicates') {
        // Buscar apenas registros que têm ID em duplicateIds
        // Usar .in() para filtrar por IDs de duplicatas
        query = query.in('id', duplicateIds);
      } else if (filterType === 'no-duplicates') {
        // Buscar apenas registros que NÃO têm ID em duplicateIds
        // Como não temos .notIn() direto, vamos buscar todos e filtrar depois
        // Ou usar uma subquery
        const { data: allData, error: allError } = await query;
        
        if (allError) {
          throw allError;
        }
        
        // Filtrar no frontend para remover IDs que estão em duplicateIds
        const filtered = (allData || []).filter(row => {
          const id = row.id || row.id_cliente || row.id_cliente_mestre;
          return id && !duplicateIds.includes(Number(id)) && !duplicateIds.includes(String(id));
        });
        
        console.log(`✅ [FILTRO] ${filtered.length} registros sem duplicatas carregados`);
        setAllDataForTab(filtered);
        setTotalCount(filtered.length);
        return;
      }
      
      // Para "with-duplicates", buscar todos os registros que têm duplicatas
      // Como pode ser muitos, vamos buscar em lotes se necessário
      const { data, error, count } = await query;
      
      if (error) {
        console.error(`❌ [FILTRO] Erro ao buscar duplicatas da view:`, error);
        throw error;
      }
      
      console.log(`✅ [FILTRO] ${data?.length || 0} registros com duplicatas carregados (total no banco: ${count || 0})`);
      
      // Armazenar todos os dados em allDataForTab para paginação frontend
      setAllDataForTab(data || []);
      setTotalCount(count || 0);
      
      // Também atualizar duplicatesData para destacar essas linhas em vermelho
      const newDuplicatesData = {};
      (data || []).forEach(row => {
        const id = String(row.id || row.id_cliente || row.id_cliente_mestre);
        if (id) {
          newDuplicatesData[id] = []; // Array vazio indica duplicatas
        }
      });
      setDuplicatesData(prev => ({ ...prev, ...newDuplicatesData }));
      
    } catch (error) {
      console.error('❌ [FILTRO] Erro ao carregar duplicatas do banco:', error);
      throw error;
    }
  };

  const loadAllDataForTab = async () => {
    const viewMap = {
      'ativacao-prime': 'vw_inativos_prime',
      'ativacao-fora-prime': 'vw_inativos_fora_prime',
      'ativacao-com-orcamento': 'vw_inativos_com_orcamento',
      'ativacao-sem-orcamento': 'vw_inativos_sem_orcamento',
      'reativacao-1x': 'vw_reativacao_1x',
      'reativacao-2x': 'vw_reativacao_2x',
      'reativacao-3x': 'vw_reativacao_3x',
      'reativacao-3x-plus': 'vw_reativacao_3x_plus'
    };
    
    const viewName = viewMap[activeTab];
    if (!viewName) return [];
    
    try {
      // Carregar TODOS os registros (sem paginação) aplicando apenas filtros básicos
      let query = supabase
        .schema('api')
        .from(viewName)
        .select('*');
      
      // Aplicar apenas filtros essenciais (origem, DDD, etc)
      query = applyFiltersToQuery(query);
      
      // Limitar a 10000 registros para não sobrecarregar
      const { data } = await query.limit(10000);
      
      console.log(`📊 [DUPLICADOS] Carregados ${data?.length || 0} registros da view ${viewName} para detecção de duplicatas`);
      
      return data || [];
    } catch (error) {
      console.error(`❌ [DUPLICADOS] Erro ao carregar todos os dados de ${viewName}:`, error);
      return [];
    }
  };

  // Carregar histórico de exportação quando dados mudarem
  useEffect(() => {
    const loadHistory = async () => {
      const ativacaoTabs = ['ativacao-prime', 'ativacao-fora-prime', 'ativacao-com-orcamento', 'ativacao-sem-orcamento'];
      const reativacaoTabs = ['reativacao-1x', 'reativacao-2x', 'reativacao-3x', 'reativacao-3x-plus'];
      const allTabs = [...ativacaoTabs, ...reativacaoTabs];
      if (!allTabs.includes(activeTab)) return;
      
      let data = [];
      switch (activeTab) {
        case 'ativacao-prime': data = ativacaoPrimeData; break;
        case 'ativacao-fora-prime': data = ativacaoForaPrimeData; break;
        case 'ativacao-com-orcamento': data = ativacaoComOrcamentoData; break;
        case 'ativacao-sem-orcamento': data = ativacaoSemOrcamentoData; break;
        case 'reativacao-1x': data = reativacao1xData; break;
        case 'reativacao-2x': data = reativacao2xData; break;
        case 'reativacao-3x': data = reativacao3xData; break;
        case 'reativacao-3x-plus': data = reativacao3xPlusData; break;
        default: return;
      }
      
      if (data.length > 0) {
        const leadIds = data.map(row => row.id || row.id_lead || row.id_cliente).filter(Boolean);
        if (leadIds.length > 0) {
          const history = await loadExportHistory(leadIds);
          setExportHistory(prev => ({ ...prev, ...history }));
        }
      }
    };
    loadHistory();
  }, [ativacaoPrimeData, ativacaoForaPrimeData, ativacaoComOrcamentoData, ativacaoSemOrcamentoData, reativacao1xData, reativacao2xData, reativacao3xData, reativacao3xPlusData, activeTab]);

  // Carregar TODAS as duplicatas de uma vez usando a view SQL
  // Isso permite que o destaque vermelho apareça imediatamente ao abrir a página
  const loadAllDuplicatesAtOnce = async () => {
    try {
      console.log('🔍 [DUPLICADOS] Carregando TODAS as duplicatas de uma vez via SQL...');
      
      // Usar a view vw_ids_duplicados para carregar todos os IDs de uma vez
      const { data: duplicateIds, error } = await supabase
        .schema('api')
        .schema('api')
        .from('vw_ids_duplicados')
        .select('id_cliente');
      
      if (error) {
        console.error('❌ [DUPLICADOS] Erro ao carregar IDs duplicados:', error);
        // Fallback: usar as views individuais
        await loadDuplicatesFromViews();
        return;
      }
      
      if (!duplicateIds || duplicateIds.length === 0) {
        console.log('✅ [DUPLICADOS] Nenhuma duplicata encontrada no banco');
        return;
      }
      
      console.log(`✅ [DUPLICADOS] ${duplicateIds.length} clientes com duplicatas encontrados`);
      
      // Criar objeto de duplicatas marcando todos os IDs encontrados
      // Para cada ID, vamos buscar os detalhes das duplicatas
      const newDuplicatesData = {};
      
      // Para cada ID duplicado, marcar como tendo duplicatas (array vazio por enquanto)
      // Os detalhes completos serão carregados sob demanda quando necessário
      duplicateIds.forEach(({ id_cliente }) => {
        const id = String(id_cliente);
        // Marcar como tendo duplicatas (será preenchido com detalhes quando necessário)
        if (!newDuplicatesData[id]) {
          newDuplicatesData[id] = []; // Array vazio indica que tem duplicatas, mas detalhes serão carregados sob demanda
        }
      });
      
      // Atualizar estado de uma vez
      setDuplicatesData(prev => {
        const updated = { ...prev };
        // Adicionar todos os IDs encontrados
        Object.keys(newDuplicatesData).forEach(id => {
          // Se já não existe ou está vazio, marcar como tendo duplicatas
          if (!updated[id] || updated[id].length === 0) {
            updated[id] = []; // Array vazio indica duplicatas (detalhes carregados sob demanda)
          }
        });
        console.log(`📊 [DUPLICADOS] Estado atualizado: ${Object.keys(updated).length} IDs marcados`);
        return updated;
      });
      
      console.log('✅ [DUPLICADOS] Todas as duplicatas carregadas e marcadas');
    } catch (error) {
      console.error('❌ [DUPLICADOS] Erro crítico ao carregar duplicatas:', error);
      // Fallback para método anterior
      await loadDuplicatesFromViews();
    }
  };

  // Fallback: carregar duplicatas das views individuais
  const loadDuplicatesFromViews = async () => {
    try {
      const [emailDups, phoneDups, cpfDups] = await Promise.all([
        supabase.schema('api').from('vw_dups_por_email').select('ids').limit(1000),
        supabase.schema('api').from('vw_dups_por_phone').select('ids').limit(1000),
        supabase.schema('api').from('vw_dups_por_cpf').select('ids').limit(1000)
      ]);
      
      const allIds = new Set();
      
      [emailDups.data, phoneDups.data, cpfDups.data].forEach(results => {
        results?.forEach(row => {
          if (row.ids && Array.isArray(row.ids)) {
            row.ids.forEach(id => allIds.add(String(id)));
          }
        });
      });
      
      const newDuplicatesData = {};
      allIds.forEach(id => {
        newDuplicatesData[id] = []; // Array vazio indica duplicatas
      });
      
      setDuplicatesData(prev => ({ ...prev, ...newDuplicatesData }));
      console.log(`✅ [DUPLICADOS] ${allIds.size} IDs duplicados carregados das views`);
    } catch (error) {
      console.error('❌ [DUPLICADOS] Erro no fallback:', error);
    }
  };

  // Carregar TODAS as duplicatas quando a página abre (ATIVAÇÃO E REATIVAÇÃO)
  useEffect(() => {
    const ativacaoTabs = ['ativacao-prime', 'ativacao-fora-prime', 'ativacao-com-orcamento', 'ativacao-sem-orcamento'];
    const reativacaoTabs = ['reativacao-1x', 'reativacao-2x', 'reativacao-3x', 'reativacao-3x-plus'];
    const allTabs = [...ativacaoTabs, ...reativacaoTabs];
    
    if (!allTabs.includes(activeTab)) return;
    
    // Carregar todas as duplicatas imediatamente ao abrir a aba
    // IMPORTANTE: Executar de forma assíncrona para não bloquear a renderização
    console.log(`🔍 [DUPLICADOS] Carregando todas as duplicatas para aba: ${activeTab} (ATIVAÇÃO/REATIVAÇÃO)...`);
    
    // Marcar como carregando
    setIsLoadingDuplicates(true);
    
    // Carregar duplicatas de forma assíncrona
    loadAllDuplicatesAtOnce()
      .then(() => {
        console.log(`✅ [DUPLICADOS] Duplicatas carregadas para aba: ${activeTab}`);
        setIsLoadingDuplicates(false);
      })
      .catch((error) => {
        console.error(`❌ [DUPLICADOS] Erro ao carregar duplicatas para aba: ${activeTab}`, error);
        setIsLoadingDuplicates(false);
      });
  }, [activeTab]); // Recarregar apenas quando mudar aba

  // ===== APLICAÇÃO DE FILTROS NAS CONSULTAS =====
  // Função auxiliar para aplicar filtros SprintHub
  const applySprinthubFiltersToQuery = async (query) => {
    // Se não há filtros SprintHub ativos, retornar query sem modificação
    if (sprinthubStatusFilter === 'all' && sprinthubLeadTagFilter === 'all' && !sprinthubDataEnvioInicio && !sprinthubDataEnvioFim) {
      return { query, shouldReturnEmpty: false };
    }

    let allSentIds = new Set();
    const hasSprinthubFilter = sprinthubStatusFilter === 'sent' || sprinthubStatusFilter === 'not-sent' || sprinthubLeadTagFilter !== 'all';

    if (hasSprinthubFilter) {
      if (sprinthubLeadTagFilter !== 'all') {
        // Buscar por tag específica
        let tagQuery = supabase
          .schema('api')
          .from('historico_exportacoes')
          .select('id_lead')
          .eq('tag_exportacao', buildSprinthubHistoryTagValue(sprinthubLeadTagFilter));
        
        if (sprinthubDataEnvioInicio) {
          const dataInicio = `${sprinthubDataEnvioInicio}T00:00:00`;
          tagQuery = tagQuery.gte('data_exportacao', dataInicio);
        }
        if (sprinthubDataEnvioFim) {
          const dataFim = `${sprinthubDataEnvioFim}T23:59:59`;
          tagQuery = tagQuery.lte('data_exportacao', dataFim);
        }
        
        const { data: tagData } = await tagQuery;
        (tagData || []).forEach(item => {
          if (item.id_lead) allSentIds.add(String(item.id_lead));
        });
      } else {
        // Buscar por tag que começa com SPRINTHUB ou é exatamente SPRINTHUB
        let tagQueries = [
          supabase.schema('api').from('historico_exportacoes').select('id_lead').ilike('tag_exportacao', 'SPRINTHUB%'),
          supabase.schema('api').from('historico_exportacoes').select('id_lead').eq('tag_exportacao', 'SPRINTHUB')
        ];
        
        // Aplicar filtros de data se existirem
        tagQueries = tagQueries.map(tagQuery => {
          let q = tagQuery;
          if (sprinthubDataEnvioInicio) {
            const dataInicio = `${sprinthubDataEnvioInicio}T00:00:00`;
            q = q.gte('data_exportacao', dataInicio);
          }
          if (sprinthubDataEnvioFim) {
            const dataFim = `${sprinthubDataEnvioFim}T23:59:59`;
            q = q.lte('data_exportacao', dataFim);
          }
          return q;
        });
        
        // Executar todas as queries e consolidar resultados
        const tagResults = await Promise.all(tagQueries.map(q => q));
        tagResults.forEach(({ data: tagData }) => {
          (tagData || []).forEach(item => {
            if (item.id_lead) allSentIds.add(String(item.id_lead));
          });
        });
        
        // Também buscar por motivo ou observação que contenha "sprinthub"
        let motivoQuery = supabase
          .schema('api')
          .from('historico_exportacoes')
          .select('id_lead')
          .ilike('motivo', '%sprinthub%');
        
        if (sprinthubDataEnvioInicio) {
          const dataInicio = `${sprinthubDataEnvioInicio}T00:00:00`;
          motivoQuery = motivoQuery.gte('data_exportacao', dataInicio);
        }
        if (sprinthubDataEnvioFim) {
          const dataFim = `${sprinthubDataEnvioFim}T23:59:59`;
          motivoQuery = motivoQuery.lte('data_exportacao', dataFim);
        }
        
        const { data: motivoData } = await motivoQuery;
        (motivoData || []).forEach(item => {
          if (item.id_lead) allSentIds.add(String(item.id_lead));
        });
        
        // Buscar por observação que contenha "sprinthub"
        let obsQuery = supabase
          .schema('api')
          .from('historico_exportacoes')
          .select('id_lead')
          .ilike('observacao', '%sprinthub%');
        
        if (sprinthubDataEnvioInicio) {
          const dataInicio = `${sprinthubDataEnvioInicio}T00:00:00`;
          obsQuery = obsQuery.gte('data_exportacao', dataInicio);
        }
        if (sprinthubDataEnvioFim) {
          const dataFim = `${sprinthubDataEnvioFim}T23:59:59`;
          obsQuery = obsQuery.lte('data_exportacao', dataFim);
        }
        
        const { data: obsData } = await obsQuery;
        (obsData || []).forEach(item => {
          if (item.id_lead) allSentIds.add(String(item.id_lead));
        });
      }
      
      const sprinthubSentIds = Array.from(allSentIds).map(id => Number(id)).filter(id => !isNaN(id));
      
      if (sprinthubStatusFilter === 'sent') {
        if (sprinthubSentIds.length === 0) {
          return { query, shouldReturnEmpty: true };
        }
        query = query.in('id', sprinthubSentIds);
      } else if (sprinthubStatusFilter === 'not-sent') {
        // Para "not-sent", precisamos buscar todos os IDs primeiro e depois filtrar no cliente
        // Retornar uma flag especial para indicar que precisa filtrar no cliente
        return { query, shouldReturnEmpty: false, sprinthubSentIds: Array.from(allSentIds) };
      }
    }
    
    return { query, shouldReturnEmpty: false };
  };

  const applyFiltersToQuery = (query) => {
    // Presença de campos
    if (filters.hasCpf) {
      query = query.not('cpf', 'is', null).neq('cpf', '');
    }
    if (filters.hasEmail) {
      query = query.not('email', 'is', null).neq('email', '');
    }
    if (filters.hasSexo) {
      query = query.not('sexo', 'is', null).neq('sexo', '');
    }
    if (filters.hasDataNascimento) {
      query = query.not('data_nascimento', 'is', null);
    }
    // Telefone: considerar whatsapp ou telefone
    if (filters.phoneStatus === 'has') {
      query = query.or('whatsapp.not.is.null,telefone.not.is.null');
    } else if (filters.phoneStatus === 'none') {
      query = query.and('whatsapp.is.null,telefone.is.null');
    }
    // DDD: tenta filtrar por whatsapp ou telefone iniciando com DDD
    if (filters.ddd && filters.ddd.length === 2) {
      const d = filters.ddd;
      query = query.or(`whatsapp.ilike.${d}%,telefone.ilike.${d}%`);
    }
    // Origens: quando existir coluna array origem_marcas
    if (filters.origins && filters.origins.length > 0) {
      if (query.overlaps) {
        const expanded = new Set();
        filters.origins.forEach(o => {
          if (o === 'greatpage') { expanded.add('greatpage'); expanded.add('google'); }
          else if (o === 'sprint') { expanded.add('sprint'); expanded.add('sprinthub'); }
          else { expanded.add(o); }
        });
        query = query.overlaps('origem_marcas', Array.from(expanded));
      }
    }
    return query;
  };

  // Filtro cliente para endereço quando existir o campo
  const filterClientSideIfNeeded = (rows) => {
    if (!filters.hasEndereco) return rows;
    return rows.filter(r => {
      const rua = r.endereco || r.endereco_completo || r.endereco_rua || r.logradouro;
      const cidadeEstado = (r.cidade && String(r.cidade).trim() !== '') && (r.estado && String(r.estado).trim() !== '');
      const temRua = rua && String(rua).trim() !== '';
      return temRua || cidadeEstado;
    });
  };

  // ===== DDDs disponíveis (amostragem leve do banco) =====
  const parseDDD = (phone) => {
    if (!phone) return null;
    const digits = String(phone).replace(/\D/g, '');
    if (!digits) return null;
    // Remove prefixo 55 se existir
    const cleaned = digits.startsWith('55') ? digits.slice(2) : digits;
    if (cleaned.length < 10) return null;
    return cleaned.slice(0, 2);
  };

  const collectDDDsFromRows = (rows, set) => {
    rows.forEach(r => {
      const d1 = parseDDD(r.whatsapp);
      const d2 = parseDDD(r.telefone);
      if (d1) set.add(d1);
      if (d2) set.add(d2);
    });
  };

  const loadAvailableDDDs = async () => {
    try {
      const limit = 2000; // amostragem leve por view
      const views = [
        'vw_inativos_prime', 'vw_inativos_fora_prime', 'vw_inativos_com_orcamento', 'vw_inativos_sem_orcamento',
        'vw_reativacao_1x', 'vw_reativacao_2x', 'vw_reativacao_3x', 'vw_reativacao_3x_plus'
      ];
      const requests = views.map(v => supabase.schema('api').from(v).select('whatsapp,telefone').limit(limit));
      const responses = await Promise.all(requests);
      const set = new Set();
      responses.forEach(({ data }) => { if (Array.isArray(data)) collectDDDsFromRows(data, set); });
      const ddds = Array.from(set).sort().slice(0, 50);
      setDddOptions(ddds);
    } catch (e) {
      console.error('Erro ao carregar DDDs:', e);
    }
  };

  const loadTabData = async () => {
    setIsLoading(true);
    try {
      switch (activeTab) {
        case 'dashboard': await loadDashboard(); break;
        case 'dashboard-sprint': await loadDashboardSprint(); break;
        case 'dashboard-prime': await loadDashboardPrime(); break;
        case 'completude': await loadCompletude(); break;
        case 'origens': await loadOrigens(); break;
        case 'falta-prime': await loadFaltaNoPrime(); break;
        case 'falta-sprint': await loadFaltaNoSprint(); break;
        case 'duplicados': await loadDuplicados(); break;
        case 'qualidade': await loadQualidade(); break;
        case 'baixa-qualidade': await loadBaixaQualidade(); break;
        case 'aniversariantes-mes': await loadAniversariantesMes(); break;
        case 'aniversariantes-proximos': await loadAniversariantesProximos(); break;
        case 'sem-cpf': await loadSemCpf(); break;
        case 'sem-email': await loadSemEmail(); break;
        case 'sem-contato': await loadSemContato(); break;
        case 'distribuicao-geo': await loadDistribuicaoGeo(); break;
        case 'top-cidades': await loadTopCidades(); break;
        case 'completos-alcancaveis': await loadCompletosAlcancaveis(); break;
        case 'dados-essenciais': await loadDadosEssenciais(); break;
        case 'atualizacoes-7dias': await loadAtualizacoes7Dias(); break;
        case 'atualizacoes-30dias': await loadAtualizacoes30Dias(); break;
        case 'executivo': await loadExecutivo(); break;
        // Gestão de Clientes
        case 'dashboard-gestao': await loadDashboardGestao(); break;
        case 'validacao-integridade': await loadValidacaoIntegridade(); break;
        // Ativação (Nunca Compraram)
        case 'ativacao-geral': await loadAtivacaoGeral(); break;
        case 'ativacao-prime': await loadAtivacaoPrime(); break;
        case 'ativacao-fora-prime': await loadAtivacaoForaPrime(); break;
        case 'ativacao-com-orcamento': await loadAtivacaoComOrcamento(); break;
        case 'ativacao-sem-orcamento': await loadAtivacaoSemOrcamento(); break;
        // Reativação (90+ dias)
        case 'reativacao-geral': await loadReativacaoGeral(); break;
        case 'reativacao-1x': await loadReativacao1x(); break;
        case 'reativacao-2x': await loadReativacao2x(); break;
        case 'reativacao-3x': await loadReativacao3x(); break;
        case 'reativacao-3x-plus': await loadReativacao3xPlus(); break;
        // Monitoramento (0-90 dias)
        case 'monitoramento-geral': await loadMonitoramentoGeral(); break;
        case 'monitoramento-1-29': await loadMonitoramento129(); break;
        case 'monitoramento-30-59': await loadMonitoramento3059(); break;
        case 'monitoramento-60-90': await loadMonitoramento6090(); break;
        case 'monitoramento-d45': await loadMonitoramentoD45(); break;
        case 'monitoramento-d60': await loadMonitoramentoD60(); break;
        case 'monitoramento-d75': await loadMonitoramentoD75(); break;
        case 'monitoramento-d90': await loadMonitoramentoD90(); break;
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // ===== FUNÇÕES DE CARREGAMENTO =====

  const loadDashboard = async () => {
    try {
      const { data } = await supabase.schema('api').from('dashboard_principal').select('*');
      setDashboardData(data || []);
    } catch (error) {
      console.error('Erro ao carregar dashboard:', error);
      setDashboardData([]);
    }
  };

  const loadDashboardSprint = async () => {
    try {
      const { data } = await supabase.schema('api').from('dashboard_sprint').select('*').single();
      setDashboardSprintData(data);
    } catch (error) {
      console.error('Erro ao carregar dashboard sprint:', error);
      setDashboardSprintData(null);
    }
  };

  const loadDashboardPrime = async () => {
    try {
      const { data } = await supabase.schema('api').from('dashboard_prime').select('*').single();
      setDashboardPrimeData(data);
    } catch (error) {
      console.error('Erro ao carregar dashboard prime:', error);
      setDashboardPrimeData(null);
    }
  };

  const loadCompletude = async () => {
    try {
      const { data } = await supabase.schema('api').from('stats_completude_dados').select('*').single();
      setCompletudeData(data);
    } catch (error) {
      console.error('Erro ao carregar completude:', error);
      setCompletudeData(null);
    }
  };

  const loadOrigens = async () => {
    try {
      const { data } = await supabase.schema('api').from('stats_por_origem').select('*').single();
      setOrigensData(data);
    } catch (error) {
      console.error('Erro ao carregar origens:', error);
      setOrigensData(null);
    }
  };

  const loadFaltaNoPrime = async () => {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage - 1;
    let query = supabase
      .from('clientes_apenas_sprint')
      .select('*', { count: 'exact' });
    query = applyFiltersToQuery(query);
    if (sortField) {
      query = query.order(sortField, { ascending: sortDirection === 'asc' });
    } else {
      query = query.order('qualidade_dados', { ascending: false });
    }
    const { data, count } = await query.range(start, end);
    setFaltaNoPrimeData(filterClientSideIfNeeded(data || []));
    setTotalCount(count || 0);
  };

  const loadFaltaNoSprint = async () => {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage - 1;
    let query = supabase
      .from('clientes_apenas_prime')
      .select('*', { count: 'exact' });
    query = applyFiltersToQuery(query);
    if (sortField) {
      query = query.order(sortField, { ascending: sortDirection === 'asc' });
    } else {
      query = query.order('qualidade_dados', { ascending: false });
    }
    const { data, count } = await query.range(start, end);
    setFaltaNoSprintData(filterClientSideIfNeeded(data || []));
    setTotalCount(count || 0);
  };

  const loadDuplicados = async () => {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage - 1;
    const viewMap = {
      cpf: 'vw_dups_por_cpf',
      email: 'vw_dups_por_email',
      phone: 'vw_dups_por_phone'
    };
    const viewName = viewMap[dupType] || 'vw_dups_por_email';
    const { data, count } = await supabase.from(viewName).select('*', { count: 'exact' }).range(start, end);
    setDuplicadosData(data || []);
    setTotalCount(count || 0);
  };

  useEffect(() => {
    // quando trocar o tipo de duplicado dentro da aba, recarrega
    if (activeTab === 'duplicados') {
      loadDuplicados();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dupType, currentPage]);

  const openDupDetails = async (ids) => {
    try {
      setDupModalIds(ids);
      setDupModalOpen(true);
      const { data } = await supabase
        .from('clientes_mestre')
        .select('*')
        .in('id', ids);
      setDupModalRows(data || []);
    } catch (e) {
      console.error('Erro ao carregar detalhes dos duplicados:', e);
      setDupModalRows([]);
    }
  };

  const loadQualidade = async () => {
    const { data } = await supabase.schema('api').from('relatorio_qualidade').select('*');
    setQualidadeData(data || []);
  };

  const loadBaixaQualidade = async () => {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage - 1;
    const { data, count } = await supabase
      .schema('api')
      .from('clientes_baixa_qualidade')
      .select('*', { count: 'exact' })
      .range(start, end);
    setBaixaQualidadeData(data || []);
    setTotalCount(count || 0);
  };

  const loadAniversariantesMes = async () => {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage - 1;
    const { data, count } = await supabase
      .schema('api')
      .from('aniversariantes_mes')
      .select('*', { count: 'exact' })
      .range(start, end);
    setAniversariantesMesData(data || []);
    setTotalCount(count || 0);
  };

  const loadAniversariantesProximos = async () => {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage - 1;
    const { data, count } = await supabase
      .schema('api')
      .from('aniversariantes_proximos_30_dias')
      .select('*', { count: 'exact' })
      .range(start, end);
    setAniversariantesProximosData(data || []);
    setTotalCount(count || 0);
  };

  const loadSemCpf = async () => {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage - 1;
    const { data, count } = await supabase
      .from('clientes_sem_cpf')
      .select('*', { count: 'exact' })
      .range(start, end);
    setSemCpfData(data || []);
    setTotalCount(count || 0);
  };

  const loadSemEmail = async () => {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage - 1;
    const { data, count } = await supabase
      .from('clientes_sem_email')
      .select('*', { count: 'exact' })
      .range(start, end);
    setSemEmailData(data || []);
    setTotalCount(count || 0);
  };

  const loadSemContato = async () => {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage - 1;
    const { data, count } = await supabase
      .from('clientes_sem_contato')
      .select('*', { count: 'exact' })
      .range(start, end);
    setSemContatoData(data || []);
    setTotalCount(count || 0);
  };

  const loadDistribuicaoGeo = async () => {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage - 1;
    const { data, count } = await supabase
      .from('distribuicao_geografica')
      .select('*', { count: 'exact' })
      .range(start, end);
    setDistribuicaoGeoData(data || []);
    setTotalCount(count || 0);
  };

  const loadTopCidades = async () => {
    const { data } = await supabase.from('top_cidades').select('*');
    setTopCidadesData(data || []);
  };

  const loadCompletosAlcancaveis = async () => {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage - 1;
    const { data, count } = await supabase
      .from('clientes_completos_alcancaveis')
      .select('*', { count: 'exact' })
      .range(start, end);
    setCompletosAlcancaveisData(data || []);
    setTotalCount(count || 0);
  };

  const loadDadosEssenciais = async () => {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage - 1;
    const { data, count } = await supabase
      .from('clientes_dados_essenciais')
      .select('*', { count: 'exact' })
      .range(start, end);
    setDadosEssenciaisData(data || []);
    setTotalCount(count || 0);
  };

  const loadAtualizacoes7Dias = async () => {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage - 1;
    const { data, count } = await supabase
      .from('atualizacoes_recentes_7dias')
      .select('*', { count: 'exact' })
      .range(start, end);
    setAtualizacoes7DiasData(data || []);
    setTotalCount(count || 0);
  };

  const loadAtualizacoes30Dias = async () => {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage - 1;
    const { data, count } = await supabase
      .from('atualizacoes_recentes_30dias')
      .select('*', { count: 'exact' })
      .range(start, end);
    setAtualizacoes30DiasData(data || []);
    setTotalCount(count || 0);
  };

  const loadExecutivo = async () => {
    const { data } = await supabase.schema('api').from('relatorio_executivo').select('*');
    setExecutivoData(data || []);
  };

  // ===== FUNÇÕES DE CARREGAMENTO - GESTÃO DE CLIENTES =====

  const loadDashboardGestao = async () => {
    const { data } = await supabase.schema('api').from('vw_dashboard_reativacao').select('*').single();
    setDashboardGestaoData(data);
  };

  const loadValidacaoIntegridade = async () => {
    const { data } = await supabase.schema('api').from('vw_validacao_integridade').select('*');
    setValidacaoIntegridadeData(data || []);
  };

  // ===== FUNÇÕES DE CARREGAMENTO - ATIVAÇÃO (NUNCA COMPRARAM) =====

  const loadAtivacaoGeral = async () => {
    const { data } = await supabase.schema('api').from('vw_dashboard_reativacao').select('*').single();
    setAtivacaoGeralData(data);
  };

  // Carrega total de duplicados (clientes presentes em múltiplas origens)
  const loadDuplicadosCount = async () => {
    try {
      const { count, error } = await supabase
        .schema('api')
        .from('relatorio_duplicados')
        .select('*', { count: 'exact', head: true });
      if (error) throw error;
      setDuplicadosCount(count || 0);
    } catch (e) {
      console.error('Erro ao carregar duplicados:', { message: e?.message, details: e?.details, hint: e?.hint, code: e?.code });
      setDuplicadosCount(0);
    }
  };

  useEffect(() => {
    loadDuplicadosCount();
  }, []);

  // Função helper para ordenar: Exportado DESC → Nome ASC
  const sortByExportedThenName = (data) => {
    return data.sort((a, b) => {
      const leadIdA = a.id || a.id_lead || a.id_cliente;
      const leadIdB = b.id || b.id_lead || b.id_cliente;

      const hasExportA = exportHistory[leadIdA]?.length > 0 ? 1 : 0;
      const hasExportB = exportHistory[leadIdB]?.length > 0 ? 1 : 0;

      // Primeiro critério: exportado (DESC - exportados primeiro)
      if (hasExportB !== hasExportA) {
        return hasExportB - hasExportA;
      }

      // Segundo critério: nome (ASC - alfabética)
      const nomeA = (a.nome_completo || '').toLowerCase();
      const nomeB = (b.nome_completo || '').toLowerCase();
      return nomeA.localeCompare(nomeB, 'pt-BR');
    });
  };

  // Função para calcular critérios de qualidade detalhados
  const calculateQualityCriteria = (client) => {
    const criteria = [
      {
        label: 'Email preenchido',
        check: !!client.email && client.email.trim().length > 0,
        value: client.email || '—'
      },
      {
        label: 'CPF válido',
        check: !!client.cpf && client.cpf.trim().length >= 11,
        value: client.cpf || '—'
      },
      {
        label: 'WhatsApp preenchido',
        check: !!client.whatsapp && client.whatsapp.trim().length > 0,
        value: client.whatsapp || '—'
      },
      {
        label: 'Telefone preenchido',
        check: !!client.telefone && client.telefone.trim().length > 0,
        value: client.telefone || '—'
      },
      {
        label: 'Data de nascimento preenchida',
        check: !!client.data_nascimento,
        value: client.data_nascimento ? new Date(client.data_nascimento).toLocaleDateString('pt-BR') : '—'
      },
      {
        label: 'Endereço completo',
        check: !!client.rua && !!client.cidade && !!client.estado && !!client.cep,
        value: [client.rua, client.numero, client.bairro, client.cidade, client.estado, client.cep]
          .filter(Boolean)
          .join(', ') || '—'
      }
    ];

    const totalCriteria = criteria.length;
    const metCriteria = criteria.filter(c => c.check).length;
    const percentual = Math.round((metCriteria / totalCriteria) * 100);

    return { criteria, totalCriteria, metCriteria, percentual };
  };

  // Renderizar badge de qualidade clicável
  const renderQualityBadge = (row) => {
    const score = row.qualidade_dados || 0;
    const qualityClass = score >= 80 ? 'high' : score >= 60 ? 'medium' : 'low';

    return (
      <span
        className={`cc-quality-badge cc-quality-${qualityClass}`}
        onClick={() => {
          setSelectedQualityClient(row);
          setShowQualityModal(true);
        }}
        style={{ cursor: 'pointer' }}
      >
        {score}/100
      </span>
    );
  };

  // Função para detectar duplicatas de um cliente (GLOBAL - independente de filtros)
  // IMPORTANTE: Esta função é chamada sob demanda quando necessário (ex: ao clicar no ícone)
  const detectDuplicates = async (client) => {
    try {
      const clientId = client.id || client.id_cliente || client.id_cliente_mestre;
      if (!clientId) return [];
      
      // Se já temos duplicatas carregadas para este cliente, retornar
      const clientIdStr = String(clientId);
      if (duplicatesData[clientIdStr] !== undefined) {
        // Se está marcado como tendo duplicatas mas array está vazio, carregar detalhes
        if (duplicatesData[clientIdStr].length === 0) {
          // Carregar detalhes das duplicatas
          return await loadDuplicateDetails(client);
        }
        return duplicatesData[clientIdStr];
      }

      const duplicates = [];
      const checkedIds = new Set([clientId]);

      // Normalizar dados do cliente atual
      const normEmail = client.email?.toLowerCase().trim();
      const normCpf = client.cpf?.replace(/\D/g, '');
      const normWhatsapp = client.whatsapp?.replace(/\D/g, '');
      const normTelefone = client.telefone?.replace(/\D/g, '');

      // Buscar duplicatas por CPF (REMOVIDO .eq('ativo', true) para buscar TODOS)
      if (normCpf && normCpf.length >= 11) {
        const { data } = await supabase
          .schema('api')
          .from('clientes_mestre')
          .select('*')
          .neq('id', clientId)
          .ilike('cpf', `%${normCpf}%`)
          // REMOVIDO: .eq('ativo', true) - buscar TODOS os duplicados independente de status
          .limit(10);

        data?.forEach(dup => {
          if (!checkedIds.has(dup.id)) {
            duplicates.push({ ...dup, matchField: 'CPF', matchValue: normCpf });
            checkedIds.add(dup.id);
          }
        });
      }

      // Buscar duplicatas por Email (REMOVIDO .eq('ativo', true) para buscar TODOS)
      if (normEmail && normEmail.length > 3) {
        const { data } = await supabase
          .schema('api')
          .from('clientes_mestre')
          .select('*')
          .neq('id', clientId)
          .ilike('email', normEmail)
          // REMOVIDO: .eq('ativo', true) - buscar TODOS os duplicados independente de status
          .limit(10);

        data?.forEach(dup => {
          if (!checkedIds.has(dup.id)) {
            duplicates.push({ ...dup, matchField: 'Email', matchValue: normEmail });
            checkedIds.add(dup.id);
          }
        });
      }

      // Buscar duplicatas por WhatsApp (REMOVIDO .eq('ativo', true) para buscar TODOS)
      if (normWhatsapp && normWhatsapp.length >= 10) {
        const { data } = await supabase
          .schema('api')
          .from('clientes_mestre')
          .select('*')
          .neq('id', clientId)
          .or(`whatsapp.ilike.%${normWhatsapp}%,telefone.ilike.%${normWhatsapp}%`)
          // REMOVIDO: .eq('ativo', true) - buscar TODOS os duplicados independente de status
          .limit(10);

        data?.forEach(dup => {
          if (!checkedIds.has(dup.id)) {
            duplicates.push({ ...dup, matchField: 'WhatsApp', matchValue: normWhatsapp });
            checkedIds.add(dup.id);
          }
        });
      }

      // Buscar duplicatas por Telefone (REMOVIDO .eq('ativo', true) para buscar TODOS)
      if (normTelefone && normTelefone.length >= 10 && normTelefone !== normWhatsapp) {
        const { data } = await supabase
          .schema('api')
          .from('clientes_mestre')
          .select('*')
          .neq('id', clientId)
          .or(`telefone.ilike.%${normTelefone}%,whatsapp.ilike.%${normTelefone}%`)
          // REMOVIDO: .eq('ativo', true) - buscar TODOS os duplicados independente de status
          .limit(10);

        data?.forEach(dup => {
          if (!checkedIds.has(dup.id)) {
            duplicates.push({ ...dup, matchField: 'Telefone', matchValue: normTelefone });
            checkedIds.add(dup.id);
          }
        });
      }

      return duplicates;
    } catch (error) {
      console.error('Erro ao detectar duplicatas:', error);
      return [];
    }
  };

  // Carregar detalhes das duplicatas para um cliente específico
  const loadDuplicateDetails = async (client) => {
    try {
      const clientId = client.id || client.id_cliente || client.id_cliente_mestre;
      if (!clientId) return [];
      
      const duplicates = [];
      const checkedIds = new Set([clientId]);

      // Normalizar dados do cliente atual
      const normEmail = client.email?.toLowerCase().trim();
      const normCpf = client.cpf?.replace(/\D/g, '');
      const normWhatsapp = client.whatsapp?.replace(/\D/g, '');
      const normTelefone = client.telefone?.replace(/\D/g, '');

      // Buscar duplicatas por CPF
      if (normCpf && normCpf.length >= 11) {
        const { data } = await supabase
          .schema('api')
          .from('clientes_mestre')
          .select('*')
          .neq('id', clientId)
          .ilike('cpf', `%${normCpf}%`)
          .limit(10);

        data?.forEach(dup => {
          if (!checkedIds.has(dup.id)) {
            duplicates.push({ ...dup, matchField: 'CPF', matchValue: normCpf });
            checkedIds.add(dup.id);
          }
        });
      }

      // Buscar duplicatas por Email
      if (normEmail && normEmail.length > 3) {
        const { data } = await supabase
          .schema('api')
          .from('clientes_mestre')
          .select('*')
          .neq('id', clientId)
          .ilike('email', normEmail)
          .limit(10);

        data?.forEach(dup => {
          if (!checkedIds.has(dup.id)) {
            duplicates.push({ ...dup, matchField: 'Email', matchValue: normEmail });
            checkedIds.add(dup.id);
          }
        });
      }

      // Buscar duplicatas por WhatsApp
      if (normWhatsapp && normWhatsapp.length >= 10) {
        const { data } = await supabase
          .schema('api')
          .from('clientes_mestre')
          .select('*')
          .neq('id', clientId)
          .or(`whatsapp.ilike.%${normWhatsapp}%,telefone.ilike.%${normWhatsapp}%`)
          .limit(10);

        data?.forEach(dup => {
          if (!checkedIds.has(dup.id)) {
            duplicates.push({ ...dup, matchField: 'WhatsApp', matchValue: normWhatsapp });
            checkedIds.add(dup.id);
          }
        });
      }

      // Buscar duplicatas por Telefone
      if (normTelefone && normTelefone.length >= 10 && normTelefone !== normWhatsapp) {
        const { data } = await supabase
          .schema('api')
          .from('clientes_mestre')
          .select('*')
          .neq('id', clientId)
          .or(`telefone.ilike.%${normTelefone}%,whatsapp.ilike.%${normTelefone}%`)
          .limit(10);

        data?.forEach(dup => {
          if (!checkedIds.has(dup.id)) {
            duplicates.push({ ...dup, matchField: 'Telefone', matchValue: normTelefone });
            checkedIds.add(dup.id);
          }
        });
      }

      // Atualizar estado com detalhes
      const clientIdStr = String(clientId);
      setDuplicatesData(prev => ({ ...prev, [clientIdStr]: duplicates }));
      
      return duplicates;
    } catch (error) {
      console.error('Erro ao carregar detalhes das duplicatas:', error);
      return [];
    }
  };

  // Carregar duplicatas para todos os clientes visíveis (automático e silencioso)
  const loadDuplicatesForClients = async (clients) => {
    if (clients.length === 0) return;
    
    try {
      setIsLoadingDuplicates(true);
      let newDuplicatesData = {};

      console.log(`🔍 [DUPLICADOS] Detectando duplicatas em ${clients.length} clientes (background)...`);
      let duplicatesFound = 0;

      // Processar em lotes para não bloquear a UI
      const batchSize = 20;
      for (let i = 0; i < clients.length; i += batchSize) {
        const batch = clients.slice(i, i + batchSize);
        
        // Usar Promise.allSettled para não quebrar se algum falhar
        const results = await Promise.allSettled(
          batch.map(async (client) => {
            // Normalizar ID para sempre usar string (garante correspondência)
            const rawId = client.id || client.id_cliente || client.id_cliente_mestre;
            const clientId = rawId ? String(rawId) : null;
            
            if (!clientId) {
              return { success: true, clientId: null, skipped: true, reason: 'no_id' };
            }
            
            // Verificar se o cliente já foi verificado (existe no objeto duplicatesData)
            // IMPORTANTE: Verificar se existe no objeto, não apenas se tem duplicatas
            const wasChecked = duplicatesData.hasOwnProperty(clientId);
            
            if (!wasChecked) {
              try {
                const dups = await detectDuplicates(client);
                // IMPORTANTE: Marcar TODOS os clientes verificados no estado (mesmo sem duplicatas)
                // Isso permite que o filtro saiba quais clientes já foram verificados
                // SEMPRE usar string para garantir correspondência
                newDuplicatesData[clientId] = dups; // Array vazio se não tiver duplicatas
                if (dups.length > 0) {
                  duplicatesFound++;
                  return { success: true, clientId, dups };
                }
                return { success: true, clientId, dups: [] };
              } catch (error) {
                // Silenciosamente logar erro, mas não quebrar o fluxo
                console.warn(`⚠️ [DUPLICADOS] Erro ao detectar duplicatas para cliente ${clientId}:`, error.message);
                return { success: false, clientId, error: error.message };
              }
            } else {
              // Se já foi verificado, manter no resultado atual (não reprocessar)
              const existingDups = duplicatesData[clientId] || [];
              if (existingDups.length > 0) {
                duplicatesFound++;
              }
              // Não adicionar ao newDuplicatesData pois já existe
              return { success: true, clientId, skipped: true, reason: 'already_checked' };
            }
            return { success: true, clientId, skipped: true };
          })
        );
        
        // Log de resultados se houver falhas (apenas em dev)
        const failures = results.filter(r => r.status === 'rejected' || (r.value && !r.value.success));
        if (failures.length > 0 && process.env.NODE_ENV === 'development') {
          console.warn(`⚠️ [DUPLICADOS] ${failures.length} clientes falharam na verificação`);
        }
        
        // Atualizar estado incrementalmente para melhor UX
        // IMPORTANTE: Atualizar mesmo se não tiver duplicatas encontradas
        // porque isso marca os clientes como "verificados" para o filtro
        if (Object.keys(newDuplicatesData).length > 0) {
          setDuplicatesData(prev => {
            const updated = { ...prev, ...newDuplicatesData };
            // Log para debug - verificar se está atualizando corretamente
            if (process.env.NODE_ENV === 'development') {
              const withDups = Object.values(updated).filter(v => v && v.length > 0).length;
              const total = Object.keys(updated).length;
              console.log(`📊 [DUPLICADOS] Estado atualizado: ${withDups} com duplicatas de ${total} verificados`);
            }
            return updated;
          });
          // Limpar para próxima iteração
          newDuplicatesData = {};
        }
        
        // Pequena pausa para não sobrecarregar
        if (i + batchSize < clients.length) {
          await new Promise(resolve => setTimeout(resolve, 50));
        }
      }

      // Atualizar estado final
      if (Object.keys(newDuplicatesData).length > 0) {
        setDuplicatesData(prev => {
          const updated = { ...prev, ...newDuplicatesData };
          console.log(`📊 [DUPLICADOS] Estado atualizado:`, {
            antes: Object.keys(prev).length,
            novos: Object.keys(newDuplicatesData).length,
            depois: Object.keys(updated).length,
            comDuplicatas: Object.values(updated).filter(v => v && v.length > 0).length,
            semDuplicatas: Object.values(updated).filter(v => !v || v.length === 0).length
          });
          return updated;
        });
      }

      console.log(`✅ [DUPLICADOS] Total: ${duplicatesFound} cliente(s) com duplicatas detectado(s) de ${clients.length} verificados`);
    } catch (error) {
      // Capturar erros globais e não quebrar a UI
      console.error('❌ [DUPLICADOS] Erro crítico na detecção:', error);
    } finally {
      setIsLoadingDuplicates(false);
    }
    
    // SEM alertas - funciona silenciosamente em background
  };

  // Função para aplicar paginação no frontend (quando filtros de duplicatas estão ativos)
  const applyPagination = (data, page, pageSize) => {
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    return {
      paginated: data.slice(start, end),
      total: data.length,
      totalPages: Math.ceil(data.length / pageSize)
    };
  };

  // Estado para armazenar TODOS os dados quando filtro de duplicatas está ativo
  const [allDataForTab, setAllDataForTab] = useState([]);

  // Função helper para aplicar filtros e paginação corretamente
  const getFilteredAndPaginatedData = (currentData) => {
    // Se filtro de duplicatas está ativo, usar dados completos
    if (duplicatesFilter !== 'all' && allDataForTab.length > 0) {
      // Verificar se ainda está carregando duplicatas
      // Se ainda está carregando e não temos dados verificados suficientes, retornar array vazio
      const totalData = allDataForTab.length;
      const verifiedCount = Object.keys(duplicatesData).length;
      const verificationProgress = verifiedCount / totalData;
      
      console.log(`🔍 [GET_FILTERED] Verificação: ${verifiedCount}/${totalData} (${Math.round(verificationProgress * 100)}%)`);
      
      // Se menos de 90% foi verificado e ainda está carregando, retornar vazio
      // Isso mostra que ainda está carregando
      if (isLoadingDuplicates && verificationProgress < 0.9) {
        console.log(`⏳ [GET_FILTERED] Ainda verificando duplicatas... aguardando mais dados`);
        return []; // Retorna vazio para mostrar loading
      }
      
      console.log(`🔍 [GET_FILTERED] Usando dados completos (${allDataForTab.length} registros), filtro: ${duplicatesFilter}`);
      console.log(`🔍 [GET_FILTERED] Estado duplicatesData:`, verifiedCount, 'clientes verificados');
      
      // Aplicar filtros nos dados completos
      let filtered = filterRowsByNameStatus(allDataForTab);
      filtered = filterRowsByDuplicates(filtered);
      
      console.log(`🔍 [GET_FILTERED] Após filtros: ${filtered.length} registros`);
      
      // Atualizar totalCount para paginação funcionar
      const filteredTotal = filtered.length;
      if (filteredTotal !== totalCount) {
        setTotalCount(filteredTotal);
        // Se a página atual ficou vazia após filtrar, voltar para página 1
        const maxPage = Math.ceil(filteredTotal / itemsPerPage);
        if (currentPage > maxPage && maxPage > 0) {
          setCurrentPage(1);
        }
      }
      
      // Aplicar paginação no frontend
      const pagination = applyPagination(filtered, currentPage, itemsPerPage);
      console.log(`🔍 [GET_FILTERED] Paginação: página ${currentPage} de ${pagination.totalPages}, mostrando ${pagination.paginated.length} registros`);
      return pagination.paginated;
    }
    
    // Sem filtro de duplicatas, usar dados paginados do backend normalmente
    let filtered = filterRowsByNameStatus(currentData);
    filtered = filterRowsByDuplicates(filtered);
    return filtered;
  };

  // Função para filtrar dados por duplicatas
  const filterRowsByDuplicates = (data) => {
    // Se filtro é "all", retornar todos sem filtrar
    if (duplicatesFilter === 'all') {
      return data;
    }

    // Contar quantos têm duplicatas antes de filtrar (para debug)
    let withDups = 0;
    let withoutDups = 0;
    let noId = 0;
    let notChecked = 0; // Clientes que ainda não foram verificados
    
    const filtered = data.filter(row => {
      // Normalizar ID para sempre usar string (garante correspondência)
      const rawId = row.id || row.id_cliente || row.id_cliente_mestre;
      const clientId = rawId ? String(rawId) : null;
      
      if (!clientId) {
        noId++;
        // Se não tem ID, excluir do resultado quando filtro é "with-duplicates"
        if (duplicatesFilter === 'with-duplicates') {
          return false;
        }
        // Para "no-duplicates", incluir se não tem ID
        return true;
      }
      
      // Verificar se tem duplicatas no estado global
      // IMPORTANTE: duplicatesData é um objeto { clientId: [duplicates] }
      // IDs sempre são strings no duplicatesData (normalizados ao salvar)
      // IMPORTANTE: Array vazio [] também indica duplicatas (marcado mas detalhes não carregados)
      const wasChecked = duplicatesData.hasOwnProperty(clientId);
      
      // Pegar o valor
      // Se foi verificado e tem array (vazio ou não), significa que foi marcado
      // Array vazio [] = marcado como tendo duplicatas (detalhes serão carregados sob demanda)
      // Array com itens = tem duplicatas com detalhes carregados
      const duplicatesArray = wasChecked ? duplicatesData[clientId] : null;
      const hasDuplicates = wasChecked && Array.isArray(duplicatesArray); // Qualquer array = tem duplicatas
      
      if (!wasChecked) {
        notChecked++;
        // Se ainda não foi verificado:
        // - Para "with-duplicates": EXCLUIR (só mostrar se confirmar que tem)
        // - Para "no-duplicates": INCLUIR (assumir que não tem até confirmar que tem)
        if (duplicatesFilter === 'with-duplicates') {
          return false; // Não mostrar se ainda não foi verificado
        } else {
          // Para "no-duplicates", incluir clientes não verificados (assumir que não têm duplicatas)
          return true;
        }
      }
      
      if (hasDuplicates) {
        withDups++;
        // Se filtro é "with-duplicates", INCLUIR
        // Se filtro é "no-duplicates", EXCLUIR
        return duplicatesFilter === 'with-duplicates';
      } else {
        withoutDups++;
        // Se filtro é "with-duplicates", EXCLUIR
        // Se filtro é "no-duplicates", INCLUIR
        return duplicatesFilter === 'no-duplicates';
      }
    });
    
    // Log detalhado para debug
    console.log(`🔍 [FILTRO DUPLICADAS]`, {
      filtro: duplicatesFilter,
      totalEntrada: data.length,
      comDups: withDups,
      semDups: withoutDups,
      semId: noId,
      naoVerificado: notChecked,
      saida: filtered.length,
      totalDupData: Object.keys(duplicatesData).length,
      isLoading: isLoadingDuplicates
    });
    
    return filtered;
  };

  // Buscar pedidos do Prime para um cliente
  const loadPrimePedidos = async (idPrime) => {
    if (!idPrime) return [];
    
    try {
      const { data, error } = await supabase
        .schema('api')
        .from('prime_pedidos')
        .select('id, data_criacao, status_aprovacao, status_geral, status_entrega, valor_total')
        .eq('id_cliente', idPrime)
        .order('data_criacao', { ascending: false });
      
      if (error) {
        console.error('Erro ao buscar pedidos Prime:', error);
        return [];
      }
      
      return data || [];
    } catch (error) {
      console.error('Erro ao carregar pedidos Prime:', error);
      return [];
    }
  };

  // Carregar pedidos Prime para todos os leads duplicados
  const loadPrimeDataForDuplicates = async (client, duplicates) => {
    setLoadingPrimeData(true);
    const pedidosMap = {};
    
    // Buscar pedidos para o cliente original
    if (client.id_prime) {
      const pedidos = await loadPrimePedidos(client.id_prime);
      pedidosMap[client.id] = pedidos;
    }
    
    // Buscar pedidos para cada duplicata
    for (const dup of duplicates || []) {
      if (dup.id_prime && !pedidosMap[dup.id]) {
        const pedidos = await loadPrimePedidos(dup.id_prime);
        pedidosMap[dup.id] = pedidos;
      }
    }
    
    setPrimePedidosData(pedidosMap);
    setLoadingPrimeData(false);
  };

  // Formatar sexo: 1 -> MASC, 2 -> FEM, 0 ou null -> vazio
  const formatSexo = (sexo) => {
    if (!sexo && sexo !== 0 && sexo !== '0') return '—';
    const sexoNum = parseInt(sexo);
    if (sexoNum === 1) return 'MASC';
    if (sexoNum === 2) return 'FEM';
    if (sexoNum === 0 || sexo === '0') return '';
    return sexo; // Caso tenha outro valor, retornar como está
  };

  // Renderizar ícone de duplicatas
  const renderDuplicatesIcon = (row) => {
    // IMPORTANTE: Normalizar ID para string para garantir correspondência
    const rawId = row.id || row.id_cliente || row.id_cliente_mestre;
    const clientId = rawId ? String(rawId) : null;
    if (!clientId) return null;

    // IMPORTANTE: Array vazio [] também indica duplicatas (detalhes carregados sob demanda)
    const hasDuplicates = duplicatesData[clientId] !== undefined && Array.isArray(duplicatesData[clientId]);

    return (
      <span
        onClick={async () => {
          // Se já temos duplicatas carregadas, mostrar modal
          if (hasDuplicates) {
            const clientWithDups = { ...row, duplicates: duplicatesData[clientId] };
            setSelectedDuplicatesClient(clientWithDups);
            setSelectedMasterLead(null);
            setFieldSelection({});
            setShowDuplicatesModal(true);
            loadPrimeDataForDuplicates(clientWithDups, clientWithDups.duplicates);
            return;
          }

          // Caso contrário, detectar duplicatas primeiro
          console.log('🔍 Detectando duplicatas para:', row.nome_completo);
          const dups = await detectDuplicates(row);
          
          if (dups.length > 0) {
            const clientWithDups = { ...row, duplicates: dups };
            setDuplicatesData(prev => ({ ...prev, [clientId]: dups }));
            setSelectedDuplicatesClient(clientWithDups);
            setSelectedMasterLead(null);
            setFieldSelection({});
            setShowDuplicatesModal(true);
            loadPrimeDataForDuplicates(clientWithDups, dups);
          } else {
            alert('Nenhuma duplicata encontrada para este cliente.');
          }
        }}
        style={{
          cursor: 'pointer',
          fontSize: '16px',
          color: hasDuplicates ? '#f59e0b' : '#9ca3af',
          transition: 'transform 0.2s'
        }}
        onMouseEnter={(e) => e.target.style.transform = 'scale(1.2)'}
        onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
        title={hasDuplicates ? `${duplicatesData[clientId].length} duplicata(s) encontrada(s)` : 'Clique para detectar duplicatas'}
      >
        🔗
      </span>
    );
  };

  const loadAtivacaoPrime = async () => {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage - 1;
    let query = supabase
      .schema('api')
      .from('vw_inativos_prime')
      .select('*', { count: 'exact' });
    query = applyFiltersToQuery(query);
    if (sortField) {
      query = query.order(sortField, { ascending: sortDirection === 'asc' });
    }
    const { data, count } = await query.range(start, end);
    const filtered = filterClientSideIfNeeded(data || []);
    const sorted = sortByExportedThenName(filtered);
    setAtivacaoPrimeData(sorted);
    setTotalCount(count || 0);
  };

  const loadAtivacaoForaPrime = async () => {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage - 1;
    let query = supabase
      .schema('api')
      .from('vw_inativos_fora_prime')
      .select('*', { count: 'exact' });
    query = applyFiltersToQuery(query);
    if (sortField) {
      query = query.order(sortField, { ascending: sortDirection === 'asc' });
    }
    const { data, count } = await query.range(start, end);
    const filtered = filterClientSideIfNeeded(data || []);
    const sorted = sortByExportedThenName(filtered);
    setAtivacaoForaPrimeData(sorted);
    setTotalCount(count || 0);
  };

  const loadAtivacaoComOrcamento = async () => {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage - 1;
    let query = supabase
      .schema('api')
      .from('vw_inativos_com_orcamento')
      .select('*', { count: 'exact' });
    query = applyFiltersToQuery(query);
    if (sortField) {
      query = query.order(sortField, { ascending: sortDirection === 'asc' });
    }
    const { data, count } = await query.range(start, end);
    const filtered = filterClientSideIfNeeded(data || []);
    const sorted = sortByExportedThenName(filtered);
    setAtivacaoComOrcamentoData(sorted);
    setTotalCount(count || 0);
  };

  const loadAtivacaoSemOrcamento = async () => {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage - 1;
    let query = supabase
      .schema('api')
      .from('vw_inativos_sem_orcamento')
      .select('*', { count: 'exact' });
    query = applyFiltersToQuery(query);
    if (sortField) {
      query = query.order(sortField, { ascending: sortDirection === 'asc' });
    }
    const { data, count } = await query.range(start, end);
    const filtered = filterClientSideIfNeeded(data || []);
    const sorted = sortByExportedThenName(filtered);
    setAtivacaoSemOrcamentoData(sorted);
    setTotalCount(count || 0);
  };

  // ===== UI DOS FILTROS =====
  const renderFiltersBar = () => (
    <div className="cc-filters-bar">
      <button className="cc-btn cc-btn-small" onClick={() => setShowFilters(v => !v)}>
        {showFilters ? 'Ocultar Filtros' : 'Mostrar Filtros'}
      </button>
      {showFilters && (
        <div className="cc-filters-grid">
          <div className="cc-filters-row">
            <label className="cc-filter-item">
            <input type="checkbox" checked={filters.hasCpf} onChange={(e) => setFilters(f => ({ ...f, hasCpf: e.target.checked }))} />
            Exigir CPF
            </label>
            <label className="cc-filter-item">
            <input type="checkbox" checked={filters.hasEmail} onChange={(e) => setFilters(f => ({ ...f, hasEmail: e.target.checked }))} />
            Exigir E-mail
            </label>
            <label className="cc-filter-item">
            <input type="checkbox" checked={filters.hasEndereco} onChange={(e) => setFilters(f => ({ ...f, hasEndereco: e.target.checked }))} />
            Exigir Endereço
            </label>
            <label className="cc-filter-item">
            <input type="checkbox" checked={filters.hasSexo} onChange={(e) => setFilters(f => ({ ...f, hasSexo: e.target.checked }))} />
            Exigir Sexo
            </label>
            <label className="cc-filter-item">
            <input type="checkbox" checked={filters.hasDataNascimento} onChange={(e) => setFilters(f => ({ ...f, hasDataNascimento: e.target.checked }))} />
            Exigir Data Nascimento
            </label>
            <div className="cc-filter-item">
            <span>Telefone:</span>
            <select value={filters.phoneStatus} onChange={(e) => setFilters(f => ({ ...f, phoneStatus: e.target.value }))} className="cc-select cc-select-small">
              <option value="any">Qualquer</option>
              <option value="has">Com Telefone</option>
              <option value="none">Sem Telefone</option>
            </select>
            </div>
            <div className="cc-filter-item">
            <span>DDD:</span>
            <select
              value={filters.ddd}
              onChange={(e) => setFilters(f => ({ ...f, ddd: e.target.value }))}
              className="cc-select cc-select-small"
            >
              <option value="">Todos</option>
              {dddOptions.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
            </div>
          </div>
          <div className="cc-filters-row">
            <div className="cc-filter-item">
              <span>Status Nome:</span>
              <select 
                value={nameFilter}
                onChange={(e) => setNameFilter(e.target.value)}
                className="cc-select cc-select-small"
              >
                <option value="all">Todos</option>
                <option value="incomplete">Nome Incompleto</option>
                <option value="validated">Nome Validado</option>
              </select>
            </div>
            <div className="cc-filter-item">
              <span>Status Exportação:</span>
              <select 
                value={exportFilter} 
                onChange={(e) => {
                  setExportFilter(e.target.value);
                  setCurrentPage(1);
                  // Recarrega dados com filtro
                }}
                className="cc-select cc-select-small"
              >
                <option value="all">Todos</option>
                <option value="never-exported">Nunca Exportados</option>
                <option value="exported">Já Exportados</option>
              </select>
            </div>
            <div className="cc-filter-item">
              <span>Duplicatas:</span>
              <select
                value={duplicatesFilter}
                onChange={async (e) => {
                  const newFilter = e.target.value;
                  setDuplicatesFilter(newFilter);
                  setCurrentPage(1);
                  
                  // Se selecionou "Com Duplicatas" ou "Sem Duplicatas", buscar TODAS as duplicatas do banco
                  if (newFilter === 'with-duplicates' || newFilter === 'no-duplicates') {
                    console.log(`🔍 [FILTRO] Buscando TODAS as duplicatas do banco para filtro: ${newFilter}...`);
                    setIsLoadingDuplicates(true);
                    
                    try {
                      // Buscar TODAS as duplicatas da view atual usando SQL
                      await loadAllDuplicatesFromTabView(newFilter);
                      console.log(`✅ [FILTRO] Duplicatas carregadas do banco para filtro: ${newFilter}`);
                    } catch (error) {
                      console.error(`❌ [FILTRO] Erro ao carregar duplicatas do banco:`, error);
                    } finally {
                      setIsLoadingDuplicates(false);
                    }
                  } else {
                    // Se voltou para "Todos", limpar dados completos e usar paginação normal
                    setAllDataForTab([]);
                    loadTabData(); // Recarregar dados normais
                  }
                }}
                className="cc-select cc-select-small"
              >
                <option value="all">Todos</option>
                <option value="with-duplicates">Com Duplicatas</option>
                <option value="no-duplicates">Sem Duplicatas</option>
              </select>
            </div>
          </div>
          <div className="cc-filters-row">
            <div className="cc-filter-item">
              <span>Status SprintHub:</span>
              <select
                value={sprinthubStatusFilter}
                onChange={(e) => {
                  const value = e.target.value;
                  setSprinthubStatusFilter(value);
                  setCurrentPage(1);
                  if (value === 'all') {
                    setSprinthubLeadTagFilter('all');
                  }
                  loadTabData();
                }}
                className="cc-select cc-select-small"
              >
                <option value="all">Todos</option>
                <option value="sent">Enviados</option>
                <option value="not-sent">Não Enviados</option>
              </select>
            </div>
            <div className="cc-filter-item">
              <span>Tag Lead SprintHub:</span>
              <select
                value={sprinthubLeadTagFilter}
                onChange={(e) => {
                  const value = e.target.value;
                  setSprinthubLeadTagFilter(value);
                  setCurrentPage(1);
                  if (value !== 'all') {
                    setSprinthubStatusFilter('sent');
                  }
                  loadTabData();
                }}
                className="cc-select cc-select-small"
                disabled={isLoadingSprinthubTags}
              >
                <option value="all">Todas</option>
                {availableSprinthubLeadTags.map(tag => (
                  <option key={tag} value={tag}>{tag}</option>
                ))}
              </select>
            </div>
            <div className="cc-filter-item">
              <span style={{ whiteSpace: 'nowrap' }}>Data Envio SprintHub:</span>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <input
                  type="date"
                  value={sprinthubDataEnvioInicio}
                  onChange={(e) => {
                    setSprinthubDataEnvioInicio(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="cc-input cc-input-small"
                  style={{ width: '140px' }}
                />
                <span>até</span>
                <input
                  type="date"
                  value={sprinthubDataEnvioFim}
                  onChange={(e) => {
                    setSprinthubDataEnvioFim(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="cc-input cc-input-small"
                  style={{ width: '140px' }}
                />
              </div>
            </div>
            <div className="cc-filter-item" style={{ alignItems: 'flex-start' }}>
              <span style={{ marginTop: '6px' }}>Origens:</span>
              <div className="cc-filter-chips">
                <label className="cc-filter-chip">
                  <input type="checkbox" checked={filters.origins.includes('prime')} onChange={(e) => setFilters(f => ({ ...f, origins: e.target.checked ? [...f.origins, 'prime'] : f.origins.filter(o => o !== 'prime') }))} />
                  <span className="cc-tag cc-tag-prime">Prime</span>
                </label>
                <label className="cc-filter-chip">
                  <input type="checkbox" checked={filters.origins.includes('sprint')} onChange={(e) => setFilters(f => ({ ...f, origins: e.target.checked ? [...f.origins, 'sprint'] : f.origins.filter(o => o !== 'sprint') }))} />
                  <span className="cc-tag cc-tag-sprint">Sprint</span>
                </label>
                <label className="cc-filter-chip">
                  <input type="checkbox" checked={filters.origins.includes('greatpage')} onChange={(e) => setFilters(f => ({ ...f, origins: e.target.checked ? [...f.origins, 'greatpage'] : f.origins.filter(o => o !== 'greatpage') }))} />
                  <span className="cc-tag cc-tag-greatpage">GreatPage</span>
                </label>
                <label className="cc-filter-chip">
                  <input type="checkbox" checked={filters.origins.includes('blacklabs')} onChange={(e) => setFilters(f => ({ ...f, origins: e.target.checked ? [...f.origins, 'blacklabs'] : f.origins.filter(o => o !== 'blacklabs') }))} />
                  <span className="cc-tag cc-tag-blacklabs">BlackLabs</span>
                </label>
              </div>
            </div>
            <div className="cc-filter-item">
              <button className="cc-btn cc-btn-small" onClick={() => { setCurrentPage(1); loadTabData(); }}>
                Aplicar
              </button>
              <button className="cc-btn cc-btn-small" onClick={() => {
                setFilters({ hasCpf: false, hasEmail: false, hasEndereco: false, hasSexo: false, hasDataNascimento: false, phoneStatus: 'any', ddd: '', origins: [] });
                setSprinthubStatusFilter('all');
                setSprinthubLeadTagFilter('all');
                setSprinthubDataEnvioInicio('');
                setSprinthubDataEnvioFim('');
                setCurrentPage(1);
                loadTabData();
              }}>Limpar</button>
              <button
                className="cc-btn cc-btn-small"
                onClick={() => {
                  // Get current tab's data
                  let currentData = [];
                  if (activeTab === 'ativacao-prime') currentData = ativacaoPrimeData;
                  else if (activeTab === 'ativacao-fora-prime') currentData = ativacaoForaPrimeData;
                  else if (activeTab === 'ativacao-com-orcamento') currentData = ativacaoComOrcamentoData;
                  else if (activeTab === 'ativacao-sem-orcamento') currentData = ativacaoSemOrcamentoData;

                  if (currentData.length > 0) {
                    loadDuplicatesForClients(currentData);
                  } else {
                    alert('Nenhum cliente disponível na aba atual.');
                  }
                }}
                disabled={isLoadingDuplicates}
                style={{
                  backgroundColor: isLoadingDuplicates ? '#9ca3af' : '#f59e0b',
                  color: 'white'
                }}
              >
                {isLoadingDuplicates ? '🔍 Detectando...' : '🔗 Detectar Duplicatas'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // Função auxiliar para verificar se uma entrada de histórico é do SprintHub
  const isSprinthubHistoryEntry = (entry) => {
    if (!entry) return false;
    const tag = (entry.tag_exportacao || '').toLowerCase();
    const motivo = (entry.motivo || '').toLowerCase();
    const observacao = (entry.observacao || '').toLowerCase();
    return tag.includes('sprinthub') || motivo.includes('sprinthub') || observacao.includes('sprinthub');
  };

  // Função para carregar histórico de exportação de um cliente
  const loadClientExportHistory = async (leadIdentifiers) => {
    const leadIdsArray = Array.isArray(leadIdentifiers) ? leadIdentifiers : [leadIdentifiers];
    const leadIds = [...new Set(leadIdsArray.filter(Boolean).map((id) => String(id)))];
    if (leadIds.length === 0) return [];
    
    try {
      // Buscar IDs do clientes_mestre correspondentes aos IDs fornecidos
      let clientesMestreIds = new Set();
      
      // Tentar buscar por cada tipo de ID
      const numericIds = leadIds.map(id => Number(id)).filter(id => !isNaN(id));
      
      if (numericIds.length > 0) {
        // Buscar por id
        const { data: byId } = await supabase
          .schema('api')
          .from('clientes_mestre')
          .select('id')
          .in('id', numericIds);
        (byId || []).forEach(cm => {
          if (cm.id) clientesMestreIds.add(Number(cm.id));
        });
        
        // Buscar por id_prime
        const { data: byPrime } = await supabase
          .schema('api')
          .from('clientes_mestre')
          .select('id')
          .in('id_prime', numericIds);
        (byPrime || []).forEach(cm => {
          if (cm.id) clientesMestreIds.add(Number(cm.id));
        });
        
        // Buscar por id_sprinthub
        const { data: bySprint } = await supabase
          .schema('api')
          .from('clientes_mestre')
          .select('id')
          .in('id_sprinthub', numericIds);
        (bySprint || []).forEach(cm => {
          if (cm.id) clientesMestreIds.add(Number(cm.id));
        });
      }
      
      // Se não encontrou correspondência, usar os IDs originais
      const idsParaBuscar = clientesMestreIds.size > 0 
        ? Array.from(clientesMestreIds)
        : numericIds;
      
      if (idsParaBuscar.length === 0) {
        return [];
      }
      
      const { data, error } = await supabase
        .schema('api')
        .from('historico_exportacoes')
        .select('*')
        .in('id_lead', idsParaBuscar)
        .order('data_exportacao', { ascending: false });
      
      if (error) {
        console.error('Erro ao buscar histórico:', error);
        return [];
      }
      
      if (!data || data.length === 0) {
        return [];
      }
      
      // Verificar se tem SprintHub e atualizar flags
      const hasSprinthub = data.some(exp => isSprinthubHistoryEntry(exp));
      if (hasSprinthub) {
        setSprinthubExportFlags(prev => {
          const updates = { ...prev };
          leadIds.forEach(id => {
            updates[String(id)] = true;
          });
          return updates;
        });
      }
      
      return data;
    } catch (error) {
      console.error('Erro ao carregar histórico de exportação:', error);
      return [];
    }
  };

  // Função para lidar com clique no ícone de exportação
  const handleExportIconClick = async (row, onlySprinthub = false) => {
    const candidates = getLeadIdentifierCandidates(row);
    if (candidates.length === 0) return;
    
    setSelectedClientForHistory({
      id: candidates[0],
      nome: row.nome_completo || 'Sem nome'
    });
    
    const history = await loadClientExportHistory(candidates);
    
    if (!history || history.length === 0) {
      alert('Nenhum histórico encontrado de exportação.');
      return;
    }
    
    const sprinthubEntries = history.filter(isSprinthubHistoryEntry);
    const exportEntries = history;

    if (onlySprinthub) {
      if (sprinthubEntries.length === 0) {
        alert('Nenhum histórico encontrado para SprintHub.');
        return;
      }
      setSprinthubHistory(sprinthubEntries);
      setShowSprinthubHistoryModal(true);
    } else {
      const validExportEntries = Array.isArray(exportEntries) ? exportEntries : [];
      setClientExportHistory(validExportEntries);
      setShowExportHistoryModal(true);
    }
  };

  const renderExportStatusIcon = (row) => {
    const candidateIds = getLeadIdentifierCandidates(row);
    if (candidateIds.length === 0) return null;
    
    const historyEntries = candidateIds.flatMap(id => exportHistory[String(id)] || []);
    if (historyEntries.length === 0) return null;
    
    const hasSprinthubExport = candidateIds.some(id => sprinthubExportFlags[String(id)])
      || historyEntries.some(isSprinthubHistoryEntry);
    
    const baseStyle = {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontWeight: 'bold',
      lineHeight: '1',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      marginRight: '4px'
    };
    
    const standardIcon = (
      <span
        style={{
          ...baseStyle,
          fontSize: '10px',
          color: '#22c55e',
          padding: '1px 4px',
          borderRadius: '3px',
          backgroundColor: '#dcfce7',
        }}
        title={`Clique para ver histórico de ${historyEntries.length} exportação(ões)`}
        onClick={(e) => {
          e.stopPropagation();
          handleExportIconClick(row, false);
        }}
      >
        EX
      </span>
    );
    
    const sprinthubIcon = (
      <span
        style={{
          ...baseStyle,
          width: '20px',
          height: '20px',
          borderRadius: '50%',
          backgroundColor: '#7c3aed',
          color: '#fff',
          fontSize: '11px',
          boxShadow: '0 0 6px rgba(124, 58, 237, 0.6)',
        }}
        title={`Enviado ao SprintHub (${historyEntries.length} registro(s)). Clique para ver o histórico.`}
        onClick={(e) => {
          e.stopPropagation();
          handleExportIconClick(row, true);
        }}
      >
        S
      </span>
    );
    
    return (
      <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
        {standardIcon}
        {hasSprinthubExport && sprinthubIcon}
      </div>
    );
  };

  // ===== FUNÇÕES DE NOME E TELEFONE =====
  const corrigirTelefoneNoNome = async (clientId, nomeAtual) => {
    try {
      const { data, error } = await supabase
        .rpc('corrigir_telefone_do_nome', { 
          p_id_cliente: clientId,
          p_origem: 'manual'
        });
      
      if (error) throw error;
      
      if (data && data.success) {
        alert(`Telefone extraído!\nNome anterior: ${data.nome_anterior}\nNome atual: ${data.nome_atual}\nTelefone: ${data.telefone_extraido}`);
        loadTabData(); // Recarregar dados品質
      } else {
        alert(data?.error || 'Erro ao corrigir telefone');
      }
    } catch (error) {
      console.error('Erro ao corrigir telefone:', error);
      alert('Erro ao processar correção');
    }
  };

  const renderNomePorOrigem = (row) => {
    const clientId = row.id || row.id_cliente_mestre;
    const nomeValidado = validatedNames[clientId];
    
    // Nome principal a exibir na linha
    let nomePrincipal = nomeValidado || row.nome_completo || 'SEM NOME';
    
    // Caso contrário, mostra nomes por origem com cores
    const nomes = [];
    const cores = {
      prime: '#2563eb',
      sprint: '#9333ea',
      greatpage: '#059669',
      blacklabs: '#dc2626'
    };
    
    // Verificar origens e nomes correspondentes
    const origRaw = Array.isArray(row.origem_marcas) ? row.origem_marcas : [];
    if (!origRaw.length && row.no_prime) origRaw.push('prime');
    if (!origRaw.length && (row.no_sprint || row.sprinthub)) origRaw.push('sprinthub');
    if (!origRaw.length && (row.no_greatpage || row.google)) origRaw.push('greatpage');
    if (!origRaw.length && row.no_blacklabs) origRaw.push('blacklabs');

    const normalizarOrigem = (o) => {
      if (!o) return null;
      const t = String(o).toLowerCase();
      if (t.includes('sprint')) return 'sprint';
      if (t.includes('prime')) return 'prime';
      if (t.includes('great') || t.includes('google')) return 'greatpage';
      if (t.includes('black')) return 'blacklabs';
      return t;
    };
    
    // Obter nome de cada origem
    origRaw.forEach(origemBruta => {
      const origem = normalizarOrigem(origemBruta);
      const nome = row[`nome_cliente_${origem}`] ||
                   row[`nome_${origem}`] ||
                   row.nome_completo;
      if (nome && nome !== 'SEM NOME' && String(nome).trim()) {
        nomes.push({ origem, nome, cor: cores[origem] || '#6b7280' });
      }
    });
    
    // Mostrar apenas um nome e a engrenagem (sempre)
    const idPrime = row.id_prime || row.prime_id || row.idprime;
    const idSprint = row.id_sprinthub || row.sprinthub_id || row.id_sprint || row.idsprint || row.id_lead || row.lead_id;
    const idsTooltip = `Prime: ${idPrime ?? '-'} | Sprinthub: ${idSprint ?? '-'}`;

    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <button
          className="cc-btn-nome-padrao"
          onClick={() => {
            setSelectedClientForName({ 
              id: clientId, 
              nomes,
              id_prime: idPrime || null,
              id_sprinthub: idSprint || null
            });
            setShowNameModal(true);
          }}
          title="Opções de nome"
        >
          ⚙️
        </button>
        <span className={nomeValidado ? 'cc-nome-validado' : 'cc-nome-cell'}>
          {nomePrincipal}
          {nomeValidado && (
            <span className="cc-badge-validado" title="Nome Validado">✓</span>
          )}
        </span>
        <span title={idsTooltip} style={{ cursor: 'help', opacity: 0.75 }}>ℹ️</span>
      </div>
    );
  };

  const validarNomePadrao = async (clientId, nomeEscolhido, origemNome) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Registrar nome validado
      const { error } = await supabase
        .schema('api')
        .from('nome_validado_clientes')
        .upsert({
          id_cliente_mestre: clientId,
          nome_validado: nomeEscolhido,
          origem_nome: origemNome,
          validado_por: user?.id || null
        }, {
          onConflict: 'id_cliente_mestre'
        });
      
      if (error) throw error;
      
      // Atualizar nome na tabela mestre
      const { error: updateError } = await supabase
        .schema('api')
        .from('clientes_mestre')
        .update({ nome_completo: nomeEscolhido })
        .eq('id', clientId);
      
      if (updateError) throw updateError;
      
      // Proteger campo nome
      await supabase
        .schema('api')
        .from('campos_protegidos')
        .upsert({
          id_cliente_mestre: clientId,
          campo_protegido: 'nome_completo',
          valor_protegido: nomeEscolhido,
          motivo: 'Nome validado manualmente',
          protegido_por: user?.id || null
        }, {
          onConflict: 'id_cliente_mestre,campo_protegido'
        });
      
      // Atualizar estado
      setValidatedNames(prev => ({ ...prev, [clientId]: nomeEscolhido }));
      setShowNameModal(false);
      setSelectedClientForName(null);
      setEditFields(null);
      loadTabData();
      
      alert('Nome padrão definido e protegido!');
    } catch (error) {
      console.error('Erro ao validar nome:', error);
      alert('Erro ao salvar nome padrão');
    }
  };

  // ===== FILTRO DE LINHAS (STATUS NOME) =====
  const filterRowsByNameStatus = (rows) => {
    if (!Array.isArray(rows) || nameFilter === 'all') return rows;
    if (nameFilter === 'incomplete') {
      return rows.filter(r => String(r.nome_completo || '').toUpperCase().includes('INCOMPLETO'));
    }
    if (nameFilter === 'validated') {
      // Heurística: quando nome foi validado, pode existir em validatedNames
      return rows.filter(r => !!validatedNames[(r.id || r.id_cliente_mestre)]);
    }
    return rows;
  };

  const renderOriginsBadges = (row) => {
    const fromArray = Array.isArray(row.origem_marcas) ? row.origem_marcas : [];
    // Fallbacks possíveis
    const fallbacks = [];
    if (row.no_prime || row.prime) fallbacks.push('prime');
    if (row.no_sprint || row.sprint || row.sprinthub) fallbacks.push('sprint');
    if (row.no_greatpage || row.greatpage) fallbacks.push('greatpage');
    if (row.no_blacklabs || row.blacklabs) fallbacks.push('blacklabs');
    const normalize = (tag) => {
      if (!tag) return null;
      const t = String(tag).toLowerCase();
      if (t.includes('sprint')) return 'sprint';
      if (t.includes('prime')) return 'prime';
      if (t.includes('great') || t.includes('google')) return 'greatpage';
      if (t.includes('black')) return 'blacklabs';
      return 'default';
    };
    const origins = [...new Set([...fromArray, ...fallbacks])];
    if (origins.length === 0) return '-';
    return (
      <div className="cc-tags">
        {origins.map((tag, i) => {
          const norm = normalize(tag);
          const labelMap = { prime: 'Prime', sprint: 'Sprinthub', greatpage: 'GreatPage', blacklabs: 'BlackLabs', default: (typeof tag === 'string' ? tag : 'Outro') };
          const label = labelMap[norm] || labelMap.default;
          return <span key={i} className={`cc-tag cc-tag-${norm}`}>{label}</span>;
        })}
      </div>
    );
  };

  // ===== FUNÇÕES DE CARREGAMENTO - REATIVAÇÃO (90+ DIAS) =====

  const loadReativacaoGeral = async () => {
    const { data } = await supabase.schema('api').from('vw_dashboard_reativacao').select('*').single();
    setReativacaoGeralData(data);
  };

  const loadReativacao1x = async () => {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage - 1;
    let query = supabase
      .schema('api')
      .from('vw_reativacao_1x')
      .select('*', { count: 'exact' });
    query = applyFiltersToQuery(query);
    if (sortField) {
      query = query.order(sortField, { ascending: sortDirection === 'asc' });
    }
    const { data, count } = await query.range(start, end);
    const filtered = filterClientSideIfNeeded(data || []);
    const sorted = sortByExportedThenName(filtered);
    setReativacao1xData(sorted);
    setTotalCount(count || 0);
  };

  const loadReativacao2x = async () => {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage - 1;
    let query = supabase
      .schema('api')
      .from('vw_reativacao_2x')
      .select('*', { count: 'exact' });
    query = applyFiltersToQuery(query);
    if (sortField) {
      query = query.order(sortField, { ascending: sortDirection === 'asc' });
    }
    const { data, count } = await query.range(start, end);
    const filtered = filterClientSideIfNeeded(data || []);
    const sorted = sortByExportedThenName(filtered);
    setReativacao2xData(sorted);
    setTotalCount(count || 0);
  };

  const loadReativacao3x = async () => {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage - 1;
    let query = supabase
      .schema('api')
      .from('vw_reativacao_3x')
      .select('*', { count: 'exact' });
    query = applyFiltersToQuery(query);
    if (sortField) {
      query = query.order(sortField, { ascending: sortDirection === 'asc' });
    }
    const { data, count } = await query.range(start, end);
    const filtered = filterClientSideIfNeeded(data || []);
    const sorted = sortByExportedThenName(filtered);
    setReativacao3xData(sorted);
    setTotalCount(count || 0);
  };

  const loadReativacao3xPlus = async () => {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage - 1;
    let query = supabase
      .schema('api')
      .from('vw_reativacao_3x_plus')
      .select('*', { count: 'exact' });
    query = applyFiltersToQuery(query);
    if (sortField) {
      query = query.order(sortField, { ascending: sortDirection === 'asc' });
    }
    const { data, count } = await query.range(start, end);
    const filtered = filterClientSideIfNeeded(data || []);
    const sorted = sortByExportedThenName(filtered);
    setReativacao3xPlusData(sorted);
    setTotalCount(count || 0);
  };

  const loadMonitoramentoGeral = async () => {
    // Buscar dados do dashboard (similar ao reativação)
    try {
      // Buscar total geral de cada período usando count
      const [result1_29, result30_59, result60_90] = await Promise.all([
        supabase
          .schema('api')
          .from('vw_monitoramento_1_29_dias')
          .select('*', { count: 'exact', head: true }),
        supabase
          .schema('api')
          .from('vw_monitoramento_30_59_dias')
          .select('*', { count: 'exact', head: true }),
        supabase
          .schema('api')
          .from('vw_monitoramento_60_90_dias')
          .select('*', { count: 'exact', head: true })
      ]);
      
      const count1_29 = result1_29.count || 0;
      const count30_59 = result30_59.count || 0;
      const count60_90 = result60_90.count || 0;
      
      const totalParaMonitoramento = count1_29 + count30_59 + count60_90;
      
      console.log('📊 Monitoramento Dashboard:', {
        total_para_monitoramento: totalParaMonitoramento,
        total_monitoramento_1_29: count1_29,
        total_monitoramento_30_59: count30_59,
        total_monitoramento_60_90: count60_90
      });
      
      setMonitoramentoGeralData({
        total_para_monitoramento: totalParaMonitoramento,
        total_monitoramento_1_29: count1_29,
        total_monitoramento_30_59: count30_59,
        total_monitoramento_60_90: count60_90
      });
    } catch (error) {
      console.error('Erro ao carregar dashboard de monitoramento:', error);
      setMonitoramentoGeralData(null);
    }
  };

  const loadMonitoramento129 = async () => {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage - 1;
    let query = supabase
      .schema('api')
      .from('vw_monitoramento_1_29_dias')
      .select('*', { count: 'exact' });
    query = applyFiltersToQuery(query);
    
    // Aplicar filtros SprintHub
    const sprinthubFilterResult = await applySprinthubFiltersToQuery(query);
    if (sprinthubFilterResult.shouldReturnEmpty) {
      setMonitoramento129Data([]);
      setTotalCount(0);
      return;
    }
    query = sprinthubFilterResult.query;
    
    if (sortField) {
      query = query.order(sortField, { ascending: sortDirection === 'asc' });
    }
    const { data, count } = await query.range(start, end);
    let filtered = filterClientSideIfNeeded(data || []);
    
    // Aplicar filtro "not-sent" no cliente se necessário
    if (sprinthubStatusFilter === 'not-sent' && sprinthubFilterResult.sprinthubSentIds) {
      const sentIdsSet = new Set(sprinthubFilterResult.sprinthubSentIds.map(id => String(id)));
      filtered = filtered.filter(row => {
        const rowId = String(row.id || row.id_cliente || row.id_cliente_mestre);
        return !sentIdsSet.has(rowId);
      });
    }
    
    const sorted = sortByExportedThenName(filtered);
    setMonitoramento129Data(sorted);
    setTotalCount(count || 0);
    
    // Carregar histórico de exportações para exibir ícones
    const leadIds = sorted.map(row => {
      const candidates = getLeadIdentifierCandidates(row);
      return candidates.length > 0 ? candidates[0] : null;
    }).filter(Boolean);
    if (leadIds.length > 0) {
      const history = await loadExportHistory(leadIds);
      setExportHistory(prev => ({ ...prev, ...history }));
    }
  };

  const loadMonitoramento3059 = async () => {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage - 1;
    let query = supabase
      .schema('api')
      .from('vw_monitoramento_30_59_dias')
      .select('*', { count: 'exact' });
    query = applyFiltersToQuery(query);
    
    // Aplicar filtros SprintHub
    const sprinthubFilterResult = await applySprinthubFiltersToQuery(query);
    if (sprinthubFilterResult.shouldReturnEmpty) {
      setMonitoramento3059Data([]);
      setTotalCount(0);
      return;
    }
    query = sprinthubFilterResult.query;
    
    if (sortField) {
      query = query.order(sortField, { ascending: sortDirection === 'asc' });
    }
    const { data, count } = await query.range(start, end);
    let filtered = filterClientSideIfNeeded(data || []);
    
    // Aplicar filtro "not-sent" no cliente se necessário
    if (sprinthubStatusFilter === 'not-sent' && sprinthubFilterResult.sprinthubSentIds) {
      const sentIdsSet = new Set(sprinthubFilterResult.sprinthubSentIds.map(id => String(id)));
      filtered = filtered.filter(row => {
        const rowId = String(row.id || row.id_cliente || row.id_cliente_mestre);
        return !sentIdsSet.has(rowId);
      });
    }
    
    const sorted = sortByExportedThenName(filtered);
    setMonitoramento3059Data(sorted);
    setTotalCount(count || 0);
    
    // Carregar histórico de exportações para exibir ícones
    const leadIds = sorted.map(row => {
      const candidates = getLeadIdentifierCandidates(row);
      return candidates.length > 0 ? candidates[0] : null;
    }).filter(Boolean);
    if (leadIds.length > 0) {
      const history = await loadExportHistory(leadIds);
      setExportHistory(prev => ({ ...prev, ...history }));
    }
  };

  const loadMonitoramento6090 = async () => {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage - 1;
    let query = supabase
      .schema('api')
      .from('vw_monitoramento_60_90_dias')
      .select('*', { count: 'exact' });
    query = applyFiltersToQuery(query);
    
    // Aplicar filtros SprintHub
    const sprinthubFilterResult = await applySprinthubFiltersToQuery(query);
    if (sprinthubFilterResult.shouldReturnEmpty) {
      setMonitoramento6090Data([]);
      setTotalCount(0);
      return;
    }
    query = sprinthubFilterResult.query;
    
    if (sortField) {
      query = query.order(sortField, { ascending: sortDirection === 'asc' });
    }
    const { data, count } = await query.range(start, end);
    let filtered = filterClientSideIfNeeded(data || []);
    
    // Aplicar filtro "not-sent" no cliente se necessário
    if (sprinthubStatusFilter === 'not-sent' && sprinthubFilterResult.sprinthubSentIds) {
      const sentIdsSet = new Set(sprinthubFilterResult.sprinthubSentIds.map(id => String(id)));
      filtered = filtered.filter(row => {
        const rowId = String(row.id || row.id_cliente || row.id_cliente_mestre);
        return !sentIdsSet.has(rowId);
      });
    }
    
    const sorted = sortByExportedThenName(filtered);
    setMonitoramento6090Data(sorted);
    setTotalCount(count || 0);
    
    // Carregar histórico de exportações para exibir ícones
    const leadIds = sorted.map(row => {
      const candidates = getLeadIdentifierCandidates(row);
      return candidates.length > 0 ? candidates[0] : null;
    }).filter(Boolean);
    if (leadIds.length > 0) {
      const history = await loadExportHistory(leadIds);
      setExportHistory(prev => ({ ...prev, ...history }));
    }
  };

  const loadMonitoramentoD45 = async () => {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage - 1;
    let query = supabase
      .schema('api')
      .from('vw_monitoramento_d45')
      .select('*', { count: 'exact' });
    query = applyFiltersToQuery(query);
    
    // Aplicar filtros SprintHub
    const sprinthubFilterResult = await applySprinthubFiltersToQuery(query);
    if (sprinthubFilterResult.shouldReturnEmpty) {
      setMonitoramentoD45Data([]);
      setTotalCount(0);
      return;
    }
    query = sprinthubFilterResult.query;
    
    if (sortField) {
      query = query.order(sortField, { ascending: sortDirection === 'asc' });
    }
    const { data, count } = await query.range(start, end);
    let filtered = filterClientSideIfNeeded(data || []);
    
    // Aplicar filtro "not-sent" no cliente se necessário
    if (sprinthubStatusFilter === 'not-sent' && sprinthubFilterResult.sprinthubSentIds) {
      const sentIdsSet = new Set(sprinthubFilterResult.sprinthubSentIds.map(id => String(id)));
      filtered = filtered.filter(row => {
        const rowId = String(row.id || row.id_cliente || row.id_cliente_mestre);
        return !sentIdsSet.has(rowId);
      });
    }
    
    const sorted = sortByExportedThenName(filtered);
    setMonitoramentoD45Data(sorted);
    setTotalCount(count || 0);
    
    // Carregar histórico de exportações para exibir ícones
    const leadIds = sorted.map(row => {
      const candidates = getLeadIdentifierCandidates(row);
      return candidates.length > 0 ? candidates[0] : null;
    }).filter(Boolean);
    if (leadIds.length > 0) {
      const history = await loadExportHistory(leadIds);
      setExportHistory(prev => ({ ...prev, ...history }));
    }
  };

  const loadMonitoramentoD60 = async () => {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage - 1;
    let query = supabase
      .schema('api')
      .from('vw_monitoramento_d60')
      .select('*', { count: 'exact' });
    query = applyFiltersToQuery(query);
    
    // Aplicar filtros SprintHub
    const sprinthubFilterResult = await applySprinthubFiltersToQuery(query);
    if (sprinthubFilterResult.shouldReturnEmpty) {
      setMonitoramentoD60Data([]);
      setTotalCount(0);
      return;
    }
    query = sprinthubFilterResult.query;
    
    if (sortField) {
      query = query.order(sortField, { ascending: sortDirection === 'asc' });
    }
    const { data, count } = await query.range(start, end);
    let filtered = filterClientSideIfNeeded(data || []);
    
    // Aplicar filtro "not-sent" no cliente se necessário
    if (sprinthubStatusFilter === 'not-sent' && sprinthubFilterResult.sprinthubSentIds) {
      const sentIdsSet = new Set(sprinthubFilterResult.sprinthubSentIds.map(id => String(id)));
      filtered = filtered.filter(row => {
        const rowId = String(row.id || row.id_cliente || row.id_cliente_mestre);
        return !sentIdsSet.has(rowId);
      });
    }
    
    const sorted = sortByExportedThenName(filtered);
    setMonitoramentoD60Data(sorted);
    setTotalCount(count || 0);
    
    // Carregar histórico de exportações para exibir ícones
    const leadIds = sorted.map(row => {
      const candidates = getLeadIdentifierCandidates(row);
      return candidates.length > 0 ? candidates[0] : null;
    }).filter(Boolean);
    if (leadIds.length > 0) {
      const history = await loadExportHistory(leadIds);
      setExportHistory(prev => ({ ...prev, ...history }));
    }
  };

  const loadMonitoramentoD75 = async () => {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage - 1;
    let query = supabase
      .schema('api')
      .from('vw_monitoramento_d75')
      .select('*', { count: 'exact' });
    query = applyFiltersToQuery(query);
    
    // Aplicar filtros SprintHub
    const sprinthubFilterResult = await applySprinthubFiltersToQuery(query);
    if (sprinthubFilterResult.shouldReturnEmpty) {
      setMonitoramentoD75Data([]);
      setTotalCount(0);
      return;
    }
    query = sprinthubFilterResult.query;
    
    if (sortField) {
      query = query.order(sortField, { ascending: sortDirection === 'asc' });
    }
    const { data, count } = await query.range(start, end);
    let filtered = filterClientSideIfNeeded(data || []);
    
    // Aplicar filtro "not-sent" no cliente se necessário
    if (sprinthubStatusFilter === 'not-sent' && sprinthubFilterResult.sprinthubSentIds) {
      const sentIdsSet = new Set(sprinthubFilterResult.sprinthubSentIds.map(id => String(id)));
      filtered = filtered.filter(row => {
        const rowId = String(row.id || row.id_cliente || row.id_cliente_mestre);
        return !sentIdsSet.has(rowId);
      });
    }
    
    const sorted = sortByExportedThenName(filtered);
    setMonitoramentoD75Data(sorted);
    setTotalCount(count || 0);
    
    // Carregar histórico de exportações para exibir ícones
    const leadIds = sorted.map(row => {
      const candidates = getLeadIdentifierCandidates(row);
      return candidates.length > 0 ? candidates[0] : null;
    }).filter(Boolean);
    if (leadIds.length > 0) {
      const history = await loadExportHistory(leadIds);
      setExportHistory(prev => ({ ...prev, ...history }));
    }
  };

  const loadMonitoramentoD90 = async () => {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage - 1;
    let query = supabase
      .schema('api')
      .from('vw_monitoramento_d90')
      .select('*', { count: 'exact' });
    query = applyFiltersToQuery(query);
    
    // Aplicar filtros SprintHub
    const sprinthubFilterResult = await applySprinthubFiltersToQuery(query);
    if (sprinthubFilterResult.shouldReturnEmpty) {
      setMonitoramentoD90Data([]);
      setTotalCount(0);
      return;
    }
    query = sprinthubFilterResult.query;
    
    if (sortField) {
      query = query.order(sortField, { ascending: sortDirection === 'asc' });
    }
    const { data, count } = await query.range(start, end);
    let filtered = filterClientSideIfNeeded(data || []);
    
    // Aplicar filtro "not-sent" no cliente se necessário
    if (sprinthubStatusFilter === 'not-sent' && sprinthubFilterResult.sprinthubSentIds) {
      const sentIdsSet = new Set(sprinthubFilterResult.sprinthubSentIds.map(id => String(id)));
      filtered = filtered.filter(row => {
        const rowId = String(row.id || row.id_cliente || row.id_cliente_mestre);
        return !sentIdsSet.has(rowId);
      });
    }
    
    const sorted = sortByExportedThenName(filtered);
    setMonitoramentoD90Data(sorted);
    setTotalCount(count || 0);
    
    // Carregar histórico de exportações para exibir ícones
    const leadIds = sorted.map(row => {
      const candidates = getLeadIdentifierCandidates(row);
      return candidates.length > 0 ? candidates[0] : null;
    }).filter(Boolean);
    if (leadIds.length > 0) {
      const history = await loadExportHistory(leadIds);
      setExportHistory(prev => ({ ...prev, ...history }));
    }
  };

  // ===== FUNÇÕES AUXILIARES =====

  const exportToCSV = async (tipo, tableName) => {
    setIsLoading(true);
    try {
      const { data } = await supabase
        .from(tableName)
        .select('*')
        .order('qualidade_dados', { ascending: false });

      if (!data || data.length === 0) {
        alert('Nenhum dado para exportar');
        return;
      }

      const headers = Object.keys(data[0]).join(',');
      const rows = data.map(row =>
        Object.values(row).map(val =>
          typeof val === 'string' && val.includes(',') ? `"${val}"` : val
        ).join(',')
      );
      const csv = [headers, ...rows].join('\n');

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `${tipo}_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
    } catch (error) {
      console.error('Erro ao exportar:', error);
      alert('Erro ao exportar dados');
    } finally {
      setIsLoading(false);
    }
  };

  // ===== HISTÓRICO DE EXPORTAÇÃO =====
  // Carregar tags de exportação disponíveis (incluindo tags de leads SprintHub)
  const loadAvailableExportTags = async () => {
    try {
      const { data } = await supabase
        .schema('api')
        .from('historico_exportacoes')
        .select('tag_exportacao')
        .not('tag_exportacao', 'is', null);
      
      const uniqueTags = [...new Set(data?.map(d => d.tag_exportacao).filter(Boolean) || [])];
      
      // Extrair tags de leads do SprintHub
      const sprinthubLeadTags = uniqueTags
        .map(extractSprinthubLeadTag)
        .filter(tag => tag && tag !== 'default');
      setAvailableSprinthubLeadTags([...new Set(sprinthubLeadTags)].sort());
    } catch (error) {
      console.error('Erro ao carregar tags de exportação:', error);
    }
  };

  const loadExportHistory = async (leadIds) => {
    console.log('🔍 [LOAD_EXPORT_HISTORY] Iniciando carregamento de histórico...');
    console.log('🔍 [LOAD_EXPORT_HISTORY] Lead IDs:', leadIds?.length || 0);
    
    if (!leadIds || leadIds.length === 0) {
      console.warn('⚠️ [LOAD_EXPORT_HISTORY] Nenhum lead ID fornecido');
      return {};
    }
    
    try {
      // Usar a mesma estrutura que funciona no salvarEdicaoCampos
      console.log('🔍 [LOAD_EXPORT_HISTORY] Executando SELECT na tabela historico_exportacoes...');
      const { data, error } = await supabase
        .schema('api')
        .from('historico_exportacoes')
        .select('*')
        .in('id_lead', leadIds)
        .order('data_exportacao', { ascending: false });
      
      if (error) {
        console.error('❌ [LOAD_EXPORT_HISTORY] Erro ao buscar histórico:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
          status: error.status,
          statusText: error.statusText
        });
        console.error('❌ [LOAD_EXPORT_HISTORY] Erro completo:', error);
        return {};
      }
      
      console.log('✅ [LOAD_EXPORT_HISTORY] SELECT realizado com sucesso');
      console.log('🔍 [LOAD_EXPORT_HISTORY] Dados retornados:', data?.length || 0, 'registros');
      
      if (!data) {
        console.warn('⚠️ [LOAD_EXPORT_HISTORY] Nenhum dado retornado');
        return {};
      }
      
      const history = {};
      const sprinthubIds = new Set();
      
      leadIds.forEach(id => {
        const exports = data.filter(e => e.id_lead === id);
        // Verificar se há histórico do SprintHub
        if (exports.some(exp => isSprinthubHistoryEntry(exp))) {
          sprinthubIds.add(String(id));
        }
        if (exports.length > 0) {
          history[id] = exports;
        }
      });
      
      // Atualizar flags do SprintHub
      if (sprinthubIds.size > 0) {
        setSprinthubExportFlags(prev => {
          const updates = { ...prev };
          sprinthubIds.forEach(id => {
            updates[String(id)] = true;
          });
          return updates;
        });
      }
      
      console.log('✅ [LOAD_EXPORT_HISTORY] Histórico processado:', Object.keys(history).length, 'leads com histórico');
      return history;
    } catch (error) {
      console.error('❌ [LOAD_EXPORT_HISTORY] Erro capturado no catch:', error);
      console.error('❌ [LOAD_EXPORT_HISTORY] Tipo do erro:', typeof error);
      console.error('❌ [LOAD_EXPORT_HISTORY] Stack do erro:', error?.stack);
      return {};
    }
  };

  const registerExport = async (leadIds, motivo, observacao, tag) => {
    console.log('🔍 [REGISTER_EXPORT] Iniciando registro de exportação...');
    console.log('🔍 [REGISTER_EXPORT] Parâmetros:', { 
      leadIds: leadIds?.length || 0, 
      motivo, 
      observacao,
      tag,
      user: user ? { id: user.id, email: user.email } : null
    });
    
    try {
      // Obter ID do usuário do contexto de autenticação (da tabela api.users)
      let userId = null;
      if (user?.id) {
        // Converter para string pois historico_exportacoes.usuario_id é text
        userId = String(user.id);
        console.log('🔍 [REGISTER_EXPORT] User ID obtido:', userId);
      } else {
        console.warn('⚠️ [REGISTER_EXPORT] Nenhum usuário logado, registro sem usuario_id');
      }
      
      const records = leadIds.map(id_lead => {
        const record = {
        id_lead,
        motivo,
          observacao: observacao?.trim() || null,
          tag_exportacao: tag?.trim() || null
        };
        // Só adiciona usuario_id se existir (corresponde ao id da tabela api.users)
        if (userId) {
          record.usuario_id = userId;
        }
        return record;
      });
      
      console.log('🔍 [REGISTER_EXPORT] Records preparados:', {
        total: records.length,
        exemplo: records[0],
        todos_ids: records.map(r => r.id_lead).slice(0, 5)
      });
      
      // Usar a mesma estrutura que funciona no salvarEdicaoCampos
      // Usar o cliente supabase direto com .schema('api') - mesma estrutura que está funcionando
      console.log('🔍 [REGISTER_EXPORT] Executando INSERT na tabela historico_exportacoes...');
      console.log('🔍 [REGISTER_EXPORT] Records a inserir:', {
        count: records.length,
        exemplo: records[0]
      });
      
      // INSERT simples - mesma estrutura do salvarEdicaoCampos (linha 1588-1592)
      // O salvarEdicaoCampos funciona, então vamos usar exatamente a mesma estrutura
      const { error: insertError } = await supabase
        .schema('api')
        .from('historico_exportacoes')
        .insert(records);
      
      if (insertError) {
        console.error('❌ [REGISTER_EXPORT] Erro detalhado ao inserir:', {
          message: insertError.message,
          details: insertError.details,
          hint: insertError.hint,
          code: insertError.code,
          status: insertError.status,
          statusText: insertError.statusText
        });
        console.error('❌ [REGISTER_EXPORT] Erro completo:', insertError);
        console.error('❌ [REGISTER_EXPORT] Verificando se é problema de cache do PostgREST...');
        throw insertError;
      }
      
      console.log('✅ [REGISTER_EXPORT] INSERT realizado com sucesso');
      
      // Se o insert funcionou, atualizar histórico local
      console.log('🔍 [REGISTER_EXPORT] Carregando histórico local...');
      const newHistory = await loadExportHistory(leadIds);
      console.log('✅ [REGISTER_EXPORT] Histórico local carregado:', Object.keys(newHistory).length, 'leads');
      
      setExportHistory(prev => ({ ...prev, ...newHistory }));
      
      console.log('✅ [REGISTER_EXPORT] Exportação registrada com sucesso no histórico');
      return { success: true, history: newHistory };
    } catch (error) {
      console.error('❌ [REGISTER_EXPORT] Erro capturado no catch:', error);
      console.error('❌ [REGISTER_EXPORT] Tipo do erro:', typeof error);
      console.error('❌ [REGISTER_EXPORT] Erro é instance de Error?', error instanceof Error);
      console.error('❌ [REGISTER_EXPORT] Stack do erro:', error?.stack);
      
      // Não bloquear o fluxo, apenas logar o erro
      console.warn('⚠️ [REGISTER_EXPORT] Exportação registrada localmente, mas falhou ao salvar no histórico.');
      return { success: false, error };
    }
  };

  // ===== EXPORTAÇÃO AVANÇADA =====
  const getSelectedRowsFrom = (data) => selectedRows.map(i => data[i]).filter(Boolean);

  const downloadBlob = (content, filename, type) => {
    const blob = new Blob([content], { type: type || 'application/octet-stream' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const exportSelected = (rows, baseName) => {
    if (!rows || rows.length === 0) {
      alert('Nenhum registro selecionado.');
      return;
    }
    // Normalizar valores para exportação: arrays -> string, objetos -> JSON
    const normalizeValue = (v) => {
      if (v == null) return '';
      if (Array.isArray(v)) return v.join(', ');
      if (v instanceof Date) return v.toISOString();
      if (typeof v === 'object') return JSON.stringify(v);
      return v;
    };
    const normalizedRows = rows.map(r => {
      const out = {};
      Object.keys(r || {}).forEach(k => {
        out[k] = normalizeValue(r[k]);
      });
      return out;
    });
    const headers = Object.keys(normalizedRows[0] || {});
    
    if (exportFormat === 'json') {
      downloadBlob(JSON.stringify(normalizedRows, null, 2), `${baseName}.json`, 'application/json;charset=utf-8;');
      return;
    }
    
    if (exportFormat === 'csv') {
      const csvRows = [headers.join(','), ...normalizedRows.map(r => headers.map(h => {
        const val = r[h];
        if (val == null) return '';
        const s = String(val).replace(/"/g, '""');
        return /[",\n]/.test(s) ? `"${s}"` : s;
      }).join(','))];
      downloadBlob(csvRows.join('\n'), `${baseName}.csv`, 'text/csv;charset=utf-8;');
      return;
    }
    
    if (exportFormat === 'excel') {
      try {
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(normalizedRows);
        XLSX.utils.book_append_sheet(wb, ws, 'Dados');
        XLSX.writeFile(wb, `${baseName}.xls`);
      } catch (e) {
        console.error('Erro ao exportar Excel:', e);
        alert('Erro ao exportar em Excel.');
      }
      return;
    }
    
    if (exportFormat === 'xlsx') {
      try {
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(normalizedRows);
        XLSX.utils.book_append_sheet(wb, ws, 'Dados');
        XLSX.writeFile(wb, `${baseName}.xlsx`);
      } catch (e) {
        console.error('Erro ao exportar XLSX:', e);
        alert('Erro ao exportar em XLSX.');
      }
      return;
    }
    
    if (exportFormat === 'pdf') {
      try {
        const doc = new jsPDF({ orientation: 'landscape' });
        const tableData = normalizedRows.map(r => headers.map(h => {
          const val = r[h];
          if (val == null) return '';
          if (val instanceof Date) return val.toLocaleDateString('pt-BR');
          return String(val);
        }));
        autoTable(doc, {
          head: [headers],
          body: tableData,
          styles: { fontSize: 8 },
          margin: { top: 20 }
        });
        doc.save(`${baseName}.pdf`);
      } catch (e) {
        console.error('Erro ao exportar PDF:', e);
        alert('Erro ao exportar em PDF.');
      }
      return;
    }
  };

  const exportSelectedCurrent = (baseName) => {
    let data = [];
    switch (activeTab) {
      case 'ativacao-prime': data = ativacaoPrimeData; break;
      case 'ativacao-fora-prime': data = ativacaoForaPrimeData; break;
      case 'ativacao-com-orcamento': data = ativacaoComOrcamentoData; break;
      case 'ativacao-sem-orcamento': data = ativacaoSemOrcamentoData; break;
      case 'reativacao-1x': data = reativacao1xData; break;
      case 'reativacao-2x': data = reativacao2xData; break;
      case 'reativacao-3x': data = reativacao3xData; break;
      case 'reativacao-3x-plus': data = reativacao3xPlusData; break;
      case 'monitoramento-1-29': data = monitoramento129Data; break;
      case 'monitoramento-30-59': data = monitoramento3059Data; break;
      case 'monitoramento-60-90': data = monitoramento6090Data; break;
      case 'monitoramento-d45': data = monitoramentoD45Data; break;
      case 'monitoramento-d60': data = monitoramentoD60Data; break;
      case 'monitoramento-d75': data = monitoramentoD75Data; break;
      case 'monitoramento-d90': data = monitoramentoD90Data; break;
      default: data = []; break;
    }
    const selected = getSelectedRowsFrom(data);
    if (selected.length === 0) {
      alert('Nenhum registro selecionado.');
      return;
    }
    // Abrir modal para capturar motivo e observação
    setShowExportModal(true);
  };

  const handleExportConfirm = async () => {
    let data = [];
    switch (activeTab) {
      case 'ativacao-prime': data = ativacaoPrimeData; break;
      case 'ativacao-fora-prime': data = ativacaoForaPrimeData; break;
      case 'ativacao-com-orcamento': data = ativacaoComOrcamentoData; break;
      case 'ativacao-sem-orcamento': data = ativacaoSemOrcamentoData; break;
      case 'reativacao-1x': data = reativacao1xData; break;
      case 'reativacao-2x': data = reativacao2xData; break;
      case 'reativacao-3x': data = reativacao3xData; break;
      case 'reativacao-3x-plus': data = reativacao3xPlusData; break;
      case 'monitoramento-1-29': data = monitoramento129Data; break;
      case 'monitoramento-30-59': data = monitoramento3059Data; break;
      case 'monitoramento-60-90': data = monitoramento6090Data; break;
      case 'monitoramento-d45': data = monitoramentoD45Data; break;
      case 'monitoramento-d60': data = monitoramentoD60Data; break;
      case 'monitoramento-d75': data = monitoramentoD75Data; break;
      case 'monitoramento-d90': data = monitoramentoD90Data; break;
      default: data = []; break;
    }
    const selected = getSelectedRowsFrom(data);
    const leadIds = selected.map(row => row.id || row.id_lead || row.id_cliente || row.id_cliente_mestre).filter(Boolean);
    
    // Registrar exportação
    if (leadIds.length > 0) {
      await registerExport(leadIds, exportMotivo, exportObservacao);
    }
    
    // Fazer exportação real
    const exportPrefix = activeTab.includes('ativacao') ? 'ativacao' : activeTab.includes('reativacao') ? 'reativacao' : 'monitoramento';
    exportSelected(selected, `${exportPrefix}_export_${new Date().toISOString().split('T')[0]}`);
    
    // Fechar modal e limpar
    setShowExportModal(false);
    setExportObservacao('');
    setSelectedRows([]);
  };

  const exportAllFromTable = async (baseName, tableName) => {
    try {
      setIsLoading(true);
      const { data } = await supabase.schema('api').from(tableName).select('*');
      exportSelected(data || [], baseName);
    } catch (e) {
      console.error('Erro ao exportar tudo:', e);
      alert('Erro ao exportar.');
    } finally {
      setIsLoading(false);
    }
  };

  // ===== FUNÇÕES AUXILIARES PARA SPRINTHUB =====
  
  /**
   * Normaliza telefone e gera variações (com e sem o 9)
   * Retorna array com todas as variações possíveis do telefone (apenas dígitos)
   */
  const normalizePhoneVariations = (phone) => {
    if (!phone) return [];
    
    // Remove todos os caracteres não numéricos
    const digits = String(phone).replace(/\D/g, '');
    if (!digits) return [];
    
    // Remove código do país se presente (55)
    let localDigits = digits;
    if (digits.startsWith('55') && digits.length > 10) {
      localDigits = digits.substring(2);
    }
    
    const variations = [];
    
    // Se tem 11 dígitos (com 9), adiciona variação sem o 9
    if (localDigits.length === 11) {
      // Formato: DDD + 9 + número (ex: 11987654321)
      const ddd = localDigits.substring(0, 2);
      const terceiroDigito = localDigits[2];
      if (terceiroDigito === '9') {
        const numero = localDigits.substring(3); // Remove o 9
        variations.push(localDigits); // Com 9: 11987654321
        variations.push(`${ddd}${numero}`); // Sem 9: 1187654321
      } else {
        // 11 dígitos mas não tem 9 na posição esperada, apenas adiciona como está
        variations.push(localDigits);
      }
    }
    // Se tem 10 dígitos (sem 9), adiciona variação com o 9
    else if (localDigits.length === 10) {
      // Formato: DDD + número (ex: 1187654321)
      const ddd = localDigits.substring(0, 2);
      const numero = localDigits.substring(2);
      variations.push(localDigits); // Sem 9: 1187654321
      variations.push(`${ddd}9${numero}`); // Com 9: 11987654321
    }
    // Outros formatos, apenas adiciona como está
    else {
      variations.push(localDigits);
    }
    
    // Remove duplicatas
    return [...new Set(variations)];
  };

  /**
   * Verifica se o lead já tem oportunidade aberta em qualquer um dos funis especificados
   * Retorna true se deve criar oportunidade (não tem duplicata), false se já existe (tem duplicata)
   * Objetivo: evitar criar múltiplas oportunidades abertas para o mesmo lead em diferentes funis
   */
  const shouldCreateOpportunity = async (row) => {
    // Funis que devem ser verificados para evitar duplicatas
    const funisParaVerificar = [6, 14, 38, 34, 41, 32, 33, 35];
    
    try {
      // Obter telefones do registro
      const whatsapp = row.whatsapp || row.telefone || '';
      const telefone = row.telefone || row.whatsapp || '';
      
      if (!whatsapp && !telefone) {
        // Sem telefone, permite criar (não consegue verificar)
        console.warn('[ClientesConsolidados] Sem telefone para verificar oportunidades:', row.nome_completo || 'Cliente');
        return true;
      }
      
      // Gerar variações dos telefones
      const whatsappVariations = normalizePhoneVariations(whatsapp);
      const telefoneVariations = normalizePhoneVariations(telefone);
      const allVariations = [...new Set([...whatsappVariations, ...telefoneVariations])];
      
      if (allVariations.length === 0) {
        console.warn('[ClientesConsolidados] Nenhuma variação válida de telefone encontrada:', row.nome_completo || 'Cliente');
        return true;
      }
      
      // Buscar lead pelo telefone (tentar todas as variações)
      let foundLead = null;
      for (const phoneVariation of allVariations) {
        try {
          // findLeadByPhone já faz a sanitização internamente, então passamos apenas os dígitos
          foundLead = await sprinthubService.findLeadByPhone(phoneVariation, phoneVariation);
          if (foundLead && foundLead.id) {
            break; // Encontrou, para de buscar
          }
        } catch (error) {
          console.warn('[ClientesConsolidados] Erro ao buscar lead por telefone:', phoneVariation, error);
          continue;
        }
      }
      
      // Se não encontrou o lead, pode criar
      if (!foundLead || !foundLead.id) {
        return true;
      }
      
      // Buscar oportunidades abertas do lead
      const opportunities = await sprinthubService.listLeadOpportunities(foundLead.id);
      if (!Array.isArray(opportunities) || opportunities.length === 0) {
        return true; // Sem oportunidades, pode criar
      }
      
      // Filtrar apenas oportunidades abertas
      const openOpportunities = opportunities.filter(opp => opp && opp.status === 'open');
      if (openOpportunities.length === 0) {
        return true; // Sem oportunidades abertas, pode criar
      }
      
      // Verificar se alguma oportunidade está em qualquer um dos funis especificados
      const hasExistingOpportunity = openOpportunities.some(opp => {
        const funnelId = opp.funnel_id || opp.funnelId;
        return funnelId && funisParaVerificar.includes(Number(funnelId));
      });
      
      if (hasExistingOpportunity) {
        const existingFunnels = openOpportunities
          .filter(opp => {
            const funnelId = opp.funnel_id || opp.funnelId;
            return funnelId && funisParaVerificar.includes(Number(funnelId));
          })
          .map(opp => opp.funnel_id || opp.funnelId)
          .join(', ');
        console.log(`[ClientesConsolidados] Lead ${foundLead.id} (${row.nome_completo || 'Cliente'}) já tem oportunidade aberta no(s) funil(is): ${existingFunnels}. Não criando nova oportunidade para evitar duplicata.`);
        return false; // Já tem oportunidade aberta, não criar para evitar duplicata
      }
      
      return true; // Não tem oportunidade em funil bloqueado, pode criar
    } catch (error) {
      console.error('[ClientesConsolidados] Erro ao verificar oportunidades existentes:', error);
      // Em caso de erro, permite criar (melhor criar duplicada do que não criar)
      return true;
    }
  };

  const chunkArray = (array, size) => {
    if (!Array.isArray(array) || size <= 0) return [array];
    const chunks = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  };

  const toNumberOrUndefined = (value) => {
    if (value === null || value === undefined || value === '') return undefined;
    const parsed = Number(value);
    if (Number.isNaN(parsed)) return undefined;
    return parsed;
  };

  const getLeadIdentifierCandidates = (row) => {
    if (!row) return [];
    const ids = [];
    const pushId = (value) => {
      if (value === undefined || value === null) return;
      const str = String(value).trim();
      if (!str) return;
      ids.push(str);
    };
    
    pushId(row.id);
    pushId(row.id_cliente_mestre);
    pushId(row.id_cliente);
    pushId(row.id_prime);
    pushId(row.prime_id);
    pushId(row.id_lead);
    pushId(row.lead_id);
    pushId(row.id_sprinthub);
    pushId(row.id_sprint);
    
    return [...new Set(ids)];
  };

  const getLeadIdentifier = (row) => {
    if (!row) return null;
    const candidates = getLeadIdentifierCandidates(row);
    return candidates.length > 0 ? candidates[0] : null;
  };

  const fetchPedidosDataForRows = async (rows) => {
    if (!rows || rows.length === 0) return {};
    const clientIdsRaw = rows
      .map(r => r.id_prime || r.prime_id || r.id_cliente || r.id_cliente_mestre || null)
      .filter(Boolean);
    
    if (clientIdsRaw.length === 0) return {};
    
    const uniqueClientIds = Array.from(new Set(clientIdsRaw.map(id => {
      if (typeof id === 'number') return id;
      const parsed = Number(id);
      return Number.isNaN(parsed) ? id : parsed;
    })));
    
    const pedidosData = {};
    
    try {
      const { data: allPedidos, error: pedidosError } = await supabase
        .schema('api')
        .from('prime_pedidos')
        .select('id, cliente_id, valor_total, data_criacao, data_aprovacao, data_entrega, status_aprovacao, status_geral, status_entrega, codigo_orcamento_original')
        .in('cliente_id', uniqueClientIds)
        .order('data_criacao', { ascending: false });
      
      if (pedidosError) {
        console.error('Erro ao carregar pedidos para SprintHub:', pedidosError);
        return pedidosData;
      }
      
      const pedidosIds = (allPedidos || []).map(p => p.id).filter(Boolean);
      let formulasPorPedido = {};
      
      if (pedidosIds.length > 0) {
        const { data: allFormulas, error: formulasError } = await supabase
          .schema('api')
          .from('prime_formulas')
          .select('id, pedido_id, numero_formula, descricao, posologia, valor_formula')
          .in('pedido_id', pedidosIds)
          .order('numero_formula', { ascending: true });
        
        if (!formulasError && allFormulas) {
          formulasPorPedido = allFormulas.reduce((acc, formula) => {
            if (!acc[formula.pedido_id]) {
              acc[formula.pedido_id] = [];
            }
            acc[formula.pedido_id].push(formula);
            return acc;
          }, {});
        }
      }
      
      uniqueClientIds.forEach(clienteId => {
        const pedidosCliente = (allPedidos || []).filter(p => String(p.cliente_id) === String(clienteId));
        
        const ultimoPedido = pedidosCliente.find(p =>
          p.status_aprovacao === 'APROVADO' ||
          p.status_geral === 'APROVADO' ||
          p.status_entrega === 'ENTREGUE'
        );
        
        const ultimoOrcamento = pedidosCliente.find(p =>
          p.status_aprovacao !== 'APROVADO' &&
          p.status_geral !== 'APROVADO' &&
          p.status_entrega !== 'ENTREGUE'
        );
        
        if (ultimoPedido && formulasPorPedido[ultimoPedido.id]) {
          ultimoPedido.formulas = formulasPorPedido[ultimoPedido.id];
        }
        if (ultimoOrcamento && formulasPorPedido[ultimoOrcamento.id]) {
          ultimoOrcamento.formulas = formulasPorPedido[ultimoOrcamento.id];
        }
        
        const referencia = ultimoPedido || ultimoOrcamento || pedidosCliente?.[0] || null;
        
        pedidosData[clienteId] = {
          ultimoPedido,
          ultimoOrcamento,
          referencia
        };
      });
    } catch (error) {
      console.error('Erro ao buscar dados de pedidos para SprintHub:', error);
    }
    
    return pedidosData;
  };

  const normalizeTagKey = (value) => {
    if (!value) return '';
    return String(value)
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '');
  };

  const resolveTagsForRow = (row) => {
    if (!row) return [];
    const tags = [];

    const addTagIfExists = (value) => {
      const key = normalizeTagKey(value);
      if (!key) return;
      const found = sprinthubAvailableTags.find(t => normalizeTagKey(t?.tag || t?.name) === key);
      if (found && !tags.includes(found.id)) {
        tags.push(found.id);
      }
    };

    if (row.origens) {
      if (Array.isArray(row.origens)) {
        row.origens.forEach(addTagIfExists);
      } else if (typeof row.origens === 'string') {
        row.origens
          .split(/[,;|]/)
          .map((item) => item.trim())
          .filter(Boolean)
          .forEach(addTagIfExists);
      }
    }

    if (row.tags && Array.isArray(row.tags)) {
      row.tags.forEach(addTagIfExists);
    }

    return tags;
  };

  // ===== FUNÇÕES DE ENVIO PARA SPRINTHUB =====
  const handleSprinthubSend = () => {
    if (selectedRows.length === 0) {
      alert('Nenhum registro selecionado.');
      return;
    }
    setSprinthubResults([]);
    setSprinthubError(null);
    setShowSprinthubModal(true);
  };

  const closeSprinthubModal = () => {
    if (isSendingToSprinthub) return;
    setShowSprinthubModal(false);
    setSprinthubResults([]);
    setSprinthubError(null);
  };

  const handleSprinthubConfirm = async () => {
    let data = [];
    switch (activeTab) {
      case 'monitoramento-1-29': data = monitoramento129Data; break;
      case 'monitoramento-30-59': data = monitoramento3059Data; break;
      case 'monitoramento-60-90': data = monitoramento6090Data; break;
      case 'monitoramento-d45': data = monitoramentoD45Data; break;
      case 'monitoramento-d60': data = monitoramentoD60Data; break;
      case 'monitoramento-d75': data = monitoramentoD75Data; break;
      case 'monitoramento-d90': data = monitoramentoD90Data; break;
      default: data = []; break;
    }
    
    const selected = selectedRows.map(i => data[i]).filter(Boolean);
    if (selected.length === 0) {
      setSprinthubError('Nenhum registro válido selecionado.');
      return;
    }

    const funnelIdValue = sprinthubFunnelId?.trim();
    if (!funnelIdValue) {
      setSprinthubError('Por favor, preencha o campo "Funil (ID)" no modal.');
      return;
    }

    const batchSizeValue = Math.max(1, parseInt(sprinthubBatchSize, 10) || 50);
    const batches = chunkArray(selected, batchSizeValue);

    setIsSendingToSprinthub(true);
    setSprinthubError(null);
    setSprinthubProgress({
      totalLeads: selected.length,
      processed: 0,
      currentBatch: 0,
      totalBatches: batches.length,
      batchSize: batchSizeValue,
      batchProcessed: 0,
      currentLeadName: ''
    });

    try {
      const pedidosData = await fetchPedidosDataForRows(selected);
      const normalizedOrders = sprinthubService.normalizeOrdersFromPrime(pedidosData);
      const allResults = [];
      let processedCount = 0;

      const resumoConfiguracaoBase = [
        `Funil: ${sprinthubFunnelId || SPRINTHUB_CONFIG.defaultFunnelId || '-'}`,
        `Coluna: ${sprinthubEtapa || SPRINTHUB_CONFIG.defaultColumnId || '-'}`,
        `Sequência: ${sprinthubSequence || SPRINTHUB_CONFIG.defaultSequenceId || '0'}`,
        `Vendedor: ${sprinthubVendedor || SPRINTHUB_CONFIG.defaultUserId || '-'}`,
        `Prefixo: ${sprinthubTituloPrefix || '-'}`,
        `Origem: ${sprinthubOrigemOportunidade || '-'}`,
        `Tipo de Compra: ${sprinthubTipoCompra || '-'}`
      ].join(' | ');

      for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
        const batchRows = batches[batchIndex];
        const batchResults = [];
        const batchLeadIds = [];

        setSprinthubProgress(prev => prev ? { ...prev, currentBatch: batchIndex + 1, batchProcessed: 0 } : prev);

        for (const row of batchRows) {
          const clientId = row.id_prime || row.prime_id || row.id_cliente || row.id_cliente_mestre || null;
          const leadPayload = sprinthubService.normalizeLeadFromRow(row);
          const tagsForLead = resolveTagsForRow(row);
          const ordersForLead = normalizedOrders.filter(order => String(order.leadPrimeId) === String(clientId));
          const leadName = row.nome_completo || row.nome || 'Cliente';

          setSprinthubProgress(prev => prev ? { ...prev, currentLeadName: leadName } : prev);

          let referencia = null;
          if (clientId && pedidosData[clientId]) {
            referencia = pedidosData[clientId].ultimoPedido || pedidosData[clientId].ultimoOrcamento || pedidosData[clientId].referencia || null;
          }

          const ultimoPedidoResumo = clientId && pedidosData[clientId]?.ultimoPedido
            ? sprinthubService.buildResumoPedido(pedidosData[clientId].ultimoPedido)
            : '';
          const ultimoOrcamentoResumo = clientId && pedidosData[clientId]?.ultimoOrcamento
            ? sprinthubService.buildResumoPedido(pedidosData[clientId].ultimoOrcamento, { isOrcamento: true })
            : '';

          const ultimoPedidoData = clientId && pedidosData[clientId]?.ultimoPedido?.data_criacao
            ? pedidosData[clientId].ultimoPedido.data_criacao
            : null;
          const ultimoOrcamentoData = clientId && pedidosData[clientId]?.ultimoOrcamento?.data_criacao
            ? pedidosData[clientId].ultimoOrcamento.data_criacao
            : null;

          const referenceValueRaw = referencia?.valor_total ?? ordersForLead?.[0]?.valor ?? 0;
          const referenceValue = Number(referenceValueRaw);

          const funnelIdFromModal = toNumberOrUndefined(sprinthubFunnelId);
          const funnelIdFinal = funnelIdFromModal ?? SPRINTHUB_CONFIG.defaultFunnelId;

          if (!funnelIdFinal) {
            throw new Error('Funil (ID) não configurado. Por favor, preencha o campo "Funil (ID)" no modal ou configure VITE_SPRINTHUB_FUNNEL_ID no .env');
          }

          const valueAsString = Number.isNaN(referenceValue) ? '0' : String(referenceValue);
          const sequenceValue = toNumberOrUndefined(sprinthubSequence) ?? SPRINTHUB_CONFIG.defaultSequenceId;
          const sequenceAsString = sequenceValue !== undefined && sequenceValue !== null ? String(sequenceValue) : '0';

          const opportunityPayload = {
            funnelId: funnelIdFinal,
            title: `${sprinthubTituloPrefix || 'Monitoramento'} | ${leadPayload.firstname || row.nome_completo || row.nome || ''}`.trim(),
            value: valueAsString,
            crm_column: toNumberOrUndefined(sprinthubEtapa) ?? SPRINTHUB_CONFIG.defaultColumnId,
            sequence: sequenceAsString,
            status: 'open',
            user: toNumberOrUndefined(sprinthubVendedor) ?? SPRINTHUB_CONFIG.defaultUserId,
            fields: {},
          };

          if (clientId) {
            opportunityPayload.fields["idprime"] = String(clientId);
          }

          if (ultimoPedidoData) {
            try {
              const dataPedido = ultimoPedidoData instanceof Date ? ultimoPedidoData : new Date(ultimoPedidoData);
              if (!isNaN(dataPedido.getTime())) {
                opportunityPayload.fields["ultimopedido"] = dataPedido.toISOString().split('T')[0];
              }
            } catch (e) {
              console.warn('[ClientesConsolidados] Erro ao converter data do pedido:', e);
            }
          }

          if (ultimoOrcamentoData) {
            try {
              const dataOrcamento = ultimoOrcamentoData instanceof Date ? ultimoOrcamentoData : new Date(ultimoOrcamentoData);
              if (!isNaN(dataOrcamento.getTime())) {
                opportunityPayload.fields["ultimoorcamento"] = dataOrcamento.toISOString().split('T')[0];
              }
            } catch (e) {
              console.warn('[ClientesConsolidados] Erro ao converter data do orçamento:', e);
            }
          }

          if (ultimoPedidoResumo) {
            opportunityPayload.fields["Descricao da Formula"] = ultimoPedidoResumo;
          }

          opportunityPayload.fields["ORIGEM OPORTUNIDADE"] = sprinthubOrigemOportunidade || "Monitoramento";
          opportunityPayload.fields["Tipo de Compra"] = sprinthubTipoCompra || "recompra monitoramento";

          // Verificar se já existe oportunidade aberta nos funis bloqueados
          const canCreate = await shouldCreateOpportunity(row);
          
          let ensureResult;
          if (!canCreate) {
            // Não deve criar oportunidade (já existe em algum dos funis verificados)
            ensureResult = {
              lead: null,
              opportunity: { 
                id: null, 
                status: 'skipped',
                reason: 'Já existe oportunidade aberta em um dos funis verificados (6, 14, 38, 34, 41, 32, 33, 35). Evitando duplicata.'
              },
              errors: []
            };
            console.log(`[ClientesConsolidados] Pulando criação de oportunidade para ${leadName}: já existe oportunidade aberta em um dos funis verificados (evitando duplicata)`);
          } else {
            try {
              ensureResult = await sprinthubService.ensureLeadAndOpportunity({
                lead: leadPayload,
                opportunity: opportunityPayload,
                tags: tagsForLead,
                orders: ordersForLead,
                rowData: row,
              });
            } catch (error) {
              console.error('[ClientesConsolidados] Erro ao enviar lead individual para SprintHub:', error);
              ensureResult = { errors: [{ message: error?.message || 'Erro ao enviar lead' }] };
            }
          }

          const leadIdentifier = getLeadIdentifier(row);
          batchResults.push({
            id: leadIdentifier,
            nome: leadName,
            ensureResult,
          });
          if (leadIdentifier) {
            batchLeadIds.push(leadIdentifier);
          }

          processedCount += 1;
          setSprinthubProgress(prev => prev ? {
            ...prev,
            processed: processedCount,
            batchProcessed: (prev.batchProcessed || 0) + 1,
          } : prev);
        }

        allResults.push(...batchResults);

        if (batchLeadIds.length > 0) {
          const successCountBatch = batchResults.filter(r => r.ensureResult?.lead?.id && !r.ensureResult?.errors?.length).length;
          const errorCountBatch = batchResults.length - successCountBatch;
          const observacaoSprintHub = `${resumoConfiguracaoBase} | Lote ${batchIndex + 1}/${batches.length} | Enviados: ${successCountBatch} | Erros: ${errorCountBatch}`;
          const motivoSprintHub = 'WHATSAPI';
          const tagHistoricoSprintHub = 'SPRINTHUB';

          try {
            await registerExport(batchLeadIds, motivoSprintHub, observacaoSprintHub, tagHistoricoSprintHub);
            // Atualizar flags do SprintHub
            setSprinthubExportFlags(prev => {
              const updates = { ...prev };
              batchLeadIds.forEach(id => {
                if (id) updates[String(id)] = true;
              });
              return updates;
            });
            // Recarregar histórico para atualizar a UI
            const newHistory = await loadExportHistory(batchLeadIds);
            setExportHistory(prev => ({ ...prev, ...newHistory }));
          } catch (histError) {
            console.warn('Erro ao registrar histórico do lote SprintHub:', histError);
          }
        }
      }

      setSprinthubResults(allResults);
      setSelectedRows([]);
      loadTabData();
    } catch (error) {
      console.error('Erro ao enviar dados para SprintHub:', error);
      setSprinthubError(error.message || 'Erro ao enviar dados para a SprintHub.');
    } finally {
      setIsSendingToSprinthub(false);
      setSprinthubProgress(null);
    }
  };

  const toggleGroup = (groupKey) => {
    setCollapsedGroups(prev => ({
      ...prev,
      [groupKey]: !prev[groupKey]
    }));
  };

  // Funções de controle
  const toggleSidebar = () => {
    if (window.innerWidth <= 768) {
      setMobileMenuOpen(!mobileMenuOpen);
    } else {
      setSidebarExpanded(!sidebarExpanded);
    }
  };

  const closeMobileMenu = () => setMobileMenuOpen(false);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
    const container = document.querySelector('.dashboard-container');
    if (container) {
      if (isDarkMode) {
        container.classList.add('light-theme');
      } else {
        container.classList.remove('light-theme');
      }
    }
  };

  const changeLanguage = (language) => setCurrentLanguage(language);

  // Carregar dados do cliente ao abrir o modal de nome
  useEffect(() => {
    const fetchDetails = async () => {
      if (!showNameModal || !selectedClientForName) return;
      const clientId = selectedClientForName.id;

      // Prevenir recarregamento se já temos os dados carregados
      if (editFields && editFields.nome_completo !== undefined) return;

      const { data } = await supabase
        .schema('api')
        .from('clientes_mestre')
        .select('*, id_prime, id_sprinthub')
        .eq('id', clientId)
        .single();
      if (data) {
        setEditFields({
          nome_completo: data.nome_completo || '',
          email: data.email || '',
          whatsapp: data.whatsapp || '',
          telefone: data.telefone || '',
          cpf: data.cpf || '',
          sexo: data.sexo || '',
          data_nascimento: data.data_nascimento || '',
          endereco_rua: data.endereco_rua || '',
          endereco_numero: data.endereco_numero || '',
          endereco_complemento: data.endereco_complemento || '',
          cep: data.cep || '',
          cidade: data.cidade || '',
          estado: data.estado || ''
        });
        // Se o ID do sprinthub/prime não veio do item da lista, preenche a partir da tabela mestre
        setSelectedClientForName(prev => ({
          ...(prev || {}),
          id_prime: prev?.id_prime ?? data.id_prime ?? null,
          id_sprinthub: prev?.id_sprinthub ?? data.id_sprinthub ?? null
        }));
      }
    };
    fetchDetails();
  }, [showNameModal, selectedClientForName?.id]);

  const onChangeField = (k, v) => setEditFields(prev => ({ ...(prev || {}), [k]: v }));

  const salvarEdicaoCampos = async () => {
    if (!selectedClientForName || !editFields) return;
    const clientId = selectedClientForName.id;
    try {
      const normalizeUpdates = (obj) => {
        const out = { ...(obj || {}) };
        // normaliza data_nascimento: aceita dd/mm/aaaa ou ISO; vazio => null
        if (Object.prototype.hasOwnProperty.call(out, 'data_nascimento')) {
          const v = (out.data_nascimento ?? '').toString().trim();
          if (!v) {
            out.data_nascimento = null;
          } else if (/^\d{2}\/\d{2}\/\d{4}$/.test(v)) {
            const [dd, mm, yyyy] = v.split('/');
            const iso = `${yyyy}-${mm}-${dd}`; // yyyy-mm-dd
            out.data_nascimento = iso;
          }
        }
        return out;
      };
      const updates = { ...normalizeUpdates(editFields), data_ultima_atualizacao: new Date().toISOString() };
      const { error } = await supabase
        .schema('api')
        .from('clientes_mestre')
        .update(updates)
        .eq('id', clientId);
      if (error) throw error;

      const records = Object.entries(editFields).map(([campo, valor]) => ({
        id_cliente_mestre: clientId,
        campo_protegido: campo,
        valor_protegido: valor,
        motivo: 'Edição manual'
      }));
      await supabase.schema('api').from('campos_protegidos').upsert(records, { onConflict: 'id_cliente_mestre,campo_protegido' });

      setShowNameModal(false);
      setSelectedClientForName(null);
      setEditFields(null);
      loadTabData();
    } catch (e) {
      console.error('Erro ao salvar alterações', e);
      alert('Erro ao salvar alterações');
    }
  };

  // Configuração do menu lateral
  const menuConfig = [
    {
      key: 'dashboards',
      title: 'Dashboards',
      items: [
        { key: 'dashboard', icon: '📊', label: 'Dashboard Geral', description: 'Visão geral completa' },
        { key: 'dashboard-sprint', icon: '📱', label: 'Dashboard Sprint', description: 'Análise do Sprint Hub' },
        { key: 'dashboard-prime', icon: '🏢', label: 'Dashboard Prime', description: 'Análise do Prime' }
      ]
    },
    {
      key: 'analises',
      title: 'Análises Básicas',
      items: [
        { key: 'completude', icon: '📋', label: 'Completude', description: 'Completude dos dados' },
        { key: 'origens', icon: '🔍', label: 'Origens', description: 'Análise por origem' },
        { key: 'falta-prime', icon: '📤', label: 'Falta no Prime', description: 'Clientes para adicionar no Prime' },
        { key: 'falta-sprint', icon: '📤', label: 'Falta no Sprint', description: 'Clientes para adicionar no Sprint' }
      ]
    },
    {
      key: 'qualidade',
      title: 'Qualidade de Dados',
      items: [
        { key: 'duplicados', icon: '🔄', label: 'Duplicados', description: 'Clientes em múltiplas origens' },
        { key: 'qualidade', icon: '⭐', label: 'Análise de Qualidade', description: 'Distribuição por qualidade' },
        { key: 'baixa-qualidade', icon: '⚠️', label: 'Baixa Qualidade', description: 'Clientes com dados incompletos' }
      ]
    },
    {
      key: 'marketing',
      title: 'Campanhas e Marketing',
      items: [
        { key: 'aniversariantes-mes', icon: '🎂', label: 'Aniversariantes do Mês', description: 'Aniversários no mês atual' },
        { key: 'aniversariantes-proximos', icon: '🎉', label: 'Próximos Aniversariantes', description: 'Aniversários nos próximos 30 dias' }
      ]
    },
    {
      key: 'gestao-clientes',
      title: '👥 Gestão de Clientes',
      items: [
        { key: 'dashboard-gestao', icon: '📊', label: 'Dashboard Gestão', description: 'Visão geral completa' },
        { key: 'validacao-integridade', icon: '✅', label: 'Validação Integridade', description: 'Prime vs Clientes Mestre' }
      ]
    },
    {
      key: 'ativacao',
      title: '🚀 ATIVAÇÃO (Nunca Compraram)',
      items: [
        { key: 'ativacao-geral', icon: '📊', label: 'Dashboard Ativação', description: 'Visão geral dos que nunca compraram' },
        { key: 'ativacao-prime', icon: '🏢', label: 'Ativação - No Prime', description: 'No Prime, nunca compraram' },
        { key: 'ativacao-fora-prime', icon: '🚫', label: 'Ativação - Fora do Prime', description: 'Não estão no Prime' },
        { key: 'ativacao-com-orcamento', icon: '📋', label: 'Com Histórico de Orçamento', description: 'Orçaram mas não compraram' },
        { key: 'ativacao-sem-orcamento', icon: '📭', label: 'Sem Histórico de Orçamento', description: 'Nunca orçaram' }
      ]
    },
    {
      key: 'reativacao',
      title: '🔄 REATIVAÇÃO (90+ dias sem comprar)',
      items: [
        { key: 'reativacao-geral', icon: '📊', label: 'Dashboard Reativação', description: 'Todos sem comprar há 90+ dias' },
        { key: 'reativacao-1x', icon: '1️⃣', label: 'Compraram 1x', description: '90+ dias, 1 compra' },
        { key: 'reativacao-2x', icon: '2️⃣', label: 'Compraram 2x', description: '90+ dias, 2 compras' },
        { key: 'reativacao-3x', icon: '3️⃣', label: 'Compraram 3x', description: '90+ dias, 3 compras' },
        { key: 'reativacao-3x-plus', icon: '🔥', label: 'Compraram 3+ vezes', description: '90+ dias, 3+ compras' }
      ]
    },
    {
      key: 'monitoramento',
      title: '👀 MONITORAMENTO (Últimos 90 dias)',
      items: [
        { key: 'monitoramento-geral', icon: '📊', label: 'Dashboard Monitoramento', description: 'Compraram nos últimos 90 dias' },
        { key: 'monitoramento-1-29', icon: '🟢', label: '1-29 dias', description: 'Compraram há 1-29 dias' },
        { key: 'monitoramento-30-59', icon: '🟡', label: '30-59 dias', description: 'Compraram há 30-59 dias' },
        { key: 'monitoramento-60-90', icon: '🟠', label: '60-90 dias', description: 'Compraram há 60-90 dias' },
        { key: 'monitoramento-d45', icon: '🔵', label: 'D45 (31-45 dias)', description: 'Compraram há 31-45 dias' },
        { key: 'monitoramento-d60', icon: '🟣', label: 'D60 (46-60 dias)', description: 'Compraram há 46-60 dias' },
        { key: 'monitoramento-d75', icon: '🟤', label: 'D75 (61-75 dias)', description: 'Compraram há 61-75 dias' },
        { key: 'monitoramento-d90', icon: '⚫', label: 'D90 (76-90 dias)', description: 'Compraram há 76-90 dias' }
      ]
    },
    {
      key: 'faltantes',
      title: 'Dados Faltantes',
      items: [
        { key: 'sem-cpf', icon: '🆔', label: 'Sem CPF', description: 'Clientes sem CPF cadastrado' },
        { key: 'sem-email', icon: '📧', label: 'Sem Email', description: 'Clientes sem email' },
        { key: 'sem-contato', icon: '📵', label: 'Sem Contato', description: 'Clientes sem nenhum contato' }
      ]
    },
    {
      key: 'geografia',
      title: 'Análise Geográfica',
      items: [
        { key: 'distribuicao-geo', icon: '🗺️', label: 'Distribuição Geográfica', description: 'Por estado e cidade' },
        { key: 'top-cidades', icon: '🏙️', label: 'Top Cidades', description: 'Cidades com mais clientes' }
      ]
    },
    {
      key: 'especiais',
      title: 'Clientes Especiais',
      items: [
        { key: 'completos-alcancaveis', icon: '✅', label: 'Completos e Alcançáveis', description: 'Com todos os contatos' },
        { key: 'dados-essenciais', icon: '⚡', label: 'Dados Essenciais', description: 'Com dados principais' }
      ]
    },
    {
      key: 'historico',
      title: 'Histórico',
      items: [
        { key: 'atualizacoes-7dias', icon: '📅', label: 'Últimos 7 Dias', description: 'Atualizações recentes' },
        { key: 'atualizacoes-30dias', icon: '📆', label: 'Últimos 30 Dias', description: 'Atualizações do mês' }
      ]
    },
    {
      key: 'executivo',
      title: 'Executivo',
      items: [
        { key: 'executivo', icon: '📈', label: 'Relatório Executivo', description: 'Resumo geral do sistema' }
      ]
    }
  ];

  // Obter informações da aba ativa
  const getActiveTabInfo = () => {
    for (const group of menuConfig) {
      const item = group.items.find(i => i.key === activeTab);
      if (item) return item;
    }
    return { label: 'Dashboard', description: 'Visão geral' };
  };

  const activeTabInfo = getActiveTabInfo();

  // ===== RENDERIZAÇÕES =====

  // Componente de paginação reutilizável
  const renderPagination = () => {
    // Se filtro de duplicatas está ativo, calcular totalPages baseado nos dados filtrados
    let calculatedTotal = totalCount;
    if (duplicatesFilter !== 'all' && allDataForTab.length > 0) {
      // Recalcular total baseado nos dados filtrados
      let filtered = filterRowsByNameStatus(allDataForTab);
      filtered = filterRowsByDuplicates(filtered);
      calculatedTotal = filtered.length;
    }
    
    const totalPages = Math.ceil(calculatedTotal / itemsPerPage);
    if (totalPages <= 1) return null;

    return (
      <div className="cc-pagination">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <label htmlFor="cc-items-per-page" style={{ fontSize: '12px', opacity: 0.9 }}>Por página:</label>
          <select
            id="cc-items-per-page"
            value={itemsPerPage}
            onChange={(e) => {
              const value = parseInt(e.target.value, 10);
              setItemsPerPage(value);
              setCurrentPage(1);
            }}
            className="cc-select cc-select-small"
          >
            <option value={50}>50</option>
            <option value={100}>100</option>
            <option value={250}>250</option>
            <option value={500}>500</option>
            <option value={1000}>1000</option>
          </select>
        </div>
        <button
          className="cc-btn cc-btn-small"
          onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
          disabled={currentPage === 1}
        >
          ← Anterior
        </button>
        <span>
          Página {currentPage} de {totalPages} | Total: {(duplicatesFilter !== 'all' && allDataForTab.length > 0 ? (() => {
            let filtered = filterRowsByNameStatus(allDataForTab);
            filtered = filterRowsByDuplicates(filtered);
            return filtered.length;
          })() : totalCount).toLocaleString()}
        </span>
        <button
          className="cc-btn cc-btn-small"
          onClick={() => setCurrentPage(p => p + 1)}
          disabled={currentPage >= totalPages}
        >
          Próxima →
        </button>
      </div>
    );
  };

  // Renderizar tabela genérica de clientes
  const renderClientesTable = (data, columns) => (
    <div className="cc-table-wrapper">
      <table className="cc-table cc-table-list">
        <thead>
          <tr>
            <th>
              <input
                type="checkbox"
                checked={data.length > 0 && selectedRows.length === data.length}
                onChange={(e) => {
                  if (e.target.checked) setSelectedRows(data.map((_, i) => i));
                  else setSelectedRows([]);
                  setLastClickedIndex(null);
                }}
                title="Selecionar página"
              />
            </th>
            {columns.map((col, idx) => (
              <th key={idx}>
                {col.sortField || col.field ? (
                  <button
                    className="cc-table-sortable"
                    onClick={() => {
                      const field = col.sortField || col.field;
                      if (!field) return;
                      setCurrentPage(1);
                      if (sortField === field) {
                        setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
                      } else {
                        setSortField(field);
                        setSortDirection('asc');
                      }
                    }}
                    title="Ordenar"
                  >
                    {col.header}
                    { (col.sortField || col.field) && sortField === (col.sortField || col.field) && (
                      <span style={{ marginLeft: 6 }}>{sortDirection === 'asc' ? '▲' : '▼'}</span>
                    )}
                  </button>
                ) : (
                  col.header
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, idx) => {
            // Verificar se cliente tem duplicados (GLOBAL - independente de filtros)
            // IMPORTANTE: Normalizar ID para string para garantir correspondência
            const rawId = row.id || row.id_cliente || row.id_cliente_mestre;
            const clientId = rawId ? String(rawId) : null;
            
            // Verificar duplicatas (usar ID normalizado como string)
            // IMPORTANTE: Array vazio [] significa que TEM duplicatas (detalhes carregados sob demanda)
            // Array com length > 0 significa que tem duplicatas com detalhes carregados
            let hasDuplicates = false;
            let duplicatesArray = null;
            
            if (clientId) {
              // Tentar como string
              if (duplicatesData.hasOwnProperty(clientId)) {
                duplicatesArray = duplicatesData[clientId];
                // IMPORTANTE: Array vazio [] ou array com itens ambos indicam duplicatas
                // Array vazio = marcado como duplicado, detalhes serão carregados ao clicar
                // Array com itens = detalhes já carregados
                hasDuplicates = Array.isArray(duplicatesArray); // Qualquer array (vazio ou não) = tem duplicatas
              }
              // Tentar como número também (caso tenha sido salvo como número)
              else if (duplicatesData.hasOwnProperty(Number(clientId))) {
                duplicatesArray = duplicatesData[Number(clientId)];
                hasDuplicates = Array.isArray(duplicatesArray);
              }
            }
            
            return (
              <tr 
                key={idx}
                className={hasDuplicates ? 'cc-row-duplicate' : ''}
                  style={hasDuplicates ? { 
                    backgroundColor: '#f90808', 
                    cursor: 'pointer',
                    borderLeft: '4px solid #af6b6b'
                  } : {}}
                onClick={async (e) => {
                  // Não abrir modal se clicar no checkbox ou em elementos interativos
                  if (e.target.type === 'checkbox' || e.target.tagName === 'BUTTON' || e.target.tagName === 'INPUT' || e.target.closest('button') || e.target.closest('input')) {
                    return;
                  }
                  
                    // Se tem duplicados carregados, mostrar modal
                    if (hasDuplicates && duplicatesArray && clientId) {
                      const clientWithDups = { ...row, duplicates: duplicatesArray };
                      setSelectedDuplicatesClient(clientWithDups);
                      setSelectedMasterLead(null);
                      setFieldSelection({});
                      setShowDuplicatesModal(true);
                      loadPrimeDataForDuplicates(clientWithDups, duplicatesArray);
                      return;
                    }
                    
                    // Caso contrário, detectar duplicatas primeiro
                    if (clientId) {
                      console.log('🔍 Detectando duplicatas para:', row.nome_completo);
                      const dups = await detectDuplicates(row);
                      
                      if (dups.length > 0) {
                        // Atualizar estado com duplicatas encontradas (usar ID normalizado como string)
                        const clientWithDups = { ...row, duplicates: dups };
                        setDuplicatesData(prev => ({ ...prev, [clientId]: dups }));
                        setSelectedDuplicatesClient(clientWithDups);
                        setSelectedMasterLead(null);
                        setFieldSelection({});
                        setShowDuplicatesModal(true);
                        loadPrimeDataForDuplicates(clientWithDups, dups);
                      } else {
                        // Marcar como verificado mesmo sem duplicatas (para evitar reprocessamento)
                        setDuplicatesData(prev => ({ ...prev, [clientId]: [] }));
                        alert('Nenhuma duplicata encontrada para este cliente.');
                      }
                    }
                }}
                title={hasDuplicates ? (duplicatesArray && duplicatesArray.length > 0 ? `${duplicatesArray.length} duplicata(s) encontrada(s) - Clique para ver detalhes` : 'Duplicata(s) encontrada(s) - Clique para ver detalhes') : 'Clique para verificar duplicatas'}
              >
              <td>
                <input
                  type="checkbox"
                  checked={selectedRows.includes(idx)}
                  onChange={(e) => {
                      e.stopPropagation(); // Prevenir clique na linha
                    const willSelect = e.target.checked;
                    
                    // Sem Shift: toggle simples
                    if (!e.shiftKey || lastClickedIndex === null || lastClickedIndex === idx) {
                      setSelectedRows(prev => {
                        const set = new Set(prev);
                        if (willSelect) {
                          set.add(idx);
                        } else {
                          set.delete(idx);
                        }
                        return Array.from(set).sort((a,b)=>a-b);
                      });
                      setLastClickedIndex(idx);
                      return;
                    }

                    // Com Shift: selecionar range
                    const [start, end] = lastClickedIndex < idx 
                      ? [lastClickedIndex, idx] 
                      : [idx, lastClickedIndex];
                    
                    const range = [];
                    for (let i = start; i <= end; i++) {
                      range.push(i);
                    }
                    
                    setSelectedRows(prev => {
                      const set = new Set(prev);
                      range.forEach(i => {
                        if (willSelect) {
                          set.add(i);
                        } else {
                          set.delete(i);
                        }
                      });
                      return Array.from(set).sort((a,b)=>a-b);
                    });
                    setLastClickedIndex(idx);
                  }}
                />
              </td>
              {columns.map((col, colIdx) => (
                  <td key={colIdx} onClick={(e) => {
                    // Se clicar em elementos interativos (botões, links), não propagar
                    if (e.target.tagName === 'BUTTON' || e.target.tagName === 'A' || e.target.closest('button') || e.target.closest('a')) {
                      e.stopPropagation();
                    }
                  }}>
                  {col.render ? col.render(row) : (row[col.field] ?? '-')}
                </td>
              ))}
            </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );

  const renderDashboard = () => (
    <div className="cc-dashboard-grid">
      <div className="cc-card">
        <h2>📊 Dashboard Geral</h2>
        <div className="cc-table-container">
          <table className="cc-table">
            <thead>
              <tr>
                <th>Métrica</th>
                <th>Valor</th>
                <th>Percentual</th>
              </tr>
            </thead>
            <tbody>
              {dashboardData.map((row, idx) => (
                <tr key={idx} className={row.metrica.includes('─') ? 'separator-row' : ''}>
                  <td>{row.metrica}</td>
                  <td className="value-cell">{row.valor}</td>
                  <td className="percent-cell">{row.percentual}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderDashboardSprint = () => {
    if (!dashboardSprintData) return null;

    return (
      <div className="cc-dashboard-grid">
        <div className="cc-card cc-card-highlight">
          <h2>📱 Dashboard Sprint Hub</h2>
          <div className="cc-stat-big">
            <span className="cc-stat-label">Total de Leads</span>
            <span className="cc-stat-value-large">{dashboardSprintData.total_leads?.toLocaleString()}</span>
          </div>
        </div>

        <div className="cc-card">
          <h3>📧 Email</h3>
          <div className="cc-stat-row">
            <span className="cc-stat-value">{dashboardSprintData.com_email?.toLocaleString()}</span>
            <span className="cc-stat-perc">{dashboardSprintData.perc_com_email}%</span>
          </div>
          <div className="cc-progress-bar">
            <div className="cc-progress-fill" style={{ width: `${dashboardSprintData.perc_com_email}%` }}></div>
          </div>
        </div>

        <div className="cc-card">
          <h3>💬 WhatsApp</h3>
          <div className="cc-stat-row">
            <span className="cc-stat-value">{dashboardSprintData.com_whatsapp?.toLocaleString()}</span>
            <span className="cc-stat-perc">{dashboardSprintData.perc_com_whatsapp}%</span>
          </div>
          <div className="cc-progress-bar">
            <div className="cc-progress-fill" style={{ width: `${dashboardSprintData.perc_com_whatsapp}%` }}></div>
          </div>
        </div>

        <div className="cc-card">
          <h3>🆔 CPF</h3>
          <div className="cc-stat-row">
            <span className="cc-stat-value">{dashboardSprintData.com_cpf?.toLocaleString()}</span>
            <span className="cc-stat-perc">{dashboardSprintData.perc_com_cpf}%</span>
          </div>
          <div className="cc-progress-bar">
            <div className="cc-progress-fill" style={{ width: `${dashboardSprintData.perc_com_cpf}%` }}></div>
          </div>
        </div>

        <div className="cc-card">
          <h3>🎂 Data Nascimento</h3>
          <div className="cc-stat-row">
            <span className="cc-stat-value">{dashboardSprintData.com_data_nascimento?.toLocaleString()}</span>
            <span className="cc-stat-perc">{dashboardSprintData.perc_com_data_nascimento}%</span>
          </div>
          <div className="cc-progress-bar">
            <div className="cc-progress-fill" style={{ width: `${dashboardSprintData.perc_com_data_nascimento}%` }}></div>
          </div>
        </div>

        <div className="cc-card cc-card-complete">
          <h3>⭐ Qualidade Média</h3>
          <div className="cc-stat-value-large">{dashboardSprintData.qualidade_media}/100</div>
        </div>

        <div className="cc-card">
          <h3>✅ Alta Qualidade (80-100)</h3>
          <div className="cc-stat-value">{dashboardSprintData.qualidade_alta?.toLocaleString()}</div>
        </div>

        <div className="cc-card">
          <h3>🟡 Média Qualidade (60-79)</h3>
          <div className="cc-stat-value">{dashboardSprintData.com_qualidade_media?.toLocaleString()}</div>
        </div>

        <div className="cc-card">
          <h3>🔴 Baixa Qualidade (&lt;60)</h3>
          <div className="cc-stat-value">{dashboardSprintData.qualidade_baixa?.toLocaleString()}</div>
        </div>

        <div className="cc-card">
          <h3>🔗 Também no Prime</h3>
          <div className="cc-stat-value">{dashboardSprintData.tambem_no_prime?.toLocaleString()}</div>
        </div>

        <div className="cc-card cc-card-warning">
          <h3>⚠️ Somente no Sprint</h3>
          <div className="cc-stat-value">{dashboardSprintData.somente_sprint?.toLocaleString()}</div>
          <button className="cc-btn cc-btn-primary" onClick={() => setActiveTab('falta-prime')}>
            Ver Lista
          </button>
        </div>
      </div>
    );
  };

  const renderDashboardPrime = () => {
    if (!dashboardPrimeData) return null;

    return (
      <div className="cc-dashboard-grid">
        <div className="cc-card cc-card-highlight">
          <h2>🏢 Dashboard Prime</h2>
          <div className="cc-stat-big">
            <span className="cc-stat-label">Total de Clientes</span>
            <span className="cc-stat-value-large">{dashboardPrimeData.total_clientes?.toLocaleString()}</span>
          </div>
        </div>

        <div className="cc-card">
          <h3>📧 Email</h3>
          <div className="cc-stat-row">
            <span className="cc-stat-value">{dashboardPrimeData.com_email?.toLocaleString()}</span>
            <span className="cc-stat-perc">{dashboardPrimeData.perc_com_email}%</span>
          </div>
          <div className="cc-progress-bar">
            <div className="cc-progress-fill" style={{ width: `${dashboardPrimeData.perc_com_email}%` }}></div>
          </div>
        </div>

        <div className="cc-card">
          <h3>💬 WhatsApp</h3>
          <div className="cc-stat-row">
            <span className="cc-stat-value">{dashboardPrimeData.com_whatsapp?.toLocaleString()}</span>
            <span className="cc-stat-perc">{dashboardPrimeData.perc_com_whatsapp}%</span>
          </div>
          <div className="cc-progress-bar">
            <div className="cc-progress-fill" style={{ width: `${dashboardPrimeData.perc_com_whatsapp}%` }}></div>
          </div>
        </div>

        <div className="cc-card">
          <h3>🆔 CPF</h3>
          <div className="cc-stat-row">
            <span className="cc-stat-value">{dashboardPrimeData.com_cpf?.toLocaleString()}</span>
            <span className="cc-stat-perc">{dashboardPrimeData.perc_com_cpf}%</span>
          </div>
          <div className="cc-progress-bar">
            <div className="cc-progress-fill" style={{ width: `${dashboardPrimeData.perc_com_cpf}%` }}></div>
          </div>
        </div>

        <div className="cc-card">
          <h3>🎂 Data Nascimento</h3>
          <div className="cc-stat-row">
            <span className="cc-stat-value">{dashboardPrimeData.com_data_nascimento?.toLocaleString()}</span>
            <span className="cc-stat-perc">{dashboardPrimeData.perc_com_data_nascimento}%</span>
          </div>
          <div className="cc-progress-bar">
            <div className="cc-progress-fill" style={{ width: `${dashboardPrimeData.perc_com_data_nascimento}%` }}></div>
          </div>
        </div>

        <div className="cc-card cc-card-complete">
          <h3>⭐ Qualidade Média</h3>
          <div className="cc-stat-value-large">{dashboardPrimeData.qualidade_media}/100</div>
        </div>

        <div className="cc-card">
          <h3>✅ Alta Qualidade (80-100)</h3>
          <div className="cc-stat-value">{dashboardPrimeData.qualidade_alta?.toLocaleString()}</div>
        </div>

        <div className="cc-card">
          <h3>🟡 Média Qualidade (60-79)</h3>
          <div className="cc-stat-value">{dashboardPrimeData.com_qualidade_media?.toLocaleString()}</div>
        </div>

        <div className="cc-card">
          <h3>🔴 Baixa Qualidade (&lt;60)</h3>
          <div className="cc-stat-value">{dashboardPrimeData.qualidade_baixa?.toLocaleString()}</div>
        </div>

        <div className="cc-card">
          <h3>🔗 Também no Sprint</h3>
          <div className="cc-stat-value">{dashboardPrimeData.tambem_no_sprint?.toLocaleString()}</div>
        </div>

        <div className="cc-card cc-card-warning">
          <h3>⚠️ Somente no Prime</h3>
          <div className="cc-stat-value">{dashboardPrimeData.somente_prime?.toLocaleString()}</div>
          <button className="cc-btn cc-btn-primary" onClick={() => setActiveTab('falta-sprint')}>
            Ver Lista
          </button>
        </div>
      </div>
    );
  };

  const renderCompletude = () => {
    if (!completudeData) return null;

    const fields = [
      { label: 'Nome', count: completudeData.com_nome, perc: completudeData.perc_com_nome },
      { label: 'Email', count: completudeData.com_email, perc: completudeData.perc_com_email },
      { label: 'WhatsApp', count: completudeData.com_whatsapp, perc: completudeData.perc_com_whatsapp },
      { label: 'Telefone', count: completudeData.com_telefone, perc: completudeData.perc_com_telefone },
      { label: 'CPF', count: completudeData.com_cpf, perc: completudeData.perc_com_cpf },
      { label: 'Data Nascimento', count: completudeData.com_data_nascimento, perc: completudeData.perc_com_data_nascimento },
      { label: 'Endereço Completo', count: completudeData.com_endereco, perc: completudeData.perc_com_endereco },
    ];

    return (
      <div className="cc-dashboard-grid">
        <div className="cc-card cc-card-highlight">
          <h2>📋 Completude dos Dados</h2>
          <div className="cc-stat-big">
            <span className="cc-stat-label">Total de Clientes</span>
            <span className="cc-stat-value">{completudeData.total_clientes.toLocaleString()}</span>
          </div>
        </div>

        {fields.map((field, idx) => (
          <div key={idx} className="cc-card">
            <h3>{field.label}</h3>
            <div className="cc-stat-row">
              <span className="cc-stat-value">{field.count.toLocaleString()}</span>
              <span className="cc-stat-perc">{field.perc}%</span>
            </div>
            <div className="cc-progress-bar">
              <div className="cc-progress-fill" style={{ width: `${field.perc}%` }}></div>
            </div>
          </div>
        ))}

        <div className="cc-card cc-card-complete">
          <h3>✅ Dados 100% Completos</h3>
          <div className="cc-stat-row">
            <span className="cc-stat-value">{completudeData.com_dados_completos.toLocaleString()}</span>
            <span className="cc-stat-perc">{completudeData.perc_dados_completos}%</span>
          </div>
          <div className="cc-progress-bar">
            <div className="cc-progress-fill cc-progress-success" style={{ width: `${completudeData.perc_dados_completos}%` }}></div>
          </div>
        </div>
      </div>
    );
  };

  const renderOrigens = () => {
    if (!origensData) return null;

    return (
      <div className="cc-dashboard-grid">
        <div className="cc-card cc-card-highlight">
          <h2>🔍 Análise de Origens</h2>
          <div className="cc-stat-big">
            <span className="cc-stat-label">Total de Clientes</span>
            <span className="cc-stat-value">{origensData.total_clientes.toLocaleString()}</span>
          </div>
        </div>

        <div className="cc-card">
          <h3>📱 SprintHub</h3>
          <div className="cc-stat-row">
            <span className="cc-stat-value">{origensData.no_sprinthub.toLocaleString()}</span>
            <span className="cc-stat-perc">{origensData.perc_no_sprinthub}%</span>
          </div>
        </div>

        <div className="cc-card">
          <h3>🏢 Prime</h3>
          <div className="cc-stat-row">
            <span className="cc-stat-value">{origensData.no_prime.toLocaleString()}</span>
            <span className="cc-stat-perc">{origensData.perc_no_prime}%</span>
          </div>
        </div>

        <div className="cc-card">
          <h3>🌐 GreatPage</h3>
          <div className="cc-stat-row">
            <span className="cc-stat-value">{origensData.no_greatpage.toLocaleString()}</span>
            <span className="cc-stat-perc">{origensData.perc_no_greatpage}%</span>
          </div>
        </div>

        <div className="cc-card">
          <h3>⚫ BlackLabs</h3>
          <div className="cc-stat-row">
            <span className="cc-stat-value">{origensData.no_blacklabs.toLocaleString()}</span>
            <span className="cc-stat-perc">{origensData.perc_no_blacklabs}%</span>
          </div>
        </div>

        <div className="cc-card cc-card-warning">
          <h3>⚠️ Falta no Prime (Estão no Sprint)</h3>
          <div className="cc-stat-value-large">{origensData.apenas_sprint.toLocaleString()}</div>
          <button className="cc-btn cc-btn-primary" onClick={() => setActiveTab('falta-prime')}>
            Ver Lista
          </button>
        </div>

        <div className="cc-card cc-card-warning">
          <h3>⚠️ Falta no Sprint (Estão no Prime)</h3>
          <div className="cc-stat-value-large">{origensData.apenas_prime.toLocaleString()}</div>
          <button className="cc-btn cc-btn-primary" onClick={() => setActiveTab('falta-sprint')}>
            Ver Lista
          </button>
        </div>

        <div className="cc-card">
          <h3>🔗 Em Ambos (Sprint E Prime)</h3>
          <div className="cc-stat-value-large">{origensData.em_ambos_sprint_prime.toLocaleString()}</div>
        </div>
      </div>
    );
  };

  const renderFaltaNoPrime = () => (
    <div className="cc-list-container">
      <div className="cc-list-header">
        <h2>📋 Clientes que Faltam no Prime (Estão no Sprint)</h2>
        <button
          className="cc-btn cc-btn-export"
          onClick={() => exportToCSV('falta_no_prime', 'clientes_apenas_sprint')}
          disabled={isLoading}
        >
          📥 Exportar CSV
        </button>
      </div>

      {renderClientesTable(faltaNoPrimeData, [
        { header: 'ID', field: 'id' },
        { header: 'Sprint ID', field: 'id_sprinthub' },
        { header: 'Nome', field: 'nome_completo' },
        { header: 'Email', field: 'email' },
        { header: 'WhatsApp', field: 'whatsapp' },
        { header: 'CPF', field: 'cpf' },
        {
          header: 'Qualidade',
          render: (row) => (
            <span className={`cc-quality-badge cc-quality-${row.qualidade_dados >= 80 ? 'high' : row.qualidade_dados >= 60 ? 'medium' : 'low'}`}>
              {row.qualidade_dados}/100
            </span>
          )
        }
      ])}

      {renderPagination()}
    </div>
  );

  const renderFaltaNoSprint = () => (
    <div className="cc-list-container">
      <div className="cc-list-header">
        <h2>📋 Clientes que Faltam no Sprint (Estão no Prime)</h2>
        <button
          className="cc-btn cc-btn-export"
          onClick={() => exportToCSV('falta_no_sprint', 'clientes_apenas_prime')}
          disabled={isLoading}
        >
          📥 Exportar CSV
        </button>
      </div>

      {renderClientesTable(faltaNoSprintData, [
        { header: 'ID', field: 'id' },
        { header: 'Prime ID', field: 'id_prime' },
        { header: 'Nome', field: 'nome_completo' },
        { header: 'Email', field: 'email' },
        { header: 'WhatsApp', field: 'whatsapp' },
        { header: 'CPF', field: 'cpf' },
        {
          header: 'Qualidade',
          render: (row) => (
            <span className={`cc-quality-badge cc-quality-${row.qualidade_dados >= 80 ? 'high' : row.qualidade_dados >= 60 ? 'medium' : 'low'}`}>
              {row.qualidade_dados}/100
            </span>
          )
        }
      ])}

      {renderPagination()}
    </div>
  );

  const renderDuplicados = () => (
    <div className="cc-list-container">
      <div className="cc-list-header" style={{ alignItems: 'center' }}>
        <h2>🔄 Duplicados</h2>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <label className="cc-badge" style={{ cursor: 'pointer' }}>
            <input type="radio" name="dupType" checked={dupType==='email'} onChange={()=>{setDupType('email'); setCurrentPage(1);}} /> Email
          </label>
          <label className="cc-badge" style={{ cursor: 'pointer' }}>
            <input type="radio" name="dupType" checked={dupType==='phone'} onChange={()=>{setDupType('phone'); setCurrentPage(1);}} /> Telefone
          </label>
          <label className="cc-badge" style={{ cursor: 'pointer' }}>
            <input type="radio" name="dupType" checked={dupType==='cpf'} onChange={()=>{setDupType('cpf'); setCurrentPage(1);}} /> CPF
          </label>
        <button
          className="cc-btn cc-btn-export"
            onClick={() => exportToCSV('duplicados_'+dupType, dupType==='email'?'vw_dups_por_email':dupType==='phone'?'vw_dups_por_phone':'vw_dups_por_cpf')}
          disabled={isLoading}
        >
          📥 Exportar CSV
        </button>
        </div>
      </div>

      {dupType==='email' && renderClientesTable(duplicadosData, [
        { header: 'Email', render: (r)=> r.email_normalizado || '-' },
        { header: 'Total', field: 'total' },
        { header: 'IDs', render: (r)=> (
          Array.isArray(r.ids) ? (
            <span className="cc-link" onClick={()=>openDupDetails(r.ids)} title="Abrir detalhes">
              {r.ids.slice(0,5).join(', ')}{r.ids.length>5?'…':''}
            </span>
          ) : '-'
        ) }
      ])}
      {dupType==='phone' && renderClientesTable(duplicadosData, [
        { header: 'Telefone', render: (r)=> r.phone_normalizado || '-' },
        { header: 'Total', field: 'total' },
        { header: 'IDs', render: (r)=> (
          Array.isArray(r.ids) ? (
            <span className="cc-link" onClick={()=>openDupDetails(r.ids)} title="Abrir detalhes">
              {r.ids.slice(0,5).join(', ')}{r.ids.length>5?'…':''}
            </span>
          ) : '-'
        ) }
      ])}
      {dupType==='cpf' && renderClientesTable(duplicadosData, [
        { header: 'CPF', render: (r)=> r.cpf || '-' },
        { header: 'Total', field: 'total' },
        { header: 'IDs', render: (r)=> (
          Array.isArray(r.ids) ? (
            <span className="cc-link" onClick={()=>openDupDetails(r.ids)} title="Abrir detalhes">
              {r.ids.slice(0,5).join(', ')}{r.ids.length>5?'…':''}
            </span>
          ) : '-'
        ) }
      ])}

      {renderPagination()}
      {dupModalOpen && (
        <div className="cc-modal-overlay" onClick={()=>{setDupModalOpen(false); setDupModalRows([]);}}>
          <div className="cc-modal" onClick={(e)=>e.stopPropagation()}>
            <h3>Conflito ({dupModalIds.length} registros)</h3>
            <div className="cc-modal-content" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
              {dupModalRows.map((row)=> (
                <div key={row.id} className="cc-dup-card">
                  <div><strong>ID:</strong> {row.id}</div>
                  <div><strong>Nome:</strong> {row.nome_completo || '-'}</div>
                  <div><strong>Email:</strong> {row.email || '-'}</div>
                  <div><strong>WhatsApp:</strong> {row.whatsapp || '-'}</div>
                  <div><strong>Telefone:</strong> {row.telefone || '-'}</div>
                  <div><strong>CPF:</strong> {row.cpf || '-'}</div>
                  <div><strong>Origem:</strong> Prime:{row.id_prime||'-'} | Sprint:{row.id_sprinthub||'-'} | GreatPage:{row.id_greatpage||'-'} | BlackLabs:{row.id_blacklabs||'-'}</div>
                </div>
              ))}
            </div>
            <div className="cc-modal-actions">
              <button className="cc-btn" onClick={()=>{setDupModalOpen(false); setDupModalRows([]);}}>Fechar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderQualidade = () => (
    <div className="cc-dashboard-grid">
      {qualidadeData.map((faixa, idx) => (
        <div key={idx} className={`cc-card ${faixa.faixa_qualidade.includes('Alta') ? 'cc-card-complete' : faixa.faixa_qualidade.includes('Baixa') ? 'cc-card-warning' : ''}`}>
          <h3>{faixa.faixa_qualidade}</h3>
          <div className="cc-stat-row">
            <span className="cc-stat-value">{faixa.total_clientes.toLocaleString()}</span>
            <span className="cc-stat-perc">{faixa.percentual}%</span>
          </div>
          <p style={{marginTop: '10px', fontSize: '14px'}}>Média: {faixa.qualidade_media_faixa}/100</p>
        </div>
      ))}
    </div>
  );

  const renderBaixaQualidade = () => (
    <div className="cc-list-container">
      <div className="cc-list-header">
        <h2>⚠️ Clientes com Baixa Qualidade (&lt; 60)</h2>
        <button
          className="cc-btn cc-btn-export"
          onClick={() => exportToCSV('baixa_qualidade', 'clientes_baixa_qualidade')}
          disabled={isLoading}
        >
          📥 Exportar CSV
        </button>
      </div>

      {renderClientesTable(baixaQualidadeData, [
        { header: 'Nome', field: 'nome_completo' },
        { header: 'Email', field: 'email' },
        { header: 'WhatsApp', field: 'whatsapp' },
        { header: 'CPF', field: 'cpf' },
        { header: 'Dados Faltantes', field: 'dados_faltantes' },
        {
          header: 'Qualidade',
          render: (row) => (
            <span className="cc-quality-badge cc-quality-low">
              {row.qualidade_dados}/100
            </span>
          )
        }
      ])}

      {renderPagination()}
    </div>
  );

  const renderAniversariantesMes = () => (
    <div className="cc-list-container">
      <div className="cc-list-header">
        <h2>🎂 Aniversariantes do Mês</h2>
        <button
          className="cc-btn cc-btn-export"
          onClick={() => exportToCSV('aniversariantes_mes', 'aniversariantes_mes')}
          disabled={isLoading}
        >
          📥 Exportar CSV
        </button>
      </div>

      {renderClientesTable(aniversariantesMesData, [
        { header: 'Dia', field: 'dia_aniversario' },
        { header: 'Nome', field: 'nome_completo' },
        { header: 'Email', field: 'email' },
        { header: 'WhatsApp', field: 'whatsapp' },
        {
          header: 'Data Nascimento',
          render: (row) => new Date(row.data_nascimento).toLocaleDateString('pt-BR')
        }
      ])}

      {renderPagination()}
    </div>
  );

  const renderAniversariantesProximos = () => (
    <div className="cc-list-container">
      <div className="cc-list-header">
        <h2>🎉 Aniversariantes dos Próximos 30 Dias</h2>
        <button
          className="cc-btn cc-btn-export"
          onClick={() => exportToCSV('aniversariantes_proximos', 'aniversariantes_proximos_30_dias')}
          disabled={isLoading}
        >
          📥 Exportar CSV
        </button>
      </div>

      {renderClientesTable(aniversariantesProximosData, [
        {
          header: 'Próximo Aniversário',
          render: (row) => new Date(row.proximo_aniversario).toLocaleDateString('pt-BR')
        },
        { header: 'Nome', field: 'nome_completo' },
        { header: 'Email', field: 'email' },
        { header: 'WhatsApp', field: 'whatsapp' },
        {
          header: 'Data Nascimento',
          render: (row) => new Date(row.data_nascimento).toLocaleDateString('pt-BR')
        }
      ])}

      {renderPagination()}
    </div>
  );

  const renderSemCpf = () => (
    <div className="cc-list-container">
      <div className="cc-list-header">
        <h2>🆔 Clientes Sem CPF</h2>
        <button
          className="cc-btn cc-btn-export"
          onClick={() => exportToCSV('sem_cpf', 'clientes_sem_cpf')}
          disabled={isLoading}
        >
          📥 Exportar CSV
        </button>
      </div>

      {renderClientesTable(semCpfData, [
        { header: 'Nome', field: 'nome_completo' },
        { header: 'Email', field: 'email' },
        { header: 'WhatsApp', field: 'whatsapp' },
        { header: 'Origens', render: (row) => row.origem_marcas?.join(', ') },
        {
          header: 'Qualidade',
          render: (row) => (
            <span className={`cc-quality-badge cc-quality-${row.qualidade_dados >= 80 ? 'high' : row.qualidade_dados >= 60 ? 'medium' : 'low'}`}>
              {row.qualidade_dados}/100
            </span>
          )
        }
      ])}

      {renderPagination()}
    </div>
  );

  const renderSemEmail = () => (
    <div className="cc-list-container">
      <div className="cc-list-header">
        <h2>📧 Clientes Sem Email (mas com WhatsApp)</h2>
        <button
          className="cc-btn cc-btn-export"
          onClick={() => exportToCSV('sem_email', 'clientes_sem_email')}
          disabled={isLoading}
        >
          📥 Exportar CSV
        </button>
      </div>

      {renderClientesTable(semEmailData, [
        { header: 'Nome', field: 'nome_completo' },
        { header: 'WhatsApp', field: 'whatsapp' },
        { header: 'CPF', field: 'cpf' },
        { header: 'Origens', render: (row) => row.origem_marcas?.join(', ') }
      ])}

      {renderPagination()}
    </div>
  );

  const renderSemContato = () => (
    <div className="cc-list-container">
      <div className="cc-list-header">
        <h2>📵 Clientes Sem Nenhum Contato</h2>
        <button
          className="cc-btn cc-btn-export"
          onClick={() => exportToCSV('sem_contato', 'clientes_sem_contato')}
          disabled={isLoading}
        >
          📥 Exportar CSV
        </button>
      </div>

      {renderClientesTable(semContatoData, [
        { header: 'Nome', field: 'nome_completo' },
        { header: 'CPF', field: 'cpf' },
        { header: 'Origens', render: (row) => row.origem_marcas?.join(', ') }
      ])}

      {renderPagination()}
    </div>
  );

  const renderDistribuicaoGeo = () => (
    <div className="cc-list-container">
      <div className="cc-list-header">
        <h2>🗺️ Distribuição Geográfica</h2>
        <button
          className="cc-btn cc-btn-export"
          onClick={() => exportToCSV('distribuicao_geo', 'distribuicao_geografica')}
          disabled={isLoading}
        >
          📥 Exportar CSV
        </button>
      </div>

      {renderClientesTable(distribuicaoGeoData, [
        { header: 'Estado', field: 'estado' },
        { header: 'Cidade', field: 'cidade' },
        { header: 'Total Clientes', render: (row) => row.total_clientes.toLocaleString() },
        { header: 'Percentual', render: (row) => `${row.percentual}%` },
        { header: 'Qualidade Média', render: (row) => `${row.qualidade_media}/100` }
      ])}

      {renderPagination()}
    </div>
  );

  const renderTopCidades = () => (
    <div className="cc-dashboard-grid">
      <div className="cc-card cc-card-highlight" style={{ gridColumn: 'span 2' }}>
        <h2>🏙️ Top 20 Cidades</h2>
      </div>

      {topCidadesData.map((cidade, idx) => (
        <div key={idx} className="cc-card">
          <h3>#{idx + 1} {cidade.cidade}, {cidade.estado}</h3>
          <div className="cc-stat-row">
            <span className="cc-stat-value">{cidade.total_clientes.toLocaleString()}</span>
            <span className="cc-stat-perc">{cidade.percentual}%</span>
          </div>
          <div className="cc-progress-bar">
            <div className="cc-progress-fill" style={{ width: `${cidade.percentual}%` }}></div>
          </div>
        </div>
      ))}
    </div>
  );

  const renderCompletosAlcancaveis = () => (
    <div className="cc-list-container">
      <div className="cc-list-header">
        <h2>✅ Clientes Completos e Alcançáveis (Email + WhatsApp + Telefone)</h2>
        <button
          className="cc-btn cc-btn-export"
          onClick={() => exportToCSV('completos_alcancaveis', 'clientes_completos_alcancaveis')}
          disabled={isLoading}
        >
          📥 Exportar CSV
        </button>
      </div>

      {renderClientesTable(completosAlcancaveisData, [
        { header: 'Nome', field: 'nome_completo' },
        { header: 'Email', field: 'email' },
        { header: 'WhatsApp', field: 'whatsapp' },
        { header: 'Telefone', field: 'telefone' },
        { header: 'CPF', field: 'cpf' },
        {
          header: 'Qualidade',
          render: (row) => (
            <span className="cc-quality-badge cc-quality-high">
              {row.qualidade_dados}/100
            </span>
          )
        }
      ])}

      {renderPagination()}
    </div>
  );

  const renderDadosEssenciais = () => (
    <div className="cc-list-container">
      <div className="cc-list-header">
        <h2>⚡ Clientes com Dados Essenciais (Nome + Contato + CPF)</h2>
        <button
          className="cc-btn cc-btn-export"
          onClick={() => exportToCSV('dados_essenciais', 'clientes_dados_essenciais')}
          disabled={isLoading}
        >
          📥 Exportar CSV
        </button>
      </div>

      {renderClientesTable(dadosEssenciaisData, [
        { header: 'Nome', field: 'nome_completo' },
        { header: 'Email', field: 'email' },
        { header: 'WhatsApp', field: 'whatsapp' },
        { header: 'CPF', field: 'cpf' },
        {
          header: 'Data Nascimento',
          render: (row) => row.data_nascimento ? new Date(row.data_nascimento).toLocaleDateString('pt-BR') : '-'
        },
        {
          header: 'Qualidade',
          render: (row) => (
            <span className={`cc-quality-badge cc-quality-${row.qualidade_dados >= 80 ? 'high' : 'medium'}`}>
              {row.qualidade_dados}/100
            </span>
          )
        }
      ])}

      {renderPagination()}
    </div>
  );

  const renderAtualizacoes7Dias = () => (
    <div className="cc-list-container">
      <div className="cc-list-header">
        <h2>📅 Atualizações dos Últimos 7 Dias</h2>
        <button
          className="cc-btn cc-btn-export"
          onClick={() => exportToCSV('atualizacoes_7dias', 'atualizacoes_recentes_7dias')}
          disabled={isLoading}
        >
          📥 Exportar CSV
        </button>
      </div>

      {renderClientesTable(atualizacoes7DiasData, [
        {
          header: 'Última Atualização',
          render: (row) => new Date(row.data_ultima_atualizacao).toLocaleString('pt-BR')
        },
        { header: 'Nome', field: 'nome_completo' },
        { header: 'Email', field: 'email' },
        { header: 'WhatsApp', field: 'whatsapp' },
        { header: 'Origens', render: (row) => row.origem_marcas?.join(', ') }
      ])}

      {renderPagination()}
    </div>
  );

  const renderAtualizacoes30Dias = () => (
    <div className="cc-list-container">
      <div className="cc-list-header">
        <h2>📆 Atualizações dos Últimos 30 Dias</h2>
        <button
          className="cc-btn cc-btn-export"
          onClick={() => exportToCSV('atualizacoes_30dias', 'atualizacoes_recentes_30dias')}
          disabled={isLoading}
        >
          📥 Exportar CSV
        </button>
      </div>

      {renderClientesTable(atualizacoes30DiasData, [
        {
          header: 'Última Atualização',
          render: (row) => new Date(row.data_ultima_atualizacao).toLocaleString('pt-BR')
        },
        { header: 'Nome', field: 'nome_completo' },
        { header: 'Email', field: 'email' },
        { header: 'WhatsApp', field: 'whatsapp' },
        { header: 'Origens', render: (row) => row.origem_marcas?.join(', ') }
      ])}

      {renderPagination()}
    </div>
  );

  const renderExecutivo = () => (
    <div className="cc-dashboard-grid">
      <div className="cc-card cc-card-highlight" style={{ gridColumn: 'span 2' }}>
        <h2>📈 Relatório Executivo</h2>
        <p style={{marginTop: '10px', fontSize: '14px', opacity: 0.9}}>
          Visão geral do sistema de consolidação
        </p>
      </div>

      <div className="cc-card" style={{ gridColumn: 'span 2' }}>
        <div className="cc-table-container">
          <table className="cc-table">
            <thead>
              <tr>
                <th>Métrica</th>
                <th>Valor</th>
                <th>Detalhe</th>
              </tr>
            </thead>
            <tbody>
              {executivoData.map((row, idx) => (
                <tr key={idx}>
                  <td>{row.metrica}</td>
                  <td className="value-cell">{row.valor}</td>
                  <td className="percent-cell">{row.percentual}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  // ===== RENDERIZAÇÕES - GESTÃO DE CLIENTES =====

  const renderDashboardGestao = () => {
    if (!dashboardGestaoData) return null;

    return (
      <div className="cc-dashboard-grid">
        <div className="cc-card cc-card-highlight">
          <h2>👥 Dashboard Gestão de Clientes</h2>
          <div className="cc-stat-big">
            <span className="cc-stat-label">Total de Clientes</span>
            <span className="cc-stat-value-large">{dashboardGestaoData.total_clientes?.toLocaleString()}</span>
          </div>
        </div>

        <div className="cc-card cc-card-warning">
          <h3>🚀 Nunca Compraram (Ativação)</h3>
          <div className="cc-stat-value-large">{dashboardGestaoData.total_inativos?.toLocaleString()}</div>
          <button className="cc-btn cc-btn-primary" onClick={() => setActiveTab('ativacao-geral')}>
            Ver Detalhes
          </button>
        </div>

        <div className="cc-card cc-card-warning">
          <h3>🔄 Para Reativação (90+ dias)</h3>
          <div className="cc-stat-value-large">{dashboardGestaoData.total_reativacao?.toLocaleString()}</div>
          <button className="cc-btn cc-btn-primary" onClick={() => setActiveTab('reativacao-geral')}>
            Ver Detalhes
          </button>
        </div>

        <div className="cc-card cc-card-complete">
          <h3>👀 Monitoramento (0-90 dias)</h3>
          <div className="cc-stat-value-large">{dashboardGestaoData.total_monitoramento?.toLocaleString()}</div>
          <button className="cc-btn cc-btn-primary" onClick={() => setActiveTab('monitoramento-geral')}>
            Ver Detalhes
          </button>
        </div>
      </div>
    );
  };

  const renderValidacaoIntegridade = () => (
    <div className="cc-list-container">
      <div className="cc-list-header">
        <h2>✅ Validação de Integridade</h2>
      </div>
      <div className="cc-table-wrapper">
        <table className="cc-table cc-table-list">
          <thead>
            <tr>
              <th>Validação</th>
              <th>Status</th>
              <th>Quantidade</th>
            </tr>
          </thead>
          <tbody>
            {validacaoIntegridadeData.map((row, idx) => (
              <tr key={idx}>
                <td>{row.validacao}</td>
                <td><span className={`cc-quality-badge ${row.status === 'OK' ? 'cc-quality-high' : 'cc-quality-low'}`}>{row.status}</span></td>
                <td>{row.quantidade?.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderAtivacaoGeral = () => {
    if (!ativacaoGeralData) return null;
    return (
      <>
      <div className="cc-dashboard-grid" style={{gridTemplateColumns:'repeat(5, minmax(0,1fr))'}}>
          <div className="cc-card" style={{background:'#3b82f6', color:'#fff'}}>
            <h3 style={{color:'#111'}}>🚀 Dashboard Ativação</h3>
            <div className="cc-stat-value-large">{ativacaoGeralData.total_inativos?.toLocaleString()}</div>
        </div>
        <div className="cc-card">
          <h3>🏢 No Prime</h3>
          <div className="cc-stat-value-large">{ativacaoGeralData.inativos_prime?.toLocaleString()}</div>
          <button className="cc-btn cc-btn-primary" onClick={() => setActiveTab('ativacao-prime')}>Ver Lista</button>
        </div>
        <div className="cc-card">
            <h3>📭 Sem Orçamento</h3>
            <div className="cc-stat-value-large">{ativacaoGeralData.sem_orcamento?.toLocaleString()}</div>
            <button className="cc-btn cc-btn-primary" onClick={() => setActiveTab('ativacao-sem-orcamento')}>Ver Lista</button>
        </div>
        <div className="cc-card">
          <h3>📋 Com Orçamento</h3>
          <div className="cc-stat-value-large">{ativacaoGeralData.com_orcamento?.toLocaleString()}</div>
          <button className="cc-btn cc-btn-primary" onClick={() => setActiveTab('ativacao-com-orcamento')}>Ver Lista</button>
        </div>
        <div className="cc-card">
            <h3>🚫 Fora do Prime</h3>
            <div className="cc-stat-value-large">{ativacaoGeralData.inativos_fora_prime?.toLocaleString()}</div>
            <button className="cc-btn cc-btn-primary" onClick={() => setActiveTab('ativacao-fora-prime')}>Ver Lista</button>
        </div>
      </div>
      <div style={{marginTop: '16px'}}>
        <h3>📊 Qualidade por Grupo</h3>
        {renderAtivacaoStats()}
      </div>
      <div style={{marginTop: '16px'}}>
        <h3>Clientes fora desta lista</h3>
        <div className="cc-dashboard-grid">
          <div className="cc-card">
            <h3>✅ Aprovados</h3>
            <div className="cc-stat-value-large">{ativacaoGeralData.total_aprovados?.toLocaleString()}</div>
          </div>
          <div className="cc-card">
            <h3>📦 Entregues</h3>
            <div className="cc-stat-value-large">{ativacaoGeralData.total_entregues?.toLocaleString()}</div>
          </div>
          <div className="cc-card">
            <h3>⏳ Pendentes</h3>
            <div className="cc-stat-value-large">{ativacaoGeralData.total_pendentes?.toLocaleString()}</div>
          </div>
        </div>
      </div>
      </>
    );
  };

  useEffect(() => {
    // carregar estatísticas de qualidade por grupo (dashboard de ativação)
    const loadAtivacaoStats = async () => {
      try {
        const { data } = await supabase.schema('api').from('vw_ativacao_stats').select('*');
        setAtivacaoStats(data || []);
      } catch (error) {
        console.error('Erro ao carregar stats de ativação:', error);
        setAtivacaoStats([]);
      }
    };
    loadAtivacaoStats();

    // carregar estatísticas de qualidade por grupo (dashboard de reativação)
    const loadReativacaoStats = async () => {
      try {
        const { data } = await supabase.schema('api').from('vw_reativacao_stats').select('*');
        setReativacaoStats(data || []);
      } catch (error) {
        console.error('Erro ao carregar stats de reativação:', error);
      }
    };
    loadReativacaoStats();

    // carregar estatísticas de qualidade por grupo (dashboard de monitoramento)
    const loadMonitoramentoStats = async () => {
      try {
        const { data } = await supabase.schema('api').from('vw_monitoramento_stats').select('*');
        setMonitoramentoStats(data || []);
      } catch (error) {
        console.error('Erro ao carregar stats de monitoramento:', error);
        setMonitoramentoStats([]);
      }
    };
    loadMonitoramentoStats();
  }, []);

  const renderAtivacaoStats = () => {
    if (!ativacaoStats?.length) return null;
    const label = {
      no_prime: 'No Prime',
      fora_prime: 'Fora do Prime',
      com_orcamento: 'Com Orçamento',
      sem_orcamento: 'Sem Orçamento'
    };
    const desiredOrder = ['no_prime','com_orcamento','sem_orcamento','fora_prime'];
    const ordered = [...ativacaoStats].sort((a,b)=> desiredOrder.indexOf(a.grupo) - desiredOrder.indexOf(b.grupo));
    return (
      <div className="cc-dashboard-grid">
        {ordered.map((g)=> (
          <div key={g.grupo} className="cc-card">
            <h3>📌 {label[g.grupo] || g.grupo}</h3>
            <div className="cc-stat-row"><span>Total</span><span className="cc-stat-value">{g.total?.toLocaleString?.()||g.total}</span></div>
            <div className="cc-stat-row"><span>Com E-mail</span><span>{g.com_email} ({Math.round(g.com_email*100/Math.max(g.total,1))}%)</span></div>
            <div className="cc-stat-row"><span>Com WhatsApp</span><span>{g.com_whatsapp} ({Math.round(g.com_whatsapp*100/Math.max(g.total,1))}%)</span></div>
            <div className="cc-stat-row"><span>Com CPF</span><span>{g.com_cpf} ({Math.round(g.com_cpf*100/Math.max(g.total,1))}%)</span></div>
            <div className="cc-stat-row"><span>Com Data Nasc.</span><span>{g.com_dn} ({Math.round(g.com_dn*100/Math.max(g.total,1))}%)</span></div>
            <div className="cc-stat-row"><span>Com Endereço</span><span>{g.com_endereco} ({Math.round(g.com_endereco*100/Math.max(g.total,1))}%)</span></div>
            <div className="cc-stat-row"><span>Dados 100%</span><span>{g.dados_100} ({Math.round(g.dados_100*100/Math.max(g.total,1))}%)</span></div>
            <div className="cc-stat-row"><span style={{color:'#dc2626'}}>Duplicados</span><span style={{color:'#dc2626'}}>{g.duplicados} ({(((g.duplicados||0)*100)/Math.max(g.total,1)).toFixed(1)}%)</span></div>
            <div className="cc-tags" style={{marginTop: 8, display:'flex', gap:8, flexWrap:'wrap'}}>
              <span className="cc-tag cc-tag-sprint">Sprint: {g.em_sprint} ({Math.round(g.em_sprint*100/Math.max(g.total,1))}%)</span>
              <span className="cc-tag cc-tag-greatpage">GreatPage: {g.em_greatpage} ({Math.round(g.em_greatpage*100/Math.max(g.total,1))}%)</span>
              <span className="cc-tag cc-tag-blacklabs">BlackLabs: {g.em_blacklabs} ({Math.round(g.em_blacklabs*100/Math.max(g.total,1))}%)</span>
            </div>
            <div style={{marginTop:8}}>
              <button className="cc-btn cc-btn-small" onClick={()=> setActiveTab('duplicados')}>Ver Duplicados</button>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderAtivacaoPrime = () => {
    // Se está carregando duplicatas e filtro está ativo, mostrar loading
    const showLoading = duplicatesFilter !== 'all' && isLoadingDuplicates && allDataForTab.length > 0;
    const verifiedCount = showLoading ? Object.keys(duplicatesData).length : 0;
    const totalCountForLoading = showLoading ? allDataForTab.length : 0;
    const progress = showLoading ? Math.round((verifiedCount / totalCountForLoading) * 100) : 0;
    
    return (
      <div className="cc-list-container">
        <div className="cc-list-header">
          <h2>🏢 Ativação - No Prime</h2>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <select className="cc-select cc-select-small" value={exportFormat} onChange={(e)=>setExportFormat(e.target.value)}>
              <option value="csv">CSV</option>
              <option value="excel">Excel (.xls)</option>
              <option value="xlsx">XLSX</option>
              <option value="json">JSON</option>
              <option value="pdf">PDF</option>
            </select>
            <button className="cc-btn cc-btn-export" onClick={() => exportSelectedCurrent('ativacao_prime')} disabled={isLoading || selectedRows.length===0}>📥 Exportar Selecionados</button>
            <button className="cc-btn cc-btn-export" onClick={() => exportAllFromTable('ativacao_prime', 'vw_inativos_prime')} disabled={isLoading}>Exportar Tudo (CSV)</button>
          </div>
        </div>
        {renderFiltersBar()}
        {showLoading ? (
          <div style={{ padding: '40px', textAlign: 'center' }}>
            <div style={{ fontSize: '18px', marginBottom: '10px' }}>🔍 Verificando duplicatas...</div>
            <div style={{ fontSize: '14px', opacity: 0.7 }}>{verifiedCount} de {totalCountForLoading} registros verificados ({progress}%)</div>
            <div style={{ marginTop: '20px', width: '300px', height: '8px', backgroundColor: '#e5e7eb', borderRadius: '4px', margin: '20px auto' }}>
              <div style={{ width: `${progress}%`, height: '100%', backgroundColor: '#3b82f6', borderRadius: '4px', transition: 'width 0.3s' }}></div>
            </div>
          </div>
        ) : (
          <>
            {renderClientesTable(getFilteredAndPaginatedData(ativacaoPrimeData), [
              { header: 'Exportado', render: (row) => renderExportStatusIcon(row) },
              { header: 'Duplicatas', render: (row) => renderDuplicatesIcon(row) },
              { header: 'Nome', sortField: 'nome_completo', render: (row) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {renderNomePorOrigem(row)}
                  {row.nome_completo && /[0-9]{10,}/.test(row.nome_completo) && (
                    <button
                      className="cc-btn-corrigir"
                      onClick={() => corrigirTelefoneNoNome(row.id || row.id_cliente_mestre, row.nome_completo)}
                      title="Corrigir telefone no nome"
                    >
                      🔧
                    </button>
                  )}
                </div>
              ) },
              { header: 'Email', field: 'email' },
              { header: 'WhatsApp', field: 'whatsapp' },
              { header: 'CPF', field: 'cpf' },
              { 
                header: 'Total Orçamento', 
                field: 'total_orcamentos',
                render: (row) => {
                  const totalOrcamentos = row.total_orcamentos || 0;
                  const idPrime = row.id_prime || row.prime_id || row.idprime;
                  const nomeCliente = row.nome_completo || row.nome_cliente_prime || 'Cliente';
                  
                  // Ativação: mostrar total de orçamentos
                  if (!idPrime || totalOrcamentos === 0) {
                    return <span>-</span>;
                  }
                  
                  return (
                    <span 
                      className="cc-total-compras-clickable"
                      onClick={(e) => {
                        e.stopPropagation();
                        const url = `/historico-compras?cliente_id=${idPrime}&nome=${encodeURIComponent(nomeCliente)}&ativacao=true`;
                        window.open(url, '_blank');
                      }}
                      title="Clique para ver histórico de orçamentos"
                    >
                      {totalOrcamentos}
                    </span>
                  );
                }
              },
              { 
                header: 'Dias Último Orçamento', 
                field: 'dias_desde_ultimo_orcamento',
                render: (row) => {
                  const totalOrcamentos = row.total_orcamentos || 0;
                  const diasUltimoOrcamento = row.dias_desde_ultimo_orcamento || row.dias_desde_ultima_compra;
                  
                  // Ativação: mostrar dias desde último orçamento
                  if (totalOrcamentos === 0 || !diasUltimoOrcamento) {
                    return <span>-</span>;
                  }
                  
                  return <span>{diasUltimoOrcamento}</span>;
                }
              },
              { header: 'Origens', render: (row) => renderOriginsBadges(row) },
              { header: 'Cidade/Estado', sortField: 'cidade', render: (row) => `${row.cidade || '-'}/${row.estado || '-'}` },
              { header: 'Sexo', render: (row) => formatSexo(row.sexo) },
              { header: 'Data Nascimento', field: 'data_nascimento', render: (row) => row.data_nascimento ? new Date(row.data_nascimento).toLocaleDateString('pt-BR') : '-' },
              { header: 'Qualidade', sortField: 'qualidade_dados', render: renderQualityBadge }
            ])}
            {renderPagination()}
          </>
        )}
      </div>
    );
  };

  const renderAtivacaoForaPrime = () => (
    <div className="cc-list-container">
      <div className="cc-list-header">
        <h2>🚫 Ativação - Fora do Prime</h2>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <select className="cc-select cc-select-small" value={exportFormat} onChange={(e)=>setExportFormat(e.target.value)}>
            <option value="csv">CSV</option>
            <option value="excel">Excel (.xls)</option>
            <option value="xlsx">XLSX</option>
            <option value="json">JSON</option>
            <option value="pdf">PDF</option>
          </select>
          <button className="cc-btn cc-btn-export" onClick={() => exportSelectedCurrent('ativacao_fora_prime')} disabled={isLoading || selectedRows.length===0}>📥 Exportar Selecionados</button>
          <button className="cc-btn cc-btn-export" onClick={() => exportAllFromTable('ativacao_fora_prime', 'vw_inativos_fora_prime')} disabled={isLoading}>Exportar Tudo (CSV)</button>
        </div>
      </div>
      {renderFiltersBar()}
      {renderClientesTable(filterRowsByDuplicates(filterRowsByNameStatus(ativacaoForaPrimeData)), [
        { header: 'Exportado', render: (row) => renderExportStatusIcon(row) },
        { header: 'Duplicatas', render: (row) => renderDuplicatesIcon(row) },
        { header: 'Nome', sortField: 'nome_completo', render: (row) => (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {renderNomePorOrigem(row)}
            {row.nome_completo && /[0-9]{10,}/.test(row.nome_completo) && (
              <button
                className="cc-btn-corrigir"
                onClick={() => corrigirTelefoneNoNome(row.id || row.id_cliente_mestre, row.nome_completo)}
                title="Corrigir telefone no nome"
              >
                🔧
              </button>
            )}
          </div>
        ) },
        { header: 'Email', field: 'email' },
        { header: 'WhatsApp', field: 'whatsapp' },
        { header: 'CPF', field: 'cpf' },
        { header: 'Origens', render: (row) => renderOriginsBadges(row) },
        { header: 'Cidade/Estado', sortField: 'cidade', render: (row) => `${row.cidade || '-'}/${row.estado || '-'}` },
        { header: 'Sexo', render: (row) => formatSexo(row.sexo) },
        { header: 'Data Nascimento', field: 'data_nascimento', render: (row) => row.data_nascimento ? new Date(row.data_nascimento).toLocaleDateString('pt-BR') : '-' },
        { header: 'Qualidade', sortField: 'qualidade_dados', render: renderQualityBadge }
            ])}
      {renderPagination()}
    </div>
  );

  const renderAtivacaoComOrcamento = () => (
    <div className="cc-list-container">
      <div className="cc-list-header">
        <h2>📋 Ativação - Com Orçamento</h2>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <select className="cc-select cc-select-small" value={exportFormat} onChange={(e)=>setExportFormat(e.target.value)}>
            <option value="csv">CSV</option>
            <option value="excel">Excel (.xls)</option>
            <option value="xlsx">XLSX</option>
            <option value="json">JSON</option>
            <option value="pdf">PDF</option>
          </select>
          <button className="cc-btn cc-btn-export" onClick={() => exportSelectedCurrent('ativacao_com_orcamento')} disabled={isLoading || selectedRows.length===0}>📥 Exportar Selecionados</button>
          <button className="cc-btn cc-btn-export" onClick={() => exportAllFromTable('ativacao_com_orcamento', 'vw_inativos_com_orcamento')} disabled={isLoading}>Exportar Tudo (CSV)</button>
        </div>
      </div>
      {renderFiltersBar()}
      {renderClientesTable(filterRowsByDuplicates(filterRowsByNameStatus(ativacaoComOrcamentoData)), [
        { header: 'Exportado', render: (row) => renderExportStatusIcon(row) },
        { header: 'Duplicatas', render: (row) => renderDuplicatesIcon(row) },
        { header: 'Nome', sortField: 'nome_completo', render: (row) => (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {renderNomePorOrigem(row)}
            {row.nome_completo && /[0-9]{10,}/.test(row.nome_completo) && (
              <button
                className="cc-btn-corrigir"
                onClick={() => corrigirTelefoneNoNome(row.id || row.id_cliente_mestre, row.nome_completo)}
                title="Corrigir telefone no nome"
              >
                🔧
              </button>
            )}
          </div>
        ) },
        { header: 'Email', field: 'email' },
        { header: 'WhatsApp', field: 'whatsapp' },
        { header: 'CPF', field: 'cpf' },
        { 
          header: 'Total Orçamento', 
          field: 'total_orcamentos',
          render: (row) => {
            const totalOrcamentos = row.total_orcamentos || 0;
            const idPrime = row.id_prime || row.prime_id || row.idprime;
            const nomeCliente = row.nome_completo || row.nome_cliente_prime || 'Cliente';
            
            // Ativação: mostrar total de orçamentos
            if (!idPrime || totalOrcamentos === 0) {
              return <span>-</span>;
            }
            
            return (
              <span 
                className="cc-total-compras-clickable"
                onClick={(e) => {
                  e.stopPropagation();
                  const url = `/historico-compras?cliente_id=${idPrime}&nome=${encodeURIComponent(nomeCliente)}&ativacao=true`;
                  window.open(url, '_blank');
                }}
                title="Clique para ver histórico de orçamentos"
              >
                {totalOrcamentos}
              </span>
            );
          }
        },
        { 
          header: 'Dias Último Orçamento', 
          field: 'dias_desde_ultimo_orcamento',
          render: (row) => {
            const totalOrcamentos = row.total_orcamentos || 0;
            const diasUltimoOrcamento = row.dias_desde_ultimo_orcamento || row.dias_desde_ultima_compra;
            
            // Ativação: mostrar dias desde último orçamento
            if (totalOrcamentos === 0 || !diasUltimoOrcamento) {
              return <span>-</span>;
            }
            
            return <span>{diasUltimoOrcamento}</span>;
          }
        },
        { header: 'Origens', render: (row) => renderOriginsBadges(row) },
        { header: 'Cidade/Estado', sortField: 'cidade', render: (row) => `${row.cidade || '-'}/${row.estado || '-'}` },
        { header: 'Sexo', render: (row) => formatSexo(row.sexo) },
        { header: 'Data Nascimento', field: 'data_nascimento', render: (row) => row.data_nascimento ? new Date(row.data_nascimento).toLocaleDateString('pt-BR') : '-' },
        { header: 'Qualidade', sortField: 'qualidade_dados', render: renderQualityBadge }
            ])}
      {renderPagination()}
    </div>
  );

  const renderAtivacaoSemOrcamento = () => (
    <div className="cc-list-container">
      <div className="cc-list-header">
        <h2>📭 Ativação - Sem Orçamento</h2>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <select className="cc-select cc-select-small" value={exportFormat} onChange={(e)=>setExportFormat(e.target.value)}>
            <option value="csv">CSV</option>
            <option value="excel">Excel (.xls)</option>
            <option value="xlsx">XLSX</option>
            <option value="json">JSON</option>
            <option value="pdf">PDF</option>
          </select>
          <button className="cc-btn cc-btn-export" onClick={() => exportSelectedCurrent('ativacao_sem_orcamento')} disabled={isLoading || selectedRows.length===0}>📥 Exportar Selecionados</button>
          <button className="cc-btn cc-btn-export" onClick={() => exportAllFromTable('ativacao_sem_orcamento', 'vw_inativos_sem_orcamento')} disabled={isLoading}>Exportar Tudo (CSV)</button>
        </div>
      </div>
      {renderFiltersBar()}
      {renderClientesTable(filterRowsByDuplicates(filterRowsByNameStatus(ativacaoSemOrcamentoData)), [
        { header: 'Exportado', render: (row) => renderExportStatusIcon(row) },
        { header: 'Duplicatas', render: (row) => renderDuplicatesIcon(row) },
        { header: 'Nome', sortField: 'nome_completo', render: (row) => (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {renderNomePorOrigem(row)}
            {row.nome_completo && /[0-9]{10,}/.test(row.nome_completo) && (
              <button
                className="cc-btn-corrigir"
                onClick={() => corrigirTelefoneNoNome(row.id || row.id_cliente_mestre, row.nome_completo)}
                title="Corrigir telefone no nome"
              >
                🔧
              </button>
            )}
          </div>
        ) },
        { header: 'Email', field: 'email' },
        { header: 'WhatsApp', field: 'whatsapp' },
        { header: 'CPF', field: 'cpf' },
        { header: 'Origens', render: (row) => renderOriginsBadges(row) },
        { header: 'Cidade/Estado', sortField: 'cidade', render: (row) => `${row.cidade || '-'}/${row.estado || '-'}` },
        { header: 'Sexo', render: (row) => formatSexo(row.sexo) },
        { header: 'Data Nascimento', field: 'data_nascimento', render: (row) => row.data_nascimento ? new Date(row.data_nascimento).toLocaleDateString('pt-BR') : '-' },
        { header: 'Qualidade', sortField: 'qualidade_dados', render: renderQualityBadge }
            ])}
      {renderPagination()}
    </div>
  );

  const renderReativacaoGeral = () => {
    if (!reativacaoGeralData) return null;
    return (
      <>
      <div className="cc-dashboard-grid" style={{gridTemplateColumns:'repeat(5, minmax(0,1fr))'}}>
          <div className="cc-card" style={{background:'#3b82f6', color:'#fff'}}>
            <h3 style={{color:'#111'}}>🔄 Dashboard Reativação</h3>
            <div className="cc-stat-value-large">{reativacaoGeralData.total_para_reativacao?.toLocaleString()}</div>
      </div>
          <div className="cc-card">
            <h3>1️⃣ Compraram 1x</h3>
            <div className="cc-stat-value-large">{reativacaoGeralData.total_reativacao_1x?.toLocaleString()}</div>
            <button className="cc-btn cc-btn-primary" onClick={() => setActiveTab('reativacao-1x')}>Ver Lista</button>
    </div>
          <div className="cc-card">
            <h3>2️⃣ Compraram 2x</h3>
            <div className="cc-stat-value-large">{reativacaoGeralData.total_reativacao_2x?.toLocaleString()}</div>
            <button className="cc-btn cc-btn-primary" onClick={() => setActiveTab('reativacao-2x')}>Ver Lista</button>
          </div>
          <div className="cc-card">
            <h3>3️⃣ Compraram 3x</h3>
            <div className="cc-stat-value-large">{reativacaoGeralData.total_reativacao_3x?.toLocaleString()}</div>
            <button className="cc-btn cc-btn-primary" onClick={() => setActiveTab('reativacao-3x')}>Ver Lista</button>
          </div>
          <div className="cc-card">
            <h3>🔥 Compraram 3+ vezes</h3>
            <div className="cc-stat-value-large">{reativacaoGeralData.total_reativacao_3x_plus?.toLocaleString()}</div>
            <button className="cc-btn cc-btn-primary" onClick={() => setActiveTab('reativacao-3x-plus')}>Ver Lista</button>
          </div>
      </div>
      <div style={{marginTop: '16px'}}>
        <h3>📊 Qualidade por Grupo</h3>
        {renderReativacaoStats()}
      </div>
      </>
    );
  };

  const renderReativacaoStats = () => {
    if (!reativacaoStats?.length) return null;
    const label = {
      reativacao_1x: 'Compraram 1x',
      reativacao_2x: 'Compraram 2x',
      reativacao_3x: 'Compraram 3x',
      reativacao_3x_plus: 'Compraram 3+ vezes'
    };
    const desiredOrder = ['reativacao_1x','reativacao_2x','reativacao_3x','reativacao_3x_plus'];
    const ordered = [...reativacaoStats].sort((a,b)=> desiredOrder.indexOf(a.grupo) - desiredOrder.indexOf(b.grupo));
    return (
      <div className="cc-dashboard-grid">
        {ordered.map((g)=> (
          <div key={g.grupo} className="cc-card">
            <h3>📌 {label[g.grupo] || g.grupo}</h3>
            <div className="cc-stat-row"><span>Total</span><span className="cc-stat-value">{g.total?.toLocaleString?.()||g.total}</span></div>
            <div className="cc-stat-row"><span>Com E-mail</span><span>{g.com_email} ({Math.round(g.com_email*100/Math.max(g.total,1))}%)</span></div>
            <div className="cc-stat-row"><span>Com WhatsApp</span><span>{g.com_whatsapp} ({Math.round(g.com_whatsapp*100/Math.max(g.total,1))}%)</span></div>
            <div className="cc-stat-row"><span>Com CPF</span><span>{g.com_cpf} ({Math.round(g.com_cpf*100/Math.max(g.total,1))}%)</span></div>
            <div className="cc-stat-row"><span>Com Data Nasc.</span><span>{g.com_dn} ({Math.round(g.com_dn*100/Math.max(g.total,1))}%)</span></div>
            <div className="cc-stat-row"><span>Com Endereço</span><span>{g.com_endereco} ({Math.round(g.com_endereco*100/Math.max(g.total,1))}%)</span></div>
            <div className="cc-stat-row"><span>Dados 100%</span><span>{g.dados_100} ({Math.round(g.dados_100*100/Math.max(g.total,1))}%)</span></div>
            <div className="cc-stat-row"><span style={{color:'#dc2626'}}>Duplicados</span><span style={{color:'#dc2626'}}>{g.duplicados || 0} ({(((g.duplicados||0)*100)/Math.max(g.total,1)).toFixed(1)}%)</span></div>
            <div className="cc-tags" style={{marginTop: 8, display:'flex', gap:8, flexWrap:'wrap'}}>
              <span className="cc-tag cc-tag-sprint">Sprint: {g.em_sprint || 0} ({Math.round((g.em_sprint||0)*100/Math.max(g.total,1))}%)</span>
              <span className="cc-tag cc-tag-greatpage">GreatPage: {g.em_greatpage || 0} ({Math.round((g.em_greatpage||0)*100/Math.max(g.total,1))}%)</span>
              <span className="cc-tag cc-tag-blacklabs">BlackLabs: {g.em_blacklabs || 0} ({Math.round((g.em_blacklabs||0)*100/Math.max(g.total,1))}%)</span>
            </div>
            <div style={{marginTop:8}}>
              <button className="cc-btn cc-btn-small" onClick={()=> setActiveTab('duplicados')}>Ver Duplicados</button>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderReativacao1x = () => (
    <div className="cc-list-container">
      <div className="cc-list-header">
        <h2>1️⃣ Reativação - Compraram 1x</h2>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <select className="cc-select cc-select-small" value={exportFormat} onChange={(e)=>setExportFormat(e.target.value)}>
            <option value="csv">CSV</option>
            <option value="excel">Excel (.xls)</option>
            <option value="xlsx">XLSX</option>
            <option value="json">JSON</option>
            <option value="pdf">PDF</option>
          </select>
          <button className="cc-btn cc-btn-export" onClick={() => exportSelectedCurrent('reativacao_1x')} disabled={isLoading || selectedRows.length===0}>📥 Exportar Selecionados</button>
          <button className="cc-btn cc-btn-export" onClick={() => exportAllFromTable('reativacao_1x', 'vw_reativacao_1x')} disabled={isLoading}>Exportar Tudo (CSV)</button>
      </div>
      </div>
      {renderFiltersBar()}
      {renderClientesTable(filterRowsByDuplicates(filterRowsByNameStatus(reativacao1xData)), [
        { header: 'Exportado', render: (row) => renderExportStatusIcon(row) },
        { header: 'Duplicatas', render: (row) => renderDuplicatesIcon(row) },
        { header: 'Nome', sortField: 'nome_completo', render: (row) => (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {renderNomePorOrigem(row)}
            {row.nome_completo && /[0-9]{10,}/.test(row.nome_completo) && (
              <button
                className="cc-btn-corrigir"
                onClick={() => corrigirTelefoneNoNome(row.id || row.id_cliente_mestre, row.nome_completo)}
                title="Corrigir telefone no nome"
              >
                🔧
              </button>
            )}
          </div>
        ) },
        { header: 'Email', field: 'email' },
        { header: 'WhatsApp', field: 'whatsapp' },
        { header: 'CPF', field: 'cpf' },
        { 
          header: 'Total Compras', 
          field: 'total_compras',
          render: (row) => {
            const totalCompras = row.total_compras || 0;
            const idPrime = row.id_prime || row.id_cliente || row.id_cliente_mestre;
            const nomeCliente = row.nome_completo || 'Cliente';
            
            if (!idPrime || totalCompras === 0) {
              return <span>{totalCompras}</span>;
            }
            
            return (
              <span 
                className="cc-total-compras-clickable"
                onClick={(e) => {
                  e.stopPropagation();
                  const url = `/historico-compras?cliente_id=${idPrime}&nome=${encodeURIComponent(nomeCliente)}`;
                  window.open(url, '_blank');
                }}
                title="Clique para ver histórico completo de compras"
              >
                {totalCompras}
              </span>
            );
          }
        },
        { header: 'Dias Última Compra', field: 'dias_desde_ultima_compra' },
        { header: 'Origens', render: (row) => renderOriginsBadges(row) },
        { header: 'Cidade/Estado', sortField: 'cidade', render: (row) => `${row.cidade || '-'}/${row.estado || '-'}` },
        { header: 'Sexo', render: (row) => formatSexo(row.sexo) },
        { header: 'Data Nascimento', field: 'data_nascimento', render: (row) => row.data_nascimento ? new Date(row.data_nascimento).toLocaleDateString('pt-BR') : '-' },
        { header: 'Qualidade', sortField: 'qualidade_dados', render: renderQualityBadge }
            ])}
      {renderPagination()}
    </div>
  );

  const renderReativacao2x = () => (
    <div className="cc-list-container">
      <div className="cc-list-header">
        <h2>2️⃣ Reativação - Compraram 2x</h2>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <select className="cc-select cc-select-small" value={exportFormat} onChange={(e)=>setExportFormat(e.target.value)}>
            <option value="csv">CSV</option>
            <option value="excel">Excel (.xls)</option>
            <option value="xlsx">XLSX</option>
            <option value="json">JSON</option>
            <option value="pdf">PDF</option>
          </select>
          <button className="cc-btn cc-btn-export" onClick={() => exportSelectedCurrent('reativacao_2x')} disabled={isLoading || selectedRows.length===0}>📥 Exportar Selecionados</button>
          <button className="cc-btn cc-btn-export" onClick={() => exportAllFromTable('reativacao_2x', 'vw_reativacao_2x')} disabled={isLoading}>Exportar Tudo (CSV)</button>
      </div>
      </div>
      {renderFiltersBar()}
      {renderClientesTable(filterRowsByDuplicates(filterRowsByNameStatus(reativacao2xData)), [
        { header: 'Exportado', render: (row) => renderExportStatusIcon(row) },
        { header: 'Duplicatas', render: (row) => renderDuplicatesIcon(row) },
        { header: 'Nome', sortField: 'nome_completo', render: (row) => (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {renderNomePorOrigem(row)}
            {row.nome_completo && /[0-9]{10,}/.test(row.nome_completo) && (
              <button
                className="cc-btn-corrigir"
                onClick={() => corrigirTelefoneNoNome(row.id || row.id_cliente_mestre, row.nome_completo)}
                title="Corrigir telefone no nome"
              >
                🔧
              </button>
            )}
          </div>
        ) },
        { header: 'Email', field: 'email' },
        { header: 'WhatsApp', field: 'whatsapp' },
        { header: 'CPF', field: 'cpf' },
        { 
          header: 'Total Compras', 
          field: 'total_compras',
          render: (row) => {
            const totalCompras = row.total_compras || 0;
            const idPrime = row.id_prime || row.id_cliente || row.id_cliente_mestre;
            const nomeCliente = row.nome_completo || 'Cliente';
            
            if (!idPrime || totalCompras === 0) {
              return <span>{totalCompras}</span>;
            }
            
            return (
              <span 
                className="cc-total-compras-clickable"
                onClick={(e) => {
                  e.stopPropagation();
                  const url = `/historico-compras?cliente_id=${idPrime}&nome=${encodeURIComponent(nomeCliente)}`;
                  window.open(url, '_blank');
                }}
                title="Clique para ver histórico completo de compras"
              >
                {totalCompras}
              </span>
            );
          }
        },
        { header: 'Dias Última Compra', field: 'dias_desde_ultima_compra' },
        { header: 'Origens', render: (row) => renderOriginsBadges(row) },
        { header: 'Cidade/Estado', sortField: 'cidade', render: (row) => `${row.cidade || '-'}/${row.estado || '-'}` },
        { header: 'Sexo', render: (row) => formatSexo(row.sexo) },
        { header: 'Data Nascimento', field: 'data_nascimento', render: (row) => row.data_nascimento ? new Date(row.data_nascimento).toLocaleDateString('pt-BR') : '-' },
        { header: 'Qualidade', sortField: 'qualidade_dados', render: renderQualityBadge }
            ])}
      {renderPagination()}
    </div>
  );

  const renderReativacao3x = () => (
    <div className="cc-list-container">
      <div className="cc-list-header">
        <h2>3️⃣ Reativação - Compraram 3x</h2>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <select className="cc-select cc-select-small" value={exportFormat} onChange={(e)=>setExportFormat(e.target.value)}>
            <option value="csv">CSV</option>
            <option value="excel">Excel (.xls)</option>
            <option value="xlsx">XLSX</option>
            <option value="json">JSON</option>
            <option value="pdf">PDF</option>
          </select>
          <button className="cc-btn cc-btn-export" onClick={() => exportSelectedCurrent('reativacao_3x')} disabled={isLoading || selectedRows.length===0}>📥 Exportar Selecionados</button>
          <button className="cc-btn cc-btn-export" onClick={() => exportAllFromTable('reativacao_3x', 'vw_reativacao_3x')} disabled={isLoading}>Exportar Tudo (CSV)</button>
      </div>
      </div>
      {renderFiltersBar()}
      {renderClientesTable(filterRowsByDuplicates(filterRowsByNameStatus(reativacao3xData)), [
        { header: 'Exportado', render: (row) => renderExportStatusIcon(row) },
        { header: 'Duplicatas', render: (row) => renderDuplicatesIcon(row) },
        { header: 'Nome', sortField: 'nome_completo', render: (row) => (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {renderNomePorOrigem(row)}
            {row.nome_completo && /[0-9]{10,}/.test(row.nome_completo) && (
              <button
                className="cc-btn-corrigir"
                onClick={() => corrigirTelefoneNoNome(row.id || row.id_cliente_mestre, row.nome_completo)}
                title="Corrigir telefone no nome"
              >
                🔧
              </button>
            )}
          </div>
        ) },
        { header: 'Email', field: 'email' },
        { header: 'WhatsApp', field: 'whatsapp' },
        { header: 'CPF', field: 'cpf' },
        { 
          header: 'Total Compras', 
          field: 'total_compras',
          render: (row) => {
            const totalCompras = row.total_compras || 0;
            const idPrime = row.id_prime || row.id_cliente || row.id_cliente_mestre;
            const nomeCliente = row.nome_completo || 'Cliente';
            
            if (!idPrime || totalCompras === 0) {
              return <span>{totalCompras}</span>;
            }
            
            return (
              <span 
                className="cc-total-compras-clickable"
                onClick={(e) => {
                  e.stopPropagation();
                  const url = `/historico-compras?cliente_id=${idPrime}&nome=${encodeURIComponent(nomeCliente)}`;
                  window.open(url, '_blank');
                }}
                title="Clique para ver histórico completo de compras"
              >
                {totalCompras}
              </span>
            );
          }
        },
        { header: 'Dias Última Compra', field: 'dias_desde_ultima_compra' },
        { header: 'Origens', render: (row) => renderOriginsBadges(row) },
        { header: 'Cidade/Estado', sortField: 'cidade', render: (row) => `${row.cidade || '-'}/${row.estado || '-'}` },
        { header: 'Sexo', render: (row) => formatSexo(row.sexo) },
        { header: 'Data Nascimento', field: 'data_nascimento', render: (row) => row.data_nascimento ? new Date(row.data_nascimento).toLocaleDateString('pt-BR') : '-' },
        { header: 'Qualidade', sortField: 'qualidade_dados', render: renderQualityBadge }
            ])}
      {renderPagination()}
    </div>
  );

  const renderReativacao3xPlus = () => (
    <div className="cc-list-container">
      <div className="cc-list-header">
        <h2>🔥 Reativação - Compraram 3+ vezes</h2>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <select className="cc-select cc-select-small" value={exportFormat} onChange={(e)=>setExportFormat(e.target.value)}>
            <option value="csv">CSV</option>
            <option value="excel">Excel (.xls)</option>
            <option value="xlsx">XLSX</option>
            <option value="json">JSON</option>
            <option value="pdf">PDF</option>
          </select>
          <button className="cc-btn cc-btn-export" onClick={() => exportSelectedCurrent('reativacao_3x_plus')} disabled={isLoading || selectedRows.length===0}>📥 Exportar Selecionados</button>
          <button className="cc-btn cc-btn-export" onClick={() => exportAllFromTable('reativacao_3x_plus', 'vw_reativacao_3x_plus')} disabled={isLoading}>Exportar Tudo (CSV)</button>
      </div>
      </div>
      {renderFiltersBar()}
      {renderClientesTable(filterRowsByDuplicates(filterRowsByNameStatus(reativacao3xPlusData)), [
        { header: 'Exportado', render: (row) => renderExportStatusIcon(row) },
        { header: 'Duplicatas', render: (row) => renderDuplicatesIcon(row) },
        { header: 'Nome', sortField: 'nome_completo', render: (row) => (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {renderNomePorOrigem(row)}
            {row.nome_completo && /[0-9]{10,}/.test(row.nome_completo) && (
              <button
                className="cc-btn-corrigir"
                onClick={() => corrigirTelefoneNoNome(row.id || row.id_cliente_mestre, row.nome_completo)}
                title="Corrigir telefone no nome"
              >
                🔧
              </button>
            )}
          </div>
        ) },
        { header: 'Email', field: 'email' },
        { header: 'WhatsApp', field: 'whatsapp' },
        { header: 'CPF', field: 'cpf' },
        { 
          header: 'Total Compras', 
          field: 'total_compras',
          render: (row) => {
            const totalCompras = row.total_compras || 0;
            const idPrime = row.id_prime || row.id_cliente || row.id_cliente_mestre;
            const nomeCliente = row.nome_completo || 'Cliente';
            
            if (!idPrime || totalCompras === 0) {
              return <span>{totalCompras}</span>;
            }
            
            return (
              <span 
                className="cc-total-compras-clickable"
                onClick={(e) => {
                  e.stopPropagation();
                  const url = `/historico-compras?cliente_id=${idPrime}&nome=${encodeURIComponent(nomeCliente)}`;
                  window.open(url, '_blank');
                }}
                title="Clique para ver histórico completo de compras"
              >
                {totalCompras}
              </span>
            );
          }
        },
        { header: 'Dias Última Compra', field: 'dias_desde_ultima_compra' },
        { header: 'Origens', render: (row) => renderOriginsBadges(row) },
        { header: 'Cidade/Estado', sortField: 'cidade', render: (row) => `${row.cidade || '-'}/${row.estado || '-'}` },
        { header: 'Sexo', render: (row) => formatSexo(row.sexo) },
        { header: 'Data Nascimento', field: 'data_nascimento', render: (row) => row.data_nascimento ? new Date(row.data_nascimento).toLocaleDateString('pt-BR') : '-' },
        { header: 'Qualidade', sortField: 'qualidade_dados', render: renderQualityBadge }
            ])}
      {renderPagination()}
    </div>
  );

  const renderMonitoramentoGeral = () => {
    if (!monitoramentoGeralData) return null;
    return (
      <>
      <div className="cc-dashboard-grid" style={{gridTemplateColumns:'repeat(4, minmax(0,1fr))'}}>
          <div className="cc-card" style={{background:'#10b981', color:'#fff'}}>
            <h3 style={{color:'#111'}}>📊 Dashboard Monitoramento</h3>
            <div className="cc-stat-value-large">{monitoramentoGeralData.total_para_monitoramento?.toLocaleString()}</div>
      </div>
          <div className="cc-card">
            <h3>🟢 1-29 dias</h3>
            <div className="cc-stat-value-large">{monitoramentoGeralData.total_monitoramento_1_29?.toLocaleString()}</div>
            <button className="cc-btn cc-btn-primary" onClick={() => setActiveTab('monitoramento-1-29')}>Ver Lista</button>
    </div>
          <div className="cc-card">
            <h3>🟡 30-59 dias</h3>
            <div className="cc-stat-value-large">{monitoramentoGeralData.total_monitoramento_30_59?.toLocaleString()}</div>
            <button className="cc-btn cc-btn-primary" onClick={() => setActiveTab('monitoramento-30-59')}>Ver Lista</button>
          </div>
          <div className="cc-card">
            <h3>🟠 60-90 dias</h3>
            <div className="cc-stat-value-large">{monitoramentoGeralData.total_monitoramento_60_90?.toLocaleString()}</div>
            <button className="cc-btn cc-btn-primary" onClick={() => setActiveTab('monitoramento-60-90')}>Ver Lista</button>
          </div>
      </div>
      <div style={{marginTop: '16px'}}>
        <h3>📊 Qualidade por Grupo</h3>
        {renderMonitoramentoStats()}
      </div>
      </>
    );
  };

  const renderMonitoramentoStats = () => {
    if (!monitoramentoStats?.length) return null;
    const label = {
      monitoramento_1_29: '1-29 dias',
      monitoramento_30_59: '30-59 dias',
      monitoramento_60_90: '60-90 dias'
    };
    const desiredOrder = ['monitoramento_1_29','monitoramento_30_59','monitoramento_60_90'];
    const ordered = [...monitoramentoStats].sort((a,b)=> desiredOrder.indexOf(a.grupo) - desiredOrder.indexOf(b.grupo));
    return (
      <div className="cc-dashboard-grid">
        {ordered.map((g)=> (
          <div key={g.grupo} className="cc-card">
            <h3>📌 {label[g.grupo] || g.grupo}</h3>
            <div className="cc-stat-row"><span>Total</span><span className="cc-stat-value">{g.total?.toLocaleString?.()||g.total}</span></div>
            <div className="cc-stat-row"><span>Com E-mail</span><span>{g.com_email} ({Math.round(g.com_email*100/Math.max(g.total,1))}%)</span></div>
            <div className="cc-stat-row"><span>Com WhatsApp</span><span>{g.com_whatsapp} ({Math.round(g.com_whatsapp*100/Math.max(g.total,1))}%)</span></div>
            <div className="cc-stat-row"><span>Com CPF</span><span>{g.com_cpf} ({Math.round(g.com_cpf*100/Math.max(g.total,1))}%)</span></div>
            <div className="cc-stat-row"><span>Com Data Nasc.</span><span>{g.com_dn} ({Math.round(g.com_dn*100/Math.max(g.total,1))}%)</span></div>
            <div className="cc-stat-row"><span>Com Endereço</span><span>{g.com_endereco} ({Math.round(g.com_endereco*100/Math.max(g.total,1))}%)</span></div>
            <div className="cc-stat-row"><span>Dados 100%</span><span>{g.dados_100} ({Math.round(g.dados_100*100/Math.max(g.total,1))}%)</span></div>
            <div className="cc-stat-row"><span style={{color:'#dc2626'}}>Duplicados</span><span style={{color:'#dc2626'}}>{g.duplicados || 0} ({(((g.duplicados||0)*100)/Math.max(g.total,1)).toFixed(1)}%)</span></div>
            <div className="cc-tags" style={{marginTop: 8, display:'flex', gap:8, flexWrap:'wrap'}}>
              <span className="cc-tag cc-tag-sprint">Sprint: {g.em_sprint || 0} ({Math.round((g.em_sprint||0)*100/Math.max(g.total,1))}%)</span>
              <span className="cc-tag cc-tag-greatpage">GreatPage: {g.em_greatpage || 0} ({Math.round((g.em_greatpage||0)*100/Math.max(g.total,1))}%)</span>
              <span className="cc-tag cc-tag-blacklabs">BlackLabs: {g.em_blacklabs || 0} ({Math.round((g.em_blacklabs||0)*100/Math.max(g.total,1))}%)</span>
            </div>
            <div style={{marginTop:8}}>
              <button className="cc-btn cc-btn-small" onClick={()=> setActiveTab('duplicados')}>Ver Duplicados</button>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderMonitoramento129 = () => (
    <div className="cc-list-container">
      <div className="cc-list-header">
        <h2>🟢 Monitoramento - 1-29 dias</h2>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <select className="cc-select cc-select-small" value={exportFormat} onChange={(e)=>setExportFormat(e.target.value)}>
            <option value="csv">CSV</option>
            <option value="excel">Excel (.xls)</option>
            <option value="xlsx">XLSX</option>
            <option value="json">JSON</option>
            <option value="pdf">PDF</option>
          </select>
          <button
            className="cc-btn cc-btn-primary"
            onClick={handleSprinthubSend}
            disabled={isLoading || selectedRows.length === 0 || isSendingToSprinthub}
            title="Enviar para SprintHub"
          >
            🚀 Enviar SprintHub
          </button>
          <button
            className="cc-btn cc-btn-small"
            onClick={async () => {
              setShowAutoSyncConfig(true);
            }}
            style={{ backgroundColor: '#7c3aed', color: 'white' }}
            title="Configurar envio automático"
          >
            ⚙️ Config. Automático
          </button>
          <button className="cc-btn cc-btn-export" onClick={() => exportSelectedCurrent('monitoramento_1_29')} disabled={isLoading || selectedRows.length===0}>📥 Exportar Selecionados</button>
          <button className="cc-btn cc-btn-export" onClick={() => exportAllFromTable('monitoramento_1_29', 'vw_monitoramento_1_29_dias')} disabled={isLoading}>Exportar Tudo (CSV)</button>
      </div>
      </div>
      {renderFiltersBar()}
      {renderClientesTable(filterRowsByDuplicates(filterRowsByNameStatus(monitoramento129Data)), [
        { header: 'Exportado', render: (row) => renderExportStatusIcon(row) },
        { header: 'Duplicatas', render: (row) => renderDuplicatesIcon(row) },
        { header: 'Nome', sortField: 'nome_completo', render: (row) => (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {renderNomePorOrigem(row)}
            {row.nome_completo && /[0-9]{10,}/.test(row.nome_completo) && (
              <button
                className="cc-btn-corrigir"
                onClick={() => corrigirTelefoneNoNome(row.id || row.id_cliente_mestre, row.nome_completo)}
                title="Corrigir telefone no nome"
              >
                🔧
              </button>
            )}
          </div>
        ) },
        { header: 'Email', field: 'email' },
        { header: 'WhatsApp', field: 'whatsapp' },
        { header: 'CPF', field: 'cpf' },
        { 
          header: 'Total Compras', 
          field: 'total_compras',
          render: (row) => {
            // Monitoramento: usar total_pedidos (pedidos aprovados) ou total_compras
            const totalCompras = row.total_pedidos || row.total_compras || 0;
            const idPrime = row.id_prime || row.prime_id || row.idprime;
            const nomeCliente = row.nome_completo || 'Cliente';
            
            // Monitoramento: sempre mostrar (se está no monitoramento, é porque comprou)
            // Se não tem ID Prime, mostra apenas o número sem link
            if (!idPrime) {
              return <span>{totalCompras}</span>;
            }
            
            // Se tem ID Prime, mostra com link clicável
            return (
              <span 
                className="cc-total-compras-clickable"
                onClick={(e) => {
                  e.stopPropagation();
                  const url = `/historico-compras?cliente_id=${idPrime}&nome=${encodeURIComponent(nomeCliente)}`;
                  window.open(url, '_blank');
                }}
                title="Clique para ver histórico completo de compras"
              >
                {totalCompras}
              </span>
            );
          }
        },
        { 
          header: 'Dias Última Compra', 
          field: 'dias_desde_ultima_compra',
          render: (row) => {
            // Monitoramento: sempre mostrar (se está no monitoramento, é porque comprou)
            const diasUltimaCompra = row.dias_desde_ultima_compra;
            return <span>{diasUltimaCompra !== null && diasUltimaCompra !== undefined ? diasUltimaCompra : '-'}</span>;
          }
        },
        { header: 'Origens', render: (row) => renderOriginsBadges(row) },
        { header: 'Cidade/Estado', sortField: 'cidade', render: (row) => `${row.cidade || '-'}/${row.estado || '-'}` },
        { header: 'Sexo', render: (row) => formatSexo(row.sexo) },
        { header: 'Data Nascimento', field: 'data_nascimento', render: (row) => row.data_nascimento ? new Date(row.data_nascimento).toLocaleDateString('pt-BR') : '-' },
        { header: 'Qualidade', sortField: 'qualidade_dados', render: renderQualityBadge }
            ])}
      {renderPagination()}
    </div>
  );

  const renderMonitoramento3059 = () => (
    <div className="cc-list-container">
      <div className="cc-list-header">
        <h2>🟡 Monitoramento - 30-59 dias</h2>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <select className="cc-select cc-select-small" value={exportFormat} onChange={(e)=>setExportFormat(e.target.value)}>
            <option value="csv">CSV</option>
            <option value="excel">Excel (.xls)</option>
            <option value="xlsx">XLSX</option>
            <option value="json">JSON</option>
            <option value="pdf">PDF</option>
          </select>
          <button
            className="cc-btn cc-btn-primary"
            onClick={handleSprinthubSend}
            disabled={isLoading || selectedRows.length === 0 || isSendingToSprinthub}
            title="Enviar para SprintHub"
          >
            🚀 Enviar SprintHub
          </button>
          <button
            className="cc-btn cc-btn-small"
            onClick={async () => {
              setShowAutoSyncConfig(true);
            }}
            style={{ backgroundColor: '#7c3aed', color: 'white' }}
            title="Configurar envio automático"
          >
            ⚙️ Config. Automático
          </button>
          <button className="cc-btn cc-btn-export" onClick={() => exportSelectedCurrent('monitoramento_30_59')} disabled={isLoading || selectedRows.length===0}>📥 Exportar Selecionados</button>
          <button className="cc-btn cc-btn-export" onClick={() => exportAllFromTable('monitoramento_30_59', 'vw_monitoramento_30_59_dias')} disabled={isLoading}>Exportar Tudo (CSV)</button>
      </div>
      </div>
      {renderFiltersBar()}
      {renderClientesTable(filterRowsByDuplicates(filterRowsByNameStatus(monitoramento3059Data)), [
        { header: 'Exportado', render: (row) => renderExportStatusIcon(row) },
        { header: 'Duplicatas', render: (row) => renderDuplicatesIcon(row) },
        { header: 'Nome', sortField: 'nome_completo', render: (row) => (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {renderNomePorOrigem(row)}
            {row.nome_completo && /[0-9]{10,}/.test(row.nome_completo) && (
              <button
                className="cc-btn-corrigir"
                onClick={() => corrigirTelefoneNoNome(row.id || row.id_cliente_mestre, row.nome_completo)}
                title="Corrigir telefone no nome"
              >
                🔧
              </button>
            )}
          </div>
        ) },
        { header: 'Email', field: 'email' },
        { header: 'WhatsApp', field: 'whatsapp' },
        { header: 'CPF', field: 'cpf' },
        { 
          header: 'Total Compras', 
          field: 'total_compras',
          render: (row) => {
            // Monitoramento: usar total_pedidos (pedidos aprovados) ou total_compras
            const totalCompras = row.total_pedidos || row.total_compras || 0;
            const idPrime = row.id_prime || row.prime_id || row.idprime;
            const nomeCliente = row.nome_completo || 'Cliente';
            
            // Monitoramento: sempre mostrar (se está no monitoramento, é porque comprou)
            // Se não tem ID Prime, mostra apenas o número sem link
            if (!idPrime) {
              return <span>{totalCompras}</span>;
            }
            
            // Se tem ID Prime, mostra com link clicável
            return (
              <span 
                className="cc-total-compras-clickable"
                onClick={(e) => {
                  e.stopPropagation();
                  const url = `/historico-compras?cliente_id=${idPrime}&nome=${encodeURIComponent(nomeCliente)}`;
                  window.open(url, '_blank');
                }}
                title="Clique para ver histórico completo de compras"
              >
                {totalCompras}
              </span>
            );
          }
        },
        { 
          header: 'Dias Última Compra', 
          field: 'dias_desde_ultima_compra',
          render: (row) => {
            // Monitoramento: sempre mostrar (se está no monitoramento, é porque comprou)
            const diasUltimaCompra = row.dias_desde_ultima_compra;
            return <span>{diasUltimaCompra !== null && diasUltimaCompra !== undefined ? diasUltimaCompra : '-'}</span>;
          }
        },
        { header: 'Origens', render: (row) => renderOriginsBadges(row) },
        { header: 'Cidade/Estado', sortField: 'cidade', render: (row) => `${row.cidade || '-'}/${row.estado || '-'}` },
        { header: 'Sexo', render: (row) => formatSexo(row.sexo) },
        { header: 'Data Nascimento', field: 'data_nascimento', render: (row) => row.data_nascimento ? new Date(row.data_nascimento).toLocaleDateString('pt-BR') : '-' },
        { header: 'Qualidade', sortField: 'qualidade_dados', render: renderQualityBadge }
            ])}
      {renderPagination()}
    </div>
  );

  const renderMonitoramento6090 = () => (
    <div className="cc-list-container">
      <div className="cc-list-header">
        <h2>🟠 Monitoramento - 60-90 dias</h2>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <select className="cc-select cc-select-small" value={exportFormat} onChange={(e)=>setExportFormat(e.target.value)}>
            <option value="csv">CSV</option>
            <option value="excel">Excel (.xls)</option>
            <option value="xlsx">XLSX</option>
            <option value="json">JSON</option>
            <option value="pdf">PDF</option>
          </select>
          <button
            className="cc-btn cc-btn-primary"
            onClick={handleSprinthubSend}
            disabled={isLoading || selectedRows.length === 0 || isSendingToSprinthub}
            title="Enviar para SprintHub"
          >
            🚀 Enviar SprintHub
          </button>
          <button
            className="cc-btn cc-btn-small"
            onClick={async () => {
              setShowAutoSyncConfig(true);
            }}
            style={{ backgroundColor: '#7c3aed', color: 'white' }}
            title="Configurar envio automático"
          >
            ⚙️ Config. Automático
          </button>
          <button className="cc-btn cc-btn-export" onClick={() => exportSelectedCurrent('monitoramento_60_90')} disabled={isLoading || selectedRows.length===0}>📥 Exportar Selecionados</button>
          <button className="cc-btn cc-btn-export" onClick={() => exportAllFromTable('monitoramento_60_90', 'vw_monitoramento_60_90_dias')} disabled={isLoading}>Exportar Tudo (CSV)</button>
      </div>
      </div>
      {renderFiltersBar()}
      {renderClientesTable(filterRowsByDuplicates(filterRowsByNameStatus(monitoramento6090Data)), [
        { header: 'Exportado', render: (row) => renderExportStatusIcon(row) },
        { header: 'Duplicatas', render: (row) => renderDuplicatesIcon(row) },
        { header: 'Nome', sortField: 'nome_completo', render: (row) => (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {renderNomePorOrigem(row)}
            {row.nome_completo && /[0-9]{10,}/.test(row.nome_completo) && (
              <button
                className="cc-btn-corrigir"
                onClick={() => corrigirTelefoneNoNome(row.id || row.id_cliente_mestre, row.nome_completo)}
                title="Corrigir telefone no nome"
              >
                🔧
              </button>
            )}
          </div>
        ) },
        { header: 'Email', field: 'email' },
        { header: 'WhatsApp', field: 'whatsapp' },
        { header: 'CPF', field: 'cpf' },
        { 
          header: 'Total Compras', 
          field: 'total_compras',
          render: (row) => {
            // Monitoramento: usar total_pedidos (pedidos aprovados) ou total_compras
            const totalCompras = row.total_pedidos || row.total_compras || 0;
            const idPrime = row.id_prime || row.prime_id || row.idprime;
            const nomeCliente = row.nome_completo || 'Cliente';
            
            // Monitoramento: sempre mostrar (se está no monitoramento, é porque comprou)
            // Se não tem ID Prime, mostra apenas o número sem link
            if (!idPrime) {
              return <span>{totalCompras}</span>;
            }
            
            // Se tem ID Prime, mostra com link clicável
            return (
              <span 
                className="cc-total-compras-clickable"
                onClick={(e) => {
                  e.stopPropagation();
                  const url = `/historico-compras?cliente_id=${idPrime}&nome=${encodeURIComponent(nomeCliente)}`;
                  window.open(url, '_blank');
                }}
                title="Clique para ver histórico completo de compras"
              >
                {totalCompras}
              </span>
            );
          }
        },
        { 
          header: 'Dias Última Compra', 
          field: 'dias_desde_ultima_compra',
          render: (row) => {
            // Monitoramento: sempre mostrar (se está no monitoramento, é porque comprou)
            const diasUltimaCompra = row.dias_desde_ultima_compra;
            return <span>{diasUltimaCompra !== null && diasUltimaCompra !== undefined ? diasUltimaCompra : '-'}</span>;
          }
        },
        { header: 'Origens', render: (row) => renderOriginsBadges(row) },
        { header: 'Cidade/Estado', sortField: 'cidade', render: (row) => `${row.cidade || '-'}/${row.estado || '-'}` },
        { header: 'Sexo', render: (row) => formatSexo(row.sexo) },
        { header: 'Data Nascimento', field: 'data_nascimento', render: (row) => row.data_nascimento ? new Date(row.data_nascimento).toLocaleDateString('pt-BR') : '-' },
        { header: 'Qualidade', sortField: 'qualidade_dados', render: renderQualityBadge }
            ])}
      {renderPagination()}
    </div>
  );

  const renderMonitoramentoD45 = () => (
    <div className="cc-list-container">
      <div className="cc-list-header">
        <h2>🔵 Monitoramento - D45 (31-45 dias)</h2>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <select className="cc-select cc-select-small" value={exportFormat} onChange={(e)=>setExportFormat(e.target.value)}>
            <option value="csv">CSV</option>
            <option value="excel">Excel (.xls)</option>
            <option value="xlsx">XLSX</option>
            <option value="json">JSON</option>
            <option value="pdf">PDF</option>
          </select>
          <button
            className="cc-btn cc-btn-primary"
            onClick={handleSprinthubSend}
            disabled={isLoading || selectedRows.length === 0 || isSendingToSprinthub}
            title="Enviar para SprintHub"
          >
            🚀 Enviar SprintHub
          </button>
          <button
            className="cc-btn cc-btn-small"
            onClick={async () => {
              setShowAutoSyncConfig(true);
            }}
            style={{ backgroundColor: '#7c3aed', color: 'white' }}
            title="Configurar envio automático"
          >
            ⚙️ Config. Automático
          </button>
          <button className="cc-btn cc-btn-export" onClick={() => exportSelectedCurrent('monitoramento_d45')} disabled={isLoading || selectedRows.length===0}>📥 Exportar Selecionados</button>
          <button className="cc-btn cc-btn-export" onClick={() => exportAllFromTable('monitoramento_d45', 'vw_monitoramento_d45')} disabled={isLoading}>Exportar Tudo (CSV)</button>
      </div>
      </div>
      {renderFiltersBar()}
      {renderClientesTable(filterRowsByDuplicates(filterRowsByNameStatus(monitoramentoD45Data)), [
        { header: 'Exportado', render: (row) => renderExportStatusIcon(row) },
        { header: 'Duplicatas', render: (row) => renderDuplicatesIcon(row) },
        { header: 'Nome', sortField: 'nome_completo', render: (row) => (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {renderNomePorOrigem(row)}
            {row.nome_completo && /[0-9]{10,}/.test(row.nome_completo) && (
              <button
                className="cc-btn-corrigir"
                onClick={() => corrigirTelefoneNoNome(row.id || row.id_cliente_mestre, row.nome_completo)}
                title="Corrigir telefone no nome"
              >
                🔧
              </button>
            )}
          </div>
        ) },
        { header: 'Email', field: 'email' },
        { header: 'WhatsApp', field: 'whatsapp' },
        { header: 'CPF', field: 'cpf' },
        { 
          header: 'Total Compras', 
          field: 'total_compras',
          render: (row) => {
            const totalCompras = row.total_pedidos || row.total_compras || 0;
            const idPrime = row.id_prime || row.prime_id || row.idprime;
            const nomeCliente = row.nome_completo || 'Cliente';
            
            if (!idPrime) {
              return <span>{totalCompras}</span>;
            }
            
            return (
              <span 
                className="cc-total-compras-clickable"
                onClick={(e) => {
                  e.stopPropagation();
                  const url = `/historico-compras?cliente_id=${idPrime}&nome=${encodeURIComponent(nomeCliente)}`;
                  window.open(url, '_blank');
                }}
                title="Clique para ver histórico completo de compras"
              >
                {totalCompras}
              </span>
            );
          }
        },
        { 
          header: 'Dias Última Compra', 
          field: 'dias_desde_ultima_compra',
          render: (row) => {
            const diasUltimaCompra = row.dias_desde_ultima_compra;
            return <span>{diasUltimaCompra !== null && diasUltimaCompra !== undefined ? diasUltimaCompra : '-'}</span>;
          }
        },
        { header: 'Origens', render: (row) => renderOriginsBadges(row) },
        { header: 'Cidade/Estado', sortField: 'cidade', render: (row) => `${row.cidade || '-'}/${row.estado || '-'}` },
        { header: 'Sexo', render: (row) => formatSexo(row.sexo) },
        { header: 'Data Nascimento', field: 'data_nascimento', render: (row) => row.data_nascimento ? new Date(row.data_nascimento).toLocaleDateString('pt-BR') : '-' },
        { header: 'Qualidade', sortField: 'qualidade_dados', render: renderQualityBadge }
            ])}
      {renderPagination()}
    </div>
  );

  const renderMonitoramentoD60 = () => (
    <div className="cc-list-container">
      <div className="cc-list-header">
        <h2>🟣 Monitoramento - D60 (46-60 dias)</h2>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <select className="cc-select cc-select-small" value={exportFormat} onChange={(e)=>setExportFormat(e.target.value)}>
            <option value="csv">CSV</option>
            <option value="excel">Excel (.xls)</option>
            <option value="xlsx">XLSX</option>
            <option value="json">JSON</option>
            <option value="pdf">PDF</option>
          </select>
          <button
            className="cc-btn cc-btn-primary"
            onClick={handleSprinthubSend}
            disabled={isLoading || selectedRows.length === 0 || isSendingToSprinthub}
            title="Enviar para SprintHub"
          >
            🚀 Enviar SprintHub
          </button>
          <button
            className="cc-btn cc-btn-small"
            onClick={async () => {
              setShowAutoSyncConfig(true);
            }}
            style={{ backgroundColor: '#7c3aed', color: 'white' }}
            title="Configurar envio automático"
          >
            ⚙️ Config. Automático
          </button>
          <button className="cc-btn cc-btn-export" onClick={() => exportSelectedCurrent('monitoramento_d60')} disabled={isLoading || selectedRows.length===0}>📥 Exportar Selecionados</button>
          <button className="cc-btn cc-btn-export" onClick={() => exportAllFromTable('monitoramento_d60', 'vw_monitoramento_d60')} disabled={isLoading}>Exportar Tudo (CSV)</button>
      </div>
      </div>
      {renderFiltersBar()}
      {renderClientesTable(filterRowsByDuplicates(filterRowsByNameStatus(monitoramentoD60Data)), [
        { header: 'Exportado', render: (row) => renderExportStatusIcon(row) },
        { header: 'Duplicatas', render: (row) => renderDuplicatesIcon(row) },
        { header: 'Nome', sortField: 'nome_completo', render: (row) => (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {renderNomePorOrigem(row)}
            {row.nome_completo && /[0-9]{10,}/.test(row.nome_completo) && (
              <button
                className="cc-btn-corrigir"
                onClick={() => corrigirTelefoneNoNome(row.id || row.id_cliente_mestre, row.nome_completo)}
                title="Corrigir telefone no nome"
              >
                🔧
              </button>
            )}
          </div>
        ) },
        { header: 'Email', field: 'email' },
        { header: 'WhatsApp', field: 'whatsapp' },
        { header: 'CPF', field: 'cpf' },
        { 
          header: 'Total Compras', 
          field: 'total_compras',
          render: (row) => {
            const totalCompras = row.total_pedidos || row.total_compras || 0;
            const idPrime = row.id_prime || row.prime_id || row.idprime;
            const nomeCliente = row.nome_completo || 'Cliente';
            
            if (!idPrime) {
              return <span>{totalCompras}</span>;
            }
            
            return (
              <span 
                className="cc-total-compras-clickable"
                onClick={(e) => {
                  e.stopPropagation();
                  const url = `/historico-compras?cliente_id=${idPrime}&nome=${encodeURIComponent(nomeCliente)}`;
                  window.open(url, '_blank');
                }}
                title="Clique para ver histórico completo de compras"
              >
                {totalCompras}
              </span>
            );
          }
        },
        { 
          header: 'Dias Última Compra', 
          field: 'dias_desde_ultima_compra',
          render: (row) => {
            const diasUltimaCompra = row.dias_desde_ultima_compra;
            return <span>{diasUltimaCompra !== null && diasUltimaCompra !== undefined ? diasUltimaCompra : '-'}</span>;
          }
        },
        { header: 'Origens', render: (row) => renderOriginsBadges(row) },
        { header: 'Cidade/Estado', sortField: 'cidade', render: (row) => `${row.cidade || '-'}/${row.estado || '-'}` },
        { header: 'Sexo', render: (row) => formatSexo(row.sexo) },
        { header: 'Data Nascimento', field: 'data_nascimento', render: (row) => row.data_nascimento ? new Date(row.data_nascimento).toLocaleDateString('pt-BR') : '-' },
        { header: 'Qualidade', sortField: 'qualidade_dados', render: renderQualityBadge }
            ])}
      {renderPagination()}
    </div>
  );

  const renderMonitoramentoD75 = () => (
    <div className="cc-list-container">
      <div className="cc-list-header">
        <h2>🟤 Monitoramento - D75 (61-75 dias)</h2>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <select className="cc-select cc-select-small" value={exportFormat} onChange={(e)=>setExportFormat(e.target.value)}>
            <option value="csv">CSV</option>
            <option value="excel">Excel (.xls)</option>
            <option value="xlsx">XLSX</option>
            <option value="json">JSON</option>
            <option value="pdf">PDF</option>
          </select>
          <button
            className="cc-btn cc-btn-primary"
            onClick={handleSprinthubSend}
            disabled={isLoading || selectedRows.length === 0 || isSendingToSprinthub}
            title="Enviar para SprintHub"
          >
            🚀 Enviar SprintHub
          </button>
          <button
            className="cc-btn cc-btn-small"
            onClick={async () => {
              setShowAutoSyncConfig(true);
            }}
            style={{ backgroundColor: '#7c3aed', color: 'white' }}
            title="Configurar envio automático"
          >
            ⚙️ Config. Automático
          </button>
          <button className="cc-btn cc-btn-export" onClick={() => exportSelectedCurrent('monitoramento_d75')} disabled={isLoading || selectedRows.length===0}>📥 Exportar Selecionados</button>
          <button className="cc-btn cc-btn-export" onClick={() => exportAllFromTable('monitoramento_d75', 'vw_monitoramento_d75')} disabled={isLoading}>Exportar Tudo (CSV)</button>
      </div>
      </div>
      {renderFiltersBar()}
      {renderClientesTable(filterRowsByDuplicates(filterRowsByNameStatus(monitoramentoD75Data)), [
        { header: 'Exportado', render: (row) => renderExportStatusIcon(row) },
        { header: 'Duplicatas', render: (row) => renderDuplicatesIcon(row) },
        { header: 'Nome', sortField: 'nome_completo', render: (row) => (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {renderNomePorOrigem(row)}
            {row.nome_completo && /[0-9]{10,}/.test(row.nome_completo) && (
              <button
                className="cc-btn-corrigir"
                onClick={() => corrigirTelefoneNoNome(row.id || row.id_cliente_mestre, row.nome_completo)}
                title="Corrigir telefone no nome"
              >
                🔧
              </button>
            )}
          </div>
        ) },
        { header: 'Email', field: 'email' },
        { header: 'WhatsApp', field: 'whatsapp' },
        { header: 'CPF', field: 'cpf' },
        { 
          header: 'Total Compras', 
          field: 'total_compras',
          render: (row) => {
            const totalCompras = row.total_pedidos || row.total_compras || 0;
            const idPrime = row.id_prime || row.prime_id || row.idprime;
            const nomeCliente = row.nome_completo || 'Cliente';
            
            if (!idPrime) {
              return <span>{totalCompras}</span>;
            }
            
            return (
              <span 
                className="cc-total-compras-clickable"
                onClick={(e) => {
                  e.stopPropagation();
                  const url = `/historico-compras?cliente_id=${idPrime}&nome=${encodeURIComponent(nomeCliente)}`;
                  window.open(url, '_blank');
                }}
                title="Clique para ver histórico completo de compras"
              >
                {totalCompras}
              </span>
            );
          }
        },
        { 
          header: 'Dias Última Compra', 
          field: 'dias_desde_ultima_compra',
          render: (row) => {
            const diasUltimaCompra = row.dias_desde_ultima_compra;
            return <span>{diasUltimaCompra !== null && diasUltimaCompra !== undefined ? diasUltimaCompra : '-'}</span>;
          }
        },
        { header: 'Origens', render: (row) => renderOriginsBadges(row) },
        { header: 'Cidade/Estado', sortField: 'cidade', render: (row) => `${row.cidade || '-'}/${row.estado || '-'}` },
        { header: 'Sexo', render: (row) => formatSexo(row.sexo) },
        { header: 'Data Nascimento', field: 'data_nascimento', render: (row) => row.data_nascimento ? new Date(row.data_nascimento).toLocaleDateString('pt-BR') : '-' },
        { header: 'Qualidade', sortField: 'qualidade_dados', render: renderQualityBadge }
            ])}
      {renderPagination()}
    </div>
  );

  const renderMonitoramentoD90 = () => (
    <div className="cc-list-container">
      <div className="cc-list-header">
        <h2>⚫ Monitoramento - D90 (76-90 dias)</h2>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <select className="cc-select cc-select-small" value={exportFormat} onChange={(e)=>setExportFormat(e.target.value)}>
            <option value="csv">CSV</option>
            <option value="excel">Excel (.xls)</option>
            <option value="xlsx">XLSX</option>
            <option value="json">JSON</option>
            <option value="pdf">PDF</option>
          </select>
          <button
            className="cc-btn cc-btn-primary"
            onClick={handleSprinthubSend}
            disabled={isLoading || selectedRows.length === 0 || isSendingToSprinthub}
            title="Enviar para SprintHub"
          >
            🚀 Enviar SprintHub
          </button>
          <button
            className="cc-btn cc-btn-small"
            onClick={async () => {
              setShowAutoSyncConfig(true);
            }}
            style={{ backgroundColor: '#7c3aed', color: 'white' }}
            title="Configurar envio automático"
          >
            ⚙️ Config. Automático
          </button>
          <button className="cc-btn cc-btn-export" onClick={() => exportSelectedCurrent('monitoramento_d90')} disabled={isLoading || selectedRows.length===0}>📥 Exportar Selecionados</button>
          <button className="cc-btn cc-btn-export" onClick={() => exportAllFromTable('monitoramento_d90', 'vw_monitoramento_d90')} disabled={isLoading}>Exportar Tudo (CSV)</button>
      </div>
      </div>
      {renderFiltersBar()}
      {renderClientesTable(filterRowsByDuplicates(filterRowsByNameStatus(monitoramentoD90Data)), [
        { header: 'Exportado', render: (row) => renderExportStatusIcon(row) },
        { header: 'Duplicatas', render: (row) => renderDuplicatesIcon(row) },
        { header: 'Nome', sortField: 'nome_completo', render: (row) => (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {renderNomePorOrigem(row)}
            {row.nome_completo && /[0-9]{10,}/.test(row.nome_completo) && (
              <button
                className="cc-btn-corrigir"
                onClick={() => corrigirTelefoneNoNome(row.id || row.id_cliente_mestre, row.nome_completo)}
                title="Corrigir telefone no nome"
              >
                🔧
              </button>
            )}
          </div>
        ) },
        { header: 'Email', field: 'email' },
        { header: 'WhatsApp', field: 'whatsapp' },
        { header: 'CPF', field: 'cpf' },
        { 
          header: 'Total Compras', 
          field: 'total_compras',
          render: (row) => {
            const totalCompras = row.total_pedidos || row.total_compras || 0;
            const idPrime = row.id_prime || row.prime_id || row.idprime;
            const nomeCliente = row.nome_completo || 'Cliente';
            
            if (!idPrime) {
              return <span>{totalCompras}</span>;
            }
            
            return (
              <span 
                className="cc-total-compras-clickable"
                onClick={(e) => {
                  e.stopPropagation();
                  const url = `/historico-compras?cliente_id=${idPrime}&nome=${encodeURIComponent(nomeCliente)}`;
                  window.open(url, '_blank');
                }}
                title="Clique para ver histórico completo de compras"
              >
                {totalCompras}
              </span>
            );
          }
        },
        { 
          header: 'Dias Última Compra', 
          field: 'dias_desde_ultima_compra',
          render: (row) => {
            const diasUltimaCompra = row.dias_desde_ultima_compra;
            return <span>{diasUltimaCompra !== null && diasUltimaCompra !== undefined ? diasUltimaCompra : '-'}</span>;
          }
        },
        { header: 'Origens', render: (row) => renderOriginsBadges(row) },
        { header: 'Cidade/Estado', sortField: 'cidade', render: (row) => `${row.cidade || '-'}/${row.estado || '-'}` },
        { header: 'Sexo', render: (row) => formatSexo(row.sexo) },
        { header: 'Data Nascimento', field: 'data_nascimento', render: (row) => row.data_nascimento ? new Date(row.data_nascimento).toLocaleDateString('pt-BR') : '-' },
        { header: 'Qualidade', sortField: 'qualidade_dados', render: renderQualityBadge }
            ])}
      {renderPagination()}
    </div>
  );

  const renderTabContent = () => {
    if (isLoading) {
      return (
        <div className="cc-loading-container">
          <div className="cc-progress-bar-container">
            <div className="cc-progress-bar-loading">
              <div className="cc-progress-bar-fill"></div>
            </div>
          </div>
          <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginTop: '16px' }}>Carregando dados...</p>
        </div>
      );
    }

    switch (activeTab) {
      case 'dashboard': return renderDashboard();
      case 'dashboard-sprint': return renderDashboardSprint();
      case 'dashboard-prime': return renderDashboardPrime();
      case 'completude': return renderCompletude();
      case 'origens': return renderOrigens();
      case 'falta-prime': return renderFaltaNoPrime();
      case 'falta-sprint': return renderFaltaNoSprint();
      case 'duplicados': return renderDuplicados();
      case 'qualidade': return renderQualidade();
      case 'baixa-qualidade': return renderBaixaQualidade();
      case 'aniversariantes-mes': return renderAniversariantesMes();
      case 'aniversariantes-proximos': return renderAniversariantesProximos();
      case 'sem-cpf': return renderSemCpf();
      case 'sem-email': return renderSemEmail();
      case 'sem-contato': return renderSemContato();
      case 'distribuicao-geo': return renderDistribuicaoGeo();
      case 'top-cidades': return renderTopCidades();
      case 'completos-alcancaveis': return renderCompletosAlcancaveis();
      case 'dados-essenciais': return renderDadosEssenciais();
      case 'atualizacoes-7dias': return renderAtualizacoes7Dias();
      case 'atualizacoes-30dias': return renderAtualizacoes30Dias();
      case 'executivo': return renderExecutivo();
      // Gestão de Clientes
      case 'dashboard-gestao': return renderDashboardGestao();
      case 'validacao-integridade': return renderValidacaoIntegridade();
      // Ativação
      case 'ativacao-geral': return renderAtivacaoGeral();
      case 'ativacao-prime': return renderAtivacaoPrime();
      case 'ativacao-fora-prime': return renderAtivacaoForaPrime();
      case 'ativacao-com-orcamento': return renderAtivacaoComOrcamento();
      case 'ativacao-sem-orcamento': return renderAtivacaoSemOrcamento();
      // Reativação
      case 'reativacao-geral': return renderReativacaoGeral();
      case 'reativacao-1x': return renderReativacao1x();
      case 'reativacao-2x': return renderReativacao2x();
      case 'reativacao-3x': return renderReativacao3x();
      case 'reativacao-3x-plus': return renderReativacao3xPlus();
      // Monitoramento
      case 'monitoramento-geral': return renderMonitoramentoGeral();
      case 'monitoramento-1-29': return renderMonitoramento129();
      case 'monitoramento-30-59': return renderMonitoramento3059();
      case 'monitoramento-60-90': return renderMonitoramento6090();
      case 'monitoramento-d45': return renderMonitoramentoD45();
      case 'monitoramento-d60': return renderMonitoramentoD60();
      case 'monitoramento-d75': return renderMonitoramentoD75();
      case 'monitoramento-d90': return renderMonitoramentoD90();
      default: return null;
    }
  };

  return (
    <div className="dashboard-container">
      <Sidebar
        sidebarExpanded={sidebarExpanded}
        isDarkMode={isDarkMode}
        currentLanguage={currentLanguage}
        translations={t}
      />

      {mobileMenuOpen && (
        <div className="mobile-menu-overlay" onClick={closeMobileMenu}>
          <div className="mobile-menu-content" onClick={(e) => e.stopPropagation()}>
            <Sidebar
              sidebarExpanded={true}
              isDarkMode={isDarkMode}
              currentLanguage={currentLanguage}
              translations={t}
              isMobile={true}
              onClose={closeMobileMenu}
              toggleTheme={toggleTheme}
              toggleFullscreen={toggleFullscreen}
              changeLanguage={changeLanguage}
            />
          </div>
        </div>
      )}

      <TopMenuBar
        sidebarExpanded={sidebarExpanded}
        toggleSidebar={toggleSidebar}
        toggleFullscreen={toggleFullscreen}
        toggleTheme={toggleTheme}
        isDarkMode={isDarkMode}
        currentLanguage={currentLanguage}
        changeLanguage={changeLanguage}
        onLogout={onLogout}
      />

      <FilterBar
        t={t}
        // estados atuais
        selectedSeller={selectedSeller}
        setSelectedSeller={setSelectedSeller}
        selectedPeriod={selectedPeriod}
        setSelectedPeriod={setSelectedPeriod}
        selectedFunnel={selectedFunnel}
        setSelectedFunnel={setSelectedFunnel}
        selectedUnit={selectedUnit}
        setSelectedUnit={setSelectedUnit}
        selectedOrigin={selectedOrigin}
        setSelectedOrigin={setSelectedOrigin}
        startDate={startDate}
        setStartDate={setStartDate}
        endDate={endDate}
        setEndDate={setEndDate}
        // callbacks para aplicação de filtros
        onUnitFilterChange={handleUnitFilterChange}
        onSellerFilterChange={handleSellerFilterChange}
        onOriginFilterChange={handleOriginFilterChange}
        onStatusFilterChange={handleStatusFilterChange}
        marketData={marketData}
      />

      <main className="main-content">
        <div className="main-chart">
          <div className="cc-layout">
            {/* Menu lateral de relatórios */}
            <aside className="cc-reports-menu">
              {menuConfig.map((group) => (
                <div key={group.key} className="cc-menu-group">
                  <div
                    className="cc-menu-group-header"
                    onClick={() => toggleGroup(group.key)}
                  >
                    <span>{group.title}</span>
                    <span className={`cc-menu-group-icon ${collapsedGroups[group.key] ? 'collapsed' : ''}`}>
                      ▼
                    </span>
                  </div>
                  <div className={`cc-menu-items ${collapsedGroups[group.key] ? 'collapsed' : ''}`}>
                    {group.items.map((item) => (
                      <button
                        key={item.key}
                        className={`cc-menu-item ${activeTab === item.key ? 'active' : ''}`}
                        onClick={() => setActiveTab(item.key)}
                        title={item.description}
                      >
                        <span className="cc-menu-item-icon">{item.icon}</span>
                        <span>{item.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </aside>

            {/* Conteúdo principal */}
            <div className="cc-content">
              <div className="cc-content-header">
                <h1 className="cc-content-title">
                  {activeTabInfo.icon} {activeTabInfo.label}
                </h1>
                <p className="cc-content-description">{activeTabInfo.description}</p>
              </div>

              <div className="cc-tab-content">
                {renderTabContent()}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Modal de Exportação */}
      {showExportModal && (
        <div className="cc-modal-overlay" onClick={() => setShowExportModal(false)}>
          <div className="cc-modal" onClick={(e) => e.stopPropagation()}>
            <h3>📥 Exportar Selecionados</h3>
            <div className="cc-modal-content">
              {/* (removido identificadores daqui) */}
              <label>
                Motivo da Exportação:
                <select 
                  value={exportMotivo} 
                  onChange={(e) => setExportMotivo(e.target.value)}
                  className="cc-select"
                >
                  <option value="SMS">SMS</option>
                  <option value="WHATSAPI">WhatsApp API</option>
                  <option value="CALLIX">Callix</option>
                  <option value="EMAIL">Email</option>
                </select>
              </label>
              <label>
                Observação (ex: Nome da Campanha):
                <input
                  type="text"
                  value={exportObservacao}
                  onChange={(e) => setExportObservacao(e.target.value)}
                  placeholder="Ex: Campanha Black Friday 2024"
                  className="cc-input"
                />
              </label>
            </div>
            <div className="cc-modal-actions">
              <button className="cc-btn cc-btn-primary" onClick={handleExportConfirm}>
                Confirmar Exportação
              </button>
              <button className="cc-btn" onClick={() => setShowExportModal(false)}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Escolha de Nome Padrão */}
      {showNameModal && selectedClientForName && (
        <div className="cc-modal-overlay" onClick={() => { setShowNameModal(false); setSelectedClientForName(null); setEditFields(null); }}>
          <div className="cc-modal" onClick={(e) => e.stopPropagation()}>
            <h3>📝 Escolher Nome Padrão</h3>
            <div className="cc-modal-content">
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <div style={{ flex: '1 1 260px' }}>
                  <strong>Identificadores</strong>
                  <div style={{ marginTop: '8px', fontSize: '12px', opacity: 0.9 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span>Prime:</span>
                      <code>{selectedClientForName?.id_prime ?? '—'}</code>
                      <button className="cc-btn cc-btn-small" onClick={() => { const id = selectedClientForName?.id_prime; if (id) navigator.clipboard.writeText(String(id)); }}>Copiar</button>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                      <span>Sprinthub:</span>
                      <code>{selectedClientForName?.id_sprinthub ?? '—'}</code>
                      <button className="cc-btn cc-btn-small" onClick={() => { const id = selectedClientForName?.id_sprinthub; if (id) navigator.clipboard.writeText(String(id)); }}>Copiar</button>
                      {selectedClientForName?.id_sprinthub && (
                        <a
                          className="cc-btn cc-btn-small"
                          href={`https://oficialmed.sprinthub.app/sh/leads/profile/${selectedClientForName.id_sprinthub}`}
                          target="_blank" rel="noreferrer"
                        >
                          Abrir no Sprinthub
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <p style={{ marginBottom: '16px', color: 'var(--text-secondary)' }}>
                Selecione qual nome deve ser usado como padrão para este cliente:
              </p>
              {selectedClientForName.nomes?.map((item, idx) => (
                <label key={idx} style={{ display: 'block', marginBottom: '12px', padding: '12px', border: '1px solid var(--border-color)', borderRadius: '8px', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="nomePadrao"
                    value={item.nome}
                    defaultChecked={idx === 0}
                    style={{ marginRight: '8px' }}
                  />
                  <span 
                    style={{ 
                      padding: '4px 8px', 
                      borderRadius: '4px',
                      backgroundColor: item.cor + '20',
                      color: item.cor,
                      marginRight: '8px',
                      fontSize: '12px',
                      fontWeight: 'bold'
                    }}
                  >
                    {item.origem}
                  </span>
                  {item.nome}
                </label>
              ))}
              <div style={{ marginTop: '10px' }}>
                <strong>Editar Campos</strong>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: '12px', marginTop: '10px' }}>
                  <label>Nome
                    <input className="cc-input" type="text" value={editFields?.nome_completo || ''} onChange={(e)=>setEditFields({ ...(editFields||{}), nome_completo: e.target.value })} />
                  </label>
                  <label>Email
                    <input className="cc-input" type="email" value={editFields?.email || ''} onChange={(e)=>setEditFields({ ...(editFields||{}), email: e.target.value })} />
                  </label>
                  <label>WhatsApp
                    <input className="cc-input" type="text" value={editFields?.whatsapp || ''} onChange={(e)=>setEditFields({ ...(editFields||{}), whatsapp: e.target.value })} />
                  </label>
                  <label>Telefone
                    <input className="cc-input" type="text" value={editFields?.telefone || ''} onChange={(e)=>setEditFields({ ...(editFields||{}), telefone: e.target.value })} />
                  </label>
                  <label>CPF
                    <input className="cc-input" type="text" value={editFields?.cpf || ''} onChange={(e)=>setEditFields({ ...(editFields||{}), cpf: e.target.value })} />
                  </label>
                  <label>Sexo
                    <select className="cc-select" value={editFields?.sexo || ''} onChange={(e)=>setEditFields({ ...(editFields||{}), sexo: e.target.value })}>
                      <option value="">—</option>
                      <option value="M">Masculino</option>
                      <option value="F">Feminino</option>
                    </select>
                  </label>
                  <label>Data Nascimento
                    <input className="cc-input" type="date" value={editFields?.data_nascimento || ''} onChange={(e)=>setEditFields({ ...(editFields||{}), data_nascimento: e.target.value })} />
                  </label>
                  <label>CEP
                    <input className="cc-input" type="text" value={editFields?.cep || ''} onChange={(e)=>setEditFields({ ...(editFields||{}), cep: e.target.value })} />
                  </label>
                  <label>Estado
                    <input className="cc-input" type="text" value={editFields?.estado || ''} onChange={(e)=>setEditFields({ ...(editFields||{}), estado: e.target.value })} />
                  </label>
                  <label>Cidade
                    <input className="cc-input" type="text" value={editFields?.cidade || ''} onChange={(e)=>setEditFields({ ...(editFields||{}), cidade: e.target.value })} />
                  </label>
                  <label>Endereço (Rua)
                    <input className="cc-input" type="text" value={editFields?.endereco_rua || ''} onChange={(e)=>setEditFields({ ...(editFields||{}), endereco_rua: e.target.value })} />
                  </label>
                  <label>Número
                    <input className="cc-input" type="text" value={editFields?.endereco_numero || ''} onChange={(e)=>setEditFields({ ...(editFields||{}), endereco_numero: e.target.value })} />
                  </label>
                  <label>Complemento
                    <input className="cc-input" type="text" value={editFields?.endereco_complemento || ''} onChange={(e)=>setEditFields({ ...(editFields||{}), endereco_complemento: e.target.value })} />
                  </label>
                </div>
              </div>
            </div>
            <div className="cc-modal-actions">
              <button 
                className="cc-btn cc-btn-primary" 
                onClick={() => {
                  const selected = document.querySelector('input[name="nomePadrao"]:checked');
                  if (selected) {
                    const nomeEscolhido = selected.value;
                    const origemNome = selectedClientForName.nomes?.find(n => n.nome === nomeEscolhido)?.origem || 'manual';
                    validarNomePadrao(selectedClientForName.id, nomeEscolhido, origemNome);
                  }
                }}
              >
                Confirmar Nome Padrão
              </button>
              <button className="cc-btn cc-btn-primary" onClick={salvarEdicaoCampos}>Salvar Alterações</button>
              <button
                className="cc-btn"
                onClick={async () => {
                  await supabase.rpc('marcar_nome_incompleto', { p_id_cliente: selectedClientForName.id });
                  setShowNameModal(false);
                  setSelectedClientForName(null);
                  setEditFields(null);
                  loadTabData();
                }}
                title="Marcar como NOME INCOMPLETO"
              >
                Marcar como NOME INCOMPLETO
              </button>
              <button
                className="cc-btn"
                onClick={async () => {
                  const selected = document.querySelector('input[name="nomePadrao"]:checked');
                  const nomeAtual = selected ? selected.value : null;
                  await supabase.rpc('mover_nome_para_telefone', { p_id_cliente: selectedClientForName.id, p_nome: nomeAtual });
                  setShowNameModal(false);
                  setSelectedClientForName(null);
                  setEditFields(null);
                  loadTabData();
                }}
                title="Mover nome para Telefone"
              >
                Mover nome para Telefone
              </button>
              <button
                className="cc-btn"
                onClick={() => { setShowNameModal(false); setSelectedClientForName(null); setEditFields(null); }}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Histórico de Exportações */}
      {showHistoryModal && selectedHistoryLead && (
        <div className="cc-modal-overlay" onClick={() => { setShowHistoryModal(false); setSelectedHistoryLead(null); }}>
          <div className="cc-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <h3>📊 Histórico de Exportações</h3>
            <div className="cc-modal-content">
              <div style={{ marginBottom: '16px', padding: '12px', backgroundColor: 'var(--background-secondary)', borderRadius: '8px' }}>
                <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                  <strong>Cliente:</strong> {selectedHistoryLead.row.nome_completo || 'Sem nome'}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  <strong>WhatsApp:</strong> {selectedHistoryLead.row.whatsapp || '—'} |
                  <strong> Email:</strong> {selectedHistoryLead.row.email || '—'}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  <strong>Total de exportações:</strong> {selectedHistoryLead.history.length}x
                </div>
              </div>

              <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                {selectedHistoryLead.history.map((exp, idx) => {
                  const motivoColors = {
                    'WHATSAPI': '#25D366',
                    'SMS': '#FF6B35',
                    'CALLIX': '#4285F4',
                    'EMAIL': '#EA4335'
                  };
                  const cor = motivoColors[exp.motivo] || '#666';

                  return (
                    <div
                      key={idx}
                      style={{
                        padding: '12px',
                        marginBottom: '8px',
                        border: '1px solid var(--border-color)',
                        borderRadius: '8px',
                        borderLeft: `4px solid ${cor}`,
                        backgroundColor: idx === 0 ? 'var(--background-secondary)' : 'transparent'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                        <span
                          style={{
                            padding: '4px 12px',
                            borderRadius: '12px',
                            backgroundColor: cor + '20',
                            color: cor,
                            fontSize: '13px',
                            fontWeight: 'bold'
                          }}
                        >
                          {exp.motivo}
                        </span>
                        <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                          {new Date(exp.data_exportacao).toLocaleString('pt-BR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                      {exp.observacao && (
                        <div style={{ fontSize: '13px', color: 'var(--text-primary)', marginTop: '6px' }}>
                          {exp.observacao}
                        </div>
                      )}
                      {exp.usuario_id && (
                        <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px', opacity: 0.7 }}>
                          Por: Usuário {exp.usuario_id}
        </div>
      )}
    </div>
  );
                })}
              </div>

              <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  className="cc-btn"
                  onClick={() => { setShowHistoryModal(false); setSelectedHistoryLead(null); }}
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Detalhes de Qualidade */}
      {showQualityModal && selectedQualityClient && (
        <div className="cc-modal-overlay" onClick={() => { setShowQualityModal(false); setSelectedQualityClient(null); }}>
          <div className="cc-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <h3>⭐ Detalhes de Qualidade do Cliente</h3>
            <div className="cc-modal-content">
              <div style={{ marginBottom: '16px', padding: '12px', backgroundColor: 'var(--background-secondary)', borderRadius: '8px' }}>
                <div style={{ fontSize: '14px', color: 'var(--text-primary)', marginBottom: '8px' }}>
                  <strong>{selectedQualityClient.nome_completo || 'Sem nome'}</strong>
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  <strong>Email:</strong> {selectedQualityClient.email || '—'} |
                  <strong> WhatsApp:</strong> {selectedQualityClient.whatsapp || '—'}
                </div>
              </div>

              {(() => {
                const { criteria, metCriteria, totalCriteria } = calculateQualityCriteria(selectedQualityClient);
                // Usar a nota da tabela (qualidade_dados) ao invés de recalcular
                const score = selectedQualityClient.qualidade_dados || 0;
                const qualityClass = score >= 80 ? 'high' : score >= 60 ? 'medium' : 'low';
                const qualityColor = score >= 80 ? '#22c55e' : score >= 60 ? '#eab308' : '#ef4444';

                return (
                  <>
                    <div style={{
                      padding: '16px',
                      marginBottom: '16px',
                      backgroundColor: qualityColor + '15',
                      border: `2px solid ${qualityColor}`,
                      borderRadius: '8px',
                      textAlign: 'center'
                    }}>
                      <div style={{ fontSize: '32px', fontWeight: 'bold', color: qualityColor }}>
                        {score}/100
                      </div>
                      <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                        {metCriteria} de {totalCriteria} critérios básicos atendidos
                      </div>
                    </div>

                    <div style={{ marginBottom: '16px' }}>
                      <h4 style={{ marginBottom: '12px', fontSize: '14px', fontWeight: 'bold' }}>
                        Critérios Avaliados:
                      </h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {criteria.map((criterion, idx) => (
                          <div
                            key={idx}
                            style={{
                              padding: '10px',
                              border: '1px solid var(--border-color)',
                              borderRadius: '6px',
                              display: 'flex',
                              alignItems: 'flex-start',
                              gap: '12px',
                              backgroundColor: criterion.check ? '#22c55e15' : '#ef444415'
                            }}
                          >
                            <div style={{ fontSize: '20px', flexShrink: 0 }}>
                              {criterion.check ? '✅' : '❌'}
                            </div>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontWeight: '500', fontSize: '13px', marginBottom: '4px' }}>
                                {criterion.label}
                              </div>
                              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', wordBreak: 'break-all' }}>
                                {criterion.value}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                );
              })()}

              <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  className="cc-btn"
                  onClick={() => { setShowQualityModal(false); setSelectedQualityClient(null); }}
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Duplicatas e Mesclagem */}
      {showDuplicatesModal && selectedDuplicatesClient && (
        <div className="cc-modal-overlay" onClick={() => { 
          setShowDuplicatesModal(false); 
          setSelectedDuplicatesClient(null); 
          setSelectedMasterLead(null); 
          setFieldSelection({});
          setPrimePedidosData({});
        }}>
          <div 
            className="cc-modal" 
            onClick={(e) => e.stopPropagation()} 
            style={{ 
              maxWidth: '1200px', 
              maxHeight: '90vh', 
              overflowY: 'auto',
              backgroundColor: '#1f2937',
              color: '#f3f4f6',
              border: '1px solid #374151'
            }}
          >
            <h3 style={{ color: '#f3f4f6', marginBottom: '20px' }}>🔗 Mesclar Duplicatas</h3>
            <div className="cc-modal-content" style={{ color: '#f3f4f6' }}>
              <div style={{ marginBottom: '16px', padding: '12px', backgroundColor: '#451a03', border: '1px solid #f59e0b', borderRadius: '8px' }}>
                <div style={{ fontSize: '14px', color: '#fbbf24', fontWeight: 'bold', marginBottom: '4px' }}>
                  ⚠️ {selectedDuplicatesClient.duplicates?.length} duplicata(s) encontrada(s) para:
                </div>
                <div style={{ fontSize: '13px', color: '#fcd34d' }}>
                  <strong>{selectedDuplicatesClient.nome_completo || 'Sem nome'}</strong>
                </div>
              </div>

              {/* Seção 1: Seleção do Cliente Principal */}
              <div style={{ marginBottom: '24px' }}>
                <h4 style={{ marginBottom: '12px', fontSize: '14px', fontWeight: 'bold', color: '#f3f4f6' }}>
                  1️⃣ Selecione qual cliente será mantido como Principal:
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {/* Helper: Renderizar card de lead */}
                  {([selectedDuplicatesClient, ...(selectedDuplicatesClient.duplicates || [])]).map((lead, idx) => {
                    const isOriginal = idx === 0;
                    const isMaster = selectedMasterLead?.id === lead.id;
                    const pedidos = primePedidosData[lead.id] || [];
                    const hasPrimePedidos = pedidos.length > 0;
                    
                    // Determinar origem/tabela
                    const origens = lead.origem_marcas || [];
                    const origemBadge = origens.map(o => {
                      const colors = {
                        'prime': '#2563eb',
                        'sprinthub': '#9333ea',
                        'greatpage': '#059669',
                        'blacklabs': '#dc2626'
                      };
                      return { name: o.toUpperCase(), color: colors[o] || '#6b7280' };
                    });

                    return (
                      <div
                        key={lead.id || idx}
                        onClick={() => {
                          setSelectedMasterLead(lead);
                          // Inicializar seleção de campos com o master como padrão
                          const initialFields = {
                            nome_completo: lead.id,
                            email: lead.id,
                            whatsapp: lead.id,
                            telefone: lead.id,
                            cpf: lead.id,
                            data_nascimento: lead.id,
                            sexo: lead.id,
                            endereco_rua: lead.id,
                            cidade: lead.id,
                            estado: lead.id,
                            cep: lead.id
                          };
                          setFieldSelection(prev => ({ ...initialFields, ...prev }));
                        }}
                        style={{
                          padding: '16px',
                          border: `2px solid ${isMaster ? '#3b82f6' : '#4b5563'}`,
                          borderRadius: '8px',
                          cursor: 'pointer',
                          backgroundColor: isMaster ? '#1e3a8a' : '#374151',
                          color: '#f3f4f6',
                          transition: 'all 0.2s'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px', flexWrap: 'wrap' }}>
                          <input
                            type="radio"
                            name="masterLead"
                            checked={isMaster}
                            onChange={() => {
                              setSelectedMasterLead(lead);
                              const initialFields = {
                                nome_completo: lead.id,
                                email: lead.id,
                                whatsapp: lead.id,
                                telefone: lead.id,
                                cpf: lead.id,
                                data_nascimento: lead.id,
                                sexo: lead.id,
                                endereco_rua: lead.id,
                                cidade: lead.id,
                                estado: lead.id,
                                cep: lead.id
                              };
                              setFieldSelection(prev => ({ ...initialFields, ...prev }));
                            }}
                            onClick={(e) => e.stopPropagation()}
                            style={{ cursor: 'pointer' }}
                          />
                          <span style={{ 
                            padding: '4px 10px', 
                            backgroundColor: isOriginal ? '#3b82f6' : '#f59e0b', 
                            color: 'white', 
                            borderRadius: '4px', 
                            fontSize: '11px', 
                            fontWeight: 'bold' 
                          }}>
                            {isOriginal ? 'ORIGINAL' : `DUPLICATA #${idx} - ${lead.matchField || 'CPF/Email/Telefone'}`}
                          </span>
                          
                          {/* Badges de Origem */}
                          {origemBadge.map((badge, bIdx) => (
                            <span key={bIdx} style={{
                              padding: '3px 8px',
                              backgroundColor: badge.color,
                              color: 'white',
                              borderRadius: '3px',
                              fontSize: '10px',
                              fontWeight: 'bold'
                            }}>
                              📍 {badge.name}
                            </span>
                          ))}
                          
                          <strong style={{ fontSize: '15px', color: '#f3f4f6' }}>{lead.nome_completo || 'Sem nome'}</strong>
                          
                          {/* Badge de Pedidos Prime */}
                          {hasPrimePedidos && (
                            <span style={{
                              padding: '3px 8px',
                              backgroundColor: '#10b981',
                              color: 'white',
                              borderRadius: '3px',
                              fontSize: '10px',
                              fontWeight: 'bold'
                            }}>
                              📦 {pedidos.length} Pedido(s) Prime
                            </span>
                          )}
                        </div>

                        {/* Informações Básicas */}
                        <div style={{ 
                          display: 'grid', 
                          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', 
                          gap: '8px', 
                          fontSize: '12px', 
                          marginLeft: '28px',
                          marginBottom: '12px',
                          color: '#e5e7eb'
                        }}>
                          <div><strong style={{ color: '#9ca3af' }}>ID Mestre:</strong> <span style={{ color: '#f3f4f6' }}>{lead.id || '—'}</span></div>
                          <div><strong style={{ color: '#9ca3af' }}>Email:</strong> <span style={{ color: '#f3f4f6' }}>{lead.email || '—'}</span></div>
                          <div><strong style={{ color: '#9ca3af' }}>WhatsApp:</strong> <span style={{ color: '#f3f4f6' }}>{lead.whatsapp || '—'}</span></div>
                          <div><strong style={{ color: '#9ca3af' }}>Telefone:</strong> <span style={{ color: '#f3f4f6' }}>{lead.telefone || '—'}</span></div>
                          <div><strong style={{ color: '#9ca3af' }}>CPF:</strong> <span style={{ color: '#f3f4f6' }}>{lead.cpf || '—'}</span></div>
                          <div><strong style={{ color: '#9ca3af' }}>Data Nasc:</strong> <span style={{ color: '#f3f4f6' }}>{lead.data_nascimento ? new Date(lead.data_nascimento).toLocaleDateString('pt-BR') : '—'}</span></div>
                          <div><strong style={{ color: '#9ca3af' }}>Sexo:</strong> <span style={{ color: '#f3f4f6' }}>{lead.sexo || '—'}</span></div>
                          <div><strong style={{ color: '#9ca3af' }}>ID Prime:</strong> <span style={{ color: '#f3f4f6' }}>{lead.id_prime || '—'}</span></div>
                          <div><strong style={{ color: '#9ca3af' }}>ID Sprinthub:</strong> <span style={{ color: '#f3f4f6' }}>{lead.id_sprinthub || '—'}</span></div>
                          <div><strong style={{ color: '#9ca3af' }}>Criado em:</strong> <span style={{ color: '#f3f4f6' }}>{lead.created_at ? new Date(lead.created_at).toLocaleDateString('pt-BR') : '—'}</span></div>
                        </div>

                        {/* Pedidos Prime */}
                        {hasPrimePedidos && (
                          <div style={{ 
                            marginLeft: '28px', 
                            marginTop: '12px',
                            padding: '10px',
                            backgroundColor: '#064e3b',
                            borderRadius: '6px',
                            border: '1px solid #10b981'
                          }}>
                            <div style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '8px', color: '#34d399' }}>
                              📦 Pedidos no Prime ({pedidos.length}):
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '11px' }}>
                              {pedidos.slice(0, 3).map((pedido, pIdx) => {
                                const isAprovado = pedido.status_aprovacao === 'APROVADO' || pedido.status_geral === 'APROVADO';
                                const isEntregue = pedido.status_entrega === 'ENTREGUE' || pedido.status_geral === 'ENTREGUE';
                                return (
                                  <div key={pIdx} style={{ 
                                    padding: '6px',
                                    backgroundColor: isAprovado || isEntregue ? '#065f46' : '#451a03',
                                    borderRadius: '4px',
                                    color: '#f3f4f6'
                                  }}>
                                    <strong>Pedido #{pedido.id}</strong> - {pedido.status_aprovacao} / {pedido.status_geral} / {pedido.status_entrega}
                                    {pedido.valor_total && <span> - R$ {pedido.valor_total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>}
                                    {pedido.data_criacao && <span style={{ color: '#9ca3af', marginLeft: '8px' }}>
                                      ({new Date(pedido.data_criacao).toLocaleDateString('pt-BR')})
                                    </span>}
                                  </div>
                                );
                              })}
                              {pedidos.length > 3 && (
                                <div style={{ fontSize: '10px', color: '#9ca3af', fontStyle: 'italic' }}>
                                  ... e mais {pedidos.length - 3} pedido(s)
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {loadingPrimeData && idx === 0 && (
                          <div style={{ marginLeft: '28px', fontSize: '11px', color: '#9ca3af', fontStyle: 'italic' }}>
                            Carregando pedidos Prime...
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Seção 2: Seleção de Campos (só aparece se master foi selecionado) */}
              {selectedMasterLead && (
                <div style={{ marginBottom: '24px', padding: '16px', backgroundColor: '#374151', borderRadius: '8px', border: '1px solid #4b5563' }}>
                  <h4 style={{ marginBottom: '12px', fontSize: '14px', fontWeight: 'bold', color: '#f3f4f6' }}>
                    2️⃣ Escolha de qual lead usar cada campo (opcional):
                  </h4>
                  <div style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '12px' }}>
                    Por padrão, todos os campos serão do cliente principal. Selecione outros leads para campos específicos.
                  </div>
                  
                  {['nome_completo', 'email', 'whatsapp', 'telefone', 'cpf', 'data_nascimento', 'sexo', 'endereco_rua', 'cidade', 'estado', 'cep'].map((fieldName) => {
                    const fieldLabel = {
                      'nome_completo': 'Nome Completo',
                      'email': 'Email',
                      'whatsapp': 'WhatsApp',
                      'telefone': 'Telefone',
                      'cpf': 'CPF',
                      'data_nascimento': 'Data de Nascimento',
                      'sexo': 'Sexo',
                      'endereco_rua': 'Endereço (Rua)',
                      'cidade': 'Cidade',
                      'estado': 'Estado',
                      'cep': 'CEP'
                    }[fieldName] || fieldName;

                    const allLeads = [selectedDuplicatesClient, ...(selectedDuplicatesClient.duplicates || [])];
                    const currentSelection = fieldSelection[fieldName] || selectedMasterLead.id;
                    
                    return (
                      <div key={fieldName} style={{ 
                        marginBottom: '10px', 
                        padding: '8px',
                        backgroundColor: '#4b5563',
                        borderRadius: '6px',
                        border: '1px solid #6b7280'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                          <strong style={{ fontSize: '12px', minWidth: '140px', color: '#f3f4f6' }}>{fieldLabel}:</strong>
                          <select
                            value={currentSelection}
                            onChange={(e) => {
                              setFieldSelection(prev => ({ ...prev, [fieldName]: parseInt(e.target.value) }));
                            }}
                            style={{
                              padding: '4px 8px',
                              borderRadius: '4px',
                              border: '1px solid #6b7280',
                              fontSize: '11px',
                              minWidth: '200px',
                              backgroundColor: '#1f2937',
                              color: '#f3f4f6'
                            }}
                          >
                            {allLeads.map((lead) => {
                              const hasValue = lead[fieldName] && lead[fieldName] !== '';
                              return (
                                <option key={lead.id} value={lead.id} disabled={!hasValue}>
                                  {lead === selectedDuplicatesClient ? '[ORIGINAL]' : `[DUP #${allLeads.indexOf(lead)}]`} {lead.nome_completo || lead.id} {hasValue ? `✓ (${lead[fieldName]})` : '✗ (vazio)'}
                                </option>
                              );
                            })}
                          </select>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
                <button
                  className="cc-btn"
                  onClick={() => { 
                    setShowDuplicatesModal(false); 
                    setSelectedDuplicatesClient(null); 
                    setSelectedMasterLead(null); 
                    setFieldSelection({});
                    setPrimePedidosData({});
                  }}
                  style={{
                    backgroundColor: '#6b7280',
                    color: '#f3f4f6'
                  }}
                >
                  Cancelar
                </button>
                <button
                  className="cc-btn"
                  onClick={async () => {
                    if (!selectedMasterLead) {
                      alert('Selecione qual cliente deve ser mantido como principal.');
                      return;
                    }

                    if (!confirm(`Tem certeza que deseja mesclar ${selectedDuplicatesClient.duplicates.length + 1} clientes?\n\nCliente principal: ${selectedMasterLead.nome_completo || 'Sem nome'}\n\nEsta ação NÃO pode ser desfeita!`)) {
                      return;
                    }

                    try {
                      console.log('🔄 Iniciando mesclagem...');
                      const masterId = selectedMasterLead.id;
                      const duplicateIds = [selectedDuplicatesClient.id, ...selectedDuplicatesClient.duplicates.map(d => d.id)]
                        .filter(id => id !== masterId);

                      // Preparar campos JSON baseado na seleção do usuário
                      const allLeads = [selectedDuplicatesClient, ...(selectedDuplicatesClient.duplicates || [])];
                      const fieldsToMerge = {};
                      
                      // Mapear cada campo selecionado
                      Object.entries(fieldSelection).forEach(([fieldName, leadId]) => {
                        const selectedLead = allLeads.find(l => l.id === leadId);
                        if (selectedLead && selectedLead[fieldName] && selectedLead[fieldName] !== '') {
                          // Se o campo vem de outro lead (não do master), incluir no merge
                          if (leadId !== masterId) {
                            if (!fieldsToMerge[leadId]) {
                              fieldsToMerge[leadId] = {};
                            }
                            fieldsToMerge[leadId][fieldName] = selectedLead[fieldName];
                          }
                        }
                      });

                      console.log('Master ID:', masterId);
                      console.log('IDs a mesclar:', duplicateIds);
                      console.log('Campos selecionados para merge:', fieldsToMerge);

                      // Chamar RPC do Supabase para mesclagem
                      const { data, error } = await supabase
                        .schema('api')
                        .rpc('merge_cliente', {
                          master_id: masterId,
                          loser_ids: duplicateIds,
                          fields_json: fieldsToMerge,
                          executed_by: user?.id ? String(user.id) : 'sistema'
                        });

                      if (error) {
                        console.error('Erro na mesclagem:', error);
                        alert(`Erro ao mesclar clientes: ${error.message}`);
                        return;
                      }

                      alert(`✅ Clientes mesclados com sucesso!\n\nCliente principal: ${selectedMasterLead.nome_completo}\n${duplicateIds.length} duplicata(s) mesclada(s).`);

                      // Limpar estados e recarregar dados
                      setShowDuplicatesModal(false);
                      setSelectedDuplicatesClient(null);
                      setSelectedMasterLead(null);
                      setFieldSelection({});
                      setPrimePedidosData({});
                      setDuplicatesData(prev => {
                        const newData = { ...prev };
                        delete newData[selectedDuplicatesClient.id];
                        duplicateIds.forEach(id => delete newData[id]);
                        return newData;
                      });

                      loadTabData(); // Recarregar dados da tabela
                    } catch (error) {
                      console.error('Erro ao mesclar:', error);
                      alert(`Erro inesperado: ${error.message}`);
                    }
                  }}
                  disabled={!selectedMasterLead}
                  style={{
                    backgroundColor: selectedMasterLead ? '#3b82f6' : '#6b7280',
                    color: '#f3f4f6',
                    cursor: selectedMasterLead ? 'pointer' : 'not-allowed'
                  }}
                >
                  ✅ Mesclar Clientes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de envio para SprintHub */}
      {showSprinthubModal && (
        <div className="cc-modal-overlay" onClick={closeSprinthubModal}>
          <div className="cc-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Enviar Selecionados para SprintHub</h3>

            <p style={{ marginBottom: '12px' }}>
              {sprinthubResults.length > 0 || selectedRows.length > 0
                ? `Você enviará ${sprinthubResults.length > 0 ? sprinthubResults.length : selectedRows.length} registro(s) para a SprintHub.`
                : 'Nenhum registro atualmente selecionado.'}
            </p>

            {sprinthubError && (
              <div
                style={{
                  backgroundColor: '#fee2e2',
                  color: '#b91c1c',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  marginBottom: '12px',
                }}
              >
                {sprinthubError}
              </div>
            )}

            {sprinthubResults.length === 0 && (
              <>
                <div
                  style={{
                    display: 'grid',
                    gap: '12px',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                    marginBottom: '16px',
                  }}
                >
                  <label className="cc-field">
                    <span>Funil (ID)</span>
                    <input
                      type="number"
                      className="cc-input"
                      value={sprinthubFunnelId}
                      onChange={(e) => setSprinthubFunnelId(e.target.value)}
                      placeholder={SPRINTHUB_CONFIG.defaultFunnelId || 'Ex: 56'}
                    />
                  </label>
                  <label className="cc-field">
                    <span>Coluna/Etapa (ID)</span>
                    <input
                      type="number"
                      className="cc-input"
                      value={sprinthubEtapa}
                      onChange={(e) => setSprinthubEtapa(e.target.value)}
                      placeholder={SPRINTHUB_CONFIG.defaultColumnId || 'Ex: 159'}
                    />
                  </label>
                  <label className="cc-field">
                    <span>Sequência</span>
                    <input
                      type="number"
                      className="cc-input"
                      value={sprinthubSequence}
                      onChange={(e) => setSprinthubSequence(e.target.value)}
                    />
                  </label>
                  <label className="cc-field">
                    <span>Tamanho do lote</span>
                    <input
                      type="number"
                      min={1}
                      className="cc-input"
                      value={sprinthubBatchSize}
                      onChange={(e) => setSprinthubBatchSize(e.target.value)}
                    />
                    <small style={{ color: '#94a3b8' }}>Quantidade de leads enviados por vez (padrão 50)</small>
                  </label>
                  <label className="cc-field">
                    <span>ID do Vendedor</span>
                    <input
                      type="number"
                      className="cc-input"
                      value={sprinthubVendedor}
                      onChange={(e) => setSprinthubVendedor(e.target.value)}
                    />
                  </label>
                </div>

                <label className="cc-field" style={{ display: 'block', marginBottom: '16px' }}>
                  <span>Prefixo do título da oportunidade</span>
                  <input
                    type="text"
                    className="cc-input"
                    value={sprinthubTituloPrefix}
                    onChange={(e) => setSprinthubTituloPrefix(e.target.value)}
                    placeholder="Ex: MONITORAMENTO"
                  />
                </label>

                <label className="cc-field" style={{ display: 'block', marginBottom: '16px' }}>
                  <span>Origem da Oportunidade</span>
                  <select
                    className="cc-input"
                    value={sprinthubOrigemOportunidade}
                    onChange={(e) => setSprinthubOrigemOportunidade(e.target.value)}
                    style={{ width: '100%', padding: '8px', borderRadius: '4px', backgroundColor: '#1e293b', color: '#fff', border: '1px solid #334155' }}
                  >
                    <option value="Monitoramento">Monitoramento</option>
                    <option value="Google Ads">Google Ads</option>
                    <option value="Meta Ads">Meta Ads</option>
                    <option value="Orgânico">Orgânico</option>
                    <option value="Indicação">Indicação</option>
                    <option value="Prescritor">Prescritor</option>
                    <option value="Campanha">Campanha</option>
                    <option value="Colaborador">Colaborador</option>
                    <option value="Franquia">Franquia</option>
                    <option value="Farmácia Parceira">Farmácia Parceira</option>
                    <option value="Monitoramento/disparo">Monitoramento/disparo</option>
                    <option value="Site">Site</option>
                    <option value="Phusion/disparo">Phusion/disparo</option>
                    <option value="Disparo">Disparo</option>
                    <option value="Reativação">Reativação</option>
                  </select>
                </label>

                <label className="cc-field" style={{ display: 'block', marginBottom: '16px' }}>
                  <span>Tipo de Compra</span>
                  <select
                    className="cc-input"
                    value={sprinthubTipoCompra}
                    onChange={(e) => setSprinthubTipoCompra(e.target.value)}
                    style={{ width: '100%', padding: '8px', borderRadius: '4px', backgroundColor: '#1e293b', color: '#fff', border: '1px solid #334155' }}
                  >
                    <option value="recompra monitoramento">recompra monitoramento</option>
                    <option value="compra">compra</option>
                    <option value="recompra">recompra</option>
                    <option value="reativação">reativação</option>
                    <option value="ativação">ativação</option>
                  </select>
                </label>

                {isSendingToSprinthub && (
                  <div style={{ marginBottom: '12px', color: '#2563eb' }}>
                    Enviando dados para a SprintHub. Aguarde...
                  </div>
                )}
                {sprinthubProgress && (
                  <div style={{ marginBottom: '16px', padding: '12px', borderRadius: '8px', backgroundColor: '#0f172a', border: '1px solid rgba(37, 99, 235, 0.4)' }}>
                    <div style={{ fontWeight: 600, color: '#60a5fa', marginBottom: '8px' }}>
                      Processando lote {sprinthubProgress.currentBatch}/{sprinthubProgress.totalBatches}
                    </div>
                    <div style={{ fontSize: '13px', color: '#cbd5f5', marginBottom: '6px' }}>
                      Leads processados: {sprinthubProgress.processed} / {sprinthubProgress.totalLeads}
                    </div>
                    <div style={{ fontSize: '13px', color: '#cbd5f5', marginBottom: '6px' }}>
                      Lote atual: {sprinthubProgress.batchProcessed || 0} / {sprinthubProgress.batchSize}
                    </div>
                    {sprinthubProgress.currentLeadName && (
                      <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '6px' }}>
                        Lead atual: {sprinthubProgress.currentLeadName}
                      </div>
                    )}
                    <div style={{ width: '100%', height: '10px', backgroundColor: '#1e293b', borderRadius: '999px', overflow: 'hidden' }}>
                      <div
                        style={{
                          width: `${Math.min(100, Math.round((sprinthubProgress.processed / sprinthubProgress.totalLeads) * 100))}%`,
                          height: '100%',
                          background: 'linear-gradient(90deg, #3b82f6, #a855f7)',
                        }}
                      />
                    </div>
                  </div>
                )}
              </>
            )}

            {sprinthubResults.length > 0 && (
              <>
                <div style={{ 
                  backgroundColor: '#1e293b', 
                  padding: '12px', 
                  borderRadius: '8px', 
                  marginBottom: '12px',
                  border: '1px solid rgba(59, 130, 246, 0.3)'
                }}>
                  <div style={{ fontWeight: 600, marginBottom: '8px', color: '#60a5fa' }}>
                    ✅ Envio Concluído
                  </div>
                  <div style={{ fontSize: '12px', color: '#cbd5f5', lineHeight: '1.6' }}>
                    <div>📊 Total processado: {sprinthubResults.length} registro(s)</div>
                    <div>✅ Sucessos: {sprinthubResults.filter(r => r.ensureResult?.lead?.id && !r.ensureResult?.errors?.length).length}</div>
                    <div>❌ Erros: {sprinthubResults.filter(r => r.ensureResult?.errors?.length).length}</div>
                  </div>
                </div>
                <div style={{ maxHeight: '320px', overflowY: 'auto', marginTop: '8px', marginBottom: '16px' }}>
                  {sprinthubResults.map((result, index) => {
                    const leadId = result.ensureResult?.lead?.id;
                    const leadStatus = result.ensureResult?.lead?.status;
                    const opportunityStatus = result.ensureResult?.opportunity?.status;
                    const opportunityId = result.ensureResult?.opportunity?.id;
                    const ordersSummary = result.ensureResult?.orders || [];
                    const errors = result.ensureResult?.errors || [];
                    const hasError = errors.length > 0;
                    const isSuccess = leadId && !hasError;

                    return (
                      <div
                        key={`${result.id || index}-${index}`}
                        style={{
                          border: `1px solid ${hasError ? 'rgba(248, 113, 113, 0.3)' : isSuccess ? 'rgba(34, 197, 94, 0.3)' : 'rgba(148, 163, 184, 0.3)'}`,
                          borderRadius: '8px',
                          padding: '12px',
                          marginBottom: '12px',
                          backgroundColor: '#0f172a',
                        }}
                      >
                        <div style={{ fontWeight: 600, marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {isSuccess ? '✅' : hasError ? '❌' : '⚠️'} {result.nome}
                        </div>
                        <div style={{ fontSize: '12px', color: '#cbd5f5' }}>
                          <div>
                            Lead ID SprintHub: <strong style={{ color: isSuccess ? '#22c55e' : '#f87171' }}>
                              {leadId ? leadId : 'Não criado'}
                            </strong>
                            {leadStatus && ` (${leadStatus === 'created' ? 'Criado' : 'Atualizado'})`}
                          </div>
                          <div>
                            Oportunidade:{' '}
                            {opportunityStatus === 'already-exists' ? (
                              <span style={{ color: '#fbbf24' }}>⚠️ Já existia (ID: {opportunityId || 'N/A'})</span>
                            ) : opportunityId ? (
                              <span style={{ color: '#22c55e' }}>✅ Criada (ID: {opportunityId})</span>
                            ) : (
                              <span style={{ color: '#f87171' }}>❌ Não criada</span>
                            )}
                          </div>
                          {ordersSummary.length > 0 && (
                            <div>
                              Pedidos sincronizados:{' '}
                              {ordersSummary.filter(item => item.status === 'synced').length}
                              {ordersSummary.some(item => item.status === 'skipped') && (
                                <> (alguns já estavam sincronizados)</>
                              )}
                            </div>
                          )}
                          {errors.length > 0 && (
                            <div style={{ color: '#f87171', marginTop: '6px', padding: '6px', backgroundColor: 'rgba(248, 113, 113, 0.1)', borderRadius: '4px' }}>
                              <strong>Erros:</strong> {errors.map(err => err.message || 'Erro desconhecido').join(' | ')}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              {sprinthubResults.length === 0 ? (
                <>
                  <button className="cc-btn" onClick={closeSprinthubModal} disabled={isSendingToSprinthub}>
                    Cancelar
                  </button>
                  <button
                    className="cc-btn cc-btn-primary"
                    onClick={handleSprinthubConfirm}
                    disabled={isSendingToSprinthub || selectedRows.length === 0}
                  >
                    {isSendingToSprinthub ? 'Enviando...' : 'Enviar agora'}
                  </button>
                </>
              ) : (
                <button className="cc-btn cc-btn-primary" onClick={closeSprinthubModal}>
                  Fechar
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal de Configuração de Envio Automático */}
      {showAutoSyncConfig && (
        <div className="cc-modal-overlay" onClick={() => setShowAutoSyncConfig(false)}>
          <div className="cc-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <h3>⚙️ Configuração de Envio Automático</h3>
            <p style={{ marginBottom: '16px', color: '#94a3b8', fontSize: '13px' }}>
              Configure os parâmetros para o envio automático diário de leads para o SprintHub.
            </p>

            <div style={{ display: 'grid', gap: '12px', marginBottom: '16px' }}>
              <label className="cc-field">
                <span>Funil (ID)</span>
                <input
                  type="number"
                  className="cc-input"
                  value={sprinthubFunnelId}
                  onChange={(e) => setSprinthubFunnelId(e.target.value)}
                  placeholder={SPRINTHUB_CONFIG.defaultFunnelId || 'Ex: 14'}
                />
              </label>
              <label className="cc-field">
                <span>Coluna/Etapa (ID)</span>
                <input
                  type="number"
                  className="cc-input"
                  value={sprinthubEtapa}
                  onChange={(e) => setSprinthubEtapa(e.target.value)}
                  placeholder={SPRINTHUB_CONFIG.defaultColumnId || 'Ex: 167'}
                />
              </label>
              <label className="cc-field">
                <span>ID do Vendedor</span>
                <input
                  type="number"
                  className="cc-input"
                  value={sprinthubVendedor}
                  onChange={(e) => setSprinthubVendedor(e.target.value)}
                  placeholder={SPRINTHUB_CONFIG.defaultUserId || 'Ex: 229'}
                />
              </label>
              <label className="cc-field">
                <span>Limite de Leads por Execução</span>
                <input
                  type="number"
                  className="cc-input"
                  value={autoSyncLimit}
                  onChange={(e) => setAutoSyncLimit(e.target.value)}
                  placeholder="200"
                />
                <small style={{ color: '#94a3b8' }}>Quantidade máxima de leads processados por execução do cron</small>
              </label>
              <label className="cc-field">
                <span>Tamanho do Lote</span>
                <input
                  type="number"
                  className="cc-input"
                  value={sprinthubBatchSize}
                  onChange={(e) => setSprinthubBatchSize(e.target.value)}
                  placeholder="50"
                />
                <small style={{ color: '#94a3b8' }}>Quantidade de leads enviados por vez (evita timeouts)</small>
              </label>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button className="cc-btn" onClick={() => setShowAutoSyncConfig(false)}>
                Cancelar
              </button>
              <button 
                className="cc-btn cc-btn-primary" 
                onClick={() => {
                  alert('Configuração salva! (Funcionalidade de salvamento será implementada)');
                  setShowAutoSyncConfig(false);
                }}
                style={{ backgroundColor: '#10b981' }}
              >
                💾 Salvar Configuração
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Histórico de Exportação */}
      {showExportHistoryModal && selectedClientForHistory && (
        <div className="cc-modal-overlay" onClick={() => {
          setShowExportHistoryModal(false);
        }}>
          <div className="cc-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '800px', width: '90%' }}>
            <div className="cc-modal-header">
              <h3>Histórico de Exportação</h3>
              <button
                className="cc-btn-close"
                onClick={() => {
                  setShowExportHistoryModal(false);
                }}
                style={{ background: 'transparent', border: 'none', color: '#e0e7ff', cursor: 'pointer', fontSize: '24px', padding: '0', width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                ×
              </button>
            </div>
            <div style={{ marginBottom: '16px', color: '#94a3b8' }}>
              <div><strong>Cliente:</strong> {selectedClientForHistory.nome || 'Sem nome'}</div>
              <div><strong>ID:</strong> {selectedClientForHistory.id}</div>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table className="cc-table">
                <thead>
                  <tr>
                    <th>Data</th>
                    <th>Motivo</th>
                    <th>Tag</th>
                    <th>Observação</th>
                    <th>Usuário</th>
                  </tr>
                </thead>
                <tbody>
                  {clientExportHistory.map((hist, index) => (
                    <tr key={index}>
                      <td>{new Date(hist.data_exportacao || hist.created_at).toLocaleString('pt-BR')}</td>
                      <td>{hist.motivo || '-'}</td>
                      <td>{hist.tag_exportacao || '-'}</td>
                      <td>{hist.observacao || '-'}</td>
                      <td>{hist.usuario_id || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {clientExportHistory.length === 0 && (
                <div style={{ padding: '16px', textAlign: 'center', color: '#94a3b8' }}>
                  Nenhum histórico disponível.
                </div>
              )}
            </div>
            <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
              <button className="cc-btn" onClick={() => {
                setShowExportHistoryModal(false);
              }}>
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Histórico SprintHub */}
      {showSprinthubHistoryModal && selectedClientForHistory && (
        <div
          className="cc-modal-overlay"
          onClick={() => {
            setShowSprinthubHistoryModal(false);
            setSprinthubHistory([]);
          }}
        >
          <div className="cc-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '800px', width: '90%' }}>
            <div className="cc-modal-header">
              <h3>Histórico SprintHub</h3>
              <button
                className="cc-btn-close"
                onClick={() => {
                  setShowSprinthubHistoryModal(false);
                  setSprinthubHistory([]);
                }}
                style={{ background: 'transparent', border: 'none', color: '#e0e7ff', cursor: 'pointer', fontSize: '24px', padding: '0', width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                ×
              </button>
            </div>
            <div style={{ marginBottom: '16px', color: '#94a3b8' }}>
              <div><strong>Cliente:</strong> {selectedClientForHistory.nome}</div>
              <div><strong>ID:</strong> {selectedClientForHistory.id}</div>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table className="cc-table">
                <thead>
                  <tr>
                    <th>Data</th>
                    <th>Motivo</th>
                    <th>Tag</th>
                    <th>Observação</th>
                    <th>Usuário</th>
                  </tr>
                </thead>
                <tbody>
                  {sprinthubHistory.map((hist, index) => (
                    <tr key={index}>
                      <td>{new Date(hist.data_exportacao || hist.created_at).toLocaleString('pt-BR')}</td>
                      <td>{hist.motivo || '-'}</td>
                      <td>
                        <span style={{ padding: '4px 8px', backgroundColor: '#7c3aed26', color: '#c084fc', borderRadius: '999px', fontWeight: '600', fontSize: '11px' }}>
                          {formatSprinthubTagLabel(hist.tag_exportacao) || 'SPRINTHUB'}
                        </span>
                      </td>
                      <td>{hist.observacao || '-'}</td>
                      <td>{hist.usuario_id || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {sprinthubHistory.length === 0 && (
                <div style={{ padding: '16px', textAlign: 'center', color: '#94a3b8' }}>
                  Nenhum histórico disponível para SprintHub.
                </div>
              )}
            </div>
            <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
              <button className="cc-btn" onClick={() => {
                setShowSprinthubHistoryModal(false);
                setSprinthubHistory([]);
              }}>
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientesConsolidadosPage;
