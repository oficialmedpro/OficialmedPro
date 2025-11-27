# 🔐 DOCUMENTAÇÃO COMPLETA - Por que o Google API Refresh Token NÃO EXPIRA

## 📋 ÍNDICE
1. [O Problema em Outros Sistemas](#o-problema-em-outros-sistemas)
2. [A Solução que Funciona Aqui](#a-solução-que-funciona-aqui)
3. [Arquitetura Completa](#arquitetura-completa)
4. [O Segredo: Renovação Automática](#o-segredo-renovação-automática)
5. [Implementação Passo a Passo](#implementação-passo-a-passo)
6. [Código Completo Comentado](#código-completo-comentado)
7. [Como Replicar em Outro Sistema](#como-replicar-em-outro-sistema)
8. [Troubleshooting](#troubleshooting)

---

## 🚨 O PROBLEMA EM OUTROS SISTEMAS

### Por que o Refresh Token expira em outros lugares?

Na maioria dos sistemas, o refresh token expira porque:

1. **❌ Armazenamento Incorreto**: Refresh token guardado no frontend/localStorage
2. **❌ Sem Renovação Automática**: Não há lógica para renovar o access token
3. **❌ Uso Direto do Access Token**: Tentam usar o mesmo access token por horas
4. **❌ Sem Camada de Backend**: Frontend chama API do Google diretamente
5. **❌ Refresh Token Revogado**: Google revoga após inatividade ou múltiplas tentativas

### Sintomas Comuns:
```
❌ "Token expired" após algumas horas
❌ "Invalid grant" após dias sem uso
❌ "Refresh token has been revoked"
❌ Precisa re-autorizar OAuth constantemente
```

---

## ✅ A SOLUÇÃO QUE FUNCIONA AQUI

### Por que NÃO expira neste sistema?

**SEGREDO #1: RENOVAÇÃO AUTOMÁTICA A CADA REQUISIÇÃO**

```typescript
// 🔑 ESTA É A CHAVE DO SUCESSO!
async function getAccessToken(config: GoogleAdsConfig): Promise<string> {
  // A CADA requisição, geramos um NOVO access token
  // usando o refresh token (que nunca expira se usado corretamente)
  
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    body: new URLSearchParams({
      client_id: config.client_id,
      client_secret: config.client_secret,
      refresh_token: config.refresh_token,  // ← Este NUNCA expira
      grant_type: 'refresh_token',          // ← Sempre renovando
    }),
  })
  
  const data = await response.json()
  return data.access_token  // ← Novo access token fresco!
}
```

**SEGREDO #2: EDGE FUNCTION (BACKEND SEGURO)**

```typescript
// Credenciais NUNCA vão para o frontend
// Tudo acontece no servidor (Supabase Edge Function)
const config = {
  client_id: Deno.env.get('GOOGLE_ADS_CLIENT_ID_1'),      // ← Servidor
  client_secret: Deno.env.get('GOOGLE_ADS_CLIENT_SECRET_1'), // ← Servidor
  refresh_token: Deno.env.get('GOOGLE_ADS_REFRESH_TOKEN_1'), // ← Servidor
}
```

**SEGREDO #3: REFRESH TOKEN PERMANENTE**

O refresh token do Google OAuth **NUNCA expira** se:
- ✅ Está armazenado com segurança no servidor
- ✅ É usado regularmente (pelo menos 1x a cada 6 meses)
- ✅ Não foi revogado manualmente pelo usuário
- ✅ Não houve múltiplas tentativas de renovação simultâneas

---

## 🏗️ ARQUITETURA COMPLETA

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND (React)                         │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  useGoogleAds Hook                                        │  │
│  │  - Gerencia estado das campanhas                         │  │
│  │  - Chama googleAdsService                                │  │
│  └──────────────────────────────────────────────────────────┘  │
│                              ↓                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  googleAdsService.ts                                      │  │
│  │  - Faz chamadas para Edge Function                       │  │
│  │  - NÃO tem credenciais                                   │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              ↓ HTTPS
┌─────────────────────────────────────────────────────────────────┐
│                  SUPABASE EDGE FUNCTION                          │
│                  (Backend Serverless - Deno)                     │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  google-ads-api/index.ts                                  │  │
│  │                                                           │  │
│  │  1. Recebe requisição do frontend                        │  │
│  │  2. Busca credenciais do ambiente (seguro)               │  │
│  │  3. RENOVA access token com refresh token                │  │
│  │  4. Faz chamada para Google Ads API                      │  │
│  │  5. Retorna dados para frontend                          │  │
│  └──────────────────────────────────────────────────────────┘  │
│                              ↓                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  getAccessToken(config)                                   │  │
│  │  ↓                                                        │  │
│  │  fetch('https://oauth2.googleapis.com/token')            │  │
│  │  - client_id                                             │  │
│  │  - client_secret                                         │  │
│  │  - refresh_token  ← NUNCA EXPIRA                         │  │
│  │  - grant_type: 'refresh_token'                           │  │
│  │  ↓                                                        │  │
│  │  return NEW access_token (válido por 1 hora)             │  │
│  └──────────────────────────────────────────────────────────┘  │
│                              ↓                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  makeGoogleAdsRequest(query, customerId, config)         │  │
│  │  ↓                                                        │  │
│  │  accessToken = await getAccessToken(config)              │  │
│  │  ↓                                                        │  │
│  │  fetch('https://googleads.googleapis.com/v21/...')       │  │
│  │  headers: { Authorization: `Bearer ${accessToken}` }     │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              ↓ HTTPS
┌─────────────────────────────────────────────────────────────────┐
│                      GOOGLE ADS API                              │
│                                                                  │
│  - Valida access token (válido por 1 hora)                      │
│  - Retorna dados das campanhas                                  │
│  - Métricas, conversões, etc.                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔑 O SEGREDO: RENOVAÇÃO AUTOMÁTICA

### Fluxo Detalhado de CADA Requisição

```typescript
// ═══════════════════════════════════════════════════════════════
// PASSO 1: Frontend faz requisição
// ═══════════════════════════════════════════════════════════════
const campaigns = await googleAdsSupabaseService.getCampaignsWithMetrics(
  { since: '2024-11-01', until: '2024-11-30' },
  undefined,
  'ACCOUNT_1'
);

// ═══════════════════════════════════════════════════════════════
// PASSO 2: Service chama Edge Function
// ═══════════════════════════════════════════════════════════════
const response = await fetch(`${supabaseUrl}/functions/v1/google-ads-api`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${supabaseKey}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    action: 'campaigns-metrics',
    account: 'ACCOUNT_1',
    dateRange: { since: '2024-11-01', until: '2024-11-30' }
  })
});

// ═══════════════════════════════════════════════════════════════
// PASSO 3: Edge Function recebe e processa
// ═══════════════════════════════════════════════════════════════
serve(async (req) => {
  const { action, account, dateRange } = await req.json();
  
  // Busca config do ambiente (SEGURO - servidor)
  const config = getGoogleAdsConfig(account);
  // config = {
  //   client_id: 'xxx',
  //   client_secret: 'yyy',
  //   refresh_token: 'zzz',  ← ESTE NUNCA EXPIRA
  //   customer_id: '123',
  //   developer_token: 'www'
  // }
  
  // Chama handler
  const response = await handleGetCampaignsWithMetrics(config, { dateRange });
  
  return new Response(JSON.stringify(response));
});

// ═══════════════════════════════════════════════════════════════
// PASSO 4: Handler chama makeGoogleAdsRequest
// ═══════════════════════════════════════════════════════════════
async function handleGetCampaignsWithMetrics(config, body) {
  const query = `
    SELECT 
      campaign.id,
      campaign.name,
      metrics.impressions,
      metrics.clicks,
      metrics.cost_micros,
      metrics.conversions
    FROM campaign 
    WHERE segments.date >= '${body.dateRange.since}'
    AND segments.date <= '${body.dateRange.until}'
  `;
  
  // 🔑 AQUI ESTÁ A MÁGICA!
  const data = await makeGoogleAdsRequest(query, config.customer_id, config);
  
  return { success: true, data: data.results };
}

// ═══════════════════════════════════════════════════════════════
// PASSO 5: makeGoogleAdsRequest RENOVA o token
// ═══════════════════════════════════════════════════════════════
async function makeGoogleAdsRequest(query, customerId, config) {
  // 🎯 RENOVAÇÃO AUTOMÁTICA A CADA CHAMADA
  const accessToken = await getAccessToken(config);
  //     ↑
  //     └─── SEMPRE gera um NOVO access token
  //          usando o refresh token que NUNCA expira
  
  const headers = {
    'Authorization': `Bearer ${accessToken}`,  // ← Token FRESCO
    'developer-token': config.developer_token,
    'Content-Type': 'application/json',
  };
  
  const response = await fetch(
    `https://googleads.googleapis.com/v21/customers/${customerId}/googleAds:search`,
    {
      method: 'POST',
      headers,
      body: JSON.stringify({ query })
    }
  );
  
  return await response.json();
}

// ═══════════════════════════════════════════════════════════════
// PASSO 6: getAccessToken - O CORAÇÃO DO SISTEMA
// ═══════════════════════════════════════════════════════════════
async function getAccessToken(config: GoogleAdsConfig): Promise<string> {
  console.log('🔄 Renovando access token...');
  
  // 🎯 CHAMADA PARA OAUTH2 DO GOOGLE
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: config.client_id,           // ← Credencial OAuth
      client_secret: config.client_secret,   // ← Credencial OAuth
      refresh_token: config.refresh_token,   // ← 🔑 NUNCA EXPIRA!
      grant_type: 'refresh_token',           // ← Tipo de renovação
    }),
  });
  
  if (!response.ok) {
    throw new Error(`Erro ao renovar token: ${response.status}`);
  }
  
  const data = await response.json();
  // data = {
  //   access_token: 'ya29.a0AfB_byC...',  ← NOVO token (válido 1h)
  //   expires_in: 3599,                    ← Expira em 1 hora
  //   scope: 'https://www.googleapis.com/auth/adwords',
  //   token_type: 'Bearer'
  // }
  
  console.log('✅ Access token renovado com sucesso');
  return data.access_token;  // ← Retorna o NOVO access token
}
```

---

## 📝 IMPLEMENTAÇÃO PASSO A PASSO

### PASSO 1: Obter Refresh Token (APENAS UMA VEZ)

```bash
# 1. Acesse o OAuth Playground
https://developers.google.com/oauthplayground/

# 2. Configure suas credenciais
- Clique no ícone de engrenagem (⚙️)
- Marque "Use your own OAuth credentials"
- Cole seu Client ID
- Cole seu Client Secret

# 3. Adicione o scope
- No campo "Input your own scopes"
- Digite: https://www.googleapis.com/auth/adwords
- Clique em "Authorize APIs"

# 4. Autorize
- Faça login com sua conta Google
- Aceite as permissões

# 5. Obtenha o Refresh Token
- Clique em "Exchange authorization code for tokens"
- COPIE o "Refresh token" (começa com "1//...")
- ⚠️ GUARDE COM SEGURANÇA - você só verá isso UMA VEZ!
```

### PASSO 2: Configurar Variáveis de Ambiente

**No Supabase (Edge Function):**

```bash
# Vá para: Supabase Dashboard → Settings → Edge Functions → Secrets

# Adicione estas variáveis:
GOOGLE_ADS_CLIENT_ID_1=seu-client-id.apps.googleusercontent.com
GOOGLE_ADS_CLIENT_SECRET_1=GOCSPX-seu-client-secret
GOOGLE_ADS_REFRESH_TOKEN_1=1//seu-refresh-token-aqui
GOOGLE_ADS_CUSTOMER_ID_1=1234567890
GOOGLE_ADS_DEVELOPER_TOKEN=seu-developer-token
GOOGLE_ADS_MANAGER_ID_1=9876543210
```

**No Frontend (.env):**

```bash
# Apenas para indicar que está configurado
VITE_GOOGLE_CLIENT_ID=seu-client-id.apps.googleusercontent.com
VITE_GOOGLE_CLIENT_SECRET=GOCSPX-seu-client-secret
VITE_GOOGLE_REFRESH_TOKEN=1//seu-refresh-token-aqui
VITE_GOOGLE_CUSTOMER_ID=1234567890
VITE_GOOGLE_DEVELOPER_TOKEN=seu-developer-token
VITE_GOOGLE_LOGIN_CUSTOMER_ID=9876543210
```

### PASSO 3: Criar Edge Function

**Arquivo: `supabase/functions/google-ads-api/index.ts`**

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

interface GoogleAdsConfig {
  client_id: string | undefined;
  client_secret: string | undefined;
  refresh_token: string | undefined;
  customer_id: string | undefined;
  manager_customer_id: string | undefined;
  developer_token: string | undefined;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
}

// ═══════════════════════════════════════════════════════════════
// 🔑 FUNÇÃO PRINCIPAL - RENOVAÇÃO AUTOMÁTICA
// ═══════════════════════════════════════════════════════════════
async function getAccessToken(config: GoogleAdsConfig): Promise<string> {
  try {
    if (!config.client_id || !config.client_secret || !config.refresh_token) {
      throw new Error('Configuração incompleta')
    }

    // 🎯 CHAMADA QUE RENOVA O TOKEN
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: config.client_id,
        client_secret: config.client_secret,
        refresh_token: config.refresh_token,  // ← NUNCA EXPIRA
        grant_type: 'refresh_token',
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Erro ao renovar token: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    console.log('✅ Access token renovado com sucesso')
    return data.access_token  // ← NOVO token fresco
  } catch (error) {
    console.error('❌ Erro ao renovar access token:', error)
    throw error
  }
}

// ═══════════════════════════════════════════════════════════════
// FUNÇÃO PARA FAZER REQUISIÇÕES À GOOGLE ADS API
// ═══════════════════════════════════════════════════════════════
async function makeGoogleAdsRequest(
  query: string, 
  customerId: string, 
  config: GoogleAdsConfig
): Promise<any> {
  try {
    // 🔑 RENOVA O TOKEN A CADA REQUISIÇÃO
    const accessToken = await getAccessToken(config)
    
    const headers: Record<string, string> = {
      'Authorization': `Bearer ${accessToken}`,  // ← Token FRESCO
      'developer-token': config.developer_token!,
      'Content-Type': 'application/json',
      'login-customer-id': config.manager_customer_id || config.customer_id!
    }

    const url = `https://googleads.googleapis.com/v21/customers/${customerId}/googleAds:search`
    
    console.log('📡 Fazendo requisição para Google Ads API')

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({ query })
    })

    if (!response.ok) {
      const errorData = await response.text()
      throw new Error(`API Error: ${response.status} - ${errorData}`)
    }

    const data = await response.json()
    console.log(`✅ Requisição bem-sucedida: ${data.results?.length || 0} resultados`)
    return data
  } catch (error) {
    console.error('❌ Erro na requisição Google Ads:', error)
    throw error
  }
}

