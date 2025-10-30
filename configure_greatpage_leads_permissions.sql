-- ========================================
-- 🔐 CONFIGURAR PERMISSÕES TABELA GREATPAGE_LEADS (leitura e escrita)
-- ========================================
-- Data: 2025-01-27
-- Objetivo: Configurar RLS e permissões para tabela api.greatpage_leads
-- ========================================

-- 0) (Opcional) Remover políticas antigas para recriar sem conflitos
DROP POLICY IF EXISTS "Allow select for authenticated users (greatpage_leads)" ON api.greatpage_leads;
DROP POLICY IF EXISTS "Allow insert for authenticated users (greatpage_leads)" ON api.greatpage_leads;
DROP POLICY IF EXISTS "Allow update for authenticated users (greatpage_leads)" ON api.greatpage_leads;
DROP POLICY IF EXISTS "Allow delete for authenticated users (greatpage_leads)" ON api.greatpage_leads;

-- 1) Habilitar RLS
ALTER TABLE api.greatpage_leads ENABLE ROW LEVEL SECURITY;

-- 2) Políticas de leitura
CREATE POLICY "Allow select for authenticated users (greatpage_leads)" ON api.greatpage_leads
  FOR SELECT
  USING (true);

-- 3) Políticas de escrita (autenticados)
CREATE POLICY "Allow insert for authenticated users (greatpage_leads)" ON api.greatpage_leads
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow update for authenticated users (greatpage_leads)" ON api.greatpage_leads
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow delete for authenticated users (greatpage_leads)" ON api.greatpage_leads
  FOR DELETE
  USING (true);

-- 4) GRANTs
-- Leitura para anon (opcional; habilite apenas se quiser expor via API pública)
GRANT SELECT ON api.greatpage_leads TO anon;

-- Leitura e escrita para autenticados (clientes logados)
GRANT SELECT, INSERT, UPDATE, DELETE ON api.greatpage_leads TO authenticated;

-- service_role (chave secreta do servidor) – tem bypass de RLS, mas manter grants por clareza
GRANT ALL ON api.greatpage_leads TO service_role;

-- 5) Verificações
-- Permissões (GRANTs)
SELECT
  table_schema, table_name, privilege_type, grantee
FROM information_schema.table_privileges
WHERE table_schema = 'api' AND table_name = 'greatpage_leads'
ORDER BY grantee, privilege_type;

-- Políticas (RLS)
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'api' AND tablename = 'greatpage_leads';


