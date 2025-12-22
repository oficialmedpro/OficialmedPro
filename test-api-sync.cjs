#!/usr/bin/env node

/**
 * Script de teste para verificar se a API de sincronização está funcionando
 * e se NÃO está sincronizando segmentos
 */

const https = require('https');

const API_URL = 'https://sincro.oficialmed.com.br/sync/oportunidades';

console.log('🧪 Testando API de sincronização...');
console.log(`📡 URL: ${API_URL}\n`);

const options = {
    method: 'GET',
    headers: {
        'Content-Type': 'application/json'
    },
    timeout: 60000 // 60 segundos
};

const req = https.request(API_URL, options, (res) => {
    let data = '';

    console.log(`📊 Status Code: ${res.statusCode}`);
    console.log(`📋 Headers:`, res.headers);

    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        try {
            const json = JSON.parse(data);
            console.log('\n✅ Resposta da API:');
            console.log(JSON.stringify(json, null, 2));
            
            // Verificar se há menção a segmentos
            const responseStr = JSON.stringify(json).toLowerCase();
            if (responseStr.includes('segmento')) {
                console.log('\n⚠️ ATENÇÃO: A resposta contém menção a "segmento"!');
            } else {
                console.log('\n✅ OK: Nenhuma menção a segmentos na resposta');
            }
        } catch (e) {
            console.log('\n📄 Resposta (texto):');
            console.log(data);
        }
    });
});

req.on('error', (error) => {
    console.error('\n❌ Erro ao conectar:', error.message);
    console.error('\n💡 Dica: Verifique se a API está rodando e acessível');
});

req.on('timeout', () => {
    console.error('\n⏱️ Timeout: A requisição demorou mais de 60 segundos');
    req.destroy();
});

req.end();

