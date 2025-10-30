const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const SUPABASE_CONFIG = {
    url: process.env.VITE_SUPABASE_URL,
    serviceRoleKey: process.env.VITE_SUPABASE_SERVICE_ROLE_KEY
};

const supabase = createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.serviceRoleKey, {
    db: { schema: 'api' }
});

const TABELAS = [
    'prime_clientes',
    'prime_pedidos',
    'prime_rastreabilidade',
    'prime_tipos_processo',
    'prime_formulas',
    'prime_formulas_itens'
];

async function verificarTabela(nomeTabela) {
    console.log(`\n🔍 VERIFICANDO: ${nomeTabela}`);
    console.log('='.repeat(80));
    
    try {
        // 1) Total de registros
        const { count: total, error: error1 } = await supabase
            .from(nomeTabela)
            .select('*', { count: 'exact', head: true });
        
        if (error1) {
            console.log(`   ❌ Erro ao contar registros: ${error1.message}`);
            return;
        }
        
        console.log(`   📊 Total de registros: ${total}`);
        
        // 2) Última inserção
        const { data: ultimaInsercao, error: error2 } = await supabase
            .from(nomeTabela)
            .select('created_at')
            .order('created_at', { ascending: false })
            .limit(1);
        
        if (!error2 && ultimaInsercao && ultimaInsercao.length > 0) {
            const ultima = new Date(ultimaInsercao[0].created_at);
            const agora = new Date();
            const horasDiferenca = Math.floor((agora - ultima) / (1000 * 60 * 60));
            const diasDiferenca = Math.floor(horasDiferenca / 24);
            
            console.log(`   📅 Última inserção: ${ultima.toLocaleString('pt-BR')}`);
            console.log(`   ⏰ Tempo desde última inserção: ${horasDiferenca}h (${diasDiferenca} dias)`);
            
            if (horasDiferenca > 24) {
                console.log(`   ⚠️ ALERTA: Não há inserções há mais de 24 horas!`);
            } else {
                console.log(`   ✅ Inserções recentes detectadas`);
            }
        } else {
            console.log(`   ⚠️ Não foi possível obter última inserção`);
        }
        
        // 3) Registros nas últimas 24h
        const { count: count24h, error: error3 } = await supabase
            .from(nomeTabela)
            .select('*', { count: 'exact', head: true })
            .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());
        
        if (!error3) {
            console.log(`   📊 Registros nas últimas 24h: ${count24h}`);
            if (count24h === 0) {
                console.log(`   ⚠️ ALERTA: Nenhum registro inserido nas últimas 24 horas!`);
            } else {
                console.log(`   ✅ Sincronização ativa`);
            }
        }
        
        // 4) Última atualização
        const { data: ultimaAtualizacao, error: error4 } = await supabase
            .from(nomeTabela)
            .select('updated_at')
            .not('updated_at', 'is', null)
            .order('updated_at', { ascending: false })
            .limit(1);
        
        if (!error4 && ultimaAtualizacao && ultimaAtualizacao.length > 0) {
            const ultima = new Date(ultimaAtualizacao[0].updated_at);
            const agora = new Date();
            const horasDiferenca = Math.floor((agora - ultima) / (1000 * 60 * 60));
            
            console.log(`   📅 Última atualização: ${ultima.toLocaleString('pt-BR')}`);
            console.log(`   ⏰ Tempo desde última atualização: ${horasDiferenca}h`);
        }
        
    } catch (error) {
        console.log(`   ❌ Erro ao verificar tabela: ${error.message}`);
    }
}

async function verificarTodasTabelas() {
    console.log('🔍 VERIFICANDO TODAS AS TABELAS PRIME_*...\n');
    console.log('📊 Total de tabelas a verificar: ' + TABELAS.length);
    console.log('='.repeat(80));
    
    const resultados = {
        atualizadas: [],
        desatualizadas: [],
        erros: []
    };
    
    for (const tabela of TABELAS) {
        await verificarTabela(tabela);
        
        // Verificar se está atualizada (últimas 24h)
        try {
            const { count: count24h } = await supabase
                .from(tabela)
                .select('*', { count: 'exact', head: true })
                .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());
            
            if (count24h > 0) {
                resultados.atualizadas.push(tabela);
            } else {
                resultados.desatualizadas.push(tabela);
            }
        } catch (error) {
            resultados.erros.push(tabela);
        }
    }
    
    // Resumo final
    console.log('\n' + '='.repeat(80));
    console.log('📊 RESUMO GERAL:');
    console.log('='.repeat(80));
    
    console.log(`\n✅ TABELAS ATUALIZADAS (inserções nas últimas 24h): ${resultados.atualizadas.length}`);
    if (resultados.atualizadas.length > 0) {
        resultados.atualizadas.forEach(tabela => console.log(`   - ${tabela}`));
    }
    
    console.log(`\n❌ TABELAS DESATUALIZADAS (sem inserções nas últimas 24h): ${resultados.desatualizadas.length}`);
    if (resultados.desatualizadas.length > 0) {
        resultados.desatualizadas.forEach(tabela => console.log(`   - ${tabela}`));
    }
    
    if (resultados.erros.length > 0) {
        console.log(`\n⚠️ TABELAS COM ERRO: ${resultados.erros.length}`);
        resultados.erros.forEach(tabela => console.log(`   - ${tabela}`));
    }
    
    console.log('\n' + '='.repeat(80));
    console.log('🎯 DIAGNÓSTICO:');
    console.log('='.repeat(80));
    
    if (resultados.desatualizadas.length > 0) {
        console.log('\n❌ PROBLEMA DETECTADO:');
        console.log(`   ${resultados.desatualizadas.length} tabelas NÃO estão sendo sincronizadas!`);
        console.log('\n🔧 AÇÕES NECESSÁRIAS:');
        console.log('   1. Verificar script de sincronização no Portainer');
        console.log('   2. Verificar se o cronjob inclui TODAS as tabelas');
        console.log('   3. Reiniciar o serviço de sincronização');
        console.log('   4. Verificar logs do container para erros');
    } else {
        console.log('\n✅ TUDO OK: Todas as tabelas estão sendo sincronizadas!');
    }
    
    console.log('\n📁 PRÓXIMOS PASSOS:');
    console.log('   1. Acesse o Portainer: https://portainer.oficialmed.com.br');
    console.log('   2. Procure pelo serviço: prime-sync-api-cron');
    console.log('   3. Verifique os logs do container');
    console.log('   4. Verifique o script de sincronização');
    console.log('');
}

verificarTodasTabelas();

