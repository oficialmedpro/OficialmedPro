# 📋 PAYLOADS PARA WEBHOOKS DE ORÇAMENTO - SPRINTHUB

## 🎯 LÓGICA DE ORÇAMENTO

Um orçamento é contabilizado quando o lead passa pela etapa **ORÇAMENTO** OU pela etapa **NEGOCIAÇÃO**.

- ✅ Se passar pelas duas etapas → conta apenas **1 orçamento** (usar a data mais antiga)
- ✅ Se passar direto para Negociação (sem passar por Orçamento) → conta como **1 orçamento**
- ✅ O objetivo é evitar duplicação e garantir que qualquer interação nessa fase seja contabilizada

---

## 📤 1. ORÇAMENTO COMPRA (Funil 6)

**Etapas:** Orçamento Realizado (207) OU Negociação (83)

### Campos no SprintHub:
```
Acolhimento Compra: {op=Acolhimento Compra}
Qualificado Compra: {op=Qualificado Compra}
Orcamento Compra: {op=Orcamento Compra}
Negociacao Compra: {op=Negociacao Compra}
```

### Payload JSON:
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
  "acolhimento_compra": "{op=Acolhimento Compra}",
  "qualificado_compra": "{op=Qualificado Compra}",
  "orcamento_compra": "{op=Orcamento Compra}",
  "negociacao_compra": "{op=Negociacao Compra}",
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

## 📤 2. ORÇAMENTO RECOMPRA (Funil 14)

**Etapas:** Orçamentos (206) OU Negociação (203)

### Campos no SprintHub:
```
Acolhimento Recompra: {op=Acolhimento Recompra}
Qualificado Recompra: {op=Qualificado Recompra}
Orcamento Recompra: {op=Orcamento Recompra}
Negociacao Recompra: {op=Negociacao Recompra}
```

### Payload JSON:
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
  "acolhimento_recompra": "{op=Acolhimento Recompra}",
  "qualificado_recompra": "{op=Qualificado Recompra}",
  "orcamento_recompra": "{op=Orcamento Recompra}",
  "negociacao_recompra": "{op=Negociacao Recompra}",
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

## 📤 3. ORÇAMENTO ATIVAÇÃO (Funil 33)

**Etapas:** Orçamento Realizado (316) OU Negociação (318)

### Campos no SprintHub:
```
Acolhimento Ativacao: {op=Acolhimento Ativacao}
Qualificado Ativacao: {op=Qualificado Ativacao}
Orcamento Ativacao: {op=Orcamento Ativacao}
Negociacao Ativacao: {op=Negociacao Ativacao}
```

### Payload JSON:
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
  "acolhimento_ativacao": "{op=Acolhimento Ativacao}",
  "qualificado_ativacao": "{op=Qualificado Ativacao}",
  "orcamento_ativacao": "{op=Orcamento Ativacao}",
  "negociacao_ativacao": "{op=Negociacao Ativacao}",
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

## 📤 4. ORÇAMENTO MONITORAMENTO (Funil 41)

**Etapas:** Orçamento Realizado (356) OU Negociação (357)

### Campos no SprintHub:
```
Acolhimento Monitoramento: {op=Acolhimento Monitoramento}
Qualificado Monitoramento: {op=Qualificado Monitoramento}
Orcamento Monitoramento: {op=Orcamento Monitoramento}
Negociacao Monitoramento: {op=Negociacao Monitoramento}
```

### Payload JSON:
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
  "acolhimento_monitoramento": "{op=Acolhimento Monitoramento}",
  "qualificado_monitoramento": "{op=Qualificado Monitoramento}",
  "orcamento_monitoramento": "{op=Orcamento Monitoramento}",
  "negociacao_monitoramento": "{op=Negociacao Monitoramento}",
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

## 📤 5. ORÇAMENTO REATIVAÇÃO (Funil 38)

**Etapas:** Orçamento Realizado (336) OU Negociação (337)

### Campos no SprintHub:
```
Acolhimento Reativacao: {op=Acolhimento Reativacao}
Qualificado Reativacao: {op=Qualificado Reativacao}
Orcamento Reativacao: {op=Orcamento Reativacao}
Negociacao Reativacao: {op=Negociacao Reativacao}
```

### Payload JSON:
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
  "acolhimento_reativacao": "{op=Acolhimento Reativacao}",
  "qualificado_reativacao": "{op=Qualificado Reativacao}",
  "orcamento_reativacao": "{op=Orcamento Reativacao}",
  "negociacao_reativacao": "{op=Negociacao Reativacao}",
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

## 🔧 CONFIGURAÇÃO NO SPRINTHUB

### URL do Webhook:
```
[URL do seu n8n]/webhook-oportunidade-sprint
```

### Headers:
```
Content-Type: application/json
```

---

## 📊 MAPEAMENTO DE ETAPAS

| Funil | Funil ID | Etapa Orçamento | ID Orçamento | Etapa Negociação | ID Negociação |
|-------|----------|-----------------|--------------|------------------|---------------|
| Compra | 6 | ORÇAMENTO REALIZADO | 207 | NEGOCIAÇÃO | 83 |
| Recompra | 14 | ORÇAMENTOS | 206 | NEGOCIAÇÃO | 203 |
| Ativacao | 33 | [3] ORÇAMENTO REALIZADO | 316 | [4] NEGOCIAÇÃO | 318 |
| Monitoramento | 41 | [3] ORÇAMENTO REALIZADO | 356 | [4] NEGOCIAÇÃO | 357 |
| Reativacao | 38 | [3] ORÇAMENTO REALIZADO | 336 | [4] NEGOCIAÇÃO | 337 |

---

**Nota:** O n8n irá identificar automaticamente o funil baseado no campo preenchido (`orcamento_compra`, `orcamento_recompra`, etc.) e configurar o `crm_column` apropriado (207, 206, 316, 356 ou 336 respectivamente). Se o lead passar direto para Negociação, o n8n também identificará e configurará corretamente.

