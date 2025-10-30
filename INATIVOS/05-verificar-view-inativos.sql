-- ========================================
-- 🔍 VERIFICAR VIEW INATIVOS
-- ========================================
-- Objetivo: Verificar se a view api.inativos foi criada corretamente
-- ========================================

-- 1) Verificar se a view existe
SELECT 
    table_schema,
    table_name,
    table_type
FROM information_schema.tables
WHERE table_schema = 'api'
AND table_name = 'inativos';

-- 2) Verificar a definição da view
SELECT 
    schemaname,
    viewname,
    definition
FROM pg_views
WHERE schemaname = 'api'
AND viewname = 'inativos';

-- 3) Verificar permissões na view
SELECT
    table_schema, 
    table_name, 
    privilege_type, 
    grantee
FROM information_schema.table_privileges
WHERE table_schema = 'api' 
AND table_name = 'inativos'
ORDER BY grantee, privilege_type;

-- 4) Testar consulta simples na view
SELECT COUNT(*) as total_clientes_inativos
FROM api.inativos;

-- 5) Testar consulta com dados (primeiros 5)
SELECT 
    id,
    nome,
    email,
    telefone,
    dias_sem_compra
FROM api.inativos
ORDER BY dias_sem_compra DESC
LIMIT 5;

-- 6) Verificar se tem dados
SELECT 
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ View tem dados (' || COUNT(*) || ' clientes inativos)'
        ELSE '❌ View está vazia'
    END as status
FROM api.inativos;

