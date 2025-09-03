/**
 * Teste completo de todas as contas para verificar quais têm campanhas
 */

import { GoogleAdsApi } from 'google-ads-api';

// Credenciais principais
const mainCredentials = {
  developerToken: 'xw46jmZN-n_wf7uCsC8daA',
  clientId: '415018341135-v3hjpjgqek6688r5eio8tl48229qbrrd.apps.googleusercontent.com',
  clientSecret: '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',
  refreshToken: '1//04FuT2ZSozaiCCgYIARAAGAQSNwF-L9IrAWfJ05xcGt1wgsEd8OuqiDQLgiAVfLgT5_LEYd10jSOtifOTugN_gqb0BBDyNU1Q0f0'
};

// Todas as contas que encontramos
const allAccounts = {
  '7396178858': { name: 'MATRIZ OficialMed', type: 'Manager' },
  '1666627670': { name: 'Conta sem nome', type: 'Cliente' },
  '7939953031': { name: 'Franchising - Oficial Med', type: 'Cliente' },
  '3018439482': { name: 'OficialMed - Matriz Apucarana', type: 'Cliente' },
  '8802039556': { name: 'OficialMed Apucarana', type: 'Cliente' },
  '3283035994': { name: 'OficialMed Arapongas', type: 'Cliente' },
  '8619286323': { name: 'OficialMed Balneário Camboriú', type: 'Cliente' },
  '9877997617': { name: 'OficialMed Belo Horizonte', type: 'Cliente' },
  '5979656533': { name: 'OficialMed Bom Jesus', type: 'Cliente' },
  '9385784147': { name: 'OficialMed Londrina', type: 'Cliente' }
};

console.log('🔍 TESTANDO TODAS AS CONTAS DO GOOGLE ADS');
console.log('==========================================');

async function testAccount(customerId, accountInfo) {
  try {
    console.log(`\n🔍 Testando: ${accountInfo.name} (${customerId})`);
    
    const client = new GoogleAdsApi({
      client_id: mainCredentials.clientId,
      client_secret: mainCredentials.clientSecret,
      developer_token: mainCredentials.developerToken,
    });

    const customer = client.Customer({
      customer_id: customerId,
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
      
      // Teste: campanhas
      const campaigns = await customer.query(`
        SELECT 
          campaign.id,
          campaign.name,
          campaign.status
        FROM campaign
        LIMIT 10
      `);
      
      console.log(`   ✅ ${info.descriptive_name}`);
      console.log(`   📋 Campanhas: ${campaigns.length}`);
      console.log(`   👑 Manager: ${info.manager ? 'Sim' : 'Não'}`);
      
      if (campaigns.length > 0) {
        console.log(`   🎯 Campanhas ativas:`);
        campaigns.slice(0, 3).forEach((row, index) => {
          const campaign = row.campaign;
          console.log(`     ${index + 1}. ${campaign.name} (${campaign.status})`);
        });
      }
      
      return {
        success: true,
        customerId,
        accountName: info.descriptive_name,
        campaigns: campaigns.length,
        isManager: info.manager,
        hasCampaigns: campaigns.length > 0
      };
    }

  } catch (error) {
    console.log(`   ❌ ERRO: ${error.message || String(error)}`);
    return {
      success: false,
      customerId,
      accountName: accountInfo.name,
      error: error.message || String(error)
    };
  }
}

async function testAllAccounts() {
  console.log('🚀 Testando todas as contas...\n');
  
  const results = [];
  
  for (const [customerId, accountInfo] of Object.entries(allAccounts)) {
    const result = await testAccount(customerId, accountInfo);
    results.push(result);
    
    // Pausa entre testes
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Relatório
  console.log('\n\n📊 RELATÓRIO COMPLETO');
  console.log('======================');
  
  const successful = results.filter(r => r.success);
  const withCampaigns = successful.filter(r => r.hasCampaigns);
  const managers = successful.filter(r => r.isManager);
  
  console.log(`✅ Contas funcionando: ${successful.length}/${results.length}`);
  console.log(`📋 Contas com campanhas: ${withCampaigns.length}`);
  console.log(`👑 Contas Manager: ${managers.length}`);
  
  if (withCampaigns.length > 0) {
    console.log('\n🎯 CONTAS COM CAMPANHAS (RECOMENDADAS):');
    withCampaigns.forEach(result => {
      console.log(`   ${result.customerId} - ${result.accountName} (${result.campaigns} campanhas)`);
    });
  }
  
  if (managers.length > 0) {
    console.log('\n👑 CONTAS MANAGER:');
    managers.forEach(result => {
      console.log(`   ${result.customerId} - ${result.accountName}`);
    });
  }
  
  // Gerar SQL para contas com campanhas
  console.log('\n\n🔧 SQL PARA CONFIGURAR CONTAS COM CAMPANHAS:');
  console.log('===============================================');
  
  if (withCampaigns.length > 0) {
    console.log('-- Configurar contas que têm campanhas ativas');
    withCampaigns.forEach((result, index) => {
      const unitId = index + 1; // Assumindo que começamos do ID 1
      console.log(`-- ${result.accountName}`);
      console.log(`UPDATE api.unidades SET google_customer_id = '${result.customerId}', google_ads_active = true WHERE id = ${unitId};`);
    });
  }
  
  return results;
}

// Executar
testAllAccounts().then(results => {
  const successCount = results.filter(r => r.success).length;
  const withCampaignsCount = results.filter(r => r.success && r.hasCampaigns).length;
  console.log(`\n🏁 Teste concluído: ${successCount} contas funcionando, ${withCampaignsCount} com campanhas`);
  process.exit(0);
});
