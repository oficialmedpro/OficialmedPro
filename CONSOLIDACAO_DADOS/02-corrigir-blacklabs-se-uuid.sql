-- ============================================================================
-- SOLUÇÃO 1: Se blacklabs.id for UUID
-- ============================================================================
-- Descrição: Altera id_blacklabs para UUID na clientes_mestre
-- Execute APENAS se o script anterior mostrar que blacklabs.id é UUID
-- ============================================================================

-- 1. Alterar tipo da coluna
ALTER TABLE api.clientes_mestre 
ALTER COLUMN id_blacklabs TYPE UUID 
USING id_blacklabs::TEXT::UUID;

-- 2. Recriar o índice
DROP INDEX IF EXISTS api.idx_clientes_mestre_id_blacklabs;
CREATE INDEX idx_clientes_mestre_id_blacklabs 
ON api.clientes_mestre(id_blacklabs)
WHERE id_blacklabs IS NOT NULL;

-- 3. Atualizar a função para usar UUID diretamente
CREATE OR REPLACE FUNCTION api.consolidar_cliente_automatico()
RETURNS TRIGGER AS $$
DECLARE
  v_chave TEXT;
  v_cliente RECORD;
  v_fonte TEXT;
  v_fk_column TEXT;
  v_tag TEXT;
  v_dados_normalizados JSONB;
