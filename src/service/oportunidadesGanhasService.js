/**
 * 🟢 OPORTUNIDADES GANHAS SERVICE
 * 
 * Serviço específico para buscar as duas métricas de Oportunidades Ganhas:
 * 1. Total de Oportunidades Ganhas (gain_date=hoje, status="gain")
 * 2. Ganhas Novas (create_date no período, status="gain")
 */

// Configurações do Supabase
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
const supabaseSchema = import.meta.env.VITE_SUPABASE_SCHEMA || 'api';

/**
 * 🟢 BUSCAR MÉTRICAS DE OPORTUNIDADES GANHAS
 * 
 * @param {string} startDate - Data inicial (formato YYYY-MM-DD)
 * @param {string} endDate - Data final (formato YYYY-MM-DD)
 * @param {string} selectedFunnel - ID do funil selecionado
 * @param {string} selectedUnit - ID da unidade selecionada (formato [1], [2], etc.)
 * @param {string} selectedSeller - ID do vendedor selecionado
 * @param {string} selectedOrigin - Origem da oportunidade selecionada
 * @returns {Object} Objeto com as métricas calculadas
 */
export const getOportunidadesGanhasMetrics = async (
  startDate = null, 
  endDate = null, 
  selectedFunnel = null, 
  selectedUnit = null, 
  selectedSeller = null, 
  selectedOrigin = null
) => {
  try {
    // Normalizador robusto para valores monetários vindos do Supabase/CRM
    const parseMoneyValue = (raw) => {
      if (typeof raw === 'number') {
        return Number.isFinite(raw) ? raw : 0;
      }
      if (typeof raw === 'string') {
        // Trata formatos "1.234,56" e "1234.56"
        const sanitized = raw.replace(/\./g, '').replace(',', '.');
        const num = Number(sanitized);
        return Number.isFinite(num) ? num : 0;
      }
      return 0;
    };
    console.log('='.repeat(80));
    console.log('🟢 OportunidadesGanhasService: INICIANDO BUSCA DE MÉTRICAS');
    console.log('📅 Parâmetros recebidos:');
    console.log('  - startDate:', startDate, typeof startDate);
    console.log('  - endDate:', endDate, typeof endDate);
    console.log('  - selectedFunnel:', selectedFunnel, typeof selectedFunnel);
    console.log('  - selectedUnit:', selectedUnit, typeof selectedUnit);
    console.log('  - selectedSeller:', selectedSeller, typeof selectedSeller);
    console.log('  - selectedOrigin:', selectedOrigin, typeof selectedOrigin);
    console.log('='.repeat(80));

    // Data de hoje para fallback
    const hoje = new Date().toISOString().split('T')[0];

    // Fallback para datas se não estiverem definidas
    let dataInicio = startDate;
    let dataFim = endDate;
    
    // Usar a data fornecida em vez de "hoje" fixo
    console.log('📅 Usando data fornecida para total de ganhas:', dataInicio);
    
    if (!dataInicio || !dataFim || dataInicio === '' || dataFim === '') {
      dataInicio = hoje;
      dataFim = hoje;
      console.log('⚠️ OportunidadesGanhasService: Usando datas fallback (hoje):', { dataInicio, dataFim });
    } else {
      console.log('✅ OportunidadesGanhasService: Usando datas fornecidas:', { dataInicio, dataFim });
    }

    // Construir filtros baseados nos parâmetros
    let funilFilter = '';
    if (selectedFunnel && selectedFunnel !== 'all' && selectedFunnel !== 'TODOS' && selectedFunnel !== '' && selectedFunnel !== 'undefined') {
      funilFilter = `&funil_id=eq.${selectedFunnel}`;
      console.log('🔍 OportunidadesGanhasService: Filtro de funil específico aplicado:', funilFilter);
    } else {
      funilFilter = `&funil_id=in.(6,14)`;
      console.log('🔍 OportunidadesGanhasService: Filtro de funil incluindo ambos (6 e 14):', funilFilter);
    }
    
    let unidadeFilter = '';
    if (selectedUnit && selectedUnit !== 'all' && selectedUnit !== '' && selectedUnit !== 'undefined') {
      const unidadeValue = selectedUnit.toString();
      const unidadeEncoded = encodeURIComponent(unidadeValue);
      
      unidadeFilter = `&unidade_id=eq.${unidadeEncoded}`;
      console.log('🔍 Filtro unidade com colchetes codificados:', unidadeFilter);
      console.log('🔍 Valor original:', unidadeValue, '-> Codificado:', unidadeEncoded);
    }
    
    let sellerFilter = '';
    if (selectedSeller && selectedSeller !== 'all' && selectedSeller !== '' && selectedSeller !== 'undefined' && selectedSeller !== 'TODOS') {
      const sellerValue = encodeURIComponent(selectedSeller.toString());
      sellerFilter = `&user_id=eq.${sellerValue}`;
      console.log('🔍 Filtro de vendedor aplicado:', { selectedSeller, sellerFilter });
    } else {
      console.log('🔍 Sem filtro de vendedor:', { selectedSeller, type: typeof selectedSeller });
    }

    let originFilter = '';
    if (selectedOrigin && selectedOrigin !== 'all' && selectedOrigin !== '' && selectedOrigin !== 'undefined') {
      // Buscar o nome da origem na tabela origem_oportunidade
      try {
        const originResponse = await fetch(`${supabaseUrl}/rest/v1/origem_oportunidade?select=nome&id=eq.${selectedOrigin}`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Authorization': `Bearer ${supabaseServiceKey}`,
            'apikey': supabaseServiceKey,
            'Accept-Profile': supabaseSchema,
          }
        });

        if (originResponse.ok) {
          const originData = await originResponse.json();
          if (originData && originData.length > 0) {
            const originName = originData[0].nome;
            
            // 🌱 LÓGICA PARA ORIGEM "ORGÂNICO": incluir também registros com origem_oportunidade=null
            if (originName.toLowerCase() === 'orgânico' || originName.toLowerCase() === 'organico') {
              originFilter = `&or=(origem_oportunidade.eq.${encodeURIComponent(originName)},origem_oportunidade.is.null)`;
              console.log('🌱 Filtro de origem Orgânico (incluindo NULL):', { selectedOriginId: selectedOrigin, originName, originFilter });
            // 🔎 LÓGICA PARA "GOOGLE ADS": incluir também utm_source=google ou GoogleAds
            } else if (originName.toLowerCase() === 'google ads' || originName.toLowerCase() === 'googleads') {
              originFilter = `&or=(origem_oportunidade.eq.${encodeURIComponent(originName)},utm_source.eq.google,utm_source.eq.GoogleAds)`;
              console.log('🔎 Filtro de origem Google Ads (inclui utm_source google/GoogleAds):', { selectedOriginId: selectedOrigin, originName, originFilter });
            } else {
              originFilter = `&origem_oportunidade=eq.${encodeURIComponent(originName)}`;
              console.log('🔍 Filtro de origem convertido:', { selectedOriginId: selectedOrigin, originName, originFilter });
            }
          } else {
            console.log('⚠️ Origem não encontrada para ID:', selectedOrigin);
          }
        } else {
          console.log('⚠️ Erro ao buscar origem, usando ID diretamente:', selectedOrigin);
          originFilter = `&origem_oportunidade=eq.${encodeURIComponent(selectedOrigin)}`;
        }
      } catch (error) {
        console.log('⚠️ Erro ao buscar origem, usando ID diretamente:', error);
        originFilter = `&origem_oportunidade=eq.${encodeURIComponent(selectedOrigin)}`;
      }
    }

    const filtrosCombinados = funilFilter + unidadeFilter + sellerFilter + originFilter;
    const filtrosSemVendedor = funilFilter + unidadeFilter + /* no seller */ '' + originFilter;

    console.log('🔍 Filtros construídos:');
    console.log('  - funilFilter:', funilFilter);
    console.log('  - unidadeFilter:', unidadeFilter);
    console.log('  - sellerFilter:', sellerFilter);
    console.log('  - originFilter:', originFilter);
    console.log('  - filtrosCombinados:', filtrosCombinados);

    // 🟢 URLs principais (sempre SEM vendedor) para manter os totais gerais inalterados ao selecionar vendedor
    const totalOportunidadesGanhasUrl = `${supabaseUrl}/rest/v1/oportunidade_sprint?select=id,value&archived=eq.0&status=eq.gain&gain_date=gte.${dataInicio}&gain_date=lte.${dataFim}T23:59:59${filtrosSemVendedor}`;
    const ganhasNovasUrl = `${supabaseUrl}/rest/v1/oportunidade_sprint?select=id,value&archived=eq.0&status=eq.gain&create_date=gte.${dataInicio}&create_date=lte.${dataFim}T23:59:59${filtrosSemVendedor}`;
    console.log('🔍 URL Total Ganhas (GERAL):', totalOportunidadesGanhasUrl);
    console.log('🔍 URL Ganhas Novas (GERAL):', ganhasNovasUrl);

    // Se houver vendedor selecionado, montar URLs específicas do vendedor também
    const totalOportunidadesGanhasSellerUrl = (selectedSeller && selectedSeller !== 'all' && selectedSeller !== '' && selectedSeller !== 'undefined' && selectedSeller !== 'TODOS')
      ? `${supabaseUrl}/rest/v1/oportunidade_sprint?select=id,value&archived=eq.0&status=eq.gain&gain_date=gte.${dataInicio}&gain_date=lte.${dataFim}T23:59:59${filtrosCombinados}`
      : null;
    const ganhasNovasSellerUrl = (selectedSeller && selectedSeller !== 'all' && selectedSeller !== '' && selectedSeller !== 'undefined' && selectedSeller !== 'TODOS')
      ? `${supabaseUrl}/rest/v1/oportunidade_sprint?select=id,value&archived=eq.0&status=eq.gain&create_date=gte.${dataInicio}&create_date=lte.${dataFim}T23:59:59${filtrosCombinados}`
      : null;

    // 🎯 3. BUSCAR META DE GANHAS - Tabela metas
    const unidadeParaMeta = selectedUnit && selectedUnit !== 'all' ? selectedUnit : '[1]';
    
    let metaOportunidadesGanhasUrl;
    
    if (selectedFunnel && selectedFunnel !== 'all' && selectedFunnel !== 'TODOS' && selectedFunnel !== '' && selectedFunnel !== 'undefined') {
      // Funil específico selecionado - buscar meta específica do funil
      metaOportunidadesGanhasUrl = `${supabaseUrl}/rest/v1/metas?select=valor_da_meta&unidade_franquia=eq.${encodeURIComponent(unidadeParaMeta)}&dashboard=eq.ganhos_oportunidades&funil=eq.${selectedFunnel}`;
      console.log('🎯 Buscando meta específica do funil para ganhas:', selectedFunnel);
    } else {
      // Apenas unidade selecionada - buscar AMBOS funis (6 e 14) e somar
      metaOportunidadesGanhasUrl = `${supabaseUrl}/rest/v1/metas?select=valor_da_meta&unidade_franquia=eq.${encodeURIComponent(unidadeParaMeta)}&dashboard=eq.ganhos_oportunidades&funil=in.(6,14)`;
      console.log('🎯 Buscando metas de ambos funis (6 e 14) para somar - ganhas');
    }
    
    console.log('🔍 URL Meta Oportunidades Ganhas:', metaOportunidadesGanhasUrl);

    // Executar todas as queries em paralelo
    const [ganhasResponse, novasResponse, metaResponse, ganhasSellerResponse, novasSellerResponse] = await Promise.all([
      fetch(totalOportunidadesGanhasUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'apikey': supabaseServiceKey,
          'Accept-Profile': supabaseSchema,
        }
      }),
      fetch(ganhasNovasUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'apikey': supabaseServiceKey,
          'Accept-Profile': supabaseSchema,
        }
      }),
      fetch(metaOportunidadesGanhasUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'apikey': supabaseServiceKey,
          'Accept-Profile': supabaseSchema,
        }
      }),
      totalOportunidadesGanhasSellerUrl ? fetch(totalOportunidadesGanhasSellerUrl, { method: 'GET', headers: { 'Accept': 'application/json', 'Authorization': `Bearer ${supabaseServiceKey}`, 'apikey': supabaseServiceKey, 'Accept-Profile': supabaseSchema } }) : Promise.resolve(null),
      ganhasNovasSellerUrl ? fetch(ganhasNovasSellerUrl, { method: 'GET', headers: { 'Accept': 'application/json', 'Authorization': `Bearer ${supabaseServiceKey}`, 'apikey': supabaseServiceKey, 'Accept-Profile': supabaseSchema } }) : Promise.resolve(null)
    ]);

    // Processar resultados
    let totalOportunidadesGanhas = 0;
    let valorTotalOportunidadesGanhas = 0;
    let ganhasNovas = 0;
    let valorGanhasNovas = 0;
    // Totais do vendedor (quando houver)
    let sellerTotalGanhas = 0;
    let sellerValorGanhas = 0;
    let sellerGanhasNovas = 0;
    let sellerValorGanhasNovas = 0;
    let metaOportunidadesGanhas = 0;

    // 1. Total de Oportunidades Ganhas (gain_date=hoje)
    if (ganhasResponse.ok) {
      const ganhasData = await ganhasResponse.json();
      totalOportunidadesGanhas = ganhasData.length;
      // Para compatibilizar com o CRM: somar valores por oportunidade já truncados (sem centavos)
      // Ex.: 10,90 + 10,20 + 10,99 → 10 + 10 + 10 = 30 (CRM)
      valorTotalOportunidadesGanhas = ganhasData.reduce((total, opp) => {
        const valor = Math.floor(parseMoneyValue(opp.value));
        return total + valor;
      }, 0);
      // Arredondar para 2 casas para evitar ruídos de ponto flutuante
      valorTotalOportunidadesGanhas = Math.round(valorTotalOportunidadesGanhas * 100) / 100;
      console.log(`✅ Total Oportunidades Ganhas (hoje): ${totalOportunidadesGanhas} (R$ ${valorTotalOportunidadesGanhas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })})`);
    } else {
      console.error('❌ Erro ao buscar total de oportunidades ganhas:', ganhasResponse.status);
    }

    // 2. Ganhas Novas (create_date no período)
    if (novasResponse.ok) {
      const novasData = await novasResponse.json();
      ganhasNovas = novasData.length;
      valorGanhasNovas = novasData.reduce((total, opp) => {
        const valor = Math.floor(parseMoneyValue(opp.value));
        return total + valor;
      }, 0);
      valorGanhasNovas = Math.round(valorGanhasNovas * 100) / 100;
      console.log(`✅ Ganhas Novas (período ${dataInicio} a ${dataFim}): ${ganhasNovas} (R$ ${valorGanhasNovas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })})`);
    } else {
      console.error('❌ Erro ao buscar ganhas novas:', novasResponse.status);
    }

    // 2b. Totais do vendedor (se houver)
    if (ganhasSellerResponse) {
      if (ganhasSellerResponse && ganhasSellerResponse.ok) {
        const sellerData = await ganhasSellerResponse.json();
        sellerTotalGanhas = sellerData.length;
        sellerValorGanhas = sellerData.reduce((total, opp) => {
          const valor = Math.floor(parseMoneyValue(opp.value));
          return total + valor;
        }, 0);
      }
    }
    if (novasSellerResponse) {
      if (novasSellerResponse && novasSellerResponse.ok) {
        const sellerNovasData = await novasSellerResponse.json();
        sellerGanhasNovas = sellerNovasData.length;
        sellerValorGanhasNovas = sellerNovasData.reduce((total, opp) => {
          const valor = Math.floor(parseMoneyValue(opp.value));
          return total + valor;
        }, 0);
      }
    }

    // 3. Meta de Oportunidades Ganhas
    if (metaResponse.ok) {
      const metaData = await metaResponse.json();
      if (metaData && metaData.length > 0) {
        if (selectedFunnel && selectedFunnel !== 'all' && selectedFunnel !== 'TODOS') {
          // Funil específico - usar valor único
          metaOportunidadesGanhas = parseFloat(metaData[0].valor_da_meta) || 0;
          console.log(`✅ Meta Oportunidades Ganhas (funil ${selectedFunnel}): ${metaOportunidadesGanhas}`);
        } else {
          // Unidade selecionada (ambos funis) - somar as metas dos funis 6 e 14
          metaOportunidadesGanhas = metaData.reduce((total, meta) => {
            const valor = parseFloat(meta.valor_da_meta) || 0;
            return total + valor;
          }, 0);
          console.log(`✅ Meta Oportunidades Ganhas (soma funis 6+14): ${metaOportunidadesGanhas}`);
          console.log(`🔍 Detalhes das metas encontradas:`, metaData.map(m => ({ valor: m.valor_da_meta })));
        }
      } else {
        console.log('⚠️ Nenhuma meta encontrada para oportunidades ganhas, usando valor padrão');
        metaOportunidadesGanhas = 0; // Valor padrão
      }
    } else {
      console.error('❌ Erro ao buscar meta de oportunidades ganhas:', metaResponse.status);
      metaOportunidadesGanhas = 0; // Valor padrão em caso de erro
    }

    // 🎯 DADOS ANTERIORES - Buscar dados do período anterior para comparação
    console.log('📊 Buscando dados do período anterior para comparação...');
    const dadosAnteriores = await getOportunidadesGanhasAnteriores(dataInicio, dataFim, selectedFunnel, selectedUnit, selectedSeller, selectedOrigin);

    // 🎯 CALCULAR PERCENTUAL DA META (valor total ganho vs meta em R$)
    const percentualMeta = metaOportunidadesGanhas > 0 ? 
      ((valorTotalOportunidadesGanhas - metaOportunidadesGanhas) / metaOportunidadesGanhas) * 100 : 0;
    
    console.log(`📊 Cálculo do percentual da meta:`);
    console.log(`   - Valor Total Ganho: R$ ${valorTotalOportunidadesGanhas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
    console.log(`   - Meta: R$ ${metaOportunidadesGanhas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
    console.log(`   - Percentual: ${percentualMeta.toFixed(2)}%`);

    // 🎯 FORMATAR DADOS PARA O COMPONENTE
    const metrics = {
      totalOportunidadesGanhas: {
        current: totalOportunidadesGanhas, // Número principal: oportunidades ganhas hoje
        previous: dadosAnteriores.totalOportunidadesGanhas,
        value: valorTotalOportunidadesGanhas, // Valor embaixo: soma das oportunidades ganhas
        meta: metaOportunidadesGanhas, // Meta real da tabela metas
        metaPercentage: percentualMeta, // Percentual calculado: (ganhas - meta) / meta * 100
        change: dadosAnteriores.totalOportunidadesGanhas > 0 ? 
          ((totalOportunidadesGanhas - dadosAnteriores.totalOportunidadesGanhas) / dadosAnteriores.totalOportunidadesGanhas) * 100 : 0,
        isPositive: totalOportunidadesGanhas >= dadosAnteriores.totalOportunidadesGanhas, // Para ganhas, mais é melhor
        sellerBreakdown: selectedSeller && selectedSeller !== 'all' ? {
          count: sellerTotalGanhas,
          value: sellerValorGanhas,
          percentCount: totalOportunidadesGanhas > 0 ? (sellerTotalGanhas / totalOportunidadesGanhas) * 100 : 0,
          percentValue: valorTotalOportunidadesGanhas > 0 ? (sellerValorGanhas / valorTotalOportunidadesGanhas) * 100 : 0
        } : null
      },
      ganhasNovas: {
        current: ganhasNovas, // Número principal: oportunidades criadas no período que foram ganhas
        previous: dadosAnteriores.ganhasNovas,
        value: valorGanhasNovas, // Valor embaixo: soma das ganhas novas
        meta: Math.round(metaOportunidadesGanhas * 0.3), // Meta proporcional (30% da meta total)
        metaPercentage: percentualMeta, // Percentual calculado: (ganhas - meta) / meta * 100
        change: dadosAnteriores.ganhasNovas > 0 ? 
          ((ganhasNovas - dadosAnteriores.ganhasNovas) / dadosAnteriores.ganhasNovas) * 100 : 0,
        isPositive: ganhasNovas >= dadosAnteriores.ganhasNovas,
        sellerBreakdown: selectedSeller && selectedSeller !== 'all' ? {
          count: sellerGanhasNovas,
          value: sellerValorGanhasNovas,
          percentCount: ganhasNovas > 0 ? (sellerGanhasNovas / ganhasNovas) * 100 : 0,
          percentValue: valorGanhasNovas > 0 ? (sellerValorGanhasNovas / valorGanhasNovas) * 100 : 0
        } : null
      }
    };

    console.log('✅ OportunidadesGanhasService: Métricas calculadas:', metrics);
    return metrics;

  } catch (error) {
    console.error('❌ Erro no OportunidadesGanhasService:', error);
    throw error;
  }
};

