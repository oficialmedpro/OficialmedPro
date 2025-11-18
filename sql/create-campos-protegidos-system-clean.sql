-- Sistema de Proteção de Campos Editados Manualmente
-- Este script LIMPA qualquer versão anterior e recria tudo do zero

-- ============================================================================
-- PASSO 1: LIMPAR TUDO (se existir)
-- ============================================================================

-- Dropar view
DROP VIEW IF EXISTS api.vw_campos_protegidos_auditoria CASCADE;

-- Dropar trigger
DROP TRIGGER IF EXISTS trg_campos_protegidos_updated ON api.campos_protegidos;

-- Dropar funções (todas as assinaturas possíveis)
DROP FUNCTION IF EXISTS api.trg_campos_protegidos_updated() CASCADE;
DROP FUNCTION IF EXISTS api.merge_field_if_not_protected(INTEGER, TEXT, TEXT, TEXT) CASCADE;
DROP FUNCTION IF EXISTS api.desproteger_cliente(INTEGER) CASCADE;
DROP FUNCTION IF EXISTS api.desproteger_campo(INTEGER, TEXT) CASCADE;
DROP FUNCTION IF EXISTS api.campo_esta_protegido(INTEGER, TEXT) CASCADE;

-- Dropar índices
DROP INDEX IF EXISTS api.idx_campos_protegidos_cliente;
DROP INDEX IF EXISTS api.idx_campos_protegidos_campo;

-- Dropar tabela (CASCADE remove tudo relacionado)
DROP TABLE IF EXISTS api.campos_protegidos CASCADE;

-- ============================================================================
-- PASSO 2: CRIAR TUDO DO ZERO
-- ============================================================================

-- 1. Criar a tabela de campos protegidos
CREATE TABLE api.campos_protegidos (
  id SERIAL PRIMARY KEY,
  id_cliente_mestre INTEGER NOT NULL REFERENCES api.clientes_mestre(id) ON DELETE CASCADE,
  campo_protegido TEXT NOT NULL,
  valor_protegido TEXT,
  motivo TEXT DEFAULT 'Edição manual',
  data_protecao TIMESTAMPTZ DEFAULT NOW(),
  usuario TEXT DEFAULT CURRENT_USER,
  UNIQUE(id_cliente_mestre, campo_protegido)
);

-- Índices para performance
CREATE INDEX idx_campos_protegidos_cliente ON api.campos_protegidos(id_cliente_mestre);
CREATE INDEX idx_campos_protegidos_campo ON api.campos_protegidos(campo_protegido);

-- Comentários
COMMENT ON TABLE api.campos_protegidos IS 'Registra campos que foram editados manualmente e devem ser protegidos contra sobrescrita automática';
COMMENT ON COLUMN api.campos_protegidos.id_cliente_mestre IS 'ID do cliente na tabela mestre';
COMMENT ON COLUMN api.campos_protegidos.campo_protegido IS 'Nome do campo que foi editado manualmente';
COMMENT ON COLUMN api.campos_protegidos.valor_protegido IS 'Valor atual do campo (para auditoria)';
COMMENT ON COLUMN api.campos_protegidos.motivo IS 'Motivo da proteção (ex: Edição manual)';
COMMENT ON COLUMN api.campos_protegidos.data_protecao IS 'Data/hora em que o campo foi protegido';

