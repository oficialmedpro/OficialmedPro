#!/usr/bin/env node

require('dotenv').config();

const CONFIG = {
  SPRINTHUB: {
    baseUrl: process.env.VITE_SPRINTHUB_BASE_URL,
    apiToken: process.env.VITE_SPRINTHUB_API_TOKEN,
    instance: process.env.VITE_SPRINTHUB_INSTANCE
  }
};

async function debugAPI() {
  // Testar com um lead conhecido: 15147
  const leadId = 15147;
  const url = `https://${CONFIG.SPRINTHUB.baseUrl}/leads/${leadId}?i=${CONFIG.SPRINTHUB.instance}&allFields=1&apitoken=${CONFIG.SPRINTHUB.apiToken}`;

  console.log(`🔍 Testando API do SprintHub`);
  console.log(`URL: ${url}\n`);

  try {
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${CONFIG.SPRINTHUB.apiToken}`,
        'apitoken': CONFIG.SPRINTHUB.apiToken
      }
    });

    console.log(`Status: ${response.status} ${response.statusText}\n`);

    if (!response.ok) {
      const text = await response.text();
      console.log('❌ Resposta de erro:', text);
      return;
    }

    const data = await response.json();

    console.log('📦 RESPOSTA COMPLETA DA API:');
    console.log('='.repeat(60));
    console.log(JSON.stringify(data, null, 2));
    console.log('='.repeat(60));

    console.log('\n📋 ESTRUTURA:');
    console.log(`Tipo: ${typeof data}`);
    console.log(`Chaves no root: ${Object.keys(data).join(', ')}`);

    if (data.data && data.data.lead) {
      const lead = data.data.lead;
      console.log(`\n📦 data.data.lead existe!`);
      console.log(`Tipo: ${typeof lead}`);
      console.log(`\n🔑 TODOS OS CAMPOS DISPONÍVEIS:`);
      console.log(`Chaves: ${Object.keys(lead).join(', ')}`);
      console.log(`\n📋 DADOS COMPLETOS DO LEAD:`);
      console.log(JSON.stringify(lead, null, 2));
    }

  } catch (error) {
    console.error('❌ Erro:', error.message);
    console.error(error.stack);
  }
}

debugAPI();
