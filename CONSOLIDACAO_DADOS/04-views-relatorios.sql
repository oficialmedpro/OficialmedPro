-- ============================================================================
-- VIEWS PARA RELATÓRIOS E ANÁLISES
-- ============================================================================
-- Descrição: Views SQL sempre atualizadas com estatísticas da base
-- Uso: SELECT * FROM api.view_nome
-- ============================================================================

-- ============================================================================
-- 1. ESTATÍSTICAS GERAIS - COMPLETUDE DOS DADOS
-- ============================================================================

CREATE OR REPLACE VIEW api.stats_completude_dados AS
SELECT
  COUNT(*) as total_clientes,

  -- Contagem por campo
  COUNT(CASE WHEN email IS NOT NULL AND email != '' THEN 1 END) as com_email,
  COUNT(CASE WHEN data_nascimento IS NOT NULL THEN 1 END) as com_data_nascimento,
  COUNT(CASE WHEN cpf IS NOT NULL AND cpf != '' THEN 1 END) as com_cpf,
  COUNT(CASE WHEN whatsapp IS NOT NULL AND whatsapp != '' THEN 1 END) as com_whatsapp,
  COUNT(CASE WHEN telefone IS NOT NULL AND telefone != '' THEN 1 END) as com_telefone,
  COUNT(CASE WHEN nome_completo IS NOT NULL AND nome_completo != '' THEN 1 END) as com_nome,
  COUNT(CASE WHEN endereco_rua IS NOT NULL AND cidade IS NOT NULL AND estado IS NOT NULL THEN 1 END) as com_endereco,

  -- Percentuais
  ROUND(COUNT(CASE WHEN email IS NOT NULL AND email != '' THEN 1 END)::NUMERIC / COUNT(*) * 100, 1) as perc_com_email,
  ROUND(COUNT(CASE WHEN data_nascimento IS NOT NULL THEN 1 END)::NUMERIC / COUNT(*) * 100, 1) as perc_com_data_nascimento,
  ROUND(COUNT(CASE WHEN cpf IS NOT NULL AND cpf != '' THEN 1 END)::NUMERIC / COUNT(*) * 100, 1) as perc_com_cpf,
  ROUND(COUNT(CASE WHEN whatsapp IS NOT NULL AND whatsapp != '' THEN 1 END)::NUMERIC / COUNT(*) * 100, 1) as perc_com_whatsapp,
  ROUND(COUNT(CASE WHEN telefone IS NOT NULL AND telefone != '' THEN 1 END)::NUMERIC / COUNT(*) * 100, 1) as perc_com_telefone,
  ROUND(COUNT(CASE WHEN nome_completo IS NOT NULL AND nome_completo != '' THEN 1 END)::NUMERIC / COUNT(*) * 100, 1) as perc_com_nome,
  ROUND(COUNT(CASE WHEN endereco_rua IS NOT NULL AND cidade IS NOT NULL AND estado IS NOT NULL THEN 1 END)::NUMERIC / COUNT(*) * 100, 1) as perc_com_endereco,

  -- Clientes com TODOS os dados completos
  COUNT(CASE
    WHEN nome_completo IS NOT NULL AND nome_completo != ''
     AND email IS NOT NULL AND email != ''
     AND whatsapp IS NOT NULL AND whatsapp != ''
     AND cpf IS NOT NULL AND cpf != ''
     AND data_nascimento IS NOT NULL
     AND endereco_rua IS NOT NULL AND cidade IS NOT NULL AND estado IS NOT NULL
    THEN 1
  END) as com_dados_completos,

  ROUND(COUNT(CASE
    WHEN nome_completo IS NOT NULL AND nome_completo != ''
     AND email IS NOT NULL AND email != ''
     AND whatsapp IS NOT NULL AND whatsapp != ''
     AND cpf IS NOT NULL AND cpf != ''
     AND data_nascimento IS NOT NULL
     AND endereco_rua IS NOT NULL AND cidade IS NOT NULL AND estado IS NOT NULL
    THEN 1
  END)::NUMERIC / COUNT(*) * 100, 1) as perc_dados_completos

FROM api.clientes_mestre;

COMMENT ON VIEW api.stats_completude_dados IS 'Estatísticas de completude dos dados dos clientes';

