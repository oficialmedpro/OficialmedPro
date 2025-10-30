-- ============================================================================
-- CORRIGIR PERMISSÕES - DESABILITAR RLS EM TABELAS BASE
-- ============================================================================
-- Erro 403 indica que RLS está bloqueando acesso
-- Precisamos desabilitar RLS nas TABELAS que as views usam
-- ============================================================================

-- 1. Verificar status do RLS em clientes_mestre
SELECT
  schemaname,
  tablename,
  rowsecurity as rls_habilitado
FROM pg_tables
WHERE schemaname = 'api'
  AND tablename = 'clientes_mestre';

-- 2. Desabilitar RLS na tabela base (clientes_mestre)
ALTER TABLE api.clientes_mestre DISABLE ROW LEVEL SECURITY;

-- 3. Garantir permissões nas views
GRANT SELECT ON api.vw_inativos_prime TO anon, authenticated;
GRANT SELECT ON api.vw_inativos_fora_prime TO anon, authenticated;

-- 4. Aplicar permissões em todas as views vw_*
DO $$
DECLARE
  view_name TEXT;
BEGIN
  FOR view_name IN
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'api'
      AND table_type = 'VIEW'
      AND table_name LIKE 'vw_%'
  LOOP
    BEGIN
      EXECUTE format('GRANT SELECT ON api.%I TO anon, authenticated', view_name);
      RAISE NOTICE 'Permissões concedidas para view: %', view_name;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Erro ao dar permissão na view %: %', view_name, SQLERRM;
    END;
  END LOOP;
END $$;

-- 4. Verificar status das permissões
SELECT
  schemaname,
  viewname,
  viewowner,
  definition IS NOT NULL as has_definition
FROM pg_views
WHERE schemaname = 'api'
  AND viewname IN ('vw_inativos_prime', 'vw_inativos_fora_prime')
ORDER BY viewname;

-- Mensagem
DO $$
BEGIN
  RAISE NOTICE '✅ RLS desabilitado nas views!';
  RAISE NOTICE '🔓 Permissões aplicadas novamente';
  RAISE NOTICE '📋 Verifique o resultado da query acima';
END $$;
