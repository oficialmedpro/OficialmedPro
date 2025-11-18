-- 2. Estrutura da tabela LEADS (SprintHub)
SELECT
    '2. LEADS (SprintHub)' as tabela,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'api'
AND table_name = 'leads'
AND column_name IN ('id', 'updated_at', 'updated_date', 'created_at', 'firstname', 'whatsapp')
ORDER BY ordinal_position;
