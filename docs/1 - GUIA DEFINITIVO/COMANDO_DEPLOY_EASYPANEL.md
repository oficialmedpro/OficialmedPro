# 🚀 Comando de Deploy - EasyPanel (Build Local)

## Comando Completo

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

## Comando em Uma Linha (para copiar/colar)

```bash
git clone https://github.com/oficialmedpro/OficialmedPro.git /tmp/sprint-sync-build 2>/dev/null || (cd /tmp/sprint-sync-build && git pull) && cd /tmp/sprint-sync-build && docker service scale sprint-sync_sincronizacao=0 && sleep 5 && docker build -f Dockerfile.sync-opportunities-easypanel -t easypanel/sprint-sync/sincronizacao:latest . && docker service update --image easypanel/sprint-sync/sincronizacao:latest sprint-sync_sincronizacao --force && docker service scale sprint-sync_sincronizacao=1 && echo "✅ Deploy concluído!"
```

## O Que o Comando Faz

1. **Clona ou atualiza o repositório** em `/tmp/sprint-sync-build`
2. **Entra no diretório** do repositório
3. **Para o serviço** (`sprint-sync_sincronizacao`)
4. **Aguarda 5 segundos** para garantir que o serviço parou
5. **Faz build da imagem Docker** usando `Dockerfile.sync-opportunities-easypanel`
6. **Atualiza o serviço** com a nova imagem
7. **Inicia o serviço** novamente

## Verificação Após Deploy

```bash
# Verificar status do serviço
docker service ps sprint-sync_sincronizacao

# Ver logs (últimas 50 linhas)
docker service logs --tail 50 sprint-sync_sincronizacao

# Testar health check
curl https://sincrocrm.oficialmed.com.br/health

# Testar versão
curl https://sincrocrm.oficialmed.com.br/version
```

## Limpeza (Opcional)

Após confirmar que está funcionando, pode limpar o diretório temporário:

```bash
rm -rf /tmp/sprint-sync-build
```



