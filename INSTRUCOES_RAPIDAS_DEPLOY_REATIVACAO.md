# 🚀 Instruções Rápidas - Deploy Reativação no Render

## ⚡ Resumo Rápido

**NÃO precisa de novo repositório Git!** Você pode usar o mesmo repositório.

## 📋 Passo a Passo

### 1️⃣ Preparar Localmente (Opcional - Para Testar)

```bash
# Instalar dependências
npm install

# Fazer build
npm run build

# Verificar se o build foi criado
ls dist/  # Linux/Mac
dir dist  # Windows
```

### 2️⃣ No Render.com

1. **Acesse:** https://dashboard.render.com
2. **Clique em:** "New +" → "Static Site"
3. **Preencha:**
   - **Name:** `reativacaooficial`
   - **Repository:** Seu repositório Git atual
   - **Branch:** `main` (ou sua branch principal)
   - **Root Directory:** (deixe vazio)
   - **Build Command:** `npm install && npm run build`
   - **Publish Directory:** `dist`
   - **Node Version:** 18 (ou superior)

4. **Configurar Variáveis de Ambiente:**
   - Vá em "Environment" → "Add Environment Variable"
   - Adicione:
     ```
     VITE_SUPABASE_URL = https://seu-projeto.supabase.co
     VITE_SUPABASE_SERVICE_ROLE_KEY = eyJhbGc...
     VITE_SUPABASE_SCHEMA = api
     NODE_ENV = production
     ```

5. **Configurar Domínio:**
   - Vá em "Settings" → "Custom Domain"
   - Adicione: `reativacaooficial.onrender.com`
   - Render gerará automaticamente o SSL

6. **Clique em:** "Create Static Site"

### 3️⃣ Deploy Automático

O Render fará:
1. ✅ Clone do repositório
2. ✅ Instalação de dependências (`npm install`)
3. ✅ Build do projeto (`npm run build`)
4. ✅ Deploy do conteúdo da pasta `dist/`
5. ✅ Disponibilização em `reativacaooficial.onrender.com`

### 4️⃣ Verificar

Após o deploy (5-10 minutos), acesse:
- 🌐 **URL:** https://reativacaooficial.onrender.com
- 🔐 **Login:** https://reativacaooficial.onrender.com/reativacao/login

## 📝 Arquivos Criados

- ✅ `render-reativacao.yaml` - Configuração do Render (opcional)
- ✅ `DEPLOY_REATIVACAO_RENDER.md` - Documentação completa
- ✅ `build-reativacao.sh` - Script de build (Linux/Mac)
- ✅ `build-reativacao.bat` - Script de build (Windows)

## ⚠️ Importante

- **NÃO commit a pasta `dist/`** no Git (já está no `.gitignore`)
- O Render faz o build automaticamente no servidor
- As variáveis de ambiente são **obrigatórias**
- O domínio `.onrender.com` é gratuito e inclui SSL

## 🆘 Problemas?

1. **Build falha:** Verifique os logs no Render
2. **Erro de conexão:** Verifique as variáveis de ambiente
3. **Página não carrega:** Verifique se o `index.html` está no `dist/`

## 📚 Documentação Completa

Veja `DEPLOY_REATIVACAO_RENDER.md` para instruções detalhadas.

