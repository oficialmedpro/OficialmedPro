# Correções após migração do timezone

## 1. Arquivo: `src/service/googleInvestimentoService.js`

**ANTES:**
```javascript
// CORREÇÃO: Como investimento_patrocinados não tem timezone, usar a data diretamente
const start = dataInicio; // Formato: 2025-09-10
const end = dataInicio;   // Formato: 2025-09-10
```

**DEPOIS:**
```javascript
// Agora que investimento_patrocinados tem timezone, usar as funções de conversão
const start = getStartOfDaySP(dataInicio);
const end = getEndOfDaySP(dataInicio);
```

## 2. Arquivo: `src/service/debugComparisonService.js`

**ANTES:**
```javascript
// CORREÇÃO: Como investimento_patrocinados não tem timezone, usar a data diretamente
const start = dataInicio; // Formato: 2025-09-10
const end = dataInicio;   // Formato: 2025-09-10
```

**DEPOIS:**
```javascript
// Agora que investimento_patrocinados tem timezone, usar as funções de conversão
const start = this.convertDateToSaoPauloTZ(dataInicio, false);
const end = this.convertDateToSaoPauloTZ(dataInicio, true);
```

## 3. Verificar se funcionou

Após executar a migração SQL e aplicar as correções no código:

1. **Teste o botão DEBUG** no card do Google
2. **Verifique no console** se as URLs estão corretas
3. **Confirme se os valores batem** com o card "Oportunidades Ganhas"

## 4. Limpeza

Depois que confirmar que está funcionando:

1. **Remover o botão DEBUG** do `GoogleInvestimentoCard.jsx`
2. **Remover o arquivo** `debugComparisonService.js`
3. **Remover os logs de debug** dos serviços
