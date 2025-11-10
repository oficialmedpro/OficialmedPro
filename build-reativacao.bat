@echo off
REM Script de Build para Módulo de Reativação (Windows)
REM Este script faz o build do projeto para deploy no Render

echo 🔨 Iniciando build do módulo de reativação...

REM Verificar se Node.js está instalado
where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Node.js não encontrado. Por favor, instale Node.js primeiro.
    exit /b 1
)

REM Verificar se npm está instalado
where npm >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ❌ npm não encontrado. Por favor, instale npm primeiro.
    exit /b 1
)

REM Instalar dependências
echo 📦 Instalando dependências...
call npm install

REM Verificar variáveis de ambiente
if "%VITE_SUPABASE_URL%"=="" (
    echo ⚠️  Aviso: VITE_SUPABASE_URL não está definida
)

if "%VITE_SUPABASE_ANON_KEY%"=="" (
    echo ⚠️  Aviso: VITE_SUPABASE_ANON_KEY não está definida
)

if "%VITE_SYNC_API_URL%"=="" (
    echo ⚠️  Aviso: VITE_SYNC_API_URL não está definida (necessária para acionar a API de sincronização)
)

REM Fazer build
echo 🔨 Fazendo build do projeto...
call npm run build

REM Verificar se o build foi criado
if exist "dist" (
    echo ✅ Build concluído com sucesso!
    echo 📁 Pasta dist criada com os arquivos estáticos
    echo.
    echo 🚀 Pronto para deploy no Render!
    echo.
    echo Próximos passos:
    echo 1. Faça commit do build (opcional): git add dist/
    echo 2. No Render, configure o deploy com:
    echo    - Build Command: npm install && npm run build
    echo    - Publish Directory: dist
    echo    - Variáveis de ambiente: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, VITE_SYNC_API_URL
) else (
    echo ❌ Erro: Build não foi criado. Verifique os logs acima.
    exit /b 1
)

pause



