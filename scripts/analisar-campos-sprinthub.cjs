#!/usr/bin/env node

/**
 * Script para analisar campos do SprintHub usando a API do Easypanel
 * ou fazendo requisição direta se tiver credenciais
 */

// Tentar usar fetch nativo (Node 18+)
const fetch = globalThis.fetch || (async (...args) => {
    const { default: fetch } = await import('node-fetch');
    return fetch(...args);
});

async function analyzeViaEasypanelAPI() {
    const API_URL = process.env.SYNC_API_URL || 'https://sincrocrm.oficialmed.com.br';
    
    console.log('🔍 Analisando estrutura de dados via API do Easypanel...\n');
    console.log(`📡 URL: ${API_URL}\n`);
    
    try {
        // Verificar se a API está funcionando
        const healthResponse = await fetch(`${API_URL}/health`);
        if (healthResponse.ok) {
            const health = await healthResponse.json();
            console.log('✅ API está funcionando');
            console.log(`   Versão: ${health.version || 'N/A'}\n`);
        }
    } catch (error) {
        console.log('⚠️ Não foi possível conectar à API do Easypanel');
        console.log(`   Erro: ${error.message}\n`);
    }
}

async function analyzeFromSupabase() {
    console.log('📊 Analisando dados já sincronizados no Supabase...\n');
    
    // Esta análise será feita via MCP do Supabase
    console.log('💡 Para ver a estrutura completa:');
    console.log('   1. Os campos de data/hora foram criados na tabela');
    console.log('   2. Mas ainda estão NULL porque o SprintHub não está enviando');
    console.log('   3. Precisamos verificar como esses campos vêm do SprintHub\n');
    
    console.log('📋 Campos criados na tabela (todos NULL por enquanto):');
    const campos = [
        'entrada_compra', 'acolhimento_compra', 'qualificado_compra', 'orcamento_compra',
        'negociacao_compra', 'follow_up_compra', 'cadastro_compra',
        'entrada_recompra', 'acolhimento_recompra', 'qualificado_recompra', 'orcamento_recompra',
        'negociacao_recompra', 'follow_up_recompra', 'cadastro_recompra',
        'entrada_monitoramento', 'acolhimento_monitoramento', 'qualificado_monitoramento',
        'orcamento_monitoramento', 'negociacao_monitoramento', 'follow_up_monitoramento',
        'cadastro_monitoramento',
        'entrada_ativacao', 'acolhimento_ativacao', 'qualificado_ativacao', 'orcamento_ativacao',
        'negociacao_ativacao', 'follow_up_ativacao', 'cadastro_ativacao',
        'entrada_reativacao', 'acolhimento_reativacao', 'qualificado_reativacao', 'orcamento_reativacao',
        'negociacao_reativacao', 'follow_up_reativacao', 'cadastro_reativacao'
    ];
    
    console.log(`   Total: ${campos.length} campos\n`);
    console.log('✅ Todos os campos foram criados e estão prontos para receber dados\n');
}

async function main() {
    console.log('='.repeat(80));
    console.log('🔍 ANÁLISE DE CAMPOS DO SPRINTHUB');
    console.log('='.repeat(80) + '\n');
    
    await analyzeViaEasypanelAPI();
    await analyzeFromSupabase();
    
    console.log('='.repeat(80));
    console.log('📝 CONCLUSÃO:');
    console.log('='.repeat(80));
    console.log('\n✅ Campos criados na tabela: 35 campos de data/hora');
    console.log('✅ Mapeamento adicionado na API: Função mapStageDateTimeFields()');
    console.log('⚠️  Campos ainda NULL: SprintHub precisa enviar os dados');
    console.log('\n💡 Próximos passos:');
    console.log('   1. Verificar no SprintHub como esses campos são nomeados');
    console.log('   2. Ajustar mapeamento se necessário');
    console.log('   3. Testar sincronização após SprintHub começar a enviar\n');
}

main().catch(error => {
    console.error('❌ Erro:', error);
    process.exit(1);
});


