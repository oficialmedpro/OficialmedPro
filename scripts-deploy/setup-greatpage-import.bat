@echo off
echo ========================================
echo   Setup - Importacao Greatpage Leads
echo ========================================
echo.

echo Instalando dependencias...
npm install @supabase/supabase-js csv-parser dotenv

echo.
echo ========================================
echo   Configuracao Concluida!
echo ========================================
echo.
echo Para usar o script:
echo.
echo 1. Configure o arquivo .env com suas credenciais do Supabase
echo 2. Execute o SQL create_greatpage_leads_table.sql no Supabase
echo 3. Execute o script:
echo.
echo    node import-greatpage-leads.js
echo.
echo    Ou para importar uma pasta especifica:
echo    node import-greatpage-leads.js "OMS_Maringa"
echo.
echo ========================================
pause


