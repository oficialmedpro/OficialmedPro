/**
 * Funções auxiliares e helpers para o módulo CRM
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
 * Calcula taxa de conversão
 * @param {number} won - Oportunidades ganhas
 * @param {number} total - Total de oportunidades
 * @returns {number} Taxa de conversão em porcentagem
 */
export const calculateConversionRate = (won, total) => {
  if (!total || total === 0) return 0;
  return ((won / total) * 100).toFixed(2);
};

/**
 * Agrupa oportunidades por estágio
 * @param {Array} opportunities - Lista de oportunidades
 * @returns {Object} Oportunidades agrupadas por estágio
 */
export const groupOpportunitiesByStage = (opportunities) => {
  return opportunities.reduce((acc, opp) => {
    const stage = opp.stage || 'outros';
    if (!acc[stage]) {
      acc[stage] = [];
    }
    acc[stage].push(opp);
    return acc;
  }, {});
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
  // Remove caracteres não numéricos
  const cleanPhone = phone.replace(/\D/g, '');
  // Valida se tem 10 ou 11 dígitos (com DDD)
  return cleanPhone.length >= 10 && cleanPhone.length <= 11;
};



