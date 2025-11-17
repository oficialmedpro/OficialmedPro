/**
 * Serviço centralizado para integrações com a SprintHub.
 *
 * Responsabilidades:
 *  - Requisições autenticadas para endpoints REST/GraphQL da SprintHub.
 *  - Deduplicação de leads, oportunidades, tags e objetos customizados.
 *  - Persistência de logs no Supabase (api.sprinthub_sync_logs) para evitar ressincronizações.
 *  - Funções utilitárias para normalização de dados (telefone, nomes, pedidos).
 *
 * Configuração via variáveis de ambiente:
 *  - VITE_SPRINTHUB_BASE_URL
 *  - VITE_SPRINTHUB_API_TOKEN
 *  - VITE_SPRINTHUB_INSTANCE
 *  - VITE_SPRINTHUB_FUNNEL_ID
 *  - VITE_SPRINTHUB_COLUMN_ID
 *  - VITE_SPRINTHUB_SEQUENCE_ID
 *  - VITE_SPRINTHUB_USER_ID
 *  - VITE_SPRINTHUB_ORDER_OBJECT_ID
 *  - VITE_SPRINTHUB_ORDER_FIELD_MAP (JSON stringify)
 */

import { supabase } from './supabase';

const DEFAULT_BASE_URL = 'sprinthub-api-master.sprinthub.app';
const LOG_TABLE = 'sprinthub_sync_logs';

const getConfig = () => {
  const env = import.meta.env || {};
  const parseNumber = (value, fallback = null) => {
    if (value === undefined || value === null || value === '') return fallback;
    const parsed = Number(value);
    return Number.isNaN(parsed) ? fallback : parsed;
  };

  let orderFieldMap = {};
  try {
    const raw = env.VITE_SPRINTHUB_ORDER_FIELD_MAP || '{}';
    orderFieldMap = JSON.parse(raw);
  } catch (error) {
    console.warn('[sprinthubService] VITE_SPRINTHUB_ORDER_FIELD_MAP inválido. Usando mapeamento vazio.', error);
  }

  // Chamadas diretas funcionam! (testado e confirmado)
  // Não precisa de proxy - SprintHub aceita chamadas do navegador
  let proxyBasePath = null;

  return {
    baseUrl: (env.VITE_SPRINTHUB_BASE_URL || DEFAULT_BASE_URL).replace(/^https?:\/\//, ''),
    apiToken: env.VITE_SPRINTHUB_API_TOKEN || '',
    instance: env.VITE_SPRINTHUB_INSTANCE || '',
    defaultFunnelId: parseNumber(env.VITE_SPRINTHUB_FUNNEL_ID),
    defaultColumnId: parseNumber(env.VITE_SPRINTHUB_COLUMN_ID),
    defaultSequenceId: parseNumber(env.VITE_SPRINTHUB_SEQUENCE_ID, 0),
    defaultUserId: parseNumber(env.VITE_SPRINTHUB_USER_ID),
    orderObjectDefinitionId: parseNumber(env.VITE_SPRINTHUB_ORDER_OBJECT_ID),
    orderFieldMap,
    logTable: LOG_TABLE,
    proxyBasePath,
  };
};

const CONFIG = getConfig();

const getBaseUrl = () => {
  const base = CONFIG.baseUrl || DEFAULT_BASE_URL;
  return base.startsWith('http') ? base : `https://${base}`;
};

const sanitizePhone = (phone) => {
  if (!phone) return '';
  const digits = String(phone).replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('55')) return `+${digits}`;
  if (digits.length === 11 || digits.length === 10) return `+55${digits}`;
  return `+${digits}`;
};

const splitName = (fullname = '') => {
  if (!fullname) return { firstname: '', lastname: '' };
  const parts = fullname.trim().split(/\s+/);
  const firstname = parts.shift() || '';
  const lastname = parts.join(' ') || '';
  return { firstname, lastname };
};

const toJson = (value) => {
  if (value === undefined) return undefined;
  if (value === null) return null;
  try {
    return JSON.parse(JSON.stringify(value));
  } catch {
    return value;
  }
};

const hashString = (value) => {
  const input = typeof value === 'string' ? value : JSON.stringify(value);
  let hash = 0;
  if (input.length === 0) return '0';
  for (let i = 0; i < input.length; i += 1) {
    const chr = input.charCodeAt(i);
    hash = (hash << 5) - hash + chr;
    hash |= 0; // Convert to 32bit integer
  }
  return hash.toString(16);
};

const buildSignature = ({ entityType, entityId, action, payload }) => {
  return hashString({
    entityType,
    entityId,
    action,
    payload,
  });
};

const buildUrl = (path, query = {}) => {
  const url = new URL(path.startsWith('http') ? path : `${getBaseUrl()}${path}`);
  Object.entries(query).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    url.searchParams.set(key, value);
  });
  return url.toString();
};

const defaultHeaders = () => ({
  'Content-Type': 'application/json',
});

const executeRequest = async (path, options = {}) => {
  const {
    method = 'GET',
    query,
    body,
    headers,
    rawResponse = false,
  } = options;

  if (!CONFIG.apiToken || !CONFIG.instance) {
    throw new Error('Configuração da SprintHub incompleta. Verifique as variáveis de ambiente.');
  }

  // Chamada direta (funciona perfeitamente do navegador!)
  // Tokens vão na query string, SEM header Authorization (isso causa CORS)
  const finalQuery = { ...(query || {}) };
  finalQuery.apitoken = CONFIG.apiToken;
  finalQuery.i = CONFIG.instance;

  // Garantir que o path comece com /
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const url = buildUrl(normalizedPath, finalQuery);
  
  // Debug: log completo (apenas em desenvolvimento)
  if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    console.log('[sprinthubService] URL:', url);
    console.log('[sprinthubService] Method:', method);
    console.log('[sprinthubService] Body:', body);
    console.log('[sprinthubService] Body (JSON):', body ? JSON.stringify(body, null, 2) : 'undefined');
  }
  
  const requestOptions = {
    method,
    headers: {
      ...defaultHeaders(),
      ...(headers || {}),
    },
  };

  // NÃO adicionar Authorization header (causa CORS)
  // Tokens já estão na query string (apitoken e i)
  // Igual ao Callix que funciona direto do navegador

  if (body !== undefined) {
    requestOptions.body = typeof body === 'string' ? body : JSON.stringify(body);
  }

  const response = await fetch(url, requestOptions);

  if (rawResponse) return response;

  const contentType = response.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json');
  const data = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    // Log detalhado do erro
    console.error('[sprinthubService] Erro na requisição:', {
      url,
      method,
      status: response.status,
      statusText: response.statusText,
      body: body ? JSON.stringify(body, null, 2) : 'undefined',
      response: typeof data === 'string' ? data.substring(0, 500) : JSON.stringify(data, null, 2).substring(0, 500)
    });
    
    const error = new Error(`Erro ao consumir API da SprintHub: ${response.status} ${response.statusText}`);
    error.status = response.status;
    error.response = data;
    error.url = url; // Incluir URL no erro para debug
    throw error;
  }

  return data;
};

