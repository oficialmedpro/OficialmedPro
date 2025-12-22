# 📊 Importar Tabelas Typebot no NocoDB

## ✅ Conexão Criada com Sucesso!

Agora vamos importar as tabelas do banco Typebot para visualizar no NocoDB.

## 🚀 Passo a Passo

### 1. Criar uma Nova Base (Base)

1. No menu lateral esquerdo, clique no ícone de **"+"** ou **"New Base"**
2. Ou vá em **"Bases"** → **"+ New Base"**
3. Dê um nome, por exemplo: **"Typebot"** ou **"Typebot Database"**
4. Clique em **"Create"** ou **"Criar"**

### 2. Conectar a Base à Conexão PostgreSQL

1. Dentro da base criada, procure por **"Add Table"** ou **"Adicionar Tabela"**
2. Clique em **"Import from Database"** ou **"Importar do Banco"**
3. Selecione a conexão **"typebot"** que você acabou de criar
4. O NocoDB vai listar todas as tabelas disponíveis

### 3. Selecionar Tabelas para Importar

Você verá uma lista com todas as tabelas do Typebot:
- `Account`
- `Answer`
- `AnswerV2`
- `ApiToken`
- `BannedIp`
- `ChatSession`
- `ClaimableCustomPlan`
- `CollaboratorsOnTypebots`
- `Coupon`
- `Credentials`
- `PublicTypebot` ⭐ (importante!)
- `Typebot` ⭐ (importante!)
- E outras...

**Selecione as tabelas que deseja importar:**
- ✅ Marque as tabelas que quer ver
- Ou clique em **"Select All"** para importar todas
- Clique em **"Import"** ou **"Importar"**

### 4. Visualizar Tabelas Importadas

Após importar, você verá as tabelas na base criada:
- Cada tabela aparecerá como um card ou na lista lateral
- Clique em uma tabela para ver os dados
- Você pode filtrar, ordenar e editar os dados

## 🎯 Tabelas Mais Importantes do Typebot

Se quiser importar apenas as principais:

1. **`Typebot`** - Todos os typebots criados
2. **`PublicTypebot`** - Typebots publicados
3. **`Answer`** - Respostas dos usuários
4. **`AnswerV2`** - Respostas na versão 2
5. **`ChatSession`** - Sessões de chat
6. **`Account`** - Contas de usuários

## 🔍 Alternativa: Usar "Sync" ao invés de Import

Alguns NocoDB têm opção de **"Sync"** que mantém as tabelas sincronizadas:

1. Vá em **"Integrations"** → **"Connections"**
2. Clique nos **3 pontos** ao lado da conexão "typebot"
3. Procure por **"Sync Tables"** ou **"Sincronizar Tabelas"**
4. Isso vai criar as tabelas automaticamente na base

## 📋 Estrutura das Tabelas Principais

### Tabela `Typebot`
- Contém todos os typebots criados
- Campos: `id`, `name`, `publicId`, `published`, `workspaceId`, etc.

### Tabela `PublicTypebot`
- Typebots publicados e acessíveis publicamente
- Campos: `id`, `typebotId`, `name`, `publicId`, `published`, etc.

### Tabela `Answer`
- Respostas dos usuários nos typebots
- Campos: `id`, `resultId`, `blockId`, `content`, `createdAt`, etc.

## 🛠️ Se Não Aparecer Opção de Importar

1. **Verificar se está na base correta:**
   - Certifique-se de estar dentro de uma base (não na tela de conexões)

2. **Usar "Add Table" → "Import from Database":**
   - Procure por esta opção no menu de adicionar tabela

3. **Criar tabela manualmente e sincronizar:**
   - Crie uma tabela vazia
   - Vá em configurações da tabela
   - Procure por "Sync with Database" ou "Sincronizar"

## ✅ Próximos Passos

Após importar as tabelas:
- ✅ Visualizar dados dos typebots
- ✅ Filtrar e buscar typebots específicos
- ✅ Ver respostas dos usuários
- ✅ Analisar estatísticas
- ✅ Exportar dados se necessário

---

**Status:** Conexão criada ✅ - Pronto para importar tabelas!



