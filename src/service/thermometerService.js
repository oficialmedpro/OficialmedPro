import { getSupabaseWithSchema, getFunilEtapas } from './supabase.js';

// Configurações do Supabase
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
const supabaseSchema = import.meta.env.VITE_SUPABASE_SCHEMA || 'api';

/**
 * Service para buscar dados reais do Supabase para o PerformanceThermometer
 * Segue o mesmo padrão do FunnelChart para consistência
 */

// 🎯 FUNÇÃO PARA BUSCAR DADOS DAS MÉTRICAS PRINCIPAIS
export const getThermometerMetrics = async (startDate = null, endDate = null, selectedFunnel = null, selectedUnit = null, selectedSeller = null) => {
  try {
    console.log('🌡️ ThermometerService: Buscando métricas do termômetro...');
    console.log('📅 Período:', { startDate, endDate });
    console.log('🎯 Filtros:', { selectedFunnel, selectedUnit, selectedSeller });

    // Fallback para datas se não estiverem definidas
    let dataInicio = startDate;
    let dataFim = endDate;
    
    if (!dataInicio || !dataFim) {
      const hoje = new Date().toISOString().split('T')[0];
      dataInicio = hoje;
      dataFim = hoje;
      console.log('⚠️ ThermometerService: Usando datas fallback (hoje):', { dataInicio, dataFim });
    }

    // Construir filtros baseados nos parâmetros
    const funilFilter = selectedFunnel && selectedFunnel !== 'all' ? `&funil_id=eq.${selectedFunnel}` : '';
    const unidadeFilter = selectedUnit && selectedUnit !== 'all' ? `&unidade_id=eq.%5B${selectedUnit}%5D` : '';
    const sellerFilter = selectedSeller && selectedSeller !== 'all' ? `&user_id=eq.${selectedSeller}` : '';
    const filtrosCombinados = funilFilter + unidadeFilter + sellerFilter;

    console.log('🔍 Filtros aplicados:', filtrosCombinados);
    console.log('🔍 Filtros detalhados:', { 
      funil: selectedFunnel, 
      unidade: selectedUnit, 
      vendedor: selectedSeller 
    });

    // 🎯 1. TOTAL DE OPORTUNIDADES - DUAS CONSULTAS:
    // 1A. Oportunidades abertas (número principal)
    const totalOportunidadesAbertasUrl = `${supabaseUrl}/rest/v1/oportunidade_sprint?select=id,value&archived=eq.0&status=eq.open${filtrosCombinados}`;
    // 1B. Oportunidades criadas no período (valor embaixo)
    const totalOportunidadesCriadasUrl = `${supabaseUrl}/rest/v1/oportunidade_sprint?select=id,value&archived=eq.0&create_date=gte.${dataInicio}&create_date=lte.${dataFim}T23:59:59${filtrosCombinados}`;
    console.log('🔍 URL Total Oportunidades Abertas:', totalOportunidadesAbertasUrl);
    console.log('🔍 URL Total Oportunidades Criadas no Período:', totalOportunidadesCriadasUrl);

    // 🎯 2. OPORTUNIDADES PERDIDAS (Status = lost E lost_date no período)
    // Construir URL passo a passo para debug
    let oportunidadesPerdidasUrl = `${supabaseUrl}/rest/v1/oportunidade_sprint?select=id,value`;
    oportunidadesPerdidasUrl += `&archived=eq.0`;
    oportunidadesPerdidasUrl += `&status=eq.lost`;
    oportunidadesPerdidasUrl += `&lost_date=gte.${dataInicio}`;
    oportunidadesPerdidasUrl += `&lost_date=lte.${dataFim}T23:59:59`;
    
    // Adicionar filtros opcionais
    if (selectedFunnel && selectedFunnel !== 'all') {
      oportunidadesPerdidasUrl += `&funil_id=eq.${selectedFunnel}`;
      console.log('🔍 Adicionando filtro funil:', selectedFunnel);
    }
    if (selectedUnit && selectedUnit !== 'all') {
      oportunidadesPerdidasUrl += `&unidade_id=eq.%5B${selectedUnit}%5D`;
      console.log('🔍 Adicionando filtro unidade:', selectedUnit, '-> %5B' + selectedUnit + '%5D');
    }
    if (selectedSeller && selectedSeller !== 'all') {
      oportunidadesPerdidasUrl += `&user_id=eq.${selectedSeller}`;
      console.log('🔍 Adicionando filtro vendedor:', selectedSeller);
    }
    
    console.log('🔍 URL Final Oportunidades Perdidas:', oportunidadesPerdidasUrl);
    console.log('🔍 Query SQL equivalente:', `
      SELECT COUNT(*), SUM(value) 
      FROM oportunidade_sprint 
      WHERE archived = 0 
      AND status = 'lost' 
      AND lost_date >= '${dataInicio} 00:00:00' 
      AND lost_date <= '${dataFim} 23:59:59'
      ${selectedFunnel && selectedFunnel !== 'all' ? `AND funil_id = ${selectedFunnel}` : ''}
      ${selectedUnit && selectedUnit !== 'all' ? `AND unidade_id = ${selectedUnit}` : ''}
      ${selectedSeller && selectedSeller !== 'all' ? `AND user_id = ${selectedSeller}` : ''}
    `);

    // 🎯 3. TICKET MÉDIO (Valor médio das oportunidades GANHAS no período)
    const ticketMedioUrl = `${supabaseUrl}/rest/v1/oportunidade_sprint?select=value&archived=eq.0&status=eq.gain&gain_date=gte.${dataInicio}&gain_date=lte.${dataFim}T23:59:59&value=not.is.null${filtrosCombinados}`;
    console.log('🔍 URL Ticket Médio (ganhas no período):', ticketMedioUrl);

    // 🎯 4. ORÇAMENTO EM NEGOCIAÇÃO (Tentar buscar etapa específica se funil selecionado)
    let orcamentoNegociacaoUrl;
    let etapaOrcamentoId = null;
    
    if (selectedFunnel && selectedFunnel !== 'all') {
      try {
        console.log('🔍 Buscando etapa ORÇAMENTO REALIZADO para o funil:', selectedFunnel);
        const etapas = await getFunilEtapas(selectedFunnel);
        const etapaOrcamento = etapas.find(etapa => 
          etapa.nome_etapa && etapa.nome_etapa.toLowerCase().includes('orçamento') && 
          etapa.nome_etapa.toLowerCase().includes('realizado')
        );
        
        if (etapaOrcamento) {
          etapaOrcamentoId = etapaOrcamento.id_etapa_sprint;
          orcamentoNegociacaoUrl = `${supabaseUrl}/rest/v1/oportunidade_sprint?select=id,value&archived=eq.0&status=eq.open&crm_column=eq.${etapaOrcamentoId}${sellerFilter}${unidadeFilter}`;
          console.log('✅ Etapa ORÇAMENTO REALIZADO encontrada:', etapaOrcamentoId);
        } else {
          console.log('⚠️ Etapa ORÇAMENTO REALIZADO não encontrada, usando status genérico');
          orcamentoNegociacaoUrl = `${supabaseUrl}/rest/v1/oportunidade_sprint?select=id,value&archived=eq.0&or=(status.eq.open,status.eq.negotiation)${filtrosCombinados}`;
        }
      } catch (error) {
        console.error('❌ Erro ao buscar etapas do funil:', error);
        orcamentoNegociacaoUrl = `${supabaseUrl}/rest/v1/oportunidade_sprint?select=id,value&archived=eq.0&or=(status.eq.open,status.eq.negotiation)${filtrosCombinados}`;
      }
    } else {
      orcamentoNegociacaoUrl = `${supabaseUrl}/rest/v1/oportunidade_sprint?select=id,value&archived=eq.0&or=(status.eq.open,status.eq.negotiation)${filtrosCombinados}`;
    }
    
    console.log('🔍 URL Orçamento Negociação:', orcamentoNegociacaoUrl);

    // 🎯 5. OPORTUNIDADES GANHAS (Status = gain E gain_date no período selecionado)
    const oportunidadesGanhasUrl = `${supabaseUrl}/rest/v1/oportunidade_sprint?select=id,value&archived=eq.0&status=eq.gain&gain_date=gte.${dataInicio}&gain_date=lte.${dataFim}T23:59:59${filtrosCombinados}`;
    console.log('🔍 URL Oportunidades Ganhas (gain_date):', oportunidadesGanhasUrl);

    // Executar todas as queries em paralelo
    const [
      totalAbertasResponse,
      totalCriadasResponse, 
      perdidasResponse,
      ticketMedioResponse,
      orcamentoResponse,
      ganhasResponse
    ] = await Promise.all([
      fetch(totalOportunidadesAbertasUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'apikey': supabaseServiceKey,
          'Accept-Profile': supabaseSchema,
          'Content-Profile': supabaseSchema
        }
      }),
      fetch(totalOportunidadesCriadasUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'apikey': supabaseServiceKey,
          'Accept-Profile': supabaseSchema,
          'Content-Profile': supabaseSchema
        }
      }),
      fetch(oportunidadesPerdidasUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'apikey': supabaseServiceKey,
          'Accept-Profile': supabaseSchema,
          'Content-Profile': supabaseSchema
        }
      }),
      fetch(ticketMedioUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'apikey': supabaseServiceKey,
          'Accept-Profile': supabaseSchema,
          'Content-Profile': supabaseSchema
        }
      }),
      fetch(orcamentoNegociacaoUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'apikey': supabaseServiceKey,
          'Accept-Profile': supabaseSchema,
          'Content-Profile': supabaseSchema
        }
      }),
      fetch(oportunidadesGanhasUrl, {
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
    let totalOportunidadesAbertas = 0;
    let valorTotalAbertas = 0;
    let totalOportunidadesCriadas = 0;
    let valorTotalCriadas = 0;
    let oportunidadesPerdidas = 0;
    let valorPerdidas = 0;
    let ticketMedio = 0;
    let orcamentoNegociacao = 0;
    let valorOrcamentoNegociacao = 0;
    let oportunidadesGanhas = 0;
    let valorGanhas = 0;

    // 1A. Total de Oportunidades Abertas
    if (totalAbertasResponse.ok) {
      const totalAbertasData = await totalAbertasResponse.json();
      totalOportunidadesAbertas = totalAbertasData.length;
      valorTotalAbertas = totalAbertasData.reduce((total, opp) => {
        const valor = parseFloat(opp.value) || 0;
        return total + valor;
      }, 0);
      console.log(`✅ Total Oportunidades Abertas: ${totalOportunidadesAbertas} (R$ ${valorTotalAbertas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })})`);
    } else {
      console.error('❌ Erro ao buscar oportunidades abertas:', totalAbertasResponse.status);
    }

    // 1B. Total de Oportunidades Criadas no Período
    if (totalCriadasResponse.ok) {
      const totalCriadasData = await totalCriadasResponse.json();
      totalOportunidadesCriadas = totalCriadasData.length;
      valorTotalCriadas = totalCriadasData.reduce((total, opp) => {
        const valor = parseFloat(opp.value) || 0;
        return total + valor;
      }, 0);
      console.log(`✅ Total Oportunidades Criadas no Período: ${totalOportunidadesCriadas} (R$ ${valorTotalCriadas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })})`);
    } else {
      console.error('❌ Erro ao buscar oportunidades criadas:', totalCriadasResponse.status);
    }

    // 2. Oportunidades Perdidas
    if (perdidasResponse.ok) {
      const perdidasData = await perdidasResponse.json();
      console.log('🔍 Resposta HTTP Status:', perdidasResponse.status);
      console.log('🔍 Quantidade de registros retornados:', perdidasData.length);
      console.log('🔍 Primeiros 2 registros:', perdidasData.slice(0, 2));
      
      oportunidadesPerdidas = perdidasData.length;
      valorPerdidas = perdidasData.reduce((total, opp) => {
        const valor = parseFloat(opp.value) || 0;
        return total + valor;
      }, 0);
      console.log(`✅ Oportunidades Perdidas FINAL: ${oportunidadesPerdidas} (R$ ${valorPerdidas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })})`);
      
      // TESTE: Fazer query SEM filtros para comparar
      const urlSemFiltros = `${supabaseUrl}/rest/v1/oportunidade_sprint?select=id,value&archived=eq.0&status=eq.lost&lost_date=gte.${dataInicio}&lost_date=lte.${dataFim}T23:59:59`;
      console.log('🧪 TESTE - URL SEM FILTROS:', urlSemFiltros);
      
    } else {
      console.error('❌ Erro ao buscar oportunidades perdidas:', perdidasResponse.status);
      console.error('❌ URL que falhou:', oportunidadesPerdidasUrl);
    }

    // 3. Ticket Médio (baseado nas oportunidades GANHAS no período)
    if (ticketMedioResponse.ok) {
      const ticketData = await ticketMedioResponse.json();
      const valoresValidos = ticketData.filter(opp => opp.value && !isNaN(parseFloat(opp.value)));
      if (valoresValidos.length > 0) {
        const somaValores = valoresValidos.reduce((total, opp) => total + parseFloat(opp.value), 0);
        ticketMedio = somaValores / valoresValidos.length;
        console.log(`✅ Ticket Médio (ganhas no período): R$ ${ticketMedio.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} (${valoresValidos.length} oportunidades)`);
      } else {
        ticketMedio = 0;
        console.log(`⚠️ Ticket Médio: R$ 0,00 (nenhuma oportunidade ganha no período)`);
      }
    } else {
      console.error('❌ Erro ao buscar ticket médio:', ticketMedioResponse.status);
    }

    // 4. Orçamento em Negociação
    if (orcamentoResponse.ok) {
      const orcamentoData = await orcamentoResponse.json();
      orcamentoNegociacao = orcamentoData.length;
      valorOrcamentoNegociacao = orcamentoData.reduce((total, opp) => {
        const valor = parseFloat(opp.value) || 0;
        return total + valor;
      }, 0);
      const metodoUsado = etapaOrcamentoId ? `etapa ORÇAMENTO REALIZADO (${etapaOrcamentoId})` : 'status genérico';
      console.log(`✅ Orçamento Negociação (${metodoUsado}): ${orcamentoNegociacao} (R$ ${valorOrcamentoNegociacao.toLocaleString('pt-BR', { minimumFractionDigits: 2 })})`);
    } else {
      console.error('❌ Erro ao buscar orçamento negociação:', orcamentoResponse.status);
    }

    // 5. Oportunidades Ganhas (baseado na data de fechamento, não de criação)
    if (ganhasResponse.ok) {
      const ganhasData = await ganhasResponse.json();
      oportunidadesGanhas = ganhasData.length;
      valorGanhas = ganhasData.reduce((total, opp) => {
        const valor = parseFloat(opp.value) || 0;
        return total + valor;
      }, 0);
      console.log(`✅ Oportunidades Ganhas (gain_date): ${oportunidadesGanhas} (R$ ${valorGanhas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })})`);
    } else {
      console.error('❌ Erro ao buscar oportunidades ganhas:', ganhasResponse.status);
    }

    // 🎯 DADOS ANTERIORES - USANDO VALORES PADRÃO (sem estimativas)
    console.log('📊 Usando dados padrão para comparação (sem consulta ao período anterior)');
    const dadosAnteriores = {
      totalOportunidades: 0, // Será comparado com as abertas
      oportunidadesPerdidas: 0,
      ticketMedio: 0,
      orcamentoNegociacao: 0,
      oportunidadesGanhas: 0
    };

    // 🎯 FORMATAR DADOS PARA O COMPONENTE
    const metrics = {
      totalOportunidades: {
        current: totalOportunidadesAbertas, // Número principal: oportunidades abertas
        previous: dadosAnteriores.totalOportunidades,
        value: valorTotalCriadas, // Valor embaixo: soma das criadas no período
        meta: 2300, // Meta configurável
        change: dadosAnteriores.totalOportunidades > 0 ? 
          ((totalOportunidadesAbertas - dadosAnteriores.totalOportunidades) / dadosAnteriores.totalOportunidades) * 100 : 0,
        isPositive: totalOportunidadesAbertas >= dadosAnteriores.totalOportunidades
      },
      oportunidadesPerdidas: {
        current: oportunidadesPerdidas,
        previous: dadosAnteriores.oportunidadesPerdidas,
        value: valorPerdidas,
        meta: 120, // Meta configurável
        change: dadosAnteriores.oportunidadesPerdidas > 0 ? 
          ((oportunidadesPerdidas - dadosAnteriores.oportunidadesPerdidas) / dadosAnteriores.oportunidadesPerdidas) * 100 : 0,
        isPositive: oportunidadesPerdidas <= dadosAnteriores.oportunidadesPerdidas // Menos perdidas = positivo
      },
      ticketMedio: {
        current: ticketMedio,
        previous: dadosAnteriores.ticketMedio,
        value: ticketMedio,
        meta: 3200, // Meta configurável
        change: dadosAnteriores.ticketMedio > 0 ? 
          ((ticketMedio - dadosAnteriores.ticketMedio) / dadosAnteriores.ticketMedio) * 100 : 0,
        isPositive: ticketMedio >= dadosAnteriores.ticketMedio
      },
      orcamentoNegociacao: {
        current: orcamentoNegociacao,
        previous: dadosAnteriores.orcamentoNegociacao,
        value: valorOrcamentoNegociacao,
        meta: 95, // Meta configurável
        change: dadosAnteriores.orcamentoNegociacao > 0 ? 
          ((orcamentoNegociacao - dadosAnteriores.orcamentoNegociacao) / dadosAnteriores.orcamentoNegociacao) * 100 : 0,
        isPositive: orcamentoNegociacao >= dadosAnteriores.orcamentoNegociacao
      },
      oportunidadesGanhas: {
        current: oportunidadesGanhas,
        previous: dadosAnteriores.oportunidadesGanhas,
        value: valorGanhas,
        meta: 200, // Meta configurável
        change: dadosAnteriores.oportunidadesGanhas > 0 ? 
          ((oportunidadesGanhas - dadosAnteriores.oportunidadesGanhas) / dadosAnteriores.oportunidadesGanhas) * 100 : 0,
        isPositive: oportunidadesGanhas >= dadosAnteriores.oportunidadesGanhas
      }
    };

    console.log('✅ ThermometerService: Métricas calculadas:', metrics);
    return metrics;

  } catch (error) {
    console.error('❌ Erro no ThermometerService:', error);
    throw error;
  }
};

