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
    console.log(`✅ Oportunidades abertas encontradas: ${oportunidadesAbertas.length}`);

    // 🎯 BUSCAR OPORTUNIDADES CRIADAS NO PERÍODO SELECIONADO
    let dataInicio, dataFim;
    if (startDate && endDate) {
      dataInicio = getStartOfDaySP(startDate);
      dataFim = getEndOfDaySP(endDate);
    } else {
      const hoje = getTodayDateSP();
      dataInicio = getStartOfDaySP(hoje);
      dataFim = getEndOfDaySP(hoje);
    }
    
    // Construir filtro de funil se fornecido
    const funilFilter = selectedFunnel ? `&funil_id=eq.${selectedFunnel}` : '';
    
    // 1. TOTAL GERAL (para primeira etapa - ENTRADA)
    const criadasPeriodoTotalUrl = `${supabaseUrl}/rest/v1/oportunidade_sprint?select=id&archived=eq.0&create_date=gte.${dataInicio}&create_date=lte.${dataFim}${funilFilter}${sellerFilter}`;
    
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

    let criadasPeriodoTotal = 0;
    if (criadasPeriodoTotalResponse.ok) {
      const totalData = await criadasPeriodoTotalResponse.json();
      criadasPeriodoTotal = totalData.length;
      console.log(`✅ TOTAL oportunidades criadas no período: ${criadasPeriodoTotal}`);
    }

    // 2. BUSCAR OPORTUNIDADES FECHADAS (WON) NO PERÍODO
    const fechadasHojeUrl = `${supabaseUrl}/rest/v1/oportunidade_sprint?select=id,value&archived=eq.0&status=eq.won&create_date=gte.${dataInicio}&create_date=lte.${dataFim}${funilFilter}${sellerFilter}`;
    
    const fechadasHojeResponse = await fetch(fechadasHojeUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'apikey': supabaseServiceKey,
        'Accept-Profile': supabaseSchema,
        'Content-Profile': supabaseSchema
      }
    });

    let fechadasHoje = null;
    let valorTotalFechadas = 0;
    if (fechadasHojeResponse.ok) {
      fechadasHoje = await fechadasHojeResponse.json();
      console.log(`✅ Oportunidades fechadas: ${fechadasHoje.length}`);
      
      valorTotalFechadas = fechadasHoje.reduce((acc, opp) => {
        const valor = parseFloat(opp.value) || 0;
        return acc + valor;
      }, 0);
    }

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
    
    // Buscar oportunidades abertas com origem para calcular sources
    const sourcesUrl = `${supabaseUrl}/rest/v1/oportunidade_sprint?select=origem_oportunidade,utm_source&archived=eq.0&status=eq.open${funilFilter}${sellerFilter}`;
    
    const sourcesResponse = await fetch(sourcesUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'apikey': supabaseServiceKey,
        'Accept-Profile': supabaseSchema,
        'Content-Profile': supabaseSchema
      }
    });

    let sourcesData = {
      google: { abertas: 0, criadas: 0 },
      meta: { abertas: 0, criadas: 0 },
      organico: { abertas: 0, criadas: 0 },
      whatsapp: { abertas: 0, criadas: 0 },
      prescritor: { abertas: 0, criadas: 0 },
      franquia: { abertas: 0, criadas: 0 },
      total: criadasPeriodoTotal
    };

    if (sourcesResponse.ok) {
      const sourcesOpps = await sourcesResponse.json();
      console.log(`✅ Oportunidades para sources: ${sourcesOpps.length}`);
      
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
      
      // Buscar oportunidades criadas no período por origem
      const sourcesCriadasUrl = `${supabaseUrl}/rest/v1/oportunidade_sprint?select=origem_oportunidade,utm_source&archived=eq.0&create_date=gte.${dataInicio}&create_date=lte.${dataFim}${funilFilter}${sellerFilter}`;
      
      const sourcesCriadasResponse = await fetch(sourcesCriadasUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'apikey': supabaseServiceKey,
          'Accept-Profile': supabaseSchema,
          'Content-Profile': supabaseSchema
        }
      });

      if (sourcesCriadasResponse.ok) {
        const sourcesCriadasOpps = await sourcesCriadasResponse.json();
        console.log(`✅ Oportunidades criadas para sources: ${sourcesCriadasOpps.length}`);
        
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
      }
      
      console.log('📊 Sources data calculado:', sourcesData);
    } else {
      console.log('⚠️ Erro ao buscar dados de sources, usando valores padrão');
    }

    const resultadoCompleto = {
      etapas: resultado,
      conversaoGeral: {
        totalCriadas: criadasPeriodoTotal,
        totalFechadas: fechadasHoje ? fechadasHoje.length : 0,
        taxaConversao: criadasPeriodoTotal > 0 ? ((fechadasHoje ? fechadasHoje.length : 0) / criadasPeriodoTotal) * 100 : 0,
        valorTotal: valorTotalFechadas || 0,
        ticketMedio: (fechadasHoje && fechadasHoje.length > 0) ? (valorTotalFechadas || 0) / fechadasHoje.length : 0
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