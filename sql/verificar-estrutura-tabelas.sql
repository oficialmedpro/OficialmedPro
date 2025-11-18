-- 🔍 VERIFICAR ESTRUTURA DAS TABELAS ANTES DA RECONSOLIDAÇÃO

-- 1️⃣ Estrutura da tabela PRIME_CLIENTES
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

-- 2️⃣ Estrutura da tabela LEADS (SprintHub)
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

-- 3️⃣ Estrutura da tabela GREATPAGE_LEADS
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

-- 4️⃣ Estrutura da tabela BLACKLABS
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
