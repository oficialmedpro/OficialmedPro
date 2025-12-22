# ✅ Análise do Payload de ORÇAMENTO - Funil 6

## 📋 Payload Proposto:

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

---

## ✅ O Que Está CORRETO:

1. ✅ **funil_id: 6** - Correto (COMPRA)
2. ✅ **funil_nome: "[1] COMERCIAL APUCARANA"** - Correto
3. ✅ **crm_column: 207** - Correto (Orçamento do funil 6)
4. ✅ **orcamento_compra** - Campo necessário para identificar orçamento
5. ✅ **Campos básicos** (id, title, user_id, status, create_date) - Corretos
6. ✅ **Campos de lead básicos** - OK (não causam problema)

---

## ⚠️ ATENÇÃO: Campo `negociacao_compra`

### O Problema:

Você está enviando **ambos** os campos:
- `orcamento_compra` ✅
- `negociacao_compra` ⚠️

### Como o n8n Lida com Isso:

```javascript
// Código do n8n (linhas 236-254)
const temOrcamento = body[campoOrcamento] && body[campoOrcamento] !== '' && body[campoOrcamento] !== null;
const temNegociacao = body[campoNegociacao] && body[campoNegociacao] !== '' && body[campoNegociacao] !== null;

if (temOrcamento || temNegociacao) {
  // Se ambas existem, usar a mais antiga
  if (dataOrcamento && dataNegociacao) {
    body.crm_column = dataOrcamento <= dataNegociacao ? config.crm_column_orcamento : config.crm_column_negociacao;
  } else if (dataOrcamento) {
    body.crm_column = config.crm_column_orcamento; // 207
  } else if (dataNegociacao) {
    body.crm_column = config.crm_column_negociacao; // 83
  }
}
```

### O Que Pode Acontecer:

- Se você enviar `negociacao_compra` vazio/null → Nenhum problema, n8n usa `orcamento_compra` (207) ✅
- Se você enviar `negociacao_compra` com data → n8n vai comparar datas e escolher a mais antiga ⚠️
- Se `negociacao_compra` for mais antigo → n8n vai sobrescrever `crm_column` para `83` (negociação) ❌

---

## ✅ Recomendação:

### Se você quer garantir que seja ORÇAMENTO (207):

**Opção 1: Remover `negociacao_compra` (Recomendado para Orçamento)**
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
  "orcamento_compra": "{op=Orcamento Compra}",
  "value": "{op=value}",
  "lead_firstname": "{contactfield=firstname}",
  "lead_lastname": "{contactfield=lastname}",
  "lead_email": "{contactfield=email}",
  "lead_whatsapp": "{contactfield=whatsapp}",
  "lead_id": "{contactfield=id}"
}
```

**Opção 2: Manter ambos, mas garantir que `orcamento_compra` seja mais antigo**
- Se você enviar ambos com datas, o n8n escolherá a mais antiga
- Se `orcamento_compra` for mais antigo → usa 207 ✅
- Se `negociacao_compra` for mais antigo → usa 83 (negociação) ⚠️

---

## 📊 Campos Opcionais que Você Está Enviando:

### Campos que não são necessários para ORÇAMENTO (mas não causam problema):

1. ❓ `entrada_compra` - Não necessário para orçamento (mas OK, pode servir de contexto)
2. ❓ `acolhimento_compra` - Não necessário para orçamento
3. ❓ `qualificado_compra` - Não necessário para orçamento

**Esses campos não causam problema**, mas aumentam o tamanho do payload. Se quiser otimizar, pode remover.

### Campo que FALTA e é IMPORTANTE:

⚠️ **`value`** - O valor do orçamento é necessário para métricas!

```json
"value": "{op=value}",  // ← ADICIONAR ISSO!
```

---

## ✅ Payload RECOMENDADO para ORÇAMENTO (Otimizado):

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
  "value": "{op=value}",
  "lead_firstname": "{contactfield=firstname}",
  "lead_lastname": "{contactfield=lastname}",
  "lead_email": "{contactfield=email}",
  "lead_whatsapp": "{contactfield=whatsapp}",
  "lead_id": "{contactfield=id}"
}
```

### Mudanças:
- ✅ Removido: `negociacao_compra` (para garantir que use crm_column 207)
- ✅ Removido: `entrada_compra`, `acolhimento_compra`, `qualificado_compra` (não necessários)
- ✅ Adicionado: `value` (IMPORTANTE para métricas)
- ✅ Adicionado: `update_date` (recomendado para auditoria)
- ✅ Removido: `etapa` (não é necessário, o crm_column já identifica)

---

## 🎯 Resposta Final:

### Seu Payload está **QUASE correto**, mas:

1. ⚠️ **Remova `negociacao_compra`** (se quiser garantir que seja orçamento)
2. ⚠️ **Adicione `value`** (importante para métricas)
3. ✅ **O resto está OK** (os campos extras não causam problema, só aumentam o payload)

### O n8n vai funcionar mesmo com seu payload atual, mas:
- Pode escolher negociação (83) se `negociacao_compra` tiver data mais antiga
- Não vai ter o valor para calcular métricas de ticket médio

