# Script para testar a API de sincronização

Write-Host "🧪 Testando API de Sincronização..." -ForegroundColor Cyan
Write-Host ""

# 1. Health Check
Write-Host "1️⃣ Testando Health Check..." -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "https://sincrocrm.oficialmed.com.br/health" -Method GET
    Write-Host "✅ Health Check OK:" -ForegroundColor Green
    Write-Host "   Status: $($health.status)" -ForegroundColor White
    Write-Host "   Service: $($health.service)" -ForegroundColor White
    Write-Host "   Timestamp: $($health.timestamp)" -ForegroundColor White
} catch {
    Write-Host "❌ Erro no Health Check: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host ""

# 2. Verificar Status (se está rodando)
Write-Host "2️⃣ Verificando Status da Sincronização..." -ForegroundColor Yellow
try {
    $metrics = Invoke-RestMethod -Uri "https://sincrocrm.oficialmed.com.br/metrics" -Method GET
    Write-Host "✅ Status:" -ForegroundColor Green
    Write-Host "   Rodando: $($metrics.running)" -ForegroundColor White
    if ($metrics.last) {
        Write-Host "   Última execução: $($metrics.last.completedAt)" -ForegroundColor White
    }
} catch {
    Write-Host "⚠️ Não foi possível verificar status: $($_.Exception.Message)" -ForegroundColor Yellow
}

Write-Host ""

# 3. Iniciar Sincronização Completa
Write-Host "3️⃣ Iniciando Sincronização Completa..." -ForegroundColor Yellow
Write-Host "   (Isso pode levar 5-15 minutos)" -ForegroundColor Gray
Write-Host ""

try {
    $response = Invoke-RestMethod -Uri "https://sincrocrm.oficialmed.com.br/sync/all?trigger=test_manual" -Method GET -TimeoutSec 900
    
    Write-Host "✅ Sincronização Iniciada!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📊 Resumo:" -ForegroundColor Cyan
    
    if ($response.alreadyRunning) {
        Write-Host "⚠️ Sincronização já está em andamento" -ForegroundColor Yellow
        if ($response.lastRun) {
            Write-Host "   Última execução: $($response.lastRun.completedAt)" -ForegroundColor White
        }
    } else {
        Write-Host "   Início: $($response.startedAt)" -ForegroundColor White
        Write-Host "   Duração: $([math]::Round($response.durationSeconds, 2))s" -ForegroundColor White
        Write-Host ""
        
        if ($response.summary) {
            $summary = $response.summary
            Write-Host "   Oportunidades: $($summary.oportunidades.totalProcessed) processadas" -ForegroundColor White
            Write-Host "   Leads: $($summary.leads.totalProcessed) processados" -ForegroundColor White
            Write-Host "   Segmentos: $($summary.segmentos.totalProcessed) processados" -ForegroundColor White
        }
    }
    
    Write-Host ""
    Write-Host "✅ Teste concluído!" -ForegroundColor Green
    
} catch {
    Write-Host "❌ Erro ao iniciar sincronização:" -ForegroundColor Red
    Write-Host "   $($_.Exception.Message)" -ForegroundColor Red
    
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "   Resposta: $responseBody" -ForegroundColor Yellow
    }
}

