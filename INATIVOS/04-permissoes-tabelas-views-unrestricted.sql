-- ========================================
-- 🔧 CONFIGURAR PERMISSÕES TABELAS/VIEWS UNRESTRICTED
-- ========================================
-- Data: 2025-10-27
-- Objetivo: Configurar RLS e permissões para tabelas e views marcadas como "Unrestricted"
-- ========================================

-- ========================================

-- TABELA 1: api.analises_atendimento
-- ========================================

-- 0) Remover políticas antigas
DROP POLICY IF EXISTS "Allow select for authenticated users (analises_atendimento)" ON api.analises_atendimento;
DROP POLICY IF EXISTS "Allow insert for authenticated users (analises_atendimento)" ON api.analises_atendimento;
DROP POLICY IF EXISTS "Allow update for authenticated users (analises_atendimento)" ON api.analises_atendimento;
DROP POLICY IF EXISTS "Allow delete for authenticated users (analises_atendimento)" ON api.analises_atendimento;

-- 1) Habilitar RLS
ALTER TABLE api.analises_atendimento ENABLE ROW LEVEL SECURITY;

-- 2) Políticas de leitura
CREATE POLICY "Allow select for authenticated users (analises_atendimento)" ON api.analises_atendimento
  FOR SELECT
  USING (true);

-- 3) Políticas de escrita
CREATE POLICY "Allow insert for authenticated users (analises_atendimento)" ON api.analises_atendimento
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow update for authenticated users (analises_atendimento)" ON api.analises_atendimento
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow delete for authenticated users (analises_atendimento)" ON api.analises_atendimento
  FOR DELETE
  USING (true);

-- 4) GRANTs
GRANT SELECT ON api.analises_atendimento TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON api.analises_atendimento TO authenticated;
GRANT ALL ON api.analises_atendimento TO service_role;

-- 5) GRANTs para SEQUENCE (se existir)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_sequences WHERE schemaname = 'api' AND sequencename = 'analises_atendimento_id_seq') THEN
        GRANT USAGE, SELECT ON SEQUENCE api.analises_atendimento_id_seq TO anon;
        GRANT USAGE, SELECT ON SEQUENCE api.analises_atendimento_id_seq TO authenticated;
        GRANT ALL ON SEQUENCE api.analises_atendimento_id_seq TO service_role;
    END IF;
END $$;

-- ========================================
-- TABELA 2: api.clientes_mestre
-- ========================================

-- 0) Remover políticas antigas
DROP POLICY IF EXISTS "Allow select for authenticated users (clientes_mestre)" ON api.clientes_mestre;
DROP POLICY IF EXISTS "Allow insert for authenticated users (clientes_mestre)" ON api.clientes_mestre;
DROP POLICY IF EXISTS "Allow update for authenticated users (clientes_mestre)" ON api.clientes_mestre;
DROP POLICY IF EXISTS "Allow delete for authenticated users (clientes_mestre)" ON api.clientes_mestre;

-- 1) Habilitar RLS
ALTER TABLE api.clientes_mestre ENABLE ROW LEVEL SECURITY;

-- 2) Políticas de leitura
CREATE POLICY "Allow select for authenticated users (clientes_mestre)" ON api.clientes_mestre
  FOR SELECT
  USING (true);

-- 3) Políticas de escrita
CREATE POLICY "Allow insert for authenticated users (clientes_mestre)" ON api.clientes_mestre
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow update for authenticated users (clientes_mestre)" ON api.clientes_mestre
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow delete for authenticated users (clientes_mestre)" ON api.clientes_mestre
  FOR DELETE
  USING (true);

-- 4) GRANTs
GRANT SELECT ON api.clientes_mestre TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON api.clientes_mestre TO authenticated;
GRANT ALL ON api.clientes_mestre TO service_role;

-- 5) GRANTs para SEQUENCE (se existir)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_sequences WHERE schemaname = 'api' AND sequencename = 'clientes_mestre_id_seq') THEN
        GRANT USAGE, SELECT ON SEQUENCE api.clientes_mestre_id_seq TO anon;
        GRANT USAGE, SELECT ON SEQUENCE api.clientes_mestre_id_seq TO authenticated;
        GRANT ALL ON SEQUENCE api.clientes_mestre_id_seq TO service_role;
    END IF;
END $$;

-- ========================================
-- VIEW 1: api.clientes_apenas_prime
-- ========================================

-- Views não têm RLS, apenas GRANTs
GRANT SELECT ON api.clientes_apenas_prime TO anon;
GRANT SELECT ON api.clientes_apenas_prime TO authenticated;
GRANT ALL ON api.clientes_apenas_prime TO service_role;

-- ========================================
-- VIEW 2: api.clientes_apenas_sprint
-- ========================================

