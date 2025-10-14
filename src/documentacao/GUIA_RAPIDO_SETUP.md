# 🚀 Guia Rápido: Configuração de Segmentos Automáticos

## 📋 Ordem de Execução

Execute os scripts **NA ORDEM EXATA** abaixo no **SQL Editor do Supabase**:

---

## ✅ PASSO 1: Criar as Tabelas e Permissões

📄 **Arquivo**: `src/documentacao/PASSO_A_PASSO_SETUP.sql`

```sql
-- Cole TODO o conteúdo do arquivo PASSO_A_PASSO_SETUP.sql aqui
```

**Resultado esperado**: 
- ✅ Tabelas criadas
- ✅ Índices criados
- ✅ Políticas RLS configuradas
- ✅ Grants aplicados

---

## 🔍 PASSO 2: Verificar Segmentos Disponíveis

📄 **Arquivo**: `src/documentacao/debug_segmentos.sql`

Execute **APENAS AS PRIMEIRAS QUERIES** (não execute o INSERT comentado ainda):

```sql
-- 1. Ver todos os segmentos disponíveis
SELECT 
    id,
    name,
    alias,
    is_published,
    total_leads,
    last_lead_update
FROM api.segmento 
ORDER BY name;
```

**Anote o ID do segmento que você quer automatizar (ex: D15)**

---

## ⚙️ PASSO 3: Configurar Segmento Automático

### Opção A: Via Interface Web (RECOMENDADO)

1. Acesse: `http://localhost:5173/callix`
2. Clique na tab **"🤖 Segmentos Automáticos"**
3. Selecione o segmento D15
4. Configure:
   - **Frequência**: 6 horas
   - **Enviar Callix**: ✅ Sim
   - **Ativar**: ✅ Sim
5. Clique em **"Adicionar"**

### Opção B: Via SQL (se a interface não funcionar)

```sql
-- Substitua 123 pelo ID real do segmento D15 que você anotou no passo 2
INSERT INTO api.segmento_automatico (
    segmento_id, 
    nome, 
    ativo, 
    enviar_callix, 
    frequencia_horas,
    proxima_execucao
) VALUES (
    123, -- ⚠️ SUBSTITUA PELO ID REAL
    'Segmento D15 - Automático',
    true,
    true,
    6,
    NOW() + INTERVAL '1 hour'
) ON CONFLICT (segmento_id) DO UPDATE SET
    nome = EXCLUDED.nome,
    ativo = EXCLUDED.ativo,
    enviar_callix = EXCLUDED.enviar_callix,
    frequencia_horas = EXCLUDED.frequencia_horas;
```

---

## ⏰ PASSO 4: Configurar Cron Job

📄 **Arquivo**: `src/documentacao/auto_segments_cron_setup.sql`

Execute **APENAS O CRON JOB** (linhas 6-15):

```sql
SELECT cron.schedule(
    'process_auto_segments',
    '*/30 * * * *', -- A cada 30 minutos
    $$ 
    SELECT net.http_get(
        'https://agdffspstbxeqhqtltvb.supabase.co/functions/v1/process-auto-segments',
        headers => '{"Authorization": "Bearer sb_secret_alcgQVSO5zQ5hLtRunyRlg_N9GymGor"}'::jsonb
    );
    $$
);
```

**Verificar se foi criado**:
```sql
SELECT * FROM cron.job WHERE jobname = 'process_auto_segments';
```

---

## ✅ PASSO 5: Testar Manualmente

### Via Interface Web:
1. Vá para a página Callix
2. Tab **"Importação Manual"**
3. Selecione o segmento D15
4. Clique em **"🚀 Importar e Enriquecer Leads"**
5. Aguarde e verifique os logs

### Via SQL:
```sql
-- Testar a Edge Function manualmente
SELECT net.http_get(
    'https://agdffspstbxeqhqtltvb.supabase.co/functions/v1/process-auto-segments',
    headers => '{"Authorization": "Bearer sb_secret_alcgQVSO5zQ5hLtRunyRlg_N9GymGor"}'::jsonb
);
```

---

## 📊 PASSO 6: Monitorar

### Ver segmentos configurados:
```sql
SELECT 
    sa.id,
    sa.nome,
    sa.ativo,
    sa.enviar_callix,
    sa.frequencia_horas,
    s.name as segmento_nome_real,
    s.total_leads,
    sa.ultima_execucao,
    sa.proxima_execucao,
    sa.total_leads_processados,
    sa.total_leads_enviados_callix
FROM api.segmento_automatico sa
JOIN api.segmento s ON sa.segmento_id = s.id;
```

### Ver leads processados hoje:
```sql
SELECT 
    COUNT(*) as total_processados_hoje,
    COUNT(*) FILTER (WHERE enviado_callix = true) as enviados_callix_hoje
FROM api.leads 
WHERE DATE(data_envio_callix) = CURRENT_DATE;
```

---

## 🆘 Troubleshooting

### Erro: "relation does not exist"
➡️ Você pulou o PASSO 1. Execute o `PASSO_A_PASSO_SETUP.sql`

### Erro: "null value in column segmento_id"
➡️ O ID do segmento não foi encontrado. Execute o PASSO 2 para ver os IDs disponíveis

### Erro: "Edge Function timeout"
➡️ A função pode estar processando muitos leads. Reduza o `limit` na Edge Function de 100 para 50

### Cron job não executa
➡️ Verifique se a extensão `pg_cron` está habilitada:
```sql
CREATE EXTENSION IF NOT EXISTS pg_cron;
```

---

## ✅ Checklist Final

- [ ] Tabelas criadas (PASSO 1)
- [ ] Segmentos visíveis no banco (PASSO 2)
- [ ] Segmento D15 configurado como automático (PASSO 3)
- [ ] Cron job agendado (PASSO 4)
- [ ] Teste manual funcionando (PASSO 5)
- [ ] Monitoramento configurado (PASSO 6)

---

## 🎉 Pronto!

Agora o sistema vai:
- ✅ Buscar leads do segmento D15 automaticamente
- ✅ Enriquecer com dados completos
- ✅ Enviar para Callix (sem duplicar)
- ✅ Atualizar a cada 6 horas
- ✅ Registrar tudo no banco

**Tempo total de setup: 10-15 minutos** ⏱️
