# Consolidação de Dados - Tabela Mestre de Clientes

## Visão Geral

Sistema de consolidação inteligente que unifica dados de múltiplas fontes em uma tabela mestre (`clientes_mestre`), mantendo rastreabilidade, qualidade de dados e deduplicação.

---

## 1. Fontes de Dados

### 1.1 Tabelas de Origem

| Tabela | Tag | Registros | ID Externo | Qualidade | Atualização |
|--------|-----|-----------|------------|-----------|-------------|
| `leads` (SprintHub) | `sprinthub` | ~76k | `id_sprinthub` | Alta | Dinâmica (API) |
| `greatpage_leads` | `google` | ? | `id_greatpage` | Alta | Dinâmica |
| `blacklabs` | `blacklabs` | ? | `id_blacklabs` | Alta | Dinâmica |
| `prime_clientes` | `prime` | ? | `id_prime` | **Baixa** | Dinâmica |
| `oportunidade_sprint` | - | ~41k | - | Média | Dinâmica (enriquecimento) |
| `leads_exportados_sprinthub` | `sprinthub` | ~73k | - | Alta | **Estática (histórico)** |

### 1.2 Características das Fontes

#### SprintHub (`leads`)
- **Fonte primária** - CRM oficial
- Campos completos: nome, email, whatsapp, cpf, rg, endereço completo
- Atualização contínua via API
- ID numérico único

#### GreatPage (`greatpage_leads`)
- Leads do Google Ads
- Boa qualidade de dados
- Geralmente tem email e telefone

#### BlackLabs (`blacklabs`)
- Outra fonte de leads de qualidade
- Dados confiáveis

#### Prime (`prime_clientes`)
- **PROBLEMA DE QUALIDADE:**
  - Nomes frequentemente corrompidos: "..."
  - Telefones aparecem como nomes
  - Dados inconsistentes
- **SOLUÇÃO:**
  - Criar campo separado `nome_cliente_prime`
  - Não usar nome do Prime como prioritário
  - Usar Prime apenas para enriquecimento secundário

#### Oportunidades Sprint (`oportunidade_sprint`)
- Enriquece dados com: email, whatsapp, lead_id
- Não é fonte primária, apenas complementar
- Uso: Matching e enriquecimento

---

## 2. Estrutura da Tabela `clientes_mestre`

### 2.1 Schema SQL

```sql
CREATE TABLE IF NOT EXISTS api.clientes_mestre (
  -- Identificador único
  id BIGSERIAL PRIMARY KEY,
  chave_identificacao TEXT UNIQUE NOT NULL, -- CPF + telefone normalizado

  -- Foreign Keys (IDs das fontes)
  id_sprinthub BIGINT,
  id_prime BIGINT,
  id_greatpage BIGINT,
  id_blacklabs BIGINT,

  -- Dados Pessoais (prioridade: Sprint/Black/Great > Prime)
  nome_completo TEXT,
  nome_cliente_prime TEXT, -- Separado devido à baixa qualidade
  email TEXT,
  cpf TEXT,
  rg TEXT,
  data_nascimento DATE,
  sexo TEXT,

  -- Contatos (normalizado)
  whatsapp TEXT, -- Formato: apenas números (DDI+DDD+número)
  telefone TEXT,
  telefone_alternativo TEXT,

  -- Endereço Completo
  cep TEXT,
  endereco_rua TEXT,
  endereco_numero TEXT,
  endereco_complemento TEXT,
  bairro TEXT,
  cidade TEXT,
  estado TEXT,
  pais TEXT,

  -- Rastreamento de Origem
  origem_marcas TEXT[], -- Array: ['sprinthub', 'google', 'blacklabs', 'prime']

  -- Qualidade e Metadata
  qualidade_dados INTEGER, -- Score 0-100
  data_primeira_captura TIMESTAMP,
  data_ultima_atualizacao TIMESTAMP DEFAULT NOW(),
  sincronizado_em TIMESTAMP DEFAULT NOW(),

  -- Índices
  CONSTRAINT unique_cpf_telefone UNIQUE (cpf, whatsapp)
);

-- Índices para performance
CREATE INDEX idx_clientes_mestre_cpf ON api.clientes_mestre(cpf);
CREATE INDEX idx_clientes_mestre_whatsapp ON api.clientes_mestre(whatsapp);
CREATE INDEX idx_clientes_mestre_email ON api.clientes_mestre(email);
CREATE INDEX idx_clientes_mestre_id_sprinthub ON api.clientes_mestre(id_sprinthub);
CREATE INDEX idx_clientes_mestre_id_prime ON api.clientes_mestre(id_prime);
CREATE INDEX idx_clientes_mestre_origem_marcas ON api.clientes_mestre USING GIN(origem_marcas);
```

