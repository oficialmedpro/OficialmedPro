-- ========================================
-- 🔍 DEBUG RFV SCORES - COMPARAR COM INTERFACE
-- ========================================

-- 1. 📊 VERIFICAR DISTRIBUIÇÃO EXATA DE FREQUÊNCIA (F1-F5)
WITH ClienteCompras AS (
    SELECT
        lead_id,
        COUNT(id) AS total_compras,
        SUM(value) AS valor_total_gasto
    FROM api.oportunidade_sprint
    WHERE archived = 0 
        AND status = 'gain'
        AND gain_date >= '2025-01-01' 
        AND gain_date <= '2025-12-31'
        AND lead_id IS NOT NULL AND lead_id > 0
    GROUP BY lead_id
)
SELECT
    'Distribuição EXATA de Frequência (F1-F5)' as tipo,
    SUM(CASE WHEN total_compras = 1 THEN 1 ELSE 0 END) AS F1_exato_1_compra,
    SUM(CASE WHEN total_compras = 2 THEN 1 ELSE 0 END) AS F2_exato_2_compras,
    SUM(CASE WHEN total_compras = 3 THEN 1 ELSE 0 END) AS F3_exato_3_compras,
    SUM(CASE WHEN total_compras = 4 THEN 1 ELSE 0 END) AS F4_exato_4_compras,
    SUM(CASE WHEN total_compras >= 5 THEN 1 ELSE 0 END) AS F5_exato_5_ou_mais,
    COUNT(*) as total_clientes_unicos
FROM ClienteCompras;

-- 2. 📊 VERIFICAR DISTRIBUIÇÃO DE RECÊNCIA (R1-R5)
WITH ClienteRecencia AS (
    SELECT
        lead_id,
        CURRENT_DATE - MAX(gain_date::date) as dias_recencia
    FROM api.oportunidade_sprint
    WHERE archived = 0 
        AND status = 'gain'
        AND gain_date >= '2025-01-01' 
        AND gain_date <= '2025-12-31'
        AND lead_id IS NOT NULL AND lead_id > 0
    GROUP BY lead_id
)
SELECT
    'Distribuição EXATA de Recência (R1-R5)' as tipo,
    SUM(CASE WHEN dias_recencia <= 30 THEN 1 ELSE 0 END) AS R1_0_30_dias,
    SUM(CASE WHEN dias_recencia BETWEEN 31 AND 60 THEN 1 ELSE 0 END) AS R2_31_60_dias,
    SUM(CASE WHEN dias_recencia BETWEEN 61 AND 90 THEN 1 ELSE 0 END) AS R3_61_90_dias,
    SUM(CASE WHEN dias_recencia BETWEEN 91 AND 120 THEN 1 ELSE 0 END) AS R4_91_120_dias,
    SUM(CASE WHEN dias_recencia > 120 THEN 1 ELSE 0 END) AS R5_mais_120_dias,
    COUNT(*) as total_clientes_unicos
FROM ClienteRecencia;

-- 3. 📊 VERIFICAR DISTRIBUIÇÃO DE VALOR (V1-V5) POR QUINTIS
WITH ClienteValor AS (
    SELECT
        lead_id,
        SUM(value) AS valor_total_gasto
    FROM api.oportunidade_sprint
    WHERE archived = 0 
        AND status = 'gain'
        AND gain_date >= '2025-01-01' 
        AND gain_date <= '2025-12-31'
        AND lead_id IS NOT NULL AND lead_id > 0
    GROUP BY lead_id
),
ClienteComQuintil AS (
    SELECT
        lead_id,
        valor_total_gasto,
        NTILE(5) OVER (ORDER BY valor_total_gasto) as quintil_valor
    FROM ClienteValor
)
SELECT
    'Distribuição de Valor por Quintis (V1-V5)' as tipo,
    SUM(CASE WHEN quintil_valor = 1 THEN 1 ELSE 0 END) AS V1_quintil_1,
    SUM(CASE WHEN quintil_valor = 2 THEN 1 ELSE 0 END) AS V2_quintil_2,
    SUM(CASE WHEN quintil_valor = 3 THEN 1 ELSE 0 END) AS V3_quintil_3,
    SUM(CASE WHEN quintil_valor = 4 THEN 1 ELSE 0 END) AS V4_quintil_4,
    SUM(CASE WHEN quintil_valor = 5 THEN 1 ELSE 0 END) AS V5_quintil_5,
    COUNT(*) as total_clientes_unicos
