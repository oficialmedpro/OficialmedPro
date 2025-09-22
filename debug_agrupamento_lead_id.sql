-- ========================================
-- 🔍 AGRUPAMENTO DE OPORTUNIDADES POR lead_id
-- ========================================

-- 1. 📊 AGRUPAMENTO SIMPLES - CONTAR OPORTUNIDADES POR lead_id
SELECT 
    lead_id,
    COUNT(*) as total_oportunidades,
    SUM(value) as valor_total_gasto
FROM api.oportunidade_sprint
WHERE archived = 0 
    AND lead_id IS NOT NULL 
    AND lead_id > 0
GROUP BY lead_id
ORDER BY total_oportunidades DESC
LIMIT 20;

-- 2. 📊 AGRUPAMENTO COM STATUS - CONTAR OPORTUNIDADES POR lead_id E STATUS
SELECT 
    lead_id,
    status,
    COUNT(*) as total_oportunidades,
    SUM(value) as valor_total_gasto
FROM api.oportunidade_sprint
WHERE archived = 0 
    AND lead_id IS NOT NULL 
    AND lead_id > 0
GROUP BY lead_id, status
ORDER BY lead_id, total_oportunidades DESC
LIMIT 30;

-- 3. 📊 AGRUPAMENTO COM DATAS - CONTAR OPORTUNIDADES POR lead_id COM DATAS
SELECT 
    lead_id,
    COUNT(*) as total_oportunidades,
    SUM(value) as valor_total_gasto,
    MIN(create_date) as primeira_oportunidade,
    MAX(create_date) as ultima_oportunidade,
    MIN(gain_date) as primeira_ganha,
    MAX(gain_date) as ultima_ganha
FROM api.oportunidade_sprint
WHERE archived = 0 
    AND lead_id IS NOT NULL 
    AND lead_id > 0
GROUP BY lead_id
ORDER BY total_oportunidades DESC
LIMIT 15;

-- 4. 📊 AGRUPAMENTO COM FREQUÊNCIA - MOSTRAR DISTRIBUIÇÃO DE FREQUÊNCIA
SELECT 
    total_oportunidades,
    COUNT(*) as quantos_leads_tem_essa_frequencia
FROM (
    SELECT 
        lead_id,
        COUNT(*) as total_oportunidades
    FROM api.oportunidade_sprint
    WHERE archived = 0 
        AND lead_id IS NOT NULL 
        AND lead_id > 0
    GROUP BY lead_id
) as frequencias
GROUP BY total_oportunidades
ORDER BY total_oportunidades;

-- 5. 📊 AGRUPAMENTO COM STATUS 'gain' - APENAS OPORTUNIDADES GANHAS
SELECT 
    lead_id,
    COUNT(*) as total_oportunidades_ganhas,
    SUM(value) as valor_total_gasto,
    MIN(gain_date) as primeira_ganha,
    MAX(gain_date) as ultima_ganha
FROM api.oportunidade_sprint
WHERE archived = 0 
    AND status = 'gain'
    AND lead_id IS NOT NULL 
    AND lead_id > 0
GROUP BY lead_id
ORDER BY total_oportunidades_ganhas DESC
LIMIT 20;
