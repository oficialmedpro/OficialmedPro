/**
 * Script para listar todas as contas do Google Ads disponíveis
 * Mostra contas próprias e contas gerenciadas
 */

import { GoogleAdsApi } from 'google-ads-api';

// Credenciais do Google Ads (conta manager)
const credentials = {
  customerId: '739-617-8858',
  developerToken: 'xw46jmZN-n_wf7uCsC8daA',
  clientId: '415018341135-v3hjpjgqek6688r5eio8tl48229qbrrd.apps.googleusercontent.com',
  clientSecret: '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',
  refreshToken: '1//04FuT2ZSozaiCCgYIARAAGAQSNwF-L9IrAWfJ05xcGt1wgsEd8OuqiDQLgiAVfLgT5_LEYd10jSOtifOTugN_gqb0BBDyNU1Q0f0'
};

console.log('🔍 LISTANDO CONTAS DO GOOGLE ADS DISPONÍVEIS');
console.log('==============================================');

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
    console.log(`📋 Buscando contas acessíveis...`);

    // 1. Listar contas próprias (onde você é o dono)
    console.log('\n🏢 CONTAS PRÓPRIAS:');
    console.log('===================');
    
    const ownAccounts = await customer.query(`
      SELECT 
        customer.id,
        customer.descriptive_name,
        customer.currency_code,
        customer.time_zone,
        customer.manager,
        customer.test_account,
        customer.pay_per_conversion_eligibility_failure_reasons
      FROM customer
      WHERE customer.manager = false
      ORDER BY customer.descriptive_name
    `);

    if (ownAccounts.length > 0) {
      ownAccounts.forEach((row, index) => {
        const account = row.customer;
        console.log(`\n${index + 1}. 📊 ${account.descriptive_name}`);
        console.log(`   ID: ${account.id}`);
        console.log(`   Moeda: ${account.currency_code}`);
        console.log(`   Fuso: ${account.time_zone}`);
        console.log(`   Teste: ${account.test_account ? 'Sim' : 'Não'}`);
        console.log(`   Tipo: Conta Própria`);
      });
    } else {
      console.log('   Nenhuma conta própria encontrada');
    }

    // 2. Listar contas gerenciadas (onde você é manager)
    console.log('\n\n👥 CONTAS GERENCIADAS:');
    console.log('======================');
    
    const managedAccounts = await customer.query(`
      SELECT 
        customer.id,
        customer.descriptive_name,
        customer.currency_code,
        customer.time_zone,
        customer.manager,
        customer.test_account,
        customer_client.id as client_id,
        customer_client.descriptive_name as client_name,
        customer_client.currency_code as client_currency,
        customer_client.manager as client_manager,
        customer_client.test_account as client_test
      FROM customer_client
      ORDER BY customer_client.descriptive_name
    `);

    if (managedAccounts.length > 0) {
      managedAccounts.forEach((row, index) => {
        const client = row.customer_client;
        console.log(`\n${index + 1}. 🎯 ${client.descriptive_name}`);
        console.log(`   ID: ${client.id}`);
        console.log(`   Moeda: ${client.currency_code}`);
        console.log(`   Teste: ${client.test_account ? 'Sim' : 'Não'}`);
        console.log(`   Tipo: Conta Gerenciada`);
        console.log(`   Manager: ${client.manager ? 'Sim' : 'Não'}`);
      });
    } else {
      console.log('   Nenhuma conta gerenciada encontrada');
    }

    // 3. Resumo total
    const totalAccounts = ownAccounts.length + managedAccounts.length;
    console.log('\n\n📊 RESUMO:');
    console.log('===========');
    console.log(`✅ Total de contas encontradas: ${totalAccounts}`);
    console.log(`   - Contas próprias: ${ownAccounts.length}`);
    console.log(`   - Contas gerenciadas: ${managedAccounts.length}`);

    // 4. Instruções de uso
    console.log('\n\n💡 COMO USAR:');
    console.log('==============');
    console.log('Para usar uma conta específica, você pode:');
    console.log('1. Copiar o ID da conta desejada');
    console.log('2. Usar no GoogleAdsService com o ID correto');
    console.log('3. Ou atualizar as credenciais no banco de dados');
    
    console.log('\n🔧 Exemplo de uso:');
    console.log('const customer = client.Customer({');
    console.log('  customer_id: "ID_DA_CONTA_AQUI",');
    console.log('  refresh_token: "seu_refresh_token"');
    console.log('});');

    return {
      success: true,
      ownAccounts: ownAccounts,
      managedAccounts: managedAccounts,
      total: totalAccounts
    };

  } catch (error) {
    console.log('\n❌ ERRO:');
    console.log('========');
    console.log('Erro:', error);
    console.log('\n💡 Possíveis soluções:');
    console.log('- Verificar se a conta tem permissões de manager');
    console.log('- Verificar se o Developer Token está aprovado');
    console.log('- Verificar se as credenciais OAuth2 estão corretas');
    return false;
  }
}

// Executar listagem
listAccounts().then(result => {
  if (result) {
    console.log('\n🏁 Listagem concluída com SUCESSO!');
    process.exit(0);
  } else {
    console.log('\n🏁 Listagem concluída com ERRO!');
    process.exit(1);
  }
});
