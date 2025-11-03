# 🔧 Solução: Dashboard de Vendas não Funciona na Stack

## ❓ Problema

- ✅ Localmente funciona: `http://localhost:5173/vendas`
- ❌ Na stack não funciona: `https://vendas.oficialmed.com.br/vendas`

## 🎯 Causas Mais Comuns

### 1. **Build Desatualizado no Docker Hub**
O GitHub Actions pode ter falhado ou não ter feito o push da última versão.

### 2. **Variáveis de Ambiente Não Injetadas**
O `docker-entrypoint.sh` não está conseguindo ler os secrets e injetar no HTML.

### 3. **Container não Atualizou**
O Portainer pode estar usando uma imagem em cache antiga.

### 4. **Erro no Build de Produção**
Algum código que funciona em dev (Vite) pode estar quebrando no build de produção.

---

## 🚀 Solução Rápida (Passo a Passo)

### **Passo 1: Verificar se Código Está Commitado**

```bash
# Ver status do Git
git status

# Se houver arquivos não commitados:
git add .
git commit -m "fix: Corrigir dashboard de vendas"
git push origin main
```

### **Passo 2: Verificar Build do GitHub Actions**

1. Acesse: `https://github.com/[seu-usuario]/[seu-repo]/actions`
2. Procure pelo workflow **"Deploy to Docker Hub"**
3. Verifique se o último build está ✅ **Success** (verde)
4. Se estiver ❌ **Failed** (vermelho), clique e veja os erros

**Se o build falhou:**
- Leia os erros no log
- Corrija os problemas no código
- Commit e push novamente

### **Passo 3: Forçar Update da Imagem Docker**

**Via Portainer (Recomendado):**

1. Acesse o Portainer
2. Vá em **Stacks** → **vendas-oficialmed** (ou nome da sua stack)
3. Clique em **Update the stack**
4. ✅ Marque **"Pull and redeploy"** ou **"Pull latest image"**
5. Clique em **Update the stack**

**Via SSH (Alternativa):**

```bash
# Forçar update do serviço com nova imagem
docker service update \
  --image oficialmedpro/oficialmed-pwa:latest \
  --force \
  vendas-oficialmed_vendas-pwa
```

### **Passo 4: Executar Diagnóstico**

Rode o script de diagnóstico que criei:

```bash
# Dar permissão de execução
chmod +x diagnostico-vendas-dashboard.sh

# Executar
./diagnostico-vendas-dashboard.sh > diagnostico-output.txt

# Ver resultado
cat diagnostico-output.txt
```

### **Passo 5: Verificar Logs em Tempo Real**

```bash
# Logs do serviço
docker service logs vendas-oficialmed_vendas-pwa --tail 50 -f

# OU, se o nome for diferente:
docker service logs $(docker service ls --filter name=vendas-pwa --format "{{.ID}}") --tail 50 -f
```

**O que procurar nos logs:**
- ✅ `🔧 Carregando secrets do Docker Swarm...`
- ✅ `✅ VITE_SUPABASE_URL carregada do secret`
- ✅ `✅ window.ENV encontrado no HTML`
- ✅ `🚀 Iniciando aplicação nginx...`

**Sinais de problema:**
- ❌ `⚠️ Secret VITE_SUPABASE_URL não encontrado`
- ❌ `❌ window.ENV NÃO encontrado no HTML`
- ❌ `❌ ERRO: index.html não existe`

---

## 🔍 Diagnósticos Específicos

### **Problema 1: Variáveis de Ambiente Vazias**

**Sintoma:** Logs mostram `⚠️ Secret não encontrado`

**Solução:**

```bash
# 1. Verificar se os secrets existem
docker secret ls | grep VITE_SUPABASE

# 2. Se não existirem, criar:
echo "https://agdffspstbxeqhqtltvb.supabase.co" | docker secret create VITE_SUPABASE_URL_CORRETO -
echo "sua-service-role-key-aqui" | docker secret create VITE_SUPABASE_SERVICE_ROLE_KEY -
echo "api" | docker secret create VITE_SUPABASE_SCHEMA -

# 3. Redeployar a stack
docker stack deploy -c stack-vendas-pwa.yml vendas-oficialmed --with-registry-auth
```

### **Problema 2: Página Branca ou 404**

**Sintoma:** Ao acessar `/vendas`, aparece página branca ou erro 404

**Causas possíveis:**
1. Rota `/vendas` não está no build de produção
2. React Router não está configurado corretamente
3. Nginx não está fazendo fallback para `index.html`

**Solução:**

