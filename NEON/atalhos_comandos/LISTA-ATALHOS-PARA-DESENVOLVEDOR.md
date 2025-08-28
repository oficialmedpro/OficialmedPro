# ⚡ ATALHOS SPRINTHUB SYNC - GUIA DESENVOLVEDOR

**📅 Data:** 18/08/2025  
**🎯 Sistema:** Sincronização SprintHub ↔ Supabase  
**📍 Servidor VPS:** `/opt/sprinthub-sync/`

---

## 🚀 **ATALHOS DISPONÍVEIS:**

### **🔍 VERIFICAÇÃO E MONITORAMENTO:**
| **Comando** | **Função** | **Tempo** |
|-------------|------------|-----------|
| `verificar-sync` | Verifica integridade: compara TODAS oportunidades SprintHub vs Supabase | ~5-10 min |
| `sync-status` | Mostra se container Docker está rodando | Instantâneo |
| `sync-logs` | Exibe logs do container para debug | Instantâneo |
| `sync-cron` | Mostra configuração do cron (horários programados) | Instantâneo |

### **🔄 SINCRONIZAÇÃO:**
| **Comando** | **Função** | **Tempo** |
|-------------|------------|-----------|
| `sync-manual` | Executa sincronização incremental manual (INSERT + UPDATE) | ~2-5 min |

### **🔧 MANUTENÇÃO:**
| **Comando** | **Função** | **Tempo** |
|-------------|------------|-----------|
| `sync-restart` | Reinicia container Docker (resolve travamentos) | ~30 seg |
| `goto-sync` | Vai para pasta `/opt/sprinthub-sync/` e lista arquivos | Instantâneo |

---

## 📊 **SISTEMA AUTOMÁTICO:**

### **🤖 FUNCIONAMENTO:**
- **Executa:** A cada 2 horas (6h, 8h, 10h, 12h, 14h, 16h, 18h, 20h, 22h)
- **Fuso:** São Paulo (America/Sao_Paulo)
- **Função:** INSERT novas + UPDATE existentes
- **Volume:** ~19.000 oportunidades, 65 campos cada

### **📊 DADOS SINCRONIZADOS:**
- **Funil 1:** COMERCIAL APUCARANA (7 etapas)
- **Funil 2:** RECOMPRA (18 etapas)
- **Total:** 25 etapas, 65 campos por oportunidade

---

## 📋 **ROTINA OPERACIONAL:**

### **🌅 DIÁRIO (recomendado):**
```bash
sync-status        # Verificar se está funcionando
verificar-sync     # Verificar integridade dos dados
```

### **🔧 SEMANAL:**
```bash
sync-logs          # Ver logs da semana
goto-sync          # Verificar arquivos
```

### **🚨 EMERGÊNCIA:**
```bash
sync-logs          # Ver o que deu errado
sync-restart       # Reiniciar se travou
sync-manual        # Forçar sincronização
verificar-sync     # Confirmar se corrigiu
```

---

## 📊 **INTERPRETAÇÃO DOS RESULTADOS:**

### **✅ NORMAL (verificar-sync):**
```
📊 Taxa de Sincronização: 99.5%+
❌ Total Ausentes: 0-10 oportunidades
🔄 Total Desatualizadas: 0-5 oportunidades
```

### **⚠️ ATENÇÃO (sync-manual):**
```
📊 Taxa de Sincronização: 95-99%
❌ Total Ausentes: 10-100 oportunidades
```

### **🚨 CRÍTICO (investigar):**
```
📊 Taxa de Sincronização: <95%
❌ Total Ausentes: >100 oportunidades
```

---

## 🔧 **ARQUIVOS NO SERVIDOR:**

| **Arquivo** | **Função** |
|-------------|------------|
| `sync-incremental.js` | Script automático principal |
| `verificador-sincronizacao.js` | Script de verificação |
| `docker-compose.yml` | Configuração do container |
| `relatorio-verificacao.json` | Último relatório gerado |

---

## 📞 **SUPORTE:**

### **🆘 PROBLEMAS COMUNS:**
1. **Container parado:** `sync-restart`
2. **Dados desatualizados:** `sync-manual`
3. **Erro de rede:** Aguardar próxima execução automática
4. **Erro de permissão:** Verificar Supabase

### **📊 DADOS TÉCNICOS:**
- **SprintHub API:** `sprinthub-api-master.sprinthub.app`
- **Supabase:** `agdffspstbxeqhqtltvb.supabase.co`
- **Tabela:** `api.oportunidade_sprint`
- **Container:** `sprinthub-sync-cron`

---

**🎯 COPIE ESTA LISTA PARA O DESENVOLVEDOR - CONTÉM TUDO QUE ELE PRECISA!**




