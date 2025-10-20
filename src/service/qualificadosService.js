/**
 * 🎯 QUALIFICADOS SERVICE
 * 
 * Serviço para calcular a métrica "Qualificados"
 * Qualificados = Novas - Desqualificados (etapas com desqualificado = TRUE)
 */

// Configurações do Supabase - usando configuração centralizada
import { supabaseUrl, supabaseServiceKey, supabaseSchema } from '../config/supabase.js';

/**
 * 🎯 BUSCAR ETAPAS DESQUALIFICADAS POR FUNIL
 * 
 * @param {string} funilId - ID do funil
 * @returns {Array} Array com IDs das etapas desqualificadas
 */
export const getEtapasDesqualificadas = async (funilId) => {
  try {
    console.log('🔍 QualificadosService: Buscando etapas desqualificadas para funil:', funilId);

    const url = `${supabaseUrl}/rest/v1/funil_etapas?select=id_etapa_sprint&id_funil_sprint=eq.${funilId}&desqualificado=eq.true`;
    console.log('🔍 URL para buscar etapas desqualificadas:', url);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'apikey': supabaseServiceKey,
        'Accept-Profile': supabaseSchema,
      }
    });

    if (response.ok) {
      const etapas = await response.json();
      const etapasIds = etapas.map(e => e.id_etapa_sprint);
      
      console.log(`✅ QualificadosService: Etapas desqualificadas encontradas para funil ${funilId}:`, etapasIds);
      return etapasIds;
    } else {
      console.error('❌ QualificadosService: Erro ao buscar etapas desqualificadas:', response.status);
      return [];
    }
  } catch (error) {
    console.error('❌ QualificadosService: Erro ao buscar etapas desqualificadas:', error);
    return [];
  }
};

/**
 * 🎯 BUSCAR OPORTUNIDADES CRIADAS NO PERÍODO QUE ESTÃO NAS ETAPAS DESQUALIFICADAS
 *
 * LÓGICA CORRETA: Das oportunidades CRIADAS NO PERÍODO, quantas estão ATUALMENTE
 * nas etapas marcadas como desqualificado=true
 *
 * @param {string} startDate - Data inicial (YYYY-MM-DD)
 * @param {string} endDate - Data final (YYYY-MM-DD)
 * @param {string} funilId - ID do funil
 * @param {Array} etapasDesqualificadas - IDs das etapas desqualificadas
 * @param {Object} filters - Filtros adicionais (unidade, vendedor, origem)
 * @returns {number} Quantidade de oportunidades criadas no período que estão nas etapas desqualificadas
 */
