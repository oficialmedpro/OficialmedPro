-- ========================================
-- 🔍 ANÁLISE COMPLETA RFV - TODAS AS MÉTRICAS
-- ========================================

-- 1. 📊 ESTATÍSTICAS GERAIS DE RECÊNCIA (R)
-- Calcular dias desde última compra para cada cliente
WITH ClienteUltimaCompra AS (
    SELECT
        lead_id,
        MAX(gain_date::date) as ultima_compra,
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
    'Estatísticas de Recência (Ano 2025)' as tipo,
    COUNT(*) AS total_clientes,
    MIN(dias_recencia) AS min_dias_recencia,
    MAX(dias_recencia) AS max_dias_recencia,
    AVG(dias_recencia) AS avg_dias_recencia,
    PERCENTILE_CONT(0.2) WITHIN GROUP (ORDER BY dias_recencia) AS p20_recencia,
    PERCENTILE_CONT(0.4) WITHIN GROUP (ORDER BY dias_recencia) AS p40_recencia,
    PERCENTILE_CONT(0.6) WITHIN GROUP (ORDER BY dias_recencia) AS p60_recencia,
    PERCENTILE_CONT(0.8) WITHIN GROUP (ORDER BY dias_recencia) AS p80_recencia
FROM ClienteUltimaCompra;

-- 2. 📊 DISTRIBUIÇÃO DE RECÊNCIA (R1, R2, R3, R4, R5)
WITH ClienteUltimaCompra AS (
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
    'Distribuição de Recência (Ano 2025)' as tipo,
    SUM(CASE WHEN dias_recencia <= 30 THEN 1 ELSE 0 END) AS R1_clientes_0_30_dias,
    SUM(CASE WHEN dias_recencia BETWEEN 31 AND 60 THEN 1 ELSE 0 END) AS R2_clientes_31_60_dias,
    SUM(CASE WHEN dias_recencia BETWEEN 61 AND 90 THEN 1 ELSE 0 END) AS R3_clientes_61_90_dias,
    SUM(CASE WHEN dias_recencia BETWEEN 91 AND 120 THEN 1 ELSE 0 END) AS R4_clientes_91_120_dias,
    SUM(CASE WHEN dias_recencia > 120 THEN 1 ELSE 0 END) AS R5_clientes_120_mais_dias
FROM ClienteUltimaCompra;

-- 3. 📊 ESTATÍSTICAS GERAIS DE VALOR (V)
-- Calcular valor total gasto por cada cliente
WITH ClienteValor AS (
    SELECT
        lead_id,
        SUM(value) AS valor_total_gasto,
        COUNT(id) AS total_compras
    FROM api.oportunidade_sprint
    WHERE archived = 0 
        AND status = 'gain'
        AND gain_date >= '2025-01-01' 
        AND gain_date <= '2025-12-31'
        AND lead_id IS NOT NULL AND lead_id > 0
    GROUP BY lead_id
)
SELECT
    'Estatísticas de Valor (Ano 2025)' as tipo,
    COUNT(*) AS total_clientes,
    MIN(valor_total_gasto) AS min_valor_gasto,
    MAX(valor_total_gasto) AS max_valor_gasto,
    AVG(valor_total_gasto) AS avg_valor_gasto,
    SUM(valor_total_gasto) AS faturamento_total,
    PERCENTILE_CONT(0.2) WITHIN GROUP (ORDER BY valor_total_gasto) AS p20_valor,
    PERCENTILE_CONT(0.4) WITHIN GROUP (ORDER BY valor_total_gasto) AS p40_valor,
    PERCENTILE_CONT(0.6) WITHIN GROUP (ORDER BY valor_total_gasto) AS p60_valor,
    PERCENTILE_CONT(0.8) WITHIN GROUP (ORDER BY valor_total_gasto) AS p80_valor
FROM ClienteValor;

-- 4. 📊 DISTRIBUIÇÃO DE VALOR (V1, V2, V3, V4, V5)
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
PercentisValor AS (
    SELECT
        valor_total_gasto,
        NTILE(5) OVER (ORDER BY valor_total_gasto) as quintil_valor
    FROM ClienteValor
)
SELECT
    'Distribuição de Valor por Quintis (Ano 2025)' as tipo,
    SUM(CASE WHEN quintil_valor = 1 THEN 1 ELSE 0 END) AS V1_clientes_quintil_1,
    SUM(CASE WHEN quintil_valor = 2 THEN 1 ELSE 0 END) AS V2_clientes_quintil_2,
    SUM(CASE WHEN quintil_valor = 3 THEN 1 ELSE 0 END) AS V3_clientes_quintil_3,
    SUM(CASE WHEN quintil_valor = 4 THEN 1 ELSE 0 END) AS V4_clientes_quintil_4,
    SUM(CASE WHEN quintil_valor = 5 THEN 1 ELSE 0 END) AS V5_clientes_quintil_5
FROM PercentisValor;

-- 5. 🎯 SEGMENTAÇÃO RFV COMPLETA
-- Combinar R, F, V para classificar clientes em segmentos
WITH ClienteRFV AS (
    SELECT
        lead_id,
        -- RECÊNCIA: dias desde última compra
        CURRENT_DATE - MAX(gain_date::date) as dias_recencia,
        -- FREQUÊNCIA: número de compras
        COUNT(id) AS total_compras,
        -- VALOR: valor total gasto
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
        -- SCORE RECÊNCIA (invertido: menor recência = score maior)
        CASE 
            WHEN dias_recencia <= 30 THEN 5  -- R5: muito recente
            WHEN dias_recencia <= 60 THEN 4  -- R4: recente
            WHEN dias_recencia <= 90 THEN 3  -- R3: médio
            WHEN dias_recencia <= 120 THEN 2 -- R2: antigo
            ELSE 1  -- R1: muito antigo
        END as score_recencia,
        -- SCORE FREQUÊNCIA (direto: mais compras = score maior)
        CASE 
            WHEN total_compras >= 5 THEN 5  -- F5: 5+ compras
            WHEN total_compras = 4 THEN 4   -- F4: 4 compras
            WHEN total_compras = 3 THEN 3   -- F3: 3 compras
            WHEN total_compras = 2 THEN 2   -- F2: 2 compras
            ELSE 1  -- F1: 1 compra
        END as score_frequencia,
        -- SCORE VALOR (por quintil)
        NTILE(5) OVER (ORDER BY valor_total_gasto) as score_valor
    FROM ClienteRFV
),
ClienteSegmentos AS (
    SELECT
        lead_id,
        dias_recencia,
        total_compras,
        valor_total_gasto,
        score_recencia,
        score_frequencia,
        score_valor,
        -- CLASSIFICAÇÃO EM SEGMENTOS
        CASE 
            WHEN score_recencia >= 4 AND score_frequencia >= 4 AND score_valor >= 4 THEN 'campeoes'
            WHEN score_recencia >= 4 AND score_frequencia >= 3 AND score_valor >= 3 THEN 'leais'
            WHEN score_recencia <= 2 AND score_frequencia >= 3 AND score_valor >= 3 THEN 'em_risco'
            WHEN score_recencia >= 4 AND score_frequencia <= 2 AND score_valor <= 3 THEN 'novos'
            WHEN score_recencia <= 2 AND score_frequencia <= 2 THEN 'perdidos'
            WHEN score_recencia <= 3 AND score_frequencia <= 2 THEN 'hibernando'
            WHEN score_recencia >= 3 AND score_frequencia >= 3 AND score_valor >= 2 THEN 'potenciais'
            ELSE 'outros'
        END as segmento_rfv
    FROM ClienteScores
)
SELECT
    'Distribuição de Segmentos RFV (Ano 2025)' as tipo,
    segmento_rfv,
    COUNT(*) as total_clientes,
    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentual,
    AVG(dias_recencia) as avg_recencia_dias,
    AVG(total_compras) as avg_frequencia,
    AVG(valor_total_gasto) as avg_valor_gasto
FROM ClienteSegmentos
GROUP BY segmento_rfv
ORDER BY total_clientes DESC;

-- 6. 🔍 TOP 20 CLIENTES MAIS VALIOSOS (R+F+V)
WITH ClienteRFV AS (
    SELECT
        lead_id,
        CURRENT_DATE - MAX(gain_date::date) as dias_recencia,
        COUNT(id) AS total_compras,
        SUM(value) AS valor_total_gasto,
        MAX(gain_date) as ultima_compra
    FROM api.oportunidade_sprint
    WHERE archived = 0 
        AND status = 'gain'
        AND gain_date >= '2025-01-01' 
        AND gain_date <= '2025-12-31'
        AND lead_id IS NOT NULL AND lead_id > 0
    GROUP BY lead_id
)
SELECT 
    'Top 20 Clientes Mais Valiosos (Ano 2025)' as tipo,
    lead_id,
    total_compras as frequencia,
    ROUND(valor_total_gasto::numeric, 2) as valor_total,
    dias_recencia,
    ultima_compra::date as data_ultima_compra,
    -- Score composto (recência invertida + frequência + valor normalizado)
    (CASE WHEN dias_recencia <= 30 THEN 5 ELSE 1 END) + 
    total_compras + 
    (CASE WHEN valor_total_gasto >= 1000 THEN 5 ELSE 1 END) as score_composto
FROM ClienteRFV
ORDER BY valor_total_gasto DESC, total_compras DESC, dias_recencia ASC
LIMIT 20;

-- 7. 📈 COMPARAÇÃO POR PERÍODO (Jul-Set 2025 vs Ano Todo)
WITH ClienteAnoTodo AS (
    SELECT
        lead_id,
        COUNT(id) AS compras_ano_todo,
        SUM(value) AS valor_ano_todo
    FROM api.oportunidade_sprint
    WHERE archived = 0 
        AND status = 'gain'
        AND gain_date >= '2025-01-01' 
        AND gain_date <= '2025-12-31'
        AND lead_id IS NOT NULL AND lead_id > 0
    GROUP BY lead_id
),
ClienteJulSet AS (
    SELECT
        lead_id,
        COUNT(id) AS compras_jul_set,
        SUM(value) AS valor_jul_set
    FROM api.oportunidade_sprint
    WHERE archived = 0 
        AND status = 'gain'
        AND gain_date >= '2025-07-01' 
        AND gain_date <= '2025-09-30'
        AND lead_id IS NOT NULL AND lead_id > 0
    GROUP BY lead_id
)
SELECT
    'Comparação Períodos (Ano Todo vs Jul-Set 2025)' as tipo,
    'Ano Todo' as periodo,
    COUNT(DISTINCT lead_id) as total_clientes,
    SUM(compras_ano_todo) as total_compras,
    ROUND(SUM(valor_ano_todo)::numeric, 2) as faturamento_total,
    ROUND(AVG(compras_ano_todo)::numeric, 2) as avg_compras_por_cliente,
    ROUND(AVG(valor_ano_todo)::numeric, 2) as avg_valor_por_cliente
FROM ClienteAnoTodo
UNION ALL
SELECT
    'Comparação Períodos (Ano Todo vs Jul-Set 2025)' as tipo,
    'Jul-Set 2025' as periodo,
    COUNT(DISTINCT lead_id) as total_clientes,
    SUM(compras_jul_set) as total_compras,
    ROUND(SUM(valor_jul_set)::numeric, 2) as faturamento_total,
    ROUND(AVG(compras_jul_set)::numeric, 2) as avg_compras_por_cliente,
    ROUND(AVG(valor_jul_set)::numeric, 2) as avg_valor_por_cliente
FROM ClienteJulSet;

-- 8. 🚨 CLIENTES EM RISCO DETALHADO
-- Clientes que não compram há mais de 35 dias (critério do negócio)
WITH ClienteUltimaCompra AS (
    SELECT
        lead_id,
        MAX(gain_date::date) as ultima_compra,
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
    'Clientes em Risco (>35 dias sem comprar)' as categoria,
    COUNT(*) as total_clientes,
    ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM ClienteUltimaCompra), 2) as percentual,
    ROUND(AVG(dias_recencia)::numeric, 1) as avg_dias_sem_comprar,
    ROUND(AVG(valor_total_gasto)::numeric, 2) as avg_valor_historico
FROM ClienteUltimaCompra
WHERE dias_recencia > 35;