-- ============================================================================
-- 2. ESTATÍSTICAS POR ORIGEM (SPRINT vs PRIME)
-- ============================================================================

CREATE OR REPLACE VIEW api.stats_por_origem AS
SELECT
  -- Total geral
  COUNT(*) as total_clientes,

  -- No SprintHub
  COUNT(CASE WHEN id_sprinthub IS NOT NULL THEN 1 END) as no_sprinthub,
  ROUND(COUNT(CASE WHEN id_sprinthub IS NOT NULL THEN 1 END)::NUMERIC / COUNT(*) * 100, 1) as perc_no_sprinthub,

  -- No Prime
  COUNT(CASE WHEN id_prime IS NOT NULL THEN 1 END) as no_prime,
  ROUND(COUNT(CASE WHEN id_prime IS NOT NULL THEN 1 END)::NUMERIC / COUNT(*) * 100, 1) as perc_no_prime,

  -- No GreatPage
  COUNT(CASE WHEN id_greatpage IS NOT NULL THEN 1 END) as no_greatpage,
  ROUND(COUNT(CASE WHEN id_greatpage IS NOT NULL THEN 1 END)::NUMERIC / COUNT(*) * 100, 1) as perc_no_greatpage,

  -- No BlackLabs
  COUNT(CASE WHEN id_blacklabs IS NOT NULL THEN 1 END) as no_blacklabs,
  ROUND(COUNT(CASE WHEN id_blacklabs IS NOT NULL THEN 1 END)::NUMERIC / COUNT(*) * 100, 1) as perc_no_blacklabs,

  -- Em ambos Sprint E Prime
  COUNT(CASE WHEN id_sprinthub IS NOT NULL AND id_prime IS NOT NULL THEN 1 END) as em_ambos_sprint_prime,

  -- Apenas no Sprint (NÃO no Prime) - candidatos a adicionar no Prime
  COUNT(CASE WHEN id_sprinthub IS NOT NULL AND id_prime IS NULL THEN 1 END) as apenas_sprint,

  -- Apenas no Prime (NÃO no Sprint) - candidatos a adicionar no Sprint
  COUNT(CASE WHEN id_prime IS NOT NULL AND id_sprinthub IS NULL THEN 1 END) as apenas_prime

FROM api.clientes_mestre;

COMMENT ON VIEW api.stats_por_origem IS 'Estatísticas de distribuição por origem (Sprint, Prime, etc)';

-- ============================================================================
-- 3. CLIENTES APENAS NO SPRINT (para adicionar no Prime)
-- ============================================================================

CREATE OR REPLACE VIEW api.clientes_apenas_sprint AS
SELECT
  id,
  id_sprinthub,
  nome_completo,
  email,
  whatsapp,
  cpf,
  data_nascimento,
  endereco_rua,
  cidade,
  estado,
  qualidade_dados
FROM api.clientes_mestre
WHERE id_sprinthub IS NOT NULL
  AND id_prime IS NULL
ORDER BY qualidade_dados DESC, id;

COMMENT ON VIEW api.clientes_apenas_sprint IS 'Clientes que estão no SprintHub mas NÃO estão no Prime (candidatos a adicionar no Prime)';

-- ============================================================================
-- 4. CLIENTES APENAS NO PRIME (para adicionar no Sprint)
-- ============================================================================

CREATE OR REPLACE VIEW api.clientes_apenas_prime AS
SELECT
  id,
  id_prime,
  nome_completo,
  nome_cliente_prime,
  email,
  whatsapp,
  cpf,
  data_nascimento,
  endereco_rua,
  cidade,
  estado,
  qualidade_dados
FROM api.clientes_mestre
WHERE id_prime IS NOT NULL
  AND id_sprinthub IS NULL
ORDER BY qualidade_dados DESC, id;

COMMENT ON VIEW api.clientes_apenas_prime IS 'Clientes que estão no Prime mas NÃO estão no SprintHub (candidatos a adicionar no Sprint)';

-- ============================================================================
-- 5. DASHBOARD PRINCIPAL - VISÃO GERAL
-- ============================================================================

