@echo off
REM 📅 INSTALADOR DO SERVIÇO DE SINCRONIZAÇÃO HORÁRIA
REM Execute este arquivo como Administrador para instalar o serviço

echo 🔧 INSTALANDO SERVIÇO DE SINCRONIZAÇÃO HORÁRIA...
echo ================================================

REM Verificar se está sendo executado como administrador
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ ERRO: Execute este arquivo como Administrador!
    echo    Clique com botão direito e escolha "Executar como administrador"
    pause
    exit /b 1
)

echo ✅ Privilégios de administrador detectados

REM Criar tarefa agendada que executa de hora em hora
echo 📅 Criando tarefa agendada...

schtasks /create /tn "OficialMed Sync Hourly" /tr "node \"%~dp0schedule-hourly.js\"" /sc hourly /mo 1 /st 06:00 /et 23:59 /du 18:00 /f /rl highest

if %errorlevel% equ 0 (
    echo ✅ Tarefa agendada criada com sucesso!
    echo 📊 Nome: OficialMed Sync Hourly
    echo ⏰ Horário: A cada hora das 6h às 23h
    echo 📁 Local: %~dp0schedule-hourly.js
    echo.
    echo 🚀 COMANDOS ÚTEIS:
    echo    Ver tarefas: schtasks /query /tn "OficialMed Sync Hourly"
    echo    Executar agora: schtasks /run /tn "OficialMed Sync Hourly"
    echo    Parar: schtasks /end /tn "OficialMed Sync Hourly"
    echo    Remover: schtasks /delete /tn "OficialMed Sync Hourly" /f
) else (
    echo ❌ ERRO ao criar tarefa agendada!
    echo    Código de erro: %errorlevel%
)

echo.
echo 📋 PRÓXIMOS PASSOS:
echo 1. Teste manualmente: node sync-hourly.js
echo 2. Verifique os logs: type hourly-sync.log
echo 3. Monitore: type scheduler.log

pause