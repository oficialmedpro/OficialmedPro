/**
 * 🔴 LOSS REASONS SERVICE
 * 
 * Serviço específico para buscar ranking de motivos de perda (loss_reason):
 * 1. Ranking por Funil (agrupado por funil_id)
 * 2. Ranking por Etapa do Funil (agrupado por crm_column)
 */

// Configurações do Supabase - usando configuração centralizada
import { supabaseUrl, supabaseServiceKey, supabaseSchema } from '../config/supabase.js';

const baseHeaders = {
  'Accept': 'application/json',
  'Authorization': `Bearer ${supabaseServiceKey}`,
  'apikey': supabaseServiceKey,
  'Accept-Profile': supabaseSchema,
  'Prefer': 'count=exact'
};

/**
 * 🔴 FUNÇÃO PARA BUSCAR TODOS OS REGISTROS COM PAGINAÇÃO RECURSIVA
 * 
 * @param {string} url - URL base da query
 * @param {Object} headers - Headers da requisição
 * @returns {Array} Todos os registros encontrados
 */
const fetchAllRecords = async (url, headers) => {
  const pageSize = 1000; // Tamanho padrão da página do Supabase
  let allRecords = [];
  let offset = 0;
  let hasMore = true;

  console.log('📄 Iniciando paginação para URL:', url);

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
        console.error(`❌ Erro na página ${Math.floor(offset / pageSize) + 1}:`, response.status);
        break;
      }

      const pageData = await response.json();
      allRecords = allRecords.concat(pageData);

      console.log(`📄 Página ${Math.floor(offset / pageSize) + 1}: ${pageData.length} registros | Total: ${allRecords.length}`);

      // Se retornou menos que o tamanho da página, não há mais dados
      if (pageData.length < pageSize) {
        hasMore = false;
      } else {
        offset += pageSize;
      }

      // Verificar Content-Range header para confirmar se há mais dados
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
      console.error(`❌ Erro ao buscar página ${Math.floor(offset / pageSize) + 1}:`, error);
      break;
    }
  }

  console.log(`✅ Paginação concluída: ${allRecords.length} registros totais`);
  return allRecords;
};

/**
 * 🔴 BUSCAR RANKING DE MOTIVOS DE PERDA POR FUNIL
 * 
 * @param {string} startDate - Data inicial (formato YYYY-MM-DD)
 * @param {string} endDate - Data final (formato YYYY-MM-DD)
 * @param {string} selectedFunnel - ID do funil selecionado
 * @param {string} selectedUnit - ID da unidade selecionada (formato [1], [2], etc.)
 * @param {string} selectedSeller - ID do vendedor selecionado
 * @param {string} selectedOrigin - Origem da oportunidade selecionada
 * @returns {Object} Objeto com o ranking por funil
 */
