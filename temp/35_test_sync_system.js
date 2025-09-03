/**
 * Script para testar o sistema de sincronização do Google Ads
 * Testa diferentes unidades e verifica se as credenciais estão corretas
 */

import { GoogleAdsApi } from 'google-ads-api';

// Credenciais principais (da unidade Apucarana)
const mainCredentials = {
  developerToken: 'xw46jmZN-n_wf7uCsC8daA',
  clientId: '415018341135-v3hjpjgqek6688r5eio8tl48229qbrrd.apps.googleusercontent.com',
  clientSecret: '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',
  refreshToken: '1//04FuT2ZSozaiCCgYIARAAGAQSNwF-L9IrAWfJ05xcGt1wgsEd8OuqiDQLgiAVfLgT5_LEYd10jSOtifOTugN_gqb0BBDyNU1Q0f0'
};

// Mapeamento de unidades e seus Customer IDs
const units = {
  1: { name: 'APUCARANA - FRANQUEADORA', customerId: '7396178858' },
  3: { name: 'BOM JESUS', customerId: '5979656533' },
  4: { name: 'BELO HORIZONTE', customerId: '9877997617' },
  5: { name: 'LONDRINA', customerId: '9385784147' },
  6: { name: 'ARAPONGAS', customerId: '3283035994' },
  7: { name: 'BALNEÁRIO CAMBORIÚ', customerId: '8619286323' }
};

console.log('🧪 TESTANDO SISTEMA DE SINCRONIZAÇÃO GOOGLE ADS');
console.log('================================================');

async function testUnit(unitId, unitInfo) {
  try {
    console.log(`\n🔍 Testando Unidade ${unitId}: ${unitInfo.name}`);
    console.log(`   Customer ID: ${unitInfo.customerId}`);
    
    // Inicializar cliente
    const client = new GoogleAdsApi({
      client_id: mainCredentials.clientId,
      client_secret: mainCredentials.clientSecret,
      developer_token: mainCredentials.developerToken,
    });

    const customer = client.Customer({
      customer_id: unitInfo.customerId,
      refresh_token: mainCredentials.refreshToken,
    });

    // Teste básico: informações da conta
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
      console.log(`   ✅ SUCESSO: ${info.descriptive_name}`);
      console.log(`   📊 Moeda: ${info.currency_code}`);
      console.log(`   🌍 Fuso: ${info.time_zone}`);
      
      // Teste: listar campanhas
      const campaigns = await customer.query(`
        SELECT 
          campaign.id,
          campaign.name,
          campaign.status
        FROM campaign
        LIMIT 3
      `);
      
      console.log(`   📋 Campanhas: ${campaigns.length} encontradas`);
      
      return {
        success: true,
        unitId,
        unitName: unitInfo.name,
        customerId: unitInfo.customerId,
        accountName: info.descriptive_name,
        campaigns: campaigns.length
      };
    } else {
      console.log(`   ❌ FALHOU: Nenhuma informação encontrada`);
      return {
        success: false,
        unitId,
        unitName: unitInfo.name,
        customerId: unitInfo.customerId,
        error: 'Nenhuma informação da conta encontrada'
      };
    }

  } catch (error) {
    console.log(`   ❌ ERRO: ${error.message || error}`);
    return {
      success: false,
      unitId,
      unitName: unitInfo.name,
      customerId: unitInfo.customerId,
      error: error.message || error
    };
  }
}

async function runAllTests() {
  console.log('🚀 Iniciando testes de todas as unidades...\n');
  
  const results = [];
  
  for (const [unitId, unitInfo] of Object.entries(units)) {
    const result = await testUnit(unitId, unitInfo);
    results.push(result);
    
    // Pequena pausa entre testes para evitar rate limit
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Relatório final
  console.log('\n\n📊 RELATÓRIO FINAL');
  console.log('===================');
  
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  
  console.log(`✅ Sucessos: ${successful.length}/${results.length}`);
  console.log(`❌ Falhas: ${failed.length}/${results.length}`);
  
  if (successful.length > 0) {
    console.log('\n🎉 Unidades funcionando:');
    successful.forEach(result => {
      console.log(`   ${result.unitId}. ${result.unitName} (${result.campaigns} campanhas)`);
    });
  }
  
  if (failed.length > 0) {
    console.log('\n⚠️ Unidades com problemas:');
    failed.forEach(result => {
      console.log(`   ${result.unitId}. ${result.unitName}: ${result.error}`);
    });
  }
  
  console.log('\n💡 Próximos passos:');
  console.log('1. Execute o script SQL no Supabase Dashboard');
  console.log('2. Verifique se o trigger foi criado corretamente');
  console.log('3. Teste atualizando credenciais na unidade Apucarana');
  console.log('4. Confirme se a sincronização automática funciona');
  
  return results;
}

// Executar testes
runAllTests().then(results => {
  const successCount = results.filter(r => r.success).length;
  console.log(`\n🏁 Testes concluídos: ${successCount}/${results.length} sucessos`);
  process.exit(successCount >= results.length * 0.8 ? 0 : 1);
});
