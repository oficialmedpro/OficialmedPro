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

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
const supabaseSchema = import.meta.env.VITE_SUPABASE_SCHEMA || 'api';

const baseHeaders = {
  'Accept': 'application/json',
  'Authorization': `Bearer ${supabaseServiceKey}`,
  'apikey': supabaseServiceKey,
  'Accept-Profile': supabaseSchema,
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
    
    // DEBUG: Comparar com OportunidadesGanhasService
    console.log('🔍 COMPARAÇÃO COM OportunidadesGanhasService:');
    console.log('  - Data início:', dataInicio);
    console.log('  - Data fim:', dataFim);
    console.log('  - Filtro Google (FIXO):', googleOriginFilter);
    console.log('  - Filtros opcionais:', optional);
    console.log('  - URL COMPLETA Criadas:', criadasUrl);
    console.log('  - URL COMPLETA Ganhas:', ganhasUrl);

    const [criadasRes, ganhasRes] = await Promise.all([
      fetch(criadasUrl, { method: 'GET', headers: baseHeaders }),
      fetch(ganhasUrl, { method: 'GET', headers: baseHeaders }),
    ]);

    const safeJson = async (res) => (res.ok ? res.json() : []);
    const [criadas, ganhas] = await Promise.all([
      safeJson(criadasRes),
      safeJson(ganhasRes),
    ]);

    const totalCriadas = criadas.length;
    const totalGanhas = ganhas.length;
    
    // DEBUG: Mostrar cada oportunidade ganha individualmente
    console.log('🔍 GoogleConversaoService - Oportunidades ganhas detalhadas:');
    ganhas.forEach((opp, index) => {
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
    const taxaConversao = totalCriadas > 0 ? (totalGanhas / totalCriadas) * 100 : 0;

    console.log('🔍 GoogleConversaoService - Resultados:');
    console.log('  - Total Criadas (Google):', totalCriadas);
    console.log('  - Total Ganhas (Google):', totalGanhas);
    console.log('  - Valor Ganho (Google):', valorGanho);
    console.log('  - Taxa Conversão (Google):', taxaConversao.toFixed(1) + '%');

    return {
      totalCriadas,
      totalGanhas,
      valorGanho,
      taxaConversao,
    };
  },
};

export default googleConversaoService;


