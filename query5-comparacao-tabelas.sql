-- 5️⃣ COMPARAR: clientes_mestre vs prime_clientes (COMPLETO)
SELECT
    'clientes_mestre (dashboard)' as fonte,
    COUNT(*) as total,
    COUNT(CASE WHEN email IS NOT NULL AND email != '' THEN 1 END) as com_email,
    COUNT(CASE WHEN whatsapp IS NOT NULL AND whatsapp != '' THEN 1 END) as com_whatsapp,
    COUNT(CASE WHEN cpf IS NOT NULL AND cpf != '' THEN 1 END) as com_cpf,
    COUNT(CASE WHEN sexo IS NOT NULL AND sexo != '' THEN 1 END) as com_sexo,
    COUNT(CASE WHEN data_nascimento IS NOT NULL THEN 1 END) as com_data_nascimento,
    COUNT(CASE WHEN endereco_rua IS NOT NULL AND endereco_rua != '' THEN 1 END) as com_endereco,
    COUNT(CASE WHEN bairro IS NOT NULL AND bairro != '' THEN 1 END) as com_bairro,
    COUNT(CASE WHEN cidade IS NOT NULL AND cidade != '' THEN 1 END) as com_cidade,
    COUNT(CASE WHEN estado IS NOT NULL AND estado != '' THEN 1 END) as com_estado,
    COUNT(CASE WHEN cep IS NOT NULL AND cep != '' THEN 1 END) as com_cep,
    ROUND(COUNT(CASE WHEN email IS NOT NULL AND email != '' THEN 1 END)::NUMERIC / COUNT(*) * 100, 1) as perc_email,
    ROUND(COUNT(CASE WHEN whatsapp IS NOT NULL AND whatsapp != '' THEN 1 END)::NUMERIC / COUNT(*) * 100, 1) as perc_whatsapp,
    ROUND(COUNT(CASE WHEN endereco_rua IS NOT NULL AND endereco_rua != '' THEN 1 END)::NUMERIC / COUNT(*) * 100, 1) as perc_endereco
FROM api.clientes_mestre
WHERE id_prime IS NOT NULL

UNION ALL

SELECT
    'prime_clientes (fonte real)' as fonte,
    COUNT(*) as total,
    COUNT(CASE WHEN email IS NOT NULL AND email != '' THEN 1 END) as com_email,
    COUNT(CASE WHEN telefone IS NOT NULL AND telefone != '' THEN 1 END) as com_telefone,
    COUNT(CASE WHEN cpf_cnpj IS NOT NULL AND cpf_cnpj != '' THEN 1 END) as com_cpf,
    COUNT(CASE WHEN sexo IS NOT NULL THEN 1 END) as com_sexo,
    COUNT(CASE WHEN data_nascimento IS NOT NULL THEN 1 END) as com_data_nascimento,
    COUNT(CASE WHEN endereco_logradouro IS NOT NULL AND endereco_logradouro != '' THEN 1 END) as com_endereco,
    COUNT(CASE WHEN endereco_observacao IS NOT NULL AND endereco_observacao != '' THEN 1 END) as com_bairro,
    COUNT(CASE WHEN endereco_cidade IS NOT NULL AND endereco_cidade != '' THEN 1 END) as com_cidade,
    COUNT(CASE WHEN endereco_estado IS NOT NULL AND endereco_estado != '' THEN 1 END) as com_estado,
    COUNT(CASE WHEN endereco_cep IS NOT NULL AND endereco_cep != '' THEN 1 END) as com_cep,
    ROUND(COUNT(CASE WHEN email IS NOT NULL AND email != '' THEN 1 END)::NUMERIC / COUNT(*) * 100, 1) as perc_email,
    ROUND(COUNT(CASE WHEN telefone IS NOT NULL AND telefone != '' THEN 1 END)::NUMERIC / COUNT(*) * 100, 1) as perc_telefone,
    ROUND(COUNT(CASE WHEN endereco_logradouro IS NOT NULL AND endereco_logradouro != '' THEN 1 END)::NUMERIC / COUNT(*) * 100, 1) as perc_endereco
FROM api.prime_clientes
WHERE ativo = true;
