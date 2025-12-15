# 📦 PAYLOAD COMPLETO - Webhook SprintHub → Supabase

## 🎯 Configuração no SprintHub

### **URL do Webhook**
```
https://agdffspstbxeqhqtltvb.supabase.co/functions/v1/webhook-oportunidade-sprint?id={op=id}
```

> ✅ **IMPORTANTE:** Esta URL usa uma Edge Function que sanitiza os dados automaticamente, convertendo strings vazias (`""`) para `null` em campos INTEGER/BIGINT, evitando o erro `invalid input syntax for type integer`.

### **Método HTTP**
```
PATCH
```
(ou `POST` - a função detecta automaticamente se é inserção ou atualização)

### **Headers**
| Nome | Valor |
|------|-------|
| `Authorization` | `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFnZGZmc3BzdGJ4ZXFocXRsdHZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA0NTM2NjYsImV4cCI6MjA2NjAyOTY2Nn0.2fIu5l80OQ5HRsYk7xgjLgct51bV7eYCFWzYdhI4wxs` |
| `Content-Type` | `application/json` |

> ⚠️ **NOTA:** Para Edge Functions, não é necessário `apikey`, `Accept-Profile` nem `Content-Profile`. A Edge Function usa a Service Role Key internamente.

---

## 🎯 **PAYLOAD COMPLETO - COPIE E COLE NO SPRINTHUB**

Use este payload completo com TODOS os tokens disponíveis:

```json
{
  "id": "{op=id}",
  "title": "{op=title}",
  "value": "{op=value}",
  "crm_column": "{op=crm_column}",
  "user_id": "{op=user_id}",
  "status": "{op=status}",
  "create_date": "{op=createDate}",
  "etapa": "{op=etapa}",
  "origem_oportunidade": "{op=ORIGEM OPORTUNIDADE}",
  "tipo_de_compra": "{op=Tipo de Compra}",
  "entrada_compra": "{op=Entrada Compra}",
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
  "lead_rg": "{contactfield=rg}"
}
```

**📋 Este é o payload completo com todos os tokens que você forneceu, pronto para usar no SprintHub!**

> ⚠️ **Tokens adicionais:**
> - `{op=columnName}` - Nome da coluna/etapa (já coberto por `etapa`)
> - `{op=userFirstName}` - Nome do usuário (tabela só tem `user_id`, não armazena nome completo)

---

## 📋 Estrutura Completa do Payload

### **Campos Básicos da Oportunidade**

```json
{
  "id": 123456,
  "title": "Título da Oportunidade",
  "value": 1500.00,
  "crm_column": 130,
  "lead_id": 789012,
  "sequence": 1,
  "status": "open",
  "loss_reason": null,
  "gain_reason": null,
  "user_id": 5,
  "archived": 0
}
```

### **Campos de Data/Hora**

```json
{
  "create_date": "2025-01-15T10:30:00-03:00",
  "update_date": "2025-01-15T14:20:00-03:00",
  "lost_date": null,
  "gain_date": null,
  "last_column_change": "2025-01-15T12:00:00-03:00",
  "last_status_change": null,
  "reopen_date": null,
  "expected_close_date": "2025-01-20T00:00:00-03:00"
}
```

### **Campos Customizados (fields)**

```json
{
  "origem_oportunidade": "Facebook Ads",
  "tipo_de_compra": "Primeira Compra",
  "qualificacao": "Qualificado",
  "primecadastro": 1,
  "data_recompra": null,
  "codigo_prime_receita": "PR123456",
  "descricao_da_formula": "Descrição da fórmula",
  "descricao_formula": "Descrição da fórmula",
  "id_api_max": "API123",
  "id_transacao": "TXN456",
  "link_pgto": "https://pagamento.com/123",
  "numero_do_pedido": "PED789",
  "requisicao1": "REQ001",
  "requisicao_2": "REQ002",
  "requisicao_3": "REQ003",
  "status_getnet": "aprovado",
  "status_orcamento": "aprovado",
  "status_log": "enviado",
  "status_melhor_envio": "em_transito",
  "valorconfere": "sim",
  "pagamento": "aprovado",
  "forma_pagamento": "Cartão de Crédito",
  "frete": "SEDEX",
  "frete_cobrado": "sim",
  "frete_pago": "sim",
  "frete_height": 10.5,
  "frete_length": 20.0,
  "frete_weight": 1.2,
  "frete_width": 15.0,
  "frete_origem": "São Paulo",
  "frete_produto": "Produto X",
  "local_da_compra": "Loja Online",
  "valorfrete": "25.90",
  "codigo_id_lead": "LEAD123",
  "codigo_id_oportunidade": "OPP456",
  "id_oportunidade": "OP789",
  "req": "REQ001",
  "cidade_entrega": "São Paulo",
  "codigo_de_rastreio": "BR123456789BR",
  "codigo_delivery": "DLV789",
  "corrida": "CR456",
  "coleta": "COL123",
  "data_de_entrega": "2025-01-20T00:00:00-03:00",
  "data_de_saida": "2025-01-18T00:00:00-03:00",
  "data_ganho_correto": "2025-01-15",
  "delivery": "Entregue",
  "entregue_para": "João Silva",
  "filial": "São Paulo",
  "id_correio": "COR123",
  "informacoes_preenchidas": "Sim",
  "ord_melhor_envio": "ORD456",
  "observacao_logistica": "Entregar na portaria",
  "rota": "Rota A",
  "tentativa_de_entrega": "1",
  "tipo": "Primeira Compra",
  "tipo_de_frete": "PAC",
  "url_etiqueta": "https://etiqueta.com/123",
  "valor_a_receber_moto": "1500.00",
  "etapa": "Negociação",
  "vendedor": "João"
}
```

