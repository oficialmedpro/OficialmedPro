-- ========================================
-- 🔧 ATUALIZAÇÃO: VIEWS DE MONITORAMENTO COM SPRINTHUB E ETAPAS D45/D60/D75/D90
-- ========================================
-- Data: 2025-01-XX
-- Objetivo: 
-- 1. Incluir oportunidades ganhas do SprintHub na análise
-- 2. Excluir do monitoramento (30-59 e 60-90) quem tem oportunidade ganha nos últimos 30 dias
-- 3. Criar views para etapas D45, D60, D75, D90 com ajuste de +5 dias
-- 4. Usar data mais recente entre pedido (Prime) e oportunidade ganha (SprintHub)
-- ========================================

-- ========================================
-- VIEW BASE: COMPRAS CONSOLIDADAS (PRIME + SPRINTHUB)
-- ========================================

CREATE OR REPLACE VIEW api.vw_compras_consolidadas_monitoramento AS
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
-- Oportunidades ganhas no SprintHub
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
)
SELECT * FROM compras_consolidadas;

COMMENT ON VIEW api.vw_compras_consolidadas_monitoramento IS 'Compras consolidadas do Prime e SprintHub para monitoramento';

-- ========================================
-- CTE: CLIENTES COM OPORTUNIDADE GANHA NOS ÚLTIMOS 30 DIAS
-- ========================================

CREATE OR REPLACE VIEW api.vw_clientes_com_oportunidade_recente AS
SELECT DISTINCT cm.id_prime as cliente_id
FROM api.oportunidade_sprint os
INNER JOIN api.clientes_mestre cm ON os.lead_id = cm.id_sprinthub
WHERE os.status = 'gain'
AND os.gain_date IS NOT NULL
AND os.gain_date >= (NOW() - INTERVAL '30 days')
AND cm.id_prime IS NOT NULL;

COMMENT ON VIEW api.vw_clientes_com_oportunidade_recente IS 'Clientes com oportunidade ganha nos últimos 30 dias (devem sair do monitoramento 30-59 e 60-90)';

-- ========================================
-- ATUALIZAR VIEW: MONITORAMENTO 1-29 DIAS
-- ========================================

CREATE OR REPLACE VIEW api.vw_monitoramento_1_29_dias AS
SELECT 
    cm.*,
    cc.total_pedidos,
    cc.primeira_compra,
    cc.ultima_compra,
    cc.valor_total_compras,
    -- Ajuste de +5 dias: se comprou há 26 dias, mostra como 31 dias (26+5)
    (EXTRACT(DAYS FROM NOW() - cc.ultima_compra)::INTEGER + 5) as dias_desde_ultima_compra,
    ho.total_orcamentos,
    ho.ultimo_orcamento,
    ho.status_historico
FROM api.clientes_mestre cm
INNER JOIN api.vw_compras_consolidadas_monitoramento cc ON cm.id_prime = cc.cliente_id
LEFT JOIN (
    SELECT 
        cliente_id,
        COUNT(*) as total_orcamentos,
        MAX(data_criacao) as ultimo_orcamento,
        STRING_AGG(DISTINCT status_aprovacao, ', ') as status_historico
    FROM api.prime_pedidos
    GROUP BY cliente_id
) ho ON cm.id_prime = ho.cliente_id
WHERE cm.id_prime IS NOT NULL
AND cc.total_pedidos >= 1
-- Critério original: 1-29 dias (sem ajuste de +5 aqui, pois é a faixa inicial)
AND EXTRACT(DAYS FROM NOW() - cc.ultima_compra) BETWEEN 1 AND 29
ORDER BY cc.ultima_compra DESC;

COMMENT ON VIEW api.vw_monitoramento_1_29_dias IS 'Clientes que compraram há 1-29 dias (inclui Prime e SprintHub)';

-- ========================================
-- ATUALIZAR VIEW: MONITORAMENTO 30-59 DIAS (EXCLUIR OPORTUNIDADES RECENTES)
-- ========================================

