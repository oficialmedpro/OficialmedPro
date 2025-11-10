-- ========================================
-- 📊 SISTEMA DE MONITORAMENTO DE CLIENTES
-- ========================================
-- Data: 2025-11-04
-- Objetivo: Views para monitoramento de clientes que compraram nos últimos 90 dias
-- Base: clientes_mestre + prime_pedidos
-- ========================================

-- ========================================
-- 1. VIEW: DASHBOARD DE MONITORAMENTO
-- ========================================

CREATE OR REPLACE VIEW api.vw_dashboard_monitoramento AS
WITH pedidos_aprovados AS (
    SELECT 
        cliente_id,
        COUNT(*) as total_pedidos,
        MAX(data_criacao) as ultima_compra,
        MIN(data_criacao) as primeira_compra,
        SUM(valor_total) as valor_total_compras
    FROM api.prime_pedidos
    WHERE status_aprovacao = 'APROVADO'
    GROUP BY cliente_id
),
clientes_com_pedidos AS (
    SELECT 
        cm.*,
        pa.total_pedidos,
        pa.ultima_compra,
        pa.primeira_compra,
        pa.valor_total_compras,
        EXTRACT(DAYS FROM NOW() - pa.ultima_compra)::INTEGER as dias_desde_ultima_compra
    FROM api.clientes_mestre cm
    LEFT JOIN pedidos_aprovados pa ON cm.id_prime = pa.cliente_id
    WHERE cm.id_prime IS NOT NULL
    AND pa.total_pedidos >= 1
    AND EXTRACT(DAYS FROM NOW() - pa.ultima_compra) BETWEEN 1 AND 90
)
SELECT 
    -- TOTAIS GERAIS
    (SELECT COUNT(*) FROM clientes_com_pedidos) as total_monitoramento,
    
    -- POR FAIXA DE DIAS
    (SELECT COUNT(*) FROM clientes_com_pedidos WHERE dias_desde_ultima_compra BETWEEN 1 AND 29) as monitoramento_1_29,
    (SELECT COUNT(*) FROM clientes_com_pedidos WHERE dias_desde_ultima_compra BETWEEN 30 AND 59) as monitoramento_30_59,
    (SELECT COUNT(*) FROM clientes_com_pedidos WHERE dias_desde_ultima_compra BETWEEN 60 AND 90) as monitoramento_60_90,
    
    -- ESTATÍSTICAS DE QUALIDADE
    (SELECT COUNT(*) FROM clientes_com_pedidos WHERE email IS NOT NULL AND email != '') as com_email,
    (SELECT COUNT(*) FROM clientes_com_pedidos WHERE whatsapp IS NOT NULL AND whatsapp != '') as com_whatsapp,
    (SELECT COUNT(*) FROM clientes_com_pedidos WHERE cpf IS NOT NULL AND cpf != '') as com_cpf,
    (SELECT COUNT(*) FROM clientes_com_pedidos WHERE data_nascimento IS NOT NULL) as com_data_nascimento,
    (SELECT COUNT(*) FROM clientes_com_pedidos WHERE cidade IS NOT NULL AND cidade != '' AND estado IS NOT NULL AND estado != '') as com_endereco,
    
    -- VALOR TOTAL
    (SELECT COALESCE(SUM(valor_total_compras), 0) FROM clientes_com_pedidos) as valor_total_monitoramento;

COMMENT ON VIEW api.vw_dashboard_monitoramento IS 'Dashboard principal do sistema de monitoramento (últimos 90 dias)';

-- ========================================
-- 2. VIEW: ESTATÍSTICAS POR GRUPO
-- ========================================

