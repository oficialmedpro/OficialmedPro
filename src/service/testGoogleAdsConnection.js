import { googleAdsService } from './googleAdsService.js';

/**
 * Serviço para testar a conexão com a API do Google Ads
 * Testa todas as funcionalidades principais da API
 */
class TestGoogleAdsConnection {
  constructor() {
    this.results = {
      connection: null,
      customerInfo: null,
      campaigns: null,
      metrics: null,
      errors: []
    };
  }

  /**
   * Executa todos os testes de conexão
   * @param {number} unidadeId - ID da unidade para testar (padrão: 1)
   * @returns {Promise<Object>}
   */
  async runAllTests(unidadeId = 1) {
    console.log('🧪 Iniciando testes de conexão com Google Ads API...');
    console.log('==================================================');
    
    try {
      // Teste 1: Conexão básica
      console.log('🔍 Teste 1: Conexão básica...');
      this.results.connection = await this.testBasicConnection(unidadeId);
      
      if (!this.results.connection.success) {
        console.error('❌ Teste de conexão básica falhou');
        return this.getResults();
      }

      // Teste 2: Informações da conta
      console.log('🔍 Teste 2: Informações da conta...');
      this.results.customerInfo = await this.testCustomerInfo();
      
      // Teste 3: Listar campanhas
      console.log('🔍 Teste 3: Listar campanhas...');
      this.results.campaigns = await this.testCampaigns();
      
      // Teste 4: Métricas (últimos 7 dias)
      console.log('🔍 Teste 4: Métricas dos últimos 7 dias...');
      this.results.metrics = await this.testMetrics();

      console.log('✅ Todos os testes concluídos!');
      return this.getResults();

    } catch (error) {
      console.error('❌ Erro durante os testes:', error);
      this.results.errors.push({
        test: 'runAllTests',
        error: error.message,
        timestamp: new Date().toISOString()
      });
      return this.getResults();
    }
  }