---

## 3. Lógica de Consolidação

### 3.1 Deduplicação - Chave Única

**Estratégia:** CPF + Telefone Normalizado

```javascript
// Normalização de telefone
function normalizarTelefone(tel) {
  if (!tel) return null;

  // Remove tudo exceto números
  let num = tel.replace(/\D/g, '');

  // Remove DDI 55 se presente
  if (num.startsWith('55')) num = num.substring(2);

  // Deve ter 10 ou 11 dígitos (DDD + número)
  if (num.length < 10 || num.length > 11) return null;

  return num;
}

// Gerar chave de identificação
function gerarChave(cpf, telefone) {
  const cpfNorm = cpf ? cpf.replace(/\D/g, '') : '';
  const telNorm = normalizarTelefone(telefone);

  // Prioridade: CPF + Tel > CPF > Tel
  if (cpfNorm && telNorm) return `CPF:${cpfNorm}|TEL:${telNorm}`;
  if (cpfNorm) return `CPF:${cpfNorm}`;
  if (telNorm) return `TEL:${telNorm}`;

  return null; // Registro sem chave única - criar novo
}
```

### 3.2 Hierarquia de Qualidade de Dados

**Prioridade por Campo:**

| Campo | Prioridade (maior → menor) |
|-------|---------------------------|
| Nome | Sprint → BlackLabs → GreatPage → Prime |
| Email | Sprint → GreatPage → BlackLabs → Prime |
| WhatsApp | Sprint → BlackLabs → GreatPage → Prime |
| CPF/RG | Sprint → BlackLabs → Prime |
| Endereço | Sprint → Prime → GreatPage |
| Data Nascimento | Sprint → Prime |

**Regra Especial - Nome do Prime:**
- NUNCA usar como nome principal
- Sempre salvar em `nome_cliente_prime` separadamente
- Detectar nomes ruins: `if (nome === '...' || /^\d+$/.test(nome))`

### 3.3 Score de Qualidade (0-100)

```javascript
function calcularQualidade(cliente) {
  let score = 0;

  // Campos essenciais (60 pontos)
  if (cliente.nome_completo && cliente.nome_completo !== '...') score += 20;
  if (cliente.whatsapp) score += 20;
  if (cliente.email) score += 20;

  // Documentos (20 pontos)
  if (cliente.cpf) score += 10;
  if (cliente.rg) score += 10;

  // Endereço completo (10 pontos)
  if (cliente.endereco_rua && cliente.cidade && cliente.estado) score += 10;

  // Data nascimento (5 pontos)
  if (cliente.data_nascimento) score += 5;

  // Sexo (5 pontos)
  if (cliente.sexo) score += 5;

  return score;
}
```

---

## 4. Processo de Consolidação

### 4.1 Algoritmo Passo a Passo

```
PARA CADA registro de cada fonte (Sprint, Great, Black, Prime):

  1. NORMALIZAR dados:
     - Telefone: remover DDI, DDD, formatar
     - CPF: apenas números
     - Nome: trim, uppercase primeira letra

  2. GERAR chave_identificacao:
     - CPF + Telefone normalizado

  3. BUSCAR na clientes_mestre:
     - Por chave_identificacao
     - OU por CPF
     - OU por email
     - OU por whatsapp normalizado

  4. SE cliente EXISTE:
     a. ADICIONAR tag à origem_marcas (se não existe)
     b. ATUALIZAR foreign key correspondente (id_sprinthub, id_prime, etc)
     c. MESCLAR dados usando hierarquia de qualidade:
        - Para cada campo vazio OU de fonte inferior:
          - Substituir por valor da fonte atual (se superior)
     d. RECALCULAR qualidade_dados
     e. ATUALIZAR data_ultima_atualizacao

  5. SENÃO (cliente NÃO existe):
     a. CRIAR novo registro
     b. DEFINIR origem_marcas = [tag_fonte]
     c. DEFINIR foreign key correspondente
     d. PREENCHER todos os campos disponíveis
     e. CALCULAR qualidade_dados
     f. DEFINIR data_primeira_captura = NOW()
```

