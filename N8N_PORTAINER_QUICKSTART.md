# N8N Deploy Portainer - Quick Start 🚀

## 📋 Resumo Ultra-Rápido

### ⏱️ Tempo estimado: 10 minutos

```
┌─────────────────────────────────────────────────┐
│  PASSO 1: Criar Banco de Dados (2 min)         │
│  ↓                                              │
│  PASSO 2: Adicionar Stack no Portainer (3 min) │
│  ↓                                              │
│  PASSO 3: Aguardar Inicialização (3 min)       │
│  ↓                                              │
│  PASSO 4: Acessar e Configurar (2 min)         │
│  ↓                                              │
│  ✅ PRONTO!                                     │
└─────────────────────────────────────────────────┘
```

---

## 🎯 PASSO 1: Criar Banco (2 minutos)

### No Portainer:

1. **Containers** → Clique no container **postgres**
2. **Console** → Selecione **/bin/bash** → **Connect**
3. Digite e execute:

```bash
psql -U postgres
CREATE DATABASE n8n;
\q
exit
```

✅ **Pronto!** Banco criado.

---

## 🎯 PASSO 2: Adicionar Stack (3 minutos)

### No Portainer:

1. **Stacks** → **+ Add stack**
2. **Name**: `n8n`
3. **Web editor**: Cole o YAML abaixo
4. **Deploy the stack**

### 📋 YAML para colar:

<details>
<summary>👉 Clique para ver o YAML completo</summary>

```yaml
version: "3.7"
services:
  n8n:
    image: n8nio/n8n:latest
    networks:
      - OficialMed
    environment:
      - DB_TYPE=postgresdb
      - DB_POSTGRESDB_HOST=postgres
      - DB_POSTGRESDB_PORT=5432
      - DB_POSTGRESDB_DATABASE=n8n
      - DB_POSTGRESDB_USER=postgres
      - DB_POSTGRESDB_PASSWORD=a5895d0e44e68fc82c13e7d6a92313dd
      - N8N_ENCRYPTION_KEY=83d8442f4011a5908b9bc882520d3352a1b2c3d4e5f6g7h8
      - N8N_HOST=workflows.oficialmed.com.br
      - N8N_PROTOCOL=https
      - N8N_PORT=5678
      - WEBHOOK_URL=https://webhook.oficialmed.com.br/
      - N8N_BASIC_AUTH_ACTIVE=true
      - N8N_BASIC_AUTH_USER=admin
      - N8N_BASIC_AUTH_PASSWORD=OfiCialMed2025!
      - N8N_EMAIL_MODE=smtp
      - N8N_SMTP_HOST=smtp.gmail.com
      - N8N_SMTP_PORT=465
      - N8N_SMTP_USER=mkt.oficialmed@gmail.com
      - N8N_SMTP_PASS=Joao1633@@
      - N8N_SMTP_SENDER=mkt.oficialmed@gmail.com
      - N8N_SMTP_SSL=true
      - N8N_DIAGNOSTICS_ENABLED=false
      - N8N_PERSONALIZATION_ENABLED=true
      - N8N_VERSION_NOTIFICATIONS_ENABLED=true
      - N8N_TEMPLATES_ENABLED=true
      - N8N_LOG_LEVEL=info
      - N8N_LOG_OUTPUT=console
      - EXECUTIONS_DATA_SAVE_ON_ERROR=all
      - EXECUTIONS_DATA_SAVE_ON_SUCCESS=all
      - EXECUTIONS_DATA_SAVE_MANUAL_EXECUTIONS=true
      - EXECUTIONS_DATA_PRUNE=true
      - EXECUTIONS_DATA_MAX_AGE=336
      - GENERIC_TIMEZONE=America/Sao_Paulo
      - TZ=America/Sao_Paulo
    volumes:
      - n8n_data:/home/node/.n8n
    deploy:
      mode: replicated
      replicas: 1
      placement:
        constraints:
          - node.role == manager
      resources:
        limits:
          cpus: "2"
          memory: 2048M
      labels:
        - io.portainer.accesscontrol.users=admin
        - traefik.enable=true
        - traefik.http.routers.n8n_editor.rule=Host(`workflows.oficialmed.com.br`)
        - traefik.http.routers.n8n_editor.entrypoints=websecure
        - traefik.http.routers.n8n_editor.tls.certresolver=letsencryptresolver
        - traefik.http.services.n8n_editor.loadbalancer.server.port=5678
        - traefik.http.services.n8n_editor.loadbalancer.passHostHeader=true
        - traefik.http.routers.n8n_editor.service=n8n_editor
        - traefik.http.routers.n8n_webhook.rule=Host(`webhook.oficialmed.com.br`)
        - traefik.http.routers.n8n_webhook.entrypoints=websecure
        - traefik.http.routers.n8n_webhook.tls.certresolver=letsencryptresolver
        - traefik.http.routers.n8n_webhook.service=n8n_webhook
        - traefik.http.services.n8n_webhook.loadbalancer.server.port=5678

volumes:
  n8n_data:
    driver: local

networks:
  OficialMed:
    external: true
    name: OficialMed
```

