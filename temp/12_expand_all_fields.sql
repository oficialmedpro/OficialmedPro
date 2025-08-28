-- ====================================================
-- EXPANDIR TODOS OS CAMPOS QUE PODEM ESTAR LIMITADOS
-- ====================================================

-- Expandir TODOS os campos VARCHAR para TEXT (ilimitado)
ALTER TABLE api.unidades ALTER COLUMN codigo TYPE TEXT;
ALTER TABLE api.unidades ALTER COLUMN nome TYPE TEXT;
ALTER TABLE api.unidades ALTER COLUMN cidade TYPE TEXT;
ALTER TABLE api.unidades ALTER COLUMN estado TYPE TEXT;
ALTER TABLE api.unidades ALTER COLUMN franqueado_nome TYPE TEXT;
ALTER TABLE api.unidades ALTER COLUMN email_franqueado TYPE TEXT;
ALTER TABLE api.unidades ALTER COLUMN telefone_franqueado TYPE TEXT;
ALTER TABLE api.unidades ALTER COLUMN status TYPE TEXT;
ALTER TABLE api.unidades ALTER COLUMN codigo_sprint TYPE TEXT;

-- Verificar estrutura após alteração
SELECT 
    column_name as "Campo",
    data_type as "Tipo",
    CASE 
        WHEN character_maximum_length IS NULL THEN 'Ilimitado'
        ELSE character_maximum_length::text
    END as "Tamanho"
FROM information_schema.columns 
WHERE table_schema = 'api' 
AND table_name = 'unidades'
ORDER BY ordinal_position;