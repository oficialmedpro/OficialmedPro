const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const SUPABASE_CONFIG = {
    url: process.env.VITE_SUPABASE_URL,
    serviceRoleKey: process.env.VITE_SUPABASE_SERVICE_ROLE_KEY
};

const supabase = createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.serviceRoleKey, {
    db: { schema: 'api' }
});

async function exportarPrimeiros200Clientes() {
    console.log('🚀 EXPORTANDO PRIMEIROS 200 CLIENTES INATIVOS...');
    
    try {
        // 1. Verificar se o sistema está configurado
        console.log('\n📊 Verificando se o sistema está configurado...');
        
        const { data: sampleCliente, error: sampleError } = await supabase
            .from('prime_clientes')
            .select('exportado_reativacao, data_exportacao_reativacao')
            .limit(1);
        
        if (sampleError) {
            console.error('❌ Sistema não configurado. Execute o SQL primeiro!');
            console.log('📋 Execute o arquivo: 00-configuracao-inicial.sql no Supabase');
            return;
        }
        
        console.log('✅ Sistema configurado!');
        
        // 2. Ver estatísticas antes da exportação
        console.log('\n📊 Estatísticas antes da exportação:');
        
        const { data: statsAntes, error: statsError } = await supabase
            .rpc('estatisticas_reativacao');
        
        if (!statsError && statsAntes && statsAntes.length > 0) {
            const stat = statsAntes[0];
            console.log(`📊 Total de clientes inativos: ${stat.total_clientes_inativos}`);
            console.log(`📊 Clientes já exportados: ${stat.clientes_exportados}`);
            console.log(`📊 Clientes não exportados: ${stat.clientes_nao_exportados}`);
        }
        
        // 3. Exportar 200 clientes inativos
        console.log('\n🔄 Exportando 200 clientes inativos...');
        
        const { data: clientesExportados, error: exportError } = await supabase
            .rpc('exportar_clientes_inativos', { quantidade: 200 });
        
        if (exportError) {
            console.error('❌ Erro ao exportar clientes:', exportError.message);
            return;
        }
        
        console.log(`✅ ${clientesExportados.length} clientes exportados com sucesso!`);
        
        // 4. Mostrar os clientes exportados
        console.log('\n📋 CLIENTES EXPORTADOS:');
        console.log('='.repeat(80));
        
        clientesExportados.forEach((cliente, index) => {
            console.log(`${index + 1}. ID: ${cliente.id}`);
            console.log(`   Nome: ${cliente.nome}`);
            console.log(`   Email: ${cliente.email || 'N/A'}`);
            console.log(`   Telefone: ${cliente.telefone || 'N/A'}`);
            console.log(`   CPF/CNPJ: ${cliente.cpf_cnpj || 'N/A'}`);
            console.log(`   Dias sem compra: ${cliente.dias_sem_compra}`);
            console.log(`   Data cadastro: ${cliente.created_at}`);
            console.log(`   Primeira compra: ${cliente.primeira_compra || 'Nunca'}`);
            console.log(`   Última compra: ${cliente.ultima_compra || 'Nunca'}`);
            console.log('-'.repeat(60));
        });
        
        // 5. Verificar se foram marcados como exportados
        console.log('\n📊 Verificando marcação de exportação...');
        
        const { data: marcados, error: marcadosError } = await supabase
            .from('prime_clientes')
            .select('id, nome, exportado_reativacao, data_exportacao_reativacao')
            .eq('exportado_reativacao', true)
            .order('data_exportacao_reativacao', { ascending: false })
            .limit(5);
        
        if (!marcadosError && marcados) {
            console.log(`✅ ${marcados.length} clientes marcados como exportados`);
            console.log('\n🔍 Últimos clientes marcados:');
            marcados.forEach((cliente, index) => {
                console.log(`${index + 1}. ID: ${cliente.id} - ${cliente.nome} - ${cliente.data_exportacao_reativacao}`);
            });
        }
        
        // 6. Estatísticas após exportação
        console.log('\n📊 Estatísticas após exportação:');
        
        const { data: statsDepois, error: statsDepoisError } = await supabase
            .rpc('estatisticas_reativacao');
        
        if (!statsDepoisError && statsDepois && statsDepois.length > 0) {
            const stat = statsDepois[0];
            console.log(`📊 Total de clientes inativos: ${stat.total_clientes_inativos}`);
            console.log(`📊 Clientes já exportados: ${stat.clientes_exportados}`);
            console.log(`📊 Clientes não exportados: ${stat.clientes_nao_exportados}`);
        }
        
        // 7. Salvar dados em arquivo CSV
        console.log('\n💾 Salvando dados em arquivo CSV...');
        
        const fs = require('fs');
        const csvContent = [
            'ID,Nome,Email,Telefone,CPF_CNPJ,Dias_Sem_Compra,Data_Cadastro,Primeira_Compra,Ultima_Compra',
            ...clientesExportados.map(cliente => [
                cliente.id,
                `"${cliente.nome || ''}"`,
                `"${cliente.email || ''}"`,
                `"${cliente.telefone || ''}"`,
                `"${cliente.cpf_cnpj || ''}"`,
                cliente.dias_sem_compra,
                cliente.created_at,
                cliente.primeira_compra || '',
                cliente.ultima_compra || ''
            ].join(','))
        ].join('\n');
        
        const fileName = `clientes_inativos_exportados_${new Date().toISOString().split('T')[0]}.csv`;
        fs.writeFileSync(fileName, csvContent);
        
        console.log(`✅ Dados salvos em: ${fileName}`);
        
        console.log('\n🎉 EXPORTAÇÃO CONCLUÍDA COM SUCESSO!');
        console.log(`📊 ${clientesExportados.length} clientes exportados e marcados`);
        console.log('📁 Arquivo CSV criado para uso em campanhas de reativação');
        
    } catch (error) {
        console.error('❌ Erro geral:', error.message);
    }
}

exportarPrimeiros200Clientes();

