/**
 * 🔴 OPORTUNIDADES PERDIDAS SERVICE
 * 
 * Serviço específico para buscar as duas métricas de Oportunidades Perdidas:
 * 1. Total de Oportunidades Perdidas (lost_date=hoje, status="lost")
 * 2. Perdas Novas (create_date no período, status="lost")
 */

// Configurações do Supabase
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
const supabaseSchema = import.meta.env.VITE_SUPABASE_SCHEMA || 'api';

/**
 * 🔴 BUSCAR MÉTRICAS DE OPORTUNIDADES PERDIDAS
 * 
 * @param {string} startDate - Data inicial (formato YYYY-MM-DD)
 * @param {string} endDate - Data final (formato YYYY-MM-DD)
 * @param {string} selectedFunnel - ID do funil selecionado
 * @param {string} selectedUnit - ID da unidade selecionada (formato [1], [2], etc.)
 * @param {string} selectedSeller - ID do vendedor selecionado
 * @param {string} selectedOrigin - Origem da oportunidade selecionada
 * @returns {Object} Objeto com as métricas calculadas
 */
export const getOportunidadesPerdidasMetrics = async (
  startDate = null, 
  endDate = null, 
  selectedFunnel = null, 
  selectedUnit = null, 
  selectedSeller = null, 
  selectedOrigin = null
) => {
  try {
    console.log('='.repeat(80));
    console.log('🔴 OportunidadesPerdidasService: INICIANDO BUSCA DE MÉTRICAS');
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
    console.log('📅 Usando data fornecida para total de perdas:', dataInicio);
    
    if (!dataInicio || !dataFim || dataInicio === '' || dataFim === '') {
      dataInicio = hoje;
      dataFim = hoje;
      console.log('⚠️ OportunidadesPerdidasService: Usando datas fallback (hoje):', { dataInicio, dataFim });
    } else {
      console.log('✅ OportunidadesPerdidasService: Usando datas fornecidas:', { dataInicio, dataFim });
    }

    // Construir filtros baseados nos parâmetros
    let funilFilter = '';
    if (selectedFunnel && selectedFunnel !== 'all' && selectedFunnel !== '' && selectedFunnel !== 'undefined') {
      funilFilter = `&funil_id=eq.${selectedFunnel}`;
      console.log('🔍 OportunidadesPerdidasService: Filtro de funil aplicado:', funilFilter);
    } else {
      console.log('🔍 OportunidadesPerdidasService: Sem filtro de funil (selectedFunnel:', selectedFunnel, ')');
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
      sellerFilter = `&user_id=eq.${selectedSeller}`;
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

    console.log('🔍 Filtros construídos:');
    console.log('  - funilFilter:', funilFilter);
    console.log('  - unidadeFilter:', unidadeFilter);
    console.log('  - sellerFilter:', sellerFilter);
    console.log('  - originFilter:', originFilter);
    console.log('  - filtrosCombinados:', filtrosCombinados);

    // 🔴 1. TOTAL DE OPORTUNIDADES PERDIDAS - lost_date no período + status="lost"
    const totalOportunidadesPerdidasUrl = `${supabaseUrl}/rest/v1/oportunidade_sprint?select=id,value&archived=eq.0&status=eq.lost&lost_date=gte.${dataInicio}&lost_date=lte.${dataFim}T23:59:59${filtrosCombinados}`;
    console.log('🔍 URL Total Oportunidades Perdidas (período):', totalOportunidadesPerdidasUrl);

    // 🆕 2. PERDAS NOVAS - create_date no período + status="lost"
    const perdasNovasUrl = `${supabaseUrl}/rest/v1/oportunidade_sprint?select=id,value&archived=eq.0&status=eq.lost&create_date=gte.${dataInicio}&create_date=lte.${dataFim}T23:59:59${filtrosCombinados}`;
    console.log('🔍 URL Perdas Novas (período):', perdasNovasUrl);

    // 🎯 3. BUSCAR META DE PERDAS - Tabela metas
    const unidadeParaMeta = selectedUnit && selectedUnit !== 'all' ? selectedUnit : '[1]';
    
    let metaOportunidadesPerdidasUrl;
    
    if (selectedFunnel && selectedFunnel !== 'all' && selectedFunnel !== '' && selectedFunnel !== 'undefined') {
      // Funil específico selecionado - buscar meta específica do funil
      metaOportunidadesPerdidasUrl = `${supabaseUrl}/rest/v1/metas?select=valor_da_meta&unidade_franquia=eq.${encodeURIComponent(unidadeParaMeta)}&dashboard=eq.perdas_oportunidades&funil=eq.${selectedFunnel}`;
      console.log('🎯 Buscando meta específica do funil para perdas:', selectedFunnel);
    } else {
      // Apenas unidade selecionada - buscar AMBOS funis (6 e 14) e somar
      metaOportunidadesPerdidasUrl = `${supabaseUrl}/rest/v1/metas?select=valor_da_meta&unidade_franquia=eq.${encodeURIComponent(unidadeParaMeta)}&dashboard=eq.perdas_oportunidades&funil=in.(6,14)`;
      console.log('🎯 Buscando metas de ambos funis (6 e 14) para somar - perdas');
    }
    
    console.log('🔍 URL Meta Oportunidades Perdidas:', metaOportunidadesPerdidasUrl);

    // Executar todas as queries em paralelo
    const [perdidasResponse, novasResponse, metaResponse] = await Promise.all([
      fetch(totalOportunidadesPerdidasUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'apikey': supabaseServiceKey,
          'Accept-Profile': supabaseSchema,
        }
      }),
      fetch(perdasNovasUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'apikey': supabaseServiceKey,
          'Accept-Profile': supabaseSchema,
        }
      }),
      fetch(metaOportunidadesPerdidasUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'apikey': supabaseServiceKey,
          'Accept-Profile': supabaseSchema,
        }
      })
    ]);

    // Processar resultados
    let totalOportunidadesPerdidas = 0;
    let valorTotalOportunidadesPerdidas = 0;
    let perdasNovas = 0;
    let valorPerdasNovas = 0;
    let metaOportunidadesPerdidas = 0;

    // 1. Total de Oportunidades Perdidas (lost_date=hoje)
    if (perdidasResponse.ok) {
      const perdidasData = await perdidasResponse.json();
      totalOportunidadesPerdidas = perdidasData.length;
      valorTotalOportunidadesPerdidas = perdidasData.reduce((total, opp) => {
        const valor = parseFloat(opp.value) || 0;
        return total + valor;
      }, 0);
      console.log(`✅ Total Oportunidades Perdidas (hoje): ${totalOportunidadesPerdidas} (R$ ${valorTotalOportunidadesPerdidas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })})`);
    } else {
      console.error('❌ Erro ao buscar total de oportunidades perdidas:', perdidasResponse.status);
    }

    // 2. Perdas Novas (create_date no período)
    if (novasResponse.ok) {
      const novasData = await novasResponse.json();
      perdasNovas = novasData.length;
      valorPerdasNovas = novasData.reduce((total, opp) => {
        const valor = parseFloat(opp.value) || 0;
        return total + valor;
      }, 0);
      console.log(`✅ Perdas Novas (período ${dataInicio} a ${dataFim}): ${perdasNovas} (R$ ${valorPerdasNovas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })})`);
    } else {
      console.error('❌ Erro ao buscar perdas novas:', novasResponse.status);
    }

    // 3. Meta de Oportunidades Perdidas
    if (metaResponse.ok) {
      const metaData = await metaResponse.json();
      if (metaData && metaData.length > 0) {
        if (selectedFunnel && selectedFunnel !== 'all') {
          // Funil específico - usar valor único
          metaOportunidadesPerdidas = parseFloat(metaData[0].valor_da_meta) || 0;
          console.log(`✅ Meta Oportunidades Perdidas (funil ${selectedFunnel}): ${metaOportunidadesPerdidas}`);
        } else {
          // Unidade selecionada (ambos funis) - somar as metas dos funis 6 e 14
          metaOportunidadesPerdidas = metaData.reduce((total, meta) => {
            const valor = parseFloat(meta.valor_da_meta) || 0;
            return total + valor;
          }, 0);
          console.log(`✅ Meta Oportunidades Perdidas (soma funis 6+14): ${metaOportunidadesPerdidas}`);
          console.log(`🔍 Detalhes das metas encontradas:`, metaData.map(m => ({ valor: m.valor_da_meta })));
        }
      } else {
        console.log('⚠️ Nenhuma meta encontrada para oportunidades perdidas, usando valor padrão');
        metaOportunidadesPerdidas = 50; // Valor padrão
      }
    } else {
      console.error('❌ Erro ao buscar meta de oportunidades perdidas:', metaResponse.status);
      metaOportunidadesPerdidas = 50; // Valor padrão em caso de erro
    }

    // 🎯 DADOS ANTERIORES - Buscar dados do período anterior para comparação
    console.log('📊 Buscando dados do período anterior para comparação...');
    const dadosAnteriores = await getOportunidadesPerdidasAnteriores(dataInicio, dataFim, selectedFunnel, selectedUnit, selectedSeller, selectedOrigin);

    // 🎯 CALCULAR PERCENTUAL DA META (total de perdas vs meta)
    const percentualMeta = metaOportunidadesPerdidas > 0 ? 
      ((totalOportunidadesPerdidas - metaOportunidadesPerdidas) / metaOportunidadesPerdidas) * 100 : 0;
    
    console.log(`📊 Cálculo do percentual da meta:`);
    console.log(`   - Total Oportunidades Perdidas: ${totalOportunidadesPerdidas}`);
    console.log(`   - Meta: ${metaOportunidadesPerdidas}`);
    console.log(`   - Percentual: ${percentualMeta.toFixed(2)}%`);

    // 🎯 FORMATAR DADOS PARA O COMPONENTE
    const metrics = {
      totalOportunidadesPerdidas: {
        current: totalOportunidadesPerdidas, // Número principal: oportunidades perdidas hoje
        previous: dadosAnteriores.totalOportunidadesPerdidas,
        value: valorTotalOportunidadesPerdidas, // Valor embaixo: soma das oportunidades perdidas
        meta: metaOportunidadesPerdidas, // Meta real da tabela metas
        metaPercentage: percentualMeta, // Percentual calculado: (perdas - meta) / meta * 100
        change: dadosAnteriores.totalOportunidadesPerdidas > 0 ? 
          ((totalOportunidadesPerdidas - dadosAnteriores.totalOportunidadesPerdidas) / dadosAnteriores.totalOportunidadesPerdidas) * 100 : 0,
        isPositive: totalOportunidadesPerdidas <= dadosAnteriores.totalOportunidadesPerdidas // Para perdas, menos é melhor
      },
      perdasNovas: {
        current: perdasNovas, // Número principal: oportunidades criadas no período que foram perdidas
        previous: dadosAnteriores.perdasNovas,
        value: valorPerdasNovas, // Valor embaixo: soma das perdas novas
        meta: Math.round(metaOportunidadesPerdidas * 0.3), // Meta proporcional (30% da meta total)
        metaPercentage: percentualMeta, // Percentual calculado: (perdas - meta) / meta * 100
        change: dadosAnteriores.perdasNovas > 0 ? 
          ((perdasNovas - dadosAnteriores.perdasNovas) / dadosAnteriores.perdasNovas) * 100 : 0,
        isPositive: perdasNovas <= dadosAnteriores.perdasNovas // Para perdas, menos é melhor
      }
    };

    console.log('✅ OportunidadesPerdidasService: Métricas calculadas:', metrics);
    return metrics;

  } catch (error) {
    console.error('❌ Erro no OportunidadesPerdidasService:', error);
    throw error;
  }
};

