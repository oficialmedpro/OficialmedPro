# Script para copiar o banco Firebird para o container Docker
# Execute como Administrador

Write-Host "🔥 Copiando banco psbd.fdb para o container Firebird..." -ForegroundColor Yellow

# Verificar se o arquivo existe
$sourceFile = "C:\SisPS\BD\psbd.fdb"
if (-not (Test-Path $sourceFile)) {
    Write-Host "❌ Arquivo não encontrado: $sourceFile" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Arquivo encontrado: $sourceFile" -ForegroundColor Green

# Listar containers Docker
Write-Host "📋 Listando containers Docker..." -ForegroundColor Cyan
try {
    $containers = docker ps -a --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
    Write-Host $containers
    
    # Procurar container do Firebird
    $firebirdContainer = docker ps -a --filter "name=firebird" --format "{{.Names}}"
    
    if ($firebirdContainer) {
        Write-Host "✅ Container Firebird encontrado: $firebirdContainer" -ForegroundColor Green
        
        # Parar o container temporariamente
        Write-Host "⏸️ Parando container..." -ForegroundColor Yellow
        docker stop $firebirdContainer
        
        # Copiar o arquivo
        Write-Host "📁 Copiando arquivo para o container..." -ForegroundColor Yellow
        docker cp $sourceFile "${firebirdContainer}:/firebird/data/psbd.FDB"
        
        # Reiniciar o container
        Write-Host "▶️ Reiniciando container..." -ForegroundColor Yellow
        docker start $firebirdContainer
        
        Write-Host "🎉 Banco copiado com sucesso!" -ForegroundColor Green
        Write-Host "📊 Container: $firebirdContainer" -ForegroundColor Cyan
        Write-Host "📁 Arquivo: /firebird/data/psbd.FDB" -ForegroundColor Cyan
        
    } else {
        Write-Host "❌ Container Firebird não encontrado!" -ForegroundColor Red
        Write-Host "💡 Certifique-se de que o container está rodando no Portainer" -ForegroundColor Yellow
    }
    
} catch {
    Write-Host "❌ Erro ao executar comandos Docker: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "💡 Certifique-se de que o Docker está instalado e acessível" -ForegroundColor Yellow
}

Write-Host "`n🔧 Próximos passos:" -ForegroundColor Cyan
Write-Host "1. Verifique se o container está rodando no Portainer" -ForegroundColor White
Write-Host "2. Teste a conexão com o firebirdService" -ForegroundColor White
Write-Host "3. Acesse: http://localhost:3002/api/firebird/test-connection" -ForegroundColor White

