# 📖 Guia Completo - Sistema de Consolidação

## ✅ O Que Foi Criado

### 1. **Sistema de Consolidação Automática** (Triggers)
Sempre que você adicionar ou atualizar dados em qualquer tabela de origem, a tabela `clientes_mestre` será atualizada automaticamente.

### 2. **Views SQL para Relatórios**
Consultas sempre atualizadas com estatísticas da base.

### 3. **Script de Relatórios Práticos**
Ferramenta de linha de comando para visualizar dados rapidamente.

---

## 🚀 Como Usar

### PASSO 1: Ativar Consolidação Automática

Execute este SQL **UMA VEZ** no Supabase SQL Editor:

```sql
-- Copiar e executar todo o conteúdo do arquivo:
-- CONSOLIDACAO_DADOS/03-triggers-consolidacao-automatica.sql
```

**O que isso faz:**
- Cria triggers nas 4 tabelas de origem (leads, greatpage_leads, blacklabs, prime_clientes)
- A partir de agora, qualquer INSERT ou UPDATE nessas tabelas atualiza automaticamente `clientes_mestre`
- Funciona em TEMPO REAL!

---

### PASSO 2: Criar Views de Relatórios

Execute este SQL **UMA VEZ** no Supabase SQL Editor:

```sql
-- Copiar e executar todo o conteúdo do arquivo:
-- CONSOLIDACAO_DADOS/04-views-relatorios.sql
```

**O que isso cria:**
- `stats_completude_dados` - Quantos clientes têm cada campo
- `stats_por_origem` - Distribuição por origem
- `clientes_apenas_sprint` - Clientes só no Sprint (para adicionar no Prime)
- `clientes_apenas_prime` - Clientes só no Prime (para adicionar no Sprint)
- `dashboard_principal` - Dashboard completo
- `stats_qualidade_por_origem` - Qualidade por origem

---

### PASSO 3: Usar os Relatórios

#### Via SQL (Supabase SQL Editor)

```sql
-- Dashboard completo
SELECT * FROM api.dashboard_principal;

-- Estatísticas de completude
SELECT * FROM api.stats_completude_dados;

-- Análise Sprint vs Prime
SELECT * FROM api.stats_por_origem;

-- Lista de clientes apenas no Sprint (adicionar no Prime)
SELECT * FROM api.clientes_apenas_sprint LIMIT 100;

-- Lista de clientes apenas no Prime (adicionar no Sprint)
SELECT * FROM api.clientes_apenas_prime LIMIT 100;

-- Qualidade por origem
SELECT * FROM api.stats_qualidade_por_origem;
```

#### Via Script Node.js (Terminal)

```bash
# Dashboard completo
node relatorios-clientes.cjs

# Completude dos dados
node relatorios-clientes.cjs completude

# Análise de origens
node relatorios-clientes.cjs origens

# Lista clientes apenas no Sprint (50 primeiros)
node relatorios-clientes.cjs apenas-sprint

# Lista clientes apenas no Prime (50 primeiros)
node relatorios-clientes.cjs apenas-prime

# Exportar para CSV (todos)
node relatorios-clientes.cjs exportar-sprint
node relatorios-clientes.cjs exportar-prime
```

---

## 📊 Relatórios Disponíveis

### 1. Dashboard Principal
```bash
node relatorios-clientes.cjs
```

**Mostra:**
- Total de clientes
- Quantos têm email, whatsapp, CPF, etc.
- Quantos têm dados 100% completos
- Distribuição por origem
- Clientes apenas no Sprint (para adicionar no Prime)
- Clientes apenas no Prime (para adicionar no Sprint)

### 2. Completude dos Dados
```bash
node relatorios-clientes.cjs completude
```

**Mostra:**
- Quantos clientes têm **nome**
- Quantos clientes têm **email**
- Quantos clientes têm **WhatsApp**
- Quantos clientes têm **telefone**
- Quantos clientes têm **CPF**
- Quantos clientes têm **data de nascimento**
- Quantos clientes têm **endereço completo**
- Quantos clientes têm **TODOS os dados completos**

### 3. Análise Sprint vs Prime
```bash
node relatorios-clientes.cjs origens
```

**Mostra:**
- Quantos clientes estão no SprintHub
- Quantos clientes estão no Prime
- Quantos estão em ambos
- **Quantos estão APENAS no Sprint** (candidatos a adicionar no Prime)
- **Quantos estão APENAS no Prime** (candidatos a adicionar no Sprint)

