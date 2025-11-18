# 📚 Guia Completo: Estrutura do Projeto e Comandos Reutilizáveis

## 📁 Estrutura do Projeto - Para Que Serve Cada Pasta

### 🏠 **Raiz do Projeto** (`/`)
**Propósito:** Contém apenas arquivos essenciais do projeto
- `package.json` - Dependências e scripts do Node.js
- `vite.config.js` - Configuração do bundler Vite
- `eslint.config.js` - Regras de linting
- `index.html` - Ponto de entrada da aplicação
- `api-sync-leads.js` - **API PRINCIPAL** de sincronização de leads
- `api-sync-opportunities.js` - **API PRINCIPAL** de sincronização de oportunidades
- `.env.example` - Template de variáveis de ambiente
- `README.md` - Documentação principal

**⚠️ IMPORTANTE:** Não adicione arquivos aqui! Use as pastas apropriadas.

---

### 📜 **`scripts/`** - Scripts Utilitários e Ferramentas
**Propósito:** Scripts de análise, debug, teste, consolidação e importação de dados

**Conteúdo:**
- Scripts `.cjs` e `.js` de utilitários
- Scripts de análise de dados (`analyze-*.cjs`)
- Scripts de debug (`debug-*.cjs`)
- Scripts de teste (`test-*.cjs`)
- Scripts de sincronização antigos/experimentais
- Scripts de consolidação (`consolidate-*.cjs`)
- Scripts de importação (`import-*.cjs`)
- Scripts PowerShell (`.ps1`)

**Quando usar:** Para scripts que analisam, testam ou processam dados localmente

**Exemplos:**
- `scripts/analyze-leads-data.cjs` - Analisa dados de leads
- `scripts/debug-sprinthub-data.cjs` - Debug de dados do SprintHub
- `scripts/test-sync-50-leads.cjs` - Testa sincronização

---

### 🚀 **`scripts-deploy/`** - Scripts de Deploy e Configuração
**Propósito:** Scripts para fazer deploy, configurar serviços e ambientes

**Conteúdo:**
- Scripts shell (`.sh`) de deploy
- Scripts batch (`.bat`) de build
- Scripts de configuração de serviços (N8N, Chatwoot, etc.)
- Scripts de diagnóstico e verificação

**Quando usar:** Para scripts que fazem deploy, configuram serviços ou verificam ambientes

**Exemplos:**
- `scripts-deploy/deploy-vps.sh` - Deploy na VPS
- `scripts-deploy/setup-chatwoot.sh` - Configura Chatwoot
- `scripts-deploy/verify-deploy.sh` - Verifica se deploy funcionou

---

### 📖 **`docs/`** - Documentação Completa
**Propósito:** Toda a documentação do projeto, guias, instruções e referências

**Conteúdo:**
- Documentação técnica (`.md`)
- Guias de deploy
- Instruções de configuração
- Documentação de APIs
- Troubleshooting
- Scripts de organização

**Quando usar:** Para qualquer documentação, guia ou instrução

**Estrutura sugerida:**
```
docs/
├── deploy/          # Guias de deploy
├── setup/           # Instruções de configuração
├── api/             # Documentação de APIs
└── troubleshooting/  # Solução de problemas
```

---

### 🗄️ **`sql/`** - Scripts e Queries SQL
**Propósito:** Scripts SQL para banco de dados Supabase

**Conteúdo:**
- Scripts de criação de tabelas
- Queries de análise
- Scripts de migração
- Funções e triggers
- Views e stored procedures

**Quando usar:** Para qualquer script SQL que modifica ou consulta o banco

**Exemplos:**
- `sql/create-id-sprinthub-column.sql` - Cria coluna
- `sql/query-google-campaigns-cost.sql` - Query de análise
- `sql/fix_permissions_supabase.sql` - Corrige permissões

---

### 🐳 **`docker/`** - Configurações Docker
**Propósito:** Todos os arquivos relacionados ao Docker

**Conteúdo:**
- `Dockerfile` e variações (`Dockerfile.*`)
- Arquivos `docker-compose*.yml`
- `docker-entrypoint.sh`

**Quando usar:** Para qualquer arquivo Docker

**⚠️ IMPORTANTE:** 
- Dockerfile principal: `docker/Dockerfile`
- docker-compose principal: `docker/docker-compose.yml`
- docker-entrypoint: `docker/docker-entrypoint.sh`

---

### 📦 **`stacks/`** - Arquivos Stack (Portainer/EasyPanel)
**Propósito:** Arquivos de stack para Portainer, EasyPanel e Render

**Conteúdo:**
- Arquivos `stack-*.yml`
- Arquivos `render*.yaml`
- `portainer-stack.yml`
- `firebird-stack*.yml`
- `docker-stack-beta.yml`

**Quando usar:** Para arquivos de stack de orquestração de containers

---

### ⚙️ **`config/`** - Arquivos de Configuração
**Propósito:** Configurações de serviços e ferramentas

**Conteúdo:**
- Configurações do Google Ads Proxy
- Arquivos de configuração nginx (`.conf`)
- Outros arquivos de configuração

**Quando usar:** Para arquivos de configuração de serviços externos

