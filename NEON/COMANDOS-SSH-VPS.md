# 🌐 COMANDOS SSH PARA EXECUTAR NA VPS

**📍 IP da VPS:** `72.60.13.173`  
**👤 Usuário:** `root`  
**🔑 Senha:** `Oficial77@@pro`

---

## 🚀 **COMANDOS PRINCIPAIS:**

### **1️⃣ CONECTAR NA VPS:**
```bash
ssh root@72.60.13.173
```

### **2️⃣ EXECUTAR VERIFICADOR:**
```bash
ssh root@72.60.13.173 "cd /opt/sprinthub-sync && node verificador-sincronizacao.js"
```

### **3️⃣ EXECUTAR INCREMENTAL:**
```bash
ssh root@72.60.13.173 "cd /opt/sprinthub-sync && node sync-incremental.js"
```

### **4️⃣ VER STATUS DO DOCKER:**
```bash
ssh root@72.60.13.173 "docker ps | grep sprinthub"
```

### **5️⃣ VER LOGS DO CRON:**
```bash
ssh root@72.60.13.173 "docker logs sprinthub-sync-cron"
```

---

## 📋 **SEQUÊNCIA RECOMENDADA:**

### **🔍 Verificação completa:**
```bash
# 1. Conectar
ssh root@72.60.13.173

# 2. Ir para pasta dos scripts
cd /opt/sprinthub-sync

# 3. Verificar status atual
docker ps | grep sprinthub

# 4. Executar verificador (demora ~5-10 min)
node verificador-sincronizacao.js

# 5. Se necessário, executar incremental
node sync-incremental.js

# 6. Ver logs se houver problemas
docker logs sprinthub-sync-cron
```

---

## ⚡ **COMANDOS RÁPIDOS (uma linha):**

```bash
# Verificar sincronização
ssh root@72.60.13.173 "cd /opt/sprinthub-sync && node verificador-sincronizacao.js"

# Forçar sincronização
ssh root@72.60.13.173 "cd /opt/sprinthub-sync && node sync-incremental.js"

# Ver status
ssh root@72.60.13.173 "docker ps | grep sprinthub && docker logs --tail 20 sprinthub-sync-cron"
```

---

## 📊 **O QUE ESPERAR:**

### **🔍 Verificador:**
- ✅ Análise completa de ~20.773 oportunidades
- ✅ Relatório por funil e etapa
- ✅ Detecção de ausentes/desatualizadas
- ✅ Taxa de sincronização (esperado: >99%)

### **🔄 Incremental:**
- ✅ Sincronização de novas oportunidades
- ✅ Atualização de existentes
- ✅ Mapeamento de todos os 68 campos

### **📅 Cron Automático:**
- ⏰ Executa a cada 2 horas (6h às 22h)
- 🕐 Fuso: America/Sao_Paulo
- 🐳 Container: `sprinthub-sync-cron`

---

**🎯 DICA:** Execute primeiro o verificador para ver o status atual, depois o incremental se necessário!


