import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../ClientesConsolidados.css';
import { supabase } from '../../service/supabase';
import { translations } from '../../data/translations';
import MonitoramentoMenu from './MonitoramentoMenu';
import './MonitoramentoBasePage.css';
import * as XLSX from 'xlsx';
import { Mail, Copy, FileText, MessageCircle, Phone } from 'lucide-react';

// Mapeamento de rotas para views do banco
const VIEW_MAP = {
  '1-29': 'vw_monitoramento_1_29_dias',
  '30-59': 'vw_monitoramento_30_59_dias',
  '60-90': 'vw_monitoramento_60_90_dias'
};

const TITLE_MAP = {
  '1-29': '🟢 Monitoramento - 1-29 dias',
  '30-59': '🟡 Monitoramento - 30-59 dias',
  '60-90': '🟠 Monitoramento - 60-90 dias'
};

const MonitoramentoBasePage = ({ tipo }) => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [userData, setUserData] = useState(null);
  
  useEffect(() => {
    // Carregar dados do usuário do localStorage
    const storedUserData = localStorage.getItem('monitoramento_userData');
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
  
  // Estados específicos para exportação Sprinthub
  const [sprinthubEtapa, setSprinthubEtapa] = useState('167'); // Etapa padrão
  const [sprinthubVendedor, setSprinthubVendedor] = useState('229'); // ID do vendedor padrão
  const [sprinthubTituloPrefix, setSprinthubTituloPrefix] = useState('MONITORAMENTO 28-7 05-8'); // Prefixo do título
  
  // Estado para modal de histórico de exportação
  const [showExportHistoryModal, setShowExportHistoryModal] = useState(false);
  const [selectedClientForHistory, setSelectedClientForHistory] = useState(null);
  const [clientExportHistory, setClientExportHistory] = useState([]);
  
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
  
  // Estado para barra de pesquisa (busca global em todos os campos)
  const [searchTerm, setSearchTerm] = useState(''); // Termo de pesquisa
  const [exportWithCountryCode, setExportWithCountryCode] = useState(false); // Opção de exportar com código do país (55)
  
  // Estados para filtro de data (para exportação por período)
  const [dataInicio, setDataInicio] = useState(''); // Data início para filtro
  const [dataFim, setDataFim] = useState(''); // Data fim para filtro
  
  // Estado para controlar se mostra todas as colunas ou apenas as padrão
  const [showAllColumns, setShowAllColumns] = useState(false);
  
  // Função para detectar se é mobile
  const isMobileDevice = () => {
    return window.innerWidth <= 768;
  };
  
  // Estado para ocultar/mostrar colunas (inicializado baseado no tipo de usuário e dispositivo)
  const [visibleColumns, setVisibleColumns] = useState(() => {
    const userTypeName = localStorage.getItem('monitoramento_userData') 
      ? JSON.parse(localStorage.getItem('monitoramento_userData'))?.userTypeName?.toLowerCase() || ''
      : '';
    const isSupervisor = ['supervisor', 'adminfranquiadora', 'adminfranquia', 'adminunidade'].includes(userTypeName);
    const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;
    
    // Se for mobile: nome, whatsapp, pedidos, periodo, cidade_estado
    // Se for desktop: nome, whatsapp, pedidos, periodo, email, cpf, cidade_estado, nota
    return {
      exportado: isSupervisor && showAllColumns, // Apenas supervisor e quando mostra todas
      duplicatas: isSupervisor && showAllColumns, // Apenas supervisor e quando mostra todas
      nome: true,
      email: isMobile ? false : true, // Desktop mostra, mobile não (padrão)
      whatsapp: true,
      cpf: isMobile ? false : true, // Desktop mostra, mobile não (padrão)
      total_compras: true,
      dias_ultima_compra: true,
      origens: showAllColumns, // Só mostra quando clicar em "Mostrar Todas"
      cidade_estado: true, // Coluna combinada (sempre visível)
      cidade: false, // Coluna separada (só quando mostra todas)
      estado: false, // Coluna separada (só quando mostra todas)
      sexo: showAllColumns, // Só mostra quando clicar em "Mostrar Todas"
      data_nascimento: showAllColumns, // Só mostra quando clicar em "Mostrar Todas"
      qualidade: isMobile ? false : true // Desktop mostra, mobile não (padrão)
    };
  });
  
  // Atualizar colunas quando showAllColumns mudar ou quando redimensionar a tela
  useEffect(() => {
    const updateColumns = () => {
      const userTypeName = localStorage.getItem('monitoramento_userData') 
        ? JSON.parse(localStorage.getItem('monitoramento_userData'))?.userTypeName?.toLowerCase() || ''
        : '';
      const isSupervisor = ['supervisor', 'adminfranquiadora', 'adminfranquia', 'adminunidade'].includes(userTypeName);
      const isMobile = window.innerWidth <= 768;
      
      if (showAllColumns) {
        // Mostrar todas as colunas
        setVisibleColumns({
          exportado: isSupervisor,
          duplicatas: isSupervisor,
          nome: true,
          email: true,
          whatsapp: true,
          cpf: true,
          total_compras: true,
          dias_ultima_compra: true,
          origens: true,
          cidade_estado: false, // Esconder coluna combinada quando mostra todas
          cidade: true, // Mostrar coluna separada
          estado: true, // Mostrar coluna separada
          sexo: true,
          data_nascimento: true,
          qualidade: true
        });
      } else {
        // Mostrar apenas colunas padrão
        setVisibleColumns({
          exportado: false,
          duplicatas: false,
          nome: true,
          email: isMobile ? false : true,
          whatsapp: true,
          cpf: isMobile ? false : true,
          total_compras: true,
          dias_ultima_compra: true,
          origens: false,
          cidade_estado: true, // Mostrar coluna combinada
          cidade: false,
          estado: false,
          sexo: false,
          data_nascimento: false,
          qualidade: isMobile ? false : true
        });
      }
    };
    
    updateColumns();
    
    // Adicionar listener para redimensionamento da janela
    const handleResize = () => {
      if (!showAllColumns) {
        updateColumns();
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [showAllColumns]);
  
  // Estados adicionais necessários
  const [showFilters, setShowFilters] = useState(true);
  const [showColumnSelector, setShowColumnSelector] = useState(false); // Painel de seleção de colunas
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

  const viewName = VIEW_MAP[tipo] || VIEW_MAP['1-29'];
  const pageTitle = TITLE_MAP[tipo] || TITLE_MAP['1-29'];

  useEffect(() => {
    // Só carregar dados se userData estiver disponível
    if (userData) {
      loadData();
      loadAvailableExportTags();
      loadAvailableDDDs();
    }
  }, [tipo, currentPage, itemsPerPage, sortField, sortDirection, filters, exportFilter, exportTagFilter, userData, isVendedor, isSupervisor, searchTerm, dataInicio, dataFim]);

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
        const idStr = String(id);
        // Buscar por id_lead ou id_cliente (caso o campo seja diferente)
        const exports = data.filter(e => {
          const eId = e.id_lead || e.id_cliente || e.id_cliente_mestre;
          return String(eId) === idStr;
        });
        if (exports.length > 0) {
          history[idStr] = exports;
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
        // Para dias_desde_ultima_compra (nome usado nas views de monitoramento), garantir ordenação numérica
        if (sortField === 'dias_desde_ultima_compra' || sortField === 'dias_sem_compra') {
          query = query.order(sortField, { ascending: sortDirection === 'asc', nullsFirst: false });
        } else {
          query = query.order(sortField, { ascending: sortDirection === 'asc' });
        }
      }
      
      const { data, count, error } = await query.range(start, end);
      
      if (error) throw error;
      
      // Filtrar no cliente (endereço)
      let filteredData = filterClientSideIfNeeded(data || []);
      
      // Carregar histórico de exportações
      const leadIds = filteredData.map(row => {
        // Tentar vários campos possíveis para o ID
        return row.id || row.id_lead || row.id_cliente_mestre || row.id_prime || row.prime_id;
      }).filter(Boolean);
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
      
      // Filtrar por origem exclusiva (apenas quem está APENAS na origem selecionada)
      if (filters.origins && filters.origins.length > 0) {
        filteredData = filterRowsByExclusiveOrigins(filteredData);
      }
      
      // Aplicar pesquisa (busca textual)
      if (searchTerm && searchTerm.trim() !== '') {
        filteredData = filterRowsBySearch(filteredData);
      }
      
      // Aplicar ordenação adicional se necessário
      let sorted = filteredData;
      
      // Se a ordenação do backend não for suficiente, aplicar ordenação adicional no cliente
      if (sortField === 'dias_sem_compra' || sortField === 'dias_desde_ultima_compra') {
        // Ordenação numérica para dias desde última compra
        sorted = [...filteredData].sort((a, b) => {
          // Tentar vários nomes de campo possíveis (dias_desde_ultima_compra é o nome usado nas views de monitoramento)
          const valA = parseInt(
            a.dias_desde_ultima_compra ||
            a.dias_sem_compra || 
            a.dias_desde_ultima || 
            a.dias_ultima_compra || 
            a.dias_ultima ||
            0
          ) || 0;
          const valB = parseInt(
            b.dias_desde_ultima_compra ||
            b.dias_sem_compra || 
            b.dias_desde_ultima || 
            b.dias_ultima_compra || 
            b.dias_ultima ||
            0
          ) || 0;
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
      // Filtrar apenas quem tem sexo válido (1 ou 2, ou 'MASC' ou 'FEM', ou 'M' ou 'F')
      query = query.or('sexo.eq.1,sexo.eq.2,sexo.ilike.MASC%,sexo.ilike.FEM%,sexo.ilike.M%,sexo.ilike.F%');
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
    // Filtro de data: filtrar por data da última compra (ultima_compra)
    if (dataInicio) {
      const inicioDate = new Date(dataInicio);
      inicioDate.setHours(0, 0, 0, 0);
      query = query.gte('ultima_compra', inicioDate.toISOString());
    }
    if (dataFim) {
      const fimDate = new Date(dataFim);
      fimDate.setHours(23, 59, 59, 999);
      query = query.lte('ultima_compra', fimDate.toISOString());
    }
    // Origens: NÃO filtrar aqui - será filtrado no cliente para garantir exclusividade
    // Isso permite filtrar apenas quem está EXCLUSIVAMENTE na origem selecionada
    // Removido o filtro de origens da query para fazer no cliente
    return query;
  };

  // Filtro cliente para endereço quando existir o campo
  const filterClientSideIfNeeded = (rows) => {
    if (!filters.hasEndereco) return rows;
    return rows.filter(r => {
      const rua = r.endereco || r.endereco_completo || r.endereco_rua || r.logradouro || r.endereco_rua;
      const cidadeEstado = (r.cidade && String(r.cidade).trim() !== '' && r.cidade !== '-') && 
                          (r.estado && String(r.estado).trim() !== '' && r.estado !== '-');
      const temRua = rua && String(rua).trim() !== '' && String(rua).trim() !== '-';
      // Deve ter RUA E (CIDADE OU ESTADO)
      return temRua && cidadeEstado;
    });
  };
  
  // Filtrar por origem exclusiva (apenas quem está APENAS na origem selecionada)
  const filterRowsByExclusiveOrigins = (rows) => {
    if (!filters.origins || filters.origins.length === 0) return rows;
    
    const normalizeOrigem = (o) => {
      if (!o) return null;
      const t = String(o).toLowerCase();
      if (t.includes('sprint')) return 'sprint';
      if (t.includes('prime')) return 'prime';
      if (t.includes('great') || t.includes('google')) return 'greatpage';
      if (t.includes('black')) return 'blacklabs';
      return t;
    };
    
    const getOriginsFromRow = (row) => {
      const origins = new Set();
      const origRaw = Array.isArray(row.origem_marcas) ? row.origem_marcas : [];
      
      // Adicionar origens do array
      origRaw.forEach(o => {
        const normalized = normalizeOrigem(o);
        if (normalized) origins.add(normalized);
      });
      
      // Adicionar origens dos campos booleanos/fallbacks
      if (row.no_prime || row.prime || row.id_prime) origins.add('prime');
      if (row.no_sprint || row.sprint || row.sprinthub || row.id_sprinthub) origins.add('sprint');
      if (row.no_greatpage || row.greatpage || row.google || row.id_greatpage) origins.add('greatpage');
      if (row.no_blacklabs || row.blacklabs || row.id_blacklabs) origins.add('blacklabs');
      
      return Array.from(origins);
    };
    
    return rows.filter(row => {
      const rowOrigins = getOriginsFromRow(row);
      
      // Se selecionou múltiplas origens, mostrar quem tem EXATAMENTE essas origens
      if (filters.origins.length > 1) {
        // Deve ter todas as origens selecionadas E não ter outras
        const hasAllSelected = filters.origins.every(orig => rowOrigins.includes(orig));
        const hasOnlySelected = rowOrigins.length === filters.origins.length;
        return hasAllSelected && hasOnlySelected;
      } else {
        // Se selecionou apenas uma origem, mostrar quem está APENAS nessa origem
        const selectedOrigin = filters.origins[0];
        return rowOrigins.length === 1 && rowOrigins.includes(selectedOrigin);
      }
    });
  };
  
  // Filtrar por pesquisa textual (busca global em todos os campos relevantes)
  const filterRowsBySearch = (rows) => {
    if (!searchTerm || searchTerm.trim() === '') return rows;
    
    const term = searchTerm.toLowerCase().trim();
    
    return rows.filter(row => {
      // Buscar em todos os campos relevantes simultaneamente
      const searchFields = [
        row.nome_completo || '',
        row.email || '',
        row.whatsapp || '',
        row.telefone || '',
        row.cpf || '',
        row.cidade || '',
        row.estado || '',
        // Também buscar no CPF sem formatação
        (row.cpf || '').replace(/\D/g, ''),
        // Buscar no telefone/WhatsApp sem formatação
        (row.whatsapp || '').replace(/\D/g, ''),
        (row.telefone || '').replace(/\D/g, '')
      ];
      
      // Verificar se o termo está em algum dos campos
      return searchFields.some(field => 
        String(field).toLowerCase().includes(term)
      );
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
      const views = ['vw_monitoramento_1_29_dias', 'vw_monitoramento_30_59_dias', 'vw_monitoramento_60_90_dias'];
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
    const exportPrefix = `monitoramento_${tipo}`;
    await exportSelected(selected, `${exportPrefix}_export_${new Date().toISOString().split('T')[0]}`);
    
    setShowExportModal(false);
    setExportObservacao('');
    setExportTag('');
    setSelectedRows([]);
    loadData();
  };

  const exportSelected = async (rows, baseName) => {
    if (!rows || rows.length === 0) return;
    
    setIsLoading(true);
    
    try {
      // Buscar dados de pedidos e orçamentos para cada cliente
      const clientIds = rows.map(r => {
        // Tentar obter id_prime de diferentes campos
        return r.id_prime || r.prime_id || r.id_cliente || r.id_cliente_mestre || null;
      }).filter(Boolean);
      
      const pedidosData = {};
      
      // Buscar pedidos e orçamentos em lote
      if (clientIds.length > 0) {
        const { data: allPedidos, error: pedidosError } = await supabase
          .schema('api')
          .from('prime_pedidos')
          .select('id, cliente_id, valor_total, data_criacao, data_aprovacao, data_entrega, status_aprovacao, status_geral, status_entrega, codigo_orcamento_original, id_orcamento')
          .in('cliente_id', clientIds)
          .order('data_criacao', { ascending: false });
        
        // Buscar fórmulas para todos os pedidos/orçamentos
        const pedidoIds = allPedidos?.map(p => p.id).filter(Boolean) || [];
        const orcamentoIds = allPedidos?.map(p => p.id_orcamento).filter(Boolean) || [];
        const allIds = [...new Set([...pedidoIds, ...orcamentoIds])];
        
        let allFormulas = [];
        if (allIds.length > 0) {
          const { data: formulasData, error: formulasError } = await supabase
            .schema('api')
            .from('prime_formulas')
            .select('id_pedido, id_orcamento, numero_formula, descricao, posologia, valor_formula')
            .in('id_pedido', allIds)
            .or(`id_orcamento.in.(${allIds.join(',')})`);
          
          if (!formulasError && formulasData) {
            allFormulas = formulasData;
          }
        }
        
        if (!pedidosError && allPedidos) {
          // Organizar por cliente
          clientIds.forEach(clienteId => {
            const pedidosCliente = allPedidos.filter(p => p.cliente_id === clienteId);
            
            // Último pedido aprovado/entregue
            const ultimoPedido = pedidosCliente.find(p => 
              p.status_aprovacao === 'APROVADO' || 
              p.status_geral === 'APROVADO' || 
              p.status_entrega === 'ENTREGUE'
            );
            
            // Último orçamento (não aprovado)
            const ultimoOrcamento = pedidosCliente.find(p => 
              p.status_aprovacao !== 'APROVADO' && 
              p.status_geral !== 'APROVADO' && 
              p.status_entrega !== 'ENTREGUE'
            );
            
            // Se não tem pedido, usar o último orçamento como referência
            const referencia = ultimoPedido || ultimoOrcamento;
            
            // Buscar fórmulas para o último pedido e orçamento
            const formulasPedido = ultimoPedido ? allFormulas.filter(f => 
              f.id_pedido === ultimoPedido.id || f.id_orcamento === ultimoPedido.id_orcamento
            ) : [];
            const formulasOrcamento = ultimoOrcamento ? allFormulas.filter(f => 
              f.id_pedido === ultimoOrcamento.id || f.id_orcamento === ultimoOrcamento.id_orcamento
            ) : [];
            
            pedidosData[clienteId] = {
              ultimoPedido: ultimoPedido ? { ...ultimoPedido, formulas: formulasPedido } : null,
              ultimoOrcamento: ultimoOrcamento ? { ...ultimoOrcamento, formulas: formulasOrcamento } : null,
              referencia // Último pedido ou orçamento (o que existir)
            };
          });
        }
      }
      
      const normalizeValue = (v) => {
        if (v == null) return '';
        if (Array.isArray(v)) return v.join(', ');
        if (v instanceof Date) return v.toISOString();
        if (typeof v === 'object') return JSON.stringify(v);
        return v;
      };
      
      // Função para adicionar código do país (55) nos telefones se solicitado
      const addCountryCode = (phone) => {
        if (!phone || phone === '') return '';
        const phoneStr = String(phone).replace(/\D/g, ''); // Remove caracteres não numéricos
        if (phoneStr.length === 0) return phone;
        
        // Se já começa com 55, não adicionar novamente
        if (phoneStr.startsWith('55') && phoneStr.length > 2) {
          return phoneStr;
        }
        
        // Se exportWithCountryCode está ativo, adicionar 55
        if (exportWithCountryCode) {
          return '55' + phoneStr;
        }
        
        return phoneStr;
      };
      
      // Função para formatar dados do pedido/orçamento de forma resumida
      const formatarDadosPedido = (pedido, tipo) => {
        if (!pedido) return '';
        
        const data = pedido.data_criacao ? new Date(pedido.data_criacao).toLocaleDateString('pt-BR') : '';
        const valor = pedido.valor_total ? `R$ ${parseFloat(pedido.valor_total).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '';
        const status = pedido.status_aprovacao || pedido.status_geral || pedido.status_entrega || '';
        const codigo = pedido.codigo_orcamento_original || '';
        
        // Formato resumido para o vendedor
        if (tipo === 'pedido') {
          return `Pedido ${codigo ? `#${codigo}` : ''} - ${data} - ${valor} - ${status}`.trim();
        } else {
          return `Orçamento ${codigo ? `#${codigo}` : ''} - ${data} - ${valor}`.trim();
        }
      };
      
      const normalizedRows = rows.map(r => {
        const out = {};
        const clienteId = r.id_prime || r.prime_id || r.id_cliente || r.id_cliente_mestre || null;
        const dadosPedidos = clienteId ? pedidosData[clienteId] : null;
        
        Object.keys(r || {}).forEach(k => {
          let value = normalizeValue(r[k]);
          
          // Se for whatsapp ou telefone e exportWithCountryCode estiver ativo, adicionar código do país
          if (exportWithCountryCode && (k === 'whatsapp' || k === 'telefone')) {
            value = addCountryCode(value);
          }
          
          out[k] = value;
        });
        
        // Adicionar campos de pedido/orçamento
        if (dadosPedidos) {
          // Último pedido (se existir)
          if (dadosPedidos.ultimoPedido) {
            const pedido = dadosPedidos.ultimoPedido;
            out['Ultimo_Pedido_Data'] = pedido.data_criacao ? new Date(pedido.data_criacao).toLocaleDateString('pt-BR') : '';
            out['Ultimo_Pedido_Valor'] = pedido.valor_total ? `R$ ${parseFloat(pedido.valor_total).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '';
            out['Ultimo_Pedido_Status'] = pedido.status_aprovacao || pedido.status_geral || pedido.status_entrega || '';
            out['Ultimo_Pedido_Codigo'] = pedido.codigo_orcamento_original || '';
            out['Ultimo_Pedido_Resumo'] = formatarDadosPedido(pedido, 'pedido');
          } else {
            out['Ultimo_Pedido_Data'] = '';
            out['Ultimo_Pedido_Valor'] = '';
            out['Ultimo_Pedido_Status'] = '';
            out['Ultimo_Pedido_Codigo'] = '';
            out['Ultimo_Pedido_Resumo'] = '';
          }
          
          // Último orçamento (se existir)
          if (dadosPedidos.ultimoOrcamento) {
            const orcamento = dadosPedidos.ultimoOrcamento;
            out['Ultimo_Orcamento_Data'] = orcamento.data_criacao ? new Date(orcamento.data_criacao).toLocaleDateString('pt-BR') : '';
            out['Ultimo_Orcamento_Valor'] = orcamento.valor_total ? `R$ ${parseFloat(orcamento.valor_total).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '';
            out['Ultimo_Orcamento_Codigo'] = orcamento.codigo_orcamento_original || '';
            out['Ultimo_Orcamento_Resumo'] = formatarDadosPedido(orcamento, 'orcamento');
          } else {
            out['Ultimo_Orcamento_Data'] = '';
            out['Ultimo_Orcamento_Valor'] = '';
            out['Ultimo_Orcamento_Codigo'] = '';
            out['Ultimo_Orcamento_Resumo'] = '';
          }
          
          // Referência (último pedido ou orçamento - o que existir)
          if (dadosPedidos.referencia) {
            const ref = dadosPedidos.referencia;
            const isPedido = ref.status_aprovacao === 'APROVADO' || ref.status_geral === 'APROVADO' || ref.status_entrega === 'ENTREGUE';
            out['Ultima_Referencia_Data'] = ref.data_criacao ? new Date(ref.data_criacao).toLocaleDateString('pt-BR') : '';
            out['Ultima_Referencia_Valor'] = ref.valor_total ? `R$ ${parseFloat(ref.valor_total).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '';
            out['Ultima_Referencia_Tipo'] = isPedido ? 'Pedido' : 'Orçamento';
            out['Ultima_Referencia_Resumo'] = isPedido ? formatarDadosPedido(ref, 'pedido') : formatarDadosPedido(ref, 'orcamento');
          } else {
            out['Ultima_Referencia_Data'] = '';
            out['Ultima_Referencia_Valor'] = '';
            out['Ultima_Referencia_Tipo'] = '';
            out['Ultima_Referencia_Resumo'] = '';
          }
        } else {
          // Se não encontrou dados, preencher com vazio
          out['Ultimo_Pedido_Data'] = '';
          out['Ultimo_Pedido_Valor'] = '';
          out['Ultimo_Pedido_Status'] = '';
          out['Ultimo_Pedido_Codigo'] = '';
          out['Ultimo_Pedido_Resumo'] = '';
          out['Ultimo_Orcamento_Data'] = '';
          out['Ultimo_Orcamento_Valor'] = '';
          out['Ultimo_Orcamento_Codigo'] = '';
          out['Ultimo_Orcamento_Resumo'] = '';
          out['Ultima_Referencia_Data'] = '';
          out['Ultima_Referencia_Valor'] = '';
          out['Ultima_Referencia_Tipo'] = '';
          out['Ultima_Referencia_Resumo'] = '';
        }
        
        return out;
      });
      
      // Se for formato Callix, transformar os dados para o formato específico
      if (exportFormat === 'callix') {
        const callixRows = rows.map(r => {
          const clienteId = r.id_prime || r.prime_id || r.id_cliente || r.id_cliente_mestre || null;
          const dadosPedidos = clienteId ? pedidosData[clienteId] : null;
          
          // Separar nome e sobrenome
          const nomeCompleto = r.nome_completo || '';
          const partesNome = nomeCompleto.trim().split(/\s+/);
          const nome = partesNome[0] || '';
          const sobrenome = partesNome.slice(1).join(' ') || '';
          
          // Determinar link
          const idSprint = r.id_sprinthub || r.sprinthub_id || r.id_sprint || r.idsprint || r.id_lead || r.lead_id;
          const origRaw = Array.isArray(r.origem_marcas) ? r.origem_marcas : [];
          const hasSprintOrigin = origRaw.some(o => {
            const t = String(o).toLowerCase();
            return t.includes('sprint');
          }) || r.no_sprint || r.sprinthub;
          
          let link = '';
          if (hasSprintOrigin && idSprint) {
            link = `https://oficialmed.sprinthub.app/sh/leads/profile/${idSprint}`;
          } else if (clienteId) {
            // Capturar domínio dinâmico
            const baseUrl = window.location.origin;
            const nomeEncoded = encodeURIComponent(nomeCompleto);
            // Salvar o caminho atual antes de criar o link
            sessionStorage.setItem('monitoramento_previous_path', window.location.pathname + window.location.search);
            link = `${baseUrl}/historico-compras?cliente_id=${clienteId}&nome=${nomeEncoded}`;
          }
          
          // Telefone SEM código 55 para Callix (remover 55 se existir)
          // Formato esperado: DDD + 9 dígitos (total 11 dígitos)
          // Se tiver apenas 8 dígitos após o DDD, adicionar "9" antes dos 8 dígitos
          const telefoneRaw = r.whatsapp || r.telefone || '';
          const telefone = telefoneRaw ? (() => {
            let phoneStr = String(telefoneRaw).replace(/\D/g, '');
            // Remover código 55 se existir no início
            if (phoneStr.startsWith('55') && phoneStr.length > 2) {
              phoneStr = phoneStr.substring(2);
            }
            
            // Se tiver pelo menos 2 dígitos (DDD), verificar se precisa adicionar o 9
            if (phoneStr.length >= 2) {
              const ddd = phoneStr.substring(0, 2); // Primeiros 2 dígitos são o DDD
              const numero = phoneStr.substring(2); // Resto do número
              
              // Se o número tiver exatamente 8 dígitos, adicionar "9" antes deles
              if (numero.length === 8) {
                phoneStr = ddd + '9' + numero; // DDD + 9 + 8 dígitos = 11 dígitos total
              }
              // Se já tiver 9 dígitos, manter como está (DDD + 9 dígitos = 11 dígitos total)
            }
            
            return phoneStr;
          })() : '';
          
          // Data-compra (formato dd-mm-yyyy)
          let dataCompra = '';
          if (dadosPedidos?.ultimoPedido?.data_criacao) {
            const data = new Date(dadosPedidos.ultimoPedido.data_criacao);
            const dd = String(data.getDate()).padStart(2, '0');
            const mm = String(data.getMonth() + 1).padStart(2, '0');
            const yyyy = data.getFullYear();
            dataCompra = `${dd}-${mm}-${yyyy}`;
          }
          
          // Formula: Pedido e orçamento resumidos juntos (com fórmulas - formato Opção 4)
          // IMPORTANTE: Sempre mostrar pedido aprovado primeiro, depois orçamento
          // O valor sempre vem do pedido aprovado (não do orçamento)
          let formula = '';
          if (dadosPedidos) {
            const partes = [];
            
            // Sempre mostrar pedido aprovado primeiro (se existir)
            if (dadosPedidos.ultimoPedido) {
              const pedidoObj = dadosPedidos.ultimoPedido;
              const dataPedido = pedidoObj.data_criacao ? new Date(pedidoObj.data_criacao).toLocaleDateString('pt-BR') : '';
              const valorPedido = pedidoObj.valor_total ? `R$ ${parseFloat(pedidoObj.valor_total).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '';
              const statusPedido = pedidoObj.status_aprovacao || pedidoObj.status_geral || pedidoObj.status_entrega || '';
              const codigoPedido = pedidoObj.codigo_orcamento_original || '';
              
              let pedidoStr = `Pedido ${codigoPedido ? `#${codigoPedido}` : ''} - ${dataPedido} - ${valorPedido} - ${statusPedido}`.trim();
              
              // Adicionar fórmulas se existirem (formato Opção 4: F#1: DESCRIÇÃO - POSOLOGIA - R$ VALOR)
              if (pedidoObj.formulas && pedidoObj.formulas.length > 0) {
                const formulasFormatadas = pedidoObj.formulas.map(f => {
                  const numFormula = f.numero_formula || '';
                  const descricao = f.descricao || 'Sem descrição';
                  const posologia = f.posologia || '';
                  const valorFormula = f.valor_formula ? `R$ ${parseFloat(f.valor_formula).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '';
                  
                  // Formato: F#1: DESCRIÇÃO - POSOLOGIA - R$ VALOR
                  let formulaStr = `F#${numFormula}: ${descricao}`;
                  if (posologia) {
                    formulaStr += ` - ${posologia}`;
                  }
                  if (valorFormula) {
                    formulaStr += ` - ${valorFormula}`;
                  }
                  return formulaStr;
                });
                
                pedidoStr += `\nFórmulas: ${formulasFormatadas.join(' | ')}`;
              }
              
              partes.push(pedidoStr);
            }
            
            // Depois mostrar orçamento (se existir e não for o mesmo que o pedido)
            // Orçamento pode aparecer depois do pedido, mas o valor sempre vem do pedido aprovado
            if (dadosPedidos.ultimoOrcamento) {
              const orcamento = dadosPedidos.ultimoOrcamento;
              const dataOrcamento = orcamento.data_criacao ? new Date(orcamento.data_criacao).toLocaleDateString('pt-BR') : '';
              const valorOrcamento = orcamento.valor_total ? `R$ ${parseFloat(orcamento.valor_total).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '';
              const codigoOrcamento = orcamento.codigo_orcamento_original || '';
              
              let orcamentoStr = `Orçamento ${codigoOrcamento ? `#${codigoOrcamento}` : ''} - ${dataOrcamento} - ${valorOrcamento}`.trim();
              
              // Adicionar fórmulas se existirem (formato Opção 4: F#1: DESCRIÇÃO - POSOLOGIA - R$ VALOR)
              if (orcamento.formulas && orcamento.formulas.length > 0) {
                const formulasFormatadas = orcamento.formulas.map(f => {
                  const numFormula = f.numero_formula || '';
                  const descricao = f.descricao || 'Sem descrição';
                  const posologia = f.posologia || '';
                  const valorFormula = f.valor_formula ? `R$ ${parseFloat(f.valor_formula).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '';
                  
                  // Formato: F#1: DESCRIÇÃO - POSOLOGIA - R$ VALOR
                  let formulaStr = `F#${numFormula}: ${descricao}`;
                  if (posologia) {
                    formulaStr += ` - ${posologia}`;
                  }
                  if (valorFormula) {
                    formulaStr += ` - ${valorFormula}`;
                  }
                  return formulaStr;
                });
                
                orcamentoStr += `\nFórmulas: ${formulasFormatadas.join(' | ')}`;
              }
              
              partes.push(orcamentoStr);
            }
            
            formula = partes.join(' | ');
          }
          
          // tipo-compra: "compra" se nunca comprou, "recompra" se comprou
          const totalCompras = r.total_pedidos || r.total_compras || 0;
          const tipoCompra = totalCompras > 0 ? 'recompra' : 'compra';
          
          // objetivo-cliente (se existir no banco)
          const objetivoCliente = r.objetivo_cliente || r.objetivo || '';
          
          return {
            Nome: nome,
            Sobrenome: sobrenome,
            link: link,
            email: r.email || '',
            telefone: telefone,
            cidade: r.cidade || '',
            estado: r.estado || '',
            'Data-compra': dataCompra,
            Observacao: exportObservacao || '',
            Formula: formula,
            'tipo-compra': tipoCompra,
            'objetivo-cliente': objetivoCliente
          };
        });
        
        // Criar arquivo CSV no formato Callix
        const callixHeaders = ['Nome', 'Sobrenome', 'link', 'email', 'telefone', 'cidade', 'estado', 'Data-compra', 'Observacao', 'Formula', 'tipo-compra', 'objetivo-cliente'];
        const csvRows = [
          callixHeaders.join(','),
          ...callixRows.map(row => callixHeaders.map(h => {
            const val = row[h] || '';
            const s = String(val).replace(/"/g, '""');
            return /[",\n]/.test(s) ? `"${s}"` : s;
          }).join(','))
        ];
        
        const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `${baseName}_callix.csv`;
        link.click();
        URL.revokeObjectURL(link.href);
        
        setIsLoading(false);
        return;
      }
      
      // Se for formato Sprinthub, transformar os dados para o formato específico
      if (exportFormat === 'sprinthub') {
        const sprinthubRows = rows.map(r => {
          const clienteId = r.id_prime || r.prime_id || r.id_cliente || r.id_cliente_mestre || null;
          const dadosPedidos = clienteId ? pedidosData[clienteId] : null;
          
          // Separar nome e sobrenome
          const nomeCompleto = r.nome_completo || '';
          const partesNome = nomeCompleto.trim().split(/\s+/);
          const nome = partesNome[0] || '';
          const sobrenome = partesNome.slice(1).join(' ') || '';
          
          // Título: prefixo + " | " + nome
          const titulo = `${sprinthubTituloPrefix || ''} | ${nome}`.trim();
          
          // Valor: sempre do último pedido aprovado (não do orçamento)
          // Se não tiver pedido aprovado, usar o orçamento como fallback
          let valor = '';
          if (dadosPedidos?.ultimoPedido?.valor_total) {
            // Sempre usar valor do pedido aprovado
            valor = parseFloat(dadosPedidos.ultimoPedido.valor_total).toFixed(2);
          } else if (dadosPedidos?.ultimoOrcamento?.valor_total) {
            // Fallback: usar orçamento apenas se não houver pedido aprovado
            valor = parseFloat(dadosPedidos.ultimoOrcamento.valor_total).toFixed(2);
          }
          
          // WhatsApp com DDI 55 (55 + DDD + número)
          const telefoneRaw = r.whatsapp || r.telefone || '';
          const telefone = telefoneRaw ? (() => {
            let phoneStr = String(telefoneRaw).replace(/\D/g, ''); // Remove caracteres não numéricos
            
            // Se já começa com 55, manter
            if (phoneStr.startsWith('55') && phoneStr.length > 2) {
              return phoneStr;
            }
            
            // Se não começa com 55, adicionar
            // Formato: 55 + DDD (2 dígitos) + número (9 dígitos)
            // Se o número já tem DDD, apenas adicionar 55
            if (phoneStr.length >= 10) {
              return '55' + phoneStr;
            }
            
            // Se o número não tem DDD completo, tentar adicionar
            // Assumindo que os primeiros 2 dígitos são o DDD
            if (phoneStr.length >= 9) {
              return '55' + phoneStr;
            }
            
            // Se não conseguir determinar, retornar com 55
            return '55' + phoneStr;
          })() : '';
          
          // Email
          const email = r.email || '';
          
          // Pedido: último pedido de forma resumida (igual ao Callix)
          let pedido = '';
          if (dadosPedidos) {
            const partes = [];
            
            if (dadosPedidos.ultimoPedido) {
              const pedidoObj = dadosPedidos.ultimoPedido;
              const dataPedido = pedidoObj.data_criacao ? new Date(pedidoObj.data_criacao).toLocaleDateString('pt-BR') : '';
              const valorPedido = pedidoObj.valor_total ? `R$ ${parseFloat(pedidoObj.valor_total).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '';
              const statusPedido = pedidoObj.status_aprovacao || pedidoObj.status_geral || pedidoObj.status_entrega || '';
              const codigoPedido = pedidoObj.codigo_orcamento_original || '';
              
              let pedidoStr = `Pedido ${codigoPedido ? `#${codigoPedido}` : ''} - ${dataPedido} - ${valorPedido} - ${statusPedido}`.trim();
              
              // Adicionar fórmulas se existirem (formato Opção 4: F#1: DESCRIÇÃO - POSOLOGIA - R$ VALOR)
              if (pedidoObj.formulas && pedidoObj.formulas.length > 0) {
                const formulasFormatadas = pedidoObj.formulas.map(f => {
                  const numFormula = f.numero_formula || '';
                  const descricao = f.descricao || 'Sem descrição';
                  const posologia = f.posologia || '';
                  const valorFormula = f.valor_formula ? `R$ ${parseFloat(f.valor_formula).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '';
                  
                  // Formato: F#1: DESCRIÇÃO - POSOLOGIA - R$ VALOR
                  let formulaStr = `F#${numFormula}: ${descricao}`;
                  if (posologia) {
                    formulaStr += ` - ${posologia}`;
                  }
                  if (valorFormula) {
                    formulaStr += ` - ${valorFormula}`;
                  }
                  return formulaStr;
                });
                
                pedidoStr += `\nFórmulas: ${formulasFormatadas.join(' | ')}`;
              }
              
              partes.push(pedidoStr);
            }
            
            if (dadosPedidos.ultimoOrcamento) {
              const orcamento = dadosPedidos.ultimoOrcamento;
              const dataOrcamento = orcamento.data_criacao ? new Date(orcamento.data_criacao).toLocaleDateString('pt-BR') : '';
              const valorOrcamento = orcamento.valor_total ? `R$ ${parseFloat(orcamento.valor_total).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '';
              const codigoOrcamento = orcamento.codigo_orcamento_original || '';
              
              let orcamentoStr = `Orçamento ${codigoOrcamento ? `#${codigoOrcamento}` : ''} - ${dataOrcamento} - ${valorOrcamento}`.trim();
              
              // Adicionar fórmulas se existirem (formato Opção 4: F#1: DESCRIÇÃO - POSOLOGIA - R$ VALOR)
              if (orcamento.formulas && orcamento.formulas.length > 0) {
                const formulasFormatadas = orcamento.formulas.map(f => {
                  const numFormula = f.numero_formula || '';
                  const descricao = f.descricao || 'Sem descrição';
                  const posologia = f.posologia || '';
                  const valorFormula = f.valor_formula ? `R$ ${parseFloat(f.valor_formula).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '';
                  
                  // Formato: F#1: DESCRIÇÃO - POSOLOGIA - R$ VALOR
                  let formulaStr = `F#${numFormula}: ${descricao}`;
                  if (posologia) {
                    formulaStr += ` - ${posologia}`;
                  }
                  if (valorFormula) {
                    formulaStr += ` - ${valorFormula}`;
                  }
                  return formulaStr;
                });
                
                orcamentoStr += `\nFórmulas: ${formulasFormatadas.join(' | ')}`;
              }
              
              partes.push(orcamentoStr);
            }
            
            pedido = partes.join(' | ');
          }
          
          return {
            etapa: sprinthubEtapa || '',
            vendedor: sprinthubVendedor || '',
            Valor: valor,
            Titulo: titulo,
            'Nome (Lead)': nome,
            'Sobrenome (Lead)': sobrenome,
            'WhatsApp (Lead)': telefone,
            'Email (Lead)': email,
            pedido: pedido
          };
        });
        
        // Criar arquivo Excel (.xlsx) no formato Sprinthub
        const sprinthubHeaders = ['etapa', 'vendedor', 'Valor', 'Titulo', 'Nome (Lead)', 'Sobrenome (Lead)', 'WhatsApp (Lead)', 'Email (Lead)', 'pedido'];
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(sprinthubRows);
        
        // Ajustar largura das colunas
        const colWidths = sprinthubHeaders.map((header, idx) => {
          if (header === 'pedido') return { wch: 100 }; // Coluna pedido muito larga
          if (header === 'Titulo' || header === 'Nome (Lead)' || header === 'Sobrenome (Lead)') return { wch: 25 };
          if (header === 'Email (Lead)') return { wch: 30 };
          if (header === 'WhatsApp (Lead)') return { wch: 15 };
          return { wch: 12 };
        });
        ws['!cols'] = colWidths;
        
        XLSX.utils.book_append_sheet(wb, ws, 'Sprinthub');
        XLSX.writeFile(wb, `${baseName}_sprinthub.xlsx`);
        
        setIsLoading(false);
        return;
      }
      
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
    } catch (error) {
      console.error('Erro ao exportar com dados de pedidos:', error);
      alert('Erro ao buscar dados de pedidos para exportação. Exportando sem essas informações.');
      // Fallback: exportar sem dados de pedidos
      exportSelectedFallback(rows, baseName);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Função fallback caso haja erro ao buscar pedidos
  const exportSelectedFallback = (rows, baseName) => {
    const normalizeValue = (v) => {
      if (v == null) return '';
      if (Array.isArray(v)) return v.join(', ');
      if (v instanceof Date) return v.toISOString();
      if (typeof v === 'object') return JSON.stringify(v);
      return v;
    };
    
    const addCountryCode = (phone) => {
      if (!phone || phone === '') return '';
      const phoneStr = String(phone).replace(/\D/g, '');
      if (phoneStr.length === 0) return phone;
      if (phoneStr.startsWith('55') && phoneStr.length > 2) return phoneStr;
      if (exportWithCountryCode) return '55' + phoneStr;
      return phoneStr;
    };
    
    const normalizedRows = rows.map(r => {
      const out = {};
      Object.keys(r || {}).forEach(k => {
        let value = normalizeValue(r[k]);
        if (exportWithCountryCode && (k === 'whatsapp' || k === 'telefone')) {
          value = addCountryCode(value);
        }
        out[k] = value;
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
    if (sexoNum === 1) return 'M';
    if (sexoNum === 2) return 'F';
    if (sexoNum === 0 || sexo === '0') return '';
    // Se for string, tentar normalizar
    const sexoStr = String(sexo).toUpperCase();
    if (sexoStr.includes('MASC') || sexoStr.includes('M')) return 'M';
    if (sexoStr.includes('FEM') || sexoStr.includes('F')) return 'F';
    return sexo;
  };

  // Formatar nome: apenas primeira letra maiúscula, limitar a 14 caracteres
  const formatNome = (nome) => {
    if (!nome || nome === 'SEM NOME') return '—';
    // Remover caixas altas e capitalizar apenas primeira letra de cada palavra
    const palavras = String(nome).toLowerCase().split(/\s+/);
    const nomeFormatado = palavras.map(p => {
      if (!p) return '';
      return p.charAt(0).toUpperCase() + p.slice(1);
    }).join(' ');
    return nomeFormatado;
  };

  // Truncar nome para 14 caracteres
  const truncateNome = (nome) => {
    const formatado = formatNome(nome);
    if (formatado.length <= 14) return formatado;
    return formatado.substring(0, 14) + '...';
  };

  // Copiar para clipboard
  const copyToClipboard = (text, label = 'Texto') => {
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      // Feedback visual (pode melhorar depois)
      const button = document.activeElement;
      if (button) {
        const originalTitle = button.title;
        button.title = '✓ Copiado!';
        setTimeout(() => {
          button.title = originalTitle;
        }, 2000);
      }
    }).catch(err => {
      console.error('Erro ao copiar:', err);
    });
  };

  const renderQualityBadge = (row) => {
    const score = row.qualidade_dados || 0;
    const qualityClass = score >= 80 ? 'high' : score >= 60 ? 'medium' : 'low';
    return (
      <span
        className={`cc-quality-badge cc-quality-${qualityClass}`}
        style={{ 
          cursor: 'pointer',
          padding: '2px 6px',
          fontSize: '11px',
          borderRadius: '4px',
          display: 'inline-block'
        }}
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
    if (!hasDuplicates) return null;
    return (
      <span
        style={{
          fontSize: '10px',
          fontWeight: 'bold',
          color: '#dc2626',
          padding: '1px 4px',
          borderRadius: '3px',
          backgroundColor: '#fee2e2',
          display: 'inline-block',
          whiteSpace: 'nowrap',
          lineHeight: '1.2'
        }}
        title={`${duplicatesData[clientId].length} duplicata(s) encontrada(s)`}
      >
        Dup.
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
    const labelMap = { 
      prime: 'P', 
      sprint: 'S', 
      greatpage: 'G', 
      blacklabs: 'B', 
      default: '?' 
    };
    const colorMap = {
      prime: '#2563eb',
      sprint: '#9333ea',
      greatpage: '#059669',
      blacklabs: '#dc2626',
      default: '#6b7280'
    };
    return (
      <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
        {origins.map((tag, i) => {
          const norm = normalize(tag);
          const label = labelMap[norm] || labelMap.default;
          const color = colorMap[norm] || colorMap.default;
          return (
            <span 
              key={i} 
              style={{
                backgroundColor: color,
                color: 'white',
                padding: '2px 6px',
                borderRadius: '4px',
                fontSize: '10px',
                fontWeight: 'bold',
                minWidth: '18px',
                textAlign: 'center',
                display: 'inline-block'
              }}
              title={norm === 'prime' ? 'Prime' : norm === 'sprint' ? 'Sprinthub' : norm === 'greatpage' ? 'GreatPage' : norm === 'blacklabs' ? 'BlackLabs' : tag}
            >
              {label}
            </span>
          );
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
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              backgroundColor: 'rgb(37, 99, 235)',
              color: 'white',
              fontSize: '10px',
              fontWeight: 'bold',
              border: 'none',
              cursor: 'pointer',
              transition: '0.2s',
              padding: '0px'
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
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                backgroundColor: 'rgb(147, 51, 234)',
                color: 'white',
                fontSize: '10px',
                fontWeight: 'bold',
                textDecoration: 'none',
                cursor: 'pointer',
                transition: '0.2s'
              }}
              title={`Abrir perfil no Sprinthub (ID: ${idSprint})`}
            >
              S
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

  const loadClientExportHistory = async (leadId) => {
    if (!leadId) return [];
    
    try {
      const { data, error } = await supabase
        .schema('api')
        .from('historico_exportacoes')
        .select('*')
        .eq('id_lead', leadId)
        .order('data_exportacao', { ascending: false });
      
      if (error) throw error;
      
      // Remover duplicatas exatas (mesmo id_lead, tag, motivo, observação e data similar)
      // Agrupar por tag, motivo, observação e data (dentro de 1 segundo)
      const uniqueExports = [];
      const seen = new Set();
      
      (data || []).forEach(exp => {
        // Criar chave única baseada em tag, motivo, observação e data (arredondada para segundo)
        const dataExp = exp.data_exportacao ? new Date(exp.data_exportacao) : null;
        const dataKey = dataExp ? Math.floor(dataExp.getTime() / 1000) : null;
        const key = `${exp.tag_exportacao || ''}_${exp.motivo || ''}_${exp.observacao || ''}_${dataKey}`;
        
        if (!seen.has(key)) {
          seen.add(key);
          uniqueExports.push(exp);
        }
      });
      
      return uniqueExports;
    } catch (error) {
      console.error('Erro ao carregar histórico de exportação:', error);
      return [];
    }
  };

  const handleExportIconClick = async (row) => {
    const leadId = row.id || row.id_lead || row.id_cliente_mestre || row.id_prime || row.prime_id;
    if (!leadId) return;
    
    setSelectedClientForHistory({
      id: leadId,
      nome: row.nome_completo || 'Sem nome'
    });
    
    const history = await loadClientExportHistory(leadId);
    setClientExportHistory(history);
    setShowExportHistoryModal(true);
  };

  const renderExportStatusIcon = (row) => {
    // Tentar vários campos possíveis para o ID
    const leadId = row.id || row.id_lead || row.id_cliente_mestre || row.id_prime || row.prime_id;
    if (!leadId) return null;
    
    // Converter para string para garantir match
    const leadIdStr = String(leadId);
    const hasExport = exportHistory[leadIdStr]?.length > 0;
    
    if (!hasExport) return null;
    
    return (
      <span
        onClick={(e) => {
          e.stopPropagation();
          handleExportIconClick(row);
        }}
        style={{
          fontSize: '10px',
          fontWeight: 'bold',
          color: '#22c55e',
          padding: '1px 4px',
          borderRadius: '3px',
          backgroundColor: '#dcfce7',
          display: 'inline-block',
          whiteSpace: 'nowrap',
          lineHeight: '1.2',
          textAlign: 'center',
          cursor: 'pointer',
          transition: 'all 0.2s ease'
        }}
        onMouseEnter={(e) => {
          e.target.style.backgroundColor = '#86efac';
          e.target.style.transform = 'scale(1.1)';
        }}
        onMouseLeave={(e) => {
          e.target.style.backgroundColor = '#dcfce7';
          e.target.style.transform = 'scale(1)';
        }}
        title={`Clique para ver histórico de ${exportHistory[leadIdStr].length} exportação(ões)`}
      >
        EX
      </span>
    );
  };

  const exportAllFromTable = async (baseName, tableName) => {
    try {
      setIsLoading(true);
      const { data } = await supabase.schema('api').from(tableName).select('*');
      await exportSelected(data || [], baseName);
    } catch (e) {
      console.error('Erro ao exportar tudo:', e);
      alert('Erro ao exportar.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderColumnSelector = () => {
    // Mostrar seletor para supervisor e vendedor
    if (!isSupervisor && !isVendedor) return null;
    
    return (
      <div className="cc-column-selector-bar" style={{ 
        marginBottom: '16px', 
        padding: '16px', 
        backgroundColor: '#1e293b', 
        borderRadius: '8px', 
        border: '2px solid #3b82f6',
        boxShadow: '0 4px 12px rgba(59, 130, 246, 0.2)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', flexWrap: 'wrap', gap: '12px' }}>
          <button 
            className="cc-btn cc-btn-small" 
            onClick={() => setShowColumnSelector(v => !v)}
            style={{ 
              backgroundColor: '#3b82f6', 
              color: 'white',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '15px',
              fontWeight: '600',
              boxShadow: '0 2px 8px rgba(59, 130, 246, 0.3)',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = '#2563eb';
              e.target.style.transform = 'scale(1.05)';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = '#3b82f6';
              e.target.style.transform = 'scale(1)';
            }}
          >
            {showColumnSelector ? '▼ Ocultar Seleção de Colunas' : '▶ Mostrar/Ocultar Colunas'}
          </button>
          <button
            className="cc-btn cc-btn-small"
            onClick={() => setShowAllColumns(!showAllColumns)}
            style={{ 
              backgroundColor: showAllColumns ? '#dc2626' : '#059669', 
              color: 'white',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '15px',
              fontWeight: '600',
              boxShadow: showAllColumns ? '0 2px 8px rgba(220, 38, 38, 0.3)' : '0 2px 8px rgba(5, 150, 105, 0.3)',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = showAllColumns ? '#b91c1c' : '#047857';
              e.target.style.transform = 'scale(1.05)';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = showAllColumns ? '#dc2626' : '#059669';
              e.target.style.transform = 'scale(1)';
            }}
          >
            {showAllColumns ? '🔼 Ocultar Colunas' : '🔽 Mostrar Todas'}
          </button>
        </div>
        
        {showColumnSelector && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '8px', paddingTop: '8px', borderTop: '1px solid #334155' }}>
            {isSupervisor && (
              <>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: '#e0e7ff', fontSize: '14px' }}>
                  <input
                    type="checkbox"
                    checked={visibleColumns.exportado}
                    onChange={(e) => setVisibleColumns(v => ({ ...v, exportado: e.target.checked }))}
                    style={{ cursor: 'pointer' }}
                  />
                  <span>EX</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: '#e0e7ff', fontSize: '14px' }}>
                  <input
                    type="checkbox"
                    checked={visibleColumns.duplicatas}
                    onChange={(e) => setVisibleColumns(v => ({ ...v, duplicatas: e.target.checked }))}
                    style={{ cursor: 'pointer' }}
                  />
                  <span>Dup.</span>
                </label>
              </>
            )}
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: '#e0e7ff', fontSize: '14px' }}>
              <input
                type="checkbox"
                checked={visibleColumns.nome}
                onChange={(e) => setVisibleColumns(v => ({ ...v, nome: e.target.checked }))}
                style={{ cursor: 'pointer' }}
              />
              <span>Nome</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: '#e0e7ff', fontSize: '14px' }}>
              <input
                type="checkbox"
                checked={visibleColumns.email}
                onChange={(e) => setVisibleColumns(v => ({ ...v, email: e.target.checked }))}
                style={{ cursor: 'pointer' }}
              />
              <span>Email</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: '#e0e7ff', fontSize: '14px' }}>
              <input
                type="checkbox"
                checked={visibleColumns.whatsapp}
                onChange={(e) => setVisibleColumns(v => ({ ...v, whatsapp: e.target.checked }))}
                style={{ cursor: 'pointer' }}
              />
              <span>Whats</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: '#e0e7ff', fontSize: '14px' }}>
              <input
                type="checkbox"
                checked={visibleColumns.cpf}
                onChange={(e) => setVisibleColumns(v => ({ ...v, cpf: e.target.checked }))}
                style={{ cursor: 'pointer' }}
              />
              <span>CPF</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: '#e0e7ff', fontSize: '14px' }}>
              <input
                type="checkbox"
                checked={visibleColumns.total_compras}
                onChange={(e) => setVisibleColumns(v => ({ ...v, total_compras: e.target.checked }))}
                style={{ cursor: 'pointer' }}
              />
              <span>Pedidos</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: '#e0e7ff', fontSize: '14px' }}>
              <input
                type="checkbox"
                checked={visibleColumns.dias_ultima_compra}
                onChange={(e) => setVisibleColumns(v => ({ ...v, dias_ultima_compra: e.target.checked }))}
                style={{ cursor: 'pointer' }}
              />
              <span>Período</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: '#e0e7ff', fontSize: '14px' }}>
              <input
                type="checkbox"
                checked={visibleColumns.origens}
                onChange={(e) => setVisibleColumns(v => ({ ...v, origens: e.target.checked }))}
                style={{ cursor: 'pointer' }}
              />
              <span>Origens</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: '#e0e7ff', fontSize: '14px' }}>
              <input
                type="checkbox"
                checked={visibleColumns.cidade}
                onChange={(e) => setVisibleColumns(v => ({ ...v, cidade: e.target.checked }))}
                style={{ cursor: 'pointer' }}
              />
              <span>Cidade</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: '#e0e7ff', fontSize: '14px' }}>
              <input
                type="checkbox"
                checked={visibleColumns.estado}
                onChange={(e) => setVisibleColumns(v => ({ ...v, estado: e.target.checked }))}
                style={{ cursor: 'pointer' }}
              />
              <span>Estado</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: '#e0e7ff', fontSize: '14px' }}>
              <input
                type="checkbox"
                checked={visibleColumns.sexo}
                onChange={(e) => setVisibleColumns(v => ({ ...v, sexo: e.target.checked }))}
                style={{ cursor: 'pointer' }}
              />
              <span>Sexo</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: '#e0e7ff', fontSize: '14px' }}>
              <input
                type="checkbox"
                checked={visibleColumns.data_nascimento}
                onChange={(e) => setVisibleColumns(v => ({ ...v, data_nascimento: e.target.checked }))}
                style={{ cursor: 'pointer' }}
              />
              <span>Nasc.</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: '#e0e7ff', fontSize: '14px' }}>
              <input
                type="checkbox"
                checked={visibleColumns.qualidade}
                onChange={(e) => setVisibleColumns(v => ({ ...v, qualidade: e.target.checked }))}
                style={{ cursor: 'pointer' }}
              />
              <span>Nota</span>
            </label>
          </div>
        )}
      </div>
    );
  };

  const renderFiltersBar = () => {
    // Mostrar filtros para supervisor e vendedor
    if (!isSupervisor && !isVendedor) return null;
    
    // Modo vendedor: mostrar o filtro de tag de exportação e campo de busca
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
                  setSearchTerm('');
                  setCurrentPage(1);
                  loadData();
                }}>Limpar</button>
              </div>
            </div>
            {/* Barra de Pesquisa para vendedor */}
            <div className="cc-filters-row" style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #334155' }}>
              <div className="cc-filter-item" style={{ flex: 1, display: 'flex', gap: '8px', alignItems: 'center' }}>
                <span style={{ whiteSpace: 'nowrap' }}>🔍 Buscar em todos os campos:</span>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  placeholder="Digite para buscar em Nome, Email, WhatsApp, Telefone, CPF, Cidade, Estado..."
                  className="cc-input"
                  style={{ 
                    flex: 1, 
                    minWidth: '300px',
                    padding: '8px 12px',
                    backgroundColor: '#1e293b',
                    color: '#e0e7ff',
                    border: '1px solid #475569',
                    borderRadius: '6px',
                    fontSize: '14px',
                    outline: 'none'
                  }}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      loadData();
                    }
                  }}
                />
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
            </div>
            <div className="cc-filters-row">
              <div className="cc-filter-item">
                <span>Data Início:</span>
                <input
                  type="date"
                  value={dataInicio}
                  onChange={(e) => setDataInicio(e.target.value)}
                  className="cc-input cc-input-small"
                  placeholder="Data início"
                />
              </div>
              <div className="cc-filter-item">
                <span>Data Fim:</span>
                <input
                  type="date"
                  value={dataFim}
                  onChange={(e) => setDataFim(e.target.value)}
                  className="cc-input cc-input-small"
                  placeholder="Data fim"
                />
              </div>
              <div className="cc-filter-item">
                <button className="cc-btn cc-btn-small" onClick={() => { setCurrentPage(1); loadData(); }}>
                  Aplicar
                </button>
                <button className="cc-btn cc-btn-small" onClick={() => {
                  setFilters({ hasCpf: false, hasEmail: false, hasEndereco: false, hasSexo: false, hasDataNascimento: false, phoneStatus: 'any', ddd: '', origins: [] });
                  setExportTagFilter('all');
                  setSearchTerm('');
                  setDataInicio('');
                  setDataFim('');
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
            {/* Barra de Pesquisa */}
            <div className="cc-filters-row" style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #334155' }}>
              <div className="cc-filter-item" style={{ flex: 1, display: 'flex', gap: '8px', alignItems: 'center' }}>
                <span style={{ whiteSpace: 'nowrap' }}>🔍 Buscar em todos os campos:</span>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  placeholder="Digite para buscar em Nome, Email, WhatsApp, Telefone, CPF, Cidade, Estado..."
                  className="cc-input"
                  style={{ 
                    flex: 1, 
                    minWidth: '300px',
                    padding: '8px 12px',
                    backgroundColor: '#1e293b',
                    color: '#e0e7ff',
                    border: '1px solid #475569',
                    borderRadius: '6px',
                    fontSize: '14px',
                    outline: 'none'
                  }}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      loadData();
                    }
                  }}
                />
                {searchTerm && (
                  <button
                    className="cc-btn cc-btn-small"
                    onClick={() => {
                      setSearchTerm('');
                      setCurrentPage(1);
                      loadData();
                    }}
                    style={{ backgroundColor: '#dc2626', color: 'white', padding: '8px 12px' }}
                    title="Limpar busca"
                  >
                    ✕ Limpar
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
    const tableWrapperRef = React.useRef(null);
    const [needsHorizontalScroll, setNeedsHorizontalScroll] = React.useState(true);
    const topScrollRef = React.useRef(null);
    
    // Sincronizar scroll horizontal entre topo e tabela (apenas quando necessário)
    React.useEffect(() => {
      const tableWrapper = tableWrapperRef.current;
      const topScroll = topScrollRef.current;
      
      if (!tableWrapper || !topScroll || !needsHorizontalScroll) return;
      
      const handleScroll = () => {
        if (topScroll) {
          topScroll.scrollLeft = tableWrapper.scrollLeft;
        }
      };
      
      const handleTopScroll = () => {
        if (tableWrapper) {
          tableWrapper.scrollLeft = topScroll.scrollLeft;
        }
      };
      
      tableWrapper.addEventListener('scroll', handleScroll);
      if (topScroll) {
        topScroll.addEventListener('scroll', handleTopScroll);
      }
      
      return () => {
        tableWrapper.removeEventListener('scroll', handleScroll);
        if (topScroll) {
          topScroll.removeEventListener('scroll', handleTopScroll);
        }
      };
    }, [data, needsHorizontalScroll]);
    
    const allColumns = [
      // Checkbox de seleção (sempre visível para supervisor)
      ...(isSupervisor ? [{ header: '', key: 'checkbox', render: () => null, isCheckbox: true }] : []),
      // Apenas supervisor vê colunas de exportado e duplicatas
      ...(isSupervisor ? [
        { 
          header: 'EX', 
          key: 'exportado', 
          render: (row) => {
            const icon = renderExportStatusIcon(row);
            return icon || <span style={{ display: 'inline-block', width: '100%', textAlign: 'center' }}>-</span>;
          }
        },
        { 
          header: 'Dup.', 
          key: 'duplicatas', 
          render: (row) => {
            const icon = renderDuplicatesIcon(row);
            return icon || <span style={{ display: 'inline-block', width: '100%', textAlign: 'center' }}>-</span>;
          }
        }
      ] : []),
      { header: 'Nome', key: 'nome', sortField: 'nome_completo', render: (row) => {
        const nomeCompleto = formatNome(row.nome_completo || 'SEM NOME');
        const nomeTruncado = truncateNome(row.nome_completo || 'SEM NOME');
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              title={nomeCompleto}
              style={{ cursor: 'help' }}
            >
              {nomeTruncado}
            </span>
            {isSupervisor && (
              <>
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
              </>
            )}
          </div>
        );
      } },
      { 
        header: 'Email', 
        key: 'email', 
        field: 'email',
        render: (row) => {
          const email = row.email || '';
          if (!email) return '-';
          return (
            <button
              onClick={(e) => {
                e.stopPropagation();
                copyToClipboard(email, 'Email');
              }}
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: '4px',
                display: 'inline-flex',
                alignItems: 'center',
                color: '#e0e7ff'
              }}
              title={email}
            >
              <Mail size={16} />
            </button>
          );
        }
      },
      { 
        header: 'Whats', 
        key: 'whatsapp', 
        field: 'whatsapp',
        render: (row) => {
          const whatsapp = row.whatsapp || row.telefone || '';
          if (!whatsapp) return '-';
          return (
            <button
              onClick={(e) => {
                e.stopPropagation();
                copyToClipboard(whatsapp, 'WhatsApp');
              }}
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: '4px',
                display: 'inline-flex',
                alignItems: 'center',
                color: '#25d366'
              }}
              title={whatsapp}
            >
              <MessageCircle size={16} />
            </button>
          );
        }
      },
      { 
        header: 'CPF', 
        key: 'cpf', 
        field: 'cpf',
        render: (row) => {
          const cpf = row.cpf || '';
          if (!cpf) return '-';
          return (
            <button
              onClick={(e) => {
                e.stopPropagation();
                copyToClipboard(cpf, 'CPF');
              }}
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: '4px',
                display: 'inline-flex',
                alignItems: 'center',
                color: '#e0e7ff'
              }}
              title={cpf}
            >
              <FileText size={16} />
            </button>
          );
        }
      },
      { 
        header: 'Pedidos', 
        key: 'total_compras',
        field: 'total_pedidos', // A view retorna total_pedidos
        render: (row) => {
          const totalCompras = row.total_pedidos || row.total_compras || 0;
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
                // Salvar o caminho atual antes de navegar
                sessionStorage.setItem('monitoramento_previous_path', window.location.pathname + window.location.search);
                // Navegar na mesma janela ao invés de abrir nova
                navigate(url);
              }}
              title="Clique para ver histórico completo de compras"
              style={{ cursor: 'pointer', color: '#3b82f6', textDecoration: 'underline' }}
            >
              {totalCompras}
            </span>
          );
        }
      },
      { 
        header: 'Período', 
        key: 'dias_ultima_compra', 
        sortField: 'dias_desde_ultima_compra', 
        field: 'dias_desde_ultima_compra',
        render: (row) => {
          // As views de monitoramento retornam 'dias_desde_ultima_compra'
          const dias = row.dias_desde_ultima_compra || row.dias_sem_compra || row.dias_desde_ultima || row.dias_ultima_compra || null;
          if (dias === null || dias === undefined || dias === '') return '-';
          const diasNum = parseInt(dias) || 0;
          return `${diasNum} dias`;
        }
      },
      { header: 'Origens', key: 'origens', render: (row) => renderOriginsBadges(row) },
      { 
        header: 'Cidade/Estado', 
        key: 'cidade_estado', 
        render: (row) => {
          const cidade = row.cidade || '';
          const estado = row.estado || '';
          if (!cidade && !estado) return '-';
          if (cidade && estado) return `${cidade}/${estado}`;
          return cidade || estado;
        }
      },
      { header: 'Cidade', key: 'cidade', sortField: 'cidade', field: 'cidade', render: (row) => row.cidade || '-' },
      { header: 'Estado', key: 'estado', sortField: 'estado', field: 'estado', render: (row) => row.estado || '-' },
      { header: 'Sexo', key: 'sexo', render: (row) => formatSexo(row.sexo) },
      { header: 'Nasc.', key: 'data_nascimento', field: 'data_nascimento', render: (row) => row.data_nascimento ? new Date(row.data_nascimento).toLocaleDateString('pt-BR') : '-' },
      { header: 'Nota', key: 'qualidade', sortField: 'qualidade_dados', render: renderQualityBadge }
    ];
    
    // Filtrar colunas baseado em visibleColumns
    const columns = allColumns.filter(col => {
      if (col.isCheckbox) return true; // Checkbox sempre mostra
      if (!col.key) return true; // Colunas sem key sempre mostram
      return visibleColumns[col.key] !== false;
    });

    // Calcular largura mínima baseada nas colunas visíveis
    const calculateMinWidth = () => {
      const columnWidths = {
        checkbox: 24,
        exportado: 20,
        duplicatas: 25,
        nome: 120,
        email: 40,
        whatsapp: 50,
        cpf: 30,
        total_compras: 50,
        dias_ultima_compra: 50,
        origens: 40,
        cidade_estado: 80, // Coluna combinada
        cidade: 50,
        estado: 50,
        sexo: 50,
        data_nascimento: 50,
        qualidade: 50
      };

      let totalWidth = 0;
      
      // Adicionar checkbox se for supervisor
      if (isSupervisor) {
        totalWidth += columnWidths.checkbox;
      }
      
      // Adicionar larguras das colunas visíveis
      columns.forEach(col => {
        if (col.isCheckbox) return;
        if (col.key && columnWidths[col.key]) {
          totalWidth += columnWidths[col.key];
        }
      });
      
      return totalWidth || 1600; // Mínimo de 1600px se não houver colunas
    };

    const minTableWidth = calculateMinWidth();

    // Verificar se precisa de scroll horizontal
    React.useEffect(() => {
      const checkScroll = () => {
        if (tableWrapperRef.current) {
          const wrapper = tableWrapperRef.current;
          // Usar setTimeout para garantir que o DOM foi atualizado
          setTimeout(() => {
            const needsScroll = wrapper.scrollWidth > wrapper.clientWidth + 10; // +10 para margem de erro
            setNeedsHorizontalScroll(needsScroll);
          }, 100);
        }
      };

      checkScroll();
      const resizeObserver = new ResizeObserver(checkScroll);
      if (tableWrapperRef.current) {
        resizeObserver.observe(tableWrapperRef.current);
      }

      // Também verificar quando a tabela for renderizada
      const checkInterval = setInterval(checkScroll, 200);
      setTimeout(() => clearInterval(checkInterval), 2000); // Limpar após 2 segundos

      return () => {
        resizeObserver.disconnect();
        clearInterval(checkInterval);
      };
    }, [columns, visibleColumns, minTableWidth, data]);

    return (
      <div style={{ position: 'relative', width: '100%' }}>
        {/* Barra de rolagem horizontal no topo - mesma cor da de baixo */}
        {needsHorizontalScroll && (
          <div
            ref={topScrollRef}
            className="cc-top-scrollbar"
            style={{
              position: 'sticky',
              top: 0,
              left: 0,
              width: '100%',
              height: '17px',
              overflowX: 'auto',
              overflowY: 'hidden',
              backgroundColor: 'transparent',
              zIndex: 100,
              marginBottom: '4px',
              scrollbarWidth: 'thin',
              scrollbarColor: '#cbd5e1 #0f172a'
            }}
          >
            <div style={{ height: '1px', minWidth: `${minTableWidth}px` }}></div>
          </div>
        )}
        <div className="cc-table-wrapper" ref={tableWrapperRef} style={{ width: '100%', overflowX: 'auto' }}>
          <table className="cc-table cc-table-list" style={{ minWidth: `${minTableWidth}px` }}>
          <thead>
            <tr>
              {columns.map((col, idx) => {
                // Se for checkbox, renderizar checkbox de seleção no header
                if (col.isCheckbox && isSupervisor) {
                  return (
                    <th key={idx}>
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
                  );
                }
                // Se não for checkbox, renderizar header normal
                return (
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
                );
              })}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={columns.length} style={{ textAlign: 'center', padding: '20px' }}>
                  Carregando...
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} style={{ textAlign: 'center', padding: '20px' }}>
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
                    {columns.map((col, colIdx) => {
                      // Se for checkbox, renderizar checkbox de seleção
                      if (col.isCheckbox && isSupervisor) {
                        return (
                          <td key={colIdx}>
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
                        );
                      }
                      // Se não for checkbox, renderizar célula normal
                      return (
                        <td key={colIdx} onClick={(e) => {
                          if (e.target.tagName === 'BUTTON' || e.target.tagName === 'A' || e.target.closest('button') || e.target.closest('a')) {
                            e.stopPropagation();
                          }
                        }}>
                          {col.render ? col.render(row) : (row[col.field] ?? '-')}
                        </td>
                      );
                    })}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
        </div>
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
    document.body.classList.add('monitoramento-page-active');
    document.documentElement.classList.add('monitoramento-page-active');
    
    return () => {
      // Remover classe ao desmontar
      document.body.classList.remove('monitoramento-page-active');
      document.documentElement.classList.remove('monitoramento-page-active');
    };
  }, []);

  return (
    <div className="monitoramento-dashboard-fullscreen">
      <MonitoramentoMenu />
      <div className="monitoramento-dashboard-content">
        <div className="cc-list-container">
          <div className="cc-list-header">
            <h2>{pageTitle}</h2>
            {isSupervisor && (
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <select className="cc-select cc-select-small" value={exportFormat} onChange={(e) => setExportFormat(e.target.value)}>
                  <option value="csv">CSV</option>
                  <option value="excel">Excel (.xls)</option>
                  <option value="xlsx">XLSX</option>
                  <option value="callix">Callix</option>
                  <option value="sprinthub">Sprinthub</option>
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
                  onClick={() => exportAllFromTable(`monitoramento_${tipo}`, viewName)} 
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
          
          {/* Botão Mostrar Todas (sempre visível) */}
          <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'flex-end' }}>
            <button
              onClick={() => setShowAllColumns(!showAllColumns)}
              style={{ 
                backgroundColor: showAllColumns ? '#dc2626' : '#059669', 
                color: 'white',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '600',
                boxShadow: showAllColumns ? '0 2px 8px rgba(220, 38, 38, 0.3)' : '0 2px 8px rgba(5, 150, 105, 0.3)',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = showAllColumns ? '#b91c1c' : '#047857';
                e.target.style.transform = 'scale(1.05)';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = showAllColumns ? '#dc2626' : '#059669';
                e.target.style.transform = 'scale(1)';
              }}
            >
              {showAllColumns ? '🔼 Ocultar Colunas' : '🔽 Mostrar Todas'}
            </button>
          </div>
          
          {/* Seletor de Colunas */}
          {renderColumnSelector()}
          
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
              {exportFormat !== 'sprinthub' && (
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={exportWithCountryCode}
                      onChange={(e) => setExportWithCountryCode(e.target.checked)}
                      style={{ cursor: 'pointer' }}
                    />
                    <span>Adicionar código do país (55) nos telefones</span>
                  </label>
                  <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px', marginLeft: '24px' }}>
                    Exemplo: 6984383079 → 556984383079
                  </div>
                </div>
              )}
              
              {/* Campos específicos para Sprinthub */}
              {exportFormat === 'sprinthub' && (
                <>
                  <div style={{ marginBottom: '16px', padding: '12px', backgroundColor: '#1e293b', borderRadius: '6px', border: '1px solid #334155' }}>
                    <h4 style={{ marginTop: 0, marginBottom: '12px', color: '#e0e7ff' }}>Configurações Sprinthub</h4>
                    <div style={{ marginBottom: '12px' }}>
                      <label style={{ display: 'block', marginBottom: '4px', color: '#cbd5e1' }}>Etapa:</label>
                      <input 
                        type="number" 
                        value={sprinthubEtapa} 
                        onChange={(e) => setSprinthubEtapa(e.target.value)}
                        placeholder="167"
                        className="cc-input"
                        style={{ width: '100%' }}
                      />
                    </div>
                    <div style={{ marginBottom: '12px' }}>
                      <label style={{ display: 'block', marginBottom: '4px', color: '#cbd5e1' }}>ID do Vendedor:</label>
                      <input 
                        type="number" 
                        value={sprinthubVendedor} 
                        onChange={(e) => setSprinthubVendedor(e.target.value)}
                        placeholder="229"
                        className="cc-input"
                        style={{ width: '100%' }}
                      />
                    </div>
                    <div style={{ marginBottom: '12px' }}>
                      <label style={{ display: 'block', marginBottom: '4px', color: '#cbd5e1' }}>Prefixo do Título:</label>
                      <input 
                        type="text" 
                        value={sprinthubTituloPrefix} 
                        onChange={(e) => setSprinthubTituloPrefix(e.target.value)}
                        placeholder="MONITORAMENTO 28-7 05-8"
                        className="cc-input"
                        style={{ width: '100%' }}
                      />
                      <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>
                        O título será: "{sprinthubTituloPrefix || '[PREFIXO]'} | [Nome do Cliente]"
                      </div>
                    </div>
                  </div>
                </>
              )}
              
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

export default MonitoramentoBasePage;

