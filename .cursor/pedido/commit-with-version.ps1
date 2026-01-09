# Script para fazer commit com incremento automático de versão
# Uso: .\commit-with-version.ps1 "mensagem do commit"

param(
    [Parameter(Mandatory=$true)]
    [string]$Message
)

$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$versionScript = Join-Path $scriptPath "increment-version.ps1"

# Incrementar versão
Write-Host "🔄 Incrementando versão..." -ForegroundColor Yellow
& $versionScript patch

# Adicionar arquivos modificados
Write-Host "📝 Adicionando arquivos..." -ForegroundColor Yellow
git add .cursor/pedido/

# Adicionar version.js especificamente
git add .cursor/pedido/version.js

# Fazer commit
Write-Host "💾 Fazendo commit..." -ForegroundColor Yellow
git commit -m $Message

# Push
Write-Host "🚀 Fazendo push..." -ForegroundColor Yellow
git push

Write-Host "✅ Commit realizado com sucesso!" -ForegroundColor Green
