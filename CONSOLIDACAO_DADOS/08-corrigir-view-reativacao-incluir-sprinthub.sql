-- ========================================
-- 🔧 CORREÇÃO: VIEW DE REATIVAÇÃO INCLUINDO SPRINTHUB
-- ========================================
-- Data: 2025-01-XX
-- Problema: View só considerava pedidos do Prime, mas vendas estão no SprintHub
-- Solução: Incluir oportunidades ganhas do SprintHub na análise
-- ========================================

CREATE OR REPLACE VIEW api.vw_para_reativacao AS
WITH pedidos_aprovados_prime AS (
    SELECT 
        cliente_id,
        COUNT(*) as total_pedidos,
        -- Usa data_aprovacao quando disponível, senão usa data_criacao
        MAX(COALESCE(data_aprovacao, data_criacao)) as ultima_compra,
        MIN(COALESCE(data_aprovacao, data_criacao)) as primeira_compra,
        SUM(valor_total) as valor_total_compras
    FROM api.prime_pedidos
    WHERE status_aprovacao = 'APROVADO'
    GROUP BY cliente_id
),
-- Oportunidades ganhas no SprintHub (considerando lead_id via clientes_mestre)
oportunidades_ganhas_sprinthub AS (
    SELECT 
        cm.id_prime as cliente_id,
        COUNT(*) as total_oportunidades,
        MAX(os.gain_date) as ultima_compra,
        MIN(os.gain_date) as primeira_compra,
        SUM(os.value) as valor_total_compras
    FROM api.oportunidade_sprint os
    INNER JOIN api.clientes_mestre cm ON os.lead_id = cm.id_sprinthub
    WHERE os.status = 'gain'
    AND os.gain_date IS NOT NULL
    AND cm.id_prime IS NOT NULL
    GROUP BY cm.id_prime
),
-- Combinar pedidos do Prime e oportunidades do SprintHub
compras_consolidadas AS (
    SELECT 
        COALESCE(pp.cliente_id, os.cliente_id) as cliente_id,
        COALESCE(pp.total_pedidos, 0) + COALESCE(os.total_oportunidades, 0) as total_pedidos,
        GREATEST(
            COALESCE(pp.ultima_compra, '1970-01-01'::timestamp),
            COALESCE(os.ultima_compra, '1970-01-01'::timestamp)
        ) as ultima_compra,
        LEAST(
            COALESCE(pp.primeira_compra, '9999-12-31'::timestamp),
            COALESCE(os.primeira_compra, '9999-12-31'::timestamp)
        ) as primeira_compra,
        COALESCE(pp.valor_total_compras, 0) + COALESCE(os.valor_total_compras, 0) as valor_total_compras
    FROM pedidos_aprovados_prime pp
    FULL OUTER JOIN oportunidades_ganhas_sprinthub os ON pp.cliente_id = os.cliente_id
),
-- Verifica se há compras recentes (últimos 90 dias) - Prime OU SprintHub
compras_recentes AS (
    -- Pedidos do Prime recentes
    SELECT DISTINCT cliente_id
    FROM api.prime_pedidos
    WHERE status_aprovacao = 'APROVADO'
    AND COALESCE(data_aprovacao, data_criacao) >= (NOW() - INTERVAL '90 days')
    UNION
    -- Oportunidades ganhas do SprintHub recentes
    SELECT DISTINCT cm.id_prime as cliente_id
    FROM api.oportunidade_sprint os
    INNER JOIN api.clientes_mestre cm ON os.lead_id = cm.id_sprinthub
    WHERE os.status = 'gain'
    AND os.gain_date IS NOT NULL
    AND os.gain_date >= (NOW() - INTERVAL '90 days')
    AND cm.id_prime IS NOT NULL
),
historico_orcamentos AS (
    SELECT 
        cliente_id,
        COUNT(*) as total_orcamentos,
        MAX(data_criacao) as ultimo_orcamento,
        STRING_AGG(DISTINCT status_aprovacao, ', ') as status_historico
    FROM api.prime_pedidos
    GROUP BY cliente_id
)
SELECT 
    cm.id,
    cm.id_prime,
    cm.nome_completo,
    cm.email,
    cm.whatsapp,
    cm.telefone,
    cm.cpf,
    cm.data_nascimento,
    cm.cidade,
    cm.estado,
    cm.qualidade_dados,
    cm.origem_marcas,
    cc.total_pedidos,
    cc.primeira_compra,
    cc.ultima_compra,
    cc.valor_total_compras,
    EXTRACT(DAYS FROM NOW() - cc.ultima_compra)::INTEGER as dias_sem_compra,
    ho.total_orcamentos,
    ho.ultimo_orcamento,
    ho.status_historico,
    CASE 
        WHEN cc.total_pedidos = 1 THEN '1x'
        WHEN cc.total_pedidos = 2 THEN '2x'
        WHEN cc.total_pedidos = 3 THEN '3x'
        WHEN cc.total_pedidos > 3 THEN '3+ vezes'
    END as frequencia_compra
FROM api.clientes_mestre cm
INNER JOIN compras_consolidadas cc ON cm.id_prime = cc.cliente_id
LEFT JOIN historico_orcamentos ho ON cm.id_prime = ho.cliente_id
-- EXCLUI clientes que têm compras recentes (últimos 90 dias) - Prime OU SprintHub
WHERE cm.id_prime IS NOT NULL
AND cc.total_pedidos >= 1
AND EXTRACT(DAYS FROM NOW() - cc.ultima_compra) > 90
AND NOT EXISTS (
    SELECT 1 FROM compras_recentes cr 
    WHERE cr.cliente_id = cm.id_prime
)
ORDER BY cc.total_pedidos DESC, cc.ultima_compra DESC;

COMMENT ON VIEW api.vw_para_reativacao IS 'Clientes para reativação (90+ dias sem comprar) - CORRIGIDO: inclui pedidos Prime E oportunidades ganhas SprintHub';


