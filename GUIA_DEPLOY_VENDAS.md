# 🚀 Guia de Deploy - Dashboard de Vendas

## ✅ Status Atual

- ✅ Componentes de vendas recuperados e funcionando
- ✅ Problemas de encoding corrigidos
- ✅ Arquivos adicionados ao Git
- ⏳ Aguardando commit e push
- ⏳ Aguardando build no GitHub Actions
- ⏳ Aguardando atualização no Portainer

---

## 📋 Passo a Passo para Deploy

### **1. Commit das Alterações**

```bash
git commit -m "feat: Adicionar dashboard de vendas com correções de encoding

- Recuperar componentes VendasPage, Acolhimento, Orcamentista e VendasAbas
- Adicionar vendasService.js para buscar KPIs do Supabase
- Corrigir problemas de encoding (caracteres especiais)
- Adicionar rota /vendas no App.jsx
- Corrigir acessos a window.ENV para compatibilidade com build CI
- Desabilitar teste automático do Google Ads na inicialização"
```

### **2. Push para GitHub**

```bash
git push origin main
```

**O que acontece:**
- ✅ O GitHub Actions será acionado automaticamente
- ✅ A imagem Docker será construída com os novos arquivos
- ✅ A imagem será enviada para Docker Hub como `oficialmedpro/oficialmed-pwa:latest`

### **3. Verificar Build no GitHub Actions**

1. Acesse: https://github.com/[seu-usuario]/[seu-repositorio]/actions
2. Clique no workflow "Deploy to Docker Hub" que está rodando
3. Aguarde até aparecer ✅ **Success** (geralmente 5-10 minutos)
4. Se aparecer ❌ **Failure**, verifique os logs e corrija os erros

### **4. Atualizar Stack no Portainer**

**Opção A: Via Portainer (Recomendado)**

1. **Acesse o Portainer:**
   - URL: `https://portainer.oficialmed.com.br` (ou sua URL)
   - Faça login com suas credenciais

2. **Navegue até Stacks:**
   - No menu lateral, clique em **"Stacks"**
   - Procure pela stack **`vendas-oficialmed`** (ou o nome que você usou)

3. **Atualize a Stack:**
   - Clique em **"Editor"** ou **"Update the stack"**
   - Você verá o conteúdo do `stack-vendas-pwa.yml`
   - **IMPORTANTE:** Marque a opção **"Pull latest image"** ✅
   - Clique em **"Update the stack"**

4. **Aguarde o Deploy:**
   - O Portainer irá:
     - Baixar a nova imagem do Docker Hub
     - Parar o container antigo
     - Criar um novo container com a nova imagem
     - Iniciar o novo container
   - Isso leva cerca de 1-2 minutos

**Opção B: Via Linha de Comando (SSH no Manager)**

```bash
# Se você tem acesso SSH ao servidor manager do Docker Swarm:
docker stack deploy -c stack-vendas-pwa.yml vendas-oficialmed --with-registry-auth

# Ou com pull forçado:
docker service update --image oficialmedpro/oficialmed-pwa:latest --force vendas-oficialmed_vendas-pwa
```

### **5. Verificar Deploy**

1. **Aguarde 2-3 minutos** após o update no Portainer

2. **Acesse o Dashboard:**
   - URL: `https://vendas.oficialmed.com.br/vendas`
   - Verifique se a página carrega corretamente

3. **Teste os Recursos:**
   - ✅ Verifique se os acentos aparecem corretamente
   - ✅ Teste as abas (Acolhimento, Orçamentista, Vendas)
   - ✅ Verifique se os KPIs estão carregando
   - ✅ Teste os filtros (Período, Usuário, etc.)

4. **Verificar Logs (se houver problemas):**
   - No Portainer, vá em **"Containers"**
   - Clique no container `vendas-oficialmed_vendas-pwa`
   - Clique em **"Logs"**
   - Verifique se há erros

