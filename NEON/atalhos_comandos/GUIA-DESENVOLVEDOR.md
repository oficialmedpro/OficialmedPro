# 🚀 GUIA PARA DESENVOLVEDOR - SPRINTHUB SYNC

**📅 Data:** 18/08/2025  
**🎯 Sistema:** Sincronização SprintHub ↔ Supabase  
**📍 Servidor:** VPS - `/opt/sprinthub-sync/`

---

## ⚡ **ATALHOS DISPONÍVEIS:**

| **Comando** | **Função** | **Quando Usar** |
|-------------|------------|-----------------|
| `verificar-sync` | 🔍 Verificar integridade da sincronização | Diário - manhã ou final do dia |
| `sync-manual` | 🔄 Executar sincronização incremental | Emergência ou após problemas |
| `sync-logs` | 📊 Ver logs do container Docker | Debug e monitoramento |
| `sync-status` | 📋 Ver status do container | Verificar se está rodando |
| `sync-restart` | 🔄 Reiniciar serviço automático | Resolver problemas do cron |
| `goto-sync` | 📁 Ir para pasta do projeto | Navegar e ver arquivos |
| `sync-cron` | ⏰ Ver configuração do cron | Verificar horários programados |

---

## 📊 **SISTEMA DE SINCRONIZAÇÃO:**

### **🤖 AUTOMÁTICO:**
- **Horário:** A cada 2 horas, das 6h às 22h (fuso SP)
- **Função:** INSERT novas + UPDATE existentes
- **Container:** `sprinthub-sync-cron`

### **🔍 VERIFICAÇÃO:**
- **Função:** Compara TODAS as oportunidades SprintHub vs Supabase
- **Relatório:** Mostra ausentes, desatualizadas, percentuais
- **Tempo:** ~5-10 minutos para executar

---

## 📋 **ROTINA OPERACIONAL:**

### **🌅 ROTINA DIÁRIA:**
```bash
# 1. Verificar se sistema está funcionando
sync-status

# 2. Verificar integridade dos dados  
verificar-sync
```

### **🔧 MANUTENÇÃO SEMANAL:**
```bash
# 1. Ver logs da semana
sync-logs

# 2. Verificar configuração do cron
sync-cron

# 3. Ir para pasta e verificar arquivos
goto-sync
```

### **🚨 RESOLUÇÃO DE PROBLEMAS:**
```bash
# 1. Ver o que aconteceu
sync-logs

# 2. Reiniciar se necessário  
sync-restart

# 3. Forçar sincronização manual
sync-manual

# 4. Verificar se corrigiu
verificar-sync
```

---

## 📊 **INTERPRETAÇÃO DOS RESULTADOS:**

### **🔍 VERIFICADOR (`verificar-sync`):**

#### **✅ Resultado ideal:**
```
📊 Taxa de Sincronização: 99.5%+
❌ Total Ausentes: 0-10 oportunidades
🔄 Total Desatualizadas: 0-5 oportunidades
```

#### **⚠️ Atenção necessária:**
```
📊 Taxa de Sincronização: 95-99%
❌ Total Ausentes: 10-100 oportunidades
🔄 Total Desatualizadas: 5-50 oportunidades
```
**Ação:** Execute `sync-manual`

#### **🚨 Problema crítico:**
```
📊 Taxa de Sincronização: <95%
❌ Total Ausentes: >100 oportunidades
```
**Ação:** Investigar logs e possivelmente reexecutar sincronização histórica

### **📊 LOGS (`sync-logs`):**

#### **✅ Funcionamento normal:**
```
🔄 SINCRONIZAÇÃO INCREMENTAL - 65 CAMPOS
📅 18/08/2025, 08:00:15
🎯 [1] COMERCIAL APUCARANA
   ➕ INSERT ID 70801
   🔄 UPDATE ID 70789
📊 45 processadas | ➕ 12 inseridas | 🔄 8 atualizadas | ❌ 0 erros
✅ Sincronização incremental concluída!
```

#### **⚠️ Problemas de rede:**
```
❌ ERRO GERAL: getaddrinfo ENOTFOUND
❌ Erro na etapa [0] ENTRADA
```
**Ação:** Verificar conectividade, aguardar próxima execução

#### **🚨 Erro de permissão:**
```
📊 STATUS: 403
📄 RESPOSTA: {"code":"42501","message":"permission denied"}
```
**Ação:** Verificar permissões no Supabase

---

## 🔧 **ARQUIVOS IMPORTANTES:**

### **📂 NA VPS (`/opt/sprinthub-sync/`):**
- `sync-incremental.js` - **Script principal automático**
- `verificador-sincronizacao.js` - **Script de verificação**
- `docker-compose.yml` - **Configuração do Portainer**
- `relatorio-verificacao.json` - **Último relatório gerado**

### **📂 BACKUP LOCAL (projeto):**
- `roda_na_vps/` - Backup dos scripts da VPS
- `verifica_status/` - Scripts de verificação
- `atalhos_comandos/` - Documentação completa
- `manutencao/` - Processo para adicionar campos

---

## 🎯 **DADOS TÉCNICOS:**

### **📊 VOLUME:**
- **~19.000 oportunidades** sincronizadas
- **25 etapas** (7 + 18 dos funis)
- **65 campos** mapeados por oportunidade

### **🔗 APIs:**
- **SprintHub:** `sprinthub-api-master.sprinthub.app`
- **Supabase:** `agdffspstbxeqhqtltvb.supabase.co`
- **Schema:** `api.oportunidade_sprint`

### **⏰ CONFIGURAÇÃO:**
- **Cron:** `0 6-22/2 * * *` (a cada 2h, 6h-22h)
- **Fuso:** America/Sao_Paulo
- **Rate limiting:** 50-100ms entre requisições

---

## 📞 **CONTATO:**

**Para dúvidas sobre o sistema:**
- 📚 **Documentação completa** na pasta `atalhos_comandos/`
- 🔧 **Comandos de emergência** documentados
- 📊 **Exemplos práticos** de uso

---

**🎯 SISTEMA ROBUSTO E TOTALMENTE DOCUMENTADO!**

