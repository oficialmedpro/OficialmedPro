-- ========================================
-- 🔍 LEADS ÚNICOS DENTRO DAS 10.970 OPORTUNIDADES
-- ========================================

-- 1. 📊 TOTAL DE OPORTUNIDADES E LEADS ÚNICOS (STATUS 'gain')
SELECT 
    'Total de Oportunidades e Leads Únicos (Status gain)' as tipo,
    COUNT(*) as total_oportunidades,
    COUNT(DISTINCT lead_id) as total_leads_unicos
FROM api.oportunidade_sprint
WHERE archived = 0 
    AND status = 'gain'
    AND lead_id IS NOT NULL 
    AND lead_id > 0;

-- 2. 📊 VERIFICAR OPORTUNIDADES GANHAS COM lead_id VÁLIDO
SELECT 
    'Verificação Oportunidades Ganhas' as tipo,
    COUNT(*) as total_oportunidades_ganhas,
    COUNT(CASE WHEN lead_id IS NOT NULL AND lead_id > 0 THEN 1 END) as oportunidades_ganhas_com_lead_id_valido,
    COUNT(CASE WHEN lead_id IS NULL OR lead_id <= 0 THEN 1 END) as oportunidades_ganhas_sem_lead_id_valido
FROM api.oportunidade_sprint
WHERE archived = 0 
    AND status = 'gain';
