import { createClient } from '@supabase/supabase-js'
import { getTodayDateSP, getStartOfDaySP, getEndOfDaySP } from '../utils/utils.js'

// Configurações do Supabase
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY
const supabaseSchema = import.meta.env.VITE_SUPABASE_SCHEMA || 'api'

// Cliente Supabase com service role key (permite acesso a todos os schemas)
export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// Função para obter o cliente com schema específico
export const getSupabaseWithSchema = (schema) => {
  console.log('🔧 Criando cliente Supabase com schema:', schema)
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    },
    global: {
      headers: {
        'Accept-Profile': schema,
        'Content-Profile': schema
      }
    }
  })
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
      return { success: false, error: error.message }
    }
    
    console.log('✅ Conexão bem-sucedida!')
    return { success: true, data, schema: supabaseSchema }
  } catch (error) {
    console.error('❌ Erro na conexão:', error)
    return { success: false, error: error.message }
  }
}

// Função para buscar oportunidades do SprintHUB (apenas título)
export const getOportunidadesSprint = async (limit = 10) => {
  try {
    console.log(`📊 Buscando ${limit} títulos de oportunidades do schema ${supabaseSchema}...`)
    
    const supabaseWithSchema = getSupabaseWithSchema(supabaseSchema)
    const { data, error } = await supabaseWithSchema
      .from('oportunidade_sprint')
      .select('title')
      .eq('archived', 0)
      .order('create_date', { ascending: false })
      .limit(limit)
    
    if (error) {
      console.error('❌ Erro ao buscar oportunidades:', error)
      throw new Error(`Erro ao buscar oportunidades: ${error.message}`)
    }
    
    console.log(`✅ ${data?.length || 0} títulos de oportunidades encontrados`)
    return data || []
  } catch (error) {
    console.error('❌ Erro ao buscar oportunidades:', error)
    throw error
  }
}

// Função para buscar oportunidades por status
export const getOportunidadesPorStatus = async (status, limit = 20) => {
  try {
    const supabaseWithSchema = getSupabaseWithSchema(supabaseSchema)
    const { data, error } = await supabaseWithSchema
      .from('oportunidade_sprint')
      .select(`
        id,
        title,
        value,
        status,
        expected_close_date,
        lead_firstname,
        lead_lastname,
        lead_email,
        unidade_id,
        funil_nome
      `)
      .eq('status', status)
      .eq('archived', 0)
      .order('create_date', { ascending: false })
      .limit(limit)
    
    if (error) {
      console.error('❌ Erro ao buscar oportunidades por status:', error)
      throw new Error(`Erro ao buscar oportunidades por status: ${error.message}`)
    }
    
    return data || []
  } catch (error) {
    console.error('❌ Erro ao buscar oportunidades por status:', error)
    throw error
  }
}

// Função para buscar oportunidades por unidade
export const getOportunidadesPorUnidade = async (unidadeId, limit = 20) => {
  try {
    const supabaseWithSchema = getSupabaseWithSchema(supabaseSchema)
    const { data, error } = await supabaseWithSchema
      .from('oportunidade_sprint')
      .select(`
        id,
        title,
        value,
        status,
        expected_close_date,
        lead_firstname,
        lead_lastname,
        lead_email,
        funil_nome
      `)
      .eq('unidade_id', unidadeId)
      .eq('archived', 0)
      .order('create_date', { ascending: false })
      .limit(limit)
    
    if (error) {
      console.error('❌ Erro ao buscar oportunidades por unidade:', error)
      throw new Error(`Erro ao buscar oportunidades por unidade: ${error.message}`)
    }
    
    return data || []
  } catch (error) {
    console.error('❌ Erro ao buscar oportunidades por unidade:', error)
    throw error
  }
}

// Função para buscar estatísticas das oportunidades
export const getEstatisticasOportunidades = async () => {
  try {
    const supabaseWithSchema = getSupabaseWithSchema(supabaseSchema)
    const { data, error } = await supabaseWithSchema
      .from('oportunidade_sprint')
      .select('status, value, archived')
      .eq('archived', 0)
    
    if (error) {
      console.error('❌ Erro ao buscar estatísticas:', error)
      throw new Error(`Erro ao buscar estatísticas: ${error.message}`)
    }
    
    if (!data) return {}
    
    const stats = {
      total: data.length,
      porStatus: {},
      valorTotal: 0,
      valorMedio: 0
    }
    
    data.forEach(oportunidade => {
      const status = oportunidade.status || 'Sem Status'
      stats.porStatus[status] = (stats.porStatus[status] || 0) + 1
      
      if (oportunidade.value && !isNaN(oportunidade.value)) {
        stats.valorTotal += parseFloat(oportunidade.value)
      }
    })
    
    stats.valorMedio = stats.total > 0 ? stats.valorTotal / stats.total : 0
    
    return stats
  } catch (error) {
    console.error('❌ Erro ao buscar estatísticas:', error)
    throw error
  }
}

