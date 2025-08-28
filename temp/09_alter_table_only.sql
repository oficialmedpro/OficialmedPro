-- ====================================================
-- APENAS ALTERAR A ESTRUTURA DA TABELA api.unidades
-- ====================================================

-- 1. Alterar telefone_franqueado para VARCHAR sem limite
ALTER TABLE api.unidades 
ALTER COLUMN telefone_franqueado TYPE TEXT;

-- 2. Alterar email_franqueado para VARCHAR sem limite
ALTER TABLE api.unidades 
ALTER COLUMN email_franqueado TYPE TEXT;

-- 3. Adicionar o campo codigo_sprint
ALTER TABLE api.unidades 
ADD COLUMN IF NOT EXISTS codigo_sprint TEXT;

-- 4. Criar índice para performance
CREATE INDEX IF NOT EXISTS idx_unidades_codigo_sprint 
ON api.unidades (codigo_sprint);

-- ====================================================
-- CONSULTA PARA VER A ESTRUTURA APÓS ALTERAÇÃO
-- ====================================================

SELECT 
    column_name,
    data_type,
    is_nullable,
    CASE 
        WHEN character_maximum_length IS NULL THEN 'Ilimitado'
        ELSE character_maximum_length::text
    END as max_length
FROM information_schema.columns 
WHERE table_schema = 'api' 
AND table_name = 'unidades'
ORDER BY ordinal_position;