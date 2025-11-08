# ⚡ Deploy Rápido no Render - Passo a Passo

## 🚀 Método Mais Rápido (5 minutos)

### 1️⃣ Fazer Commit e Push (se ainda não fez)

```bash
# Verificar status
git status

# Adicionar arquivos (se necessário)
git add .

# Commit
git commit -m "Módulo de reativação - pronto para deploy"

# Push
git push origin main
```

### 2️⃣ No Render.com (Passo a Passo)

1. **Acesse:** https://dashboard.render.com
2. **Clique em:** "New +" (canto superior direito)
3. **Selecione:** "Static Site"
4. **Preencha o formulário:**

   **Name:** `reativacaooficial`
   
   **Repository:** Selecione seu repositório Git
   
   **Branch:** `main` (ou sua branch principal)
   
   **Root Directory:** (deixe vazio)
   
   **Build Command:** `npm install && npm run build`
   
   **Publish Directory:** `dist`
   
   **Node Version:** `18` (ou superior)

5. **Clique em:** "Create Static Site"

### 3️⃣ Configurar Variáveis de Ambiente

**IMPORTANTE:** Faça isso antes do primeiro deploy!

1. No serviço criado, vá em **"Environment"**
2. Clique em **"Add Environment Variable"**
3. Adicione uma por vez:

   ```
   Nome: VITE_SUPABASE_URL
   Valor: https://seu-projeto.supabase.co
   ```

   ```
   Nome: VITE_SUPABASE_SERVICE_ROLE_KEY
   Valor: eyJhbGc... (sua chave completa)
   ```

   ```
   Nome: VITE_SUPABASE_SCHEMA
   Valor: api
   ```

   ```
   Nome: NODE_ENV
   Valor: production
   ```

4. Clique em **"Save Changes"**

### 4️⃣ Configurar Domínio (Opcional mas Recomendado)

1. No serviço criado, vá em **"Settings"**
2. Role até **"Custom Domain"**
3. Clique em **"Add"**
4. Digite: `reativacaooficial.onrender.com`
5. Clique em **"Save"**
6. Render gerará automaticamente o SSL (pode levar alguns minutos)

### 5️⃣ Aguardar Deploy

- Render iniciará o build automaticamente
- Tempo estimado: **3-5 minutos**
- Você verá os logs em tempo real
- Quando concluir, verá: **"Live"** em verde

### 6️⃣ Testar

Após o deploy, acesse:
- 🌐 **URL:** https://reativacaooficial.onrender.com
- 🔐 **Login:** https://reativacaooficial.onrender.com/reativacao/login

## ⚠️ Problemas Comuns

### Build Falha
- Verifique se as variáveis de ambiente estão configuradas
- Verifique os logs do build no Render

### Erro 404 na Página
- Verifique se o `index.html` está no `dist/`
- Verifique se o React Router está configurado corretamente

### Erro de Conexão com Supabase
- Verifique se as variáveis de ambiente estão corretas
- Verifique se o Supabase permite conexões externas

## ✅ Checklist Rápido

- [ ] Código commitado e pushed para o Git
- [ ] Static Site criado no Render
- [ ] Build Command: `npm install && npm run build`
- [ ] Publish Directory: `dist`
- [ ] Variáveis de ambiente configuradas
- [ ] Domínio configurado (opcional)
- [ ] Deploy concluído
- [ ] Testado localmente

## 🎉 Pronto!

Seu módulo de reativação estará disponível em:
**https://reativacaooficial.onrender.com**



