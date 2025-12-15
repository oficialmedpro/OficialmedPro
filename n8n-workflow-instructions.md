# 📋 Instruções para Configurar Workflow n8n

## 🚀 Passo a Passo

### 1. Importar o Workflow

1. Abra o n8n
2. Clique em **"Workflows"** → **"Import from File"**
3. Selecione o arquivo `n8n-workflow-webhook-sprinthub.json`
4. O workflow será importado com os nodes configurados

### 2. Verificar Configuração (Opcional)

✅ **Os headers de autenticação já estão configurados no workflow!**

Os tokens do Supabase já estão incluídos no node **"Chamar Supabase"**. Se precisar alterar:
1. Abra o node **"Chamar Supabase"**
2. Vá na aba **"Headers"**
3. Edite os valores de `Authorization` e `apikey` se necessário

### 3. Ativar o Webhook

1. Clique no node **"Webhook"**
2. Clique em **"Listen for Test Event"** (ou ative o workflow)
3. Copie a **URL do Webhook** que aparece
   - Exemplo: `https://seu-n8n.com/webhook/webhook-oportunidade-sprint`
   - Ou: `http://localhost:5678/webhook/webhook-oportunidade-sprint` (se local)

### 4. Configurar no SprintHub

1. Vá para **Automações** → **Webhooks**
2. Crie um novo webhook ou edite o existente
3. Configure:

**URL:** (URL do webhook do n8n que você copiou)
**Método:** `POST`
**Headers:**
```
Content-Type: application/json
```

**Body:**
```json
{
  "id": "{op=id}",
  "title": "{op=title}",
  "value": "{op=value}",
  "crm_column": "{op=crm_column}",
  "user_id": "{op=user}",
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
  "lead_id": "{contactfield=id}",
  "lead_rg": "{contactfield=rg}"
}
```

### 5. Testar

1. Crie uma oportunidade no SprintHub
2. Verifique os logs do n8n
3. Verifique se os dados foram inseridos no Supabase

---

## 🔍 O que o Workflow faz

1. **Recebe webhook** do SprintHub (sem wrapper)
2. **Adiciona wrapper** `{"p_payload": {...}}`
3. **Chama função RPC** do Supabase
4. **Verifica se houve erro**
5. **Retorna resposta** apropriada (200 OK ou 400 Error)

---

## 📝 Estrutura do Workflow

```
[Webhook] → [Adicionar Wrapper] → [Chamar Supabase] → [Verificar Erro] → [Responder]
                                                              ↓
                                                         [Responder Erro]
```

---

## ⚙️ Personalização

Se precisar ajustar:
- **URL do Supabase:** Edite o node "Chamar Supabase"
- **Headers adicionais:** Adicione no node "Chamar Supabase"
- **Lógica de tratamento:** Edite o node "Adicionar Wrapper"

---

## 🐛 Troubleshooting

**Erro 401 (Unauthorized):**
- Verifique se as credenciais do Supabase estão corretas
- Verifique se o token `apikey` está no header

**Erro 400 (Bad Request):**
- Verifique se o payload está sendo recebido corretamente
- Verifique os logs do n8n para ver o payload

**Workflow não executa:**
- Certifique-se que o workflow está ativo
- Verifique se o webhook está configurado para escutar

