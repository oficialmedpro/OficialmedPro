# Script PowerShell para testar o endpoint de debug da API
# Busca uma amostra de oportunidades do SprintHub para ver a estrutura

$API_URL = "https://sincrocrm.oficialmed.com.br"
$FUNNEL_ID = 33  # Ativação Comercial
$STAGE_ID = 314  # Primeira etapa do funil 33

Write-Host "🔍 Testando endpoint de debug da API..." -ForegroundColor Cyan
Write-Host "📡 URL: $API_URL/debug/sample?funnel=$FUNNEL_ID&stage=$STAGE_ID&limit=5" -ForegroundColor Yellow
Write-Host ""

try {
    $response = Invoke-RestMethod -Uri "$API_URL/debug/sample?funnel=$FUNNEL_ID&stage=$STAGE_ID&limit=5" -Method GET -ContentType "application/json"
    
    Write-Host "✅ Resposta recebida!" -ForegroundColor Green
    Write-Host ""
    
    if ($response.success) {
        Write-Host "📊 Estrutura dos campos:" -ForegroundColor Cyan
        Write-Host "   Funil: $($response.funnelId)"
        Write-Host "   Etapa: $($response.stageId)"
        Write-Host ""
        
        if ($response.fieldsStructure) {
            Write-Host "📋 Campos diretos: $($response.fieldsStructure.directFields.Count)" -ForegroundColor Yellow
            $response.fieldsStructure.directFields | ForEach-Object { Write-Host "   - $_" }
            Write-Host ""
            
            Write-Host "📋 Campos customizados (fields): $($response.fieldsStructure.customFields.Count)" -ForegroundColor Yellow
            if ($response.fieldsStructure.customFields.Count -gt 0) {
                $response.fieldsStructure.customFields | ForEach-Object { Write-Host "   - $_" }
            } else {
                Write-Host "   ⚠️ Nenhum campo de data/hora encontrado nos nomes"
            }
            Write-Host ""
            
            Write-Host "📋 Todos os campos em 'fields': $($response.allFieldsInFields.Count)" -ForegroundColor Yellow
            $response.allFieldsInFields | Select-Object -First 20 | ForEach-Object { Write-Host "   - $_" }
            if ($response.allFieldsInFields.Count -gt 20) {
                Write-Host "   ... e mais $($response.allFieldsInFields.Count - 20) campos"
            }
            Write-Host ""
            
            Write-Host "🎯 Campos mapeados:" -ForegroundColor Green
            if ($response.mappedFields) {
                $response.mappedFields.PSObject.Properties | ForEach-Object {
                    if ($_.Value) {
                        Write-Host "   ✅ $($_.Name): $($_.Value)" -ForegroundColor Green
                    }
                }
            } else {
                Write-Host "   ⚠️ Nenhum campo foi mapeado automaticamente"
            }
        }
        
        Write-Host ""
        Write-Host "💾 Exemplo completo salvo em: opportunity-sample.json" -ForegroundColor Cyan
        $response | ConvertTo-Json -Depth 10 | Out-File -FilePath "opportunity-sample.json" -Encoding UTF8
        
    } else {
        Write-Host "❌ Erro: $($response.error)" -ForegroundColor Red
    }
    
} catch {
    Write-Host "❌ Erro ao fazer requisição: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "💡 Alternativa: Use o endpoint diretamente no navegador ou curl:"
    Write-Host "   curl $API_URL/debug/sample?funnel=$FUNNEL_ID&stage=$STAGE_ID&limit=1"
}



