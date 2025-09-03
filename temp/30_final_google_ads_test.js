/**
 * Teste final da conexão com Google Ads API
 */

import { GoogleAdsApi } from 'google-ads-api';

// Credenciais do Google Ads
const credentials = {
  customerId: '739-617-8858',
  developerToken: 'xw46jmZN-n_wf7uCsC8daA',
  clientId: '415018341135-v3hjpjgqek6688r5eio8tl48229qbrrd.apps.googleusercontent.com',
  clientSecret: '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',
  refreshToken: '1//04FuT2ZSozaiCCgYIARAAGAQSNwF-L9IrAWfJ05xcGt1wgsEd8OuqiDQLgiAVfLgT5_LEYd10jSOtifOTugN_gqb0BBDyNU1Q0f0'
};

console.log('🧪 TESTE FINAL - GOOGLE ADS API');
console.log('===============================');

async function testConnection() {
  try {
    // Inicializar cliente
    console.log('🔧 Inicializando cliente...');
    const client = new GoogleAdsApi({
      client_id: credentials.clientId,
      client_secret: credentials.clientSecret,
      developer_token: credentials.developerToken,
    });

    const formattedCustomerId = credentials.customerId.replace(/-/g, '');
    const customer = client.Customer({
      customer_id: formattedCustomerId,
      refresh_token: credentials.refreshToken,
    });

    console.log('✅ Cliente inicializado');

    // Teste 1: Informações da conta
    console.log('\n🔍 Teste 1: Informações da conta');
    const customerInfo = await customer.query(`
      SELECT 
        customer.id,
        customer.descriptive_name,
        customer.currency_code,
        customer.time_zone
      FROM customer
      LIMIT 1
    `);

    if (customerInfo.length > 0) {
      const info = customerInfo[0].customer;
      console.log('✅ SUCESSO:');
      console.log(`   - Nome: ${info.descriptive_name}`);
      console.log(`   - ID: ${info.id}`);
      console.log(`   - Moeda: ${info.currency_code}`);
      console.log(`   - Fuso: ${info.time_zone}`);
    }

    // Teste 2: Campanhas
    console.log('\n🔍 Teste 2: Listar campanhas');
    const campaigns = await customer.query(`
      SELECT 
        campaign.id,
        campaign.name,
        campaign.status
      FROM campaign
      LIMIT 5
    `);

    console.log(`✅ SUCESSO: ${campaigns.length} campanhas encontradas`);
    if (campaigns.length > 0) {
      campaigns.forEach((row, index) => {
        const campaign = row.campaign;
        console.log(`   ${index + 1}. ${campaign.name} (${campaign.status})`);
      });
    }

    console.log('\n🎉 RESULTADO FINAL:');
    console.log('===================');
    console.log('✅ Conexão com Google Ads API: FUNCIONANDO');
    console.log('✅ Credenciais: VÁLIDAS');
    console.log('✅ Permissões: OK');
    console.log('✅ Dados: ACESSÍVEIS');
    console.log('\n🚀 A integração está pronta para uso!');

    return true;

  } catch (error) {
    console.log('\n❌ ERRO:');
    console.log('========');
    console.log('Erro:', error);
    console.log('\n💡 Verifique:');
    console.log('- Credenciais OAuth2');
    console.log('- Permissões da conta');
    console.log('- Developer Token');
    return false;
  }
}

// Executar teste
testConnection().then(success => {
  if (success) {
    console.log('\n🏁 Teste concluído com SUCESSO!');
    process.exit(0);
  } else {
    console.log('\n🏁 Teste concluído com ERRO!');
    process.exit(1);
  }
});