// ═══════════════════════════════════════════════════════════════
// CONFIGURAÇÃO DAS CONTAS
// ═══════════════════════════════════════════════════════════════
function getGoogleAdsConfig(accountKey: string = 'ACCOUNT_1'): GoogleAdsConfig {
  const configs = {
    ACCOUNT_1: {
      client_id: Deno.env.get('GOOGLE_ADS_CLIENT_ID_1'),
      client_secret: Deno.env.get('GOOGLE_ADS_CLIENT_SECRET_1'),
      refresh_token: Deno.env.get('GOOGLE_ADS_REFRESH_TOKEN_1'),
      customer_id: Deno.env.get('GOOGLE_ADS_CUSTOMER_ID_1'),
      manager_customer_id: Deno.env.get('GOOGLE_ADS_MANAGER_ID_1'),
      developer_token: Deno.env.get('GOOGLE_ADS_DEVELOPER_TOKEN'),
    },
    ACCOUNT_2: {
      client_id: Deno.env.get('GOOGLE_ADS_CLIENT_ID_2'),
      client_secret: Deno.env.get('GOOGLE_ADS_CLIENT_SECRET_2'),
      refresh_token: Deno.env.get('GOOGLE_ADS_REFRESH_TOKEN_2'),
      customer_id: Deno.env.get('GOOGLE_ADS_CUSTOMER_ID_2'),
      manager_customer_id: Deno.env.get('GOOGLE_ADS_MANAGER_ID_2'),
      developer_token: Deno.env.get('GOOGLE_ADS_DEVELOPER_TOKEN'),
    }
  }
  
  return configs[accountKey as keyof typeof configs] || configs.ACCOUNT_1
}

