-- =====================================================
-- CONSULTA: CUSTO POR CAMPANHA DO GOOGLE ADS
-- =====================================================
-- Tabela: api.investimento_patrocinados
-- Filtro: plataforma = 'google'
-- =====================================================

-- 1. 📊 VERIFICAR ESTRUTURA DA TABELA
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'investimento_patrocinados' 
  AND table_schema = 'api'
ORDER BY ordinal_position;

-- 2. 📊 TOTAL DE REGISTROS DO GOOGLE
SELECT 
    'Total de Registros Google' as tipo,
    COUNT(*) as total_registros,
    MIN(data) as data_mais_antiga,
    MAX(data) as data_mais_recente,
    SUM(valor) as custo_total
FROM api.investimento_patrocinados
WHERE plataforma = 'google';

-- 3. 💰 CUSTO POR CAMPANHA (TOP 50)
SELECT 
    COALESCE(campanha, 'Sem Campanha') as campanha,
    COUNT(*) as total_registros,
    MIN(data) as primeira_data,
    MAX(data) as ultima_data,
    SUM(valor) as custo_total,
    AVG(valor) as custo_medio,
    MIN(valor) as custo_minimo,
    MAX(valor) as custo_maximo
FROM api.investimento_patrocinados
WHERE plataforma = 'google'
GROUP BY campanha
ORDER BY SUM(valor) DESC
LIMIT 50;

-- 4. 📅 CUSTO POR CAMPANHA NOS ÚLTIMOS 30 DIAS
SELECT 
    COALESCE(campanha, 'Sem Campanha') as campanha,
    COUNT(*) as total_registros,
    SUM(valor) as custo_total,
    AVG(valor) as custo_medio
FROM api.investimento_patrocinados
WHERE plataforma = 'google'
  AND data >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY campanha
ORDER BY SUM(valor) DESC;

-- 5. 📅 CUSTO POR CAMPANHA NOS ÚLTIMOS 90 DIAS
SELECT 
    COALESCE(campanha, 'Sem Campanha') as campanha,
    COUNT(*) as total_registros,
    SUM(valor) as custo_total,
    AVG(valor) as custo_medio
FROM api.investimento_patrocinados
WHERE plataforma = 'google'
  AND data >= CURRENT_DATE - INTERVAL '90 days'
GROUP BY campanha
ORDER BY SUM(valor) DESC;

-- 6. 📅 CUSTO POR CAMPANHA EM 2025
SELECT 
    COALESCE(campanha, 'Sem Campanha') as campanha,
    COUNT(*) as total_registros,
    SUM(valor) as custo_total,
    AVG(valor) as custo_medio
FROM api.investimento_patrocinados
WHERE plataforma = 'google'
  AND data >= '2025-01-01'
  AND data < '2026-01-01'
GROUP BY campanha
ORDER BY SUM(valor) DESC;

-- 7. 📅 CUSTO POR CAMPANHA EM 2024
SELECT 
    COALESCE(campanha, 'Sem Campanha') as campanha,
    COUNT(*) as total_registros,
    SUM(valor) as custo_total,
    AVG(valor) as custo_medio
FROM api.investimento_patrocinados
WHERE plataforma = 'google'
  AND data >= '2024-01-01'
  AND data < '2025-01-01'
GROUP BY campanha
ORDER BY SUM(valor) DESC;

-- 8. 📊 ÚLTIMOS 20 REGISTROS DO GOOGLE
SELECT 
    data,
    COALESCE(campanha, 'Sem Campanha') as campanha,
    valor,
    plataforma
FROM api.investimento_patrocinados
WHERE plataforma = 'google'
ORDER BY data DESC
LIMIT 20;

-- 9. 📊 RESUMO POR MÊS E CAMPANHA (2024-2025)
SELECT 
    DATE_TRUNC('month', data) as mes,
    COALESCE(campanha, 'Sem Campanha') as campanha,
    COUNT(*) as total_registros,
    SUM(valor) as custo_total
FROM api.investimento_patrocinados
WHERE plataforma = 'google'
  AND data >= '2024-01-01'
GROUP BY DATE_TRUNC('month', data), campanha
ORDER BY DATE_TRUNC('month', data) DESC, SUM(valor) DESC;

