-- ============================================================================
-- VIEWS ADICIONAIS PARA RELATÓRIOS DETALHADOS
-- ============================================================================
-- Descrição: Views SQL para análises mais profundas da base consolidada
-- Data: 2025-10-27
-- ============================================================================

-- ============================================================================
-- 1. DASHBOARD ESPECÍFICO DO SPRINT HUB
-- ============================================================================

CREATE OR REPLACE VIEW api.dashboard_sprint AS
SELECT
  COUNT(*) as total_leads,

  -- Completude dos dados
  COUNT(CASE WHEN email IS NOT NULL AND email != '' THEN 1 END) as com_email,
  ROUND(COUNT(CASE WHEN email IS NOT NULL AND email != '' THEN 1 END)::NUMERIC / COUNT(*) * 100, 1) as perc_com_email,

  COUNT(CASE WHEN whatsapp IS NOT NULL AND whatsapp != '' THEN 1 END) as com_whatsapp,
  ROUND(COUNT(CASE WHEN whatsapp IS NOT NULL AND whatsapp != '' THEN 1 END)::NUMERIC / COUNT(*) * 100, 1) as perc_com_whatsapp,

  COUNT(CASE WHEN cpf IS NOT NULL AND cpf != '' THEN 1 END) as com_cpf,
  ROUND(COUNT(CASE WHEN cpf IS NOT NULL AND cpf != '' THEN 1 END)::NUMERIC / COUNT(*) * 100, 1) as perc_com_cpf,

  COUNT(CASE WHEN data_nascimento IS NOT NULL THEN 1 END) as com_data_nascimento,
  ROUND(COUNT(CASE WHEN data_nascimento IS NOT NULL THEN 1 END)::NUMERIC / COUNT(*) * 100, 1) as perc_com_data_nascimento,

  -- Qualidade média
  ROUND(AVG(qualidade_dados), 1) as qualidade_media,

  -- Distribuição de qualidade
  COUNT(CASE WHEN qualidade_dados >= 80 THEN 1 END) as qualidade_alta,
  COUNT(CASE WHEN qualidade_dados >= 60 AND qualidade_dados < 80 THEN 1 END) as com_qualidade_media,
  COUNT(CASE WHEN qualidade_dados < 60 THEN 1 END) as qualidade_baixa,

  -- Também estão no Prime
  COUNT(CASE WHEN id_prime IS NOT NULL THEN 1 END) as tambem_no_prime,
  COUNT(CASE WHEN id_prime IS NULL THEN 1 END) as somente_sprint

FROM api.clientes_mestre
WHERE id_sprinthub IS NOT NULL;

-- ============================================================================
-- 2. DASHBOARD ESPECÍFICO DO PRIME
-- ============================================================================

CREATE OR REPLACE VIEW api.dashboard_prime AS
SELECT
  COUNT(*) as total_clientes,

  -- Completude dos dados
  COUNT(CASE WHEN email IS NOT NULL AND email != '' THEN 1 END) as com_email,
  ROUND(COUNT(CASE WHEN email IS NOT NULL AND email != '' THEN 1 END)::NUMERIC / COUNT(*) * 100, 1) as perc_com_email,

  COUNT(CASE WHEN whatsapp IS NOT NULL AND whatsapp != '' THEN 1 END) as com_whatsapp,
  ROUND(COUNT(CASE WHEN whatsapp IS NOT NULL AND whatsapp != '' THEN 1 END)::NUMERIC / COUNT(*) * 100, 1) as perc_com_whatsapp,

  COUNT(CASE WHEN cpf IS NOT NULL AND cpf != '' THEN 1 END) as com_cpf,
  ROUND(COUNT(CASE WHEN cpf IS NOT NULL AND cpf != '' THEN 1 END)::NUMERIC / COUNT(*) * 100, 1) as perc_com_cpf,

  COUNT(CASE WHEN data_nascimento IS NOT NULL THEN 1 END) as com_data_nascimento,
  ROUND(COUNT(CASE WHEN data_nascimento IS NOT NULL THEN 1 END)::NUMERIC / COUNT(*) * 100, 1) as perc_com_data_nascimento,

  -- Qualidade média
  ROUND(AVG(qualidade_dados), 1) as qualidade_media,

  -- Distribuição de qualidade
  COUNT(CASE WHEN qualidade_dados >= 80 THEN 1 END) as qualidade_alta,
  COUNT(CASE WHEN qualidade_dados >= 60 AND qualidade_dados < 80 THEN 1 END) as com_qualidade_media,
  COUNT(CASE WHEN qualidade_dados < 60 THEN 1 END) as qualidade_baixa,

  -- Também estão no Sprint
  COUNT(CASE WHEN id_sprinthub IS NOT NULL THEN 1 END) as tambem_no_sprint,
  COUNT(CASE WHEN id_sprinthub IS NULL THEN 1 END) as somente_prime

