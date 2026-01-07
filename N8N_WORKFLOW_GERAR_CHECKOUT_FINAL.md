# Workflow n8n - Gerar Checkout Final

Este workflow é acionado quando o cliente clica em "Finalizar Compra" na página de pré-checkout.

## Fluxo

1. **Webhook pagina precheckout** - Recebe `linkId` e `formulasSelecionadas` da página
2. **Buscar Pre-Checkout** - Busca os dados completos do pré-checkout no Supabase
3. **Formatar Pedido** - Calcula o total das fórmulas selecionadas e formata para a API do Clubecerto
4. **Criar Checkout** - Chama a API do Clubecerto para gerar o checkout
5. **Montar Pedido** - Formata os dados para atualizar Supabase e Sprinthub
6. **Atualizar Supabase** - Salva `checkout_url` e `checkout_external_id`
7. **Atualizar Sprinthub** - Atualiza `value`, `checkout` e `descricao_formula`
8. **Responder Webhook** - Retorna o link do checkout para redirecionar o cliente

## Configuração

### 1. Importar o workflow

Importe o arquivo `n8n-workflow-gerar-checkout-final.json` no n8n.

### 2. Configurar URL do webhook

Após importar, copie a URL do webhook do nó "Webhook pagina precheckout" e configure no `config.js`:

```javascript
N8N_WEBHOOK_URL: 'https://seu-n8n.com/webhook-pagina-precheckout'
```

Ou configure como variável de ambiente no Easypanel:
```
VITE_N8N_WEBHOOK_URL=https://seu-n8n.com/webhook-pagina-precheckout
```

### 3. Verificar campos do Sprinthub

O workflow atualiza os seguintes campos no Sprinthub:
- `value`: Valor total das fórmulas selecionadas
- `fields.checkout`: Link do checkout gerado
- `fields.descricao_formula`: Descrição formatada das fórmulas selecionadas

**IMPORTANTE**: Confirme se o campo `descricao_formula` está correto. Se for outro nome, ajuste no nó "Atualizar Sprinthub".

## Payload do Webhook

A página envia:
```json
{
  "linkId": "aGSV2MJfkUMjA14jL0N1kFrOfMDcUhm0",
  "formulasSelecionadas": [1, 2, 3]
}
```

## Resposta do Webhook

O workflow retorna:
```json
{
  "success": true,
  "checkout_url": "https://checkout.clubecerto.com.br/...",
  "message": "Checkout gerado com sucesso"
}
```

A página redireciona automaticamente para `checkout_url`.

## Estrutura dos Nós

### Webhook pagina precheckout
- **Método**: POST
- **Path**: `webhook-pagina-precheckout`
- **Recebe**: `{ linkId, formulasSelecionadas }`

### Buscar Pre-Checkout
- **Método**: GET
- **URL**: `https://agdffspstbxeqhqtltvb.supabase.co/rest/v1/pre_checkout?link_pre_checkout=eq.{linkId}`
- **Headers**: Authorization, apikey, Accept-Profile: api

### Formatar Pedido
- Calcula total das fórmulas selecionadas
- Formata payload para API do Clubecerto:
  ```json
  {
    "name": "Nome do Cliente",
    "price": "213.20",
    "composition": "",
    "hasPlan": true,
    "externalId": 190680
  }
  ```

### Criar Checkout
- **Método**: POST
- **URL**: `https://api-control.clubecerto.com.br/planos/customizado-gg/`
- **Headers**: Authorization (Bearer token)
- **Body**: Payload formatado

### Montar Pedido
- Extrai `checkout_url` e `checkout_external_id` da resposta
- Formata `descricao_formula` para Sprinthub
- Prepara dados para atualizações

### Atualizar Supabase
- **Método**: PATCH
- **URL**: `https://agdffspstbxeqhqtltvb.supabase.co/rest/v1/pre_checkout?link_pre_checkout=eq.{linkId}`
- **Body**:
  ```json
  {
    "checkout_url": "...",
    "checkout_external_id": "...",
    "status": "checkout_gerado",
    "updated_at": "..."
  }
  ```

### Atualizar Sprinthub
- **Método**: PUT
- **URL**: `https://sprinthub-api-master.sprinthub.app/crmopportunity/{oportunidade_id}?id={funil_id}&apitoken=...&i=oficialmed`
- **Body**:
  ```json
  {
    "value": "213.20",
    "fields": {
      "checkout": "https://checkout.clubecerto.com.br/...",
      "descricao_formula": "Fórmula nº 1: ...\nValor R$ 75,29\n\n..."
    }
  }
  ```

## Troubleshooting

### Erro: "Pré-checkout não encontrado"
- Verifique se o `linkId` está correto
- Confirme que o registro existe no Supabase

### Erro: "Resposta inválida do servidor"
- Verifique se a API do Clubecerto retornou `checkout_url`
- Ajuste a extração do link no nó "Montar Pedido" conforme a resposta da API

### Campo `descricao_formula` não atualiza no Sprinthub
- Confirme o nome exato do campo customizado no Sprinthub
- Ajuste no nó "Atualizar Sprinthub"