CREATE OR REPLACE VIEW api.vw_monitoramento_30_59_dias AS
SELECT 
    cm.*,
    cc.total_pedidos,
    cc.primeira_compra,
    cc.ultima_compra,
    cc.valor_total_compras,
    -- Ajuste de +5 dias
    (EXTRACT(DAYS FROM NOW() - cc.ultima_compra)::INTEGER + 5) as dias_desde_ultima_compra,
    ho.total_orcamentos,
    ho.ultimo_orcamento,
    ho.status_historico
FROM api.clientes_mestre cm
INNER JOIN api.vw_compras_consolidadas_monitoramento cc ON cm.id_prime = cc.cliente_id
LEFT JOIN (
    SELECT 
        cliente_id,
        COUNT(*) as total_orcamentos,
        MAX(data_criacao) as ultimo_orcamento,
        STRING_AGG(DISTINCT status_aprovacao, ', ') as status_historico
    FROM api.prime_pedidos
    GROUP BY cliente_id
) ho ON cm.id_prime = ho.cliente_id
WHERE cm.id_prime IS NOT NULL
AND cc.total_pedidos >= 1
AND EXTRACT(DAYS FROM NOW() - cc.ultima_compra) BETWEEN 30 AND 59
-- EXCLUIR quem tem oportunidade ganha nos últimos 30 dias
AND NOT EXISTS (
    SELECT 1 FROM api.vw_clientes_com_oportunidade_recente cor
    WHERE cor.cliente_id = cm.id_prime
)
ORDER BY cc.ultima_compra DESC;

COMMENT ON VIEW api.vw_monitoramento_30_59_dias IS 'Clientes que compraram há 30-59 dias (exclui quem tem oportunidade ganha nos últimos 30 dias)';

-- ========================================
-- ATUALIZAR VIEW: MONITORAMENTO 60-90 DIAS (EXCLUIR OPORTUNIDADES RECENTES)
-- ========================================

CREATE OR REPLACE VIEW api.vw_monitoramento_60_90_dias AS
SELECT 
    cm.*,
    cc.total_pedidos,
    cc.primeira_compra,
    cc.ultima_compra,
    cc.valor_total_compras,
    -- Ajuste de +5 dias
    (EXTRACT(DAYS FROM NOW() - cc.ultima_compra)::INTEGER + 5) as dias_desde_ultima_compra,
    ho.total_orcamentos,
    ho.ultimo_orcamento,
    ho.status_historico
FROM api.clientes_mestre cm
INNER JOIN api.vw_compras_consolidadas_monitoramento cc ON cm.id_prime = cc.cliente_id
LEFT JOIN (
    SELECT 
        cliente_id,
        COUNT(*) as total_orcamentos,
        MAX(data_criacao) as ultimo_orcamento,
        STRING_AGG(DISTINCT status_aprovacao, ', ') as status_historico
    FROM api.prime_pedidos
    GROUP BY cliente_id
) ho ON cm.id_prime = ho.cliente_id
WHERE cm.id_prime IS NOT NULL
AND cc.total_pedidos >= 1
AND EXTRACT(DAYS FROM NOW() - cc.ultima_compra) BETWEEN 60 AND 90
-- EXCLUIR quem tem oportunidade ganha nos últimos 30 dias
AND NOT EXISTS (
    SELECT 1 FROM api.vw_clientes_com_oportunidade_recente cor
    WHERE cor.cliente_id = cm.id_prime
)
ORDER BY cc.ultima_compra DESC;

COMMENT ON VIEW api.vw_monitoramento_60_90_dias IS 'Clientes que compraram há 60-90 dias (exclui quem tem oportunidade ganha nos últimos 30 dias)';

-- ========================================
-- NOVA VIEW: MONITORAMENTO D45 (26-40 dias com ajuste)
-- ========================================
-- Critério: compraram há 31-45 dias + 5 dias de ajuste = 26-40 dias reais
-- ========================================