### 4.2 Tratamento Especial - Prime

```javascript
function processarPrime(primeCliente, clienteMestre) {
  // SEMPRE salvar nome do Prime separadamente
  clienteMestre.nome_cliente_prime = primeCliente.nome;

  // Detectar nome ruim
  const nomeRuim = (
    !primeCliente.nome ||
    primeCliente.nome === '...' ||
    /^\d{8,}$/.test(primeCliente.nome) // Telefone como nome
  );

  // Só usar nome do Prime se:
  // 1. Não for ruim
  // 2. Cliente não tiver nome de fonte melhor
  if (!nomeRuim && !clienteMestre.nome_completo) {
    clienteMestre.nome_completo = primeCliente.nome;
  }

  // Outros campos: usar hierarquia normal
  // Endereço do Prime é geralmente bom
  if (!clienteMestre.endereco_rua && primeCliente.endereco) {
    clienteMestre.endereco_rua = primeCliente.endereco;
  }

  return clienteMestre;
}
```

---

## 5. Sincronização Dinâmica

### 5.1 Abordagens Possíveis

#### Opção A: Database Triggers (Recomendado para início)
- Triggers nas tabelas fonte (leads, prime_clientes, etc.)
- Executam função de consolidação automaticamente
- Vantagem: Tempo real, sem código externo
- Desvantagem: Pode impactar performance em bulk inserts

#### Opção B: Edge Functions Agendadas
- Cron job a cada X minutos
- Processa registros novos/atualizados desde última execução
- Vantagem: Controle fino, melhor para grandes volumes
- Desvantagem: Latência de alguns minutos

#### Opção C: Híbrida (RECOMENDADA)
- **Triggers** para updates individuais (tempo real)
- **Edge Function** para consolidação em lote a cada 5 minutos
- Melhor de ambos os mundos

### 5.2 Implementação - Trigger Example

```sql
-- Função de consolidação
CREATE OR REPLACE FUNCTION api.consolidar_cliente()
RETURNS TRIGGER AS $$
DECLARE
  v_chave TEXT;
  v_cliente RECORD;
BEGIN
  -- Gerar chave de identificação
  v_chave := api.gerar_chave_identificacao(NEW.cpf, NEW.whatsapp);

  -- Buscar cliente existente
  SELECT * INTO v_cliente
  FROM api.clientes_mestre
  WHERE chave_identificacao = v_chave
     OR cpf = NEW.cpf
     OR whatsapp = api.normalizar_telefone(NEW.whatsapp)
     OR email = NEW.email
  LIMIT 1;

  IF FOUND THEN
    -- Atualizar cliente existente
    UPDATE api.clientes_mestre SET
      -- Adicionar origem se não existe
      origem_marcas = ARRAY(
        SELECT DISTINCT unnest(origem_marcas || ARRAY[TG_ARGV[0]]::TEXT[])
      ),
      -- Atualizar foreign key
      id_sprinthub = CASE
        WHEN TG_ARGV[0] = 'sprinthub' THEN NEW.id
        ELSE id_sprinthub
      END,
      -- Mesclar dados com hierarquia...
      nome_completo = COALESCE(
        CASE WHEN TG_ARGV[0] IN ('sprinthub', 'blacklabs')
          THEN NEW.firstname || ' ' || NEW.lastname
        END,
        nome_completo
      ),
      -- ... outros campos
      data_ultima_atualizacao = NOW()
    WHERE id = v_cliente.id;
  ELSE
    -- Criar novo cliente
    INSERT INTO api.clientes_mestre (
      chave_identificacao, origem_marcas, id_sprinthub,
      nome_completo, email, whatsapp, cpf, ...
    ) VALUES (
      v_chave, ARRAY[TG_ARGV[0]]::TEXT[], NEW.id,
      NEW.firstname || ' ' || NEW.lastname, NEW.email, ...
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger na tabela leads
CREATE TRIGGER trigger_consolidar_leads
AFTER INSERT OR UPDATE ON api.leads
FOR EACH ROW
EXECUTE FUNCTION api.consolidar_cliente('sprinthub');

-- Triggers similares para outras tabelas...
```

---

## 6. Queries Úteis

### 6.1 Buscar Cliente Consolidado

