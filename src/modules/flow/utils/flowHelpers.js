/**
 * Funções auxiliares e helpers para o módulo FLOW
 */

/**
 * Formata valor monetário
 * @param {number} value - Valor numérico
 * @returns {string} Valor formatado (ex: R$ 1.234,56)
 */
export const formatCurrency = (value) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value || 0);
};

/**
 * Formata data para exibição
 * @param {string|Date} date - Data
 * @returns {string} Data formatada
 */
export const formatDate = (date) => {
  if (!date) return '-';
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).format(new Date(date));
};

/**
 * Formata data e hora para exibição
 * @param {string|Date} date - Data
 * @returns {string} Data e hora formatada
 */
export const formatDateTime = (date) => {
  if (!date) return '-';
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(date));
};

/**
 * Calcula dias desde a última compra
 * @param {string|Date} lastPurchaseDate - Data da última compra
 * @returns {number} Dias desde a última compra
 */
export const calculateDaysSinceLastPurchase = (lastPurchaseDate) => {
  if (!lastPurchaseDate) return null;
  const today = new Date();
  const lastPurchase = new Date(lastPurchaseDate);
  const diffTime = Math.abs(today - lastPurchase);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

/**
 * Determina qual esteira o cliente deve estar baseado na última compra
 * @param {string|Date} lastPurchaseDate - Data da última compra
 * @param {boolean} hasPurchased - Se o cliente já comprou alguma vez
 * @returns {string} Nome da esteira
 */
export const determineFlowEsteira = (lastPurchaseDate, hasPurchased) => {
  if (!hasPurchased) {
    return 'compra'; // Cliente nunca comprou
  }

  if (!lastPurchaseDate) {
    return 'reativacao'; // Cliente comprou mas não tem data
  }

  const daysSince = calculateDaysSinceLastPurchase(lastPurchaseDate);
  
  if (daysSince <= 90) {
    return 'monitoramento';
  } else {
    return 'reativacao';
  }
};

/**
 * Determina a etapa dentro da esteira de monitoramento
 * @param {string|Date} lastPurchaseDate - Data da última compra
 * @returns {string} Etapa (d30, d60, d90)
 */
export const determineMonitoramentoEtapa = (lastPurchaseDate) => {
  if (!lastPurchaseDate) return 'd30';
  
  const daysSince = calculateDaysSinceLastPurchase(lastPurchaseDate);
  
  if (daysSince <= 30) {
    return 'd30';
  } else if (daysSince <= 60) {
    return 'd60';
  } else {
    return 'd90';
  }
};

/**
 * Determina a etapa dentro da esteira de reativação
 * @param {number} tentativas - Número de tentativas já realizadas
 * @returns {string} Etapa (primeira, r30, r60, r90, infinita)
 */
export const determineReativacaoEtapa = (tentativas) => {
  if (tentativas === 0) return 'primeira';
  if (tentativas === 1) return 'r30';
  if (tentativas === 2) return 'r60';
  if (tentativas === 3) return 'r90';
  return 'infinita';
};

/**
 * Valida email
 * @param {string} email - Email para validar
 * @returns {boolean} Se o email é válido
 */
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Valida telefone brasileiro
 * @param {string} phone - Telefone para validar
 * @returns {boolean} Se o telefone é válido
 */
export const isValidPhone = (phone) => {
  const cleanPhone = phone.replace(/\D/g, '');
  return cleanPhone.length >= 10 && cleanPhone.length <= 11;
};

/**
 * Lista todas as esteiras disponíveis do banco de dados
 * @returns {Promise<Array>} Lista de esteiras
 */
// Cache do cliente Supabase para helpers
let supabaseClientHelpers = null;
const getSupabaseForHelpers = async () => {
  if (!supabaseClientHelpers) {
    const { getSupabaseWithSchema } = await import('../../../service/supabase');
    supabaseClientHelpers = getSupabaseWithSchema('api');
  }
  return supabaseClientHelpers;
};

export const getAllEsteiras = async () => {
  try {
    const supabase = await getSupabaseForHelpers();
    // Obter unidade selecionada do localStorage
    const selectedUnidade = localStorage.getItem('flow-unidade') || '[1]';
    
    // Filtrar apenas funis da unidade selecionada
    const { data, error } = await supabase
      .from('funis')
      .select('*')
      .eq('status', 'ativo')
      .eq('unidade', selectedUnidade)
      .order('nome_funil', { ascending: true });

    if (error) throw error;
    
    // Mapear para formato compatível
    // Categorizar funis baseado no tipo_funil e nome
    const categorizarTipo = (tipoFunil, nomeFunil) => {
      if (!tipoFunil) return 'compra';
      
      const nome = (nomeFunil || '').toUpperCase();
      
      // GRUPO COMPRA: Compra, Ativação Marketing, Ativação Comercial
      if (tipoFunil === 'compra' || 
          (tipoFunil === 'ativacao' && (nome.includes('ATIVAÇÃO') || nome.includes('ATIVACAO')))) {
        return 'compra';
      }
      
      // GRUPO OPERACIONAL: Laboratório, Logística, Financeiro, Compras (tudo que não é comercial)
      // Pós-Venda removido do Flow Operacional
      if (tipoFunil === 'laboratorio' || 
          tipoFunil === 'logistica' || 
          tipoFunil === 'compras' ||
          nome.includes('FINANCEIRO') ||
          nome.includes('LABORATÓRIO') ||
          nome.includes('LABORATORIO') ||
          nome.includes('LOGÍSTICA') ||
          nome.includes('LOGISTICA')) {
        return 'operacional';
      }
      
      // GRUPO RECOMPRA: Monitoramento, Reativação, Recorrência
      if (tipoFunil === 'monitoramento' || 
          tipoFunil === 'reativacao' || 
          tipoFunil === 'recorrencia' ||
          tipoFunil === 'recompra' ||
          nome.includes('MONITORAMENTO') ||
          nome.includes('REATIVAÇÃO') ||
          nome.includes('REATIVACAO') ||
          nome.includes('RECOMPRA') ||
          nome.includes('RECORRÊNCIA') ||
          nome.includes('RECORRENCIA')) {
        return 'recompra';
      }
      
      // GRUPO INDEPENDENTE: Site, Aniversariantes, Franqueados
      if (tipoFunil === 'site' || 
          tipoFunil === 'aniversariantes' ||
          tipoFunil === 'franquia' ||
          nome.includes('SITE') ||
          nome.includes('ANIVERSARIANTES') ||
          nome.includes('FRANQUEADOS') ||
          nome.includes('FRANQUIA')) {
        return 'independente';
      }
      
      // Padrão: compra
      return 'compra';
    };
    
    return (data || []).map(funil => ({
      id: funil.id,
      name: funil.nome_funil,
      type: categorizarTipo(funil.tipo_funil, funil.nome_funil),
      tipo_funil: funil.tipo_funil, // Manter o tipo original também
      color: '#3b82f6' // Cor padrão, pode ser ajustada depois
    }));
  } catch (error) {
    console.error('[flowHelpers] Erro ao buscar esteiras:', error);
    return [];
  }
};

/**
 * Obtém informações de uma esteira específica do banco de dados
 * @param {number|string} esteiraIdOuNome - ID ou nome da esteira
 * @returns {Promise<Object|null>} Informações da esteira
 */
export const getEsteiraInfo = async (esteiraIdOuNome) => {
  try {
    const supabase = await getSupabaseForHelpers();
    
    // Verificar se é um número (ID) ou string (nome)
    const isNumericId = typeof esteiraIdOuNome === 'string' 
      ? !isNaN(esteiraIdOuNome) && !isNaN(parseFloat(esteiraIdOuNome))
      : typeof esteiraIdOuNome === 'number';
    
    let query = supabase.from('funis').select('*').eq('status', 'ativo');
    
    if (isNumericId) {
      const funilId = typeof esteiraIdOuNome === 'string' ? parseInt(esteiraIdOuNome, 10) : esteiraIdOuNome;
      query = query.eq('id', funilId);
    } else {
      query = query.ilike('nome_funil', `%${esteiraIdOuNome}%`);
    }
    
    const { data, error } = await query.limit(1).single();

    if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows
    if (!data) return null;

    // Categorizar tipo (mesma lógica de getAllEsteiras)
    const categorizarTipo = (tipoFunil, nomeFunil) => {
      if (!tipoFunil) return 'compra';
      
      const nome = (nomeFunil || '').toUpperCase();
      
      // GRUPO COMPRA: Compra, Ativação Marketing, Ativação Comercial
      if (tipoFunil === 'compra' || 
          (tipoFunil === 'ativacao' && (nome.includes('ATIVAÇÃO') || nome.includes('ATIVACAO')))) {
        return 'compra';
      }
      
      // GRUPO OPERACIONAL: Laboratório, Logística, Financeiro, Compras
      if (tipoFunil === 'laboratorio' || 
          tipoFunil === 'logistica' || 
          tipoFunil === 'compras' ||
          nome.includes('FINANCEIRO') ||
          nome.includes('LABORATÓRIO') ||
          nome.includes('LABORATORIO') ||
          nome.includes('LOGÍSTICA') ||
          nome.includes('LOGISTICA')) {
        return 'operacional';
      }
      
      // GRUPO RECOMPRA: Monitoramento, Reativação, Recorrência
      if (tipoFunil === 'monitoramento' || 
          tipoFunil === 'reativacao' || 
          tipoFunil === 'recorrencia' ||
          tipoFunil === 'recompra' ||
          nome.includes('MONITORAMENTO') ||
          nome.includes('REATIVAÇÃO') ||
          nome.includes('REATIVACAO') ||
          nome.includes('RECOMPRA') ||
          nome.includes('RECORRÊNCIA') ||
          nome.includes('RECORRENCIA')) {
        return 'recompra';
      }
      
      // GRUPO INDEPENDENTE: Site, Aniversariantes, Franqueados
      if (tipoFunil === 'site' || 
          tipoFunil === 'aniversariantes' ||
          tipoFunil === 'franquia' ||
          nome.includes('SITE') ||
          nome.includes('ANIVERSARIANTES') ||
          nome.includes('FRANQUEADOS') ||
          nome.includes('FRANQUIA')) {
        return 'independente';
      }
      
      return 'compra';
    };

    return {
      id: data.id,
      name: data.nome_funil,
      type: categorizarTipo(data.tipo_funil, data.nome_funil),
      tipo_funil: data.tipo_funil,
      color: '#3b82f6' // Cor padrão
    };
  } catch (error) {
    console.error('[flowHelpers] Erro ao buscar esteira:', error);
    return null;
  }
};

