# 📋 GUIA DE IMPLEMENTAÇÃO - ORÇAMENTO

## ✅ O QUE JÁ ESTÁ PRONTO

1. **Workflow n8n atualizado** - Já identifica automaticamente se é webhook de Entrada ou Orçamento
2. **Lógica de Orçamento/Negociação** - Conta como 1 orçamento se passar por qualquer uma das duas etapas
3. **Mapeamento de funis** - Todos os 5 funis já estão mapeados no n8n

---

## 🎯 PRÓXIMOS PASSOS

### 1️⃣ ATUALIZAR O WORKFLOW DO N8N

**Arquivo:** `n8n-workflow-webhook-sprinthub.json`

1. Abra o n8n
2. Clique em **"Import from File"** ou **"Import from URL"**
3. Selecione o arquivo `n8n-workflow-webhook-sprinthub.json`
4. Substitua o workflow atual pelo novo
5. Salve e ative o workflow

**Importante:** O workflow já está configurado para:
- Identificar automaticamente webhooks de ORÇAMENTO/NEGOCIAÇÃO
- Usar a data mais antiga entre Orçamento e Negociação
- Mapear o `crm_column` correto (207 para Orçamento, 83 para Negociação - exemplo do Funil Compra)

---

### 2️⃣ CONFIGURAR WEBHOOKS NO SPRINTHUB

Você precisa criar **5 webhooks diferentes**, um para cada funil.

#### 📌 **FUNIL 1: COMPRA (ID: 6)**

**URL do Webhook n8n:**
```
https://seu-n8n.com/webhook/sprinthub-oportunidade
```

**Método:** `POST`

**Headers:**
```
Content-Type: application/json
```

**Body (JSON):**
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

**Quando disparar:** Quando a oportunidade passar pela etapa **"Orçamento Realizado" (207)** OU **"Negociação" (83)**

---

#### 📌 **FUNIL 2: RECOMPRA (ID: 14)**

**Body (JSON):**
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
  "entrada_recompra": "{op=Entrada Recompra}",
  "acolhimento_recompra": "{op=Acolhimento Recompra}",
  "qualificado_recompra": "{op=Qualificado Recompra}",
  "orcamento_recompra": "{op=Orcamento Recompra}",
  "negociacao_recompra": "{op=Negociacao Recompra}",
  "follow_up_recompra": "{op=Follow Up Recompra}",
  "cadastro_recompra": "{op=Cadastro Recompra}",
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

**Quando disparar:** Quando a oportunidade passar pela etapa **"Orçamento Realizado" (206)** OU **"Negociação" (203)**

---

#### 📌 **FUNIL 3: ATIVAÇÃO (ID: 33)**

**Body (JSON):**
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
  "entrada_ativacao": "{op=Entrada Ativacao}",
  "acolhimento_ativacao": "{op=Acolhimento Ativacao}",
  "qualificado_ativacao": "{op=Qualificado Ativacao}",
  "orcamento_ativacao": "{op=Orcamento Ativacao}",
  "negociacao_ativacao": "{op=Negociacao Ativacao}",
  "follow_up_ativacao": "{op=Follow Up Ativacao}",
  "cadastro_ativacao": "{op=Cadastro Ativacao}",
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

**Quando disparar:** Quando a oportunidade passar pela etapa **"Orçamento Realizado" (316)** OU **"Negociação" (318)**

---

#### 📌 **FUNIL 4: MONITORAMENTO (ID: 41)**

**Body (JSON):**
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
  "entrada_monitoramento": "{op=Entrada Monitoramento}",
  "acolhimento_monitoramento": "{op=Acolhimento Monitoramento}",
  "qualificado_monitoramento": "{op=Qualificado Monitoramento}",
  "orcamento_monitoramento": "{op=Orcamento Monitoramento}",
  "negociacao_monitoramento": "{op=Negociacao Monitoramento}",
  "follow_up_monitoramento": "{op=Follow Up Monitoramento}",
  "cadastro_monitoramento": "{op=Cadastro Monitoramento}",
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

**Quando disparar:** Quando a oportunidade passar pela etapa **"Orçamento Realizado" (356)** OU **"Negociação" (357)**

---

#### 📌 **FUNIL 5: REATIVAÇÃO (ID: 38)**

**Body (JSON):**
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
  "entrada_reativacao": "{op=Entrada Reativacao}",
  "acolhimento_reativacao": "{op=Acolhimento Reativacao}",
  "qualificado_reativacao": "{op=Qualificado Reativacao}",
  "orcamento_reativacao": "{op=Orcamento Reativacao}",
  "negociacao_reativacao": "{op=Negociacao Reativacao}",
  "follow_up_reativacao": "{op=Follow Up Reativacao}",
  "cadastro_reativacao": "{op=Cadastro Reativacao}",
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

**Quando disparar:** Quando a oportunidade passar pela etapa **"Orçamento Realizado" (336)** OU **"Negociação" (337)**

---

## 🔍 RESUMO DAS ETAPAS POR FUNIL

| Funil | ID | Etapa Orçamento (ID) | Etapa Negociação (ID) |
|-------|----|--------------------|---------------------|
| **COMPRA** | 6 | 207 | 83 |
| **RECOMPRA** | 14 | 206 | 203 |
| **ATIVAÇÃO** | 33 | 316 | 318 |
| **MONITORAMENTO** | 41 | 356 | 357 |
| **REATIVAÇÃO** | 38 | 336 | 337 |

---

## 🎯 COMO FUNCIONA A LÓGICA

1. **SprintHub** envia webhook quando a oportunidade passa por Orçamento OU Negociação
2. **n8n** recebe o webhook e identifica automaticamente:
   - Qual funil (baseado nos campos `orcamento_*` ou `negociacao_*`)
   - Se tem Orçamento e/ou Negociação preenchidos
   - Usa a **data mais antiga** entre os dois
   - Define o `crm_column` correto (Orçamento ou Negociação)
3. **Supabase** recebe os dados e faz UPSERT (insere ou atualiza)

---

## ⚠️ IMPORTANTE

- **Não duplica:** Se a oportunidade passar por Orçamento E Negociação, conta como **1 orçamento** (usa a data mais antiga)
- **Funciona direto:** Se a oportunidade passar direto para Negociação (sem Orçamento), conta como **1 orçamento**
- **Mesmo webhook URL:** Todos os 5 funis usam a **mesma URL do n8n** - ele identifica automaticamente qual funil é

---

## 🧪 TESTE

Depois de configurar, teste com uma oportunidade que:
1. Passou por Orçamento
2. Ou passou direto para Negociação

Verifique no Supabase se os campos `orcamento_*` e/ou `negociacao_*` foram preenchidos corretamente!

