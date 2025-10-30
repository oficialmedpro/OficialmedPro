-- Função ultra simplificada para exportar clientes inativos
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
    WITH clientes_para_exportar AS (
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
    UPDATE api.prime_clientes 
    SET 
        exportado_reativacao = TRUE,
        data_exportacao_reativacao = NOW()
    FROM clientes_para_exportar cpe
    WHERE api.prime_clientes.id = cpe.id
    RETURNING 
        cpe.id as cliente_id,
        cpe.nome,
        cpe.email,
        cpe.telefone,
        cpe.cpf_cnpj,
        cpe.data_nascimento,
        cpe.primeira_compra,
        cpe.ultima_compra,
        cpe.dias_sem_compra;
END;
$$ LANGUAGE plpgsql;