### **Campos UTM**

```json
{
  "utm_campaign": "campanha_verao",
  "utm_content": "banner_principal",
  "utm_medium": "cpc",
  "utm_source": "google",
  "utm_term": "produto",
  "utm_origin": "google_ads",
  "utm_referer": "https://google.com",
  "utm_date_added": "2025-01-15T10:00:00-03:00"
}
```

### **Campos do Lead**

```json
{
  "lead_firstname": "João",
  "lead_lastname": "Silva",
  "lead_cpf": "123.456.789-00",
  "lead_city": "São Paulo",
  "lead_bairro": "Centro",
  "lead_rua": "Rua das Flores",
  "lead_numero": "123",
  "lead_pais": "Brasil",
  "lead_zipcode": "01234-567",
  "lead_data_nascimento": "1990-05-15T00:00:00-03:00",
  "lead_email": "joao@email.com",
  "lead_recebedor": "João Silva",
  "lead_whatsapp": "11999999999",
  "lead_rg": "12.345.678-9",
  "lead_linkpagamento": "https://pagamento.com/123"
}
```

### **Campos de Data/Hora das Etapas (IMPORTANTE)**

Estes campos são mapeados a partir dos campos customizados do SprintHub:

```json
{
  "entrada_compra": "2025-01-15T10:00:00-03:00",
  "acolhimento_compra": "2025-01-15T10:05:00-03:00",
  "qualificado_compra": "2025-01-15T10:10:00-03:00",
  "orcamento_compra": "2025-01-15T10:15:00-03:00",
  "negociacao_compra": "2025-01-15T10:20:00-03:00",
  "follow_up_compra": "2025-01-15T10:25:00-03:00",
  "cadastro_compra": "2025-01-15T10:30:00-03:00",
  
  "entrada_recompra": null,
  "acolhimento_recompra": null,
  "qualificado_recompra": null,
  "orcamento_recompra": null,
  "negociacao_recompra": null,
  "follow_up_recompra": null,
  "cadastro_recompra": null,
  
  "entrada_monitoramento": null,
  "acolhimento_monitoramento": null,
  "qualificado_monitoramento": null,
  "orcamento_monitoramento": null,
  "negociacao_monitoramento": null,
  "follow_up_monitoramento": null,
  "cadastro_monitoramento": null,
  
  "entrada_ativacao": null,
  "acolhimento_ativacao": null,
  "qualificado_ativacao": null,
  "orcamento_ativacao": null,
  "negociacao_ativacao": null,
  "follow_up_ativacao": null,
  "cadastro_ativacao": null,
  
  "entrada_reativacao": null,
  "acolhimento_reativacao": null,
  "qualificado_reativacao": null,
  "orcamento_reativacao": null,
  "negociacao_reativacao": null,
  "follow_up_reativacao": null,
  "cadastro_reativacao": null
}
```

### **Campos de Controle e Funil**

```json
{
  "funil_id": 6,
  "funil_nome": "COMPRA",
  "unidade_id": "[1]",
  "synced_at": "2025-01-15T14:30:00-03:00",
  "await_column_approved": false,
  "await_column_approved_user": null,
  "reject_appro": false,
  "reject_appro_desc": null,
  "conf_installment": null
}
```

---

## 🎯 **Mapeamento Campo SprintHub → Campo Supabase**

### **Campos Customizados (fields) → Supabase**

