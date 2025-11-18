# N8N - Referência Rápida 🚀

## 🔗 URLs de Acesso
```
Interface Principal: https://workflows.oficialmed.com.br
Webhooks:           https://webhook.oficialmed.com.br
```

## 🔐 Credenciais Padrão
```
Usuário: admin
Senha:   OfiCialMed2025!
```
⚠️ **Altere no primeiro acesso!**

---

## 📦 Deploy e Gerenciamento

### Deploy Inicial
```bash
# Opção 1: Usando o script automatizado
chmod +x deploy-n8n.sh
./deploy-n8n.sh

# Opção 2: Deploy manual
docker stack deploy -c stack-n8n-oficialmed.yml n8n
```

### Comandos Essenciais
```bash
# Ver serviços rodando
docker service ls | grep n8n

# Ver status detalhado
docker service ps n8n_n8n

# Ver logs em tempo real
docker service logs n8n_n8n -f

# Ver últimas 100 linhas de log
docker service logs n8n_n8n --tail 100

# Reiniciar serviço
docker service update --force n8n_n8n

# Escalar (aumentar réplicas)
docker service scale n8n_n8n=2

# Atualizar stack (após modificar YAML)
docker stack deploy -c stack-n8n-oficialmed.yml n8n

# Remover stack completamente
docker stack rm n8n
```

---

## 🗄️ Banco de Dados

### Criar Banco
```bash
# Executar script SQL
docker exec -i $(docker ps -q -f name=postgres) psql -U postgres < setup-n8n-database.sql

# Ou manualmente
docker exec -it $(docker ps -q -f name=postgres) psql -U postgres
CREATE DATABASE n8n;
\c n8n
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
\q
```

### Verificar Banco
```bash
# Listar bancos
docker exec -it $(docker ps -q -f name=postgres) psql -U postgres -c "\l"

# Verificar tabelas do n8n
docker exec -it $(docker ps -q -f name=postgres) psql -U postgres -d n8n -c "\dt"

# Ver tamanho do banco
docker exec -it $(docker ps -q -f name=postgres) psql -U postgres -c "SELECT pg_size_pretty(pg_database_size('n8n'));"
```

---

## 💾 Backup e Restore

### Backup Completo
```bash
# Backup do banco de dados
docker exec -t $(docker ps -q -f name=postgres) pg_dump -U postgres n8n > backup-n8n-db-$(date +%Y%m%d-%H%M%S).sql

# Backup do volume de dados
docker run --rm -v n8n_n8n_data:/data -v $(pwd):/backup ubuntu tar czf /backup/backup-n8n-data-$(date +%Y%m%d-%H%M%S).tar.gz -C /data .
```

### Restore
```bash
# Restore do banco de dados
cat backup-n8n-db-20251017-120000.sql | docker exec -i $(docker ps -q -f name=postgres) psql -U postgres -d n8n

# Restore do volume
docker run --rm -v n8n_n8n_data:/data -v $(pwd):/backup ubuntu tar xzf /backup/backup-n8n-data-20251017-120000.tar.gz -C /data
```

---

## 🔧 Troubleshooting

### Serviço não inicia
```bash
# Ver logs de erro
docker service logs n8n_n8n --tail 200

# Verificar se o banco existe
docker exec -it $(docker ps -q -f name=postgres) psql -U postgres -l | grep n8n

# Verificar conexão do container
docker exec -it $(docker ps -q -f name=n8n_n8n) ping -c 3 postgres
```

### Erro de memória
```bash
# Ver uso de recursos
docker stats $(docker ps -q -f name=n8n_n8n)

# Aumentar limite de memória (editar YAML)
# Mudar de 2048M para 4096M e fazer redeploy
```

### Erro SSL/TLS
```bash
# Ver logs do Traefik
docker service logs traefik | grep -i workflows
docker service logs traefik | grep -i webhook

# Forçar renovação de certificado
docker exec -it $(docker ps -q -f name=traefik) traefik healthcheck
```

### Webhooks não funcionam
```bash
# Testar webhook diretamente
curl -v https://webhook.oficialmed.com.br/

# Verificar DNS
nslookup webhook.oficialmed.com.br

# Ver configuração do serviço
docker service inspect n8n_n8n --pretty | grep -A5 webhook
```

