const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Configuração
const CONFIG = {
  SPRINTHUB: {
    baseUrl: process.env.VITE_SPRINTHUB_BASE_URL || 'sprinthub-api-master.sprinthub.app',
    apiToken: process.env.VITE_SPRINTHUB_API_TOKEN || '',
    instance: process.env.VITE_SPRINTHUB_INSTANCE || 'oficialmed'
  }
};

// Função para log
function log(message) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${message}`);
}

// Função para testar API com delay
async function testApiWithDelay() {
  log('🔍 Testando API com delay de 2 minutos entre requisições...');
  
  for (let i = 1; i <= 3; i++) {
    try {
      log(`📡 Tentativa ${i}/3 - Fazendo requisição...`);
      
      const url = `https://${CONFIG.SPRINTHUB.baseUrl}/leads?i=${CONFIG.SPRINTHUB.instance}&page=1&limit=5&apitoken=${CONFIG.SPRINTHUB.apiToken}`;
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${CONFIG.SPRINTHUB.apiToken}`,
          'apitoken': CONFIG.SPRINTHUB.apiToken
        }
      });

      log(`📊 Status: ${response.status}`);
      
      if (response.status === 401) {
        const errorData = await response.json();
        log(`❌ Rate limit: ${errorData.msg}`);
        log(`📊 Uso: ${errorData.usage}/${errorData.limite}`);
      } else if (response.ok) {
        const data = await response.json();
        log(`✅ Sucesso! Leads encontrados: ${data.data?.leads?.length || 0}`);
        break; // Se funcionou, para o loop
      } else {
        log(`❌ Erro HTTP: ${response.status}`);
      }
      
      // Aguardar 2 minutos entre tentativas
      if (i < 3) {
        log('⏳ Aguardando 2 minutos antes da próxima tentativa...');
        await new Promise(resolve => setTimeout(resolve, 120000)); // 2 minutos
      }
      
    } catch (error) {
      log(`❌ Erro na tentativa ${i}: ${error.message}`);
    }
  }
}

// Executar teste
testApiWithDelay().catch(error => {
  log(`💥 Erro fatal: ${error.message}`);
});

