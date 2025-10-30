const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const SUPABASE_CONFIG = {
    url: process.env.VITE_SUPABASE_URL,
    serviceRoleKey: process.env.VITE_SUPABASE_SERVICE_ROLE_KEY
};

const supabase = createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.serviceRoleKey, {
    db: { schema: 'api' }
});

async function checkRealClientesCount() {
    console.log('🔍 VERIFICANDO NÚMERO REAL DE CLIENTES...');
    
    try {
        // 1. Contar total de clientes ativos usando count
        console.log('\n📊 Contando clientes ativos...');
        const { count: totalClientes, error: clientesError } = await supabase
            .from('prime_clientes')
            .select('*', { count: 'exact' })
            .eq('ativo', true);
        
        if (clientesError) {
            console.error('❌ Erro ao contar clientes:', clientesError.message);
            return;
        }
        
        console.log(`📊 Total de clientes ativos: ${totalClientes}`);
        
        // 2. Contar total de pedidos aprovados
        console.log('\n📊 Contando pedidos aprovados...');
        const { count: totalPedidos, error: pedidosError } = await supabase
            .from('prime_pedidos')
            .select('*', { count: 'exact' })
            .eq('status_aprovacao', 'APROVADO');
        
        if (pedidosError) {
            console.error('❌ Erro ao contar pedidos:', pedidosError.message);
            return;
        }
        
        console.log(`📊 Total de pedidos aprovados: ${totalPedidos}`);
        
        // 3. Buscar clientes únicos com pedidos aprovados
        console.log('\n📊 Buscando clientes únicos com pedidos aprovados...');
        
        let clientesComPedidos = new Set();
        let offset = 0;
        const BATCH_SIZE = 1000;
        
        while (true) {
            const { data: batch, error: batchError } = await supabase
                .from('prime_pedidos')
                .select('cliente_id')
                .eq('status_aprovacao', 'APROVADO')
                .range(offset, offset + BATCH_SIZE - 1);
            
            if (batchError) {
                console.error('❌ Erro ao buscar batch de pedidos:', batchError.message);
                break;
            }
            
            if (!batch || batch.length === 0) {
                break;
            }
            
            batch.forEach(pedido => {
                clientesComPedidos.add(pedido.cliente_id);
            });
            
            console.log(`📦 Batch ${Math.floor(offset / BATCH_SIZE) + 1}: ${batch.length} pedidos | Clientes únicos: ${clientesComPedidos.size}`);
            offset += BATCH_SIZE;
        }
        
        console.log(`📊 Total de clientes únicos com pedidos aprovados: ${clientesComPedidos.size}`);
        
        // 4. Calcular clientes inativos
        const clientesInativos = totalClientes - clientesComPedidos.size;
        const percentualInativos = ((clientesInativos / totalClientes) * 100).toFixed(2);
        
        console.log('\n📊 RESUMO REAL:');
        console.log(`📊 Total de clientes ativos: ${totalClientes}`);
        console.log(`📊 Total de pedidos aprovados: ${totalPedidos}`);
        console.log(`📊 Clientes únicos com pedidos: ${clientesComPedidos.size}`);
        console.log(`📊 Clientes inativos: ${clientesInativos}`);
        console.log(`📊 Percentual de inativos: ${percentualInativos}%`);
        
        // 5. Estimar quantos clientes inativos temos
        console.log('\n🎯 ESTIMATIVA DE CLIENTES INATIVOS:');
        console.log(`📊 Total estimado de clientes inativos: ${clientesInativos}`);
        console.log(`📊 Lotes de 200 clientes: ${Math.ceil(clientesInativos / 200)}`);
        console.log(`📊 Lotes de 500 clientes: ${Math.ceil(clientesInativos / 500)}`);
        console.log(`📊 Lotes de 1000 clientes: ${Math.ceil(clientesInativos / 1000)}`);
        
    } catch (error) {
        console.error('❌ Erro geral:', error.message);
    }
}

checkRealClientesCount();

