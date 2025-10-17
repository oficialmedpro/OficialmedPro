# N8N - Automação de Workflows | Oficial Med 🚀

Este repositório contém a configuração completa para deploy do N8N (ferramenta de automação de workflows) usando Docker Swarm com Traefik como proxy reverso.

## 📁 Arquivos do Projeto

### 🐳 Deploy e Configuração
- **`stack-n8n-oficialmed.yml`** - Stack principal do Docker Swarm para N8N
- **`deploy-n8n.sh`** - Script automatizado de deploy (recomendado)
- **`n8n.env.example`** - Exemplo de variáveis de ambiente para personalização

### 🗄️ Banco de Dados
- **`setup-n8n-database.sql`** - Script SQL para preparar o banco PostgreSQL

### 💾 Backup e Restore
- **`backup-n8n.sh`** - Script automatizado de backup (banco + volume)
- **`restore-n8n.sh`** - Script automatizado de restore

### 📚 Documentação
- **`N8N_SETUP.md`** - Guia completo de configuração e uso
- **`N8N_QUICK_REFERENCE.md`** - Referência rápida de comandos
- **`README-N8N.md`** - Este arquivo (visão geral do projeto)

---

## 🚀 Quick Start

### Pré-requisitos
- Docker Swarm ativo
- PostgreSQL rodando
- Traefik configurado como proxy reverso
- Rede `OficialMed` criada
- DNS configurado para:
  - `workflows.oficialmed.com.br`
  - `webhook.oficialmed.com.br`

### Deploy em 3 Passos

```bash
# 1. Tornar scripts executáveis
chmod +x deploy-n8n.sh backup-n8n.sh restore-n8n.sh

# 2. Executar deploy automatizado
./deploy-n8n.sh

# 3. Acessar a interface
# https://workflows.oficialmed.com.br
# Usuário: admin
# Senha: OfiCialMed2025!
```

---

## 🔗 URLs de Acesso

| Serviço | URL | Descrição |
|---------|-----|-----------|
| **Interface Principal** | https://workflows.oficialmed.com.br | Editor de workflows do N8N |
| **Webhooks** | https://webhook.oficialmed.com.br | Endpoint para webhooks |

---

## 🔐 Credenciais Padrão

```
Usuário: admin
Senha:   OfiCialMed2025!
```

⚠️ **IMPORTANTE**: Altere a senha no primeiro acesso!

---

## 📖 Documentação Detalhada

### Para Setup Completo
Consulte **`N8N_SETUP.md`** para:
- Configuração detalhada
- Integração com outros serviços
- Troubleshooting
- Segurança e boas práticas

### Para Comandos Rápidos
Consulte **`N8N_QUICK_REFERENCE.md`** para:
- Comandos Docker mais usados
- Troubleshooting rápido
- Exemplos de backup/restore
- Integrações comuns

---

## 🛠️ Comandos Essenciais

### Deploy e Gerenciamento
```bash
# Deploy inicial
./deploy-n8n.sh

# Ver logs em tempo real
docker service logs n8n_n8n -f

# Reiniciar serviço
docker service update --force n8n_n8n

# Remover stack
docker stack rm n8n
```

### Backup e Restore
```bash
# Criar backup completo
./backup-n8n.sh

# Restaurar de um backup
./restore-n8n.sh backups/n8n/n8n-backup-completo-YYYYMMDD-HHMMSS.tar.gz
```

### Monitoramento
```bash
# Status dos serviços
docker service ls | grep n8n

# Status detalhado
docker service ps n8n_n8n

# Uso de recursos
docker stats $(docker ps -q -f name=n8n_n8n)
```

---

## 📊 Arquitetura