export const getLossReasonsByFunnel = async (
  startDate = null, 
  endDate = null, 
  selectedFunnel = null, 
  selectedUnit = null, 
  selectedSeller = null, 
  selectedOrigin = null
) => {
  try {
    console.log('='.repeat(80));
    console.log('🔴 LossReasonsService: BUSCANDO RANKING POR FUNIL');
    console.log('📅 Parâmetros recebidos:', { startDate, endDate, selectedFunnel, selectedUnit, selectedSeller, selectedOrigin });
    console.log('='.repeat(80));

    // Fallback para datas
    const hoje = new Date().toISOString().split('T')[0];
    let dataInicio = startDate || hoje;
    let dataFim = endDate || hoje;

    // Construir filtros
    let funilFilter = '';
    if (selectedFunnel && selectedFunnel !== 'all' && selectedFunnel !== '' && selectedFunnel !== 'undefined') {
      funilFilter = `&funil_id=eq.${selectedFunnel}`;
    }
    
    let unidadeFilter = '';
    if (selectedUnit && selectedUnit !== 'all' && selectedUnit !== '' && selectedUnit !== 'undefined') {
      const unidadeValue = selectedUnit.toString();
      const unidadeEncoded = encodeURIComponent(unidadeValue);
      unidadeFilter = `&unidade_id=eq.${unidadeEncoded}`;
    }
    
    let sellerFilter = '';
    if (selectedSeller && selectedSeller !== 'all' && selectedSeller !== '' && selectedSeller !== 'undefined') {
      sellerFilter = `&user_id=eq.${selectedSeller}`;
    }

    let originFilter = '';
    if (selectedOrigin && selectedOrigin !== 'all' && selectedOrigin !== '' && selectedOrigin !== 'undefined') {
      originFilter = `&origem_oportunidade=eq.${encodeURIComponent(selectedOrigin)}`;
    }

    // URL para buscar oportunidades perdidas com loss_reason (usando schema api)
    const lostOppsUrl = `${supabaseUrl}/rest/v1/oportunidade_sprint?select=id,loss_reason,funil_id,value,origem_oportunidade&archived=eq.0&status=eq.lost&lost_date=gte.${dataInicio}&lost_date=lte.${dataFim}T23:59:59${funilFilter}${unidadeFilter}${sellerFilter}${originFilter}`;
    
    console.log('🔍 URL Oportunidades Perdidas:', lostOppsUrl);

    // Buscar dados com paginação
    const lostOpps = await fetchAllRecords(lostOppsUrl, baseHeaders);
    console.log('✅ Oportunidades perdidas encontradas:', lostOpps.length);

    // Buscar nomes dos motivos de perda da tabela loss_reasons no schema api
    const lossReasonsUrl = `${supabaseUrl}/rest/v1/loss_reasons?select=id,name,funil_id`;
    const lossReasonsResponse = await fetch(lossReasonsUrl, {
      method: 'GET',
      headers: {
        ...baseHeaders,
        'Accept-Profile': 'api'
      }
    });
    
    let lossReasonsMap = {};
    if (lossReasonsResponse.ok) {
      const lossReasons = await lossReasonsResponse.json();
      lossReasonsMap = lossReasons.reduce((acc, reason) => {
        acc[reason.id] = reason.name;
        return acc;
      }, {});
      console.log('✅ Motivos de perda carregados:', Object.keys(lossReasonsMap).length);
    } else {
      console.warn('⚠️ Não foi possível carregar motivos de perda da tabela loss_reasons');
    }

    // Agrupar por funil_id e loss_reason
    const funnelGroups = {};
    
    lostOpps.forEach(opp => {
      const funilId = opp.funil_id || 'Sem Funil';
      const lossReasonId = opp.loss_reason;
      const lossReasonName = lossReasonsMap[lossReasonId] || `Motivo ID: ${lossReasonId}` || 'Sem Motivo';
      const value = parseFloat(opp.value) || 0;
      
      if (!funnelGroups[funilId]) {
        funnelGroups[funilId] = {};
      }
      
      if (!funnelGroups[funilId][lossReasonName]) {
        funnelGroups[funilId][lossReasonName] = {
          count: 0,
          totalValue: 0,
          reasonId: lossReasonId,
          reasons: []
        };
      }
      
      funnelGroups[funilId][lossReasonName].count++;
      funnelGroups[funilId][lossReasonName].totalValue += value;
      funnelGroups[funilId][lossReasonName].reasons.push({
        id: opp.id,
        value: value
      });
    });

    // Converter para array e ordenar
    const funnelRanking = Object.entries(funnelGroups).map(([funilId, reasons]) => {
      const reasonStats = Object.entries(reasons).map(([reason, stats]) => ({
        reason,
        count: stats.count,
        totalValue: stats.totalValue,
        avgValue: stats.totalValue / stats.count
      })).sort((a, b) => b.count - a.count);

      return {
        funilId,
        totalLost: Object.values(reasons).reduce((sum, stats) => sum + stats.count, 0),
        totalValue: Object.values(reasons).reduce((sum, stats) => sum + stats.totalValue, 0),
        reasons: reasonStats
      };
    }).sort((a, b) => b.totalLost - a.totalLost);

    console.log('📊 Ranking por Funil:', funnelRanking);

    return {
      success: true,
      data: funnelRanking,
      totalRecords: lostOpps.length
    };

  } catch (error) {
    console.error('❌ Erro ao buscar ranking por funil:', error);
    return {
      success: false,
      error: error.message,
      data: []
    };
  }
};

