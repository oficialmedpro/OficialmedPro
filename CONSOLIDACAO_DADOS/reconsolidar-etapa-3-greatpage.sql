-- ============================================================================
-- RECONSOLIDAÇÃO INCREMENTAL - ETAPA 3: GREATPAGE LEADS
-- ============================================================================
-- Execute APÓS a Etapa 2
-- ============================================================================

DO $$
DECLARE
  v_batch_size INTEGER := 500;
  v_processados INTEGER := 0;
  v_offset INTEGER := 0;
  v_affected INTEGER;
  v_total INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_total FROM api.greatpage_leads;
  
  RAISE NOTICE '🟡 RECONSOLIDANDO GREATPAGE LEADS...';
  RAISE NOTICE '   Total: % registros', v_total;
  RAISE NOTICE '';

  LOOP
    UPDATE api.greatpage_leads
    SET updated_at = NOW()  -- Força atualização real
    WHERE id IN (
      SELECT id FROM api.greatpage_leads
      ORDER BY id
      LIMIT v_batch_size OFFSET v_offset
    );
    
    GET DIAGNOSTICS v_affected = ROW_COUNT;
    EXIT WHEN v_affected = 0;
    
    v_processados := v_processados + v_affected;
    v_offset := v_offset + v_batch_size;
    
    RAISE NOTICE '   📦 Processados: % / % (%.1f%%)', 
      v_processados, v_total, 
      (v_processados::NUMERIC / NULLIF(v_total, 0) * 100);
    
    COMMIT;
  END LOOP;

  RAISE NOTICE '   ✅ CONCLUÍDO: % registros', v_processados;
END $$;


















