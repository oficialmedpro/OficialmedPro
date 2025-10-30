-- ========================================
-- 🔍 VERIFICAR: Clientes do Prime que FALTAM na clientes_mestre
-- ========================================

-- 1️⃣ RESUMO: Quantos faltam?
SELECT 
    'RESUMO' as analise,
    (SELECT COUNT(*) FROM api.prime_clientes WHERE ativo = true) as total_no_prime,
    (SELECT COUNT(*) FROM api.clientes_mestre WHERE id_prime IS NOT NULL) as total_na_mestre,
    (SELECT COUNT(*) FROM api.prime_clientes pc 
     WHERE pc.ativo = true 
     AND NOT EXISTS (
         SELECT 1 FROM api.clientes_mestre cm WHERE cm.id_prime = pc.id
     )) as faltam_na_mestre,
    ROUND(
        (SELECT COUNT(*) FROM api.prime_clientes pc 
         WHERE pc.ativo = true 
         AND NOT EXISTS (
             SELECT 1 FROM api.clientes_mestre cm WHERE cm.id_prime = pc.id
         ))::NUMERIC / 
        (SELECT COUNT(*) FROM api.prime_clientes WHERE ativo = true) * 100, 
        2
    ) as percentual_faltante;

-- 2️⃣ AMOSTRA: 50 primeiros que faltam
SELECT 
    'AMOSTRA - Faltam na clientes_mestre' as analise,
    pc.id as id_prime,
    pc.nome,
    pc.email,
    pc.telefone,
    pc.cpf_cnpj,
    pc.created_at,
    pc.updated_at
FROM api.prime_clientes pc
WHERE pc.ativo = true
AND NOT EXISTS (
    SELECT 1 FROM api.clientes_mestre cm WHERE cm.id_prime = pc.id
)
ORDER BY pc.created_at DESC
LIMIT 50;

-- 3️⃣ VERIFICAR: Triggers estão ativos?
SELECT 
    'TRIGGERS' as analise,
    trigger_name,
    event_manipulation,
    action_timing,
    tgtype,
    tgenabled
FROM information_schema.triggers
WHERE event_object_table = 'prime_clientes'
AND event_object_schema = 'api';

-- 4️⃣ TESTAR: O NELSON MORENO está na clientes_mestre?
SELECT 
    'NELSON MORENO - No Prime' as analise,
    pc.id,
    pc.nome,
    pc.telefone,
    pc.email
FROM api.prime_clientes pc
WHERE pc.nome ILIKE '%NELSON MORENO%'
UNION ALL
SELECT 
    'NELSON MORENO - Na Mestre' as analise,
    cm.id::text,
    cm.nome_completo,
    cm.whatsapp,
    cm.email
FROM api.clientes_mestre cm
WHERE cm.nome_completo ILIKE '%NELSON MORENO%';

-- 5️⃣ COMPARAR: Dados do Dashboard
SELECT 
    'Dashboard Prime (clientes_mestre)' as fonte,
    COUNT(*) as total,
    COUNT(CASE WHEN email IS NOT NULL AND email != '' THEN 1 END) as com_email,
    COUNT(CASE WHEN whatsapp IS NOT NULL AND whatsapp != '' THEN 1 END) as com_whatsapp,
    COUNT(CASE WHEN cpf IS NOT NULL AND cpf != '' THEN 1 END) as com_cpf
FROM api.clientes_mestre
WHERE id_prime IS NOT NULL
UNION ALL
SELECT 
    'Prime Clientes (fonte real)' as fonte,
    COUNT(*) as total,
    COUNT(CASE WHEN email IS NOT NULL AND email != '' THEN 1 END) as com_email,
    COUNT(CASE WHEN telefone IS NOT NULL AND telefone != '' THEN 1 END) as com_telefone,
    COUNT(CASE WHEN cpf_cnpj IS NOT NULL AND cpf_cnpj != '' THEN 1 END) as com_cpf
FROM api.prime_clientes
WHERE ativo = true;
