#!/usr/bin/env node

/**
 * 🧪 test-sprinthub-api.js | Teste simples da API do SprintHub
 */

import dotenv from 'dotenv';
dotenv.config();

const CONFIG = {
  SPRINTHUB: {
    baseUrl: process.env.VITE_SPRINTHUB_BASE_URL || 'sprinthub-api-master.sprinthub.app',
    apiToken: process.env.VITE_SPRINTHUB_API_TOKEN || '',
    instance: process.env.VITE_SPRINTHUB_INSTANCE || 'oficialmed'
  }
};

console.log('🔍 Testando API do SprintHub...');
console.log('📋 Configurações:');
console.log(`  Base URL: ${CONFIG.SPRINTHUB.baseUrl}`);
console.log(`  Instance: ${CONFIG.SPRINTHUB.instance}`);
console.log(`  API Token: ${CONFIG.SPRINTHUB.apiToken ? '✅ Definido' : '❌ Não definido'}`);

// Teste simples
async function testApi() {
  const { baseUrl, instance, apiToken } = CONFIG.SPRINTHUB;
  const url = `https://${baseUrl}/leads?i=${instance}&page=1&limit=5&apitoken=${apiToken}`;
  
  console.log(`\n🌐 Testando URL: ${url}`);
  
  try {
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${apiToken}`,
        'apitoken': apiToken
      }
    });
    
    console.log(`📊 Status: ${response.status}`);
    console.log(`📊 Headers:`, Object.fromEntries(response.headers.entries()));
    
    const data = await response.text();
    console.log(`📊 Response (primeiros 500 chars):`, data.substring(0, 500));
    
    if (response.ok) {
      try {
        const jsonData = JSON.parse(data);
        console.log(`📊 JSON válido! Estrutura:`, Object.keys(jsonData));
        if (jsonData.data && jsonData.data.leads) {
          console.log(`📊 Leads encontrados: ${jsonData.data.leads.length}`);
        }
      } catch (e) {
        console.log(`❌ Resposta não é JSON válido`);
      }
    }
    
  } catch (error) {
    console.error('❌ Erro na requisição:', error.message);
  }
}

testApi();