// FUNÇÕES REMOVIDAS - Agora estão em FilterBarService.js
// getUnidades, getFunisPorUnidade, getVendedores, getOrigens foram movidas

// 🎯 FUNÇÃO PARA BUSCAR ETAPAS DINÂMICAS DO FUNIL (mantida aqui)
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

// Função para listar schemas disponíveis
export const listSchemas = async () => {
  try {
    return [supabaseSchema, 'public']
  } catch (error) {
    console.error('❌ Erro ao listar schemas:', error)
    return [supabaseSchema, 'public']
  }
}

// Função para listar tabelas disponíveis
export const listTables = async () => {
  try {
    return {
      [supabaseSchema]: ['oportunidade_sprint', 'unidades', 'funis'],
      public: []
    }
  } catch (error) {
    console.error('❌ Erro ao listar tabelas:', error)
    return {
      [supabaseSchema]: ['oportunidade_sprint', 'unidades', 'funis'],
      public: []
    }
  }
}

// 🎯 FUNÇÃO PARA BUSCAR FUNIS POR UNIDADE
export const getFunisPorUnidade = async (unidadeId = null) => {
  try {
    console.log('🔍 Buscando funis para unidade:', unidadeId || 'todas')
    
    let url = `${supabaseUrl}/rest/v1/funis?select=id,nome_funil,id_funil_sprint,unidade,status&status=eq.ativo&order=nome_funil.asc`;
    
    // Se uma unidade específica foi selecionada, filtrar por ela
    if (unidadeId && unidadeId !== 'all') {
      url += `&unidade=eq.${encodeURIComponent(unidadeId)}`;
    }

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'apikey': supabaseServiceKey,
        'Accept-Profile': supabaseSchema,
        'Content-Profile': supabaseSchema
      }
    });

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ Erro HTTP:', response.status, errorText)
      throw new Error(`Erro HTTP ${response.status}: ${errorText}`)
    }

    const funis = await response.json();
    console.log(`✅ Funis encontrados: ${funis.length}`, funis);
    return funis;

  } catch (error) {
    console.error('❌ Erro ao buscar funis:', error);
    throw error;
  }
}

// 🎯 FUNÇÃO PARA BUSCAR VENDEDORES POR UNIDADE (IGUAL AOS FUNIS)
export const getVendedores = async (unidadeId = null) => {
  try {
    console.log('🔍 Buscando vendedores para unidade:', unidadeId || 'todas')
    
    let url = `${supabaseUrl}/rest/v1/vendedores?select=*&order=nome.asc`;
    
    // Se uma unidade específica foi selecionada, filtrar por ela
    if (unidadeId && unidadeId !== 'all') {
      url += `&id_unidade=eq.${encodeURIComponent(unidadeId)}`;
    }

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'apikey': supabaseServiceKey,
        'Accept-Profile': supabaseSchema,
        'Content-Profile': supabaseSchema
      }
    });

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ Erro HTTP:', response.status, errorText)
      throw new Error(`Erro HTTP ${response.status}: ${errorText}`)
    }

    const vendedores = await response.json();
    console.log(`✅ Vendedores encontrados: ${vendedores.length}`, vendedores);
    return vendedores;

  } catch (error) {
    console.error('❌ Erro ao buscar vendedores:', error);
    throw error;
  }
}


