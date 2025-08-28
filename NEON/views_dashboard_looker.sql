-- ========================================
-- 📊 VIEWS PARA DASHBOARD LOOKER
-- ========================================
-- Data: 2025-01-21
-- Objetivo: Views para alimentar dashboard no Looker
-- Baseado na tabela: api.oportunidade_sprint
-- ========================================

-- ========================================
-- 1️⃣ VIEW PRINCIPAL: v_opps_enriquecidas
-- ========================================
-- Base única para BI com todos os campos enriquecidos
CREATE OR REPLACE VIEW public.v_opps_enriquecidas AS
WITH 
-- Dimensões simuladas via CTE
dim_funil AS (
    SELECT 6 as funil_id, '[1] COMERCIAL APUCARANA' as funil_nome
    UNION ALL
    SELECT 14, '[2] RECOMPRA'
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
),
dim_utm AS (
    SELECT 'google' as utm_source, 'cpc' as utm_medium, 'Google Ads' as origem_inferida
    UNION ALL SELECT 'google', 'ppc', 'Google Ads'
    UNION ALL SELECT 'google', 'paid', 'Google Ads'
    UNION ALL SELECT 'meta', 'paid_social', 'Meta Ads'
    UNION ALL SELECT 'facebook', 'paid_social', 'Meta Ads'
    UNION ALL SELECT 'instagram', 'paid_social', 'Meta Ads'
    UNION ALL SELECT 'site', 'organic', 'Orgânico'
    UNION ALL SELECT 'direct', 'organic', 'Orgânico'
    UNION ALL SELECT 'none', 'organic', 'Orgânico'
    UNION ALL SELECT '(none)', '(none)', 'Orgânico'
    UNION ALL SELECT '', '', 'Outros'
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
            
            -- Fallback para UTM
            WHEN dim_utm.origem_inferida IS NOT NULL 
            THEN dim_utm.origem_inferida
            
            -- Último fallback
            ELSE 'Outros'
        END as origem_final
    FROM api.oportunidade_sprint o
    LEFT JOIN dim_utm ON LOWER(COALESCE(o.utm_source, '')) = LOWER(dim_utm.utm_source) 
                     AND LOWER(COALESCE(o.utm_medium, '')) = LOWER(dim_utm.utm_medium)
)
SELECT 
    -- Chaves/valores
    o.id,
    o.lead_id,
    o.user_id,
    o.title,
    o.value,
    
    -- Pipeline
    o.funil_id,
    df.funil_nome,
    o.crm_column,
    de.etapa_nome,
    de.etapa_ordem,
    
    -- Unidades (usando dados existentes)
    o.unidade_id,
    CASE 
        WHEN o.unidade_id = '[1]' THEN 'Apucarana'
        ELSE o.unidade_id 
    END as nome_unidade,
    
    -- Usuários (campos básicos)
    o.user_id as usuario_id,
    CAST(o.user_id as TEXT) as usuario_nome,
    NULL as usuario_email,
    
    -- Status/datas
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
    
    -- Marcos (flags e datas)
    (o.status_orcamento = 'aprovado') as flag_venda,
    CASE WHEN o.status_orcamento = 'aprovado' THEN o.update_date END as data_venda,
    (o.status = 'gain') as flag_ganho,
    o.gain_date as data_ganho,
    (o.primecadastro = 1) as flag_cadastro,
    CASE WHEN o.primecadastro = 1 THEN o.update_date END as data_cadastro,
    
    -- Motivos
    o.loss_reason,
    o.gain_reason,
    
    -- Compra
    o.tipo_de_compra,
    
    -- Origem
    o.origem_oportunidade,
    o.origem_final,
    dim_orig.origem_grupo,
    
    -- UTM
    o.utm_source,
    o.utm_medium,
    o.utm_campaign,
    o.utm_content,
    o.utm_term,
    o.utm_origin,
    o.utm_referer,
    
    -- Métricas derivadas
    CASE 
        WHEN o.gain_date IS NOT NULL THEN 
            EXTRACT(days FROM o.gain_date - o.create_date)
        ELSE NULL 
    END as dias_ate_ganho,
    
    CASE 
        WHEN o.gain_date IS NULL AND o.lost_date IS NULL THEN o.value
        ELSE 0
    END as valor_em_aberto,
    
    -- Campo de filtro temporal padrão
    COALESCE(o.gain_date, 
             CASE WHEN o.status_orcamento = 'aprovado' THEN o.update_date END,
             CASE WHEN o.primecadastro = 1 THEN o.update_date END,
             o.create_date) as data_referencia

