-- ========================================
-- 🔧 CONFIGURAR PERMISSÕES TABELA LOSS_REASONS (leitura e escrita)
-- ========================================
-- Data: 2025-01-27
-- Objetivo: Configurar RLS e permissões para tabela api.loss_reasons
-- ========================================

-- 0) (Opcional) Remover políticas antigas para recriar sem conflitos
DROP POLICY IF EXISTS "Allow select for authenticated users (loss_reasons)" ON api.loss_reasons;
DROP POLICY IF EXISTS "Allow insert for authenticated users (loss_reasons)" ON api.loss_reasons;
DROP POLICY IF EXISTS "Allow update for authenticated users (loss_reasons)" ON api.loss_reasons;
DROP POLICY IF EXISTS "Allow delete for authenticated users (loss_reasons)" ON api.loss_reasons;

-- 1) Habilitar RLS
ALTER TABLE api.loss_reasons ENABLE ROW LEVEL SECURITY;

-- 2) Políticas de leitura
CREATE POLICY "Allow select for authenticated users (loss_reasons)" ON api.loss_reasons
  FOR SELECT
  USING (true);

-- 3) Políticas de escrita (autenticados)
CREATE POLICY "Allow insert for authenticated users (loss_reasons)" ON api.loss_reasons
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow update for authenticated users (loss_reasons)" ON api.loss_reasons
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow delete for authenticated users (loss_reasons)" ON api.loss_reasons
  FOR DELETE
  USING (true);

-- 4) GRANTs
-- Leitura para anon (opcional; habilite apenas se quiser expor via API pública)
GRANT SELECT ON api.loss_reasons TO anon;

-- Leitura e escrita para autenticados (clientes logados)
GRANT SELECT, INSERT, UPDATE, DELETE ON api.loss_reasons TO authenticated;

-- service_role (chave secreta do servidor) – tem bypass de RLS, mas manter grants por clareza
GRANT ALL ON api.loss_reasons TO service_role;

-- 5) Verificações
-- Permissões (GRANTs)
SELECT 
  table_schema, table_name, privilege_type, grantee
FROM information_schema.table_privileges
WHERE table_schema = 'api' AND table_name = 'loss_reasons'
ORDER BY grantee, privilege_type;

-- Políticas (RLS)
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'api' AND tablename = 'loss_reasons';

-- 6) Verificar se a tabela está acessível
SELECT COUNT(*) as total_records FROM api.loss_reasons;