-- 2. Função para verificar se um campo está protegido
CREATE FUNCTION api.campo_esta_protegido(
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

COMMENT ON FUNCTION api.campo_esta_protegido(INTEGER, TEXT) IS 'Verifica se um campo específico de um cliente está protegido contra sobrescrita';

-- 3. Função para desproteger um campo (caso necessário)
CREATE FUNCTION api.desproteger_campo(
  p_id_cliente INTEGER,
  p_campo TEXT
) RETURNS VOID AS $$
BEGIN
  DELETE FROM api.campos_protegidos
  WHERE id_cliente_mestre = p_id_cliente
    AND campo_protegido = p_campo;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION api.desproteger_campo(INTEGER, TEXT) IS 'Remove a proteção de um campo específico, permitindo sobrescrita automática';

-- 4. Função para desproteger todos os campos de um cliente
CREATE FUNCTION api.desproteger_cliente(
  p_id_cliente INTEGER
) RETURNS VOID AS $$
BEGIN
  DELETE FROM api.campos_protegidos
  WHERE id_cliente_mestre = p_id_cliente;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION api.desproteger_cliente(INTEGER) IS 'Remove todas as proteções de campos de um cliente específico';

-- 5. View para auditoria de campos protegidos
CREATE VIEW api.vw_campos_protegidos_auditoria AS
SELECT
  cp.id,
  cp.id_cliente_mestre,
  cm.nome_completo,
  cm.email,
  cp.campo_protegido,
  cp.valor_protegido,
  cp.motivo,
  cp.data_protecao,
  cp.usuario,
  -- Verificar se o valor atual ainda corresponde ao valor protegido
  CASE
    WHEN cp.campo_protegido = 'nome_completo' THEN cm.nome_completo = cp.valor_protegido
    WHEN cp.campo_protegido = 'email' THEN cm.email = cp.valor_protegido
    WHEN cp.campo_protegido = 'whatsapp' THEN cm.whatsapp = cp.valor_protegido
    WHEN cp.campo_protegido = 'telefone' THEN cm.telefone = cp.valor_protegido
    WHEN cp.campo_protegido = 'cpf' THEN cm.cpf = cp.valor_protegido
    ELSE NULL
  END AS valor_ainda_valido
FROM api.campos_protegidos cp
JOIN api.clientes_mestre cm ON cm.id = cp.id_cliente_mestre
ORDER BY cp.data_protecao DESC;

COMMENT ON VIEW api.vw_campos_protegidos_auditoria IS 'View para auditoria de campos protegidos com informações do cliente';

-- 6. Trigger para atualizar data_ultima_atualizacao ao proteger campo
CREATE FUNCTION api.trg_campos_protegidos_updated()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE api.clientes_mestre
  SET data_ultima_atualizacao = NOW()
  WHERE id = NEW.id_cliente_mestre;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_campos_protegidos_updated
  AFTER INSERT OR UPDATE ON api.campos_protegidos
  FOR EACH ROW
  EXECUTE FUNCTION api.trg_campos_protegidos_updated();

-- 7. Função auxiliar para consolidação que respeita campos protegidos
CREATE FUNCTION api.merge_field_if_not_protected(
  p_id_cliente INTEGER,
  p_campo TEXT,
  p_valor_atual TEXT,
  p_valor_novo TEXT
) RETURNS TEXT AS $$
DECLARE
  v_campo_protegido BOOLEAN;
BEGIN
  -- Verificar se o campo está protegido
  v_campo_protegido := api.campo_esta_protegido(p_id_cliente, p_campo);

  -- Se protegido, retornar valor atual
  IF v_campo_protegido THEN
    RETURN p_valor_atual;
  END IF;

  -- Senão, aplicar lógica normal de merge (priorizar não-nulo)
  RETURN COALESCE(p_valor_novo, p_valor_atual);
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION api.merge_field_if_not_protected(INTEGER, TEXT, TEXT, TEXT) IS 'Faz merge de campos respeitando proteções. Retorna valor atual se protegido, senão aplica lógica normal';

-- Permissões
GRANT SELECT, INSERT, UPDATE, DELETE ON api.campos_protegidos TO anon, authenticated;
GRANT USAGE, SELECT ON SEQUENCE api.campos_protegidos_id_seq TO anon, authenticated;
GRANT SELECT ON api.vw_campos_protegidos_auditoria TO anon, authenticated;
GRANT EXECUTE ON FUNCTION api.campo_esta_protegido(INTEGER, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION api.desproteger_campo(INTEGER, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION api.desproteger_cliente(INTEGER) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION api.merge_field_if_not_protected(INTEGER, TEXT, TEXT, TEXT) TO anon, authenticated;

-- Mensagem de sucesso
DO $$
BEGIN
  RAISE NOTICE '✅ Sistema de proteção de campos criado com sucesso!';
  RAISE NOTICE '📋 Tabela: api.campos_protegidos';
  RAISE NOTICE '🔍 View de auditoria: api.vw_campos_protegidos_auditoria';
  RAISE NOTICE '🛡️ Funções disponíveis:';
  RAISE NOTICE '   - campo_esta_protegido(cliente_id, campo)';
  RAISE NOTICE '   - desproteger_campo(cliente_id, campo)';
  RAISE NOTICE '   - desproteger_cliente(cliente_id)';
  RAISE NOTICE '   - merge_field_if_not_protected(cliente_id, campo, valor_atual, valor_novo)';
END $$;
