-- ========================================
-- 📊 ANÁLISE: TELEFONES vs PEDIDOS
-- ========================================

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

-- 2️⃣ CRUZAR COM OUTRAS TABELAS: Recuperar telefones
SELECT 
    'Clientes Prime SEM telefone' as analise,
    COUNT(DISTINCT pc.id) as total_sem_telefone,
    COUNT(DISTINCT CASE WHEN l.whatsapp IS NOT NULL THEN pc.id END) as encontrados_no_sprint,
    COUNT(DISTINCT CASE WHEN gl.telefone IS NOT NULL THEN pc.id END) as encontrados_no_greatpage,
    COUNT(DISTINCT CASE WHEN bl.telefone IS NOT NULL THEN pc.id END) as encontrados_no_blacklabs,
    COUNT(DISTINCT CASE 
        WHEN l.whatsapp IS NOT NULL OR gl.telefone IS NOT NULL OR bl.telefone IS NOT NULL 
        THEN pc.id 
    END) as total_recuperaveis
FROM api.prime_clientes pc
LEFT JOIN api.clientes_mestre cm ON pc.id = cm.id_prime
LEFT JOIN api.leads l ON cm.id_sprinthub = l.id
LEFT JOIN api.greatpage_leads gl ON cm.id_greatpage = gl.id
LEFT JOIN api.blacklabs bl ON cm.id_blacklabs = bl.id
WHERE pc.ativo = true
AND (pc.telefone IS NULL OR pc.telefone = '');

-- 3️⃣ DETALHES: SEM TELEFONE - Status dos Pedidos
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
AND (pc.telefone IS NULL OR pc.telefone = '')
GROUP BY status_pedido
ORDER BY total_clientes DESC;

-- 4️⃣ DETALHES: COM TELEFONE - Status dos Pedidos  
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

-- 5️⃣ AMOSTRA: Clientes SEM telefone MAS COM pedido
SELECT 
    pc.id,
    pc.nome,
    pc.email,
    pc.telefone,
    COUNT(pp.id) as total_pedidos,
    STRING_AGG(DISTINCT pp.status_aprovacao, ', ') as status_pedidos,
    MAX(pp.data_criacao) as ultimo_pedido
FROM api.prime_clientes pc
INNER JOIN api.prime_pedidos pp ON pc.id = pp.cliente_id
WHERE pc.ativo = true
AND (pc.telefone IS NULL OR pc.telefone = '')
GROUP BY pc.id, pc.nome, pc.email, pc.telefone
ORDER BY COUNT(pp.id) DESC
LIMIT 20;
