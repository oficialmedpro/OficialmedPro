-- 🔍 DEBUG: Verificar oportunidades perdidas HOJE (02/09/2025)
-- Data atual: 02/09/2025

-- 1. BUSCAR TODAS as perdidas hoje (SEM filtros)
SELECT 
    id,
    title,
    status,
    lost_date,
    create_date,
    update_date,
    funil_id,
    crm_column,
    lead_whatsapp,
    value
FROM oportunidade_sprint 
WHERE archived = 0 
AND status = 'lost' 
AND lost_date >= '2025-09-02 00:00:00'
AND lost_date <= '2025-09-02 23:59:59'
ORDER BY lost_date DESC;

-- 2. CONTAR por funil
SELECT 
    funil_id,
    COUNT(*) as quantidade,
    SUM(value) as valor_total
FROM oportunidade_sprint 
WHERE archived = 0 
AND status = 'lost' 
AND lost_date >= '2025-09-02 00:00:00'
AND lost_date <= '2025-09-02 23:59:59'
GROUP BY funil_id
ORDER BY quantidade DESC;

-- 3. Verificar RANGE de datas das perdas (para ver se há problema de timezone)
SELECT 
    DATE(lost_date) as data_perda,
    COUNT(*) as quantidade
FROM oportunidade_sprint 
WHERE archived = 0 
AND status = 'lost' 
AND lost_date >= '2025-09-01'
AND lost_date <= '2025-09-03'
GROUP BY DATE(lost_date)
ORDER BY data_perda DESC;

-- 4. GANHAS hoje
SELECT 
    id,
    title,
    status,
    gain_date,
    create_date,
    funil_id,
    value
FROM oportunidade_sprint 
WHERE archived = 0 
AND status = 'gain' 
AND gain_date >= '2025-09-02 00:00:00'
AND gain_date <= '2025-09-02 23:59:59'
ORDER BY gain_date DESC;

-- 5. CONTAR ganhas por funil hoje  
SELECT 
    funil_id,
    COUNT(*) as quantidade,
    SUM(value) as valor_total
FROM oportunidade_sprint 
WHERE archived = 0 
AND status = 'gain' 
AND gain_date >= '2025-09-02 00:00:00'
AND gain_date <= '2025-09-02 23:59:59'
GROUP BY funil_id
ORDER BY quantidade DESC;