// ═══════════════════════════════════════════════════════════════
// SERVIDOR PRINCIPAL
// ═══════════════════════════════════════════════════════════════
serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { action, account, dateRange } = await req.json()
    
    console.log(`🚀 Processando ação: ${action} para conta: ${account}`)
    
    const config = getGoogleAdsConfig(account)
    
    // Validar configuração
    if (!config.client_id || !config.client_secret || !config.refresh_token) {
      throw new Error(`Configuração incompleta para ${account}`)
    }

    let response: any = { success: false }

    switch (action) {
      case 'campaigns-metrics':
        response = await handleGetCampaignsWithMetrics(config, { dateRange })
        break
      
      // ... outros cases
      
      default:
        response = {
          success: false,
          error: `Ação '${action}' não reconhecida`
        }
    }

    return new Response(
      JSON.stringify(response),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: response.success ? 200 : 400,
      },
    )

  } catch (error) {
    console.error('❌ Erro na Edge Function:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})

// ═══════════════════════════════════════════════════════════════
// HANDLER PARA CAMPANHAS COM MÉTRICAS
// ═══════════════════════════════════════════════════════════════
async function handleGetCampaignsWithMetrics(config: GoogleAdsConfig, body: any) {
  try {
    const { dateRange } = body
    
    const since = dateRange?.since || '2024-01-01'
    const until = dateRange?.until || '2024-12-31'

    const query = `
      SELECT 
        campaign.id,
        campaign.name,
        campaign.status,
        metrics.impressions,
        metrics.clicks,
        metrics.ctr,
        metrics.average_cpc,
        metrics.cost_micros,
        metrics.conversions,
        metrics.conversions_value
      FROM campaign 
      WHERE campaign.status IN ('ENABLED', 'PAUSED')
      AND segments.date >= '${since}'
      AND segments.date <= '${until}'
      ORDER BY campaign.name
    `

    console.log('🔍 Buscando campanhas com métricas...')

    // 🔑 AQUI A RENOVAÇÃO ACONTECE AUTOMATICAMENTE
    const data = await makeGoogleAdsRequest(query, config.customer_id!, config)
    const campaigns = data.results || []
    
    console.log(`✅ ${campaigns.length} campanhas encontradas`)

    return {
      success: true,
      data: campaigns,
      count: campaigns.length,
      dateRange: { since, until }
    }

  } catch (error) {
    console.error('❌ Erro ao buscar métricas:', error)
    return {
      success: false,
      error: error.message
    }
  }
}
```

### PASSO 4: Frontend Service

**Arquivo: `src/services/googleAdsSupabaseService.ts`**

```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

class GoogleAdsSupabaseService {
  // Buscar campanhas com métricas
  async getCampaignsWithMetrics(
    dateRange: { since: string; until: string }, 
    searchTerm?: string,
    accountKey: string = 'ACCOUNT_1'
  ) {
    try {
      console.log('📊 Buscando campanhas via Supabase Edge Function...');

      const requestBody = {
        action: 'campaigns-metrics',
        account: accountKey,
        dateRange,
        searchTerm
      };
      
      // 🔑 CHAMADA PARA EDGE FUNCTION
      // A renovação do token acontece automaticamente no backend
      const response = await fetch(
        `${supabase.supabaseUrl}/functions/v1/google-ads-api`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${supabase.supabaseKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody)
        }
      );
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
      
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Erro ao buscar campanhas');
      }

      console.log(`✅ ${data.count} campanhas carregadas`);
      
      return data.data || [];
    } catch (error) {
      console.error('❌ Erro ao buscar campanhas:', error);
      throw error;
    }
  }
}

