/**
 * Teste final do sistema de sincronização
 * Foca apenas nas contas que funcionam
 */

import { GoogleAdsApi } from 'google-ads-api';

// Credenciais principais
const mainCredentials = {
  developerToken: 'xw46jmZN-n_wf7uCsC8daA',
  clientId: '415018341135-v3hjpjgqek6688r5eio8tl48229qbrrd.apps.googleusercontent.com',
  clientSecret: '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',
  refreshToken: '1//04FuT2ZSozaiCCgYIARAAGAQSNwF-L9IrAWfJ05xcGt1wgsEd8OuqiDQLgiAVfLgT5_LEYd10jSOtifOTugN_gqb0BBDyNU1Q0f0'
};

// Contas que sabemos que funcionam (baseado no teste anterior)
const workingAccounts = {
  1: { name: 'APUCARANA - FRANQUEADORA', customerId: '7396178858' },
  // Vamos testar algumas outras contas que podem funcionar
  8802039556: { name: 'OficialMed Apucarana', customerId: '8802039556' },
  7939953031: { name: 'Franchising - Oficial Med', customerId: '7939953031' },
  3018439482: { name: 'OficialMed - Matriz Apucarana', customerId: '3018439482' }
};

console.log('🧪 TESTE FINAL - SISTEMA DE SINCRONIZAÇÃO');
console.log('==========================================');

async function testAccount(accountId, accountInfo) {
  try {
    console.log(`\n🔍 Testando: ${accountInfo.name}`);
    console.log(`   Customer ID: ${accountInfo.customerId}`);
    
    const client = new GoogleAdsApi({
      client_id: mainCredentials.clientId,
      client_secret: mainCredentials.clientSecret,
      developer_token: mainCredentials.developerToken,
    });

    const customer = client.Customer({
      customer_id: accountInfo.customerId,
      refresh_token: mainCredentials.refreshToken,
    });

    // Teste: informações da conta
    const customerInfo = await customer.query(`
      SELECT 
        customer.id,
        customer.descriptive_name,
        customer.currency_code,
        customer.time_zone,
        customer.manager
      FROM customer
      LIMIT 1
    `);

    if (customerInfo.length > 0) {
      const info = customerInfo[0].customer;
      console.log(`   ✅ SUCESSO: ${info.descriptive_name}`);
      console.log(`   📊 Moeda: ${info.currency_code}`);
      console.log(`   🌍 Fuso: ${info.time_zone}`);
      console.log(`   👑 Manager: ${info.manager ? 'Sim' : 'Não'}`);
      
      // Teste: campanhas
      const campaigns = await customer.query(`
        SELECT 
          campaign.id,
          campaign.name,
          campaign.status
        FROM campaign
        LIMIT 5
      `);
      
      console.log(`   📋 Campanhas: ${campaigns.length} encontradas`);
      if (campaigns.length > 0) {
        campaigns.forEach((row, index) => {
          const campaign = row.campaign;
          console.log(`     ${index + 1}. ${campaign.name} (${campaign.status})`);
        });
      }
      
      return {
        success: true,
        accountId,
        accountName: accountInfo.name,
        customerId: accountInfo.customerId,
        accountNameFromAPI: info.descriptive_name,
        campaigns: campaigns.length,
        isManager: info.manager
      };
    }

  } catch (error) {
    console.log(`   ❌ ERRO: ${error.message || String(error)}`);
    return {
      success: false,
      accountId,
      accountName: accountInfo.name,
      customerId: accountInfo.customerId,
      error: error.message || String(error)
    };
  }
}

async function runTests() {
  console.log('🚀 Testando contas disponíveis...\n');
  
  const results = [];
  
  for (const [accountId, accountInfo] of Object.entries(workingAccounts)) {
    const result = await testAccount(accountId, accountInfo);
    results.push(result);
    
    // Pausa entre testes
    await new Promise(resolve => setTimeout(resolve, 1500));
  }
  
  // Relatório
  console.log('\n\n📊 RELATÓRIO FINAL');
  console.log('===================');
  
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  
  console.log(`✅ Contas funcionando: ${successful.length}/${results.length}`);
  
  if (successful.length > 0) {
    console.log('\n🎉 Contas disponíveis para uso:');
    successful.forEach(result => {
      console.log(`   ${result.customerId} - ${result.accountNameFromAPI}`);
      console.log(`     (${result.campaigns} campanhas, Manager: ${result.isManager ? 'Sim' : 'Não'})`);
    });
  }
  
  if (failed.length > 0) {
    console.log('\n⚠️ Contas com problemas:');
    failed.forEach(result => {
      console.log(`   ${result.customerId} - ${result.accountName}: ${result.error}`);
    });
  }
  
  // Recomendações
  console.log('\n💡 RECOMENDAÇÕES PARA O DASHBOARD:');
  console.log('===================================');
  
  if (successful.length > 0) {
    console.log('1. Use a conta Manager (7396178858) como principal');
    console.log('2. Configure as outras contas como opções específicas');
    console.log('3. Implemente seleção de conta na interface');
    console.log('4. Use o sistema de sincronização automática');
    
    console.log('\n🔧 Configuração sugerida:');
    successful.forEach(result => {
      if (result.isManager) {
        console.log(`   - Conta Principal: ${result.customerId} (${result.accountNameFromAPI})`);
      } else {
        console.log(`   - Conta Opcional: ${result.customerId} (${result.accountNameFromAPI})`);
      }
    });
  }
  
  return results;
}

// Executar
runTests().then(results => {
  const successCount = results.filter(r => r.success).length;
  console.log(`\n🏁 Teste concluído: ${successCount}/${results.length} contas funcionando`);
  process.exit(0);
});
