-- ========================================
-- 🔍 DIAGNÓSTICO: Campo total_orcamentos
-- ========================================

-- 1. Verificar se total_orcamentos existe e está sendo calculado
SELECT 
    '1. ESTRUTURA - Campos na tabela clientes_mestre' as analise,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'api'
AND table_name = 'clientes_mestre'
AND column_name LIKE '%orcamento%';

-- 2. Ver valores de total_orcamentos na tabela clientes_mestre
SELECT 
    '2. VALORES - total_orcamentos no clientes_mestre' as analise,
    total_orcamentos,
    COUNT(*) as quantidade,
    ROUND(COUNT(*)::NUMERIC * 100 / SUM(COUNT(*)) OVER(), 2) as percentual
FROM api.clientes_mestre
GROUP BY total_orcamentos
ORDER BY total_orcamentos NULLS FIRST;

-- 3. COMPARAR: Orçamentos na view vs orçamentos reais na tabela prime_pedidos
SELECT 
    '3. COMPARAÇÃO - View vs Realidade' as analise,
    vico.id,
    vico.nome_completo,
    vico.total_orcamentos as orcamentos_na_view,
    vico.status_historico,
    cm.total_orcamentos as orcamentos_no_mestre,
    COUNT(pp.id) as orcamentos_reais_no_prime,
    CASE 
        WHEN vico.total_orcamentos = COUNT(pp.id) THEN '✅ CORRETO'
        WHEN vico.total_orcamentos != COUNT(pp.id) THEN '❌ DIFERENTE'
        ELSE '⚠️ NULL'
    END as status_conferencia
FROM api.vw_inativos_com_orcamento vico
LEFT JOIN api.clientes_mestre cm ON vico.id = cm.id
LEFT JOIN api.prime_pedidos pp ON vico.id_prime = pp.cliente_id
GROUP BY vico.id, vico.nome_completo, vico.total_orcamentos, vico.status_historico, cm.total_orcamentos
ORDER BY vico.qualidade_dados ASC
LIMIT 20;

-- 4. VERIFICAR: Clientes na lista "SEM orçamento" que NA VERDADE TÊM orçamentos
SELECT 
    '4. CLIENTES MAL CLASSIFICADOS - SEM orçamento mas TÊM pedidos' as analise,
    viso.id,
    viso.nome_completo,
    viso.qualidade_dados,
    viso.id_prime,
    COUNT(pp.id) as orcamentos_reais,
    STRING_AGG(DISTINCT pp.status_aprovacao, ', ') as status_pedidos
FROM api.vw_inativos_sem_orcamento viso
INNER JOIN api.prime_pedidos pp ON viso.id_prime = pp.cliente_id
GROUP BY viso.id, viso.nome_completo, viso.qualidade_dados, viso.id_prime
HAVING COUNT(pp.id) > 0
LIMIT 20;

-- 5. ESTATÍSTICA: Quantos estão mal classificados?
SELECT 
    '5. TOTAL MAL CLASSIFICADOS' as analise,
    COUNT(DISTINCT viso.id) as clientes_sem_orcamento_que_tem_pedidos,
    (SELECT COUNT(*) FROM api.vw_inativos_sem_orcamento) as total_sem_orcamento,
    ROUND(
        COUNT(DISTINCT viso.id)::NUMERIC * 100 / 
        (SELECT COUNT(*) FROM api.vw_inativos_sem_orcamento),
        2
    ) as percentual_mal_classificado
FROM api.vw_inativos_sem_orcamento viso
INNER JOIN api.prime_pedidos pp ON viso.id_prime = pp.cliente_id;