```sql
-- Por ID de qualquer fonte
SELECT * FROM api.clientes_mestre
WHERE id_sprinthub = 12345
   OR id_prime = 67890;

-- Por CPF
SELECT * FROM api.clientes_mestre WHERE cpf = '12345678900';

-- Por WhatsApp (normalizado)
SELECT * FROM api.clientes_mestre
WHERE whatsapp = api.normalizar_telefone('(11) 98765-4321');

-- Clientes de múltiplas fontes
SELECT * FROM api.clientes_mestre
WHERE array_length(origem_marcas, 1) > 1;

-- Clientes de alta qualidade
SELECT * FROM api.clientes_mestre
WHERE qualidade_dados >= 80
ORDER BY qualidade_dados DESC;
```

### 6.2 Estatísticas

```sql
-- Distribuição por origem
SELECT
  origem,
  COUNT(*) as total
FROM api.clientes_mestre, unnest(origem_marcas) as origem
GROUP BY origem;

-- Qualidade média por origem
SELECT
  origem,
  AVG(qualidade_dados) as qualidade_media,
  COUNT(*) as total
FROM api.clientes_mestre, unnest(origem_marcas) as origem
GROUP BY origem;

-- Clientes com dados faltantes
SELECT
  COUNT(CASE WHEN nome_completo IS NULL THEN 1 END) as sem_nome,
  COUNT(CASE WHEN email IS NULL THEN 1 END) as sem_email,
  COUNT(CASE WHEN whatsapp IS NULL THEN 1 END) as sem_whatsapp,
  COUNT(CASE WHEN cpf IS NULL THEN 1 END) as sem_cpf
FROM api.clientes_mestre;
```

---

## 7. Plano de Implementação

### Fase 1: Preparação (Atual)
- [x] Documentar arquitetura completa
- [ ] Criar SQL para recriar tabela clientes_mestre
- [ ] Criar funções auxiliares (normalização, chave, qualidade)

### Fase 2: Estrutura Base
- [ ] Executar SQL de criação da tabela
- [ ] Criar índices
- [ ] Testar inserções manuais

### Fase 3: Script de Consolidação Inicial
- [ ] Criar script Node.js para consolidação em lote
- [ ] Processar leads (Sprint) - fonte primária
- [ ] Processar greatpage_leads
- [ ] Processar blacklabs
- [ ] Processar prime_clientes (com tratamento especial)
- [ ] Validar qualidade dos dados consolidados

### Fase 4: Sincronização Dinâmica
- [ ] Implementar triggers OU Edge Functions
- [ ] Testar atualização em tempo real
- [ ] Monitorar performance

### Fase 5: Manutenção e Evolução
- [ ] Dashboard de qualidade de dados
- [ ] Processo de limpeza de duplicados
- [ ] Enriquecimento com oportunidade_sprint

---

## 8. Problemas Conhecidos e Soluções

### Problema 1: Nomes do Prime
**Sintoma:** Nomes como "...", telefones como nomes
**Solução:** Campo separado `nome_cliente_prime`, validação antes de usar

### Problema 2: Telefones em Formatos Diversos
**Sintoma:** +55, (11), 11 9, etc.
**Solução:** Função de normalização rigorosa, sempre remover DDI

### Problema 3: Duplicados com Pequenas Variações
**Sintoma:** Mesmo cliente com telefones levemente diferentes
**Solução:**
- Buscar por múltiplos critérios (CPF OU email OU tel)
- Matching fuzzy se necessário

### Problema 4: Performance em Bulk Inserts
**Sintoma:** Triggers lentos ao inserir milhares de registros
**Solução:**
- Desabilitar triggers temporariamente
- Rodar consolidação em lote via script
- Reativar triggers após

---

## 9. Monitoramento

### Métricas Importantes
- Total de clientes consolidados
- Distribuição por origem
- Qualidade média dos dados
- Taxa de deduplicação (quanto % são clientes únicos)
- Clientes com múltiplas origens
- Campos faltantes por categoria

### Alertas
- Queda súbita na qualidade média
- Aumento anormal de duplicados
- Falha em triggers/sincronização
- Clientes sem nenhuma origem marcada

---

## 10. Continuidade

Este documento deve ser atualizado sempre que:
- Novas fontes de dados forem adicionadas
- Regras de qualidade mudarem
- Problemas de dados forem identificados
- Schema da tabela for alterado

**Última atualização:** 2025-10-25
**Responsável:** Sistema de IA Claude Code
**Próxima revisão:** Após implementação completa