const logSyncEvent = async ({ entityType, entityId, action, payload, response, status, errorMessage, metadata }) => {
  if (!CONFIG.logTable) return { success: true };

  // Garantir que entity_id não seja null (campo é NOT NULL)
  const safeEntityId = entityId ? String(entityId) : (entityType || 'unknown') + '_' + Date.now();
  
  const signature = buildSignature({ entityType, entityId: safeEntityId, action, payload });
  
  // Se signature for null/vazio, não fazer upsert (pode causar erro 400)
  if (!signature) {
    console.warn('[sprinthubService] Signature vazia, pulando log');
    return { success: false, error: 'Signature vazia' };
  }
  
  const entry = {
    entity_type: entityType || 'unknown',
    entity_id: safeEntityId, // Campo é NOT NULL, então sempre deve ter valor
    action: action || 'unknown',
    signature,
    status: status || 'pending',
    payload: toJson(payload),
    response: toJson(response),
    error_message: errorMessage || null,
    metadata: toJson(metadata),
  };

  try {
    // Usar insert simples. Caso já exista (violação de unique), consideramos como sucesso
    const { error } = await supabase
      .schema('api')
      .from(CONFIG.logTable)
      .insert(entry);

    if (error) {
      // 23505 = duplicate key value violates unique constraint
      if (error.code === '23505') {
        console.warn('[sprinthubService] Log duplicado ignorado (signature já registrada). Signature:', signature);
        return { success: true, signature, duplicated: true };
      }

      console.error('[sprinthubService] Erro ao registrar log:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      });
      console.error('[sprinthubService] Entry que causou erro:', JSON.stringify(entry, null, 2));
      // Não falhar a operação principal por causa do log
      return { success: false, error };
    }
  } catch (error) {
    console.warn('[sprinthubService] Não foi possível registrar log (tabela indisponível?):', error);
    return { success: false, error };
  }

  return { success: true, signature };
};

const isSignatureProcessed = async ({ entityType, entityId, action, payload }) => {
  if (!CONFIG.logTable) return false;
  const signature = buildSignature({ entityType, entityId, action, payload });
  const { data, error } = await supabase
    .schema('api')
    .from(CONFIG.logTable)
    .select('id, status')
    .eq('signature', signature)
    .maybeSingle();

  if (error) {
    console.error('[sprinthubService] Erro ao consultar log:', error);
    return false;
  }

  return data && data.status === 'success';
};

const sprinthubService = {
  getConfig: () => ({ ...CONFIG }),

  async searchLeads({ search, query = '{leads{id,fullname,email,whatsapp,mobile}}', page = 0, limit = 15 }) {
    const body = { query, search, page, limit };
    const response = await executeRequest('/leadsadvanced', {
      method: 'POST',
      body,
    });
    return response?.data?.leads || [];
  },

  async getLeadById(leadId, { query, allFields } = {}) {
    const params = {};
    if (query) params.query = query;
    if (allFields) params.allFields = allFields;
    const response = await executeRequest(`/leads/${leadId}`, { query: params });
    return response?.data || response;
  },

  async createLead(data) {
    const payload = {
      ...data,
      whatsapp: sanitizePhone(data.whatsapp || data.mobile),
      mobile: sanitizePhone(data.mobile || data.whatsapp),
    };
    const response = await executeRequest('/leads', {
      method: 'POST',
      body: payload,
    });
    await logSyncEvent({
      entityType: 'lead',
      entityId: response?.id || response?.data?.id || payload?.email || payload?.whatsapp,
      action: 'create',
      payload,
      response,
      status: 'success',
    });
    return response;
  },

  async updateLeadById(leadId, data) {
    const payload = {
      ...data,
      whatsapp: sanitizePhone(data.whatsapp || data.mobile),
      mobile: sanitizePhone(data.mobile || data.whatsapp),
    };
    // Usar /leads/{id} no path (como na documentação para atualizar tags)
    const response = await executeRequest(`/leads/${leadId}`, {
      method: 'PUT',
      body: payload, // Não precisa incluir id no body, já está no path
    });
    await logSyncEvent({
      entityType: 'lead',
      entityId: leadId,
      action: 'update',
      payload,
      response,
      status: 'success',
    });
    return response;
  },

  async updateLeadByField(field, value, data) {
    if (!field || !value) throw new Error('Campo ou valor não informados para update por campo.');
    const payload = {
      ...data,
      whatsapp: sanitizePhone(data.whatsapp || data.mobile),
      mobile: sanitizePhone(data.mobile || data.whatsapp),
    };
    const response = await executeRequest(`/leadsbyfield/${encodeURIComponent(field)}/${encodeURIComponent(value)}`, {
      method: 'PUT',
      body: payload,
    });
    await logSyncEvent({
      entityType: 'lead',
      entityId: `${field}:${value}`,
      action: 'updateByField',
      payload,
      response,
      status: 'success',
    });
    return response;
  },

  async getInstanceTags() {
    const response = await executeRequest('/tags');
    return response || [];
  },

  async getLeadTags(leadId) {
    const response = await executeRequest(`/leads/${leadId}`, {
      query: { query: '{tags{id,tag,color}}' },
    });
    return response?.data?.tags || [];
  },

  async updateLeadTags(leadId, tagIds = []) {
    const payload = { id: leadId, tags: tagIds };
    const response = await executeRequest(`/leads/${leadId}`, {
      method: 'PUT',
      body: payload,
    });
    await logSyncEvent({
      entityType: 'lead',
      entityId: leadId,
      action: 'updateTags',
      payload,
      response,
      status: 'success',
    });
    return response;
  },

  async listLeadOpportunities(leadId) {
    if (!leadId) return [];
    
    try {
      // Tentar o endpoint conforme documentação: GET /listopportunitysleadcomplete/{leadId}?i=<instancia>
      // O apitoken também é adicionado automaticamente pelo executeRequest
      const response = await executeRequest(`/listopportunitysleadcomplete/${leadId}`);
      return Array.isArray(response) ? response : [];
    } catch (error) {
      // Erro 400 pode significar:
      // 1. Lead não tem oportunidades (comportamento esperado)
      // 2. Endpoint não disponível para esse lead específico
      // 3. Formato incorreto (mas seguimos a documentação)
      // Tratamos como "sem oportunidades" e retornamos array vazio
      if (error.status === 400) {
        console.warn(`[sprinthubService] Endpoint retornou 400 para lead ${leadId}. Tratando como "sem oportunidades".`);
        return [];
      }
      
      // Erro 404: lead não existe
      if (error.status === 404) {
        console.warn(`[sprinthubService] Lead ${leadId} não encontrado (404)`);
        return [];
      }
      
      // Para outros erros (500, etc), relançar para tratamento superior
      console.error(`[sprinthubService] Erro inesperado ao buscar oportunidades do lead ${leadId}:`, error);
      throw error;
    }
  },

  /**
   * Busca o status CRM de um lead (funil e etapa onde está)
   * Retorna informações sobre as oportunidades abertas do lead
   */
  async getLeadCrmStatus(leadId) {
    if (!leadId) {
      return {
        hasOpportunities: false,
        status: 'ID do lead não fornecido',
        funis: []
      };
    }
    
    try {
      let opportunities = await this.listLeadOpportunities(leadId);
      
      // Se não retornou array, tratar como erro
      if (!Array.isArray(opportunities)) {
        return {
          hasOpportunities: false,
          status: 'Erro ao buscar oportunidades',
          funis: []
        };
      }
      
      // NOTA: A busca alternativa por etapas foi desabilitada porque:
      // 1. O endpoint /listopportunitysleadcomplete deve ser suficiente
      // 2. A busca por etapas gera muitos erros 400 quando as etapas não existem no funil
      // 3. É muito lenta e ineficiente
      // Se o endpoint direto falhar, retornamos vazio e deixamos o usuário saber que não foi possível buscar
      if (opportunities.length === 0) {
        console.warn(`[sprinthubService] ⚠️ Não foi possível buscar oportunidades para lead ${leadId} via endpoint direto. O lead pode não ter oportunidades abertas ou o endpoint pode estar temporariamente indisponível.`);
      }
      
      const openOpportunities = opportunities.filter(opp => opp && opp.status === 'open');
      
      if (openOpportunities.length === 0) {
        return {
          hasOpportunities: false,
          status: 'Sem oportunidades abertas',
          funis: []
        };
      }

      // Mapear funis conhecidos (incluindo funis de reativação)
      const funisMap = {
        6: '[1] COMERCIAL APUCARANA',
        14: '[2] RECOMPRA',
        34: '[1] REATIVAÇÃO MARKETING',
        38: '[1] REATIVAÇÃO COMERCIAL',
      };

      // Agrupar por funil
      const funis = {};
      openOpportunities.forEach(opp => {
        const funnelId = opp.funnel_id || opp.funnelId;
        const columnId = opp.crm_column || opp.column_id;
        if (!funnelId || !columnId) return;

        if (!funis[funnelId]) {
          funis[funnelId] = {
            id: funnelId,
            name: funisMap[funnelId] || `Funil ${funnelId}`,
            stages: []
          };
        }

        // Evitar duplicatas de etapa
        if (!funis[funnelId].stages.find(s => s.id === columnId)) {
          funis[funnelId].stages.push({
            id: columnId,
            opportunityId: opp.id,
            title: opp.title || ''
          });
        }
      });

      const funisArray = Object.values(funis);
      const statusText = funisArray.length > 0
        ? funisArray.map(f => `${f.name} (${f.stages.length} etapa${f.stages.length > 1 ? 's' : ''})`).join(', ')
        : 'Sem funis identificados';

      return {
        hasOpportunities: true,
        status: statusText,
        funis: funisArray,
        totalOpen: openOpportunities.length
      };
    } catch (error) {
      console.error('[sprinthubService] Erro ao buscar status CRM:', error);
      return {
        hasOpportunities: false,
        status: 'Erro ao buscar status',
        funis: [],
        error: error.message
      };
    }
  },

  /**
   * Busca uma oportunidade específica para verificar sua estrutura
   * Útil para descobrir quais campos customizados (fields) são aceitos
   */
  async getOpportunityById(opportunityId, funnelId) {
    const response = await executeRequest(`/crmopportunity/${opportunityId}`, {
      method: 'GET',
      query: { id: funnelId },
    });
    return response;
  },

  async createOpportunity(payload) {
    const funnelId = payload?.funnelId ?? CONFIG.defaultFunnelId;
    if (!funnelId) throw new Error('Funil (ID) não configurado para criação de oportunidades.');
    
    // Remover funnelId do body (vai na query string)
    const body = { ...payload };
    delete body.funnelId;
    
    // Garantir que campos obrigatórios estejam presentes e no formato correto
    // A SprintHub espera value como string (baseado nas oportunidades existentes)
    const valueAsString = body.value !== undefined && body.value !== null 
      ? String(body.value) 
      : '0';
    
    // A SprintHub espera sequence como STRING, não número (testado e confirmado)
    // Se não for fornecido, usar "0" como padrão (obrigatório)
    const sequenceAsString = body.sequence !== undefined && body.sequence !== null
      ? String(body.sequence)
      : '0';
    
    const requiredFields = {
      title: body.title || '',
      value: valueAsString, // SprintHub espera string
      crm_column: body.crm_column || null,
      lead_id: body.lead_id || null,
      status: body.status || 'open',
      sequence: sequenceAsString, // Sempre incluir sequence como string
    };
    
    // Mesclar campos obrigatórios com o body (body tem prioridade)
    const finalBody = {
      ...requiredFields,
      ...body,
    };
    
    // Garantir que value seja sempre string (sobrescrever se vier como número)
    finalBody.value = String(finalBody.value || '0');
    
    // Garantir que sequence seja sempre string (sobrescrever se vier como número)
    finalBody.sequence = String(finalBody.sequence || '0');
    
    // Remover campos null/undefined que podem causar problemas na validação
    Object.keys(finalBody).forEach(key => {
      if (finalBody[key] === null || finalBody[key] === undefined) {
        // Manter null apenas em campos opcionais específicos
        if (!['loss_reason', 'gain_reason', 'expectedCloseDate', 'sale_channel', 'campaign'].includes(key)) {
          delete finalBody[key];
        }
      }
    });
    
    // Garantir que fields seja sempre um objeto válido
    if (!finalBody.fields || typeof finalBody.fields !== 'object') {
      finalBody.fields = {};
    }
    
    // Log do payload completo para debug
    console.log('[sprinthubService] Criando oportunidade:', {
      funnelId,
      payloadOriginal: payload,
      bodyFinal: JSON.stringify(finalBody, null, 2),
      hasFields: !!finalBody.fields,
      fieldsKeys: finalBody.fields ? Object.keys(finalBody.fields) : []
    });
    
    const response = await executeRequest('/crmopportunity', {
      method: 'POST',
      query: { id: funnelId },
      body: finalBody,
    });
    await logSyncEvent({
      entityType: 'opportunity',
      entityId: response?.id,
      action: 'create',
      payload: body,
      response,
      status: 'success',
    });
    return response;
  },

  async updateOpportunity(opportunityId, payload) {
    const funnelId = payload?.funnelId ?? CONFIG.defaultFunnelId;
    const body = { ...payload };
    delete body.funnelId;
    const response = await executeRequest(`/crmopportunity/${opportunityId}`, {
      method: 'PUT',
      query: { id: funnelId },
      body,
    });
    await logSyncEvent({
      entityType: 'opportunity',
      entityId: opportunityId,
      action: 'update',
      payload: body,
      response,
      status: 'success',
    });
    return response;
  },

  async enqueueLeadAndOpportunity({ leadPayload, opportunityPayload }) {
    const body = {
      endpoints: [
        {
          url: `${getBaseUrl()}/leads`,
          method: 'POST',
          body: leadPayload,
        },
        {
          url: `${getBaseUrl()}/crmopportunity?id=${opportunityPayload.funnelId ?? CONFIG.defaultFunnelId}`,
          method: 'POST',
          body: {
            ...opportunityPayload,
            funnelId: undefined,
          },
        },
      ],
    };

    const response = await executeRequest('/api/queue', {
      method: 'POST',
      body,
    });

    await logSyncEvent({
      entityType: 'queue',
      entityId: opportunityPayload?.lead_id || leadPayload?.email,
      action: 'queueLeadOpportunity',
      payload: body,
      response,
      status: 'success',
    });

    return response;
  },

  async listLeadAttendances(leadId) {
    const response = await executeRequest(`/sac360/lead/${leadId}`);
    return Array.isArray(response) ? response : response?.data || [];
  },

  async listAttendanceFiles(attendanceId) {
    return executeRequest(`/sac360/list_file_attendance/${attendanceId}`);
  },

  async listLeadFiles(leadId) {
    return executeRequest(`/sac360/list_file_lead/${leadId}`);
  },

  async getLeadCustomObjects(leadId) {
    const response = await executeRequest(`/lead/customobjects/${leadId}`);
    return response?.data || [];
  },

  async getCustomObjectDefinitions() {
    const response = await executeRequest('/customobjects/def', {
      query: {
        query: '{definitions{id,name,pluralName,relationship{id},fields{label,alias,defaultValue,type}}}',
      },
    });
    return response?.data?.definitions || [];
  },

  async createCustomObject(definitionId, payload) {
    const response = await executeRequest(`/customobjects/objects/${definitionId}`, {
      method: 'POST',
      body: payload,
    });
    await logSyncEvent({
      entityType: 'custom_object',
      entityId: response?.id,
      action: 'create',
      payload: { definitionId, ...payload },
      response,
      status: 'success',
    });
    return response;
  },

  async linkCustomObjectToLead(objectId, leadId, amount = 1) {
    const payload = { objectId, linkType: 'lead', targetId: leadId, amount };
    const response = await executeRequest('/customobjects/link', {
      method: 'POST',
      body: payload,
    });
    await logSyncEvent({
      entityType: 'custom_object_link',
      entityId: `${objectId}-${leadId}`,
      action: 'link',
      payload,
      response,
      status: 'success',
    });
    return response;
  },

  /**
   * Busca lead no SprintHub por telefone ou whatsapp
   */
  async findLeadByPhone(phone, whatsapp) {
    if (!phone && !whatsapp) return null;
    
    // Tentar buscar por whatsapp primeiro
    if (whatsapp) {
      const sanitizedWhatsapp = sanitizePhone(whatsapp);
      if (sanitizedWhatsapp) {
        const leads = await this.searchLeads({ search: sanitizedWhatsapp });
        if (leads && leads.length > 0) {
          return leads[0];
        }
      }
    }
    
    // Tentar buscar por telefone
    if (phone) {
      const sanitizedPhone = sanitizePhone(phone);
      if (sanitizedPhone) {
        const leads = await this.searchLeads({ search: sanitizedPhone });
        if (leads && leads.length > 0) {
          return leads[0];
        }
      }
    }
    
    return null;
  },

  /**
   * Salva o id_sprinthub no Supabase nas tabelas relacionadas
   */
  async saveSprinthubIdToSupabase(sprinthubId, rowData) {
    if (!sprinthubId) return;
    
    try {
      const clientId = rowData.id || rowData.id_cliente_mestre || rowData.id_prime;
      if (!clientId) {
        console.warn('[sprinthubService] Não foi possível identificar o ID do cliente para salvar id_sprinthub');
        return;
      }

      // Verificar se o registro existe antes de atualizar
      const { data: existingClient, error: checkError } = await supabase
        .schema('api')
        .from('clientes_mestre')
        .select('id')
        .eq('id', clientId)
        .maybeSingle();

      if (checkError) {
        console.warn('[sprinthubService] Erro ao verificar cliente:', checkError);
      }

      if (existingClient) {
        // Verificar se já tem id_sprinthub diferente (evitar conflito 409)
        const { data: currentData, error: fetchError } = await supabase
          .schema('api')
          .from('clientes_mestre')
          .select('id_sprinthub')
          .eq('id', clientId)
          .maybeSingle();

        if (fetchError) {
          console.warn('[sprinthubService] Erro ao verificar id_sprinthub atual:', fetchError);
        }

        // Se já tem o mesmo id_sprinthub, não precisa atualizar
        if (currentData?.id_sprinthub === sprinthubId) {
          console.log(`[sprinthubService] id_sprinthub ${sprinthubId} já está salvo para cliente ${clientId}`);
          return;
        }

        // Atualizar na tabela principal de clientes
        const { error } = await supabase
          .schema('api')
          .from('clientes_mestre')
          .update({ id_sprinthub: sprinthubId })
          .eq('id', clientId);

        if (error) {
          // Se for erro 409 (conflito), pode ser que outro registro já tenha esse id_sprinthub
          if (error.code === '23505' || error.message?.includes('unique') || error.message?.includes('duplicate')) {
            console.warn(`[sprinthubService] id_sprinthub ${sprinthubId} já está em uso por outro cliente. Pulando atualização.`);
          } else {
            console.warn('[sprinthubService] Erro ao atualizar id_sprinthub em clientes_mestre:', error);
          }
        } else {
          console.log(`[sprinthubService] id_sprinthub ${sprinthubId} salvo para cliente ${clientId}`);
        }
      } else {
        // Cliente não encontrado por id, tentar por id_prime
        if (rowData.id_prime) {
          const { data: existingByPrime, error: checkPrimeError } = await supabase
            .schema('api')
            .from('clientes_mestre')
            .select('id, id_sprinthub')
            .eq('id_prime', rowData.id_prime)
            .maybeSingle();

          if (!checkPrimeError && existingByPrime) {
            // Verificar se já tem o mesmo id_sprinthub
            if (existingByPrime.id_sprinthub === sprinthubId) {
              console.log(`[sprinthubService] id_sprinthub ${sprinthubId} já está salvo para cliente id_prime ${rowData.id_prime}`);
              return;
            }

            const { error: error2 } = await supabase
              .schema('api')
              .from('clientes_mestre')
              .update({ id_sprinthub: sprinthubId })
              .eq('id_prime', rowData.id_prime);
            
            if (error2) {
              console.warn('[sprinthubService] Erro ao atualizar id_sprinthub por id_prime:', error2);
            } else {
              console.log(`[sprinthubService] id_sprinthub ${sprinthubId} salvo para cliente por id_prime ${rowData.id_prime}`);
            }
          } else {
            console.warn(`[sprinthubService] Cliente não encontrado (id: ${clientId}, id_prime: ${rowData.id_prime})`);
          }
        } else {
          console.warn(`[sprinthubService] Cliente não encontrado (id: ${clientId})`);
        }
      }
    } catch (error) {
      console.error('[sprinthubService] Erro ao salvar id_sprinthub no Supabase:', error);
    }
  },

  /**
   * Orquestra a sincronização completa de um cliente:
   *  - Garante lead (cria ou atualiza).
   *  - Atualiza tags.
   *  - Sincroniza histórico de pedidos via objetos customizados.
   *  - Garante oportunidade no funil alvo (sem duplicar).
   */
  async ensureLeadAndOpportunity({
    lead,
    opportunity,
    tags = [],
    orders = [],
    attendanceFiles = [],
    skipChecks = false,
    reativacaoTagId = 221, // Tag padrão para REATIVAÇÃO
    rowData = null, // Dados originais da linha para salvar id_sprinthub
  }) {
    if (!lead) throw new Error('Dados do lead não informados.');

    const summary = {
      lead: null,
      opportunity: null,
      tags: null,
      orders: [],
      attendanceFiles: [],
      errors: [],
    };

    try {
      // 1) Deduplicação de lead - buscar por telefone OU whatsapp OU email
      let existingLead = null;
      if (!skipChecks) {
        // Primeiro tentar por telefone/whatsapp
        const whatsapp = lead?.whatsapp || lead?.mobile;
        const phone = lead?.phone;
        if (whatsapp || phone) {
          existingLead = await this.findLeadByPhone(phone, whatsapp);
        }
        
        // Se não encontrou, tentar por email
        if (!existingLead && lead?.email) {
          const leadsFound = await this.searchLeads({ search: lead.email });
          existingLead = leadsFound?.[0] || null;
        }
        
        // Se ainda não encontrou, tentar por search key genérico
        if (!existingLead) {
          const searchKey = lead?.search || lead?.email || lead?.whatsapp || lead?.mobile;
          if (searchKey) {
            const leadsFound = await this.searchLeads({ search: searchKey });
            existingLead = leadsFound?.[0] || null;
          }
        }
      }

      // 2) Criar ou atualizar lead
      const leadPayload = {
        firstname: lead.firstname,
        lastname: lead.lastname,
        email: lead.email,
        whatsapp: lead.whatsapp,
        mobile: lead.mobile,
        phone: lead.phone,
        city: lead.city,
        state: lead.state,
        country: lead.country || 'Brazil',
        zipcode: lead.zipcode,
        address: lead.address,
        timezone: lead.timezone || 'America/Sao_Paulo',
        preferred_locale: lead.preferred_locale || 'pt-BR',
      };

      let leadId;
      if (existingLead?.id) {
        leadId = existingLead.id;
        console.log(`[sprinthubService] Lead existente encontrado: ${leadId}. Verificando status de arquivamento...`);
        
        // Verificar se o lead está arquivado e desarquivar automaticamente ANTES de atualizar
        try {
          const isArchived = await this.isLeadArchived(leadId);
          console.log(`[sprinthubService] Lead ${leadId} - Status arquivado: ${isArchived}`);
          
          if (isArchived) {
            console.log(`[sprinthubService] ⚠️ Lead ${leadId} está arquivado. Desarquivando automaticamente...`);
            await this.unarchiveLead(leadId);
            console.log(`[sprinthubService] ✅ Lead ${leadId} desarquivado com sucesso!`);
            summary.lead = { id: leadId, status: 'updated_and_unarchived' };
          } else {
            console.log(`[sprinthubService] Lead ${leadId} não está arquivado. Prosseguindo com atualização.`);
            summary.lead = { id: leadId, status: 'updated' };
          }
        } catch (error) {
          console.error(`[sprinthubService] ❌ Erro ao verificar/desarquivar lead ${leadId}:`, error);
          // Continuar mesmo se falhar a verificação de arquivamento
          summary.lead = { id: leadId, status: 'updated' };
        }
        
        // Atualizar dados do lead (incluindo archived: false no payload para garantir)
        await this.updateLeadById(leadId, {
          ...leadPayload,
          archived: false // Garantir que está desarquivado
        });
      } else {
        console.log(`[sprinthubService] Lead não encontrado. Criando novo lead...`);
        const created = await this.createLead(leadPayload);
        leadId = created?.id || created?.data?.id;
        summary.lead = { id: leadId, status: 'created' };
      }

      // Salvar id_sprinthub no Supabase
      if (leadId && rowData) {
        await this.saveSprinthubIdToSupabase(leadId, rowData);
      }

      // 3) Tags - adicionar tag de reativação se especificada
      if (leadId) {
        let finalTags = [...(tags || [])];
        
        // Adicionar tag de reativação se não estiver na lista
        if (reativacaoTagId && !finalTags.includes(reativacaoTagId)) {
          finalTags.push(reativacaoTagId);
        }
        
        if (finalTags.length > 0) {
          await this.updateLeadTags(leadId, finalTags);
          summary.tags = finalTags;
        }
      }

      // 4) Pedidos -> objetos customizados
      if (leadId && orders?.length && CONFIG.orderObjectDefinitionId) {
        for (const order of orders) {
          const signaturePayload = {
            leadId,
            orderId: order.orderId,
            hash: hashString(order),
          };
          const alreadySynced = await isSignatureProcessed({
            entityType: 'order',
            entityId: `${leadId}-${order.orderId}`,
            action: 'sync-order',
            payload: signaturePayload,
          });
          if (alreadySynced) {
            summary.orders.push({ orderId: order.orderId, status: 'skipped' });
            // eslint-disable-next-line no-continue
            continue;
          }

          const customPayload = {};
          Object.entries(CONFIG.orderFieldMap).forEach(([key, alias]) => {
            if (!alias) return;
            customPayload[alias] = order[key] ?? order[alias] ?? null;
          });

          const createdObject = await this.createCustomObject(CONFIG.orderObjectDefinitionId, customPayload);
          if (createdObject?.id) {
            await this.linkCustomObjectToLead(createdObject.id, leadId);
          }

          await logSyncEvent({
            entityType: 'order',
            entityId: `${leadId}-${order.orderId}`,
            action: 'sync-order',
            payload: signaturePayload,
            response: createdObject,
            status: 'success',
          });

          summary.orders.push({ orderId: order.orderId, status: 'synced' });
        }
      }

      // 5) Arquivos de atendimento (metadados)
      if (leadId && attendanceFiles?.length) {
        for (const file of attendanceFiles) {
          const signaturePayload = {
            leadId,
            url: file.url,
            type: file.type,
          };
          const alreadySynced = await isSignatureProcessed({
            entityType: 'sac360_file',
            entityId: `${leadId}-${file.url}`,
            action: 'sync-file',
            payload: signaturePayload,
          });
          if (alreadySynced) {
            summary.attendanceFiles.push({ url: file.url, status: 'skipped' });
            // eslint-disable-next-line no-continue
            continue;
          }

          await logSyncEvent({
            entityType: 'sac360_file',
            entityId: `${leadId}-${file.url}`,
            action: 'sync-file',
            payload: signaturePayload,
            response: file,
            status: 'success',
          });

          summary.attendanceFiles.push({ url: file.url, status: 'registered' });
        }
      }

      // 6) Oportunidade - verificar se já existe oportunidade aberta no funil especificado
      if (leadId && opportunity) {
        // Validar funnelId ANTES de usar
        let funnelId = opportunity.funnelId ?? CONFIG.defaultFunnelId;
        if (!funnelId || funnelId === null || funnelId === undefined) {
          console.error('[sprinthubService] funnelId não configurado:', {
            opportunityFunnelId: opportunity.funnelId,
            configDefaultFunnelId: CONFIG.defaultFunnelId,
            envVar: import.meta.env.VITE_SPRINTHUB_FUNNEL_ID
          });
          throw new Error('Funil (ID) não configurado para criação de oportunidades. Configure VITE_SPRINTHUB_FUNNEL_ID ou informe no modal.');
        }
        const targetColumn = opportunity.crm_column ?? CONFIG.defaultColumnId;
        
        // Buscar todas as oportunidades do lead
        const existingOpps = await this.listLeadOpportunities(leadId);
        
        // Verificar se existe oportunidade aberta no funil e coluna especificados
        const duplicate = existingOpps.find((opp) => {
          // Verificar se está no mesmo funil (se a API retornar essa info)
          // E se está na mesma coluna e status aberto
          const sameColumn = Number(opp.crm_column) === Number(targetColumn);
          const sameStatus = opp.status === 'open';
          const sameFunnel = !opp.funnel_id || Number(opp.funnel_id) === Number(funnelId);
          return sameColumn && sameStatus && sameFunnel;
        });

        if (duplicate) {
          summary.opportunity = { id: duplicate.id, status: 'already-exists' };
        } else {
          // Preparar campos customizados
          // O campo "verifique" já deve vir dentro de opportunity.fields
          const customFields = {
            ...(opportunity.fields || {}),
          };
          
          // Se verifique vier no nível raiz (compatibilidade), adicionar a fields
          if (opportunity.verifique !== undefined && opportunity.verifique !== null && opportunity.verifique !== '' && !customFields.verifique) {
            customFields.verifique = opportunity.verifique;
          }

          // Validar campos obrigatórios
          if (!opportunity.title) {
            throw new Error('Título da oportunidade é obrigatório');
          }
          if (!targetColumn) {
            throw new Error('Coluna/etapa do funil é obrigatória');
          }
          if (!leadId) {
            throw new Error('ID do lead é obrigatório');
          }

          // Garantir que fields seja sempre um objeto (não undefined/null)
          const fieldsToSend = Object.keys(customFields).length > 0 ? customFields : {};
          
          // Converter sequence para string (SprintHub espera string, não número)
          const sequenceValue = opportunity.sequence !== undefined && opportunity.sequence !== null
            ? String(opportunity.sequence)
            : undefined;
          
          const payload = {
            funnelId, // Incluir funnelId no payload para createOpportunity
            title: opportunity.title,
            value: opportunity.value ?? 0,
            crm_column: targetColumn,
            lead_id: leadId,
            status: opportunity.status || 'open',
            // Campos opcionais (só incluir se tiver valor válido)
            ...(sequenceValue !== undefined && { sequence: sequenceValue }),
            ...(opportunity.user !== undefined && opportunity.user !== null && { user: opportunity.user }),
            ...(opportunity.expectedCloseDate && { expectedCloseDate: opportunity.expectedCloseDate }),
            // Campos customizados (sempre enviar, mesmo que vazio)
            fields: fieldsToSend,
            // Campos de permissão (só incluir se especificados)
            ...(opportunity.sprint_permission && { sprint_permission: opportunity.sprint_permission }),
            ...(opportunity.sprint_permission_user && { sprint_permission_user: opportunity.sprint_permission_user }),
            ...(opportunity.sprint_permission_users?.length > 0 && { sprint_permission_users: opportunity.sprint_permission_users }),
            ...(opportunity.sprint_permission_departments?.length > 0 && { sprint_permission_departments: opportunity.sprint_permission_departments }),
          };
          
          // ANTES de criar, buscar uma oportunidade existente do mesmo lead para ver a estrutura
          // Isso ajuda a descobrir quais campos customizados são aceitos
          try {
            const existingOpps = await this.listLeadOpportunities(leadId);
            if (existingOpps && existingOpps.length > 0) {
              const sampleOpp = existingOpps[0];
              console.log('[sprinthubService] 📋 Estrutura de oportunidade existente (amostra):', {
                id: sampleOpp.id,
                title: sampleOpp.title,
                fields: sampleOpp.fields || {},
                fieldsKeys: sampleOpp.fields ? Object.keys(sampleOpp.fields) : [],
                allKeys: Object.keys(sampleOpp).filter(k => k !== 'dataLead' && k !== 'fields')
              });
              
              // Verificar se os campos que vamos enviar existem na estrutura
              const fieldsToSendKeys = Object.keys(fieldsToSend);
              const existingFieldsKeys = sampleOpp.fields ? Object.keys(sampleOpp.fields) : [];
              console.log('[sprinthubService] 🔍 Comparação de campos:', {
                vamosEnviar: fieldsToSendKeys,
                existemNaSprintHub: existingFieldsKeys,
                novosCampos: fieldsToSendKeys.filter(k => !existingFieldsKeys.includes(k))
              });
            }
          } catch (err) {
            console.warn('[sprinthubService] Não foi possível buscar oportunidade existente para análise:', err);
          }

          // Log do payload antes de enviar
          console.log('[sprinthubService] Payload da oportunidade:', JSON.stringify(payload, null, 2));

          const created = await this.createOpportunity(payload);
          summary.opportunity = { id: created?.id || created?.data?.id, status: 'created' };
        }
      }
    } catch (error) {
      console.error('[sprinthubService] Erro na integração:', error);
      summary.errors.push(error);
      await logSyncEvent({
        entityType: 'integration',
        entityId: lead?.email || lead?.whatsapp,
        action: 'ensureLeadAndOpportunity',
        payload: lead,
        response: error?.response,
        status: 'error',
        errorMessage: error.message,
      });
    }

    return summary;
  },

  normalizeLeadFromRow(row = {}) {
    const fullname = row.nome_completo || row.nome || row.name || '';
    const { firstname, lastname } = splitName(fullname);
    return {
      firstname,
      lastname,
      email: row.email || null,
      whatsapp: row.whatsapp || row.telefone || row.celular || null,
      mobile: row.mobile || null,
      phone: row.telefone_fixo || null,
      city: row.cidade || null,
      state: row.estado || null,
      country: 'Brazil',
      zipcode: row.cep || row.zipcode || null,
      address: row.endereco || row.address || null,
      preferred_locale: 'pt-BR',
      search: row.email || row.whatsapp || row.cpf || fullname,
    };
  },

  normalizeOrdersFromPrime(pedidosData = {}) {
    const output = [];
    Object.entries(pedidosData).forEach(([clienteId, dados]) => {
      if (!dados) return;
      const { ultimoPedido, ultimoOrcamento, referencia } = dados;
      if (ultimoPedido) {
        output.push({
          leadPrimeId: clienteId,
          orderId: ultimoPedido.id || ultimoPedido.codigo_orcamento_original || `pedido-${clienteId}`,
          tipo: 'pedido',
          numero: ultimoPedido.codigo_orcamento_original || ultimoPedido.id,
          data: ultimoPedido.data_criacao,
          valor: ultimoPedido.valor_total,
          status: ultimoPedido.status_aprovacao || ultimoPedido.status_geral || ultimoPedido.status_entrega,
          resumo: sprinthubService.buildResumoPedido(ultimoPedido),
          formulas: ultimoPedido.formulas || [],
        });
      }
      if (ultimoOrcamento) {
        output.push({
          leadPrimeId: clienteId,
          orderId: ultimoOrcamento.id || ultimoOrcamento.codigo_orcamento_original || `orcamento-${clienteId}`,
          tipo: 'orcamento',
          numero: ultimoOrcamento.codigo_orcamento_original || ultimoOrcamento.id,
          data: ultimoOrcamento.data_criacao,
          valor: ultimoOrcamento.valor_total,
          status: ultimoOrcamento.status_aprovacao || ultimoOrcamento.status_geral || ultimoOrcamento.status_entrega,
          resumo: sprinthubService.buildResumoPedido(ultimoOrcamento, { isOrcamento: true }),
          formulas: ultimoOrcamento.formulas || [],
        });
      }
      if (!ultimoPedido && !ultimoOrcamento && referencia) {
        output.push({
          leadPrimeId: clienteId,
          orderId: referencia.id || referencia.codigo_orcamento_original || `ref-${clienteId}`,
          tipo: 'referencia',
          numero: referencia.codigo_orcamento_original || referencia.id,
          data: referencia.data_criacao,
          valor: referencia.valor_total,
          status: referencia.status_aprovacao || referencia.status_geral || referencia.status_entrega,
          resumo: sprinthubService.buildResumoPedido(referencia, { isOrcamento: true }),
          formulas: referencia.formulas || [],
        });
      }
    });
    return output;
  },

  buildResumoPedido(pedido, { isOrcamento = false } = {}) {
    if (!pedido) return '';
    const data = pedido.data_criacao ? new Date(pedido.data_criacao).toLocaleDateString('pt-BR') : '';
    const valor = pedido.valor_total
      ? `R$ ${parseFloat(pedido.valor_total).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
      : '';
    const status = pedido.status_aprovacao || pedido.status_geral || pedido.status_entrega || '';
    const codigo = pedido.codigo_orcamento_original || pedido.id || '';
    const prefixo = isOrcamento ? 'Orçamento' : 'Pedido';
    let resumo = `${prefixo} ${codigo ? `#${codigo}` : ''} - ${data} - ${valor}`.trim();
    if (!isOrcamento) resumo += status ? ` - ${status}` : '';

    if (pedido.formulas && pedido.formulas.length > 0) {
      const formulas = pedido.formulas.map((f) => {
        const numeroFormula = f.numero_formula || '';
        const descricao = f.descricao || 'Sem descrição';
        const posologia = f.posologia || '';
        const valorFormula = f.valor_formula
          ? `R$ ${parseFloat(f.valor_formula).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
          : '';
        let texto = `F#${numeroFormula}: ${descricao}`;
        if (posologia) texto += ` - ${posologia}`;
        if (valorFormula) texto += ` - ${valorFormula}`;
        return texto;
      }).join(' | ');
      resumo += ` | Fórmulas: ${formulas}`;
    }

    return resumo;
  },

  /**
   * Verifica se um lead está arquivado no SprintHub
   * @param {number|string} leadId - ID do lead
   * @returns {Promise<boolean>} - true se estiver arquivado, false caso contrário
   */
  async isLeadArchived(leadId) {
    try {
      console.log(`[sprinthubService] Verificando se lead ${leadId} está arquivado...`);
      
      // Buscar lead com campo archived - usar query específica para garantir que o campo archived venha
      const lead = await this.getLeadById(leadId, {
        query: '{lead{id,archived,fullname}}',
        allFields: false
      });
      
      console.log(`[sprinthubService] Resposta da API para lead ${leadId}:`, JSON.stringify(lead, null, 2));
      
      // Verificar diferentes estruturas de resposta da API
      // A API pode retornar: {data: {lead: {...}}} ou {lead: {...}} ou diretamente o objeto
      const archived = lead?.data?.lead?.archived ?? 
                       lead?.data?.archived ??
                       lead?.lead?.archived ?? 
                       lead?.archived ?? 
                       false;
      
      const isArchived = Boolean(archived);
      console.log(`[sprinthubService] Lead ${leadId} - Campo archived: ${archived}, Resultado: ${isArchived}`);
      
      return isArchived;
    } catch (error) {
      // Se o lead não for encontrado (404), considerar como não arquivado
      if (error.status === 404) {
        console.warn(`[sprinthubService] Lead ${leadId} não encontrado (404). Considerando como não arquivado.`);
        return false;
      }
      console.error(`[sprinthubService] Erro ao verificar se lead ${leadId} está arquivado:`, error);
      throw error;
    }
  },

  /**
   * Desarquiva um lead no SprintHub
   * @param {number|string} leadId - ID do lead
   * @returns {Promise<object>} - Resposta da API
   */
  async unarchiveLead(leadId) {
    try {
      const response = await this.updateLeadById(leadId, {
        archived: false
      });
      
      await logSyncEvent({
        entityType: 'lead',
        entityId: leadId,
        action: 'unarchive',
        payload: { archived: false },
        response,
        status: 'success',
      });
      
      return response;
    } catch (error) {
      console.error(`[sprinthubService] Erro ao desarquivar lead ${leadId}:`, error);
      await logSyncEvent({
        entityType: 'lead',
        entityId: leadId,
        action: 'unarchive',
        payload: { archived: false },
        response: null,
        status: 'error',
        errorMessage: error.message,
      });
      throw error;
    }
  },

  /**
   * Arquivar um lead no SprintHub
   * @param {number|string} leadId - ID do lead
   * @returns {Promise<object>} - Resposta da API
   */
  async archiveLead(leadId) {
    try {
      const response = await this.updateLeadById(leadId, {
        archived: true
      });
      
      await logSyncEvent({
        entityType: 'lead',
        entityId: leadId,
        action: 'archive',
        payload: { archived: true },
        response,
        status: 'success',
      });
      
      return response;
    } catch (error) {
      console.error(`[sprinthubService] Erro ao arquivar lead ${leadId}:`, error);
      await logSyncEvent({
        entityType: 'lead',
        entityId: leadId,
        action: 'archive',
        payload: { archived: true },
        response: null,
        status: 'error',
        errorMessage: error.message,
      });
      throw error;
    }
  },

  /**
   * Desarquiva múltiplos leads em lote
   * @param {Array<number|string>} leadIds - Array de IDs dos leads
   * @param {Object} options - Opções de processamento
   * @param {number} options.batchSize - Tamanho do lote (padrão: 10)
   * @param {number} options.delay - Delay entre lotes em ms (padrão: 500)
   * @returns {Promise<{success: number, errors: number, results: Array}>}
   */
  async unarchiveLeadsBatch(leadIds, { batchSize = 10, delay = 500 } = {}) {
    const results = [];
    let success = 0;
    let errors = 0;

    for (let i = 0; i < leadIds.length; i += batchSize) {
      const batch = leadIds.slice(i, i + batchSize);
      
      const batchPromises = batch.map(async (leadId) => {
        try {
          const result = await this.unarchiveLead(leadId);
          success++;
          return { leadId, success: true, result };
        } catch (error) {
          errors++;
          return { leadId, success: false, error: error.message };
        }
      });

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);

      // Delay entre lotes para evitar rate limiting
      if (i + batchSize < leadIds.length && delay > 0) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    return { success, errors, results, total: leadIds.length };
  },
};

export default sprinthubService;

