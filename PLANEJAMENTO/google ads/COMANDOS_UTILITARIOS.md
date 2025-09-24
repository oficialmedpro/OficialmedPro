# 🛠️ Comandos Utilitários - Google Ads API

## 🚀 Comandos de Deploy

### Deploy da Edge Function
```bash
# Navegar para pasta supabase
cd supabase

# Deploy da function
npx supabase functions deploy google-ads-api --project-ref agdffspstbxeqhqtltvb
```

### Verificar Deploy
```bash
# Listar functions deployadas
npx supabase functions list --project-ref agdffspstbxeqhqtltvb
```

## 🔍 Comandos de Teste

### Teste de Conexão
```bash
# PowerShell
$headers = @{"Authorization" = "Bearer [SERVICE_ROLE_KEY]"; "Content-Type" = "application/json"}
$response = Invoke-RestMethod -Uri "https://agdffspstbxeqhqtltvb.supabase.co/functions/v1/google-ads-api/test-connection" -Method GET -Headers $headers
$response | ConvertTo-Json -Depth 10
```

### Teste de Campanhas
```bash
# PowerShell - Buscar campanhas de uma data específica
$headers = @{"Authorization" = "Bearer [SERVICE_ROLE_KEY]"; "Content-Type" = "application/json"}
$response = Invoke-RestMethod -Uri "https://agdffspstbxeqhqtltvb.supabase.co/functions/v1/google-ads-api/campaigns?status=all&startDate=2025-09-24&endDate=2025-09-24" -Method GET -Headers $headers
$response | ConvertTo-Json -Depth 10
```

### Teste de Estatísticas
```bash
# PowerShell - Buscar estatísticas de um período
$headers = @{"Authorization" = "Bearer [SERVICE_ROLE_KEY]"; "Content-Type" = "application/json"}
$response = Invoke-RestMethod -Uri "https://agdffspstbxeqhqtltvb.supabase.co/functions/v1/google-ads-api/stats?startDate=2025-09-01&endDate=2025-09-30" -Method GET -Headers $headers
$response | ConvertTo-Json -Depth 10
```

## 🔧 Comandos de Configuração

### Verificar Secrets do Supabase
```bash
# Listar todos os secrets
cd supabase
npx supabase secrets list --project-ref agdffspstbxeqhqtltvb
```

### Verificar Arquivo .env
```bash
# Windows PowerShell
Get-Content .env

# Linux/Mac
cat .env
```

### Verificar Estrutura de Arquivos
```bash
# Verificar edge function
ls supabase/functions/google-ads-api/

# Deve mostrar apenas: index.ts
```

## 🧪 Comandos de Debug

### Debug das Unidades
```bash
# PowerShell
$headers = @{"Authorization" = "Bearer [SERVICE_ROLE_KEY]"; "Content-Type" = "application/json"}
$response = Invoke-RestMethod -Uri "https://agdffspstbxeqhqtltvb.supabase.co/functions/v1/google-ads-api/debug-unidades" -Method GET -Headers $headers
$response | ConvertTo-Json -Depth 10
```

### Saldo da Conta
```bash
# PowerShell
$headers = @{"Authorization" = "Bearer [SERVICE_ROLE_KEY]"; "Content-Type" = "application/json"}
$response = Invoke-RestMethod -Uri "https://agdffspstbxeqhqtltvb.supabase.co/functions/v1/google-ads-api/account-balance" -Method GET -Headers $headers
$response | ConvertTo-Json -Depth 10
```

## 📊 Comandos de Monitoramento

### Verificar Logs da Edge Function
```bash
# Via Supabase CLI (se disponível)
npx supabase functions logs google-ads-api --project-ref agdffspstbxeqhqtltvb
```

### Status do Supabase
```bash
# Verificar status do projeto
cd supabase
npx supabase status --project-ref agdffspstbxeqhqtltvb
```

## 🔄 Comandos de Manutenção

### Limpar Cache do Frontend
```bash
# Limpar cache do Vite
npm run build
# ou
yarn build
```

### Reiniciar Servidor de Desenvolvimento
```bash
# Parar e iniciar novamente
npm run dev
# ou
yarn dev
```

## 📝 Comandos de Documentação

### Gerar Documentação
```bash
# Atualizar documentação (manual)
# Editar arquivos em PLANEJAMENTO/google ads/
```

### Verificar Documentação
```bash
# Listar arquivos de documentação
ls "PLANEJAMENTO/google ads/"
```

## 🚨 Comandos de Troubleshooting

### Verificar Conectividade
```bash
# Testar conectividade com Supabase
ping agdffspstbxeqhqtltvb.supabase.co
```

### Verificar Variáveis de Ambiente
```bash
# PowerShell
$env:VITE_SUPABASE_SERVICE_ROLE_KEY
$env:VITE_GOOGLE_CUSTOMER_ID
```

### Verificar Logs de Erro
```bash
# No navegador (F12 > Console)
# Verificar erros JavaScript
```

## 📋 Scripts Úteis

### Script de Teste Completo
```powershell
# Salvar como test-google-ads-api.ps1
$headers = @{"Authorization" = "Bearer [SERVICE_ROLE_KEY]"; "Content-Type" = "application/json"}

Write-Host "🧪 TESTANDO GOOGLE ADS API..."

# Teste 1: Conexão
Write-Host "1. Testando conexão..."
try {
    $response = Invoke-RestMethod -Uri "https://agdffspstbxeqhqtltvb.supabase.co/functions/v1/google-ads-api/test-connection" -Method GET -Headers $headers
    Write-Host "✅ Conexão: OK"
} catch {
    Write-Host "❌ Conexão: FALHOU"
}

# Teste 2: Campanhas
Write-Host "2. Testando campanhas..."
try {
    $response = Invoke-RestMethod -Uri "https://agdffspstbxeqhqtltvb.supabase.co/functions/v1/google-ads-api/campaigns?status=all&startDate=2025-09-24&endDate=2025-09-24" -Method GET -Headers $headers
    Write-Host "✅ Campanhas: OK ($($response.count) encontradas)"
} catch {
    Write-Host "❌ Campanhas: FALHOU"
}

Write-Host "🏁 Testes concluídos!"
```

### Script de Deploy
```bash
# Salvar como deploy-google-ads.sh
#!/bin/bash
echo "🚀 Fazendo deploy da Google Ads API..."

cd supabase
npx supabase functions deploy google-ads-api --project-ref agdffspstbxeqhqtltvb

echo "✅ Deploy concluído!"
```

## 📞 Suporte

### URLs Úteis
- **Supabase Dashboard:** https://supabase.com/dashboard/project/agdffspstbxeqhqtltvb
- **Edge Functions:** https://supabase.com/dashboard/project/agdffspstbxeqhqtltvb/functions
- **Logs:** https://supabase.com/dashboard/project/agdffspstbxeqhqtltvb/functions/google-ads-api

### Comandos de Emergência
```bash
# Parar tudo e recomeçar
cd supabase
npx supabase functions deploy google-ads-api --project-ref agdffspstbxeqhqtltvb --debug
```

---

**Última Atualização:** 24/09/2025  
**Status:** ✅ Funcionando  
**Próxima Revisão:** Conforme necessidade
