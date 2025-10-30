-- ========================================
-- 🔍 INVESTIGAÇÃO: Por que dados estão invertidos?
-- ========================================

-- 1. Verificar se clientes COM orçamento têm dados no prime_clientes
SELECT 
    '1. Clientes COM orçamento - Dados no Prime' as analise,
    COUNT(*) as total_com_orcamento,
    COUNT(pc.email) as tem_email_no_prime,
    COUNT(pc.whatsapp) as tem_whatsapp_no_prime,
    COUNT(pc.telefone) as tem_telefone_no_prime,
    COUNT(pc.cpf) as tem_cpf_no_prime,
    ROUND(AVG(CASE 
        WHEN pc.email IS NOT NULL THEN 20 ELSE 0 END +
        CASE WHEN pc.whatsapp IS NOT NULL THEN 20 ELSE 0 END +
        CASE WHEN pc.telefone IS NOT NULL THEN 20 ELSE 0 END +
        CASE WHEN pc.cpf IS NOT NULL THEN 10 ELSE 0 END
    ), 1) as qualidade_potencial_media
FROM api.vw_inativos_com_orcamento vico
INNER JOIN api.prime_clientes pc ON vico.id_prime = pc.id;

-- 2. Verificar se clientes SEM orçamento NÃO têm id_prime (são só do Sprint/GreatPages)
SELECT 
    '2. Clientes SEM orçamento - Origem' as analise,
    origem_marcas,
    COUNT(*) as total,
    ROUND(AVG(qualidade_dados), 1) as qualidade_media,
    COUNT(*) FILTER (WHERE id_prime IS NULL) as sem_id_prime,
    COUNT(*) FILTER (WHERE id_prime IS NOT NULL) as com_id_prime
FROM api.vw_inativos_sem_orcamento
GROUP BY origem_marcas
ORDER BY total DESC;

-- 3. AMOSTRA: Cliente COM orçamento - Dados no Prime vs Mestre
SELECT 
    '3. COMPARAÇÃO - COM orçamento (Prime vs Mestre)' as analise,
    vico.nome_completo,
    vico.qualidade_dados as qualidade_mestre,
    -- Dados no MESTRE
    vico.email as email_mestre,
    vico.whatsapp as whatsapp_mestre,
    vico.telefone as telefone_mestre,
    vico.cpf as cpf_mestre,
    -- Dados no PRIME
    pc.email as email_prime,
    pc.whatsapp as whatsapp_prime,
    pc.telefone as telefone_prime,
    pc.cpf as cpf_prime,
    -- Análise
    CASE 
        WHEN pc.email IS NOT NULL AND vico.email IS NULL THEN '🚨 EMAIL PERDIDO'
        WHEN pc.email IS NOT NULL THEN '✅ Email OK'
        ELSE '❌ Sem email'
    END as status_email,
    CASE 
        WHEN pc.whatsapp IS NOT NULL AND vico.whatsapp IS NULL THEN '🚨 WHATSAPP PERDIDO'
        WHEN pc.whatsapp IS NOT NULL THEN '✅ WhatsApp OK'
        ELSE '❌ Sem WhatsApp'
    END as status_whatsapp
FROM api.vw_inativos_com_orcamento vico
INNER JOIN api.prime_clientes pc ON vico.id_prime = pc.id
WHERE vico.qualidade_dados <= 40
ORDER BY vico.qualidade_dados ASC
LIMIT 20;

-- 4. AMOSTRA: Cliente SEM orçamento - De onde vem a qualidade alta?
SELECT 
    '4. AMOSTRA - SEM orçamento (alta qualidade)' as analise,
    nome_completo,
    qualidade_dados,
    email,
    whatsapp,
    telefone,
    cpf,
    origem_marcas,
    id_prime,
    CASE 
        WHEN id_prime IS NULL THEN '🔵 NÃO está no Prime'
        ELSE '🟢 Está no Prime'
    END as status_prime
FROM api.vw_inativos_sem_orcamento
WHERE qualidade_dados >= 90
ORDER BY qualidade_dados DESC
LIMIT 20;

