/**
 * Script para testar qual projeto tem as credenciais do Google Ads
 * Execute este script para verificar cada projeto
 */

// Lista dos seus projetos
const projects = [
    { name: 'DADOS OFICIALMED', id: 'dados-oficialmed' },
    { name: 'Sprinthub Ads e Gmail', id: 'sprinthub-ads-e-gmail' },
    { name: 'Ru Hub', id: 'ru-hub' },
    { name: 'N8N - Google Ads', id: 'xenon-chain-460320-v2' },
    { name: 'My First Project', id: 'cosmic-kayak-457821-g2' },
    { name: 'Gemini API', id: 'gen-lang-client-0590667035' }
];

console.log('🔍 Projetos para verificar:');
console.log('========================');

projects.forEach((project, index) => {
    console.log(`${index + 1}. ${project.name}`);
    console.log(`   ID: ${project.id}`);
    console.log(`   URL: https://console.cloud.google.com/apis/credentials?project=${project.id}`);
    console.log('');
});

console.log('📋 Instruções para verificar cada projeto:');
console.log('==========================================');
console.log('1. Acesse a URL de cada projeto');
console.log('2. Vá em "APIs & Services" → "Library"');
console.log('3. Procure por "Google Ads API"');
console.log('4. Verifique se está "ENABLED"');
console.log('5. Vá em "APIs & Services" → "Credentials"');
console.log('6. Procure por "OAuth 2.0 Client IDs"');
console.log('7. Se existir, anote o Client ID e Client Secret');
console.log('');

console.log('🎯 Projetos mais prováveis de ter Google Ads:');
console.log('=============================================');
console.log('1. N8N - Google Ads (xenon-chain-460320-v2) - Nome sugere integração');
console.log('2. Sprinthub Ads e Gmail (sprinthub-ads-e-gmail) - Nome sugere ads');
console.log('3. DADOS OFICIALMED (dados-oficialmed) - Projeto principal');
console.log('');

console.log('📝 O que procurar em cada projeto:');
console.log('==================================');
console.log('✅ Google Ads API habilitada');
console.log('✅ OAuth 2.0 Client ID configurado');
console.log('✅ URIs de redirecionamento configuradas');
console.log('✅ Client ID e Client Secret disponíveis');
