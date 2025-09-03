/**
 * Script para gerar Refresh Token do Google Ads
 * Execute este script no console do navegador no OAuth2 Playground
 */

console.log('🔑 Gerando Refresh Token do Google Ads...');
console.log('=========================================');

// Verificar se estamos no OAuth2 Playground
if (window.location.href.includes('oauthplayground')) {
    console.log('✅ Estamos no OAuth2 Playground');
    
    console.log('');
    console.log('📋 Passos para gerar Refresh Token:');
    console.log('===================================');
    console.log('1. Clique no ícone de engrenagem (Settings)');
    console.log('2. Marque "Use your own OAuth credentials"');
    console.log('3. Insira seu Client ID');
    console.log('4. Insira seu Client Secret');
    console.log('5. Clique em "Close"');
    console.log('');
    console.log('6. No lado esquerdo, procure "Google Ads API v14"');
    console.log('7. Selecione: https://www.googleapis.com/auth/adwords');
    console.log('8. Clique em "Authorize APIs"');
    console.log('9. Faça login e autorize');
    console.log('10. Clique em "Exchange authorization code for tokens"');
    console.log('11. Copie o "Refresh token"');
    
} else {
    console.log('❌ Não estamos no OAuth2 Playground');
    console.log('Acesse: https://developers.google.com/oauthplayground/');
}

console.log('');
console.log('🎯 O que você deve ver:');
console.log('=======================');
console.log('✅ Configurações de credenciais');
console.log('✅ Escopo "https://www.googleapis.com/auth/adwords"');
console.log('✅ Botão "Authorize APIs"');
console.log('✅ Botão "Exchange authorization code for tokens"');
console.log('✅ Refresh token na resposta');
console.log('');
console.log('📝 Próximos passos:');
console.log('===================');
console.log('1. Gerar Refresh Token');
console.log('2. Obter Developer Token do Google Ads');
console.log('3. Obter Customer ID do Google Ads');
console.log('4. Inserir tudo no banco de dados');
console.log('5. Testar a conexão');
