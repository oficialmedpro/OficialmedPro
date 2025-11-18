# 📅 LÓGICA DA BUSCA PARA DATA

## **PADRÃO OBRIGATÓRIO PARA TODAS AS CONSULTAS POR DATA**

### **Estrutura dos Campos de Data no Supabase:**

1. **create_date**: `2025-09-05 23:46:49-03` (timestamptz com hora e timezone)
2. **update_date**: `2025-09-05` (apenas data)
3. **gain_date**: `2025-09-05` ou `2025-09-05T12:30:00Z` (pode ter hora)

### **❌ FORMA ERRADA (não funciona com campos timestamptz):**
```sql
WHERE create_date = '2025-09-05'  -- Não encontra registros com hora
```

### **✅ FORMA CORRETA (funciona sempre):**
```sql
WHERE create_date >= '2025-09-05'         -- Início do dia (00:00:00)
  AND create_date < '2025-09-06'          -- Antes do próximo dia
```

### **🎯 EXEMPLO PRÁTICO - OPORTUNIDADES CRIADAS ONTEM QUE GANHARAM:**
```sql
SELECT id, title, value, create_date, gain_date, lead_firstname, lead_whatsapp
FROM api.oportunidade_sprint
WHERE archived = 0
  AND status = 'gain'
  AND create_date >= '2025-09-05'         -- Início do dia 05/09
  AND create_date < '2025-09-06'          -- Antes do dia 06/09
```

### **🔄 TRADUÇÃO PARA SUPABASE REST API:**
```
/rest/v1/oportunidade_sprint?select=id,title,value,create_date,gain_date,lead_firstname,lead_whatsapp
&archived=eq.0
&status=eq.gain
&create_date=gte.2025-09-05
&create_date=lt.2025-09-06
```

### **📝 REGRAS IMPORTANTES:**

1. **SEMPRE usar intervalo de datas** (`>=` e `<`) para campos timestamptz
2. **Data de início**: `gte.YYYY-MM-DD` (maior ou igual)
3. **Data de fim**: `lt.YYYY-MM-DD+1` (menor que o próximo dia)
4. **Nunca usar** `eq.YYYY-MM-DD` em campos com hora
5. **Aplicar em todos os campos**: create_date, update_date, gain_date, lost_date

### **🎯 CASOS DE USO:**

#### **Buscar criadas hoje:**
```sql
WHERE create_date >= '2025-09-06'
  AND create_date < '2025-09-07'
```

#### **Buscar ganhas ontem:**
```sql
WHERE gain_date >= '2025-09-05'
  AND gain_date < '2025-09-06'
```

#### **Buscar período (últimos 7 dias):**
```sql
WHERE create_date >= '2025-08-30'
  AND create_date < '2025-09-06'
```

### **🚨 SEMPRE APLICAR ESTA LÓGICA:**
- ✅ Em todos os services (thermometerService, etc.)
- ✅ Em todos os componentes que filtram por data
- ✅ Em todas as consultas manuais
- ✅ Em relatórios e dashboards

---
**📋 CRIADO EM:** 06/09/2025  
**🎯 APLICAR EM:** Todos os códigos que fazem busca por data  
**🔄 REVISAR:** Sempre que houver problemas com filtros de data