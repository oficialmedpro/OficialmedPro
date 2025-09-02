// Arquivo de teste para o ThermometerService
// Execute este arquivo para testar a integração com dados reais

import { getThermometerMetrics, testThermometerConnection } from './thermometerService.js';

// Função para testar o service
export const runThermometerTests = async () => {
  console.log('🧪 Iniciando testes do ThermometerService...');
  
  try {
    // Teste 1: Conexão básica
    console.log('\n📋 Teste 1: Conexão básica');
    const connectionTest = await testThermometerConnection();
    console.log('Resultado:', connectionTest);
    
    // Teste 2: Buscar métricas com datas específicas
    console.log('\n📋 Teste 2: Métricas com datas específicas');
    const hoje = new Date().toISOString().split('T')[0];
    const metrics = await getThermometerMetrics(hoje, hoje, null, null);
    console.log('Métricas encontradas:', metrics);
    
    // Teste 3: Verificar estrutura dos dados
    console.log('\n📋 Teste 3: Estrutura dos dados');
    if (metrics) {
      console.log('✅ Estrutura válida encontrada');
      console.log('- Total Oportunidades:', metrics.totalOportunidades);
      console.log('- Oportunidades Perdidas:', metrics.oportunidadesPerdidas);
      console.log('- Ticket Médio:', metrics.ticketMedio);
      console.log('- Orçamento Negociação:', metrics.orcamentoNegociacao);
      console.log('- Oportunidades Ganhas:', metrics.oportunidadesGanhas);
    } else {
      console.log('❌ Estrutura inválida');
    }
    
    console.log('\n✅ Testes concluídos com sucesso!');
    return true;
    
  } catch (error) {
    console.error('❌ Erro nos testes:', error);
    return false;
  }
};

// Função para testar métricas por origem
export const testMetricsBySource = async () => {
  console.log('🧪 Testando métricas por origem...');
  
  try {
    const hoje = new Date().toISOString().split('T')[0];
    const { getThermometerMetricsBySource } = await import('./thermometerService.js');
    
    const sources = await getThermometerMetricsBySource(hoje, hoje, null);
    console.log('✅ Métricas por origem:', sources);
    
    return sources;
  } catch (error) {
    console.error('❌ Erro ao testar métricas por origem:', error);
    return null;
  }
};

// Executar testes automaticamente se este arquivo for executado diretamente
if (typeof window !== 'undefined') {
  // No browser, adicionar ao window para facilitar testes
  window.runThermometerTests = runThermometerTests;
  window.testMetricsBySource = testMetricsBySource;
  
  console.log('🧪 ThermometerService: Funções de teste disponíveis em window.runThermometerTests() e window.testMetricsBySource()');
}