/**
 * 🔴 BUSCAR DADOS DO PERÍODO ANTERIOR (para comparação)
 */
const getOportunidadesPerdidasAnteriores = async (startDate, endDate, selectedFunnel = null, selectedUnit = null, selectedSeller = null, selectedOrigin = null) => {
  try {
    console.log('📊 Buscando dados do período anterior - perdas...');
    
    // Data de ontem para total de perdas anteriores
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
    
    console.log('📅 Período anterior - perdas:', { ontem: ontemStr, dataInicioAnterior, dataFimAnterior });

    // Construir filtros
    const funilFilter = selectedFunnel && selectedFunnel !== 'all' ? `&funil_id=eq.${selectedFunnel}` : '';
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
            } else {
              originFilter = `&origem_oportunidade=eq.${encodeURIComponent(originName)}`;
            }
          }
        }
      } catch (error) {
        console.log('⚠️ Erro ao buscar origem para período anterior - perdas:', error);
      }
    }

    const filtrosCombinados = funilFilter + unidadeFilter + sellerFilter + originFilter;

    // 🔴 BUSCAR DADOS ESPECÍFICOS DO PERÍODO ANTERIOR
    const totalPerdidasAnteriorUrl = `${supabaseUrl}/rest/v1/oportunidade_sprint?select=id,value&archived=eq.0&status=eq.lost&lost_date=gte.${ontemStr}&lost_date=lte.${ontemStr}T23:59:59${filtrosCombinados}`;
    const perdasNovasAnteriorUrl = `${supabaseUrl}/rest/v1/oportunidade_sprint?select=id,value&archived=eq.0&status=eq.lost&create_date=gte.${dataInicioAnterior}&create_date=lte.${dataFimAnterior}T23:59:59${filtrosCombinados}`;
    
    // Executar queries em paralelo
    const [totalPerdidasResponse, perdasNovasResponse] = await Promise.all([
      fetch(totalPerdidasAnteriorUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'apikey': supabaseServiceKey,
          'Accept-Profile': supabaseSchema,
        }
      }),
      fetch(perdasNovasAnteriorUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'apikey': supabaseServiceKey,
          'Accept-Profile': supabaseSchema,
        }
      })
    ]);

    if (totalPerdidasResponse.ok && perdasNovasResponse.ok) {
      const totalPerdidasData = await totalPerdidasResponse.json();
      const perdasNovasData = await perdasNovasResponse.json();
      
      return {
        totalOportunidadesPerdidas: totalPerdidasData.length,
        perdasNovas: perdasNovasData.length
      };
    }

    // Fallback se não conseguir buscar dados anteriores
    return {
      totalOportunidadesPerdidas: 0,
      perdasNovas: 0
    };

  } catch (error) {
    console.error('❌ Erro ao buscar dados anteriores - perdas:', error);
    return {
      totalOportunidadesPerdidas: 0,
      perdasNovas: 0
    };
  }
};