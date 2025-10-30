const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const SUPABASE_CONFIG = {
    url: process.env.VITE_SUPABASE_URL,
    serviceRoleKey: process.env.VITE_SUPABASE_SERVICE_ROLE_KEY
};

const supabase = createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.serviceRoleKey, {
    db: { schema: 'api' }
});

async function setupInativosSystem() {
    console.log('🔧 CONFIGURANDO SISTEMA DE CLIENTES INATIVOS...');
    
    try {
        // 1. Adicionar campos para controle de exportação
        console.log('\n📊 Adicionando campos de controle de exportação...');
        
        const { error: alterError } = await supabase.rpc('exec_sql', {
            sql: `
                ALTER TABLE api.prime_clientes 
                ADD COLUMN IF NOT EXISTS exportado_reativacao BOOLEAN DEFAULT FALSE,
                ADD COLUMN IF NOT EXISTS data_exportacao_reativacao TIMESTAMP WITH TIME ZONE;
            `
        });
        
        if (alterError) {
            console.error('❌ Erro ao adicionar campos:', alterError.message);
            return;
        }
        
        console.log('✅ Campos adicionados com sucesso!');
        
        // 2. Criar view de clientes inativos
        console.log('\n📊 Criando view de clientes inativos...');
        
        const { error: viewError } = await supabase.rpc('exec_sql', {
            sql: `
                CREATE OR REPLACE VIEW api.inativos AS
                SELECT 
                    pc.id,
                    pc.nome,
                    pc.email,
                    pc.telefone,
                    pc.celular,
                    pc.whatsapp,
                    pc.cpf,
                    pc.data_cadastro,
                    pc.ultima_compra,
                    pc.status,
                    pc.exportado_reativacao,
                    pc.data_exportacao_reativacao,
                    -- Contar pedidos aprovados
                    COALESCE(pedidos_aprovados.total_pedidos, 0) as total_pedidos_aprovados,
                    -- Calcular dias desde última compra
                    CASE 
                        WHEN pc.ultima_compra IS NOT NULL THEN 
                            EXTRACT(DAYS FROM NOW() - pc.ultima_compra)
                        ELSE 
                            EXTRACT(DAYS FROM NOW() - pc.data_cadastro)
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
                    pc.status = 'ativo'
                    -- Sem pedidos aprovados
                    AND (pedidos_aprovados.total_pedidos IS NULL OR pedidos_aprovados.total_pedidos = 0)
                    -- Não foi exportado para reativação ainda
                    AND (pc.exportado_reativacao IS NULL OR pc.exportado_reativacao = FALSE)
                ORDER BY 
                    -- Ordenar pelos mais antigos primeiro
                    CASE 
                        WHEN pc.ultima_compra IS NOT NULL THEN pc.ultima_compra
                        ELSE pc.data_cadastro
                    END ASC;
            `
        });
        
        if (viewError) {
            console.error('❌ Erro ao criar view:', viewError.message);
            return;
        }
        
        console.log('✅ View criada com sucesso!');
        
        // 3. Criar função para exportar clientes
        console.log('\n📊 Criando função de exportação...');
        
        const { error: functionError } = await supabase.rpc('exec_sql', {
            sql: `
                CREATE OR REPLACE FUNCTION api.exportar_clientes_inativos(
                    quantidade INTEGER DEFAULT 100
                )
                RETURNS TABLE (
                    id BIGINT,
                    nome TEXT,
                    email TEXT,
                    telefone TEXT,
                    celular TEXT,
                    whatsapp TEXT,
                    cpf TEXT,
                    data_cadastro TIMESTAMP WITH TIME ZONE,
                    ultima_compra TIMESTAMP WITH TIME ZONE,
                    dias_sem_compra BIGINT
                ) AS $$
                BEGIN
                    -- Marcar clientes como exportados e retornar os dados
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
                            pc.status = 'ativo'
                            AND (pedidos_aprovados.total_pedidos IS NULL OR pedidos_aprovados.total_pedidos = 0)
                            AND (pc.exportado_reativacao IS NULL OR pc.exportado_reativacao = FALSE)
                        ORDER BY 
                            CASE 
                                WHEN pc.ultima_compra IS NOT NULL THEN pc.ultima_compra
                                ELSE pc.data_cadastro
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
                        pc.celular,
                        pc.whatsapp,
                        pc.cpf,
                        pc.data_cadastro,
                        pc.ultima_compra,
                        CASE 
                            WHEN pc.ultima_compra IS NOT NULL THEN 
                                EXTRACT(DAYS FROM NOW() - pc.ultima_compra)
                            ELSE 
                                EXTRACT(DAYS FROM NOW() - pc.data_cadastro)
                        END as dias_sem_compra
                    FROM api.prime_clientes pc
                    WHERE 
                        pc.exportado_reativacao = TRUE
                        AND pc.data_exportacao_reativacao >= NOW() - INTERVAL '1 minute'
                    ORDER BY pc.data_exportacao_reativacao DESC;
                END;
                $$ LANGUAGE plpgsql;
            `
        });
        
        if (functionError) {
            console.error('❌ Erro ao criar função:', functionError.message);
            return;
        }
        
        console.log('✅ Função de exportação criada com sucesso!');
        
        // 4. Testar o sistema
        console.log('\n🧪 Testando o sistema...');
        
        // Verificar quantos clientes inativos temos
        const { data: inativos, error: inativosError } = await supabase
            .from('inativos')
            .select('*', { count: 'exact' })
            .limit(5);
        
        if (inativosError) {
            console.error('❌ Erro ao testar view:', inativosError.message);
            return;
        }
        
        console.log(`📊 Total de clientes inativos: ${inativos.length > 0 ? inativos[0].count : 0}`);
        
        if (inativos && inativos.length > 0) {
            console.log('\n🔍 Amostra de clientes inativos:');
            inativos.forEach((cliente, index) => {
                console.log(`${index + 1}. ${cliente.nome} - ${cliente.email} - ${cliente.dias_sem_compra} dias sem compra`);
            });
        }
        
        console.log('\n🎉 SISTEMA DE CLIENTES INATIVOS CONFIGURADO COM SUCESSO!');
        console.log('\n📋 COMO USAR:');
        console.log('1. Ver clientes inativos: SELECT * FROM api.inativos LIMIT 100;');
        console.log('2. Exportar 200 clientes: SELECT * FROM api.exportar_clientes_inativos(200);');
        console.log('3. Ver estatísticas: SELECT * FROM api.estatisticas_reativacao();');
        
    } catch (error) {
        console.error('❌ Erro geral:', error.message);
    }
}

setupInativosSystem();

