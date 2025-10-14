-- ========================================
-- 🔧 CONFIGURAR PERMISSÕES TABELAS SEGMENTOS AUTOMÁTICOS
-- ========================================
-- Data: 2025-10-14
-- Objetivo: Configurar RLS e permissões para tabelas api.segmento_automatico e api.lead_callix_status
-- ========================================

-- ========================================
-- TABELA 1: api.segmento_automatico
-- ========================================

-- 0) (Opcional) Remover políticas antigas para recriar sem conflitos
DROP POLICY IF EXISTS "Allow select for authenticated users (segmento_automatico)" ON api.segmento_automatico;
DROP POLICY IF EXISTS "Allow insert for authenticated users (segmento_automatico)" ON api.segmento_automatico;
DROP POLICY IF EXISTS "Allow update for authenticated users (segmento_automatico)" ON api.segmento_automatico;
DROP POLICY IF EXISTS "Allow delete for authenticated users (segmento_automatico)" ON api.segmento_automatico;

-- 1) Habilitar RLS
ALTER TABLE api.segmento_automatico ENABLE ROW LEVEL SECURITY;

-- 2) Políticas de leitura
CREATE POLICY "Allow select for authenticated users (segmento_automatico)" ON api.segmento_automatico
  FOR SELECT
  USING (true);

-- 3) Políticas de escrita (autenticados)
CREATE POLICY "Allow insert for authenticated users (segmento_automatico)" ON api.segmento_automatico
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow update for authenticated users (segmento_automatico)" ON api.segmento_automatico
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow delete for authenticated users (segmento_automatico)" ON api.segmento_automatico
  FOR DELETE
  USING (true);

-- 4) GRANTs
-- Leitura para anon (opcional; habilite apenas se quiser expor via API pública)
GRANT SELECT ON api.segmento_automatico TO anon;

-- Leitura e escrita para autenticados (clientes logados)
GRANT SELECT, INSERT, UPDATE, DELETE ON api.segmento_automatico TO authenticated;

-- service_role (chave secreta do servidor) – tem bypass de RLS, mas manter grants por clareza
GRANT ALL ON api.segmento_automatico TO service_role;

-- 5) GRANTs para SEQUENCE (IMPORTANTE para evitar erro de permissão)
GRANT USAGE, SELECT ON SEQUENCE api.segmento_automatico_id_seq TO anon;
GRANT USAGE, SELECT ON SEQUENCE api.segmento_automatico_id_seq TO authenticated;
GRANT ALL ON SEQUENCE api.segmento_automatico_id_seq TO service_role;

-- ========================================
-- TABELA 2: api.lead_callix_status
-- ========================================

-- 0) (Opcional) Remover políticas antigas para recriar sem conflitos
DROP POLICY IF EXISTS "Allow select for authenticated users (lead_callix_status)" ON api.lead_callix_status;
DROP POLICY IF EXISTS "Allow insert for authenticated users (lead_callix_status)" ON api.lead_callix_status;
DROP POLICY IF EXISTS "Allow update for authenticated users (lead_callix_status)" ON api.lead_callix_status;
DROP POLICY IF EXISTS "Allow delete for authenticated users (lead_callix_status)" ON api.lead_callix_status;

-- 1) Habilitar RLS
ALTER TABLE api.lead_callix_status ENABLE ROW LEVEL SECURITY;

-- 2) Políticas de leitura
CREATE POLICY "Allow select for authenticated users (lead_callix_status)" ON api.lead_callix_status
  FOR SELECT
  USING (true);

-- 3) Políticas de escrita (autenticados)
CREATE POLICY "Allow insert for authenticated users (lead_callix_status)" ON api.lead_callix_status
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow update for authenticated users (lead_callix_status)" ON api.lead_callix_status
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow delete for authenticated users (lead_callix_status)" ON api.lead_callix_status
  FOR DELETE
  USING (true);

-- 4) GRANTs
-- Leitura para anon (opcional; habilite apenas se quiser expor via API pública)
GRANT SELECT ON api.lead_callix_status TO anon;

-- Leitura e escrita para autenticados (clientes logados)
GRANT SELECT, INSERT, UPDATE, DELETE ON api.lead_callix_status TO authenticated;

-- service_role (chave secreta do servidor) – tem bypass de RLS, mas manter grants por clareza
GRANT ALL ON api.lead_callix_status TO service_role;

-- 5) GRANTs para SEQUENCE (IMPORTANTE para evitar erro de permissão)
GRANT USAGE, SELECT ON SEQUENCE api.lead_callix_status_id_seq TO anon;
GRANT USAGE, SELECT ON SEQUENCE api.lead_callix_status_id_seq TO authenticated;
GRANT ALL ON SEQUENCE api.lead_callix_status_id_seq TO service_role;

-- ========================================
-- VERIFICAÇÕES
-- ========================================

-- Permissões (GRANTs) - segmento_automatico
SELECT
  table_schema, table_name, privilege_type, grantee
FROM information_schema.table_privileges
WHERE table_schema = 'api' AND table_name IN ('segmento_automatico', 'lead_callix_status')
ORDER BY table_name, grantee, privilege_type;

-- Políticas (RLS) - segmento_automatico
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'api' AND tablename IN ('segmento_automatico', 'lead_callix_status')
ORDER BY tablename, policyname;

-- Verificar sequences
SELECT 
    sequence_schema, 
    sequence_name, 
    data_type, 
    start_value, 
    increment
FROM information_schema.sequences 
WHERE sequence_schema = 'api' 
AND sequence_name IN ('segmento_automatico_id_seq', 'lead_callix_status_id_seq');