| Campo SprintHub | Campo Supabase | Tipo | Observação |
|-----------------|----------------|------|------------|
| `"Entrada Compra"` | `entrada_compra` | TIMESTAMPTZ | Formato: ISO 8601 |
| `"Acolhimento Compra"` | `acolhimento_compra` | TIMESTAMPTZ | Formato: ISO 8601 |
| `"Qualificado Compra"` | `qualificado_compra` | TIMESTAMPTZ | Formato: ISO 8601 |
| `"Orcamento Compra"` | `orcamento_compra` | TIMESTAMPTZ | Formato: ISO 8601 |
| `"Negociacao Compra"` | `negociacao_compra` | TIMESTAMPTZ | Formato: ISO 8601 |
| `"Follow Up Compra"` | `follow_up_compra` | TIMESTAMPTZ | Formato: ISO 8601 |
| `"Cadastro Compra"` | `cadastro_compra` | TIMESTAMPTZ | Formato: ISO 8601 |
| `"ORIGEM OPORTUNIDADE"` | `origem_oportunidade` | TEXT | - |
| `"Tipo de Compra"` | `tipo_de_compra` | TEXT | - |
| `"QUALIFICACAO"` | `qualificacao` | TEXT | - |
| `"Status Orcamento"` | `status_orcamento` | TEXT | - |
| `"VENDEDOR"` | `vendedor` | TEXT | - |

**E assim por diante para todos os campos customizados...**

---

## 📝 **Exemplos de Payload com Tokens do SprintHub**

### **1. Payload Mínimo (Apenas entrada_compra)**

```json
{
  "entrada_compra": "{op=Entrada Compra}"
}
```

### **1.1. Payload Simples - Entrada Compra + Nome do Lead (Exemplo do Usuário)**

```json
{
  "entrada_compra": "{op=Entrada Compra}",
  "lead_firstname": "{contactfield=firstname}"
}
```

> **Nota:** O campo no Supabase é `lead_firstname`, não `nome`.

### **2. Payload Básico com Campos Principais**

```json
{
  "id": "{op=id}",
  "title": "{op=title}",
  "value": "{op=value}",
  "crm_column": "{op=crm_column}",
  "status": "{op=status}",
  "create_date": "{op=createDate}",
  "entrada_compra": "{op=Entrada Compra}"
}
```

### **3. Payload Completo com Oportunidade e Lead**

```json
{
  "id": "{op=id}",
  "title": "{op=title}",
  "value": "{op=value}",
  "crm_column": "{op=crm_column}",
  "status": "{op=status}",
  "create_date": "{op=createDate}",
  "origem_oportunidade": "{op=ORIGEM OPORTUNIDADE}",
  "tipo_de_compra": "{op=Tipo de Compra}",
  "etapa": "{op=etapa}",
  "entrada_compra": "{op=Entrada Compra}",
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
  "lead_rg": "{contactfield=rg}"
}
```

### **4. Payload Focado em Entrada Compra + Dados do Lead**

```json
{
  "entrada_compra": "{op=Entrada Compra}",
  "lead_firstname": "{contactfield=firstname}",
  "lead_lastname": "{contactfield=lastname}",
  "lead_email": "{contactfield=email}",
  "lead_whatsapp": "{contactfield=whatsapp}",
  "lead_cpf": "{contactfield=cpf}",
  "lead_city": "{contactfield=city}"
}
```

### **5. Payload Completo com TODOS os Tokens Disponíveis**

Use este payload se quiser sincronizar todos os campos disponíveis:

```json
{
  "id": "{op=id}",
  "title": "{op=title}",
  "value": "{op=value}",
  "crm_column": "{op=crm_column}",
  "user_id": "{op=user_id}",
  "status": "{op=status}",
  "create_date": "{op=createDate}",
  "etapa": "{op=etapa}",
  "origem_oportunidade": "{op=ORIGEM OPORTUNIDADE}",
  "tipo_de_compra": "{op=Tipo de Compra}",
  "entrada_compra": "{op=Entrada Compra}",
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
  "lead_rg": "{contactfield=rg}"
}
```

---

## 🔑 **Mapeamento de Tokens SprintHub → Campos Supabase**

