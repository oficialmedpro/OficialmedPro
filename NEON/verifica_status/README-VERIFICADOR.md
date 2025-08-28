# 🔍 VERIFICADOR DE SINCRONIZAÇÃO

**📅 Data:** 18/08/2025  
**🎯 Objetivo:** Verificar integridade da sincronização SprintHub ↔ Supabase  

---

## 🚀 **COMO EXECUTAR:**

### **🌐 NA VPS (recomendado):**
```bash
cd /opt/sprinthub-sync
node verificador-sincronizacao.js
```

### **🖥️ LOCAL (para testar):**
```bash
node verificador-sincronizacao.js
```

---

## 📊 **O QUE O VERIFICADOR FAZ:**

### **🔍 ANÁLISE COMPLETA:**
- ✅ **Conta** todas as oportunidades no SprintHub (25 etapas)
- 🔍 **Verifica** se cada uma existe no Supabase
- 📅 **Compara** datas de atualização (`update_date`)
- 📊 **Calcula** percentuais de sincronização por etapa

### **📋 DETECTA PROBLEMAS:**
- ❌ **Oportunidades ausentes** no Supabase
- 🔄 **Oportunidades desatualizadas** (SprintHub mais recente)
- 📊 **Inconsistências** de dados

### **💾 GERA RELATÓRIOS:**
- 📺 **Console**: Relatório detalhado em tempo real
- 📄 **Arquivo**: `relatorio-verificacao.json` com dados estruturados

---

## 📊 **EXEMPLO DE SAÍDA:**

```
🔍 VERIFICADOR DE SINCRONIZAÇÃO SPRINTHUB ↔ SUPABASE
============================================================
📅 18/08/2025, 19:15:42

🎯 [1] COMERCIAL APUCARANA
--------------------------------------------------
   📂 [0] ENTRADA (ID: 130)
      📊 SprintHub: 1.245 oportunidades
      ✅ Supabase: 1.243/1.245 (99.8%)
      ❌ Ausentes: 2

   📂 [1] ACOLHIMENTO/TRIAGEM (ID: 231)
      📊 SprintHub: 892 oportunidades
      ✅ Supabase: 892/892 (100.0%)

🎯 [2] RECOMPRA
--------------------------------------------------
   📂 [X] PROMO (ID: 227)
      📊 SprintHub: 5.107 oportunidades
      ✅ Supabase: 5.106/5.107 (99.9%)
      ❌ Ausentes: 1

============================================================
📊 RELATÓRIO FINAL DE VERIFICAÇÃO
============================================================
📈 Total SprintHub: 19.163 oportunidades
✅ Total Supabase: 19.159 oportunidades  
❌ Total Ausentes: 4 oportunidades
🔄 Total Desatualizadas: 0 oportunidades
📊 Taxa de Sincronização: 99.98%

❌ OPORTUNIDADES AUSENTES NO SUPABASE:
--------------------------------------------------
   ID: 70801 | TESTE CLIENTE | [1] COMERCIAL APUCARANA > [0] ENTRADA
   ID: 70802 | NOVA OPORTUNIDADE | [2] RECOMPRA > [X] PROMO
   ID: 70803 | FOLLOW UP | [1] COMERCIAL APUCARANA > [5] FOLLOW UP
   ID: 70804 | NEGOCIAÇÃO | [2] RECOMPRA > [4] NEGOCIAÇÃO

🎯 RECOMENDAÇÕES:
------------------------------
   ➕ Execute sync-incremental.js para inserir 4 registros ausentes

✅ Verificação concluída!
💾 Relatório salvo em: relatorio-verificacao.json
```

---

## 📋 **ARQUIVO JSON GERADO:**

```json
{
  "dataVerificacao": "2025-08-18T22:15:42.123Z",
  "totalSprintHub": 19163,
  "totalSupabase": 19159,
  "totalAusentes": 4,
  "totalDesatualizadas": 0,
  "percentualSincronizacao": "99.98",
  "idsAusentes": [
    {
      "id": 70801,
      "title": "TESTE CLIENTE",
      "funil": "[1] COMERCIAL APUCARANA",
      "etapa": "[0] ENTRADA",
      "createDate": "2025-08-18T19:30:00.000Z"
    }
  ],
  "idsDesatualizadas": []
}
```

---

## ⏰ **QUANDO EXECUTAR:**

### **📅 ROTINA RECOMENDADA:**
- 🌅 **Manhã**: Antes de começar o trabalho
- 🌆 **Final do dia**: Para verificar sincronização
- 🔄 **Após problemas**: Para diagnosticar inconsistências
- 📊 **Semanalmente**: Para relatórios gerenciais

### **🚨 QUANDO EXECUTAR IMEDIATAMENTE:**
- ❌ Após erros na sincronização automática
- 🔧 Após manutenção no servidor
- 📊 Antes de apresentar relatórios importantes
- 🆕 Após adicionar novos campos/funcionalidades

---

## 🔧 **COMANDOS ÚTEIS:**

### **Ver último relatório:**
```bash
cat relatorio-verificacao.json | jq '.'
```

### **Executar e salvar log:**
```bash
node verificador-sincronizacao.js > verificacao-$(date +%Y%m%d-%H%M).log 2>&1
```

### **Verificar apenas resumo:**
```bash
node verificador-sincronizacao.js | tail -20
```

---

## ⚠️ **IMPORTANTE:**

- 🕐 **Tempo de execução**: ~5-10 minutos (depende do volume)
- 🌐 **Rate limiting**: 50ms entre requisições (evita sobrecarga)
- 💾 **Relatório JSON**: Limitado a 100 ausentes + 50 desatualizadas
- 🔄 **Não altera dados**: Apenas verifica e reporta

---

**🎯 FERRAMENTA ESSENCIAL PARA MONITORAMENTO DA SINCRONIZAÇÃO!**


