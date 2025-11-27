# 📋 CÓDIGO PRONTO - Copiar e Colar

## 🎯 OBJETIVO

Este arquivo contém código PRONTO para copiar e colar no outro sistema. Basta seguir as instruções e substituir as variáveis.

---

## 📦 ARQUIVO 1: Edge Function Completa

**Caminho:** `supabase/functions/google-ads-api/index.ts`

```typescript
/// <reference types="https://esm.sh/@supabase/functions-js/src/edge-runtime.d.ts" />

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

// ═══════════════════════════════════════════════════════════════
// INTERFACES
// ═══════════════════════════════════════════════════════════════

interface GoogleAdsConfig {
  client_id: string | undefined;
  client_secret: string | undefined;
  refresh_token: string | undefined;
  customer_id: string | undefined;
  manager_customer_id: string | undefined;
  developer_token: string | undefined;
}

interface GoogleAdsMetrics {
  impressions: number;
  clicks: number;
  ctr: number;
  average_cpc: number;
  cost_micros: number;
  cost: number;
  conversions: number;
  conversions_value: number;
}

interface GoogleAdsCampaign {
  id: string;
  name: string;
  status: string;
  advertising_channel_type: string;
  metrics?: GoogleAdsMetrics;
}

// ═══════════════════════════════════════════════════════════════
// CORS HEADERS
// ═══════════════════════════════════════════════════════════════

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
}

// ═══════════════════════════════════════════════════════════════
// 🔑 FUNÇÃO CRÍTICA - RENOVAÇÃO DO ACCESS TOKEN
// ═══════════════════════════════════════════════════════════════

async function getAccessToken(config: GoogleAdsConfig): Promise<string> {
  try {
    if (!config.client_id || !config.client_secret || !config.refresh_token) {
      throw new Error('Configuração incompleta: client_id, client_secret ou refresh_token não definidos')
    }

    console.log('🔄 Renovando access token...')

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
    return data.access_token  // ← NOVO token (válido 1 hora)
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
// VALIDAR CONFIGURAÇÃO
// ═══════════════════════════════════════════════════════════════

function validateConfig(config: GoogleAdsConfig): void {
  if (!config.customer_id) {
    throw new Error('Customer ID não configurado')
  }
  if (!config.developer_token) {
    throw new Error('Developer token não configurado')
  }
  if (!config.client_id || !config.client_secret || !config.refresh_token) {
    throw new Error('Credenciais OAuth não configuradas')
  }
}

// ═══════════════════════════════════════════════════════════════
// HANDLER: CAMPANHAS COM MÉTRICAS
// ═══════════════════════════════════════════════════════════════

async function handleGetCampaignsWithMetrics(config: GoogleAdsConfig, body: any) {
  try {
    validateConfig(config)
    
    const { dateRange } = body
    const since = dateRange?.since || '2024-01-01'
    const until = dateRange?.until || '2024-12-31'

    console.log('📊 Buscando campanhas com métricas...')
    console.log('📅 Período:', { since, until })

    const query = `
      SELECT 
        campaign.id,
        campaign.name,
        campaign.status,
        campaign.advertising_channel_type,
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
      LIMIT 100
    `

    // 🔑 AQUI A RENOVAÇÃO ACONTECE AUTOMATICAMENTE
    const data = await makeGoogleAdsRequest(query, config.customer_id!, config)
    const campaigns = data.results || []
    
    console.log(`✅ ${campaigns.length} campanhas encontradas`)

    // Processar campanhas
    const processedCampaigns = campaigns.map((result: any) => {
      const campaign = result.campaign
      const metrics = result.metrics
      
      return {
        id: campaign?.id || '',
        name: campaign?.name || '',
        status: campaign?.status || '',
        advertising_channel_type: campaign?.advertisingChannelType || 'SEARCH',
        metrics: {
          impressions: parseInt(metrics?.impressions) || 0,
          clicks: parseInt(metrics?.clicks) || 0,
          ctr: parseFloat(metrics?.ctr) || 0,
          average_cpc: parseInt(metrics?.averageCpc) || 0,
          cost_micros: parseInt(metrics?.costMicros) || 0,
          cost: (parseInt(metrics?.costMicros) || 0) / 1000000,
          conversions: parseFloat(metrics?.conversions) || 0,
          conversions_value: parseFloat(metrics?.conversionsValue) || 0,
        }
      }
    })

    return {
      success: true,
      data: processedCampaigns,
      count: processedCampaigns.length,
      dateRange: { since, until },
      message: `✅ ${processedCampaigns.length} campanhas com métricas`
    }

  } catch (error) {
    console.error('❌ Erro ao buscar métricas:', error)
    return {
      success: false,
      error: error.message || 'Erro ao buscar métricas'
    }
  }
}

// ═══════════════════════════════════════════════════════════════
// HANDLER: VALIDAR CONEXÃO
// ═══════════════════════════════════════════════════════════════

async function handleValidateConnection(config: GoogleAdsConfig) {
  try {
    console.log('🔍 Validando conexão...')
    validateConfig(config)

    const query = `
      SELECT 
        customer.id,
        customer.descriptive_name,
        customer.status
      FROM customer 
      WHERE customer.id = ${config.customer_id}
    `

    const data = await makeGoogleAdsRequest(query, config.customer_id!, config)
    
    return {
      success: true,
      connected: true,
      message: 'Conexão validada com sucesso',
      data: data.results?.[0]?.customer || null
    }
  } catch (error) {
    console.error('❌ Erro na validação:', error)
    return {
      success: false,
      connected: false,
      error: error.message || 'Erro ao validar conexão'
    }
  }
}

// ═══════════════════════════════════════════════════════════════
// SERVIDOR PRINCIPAL
// ═══════════════════════════════════════════════════════════════

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { action, account, dateRange } = await req.json()
    
    console.log(`🚀 Processando ação: ${action} para conta: ${account || 'ACCOUNT_1'}`)
    
    const config = getGoogleAdsConfig(account || 'ACCOUNT_1')
    
    // Validar configuração básica
    if (!config.client_id || !config.client_secret || !config.refresh_token) {
      throw new Error(`Configuração incompleta para ${account || 'ACCOUNT_1'}`)
    }

    let response: any = { success: false, error: 'Ação não reconhecida' }

    switch (action) {
      case 'validate':
        response = await handleValidateConnection(config)
        break
      
      case 'campaigns-metrics':
        response = await handleGetCampaignsWithMetrics(config, { dateRange })
        break
      
      default:
        response = {
          success: false,
          error: `Ação '${action}' não reconhecida`,
          availableActions: ['validate', 'campaigns-metrics']
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
        error: error.message || 'Erro interno'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})
```

