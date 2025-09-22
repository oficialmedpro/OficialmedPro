-- ========================================
-- 🔍 MÉTRICAS RFV - REPLICANDO FILTROS DA INTERFACE
-- Baseado nos dados que batem: 3.247 leads, R$ 1.566.544,18
-- ========================================

-- 1. 📊 TESTAR COM FILTRO DE FUNIL 6 E 14 (mais comum)
WITH OportunidadesInterface AS (
    SELECT
        id,
        lead_id,
        value,
        gain_date
    FROM api.oportunidade_sprint
    WHERE archived = 0
        AND status = 'gain'
        AND lead_id IS NOT NULL
        AND lead_id > 0
        AND gain_date >= '2025-01-01'
        AND gain_date <= '2025-12-31'
        AND funil_id IN (6, 14)  -- Filtro que pode estar sendo aplicado
),
ClienteRFVBase AS (
    SELECT
        lead_id,
        COUNT(id) AS total_compras,
        SUM(value) AS valor_total_gasto,
        MAX(gain_date) AS ultima_compra
    FROM OportunidadesInterface
    GROUP BY lead_id
),
ClienteRFVCalculado AS (
    SELECT
        lead_id,
        total_compras,
        valor_total_gasto,
        ultima_compra,
        (CURRENT_DATE - ultima_compra::date) AS dias_recencia
    FROM ClienteRFVBase
)
SELECT
    'Métricas RFV - Filtros da Interface (Funil 6,14)' AS tipo_relatorio,
    
    -- 1. TOTAL DE CLIENTES
    COUNT(DISTINCT cr.lead_id) AS total_de_clientes,
    
    -- 2. FATURAMENTO TOTAL
    ROUND(SUM(cr.valor_total_gasto)::numeric, 2) AS faturamento_total,
    
    -- 3. TICKET MÉDIO
    ROUND(
        CASE
            WHEN COUNT(og.id) > 0 THEN SUM(og.value) / COUNT(og.id)
            ELSE 0
        END::numeric, 2
    ) AS ticket_medio,
    
    -- 4. CLIENTES ATIVOS (Recência <= 30 dias)
    COUNT(CASE WHEN cr.dias_recencia <= 30 THEN 1 ELSE NULL END) AS clientes_ativos,
    
    -- 5. CLIENTES EM ATENÇÃO (Recência 31-35 dias)
    COUNT(CASE WHEN cr.dias_recencia >= 31 AND cr.dias_recencia <= 35 THEN 1 ELSE NULL END) AS clientes_em_atencao,
    
    -- 6. CLIENTES NOVOS (Frequência = 1)
    COUNT(CASE WHEN cr.total_compras = 1 THEN 1 ELSE NULL END) AS clientes_novos,
    
    -- 7. CLIENTES EM RISCO (Recência > 35 dias)
    COUNT(CASE WHEN cr.dias_recencia > 35 THEN 1 ELSE NULL END) AS clientes_em_risco,
    
    -- DISTRIBUIÇÃO DE FREQUÊNCIA (F1-F5)
    COUNT(CASE WHEN cr.total_compras = 1 THEN 1 ELSE NULL END) AS F1_1_compra,
    COUNT(CASE WHEN cr.total_compras = 2 THEN 1 ELSE NULL END) AS F2_2_compras,
    COUNT(CASE WHEN cr.total_compras = 3 THEN 1 ELSE NULL END) AS F3_3_compras,
    COUNT(CASE WHEN cr.total_compras = 4 THEN 1 ELSE NULL END) AS F4_4_compras,
    COUNT(CASE WHEN cr.total_compras >= 5 THEN 1 ELSE NULL END) AS F5_5_ou_mais,
    
    -- DISTRIBUIÇÃO DE RECÊNCIA (R1-R5)
    COUNT(CASE WHEN cr.dias_recencia <= 30 THEN 1 ELSE NULL END) AS R1_0_30_dias,
    COUNT(CASE WHEN cr.dias_recencia BETWEEN 31 AND 60 THEN 1 ELSE NULL END) AS R2_31_60_dias,
    COUNT(CASE WHEN cr.dias_recencia BETWEEN 61 AND 90 THEN 1 ELSE NULL END) AS R3_61_90_dias,
    COUNT(CASE WHEN cr.dias_recencia BETWEEN 91 AND 120 THEN 1 ELSE NULL END) AS R4_91_120_dias,
    COUNT(CASE WHEN cr.dias_recencia > 120 THEN 1 ELSE NULL END) AS R5_mais_120_dias
    
FROM ClienteRFVCalculado cr
LEFT JOIN OportunidadesInterface og ON cr.lead_id = og.lead_id;
