# 🚀 DEPLOY EASYPANEL - BETA E SERVIÇO DE SINCRONIZAÇÃO

## 📋 Visão Geral

Este documento contém os comandos para fazer deploy no EasyPanel:
1. **Beta** (bi-oficialmed / beta-oficialpro)
2. **Serviço de Sincronização** (sprint-sync / sincronizacao)

---

## 🔐 PASSO 1: CONECTAR AO SERVIDOR

```bash
ssh root@<seu-servidor>
# ou
ssh root@srv1109021
```

---

## 🎯 DEPLOY DO BETA (bi-oficialmed / beta-oficialpro)

### Localização do Projeto
```bash
cd /etc/easypanel/projects/bi-oficialmed
# ou
cd /etc/easypanel/projects/beta-oficialpro
```

### Comandos de Deploy

#### Opção 1: Redeploy Forçado (Recomendado)
```bash
# 1. Parar o serviço
docker service scale bi-oficialmed_app=0
# ou
docker service scale beta-oficialpro_app=0

# 2. Aguardar 5 segundos
sleep 5

# 3. Forçar atualização da imagem
docker service update --image easypanel/bi-oficialmed/app:latest bi-oficialmed_app --force
# ou
docker service update --image easypanel/beta-oficialpro/app:latest beta-oficialpro_app --force

# 4. Reiniciar o serviço
docker service scale bi-oficialmed_app=1
# ou
docker service scale beta-oficialpro_app=1
```

#### Opção 2: Comando Único (Mais Rápido)
```bash
cd /etc/easypanel/projects/bi-oficialmed && \
docker service scale bi-oficialmed_app=0 && \
sleep 5 && \
docker service update --image easypanel/bi-oficialmed/app:latest bi-oficialmed_app --force && \
docker service scale bi-oficialmed_app=1
```

### Verificar Deploy do Beta

```bash
# Ver status do serviço
docker service ps bi-oficialmed_app
# ou
docker service ps beta-oficialpro_app

# Ver logs em tempo real
docker service logs -f bi-oficialmed_app
# ou
docker service logs -f beta-oficialpro_app

# Ver últimas 100 linhas
docker service logs --tail 100 bi-oficialmed_app
```

---

## ⚙️ DEPLOY DO SERVIÇO DE SINCRONIZAÇÃO (sprint-sync / sincronizacao)

### Localização do Projeto
```bash
cd /etc/easypanel/projects/sprint-sync
```

### Comandos de Deploy

#### Opção 1: Redeploy Forçado (Recomendado)
```bash
# 1. Parar o serviço
docker service scale sprint-sync_sincronizacao=0

# 2. Aguardar 5 segundos
sleep 5

# 3. Forçar atualização da imagem
docker service update --image easypanel/sprint-sync/sincronizacao:latest sprint-sync_sincronizacao --force

# 4. Reiniciar o serviço
docker service scale sprint-sync_sincronizacao=1
```

#### Opção 2: Comando Único (Mais Rápido)
```bash
cd /etc/easypanel/projects/sprint-sync && \
docker service scale sprint-sync_sincronizacao=0 && \
sleep 5 && \
docker service update --image easypanel/sprint-sync/sincronizacao:latest sprint-sync_sincronizacao --force && \
docker service scale sprint-sync_sincronizacao=1
```

### Verificar Deploy do Serviço de Sincronização

```bash
# Ver status do serviço
docker service ps sprint-sync_sincronizacao

# Ver logs em tempo real
docker service logs -f sprint-sync_sincronizacao

# Ver últimas 100 linhas
docker service logs --tail 100 sprint-sync_sincronizacao

# Filtrar por erros
docker service logs sprint-sync_sincronizacao 2>&1 | grep "❌"
```

---

## 🚀 DEPLOY COMPLETO (BETA + SINCRONIZAÇÃO)

### Script Completo para Executar no Servidor

