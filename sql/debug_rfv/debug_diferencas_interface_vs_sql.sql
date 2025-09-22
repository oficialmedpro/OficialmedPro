-- ========================================
-- 🔍 DEBUG - DIFERENÇAS INTERFACE vs SQL
-- Investigar por que os números não batem
-- ========================================

-- 1. 📊 VERIFICAR SE HÁ FILTROS DE DATA DIFERENTES
-- Interface pode estar usando período específico (não ano todo)
SELECT 
    'Verificação de Períodos' as tipo,
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

UNION ALL

SELECT 
    'Verificação de Períodos' as tipo,
    'Últimos 30 dias' as periodo,
    COUNT(*) as total_oportunidades,
    COUNT(DISTINCT lead_id) as leads_unicos,
    SUM(value) as faturamento_total
FROM api.oportunidade_sprint
WHERE archived = 0
    AND status = 'gain'
    AND lead_id IS NOT NULL
    AND lead_id > 0
    AND gain_date >= CURRENT_DATE - INTERVAL '30 days'

UNION ALL

SELECT 
    'Verificação de Períodos' as tipo,
    'Últimos 90 dias' as periodo,
    COUNT(*) as total_oportunidades,
    COUNT(DISTINCT lead_id) as leads_unicos,
    SUM(value) as faturamento_total
FROM api.oportunidade_sprint
WHERE archived = 0
    AND status = 'gain'
    AND lead_id IS NOT NULL
    AND lead_id > 0
    AND gain_date >= CURRENT_DATE - INTERVAL '90 days';

-- 2. 📊 VERIFICAR SE HÁ FILTROS DE FUNIL/UNIDADE/VENDEDOR
-- Interface pode estar aplicando filtros específicos
SELECT 
    'Verificação de Filtros' as tipo,
    'Sem filtros' as filtro,
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

UNION ALL

SELECT 
    'Verificação de Filtros' as tipo,
    'Funil 6 e 14' as filtro,
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
    AND funil_id IN (6, 14);

-- 3. 📊 VERIFICAR DISTRIBUIÇÃO DE FREQUÊNCIA COM FILTROS
-- Para entender por que F2, F3, F4, F5 estão diferentes
WITH OportunidadesFiltradas AS (
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
ClienteFrequencia AS (
    SELECT
        lead_id,
        COUNT(*) AS total_compras
    FROM OportunidadesFiltradas
    GROUP BY lead_id
)
SELECT 
    'Distribuição Frequência com Filtros' as tipo,
    SUM(CASE WHEN total_compras = 1 THEN 1 ELSE 0 END) AS F1_1_compra,
    SUM(CASE WHEN total_compras = 2 THEN 1 ELSE 0 END) AS F2_2_compras,
    SUM(CASE WHEN total_compras = 3 THEN 1 ELSE 0 END) AS F3_3_compras,
    SUM(CASE WHEN total_compras = 4 THEN 1 ELSE 0 END) AS F4_4_compras,
    SUM(CASE WHEN total_compras >= 5 THEN 1 ELSE 0 END) AS F5_5_ou_mais,
    COUNT(*) as total_clientes
FROM ClienteFrequencia;

-- 4. 📊 VERIFICAR SE HÁ PROBLEMA COM gain_date vs create_date
-- Interface pode estar usando create_date em vez de gain_date
SELECT 
    'Verificação de Datas' as tipo,
    'Usando gain_date' as tipo_data,
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

UNION ALL

SELECT 
    'Verificação de Datas' as tipo,
    'Usando create_date' as tipo_data,
    COUNT(*) as total_oportunidades,
    COUNT(DISTINCT lead_id) as leads_unicos,
    SUM(value) as faturamento_total
FROM api.oportunidade_sprint
WHERE archived = 0
    AND status = 'gain'
    AND lead_id IS NOT NULL
    AND lead_id > 0
    AND create_date >= '2025-01-01'
    AND create_date <= '2025-12-31';

-- 5. 📊 VERIFICAR SE HÁ DADOS DUPLICADOS OU PROBLEMAS DE INTEGRIDADE
SELECT 
    'Verificação de Integridade' as tipo,
    COUNT(*) as total_registros,
    COUNT(DISTINCT id) as registros_unicos,
    COUNT(DISTINCT lead_id) as leads_unicos,
    SUM(value) as faturamento_total,
    AVG(value) as valor_medio,
    MIN(value) as valor_minimo,
    MAX(value) as valor_maximo
FROM api.oportunidade_sprint
WHERE archived = 0
    AND status = 'gain'
    AND lead_id IS NOT NULL
    AND lead_id > 0
    AND gain_date >= '2025-01-01'
    AND gain_date <= '2025-12-31';