GRANT SELECT ON api.clientes_apenas_sprint TO anon;
GRANT SELECT ON api.clientes_apenas_sprint TO authenticated;
GRANT ALL ON api.clientes_apenas_sprint TO service_role;

-- ========================================
-- VIEW 3: api.dashboard_principal
-- ========================================

GRANT SELECT ON api.dashboard_principal TO anon;
GRANT SELECT ON api.dashboard_principal TO authenticated;
GRANT ALL ON api.dashboard_principal TO service_role;

-- ========================================
-- VIEW 4: api.inativos (VIEW DE CLIENTES INATIVOS)
-- ========================================

GRANT SELECT ON api.inativos TO anon;
GRANT SELECT ON api.inativos TO authenticated;
GRANT ALL ON api.inativos TO service_role;

-- ========================================
-- OUTRAS VIEWS RELACIONADAS (Opcionais)
-- ========================================

-- View: api.stats_clientes_por_origem
GRANT SELECT ON api.stats_clientes_por_origem TO anon;
GRANT SELECT ON api.stats_clientes_por_origem TO authenticated;
GRANT ALL ON api.stats_clientes_por_origem TO service_role;

-- View: api.stats_completude_dados
GRANT SELECT ON api.stats_completude_dados TO anon;
GRANT SELECT ON api.stats_completude_dados TO authenticated;
GRANT ALL ON api.stats_completude_dados TO service_role;

-- View: api.stats_por_origem
GRANT SELECT ON api.stats_por_origem TO anon;
GRANT SELECT ON api.stats_por_origem TO authenticated;
GRANT ALL ON api.stats_por_origem TO service_role;

-- View: api.stats_qualidade_por_origem
GRANT SELECT ON api.stats_qualidade_por_origem TO anon;
GRANT SELECT ON api.stats_qualidade_por_origem TO authenticated;
GRANT ALL ON api.stats_qualidade_por_origem TO service_role;

-- View: api.sync_status
GRANT SELECT ON api.sync_status TO anon;
GRANT SELECT ON api.sync_status TO authenticated;
GRANT ALL ON api.sync_status TO service_role;

-- View: api.vw_prime_clientes_rfv
GRANT SELECT ON api.vw_prime_clientes_rfv TO anon;
GRANT SELECT ON api.vw_prime_clientes_rfv TO authenticated;
GRANT ALL ON api.vw_prime_clientes_rfv TO service_role;

-- View: api.vw_prime_pedidos_status
GRANT SELECT ON api.vw_prime_pedidos_status TO anon;
GRANT SELECT ON api.vw_prime_pedidos_status TO authenticated;
GRANT ALL ON api.vw_prime_pedidos_status TO service_role;

-- ========================================
-- VERIFICAÇÕES
-- ========================================

-- 1) Verificar permissões (GRANTs) em tabelas
SELECT
  table_schema, 
  table_name, 
  privilege_type, 
  grantee
FROM information_schema.table_privileges
WHERE table_schema = 'api' 
AND table_name IN (
    'analises_atendimento',
    'clientes_mestre',
    'clientes_apenas_prime',
    'clientes_apenas_sprint',
    'dashboard_principal',
    'inativos',
    'stats_clientes_por_origem',
    'stats_completude_dados',
    'stats_por_origem',
    'stats_qualidade_por_origem',
    'sync_status',
    'vw_prime_clientes_rfv',
    'vw_prime_pedidos_status'
)
ORDER BY table_name, grantee, privilege_type;

-- 2) Verificar políticas (RLS) em tabelas
SELECT 
    schemaname, 
    tablename, 
    policyname, 
    permissive, 
    roles, 
    cmd, 
    qual, 
    with_check
FROM pg_policies
WHERE schemaname = 'api' 
AND tablename IN ('analises_atendimento', 'clientes_mestre')
ORDER BY tablename, policyname;

-- 3) Verificar sequences
SELECT 
    sequence_schema, 
    sequence_name, 
    data_type, 
    start_value, 
    increment
FROM information_schema.sequences 
WHERE sequence_schema = 'api' 
AND sequence_name IN (
    'analises_atendimento_id_seq',
    'clientes_mestre_id_seq'
);

-- 4) Verificar se as views existem
SELECT 
    table_schema,
    table_name,
    table_type
FROM information_schema.tables
WHERE table_schema = 'api'
AND table_type = 'VIEW'
AND table_name IN (
    'clientes_apenas_prime',
    'clientes_apenas_sprint',
    'dashboard_principal',
    'inativos',
    'stats_clientes_por_origem',
    'stats_completude_dados',
    'stats_por_origem',
    'stats_qualidade_por_origem',
    'sync_status',
    'vw_prime_clientes_rfv',
    'vw_prime_pedidos_status'
)
ORDER BY table_name;

-- ========================================
-- FIM
-- ========================================

