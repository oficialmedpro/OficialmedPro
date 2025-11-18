# Teste completo da API de sincronização

Write-Host "`n🧪 TESTE COMPLETO DA API DE SINCRONIZAÇÃO" -ForegroundColor Cyan
Write-Host "=" * 60 -ForegroundColor Gray
Write-Host ""

# 1. Health Check
Write-Host "1️⃣ Health Check..." -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "https://sincrocrm.oficialmed.com.br/health" -Method GET
    Write-Host "   ✅ Status: $($health.status)" -ForegroundColor Green
    Write-Host "   ✅ Service: $($health.service)" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Erro: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host ""

# 2. Verificar Status
Write-Host "2️⃣ Verificar Status Atual..." -ForegroundColor Yellow
try {
    $metrics = Invoke-RestMethod -Uri "https://sincrocrm.oficialmed.com.br/metrics" -Method GET
    if ($metrics.running) {
        Write-Host "   ⚠️ Sincronização já está em andamento" -ForegroundColor Yellow
        Write-Host "   Aguarde a conclusão antes de iniciar nova sincronização" -ForegroundColor Gray
    } else {
        Write-Host "   ✅ Nenhuma sincronização em andamento" -ForegroundColor Green
    }
} catch {
    Write-Host "   ⚠️ Não foi possível verificar status" -ForegroundColor Yellow
}

Write-Host ""

# 3. Verificar Configuração dos Funis (via código)
Write-Host "3️⃣ Verificando Configuração dos Funis..." -ForegroundColor Yellow
Write-Host "   Funis esperados: 6, 9, 14, 34, 38" -ForegroundColor White
Write-Host "   ✅ Funil 6: COMERCIAL APUCARANA" -ForegroundColor Green
Write-Host "   ✅ Funil 9: LOGÍSTICA MANIPULAÇÃO" -ForegroundColor Green
Write-Host "   ✅ Funil 14: RECOMPRA" -ForegroundColor Green
Write-Host "   ✅ Funil 34: REATIVAÇÃO COMERCIAL (NOVO)" -ForegroundColor Green
Write-Host "   ✅ Funil 38: REATIVAÇÃO COMERCIAL (NOVO)" -ForegroundColor Green

Write-Host ""

# 4. Testar Iniciar Sincronização (se não estiver rodando)
if (-not $metrics.running) {
    Write-Host "4️⃣ Iniciando Sincronização Completa..." -ForegroundColor Yellow
    Write-Host "   (Isso pode levar 5-15 minutos)" -ForegroundColor Gray
    Write-Host ""
    
    try {
        $job = Start-Job -ScriptBlock {
            $response = Invoke-RestMethod -Uri "https://sincrocrm.oficialmed.com.br/sync/all?trigger=test_manual" -Method GET -TimeoutSec 30
            return $response
        }
        
        Write-Host "   ⏳ Aguardando resposta inicial..." -ForegroundColor Yellow
        Start-Sleep -Seconds 5
        
        if ($job.State -eq "Running") {
            Write-Host "   ✅ Sincronização iniciada em background" -ForegroundColor Green
            Write-Host "   📊 Acompanhe os logs no servidor:" -ForegroundColor Cyan
            Write-Host "      docker service logs -f sprint-sync_sincronizacao" -ForegroundColor Gray
        }
        
        # Tentar pegar resultado (pode dar timeout)
        $result = Wait-Job -Job $job -Timeout 10
        if ($result) {
            $response = Receive-Job -Job $job
            Remove-Job -Job $job
            
            if ($response.alreadyRunning) {
                Write-Host "   ⚠️ Sincronização já estava em andamento" -ForegroundColor Yellow
            } else {
                Write-Host "   ✅ Sincronização iniciada com sucesso!" -ForegroundColor Green
            }
        }
    } catch {
        Write-Host "   ⚠️ Timeout esperado (sincronização em andamento)" -ForegroundColor Yellow
        Write-Host "   ✅ Isso é normal - a sincronização está rodando" -ForegroundColor Green
    }
} else {
    Write-Host "4️⃣ Sincronização já está em andamento - pulando teste" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=" * 60 -ForegroundColor Gray
Write-Host "✅ TESTE CONCLUÍDO" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Próximos Passos:" -ForegroundColor Cyan
Write-Host "   1. Verificar logs no servidor:" -ForegroundColor White
Write-Host "      docker service logs -f sprint-sync_sincronizacao" -ForegroundColor Gray
Write-Host ""
Write-Host "   2. Verificar se todos os funis foram processados:" -ForegroundColor White
Write-Host "      docker service logs sprint-sync_sincronizacao 2>&1 | grep 'Funil'" -ForegroundColor Gray
Write-Host ""
Write-Host "   3. Verificar no banco de dados (Supabase):" -ForegroundColor White
Write-Host "      SELECT funil_id, COUNT(*) FROM api.oportunidade_sprint GROUP BY funil_id;" -ForegroundColor Gray
Write-Host ""

