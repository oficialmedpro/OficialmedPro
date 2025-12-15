# 🚀 Guia de Configuração - Webhook Entrada Compra para Supabase

## 📋 Informações do Supabase

- **URL Base:** `https://agdffspstbxeqhqtltvb.supabase.co`
- **Schema:** `api`
- **Tabela:** `oportunidade_sprint`
- **Campo:** `entrada_compra` (timestamp with time zone)
- **Chave API:** Use a chave `anon` do Supabase

## 🔧 Configuração no SprintHub

### 1️⃣ **URL do Webhook**
```
https://agdffspstbxeqhqtltvb.supabase.co/rest/v1/oportunidade_sprint
```

### 2️⃣ **Método HTTP**
```
PATCH
```
> **Nota:** Use `PATCH` para atualizar uma oportunidade existente. Se o SprintHub não fornecer o ID da oportunidade, precisaremos ajustar a estratégia.

### 3️⃣ **Cabeçalhos (Headers)**

Adicione os seguintes cabeçalhos clicando no botão **"+ Cabeçalho"**:

| Nome do Cabeçalho | Valor |
|-------------------|-------|
| `Authorization` | `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFnZGZmc3BzdGJ4ZXFocXRsdHZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA0NTM2NjYsImV4cCI6MjA2NjAyOTY2Nn0.2fIu5l80OQ5HRsYk7xgjLgct51bV7eYCFWzYdhI4wxs` |
| `apikey` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFnZGZmc3BzdGJ4ZXFocXRsdHZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA0NTM2NjYsImV4cCI6MjA2NjAyOTY2Nn0.2fIu5l80OQ5HRsYk7xgjLgct51bV7eYCFWzYdhI4wxs` |
| `Accept-Profile` | `api` |
| `Content-Profile` | `api` |
| `Content-Type` | `application/json` |

### 4️⃣ **Corpo da Requisição (Body)**

#### **Opção A: Se o SprintHub fornecer o ID da oportunidade**

```json
{
  "id": "{op=id}",
  "entrada_compra": "{contactfield=Entrada Compra}"
}
```

E a URL precisa incluir o filtro:
```
https://agdffspstbxeqhqtltvb.supabase.co/rest/v1/oportunidade_sprint?id=eq.{op=id}
```

#### **Opção B: Usando o ID diretamente na URL (Recomendado)**

**URL do Webhook (com filtro):**
```
https://agdffspstbxeqhqtltvb.supabase.co/rest/v1/oportunidade_sprint?id=eq.{op=id}
```

**Corpo da Requisição (Body):**
```json
{
  "entrada_compra": "{contactfield=Entrada Compra}"
}
```

#### **Opção C: Se o SprintHub não fornecer o ID, usar POST com upsert**

**URL do Webhook:**
```
https://agdffspstbxeqhqtltvb.supabase.co/rest/v1/oportunidade_sprint
```

**Método:** `POST`

**Cabeçalho adicional:**
| Nome | Valor |
|------|-------|
| `Prefer` | `resolution=merge-duplicates` |

**Corpo da Requisição:**
```json
{
  "id": "{op=id}",
  "title": "{op=title}",
  "entrada_compra": "{contactfield=Entrada Compra}",
  "lead_id": "{op=lead_id}",
  "crm_column": "{op=crm_column}",
  "status": "{op=status}",
  "create_date": "{op=createDate}",
  "update_date": "{op=updateDate}"
}
```

> ⚠️ **Nota:** O campo `entrada_compra` precisa estar no formato ISO 8601. Se o SprintHub enviar em outro formato, pode ser necessário criar uma Edge Function no Supabase para converter.

## 🎯 Formato de Data Esperado

O campo `entrada_compra` aceita os seguintes formatos:

✅ **Formatos aceitos:**
- `2025-11-25T12:57:00-03:00` (ISO 8601 com timezone)
- `2025-11-25T12:57:00Z` (ISO 8601 UTC)
- `2025-11-25 12:57:00-03` (PostgreSQL timestamp)
- `2025-11-25 12:57:00` (PostgreSQL timestamp sem timezone)

## 📝 Tokens Disponíveis no SprintHub

Para descobrir os tokens disponíveis, clique no botão **"Lista de Atributos"** no modal de configuração do webhook.

**Tokens comuns:**
- `{op=id}` - ID da oportunidade
- `{op=title}` - Título da oportunidade
- `{op=lead_id}` - ID do lead
- `{op=crm_column}` - ID da coluna/etapa
- `{op=status}` - Status da oportunidade
- `{op=createDate}` - Data de criação
- `{op=updateDate}` - Data de atualização
- `{contactfield=NomeDoCampo}` - Campo personalizado do lead/oportunidade

## 🔍 Verificação

Após configurar o webhook, você pode verificar se os dados estão sendo enviados corretamente:

1. **Teste manual:** Dispare o evento no SprintHub que deveria acionar o webhook
2. **Verificar no Supabase:**
   ```sql
   SELECT id, title, entrada_compra, update_date 
   FROM api.oportunidade_sprint 
   WHERE entrada_compra IS NOT NULL 
   ORDER BY update_date DESC 
   LIMIT 10;
   ```

## ⚠️ Troubleshooting

### Erro 401 Unauthorized
- Verifique se os cabeçalhos `Authorization` e `apikey` estão corretos
- Certifique-se de que está usando a chave `anon` (não a service_role)

### Erro 404 Not Found
- Verifique se a URL está correta
- Certifique-se de que o schema `api` está especificado nos cabeçalhos

### Erro 400 Bad Request
- Verifique o formato da data no campo `entrada_compra`
- Certifique-se de que o JSON está bem formatado
- Verifique se o ID da oportunidade existe no Supabase (para PATCH)

### Campo não está sendo atualizado
- Verifique se o token `{contactfield=Entrada Compra}` está retornando um valor
- Confirme que o nome do campo no SprintHub está exatamente como está no token
- Verifique os logs do webhook no SprintHub (se disponível)

## 📚 Referências

- **Documentação Supabase REST API:** https://supabase.com/docs/reference/javascript/select
- **Tabela oportunidade_sprint:** Campo `entrada_compra` é do tipo `timestamp with time zone`

## 🎯 Próximos Passos

Depois que o webhook de "Entrada Compra" estiver funcionando, podemos configurar os outros campos de data/hora das etapas:

- `acolhimento_compra`
- `qualificado_compra`
- `orcamento_compra`
- `negociacao_compra`
- `follow_up_compra`
- `cadastro_compra`
- E os mesmos campos para os outros funis (recompra, monitoramento, ativacao, reativacao)

