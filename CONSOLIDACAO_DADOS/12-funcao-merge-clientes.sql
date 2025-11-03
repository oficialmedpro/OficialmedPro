-- ============================================================================
-- FUNÇÃO DE MESCLAGEM DE CLIENTES DUPLICADOS
-- ============================================================================
-- Descrição: Mescla múltiplos registros de clientes duplicados em um registro mestre
-- Preserva: IDs de origem (Prime, SprintHub, etc.), histórico, e dados mais completos
-- Auditoria: Registra todas as mesclagens em uma tabela de log
-- ============================================================================

-- ============================================================================
-- 1. CRIAR TABELA DE AUDITORIA DE MESCLAGENS
-- ============================================================================

CREATE TABLE IF NOT EXISTS api.merge_clientes_log (
  id BIGSERIAL PRIMARY KEY,
  master_id BIGINT NOT NULL,
  merged_ids BIGINT[] NOT NULL,
  executed_by TEXT,
  executed_at TIMESTAMP DEFAULT NOW(),
  dados_antes JSONB, -- Snapshot dos dados antes da mesclagem
  dados_depois JSONB -- Snapshot dos dados após a mesclagem
);

CREATE INDEX idx_merge_log_master ON api.merge_clientes_log(master_id);
CREATE INDEX idx_merge_log_executed_at ON api.merge_clientes_log(executed_at DESC);

GRANT SELECT, INSERT ON api.merge_clientes_log TO service_role, anon, authenticated;
GRANT USAGE ON SEQUENCE api.merge_clientes_log_id_seq TO service_role, anon, authenticated;

COMMENT ON TABLE api.merge_clientes_log IS 'Auditoria de mesclagens de clientes duplicados';

-- ============================================================================
-- 2. FUNÇÃO DE MESCLAGEM
-- ============================================================================

CREATE OR REPLACE FUNCTION api.merge_cliente(
  master_id BIGINT,
  loser_ids BIGINT[],
  fields_json JSONB DEFAULT '{}'::jsonb,
  executed_by TEXT DEFAULT 'sistema'
)
RETURNS JSONB AS $$
DECLARE
  v_master RECORD;
  v_loser RECORD;
  v_updated_master RECORD;
  v_origem_marcas TEXT[];
  v_ids_sprinthub BIGINT[];
  v_ids_prime BIGINT[];
  v_ids_greatpage BIGINT[];
  v_ids_blacklabs BIGINT[];
  v_dados_antes JSONB;
  v_dados_depois JSONB;
  v_affected_count INT := 0;
