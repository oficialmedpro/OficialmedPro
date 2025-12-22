# 📊 Tabelas de Respostas do Typebot

## 🎯 Tabelas Principais com Respostas

### 1. **`Answer`** ⭐ (Principal)
- **Conteúdo:** Respostas dos usuários nos typebots
- **Campos principais:**
  - `id` - ID único da resposta
  - `resultId` - ID do resultado/sessão
  - `blockId` - ID do bloco do typebot
  - `content` - Conteúdo da resposta
  - `createdAt` - Data de criação
  - `updatedAt` - Data de atualização

### 2. **`AnswerV2`** ⭐ (Versão 2)
- **Conteúdo:** Respostas na versão mais recente do Typebot
- **Estrutura similar ao `Answer`, mas com melhorias**

### 3. **`ChatSession`** 📱
- **Conteúdo:** Sessões de chat completas
- **Campos principais:**
  - `id` - ID da sessão
  - `typebotId` - ID do typebot
  - `createdAt` - Data de criação
  - `updatedAt` - Data de atualização
  - Pode conter dados da conversa completa

## 🔍 Como Encontrar as Respostas

### Opção 1: Tabela `Answer`
Esta é a tabela mais importante para ver as respostas individuais dos usuários.

**Query SQL exemplo:**
```sql
SELECT * FROM "Answer" 
ORDER BY "createdAt" DESC 
LIMIT 100;
```

### Opção 2: Tabela `AnswerV2`
Se o Typebot estiver usando a versão mais recente, as respostas podem estar aqui.

**Query SQL exemplo:**
```sql
SELECT * FROM "AnswerV2" 
ORDER BY "createdAt" DESC 
LIMIT 100;
```

### Opção 3: Combinar com `ChatSession`
Para ver respostas junto com o contexto da sessão:

```sql
SELECT 
  cs.id as session_id,
  cs."typebotId",
  a.content as resposta,
  a."createdAt"
FROM "ChatSession" cs
LEFT JOIN "Answer" a ON a."resultId" = cs.id
ORDER BY a."createdAt" DESC;
```

## 📋 Tabelas Relacionadas

### `PublicTypebot`
- Typebots publicados
- Contém o `publicId` usado nas URLs públicas

### `Typebot`
- Todos os typebots criados
- Contém a estrutura e configuração dos bots

## 🎯 Recomendação

**Importe estas tabelas no NocoDB:**
1. ✅ **`Answer`** - Respostas principais
2. ✅ **`AnswerV2`** - Respostas versão 2 (se houver dados)
3. ✅ **`ChatSession`** - Contexto das sessões
4. ✅ **`Typebot`** - Para relacionar com os bots
5. ✅ **`PublicTypebot`** - Para ver quais estão publicados

## 💡 Dica

No NocoDB, após importar, você pode:
- Criar views relacionando `Answer` com `Typebot`
- Filtrar respostas por typebot específico
- Ver estatísticas de respostas
- Exportar dados para análise

---

**Tabela principal de respostas:** `Answer` e `AnswerV2`



