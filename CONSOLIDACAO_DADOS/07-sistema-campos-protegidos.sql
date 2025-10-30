-- ============================================================================
-- SISTEMA DE PROTEÇÃO DE CAMPOS EDITADOS MANUALMENTE
-- ============================================================================
-- Este sistema protege campos editados manualmente contra sobrescrita automática
-- ============================================================================

-- 1. Criar tabela de campos protegidos (se não existir)
CREATE TABLE IF NOT EXISTS api.campos_protegidos (
  id SERIAL PRIMARY KEY,
  id_cliente_mestre INTEGER NOT NULL REFERENCES api.clientes_mestre(id) ON DELETE CASCADE,
  campo_protegido TEXT NOT NULL,
  valor_protegido TEXT,
  motivo TEXT DEFAULT 'Edição manual',
  data_protecao TIMESTAMPTZ DEFAULT NOW(),
  usuario TEXT DEFAULT CURRENT_USER,
  UNIQUE(id_cliente_mestre, campo_protegido)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_campos_protegidos_cliente ON api.campos_protegidos(id_cliente_mestre);
CREATE INDEX IF NOT EXISTS idx_campos_protegidos_campo ON api.campos_protegidos(campo_protegido);

-- Adicionar colunas que podem estar faltando (se tabela já existia)
DO $$
BEGIN
  -- Adicionar coluna usuario se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'api'
    AND table_name = 'campos_protegidos'
    AND column_name = 'usuario'
  ) THEN
    ALTER TABLE api.campos_protegidos ADD COLUMN usuario TEXT DEFAULT CURRENT_USER;
  END IF;
END $$;

-- Comentários
COMMENT ON TABLE api.campos_protegidos IS 'Registra campos editados manualmente que devem ser protegidos';
COMMENT ON COLUMN api.campos_protegidos.id_cliente_mestre IS 'ID do cliente';
COMMENT ON COLUMN api.campos_protegidos.campo_protegido IS 'Nome do campo protegido';
COMMENT ON COLUMN api.campos_protegidos.valor_protegido IS 'Valor do campo (auditoria)';
COMMENT ON COLUMN api.campos_protegidos.usuario IS 'Usuário que fez a proteção';

-- 2. Função: Verificar se campo está protegido
CREATE OR REPLACE FUNCTION api.campo_esta_protegido(
  p_id_cliente INTEGER,
  p_campo TEXT
) RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM api.campos_protegidos
    WHERE id_cliente_mestre = p_id_cliente
      AND campo_protegido = p_campo
  );
END;
$$ LANGUAGE plpgsql STABLE;

-- 3. Função: Desproteger campo
CREATE OR REPLACE FUNCTION api.desproteger_campo(
  p_id_cliente INTEGER,
  p_campo TEXT
) RETURNS VOID AS $$
BEGIN
  DELETE FROM api.campos_protegidos
  WHERE id_cliente_mestre = p_id_cliente
    AND campo_protegido = p_campo;
END;
$$ LANGUAGE plpgsql;

-- 4. Função: Desproteger todos campos de um cliente
CREATE OR REPLACE FUNCTION api.desproteger_cliente(
  p_id_cliente INTEGER
) RETURNS VOID AS $$
BEGIN
  DELETE FROM api.campos_protegidos
  WHERE id_cliente_mestre = p_id_cliente;
END;
$$ LANGUAGE plpgsql;

-- 5. View de auditoria
CREATE OR REPLACE VIEW api.vw_campos_protegidos_auditoria AS
SELECT
  cp.id,
  cp.id_cliente_mestre,
  cm.nome_completo,
  cm.email,
  cp.campo_protegido,
  cp.valor_protegido,
  cp.motivo,
  cp.data_protecao,
  cp.usuario
FROM api.campos_protegidos cp
JOIN api.clientes_mestre cm ON cm.id = cp.id_cliente_mestre
ORDER BY cp.data_protecao DESC;

-- 6. Trigger para atualizar timestamp do cliente
CREATE OR REPLACE FUNCTION api.trg_campos_protegidos_updated()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE api.clientes_mestre
  SET data_ultima_atualizacao = NOW()
  WHERE id = NEW.id_cliente_mestre;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_campos_protegidos_updated ON api.campos_protegidos;
CREATE TRIGGER trg_campos_protegidos_updated
  AFTER INSERT OR UPDATE ON api.campos_protegidos
  FOR EACH ROW
  EXECUTE FUNCTION api.trg_campos_protegidos_updated();

-- Permissões
GRANT SELECT, INSERT, UPDATE, DELETE ON api.campos_protegidos TO anon, authenticated;
GRANT USAGE, SELECT ON SEQUENCE api.campos_protegidos_id_seq TO anon, authenticated;
GRANT SELECT ON api.vw_campos_protegidos_auditoria TO anon, authenticated;
GRANT EXECUTE ON FUNCTION api.campo_esta_protegido(INTEGER, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION api.desproteger_campo(INTEGER, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION api.desproteger_cliente(INTEGER) TO anon, authenticated;

-- Mensagem
DO $$
BEGIN
  RAISE NOTICE '✅ Sistema de proteção de campos criado!';
END $$;