---

## 📦 ARQUIVO 2: Frontend Service

**Caminho:** `src/services/googleAdsSupabaseService.ts`

```typescript
import { createClient } from '@supabase/supabase-js';

// ═══════════════════════════════════════════════════════════════
// CONFIGURAÇÃO
// ═══════════════════════════════════════════════════════════════

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️ Variáveis VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY não configuradas');
}

const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '');

// ═══════════════════════════════════════════════════════════════
// INTERFACES
// ═══════════════════════════════════════════════════════════════

export interface GoogleAdsCampaign {
  id: string;
  name: string;
  status: string;
  advertising_channel_type: string;
  metrics?: {
    impressions: number;
    clicks: number;
    cost_micros: number;
    cost: number;
    conversions: number;
    conversions_value: number;
    ctr: number;
    average_cpc: number;
  };
}

// ═══════════════════════════════════════════════════════════════
// SERVICE
// ═══════════════════════════════════════════════════════════════

class GoogleAdsSupabaseService {
  
  // Verificar se está configurado
  isConfigured(): boolean {
    return !!(supabaseUrl && supabaseAnonKey);
  }

  // Validar conexão
  async validateConnection(accountKey: string = 'ACCOUNT_1'): Promise<{
    connected: boolean;
    message: string;
    data?: any;
  }> {
    try {
      console.log('🔍 Validando conexão via Supabase Edge Function...');

      const response = await fetch(
        `${supabaseUrl}/functions/v1/google-ads-api`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${supabaseAnonKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'validate',
            account: accountKey
          })
        }
      );

      const data = await response.json();

      return {
        connected: data.success,
        message: data.message || 'Conexão testada',
        data: data.data
      };
    } catch (error) {
      console.error('❌ Erro ao validar conexão:', error);
      return {
        connected: false,
        message: error.message || 'Erro ao validar conexão'
      };
    }
  }

  // Buscar campanhas com métricas
  async getCampaignsWithMetrics(
    dateRange: { since: string; until: string },
    searchTerm?: string,
    accountKey: string = 'ACCOUNT_1'
  ): Promise<GoogleAdsCampaign[]> {
    try {
      console.log('📊 Buscando campanhas via Supabase Edge Function...');
      console.log('📅 Período:', dateRange);

      const requestBody = {
        action: 'campaigns-metrics',
        account: accountKey,
        dateRange,
        searchTerm
      };
      
      // 🔑 CHAMADA PARA EDGE FUNCTION
      // A renovação do token acontece automaticamente no backend
      const response = await fetch(
        `${supabaseUrl}/functions/v1/google-ads-api`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${supabaseAnonKey}`,
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

