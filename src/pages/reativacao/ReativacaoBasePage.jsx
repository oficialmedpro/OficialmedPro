import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../ClientesConsolidados.css';
import { supabase } from '../../service/supabase';
import { translations } from '../../data/translations';
import ReativacaoMenu from './ReativacaoMenu';
import './ReativacaoBasePage.css';
import * as XLSX from 'xlsx';

// Mapeamento de rotas para views do banco
const VIEW_MAP = {
  '1x': 'vw_reativacao_1x',
  '2x': 'vw_reativacao_2x',
  '3x': 'vw_reativacao_3x',
  '3x-plus': 'vw_reativacao_3x_plus'
};

const TITLE_MAP = {
  '1x': '1️⃣ Reativação - Compraram 1x',
  '2x': '2️⃣ Reativação - Compraram 2x',
  '3x': '3️⃣ Reativação - Compraram 3x',
  '3x-plus': '🔥 Reativação - Compraram 3+ vezes'
};

const ReativacaoBasePage = ({ tipo }) => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [userData, setUserData] = useState(null);
  
  useEffect(() => {
    // Carregar dados do usuário do localStorage
    const storedUserData = localStorage.getItem('reativacao_userData');
    if (storedUserData) {
      try {
        setUserData(JSON.parse(storedUserData));
      } catch (e) {
        console.error('Erro ao carregar dados do usuário:', e);
      }
    }
  }, []);
  const [data, setData] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);
  const [sortField, setSortField] = useState('nome_completo');
  const [sortDirection, setSortDirection] = useState('asc');
  const [selectedRows, setSelectedRows] = useState([]);
  const [exportFormat, setExportFormat] = useState('csv');
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportMotivo, setExportMotivo] = useState('WHATSAPI');
  const [exportObservacao, setExportObservacao] = useState('');
  const [exportTag, setExportTag] = useState(''); // Tag de exportação
  const [exportHistory, setExportHistory] = useState({});
  const [exportFilter, setExportFilter] = useState('all'); // 'all' | 'exported' | 'never-exported'
  const [exportTagFilter, setExportTagFilter] = useState('all'); // Filtro por tag de exportação
  const [availableExportTags, setAvailableExportTags] = useState([]); // Tags disponíveis para filtro
  const [currentLanguage, setCurrentLanguage] = useState('pt-BR');
  
  const t = translations[currentLanguage] || {};
  
  // Estados de filtros
  const [filters, setFilters] = useState({
    hasCpf: false,
    hasEmail: false,
    hasEndereco: false,
    hasSexo: false,
    hasDataNascimento: false,
    phoneStatus: 'any',
    ddd: '',
    origins: []
  });
  
  // Estados adicionais necessários
  const [showFilters, setShowFilters] = useState(true);
  const [nameFilter, setNameFilter] = useState('all'); // 'all' | 'incomplete' | 'validated'
  const [duplicatesFilter, setDuplicatesFilter] = useState('all'); // 'all' | 'with-duplicates' | 'no-duplicates'
  const [isLoadingDuplicates, setIsLoadingDuplicates] = useState(false);
  const [validatedNames, setValidatedNames] = useState({}); // {clienteId: nome_validado}
  const [dddOptions, setDddOptions] = useState([]);
  const [lastClickedIndex, setLastClickedIndex] = useState(null);
  const [duplicatesData, setDuplicatesData] = useState({}); // {clientId: [duplicates]}
  const [showNameModal, setShowNameModal] = useState(false);
  const [selectedClientForName, setSelectedClientForName] = useState(null);
  const [editFields, setEditFields] = useState(null);

  // Verificar se é supervisor ou vendedor
  const userTypeName = userData?.userTypeName?.toLowerCase() || '';
  const isSupervisor = ['supervisor', 'adminfranquiadora', 'adminfranquia', 'adminunidade'].includes(userTypeName);
  const isVendedor = userTypeName === 'vendedor';

  // Modo vendedor: só visualiza exportados
  useEffect(() => {
    if (isVendedor && !isSupervisor) {
      setExportFilter('exported'); // Forçar filtro de exportados no modo vendedor
    }
  }, [isVendedor, isSupervisor]);

  const viewName = VIEW_MAP[tipo] || VIEW_MAP['1x'];
  const pageTitle = TITLE_MAP[tipo] || TITLE_MAP['1x'];

  useEffect(() => {
    // Só carregar dados se userData estiver disponível
    if (userData) {
      loadData();
      loadAvailableExportTags();
      loadAvailableDDDs();
    }
  }, [tipo, currentPage, itemsPerPage, sortField, sortDirection, filters, exportFilter, exportTagFilter, userData, isVendedor, isSupervisor]);

  // Carregar tags de exportação disponíveis
  const loadAvailableExportTags = async () => {
    try {
      const { data } = await supabase
        .schema('api')
        .from('historico_exportacoes')
        .select('tag_exportacao')
        .not('tag_exportacao', 'is', null);
      
      const uniqueTags = [...new Set(data?.map(d => d.tag_exportacao).filter(Boolean) || [])];
      setAvailableExportTags(uniqueTags.sort());
    } catch (error) {
      console.error('Erro ao carregar tags de exportação:', error);
    }
  };

  // Carregar histórico de exportações
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
      console.error('Erro ao carregar histórico:', error);
      return {};
    }
  };

  // Registrar exportação
  const registerExport = async (leadIds, motivo, observacao, tag) => {
    try {
      let userId = null;
      if (userData?.id) {
        userId = String(userData.id);
      }
      
      const records = leadIds.map(id_lead => {
        const record = {
          id_lead,
          motivo,
          observacao: observacao?.trim() || null,
          tag_exportacao: tag?.trim() || null
        };
        if (userId) {
          record.usuario_id = userId;
        }
        return record;
      });
      
      const { error } = await supabase
        .schema('api')
        .from('historico_exportacoes')
        .insert(records);
      
      if (error) throw error;
      
      const newHistory = await loadExportHistory(leadIds);
      setExportHistory(prev => ({ ...prev, ...newHistory }));
      
      return { success: true };
    } catch (error) {
      console.error('Erro ao registrar exportação:', error);
      return { success: false, error };
    }
  };

  const loadData = async () => {
    try {
      // Verificar se userData está disponível antes de continuar
      if (!userData) {
        setIsLoading(false);
        return;
      }
      
      setIsLoading(true);
      const start = (currentPage - 1) * itemsPerPage;
      const end = start + itemsPerPage - 1;
      
      // Determinar isSupervisor e isVendedor baseado em userData atualizado
      const currentUserTypeName = userData?.userTypeName?.toLowerCase() || '';
      const currentIsSupervisor = ['supervisor', 'adminfranquiadora', 'adminfranquia', 'adminunidade'].includes(currentUserTypeName);
      const currentIsVendedor = currentUserTypeName === 'vendedor';
      
      let query = supabase
        .schema('api')
        .from(viewName)
        .select('*', { count: 'exact' });
      
      // Aplicar filtros
      query = applyFiltersToQuery(query);
      
      // Modo supervisor: aplicar filtro por tag ANTES da paginação
      if (currentIsSupervisor && exportTagFilter && exportTagFilter !== 'all') {
        // Buscar TODOS os IDs exportados com aquela tag
        const { data: exportedIds } = await supabase
          .schema('api')
          .from('historico_exportacoes')
          .select('id_lead')
          .eq('tag_exportacao', exportTagFilter);
        
        const exportedLeadIds = exportedIds?.map(e => e.id_lead).filter(Boolean) || [];
        if (exportedLeadIds.length > 0) {
          query = query.in('id', exportedLeadIds);
        } else {
          // Se não há exportados com essa tag, retornar vazio
          setData([]);
          setTotalCount(0);
          setIsLoading(false);
          return;
        }
      }
      
      // Modo vendedor: só exportados (sempre filtrar, mesmo sem tag)
      if (currentIsVendedor && !currentIsSupervisor) {
        // Buscar IDs exportados com filtro de tag se necessário
        let exportQuery = supabase
          .schema('api')
          .from('historico_exportacoes')
          .select('id_lead');
        
        // Aplicar filtro por tag se selecionado
        if (exportTagFilter && exportTagFilter !== 'all') {
          exportQuery = exportQuery.eq('tag_exportacao', exportTagFilter);
        }
        
        const { data: exportedIds, error: exportError } = await exportQuery;
        
        if (exportError) {
          console.error('Erro ao buscar exportados:', exportError);
          setData([]);
          setTotalCount(0);
          setIsLoading(false);
          return;
        }
        
        const exportedLeadIds = exportedIds?.map(e => e.id_lead).filter(Boolean) || [];
        if (exportedLeadIds.length > 0) {
          query = query.in('id', exportedLeadIds);
        } else {
          // Se não há exportados, retornar vazio
          setData([]);
          setTotalCount(0);
          setIsLoading(false);
          return;
        }
      }
      
      // Ordenação
      if (sortField) {
        query = query.order(sortField, { ascending: sortDirection === 'asc' });
      }
      
      const { data, count, error } = await query.range(start, end);
      
      if (error) throw error;
      
      // Filtrar no cliente (endereço)
      let filteredData = filterClientSideIfNeeded(data || []);
      
      // Carregar histórico de exportações
      const leadIds = filteredData.map(row => row.id || row.id_lead || row.id_cliente_mestre).filter(Boolean);
      if (leadIds.length > 0) {
        const history = await loadExportHistory(leadIds);
        setExportHistory(prev => ({ ...prev, ...history }));
      }
      
      // Filtrar por status de exportação (modo supervisor)
      // NOTA: No modo vendedor, o filtro já foi aplicado na query acima
      if (currentIsSupervisor && exportFilter === 'exported') {
        filteredData = filteredData.filter(row => {
          const leadId = row.id || row.id_lead || row.id_cliente_mestre;
          return exportHistory[leadId]?.length > 0;
        });
      } else if (currentIsSupervisor && exportFilter === 'never-exported') {
        filteredData = filteredData.filter(row => {
          const leadId = row.id || row.id_lead || row.id_cliente_mestre;
          return !exportHistory[leadId] || exportHistory[leadId].length === 0;
        });
      }
      
      // Filtro por tag já foi aplicado na query (modo supervisor)
      // Não precisa filtrar novamente aqui
      
      // Filtrar por nome e duplicatas
      filteredData = filterRowsByNameStatus(filteredData);
      filteredData = filterRowsByDuplicates(filteredData);
      
      // Aplicar ordenação adicional se necessário
      let sorted = filteredData;
      
      // Se a ordenação do backend não for suficiente, aplicar ordenação adicional no cliente
      if (sortField === 'dias_desde_ultima_compra') {
        // Ordenação numérica para dias desde última compra
        sorted = [...filteredData].sort((a, b) => {
          const valA = parseInt(a.dias_desde_ultima_compra) || 0;
          const valB = parseInt(b.dias_desde_ultima_compra) || 0;
          return sortDirection === 'asc' ? valA - valB : valB - valA;
        });
      } else if (sortField === 'qualidade_dados') {
        // Ordenação numérica para qualidade
        sorted = [...filteredData].sort((a, b) => {
          const valA = parseFloat(a.qualidade_dados) || 0;
          const valB = parseFloat(b.qualidade_dados) || 0;
          return sortDirection === 'asc' ? valA - valB : valB - valA;
        });
      } else if (sortField && sortField !== 'nome_completo') {
        // Se há ordenação selecionada que não seja nome, aplicar ordenação padrão
        // A ordenação do backend já foi aplicada, mas podemos garantir aqui
        sorted = filteredData;
      } else {
        // Se não há ordenação específica ou é nome, usar ordenação por exportado e nome
        sorted = sortByExportedThenName(filteredData);
      }
      
      setData(sorted);
      setTotalCount(count || 0);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      setData([]);
      setTotalCount(0);
    } finally {
      setIsLoading(false);
    }
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

  // Ordenar por exportado e depois por nome
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

  // Filtrar dados por duplicatas
  const filterRowsByDuplicates = (data) => {
    if (duplicatesFilter === 'all') {
      return data;
    }
    const filtered = data.filter(row => {
      const rawId = row.id || row.id_cliente || row.id_cliente_mestre;
      const clientId = rawId ? String(rawId) : null;
      if (!clientId) return duplicatesFilter === 'no-duplicates';
      const wasChecked = duplicatesData.hasOwnProperty(clientId);
      if (!wasChecked) return duplicatesFilter === 'no-duplicates';
      const duplicatesArray = duplicatesData[clientId];
      // Verificar se tem duplicatas (array existe E tem pelo menos 1 item)
      const hasDuplicates = Array.isArray(duplicatesArray) && duplicatesArray.length > 0;
      return duplicatesFilter === 'with-duplicates' ? hasDuplicates : !hasDuplicates;
    });
    return filtered;
  };

  // Filtrar dados por status do nome
  const filterRowsByNameStatus = (rows) => {
    if (!Array.isArray(rows) || nameFilter === 'all') return rows;
    if (nameFilter === 'incomplete') {
      return rows.filter(r => String(r.nome_completo || '').toUpperCase().includes('INCOMPLETO'));
    }
    if (nameFilter === 'validated') {
      return rows.filter(r => !!validatedNames[(r.id || r.id_cliente_mestre)]);
    }
    return rows;
  };

  // Carregar DDDs disponíveis
  const parseDDD = (phone) => {
    if (!phone) return null;
    const digits = String(phone).replace(/\D/g, '');
    if (!digits) return null;
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
      const limit = 2000;
      const views = ['vw_reativacao_1x', 'vw_reativacao_2x', 'vw_reativacao_3x', 'vw_reativacao_3x_plus'];
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

  const handleExportConfirm = async () => {
    const selected = selectedRows.map(i => data[i]).filter(Boolean);
    const leadIds = selected.map(row => row.id || row.id_lead || row.id_cliente_mestre).filter(Boolean);
    
    if (leadIds.length > 0) {
      await registerExport(leadIds, exportMotivo, exportObservacao, exportTag);
    }
    
    // Fazer exportação real
    const exportPrefix = `reativacao_${tipo}`;
    exportSelected(selected, `${exportPrefix}_export_${new Date().toISOString().split('T')[0]}`);
    
    setShowExportModal(false);
    setExportObservacao('');
    setExportTag('');
    setSelectedRows([]);
    loadData();
  };

  const exportSelected = (rows, baseName) => {
    if (!rows || rows.length === 0) return;
    
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
    
    if (exportFormat === 'csv') {
      const csvRows = [headers.join(','), ...normalizedRows.map(r => headers.map(h => {
        const val = r[h];
        if (val == null) return '';
        const s = String(val).replace(/"/g, '""');
        return /[",\n]/.test(s) ? `"${s}"` : s;
      }).join(','))];
      const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `${baseName}.csv`;
      link.click();
      URL.revokeObjectURL(link.href);
    } else if (exportFormat === 'xlsx' || exportFormat === 'excel') {
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(normalizedRows);
      XLSX.utils.book_append_sheet(wb, ws, 'Dados');
      XLSX.writeFile(wb, `${baseName}.${exportFormat === 'xlsx' ? 'xlsx' : 'xls'}`);
    }
  };

  // Funções de renderização
  const formatSexo = (sexo) => {
    if (!sexo && sexo !== 0 && sexo !== '0') return '—';
    const sexoNum = parseInt(sexo);
    if (sexoNum === 1) return 'MASC';
    if (sexoNum === 2) return 'FEM';
    if (sexoNum === 0 || sexo === '0') return '';
    return sexo;
  };

  const renderQualityBadge = (row) => {
    const score = row.qualidade_dados || 0;
    const qualityClass = score >= 80 ? 'high' : score >= 60 ? 'medium' : 'low';
    return (
      <span
        className={`cc-quality-badge cc-quality-${qualityClass}`}
        style={{ cursor: 'pointer' }}
      >
        {score}/100
      </span>
    );
  };

  const renderDuplicatesIcon = (row) => {
    const rawId = row.id || row.id_cliente || row.id_cliente_mestre;
    const clientId = rawId ? String(rawId) : null;
    if (!clientId) return null;
    // Verificar se tem duplicatas (array existe E tem pelo menos 1 item)
    const hasDuplicates = duplicatesData[clientId] !== undefined && 
      Array.isArray(duplicatesData[clientId]) && 
      duplicatesData[clientId].length > 0;
    return (
      <span
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

  const renderOriginsBadges = (row) => {
    const fromArray = Array.isArray(row.origem_marcas) ? row.origem_marcas : [];
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

  const renderNomePorOrigem = (row) => {
    const clientId = row.id || row.id_cliente_mestre;
    const nomeValidado = validatedNames[clientId];
    let nomePrincipal = nomeValidado || row.nome_completo || 'SEM NOME';
    const nomes = [];
    const cores = {
      prime: '#2563eb',
      sprint: '#9333ea',
      greatpage: '#059669',
      blacklabs: '#dc2626'
    };
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
    origRaw.forEach(origemBruta => {
      const origem = normalizarOrigem(origemBruta);
      const nome = row[`nome_cliente_${origem}`] || row[`nome_${origem}`] || row.nome_completo;
      if (nome && nome !== 'SEM NOME' && String(nome).trim()) {
        nomes.push({ origem, nome, cor: cores[origem] || '#6b7280' });
      }
    });
    const idPrime = row.id_prime || row.prime_id || row.idprime;
    const idSprint = row.id_sprinthub || row.sprinthub_id || row.id_sprint || row.idsprint || row.id_lead || row.lead_id;
    const idsTooltip = `Prime: ${idPrime ?? '-'} | Sprinthub: ${idSprint ?? '-'}`;
    
    // Verificar se tem origem Prime
    const hasPrimeOrigin = origRaw.some(o => {
      const normalized = normalizarOrigem(o);
      return normalized === 'prime' || String(o).toLowerCase().includes('prime');
    }) || row.no_prime || row.prime;
    
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {isSupervisor && (
          <button
            className="cc-btn-nome-padrao"
            onClick={(e) => {
              e.stopPropagation();
              // Carregar dados do cliente para edição
              const clienteData = {
                nome_completo: row.nome_completo || '',
                email: row.email || '',
                whatsapp: row.whatsapp || '',
                telefone: row.telefone || '',
                cpf: row.cpf || '',
                sexo: row.sexo || '',
                data_nascimento: row.data_nascimento || '',
                cep: row.cep || '',
                estado: row.estado || '',
                cidade: row.cidade || '',
                endereco_rua: row.endereco_rua || row.endereco || '',
                endereco_numero: row.endereco_numero || '',
                endereco_complemento: row.endereco_complemento || ''
              };
              setEditFields(clienteData);
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
        )}
        <span className={nomeValidado ? 'cc-nome-validado' : 'cc-nome-cell'}>
          {nomePrincipal}
          {nomeValidado && (
            <span className="cc-badge-validado" title="Nome Validado">✓</span>
          )}
        </span>
        {/* Ícone "P" azul para copiar ID do Prime - apenas se tiver origem Prime e ID do Prime */}
        {idPrime && hasPrimeOrigin ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (idPrime) {
                navigator.clipboard.writeText(String(idPrime));
                // Feedback visual temporário
                const button = e.target.closest('button');
                const originalBg = button.style.backgroundColor;
                const originalText = button.textContent;
                button.style.backgroundColor = '#16a34a';
                button.textContent = '✓';
                setTimeout(() => {
                  button.style.backgroundColor = originalBg;
                  button.textContent = originalText;
                }, 1000);
              }
            }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '20px',
              height: '20px',
              borderRadius: '50%',
              backgroundColor: '#2563eb',
              color: 'white',
              fontSize: '12px',
              fontWeight: 'bold',
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              padding: 0
            }}
            title={`Copiar ID do Prime: ${idPrime}`}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = '#1d4ed8';
              e.target.style.transform = 'scale(1.1)';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = '#2563eb';
              e.target.style.transform = 'scale(1)';
            }}
          >
            P
          </button>
        ) : (
          <span title={idsTooltip} style={{ cursor: 'help', opacity: 0.75 }}>ℹ️</span>
        )}
        {/* Ícone "s" roxo para abrir perfil no Sprinthub - apenas se tiver origem Sprinthub e ID do Sprinthub */}
        {(() => {
          // Verificar se tem origem Sprinthub
          const hasSprintOrigin = origRaw.some(o => {
            const normalized = normalizarOrigem(o);
            return normalized === 'sprint' || String(o).toLowerCase().includes('sprint');
          }) || row.no_sprint || row.sprinthub;
          
          // Verificar se tem ID do Sprinthub válido
          const hasValidSprintId = idSprint && String(idSprint).trim() !== '';
          
          return hasSprintOrigin && hasValidSprintId ? (
            <a
              href={`https://oficialmed.sprinthub.app/sh/leads/profile/${idSprint}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '20px',
                height: '20px',
                borderRadius: '50%',
                backgroundColor: '#9333ea',
                color: 'white',
                fontSize: '12px',
                fontWeight: 'bold',
                textDecoration: 'none',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              title={`Abrir perfil no Sprinthub (ID: ${idSprint})`}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = '#7c3aed';
                e.target.style.transform = 'scale(1.1)';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = '#9333ea';
                e.target.style.transform = 'scale(1)';
              }}
            >
              s
            </a>
          ) : null;
        })()}
      </div>
    );
  };

  const validarNomePadrao = async (clientId, nomeEscolhido, origemNome) => {
    try {
      let userId = null;
      if (userData?.id) {
        userId = String(userData.id);
      }
      
      // Registrar nome validado
      const { error } = await supabase
        .schema('api')
        .from('nome_validado_clientes')
        .upsert({
          id_cliente_mestre: clientId,
          nome_validado: nomeEscolhido,
          origem_nome: origemNome,
          validado_por: userId
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
          protegido_por: userId
        }, {
          onConflict: 'id_cliente_mestre,campo_protegido'
        });
      
      // Atualizar estado
      setValidatedNames(prev => ({ ...prev, [clientId]: nomeEscolhido }));
      setShowNameModal(false);
      setSelectedClientForName(null);
      setEditFields(null);
      loadData();
      
      alert('Nome padrão definido e protegido!');
    } catch (error) {
      console.error('Erro ao validar nome:', error);
      alert('Erro ao salvar nome padrão');
    }
  };

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
            const iso = `${yyyy}-${mm}-${dd}`;
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
      loadData();
    } catch (e) {
      console.error('Erro ao salvar alterações', e);
      alert('Erro ao salvar alterações');
    }
  };

  const detectDuplicates = async (client) => {
    try {
      const clientId = client.id || client.id_cliente || client.id_cliente_mestre;
      if (!clientId) return [];
      
      // Se já temos duplicatas carregadas para este cliente, retornar
      const clientIdStr = String(clientId);
      if (duplicatesData[clientIdStr] !== undefined) {
        return duplicatesData[clientIdStr];
      }

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

      return duplicates;
    } catch (error) {
      console.error('Erro ao detectar duplicatas:', error);
      return [];
    }
  };

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
            const wasChecked = duplicatesData.hasOwnProperty(clientId);
            
            if (!wasChecked) {
              try {
                const dups = await detectDuplicates(client);
                // IMPORTANTE: Marcar TODOS os clientes verificados no estado (mesmo sem duplicatas)
                newDuplicatesData[clientId] = dups; // Array vazio se não tiver duplicatas
                if (dups.length > 0) {
                  duplicatesFound++;
                  return { success: true, clientId, dups };
                }
                return { success: true, clientId, dups: [] };
              } catch (error) {
                console.warn(`⚠️ [DUPLICADOS] Erro ao detectar duplicatas para cliente ${clientId}:`, error.message);
                return { success: false, clientId, error: error.message };
              }
            } else {
              // Se já foi verificado, manter no resultado atual (não reprocessar)
              const existingDups = duplicatesData[clientId] || [];
              if (existingDups.length > 0) {
                duplicatesFound++;
              }
              return { success: true, clientId, skipped: true, reason: 'already_checked' };
            }
          })
        );
        
        // Atualizar estado incrementalmente para melhor UX
        if (Object.keys(newDuplicatesData).length > 0) {
          setDuplicatesData(prev => {
            const updated = { ...prev, ...newDuplicatesData };
            return updated;
          });
        }
      }

      console.log(`✅ [DUPLICADOS] Verificação concluída: ${duplicatesFound} clientes com duplicatas encontradas`);
      alert(`Verificação de duplicatas concluída!\n${duplicatesFound} cliente(s) com duplicatas encontrado(s).`);
      
      // Recarregar dados para atualizar a tabela
      loadData();
    } catch (error) {
      console.error('❌ [DUPLICADOS] Erro ao carregar duplicatas:', error);
      alert('Erro ao detectar duplicatas. Verifique o console para mais detalhes.');
    } finally {
      setIsLoadingDuplicates(false);
    }
  };

  const corrigirTelefoneNoNome = async (clientId, nomeAtual) => {
    try {
      const { data, error } = await supabase
        .schema('api')
        .rpc('corrigir_telefone_do_nome', { 
          p_id_cliente: clientId,
          p_origem: 'manual'
        });
      
      if (error) throw error;
      
      if (data && data.success) {
        alert(`Telefone extraído!\nNome anterior: ${data.nome_anterior}\nNome atual: ${data.nome_atual}\nTelefone: ${data.telefone_extraido}`);
        loadData();
      } else {
        alert(data?.error || 'Erro ao corrigir telefone');
      }
    } catch (error) {
      console.error('Erro ao corrigir telefone:', error);
      alert('Erro ao processar correção');
    }
  };

  const renderExportStatusIcon = (row) => {
    const leadId = row.id || row.id_lead || row.id_cliente_mestre;
    const hasExport = exportHistory[leadId]?.length > 0;
    
    return (
      <span
        style={{
          display: 'inline-block',
          width: '20px',
          height: '20px',
          borderRadius: '50%',
          backgroundColor: hasExport ? '#22c55e' : '#e5e7eb',
          cursor: hasExport ? 'pointer' : 'default',
          border: '2px solid',
          borderColor: hasExport ? '#16a34a' : '#d1d5db'
        }}
        title={hasExport ? `${exportHistory[leadId].length} exportação(ões)` : 'Não exportado'}
      />
    );
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

  const renderFiltersBar = () => {
    // Mostrar filtros para supervisor e vendedor
    if (!isSupervisor && !isVendedor) return null;
    
    // Modo vendedor: mostrar apenas o filtro de tag de exportação
    if (isVendedor && !isSupervisor) {
      return (
        <div className="cc-filters-bar">
          <div className="cc-filters-grid">
            <div className="cc-filters-row">
              <div className="cc-filter-item">
                <span>Tag de Exportação:</span>
                <select 
                  value={exportTagFilter} 
                  onChange={(e) => {
                    setExportTagFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="cc-select cc-select-small"
                >
                  <option value="all">Todas as Tags</option>
                  {availableExportTags.map((tag) => (
                    <option key={tag} value={tag}>{tag}</option>
                  ))}
                </select>
              </div>
              <div className="cc-filter-item">
                <button className="cc-btn cc-btn-small" onClick={() => { setCurrentPage(1); loadData(); }}>
                  Aplicar
                </button>
                <button className="cc-btn cc-btn-small" onClick={() => {
                  setExportTagFilter('all');
                  setCurrentPage(1);
                  loadData();
                }}>Limpar</button>
              </div>
            </div>
          </div>
        </div>
      );
    }
    
    // Modo supervisor: mostrar todos os filtros
    return (
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
                  onChange={(e) => {
                    setDuplicatesFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="cc-select cc-select-small"
                >
                  <option value="all">Todos</option>
                  <option value="with-duplicates">Com Duplicatas</option>
                  <option value="no-duplicates">Sem Duplicatas</option>
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
                <span>Tag de Exportação:</span>
                <select 
                  value={exportTagFilter} 
                  onChange={(e) => {
                    setExportTagFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="cc-select cc-select-small"
                >
                  <option value="all">Todas as Tags</option>
                  {availableExportTags.map((tag) => (
                    <option key={tag} value={tag}>{tag}</option>
                  ))}
                </select>
              </div>
              <div className="cc-filter-item">
                <button className="cc-btn cc-btn-small" onClick={() => { setCurrentPage(1); loadData(); }}>
                  Aplicar
                </button>
                <button className="cc-btn cc-btn-small" onClick={() => {
                  setFilters({ hasCpf: false, hasEmail: false, hasEndereco: false, hasSexo: false, hasDataNascimento: false, phoneStatus: 'any', ddd: '', origins: [] });
                  setExportTagFilter('all');
                  setCurrentPage(1);
                  loadData();
                }}>Limpar</button>
                {isSupervisor && (
                  <button
                    className="cc-btn cc-btn-small"
                    onClick={() => {
                      if (data.length > 0) {
                        loadDuplicatesForClients(data);
                      } else {
                        alert('Nenhum cliente disponível na página atual.');
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
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderClientesTable = (data) => {
    const columns = [
      // Apenas supervisor vê colunas de exportado e duplicatas
      ...(isSupervisor ? [
        { header: 'Exportado', render: (row) => renderExportStatusIcon(row) },
        { header: 'Duplicatas', render: (row) => renderDuplicatesIcon(row) }
      ] : []),
      { header: 'Nome', sortField: 'nome_completo', render: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {renderNomePorOrigem(row)}
          {isSupervisor && row.nome_completo && /[0-9]{10,}/.test(row.nome_completo) && (
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
              style={{ cursor: 'pointer', color: '#3b82f6', textDecoration: 'underline' }}
            >
              {totalCompras}
            </span>
          );
        }
      },
      { header: 'Dias Última Compra', sortField: 'dias_desde_ultima_compra', field: 'dias_desde_ultima_compra' },
      { header: 'Origens', render: (row) => renderOriginsBadges(row) },
      { header: 'Cidade/Estado', sortField: 'cidade', render: (row) => `${row.cidade || '-'}/${row.estado || '-'}` },
      { header: 'Sexo', render: (row) => formatSexo(row.sexo) },
      { header: 'Data Nascimento', field: 'data_nascimento', render: (row) => row.data_nascimento ? new Date(row.data_nascimento).toLocaleDateString('pt-BR') : '-' },
      { header: 'Qualidade', sortField: 'qualidade_dados', render: renderQualityBadge }
    ];

    return (
      <div className="cc-table-wrapper">
        <table className="cc-table cc-table-list">
          <thead>
            <tr>
              {isSupervisor && (
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
              )}
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
            {isLoading ? (
              <tr>
                <td colSpan={isSupervisor ? columns.length + 1 : columns.length} style={{ textAlign: 'center', padding: '20px' }}>
                  Carregando...
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={isSupervisor ? columns.length + 1 : columns.length} style={{ textAlign: 'center', padding: '20px' }}>
                  Nenhum registro encontrado
                </td>
              </tr>
            ) : (
              data.map((row, idx) => {
                const rawId = row.id || row.id_cliente || row.id_cliente_mestre;
                const clientId = rawId ? String(rawId) : null;
                // Verificar se tem duplicatas (array existe E tem pelo menos 1 item)
                const hasDuplicates = clientId && 
                  duplicatesData[clientId] !== undefined && 
                  Array.isArray(duplicatesData[clientId]) && 
                  duplicatesData[clientId].length > 0;
                
                return (
                  <tr 
                    key={idx}
                    className={hasDuplicates ? 'cc-row-duplicate' : ''}
                    style={hasDuplicates ? { 
                      backgroundColor: '#f90808', 
                      cursor: 'pointer',
                      borderLeft: '4px solid #af6b6b'
                    } : {}}
                  >
                    {isSupervisor && (
                      <td>
                        <input
                          type="checkbox"
                          checked={selectedRows.includes(idx)}
                          onChange={(e) => {
                            e.stopPropagation();
                            const willSelect = e.target.checked;
                            
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
                    )}
                    {columns.map((col, colIdx) => (
                      <td key={colIdx} onClick={(e) => {
                        if (e.target.tagName === 'BUTTON' || e.target.tagName === 'A' || e.target.closest('button') || e.target.closest('a')) {
                          e.stopPropagation();
                        }
                      }}>
                        {col.render ? col.render(row) : (row[col.field] ?? '-')}
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    );
  };

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


  useEffect(() => {
    // Adicionar classe ao body e html para garantir scroll
    document.body.classList.add('reativacao-page-active');
    document.documentElement.classList.add('reativacao-page-active');
    
    return () => {
      // Remover classe ao desmontar
      document.body.classList.remove('reativacao-page-active');
      document.documentElement.classList.remove('reativacao-page-active');
    };
  }, []);

  return (
    <div className="reativacao-dashboard-fullscreen">
      <ReativacaoMenu />
      <div className="reativacao-dashboard-content">
        <div className="cc-list-container">
          <div className="cc-list-header">
            <h2>{pageTitle}</h2>
            {isSupervisor && (
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <select className="cc-select cc-select-small" value={exportFormat} onChange={(e) => setExportFormat(e.target.value)}>
                  <option value="csv">CSV</option>
                  <option value="excel">Excel (.xls)</option>
                  <option value="xlsx">XLSX</option>
                  <option value="json">JSON</option>
                </select>
                <button 
                  className="cc-btn cc-btn-export" 
                  onClick={() => {
                    if (selectedRows.length === 0) {
                      alert('Nenhum registro selecionado.');
                      return;
                    }
                    setShowExportModal(true);
                  }} 
                  disabled={isLoading || selectedRows.length === 0}
                >
                  📥 Exportar Selecionados
                </button>
                <button 
                  className="cc-btn cc-btn-export" 
                  onClick={() => exportAllFromTable(`reativacao_${tipo}`, viewName)} 
                  disabled={isLoading}
                >
                  Exportar Tudo (CSV)
                </button>
              </div>
            )}
            {isVendedor && !isSupervisor && (
              <div style={{ padding: '8px', backgroundColor: '#fbbf24', borderRadius: '4px', color: '#92400e' }}>
                Modo Vendedor: Apenas exportados visíveis
              </div>
            )}
          </div>
          
          {/* Filtros */}
          {renderFiltersBar()}
          
          {/* Tabela */}
          {renderClientesTable(data)}
          {renderPagination()}
        </div>
        
        {/* Modal de Exportação */}
        {showExportModal && isSupervisor && (
          <div className="cc-modal-overlay" onClick={() => setShowExportModal(false)}>
            <div className="cc-modal" onClick={(e) => e.stopPropagation()}>
              <h3>Exportar Selecionados</h3>
              <div style={{ marginBottom: '16px' }}>
                <label>Motivo:</label>
                <select 
                  value={exportMotivo} 
                  onChange={(e) => setExportMotivo(e.target.value)}
                  className="cc-select"
                >
                  <option value="WHATSAPI">WHATSAPI</option>
                  <option value="SMS">SMS</option>
                  <option value="CALLIX">CALLIX</option>
                  <option value="EMAIL">EMAIL</option>
                </select>
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label>Tag de Exportação:</label>
                <input 
                  type="text" 
                  value={exportTag} 
                  onChange={(e) => setExportTag(e.target.value)}
                  placeholder="Ex: campanha_jan2024"
                  className="cc-input"
                />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label>Observação:</label>
                <textarea 
                  value={exportObservacao} 
                  onChange={(e) => setExportObservacao(e.target.value)}
                  className="cc-textarea"
                  rows={3}
                />
              </div>
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                <button className="cc-btn" onClick={() => setShowExportModal(false)}>Cancelar</button>
                <button className="cc-btn cc-btn-primary" onClick={handleExportConfirm}>Exportar</button>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Nome */}
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
                    await supabase.schema('api').rpc('marcar_nome_incompleto', { p_id_cliente: selectedClientForName.id });
                    setShowNameModal(false);
                    setSelectedClientForName(null);
                    setEditFields(null);
                    loadData();
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
                    await supabase.schema('api').rpc('mover_nome_para_telefone', { p_id_cliente: selectedClientForName.id, p_nome: nomeAtual });
                    setShowNameModal(false);
                    setSelectedClientForName(null);
                    setEditFields(null);
                    loadData();
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
    </div>
  );
};

export default ReativacaoBasePage;

