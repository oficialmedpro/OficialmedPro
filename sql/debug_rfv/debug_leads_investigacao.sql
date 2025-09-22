-- ========================================
-- 🔍 INVESTIGAÇÃO - POR QUE LEADS GANHOS = LEADS 2025?
-- ========================================

-- 1. 📊 VERIFICAR DISTRIBUIÇÃO DE STATUS
SELECT 
    'Distribuição de Status' as tipo,
    status,
    COUNT(*) as total_registros,
    COUNT(DISTINCT lead_id) as leads_unicos
FROM api.oportunidade_sprint
WHERE archived = 0 
    AND lead_id IS NOT NULL 
    AND lead_id > 0
GROUP BY status
ORDER BY leads_unicos DESC;

-- 2. 📊 VERIFICAR DISTRIBUIÇÃO POR ANO
SELECT 
    'Distribuição por Ano' as tipo,
    EXTRACT(YEAR FROM gain_date) as ano,
    COUNT(*) as total_registros,
    COUNT(DISTINCT lead_id) as leads_unicos
FROM api.oportunidade_sprint
WHERE archived = 0 
    AND lead_id IS NOT NULL 
    AND lead_id > 0
    AND gain_date IS NOT NULL
GROUP BY EXTRACT(YEAR FROM gain_date)
ORDER BY ano DESC;

-- 3. 📊 VERIFICAR DISTRIBUIÇÃO POR ANO E STATUS
SELECT 
    'Distribuição por Ano e Status' as tipo,
    EXTRACT(YEAR FROM gain_date) as ano,
    status,
    COUNT(*) as total_registros,
    COUNT(DISTINCT lead_id) as leads_unicos
FROM api.oportunidade_sprint
WHERE archived = 0 
    AND lead_id IS NOT NULL 
    AND lead_id > 0
    AND gain_date IS NOT NULL
GROUP BY EXTRACT(YEAR FROM gain_date), status
ORDER BY ano DESC, leads_unicos DESC;

-- 4. 📊 VERIFICAR SE HÁ DADOS DE 2025
SELECT 
    'Verificação de Dados 2025' as tipo,
    MIN(gain_date) as data_mais_antiga,
    MAX(gain_date) as data_mais_recente,
    COUNT(*) as total_registros_2025,
    COUNT(DISTINCT lead_id) as leads_unicos_2025
FROM api.oportunidade_sprint
WHERE archived = 0 
    AND lead_id IS NOT NULL 
    AND lead_id > 0
    AND gain_date >= '2025-01-01' 
    AND gain_date <= '2025-12-31';

-- 5. 📊 VERIFICAR SE HÁ DADOS DE 2024
SELECT 
    'Verificação de Dados 2024' as tipo,
    MIN(gain_date) as data_mais_antiga,
    MAX(gain_date) as data_mais_recente,
    COUNT(*) as total_registros_2024,
    COUNT(DISTINCT lead_id) as leads_unicos_2024
FROM api.oportunidade_sprint
WHERE archived = 0 
    AND lead_id IS NOT NULL 
    AND lead_id > 0
    AND gain_date >= '2024-01-01' 
    AND gain_date <= '2024-12-31';

-- 6. 📊 VERIFICAR SE HÁ DADOS DE 2023
SELECT 
    'Verificação de Dados 2023' as tipo,
    MIN(gain_date) as data_mais_antiga,
    MAX(gain_date) as data_mais_recente,
    COUNT(*) as total_registros_2023,
    COUNT(DISTINCT lead_id) as leads_unicos_2023
FROM api.oportunidade_sprint
WHERE archived = 0 
    AND lead_id IS NOT NULL 
    AND lead_id > 0
    AND gain_date >= '2023-01-01' 
    AND gain_date <= '2023-12-31';

-- 7. 📊 VERIFICAR STATUS 'gain' vs OUTROS STATUS
SELECT 
    'Comparação Status gain vs Outros' as tipo,
    CASE 
        WHEN status = 'gain' THEN 'GANHOS (gain)'
        ELSE 'OUTROS STATUS'
    END as categoria,
    COUNT(*) as total_registros,
    COUNT(DISTINCT lead_id) as leads_unicos
FROM api.oportunidade_sprint
WHERE archived = 0 
    AND lead_id IS NOT NULL 
    AND lead_id > 0
GROUP BY CASE 
    WHEN status = 'gain' THEN 'GANHOS (gain)'
    ELSE 'OUTROS STATUS'
END;

-- 8. 📊 VERIFICAR SE HÁ DADOS SEM gain_date
SELECT 
    'Verificação de Dados sem gain_date' as tipo,
    CASE 
        WHEN gain_date IS NULL THEN 'gain_date NULL'
        WHEN gain_date = '' THEN 'gain_date vazio'
        ELSE 'gain_date válido'
    END as status_gain_date,
    COUNT(*) as total_registros,
    COUNT(DISTINCT lead_id) as leads_unicos
FROM api.oportunidade_sprint
WHERE archived = 0 
    AND lead_id IS NOT NULL 
    AND lead_id > 0
GROUP BY CASE 
    WHEN gain_date IS NULL THEN 'gain_date NULL'
    WHEN gain_date = '' THEN 'gain_date vazio'
    ELSE 'gain_date válido'
END;
