-- ========================================
-- 🔧 CONFIGURAR PERMISSÕES TABELA LEADS (leitura e escrita)
-- ========================================
-- Data: 2025-09-19
-- Objetivo: Configurar RLS e permissões para tabela api.leads
-- ========================================

-- 0) (Opcional) Remover políticas antigas para recriar sem conflitos
DROP POLICY IF EXISTS "Allow select for authenticated users (leads)" ON api.leads;
DROP POLICY IF EXISTS "Allow insert for authenticated users (leads)" ON api.leads;
DROP POLICY IF EXISTS "Allow update for authenticated users (leads)" ON api.leads;
DROP POLICY IF EXISTS "Allow delete for authenticated users (leads)" ON api.leads;

-- 1) Habilitar RLS
ALTER TABLE api.leads ENABLE ROW LEVEL SECURITY;

-- 2) Políticas de leitura
CREATE POLICY "Allow select for authenticated users (leads)" ON api.leads
  FOR SELECT
  USING (true);

-- 3) Políticas de escrita (autenticados)
CREATE POLICY "Allow insert for authenticated users (leads)" ON api.leads
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow update for authenticated users (leads)" ON api.leads
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow delete for authenticated users (leads)" ON api.leads
  FOR DELETE
  USING (true);

-- 4) GRANTs
-- Leitura para anon (opcional; habilite apenas se quiser expor via API pública)
GRANT SELECT ON api.leads TO anon;

-- Leitura e escrita para autenticados (clientes logados)
GRANT SELECT, INSERT, UPDATE, DELETE ON api.leads TO authenticated;

-- service_role (chave secreta do servidor) – tem bypass de RLS, mas manter grants por clareza
GRANT ALL ON api.leads TO service_role;

-- 5) Verificações
-- Permissões (GRANTs)
SELECT
  table_schema, table_name, privilege_type, grantee
FROM information_schema.table_privileges
WHERE table_schema = 'api' AND table_name = 'leads'
ORDER BY grantee, privilege_type;

-- Políticas (RLS)
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'api' AND tablename = 'leads';