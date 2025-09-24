# 📁 Arquivos da Integração Google Ads

## 🎯 Arquivo Principal da Edge Function

**📍 LOCALIZAÇÃO:** `supabase/functions/google-ads-api/index.ts`

**✅ STATUS:** Este é o arquivo correto e único da edge function
- ✅ Deployado e funcionando
- ✅ Contém toda a lógica da API Google Ads
- ✅ Configurado para usar secrets do Supabase
- ✅ Suporte a múltiplos endpoints

## 📋 Lista Completa de Arquivos

### 🔧 Backend (Supabase)
```
supabase/functions/google-ads-api/
├── index.ts                    ← ARQUIVO PRINCIPAL DA EDGE FUNCTION
└── (outros arquivos removidos) ← Limpeza realizada
```

### 🎨 Frontend (React/Vite)
```
src/service/
├── googlePatrocinadoService.js ← Serviço principal do frontend
└── (outros serviços...)
```

### ⚙️ Configurações
```
├── .env                        ← Credenciais e configurações
├── env.example                 ← Exemplo de configuração
└── supabase/config.toml        ← Configuração do Supabase
```

### 📚 Documentação
```
PLANEJAMENTO/google ads/
├── DOCUMENTACAO_INTEGRACAO_GOOGLE_ADS.md ← Esta documentação
└── ARQUIVOS_INTEGRACAO.md                ← Este arquivo
```

## 🔍 Detalhes do Arquivo Principal

### `supabase/functions/google-ads-api/index.ts`

**Funções principais:**
- `getGoogleAdsCredentials()` - Busca credenciais dos secrets
- `getAccessToken()` - Obtém token OAuth2 do Google
- `queryGoogleAds()` - Executa queries na Google Ads API
- `handleTestConnection()` - Teste de conexão
- `handleGetCampaigns()` - Busca campanhas
- `handleGetCampaignMetrics()` - Métricas específicas
- `handleGetStats()` - Estatísticas gerais
- `handleGetAccountBalance()` - Saldo da conta
- `handleDebugUnidades()` - Debug das unidades

**Endpoints disponíveis:**
- `/test-connection`
- `/campaigns`
- `/campaign-metrics`
- `/stats`
- `/account-balance`
- `/debug-unidades`

## 🗑️ Arquivos Removidos (Limpeza)

Durante a limpeza, foram removidos os seguintes arquivos duplicados:
- `index-final-complete.ts`
- `index-final.ts`
- `index-fixed.ts`
- `index-apucarana-fix.ts`
- `handleTestConnection-fixed.ts`

**Motivo:** Mantiveram apenas o arquivo `index.ts` principal que é o mais completo e atualizado.

## 🔧 Arquivo de Configuração

### `.env` (Raiz do Projeto)

**Seção Supabase:**
```env
VITE_SUPABASE_URL=https://agdffspstbxeqhqtltvb.supabase.co
VITE_SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_SUPABASE_SCHEMA=api
```

**Seção Google Ads:**
```env
VITE_GOOGLE_CUSTOMER_ID=8802039556
VITE_GOOGLE_LOGIN_CUSTOMER_ID=7396178858
VITE_GOOGLE_DEVELOPER_TOKEN=xw46jmZN-n_wf7uCsC8daA
VITE_GOOGLE_CLIENT_ID=415018341135-v3hjpjgqek6688r5eio8tl48229qbrrd.apps.googleusercontent.com
VITE_GOOGLE_CLIENT_SECRET=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
VITE_GOOGLE_REFRESH_TOKEN=1//04nNcHk0eHaq4CgYIARAAGAQSNwF-L9IrV-LGJvWjk8165av-tcK5Bgjx-u0KRJfh3E9Z11uU0jn-GOBAMWQgjdMMvazRBaHs90M
```

## 🚀 Como Usar

### 1. Verificar Arquivo Principal
```bash
# Verificar se existe apenas o arquivo correto
ls supabase/functions/google-ads-api/
# Deve mostrar apenas: index.ts
```

### 2. Fazer Deploy
```bash
cd supabase
npx supabase functions deploy google-ads-api --project-ref agdffspstbxeqhqtltvb
```

### 3. Testar API
```bash
# Teste de conexão
curl -X GET "https://agdffspstbxeqhqtltvb.supabase.co/functions/v1/google-ads-api/test-connection" \
  -H "Authorization: Bearer [SERVICE_ROLE_KEY]"
```

## ⚠️ Importante

- **NÃO** criar novos arquivos na pasta `google-ads-api`
- **NÃO** modificar o nome do arquivo `index.ts`
- **SEMPRE** usar o arquivo `index.ts` como base
- **SEMPRE** fazer deploy após modificações

## 📞 Suporte

Em caso de dúvidas sobre os arquivos:
1. Verificar esta documentação
2. Consultar logs da Edge Function no Supabase Dashboard
3. Verificar arquivo `.env` para credenciais
4. Testar endpoints individualmente

---

**Arquivo Principal:** `supabase/functions/google-ads-api/index.ts`  
**Status:** ✅ Funcionando  
**Última Atualização:** 24/09/2025