  /**
   * Testa a conexão básica com a API
   * @param {number} unidadeId - ID da unidade
   * @returns {Promise<Object>}
   */
  async testBasicConnection(unidadeId = 1) {
    try {
      const result = await googleAdsService.testConnection();
      
      if (result.success) {
        console.log('✅ Conexão básica: OK');
        console.log(`   - Conta: ${result.customerName}`);
        console.log(`   - ID: ${result.customerId}`);
        console.log(`   - Campanhas: ${result.campaignsCount}`);
      } else {
        console.error('❌ Conexão básica: FALHOU');
        console.error(`   - Erro: ${result.error}`);
      }
      
      return {
        success: result.success,
        data: result,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('❌ Erro no teste de conexão básica:', error);
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Testa a obtenção de informações da conta
   * @returns {Promise<Object>}
   */
  async testCustomerInfo() {
    try {
      const customerInfo = await googleAdsService.getCustomerInfo();
      
      console.log('✅ Informações da conta: OK');
      console.log(`   - Nome: ${customerInfo.name}`);
      console.log(`   - Moeda: ${customerInfo.currency}`);
      console.log(`   - Fuso horário: ${customerInfo.timezone}`);
      console.log(`   - Conta de teste: ${customerInfo.isTestAccount ? 'Sim' : 'Não'}`);
      
      return {
        success: true,
        data: customerInfo,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('❌ Erro ao obter informações da conta:', error);
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Testa a listagem de campanhas
   * @returns {Promise<Object>}
   */
  async testCampaigns() {
    try {
      const campaigns = await googleAdsService.getCampaigns();
      
      console.log('✅ Listagem de campanhas: OK');
      console.log(`   - Total de campanhas: ${campaigns.length}`);
      
      if (campaigns.length > 0) {
        console.log('   - Primeiras 3 campanhas:');
        campaigns.slice(0, 3).forEach((campaign, index) => {
          console.log(`     ${index + 1}. ${campaign.name} (${campaign.status})`);
        });
      }
      
      return {
        success: true,
        data: {
          total: campaigns.length,
          campaigns: campaigns.slice(0, 5) // Apenas as primeiras 5 para o relatório
        },
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('❌ Erro ao listar campanhas:', error);
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Testa a obtenção de métricas
   * @returns {Promise<Object>}
   */
  async testMetrics() {
    try {
      // Definir período dos últimos 7 dias
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - 7);

      const dateRange = {
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0]
      };

      const stats = await googleAdsService.getGoogleAdsStats(dateRange);
      
      console.log('✅ Métricas dos últimos 7 dias: OK');
      console.log(`   - Total de leads: ${stats.totalLeads}`);
      console.log(`   - Gasto total: R$ ${stats.gastoTotal.toFixed(2)}`);
      console.log(`   - Impressões: ${stats.totalImpressions.toLocaleString()}`);
      console.log(`   - Cliques: ${stats.totalClicks.toLocaleString()}`);
      console.log(`   - CTR: ${stats.ctr.toFixed(2)}%`);
      
      return {
        success: true,
        data: {
          period: dateRange,
          stats: stats
        },
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('❌ Erro ao obter métricas:', error);
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Testa a conexão com uma unidade específica
   * @param {number} unidadeId - ID da unidade
   * @returns {Promise<Object>}
   */
  async testUnitConnection(unidadeId) {
    try {
      console.log(`🔍 Testando conexão para unidade ID: ${unidadeId}`);
      
      const stats = await googleAdsService.getGoogleAdsStatsForUnit(unidadeId);
      
      console.log('✅ Conexão da unidade: OK');
      console.log(`   - Leads: ${stats.totalLeads}`);
      console.log(`   - Gasto: R$ ${stats.gastoTotal.toFixed(2)}`);
      console.log(`   - Campanhas filtradas: ${stats.dadosAnuncios.filtrados}`);
      
      return {
        success: true,
        data: stats,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('❌ Erro ao testar unidade:', error);
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Gera um relatório resumido dos testes
   * @returns {Object}
   */
  getResults() {
    const summary = {
      timestamp: new Date().toISOString(),
      tests: {
        connection: this.results.connection?.success || false,
        customerInfo: this.results.customerInfo?.success || false,
        campaigns: this.results.campaigns?.success || false,
        metrics: this.results.metrics?.success || false
      },
      errors: this.results.errors,
      details: this.results
    };

    // Calcular score geral
    const totalTests = Object.keys(summary.tests).length;
    const passedTests = Object.values(summary.tests).filter(Boolean).length;
    summary.score = Math.round((passedTests / totalTests) * 100);

    return summary;
  }

  /**
   * Exibe um relatório formatado no console
   * @param {Object} results - Resultados dos testes
   */
  displayReport(results) {
    console.log('\n📊 RELATÓRIO DE TESTES - GOOGLE ADS API');
    console.log('==========================================');
    console.log(`⏰ Timestamp: ${results.timestamp}`);
    console.log(`📈 Score: ${results.score}% (${Object.values(results.tests).filter(Boolean).length}/${Object.keys(results.tests).length})`);
    console.log('');
    
    console.log('🧪 Resultados dos Testes:');
    console.log('-------------------------');
    console.log(`🔗 Conexão básica: ${results.tests.connection ? '✅ OK' : '❌ FALHOU'}`);
    console.log(`👤 Informações da conta: ${results.tests.customerInfo ? '✅ OK' : '❌ FALHOU'}`);
    console.log(`📋 Listagem de campanhas: ${results.tests.campaigns ? '✅ OK' : '❌ FALHOU'}`);
    console.log(`📊 Métricas: ${results.tests.metrics ? '✅ OK' : '❌ FALHOU'}`);
    
    if (results.errors.length > 0) {
      console.log('\n❌ Erros encontrados:');
      console.log('---------------------');
      results.errors.forEach((error, index) => {
        console.log(`${index + 1}. ${error.test}: ${error.error}`);
      });
    }
    
    console.log('\n🎯 Status geral:');
    if (results.score >= 80) {
      console.log('✅ Excelente! API funcionando perfeitamente.');
    } else if (results.score >= 60) {
      console.log('⚠️ Bom, mas alguns testes falharam.');
    } else {
      console.log('❌ Problemas significativos encontrados.');
    }
  }
}

// Exportar instância única do serviço
export const testGoogleAdsConnection = new TestGoogleAdsConnection();

// Exportar também a classe para casos específicos
export default TestGoogleAdsConnection;
