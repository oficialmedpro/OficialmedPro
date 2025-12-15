import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Tipos para o payload do webhook do Supabase
interface WebhookPayload {
  type: 'INSERT' | 'UPDATE' | 'DELETE';
  table: string;
  schema: string;
  record: Record<string, any>;
  old_record: Record<string, any> | null;
}

// Campos que são INTEGER/BIGINT e precisam de conversão
const INTEGER_FIELDS = new Set([
  'id',
  'crm_column',
  'user_id',
  'lead_id',
  'sequence',
  'archived',
  'loss_reason',
  'gain_reason',
  'primecadastro',
  'await_column_approved_user',
  'funil_id'
]);

// Campos que são DECIMAL/NUMERIC
const DECIMAL_FIELDS = new Set([
  'value',
  'frete_height',
  'frete_length',
  'frete_weight',
  'frete_width',
  'valor_parcela',
  'total_pedido',
  'valorfrete'
]);

// Campos que são TIMESTAMP/DATE
const DATE_TIME_FIELDS = new Set([
  'create_date',
  'update_date',
  'gain_date',
  'lost_date',
  'reopen_date',
  'expected_close_date',
  'last_column_change',
  'last_status_change',
  'entrada_compra',
  'acolhimento_compra',
  'qualificado_compra',
  'orcamento_compra',
  'negociacao_compra',
  'follow_up_compra',
  'cadastro_compra',
  'entrada_recompra',
  'acolhimento_recompra',
  'qualificado_recompra',
  'orcamento_recompra',
  'negociacao_recompra',
  'follow_up_recompra',
  'cadastro_recompra',
  'entrada_monitoramento',
  'acolhimento_monitoramento',
  'qualificado_monitoramento',
  'orcamento_monitoramento',
  'negociacao_monitoramento',
  'follow_up_monitoramento',
  'cadastro_monitoramento',
  'entrada_ativacao',
  'acolhimento_ativacao',
  'qualificado_ativacao',
  'orcamento_ativacao',
  'negociacao_ativacao',
  'follow_up_ativacao',
  'cadastro_ativacao',
  'entrada_reativacao',
  'acolhimento_reativacao',
  'qualificado_reativacao',
  'orcamento_reativacao',
  'negociacao_reativacao',
  'follow_up_reativacao',
  'cadastro_reativacao',
  'lead_data_nascimento'
]);

/**
 * Converte data no formato brasileiro (DD/MM/YYYY HH:MM) para ISO (YYYY-MM-DDTHH:MM:SS)
 * Também aceita outros formatos comuns
 */
function convertDateTimeToISO(value: string): string | null {
  if (!value || typeof value !== 'string') {
    return null;
  }
  
  const trimmed = value.trim();
  if (trimmed === '' || trimmed.toLowerCase() === 'null') {
    return null;
  }
  
  // Se já está em formato ISO, retornar como está (mas garantir formato completo)
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(trimmed)) {
    return trimmed;
  }
  
  // Formato brasileiro: DD/MM/YYYY HH:MM ou DD/MM/YYYY HH:MM:SS
  // Exemplo: "15/12/2025 08:31" ou "15/12/2025 08:31:00" ou "15/12/2025 09:20"
  const brPattern = /^(\d{2})\/(\d{2})\/(\d{4})\s+(\d{1,2}):(\d{2})(?::(\d{2}))?/;
  const brMatch = trimmed.match(brPattern);
  
  if (brMatch) {
    const [, day, month, year, hour, minute, second = '00'] = brMatch;
    // Garantir que hora tem 2 dígitos (pode vir com 1 dígito)
    const hourPadded = hour.padStart(2, '0');
    // Formato ISO: YYYY-MM-DDTHH:MM:SS
    return `${year}-${month}-${day}T${hourPadded}:${minute}:${second}`;
  }
  
  // Formato brasileiro sem hora: DD/MM/YYYY
  const dateOnlyPattern = /^(\d{2})\/(\d{2})\/(\d{4})$/;
  const dateOnlyMatch = trimmed.match(dateOnlyPattern);
  
  if (dateOnlyMatch) {
    const [, day, month, year] = dateOnlyMatch;
    return `${year}-${month}-${day}T00:00:00`;
  }
  
  // Tentar parse com Date() e converter para ISO
  try {
    const parsedDate = new Date(trimmed);
    if (!isNaN(parsedDate.getTime())) {
      return parsedDate.toISOString();
    }
  } catch (e) {
    // Ignorar erro e retornar null
  }
  
  // Se não conseguiu converter, retornar null (será tratado como NULL no banco)
  console.warn(`⚠️ Não foi possível converter data: "${trimmed}"`);
  return null;
}

