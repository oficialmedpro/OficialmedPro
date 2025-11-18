# 🚀 Comandos de Deploy Rápido - Beta e API Sincronização

## ✅ Status do Git

Todos os commits foram feitos e enviados:
- ✅ Organização do projeto
- ✅ Correção dos workflows GitHub Actions
- ✅ Organização dos guias definitivos

---

## 🎯 DEPLOY BETA (bi-oficialmed)

### Comando Completo (Copiar e Colar):

```bash
ssh root@srv1109021
cd /etc/easypanel/projects/bi-oficialmed && \
docker service scale bi-oficialmed_app=0 && \
sleep 5 && \
docker service update --image easypanel/bi-oficialmed/app:latest bi-oficialmed_app --force && \
docker service scale bi-oficialmed_app=1 && \
echo "✅ Beta deployado com sucesso!"
```

### Verificar Deploy:

```bash
# Ver status
docker service ps bi-oficialmed_app

# Ver logs
docker service logs --tail 50 bi-oficialmed_app

# Ver logs em tempo real
docker service logs -f bi-oficialmed_app
```

---

## ⚙️ DEPLOY API SINCRONIZAÇÃO (sprint-sync)

### Comando Completo (Copiar e Colar):

```bash
ssh root@srv1109021
cd /etc/easypanel/projects/sprint-sync && \
docker service scale sprint-sync_sincronizacao=0 && \
sleep 5 && \
docker service update --image easypanel/sprint-sync/sincronizacao:latest sprint-sync_sincronizacao --force && \
docker service scale sprint-sync_sincronizacao=1 && \
echo "✅ API de sincronização deployada com sucesso!"
```

### Verificar Deploy:

```bash
# Ver status
docker service ps sprint-sync_sincronizacao

# Ver logs
docker service logs --tail 50 sprint-sync_sincronizacao

# Ver logs em tempo real
docker service logs -f sprint-sync_sincronizacao

# Testar endpoint
curl https://sincrocrm.oficialmed.com.br/health
```

---

## 🚀 DEPLOY COMPLETO (Beta + API)

### Script Completo (Copiar e Colar):

```bash
ssh root@srv1109021

# DEPLOY BETA
echo "📦 Deploy do Beta..."
cd /etc/easypanel/projects/bi-oficialmed && \
docker service scale bi-oficialmed_app=0 && \
sleep 5 && \
docker service update --image easypanel/bi-oficialmed/app:latest bi-oficialmed_app --force && \
docker service scale bi-oficialmed_app=1 && \
echo "✅ Beta deployado!"

# DEPLOY API SINCRONIZAÇÃO
echo "📦 Deploy da API de Sincronização..."
cd /etc/easypanel/projects/sprint-sync && \
docker service scale sprint-sync_sincronizacao=0 && \
sleep 5 && \
docker service update --image easypanel/sprint-sync/sincronizacao:latest sprint-sync_sincronizacao --force && \
docker service scale sprint-sync_sincronizacao=1 && \
echo "✅ API de sincronização deployada!"

echo "🎉 Deploy completo finalizado!"
```

---

## 🔍 Verificação Pós-Deploy

### 1. Verificar Status de Ambos:

```bash
docker service ls | grep -E "bi-oficialmed|sprint-sync"
```

### 2. Testar Endpoints:

```bash
# Beta
curl https://beta.oficialmed.com.br/health
# ou
curl https://bi.oficialmed.com.br/health

# API Sincronização
curl https://sincrocrm.oficialmed.com.br/health
curl https://sincrocrm.oficialmed.com.br/sync/all?trigger=test
```

### 3. Ver Logs de Erros:

```bash
# Beta
docker service logs bi-oficialmed_app 2>&1 | grep -i error | tail -20

# API Sincronização
docker service logs sprint-sync_sincronizacao 2>&1 | grep -i error | tail -20
```

---

## ⚠️ Troubleshooting

### Se o serviço não iniciar:

```bash
# Ver detalhes do erro
docker service ps --no-trunc bi-oficialmed_app
docker service ps --no-trunc sprint-sync_sincronizacao

# Forçar pull da imagem
docker service update --force --image-pull-policy always bi-oficialmed_app
docker service update --force --image-pull-policy always sprint-sync_sincronizacao
```

### Se a imagem não atualizar:

```bash
# Verificar qual imagem está sendo usada
docker service inspect bi-oficialmed_app | grep Image
docker service inspect sprint-sync_sincronizacao | grep Image

# Forçar rebuild (se necessário)
docker service update --force --image-pull-policy always bi-oficialmed_app
```

---

## 📝 Checklist de Deploy

- [ ] Conectado ao servidor via SSH
- [ ] Código commitado e pushado no Git
- [ ] GitHub Actions build passou (verificar Actions)
- [ ] Deploy do Beta executado
- [ ] Deploy da API de Sincronização executado
- [ ] Verificados logs de ambos os serviços
- [ ] Testados endpoints de health check
- [ ] Verificado funcionamento no navegador (Beta)
- [ ] Testada sincronização manual (API)

---

**Última atualização:** Novembro 2025  
**Ambiente:** EasyPanel / Docker Swarm  
**Servidor:** srv1109021