/**
 * 🔴 BUSCAR RANKING DE MOTIVOS DE PERDA POR ETAPA DO FUNIL
 * 
 * @param {string} startDate - Data inicial (formato YYYY-MM-DD)
 * @param {string} endDate - Data final (formato YYYY-MM-DD)
 * @param {string} selectedFunnel - ID do funil selecionado
 * @param {string} selectedUnit - ID da unidade selecionada (formato [1], [2], etc.)
 * @param {string} selectedSeller - ID do vendedor selecionado
 * @param {string} selectedOrigin - Origem da oportunidade selecionada
 * @returns {Object} Objeto com o ranking por etapa do funil
 */
export const getLossReasonsByStage = async (
  startDate = null, 
  endDate = null, 
  selectedFunnel = null, 
  selectedUnit = null, 
  selectedSeller = null, 
  selectedOrigin = null
) => {
  try {
    console.log('='.repeat(80));
    console.log('🔴 LossReasonsService: BUSCANDO RANKING POR ETAPA DO FUNIL');
    console.log('📅 Parâmetros recebidos:', { startDate, endDate, selectedFunnel, selectedUnit, selectedSeller, selectedOrigin });
    console.log('='.repeat(80));

    // Fallback para datas
    const hoje = new Date().toISOString().split('T')[0];
    let dataInicio = startDate || hoje;
    let dataFim = endDate || hoje;

    // Construir filtros
    let funilFilter = '';
    if (selectedFunnel && selectedFunnel !== 'all' && selectedFunnel !== '' && selectedFunnel !== 'undefined') {
      funilFilter = `&funil_id=eq.${selectedFunnel}`;
    }
    
    let unidadeFilter = '';
    if (selectedUnit && selectedUnit !== 'all' && selectedUnit !== '' && selectedUnit !== 'undefined') {
      const unidadeValue = selectedUnit.toString();
      const unidadeEncoded = encodeURIComponent(unidadeValue);
      unidadeFilter = `&unidade_id=eq.${unidadeEncoded}`;
    }
    
    let sellerFilter = '';
    if (selectedSeller && selectedSeller !== 'all' && selectedSeller !== '' && selectedSeller !== 'undefined') {
      sellerFilter = `&user_id=eq.${selectedSeller}`;
    }

    let originFilter = '';
    if (selectedOrigin && selectedOrigin !== 'all' && selectedOrigin !== '' && selectedOrigin !== 'undefined') {
      originFilter = `&origem_oportunidade=eq.${encodeURIComponent(selectedOrigin)}`;
      console.log('🔍 Filtro de origem aplicado (por etapa):', selectedOrigin, '→', originFilter);
    } else {
      console.log('🔍 Sem filtro de origem (por etapa):', selectedOrigin);
    }

    // URL para buscar oportunidades perdidas com loss_reason e crm_column (usando schema api)
    const lostOppsUrl = `${supabaseUrl}/rest/v1/oportunidade_sprint?select=id,loss_reason,crm_column,funil_id,value,origem_oportunidade&archived=eq.0&status=eq.lost&lost_date=gte.${dataInicio}&lost_date=lte.${dataFim}T23:59:59${funilFilter}${unidadeFilter}${sellerFilter}${originFilter}`;
    
    console.log('🔍 URL Oportunidades Perdidas (por etapa):', lostOppsUrl);

    // Buscar dados com paginação (usando schema api)
    const lostOpps = await fetchAllRecords(lostOppsUrl, {
      ...baseHeaders,
      'Accept-Profile': 'api'
    });
    console.log('✅ Oportunidades perdidas encontradas:', lostOpps.length);
    
    // Debug: verificar se há dados com origem
    if (selectedOrigin && selectedOrigin !== 'all') {
      const withOrigin = lostOpps.filter(opp => opp.origem_oportunidade === selectedOrigin);
      console.log(`🔍 Oportunidades com origem "${selectedOrigin}":`, withOrigin.length);
      if (withOrigin.length > 0) {
        console.log('📋 Exemplo de oportunidade com origem:', withOrigin[0]);
      }
    }

    // Buscar nomes dos motivos de perda da tabela loss_reasons no schema api
    const lossReasonsUrl = `${supabaseUrl}/rest/v1/loss_reasons?select=id,name,funil_id`;
    const lossReasonsResponse = await fetch(lossReasonsUrl, {
      method: 'GET',
      headers: {
        ...baseHeaders,
        'Accept-Profile': 'api'
      }
    });
    
    let lossReasonsMap = {};
    if (lossReasonsResponse.ok) {
      const lossReasons = await lossReasonsResponse.json();
      lossReasonsMap = lossReasons.reduce((acc, reason) => {
        acc[reason.id] = reason.name;
        return acc;
      }, {});
      console.log('✅ Motivos de perda carregados:', Object.keys(lossReasonsMap).length);
    } else {
      console.warn('⚠️ Não foi possível carregar motivos de perda da tabela loss_reasons');
    }

    // Buscar nomes e ordem das etapas da tabela funil_etapas no schema api
    const stagesUrl = `${supabaseUrl}/rest/v1/funil_etapas?select=id_etapa_sprint,nome_etapa,ordem_etapa&id_funil_sprint=eq.${selectedFunnel}`;
    console.log('🔍 URL para buscar etapas:', stagesUrl);
    const stagesResponse = await fetch(stagesUrl, {
      method: 'GET',
      headers: {
        ...baseHeaders,
        'Accept-Profile': 'api'
      }
    });
    
    let stagesMap = {};
    let stagesOrderMap = {};
    if (stagesResponse.ok) {
      const stages = await stagesResponse.json();
      console.log('🔍 Etapas encontradas na consulta:', stages);
      
      stagesMap = stages.reduce((acc, stage) => {
        acc[stage.id_etapa_sprint] = stage.nome_etapa;
        return acc;
      }, {});
      stagesOrderMap = stages.reduce((acc, stage) => {
        // Tratar 0 como primeiro (0, 1, 2, 3, 4, 5, 6...)
        const order = stage.ordem_etapa !== null && stage.ordem_etapa !== undefined ? stage.ordem_etapa : 999;
        acc[stage.id_etapa_sprint] = order;
        console.log(`🗺️ Mapeando etapa: ${stage.nome_etapa} (ID: ${stage.id_etapa_sprint}) -> Ordem: ${order} (original: ${stage.ordem_etapa})`);
        return acc;
      }, {});
      console.log('✅ Nomes e ordem das etapas carregados:', Object.keys(stagesMap).length);
      console.log('🗺️ Mapeamento de ordens das etapas:', stagesOrderMap);
      console.log('🔍 Detalhes das etapas encontradas:', stages.map(s => ({ 
        id: s.id_etapa_sprint, 
        nome: s.nome_etapa, 
        ordem: s.ordem_etapa 
      })));
      console.log('🔍 Etapas completas (raw):', stages);
    } else {
      console.warn('⚠️ Não foi possível carregar nomes das etapas da tabela funil_etapas');
      console.log('❌ Erro na resposta:', stagesResponse.status, stagesResponse.statusText);
    }

    // Agrupar por crm_column e loss_reason
    const stageGroups = {};
    
    lostOpps.forEach(opp => {
      const stageId = opp.crm_column || 'Sem Etapa';
      const stageName = stagesMap[stageId] || `Etapa ${stageId}`;
      const lossReasonId = opp.loss_reason;
      const lossReasonName = lossReasonsMap[lossReasonId] || `Motivo ID: ${lossReasonId}` || 'Sem Motivo';
      const value = parseFloat(opp.value) || 0;
      
      if (!stageGroups[stageId]) {
        stageGroups[stageId] = {
          stageName: stageName
        };
      }
      
      if (!stageGroups[stageId][lossReasonName]) {
        stageGroups[stageId][lossReasonName] = {
          count: 0,
          totalValue: 0,
          reasonId: lossReasonId,
          reasons: []
        };
      }
      
      stageGroups[stageId][lossReasonName].count++;
      stageGroups[stageId][lossReasonName].totalValue += value;
      stageGroups[stageId][lossReasonName].reasons.push({
        id: opp.id,
        value: value
      });
    });

    // Converter para array e ordenar
    const stageRanking = Object.entries(stageGroups).map(([stageId, stageData]) => {
      const { stageName, ...reasons } = stageData;
      const reasonStats = Object.entries(reasons).map(([reason, stats]) => ({
        reason,
        count: stats.count,
        totalValue: stats.totalValue,
        avgValue: stats.totalValue / stats.count
      })).sort((a, b) => b.count - a.count);

      return {
        stageId,
        stageName,
        stageOrder: stagesOrderMap[stageId] || 999, // Incluir ordem da etapa
        totalLost: Object.values(reasons).reduce((sum, stats) => sum + stats.count, 0),
        totalValue: Object.values(reasons).reduce((sum, stats) => sum + stats.totalValue, 0),
        reasons: reasonStats
      };
    }).sort((a, b) => {
      // Ordenação: 0 vem primeiro, depois 1, 2, 3...
      console.log(`🔍 Comparando: ${a.stageName} (${a.stageOrder}) vs ${b.stageName} (${b.stageOrder})`);
      console.log(`🔍 stagesOrderMap atual:`, stagesOrderMap);
      console.log(`🔍 ENTRADA no map:`, stagesOrderMap['130']);
      
      // Se A é 0, A vem primeiro
      if (a.stageOrder === 0 && b.stageOrder !== 0) {
        console.log(`  → ${a.stageName} vem primeiro (ordem 0)`);
        return -1;
      }
      // Se B é 0, B vem primeiro
      if (b.stageOrder === 0 && a.stageOrder !== 0) {
        console.log(`  → ${b.stageName} vem primeiro (ordem 0)`);
        return 1;
      }
      // Caso contrário, ordenação normal
      const result = a.stageOrder - b.stageOrder;
      console.log(`  → Ordenação normal: ${result}`);
      return result;
    });

    console.log('📊 Ranking por Etapa (antes da ordenação):', stageRanking.map(s => ({ stageId: s.stageId, stageName: s.stageName, stageOrder: s.stageOrder })));
    
    // Debug: verificar se há etapas com ordem 0
    const zeroOrderStages = stageRanking.filter(s => s.stageOrder === 0);
    console.log('🔍 Etapas com ordem 0:', zeroOrderStages.map(s => ({ stageId: s.stageId, stageName: s.stageName, stageOrder: s.stageOrder })));
    
    // Debug: verificar mapeamento de ordens
    console.log('🗺️ Mapeamento de ordens das etapas:', stagesOrderMap);
    
    console.log('📊 Ranking por Etapa (após ordenação):', stageRanking.map(s => ({ stageId: s.stageId, stageName: s.stageName, stageOrder: s.stageOrder })));
    
    // Debug: verificar se a ordenação está funcionando
    console.log('🔍 Verificação da ordenação:');
    stageRanking.forEach((stage, index) => {
      console.log(`  ${index + 1}. ${stage.stageName} (ID: ${stage.stageId}, Ordem: ${stage.stageOrder})`);
    });

    return {
      success: true,
      data: stageRanking,
      totalRecords: lostOpps.length
    };

  } catch (error) {
    console.error('❌ Erro ao buscar ranking por etapa:', error);
    return {
      success: false,
      error: error.message,
      data: []
    };
  }
};

