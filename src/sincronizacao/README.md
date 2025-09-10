# 🔄 Scripts de Sincronização OficialMed

Esta pasta contém todos os scripts e ferramentas para sincronização entre SprintHub (CRM) e Supabase.

## 📁 Estrutura dos Arquivos

### 🚀 Scripts Node.js (Terminal)
- **`sync-funil14.js`** - Sincronização completa Funil 14 (RECOMPRA)
- **`package-sync.json`** - Dependências dos scripts Node.js

### 📊 Scripts Browser (Interface Web)
- **`../components/TopMenuBar.jsx`** - Botões de sincronização na interface
  - 🔍 Auditoria Ganhas
  - 🔄 Sync Completo F14
  - 📅 Atualização Semanal
  - 🕐 Sincronização Horária

### 📚 Documentação
- **`README.md`** - Este arquivo (índice geral)
- **`CLAUDE_LOGGER_GUIDE.md`** - Guia do sistema de logs otimizado

## ⚡ Scripts Disponíveis

### 1. **Sincronização Completa Funil 14 (Node.js)**
```bash
# Instalar dependências
npm install dotenv

# Executar sincronização
node src/sincronizacao/sync-funil14.js
```

**Características:**
- ✅ **3.137 oportunidades** do Funil 14 (RECOMPRA)
- ✅ **TODOS os status** (gain, open, lost, etc.)
- ✅ **Tempo:** 5-10 minutos
- ✅ **Processamento paralelo:** 10 oportunidades por vez
- ✅ **Progress visual** no terminal
- ✅ **Checkpoint system** (recupera se interrompido)

### 2. **Auditoria de Oportunidades Ganhas (Browser)**
```javascript
// Botão: 🔍 Auditoria Ganhas
// Compara CRM vs Supabase (período 02/09 a 09/09/2025)
```

### 3. **Sincronizações Regulares (Browser)**
- **📅 Atualização Semanal** - Últimos 7 dias
- **🕐 Sincronização Horária** - Oportunidades de hoje
- **⏰ Toggle Automático** - Sincronização automática

## 🎯 Mapeamento Funil → Unidade

```javascript
const funnelUnitMap = {
  6: '[1]',   // Funil COMERCIAL → Apucarana  
  14: '[1]',  // Funil RECOMPRA → Apucarana
  // Futuras unidades serão adicionadas aqui
};
```

## 📊 Estatísticas Atuais

### **Dados no CRM (SprintHub):**
- **Funil 6 (COMERCIAL):** ~13.701 oportunidades
- **Funil 14 (RECOMPRA):** ~3.137 oportunidades
- **Total:** ~16.838 oportunidades

### **Dados no Supabase (antes da sincronização):**
- **Funil 6:** 107 oportunidades ganhas
- **Funil 14:** 36 oportunidades ganhas
- **Gap identificado:** ~258 oportunidades ganhas faltantes

## 🔧 Configuração

### **Variáveis de Ambiente (.env):**
```env
VITE_SUPABASE_URL=https://agdffspstbxeqhqtltvb.supabase.co
VITE_SUPABASE_SERVICE_ROLE_KEY=eyJ...
VITE_SPRINTHUB_BASE_URL=sprinthub-api-master.sprinthub.app
VITE_SPRINTHUB_INSTANCE=oficialmed
VITE_SPRINTHUB_API_TOKEN=9ad36c85-5858-4960-9935-e73c3698dd0c
```

## 🚀 Como Usar

### **Para Sincronização Completa (Recomendado):**
1. Abrir terminal na pasta do projeto
2. `npm install dotenv` (primeira vez)
3. `node src/sincronizacao/sync-funil14.js`
4. Aguardar 5-10 minutos
5. Verificar relatório final

### **Para Sincronizações Pontuais:**
1. Abrir aplicação web
2. Usar botões no menu superior
3. Acompanhar progress na barra verde

## 📈 Próximos Passos

1. **✅ Funil 14** - Script Node.js pronto
2. **🔄 Funil 6** - Criar script similar (13.701 oportunidades)
3. **🏢 Outras Unidades** - Mapear novos funis quando necessário
4. **⚡ Otimizações** - Melhorar performance conforme necessário

## 🆘 Resolução de Problemas

### **CORS no Browser:**
- Problema comum em desenvolvimento
- **Solução:** Usar scripts Node.js em vez dos botões web

### **Timeout:**
- Scripts Node.js não têm timeout
- **Recovery:** Sistema de checkpoint automático

### **Rate Limiting:**
- Processamento em batches de 10
- **Ajuste:** Modificar `BATCH_SIZE` se necessário

---

📝 **Última atualização:** Dezembro 2024  
🤖 **Criado por:** Claude Code  
📧 **Suporte:** Verifique logs no console para debugging