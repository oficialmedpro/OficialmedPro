// Script para ativar um workflow no n8n
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

async function ativarWorkflow(workflowId) {
  try {
    console.log(`🚀 Ativando workflow ${workflowId}...\n`);
    
    const response = await makeRequest(`/api/v1/workflows/${workflowId}/activate`, 'POST');
    
    if (response.status === 200) {
      console.log('✅ Workflow ativado com sucesso!\n');
      return true;
    } else {
      console.error(`❌ Erro ao ativar: ${response.status}`);
      console.error(JSON.stringify(response.data, null, 2));
      return false;
    }
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
    return false;
  }
}

// ID do workflow de teste criado
const workflowId = process.argv[2] || '9Cdhau6WsMtY0aca';

ativarWorkflow(workflowId).then(sucesso => {
  if (sucesso) {
    console.log('✨ Workflow está agora ATIVO e pronto para receber requisições!');
  }
});
