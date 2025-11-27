# 🚀 GUIA RÁPIDO - Implementar Google API sem Expiração

## ⚡ O SEGREDO (TL;DR)

**Por que não expira aqui:**
1. Refresh token armazenado no **SERVIDOR** (não no frontend)
2. Access token **RENOVADO A CADA REQUISIÇÃO** automaticamente
3. Nunca reutilizamos o mesmo access token

## 📋 IMPLEMENTAÇÃO EM 5 PASSOS

### PASSO 1: Obter Refresh Token (UMA VEZ)

```bash
1. Acesse: https://developers.google.com/oauthplayground/
2. Clique no ícone ⚙️ → "Use your own OAuth credentials"
3. Cole Client ID e Client Secret
4. Scope: https://www.googleapis.com/auth/adwords
5. Autorize e copie o REFRESH TOKEN (começa com "1//...")
```

### PASSO 2: Criar Edge Function/Backend

**Arquivo: `supabase/functions/google-ads-api/index.ts`**

```typescript
// 🔑 FUNÇÃO CRÍTICA - Renova token A CADA requisição
async function getAccessToken(config) {
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: config.client_id,
      client_secret: config.client_secret,
      refresh_token: config.refresh_token,  // ← NUNCA EXPIRA
      grant_type: 'refresh_token',
    }),
  })
  
  const data = await response.json()
  return data.access_token  // ← NOVO token (válido 1h)
}

// 🎯 Usar em TODA requisição
async function makeGoogleAdsRequest(query, customerId, config) {
  // SEMPRE renovar o token
  const accessToken = await getAccessToken(config)
  
  const response = await fetch(
    `https://googleads.googleapis.com/v21/customers/${customerId}/googleAds:search`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,  // ← Token FRESCO
        'developer-token': config.developer_token,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query })
    }
  )
  
  return response.json()
}

// Configuração do ambiente
function getGoogleAdsConfig(accountKey = 'ACCOUNT_1') {
  return {
    client_id: Deno.env.get('GOOGLE_ADS_CLIENT_ID_1'),
    client_secret: Deno.env.get('GOOGLE_ADS_CLIENT_SECRET_1'),
    refresh_token: Deno.env.get('GOOGLE_ADS_REFRESH_TOKEN_1'),
    customer_id: Deno.env.get('GOOGLE_ADS_CUSTOMER_ID_1'),
    developer_token: Deno.env.get('GOOGLE_ADS_DEVELOPER_TOKEN'),
  }
}

// Servidor
serve(async (req) => {
  const { action, account, dateRange } = await req.json()
  const config = getGoogleAdsConfig(account)
  
  // Handler que usa makeGoogleAdsRequest
  const data = await handleGetCampaigns(config, dateRange)
  
  return new Response(JSON.stringify(data))
})
```

### PASSO 3: Configurar Variáveis de Ambiente

**Supabase Dashboard → Settings → Edge Functions → Secrets:**

```bash
GOOGLE_ADS_CLIENT_ID_1=seu-client-id.apps.googleusercontent.com
GOOGLE_ADS_CLIENT_SECRET_1=GOCSPX-seu-secret
GOOGLE_ADS_REFRESH_TOKEN_1=1//seu-refresh-token-aqui
GOOGLE_ADS_CUSTOMER_ID_1=1234567890
GOOGLE_ADS_DEVELOPER_TOKEN=seu-developer-token
```

### PASSO 4: Frontend Service

```typescript
// src/services/googleAdsService.ts
async function getCampaigns(dateRange) {
  // Chama Edge Function (credenciais no servidor)
  const response = await fetch(
    `${supabaseUrl}/functions/v1/google-ads-api`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'campaigns-metrics',
        account: 'ACCOUNT_1',
        dateRange
      })
    }
  )
  
  return response.json()
}
```

### PASSO 5: Testar

```typescript
// Teste imediato
await getCampaigns({ since: '2024-01-01', until: '2024-12-31' })

