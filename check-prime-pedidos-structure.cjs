const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const SUPABASE_CONFIG = {
    url: process.env.VITE_SUPABASE_URL,
    serviceRoleKey: process.env.VITE_SUPABASE_SERVICE_ROLE_KEY
};

const supabase = createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.serviceRoleKey, {
    db: { schema: 'api' }
});

async function checkPrimePedidosStructure() {
    console.log('🔍 VERIFICANDO ESTRUTURA DA TABELA prime_pedidos...');
    
    try {
        // 1. Verificar estrutura da tabela prime_pedidos
        const { data: pedidos, error: pedidosError } = await supabase
            .from('prime_pedidos')
            .select('*')
            .limit(1);
        
        if (pedidosError) {
            console.error('❌ Erro ao verificar tabela prime_pedidos:', pedidosError.message);
            return;
        }
        
        console.log('✅ Tabela prime_pedidos acessível');
        const camposPedidos = Object.keys(pedidos[0] || {});
        console.log('Campos disponíveis em prime_pedidos:', camposPedidos);
        
        // 2. Verificar se há campo de status ou similar
        const camposStatus = camposPedidos.filter(campo => 
            campo.toLowerCase().includes('status') || 
            campo.toLowerCase().includes('situacao') || 
            campo.toLowerCase().includes('aprovado') ||
            campo.toLowerCase().includes('entregue')
        );
        
        console.log('\n📊 Campos relacionados a status:');
        camposStatus.forEach(campo => {
            console.log(`  - ${campo}`);
        });
        
        // 3. Buscar alguns pedidos para ver os valores
        const { data: samplePedidos, error: sampleError } = await supabase
            .from('prime_pedidos')
            .select('*')
            .limit(5);
        
        if (!sampleError && samplePedidos) {
            console.log('\n🔍 Amostra de pedidos:');
            samplePedidos.forEach((pedido, index) => {
                console.log(`\nPedido ${index + 1}:`);
                Object.entries(pedido).forEach(([key, value]) => {
                    if (camposStatus.includes(key)) {
                        console.log(`  ${key}: ${value}`);
                    }
                });
            });
        }
        
        // 4. Verificar se há campo cliente_id
        const temClienteId = camposPedidos.includes('cliente_id');
        console.log(`\n📊 Campo cliente_id existe: ${temClienteId}`);
        
        if (temClienteId) {
            // 5. Contar pedidos por cliente
            const { data: pedidosPorCliente, error: countError } = await supabase
                .from('prime_pedidos')
                .select('cliente_id')
                .limit(100);
            
            if (!countError && pedidosPorCliente) {
                const clientesComPedidos = new Set(pedidosPorCliente.map(p => p.cliente_id));
                console.log(`📊 Clientes únicos com pedidos (amostra de 100): ${clientesComPedidos.size}`);
            }
        }
        
    } catch (error) {
        console.error('❌ Erro geral:', error.message);
    }
}

checkPrimePedidosStructure();

