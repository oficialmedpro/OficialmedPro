# Script de Deploy do Beta - Oficial Med
# Este script faz o build e push da imagem Docker para o Docker Hub

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "     Deploy Beta - Oficial Med PWA                        " -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

# Verificar se o Docker esta rodando
Write-Host "[*] Verificando Docker..." -ForegroundColor Yellow
try {
    docker info | Out-Null
    Write-Host "[OK] Docker esta rodando" -ForegroundColor Green
} catch {
    Write-Host "[ERRO] Docker nao esta rodando. Por favor, inicie o Docker Desktop." -ForegroundColor Red
    exit 1
}

# Verificar se esta logado no Docker Hub
Write-Host "[*] Verificando login no Docker Hub..." -ForegroundColor Yellow
$dockerLogin = docker info 2>&1 | Select-String "Username"
if (-not $dockerLogin) {
    Write-Host "[AVISO] Voce precisa fazer login no Docker Hub primeiro:" -ForegroundColor Yellow
    Write-Host "   docker login" -ForegroundColor White
    $login = Read-Host "Deseja fazer login agora? (s/n)"
    if ($login -eq "s" -or $login -eq "S") {
        docker login
        if ($LASTEXITCODE -ne 0) {
            Write-Host "[ERRO] Falha no login. Abortando." -ForegroundColor Red
            exit 1
        }
    } else {
        Write-Host "[ERRO] Login necessario. Abortando." -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "[OK] Logado no Docker Hub" -ForegroundColor Green
}

# Nome da imagem
$IMAGE_NAME = "oficialmedpro/oficialmed-pwa:latest"
$DOCKERFILE = "docker/Dockerfile"

Write-Host ""
Write-Host "[*] Informacoes do Build:" -ForegroundColor Cyan
Write-Host "   Imagem: $IMAGE_NAME" -ForegroundColor White
Write-Host "   Dockerfile: $DOCKERFILE" -ForegroundColor White
Write-Host ""

# Confirmar antes de continuar
$confirm = Read-Host "Deseja continuar com o build e push? (s/n)"
if ($confirm -ne "s" -and $confirm -ne "S") {
    Write-Host "[CANCELADO] Deploy cancelado" -ForegroundColor Yellow
    exit 0
}

# Build da imagem
Write-Host ""
Write-Host "[*] Iniciando build da imagem..." -ForegroundColor Yellow
Write-Host "   Isso pode levar alguns minutos..." -ForegroundColor Gray

docker build -f $DOCKERFILE -t $IMAGE_NAME .

if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERRO] Erro no build da imagem!" -ForegroundColor Red
    exit 1
}

Write-Host "[OK] Build concluido com sucesso!" -ForegroundColor Green

# Push para Docker Hub
Write-Host ""
Write-Host "[*] Enviando imagem para Docker Hub..." -ForegroundColor Yellow
Write-Host "   Isso pode levar alguns minutos..." -ForegroundColor Gray

docker push $IMAGE_NAME

if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERRO] Erro no push da imagem!" -ForegroundColor Red
    exit 1
}

Write-Host "[OK] Imagem enviada para Docker Hub com sucesso!" -ForegroundColor Green

# Instrucoes para atualizar a stack
Write-Host ""
Write-Host "============================================================" -ForegroundColor Green
Write-Host "          Build e Push Concluidos!                         " -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Green
Write-Host ""
Write-Host "[*] Proximos passos para atualizar o Beta:" -ForegroundColor Cyan
Write-Host ""
Write-Host "OPCAO 1: Via Portainer (Recomendado)" -ForegroundColor Yellow
Write-Host "   1. Acesse: https://portainer.oficialmed.com.br" -ForegroundColor White
Write-Host "   2. Va em Stacks -> Procure pela stack 'beta' ou 'bi-beta-stack'" -ForegroundColor White
Write-Host "   3. Clique em 'Editor' ou 'Update the stack'" -ForegroundColor White
Write-Host "   4. [OK] Marque 'Pull latest image'" -ForegroundColor Green
Write-Host "   5. Clique em 'Update the stack'" -ForegroundColor White
Write-Host ""
Write-Host "OPCAO 2: Via SSH (Linha de Comando)" -ForegroundColor Yellow
Write-Host "   Conecte-se ao servidor e execute:" -ForegroundColor White
Write-Host "   docker service update --image $IMAGE_NAME --force <nome-do-servico-beta>" -ForegroundColor Cyan
Write-Host ""
Write-Host "   Ou atualize a stack completa:" -ForegroundColor White
Write-Host "   docker stack deploy -c stacks/stack-beta-oficialmed-correto.yml beta --with-registry-auth" -ForegroundColor Cyan
Write-Host ""
Write-Host "[*] Verificar imagem no Docker Hub:" -ForegroundColor Cyan
Write-Host "   https://hub.docker.com/r/oficialmedpro/oficialmed-pwa/tags" -ForegroundColor White
Write-Host ""
Write-Host "[*] URL do Beta:" -ForegroundColor Cyan
Write-Host "   https://beta.oficialmed.com.br" -ForegroundColor White
Write-Host ""
