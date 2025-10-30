-- 3. Estrutura da tabela GREATPAGE_LEADS
SELECT
    '3. GREATPAGE_LEADS' as tabela,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'api'
AND table_name = 'greatpage_leads'
AND column_name IN ('id', 'updated_at', 'created_at', 'nome_completo', 'telefone')
ORDER BY ordinal_position;
