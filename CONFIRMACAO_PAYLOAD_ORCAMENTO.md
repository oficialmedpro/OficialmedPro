# ✅ Confirmação: Payload de ORÇAMENTO Está CORRETO!

## 🎯 Você Está Certo!

Você já havia mencionado que às vezes a pessoa **pula a etapa de orçamento** e vai direto para **negociação**, e que **ambos devem contar como "orçamento"** na dashboard.

O código já está preparado para isso!

---

## ✅ Como Funciona:

### 1. **No n8n:**
```javascript
// Linha 232: Aceita ORÇAMENTO OU NEGOCIAÇÃO
if (temOrcamento || temNegociacao) {
  tipoWebhook = 'orcamento';  // ← Ambos são tratados como 'orcamento'
  
  // Escolhe qual crm_column usar baseado na data mais antiga
  if (dataOrcamento && dataNegociacao) {
    body.crm_column = dataOrcamento <= dataNegociacao ? config.crm_column_orcamento : config.crm_column_negociacao;
  } else if (dataOrcamento) {
    body.crm_column = config.crm_column_orcamento; // 207
  } else if (dataNegociacao) {
    body.crm_column = config.crm_column_negociacao; // 83
  }
}
```

### 2. **No Supabase (Dashboard):**
```javascript
// getOrcamentosVendedoresHoje busca AMBOS:
// - Query 1: Busca orcamento_compra
// - Query 2: Busca negociacao_compra
// - Combina os resultados
// - Ambos contam como "orçamento"
```

---

## ✅ Seu Payload Está CORRETO!

```json
{
  "id": "{op=id}",
  "title": "{op=title}",
  "funil_id": 6,
  "funil_nome": "[1] COMERCIAL APUCARANA",
  "crm_column": 207,
  "user_id": "{op=user}", 
  "status": "{op=status}",
  "create_date": "{op=createDate}",
  "etapa": "[3] ORÇAMENTO REALIZADO",
  "entrada_compra": "{op=Entrada Compra}",
  "acolhimento_compra": "{op=Acolhimento Compra}",
  "qualificado_compra": "{op=Qualificado Compra}",
  "orcamento_compra": "{op=Orcamento Compra}",
  "negociacao_compra": "{op=Negociacao Compra}",
  "lead_firstname": "{contactfield=firstname}",
  "lead_lastname": "{contactfield=lastname}",
  "lead_email": "{contactfield=email}",
  "lead_whatsapp": "{contactfield=whatsapp}",
  "lead_id": "{contactfield=id}"
}
```

### ✅ Por que está correto:
1. ✅ Envia `orcamento_compra` → Se preenchido, usa crm_column 207
2. ✅ Envia `negociacao_compra` → Se pessoa pulou orçamento, usa crm_column 83
3. ✅ O n8n escolhe automaticamente qual usar (baseado na data mais antiga)
4. ✅ Na dashboard, **ambos são contados como "orçamento"**

---

## ⚠️ ÚNICA Coisa que FALTA:

### Adicione o campo `value` (importante para métricas):

```json
"value": "{op=value}",
```

Esse campo é necessário para calcular:
- Ticket médio
- Valor total de orçamentos
- Métricas financeiras

---

## ✅ Payload Final Recomendado:

```json
{
  "id": "{op=id}",
  "title": "{op=title}",
  "funil_id": 6,
  "funil_nome": "[1] COMERCIAL APUCARANA",
  "crm_column": 207,
  "user_id": "{op=user}", 
  "status": "{op=status}",
  "create_date": "{op=createDate}",
  "update_date": "{op=updateDate}",
  "orcamento_compra": "{op=Orcamento Compra}",
  "negociacao_compra": "{op=Negociacao Compra}",
  "value": "{op=value}",
  "lead_firstname": "{contactfield=firstname}",
  "lead_lastname": "{contactfield=lastname}",
  "lead_email": "{contactfield=email}",
  "lead_whatsapp": "{contactfield=whatsapp}",
  "lead_id": "{contactfield=id}"
}
```

### Campos opcionais que você pode remover (para otimizar):
- `entrada_compra` - Não necessário para orçamento
- `acolhimento_compra` - Não necessário para orçamento
- `qualificado_compra` - Não necessário para orçamento
- `etapa` - Não é necessário (o crm_column já identifica)

Mas se quiser manter para contexto, **tudo bem também!**

---

## 🎯 Resumo:

- ✅ **Está correto** enviar ambos `orcamento_compra` e `negociacao_compra`
- ✅ O n8n vai escolher automaticamente qual usar (data mais antiga)
- ✅ Na dashboard, ambos são contados como "orçamento"
- ⚠️ **Adicione:** `value` (para métricas financeiras)
- ✅ **Não precisa mudar nada no n8n** - já está preparado!

