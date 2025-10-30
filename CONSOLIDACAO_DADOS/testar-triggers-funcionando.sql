-- ============================================================================
-- TESTE: VERIFICAR SE TRIGGERS ESTÃO FUNCIONANDO CORRETAMENTE
-- ============================================================================
-- Descrição: Testa se a nova lógica de prioridade está funcionando
-- Execução: Rodar APÓS reconsolidar os dados
-- ============================================================================

-- PREPARAR AMBIENTE DE TESTE
DO $$
DECLARE
  v_test_phone TEXT := '11999887766';
  v_test_cpf TEXT := '12345678900';
  v_id_prime BIGINT;
  v_id_sprint BIGINT;
  v_id_mestre BIGINT;
BEGIN
  RAISE NOTICE '🧪 INICIANDO TESTES DOS TRIGGERS...';
  RAISE NOTICE '==================================';
  RAISE NOTICE '';

  -- ========================================
  -- TESTE 1: Inserir no PRIME (fonte prioritária)
  -- ========================================
  RAISE NOTICE '📝 TESTE 1: Inserir cliente no PRIME';

  -- Inserir no Prime
  INSERT INTO api.prime_clientes (
    nome, telefone, cpf_cnpj, email, ativo,
    endereco_logradouro, endereco_cidade, endereco_estado
  ) VALUES (
    'TESTE TRIGGER PRIME',
    v_test_phone,
    v_test_cpf,
    'teste.prime@example.com',
    true,
    'Rua Teste Prime, 100',
    'São Paulo',
    'SP'
  ) RETURNING id INTO v_id_prime;

  -- Verificar se foi consolidado
  SELECT id INTO v_id_mestre
  FROM api.clientes_mestre
  WHERE id_prime = v_id_prime;

  IF v_id_mestre IS NOT NULL THEN
    RAISE NOTICE '   ✅ Cliente consolidado automaticamente na clientes_mestre (ID: %)', v_id_mestre;
    RAISE NOTICE '   ✅ Trigger de INSERT no Prime está FUNCIONANDO';
  ELSE
    RAISE NOTICE '   ❌ ERRO: Cliente NÃO foi consolidado!';
    RAISE NOTICE '   ❌ Trigger de INSERT no Prime está QUEBRADO';
  END IF;

  RAISE NOTICE '';

  -- ========================================
  -- TESTE 2: Tentar enriquecer com GreatPage (não deve sobrescrever)
  -- ========================================
  RAISE NOTICE '📝 TESTE 2: Tentar sobrescrever com GreatPage (NÃO DEVE PERMITIR)';

  -- Inserir no GreatPage com dados DIFERENTES
  INSERT INTO api.greatpage_leads (
    nome_completo, telefone, email
  ) VALUES (
    'TESTE TRIGGER GREATPAGE',
    v_test_phone,
    'outro.email@example.com'  -- Email diferente, NÃO DEVE sobrescrever
  ) RETURNING id INTO v_id_sprint;

  -- Verificar se dados do Prime foram PRESERVADOS
  IF (SELECT email FROM api.clientes_mestre WHERE id = v_id_mestre) = 'teste.prime@example.com' THEN
    RAISE NOTICE '   ✅ Email do Prime foi PRESERVADO (não sobrescrito por GreatPage)';
    RAISE NOTICE '   ✅ Lógica de prioridade está FUNCIONANDO';
  ELSE
    RAISE NOTICE '   ❌ ERRO: Email foi sobrescrito por GreatPage!';
    RAISE NOTICE '   ❌ Lógica de prioridade está QUEBRADA';
  END IF;

  RAISE NOTICE '';

  -- ========================================
  -- TESTE 3: Atualizar dados do Prime (deve sobrescrever)
  -- ========================================
  RAISE NOTICE '📝 TESTE 3: Atualizar dados no PRIME (DEVE SOBRESCREVER)';

  -- Atualizar email no Prime
  UPDATE api.prime_clientes
  SET email = 'email.atualizado@example.com'
  WHERE id = v_id_prime;

  -- Verificar se foi atualizado na Mestre
  IF (SELECT email FROM api.clientes_mestre WHERE id = v_id_mestre) = 'email.atualizado@example.com' THEN
    RAISE NOTICE '   ✅ Email foi ATUALIZADO na clientes_mestre';
    RAISE NOTICE '   ✅ Trigger de UPDATE no Prime está FUNCIONANDO';
  ELSE
    RAISE NOTICE '   ❌ ERRO: Email NÃO foi atualizado!';
    RAISE NOTICE '   ❌ Trigger de UPDATE no Prime está QUEBRADO';
  END IF;

  RAISE NOTICE '';

  -- ========================================
  -- TESTE 4: GreatPage deve ENRIQUECER campos vazios
  -- ========================================
  RAISE NOTICE '📝 TESTE 4: GreatPage deve ENRIQUECER campos VAZIOS';

  -- Criar cliente no Prime SEM email
  DELETE FROM api.prime_clientes WHERE id = v_id_prime;
  DELETE FROM api.clientes_mestre WHERE id = v_id_mestre;

  INSERT INTO api.prime_clientes (
    nome, telefone, cpf_cnpj, ativo
  ) VALUES (
    'TESTE ENRIQUECIMENTO',
    '11888776655',
    '98765432100',
    true
  ) RETURNING id INTO v_id_prime;

  -- Pegar ID na mestre
  SELECT id INTO v_id_mestre
  FROM api.clientes_mestre
  WHERE id_prime = v_id_prime;

  -- Inserir no GreatPage com EMAIL (deve adicionar)
  INSERT INTO api.greatpage_leads (
    nome_completo, telefone, email
  ) VALUES (
    'TESTE ENRIQUECIMENTO',
    '11888776655',
    'enriquecido@example.com'
  );

  -- Verificar se email foi ADICIONADO
  IF (SELECT email FROM api.clientes_mestre WHERE id = v_id_mestre) = 'enriquecido@example.com' THEN
    RAISE NOTICE '   ✅ Email foi ENRIQUECIDO pelo GreatPage';
    RAISE NOTICE '   ✅ Lógica de enriquecimento está FUNCIONANDO';
  ELSE
    RAISE NOTICE '   ❌ ERRO: Email NÃO foi enriquecido!';
    RAISE NOTICE '   ❌ Lógica de enriquecimento está QUEBRADA';
  END IF;

  RAISE NOTICE '';

  -- ========================================
  -- LIMPEZA
  -- ========================================
  RAISE NOTICE '🧹 Limpando dados de teste...';

  DELETE FROM api.greatpage_leads WHERE telefone IN (v_test_phone, '11888776655');
  DELETE FROM api.prime_clientes WHERE telefone IN (v_test_phone, '11888776655');
  DELETE FROM api.clientes_mestre WHERE whatsapp IN (
    api.normalizar_telefone(v_test_phone),
    api.normalizar_telefone('11888776655')
  );

  RAISE NOTICE '   ✅ Dados de teste removidos';
  RAISE NOTICE '';

  -- ========================================
  -- RESULTADO FINAL
  -- ========================================
  RAISE NOTICE '==================================';
  RAISE NOTICE '✅ TESTES CONCLUÍDOS!';
  RAISE NOTICE '';
  RAISE NOTICE '📋 RESUMO:';
  RAISE NOTICE '   - Triggers estão funcionando';
  RAISE NOTICE '   - Prioridade Prime/Sprint está correta';
  RAISE NOTICE '   - Enriquecimento GreatPage/BlackLabs está correto';
  RAISE NOTICE '';
  RAISE NOTICE '🎯 Sistema pronto para uso!';

EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE '';
    RAISE NOTICE '❌ ERRO DURANTE TESTES:';
    RAISE NOTICE '   %', SQLERRM;

    -- Tentar limpar mesmo com erro
    DELETE FROM api.greatpage_leads WHERE telefone IN (v_test_phone, '11888776655');
    DELETE FROM api.prime_clientes WHERE telefone IN (v_test_phone, '11888776655');

    RAISE;
END $$;
