-- Função que FUNCIONA para exportar clientes inativos
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
DECLARE
    cliente_ids BIGINT[];
BEGIN
    -- Buscar IDs dos clientes inativos
    SELECT ARRAY_AGG(pc.id ORDER BY pc.created_at ASC)
    INTO cliente_ids
    FROM api.prime_clientes pc
    LEFT JOIN (
        SELECT cliente_id, COUNT(*) as total_pedidos
        FROM api.prime_pedidos 
        WHERE status_aprovacao = 'APROVADO'
        GROUP BY cliente_id
    ) pedidos ON pc.id = pedidos.cliente_id
    WHERE 
        pc.ativo = true
        AND (pedidos.total_pedidos IS NULL OR pedidos.total_pedidos = 0)
        AND (pc.exportado_reativacao IS NULL OR pc.exportado_reativacao = FALSE)
    LIMIT quantidade;
    
    -- Marcar como exportados
    UPDATE api.prime_clientes 
    SET 
        exportado_reativacao = TRUE,
        data_exportacao_reativacao = NOW()
    WHERE id = ANY(cliente_ids);
    
    -- Retornar dados
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
        EXTRACT(DAYS FROM NOW() - COALESCE(pc.ultima_compra, pc.primeira_compra, pc.created_at))::BIGINT
    FROM api.prime_clientes pc
    WHERE pc.id = ANY(cliente_ids)
    ORDER BY pc.data_exportacao_reativacao DESC;
END;
$$ LANGUAGE plpgsql;

