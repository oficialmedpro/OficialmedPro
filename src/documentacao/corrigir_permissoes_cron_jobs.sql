-- ========================================
-- 🔧 CORRIGIR PERMISSÕES CRON JOBS
-- ========================================
-- Data: 2025-10-16
-- Objetivo: Corrigir permissões RLS para tabelas de cron jobs
-- ========================================

-- ========================================
-- 1. VERIFICAR SE AS TABELAS EXISTEM
-- ========================================

-- Verificar tabelas existentes
SELECT 
    table_schema, 
    table_name, 
    table_type
FROM information_schema.tables 
WHERE table_schema = 'api' 
AND table_name IN ('cron_job_logs', 'vw_cron_job_status', 'segmento_automatico')
ORDER BY table_name;

-- ========================================
-- 2. CRIAR TABELA CRON_JOB_LOGS SE NÃO EXISTIR
-- ========================================

CREATE TABLE IF NOT EXISTS api.cron_job_logs (
    id SERIAL PRIMARY KEY,
    job_name VARCHAR(100) NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('running', 'success', 'error')),
    start_time TIMESTAMPTZ DEFAULT NOW(),
    end_time TIMESTAMPTZ,
    duration_seconds INTEGER,
    message TEXT,
    error_message TEXT,
    details JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================
-- 3. CRIAR VIEW VW_CRON_JOB_STATUS SE NÃO EXISTIR
-- ========================================

CREATE OR REPLACE VIEW api.vw_cron_job_status AS
SELECT 
    job_name,
    COUNT(*) as total_executions,
    COUNT(CASE WHEN status = 'success' THEN 1 END) as successful_executions,
    COUNT(CASE WHEN status = 'error' THEN 1 END) as failed_executions,
    COUNT(CASE WHEN status = 'running' THEN 1 END) as running_executions,
    MAX(start_time) as last_execution,
    AVG(duration_seconds) as avg_duration_seconds
FROM api.cron_job_logs
GROUP BY job_name;

-- ========================================
-- 4. CONFIGURAR RLS (ROW LEVEL SECURITY)
-- ========================================

-- Habilitar RLS nas tabelas
ALTER TABLE api.cron_job_logs ENABLE ROW LEVEL SECURITY;

-- ========================================
-- 5. CRIAR POLÍTICAS RLS
-- ========================================

-- Política para anon (usuários não autenticados) - apenas leitura
CREATE POLICY "anon_read_cron_job_logs" ON api.cron_job_logs
    FOR SELECT TO anon
    USING (true);

-- Política para authenticated (usuários logados) - leitura e inserção
CREATE POLICY "authenticated_read_cron_job_logs" ON api.cron_job_logs
    FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "authenticated_insert_cron_job_logs" ON api.cron_job_logs
    FOR INSERT TO authenticated
    WITH CHECK (true);

CREATE POLICY "authenticated_update_cron_job_logs" ON api.cron_job_logs
    FOR UPDATE TO authenticated
    USING (true);

-- Política para service_role (bypass de RLS, mas manter por clareza)
CREATE POLICY "service_role_all_cron_job_logs" ON api.cron_job_logs
    FOR ALL TO service_role
    USING (true)
    WITH CHECK (true);

-- ========================================
-- 6. CONFIGURAR PERMISSÕES (GRANTS)
-- ========================================

-- Permissões para anon
GRANT SELECT ON api.cron_job_logs TO anon;
GRANT SELECT ON api.vw_cron_job_status TO anon;

-- Permissões para authenticated
GRANT SELECT, INSERT, UPDATE ON api.cron_job_logs TO authenticated;
GRANT SELECT ON api.vw_cron_job_status TO authenticated;

-- Permissões para service_role
GRANT ALL ON api.cron_job_logs TO service_role;
GRANT ALL ON api.vw_cron_job_status TO service_role;

-- ========================================
-- 7. VERIFICAR CONFIGURAÇÃO
-- ========================================

-- Verificar se as tabelas existem
SELECT 
    table_schema, 
    table_name, 
    table_type,
    is_insertable_into
FROM information_schema.tables 
WHERE table_schema = 'api' 
AND table_name IN ('cron_job_logs', 'vw_cron_job_status')
ORDER BY table_name;

-- Verificar políticas RLS
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
AND tablename = 'cron_job_logs'
ORDER BY policyname;

-- Verificar permissões
SELECT
    table_schema, 
    table_name, 
    privilege_type, 
    grantee
FROM information_schema.table_privileges
WHERE table_schema = 'api' 
AND table_name IN ('cron_job_logs', 'vw_cron_job_status')
ORDER BY table_name, grantee, privilege_type;

-- ========================================
-- 8. TESTE DE INSERÇÃO
-- ========================================

-- Inserir um log de teste
INSERT INTO api.cron_job_logs (job_name, status, message)
VALUES ('test_job', 'success', 'Teste de permissões');

-- Verificar se foi inserido
SELECT * FROM api.cron_job_logs WHERE job_name = 'test_job';

-- Limpar teste
DELETE FROM api.cron_job_logs WHERE job_name = 'test_job';

-- ========================================
-- 9. VERIFICAR VIEW
-- ========================================

-- Testar a view
SELECT * FROM api.vw_cron_job_status;

-- ========================================
-- ✅ SCRIPT CONCLUÍDO
-- ========================================
-- Execute este script no SQL Editor do Supabase
-- Deve resolver os erros 404 no Monitor Cron Jobs

