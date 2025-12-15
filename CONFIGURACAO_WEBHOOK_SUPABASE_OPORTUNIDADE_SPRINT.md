# 🚀 Guia de Configuração - Webhook Supabase para oportunidade_sprint

## 📋 O que este webhook faz?

Este webhook será disparado automaticamente pelo Supabase sempre que houver:
- **INSERT** (inserção) de uma nova linha na tabela `oportunidade_sprint`
- **UPDATE** (atualização) de uma linha existente na tabela `oportunidade_sprint`

## 🔧 Configuração Passo a Passo

### 1️⃣ **General - Nome do Webhook**

```
Nome: cockpit-vendedores-oportunidades
```

> ⚠️ **Importante:** Não use espaços ou caracteres especiais no nome.

### 2️⃣ **Conditions to fire webhook**

**Table:** 
```
oportunidade_sprint
```

**Events:**
- ✅ **Insert** - Marcado (qualquer inserção na tabela)
- ✅ **Update** - Marcado (qualquer atualização, de qualquer coluna na tabela)
- ❌ **Delete** - Não marcado (opcional, se quiser monitorar exclusões)

### 3️⃣ **Webhook configuration**

**Type:** HTTP Request (já selecionado)

**Method:** `POST` (recomendado para enviar dados)

**URL:** 
```
https://sincro.oficialmed.com.br/webhook/oportunidade-sprint
```
> **Nota:** Esta é uma URL de exemplo. Você precisa criar um endpoint que receba esses dados. Veja opções abaixo.

**Timeout:** `5000` ms (5 segundos) - adequado para a maioria dos casos

### 4️⃣ **HTTP Headers**

O header `Content-Type` já está configurado:
```
Content-Type: application/json
```

Se precisar adicionar autenticação, adicione mais headers:
```
Authorization: Bearer SEU_TOKEN_AQUI
```

### 5️⃣ **HTTP Parameters**

Normalmente não necessário para POST requests. Deixe vazio ou adicione parâmetros se o endpoint exigir.

## 📦 Formato do Payload Enviado

O Supabase envia automaticamente um payload JSON no seguinte formato:

### Para INSERT:
```json
{
  "type": "INSERT",
  "table": "oportunidade_sprint",
  "schema": "api",
  "record": {
    "id": 123456,
    "title": "Nome da Oportunidade",
    "value": 1000.00,
    "crm_column": 130,
    "lead_id": 789012,
    "status": "open",
    "entrada_compra": "2025-01-15T10:30:00-03:00",
    "create_date": "2025-01-15T10:30:00-03:00",
    "update_date": "2025-01-15T10:30:00-03:00",
    // ... todos os outros campos da linha inserida
  },
  "old_record": null
}
```

### Para UPDATE:
```json
{
  "type": "UPDATE",
  "table": "oportunidade_sprint",
  "schema": "api",
  "record": {
    "id": 123456,
    "title": "Nome da Oportunidade Atualizado",
    "value": 1500.00,
    "entrada_compra": "2025-01-15T11:00:00-03:00",
    "update_date": "2025-01-15T11:00:00-03:00",
    // ... todos os campos após a atualização
  },
  "old_record": {
    "id": 123456,
    "title": "Nome da Oportunidade",
    "value": 1000.00,
    "entrada_compra": null,
    "update_date": "2025-01-15T10:30:00-03:00",
    // ... todos os campos antes da atualização
  }
}
```

## 🎯 Casos de Uso

### Caso 1: Notificar quando campo `entrada_compra` for preenchido

Você pode usar este webhook para detectar quando o campo `entrada_compra` é preenchido pela primeira vez:

```javascript
// No seu endpoint webhook
if (payload.type === 'UPDATE' && 
    payload.old_record.entrada_compra === null && 
    payload.record.entrada_compra !== null) {
  // Campo entrada_compra foi preenchido!
  // Fazer algo (ex: enviar notificação, atualizar dashboard, etc.)
}
```

### Caso 2: Sincronizar com sistema externo

Quando uma oportunidade é inserida ou atualizada no Supabase, enviar para outro sistema:

```javascript
// No seu endpoint webhook
const oportunidade = payload.record;

// Enviar para sistema externo
await fetch('https://outro-sistema.com/api/oportunidades', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(oportunidade)
});
```

