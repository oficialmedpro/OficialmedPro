# 🚨 COMANDOS DE EMERGÊNCIA

**📅 Data:** 18/08/2025  
**🎯 Objetivo:** Comandos para resolver problemas críticos  

---

## 🚨 **PROBLEMAS COMUNS E SOLUÇÕES:**

### **❌ SINCRONIZAÇÃO PAROU DE FUNCIONAR:**

#### **🔍 Diagnóstico:**
```bash
# Verificar se container está rodando
docker ps | grep sprinthub-sync

# Ver logs recentes
docker logs sprinthub-sync-cron | tail -50

# Verificar cron interno
docker exec sprinthub-sync-cron crontab -l
```

#### **🔧 Solução:**
```bash
# Reiniciar container
docker restart sprinthub-sync-cron

# Se não resolver, recriar
docker-compose down
docker-compose up -d
```

---

### **❌ MUITOS REGISTROS AUSENTES:**

#### **🔍 Diagnóstico:**
```bash
# Executar verificador
cd /opt/sprinthub-sync
node verificador-sincronizacao.js
```

#### **🔧 Solução:**
```bash
# Sincronização manual para corrigir
cd /opt/sprinthub-sync
node sync-incremental.js

# Se muito crítico, sincronização completa
cd /opt/sprinthub-sync
node sync-all-historical-opportunities.js
```

---

### **❌ ERRO DE PERMISSÃO NO SUPABASE:**

#### **🔍 Diagnóstico:**
```bash
# Testar conexão manual
cd /opt/sprinthub-sync
node -e "
const https = require('https');
const options = {
    hostname: 'agdffspstbxeqhqtltvb.supabase.co',
    path: '/rest/v1/oportunidade_sprint?limit=1',
    headers: {
        'Accept': 'application/json',
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFnZGZmc3BzdGJ4ZXFocXRsdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDQ1MzY2NiwiZXhwIjoyMDY2MDI5NjY2fQ.grInwGHFAH2WYvYerwfHkUsM08wXCJASg4CPMD2cTaA',
        'Accept-Profile': 'api'
    }
};
https.get(options, (res) => {
    console.log('Status:', res.statusCode);
    res.on('data', (data) => console.log(data.toString()));
});
"
```

#### **🔧 Solução:**
- ⚠️ **Verificar** se service_role key ainda é válida
- 🔧 **Executar** no Supabase SQL Editor:
```sql
GRANT ALL PRIVILEGES ON TABLE api.oportunidade_sprint TO service_role, anon, authenticated;
```

---

### **❌ DOCKER NÃO RESPONDE:**

#### **🔍 Diagnóstico:**
```bash
# Ver todos containers
docker ps -a

# Ver logs do sistema Docker
journalctl -u docker | tail -20

# Ver uso de recursos
docker stats sprinthub-sync-cron --no-stream
```

#### **🔧 Solução:**
```bash
# Parar container problemático
docker stop sprinthub-sync-cron
docker rm sprinthub-sync-cron

# Recriar do zero
cd /opt/sprinthub-sync
docker-compose up -d

# Último recurso: reiniciar Docker
systemctl restart docker
```

---

### **❌ ARQUIVO CORROMPIDO:**

#### **🔍 Diagnóstico:**
```bash
# Verificar sintaxe dos arquivos
node -c /opt/sprinthub-sync/sync-incremental.js
node -c /opt/sprinthub-sync/verificador-sincronizacao.js
```

#### **🔧 Solução:**
```bash
# Recriar arquivo corrompido (exemplo: verificador)
rm /opt/sprinthub-sync/verificador-sincronizacao.js

# Usar backup ou recriar manualmente
# (comandos de criação estão na documentação)
```

---

## 🔄 **BACKUP E RESTAURAÇÃO:**

### **💾 Criar backup:**
```bash
cd /opt/sprinthub-sync
tar -czf backup-sprinthub-$(date +%Y%m%d-%H%M).tar.gz *.js *.yml *.json
```

### **📁 Restaurar backup:**
```bash
cd /opt/sprinthub-sync
tar -xzf backup-sprinthub-YYYYMMDD-HHMM.tar.gz
```

---

## 📊 **MONITORAMENTO AVANÇADO:**

### **📈 Ver performance:**
```bash
# CPU e memória do container
docker stats sprinthub-sync-cron --no-stream

# Processos dentro do container
docker exec sprinthub-sync-cron ps aux

# Espaço em disco
du -sh /opt/sprinthub-sync/
df -h /opt/
```

### **🔍 Debug detalhado:**
```bash
# Executar com logs detalhados
cd /opt/sprinthub-sync
node sync-incremental.js 2>&1 | tee debug-$(date +%Y%m%d-%H%M).log
```

---

## 📞 **CONTATOS DE EMERGÊNCIA:**

### **🆘 Se nada funcionar:**
1. 📱 **Avisar equipe** sobre problema na sincronização
2. 🔄 **Executar sync manual** enquanto resolve
3. 📊 **Documentar** o problema para análise posterior

### **📋 Informações para suporte:**
```bash
# Coletar informações do sistema
echo "=== INFORMAÇÕES DO SISTEMA ===" > debug-sistema.txt
echo "Data: $(date)" >> debug-sistema.txt
echo "Docker:" >> debug-sistema.txt
docker ps | grep sprinthub-sync >> debug-sistema.txt
echo "Logs:" >> debug-sistema.txt
docker logs sprinthub-sync-cron | tail -20 >> debug-sistema.txt
echo "Arquivos:" >> debug-sistema.txt
ls -la /opt/sprinthub-sync/ >> debug-sistema.txt
```

---

**🎯 TENHA ESSES COMANDOS SEMPRE À MÃO PARA EMERGÊNCIAS!**




