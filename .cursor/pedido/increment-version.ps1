# Script PowerShell para incrementar versão automaticamente
# Uso: .\increment-version.ps1 [major|minor|patch]
# Padrão: patch (incrementa o patch)

param(
    [string]$Type = "patch"
)

$versionFile = Join-Path $PSScriptRoot "version.js"

# Ler arquivo de versão
$versionContent = Get-Content $versionFile -Raw

# Extrair versão atual
if ($versionContent -match 'major:\s*(\d+)') {
    $major = [int]$matches[1]
} else {
    Write-Host "❌ Erro: Não foi possível ler major" -ForegroundColor Red
    exit 1
}

if ($versionContent -match 'minor:\s*(\d+)') {
    $minor = [int]$matches[1]
} else {
    Write-Host "❌ Erro: Não foi possível ler minor" -ForegroundColor Red
    exit 1
}

if ($versionContent -match 'patch:\s*(\d+)') {
    $patch = [int]$matches[1]
} else {
    Write-Host "❌ Erro: Não foi possível ler patch" -ForegroundColor Red
    exit 1
}

# Incrementar versão
switch ($Type.ToLower()) {
    "major" {
        $major++
        $minor = 0
        $patch = 0
    }
    "minor" {
        $minor++
        $patch = 0
    }
    "patch" {
        $patch++
    }
    default {
        $patch++
    }
}

# Atualizar versão no arquivo
$newVersionContent = $versionContent `
    -replace 'major:\s*\d+', "major: $major" `
    -replace 'minor:\s*\d+', "minor: $minor" `
    -replace 'patch:\s*\d+', "patch: $patch"

Set-Content -Path $versionFile -Value $newVersionContent -NoNewline

Write-Host "✅ Versão atualizada: $major.$minor.$patch" -ForegroundColor Green
Write-Host "📦 OficialMed Pedidos V $major.$minor.$patch" -ForegroundColor Cyan
