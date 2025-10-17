# 📚 Índice - Sistema de Sincronização Automática

## 📖 Documentação Completa

### **1️⃣ README Principal** (Começar aqui!)
📄 [`README_SYNC_AUTOMATICO.md`](./README_SYNC_AUTOMATICO.md)
- Visão geral do sistema
- Como funciona
- Deploy rápido
- Verificações básicas

### **2️⃣ Guia de Deploy Completo**
📄 [`DEPLOY_SYNC_HOURLY_CRON.md`](./DEPLOY_SYNC_HOURLY_CRON.md)
- Passo a passo detalhado
- Configuração de secrets
- Extensões necessárias
- Testes e validação
- Troubleshooting completo
- Checklist final

### **3️⃣ Comandos Rápidos**
📄 [`COMANDOS_RAPIDOS_SYNC.md`](./COMANDOS_RAPIDOS_SYNC.md)
- Comandos CLI
- Queries SQL úteis
- Monitoramento
- Manutenção
- Diagnóstico

### **4️⃣ SQL Setup Completo**
📄 [`setup_sync_hourly_cron.sql`](./setup_sync_hourly_cron.sql)
- Criação de tabelas
- Views
- Cronjob
- Permissões
- Queries de teste

---

## 💻 Código Fonte

### **Edge Function**
📁 `supabase/functions/sync-hourly-cron/index.ts`
- Função principal de sincronização
- Processa funis 6 e 14
- Registra estatísticas no banco

### **Interface Frontend**
📁 `src/components/TopMenuBar.jsx`
- Display de última/próxima sincronização
- Botão de sincronização manual
- Atualização automática a cada 30s

---

## 🗄️ Estrutura do Banco de Dados

### **Tabela de Controle**
```sql
api.sync_control
```
Registra cada execução com estatísticas completas.

**Campos principais:**
- `started_at` - Timestamp de início
- `completed_at` - Timestamp de conclusão
- `status` - success | error
- `total_processed` - Total de registros processados
- `total_inserted` - Total de novos registros
- `total_updated` - Total de registros atualizados
- `total_errors` - Total de erros
- `execution_time_seconds` - Tempo de execução
- `details` - JSON com informações detalhadas

### **View de Status**
```sql
api.sync_status
```
Mostra última execução e calcula a próxima automaticamente.

**Campos principais:**
- `ultima_sincronizacao` - Timestamp da última execução
- `proxima_sincronizacao` - Timestamp da próxima execução
- `status` - Status da última execução
- `total_processed` - Registros processados
- `details` - Detalhes da execução

---

## 🔑 Secrets Necessárias

Configure no Dashboard do Supabase (**Settings → Edge Functions → Secrets**):

| Secret | Valor | Descrição |
|--------|-------|-----------|
| `VITE_SPRINTHUB_BASE_URL` | `sprinthub-api-master.sprinthub.app` | URL da API SprintHub |
| `VITE_SPRINTHUB_API_TOKEN` | `9ad36c85-5858-4960-9935-e73c3698dd0c` | Token de autenticação |
| `VITE_SPRINTHUB_INSTANCE` | `oficialmed` | Nome da instância |
| `SB_URL` | `https://seu-projeto.supabase.co` | URL do Supabase |
| `SERVICE_KEY` | `sua-service-role-key` | Service Role Key |

---

## ⏰ Horários de Execução

O cronjob executa **automaticamente** às **:45 de cada hora**:

```
00:45 → 01:45 → 02:45 → 03:45 → ... → 23:45
```

**Período sincronizado:** Últimas 48 horas de ambos os funis.

---

## 🎯 Funis Sincronizados

### **Funil 6 - COMERCIAL**
- **Etapas:** 130, 231, 82, 207, 83, 85, 232
- **Unidade:** [1] (Apucarana)

### **Funil 14 - RECOMPRA**
- **Etapas:** 202, 228, 229, 206, 203, 204, 230, 205, 241, 146, 167, 148, 168, 149, 169, 150
- **Unidade:** [1] (Apucarana)

---

## 📊 Como Monitorar

### **Via SQL Editor**
```sql
-- Status atual (última e próxima execução)
SELECT * FROM api.sync_status;

-- Últimas 10 sincronizações
SELECT * FROM api.sync_control
WHERE job_name = 'sync_hourly_cron'
ORDER BY started_at DESC
LIMIT 10;
```

### **Via Dashboard do Supabase**
1. Acesse: **Edge Functions** → `sync-hourly-cron`
2. Clique em **Logs**
3. Veja execuções em tempo real

### **Via Interface (Frontend)**
No **TopMenuBar**, você verá:
- ✅ Última sincronização
- ✅ Próxima sincronização
- ✅ Botão "🕐 AUTO SYNC ATIVO"

---

## 🚀 Deploy em 5 Passos

