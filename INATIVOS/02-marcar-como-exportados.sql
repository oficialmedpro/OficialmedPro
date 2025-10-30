-- MARCAR OS 200 CLIENTES COMO EXPORTADOS
-- Execute este UPDATE DEPOIS de obter a lista dos 200 clientes

UPDATE api.prime_clientes 
SET 
    exportado_reativacao = TRUE,
    data_exportacao_reativacao = NOW()
WHERE id IN (
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
    LIMIT 200
);