### Caso 3: Enviar notificação/email

Notificar quando uma oportunidade importante for criada:

```javascript
// No seu endpoint webhook
if (payload.type === 'INSERT' && payload.record.value > 5000) {
  // Oportunidade de alto valor criada
  await enviarEmailNotificacao(payload.record);
}
```

## 🌐 Criando um Endpoint para Receber o Webhook

### Opção 1: Edge Function no Supabase

Crie uma Edge Function para processar o webhook:

```bash
supabase functions new process-oportunidade-webhook
```

```typescript
// supabase/functions/process-oportunidade-webhook/index.ts
Deno.serve(async (req) => {
  const payload = await req.json();
  
  console.log('Webhook recebido:', payload.type);
  console.log('Dados:', payload.record);
  
  // Processar dados aqui
  
  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' }
  });
});
```

Deploy:
```bash
supabase functions deploy process-oportunidade-webhook
```

URL do webhook:
```
https://agdffspstbxeqhqtltvb.supabase.co/functions/v1/process-oportunidade-webhook
```

### Opção 2: API Externa (Node.js/Express)

```javascript
// server.js
const express = require('express');
const app = express();

app.use(express.json());

app.post('/webhook/oportunidade-sprint', (req, res) => {
  const payload = req.body;
  
  console.log('Evento:', payload.type);
  console.log('Registro:', payload.record);
  
  // Processar dados aqui
  // Ex: Salvar em outro banco, enviar email, etc.
  
  res.json({ success: true });
});

app.listen(3000, () => {
  console.log('Servidor webhook rodando na porta 3000');
});
```

### Opção 3: Usar um serviço como ngrok para testes locais

```bash
# Instalar ngrok
npm install -g ngrok

# Expor servidor local
ngrok http 3000

# Usar a URL do ngrok no webhook
# Ex: https://abc123.ngrok.io/webhook/oportunidade-sprint
```

## 🔍 Verificando se o Webhook está Funcionando

### 1. Ver logs no Supabase

Acesse: **Database > Webhooks > cockpit-vendedores-oportunidades > Logs**

Você verá:
- ✅ Requisições bem-sucedidas
- ❌ Erros e tentativas falhadas
- 📊 Histórico de execuções

### 2. Testar manualmente

No Supabase Dashboard:
1. Acesse **Table Editor**
2. Selecione a tabela `oportunidade_sprint`
3. Insira ou atualize uma linha
4. Verifique os logs do webhook

### 3. Verificar no seu endpoint

Adicione logs no seu endpoint para verificar se está recebendo os dados:

```javascript
console.log('Payload recebido:', JSON.stringify(req.body, null, 2));
```

## ⚠️ Troubleshooting

### Webhook não está disparando

- ✅ Verifique se os eventos (Insert/Update) estão marcados
- ✅ Confirme que o nome da tabela está correto: `oportunidade_sprint`
- ✅ Verifique se o schema está correto (deve ser `api`)
- ✅ Teste inserindo/atualizando uma linha manualmente

### Erro 404 na URL

- ✅ Verifique se a URL está correta e acessível
- ✅ Teste a URL manualmente com um POST request
- ✅ Se usar HTTPS, certifique-se de que o certificado SSL é válido

### Erro de timeout

- ✅ Aumente o timeout para 10000ms (10 segundos)
- ✅ Otimize o processamento no seu endpoint
- ✅ Processe dados de forma assíncrona se necessário

### Payload vazio ou incorreto

- ✅ Verifique se o Content-Type está como `application/json`
- ✅ Confirme que o endpoint está esperando JSON no body
- ✅ Adicione logs para ver o formato exato do payload recebido

## 📚 Referências

- [Documentação Supabase Webhooks](https://supabase.com/docs/guides/database/webhooks)
- [Exemplo com Edge Functions](https://supabase.com/docs/guides/functions/examples/push-notifications)

## 🎯 Próximos Passos

Depois que o webhook estiver funcionando:

1. **Processar dados específicos:** Filtrar apenas campos relevantes (ex: `entrada_compra`)
2. **Validação:** Validar dados antes de processar
3. **Retry logic:** Implementar retentativas em caso de falha
4. **Monitoramento:** Configurar alertas para erros recorrentes
5. **Rate limiting:** Implementar controle de taxa se necessário

