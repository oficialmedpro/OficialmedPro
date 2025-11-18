# ✅ Checklist Deploy N8N via Portainer

Imprima ou mantenha este arquivo aberto enquanto faz o deploy!

---

## 📋 PRÉ-REQUISITOS

Verifique antes de começar:

```
[ ] Portainer está acessível e funcionando
[ ] PostgreSQL está rodando (mesmo do Typebot)
[ ] Traefik está configurado e rodando
[ ] Rede "OficialMed" existe
[ ] DNS configurado:
    [ ] workflows.oficialmed.com.br → IP do servidor
    [ ] webhook.oficialmed.com.br → IP do servidor
[ ] Você tem acesso admin no Portainer
```

---

## 🗄️ ETAPA 1: CRIAR BANCO DE DADOS

### 1.1 - Acessar PostgreSQL
```
[ ] Abrir Portainer
[ ] Clicar em "Containers"
[ ] Localizar container "postgres"
[ ] Clicar no nome do container
```

### 1.2 - Abrir Console
```
[ ] Clicar em "Console" (ícone >_)
[ ] Selecionar "/bin/bash" no dropdown
[ ] Clicar em "Connect"
```

### 1.3 - Criar Banco
```
[ ] Digitar: psql -U postgres
[ ] Digitar: CREATE DATABASE n8n;
[ ] Verificar mensagem: "CREATE DATABASE"
[ ] Digitar: \l (para listar bancos)
[ ] Confirmar que "n8n" aparece na lista
[ ] Digitar: \q (para sair)
[ ] Digitar: exit (para fechar console)
```

**✅ CHECKPOINT 1**: Banco de dados criado com sucesso

---

## 🐳 ETAPA 2: ADICIONAR STACK

### 2.1 - Acessar Stacks
```
[ ] No menu lateral, clicar em "Stacks"
[ ] Clicar no botão "+ Add stack"
```

### 2.2 - Configurar Stack
```
[ ] Name: digitar "n8n"
[ ] Build method: selecionar "Web editor"
[ ] Copiar YAML do arquivo "stack-n8n-oficialmed.yml"
[ ] Colar no editor do Portainer
```

### 2.3 - Revisar Configurações
```
[ ] Verificar: DB_POSTGRESDB_HOST=postgres
[ ] Verificar: DB_POSTGRESDB_DATABASE=n8n
[ ] Verificar: N8N_HOST=workflows.oficialmed.com.br
[ ] Verificar: WEBHOOK_URL=https://webhook.oficialmed.com.br/
[ ] Verificar: networks → OficialMed
```

### 2.4 - Deploy
```
[ ] Rolar até o final da página
[ ] Clicar em "Deploy the stack"
[ ] Aguardar mensagem de sucesso
[ ] Anotar hora do deploy: ___:___
```

**✅ CHECKPOINT 2**: Stack adicionada com sucesso

---

## ⏱️ ETAPA 3: AGUARDAR INICIALIZAÇÃO

### 3.1 - Verificar Stack
```
[ ] Em "Stacks", verificar se "n8n" aparece
[ ] Status deve ser "active" (verde)
[ ] Anotar: ______ (ok/problema)
```

### 3.2 - Verificar Serviço
```
[ ] Clicar no menu "Services"
[ ] Localizar "n8n_n8n"
[ ] Verificar réplicas: deve mostrar "1/1"
[ ] Se mostrar "0/1", aguardar mais 1-2 minutos
[ ] Status: ______ (ok/aguardando/erro)
```

### 3.3 - Verificar Logs
```
[ ] Clicar em "n8n_n8n"
[ ] Clicar em "Service logs"
[ ] Marcar "Auto-refresh logs"
[ ] Aguardar mensagem: "n8n ready on 0.0.0.0, port 5678"
[ ] Verificar se há erros (linhas vermelhas)
[ ] Logs ok? ______ (sim/não)
```

**✅ CHECKPOINT 3**: Serviço iniciado e rodando

---

## 🌐 ETAPA 4: ACESSAR N8N

### 4.1 - Testar Acesso
```
[ ] Abrir navegador
[ ] Acessar: https://workflows.oficialmed.com.br
[ ] Aguardar página carregar
[ ] Se aparecer erro SSL, aguardar 2-3 minutos
[ ] Página carregou? ______ (sim/não)
```

### 4.2 - Fazer Login
```
[ ] Usuário: admin
[ ] Senha: OfiCialMed2025!
[ ] Clicar em "Login" ou pressionar Enter
[ ] Login bem-sucedido? ______ (sim/não)
```

### 4.3 - Alterar Senha (OBRIGATÓRIO!)
```
[ ] Clicar no ícone de usuário (canto superior direito)
[ ] Clicar em "Settings"
[ ] Clicar em "Personal"
[ ] Alterar senha
[ ] Nova senha (anote em local seguro): ______________
[ ] Confirmar nova senha
[ ] Salvar
[ ] Senha alterada? ______ (sim/não)
```

**✅ CHECKPOINT 4**: Acesso configurado com sucesso

---

## 🧪 ETAPA 5: TESTAR FUNCIONALIDADES

### 5.1 - Criar Workflow de Teste
```
[ ] Clicar em "+ New" ou "Create Workflow"
[ ] Adicionar nó "Schedule Trigger"
[ ] Adicionar nó "Set"
[ ] Conectar os dois nós
[ ] Clicar em "Execute Workflow"
[ ] Workflow executou com sucesso? ______ (sim/não)
[ ] Salvar workflow (Ctrl+S)
```

