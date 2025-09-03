@echo off
echo 🚀 Configurando Backend Proxy Google Ads...

REM Criar diretório do backend se não existir
if not exist "google-ads-proxy" (
    echo 📁 Criando diretório google-ads-proxy...
    mkdir google-ads-proxy
)

cd google-ads-proxy

REM Copiar arquivos necessários
echo 📋 Copiando arquivos...
copy ..\google-ads-proxy-server.js server.js
copy ..\google-ads-proxy-package.json package.json
copy ..\google-ads-proxy-config.js config.js

REM Instalar dependências
echo 📦 Instalando dependências...
npm install

REM Verificar se o arquivo config.js existe
if not exist "config.js" (
    echo ⚠️ Arquivo config.js não encontrado!
    echo 📝 Criando config.js a partir do template...
    copy google-ads-proxy-config.js config.js
    echo ✏️ Por favor, edite o arquivo config.js com suas credenciais do Supabase
    echo    - URL do Supabase
    echo    - Chave anônima do Supabase
    pause
    exit /b 1
)

echo ✅ Configuração concluída!
echo 🔧 Para executar o servidor:
echo    cd google-ads-proxy
echo    npm start
echo.
echo 📝 Certifique-se de que o arquivo config.js está configurado com suas credenciais do Supabase
pause
