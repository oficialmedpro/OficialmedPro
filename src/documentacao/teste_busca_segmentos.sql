-- ========================================
-- TESTE: VERIFICAR SEGMENTOS AUTOMÁTICOS
-- ========================================

-- 1. Ver se há segmentos na tabela
SELECT COUNT(*) as total_segmentos FROM api.segmento_automatico;

-- 2. Ver todos os segmentos automáticos
SELECT 
    id,
    segmento_id,
    nome,
    ativo,
    enviar_callix,
    frequencia_horas,
    proxima_execucao,
    total_leads_processados,
    total_leads_enviados_callix,
    created_at
FROM api.segmento_automatico
ORDER BY created_at DESC;

-- 3. Ver segmentos com JOIN (como a query do frontend)
SELECT 
    sa.*,
    s.name as segmento_nome,
    s.total_leads,
    s.category_title
FROM api.segmento_automatico sa
LEFT JOIN api.segmento s ON sa.segmento_id = s.id
ORDER BY sa.created_at DESC;

-- 4. Verificar se há problema de permissão na consulta
SELECT 
    table_name,
    privilege_type,
    grantee
FROM information_schema.table_privileges
WHERE table_schema = 'api' 
AND table_name = 'segmento_automatico'
AND grantee = 'authenticated';

-- 5. Testar a query exata que o frontend usa (simulada)
-- Esta é a query que o Supabase client executa internamente:
SELECT 
    id,
    segmento_id,
    nome,
    ativo,
    enviar_callix,
    frequencia_horas,
    proxima_execucao,
    total_leads_processados,
    total_leads_enviados_callix,
    created_at,
    updated_at
FROM api.segmento_automatico
ORDER BY created_at DESC;
