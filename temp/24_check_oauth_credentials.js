/**
 * Script para verificar credenciais OAuth2 no Google Cloud Console
 * Execute este script no console do navegador na página de Credentials
 */

console.log('🔍 Verificando credenciais OAuth2...');
console.log('===================================');

// Verificar se estamos na página correta
if (window.location.href.includes('console.cloud.google.com/apis/credentials')) {
    console.log('✅ Estamos na página de Credentials');
    
    // Instruções para verificar OAuth2
    console.log('');
    console.log('📋 O que procurar:');
    console.log('==================');
    console.log('1. Procure por "OAuth 2.0 Client IDs"');
    console.log('2. Se existir, clique no nome do cliente');
    console.log('3. Anote o Client ID e Client Secret');
    console.log('');
    console.log('🔗 Link direto para Credentials:');
    console.log('https://console.cloud.google.com/apis/credentials?project=xenon-chain-460320-v2');
    
} else {
    console.log('❌ Não estamos na página de Credentials');
    console.log('Acesse: https://console.cloud.google.com/apis/credentials?project=xenon-chain-460320-v2');
}

console.log('');
console.log('🎯 O que você deve ver:');
console.log('=======================');
console.log('✅ Seção "OAuth 2.0 Client IDs"');
console.log('✅ Cliente com nome (ex: "Web client 1")');
console.log('✅ Client ID e Client Secret disponíveis');
console.log('');
console.log('❌ Se não existir:');
console.log('❌ Apenas "Create Credentials"');
console.log('❌ Nenhum OAuth 2.0 Client ID listado');
console.log('');
console.log('📝 Próximos passos:');
console.log('===================');
console.log('1. Se existir OAuth2: anote Client ID e Secret');
console.log('2. Se não existir: precisamos criar');
console.log('3. Depois: gerar Refresh Token');
console.log('4. Finalmente: inserir no banco de dados');
