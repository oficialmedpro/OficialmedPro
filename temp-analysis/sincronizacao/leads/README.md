# 🎯 Sincronização de Leads - OficialMed

Esta pasta contém os scripts e documentação para sincronização de **leads** do SprintHub para o Supabase.

## 📁 Estrutura dos Arquivos

- **`sync-leads.js`** - Script principal de sincronização (Node.js)
- **`tabela-leads-supabase.sql`** - Estrutura da tabela para criar no Supabase
- **`README.md`** - Este arquivo (documentação)

## 🎯 Objetivo

Sincronizar **todos os leads** do SprintHub para criar uma base sólida para:
- **Análise RFV** (Recência, Frequência, Valor)
- **Relacionamento** com oportunidades via `lead_id`
- **Dashboard de leads** e métricas de conversão

## 📊 Dados da API

### **Endpoint Base:**
```
GET https://sprinthub-api-master.sprinthub.app/leads?i=oficialmed
```

### **Endpoint com Detalhes:**
```
GET https://sprinthub-api-master.sprinthub.app/leads/{ID}?i=oficialmed&allFields=1
```

### **Estimativa:**
- **Total de leads:** ~1.134
- **Tempo de sincronização:** 5-15 minutos
- **Processamento:** 10 leads em paralelo

## 🗃️ Campos Sincronizados

### **📋 Identificação:**
- `id` - ID único do SprintHub
- `fullname` - Nome completo
- `firstname` - Primeiro nome
- `lastname` - Último nome

### **📞 Contato:**
- `email` - Email principal
- `phone` - Telefone fixo
- `whatsapp` - WhatsApp
- `mobile` - Celular

### **📍 Localização:**
- `address` - Endereço
- `city` - Cidade
- `state` - Estado
- `country` - País
- `zipcode` - CEP
- `timezone` - Fuso horário

### **🏢 Dados Comerciais:**
- `points` - Pontuação do lead
- `owner` - Proprietário/responsável
- `stage` - Estágio no funil
- `company` - Empresa

### **🔒 Controle:**
- `user_access` - Usuários com acesso (JSON)
- `department_access` - Departamentos com acesso (JSON)
- `archived` - Status de arquivamento
- `created_at` - Data de criação
- `updated_at` - Data de atualização
- `synced_at` - Data da sincronização

## 🚀 Como Usar

### **1. Criar a Tabela no Supabase:**
```sql
-- Execute o conteúdo do arquivo tabela-leads-supabase.sql
-- no SQL Editor do Supabase
```

### **2. Executar Sincronização:**
```bash
# Navegar para a pasta do projeto
cd C:\oficialmed_pro\minha-pwa

# Instalar dependências (se necessário)
npm install dotenv

# Executar sincronização
node src/sincronizacao/leads/sync-leads.js
```

### **3. Acompanhar Progresso:**
- ✅ **Progress bar visual** no terminal
- ✅ **Estatísticas em tempo real**
- ✅ **Checkpoint automático** para recuperação
- ✅ **Relatório final detalhado**

## 📈 Benefícios para Análise RFV

### **🔗 Relacionamento com Oportunidades:**
```sql
-- Exemplo: Leads que geraram oportunidades
SELECT
    l.fullname,
    l.email,
    COUNT(o.id) as total_oportunidades,
    SUM(o.value) as valor_total
FROM api.leads l
LEFT JOIN api.oportunidade_sprint o ON l.id = o.lead_id
GROUP BY l.id, l.fullname, l.email
ORDER BY valor_total DESC;
```

### **🎯 Métricas de Conversão:**
```sql
-- Taxa de conversão Lead → Oportunidade
SELECT
    COUNT(DISTINCT l.id) as total_leads,
    COUNT(DISTINCT o.lead_id) as leads_convertidos,
    ROUND((COUNT(DISTINCT o.lead_id)::float / COUNT(DISTINCT l.id)) * 100, 2) as taxa_conversao
FROM api.leads l
LEFT JOIN api.oportunidade_sprint o ON l.id = o.lead_id;
```

## 🔧 Configuração

### **Variáveis de Ambiente (.env):**
```env
VITE_SUPABASE_URL=https://agdffspstbxeqhqtltvb.supabase.co
VITE_SUPABASE_SERVICE_ROLE_KEY=eyJ...
VITE_SPRINTHUB_BASE_URL=sprinthub-api-master.sprinthub.app
VITE_SPRINTHUB_INSTANCE=oficialmed
VITE_SPRINTHUB_API_TOKEN=9ad36c85-5858-4960-9935-e73c3698dd0c
```

## 🛠️ Estrutura do Script

### **📥 Fluxo de Sincronização:**
1. **Buscar lista** de leads (paginado)
2. **Para cada lead:** buscar detalhes completos
3. **Verificar** se já existe no Supabase
4. **Inserir/Atualizar** conforme necessário
5. **Checkpoint** automático a cada 50 registros

### **🔄 Lógica de Atualização:**
- **Inserir:** Se não existe no Supabase
- **Atualizar:** Se `updatedAt` do SprintHub > `synced_at` do Supabase
- **Pular:** Se já está atualizado

## 📊 Monitoramento

### **🎯 Métricas do Script:**
- Total de chamadas à API
- Leads processados
- Inserções realizadas
- Atualizações feitas
- Registros pulados
- Erros encontrados
- Taxa de sucesso

### **📈 Exemplo de Saída:**
```
📊 RELATÓRIO FINAL - SINCRONIZAÇÃO COMPLETA DE LEADS
============================================================
🕒 Tempo de execução: 847.2s (14.1 minutos)
🔄 Total de chamadas à API: 1245
📊 Total leads processados: 1134
💾 ESTATÍSTICAS DE SINCRONIZAÇÃO:
   ✅ Inseridos: 1134
   🔄 Atualizados: 0
   ⚪ Já atualizados: 0
   ❌ Erros: 0
📈 Taxa de sucesso: 100.00%
============================================================
✅ SINCRONIZAÇÃO COMPLETA DE LEADS CONCLUÍDA!
```

## 🔜 Próximos Passos

1. **✅ Executar sincronização** inicial de leads
2. **🔗 Relacionar** com oportunidades existentes
3. **🎯 Implementar análise RFV** baseada nos dados
4. **📊 Criar dashboards** de conversão
5. **⚡ Automatizar** sincronização periódica

---

📝 **Criado em:** Dezembro 2024
🤖 **Desenvolvido por:** Claude Code
📧 **Suporte:** Verificar logs do console para debugging