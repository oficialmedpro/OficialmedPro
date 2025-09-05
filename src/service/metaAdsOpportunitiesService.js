import { getSupabaseWithSchema } from './supabase.js';

// Configurações do Supabase
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
const supabaseSchema = import.meta.env.VITE_SUPABASE_SCHEMA || 'api';

/**
 * Service específico para buscar dados de oportunidades do Meta Ads
 * Baseado na lógica do thermometerService.js mas focado em oportunidades
 */

/**
 * Busca métricas de oportunidades para o dashboard Meta Ads
 * @param {string} startDate - Data de início (YYYY-MM-DD)
 * @param {string} endDate - Data de fim (YYYY-MM-DD)
 * @param {string} selectedUnit - Unidade selecionada
 * @param {string} selectedFunnel - Funil selecionado
 * @param {string} selectedSeller - Vendedor selecionado
 * @returns {Object} Métricas das oportunidades
 */
export const getMetaAdsOpportunitiesMetrics = async (startDate = null, endDate = null, selectedUnit = null, selectedFunnel = null, selectedSeller = null) => {
  try {
    console.log('🎯 MetaAdsOpportunitiesService: Buscando métricas de oportunidades...');
    console.log('📅 Parâmetros:', { startDate, endDate, selectedUnit, selectedFunnel, selectedSeller });

    // Fallback para datas se não estiverem definidas
    let dataInicio = startDate;
    let dataFim = endDate;
    
    if (!dataInicio || !dataFim || dataInicio === '' || dataFim === '') {
      const hoje = new Date().toISOString().split('T')[0];
      dataInicio = hoje;
      dataFim = hoje;
      console.log('⚠️ Usando datas fallback (hoje):', { dataInicio, dataFim });
    }

    // Construir filtros baseados nos parâmetros (com padrões para Meta Ads)
    let funilFilter = '';
    const funilId = selectedFunnel && selectedFunnel !== 'all' && selectedFunnel !== '' && selectedFunnel !== 'undefined' 
      ? selectedFunnel 
      : '6'; // Funil Compra por padrão
    funilFilter = `&funil_id=eq.${funilId}`;
    
    let unidadeFilter = '';
    const unidadeId = selectedUnit && selectedUnit !== 'all' && selectedUnit !== '' && selectedUnit !== 'undefined' 
      ? selectedUnit 
      : '[1]'; // Apucarana por padrão
    const unidadeFormatada = unidadeId.toString().replace(/[\[\]]/g, '');
    unidadeFilter = `&unidade_id=eq.%5B${unidadeFormatada}%5D`;
    
    let sellerFilter = '';
    if (selectedSeller && selectedSeller !== 'all' && selectedSeller !== '' && selectedSeller !== 'undefined') {
      sellerFilter = `&user_id=eq.${selectedSeller}`;
    }

    const filtrosCombinados = funilFilter + unidadeFilter + sellerFilter;

    console.log('🔍 Filtros construídos:', { funilFilter, unidadeFilter, sellerFilter });

    // 🎯 1. OPORTUNIDADES CONVERTIDAS (Status = gain E gain_date no período) - APENAS META ADS
    const convertidasUrl = `${supabaseUrl}/rest/v1/oportunidade_sprint?select=id,value&archived=eq.0&origem_oportunidade=eq.Meta Ads&status=eq.gain&gain_date=gte.${dataInicio}&gain_date=lte.${dataFim}T23:59:59${filtrosCombinados}`;
    console.log('🔍 URL Convertidas (Meta Ads):', convertidasUrl);

    // 🎯 2. OPORTUNIDADES PERDIDAS (Status = lost E lost_date no período) - APENAS META ADS
    const perdidasUrl = `${supabaseUrl}/rest/v1/oportunidade_sprint?select=id,value&archived=eq.0&origem_oportunidade=eq.Meta Ads&status=eq.lost&lost_date=gte.${dataInicio}&lost_date=lte.${dataFim}T23:59:59${filtrosCombinados}`;
    console.log('🔍 URL Perdidas (Meta Ads):', perdidasUrl);

    // 🎯 3. OPORTUNIDADES EM ABERTO (Status = open) - APENAS META ADS
    const emAbertoUrl = `${supabaseUrl}/rest/v1/oportunidade_sprint?select=id,value&archived=eq.0&origem_oportunidade=eq.Meta Ads&status=eq.open${filtrosCombinados}`;
    console.log('🔍 URL Em Aberto (Meta Ads):', emAbertoUrl);

    // Executar todas as queries em paralelo
    const [convertidasResponse, perdidasResponse, emAbertoResponse] = await Promise.all([
      fetch(convertidasUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'apikey': supabaseServiceKey,
          'Accept-Profile': supabaseSchema,
          'Content-Profile': supabaseSchema
        }
      }),
      fetch(perdidasUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'apikey': supabaseServiceKey,
          'Accept-Profile': supabaseSchema,
          'Content-Profile': supabaseSchema
        }
      }),
      fetch(emAbertoUrl, {
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
    let convertidas = 0;
    let valorConvertidas = 0;
    let perdidas = 0;
    let valorPerdidas = 0;
    let emAberto = 0;
    let valorEmAberto = 0;

    // 1. Oportunidades Convertidas
    if (convertidasResponse.ok) {
      const convertidasData = await convertidasResponse.json();
      convertidas = convertidasData.length;
      valorConvertidas = convertidasData.reduce((total, opp) => {
        const valor = parseFloat(opp.value) || 0;
        return total + valor;
      }, 0);
      console.log(`✅ Convertidas: ${convertidas} (R$ ${valorConvertidas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })})`);
    } else {
      console.error('❌ Erro ao buscar convertidas:', convertidasResponse.status);
    }

    // 2. Oportunidades Perdidas
    if (perdidasResponse.ok) {
      const perdidasData = await perdidasResponse.json();
      perdidas = perdidasData.length;
      valorPerdidas = perdidasData.reduce((total, opp) => {
        const valor = parseFloat(opp.value) || 0;
        return total + valor;
      }, 0);
      console.log(`✅ Perdidas: ${perdidas} (R$ ${valorPerdidas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })})`);
    } else {
      console.error('❌ Erro ao buscar perdidas:', perdidasResponse.status);
    }

    // 3. Oportunidades Em Aberto
    if (emAbertoResponse.ok) {
      const emAbertoData = await emAbertoResponse.json();
      emAberto = emAbertoData.length;
      valorEmAberto = emAbertoData.reduce((total, opp) => {
        const valor = parseFloat(opp.value) || 0;
        return total + valor;
      }, 0);
      console.log(`✅ Em Aberto: ${emAberto} (R$ ${valorEmAberto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })})`);
    } else {
      console.error('❌ Erro ao buscar em aberto:', emAbertoResponse.status);
    }

    // Calcular totais e percentuais
    const totalOportunidades = convertidas + perdidas + emAberto;
    const taxaConversao = totalOportunidades > 0 ? (convertidas / totalOportunidades) * 100 : 0;
    const taxaPerda = totalOportunidades > 0 ? (perdidas / totalOportunidades) * 100 : 0;
    const taxaEmAberto = totalOportunidades > 0 ? (emAberto / totalOportunidades) * 100 : 0;

    // 🎯 FORMATAR DADOS PARA O COMPONENTE
    const metrics = {
      convertidas: {
        count: convertidas,
        value: valorConvertidas,
        percentage: taxaConversao
      },
      perdidas: {
        count: perdidas,
        value: valorPerdidas,
        percentage: taxaPerda
      },
      emAberto: {
        count: emAberto,
        value: valorEmAberto,
        percentage: taxaEmAberto
      },
      total: {
        count: totalOportunidades,
        value: valorConvertidas + valorPerdidas + valorEmAberto
      }
    };

    console.log('✅ MetaAdsOpportunitiesService: Métricas calculadas:', metrics);
    return metrics;

  } catch (error) {
    console.error('❌ Erro no MetaAdsOpportunitiesService:', error);
    throw error;
  }
};

