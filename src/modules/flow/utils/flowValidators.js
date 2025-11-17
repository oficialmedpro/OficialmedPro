/**
 * Validadores para o módulo FLOW
 */

/**
 * Valida dados de uma oportunidade de flow
 * @param {Object} opportunityData - Dados da oportunidade
 * @returns {Object} { isValid: boolean, errors: Array }
 */
export const validateFlowOpportunity = (opportunityData) => {
  const errors = [];

  if (!opportunityData.cliente_id) {
    errors.push('ID do cliente é obrigatório');
  }

  if (!opportunityData.esteira) {
    errors.push('Esteira é obrigatória');
  }

  const validEsteiras = [
    'compra', 'laboratorio', 'logistica',
    'monitoramento_marketing', 'monitoramento_comercial',
    'reativacao_marketing', 'reativacao_comercial',
    'ativacao_marketing', 'ativacao_comercial',
    'aniversariantes', 'recorrencia', 'site', 'franquia'
  ];

  if (opportunityData.esteira && !validEsteiras.includes(opportunityData.esteira)) {
    errors.push('Esteira inválida');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Valida se um cliente pode ser movido para uma esteira específica
 * @param {Object} cliente - Dados do cliente
 * @param {string} targetEsteira - Esteira de destino
 * @returns {Object} { canMove: boolean, reason: string }
 */
export const validateEsteiraMove = (cliente, targetEsteira) => {
  // Regras de negócio para movimentação entre esteiras
  const hasPurchased = cliente.ultima_compra !== null;
  const lastPurchaseDate = cliente.ultima_compra;

  // Cliente que nunca comprou só pode estar em compra ou ativacao
  if (!hasPurchased && !['compra', 'ativacao_marketing', 'ativacao_comercial'].includes(targetEsteira)) {
    return {
      canMove: false,
      reason: 'Cliente que nunca comprou só pode estar na esteira de Compra ou Ativação'
    };
  }

  // Cliente que comprou recentemente (até 90 dias) deve estar em monitoramento
  if (hasPurchased && lastPurchaseDate) {
    const daysSince = Math.ceil((new Date() - new Date(lastPurchaseDate)) / (1000 * 60 * 60 * 24));
    if (daysSince <= 90 && !targetEsteira.startsWith('monitoramento') && !targetEsteira.startsWith('laboratorio') && !targetEsteira.startsWith('logistica')) {
      return {
        canMove: false,
        reason: 'Cliente que comprou recentemente deve estar na esteira de Monitoramento'
      };
    }
  }

  return {
    canMove: true,
    reason: null
  };
};