CREATE OR REPLACE VIEW api.dashboard_principal AS
SELECT
  'TOTAL DE CLIENTES' as metrica,
  COUNT(*)::TEXT as valor,
  '100%' as percentual
FROM api.clientes_mestre

UNION ALL

SELECT
  'Com Email',
  COUNT(CASE WHEN email IS NOT NULL AND email != '' THEN 1 END)::TEXT,
  ROUND(COUNT(CASE WHEN email IS NOT NULL AND email != '' THEN 1 END)::NUMERIC / COUNT(*) * 100, 1)::TEXT || '%'
FROM api.clientes_mestre

UNION ALL

SELECT
  'Com WhatsApp',
  COUNT(CASE WHEN whatsapp IS NOT NULL AND whatsapp != '' THEN 1 END)::TEXT,
  ROUND(COUNT(CASE WHEN whatsapp IS NOT NULL AND whatsapp != '' THEN 1 END)::NUMERIC / COUNT(*) * 100, 1)::TEXT || '%'
FROM api.clientes_mestre

UNION ALL

SELECT
  'Com CPF',
  COUNT(CASE WHEN cpf IS NOT NULL AND cpf != '' THEN 1 END)::TEXT,
  ROUND(COUNT(CASE WHEN cpf IS NOT NULL AND cpf != '' THEN 1 END)::NUMERIC / COUNT(*) * 100, 1)::TEXT || '%'
FROM api.clientes_mestre

UNION ALL

SELECT
  'Com Data Nascimento',
  COUNT(CASE WHEN data_nascimento IS NOT NULL THEN 1 END)::TEXT,
  ROUND(COUNT(CASE WHEN data_nascimento IS NOT NULL THEN 1 END)::NUMERIC / COUNT(*) * 100, 1)::TEXT || '%'
FROM api.clientes_mestre

UNION ALL

SELECT
  'Com Endereço Completo',
  COUNT(CASE WHEN endereco_rua IS NOT NULL AND cidade IS NOT NULL AND estado IS NOT NULL THEN 1 END)::TEXT,
  ROUND(COUNT(CASE WHEN endereco_rua IS NOT NULL AND cidade IS NOT NULL AND estado IS NOT NULL THEN 1 END)::NUMERIC / COUNT(*) * 100, 1)::TEXT || '%'
FROM api.clientes_mestre

UNION ALL

SELECT
  'Dados 100% Completos',
  COUNT(CASE
    WHEN nome_completo IS NOT NULL AND nome_completo != ''
     AND email IS NOT NULL AND email != ''
     AND whatsapp IS NOT NULL AND whatsapp != ''
     AND cpf IS NOT NULL AND cpf != ''
     AND data_nascimento IS NOT NULL
     AND endereco_rua IS NOT NULL AND cidade IS NOT NULL AND estado IS NOT NULL
    THEN 1
  END)::TEXT,
  ROUND(COUNT(CASE
    WHEN nome_completo IS NOT NULL AND nome_completo != ''
     AND email IS NOT NULL AND email != ''
     AND whatsapp IS NOT NULL AND whatsapp != ''
     AND cpf IS NOT NULL AND cpf != ''
     AND data_nascimento IS NOT NULL
     AND endereco_rua IS NOT NULL AND cidade IS NOT NULL AND estado IS NOT NULL
    THEN 1
  END)::NUMERIC / COUNT(*) * 100, 1)::TEXT || '%'
FROM api.clientes_mestre

UNION ALL

SELECT
  '─────────────────',
  '─────────',
  '─────────'

UNION ALL

SELECT
  'No SprintHub',
  COUNT(CASE WHEN id_sprinthub IS NOT NULL THEN 1 END)::TEXT,
  ROUND(COUNT(CASE WHEN id_sprinthub IS NOT NULL THEN 1 END)::NUMERIC / (SELECT COUNT(*) FROM api.clientes_mestre) * 100, 1)::TEXT || '%'
FROM api.clientes_mestre

UNION ALL

SELECT
  'No Prime',
  COUNT(CASE WHEN id_prime IS NOT NULL THEN 1 END)::TEXT,
  ROUND(COUNT(CASE WHEN id_prime IS NOT NULL THEN 1 END)::NUMERIC / (SELECT COUNT(*) FROM api.clientes_mestre) * 100, 1)::TEXT || '%'