FROM origem_final_calc o
LEFT JOIN dim_funil df ON o.funil_id = df.funil_id
LEFT JOIN dim_etapa de ON o.crm_column = de.crm_column
LEFT JOIN dim_origem dim_orig ON o.origem_final = dim_orig.origem_oportunidade;

-- ========================================
-- 2️⃣ VIEW: v_leads_agg (agrupado por lead)
-- ========================================
CREATE OR REPLACE VIEW public.v_leads_agg AS
SELECT 
    lead_id,
    COUNT(*) as total_opps,
    
    -- Contadores por status
    SUM(CASE WHEN gain_date IS NOT NULL THEN 1 ELSE 0 END) as qtd_gain,
    SUM(CASE WHEN lost_date IS NOT NULL THEN 1 ELSE 0 END) as qtd_lost,
    SUM(CASE WHEN gain_date IS NULL AND lost_date IS NULL THEN 1 ELSE 0 END) as qtd_open,
    
    -- Valores por status
    SUM(CASE WHEN gain_date IS NOT NULL THEN value ELSE 0 END) as valor_gain_total,
    SUM(CASE WHEN lost_date IS NOT NULL THEN value ELSE 0 END) as valor_lost_total,
    SUM(CASE WHEN gain_date IS NULL AND lost_date IS NULL THEN value ELSE 0 END) as valor_open_total,
    
    -- Tickets médios
    CASE 
        WHEN SUM(CASE WHEN gain_date IS NOT NULL THEN 1 ELSE 0 END) > 0 
        THEN SUM(CASE WHEN gain_date IS NOT NULL THEN value ELSE 0 END) / 
             SUM(CASE WHEN gain_date IS NOT NULL THEN 1 ELSE 0 END)
        ELSE 0 
    END as ticket_medio_gain,
    
    CASE 
        WHEN SUM(CASE WHEN lost_date IS NOT NULL THEN 1 ELSE 0 END) > 0 
        THEN SUM(CASE WHEN lost_date IS NOT NULL THEN value ELSE 0 END) / 
             SUM(CASE WHEN lost_date IS NOT NULL THEN 1 ELSE 0 END)
        ELSE 0 
    END as ticket_medio_lost,
    
    CASE 
        WHEN SUM(CASE WHEN gain_date IS NULL AND lost_date IS NULL THEN 1 ELSE 0 END) > 0 
        THEN SUM(CASE WHEN gain_date IS NULL AND lost_date IS NULL THEN value ELSE 0 END) / 
             SUM(CASE WHEN gain_date IS NULL AND lost_date IS NULL THEN 1 ELSE 0 END)
        ELSE 0 
    END as ticket_medio_open,
    
    -- Média de dias até ganho
    AVG(CASE 
        WHEN gain_date IS NOT NULL 
        THEN EXTRACT(days FROM gain_date - create_date)
        ELSE NULL 
    END) as media_dias_ate_ganho,
    
    -- Datas de controle
    MIN(create_date) as primeiro_create_date,
    MAX(update_date) as ultima_movimentacao
    
FROM api.oportunidade_sprint
GROUP BY lead_id;