| Token SprintHub | Campo Supabase | Tipo | Observação |
|----------------|----------------|------|------------|
| `{op=id}` | `id` | BIGINT | ID da oportunidade (obrigatório na URL ou body) |
| `{op=title}` | `title` | TEXT | Título da oportunidade |
| `{op=value}` | `value` | DECIMAL | Valor da oportunidade |
| `{op=crm_column}` | `crm_column` | INTEGER | ID da coluna/etapa do funil |
| `{op=status}` | `status` | TEXT | Status: open/won/lost |
| `{op=createDate}` | `create_date` | TIMESTAMPTZ | Data de criação (ISO 8601) |
| `{op=etapa}` | `etapa` | TEXT | Nome da etapa |
| `{op=columnName}` | `etapa` | TEXT | Nome da coluna (já mapeado em `etapa`) |
| `{op=ORIGEM OPORTUNIDADE}` | `origem_oportunidade` | TEXT | Origem da oportunidade |
| `{op=Tipo de Compra}` | `tipo_de_compra` | TEXT | Tipo de compra |
| `{op=Entrada Compra}` | `entrada_compra` | TIMESTAMPTZ | Data/hora entrada compra (ISO 8601) |
| `{op=userFirstName}` | ❌ | TEXT | **NÃO MAPEADO** - Tabela só armazena `user_id` (número), não nome do usuário |
| `{op=user_id}` | `user_id` | INTEGER | ID do usuário responsável |
| `{contactfield=firstname}` | `lead_firstname` | TEXT | Nome do lead |
| `{contactfield=lastname}` | `lead_lastname` | TEXT | Sobrenome do lead |
| `{contactfield=email}` | `lead_email` | TEXT | Email do lead |
| `{contactfield=whatsapp}` | `lead_whatsapp` | TEXT | WhatsApp do lead |
| `{contactfield=cpf}` | `lead_cpf` | TEXT | CPF do lead |
| `{contactfield=zipcode}` | `lead_zipcode` | TEXT | CEP do lead |
| `{contactfield=address}` | `lead_rua` | TEXT | Endereço/rua do lead |
| `{contactfield=city}` | `lead_city` | TEXT | Cidade do lead |
| `{contactfield=state}` | `lead_estado` | TEXT | Estado do lead (UF) |
| `{contactfield=country}` | `lead_pais` | TEXT | País do lead |
| `{contactfield=data_de_nascimento}` | `lead_data_nascimento` | TIMESTAMPTZ | Data de nascimento (ISO 8601) |
| `{contactfield=rg}` | `lead_rg` | TEXT | RG do lead |

---

## 📝 **Exemplo Completo de Payload Mínimo (Apenas entrada_compra)**

Se você só quer atualizar o campo `entrada_compra`:

```json
{
  "entrada_compra": "{op=Entrada Compra}"
}
```

### **Formato da Data/Hora**

**✅ Formato Correto (ISO 8601):**
```json
"2025-01-15T10:00:00-03:00"
```
ou
```json
"2025-01-15T10:00:00Z"
```

**❌ Formato Incorreto:**
```json
"15/01/2025 10:00:00"
"2025-01-15 10:00:00"
```

---

## 🔧 **Configuração no SprintHub - Passo a Passo**

### **1. Criar Webhook**
- Acesse: Configurações → Webhooks → Novo Webhook

### **2. Configurar Trigger**
- **Evento:** Quando campo "Entrada Compra" for atualizado
- **Condição:** Campo não vazio

### **3. Configurar URL**
```
https://agdffspstbxeqhqtltvb.supabase.co/functions/v1/webhook-oportunidade-sprint?id={op=id}
```

> ⚠️ **NOTA:** Use a Edge Function ao invés da API REST direta. Ela sanitiza automaticamente strings vazias (`""`) convertendo para `null` em campos INTEGER, evitando erros como `invalid input syntax for type integer`.

### **4. Configurar Headers**
Adicione cada header clicando em **"+ Add Header"**:

