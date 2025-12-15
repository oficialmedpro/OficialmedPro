# 🚀 Configuração Webhook SprintHub → Supabase (entrada_compra)

## 📋 Resumo

O SprintHub vai enviar dados diretamente para a API REST do Supabase quando o campo "Entrada Compra" for preenchido.

## 🎯 Configuração no SprintHub

### 1️⃣ **URL do Webhook**

**Para atualizar uma oportunidade existente (PATCH):**
```
https://agdffspstbxeqhqtltvb.supabase.co/rest/v1/oportunidade_sprint?id=eq.{op=id}
```

> ⚠️ **Importante:** O SprintHub precisa fornecer o ID da oportunidade no token `{op=id}` para que funcione.

**Alternativa (se o SprintHub não fornecer o ID na URL):**
```
https://agdffspstbxeqhqtltvb.supabase.co/rest/v1/oportunidade_sprint
```
E incluir o ID no body (veja opções abaixo).

### 2️⃣ **Método HTTP**
```
PATCH
```
(Use `PATCH` para atualizar uma oportunidade existente)

### 3️⃣ **Cabeçalhos (Headers)**

Adicione os seguintes cabeçalhos clicando em **"+ Add a new header"**:

| Nome do Header | Valor |
|----------------|-------|
| `Authorization` | `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFnZGZmc3BzdGJ4ZXFocXRsdHZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA0NTM2NjYsImV4cCI6MjA2NjAyOTY2Nn0.2fIu5l80OQ5HRsYk7xgjLgct51bV7eYCFWzYdhI4wxs` |
| `apikey` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFnZGZmc3BzdGJ4ZXFocXRsdHZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA0NTM2NjYsImV4cCI6MjA2NjAyOTY2Nn0.2fIu5l80OQ5HRsYk7xgjLgct51bV7eYCFWzYdhI4wxs` |
| `Accept-Profile` | `api` |
| `Content-Profile` | `api` |
| `Content-Type` | `application/json` |

### 4️⃣ **Corpo da Requisição (Body)**

#### **Opção A: Se o SprintHub fornecer o ID na URL**

Se você usar a URL com `?id=eq.{op=id}`, o body fica simples:

```json
{
  "entrada_compra": "{contactfield=Entrada Compra}"
}
```

#### **Opção B: Se o SprintHub não fornecer o ID na URL**

Se usar apenas a URL base, inclua o ID no body:

```json
{
  "id": "{op=id}",
  "entrada_compra": "{contactfield=Entrada Compra}"
}
```

> ⚠️ **Importante:** 
> - O token `{contactfield=Entrada Compra}` deve corresponder exatamente ao nome do campo personalizado no SprintHub
> - Use o botão **"Lista de Atributos"** no SprintHub para verificar o token correto
> - O formato da data deve ser ISO 8601 (ex: `2025-01-15T10:30:00-03:00`)

## 📝 Tokens Disponíveis no SprintHub

Para descobrir os tokens corretos, clique em **"Lista de Atributos"** no modal de configuração do webhook.

**Tokens comuns:**
- `{op=id}` - ID da oportunidade
- `{op=title}` - Título da oportunidade
- `{op=lead_id}` - ID do lead
- `{contactfield=NomeDoCampo}` - Campo personalizado (ex: `{contactfield=Entrada Compra}`)

## 🔍 Verificação

Após configurar:

1. **Teste no SprintHub:** Dispare o evento que deveria preencher "Entrada Compra"
2. **Verifique no Supabase:**
   ```sql
   SELECT id, title, entrada_compra, update_date 
   FROM api.oportunidade_sprint 
   WHERE entrada_compra IS NOT NULL 
   ORDER BY update_date DESC 
   LIMIT 10;
   ```
3. **Verifique os logs:** Edge Functions → webhook-oportunidade-sprint → Logs (o webhook do Supabase também será disparado)

## ⚠️ Troubleshooting

### Erro 401 Unauthorized
- Verifique se os headers `Authorization` e `apikey` estão corretos
- Certifique-se de que está usando a chave `anon` (não service_role)

### Erro 404 Not Found
- Verifique se a URL está correta
- Certifique-se de que o schema `api` está especificado nos headers

### Erro 400 Bad Request
- Verifique o formato da data no campo `entrada_compra`
- Certifique-se de que o JSON está bem formatado
- Verifique se o ID da oportunidade existe no Supabase (para PATCH)

### Campo não está sendo atualizado
- Verifique se o token `{contactfield=Entrada Compra}` está retornando um valor
- Confirme que o nome do campo no SprintHub está exatamente como está no token
- Verifique os logs do webhook no SprintHub (se disponível)

## 🔄 Fluxo Completo

```
SprintHub (campo "Entrada Compra" preenchido)
    ↓
Webhook SprintHub → API REST Supabase
    ↓
PATCH /rest/v1/oportunidade_sprint?id=eq.{id}
    ↓
Tabela oportunidade_sprint atualizada
    ↓
Webhook do Supabase disparado automaticamente
    ↓
Edge Function webhook-oportunidade-sprint processa
    ↓
Logs e ações adicionais (se configuradas)
```

## 📚 Referências

- **Documentação Supabase REST API:** https://supabase.com/docs/reference/javascript/select
- **Tabela oportunidade_sprint:** Campo `entrada_compra` é do tipo `timestamp with time zone`