/**
 * 🔴 BUSCAR RANKING GERAL DE MOTIVOS DE PERDA
 * 
 * @param {string} startDate - Data inicial (formato YYYY-MM-DD)
 * @param {string} endDate - Data final (formato YYYY-MM-DD)
 * @param {string} selectedFunnel - ID do funil selecionado
 * @param {string} selectedUnit - ID da unidade selecionada (formato [1], [2], etc.)
 * @param {string} selectedSeller - ID do vendedor selecionado
 * @param {string} selectedOrigin - Origem da oportunidade selecionada
 * @returns {Object} Objeto com o ranking geral
 */
export const getLossReasonsGeneral = async (
  startDate = null, 
  endDate = null, 
  selectedFunnel = null, 
  selectedUnit = null, 
  selectedSeller = null, 
  selectedOrigin = null
) => {
  try {
    console.log('='.repeat(80));
    console.log('🔴 LossReasonsService: BUSCANDO RANKING GERAL');
    console.log('📅 Parâmetros recebidos:', { startDate, endDate, selectedFunnel, selectedUnit, selectedSeller, selectedOrigin });
    console.log('='.repeat(80));

    // Fallback para datas
    const hoje = new Date().toISOString().split('T')[0];
    let dataInicio = startDate || hoje;
    let dataFim = endDate || hoje;

    // Construir filtros
    let funilFilter = '';
    if (selectedFunnel && selectedFunnel !== 'all' && selectedFunnel !== '' && selectedFunnel !== 'undefined') {
      funilFilter = `&funil_id=eq.${selectedFunnel}`;
    }
    
    let unidadeFilter = '';
    if (selectedUnit && selectedUnit !== 'all' && selectedUnit !== '' && selectedUnit !== 'undefined') {
      const unidadeValue = selectedUnit.toString();
      const unidadeEncoded = encodeURIComponent(unidadeValue);
      unidadeFilter = `&unidade_id=eq.${unidadeEncoded}`;
    }
    
    let sellerFilter = '';
    if (selectedSeller && selectedSeller !== 'all' && selectedSeller !== '' && selectedSeller !== 'undefined') {
      sellerFilter = `&user_id=eq.${selectedSeller}`;
    }

    let originFilter = '';
    if (selectedOrigin && selectedOrigin !== 'all' && selectedOrigin !== '' && selectedOrigin !== 'undefined') {
      originFilter = `&origem_oportunidade=eq.${encodeURIComponent(selectedOrigin)}`;
    }

    // URL para buscar oportunidades perdidas com loss_reason (usando schema api)
    const lostOppsUrl = `${supabaseUrl}/rest/v1/oportunidade_sprint?select=id,loss_reason,value,origem_oportunidade&archived=eq.0&status=eq.lost&lost_date=gte.${dataInicio}&lost_date=lte.${dataFim}T23:59:59${funilFilter}${unidadeFilter}${sellerFilter}${originFilter}`;
    
    console.log('🔍 URL Oportunidades Perdidas (geral):', lostOppsUrl);

    // Buscar dados com paginação
    const lostOpps = await fetchAllRecords(lostOppsUrl, baseHeaders);
    console.log('✅ Oportunidades perdidas encontradas:', lostOpps.length);

    // Buscar nomes dos motivos de perda da tabela loss_reasons no schema api
    const lossReasonsUrl = `${supabaseUrl}/rest/v1/loss_reasons?select=id,name,funil_id`;
    const lossReasonsResponse = await fetch(lossReasonsUrl, {
      method: 'GET',
      headers: {
        ...baseHeaders,
        'Accept-Profile': 'api'
      }
    });
    
    let lossReasonsMap = {};
    if (lossReasonsResponse.ok) {
      const lossReasons = await lossReasonsResponse.json();
      lossReasonsMap = lossReasons.reduce((acc, reason) => {
        acc[reason.id] = reason.name;
        return acc;
      }, {});
      console.log('✅ Motivos de perda carregados:', Object.keys(lossReasonsMap).length);
    } else {
      console.warn('⚠️ Não foi possível carregar motivos de perda da tabela loss_reasons');
    }

    // Agrupar por loss_reason
    const reasonGroups = {};
    
    lostOpps.forEach(opp => {
      const lossReasonId = opp.loss_reason;
      const lossReasonName = lossReasonsMap[lossReasonId] || `Motivo ID: ${lossReasonId}` || 'Sem Motivo';
      const value = parseFloat(opp.value) || 0;
      
      if (!reasonGroups[lossReasonName]) {
        reasonGroups[lossReasonName] = {
          count: 0,
          totalValue: 0,
          reasonId: lossReasonId,
          reasons: []
        };
      }
      
      reasonGroups[lossReasonName].count++;
      reasonGroups[lossReasonName].totalValue += value;
      reasonGroups[lossReasonName].reasons.push({
        id: opp.id,
        value: value
      });
    });

    // Converter para array e ordenar
    const generalRanking = Object.entries(reasonGroups).map(([reason, stats]) => ({
      reason,
      count: stats.count,
      totalValue: stats.totalValue,
      avgValue: stats.totalValue / stats.count
    })).sort((a, b) => b.count - a.count);

    console.log('📊 Ranking Geral:', generalRanking);

    return {
      success: true,
      data: generalRanking,
      totalRecords: lostOpps.length
    };

  } catch (error) {
    console.error('❌ Erro ao buscar ranking geral:', error);
    return {
      success: false,
      error: error.message,
      data: []
    };
  }
};

// Exportar o serviço
export const lossReasonsService = {
  getLossReasonsByFunnel,
  getLossReasonsByStage,
  getLossReasonsGeneral
};