/**
 * Sanitiza valores vazios convertendo para null
 */
function sanitizeValue(value: any, fieldName: string): any {
  // Se for string vazia ou apenas espaços, retorna null
  if (typeof value === 'string' && value.trim() === '') {
    return null;
  }

  // Se for undefined, retorna null
  if (value === undefined) {
    return null;
  }

  // Converter campos INTEGER
  if (INTEGER_FIELDS.has(fieldName)) {
    if (value === null || value === '') {
      return null;
    }
    const parsed = parseInt(value, 10);
    return isNaN(parsed) ? null : parsed;
  }

  // Converter campos DECIMAL
  if (DECIMAL_FIELDS.has(fieldName)) {
    if (value === null || value === '') {
      return null;
    }
    const parsed = parseFloat(value);
    return isNaN(parsed) ? null : parsed;
  }

  // Converter campos DATE/TIMESTAMP (formato brasileiro para ISO)
  if (DATE_TIME_FIELDS.has(fieldName)) {
    if (value === null || value === '') {
      return null;
    }
    if (typeof value === 'string') {
      return convertDateTimeToISO(value);
    }
    // Se já é um objeto Date ou timestamp válido, manter
    return value;
  }

  return value;
}

/**
 * Sanitiza todo o payload removendo valores vazios de campos numéricos
 */
function sanitizePayload(data: Record<string, any>): Record<string, any> {
  const sanitized: Record<string, any> = {};

  for (const [key, value] of Object.entries(data)) {
    sanitized[key] = sanitizeValue(value, key);
  }

  return sanitized;
}

/**
 * Detecta se o payload é do Supabase ou do SprintHub
 */
function isSupabaseWebhook(payload: any): payload is WebhookPayload {
  return payload && typeof payload === 'object' && 'type' in payload && 'table' in payload;
}

