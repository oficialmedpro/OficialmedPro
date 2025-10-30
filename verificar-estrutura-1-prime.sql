-- 1. Estrutura da tabela PRIME_CLIENTES
SELECT
    '1. PRIME_CLIENTES' as tabela,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'api'
AND table_name = 'prime_clientes'
AND column_name IN ('id', 'updated_at', 'created_at', 'nome', 'telefone')
ORDER BY ordinal_position;