CREATE OR REPLACE VIEW api.vw_monitoramento_stats AS
WITH pedidos_aprovados AS (
    SELECT 
        cliente_id,
        COUNT(*) as total_pedidos,
        MAX(data_criacao) as ultima_compra
    FROM api.prime_pedidos
    WHERE status_aprovacao = 'APROVADO'
    GROUP BY cliente_id
),
clientes_monitoramento AS (
    SELECT 
        cm.*,
        pa.total_pedidos,
        pa.ultima_compra,
        EXTRACT(DAYS FROM NOW() - pa.ultima_compra)::INTEGER as dias_desde_ultima_compra,
        CASE 
            WHEN EXTRACT(DAYS FROM NOW() - pa.ultima_compra) BETWEEN 1 AND 29 THEN 'monitoramento_1_29'
            WHEN EXTRACT(DAYS FROM NOW() - pa.ultima_compra) BETWEEN 30 AND 59 THEN 'monitoramento_30_59'
            WHEN EXTRACT(DAYS FROM NOW() - pa.ultima_compra) BETWEEN 60 AND 90 THEN 'monitoramento_60_90'
        END as grupo
    FROM api.clientes_mestre cm
    INNER JOIN pedidos_aprovados pa ON cm.id_prime = pa.cliente_id
    WHERE cm.id_prime IS NOT NULL
    AND pa.total_pedidos >= 1
    AND EXTRACT(DAYS FROM NOW() - pa.ultima_compra) BETWEEN 1 AND 90
)
SELECT 
    grupo,
    COUNT(*) as total,
    COUNT(*) FILTER (WHERE email IS NOT NULL AND email != '') as com_email,
    COUNT(*) FILTER (WHERE whatsapp IS NOT NULL AND whatsapp != '') as com_whatsapp,
    COUNT(*) FILTER (WHERE cpf IS NOT NULL AND cpf != '') as com_cpf,
    COUNT(*) FILTER (WHERE data_nascimento IS NOT NULL) as com_dn,
    COUNT(*) FILTER (WHERE cidade IS NOT NULL AND cidade != '' AND estado IS NOT NULL AND estado != '') as com_endereco,
    COUNT(*) FILTER (WHERE email IS NOT NULL AND email != '' 
                     AND whatsapp IS NOT NULL AND whatsapp != '' 
                     AND cpf IS NOT NULL AND cpf != ''
                     AND data_nascimento IS NOT NULL
                     AND cidade IS NOT NULL AND cidade != '' AND estado IS NOT NULL AND estado != '') as dados_100,
    COUNT(*) FILTER (WHERE origem_marcas::text LIKE '%sprint%' OR origem_marcas::text LIKE '%Sprint%') as em_sprint,
    COUNT(*) FILTER (WHERE origem_marcas::text LIKE '%greatpage%' OR origem_marcas::text LIKE '%GreatPage%') as em_greatpage,
    COUNT(*) FILTER (WHERE origem_marcas::text LIKE '%blacklabs%' OR origem_marcas::text LIKE '%BlackLabs%') as em_blacklabs
FROM clientes_monitoramento
GROUP BY grupo
ORDER BY 
    CASE grupo
        WHEN 'monitoramento_1_29' THEN 1
        WHEN 'monitoramento_30_59' THEN 2
        WHEN 'monitoramento_60_90' THEN 3
    END;

COMMENT ON VIEW api.vw_monitoramento_stats IS 'Estatísticas de qualidade por grupo de monitoramento';

-- ========================================
-- 3-5. VIEWS: MONITORAMENTO POR FAIXA (com campos para filtro de data)
-- ========================================

-- Nota: As views já existem em 06-views-sistema-reativacao.sql
-- Mas vamos garantir que elas suportem filtro por data de última compra

CREATE OR REPLACE VIEW api.vw_monitoramento_1_29_dias AS
SELECT 
    cm.*,
    pa.total_pedidos,
    pa.primeira_compra,
    pa.ultima_compra,
    pa.valor_total_compras,
    EXTRACT(DAYS FROM NOW() - pa.ultima_compra)::INTEGER as dias_desde_ultima_compra,
    ho.total_orcamentos,
    ho.ultimo_orcamento,
    ho.status_historico
