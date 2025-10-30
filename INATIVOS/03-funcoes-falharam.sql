-- FUNÇÕES POSTGRESQL QUE FALHARAM
-- Todas essas tentativas falharam devido a erros de ambiguidade ou estrutura

-- TENTATIVA 1: Função com ambiguidade de colunas
DROP FUNCTION IF EXISTS api.exportar_clientes_inativos(integer);

CREATE OR REPLACE FUNCTION api.exportar_clientes_inativos(
    quantidade INTEGER DEFAULT 100
)
RETURNS TABLE (
    cliente_id BIGINT,
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
    WHERE api.prime_clientes.id IN (
        SELECT pc.id 
        FROM api.prime_clientes pc
        LEFT JOIN (
            SELECT 
                cliente_id,
                COUNT(*) as total_pedidos
            FROM api.prime_pedidos 
            WHERE status_aprovacao = 'APROVADO'
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
        pc.id as cliente_id,
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

-- ERRO: column reference "id" is ambiguous
-- ERRO: column reference "cliente_id" is ambiguous
-- ERRO: structure of query does not match function result type

