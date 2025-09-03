/**
 * Script para verificar se a Google Ads API está habilitada
 * Execute este script no console do navegador na página do Google Cloud Console
 */

console.log('🔍 Verificando Google Ads API...');
console.log('===============================');

// Verificar se estamos na página correta
if (window.location.href.includes('console.cloud.google.com')) {
    console.log('✅ Estamos no Google Cloud Console');
    
    // Verificar se estamos na página de APIs
    if (window.location.href.includes('apis')) {
        console.log('✅ Estamos na página de APIs');
        
        // Instruções para verificar a API
        console.log('');
        console.log('📋 Próximos passos:');
        console.log('==================');
        console.log('1. Clique em "Library" no menu lateral esquerdo');
        console.log('2. Procure por "Google Ads API" na barra de busca');
        console.log('3. Verifique se está "ENABLED" ou "ENABLE"');
        console.log('');
        console.log('🔗 Link direto para a Google Ads API:');
        console.log('https://console.cloud.google.com/apis/library/googleads.googleapis.com?project=xenon-chain-460320-v2');
        
    } else {
        console.log('⚠️ Não estamos na página de APIs');
        console.log('Vá para: APIs & Services → Library');
    }
} else {
    console.log('❌ Não estamos no Google Cloud Console');
    console.log('Acesse: https://console.cloud.google.com/apis/credentials?project=xenon-chain-460320-v2');
}

console.log('');
console.log('🎯 O que procurar:');
console.log('==================');
console.log('✅ Status: "ENABLED" (Habilitado)');
console.log('✅ Botão: "MANAGE" (Gerenciar)');
console.log('');
console.log('❌ Se não estiver habilitada:');
console.log('❌ Status: "DISABLED" (Desabilitado)');
console.log('❌ Botão: "ENABLE" (Habilitar)');
