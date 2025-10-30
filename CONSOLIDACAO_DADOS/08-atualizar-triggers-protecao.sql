-- ============================================================================
-- ATUALIZAR TRIGGERS PARA RESPEITAR CAMPOS PROTEGIDOS
-- ============================================================================
-- Atualiza a função consolidar_cliente_automatico() para verificar proteções
-- antes de sobrescrever campos editados manualmente
-- ============================================================================

CREATE OR REPLACE FUNCTION api.consolidar_cliente_automatico()
RETURNS TRIGGER AS $$
DECLARE
  v_chave TEXT;
  v_cliente RECORD;
  v_fonte TEXT;
  v_fk_column TEXT;
  v_tag TEXT;
  v_dados_normalizados JSONB;
  v_cliente_id INTEGER;
BEGIN
  -- Determinar fonte e configurações baseado na tabela
  CASE TG_TABLE_NAME
    WHEN 'leads' THEN
      v_fonte := 'sprinthub';
      v_fk_column := 'id_sprinthub';
      v_tag := 'sprinthub';

      -- Normalizar dados do SprintHub
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

  -- Buscar cliente existente
  SELECT * INTO v_cliente
  FROM api.clientes_mestre
  WHERE chave_identificacao = v_chave
     OR (cpf IS NOT NULL AND cpf = v_dados_normalizados->>'cpf')
     OR (email IS NOT NULL AND email = v_dados_normalizados->>'email')
     OR (whatsapp IS NOT NULL AND whatsapp = v_dados_normalizados->>'whatsapp')
  LIMIT 1;

  IF FOUND THEN
    v_cliente_id := v_cliente.id;

    -- ATUALIZAR cliente existente RESPEITANDO CAMPOS PROTEGIDOS
    UPDATE api.clientes_mestre SET
      -- Adicionar origem se não existe
      origem_marcas = ARRAY(
        SELECT DISTINCT unnest(
          COALESCE(origem_marcas, ARRAY[]::TEXT[]) || ARRAY[v_tag]::TEXT[]
        )
      ),

      -- Atualizar foreign key
      id_sprinthub = CASE WHEN v_fk_column = 'id_sprinthub' THEN NEW.id::BIGINT ELSE id_sprinthub END,
      id_greatpage = CASE WHEN v_fk_column = 'id_greatpage' THEN NEW.id::BIGINT ELSE id_greatpage END,
      id_blacklabs = CASE WHEN v_fk_column = 'id_blacklabs' THEN NEW.id::BIGINT ELSE id_blacklabs END,
      id_prime = CASE WHEN v_fk_column = 'id_prime' THEN NEW.id::BIGINT ELSE id_prime END,

      -- ===== CAMPOS COM PROTEÇÃO =====
      nome_completo = CASE
        WHEN api.campo_esta_protegido(v_cliente_id, 'nome_completo') THEN nome_completo
        WHEN v_fonte IN ('sprinthub', 'prime')
          THEN COALESCE(NULLIF(v_dados_normalizados->>'nome_completo', ''), nome_completo)
        ELSE COALESCE(nome_completo, NULLIF(v_dados_normalizados->>'nome_completo', ''))
      END,

      nome_cliente_prime = CASE
        WHEN v_fonte = 'prime' THEN v_dados_normalizados->>'nome_completo'
        ELSE nome_cliente_prime
      END,

      email = CASE
        WHEN api.campo_esta_protegido(v_cliente_id, 'email') THEN email
        WHEN v_fonte IN ('sprinthub', 'prime')
          THEN COALESCE(NULLIF(v_dados_normalizados->>'email', ''), email)
        ELSE COALESCE(email, NULLIF(v_dados_normalizados->>'email', ''))
      END,

      whatsapp = CASE
        WHEN api.campo_esta_protegido(v_cliente_id, 'whatsapp') THEN whatsapp
        WHEN v_fonte IN ('sprinthub', 'prime')
          THEN COALESCE(NULLIF(v_dados_normalizados->>'whatsapp', ''), whatsapp)
        ELSE COALESCE(whatsapp, NULLIF(v_dados_normalizados->>'whatsapp', ''))
      END,

      telefone = CASE
        WHEN api.campo_esta_protegido(v_cliente_id, 'telefone') THEN telefone
        WHEN v_fonte IN ('sprinthub', 'prime')
          THEN COALESCE(NULLIF(v_dados_normalizados->>'telefone', ''), telefone)
        ELSE COALESCE(telefone, NULLIF(v_dados_normalizados->>'telefone', ''))
      END,

      cpf = CASE
        WHEN api.campo_esta_protegido(v_cliente_id, 'cpf') THEN cpf
        WHEN v_fonte IN ('sprinthub', 'prime')
          THEN COALESCE(NULLIF(v_dados_normalizados->>'cpf', ''), cpf)
        ELSE COALESCE(cpf, NULLIF(v_dados_normalizados->>'cpf', ''))
      END,

      rg = CASE
        WHEN api.campo_esta_protegido(v_cliente_id, 'rg') THEN rg
        WHEN v_fonte IN ('sprinthub', 'prime')
          THEN COALESCE(NULLIF(v_dados_normalizados->>'rg', ''), rg)
        ELSE COALESCE(rg, NULLIF(v_dados_normalizados->>'rg', ''))
      END,

      data_nascimento = CASE
        WHEN api.campo_esta_protegido(v_cliente_id, 'data_nascimento') THEN data_nascimento
        WHEN v_fonte IN ('sprinthub', 'prime')
          THEN COALESCE((v_dados_normalizados->>'data_nascimento')::DATE, data_nascimento)
        ELSE COALESCE(data_nascimento, (v_dados_normalizados->>'data_nascimento')::DATE)
      END,

      sexo = CASE
        WHEN api.campo_esta_protegido(v_cliente_id, 'sexo') THEN sexo
        WHEN v_fonte IN ('sprinthub', 'prime')
          THEN COALESCE(NULLIF(v_dados_normalizados->>'sexo', ''), sexo)
        ELSE COALESCE(sexo, NULLIF(v_dados_normalizados->>'sexo', ''))
      END,

      endereco_rua = CASE
        WHEN api.campo_esta_protegido(v_cliente_id, 'endereco_rua') THEN endereco_rua
        WHEN v_fonte IN ('sprinthub', 'prime')
          THEN COALESCE(NULLIF(v_dados_normalizados->>'endereco_rua', ''), endereco_rua)
        ELSE COALESCE(endereco_rua, NULLIF(v_dados_normalizados->>'endereco_rua', ''))
      END,

      endereco_numero = CASE
        WHEN api.campo_esta_protegido(v_cliente_id, 'endereco_numero') THEN endereco_numero
        WHEN v_fonte IN ('sprinthub', 'prime')
          THEN COALESCE(NULLIF(v_dados_normalizados->>'endereco_numero', ''), endereco_numero)
        ELSE COALESCE(endereco_numero, NULLIF(v_dados_normalizados->>'endereco_numero', ''))
      END,

      endereco_complemento = CASE
        WHEN api.campo_esta_protegido(v_cliente_id, 'endereco_complemento') THEN endereco_complemento
        WHEN v_fonte IN ('sprinthub', 'prime')
          THEN COALESCE(NULLIF(v_dados_normalizados->>'endereco_complemento', ''), endereco_complemento)
        ELSE COALESCE(endereco_complemento, NULLIF(v_dados_normalizados->>'endereco_complemento', ''))
      END,

      bairro = CASE
        WHEN api.campo_esta_protegido(v_cliente_id, 'bairro') THEN bairro
        WHEN v_fonte IN ('sprinthub', 'prime')
          THEN COALESCE(NULLIF(v_dados_normalizados->>'bairro', ''), bairro)
        ELSE COALESCE(bairro, NULLIF(v_dados_normalizados->>'bairro', ''))
      END,

      cidade = CASE
        WHEN api.campo_esta_protegido(v_cliente_id, 'cidade') THEN cidade
        WHEN v_fonte IN ('sprinthub', 'prime')
          THEN COALESCE(NULLIF(v_dados_normalizados->>'cidade', ''), cidade)
        ELSE COALESCE(cidade, NULLIF(v_dados_normalizados->>'cidade', ''))
      END,

      estado = CASE
        WHEN api.campo_esta_protegido(v_cliente_id, 'estado') THEN estado
        WHEN v_fonte IN ('sprinthub', 'prime')
          THEN COALESCE(NULLIF(v_dados_normalizados->>'estado', ''), estado)
        ELSE COALESCE(estado, NULLIF(v_dados_normalizados->>'estado', ''))
      END,

      cep = CASE
        WHEN api.campo_esta_protegido(v_cliente_id, 'cep') THEN cep
        WHEN v_fonte IN ('sprinthub', 'prime')
          THEN COALESCE(NULLIF(v_dados_normalizados->>'cep', ''), cep)
        ELSE COALESCE(cep, NULLIF(v_dados_normalizados->>'cep', ''))
      END,

      -- Metadata
      data_ultima_atualizacao = NOW(),
      sincronizado_em = NOW(),

      -- Recalcular qualidade
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
      ),
      chave_identificacao = v_chave

    WHERE id = v_cliente.id;

  ELSE
    -- INSERIR novo cliente (sem proteção, é novo)
    INSERT INTO api.clientes_mestre (
      chave_identificacao,
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
      origem_marcas,
      id_sprinthub,
      id_greatpage,
      id_blacklabs,
      id_prime,
      qualidade_dados,
      data_criacao,
      data_ultima_atualizacao,
      sincronizado_em
    ) VALUES (
      v_chave,
      v_dados_normalizados->>'nome_completo',
      CASE WHEN v_fonte = 'prime' THEN v_dados_normalizados->>'nome_completo' ELSE NULL END,
      v_dados_normalizados->>'email',
      v_dados_normalizados->>'whatsapp',
      v_dados_normalizados->>'telefone',
      v_dados_normalizados->>'cpf',
      v_dados_normalizados->>'rg',
      (v_dados_normalizados->>'data_nascimento')::DATE,
      v_dados_normalizados->>'sexo',
      v_dados_normalizados->>'endereco_rua',
      v_dados_normalizados->>'endereco_numero',
      v_dados_normalizados->>'endereco_complemento',
      v_dados_normalizados->>'bairro',
      v_dados_normalizados->>'cidade',
      v_dados_normalizados->>'estado',
      v_dados_normalizados->>'cep',
      ARRAY[v_tag]::TEXT[],
      CASE WHEN v_fk_column = 'id_sprinthub' THEN NEW.id::BIGINT ELSE NULL END,
      CASE WHEN v_fk_column = 'id_greatpage' THEN NEW.id::BIGINT ELSE NULL END,
      CASE WHEN v_fk_column = 'id_blacklabs' THEN NEW.id::BIGINT ELSE NULL END,
      CASE WHEN v_fk_column = 'id_prime' THEN NEW.id::BIGINT ELSE NULL END,
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
      ),
      NOW(),
      NOW(),
      NOW()
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Comentário
COMMENT ON FUNCTION api.consolidar_cliente_automatico IS
'Consolida dados RESPEITANDO campos protegidos editados manualmente.
Versão atualizada: campos em api.campos_protegidos não serão sobrescritos.';

-- Mensagem
DO $$
BEGIN
  RAISE NOTICE '✅ Triggers atualizadas para respeitar campos protegidos!';
  RAISE NOTICE '🛡️ Campos editados manualmente não serão mais sobrescritos';
END $$;