/**
 * 🟢 BUSCAR DADOS DO PERÍODO ANTERIOR (para comparação)
 */
const getOportunidadesGanhasAnteriores = async (startDate, endDate, selectedFunnel = null, selectedUnit = null, selectedSeller = null, selectedOrigin = null) => {
  try {
    console.log('📊 Buscando dados do período anterior - ganhas...');
    
    // Data de ontem para total de ganhas anteriores
    const ontem = new Date();
    ontem.setDate(ontem.getDate() - 1);
    const ontemStr = ontem.toISOString().split('T')[0];

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
    
    console.log('📅 Período anterior - ganhas:', { ontem: ontemStr, dataInicioAnterior, dataFimAnterior });

    // Construir filtros
    const funilFilter = selectedFunnel && selectedFunnel !== 'all' && selectedFunnel !== 'TODOS' ? `&funil_id=eq.${selectedFunnel}` : `&funil_id=in.(6,14)`;
    const unidadeFilter = selectedUnit && selectedUnit !== 'all' ? `&unidade_id=eq.${encodeURIComponent(selectedUnit.toString())}` : '';
    const sellerFilter = selectedSeller && selectedSeller !== 'all' ? `&user_id=eq.${selectedSeller}` : '';
    
    // Filtro de origem (mesma lógica da função principal)
    let originFilter = '';
    if (selectedOrigin && selectedOrigin !== 'all') {
      try {
        const originResponse = await fetch(`${supabaseUrl}/rest/v1/origem_oportunidade?select=nome&id=eq.${selectedOrigin}`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Authorization': `Bearer ${supabaseServiceKey}`,
            'apikey': supabaseServiceKey,
            'Accept-Profile': supabaseSchema,
          }
        });

        if (originResponse.ok) {
          const originData = await originResponse.json();
          if (originData && originData.length > 0) {
            const originName = originData[0].nome;
            
            if (originName.toLowerCase() === 'orgânico' || originName.toLowerCase() === 'organico') {
              originFilter = `&or=(origem_oportunidade.eq.${encodeURIComponent(originName)},origem_oportunidade.is.null)`;
            } else if (originName.toLowerCase() === 'google ads' || originName.toLowerCase() === 'googleads') {
              originFilter = `&or=(origem_oportunidade.eq.${encodeURIComponent(originName)},utm_source.eq.google,utm_source.eq.GoogleAds)`;
            } else {
              originFilter = `&origem_oportunidade=eq.${encodeURIComponent(originName)}`;
            }
          }
        }
      } catch (error) {
        console.log('⚠️ Erro ao buscar origem para período anterior - ganhas:', error);
      }
    }

    const filtrosCombinados = funilFilter + unidadeFilter + sellerFilter + originFilter;

    // 🟢 BUSCAR DADOS ESPECÍFICOS DO PERÍODO ANTERIOR
    const totalGanhasAnteriorUrl = `${supabaseUrl}/rest/v1/oportunidade_sprint?select=id,value&archived=eq.0&status=eq.gain&gain_date=gte.${ontemStr}&gain_date=lte.${ontemStr}T23:59:59${filtrosCombinados}`;
    const ganhasNovasAnteriorUrl = `${supabaseUrl}/rest/v1/oportunidade_sprint?select=id,value&archived=eq.0&status=eq.gain&create_date=gte.${dataInicioAnterior}&create_date=lte.${dataFimAnterior}T23:59:59${filtrosCombinados}`;
    
    // Executar queries em paralelo
    const [totalGanhasResponse, ganhasNovasResponse] = await Promise.all([
      fetch(totalGanhasAnteriorUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'apikey': supabaseServiceKey,
          'Accept-Profile': supabaseSchema,
        }
      }),
      fetch(ganhasNovasAnteriorUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'apikey': supabaseServiceKey,
          'Accept-Profile': supabaseSchema,
        }
      })
    ]);

    if (totalGanhasResponse.ok && ganhasNovasResponse.ok) {
      const totalGanhasData = await totalGanhasResponse.json();
      const ganhasNovasData = await ganhasNovasResponse.json();
      
      return {
        totalOportunidadesGanhas: totalGanhasData.length,
        ganhasNovas: ganhasNovasData.length
      };
    }

    // Fallback se não conseguir buscar dados anteriores
    return {
      totalOportunidadesGanhas: 0,
      ganhasNovas: 0
    };

  } catch (error) {
    console.error('❌ Erro ao buscar dados anteriores - ganhas:', error);
    return {
      totalOportunidadesGanhas: 0,
      ganhasNovas: 0
    };
  }
};
