# Script PowerShell para criar a função merge_cliente no Supabase
# ========================================================================

$supabaseUrl = "https://agdffspstbxeqhqtltvb.supabase.co"
$supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFnZGZmc3BzdGJ4ZXFocXRsdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDQ1MzY2NiwiZXhwIjoyMDY2MDI5NjY2fQ.grInwGHFAH2WYvYerwfHkUsM08wXCJASg4CPMD2cTaA"
$sqlFile = "$PSScriptRoot\12-funcao-merge-clientes.sql"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  CRIAÇÃO DA FUNÇÃO merge_cliente" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Verificar se o arquivo SQL existe
if (-Not (Test-Path $sqlFile)) {
    Write-Host "❌ ERRO: Arquivo SQL não encontrado!" -ForegroundColor Red
    Write-Host "   Caminho esperado: $sqlFile" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Arquivo SQL encontrado" -ForegroundColor Green
Write-Host ""

# Ler o conteúdo do arquivo SQL
$sqlContent = Get-Content $sqlFile -Raw

Write-Host "📋 INSTRUÇÕES:" -ForegroundColor Yellow
Write-Host ""
Write-Host "OPÇÃO 1 - Via Dashboard do Supabase (RECOMENDADO):" -ForegroundColor Cyan
Write-Host "1. Acesse: https://supabase.com/dashboard/project/agdffspstbxeqhqtltvb/sql/new" -ForegroundColor White
Write-Host "2. Cole o conteúdo do arquivo 12-funcao-merge-clientes.sql" -ForegroundColor White
Write-Host "3. Clique em RUN" -ForegroundColor White
Write-Host ""
Write-Host "OPCAO 2 - Copiar SQL para area de transferencia:" -ForegroundColor Cyan

try {
    Set-Clipboard -Value $sqlContent
    Write-Host "OK SQL copiado para a area de transferencia!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Agora:" -ForegroundColor Yellow
    Write-Host "1. Abra o SQL Editor do Supabase" -ForegroundColor White
    Write-Host "2. Cole o conteudo (Ctrl+V)" -ForegroundColor White
    Write-Host "3. Execute (RUN)" -ForegroundColor White
    Write-Host ""

    # Tentar abrir o browser
    Start-Process "https://supabase.com/dashboard/project/agdffspstbxeqhqtltvb/sql/new"

} catch {
    Write-Host "ERRO ao copiar para area de transferencia: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "Conteudo do SQL:" -ForegroundColor Yellow
    Write-Host $sqlContent
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