/**
 * Busca métricas financeiras (ROAS, ROI, etc.)
 * @param {string} startDate - Data de início
 * @param {string} endDate - Data de fim
 * @param {string} selectedUnit - Unidade selecionada
 * @param {string} selectedFunnel - Funil selecionado
 * @param {string} selectedSeller - Vendedor selecionado
 * @returns {Object} Métricas financeiras
 */
export const getMetaAdsFinancialMetrics = async (startDate = null, endDate = null, selectedUnit = null, selectedFunnel = null, selectedSeller = null) => {
  try {
    console.log('💰 MetaAdsOpportunitiesService: Buscando métricas financeiras...');

    // Fallback para datas
    let dataInicio = startDate;
    let dataFim = endDate;
    
    if (!dataInicio || !dataFim || dataInicio === '' || dataFim === '') {
      const hoje = new Date().toISOString().split('T')[0];
      dataInicio = hoje;
      dataFim = hoje;
    }

    // Construir filtros (com padrões para Meta Ads)
    let funilFilter = '';
    const funilId = selectedFunnel && selectedFunnel !== 'all' && selectedFunnel !== '' && selectedFunnel !== 'undefined' 
      ? selectedFunnel 
      : '6'; // Funil Compra por padrão
    funilFilter = `&funil_id=eq.${funilId}`;
    
    let unidadeFilter = '';
    const unidadeId = selectedUnit && selectedUnit !== 'all' && selectedUnit !== '' && selectedUnit !== 'undefined' 
      ? selectedUnit 
      : '[1]'; // Apucarana por padrão
    const unidadeFormatada = unidadeId.toString().replace(/[\[\]]/g, '');
    unidadeFilter = `&unidade_id=eq.%5B${unidadeFormatada}%5D`;
    
    let sellerFilter = '';
    if (selectedSeller && selectedSeller !== 'all' && selectedSeller !== '' && selectedSeller !== 'undefined') {
      sellerFilter = `&user_id=eq.${selectedSeller}`;
    }

    const filtrosCombinados = funilFilter + unidadeFilter + sellerFilter;

    // Buscar oportunidades ganhas no período - APENAS META ADS
    const ganhasUrl = `${supabaseUrl}/rest/v1/oportunidade_sprint?select=id,value&archived=eq.0&origem_oportunidade=eq.Meta Ads&status=eq.gain&gain_date=gte.${dataInicio}&gain_date=lte.${dataFim}T23:59:59${filtrosCombinados}`;
    
    const response = await fetch(ganhasUrl, {
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
      console.error('❌ Erro ao buscar métricas financeiras:', response.status);
      return {
        roas: 0,
        roi: 0,
        conversionRate: 0,
        valorGanho: 0,
        valorPerda: 0
      };
    }

    const ganhasData = await response.json();
    const valorGanho = ganhasData.reduce((total, opp) => total + (parseFloat(opp.value) || 0), 0);
    
    // Para ROAS e ROI, precisaríamos dos dados de investimento do Meta Ads
    // Por enquanto, vamos usar valores estimados baseados no valor ganho
    const investimentoEstimado = valorGanho * 0.3; // Estimativa de 30% do valor ganho como investimento
    const roas = investimentoEstimado > 0 ? valorGanho / investimentoEstimado : 0;
    const roi = investimentoEstimado > 0 ? ((valorGanho - investimentoEstimado) / investimentoEstimado) * 100 : 0;

    const metrics = {
      roas: roas,
      roi: roi,
      conversionRate: 0, // Será calculado pelo componente principal
      valorGanho: valorGanho,
      valorPerda: 0 // Será calculado pelo componente principal
    };

    console.log('✅ MetaAdsOpportunitiesService: Métricas financeiras calculadas:', metrics);
    return metrics;

  } catch (error) {
    console.error('❌ Erro ao buscar métricas financeiras:', error);
    throw error;
  }
};

/**
 * Busca métricas de tempo (tempo médio de fechamento, etc.)
 * @param {string} startDate - Data de início
 * @param {string} endDate - Data de fim
 * @param {string} selectedUnit - Unidade selecionada
 * @param {string} selectedFunnel - Funil selecionado
 * @param {string} selectedSeller - Vendedor selecionado
 * @returns {Object} Métricas de tempo
 */
export const getMetaAdsTimeMetrics = async (startDate = null, endDate = null, selectedUnit = null, selectedFunnel = null, selectedSeller = null) => {
  try {
    console.log('⏱️ MetaAdsOpportunitiesService: Buscando métricas de tempo...');

    // Fallback para datas
    let dataInicio = startDate;
    let dataFim = endDate;
    
    if (!dataInicio || !dataFim || dataInicio === '' || dataFim === '') {
      const hoje = new Date().toISOString().split('T')[0];
      dataInicio = hoje;
      dataFim = hoje;
    }

    // Construir filtros (com padrões para Meta Ads)
    let funilFilter = '';
    const funilId = selectedFunnel && selectedFunnel !== 'all' && selectedFunnel !== '' && selectedFunnel !== 'undefined' 
      ? selectedFunnel 
      : '6'; // Funil Compra por padrão
    funilFilter = `&funil_id=eq.${funilId}`;
    
    let unidadeFilter = '';
    const unidadeId = selectedUnit && selectedUnit !== 'all' && selectedUnit !== '' && selectedUnit !== 'undefined' 
      ? selectedUnit 
      : '[1]'; // Apucarana por padrão
    const unidadeFormatada = unidadeId.toString().replace(/[\[\]]/g, '');
    unidadeFilter = `&unidade_id=eq.%5B${unidadeFormatada}%5D`;
    
    let sellerFilter = '';
    if (selectedSeller && selectedSeller !== 'all' && selectedSeller !== '' && selectedSeller !== 'undefined') {
      sellerFilter = `&user_id=eq.${selectedSeller}`;
    }

    const filtrosCombinados = funilFilter + unidadeFilter + sellerFilter;

    // Buscar oportunidades fechadas com datas - APENAS META ADS
    const fechadasUrl = `${supabaseUrl}/rest/v1/oportunidade_sprint?select=id,create_date,gain_date,lost_date,status&archived=eq.0&origem_oportunidade=eq.Meta Ads&or=(status.eq.gain,status.eq.lost)&or=(gain_date=gte.${dataInicio},lost_date=gte.${dataInicio})&or=(gain_date=lte.${dataFim}T23:59:59,lost_date=lte.${dataFim}T23:59:59)${filtrosCombinados}`;
    
    const response = await fetch(fechadasUrl, {
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
      console.error('❌ Erro ao buscar métricas de tempo:', response.status);
      return {
        closingTime: 0,
        lossRate: 0
      };
    }

    const fechadasData = await response.json();
    
    // Calcular tempo médio de fechamento
    let totalDays = 0;
    let validClosings = 0;

    fechadasData.forEach(opp => {
      if (opp.status === 'gain' && opp.create_date && opp.gain_date) {
        const createDate = new Date(opp.create_date);
        const gainDate = new Date(opp.gain_date);
        const daysDiff = Math.ceil((gainDate - createDate) / (1000 * 60 * 60 * 24));
        
        if (daysDiff > 0) {
          totalDays += daysDiff;
          validClosings++;
        }
      }
    });

    const avgClosingTime = validClosings > 0 ? Math.round(totalDays / validClosings) : 0;

    // Calcular taxa de perda
    const lostOpportunities = fechadasData.filter(opp => opp.status === 'lost').length;
    const totalClosed = fechadasData.length;
    const lossRate = totalClosed > 0 ? (lostOpportunities / totalClosed) * 100 : 0;

    const metrics = {
      closingTime: avgClosingTime,
      lossRate: lossRate
    };

    console.log('✅ MetaAdsOpportunitiesService: Métricas de tempo calculadas:', metrics);
    return metrics;

  } catch (error) {
    console.error('❌ Erro ao buscar métricas de tempo:', error);
    throw error;
  }
};

/**
 * Busca todas as métricas de oportunidades de uma vez
 * @param {string} startDate - Data de início
 * @param {string} endDate - Data de fim
 * @param {string} selectedUnit - Unidade selecionada
 * @param {string} selectedFunnel - Funil selecionado
 * @param {string} selectedSeller - Vendedor selecionado
 * @returns {Object} Todas as métricas
 */
export const getAllMetaAdsOpportunitiesMetrics = async (startDate = null, endDate = null, selectedUnit = null, selectedFunnel = null, selectedSeller = null) => {
  try {
    console.log('🎯 MetaAdsOpportunitiesService: Buscando todas as métricas...');

    const [leads, financial, time] = await Promise.all([
      getMetaAdsOpportunitiesMetrics(startDate, endDate, selectedUnit, selectedFunnel, selectedSeller),
      getMetaAdsFinancialMetrics(startDate, endDate, selectedUnit, selectedFunnel, selectedSeller),
      getMetaAdsTimeMetrics(startDate, endDate, selectedUnit, selectedFunnel, selectedSeller)
    ]);

    return { leads, financial, time };

  } catch (error) {
    console.error('❌ Erro ao buscar todas as métricas:', error);
    throw error;
  }
};