### Limpar dados antigos
```bash
# Conectar ao banco e limpar execuções antigas
docker exec -it $(docker ps -q -f name=postgres) psql -U postgres -d n8n

-- Ver execuções antigas
SELECT COUNT(*) FROM execution_entity WHERE "startedAt" < NOW() - INTERVAL '30 days';

-- Deletar execuções com mais de 30 dias
DELETE FROM execution_entity WHERE "startedAt" < NOW() - INTERVAL '30 days';

\q
```

---

## 📊 Monitoramento

### Verificar saúde do serviço
```bash
# Status geral
docker service ps n8n_n8n

# Uso de recursos
docker stats $(docker ps -q -f name=n8n_n8n) --no-stream

# Uptime do container
docker ps -f name=n8n_n8n --format "table {{.Names}}\t{{.Status}}"
```

### Logs estruturados
```bash
# Filtrar por nível de log
docker service logs n8n_n8n | grep ERROR
docker service logs n8n_n8n | grep WARN
docker service logs n8n_n8n | grep INFO

# Logs de um workflow específico
docker service logs n8n_n8n | grep "workflow.*123"
```

---

## 🔄 Atualização de Versão

### Atualizar para nova versão
```bash
# 1. Fazer backup primeiro!
./backup-n8n.sh

# 2. Editar stack-n8n-oficialmed.yml
# Mudar: image: n8nio/n8n:latest
# Para:  image: n8nio/n8n:1.xx.x

# 3. Fazer redeploy
docker stack deploy -c stack-n8n-oficialmed.yml n8n

# 4. Verificar logs
docker service logs n8n_n8n -f

# 5. Testar acesso
curl -I https://workflows.oficialmed.com.br
```

---

## 🔒 Segurança

### Alterar senha do admin
```bash
# Conectar ao banco
docker exec -it $(docker ps -q -f name=postgres) psql -U postgres -d n8n

-- Ver usuários
SELECT id, email, "firstName", "lastName" FROM "user";

-- Resetar senha (será solicitado no próximo login)
UPDATE "user" SET password = NULL WHERE email = 'admin';

\q
```

### Desabilitar autenticação básica
```yaml
# Editar stack-n8n-oficialmed.yml e comentar:
# - N8N_BASIC_AUTH_ACTIVE=true
# - N8N_BASIC_AUTH_USER=admin
# - N8N_BASIC_AUTH_PASSWORD=OfiCialMed2025!

# Fazer redeploy
docker stack deploy -c stack-n8n-oficialmed.yml n8n
```

---

## 📱 Integrações Comuns

### Webhook de exemplo
```javascript
// Criar um workflow com nó Webhook
// URL gerada: https://webhook.oficialmed.com.br/webhook/[id-do-workflow]

// Testar com curl
curl -X POST https://webhook.oficialmed.com.br/webhook/[id-do-workflow] \
  -H "Content-Type: application/json" \
  -d '{"teste": "dados"}'
```

### Integração com Typebot
```javascript
// No Typebot: usar HTTP Request para chamar webhook do n8n
// URL: https://webhook.oficialmed.com.br/webhook/[id]
// Method: POST
// Body: {{variavel_do_typebot}}
```

---

## 📚 Links Úteis

- 📖 Documentação: https://docs.n8n.io/
- 💬 Comunidade: https://community.n8n.io/
- 🎨 Templates: https://n8n.io/workflows/
- 🐛 Issues: https://github.com/n8n-io/n8n/issues
- 📺 Tutoriais: https://www.youtube.com/@n8n-io

---

## 🆘 Suporte

### Resetar completamente (⚠️ CUIDADO!)
```bash
# 1. Fazer backup antes!
# 2. Remover stack
docker stack rm n8n

# 3. Aguardar remoção
sleep 30

# 4. Remover volume (⚠️ PERDE TODOS OS DADOS!)
docker volume rm n8n_n8n_data

# 5. Dropar banco (⚠️ PERDE TODOS OS DADOS!)
docker exec -it $(docker ps -q -f name=postgres) psql -U postgres -c "DROP DATABASE n8n;"

# 6. Recriar tudo
./deploy-n8n.sh
```

---

## ✅ Checklist Pós-Deploy

- [ ] Acessar https://workflows.oficialmed.com.br
- [ ] Alterar senha padrão
- [ ] Criar primeiro workflow de teste
- [ ] Testar webhook
- [ ] Configurar notificações email
- [ ] Agendar backup automático
- [ ] Documentar workflows principais
- [ ] Configurar monitoramento
- [ ] Testar integração com Typebot (se aplicável)
- [ ] Configurar usuários adicionais

---

**Criado em:** Outubro 2025  
**Versão:** 1.0  
**Projeto:** Oficial Med

