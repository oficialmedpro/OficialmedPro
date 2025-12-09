# 🔄 Ajustes de Sincronização - Campos de Data/Hora

## ✅ O que foi feito

### 1. Campos Criados na Tabela
Todos os 35 campos de data/hora foram criados na tabela `api.oportunidade_sprint`:

**Compra (7 campos):**
- `entrada_compra`, `acolhimento_compra`, `qualificado_compra`, `orcamento_compra`, `negociacao_compra`, `follow_up_compra`, `cadastro_compra`

**Recompra (7 campos):**
- `entrada_recompra`, `acolhimento_recompra`, `qualificado_recompra`, `orcamento_recompra`, `negociacao_recompra`, `follow_up_recompra`, `cadastro_recompra`

**Monitoramento (7 campos):**
- `entrada_monitoramento`, `acolhimento_monitoramento`, `qualificado_monitoramento`, `orcamento_monitoramento`, `negociacao_monitoramento`, `follow_up_monitoramento`, `cadastro_monitoramento`

**Ativacao (7 campos):**
- `entrada_ativacao`, `acolhimento_ativacao`, `qualificado_ativacao`, `orcamento_ativacao`, `negociacao_ativacao`, `follow_up_ativacao`, `cadastro_ativacao`

**Reativacao (7 campos):**
- `entrada_reativacao`, `acolhimento_reativacao`, `qualificado_reativacao`, `orcamento_reativacao`, `negociacao_reativacao`, `follow_up_reativacao`, `cadastro_reativacao`

### 2. Mapeamento na API (`api-sync-opportunities.js`)

Adicionadas funções para mapear automaticamente os campos de data/hora:

- `parseDateTimeField()`: Converte valores de data/hora para formato ISO
- `mapStageDateTimeFields()`: Mapeia campos do SprintHub para nomes da tabela
- `mapOpportunityFields()`: Atualizado para incluir os novos campos

**Mapeamento automático:**
- Busca campos no formato "Entrada Compra", "Acolhimento Compra", etc. em `opportunity.fields`
- Converte para formato snake_case: `entrada_compra`, `acolhimento_compra`, etc.
- Suporta variações (sem acentos, lowercase, etc.)

### 3. Funis e Etapas Padronizados

A API do Easypanel sincroniza os seguintes funis:

```javascript
{
    6: { name: '[1] COMERCIAL APUCARANA', stages: [130, 231, 82, 207, 83, 85, 232] },
    9: { name: '[1] LOGÍSTICA MANIPULAÇÃO', stages: [244, 245, 105, 267, 368, 108, 109, 261, 262, 263, 278, 110] },
    14: { name: '[2] RECOMPRA', stages: [202, 228, 229, 206, 203, 204, 230, 205, 269, 167, 148, 168, 149, 169, 150] },
    32: { name: '[1] MONITORAMENTO MARKETING', stages: [280, 281, 282, 283, 284, 285, 346, 347, 348, 349] },
    33: { name: '[1] ATIVAÇÃO COMERCIAL', stages: [314, 317, 315, 316, 318, 319, 320] },
    34: { name: '[1] REATIVAÇÃO MARKETING', stages: [286, 287, 288, 289, 369, 370, 371, 372, 373, 374, 296] },
    35: { name: '[1] ATIVAÇÃO MARKETING', stages: [298, 299, 300, 301, 375, 376, 377, 378, 379, 380, 307, 340, 341, 342, 343, 381, 382, 383, 384, 385, 386, 344] },
    36: { name: '[1] LABORATÓRIO', stages: [302, 367, 306, 305, 308] },
    38: { name: '[1] REATIVAÇÃO COMERCIAL', stages: [333, 334, 335, 336, 337, 338, 339] },
    41: { name: '[1] MONITORAMENTO COMERCIAL', stages: [353, 354, 355, 356, 357, 358, 359] }
}
```

## 🔄 Próximos Passos

### 1. Verificar Estrutura dos Dados do SprintHub

Executar o script `scripts/test-sprinthub-opportunity-structure.cjs` para:
- Ver quais campos realmente vêm do SprintHub
- Identificar campos que não estão sendo mapeados
- Verificar se os campos de data/hora já estão sendo enviados

**Comando:**
```bash
node scripts/test-sprinthub-opportunity-structure.cjs
```

**Requisitos:**
- Variáveis de ambiente configuradas:
  - `SPRINTHUB_BASE_URL` ou `VITE_SPRINTHUB_BASE_URL`
  - `SPRINTHUB_INSTANCE` ou `VITE_SPRINTHUB_INSTANCE`
  - `SPRINTHUB_TOKEN` ou `VITE_SPRINTHUB_API_TOKEN`

### 2. Ajustar TopMenuBar

**Ação necessária:**
- Remover ou ajustar a função `sincronizacaoCompletaFunil14()` 
- Fazer todos os botões usarem apenas a API do Easypanel (`/sync/oportunidades`)
- Garantir que não há sincronização direta do frontend

**Status:** ⏳ Pendente

### 3. Adicionar Campos Faltantes

Após executar o script de análise:
- Comparar campos retornados pelo SprintHub com campos da tabela
- Criar campos faltantes via MCP
- Atualizar `mapOpportunityFields()` para incluir novos campos

**Status:** ⏳ Pendente (aguardando resultado do script)

### 4. Testar Sincronização

Após todos os ajustes:
- Executar sincronização manual via botão
- Verificar se os campos de data/hora estão sendo salvos
- Verificar logs para erros

## 📋 Checklist

- [x] Campos de data/hora criados na tabela
- [x] Função de mapeamento criada na API
- [x] `mapOpportunityFields()` atualizado
- [ ] Script de análise executado
- [ ] TopMenuBar ajustado para usar apenas API
- [ ] Campos faltantes identificados e criados
- [ ] Sincronização testada

## 🔍 Como Verificar se Está Funcionando

1. **Verificar se campos estão sendo salvos:**
```sql
SELECT 
    id, 
    entrada_compra, 
    acolhimento_compra, 
    qualificado_compra 
FROM api.oportunidade_sprint 
WHERE entrada_compra IS NOT NULL 
LIMIT 10;
```

2. **Verificar logs da API:**
- Logs devem mostrar campos sendo mapeados
- Não deve haver erros de campos não encontrados

3. **Testar sincronização:**
- Clicar no botão de sincronização
- Verificar se dados são atualizados
- Verificar se novos campos são preenchidos