BEGIN
  CASE TG_TABLE_NAME
    WHEN 'leads' THEN
      v_fonte := 'sprinthub';
      v_fk_column := 'id_sprinthub';
      v_tag := 'sprinthub';

      v_dados_normalizados := jsonb_build_object(
        'nome_completo', COALESCE(NEW.firstname || ' ' || NEW.lastname, NEW.firstname),
        'email', NEW.email,
        'whatsapp', api.normalizar_telefone(NEW.whatsapp),
        'telefone', NEW.phone,
        'cpf', api.normalizar_cpf(NEW.cpf),
        'rg', NEW.rg,
        'data_nascimento', NEW.data_de_nascimento,
        'sexo', NEW.sexo,
        'endereco_rua', NEW.address,
        'endereco_numero', NEW.numero_entrega,
        'endereco_complemento', NEW.complemento,
        'bairro', NEW.bairro,
        'cidade', NEW.city,
        'estado', NEW.state,
        'cep', NEW.zipcode
      );

      v_chave := api.gerar_chave_identificacao(NEW.cpf, NEW.whatsapp);

    WHEN 'greatpage_leads' THEN
      v_fonte := 'google';
      v_fk_column := 'id_greatpage';
      v_tag := 'google';

      v_dados_normalizados := jsonb_build_object(
        'nome_completo', NEW.nome_completo,
        'email', NEW.email,
        'whatsapp', api.normalizar_telefone(NEW.telefone),
        'cidade', NEW.cidade_usuario,
        'estado', NEW.regiao_usuario
      );

      v_chave := api.gerar_chave_identificacao(NULL, NEW.telefone);

    WHEN 'blacklabs' THEN
      v_fonte := 'blacklabs';
      v_fk_column := 'id_blacklabs';
      v_tag := 'blacklabs';

      v_dados_normalizados := jsonb_build_object(
        'nome_completo', NEW.cliente,
        'cpf', api.normalizar_cpf(NEW.cpf),
        'email', NEW.email,
        'whatsapp', api.normalizar_telefone(NEW.telefone),
        'endereco_rua', NEW.rua_entrega,
        'endereco_numero', NEW.numero_entrega,
        'bairro', NEW.bairro,
        'endereco_complemento', NEW.complemento,
        'cidade', NEW.cidade,
        'estado', NEW.estado,
        'cep', NEW.cep
      );

      v_chave := api.gerar_chave_identificacao(NEW.cpf, NEW.telefone);

    WHEN 'prime_clientes' THEN
      v_fonte := 'prime';
      v_fk_column := 'id_prime';
      v_tag := 'prime';

      v_dados_normalizados := jsonb_build_object(
        'nome_completo', NEW.nome,
        'nome_cliente_prime', NEW.nome,
        'cpf', api.normalizar_cpf(NEW.cpf_cnpj),
        'data_nascimento', NEW.data_nascimento,
        'sexo', NEW.sexo,
        'email', NEW.email,
        'whatsapp', api.normalizar_telefone(NEW.telefone),
        'endereco_rua', NEW.endereco_logradouro,
        'endereco_numero', NEW.endereco_numero,
        'cep', NEW.endereco_cep,
        'cidade', NEW.endereco_cidade,
        'estado', NEW.endereco_estado,
        'endereco_complemento', NEW.endereco_observacao
      );

      v_chave := api.gerar_chave_identificacao(NEW.cpf_cnpj, NEW.telefone);

    ELSE
      RAISE EXCEPTION 'Tabela não suportada: %', TG_TABLE_NAME;
  END CASE;

  SELECT * INTO v_cliente
  FROM api.clientes_mestre
  WHERE chave_identificacao = v_chave
     OR (cpf IS NOT NULL AND cpf = v_dados_normalizados->>'cpf')
     OR (email IS NOT NULL AND email = v_dados_normalizados->>'email')
     OR (whatsapp IS NOT NULL AND whatsapp = v_dados_normalizados->>'whatsapp')
  LIMIT 1;

  IF FOUND THEN
    UPDATE api.clientes_mestre SET
      origem_marcas = ARRAY(
        SELECT DISTINCT unnest(
          COALESCE(origem_marcas, ARRAY[]::TEXT[]) || ARRAY[v_tag]::TEXT[]
        )
      ),

      -- ⭐ Para BIGINT: usar ::BIGINT, Para UUID: usar ::UUID ou nada
      id_sprinthub = CASE 
        WHEN v_fk_column = 'id_sprinthub' THEN NEW.id::BIGINT 
        ELSE id_sprinthub 
      END,
      id_greatpage = CASE 
        WHEN v_fk_column = 'id_greatpage' THEN NEW.id::BIGINT 
        ELSE id_greatpage 
      END,
      id_blacklabs = CASE 
        WHEN v_fk_column = 'id_blacklabs' THEN NEW.id::UUID 
        ELSE id_blacklabs 
      END,
      id_prime = CASE 
        WHEN v_fk_column = 'id_prime' THEN NEW.id::BIGINT 
        ELSE id_prime 
      END,

      nome_completo = CASE
        WHEN v_fonte IN ('sprinthub', 'prime')
          THEN COALESCE(NULLIF(v_dados_normalizados->>'nome_completo', ''), nome_completo)
        ELSE COALESCE(nome_completo, NULLIF(v_dados_normalizados->>'nome_completo', ''))
      END,

      nome_cliente_prime = CASE
        WHEN v_fonte = 'prime' THEN v_dados_normalizados->>'nome_completo'
        ELSE nome_cliente_prime
      END,

      email = CASE
        WHEN v_fonte IN ('sprinthub', 'prime')
          THEN COALESCE(NULLIF(v_dados_normalizados->>'email', ''), email)
        ELSE COALESCE(email, NULLIF(v_dados_normalizados->>'email', ''))
      END,

      whatsapp = CASE
        WHEN v_fonte IN ('sprinthub', 'prime')
          THEN COALESCE(NULLIF(v_dados_normalizados->>'whatsapp', ''), whatsapp)
        ELSE COALESCE(whatsapp, NULLIF(v_dados_normalizados->>'whatsapp', ''))
      END,

      telefone = CASE
        WHEN v_fonte IN ('sprinthub', 'prime')
          THEN COALESCE(NULLIF(v_dados_normalizados->>'telefone', ''), telefone)
        ELSE COALESCE(telefone, NULLIF(v_dados_normalizados->>'telefone', ''))
      END,

      cpf = CASE
        WHEN v_fonte IN ('sprinthub', 'prime')
          THEN COALESCE(NULLIF(v_dados_normalizados->>'cpf', ''), cpf)
        ELSE COALESCE(cpf, NULLIF(v_dados_normalizados->>'cpf', ''))
      END,

      rg = CASE
        WHEN v_fonte IN ('sprinthub', 'prime')
          THEN COALESCE(NULLIF(v_dados_normalizados->>'rg', ''), rg)
        ELSE COALESCE(rg, NULLIF(v_dados_normalizados->>'rg', ''))
      END,

      data_nascimento = CASE
        WHEN v_fonte IN ('sprinthub', 'prime')
          THEN COALESCE((v_dados_normalizados->>'data_nascimento')::DATE, data_nascimento)
        ELSE COALESCE(data_nascimento, (v_dados_normalizados->>'data_nascimento')::DATE)
      END,

      sexo = CASE
        WHEN v_fonte IN ('sprinthub', 'prime')
          THEN COALESCE(NULLIF(v_dados_normalizados->>'sexo', ''), sexo)
        ELSE COALESCE(sexo, NULLIF(v_dados_normalizados->>'sexo', ''))
      END,

      endereco_rua = CASE
        WHEN v_fonte IN ('sprinthub', 'prime')
          THEN COALESCE(NULLIF(v_dados_normalizados->>'endereco_rua', ''), endereco_rua)
        ELSE COALESCE(endereco_rua, NULLIF(v_dados_normalizados->>'endereco_rua', ''))
      END,

      endereco_numero = CASE
        WHEN v_fonte IN ('sprinthub', 'prime')
          THEN COALESCE(NULLIF(v_dados_normalizados->>'endereco_numero', ''), endereco_numero)
        ELSE COALESCE(endereco_numero, NULLIF(v_dados_normalizados->>'endereco_numero', ''))
      END,

      endereco_complemento = CASE
        WHEN v_fonte IN ('sprinthub', 'prime')
          THEN COALESCE(NULLIF(v_dados_normalizados->>'endereco_complemento', ''), endereco_complemento)
        ELSE COALESCE(endereco_complemento, NULLIF(v_dados_normalizados->>'endereco_complemento', ''))
      END,

      bairro = CASE
        WHEN v_fonte IN ('sprinthub', 'prime')
          THEN COALESCE(NULLIF(v_dados_normalizados->>'bairro', ''), bairro)
        ELSE COALESCE(bairro, NULLIF(v_dados_normalizados->>'bairro', ''))
      END,

      cidade = CASE
        WHEN v_fonte IN ('sprinthub', 'prime')
          THEN COALESCE(NULLIF(v_dados_normalizados->>'cidade', ''), cidade)
        ELSE COALESCE(cidade, NULLIF(v_dados_normalizados->>'cidade', ''))
      END,

      estado = CASE
        WHEN v_fonte IN ('sprinthub', 'prime')
          THEN COALESCE(NULLIF(v_dados_normalizados->>'estado', ''), estado)
        ELSE COALESCE(estado, NULLIF(v_dados_normalizados->>'estado', ''))
      END,

      cep = CASE
        WHEN v_fonte IN ('sprinthub', 'prime')
          THEN COALESCE(NULLIF(v_dados_normalizados->>'cep', ''), cep)
        ELSE COALESCE(cep, NULLIF(v_dados_normalizados->>'cep', ''))
      END,

      data_ultima_atualizacao = NOW(),
      sincronizado_em = NOW(),

      qualidade_dados = api.calcular_qualidade_dados(
        nome_completo,
        email,
        whatsapp,
        cpf,
        rg,
        endereco_rua,
        cidade,
        estado,
        data_nascimento,
        sexo
      )
    WHERE id = v_cliente.id;

  ELSE
    INSERT INTO api.clientes_mestre (
      chave_identificacao,
      origem_marcas,
      id_sprinthub,
      id_greatpage,
      id_blacklabs,
      id_prime,
      nome_completo,
      nome_cliente_prime,
      email,
      whatsapp,
      telefone,
      cpf,
      rg,
      data_nascimento,
      sexo,
      endereco_rua,
      endereco_numero,
      endereco_complemento,
      bairro,
      cidade,
      estado,
      cep,
      data_primeira_captura,
      data_ultima_atualizacao,
      qualidade_dados
    ) VALUES (
      v_chave,
      ARRAY[v_tag]::TEXT[],
      CASE WHEN v_fk_column = 'id_sprinthub' THEN NEW.id::BIGINT END,
      CASE WHEN v_fk_column = 'id_greatpage' THEN NEW.id::BIGINT END,
      CASE WHEN v_fk_column = 'id_blacklabs' THEN NEW.id::UUID END,
      CASE WHEN v_fk_column = 'id_prime' THEN NEW.id::BIGINT END,
      NULLIF(v_dados_normalizados->>'nome_completo', ''),
      CASE WHEN v_fonte = 'prime' THEN v_dados_normalizados->>'nome_completo' END,
      NULLIF(v_dados_normalizados->>'email', ''),
      NULLIF(v_dados_normalizados->>'whatsapp', ''),
      NULLIF(v_dados_normalizados->>'telefone', ''),
      NULLIF(v_dados_normalizados->>'cpf', ''),
      NULLIF(v_dados_normalizados->>'rg', ''),
      (v_dados_normalizados->>'data_nascimento')::DATE,
      NULLIF(v_dados_normalizados->>'sexo', ''),
      NULLIF(v_dados_normalizados->>'endereco_rua', ''),
      NULLIF(v_dados_normalizados->>'endereco_numero', ''),
      NULLIF(v_dados_normalizados->>'endereco_complemento', ''),
      NULLIF(v_dados_normalizados->>'bairro', ''),
      NULLIF(v_dados_normalizados->>'cidade', ''),
      NULLIF(v_dados_normalizados->>'estado', ''),
      NULLIF(v_dados_normalizados->>'cep', ''),
      NOW(),
      NOW(),
      api.calcular_qualidade_dados(
        v_dados_normalizados->>'nome_completo',
        v_dados_normalizados->>'email',
        v_dados_normalizados->>'whatsapp',
        v_dados_normalizados->>'cpf',
        v_dados_normalizados->>'rg',
        v_dados_normalizados->>'endereco_rua',
        v_dados_normalizados->>'cidade',
        v_dados_normalizados->>'estado',
        (v_dados_normalizados->>'data_nascimento')::DATE,
        v_dados_normalizados->>'sexo'
      )
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

SELECT '✅ Coluna id_blacklabs alterada para UUID e função atualizada!' AS status;



















