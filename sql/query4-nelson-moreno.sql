-- 4️⃣ TESTAR: NELSON MORENO está na clientes_mestre?
SELECT 
    'No Prime' as tabela,
    pc.id::text as id,
    pc.nome,
    pc.telefone as telefone_whatsapp,
    pc.email
FROM api.prime_clientes pc
WHERE pc.nome ILIKE '%NELSON MORENO%'
UNION ALL
SELECT 
    'Na Mestre' as tabela,
    cm.id::text as id,
    cm.nome_completo as nome,
    cm.whatsapp as telefone_whatsapp,
    cm.email
FROM api.clientes_mestre cm
WHERE cm.nome_completo ILIKE '%NELSON MORENO%';
