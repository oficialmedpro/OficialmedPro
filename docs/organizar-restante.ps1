# Script para organizar os arquivos restantes na raiz

Write-Host "Organizando arquivos restantes na raiz..." -ForegroundColor Cyan

# 1. Criar pastas adicionais
Write-Host "`nCriando pastas adicionais..." -ForegroundColor Yellow
$pastas = @("scripts-deploy", "config", "data")
foreach ($pasta in $pastas) {
    if (!(Test-Path $pasta)) {
        New-Item -ItemType Directory -Path $pasta | Out-Null
        Write-Host "  Criada: $pasta/" -ForegroundColor Green
    }
}

# 2. Mover scripts de deploy (.sh e .bat) para scripts-deploy/
Write-Host "`nMovendo scripts de deploy..." -ForegroundColor Yellow
$scriptsDeploy = Get-ChildItem -File | Where-Object {
    $_.Extension -in @(".sh", ".bat") -and
    $_.Name -notmatch "^(organizar|setup-chatwoot)" 
}
foreach ($script in $scriptsDeploy) {
    Move-Item $script.FullName -Destination "scripts-deploy\" -Force -ErrorAction SilentlyContinue
    if ($?) {
        Write-Host "  Movido: $($script.Name) -> scripts-deploy/" -ForegroundColor Green
    }
}

# 3. Mover arquivos do Google Ads Proxy para config/
Write-Host "`nMovendo arquivos Google Ads Proxy..." -ForegroundColor Yellow
Get-ChildItem -File | Where-Object {
    $_.Name -match "^google-ads-proxy"
} | ForEach-Object {
    Move-Item $_.FullName -Destination "config\" -Force -ErrorAction SilentlyContinue
    if ($?) {
        Write-Host "  Movido: $($_.Name) -> config/" -ForegroundColor Green
    }
}

# 4. Mover arquivos de configuração nginx para config/
Write-Host "`nMovendo arquivos nginx..." -ForegroundColor Yellow
Get-ChildItem -File -Filter "nginx*.conf" | ForEach-Object {
    Move-Item $_.FullName -Destination "config\" -Force -ErrorAction SilentlyContinue
    if ($?) {
        Write-Host "  Movido: $($_.Name) -> config/" -ForegroundColor Green
    }
}

# 5. Mover arquivos .json de dados para data/
Write-Host "`nMovendo arquivos JSON de dados..." -ForegroundColor Yellow
Get-ChildItem -File -Filter "*.json" | Where-Object {
    $_.Name -notmatch "^(package|package-lock)" 
} | ForEach-Object {
    Move-Item $_.FullName -Destination "data\" -Force -ErrorAction SilentlyContinue
    if ($?) {
        Write-Host "  Movido: $($_.Name) -> data/" -ForegroundColor Green
    }
}

# 6. Mover arquivos .csv para data/
Write-Host "`nMovendo arquivos CSV..." -ForegroundColor Yellow
Get-ChildItem -File -Filter "*.csv" | ForEach-Object {
    Move-Item $_.FullName -Destination "data\" -Force -ErrorAction SilentlyContinue
    if ($?) {
        Write-Host "  Movido: $($_.Name) -> data/" -ForegroundColor Green
    }
}

# 7. Mover docker-stack-beta.yml para stacks/
Write-Host "`nMovendo docker-stack-beta.yml..." -ForegroundColor Yellow
if (Test-Path "docker-stack-beta.yml") {
    Move-Item "docker-stack-beta.yml" -Destination "stacks\" -Force
    Write-Host "  Movido: docker-stack-beta.yml -> stacks/" -ForegroundColor Green
}

# 8. Mover arquivos .ps1 para scripts/
Write-Host "`nMovendo scripts PowerShell..." -ForegroundColor Yellow
Get-ChildItem -File -Filter "*.ps1" | Where-Object {
    $_.Name -ne "organizar-projeto.ps1" -and $_.Name -ne "organizar-restante.ps1"
} | ForEach-Object {
    Move-Item $_.FullName -Destination "scripts\" -Force -ErrorAction SilentlyContinue
    if ($?) {
        Write-Host "  Movido: $($_.Name) -> scripts/" -ForegroundColor Green
    }
}

# 9. Mover arquivos .txt para docs/ ou deletar se forem temporários
Write-Host "`nOrganizando arquivos .txt..." -ForegroundColor Yellow
Get-ChildItem -File -Filter "*.txt" | ForEach-Object {
    if ($_.Name -match "^(teste|temp)") {
        Remove-Item $_.FullName -Force
        Write-Host "  Deletado: $($_.Name)" -ForegroundColor Yellow
    } else {
        Move-Item $_.FullName -Destination "docs\" -Force -ErrorAction SilentlyContinue
        if ($?) {
            Write-Host "  Movido: $($_.Name) -> docs/" -ForegroundColor Green
        }
    }
}

# 10. Mover api-sync-*.js para uma pasta específica ou manter na raiz (são APIs principais)
Write-Host "`nVerificando APIs principais..." -ForegroundColor Yellow
# api-sync-leads.js e api-sync-opportunities.js são APIs principais, vamos mantê-las na raiz
# mas podemos criar uma pasta api-sync/ se preferir

Write-Host "`nOrganizacao concluida!" -ForegroundColor Green
Write-Host "`nResumo:" -ForegroundColor Cyan
Write-Host "  - Scripts de deploy movidos para scripts-deploy/" -ForegroundColor White
Write-Host "  - Configuracoes movidas para config/" -ForegroundColor White
Write-Host "  - Dados JSON/CSV movidos para data/" -ForegroundColor White
Write-Host "  - Arquivos temporarios deletados" -ForegroundColor White

