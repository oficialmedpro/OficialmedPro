-- ============================================================================
-- CONSOLIDAÇÃO DE DADOS - CRIAÇÃO DA TABELA MESTRE
-- ============================================================================
-- Descrição: Tabela consolidada que unifica dados de múltiplas fontes
-- Fontes: leads (Sprint), greatpage_leads, blacklabs, prime_clientes
-- Estratégia: Deduplicação por CPF + telefone normalizado
-- ============================================================================

-- Limpar tabela existente (CUIDADO: Apaga todos os dados)
DROP TABLE IF EXISTS api.clientes_mestre CASCADE;

-- ============================================================================
-- 1. FUNÇÕES AUXILIARES
-- ============================================================================

-- Função: Normalizar telefone (remove DDI, formatação)
CREATE OR REPLACE FUNCTION api.normalizar_telefone(telefone TEXT)
RETURNS TEXT AS $$
DECLARE
  v_num TEXT;
BEGIN
  IF telefone IS NULL OR telefone = '' THEN
    RETURN NULL;
  END IF;

  -- Remove tudo exceto números
  v_num := regexp_replace(telefone, '\D', '', 'g');

  -- Remove DDI 55 se presente
  IF v_num LIKE '55%' THEN
    v_num := substring(v_num from 3);
  END IF;

  -- Validar: deve ter 10 ou 11 dígitos (DDD + número)
  IF length(v_num) < 10 OR length(v_num) > 11 THEN
    RETURN NULL;
  END IF;

  RETURN v_num;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Função: Normalizar CPF (apenas números)
CREATE OR REPLACE FUNCTION api.normalizar_cpf(cpf TEXT)
RETURNS TEXT AS $$
BEGIN
  IF cpf IS NULL OR cpf = '' THEN
    RETURN NULL;
  END IF;

  -- Remove tudo exceto números
  RETURN regexp_replace(cpf, '\D', '', 'g');
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Função: Gerar chave de identificação única
CREATE OR REPLACE FUNCTION api.gerar_chave_identificacao(cpf TEXT, telefone TEXT)
RETURNS TEXT AS $$
DECLARE
  v_cpf_norm TEXT;
  v_tel_norm TEXT;
BEGIN
  v_cpf_norm := api.normalizar_cpf(cpf);
  v_tel_norm := api.normalizar_telefone(telefone);

  -- Prioridade: CPF + Tel > CPF > Tel
  IF v_cpf_norm IS NOT NULL AND v_tel_norm IS NOT NULL THEN
    RETURN 'CPF:' || v_cpf_norm || '|TEL:' || v_tel_norm;
  ELSIF v_cpf_norm IS NOT NULL THEN
    RETURN 'CPF:' || v_cpf_norm;
  ELSIF v_tel_norm IS NOT NULL THEN
    RETURN 'TEL:' || v_tel_norm;
  END IF;

  -- Sem chave única - permitir NULL para criar múltiplos registros
  RETURN NULL;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Função: Calcular score de qualidade (0-100)
CREATE OR REPLACE FUNCTION api.calcular_qualidade_dados(
  p_nome TEXT,
  p_email TEXT,
  p_whatsapp TEXT,
  p_cpf TEXT,
  p_rg TEXT,
  p_endereco TEXT,
  p_cidade TEXT,
  p_estado TEXT,
  p_data_nascimento DATE,
  p_sexo TEXT
)
RETURNS INTEGER AS $$
DECLARE
  v_score INTEGER := 0;
BEGIN
  -- Campos essenciais (60 pontos)
  IF p_nome IS NOT NULL AND p_nome != '...' THEN
    v_score := v_score + 20;
  END IF;

  IF p_whatsapp IS NOT NULL THEN
    v_score := v_score + 20;
  END IF;

  IF p_email IS NOT NULL THEN
    v_score := v_score + 20;
  END IF;

  -- Documentos (20 pontos)
  IF p_cpf IS NOT NULL THEN
    v_score := v_score + 10;
  END IF;

  IF p_rg IS NOT NULL THEN
    v_score := v_score + 10;
  END IF;

  -- Endereço completo (10 pontos)
  IF p_endereco IS NOT NULL AND p_cidade IS NOT NULL AND p_estado IS NOT NULL THEN
    v_score := v_score + 10;
  END IF;

  -- Data nascimento (5 pontos)
  IF p_data_nascimento IS NOT NULL THEN
    v_score := v_score + 5;
  END IF;

  -- Sexo (5 pontos)
  IF p_sexo IS NOT NULL THEN
    v_score := v_score + 5;
  END IF;

  RETURN v_score;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Função: Detectar nome ruim do Prime