-- 5. CONTAR: Quantos clientes COM orçamento têm dados no Prime que faltam no Mestre
SELECT 
    '5. DADOS PERDIDOS - COM orçamento' as analise,
    COUNT(*) as total_com_orcamento,
    COUNT(*) FILTER (WHERE pc.email IS NOT NULL AND cm.email IS NULL) as email_perdido,
    COUNT(*) FILTER (WHERE pc.whatsapp IS NOT NULL AND cm.whatsapp IS NULL) as whatsapp_perdido,
    COUNT(*) FILTER (WHERE pc.telefone IS NOT NULL AND cm.telefone IS NULL) as telefone_perdido,
    COUNT(*) FILTER (WHERE pc.cpf IS NOT NULL AND cm.cpf IS NULL) as cpf_perdido,
    COUNT(*) FILTER (WHERE 
        (pc.email IS NOT NULL AND cm.email IS NULL) OR
        (pc.whatsapp IS NOT NULL AND cm.whatsapp IS NULL) OR
        (pc.telefone IS NOT NULL AND cm.telefone IS NULL) OR
        (pc.cpf IS NOT NULL AND cm.cpf IS NULL)
    ) as clientes_com_dados_perdidos,
    ROUND(
        COUNT(*) FILTER (WHERE 
            (pc.email IS NOT NULL AND cm.email IS NULL) OR
            (pc.whatsapp IS NOT NULL AND cm.whatsapp IS NULL) OR
            (pc.telefone IS NOT NULL AND cm.telefone IS NULL) OR
            (pc.cpf IS NOT NULL AND cm.cpf IS NULL)
        )::NUMERIC * 100 / COUNT(*), 1
    ) as percentual_com_perda
FROM api.clientes_mestre cm
INNER JOIN api.prime_clientes pc ON cm.id_prime = pc.id
WHERE EXISTS (
    SELECT 1 FROM api.vw_inativos_com_orcamento vico
    WHERE vico.id_prime = cm.id_prime
);

-- 6. Ver exemplo concreto do que você relatou
SELECT 
    '6. EXEMPLO CONCRETO - Ana Julia, Daniele, Flavio' as analise,
    cm.nome_completo,
    cm.qualidade_dados as qualidade_atual,
    cm.email as email_mestre,
    cm.whatsapp as whatsapp_mestre,
    cm.cpf as cpf_mestre,
    pc.email as email_prime,
    pc.whatsapp as whatsapp_prime,
    pc.cpf as cpf_prime,
    -- Calcular qualidade SE pegarmos dados do Prime
    (CASE WHEN COALESCE(cm.nome_completo, pc.nome) IS NOT NULL THEN 20 ELSE 0 END +
     CASE WHEN COALESCE(cm.whatsapp, pc.whatsapp) IS NOT NULL THEN 20 ELSE 0 END +
     CASE WHEN COALESCE(cm.email, pc.email) IS NOT NULL THEN 20 ELSE 0 END +
     CASE WHEN COALESCE(cm.cpf, pc.cpf) IS NOT NULL THEN 10 ELSE 0 END) as qualidade_potencial
FROM api.clientes_mestre cm
INNER JOIN api.prime_clientes pc ON cm.id_prime = pc.id
WHERE cm.nome_completo ILIKE '%ANA JULIA%'
   OR cm.nome_completo ILIKE '%DANIELE%'
   OR cm.nome_completo ILIKE '%FLAVIO%GABRIEL%'
LIMIT 10;

-- 7. RESUMO EXECUTIVO
SELECT 
    '7. RESUMO - Situação geral' as analise,
    (SELECT COUNT(*) FROM api.vw_inativos_com_orcamento) as total_com_orcamento,
    (SELECT COUNT(*) FROM api.vw_inativos_com_orcamento WHERE qualidade_dados <= 40) as com_orcamento_baixa_qualidade,
    (SELECT COUNT(*) FROM api.vw_inativos_sem_orcamento) as total_sem_orcamento,
    (SELECT COUNT(*) FROM api.vw_inativos_sem_orcamento WHERE qualidade_dados >= 90) as sem_orcamento_alta_qualidade,
    (SELECT COUNT(*) FROM api.clientes_mestre cm
     INNER JOIN api.prime_clientes pc ON cm.id_prime = pc.id
     WHERE cm.qualidade_dados <= 40
     AND (pc.email IS NOT NULL OR pc.whatsapp IS NOT NULL OR pc.cpf IS NOT NULL)
    ) as clientes_recuperaveis;

