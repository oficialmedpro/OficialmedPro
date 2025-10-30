-- 3️⃣ DETALHES: COM TELEFONE - Status dos Pedidos
SELECT
    CASE
        WHEN pp.status_aprovacao IS NULL THEN 'SEM pedido'
        ELSE pp.status_aprovacao
    END as status_pedido,
    COUNT(DISTINCT pc.id) as total_clientes,
    COUNT(pp.id) as total_pedidos
FROM api.prime_clientes pc
LEFT JOIN api.prime_pedidos pp ON pc.id = pp.cliente_id
WHERE pc.ativo = true
AND pc.telefone IS NOT NULL
AND pc.telefone != ''
GROUP BY status_pedido
ORDER BY total_clientes DESC;
