-- CONSULTA PARA OBTER 200 CLIENTES INATIVOS
-- Execute esta consulta no Supabase para obter a lista

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
    EXTRACT(DAYS FROM NOW() - COALESCE(pc.ultima_compra, pc.primeira_compra, pc.created_at))::BIGINT as dias_sem_compra
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
LIMIT 200;

