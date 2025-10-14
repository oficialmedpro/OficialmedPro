-- ========================================
-- DEBUG: VERIFICAR SEGMENTOS DISPONÍVEIS
-- ========================================

-- 1. Ver todos os segmentos disponíveis
SELECT 
    id,
    name,
    alias,
    is_published,
    total_leads,
    last_lead_update
FROM api.segmento 
ORDER BY name;

-- 2. Buscar especificamente por "D15" (diferentes variações)
SELECT 
    id,
    name,
    alias,
    total_leads
FROM api.segmento 
WHERE 
    name ILIKE '%D15%' OR 
    name ILIKE '%d15%' OR
    alias ILIKE '%D15%' OR
    alias ILIKE '%d15%'
ORDER BY name;

-- 3. Ver quantos segmentos existem no total
SELECT COUNT(*) as total_segmentos FROM api.segmento;

-- 4. Ver os primeiros 10 segmentos para identificar o padrão
SELECT 
    id,
    name,
    alias,
    total_leads
FROM api.segmento 
ORDER BY id
LIMIT 10;

-- 5. Buscar por segmentos que contenham números
SELECT 
    id,
    name,
    alias,
    total_leads
FROM api.segmento 
WHERE name ~ '[0-9]+'
ORDER BY name;

-- ========================================
-- INSERÇÃO MANUAL DO SEGMENTO AUTOMÁTICO
-- ========================================

-- IMPORTANTE: 
-- 1. Execute primeiro as queries acima para encontrar o ID correto
-- 2. Substitua 999 pelo ID real do segmento que você quer automatizar
-- 3. Descomente e execute a query abaixo:

/*
INSERT INTO api.segmento_automatico (
    segmento_id, 
    nome, 
    ativo, 
    enviar_callix, 
    frequencia_horas,
    proxima_execucao
) VALUES (
    999, -- ⚠️ SUBSTITUA ESTE NÚMERO PELO ID REAL DO SEGMENTO
    'Segmento Automático - D15', -- Mude o nome se quiser
    true,
    true,
    6, -- A cada 6 horas
    NOW() + INTERVAL '1 hour'
) ON CONFLICT (segmento_id) DO UPDATE SET
    nome = EXCLUDED.nome,
    ativo = EXCLUDED.ativo,
    enviar_callix = EXCLUDED.enviar_callix,
    frequencia_horas = EXCLUDED.frequencia_horas;
*/

-- Verificar segmentos automáticos já configurados
SELECT 
    sa.id,
    sa.segmento_id,
    sa.nome,
    sa.ativo,
    sa.enviar_callix,
    sa.frequencia_horas,
    s.name as segmento_nome_real,
    s.total_leads,
    sa.proxima_execucao
FROM api.segmento_automatico sa
LEFT JOIN api.segmento s ON sa.segmento_id = s.id;
