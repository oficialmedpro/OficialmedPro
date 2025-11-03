# 🔍 Comandos de Diagnóstico - Container Vendas PWA

## ✅ Status Atual

### O que está funcionando:
- ✅ `index.html` existe e tem conteúdo (880 bytes)
- ✅ `window.ENV` foi injetado corretamente
- ✅ Assets JS e CSS existem e são servidos (HTTP 200)
- ✅ Variáveis Supabase estão sendo detectadas no navegador

### O que não é crítico:
- ⚠️ Erros do Google Ads no console (esperado, sem credenciais configuradas)

## 📋 Comandos Alternativos para Logs

Se `tail` não funcionar, tente estes comandos:

### 1. Verificar se logs existem:
```bash
ls -la /var/log/nginx/
```

### 2. Ver últimos logs de acesso (se existirem):
```bash
cat /var/log/nginx/access.log | tail -20
# ou
head -20 /var/log/nginx/access.log
```

### 3. Ver erros do Nginx (se existirem):
```bash
cat /var/log/nginx/error.log | tail -20
# ou
head -20 /var/log/nginx/error.log
```

### 4. Se os logs não estiverem em /var/log/nginx:
```bash
# Verificar onde o Nginx escreve logs
nginx -T 2>&1 | grep -i "log"
```

### 5. Ver logs do container via Portainer:
- **Services** → `vendas-oficialmed_vendas-pwa` → **Logs**
- Ou: **Containers** → container → **Logs**

## 🎯 Verificação Principal

Como os assets estão sendo servidos corretamente (HTTP 200), o problema não é com o Nginx.

### Próximo passo:
**Testar a aplicação no navegador:**
1. Acesse: https://vendas.oficialmed.com.br
2. Verifique se a página carrega
3. Verifique se há erros no console que impedem o carregamento
4. Os erros do Google Ads (401) são esperados e não impedem o uso

## ✅ Conclusão

Se:
- ✅ Assets retornam HTTP 200
- ✅ Variáveis Supabase são detectadas
- ✅ Aplicação carrega no navegador (mesmo com erros do Google Ads)

**Então a stack está funcionando corretamente!** Os erros do Google Ads são esperados e não afetam o funcionamento principal.