-- 6. VERIFICAR: A view está usando a CTE historico_orcamentos corretamente?
-- Vamos recriar a lógica da view manualmente
WITH pedidos_aprovados AS (
    SELECT cliente_id, COUNT(*) as total
    FROM api.prime_pedidos
    WHERE status_aprovacao = 'APROVADO'
    GROUP BY cliente_id
),
historico_orcamentos AS (
    SELECT 
        cliente_id,
        COUNT(*) as total_orcamentos,
        MAX(data_criacao) as ultimo_orcamento,
        MAX(CASE WHEN status_aprovacao = 'APROVADO' THEN data_criacao END) as ultimo_pedido_aprovado,
        STRING_AGG(DISTINCT status_aprovacao, ', ') as status_historico
    FROM api.prime_pedidos
    GROUP BY cliente_id
)
SELECT 
    '6. TESTE LÓGICA VIEW - Clientes com qualidade baixa' as analise,
    cm.id,
    cm.nome_completo,
    cm.qualidade_dados,
    cm.email,
    cm.whatsapp,
    cm.cpf,
    pa.total as pedidos_aprovados,
    ho.total_orcamentos,
    ho.status_historico,
    CASE 
        WHEN ho.total_orcamentos > 0 THEN 'COM histórico'
        ELSE 'SEM histórico'
    END as classificacao_correta,
    CASE 
        WHEN ho.total_orcamentos > 0 AND cm.qualidade_dados <= 40 THEN '🚨 PROBLEMA AQUI!'
        WHEN ho.total_orcamentos IS NULL AND cm.qualidade_dados >= 90 THEN '🚨 PROBLEMA AQUI!'
        ELSE '✅ Normal'
    END as diagnostico
FROM api.clientes_mestre cm
LEFT JOIN pedidos_aprovados pa ON cm.id_prime = pa.cliente_id
LEFT JOIN historico_orcamentos ho ON cm.id_prime = ho.cliente_id
WHERE cm.id_prime IS NOT NULL
AND (pa.total IS NULL OR pa.total = 0)
AND (
    (ho.total_orcamentos > 0 AND cm.qualidade_dados <= 40) OR
    (ho.total_orcamentos IS NULL AND cm.qualidade_dados >= 90)
)
ORDER BY ho.total_orcamentos DESC NULLS LAST
LIMIT 30;

-- 7. VERIFICAR: Clientes específicos que você viu na tela
SELECT 
    '7. CLIENTES ESPECÍFICOS - Ana Julia, Daniele, Flavio' as analise,
    cm.nome_completo,
    cm.qualidade_dados,
    cm.email,
    cm.whatsapp,
    cm.cpf,
    cm.id_prime,
    pc.email as email_no_prime,
    pc.whatsapp as whatsapp_no_prime,
    pc.cpf as cpf_no_prime,
    COUNT(pp.id) as total_pedidos_real,
    STRING_AGG(DISTINCT pp.status_aprovacao, ', ') as status_pedidos,
    MAX(pp.data_criacao) as ultimo_pedido
FROM api.clientes_mestre cm
LEFT JOIN api.prime_clientes pc ON cm.id_prime = pc.id
LEFT JOIN api.prime_pedidos pp ON cm.id_prime = pp.cliente_id
WHERE cm.nome_completo ILIKE '%ANA JULIA%'
   OR cm.nome_completo ILIKE 'DANIELE'
   OR cm.nome_completo ILIKE '%FLAVIO%GABRIEL%'
   OR cm.nome_completo ILIKE '%MARIA ANGELICA%'
   OR cm.nome_completo ILIKE 'YARA'
GROUP BY cm.id, cm.nome_completo, cm.qualidade_dados, cm.email, cm.whatsapp, 
         cm.cpf, cm.id_prime, pc.email, pc.whatsapp, pc.cpf
ORDER BY cm.nome_completo;

-- 8. RESUMO EXECUTIVO DO PROBLEMA
SELECT 
    '8. RESUMO DO PROBLEMA' as analise,
    (SELECT COUNT(*) FROM api.vw_inativos_com_orcamento WHERE qualidade_dados <= 40) as com_orcamento_sem_dados,
    (SELECT COUNT(*) FROM api.vw_inativos_sem_orcamento WHERE qualidade_dados >= 90) as sem_orcamento_com_dados,
    (SELECT COUNT(*) FROM api.clientes_mestre cm
     INNER JOIN api.prime_clientes pc ON cm.id_prime = pc.id
     WHERE cm.qualidade_dados <= 40
     AND (pc.email IS NOT NULL OR pc.whatsapp IS NOT NULL OR pc.cpf IS NOT NULL)
    ) as clientes_com_dados_no_prime,
    (SELECT COUNT(DISTINCT viso.id)
     FROM api.vw_inativos_sem_orcamento viso
     INNER JOIN api.prime_pedidos pp ON viso.id_prime = pp.cliente_id
    ) as sem_orcamento_mas_tem_pedidos;

