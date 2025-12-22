# 📊 Comparativo de Sincronização: Botão TopMenuBar vs API Easypanel

## 🔍 Resumo Executivo

**Ambos os sistemas sincronizam os MESMOS dados**, mas com diferenças importantes:

- ✅ **Mesma tabela**: `api.oportunidade_sprint`
- ✅ **Mesmos funis**: Ambos usam a mesma configuração de funis
- ⚠️ **Diferença**: O botão do TopMenuBar tem uma função específica para Funil 14 que usa endpoint diferente
- ⚠️ **Diferença**: A API do Easypanel sincroniza múltiplos recursos (oportunidades, leads, segmentos)

---

## 1️⃣ BOTÃO DO TOPMENUBAR (`src/components/TopMenuBar.jsx`)

### Função Principal: `handleSync()`
- **Endpoint chamado**: `GET /sync/all` via `syncApiService.triggerFull()`
- **URL base**: Configurada em `VITE_SYNC_API_URL` (provavelmente `https://sincrocrm.oficialmed.com.br`)
- **O que faz**: Chama a API do Easypanel que executa sincronização completa

### Função Específica: `sincronizacaoCompletaFunil14()`
- **Endpoint usado**: `POST /opportunity/get` (endpoint direto do SprintHub)
- **Funil**: Apenas Funil 14 (RECOMPRA)
- **Etapas**: `[202, 228, 229, 206, 203, 204, 230, 205, 269, 167, 148, 168, 149, 169, 150]`
- **Tabela**: `api.oportunidade_sprint`
- **Observação**: Esta função sincroniza diretamente do SprintHub, não passa pela API do Easypanel

### Função: `handleSyncNow()`
- **Endpoint chamado**: `GET /sync/all` via `syncApiService.triggerFull()`
- **Mesma coisa que**: `handleSync()` - chama a API do Easypanel

---

## 2️⃣ API DO EASYPANEL (`api-sync-opportunities.js`)

### Endpoint Principal: `GET /sync/all` ou `GET /sync/oportunidades`
- **Função**: `runFullSync()` → `syncOpportunities()`
- **Tabela**: `api.oportunidade_sprint`

### Funis Sincronizados (FUNIS_CONFIG):

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

**Total: 10 funis, ~100+ etapas**

### Endpoint SprintHub Usado:
- `POST /crm/opportunities/{funnelId}?apitoken=...&i=...`
- Payload: `{ page, limit, columnId: stageId }`

### Outros Recursos Sincronizados:
- **Leads**: Tabela `api.leads` (via `syncLeads()`)
- **Segmentos**: Tabela `api.segmento` (via `syncSegments()`)
- **Vendedores**: Não sincronizado (endpoint não existe na API SprintHub)

---

## 3️⃣ CAMPOS SINCRONIZADOS

### Tabela: `api.oportunidade_sprint`

#### Campos Mapeados pela API (`mapOpportunityFields()`):

```javascript
{
    id,                          // ID da oportunidade
    title,                       // Título
    value,                       // Valor (float)
    crm_column,                  // ID da etapa/coluna
    lead_id,                     // ID do lead
    user_id,                     // ID do usuário
    funil_id,                    // ID do funil
    status,                      // Status (open, gain, lost, etc)
    loss_reason,                 // Motivo da perda
    gain_reason,                 // Motivo do ganho
    origem_oportunidade,         // Campo customizado
    qualificacao,                // Campo customizado
    status_orcamento,            // Campo customizado
    lead_firstname,              // Dados do lead
    lead_lastname,
    lead_email,
    lead_whatsapp,
    lead_city,
    utm_source,                  // UTM tags
    utm_medium,
    utm_campaign,
    create_date,                 // Datas
    update_date,
    gain_date,
    lost_date,
    archived,                    // Flag arquivado
    unidade_id,                  // '[1]'
    synced_at                    // Timestamp da sincronização
}
```

