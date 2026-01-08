// Script para testar API do n8n
// Uso: node "n8n comandos/test-api-n8n.cjs"
// Configure as variáveis de ambiente N8N_API_KEY e N8N_BASE_URL

const https = require('https');

const N8N_BASE_URL = process.env.N8N_BASE_URL || 'https://n8n.oficialmed.com.br';
const API_KEY = process.env.N8N_API_KEY || '';

if (!API_KEY) {
  console.error('❌ Erro: Configure a variável de ambiente N8N_API_KEY');
  console.log('\nExemplo:');
  console.log('  export N8N_API_KEY="sua_api_key_aqui"');
  console.log('  node "n8n comandos/test-api-n8n.cjs"');
  process.exit(1);
}

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

async function test() {
  try {
    console.log('🔍 Testando conexão com n8n...\n');
    console.log(`📍 URL: ${N8N_BASE_URL}\n`);
    
    // Listar workflows
    console.log('📋 Listando workflows...');
    const response = await makeRequest('/api/v1/workflows');
    
    if (response.status !== 200) {
      console.error(`❌ Erro HTTP ${response.status}:`, response.data);
      return;
    }
    
    const workflows = response.data;
    
    if (workflows.data && workflows.data.length > 0) {
      console.log(`✅ Encontrados ${workflows.data.length} workflows:\n`);
      
      const ativos = workflows.data.filter(w => w.active).length;
      const inativos = workflows.data.length - ativos;
      
      console.log(`📊 Estatísticas:`);
      console.log(`   ✅ Ativos: ${ativos}`);
      console.log(`   ⏸️  Inativos: ${inativos}\n`);
      
      workflows.data.forEach((wf, index) => {
        console.log(`${index + 1}. ${wf.name} (ID: ${wf.id})`);
        console.log(`   Status: ${wf.active ? '✅ Ativo' : '⏸️ Inativo'}`);
        console.log(`   Criado: ${new Date(wf.createdAt).toLocaleString('pt-BR')}`);
        console.log('');
      });
    } else {
      console.log('📭 Nenhum workflow encontrado ou resposta inesperada:');
      console.log(JSON.stringify(workflows, null, 2));
    }
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
    if (error.code === 'ENOTFOUND') {
      console.error('   Verifique se a URL do n8n está correta');
    } else if (error.code === 'ECONNREFUSED') {
      console.error('   Não foi possível conectar ao n8n');
    }
  }
}

test();