</details>

✅ **Pronto!** Stack criada.

---

## 🎯 PASSO 3: Aguardar (3 minutos)

### No Portainer:

1. **Services** → Procure **n8n_n8n**
2. Aguarde até mostrar **1/1** (1 réplica ativa)
3. **Service logs** → Verifique se aparece:
   ```
   n8n ready on 0.0.0.0, port 5678
   ```

✅ **Pronto!** N8N inicializado.

---

## 🎯 PASSO 4: Acessar (2 minutos)

### No Navegador:

1. Acesse: **https://workflows.oficialmed.com.br**
2. Login:
   ```
   Usuário: admin
   Senha: OfiCialMed2025!
   ```
3. **⚠️ Altere a senha** imediatamente!

✅ **PRONTO!** N8N funcionando! 🎉

---

## 🔍 Verificação Rápida

### ✅ Checklist:

```
[ ] Stack "n8n" aparece em Stacks (status: active)
[ ] Serviço "n8n_n8n" mostra 1/1 em Services
[ ] Logs não mostram erros críticos
[ ] URL https://workflows.oficialmed.com.br abre
[ ] Login funciona
[ ] Senha foi alterada
```

---

## 🆘 Troubleshooting Rápido

### ❌ Stack não inicia:
```
Portainer → Stacks → n8n → Logs
Procure por erros em vermelho
```

### ❌ Não consigo acessar URL:
```
1. Verifique DNS: nslookup workflows.oficialmed.com.br
2. Aguarde 2-3 min para certificado SSL
3. Verifique Traefik: Services → traefik → Logs
```

### ❌ Erro de banco de dados:
```
Portainer → Containers → postgres → Console
psql -U postgres
\l
(verifique se "n8n" aparece na lista)
\q
```

---

## 📱 URLs Importantes

| O quê | URL |
|-------|-----|
| **N8N Interface** | https://workflows.oficialmed.com.br |
| **Webhooks** | https://webhook.oficialmed.com.br |
| **Portainer** | https://seu-portainer.com.br |
| **Documentação** | Arquivo: `N8N_DEPLOY_PORTAINER.md` |

---

## 🎓 Depois de Configurar

### Primeiros passos no N8N:

1. **Criar workflow de teste**:
   - New → Adicionar "Schedule Trigger"
   - Adicionar "Set" → Executar

2. **Testar webhook**:
   - New → Adicionar "Webhook"
   - Copiar URL → Testar com curl ou Postman

3. **Explorar templates**:
   - Menu Templates → Escolher → Import

4. **Integrar com Typebot**:
   - N8N: Criar webhook
   - Typebot: HTTP Request → URL do webhook N8N

---

## 📚 Documentação Completa

- 📘 **Setup detalhado**: `N8N_DEPLOY_PORTAINER.md`
- 📗 **Configuração geral**: `N8N_SETUP.md`
- 📙 **Comandos rápidos**: `N8N_QUICK_REFERENCE.md`
- 📕 **Visão geral**: `README-N8N.md`

---

## 💡 Dicas Importantes

### ⚠️ O que NÃO fazer:

❌ Não altere a `N8N_ENCRYPTION_KEY` após primeiro deploy  
❌ Não delete o volume `n8n_data` sem backup  
❌ Não use a senha padrão em produção  
❌ Não esqueça de fazer backup regular  

### ✅ O que fazer:

✅ Altere senha no primeiro acesso  
✅ Configure backup automático  
✅ Documente seus workflows  
✅ Monitore os logs regularmente  
✅ Teste restore periodicamente  

---

## 📞 Precisa de Ajuda?

1. **Leia primeiro**: `N8N_DEPLOY_PORTAINER.md` (guia completo)
2. **Verifique logs**: Portainer → Services → n8n_n8n → Logs
3. **Comunidade**: https://community.n8n.io/
4. **Documentação**: https://docs.n8n.io/

---

**Quick Start criado para Oficial Med** | Outubro 2025  
**⏱️ Tempo total: ~10 minutos** | **🎯 100% via Portainer**