// 🎯 FUNÇÃO PARA BUSCAR DADOS DO PERÍODO ANTERIOR (para comparação)
const getThermometerMetricsAnteriores = async (startDate, endDate, selectedFunnel = null, selectedUnit = null, selectedSeller = null) => {
  try {
    console.log('📊 Buscando dados do período anterior...');
    
    // Calcular período anterior (mesmo intervalo de dias)
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = end.getTime() - start.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    const startAnterior = new Date(start);
    startAnterior.setDate(startAnterior.getDate() - diffDays - 1);
    
    const endAnterior = new Date(start);
    endAnterior.setDate(endAnterior.getDate() - 1);
    
    const dataInicioAnterior = startAnterior.toISOString().split('T')[0];
    const dataFimAnterior = endAnterior.toISOString().split('T')[0];
    
    console.log('📅 Período anterior:', { dataInicioAnterior, dataFimAnterior });

    // Construir filtros
    const funilFilter = selectedFunnel && selectedFunnel !== 'all' ? `&funil_id=eq.${selectedFunnel}` : '';
    const unidadeFilter = selectedUnit && selectedUnit !== 'all' ? `&unidade_id=eq.%5B${selectedUnit}%5D` : '';
    const sellerFilter = selectedSeller && selectedSeller !== 'all' ? `&user_id=eq.${selectedSeller}` : '';
    const filtrosCombinados = funilFilter + unidadeFilter + sellerFilter;

    // 🎯 BUSCAR DADOS ESPECÍFICOS DO PERÍODO ANTERIOR
    const totalAnteriorUrl = `${supabaseUrl}/rest/v1/oportunidade_sprint?select=id,value&archived=eq.0&status=eq.open&create_date=gte.${dataInicioAnterior}&create_date=lte.${dataFimAnterior}T23:59:59${filtrosCombinados}`;
    const ganhasAnteriorUrl = `${supabaseUrl}/rest/v1/oportunidade_sprint?select=id,value&archived=eq.0&status=eq.gain&gain_date=gte.${dataInicioAnterior}&gain_date=lte.${dataFimAnterior}T23:59:59${filtrosCombinados}`;
    
    // Executar queries em paralelo
    const [totalResponse, ganhasResponse] = await Promise.all([
      fetch(totalAnteriorUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'apikey': supabaseServiceKey,
          'Accept-Profile': supabaseSchema,
          'Content-Profile': supabaseSchema
        }
      }),
      fetch(ganhasAnteriorUrl, {
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

    if (totalResponse.ok && ganhasResponse.ok) {
      const totalData = await totalResponse.json();
      const ganhasData = await ganhasResponse.json();
      
      const valoresValidos = totalData.filter(opp => opp.value && !isNaN(parseFloat(opp.value)));
      const ticketMedioAnterior = valoresValidos.length > 0 ? 
        valoresValidos.reduce((total, opp) => total + parseFloat(opp.value), 0) / valoresValidos.length : 0;
      
      return {
        totalOportunidades: totalData.length,
        oportunidadesPerdidas: Math.floor(totalData.length * 0.1), // Estimativa baseada em dados históricos
        ticketMedio: ticketMedioAnterior,
        orcamentoNegociacao: Math.floor(totalData.length * 0.6), // Estimativa baseada em dados históricos
        oportunidadesGanhas: ganhasData.length // 🎯 DADO REAL com gain_date do período anterior
      };
    }

    // Fallback se não conseguir buscar dados anteriores
    return {
      totalOportunidades: 1000,
      oportunidadesPerdidas: 100,
      ticketMedio: 2500,
      orcamentoNegociacao: 60,
      oportunidadesGanhas: 150
    };

  } catch (error) {
    console.error('❌ Erro ao buscar dados anteriores:', error);
    // Fallback
    return {
      totalOportunidades: 1000,
      oportunidadesPerdidas: 100,
      ticketMedio: 2500,
      orcamentoNegociacao: 60,
      oportunidadesGanhas: 150
    };
  }
};

// 🎯 FUNÇÃO PARA BUSCAR MÉTRICAS POR ORIGEM (Google, Meta, etc.)
export const getThermometerMetricsBySource = async (startDate = null, endDate = null, selectedFunnel = null) => {
  try {
    console.log('🌡️ ThermometerService: Buscando métricas por origem...');

    // Fallback para datas
    let dataInicio = startDate;
    let dataFim = endDate;
    
    if (!dataInicio || !dataFim) {
      const hoje = new Date().toISOString().split('T')[0];
      dataInicio = hoje;
      dataFim = hoje;
    }

    const funilFilter = selectedFunnel && selectedFunnel !== 'all' ? `&funil_id=eq.${selectedFunnel}` : '';

    // URLs para cada origem
    const googleUrl = `${supabaseUrl}/rest/v1/oportunidade_sprint?select=id,value&archived=eq.0&status=eq.open&or=(utm_source.eq.google,utm_source.eq.GoogleAds)${funilFilter}`;
    const metaUrl = `${supabaseUrl}/rest/v1/oportunidade_sprint?select=id,value&archived=eq.0&status=eq.open&origem_oportunidade=eq.Meta Ads${funilFilter}`;
    const organicoUrl = `${supabaseUrl}/rest/v1/oportunidade_sprint?select=id,value&archived=eq.0&status=eq.open&origem_oportunidade=eq.Orgânico${funilFilter}`;
    const whatsappUrl = `${supabaseUrl}/rest/v1/oportunidade_sprint?select=id,value&archived=eq.0&status=eq.open&or=(origem_oportunidade.is.null,origem_oportunidade.eq.,origem_oportunidade.eq.whatsapp)${funilFilter}`;

    // Executar queries em paralelo
    const [googleRes, metaRes, organicoRes, whatsappRes] = await Promise.all([
      fetch(googleUrl, {
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'apikey': supabaseServiceKey,
          'Accept-Profile': supabaseSchema,
          'Content-Profile': supabaseSchema
        }
      }),
      fetch(metaUrl, {
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'apikey': supabaseServiceKey,
          'Accept-Profile': supabaseSchema,
          'Content-Profile': supabaseSchema
        }
      }),
      fetch(organicoUrl, {
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'apikey': supabaseServiceKey,
          'Accept-Profile': supabaseSchema,
          'Content-Profile': supabaseSchema
        }
      }),
      fetch(whatsappUrl, {
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
    const sources = {
      google: { count: 0, value: 0 },
      meta: { count: 0, value: 0 },
      organico: { count: 0, value: 0 },
      whatsapp: { count: 0, value: 0 }
    };

    if (googleRes.ok) {
      const data = await googleRes.json();
      sources.google = {
        count: data.length,
        value: data.reduce((total, opp) => total + (parseFloat(opp.value) || 0), 0)
      };
    }

    if (metaRes.ok) {
      const data = await metaRes.json();
      sources.meta = {
        count: data.length,
        value: data.reduce((total, opp) => total + (parseFloat(opp.value) || 0), 0)
      };
    }

    if (organicoRes.ok) {
      const data = await organicoRes.json();
      sources.organico = {
        count: data.length,
        value: data.reduce((total, opp) => total + (parseFloat(opp.value) || 0), 0)
      };
    }

    if (whatsappRes.ok) {
      const data = await whatsappRes.json();
      sources.whatsapp = {
        count: data.length,
        value: data.reduce((total, opp) => total + (parseFloat(opp.value) || 0), 0)
      };
    }

    console.log('✅ ThermometerService: Métricas por origem:', sources);
    return sources;

  } catch (error) {
    console.error('❌ Erro ao buscar métricas por origem:', error);
    throw error;
  }
};

// 🎯 FUNÇÃO PARA TESTAR CONEXÃO DO THERMOMETER SERVICE
export const testThermometerConnection = async () => {
  try {
    console.log('🔌 ThermometerService: Testando conexão...');
    
    const metrics = await getThermometerMetrics();
    console.log('✅ ThermometerService: Conexão bem-sucedida!', metrics);
    
    return { success: true, data: metrics };
  } catch (error) {
    console.error('❌ ThermometerService: Erro na conexão:', error);
    return { success: false, error: error.message };
  }
};


