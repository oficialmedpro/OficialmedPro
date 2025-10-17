// 📱 UTILITÁRIO DE TELEFONE - Para uso no Frontend
// Função para corrigir telefones brasileiros adicionando 9 faltante

/**
 * Corrige telefone brasileiro adicionando 9 faltante após DDD
 * @param {string} telefone - Número de telefone
 * @returns {string} - Telefone corrigido
 */
export function corrigirTelefoneBrasileiro(telefone) {
  try {
    if (!telefone || telefone.trim() === '') {
      return '';
    }
    
    // Remover espaços e caracteres especiais
    let telLimpo = telefone.replace(/\D/g, '');
    
    // Se começa com 55 (DDI do Brasil), remover
    if (telLimpo.startsWith('55')) {
      telLimpo = telLimpo.substring(2);
    }
    
    // Se ainda tem mais de 11 dígitos após remover DDI, pode ser que tenha 55 duplicado
    if (telLimpo.length > 11 && telLimpo.startsWith('55')) {
      telLimpo = telLimpo.substring(2);
    }
    
    // 🎯 NOVA LÓGICA: Adicionar 9 faltante após DDD
    if (telLimpo.length === 10) {
      // Telefone tem 10 dígitos: DDD + 8 dígitos
      // Formato correto: DDD + 9 + 8 dígitos = 11 dígitos
      const ddd = telLimpo.substring(0, 2);  // Primeiros 2 dígitos (DDD)
      const numero = telLimpo.substring(2);   // Últimos 8 dígitos
      telLimpo = ddd + '9' + numero;         // Adicionar 9 após DDD
      
      console.log(`📱 Telefone corrigido: ${telefone} → ${telLimpo} (adicionado 9 após DDD)`);
    } else if (telLimpo.length === 11) {
      // Telefone já tem 11 dígitos: DDD + 9 + 8 dígitos (formato correto)
      console.log(`📱 Telefone já correto: ${telefone} → ${telLimpo} (11 dígitos)`);
    } else {
      // Telefone com número de dígitos inválido
      console.warn(`⚠️ Telefone com formato inválido: ${telefone} → ${telLimpo} (${telLimpo.length} dígitos)`);
    }
    
    return telLimpo;
    
  } catch (error) {
    console.error('❌ Erro ao processar telefone:', telefone, error);
    return telefone; // Retornar original em caso de erro
  }
}

/**
 * Valida se o telefone brasileiro está no formato correto (11 dígitos)
 * @param {string} telefone - Número de telefone
 * @returns {boolean} - True se válido
 */
export function validarTelefoneBrasileiro(telefone) {
  const telCorrigido = corrigirTelefoneBrasileiro(telefone);
  return telCorrigido.length === 11;
}

/**
 * Formata telefone brasileiro para exibição
 * @param {string} telefone - Número de telefone
 * @returns {string} - Telefone formatado (XX) 9XXXX-XXXX
 */
export function formatarTelefoneBrasileiro(telefone) {
  const telCorrigido = corrigirTelefoneBrasileiro(telefone);
  
  if (telCorrigido.length === 11) {
    const ddd = telCorrigido.substring(0, 2);
    const numero = telCorrigido.substring(2);
    return `(${ddd}) ${numero.substring(0, 1)} ${numero.substring(1, 5)}-${numero.substring(5)}`;
  }
  
  return telefone;
}

// 🧪 TESTES (remover em produção)
if (typeof window !== 'undefined') {
  console.log('=== TESTES DO UTILITÁRIO DE TELEFONE ===');
  console.log('✅ 9491524049 (10 dígitos) →', corrigirTelefoneBrasileiro('9491524049'));
  console.log('✅ 94991524049 (11 dígitos) →', corrigirTelefoneBrasileiro('94991524049'));
  console.log('✅ (94) 9152-4049 (formatado) →', corrigirTelefoneBrasileiro('(94) 9152-4049'));
  console.log('✅ Validação 9491524049 →', validarTelefoneBrasileiro('9491524049'));
  console.log('✅ Formatação 9491524049 →', formatarTelefoneBrasileiro('9491524049'));
}

