# Script para organizar o projeto
# Move arquivos para pastas apropriadas e deleta arquivos desnecessarios

Write-Host "Iniciando organizacao do projeto..." -ForegroundColor Cyan

# 1. Criar pastas
Write-Host "`nCriando pastas..." -ForegroundColor Yellow
$pastas = @("scripts", "docs", "logs", "docker", "stacks")
foreach ($pasta in $pastas) {
    if (!(Test-Path $pasta)) {
        New-Item -ItemType Directory -Path $pasta | Out-Null
        Write-Host "  Criada: $pasta/" -ForegroundColor Green
    } else {
        Write-Host "  Ja existe: $pasta/" -ForegroundColor Gray
    }
}

# 2. Deletar arquivos corrompidos/estranhos
Write-Host "`nDeletando arquivos corrompidos..." -ForegroundColor Yellow
$arquivosDeletar = @("tatus", "e HEAD", "et --hard 0397bc7")
foreach ($arquivo in $arquivosDeletar) {
    if (Test-Path $arquivo) {
        Remove-Item $arquivo -Force
        Write-Host "  Deletado: $arquivo" -ForegroundColor Green
    }
}

# 3. Deletar logs e arquivos de erro
Write-Host "`nDeletando logs e arquivos de erro..." -ForegroundColor Yellow
$padroesLogs = @("*.log", "*-error.txt", "*-log.txt")
foreach ($padrao in $padroesLogs) {
    $arquivos = Get-ChildItem -File -Filter $padrao -ErrorAction SilentlyContinue
    foreach ($arquivo in $arquivos) {
        Remove-Item $arquivo.FullName -Force
        Write-Host "  Deletado: $($arquivo.Name)" -ForegroundColor Green
    }
}

# 4. Mover arquivos .cjs e .js de scripts para scripts/
Write-Host "`nMovendo scripts .cjs e .js..." -ForegroundColor Yellow
$scripts = @()
Get-ChildItem -File -Filter "*.cjs" | Where-Object { 
    $_.Name -notmatch "^(api-sync|docker-entrypoint)" 
} | ForEach-Object { $scripts += $_ }

Get-ChildItem -File -Filter "*.js" | Where-Object { 
    $_.Name -notmatch "^(api-sync|google-ads-proxy|vite|eslint)" -and
    $_.Name -match "^(temp_|test-|check-|analyze-|debug-|sync-|import-|export-|fix-|consolidate-|create-|atualizar-|populate-|remove-|match-|investigate-|relatorios-|setup-|run-|validate-|verify-|diagnose-|get-campaigns)"
} | ForEach-Object { $scripts += $_ }

foreach ($script in $scripts) {
    Move-Item $script.FullName -Destination "scripts\" -Force -ErrorAction SilentlyContinue
    if ($?) {
        Write-Host "  Movido: $($script.Name) -> scripts/" -ForegroundColor Green
    }
}

# 5. Mover arquivos .sql da raiz para sql/
Write-Host "`nMovendo arquivos SQL..." -ForegroundColor Yellow
Get-ChildItem -File -Filter "*.sql" | Where-Object {
    $_.FullName -notlike "*\sql\*" -and
    $_.FullName -notlike "*\INATIVOS\*" -and
    $_.FullName -notlike "*\CONSOLIDACAO_DADOS\*" -and
    $_.FullName -notlike "*\supabase\*" -and
    $_.FullName -notlike "*\src\*"
} | ForEach-Object {
    Move-Item $_.FullName -Destination "sql\" -Force -ErrorAction SilentlyContinue
    if ($?) {
        Write-Host "  Movido: $($_.Name) -> sql/" -ForegroundColor Green
    }
}