export const getOportunidadesDesqualificadas = async (startDate, endDate, funilId, etapasDesqualificadas, filters = {}) => {
  try {
    console.log('🎯 CORRETO: Contando oportunidades CRIADAS NO PERÍODO que estão nas etapas desqualificadas...');
    console.log('📊 Parâmetros:', { startDate, endDate, funilId, etapasDesqualificadas, filters });

    if (!etapasDesqualificadas || etapasDesqualificadas.length === 0) {
      console.log('⚠️ QualificadosService: Nenhuma etapa desqualificada encontrada');
      return 0;
    }

    // Construir filtros
    let funilFilter = `&funil_id=eq.${funilId}`;
    let unidadeFilter = '';
    let sellerFilter = '';
    let originFilter = '';

    if (filters.selectedUnit && filters.selectedUnit !== 'all') {
      unidadeFilter = `&unidade_id=eq.${encodeURIComponent(filters.selectedUnit)}`;
    }

    if (filters.selectedSeller && filters.selectedSeller !== 'all') {
      sellerFilter = `&user_id=eq.${filters.selectedSeller}`;
    }

    if (filters.selectedOrigin && filters.selectedOrigin !== 'all') {
      const originName = filters.selectedOrigin;
      const lower = originName.toLowerCase();

      if (lower === 'google ads') {
        originFilter = `&origem_oportunidade=eq.${encodeURIComponent('Google Ads')}`;
      } else if (lower === 'meta ads' || lower === 'facebook' || lower === 'instagram') {
        originFilter = `&origem_oportunidade=eq.${encodeURIComponent('Meta Ads')}`;
      } else if (lower === 'orgânico' || lower === 'organico') {
        originFilter = `&origem_oportunidade=eq.${encodeURIComponent('Orgânico')}`;
      } else if (lower === 'whatsapp') {
        originFilter = `&origem_oportunidade=eq.${encodeURIComponent('WhatsApp')}`;
      } else if (lower === 'prescritor') {
        originFilter = `&origem_oportunidade=eq.${encodeURIComponent('Prescritor')}`;
      } else if (lower === 'franquia') {
        originFilter = `&origem_oportunidade=eq.${encodeURIComponent('Franquia')}`;
      } else {
        originFilter = `&origem_oportunidade=eq.${encodeURIComponent(originName)}`;
      }
    }

    // LÓGICA CORRETA: Buscar oportunidades CRIADAS NO PERÍODO que estão ATUALMENTE nas etapas desqualificadas
    // CORREÇÃO: crm_column é string, precisa de aspas na query PostgREST
    const etapasFilter = `crm_column.in.("${etapasDesqualificadas.join('","')}")`;

    console.log('🎯 CORRETO: Etapas desqualificadas:', etapasDesqualificadas);
    console.log('🔧 CORREÇÃO: Filtro de etapas com aspas:', etapasFilter);

    const url = `${supabaseUrl}/rest/v1/oportunidade_sprint?select=id,crm_column&archived=eq.0&create_date=gte.${startDate}&create_date=lte.${endDate}T23:59:59${funilFilter}&${etapasFilter}${unidadeFilter}${sellerFilter}${originFilter}`;

    console.log('🎯 CORRETO: URL para contar oportunidades CRIADAS NO PERÍODO nas etapas desqualificadas:', url);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'apikey': supabaseServiceKey,
        'Accept-Profile': supabaseSchema,
        'Prefer': 'count=exact'
      }
    });

    if (response.ok) {
      const oportunidades = await response.json();
      const count = oportunidades.length;

      console.log(`✅ CORRETO: Oportunidades CRIADAS NO PERÍODO que estão nas etapas desqualificadas: ${count}`);
      console.log(`📊 CORRETO: Etapa 130: ${oportunidades.filter(o => String(o.crm_column) === '130').length}`);
      console.log(`📊 CORRETO: Etapa 231: ${oportunidades.filter(o => String(o.crm_column) === '231').length}`);

      // DEBUG: Mostrar TODAS as etapas encontradas
      if (count > 0) {
        const todasEtapas = [...new Set(oportunidades.map(o => String(o.crm_column)))];
        console.log(`🔍 TODAS as etapas encontradas:`, todasEtapas);
        todasEtapas.forEach(etapa => {
          const countEtapa = oportunidades.filter(o => String(o.crm_column) === etapa).length;
          console.log(`   Etapa ${etapa}: ${countEtapa} oportunidades`);
        });

        const somaEtapas = todasEtapas.reduce((sum, etapa) => {
          return sum + oportunidades.filter(o => String(o.crm_column) === etapa).length;
        }, 0);
        console.log(`🔢 Soma manual de todas as etapas: ${somaEtapas} (deve = ${count})`);
      }

      return count;
    } else {
      console.error('❌ QualificadosService: Erro ao buscar oportunidades desqualificadas:', response.status);
      return 0;
    }
  } catch (error) {
    console.error('❌ QualificadosService: Erro ao buscar oportunidades desqualificadas:', error);
    return 0;
  }
};

