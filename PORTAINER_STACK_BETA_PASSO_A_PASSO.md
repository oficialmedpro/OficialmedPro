# 🚀 Deploy Stack Beta no Portainer - Passo a Passo

## ❌ Problema Identificado
O Portainer não suporta `build` com URL Git diretamente em stacks. Vamos usar uma abordagem diferente.

## ✅ Solução: Build Manual + Stack

### **PASSO 1: Fazer Build da Imagem**

1. **Acesse o Portainer**
2. Vá para **Images** (Imagens)
3. Clique em **"Build a new image"**
4. Configure:
   ```
   Build method: Git Repository
   Repository URL: https://github.com/oficialmedpro/OficialmedPro.git
   Reference: main
   Dockerfile path: Dockerfile.portainer
   Image name: bi-beta:latest
   ```
5. Clique em **"Build the image"**
6. Aguarde o build terminar (pode demorar alguns minutos)

### **PASSO 2: Criar a Stack**

1. Vá para **Stacks**
2. Clique em **"Add stack"**
3. Nome: `bi-beta-stack`
4. Cole o conteúdo do arquivo `stack-beta-git.yml`
5. Clique em **"Deploy the stack"**

### **PASSO 3: Verificar**

1. Vá para **Containers**
2. Verifique se o container `bi-beta` está rodando
3. Acesse `https://beta.oficialmed.com.br`

## 🔧 Alternativa: Stack Simplificada

Se o build não funcionar, use esta stack simplificada:

```yaml
version: "3.7"

services:
  bi-beta:
    image: bi-beta:latest
    networks:
      - OficialMed
    
    environment:
      - VITE_SUPABASE_URL_FILE=/run/secrets/VITE_SUPABASE_URL
      - VITE_SUPABASE_SERVICE_ROLE_KEY_FILE=/run/secrets/VITE_SUPABASE_SERVICE_ROLE_KEY
      - VITE_SUPABASE_SCHEMA_FILE=/run/secrets/VITE_SUPABASE_SCHEMA

    secrets:
      - VITE_SUPABASE_URL
      - VITE_SUPABASE_SERVICE_ROLE_KEY
      - VITE_SUPABASE_SCHEMA
    
    deploy:
      mode: replicated
      replicas: 1
      placement:
        constraints:
          - node.role == manager
      labels:
        - traefik.enable=true
        - traefik.http.routers.bi-beta.rule=Host(`beta.oficialmed.com.br`)
        - traefik.http.routers.bi-beta.entrypoints=websecure
        - traefik.http.routers.bi-beta.tls.certresolver=letsencryptresolver
        - traefik.http.services.bi-beta.loadbalancer.server.port=80
        - traefik.http.services.bi-beta.loadbalancer.passHostHeader=true
        - traefik.http.routers.bi-beta.service=bi-beta

networks:
  OficialMed:
    external: true
    name: OficialMed
    
secrets:
  VITE_SUPABASE_URL:
    external: true
  VITE_SUPABASE_SERVICE_ROLE_KEY:
    external: true
  VITE_SUPABASE_SCHEMA:
    external: true
```

## 🎯 Próximo Passo

**Vamos começar pelo PASSO 1 - Build da Imagem!**

Me confirme quando estiver na tela de "Build a new image" no Portainer.

