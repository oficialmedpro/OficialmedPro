-- ============================================================================
-- RECONSOLIDAÇÃO DE TODOS OS DADOS EXISTENTES
-- ============================================================================
-- Descrição: Reprocessa TODOS os registros para aplicar a nova lógica de prioridade
-- Execução: Rodar UMA VEZ após atualizar a função de consolidação
-- ============================================================================

DO $$
DECLARE
  v_total_prime INTEGER;
  v_total_sprint INTEGER;
  v_total_greatpage INTEGER;
  v_total_blacklabs INTEGER;
  v_processados INTEGER := 0;
BEGIN
  RAISE NOTICE '🔄 INICIANDO RECONSOLIDAÇÃO DE TODOS OS DADOS...';
  RAISE NOTICE '================================================';
  RAISE NOTICE '';

  -- Contar registros
  SELECT COUNT(*) INTO v_total_prime FROM api.prime_clientes WHERE ativo = true;
  SELECT COUNT(*) INTO v_total_sprint FROM api.leads;
  SELECT COUNT(*) INTO v_total_greatpage FROM api.greatpage_leads;
  SELECT COUNT(*) INTO v_total_blacklabs FROM api.blacklabs;

  RAISE NOTICE '📊 TOTAL DE REGISTROS:';
  RAISE NOTICE '   - Prime: % clientes', v_total_prime;
  RAISE NOTICE '   - SprintHub: % leads', v_total_sprint;
  RAISE NOTICE '   - GreatPage: % leads', v_total_greatpage;
  RAISE NOTICE '   - BlackLabs: % registros', v_total_blacklabs;
  RAISE NOTICE '';

  -- ========================================
  -- ETAPA 1: RECONSOLIDAR PRIME (PRIORITÁRIO)
  -- ========================================
  RAISE NOTICE '🔵 ETAPA 1/4: Reconsolidando PRIME CLIENTES...';

  -- Simular UPDATE para disparar os triggers
  UPDATE api.prime_clientes
  SET updated_at = updated_at
  WHERE ativo = true;

  GET DIAGNOSTICS v_processados = ROW_COUNT;
  RAISE NOTICE '   ✅ % registros do Prime reconsolidados', v_processados;
  RAISE NOTICE '';

  -- ========================================
  -- ETAPA 2: RECONSOLIDAR SPRINTHUB (PRIORITÁRIO)
  -- ========================================
  RAISE NOTICE '🟢 ETAPA 2/4: Reconsolidando SPRINTHUB LEADS...';

  UPDATE api.leads
  SET updated_date = updated_date;

  GET DIAGNOSTICS v_processados = ROW_COUNT;
  RAISE NOTICE '   ✅ % registros do SprintHub reconsolidados', v_processados;
  RAISE NOTICE '';

  -- ========================================
  -- ETAPA 3: RECONSOLIDAR GREATPAGE (ENRIQUECIMENTO)
  -- ========================================
  RAISE NOTICE '🟡 ETAPA 3/4: Reconsolidando GREATPAGE LEADS...';

  UPDATE api.greatpage_leads
  SET updated_at = updated_at;

  GET DIAGNOSTICS v_processados = ROW_COUNT;
  RAISE NOTICE '   ✅ % registros do GreatPage reconsolidados', v_processados;
  RAISE NOTICE '';

  -- ========================================
  -- ETAPA 4: RECONSOLIDAR BLACKLABS (ENRIQUECIMENTO)
  -- ========================================
  RAISE NOTICE '🟠 ETAPA 4/4: Reconsolidando BLACKLABS...';

  UPDATE api.blacklabs
  SET created_at = created_at;

  GET DIAGNOSTICS v_processados = ROW_COUNT;
  RAISE NOTICE '   ✅ % registros do BlackLabs reconsolidados', v_processados;
  RAISE NOTICE '';

  -- ========================================
  -- ESTATÍSTICAS FINAIS
  -- ========================================
  RAISE NOTICE '================================================';
  RAISE NOTICE '✅ RECONSOLIDAÇÃO CONCLUÍDA COM SUCESSO!';
  RAISE NOTICE '';
  RAISE NOTICE '📊 ESTATÍSTICAS FINAIS DA CLIENTES_MESTRE:';
  RAISE NOTICE '   - Total: % clientes', (SELECT COUNT(*) FROM api.clientes_mestre);
  RAISE NOTICE '   - Com email: % (%.1f%%)',
    (SELECT COUNT(*) FROM api.clientes_mestre WHERE email IS NOT NULL),
    (SELECT COUNT(*) FROM api.clientes_mestre WHERE email IS NOT NULL)::NUMERIC /
    (SELECT COUNT(*) FROM api.clientes_mestre) * 100;
  RAISE NOTICE '   - Com whatsapp: % (%.1f%%)',
    (SELECT COUNT(*) FROM api.clientes_mestre WHERE whatsapp IS NOT NULL),
    (SELECT COUNT(*) FROM api.clientes_mestre WHERE whatsapp IS NOT NULL)::NUMERIC /
    (SELECT COUNT(*) FROM api.clientes_mestre) * 100;
  RAISE NOTICE '   - Com CPF: % (%.1f%%)',
    (SELECT COUNT(*) FROM api.clientes_mestre WHERE cpf IS NOT NULL),
    (SELECT COUNT(*) FROM api.clientes_mestre WHERE cpf IS NOT NULL)::NUMERIC /
    (SELECT COUNT(*) FROM api.clientes_mestre) * 100;
  RAISE NOTICE '';
  RAISE NOTICE '🎯 PRÓXIMO PASSO: Execute o script de TESTE para validar';

EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE '';
    RAISE NOTICE '❌ ERRO DURANTE RECONSOLIDAÇÃO:';
    RAISE NOTICE '   %', SQLERRM;
    RAISE;
END $$;
