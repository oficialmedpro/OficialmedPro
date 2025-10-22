/**
 * 🧪 TESTE: Função para remover DDI do telefone
 */

// Função para remover DDI do telefone (remover 55 do início)
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
    
    return telLimpo;
  } catch (error) {
    console.error('❌ Erro ao remover DDI do telefone:', telefone, error);
    return telefone; // Retornar original em caso de erro
  }
}

// Testes
const telefones = [
  '559198049467',
  '55 91 98049-467',
  '(55) 91 98049-467',
  '9198049467',
  '55 11 99999-9999',
  '5511999999999',
  '555519198049467', // DDI duplicado
  '11999999999',
  '99999999999'
];

console.log('🧪 TESTANDO REMOÇÃO DE DDI:');
console.log('='.repeat(50));

telefones.forEach(tel => {
  const resultado = removerDDI(tel);
  console.log(`${tel.padEnd(20)} → ${resultado}`);
});

console.log('\n✅ Teste concluído!');









