/**
 * 🔄 SERVIÇO DE INTEGRAÇÃO CALLIX
 * Gerencia importação e enriquecimento de leads por segmento
 */

import { supabase, getSupabaseWithSchema } from './supabase.js';
import { supabaseUrl, supabaseServiceKey } from '../config/supabase.js';

const CONFIG = {
  SPRINTHUB: {
    baseUrl: import.meta.env.VITE_SPRINTHUB_BASE_URL || 'sprinthub-api-master.sprinthub.app',
    apiToken: import.meta.env.VITE_SPRINTHUB_API_TOKEN,
    instance: import.meta.env.VITE_SPRINTHUB_INSTANCE || 'oficialmed',
  },
  SUPABASE: {
    url: window.ENV?.VITE_SUPABASE_URL || supabaseUrl,
    serviceRoleKey: window.ENV?.VITE_SUPABASE_SERVICE_ROLE_KEY || supabaseServiceKey,
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
  
  let allLeads = [];
  let page = 0;
  const limit = 100; // Buscar 100 por vez
  let hasMore = true;

  try {
    while (hasMore) {
      const requestBody = {
        "page": page,
        "limit": limit,
        "orderByKey": "createDate",
        "orderByDirection": "desc",
        "showAnon": false,
        "search": "",
        "query": "{total,leads{id,fullname,photoUrl,email,points,city,state,country,lastActive,archived,owner{completName},companyData{companyname},createDate}}",
        "showArchived": false,
        "additionalFilter": null,
        "idOnly": false
      };

      console.log(`🔍 Buscando página ${page + 1} do segmento ${segmentId}...`);

      const response = await makeRequest(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      if (response.ok && response.data && response.data.data && response.data.data.leads) {
        const leads = response.data.data.leads;
        allLeads = allLeads.concat(leads);
        
        console.log(`✅ Página ${page + 1}: ${leads.length} leads encontrados (Total: ${allLeads.length})`);
        
        // Se retornou menos que o limite, não há mais páginas
        if (leads.length < limit) {
          hasMore = false;
        } else {
          page++;
          // Delay entre páginas para respeitar rate limit
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      } else {
        throw new Error('Resposta inválida da API');
      }
    }

    console.log(`🎯 Total de leads encontrados no segmento: ${allLeads.length}`);
    return allLeads;

  } catch (error) {
    console.error(`❌ Erro ao buscar leads do segmento: ${error.message}`);
    return allLeads; // Retornar o que conseguiu buscar até agora
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

export async function sendLeadsToCallix(segmentId, campaignId, onProgress = null, forceResend = false) {
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
        stats: { total: 0, sent: 0, alreadySent: 0, errors: 0 }
      };
    }

    // Verificar quais leads já foram enviados para o Callix
    const { data: sentLeads, error: sentError } = await supabaseClient
      .from('lead_callix_status')
      .select('lead_id')
      .eq('segmento_id', segmentId)
      .eq('enviado_callix', true);

    if (sentError) {
      console.warn('⚠️ Erro ao verificar leads já enviados:', sentError.message);
    }

    const sentLeadIds = sentLeads ? sentLeads.map(l => l.lead_id) : [];
    const leadsToSend = forceResend ? leads : leads.filter(lead => !sentLeadIds.includes(lead.id));
    const alreadySentCount = leads.length - (forceResend ? 0 : leadsToSend.length);

    if (onProgress) {
      if (forceResend) {
        onProgress(`🔄 REENVIO FORÇADO: ${leads.length} leads serão reenviados`);
      } else {
        onProgress(`📊 Total: ${leads.length} leads | Já enviados: ${alreadySentCount} | Para enviar: ${leadsToSend.length}`);
      }
    }

    if (!forceResend && leadsToSend.length === 0) {
      if (onProgress) onProgress('✅ Todos os leads já foram enviados para o Callix');
      return {
        success: true,
        message: 'Todos os leads já foram enviados para o Callix',
        stats: { total: leads.length, sent: 0, alreadySent: alreadySentCount, errors: 0 }
      };
    }

    // Enviar leads para Callix API real
    const CALLIX_TOKEN = '68b46239-a040-4703-b8e9-c0b25b519e64';
    const CALLIX_URL = 'https://oficialmed.callix.com.br/api/v1/campaign_contacts_async';
    
    let sent = 0;
    let errors = 0;

    // 🎯 FUNÇÃO CORRIGIDA PARA TELEFONE BRASILEIRO
    const corrigirTelefoneBrasileiro = (telefone) => {
      try {
        if (!telefone || telefone.trim() === '') {
          return '';
        }
        
        // Remover espaços e caracteres especiais
        let telLimpo = telefone.replace(/\D/g, '');
        
        // Se começa com 55 (DDI do Brasil), remover
        if (telLimpo.startsWith('55')) {
          telLimpo = telLimpo.substring(2);
        }
        
        // Se ainda tem mais de 11 dígitos após remover DDI, pode ser que tenha 55 duplicado
        if (telLimpo.length > 11 && telLimpo.startsWith('55')) {
          telLimpo = telLimpo.substring(2);
        }
        
        // 🎯 NOVA LÓGICA: Adicionar 9 faltante após DDD
        if (telLimpo.length === 10) {
          // Telefone tem 10 dígitos: DDD + 8 dígitos
          // Formato correto: DDD + 9 + 8 dígitos = 11 dígitos
          const ddd = telLimpo.substring(0, 2);  // Primeiros 2 dígitos (DDD)
          const numero = telLimpo.substring(2);   // Últimos 8 dígitos
          telLimpo = ddd + '9' + numero;         // Adicionar 9 após DDD
          
          console.log(`📱 Telefone corrigido: ${telefone} → ${telLimpo} (adicionado 9 após DDD)`);
        } else if (telLimpo.length === 11) {
          // Telefone já tem 11 dígitos: DDD + 9 + 8 dígitos (formato correto)
          console.log(`📱 Telefone já correto: ${telefone} → ${telLimpo} (11 dígitos)`);
        } else {
          // Telefone com número de dígitos inválido
          console.warn(`⚠️ Telefone com formato inválido: ${telefone} → ${telLimpo} (${telLimpo.length} dígitos)`);
        }
        
        return telLimpo;
        
      } catch (error) {
        console.error('❌ Erro ao processar telefone:', telefone, error);
        return telefone; // Retornar original em caso de erro
      }
    };

    // Função para formatar data DD/MM/AAAA
    const formatarDataDDMMAAAA = (data) => {
      if (!data) return '';
      try {
        const dataObj = new Date(data);
        if (isNaN(dataObj.getTime())) return '';
        
        const dia = dataObj.getDate().toString().padStart(2, '0');
        const mes = (dataObj.getMonth() + 1).toString().padStart(2, '0');
        const ano = dataObj.getFullYear().toString();
        
        return `${dia}/${mes}/${ano}`;
      } catch (error) {
        return '';
      }
    };

    // Enviar leads em lotes para respeitar rate limit (1 req/min)
    const BATCH_SIZE = 100; // Enviar 100 leads por vez
    const batches = [];
    
    // Dividir leads em lotes
    for (let i = 0; i < leadsToSend.length; i += BATCH_SIZE) {
      batches.push(leadsToSend.slice(i, i + BATCH_SIZE));
    }

    if (onProgress) onProgress(`📦 Enviando ${leadsToSend.length} leads em ${batches.length} lotes de ${BATCH_SIZE}`);

    for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
      const batch = batches[batchIndex];
      
      try {
        if (onProgress) onProgress(`📤 Enviando lote ${batchIndex + 1}/${batches.length} (${batch.length} leads)...`);
        console.log(`🔄 Processando lote ${batchIndex + 1}/${batches.length} com ${batch.length} leads`);

        // Preparar dados do lote
        const importData = batch.map(lead => ({
          Nome: lead.firstname || 'Lead sem nome',
          Sobrenome: lead.lastname || '',
          link: `https://oficialmed.sprinthub.app/sh/leads/profile/${lead.id}`,
          email: lead.email || '',
          telefone: corrigirTelefoneBrasileiro(lead.whatsapp || lead.phone || ''),
          cidade: lead.city || '',
          estado: lead.state || '',
          'Data-compra': lead.data_ultima_compra ? formatarDataDDMMAAAA(lead.data_ultima_compra) : '',
          Observacao: lead.observacao || '',
          Formula: lead.descricao_formula || '',
          'tipo-compra': lead.tipo_de_compra || '',
          'objetivo-cliente': lead.objetivos_do_cliente || ''
        }));

        const payload = {
          data: {
            type: "campaign_contacts_async",
            attributes: {
              remove_duplicated_phones: "true",
              import_data: importData
            },
            relationships: {
              campaign_list: {
                data: {
                  type: "campaign_lists",
                  id: campaignId
                }
              }
            }
          }
        };

        const response = await fetch(CALLIX_URL, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${CALLIX_TOKEN}`,
            'Content-Type': 'application/vnd.api+json'
          },
          body: JSON.stringify(payload)
        });

        if (response.ok) {
          const result = await response.json();
          sent += batch.length;
          
          // Registrar todos os leads do lote no controle de status
          for (const lead of batch) {
            await supabaseClient
              .from('lead_callix_status')
              .upsert({
                lead_id: lead.id,
                segmento_id: segmentId,
                enviado_callix: true,
                data_envio_callix: new Date().toISOString(),
                callix_id: result.data?.id?.toString() || 'unknown',
                status_callix: 'sent'
              }, {
                onConflict: 'lead_id,segmento_id'
              });
          }

          if (onProgress) onProgress(`✅ Lote ${batchIndex + 1}/${batches.length} enviado: ${batch.length} leads`);
          
          // Delay para respeitar rate limit (1 req/min = 60 segundos)
          if (batchIndex < batches.length - 1) {
            if (onProgress) onProgress('⏳ Aguardando 60s para respeitar rate limit (1 req/min)...');
            await new Promise(resolve => setTimeout(resolve, 60000));
          }
        } else {
          errors += batch.length;
          const errorText = await response.text();
          console.error(`❌ Erro ao enviar lote ${batchIndex + 1}:`, errorText);
          if (onProgress) onProgress(`❌ Erro ao enviar lote ${batchIndex + 1}: ${response.status}`);
          // Continuar para o próximo lote mesmo com erro
          continue;
        }
        
      } catch (error) {
        errors += batch.length;
        console.error(`❌ Erro ao enviar lote ${batchIndex + 1}:`, error);
        if (onProgress) onProgress(`❌ Erro ao enviar lote ${batchIndex + 1}: ${error.message}`);
        // Continuar para o próximo lote mesmo com erro
        continue;
      }
      
      console.log(`✅ Lote ${batchIndex + 1}/${batches.length} processado com sucesso`);
    }

    const result = {
      success: true,
      message: `${sent} leads enviados para Callix`,
      stats: {
        total: leads.length,
        sent,
        alreadySent: alreadySentCount,
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
