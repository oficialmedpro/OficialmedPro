import { createClient } from '@supabase/supabase-js'
import { getTodayDateSP, getStartOfDaySP, getEndOfDaySP } from '../utils/utils.js'
// ❌ REMOVIDO: import { getGoogleAdsOriginFilter } from './googleOriginFilter';
// O googleOriginFilter não é usado neste arquivo, então não precisa ser importado
// Isso evita carregar dependências desnecessárias na página de vendas
import { supabaseUrl, supabaseServiceKey, supabaseSchema } from '../config/supabase.js'

// Validar URLs antes de criar cliente
let validSupabaseUrl = supabaseUrl;
let validSupabaseServiceKey = supabaseServiceKey;

// Validar URL antes de usar
if (!validSupabaseUrl || typeof validSupabaseUrl !== 'string' || !validSupabaseUrl.startsWith('http')) {
  console.error('❌ [supabase.js] URL inválida:', validSupabaseUrl);
  validSupabaseUrl = 'https://agdffspstbxeqhqtltvb.supabase.co';
}

try {
  new URL(validSupabaseUrl);
} catch (e) {
  console.error('❌ [supabase.js] Erro ao validar URL:', e.message);
  validSupabaseUrl = 'https://agdffspstbxeqhqtltvb.supabase.co';
}

// Cliente Supabase com service role key (permite acesso a todos os schemas)
// Já configura o schema e os headers necessários para evitar erro 406 no PostgREST
export const supabase = createClient(validSupabaseUrl, validSupabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  },
  db: {
    schema: supabaseSchema || 'api'
  },
  global: {
    headers: {
      'Accept-Profile': supabaseSchema || 'api',
      'Content-Profile': supabaseSchema || 'api'
    }
  }
})

// Função para obter o cliente com schema específico
// Cache de clientes Supabase para evitar múltiplas instâncias
const supabaseClients = new Map();

export const getSupabaseWithSchema = (schema) => {
  const schemaKey = schema || 'api';
  
  // Verificar se já existe um cliente para este schema
  if (supabaseClients.has(schemaKey)) {
    console.log('✅ [getSupabaseWithSchema] Cliente já existe no cache para schema:', schemaKey);
    return supabaseClients.get(schemaKey);
  }
  
  console.log('🔧 [getSupabaseWithSchema] Criando novo cliente Supabase...');
  console.log('🔍 [getSupabaseWithSchema] Configuração:', {
    schema: schemaKey,
    url: validSupabaseUrl ? `${validSupabaseUrl.substring(0, 30)}...` : 'NÃO DEFINIDA',
    hasServiceKey: !!validSupabaseServiceKey,
    serviceKeyLength: validSupabaseServiceKey?.length || 0
  });
  
  const client = createClient(validSupabaseUrl, validSupabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    },
    // Define o schema do PostgREST corretamente
    db: {
      schema: schemaKey
    },
    // Garante os headers também (algumas versões do SDK dependem desses)
    global: {
      headers: {
        'Accept-Profile': schemaKey,
        'Content-Profile': schemaKey
      }
    }
  });
  
  console.log('✅ [getSupabaseWithSchema] Cliente criado com sucesso');
  console.log('🔍 [getSupabaseWithSchema] Headers configurados:', {
    'Accept-Profile': schemaKey,
    'Content-Profile': schemaKey
  });
  
  // Armazenar no cache
  supabaseClients.set(schemaKey, client);
  return client;
}

// Função para testar a conexão
export const testConnection = async () => {
  try {
    console.log('🔌 Testando conexão com Supabase...')
    console.log('URL:', supabaseUrl)
    console.log('Schema:', supabaseSchema)
    console.log('Service Key:', supabaseServiceKey ? '✅ Configurada' : '❌ Não configurada')
    
    // Testar conexão básica com schema específico
    const supabaseWithSchema = getSupabaseWithSchema(supabaseSchema)
    const { data, error } = await supabaseWithSchema
      .from('oportunidade_sprint')
      .select('count')
      .limit(1)
    
    if (error) {
      console.log('❌ Erro ao conectar:', error)
      return false
    }
    
    console.log('✅ Conexão realizada com sucesso')
    return true
  } catch (error) {
    console.error('❌ Erro na conexão:', error)
    return false
  }
}