-- ========================================
-- 3️⃣ VIEW: v_vendedor_periodo (scoreboard)
-- ========================================
CREATE OR REPLACE VIEW public.v_vendedor_periodo AS
WITH periodos AS (
    SELECT 
        user_id,
        DATE_TRUNC('day', create_date) as periodo_dia,
        DATE_TRUNC('week', create_date) as periodo_semana,
        DATE_TRUNC('month', create_date) as periodo_mes,
        create_date,
        gain_date,
        update_date,
        value,
        status_orcamento,
        primecadastro,
        unidade_id,
        funil_id
    FROM api.oportunidade_sprint
)
SELECT 
    user_id,
    periodo_dia,
    periodo_semana,
    periodo_mes,
    unidade_id,
    funil_id,
    
    -- Oportunidades criadas
    COUNT(*) as opps_criadas,
    
    -- Vendas (status_orcamento = 'aprovado')
    SUM(CASE WHEN status_orcamento = 'aprovado' THEN 1 ELSE 0 END) as qtd_vendas,
    SUM(CASE WHEN status_orcamento = 'aprovado' THEN value ELSE 0 END) as valor_vendas,
    
    -- Ganhos (gain_date no período)
    SUM(CASE WHEN gain_date IS NOT NULL AND DATE_TRUNC('day', gain_date) = periodo_dia THEN 1 ELSE 0 END) as qtd_ganhos,
    SUM(CASE WHEN gain_date IS NOT NULL AND DATE_TRUNC('day', gain_date) = periodo_dia THEN value ELSE 0 END) as valor_ganhos,
    
    -- Cadastros (primecadastro = 1)
    SUM(CASE WHEN primecadastro = 1 THEN 1 ELSE 0 END) as qtd_cadastros,
    
    -- Ticket médio (por vendas)
    CASE 
        WHEN SUM(CASE WHEN status_orcamento = 'aprovado' THEN 1 ELSE 0 END) > 0 
        THEN SUM(CASE WHEN status_orcamento = 'aprovado' THEN value ELSE 0 END) / 
             SUM(CASE WHEN status_orcamento = 'aprovado' THEN 1 ELSE 0 END)
        ELSE 0 
    END as ticket_medio,
    
    -- Taxa de conversão (ganhos / oportunidades criadas)
    CASE 
        WHEN COUNT(*) > 0 
        THEN (SUM(CASE WHEN gain_date IS NOT NULL AND DATE_TRUNC('day', gain_date) = periodo_dia THEN 1 ELSE 0 END)::DECIMAL / COUNT(*)) * 100
        ELSE 0 
    END as taxa_conversao_pct
    
FROM periodos
GROUP BY user_id, periodo_dia, periodo_semana, periodo_mes, unidade_id, funil_id;

-- ========================================
-- 4️⃣ VIEW: v_funil_etapas (diluição e passagem)
-- ========================================
CREATE OR REPLACE VIEW public.v_funil_etapas AS
WITH 
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
),
entradas_etapa AS (
    SELECT 
        o.funil_id,
        o.crm_column,
        DATE_TRUNC('day', COALESCE(o.last_column_change, o.create_date)) as periodo,
        COUNT(*) as qtd_entradas,
        SUM(o.value) as valor_total
    FROM api.oportunidade_sprint o
    WHERE o.funil_id IS NOT NULL
    GROUP BY o.funil_id, o.crm_column, DATE_TRUNC('day', COALESCE(o.last_column_change, o.create_date))
),
proxima_etapa AS (
    SELECT 
        de.*,
        LAG(de.crm_column) OVER (PARTITION BY de.funil_id ORDER BY de.etapa_ordem) as etapa_anterior,
        LEAD(de.crm_column) OVER (PARTITION BY de.funil_id ORDER BY de.etapa_ordem) as proxima_etapa
    FROM dim_etapa de
    WHERE de.is_auxiliar = FALSE
),
primeira_etapa AS (
    SELECT funil_id, MIN(etapa_ordem) as primeira_ordem
    FROM dim_etapa 
    WHERE is_auxiliar = FALSE
    GROUP BY funil_id
)
SELECT 
    ee.funil_id,
    ee.crm_column,
    de.etapa_nome,
    de.etapa_ordem,
    ee.periodo,
    ee.qtd_entradas as qtd,
    ee.valor_total,
    
    -- Taxa de passagem para próxima etapa
    CASE 
        WHEN pe.proxima_etapa IS NOT NULL THEN
            COALESCE(
                (SELECT qtd_entradas 
                 FROM entradas_etapa ee2 
                 WHERE ee2.crm_column = pe.proxima_etapa 
                   AND ee2.periodo = ee.periodo)::DECIMAL / NULLIF(ee.qtd_entradas, 0) * 100,
                0
            )
        ELSE NULL
    END as taxa_passagem_prox,
    
    -- Taxa de retenção do topo
    CASE 
        WHEN primeira.primeira_ordem IS NOT NULL THEN
            COALESCE(
                ee.qtd_entradas::DECIMAL / NULLIF(
                    (SELECT qtd_entradas 
                     FROM entradas_etapa ee3
                     JOIN dim_etapa de3 ON ee3.crm_column = de3.crm_column
                     WHERE de3.funil_id = ee.funil_id 
                       AND de3.etapa_ordem = primeira.primeira_ordem
                       AND ee3.periodo = ee.periodo), 0
                ) * 100,
                0
            )
        ELSE NULL
    END as taxa_retencao_do_topo
    
