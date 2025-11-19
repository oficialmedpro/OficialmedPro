import crypto from 'crypto';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY
  || process.env.VITE_SUPABASE_ANON_KEY
  || process.env.SUPABASE_KEY;
const SUPABASE_SCHEMA = process.env.VITE_SUPABASE_SCHEMA || process.env.SUPABASE_SCHEMA || 'api';

const SPRINTHUB_BASE = (process.env.VITE_SPRINTHUB_BASE_URL || process.env.SPRINTHUB_BASE_URL || 'https://sprinthub-api-master.sprinthub.app')
  .replace(/\/$/, '');
const SPRINTHUB_TOKEN = process.env.VITE_SPRINTHUB_API_TOKEN || process.env.SPRINTHUB_TOKEN;
const SPRINTHUB_INSTANCE = process.env.VITE_SPRINTHUB_INSTANCE || process.env.SPRINTHUB_INSTANCE;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.warn('[reativacaoAutoSync] ⚠️ SUPABASE_URL ou SUPABASE_KEY não configurados. Endpoints automáticos podem falhar.');
}

if (!SPRINTHUB_TOKEN || !SPRINTHUB_INSTANCE) {
  console.warn('[reativacaoAutoSync] ⚠️ Credenciais SprintHub incompletas. Configure VITE_SPRINTHUB_API_TOKEN e VITE_SPRINTHUB_INSTANCE.');
}

const supabaseHeaders = {
  apikey: SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json',
  'Accept-Profile': SUPABASE_SCHEMA,
  'Content-Profile': SUPABASE_SCHEMA,
};

const sanitizePhone = (value) => {
  if (!value) return '';
  const digits = String(value).replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('55')) return `+${digits}`;
  if (digits.length >= 10 && digits.length <= 12) return `+55${digits}`;
  return `+${digits}`;
};

const isValidPhone = (value) => {
  if (!value) return false;
  const digits = String(value).replace(/\D/g, '');
  return digits.length >= 10;
};

const splitName = (fullname = '') => {
  if (!fullname) return { firstname: '', lastname: '' };
  const parts = fullname.trim().split(/\s+/);
  const firstname = parts.shift() || '';
  const lastname = parts.join(' ') || '';
  return { firstname, lastname };
};

const chunkArray = (array, size) => {
  if (!Array.isArray(array) || size <= 0) return [array];
  const chunks = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
};

const buildResumoPedido = (pedido, { isOrcamento = false } = {}) => {
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
};

const normalizeLeadFromRow = (row = {}) => {
  const fullname = row.nome_completo || row.nome || row.name || '';
  const { firstname, lastname } = splitName(fullname);
  return {
    firstname,
    lastname,
    email: row.email || null,
    whatsapp: sanitizePhone(row.whatsapp || row.telefone || row.celular || null),
    mobile: sanitizePhone(row.mobile || row.whatsapp || row.telefone || null),
    phone: sanitizePhone(row.telefone_fixo || row.telefone || row.whatsapp || null),
    city: row.cidade || null,
    state: row.estado || null,
    country: 'Brazil',
    zipcode: row.cep || row.zipcode || null,
    address: row.endereco || row.address || null,
    preferred_locale: 'pt-BR',
    search: row.email || row.whatsapp || row.cpf || fullname,
    rowName: fullname || row.email || row.id_prime || 'Cliente',
  };
};

const getLeadIdentifierCandidates = (row = {}) => {
  const ids = [];
  const push = (value) => {
    if (value === undefined || value === null) return;
    const str = String(value).trim();
    if (!str) return;
    ids.push(str);
  };
  push(row.id);
  push(row.id_cliente_mestre);
  push(row.id_cliente);
  push(row.id_prime);
  push(row.prime_id);
  push(row.id_lead);
  push(row.lead_id);
  push(row.id_sprinthub);
  push(row.id_sprint);
  return Array.from(new Set(ids));
};

