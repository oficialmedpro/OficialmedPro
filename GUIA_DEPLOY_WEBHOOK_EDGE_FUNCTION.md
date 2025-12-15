# 🚀 Guia Rápido - Deploy Edge Function via Editor do Supabase

## ✅ Opção Recomendada: Via Editor

Como o código já está pronto, você pode usar o editor do Supabase diretamente no navegador!

## 📋 Passo a Passo

### 1️⃣ Acessar o Dashboard
1. Acesse: https://supabase.com/dashboard/project/agdffspstbxeqhqtltvb
2. Vá em **Edge Functions** no menu lateral
3. Clique em **Deploy a new function**
4. Selecione **Via Editor**

### 2️⃣ Criar a Função
1. **Nome da função:** `webhook-oportunidade-sprint`
2. Cole o código abaixo no editor:

```typescript
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Tipos para o payload do webhook
interface WebhookPayload {
  type: 'INSERT' | 'UPDATE' | 'DELETE';
  table: string;
  schema: string;
  record: Record<string, any>;
  old_record: Record<string, any> | null;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Max-Age': '86400'
      }
    });
  }

  console.log('📥 Webhook recebido - oportunidade_sprint');
  console.log(`📅 Timestamp: ${new Date().toISOString()}`);
  console.log(`🔧 Method: ${req.method}`);

  try {
    // Verificar método
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Método não permitido. Use POST.' }),
        {
          status: 405,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Parse do payload
    const payload: WebhookPayload = await req.json();
    
    console.log(`📊 Tipo de evento: ${payload.type}`);
    console.log(`📋 Tabela: ${payload.table}`);
    console.log(`🗄️ Schema: ${payload.schema}`);

    // Validar que é da tabela correta
    if (payload.table !== 'oportunidade_sprint') {
      console.warn(`⚠️ Tabela incorreta: ${payload.table} (esperado: oportunidade_sprint)`);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Tabela incorreta: ${payload.table}` 
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Processar diferentes tipos de eventos
    switch (payload.type) {
      case 'INSERT':
        await handleInsert(payload);
        break;
      
      case 'UPDATE':
        await handleUpdate(payload);
        break;
      
      case 'DELETE':
        await handleDelete(payload);
        break;
      
      default:
        console.warn(`⚠️ Tipo de evento desconhecido: ${payload.type}`);
    }

    // Resposta de sucesso
    return new Response(
      JSON.stringify({ 
        success: true,
        message: `Evento ${payload.type} processado com sucesso`,
        timestamp: new Date().toISOString()
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('❌ Erro ao processar webhook:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message || 'Erro desconhecido',
        timestamp: new Date().toISOString()
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
});

/**
 * Processa evento INSERT (nova oportunidade criada)
 */
async function handleInsert(payload: WebhookPayload) {
  const record = payload.record;
  
  console.log('✅ Processando INSERT');
  console.log(`🆔 ID da oportunidade: ${record.id}`);
  console.log(`📋 Título: ${record.title}`);
  console.log(`💰 Valor: ${record.value}`);
  console.log(`👤 Lead ID: ${record.lead_id}`);
  
  // Verificar se entrada_compra já está preenchida no INSERT
  if (record.entrada_compra) {
    console.log(`📅 entrada_compra preenchida no INSERT: ${record.entrada_compra}`);
    await processarEntradaCompra(record);
  }
}

/**
 * Processa evento UPDATE (oportunidade atualizada)
 */
async function handleUpdate(payload: WebhookPayload) {
  const record = payload.record;
  const oldRecord = payload.old_record;
  
  console.log('🔄 Processando UPDATE');
  console.log(`🆔 ID da oportunidade: ${record.id}`);
  
  // Verificar se entrada_compra foi preenchida (mudou de null para um valor)
  if (
    oldRecord && 
    !oldRecord.entrada_compra && 
    record.entrada_compra
  ) {
    console.log('🎯 Campo entrada_compra foi preenchido!');
    console.log(`📅 Novo valor: ${record.entrada_compra}`);
    await processarEntradaCompra(record);
  }
  
  // Verificar outras mudanças importantes
  if (oldRecord) {
    if (oldRecord.status !== record.status) {
      console.log(`📊 Status mudou: ${oldRecord.status} → ${record.status}`);
    }
    
    if (oldRecord.value !== record.value) {
      console.log(`💰 Valor mudou: ${oldRecord.value} → ${record.value}`);
    }
  }
}

/**
 * Processa evento DELETE (oportunidade deletada)
 */
async function handleDelete(payload: WebhookPayload) {
  const oldRecord = payload.old_record;
  
  console.log('🗑️ Processando DELETE');
  if (oldRecord) {
    console.log(`🆔 ID da oportunidade deletada: ${oldRecord.id}`);
    console.log(`📋 Título: ${oldRecord.title}`);
  }
}

/**
 * Processa especificamente quando entrada_compra é preenchido/atualizado
 */
async function processarEntradaCompra(record: any) {
  console.log('📥 Processando entrada_compra');
  console.log(`🆔 Oportunidade ID: ${record.id}`);
  console.log(`📅 entrada_compra: ${record.entrada_compra}`);
  console.log(`👤 Lead ID: ${record.lead_id}`);
  console.log(`💰 Valor: ${record.value}`);
  console.log(`📊 Status: ${record.status}`);
  
  // Criar cliente Supabase para operações adicionais se necessário
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  
  if (!supabaseUrl || !supabaseServiceKey) {
    console.warn('⚠️ Variáveis de ambiente do Supabase não configuradas');
    return;
  }
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  // Aqui você pode implementar lógicas específicas:
  // 
  // 1. Registrar log de auditoria
  // 2. Atualizar métricas do vendedor
  // 3. Enviar notificação
  // 4. Sincronizar com sistema externo
  // 5. Disparar outras ações automáticas
  
  console.log('✅ entrada_compra processado com sucesso');
}
```

### 3️⃣ Fazer Deploy
1. Clique em **Deploy**
2. Aguarde o deploy completar

### 4️⃣ Configurar Secrets (se necessário)
Se a função precisar acessar o Supabase, configure as secrets:
- Vá em **Settings → Edge Functions → Secrets**
- Adicione:
  - `SUPABASE_URL`: `https://agdffspstbxeqhqtltvb.supabase.co`
  - `SUPABASE_SERVICE_ROLE_KEY`: (sua service role key)

## 🎯 URL da Edge Function

Após o deploy, a função estará disponível em:
```
https://agdffspstbxeqhqtltvb.supabase.co/functions/v1/webhook-oportunidade-sprint
```

## 📝 Próximo Passo: Configurar o Webhook

Depois que a função estiver deployada, volte para configurar o webhook no Supabase:

1. Acesse: **Database → Webhooks**
2. Use esta URL no webhook:
   ```
   https://agdffspstbxeqhqtltvb.supabase.co/functions/v1/webhook-oportunidade-sprint
   ```

---

## 🔄 Alternativa: Via CLI (Se Preferir)

Se quiser usar o CLI no futuro, instale via **Scoop** no Windows:

```powershell
# Instalar Scoop (se não tiver)
Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
irm get.scoop.sh | iex

# Instalar Supabase CLI
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase
```

Depois:
```bash
supabase login
supabase link --project-ref agdffspstbxeqhqtltvb
supabase functions deploy webhook-oportunidade-sprint
```