1. `Authorization`: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFnZGZmc3BzdGJ4ZXFocXRsdHZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA0NTM2NjYsImV4cCI6MjA2NjAyOTY2Nn0.2fIu5l80OQ5HRsYk7xgjLgct51bV7eYCFWzYdhI4wxs`
2. `Content-Type`: `application/json`

> ⚠️ **IMPORTANTE:** Para Edge Functions, não é necessário `apikey`, `Accept-Profile` nem `Content-Profile`.

### **5. Configurar Body (JSON)**

#### **⭐ OPÇÃO RECOMENDADA: Payload Completo (Todos os Tokens)**

```json
{
  "id": "{op=id}",
  "title": "{op=title}",
  "value": "{op=value}",
  "crm_column": "{op=crm_column}",
  "status": "{op=status}",
  "create_date": "{op=createDate}",
  "etapa": "{op=etapa}",
  "origem_oportunidade": "{op=ORIGEM OPORTUNIDADE}",
  "tipo_de_compra": "{op=Tipo de Compra}",
  "entrada_compra": "{op=Entrada Compra}",
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
  "lead_rg": "{contactfield=rg}"
}
```

#### **Opção A: Apenas Entrada Compra (Mínimo)**
```json
{
  "entrada_compra": "{op=Entrada Compra}"
}
```

#### **Opção B: Entrada Compra + Dados Básicos**
```json
{
  "entrada_compra": "{op=Entrada Compra}",
  "title": "{op=title}",
  "value": "{op=value}",
  "status": "{op=status}"
}
```

#### **Opção C: Entrada Compra + Dados do Lead**
```json
{
  "entrada_compra": "{op=Entrada Compra}",
  "lead_firstname": "{contactfield=firstname}",
  "lead_lastname": "{contactfield=lastname}",
  "lead_email": "{contactfield=email}",
  "lead_whatsapp": "{contactfield=whatsapp}"
}
```

**Onde `{op=...}` e `{contactfield=...}` são variáveis dinâmicas do SprintHub que pegam os valores automaticamente.**

---

## ⚠️ **IMPORTANTE**

1. **ID da Oportunidade**: Deve estar na URL (`?id=eq.{op=id}`) ou no body
2. **Formato de Data**: Sempre ISO 8601 com timezone
3. **Campos Opcionais**: Pode enviar apenas os campos que mudaram
4. **Campos Nulos**: Use `null` (não `""` ou `undefined`)

---

## 🧪 **Teste do Webhook**

### **Teste Manual via cURL:**

```bash
curl -X PATCH \
  "https://agdffspstbxeqhqtltvb.supabase.co/rest/v1/oportunidade_sprint?id=eq.123456" \
  -H "Authorization: Bearer [CHAVE_ANON]" \
  -H "apikey: [CHAVE_ANON]" \
  -H "Content-Type: application/json" \
  -H "Accept-Profile: api" \
  -H "Content-Profile: api" \
  -d '{
    "entrada_compra": "2025-01-15T10:00:00-03:00"
  }'
```

---

---

## ✅ **CHECKLIST DE TOKENS - CONFERÊNCIA COMPLETA**

### **Tokens Fornecidos vs. Payload:**

| Token | Status | Campo no Payload | Observação |
|-------|--------|------------------|------------|
| `{contactfield=lastname}` | ✅ | `lead_lastname` | Mapeado |
| `{op=title}` | ✅ | `title` | Mapeado |
| `{op=value}` | ✅ | `value` | Mapeado |
| `{op=crm_column}` | ✅ | `crm_column` | Mapeado |
| `{op=etapa}` | ✅ | `etapa` | Mapeado |
| `{op=id}` | ✅ | `id` | Mapeado |
| `{op=status}` | ✅ | `status` | Mapeado |
| `{op=columnName}` | ⚠️ | `etapa` | Coberto por `etapa` |
| `{op=createDate}` | ✅ | `create_date` | Mapeado |
| `{op=ORIGEM OPORTUNIDADE}` | ✅ | `origem_oportunidade` | Mapeado |
| `{op=Tipo de Compra}` | ✅ | `tipo_de_compra` | Mapeado |
| `{op=userFirstName}` | ❌ | - | **NÃO MAPEADO** - Tabela não tem campo para nome do usuário |
| `{op=Entrada Compra}` | ✅ | `entrada_compra` | Mapeado |
| `{contactfield=firstname}` | ✅ | `lead_firstname` | Mapeado |
| `{contactfield=email}` | ✅ | `lead_email` | Mapeado |
| `{contactfield=whatsapp}` | ✅ | `lead_whatsapp` | Mapeado |
| `{contactfield=cpf}` | ✅ | `lead_cpf` | Mapeado |
| `{contactfield=zipcode}` | ✅ | `lead_zipcode` | Mapeado |
| `{contactfield=address}` | ✅ | `lead_rua` | Mapeado |
| `{contactfield=city}` | ✅ | `lead_city` | Mapeado |
| `{contactfield=state}` | ❌ | - | **NÃO MAPEADO** - Campo não existe na tabela |
| `{contactfield=country}` | ✅ | `lead_pais` | Mapeado |
| `{contactfield=data_de_nascimento}` | ✅ | `lead_data_nascimento` | Mapeado |
| `{contactfield=rg}` | ✅ | `lead_rg` | Mapeado |

### **Resumo:**
- ✅ **21 tokens mapeados** no payload
- ⚠️ **1 token coberto** (columnName = etapa)
- ❌ **2 tokens não mapeados** (userFirstName, state) - Requer criação de campos adicionais na tabela

---

## 📚 **Referências**

- Estrutura completa: `src/components/TopMenuBar.jsx` (linha 1931-1989)
- Mapeamento de campos: `src/components/TopMenuBar.jsx` (linha 1880-1929)
- Documentação de campos: `NEON/DOCUMENTACAO-CAMPOS-OPORTUNIDADE.md`

