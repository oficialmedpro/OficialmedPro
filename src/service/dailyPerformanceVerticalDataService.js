/**
 * 🎯 DAILY PERFORMANCE VERTICAL DATA SERVICE
 *
 * Service para buscar dados de performance agrupados por horário das rondas
 * Baseado na mesma estrutura do daily-performance-table mas agrupando por intervalos de horário
 */

import { supabaseUrl, supabaseServiceKey, supabaseSchema } from '../config/supabase.js';

/**
 * Buscar metas diárias e calcular metas por ronda
 */
const buscarMetasDiarias = async (params, metasDebugInfo = {}) => {
  try {
    const { selectedFunnel, selectedUnit, selectedSeller } = params;

    const metasDiarias = {};
    const metasPorRonda = {};

    // Mapear dashboards das metas diárias
    // Se não há vendedor selecionado, usar metas gerais
    const dashboardsMetas = selectedSeller && selectedSeller !== 'all' ? {
      'leads': 'oportunidades_diaria',
      'vendas': 'oportunidades_diaria_ganhas', 
      'faturamento': 'oportunidades_faturamento',
      'conversao': 'taxa_conversao_diaria',
      'ticketMedio': 'ticket_medio_diario'
    } : {
      'leads': 'novas_oportunidades',
      'vendas': 'ganhos_oportunidades',
      'faturamento': 'oportunidades_faturamento_diario',
      'conversao': 'conversao_ronda', // Usar conversao_ronda como base
      'ticketMedio': 'ticketmedio_oportunidades'
    };

    console.log('🔍 Buscando metas diárias com dashboards:', dashboardsMetas);

    for (const [metrica, dashboard] of Object.entries(dashboardsMetas)) {
      // Aplicar filtros
      const funilFilter = (selectedFunnel && selectedFunnel !== 'all' && selectedFunnel !== '' && selectedFunnel !== 'undefined')
        ? `&funil=eq.${selectedFunnel}`
        : `&funil=in.(6,14)`;
      const vendedorFilter = (selectedSeller && selectedSeller !== 'all' && selectedSeller !== '' && selectedSeller !== 'undefined')
        ? `&vendedor_id=eq.${selectedSeller}`
        : '&vendedor_id=is.null';
      const unidadeFilter = selectedUnit && selectedUnit !== 'all'
        ? `&unidade_franquia=eq.${encodeURIComponent(selectedUnit)}`
        : '';

      // Para vendas e faturamento, determinar tipo de meta baseado no dia
      let tipoMetaFilter = '';
      if ((metrica === 'vendas' && dashboard === 'ganhos_oportunidades') || 
          (metrica === 'faturamento' && dashboard === 'oportunidades_faturamento_diario')) {
        // Determinar se é sábado ou dia da semana
        const hoje = new Date();
        const diaSemana = hoje.getDay(); // 0 = domingo, 6 = sábado
        
        if (diaSemana === 6) {
          // Sábado
          tipoMetaFilter = '&tipo_meta=eq.sabado';
        } else {
          // Dia da semana
          tipoMetaFilter = '&tipo_meta=eq.diaria';
        }
      }

      let query = `metas?select=id,nome_meta,valor_da_meta,dashboard&dashboard=eq.${dashboard}${funilFilter}${vendedorFilter}${unidadeFilter}${tipoMetaFilter}`;

      const response = await fetch(`${supabaseUrl}/rest/v1/${query}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'apikey': supabaseServiceKey,
          'Accept-Profile': 'api',
          'Content-Profile': 'api'
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log(`🔍 Dados encontrados para ${metrica} (${dashboard}):`, data);

        if (data.length > 0) {
          // Somar todas as metas (pode haver múltiplos vendedores)
          const totalMeta = data.reduce((total, registro) => {
            return total + (parseFloat(registro.valor_da_meta) || 0);
          }, 0);

          // Para conversão e ticket médio, calcular média se houver múltiplos valores
          let valorFinal = totalMeta;
          if ((metrica === 'conversao' || metrica === 'ticketMedio') && data.length > 1) {
            valorFinal = totalMeta / data.length;
            console.log(`🔍 ${metrica} - Total: ${totalMeta}, Quantidade: ${data.length}, Média: ${valorFinal}`);
          }

          // Armazenar meta diária
          metasDiarias[metrica] = valorFinal;
          
              // Calcular meta por ronda
              if (metrica === 'conversao' || metrica === 'ticketMedio') {
                // Para conversão e ticket médio, usar o valor completo (não dividir)
                metasPorRonda[metrica] = valorFinal;
              } else {
                // Para leads, vendas e faturamento, dividir por 6 e arredondar para inteiro
                metasPorRonda[metrica] = Math.round(valorFinal / 6);
              }

          console.log(`📊 Meta diária ${metrica}: ${valorFinal} | Meta por ronda: ${metasPorRonda[metrica]}`);
        } else {
          console.log(`⚠️ Nenhuma meta encontrada para ${metrica} (${dashboard})`);
        }
      } else {
        console.error(`❌ Erro ao buscar meta ${metrica} (${dashboard}):`, response.status);
      }
    }

    return { metasDiarias, metasPorRonda };

  } catch (error) {
    console.error(`❌ Erro ao buscar metas diárias:`, error);
    return { metasDiarias: {}, metasPorRonda: {} };
  }
};

/**
 * Buscar dados de leads agrupados por horário das rondas
 * @param {string} startDate - Data inicial (YYYY-MM-DD)
 * @param {string} endDate - Data final (YYYY-MM-DD)
 * @param {string} selectedFunnel - Funil selecionado
 * @param {string} selectedUnit - Unidade selecionada
 * @param {string} selectedSeller - Vendedor selecionado
 * @param {string} selectedOrigin - Origem selecionada
 * @returns {Promise<Object>} Dados de performance por ronda/horário
 */
export const getPerformanceDataByRondaHorario = async (params) => {
  try {
    const { startDate, endDate, selectedFunnel, selectedUnit, selectedSeller, selectedOrigin } = params;

    console.log('📊 Buscando dados de performance por horário das rondas...', params);

    // Array para armazenar informações de debug
    const debugInfo = [];
    let metasDebugInfo = {};

    // Primeiro buscar as rondas com seus horários
    const rondasResponse = await fetch(`${supabaseUrl}/rest/v1/rondas?select=nome,hora_inicio,hora_fim&order=nome.asc`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'apikey': supabaseServiceKey,
        'Accept-Profile': 'api',  // FORÇAR schema api
        'Content-Profile': 'api'  // FORÇAR schema api
      }
    });

    if (!rondasResponse.ok) {
      throw new Error(`Erro ao buscar rondas: ${rondasResponse.status}`);
    }

    const rondas = await rondasResponse.json();
    console.log('🎯 RONDAS E HORÁRIOS CARREGADOS:');
    rondas.forEach((ronda, index) => {
      console.log(`   ${index + 1}. ${ronda.nome}: ${ronda.hora_inicio} às ${ronda.hora_fim}`);
    });

    // Agora buscar os leads agrupados por horário
    const performanceData = {};

    for (const ronda of rondas) {
      const { nome, hora_inicio, hora_fim } = ronda;

      // TESTE DIAGNÓSTICO: BUSCA SEM FILTROS PRIMEIRO
      console.log(`🎯 TESTE DIAGNÓSTICO RONDA ${nome}:`);

      // TESTE 1: Busca total sem filtros
      let queryTeste = `oportunidade_sprint?select=id,create_date&archived=eq.0`;
      console.log(`🧪 TESTE 1 - Query SEM FILTROS: ${supabaseUrl}/rest/v1/${queryTeste}`);

      const responseTeste = await fetch(`${supabaseUrl}/rest/v1/${queryTeste}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'apikey': supabaseServiceKey,
          'Accept-Profile': 'api',
          'Content-Profile': 'api'
        }
      });

      let totalRegistros = 0;
      let registrosDia = 0;

      if (responseTeste.ok) {
        const dataTeste = await responseTeste.json();
        totalRegistros = dataTeste.length;
        console.log(`🧪 TESTE 1 RESULTADO: ${dataTeste.length} registros TOTAIS na tabela`);
      } else {
        console.log(`❌ TESTE 1 FALHOU: ${responseTeste.status}`);
      }

      // TESTE 2: Busca apenas por data (dia todo)
      let queryDia = `oportunidade_sprint?select=id,create_date&archived=eq.0&create_date=gte.${startDate}T00:00:00&create_date=lte.${startDate}T23:59:59`;
      console.log(`🧪 TESTE 2 - Query DIA TODO: ${supabaseUrl}/rest/v1/${queryDia}`);

      const responseDia = await fetch(`${supabaseUrl}/rest/v1/${queryDia}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'apikey': supabaseServiceKey,
          'Accept-Profile': 'api',
          'Content-Profile': 'api'
        }
      });

      if (responseDia.ok) {
        const dataDia = await responseDia.json();
        registrosDia = dataDia.length;
        console.log(`🧪 TESTE 2 RESULTADO: ${dataDia.length} registros no dia ${startDate}`);
      } else {
        console.log(`❌ TESTE 2 FALHOU: ${responseDia.status}`);
      }

      // Adicionar ao debug
      debugInfo.push({
        ronda: nome,
        horario: `${hora_inicio} às ${hora_fim}`,
        totalTabela: totalRegistros,
        totalDia: registrosDia,
        data: startDate
      });

      // BUSCA 1: LEADS - Filtrar por create_date
      console.log(`🎯 LEADS REALIZADO: Buscando oportunidades por create_date para ronda ${nome}`);

      let leadsQuery = `oportunidade_sprint?select=id,create_date&archived=eq.0`;

      // Aplicar filtro de horário baseado em create_date
      if (hora_inicio && hora_fim && startDate) {
        const dataInicio = `${startDate}T${hora_inicio}`;
        const dataFim = `${startDate}T${hora_fim}`;
        leadsQuery += `&create_date=gte.${dataInicio}&create_date=lt.${dataFim}`;
      } else if (startDate && endDate) {
        leadsQuery += `&create_date=gte.${startDate}T00:00:00&create_date=lte.${endDate}T23:59:59`;
      }

      // Aplicar filtros gerais para leads
      if (selectedFunnel && selectedFunnel !== 'all') {
        leadsQuery += `&funil_id=eq.${selectedFunnel}`;
      }
      if (selectedUnit && selectedUnit !== 'all') {
        leadsQuery += `&unidade_id=eq.${selectedUnit}`;
      }
      if (selectedSeller && selectedSeller !== 'all') {
        leadsQuery += `&user_id=eq.${selectedSeller}`;
      }
      if (selectedOrigin && selectedOrigin !== 'all') {
        leadsQuery += `&origem_oportunidade=eq.${selectedOrigin}`;
      }

      const leadsResponse = await fetch(`${supabaseUrl}/rest/v1/${leadsQuery}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'apikey': supabaseServiceKey,
          'Accept-Profile': 'api',
          'Content-Profile': 'api'
        }
      });

      let leadsCount = 0;
      if (leadsResponse.ok) {
        const leadsData = await leadsResponse.json();
        leadsCount = leadsData.length;
        console.log(`🎯 LEADS ENCONTRADOS (create_date): ${leadsCount}`);
      }

      // BUSCA 2: VENDAS/FATURAMENTO - Filtrar por gain_date
      console.log(`🎯 VENDAS/FATURAMENTO: Buscando oportunidades por gain_date para ronda ${nome}`);

      let vendasQuery = `oportunidade_sprint?select=id,value,gain_date&archived=eq.0&status=eq.gain`;

      // Aplicar filtro de horário baseado em gain_date
      if (hora_inicio && hora_fim && startDate) {
        const dataInicio = `${startDate}T${hora_inicio}`;
        const dataFim = `${startDate}T${hora_fim}`;
        vendasQuery += `&gain_date=gte.${dataInicio}&gain_date=lt.${dataFim}`;
      } else if (startDate && endDate) {
        vendasQuery += `&gain_date=gte.${startDate}T00:00:00&gain_date=lte.${endDate}T23:59:59`;
      }

      // Aplicar filtros gerais para vendas
      if (selectedFunnel && selectedFunnel !== 'all') {
        vendasQuery += `&funil_id=eq.${selectedFunnel}`;
      }
      if (selectedUnit && selectedUnit !== 'all') {
        vendasQuery += `&unidade_id=eq.${selectedUnit}`;
      }
      if (selectedSeller && selectedSeller !== 'all') {
        vendasQuery += `&user_id=eq.${selectedSeller}`;
      }
      if (selectedOrigin && selectedOrigin !== 'all') {
        vendasQuery += `&origem_oportunidade=eq.${selectedOrigin}`;
      }

      const vendasResponse = await fetch(`${supabaseUrl}/rest/v1/${vendasQuery}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'apikey': supabaseServiceKey,
          'Accept-Profile': 'api',
          'Content-Profile': 'api'
        }
      });

      let vendasCount = 0;
      let faturamentoTotal = 0;

      if (vendasResponse.ok) {
        const vendasData = await vendasResponse.json();
        vendasCount = vendasData.length;
        faturamentoTotal = vendasData.reduce((sum, opp) => sum + (parseFloat(opp.value) || 0), 0);
        console.log(`🎯 VENDAS ENCONTRADAS (gain_date): ${vendasCount}`);
        console.log(`🎯 FATURAMENTO CALCULADO: ${faturamentoTotal}`);
      }

      // Adicionar debug info
      debugInfo[debugInfo.length - 1].leadsQuery = leadsQuery;
      debugInfo[debugInfo.length - 1].vendasQuery = vendasQuery;
      debugInfo[debugInfo.length - 1].leadsCount = leadsCount;
      debugInfo[debugInfo.length - 1].vendasCount = vendasCount;

      const conversaoRate = leadsCount > 0 ? (vendasCount / leadsCount) * 100 : 0;
      const ticketMedio = vendasCount > 0 ? faturamentoTotal / vendasCount : 0;

      console.log(`🎯 MÉTRICAS FINAIS RONDA ${nome}:`, {
        'LEADS REALIZADO': leadsCount,
        'VENDAS': vendasCount,
        'FATURAMENTO': faturamentoTotal,
        'CONVERSÃO': conversaoRate.toFixed(1) + '%',
        'TICKET MÉDIO': ticketMedio.toFixed(0)
      });

      // Buscar metas diárias e calcular metas por ronda
      const { metasDiarias, metasPorRonda } = await buscarMetasDiarias(params, metasDebugInfo);

      // Adicionar debug das metas ao debugInfo da ronda
      debugInfo[debugInfo.length - 1].metasDebug = metasDebugInfo;

      // Usar metas por ronda calculadas (meta diária ÷ 6)
      const metaLeads = metasPorRonda.leads || 0;
      const metaVendas = metasPorRonda.vendas || 0;
      const metaFaturamento = metasPorRonda.faturamento || 0;
      const metaConversao = metasPorRonda.conversao || 0;
      const metaTicketMedio = metasPorRonda.ticketMedio || 0;

      console.log(`📊 Metas aplicadas para ronda ${nome}:`, {
        leads: metaLeads,
        vendas: metaVendas,
        faturamento: metaFaturamento,
        conversao: metaConversao,
        ticketMedio: metaTicketMedio
      });

      performanceData[nome] = {
        leads: {
          realizado: leadsCount,
          meta: metaLeads,
          gap: Math.round(leadsCount - metaLeads)
        },
        vendas: {
          realizado: vendasCount,
          meta: metaVendas,
          gap: Math.round(vendasCount - metaVendas)
        },
        faturamento: {
          realizado: faturamentoTotal,
          meta: metaFaturamento,
          gap: Math.round(faturamentoTotal - metaFaturamento)
        },
        conversao: {
          realizado: parseFloat(conversaoRate.toFixed(1)),
          meta: metaConversao,
          gap: parseFloat((conversaoRate - metaConversao).toFixed(1))
        },
        ticketMedio: {
          realizado: parseFloat(ticketMedio.toFixed(0)),
          meta: metaTicketMedio,
          gap: parseFloat((ticketMedio - metaTicketMedio).toFixed(0))
        }
      };
    }

    console.log('✅ Dados de performance por ronda processados:', performanceData);

    // BUSCAR DADOS TOTAIS DO DIA (mesma lógica da DailyPerformanceTable mas simplificada)
    console.log('🎯 TOTAL DO DIA: Buscando dados totais do dia...');

    // BUSCA TOTAL LEADS (usando create_date como DailyPerformanceTable)
    let totalLeadsQuery = `oportunidade_sprint?select=id&archived=eq.0`;
    if (startDate && endDate) {
      totalLeadsQuery += `&create_date=gte.${startDate}T00:00:00&create_date=lte.${endDate}T23:59:59`;
    }

    // Aplicar filtros como no DailyPerformanceService
    if (selectedFunnel && selectedFunnel !== 'all' && selectedFunnel !== '' && selectedFunnel !== 'undefined') {
      totalLeadsQuery += `&funil_id=eq.${selectedFunnel}`;
    } else {
      totalLeadsQuery += `&funil_id=in.(6,14)`;
    }

    if (selectedUnit && selectedUnit !== 'all' && selectedUnit !== '' && selectedUnit !== 'undefined') {
      totalLeadsQuery += `&unidade_id=eq.${encodeURIComponent(selectedUnit)}`;
    }

    if (selectedSeller && selectedSeller !== 'all' && selectedSeller !== '' && selectedSeller !== 'undefined') {
      totalLeadsQuery += `&user_id=eq.${selectedSeller}`;
    }

    if (selectedOrigin && selectedOrigin !== 'all' && selectedOrigin !== '' && selectedOrigin !== 'undefined') {
      totalLeadsQuery += `&origem_oportunidade=eq.${selectedOrigin}`;
    }

    console.log('🎯 TOTAL LEADS Query:', totalLeadsQuery);

    const totalLeadsResponse = await fetch(`${supabaseUrl}/rest/v1/${totalLeadsQuery}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'apikey': supabaseServiceKey,
        'Accept-Profile': 'api',
        'Content-Profile': 'api'
      }
    });

    let totalLeadsCount = 0;
    if (totalLeadsResponse.ok) {
      const totalLeadsData = await totalLeadsResponse.json();
      totalLeadsCount = totalLeadsData.length;
      console.log(`🎯 TOTAL LEADS DIA: ${totalLeadsCount}`);
    } else {
      console.error('❌ Erro ao buscar total leads:', totalLeadsResponse.status);
    }

    // BUSCA TOTAL VENDAS/FATURAMENTO (usando gain_date como DailyPerformanceTable)
    let totalVendasQuery = `oportunidade_sprint?select=id,value&archived=eq.0&status=eq.gain`;
    if (startDate && endDate) {
      totalVendasQuery += `&gain_date=gte.${startDate}T00:00:00&gain_date=lte.${endDate}T23:59:59`;
    }

    // Aplicar mesmos filtros
    if (selectedFunnel && selectedFunnel !== 'all' && selectedFunnel !== '' && selectedFunnel !== 'undefined') {
      totalVendasQuery += `&funil_id=eq.${selectedFunnel}`;
    } else {
      totalVendasQuery += `&funil_id=in.(6,14)`;
    }

    if (selectedUnit && selectedUnit !== 'all' && selectedUnit !== '' && selectedUnit !== 'undefined') {
      totalVendasQuery += `&unidade_id=eq.${encodeURIComponent(selectedUnit)}`;
    }

    if (selectedSeller && selectedSeller !== 'all' && selectedSeller !== '' && selectedSeller !== 'undefined') {
      totalVendasQuery += `&user_id=eq.${selectedSeller}`;
    }

    if (selectedOrigin && selectedOrigin !== 'all' && selectedOrigin !== '' && selectedOrigin !== 'undefined') {
      totalVendasQuery += `&origem_oportunidade=eq.${selectedOrigin}`;
    }

    console.log('🎯 TOTAL VENDAS Query:', totalVendasQuery);

    const totalVendasResponse = await fetch(`${supabaseUrl}/rest/v1/${totalVendasQuery}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'apikey': supabaseServiceKey,
        'Accept-Profile': 'api',
        'Content-Profile': 'api'
      }
    });

    let totalVendasCount = 0;
    let totalFaturamentoTotal = 0;

    if (totalVendasResponse.ok) {
      const totalVendasData = await totalVendasResponse.json();
      totalVendasCount = totalVendasData.length;
      totalFaturamentoTotal = totalVendasData.reduce((sum, opp) => sum + (parseFloat(opp.value) || 0), 0);
      console.log(`🎯 TOTAL VENDAS DIA: ${totalVendasCount}`);
      console.log(`🎯 TOTAL FATURAMENTO DIA: ${totalFaturamentoTotal}`);
    } else {
      console.error('❌ Erro ao buscar total vendas:', totalVendasResponse.status);
    }

    // Calcular métricas totais
    const totalConversaoRate = totalLeadsCount > 0 ? (totalVendasCount / totalLeadsCount) * 100 : 0;
    const totalTicketMedio = totalVendasCount > 0 ? totalFaturamentoTotal / totalVendasCount : 0;

    console.log(`🎯 MÉTRICAS TOTAIS DO DIA:`, {
      'TOTAL LEADS': totalLeadsCount,
      'TOTAL VENDAS': totalVendasCount,
      'TOTAL FATURAMENTO': totalFaturamentoTotal,
      'TOTAL CONVERSÃO': totalConversaoRate.toFixed(1) + '%',
      'TOTAL TICKET MÉDIO': totalTicketMedio.toFixed(0)
    });

    // Buscar metas diárias para usar nas colunas Fechamento e Total
    const { metasDiarias } = await buscarMetasDiarias(params, metasDebugInfo);
    
    console.log('🎯 METAS DIÁRIAS ENCONTRADAS:', metasDiarias);
    console.log('🎯 PARAMS PARA BUSCA:', params);

    // Calcular dados de fechamento usando metas diárias
    const fechamento = calculateFechamentoData(performanceData, metasDiarias);
    
    console.log('🎯 FECHAMENTO CALCULADO:', fechamento);

    const totalData = {
      leads: {
        realizado: totalLeadsCount,
        meta: metasDiarias.leads || 0,
        gap: Math.round(totalLeadsCount - (metasDiarias.leads || 0))
      },
      vendas: {
        realizado: totalVendasCount,
        meta: metasDiarias.vendas || 0,
        gap: Math.round(totalVendasCount - (metasDiarias.vendas || 0))
      },
      faturamento: {
        realizado: totalFaturamentoTotal,
        meta: metasDiarias.faturamento || 0,
        gap: Math.round(totalFaturamentoTotal - (metasDiarias.faturamento || 0))
      },
      conversao: {
        realizado: parseFloat(totalConversaoRate.toFixed(1)),
        meta: metasDiarias.conversao || 0,
        gap: parseFloat((totalConversaoRate - (metasDiarias.conversao || 0)).toFixed(1))
      },
      ticketMedio: {
        realizado: parseFloat(totalTicketMedio.toFixed(0)),
        meta: metasDiarias.ticketMedio || 0,
        gap: parseFloat((totalTicketMedio - (metasDiarias.ticketMedio || 0)).toFixed(0))
      }
    };

    return {
      rondas: rondas,
      performanceData: performanceData,
      fechamentoData: fechamento,  // Dados de fechamento com metas diárias
      totalData: totalData,  // Dados totais do dia
      debugInfo: debugInfo,  // Adicionar info de debug
      metasDebugInfo: metasDebugInfo  // Debug das metas
    };

  } catch (error) {
    console.error('❌ Erro ao buscar dados de performance por horário:', error);

    // SEM fallback - retornar erro real
    throw error;
  }
};

/**
 * Calcular dados de fechamento (totalização das rondas)
 * @param {Object} performanceData - Dados de performance por ronda
 * @param {Object} metasDiarias - Metas diárias para usar no fechamento
 * @returns {Object} Dados de fechamento totalizados
 */
export const calculateFechamentoData = (performanceData, metasDiarias = {}) => {
  const fechamento = {
    leads: { realizado: 0, meta: metasDiarias.leads || 0, gap: 0 },
    vendas: { realizado: 0, meta: metasDiarias.vendas || 0, gap: 0 },
    faturamento: { realizado: 0, meta: metasDiarias.faturamento || 0, gap: 0 },
    conversao: { realizado: 0, meta: metasDiarias.conversao || 0, gap: 0 },
    ticketMedio: { realizado: 0, meta: metasDiarias.ticketMedio || 0, gap: 0 }
  };

  console.log('🎯 FECHAMENTO - Metas diárias recebidas:', metasDiarias);

  const rondas = Object.keys(performanceData);
  if (rondas.length === 0) return fechamento;

  // Somar totais realizados das rondas
  rondas.forEach(ronda => {
    const data = performanceData[ronda];
    fechamento.leads.realizado += data.leads.realizado;
    fechamento.vendas.realizado += data.vendas.realizado;
    fechamento.faturamento.realizado += data.faturamento.realizado;
  });

  // Calcular gaps usando metas diárias (arredondados)
  fechamento.leads.gap = Math.round(fechamento.leads.realizado - fechamento.leads.meta);
  fechamento.vendas.gap = Math.round(fechamento.vendas.realizado - fechamento.vendas.meta);
  fechamento.faturamento.gap = Math.round(fechamento.faturamento.realizado - fechamento.faturamento.meta);

  // Calcular conversão realizada (total de vendas / total de leads * 100)
  fechamento.conversao.realizado = fechamento.leads.realizado > 0
    ? parseFloat(((fechamento.vendas.realizado / fechamento.leads.realizado) * 100).toFixed(1))
    : 0;

  fechamento.conversao.gap = parseFloat((fechamento.conversao.realizado - fechamento.conversao.meta).toFixed(1));

  // Calcular ticket médio realizado (total faturamento / total vendas)
  fechamento.ticketMedio.realizado = fechamento.vendas.realizado > 0
    ? parseFloat((fechamento.faturamento.realizado / fechamento.vendas.realizado).toFixed(0))
    : 0;

  fechamento.ticketMedio.gap = parseFloat((fechamento.ticketMedio.realizado - fechamento.ticketMedio.meta).toFixed(0));

  return fechamento;
};