-- ========================================
-- 🔍 INVESTIGAR INCONSISTÊNCIA DE DADOS
-- ========================================
-- Por que clientes COM orçamento têm dados ruins
-- e clientes SEM orçamento têm dados bons?
-- ========================================

-- 1️⃣ COMPARAR QUALIDADE: COM vs SEM ORÇAMENTO
SELECT 
    CASE 
        WHEN ho.total_orcamentos > 0 THEN 'COM orçamento'
        ELSE 'SEM orçamento'
    END as tipo,
    COUNT(*) as total_clientes,
    ROUND(AVG(cm.qualidade_dados), 2) as qualidade_media,
    COUNT(CASE WHEN cm.email IS NOT NULL THEN 1 END) as com_email,
    COUNT(CASE WHEN cm.whatsapp IS NOT NULL THEN 1 END) as com_whatsapp,
    COUNT(CASE WHEN cm.cpf IS NOT NULL THEN 1 END) as com_cpf
FROM api.clientes_mestre cm
LEFT JOIN (
    SELECT cliente_id, COUNT(*) as total_orcamentos
    FROM api.prime_pedidos
    GROUP BY cliente_id
) ho ON cm.id_prime = ho.cliente_id
WHERE cm.id_prime IS NOT NULL
AND NOT EXISTS (
    SELECT 1 FROM api.prime_pedidos pp
    WHERE pp.cliente_id = cm.id_prime 
    AND pp.status_aprovacao = 'APROVADO'
)
GROUP BY tipo
ORDER BY tipo;

-- 2️⃣ AMOSTRA: CLIENTES COM ORÇAMENTO E DADOS RUINS
SELECT
    cm.id,
    cm.id_prime,
    cm.nome_completo,
    cm.email,
    cm.whatsapp,
    cm.qualidade_dados,
    ho.total_orcamentos,
    ho.ultimo_orcamento,
    pc.nome as nome_no_prime,
    pc.email as email_no_prime,
    pc.telefone as telefone_no_prime
FROM api.clientes_mestre cm
LEFT JOIN (
    SELECT
        cliente_id,
        COUNT(*) as total_orcamentos,
        MAX(data_criacao) as ultimo_orcamento
    FROM api.prime_pedidos
    GROUP BY cliente_id
) ho ON cm.id_prime = ho.cliente_id
LEFT JOIN api.prime_clientes pc ON cm.id_prime = pc.id
WHERE cm.id_prime IS NOT NULL
AND ho.total_orcamentos > 0
AND cm.qualidade_dados < 50
AND NOT EXISTS (
    SELECT 1 FROM api.prime_pedidos pp
    WHERE pp.cliente_id = cm.id_prime
    AND pp.status_aprovacao = 'APROVADO'
)
ORDER BY ho.ultimo_orcamento DESC
LIMIT 10;

-- 3️⃣ VERIFICAR SE HÁ DUPLICADOS DE id_prime
SELECT 
    id_prime,
    COUNT(*) as total_registros,
    STRING_AGG(nome_completo, ' | ') as nomes,
    STRING_AGG(qualidade_dados::text, ' | ') as qualidades
FROM api.clientes_mestre
WHERE id_prime IS NOT NULL
GROUP BY id_prime
HAVING COUNT(*) > 1
ORDER BY COUNT(*) DESC
LIMIT 20;

-- 4️⃣ COMPARAR DADOS: clientes_mestre vs prime_clientes
SELECT
    'Comparação de Dados' as analise,
    cm.id as id_mestre,
    cm.id_prime,
    cm.nome_completo as nome_mestre,
    pc.nome as nome_prime,
    cm.email as email_mestre,
    pc.email as email_prime,
    cm.whatsapp as whatsapp_mestre,
    pc.telefone as telefone_prime,
    cm.qualidade_dados,
    CASE
        WHEN cm.email IS NULL AND pc.email IS NOT NULL THEN '⚠️ Email perdido'
        WHEN cm.whatsapp IS NULL AND pc.telefone IS NOT NULL THEN '⚠️ Telefone perdido'
        ELSE '✅ OK'
    END as status_dados
FROM api.clientes_mestre cm
INNER JOIN api.prime_clientes pc ON cm.id_prime = pc.id
WHERE cm.id_prime IS NOT NULL
AND cm.qualidade_dados < 50
AND (pc.email IS NOT NULL OR pc.telefone IS NOT NULL)
ORDER BY cm.qualidade_dados ASC
LIMIT 20;

-- 5️⃣ VERIFICAR ORIGEM DOS DADOS RUINS
SELECT 
    origem_marcas,
    COUNT(*) as total,
    ROUND(AVG(qualidade_dados), 2) as qualidade_media,
    COUNT(CASE WHEN email IS NULL THEN 1 END) as sem_email,
    COUNT(CASE WHEN whatsapp IS NULL THEN 1 END) as sem_whatsapp
FROM api.clientes_mestre
WHERE id_prime IS NOT NULL
AND qualidade_dados < 50
GROUP BY origem_marcas
ORDER BY COUNT(*) DESC;