CREATE OR REPLACE FUNCTION api.nome_prime_eh_ruim(nome TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  IF nome IS NULL OR nome = '' THEN
    RETURN TRUE;
  END IF;

  -- Nome é "..."
  IF nome = '...' THEN
    RETURN TRUE;
  END IF;

  -- Nome é apenas números (telefone como nome)
  IF nome ~ '^\d{8,}$' THEN
    RETURN TRUE;
  END IF;

  RETURN FALSE;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================================================
-- 2. CRIAÇÃO DA TABELA CLIENTES_MESTRE
-- ============================================================================

CREATE TABLE api.clientes_mestre (
  -- ===== Identificação =====
  id BIGSERIAL PRIMARY KEY,
  chave_identificacao TEXT, -- CPF + telefone normalizado (pode ser NULL)

  -- ===== Foreign Keys (IDs das tabelas de origem) =====
  id_sprinthub BIGINT,
  id_prime BIGINT,
  id_greatpage BIGINT,
  id_blacklabs BIGINT,

  -- ===== Dados Pessoais =====
  -- Prioridade: Sprint/Black/Great > Prime
  nome_completo TEXT,
  nome_cliente_prime TEXT, -- Separado devido à baixa qualidade do Prime
  email TEXT,
  cpf TEXT,
  rg TEXT,
  data_nascimento DATE,
  sexo TEXT,

  -- ===== Contatos (normalizados) =====
  whatsapp TEXT, -- Formato: apenas números (DDD+número, sem DDI)
  telefone TEXT,
  telefone_alternativo TEXT,

  -- ===== Endereço Completo =====
  cep TEXT,
  endereco_rua TEXT,
  endereco_numero TEXT,
  endereco_complemento TEXT,
  bairro TEXT,
  cidade TEXT,
  estado TEXT,
  pais TEXT DEFAULT 'Brasil',

  -- ===== Rastreamento de Origem =====
  origem_marcas TEXT[], -- Array de tags: ['sprinthub', 'google', 'blacklabs', 'prime']

  -- ===== Qualidade e Metadata =====
  qualidade_dados INTEGER DEFAULT 0, -- Score 0-100
  data_primeira_captura TIMESTAMP DEFAULT NOW(),
  data_ultima_atualizacao TIMESTAMP DEFAULT NOW(),
  sincronizado_em TIMESTAMP DEFAULT NOW(),

  -- ===== Observações =====
  observacoes TEXT,

  -- ===== Constraints =====
  CONSTRAINT unique_chave CHECK (
    chave_identificacao IS NULL OR chave_identificacao != ''
  )
);

-- ============================================================================
-- 3. ÍNDICES PARA PERFORMANCE
-- ============================================================================

-- Índice único na chave (permitindo NULL)
CREATE UNIQUE INDEX idx_clientes_mestre_chave
ON api.clientes_mestre(chave_identificacao)
WHERE chave_identificacao IS NOT NULL;

-- Índices para busca
CREATE INDEX idx_clientes_mestre_cpf ON api.clientes_mestre(cpf)
WHERE cpf IS NOT NULL;

CREATE INDEX idx_clientes_mestre_whatsapp ON api.clientes_mestre(whatsapp)
WHERE whatsapp IS NOT NULL;

CREATE INDEX idx_clientes_mestre_email ON api.clientes_mestre(email)
WHERE email IS NOT NULL;

-- Índices para foreign keys
CREATE INDEX idx_clientes_mestre_id_sprinthub ON api.clientes_mestre(id_sprinthub)
WHERE id_sprinthub IS NOT NULL;

CREATE INDEX idx_clientes_mestre_id_prime ON api.clientes_mestre(id_prime)
WHERE id_prime IS NOT NULL;

CREATE INDEX idx_clientes_mestre_id_greatpage ON api.clientes_mestre(id_greatpage)
WHERE id_greatpage IS NOT NULL;

CREATE INDEX idx_clientes_mestre_id_blacklabs ON api.clientes_mestre(id_blacklabs)
WHERE id_blacklabs IS NOT NULL;

-- Índice GIN para array de origens
CREATE INDEX idx_clientes_mestre_origem_marcas ON api.clientes_mestre
USING GIN(origem_marcas)
WHERE origem_marcas IS NOT NULL;

-- Índice para qualidade
CREATE INDEX idx_clientes_mestre_qualidade ON api.clientes_mestre(qualidade_dados DESC);

-- Índice para datas
CREATE INDEX idx_clientes_mestre_data_captura ON api.clientes_mestre(data_primeira_captura);
CREATE INDEX idx_clientes_mestre_data_atualizacao ON api.clientes_mestre(data_ultima_atualizacao);

-- ============================================================================
-- 4. COMENTÁRIOS NA TABELA
-- ============================================================================

COMMENT ON TABLE api.clientes_mestre IS 'Tabela consolidada mestre que unifica dados de múltiplas fontes (SprintHub, GreatPage, BlackLabs, Prime)';

COMMENT ON COLUMN api.clientes_mestre.chave_identificacao IS 'Chave única gerada por CPF + telefone normalizado';
COMMENT ON COLUMN api.clientes_mestre.nome_cliente_prime IS 'Nome do Prime (separado pois frequentemente contém dados ruins como "..." ou telefones)';
COMMENT ON COLUMN api.clientes_mestre.origem_marcas IS 'Array de tags indicando de quais fontes o cliente veio: sprinthub, google, blacklabs, prime';
COMMENT ON COLUMN api.clientes_mestre.qualidade_dados IS 'Score 0-100 calculado com base na completude dos dados';

-- ============================================================================
-- 5. GRANTS (Permissões)
-- ============================================================================

-- Permitir acesso via service_role e anon (se necessário)
GRANT ALL ON api.clientes_mestre TO service_role;
GRANT SELECT, INSERT, UPDATE ON api.clientes_mestre TO anon;
GRANT USAGE ON SEQUENCE api.clientes_mestre_id_seq TO service_role;
GRANT USAGE ON SEQUENCE api.clientes_mestre_id_seq TO anon;

-- ============================================================================
-- 6. VIEWS ÚTEIS
-- ============================================================================

-- View: Clientes de alta qualidade
CREATE OR REPLACE VIEW api.clientes_mestre_alta_qualidade AS
SELECT *
FROM api.clientes_mestre
WHERE qualidade_dados >= 80
ORDER BY qualidade_dados DESC;

-- View: Clientes de múltiplas fontes (deduplicados)
CREATE OR REPLACE VIEW api.clientes_mestre_multiplas_fontes AS
SELECT *
FROM api.clientes_mestre
WHERE array_length(origem_marcas, 1) > 1
ORDER BY array_length(origem_marcas, 1) DESC;

-- View: Estatísticas por origem
CREATE OR REPLACE VIEW api.stats_clientes_por_origem AS
SELECT
  origem,
  COUNT(*) as total_clientes,
  AVG(qualidade_dados)::INTEGER as qualidade_media,
  COUNT(CASE WHEN qualidade_dados >= 80 THEN 1 END) as alta_qualidade,
  COUNT(CASE WHEN email IS NOT NULL THEN 1 END) as com_email,
  COUNT(CASE WHEN whatsapp IS NOT NULL THEN 1 END) as com_whatsapp,
  COUNT(CASE WHEN cpf IS NOT NULL THEN 1 END) as com_cpf
FROM api.clientes_mestre, unnest(origem_marcas) as origem
GROUP BY origem
ORDER BY total_clientes DESC;

-- ============================================================================
-- FIM DO SCRIPT
-- ============================================================================

-- Verificação final
DO $$
BEGIN
  RAISE NOTICE '✅ Tabela clientes_mestre criada com sucesso!';
  RAISE NOTICE '✅ % funções auxiliares criadas', 5;
  RAISE NOTICE '✅ % índices criados', 12;
  RAISE NOTICE '✅ % views criadas', 3;
  RAISE NOTICE '';
  RAISE NOTICE 'Próximos passos:';
  RAISE NOTICE '1. Executar script de consolidação inicial';
  RAISE NOTICE '2. Configurar sincronização dinâmica (triggers ou Edge Functions)';
  RAISE NOTICE '3. Monitorar qualidade dos dados';
END $$;