---

### 💾 **`data/`** - Arquivos de Dados
**Propósito:** Dados JSON, CSV e checkpoints

**Conteúdo:**
- Arquivos JSON de dados
- Arquivos CSV
- Checkpoints de sincronização

**⚠️ IMPORTANTE:** Esta pasta está no `.gitignore` - dados não são commitados

---

### 📝 **`logs/`** - Logs do Sistema
**Propósito:** Arquivos de log gerados pelos scripts

**Conteúdo:**
- Logs de sincronização
- Logs de processamento
- Logs de erro

**⚠️ IMPORTANTE:** Esta pasta está no `.gitignore` - logs não são commitados

---

### 🗑️ **`temp/`** - Arquivos Temporários
**Propósito:** Arquivos temporários e de teste

**Conteúdo:**
- Arquivos HTML de teste
- Arquivos temporários
- Rascunhos

**⚠️ IMPORTANTE:** Esta pasta está no `.gitignore` - arquivos temporários não são commitados

---

## 🔄 Comandos Reutilizáveis - Para Evitar Duplicação

### 📋 **ANTES DE CRIAR QUALQUER ARQUIVO, VERIFIQUE:**

```bash
# Verificar se já existe um arquivo similar
grep -r "nome-do-arquivo" . --exclude-dir=node_modules --exclude-dir=.git

# Listar arquivos similares
find . -name "*palavra-chave*" -type f

# Verificar scripts existentes
ls scripts/ | grep "palavra-chave"
ls scripts-deploy/ | grep "palavra-chave"
```

---

### 🚀 **Comandos de Deploy (JÁ EXISTEM - NÃO CRIAR NOVOS)**

#### Deploy Serviço de Sincronização (EasyPanel)
```bash
# JÁ EXISTE: scripts-deploy/deploy-vps.sh
# OU usar diretamente:
ssh root@<seu-servidor>
cd /etc/easypanel/projects/sprint-sync && \
docker service scale sprint-sync_sincronizacao=0 && \
sleep 5 && \
docker service update --image easypanel/sprint-sync/sincronizacao:latest sprint-sync_sincronizacao --force && \
docker service scale sprint-sync_sincronizacao=1
```

#### Deploy Beta (EasyPanel)
```bash
# JÁ EXISTE: scripts-deploy/deploy-vps.sh
# OU usar diretamente:
ssh root@<seu-servidor>
cd /etc/easypanel/projects/bi-oficialmed && \
docker service scale bi-oficialmed_app=0 && \
sleep 5 && \
docker service update --image easypanel/bi-oficialmed/app:latest bi-oficialmed_app --force && \
docker service scale bi-oficialmed_app=1
```

**📝 DOCUMENTAÇÃO:** `docs/DEPLOY_EASYPANEL_BETA_SYNC.md`

---

### 🔄 **Comandos de Sincronização (JÁ EXISTEM - NÃO CRIAR NOVOS)**

#### Sincronização Completa (API)
```bash
# Endpoint já existe e está funcionando:
curl -X POST https://sincrocrm.oficialmed.com.br/sync/all \
  -H "Content-Type: application/json" \
  -d '{"trigger": "manual"}'
```

**📝 CÓDIGO:** `api-sync-opportunities.js` (linha ~1011 - função `runFullSync`)

#### Sincronização via Botão UI
```javascript
// JÁ EXISTE em: src/components/TopMenuBar.jsx
// Função: handleSyncNow()
// Endpoint: /api/sync-now
```

---

### 🗄️ **Comandos de Banco de Dados (JÁ EXISTEM - NÃO CRIAR NOVOS)**

#### Verificar Estrutura de Tabelas
```bash
# JÁ EXISTE: sql/verificar-estrutura-tabelas.sql
# JÁ EXISTE: scripts/verificar-todas-tabelas-prime.cjs
```

#### Criar Coluna ID SprintHub
```bash
# JÁ EXISTE: sql/create-id-sprinthub-column.sql
# JÁ EXISTE: scripts/add-id-sprinthub-column.cjs
```

#### Corrigir Permissões
```bash
# JÁ EXISTE: sql/fix_permissions_supabase.sql
```

---

### 🧪 **Comandos de Teste (JÁ EXISTEM - NÃO CRIAR NOVOS)**

#### Testar Sincronização de Leads
```bash
# JÁ EXISTE: scripts/test-sync-50-leads.cjs
# JÁ EXISTE: scripts/test-leads-sync.cjs
```

#### Testar API SprintHub
```bash
# JÁ EXISTE: scripts/test-api-pages.cjs
# JÁ EXISTE: scripts/test-api-pages-allfields.cjs
```

#### Debug de Dados
```bash
# JÁ EXISTE: scripts/debug-sprinthub-data.cjs
# JÁ EXISTE: scripts/debug-api-response.cjs
```

---

### 📊 **Comandos de Análise (JÁ EXISTEM - NÃO CRIAR NOVOS)**

#### Analisar Dados de Leads
```bash
# JÁ EXISTE: scripts/analyze-leads-data.cjs
# JÁ EXISTE: scripts/check-leads-status.cjs
```