/**
 * 🎯 CALCULAR QUALIFICADOS (LÓGICA CORRETA)
 *
 * @param {number} novas - Quantidade de oportunidades novas (criadas no período)
 * @param {string} startDate - Data inicial
 * @param {string} endDate - Data final
 * @param {string} funilId - ID do funil
 * @param {Object} filters - Filtros adicionais
 * @returns {number} Quantidade de oportunidades qualificadas
 */
export const calcularQualificados = async (novas, startDate, endDate, funilId, filters = {}) => {
  try {
    console.log('🎯 CORRETO: Calculando qualificados...');
    console.log('📊 CORRETO: Parâmetros:', { novas, startDate, endDate, funilId, filters });

    // 1. Buscar etapas desqualificadas
    const etapasDesqualificadas = await getEtapasDesqualificadas(funilId);
    console.log('🎯 CORRETO: Etapas desqualificadas:', etapasDesqualificadas);

    if (etapasDesqualificadas.length === 0) {
      console.log('⚠️ CORRETO: Nenhuma etapa desqualificada, todas são qualificadas');
      return novas;
    }

    // 2. Buscar oportunidades CRIADAS NO PERÍODO que estão nas etapas desqualificadas
    const desqualificadas = await getOportunidadesDesqualificadas(
      startDate,
      endDate,
      funilId,
      etapasDesqualificadas,
      filters
    );

    // 3. Calcular qualificados: Novas - Desqualificadas
    const qualificados = Math.max(0, novas - desqualificadas);

    console.log(`✅ CORRETO: Cálculo concluído:`);
    console.log(`  - Criadas no período: ${novas}`);
    console.log(`  - Criadas no período que estão nas etapas desqualificadas: ${desqualificadas}`);
    console.log(`  - Qualificadas: ${qualificados}`);
    console.log(`  - Fórmula: ${novas} - ${desqualificadas} = ${qualificados}`);

    return qualificados;
  } catch (error) {
    console.error('❌ QualificadosService: Erro ao calcular qualificados:', error);
    return novas; // Fallback: retornar todas como qualificadas em caso de erro
  }
};

/**
 * 🎯 CALCULAR QUALIFICADOS PARA MÚLTIPLOS FUNIS (LÓGICA CORRETA)
 *
 * @param {number} novas - Quantidade total de oportunidades novas
 * @param {string} startDate - Data inicial
 * @param {string} endDate - Data final
 * @param {Array} funilIds - Array com IDs dos funis
 * @param {Object} filters - Filtros adicionais
 * @returns {number} Quantidade total de oportunidades qualificadas
 */
export const calcularQualificadosMultiplosFunils = async (novas, startDate, endDate, funilIds, filters = {}) => {
  try {
    console.log('🎯 CORRETO: Calculando qualificados para múltiplos funis...');
    console.log('📊 CORRETO: Parâmetros:', { novas, startDate, endDate, funilIds, filters });

    let totalDesqualificadas = 0;

    for (const funilId of funilIds) {
      const etapasDesqualificadas = await getEtapasDesqualificadas(funilId);

      if (etapasDesqualificadas.length > 0) {
        const desqualificadas = await getOportunidadesDesqualificadas(
          startDate,
          endDate,
          funilId,
          etapasDesqualificadas,
          filters
        );
        totalDesqualificadas += desqualificadas;
        console.log(`🎯 CORRETO: Funil ${funilId} - Desqualificadas criadas no período: ${desqualificadas}`);
      }
    }

    const qualificados = Math.max(0, novas - totalDesqualificadas);

    console.log(`✅ CORRETO: Cálculo múltiplos funis concluído:`);
    console.log(`  - Criadas no período: ${novas}`);
    console.log(`  - Total criadas no período que estão nas etapas desqualificadas: ${totalDesqualificadas}`);
    console.log(`  - Qualificadas: ${qualificados}`);

    return qualificados;
  } catch (error) {
    console.error('❌ QualificadosService: Erro ao calcular qualificados múltiplos funis:', error);
    return novas; // Fallback
  }
};