```
┌─────────────────────────────────────────────────────┐
│                    Internet                         │
└──────────────────────┬──────────────────────────────┘
                       │
                       │ HTTPS (443)
                       │
              ┌────────▼────────┐
              │     Traefik     │
              │  (Proxy Reverso) │
              └─────────────────┘
                       │
         ┌─────────────┴─────────────┐
         │                           │
         │ workflows.oficialmed.com.br  webhook.oficialmed.com.br
         │                           │
         └─────────────┬─────────────┘
                       │
                ┌──────▼──────┐
                │     N8N     │
                │  (Workflows) │
                └──────┬──────┘
                       │
         ┌─────────────┴─────────────┐
         │                           │
    ┌────▼────┐              ┌──────▼──────┐
    │ PostgreSQL│              │ Volume Data │
    │  (Banco)  │              │  (Arquivos) │
    └───────────┘              └─────────────┘
```

---

## 🗃️ Estrutura de Dados

### Banco de Dados PostgreSQL
- **Banco**: `n8n`
- **Usuário**: `postgres`
- **Host**: `postgres:5432`

### Volume Docker
- **Nome**: `n8n_n8n_data`
- **Conteúdo**: Workflows, credenciais, configurações

---

## 🔧 Personalização

### Alterar Configurações

1. **Editar o arquivo YAML**:
```bash
nano stack-n8n-oficialmed.yml
```

2. **Ou usar variáveis de ambiente**:
```bash
# Copiar exemplo
cp n8n.env.example n8n.env

# Editar valores
nano n8n.env

# Referenciar no YAML (adicionar env_file)
```

3. **Aplicar mudanças**:
```bash
docker stack deploy -c stack-n8n-oficialmed.yml n8n
```

### Configurações Comuns

| Variável | Descrição | Padrão |
|----------|-----------|--------|
| `N8N_BASIC_AUTH_USER` | Usuário admin | `admin` |
| `N8N_BASIC_AUTH_PASSWORD` | Senha admin | `OfiCialMed2025!` |
| `EXECUTIONS_DATA_MAX_AGE` | Dias para manter histórico | `336` (14 dias) |
| `N8N_LOG_LEVEL` | Nível de log | `info` |

---

## 🔒 Segurança

### Checklist de Segurança

- [ ] Alterar senha padrão do admin
- [ ] Configurar 2FA (Two-Factor Authentication)
- [ ] Configurar backup automático
- [ ] Limitar acesso via firewall (se necessário)
- [ ] Monitorar logs regularmente
- [ ] Manter N8N atualizado
- [ ] Usar senhas fortes para integrações
- [ ] Revisar permissões de usuários

### Recomendações

1. **Não use autenticação básica em produção** - Configure OAuth2, SAML ou LDAP
2. **Faça backup regular** - Use cron para automatizar `./backup-n8n.sh`
3. **Monitore execuções** - Configure alertas para workflows críticos
4. **Documente workflows** - Adicione descrições e comentários
5. **Teste antes de produção** - Use ambiente de staging

---

## 🔄 Integrações

### Com Typebot (já existe no ambiente)
```javascript
// No Typebot: HTTP Request node
URL: https://webhook.oficialmed.com.br/webhook/[id-do-workflow]
Method: POST
Body: { "lead": "{{variavel}}" }
```

### Com APIs Externas
O N8N tem centenas de integrações pré-prontas:
- Google Sheets, Calendar, Drive
- Slack, Discord, Telegram
- MySQL, PostgreSQL, MongoDB
- Stripe, PayPal
- E muito mais...

---

## 📈 Monitoramento e Logs

### Logs em Tempo Real
```bash
docker service logs n8n_n8n -f
```

### Filtrar Logs
```bash
# Apenas erros
docker service logs n8n_n8n | grep ERROR

# Workflows específicos
docker service logs n8n_n8n | grep "workflow.*123"
```

### Métricas (Opcional)
Para habilitar métricas Prometheus:
```yaml
# Adicionar no YAML
- N8N_METRICS=true
- N8N_METRICS_PORT=9464
```

---

## 🆘 Troubleshooting

