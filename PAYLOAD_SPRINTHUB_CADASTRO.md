# 📋 PAYLOADS PARA WEBHOOKS DE CADASTRO (VENDAS) - SPRINTHUB

## 🎯 LÓGICA DE VENDAS (CADASTRO)

Uma venda é contabilizada quando:
- ✅ O lead está na etapa **CADASTRO** (`cadastro_*` preenchido)
- ✅ OU o `status` é **'gain'** ou **'won'**

O webhook deve ser disparado quando qualquer uma dessas condições for verdadeira.

---

## 📤 1. CADASTRO COMPRA (Funil 6)

**Etapa:** CADASTRO (232) OU status='gain'

### Campos no SprintHub:
```
Entrada Compra: {op=Entrada Compra}
Acolhimento Compra: {op=Acolhimento Compra}
Qualificado Compra: {op=Qualificado Compra}
Orcamento Compra: {op=Orcamento Compra}
Negociacao Compra: {op=Negociacao Compra}
Follow Up Compra: {op=Follow Up Compra}
Cadastro Compra: {op=Cadastro Compra}
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
  "gain_date": "{op=gainDate}",
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

**Quando disparar:** Quando `cadastro_compra` for preenchido OU `status='gain'`

---

## 📤 2. CADASTRO RECOMPRA (Funil 14)

**Etapa:** CADASTRO (230) OU status='gain'

### Campos no SprintHub:
```
Entrada Recompra: {op=Entrada Recompra}
Acolhimento Recompra: {op=Acolhimento Recompra}
Qualificado Recompra: {op=Qualificado Recompra}
Orcamento Recompra: {op=Orcamento Recompra}
Negociacao Recompra: {op=Negociacao Recompra}
Follow Up Recompra: {op=Follow Up Recompra}
Cadastro Recompra: {op=Cadastro Recompra}
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
  "gain_date": "{op=gainDate}",
  "etapa": "{op=etapa}",
  "crm_column": "{op=crm_column}",
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

**Quando disparar:** Quando `cadastro_recompra` for preenchido OU `status='gain'`

---

## 📤 3. CADASTRO ATIVAÇÃO (Funil 33)

**Etapa:** CADASTRO (320) OU status='gain'

### Campos no SprintHub:
```
Entrada Ativacao: {op=Entrada Ativacao}
Acolhimento Ativacao: {op=Acolhimento Ativacao}
Qualificado Ativacao: {op=Qualificado Ativacao}
Orcamento Ativacao: {op=Orcamento Ativacao}
Negociacao Ativacao: {op=Negociacao Ativacao}
Follow Up Ativacao: {op=Follow Up Ativacao}
Cadastro Ativacao: {op=Cadastro Ativacao}
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
  "gain_date": "{op=gainDate}",
  "etapa": "{op=etapa}",
  "crm_column": "{op=crm_column}",
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

**Quando disparar:** Quando `cadastro_ativacao` for preenchido OU `status='gain'`

---

## 📤 4. CADASTRO MONITORAMENTO (Funil 41)

**Etapa:** CADASTRO (359) OU status='gain'

### Campos no SprintHub:
```
Entrada Monitoramento: {op=Entrada Monitoramento}
Acolhimento Monitoramento: {op=Acolhimento Monitoramento}
Qualificado Monitoramento: {op=Qualificado Monitoramento}
Orcamento Monitoramento: {op=Orcamento Monitoramento}
Negociacao Monitoramento: {op=Negociacao Monitoramento}
Follow Up Monitoramento: {op=Follow Up Monitoramento}
Cadastro Monitoramento: {op=Cadastro Monitoramento}
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
  "gain_date": "{op=gainDate}",
  "etapa": "{op=etapa}",
  "crm_column": "{op=crm_column}",
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

**Quando disparar:** Quando `cadastro_monitoramento` for preenchido OU `status='gain'`

---

## 📤 5. CADASTRO REATIVAÇÃO (Funil 38)

**Etapa:** CADASTRO (339) OU status='gain'

### Campos no SprintHub:
```
Entrada Reativacao: {op=Entrada Reativacao}
Acolhimento Reativacao: {op=Acolhimento Reativacao}
Qualificado Reativacao: {op=Qualificado Reativacao}
Orcamento Reativacao: {op=Orcamento Reativacao}
Negociacao Reativacao: {op=Negociacao Reativacao}
Follow Up Reativacao: {op=Follow Up Reativacao}
Cadastro Reativacao: {op=Cadastro Reativacao}
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
  "gain_date": "{op=gainDate}",
  "etapa": "{op=etapa}",
  "crm_column": "{op=crm_column}",
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

**Quando disparar:** Quando `cadastro_reativacao` for preenchido OU `status='gain'`

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

## 📊 MAPEAMENTO DE ETAPAS CADASTRO

| Funil | Funil ID | Etapa CADASTRO | ID CADASTRO |
|-------|----------|----------------|-------------|
| Compra | 6 | CADASTRO | 232 |
| Recompra | 14 | CADASTRO | 230 |
| Ativacao | 33 | CADASTRO | 320 |
| Monitoramento | 41 | CADASTRO | 359 |
| Reativacao | 38 | CADASTRO | 339 |

---

## 🎯 IMPORTANTE

- **Mesmo webhook URL:** Todos os 5 funis usam a **mesma URL do n8n** - ele identifica automaticamente qual funil é
- **Status 'gain' ou 'won':** Se o `status` for 'gain' ou 'won', o n8n irá identificar automaticamente como CADASTRO
- **Campo cadastro_*:** Se o campo `cadastro_*` estiver preenchido, conta como venda
- **Crm_column:** O n8n irá definir automaticamente o `crm_column` correto baseado no funil identificado
- **Todos os campos:** Sempre envie TODOS os campos da jornada completa para garantir que o histórico fique completo no banco

