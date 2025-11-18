# 📋 Deploy das Supabase Edge Functions

## **Pré-requisitos**

1. **Instalar Supabase CLI:**
```bash
npm install -g supabase
```

2. **Login no Supabase:**
```bash
supabase login
```

3. **Conectar ao projeto:**
```bash
supabase link --project-ref agdffspstbxeqhqtltvb
```

## **Deploy da Edge Function**

### **1. Deploy da função:**
```bash
supabase functions deploy google-ads-api
```

### **2. Configurar variáveis de ambiente na Supabase:**

Acesse o dashboard do Supabase em:
https://supabase.com/dashboard/project/agdffspstbxeqhqtltvb/settings/functions

Adicione as seguintes variáveis:
- `SUPABASE_URL`: `https://agdffspstbxeqhqtltvb.supabase.co`
- `SUPABASE_SERVICE_ROLE_KEY`: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFnZGZmc3BzdGJ4ZXFocXRsdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDQ1MzY2NiwiZXhwIjoyMDY2MDI5NjY2fQ.grInwGHFAH2WYvYerwfHkUsM08wXCJASg4CPMD2cTaA`

## **Endpoints da Edge Function**

Após o deploy, a API ficará disponível em:
`https://agdffspstbxeqhqtltvb.supabase.co/functions/v1/google-ads-api`

### **Endpoints disponíveis:**
- `GET /test-connection` - Teste de conexão
- `GET /campaigns?status=active` - Listar campanhas
- `GET /campaigns/{id}/adgroups` - Grupos de anúncios
- `GET /adgroups/{id}/ads` - Anúncios
- `GET /stats?startDate=2025-01-01&endDate=2025-01-31` - Estatísticas
- `GET /account-balance` - Saldo da conta

## **Testando a Edge Function**

### **1. Teste local (desenvolvimento):**
```bash
supabase start
supabase functions serve google-ads-api
```

A função ficará disponível em: `http://localhost:54321/functions/v1/google-ads-api`

### **2. Teste de conexão:**
```bash
curl -X GET "https://agdffspstbxeqhqtltvb.supabase.co/functions/v1/google-ads-api/test-connection"
```

## **Vantagens das Edge Functions**

✅ **Serverless** - Sem necessidade de manter servidor rodando 24/7
✅ **Mais rápido** - Executado na borda (edge computing)
✅ **Mais barato** - Paga apenas pelo que usa
✅ **Escalável** - Escala automaticamente
✅ **Integração nativa** - Acesso direto ao Supabase
✅ **CORS configurado** - Funciona direto no frontend

## **Arquitetura Final**

```
Frontend (Vite/React) 
    ↓
Supabase Edge Functions 
    ↓ 
Google Ads API
```

## **Comandos úteis**

```bash
# Ver logs da função
supabase functions logs google-ads-api

# Redeploy após mudanças
supabase functions deploy google-ads-api --no-verify-jwt

# Testar localmente
supabase functions serve google-ads-api --debug
```