#### Verificar Leads Faltantes
```bash
# JÁ EXISTE: scripts/check-missing-leads.cjs
# JÁ EXISTE: sql/query1-resumo-faltantes.sql
```

---

### 🔧 **Comandos de Configuração (JÁ EXISTEM - NÃO CRIAR NOVOS)**

#### Configurar Chatwoot
```bash
# JÁ EXISTE: scripts-deploy/setup-chatwoot.sh
# DOCUMENTAÇÃO: docs/CHATWOOT_EASYPANEL_SETUP.md
```

#### Configurar N8N
```bash
# JÁ EXISTE: scripts-deploy/deploy-n8n.sh
# DOCUMENTAÇÃO: docs/N8N_SETUP.md
```

---

## ⚠️ **REGRAS PARA IA - EVITAR DUPLICAÇÃO**

### ❌ **NÃO FAÇA:**
1. ❌ Criar novos scripts de deploy se já existe um similar
2. ❌ Criar novos scripts de teste se já existe um similar
3. ❌ Criar novos scripts SQL se já existe um similar
4. ❌ Criar novos arquivos de documentação se já existe um similar
5. ❌ Criar novos Dockerfiles se já existe um similar
6. ❌ Criar novos arquivos de configuração se já existe um similar

### ✅ **FAÇA:**
1. ✅ **SEMPRE verificar se já existe** antes de criar
2. ✅ **Reutilizar código existente** ao invés de criar novo
3. ✅ **Atualizar arquivos existentes** ao invés de criar novos
4. ✅ **Usar comandos grep/find** para encontrar arquivos similares
5. ✅ **Consultar esta documentação** antes de criar qualquer arquivo
6. ✅ **Adicionar ao arquivo existente** ao invés de criar novo

---

## 🔍 **Como Verificar Antes de Criar**

### 1. Verificar Scripts Existentes
```bash
# Listar todos os scripts
ls scripts/ scripts-deploy/ | grep "palavra-chave"

# Buscar por função específica
grep -r "nome-da-funcao" scripts/ scripts-deploy/
```

### 2. Verificar SQL Existentes
```bash
# Listar queries similares
ls sql/ | grep "palavra-chave"

# Buscar por query específica
grep -r "SELECT.*tabela" sql/
```

### 3. Verificar Documentação Existente
```bash
# Listar docs similares
ls docs/ | grep "palavra-chave"

# Buscar conteúdo
grep -r "palavra-chave" docs/
```

### 4. Verificar Configurações Existentes
```bash
# Listar configs similares
ls config/ docker/ stacks/ | grep "palavra-chave"
```

---

## 📝 **Template para Novos Arquivos**

### Se REALMENTE precisar criar um novo arquivo:

1. **Verificar se não existe:**
   ```bash
   find . -name "*nome-similar*" -type f
   ```

2. **Verificar se não pode atualizar existente:**
   ```bash
   grep -r "funcionalidade" scripts/ docs/
   ```

3. **Usar nomenclatura consistente:**
   - Scripts: `acao-objeto.cjs` (ex: `sync-leads.cjs`)
   - SQL: `acao_objeto.sql` (ex: `create_table.sql`)
   - Docs: `NOME_DESCRITIVO.md` (ex: `DEPLOY_VPS.md`)

4. **Colocar na pasta correta:**
   - Scripts utilitários → `scripts/`
   - Scripts de deploy → `scripts-deploy/`
   - SQL → `sql/`
   - Docs → `docs/`
   - Docker → `docker/`
   - Stack → `stacks/`

---

## 🎯 **Checklist Antes de Criar Qualquer Arquivo**

- [ ] Verifiquei se já existe arquivo similar?
- [ ] Verifiquei se posso atualizar arquivo existente?
- [ ] Verifiquei a pasta correta para colocar?
- [ ] Usei nomenclatura consistente?
- [ ] Adicionei ao `.gitignore` se necessário?
- [ ] Documentei o propósito do arquivo?

---

## 📚 **Referências Rápidas**

### APIs Principais (NÃO MOVER):
- `api-sync-leads.js` - API de sincronização de leads
- `api-sync-opportunities.js` - API de sincronização de oportunidades

### Documentação Importante:
- `docs/DEPLOY_EASYPANEL_BETA_SYNC.md` - Deploy EasyPanel
- `docs/ESTRUTURA_PROJETO.md` - Estrutura do projeto
- `docs/ORGANIZACAO_PROJETO_RESUMO.md` - Resumo da organização

### Scripts Mais Usados:
- `scripts-deploy/deploy-vps.sh` - Deploy na VPS
- `scripts/test-sync-50-leads.cjs` - Teste de sincronização
- `scripts/analyze-leads-data.cjs` - Análise de leads

---

## 🚨 **LEMBRETE FINAL**

**ANTES DE CRIAR QUALQUER ARQUIVO:**
1. 🔍 **BUSQUE** se já existe
2. 🔄 **REUTILIZE** código existente
3. ✏️ **ATUALIZE** arquivos existentes
4. 📁 **USE** a pasta correta
5. 📝 **DOCUMENTE** o propósito

**O objetivo é ter MENOS arquivos, não mais!**