CREATE OR REPLACE VIEW api.vw_monitoramento_d45 AS
SELECT 
    cm.*,
    cc.total_pedidos,
    cc.primeira_compra,
    cc.ultima_compra,
    cc.valor_total_compras,
    -- Ajuste de +5 dias: se comprou há 26 dias, mostra como 31 dias (26+5)
    (EXTRACT(DAYS FROM NOW() - cc.ultima_compra)::INTEGER + 5) as dias_desde_ultima_compra,
    ho.total_orcamentos,
    ho.ultimo_orcamento,
    ho.status_historico
FROM api.clientes_mestre cm
INNER JOIN api.vw_compras_consolidadas_monitoramento cc ON cm.id_prime = cc.cliente_id
LEFT JOIN (
    SELECT 
        cliente_id,
        COUNT(*) as total_orcamentos,
        MAX(data_criacao) as ultimo_orcamento,
        STRING_AGG(DISTINCT status_aprovacao, ', ') as status_historico
    FROM api.prime_pedidos
    GROUP BY cliente_id
) ho ON cm.id_prime = ho.cliente_id
WHERE cm.id_prime IS NOT NULL
AND cc.total_pedidos >= 1
-- Critério: 26-40 dias reais (que com +5 dias vira 31-45 dias)
AND EXTRACT(DAYS FROM NOW() - cc.ultima_compra) BETWEEN 26 AND 40
ORDER BY cc.ultima_compra DESC;

COMMENT ON VIEW api.vw_monitoramento_d45 IS 'Clientes para etapa D45: compraram há 26-40 dias (31-45 com ajuste de +5 dias)';

-- ========================================
-- NOVA VIEW: MONITORAMENTO D60 (41-55 dias com ajuste)
-- ========================================
-- Critério: compraram há 46-60 dias + 5 dias de ajuste = 41-55 dias reais
-- ========================================

CREATE OR REPLACE VIEW api.vw_monitoramento_d60 AS
SELECT 
    cm.*,
    cc.total_pedidos,
    cc.primeira_compra,
    cc.ultima_compra,
    cc.valor_total_compras,
    -- Ajuste de +5 dias
    (EXTRACT(DAYS FROM NOW() - cc.ultima_compra)::INTEGER + 5) as dias_desde_ultima_compra,
    ho.total_orcamentos,
    ho.ultimo_orcamento,
    ho.status_historico
FROM api.clientes_mestre cm
INNER JOIN api.vw_compras_consolidadas_monitoramento cc ON cm.id_prime = cc.cliente_id
LEFT JOIN (
    SELECT 
        cliente_id,
        COUNT(*) as total_orcamentos,
        MAX(data_criacao) as ultimo_orcamento,
        STRING_AGG(DISTINCT status_aprovacao, ', ') as status_historico
    FROM api.prime_pedidos
    GROUP BY cliente_id
) ho ON cm.id_prime = ho.cliente_id
WHERE cm.id_prime IS NOT NULL
AND cc.total_pedidos >= 1
-- Critério: 41-55 dias reais (que com +5 dias vira 46-60 dias)
AND EXTRACT(DAYS FROM NOW() - cc.ultima_compra) BETWEEN 41 AND 55
ORDER BY cc.ultima_compra DESC;

COMMENT ON VIEW api.vw_monitoramento_d60 IS 'Clientes para etapa D60: compraram há 41-55 dias (46-60 com ajuste de +5 dias)';

-- ========================================
-- NOVA VIEW: MONITORAMENTO D75 (56-70 dias com ajuste)
-- ========================================
-- Critério: compraram há 61-75 dias + 5 dias de ajuste = 56-70 dias reais
-- ========================================

CREATE OR REPLACE VIEW api.vw_monitoramento_d75 AS
SELECT 
    cm.*,
    cc.total_pedidos,
    cc.primeira_compra,
    cc.ultima_compra,
    cc.valor_total_compras,
    -- Ajuste de +5 dias
    (EXTRACT(DAYS FROM NOW() - cc.ultima_compra)::INTEGER + 5) as dias_desde_ultima_compra,
    ho.total_orcamentos,
    ho.ultimo_orcamento,
    ho.status_historico