FROM ClienteComQuintil;

-- 4. 🔍 AMOSTRA DE CLIENTES COM SCORES RFV CALCULADOS
WITH ClienteRFV AS (
    SELECT
        lead_id,
        -- RECÊNCIA
        CURRENT_DATE - MAX(gain_date::date) as dias_recencia,
        -- FREQUÊNCIA  
        COUNT(id) AS total_compras,
        -- VALOR
        SUM(value) AS valor_total_gasto
    FROM api.oportunidade_sprint
    WHERE archived = 0 
        AND status = 'gain'
        AND gain_date >= '2025-01-01' 
        AND gain_date <= '2025-12-31'
        AND lead_id IS NOT NULL AND lead_id > 0
    GROUP BY lead_id
    ORDER BY valor_total_gasto DESC
    LIMIT 20
)
SELECT
    'Amostra de 20 Clientes com Scores RFV' as tipo,
    lead_id,
    dias_recencia,
    total_compras,
    ROUND(valor_total_gasto::numeric, 2) as valor_total,
    -- SCORES COMO A INTERFACE DEVE CALCULAR
    CASE 
        WHEN dias_recencia <= 30 THEN 5  -- R5
        WHEN dias_recencia <= 60 THEN 4  -- R4
        WHEN dias_recencia <= 90 THEN 3  -- R3
        WHEN dias_recencia <= 120 THEN 2 -- R2
        ELSE 1  -- R1
    END as score_recencia,
    CASE 
        WHEN total_compras >= 5 THEN 5  -- F5
        WHEN total_compras = 4 THEN 4   -- F4
        WHEN total_compras = 3 THEN 3   -- F3
        WHEN total_compras = 2 THEN 2   -- F2
        ELSE 1  -- F1
    END as score_frequencia,
    NTILE(5) OVER (ORDER BY valor_total_gasto) as score_valor
FROM ClienteRFV;

-- 5. 🎯 VERIFICAR SEGMENTAÇÃO EXATA COMO A INTERFACE
WITH ClienteRFV AS (
    SELECT
        lead_id,
        CURRENT_DATE - MAX(gain_date::date) as dias_recencia,
        COUNT(id) AS total_compras,
        SUM(value) AS valor_total_gasto
    FROM api.oportunidade_sprint
    WHERE archived = 0 
        AND status = 'gain'
        AND gain_date >= '2025-01-01' 
        AND gain_date <= '2025-12-31'
        AND lead_id IS NOT NULL AND lead_id > 0
    GROUP BY lead_id
),
ClienteScores AS (
    SELECT
        lead_id,
        dias_recencia,
        total_compras,
        valor_total_gasto,
        -- SCORES EXATOS COMO A INTERFACE
        CASE 
            WHEN dias_recencia <= 30 THEN 5
            WHEN dias_recencia <= 60 THEN 4
            WHEN dias_recencia <= 90 THEN 3
            WHEN dias_recencia <= 120 THEN 2
            ELSE 1
        END as r,
        CASE 
            WHEN total_compras >= 5 THEN 5
            WHEN total_compras = 4 THEN 4
            WHEN total_compras = 3 THEN 3
            WHEN total_compras = 2 THEN 2
            ELSE 1
        END as f,
        NTILE(5) OVER (ORDER BY valor_total_gasto) as v
    FROM ClienteRFV
),
ClienteSegmentos AS (
    SELECT
        lead_id,
        r, f, v,
        -- SEGMENTAÇÃO EXATA COMO A INTERFACE
        CASE 
            WHEN r >= 4 AND f >= 4 AND v >= 4 THEN 'campeoes'
            WHEN r >= 4 AND f >= 3 AND v >= 3 THEN 'leais'
            WHEN r <= 2 AND f >= 3 AND v >= 3 THEN 'em_risco'
            WHEN r >= 4 AND f <= 2 AND v <= 3 THEN 'novos'
            WHEN r <= 2 AND f <= 2 THEN 'perdidos'
            WHEN r <= 3 AND f <= 2 THEN 'hibernando'
            WHEN r >= 3 AND f >= 3 AND v >= 2 THEN 'potenciais'
            ELSE 'outros'
        END as segmento
    FROM ClienteScores
)
SELECT
    'Distribuição de Segmentos (igual à interface)' as tipo,
    segmento,
    COUNT(*) as total_clientes,
    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentual
