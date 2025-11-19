# 🚨 DEPLOY URGENTE - Funis 32, 34, 38, 41

## ⚠️ PROBLEMA
A API em produção pode não ter a versão mais recente com os funis 32, 34, 38, 41.

## 🔧 SOLUÇÃO IMEDIATA

Execute este comando NO SERVIDOR:

```bash
git clone https://github.com/oficialmedpro/OficialmedPro.git /tmp/sprint-sync-build 2>/dev/null || (cd /tmp/sprint-sync-build && git pull) && \
cd /tmp/sprint-sync-build && \
docker service scale sprint-sync_sincronizacao=0 && \
sleep 5 && \
docker build -f Dockerfile.sync-opportunities-easypanel -t easypanel/sprint-sync/sincronizacao:latest . && \
docker service update --image easypanel/sprint-sync/sincronizacao:latest sprint-sync_sincronizacao --force && \
docker service scale sprint-sync_sincronizacao=1 && \
echo "✅ Deploy concluído!"
```

## ✅ VERIFICAÇÃO

Após o deploy, verifique:

```bash
# Ver logs para confirmar que está processando os funis
docker service logs --tail 100 sprint-sync_sincronizacao | grep "Funil"

# Verificar versão
curl https://sincrocrm.oficialmed.com.br/version

# Verificar se os funis aparecem
curl https://sincrocrm.oficialmed.com.br/health
```

## 📋 FUNIS QUE DEVEM SER PROCESSADOS

- Funil 6: COMERCIAL APUCARANA
- Funil 9: LOGÍSTICA MANIPULAÇÃO  
- Funil 14: RECOMPRA
- **Funil 32: MONITORAMENTO MARKETING** ⚠️ NOVO
- Funil 34: REATIVAÇÃO COMERCIAL
- Funil 38: REATIVAÇÃO COMERCIAL
- **Funil 41: MONITORAMENTO COMERCIAL** ⚠️ NOVO


