/**
 * Script simplificado para listar contas do Google Ads
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

console.log('🔍 LISTANDO CONTAS DO GOOGLE ADS');
console.log('=================================');

async function listAccounts() {
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

    // 1. Informações da conta atual (manager)
    console.log('\n🏢 CONTA ATUAL (MANAGER):');
    console.log('==========================');
    
    const currentAccount = await customer.query(`
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

    if (currentAccount.length > 0) {
      const account = currentAccount[0].customer;
      console.log(`📊 Nome: ${account.descriptive_name}`);
      console.log(`🆔 ID: ${account.id}`);
      console.log(`💰 Moeda: ${account.currency_code}`);
      console.log(`🌍 Fuso: ${account.time_zone}`);
      console.log(`👑 Manager: ${account.manager ? 'Sim' : 'Não'}`);
      console.log(`🧪 Teste: ${account.test_account ? 'Sim' : 'Não'}`);
    }

    // 2. Listar contas gerenciadas (clientes)
    console.log('\n\n👥 CONTAS GERENCIADAS (CLIENTES):');
    console.log('===================================');
    
    try {
      const managedAccounts = await customer.query(`
        SELECT 
          customer_client.id,
          customer_client.descriptive_name,
          customer_client.currency_code,
          customer_client.manager,
          customer_client.test_account
        FROM customer_client
        ORDER BY customer_client.descriptive_name
      `);

      if (managedAccounts.length > 0) {
        console.log(`✅ Encontradas ${managedAccounts.length} contas gerenciadas:`);
        
        managedAccounts.forEach((row, index) => {
          const client = row.customer_client;
          console.log(`\n${index + 1}. 🎯 ${client.descriptive_name}`);
          console.log(`   ID: ${client.id}`);
          console.log(`   Moeda: ${client.currency_code}`);
          console.log(`   Manager: ${client.manager ? 'Sim' : 'Não'}`);
          console.log(`   Teste: ${client.test_account ? 'Sim' : 'Não'}`);
        });
      } else {
        console.log('   Nenhuma conta gerenciada encontrada');
      }
    } catch (error) {
      console.log('   ⚠️ Não foi possível listar contas gerenciadas');
      console.log(`   Erro: ${error.message || error}`);
    }

    // 3. Instruções
    console.log('\n\n💡 COMO SELECIONAR UMA CONTA:');
    console.log('===============================');
    console.log('1. Use o ID da conta desejada');
    console.log('2. Atualize no banco de dados ou no código');
    console.log('3. Exemplo de ID: 1234567890 (sem hífens)');
    
    console.log('\n🔧 Para usar uma conta específica:');
    console.log('const customer = client.Customer({');
    console.log('  customer_id: "ID_DA_CONTA",');
    console.log('  refresh_token: "seu_refresh_token"');
    console.log('});');

    return true;

  } catch (error) {
    console.log('\n❌ ERRO:');
    console.log('========');
    console.log('Erro:', error);
    return false;
  }
}

// Executar
listAccounts().then(success => {
  if (success) {
    console.log('\n🏁 Listagem concluída!');
    process.exit(0);
  } else {
    console.log('\n🏁 Erro na listagem!');
    process.exit(1);
  }
});
