-- =====================================================
-- CORREÇÃO: Padronizar timezone para GMT-3 em todos os registros
-- =====================================================
-- Problema: Alguns registros têm timezone -0 e outros -03
-- Isso causa inconsistência nos filtros de data
-- =====================================================

-- 1. Verificar registros com timezone inconsistente
SELECT 
    id, 
    data, 
    valor, 
    plataforma,
    EXTRACT(timezone_hour FROM data) as tz_offset
FROM api.investimento_patrocinados 
WHERE EXTRACT(timezone_hour FROM data) != -3
ORDER BY data DESC;

-- 2. Atualizar todos os registros para GMT-3
UPDATE api.investimento_patrocinados 
SET data = (DATE_TRUNC('day', data AT TIME ZONE 'UTC') AT TIME ZONE 'America/Sao_Paulo')
WHERE EXTRACT(timezone_hour FROM data) != -3;

-- 3. Verificar se a correção funcionou
SELECT 
    id, 
    data, 
    valor, 
    plataforma,
    EXTRACT(timezone_hour FROM data) as tz_offset
FROM api.investimento_patrocinados 
ORDER BY data DESC
LIMIT 10;

-- 4. Teste específico para o período problemático
SELECT 
    id, 
    data, 
    valor, 
    plataforma
FROM api.investimento_patrocinados 
WHERE plataforma = 'google' 
AND data >= '2025-09-10 00:00:00-03'
AND data <= '2025-09-10 23:59:59-03'
ORDER BY data;
