// Script para criar um workflow de teste no n8n
const https = require('https');

const N8N_BASE_URL = process.env.N8N_BASE_URL || 'https://n8n.oficialmed.com.br';
const API_KEY = process.env.N8N_API_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI3M2Q1YzI0ZC0zYjc5LTQxNTQtYWM4Mi0yZmVjZWY5Y2U1NTAiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzY3ODg4NTQ2fQ.Y3EbgN199L5juT-PLx5Akkv1-xrGGJwj0LEWPeNyiJk';

function makeRequest(path, method = 'GET', body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, N8N_BASE_URL);
    
    const options = {
      hostname: url.hostname,
      path: url.pathname,
      method: method,
      headers: {
        'X-N8N-API-KEY': API_KEY,
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

    if (body) {
      req.write(JSON.stringify(body));
    }

    req.end();
  });
}

// Workflow de teste simples
const workflowTeste = {
  name: 'TESTE - Workflow Simples',
  nodes: [
    {
      parameters: {
        httpMethod: 'POST',
        path: 'teste-webhook',
        responseMode: 'responseNode',
        options: {}
      },
      id: 'webhook-teste',
      name: 'Webhook',
      type: 'n8n-nodes-base.webhook',
      typeVersion: 1.1,
      position: [250, 300],
      webhookId: 'teste-webhook',
    },
    {
      parameters: {
        jsCode: `// Node de teste - apenas processa os dados recebidos
const dados = $input.item.json;

return {
  json: {
    mensagem: '✅ Workflow funcionando!',
    dadosRecebidos: dados,
    timestamp: new Date().toISOString(),
    processado: true
  }
};`
      },
      id: 'code-teste',
      name: 'Processar Dados',
      type: 'n8n-nodes-base.code',
      typeVersion: 2,
      position: [450, 300],
    },
    {
      parameters: {},
      id: 'respond-webhook',
      name: 'Responder',
      type: 'n8n-nodes-base.respondToWebhook',
      typeVersion: 1,
      position: [650, 300],
    }
  ],
  connections: {
    'Webhook': {
      main: [[{ node: 'Processar Dados', type: 'main', index: 0 }]]
    },
    'Processar Dados': {
      main: [[{ node: 'Responder', type: 'main', index: 0 }]]
    }
  },
  settings: {
    executionOrder: 'v1'
  }
};

async function criarWorkflow() {
  try {
    console.log('🚀 Criando workflow de teste no n8n...\n');
    
    const response = await makeRequest('/api/v1/workflows', 'POST', workflowTeste);
    
    if (response.status === 200 || response.status === 201) {
      const workflow = response.data;
      console.log('✅ Workflow criado com sucesso!\n');
      console.log(`📋 Nome: ${workflow.name}`);
      console.log(`🆔 ID: ${workflow.id}`);
      console.log(`📊 Status: ${workflow.active ? '✅ Ativo' : '⏸️ Inativo'}\n`);
      
      // Buscar URL do webhook
      const webhookResponse = await makeRequest(`/api/v1/workflows/${workflow.id}`);
      if (webhookResponse.status === 200) {
        const webhookNode = webhookResponse.data.nodes.find(n => n.type === 'n8n-nodes-base.webhook');
        if (webhookNode && webhookNode.webhookId) {
          const webhookUrl = `${N8N_BASE_URL}/webhook/${webhookNode.webhookId}`;
          console.log('🔗 URL do Webhook:');
          console.log(`   ${webhookUrl}\n`);
          console.log('🧪 Para testar, faça uma requisição POST:');
          console.log(`   curl -X POST "${webhookUrl}" -H "Content-Type: application/json" -d '{"teste": "dados"}'`);
        }
      }
      
      console.log('\n✨ Pronto! O workflow está ativo e pronto para receber requisições.');
      
    } else {
      console.error(`❌ Erro ao criar workflow: ${response.status}`);
      console.error(JSON.stringify(response.data, null, 2));
    }
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

criarWorkflow();