FROM api.clientes_mestre
WHERE id_prime IS NOT NULL;

-- ============================================================================
-- 3. RELATÓRIO DE DUPLICADOS/CONSOLIDAÇÃO
-- ============================================================================

CREATE OR REPLACE VIEW api.relatorio_duplicados AS
SELECT
  id,
  nome_completo,
  email,
  whatsapp,
  cpf,
  origem_marcas,
  array_length(origem_marcas, 1) as num_origens,
  qualidade_dados,
  CASE
    WHEN id_sprinthub IS NOT NULL THEN '✓' ELSE '✗'
  END as no_sprint,
  CASE
    WHEN id_prime IS NOT NULL THEN '✓' ELSE '✗'
  END as no_prime,
  CASE
    WHEN id_greatpage IS NOT NULL THEN '✓' ELSE '✗'
  END as no_greatpage,
  CASE
    WHEN id_blacklabs IS NOT NULL THEN '✓' ELSE '✗'
  END as no_blacklabs
FROM api.clientes_mestre
WHERE array_length(origem_marcas, 1) > 1
ORDER BY array_length(origem_marcas, 1) DESC, qualidade_dados DESC;

-- ============================================================================
-- 4. RELATÓRIO DE QUALIDADE DE DADOS
-- ============================================================================

CREATE OR REPLACE VIEW api.relatorio_qualidade AS
SELECT
  CASE
    WHEN qualidade_dados >= 80 THEN 'Alta (80-100)'
    WHEN qualidade_dados >= 60 THEN 'Média (60-79)'
    ELSE 'Baixa (0-59)'
  END as faixa_qualidade,
  COUNT(*) as total_clientes,
  ROUND(COUNT(*)::NUMERIC / (SELECT COUNT(*) FROM api.clientes_mestre) * 100, 1) as percentual,
  AVG(qualidade_dados)::INTEGER as qualidade_media_faixa
FROM api.clientes_mestre
GROUP BY faixa_qualidade
ORDER BY qualidade_media_faixa DESC;

-- Lista detalhada de baixa qualidade
CREATE OR REPLACE VIEW api.clientes_baixa_qualidade AS
SELECT
  id,
  nome_completo,
  email,
  whatsapp,
  cpf,
  origem_marcas,
  qualidade_dados,
  -- Indicar o que falta
  CASE WHEN email IS NULL OR email = '' THEN 'Sem Email' ELSE '' END ||
  CASE WHEN whatsapp IS NULL OR whatsapp = '' THEN ' Sem WhatsApp' ELSE '' END ||
  CASE WHEN cpf IS NULL OR cpf = '' THEN ' Sem CPF' ELSE '' END ||
  CASE WHEN data_nascimento IS NULL THEN ' Sem Data Nascimento' ELSE '' END as dados_faltantes
FROM api.clientes_mestre
WHERE qualidade_dados < 60
ORDER BY qualidade_dados ASC;

-- ============================================================================
-- 5. RELATÓRIO DE ANIVERSARIANTES
-- ============================================================================

-- Aniversariantes do mês atual
CREATE OR REPLACE VIEW api.aniversariantes_mes AS
SELECT
  id,
  nome_completo,
  email,
  whatsapp,
  data_nascimento,
  EXTRACT(DAY FROM data_nascimento) as dia_aniversario,
  origem_marcas,
  id_sprinthub,
  id_prime
