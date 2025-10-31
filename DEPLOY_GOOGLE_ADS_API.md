# 🚀 Deploy da Edge Function Google Ads API

## 📋 Passos para fazer o Deploy

### **1️⃣ Login no Supabase CLI**

Execute no terminal (PowerShell ou CMD):

```bash
npx supabase login
```

Isso vai abrir o navegador para você fazer login. Se não abrir, copie o link que aparece no terminal.

### **2️⃣ Linkar o projeto (se necessário)**

```bash
cd supabase
npx supabase link --project-ref agdffspstbxeqhqtltvb
```

### **3️⃣ Deploy da Edge Function**

```bash
npx supabase functions deploy google-ads-api --project-ref agdffspstbxeqhqtltvb
```

## ✅ Verificação

### **Listar funções deployadas:**
```bash
npx supabase functions list --project-ref agdffspstbxeqhqtltvb
```

### **Ver logs da função:**
```bash
npx supabase functions logs google-ads-api --project-ref agdffspstbxeqhqtltvb
```

## 🔧 Verificar Secrets Necessários

Antes de testar, certifique-se de que todos os secrets estão configurados no Supabase Dashboard:

**Acesse:** https://supabase.com/dashboard/project/agdffspstbxeqhqtltvb/settings/functions

### Secrets necessários:
- ✅ `VITE_GOOGLE_CLIENT_ID` = `415018341135-v3hjpjgqek6688r5eio8tl48229qbrrd.apps.googleusercontent.com`
- ✅ `VITE_GOOGLE_CLIENT_SECRET` = `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`
- ✅ `VITE_GOOGLE_REFRESH_TOKEN` = (seu refresh token atualizado)
- ✅ `VITE_GOOGLE_CUSTOMER_ID` = (ID da conta Google Ads)
- ✅ `VITE_GOOGLE_DEVELOPER_TOKEN` = (Developer Token do Google Ads)
- ✅ `VITE_GOOGLE_LOGIN_CUSTOMER_ID` = (opcional - ID da conta gerenciadora MCC)

### Variáveis de ambiente do Supabase (automáticas):
- `SUPABASE_URL` - configurada automaticamente
- `SUPABASE_SERVICE_ROLE_KEY` - configurada automaticamente

## 🧪 Testar após o Deploy

### **Teste de conexão:**
```powershell
$headers = @{
    "Authorization" = "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFnZGZmc3BzdGJ4ZXFocXRsdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDQ1MzY2NiwiZXhwIjoyMDY2MDI5NjY2fQ.grInwGHFAH2WYvYerwfHkUsM08wXCJASg4CPMD2cTaA"
    "Content-Type" = "application/json"
}
$response = Invoke-RestMethod -Uri "https://agdffspstbxeqhqtltvb.supabase.co/functions/v1/google-ads-api/test-connection" -Method GET -Headers $headers
$response | ConvertTo-Json -Depth 10
```

### **Testar renovação de refresh token:**
```powershell
$headers = @{
    "Authorization" = "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFnZGZmc3BzdGJ4ZXFocXRsdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDQ1MzY2NiwiZXhwIjoyMDY2MDI5NjY2fQ.grInwGHFAH2WYvYerwfHkUsM08wXCJASg4CPMD2cTaA"
    "Content-Type" = "application/json"
}
$response = Invoke-RestMethod -Uri "https://agdffspstbxeqhqtltvb.supabase.co/functions/v1/google-ads-api/renew-refresh-token" -Method GET -Headers $headers
$response | ConvertTo-Json -Depth 10
```

## 📝 Endpoints Disponíveis

Após o deploy, a API ficará disponível em:
`https://agdffspstbxeqhqtltvb.supabase.co/functions/v1/google-ads-api`

### **Endpoints:**
- `GET /test-connection` - Teste de conexão
- `GET /renew-refresh-token` - **NOVO!** Renova o refresh token preventivamente
- `GET /campaigns?status=active` - Listar campanhas
- `GET /campaign-metrics?campaign_id=123&start_date=2025-01-01&end_date=2025-01-31` - Métricas da campanha
- `GET /stats?startDate=2025-01-01&endDate=2025-01-31` - Estatísticas gerais
- `GET /account-balance` - Saldo da conta

## 🔄 Novidades Implementadas

✅ **Cache automático de access token** - Renovação antes de expirar  
✅ **Renovação automática do refresh token** - Mantém o token definitivo  
✅ **Endpoint `/renew-refresh-token`** - Para renovação preventiva periódica  
✅ **Melhor tratamento de erros** - Mensagens mais claras sobre credenciais

## 💡 Dica: Configurar Cron Job para Renovação

Para manter o refresh token sempre válido, configure um cron job que chame `/renew-refresh-token` diariamente no Supabase Dashboard.

---

**Nota:** Se você já tem o token de acesso do Supabase CLI, pode definir como variável de ambiente:

```powershell
$env:SUPABASE_ACCESS_TOKEN = "seu-token-aqui"
```

Ou via Dashboard do Supabase em: Settings → Access Tokens

