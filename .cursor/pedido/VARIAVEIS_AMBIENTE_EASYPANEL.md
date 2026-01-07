# Variáveis de Ambiente - Easypanel

Configure as seguintes variáveis de ambiente no Easypanel para a página de pré-checkout:

## Variáveis Obrigatórias

### 1. `VITE_SUPABASE_URL`
- **Descrição**: URL do projeto Supabase
- **Exemplo**: `https://agdffspstbxeqhqtltvb.supabase.co`
- **Onde encontrar**: Supabase Dashboard > Settings > API > Project URL

### 2. `VITE_SUPABASE_KEY`
- **Descrição**: Chave pública (anon) do Supabase
- **⚠️ IMPORTANTE**: Use apenas a chave **anon**, nunca a service_role
- **Exemplo**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
- **Onde encontrar**: Supabase Dashboard > Settings > API > anon public key

### 3. `VITE_SUPABASE_SCHEMA`
- **Descrição**: Schema do banco de dados
- **Valor**: `api`
- **Padrão**: `api` (se não configurado)

### 4. `VITE_N8N_WEBHOOK_URL`
- **Descrição**: URL do webhook do n8n para gerar checkout
- **Exemplo**: `https://seu-n8n.com/webhook-pagina-precheckout`
- **Onde encontrar**: 
  1. Importe o workflow no n8n
  2. Ative o workflow
  3. Copie a URL do webhook do nó "Webhook pagina precheckout"

## Variáveis Opcionais

### 5. `VITE_API_URL`
- **Descrição**: URL da API (usado como fallback)
- **Exemplo**: `https://api.oficialmed.com.br`
- **Padrão**: Usa `window.location.origin` se não configurado

## Como Configurar no Easypanel

1. Acesse seu projeto no Easypanel
2. Vá em **Environment Variables** ou **Variáveis de Ambiente**
3. Adicione cada variável acima com seus respectivos valores
4. Faça o deploy novamente

## Exemplo de Configuração

```
VITE_SUPABASE_URL=https://agdffspstbxeqhqtltvb.supabase.co
VITE_SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_SUPABASE_SCHEMA=api
VITE_N8N_WEBHOOK_URL=https://seu-n8n.com/webhook-pagina-precheckout
VITE_API_URL=https://api.oficialmed.com.br
```

## Fallback

Se as variáveis de ambiente não estiverem configuradas, a página usará os valores do arquivo `config.js` como fallback.