FROM api.clientes_mestre
WHERE data_nascimento IS NOT NULL
  AND EXTRACT(MONTH FROM data_nascimento) = EXTRACT(MONTH FROM CURRENT_DATE)
ORDER BY EXTRACT(DAY FROM data_nascimento);

-- Aniversariantes dos próximos 30 dias
CREATE OR REPLACE VIEW api.aniversariantes_proximos_30_dias AS
SELECT
  id,
  nome_completo,
  email,
  whatsapp,
  data_nascimento,
  -- Calcular próximo aniversário
  make_date(
    EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER,
    EXTRACT(MONTH FROM data_nascimento)::INTEGER,
    EXTRACT(DAY FROM data_nascimento)::INTEGER
  ) +
  CASE
    WHEN make_date(
      EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER,
      EXTRACT(MONTH FROM data_nascimento)::INTEGER,
      EXTRACT(DAY FROM data_nascimento)::INTEGER
    ) < CURRENT_DATE
    THEN INTERVAL '1 year'
    ELSE INTERVAL '0 days'
  END as proximo_aniversario,
  origem_marcas,
  id_sprinthub,
  id_prime
FROM api.clientes_mestre
WHERE data_nascimento IS NOT NULL
  AND (
    make_date(
      EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER,
      EXTRACT(MONTH FROM data_nascimento)::INTEGER,
      EXTRACT(DAY FROM data_nascimento)::INTEGER
    ) +
    CASE
      WHEN make_date(
        EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER,
        EXTRACT(MONTH FROM data_nascimento)::INTEGER,
        EXTRACT(DAY FROM data_nascimento)::INTEGER
      ) < CURRENT_DATE
      THEN INTERVAL '1 year'
      ELSE INTERVAL '0 days'
    END
  ) BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days'
ORDER BY proximo_aniversario;

-- ============================================================================
-- 6. RELATÓRIO DE CAMPOS FALTANTES
-- ============================================================================

CREATE OR REPLACE VIEW api.clientes_sem_cpf AS
SELECT
  id,
  nome_completo,
  email,
  whatsapp,
  origem_marcas,
  qualidade_dados,
  id_sprinthub,
  id_prime
FROM api.clientes_mestre
WHERE cpf IS NULL OR cpf = ''
ORDER BY qualidade_dados DESC;

CREATE OR REPLACE VIEW api.clientes_sem_email AS
SELECT
  id,
  nome_completo,
  whatsapp,
  cpf,
  origem_marcas,
  qualidade_dados,
  id_sprinthub,
  id_prime
FROM api.clientes_mestre
WHERE (email IS NULL OR email = '')
  AND whatsapp IS NOT NULL AND whatsapp != ''
ORDER BY qualidade_dados DESC;

CREATE OR REPLACE VIEW api.clientes_sem_contato AS
SELECT
  id,
  nome_completo,
  cpf,
  origem_marcas,
  qualidade_dados,
  id_sprinthub,
  id_prime
FROM api.clientes_mestre
WHERE (email IS NULL OR email = '')
  AND (whatsapp IS NULL OR whatsapp = '')
  AND (telefone IS NULL OR telefone = '')
ORDER BY qualidade_dados DESC;

-- ============================================================================
-- 7. RELATÓRIO GEOGRÁFICO
-- ============================================================================

CREATE OR REPLACE VIEW api.distribuicao_geografica AS
SELECT
  COALESCE(estado, 'Não informado') as estado,
  COALESCE(cidade, 'Não informado') as cidade,
  COUNT(*) as total_clientes,
  ROUND(COUNT(*)::NUMERIC / (SELECT COUNT(*) FROM api.clientes_mestre) * 100, 2) as percentual,
  ROUND(AVG(qualidade_dados), 1) as qualidade_media
FROM api.clientes_mestre
GROUP BY estado, cidade
ORDER BY total_clientes DESC;