export const googleAdsSupabaseService = new GoogleAdsSupabaseService();
```

---

## 🎯 COMO REPLICAR EM OUTRO SISTEMA

### Checklist Completo

#### ✅ 1. Obter Credenciais (APENAS UMA VEZ)

```bash
□ Client ID do Google Cloud Console
□ Client Secret do Google Cloud Console
□ Developer Token do Google Ads
□ Customer ID da conta Google Ads
□ Refresh Token do OAuth Playground (CRÍTICO!)
```

#### ✅ 2. Criar Backend/Edge Function

```bash
□ Criar função serverless (Supabase, Vercel, AWS Lambda, etc)
□ Adicionar variáveis de ambiente SEGURAS
□ Implementar função getAccessToken()
□ Implementar função makeGoogleAdsRequest()
□ Garantir que getAccessToken() é chamado A CADA requisição
```

#### ✅ 3. Implementar Renovação Automática

```typescript
// ⚠️ CRÍTICO: Esta função DEVE ser chamada a cada requisição
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
  return data.access_token  // ← Novo token a cada chamada
}

// ⚠️ CRÍTICO: Sempre renovar antes de usar
async function callGoogleAdsAPI(query, config) {
  // 🔑 RENOVAÇÃO AUTOMÁTICA
  const accessToken = await getAccessToken(config)
  
  // Usar o token FRESCO
  const response = await fetch(googleAdsApiUrl, {
    headers: {
      'Authorization': `Bearer ${accessToken}`  // ← Token NOVO
    }
  })
  
  return response.json()
}
```

#### ✅ 4. Configurar Frontend

```typescript
// Frontend NUNCA deve ter as credenciais
// Sempre chamar o backend/edge function

