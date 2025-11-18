-- ========================================
-- 🔍 INVESTIGAR: NELSON MORENO
-- ========================================
-- Por que os dados completos do Firebird não chegam no Supabase?

-- 1️⃣ DADOS NO SUPABASE - prime_clientes
SELECT 
    id,
    nome,
    email,
    telefone,
    cpf_cnpj,
    endereco_logradouro,
    endereco_numero,
    endereco_cep,
    endereco_cidade,
    endereco_estado,
    data_nascimento,
    ativo,
    created_at,
    updated_at
FROM api.prime_clientes
WHERE nome ILIKE '%NELSON MORENO%'
OR id IN (
    SELECT cliente_id 
    FROM api.prime_pedidos 
    WHERE codigo_orcamento_original = 251003542
);

-- 2️⃣ PEDIDOS DESSE CLIENTE
SELECT 
    id,
    cliente_id,
    codigo_orcamento_original,
    data_criacao,
    valor_total,
    status_aprovacao,
    observacoes
FROM api.prime_pedidos
WHERE codigo_orcamento_original = 251003542
OR cliente_id IN (
    SELECT id FROM api.prime_clientes 
    WHERE nome ILIKE '%NELSON MORENO%'
);

-- 3️⃣ DADOS NO CLIENTES_MESTRE
SELECT 
    id,
    id_prime,
    nome_completo,
    email,
    whatsapp,
    telefone,
    cpf,
    qualidade_dados,
    origem_marcas,
    data_primeira_captura,
    data_ultima_atualizacao
FROM api.clientes_mestre
WHERE nome_completo ILIKE '%NELSON MORENO%'
OR id_prime IN (
    SELECT id FROM api.prime_clientes 
    WHERE nome ILIKE '%NELSON MORENO%'
);

-- 4️⃣ VERIFICAR SE TEM EM OUTRAS TABELAS
SELECT 
    'Sprint (leads)' as tabela,
    COUNT(*) as encontrados
FROM api.leads
WHERE firstname || ' ' || lastname ILIKE '%NELSON MORENO%'
UNION ALL
SELECT 
    'GreatPage' as tabela,
    COUNT(*) as encontrados
FROM api.greatpage_leads
WHERE nome_completo ILIKE '%NELSON MORENO%'
UNION ALL
SELECT 
    'BlackLabs' as tabela,
    COUNT(*) as encontrados
FROM api.blacklabs
WHERE cliente ILIKE '%NELSON MORENO%';
