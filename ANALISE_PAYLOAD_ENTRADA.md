# ✅ Análise do Payload de ENTRADA

## 📋 Payload Proposto:

```json
{
  "id": "{op=id}",
  "title": "{op=title}",
  "funil_id": 6,
  "funil_nome": "[1] COMERCIAL APUCARANA",
  "crm_column": 130,
  "user_id": "{op=user}", 
  "status": "{op=status}",
  "create_date": "{op=createDate}",
  "etapa": "[0] ENTRADA",
  "entrada_compra": "{op=Entrada Compra}",
  "lead_firstname": "{contactfield=firstname}",
  "lead_lastname": "{contactfield=lastname}",
  "lead_email": "{contactfield=email}",
  "lead_whatsapp": "{contactfield=whatsapp}",
  "lead_id": "{contactfield=id}"
}
```

---

## ✅ RESPOSTA: **NÃO precisa mexer no n8n!**

### Por quê?

1. **O código do n8n já está preparado:**
   - Ele recebe qualquer payload e passa adiante para o Supabase
   - Não há validação ou filtro de campos
   - Usa UPSERT (`on_conflict=id`), então funciona com payload parcial

2. **Os campos que você está enviando são válidos:**
   - Todos os campos `lead_*` são aceitos pelo Supabase
   - O n8n apenas repassa o body para o Supabase
   - O Supabase aceita esses campos na tabela `oportunidade_sprint`

3. **UPSERT funciona perfeitamente:**
   - Se o registro já existe, atualiza apenas os campos enviados (mantém os outros)
   - Se não existe, cria com os campos enviados
   - Quando chegar a venda com payload completo, vai completar todos os campos

---

## ⚠️ PEQUENO AJUSTE RECOMENDADO:

Tem um pequeno erro de sintaxe no JSON (aspas simples no `funil_nome`):

### ❌ Errado:
```json
"funil_nome":'[ 1] COMERCIAL APUCARANA",
```

### ✅ Correto:
```json
"funil_nome": "[1] COMERCIAL APUCARANA",
```

*(Note: aspas duplas em vez de simples, e sem espaço extra no `[ 1]`)*

---

## 📊 Payload Corrigido:

```json
{
  "id": "{op=id}",
  "title": "{op=title}",
  "funil_id": 6,
  "funil_nome": "[1] COMERCIAL APUCARANA",
  "crm_column": 130,
  "user_id": "{op=user}", 
  "status": "{op=status}",
  "create_date": "{op=createDate}",
  "etapa": "[0] ENTRADA",
  "entrada_compra": "{op=Entrada Compra}",
  "lead_firstname": "{contactfield=firstname}",
  "lead_lastname": "{contactfield=lastname}",
  "lead_email": "{contactfield=email}",
  "lead_whatsapp": "{contactfield=whatsapp}",
  "lead_id": "{contactfield=id}"
}
```

---

## 🎯 Observações:

### 1. **Campos de Lead são Opcionais mas Úteis:**
- Você está enviando alguns campos de lead (firstname, lastname, email, whatsapp, id)
- Isso é **OK** - não é mínimo, mas também não é o payload completo
- É um meio termo interessante: dados básicos do lead + dados mínimos da oportunidade

### 2. **O n8n Vai:**
- Identificar que é ENTRADA COMPRA pelo campo `entrada_compra`
- Mapear `funil_id: 6` e `crm_column: 130` (mas você já está enviando, então não vai sobrescrever)
- Passar todo o payload para o Supabase

### 3. **O Supabase Vai:**
- Fazer UPSERT pelo `id`
- Se registro já existe: atualizar apenas os campos enviados
- Se não existe: criar com os campos enviados
- Quando chegar payload completo (venda), vai completar todos os campos

---

## ✅ Conclusão:

**Tudo OK!** Só corrigir a sintaxe do `funil_nome` e usar. O n8n não precisa de nenhuma alteração.