// 🎯 FUNÇÃO SIMPLIFICADA: BUSCAR APENAS OPORTUNIDADES ATIVAS (STATUS=OPEN) POR ETAPA
export const getOportunidadesPorEtapaFunil = async (etapas, startDate = null, endDate = null, selectedFunnel = null, selectedSeller = null) => {
  try {
    console.log('🔍 Buscando oportunidades ATIVAS por etapa do funil:', etapas.map(e => e.id_etapa_sprint));
    console.log('📅 Período RECEBIDO:', { startDate, endDate });
    console.log('🎯 Funil selecionado:', selectedFunnel);
    console.log('👤 Vendedor selecionado:', selectedSeller);
    console.log('📅 Tipos das datas:', typeof startDate, typeof endDate);
    
    // 🎯 DEBUG ESPECÍFICO PARA PERÍODOS LONGOS
    const isPeriodoLongo = startDate !== endDate && startDate && endDate;
    if (isPeriodoLongo) {
      console.log('📆 PERÍODO LONGO DETECTADO:', {
        inicio: startDate,
        fim: endDate,
        diasDiferenca: Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24))
      });
    }
    
    // Construir lista de etapas para o filtro - SINTAXE CORRETA SUPABASE
    const etapaIds = etapas.map(e => e.id_etapa_sprint);
    const etapaFilter = etapaIds.map(id => `crm_column.eq.${id}`).join(',');
    
    // Construir filtro de vendedor se fornecido
    const sellerFilter = selectedSeller && selectedSeller !== 'all' ? `&user_id=eq.${selectedSeller}` : '';
    
    // BUSCAR APENAS OPORTUNIDADES ABERTAS (STATUS=OPEN) - FOCO INICIAL  
    const openUrl = `${supabaseUrl}/rest/v1/oportunidade_sprint?select=id,crm_column,value,user_id&archived=eq.0&status=eq.open&or=(${etapaFilter})${sellerFilter}`;
    console.log('🔍 URL oportunidades abertas:', openUrl);

    const response = await fetch(openUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'apikey': supabaseServiceKey,
        'Accept-Profile': supabaseSchema,
        'Content-Profile': supabaseSchema
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Erro HTTP:', response.status, errorText);
      throw new Error(`Erro HTTP ${response.status}: ${errorText}`);
    }

    const oportunidadesAbertas = await response.json();
    console.log(`✅ Oportunidades abertas encontradas: ${oportunidadesAbertas.length}`, oportunidadesAbertas);

    // 🎯 BUSCAR OPORTUNIDADES CRIADAS NO PERÍODO SELECIONADO
    let dataInicio, dataFim;
    if (startDate && endDate) {
      // Converter datas para UTC considerando fuso de São Paulo
      dataInicio = getStartOfDaySP(startDate);
      dataFim = getEndOfDaySP(endDate);
    } else {
      // Fallback para hoje (SP) se não há período selecionado
      const hoje = getTodayDateSP();
      dataInicio = getStartOfDaySP(hoje);
      dataFim = getEndOfDaySP(hoje);
    }
    console.log('📅 Período para criadas (UTC ajustado para SP):', { 
      startDate, 
      endDate, 
      dataInicioUTC: dataInicio, 
      dataFimUTC: dataFim 
    });
    
    // Construir filtro de funil se fornecido
    const funilFilter = selectedFunnel ? `&funil_id=eq.${selectedFunnel}` : '';
    
    // 1. TOTAL GERAL (para primeira etapa - ENTRADA) - COM FILTRO DE FUNIL, DATA E VENDEDOR
    const criadasPeriodoTotalUrl = `${supabaseUrl}/rest/v1/oportunidade_sprint?select=id&archived=eq.0&create_date=gte.${dataInicio}&create_date=lte.${dataFim}${funilFilter}${sellerFilter}`;
    console.log('🔍 URL oportunidades criadas no período TOTAL:', criadasPeriodoTotalUrl);
    
    // 🎯 LOG ESPECÍFICO PARA DEBUG DE PERÍODOS LONGOS
    if (isPeriodoLongo) {
      console.log('📆 QUERY PARA PERÍODO LONGO (com timezone São Paulo):', {
        dataInicioOriginal: startDate,
        dataFimOriginal: endDate,
        dataInicioUTC: dataInicio,
        dataFimUTC: dataFim,
        urlCompleta: criadasPeriodoTotalUrl
      });
    }

    // 🎯 EXECUTAR QUERY PARA TOTAL GERAL (ENTRADA)
    const criadasPeriodoTotalResponse = await fetch(criadasPeriodoTotalUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'apikey': supabaseServiceKey,
        'Accept-Profile': supabaseSchema,
        'Content-Profile': supabaseSchema
      }
    });

    // Processar total geral
    let criadasPeriodoTotal = 0;
    if (criadasPeriodoTotalResponse.ok) {
      const totalData = await criadasPeriodoTotalResponse.json();
      criadasPeriodoTotal = totalData.length;
      console.log(`✅ TOTAL oportunidades criadas no período: ${criadasPeriodoTotal}`);
    } else {
      const errorText = await criadasPeriodoTotalResponse.text();
      console.error('❌ Erro na query de total criadas:', criadasPeriodoTotalResponse.status, errorText);
    }

    // 🎯 BUSCAR DADOS ESPECÍFICOS POR ETAPA (CRIADAS E PERDIDAS)
    const criadasPeriodoPorEtapa = {};
    const perdidasPeriodoPorEtapa = {};

    // Para cada etapa, fazer queries específicas
    for (const etapa of etapas) {
      const etapaId = etapa.id_etapa_sprint.toString();
      
      // 🎯 QUERY ESPECÍFICA: Criadas no período E que estão na etapa X - COM FILTRO DE VENDEDOR (timezone SP)
      const criadasEtapaUrl = `${supabaseUrl}/rest/v1/oportunidade_sprint?select=id&archived=eq.0&create_date=gte.${dataInicio}&create_date=lte.${dataFim}&crm_column=eq.${etapa.id_etapa_sprint}${funilFilter}${sellerFilter}`;
      
      // 🎯 QUERY ESPECÍFICA: Perdidas no período E que estão na etapa X - COM FILTRO DE VENDEDOR (timezone SP)
      const perdidasEtapaUrl = `${supabaseUrl}/rest/v1/oportunidade_sprint?select=id&archived=eq.0&status=eq.lost&lost_date=gte.${dataInicio}&lost_date=lte.${dataFim}&crm_column=eq.${etapa.id_etapa_sprint}${funilFilter}${sellerFilter}`;
      
      console.log(`🔍 Etapa ${etapa.nome_etapa} (${etapaId}):`);
      console.log(`   - Criadas: ${criadasEtapaUrl}`);
      console.log(`   - Perdidas: ${perdidasEtapaUrl}`);

      try {
        // Executar queries em paralelo para esta etapa
        const [criadasResponse, perdidasResponse] = await Promise.all([
          fetch(criadasEtapaUrl, {
            method: 'GET',
            headers: {
              'Accept': 'application/json',
              'Authorization': `Bearer ${supabaseServiceKey}`,
              'apikey': supabaseServiceKey,
              'Accept-Profile': supabaseSchema,
              'Content-Profile': supabaseSchema
            }
          }),
          fetch(perdidasEtapaUrl, {
            method: 'GET',
            headers: {
              'Accept': 'application/json',
              'Authorization': `Bearer ${supabaseServiceKey}`,
              'apikey': supabaseServiceKey,
              'Accept-Profile': supabaseSchema,
              'Content-Profile': supabaseSchema
            }
          })
        ]);

        // Processar criadas
        if (criadasResponse.ok) {
          const criadasData = await criadasResponse.json();
          criadasPeriodoPorEtapa[etapaId] = criadasData.length;
          console.log(`   ✅ Criadas: ${criadasData.length}`);
        } else {
          console.error(`   ❌ Erro criadas etapa ${etapaId}:`, criadasResponse.status);
          criadasPeriodoPorEtapa[etapaId] = 0;
        }

        // Processar perdidas
        if (perdidasResponse.ok) {
          const perdidasData = await perdidasResponse.json();
          perdidasPeriodoPorEtapa[etapaId] = perdidasData.length;
          console.log(`   ✅ Perdidas: ${perdidasData.length}`);
        } else {
          console.error(`   ❌ Erro perdidas etapa ${etapaId}:`, perdidasResponse.status);
          perdidasPeriodoPorEtapa[etapaId] = 0;
        }

      } catch (error) {
        console.error(`❌ Erro ao buscar dados da etapa ${etapaId}:`, error);
        criadasPeriodoPorEtapa[etapaId] = 0;
        perdidasPeriodoPorEtapa[etapaId] = 0;
      }
    }

    console.log('📊 RESULTADO - Criadas no período por etapa:', criadasPeriodoPorEtapa);
    console.log('📊 RESULTADO - Perdidas no período por etapa:', perdidasPeriodoPorEtapa);

    // 🎯 BUSCAR DADOS REAIS PARA SOURCES BAR (ORIGENS DE OPORTUNIDADES)
    console.log('📊 Buscando dados das origens de oportunidades...');
    
    // Variáveis para sources
    let sourcesData = {
      google: 0,
      meta: 0,
      whatsapp: 0,
      organico: 0,
      prescritor: 0,
      franquia: 0,
      total: criadasPeriodoTotal
    };

    try {
      // 1. GOOGLE (utm_source = 'google' OU 'GoogleAds') - COM FILTRO DE VENDEDOR (timezone SP)
      const googleUrl = `${supabaseUrl}/rest/v1/oportunidade_sprint?select=id&archived=eq.0&create_date=gte.${dataInicio}&create_date=lte.${dataFim}${funilFilter}${sellerFilter}&or=(utm_source.eq.google,utm_source.eq.GoogleAds)`;
      console.log('🔍 URL Google:', googleUrl);

      // 2. META ADS - COM FILTRO DE VENDEDOR (timezone SP)
      const metaUrl = `${supabaseUrl}/rest/v1/oportunidade_sprint?select=id&archived=eq.0&create_date=gte.${dataInicio}&create_date=lte.${dataFim}${funilFilter}${sellerFilter}&origem_oportunidade=eq.Meta Ads`;
      console.log('🔍 URL Meta:', metaUrl);

      // 3. WHATSAPP (origem_oportunidade IS NULL OR vazio OR 'whatsapp') - COM FILTRO DE VENDEDOR (timezone SP)
      const whatsappUrl = `${supabaseUrl}/rest/v1/oportunidade_sprint?select=id&archived=eq.0&create_date=gte.${dataInicio}&create_date=lte.${dataFim}${funilFilter}${sellerFilter}&or=(origem_oportunidade.is.null,origem_oportunidade.eq.,origem_oportunidade.eq.whatsapp)`;
      console.log('🔍 URL WhatsApp:', whatsappUrl);

      // 4. ORGÂNICO - COM FILTRO DE VENDEDOR (timezone SP)
      const organicoUrl = `${supabaseUrl}/rest/v1/oportunidade_sprint?select=id&archived=eq.0&create_date=gte.${dataInicio}&create_date=lte.${dataFim}${funilFilter}${sellerFilter}&origem_oportunidade=eq.Orgânico`;
      console.log('🔍 URL Orgânico:', organicoUrl);

      // 5. PRESCRITOR - COM FILTRO DE VENDEDOR (timezone SP)
      const prescritorUrl = `${supabaseUrl}/rest/v1/oportunidade_sprint?select=id&archived=eq.0&create_date=gte.${dataInicio}&create_date=lte.${dataFim}${funilFilter}${sellerFilter}&origem_oportunidade=eq.Prescritor`;
      console.log('🔍 URL Prescritor:', prescritorUrl);

      // 6. FRANQUIA - COM FILTRO DE VENDEDOR (timezone SP)
      const franquiaUrl = `${supabaseUrl}/rest/v1/oportunidade_sprint?select=id&archived=eq.0&create_date=gte.${dataInicio}&create_date=lte.${dataFim}${funilFilter}${sellerFilter}&origem_oportunidade=eq.Franquia`;
      console.log('🔍 URL Franquia:', franquiaUrl);

      // Executar todas as queries em paralelo
      const [googleRes, metaRes, whatsappRes, organicoRes, prescritorRes, franquiaRes] = await Promise.all([
        fetch(googleUrl, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Authorization': `Bearer ${supabaseServiceKey}`,
            'apikey': supabaseServiceKey,
            'Accept-Profile': supabaseSchema,
            'Content-Profile': supabaseSchema
          }
        }),
        fetch(metaUrl, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Authorization': `Bearer ${supabaseServiceKey}`,
            'apikey': supabaseServiceKey,
            'Accept-Profile': supabaseSchema,
            'Content-Profile': supabaseSchema
          }
        }),
        fetch(whatsappUrl, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Authorization': `Bearer ${supabaseServiceKey}`,
            'apikey': supabaseServiceKey,
            'Accept-Profile': supabaseSchema,
            'Content-Profile': supabaseSchema
          }
        }),
        fetch(organicoUrl, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Authorization': `Bearer ${supabaseServiceKey}`,
            'apikey': supabaseServiceKey,
            'Accept-Profile': supabaseSchema,
            'Content-Profile': supabaseSchema
          }
        }),
        fetch(prescritorUrl, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Authorization': `Bearer ${supabaseServiceKey}`,
            'apikey': supabaseServiceKey,
            'Accept-Profile': supabaseSchema,
            'Content-Profile': supabaseSchema
          }
        }),
        fetch(franquiaUrl, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Authorization': `Bearer ${supabaseServiceKey}`,
            'apikey': supabaseServiceKey,
            'Accept-Profile': supabaseSchema,
            'Content-Profile': supabaseSchema
          }
        })
      ]);

      // Processar resultados
      if (googleRes.ok) {
        const googleData = await googleRes.json();
        sourcesData.google = googleData.length;
        console.log(`✅ Google: ${sourcesData.google} oportunidades`);
      }

      if (metaRes.ok) {
        const metaData = await metaRes.json();
        sourcesData.meta = metaData.length;
        console.log(`✅ Meta: ${sourcesData.meta} oportunidades`);
      }

      if (whatsappRes.ok) {
        const whatsappData = await whatsappRes.json();
        sourcesData.whatsapp = whatsappData.length;
        console.log(`✅ WhatsApp: ${sourcesData.whatsapp} oportunidades`);
      }

      if (organicoRes.ok) {
        const organicoData = await organicoRes.json();
        sourcesData.organico = organicoData.length;
        console.log(`✅ Orgânico: ${sourcesData.organico} oportunidades`);
      }

      if (prescritorRes.ok) {
        const prescritorData = await prescritorRes.json();
        sourcesData.prescritor = prescritorData.length;
        console.log(`✅ Prescritor: ${sourcesData.prescritor} oportunidades`);
      }

      if (franquiaRes.ok) {
        const franquiaData = await franquiaRes.json();
        sourcesData.franquia = franquiaData.length;
        console.log(`✅ Franquia: ${sourcesData.franquia} oportunidades`);
      }

      console.log('📊 Dados das origens CRIADAS calculados:', sourcesData);

      // 🎯 AGORA BUSCAR OPORTUNIDADES ABERTAS (ATIVAS) POR ORIGEM
      console.log('📊 Buscando oportunidades ABERTAS por origem...');

      // URLs para oportunidades abertas por origem (status=open) - COM FILTRO DE VENDEDOR
      const googleAbertasUrl = `${supabaseUrl}/rest/v1/oportunidade_sprint?select=id&archived=eq.0&status=eq.open${funilFilter}${sellerFilter}&or=(utm_source.eq.google,utm_source.eq.GoogleAds)`;
      const metaAbertasUrl = `${supabaseUrl}/rest/v1/oportunidade_sprint?select=id&archived=eq.0&status=eq.open${funilFilter}${sellerFilter}&origem_oportunidade=eq.Meta Ads`;
      const whatsappAbertasUrl = `${supabaseUrl}/rest/v1/oportunidade_sprint?select=id&archived=eq.0&status=eq.open${funilFilter}${sellerFilter}&or=(origem_oportunidade.is.null,origem_oportunidade.eq.,origem_oportunidade.eq.whatsapp)`;
      const organicoAbertasUrl = `${supabaseUrl}/rest/v1/oportunidade_sprint?select=id&archived=eq.0&status=eq.open${funilFilter}${sellerFilter}&origem_oportunidade=eq.Orgânico`;
      const prescritorAbertasUrl = `${supabaseUrl}/rest/v1/oportunidade_sprint?select=id&archived=eq.0&status=eq.open${funilFilter}${sellerFilter}&origem_oportunidade=eq.Prescritor`;
      const franquiaAbertasUrl = `${supabaseUrl}/rest/v1/oportunidade_sprint?select=id&archived=eq.0&status=eq.open${funilFilter}${sellerFilter}&origem_oportunidade=eq.Franquia`;

      // Executar queries de oportunidades abertas
      const [googleAbertasRes, metaAbertasRes, whatsappAbertasRes, organicoAbertasRes, prescritorAbertasRes, franquiaAbertasRes] = await Promise.all([
        fetch(googleAbertasUrl, {
          headers: {
            'Accept': 'application/json',
            'Authorization': `Bearer ${supabaseServiceKey}`,
            'apikey': supabaseServiceKey,
            'Accept-Profile': supabaseSchema,
            'Content-Profile': supabaseSchema
          }
        }),
        fetch(metaAbertasUrl, {
          headers: {
            'Accept': 'application/json',
            'Authorization': `Bearer ${supabaseServiceKey}`,
            'apikey': supabaseServiceKey,
            'Accept-Profile': supabaseSchema,
            'Content-Profile': supabaseSchema
          }
        }),
        fetch(whatsappAbertasUrl, {
          headers: {
            'Accept': 'application/json',
            'Authorization': `Bearer ${supabaseServiceKey}`,
            'apikey': supabaseServiceKey,
            'Accept-Profile': supabaseSchema,
            'Content-Profile': supabaseSchema
          }
        }),
        fetch(organicoAbertasUrl, {
          headers: {
            'Accept': 'application/json',
            'Authorization': `Bearer ${supabaseServiceKey}`,
            'apikey': supabaseServiceKey,
            'Accept-Profile': supabaseSchema,
            'Content-Profile': supabaseSchema
          }
        }),
        fetch(prescritorAbertasUrl, {
          headers: {
            'Accept': 'application/json',
            'Authorization': `Bearer ${supabaseServiceKey}`,
            'apikey': supabaseServiceKey,
            'Accept-Profile': supabaseSchema,
            'Content-Profile': supabaseSchema
          }
        }),
        fetch(franquiaAbertasUrl, {
          headers: {
            'Accept': 'application/json',
            'Authorization': `Bearer ${supabaseServiceKey}`,
            'apikey': supabaseServiceKey,
            'Accept-Profile': supabaseSchema,
            'Content-Profile': supabaseSchema
          }
        })
      ]);

      // Processar oportunidades abertas e adicionar aos dados
      if (googleAbertasRes.ok) {
        const googleAbertasData = await googleAbertasRes.json();
        sourcesData.google = { criadas: sourcesData.google, abertas: googleAbertasData.length };
        console.log(`✅ Google: ${sourcesData.google.criadas} criadas / ${sourcesData.google.abertas} abertas`);
      }

      if (metaAbertasRes.ok) {
        const metaAbertasData = await metaAbertasRes.json();
        sourcesData.meta = { criadas: sourcesData.meta, abertas: metaAbertasData.length };
        console.log(`✅ Meta: ${sourcesData.meta.criadas} criadas / ${sourcesData.meta.abertas} abertas`);
      }

      if (whatsappAbertasRes.ok) {
        const whatsappAbertasData = await whatsappAbertasRes.json();
        sourcesData.whatsapp = { criadas: sourcesData.whatsapp, abertas: whatsappAbertasData.length };
        console.log(`✅ WhatsApp: ${sourcesData.whatsapp.criadas} criadas / ${sourcesData.whatsapp.abertas} abertas`);
      }

      if (organicoAbertasRes.ok) {
        const organicoAbertasData = await organicoAbertasRes.json();
        sourcesData.organico = { criadas: sourcesData.organico, abertas: organicoAbertasData.length };
        console.log(`✅ Orgânico: ${sourcesData.organico.criadas} criadas / ${sourcesData.organico.abertas} abertas`);
      }

      if (prescritorAbertasRes.ok) {
        const prescritorAbertasData = await prescritorAbertasRes.json();
        sourcesData.prescritor = { criadas: sourcesData.prescritor, abertas: prescritorAbertasData.length };
        console.log(`✅ Prescritor: ${sourcesData.prescritor.criadas} criadas / ${sourcesData.prescritor.abertas} abertas`);
      }

      if (franquiaAbertasRes.ok) {
        const franquiaAbertasData = await franquiaAbertasRes.json();
        sourcesData.franquia = { criadas: sourcesData.franquia, abertas: franquiaAbertasData.length };
        console.log(`✅ Franquia: ${sourcesData.franquia.criadas} criadas / ${sourcesData.franquia.abertas} abertas`);
      }

      console.log('📊 Dados completos das origens:', sourcesData);

    } catch (error) {
      console.error('❌ Erro ao buscar dados das origens:', error);
    }

    // 🎯 BUSCAR OPORTUNIDADES FECHADAS (GANHAS) CRIADAS HOJE - COM FILTRO DE VENDEDOR
    console.log('💰 Buscando oportunidades ganhas criadas hoje...');
    const fechadasHojeUrl = `${supabaseUrl}/rest/v1/oportunidade_sprint?select=id,value&archived=eq.0&status=eq.gain&create_date=gte.${dataInicio}&create_date=lte.${dataFim}${funilFilter}${sellerFilter}`;
    console.log('🔍 URL oportunidades fechadas hoje:', fechadasHojeUrl);

    // Variáveis para conversão geral
    let fechadasHoje = [];
    let valorTotalFechadas = 0;

    try {
      const fechadasResponse = await fetch(fechadasHojeUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'apikey': supabaseServiceKey,
          'Accept-Profile': supabaseSchema,
          'Content-Profile': supabaseSchema
        }
      });

      if (fechadasResponse.ok) {
        fechadasHoje = await fechadasResponse.json();
        valorTotalFechadas = fechadasHoje.reduce((total, opp) => {
          const valor = parseFloat(opp.value) || 0;
          return total + valor;
        }, 0);

        console.log(`✅ Oportunidades fechadas hoje: ${fechadasHoje.length}`);
        console.log(`💰 Valor total fechado: R$ ${valorTotalFechadas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
      } else {
        console.error('❌ Erro ao buscar oportunidades fechadas:', fechadasResponse.status);
      }

    } catch (error) {
      console.error('❌ Erro ao processar oportunidades fechadas:', error);
    }

    // Organizar dados por etapa - CONTAR APENAS OPORTUNIDADES ATIVAS
    const ativasPorEtapa = {};
    const valorPorEtapa = {};
    
    // Inicializar contadores
    etapas.forEach(etapa => {
      const etapaId = etapa.id_etapa_sprint.toString();
      ativasPorEtapa[etapaId] = 0;
      valorPorEtapa[etapaId] = 0;
    });

    // Contar oportunidades ativas por etapa
    oportunidadesAbertas.forEach(oportunidade => {
      const crmColumn = oportunidade.crm_column?.toString();
      if (crmColumn && ativasPorEtapa.hasOwnProperty(crmColumn)) {
        ativasPorEtapa[crmColumn]++;
        if (oportunidade.value && !isNaN(oportunidade.value)) {
          valorPorEtapa[crmColumn] += parseFloat(oportunidade.value);
        }
      }
    });

    console.log('📊 Oportunidades ativas por etapa:', ativasPorEtapa);

    // Criar resultado formatado - COM LÓGICA DIFERENCIADA PARA PRIMEIRA ETAPA
    const resultado = etapas.map((etapa, index) => {
      const etapaId = etapa.id_etapa_sprint.toString();
      const ativas = ativasPorEtapa[etapaId] || 0;
      const valor = valorPorEtapa[etapaId] || 0;
      
      // 🎯 USAR DADOS ESPECÍFICOS POR ETAPA PARA TODAS AS ETAPAS
      let criadasPeriodo = criadasPeriodoPorEtapa[etapaId] || 0;
      
      // 🎯 ADICIONAR PROPRIEDADE PARA O TOTAL GERAL (para referência)
      if (index === 0) {
        // Adicionar total geral como propriedade separada
        etapa.totalGeralCriadas = criadasPeriodoTotal;
      }

      // 🎯 PERDAS: Sempre específicas por etapa
      const perdidasPeriodo = perdidasPeriodoPorEtapa[etapaId] || 0;

      return {
        ...etapa,
        ativas,          // 🎯 NÚMERO PRINCIPAL: Oportunidades ativas na etapa (número laranja do CRM)
        valor,           // Valor total das oportunidades ativas
        total: ativas,   // Para compatibilidade com o componente atual
        perdas: 0,       // Temporariamente zero (adicionaremos depois)
        ganhos: 0,       // Temporariamente zero (adicionaremos depois)
        taxaPassagem: null, // Calcularemos depois quando adicionar outras métricas
        criadasPeriodo,  // 🎯 ENTRADA: total geral | DEMAIS: específicas da etapa
        perdidasPeriodo  // 🎯 PERDAS: Oportunidades perdidas no período nesta etapa
      };
    });

    // 🎯 CALCULAR QUANTOS PASSARAM POR CADA ETAPA
    console.log('📊 Calculando quantos passaram por cada etapa...');
    console.log('🔍 Estado atual dos dados antes do cálculo:', resultado.map(r => ({
      nome: r.nome_etapa,
      criadasPeriodo: r.criadasPeriodo,
      perdidasPeriodo: r.perdidasPeriodo
    })));

    for (let i = 0; i < resultado.length; i++) {
      if (i === 0) {
        // PRIMEIRA ETAPA (ENTRADA): Total geral de leads criados hoje (não específico da etapa)
        resultado[i].passaramPorEtapa = resultado[i].totalGeralCriadas || 0;
        console.log(`✅ ENTRADA ${resultado[i].nome_etapa}: ${resultado[i].passaramPorEtapa} passaram (= total geral criado: ${resultado[i].totalGeralCriadas})`);
        console.log(`   📊 Na etapa específica ficaram: ${resultado[i].criadasPeriodo}`);
      } else {
        // DEMAIS ETAPAS: Anteriores que passaram - os que ficaram na etapa anterior
        const etapaAnterior = resultado[i - 1];
        const ficouNaAnterior = etapaAnterior.criadasPeriodo || 0; // leads que ficaram na etapa anterior
        const passaramAnterior = etapaAnterior.passaramPorEtapa || 0;
        
        resultado[i].passaramPorEtapa = passaramAnterior - ficouNaAnterior;
        
        // Garantir que não seja negativo
        if (resultado[i].passaramPorEtapa < 0) {
          console.log(`⚠️ VALOR NEGATIVO DETECTADO para ${resultado[i].nome_etapa}: ${resultado[i].passaramPorEtapa}. Ajustando para 0.`);
          resultado[i].passaramPorEtapa = 0;
        }
        
        console.log(`✅ ${resultado[i].nome_etapa}: ${resultado[i].passaramPorEtapa} passaram`);
        console.log(`   🔢 Cálculo: ${passaramAnterior} (anterior.passaram) - ${ficouNaAnterior} (anterior.ficou) = ${resultado[i].passaramPorEtapa}`);
        console.log(`   📊 Etapa anterior (${etapaAnterior.nome_etapa}): passaram=${passaramAnterior}, ficou=${ficouNaAnterior}`);
      }
    }

    console.log('📊 Resultado final - Quantos passaram por etapa:', resultado.map(r => ({
      nome: r.nome_etapa,
      passaram: r.passaramPorEtapa,
      criadas: r.criadasPeriodo
    })));

    // 🎯 CALCULAR TAXA DE PASSAGEM BASEADA NOS QUE PASSARAM
    console.log('📊 Calculando taxas de passagem baseadas nos que passaram...');
    for (let i = 0; i < resultado.length; i++) {
      if (i < resultado.length - 1) {
        // Há uma próxima etapa para calcular a taxa
        const etapaAtual = resultado[i];
        const proximaEtapa = resultado[i + 1];
        
        const passaramAtual = etapaAtual.passaramPorEtapa || 0;
        const passaramProxima = proximaEtapa.passaramPorEtapa || 0;
        
        if (passaramAtual > 0) {
          const taxa = (passaramProxima / passaramAtual) * 100;
          proximaEtapa.taxaPassagem = Math.round(taxa * 10) / 10; // Arredondar para 1 casa decimal
          
          console.log(`✅ Taxa ${etapaAtual.nome_etapa} → ${proximaEtapa.nome_etapa}: ${passaramProxima}/${passaramAtual} = ${proximaEtapa.taxaPassagem}%`);
        } else {
          proximaEtapa.taxaPassagem = 0;
          console.log(`⚠️ Taxa ${etapaAtual.nome_etapa} → ${proximaEtapa.nome_etapa}: 0% (nenhum lead passou pela etapa atual)`);
        }
      }
    }

    console.log('📊 Dados do funil com taxas de passagem calculadas:', resultado);

    // 🎯 RETORNAR DADOS DO FUNIL + CONVERSÃO GERAL + SOURCES
    const resultadoCompleto = {
      etapas: resultado,
      conversaoGeral: {
        totalCriadas: criadasPeriodoTotal,
        totalFechadas: fechadasHoje ? fechadasHoje.length : 0,
        taxaConversao: criadasPeriodoTotal > 0 ? ((fechadasHoje ? fechadasHoje.length : 0) / criadasPeriodoTotal) * 100 : 0,
        valorTotal: valorTotalFechadas || 0,
        ticketMedio: (fechadasHoje && fechadasHoje.length > 0) ? (valorTotalFechadas || 0) / fechadasHoje.length : 0
      },
      sourcesData: sourcesData || {
        google: { criadas: 0, abertas: 0 },
        meta: { criadas: 0, abertas: 0 },
        whatsapp: { criadas: 0, abertas: 0 },
        organico: { criadas: 0, abertas: 0 },
        prescritor: { criadas: 0, abertas: 0 },
        franquia: { criadas: 0, abertas: 0 },
        total: criadasPeriodoTotal
      }
    };

    return resultadoCompleto;

  } catch (error) {
    console.error('❌ Erro ao buscar dados do funil:', error);
    throw error;
  }
}


// Re-exports para compatibilidade (funções movidas para FilterBarService.js)
export { getUnidades, getFunisPorUnidade, getVendedores, getOrigens } from './FilterBarService.js'
