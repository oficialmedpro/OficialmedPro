const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const SUPABASE_CONFIG = {
    url: process.env.VITE_SUPABASE_URL,
    serviceRoleKey: process.env.VITE_SUPABASE_SERVICE_ROLE_KEY
};

const supabase = createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.serviceRoleKey, {
    db: { schema: 'api' }
});

async function verificarCronjobPrimeSync() {
    console.log('🔍 VERIFICANDO CRONJOB prime-sync-api-cron...\n');
    
    try {
        // 1) Verificar últimas inserções
        console.log('1️⃣ Verificando últimas inserções na tabela prime_clientes...');
        const { data: ultimaInsercao, error: error1 } = await supabase
            .from('prime_clientes')
            .select('created_at')
            .order('created_at', { ascending: false })
            .limit(1);
        
        if (!error1 && ultimaInsercao && ultimaInsercao.length > 0) {
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
            console.log(`   ❌ Erro ao buscar última inserção: ${error1?.message}`);
        }
        console.log('');
        
        // 2) Verificar clientes nas últimas 24h
        console.log('2️⃣ Verificando clientes inseridos nas últimas 24 horas...');
        const { count: count24h, error: error2 } = await supabase
            .from('prime_clientes')
            .select('*', { count: 'exact', head: true })
            .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());
        
        if (!error2) {
            console.log(`   📊 Clientes inseridos nas últimas 24h: ${count24h}`);
            if (count24h === 0) {
                console.log(`   ⚠️ ALERTA: Nenhum cliente inserido nas últimas 24 horas!`);
            } else {
                console.log(`   ✅ Sincronização ativa`);
            }
        } else {
            console.log(`   ❌ Erro: ${error2.message}`);
        }
        console.log('');
        
        // 3) Verificar total de clientes
        console.log('3️⃣ Verificando total de clientes...');
        const { count: totalClientes, error: error3 } = await supabase
            .from('prime_clientes')
            .select('*', { count: 'exact', head: true });
        
        if (!error3) {
            console.log(`   📊 Total de clientes: ${totalClientes}`);
        } else {
            console.log(`   ❌ Erro: ${error3.message}`);
        }
        console.log('');
        
        // 4) Verificar últimas atualizações
        console.log('4️⃣ Verificando últimas atualizações...');
        const { data: ultimaAtualizacao, error: error4 } = await supabase
            .from('prime_clientes')
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
        } else {
            console.log(`   ⚠️ Nenhuma atualização encontrada ou erro: ${error4?.message}`);
        }
        console.log('');
        
        // 5) Verificar logs de sincronização
        console.log('5️⃣ Verificando logs de sincronização...');
        const { data: logs, error: error5 } = await supabase
            .from('cron_job_logs')
            .select('*')
            .or('job_name.ilike.%prime%sync%,job_name.ilike.%prime-sync%')
            .order('created_at', { ascending: false })
            .limit(5);
        
        if (!error5 && logs && logs.length > 0) {
            console.log(`   📋 Últimos ${logs.length} logs encontrados:`);
            logs.forEach((log, index) => {
                console.log(`   ${index + 1}. ${log.job_name} - ${new Date(log.created_at).toLocaleString('pt-BR')} - Status: ${log.status || 'N/A'}`);
            });
        } else if (error5) {
            console.log(`   ⚠️ Tabela cron_job_logs não encontrada ou erro: ${error5.message}`);
        } else {
            console.log(`   ⚠️ Nenhum log encontrado`);
        }
        console.log('');
        
        // 6) Verificar últimos 5 clientes inseridos
        console.log('6️⃣ Verificando últimos 5 clientes inseridos...');
        const { data: ultimosClientes, error: error6 } = await supabase
            .from('prime_clientes')
            .select('id, nome, email, telefone, created_at')
            .order('created_at', { ascending: false })
            .limit(5);
        
        if (!error6 && ultimosClientes) {
            console.log(`   📋 Últimos 5 clientes:`);
            ultimosClientes.forEach((cliente, index) => {
                console.log(`   ${index + 1}. ID: ${cliente.id} - ${cliente.nome || 'Sem nome'} - ${new Date(cliente.created_at).toLocaleString('pt-BR')}`);
            });
        } else {
            console.log(`   ❌ Erro: ${error6?.message}`);
        }
        console.log('');
        
        // 7) Resumo e diagnóstico
        console.log('=' .repeat(80));
        console.log('📊 RESUMO E DIAGNÓSTICO:');
        console.log('=' .repeat(80));
        
        if (count24h === 0) {
            console.log('❌ PROBLEMA DETECTADO:');
            console.log('   - Nenhum cliente inserido nas últimas 24 horas');
            console.log('   - O cronjob pode estar parado ou com erro');
            console.log('');
            console.log('🔧 AÇÕES RECOMENDADAS:');
            console.log('   1. Verifique os logs do container no Portainer');
            console.log('   2. Reinicie o serviço prime-sync-api-cron');
            console.log('   3. Verifique as credenciais do Firebird/Prime');
            console.log('   4. Execute: bash verificar-cronjob-portainer.sh');
        } else {
            console.log('✅ SINCRONIZAÇÃO PARECE ESTAR FUNCIONANDO');
            console.log(`   - ${count24h} clientes inseridos nas últimas 24h`);
        }
        
        console.log('');
        console.log('📁 ARQUIVOS DE VERIFICAÇÃO CRIADOS:');
        console.log('   - verificar-cronjob-prime-sync.sql (execute no Supabase)');
        console.log('   - verificar-cronjob-portainer.sh (execute no servidor)');
        console.log('   - verificar-cronjob-prime-sync.cjs (este script)');
        
    } catch (error) {
        console.error('❌ Erro geral:', error.message);
    }
}

verificarCronjobPrimeSync();

