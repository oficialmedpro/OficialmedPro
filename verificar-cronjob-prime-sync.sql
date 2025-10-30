-- ========================================
-- 🔍 VERIFICAR CRONJOB prime-sync-api-cron
-- ========================================
-- Objetivo: Verificar se o cronjob está funcionando e atualizando prime_clientes
-- ========================================

-- 1) Verificar últimas inserções na tabela prime_clientes
SELECT 
    COUNT(*) as total_clientes,
    MAX(created_at) as ultima_insercao,
    EXTRACT(HOURS FROM NOW() - MAX(created_at)) as horas_desde_ultima_insercao,
    EXTRACT(DAYS FROM NOW() - MAX(created_at)) as dias_desde_ultima_insercao
FROM api.prime_clientes;

-- 2) Verificar clientes inseridos nas últimas 24 horas
SELECT 
    COUNT(*) as clientes_ultimas_24h
FROM api.prime_clientes
WHERE created_at >= NOW() - INTERVAL '24 hours';

-- 3) Verificar clientes inseridos nos últimos 7 dias (por dia)
SELECT 
    DATE(created_at) as data,
    COUNT(*) as total_clientes
FROM api.prime_clientes
WHERE created_at >= NOW() - INTERVAL '7 days'
GROUP BY DATE(created_at)
ORDER BY data DESC;

-- 4) Verificar últimas atualizações (updated_at)
SELECT 
    COUNT(*) as total_clientes,
    MAX(updated_at) as ultima_atualizacao,
    EXTRACT(HOURS FROM NOW() - MAX(updated_at)) as horas_desde_ultima_atualizacao,
    EXTRACT(DAYS FROM NOW() - MAX(updated_at)) as dias_desde_ultima_atualizacao
FROM api.prime_clientes
WHERE updated_at IS NOT NULL;

-- 5) Verificar logs de sincronização (se existir tabela de logs)
SELECT 
    *
FROM api.cron_job_logs
WHERE job_name LIKE '%prime%sync%' OR job_name LIKE '%prime-sync%'
ORDER BY created_at DESC
LIMIT 10;

-- 6) Verificar logs gerais de sincronização
SELECT 
    *
FROM api.log_sincronizacoes
WHERE tabela_destino = 'prime_clientes'
ORDER BY data_sincronizacao DESC
LIMIT 10;

-- 7) Verificar status de sincronização (se existir)
SELECT 
    *
FROM api.sync_control
WHERE table_name = 'prime_clientes'
ORDER BY last_sync DESC
LIMIT 5;

-- 8) Verificar últimos 10 clientes inseridos
SELECT 
    id,
    nome,
    email,
    telefone,
    created_at,
    updated_at
FROM api.prime_clientes
ORDER BY created_at DESC
LIMIT 10;

-- 9) Verificar se há clientes duplicados recentes (possível problema de sync)
SELECT 
    cpf_cnpj,
    COUNT(*) as total,
    MAX(created_at) as ultima_insercao
FROM api.prime_clientes
WHERE cpf_cnpj IS NOT NULL
AND created_at >= NOW() - INTERVAL '7 days'
GROUP BY cpf_cnpj
HAVING COUNT(*) > 1
ORDER BY total DESC
LIMIT 10;

-- 10) Estatísticas gerais
SELECT 
    'Total de clientes' as metrica,
    COUNT(*) as valor
FROM api.prime_clientes
UNION ALL
SELECT 
    'Clientes ativos' as metrica,
    COUNT(*) as valor
FROM api.prime_clientes
WHERE ativo = true
UNION ALL
SELECT 
    'Clientes inativos (sem compra)' as metrica,
    COUNT(*) as valor
FROM api.inativos
UNION ALL
SELECT 
    'Clientes com email' as metrica,
    COUNT(*) as valor
FROM api.prime_clientes
WHERE email IS NOT NULL
UNION ALL
SELECT 
    'Clientes com telefone' as metrica,
    COUNT(*) as valor
FROM api.prime_clientes
WHERE telefone IS NOT NULL;

-- ========================================
-- FIM
-- ========================================

