# Script para copiar banco grande para container Firebird
# Execute como Administrador

Write-Host "🔥 Copiando banco psbd.fdb (405MB) para container Firebird..." -ForegroundColor Yellow

$sourceFile = "C:\SisPS\BD\psbd.fdb"
$containerName = "firebird-stack_firebird.1.4ys3w2uutrcr9pj12pipz2843"

# Verificar se o arquivo existe
if (-not (Test-Path $sourceFile)) {
    Write-Host "❌ Arquivo não encontrado: $sourceFile" -ForegroundColor Red
    exit 1
}

$fileSize = (Get-Item $sourceFile).Length / 1MB
Write-Host "✅ Arquivo encontrado: $sourceFile ($([math]::Round($fileSize, 2)) MB)" -ForegroundColor Green

# Verificar se o container está rodando
Write-Host "📋 Verificando container..." -ForegroundColor Cyan
try {
    $containerStatus = docker ps --filter "name=$containerName" --format "{{.Status}}"
    if ($containerStatus -like "*Up*") {
        Write-Host "✅ Container está rodando: $containerStatus" -ForegroundColor Green
    } else {
        Write-Host "❌ Container não está rodando. Status: $containerStatus" -ForegroundColor Red
        Write-Host "💡 Inicie o container no Portainer primeiro" -ForegroundColor Yellow
        exit 1
    }
} catch {
    Write-Host "❌ Erro ao verificar container: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Copiar arquivo (pode demorar para 405MB)
Write-Host "📁 Copiando arquivo (pode demorar alguns minutos)..." -ForegroundColor Yellow
Write-Host "⏳ Aguarde... Arquivo grande sendo transferido..." -ForegroundColor Cyan

try {
    docker cp $sourceFile "${containerName}:/firebird/data/psbd.FDB"
    Write-Host "🎉 Banco copiado com sucesso!" -ForegroundColor Green
    Write-Host "📊 Container: $containerName" -ForegroundColor Cyan
    Write-Host "📁 Arquivo: /firebird/data/psbd.FDB" -ForegroundColor Cyan
    
    # Verificar se o arquivo foi copiado
    Write-Host "🔍 Verificando arquivo no container..." -ForegroundColor Cyan
    docker exec $containerName ls -la /firebird/data/psbd.FDB
    
} catch {
    Write-Host "❌ Erro ao copiar arquivo: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "💡 Verifique se o container está rodando e acessível" -ForegroundColor Yellow
}

Write-Host "`n🔧 Próximos passos:" -ForegroundColor Cyan
Write-Host "1. Teste a conexão com o firebirdService" -ForegroundColor White
Write-Host "2. Acesse: http://localhost:3002/api/firebird/test-connection" -ForegroundColor White
Write-Host "3. Verifique se o banco está acessível" -ForegroundColor White

