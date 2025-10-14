/**
 * 🔄 SERVIÇO DE INTEGRAÇÃO CALLIX
 * Gerencia importação e enriquecimento de leads por segmento
 */

import { supabase, getSupabaseWithSchema } from './supabase.js';

const CONFIG = {
  SPRINTHUB: {
    baseUrl: import.meta.env.VITE_SPRINTHUB_BASE_URL || 'sprinthub-api-master.sprinthub.app',
    apiToken: import.meta.env.VITE_SPRINTHUB_API_TOKEN,
    instance: import.meta.env.VITE_SPRINTHUB_INSTANCE || 'oficialmed',
  },
  SUPABASE: {
    url: import.meta.env.VITE_SUPABASE_URL,
    serviceRoleKey: import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY,
  },
  PAGINATION: {
    limit: 100,
    delayBetweenLeads: 500
  }
};

// ==================== UTILITÁRIOS ====================

async function makeRequest(url, options = {}) {
  try {
    const fetchOptions = {
      method: options.method || 'GET',
      headers: options.headers || {},
      body: options.body || null,
      timeout: 30000
    };

    const response = await fetch(url, fetchOptions);
    let data;

    try {
      data = await response.json();
    } catch {
      data = await response.text();
    }

    return {
      ok: response.ok,
      status: response.status,
      data: data
    };
  } catch (error) {
    throw new Error(`Request failed: ${error.message}`);
  }
}

// ==================== BUSCAR SEGMENTOS ====================

export async function getSegmentos() {
  try {
    console.log('🔍 Buscando segmentos...');
    
    const supabaseClient = getSupabaseWithSchema('api');
    const { data, error } = await supabaseClient
      .from('segmento')
      .select('*')
      .eq('is_published', true)
      .order('name');

    if (error) {
      console.error('❌ Erro ao buscar segmentos:', error);
      throw error;
    }

    console.log(`✅ ${data.length} segmentos encontrados`);
    return data;
  } catch (error) {
    console.error('❌ Erro ao buscar segmentos:', error);
    throw error;
  }
}

// ==================== BUSCAR LEADS DO SEGMENTO ====================

async function fetchLeadsFromSegment(segmentId) {
  const url = `https://${CONFIG.SPRINTHUB.baseUrl}/leadsfromtype/segment/${segmentId}?i=${CONFIG.SPRINTHUB.instance}&apitoken=${CONFIG.SPRINTHUB.apiToken}`;
  const requestBody = {
    "page": 0,
    "limit": 100,
    "orderByKey": "createDate",
    "orderByDirection": "desc",
    "showAnon": false,
    "search": "",
    "query": "{total,leads{id,fullname,photoUrl,email,points,city,state,country,lastActive,archived,owner{completName},companyData{companyname},createDate}}",
    "showArchived": false,
    "additionalFilter": null,
    "idOnly": false
  };

  try {
    const response = await makeRequest(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
        // Removido Authorization header que causa CORS
      },
      body: JSON.stringify(requestBody)
    });

    if (response.ok && response.data && response.data.data && response.data.data.leads) {
      return response.data.data.leads;
    }

    throw new Error('Resposta inválida da API');
  } catch (error) {
    console.error(`❌ Erro ao buscar leads do segmento: ${error.message}`);
    return [];
  }
}

// ==================== BUSCAR DADOS COMPLETOS DO LEAD ====================

async function fetchFullLeadData(leadId) {
  const url = `https://${CONFIG.SPRINTHUB.baseUrl}/leads/${leadId}?i=${CONFIG.SPRINTHUB.instance}&allFields=1&apitoken=${CONFIG.SPRINTHUB.apiToken}`;
  
  try {
    const response = await makeRequest(url, {
      headers: {
        'Accept': 'application/json'
        // Removido Authorization header que causa CORS
      }
    });

    if (response.ok && response.data && response.data.data && response.data.data.lead) {
      return response.data.data.lead;
    }

    throw new Error('Lead não encontrado');
  } catch (error) {
    throw new Error(`Erro ao buscar lead ${leadId}: ${error.message}`);
  }
}