CREATE OR REPLACE VIEW api.top_cidades AS
SELECT
  COALESCE(cidade, 'Não informado') as cidade,
  COALESCE(estado, '') as estado,
  COUNT(*) as total_clientes,
  ROUND(COUNT(*)::NUMERIC / (SELECT COUNT(*) FROM api.clientes_mestre WHERE cidade IS NOT NULL) * 100, 2) as percentual
FROM api.clientes_mestre
WHERE cidade IS NOT NULL AND cidade != ''
GROUP BY cidade, estado
ORDER BY total_clientes DESC
LIMIT 20;

-- ============================================================================
-- 8. RELATÓRIO DE CLIENTES COMPLETOS E ALCANÇÁVEIS
-- ============================================================================

CREATE OR REPLACE VIEW api.clientes_completos_alcancaveis AS
SELECT
  id,
  nome_completo,
  email,
  whatsapp,
  telefone,
  cpf,
  data_nascimento,
  endereco_rua,
  cidade,
  estado,
  origem_marcas,
  qualidade_dados,
  id_sprinthub,
  id_prime
FROM api.clientes_mestre
WHERE email IS NOT NULL AND email != ''
  AND whatsapp IS NOT NULL AND whatsapp != ''
  AND telefone IS NOT NULL AND telefone != ''
ORDER BY qualidade_dados DESC;

-- Clientes com todos os dados essenciais
CREATE OR REPLACE VIEW api.clientes_dados_essenciais AS
SELECT
  id,
  nome_completo,
  email,
  whatsapp,
  cpf,
  data_nascimento,
  origem_marcas,
  qualidade_dados,
  id_sprinthub,
  id_prime
FROM api.clientes_mestre
WHERE nome_completo IS NOT NULL AND nome_completo != ''
  AND (email IS NOT NULL AND email != '' OR whatsapp IS NOT NULL AND whatsapp != '')
  AND cpf IS NOT NULL AND cpf != ''
ORDER BY qualidade_dados DESC;

-- ============================================================================
-- 9. RELATÓRIO DE ATUALIZAÇÕES RECENTES
-- ============================================================================

CREATE OR REPLACE VIEW api.atualizacoes_recentes_7dias AS
SELECT
  id,
  nome_completo,
  email,
  whatsapp,
  origem_marcas,
  qualidade_dados,
  data_ultima_atualizacao,
  id_sprinthub,
  id_prime
FROM api.clientes_mestre
WHERE data_ultima_atualizacao >= CURRENT_DATE - INTERVAL '7 days'
ORDER BY data_ultima_atualizacao DESC;

CREATE OR REPLACE VIEW api.atualizacoes_recentes_30dias AS
SELECT
  id,
  nome_completo,
  email,
  whatsapp,
  origem_marcas,
  qualidade_dados,
  data_ultima_atualizacao,
  id_sprinthub,
  id_prime
FROM api.clientes_mestre
WHERE data_ultima_atualizacao >= CURRENT_DATE - INTERVAL '30 days'
ORDER BY data_ultima_atualizacao DESC;

-- ============================================================================
-- 10. RELATÓRIO EXECUTIVO MENSAL
-- ============================================================================

CREATE OR REPLACE VIEW api.relatorio_executivo AS
SELECT
  'Total de Clientes' as metrica,
  COUNT(*)::TEXT as valor,
  '100%' as percentual
FROM api.clientes_mestre

UNION ALL

SELECT
  'Clientes Únicos (Deduplicados)',
  COUNT(*)::TEXT,
  '100%'
FROM api.clientes_mestre

UNION ALL

SELECT
  'Registros Totais nas Origens',
  (
    (SELECT COUNT(*) FROM api.leads) +
    (SELECT COUNT(*) FROM api.prime_clientes) +
    (SELECT COUNT(*) FROM api.greatpage_leads) +
    (SELECT COUNT(*) FROM api.blacklabs)
  )::TEXT,
  ROUND(
    (SELECT COUNT(*) FROM api.clientes_mestre)::NUMERIC /
    (
      (SELECT COUNT(*) FROM api.leads) +
      (SELECT COUNT(*) FROM api.prime_clientes) +
      (SELECT COUNT(*) FROM api.greatpage_leads) +
      (SELECT COUNT(*) FROM api.blacklabs)
    ) * 100,
    1
  )::TEXT || '%'