// Funções básicas do supabase (não relacionadas ao FilterBar)
export const getOportunidadesSprint = async (limit = 10) => {
  try {
    const supabaseWithSchema = getSupabaseWithSchema(supabaseSchema)
    const { data, error } = await supabaseWithSchema
      .from('oportunidade_sprint')
      .select('*')
      .limit(limit)
    
    if (error) {
      console.error('❌ Erro ao buscar oportunidades:', error)
      throw error
    }
    
    return data
  } catch (error) {
    console.error('❌ Erro ao buscar oportunidades Sprint:', error)
    throw error
  }
}

export const getOportunidadesPorStatus = async (status, limit = 20) => {
  try {
    const supabaseWithSchema = getSupabaseWithSchema(supabaseSchema)
    const { data, error } = await supabaseWithSchema
      .from('oportunidade_sprint')
      .select('*')
      .eq('status', status)
      .limit(limit)
    
    if (error) throw error
    return data
  } catch (error) {
    console.error('❌ Erro ao buscar oportunidades por status:', error)
    throw error
  }
}

export const getOportunidadesPorUnidade = async (unidadeId, limit = 20) => {
  try {
    const supabaseWithSchema = getSupabaseWithSchema(supabaseSchema)
    const { data, error } = await supabaseWithSchema
      .from('oportunidade_sprint')
      .select('*')
      .eq('unidade_id', unidadeId)
      .limit(limit)
    
    if (error) throw error
    return data
  } catch (error) {
    console.error('❌ Erro ao buscar oportunidades por unidade:', error)
    throw error
  }
}

export const getEstatisticasOportunidades = async () => {
  try {
    const supabaseWithSchema = getSupabaseWithSchema(supabaseSchema)
    
    const { data: abertas } = await supabaseWithSchema
      .from('oportunidade_sprint')
      .select('id')
      .eq('status', 'open')
    
    const { data: fechadas } = await supabaseWithSchema
      .from('oportunidade_sprint')
      .select('id')
      .eq('status', 'won')
    
    const { data: perdidas } = await supabaseWithSchema
      .from('oportunidade_sprint')
      .select('id')
      .eq('status', 'lost')
    
    return {
      abertas: abertas?.length || 0,
      fechadas: fechadas?.length || 0,
      perdidas: perdidas?.length || 0
    }
  } catch (error) {
    console.error('❌ Erro ao buscar estatísticas:', error)
    throw error
  }
}

/**
 * 📄 FUNÇÃO PARA BUSCAR TODOS OS REGISTROS COM PAGINAÇÃO RECURSIVA
 * 
 * @param {string} url - URL base da query
 * @param {Object} headers - Headers da requisição
 * @returns {Array} Todos os registros encontrados
 */
const fetchAllRecords = async (url, headers) => {
  const pageSize = 1000;
  let allRecords = [];
  let offset = 0;
  let hasMore = true;

  console.log('📄 Supabase: Iniciando paginação para URL:', url);

  while (hasMore) {
    const paginatedUrl = `${url}`;
    const paginationHeaders = {
      ...headers,
      'Range': `${offset}-${offset + pageSize - 1}`
    };

    try {
      const response = await fetch(paginatedUrl, {
        method: 'GET',
        headers: paginationHeaders
      });

      if (!response.ok) {
        console.error(`❌ Supabase: Erro na página ${Math.floor(offset / pageSize) + 1}:`, response.status);
        break;
      }

      const pageData = await response.json();
      allRecords = allRecords.concat(pageData);

      console.log(`📄 Supabase: Página ${Math.floor(offset / pageSize) + 1}: ${pageData.length} registros | Total: ${allRecords.length}`);

      if (pageData.length < pageSize) {
        hasMore = false;
      } else {
        offset += pageSize;
      }

      const contentRange = response.headers.get('Content-Range');
      if (contentRange) {
        const match = contentRange.match(/(\d+)-(\d+)\/(\d+|\*)/);
        if (match) {
          const [, , end, total] = match;
          if (total !== '*' && parseInt(end) >= parseInt(total) - 1) {
            hasMore = false;
          }
        }
      }

    } catch (error) {
      console.error(`❌ Supabase: Erro ao buscar página ${Math.floor(offset / pageSize) + 1}:`, error);
      break;
    }
  }

  console.log(`✅ Supabase: Paginação concluída: ${allRecords.length} registros totais`);
  return allRecords;
};