// Teste após 2 horas (deve funcionar - token renovado!)
// Teste após 1 dia (deve funcionar - token renovado!)
// Teste após 1 semana (deve funcionar - token renovado!)
```

---

## 🎯 PONTOS CRÍTICOS

### ✅ O QUE FAZER

1. **Armazenar credenciais no SERVIDOR**
   ```typescript
   // ✅ CORRETO - Servidor
   const refreshToken = Deno.env.get('GOOGLE_ADS_REFRESH_TOKEN_1')
   ```

2. **Renovar token A CADA requisição**
   ```typescript
   // ✅ CORRETO
   async function callAPI() {
     const token = await getAccessToken(config)  // ← NOVO token
     return fetch(url, { headers: { Authorization: `Bearer ${token}` } })
   }
   ```

3. **Chamar getAccessToken() antes de CADA requisição**
   ```typescript
   // ✅ CORRETO
   const data1 = await makeRequest1()  // ← Renova token
   const data2 = await makeRequest2()  // ← Renova token novamente
   ```

### ❌ O QUE NÃO FAZER

1. **NÃO armazenar no frontend**
   ```typescript
   // ❌ ERRADO
   localStorage.setItem('refreshToken', token)
   ```

2. **NÃO reutilizar o mesmo access token**
   ```typescript
   // ❌ ERRADO
   const token = await getAccessToken()
   
   function request1() {
     fetch(url, { headers: { Authorization: `Bearer ${token}` } })
   }
   
   function request2() {
     fetch(url, { headers: { Authorization: `Bearer ${token}` } })  // ← Mesmo token!
   }
   ```

3. **NÃO cachear o access token**
   ```typescript
   // ❌ ERRADO
   let cachedToken = null
   
   async function getToken() {
     if (!cachedToken) {
       cachedToken = await getAccessToken()
     }
     return cachedToken  // ← Token antigo!
   }
   ```

---

## 🔧 ARQUIVOS NECESSÁRIOS

### 1. Edge Function Principal

```
supabase/functions/google-ads-api/
├── index.ts              ← Código principal
└── deno.json             ← Configuração Deno
```

**deno.json:**
```json
{
  "importMap": "./import_map.json"
}
```

### 2. Frontend Service

```
src/services/
├── googleAdsSupabaseService.ts    ← Chama Edge Function
└── googleAdsService.ts            ← Service principal
```

### 3. Variáveis de Ambiente

```
.env                      ← Frontend (opcional)
Supabase Secrets          ← Backend (OBRIGATÓRIO)
```

---

## 🐛 TROUBLESHOOTING

### Erro: "Invalid grant"

**Causa:** Refresh token expirou ou foi revogado

**Solução:** Gerar novo refresh token no OAuth Playground

### Erro: "Token expired"

**Causa:** Reutilizando o mesmo access token

**Solução:** Garantir que `getAccessToken()` é chamado A CADA requisição

### Erro: "Credentials not found"

**Causa:** Variáveis de ambiente não configuradas

**Solução:** Adicionar no Supabase Secrets

---

## 📊 FLUXO COMPLETO

```
┌─────────────┐
│  Frontend   │
└──────┬──────┘
       │ fetch('/functions/v1/google-ads-api')
       ↓
┌─────────────────────────────────┐
│  Edge Function (Servidor)       │
│                                 │
│  1. Recebe requisição           │
│  2. Busca credenciais (env)     │
│  3. getAccessToken()            │ ← 🔑 RENOVAÇÃO
│     ↓                           │
│     fetch('oauth2.googleapis.com/token')
│     - refresh_token (NUNCA EXPIRA)
│     - grant_type: 'refresh_token'
│     ↓                           │
│     return NEW access_token     │
│  4. makeGoogleAdsRequest()      │
│     ↓                           │
│     fetch('googleads.googleapis.com')
│     - Authorization: Bearer NEW_TOKEN
│  5. Retorna dados               │
└─────────────────────────────────┘
       │
       ↓
┌─────────────┐
│  Frontend   │ ← Recebe dados
└─────────────┘
```

---

## 📝 CÓDIGO COMPLETO MÍNIMO

### Edge Function Completa

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

async function getAccessToken(config) {
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: config.client_id,
      client_secret: config.client_secret,
      refresh_token: config.refresh_token,
      grant_type: 'refresh_token',
    }),
  })
  
  const data = await response.json()
  return data.access_token
}

async function makeGoogleAdsRequest(query, customerId, config) {
  const accessToken = await getAccessToken(config)
  
  const response = await fetch(
    `https://googleads.googleapis.com/v21/customers/${customerId}/googleAds:search`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'developer-token': config.developer_token,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query })
    }
  )
  
  return response.json()
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { action, dateRange } = await req.json()
    
    const config = {
      client_id: Deno.env.get('GOOGLE_ADS_CLIENT_ID_1'),
      client_secret: Deno.env.get('GOOGLE_ADS_CLIENT_SECRET_1'),
      refresh_token: Deno.env.get('GOOGLE_ADS_REFRESH_TOKEN_1'),
      customer_id: Deno.env.get('GOOGLE_ADS_CUSTOMER_ID_1'),
      developer_token: Deno.env.get('GOOGLE_ADS_DEVELOPER_TOKEN'),
    }
    
    const query = `
      SELECT 
        campaign.id,
        campaign.name,
        metrics.impressions,
        metrics.clicks
      FROM campaign 
      WHERE segments.date >= '${dateRange.since}'
      AND segments.date <= '${dateRange.until}'
    `
    
    const data = await makeGoogleAdsRequest(query, config.customer_id, config)
    
    return new Response(
      JSON.stringify({ success: true, data: data.results }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
```

### Frontend Service Completo

```typescript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)

export async function getCampaigns(dateRange) {
  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/google-ads-api`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'campaigns-metrics',
        dateRange
      })
    }
  )
  
  const data = await response.json()
  
  if (!data.success) {
    throw new Error(data.error)
  }
  
  return data.data
}
```

---

## ✅ CHECKLIST FINAL

```bash
□ Obtive refresh token no OAuth Playground
□ Configurei variáveis no Supabase Secrets
□ Criei edge function com getAccessToken()
□ getAccessToken() é chamado A CADA requisição
□ Credenciais estão no SERVIDOR, não no frontend
□ Testei que funciona imediatamente
□ Testei que funciona após horas
```

---

## 🎓 CONCEITOS CHAVE

### Refresh Token
- **NUNCA expira** (se usado corretamente)
- Permite gerar novos access tokens
- Deve ficar no **SERVIDOR**

### Access Token
- **Expira em 1 hora**
- Usado para acessar APIs
- Deve ser **RENOVADO** a cada requisição

### Por que Funciona?
1. Refresh token fica seguro no servidor
2. A cada requisição, geramos novo access token
3. Nunca reutilizamos token antigo
4. Google nunca revoga refresh token se usado regularmente

---

**Criado:** 26/11/2025  
**Versão:** 1.0  
**Status:** ✅ Testado e funcionando há meses

**🚀 Copie este guia para o outro Cursor e implemente exatamente assim!**

