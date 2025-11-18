const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const SUPABASE_CONFIG = {
    url: process.env.VITE_SUPABASE_URL,
    serviceRoleKey: process.env.VITE_SUPABASE_SERVICE_ROLE_KEY
};

const supabase = createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.serviceRoleKey, {
    db: { schema: 'api' }
});

async function setupAndTestInativosSystem() {
    console.log('🔧 CONFIGURANDO E TESTANDO SISTEMA DE CLIENTES INATIVOS...');
    
    try {
        // 1. Verificar se os campos já existem
        console.log('\n📊 Verificando estrutura da tabela...');
        
        const { data: sampleCliente, error: sampleError } = await supabase
            .from('prime_clientes')
            .select('*')
            .limit(1);
        
        if (sampleError) {
            console.error('❌ Erro ao verificar tabela:', sampleError.message);
            return;
        }
        
        const camposExistentes = Object.keys(sampleCliente[0] || {});
        const temExportadoReativacao = camposExistentes.includes('exportado_reativacao');
        const temDataExportacao = camposExistentes.includes('data_exportacao_reativacao');
        
        console.log(`📊 Campo exportado_reativacao existe: ${temExportadoReativacao}`);
        console.log(`📊 Campo data_exportacao_reativacao existe: ${temDataExportacao}`);
        
        if (!temExportadoReativacao || !temDataExportacao) {
            console.log('\n⚠️ Campos de controle não existem. Execute o script SQL primeiro!');
            console.log('📋 Execute o arquivo: sistema-clientes-inativos.sql');
            return;
        }
        
        // 2. Testar a view de clientes inativos
        console.log('\n📊 Testando view de clientes inativos...');
        
        const { data: inativos, error: inativosError } = await supabase
            .from('inativos')
            .select('*', { count: 'exact' })
            .limit(10);
        
        if (inativosError) {
            console.error('❌ Erro ao testar view:', inativosError.message);
            return;
        }
        
        console.log(`📊 Total de clientes inativos: ${inativos.length > 0 ? inativos[0].count : 0}`);
        
        if (inativos && inativos.length > 0) {
            console.log('\n🔍 Amostra de clientes inativos:');
            inativos.slice(0, 5).forEach((cliente, index) => {
                console.log(`${index + 1}. ${cliente.nome} - ${cliente.email} - ${cliente.dias_sem_compra} dias sem compra`);
            });
        }
        
        // 3. Testar função de estatísticas
        console.log('\n📊 Testando função de estatísticas...');
        
        const { data: stats, error: statsError } = await supabase
            .rpc('estatisticas_reativacao');
        
        if (statsError) {
            console.error('❌ Erro ao testar estatísticas:', statsError.message);
            return;
        }
        
        if (stats && stats.length > 0) {
            const stat = stats[0];
            console.log(`📊 Total de clientes inativos: ${stat.total_clientes_inativos}`);
            console.log(`📊 Clientes já exportados: ${stat.clientes_exportados}`);
            console.log(`📊 Clientes não exportados: ${stat.clientes_nao_exportados}`);
        }
        
        // 4. Testar exportação de 5 clientes
        console.log('\n📊 Testando exportação de 5 clientes...');
        
        const { data: exportados, error: exportError } = await supabase
            .rpc('exportar_clientes_inativos', { quantidade: 5 });
        
        if (exportError) {
            console.error('❌ Erro ao testar exportação:', exportError.message);
            return;
        }
        
        console.log(`📊 Clientes exportados: ${exportados.length}`);
        
        if (exportados && exportados.length > 0) {
            console.log('\n🔍 Clientes exportados:');
            exportados.forEach((cliente, index) => {
                console.log(`${index + 1}. ID: ${cliente.id} - ${cliente.nome} - ${cliente.email} - ${cliente.dias_sem_compra} dias sem compra`);
            });
        }
        
        // 5. Verificar se foram marcados como exportados
        console.log('\n📊 Verificando marcação de exportação...');
        
        const { data: marcados, error: marcadosError } = await supabase
            .from('prime_clientes')
            .select('id, nome, exportado_reativacao, data_exportacao_reativacao')
            .eq('exportado_reativacao', true)
            .limit(5);
        
        if (marcadosError) {
            console.error('❌ Erro ao verificar marcação:', marcadosError.message);
            return;
        }
        
        console.log(`📊 Clientes marcados como exportados: ${marcados.length}`);
        
        if (marcados && marcados.length > 0) {
            console.log('\n🔍 Clientes marcados:');
            marcados.forEach((cliente, index) => {
                console.log(`${index + 1}. ID: ${cliente.id} - ${cliente.nome} - Exportado: ${cliente.exportado_reativacao} - Data: ${cliente.data_exportacao_reativacao}`);
            });
        }
        
        // 6. Criar função para exportar em lotes
        console.log('\n📊 Criando função para exportar em lotes...');
        
        const exportarLote = async (quantidade = 200) => {
            console.log(`\n🔄 Exportando lote de ${quantidade} clientes...`);
            
            const { data: lote, error: loteError } = await supabase
                .rpc('exportar_clientes_inativos', { quantidade });
            
            if (loteError) {
                console.error('❌ Erro ao exportar lote:', loteError.message);
                return null;
            }
            
            console.log(`✅ Lote exportado: ${lote.length} clientes`);
            return lote;
        };
        
        // 7. Exemplo de uso do sistema
        console.log('\n🎯 SISTEMA CONFIGURADO COM SUCESSO!');
        console.log('\n📋 COMO USAR:');
        console.log('1. Ver clientes inativos: SELECT * FROM api.inativos LIMIT 100;');
        console.log('2. Exportar 200 clientes: SELECT * FROM api.exportar_clientes_inativos(200);');
        console.log('3. Ver estatísticas: SELECT * FROM api.estatisticas_reativacao();');
        console.log('4. Ver clientes exportados: SELECT * FROM api.prime_clientes WHERE exportado_reativacao = TRUE;');
        
        console.log('\n🚀 PRÓXIMOS PASSOS:');
        console.log('1. Execute o script SQL no Supabase');
        console.log('2. Use as funções para exportar clientes em lotes');
        console.log('3. Monitore o progresso com as estatísticas');
        
    } catch (error) {
        console.error('❌ Erro geral:', error.message);
    }
}

setupAndTestInativosSystem();

