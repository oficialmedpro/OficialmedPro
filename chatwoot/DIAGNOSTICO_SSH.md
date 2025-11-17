# 🔍 Diagnóstico via SSH - Chatwoot EasyPanel

## Comandos para executar no servidor (via SSH)

### 1. Verificar se o container está rodando e acessível

```bash
# Verificar containers do Chatwoot
docker ps | grep chatwoot

# Verificar se o serviço responde na porta 3000 internamente
docker exec chatwoot_chatwoot-chatwoot-web-1 curl -I http://localhost:3000

# Ou testar de fora do container
curl -I http://localhost:3000
```

### 2. Verificar logs do Traefik/EasyPanel

```bash
# Verificar containers do EasyPanel/Traefik
docker ps | grep -E "traefik|easypanel"

# Ver logs do Traefik (se existir)
docker logs $(docker ps -q --filter "name=traefik") --tail 50

# Ou verificar todos os containers relacionados
docker ps -a | grep -E "traefik|proxy|easypanel"
```

### 3. Verificar rede Docker

```bash
# Verificar redes Docker
docker network ls

# Verificar qual rede o chatwoot-web está usando
docker inspect chatwoot_chatwoot-chatwoot-web-1 | grep -A 10 Networks

# Verificar se o Traefik está na mesma rede
docker network inspect <nome-da-rede-do-traefik>
```

### 4. Testar conectividade interna

```bash
# Testar se consegue acessar o chatwoot-web de dentro da rede
docker run --rm --network <nome-da-rede> curlimages/curl:latest curl -I http://chatwoot_chatwoot-chatwoot-web-1:3000

# Ou usar o nome do serviço do compose
docker run --rm --network <nome-da-rede> curlimages/curl:latest curl -I http://chatwoot-web:3000
```

### 5. Verificar configuração do domínio no EasyPanel

```bash
# Verificar arquivos de configuração do EasyPanel (se acessível)
ls -la /etc/easypanel/projects/chatwoot/

# Verificar docker-compose usado pelo EasyPanel
cat /etc/easypanel/projects/chatwoot/chatwoot/code/docker-compose.yml
```

### 6. Verificar se há algum proxy/nginx intermediário

```bash
# Verificar processos na porta 80 e 443
netstat -tulpn | grep -E ":80|:443"

# Verificar se há nginx rodando
docker ps | grep nginx
ps aux | grep nginx
```

### 7. Verificar logs do chatwoot-web

```bash
# Ver logs recentes do chatwoot-web
docker logs chatwoot_chatwoot-chatwoot-web-1 --tail 100

# Verificar se há erros de conexão
docker logs chatwoot_chatwoot-chatwoot-web-1 | grep -i error
```

### 8. Testar acesso direto ao IP

```bash
# Testar se o serviço responde no IP do servidor
curl -I http://72.60.61.40:3000

# Verificar se a porta 3000 está aberta
netstat -tulpn | grep 3000
```

## 🎯 Comandos Prioritários

Execute estes primeiro:

```bash
# 1. Verificar containers
docker ps | grep chatwoot

# 2. Testar acesso interno
docker exec chatwoot_chatwoot-chatwoot-web-1 curl -I http://localhost:3000

# 3. Verificar rede
docker inspect chatwoot_chatwoot-chatwoot-web-1 | grep -A 20 Networks

# 4. Ver logs do Traefik
docker ps | grep traefik
docker logs <container-id-traefik> --tail 100
```