## 📦 ARQUIVO 3: Variáveis de Ambiente

### Supabase Dashboard → Settings → Edge Functions → Secrets

```bash
# ═══════════════════════════════════════════════════════════════
# GOOGLE ADS API - CONTA 1
# ═══════════════════════════════════════════════════════════════

GOOGLE_ADS_CLIENT_ID_1=seu-client-id.apps.googleusercontent.com
GOOGLE_ADS_CLIENT_SECRET_1=GOCSPX-seu-client-secret
GOOGLE_ADS_REFRESH_TOKEN_1=1//seu-refresh-token-aqui
GOOGLE_ADS_CUSTOMER_ID_1=1234567890
GOOGLE_ADS_MANAGER_ID_1=9876543210
GOOGLE_ADS_DEVELOPER_TOKEN=seu-developer-token

# ═══════════════════════════════════════════════════════════════
# GOOGLE ADS API - CONTA 2 (Opcional)
# ═══════════════════════════════════════════════════════════════

GOOGLE_ADS_CLIENT_ID_2=segundo-client-id.apps.googleusercontent.com
GOOGLE_ADS_CLIENT_SECRET_2=GOCSPX-segundo-client-secret
GOOGLE_ADS_REFRESH_TOKEN_2=1//segundo-refresh-token
GOOGLE_ADS_CUSTOMER_ID_2=0987654321
GOOGLE_ADS_MANAGER_ID_2=1234567890
```

### Frontend `.env`

```bash
# ═══════════════════════════════════════════════════════════════
# SUPABASE
# ═══════════════════════════════════════════════════════════════

VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-anon-key-aqui

# ═══════════════════════════════════════════════════════════════
# GOOGLE ADS (Opcional - apenas para indicar que está configurado)
# ═══════════════════════════════════════════════════════════════

VITE_GOOGLE_CLIENT_ID=seu-client-id.apps.googleusercontent.com
VITE_GOOGLE_CUSTOMER_ID=1234567890
```

---

## 📦 ARQUIVO 4: Hook React (Opcional)

**Caminho:** `src/hooks/useGoogleAds.ts`

```typescript
import { useState, useEffect } from 'react';
import { googleAdsSupabaseService } from '../services/googleAdsSupabaseService';
import type { GoogleAdsCampaign } from '../services/googleAdsSupabaseService';

export function useGoogleAds() {
  const [campaigns, setCampaigns] = useState<GoogleAdsCampaign[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Validar conexão
  const validateConnection = async (accountKey: string = 'ACCOUNT_1') => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await googleAdsSupabaseService.validateConnection(accountKey);
      
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao validar conexão';
      setError(errorMessage);
      return { connected: false, message: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Buscar campanhas com métricas
  const getCampaignsWithMetrics = async (
    dateRange: { since: string; until: string },
    accountKey: string = 'ACCOUNT_1'
  ) => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await googleAdsSupabaseService.getCampaignsWithMetrics(
        dateRange,
        undefined,
        accountKey
      );
      
      setCampaigns(data);
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao buscar campanhas';
      setError(errorMessage);
      setCampaigns([]);
      return [];
    } finally {
      setLoading(false);
    }
  };

  return {
    campaigns,
    loading,
    error,
    validateConnection,
    getCampaignsWithMetrics,
  };
}
```

---

## 📦 ARQUIVO 5: Exemplo de Uso no Componente

**Caminho:** `src/components/GoogleAdsExample.tsx`

