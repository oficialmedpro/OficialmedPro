# 🔍 Diagnóstico Stack Vendas - Problema 880 bytes

## ⚠️ Problema Identificado

O container está retornando **exatamente 880 bytes** para todas as requisições, sugerindo que:
1. O `index.html` pode estar muito pequeno ou incorreto
2. O build da aplicação pode não ter funcionado
3. Os logs do `docker-entrypoint.sh` não estão aparecendo

## 🔍 Como Diagnosticar

### 1. Verificar Logs de Inicialização do Container

Os logs que você vê são apenas os **logs de acesso do nginx** (`access.log`). 
Os logs do `docker-entrypoint.sh` vão para **stdout/stderr** do container.

**No Portainer:**
1. Vá em **Services** → `vendas-oficialmed_vendas-pwa`
2. Clique na aba **Logs** (não "Service logs", mas "Logs" da tarefa)
3. Ou vá em **Containers** → encontre o container → **Logs**
4. Procure por mensagens como:
   - `🔧 Carregando secrets do Docker Swarm...`
   - `✅ VITE_SUPABASE_URL carregada`
   - `✅ index.html existe - Tamanho: XXXX bytes`

### 2. Verificar Conteúdo do Container

**No Portainer:**
1. **Containers** → `vendas-oficialmed_vendas-pwa` → **Console** → **Connect**
2. Execute:
   ```bash
   # Verificar se index.html existe
   ls -lh /usr/share/nginx/html/index.html
   
   # Ver tamanho do arquivo
   wc -c /usr/share/nginx/html/index.html
   
   # Ver conteúdo (primeiras linhas)
   head -20 /usr/share/nginx/html/index.html
   
   # Verificar se window.ENV foi injetado
   grep -o "window.ENV" /usr/share/nginx/html/index.html
   
   # Listar todos os arquivos
   ls -la /usr/share/nginx/html/
   ```

### 3. Verificar Secrets

No console do container:
```bash
# Verificar se secrets estão montados
ls -la /run/secrets/

# Verificar conteúdo (sem mostrar valor completo)
cat /run/secrets/VITE_SUPABASE_URL_CORRETO | head -c 30
```

### 4. Verificar Imagem Docker

1. **Images** → `oficialmedpro/oficialmed-pwa:latest`
2. Verificar quando foi criada (último build)
3. Se necessário, fazer **Pull** novamente

## 🔧 Possíveis Causas e Soluções

### Causa 1: Build Falhou
**Sintoma:** `index.html` não existe ou está muito pequeno (< 1KB)

**Solução:**
1. Verificar logs do GitHub Actions
2. Verificar se build completou com sucesso
3. Rebuild a imagem se necessário

### Causa 2: Imagem Antiga
**Sintoma:** Imagem não tem o `docker-entrypoint.sh` atualizado

**Solução:**
1. Fazer **Pull** da imagem mais recente no Portainer
2. Reiniciar o container
3. Verificar logs novamente

### Causa 3: Secrets Não Montados
**Sintoma:** Logs mostram "❌ Diretório /run/secrets não encontrado"

**Solução:**
1. Verificar se secrets existem no Portainer
2. Verificar se stack está referenciando os secrets corretos
3. Verificar permissões dos secrets

### Causa 4: Entrypoint Não Executa
**Sintoma:** Não há logs do entrypoint nos logs do container

**Solução:**
1. Verificar se `docker-entrypoint.sh` existe no container
2. Verificar permissões (deve ser executável)
3. Verificar se `ENTRYPOINT` está configurado corretamente no Dockerfile

## 📋 Checklist de Diagnóstico

- [ ] Verificar logs de inicialização (stdout/stderr)
- [ ] Verificar tamanho do `index.html` no container
- [ ] Verificar se `window.ENV` foi injetado no HTML
- [ ] Verificar se secrets estão montados
- [ ] Verificar data da imagem Docker
- [ ] Verificar logs do GitHub Actions (último build)

## 🚀 Próximos Passos

1. **Atualizar imagem Docker** com as melhorias do `docker-entrypoint.sh`
2. **Fazer Pull** da nova imagem no Portainer
3. **Reiniciar** o serviço
4. **Verificar logs** de inicialização
5. **Testar** acesso à aplicação

## 📝 Notas

- Os logs do nginx (`access.log`) mostram apenas requisições HTTP
- Os logs do `docker-entrypoint.sh` vão para stdout/stderr do container
- 880 bytes é muito pequeno para um HTML completo de aplicação React

