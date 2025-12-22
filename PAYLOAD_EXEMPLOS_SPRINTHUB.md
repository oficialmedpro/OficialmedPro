# 📋 Exemplos de Payloads Otimizados para SprintHub

## 🎯 Como Configurar no SprintHub

Configure webhooks diferentes para cada etapa, cada um com seu payload mínimo.

---

## 1️⃣ WEBHOOK: ENTRADA (Payload Mínimo)

### Configuração no SprintHub:
**Trigger:** Quando campo "Entrada Compra" (ou outros `entrada_*`) for preenchido

### Payload JSON para cada Funil:

#### Funil 1: COMPRA
```json
{
  "id": "{op=id}",
  "user_id": "{op=user}",
  "funil_id": "6",
  "entrada_compra": "{op=Entrada Compra}",
  "create_date": "{op=createDate}",
  "update_date": "{op=updateDate}",
  "title": "{op=title}",
  "status": "{op=status}",
  "crm_column": "130"
}
```

#### Funil 2: RECOMPRA
```json
{
  "id": "{op=id}",
  "user_id": "{op=user}",
  "funil_id": "14",
  "entrada_recompra": "{op=Entrada Recompra}",
  "create_date": "{op=createDate}",
  "update_date": "{op=updateDate}",
  "title": "{op=title}",
  "status": "{op=status}",
  "crm_column": "202"
}
```

#### Funil 3: ATIVAÇÃO
```json
{
  "id": "{op=id}",
  "user_id": "{op=user}",
  "funil_id": "33",
  "entrada_ativacao": "{op=Entrada Ativacao}",
  "create_date": "{op=createDate}",
  "update_date": "{op=updateDate}",
  "title": "{op=title}",
  "status": "{op=status}",
  "crm_column": "314"
}
```

#### Funil 4: MONITORAMENTO
```json
{
  "id": "{op=id}",
  "user_id": "{op=user}",
  "funil_id": "41",
  "entrada_monitoramento": "{op=Entrada Monitoramento}",
  "create_date": "{op=createDate}",
  "update_date": "{op=updateDate}",
  "title": "{op=title}",
  "status": "{op=status}",
  "crm_column": "353"
}
```

#### Funil 5: REATIVAÇÃO
```json
{
  "id": "{op=id}",
  "user_id": "{op=user}",
  "funil_id": "38",
  "entrada_reativacao": "{op=Entrada Reativacao}",
  "create_date": "{op=createDate}",
  "update_date": "{op=updateDate}",
  "title": "{op=title}",
  "status": "{op=status}",
  "crm_column": "333"
}
```

---

## 2️⃣ WEBHOOK: ORÇAMENTO/NEGOCIAÇÃO (Payload Mínimo)

### Configuração no SprintHub:
**Trigger:** Quando campo "Orçamento Compra" ou "Negociação Compra" (ou outros) for preenchido

### Payload JSON para cada Funil:

#### Funil 1: COMPRA
```json
{
  "id": "{op=id}",
  "user_id": "{op=user}",
  "funil_id": "6",
  "orcamento_compra": "{op=Orcamento Compra}",
  "negociacao_compra": "{op=Negociacao Compra}",
  "value": "{op=value}",
  "create_date": "{op=createDate}",
  "update_date": "{op=updateDate}",
  "title": "{op=title}",
  "status": "{op=status}",
  "crm_column": "{op=crm_column}"
}
```

#### Funil 2: RECOMPRA
```json
{
  "id": "{op=id}",
  "user_id": "{op=user}",
  "funil_id": "14",
  "orcamento_recompra": "{op=Orcamento Recompra}",
  "negociacao_recompra": "{op=Negociacao Recompra}",
  "value": "{op=value}",
  "create_date": "{op=createDate}",
  "update_date": "{op=updateDate}",
  "title": "{op=title}",
  "status": "{op=status}",
  "crm_column": "{op=crm_column}"
}
```

#### Funil 3: ATIVAÇÃO
```json
{
  "id": "{op=id}",
  "user_id": "{op=user}",
  "funil_id": "33",
  "orcamento_ativacao": "{op=Orcamento Ativacao}",
  "negociacao_ativacao": "{op=Negociacao Ativacao}",
  "value": "{op=value}",
  "create_date": "{op=createDate}",
  "update_date": "{op=updateDate}",
  "title": "{op=title}",
  "status": "{op=status}",
  "crm_column": "{op=crm_column}"
}
```

#### Funil 4: MONITORAMENTO
```json
{
  "id": "{op=id}",
  "user_id": "{op=user}",
  "funil_id": "41",
  "orcamento_monitoramento": "{op=Orcamento Monitoramento}",
  "negociacao_monitoramento": "{op=Negociacao Monitoramento}",
  "value": "{op=value}",
  "create_date": "{op=createDate}",
  "update_date": "{op=updateDate}",
  "title": "{op=title}",
  "status": "{op=status}",
  "crm_column": "{op=crm_column}"
}
```

#### Funil 5: REATIVAÇÃO
```json
{
  "id": "{op=id}",
  "user_id": "{op=user}",
  "funil_id": "38",
  "orcamento_reativacao": "{op=Orcamento Reativacao}",
  "negociacao_reativacao": "{op=Negociacao Reativacao}",
  "value": "{op=value}",
  "create_date": "{op=createDate}",
  "update_date": "{op=updateDate}",
  "title": "{op=title}",
  "status": "{op=status}",
  "crm_column": "{op=crm_column}"
}
```

---

## 3️⃣ WEBHOOK: VENDA/CADASTRO (Payload COMPLETO)

### Configuração no SprintHub:
**Trigger:** Quando campo "Cadastro Compra" for preenchido OU `status='gain'/'won'`

### Payload JSON para cada Funil (usar o payload completo do arquivo `PAYLOAD_SPRINTHUB_CADASTRO.md`):

#### Funil 1: COMPRA - Exemplo completo:
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

*(Repetir para os outros funis conforme `PAYLOAD_SPRINTHUB_CADASTRO.md`)*

---

## 📝 Observações Importantes

### 1. Múltiplos Webhooks por Funil
Você precisará configurar **3 webhooks por funil**:
- Webhook de ENTRADA (payload mínimo)
- Webhook de ORÇAMENTO/NEGOCIAÇÃO (payload mínimo)
- Webhook de CADASTRO/VENDA (payload completo)

**Total: 5 funis × 3 webhooks = 15 webhooks**

### 2. O n8n Já Está Preparado
- O código do n8n usa **UPSERT** (`on_conflict=id`)
- Funciona com payload parcial (atualiza apenas os campos enviados)
- Quando enviar payload completo (venda), atualiza todos os campos

### 3. Ordem de Processamento
- Se um lead passar por todas as etapas, serão 3 webhooks:
  1. ENTRADA (dados mínimos)
  2. ORÇAMENTO (dados mínimos, atualiza registro existente)
  3. VENDA (dados completos, atualiza registro existente com tudo)

### 4. Redução de Payload
- **ENTRADA:** ~85-90% menor
- **ORÇAMENTO:** ~75-85% menor
- **VENDA:** Mantém completo (necessário)

### 5. Benefícios
- ✅ Menos tráfego de rede
- ✅ Processamento mais rápido no n8n
- ✅ Menos armazenamento no Supabase
- ✅ Dados completos quando necessário (venda)