```bash
# Verificar se o build tem a rota /vendas
CONTAINER_ID=$(docker ps --filter "name=vendas" --format "{{.ID}}" | head -n 1)
docker exec $CONTAINER_ID cat /usr/share/nginx/html/index.html | grep -i "vendas"

# Verificar nginx.conf
docker exec $CONTAINER_ID cat /etc/nginx/nginx.conf
```

**Verificar se nginx.conf tem:**
```nginx
location / {
    try_files $uri $uri/ /index.html;
}
```

### **Problema 3: Erro de CORS ou Supabase**

**Sintoma:** Console do browser mostra erros de CORS ou falha ao conectar com Supabase

**Solução:**

1. Abra o console do browser (F12)
2. Vá na aba **Console**
3. Procure por erros vermelhos
4. Anote os erros específicos

**Verificar variáveis injetadas:**

Abra o browser e cole no console:
```javascript
console.log('window.ENV:', window.ENV)
```

Deve retornar:
```javascript
{
  VITE_SUPABASE_URL: "https://agdffspstbxeqhqtltvb.supabase.co",
  VITE_SUPABASE_SERVICE_ROLE_KEY: "eyJ...",
  VITE_SUPABASE_SCHEMA: "api"
}
```

Se retornar `undefined`, as variáveis não foram injetadas corretamente.

### **Problema 4: Build de Produção Falha**

**Sintoma:** GitHub Actions mostra erro no build

**Erros comuns:**

1. **Erro de TypeScript/ESLint:**
   - Corrija os erros no código
   - Ou desabilite temporariamente no `vite.config.js`

2. **Variável `window` não definida:**
   - Use `typeof window !== 'undefined'` antes de acessar `window`
   - Já corrigido em `src/config/supabase.js`

3. **Import dinâmico quebrado:**
   - Use lazy loading com `React.lazy()`
   - Já implementado para páginas do Google Ads

---

## ✅ Checklist de Validação

Após fazer as correções, valide:

- [ ] **GitHub Actions** - Build terminou com sucesso ✅
- [ ] **Docker Hub** - Imagem `oficialmedpro/oficialmed-pwa:latest` atualizada
- [ ] **Portainer** - Stack atualizada com "Pull latest image"
- [ ] **Logs** - Mostram secrets carregados e window.ENV injetado
- [ ] **URL** - `https://vendas.oficialmed.com.br/vendas` carrega
- [ ] **Console** - `window.ENV` está definido
- [ ] **Supabase** - Requisições funcionam (Network tab)
- [ ] **Dashboard** - KPIs carregam corretamente

---

## 🆘 Se Nada Funcionar

Execute TODOS esses comandos e me envie o output:

```bash
# 1. Status do serviço
docker service ps vendas-oficialmed_vendas-pwa --no-trunc

# 2. Logs completos
docker service logs vendas-oficialmed_vendas-pwa --tail 200 > logs.txt

# 3. Inspecionar container
CONTAINER_ID=$(docker ps --filter "name=vendas" --format "{{.ID}}" | head -n 1)
docker exec $CONTAINER_ID sh -c "
  echo '=== Secrets ===' && ls -la /run/secrets/ &&
  echo '=== Index.html size ===' && wc -c /usr/share/nginx/html/index.html &&
  echo '=== window.ENV ===' && grep -o 'window.ENV[^<]*' /usr/share/nginx/html/index.html | head -n 1
" > container-info.txt

# 4. Verificar imagem
docker service inspect vendas-oficialmed_vendas-pwa --format='{{.Spec.TaskTemplate.ContainerSpec.Image}}'

# 5. Secrets
docker secret ls | grep VITE_SUPABASE
```

Envie os arquivos:
- `logs.txt`
- `container-info.txt`
- Screenshot do erro no browser (console F12)

---

## 🎯 Resumo das Ações

1. ✅ Commit e push do código
2. ✅ Verificar build do GitHub Actions
3. ✅ Forçar update da stack no Portainer
4. ✅ Executar script de diagnóstico
5. ✅ Verificar logs do container
6. ✅ Testar no browser

**Tempo estimado:** 10-15 minutos

---

## 📚 Arquivos Relacionados

- `stack-vendas-pwa.yml` - Stack do Docker Swarm
- `docker-entrypoint.sh` - Injeta variáveis no runtime
- `Dockerfile` - Build da imagem
- `.github/workflows/deploy-to-dockerhub.yml` - CI/CD
- `src/config/supabase.js` - Configuração do Supabase
- `src/pages/vendas/VendasPage.jsx` - Página principal

---

Boa sorte! 🚀
