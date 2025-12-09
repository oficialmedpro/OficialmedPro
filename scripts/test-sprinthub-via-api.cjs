#!/usr/bin/env node

/**
 * Script para testar a estrutura dos dados do SprintHub
 * Usa a API do Easypanel que já tem as credenciais configuradas
 */

// Usar fetch nativo do Node 18+ ou global fetch
const fetch = globalThis.fetch || require('node-fetch');

// URL da API do Easypanel (ajustar conforme necessário)
const API_BASE_URL = process.env.SYNC_API_URL || 'https://sincrocrm.oficialmed.com.br';

async function fetchOpportunitySample() {
    console.log('🔍 Buscando amostra de oportunidades via API do Easypanel...\n');
    console.log(`📡 URL: ${API_BASE_URL}/sync/oportunidades\n`);
    
    try {
        // Fazer uma requisição para buscar apenas algumas oportunidades
        // Vamos usar o endpoint de status primeiro para ver se a API está funcionando
        const healthResponse = await fetch(`${API_BASE_URL}/health`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json'
            }
        });
        
        if (!healthResponse.ok) {
            throw new Error(`API não está respondendo: HTTP ${healthResponse.status}`);
        }
        
        const health = await healthResponse.json();
        console.log('✅ API está funcionando');
        console.log(`   Versão: ${health.version || 'N/A'}`);
        console.log(`   Status: ${health.status || 'N/A'}\n`);
        
        // Agora vamos fazer uma análise baseada nos dados que já estão no Supabase
        // para ver a estrutura dos campos
        console.log('💡 Dica: Para ver a estrutura completa dos dados do SprintHub,');
        console.log('   execute uma sincronização e depois analise os dados no Supabase.\n');
        console.log('   Ou configure as variáveis de ambiente:');
        console.log('   - SPRINTHUB_TOKEN ou VITE_SPRINTHUB_API_TOKEN');
        console.log('   - SPRINTHUB_BASE_URL ou VITE_SPRINTHUB_BASE_URL');
        console.log('   - SPRINTHUB_INSTANCE ou VITE_SPRINTHUB_INSTANCE\n');
        
        return { success: true, message: 'API está funcionando' };
        
    } catch (error) {
        console.error('❌ Erro:', error.message);
        return { success: false, error: error.message };
    }
}

// Alternativa: analisar dados já sincronizados no Supabase
async function analyzeSyncedData() {
    console.log('\n📊 Alternativa: Analisar dados já sincronizados no Supabase\n');
    console.log('💡 Para fazer isso, você precisa:');
    console.log('   1. Executar uma sincronização via API');
    console.log('   2. Consultar a tabela api.oportunidade_sprint');
    console.log('   3. Verificar quais campos estão sendo preenchidos\n');
    console.log('   Query SQL sugerida:');
    console.log('   SELECT * FROM api.oportunidade_sprint LIMIT 1;\n');
}

async function main() {
    console.log('🔍 Análise de Estrutura de Dados do SprintHub\n');
    console.log('='.repeat(80) + '\n');
    
    const result = await fetchOpportunitySample();
    
    if (result.success) {
        await analyzeSyncedData();
    }
    
    console.log('\n' + '='.repeat(80));
    console.log('✅ Análise concluída!\n');
}

main().catch(error => {
    console.error('❌ Erro:', error);
    process.exit(1);
});

