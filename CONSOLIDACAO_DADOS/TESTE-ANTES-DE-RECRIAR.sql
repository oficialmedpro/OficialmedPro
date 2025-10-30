-- ========================================
-- 🧪 TESTE ANTES DE RECRIAR AS VIEWS
-- ========================================
-- Execute este SQL para verificar se os dados estão corretos
-- ANTES de dropar e recriar as views
-- ========================================

-- 1️⃣ TESTAR CLIENTES ATIVOS
SELECT 
    'CLIENTES ATIVOS' as teste,
    COUNT(*) as total
FROM api.clientes_mestre cm
INNER JOIN (
    SELECT 
        cliente_id,
        COUNT(*) as total_pedidos,
        MAX(data_criacao) as ultima_compra,
        MIN(data_criacao) as primeira_compra
    FROM api.prime_pedidos
    WHERE status_aprovacao = 'APROVADO'
    GROUP BY cliente_id
) pa ON cm.id_prime = pa.cliente_id
WHERE cm.id_prime IS NOT NULL
AND pa.total_pedidos >= 1;

-- 2️⃣ TESTAR REATIVAÇÃO (90+ dias)
SELECT 
    'REATIVAÇÃO (90+ dias)' as teste,
    COUNT(*) as total
FROM api.clientes_mestre cm
INNER JOIN (
    SELECT 
        cliente_id,
        COUNT(*) as total_pedidos,
        MAX(data_criacao) as ultima_compra
    FROM api.prime_pedidos
    WHERE status_aprovacao = 'APROVADO'
    GROUP BY cliente_id
) pa ON cm.id_prime = pa.cliente_id
WHERE cm.id_prime IS NOT NULL
AND pa.total_pedidos >= 1
AND EXTRACT(DAYS FROM NOW() - pa.ultima_compra) > 90;

-- 3️⃣ TESTAR MONITORAMENTO (0-90 dias)
SELECT 
    'MONITORAMENTO (0-90 dias)' as teste,
    COUNT(*) as total
FROM api.clientes_mestre cm
INNER JOIN (
    SELECT 
        cliente_id,
        COUNT(*) as total_pedidos,
        MAX(data_criacao) as ultima_compra
    FROM api.prime_pedidos
    WHERE status_aprovacao = 'APROVADO'
    GROUP BY cliente_id
) pa ON cm.id_prime = pa.cliente_id
WHERE cm.id_prime IS NOT NULL
AND pa.total_pedidos >= 1
AND EXTRACT(DAYS FROM NOW() - pa.ultima_compra) <= 90;

-- 4️⃣ TESTAR MONITORAMENTO 1-29 DIAS
SELECT 
    'MONITORAMENTO 1-29 dias' as teste,
    COUNT(*) as total
FROM api.clientes_mestre cm
INNER JOIN (
    SELECT 
        cliente_id,
        COUNT(*) as total_pedidos,
        MAX(data_criacao) as ultima_compra
    FROM api.prime_pedidos
    WHERE status_aprovacao = 'APROVADO'
    GROUP BY cliente_id
) pa ON cm.id_prime = pa.cliente_id
WHERE cm.id_prime IS NOT NULL
AND pa.total_pedidos >= 1
AND EXTRACT(DAYS FROM NOW() - pa.ultima_compra) BETWEEN 1 AND 29;

-- 5️⃣ TESTAR MONITORAMENTO 30-59 DIAS
SELECT 
    'MONITORAMENTO 30-59 dias' as teste,
    COUNT(*) as total
FROM api.clientes_mestre cm
INNER JOIN (
    SELECT 
        cliente_id,
        COUNT(*) as total_pedidos,
        MAX(data_criacao) as ultima_compra
    FROM api.prime_pedidos
    WHERE status_aprovacao = 'APROVADO'
    GROUP BY cliente_id
) pa ON cm.id_prime = pa.cliente_id
WHERE cm.id_prime IS NOT NULL
AND pa.total_pedidos >= 1
AND EXTRACT(DAYS FROM NOW() - pa.ultima_compra) BETWEEN 30 AND 59;

-- 6️⃣ TESTAR MONITORAMENTO 60-90 DIAS
SELECT 
    'MONITORAMENTO 60-90 dias' as teste,
    COUNT(*) as total
FROM api.clientes_mestre cm
INNER JOIN (
    SELECT 
        cliente_id,
        COUNT(*) as total_pedidos,
        MAX(data_criacao) as ultima_compra
    FROM api.prime_pedidos
    WHERE status_aprovacao = 'APROVADO'
    GROUP BY cliente_id
) pa ON cm.id_prime = pa.cliente_id
WHERE cm.id_prime IS NOT NULL
AND pa.total_pedidos >= 1
AND EXTRACT(DAYS FROM NOW() - pa.ultima_compra) BETWEEN 60 AND 90;

-- 7️⃣ VERIFICAR SE data_criacao TEM VALORES
SELECT 
    'PEDIDOS COM data_criacao' as teste,
    COUNT(*) as total,
    MIN(data_criacao) as data_mais_antiga,
    MAX(data_criacao) as data_mais_recente
FROM api.prime_pedidos
WHERE data_criacao IS NOT NULL;

-- 8️⃣ VERIFICAR PEDIDOS APROVADOS
SELECT 
    'PEDIDOS APROVADOS' as teste,
    COUNT(*) as total
FROM api.prime_pedidos
WHERE status_aprovacao = 'APROVADO';

-- 9️⃣ VERIFICAR ÚLTIMAS COMPRAS (AMOSTRA)
SELECT 
    cm.id,
    cm.nome_completo,
    pa.ultima_compra,
    EXTRACT(DAYS FROM NOW() - pa.ultima_compra)::INTEGER as dias_sem_compra
FROM api.clientes_mestre cm
INNER JOIN (
    SELECT 
        cliente_id,
        MAX(data_criacao) as ultima_compra
    FROM api.prime_pedidos
    WHERE status_aprovacao = 'APROVADO'
    GROUP BY cliente_id
) pa ON cm.id_prime = pa.cliente_id
WHERE cm.id_prime IS NOT NULL
ORDER BY pa.ultima_compra DESC
LIMIT 10;

-- ========================================
-- 📊 RESULTADO ESPERADO:
-- ========================================
-- Se data_criacao estiver NULL, todos os testes vão dar 0
-- Se data_criacao tiver dados, você verá os números corretos
-- ========================================