```typescript
import React, { useState } from 'react';
import { useGoogleAds } from '../hooks/useGoogleAds';

export function GoogleAdsExample() {
  const { campaigns, loading, error, validateConnection, getCampaignsWithMetrics } = useGoogleAds();
  const [dateRange, setDateRange] = useState({
    since: '2024-01-01',
    until: '2024-12-31'
  });

  const handleValidate = async () => {
    const result = await validateConnection('ACCOUNT_1');
    console.log('Validação:', result);
    alert(result.connected ? 'Conexão OK!' : 'Erro: ' + result.message);
  };

  const handleLoadCampaigns = async () => {
    await getCampaignsWithMetrics(dateRange, 'ACCOUNT_1');
  };

  return (
    <div>
      <h1>Google Ads Dashboard</h1>
      
      <div>
        <button onClick={handleValidate} disabled={loading}>
          🔍 Validar Conexão
        </button>
        
        <button onClick={handleLoadCampaigns} disabled={loading}>
          📊 Carregar Campanhas
        </button>
      </div>

      {loading && <p>Carregando...</p>}
      {error && <p style={{ color: 'red' }}>Erro: {error}</p>}

      <div>
        <h2>Campanhas ({campaigns.length})</h2>
        {campaigns.map(campaign => (
          <div key={campaign.id} style={{ border: '1px solid #ccc', padding: '10px', margin: '10px 0' }}>
            <h3>{campaign.name}</h3>
            <p>Status: {campaign.status}</p>
            {campaign.metrics && (
              <div>
                <p>Impressões: {campaign.metrics.impressions.toLocaleString()}</p>
                <p>Cliques: {campaign.metrics.clicks.toLocaleString()}</p>
                <p>Custo: R$ {campaign.metrics.cost.toFixed(2)}</p>
                <p>Conversões: {campaign.metrics.conversions}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## 🔧 INSTRUÇÕES DE INSTALAÇÃO

### 1. Criar Edge Function

```bash
# Criar diretório
mkdir -p supabase/functions/google-ads-api

# Copiar código do ARQUIVO 1 para:
# supabase/functions/google-ads-api/index.ts
```

### 2. Deploy da Edge Function

```bash
# Login no Supabase
supabase login

# Deploy
supabase functions deploy google-ads-api
```

### 3. Configurar Secrets

```bash
# No Supabase Dashboard:
# Settings → Edge Functions → Secrets

# Adicionar todas as variáveis do ARQUIVO 3
```

### 4. Instalar Dependências no Frontend

```bash
npm install @supabase/supabase-js
```

### 5. Criar Arquivos do Frontend

```bash
# Copiar ARQUIVO 2 para:
# src/services/googleAdsSupabaseService.ts

# Copiar ARQUIVO 4 para:
# src/hooks/useGoogleAds.ts

# Copiar ARQUIVO 5 para:
# src/components/GoogleAdsExample.tsx
```

### 6. Configurar .env

```bash
# Copiar variáveis do ARQUIVO 3 (seção Frontend) para:
# .env
```

### 7. Testar

```bash
# Iniciar aplicação
npm run dev

# Acessar componente de exemplo
# Clicar em "Validar Conexão"
# Clicar em "Carregar Campanhas"
```

---

## ✅ CHECKLIST DE IMPLEMENTAÇÃO

```bash
□ Copiei código do ARQUIVO 1 para edge function
□ Fiz deploy da edge function
□ Configurei secrets no Supabase Dashboard
□ Copiei código do ARQUIVO 2 para frontend service
□ Copiei código do ARQUIVO 4 para hook (opcional)
□ Copiei código do ARQUIVO 5 para componente exemplo (opcional)
□ Configurei .env do frontend
□ Instalei dependências (npm install @supabase/supabase-js)
□ Testei validação de conexão
□ Testei busca de campanhas
□ Funciona! 🎉
```

---

## 🎯 PONTOS CRÍTICOS

### ⚠️ NÃO ESQUEÇA

1. **Substituir variáveis de ambiente** com seus valores reais
2. **getAccessToken() DEVE ser chamado a cada requisição**
3. **Credenciais DEVEM ficar no servidor** (Supabase Secrets)
4. **Frontend NUNCA deve ter refresh token**

### ✅ GARANTIR QUE

1. Refresh token está correto (começa com `1//`)
2. Customer ID está sem hífens (apenas números)
3. Developer Token está aprovado
4. Todas as variáveis estão configuradas

---

## 🚀 PRONTO!

Agora você tem TODO o código necessário para implementar no outro sistema.

**Basta:**
1. Copiar os arquivos
2. Substituir as variáveis
3. Fazer deploy
4. Testar
5. Funciona! 🎉

---

**Criado:** 26/11/2025  
**Versão:** 1.0  
**Status:** ✅ Código testado e funcionando

