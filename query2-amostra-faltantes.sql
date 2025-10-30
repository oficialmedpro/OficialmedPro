-- 2️⃣ AMOSTRA: 50 clientes do Prime que FALTAM na clientes_mestre
SELECT 
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