serve(async (req) => {
  // Resposta IMEDIATA para OPTIONS (CORS preflight)
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, PATCH, OPTIONS, GET, HEAD',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, apikey, Accept-Profile, Content-Profile',
        'Access-Control-Max-Age': '86400'
      }
    });
  }

  // Resposta IMEDIATA para GET/HEAD (verificações de saúde)
  if (req.method === 'GET' || req.method === 'HEAD') {
    return new Response(
      JSON.stringify({ 
        status: 'ok', 
        message: 'Edge Function está funcionando',
        timestamp: new Date().toISOString(),
        version: '17'
      }),
      {
        status: 200,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      }
    );
  }

  // Log inicial IMEDIATO
  console.log('📥 Webhook recebido - oportunidade_sprint');
  console.log(`📅 Timestamp: ${new Date().toISOString()}`);
  console.log(`🔧 Method: ${req.method}`);
  console.log(`🌐 URL completa: ${req.url}`);
  
  // Tentar ler headers de forma segura
  try {
    const headersObj: Record<string, string> = {};
    req.headers.forEach((value, key) => {
      headersObj[key] = value;
    });
    console.log(`📋 Headers recebidos:`, JSON.stringify(headersObj));
  } catch (e) {
    console.log(`📋 Erro ao ler headers:`, e);
  }

  try {
    // Verificar método
    if (req.method !== 'POST' && req.method !== 'PATCH') {
      return new Response(
        JSON.stringify({ error: 'Método não permitido. Use POST ou PATCH.' }),
        {
          status: 405,
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        }
      );
    }

    // Configurar Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || Deno.env.get('SB_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || Deno.env.get('SERVICE_ROLE_KEY') || Deno.env.get('SERVICE_KEY');

    console.log('🔧 Verificando variáveis de ambiente:', {
      hasUrl: !!supabaseUrl,
      hasKey: !!supabaseServiceKey,
      urlPrefix: supabaseUrl?.substring(0, 30) || 'não definido',
      keyPrefix: supabaseServiceKey?.substring(0, 20) || 'não definido'
    });

    if (!supabaseUrl || !supabaseServiceKey) {
      const availableVars = Object.keys(Deno.env.toObject()).filter(k => 
        k.includes('SUPABASE') || k.includes('SERVICE') || k.includes('SB_')
      );
      console.error('❌ Variáveis de ambiente do Supabase não configuradas');
      console.error('Variáveis disponíveis:', availableVars);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Configuração do Supabase não encontrada',
          debug: {
            hasUrl: !!supabaseUrl,
            hasKey: !!supabaseServiceKey,
            availableVars: availableVars
          }
        }),
        {
          status: 500,
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        }
      );
    }

    // Criar cliente Supabase (usado apenas para webhooks do Supabase)
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse do payload
    let payload;
    try {
      const bodyText = await req.text();
      console.log('📦 Body recebido (raw):', bodyText.substring(0, 500));
      payload = JSON.parse(bodyText);
      console.log('📦 Payload parseado:', JSON.stringify(payload, null, 2));
    } catch (parseError) {
      console.error('❌ Erro ao fazer parse do JSON:', parseError);
      return new Response(
        JSON.stringify({ 
          success: false,
          error: `Erro ao fazer parse do JSON: ${parseError.message}`,
          timestamp: new Date().toISOString()
        }),
        {
          status: 400,
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        }
      );
    }

    // Detectar tipo de payload
    if (isSupabaseWebhook(payload)) {
      // ========================================
      // WEBHOOK DO SUPABASE (trigger de mudanças)
      // ========================================
      console.log('🔵 Processando webhook do Supabase');
      
      if (payload.table !== 'oportunidade_sprint') {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: `Tabela incorreta: ${payload.table}` 
          }),
          {
            status: 400,
            headers: { 
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*'
            }
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

      return new Response(
        JSON.stringify({ 
          success: true,
          message: `Evento ${payload.type} processado com sucesso`,
          timestamp: new Date().toISOString()
        }),
        {
          status: 200,
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        }
      );

    } else {
      // ========================================
      // WEBHOOK DO SPRINTHUB (dados diretos)
      // ========================================
      console.log('🟢 Processando webhook do SprintHub');

      // Priorizar ID do payload (o SprintHub não substitui tokens na URL)
      let opportunityId: number | null = null;

      // Extrair ID do payload
      if (payload.id) {
        // Remover tokens do SprintHub caso ainda estejam presentes
        const payloadIdStr = String(payload.id).replace(/\{op=id\}/g, '').trim();
        opportunityId = parseInt(payloadIdStr, 10);
        console.log(`🔍 ID extraído do payload: ${payload.id} -> ${opportunityId}`);
      }

      // Se não tem ID no payload, tentar da URL (fallback)
      if (!opportunityId || isNaN(opportunityId)) {
        const url = new URL(req.url);
        const idParam = url.searchParams.get('id');
        console.log(`🔍 Tentando ID da URL: ${idParam}`);
        
        if (idParam) {
          const cleanId = idParam.replace(/\{op=id\}/g, '').trim();
          const match = cleanId.match(/eq\.(\d+)|^(\d+)$/);
          if (match) {
            opportunityId = parseInt(match[1] || match[2], 10);
            console.log(`🔍 ID extraído da URL: ${opportunityId}`);
          }
        }
      }

      // Se ainda não tem ID, não pode continuar
      if (!opportunityId || isNaN(opportunityId)) {
        console.error(`❌ ID não encontrado no payload nem na URL`);
        console.error(`   Payload.id: ${payload.id}`);
        console.error(`   URL id param: ${new URL(req.url).searchParams.get('id')}`);
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'ID da oportunidade não encontrado no payload (payload.id)',
            details: {
              payloadId: payload.id,
              urlIdParam: new URL(req.url).searchParams.get('id')
            }
          }),
          {
            status: 400,
            headers: { 
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*'
            }
          }
        );
      }

      console.log(`✅ ID da oportunidade: ${opportunityId}`);

      // Sanitizar payload (converter strings vazias para null em campos INTEGER)
      const sanitizedPayload = sanitizePayload(payload);
      
      // Garantir campos obrigatórios (NOT NULL) com valores padrão
      // Isso previne erros de constraint no banco
      if (!sanitizedPayload.title || sanitizedPayload.title.trim() === '') {
        sanitizedPayload.title = `Oportunidade ${opportunityId}`;
        console.log('⚠️ title estava vazio, usando valor padrão');
      }
      if (!sanitizedPayload.crm_column && sanitizedPayload.crm_column !== 0) {
        sanitizedPayload.crm_column = 0; // Valor padrão para crm_column
        console.log('⚠️ crm_column estava vazio, usando 0');
      }
      if (!sanitizedPayload.lead_id && sanitizedPayload.lead_id !== 0) {
        sanitizedPayload.lead_id = 0; // Valor padrão para lead_id
        console.log('⚠️ lead_id estava vazio, usando 0');
      }
      if (!sanitizedPayload.status || sanitizedPayload.status.trim() === '') {
        sanitizedPayload.status = 'open';
        console.log('⚠️ status estava vazio, usando "open"');
      }
      if (!sanitizedPayload.create_date) {
        sanitizedPayload.create_date = new Date().toISOString();
        console.log('⚠️ create_date estava vazio, usando data atual');
      }
      if (!sanitizedPayload.update_date) {
        sanitizedPayload.update_date = new Date().toISOString();
        console.log('⚠️ update_date estava vazio, usando data atual');
      }
      
      // Garantir que o ID está no payload
      sanitizedPayload.id = opportunityId;
      
      console.log('🧹 Payload sanitizado e validado:', JSON.stringify(sanitizedPayload, null, 2));

      // Estratégia UPSERT: Tentar UPDATE primeiro, se falhar, fazer INSERT
      // Isso evita problemas com verificação de schema
      let result;
      let operation = 'unknown';
      
      // Timeout REDUZIDO para evitar travamentos (3 segundos)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      
      try {
        // Estratégia: Tentar UPDATE primeiro, se der erro de "não encontrado", fazer INSERT
        console.log(`🔄 Tentando atualizar oportunidade ${opportunityId}...`);
        console.log(`🔗 URL: ${supabaseUrl}/rest/v1/oportunidade_sprint?id=eq.${opportunityId}`);
        
        const updateResponse = await fetch(
          `${supabaseUrl}/rest/v1/oportunidade_sprint?id=eq.${opportunityId}`,
          {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
              'Authorization': `Bearer ${supabaseServiceKey}`,
              'apikey': supabaseServiceKey,
              'Accept-Profile': 'api',
              'Content-Profile': 'api',
              'Prefer': 'return=representation'
            },
            body: JSON.stringify(sanitizedPayload),
            signal: controller.signal
          }
        );
        
        console.log(`📊 UPDATE response status: ${updateResponse.status}`);

        clearTimeout(timeoutId);
        
        let shouldInsert = false;
        let shouldCheckIfExists = false;
        
        if (updateResponse.ok) {
          // UPDATE bem-sucedido - verificar se realmente atualizou algo
          try {
            const updateData = await updateResponse.json();
            const rowsAffected = Array.isArray(updateData) ? updateData.length : (updateData ? 1 : 0);
            
            if (rowsAffected > 0) {
              result = Array.isArray(updateData) && updateData.length > 0 ? updateData[0] : updateData;
              operation = 'update';
              console.log(`✅ Oportunidade ATUALIZADA com sucesso (${rowsAffected} linha(s) afetada(s))`);
            } else {
              // UPDATE retornou 200 mas nenhuma linha foi afetada
              // Pode ser que: 1) a oportunidade existe mas dados são idênticos, ou 2) não existe
              // Verificar se existe antes de tentar INSERT
              console.log('⚠️ UPDATE retornou 200 mas nenhuma linha foi afetada, verificando se oportunidade existe...');
              shouldCheckIfExists = true;
            }
          } catch (parseError) {
            // Se deu erro no parse, verificar se existe antes de INSERT
            console.warn('⚠️ Erro ao processar UPDATE, verificando se oportunidade existe...', parseError.message);
            shouldCheckIfExists = true;
          }
        } else {
          // UPDATE falhou - verificar se foi erro 404 (não existe) ou outro erro
          const updateErrorText = await updateResponse.text().catch(() => 'Erro desconhecido');
          console.log(`⚠️ UPDATE falhou (status ${updateResponse.status})`);
          console.log(`   Motivo: ${updateErrorText.substring(0, 200)}`);
          
          // Se foi 404 ou erro de não encontrado, tentar INSERT
          // Se foi outro erro (409, etc), tratar como erro
          if (updateResponse.status === 404 || updateResponse.status === 400) {
            shouldInsert = true;
          } else if (updateResponse.status === 409) {
            // Conflito - a oportunidade existe mas houve algum problema no UPDATE
            // Tentar UPDATE novamente
            console.log('🔄 Conflito detectado (oportunidade existe), tentando UPDATE novamente...');
            shouldCheckIfExists = true;
          } else {
            // Outro tipo de erro - retornar erro
            return new Response(
              JSON.stringify({ 
                success: false, 
                error: `Erro ao atualizar oportunidade: ${updateErrorText.substring(0, 200)}`,
                details: { 
                  status: updateResponse.status, 
                  statusText: updateResponse.statusText
                }
              }),
              {
                status: updateResponse.status,
                headers: { 
                  'Content-Type': 'application/json',
                  'Access-Control-Allow-Origin': '*'
                }
              }
            );
          }
        }
        
        // Se UPDATE retornou 200 mas sem linhas afetadas, verificar se a oportunidade existe
        if (shouldCheckIfExists) {
          const checkController = new AbortController();
          const checkTimeoutId = setTimeout(() => checkController.abort(), 2000);
          
          try {
            console.log(`🔍 Verificando se oportunidade ${opportunityId} existe...`);
            const checkResponse = await fetch(
              `${supabaseUrl}/rest/v1/oportunidade_sprint?id=eq.${opportunityId}&select=id`,
              {
                method: 'GET',
                headers: {
                  'Accept': 'application/json',
                  'Authorization': `Bearer ${supabaseServiceKey}`,
                  'apikey': supabaseServiceKey,
                  'Accept-Profile': 'api'
                },
                signal: checkController.signal
              }
            );
            
            clearTimeout(checkTimeoutId);
            
            if (checkResponse.ok) {
              const checkData = await checkResponse.json();
              if (Array.isArray(checkData) && checkData.length > 0) {
                // A oportunidade EXISTE - fazer UPDATE forçado
                console.log('✅ Oportunidade existe, fazendo UPDATE forçado...');
                
                const forceUpdateController = new AbortController();
                const forceUpdateTimeoutId = setTimeout(() => forceUpdateController.abort(), 3000);
                
                try {
                  const forceUpdateResponse = await fetch(
                    `${supabaseUrl}/rest/v1/oportunidade_sprint?id=eq.${opportunityId}`,
                    {
                      method: 'PATCH',
                      headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                        'Authorization': `Bearer ${supabaseServiceKey}`,
                        'apikey': supabaseServiceKey,
                        'Accept-Profile': 'api',
                        'Content-Profile': 'api',
                        'Prefer': 'return=representation'
                      },
                      body: JSON.stringify(sanitizedPayload),
                      signal: forceUpdateController.signal
                    }
                  );
                  
                  clearTimeout(forceUpdateTimeoutId);
                  
                  if (forceUpdateResponse.ok) {
                    try {
                      const forceUpdateData = await forceUpdateResponse.json();
                      result = Array.isArray(forceUpdateData) && forceUpdateData.length > 0 ? forceUpdateData[0] : forceUpdateData;
                      operation = 'update';
                      console.log('✅ Oportunidade ATUALIZADA com sucesso (UPDATE forçado)');
                    } catch (parseError) {
                      operation = 'update';
                      result = { id: opportunityId, ...sanitizedPayload };
                      console.log('✅ Oportunidade ATUALIZADA (assumindo sucesso após parse error)');
                    }
                  } else {
                    const forceErrorText = await forceUpdateResponse.text().catch(() => 'Erro desconhecido');
                    throw new Error(`Erro no UPDATE forçado: ${forceErrorText.substring(0, 200)}`);
                  }
                } catch (forceError: any) {
                  clearTimeout(forceUpdateTimeoutId);
                  throw new Error(`Erro ao fazer UPDATE forçado: ${forceError.message}`);
                }
              } else {
                // A oportunidade NÃO existe - fazer INSERT
                console.log('⚠️ Oportunidade não existe, criando nova...');
                shouldInsert = true;
              }
            } else {
              // Erro ao verificar - assumir que não existe e tentar INSERT
              console.log('⚠️ Erro ao verificar existência, tentando INSERT...');
              shouldInsert = true;
            }
          } catch (checkError: any) {
            clearTimeout(checkTimeoutId);
            if (checkError.name === 'AbortError') {
              console.log('⚠️ Timeout ao verificar existência, tentando INSERT...');
            } else {
              console.log(`⚠️ Erro ao verificar existência: ${checkError.message}, tentando INSERT...`);
            }
            shouldInsert = true;
          }
        }
        
        // Se precisa fazer INSERT (UPDATE não funcionou ou não afetou linhas)
        if (shouldInsert) {
          
          // Novo controller para INSERT com timeout REDUZIDO
          const insertController = new AbortController();
          const insertTimeoutId = setTimeout(() => insertController.abort(), 3000);
          
          try {
            console.log(`➕ Criando nova oportunidade ${opportunityId}...`);
            console.log(`🔗 URL: ${supabaseUrl}/rest/v1/oportunidade_sprint`);
            const insertResponse = await fetch(
              `${supabaseUrl}/rest/v1/oportunidade_sprint`,
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Accept': 'application/json',
                  'Authorization': `Bearer ${supabaseServiceKey}`,
                  'apikey': supabaseServiceKey,
                  'Accept-Profile': 'api',
                  'Content-Profile': 'api',
                  'Prefer': 'return=representation'
                },
                body: JSON.stringify(sanitizedPayload),
                signal: insertController.signal
              }
            );

            clearTimeout(insertTimeoutId);

            if (!insertResponse.ok) {
              const errorText = await insertResponse.text().catch(() => 'Erro desconhecido');
              console.error('❌ Erro ao criar oportunidade:', errorText.substring(0, 500));
              
              // Se o erro é de chave duplicada (409), tentar fazer UPDATE novamente
              if (insertResponse.status === 409 || errorText.includes('duplicate key') || errorText.includes('already exists')) {
                console.log('🔄 Erro de chave duplicada detectado, tentando UPDATE novamente...');
                
                // Fazer UPDATE forçado
                const retryUpdateController = new AbortController();
                const retryUpdateTimeoutId = setTimeout(() => retryUpdateController.abort(), 3000);
                
                try {
                  const retryUpdateResponse = await fetch(
                    `${supabaseUrl}/rest/v1/oportunidade_sprint?id=eq.${opportunityId}`,
                    {
                      method: 'PATCH',
                      headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                        'Authorization': `Bearer ${supabaseServiceKey}`,
                        'apikey': supabaseServiceKey,
                        'Accept-Profile': 'api',
                        'Content-Profile': 'api',
                        'Prefer': 'return=representation'
                      },
                      body: JSON.stringify(sanitizedPayload),
                      signal: retryUpdateController.signal
                    }
                  );
                  
                  clearTimeout(retryUpdateTimeoutId);
                  
                  if (retryUpdateResponse.ok) {
                    try {
                      const retryUpdateData = await retryUpdateResponse.json();
                      result = Array.isArray(retryUpdateData) && retryUpdateData.length > 0 ? retryUpdateData[0] : retryUpdateData;
                      operation = 'update';
                      console.log('✅ Oportunidade ATUALIZADA com sucesso (após conflito de chave duplicada)');
                    } catch (parseError) {
                      operation = 'update';
                      result = { id: opportunityId, ...sanitizedPayload };
                      console.log('⚠️ Parse error no retry UPDATE, mas assumindo sucesso');
                    }
                  } else {
                    // UPDATE falhou mesmo assim - retornar erro
                    const retryErrorText = await retryUpdateResponse.text().catch(() => 'Erro desconhecido');
                    throw new Error(`Erro ao atualizar após conflito: ${retryErrorText.substring(0, 200)}`);
                  }
                } catch (retryError: any) {
                  clearTimeout(retryUpdateTimeoutId);
                  throw new Error(`Erro ao tentar UPDATE após conflito: ${retryError.message}`);
                }
              } else {
                // Outro tipo de erro - retornar erro
                return new Response(
                  JSON.stringify({ 
                    success: false, 
                    error: `Erro ao criar oportunidade: ${errorText.substring(0, 200)}`,
                    details: { 
                      status: insertResponse.status, 
                      statusText: insertResponse.statusText,
                      updateAttempted: true
                    }
                  }),
                  {
                    status: insertResponse.status,
                    headers: { 
                      'Content-Type': 'application/json',
                      'Access-Control-Allow-Origin': '*'
                    }
                  }
                );
              }
            } else {
              // INSERT bem-sucedido - continuar normalmente
            }

            try {
              const insertData = await insertResponse.json();
              result = Array.isArray(insertData) && insertData.length > 0 ? insertData[0] : insertData;
              operation = 'insert';
              console.log('✅ Oportunidade CRIADA com sucesso');
            } catch (parseError) {
              console.warn('⚠️ Erro ao fazer parse da resposta do INSERT:', parseError);
              operation = 'insert';
              result = sanitizedPayload;
            }
          } catch (insertError: any) {
            clearTimeout(insertTimeoutId);
            if (insertError.name === 'AbortError') {
              console.error('❌ Timeout ao criar oportunidade');
              return new Response(
                JSON.stringify({ 
                  success: false, 
                  error: 'Timeout ao criar oportunidade (5 segundos)',
                  details: { operation: 'insert', opportunityId }
                }),
                {
                  status: 504,
                  headers: { 
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                  }
                }
              );
            }
            throw insertError;
          }
        }
      } catch (updateError: any) {
        clearTimeout(timeoutId);
        if (updateError.name === 'AbortError') {
          console.error('❌ Timeout ao atualizar oportunidade, tentando INSERT...');
          // Tentar INSERT mesmo assim
          sanitizedPayload.id = opportunityId;
          
          const insertController = new AbortController();
          const insertTimeoutId = setTimeout(() => insertController.abort(), 5000);
          
          try {
            const insertResponse = await fetch(
              `${supabaseUrl}/rest/v1/oportunidade_sprint`,
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Accept': 'application/json',
                  'Authorization': `Bearer ${supabaseServiceKey}`,
                  'apikey': supabaseServiceKey,
                  'Accept-Profile': 'api',
                  'Content-Profile': 'api',
                  'Prefer': 'return=representation'
                },
                body: JSON.stringify(sanitizedPayload),
                signal: insertController.signal
              }
            );
            
            clearTimeout(insertTimeoutId);
            
            if (insertResponse.ok) {
              const insertData = await insertResponse.json();
              result = Array.isArray(insertData) && insertData.length > 0 ? insertData[0] : insertData;
              operation = 'insert';
              console.log('✅ Oportunidade INSERIDA com sucesso (após timeout no UPDATE)');
            } else {
              throw new Error(`Insert failed: ${insertResponse.status}`);
            }
          } catch (insertError: any) {
            clearTimeout(insertTimeoutId);
            return new Response(
              JSON.stringify({ 
                success: false, 
                error: 'Timeout nas operações de banco de dados',
                details: { operation: 'both', opportunityId }
              }),
              {
                status: 504,
                headers: { 
                  'Content-Type': 'application/json',
                  'Access-Control-Allow-Origin': '*'
                }
              }
            );
          }
        } else {
          // Outro tipo de erro no UPDATE - tentar criar mesmo assim
          console.error('❌ Erro no UPDATE, tentando criar oportunidade...', updateError.message);
          sanitizedPayload.id = opportunityId;
          
          const insertController = new AbortController();
          const insertTimeoutId = setTimeout(() => insertController.abort(), 5000);
          
          try {
            const insertResponse = await fetch(
              `${supabaseUrl}/rest/v1/oportunidade_sprint`,
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Accept': 'application/json',
                  'Authorization': `Bearer ${supabaseServiceKey}`,
                  'apikey': supabaseServiceKey,
                  'Accept-Profile': 'api',
                  'Content-Profile': 'api',
                  'Prefer': 'return=representation'
                },
                body: JSON.stringify(sanitizedPayload),
                signal: insertController.signal
              }
            );
            
            clearTimeout(insertTimeoutId);
            
            if (insertResponse.ok) {
              const insertData = await insertResponse.json();
              result = Array.isArray(insertData) && insertData.length > 0 ? insertData[0] : insertData;
              operation = 'insert';
              console.log('✅ Oportunidade CRIADA com sucesso (após erro no UPDATE)');
            } else {
              const errorText = await insertResponse.text().catch(() => 'Erro desconhecido');
              throw new Error(`Erro ao criar: ${errorText.substring(0, 200)}`);
            }
          } catch (insertError: any) {
            clearTimeout(insertTimeoutId);
            throw new Error(`Erro ao criar oportunidade após falha no UPDATE: ${insertError.message}`);
          }
        }
      }

      // Resposta de sucesso
      return new Response(
        JSON.stringify({ 
          success: true,
          message: operation === 'update' ? 'Oportunidade atualizada com sucesso' : 'Oportunidade inserida com sucesso',
          operation: operation,
          data: result,
          timestamp: new Date().toISOString()
        }),
        {
          status: 200,
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        }
      );
    }

  } catch (error) {
    console.error('❌ Erro ao processar webhook:', error);
    console.error('Stack trace:', error.stack);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message || 'Erro desconhecido',
        errorName: error.name || 'Unknown',
        timestamp: new Date().toISOString(),
        stack: error.stack || 'No stack trace'
      }),
      {
        status: 500,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      }
    );
  }
});

/**
 * Processa evento INSERT (nova oportunidade criada) - SUPABASE WEBHOOK
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
 * Processa evento UPDATE (oportunidade atualizada) - SUPABASE WEBHOOK
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
 * Processa evento DELETE (oportunidade deletada) - SUPABASE WEBHOOK
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
  // - Registrar log de auditoria
  // - Atualizar métricas do vendedor
  // - Enviar notificação
  // - Sincronizar com sistema externo
  // etc.
  
  console.log('✅ entrada_compra processado com sucesso');
}