### Serviço não inicia
```bash
# Ver logs de erro
docker service logs n8n_n8n --tail 100

# Verificar recursos
docker stats $(docker ps -q -f name=n8n_n8n)
```

### Erro de banco de dados
```bash
# Testar conexão
docker exec -it $(docker ps -q -f name=postgres) psql -U postgres -d n8n -c "SELECT 1;"

# Verificar se banco existe
docker exec -it $(docker ps -q -f name=postgres) psql -U postgres -l | grep n8n
```

### Webhooks não funcionam
```bash
# Testar endpoint
curl -v https://webhook.oficialmed.com.br/

# Verificar DNS
nslookup webhook.oficialmed.com.br

# Ver logs do Traefik
docker service logs traefik | grep webhook
```

### SSL/TLS não funciona
```bash
# Verificar certificados no Traefik
docker service logs traefik | grep -i workflows

# Forçar renovação
docker service update --force traefik
```

---

## 📚 Recursos Adicionais

- 📖 [Documentação Oficial N8N](https://docs.n8n.io/)
- 💬 [Comunidade N8N](https://community.n8n.io/)
- 🎨 [Templates de Workflows](https://n8n.io/workflows/)
- 📺 [Canal YouTube N8N](https://www.youtube.com/@n8n-io)
- 🐛 [GitHub Issues](https://github.com/n8n-io/n8n/issues)

---

## 🔄 Atualizações

### Atualizar N8N

```bash
# 1. Fazer backup
./backup-n8n.sh

# 2. Editar versão no YAML
# image: n8nio/n8n:latest → image: n8nio/n8n:1.xx.x

# 3. Redeploy
docker stack deploy -c stack-n8n-oficialmed.yml n8n

# 4. Verificar
docker service logs n8n_n8n -f
```

### Verificar Versão Atual
```bash
docker service inspect n8n_n8n --format '{{.Spec.TaskTemplate.ContainerSpec.Image}}'
```

---

## 💡 Casos de Uso

### Automações Comuns
1. **Geração de Leads**
   - Captura via Typebot → N8N → CRM

2. **Notificações**
   - Evento → N8N → Slack/Email/WhatsApp

3. **Sincronização de Dados**
   - API A → N8N → API B (transformação)

4. **Processamento de Pedidos**
   - Novo pedido → N8N → Validação → Estoque → Nota Fiscal

5. **Relatórios Automáticos**
   - Cron → N8N → Coleta dados → Gera relatório → Email

---

## 📞 Suporte

### Em caso de problemas:

1. **Consulte a documentação**: `N8N_SETUP.md` e `N8N_QUICK_REFERENCE.md`
2. **Verifique os logs**: `docker service logs n8n_n8n -f`
3. **Comunidade N8N**: https://community.n8n.io/
4. **GitHub Issues**: https://github.com/n8n-io/n8n/issues

---

## 📝 Changelog

### v1.0 - 2025-10-17
- Setup inicial do N8N
- Configuração de domínios workflows e webhook
- Scripts de backup e restore
- Documentação completa

---

## 📄 Licença

N8N é open-source sob licença [Sustainable Use License](https://github.com/n8n-io/n8n/blob/master/LICENSE.md).

Para uso comercial, consulte: https://n8n.io/pricing/

---

## 🎯 Próximos Passos

Após o deploy bem-sucedido:

1. ✅ Acessar https://workflows.oficialmed.com.br
2. ✅ Alterar senha padrão
3. ✅ Criar primeiro workflow de teste
4. ✅ Testar webhook
5. ✅ Configurar backup automático (cron)
6. ✅ Integrar com Typebot (se aplicável)
7. ✅ Documentar workflows principais
8. ✅ Treinar equipe

---

**Desenvolvido para Oficial Med** | Outubro 2025  
**Versão**: 1.0  
**Mantenedor**: [Seu Nome/Equipe]

