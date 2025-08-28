-- ========================================
-- 🧪 TESTE - NOVA LÓGICA GOOGLE ADS
-- ========================================
-- Verificar se a nova lógica captura todos os casos:
-- - origem_oportunidade = "Google Ads" (2.687)
-- - utm_source = "Google Ads" (414)  
-- - utm_source = "google" (2.498)

-- 📊 TESTE 1: Contagem por origem_oportunidade
SELECT 
    'ORIGEM_OPORTUNIDADE' as tipo,
    origem_oportunidade,
    COUNT(*) as quantidade
FROM api.oportunidade_sprint
WHERE LOWER(COALESCE(origem_oportunidade, '')) LIKE '%google%'
GROUP BY origem_oportunidade
ORDER BY quantidade DESC;

-- 📊 TESTE 2: Contagem por utm_source  
SELECT 
    'UTM_SOURCE' as tipo,
    utm_source,
    COUNT(*) as quantidade
FROM api.oportunidade_sprint
WHERE LOWER(COALESCE(utm_source, '')) IN ('google', 'google ads')
GROUP BY utm_source
ORDER BY quantidade DESC;

-- 📊 TESTE 3: Nova lógica consolidada
WITH origem_final_calc AS (
    SELECT 
        o.*,
        CASE 
            -- Google Ads: origem_oportunidade contém "google" OU utm_source é "google" ou "Google Ads"
            WHEN LOWER(COALESCE(o.origem_oportunidade, '')) LIKE '%google%' 
                 OR LOWER(COALESCE(o.utm_source, '')) IN ('google', 'google ads')
                 OR LOWER(COALESCE(o.utm_medium, '')) IN ('cpc', 'ppc', 'paid') 
            THEN 'Google Ads'
            
            -- Meta Ads
            WHEN LOWER(COALESCE(o.origem_oportunidade, '')) LIKE ANY(ARRAY['%meta%', '%facebook%', '%instagram%'])
                 OR LOWER(COALESCE(o.utm_source, '')) IN ('meta', 'facebook', 'instagram') 
                 OR LOWER(COALESCE(o.utm_medium, '')) = 'paid_social' 
            THEN 'Meta Ads'
            
            -- Orgânico
            WHEN LOWER(COALESCE(o.origem_oportunidade, '')) LIKE '%org%nico%'
                 OR LOWER(COALESCE(o.utm_medium, '')) = 'organic' 
                 OR LOWER(COALESCE(o.utm_source, '')) IN ('site', 'direct', 'none', '(none)') 
            THEN 'Orgânico'
            
            -- Se origem_oportunidade está preenchida, usar ela
            WHEN o.origem_oportunidade IS NOT NULL AND TRIM(o.origem_oportunidade) != '' 
            THEN o.origem_oportunidade
            
            -- Último fallback
            ELSE 'Outros'
        END as origem_final
    FROM api.oportunidade_sprint o
)
SELECT 
    'NOVA_LOGICA' as tipo,
    origem_final,
    COUNT(*) as quantidade
FROM origem_final_calc
WHERE origem_final = 'Google Ads'
GROUP BY origem_final;

-- 📊 TESTE 4: Comparação detalhada Google Ads
SELECT 
    origem_oportunidade,
    utm_source,
    utm_medium,
    COUNT(*) as quantidade,
    CASE 
        WHEN LOWER(COALESCE(origem_oportunidade, '')) LIKE '%google%' THEN 'Via origem_oportunidade'
        WHEN LOWER(COALESCE(utm_source, '')) IN ('google', 'google ads') THEN 'Via utm_source'
        WHEN LOWER(COALESCE(utm_medium, '')) IN ('cpc', 'ppc', 'paid') THEN 'Via utm_medium'
        ELSE 'Outro critério'
    END as criterio_match
FROM api.oportunidade_sprint
WHERE LOWER(COALESCE(origem_oportunidade, '')) LIKE '%google%' 
   OR LOWER(COALESCE(utm_source, '')) IN ('google', 'google ads')
   OR LOWER(COALESCE(utm_medium, '')) IN ('cpc', 'ppc', 'paid')
GROUP BY origem_oportunidade, utm_source, utm_medium
ORDER BY quantidade DESC
LIMIT 20;

-- 📊 EXPECTATIVA:
-- TESTE 3 deve retornar um total >= 2.687 + 414 + 2.498 = 5.599
-- (pode ser menor se houver sobreposição entre os critérios)