---

## 🔍 Troubleshooting

### **Problema: Dashboard não carrega**

**Verificações:**
1. ✅ Build do GitHub Actions terminou com sucesso?
2. ✅ Stack foi atualizada no Portainer com "Pull latest image"?
3. ✅ Container está rodando? (verifique em Containers)
4. ✅ Traefik está configurado corretamente?
5. ✅ Secrets do Docker Swarm estão criados?

**Solução:**
```bash
# Ver logs do container
docker service logs vendas-oficialmed_vendas-pwa --tail 50

# Verificar se o serviço está rodando
docker service ps vendas-oficialmed_vendas-pwa
```

### **Problema: Acentos ainda estão errados**

**Causa:**
- Encoding do arquivo ainda está errado
- Ou o navegador não está interpretando UTF-8

**Solução:**
1. Verifique se `index.html` tem `<meta charset="UTF-8">`
2. Verifique se o `nginx.conf` tem `charset utf-8;`
3. Recrie o build se necessário

### **Problema: Variáveis de ambiente não funcionam**

**Causa:**
- Secrets do Docker Swarm não estão configurados
- Ou `docker-entrypoint.sh` não está injetando as variáveis

**Solução:**
```bash
# Verificar secrets
docker secret ls | grep VITE_SUPABASE

# Ver logs do entrypoint
docker service logs vendas-oficialmed_vendas-pwa | grep -i "ENV\|supabase"
```

---

## 📊 Checklist de Deploy

- [ ] Commit feito com mensagem descritiva
- [ ] Push para `main` realizado
- [ ] Build do GitHub Actions terminou com sucesso ✅
- [ ] Stack atualizada no Portainer com "Pull latest image"
- [ ] Container está rodando corretamente
- [ ] Dashboard acessível em `https://vendas.oficialmed.com.br/vendas`
- [ ] Acentos e caracteres especiais aparecem corretamente
- [ ] Todas as abas funcionam (Acolhimento, Orçamentista, Vendas)
- [ ] KPIs estão carregando corretamente
- [ ] Filtros funcionam (Período, Usuário, etc.)
- [ ] Logs não mostram erros críticos

---

## 🎯 Comandos Rápidos

```bash
# 1. Adicionar arquivos
git add src/pages/vendas/ src/service/vendasService.js src/App.jsx src/config/supabase.js src/service/googlePatrocinadoService.js

# 2. Commit
git commit -m "feat: Adicionar dashboard de vendas com correções de encoding"

# 3. Push
git push origin main

# 4. Verificar build (no GitHub Actions)
# Acesse: https://github.com/[seu-usuario]/[seu-repo]/actions

# 5. Atualizar stack no Portainer (via interface web)
# Stacks > vendas-oficialmed > Editor > Pull latest image > Update

# 6. Verificar logs
docker service logs vendas-oficialmed_vendas-pwa --tail 50 -f
```

---

## 📝 Notas Importantes

1. **Tempo de Deploy:**
   - Build no GitHub Actions: ~5-10 minutos
   - Update no Portainer: ~1-2 minutos
   - **Total: ~6-12 minutos**

2. **Downtime:**
   - Durante o update no Portainer, haverá um breve downtime (~10-30 segundos)
   - Isso é normal quando o container é recriado

3. **Rollback (se necessário):**
   - No Portainer, você pode fazer rollback para uma versão anterior
   - Ou usar uma tag específica no `stack-vendas-pwa.yml` ao invés de `latest`

4. **Variáveis de Ambiente:**
   - As variáveis são injetadas via Docker Swarm Secrets no runtime
   - Elas não precisam estar no código (são lidas de `/run/secrets/`)

---

## ✅ Pronto!

Após seguir esses passos, o dashboard de vendas estará funcionando perfeitamente em `https://vendas.oficialmed.com.br/vendas`!

Qualquer dúvida, verifique os logs ou me avise! 🚀
