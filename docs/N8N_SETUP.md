# Configuração N8N - Oficial Med

## 📋 Pré-requisitos

1. Docker Swarm configurado
2. Traefik configurado como proxy reverso
3. PostgreSQL rodando (mesma instância do Typebot)
4. Rede `OficialMed` criada
5. DNS configurado para:
   - `workflows.oficialmed.com.br` → IP do servidor
   - `webhook.oficialmed.com.br` → IP do servidor

## 🗄️ Preparação do Banco de Dados

Antes de fazer o deploy, você precisa criar o banco de dados para o n8n:

```sql
-- Conecte no PostgreSQL e execute:
CREATE DATABASE n8n;
```

## 🚀 Deploy da Stack

1. **Fazer o deploy:**
   ```bash
   docker stack deploy -c stack-n8n-oficialmed.yml n8n
   ```

2. **Verificar se está rodando:**
   ```bash
   docker service ls | grep n8n
   docker service logs n8n_n8n -f
   ```

3. **Aguardar a inicialização:**
   - Aguarde alguns minutos para o n8n inicializar completamente
   - O primeiro acesso pode demorar um pouco mais

## 🔐 Primeiro Acesso

### Credenciais Padrão:
- **URL:** https://workflows.oficialmed.com.br
- **Usuário:** `admin`
- **Senha:** `OfiCialMed2025!`

⚠️ **IMPORTANTE:** Altere a senha no primeiro acesso!

## 🔧 Configurações Importantes

### URLs Configuradas:
- **Interface Principal:** https://workflows.oficialmed.com.br
- **Webhooks:** https://webhook.oficialmed.com.br/

### Chave de Criptografia:
A chave de criptografia é usada para proteger credenciais sensíveis. **NÃO ALTERE** após o primeiro deploy:
```
N8N_ENCRYPTION_KEY=83d8442f4011a5908b9bc882520d3352a1b2c3d4e5f6g7h8
```

### Autenticação Básica:
Por padrão, está ativa a autenticação básica. Para usar outros métodos:
- OAuth2
- LDAP
- SAML

Consulte: https://docs.n8n.io/hosting/authentication/

## 📧 Configuração SMTP

O SMTP está configurado para usar o Gmail da Oficial Med:
- Notificações de erros nos workflows
- Alertas de execução
- Convites de usuários

## 🔄 Recursos e Limites

### Recursos Alocados:
- **CPU:** 2 núcleos
- **Memória:** 2GB RAM

### Execuções:
- Salva execuções com sucesso e erro
- Mantém histórico por 14 dias
- Execuções manuais também são salvas

## 🌐 Usando Webhooks

Para criar webhooks em seus workflows:

1. Adicione um nó "Webhook" no seu workflow
2. O n8n irá gerar URLs automaticamente usando `webhook.oficialmed.com.br`
3. Exemplos de URLs geradas:
   ```
   https://webhook.oficialmed.com.br/webhook/seu-workflow-id
   https://webhook.oficialmed.com.br/webhook-test/seu-workflow-id
   ```

## 🔍 Monitoramento e Logs

### Ver logs em tempo real:
```bash
docker service logs n8n_n8n -f
```

### Ver status do serviço:
```bash
docker service ps n8n_n8n
```

### Ver configurações do serviço:
```bash
docker service inspect n8n_n8n --pretty
```

## 🛠️ Comandos Úteis

### Atualizar a stack:
```bash
docker stack deploy -c stack-n8n-oficialmed.yml n8n
```

### Reiniciar o serviço:
```bash
docker service update --force n8n_n8n
```

### Escalar (adicionar mais réplicas):
```bash
docker service scale n8n_n8n=2
```

### Remover a stack:
```bash
docker stack rm n8n
```

## 📊 Backup

### Backup do Volume:
```bash
# Criar backup do volume de dados
docker run --rm -v n8n_n8n_data:/data -v $(pwd):/backup ubuntu tar czf /backup/n8n-backup-$(date +%Y%m%d).tar.gz /data
```

### Backup do Banco de Dados:
```bash
# Backup do banco PostgreSQL
docker exec -t postgres pg_dump -U postgres n8n > n8n-db-backup-$(date +%Y%m%d).sql
```

## 🔒 Segurança

### Recomendações:

1. **Altere as credenciais padrão** imediatamente após o primeiro acesso
2. **Configure 2FA** para usuários administrativos
3. **Limite o acesso** à interface principal via firewall se necessário
4. **Monitore os logs** regularmente para detectar atividades suspeitas
5. **Mantenha backups** regulares do banco de dados e do volume

### Desabilitar Autenticação Básica (após configurar OAuth):

Remova ou comente estas linhas no YAML:
```yaml
# - N8N_BASIC_AUTH_ACTIVE=true
# - N8N_BASIC_AUTH_USER=admin
# - N8N_BASIC_AUTH_PASSWORD=OfiCialMed2025!
```

## 🚨 Solução de Problemas

### Serviço não inicia:
```bash
# Verificar logs de erro
docker service logs n8n_n8n --tail 100

# Verificar se o banco de dados existe
docker exec -it postgres psql -U postgres -c "\l" | grep n8n
```

### Erro de conexão com banco de dados:
```bash
# Testar conexão com PostgreSQL
docker exec -it postgres psql -U postgres -d n8n -c "SELECT 1;"
```

### Certificado SSL não funciona:
```bash
# Verificar configuração do Traefik
docker service logs traefik | grep -i "workflows.oficialmed.com.br"
docker service logs traefik | grep -i "webhook.oficialmed.com.br"
```

### Webhooks não funcionam:
1. Verifique se o DNS de `webhook.oficialmed.com.br` está correto
2. Teste o webhook diretamente: `curl https://webhook.oficialmed.com.br/`
3. Verifique os logs do n8n para erros relacionados a webhooks

## 📚 Recursos Adicionais

- **Documentação Oficial:** https://docs.n8n.io/
- **Comunidade:** https://community.n8n.io/
- **Templates:** https://n8n.io/workflows/
- **GitHub:** https://github.com/n8n-io/n8n

## 🔄 Integração com Typebot

O n8n pode ser integrado com o Typebot existente:

1. No n8n, use o nó "HTTP Request" para fazer chamadas ao Typebot
2. No Typebot, use webhooks do n8n para disparar workflows
3. Exemplo de integração: Typebot captura lead → dispara webhook n8n → n8n processa e envia para CRM

## 📈 Próximos Passos

1. ✅ Acessar a interface em https://workflows.oficialmed.com.br
2. ✅ Alterar as credenciais padrão
3. ✅ Configurar seu primeiro workflow
4. ✅ Testar webhooks
5. ✅ Configurar notificações por email
6. ✅ Criar backup schedule
7. ✅ Documentar workflows principais da empresa

