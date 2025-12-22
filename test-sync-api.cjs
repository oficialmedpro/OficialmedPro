#!/usr/bin/env node

/**
 * Script de teste para verificar se a API de sincronização está funcionando
 * e se NÃO está sincronizando segmentos
 */

const https = require('https');

const API_URL = 'https://sincro.oficialmed.com.br/sync/oportunidades';

console.log('🧪 Testando API de sincronização...');
console.log(`📡 URL: ${API_URL}\n`);
console.log('⏳ Aguardando resposta (pode demorar alguns minutos)...\n');

const options = {
    method: 'GET',
    headers: {
        'Content-Type': 'application/json'
    },
    timeout: 300000 // 5 minutos
};

let startTime = Date.now();

const req = https.request(API_URL, options, (res) => {
    let data = '';

    console.log(`📊 Status Code: ${res.statusCode}`);
    console.log(`📋 Content-Type: ${res.headers['content-type']}\n`);

    res.on('data', (chunk) => {
        data += chunk;
        process.stdout.write('.'); // Indicador de progresso
    });

    res.on('end', () => {
        const duration = ((Date.now() - startTime) / 1000).toFixed(2);
        console.log('\n\n✅ Resposta recebida!');
        console.log(`⏱️ Tempo total: ${duration}s\n`);
        
        try {
            const json = JSON.parse(data);
            console.log('📄 Resposta da API:');
            console.log(JSON.stringify(json, null, 2));
            
            // Verificações críticas
            console.log('\n' + '='.repeat(80));
            console.log('🔍 VERIFICAÇÕES:');
            console.log('='.repeat(80));
            
            const responseStr = JSON.stringify(json).toLowerCase();
            
            // Verificar se há menção a segmentos
            if (responseStr.includes('segmento')) {
                console.log('❌ PROBLEMA: A resposta contém menção a "segmento"!');
                console.log('   Isso indica que segmentos podem estar sendo sincronizados.');
            } else {
                console.log('✅ OK: Nenhuma menção a segmentos na resposta');
            }
            
            // Verificar se há dados de oportunidades
            if (json.data?.oportunidades || json.oportunidades || json.totalProcessed) {
                console.log('✅ OK: Resposta contém dados de oportunidades');
                
                const oportunidades = json.data?.oportunidades || json.oportunidades || json;
                if (oportunidades.totalProcessed || oportunidades.processed || oportunidades.total) {
                    const total = oportunidades.totalProcessed || oportunidades.processed || oportunidades.total || 0;
                    console.log(`   📊 Total processado: ${total}`);
                }
            } else {
                console.log('⚠️ AVISO: Não encontrou dados de oportunidades na resposta');
            }
            
            // Verificar se há sucesso
            if (json.success === true || json.success === false) {
                console.log(`✅ OK: Campo 'success' presente: ${json.success}`);
            }
            
            // Verificar se há alreadyRunning
            if (json.alreadyRunning || json.data?.alreadyRunning) {
                console.log('⚠️ AVISO: Sincronização já está em andamento');
            }
            
            console.log('='.repeat(80));
            
        } catch (e) {
            console.log('\n📄 Resposta (texto - não é JSON):');
            console.log(data.substring(0, 500)); // Primeiros 500 caracteres
            console.log('\n⚠️ A resposta não é um JSON válido');
        }
    });
});

req.on('error', (error) => {
    console.error('\n❌ Erro ao conectar:', error.message);
    console.error('\n💡 Possíveis causas:');
    console.error('   - API não está acessível');
    console.error('   - Problema de rede');
    console.error('   - Firewall bloqueando');
});

req.on('timeout', () => {
    console.error('\n⏱️ Timeout: A requisição demorou mais de 5 minutos');
    console.error('   Isso pode indicar que a sincronização está demorando muito');
    req.destroy();
});

req.end();