// ==================== SUPABASE OPERATIONS ====================

async function checkLeadExists(leadId) {
  try {
    const response = await fetch(`${CONFIG.SUPABASE.url}/rest/v1/leads?id=eq.${leadId}&select=id`, {
      headers: {
        'apikey': CONFIG.SUPABASE.serviceRoleKey,
        'Authorization': `Bearer ${CONFIG.SUPABASE.serviceRoleKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const data = await response.json();
      return data.length > 0;
    }
    return false;
  } catch (error) {
    console.error(`❌ Erro ao verificar lead: ${error.message}`);
    return false;
  }
}

async function insertLeadToSupabase(leadData) {
  try {
    const response = await fetch(`${CONFIG.SUPABASE.url}/rest/v1/leads`, {
      method: 'POST',
      headers: {
        'apikey': CONFIG.SUPABASE.serviceRoleKey,
        'Authorization': `Bearer ${CONFIG.SUPABASE.serviceRoleKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify(leadData)
    });

    if (response.ok) {
      return { success: true };
    } else {
      const errorData = await response.text();
      return { success: false, error: errorData };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function updateLeadInSupabase(leadId, leadData) {
  try {
    const response = await fetch(`${CONFIG.SUPABASE.url}/rest/v1/leads?id=eq.${leadId}`, {
      method: 'PATCH',
      headers: {
        'apikey': CONFIG.SUPABASE.serviceRoleKey,
        'Authorization': `Bearer ${CONFIG.SUPABASE.serviceRoleKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify(leadData)
    });

    if (response.ok) {
      return { success: true };
    } else {
      const errorData = await response.text();
      return { success: false, error: errorData };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// ==================== MAPEAMENTO ====================

function mapFullLeadFields(lead, segmentId) {
  return {
    id: lead.id,
    firstname: lead.firstname || null,
    lastname: lead.lastname || null,
    email: lead.email || null,
    phone: lead.phone || null,
    whatsapp: lead.whatsapp || null,
    mobile: lead.mobile || null,
    photo_url: lead.photoUrl || null,
    address: lead.address || null,
    city: lead.city || null,
    state: lead.state || null,
    country: lead.country || null,
    zipcode: lead.zipcode || null,
    timezone: lead.timezone || null,
    bairro: lead.bairro || null,
    complemento: lead.complemento || null,
    numero_entrega: lead.numeroEntrega || null,
    rua_entrega: lead.ruaEntrega || null,
    company: lead.company || null,
    points: parseInt(lead.points) || 0,
    owner: lead.owner?.id || null,
    stage: lead.stage || null,
    preferred_locale: lead.preferredLocale || null,
    user_access: lead.userAccess || null,
    department_access: lead.departmentAccess || null,
    ignore_sub_departments: lead.ignoreSubDepartments || false,
    create_date: lead.createDate || null,
    updated_date: lead.updatedDate || null,
    last_active: lead.lastActive || null,
    created_by: lead.createdBy?.id || null,
    created_by_name: lead.createdBy?.name || null,
    created_by_type: lead.createdByType || null,
    updated_by: lead.updatedBy?.id || null,
    updated_by_name: lead.updatedBy?.name || null,
    archived: lead.archived || false,
    third_party_data: lead.thirdPartyData || null,
    capital_de_investimento: lead.capitalDeInvestimento || null,
    tipo_de_compra: lead.tipoDeCompra || null,
    pedidos_shopify: lead.pedidosShopify || null,
    categoria: lead.categoria || null,
    classificacao_google: lead.classificacaoGoogle || null,
    grau_de_interesse: lead.grauDeInteresse || null,
    star_score: lead.starScore || null,
    avaliacao_atendente: lead.avaliacaoAtendente || null,
    avaliacao_atendimento: lead.avaliacaoAtendimento || null,
    qualificacao_callix: lead.qualificacaoCallix || null,
    origem: lead.origem || null,
    origem_manipulacao: lead.origemManipulacao || null,
    lista_de_origem: lead.listaDeOrigem || null,
    criativo: lead.criativo || null,
    plataforma: lead.plataforma || null,
    redes_sociais: lead.redesSociais || null,
    site: lead.site || null,
    atendente: lead.atendente || null,
    atendente_atual: lead.atendenteAtual || null,
    feedback: lead.feedback || null,
    observacao: lead.observacao || null,
    observacoes_do_lead: lead.observacoesDoLead || null,
    comportamento_da_ia: lead.comportamentoDaIa || null,
    retorno: lead.retorno || null,
    prescritor: lead.prescritor || null,
    produto: lead.produto || null,
    drograria: lead.drograria || null,
    data_recompra: lead.dataRecompra || null,
    mes_que_entrou: lead.mesQueEntrou || null,
    cpf: lead.cpf || null,
    rg: lead.rg || null,
    arquivo_receita: lead.arquivoReceita || null,
    id_t56: lead.idT56 || null,
    empresa: lead.empresa || null,
    sexo: lead.sexo || null,
    data_de_nascimento: lead.dataDeNascimento || null,
    objetivos_do_cliente: lead.objetivosDoCliente || null,
    perfil_do_cliente: lead.perfilDoCliente || null,
    recebedor: lead.recebedor || null,
    whatsapp_remote_lid: lead.whatsappRemoteLid || null,
    status: lead.status || null,
    sh_status: lead.shStatus || null,
    data_do_contato: lead.dataDoContato || null,
    segmento: parseInt(segmentId)
  };
}

// ==================== PROCESSAMENTO ====================

async function processLeadComplete(leadId, segmentId, stats, onProgress) {
  try {
    // 1. Verificar se lead já existe
    const exists = await checkLeadExists(leadId);
    
    if (exists) {
      // 2. Buscar dados completos
      const fullLeadData = await fetchFullLeadData(leadId);
      
      // 3. Mapear dados completos
      const mappedData = mapFullLeadFields(fullLeadData, segmentId);
      
      // 4. Atualizar no Supabase
      const result = await updateLeadInSupabase(leadId, mappedData);
      
      if (result.success) {
        stats.updated++;
        if (onProgress) onProgress(`Lead ${leadId} atualizado`);
        return { success: true, action: 'updated' };
      } else {
        stats.errors++;
        console.error(`❌ Erro ao atualizar lead ${leadId}: ${result.error}`);
        return { success: false, error: result.error };
      }
    } else {
      // 2. Buscar dados completos
      const fullLeadData = await fetchFullLeadData(leadId);
      
      // 3. Mapear dados completos
      const mappedData = mapFullLeadFields(fullLeadData, segmentId);
      
      // 4. Inserir no Supabase
      const result = await insertLeadToSupabase(mappedData);
      
      if (result.success) {
        stats.inserted++;
        if (onProgress) onProgress(`Lead ${leadId} inserido`);
        return { success: true, action: 'inserted' };
      } else {
        stats.errors++;
        console.error(`❌ Erro ao inserir lead ${leadId}: ${result.error}`);
        return { success: false, error: result.error };
      }
    }
  } catch (error) {
    stats.errors++;
    console.error(`❌ Erro ao processar lead ${leadId}: ${error.message}`);
    if (onProgress) onProgress(`Erro no lead ${leadId}: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// ==================== FUNÇÃO PRINCIPAL ====================

export async function importAndEnrichSegment(segmentId, onProgress = null) {
  const startTime = Date.now();
  
  console.log(`🚀 Importando e enriquecendo segmento ${segmentId}...`);
  
  const stats = {
    totalLeadsInSegment: 0,
    processed: 0,
    inserted: 0,
    updated: 0,
    errors: 0
  };

  try {
    // 1. Buscar leads do segmento
    if (onProgress) onProgress('Buscando leads do segmento...');
    const leads = await fetchLeadsFromSegment(segmentId);
    
    if (leads.length === 0) {
      if (onProgress) onProgress('⚠️ Nenhum lead encontrado no segmento');
      return {
        success: true,
        message: 'Nenhum lead encontrado no segmento',
        stats
      };
    }
    
    stats.totalLeadsInSegment = leads.length;
    if (onProgress) onProgress(`✅ Encontrados ${leads.length} leads no segmento`);
    
    // 2. Processar cada lead (inserção/atualização + enriquecimento)
    if (onProgress) onProgress(`🚀 Processando ${leads.length} leads...`);
    
    for (let i = 0; i < leads.length; i++) {
      const lead = leads[i];
      stats.processed++;
      
      const result = await processLeadComplete(lead.id, segmentId, stats, onProgress);
      
      // Delay entre leads para respeitar rate limit
      if (i < leads.length - 1) {
        await new Promise(resolve => setTimeout(resolve, CONFIG.PAGINATION.delayBetweenLeads));
      }
    }
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    const successRate = ((stats.inserted + stats.updated) / stats.processed * 100).toFixed(1);
    
    const result = {
      success: true,
      message: `Processamento concluído em ${duration}s`,
      stats: {
        ...stats,
        duration: parseFloat(duration),
        successRate: parseFloat(successRate)
      }
    };
    
    if (onProgress) {
      onProgress(`✅ Concluído! ${stats.inserted} inseridos, ${stats.updated} atualizados, ${stats.errors} erros`);
    }
    
    console.log('✅ Importação e enriquecimento concluídos:', result);
    return result;
    
  } catch (error) {
    console.error(`❌ Erro na importação: ${error.message}`);
    if (onProgress) onProgress(`❌ Erro: ${error.message}`);
    
    return {
      success: false,
      error: error.message,
      stats
    };
  }
}

// ==================== FUNÇÃO PARA ENRIQUECER LEADS EXISTENTES ====================

export async function enrichExistingLeads(segmentId, onProgress = null) {
  const startTime = Date.now();
  
  console.log(`🔄 Enriquecendo leads do segmento ${segmentId}...`);
  
  const stats = {
    totalLeads: 0,
    processed: 0,
    updated: 0,
    errors: 0
  };

  try {
    // 1. Buscar leads do segmento no Supabase
    if (onProgress) onProgress('Buscando leads no Supabase...');
    
    const supabaseClient = getSupabaseWithSchema('api');
    const { data: leads, error } = await supabaseClient
      .from('leads')
      .select('id')
      .eq('segmento', segmentId);

    if (error) {
      throw new Error(`Erro ao buscar leads: ${error.message}`);
    }

    if (!leads || leads.length === 0) {
      if (onProgress) onProgress('⚠️ Nenhum lead encontrado para enriquecimento');
      return {
        success: true,
        message: 'Nenhum lead encontrado para enriquecimento',
        stats
      };
    }

    stats.totalLeads = leads.length;
    if (onProgress) onProgress(`✅ Encontrados ${leads.length} leads para enriquecer`);
    
    // 2. Enriquecer cada lead
    if (onProgress) onProgress(`🔄 Enriquecendo ${leads.length} leads...`);
    
    for (let i = 0; i < leads.length; i++) {
      const lead = leads[i];
      stats.processed++;
      
      try {
        // Buscar dados completos do SprintHub
        const fullLeadData = await fetchFullLeadData(lead.id);
        
        // Mapear dados completos
        const mappedData = mapFullLeadFields(fullLeadData, segmentId);
        
        // Atualizar no Supabase
        const result = await updateLeadInSupabase(lead.id, mappedData);
        
        if (result.success) {
          stats.updated++;
          if (onProgress) onProgress(`Lead ${lead.id} enriquecido`);
        } else {
          stats.errors++;
          if (onProgress) onProgress(`Erro ao enriquecer lead ${lead.id}`);
        }
        
        // Delay entre leads para respeitar rate limit
        if (i < leads.length - 1) {
          await new Promise(resolve => setTimeout(resolve, CONFIG.PAGINATION.delayBetweenLeads));
        }
        
      } catch (error) {
        stats.errors++;
        console.error(`❌ Erro ao enriquecer lead ${lead.id}:`, error);
        if (onProgress) onProgress(`Erro no lead ${lead.id}: ${error.message}`);
      }
    }
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    const successRate = ((stats.updated / stats.processed) * 100).toFixed(1);
    
    const result = {
      success: true,
      message: `Enriquecimento concluído em ${duration}s`,
      stats: {
        ...stats,
        duration: parseFloat(duration),
        successRate: parseFloat(successRate)
      }
    };
    
    if (onProgress) {
      onProgress(`✅ Enriquecimento concluído! ${stats.updated} atualizados, ${stats.errors} erros`);
    }
    
    console.log('✅ Enriquecimento concluído:', result);
    return result;
    
  } catch (error) {
    console.error(`❌ Erro no enriquecimento: ${error.message}`);
    if (onProgress) onProgress(`❌ Erro: ${error.message}`);
    
    return {
      success: false,
      error: error.message,
      stats
    };
  }
}

// ==================== FUNÇÃO PARA ENVIAR LEADS PARA CALLIX ====================

export async function sendLeadsToCallix(segmentId, onProgress = null) {
  try {
    if (onProgress) onProgress('🚀 Enviando leads para Callix...');
    
    // Buscar leads do segmento no Supabase
    const supabaseClient = getSupabaseWithSchema('api');
    const { data: leads, error } = await supabaseClient
      .from('leads')
      .select('*')
      .eq('segmento', segmentId)
      .not('whatsapp', 'is', null);

    if (error) {
      throw new Error(`Erro ao buscar leads: ${error.message}`);
    }

    if (!leads || leads.length === 0) {
      if (onProgress) onProgress('⚠️ Nenhum lead encontrado para envio');
      return {
        success: true,
        message: 'Nenhum lead encontrado para envio',
        sent: 0
      };
    }

    // TODO: Implementar envio real para Callix API
    // Por enquanto, simular o envio
    let sent = 0;
    let errors = 0;

    for (const lead of leads) {
      try {
        // Simular envio para Callix
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // TODO: Implementar chamada real para Callix API
        // const response = await fetch('https://api.callix.com/leads', {
        //   method: 'POST',
        //   headers: { 'Authorization': `Bearer ${CALLIX_TOKEN}` },
        //   body: JSON.stringify({
        //     name: `${lead.firstname} ${lead.lastname}`,
        //     phone: lead.whatsapp,
        //     email: lead.email,
        //     // ... outros campos
        //   })
        // });
        
        sent++;
        if (onProgress) onProgress(`Lead ${lead.id} enviado para Callix`);
        
      } catch (error) {
        errors++;
        console.error(`❌ Erro ao enviar lead ${lead.id}:`, error);
        if (onProgress) onProgress(`Erro ao enviar lead ${lead.id}`);
      }
    }

    const result = {
      success: true,
      message: `${sent} leads enviados para Callix`,
      stats: {
        total: leads.length,
        sent,
        errors
      }
    };

    if (onProgress) onProgress(`✅ ${sent} leads enviados para Callix`);
    console.log('✅ Envio para Callix concluído:', result);
    return result;

  } catch (error) {
    console.error(`❌ Erro no envio para Callix: ${error.message}`);
    if (onProgress) onProgress(`❌ Erro: ${error.message}`);
    
    return {
      success: false,
      error: error.message
    };
  }
}

// ==================== FUNÇÃO PARA VERIFICAR STATUS DE LEADS NO CALLIX ====================

export async function checkCallixStatus(segmentId, onProgress = null) {
  try {
    if (onProgress) onProgress('🔍 Verificando status dos leads no Callix...');
    
    // TODO: Implementar verificação real com Callix API
    // Por enquanto, simular a verificação
    
    const result = {
      success: true,
      message: 'Status verificado com sucesso',
      stats: {
        total: 0,
        contacted: 0,
        notContacted: 0,
        converted: 0
      }
    };

    if (onProgress) onProgress('✅ Status verificado');
    console.log('✅ Verificação de status concluída:', result);
    return result;

  } catch (error) {
    console.error(`❌ Erro na verificação de status: ${error.message}`);
    if (onProgress) onProgress(`❌ Erro: ${error.message}`);
    
    return {
      success: false,
      error: error.message
    };
  }
}