### 4. Lista para Adicionar no Prime
```bash
node relatorios-clientes.cjs apenas-sprint
```

**Mostra:**
- Lista dos 50 primeiros clientes que estão no Sprint mas NÃO no Prime
- Ordenados por qualidade de dados
- Com: ID, ID Sprint, Nome, Email, WhatsApp, CPF, Qualidade

**Exportar todos para CSV:**
```bash
node relatorios-clientes.cjs exportar-sprint
# Cria arquivo: clientes_apenas_sprint_2025-10-25.csv
```

### 5. Lista para Adicionar no Sprint
```bash
node relatorios-clientes.cjs apenas-prime
```

**Mostra:**
- Lista dos 50 primeiros clientes que estão no Prime mas NÃO no Sprint
- Ordenados por qualidade de dados
- Com: ID, ID Prime, Nome, Email, WhatsApp, CPF, Qualidade

**Exportar todos para CSV:**
```bash
node relatorios-clientes.cjs exportar-prime
# Cria arquivo: clientes_apenas_prime_2025-10-25.csv
```

---

## 🔄 Como a Consolidação Automática Funciona

### Quando Dados São Atualizados

**Exemplo 1: Novo lead no SprintHub**
```sql
INSERT INTO api.leads (firstname, lastname, email, whatsapp)
VALUES ('João', 'Silva', 'joao@email.com', '11987654321');
```

**O que acontece automaticamente:**
1. Trigger detecta o novo lead
2. Busca se cliente já existe em `clientes_mestre` (por CPF, email ou WhatsApp)
3. Se NÃO existe: cria novo cliente
4. Se existe: atualiza dados (merge inteligente)
5. Adiciona tag "sprinthub" ao array `origem_marcas`
6. Salva `id_sprinthub`
7. Recalcula qualidade dos dados

**Exemplo 2: Atualizar email no Prime**
```sql
UPDATE api.prime_clientes
SET email = 'novoemail@teste.com'
WHERE id = 123;
```

**O que acontece automaticamente:**
1. Trigger detecta a atualização
2. Busca cliente correspondente em `clientes_mestre`
3. Atualiza email
4. Recalcula qualidade
5. Atualiza `data_ultima_atualizacao`

---

## 📈 Queries SQL Úteis

### Encontrar Cliente Específico
```sql
-- Por nome
SELECT * FROM api.clientes_mestre
WHERE nome_completo ILIKE '%João Silva%';

-- Por email
SELECT * FROM api.clientes_mestre
WHERE email = 'joao@email.com';

-- Por WhatsApp
SELECT * FROM api.clientes_mestre
WHERE whatsapp = '11987654321';

-- Por CPF
SELECT * FROM api.clientes_mestre
WHERE cpf = '12345678900';
```

### Clientes de Alta Qualidade
```sql
SELECT
  nome_completo,
  email,
  whatsapp,
  origem_marcas,
  qualidade_dados
FROM api.clientes_mestre
WHERE qualidade_dados >= 80
ORDER BY qualidade_dados DESC
LIMIT 100;
```

### Clientes com Dados Faltantes
```sql
-- Sem email
SELECT count(*) FROM api.clientes_mestre
WHERE email IS NULL OR email = '';

-- Sem WhatsApp
SELECT count(*) FROM api.clientes_mestre
WHERE whatsapp IS NULL OR whatsapp = '';

-- Sem CPF
SELECT count(*) FROM api.clientes_mestre
WHERE cpf IS NULL OR cpf = '';
```

### Clientes de Múltiplas Origens (Deduplicados)
```sql
SELECT
  nome_completo,
  email,
  origem_marcas,
  array_length(origem_marcas, 1) as num_origens
FROM api.clientes_mestre
WHERE array_length(origem_marcas, 1) > 1
ORDER BY num_origens DESC;
```

### Exportar Clientes Apenas Sprint para Importar no Prime
```sql
SELECT
  nome_completo as nome,
  email,
  whatsapp as telefone,
  cpf,
  data_nascimento,
  endereco_rua,
  cidade,
  estado
FROM api.clientes_apenas_sprint
WHERE qualidade_dados >= 60  -- Só clientes de boa qualidade
ORDER BY qualidade_dados DESC;
```

---

## 🎯 Casos de Uso Práticos