UNION ALL

SELECT
  'Taxa de Deduplicação',
  (
    (
      (SELECT COUNT(*) FROM api.leads) +
      (SELECT COUNT(*) FROM api.prime_clientes) +
      (SELECT COUNT(*) FROM api.greatpage_leads) +
      (SELECT COUNT(*) FROM api.blacklabs)
    ) -
    (SELECT COUNT(*) FROM api.clientes_mestre)
  )::TEXT || ' registros removidos',
  ROUND(
    (
      (
        (SELECT COUNT(*) FROM api.leads) +
        (SELECT COUNT(*) FROM api.prime_clientes) +
        (SELECT COUNT(*) FROM api.greatpage_leads) +
        (SELECT COUNT(*) FROM api.blacklabs)
      ) -
      (SELECT COUNT(*) FROM api.clientes_mestre)
    )::NUMERIC /
    (
      (SELECT COUNT(*) FROM api.leads) +
      (SELECT COUNT(*) FROM api.prime_clientes) +
      (SELECT COUNT(*) FROM api.greatpage_leads) +
      (SELECT COUNT(*) FROM api.blacklabs)
    ) * 100,
    1
  )::TEXT || '%'

UNION ALL

SELECT
  'Qualidade Média dos Dados',
  ROUND(AVG(qualidade_dados), 1)::TEXT || '/100',
  '-'
FROM api.clientes_mestre

UNION ALL

SELECT
  'Clientes com Dados Completos (100%)',
  COUNT(CASE WHEN qualidade_dados = 100 THEN 1 END)::TEXT,
  ROUND(COUNT(CASE WHEN qualidade_dados = 100 THEN 1 END)::NUMERIC / COUNT(*) * 100, 1)::TEXT || '%'
FROM api.clientes_mestre

UNION ALL

SELECT
  'Clientes em Múltiplas Origens',
  COUNT(*)::TEXT,
  ROUND(COUNT(*)::NUMERIC / (SELECT COUNT(*) FROM api.clientes_mestre) * 100, 1)::TEXT || '%'
FROM api.clientes_mestre
WHERE array_length(origem_marcas, 1) > 1;

-- ============================================================================
-- PERMISSÕES
-- ============================================================================

-- Garantir que as views são acessíveis
GRANT SELECT ON api.dashboard_sprint TO anon, authenticated, service_role;
GRANT SELECT ON api.dashboard_prime TO anon, authenticated, service_role;
GRANT SELECT ON api.relatorio_duplicados TO anon, authenticated, service_role;
GRANT SELECT ON api.relatorio_qualidade TO anon, authenticated, service_role;
GRANT SELECT ON api.clientes_baixa_qualidade TO anon, authenticated, service_role;
GRANT SELECT ON api.aniversariantes_mes TO anon, authenticated, service_role;
GRANT SELECT ON api.aniversariantes_proximos_30_dias TO anon, authenticated, service_role;
GRANT SELECT ON api.clientes_sem_cpf TO anon, authenticated, service_role;
GRANT SELECT ON api.clientes_sem_email TO anon, authenticated, service_role;
GRANT SELECT ON api.clientes_sem_contato TO anon, authenticated, service_role;
GRANT SELECT ON api.distribuicao_geografica TO anon, authenticated, service_role;
GRANT SELECT ON api.top_cidades TO anon, authenticated, service_role;
GRANT SELECT ON api.clientes_completos_alcancaveis TO anon, authenticated, service_role;
GRANT SELECT ON api.clientes_dados_essenciais TO anon, authenticated, service_role;
GRANT SELECT ON api.atualizacoes_recentes_7dias TO anon, authenticated, service_role;
GRANT SELECT ON api.atualizacoes_recentes_30dias TO anon, authenticated, service_role;
GRANT SELECT ON api.relatorio_executivo TO anon, authenticated, service_role;

-- ============================================================================
-- FIM DO SCRIPT
-- ============================================================================
