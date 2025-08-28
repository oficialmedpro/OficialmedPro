/**
 * 🧪 PASSO 1: TESTE BÁSICO DA API SPRINTHUB
 * 
 * OBJETIVO:
 * - Testar conexão com a API do SprintHUB
 * - Buscar primeira página de oportunidades do funil 6
 * - Verificar se autenticação está funcionando
 * - Documentar estrutura básica da resposta
 * 
 * CONFIGURAÇÕES:
 * - URL: https://sprinthub-api-master.sprinthub.app
 * - Instância: oficialmed
 * - API Token: 9ad36c85-5858-4960-9935-e73c3698dd0c
 * - Funil teste: 6 = "[1] COMERCIAL APUCARANA"
 */

const https = require('https');

// 🔧 CONFIGURAÇÕES DA API
const SPRINTHUB_CONFIG = {
    baseUrl: 'sprinthub-api-master.sprinthub.app',
    instance: 'oficialmed',
    apiToken: '9ad36c85-5858-4960-9935-e73c3698dd0c',
    testFunnelId: 6, // Funil "[1] COMERCIAL APUCARANA"
    timeout: 30000
};

/**
 * 🌐 Função para fazer requisição HTTP POST para SprintHUB
 */
function makeSprintHubRequest(funnelId, page = 0, limit = 10, columnId = null) {
    return new Promise((resolve, reject) => {
        // 📝 Preparar dados da requisição
        const postData = JSON.stringify({
            page: page,
            limit: limit,
            ...(columnId && { columnId: columnId })
        });

        // 📝 Configurar opções da requisição
        const options = {
            hostname: SPRINTHUB_CONFIG.baseUrl,
            port: 443,
            path: `/crm/opportunities/${funnelId}?apitoken=${SPRINTHUB_CONFIG.apiToken}&i=${SPRINTHUB_CONFIG.instance}`,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'User-Agent': 'SprintHUB-Sync/1.0',
                'Content-Length': Buffer.byteLength(postData)
            },
            timeout: SPRINTHUB_CONFIG.timeout
        };

        console.log('🔗 FAZENDO REQUISIÇÃO:');
        console.log(`   URL: https://${options.hostname}${options.path}`);
        console.log(`   Method: ${options.method}`);
        console.log(`   Body:`, JSON.parse(postData));
        console.log('');

        // 📡 Fazer requisição
        const req = https.request(options, (res) => {
            let responseData = '';
            
            res.on('data', (chunk) => {
                responseData += chunk;
            });
            
            res.on('end', () => {
                try {
                    console.log(`📊 STATUS: ${res.statusCode}`);
                    console.log(`📊 HEADERS:`, res.headers);
                    
                    if (res.statusCode === 200) {
                        const jsonData = JSON.parse(responseData);
                        resolve({
                            success: true,
                            status: res.statusCode,
                            data: jsonData,
                            headers: res.headers
                        });
                    } else {
                        console.log(`❌ ERRO HTTP ${res.statusCode}:`, responseData);
                        resolve({
                            success: false,
                            status: res.statusCode,
                            error: responseData,
                            headers: res.headers
                        });
                    }
                } catch (parseError) {
                    console.log('❌ ERRO AO PARSEAR JSON:', parseError.message);
                    console.log('📄 RESPOSTA RAW:', responseData);
                    reject(parseError);
                }
            });
        });

        req.on('error', (error) => {
            console.log('❌ ERRO DE REDE:', error.message);
            reject(error);
        });

        req.on('timeout', () => {
            console.log('⏰ TIMEOUT DA REQUISIÇÃO');
            req.destroy();
            reject(new Error('Request timeout'));
        });

        // 📤 Enviar dados
        req.write(postData);
        req.end();
    });
}

/**
 * 🧪 Função principal de teste
 */
async function testSprintHubConnection() {
    try {
        console.log('🚀 TESTE DE CONEXÃO COM SPRINTHUB API');
        console.log('=====================================');
        console.log(`📅 ${new Date().toISOString()}`);
        console.log('');
        
        console.log('⚙️ CONFIGURAÇÕES:');
        console.log(`   Base URL: ${SPRINTHUB_CONFIG.baseUrl}`);
        console.log(`   Instância: ${SPRINTHUB_CONFIG.instance}`);
        console.log(`   API Token: ${SPRINTHUB_CONFIG.apiToken.substring(0, 8)}...`);
        console.log(`   Funil teste: ${SPRINTHUB_CONFIG.testFunnelId}`);
        console.log('');

        // 🧪 TESTE 1: Buscar primeira página do funil 6
        console.log('🧪 TESTE 1: Primeira página do funil 6');
        console.log('----------------------------------------');
        
        const result = await makeSprintHubRequest(
            SPRINTHUB_CONFIG.testFunnelId, // funil 6
            0, // primeira página
            5  // apenas 5 registros para teste
        );

        if (result.success) {
            console.log('✅ CONEXÃO FUNCIONANDO!');
            console.log('');
            console.log('📊 DADOS RECEBIDOS:');
            console.log(`   Total de registros: ${result.data.length || 'N/A'}`);
            console.log(`   Tipo de dados: ${typeof result.data}`);
            console.log('');
            
            // 📋 Mostrar estrutura dos dados
            if (Array.isArray(result.data) && result.data.length > 0) {
                console.log('📝 ESTRUTURA DO PRIMEIRO REGISTRO:');
                const firstRecord = result.data[0];
                Object.keys(firstRecord).forEach(key => {
                    console.log(`   ${key}: ${typeof firstRecord[key]} = ${firstRecord[key]}`);
                });
            } else if (result.data && typeof result.data === 'object') {
                console.log('📝 ESTRUTURA DA RESPOSTA:');
                Object.keys(result.data).forEach(key => {
                    console.log(`   ${key}: ${typeof result.data[key]}`);
                });
            }
            
            console.log('');
            console.log('📄 RESPOSTA COMPLETA:');
            console.log(JSON.stringify(result.data, null, 2));
            
        } else {
            console.log('❌ FALHA NA CONEXÃO!');
            console.log(`   Status: ${result.status}`);
            console.log(`   Erro: ${result.error}`);
        }

    } catch (error) {
        console.log('❌ ERRO GERAL:', error.message);
        console.log('📄 Stack:', error.stack);
    }
}

// 🚀 Executar teste
console.log('🎯 Iniciando teste da API SprintHUB...');
testSprintHubConnection()
    .then(() => {
        console.log('');
        console.log('🎉 TESTE CONCLUÍDO!');
        process.exit(0);
    })
    .catch((error) => {
        console.log('');
        console.log('❌ TESTE FALHOU:', error.message);
        process.exit(1);
    });