**⚠️ IMPORTANTE**: Os campos de data/hora que você acabou de criar (ex: `entrada_compra`, `acolhimento_compra`, etc.) **NÃO estão sendo sincronizados** pela API atual. Eles precisarão ser mapeados quando a API do SprintHub começar a enviá-los.

---

## 4️⃣ COMPARAÇÃO DETALHADA

| Aspecto | Botão TopMenuBar | API Easypanel |
|---------|------------------|---------------|
| **Tabela de Destino** | `api.oportunidade_sprint` | `api.oportunidade_sprint` |
| **Funis Sincronizados** | Via API (todos) ou Funil 14 específico | 10 funis (6, 9, 14, 32, 33, 34, 35, 36, 38, 41) |
| **Etapas Funil 14** | `[202, 228, 229, 206, 203, 204, 230, 205, 269, 167, 148, 168, 149, 169, 150]` | `[202, 228, 229, 206, 203, 204, 230, 205, 269, 167, 148, 168, 149, 169, 150]` ✅ **IGUAIS** |
| **Endpoint SprintHub** | `/opportunity/get` (função específica) ou via API | `/crm/opportunities/{funnelId}` |
| **Campos Sincronizados** | Mesmos campos (via API) | Mesmos campos |
| **Outros Recursos** | Não sincroniza diretamente | Sincroniza Leads e Segmentos também |
| **Controle de Lock** | Não (chama API que tem) | Sim (variável `isSyncRunning`) |
| **Logs** | Via API | Sim (tabelas `sync_control`, `sync_runs`) |

---

## 5️⃣ CONCLUSÃO

### ✅ São o Mesmo Código?
**SIM e NÃO**:

1. **Botão `handleSync()` e `handleSyncNow()`**: 
   - ✅ **SIM** - Chamam a mesma API do Easypanel (`/sync/all`)
   - ✅ Sincronizam os mesmos dados, mesmos funis, mesmas tabelas

2. **Função `sincronizacaoCompletaFunil14()`**:
   - ❌ **NÃO** - É código diferente no frontend
   - ❌ Usa endpoint diferente do SprintHub (`/opportunity/get` vs `/crm/opportunities/{funnelId}`)
   - ✅ Mas sincroniza para a mesma tabela (`api.oportunidade_sprint`)
   - ✅ Usa as mesmas etapas do Funil 14

### ⚠️ Diferenças Importantes:

1. **Função específica do Funil 14 no TopMenuBar**:
   - Usa endpoint diferente do SprintHub
   - Pode ter comportamento ligeiramente diferente
   - Mas resulta na mesma tabela

2. **API do Easypanel**:
   - Sincroniza múltiplos recursos (oportunidades, leads, segmentos)
   - Tem controle de lock para evitar execuções simultâneas
   - Tem sistema de logs mais robusto

3. **Campos de Data/Hora**:
   - ⚠️ **NENHUM dos dois está sincronizando os novos campos** (`entrada_compra`, `acolhimento_compra`, etc.)
   - Será necessário adicionar o mapeamento quando a API do SprintHub começar a enviá-los

---

## 6️⃣ RECOMENDAÇÕES

1. **Padronizar**: Remover a função `sincronizacaoCompletaFunil14()` do TopMenuBar e usar sempre a API do Easypanel
2. **Adicionar Mapeamento**: Incluir os novos campos de data/hora no `mapOpportunityFields()` quando disponíveis na API do SprintHub
3. **Verificar Endpoints**: Confirmar se `/opportunity/get` e `/crm/opportunities/{funnelId}` retornam os mesmos dados
4. **Unificar**: Usar sempre a API do Easypanel para garantir consistência

---

## 7️⃣ PRÓXIMOS PASSOS

Para sincronizar os novos campos de data/hora:

1. Verificar se a API do SprintHub já retorna esses campos
2. Adicionar mapeamento em `mapOpportunityFields()` em `api-sync-opportunities.js`
3. Testar sincronização
4. Verificar se os dados estão sendo salvos corretamente



