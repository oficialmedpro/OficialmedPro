-- ========================================
-- 📞 VERIFICAR TELEFONES NA TABELA PRIME
-- ========================================

-- 1️⃣ RESUMO GERAL
SELECT 
    COUNT(*) as total_clientes,
    COUNT(CASE WHEN telefone IS NOT NULL AND telefone != '' THEN 1 END) as com_telefone,
    COUNT(CASE WHEN telefone IS NULL OR telefone = '' THEN 1 END) as sem_telefone,
    ROUND(
        COUNT(CASE WHEN telefone IS NOT NULL AND telefone != '' THEN 1 END)::NUMERIC / COUNT(*) * 100, 
        2
    ) as percentual_com_telefone
FROM api.prime_clientes
WHERE ativo = true;

-- 2️⃣ RESUMO COM EMAIL
SELECT 
    COUNT(*) as total_clientes,
    COUNT(CASE WHEN email IS NOT NULL AND email != '' THEN 1 END) as com_email,
    COUNT(CASE WHEN email IS NULL OR email = '' THEN 1 END) as sem_email,
    ROUND(
        COUNT(CASE WHEN email IS NOT NULL AND email != '' THEN 1 END)::NUMERIC / COUNT(*) * 100, 
        2
    ) as percentual_com_email
FROM api.prime_clientes
WHERE ativo = true;

-- 3️⃣ CRUZAMENTO: TELEFONE vs EMAIL
SELECT 
    CASE 
        WHEN (telefone IS NOT NULL AND telefone != '') AND (email IS NOT NULL AND email != '') THEN 'Com TELEFONE e EMAIL'
        WHEN (telefone IS NOT NULL AND telefone != '') AND (email IS NULL OR email = '') THEN 'Só TELEFONE'
        WHEN (telefone IS NULL OR telefone = '') AND (email IS NOT NULL AND email != '') THEN 'Só EMAIL'
        ELSE 'SEM TELEFONE e SEM EMAIL'
    END as situacao,
    COUNT(*) as total,
    ROUND(COUNT(*)::NUMERIC / (SELECT COUNT(*) FROM api.prime_clientes WHERE ativo = true) * 100, 2) as percentual
FROM api.prime_clientes
WHERE ativo = true
GROUP BY situacao
ORDER BY total DESC;

-- 4️⃣ AMOSTRA: CLIENTES SEM TELEFONE
SELECT 
    id,
    nome,
    email,
    telefone,
    cpf_cnpj,
    data_cadastro
FROM api.prime_clientes
WHERE ativo = true
AND (telefone IS NULL OR telefone = '')
ORDER BY data_cadastro DESC
LIMIT 20;

-- 5️⃣ COMPARAR: PRIME vs CLIENTES_MESTRE
SELECT 
    'Prime' as tabela,
    COUNT(*) as total,
    COUNT(CASE WHEN telefone IS NOT NULL AND telefone != '' THEN 1 END) as com_contato,
    COUNT(CASE WHEN telefone IS NULL OR telefone = '' THEN 1 END) as sem_contato
FROM api.prime_clientes
WHERE ativo = true
UNION ALL
SELECT 
    'Clientes Mestre (com id_prime)' as tabela,
    COUNT(*) as total,
    COUNT(CASE WHEN whatsapp IS NOT NULL AND whatsapp != '' THEN 1 END) as com_contato,
    COUNT(CASE WHEN whatsapp IS NULL OR whatsapp = '' THEN 1 END) as sem_contato
FROM api.clientes_mestre
WHERE id_prime IS NOT NULL;
