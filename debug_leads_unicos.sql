-- ========================================
-- 🔍 CONTAGEM DE LEADS ÚNICOS - SIMPLES E DIRETO
-- ========================================

-- 1. 📊 TOTAL DE LEADS ÚNICOS (TODOS OS STATUS)
SELECT 
    'Total de Leads Únicos (Todos Status)' as tipo,
    COUNT(DISTINCT lead_id) as total_leads_unicos
FROM api.oportunidade_sprint
WHERE archived = 0 
    AND lead_id IS NOT NULL 
    AND lead_id > 0;

-- 2. 📊 LEADS ÚNICOS POR STATUS
SELECT 
    'Leads Únicos por Status' as tipo,
    status,
    COUNT(DISTINCT lead_id) as total_leads_unicos
FROM api.oportunidade_sprint
WHERE archived = 0 
    AND lead_id IS NOT NULL 
    AND lead_id > 0
GROUP BY status
ORDER BY total_leads_unicos DESC;

-- 3. 📊 LEADS ÚNICOS GANHOS (STATUS 'gain')
SELECT 
    'Leads Únicos Ganhos (Status gain)' as tipo,
    COUNT(DISTINCT lead_id) as total_leads_ganhos
FROM api.oportunidade_sprint
WHERE archived = 0 
    AND status = 'gain'
    AND lead_id IS NOT NULL 
    AND lead_id > 0;

-- 4. 📊 LEADS ÚNICOS GANHOS NO ANO DE 2025
SELECT 
    'Leads Únicos Ganhos (2025)' as tipo,
    COUNT(DISTINCT lead_id) as total_leads_2025
FROM api.oportunidade_sprint
WHERE archived = 0 
    AND status = 'gain'
    AND gain_date >= '2025-01-01' 
    AND gain_date <= '2025-12-31'
    AND lead_id IS NOT NULL 
    AND lead_id > 0;

-- 5. 📊 LEADS ÚNICOS GANHOS POR PERÍODO
SELECT 
    'Leads Únicos por Período' as tipo,
    'Janeiro-Março 2025' as periodo,
    COUNT(DISTINCT lead_id) as total_leads
FROM api.oportunidade_sprint
WHERE archived = 0 
    AND status = 'gain'
    AND gain_date >= '2025-01-01' 
    AND gain_date <= '2025-03-31'
    AND lead_id IS NOT NULL 
    AND lead_id > 0

UNION ALL

SELECT 
    'Leads Únicos por Período' as tipo,
    'Abril-Junho 2025' as periodo,
    COUNT(DISTINCT lead_id) as total_leads
FROM api.oportunidade_sprint
WHERE archived = 0 
    AND status = 'gain'
    AND gain_date >= '2025-04-01' 
    AND gain_date <= '2025-06-30'
    AND lead_id IS NOT NULL 
    AND lead_id > 0

UNION ALL

SELECT 
    'Leads Únicos por Período' as tipo,
    'Julho-Setembro 2025' as periodo,
    COUNT(DISTINCT lead_id) as total_leads
FROM api.oportunidade_sprint
WHERE archived = 0 
    AND status = 'gain'
    AND gain_date >= '2025-07-01' 
    AND gain_date <= '2025-09-30'
    AND lead_id IS NOT NULL 
    AND lead_id > 0

UNION ALL

SELECT 
    'Leads Únicos por Período' as tipo,
    'Outubro-Dezembro 2025' as periodo,
    COUNT(DISTINCT lead_id) as total_leads
FROM api.oportunidade_sprint
WHERE archived = 0 
    AND status = 'gain'
    AND gain_date >= '2025-10-01' 
    AND gain_date <= '2025-12-31'
    AND lead_id IS NOT NULL 
    AND lead_id > 0

ORDER BY periodo;

-- 6. 🔍 VERIFICAR LEADS COM PROBLEMAS (NULL ou INVÁLIDOS)
SELECT 
    'Verificação de Leads com Problemas' as tipo,
    CASE 
        WHEN lead_id IS NULL THEN 'lead_id NULL'
        WHEN lead_id <= 0 THEN 'lead_id inválido (<= 0)'
        ELSE 'lead_id válido'
    END as status_lead_id,
    COUNT(*) as quantidade_registros,
    COUNT(DISTINCT lead_id) as leads_unicos
FROM api.oportunidade_sprint 
WHERE archived = 0
GROUP BY 
    CASE 
        WHEN lead_id IS NULL THEN 'lead_id NULL'
        WHEN lead_id <= 0 THEN 'lead_id inválido (<= 0)'
        ELSE 'lead_id válido'
    END;

-- 7. 📊 RESUMO FINAL - COMPARAÇÃO
SELECT 
    'RESUMO FINAL - Comparação de Leads' as tipo,
    (SELECT COUNT(DISTINCT lead_id) FROM api.oportunidade_sprint WHERE archived = 0 AND lead_id IS NOT NULL AND lead_id > 0) as total_leads_unicos_todos_status,
    (SELECT COUNT(DISTINCT lead_id) FROM api.oportunidade_sprint WHERE archived = 0 AND status = 'gain' AND lead_id IS NOT NULL AND lead_id > 0) as total_leads_unicos_ganhos,
    (SELECT COUNT(DISTINCT lead_id) FROM api.oportunidade_sprint WHERE archived = 0 AND status = 'gain' AND gain_date >= '2025-01-01' AND gain_date <= '2025-12-31' AND lead_id IS NOT NULL AND lead_id > 0) as total_leads_unicos_2025;
