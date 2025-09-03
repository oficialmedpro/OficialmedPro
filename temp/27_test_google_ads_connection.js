/**
 * Script para testar a conexão com a API do Google Ads
 * Execute este script para verificar se tudo está funcionando
 */

import { testGoogleAdsConnection } from '../src/service/testGoogleAdsConnection.js';

console.log('🚀 Iniciando teste de conexão com Google Ads API...');
console.log('==================================================');

async function runTest() {
  try {
    // Executar todos os testes
    const results = await testGoogleAdsConnection.runAllTests(1);
    
    // Exibir relatório
    testGoogleAdsConnection.displayReport(results);
    
    // Retornar resultados para uso posterior
    return results;
    
  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
    return {
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
}

// Executar o teste se este arquivo for executado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  runTest().then(results => {
    console.log('\n🏁 Teste concluído!');
    process.exit(results.score >= 60 ? 0 : 1);
  });
}

export { runTest };
