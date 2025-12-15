# 🔄 Soluções Alternativas para Webhook (Sem Edge Functions)

## 📋 Problema

O SprintHub precisa enviar dados para Supabase, mas:
- ❌ **Não pode usar Edge Functions** (limite de invocações)
- ❌ **PostgREST não aceita JSON direto** sem parâmetro nomeado (`p_payload`)
- ❌ **SprintHub remove wrapper** `{"p_payload": {...}}` ao salvar

---

## ✅ SOLUÇÃO 1: INSERT Direto (Apenas Novas Oportunidades)

### Configuração no SprintHub

**URL:**
```
https://agdffspstbxeqhqtltvb.supabase.co/rest/v1/oportunidade_sprint
```

**Método:** `POST`

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFnZGZmc3BzdGJ4ZXFocXRsdHZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA0NTM2NjYsImV4cCI6MjA2NjAyOTY2Nn0.2fIu5l80OQ5HRsYk7xgjLgct51bV7eYCFWzYdhI4wxs
apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFnZGZmc3BzdGJ4ZXFocXRsdHZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA0NTM2NjYsImV4cCI6MjA2NjAyOTY2Nn0.2fIu5l80OQ5HRsYk7xgjLgct51bV7eYCFWzYdhI4wxs
Content-Type: application/json
Accept-Profile: api
Content-Profile: api
```

**Body:**
```json
{
  "id": "{op=id}",
  "title": "{op=title}",
  "value": "{op=value}",
  "user_id": "{op=user}",
  "entrada_compra": "{op=Entrada Compra}",
  ...
}
```

**O que acontece:**
- ✅ Trigger sanitiza automaticamente (datas, campos vazios → NULL)
- ✅ Dados inseridos na tabela
- ⚠️ **Se ID já existe, dará erro de duplicata**

**Limitação:** Não atualiza oportunidades existentes, só cria novas.

---

## ✅ SOLUÇÃO 2: API no EasyPanel (Recomendada para UPSERT)

Criar um endpoint no EasyPanel que:
1. Recebe o payload do SprintHub (sem wrapper)
2. Adiciona o wrapper `{"p_payload": {...}}`
3. Chama a função RPC do Supabase

### Código da API (Node.js/Express)

```javascript
// api/server.js
const express = require('express');
const fetch = require('node-fetch');

const app = express();
app.use(express.json());

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://agdffspstbxeqhqtltvb.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';

app.post('/webhook/oportunidade', async (req, res) => {
  try {
    const payload = req.body;

    // Adicionar wrapper para a função RPC
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/rpc/webhook_upsert_oportunidade_sprint`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'apikey': SUPABASE_ANON_KEY,
          'Accept-Profile': 'api',
          'Content-Profile': 'api',
        },
        body: JSON.stringify({
          p_payload: payload,
        }),
      }
    );

    const result = await response.json();

    return res.status(response.ok ? 200 : 400).json(result);
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`API rodando na porta ${PORT}`);
});
```

### Configuração no SprintHub

**URL:**
```
https://sua-api.easypanel.com/webhook/oportunidade
```

**Método:** `POST`

**Headers:**
```
Content-Type: application/json
```

**Body:** (JSON direto, sem wrapper)

---

## ✅ SOLUÇÃO 3: n8n como Intermediário

### Workflow n8n

1. **Webhook Node** - Recebe do SprintHub
2. **Function Node** - Adiciona wrapper `{"p_payload": data}`
3. **HTTP Request Node** - Chama função RPC do Supabase

### Configuração no SprintHub

**URL:** (URL do webhook do n8n)

**Método:** `POST`

**Headers:**
```
Content-Type: application/json
```

**Body:** (JSON direto)

---

## 📊 Comparação das Soluções

| Solução | UPSERT | Complexidade | Custo |
|---------|--------|--------------|-------|
| **INSERT Direto** | ❌ Não | ⭐ Muito Simples | ✅ Grátis |
| **API EasyPanel** | ✅ Sim | ⭐⭐ Média | ✅ Grátis (já tem servidor) |
| **n8n** | ✅ Sim | ⭐⭐⭐ Alta | 💰 Plano n8n |

---

## 🎯 Recomendação

**Para começar:** Teste a **Solução 1 (INSERT direto)** para ver se funciona com seus dados.

**Para produção:** Use a **Solução 2 (API EasyPanel)** se precisar de UPSERT completo.

---

## 🔧 Próximos Passos

1. ✅ Testar INSERT direto
2. ⚠️ Se precisar de UPDATE, implementar API no EasyPanel
3. ✅ Documentar endpoint da API

