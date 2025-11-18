-- TESTE SIMPLES - LEADS ÚNICOS
SELECT 
    COUNT(DISTINCT lead_id) as total_leads_unicos
FROM api.oportunidade_sprint
WHERE archived = 0 
    AND lead_id IS NOT NULL 
    AND lead_id > 0;