FROM ClienteSegmentos
GROUP BY segmento
ORDER BY total_clientes DESC;

-- 6. 🔍 VERIFICAR CLIENTES EM RISCO E ATENÇÃO (CRITÉRIO DO NEGÓCIO)
WITH ClienteUltimaCompra AS (
    SELECT
        lead_id,
        CURRENT_DATE - MAX(gain_date::date) as dias_recencia,
        COUNT(id) AS total_compras,
        SUM(value) AS valor_total_gasto
    FROM api.oportunidade_sprint
    WHERE archived = 0 
        AND status = 'gain'
        AND gain_date >= '2025-01-01' 
        AND gain_date <= '2025-12-31'
        AND lead_id IS NOT NULL AND lead_id > 0
    GROUP BY lead_id
)
SELECT
    'Clientes por Status (Critério Negócio)' as tipo,
    SUM(CASE WHEN dias_recencia <= 30 THEN 1 ELSE 0 END) AS ativos_ate_30_dias,
    SUM(CASE WHEN dias_recencia BETWEEN 31 AND 35 THEN 1 ELSE 0 END) AS atencao_31_35_dias,
    SUM(CASE WHEN dias_recencia > 35 THEN 1 ELSE 0 END) AS risco_mais_35_dias,
    COUNT(*) as total_clientes
FROM ClienteUltimaCompra;

-- 7. 📊 RESUMO GERAL PARA COMPARAR COM INTERFACE
WITH ClienteRFV AS (
    SELECT
        lead_id,
        CURRENT_DATE - MAX(gain_date::date) as dias_recencia,
        COUNT(id) AS total_compras,
        SUM(value) AS valor_total_gasto
    FROM api.oportunidade_sprint
    WHERE archived = 0 
        AND status = 'gain'
        AND gain_date >= '2025-01-01' 
        AND gain_date <= '2025-12-31'
        AND lead_id IS NOT NULL AND lead_id > 0
    GROUP BY lead_id
)
SELECT
    'RESUMO GERAL - Comparar com Interface' as tipo,
    COUNT(*) as total_clientes_unicos,
    SUM(total_compras) as total_oportunidades_ganhas,
    ROUND(SUM(valor_total_gasto)::numeric, 2) as faturamento_total,
    ROUND(AVG(total_compras)::numeric, 2) as ticket_medio_compras,
    ROUND(AVG(valor_total_gasto)::numeric, 2) as ticket_medio_valor,
    SUM(CASE WHEN total_compras = 1 THEN 1 ELSE 0 END) as clientes_novos_f1,
    SUM(CASE WHEN dias_recencia <= 30 THEN 1 ELSE 0 END) as clientes_ativos,
    SUM(CASE WHEN dias_recencia BETWEEN 31 AND 35 THEN 1 ELSE 0 END) as clientes_atencao,
    SUM(CASE WHEN dias_recencia > 35 THEN 1 ELSE 0 END) as clientes_risco
FROM ClienteRFV;
