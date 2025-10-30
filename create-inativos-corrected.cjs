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
        const camposExistentes = Object.keys(clientes[0] || {});
        console.log('Campos disponíveis:', camposExistentes);
        
        // 2. Verificar se já existem os campos de controle
        const temExportadoReativacao = camposExistentes.includes('exportado_reativacao');
        const temDataExportacao = camposExistentes.includes('data_exportacao_reativacao');
        
        console.log(`📊 Campo exportado_reativacao existe: ${temExportadoReativacao}`);
        console.log(`📊 Campo data_exportacao_reativacao existe: ${temDataExportacao}`);
        
        // 3. Buscar clientes ativos (usando campo 'ativo' em vez de 'status')
        console.log('\n📊 Buscando clientes ativos...');
        
        const { data: clientesAtivos, error: ativosError } = await supabase
            .from('prime_clientes')
            .select('id, nome, email, telefone, cpf_cnpj, data_nascimento, primeira_compra, ultima_compra, ativo, created_at')
            .eq('ativo', true)
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
            const dataA = a.ultima_compra || a.primeira_compra || a.created_at;
            const dataB = b.ultima_compra || b.primeira_compra || b.created_at;
            return new Date(dataA) - new Date(dataB);
        });
        
        console.log('\n🔍 Top 10 clientes inativos mais antigos:');
        clientesInativosOrdenados.slice(0, 10).forEach((cliente, index) => {
            const dataReferencia = cliente.ultima_compra || cliente.primeira_compra || cliente.created_at;
            const diasSemCompra = Math.floor((new Date() - new Date(dataReferencia)) / (1000 * 60 * 60 * 24));
            console.log(`${index + 1}. ${cliente.nome} - ${cliente.email} - ${diasSemCompra} dias sem compra`);
        });
        
        // 7. Criar função para exportar clientes inativos
        console.log('\n📊 Criando função de exportação...');
        
        // Simular exportação de 200 clientes
        const clientesParaExportar = clientesInativosOrdenados.slice(0, 200);
        
        console.log(`\n📋 EXPORTAÇÃO DE 200 CLIENTES INATIVOS:`);
        console.log('='.repeat(50));
        
        clientesParaExportar.forEach((cliente, index) => {
            const dataReferencia = cliente.ultima_compra || cliente.primeira_compra || cliente.created_at;
            const diasSemCompra = Math.floor((new Date() - new Date(dataReferencia)) / (1000 * 60 * 60 * 24));
            console.log(`${index + 1}. ID: ${cliente.id}`);
            console.log(`   Nome: ${cliente.nome}`);
            console.log(`   Email: ${cliente.email}`);
            console.log(`   Telefone: ${cliente.telefone}`);
            console.log(`   CPF/CNPJ: ${cliente.cpf_cnpj}`);
            console.log(`   Dias sem compra: ${diasSemCompra}`);
            console.log(`   Data cadastro: ${cliente.created_at}`);
            console.log(`   Primeira compra: ${cliente.primeira_compra || 'Nunca'}`);
            console.log(`   Última compra: ${cliente.ultima_compra || 'Nunca'}`);
            console.log('-'.repeat(30));
        });
        
        // 8. Criar script SQL para implementar o sistema completo
        console.log('\n📊 Gerando script SQL para implementação...');
        
        const sqlScript = `
-- 1. Adicionar campos de controle
ALTER TABLE api.prime_clientes 
ADD COLUMN IF NOT EXISTS exportado_reativacao BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS data_exportacao_reativacao TIMESTAMP WITH TIME ZONE;

-- 2. Criar view de clientes inativos
CREATE OR REPLACE VIEW api.inativos AS
SELECT 
    pc.id,
    pc.nome,
    pc.email,
    pc.telefone,
    pc.cpf_cnpj,
    pc.data_nascimento,
    pc.primeira_compra,
    pc.ultima_compra,
    pc.created_at,
    pc.exportado_reativacao,
    pc.data_exportacao_reativacao,
    -- Calcular dias desde última compra
    CASE 
        WHEN pc.ultima_compra IS NOT NULL THEN 
            EXTRACT(DAYS FROM NOW() - pc.ultima_compra)
        WHEN pc.primeira_compra IS NOT NULL THEN 
            EXTRACT(DAYS FROM NOW() - pc.primeira_compra)
        ELSE 
            EXTRACT(DAYS FROM NOW() - pc.created_at)
    END as dias_sem_compra
FROM api.prime_clientes pc
LEFT JOIN (
    SELECT 
        cliente_id,
        COUNT(*) as total_pedidos
    FROM api.prime_pedidos 
    WHERE status = 'aprovado'
    GROUP BY cliente_id
) pedidos_aprovados ON pc.id = pedidos_aprovados.cliente_id
WHERE 
    -- Cliente ativo
    pc.ativo = true
    -- Sem pedidos aprovados
    AND (pedidos_aprovados.total_pedidos IS NULL OR pedidos_aprovados.total_pedidos = 0)
    -- Não foi exportado para reativação ainda
    AND (pc.exportado_reativacao IS NULL OR pc.exportado_reativacao = FALSE)
ORDER BY 
    -- Ordenar pelos mais antigos primeiro
    CASE 
        WHEN pc.ultima_compra IS NOT NULL THEN pc.ultima_compra
        WHEN pc.primeira_compra IS NOT NULL THEN pc.primeira_compra
        ELSE pc.created_at
    END ASC;

-- 3. Função para exportar clientes inativos
CREATE OR REPLACE FUNCTION api.exportar_clientes_inativos(
    quantidade INTEGER DEFAULT 100
)
RETURNS TABLE (
    id BIGINT,
    nome TEXT,
    email TEXT,
    telefone TEXT,
    cpf_cnpj TEXT,
    data_nascimento DATE,
    primeira_compra TIMESTAMP WITH TIME ZONE,
    ultima_compra TIMESTAMP WITH TIME ZONE,
    dias_sem_compra BIGINT
) AS $$
BEGIN
    -- Marcar clientes como exportados
    UPDATE api.prime_clientes 
    SET 
        exportado_reativacao = TRUE,
        data_exportacao_reativacao = NOW()
    WHERE id IN (
        SELECT pc.id 
        FROM api.prime_clientes pc
        LEFT JOIN (
            SELECT 
                cliente_id,
                COUNT(*) as total_pedidos
            FROM api.prime_pedidos 
            WHERE status = 'aprovado'
            GROUP BY cliente_id
        ) pedidos_aprovados ON pc.id = pedidos_aprovados.cliente_id
        WHERE 
            pc.ativo = true
            AND (pedidos_aprovados.total_pedidos IS NULL OR pedidos_aprovados.total_pedidos = 0)
            AND (pc.exportado_reativacao IS NULL OR pc.exportado_reativacao = FALSE)
        ORDER BY 
            CASE 
                WHEN pc.ultima_compra IS NOT NULL THEN pc.ultima_compra
                WHEN pc.primeira_compra IS NOT NULL THEN pc.primeira_compra
                ELSE pc.created_at
            END ASC
        LIMIT quantidade
    );
    
    -- Retornar os clientes exportados
    RETURN QUERY
    SELECT 
        pc.id,
        pc.nome,
        pc.email,
        pc.telefone,
        pc.cpf_cnpj,
        pc.data_nascimento,
        pc.primeira_compra,
        pc.ultima_compra,
        CASE 
            WHEN pc.ultima_compra IS NOT NULL THEN 
                EXTRACT(DAYS FROM NOW() - pc.ultima_compra)
            WHEN pc.primeira_compra IS NOT NULL THEN 
                EXTRACT(DAYS FROM NOW() - pc.primeira_compra)
            ELSE 
                EXTRACT(DAYS FROM NOW() - pc.created_at)
        END as dias_sem_compra
    FROM api.prime_clientes pc
    WHERE 
        pc.exportado_reativacao = TRUE
        AND pc.data_exportacao_reativacao >= NOW() - INTERVAL '1 minute'
    ORDER BY pc.data_exportacao_reativacao DESC;
END;
$$ LANGUAGE plpgsql;
        `;
        
        console.log('\n📋 SCRIPT SQL GERADO:');
        console.log('='.repeat(50));
        console.log(sqlScript);
        console.log('='.repeat(50));
        
        console.log('\n🎉 SISTEMA DE CLIENTES INATIVOS CRIADO!');
        console.log('\n📋 PRÓXIMOS PASSOS:');
        console.log('1. Executar o script SQL acima no Supabase');
        console.log('2. Usar: SELECT * FROM api.inativos LIMIT 100;');
        console.log('3. Exportar: SELECT * FROM api.exportar_clientes_inativos(200);');
        console.log('4. Ver estatísticas: SELECT COUNT(*) FROM api.inativos;');
        
    } catch (error) {
        console.error('❌ Erro geral:', error.message);
    }
}

createInativosSystem();

