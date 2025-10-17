// 🔧 FUNÇÃO CORRIGIDA - Adicionar 9 faltante após DDD
// Substitua a função removerDDI na sua Edge Function por esta versão corrigida

function removerDDI(telefone) {
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

// 🧪 TESTES DA FUNÇÃO
console.log('=== TESTES DA FUNÇÃO CORRIGIDA ===');
console.log('✅ 9491524049 (10 dígitos) →', removerDDI('9491524049')); // Deve retornar: 94991524049
console.log('✅ 94991524049 (11 dígitos) →', removerDDI('94991524049')); // Deve retornar: 94991524049
console.log('✅ 5541991524049 (com DDI) →', removerDDI('5541991524049')); // Deve retornar: 41991524049
console.log('✅ 554191524049 (com DDI, 10 dígitos) →', removerDDI('554191524049')); // Deve retornar: 41991524049
console.log('✅ (11) 99152-4049 (formatado) →', removerDDI('(11) 99152-4049')); // Deve retornar: 11991524049
console.log('✅ (11) 9152-4049 (formatado, 10 dígitos) →', removerDDI('(11) 9152-4049')); // Deve retornar: 11991524049

