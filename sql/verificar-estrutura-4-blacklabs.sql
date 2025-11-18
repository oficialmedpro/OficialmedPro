-- 4. Estrutura da tabela BLACKLABS
SELECT
    '4. BLACKLABS' as tabela,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'api'
AND table_name = 'blacklabs'
AND column_name IN ('id', 'updated_at', 'created_at', 'cliente', 'telefone')
ORDER BY ordinal_position;
