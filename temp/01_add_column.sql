-- ========================================
-- PASSO 1: ADICIONAR CAMPO codigo_sprint
-- ========================================
-- Execute esta query no Supabase Dashboard > SQL Editor

-- Adicionar campo codigo_sprint na tabela unidades
ALTER TABLE unidades 
ADD COLUMN IF NOT EXISTS codigo_sprint VARCHAR(10);

-- Criar índice para melhor performance nas consultas
CREATE INDEX IF NOT EXISTS idx_unidades_codigo_sprint 
ON unidades (codigo_sprint);

-- Verificar se o campo foi criado corretamente
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'unidades' 
AND column_name = 'codigo_sprint';

-- Ver estrutura completa da tabela
\d unidades;