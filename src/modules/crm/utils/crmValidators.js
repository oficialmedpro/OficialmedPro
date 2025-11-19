/**
 * Validadores para o módulo CRM
 */

/**
 * Valida dados de contato
 * @param {Object} contactData - Dados do contato
 * @returns {Object} { valid: boolean, errors: Array }
 */
export const validateContact = (contactData) => {
  const errors = [];

  if (!contactData.name || contactData.name.trim().length < 2) {
    errors.push('Nome deve ter pelo menos 2 caracteres');
  }

  if (contactData.email && !isValidEmail(contactData.email)) {
    errors.push('Email inválido');
  }

  if (contactData.phone && !isValidPhone(contactData.phone)) {
    errors.push('Telefone inválido');
  }

  return {
    valid: errors.length === 0,
    errors
  };
};

/**
 * Valida dados de oportunidade
 * @param {Object} opportunityData - Dados da oportunidade
 * @returns {Object} { valid: boolean, errors: Array }
 */
export const validateOpportunity = (opportunityData) => {
  const errors = [];

  if (!opportunityData.title || opportunityData.title.trim().length < 3) {
    errors.push('Título deve ter pelo menos 3 caracteres');
  }

  if (!opportunityData.contact_id) {
    errors.push('Contato é obrigatório');
  }

  if (opportunityData.value && opportunityData.value < 0) {
    errors.push('Valor não pode ser negativo');
  }

  if (!opportunityData.stage) {
    errors.push('Estágio é obrigatório');
  }

  return {
    valid: errors.length === 0,
    errors
  };
};

/**
 * Valida email (re-exportado de helpers para conveniência)
 * @param {string} email - Email para validar
 * @returns {boolean}
 */
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Valida telefone brasileiro (re-exportado de helpers para conveniência)
 * @param {string} phone - Telefone para validar
 * @returns {boolean}
 */
const isValidPhone = (phone) => {
  const cleanPhone = phone.replace(/\D/g, '');
  return cleanPhone.length >= 10 && cleanPhone.length <= 11;
};