FROM api.clientes_mestre cm
INNER JOIN (
    SELECT 
        cliente_id,
        COUNT(*) as total_pedidos,
        MAX(data_criacao) as ultima_compra,
        MIN(data_criacao) as primeira_compra,
        SUM(valor_total) as valor_total_compras
    FROM api.prime_pedidos
    WHERE status_aprovacao = 'APROVADO'
    GROUP BY cliente_id
) pa ON cm.id_prime = pa.cliente_id
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
AND pa.total_pedidos >= 1
AND EXTRACT(DAYS FROM NOW() - pa.ultima_compra) BETWEEN 1 AND 29
ORDER BY pa.ultima_compra DESC;

CREATE OR REPLACE VIEW api.vw_monitoramento_30_59_dias AS
SELECT 
    cm.*,
    pa.total_pedidos,
    pa.primeira_compra,
    pa.ultima_compra,
    pa.valor_total_compras,
    EXTRACT(DAYS FROM NOW() - pa.ultima_compra)::INTEGER as dias_desde_ultima_compra,
    ho.total_orcamentos,
    ho.ultimo_orcamento,
    ho.status_historico
FROM api.clientes_mestre cm
INNER JOIN (
    SELECT 
        cliente_id,
        COUNT(*) as total_pedidos,
        MAX(data_criacao) as ultima_compra,
        MIN(data_criacao) as primeira_compra,
        SUM(valor_total) as valor_total_compras
    FROM api.prime_pedidos
    WHERE status_aprovacao = 'APROVADO'
    GROUP BY cliente_id
) pa ON cm.id_prime = pa.cliente_id
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
AND pa.total_pedidos >= 1
AND EXTRACT(DAYS FROM NOW() - pa.ultima_compra) BETWEEN 30 AND 59
ORDER BY pa.ultima_compra DESC;

CREATE OR REPLACE VIEW api.vw_monitoramento_60_90_dias AS
SELECT 
    cm.*,
    pa.total_pedidos,
    pa.primeira_compra,
    pa.ultima_compra,
    pa.valor_total_compras,
    EXTRACT(DAYS FROM NOW() - pa.ultima_compra)::INTEGER as dias_desde_ultima_compra,
    ho.total_orcamentos,
    ho.ultimo_orcamento,
    ho.status_historico
FROM api.clientes_mestre cm
INNER JOIN (
    SELECT 
        cliente_id,
        COUNT(*) as total_pedidos,
        MAX(data_criacao) as ultima_compra,
        MIN(data_criacao) as primeira_compra,
        SUM(valor_total) as valor_total_compras
    FROM api.prime_pedidos
    WHERE status_aprovacao = 'APROVADO'
    GROUP BY cliente_id
) pa ON cm.id_prime = pa.cliente_id
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
AND pa.total_pedidos >= 1
AND EXTRACT(DAYS FROM NOW() - pa.ultima_compra) BETWEEN 60 AND 90
ORDER BY pa.ultima_compra DESC;

COMMENT ON VIEW api.vw_monitoramento_1_29_dias IS 'Clientes que compraram há 1-29 dias (com campo ultima_compra para filtro)';
COMMENT ON VIEW api.vw_monitoramento_30_59_dias IS 'Clientes que compraram há 30-59 dias (com campo ultima_compra para filtro)';
COMMENT ON VIEW api.vw_monitoramento_60_90_dias IS 'Clientes que compraram há 60-90 dias (com campo ultima_compra para filtro)';

-- ========================================
-- PERMISSÕES
-- ========================================

GRANT SELECT ON api.vw_dashboard_monitoramento TO anon, authenticated, service_role;
GRANT SELECT ON api.vw_monitoramento_stats TO anon, authenticated, service_role;
GRANT SELECT ON api.vw_monitoramento_1_29_dias TO anon, authenticated, service_role;
GRANT SELECT ON api.vw_monitoramento_30_59_dias TO anon, authenticated, service_role;
GRANT SELECT ON api.vw_monitoramento_60_90_dias TO anon, authenticated, service_role;

-- ========================================
-- FIM
-- ========================================




