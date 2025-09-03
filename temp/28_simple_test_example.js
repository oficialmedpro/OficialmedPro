/**
 * Exemplo simples de como testar a conexão com Google Ads
 * Use este código em qualquer lugar do seu projeto
 */

// Importar o serviço de teste
import { testGoogleAdsConnection } from './src/service/testGoogleAdsConnection.js';

// Exemplo 1: Teste completo
async function testComplete() {
  console.log('🧪 Executando teste completo...');
  
  const results = await testGoogleAdsConnection.runAllTests(1);
  testGoogleAdsConnection.displayReport(results);
  
  return results;
}

// Exemplo 2: Teste apenas conexão básica
async function testBasic() {
  console.log('🔍 Testando apenas conexão básica...');
  
  const result = await testGoogleAdsConnection.testBasicConnection(1);
  
  if (result.success) {
    console.log('✅ Conexão OK!');
    console.log(`Conta: ${result.data.customerName}`);
  } else {
    console.log('❌ Conexão falhou!');
    console.log(`Erro: ${result.error}`);
  }
  
  return result;
}

// Exemplo 3: Teste de unidade específica
async function testUnit() {
  console.log('🏢 Testando unidade específica...');
  
  const result = await testGoogleAdsConnection.testUnitConnection(1);
  
  if (result.success) {
    console.log('✅ Unidade OK!');
    console.log(`Leads: ${result.data.totalLeads}`);
    console.log(`Gasto: R$ ${result.data.gastoTotal.toFixed(2)}`);
  } else {
    console.log('❌ Unidade falhou!');
    console.log(`Erro: ${result.error}`);
  }
  
  return result;
}

// Exemplo de uso
console.log('📋 Exemplos de teste disponíveis:');
console.log('1. testComplete() - Teste completo');
console.log('2. testBasic() - Apenas conexão básica');
console.log('3. testUnit() - Teste de unidade específica');
console.log('');
console.log('💡 Para usar, execute:');
console.log('await testComplete();');
console.log('await testBasic();');
console.log('await testUnit();');

// Exportar funções para uso
export { testComplete, testBasic, testUnit };
