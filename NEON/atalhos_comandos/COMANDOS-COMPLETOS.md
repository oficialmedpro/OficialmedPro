# 📋 COMANDOS COMPLETOS PARA VPS

**📅 Data:** 18/08/2025  
**🎯 Objetivo:** Lista completa de comandos para gerenciar SprintHub Sync  

---

## 🔍 **VERIFICAÇÃO E DIAGNÓSTICO:**

### **📊 Verificar sincronização completa:**
```bash
cd /opt/sprinthub-sync
node verificador-sincronizacao.js
```

### **📄 Ver último relatório JSON:**
```bash
cd /opt/sprinthub-sync
cat relatorio-verificacao.json | jq '.'
```

### **📊 Verificação com timestamp:**
```bash
cd /opt/sprinthub-sync
node verificador-sincronizacao.js > verificacao-$(date +%Y%m%d-%H%M).log 2>&1
```

---

## 🔄 **SINCRONIZAÇÃO MANUAL:**

### **⚡ Incremental (recomendado):**
```bash
cd /opt/sprinthub-sync
node sync-incremental.js
```

### **📊 Histórica completa (apenas se necessário):**
```bash
cd /opt/sprinthub-sync
node sync-all-historical-opportunities.js
```

---

## 🐳 **GERENCIAR DOCKER/PORTAINER:**

### **📊 Ver logs do cron:**
```bash
docker logs sprinthub-sync-cron
```

### **📊 Ver logs em tempo real:**
```bash
docker logs -f sprinthub-sync-cron
```

### **🔄 Reiniciar serviço:**
```bash
docker restart sprinthub-sync-cron
```

### **📋 Status do container:**
```bash
docker ps | grep sprinthub-sync
```

### **⏰ Ver configuração do cron:**
```bash
docker exec sprinthub-sync-cron crontab -l
```

### **🔄 Recriar stack completa:**
```bash
docker-compose down
docker-compose up -d
```

---

## 📁 **GERENCIAR ARQUIVOS:**

### **📂 Listar arquivos do projeto:**
```bash
cd /opt/sprinthub-sync
ls -la
```

### **📅 Ver arquivos por data:**
```bash
cd /opt/sprinthub-sync
ls -lat
```

### **🔍 Buscar arquivos JavaScript:**
```bash
find /opt/sprinthub-sync/ -name "*.js" -ls
```

### **🔍 Ver arquivos recentes (24h):**
```bash
find /opt/sprinthub-sync/ -type f -mtime -1 -ls
```

---

## 🧹 **LIMPEZA E MANUTENÇÃO:**

### **🗑️ Remover logs antigos:**
```bash
cd /opt/sprinthub-sync
rm -f *.log verificacao-*.log debug-*.log
```

### **🗑️ Remover arquivos de desenvolvimento:**
```bash
cd /opt/sprinthub-sync
rm -f test-*.js debug-*.js insert-*.js map-*.js count-*.js
```

### **📊 Ver espaço em disco:**
```bash
du -sh /opt/sprinthub-sync/
df -h
```

---

## 🚨 **RESOLUÇÃO DE PROBLEMAS:**

### **❌ Se sincronização falhar:**
```bash
# 1. Ver logs
docker logs sprinthub-sync-cron | tail -50

# 2. Testar manualmente
cd /opt/sprinthub-sync
node sync-incremental.js

# 3. Reiniciar se necessário
docker restart sprinthub-sync-cron
```

### **🔍 Se verificador falhar:**
```bash
# 1. Verificar se arquivo existe
ls -la /opt/sprinthub-sync/verificador-sincronizacao.js

# 2. Testar sintaxe
node -c /opt/sprinthub-sync/verificador-sincronizacao.js

# 3. Executar com debug
cd /opt/sprinthub-sync
node verificador-sincronizacao.js 2>&1 | tee debug-verificador.log
```

### **🐳 Se Docker não responder:**
```bash
# 1. Ver todos containers
docker ps -a

# 2. Ver logs do sistema
journalctl -u docker | tail -20

# 3. Reiniciar Docker (último recurso)
systemctl restart docker
```

---

## 📊 **MONITORAMENTO:**

### **⏰ Próximas execuções do cron:**
```bash
docker exec sprinthub-sync-cron sh -c "date && crontab -l"
```

### **📈 Estatísticas rápidas:**
```bash
cd /opt/sprinthub-sync
echo "📊 Último relatório:" && cat relatorio-verificacao.json | jq '.totalSprintHub, .totalSupabase, .percentualSincronizacao'
```

### **🔄 Status completo do sistema:**
```bash
echo "🐳 Docker:" && docker ps | grep sprinthub-sync
echo "📁 Arquivos:" && ls -la /opt/sprinthub-sync/ | grep -E "\.(js|yml)$"
echo "📊 Último relatório:" && ls -la /opt/sprinthub-sync/relatorio-verificacao.json
```

---

## 🎯 **COMANDOS DE EMERGÊNCIA:**

### **🚨 Parar tudo:**
```bash
docker stop sprinthub-sync-cron
```

### **🚨 Remover e recriar:**
```bash
docker-compose down
docker-compose up -d
```

### **🚨 Backup dos dados:**
```bash
cd /opt/sprinthub-sync
tar -czf backup-sprinthub-$(date +%Y%m%d).tar.gz *.js *.yml *.json
```

---

**🎉 TODOS OS COMANDOS DOCUMENTADOS E ORGANIZADOS!**


