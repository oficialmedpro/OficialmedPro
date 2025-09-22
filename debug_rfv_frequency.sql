-- 🔍 SQL PARA DEBUG: Análise de Frequência RFV
-- Verificar quantos clientes únicos temos e suas frequências reais

-- 1. CONTAR TOTAL DE CLIENTES ÚNICOS POR lead_id
SELECT 
    'Total de clientes únicos' as metrica,
    COUNT(DISTINCT lead_id) as quantidade
FROM api.oportunidade_sprint 
WHERE archived = 0 
    AND status = 'gain'
    AND gain_date >= '2025-01-01' 
    AND gain_date <= '2025-12-31';

-- 2. FREQUÊNCIA DE COMPRAS POR CLIENTE (agrupado por lead_id)
SELECT 
    'Frequência de compras por cliente' as metrica,
    COUNT(*) as total_oportunidades,
    COUNT(DISTINCT lead_id) as clientes_unicos,
    ROUND(AVG(compras_por_cliente), 2) as media_compras_por_cliente,
    MAX(compras_por_cliente) as max_compras_cliente,
    MIN(compras_por_cliente) as min_compras_cliente
FROM (
    SELECT 
        lead_id,
        COUNT(*) as compras_por_cliente
    FROM api.oportunidade_sprint 
    WHERE archived = 0 
        AND status = 'gain'
        AND gain_date >= '2025-01-01' 
        AND gain_date <= '2025-12-31'
    GROUP BY lead_id
) as frequencias;

-- 3. DISTRIBUIÇÃO DETALHADA DE FREQUÊNCIAS (F1, F2, F3, F4, F5)
SELECT 
    CASE 
        WHEN compras_por_cliente = 1 THEN 'F1 - 1 compra'
        WHEN compras_por_cliente = 2 THEN 'F2 - 2 compras'
        WHEN compras_por_cliente = 3 THEN 'F3 - 3 compras'
        WHEN compras_por_cliente = 4 THEN 'F4 - 4 compras'
        WHEN compras_por_cliente >= 5 THEN 'F5 - 5+ compras'
        ELSE 'Outros'
    END as frequencia_categoria,
    COUNT(*) as quantidade_clientes,
    ROUND((COUNT(*) * 100.0 / SUM(COUNT(*)) OVER()), 2) as percentual
FROM (
    SELECT 
        lead_id,
        COUNT(*) as compras_por_cliente
    FROM api.oportunidade_sprint 
    WHERE archived = 0 
        AND status = 'gain'
        AND gain_date >= '2025-01-01' 
        AND gain_date <= '2025-12-31'
    GROUP BY lead_id
) as frequencias
GROUP BY 
    CASE 
        WHEN compras_por_cliente = 1 THEN 'F1 - 1 compra'
        WHEN compras_por_cliente = 2 THEN 'F2 - 2 compras'
        WHEN compras_por_cliente = 3 THEN 'F3 - 3 compras'
        WHEN compras_por_cliente = 4 THEN 'F4 - 4 compras'
        WHEN compras_por_cliente >= 5 THEN 'F5 - 5+ compras'
        ELSE 'Outros'
    END
ORDER BY quantidade_clientes DESC;

-- 4. TOP 10 CLIENTES COM MAIS COMPRAS (para verificar se há clientes frequentes)
SELECT 
    lead_id,
    COUNT(*) as total_compras,
    SUM(value) as valor_total_gasto,
    ROUND(AVG(value), 2) as ticket_medio,
    MIN(gain_date) as primeira_compra,
    MAX(gain_date) as ultima_compra
FROM api.oportunidade_sprint 
WHERE archived = 0 
    AND status = 'gain'
    AND gain_date >= '2025-01-01' 
    AND gain_date <= '2025-12-31'
GROUP BY lead_id
ORDER BY total_compras DESC, valor_total_gasto DESC
LIMIT 10;

-- 5. VERIFICAR SE HÁ PROBLEMA COM lead_id NULL ou DUPLICADOS
SELECT 
    'Verificação de dados' as tipo,
    CASE 
        WHEN lead_id IS NULL THEN 'lead_id NULL'
        WHEN lead_id <= 0 THEN 'lead_id inválido (<= 0)'
        ELSE 'lead_id válido'
    END as status_lead_id,
    COUNT(*) as quantidade
FROM api.oportunidade_sprint 
WHERE archived = 0 
    AND status = 'gain'
    AND gain_date >= '2025-01-01' 
    AND gain_date <= '2025-12-31'
GROUP BY 
    CASE 
        WHEN lead_id IS NULL THEN 'lead_id NULL'
        WHEN lead_id <= 0 THEN 'lead_id inválido (<= 0)'
        ELSE 'lead_id válido'
    END;

-- 6. COMPARAR COM PERÍODO ESPECÍFICO (julho a setembro 2025)
SELECT 
    'Período jul-set 2025' as periodo,
    COUNT(DISTINCT lead_id) as clientes_unicos,
    COUNT(*) as total_oportunidades
FROM api.oportunidade_sprint 
WHERE archived = 0 
    AND status = 'gain'
    AND gain_date >= '2025-07-01' 
    AND gain_date <= '2025-09-30';

-- 7. DISTRIBUIÇÃO DE FREQUÊNCIAS NO PERÍODO JUL-SET
SELECT 
    CASE 
        WHEN compras_por_cliente = 1 THEN 'F1 - 1 compra'
        WHEN compras_por_cliente = 2 THEN 'F2 - 2 compras'
        WHEN compras_por_cliente = 3 THEN 'F3 - 3 compras'
        WHEN compras_por_cliente = 4 THEN 'F4 - 4 compras'
        WHEN compras_por_cliente >= 5 THEN 'F5 - 5+ compras'
        ELSE 'Outros'
    END as frequencia_categoria,
    COUNT(*) as quantidade_clientes,
    ROUND((COUNT(*) * 100.0 / SUM(COUNT(*)) OVER()), 2) as percentual
FROM (
    SELECT 
        lead_id,
        COUNT(*) as compras_por_cliente
    FROM api.oportunidade_sprint 
    WHERE archived = 0 
        AND status = 'gain'
        AND gain_date >= '2025-07-01' 
        AND gain_date <= '2025-09-30'
    GROUP BY lead_id
) as frequencias
GROUP BY 
    CASE 
        WHEN compras_por_cliente = 1 THEN 'F1 - 1 compra'
        WHEN compras_por_cliente = 2 THEN 'F2 - 2 compras'
        WHEN compras_por_cliente = 3 THEN 'F3 - 3 compras'
        WHEN compras_por_cliente = 4 THEN 'F4 - 4 compras'
        WHEN compras_por_cliente >= 5 THEN 'F5 - 5+ compras'
        ELSE 'Outros'
    END
ORDER BY quantidade_clientes DESC;