### 1. "Quantos clientes têm WhatsApp?"
```bash
node relatorios-clientes.cjs completude
# Busque a linha "WhatsApp"
```

Ou via SQL:
```sql
SELECT
  COUNT(CASE WHEN whatsapp IS NOT NULL AND whatsapp != '' THEN 1 END) as com_whatsapp,
  COUNT(*) as total,
  ROUND(COUNT(CASE WHEN whatsapp IS NOT NULL AND whatsapp != '' THEN 1 END)::NUMERIC / COUNT(*) * 100, 1) as percentual
FROM api.clientes_mestre;
```

### 2. "Quero adicionar no Prime os clientes que só estão no Sprint"
```bash
# Ver lista
node relatorios-clientes.cjs apenas-sprint

# Exportar para CSV
node relatorios-clientes.cjs exportar-sprint

# Importar o CSV no Prime manualmente
# Ou usar API do Prime se disponível
```

### 3. "Quantos clientes têm TODOS os dados completos?"
```bash
node relatorios-clientes.cjs completude
# Busque a linha "Dados 100% Completos"
```

### 4. "Monitorar qualidade dos dados semanalmente"
```sql
-- Salvar como query favorita no Supabase
SELECT * FROM api.dashboard_principal;
```

---

## 🔧 Manutenção

### Reprocessar Todos os Dados (Se Necessário)
```bash
# Se precisar reprocessar tudo do zero
node consolidar-clientes.cjs
```

### Verificar se Triggers Estão Ativos
```sql
SELECT
  trigger_name,
  event_manipulation,
  event_object_table
FROM information_schema.triggers
WHERE trigger_schema = 'api'
  AND trigger_name LIKE 'trigger_consolidar%';
```

Deve mostrar:
- trigger_consolidar_leads
- trigger_consolidar_greatpage
- trigger_consolidar_blacklabs
- trigger_consolidar_prime

### Desabilitar Triggers Temporariamente (Para Bulk Import)
```sql
-- Desabilitar
ALTER TABLE api.leads DISABLE TRIGGER trigger_consolidar_leads;
ALTER TABLE api.prime_clientes DISABLE TRIGGER trigger_consolidar_prime;

-- Fazer import em massa...

-- Reabilitar
ALTER TABLE api.leads ENABLE TRIGGER trigger_consolidar_leads;
ALTER TABLE api.prime_clientes ENABLE TRIGGER trigger_consolidar_prime;

-- Reprocessar manualmente
-- node consolidar-clientes.cjs
```

---

## 📂 Arquivos Criados

```
CONSOLIDACAO_DADOS/
├── README.md                               - Documentação completa da arquitetura
├── 01-criar-tabela-clientes-mestre.sql     - Criação da tabela e funções
├── 02-script-consolidacao-template.cjs     - Template do script de consolidação
├── 03-triggers-consolidacao-automatica.sql - ⭐ Triggers para consolidação automática
├── 04-views-relatorios.sql                 - ⭐ Views para relatórios
├── RESUMO_STATUS.md                        - Status e próximos passos
└── GUIA_USO_COMPLETO.md                    - Este arquivo

Raiz do projeto:
├── consolidar-clientes.cjs                 - Script de consolidação manual
├── relatorios-clientes.cjs                 - ⭐ Script de relatórios práticos
├── CHECKPOINT_CONSOLIDACAO.md              - Checkpoint de continuidade
└── PROXIMOS_PASSOS.md                      - Próximos passos pós-consolidação
```

---

## 🎓 Resumo

**Para ter sempre os números atualizados:**

1. **Execute UMA VEZ:**
   - `03-triggers-consolidacao-automatica.sql` (ativa consolidação automática)
   - `04-views-relatorios.sql` (cria views de relatórios)

2. **Use sempre que quiser ver os dados:**
   ```bash
   node relatorios-clientes.cjs                # Dashboard completo
   node relatorios-clientes.cjs origens        # Sprint vs Prime
   node relatorios-clientes.cjs apenas-sprint  # Lista para adicionar no Prime
   node relatorios-clientes.cjs exportar-prime # Exportar CSV
   ```

3. **Dados sempre atualizados:**
   - Triggers garantem que `clientes_mestre` está sempre sincronizada
   - Views SQL calculam estatísticas em tempo real
   - Não precisa rodar nada manualmente!

---

**Última atualização:** 2025-10-25
**Responsável:** Sistema de Consolidação Automática
