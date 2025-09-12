-- =====================================================
-- MIGRAÇÃO: Adicionar timezone à tabela investimento_patrocinados
-- =====================================================
-- Problema: A tabela investimento_patrocinados usa coluna 'data' (date)
-- mas oportunidade_sprint usa timestamptz, causando divergências
-- 
-- Solução: Converter coluna 'data' para timestamptz com GMT-3
-- =====================================================

-- 1. Verificar estrutura atual
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'investimento_patrocinados' 
AND table_schema = 'api';

-- 2. Adicionar nova coluna temporária com timezone
ALTER TABLE api.investimento_patrocinados 
ADD COLUMN data_timestamptz timestamptz;

-- 3. Converter dados existentes
-- Assumindo que as datas existentes estão em GMT-3 (São Paulo)
UPDATE api.investimento_patrocinados 
SET data_timestamptz = (data::text || ' 00:00:00-03')::timestamptz;

-- 4. Verificar conversão (opcional)
SELECT data, data_timestamptz 
FROM api.investimento_patrocinados 
LIMIT 10;

-- 5. Remover coluna antiga
ALTER TABLE api.investimento_patrocinados 
DROP COLUMN data;

-- 6. Renomear nova coluna
ALTER TABLE api.investimento_patrocinados 
RENAME COLUMN data_timestamptz TO data;

-- 7. Adicionar índice para performance
CREATE INDEX IF NOT EXISTS idx_investimento_patrocinados_data 
ON api.investimento_patrocinados(data);

-- 8. Verificar resultado final
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'investimento_patrocinados' 
AND table_schema = 'api';

-- 9. Teste: Verificar alguns registros
SELECT data, valor, plataforma 
FROM api.investimento_patrocinados 
WHERE plataforma = 'google' 
ORDER BY data DESC 
LIMIT 5;
