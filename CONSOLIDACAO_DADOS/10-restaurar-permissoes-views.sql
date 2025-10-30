-- ============================================================================
-- RESTAURAR PERMISSÕES DAS VIEWS
-- ============================================================================
-- Após DROP/CREATE das views, as permissões foram perdidas
-- Este script restaura as permissões para anon e authenticated
-- ============================================================================

-- Permissões para as views recriadas (OBRIGATÓRIAS)
GRANT SELECT ON api.vw_inativos_prime TO anon, authenticated;
GRANT SELECT ON api.vw_inativos_fora_prime TO anon, authenticated;

-- Permissões para outras views (SE EXISTIREM, ignora erro se não existir)
DO $$
BEGIN
  -- Ativação
  BEGIN
    GRANT SELECT ON api.vw_inativos_com_orcamento TO anon, authenticated;
  EXCEPTION WHEN undefined_table THEN
    RAISE NOTICE 'View vw_inativos_com_orcamento não existe, pulando...';
  END;

  BEGIN
    GRANT SELECT ON api.vw_inativos_sem_orcamento TO anon, authenticated;
  EXCEPTION WHEN undefined_table THEN
    RAISE NOTICE 'View vw_inativos_sem_orcamento não existe, pulando...';
  END;

  -- Reativação
  BEGIN
    GRANT SELECT ON api.vw_reativaveis_1x TO anon, authenticated;
  EXCEPTION WHEN undefined_table THEN
    RAISE NOTICE 'View vw_reativaveis_1x não existe, pulando...';
  END;

  BEGIN
    GRANT SELECT ON api.vw_reativaveis_2x TO anon, authenticated;
  EXCEPTION WHEN undefined_table THEN
    RAISE NOTICE 'View vw_reativaveis_2x não existe, pulando...';
  END;

  BEGIN
    GRANT SELECT ON api.vw_reativaveis_3x TO anon, authenticated;
  EXCEPTION WHEN undefined_table THEN
    RAISE NOTICE 'View vw_reativaveis_3x não existe, pulando...';
  END;

  BEGIN
    GRANT SELECT ON api.vw_reativaveis_3x_plus TO anon, authenticated;
  EXCEPTION WHEN undefined_table THEN
    RAISE NOTICE 'View vw_reativaveis_3x_plus não existe, pulando...';
  END;

  -- Monitoramento
  BEGIN
    GRANT SELECT ON api.vw_monitoramento_1_29_dias TO anon, authenticated;
  EXCEPTION WHEN undefined_table THEN
    RAISE NOTICE 'View vw_monitoramento_1_29_dias não existe, pulando...';
  END;

  BEGIN
    GRANT SELECT ON api.vw_monitoramento_30_59_dias TO anon, authenticated;
  EXCEPTION WHEN undefined_table THEN
    RAISE NOTICE 'View vw_monitoramento_30_59_dias não existe, pulando...';
  END;

  BEGIN
    GRANT SELECT ON api.vw_monitoramento_60_90_dias TO anon, authenticated;
  EXCEPTION WHEN undefined_table THEN
    RAISE NOTICE 'View vw_monitoramento_60_90_dias não existe, pulando...';
  END;

  -- Auditoria
  BEGIN
    GRANT SELECT ON api.vw_campos_protegidos_auditoria TO anon, authenticated;
  EXCEPTION WHEN undefined_table THEN
    RAISE NOTICE 'View vw_campos_protegidos_auditoria não existe, pulando...';
  END;
END $$;

-- Mensagem
DO $$
BEGIN
  RAISE NOTICE '✅ Permissões restauradas nas views!';
  RAISE NOTICE '🔓 Acesso liberado para anon e authenticated';
END $$;