// 🎯 FUNÇÃO PARA BUSCAR ETAPAS DINÂMICAS DO FUNIL
export const getFunilEtapas = async (idFunilSprint) => {
  try {
    console.log('🔍 Buscando etapas do funil ID:', idFunilSprint)
    
    const response = await fetch(`${supabaseUrl}/rest/v1/funil_etapas?select=*&id_funil_sprint=eq.${idFunilSprint}&order=ordem_etapa.asc`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'apikey': supabaseServiceKey,
        'Accept-Profile': supabaseSchema,
        'Content-Profile': supabaseSchema
      }
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ Erro HTTP:', response.status, errorText)
      throw new Error(`Erro HTTP ${response.status}: ${errorText}`)
    }
    
    const etapas = await response.json()
    console.log(`✅ Etapas encontradas: ${etapas.length}`, etapas)
    return etapas

  } catch (error) {
    console.error('❌ Erro ao buscar etapas do funil:', error)
    throw error
  }
}

// Função para buscar dados de oportunidades por etapa do funil
export const getOportunidadesPorEtapaFunil = async (etapas, startDate = null, endDate = null, selectedFunnel = null, selectedSeller = null) => {
  try {
    console.log('📊 Buscando dados do funil para etapas:', etapas.length);
    console.log('📅 Período selecionado:', { startDate, endDate });
    console.log('🎯 Filtros:', { selectedFunnel, selectedSeller });
    
    if (!etapas || etapas.length === 0) {
      console.log('⚠️ Nenhuma etapa fornecida');
      return { etapas: [], conversaoGeral: { totalCriadas: 0, totalFechadas: 0, taxaConversao: 0, valorTotal: 0, ticketMedio: 0 } };
    }
    
    // 🎯 BUSCAR OPORTUNIDADES CRIADAS NO PERÍODO SELECIONADO PRIMEIRO PARA TER AS DATAS
    let dataInicio, dataFim;
    if (startDate && endDate) {
      dataInicio = getStartOfDaySP(startDate);
      dataFim = getEndOfDaySP(endDate);
    } else {
      const hoje = getTodayDateSP();
      dataInicio = getStartOfDaySP(hoje);
      dataFim = getEndOfDaySP(hoje);
    }
    
    // Construir filtro de funil se fornecido (APLICAR EM TODAS AS QUERIES)
    const funilFilter = selectedFunnel ? `&funil_id=eq.${selectedFunnel}` : '';
    
    // Construir lista de etapas para o filtro - SINTAXE CORRETA SUPABASE
    const etapaIds = etapas.map(e => e.id_etapa_sprint);
    const etapaFilter = etapaIds.map(id => `crm_column.eq.${id}`).join(',');
    
    // Construir filtro de vendedor se fornecido
    const sellerFilter = selectedSeller && selectedSeller !== 'all' ? `&user_id=eq.${selectedSeller}` : '';
    
    // BUSCAR APENAS OPORTUNIDADES ABERTAS (STATUS=OPEN) - COM PAGINAÇÃO E FILTROS CORRETOS
    const openUrl = `${supabaseUrl}/rest/v1/oportunidade_sprint?select=id,crm_column,value,user_id&archived=eq.0&status=eq.open&or=(${etapaFilter})${funilFilter}${sellerFilter}`;
    console.log('🔍 URL oportunidades abertas:', openUrl);

    const baseHeaders = {
      'Accept': 'application/json',
      'Authorization': `Bearer ${supabaseServiceKey}`,
      'apikey': supabaseServiceKey,
      'Accept-Profile': supabaseSchema,
      'Content-Profile': supabaseSchema,
      'Prefer': 'count=exact'
    };

    const oportunidadesAbertas = await fetchAllRecords(openUrl, baseHeaders);
    console.log(`✅ Oportunidades abertas encontradas (paginação): ${oportunidadesAbertas.length}`);

    // 1. TOTAL GERAL (para primeira etapa - ENTRADA) - COM PAGINAÇÃO
    const criadasPeriodoTotalUrl = `${supabaseUrl}/rest/v1/oportunidade_sprint?select=id&archived=eq.0&create_date=gte.${dataInicio}&create_date=lte.${dataFim}${funilFilter}${sellerFilter}`;
    
    const totalData = await fetchAllRecords(criadasPeriodoTotalUrl, baseHeaders);
    const criadasPeriodoTotal = totalData.length;
    console.log(`✅ TOTAL oportunidades criadas no período (paginação): ${criadasPeriodoTotal}`);

    // 2. BUSCAR OPORTUNIDADES FECHADAS (WON) NO PERÍODO - COM PAGINAÇÃO
    const fechadasHojeUrl = `${supabaseUrl}/rest/v1/oportunidade_sprint?select=id,value&archived=eq.0&status=eq.won&create_date=gte.${dataInicio}&create_date=lte.${dataFim}${funilFilter}${sellerFilter}`;
    
    const fechadasHoje = await fetchAllRecords(fechadasHojeUrl, baseHeaders);
    console.log(`✅ Oportunidades fechadas (paginação): ${fechadasHoje.length}`);
    
    const valorTotalFechadas = fechadasHoje.reduce((acc, opp) => {
      const valor = parseFloat(opp.value) || 0;
      return acc + valor;
    }, 0);

    // 3. PROCESSAR DADOS POR ETAPA
    const resultado = [];
    
    for (const etapa of etapas) {
      const abertosEtapa = oportunidadesAbertas.filter(o => o.crm_column === etapa.id_etapa_sprint);
      
      const valorEmAberto = abertosEtapa.reduce((acc, opp) => {
        const valor = parseFloat(opp.value) || 0;
        return acc + valor;
      }, 0);

      let criadasPeriodoEtapa = 0;
      if (etapa.ordem_etapa === 0 || etapa.nome_etapa.toLowerCase().includes('entrada')) {
        criadasPeriodoEtapa = criadasPeriodoTotal;
      }

      resultado.push({
        ...etapa,
        abertos: abertosEtapa.length,
        valorEmAberto: valorEmAberto,
        criadasPeriodo: criadasPeriodoEtapa,
        passaramPorEtapa: 0,
        taxaPassagem: null
      });
    }

    // 4. CALCULAR QUANTOS PASSARAM POR CADA ETAPA
    for (let i = 0; i < resultado.length; i++) {
      if (i === 0) {
        resultado[i].passaramPorEtapa = resultado[i].criadasPeriodo;
      } else {
        const etapaAnterior = resultado[i - 1];
        const passaramAnterior = etapaAnterior.passaramPorEtapa || 0;
        const ficouNaAnterior = etapaAnterior.abertos || 0;
        
        resultado[i].passaramPorEtapa = Math.max(0, passaramAnterior - ficouNaAnterior);
      }
    }

    // 5. CALCULAR TAXAS DE PASSAGEM
    for (let i = 0; i < resultado.length; i++) {
      if (i < resultado.length - 1) {
        const etapaAtual = resultado[i];
        const proximaEtapa = resultado[i + 1];
        
        const passaramAtual = etapaAtual.passaramPorEtapa || 0;
        const passaramProxima = proximaEtapa.passaramPorEtapa || 0;
        
        if (passaramAtual > 0) {
          const taxa = (passaramProxima / passaramAtual) * 100;
          proximaEtapa.taxaPassagem = Math.round(taxa * 10) / 10;
        } else {
          proximaEtapa.taxaPassagem = 0;
        }
      }
    }

    // 6. BUSCAR DADOS DE SOURCES (ORIGENS DAS OPORTUNIDADES)
    console.log('🔍 Buscando dados de sources...');
    
    // Buscar oportunidades abertas com origem para calcular sources - COM PAGINAÇÃO
    const sourcesUrl = `${supabaseUrl}/rest/v1/oportunidade_sprint?select=origem_oportunidade,utm_source&archived=eq.0&status=eq.open${funilFilter}${sellerFilter}`;
    
    const sourcesOpps = await fetchAllRecords(sourcesUrl, baseHeaders);
    console.log(`✅ Oportunidades para sources (paginação): ${sourcesOpps.length}`);

    let sourcesData = {
      google: { abertas: 0, criadas: 0 },
      meta: { abertas: 0, criadas: 0 },
      organico: { abertas: 0, criadas: 0 },
      whatsapp: { abertas: 0, criadas: 0 },
      prescritor: { abertas: 0, criadas: 0 },
      franquia: { abertas: 0, criadas: 0 },
      total: criadasPeriodoTotal
    };

    // Contar por origem
    sourcesOpps.forEach(opp => {
      const origem = opp.origem_oportunidade || opp.utm_source || 'whatsapp';
      const origemLower = origem.toLowerCase();
      
      if (origemLower.includes('google') || origemLower.includes('ads')) {
        sourcesData.google.abertas++;
      } else if (origemLower.includes('meta') || origemLower.includes('facebook') || origemLower.includes('instagram')) {
        sourcesData.meta.abertas++;
      } else if (origemLower.includes('organico') || origemLower.includes('orgânico') || origemLower.includes('organic')) {
        sourcesData.organico.abertas++;
      } else if (origemLower.includes('whatsapp') || origemLower.includes('zap')) {
        sourcesData.whatsapp.abertas++;
      } else if (origemLower.includes('prescritor') || origemLower.includes('prescrição')) {
        sourcesData.prescritor.abertas++;
      } else if (origemLower.includes('franquia') || origemLower.includes('franchise')) {
        sourcesData.franquia.abertas++;
      } else {
        // Default para WhatsApp se não identificar
        sourcesData.whatsapp.abertas++;
      }
    });
    
    // Buscar oportunidades criadas no período por origem - COM PAGINAÇÃO
    const sourcesCriadasUrl = `${supabaseUrl}/rest/v1/oportunidade_sprint?select=origem_oportunidade,utm_source&archived=eq.0&create_date=gte.${dataInicio}&create_date=lte.${dataFim}${funilFilter}${sellerFilter}`;
    
    const sourcesCriadasOpps = await fetchAllRecords(sourcesCriadasUrl, baseHeaders);
    console.log(`✅ Oportunidades criadas para sources (paginação): ${sourcesCriadasOpps.length}`);
    
    sourcesCriadasOpps.forEach(opp => {
      const origem = opp.origem_oportunidade || opp.utm_source || 'whatsapp';
      const origemLower = origem.toLowerCase();
      
      if (origemLower.includes('google') || origemLower.includes('ads')) {
        sourcesData.google.criadas++;
      } else if (origemLower.includes('meta') || origemLower.includes('facebook') || origemLower.includes('instagram')) {
        sourcesData.meta.criadas++;
      } else if (origemLower.includes('organico') || origemLower.includes('orgânico') || origemLower.includes('organic')) {
        sourcesData.organico.criadas++;
      } else if (origemLower.includes('whatsapp') || origemLower.includes('zap')) {
        sourcesData.whatsapp.criadas++;
      } else if (origemLower.includes('prescritor') || origemLower.includes('prescrição')) {
        sourcesData.prescritor.criadas++;
      } else if (origemLower.includes('franquia') || origemLower.includes('franchise')) {
        sourcesData.franquia.criadas++;
      } else {
        sourcesData.whatsapp.criadas++;
      }
    });
    
    console.log('📊 Sources data calculado (paginação):', sourcesData);

    const resultadoCompleto = {
      etapas: resultado,
      conversaoGeral: {
        totalCriadas: criadasPeriodoTotal,
        totalFechadas: fechadasHoje.length,
        taxaConversao: criadasPeriodoTotal > 0 ? (fechadasHoje.length / criadasPeriodoTotal) * 100 : 0,
        valorTotal: valorTotalFechadas,
        ticketMedio: fechadasHoje.length > 0 ? valorTotalFechadas / fechadasHoje.length : 0
      },
      sourcesData: sourcesData
    };

    return resultadoCompleto;

  } catch (error) {
    console.error('❌ Erro ao buscar dados do funil:', error);
    throw error;
  }
}

// Re-exports para compatibilidade (funções movidas para FilterBarService.js)
export { getUnidades, getFunisPorUnidade, getVendedores, getOrigens } from './FilterBarService.js'