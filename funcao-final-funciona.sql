-- Função FINAL que FUNCIONA (sem ambiguidade)
DROP FUNCTION IF EXISTS api.exportar_clientes_inativos(integer);

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
    dias_sem_compra BIGINT,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    -- Marcar clientes como exportados e retornar
    RETURN QUERY
    UPDATE api.prime_clientes 
    SET 
        exportado_reativacao = TRUE,
        data_exportacao_reativacao = NOW()
    WHERE api.prime_clientes.id IN (
        SELECT pc.id 
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
        ORDER BY pc.created_at ASC
        LIMIT quantidade
    )
    RETURNING 
        api.prime_clientes.id,
        api.prime_clientes.nome,
        api.prime_clientes.email,
        api.prime_clientes.telefone,
        api.prime_clientes.cpf_cnpj,
        api.prime_clientes.data_nascimento,
        api.prime_clientes.primeira_compra,
        api.prime_clientes.ultima_compra,
        EXTRACT(DAYS FROM NOW() - COALESCE(api.prime_clientes.ultima_compra, api.prime_clientes.primeira_compra, api.prime_clientes.created_at))::BIGINT,
        api.prime_clientes.created_at;
END;
$$ LANGUAGE plpgsql;

