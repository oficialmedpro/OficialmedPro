import { createClient } from '@supabase/supabase-js'

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
const getSupabaseWithSchema = (schema) => {
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

// Função para buscar unidades usando HTTP direto (como na VPS)
export const getUnidades = async () => {
  try {
    console.log('🔍 Buscando unidades do schema:', supabaseSchema)
    
    // Primeiro, vamos ver quais tabelas existem no schema
    console.log('🔍 Verificando tabelas disponíveis...')
    const tablesResponse = await fetch(`${supabaseUrl}/rest/v1/`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'apikey': supabaseServiceKey,
        'Accept-Profile': supabaseSchema
      }
    })
    
    if (tablesResponse.ok) {
      const tables = await tablesResponse.json()
      console.log('📋 Tabelas disponíveis no schema', supabaseSchema, ':', tables)
    } else {
      console.log('⚠️ Não foi possível listar tabelas')
    }
    
    // Agora tentar buscar unidades (usando campos que realmente existem)
    const response = await fetch(`${supabaseUrl}/rest/v1/unidades?select=id,unidade,codigo_sprint,status&status=eq.ativo&order=unidade.asc`, {
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
    
    const data = await response.json()
    
    console.log('✅ Unidades encontradas:', data?.length || 0)
    if (data && data.length > 0) {
      console.log('📋 Primeira unidade:', data[0])
    }
    
    return data || []
  } catch (error) {
    console.error('❌ Erro ao buscar unidades:', error)
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

// 🎯 FUNÇÃO PARA BUSCAR ETAPAS DINÂMICAS DO FUNIL
export const getFunilEtapas = async (idFunilSprint) => {
  try {
    console.log('🔍 Buscando etapas do funil:', idFunilSprint)
    
    const url = `${supabaseUrl}/rest/v1/funil_etapas?select=*&id_funil_sprint=eq.${encodeURIComponent(idFunilSprint)}&ativo=eq.true&order=ordem_etapa.asc`;

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

    const etapas = await response.json();
    console.log(`✅ Etapas do funil encontradas: ${etapas.length}`, etapas);
    return etapas;

  } catch (error) {
    console.error('❌ Erro ao buscar etapas do funil:', error);
    throw error;
  }
}

// 🎯 FUNÇÃO SIMPLIFICADA: BUSCAR APENAS OPORTUNIDADES ATIVAS (STATUS=OPEN) POR ETAPA
export const getOportunidadesPorEtapaFunil = async (etapas, startDate = null, endDate = null, selectedFunnel = null) => {
  try {
    console.log('🔍 Buscando oportunidades ATIVAS por etapa do funil:', etapas.map(e => e.id_etapa_sprint));
    console.log('📅 Período RECEBIDO:', { startDate, endDate });
    console.log('🎯 Funil selecionado:', selectedFunnel);
    console.log('📅 Tipos das datas:', typeof startDate, typeof endDate);
    
    // Construir lista de etapas para o filtro - SINTAXE CORRETA SUPABASE
    const etapaIds = etapas.map(e => e.id_etapa_sprint);
    const etapaFilter = etapaIds.map(id => `crm_column.eq.${id}`).join(',');
    
    // BUSCAR APENAS OPORTUNIDADES ABERTAS (STATUS=OPEN) - FOCO INICIAL  
    const openUrl = `${supabaseUrl}/rest/v1/oportunidade_sprint?select=id,crm_column,value&archived=eq.0&status=eq.open&or=(${etapaFilter})`;
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
      dataInicio = startDate;
      dataFim = endDate;
    } else {
      // Fallback para hoje se não há período selecionado
      const hoje = new Date().toISOString().split('T')[0];
      dataInicio = dataFim = hoje;
    }
    console.log('📅 Período para criadas:', { dataInicio, dataFim });
    
    // Construir filtro de funil se fornecido
    const funilFilter = selectedFunnel ? `&funil_id=eq.${selectedFunnel}` : '';
    
    // 1. TOTAL GERAL (para primeira etapa - ENTRADA) - COM FILTRO DE FUNIL E DATA
    const criadasPeriodoTotalUrl = `${supabaseUrl}/rest/v1/oportunidade_sprint?select=id&archived=eq.0&create_date=gte.${dataInicio}&create_date=lte.${dataFim}T23:59:59${funilFilter}`;
    console.log('🔍 URL oportunidades criadas no período TOTAL:', criadasPeriodoTotalUrl);

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
      
      // 🎯 QUERY ESPECÍFICA: Criadas hoje E que estão na etapa X
      const criadasEtapaUrl = `${supabaseUrl}/rest/v1/oportunidade_sprint?select=id&archived=eq.0&create_date=gte.${dataInicio}&create_date=lte.${dataFim}T23:59:59&crm_column=eq.${etapa.id_etapa_sprint}${funilFilter}`;
      
      // 🎯 QUERY ESPECÍFICA: Perdidas hoje E que estão na etapa X
      const perdidasEtapaUrl = `${supabaseUrl}/rest/v1/oportunidade_sprint?select=id&archived=eq.0&status=eq.lost&lost_date=gte.${dataInicio}&lost_date=lte.${dataFim}T23:59:59&crm_column=eq.${etapa.id_etapa_sprint}${funilFilter}`;
      
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

    // 🎯 BUSCAR OPORTUNIDADES FECHADAS (GANHAS) CRIADAS HOJE
    console.log('💰 Buscando oportunidades ganhas criadas hoje...');
    const fechadasHojeUrl = `${supabaseUrl}/rest/v1/oportunidade_sprint?select=id,value&archived=eq.0&status=eq.gain&create_date=gte.${dataInicio}&create_date=lte.${dataFim}T23:59:59${funilFilter}`;
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

    // 🎯 RETORNAR DADOS DO FUNIL + CONVERSÃO GERAL
    const resultadoCompleto = {
      etapas: resultado,
      conversaoGeral: {
        totalCriadas: criadasPeriodoTotal,
        totalFechadas: fechadasHoje ? fechadasHoje.length : 0,
        taxaConversao: criadasPeriodoTotal > 0 ? ((fechadasHoje ? fechadasHoje.length : 0) / criadasPeriodoTotal) * 100 : 0,
        valorTotal: valorTotalFechadas || 0,
        ticketMedio: (fechadasHoje && fechadasHoje.length > 0) ? (valorTotalFechadas || 0) / fechadasHoje.length : 0
      }
    };

    return resultadoCompleto;

  } catch (error) {
    console.error('❌ Erro ao buscar dados do funil:', error);
    throw error;
  }
}
