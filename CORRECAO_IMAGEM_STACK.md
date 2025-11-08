# 🔧 Correção: Imagem Docker Não Encontrada

## ❌ Problema Identificado

A stack no Portainer está tentando usar:
```
oficialmedpro/oportunidades-sync-api:2a818c2
```

Mas essa imagem não existe no Docker Hub, gerando o erro:
```
No such image: oficialmedpro/oportunidades-sync-api:2a818c2
```

---

## ✅ Solução Rápida

### Opção 1: Usar a Tag `:latest` (RECOMENDADO)

1. **Acesse o Portainer:**
   - Vá em **Stacks**
   - Encontre a stack `oportunidades-sync-sprinthub` (ou nome similar)
   - Clique em **Editor**

2. **Altere a linha da imagem:**
   ```yaml
   # DE:
   image: oficialmedpro/oportunidades-sync-api:2a818c2
   
   # PARA:
   image: oficialmedpro/oportunidades-sync-api:latest
   ```

3. **Salve e atualize:**
   - Clique em **Update the stack**
   - Marque a opção **Pull latest image** (se disponível)
   - Clique em **Update**

---

### Opção 2: Fazer Build e Push da Imagem

Se você realmente precisa da tag `2a818c2`:

```bash
# Build da imagem com a tag específica
docker build -f Dockerfile.sync-opportunities \
  -t oficialmedpro/oportunidades-sync-api:2a818c2 \
  -t oficialmedpro/oportunidades-sync-api:latest \
  .

# Login no Docker Hub
docker login -u oficialmedpro

# Push de ambas as tags
docker push oficialmedpro/oportunidades-sync-api:2a818c2
docker push oficialmedpro/oportunidades-sync-api:latest
```

---

## 🔍 Verificar se a Imagem `:latest` Existe

Antes de atualizar a stack, verifique se a imagem existe:

```bash
# No servidor (se tiver acesso SSH)
docker pull oficialmedpro/oportunidades-sync-api:latest
```

Ou acesse o Docker Hub:
```
https://hub.docker.com/r/oficialmedpro/oportunidades-sync-api/tags
```

---

## 📋 Stack Corrigida (Para Copiar e Colar)

Se quiser usar a stack completa corrigida, use este conteúdo no Editor do Portainer:

```yaml
version: "3.7"

services:
  oportunidades-sync-api:
    image: oficialmedpro/oportunidades-sync-api:latest
    networks:
      - OficialMed
    environment:
      - NODE_ENV=production
      - PORT=5001

      # Supabase (via secrets com NOMES NOVOS)
      - SUPABASE_URL_FILE=/run/secrets/OPP_SUPABASE_URL
      - SUPABASE_KEY_FILE=/run/secrets/OPP_SUPABASE_KEY

      # SprintHub (via secrets com NOMES NOVOS)
      - SPRINTHUB_BASE_URL_FILE=/run/secrets/OPP_SPRINTHUB_BASE_URL
      - SPRINTHUB_INSTANCE_FILE=/run/secrets/OPP_SPRINTHUB_INSTANCE
      - SPRINTHUB_TOKEN_FILE=/run/secrets/OPP_SPRINTHUB_TOKEN

      # API Token (direto, sem secret)
      - API_TOKEN=oportunidades-sync-2025-mN7pQ2rS5tU9wV3xY6zA0bC4dE8fG1hI

    secrets:
      - OPP_SUPABASE_URL
      - OPP_SUPABASE_KEY
      - OPP_SPRINTHUB_BASE_URL
      - OPP_SPRINTHUB_INSTANCE
      - OPP_SPRINTHUB_TOKEN

    deploy:
      mode: replicated
      replicas: 1
      placement:
        constraints:
          - node.role == manager
      resources:
        limits:
          cpus: '1.0'
          memory: 1024M
        reservations:
          cpus: '0.5'
          memory: 512M
      restart_policy:
        condition: on-failure
        delay: 5s
        max_attempts: 3
        window: 120s
      labels:
        - traefik.enable=true

        # Router principal (HTTPS) com PathPrefix
        - traefik.http.routers.oportunidades-sync.rule=Host(`sincro.oficialmed.com.br`) && PathPrefix(`/oportunidades`)
        - traefik.http.routers.oportunidades-sync.entrypoints=websecure
        - traefik.http.routers.oportunidades-sync.tls.certresolver=letsencryptresolver

        # Serviço apontando para a porta 5001 do container
        - traefik.http.services.oportunidades-sync.loadbalancer.server.port=5001
        - traefik.http.services.oportunidades-sync.loadbalancer.passHostHeader=true
        - traefik.http.routers.oportunidades-sync.service=oportunidades-sync

        # Middleware para remover /oportunidades do path
        - traefik.http.routers.oportunidades-sync.middlewares=opp-stripprefix
        - traefik.http.middlewares.opp-stripprefix.stripprefix.prefixes=/oportunidades

        # Redirecionar HTTP -> HTTPS
        - traefik.http.routers.oportunidades-sync-http.rule=Host(`sincro.oficialmed.com.br`) && PathPrefix(`/oportunidades`)
        - traefik.http.routers.oportunidades-sync-http.entrypoints=web
        - traefik.http.routers.oportunidades-sync-http.middlewares=force-https-opp
        - traefik.http.middlewares.force-https-opp.redirectscheme.scheme=https

        # Router dedicado de health (facilita monitorar no Traefik/Portainer)
        - traefik.http.routers.oportunidades-sync-health.rule=Host(`sincro.oficialmed.com.br`) && Path(`/oportunidades/health`)
        - traefik.http.routers.oportunidades-sync-health.entrypoints=websecure
        - traefik.http.routers.oportunidades-sync-health.tls.certresolver=letsencryptresolver
        - traefik.http.routers.oportunidades-sync-health.service=oportunidades-sync

networks:
  OficialMed:
    external: true
    name: OficialMed

secrets:
  OPP_SUPABASE_URL:
    external: true
  OPP_SUPABASE_KEY:
    external: true
  OPP_SPRINTHUB_BASE_URL:
    external: true
  OPP_SPRINTHUB_INSTANCE:
    external: true
  OPP_SPRINTHUB_TOKEN:
    external: true
```

---

## ✅ Passos Finais

1. **Atualizar a stack** no Portainer (mudando `:2a818c2` para `:latest`)
2. **Aguardar o pull** da imagem (pode levar alguns minutos)
3. **Verificar logs** para confirmar que está funcionando:
   ```bash
   docker service logs -f oportunidades-sync-sprinthub_oportunidades-sync-api
   ```
4. **Testar o endpoint:**
   ```bash
   curl https://sincro.oficialmed.com.br/oportunidades/health
   ```

---

## 🐛 Se Ainda Não Funcionar

Se mesmo usando `:latest` não funcionar, pode ser que a imagem ainda não foi publicada. Nesse caso:

1. **Fazer build e push manualmente:**
   ```bash
   docker build -f Dockerfile.sync-opportunities -t oficialmedpro/oportunidades-sync-api:latest .
   docker push oficialmedpro/oportunidades-sync-api:latest
   ```

2. **Ou verificar se há um GitHub Actions configurado** para fazer build automático