async function getCampaigns() {
  const response = await fetch('https://seu-backend.com/api/google-ads', {
    method: 'POST',
    body: JSON.stringify({
      action: 'campaigns',
      dateRange: { since: '2024-01-01', until: '2024-12-31' }
    })
  })
  
  return response.json()
}
```

#### ✅ 5. Testar

```bash
□ Fazer primeira requisição (deve funcionar)
□ Aguardar 2 horas
□ Fazer segunda requisição (deve funcionar - token renovado!)
□ Aguardar 1 dia
□ Fazer terceira requisição (deve funcionar - token renovado!)
□ Aguardar 1 semana
□ Fazer quarta requisição (deve funcionar - token renovado!)
```

---

## 🔧 TROUBLESHOOTING

### Problema: "Invalid grant" ou "Token has been expired or revoked"

**Causa:** Refresh token foi revogado ou expirou

**Solução:**
1. Gerar novo refresh token no OAuth Playground
2. Atualizar variável de ambiente
3. Reiniciar edge function/backend

```bash
# Verificar se refresh token ainda é válido
curl -X POST https://oauth2.googleapis.com/token \
  -d "client_id=SEU_CLIENT_ID" \
  -d "client_secret=SEU_CLIENT_SECRET" \
  -d "refresh_token=SEU_REFRESH_TOKEN" \
  -d "grant_type=refresh_token"

