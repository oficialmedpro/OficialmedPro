-- ========================================
-- 🔧 CONFIGURAR PERMISSÕES TABELA ORIGEM_OPORTUNIDADE
-- ========================================
-- Data: 2025-01-23
-- Objetivo: Configurar RLS e permissões para tabela origem_oportunidade
-- ========================================

-- 1. Habilitar RLS na tabela
ALTER TABLE api.origem_oportunidade ENABLE ROW LEVEL SECURITY;

-- 2. Criar política para permitir SELECT (leitura) para usuários autenticados
CREATE POLICY "Allow select for authenticated users" ON api.origem_oportunidade
    FOR SELECT 
    USING (true);

-- 3. Conceder permissões de SELECT para o role authenticated
GRANT SELECT ON api.origem_oportunidade TO authenticated;

-- 4. Conceder permissões de SELECT para o role anon (se necessário)
GRANT SELECT ON api.origem_oportunidade TO anon;

-- 5. Conceder permissões de SELECT para o role service_role (usado pela aplicação)
GRANT SELECT ON api.origem_oportunidade TO service_role;

-- 6. Verificar se as permissões foram aplicadas
SELECT 
    table_schema,
    table_name,
    privilege_type,
    grantee
FROM information_schema.table_privileges 
WHERE table_name = 'origem_oportunidade'
ORDER BY grantee, privilege_type;