const getLeadIdentifier = (row) => {
  const candidates = getLeadIdentifierCandidates(row);
  return candidates.length > 0 ? candidates[0] : null;
};

const callSprinthub = async (path, { method = 'GET', query = {}, body } = {}) => {
  if (!SPRINTHUB_TOKEN || !SPRINTHUB_INSTANCE) {
    throw new Error('Credenciais SprintHub não configuradas');
  }
  const normalizedPath = path.startsWith('http') ? path : `${SPRINTHUB_BASE}${path.startsWith('/') ? path : `/${path}`}`;
  const url = new URL(normalizedPath);
  url.searchParams.set('apitoken', SPRINTHUB_TOKEN);
  url.searchParams.set('i', SPRINTHUB_INSTANCE);
  Object.entries(query || {}).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    url.searchParams.set(key, value);
  });

  const response = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const text = await response.text();
  let parsed;
  try {
    parsed = text ? JSON.parse(text) : null;
  } catch {
    parsed = text;
  }

  if (!response.ok) {
    const error = new Error(`SprintHub error ${response.status}`);
    error.response = parsed;
    error.status = response.status;
    throw error;
  }
  return parsed;
};

const supabaseFetch = async (resource, { params = {}, range } = {}) => {
  if (!SUPABASE_URL || !SUPABASE_KEY) throw new Error('Supabase não configurado para sync automático');
  const url = new URL(`${SUPABASE_URL}/rest/v1/${resource}`);
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    url.searchParams.set(key, value);
  });
  const headers = { ...supabaseHeaders };
  if (range) {
    headers.Range = range;
  }
  const response = await fetch(url, { headers });
  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Supabase error ${response.status}: ${errText}`);
  }
  return response.json();
};

const fetchReativacaoRows = async ({ viewName, limit }) => {
  const rangeHeader = `0-${Math.max(0, limit - 1)}`;
  return supabaseFetch(viewName, {
    params: { select: '*' },
    range: rangeHeader,
  });
};

const fetchHistoricoSet = async (leadIds) => {
  if (!leadIds || leadIds.length === 0) return new Set();
  const chunks = chunkArray(leadIds, 50);
  const sent = new Set();
  for (const chunk of chunks) {
    const list = chunk.map((id) => encodeURIComponent(id)).join(',');
    const url = new URL(`${SUPABASE_URL}/rest/v1/historico_exportacoes`);
    url.searchParams.set('select', 'id_lead,tag_exportacao');
    url.searchParams.set('tag_exportacao', 'ilike.SPRINTHUB%');
    url.searchParams.set('id_lead', `in.(${chunk.join(',')})`);
    const response = await fetch(url, { headers: supabaseHeaders });
    if (!response.ok) {
      const txt = await response.text();
      console.warn('[reativacaoAutoSync] Falha ao consultar histórico:', txt);
      continue;
    }
    const data = await response.json();
    data.forEach((row) => {
      if (row.id_lead !== undefined && row.id_lead !== null) {
        sent.add(String(row.id_lead));
      }
    });
  }
  return sent;
};

const fetchPedidosDataForRows = async (rows) => {
  if (!rows || rows.length === 0) return {};
  const clientIds = Array.from(new Set(
    rows
      .map((r) => r.id_prime || r.prime_id || r.id_cliente || r.id_cliente_mestre)
      .filter(Boolean)
      .map((id) => {
        if (typeof id === 'number') return id;
        const parsed = Number(id);
        return Number.isNaN(parsed) ? id : parsed;
      })
  ));
  if (clientIds.length === 0) return {};

  const pedidosData = {};
  const clientChunks = chunkArray(clientIds, 200);

  for (const chunk of clientChunks) {
    const pedidos = await supabaseFetch('prime_pedidos', {
      params: {
        select: 'id,cliente_id,valor_total,data_criacao,status_aprovacao,status_geral,status_entrega,codigo_orcamento_original',
        order: 'data_criacao.desc',
        cliente_id: `in.(${chunk.join(',')})`,
      },
    });
    const pedidoIds = pedidos.map((p) => p.id).filter(Boolean);
    let formulas = [];
    if (pedidoIds.length > 0) {
      formulas = await supabaseFetch('prime_formulas', {
        params: {
          select: 'id,pedido_id,numero_formula,descricao,posologia,valor_formula',
          pedido_id: `in.(${pedidoIds.join(',')})`,
        },
      });
    }
    const formulasMap = formulas.reduce((acc, formula) => {
      if (!acc[formula.pedido_id]) acc[formula.pedido_id] = [];
      acc[formula.pedido_id].push(formula);
      return acc;
    }, {});

    chunk.forEach((clienteId) => {
      const clientePedidos = pedidos.filter((p) => String(p.cliente_id) === String(clienteId));
      const ultimoPedido = clientePedidos.find((p) =>
        p.status_aprovacao === 'APROVADO'
        || p.status_geral === 'APROVADO'
        || p.status_entrega === 'ENTREGUE'
      );
      const ultimoOrcamento = clientePedidos.find((p) =>
        p.status_aprovacao !== 'APROVADO'
        && p.status_geral !== 'APROVADO'
        && p.status_entrega !== 'ENTREGUE'
      );
      if (ultimoPedido && formulasMap[ultimoPedido.id]) {
        ultimoPedido.formulas = formulasMap[ultimoPedido.id];
      }
      if (ultimoOrcamento && formulasMap[ultimoOrcamento.id]) {
        ultimoOrcamento.formulas = formulasMap[ultimoOrcamento.id];
      }
      const referencia = ultimoPedido || ultimoOrcamento || clientePedidos?.[0] || null;
      pedidosData[clienteId] = { ultimoPedido, ultimoOrcamento, referencia };
    });
  }
  return pedidosData;
};

const findLeadByPhone = async (phone, whatsapp) => {
  const searchValue = sanitizePhone(whatsapp || phone);
  if (!searchValue) return null;
  const response = await callSprinthub('/leadsadvanced', {
    method: 'POST',
    body: {
      query: '{leads{id,fullname,email,whatsapp,mobile,tags{id}}}',
      search: searchValue,
      page: 0,
      limit: 15,
    },
  });
  const leads = response?.data?.leads || [];
  return leads.find((lead) => {
    const leadPhones = [lead.whatsapp, lead.mobile, lead.phone].map(sanitizePhone);
    return leadPhones.includes(searchValue);
  }) || null;
};

const findLeadByEmail = async (email) => {
  if (!email) return null;
  const response = await callSprinthub('/leadsadvanced', {
    method: 'POST',
    body: {
      query: '{leads{id,fullname,email,whatsapp,mobile,tags{id}}}',
      search: email,
      page: 0,
      limit: 15,
    },
  });
  return response?.data?.leads?.[0] || null;
};

const updateLeadTags = async (leadId, desiredTags = [], reativacaoTagId) => {
  const tagsSet = new Set(desiredTags.filter(Boolean).map((tag) => Number(tag)));
  if (reativacaoTagId) tagsSet.add(Number(reativacaoTagId));
  if (tagsSet.size === 0) return null;
  return callSprinthub(`/leads/${leadId}`, {
    method: 'PUT',
    body: { id: leadId, tags: Array.from(tagsSet) },
  });
};

const listLeadOpportunities = async (leadId) => {
  const response = await callSprinthub(`/listopportunitysleadcomplete/${leadId}`, { method: 'GET' });
  return Array.isArray(response) ? response : [];
};

const createOpportunity = async (payload) => {
  const query = payload.funnelId ? { id: payload.funnelId } : {};
  const finalBody = { ...payload };
  delete finalBody.funnelId;
  finalBody.value = String(finalBody.value || '0');
  if (finalBody.sequence !== undefined && finalBody.sequence !== null) {
    finalBody.sequence = String(finalBody.sequence);
  } else {
    finalBody.sequence = '0';
  }
  if (!finalBody.fields) finalBody.fields = {};
  Object.keys(finalBody).forEach((key) => {
    if (finalBody[key] === undefined || finalBody[key] === null) {
      delete finalBody[key];
    }
  });
  return callSprinthub('/crmopportunity', {
    method: 'POST',
    query,
    body: finalBody,
  });
};

const ensureLeadAndOpportunity = async ({
  row,
  leadPayload,
  opportunityPayload,
  pedidosData,
  sprinthubTagId,
  origem,
  tipoCompra,
}) => {
  const summary = {
    leadName: leadPayload.rowName,
    leadId: null,
    opportunityId: null,
    status: 'pending',
    errors: [],
  };
  try {
    let existingLead = await findLeadByPhone(leadPayload.phone, leadPayload.whatsapp);
    if (!existingLead && leadPayload.email) {
      existingLead = await findLeadByEmail(leadPayload.email);
    }

    const leadRequest = {
      firstname: leadPayload.firstname,
      lastname: leadPayload.lastname,
      email: leadPayload.email,
      whatsapp: leadPayload.whatsapp,
      mobile: leadPayload.mobile,
      phone: leadPayload.phone,
      city: leadPayload.city,
      state: leadPayload.state,
      zipcode: leadPayload.zipcode,
      address: leadPayload.address,
      country: 'Brazil',
      timezone: 'America/Sao_Paulo',
      preferred_locale: 'pt-BR',
    };

    let leadId;
    if (existingLead?.id) {
      leadId = existingLead.id;
      await callSprinthub(`/leads/${leadId}`, {
        method: 'PUT',
        body: leadRequest,
      });
    } else {
      const created = await callSprinthub('/leads', {
        method: 'POST',
        body: leadRequest,
      });
      leadId = created?.id || created?.data?.id;
    }
    summary.leadId = leadId;

    if (leadId && sprinthubTagId) {
      const existingTagIds = existingLead?.tags?.map((t) => Number(t.id)) || [];
      await updateLeadTags(leadId, existingTagIds, sprinthubTagId);
    }

    let ultimoPedidoResumo = '';
    let ultimoOrcamentoResumo = '';
    const clientId = row.id_prime || row.prime_id || row.id_cliente || row.id_cliente_mestre;
    if (clientId && pedidosData[clientId]) {
      if (pedidosData[clientId].ultimoPedido) {
        ultimoPedidoResumo = buildResumoPedido(pedidosData[clientId].ultimoPedido);
      }
      if (pedidosData[clientId].ultimoOrcamento) {
        ultimoOrcamentoResumo = buildResumoPedido(pedidosData[clientId].ultimoOrcamento, { isOrcamento: true });
      }
    }

    const fields = {
      ...(opportunityPayload.fields || {}),
    };
    if (clientId) fields.idprime = String(clientId);
    if (pedidosData[clientId]?.ultimoPedido?.data_criacao) {
      fields.ultimopedido = new Date(pedidosData[clientId].ultimoPedido.data_criacao).toISOString().split('T')[0];
    }
    if (pedidosData[clientId]?.ultimoOrcamento?.data_criacao) {
      fields.ultimoorcamento = new Date(pedidosData[clientId].ultimoOrcamento.data_criacao).toISOString().split('T')[0];
    }
    if (ultimoPedidoResumo) {
      fields['Descricao da Formula'] = ultimoPedidoResumo;
    } else if (ultimoOrcamentoResumo) {
      fields['Descricao da Formula'] = ultimoOrcamentoResumo;
    }
    fields['ORIGEM OPORTUNIDADE'] = origem;
    fields['Tipo de Compra'] = tipoCompra;

    const existingOpps = await listLeadOpportunities(leadId);
    const targetColumn = opportunityPayload.crm_column;
    const duplicate = existingOpps.find((opp) => {
      const sameColumn = Number(opp.crm_column) === Number(targetColumn);
      const sameStatus = opp.status === 'open';
      const sameFunnel = !opp.funnel_id || Number(opp.funnel_id) === Number(opportunityPayload.funnelId);
      return sameColumn && sameStatus && sameFunnel;
    });

    if (duplicate) {
      summary.opportunityId = duplicate.id;
      summary.status = 'already-exists';
      return summary;
    }

    const createdOpp = await createOpportunity({
      ...opportunityPayload,
      lead_id: leadId,
      fields,
    });
    summary.opportunityId = createdOpp?.id || createdOpp?.data?.id;
    summary.status = 'created';
    return summary;
  } catch (error) {
    summary.status = 'error';
    summary.errors.push(error.message || 'Erro desconhecido');
    return summary;
  }
};

export const runReativacaoAutoSync = async (options = {}) => {
  const {
    viewName = 'vw_reativacao_1x',
    limit = Number(process.env.REATIVACAO_SYNC_LIMIT) || 200,
    batchSize = Number(options.batchSize || process.env.REATIVACAO_SYNC_BATCH || 50),
    funnelId = Number(options.funnelId || process.env.VITE_SPRINTHUB_FUNNEL_ID),
    columnId = Number(options.columnId || process.env.VITE_SPRINTHUB_COLUMN_ID),
    sequence = Number(options.sequence || process.env.VITE_SPRINTHUB_SEQUENCE_ID || 0),
    userId = Number(options.userId || process.env.VITE_SPRINTHUB_USER_ID),
    sprinthubTagId = Number(options.sprinthubTagId || process.env.REATIVACAO_TAG_ID || 221),
    origem = options.origem || 'Reativação',
    tipoCompra = options.tipoCompra || 'reativação',
    requireContact = options.requireContact !== undefined ? options.requireContact : true,
  } = options;

  const start = Date.now();
  const rows = await fetchReativacaoRows({ viewName, limit: limit * 2 });
  const filtered = rows.filter((row) => {
    if (!requireContact) return true;
    return isValidPhone(row.whatsapp) || isValidPhone(row.telefone);
  }).slice(0, limit);

  const leadIds = filtered
    .map((row) => getLeadIdentifier(row))
    .filter(Boolean);
  const alreadySentSet = await fetchHistoricoSet(leadIds);
  const pending = filtered.filter((row) => {
    const identifier = getLeadIdentifier(row);
    if (!identifier) return true;
    return !alreadySentSet.has(String(identifier));
  });

  const batches = chunkArray(pending, batchSize);
  const pedidosData = await fetchPedidosDataForRows(pending);
  const batchSummaries = [];

  for (const batchRows of batches) {
    const batchResults = [];
    for (const row of batchRows) {
      const leadPayload = normalizeLeadFromRow(row);
      const opportunityPayload = {
        funnelId,
        crm_column: columnId,
        title: `${process.env.REATIVACAO_TITLE_PREFIX || 'Reativação'} | ${leadPayload.rowName}`,
        value: row.valor_referencia || row.valor_ultimo_pedido || '0',
        status: 'open',
        user: userId,
        sequence: String(sequence),
        fields: {},
      };
      const result = await ensureLeadAndOpportunity({
        row,
        leadPayload,
        opportunityPayload,
        pedidosData,
        sprinthubTagId,
        origem,
        tipoCompra,
      });
      batchResults.push(result);
    }
    batchSummaries.push({
      total: batchResults.length,
      success: batchResults.filter((r) => r.status === 'created' || r.status === 'already-exists').length,
      errors: batchResults.filter((r) => r.status === 'error'),
      results: batchResults,
    });
  }

  return {
    totalSelected: filtered.length,
    totalPending: pending.length,
    batches: batchSummaries,
    durationMs: Date.now() - start,
  };
};

export default runReativacaoAutoSync;





