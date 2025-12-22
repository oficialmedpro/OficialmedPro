# 📦 Payload Otimizado - Campos Mínimos por Etapa

## 🎯 Estratégia de Otimização

**Reduzir payload nas etapas mais frequentes (ENTRADA e ORÇAMENTO)** e enviar dados completos apenas quando necessário (VENDA/CADASTRO).

---

## 1️⃣ ENTRADA - Payload Mínimo

### Campos Essenciais (Obrigatórios):
```json
{
  "id": "{op=id}",
  "user_id": "{op=user}",
  "funil_id": "{op=funil_id}",  // Se disponível
  "entrada_compra": "{op=Entrada Compra}",  // ou entrada_recompra, entrada_ativacao, etc.
  "create_date": "{op=createDate}",
  "update_date": "{op=updateDate}"
}
```

### Campos Opcionais (Úteis mas não críticos):
```json
{
  "title": "{op=title}",  // Útil para debugging
  "status": "{op=status}",  // Geralmente 'open'
  "crm_column": "{op=crm_column}"  // Se disponível
}
```

### ❌ Campos que NÃO precisa enviar em ENTRADA:
- Todos os campos de lead (`lead_*`)
- Campos de outras etapas (`orcamento_*`, `negociacao_*`, `cadastro_*`, etc.)
- Campos personalizados que não são usados no cálculo de entrada
- `value` (valor só é necessário em orçamento/venda)
- `gain_date`, `lost_date`

---

## 2️⃣ ORÇAMENTO/NEGOCIAÇÃO - Payload Mínimo

### Campos Essenciais (Obrigatórios):
```json
{
  "id": "{op=id}",
  "user_id": "{op=user}",
  "funil_id": "{op=funil_id}",  // Se disponível
  "orcamento_compra": "{op=Orcamento Compra}",  // ou orcamento_recompra, etc.
  "negociacao_compra": "{op=Negociacao Compra}",  // ou negociacao_recompra, etc.
  "value": "{op=value}",  // Valor do orçamento (necessário para métricas)
  "create_date": "{op=createDate}",
  "update_date": "{op=updateDate}"
}
```

### Campos Opcionais (Úteis mas não críticos):
```json
{
  "title": "{op=title}",
  "status": "{op=status}",
  "crm_column": "{op=crm_column}",
  "entrada_compra": "{op=Entrada Compra}"  // Se já tiver (para contexto)
}
```

### ❌ Campos que NÃO precisa enviar em ORÇAMENTO:
- Todos os campos de lead (`lead_*`)
- Campos de cadastro (`cadastro_*`)
- Campos de outras etapas não relacionadas
- `gain_date`, `lost_date`

---

## 3️⃣ VENDA/CADASTRO - Payload COMPLETO

### Enviar TODOS os campos necessários para histórico completo:

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
  
  // TODAS as etapas da jornada (para histórico completo)
  "entrada_compra": "{op=Entrada Compra}",
  "acolhimento_compra": "{op=Acolhimento Compra}",
  "qualificado_compra": "{op=Qualificado Compra}",
  "orcamento_compra": "{op=Orcamento Compra}",
  "negociacao_compra": "{op=Negociacao Compra}",
  "follow_up_compra": "{op=Follow Up Compra}",
  "cadastro_compra": "{op=Cadastro Compra}",
  
  // Campos personalizados da oportunidade
  "origem_oportunidade": "{op=ORIGEM OPORTUNIDADE}",
  "tipo_de_compra": "{op=Tipo de Compra}",
  
  // TODOS os dados do lead (histórico completo)
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

### ✅ Por que completo em VENDA?
- **Histórico completo** da jornada do cliente
- **Dados do lead** para análises futuras
- **Auditoria** de todo o processo de venda
- **Integração** com outros sistemas que podem precisar desses dados

---

## 📊 Comparação de Tamanho

### ENTRADA (Mínimo):
- **Antes:** ~60 campos = ~2-3 KB
- **Depois:** ~5-7 campos = ~200-300 bytes
- **Redução:** ~85-90% menor

### ORÇAMENTO (Mínimo):
- **Antes:** ~60 campos = ~2-3 KB
- **Depois:** ~8-10 campos = ~400-500 bytes
- **Redução:** ~75-85% menor

### VENDA (Completo):
- **Mantém:** ~60 campos = ~2-3 KB (necessário para histórico)

---

## 🎯 Benefícios

1. ✅ **Redução de tráfego de rede** (webhook menor = mais rápido)
2. ✅ **Menos processamento** no n8n (menos campos para processar)
3. ✅ **Menos armazenamento** no Supabase (menos dados redundantes)
4. ✅ **Performance melhor** no banco (menos dados para indexar/atualizar)
5. ✅ **Dados completos** quando realmente necessário (venda)

---

## ⚠️ Importante

### Campos que DEVEM estar em TODOS os payloads:
- `id` (obrigatório - chave primária)
- `user_id` (obrigatório - para agrupar por vendedor)
- `funil_id` (recomendado - para identificar funil correto)
- `create_date` / `update_date` (recomendado - para auditoria)

### Campos que o Supabase vai fazer UPSERT:
- O Supabase usa `on_conflict=id` então mesmo com payload reduzido, os dados anteriores são mantidos
- Quando enviar payload completo (venda), vai atualizar todos os campos

---

## 🔄 Exemplo de Fluxo Otimizado

### 1. Lead entra (ENTRADA):
```
SprintHub → Webhook mínimo (5 campos) → n8n → Supabase
```
- Banco: Registro criado com dados mínimos

### 2. Lead gera orçamento (ORÇAMENTO):
```
SprintHub → Webhook mínimo (8 campos) → n8n → Supabase
```
- Banco: Registro atualizado (UPSERT pelo ID), mantém dados anteriores + adiciona orçamento

### 3. Lead vende (VENDA):
```
SprintHub → Webhook completo (60 campos) → n8n → Supabase
```
- Banco: Registro atualizado com TODOS os dados (histórico completo)

---

## 📝 Próximos Passos

1. ✅ Configurar webhooks no SprintHub com payloads mínimos para ENTRADA
2. ✅ Configurar webhooks no SprintHub com payloads mínimos para ORÇAMENTO
3. ✅ Manter webhook completo para CADASTRO/VENDA
4. ✅ O código do n8n já está preparado (usa UPSERT, então funciona com payload parcial)