1. **Deploy da Edge Function**
   ```bash
   supabase functions deploy sync-hourly-cron
   ```

2. **Configurar Secrets**
   Dashboard → Settings → Edge Functions → Secrets

3. **Executar SQL Setup**
   SQL Editor → Executar `setup_sync_hourly_cron.sql`

4. **Configurar Variáveis PostgreSQL**
   ```sql
   ALTER DATABASE postgres SET app.settings.supabase_url = '...';
   ALTER DATABASE postgres SET app.settings.service_role_key = '...';
   ```

5. **Verificar**
   ```sql
   SELECT * FROM cron.job WHERE jobname = 'sync-hourly-cron';
   ```

---

## ✅ Checklist de Funcionalidades

- [x] ✅ Sincronização automática (cronjob às :45)
- [x] ✅ Edge Function otimizada
- [x] ✅ Controle de execuções (tabela)
- [x] ✅ View de status (última/próxima)
- [x] ✅ Interface atualizada
- [x] ✅ Logs detalhados
- [x] ✅ Estatísticas por funil
- [x] ✅ Tratamento de erros
- [x] ✅ Documentação completa

---

## 🔧 Arquivos Criados

### **Novos arquivos:**
```
📁 supabase/functions/sync-hourly-cron/
   └── index.ts                                    # Edge Function

📁 src/documentacao/
   ├── README_SYNC_AUTOMATICO.md                  # README principal
   ├── DEPLOY_SYNC_HOURLY_CRON.md                 # Guia de deploy
   ├── COMANDOS_RAPIDOS_SYNC.md                   # Comandos úteis
   ├── setup_sync_hourly_cron.sql                 # SQL setup
   └── INDICE_SINCRONIZACAO_AUTOMATICA.md         # Este arquivo
```

### **Modificados:**
```
📁 src/components/
   └── TopMenuBar.jsx                             # Interface atualizada
```

---

## 📞 Suporte e Troubleshooting

### **Problema: Cronjob não executa**
👉 Ver: [`DEPLOY_SYNC_HOURLY_CRON.md`](./DEPLOY_SYNC_HOURLY_CRON.md#problema-cronjob-não-está-executando)

### **Problema: Edge Function retorna erro**
👉 Ver: [`DEPLOY_SYNC_HOURLY_CRON.md`](./DEPLOY_SYNC_HOURLY_CRON.md#problema-edge-function-retorna-erro-500)

### **Problema: Interface não atualiza**
👉 Ver: [`DEPLOY_SYNC_HOURLY_CRON.md`](./DEPLOY_SYNC_HOURLY_CRON.md#problema-dados-não-atualizam-na-interface)

### **Comandos de diagnóstico**
👉 Ver: [`COMANDOS_RAPIDOS_SYNC.md`](./COMANDOS_RAPIDOS_SYNC.md#-diagnóstico)

---

## 🎯 Benefícios da Solução

✅ **Automático** - Não precisa de intervenção manual  
✅ **Confiável** - Roda no Supabase (infraestrutura robusta)  
✅ **Monitorável** - Logs e estatísticas completas  
✅ **Escalável** - Processa em lotes otimizados  
✅ **Resiliente** - Continua funcionando mesmo com erros parciais  
✅ **Transparente** - Interface mostra status em tempo real  
✅ **Documentado** - Guias completos de uso e manutenção  

---

## 📝 Notas Importantes

1. **O cronjob roda 24/7** no Supabase, não depende do frontend estar aberto
2. **A interface atualiza automaticamente** a cada 30 segundos
3. **Cada execução é registrada** na tabela `api.sync_control`
4. **Registros antigos podem ser limpos** para manter performance
5. **O sistema pode ser pausado** temporariamente se necessário

---

## 🔄 Atualizações Futuras (Roadmap)

- [ ] Alertas por email/Slack quando houver erro
- [ ] Dashboard de estatísticas em tempo real
- [ ] Sincronização diferencial (apenas modificados)
- [ ] Retry automático em caso de falha
- [ ] Múltiplas unidades
- [ ] Configuração de horários via interface

---

## 📚 Ordem de Leitura Recomendada

1. **Primeiro:** [`README_SYNC_AUTOMATICO.md`](./README_SYNC_AUTOMATICO.md) - Entender o sistema
2. **Depois:** [`DEPLOY_SYNC_HOURLY_CRON.md`](./DEPLOY_SYNC_HOURLY_CRON.md) - Fazer deploy
3. **Referência:** [`COMANDOS_RAPIDOS_SYNC.md`](./COMANDOS_RAPIDOS_SYNC.md) - Comandos úteis
4. **Manutenção:** [`setup_sync_hourly_cron.sql`](./setup_sync_hourly_cron.sql) - SQL completo

---

**✅ Sistema pronto! O cronjob está rodando automaticamente no Supabase.** 🚀

_Última atualização: 16/10/2025_


