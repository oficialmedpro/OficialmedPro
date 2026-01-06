# 🚀 Guia: Publicar Pré-Checkout no Easypanel via GitHub

## 📋 Pré-requisitos

- Conta no GitHub
- Conta no Easypanel
- Acesso ao repositório Git

---

## 🔄 Passo 1: Enviar Arquivos para o GitHub

### 1.1. Enviar para o Repositório Existente

**Usando o repositório:** `oficialmedpro/OficialmedPro`

Abra o terminal na pasta raiz do projeto:

```powershell
cd C:\oficialmed_pro\minha-pwa

# Adicionar arquivos da pasta pedido
git add .cursor/pedido/

# Fazer commit
git commit -m "feat: Adiciona página de pré-checkout standalone"

# Verificar qual é a branch principal
git branch

# Enviar (substitua 'main' por 'master' se necessário)
git push origin main
```

**Se a branch principal for `master`:**
```powershell
git push origin master
```

---

## ⚙️ Passo 2: Configurar no Easypanel

### 2.1. Criar Novo Projeto

1. Acesse o Easypanel
2. Clique em **"New Project"** ou **"+ Add Project"**
3. Escolha um nome: `pedido-pre-checkout` ou `pre-checkout`

### 2.2. Criar Serviço Estático

1. No projeto criado, clique em **"+ Add Service"**
2. Escolha o tipo: **"Static Site"** ou **"Nginx"**
   - Se não tiver essa opção, escolha **"Custom"** e configure depois

### 2.3. Conectar com GitHub

1. Na configuração do serviço, procure por **"Source"** ou **"Git Repository"**
2. Clique em **"Connect GitHub"** ou **"Connect Repository"**
3. Autorize o Easypanel a acessar seu GitHub (se necessário)
4. Selecione:
   - **Repository:** `oficialmedpro/OficialmedPro`
   - **Branch:** `main` (ou `master` - verifique qual você usa)
   - **Build Path:** `.cursor/pedido` ← **IMPORTANTE!** (caminho da pasta dentro do repo)

### 2.4. Configurar Build (se necessário)

Para uma página estática simples, geralmente não precisa de build. Mas se pedir:

**Build Command:** (deixe vazio)
**Output Directory:** `.cursor/pedido` ou `.` (depende do Easypanel)
**Root Directory:** `.cursor/pedido` (se tiver essa opção)
**Node Version:** (deixe padrão, não é necessário para HTML puro)

### 2.5. Configurar Nginx (se usar Nginx)

Se escolheu "Nginx" ou "Static Site", configure:

**Nginx Config:**
```nginx
server {
    listen 80;
    server_name _;
    root /app;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /pre-checkout {
        try_files $uri $uri/ /index.html;
    }
}
```

**Volume/Path:** `/app` ou `/usr/share/nginx/html`
**Root Directory:** `.cursor/pedido` (se usar build path, ajuste aqui também)

---

## 🔧 Passo 3: Configurar Variáveis de Ambiente (Opcional)

Se preferir usar variáveis de ambiente ao invés de `config.js`:

1. No Easypanel, vá em **"Environment Variables"**
2. Adicione:
   ```
   VITE_SUPABASE_URL=https://agdffspstbxeqhqtltvb.supabase.co
   VITE_SUPABASE_KEY=sua_chave_anon_aqui
   VITE_SUPABASE_SCHEMA=api
   VITE_API_URL=https://api.oficialmed.com.br
   ```

3. Atualize `app.js` para ler essas variáveis (opcional)

---

## 📝 Passo 4: Configurar Config.js

### Opção A: Editar no GitHub (Recomendado)

1. No GitHub, abra o arquivo `config.js`
2. Clique em **"Edit"** (ícone de lápis)
3. Cole sua chave do Supabase:
   ```javascript
   SUPABASE_KEY: 'sua_chave_anon_aqui',
   ```
4. Commit as alterações

### Opção B: Usar Variáveis de Ambiente

Veja Passo 3 acima.

---

## 🌐 Passo 5: Configurar Domínio

### 5.1. Configurar DNS

No seu provedor de DNS, crie um registro:

**Tipo:** `CNAME` ou `A`
**Nome:** `pedido` (ou subdomínio que preferir)
**Valor:** O domínio fornecido pelo Easypanel (ex: `seu-projeto.easypanel.app`)

### 5.2. Configurar Domínio no Easypanel

1. No serviço, vá em **"Domains"** ou **"Custom Domain"**
2. Adicione: `pedido.oficialmed.com.br`
3. O Easypanel irá verificar e configurar SSL automaticamente

---

## 🚀 Passo 6: Deploy

1. No Easypanel, clique em **"Deploy"** ou **"Redeploy"**
2. Aguarde o deploy finalizar
3. Teste acessando: `https://pedido.oficialmed.com.br/pre-checkout/{linkId}`

---

## 🔄 Atualizações Futuras

Para atualizar a página:

```bash
cd .cursor/pedido
git add .
git commit -m "Descrição da alteração"
git push origin main
```

O Easypanel geralmente detecta automaticamente e faz redeploy, ou você pode forçar um redeploy no painel.

---

## 🐛 Troubleshooting

### Erro: "Cannot find module"

- Verifique se todos os arquivos estão no repositório
- Verifique se o caminho no Easypanel está correto

### Erro: "404 Not Found"

- Verifique se o `index.html` está na raiz do projeto
- Verifique a configuração do Nginx

### Erro: "Supabase connection failed"

- Verifique se o `config.js` está configurado corretamente
- Verifique se a chave anon está correta
- Verifique se o schema está correto (`api`)

### Página não atualiza

- Faça um redeploy manual no Easypanel
- Limpe o cache do navegador

---

## ✅ Checklist Final

- [ ] Arquivos enviados para o repositório `oficialmedpro/OficialmedPro`
- [ ] Projeto criado no Easypanel
- [ ] Serviço conectado com GitHub (repositório: `oficialmedpro/OficialmedPro`)
- [ ] **Build Path configurado:** `.cursor/pedido`
- [ ] `config.js` configurado com chave do Supabase (ou variáveis de ambiente)
- [ ] Domínio configurado (`pedido.oficialmed.com.br`)
- [ ] SSL ativado automaticamente
- [ ] Teste realizado com link de pré-checkout

---

**✅ Pronto! Sua página estará online!**
