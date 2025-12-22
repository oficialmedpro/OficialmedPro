# ⚠️ Análise: Enviar funil_id e crm_column no Payload

## 🔍 Como o n8n Lida com Isso:

### 1. **funil_id e funil_nome:**
```javascript
// Linhas 276-280
if (!body.funil_id) {
  body.funil_id = funilConfig.funil_id;
}
if (!body.funil_nome) {
  body.funil_nome = funilConfig.funil_nome;
}
```
✅ **RESPOSTA:** O código só adiciona se **não existir** (`if (!body.funil_id)`).
- Se você enviar `funil_id: 6` no payload, ele **NÃO vai sobrescrever**
- Vai usar o valor que você enviou

### 2. **crm_column:**
```javascript
// Linha 267 (quando identifica ENTRADA)
body.crm_column = config.crm_column;
```
⚠️ **PROBLEMA:** O código **SEMPRE sobrescreve** o `crm_column` quando identifica o tipo de webhook.

---

## 🎯 No Seu Caso Específico:

### Seu Payload:
```json
{
  "funil_id": 6,
  "crm_column": 130,
  "entrada_compra": "{op=Entrada Compra}"
}
```

### O que o n8n vai fazer:

1. ✅ Identifica que é ENTRADA COMPRA (pelo campo `entrada_compra`)
2. ✅ Encontra o config: `crm_column: 130, funil_id: 6`
3. ✅ Verifica `if (!body.funil_id)` → **FALSE** (porque você enviou `6`)
   - **NÃO sobrescreve** `funil_id` (mantém o seu valor `6`)
4. ⚠️ Executa `body.crm_column = config.crm_column` → **Sobrescreve com `130`**
   - Mas como você também enviou `130`, **não muda nada na prática!**

---

## ✅ Conclusão: **Está Tudo OK!**

### Por quê?

1. **Os valores que você está enviando são os mesmos que o código identificaria:**
   - Você envia: `funil_id: 6, crm_column: 130`
   - Código identificaria: `funil_id: 6, crm_column: 130`
   - **Resultado final:** `funil_id: 6, crm_column: 130` (igual!)

2. **funil_id não é sobrescrito:**
   - O código verifica se existe antes de definir
   - Se você enviar, ele respeita

3. **crm_column é sobrescrito, mas com o mesmo valor:**
   - Mesmo que seja sobrescrito, o valor é idêntico
   - Não há conflito

---

## 💡 Recomendações:

### Opção 1: **Enviar apenas funil_id (Recomendado)**
```json
{
  "id": "{op=id}",
  "funil_id": 6,
  "funil_nome": "[1] COMERCIAL APUCARANA",
  "entrada_compra": "{op=Entrada Compra}",
  // ... outros campos
}
```
- ✅ `funil_id` e `funil_nome` serão respeitados
- ✅ `crm_column` será identificado automaticamente (130) pelo código do n8n
- ✅ Menos redundância

### Opção 2: **Enviar tudo (Atual - Também Funciona)**
```json
{
  "id": "{op=id}",
  "funil_id": 6,
  "funil_nome": "[1] COMERCIAL APUCARANA",
  "crm_column": 130,
  "entrada_compra": "{op=Entrada Compra}",
  // ... outros campos
}
```
- ✅ Funciona perfeitamente
- ⚠️ `crm_column` será sobrescrito (mas com o mesmo valor)
- ⚠️ Mais redundância (mas não causa problema)

---

## 🎯 Resposta Final:

**Você pode enviar `funil_id` e `crm_column` no payload sem problema!**

- O código do n8n vai funcionar normalmente
- Se os valores que você enviar forem corretos (como estão: `6` e `130`), tudo vai funcionar perfeitamente
- Se quiser evitar redundância, pode enviar só `funil_id` e deixar o código identificar o `crm_column`

**Não precisa mudar nada no n8n!** ✅