FROM api.clientes_mestre

UNION ALL

SELECT
  'Apenas Sprint (adicionar no Prime)',
  COUNT(CASE WHEN id_sprinthub IS NOT NULL AND id_prime IS NULL THEN 1 END)::TEXT,
  ROUND(COUNT(CASE WHEN id_sprinthub IS NOT NULL AND id_prime IS NULL THEN 1 END)::NUMERIC / (SELECT COUNT(*) FROM api.clientes_mestre) * 100, 1)::TEXT || '%'
FROM api.clientes_mestre

UNION ALL

SELECT
  'Apenas Prime (adicionar no Sprint)',
  COUNT(CASE WHEN id_prime IS NOT NULL AND id_sprinthub IS NULL THEN 1 END)::TEXT,
  ROUND(COUNT(CASE WHEN id_prime IS NOT NULL AND id_sprinthub IS NULL THEN 1 END)::NUMERIC / (SELECT COUNT(*) FROM api.clientes_mestre) * 100, 1)::TEXT || '%'
FROM api.clientes_mestre;

COMMENT ON VIEW api.dashboard_principal IS 'Dashboard principal com todas as estatísticas principais';

-- ============================================================================
-- 6. QUALIDADE DE DADOS POR ORIGEM
-- ============================================================================

CREATE OR REPLACE VIEW api.stats_qualidade_por_origem AS
SELECT
  origem,
  COUNT(*) as total_clientes,
  ROUND(AVG(qualidade_dados), 1) as qualidade_media,
  COUNT(CASE WHEN qualidade_dados >= 80 THEN 1 END) as alta_qualidade,
  COUNT(CASE WHEN qualidade_dados >= 60 AND qualidade_dados < 80 THEN 1 END) as media_qualidade,
  COUNT(CASE WHEN qualidade_dados < 60 THEN 1 END) as baixa_qualidade,
  COUNT(CASE WHEN email IS NOT NULL AND email != '' THEN 1 END) as com_email,
  COUNT(CASE WHEN whatsapp IS NOT NULL AND whatsapp != '' THEN 1 END) as com_whatsapp,
  COUNT(CASE WHEN cpf IS NOT NULL AND cpf != '' THEN 1 END) as com_cpf
FROM api.clientes_mestre, unnest(origem_marcas) as origem
GROUP BY origem
ORDER BY total_clientes DESC;

COMMENT ON VIEW api.stats_qualidade_por_origem IS 'Estatísticas de qualidade de dados por origem';

-- ============================================================================
-- GRANTS (Permissões)
-- ============================================================================

GRANT SELECT ON api.stats_completude_dados TO anon, authenticated, service_role;
GRANT SELECT ON api.stats_por_origem TO anon, authenticated, service_role;
GRANT SELECT ON api.clientes_apenas_sprint TO anon, authenticated, service_role;
GRANT SELECT ON api.clientes_apenas_prime TO anon, authenticated, service_role;
GRANT SELECT ON api.dashboard_principal TO anon, authenticated, service_role;
GRANT SELECT ON api.stats_qualidade_por_origem TO anon, authenticated, service_role;

-- ============================================================================
-- VERIFICAÇÃO
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Views de relatórios criadas com sucesso!';
  RAISE NOTICE '';
  RAISE NOTICE 'Views disponíveis:';
  RAISE NOTICE '  1. api.stats_completude_dados - Estatísticas de completude';
  RAISE NOTICE '  2. api.stats_por_origem - Distribuição por origem';
  RAISE NOTICE '  3. api.clientes_apenas_sprint - Para adicionar no Prime';
  RAISE NOTICE '  4. api.clientes_apenas_prime - Para adicionar no Sprint';
  RAISE NOTICE '  5. api.dashboard_principal - Dashboard geral';
  RAISE NOTICE '  6. api.stats_qualidade_por_origem - Qualidade por origem';
  RAISE NOTICE '';
  RAISE NOTICE 'Uso:';
  RAISE NOTICE '  SELECT * FROM api.dashboard_principal;';
  RAISE NOTICE '  SELECT * FROM api.stats_completude_dados;';
END $$;
