import React, { useState, useEffect } from 'react';
import './DashboardPage.css';
import './ClientesConsolidados.css';
import FilterBar from '../components/FilterBar';
import TopMenuBar from '../components/TopMenuBar';
import Sidebar from '../components/Sidebar';
import { translations } from '../data/translations';
import { supabase } from '../service/supabase';
import { updateMarketData } from '../utils/utils';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const ClientesConsolidadosPage = ({ onLogout }) => {
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
  const [ativacaoPrimeData, setAtivacaoPrimeData] = useState([]);
  const [ativacaoForaPrimeData, setAtivacaoForaPrimeData] = useState([]);
  const [ativacaoComOrcamentoData, setAtivacaoComOrcamentoData] = useState([]);
  const [ativacaoSemOrcamentoData, setAtivacaoSemOrcamentoData] = useState([]);
  
  // Estados de Reativação (90+ dias)
  const [reativacaoGeralData, setReativacaoGeralData] = useState([]);
  const [reativacao1xData, setReativacao1xData] = useState([]);
  const [reativacao2xData, setReativacao2xData] = useState([]);
  const [reativacao3xData, setReativacao3xData] = useState([]);
  const [reativacao3xPlusData, setReativacao3xPlusData] = useState([]);
  
  // Estados de Monitoramento (0-90 dias)
  const [monitoramentoGeralData, setMonitoramentoGeralData] = useState([]);
  const [monitoramento129Data, setMonitoramento129Data] = useState([]);
  const [monitoramento3059Data, setMonitoramento3059Data] = useState([]);
  const [monitoramento6090Data, setMonitoramento6090Data] = useState([]);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(100);
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
  const [validatedNames, setValidatedNames] = useState({}); // {clienteId: nome_validado}
  const [showNameModal, setShowNameModal] = useState(false);
  const [selectedClientForName, setSelectedClientForName] = useState(null);

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

  // Carregar dados ao mudar de aba
  useEffect(() => {
    setCurrentPage(1); // Reset página
    // Ordenação padrão por nome nas páginas de Ativação com lista
    const ativacaoListTabs = ['ativacao-prime', 'ativacao-fora-prime', 'ativacao-com-orcamento', 'ativacao-sem-orcamento'];
    if (ativacaoListTabs.includes(activeTab)) {
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
    // Carrega DDDs disponíveis (coletados por amostragem das visões de ativação)
    if (ativacaoListTabs.includes(activeTab)) {
      loadAvailableDDDs();
    } else {
      setDddOptions([]);
    }
    loadTabData();
  }, [activeTab]);

  // Recarregar quando mudar página ou tamanho da página (para abas com paginação)
  useEffect(() => {
    loadTabData();
    setSelectedRows([]);
    setLastClickedIndex(null);
  }, [currentPage, itemsPerPage, sortField, sortDirection]);

  // Carregar histórico de exportação quando dados mudarem
  useEffect(() => {
    const loadHistory = async () => {
      const ativacaoTabs = ['ativacao-prime', 'ativacao-fora-prime', 'ativacao-com-orcamento', 'ativacao-sem-orcamento'];
      if (!ativacaoTabs.includes(activeTab)) return;
      
      let data = [];
      switch (activeTab) {
        case 'ativacao-prime': data = ativacaoPrimeData; break;
        case 'ativacao-fora-prime': data = ativacaoForaPrimeData; break;
        case 'ativacao-com-orcamento': data = ativacaoComOrcamentoData; break;
        case 'ativacao-sem-orcamento': data = ativacaoSemOrcamentoData; break;
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
  }, [ativacaoPrimeData, ativacaoForaPrimeData, ativacaoComOrcamentoData, ativacaoSemOrcamentoData, activeTab]);

  // ===== APLICAÇÃO DE FILTROS NAS CONSULTAS =====
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
    return rows.filter(r => (r.endereco || r.endereco_completo || r.logradouro) && String(r.endereco || r.endereco_completo || r.logradouro).trim() !== '');
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
      const views = ['vw_inativos_prime', 'vw_inativos_fora_prime', 'vw_inativos_com_orcamento', 'vw_inativos_sem_orcamento'];
      const requests = views.map(v => supabase.from(v).select('whatsapp,telefone').limit(limit));
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
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // ===== FUNÇÕES DE CARREGAMENTO =====

  const loadDashboard = async () => {
    const { data } = await supabase.from('dashboard_principal').select('*');
    setDashboardData(data || []);
  };

  const loadDashboardSprint = async () => {
    const { data } = await supabase.from('dashboard_sprint').select('*').single();
    setDashboardSprintData(data);
  };

  const loadDashboardPrime = async () => {
    const { data } = await supabase.from('dashboard_prime').select('*').single();
    setDashboardPrimeData(data);
  };

  const loadCompletude = async () => {
    const { data } = await supabase.from('stats_completude_dados').select('*').single();
    setCompletudeData(data);
  };

  const loadOrigens = async () => {
    const { data } = await supabase.from('stats_por_origem').select('*').single();
    setOrigensData(data);
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
    const { data, count } = await supabase
      .from('relatorio_duplicados')
      .select('*', { count: 'exact' })
      .range(start, end);
    setDuplicadosData(data || []);
    setTotalCount(count || 0);
  };

  const loadQualidade = async () => {
    const { data } = await supabase.from('relatorio_qualidade').select('*');
    setQualidadeData(data || []);
  };

  const loadBaixaQualidade = async () => {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage - 1;
    const { data, count } = await supabase
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
    const { data } = await supabase.from('relatorio_executivo').select('*');
    setExecutivoData(data || []);
  };

  // ===== FUNÇÕES DE CARREGAMENTO - GESTÃO DE CLIENTES =====

  const loadDashboardGestao = async () => {
    const { data } = await supabase.from('vw_dashboard_reativacao').select('*').single();
    setDashboardGestaoData(data);
  };

  const loadValidacaoIntegridade = async () => {
    const { data } = await supabase.from('vw_validacao_integridade').select('*');
    setValidacaoIntegridadeData(data || []);
  };

  // ===== FUNÇÕES DE CARREGAMENTO - ATIVAÇÃO (NUNCA COMPRARAM) =====

  const loadAtivacaoGeral = async () => {
    const { data } = await supabase.from('vw_dashboard_reativacao').select('*').single();
    setAtivacaoGeralData(data);
  };

  const loadAtivacaoPrime = async () => {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage - 1;
    let query = supabase
      .from('vw_inativos_prime')
      .select('*', { count: 'exact' });
    query = applyFiltersToQuery(query);
    if (sortField) {
      query = query.order(sortField, { ascending: sortDirection === 'asc' });
    }
    const { data, count } = await query.range(start, end);
    setAtivacaoPrimeData(filterClientSideIfNeeded(data || []));
    setTotalCount(count || 0);
  };

  const loadAtivacaoForaPrime = async () => {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage - 1;
    let query = supabase
      .from('vw_inativos_fora_prime')
      .select('*', { count: 'exact' });
    query = applyFiltersToQuery(query);
    if (sortField) {
      query = query.order(sortField, { ascending: sortDirection === 'asc' });
    }
    const { data, count } = await query.range(start, end);
    setAtivacaoForaPrimeData(filterClientSideIfNeeded(data || []));
    setTotalCount(count || 0);
  };

  const loadAtivacaoComOrcamento = async () => {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage - 1;
    let query = supabase
      .from('vw_inativos_com_orcamento')
      .select('*', { count: 'exact' });
    query = applyFiltersToQuery(query);
    if (sortField) {
      query = query.order(sortField, { ascending: sortDirection === 'asc' });
    }
    const { data, count } = await query.range(start, end);
    setAtivacaoComOrcamentoData(filterClientSideIfNeeded(data || []));
    setTotalCount(count || 0);
  };

  const loadAtivacaoSemOrcamento = async () => {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage - 1;
    let query = supabase
      .from('vw_inativos_sem_orcamento')
      .select('*', { count: 'exact' });
    query = applyFiltersToQuery(query);
    if (sortField) {
      query = query.order(sortField, { ascending: sortDirection === 'asc' });
    }
    const { data, count } = await query.range(start, end);
    setAtivacaoSemOrcamentoData(filterClientSideIfNeeded(data || []));
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
                setCurrentPage(1);
                loadTabData();
              }}>Limpar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderExportStatusIcon = (row) => {
    const leadId = row.id || row.id_lead || row.id_cliente;
    if (!leadId) return null;
    
    const history = exportHistory[leadId];
    if (!history || history.length === 0) return null;
    
    const total = history.length;
    const ultima = history[0];
    const tooltip = `Exportado ${total}x\nÚltimo: ${ultima.motivo} - ${new Date(ultima.data_exportacao).toLocaleDateString('pt-BR')}\n${ultima.observacao || ''}`;
    
    return (
      <span 
        className="cc-export-icon" 
        title={tooltip}
        style={{ cursor: 'help', fontSize: '16px' }}
      >
        ✅
      </span>
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
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage - 1;
    const { data, count } = await supabase
      .from('vw_para_reativacao')
      .select('*', { count: 'exact' })
      .range(start, end);
    setReativacaoGeralData(data || []);
    setTotalCount(count || 0);
  };

  const loadReativacao1x = async () => {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage - 1;
    const { data, count } = await supabase
      .from('vw_reativacao_1x')
      .select('*', { count: 'exact' })
      .range(start, end);
    setReativacao1xData(data || []);
    setTotalCount(count || 0);
  };

  const loadReativacao2x = async () => {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage - 1;
    const { data, count } = await supabase
      .from('vw_reativacao_2x')
      .select('*', { count: 'exact' })
      .range(start, end);
    setReativacao2xData(data || []);
    setTotalCount(count || 0);
  };

  const loadReativacao3x = async () => {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage - 1;
    const { data, count } = await supabase
      .from('vw_reativacao_3x')
      .select('*', { count: 'exact' })
      .range(start, end);
    setReativacao3xData(data || []);
    setTotalCount(count || 0);
  };

  const loadReativacao3xPlus = async () => {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage - 1;
    const { data, count } = await supabase
      .from('vw_reativacao_3x_plus')
      .select('*', { count: 'exact' })
      .range(start, end);
    setReativacao3xPlusData(data || []);
    setTotalCount(count || 0);
  };

  const loadMonitoramentoGeral = async () => {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage - 1;
    const { data, count } = await supabase
      .from('vw_para_monitoramento')
      .select('*', { count: 'exact' })
      .range(start, end);
    setMonitoramentoGeralData(data || []);
    setTotalCount(count || 0);
  };

  const loadMonitoramento129 = async () => {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage - 1;
    const { data, count } = await supabase
      .from('vw_monitoramento_1_29_dias')
      .select('*', { count: 'exact' })
      .range(start, end);
    setMonitoramento129Data(data || []);
    setTotalCount(count || 0);
  };

  const loadMonitoramento3059 = async () => {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage - 1;
    const { data, count } = await supabase
      .from('vw_monitoramento_30_59_dias')
      .select('*', { count: 'exact' })
      .range(start, end);
    setMonitoramento3059Data(data || []);
    setTotalCount(count || 0);
  };

  const loadMonitoramento6090 = async () => {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage - 1;
    const { data, count } = await supabase
      .from('vw_monitoramento_60_90_dias')
      .select('*', { count: 'exact' })
      .range(start, end);
    setMonitoramento6090Data(data || []);
    setTotalCount(count || 0);
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
  const loadExportHistory = async (leadIds) => {
    if (!leadIds || leadIds.length === 0) return {};
    try {
      const { data } = await supabase
        .schema('api')
        .from('historico_exportacoes')
        .select('*')
        .in('id_lead', leadIds)
        .order('data_exportacao', { ascending: false });
      
      if (!data) return {};
      
      const history = {};
      leadIds.forEach(id => {
        const exports = data.filter(e => e.id_lead === id);
        if (exports.length > 0) {
          history[id] = exports;
        }
      });
      return history;
    } catch (error) {
      console.error('Erro ao carregar histórico de exportação:', error);
      return {};
    }
  };

  const registerExport = async (leadIds, motivo, observacao) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const userId = user?.id || null;
      
      const records = leadIds.map(id_lead => ({
        id_lead,
        motivo,
        observacao: observacao.trim() || null,
        usuario_id: userId
      }));
      
      const { error } = await supabase
        .schema('api')
        .from('historico_exportacoes')
        .insert(records);
      
      if (error) throw error;
      
      // Atualizar histórico local
      const newHistory = await loadExportHistory(leadIds);
      setExportHistory(prev => ({ ...prev, ...newHistory }));
    } catch (error) {
      console.error('Erro ao registrar exportação:', error);
      alert('Erro ao registrar exportação no histórico.');
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
    const headers = Object.keys(rows[0] || {});
    
    if (exportFormat === 'json') {
      downloadBlob(JSON.stringify(rows, null, 2), `${baseName}.json`, 'application/json;charset=utf-8;');
      return;
    }
    
    if (exportFormat === 'csv') {
      const csvRows = [headers.join(','), ...rows.map(r => headers.map(h => {
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
        const ws = XLSX.utils.json_to_sheet(rows);
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
        const ws = XLSX.utils.json_to_sheet(rows);
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
        const tableData = rows.map(r => headers.map(h => {
          const val = r[h];
          if (val == null) return '';
          if (val instanceof Date) return val.toLocaleDateString('pt-BR');
          return String(val);
        }));
        doc.autoTable({
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
      default: data = []; break;
    }
    const selected = getSelectedRowsFrom(data);
    const leadIds = selected.map(row => row.id || row.id_lead || row.id_cliente).filter(Boolean);
    
    // Registrar exportação
    if (leadIds.length > 0) {
      await registerExport(leadIds, exportMotivo, exportObservacao);
    }
    
    // Fazer exportação real
    exportSelected(selected, `ativacao_export_${new Date().toISOString().split('T')[0]}`);
    
    // Fechar modal e limpar
    setShowExportModal(false);
    setExportObservacao('');
    setSelectedRows([]);
  };

  const exportAllFromTable = async (baseName, tableName) => {
    try {
      setIsLoading(true);
      const { data } = await supabase.from(tableName).select('*');
      exportSelected(data || [], baseName);
    } catch (e) {
      console.error('Erro ao exportar tudo:', e);
      alert('Erro ao exportar.');
    } finally {
      setIsLoading(false);
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
      const updates = { ...editFields, data_ultima_atualizacao: new Date().toISOString() };
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
        { key: 'monitoramento-60-90', icon: '🟠', label: '60-90 dias', description: 'Compraram há 60-90 dias' }
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
    const totalPages = Math.ceil(totalCount / itemsPerPage);
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
          Página {currentPage} de {totalPages} | Total: {totalCount.toLocaleString()}
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
          {data.map((row, idx) => (
            <tr key={idx}>
              <td>
                <input
                  type="checkbox"
                  checked={selectedRows.includes(idx)}
                  onChange={(e) => {
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
                <td key={colIdx}>
                  {col.render ? col.render(row) : (row[col.field] ?? '-')}
                </td>
              ))}
            </tr>
          ))}
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
      <div className="cc-list-header">
        <h2>🔄 Clientes em Múltiplas Origens</h2>
        <button
          className="cc-btn cc-btn-export"
          onClick={() => exportToCSV('duplicados', 'relatorio_duplicados')}
          disabled={isLoading}
        >
          📥 Exportar CSV
        </button>
      </div>

      {renderClientesTable(duplicadosData, [
        { header: 'Nome', field: 'nome_completo' },
        { header: 'Email', field: 'email' },
        { header: 'WhatsApp', field: 'whatsapp' },
        { header: 'Nº Origens', field: 'num_origens' },
        { header: 'Sprint', field: 'no_sprint' },
        { header: 'Prime', field: 'no_prime' },
        { header: 'GreatPage', field: 'no_greatpage' },
        { header: 'BlackLabs', field: 'no_blacklabs' },
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
      <div className="cc-dashboard-grid">
        <div className="cc-card cc-card-highlight">
          <h2>🚀 Dashboard Ativação</h2>
          <div className="cc-stat-big">
            <span className="cc-stat-label">Total Nunca Compraram</span>
            <span className="cc-stat-value-large">{ativacaoGeralData.total_inativos?.toLocaleString()}</span>
          </div>
        </div>
        <div className="cc-card">
          <h3>🏢 No Prime</h3>
          <div className="cc-stat-value-large">{ativacaoGeralData.inativos_prime?.toLocaleString()}</div>
          <button className="cc-btn cc-btn-primary" onClick={() => setActiveTab('ativacao-prime')}>Ver Lista</button>
        </div>
        <div className="cc-card">
          <h3>🚫 Fora do Prime</h3>
          <div className="cc-stat-value-large">{ativacaoGeralData.inativos_fora_prime?.toLocaleString()}</div>
          <button className="cc-btn cc-btn-primary" onClick={() => setActiveTab('ativacao-fora-prime')}>Ver Lista</button>
        </div>
        <div className="cc-card">
          <h3>📋 Com Orçamento</h3>
          <div className="cc-stat-value-large">{ativacaoGeralData.com_orcamento?.toLocaleString()}</div>
          <button className="cc-btn cc-btn-primary" onClick={() => setActiveTab('ativacao-com-orcamento')}>Ver Lista</button>
        </div>
        <div className="cc-card">
          <h3>📭 Sem Orçamento</h3>
          <div className="cc-stat-value-large">{ativacaoGeralData.sem_orcamento?.toLocaleString()}</div>
          <button className="cc-btn cc-btn-primary" onClick={() => setActiveTab('ativacao-sem-orcamento')}>Ver Lista</button>
        </div>
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
    );
  };

  const renderAtivacaoPrime = () => (
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
      {renderClientesTable(filterRowsByNameStatus(ativacaoPrimeData), [
        { header: 'Exportado', render: (row) => renderExportStatusIcon(row) },
        { header: 'Nome', render: (row) => (
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
        { header: 'Sexo', field: 'sexo' },
        { header: 'Data Nascimento', field: 'data_nascimento', render: (row) => row.data_nascimento ? new Date(row.data_nascimento).toLocaleDateString('pt-BR') : '-' },
        { header: 'Qualidade', sortField: 'qualidade_dados', render: (row) => <span className={`cc-quality-badge cc-quality-${row.qualidade_dados >= 80 ? 'high' : row.qualidade_dados >= 60 ? 'medium' : 'low'}`}>{row.qualidade_dados}/100</span> }
      ])}
      {renderPagination()}
    </div>
  );

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
      {renderClientesTable(filterRowsByNameStatus(ativacaoForaPrimeData), [
        { header: 'Exportado', render: (row) => renderExportStatusIcon(row) },
        { header: 'Nome', render: (row) => (
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
        { header: 'Sexo', field: 'sexo' },
        { header: 'Data Nascimento', field: 'data_nascimento', render: (row) => row.data_nascimento ? new Date(row.data_nascimento).toLocaleDateString('pt-BR') : '-' },
        { header: 'Qualidade', sortField: 'qualidade_dados', render: (row) => <span className={`cc-quality-badge cc-quality-${row.qualidade_dados >= 80 ? 'high' : row.qualidade_dados >= 60 ? 'medium' : 'low'}`}>{row.qualidade_dados}/100</span> }
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
      {renderClientesTable(filterRowsByNameStatus(ativacaoComOrcamentoData), [
        { header: 'Exportado', render: (row) => renderExportStatusIcon(row) },
        { header: 'Nome', render: (row) => (
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
        { header: 'Sexo', field: 'sexo' },
        { header: 'Data Nascimento', field: 'data_nascimento', render: (row) => row.data_nascimento ? new Date(row.data_nascimento).toLocaleDateString('pt-BR') : '-' },
        { header: 'Qualidade', sortField: 'qualidade_dados', render: (row) => <span className={`cc-quality-badge cc-quality-${row.qualidade_dados >= 80 ? 'high' : row.qualidade_dados >= 60 ? 'medium' : 'low'}`}>{row.qualidade_dados}/100</span> }
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
      {renderClientesTable(filterRowsByNameStatus(ativacaoSemOrcamentoData), [
        { header: 'Exportado', render: (row) => renderExportStatusIcon(row) },
        { header: 'Nome', render: (row) => (
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
        { header: 'Sexo', field: 'sexo' },
        { header: 'Data Nascimento', field: 'data_nascimento', render: (row) => row.data_nascimento ? new Date(row.data_nascimento).toLocaleDateString('pt-BR') : '-' },
        { header: 'Qualidade', sortField: 'qualidade_dados', render: (row) => <span className={`cc-quality-badge cc-quality-${row.qualidade_dados >= 80 ? 'high' : row.qualidade_dados >= 60 ? 'medium' : 'low'}`}>{row.qualidade_dados}/100</span> }
      ])}
      {renderPagination()}
    </div>
  );

  const renderReativacaoGeral = () => (
    <div className="cc-list-container">
      <div className="cc-list-header">
        <h2>🔄 Dashboard Reativação</h2>
        <button className="cc-btn cc-btn-export" onClick={() => exportToCSV('reativacao_geral', 'vw_para_reativacao')} disabled={isLoading}>📥 Exportar CSV</button>
      </div>
      {renderClientesTable(reativacaoGeralData, [
        { header: 'Nome', field: 'nome_completo' },
        { header: 'Email', field: 'email' },
        { header: 'WhatsApp', field: 'whatsapp' },
        { header: 'Total Compras', field: 'total_compras' },
        { header: 'Dias Última Compra', field: 'dias_desde_ultima_compra' },
        { header: 'Qualidade', render: (row) => <span className={`cc-quality-badge cc-quality-${row.qualidade_dados >= 80 ? 'high' : row.qualidade_dados >= 60 ? 'medium' : 'low'}`}>{row.qualidade_dados}/100</span> }
      ])}
      {renderPagination()}
    </div>
  );

  const renderReativacao1x = () => (
    <div className="cc-list-container">
      <div className="cc-list-header">
        <h2>1️⃣ Reativação - 1x</h2>
        <button className="cc-btn cc-btn-export" onClick={() => exportToCSV('reativacao_1x', 'vw_reativacao_1x')} disabled={isLoading}>📥 Exportar CSV</button>
      </div>
      {renderClientesTable(reativacao1xData, [
        { header: 'Nome', field: 'nome_completo' },
        { header: 'Email', field: 'email' },
        { header: 'WhatsApp', field: 'whatsapp' },
        { header: 'Dias Última Compra', field: 'dias_desde_ultima_compra' }
      ])}
      {renderPagination()}
    </div>
  );

  const renderReativacao2x = () => (
    <div className="cc-list-container">
      <div className="cc-list-header">
        <h2>2️⃣ Reativação - 2x</h2>
        <button className="cc-btn cc-btn-export" onClick={() => exportToCSV('reativacao_2x', 'vw_reativacao_2x')} disabled={isLoading}>📥 Exportar CSV</button>
      </div>
      {renderClientesTable(reativacao2xData, [
        { header: 'Nome', field: 'nome_completo' },
        { header: 'Email', field: 'email' },
        { header: 'WhatsApp', field: 'whatsapp' },
        { header: 'Dias Última Compra', field: 'dias_desde_ultima_compra' }
      ])}
      {renderPagination()}
    </div>
  );

  const renderReativacao3x = () => (
    <div className="cc-list-container">
      <div className="cc-list-header">
        <h2>3️⃣ Reativação - 3x</h2>
        <button className="cc-btn cc-btn-export" onClick={() => exportToCSV('reativacao_3x', 'vw_reativacao_3x')} disabled={isLoading}>📥 Exportar CSV</button>
      </div>
      {renderClientesTable(reativacao3xData, [
        { header: 'Nome', field: 'nome_completo' },
        { header: 'Email', field: 'email' },
        { header: 'WhatsApp', field: 'whatsapp' },
        { header: 'Dias Última Compra', field: 'dias_desde_ultima_compra' }
      ])}
      {renderPagination()}
    </div>
  );

  const renderReativacao3xPlus = () => (
    <div className="cc-list-container">
      <div className="cc-list-header">
        <h2>🔥 Reativação - 3+ vezes</h2>
        <button className="cc-btn cc-btn-export" onClick={() => exportToCSV('reativacao_3x_plus', 'vw_reativacao_3x_plus')} disabled={isLoading}>📥 Exportar CSV</button>
      </div>
      {renderClientesTable(reativacao3xPlusData, [
        { header: 'Nome', field: 'nome_completo' },
        { header: 'Email', field: 'email' },
        { header: 'WhatsApp', field: 'whatsapp' },
        { header: 'Total Compras', field: 'total_compras' },
        { header: 'Dias Última Compra', field: 'dias_desde_ultima_compra' }
      ])}
      {renderPagination()}
    </div>
  );

  const renderMonitoramentoGeral = () => (
    <div className="cc-list-container">
      <div className="cc-list-header">
        <h2>👀 Dashboard Monitoramento</h2>
        <button className="cc-btn cc-btn-export" onClick={() => exportToCSV('monitoramento_geral', 'vw_para_monitoramento')} disabled={isLoading}>📥 Exportar CSV</button>
      </div>
      {renderClientesTable(monitoramentoGeralData, [
        { header: 'Nome', field: 'nome_completo' },
        { header: 'Email', field: 'email' },
        { header: 'WhatsApp', field: 'whatsapp' },
        { header: 'Total Compras', field: 'total_compras' },
        { header: 'Dias Última Compra', field: 'dias_desde_ultima_compra' }
      ])}
      {renderPagination()}
    </div>
  );

  const renderMonitoramento129 = () => (
    <div className="cc-list-container">
      <div className="cc-list-header">
        <h2>🟢 Monitoramento - 1-29 dias</h2>
        <button className="cc-btn cc-btn-export" onClick={() => exportToCSV('monitoramento_1_29', 'vw_monitoramento_1_29_dias')} disabled={isLoading}>📥 Exportar CSV</button>
      </div>
      {renderClientesTable(monitoramento129Data, [
        { header: 'Nome', field: 'nome_completo' },
        { header: 'Email', field: 'email' },
        { header: 'WhatsApp', field: 'whatsapp' },
        { header: 'Total Compras', field: 'total_compras' },
        { header: 'Dias Última Compra', field: 'dias_desde_ultima_compra' }
      ])}
      {renderPagination()}
    </div>
  );

  const renderMonitoramento3059 = () => (
    <div className="cc-list-container">
      <div className="cc-list-header">
        <h2>🟡 Monitoramento - 30-59 dias</h2>
        <button className="cc-btn cc-btn-export" onClick={() => exportToCSV('monitoramento_30_59', 'vw_monitoramento_30_59_dias')} disabled={isLoading}>📥 Exportar CSV</button>
      </div>
      {renderClientesTable(monitoramento3059Data, [
        { header: 'Nome', field: 'nome_completo' },
        { header: 'Email', field: 'email' },
        { header: 'WhatsApp', field: 'whatsapp' },
        { header: 'Total Compras', field: 'total_compras' },
        { header: 'Dias Última Compra', field: 'dias_desde_ultima_compra' }
      ])}
      {renderPagination()}
    </div>
  );

  const renderMonitoramento6090 = () => (
    <div className="cc-list-container">
      <div className="cc-list-header">
        <h2>🟠 Monitoramento - 60-90 dias</h2>
        <button className="cc-btn cc-btn-export" onClick={() => exportToCSV('monitoramento_60_90', 'vw_monitoramento_60_90_dias')} disabled={isLoading}>📥 Exportar CSV</button>
      </div>
      {renderClientesTable(monitoramento6090Data, [
        { header: 'Nome', field: 'nome_completo' },
        { header: 'Email', field: 'email' },
        { header: 'WhatsApp', field: 'whatsapp' },
        { header: 'Total Compras', field: 'total_compras' },
        { header: 'Dias Última Compra', field: 'dias_desde_ultima_compra' }
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
    </div>
  );
};

export default ClientesConsolidadosPage;