FROM entradas_etapa ee
LEFT JOIN dim_etapa de ON ee.crm_column = de.crm_column
LEFT JOIN proxima_etapa pe ON ee.crm_column = pe.crm_column
LEFT JOIN primeira_etapa primeira ON ee.funil_id = primeira.funil_id;

-- ========================================
-- 5️⃣ VIEW: v_origens (entrantes por origem)
-- ========================================
CREATE OR REPLACE VIEW public.v_origens AS
WITH 
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
),
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
            ELSE 'Outros'
        END as origem_final
    FROM api.oportunidade_sprint o
),
leads_unicos AS (
    SELECT 
        lead_id,
        MIN(create_date) as primeiro_create_date,
        origem_final,
        utm_source,
        utm_medium,
        utm_campaign,
        utm_content,
        utm_term
    FROM origem_final_calc
    GROUP BY lead_id, origem_final, utm_source, utm_medium, utm_campaign, utm_content, utm_term
)
SELECT 
    DATE_TRUNC('day', lu.primeiro_create_date) as periodo,
    lu.origem_final,
    dim_orig.origem_grupo,
    lu.utm_source,
    lu.utm_medium,
    lu.utm_campaign,
    lu.utm_content,
    lu.utm_term,
    
    -- Leads únicos entrantes no topo
    COUNT(DISTINCT lu.lead_id) as qtd_leads_entrantes,
    
    -- Oportunidades totais
    COUNT(o.id) as qtd_opps,
    SUM(o.value) as valor_total
    
FROM leads_unicos lu
LEFT JOIN origem_final_calc o ON lu.lead_id = o.lead_id
LEFT JOIN dim_origem dim_orig ON lu.origem_final = dim_orig.origem_oportunidade
GROUP BY 
    DATE_TRUNC('day', lu.primeiro_create_date),
    lu.origem_final,
    dim_orig.origem_grupo,
    lu.utm_source,
    lu.utm_medium,
    lu.utm_campaign,
    lu.utm_content,
    lu.utm_term;