# 6. Mover documentacao .md para docs/
Write-Host "`nMovendo documentacao..." -ForegroundColor Yellow
Get-ChildItem -File -Filter "*.md" | Where-Object {
    $_.Name -ne "README.md" -and
    $_.FullName -notlike "*\src\*" -and
    $_.FullName -notlike "*\chatwoot\*" -and
    $_.FullName -notlike "*\landingpage\*" -and
    $_.FullName -notlike "*\INATIVOS\*" -and
    $_.FullName -notlike "*\CONSOLIDACAO_DADOS\*" -and
    $_.FullName -notlike "*\PLANEJAMENTO\*" -and
    $_.FullName -notlike "*\sync-leads-api\*" -and
    $_.FullName -notlike "*\sync-opportunities-api\*"
} | ForEach-Object {
    Move-Item $_.FullName -Destination "docs\" -Force -ErrorAction SilentlyContinue
    if ($?) {
        Write-Host "  Movido: $($_.Name) -> docs/" -ForegroundColor Green
    }
}

# 7. Mover Dockerfiles e docker-compose para docker/
Write-Host "`nMovendo arquivos Docker..." -ForegroundColor Yellow
Get-ChildItem -File -Filter "Dockerfile*" | ForEach-Object {
    Move-Item $_.FullName -Destination "docker\" -Force -ErrorAction SilentlyContinue
    if ($?) {
        Write-Host "  Movido: $($_.Name) -> docker/" -ForegroundColor Green
    }
}

Get-ChildItem -File -Filter "docker-compose*.yml" | ForEach-Object {
    Move-Item $_.FullName -Destination "docker\" -Force -ErrorAction SilentlyContinue
    if ($?) {
        Write-Host "  Movido: $($_.Name) -> docker/" -ForegroundColor Green
    }
}

if (Test-Path "docker-entrypoint.sh") {
    Move-Item "docker-entrypoint.sh" -Destination "docker\" -Force
    Write-Host "  Movido: docker-entrypoint.sh -> docker/" -ForegroundColor Green
}

# 8. Mover arquivos stack .yml para stacks/
Write-Host "`nMovendo arquivos stack..." -ForegroundColor Yellow
$stacks = @()
Get-ChildItem -File -Filter "stack-*.yml" | ForEach-Object { $stacks += $_ }
Get-ChildItem -File -Filter "render*.yaml" -ErrorAction SilentlyContinue | ForEach-Object { $stacks += $_ }
Get-ChildItem -File -Filter "portainer-stack.yml" -ErrorAction SilentlyContinue | ForEach-Object { $stacks += $_ }
Get-ChildItem -File -Filter "firebird-stack*.yml" -ErrorAction SilentlyContinue | ForEach-Object { $stacks += $_ }

foreach ($stack in $stacks) {
    Move-Item $stack.FullName -Destination "stacks\" -Force -ErrorAction SilentlyContinue
    if ($?) {
        Write-Host "  Movido: $($stack.Name) -> stacks/" -ForegroundColor Green
    }
}

# 9. Mover arquivos temporarios de teste
Write-Host "`nMovendo arquivos temporarios..." -ForegroundColor Yellow
Get-ChildItem -File | Where-Object {
    $_.Name -match "^temp_" -or
    ($_.Name -match "^test-" -and $_.Extension -in @(".js", ".html", ".cjs"))
} | ForEach-Object {
    Move-Item $_.FullName -Destination "temp\" -Force -ErrorAction SilentlyContinue
    if ($?) {
        Write-Host "  Movido: $($_.Name) -> temp/" -ForegroundColor Green
    }
}

Write-Host "`nOrganizacao concluida!" -ForegroundColor Green
Write-Host "`nResumo:" -ForegroundColor Cyan
Write-Host "  - Pastas criadas: scripts/, docs/, logs/, docker/, stacks/" -ForegroundColor White
Write-Host "  - Arquivos organizados por tipo" -ForegroundColor White
Write-Host "  - Logs e arquivos temporarios removidos" -ForegroundColor White
Write-Host "`nIMPORTANTE: Revise as mudancas antes de fazer commit!" -ForegroundColor Yellow
