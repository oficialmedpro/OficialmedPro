-- Quantos clientes têm telefone e quantos não têm
SELECT 
    COUNT(*) as total_clientes,
    COUNT(CASE WHEN telefone IS NOT NULL AND telefone != '' THEN 1 END) as com_telefone,
    COUNT(CASE WHEN telefone IS NULL OR telefone = '' THEN 1 END) as sem_telefone
FROM api.prime_clientes
WHERE ativo = true;
