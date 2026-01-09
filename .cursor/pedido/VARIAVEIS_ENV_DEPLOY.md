# 🔧 Variáveis de Ambiente para Deploy

## 📋 Variáveis Necessárias

Configure as seguintes variáveis de ambiente na sua plataforma de deploy (Vercel, Netlify, Railway, etc.):

### 1. **API do Checkout Transparente**

```bash
VITE_CHECKOUT_API_URL=https://api.oficialmed.com.br
VITE_CHECKOUT_API_KEY=sua_chave_api_backend_aqui
```

**Onde obter:**
- `VITE_CHECKOUT_API_URL`: URL do seu backend que integra com Asaas
- `VITE_CHECKOUT_API_KEY`: Chave de autenticação configurada no seu backend

### 2. **Supabase** (se ainda não estiver configurado)

```bash
VITE_SUPABASE_URL=https://agdffspstbxeqhqtltvb.supabase.co
VITE_SUPABASE_KEY=sua_chave_anon_do_supabase
VITE_SUPABASE_SCHEMA=api
```

### 3. **Google Analytics** (opcional)

```bash
VITE_GA4_MEASUREMENT_ID=G-NCJG7F37CL
```

### 4. **N8N Webhook** (se usar)

```bash
VITE_N8N_WEBHOOK_URL=https://n8n.oficialmed.com.br/webhook-pagina-precheckout
```

---

## 🚀 Como Configurar em Cada Plataforma

### **Vercel**

1. Acesse seu projeto no Vercel
2. Vá em **Settings** → **Environment Variables**
3. Adicione cada variável:
   - **Key**: `VITE_CHECKOUT_API_URL`
   - **Value**: `https://api.oficialmed.com.br`
   - **Environment**: Production, Preview, Development (selecione conforme necessário)
4. Clique em **Save**
5. Repita para todas as variáveis
6. **Importante**: Faça um novo deploy após adicionar as variáveis

### **Netlify**

1. Acesse seu site no Netlify
2. Vá em **Site settings** → **Environment variables**
3. Clique em **Add a variable**
4. Adicione cada variável:
   - **Key**: `VITE_CHECKOUT_API_URL`
   - **Value**: `https://api.oficialmed.com.br`
5. Clique em **Save**
6. Repita para todas as variáveis
7. **Importante**: Faça um novo deploy após adicionar as variáveis

### **Railway**

1. Acesse seu projeto no Railway
2. Vá em **Variables**
3. Clique em **New Variable**
4. Adicione cada variável:
   - **Key**: `VITE_CHECKOUT_API_URL`
   - **Value**: `https://api.oficialmed.com.br`
5. Clique em **Add**
6. Repita para todas as variáveis
7. O deploy será automático após salvar

### **Render**

1. Acesse seu serviço no Render
2. Vá em **Environment**
3. Clique em **Add Environment Variable**
4. Adicione cada variável:
   - **Key**: `VITE_CHECKOUT_API_URL`
   - **Value**: `https://api.oficialmed.com.br`
5. Clique em **Save Changes**
6. Repita para todas as variáveis
7. O deploy será automático

---

## ✅ Checklist de Configuração

- [ ] `VITE_CHECKOUT_API_URL` configurada
- [ ] `VITE_CHECKOUT_API_KEY` configurada
- [ ] `VITE_SUPABASE_URL` configurada (se necessário)
- [ ] `VITE_SUPABASE_KEY` configurada (se necessário)
- [ ] `VITE_SUPABASE_SCHEMA` configurada (se necessário)
- [ ] `VITE_GA4_MEASUREMENT_ID` configurada (opcional)
- [ ] `VITE_N8N_WEBHOOK_URL` configurada (se usar)
- [ ] Novo deploy realizado após adicionar variáveis

---

## 🔍 Como Verificar se Está Funcionando

Após configurar e fazer o deploy:

1. Acesse a página de pré-checkout
2. Abra o Console do navegador (F12)
3. Verifique se não há erros relacionados a:
   - `CHECKOUT_API_KEY não configurada`
   - `API Key do checkout não configurada`
4. Tente finalizar um pedido de teste
5. Verifique os logs do console para ver as requisições à API

---

## ⚠️ Importante

- **Nunca** commite as chaves de API no código
- Use sempre variáveis de ambiente para valores sensíveis
- As variáveis que começam com `VITE_` são expostas no frontend, mas isso é esperado para APIs públicas
- A `CHECKOUT_API_KEY` é usada apenas para autenticar com seu backend, não diretamente com o Asaas

---

## 📝 Exemplo Completo

```bash
# Checkout Transparente
VITE_CHECKOUT_API_URL=https://api.oficialmed.com.br
VITE_CHECKOUT_API_KEY=abc123xyz789

# Supabase
VITE_SUPABASE_URL=https://agdffspstbxeqhqtltvb.supabase.co
VITE_SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_SUPABASE_SCHEMA=api

# Analytics
VITE_GA4_MEASUREMENT_ID=G-NCJG7F37CL

# N8N (opcional)
VITE_N8N_WEBHOOK_URL=https://n8n.oficialmed.com.br/webhook-pagina-precheckout
```

---

**Última atualização:** Janeiro 2025
