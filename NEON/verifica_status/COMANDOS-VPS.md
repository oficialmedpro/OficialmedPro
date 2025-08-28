# 🌐 COMANDOS PARA EXECUTAR NA VPS

**📍 Localização:** `/opt/sprinthub-sync/`  
**📅 Data:** 18/08/2025

---

## 🔍 **VERIFICAR SINCRONIZAÇÃO:**

### **📊 Comando principal:**
```bash
cd /opt/sprinthub-sync
node verificador-sincronizacao.js
```

### **📄 Salvar relatório com timestamp:**
```bash
cd /opt/sprinthub-sync
node verificador-sincronizacao.js > verificacao-$(date +%Y%m%d-%H%M).log 2>&1
```

### **📋 Ver apenas resumo final:**
```bash
cd /opt/sprinthub-sync
node verificador-sincronizacao.js | tail -20
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

## 🐳 **GERENCIAR DOCKER:**

### **📊 Ver logs do cron:**
```bash
docker logs sprinthub-sync-cron
```

### **🔄 Reiniciar serviço:**
```bash
docker restart sprinthub-sync-cron
```

### **⏰ Ver configuração do cron:**
```bash
docker exec sprinthub-sync-cron crontab -l
```

### **📋 Status do container:**
```bash
docker ps | grep sprinthub-sync
```

---

## 📁 **ARQUIVOS IMPORTANTES:**

### **🔍 Scripts de verificação:**
- `verificador-sincronizacao.js` - Verificar integridade
- `sync-incremental.js` - Sincronização automática
- `sync-all-historical-opportunities.js` - Sincronização completa

### **🐳 Configuração Docker:**
- `docker-compose.yml` - Stack do Portainer

### **📊 Relatórios gerados:**
- `relatorio-verificacao.json` - Dados estruturados
- `verificacao-YYYYMMDD-HHMM.log` - Logs com timestamp

---

## ⏰ **HORÁRIOS DE EXECUÇÃO:**

### **🤖 Automático (cron):**
- **Incremental**: A cada 2 horas (6h às 22h)
- **Fuso horário**: America/Sao_Paulo

### **🔍 Manual (verificação):**
- **Manhã**: 08:00 (início do dia)
- **Tarde**: 14:00 (meio do expediente)  
- **Noite**: 20:00 (final do dia)

---

## 🚨 **RESOLUÇÃO DE PROBLEMAS:**

### **❌ Se encontrar registros ausentes:**
```bash
cd /opt/sprinthub-sync
node sync-incremental.js
```

### **🔄 Se encontrar registros desatualizados:**
```bash
cd /opt/sprinthub-sync
node sync-incremental.js
```

### **🐳 Se o Docker não estiver funcionando:**
```bash
docker-compose down
docker-compose up -d
```

### **📊 Para debug detalhado:**
```bash
cd /opt/sprinthub-sync
node verificador-sincronizacao.js > debug-$(date +%Y%m%d-%H%M).log 2>&1
cat debug-$(date +%Y%m%d-%H%M).log
```

---

**🎯 MANTENHA ESSES COMANDOS SALVOS PARA FACILITAR O DIA A DIA!**


