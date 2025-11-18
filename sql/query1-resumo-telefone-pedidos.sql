-- 1️⃣ RESUMO: COM TELEFONE vs SEM TELEFONE vs PEDIDOS
SELECT
    CASE
        WHEN pc.telefone IS NOT NULL AND pc.telefone != '' THEN 'COM telefone'
        ELSE 'SEM telefone'
    END as situacao_telefone,
    COUNT(DISTINCT pc.id) as total_clientes,
    COUNT(DISTINCT CASE WHEN pp.id IS NOT NULL THEN pc.id END) as clientes_com_pedido,
    COUNT(DISTINCT CASE WHEN pp.id IS NULL THEN pc.id END) as clientes_sem_pedido,
    COUNT(pp.id) as total_pedidos
FROM api.prime_clientes pc
LEFT JOIN api.prime_pedidos pp ON pc.id = pp.cliente_id
WHERE pc.ativo = true
GROUP BY situacao_telefone
ORDER BY situacao_telefone;
