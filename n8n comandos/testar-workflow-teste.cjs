// Script para testar o workflow de teste
const https = require('https');

const WEBHOOK_URL = 'https://n8n.oficialmed.com.br/webhook/teste-webhook';

function testarWebhook() {
  return new Promise((resolve, reject) => {
    const url = new URL(WEBHOOK_URL);
    
    const dados = {
      teste: 'dados',
      mensagem: 'Teste do workflow',
      timestamp: new Date().toISOString()
    };

    const options = {
      hostname: url.hostname,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({ status: res.statusCode, data: json });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(JSON.stringify(dados));
    req.end();
  });
}

async function testar() {
  try {
    console.log('🧪 Testando workflow de teste...\n');
    console.log(`📍 URL: ${WEBHOOK_URL}\n`);
    
    const response = await testarWebhook();
    
    console.log(`📊 Status HTTP: ${response.status}\n`);
    console.log('📦 Resposta do workflow:');
    console.log(JSON.stringify(response.data, null, 2));
    
    if (response.status === 200) {
      console.log('\n✅ Workflow funcionando perfeitamente!');
    } else {
      console.log('\n⚠️ Workflow respondeu, mas com status diferente de 200');
    }
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

testar();
