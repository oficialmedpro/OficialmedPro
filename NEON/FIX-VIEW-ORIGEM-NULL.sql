-- ========================================
-- 🔧 FIX: ORIGEM NULL + CAMPO ID
-- ========================================
-- Correção para origem_oportunidade NULL e campo ID

CREATE OR REPLACE VIEW public.v_opps_enriquecidas AS
WITH 
-- Dimensões simuladas via CTE
dim_funil AS (
    SELECT 6 as funil_id, '[1] COMERCIAL APUCARANA' as funil_nome
    UNION ALL SELECT 14, '[2] RECOMPRA'
    UNION ALL SELECT 0, 'Sem Funil' -- Para registros sem funil_id
),
dim_etapa AS (
    -- Funil Compra (ID: 6)
    SELECT 130 as crm_column, '[0] ENTRADA' as etapa_nome, 0 as etapa_ordem, 6 as funil_id, FALSE as is_auxiliar
    UNION ALL SELECT 231, '[1] ACOLHIMENTO/TRIAGEM', 1, 6, FALSE
    UNION ALL SELECT 82, '[2] QUALIFICADO', 2, 6, FALSE
    UNION ALL SELECT 207, '[3] ORÇAMENTO REALIZADO', 3, 6, FALSE
    UNION ALL SELECT 83, '[4] NEGOCIAÇÃO', 4, 6, FALSE
    UNION ALL SELECT 85, '[5] FOLLOW UP', 5, 6, FALSE
    UNION ALL SELECT 232, '[6] CADASTRO', 6, 6, FALSE
    -- Funil Recompra (ID: 14)
    UNION ALL SELECT 227, '[X] PROMO', 99, 14, TRUE
    UNION ALL SELECT 202, '[0] ENTRADA', 0, 14, FALSE
    UNION ALL SELECT 228, '[1] ACOLHIMENTO/TRIAGEM', 1, 14, FALSE
    UNION ALL SELECT 229, '[2] QUALIFICAÇÃO', 2, 14, FALSE
    UNION ALL SELECT 206, '[3] ORÇAMENTOS', 3, 14, FALSE
    UNION ALL SELECT 203, '[4] NEGOCIAÇÃO', 4, 14, FALSE
    UNION ALL SELECT 204, '[5] FOLLOW UP', 5, 14, FALSE
    UNION ALL SELECT 230, '[6] CADASTRO', 6, 14, FALSE
    UNION ALL SELECT 205, '[X] PARCEIROS', 98, 14, TRUE
    UNION ALL SELECT 241, '[0] MONITORAMENTO', 10, 14, FALSE
    UNION ALL SELECT 146, '[1] DISPARO', 11, 14, FALSE
    UNION ALL SELECT 147, '[2] DIA 1 - 1º TENTATIVA', 12, 14, FALSE
    UNION ALL SELECT 167, '[3] DIA 1 - 2º TENTATIVA', 13, 14, FALSE
    UNION ALL SELECT 148, '[4] DIA 2 - 1º TENTATIVA', 14, 14, FALSE
    UNION ALL SELECT 168, '[5] DIA 2 - 2º TENTATIVA', 15, 14, FALSE
    UNION ALL SELECT 149, '[6] DIA 3 - 1º TENTATIVA', 16, 14, FALSE
    UNION ALL SELECT 169, '[7] DIA 3 - 2º TENTATIVA', 17, 14, FALSE
    UNION ALL SELECT 150, '[8] FOLLOW UP INFINITO', 18, 14, FALSE
    UNION ALL SELECT 0, 'Sem Etapa', 999, 0, FALSE -- Para registros sem crm_column
),
dim_origem AS (
    SELECT 'Google Ads' as origem_oportunidade, 'Mídia Paga' as origem_grupo
    UNION ALL SELECT 'Meta Ads', 'Mídia Paga'
    UNION ALL SELECT 'Orgânico', 'Orgânico'
    UNION ALL SELECT 'Indicação', 'Referência'
    UNION ALL SELECT 'Prescritor', 'Referência'
    UNION ALL SELECT 'Campanha', 'Marketing'
    UNION ALL SELECT 'Monitoramento', 'Interno'
    UNION ALL SELECT 'Colaborador', 'Interno'
    UNION ALL SELECT 'Franquia', 'Parceiros'
    UNION ALL SELECT 'Farmácia Parceira', 'Parceiros'
    UNION ALL SELECT 'Site', 'Digital'
    UNION ALL SELECT 'Phusion/disparo', 'Automação'
    UNION ALL SELECT 'Contato Rosana', 'Pessoal'
    UNION ALL SELECT 'Contato Poliana', 'Pessoal'
    UNION ALL SELECT 'Yampi Parceiro', 'Parceiros'
    UNION ALL SELECT 'Outros', 'Outros' -- Fallback
    UNION ALL SELECT 'Não preenchida', 'Não preenchida' -- Para NULLs
),
-- Lógica para origem final
origem_final_calc AS (
    SELECT 
        o.*,
        CASE 
            -- Google Ads: origem_oportunidade contém "google" OU utm_source é "google" ou "Google Ads"
            WHEN LOWER(COALESCE(o.origem_oportunidade, '')) LIKE '%google%' 
                 OR LOWER(COALESCE(o.utm_source, '')) IN ('google', 'google ads')
                 OR LOWER(COALESCE(o.utm_medium, '')) IN ('cpc', 'ppc', 'paid') 
            THEN 'Google Ads'
            
            -- Meta Ads: origem_oportunidade contém "meta/facebook/instagram" OU utm_source correspondente
            WHEN LOWER(COALESCE(o.origem_oportunidade, '')) LIKE ANY(ARRAY['%meta%', '%facebook%', '%instagram%'])
                 OR LOWER(COALESCE(o.utm_source, '')) IN ('meta', 'facebook', 'instagram') 
                 OR LOWER(COALESCE(o.utm_medium, '')) = 'paid_social' 
            THEN 'Meta Ads'
            
            -- Orgânico: origem_oportunidade é "orgânico" OU utm indica orgânico
            WHEN LOWER(COALESCE(o.origem_oportunidade, '')) LIKE '%org%nico%'
                 OR LOWER(COALESCE(o.utm_medium, '')) = 'organic' 
                 OR LOWER(COALESCE(o.utm_source, '')) IN ('site', 'direct', 'none', '(none)') 
            THEN 'Orgânico'
            
            -- Se origem_oportunidade está preenchida, usar ela
            WHEN o.origem_oportunidade IS NOT NULL AND TRIM(o.origem_oportunidade) != '' 
            THEN o.origem_oportunidade
            
            -- Último fallback
            ELSE 'Não preenchida'
        END as origem_final
    FROM api.oportunidade_sprint o
)
SELECT 
    -- 🆔 CHAVES/IDs (PRINCIPAIS)
    o.id as oportunidade_id,  -- ID principal da oportunidade
    o.id,                     -- ID duplicado para compatibilidade
    o.lead_id,
    o.user_id,
    
    -- 📝 DADOS BÁSICOS
    o.title,
    o.value,
    
    -- 🔄 PIPELINE
    COALESCE(o.funil_id, 0) as funil_id,
    COALESCE(df.funil_nome, 'Sem Funil') as funil_nome,
    COALESCE(o.crm_column, 0) as crm_column,
    COALESCE(de.etapa_nome, 'Sem Etapa') as etapa_nome,
    COALESCE(de.etapa_ordem, 999) as etapa_ordem,
    
    -- 🏢 UNIDADES
    o.unidade_id,
    CASE 
        WHEN o.unidade_id = '[1]' THEN 'Apucarana'
        ELSE COALESCE(o.unidade_id, 'Sem Unidade')
    END as nome_unidade,
    
    -- 👤 USUÁRIOS
    o.user_id as usuario_id,
    CAST(COALESCE(o.user_id, 0) as TEXT) as usuario_nome,
    NULL as usuario_email,
    
    -- 📊 STATUS/DATAS
    CASE 
        WHEN o.gain_date IS NOT NULL THEN 'gain'
        WHEN o.lost_date IS NOT NULL THEN 'lost'
        ELSE 'open'
    END as status_final,
    o.create_date,
    o.gain_date,
    o.lost_date,
    o.reopen_date,
    o.update_date,
    
    -- 🎯 MARCOS (FLAGS E DATAS)
    (o.status_orcamento = 'aprovado') as flag_venda,
    CASE WHEN o.status_orcamento = 'aprovado' THEN o.update_date END as data_venda,
    (o.status = 'gain') as flag_ganho,
    o.gain_date as data_ganho,
    (o.primecadastro = 1) as flag_cadastro,
    CASE WHEN o.primecadastro = 1 THEN o.update_date END as data_cadastro,
    
    -- ❓ MOTIVOS
    o.loss_reason,
    o.gain_reason,
    
    -- 🛒 COMPRA
    o.tipo_de_compra,
    
    -- 🎯 ORIGEM (CORRIGIDA)
    CASE 
        WHEN o.origem_oportunidade IS NULL OR TRIM(o.origem_oportunidade) = '' 
        THEN 'Não preenchida'
        ELSE o.origem_oportunidade 
    END as origem_oportunidade,
    o.origem_final,
    COALESCE(dim_orig.origem_grupo, 'Outros') as origem_grupo,
    
    -- 🏷️ UTM
    o.utm_source,
    o.utm_medium,
    o.utm_campaign,
    o.utm_content,
    o.utm_term,
    o.utm_origin,
    o.utm_referer,
    
    -- 📈 MÉTRICAS DERIVADAS
    CASE 
        WHEN o.gain_date IS NOT NULL THEN 
            EXTRACT(days FROM o.gain_date - o.create_date)
        ELSE NULL 
    END as dias_ate_ganho,
    
    CASE 
        WHEN o.gain_date IS NULL AND o.lost_date IS NULL THEN o.value
        ELSE 0
    END as valor_em_aberto,
    
    -- 📅 CAMPO TEMPORAL (NUNCA NULL)
    COALESCE(o.gain_date, 
             CASE WHEN o.status_orcamento = 'aprovado' THEN o.update_date END,
             CASE WHEN o.primecadastro = 1 THEN o.update_date END,
             o.create_date,
             o.update_date,
             CURRENT_DATE) as data_referencia

FROM origem_final_calc o
LEFT JOIN dim_funil df ON COALESCE(o.funil_id, 0) = df.funil_id
LEFT JOIN dim_etapa de ON COALESCE(o.crm_column, 0) = de.crm_column
LEFT JOIN dim_origem dim_orig ON o.origem_final = dim_orig.origem_oportunidade;

-- ========================================
-- 🧪 TESTES APÓS EXECUTAR
-- ========================================

/*
-- Teste 1: Total deve continuar 20.818
SELECT COUNT(*) as total_view FROM v_opps_enriquecidas;

-- Teste 2: Verificar origem "Não preenchida"
SELECT COUNT(*) as nao_preenchidas 
FROM v_opps_enriquecidas 
WHERE origem_oportunidade = 'Não preenchida';

-- Teste 3: Verificar se campo oportunidade_id existe
SELECT oportunidade_id, id, title 
FROM v_opps_enriquecidas 
LIMIT 5;
*/