FROM api.clientes_mestre cm
INNER JOIN api.vw_compras_consolidadas_monitoramento cc ON cm.id_prime = cc.cliente_id
LEFT JOIN (
    SELECT 
        cliente_id,
        COUNT(*) as total_orcamentos,
        MAX(data_criacao) as ultimo_orcamento,
        STRING_AGG(DISTINCT status_aprovacao, ', ') as status_historico
    FROM api.prime_pedidos
    GROUP BY cliente_id
) ho ON cm.id_prime = ho.cliente_id
WHERE cm.id_prime IS NOT NULL
AND cc.total_pedidos >= 1
-- Critério: 56-70 dias reais (que com +5 dias vira 61-75 dias)
AND EXTRACT(DAYS FROM NOW() - cc.ultima_compra) BETWEEN 56 AND 70
ORDER BY cc.ultima_compra DESC;

COMMENT ON VIEW api.vw_monitoramento_d75 IS 'Clientes para etapa D75: compraram há 56-70 dias (61-75 com ajuste de +5 dias)';

-- ========================================
-- NOVA VIEW: MONITORAMENTO D90 (71-85 dias com ajuste)
-- ========================================
-- Critério: compraram há 76-90 dias + 5 dias de ajuste = 71-85 dias reais
-- ========================================

CREATE OR REPLACE VIEW api.vw_monitoramento_d90 AS
SELECT 
    cm.*,
    cc.total_pedidos,
    cc.primeira_compra,
    cc.ultima_compra,
    cc.valor_total_compras,
    -- Ajuste de +5 dias
    (EXTRACT(DAYS FROM NOW() - cc.ultima_compra)::INTEGER + 5) as dias_desde_ultima_compra,
    ho.total_orcamentos,
    ho.ultimo_orcamento,
    ho.status_historico
FROM api.clientes_mestre cm
INNER JOIN api.vw_compras_consolidadas_monitoramento cc ON cm.id_prime = cc.cliente_id
LEFT JOIN (
    SELECT 
        cliente_id,
        COUNT(*) as total_orcamentos,
        MAX(data_criacao) as ultimo_orcamento,
        STRING_AGG(DISTINCT status_aprovacao, ', ') as status_historico
    FROM api.prime_pedidos
    GROUP BY cliente_id
) ho ON cm.id_prime = ho.cliente_id
WHERE cm.id_prime IS NOT NULL
AND cc.total_pedidos >= 1
-- Critério: 71-85 dias reais (que com +5 dias vira 76-90 dias)
AND EXTRACT(DAYS FROM NOW() - cc.ultima_compra) BETWEEN 71 AND 85
ORDER BY cc.ultima_compra DESC;

COMMENT ON VIEW api.vw_monitoramento_d90 IS 'Clientes para etapa D90: compraram há 71-85 dias (76-90 com ajuste de +5 dias)';

-- ========================================
-- PERMISSÕES
-- ========================================

GRANT SELECT ON api.vw_compras_consolidadas_monitoramento TO anon, authenticated, service_role;
GRANT SELECT ON api.vw_clientes_com_oportunidade_recente TO anon, authenticated, service_role;
GRANT SELECT ON api.vw_monitoramento_1_29_dias TO anon, authenticated, service_role;
GRANT SELECT ON api.vw_monitoramento_30_59_dias TO anon, authenticated, service_role;
GRANT SELECT ON api.vw_monitoramento_60_90_dias TO anon, authenticated, service_role;
GRANT SELECT ON api.vw_monitoramento_d45 TO anon, authenticated, service_role;
GRANT SELECT ON api.vw_monitoramento_d60 TO anon, authenticated, service_role;
GRANT SELECT ON api.vw_monitoramento_d75 TO anon, authenticated, service_role;
GRANT SELECT ON api.vw_monitoramento_d90 TO anon, authenticated, service_role;

-- ========================================
-- FIM
-- ========================================



