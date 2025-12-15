# 🔄 Webhook Direto via PostgREST (SEM Edge Function)

## ⚠️ LIMITAÇÃO ATUAL

O PostgREST **não aceita UPSERT nativo** sem wrapper de parâmetro. Então temos 2 opções:

1. **INSERT direto** - Funciona, mas não atualiza oportunidades existentes (só cria novas)
2. **API intermediária** - EasyPanel ou n8n que adiciona o wrapper e chama a função RPC

---

## 📋 Resumo

Agora você pode configurar o webhook do SprintHub para chamar **diretamente** a função PostgreSQL via PostgREST, **sem usar Edge Functions**. Isso economiza muito nas invocações e é mais rápido!

---

## ⚙️ Configuração no SprintHub

### URL do Webhook

```
https://agdffspstbxeqhqtltvb.supabase.co/rest/v1/oportunidade_sprint?id=eq.{op=id}
```

### Método HTTP

```
PATCH
```

**OU se preferir UPSERT automático:**

```
https://agdffspstbxeqhqtltvb.supabase.co/rest/v1/oportunidade_sprint
```

### Método HTTP

```
POST
```

### Headers

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFnZGZmc3BzdGJ4ZXFocXRsdHZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA0NTM2NjYsImV4cCI6MjA2NjAyOTY2Nn0.2fIu5l80OQ5HRsYk7xgjLgct51bV7eYCFWzYdhI4wxs
apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFnZGZmc3BzdGJ4ZXFocXRsdHZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA0NTM2NjYsImV4cCI6MjA2NjAyOTY2Nn0.2fIu5l80OQ5HRsYk7xgjLgct51bV7eYCFWzYdhI4wxs
Content-Type: application/json
Accept-Profile: api
Content-Profile: api
Prefer: resolution=merge-duplicates
```

### Body (JSON) - SEM wrapper, direto:

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

## 🔄 Como funciona

1. **SprintHub envia POST** direto para a tabela
2. **PostgREST recebe** e tenta INSERT
3. **Se ID já existe**, usa `Prefer: resolution=merge-duplicates` para fazer UPDATE
4. **Trigger sanitiza automaticamente** (converte datas, campos vazios para NULL)
5. **Dados inseridos/atualizados** na tabela

## ⚠️ Importante sobre UPSERT

O `Prefer: resolution=merge-duplicates` funciona quando há uma **constraint UNIQUE** na coluna `id`. Como `id` é PRIMARY KEY, o PostgREST vai:
- Tentar INSERT primeiro
- Se der erro de duplicata, fazer UPDATE automaticamente
- Mas **precisa configurar o header correto**

### Alternativa: Usar PATCH para UPDATE explícito

Se preferir controle total:

**URL:**
```
https://agdffspstbxeqhqtltvb.supabase.co/rest/v1/oportunidade_sprint?id=eq.{op=id}
```

**Método:** `PATCH`

**Headers:** (mesmos de cima, mas SEM `Prefer: resolution=merge-duplicates`)

**Body:** (mesmo JSON direto)

---

## ✨ O que a função faz automaticamente

1. ✅ **Sanitiza dados**: Converte campos vazios (`""`) para `NULL`
2. ✅ **Converte tipos**: INTEGER, BIGINT, DECIMAL/NUMERIC automaticamente
3. ✅ **Converte datas**: Formato brasileiro (`DD/MM/YYYY HH:MM`) → ISO (`YYYY-MM-DDTHH:MM:SS`)
4. ✅ **Faz UPSERT**: Se existe, atualiza; se não existe, insere
5. ✅ **Retorna resposta**: Informa se foi INSERT ou UPDATE

---

## 📊 Resposta da Função

### Sucesso (INSERT)
```json
{
  "success": true,
  "message": "Oportunidade inserida com sucesso",
  "operation": "insert",
  "id": 181545
}
```

### Sucesso (UPDATE)
```json
{
  "success": true,
  "message": "Oportunidade atualizada com sucesso",
  "operation": "update",
  "id": 181545
}
```

### Erro
```json
{
  "success": false,
  "error": "Campo \"id\" é obrigatório",
  "sqlstate": null,
  "id": null
}
```

---

## 🆚 Comparação: Edge Function vs PostgREST Direto

| Aspecto | Edge Function | PostgREST Direto ✅ |
|---------|---------------|---------------------|
| **Invocações** | Conta no plano | ❌ Não conta! |
| **Velocidade** | ~200-500ms | ~50-100ms |
| **Custo** | Limite de 2M/mês | ✅ Gratuito |
| **Complexidade** | Mais camadas | ✅ Direto no banco |

---

## ⚠️ Importante

### Nome do Parâmetro

A função PostgreSQL espera um parâmetro chamado `p_payload`, então o JSON deve ter essa estrutura:

```json
{
  "p_payload": {
    // ... seus dados aqui ...
  }
}
```

### Campos de Data

A função aceita datas em vários formatos:
- ✅ `DD/MM/YYYY HH:MM` (formato brasileiro)
- ✅ `DD/MM/YYYY` (apenas data)
- ✅ `YYYY-MM-DDTHH:MM:SS` (ISO)
- ✅ `YYYY-MM-DDTHH:MM:SS-03:00` (ISO com timezone)

---

## 🔧 Troubleshooting

### Erro: "Campo \"id\" é obrigatório"
- ✅ Certifique-se que `id` está no payload
- ✅ Use `{op=id}` no SprintHub

### Erro: "permission denied"
- ✅ Verifique o token `Authorization` no header
- ✅ Certifique-se que o token está completo (não truncado)

### Datas não estão sendo convertidas
- ✅ A função tenta vários formatos automaticamente
- ✅ Se ainda falhar, a data será definida como `NULL` (não vai quebrar)

---

## 📝 Exemplo Completo de Payload

```json
{
  "p_payload": {
    "id": "181545",
    "title": "Cliente Teste",
    "value": "3489.00",
    "crm_column": "0",
    "user_id": "219",
    "status": "open",
    "create_date": "09/12/2025 20:25:31",
    "update_date": "09/12/2025 20:25:32",
    "entrada_compra": "09/12/2025 20:25:00",
    "lead_id": "2063",
    "lead_firstname": "Ingrid",
    "lead_lastname": "Del Angelo",
    "lead_whatsapp": "556799892959",
    "etapa": "[0] ENTRADA",
    "origem_oportunidade": "Google Ads",
    "tipo_de_compra": "compra"
  }
}
```

---

## ✅ Próximos Passos

1. ✅ Atualizar a URL do webhook no SprintHub
2. ✅ Manter os mesmos headers e payload
3. ✅ Testar com uma oportunidade
4. ✅ Monitorar os logs (se necessário)

**A Edge Function ainda existe, mas você pode parar de usá-la!** 🎉

