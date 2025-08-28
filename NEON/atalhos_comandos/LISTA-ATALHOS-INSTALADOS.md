# ⚡ ATALHOS INSTALADOS NA VPS

**📅 Data:** 18/08/2025  
**✅ Status:** Instalados e funcionando  
**🎯 Localização:** `~/.bashrc`

---

## 🚀 **ATALHOS DISPONÍVEIS:**

### **🔍 VERIFICAÇÃO:**
```bash
verificar-sync     # Executar verificação completa de integridade
```
**Comando original:** `cd /opt/sprinthub-sync && node verificador-sincronizacao.js`

### **🔄 SINCRONIZAÇÃO:**
```bash
sync-manual        # Executar sincronização incremental manual
```
**Comando original:** `cd /opt/sprinthub-sync && node sync-incremental.js`

### **📊 MONITORAMENTO:**
```bash
sync-logs          # Ver logs do container Docker
sync-status        # Ver status do container
sync-cron          # Ver configuração do cron
```
**Comandos originais:**
- `docker logs sprinthub-sync-cron`
- `docker ps | grep sprinthub-sync`
- `docker exec sprinthub-sync-cron crontab -l`

### **🔧 MANUTENÇÃO:**
```bash
sync-restart       # Reiniciar container Docker
goto-sync          # Ir para pasta do projeto
```
**Comandos originais:**
- `docker restart sprinthub-sync-cron`
- `cd /opt/sprinthub-sync && ls -la`

---

## 📋 **COMO USAR OS ATALHOS:**

### **📅 ROTINA DIÁRIA:**
```bash
# 1. Verificar se está funcionando
sync-status

# 2. Verificar integridade dos dados
verificar-sync
```

### **🔧 MANUTENÇÃO:**
```bash
# Ver logs se houver problemas
sync-logs

# Reiniciar se necessário
sync-restart

# Forçar sincronização manual
sync-manual
```

### **📂 NAVEGAÇÃO:**
```bash
# Ir para pasta do projeto
goto-sync

# Ver configuração do cron
sync-cron
```

---

## ✅ **TESTE DOS ATALHOS:**

### **🧪 Comandos para testar:**
```bash
# Teste básico
goto-sync

# Teste de status
sync-status

# Teste de verificação (demora ~5-10 min)
verificar-sync
```

---

## 🎯 **ATALHOS MAIS USADOS:**

| **Frequência** | **Atalho** | **Quando usar** |
|----------------|------------|-----------------|
| **Diário** | `verificar-sync` | Verificar integridade |
| **Semanal** | `sync-logs` | Ver se está funcionando bem |
| **Mensal** | `sync-manual` | Forçar sincronização |
| **Emergência** | `sync-restart` | Resolver problemas |

---

## 📊 **EXEMPLO DE USO REAL:**

```bash
root@OficialMed:~# sync-status
sprinthub-sync-cron   node:18-alpine   "sh -c 'echo 🚀 Ini…"   2 hours ago   Up 2 hours   sprinthub-sync-cron

root@OficialMed:~# verificar-sync
🔍 VERIFICADOR DE SINCRONIZAÇÃO SPRINTHUB ↔ SUPABASE
============================================================
📅 18/08/2025, 19:35:42
...
📊 Taxa de Sincronização: 99.98%
✅ Verificação concluída!

root@OficialMed:~# goto-sync
total 32
-rw-r--r-- 1 root root 12142 Aug 18 18:07 sync-incremental.js
-rw-r--r-- 1 root root 13014 Aug 18 19:25 verificador-sincronizacao.js
```

---

**🎉 ATALHOS FUNCIONANDO PERFEITAMENTE! USE À VONTADE!** 🚀