BEGIN
  -- Validar parâmetros
  IF master_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'master_id não pode ser NULL'
    );
  END IF;

  IF loser_ids IS NULL OR array_length(loser_ids, 1) IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'loser_ids não pode ser vazio'
    );
  END IF;

  -- Verificar se master existe
  SELECT * INTO v_master FROM api.clientes_mestre WHERE id = master_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Cliente master não encontrado'
    );
  END IF;

  -- Guardar snapshot dos dados antes
  v_dados_antes := to_jsonb(v_master);

  -- Inicializar arrays com os valores do master
  v_origem_marcas := COALESCE(v_master.origem_marcas, ARRAY[]::TEXT[]);
  v_ids_sprinthub := ARRAY[]::BIGINT[];
  v_ids_prime := ARRAY[]::BIGINT[];
  v_ids_greatpage := ARRAY[]::BIGINT[];
  v_ids_blacklabs := ARRAY[]::BIGINT[];

  -- Adicionar IDs do master
  IF v_master.id_sprinthub IS NOT NULL THEN
    v_ids_sprinthub := array_append(v_ids_sprinthub, v_master.id_sprinthub);
  END IF;
  IF v_master.id_prime IS NOT NULL THEN
    v_ids_prime := array_append(v_ids_prime, v_master.id_prime);
  END IF;
  IF v_master.id_greatpage IS NOT NULL THEN
    v_ids_greatpage := array_append(v_ids_greatpage, v_master.id_greatpage);
  END IF;
  IF v_master.id_blacklabs IS NOT NULL THEN
    v_ids_blacklabs := array_append(v_ids_blacklabs, v_master.id_blacklabs);
  END IF;

  -- Processar cada cliente "perdedor"
  FOR v_loser IN
    SELECT * FROM api.clientes_mestre
    WHERE id = ANY(loser_ids) AND id != master_id
  LOOP
    v_affected_count := v_affected_count + 1;

    -- Mesclar origem_marcas (sem duplicatas)
    IF v_loser.origem_marcas IS NOT NULL THEN
      v_origem_marcas := array_cat(v_origem_marcas, v_loser.origem_marcas);
      -- Remover duplicatas
      SELECT array_agg(DISTINCT marca) INTO v_origem_marcas
      FROM unnest(v_origem_marcas) AS marca;
    END IF;

    -- Coletar IDs de origem
    IF v_loser.id_sprinthub IS NOT NULL AND NOT (v_loser.id_sprinthub = ANY(v_ids_sprinthub)) THEN
      v_ids_sprinthub := array_append(v_ids_sprinthub, v_loser.id_sprinthub);
    END IF;
    IF v_loser.id_prime IS NOT NULL AND NOT (v_loser.id_prime = ANY(v_ids_prime)) THEN
      v_ids_prime := array_append(v_ids_prime, v_loser.id_prime);
    END IF;
    IF v_loser.id_greatpage IS NOT NULL AND NOT (v_loser.id_greatpage = ANY(v_ids_greatpage)) THEN
      v_ids_greatpage := array_append(v_ids_greatpage, v_loser.id_greatpage);
    END IF;
    IF v_loser.id_blacklabs IS NOT NULL AND NOT (v_loser.id_blacklabs = ANY(v_ids_blacklabs)) THEN
      v_ids_blacklabs := array_append(v_ids_blacklabs, v_loser.id_blacklabs);
    END IF;

    -- Marcar como inativo/mesclado
    UPDATE api.clientes_mestre
    SET
      ativo = false,
      observacoes = COALESCE(observacoes || ' | ', '') ||
                    'Mesclado em ' || NOW()::DATE || ' no cliente ID ' || master_id,
      data_ultima_atualizacao = NOW()
    WHERE id = v_loser.id;
  END LOOP;

  -- Atualizar o cliente master com os dados consolidados
  UPDATE api.clientes_mestre
  SET
    origem_marcas = v_origem_marcas,
    observacoes = COALESCE(observacoes || ' | ', '') ||
                  'Mesclagem de ' || v_affected_count || ' cliente(s) em ' || NOW()::DATE ||
                  ' (IDs: ' || array_to_string(loser_ids, ', ') || ')',
    data_ultima_atualizacao = NOW()
  WHERE id = master_id
  RETURNING * INTO v_updated_master;

  -- Guardar snapshot após
  v_dados_depois := to_jsonb(v_updated_master);

  -- Adicionar observações sobre IDs coletados
  UPDATE api.clientes_mestre
  SET
    observacoes = COALESCE(observacoes || ' | ', '') ||
                  CASE
                    WHEN array_length(v_ids_sprinthub, 1) > 1 THEN
                      'IDs Sprint: ' || array_to_string(v_ids_sprinthub, ', ') || ' | '
                    ELSE ''
                  END ||
                  CASE
                    WHEN array_length(v_ids_prime, 1) > 1 THEN
                      'IDs Prime: ' || array_to_string(v_ids_prime, ', ') || ' | '
                    ELSE ''
                  END ||
                  CASE
                    WHEN array_length(v_ids_greatpage, 1) > 1 THEN
                      'IDs GreatPage: ' || array_to_string(v_ids_greatpage, ', ') || ' | '
                    ELSE ''
                  END ||
                  CASE
                    WHEN array_length(v_ids_blacklabs, 1) > 1 THEN
                      'IDs BlackLabs: ' || array_to_string(v_ids_blacklabs, ', ')
                    ELSE ''
                  END
  WHERE id = master_id AND (
    array_length(v_ids_sprinthub, 1) > 1 OR
    array_length(v_ids_prime, 1) > 1 OR
    array_length(v_ids_greatpage, 1) > 1 OR
    array_length(v_ids_blacklabs, 1) > 1
  );

  -- Registrar auditoria
  INSERT INTO api.merge_clientes_log (
    master_id,
    merged_ids,
    executed_by,
    dados_antes,
    dados_depois
  ) VALUES (
    master_id,
    loser_ids,
    executed_by,
    v_dados_antes,
    v_dados_depois
  );

  -- Retornar sucesso
  RETURN jsonb_build_object(
    'success', true,
    'master_id', master_id,
    'merged_count', v_affected_count,
    'origem_marcas', v_origem_marcas,
    'ids_collected', jsonb_build_object(
      'sprinthub', v_ids_sprinthub,
      'prime', v_ids_prime,
      'greatpage', v_ids_greatpage,
      'blacklabs', v_ids_blacklabs
    )
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM,
      'detail', SQLSTATE
    );
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 3. PERMISSÕES
-- ============================================================================

GRANT EXECUTE ON FUNCTION api.merge_cliente(BIGINT, BIGINT[], JSONB, TEXT) TO service_role, anon, authenticated;

COMMENT ON FUNCTION api.merge_cliente IS 'Mescla clientes duplicados em um registro mestre, preservando IDs de origem e criando auditoria';

-- ============================================================================
-- 4. ADICIONAR COLUNA 'ativo' SE NÃO EXISTIR
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'api'
    AND table_name = 'clientes_mestre'
    AND column_name = 'ativo'
  ) THEN
    ALTER TABLE api.clientes_mestre ADD COLUMN ativo BOOLEAN DEFAULT true;
    CREATE INDEX idx_clientes_mestre_ativo ON api.clientes_mestre(ativo) WHERE ativo = true;
    COMMENT ON COLUMN api.clientes_mestre.ativo IS 'Indica se o cliente está ativo ou foi mesclado em outro registro';
    RAISE NOTICE '✅ Coluna ativo adicionada à tabela clientes_mestre';
  ELSE
    RAISE NOTICE 'ℹ️  Coluna ativo já existe na tabela clientes_mestre';
  END IF;
END $$;

-- ============================================================================
-- 5. VERIFICAÇÃO
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Função merge_cliente criada com sucesso!';
  RAISE NOTICE '✅ Tabela merge_clientes_log criada para auditoria';
  RAISE NOTICE '✅ Coluna ativo verificada/adicionada';
  RAISE NOTICE '';
  RAISE NOTICE 'Uso:';
  RAISE NOTICE 'SELECT api.merge_cliente(';
  RAISE NOTICE '  master_id := 123,';
  RAISE NOTICE '  loser_ids := ARRAY[124, 125],';
  RAISE NOTICE '  fields_json := ''{}''::jsonb,';
  RAISE NOTICE '  executed_by := ''user@email.com''';
  RAISE NOTICE ');';
END $$;
