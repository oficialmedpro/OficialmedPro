# 📋 INSTRUÇÕES: IMPLEMENTAR CADASTRO (VENDAS) NO N8N

## 📦 ARQUIVOS CRIADOS

1. **`CODIGO_N8N_COM_CADASTRO.js`** - Código completo para o node "Adicionar Wrapper" no n8n
2. **`PAYLOAD_SPRINTHUB_CADASTRO.md`** - Payloads completos para configurar webhooks no SprintHub

---

## 🔧 PASSO 1: ATUALIZAR O CÓDIGO NO N8N

1. Abra o workflow do n8n: **"Webhook SprintHub → Supabase"**
2. Localize o node **"Adicionar Wrapper"** (tipo: Code)
3. Abra o arquivo **`CODIGO_N8N_COM_CADASTRO.js`**
4. **COPIE TODO O CONTEÚDO** do arquivo
5. **COLE** no campo "JavaScript Code" do node no n8n
6. **SALVE** o workflow

### ✅ O QUE O CÓDIGO FAZ:

- ✅ Identifica automaticamente webhooks de **CADASTRO** (vendas)
- ✅ Identifica webhooks de **ORÇAMENTO/NEGOCIAÇÃO**
- ✅ Identifica webhooks de **ENTRADA**
- ✅ Define automaticamente o `crm_column`, `funil_id` e `funil_nome` corretos
- ✅ Prioridade: **CADASTRO** → **ORÇAMENTO** → **ENTRADA**

---

## 🎯 PASSO 2: CONFIGURAR WEBHOOKS NO SPRINTHUB

Para cada funil, você precisa criar um webhook que será disparado quando:
- ✅ O campo `cadastro_*` for preenchido
- ✅ OU o `status` for **'gain'** ou **'won'**

### 📋 INSTRUÇÕES:

1. Abra o SprintHub
2. Vá em **Configurações → Webhooks**
3. Crie um novo webhook (ou edite o existente)
4. Use o **mesmo URL do n8n** que já está configurado: `[URL do n8n]/webhook-oportunidade-sprint`
5. Use o payload do arquivo **`PAYLOAD_SPRINTHUB_CADASTRO.md`** correspondente ao funil

---

## 📊 MAPEAMENTO DE ETAPAS CADASTRO

| Funil | Funil ID | Etapa CADASTRO | ID CADASTRO |
|-------|----------|----------------|-------------|
| **Compra** | 6 | CADASTRO | **232** |
| **Recompra** | 14 | CADASTRO | **230** |
| **Ativacao** | 33 | CADASTRO | **320** |
| **Monitoramento** | 41 | CADASTRO | **359** |
| **Reativacao** | 38 | CADASTRO | **339** |

---

## ⚠️ IMPORTANTE

### 🎯 LÓGICA DE IDENTIFICAÇÃO NO N8N:

1. **CADASTRO (Prioridade 1):**
   - Se tem campo `cadastro_*` preenchido → identifica funil pelo campo
   - Se tem `status='gain'` ou `status='won'` → identifica funil por:
     - `crm_column` no body
     - `funil_id` no body
     - Campos de entrada/orçamento preenchidos
     - Fallback: Funil COMPRA (6)

2. **ORÇAMENTO (Prioridade 2):**
   - Se tem campo `orcamento_*` OU `negociacao_*` preenchido
   - Usa a data mais antiga entre os dois

3. **ENTRADA (Prioridade 3):**
   - Se tem campo `entrada_*` preenchido

### 🔑 CAMPOS OBRIGATÓRIOS NO PAYLOAD:

- ✅ `user_id: "{op=user}"` - **ATENÇÃO:** É `{op=user}` e NÃO `{op=user_id}`
- ✅ `id: "{op=id}"`
- ✅ `status: "{op=status}"` - Para identificar vendas com status='gain'
- ✅ `crm_column: "{op=crm_column}"` - Para ajudar na identificação quando tiver status='gain'
- ✅ Todos os campos da jornada completa (entrada, acolhimento, qualificado, orcamento, negociacao, follow_up, cadastro)

---

## 🧪 TESTE

Depois de configurar:

1. **Crie uma oportunidade** que passe pela etapa CADASTRO
2. **Verifique no Supabase** se o campo `cadastro_*` foi preenchido corretamente
3. **Verifique** se o `crm_column` está correto (232 para Compra, 230 para Recompra, etc.)
4. **Verifique** se o `funil_id` e `funil_nome` estão corretos

---

## 📝 EXEMPLO DE PAYLOAD PARA COMPRA

```json
{
  "id": "{op=id}",
  "title": "{op=title}",
  "value": "{op=value}",
  "user_id": "{op=user}",
  "status": "{op=status}",
  "create_date": "{op=createDate}",
  "update_date": "{op=updateDate}",
  "etapa": "{op=etapa}",
  "crm_column": "{op=crm_column}",
  "entrada_compra": "{op=Entrada Compra}",
  "acolhimento_compra": "{op=Acolhimento Compra}",
  "qualificado_compra": "{op=Qualificado Compra}",
  "orcamento_compra": "{op=Orcamento Compra}",
  "negociacao_compra": "{op=Negociacao Compra}",
  "follow_up_compra": "{op=Follow Up Compra}",
  "cadastro_compra": "{op=Cadastro Compra}",
  "origem_oportunidade": "{op=ORIGEM OPORTUNIDADE}",
  "tipo_de_compra": "{op=Tipo de Compra}",
  "lead_firstname": "{contactfield=firstname}",
  "lead_lastname": "{contactfield=lastname}",
  "lead_email": "{contactfield=email}",
  "lead_whatsapp": "{contactfield=whatsapp}",
  "lead_cpf": "{contactfield=cpf}",
  "lead_zipcode": "{contactfield=zipcode}",
  "lead_rua": "{contactfield=address}",
  "lead_city": "{contactfield=city}",
  "lead_estado": "{contactfield=state}",
  "lead_pais": "{contactfield=country}",
  "lead_data_nascimento": "{contactfield=data_de_nascimento}",
  "lead_id": "{contactfield=id}",
  "lead_rg": "{contactfield=rg}"
}
```

---

## ✅ CHECKLIST

- [ ] Código do n8n atualizado com a lógica de CADASTRO
- [ ] Webhooks configurados no SprintHub para todos os 5 funis
- [ ] Payloads corretos com `user_id: "{op=user}"`
- [ ] Todos os campos da jornada incluídos nos payloads
- [ ] Testado com uma oportunidade real
- [ ] Verificado no Supabase se os dados estão corretos

---

**🎉 Pronto! Agora o sistema está preparado para receber dados de CADASTRO (vendas) e calcular as métricas de vendas no Cockpit!**


