# 🚀 ATALHOS E COMANDOS PARA VPS

**📅 Data:** 18/08/2025  
**🎯 Objetivo:** Facilitar execução de comandos na VPS com atalhos  
**📍 Servidor:** `/opt/sprinthub-sync/`

---

## 🔧 **CONFIGURAR ATALHOS NA VPS:**

### **📋 Comando para instalar TODOS os atalhos:**
```bash
cat >> ~/.bashrc << 'EOF'

# ========================================
# 🚀 ATALHOS SPRINTHUB SYNC
# ========================================

# 🔍 Verificar sincronização
alias verificar-sync='cd /opt/sprinthub-sync && node verificador-sincronizacao.js'

# 🔄 Sincronização manual
alias sync-manual='cd /opt/sprinthub-sync && node sync-incremental.js'

# 📊 Ver logs do Docker
alias sync-logs='docker logs sprinthub-sync-cron'

# 🔄 Reiniciar Docker
alias sync-restart='docker restart sprinthub-sync-cron'

# 📋 Status do Docker
alias sync-status='docker ps | grep sprinthub-sync'

# 📁 Ir para pasta do projeto
alias goto-sync='cd /opt/sprinthub-sync && ls -la'

# ⏰ Ver configuração do cron
alias sync-cron='docker exec sprinthub-sync-cron crontab -l'

# 📄 Ver último relatório
alias sync-relatorio='cd /opt/sprinthub-sync && cat relatorio-verificacao.json | jq "."'

# 🧹 Limpar logs antigos
alias sync-clean='cd /opt/sprinthub-sync && rm -f *.log verificacao-*.log'

EOF

source ~/.bashrc
```

---

## 📋 **LISTA COMPLETA DE ATALHOS:**

| **Atalho** | **Comando Original** | **Função** |
|------------|---------------------|------------|
| `verificar-sync` | `cd /opt/sprinthub-sync && node verificador-sincronizacao.js` | 🔍 Verificar integridade da sincronização |
| `sync-manual` | `cd /opt/sprinthub-sync && node sync-incremental.js` | 🔄 Executar sincronização manual |
| `sync-logs` | `docker logs sprinthub-sync-cron` | 📊 Ver logs do container |
| `sync-restart` | `docker restart sprinthub-sync-cron` | 🔄 Reiniciar serviço automático |
| `sync-status` | `docker ps \| grep sprinthub-sync` | 📋 Status do container |
| `goto-sync` | `cd /opt/sprinthub-sync && ls -la` | 📁 Ir para pasta e listar arquivos |
| `sync-cron` | `docker exec sprinthub-sync-cron crontab -l` | ⏰ Ver configuração do cron |
| `sync-relatorio` | `cd /opt/sprinthub-sync && cat relatorio-verificacao.json \| jq "."` | 📄 Ver último relatório JSON |
| `sync-clean` | `cd /opt/sprinthub-sync && rm -f *.log verificacao-*.log` | 🧹 Limpar logs antigos |

---

## 🎯 **ATALHOS MAIS USADOS:**

### **📅 ROTINA DIÁRIA:**
```bash
verificar-sync      # Verificar integridade (1x por dia)
sync-logs          # Ver se está funcionando
```

### **🔧 MANUTENÇÃO:**
```bash
sync-status        # Ver se container está rodando
sync-restart       # Reiniciar se necessário
```

### **🚨 EMERGÊNCIA:**
```bash
sync-manual        # Forçar sincronização manual
goto-sync          # Ir para pasta e ver arquivos
```

---

## 📊 **EXEMPLOS DE USO:**

### **🌅 Rotina matinal:**
```bash
sync-status        # Verificar se está rodando
verificar-sync     # Verificar integridade
```

### **🔧 Após problemas:**
```bash
sync-logs          # Ver o que aconteceu
sync-restart       # Reiniciar serviço
sync-manual        # Forçar sincronização
```

### **📊 Relatórios:**
```bash
verificar-sync     # Gerar novo relatório
sync-relatorio     # Ver último relatório JSON
```

---

## ⚡ **INSTALAÇÃO RÁPIDA:**

### **1️⃣ Copie e cole NA VPS:**
```bash
cat >> ~/.bashrc << 'EOF'
alias verificar-sync='cd /opt/sprinthub-sync && node verificador-sincronizacao.js'
alias sync-manual='cd /opt/sprinthub-sync && node sync-incremental.js'
alias sync-logs='docker logs sprinthub-sync-cron'
alias sync-restart='docker restart sprinthub-sync-cron'
alias sync-status='docker ps | grep sprinthub-sync'
alias goto-sync='cd /opt/sprinthub-sync && ls -la'
alias sync-cron='docker exec sprinthub-sync-cron crontab -l'
EOF

source ~/.bashrc
```

### **2️⃣ Testar:**
```bash
verificar-sync
```

---

## 🎉 **RESULTADO:**

- ✅ **Comandos simples** em vez de comandos longos
- ⚡ **Execução rápida** sem precisar lembrar caminhos
- 🔄 **Permanente** - funciona sempre que logar na VPS
- 📋 **Padronizado** - mesmo padrão para toda equipe

**Agora você tem atalhos profissionais para gerenciar a sincronização!** 🚀


