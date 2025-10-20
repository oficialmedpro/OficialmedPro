/**
 * Serviço focado em métricas de conversão do Google Ads
 * Fonte: tabela oportunidade_sprint (schema api)
 * - totalCriadas: count de oportunidades criadas no período (qualquer status)
 * - totalGanhas: count de oportunidades com status=gain no período (gain_date)
 * - valorGanho: soma de value das oportunidades gain no período
 * - taxaConversao: totalGanhas / totalCriadas * 100
 *
 * Observação: Mantém o filtro de origem Google independente da seleção
 * para não quebrar o card, replicando a lógica usada noutros serviços.
 */

import { supabaseUrl, supabaseServiceKey, supabaseSchema } from '../config/supabase.js';

const baseHeaders = {
  'Accept': 'application/json',
  'Authorization': `Bearer ${supabaseServiceKey}`,
  'apikey': supabaseServiceKey,
  'Accept-Profile': supabaseSchema,
  'Prefer': 'count=exact'
};

/**
 * 🔍 FUNÇÃO PARA BUSCAR TODOS OS REGISTROS COM PAGINAÇÃO RECURSIVA
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

// Filtro padrão para oportunidades de origem Google Ads - EXATAMENTE como OportunidadesGanhasService
const googleOriginOr = `or=(origem_oportunidade.eq.${encodeURIComponent('Google Ads')},utm_source.eq.google,utm_source.eq.GoogleAds)`;

function buildOptionalFilters(options = {}) {
  const { selectedUnit, selectedFunnel, selectedSeller } = options;
  let filters = '';

  // CORREÇÃO CRÍTICA: Usar EXATAMENTE a mesma lógica do OportunidadesGanhasService
  if (selectedFunnel && selectedFunnel !== 'all' && selectedFunnel !== 'TODOS' && selectedFunnel !== '' && selectedFunnel !== 'undefined') {
    filters += `&funil_id=eq.${selectedFunnel}`;
    console.log('🔍 GoogleConversaoService: Filtro de funil específico aplicado:', filters);
  } else {
    filters += `&funil_id=in.(6,14)`;
    console.log('🔍 GoogleConversaoService: Filtro de funil incluindo ambos (6 e 14):', filters);
  }

  if (selectedUnit && selectedUnit !== 'all' && selectedUnit !== 'undefined' && selectedUnit !== '') {
    const unidadeEncoded = encodeURIComponent(selectedUnit.toString());
    filters += `&unidade_id=eq.${unidadeEncoded}`;
  }

  // CORREÇÃO: Não aplicar filtro de vendedor para manter totais gerais como OportunidadesGanhasService
  // if (selectedSeller && selectedSeller !== 'all' && selectedSeller !== 'undefined' && selectedSeller !== '') {
  //   filters += `&user_id=eq.${selectedSeller}`;
  // }

  return filters;
}

export const googleConversaoService = {
  /**
   * Busca métricas de conversão do Google no período informado
   * @param {string} startDate YYYY-MM-DD
   * @param {string} endDate YYYY-MM-DD
   * @param {Object} options { selectedUnit?, selectedFunnel?, selectedSeller? }
   */
  async getConversaoMetrics(startDate, endDate, options = {}) {
    console.log('🔍 GoogleConversaoService.getConversaoMetrics INICIANDO:');
    console.log('  - Parâmetros recebidos:', { startDate, endDate, options });
    
    const optional = buildOptionalFilters(options);
    console.log('  - Filtros opcionais construídos:', optional);
    
    // Processamento de datas idêntico ao OportunidadesGanhasService
    const hoje = new Date().toISOString().split('T')[0];
    let dataInicio = startDate;
    let dataFim = endDate;
    
    if (!dataInicio || !dataFim || dataInicio === '' || dataFim === '') {
      dataInicio = hoje;
      dataFim = hoje;
      console.log('⚠️ GoogleConversaoService: Usando datas fallback (hoje):', { dataInicio, dataFim });
    } else {
      console.log('✅ GoogleConversaoService: Usando datas fornecidas:', { dataInicio, dataFim });
    }
    
    // Normalizador idêntico ao usado em OportunidadesGanhasService
    const parseMoneyValue = (raw) => {
      if (typeof raw === 'number') {
        return Number.isFinite(raw) ? raw : 0;
      }
      if (typeof raw === 'string') {
        const sanitized = raw.replace(/\./g, '').replace(',', '.');
        const num = Number(sanitized);
        return Number.isFinite(num) ? num : 0;
      }
      return 0;
    };

    // Card do Google SEMPRE filtra apenas oportunidades do Google
    const googleOriginFilter = `&or=(origem_oportunidade.eq.${encodeURIComponent('Google Ads')},utm_source.eq.google,utm_source.eq.GoogleAds)`;

    // 1) Total criadas no período (qualquer status) - APENAS GOOGLE  
    // CORREÇÃO CRÍTICA: Usar timezone GMT-3 explicitamente como OportunidadesGanhasService
    const criadasUrl = `${supabaseUrl}/rest/v1/oportunidade_sprint?select=id,value&archived=eq.0&create_date=gte.${dataInicio}T00:00:00-03:00&create_date=lte.${dataFim}T23:59:59-03:00${googleOriginFilter}${optional}`;
    console.log('🔍 GoogleConversaoService - URL Criadas (GOOGLE):', criadasUrl);

    // 2) Ganhas no período - APENAS GOOGLE
    const ganhasUrl = `${supabaseUrl}/rest/v1/oportunidade_sprint?select=id,value&archived=eq.0&status=eq.gain&gain_date=gte.${dataInicio}T00:00:00-03:00&gain_date=lte.${dataFim}T23:59:59-03:00${googleOriginFilter}${optional}`;
    console.log('🔍 GoogleConversaoService - URL Ganhas (GOOGLE):', ganhasUrl);

    // 3) Perdidas no período (lost_date) - APENAS GOOGLE
    const perdidasUrl = `${supabaseUrl}/rest/v1/oportunidade_sprint?select=id,value&archived=eq.0&status=eq.lost&lost_date=gte.${dataInicio}T00:00:00-03:00&lost_date=lte.${dataFim}T23:59:59-03:00${googleOriginFilter}${optional}`;
    console.log('🔍 GoogleConversaoService - URL Perdidas (GOOGLE):', perdidasUrl);

    // 4) Abertas (sem filtro de data, só status=open) - APENAS GOOGLE
    const abertasUrl = `${supabaseUrl}/rest/v1/oportunidade_sprint?select=id,value&archived=eq.0&status=eq.open${googleOriginFilter}${optional}`;
    console.log('🔍 GoogleConversaoService - URL Abertas (GOOGLE):', abertasUrl);

    // 5) BUSCAR O FUNIL GOOGLE ADS DA UNIDADE SELECIONADA
    const funilGoogleAdsUrl = `${supabaseUrl}/rest/v1/funis?select=id_funil_sprint&unidade=eq.${encodeURIComponent(options.selectedUnit || 'all')}&googleads=eq.true`;
    console.log('🔍 GoogleConversaoService - URL Funil Google Ads:', funilGoogleAdsUrl);
    
    const funilRes = await fetch(funilGoogleAdsUrl, { method: 'GET', headers: baseHeaders });
    const funilGoogleAds = await (funilRes.ok ? funilRes.json() : []);
    
    console.log('🔍 Funil Google Ads encontrado:', funilGoogleAds);
    
    let orcamentoEtapa = null;
    let followEtapa = null;
    
    if (funilGoogleAds.length > 0) {
      const funilId = funilGoogleAds[0].id_funil_sprint;
      console.log('🎯 Funil Google Ads ID:', funilId);
      
      // 6) BUSCAR ETAPAS ESPECIAIS DO FUNIL GOOGLE ADS
      const etapasEspeciaisUrl = `${supabaseUrl}/rest/v1/funil_etapas?select=id_etapa_sprint,orcamento,follow&id_funil_sprint=eq.${funilId}&or=(orcamento.eq.true,follow.eq.true)`;
      console.log('🔍 GoogleConversaoService - URL Etapas Especiais do Funil:', etapasEspeciaisUrl);
      
      const etapasRes = await fetch(etapasEspeciaisUrl, { method: 'GET', headers: baseHeaders });
      const etapasEspeciais = await (etapasRes.ok ? etapasRes.json() : []);
      
      console.log('🔍 Etapas especiais encontradas:', etapasEspeciais);
      
      // Separar IDs das etapas
      orcamentoEtapa = etapasEspeciais.find(e => e.orcamento === true);
      followEtapa = etapasEspeciais.find(e => e.follow === true);
      
      console.log('🎯 Etapa Orçamento (Negociação):', orcamentoEtapa);
      console.log('🎯 Etapa Follow-Up:', followEtapa);
    } else {
      console.log('⚠️ Nenhum funil Google Ads encontrado para a unidade:', options.selectedUnit);
    }
    
    // DEBUG: Comparar com OportunidadesGanhasService
    console.log('🔍 COMPARAÇÃO COM OportunidadesGanhasService:');
    console.log('  - Data início:', dataInicio);
    console.log('  - Data fim:', dataFim);
    console.log('  - Filtro Google (FIXO):', googleOriginFilter);
    console.log('  - Filtros opcionais:', optional);
    console.log('  - URL COMPLETA Criadas:', criadasUrl);
    console.log('  - URL COMPLETA Ganhas:', ganhasUrl);

    // Construir URLs para oportunidades nas etapas especiais (sempre do funil Google Ads)
    let negociacaoUrl = null;
    let followUpUrl = null;
    
    if (orcamentoEtapa) {
      negociacaoUrl = `${supabaseUrl}/rest/v1/oportunidade_sprint?select=id,value&archived=eq.0&status=eq.open&crm_column=eq.${orcamentoEtapa.id_etapa_sprint}${googleOriginFilter}`;
      console.log('🔍 GoogleConversaoService - URL Negociação (OPEN):', negociacaoUrl);
    }
    
    if (followEtapa) {
      followUpUrl = `${supabaseUrl}/rest/v1/oportunidade_sprint?select=id,value&archived=eq.0&status=eq.open&crm_column=eq.${followEtapa.id_etapa_sprint}${googleOriginFilter}`;
      console.log('🔍 GoogleConversaoService - URL Follow-Up (OPEN):', followUpUrl);
    }

    // 🔍 EXECUTAR TODAS AS CONSULTAS COM PAGINAÇÃO EM PARALELO
    const promises = [
      fetchAllRecords(criadasUrl, baseHeaders),
      fetchAllRecords(ganhasUrl, baseHeaders),
      fetchAllRecords(perdidasUrl, baseHeaders),
      fetchAllRecords(abertasUrl, baseHeaders),
    ];
    
    if (negociacaoUrl) promises.push(fetchAllRecords(negociacaoUrl, baseHeaders));
    if (followUpUrl) promises.push(fetchAllRecords(followUpUrl, baseHeaders));
    
    const results = await Promise.all(promises);
    
    // Processar as respostas básicas com paginação
    const criadas = results[0] || [];
    const ganhas = results[1] || [];
    const perdidas = results[2] || [];
    const abertas = results[3] || [];
    
    // Processar etapas especiais (se existirem) com paginação
    let negociacao = [];
    let followUp = [];
    
    if (negociacaoUrl && results[4]) {
      negociacao = results[4] || [];
    }
    
    if (followUpUrl) {
      const followUpIndex = negociacaoUrl ? 5 : 4;
      if (results[followUpIndex]) {
        followUp = results[followUpIndex] || [];
      }
    }

    const totalCriadas = criadas.length;
    const totalGanhas = ganhas.length;
    const totalPerdidas = perdidas.length;
    const totalAbertas = abertas.length;
    const totalNegociacao = negociacao.length;
    const totalFollowUp = followUp.length;
    
    // DEBUG: Mostrar cada oportunidade ganha individualmente
    console.log('🔍 GoogleConversaoService - Oportunidades ganhas detalhadas:');
    ganhas.forEach((opp, index) => {
      const valorOriginal = opp.value;
      const valorTruncado = Math.floor(parseMoneyValue(opp.value));
      console.log(`  ${index + 1}. ID: ${opp.id}, Valor original: ${valorOriginal}, Valor truncado: ${valorTruncado}`);
    });
    
    // DEBUG: Mostrar oportunidades perdidas
    console.log('🔍 GoogleConversaoService - Oportunidades perdidas detalhadas:');
    perdidas.forEach((opp, index) => {
      const valorOriginal = opp.value;
      const valorTruncado = Math.floor(parseMoneyValue(opp.value));
      console.log(`  ${index + 1}. ID: ${opp.id}, Valor original: ${valorOriginal}, Valor truncado: ${valorTruncado}`);
    });
    
    // Soma seguindo a mesma regra do CRM: trunca cada valor individual antes de somar
    let valorGanho = ganhas.reduce((acc, r) => {
      const valor = Math.floor(parseMoneyValue(r.value));
      return acc + valor;
    }, 0);
    valorGanho = Math.round(valorGanho * 100) / 100;
    
    // Calcular valor das perdas
    let valorPerda = perdidas.reduce((acc, r) => {
      const valor = Math.floor(parseMoneyValue(r.value));
      return acc + valor;
    }, 0);
    valorPerda = Math.round(valorPerda * 100) / 100;
    
    // Calcular valor das oportunidades em negociação
    let valorNegociacao = negociacao.reduce((acc, r) => {
      const valor = Math.floor(parseMoneyValue(r.value));
      return acc + valor;
    }, 0);
    valorNegociacao = Math.round(valorNegociacao * 100) / 100;
    
    // Calcular valor das oportunidades em follow-up
    let valorFollowUp = followUp.reduce((acc, r) => {
      const valor = Math.floor(parseMoneyValue(r.value));
      return acc + valor;
    }, 0);
    valorFollowUp = Math.round(valorFollowUp * 100) / 100;
    
    const taxaConversao = totalCriadas > 0 ? (totalGanhas / totalCriadas) * 100 : 0;

    console.log('🔍 GoogleConversaoService - Resultados:');
    console.log('  - Total Criadas (Google):', totalCriadas);
    console.log('  - Total Ganhas (Google):', totalGanhas);
    console.log('  - Total Perdidas (Google):', totalPerdidas);
    console.log('  - Total Abertas (Google):', totalAbertas);
    console.log('  - Total em Negociação (Google):', totalNegociacao);
    console.log('  - Total em Follow-Up (Google):', totalFollowUp);
    console.log('  - Valor Ganho (Google):', valorGanho);
    console.log('  - Valor Perda (Google):', valorPerda);
    console.log('  - Valor em Negociação (Google):', valorNegociacao);
    console.log('  - Valor em Follow-Up (Google):', valorFollowUp);
    console.log('  - Taxa Conversão (Google):', taxaConversao.toFixed(1) + '%');

    return {
      totalCriadas,
      totalGanhas,
      totalPerdidas,
      totalAbertas,
      totalNegociacao,
      totalFollowUp,
      valorGanho,
      valorPerda,
      valorNegociacao,
      valorFollowUp,
      taxaConversao,
    };
  },
};

export default googleConversaoService;


