-- Função ultra simples para exportar clientes inativos (sem ambiguidade)
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
    -- Marcar clientes como exportados e retornar dados
    RETURN QUERY
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
        CASE 
            WHEN api.prime_clientes.ultima_compra IS NOT NULL THEN 
                EXTRACT(DAYS FROM NOW() - api.prime_clientes.ultima_compra)
            WHEN api.prime_clientes.primeira_compra IS NOT NULL THEN 
                EXTRACT(DAYS FROM NOW() - api.prime_clientes.primeira_compra)
            ELSE 
                EXTRACT(DAYS FROM NOW() - api.prime_clientes.created_at)
        END;
END;
$$ LANGUAGE plpgsql;