```bash
#!/bin/bash

echo "🚀 Iniciando deploy completo..."

# 1. DEPLOY BETA
echo "📦 Deploy do Beta..."
cd /etc/easypanel/projects/bi-oficialmed && \
docker service scale bi-oficialmed_app=0 && \
sleep 5 && \
docker service update --image easypanel/bi-oficialmed/app:latest bi-oficialmed_app --force && \
docker service scale bi-oficialmed_app=1 && \
echo "✅ Beta deployado com sucesso!"

# 2. DEPLOY SERVIÇO DE SINCRONIZAÇÃO
echo "📦 Deploy do Serviço de Sincronização..."
cd /etc/easypanel/projects/sprint-sync && \
docker service scale sprint-sync_sincronizacao=0 && \
sleep 5 && \
docker service update --image easypanel/sprint-sync/sincronizacao:latest sprint-sync_sincronizacao --force && \
docker service scale sprint-sync_sincronizacao=1 && \
echo "✅ Serviço de sincronização deployado com sucesso!"

echo "🎉 Deploy completo finalizado!"
```

### Executar o Script

```bash
# Salvar o script acima em um arquivo (ex: deploy-all.sh)
nano deploy-all.sh
# Colar o conteúdo, salvar (Ctrl+O, Enter, Ctrl+X)

# Dar permissão de execução
chmod +x deploy-all.sh

# Executar
./deploy-all.sh
```

---

## 🔍 VERIFICAÇÃO PÓS-DEPLOY

### 1. Verificar Status dos Serviços

```bash
# Listar todos os serviços
docker service ls

# Ver detalhes do Beta
docker service inspect bi-oficialmed_app

# Ver detalhes do Serviço de Sincronização
docker service inspect sprint-sync_sincronizacao
```

### 2. Testar Endpoints

```bash
# Testar Beta (ajustar URL conforme seu domínio)
curl https://beta.oficialmed.com.br/health
# ou
curl https://bi.oficialmed.com.br/health

# Testar Serviço de Sincronização
curl https://sincrocrm.oficialmed.com.br/health
curl https://sincrocrm.oficialmed.com.br/sync/all?trigger=test
```

### 3. Verificar Logs

```bash
# Logs do Beta
docker service logs --tail 50 bi-oficialmed_app

# Logs do Serviço de Sincronização
docker service logs --tail 50 sprint-sync_sincronizacao
```

---

## 🐛 TROUBLESHOOTING

### Problema: Serviço não inicia

```bash
# Verificar erros
docker service ps --no-trunc bi-oficialmed_app
docker service ps --no-trunc sprint-sync_sincronizacao

# Ver logs de erro
docker service logs bi-oficialmed_app 2>&1 | grep -i error
docker service logs sprint-sync_sincronizacao 2>&1 | grep -i error
```

### Problema: Imagem não atualiza

```bash
# Forçar pull da imagem mais recente
docker service update --force --image-pull-policy always bi-oficialmed_app
docker service update --force --image-pull-policy always sprint-sync_sincronizacao
```

### Problema: Serviço fica em "pending"

```bash
# Verificar recursos disponíveis
docker node ls
docker node inspect <node-id>

# Verificar constraints
docker service inspect bi-oficialmed_app | grep -A 10 Constraints
```

---

## 📝 COMANDOS RÁPIDOS (COPIAR E COLAR)

### Deploy Beta
```bash
cd /etc/easypanel/projects/bi-oficialmed && docker service scale bi-oficialmed_app=0 && sleep 5 && docker service update --image easypanel/bi-oficialmed/app:latest bi-oficialmed_app --force && docker service scale bi-oficialmed_app=1
```

### Deploy Serviço de Sincronização
```bash
cd /etc/easypanel/projects/sprint-sync && docker service scale sprint-sync_sincronizacao=0 && sleep 5 && docker service update --image easypanel/sprint-sync/sincronizacao:latest sprint-sync_sincronizacao --force && docker service scale sprint-sync_sincronizacao=1
```

### Ver Logs Beta
```bash
docker service logs -f bi-oficialmed_app
```

### Ver Logs Sincronização
```bash
docker service logs -f sprint-sync_sincronizacao
```

---

## ✅ CHECKLIST DE DEPLOY

- [ ] Conectado ao servidor via SSH
- [ ] Código commitado e pushado no Git
- [ ] EasyPanel detectou o novo commit (ou forçar pull)
- [ ] Deploy do Beta executado
- [ ] Deploy do Serviço de Sincronização executado
- [ ] Verificados logs de ambos os serviços
- [ ] Testados endpoints de health check
- [ ] Verificado funcionamento no navegador (Beta)
- [ ] Testada sincronização manual (Serviço de Sincronização)

---

**Última atualização:** Novembro 2025  
**Ambiente:** EasyPanel / Docker Swarm