# Se retornar erro, precisa gerar novo refresh token
```

### Problema: "Access token expired"

**Causa:** Tentando reusar o mesmo access token por muito tempo

**Solução:**
Garantir que `getAccessToken()` é chamado A CADA requisição:

```typescript
// ❌ ERRADO - Reutilizando o mesmo token
const accessToken = await getAccessToken(config)

function makeRequest1() {
  fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } })
}

function makeRequest2() {
  fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } })
}

// ✅ CORRETO - Renovando a cada requisição
async function makeRequest1() {
  const accessToken = await getAccessToken(config)  // ← NOVO token
  fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } })
}

async function makeRequest2() {
  const accessToken = await getAccessToken(config)  // ← NOVO token
  fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } })
}
```

### Problema: "Refresh token not found"

**Causa:** Variável de ambiente não configurada

**Solução:**
```bash
# Verificar variáveis de ambiente
echo $GOOGLE_ADS_REFRESH_TOKEN_1

# Se vazio, adicionar no Supabase Dashboard ou .env
GOOGLE_ADS_REFRESH_TOKEN_1=1//seu-refresh-token-aqui
```

### Problema: Token funciona por dias e depois para

**Causa:** Refresh token revogado por inatividade (>6 meses) ou múltiplas tentativas simultâneas

**Solução:**
1. Usar o sistema regularmente (pelo menos 1x por mês)
2. Evitar múltiplas renovações simultâneas
3. Implementar retry logic com backoff

```typescript
async function getAccessTokenWithRetry(config, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await getAccessToken(config)
    } catch (error) {
      if (i === maxRetries - 1) throw error
      
      // Aguardar antes de tentar novamente
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)))
    }
  }
}
```

---

## 📊 COMPARAÇÃO: ANTES vs DEPOIS

### ❌ Sistema que EXPIRA (Comum)

```
Frontend
  ↓
  └─ Armazena refresh token no localStorage (INSEGURO)
  └─ Gera access token uma vez
  └─ Usa o mesmo access token por horas (EXPIRA!)
  └─ Quando expira, precisa re-autorizar OAuth (RUIM!)
