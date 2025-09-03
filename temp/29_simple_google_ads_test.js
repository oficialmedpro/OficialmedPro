/**
 * Teste simples da conexão com Google Ads API
 * Sem dependência de variáveis de ambiente do Vite
 */

import { GoogleAdsApi } from 'google-ads-api';

// Credenciais do Google Ads (da unidade com id=1)
const credentials = {
  customerId: '739-617-8858',
  developerToken: 'xw46jmZN-n_wf7uCsC8daA',
  clientId: '415018341135-v3hjpjgqek6688r5eio8tl48229qbrrd.apps.googleusercontent.com',
  clientSecret: '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',
  refreshToken: '1//04FuT2ZSozaiCCgYIARAAGAQSNwF-L9IrAWfJ05xcGt1wgsEd8OuqiDQLgiAVfLgT5_LEYd10jSOtifOTugN_gqb0BBDyNU1Q0f0'
};

console.log('🧪 Testando conexão com Google Ads API...');
console.log('==========================================');

async function testGoogleAdsConnection() {
  try {
    // Inicializar cliente da API
    console.log('🔧 Inicializando cliente da API...');
    const client = new GoogleAdsApi({
      client_id: credentials.clientId,
      client_secret: credentials.clientSecret,
      developer_token: credentials.developerToken,
    });

    // Formatar customer ID (remover hífens)
    const formattedCustomerId = credentials.customerId.replace(/-/g, '');
    const customer = client.Customer({
      customer_id: formattedCustomerId,
      refresh_token: credentials.refreshToken,
    });

    console.log('✅ Cliente inicializado com sucesso');
    console.log(`   - Customer ID: ${formattedCustomerId}`);

    // Teste 1: Informações da conta
    console.log('\n🔍 Teste 1: Informações da conta...');
    const customerInfo = await customer.query(`
      SELECT 
        customer.id,
        customer.descriptive_name,
        customer.currency_code,
        customer.time_zone,
        customer.manager,
        customer.test_account
      FROM customer
      LIMIT 1
    `);

    if (customerInfo.length > 0) {
      const info = customerInfo[0].customer;
      console.log('✅ Informações da conta obtidas:');
      console.log(`   - Nome: ${info.descriptive_name}`);
      console.log(`   - ID: ${info.id}`);
      console.log(`   - Moeda: ${info.currency_code}`);
      console.log(`   - Fuso horário: ${info.time_zone}`);
      console.log(`   - Conta de teste: ${info.test_account ? 'Sim' : 'Não'}`);
    } else {
      console.log('❌ Nenhuma informação da conta encontrada');
    }

    // Teste 2: Listar campanhas
    console.log('\n🔍 Teste 2: Listar campanhas...');
    const campaigns = await customer.query(`
      SELECT 
        campaign.id,
        campaign.name,
        campaign.status,
        campaign.advertising_channel_type
      FROM campaign
      ORDER BY campaign.name
      LIMIT 10
    `);

    console.log(`✅ Campanhas encontradas: ${campaigns.length}`);
    if (campaigns.length > 0) {
      console.log('   - Primeiras 3 campanhas:');
      campaigns.slice(0, 3).forEach((row, index) => {
        const campaign = row.campaign;
        console.log(`     ${index + 1}. ${campaign.name} (${campaign.status})`);
      });
    }

    // Teste 3: Métricas dos últimos 7 dias
    console.log('\n🔍 Teste 3: Métricas dos últimos 7 dias...');
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 7);

    const dateRange = {
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0]
    };

    const metrics = await customer.query(`
      SELECT 
        campaign.id,
        campaign.name,
        metrics.impressions,
        metrics.clicks,
        metrics.cost_micros,
        metrics.conversions
      FROM campaign
      WHERE segments.date BETWEEN '${dateRange.startDate}' AND '${dateRange.endDate}'
      ORDER BY metrics.cost_micros DESC
      LIMIT 5
    `);

    console.log(`✅ Métricas obtidas para ${metrics.length} campanhas`);
    if (metrics.length > 0) {
      let totalImpressions = 0;
      let totalClicks = 0;
      let totalCost = 0;
      let totalConversions = 0;

      metrics.forEach(row => {
        totalImpressions += row.metrics.impressions || 0;
        totalClicks += row.metrics.clicks || 0;
        totalCost += (row.metrics.cost_micros || 0) / 1000000;
        totalConversions += row.metrics.conversions || 0;
      });

      console.log('   - Resumo dos últimos 7 dias:');
      console.log(`     • Impressões: ${totalImpressions.toLocaleString()}`);
      console.log(`     • Cliques: ${totalClicks.toLocaleString()}`);
      console.log(`     • Custo: R$ ${totalCost.toFixed(2)}`);
      console.log(`     • Conversões: ${totalConversions}`);
      console.log(`     • CTR: ${totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(2) : 0}%`);
    }

    console.log('\n🎉 TESTE CONCLUÍDO COM SUCESSO!');
    console.log('================================');
    console.log('✅ Conexão com Google Ads API: OK');
    console.log('✅ Credenciais: Válidas');
    console.log('✅ Permissões: OK');
    console.log('✅ Dados: Acessíveis');

    return {
      success: true,
      message: 'Conexão com Google Ads API funcionando perfeitamente!'
    };

  } catch (error) {
    console.error('\n❌ ERRO NO TESTE:');
    console.error('==================');
    console.error(`Erro: ${error?.message || error || 'Erro desconhecido'}`);
    
    const errorMessage = String(error?.message || error || '');
    if (errorMessage.includes('authentication')) {
      console.error('💡 Possível solução: Verificar credenciais OAuth2');
    } else if (errorMessage.includes('permission')) {
      console.error('💡 Possível solução: Verificar permissões da conta');
    } else if (errorMessage.includes('quota')) {
      console.error('💡 Possível solução: Limite de quota excedido');
    } else if (errorMessage.includes('customer_id')) {
      console.error('💡 Possível solução: Verificar Customer ID');
    }

    return {
      success: false,
      error: error?.message || error || 'Erro desconhecido'
    };
  }
}

// Executar o teste
testGoogleAdsConnection().then(result => {
  if (result.success) {
    console.log('\n🏁 Teste finalizado com sucesso!');
    process.exit(0);
  } else {
    console.log('\n🏁 Teste finalizado com erro!');
    process.exit(1);
  }
});
