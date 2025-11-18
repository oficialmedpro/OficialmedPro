-- ========================================
-- 🔍 INVESTIGAÇÃO: Clientes COM histórico de orçamento mas SEM dados
-- ========================================

-- 1. Clientes COM histórico - PIOR qualidade (20/100)
SELECT 
    '1. COM HISTÓRICO - Qualidade 20/100' as analise,
    COUNT(*) as total
FROM api.vw_inativos_com_orcamento
WHERE qualidade_dados = 20;

-- 2. Amostra de clientes COM histórico e qualidade baixa
SELECT 
    '2. AMOSTRA - Clientes COM histórico (qualidade 20-40)' as analise,
    nome_completo,
    email,
    whatsapp,
    telefone,
    cpf,
    qualidade_dados,
    total_orcamentos,
    status_historico,
    origem_marcas,
    id_prime
FROM api.vw_inativos_com_orcamento
WHERE qualidade_dados <= 40
ORDER BY qualidade_dados ASC
LIMIT 20;

-- 3. Verificar se dados existem no Prime mas não no clientes_mestre
SELECT 
    '3. COMPARAÇÃO Prime vs clientes_mestre' as analise,
    pc.id as id_prime,
    pc.nome as nome_prime,
    cm.nome_completo as nome_mestre,
    pc.email as email_prime,
    cm.email as email_mestre,
    pc.whatsapp as whatsapp_prime,
    cm.whatsapp as whatsapp_mestre,
    pc.cpf as cpf_prime,
    cm.cpf as cpf_mestre,
    cm.qualidade_dados
FROM api.prime_clientes pc
LEFT JOIN api.clientes_mestre cm ON pc.id = cm.id_prime
WHERE cm.id IS NOT NULL
AND cm.qualidade_dados <= 40
LIMIT 10;

-- 4. Distribuição de qualidade - COM histórico
SELECT 
    '4. DISTRIBUIÇÃO - COM histórico' as analise,
    CASE 
        WHEN qualidade_dados = 20 THEN '20/100'
        WHEN qualidade_dados = 40 THEN '40/100'
        WHEN qualidade_dados = 65 THEN '65/100'
        WHEN qualidade_dados >= 90 THEN '90+/100'
        ELSE 'Outros'
    END as faixa_qualidade,
    COUNT(*) as total,
    ROUND(COUNT(*)::NUMERIC * 100 / SUM(COUNT(*)) OVER(), 1) as percentual
FROM api.vw_inativos_com_orcamento
GROUP BY 
    CASE 
        WHEN qualidade_dados = 20 THEN '20/100'
        WHEN qualidade_dados = 40 THEN '40/100'
        WHEN qualidade_dados = 65 THEN '65/100'
        WHEN qualidade_dados >= 90 THEN '90+/100'
        ELSE 'Outros'
    END
ORDER BY total DESC;

-- 5. Distribuição de qualidade - SEM histórico
SELECT 
    '5. DISTRIBUIÇÃO - SEM histórico' as analise,
    CASE 
        WHEN qualidade_dados = 20 THEN '20/100'
        WHEN qualidade_dados = 40 THEN '40/100'
        WHEN qualidade_dados = 65 THEN '65/100'
        WHEN qualidade_dados >= 90 THEN '90+/100'
        ELSE 'Outros'
    END as faixa_qualidade,
    COUNT(*) as total,
    ROUND(COUNT(*)::NUMERIC * 100 / SUM(COUNT(*)) OVER(), 1) as percentual
FROM api.vw_inativos_sem_orcamento
GROUP BY 
    CASE 
        WHEN qualidade_dados = 20 THEN '20/100'
        WHEN qualidade_dados = 40 THEN '40/100'
        WHEN qualidade_dados = 65 THEN '65/100'
        WHEN qualidade_dados >= 90 THEN '90+/100'
        ELSE 'Outros'
    END
ORDER BY total DESC;

-- 6. Verificar origem dos clientes COM histórico e baixa qualidade
SELECT 
    '6. ORIGEM - COM histórico baixa qualidade' as analise,
    origem_marcas,
    COUNT(*) as total,
    ROUND(AVG(qualidade_dados), 1) as qualidade_media
FROM api.vw_inativos_com_orcamento
WHERE qualidade_dados <= 40
GROUP BY origem_marcas
ORDER BY total DESC;

-- 7. Ver se telefone/email existem no PRIME mas não no clientes_mestre
SELECT 
    '7. DADOS NO PRIME mas FALTANDO no MESTRE' as analise,
    COUNT(*) FILTER (WHERE pc.email IS NOT NULL AND cm.email IS NULL) as email_perdido,
    COUNT(*) FILTER (WHERE pc.whatsapp IS NOT NULL AND cm.whatsapp IS NULL) as whatsapp_perdido,
    COUNT(*) FILTER (WHERE pc.telefone IS NOT NULL AND cm.telefone IS NULL) as telefone_perdido,
    COUNT(*) FILTER (WHERE pc.cpf IS NOT NULL AND cm.cpf IS NULL) as cpf_perdido,
    COUNT(*) as total_analisados
FROM api.prime_clientes pc
INNER JOIN api.clientes_mestre cm ON pc.id = cm.id_prime
WHERE cm.qualidade_dados <= 40;

-- 8. Amostra de clientes que têm dados no Prime mas não no Mestre
SELECT 
    '8. AMOSTRA - Dados no Prime mas não no Mestre' as analise,
    pc.id as id_prime,
    pc.nome as nome_prime,
    cm.nome_completo as nome_mestre,
    CASE WHEN pc.email IS NOT NULL AND cm.email IS NULL THEN '✅ EXISTE NO PRIME' ELSE cm.email END as email_status,
    CASE WHEN pc.whatsapp IS NOT NULL AND cm.whatsapp IS NULL THEN '✅ EXISTE NO PRIME' ELSE cm.whatsapp END as whatsapp_status,
    CASE WHEN pc.cpf IS NOT NULL AND cm.cpf IS NULL THEN '✅ EXISTE NO PRIME' ELSE cm.cpf END as cpf_status,
    cm.qualidade_dados,
    pc.email as email_no_prime,
    pc.whatsapp as whatsapp_no_prime,
    pc.cpf as cpf_no_prime
FROM api.prime_clientes pc
INNER JOIN api.clientes_mestre cm ON pc.id = cm.id_prime
WHERE cm.qualidade_dados = 20
AND (
    (pc.email IS NOT NULL AND cm.email IS NULL) OR
    (pc.whatsapp IS NOT NULL AND cm.whatsapp IS NULL) OR
    (pc.cpf IS NOT NULL AND cm.cpf IS NULL)
)
LIMIT 10;

