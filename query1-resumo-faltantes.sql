-- 1️⃣ RESUMO: Quantos clientes do Prime faltam na clientes_mestre?
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