```

### ✅ Sistema que NUNCA EXPIRA (Este Sistema)

```
Frontend
  ↓
  └─ Chama Edge Function (SEM credenciais)
      ↓
      Edge Function
        ↓
        └─ Credenciais seguras no servidor
        └─ A CADA requisição:
            1. Busca refresh token do ambiente
            2. Gera NOVO access token
            3. Usa token FRESCO na API
            4. Retorna dados
        └─ Refresh token NUNCA expira (usado corretamente)
```

---

## 🎓 CONCEITOS IMPORTANTES

### O que é Refresh Token?

- **Token de longa duração** que permite gerar novos access tokens
- **NUNCA expira** se usado corretamente
- **Deve ser armazenado com segurança** (servidor, não frontend)
- **Pode ser revogado** pelo usuário ou Google

### O que é Access Token?

- **Token de curta duração** (1 hora) usado para acessar APIs
- **Expira rapidamente** por segurança
- **Deve ser renovado** a cada requisição ou quando expirar
- **Gerado a partir do refresh token**

### Por que Renovar a Cada Requisição?

1. **Segurança**: Token sempre fresco, menor janela de ataque
2. **Simplicidade**: Não precisa gerenciar expiração
3. **Confiabilidade**: Sempre funciona, nunca expira
4. **Performance**: Overhead mínimo (~200ms por renovação)

---

## 📚 RECURSOS ADICIONAIS

### Documentação Oficial

- [Google OAuth 2.0](https://developers.google.com/identity/protocols/oauth2)
- [Google Ads API](https://developers.google.com/google-ads/api/docs)
- [OAuth Playground](https://developers.google.com/oauthplayground/)

### Ferramentas Úteis

- **OAuth Playground**: Gerar refresh tokens
- **Postman**: Testar APIs
- **Supabase CLI**: Deploy de edge functions

---

## ✅ CHECKLIST FINAL

Antes de implementar em outro sistema, verifique:

```bash
□ Tenho Client ID e Client Secret do Google Cloud Console
□ Tenho Developer Token do Google Ads
□ Tenho Refresh Token do OAuth Playground
□ Criei backend/edge function para armazenar credenciais
□ Implementei getAccessToken() que é chamado A CADA requisição
□ Implementei makeGoogleAdsRequest() que usa getAccessToken()
□ Frontend chama backend, não a API do Google diretamente
□ Variáveis de ambiente configuradas no servidor
□ Testei que funciona após várias horas
□ Testei que funciona após vários dias
```

---

## 🎯 RESUMO EXECUTIVO

### O SEGREDO em 3 Pontos:

1. **Refresh Token NUNCA expira** (se usado corretamente)
2. **Access Token é renovado A CADA requisição** (usando refresh token)
3. **Credenciais no SERVIDOR, não no frontend** (segurança)

### Implementação Mínima:

```typescript
// Backend/Edge Function
async function getAccessToken(refreshToken, clientId, clientSecret) {
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,  // ← NUNCA EXPIRA
      grant_type: 'refresh_token',
    }),
  })
  
  const data = await response.json()
  return data.access_token  // ← NOVO token a cada chamada
}

async function callGoogleAds(query) {
  // 🔑 RENOVAR A CADA REQUISIÇÃO
  const token = await getAccessToken(REFRESH_TOKEN, CLIENT_ID, CLIENT_SECRET)
  
  const response = await fetch(GOOGLE_ADS_API_URL, {
    headers: { Authorization: `Bearer ${token}` }
  })
  
  return response.json()
}
```

---

**Documentação criada em:** 26 de Novembro de 2025  
**Autor:** Sistema ÚnicaPro  
**Versão:** 1.0.0  

**⚠️ IMPORTANTE:** Guarde esta documentação com segurança. Ela contém o segredo de por que o sistema funciona perfeitamente há meses sem expirar!

---

## 📞 SUPORTE

Se tiver dúvidas ao implementar em outro sistema:

1. Verifique se seguiu TODOS os passos desta documentação
2. Verifique os logs da edge function/backend
3. Teste o refresh token manualmente (curl)
4. Confirme que getAccessToken() é chamado A CADA requisição

**Boa sorte! 🚀**

