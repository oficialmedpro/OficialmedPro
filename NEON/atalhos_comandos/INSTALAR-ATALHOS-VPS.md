# ⚡ INSTALAR ATALHOS NA VPS

**📍 Execute este comando na VPS para configurar todos os atalhos:**

---

## 🚀 **COMANDO DE INSTALAÇÃO:**

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

# 📊 Status completo
alias sync-info='echo "🐳 Docker:" && docker ps | grep sprinthub-sync && echo "📁 Arquivos:" && ls -la /opt/sprinthub-sync/ | grep -E "\.(js|yml)$" && echo "📊 Último relatório:" && ls -la /opt/sprinthub-sync/relatorio-verificacao.json'

EOF

source ~/.bashrc
```

---

## ✅ **APÓS INSTALAR, VOCÊ TERÁ:**

| **Atalho** | **Função** | **Uso** |
|------------|------------|---------|
| `verificar-sync` | 🔍 Verificação completa | **Diário** |
| `sync-manual` | 🔄 Sincronização manual | **Emergência** |
| `sync-logs` | 📊 Ver logs | **Debug** |
| `sync-restart` | 🔄 Reiniciar serviço | **Manutenção** |
| `sync-status` | 📋 Status container | **Monitoramento** |
| `goto-sync` | 📁 Ir para pasta | **Navegação** |
| `sync-cron` | ⏰ Ver cron config | **Verificação** |
| `sync-relatorio` | 📄 Ver relatório JSON | **Análise** |
| `sync-clean` | 🧹 Limpar logs | **Limpeza** |
| `sync-info` | 📊 Status completo | **Overview** |

---

## 🎯 **ROTINA RECOMENDADA:**

### **🌅 Manhã (início do dia):**
```bash
sync-status        # Ver se está rodando
verificar-sync     # Verificar integridade
```

### **🔧 Manutenção semanal:**
```bash
sync-logs          # Ver logs da semana
sync-clean         # Limpar logs antigos
sync-info          # Status geral
```

### **🚨 Resolução de problemas:**
```bash
sync-status        # Verificar container
sync-logs          # Ver erros
sync-restart       # Reiniciar se necessário
sync-manual        # Forçar sincronização
```

---

## 📋 **TESTE DOS ATALHOS:**

### **Após instalar, teste:**
```bash
# Testar atalho básico
goto-sync

# Testar verificação
verificar-sync

# Testar status
sync-status
```

---

## ⚠️ **IMPORTANTE:**

- 🔄 **Permanente**: Atalhos ficam salvos no `.bashrc`
- 🌐 **Global**: Funcionam em qualquer pasta
- 🎯 **Simples**: Comandos fáceis de lembrar
- 📋 **Padronizado**: Mesmo padrão para toda equipe

---

**🚀 INSTALE UMA VEZ E USE PARA SEMPRE!**




