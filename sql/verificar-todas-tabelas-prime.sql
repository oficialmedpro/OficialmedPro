-- ========================================
-- 🔍 VERIFICAR TODAS AS TABELAS PRIME_*
-- ========================================
-- Objetivo: Verificar status de sincronização de todas as tabelas Prime
-- ========================================

-- 1) TABELA: prime_clientes
SELECT 
    'prime_clientes' as tabela,
    COUNT(*) as total_registros,
    MAX(created_at) as ultima_insercao,
    EXTRACT(HOURS FROM NOW() - MAX(created_at)) as horas_desde_ultima_insercao,
    MAX(updated_at) as ultima_atualizacao,
    EXTRACT(HOURS FROM NOW() - MAX(updated_at)) as horas_desde_ultima_atualizacao
FROM api.prime_clientes
UNION ALL

-- 2) TABELA: prime_pedidos
SELECT 
    'prime_pedidos' as tabela,
    COUNT(*) as total_registros,
    MAX(created_at) as ultima_insercao,
    EXTRACT(HOURS FROM NOW() - MAX(created_at)) as horas_desde_ultima_insercao,
    MAX(updated_at) as ultima_atualizacao,
    EXTRACT(HOURS FROM NOW() - MAX(updated_at)) as horas_desde_ultima_atualizacao
FROM api.prime_pedidos
UNION ALL

-- 3) TABELA: prime_rastreabilidade
SELECT 
    'prime_rastreabilidade' as tabela,
    COUNT(*) as total_registros,
    MAX(created_at) as ultima_insercao,
    EXTRACT(HOURS FROM NOW() - MAX(created_at)) as horas_desde_ultima_insercao,
    MAX(updated_at) as ultima_atualizacao,
    EXTRACT(HOURS FROM NOW() - MAX(updated_at)) as horas_desde_ultima_atualizacao
FROM api.prime_rastreabilidade
UNION ALL

-- 4) TABELA: prime_tipos_processo
SELECT 
    'prime_tipos_processo' as tabela,
    COUNT(*) as total_registros,
    MAX(created_at) as ultima_insercao,
    EXTRACT(HOURS FROM NOW() - MAX(created_at)) as horas_desde_ultima_insercao,
    MAX(updated_at) as ultima_atualizacao,
    EXTRACT(HOURS FROM NOW() - MAX(updated_at)) as horas_desde_ultima_atualizacao
FROM api.prime_tipos_processo
UNION ALL

-- 5) TABELA: prime_formulas
SELECT 
    'prime_formulas' as tabela,
    COUNT(*) as total_registros,
    MAX(created_at) as ultima_insercao,
    EXTRACT(HOURS FROM NOW() - MAX(created_at)) as horas_desde_ultima_insercao,
    MAX(updated_at) as ultima_atualizacao,
    EXTRACT(HOURS FROM NOW() - MAX(updated_at)) as horas_desde_ultima_atualizacao
FROM api.prime_formulas
UNION ALL

-- 6) TABELA: prime_formulas_itens
SELECT 
    'prime_formulas_itens' as tabela,
    COUNT(*) as total_registros,
    MAX(created_at) as ultima_insercao,
    EXTRACT(HOURS FROM NOW() - MAX(created_at)) as horas_desde_ultima_insercao,
    MAX(updated_at) as ultima_atualizacao,
    EXTRACT(HOURS FROM NOW() - MAX(updated_at)) as horas_desde_ultima_atualizacao
FROM api.prime_formulas_itens
ORDER BY horas_desde_ultima_insercao DESC;

-- ========================================
-- VERIFICAR REGISTROS INSERIDOS NAS ÚLTIMAS 24H
-- ========================================

SELECT 
    'prime_clientes' as tabela,
    COUNT(*) as registros_ultimas_24h
FROM api.prime_clientes
WHERE created_at >= NOW() - INTERVAL '24 hours'
UNION ALL
SELECT 
    'prime_pedidos' as tabela,
    COUNT(*) as registros_ultimas_24h
FROM api.prime_pedidos
WHERE created_at >= NOW() - INTERVAL '24 hours'
UNION ALL
SELECT 
    'prime_rastreabilidade' as tabela,
    COUNT(*) as registros_ultimas_24h
FROM api.prime_rastreabilidade
WHERE created_at >= NOW() - INTERVAL '24 hours'
UNION ALL
SELECT 
    'prime_tipos_processo' as tabela,
    COUNT(*) as registros_ultimas_24h
FROM api.prime_tipos_processo
WHERE created_at >= NOW() - INTERVAL '24 hours'
UNION ALL
SELECT 
    'prime_formulas' as tabela,
    COUNT(*) as registros_ultimas_24h
FROM api.prime_formulas
WHERE created_at >= NOW() - INTERVAL '24 hours'
UNION ALL
SELECT 
    'prime_formulas_itens' as tabela,
    COUNT(*) as registros_ultimas_24h
FROM api.prime_formulas_itens
WHERE created_at >= NOW() - INTERVAL '24 hours'
ORDER BY registros_ultimas_24h DESC;

-- ========================================
-- VERIFICAR ÚLTIMOS 5 REGISTROS DE CADA TABELA
-- ========================================

-- prime_clientes
SELECT 'prime_clientes' as tabela, id, created_at, updated_at
FROM api.prime_clientes
ORDER BY created_at DESC
LIMIT 5;

-- prime_pedidos
SELECT 'prime_pedidos' as tabela, id, created_at, updated_at
FROM api.prime_pedidos
ORDER BY created_at DESC
LIMIT 5;

-- prime_rastreabilidade
SELECT 'prime_rastreabilidade' as tabela, codigo, created_at, updated_at
FROM api.prime_rastreabilidade
ORDER BY created_at DESC
LIMIT 5;

-- ========================================
-- FIM
-- ========================================

