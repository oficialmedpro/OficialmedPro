# 🚀 Deploy do Módulo de Reativação no Render

Este guia explica como fazer o deploy apenas do módulo de reativação no Render com o domínio `reativacaooficial.onrender.com`.

## 📋 Pré-requisitos

1. Conta no Render.com (gratuita)
2. Repositório Git (GitHub, GitLab ou Bitbucket)
3. Variáveis de ambiente do Supabase configuradas

## 🔧 Opções de Deploy

### Opção 1: Usar o mesmo repositório (Recomendado)

Você pode usar o mesmo repositório Git, mas criar um serviço separado no Render:

1. **No Render Dashboard:**
   - Clique em "New +" → "Static Site"
   - Nome: `reativacaooficial`
   - Repositório: Mesmo repositório atual
   - Branch: `main` (ou a branch que você usa)
   - Build Command: `npm install && npm run build`
   - Publish Directory: `dist`
   - Root Directory: (deixe vazio ou use `.`)

2. **Configurar Variáveis de Ambiente:**
   - Vá em "Environment" → "Add Environment Variable"
   - Adicione:
     - `VITE_SUPABASE_URL` = Sua URL do Supabase
     - `VITE_SUPABASE_SERVICE_ROLE_KEY` = Sua service role key
     - `VITE_SUPABASE_SCHEMA` = `api`
     - `NODE_ENV` = `production`

3. **Configurar Domínio Personalizado:**
   - Vá em "Settings" → "Custom Domain"
   - Adicione: `reativacaooficial.onrender.com`
   - Render gerará automaticamente o certificado SSL

### Opção 2: Usar arquivo render.yaml

1. **Commitar o arquivo `render-reativacao.yaml` no repositório**

2. **No Render Dashboard:**
   - Clique em "New +" → "Blueprint"
   - Selecione o repositório
   - Render detectará automaticamente o arquivo `render-reativacao.yaml`
   - Clique em "Apply"

3. **Configurar Variáveis de Ambiente:**
   - Mesmo processo da Opção 1

### Opção 3: Branch separada (Opcional)

Se preferir manter o código de reativação separado:

1. **Criar branch de reativação:**
   ```bash
   git checkout -b reativacao-production
   git push origin reativacao-production
   ```

2. **No Render:**
   - Use a branch `reativacao-production` ao invés de `main`

## 🔨 Build Local (Para Testar)

Antes de fazer o deploy, você pode testar o build localmente:

```bash
# Instalar dependências
npm install

# Fazer build
npm run build

# Verificar se o build foi criado
ls -la dist/

# Preview local (opcional)
npm run preview
```

O build será criado na pasta `dist/` que contém todos os arquivos estáticos prontos para deploy.

## 📝 Configuração do Render

### Variáveis de Ambiente Necessárias

No Render, configure estas variáveis:

| Variável | Valor | Descrição |
|----------|-------|-----------|
| `NODE_ENV` | `production` | Ambiente de produção |
| `VITE_SUPABASE_URL` | `https://...` | URL do seu projeto Supabase |
| `VITE_SUPABASE_SERVICE_ROLE_KEY` | `eyJ...` | Service Role Key do Supabase |
| `VITE_SUPABASE_SCHEMA` | `api` | Schema do banco de dados |

### Build Settings

- **Build Command:** `npm install && npm run build`
- **Publish Directory:** `dist`
- **Node Version:** 18.x ou superior (se necessário)

## 🌐 Domínio Personalizado

1. Vá em "Settings" → "Custom Domain"
2. Adicione: `reativacaooficial.onrender.com`
3. Render gerará automaticamente:
   - Certificado SSL (HTTPS)
   - DNS configurado

## 🔄 Deploy Automático

O Render faz deploy automático quando você:

1. Faz push para a branch configurada
2. O build é executado automaticamente
3. O site é atualizado automaticamente

## ✅ Verificação Pós-Deploy

Após o deploy, verifique:

1. ✅ Site acessível em `https://reativacaooficial.onrender.com`
2. ✅ Login funcionando em `/reativacao/login`
3. ✅ Páginas de reativação carregando corretamente
4. ✅ Conexão com Supabase funcionando
5. ✅ Filtros e exportações funcionando

## 🐛 Troubleshooting

### Build falha
- Verifique se todas as dependências estão no `package.json`
- Verifique os logs do build no Render

### Erro de conexão com Supabase
- Verifique se as variáveis de ambiente estão corretas
- Verifique se o Supabase permite conexões do Render

### Página não carrega
- Verifique se o `index.html` está no `dist/`
- Verifique se as rotas estão configuradas corretamente no React Router

### Assets não carregam
- Verifique os caminhos dos assets (devem ser relativos)
- Verifique se o `vite.config.js` está configurado corretamente

## 📚 Documentação Adicional

- [Render Documentation](https://render.com/docs)
- [Vite Build Guide](https://vitejs.dev/guide/build.html)
- [React Router Deployment](https://reactrouter.com/en/main/start/overview#deployment)










