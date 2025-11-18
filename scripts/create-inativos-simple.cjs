const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const SUPABASE_CONFIG = {
    url: process.env.VITE_SUPABASE_URL,
    serviceRoleKey: process.env.VITE_SUPABASE_SERVICE_ROLE_KEY
};

const supabase = createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.serviceRoleKey, {
    db: { schema: 'api' }
});

async function createInativosSystem() {
    console.log('🔧 CRIANDO SISTEMA DE CLIENTES INATIVOS...');
    
    try {
        // 1. Verificar estrutura atual da tabela prime_clientes
        console.log('\n📊 Verificando estrutura da tabela prime_clientes...');
        
        const { data: clientes, error: clientesError } = await supabase
            .from('prime_clientes')
            .select('*')
            .limit(1);
        
        if (clientesError) {
            console.error('❌ Erro ao verificar tabela:', clientesError.message);
            return;
        }
        
        console.log('✅ Tabela prime_clientes acessível');
        console.log('Campos disponíveis:', Object.keys(clientes[0] || {}));
        
        // 2. Verificar se já existem os campos de controle
        const camposExistentes = Object.keys(clientes[0] || {});
        const temExportadoReativacao = camposExistentes.includes('exportado_reativacao');
        const temDataExportacao = camposExistentes.includes('data_exportacao_reativacao');
        
        console.log(`📊 Campo exportado_reativacao existe: ${temExportadoReativacao}`);
        console.log(`📊 Campo data_exportacao_reativacao existe: ${temDataExportacao}`);
        
        // 3. Buscar clientes inativos (sem pedidos aprovados)
        console.log('\n📊 Buscando clientes inativos...');
        
        // Primeiro, vamos buscar clientes ativos
        const { data: clientesAtivos, error: ativosError } = await supabase
            .from('prime_clientes')
            .select('id, nome, email, telefone, celular, whatsapp, cpf, data_cadastro, ultima_compra, status')
            .eq('status', 'ativo')
            .limit(1000);
        
        if (ativosError) {
            console.error('❌ Erro ao buscar clientes ativos:', ativosError.message);
            return;
        }
        
        console.log(`📊 Total de clientes ativos encontrados: ${clientesAtivos.length}`);
        
        // 4. Buscar pedidos aprovados
        const { data: pedidosAprovados, error: pedidosError } = await supabase
            .from('prime_pedidos')
            .select('cliente_id')
            .eq('status', 'aprovado');
        
        if (pedidosError) {
            console.error('❌ Erro ao buscar pedidos aprovados:', pedidosError.message);
            return;
        }
        
        console.log(`📊 Total de pedidos aprovados: ${pedidosAprovados.length}`);
        
        // 5. Identificar clientes inativos
        const clientesComPedidos = new Set(pedidosAprovados.map(p => p.cliente_id));
        const clientesInativos = clientesAtivos.filter(cliente => !clientesComPedidos.has(cliente.id));
        
        console.log(`📊 Clientes inativos encontrados: ${clientesInativos.length}`);
        
        // 6. Ordenar pelos mais antigos
        const clientesInativosOrdenados = clientesInativos.sort((a, b) => {
            const dataA = a.ultima_compra || a.data_cadastro;
            const dataB = b.ultima_compra || b.data_cadastro;
            return new Date(dataA) - new Date(dataB);
        });
        
        console.log('\n🔍 Top 10 clientes inativos mais antigos:');
        clientesInativosOrdenados.slice(0, 10).forEach((cliente, index) => {
            const diasSemCompra = Math.floor((new Date() - new Date(cliente.ultima_compra || cliente.data_cadastro)) / (1000 * 60 * 60 * 24));
            console.log(`${index + 1}. ${cliente.nome} - ${cliente.email} - ${diasSemCompra} dias sem compra`);
        });
        
        // 7. Criar função para exportar clientes inativos
        console.log('\n📊 Criando função de exportação...');
        
        // Simular exportação de 200 clientes
        const clientesParaExportar = clientesInativosOrdenados.slice(0, 200);
        
        console.log(`\n📋 EXPORTAÇÃO DE 200 CLIENTES INATIVOS:`);
        console.log('='.repeat(50));
        
        clientesParaExportar.forEach((cliente, index) => {
            const diasSemCompra = Math.floor((new Date() - new Date(cliente.ultima_compra || cliente.data_cadastro)) / (1000 * 60 * 60 * 24));
            console.log(`${index + 1}. ID: ${cliente.id}`);
            console.log(`   Nome: ${cliente.nome}`);
            console.log(`   Email: ${cliente.email}`);
            console.log(`   Telefone: ${cliente.telefone || cliente.celular || cliente.whatsapp}`);
            console.log(`   CPF: ${cliente.cpf}`);
            console.log(`   Dias sem compra: ${diasSemCompra}`);
            console.log(`   Data cadastro: ${cliente.data_cadastro}`);
            console.log(`   Última compra: ${cliente.ultima_compra || 'Nunca'}`);
            console.log('-'.repeat(30));
        });
        
        console.log('\n🎉 SISTEMA DE CLIENTES INATIVOS CRIADO!');
        console.log('\n📋 PRÓXIMOS PASSOS:');
        console.log('1. Adicionar campos de controle na tabela prime_clientes');
        console.log('2. Criar view api.inativos');
        console.log('3. Criar função de exportação');
        console.log('4. Implementar sistema de marcação');
        
    } catch (error) {
        console.error('❌ Erro geral:', error.message);
    }
}

createInativosSystem();

