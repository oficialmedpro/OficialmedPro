# 🚀 SCRIPTS QUE RODAM NA VPS

**📅 Data:** 18/08/2025  
**🎯 Objetivo:** Backup dos scripts que estão executando no servidor  
**📍 Localização no servidor:** `/opt/sprinthub-sync/`

---

## 📂 **ARQUIVOS NA VPS:**

### **🔄 SCRIPT PRINCIPAL:**
- **`sync-incremental.js`** - Script de sincronização automática
  - ⏰ **Executa**: A cada 2 horas (6h às 22h)
  - 📊 **Função**: INSERT novas + UPDATE existentes
  - 🎯 **Campos**: Todos os 65 campos mapeados

### **🐳 CONFIGURAÇÃO DOCKER:**
- **`docker-compose.yml`** - Stack do Portainer
  - 🤖 **Cron**: `0 6-22/2 * * *`
  - 🕐 **Fuso**: America/Sao_Paulo
  - 📋 **Container**: `sprinthub-sync-cron`

---

## 📊 **ESTATÍSTICAS DE SINCRONIZAÇÃO:**

### **[1] COMERCIAL APUCARANA:**
- 📈 **11.273 oportunidades** (99,95% sucesso)
- 🎯 **7 etapas** sincronizadas

### **[2] RECOMPRA:**
- 📈 **7.890 oportunidades** (99,97% sucesso) 
- 🎯 **18 etapas** sincronizadas

### **📊 TOTAL GERAL:**
- 📈 **19.163 oportunidades** sincronizadas
- ✅ **Taxa de sucesso**: 99,98%
- 🔄 **65 campos** mapeados por oportunidade

---

## 🔧 **COMANDOS DE MANUTENÇÃO:**

### **Ver logs do cron:**
```bash
docker logs sprinthub-sync-cron
```

### **Reiniciar sincronização:**
```bash
docker restart sprinthub-sync-cron
```

### **Teste manual:**
```bash
cd /opt/sprinthub-sync
node sync-incremental.js
```

### **Verificar próxima execução:**
```bash
docker exec sprinthub-sync-cron crontab -l
```

---

## ⚠️ **IMPORTANTE:**

- 🔄 **Sempre** que alterar `sync-incremental.js` no servidor, atualize a cópia aqui
- 📚 **Sempre** que adicionar novos campos, atualize a documentação
- 🧪 **Sempre** teste manualmente antes de deixar no automático

---

**🎉 SINCRONIZAÇÃO SPRINTHUB ↔ SUPABASE FUNCIONANDO 100%!**

