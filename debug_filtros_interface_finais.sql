-- ========================================
-- 🔍 DEBUG FINAL - FILTROS EXATOS DA INTERFACE
-- Investigar filtros adicionais que podem estar sendo aplicados
-- ========================================

-- 1. 📊 TESTAR COM PERÍODO ESPECÍFICO (não ano todo)
-- Interface pode estar usando período específico, não 2025 inteiro
SELECT 
    'Período Específico vs Ano Todo' as tipo,
    'Ano Todo 2025' as periodo,
    COUNT(*) as total_oportunidades,
    COUNT(DISTINCT lead_id) as leads_unicos,
    SUM(value) as faturamento_total
FROM api.oportunidade_sprint
WHERE archived = 0
    AND status = 'gain'
    AND lead_id IS NOT NULL
    AND lead_id > 0
    AND gain_date >= '2025-01-01'
    AND gain_date <= '2025-12-31'
    AND funil_id IN (6, 14)

UNION ALL

SELECT 
    'Período Específico vs Ano Todo' as tipo,
    'Últimos 6 meses' as periodo,
    COUNT(*) as total_oportunidades,
    COUNT(DISTINCT lead_id) as leads_unicos,
    SUM(value) as faturamento_total
FROM api.oportunidade_sprint
WHERE archived = 0
    AND status = 'gain'
    AND lead_id IS NOT NULL
    AND lead_id > 0
    AND gain_date >= '2025-07-01'
    AND gain_date <= '2025-12-31'
    AND funil_id IN (6, 14)

UNION ALL

SELECT 
    'Período Específico vs Ano Todo' as tipo,
    'Últimos 3 meses' as periodo,
    COUNT(*) as total_oportunidades,
    COUNT(DISTINCT lead_id) as leads_unicos,
    SUM(value) as faturamento_total
FROM api.oportunidade_sprint
WHERE archived = 0
    AND status = 'gain'
    AND lead_id IS NOT NULL
    AND lead_id > 0
    AND gain_date >= '2025-10-01'
    AND gain_date <= '2025-12-31'
    AND funil_id IN (6, 14);

-- 2. 📊 TESTAR COM FILTROS DE UNIDADE
-- Interface pode estar aplicando filtro de unidade específica
SELECT 
    'Filtros de Unidade' as tipo,
    'Sem filtro unidade' as filtro,
    COUNT(*) as total_oportunidades,
    COUNT(DISTINCT lead_id) as leads_unicos,
    SUM(value) as faturamento_total
FROM api.oportunidade_sprint
WHERE archived = 0
    AND status = 'gain'
    AND lead_id IS NOT NULL
    AND lead_id > 0
    AND gain_date >= '2025-01-01'
    AND gain_date <= '2025-12-31'
    AND funil_id IN (6, 14)

UNION ALL

SELECT 
    'Filtros de Unidade' as tipo,
    'Unidade específica' as filtro,
    COUNT(*) as total_oportunidades,
    COUNT(DISTINCT lead_id) as leads_unicos,
    SUM(value) as faturamento_total
FROM api.oportunidade_sprint
WHERE archived = 0
    AND status = 'gain'
    AND lead_id IS NOT NULL
    AND lead_id > 0
    AND gain_date >= '2025-01-01'
    AND gain_date <= '2025-12-31'
    AND funil_id IN (6, 14)
    AND unidade_id IS NOT NULL
    AND unidade_id != '';

-- 3. 📊 TESTAR COM FILTROS DE VENDEDOR
-- Interface pode estar aplicando filtro de vendedor específico
SELECT 
    'Filtros de Vendedor' as tipo,
    'Sem filtro vendedor' as filtro,
    COUNT(*) as total_oportunidades,
    COUNT(DISTINCT lead_id) as leads_unicos,
    SUM(value) as faturamento_total
FROM api.oportunidade_sprint
WHERE archived = 0
    AND status = 'gain'
    AND lead_id IS NOT NULL
    AND lead_id > 0
    AND gain_date >= '2025-01-01'
    AND gain_date <= '2025-12-31'
    AND funil_id IN (6, 14)

UNION ALL

SELECT 
    'Filtros de Vendedor' as tipo,
    'Vendedor específico' as filtro,
    COUNT(*) as total_oportunidades,
    COUNT(DISTINCT lead_id) as leads_unicos,
    SUM(value) as faturamento_total
FROM api.oportunidade_sprint
WHERE archived = 0
    AND status = 'gain'
    AND lead_id IS NOT NULL
    AND lead_id > 0
    AND gain_date >= '2025-01-01'
    AND gain_date <= '2025-12-31'
    AND funil_id IN (6, 14)
    AND user_id IS NOT NULL
    AND user_id > 0;

-- 4. 📊 TESTAR COM FILTROS DE ORIGEM
-- Interface pode estar aplicando filtro de origem específica
SELECT 
    'Filtros de Origem' as tipo,
    'Sem filtro origem' as filtro,
    COUNT(*) as total_oportunidades,
    COUNT(DISTINCT lead_id) as leads_unicos,
    SUM(value) as faturamento_total
FROM api.oportunidade_sprint
WHERE archived = 0
    AND status = 'gain'
    AND lead_id IS NOT NULL
    AND lead_id > 0
    AND gain_date >= '2025-01-01'
    AND gain_date <= '2025-12-31'
    AND funil_id IN (6, 14)

UNION ALL

SELECT 
    'Filtros de Origem' as tipo,
    'Origem específica' as filtro,
    COUNT(*) as total_oportunidades,
    COUNT(DISTINCT lead_id) as leads_unicos,
    SUM(value) as faturamento_total
FROM api.oportunidade_sprint
WHERE archived = 0
    AND status = 'gain'
    AND lead_id IS NOT NULL
    AND lead_id > 0
    AND gain_date >= '2025-01-01'
    AND gain_date <= '2025-12-31'
    AND funil_id IN (6, 14)
    AND origin_id IS NOT NULL
    AND origin_id > 0;

-- 5. 📊 TESTAR COM COMBINAÇÃO DE FILTROS
-- Interface pode estar usando combinação de filtros
SELECT 
    'Combinação de Filtros' as tipo,
    'Funil 6,14 + Unidade + Vendedor + Origem' as filtro,
    COUNT(*) as total_oportunidades,
    COUNT(DISTINCT lead_id) as leads_unicos,
    SUM(value) as faturamento_total
FROM api.oportunidade_sprint
WHERE archived = 0
    AND status = 'gain'
    AND lead_id IS NOT NULL
    AND lead_id > 0
    AND gain_date >= '2025-01-01'
    AND gain_date <= '2025-12-31'
    AND funil_id IN (6, 14)
    AND unidade_id IS NOT NULL
    AND unidade_id != ''
    AND user_id IS NOT NULL
    AND user_id > 0
    AND origin_id IS NOT NULL
    AND origin_id > 0;
