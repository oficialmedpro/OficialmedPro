-- ============================================================================
-- RECONSOLIDAÇÃO INCREMENTAL - ETAPA 5: ESTATÍSTICAS FINAIS
-- ============================================================================
-- Execute APÓS todas as etapas anteriores para ver resultado final
-- ============================================================================

DO $$
DECLARE
  v_total INTEGER;
  v_com_email INTEGER;
  v_com_whatsapp INTEGER;
  v_com_cpf INTEGER;
BEGIN
  RAISE NOTICE '==========================================================';
  RAISE NOTICE '✅ VERIFICANDO RESULTADO DA RECONSOLIDAÇÃO';
  RAISE NOTICE '==========================================================';
  RAISE NOTICE '';

  -- Contar totais
  SELECT COUNT(*) INTO v_total FROM api.clientes_mestre;
  SELECT COUNT(*) INTO v_com_email FROM api.clientes_mestre WHERE email IS NOT NULL;
  SELECT COUNT(*) INTO v_com_whatsapp FROM api.clientes_mestre WHERE whatsapp IS NOT NULL;
  SELECT COUNT(*) INTO v_com_cpf FROM api.clientes_mestre WHERE cpf IS NOT NULL;

  RAISE NOTICE '📊 ESTATÍSTICAS DA CLIENTES_MESTRE:';
  RAISE NOTICE '   - Total de clientes: %', v_total;
  RAISE NOTICE '';
  RAISE NOTICE '   - Com email: % (%.1f%%)',
    v_com_email,
    (v_com_email::NUMERIC / NULLIF(v_total, 0) * 100);
  RAISE NOTICE '';
  RAISE NOTICE '   - Com whatsapp: % (%.1f%%)',
    v_com_whatsapp,
    (v_com_whatsapp::NUMERIC / NULLIF(v_total, 0) * 100);
  RAISE NOTICE '';
  RAISE NOTICE '   - Com CPF: % (%.1f%%)',
    v_com_cpf,
    (v_com_cpf::NUMERIC / NULLIF(v_total, 0) * 100);
  RAISE NOTICE '';

  -- Estatísticas por fonte
  RAISE NOTICE '📊 CLIENTES POR FONTE:';
  RAISE NOTICE '   - Prime: %',
    (SELECT COUNT(*) FROM api.clientes_mestre WHERE fonte = 'prime');
  RAISE NOTICE '   - SprintHub: %',
    (SELECT COUNT(*) FROM api.clientes_mestre WHERE fonte = 'sprinthub');
  RAISE NOTICE '   - GreatPage: %',
    (SELECT COUNT(*) FROM api.clientes_mestre WHERE fonte = 'greatpage');
  RAISE NOTICE '   - BlackLabs: %',
    (SELECT COUNT(*) FROM api.clientes_mestre WHERE fonte = 'blacklabs');
  RAISE NOTICE '';

  RAISE NOTICE '==========================================================';
  RAISE NOTICE '🎯 RECONSOLIDAÇÃO COMPLETA!';
  RAISE NOTICE '==========================================================';

END $$;