### 5.2 - Testar Webhook
```
[ ] Criar novo workflow
[ ] Adicionar nó "Webhook"
[ ] Configurar:
    [ ] HTTP Method: POST
    [ ] Path: test
[ ] Clicar em "Listen for Test Event"
[ ] Copiar URL do webhook: ___________________________
[ ] Em outro terminal/Postman, fazer POST para a URL
[ ] Webhook recebeu requisição? ______ (sim/não)
```

**✅ CHECKPOINT 5**: Funcionalidades testadas

---

## 📊 ETAPA 6: MONITORAMENTO

### 6.1 - Configurar Monitoramento
```
[ ] Portainer → Services → n8n_n8n
[ ] Adicionar aos favoritos/bookmark
[ ] Configurar alerta de email (se disponível)
```

### 6.2 - Backup Inicial
```
[ ] Anotar data do deploy: ____/____/________
[ ] Anotar versão do N8N: ________________
[ ] Salvar YAML da stack em arquivo local
[ ] Arquivo salvo em: _______________________
```

**✅ CHECKPOINT 6**: Monitoramento configurado

---

## 🔒 ETAPA 7: SEGURANÇA

### 7.1 - Checklist de Segurança
```
[ ] Senha padrão foi alterada
[ ] Senha forte foi configurada (min 12 caracteres)
[ ] Senha foi salva em gerenciador de senhas
[ ] Backups estão configurados
[ ] Apenas pessoas autorizadas têm acesso
```

### 7.2 - Documentar Acessos
```
[ ] Documentar quem tem acesso ao N8N
[ ] Documentar quem tem acesso ao Portainer
[ ] Documentar onde ficam os backups
```

**✅ CHECKPOINT 7**: Segurança implementada

---

## 📚 ETAPA 8: DOCUMENTAÇÃO

### 8.1 - Salvar Informações
```
[ ] URL N8N: https://workflows.oficialmed.com.br
[ ] URL Webhooks: https://webhook.oficialmed.com.br
[ ] Usuário admin: ___________________
[ ] Data do deploy: ____/____/________
[ ] Versão instalada: ________________
[ ] Localização dos backups: __________________
```

### 8.2 - Recursos Salvos
```
[ ] Bookmark da URL do N8N
[ ] Bookmark do Portainer
[ ] Documentação salva localmente
[ ] Senhas no gerenciador
```

**✅ CHECKPOINT 8**: Documentação completa

---

## 🎓 ETAPA 9: TREINAMENTO

### 9.1 - Conhecer a Interface
```
[ ] Explorar menu lateral
[ ] Criar 2-3 workflows de exemplo
[ ] Importar template da galeria
[ ] Entender conceito de nós (nodes)
[ ] Entender conceito de conexões
```

### 9.2 - Recursos Educacionais
```
[ ] Ler: N8N_SETUP.md
[ ] Ler: N8N_QUICK_REFERENCE.md
[ ] Acessar: https://docs.n8n.io/
[ ] Assistir: tutoriais no YouTube
```

**✅ CHECKPOINT 9**: Treinamento concluído

---

## 🎯 ETAPA 10: PRÓXIMOS PASSOS

### 10.1 - Planejamento
```
[ ] Listar workflows que deseja criar
[ ] Listar integrações necessárias
[ ] Listar automações desejadas
[ ] Definir prioridades
```

### 10.2 - Implementação
```
[ ] Criar primeiro workflow real
[ ] Testar em ambiente de dev
[ ] Documentar workflow
[ ] Passar para produção
```

**✅ CHECKPOINT 10**: Pronto para produção!

---

## ✅ VERIFICAÇÃO FINAL

### Tudo funcionando?

```
[✓] Banco de dados n8n criado
[✓] Stack n8n deployada no Portainer
[✓] Serviço n8n_n8n rodando (1/1)
[✓] URL workflows.oficialmed.com.br acessível
[✓] URL webhook.oficialmed.com.br funcional
[✓] Login funcionando
[✓] Senha alterada
[✓] Workflow de teste criado
[✓] Webhook testado
[✓] Logs sem erros críticos
[✓] Backup configurado
[✓] Documentação salva
[✓] Equipe treinada
```

---

## 🎉 PARABÉNS!

```
╔═══════════════════════════════════════════════════╗
║                                                   ║
║    ✅ N8N ESTÁ FUNCIONANDO PERFEITAMENTE!        ║
║                                                   ║
║    Você completou todas as etapas com sucesso!   ║
║                                                   ║
╚═══════════════════════════════════════════════════╝
```

---

## 📝 ANOTAÇÕES

Use este espaço para anotar informações importantes durante o deploy:

```
______________________________________________________

______________________________________________________

______________________________________________________

______________________________________________________

______________________________________________________

______________________________________________________

______________________________________________________

______________________________________________________
```

---

## 📞 SUPORTE

Em caso de problemas, consulte:

1. **N8N_DEPLOY_PORTAINER.md** - Guia detalhado
2. **N8N_QUICK_REFERENCE.md** - Comandos rápidos
3. **Logs no Portainer** - Services → n8n_n8n → Logs
4. **Comunidade N8N** - https://community.n8n.io/

---

**Checklist criada para Oficial Med** | Outubro 2025  
**Deploy via Portainer - 100% Interface Gráfica**

---

## 📅 CONTROLE DE DEPLOY

| Item | Data | Responsável | Status |
|------|------|-------------|--------|
| Deploy inicial | ____/____/____ | _____________ | [ ] |
| Primeiro backup | ____/____/____ | _____________ | [ ] |
| Treinamento equipe | ____/____/____ | _____________ | [ ] |
| Primeiro workflow | ____/____/____ | _____________ | [ ] |
| Integração Typebot | ____/____/____ | _____________ | [ ] |

---

**🎯 Mantenha este arquivo atualizado para referência futura!**