-- ========================================
-- 6️⃣ VIEW: v_vendas_ultimas_2h (para ronda 2/2h)
-- ========================================
CREATE OR REPLACE VIEW public.v_vendas_ultimas_2h AS
WITH 
dim_etapa AS (
    -- Funil Compra (ID: 6)
    SELECT 130 as crm_column, '[0] ENTRADA' as etapa_nome, 0 as etapa_ordem, 6 as funil_id
    UNION ALL SELECT 231, '[1] ACOLHIMENTO/TRIAGEM', 1, 6
    UNION ALL SELECT 82, '[2] QUALIFICADO', 2, 6
    UNION ALL SELECT 207, '[3] ORÇAMENTO REALIZADO', 3, 6
    UNION ALL SELECT 83, '[4] NEGOCIAÇÃO', 4, 6
    UNION ALL SELECT 85, '[5] FOLLOW UP', 5, 6
    UNION ALL SELECT 232, '[6] CADASTRO', 6, 6
    -- Funil Recompra (ID: 14) - principais
    UNION ALL SELECT 202, '[0] ENTRADA', 0, 14
    UNION ALL SELECT 228, '[1] ACOLHIMENTO/TRIAGEM', 1, 14
    UNION ALL SELECT 229, '[2] QUALIFICAÇÃO', 2, 14
    UNION ALL SELECT 206, '[3] ORÇAMENTOS', 3, 14
    UNION ALL SELECT 203, '[4] NEGOCIAÇÃO', 4, 14
    UNION ALL SELECT 204, '[5] FOLLOW UP', 5, 14
    UNION ALL SELECT 230, '[6] CADASTRO', 6, 14
)
SELECT 
    o.user_id,
    o.funil_id,
    CASE 
        WHEN o.funil_id = 6 THEN '[1] COMERCIAL APUCARANA'
        WHEN o.funil_id = 14 THEN '[2] RECOMPRA'
        ELSE 'Outros'
    END as funil_nome,
    de.etapa_nome,
    o.unidade_id,
    
    -- Vendas nas últimas 2 horas
    COUNT(CASE 
        WHEN o.status_orcamento = 'aprovado' 
         AND o.update_date >= NOW() - INTERVAL '2 hours'
        THEN 1 
    END) as qtd_vendas_2h,
    
    SUM(CASE 
        WHEN o.status_orcamento = 'aprovado' 
         AND o.update_date >= NOW() - INTERVAL '2 hours'
        THEN o.value 
        ELSE 0 
    END) as valor_vendas_2h,
    
    -- Ganhos nas últimas 2 horas
    COUNT(CASE 
        WHEN o.gain_date IS NOT NULL 
         AND o.gain_date >= NOW() - INTERVAL '2 hours'
        THEN 1 
    END) as qtd_ganhos_2h,
    
    SUM(CASE 
        WHEN o.gain_date IS NOT NULL 
         AND o.gain_date >= NOW() - INTERVAL '2 hours'
        THEN o.value 
        ELSE 0 
    END) as valor_ganhos_2h,
    
    -- Cadastros nas últimas 2 horas
    COUNT(CASE 
        WHEN o.primecadastro = 1 
         AND o.update_date >= NOW() - INTERVAL '2 hours'
        THEN 1 
    END) as qtd_cadastros_2h,
    
    -- Timestamp da consulta
    NOW() as consultado_em,
    NOW() - INTERVAL '2 hours' as inicio_periodo_2h
    
FROM api.oportunidade_sprint o
LEFT JOIN dim_etapa de ON o.crm_column = de.crm_column
WHERE o.funil_id IN (6, 14)  -- Apenas funis principais
GROUP BY o.user_id, o.funil_id, de.etapa_nome, o.unidade_id
HAVING 
    COUNT(CASE WHEN o.status_orcamento = 'aprovado' AND o.update_date >= NOW() - INTERVAL '2 hours' THEN 1 END) > 0
    OR COUNT(CASE WHEN o.gain_date IS NOT NULL AND o.gain_date >= NOW() - INTERVAL '2 hours' THEN 1 END) > 0
    OR COUNT(CASE WHEN o.primecadastro = 1 AND o.update_date >= NOW() - INTERVAL '2 hours' THEN 1 END) > 0;

-- ========================================
-- 📋 DOCUMENTAÇÃO DAS VIEWS
-- ========================================

/*
🎯 RESUMO DAS VIEWS CRIADAS:

1️⃣ v_opps_enriquecidas
   - Base única para BI com todos os campos
   - Inclui flags de venda, ganho e cadastro
   - Origem final calculada (declarada > UTM > heurística)
   - Métricas derivadas (dias até ganho, valor em aberto)

2️⃣ v_leads_agg
   - Agrupado por lead_id
   - Contadores e valores por status
   - Tickets médios e tempo médio até ganho

3️⃣ v_vendedor_periodo
   - Scoreboard por vendedor e período
   - Suporte a dia/semana/mês
   - Taxa de conversão calculada

4️⃣ v_funil_etapas
   - Análise de diluição e passagem entre etapas
   - Taxa de passagem e retenção do topo
   - Por período e funil

5️⃣ v_origens
   - Entrantes por origem e UTM
   - Leads únicos no topo do funil
   - Quebra detalhada por UTM

6️⃣ v_vendas_ultimas_2h
   - Específica para ronda 2/2 horas
   - Vendas, ganhos e cadastros recentes
   - Filtro automático das últimas 2 horas

🔧 COMO USAR NO LOOKER:
- Conectar ao Supabase
- Usar as views como fonte de dados
- Aplicar filtros de período conforme necessário
- Usar data_referencia como campo temporal padrão
*/
