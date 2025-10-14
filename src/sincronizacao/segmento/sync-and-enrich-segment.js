#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ==================== CONFIGURAÇÃO ====================

const CONFIG = {
  SPRINTHUB: {
    baseUrl: process.env.VITE_SPRINTHUB_BASE_URL || 'sprinthub-api-master.sprinthub.app',
    apiToken: process.env.VITE_SPRINTHUB_API_TOKEN,
    instance: process.env.VITE_SPRINTHUB_INSTANCE || 'oficialmed',
  },
  SUPABASE: {
    url: process.env.VITE_SUPABASE_URL,
    key: process.env.VITE_SUPABASE_SERVICE_ROLE_KEY,
  },
  PAGINATION: {
    limit: 100,
    delayBetweenPages: 2000,
    delayBetweenLeads: 500
  },
  CHECKPOINT_FILE: path.join(__dirname, 'checkpoint-sync-and-enrich.json')
};

// ==================== UTILITÁRIOS ====================

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

// ==================== FUNÇÕES DE API ====================

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
        'Accept': 'application/json',
        'Authorization': `Bearer ${CONFIG.SPRINTHUB.apiToken}`,
        'apitoken': CONFIG.SPRINTHUB.apiToken
      },
      body: JSON.stringify(requestBody)
    });

    if (response.ok && response.data && response.data.data && response.data.data.leads) {
      return response.data.data.leads;
    }

    throw new Error('Resposta inválida da API');
  } catch (error) {
    console.error(`${colors.red}❌ Erro ao buscar leads do segmento: ${error.message}${colors.reset}`);
    return [];
  }
}

// ==================== BUSCAR DADOS COMPLETOS DO LEAD ====================

async function fetchFullLeadData(leadId) {
  const url = `https://${CONFIG.SPRINTHUB.baseUrl}/leads/${leadId}?i=${CONFIG.SPRINTHUB.instance}&allFields=1&apitoken=${CONFIG.SPRINTHUB.apiToken}`;
  
  try {
    const response = await makeRequest(url, {
      headers: {
        'Authorization': `Bearer ${CONFIG.SPRINTHUB.apiToken}`,
        'apitoken': CONFIG.SPRINTHUB.apiToken
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

// ==================== SUPABASE ====================

async function checkLeadExists(leadId) {
  try {
    const response = await fetch(`${CONFIG.SUPABASE.url}/rest/v1/leads?id=eq.${leadId}&select=id`, {
      headers: {
        'apikey': CONFIG.SUPABASE.key,
        'Authorization': `Bearer ${CONFIG.SUPABASE.key}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const data = await response.json();
      return data.length > 0;
    }
    return false;
  } catch (error) {
    console.error(`${colors.red}❌ Erro ao verificar lead: ${error.message}${colors.reset}`);
    return false;
  }
}

async function insertLeadToSupabase(leadData) {
  try {
    const response = await fetch(`${CONFIG.SUPABASE.url}/rest/v1/leads`, {
      method: 'POST',
      headers: {
        'apikey': CONFIG.SUPABASE.key,
        'Authorization': `Bearer ${CONFIG.SUPABASE.key}`,
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
        'apikey': CONFIG.SUPABASE.key,
        'Authorization': `Bearer ${CONFIG.SUPABASE.key}`,
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

function mapLeadFieldsFromSegment(lead, segmentId) {
  return {
    id: lead.id,
    firstname: lead.fullname ? lead.fullname.split(' ')[0] : null,
    lastname: lead.fullname ? lead.fullname.split(' ').slice(1).join(' ') : null,
    email: lead.email || null,
    points: parseInt(lead.points) || 0,
    city: lead.city || null,
    state: lead.state || null,
    country: lead.country || null,
    last_active: lead.lastActive || null,
    archived: lead.archived || false,
    create_date: lead.createDate || null,
    segmento: parseInt(segmentId)
  };
}

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

async function processLeadComplete(leadId, segmentId, stats) {
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
        return { success: true, action: 'updated' };
      } else {
        stats.errors++;
        console.error(`${colors.red}❌ Erro ao atualizar lead ${leadId}: ${result.error}${colors.reset}`);
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
        return { success: true, action: 'inserted' };
      } else {
        stats.errors++;
        console.error(`${colors.red}❌ Erro ao inserir lead ${leadId}: ${result.error}${colors.reset}`);
        return { success: false, error: result.error };
      }
    }
  } catch (error) {
    stats.errors++;
    console.error(`${colors.red}❌ Erro ao processar lead ${leadId}: ${error.message}${colors.reset}`);
    return { success: false, error: error.message };
  }
}

// ==================== PROGRESS BAR ====================

function updateProgress(current, total, leadId, action = '') {
  const percentage = Math.round((current / total) * 100);
  const filled = Math.round((percentage / 100) * 40);
  const bar = '█'.repeat(filled) + '░'.repeat(40 - filled);
  
  const actionText = action ? ` (${action})` : '';
  process.stdout.write(`\r${colors.cyan}[${bar}] ${percentage}% (${current}/${total}) Lead ID: ${leadId}${actionText}${colors.reset}`);
}

// ==================== FUNÇÃO PRINCIPAL ====================

async function syncAndEnrichSegment(segmentId) {
  const startTime = Date.now();
  
  console.log(`${colors.cyan}============================================================${colors.reset}`);
  console.log(`${colors.cyan}🚀 SINCRONIZAÇÃO + ENRIQUECIMENTO - SEGMENTO ${segmentId}${colors.reset}`);
  console.log(`${colors.cyan}============================================================${colors.reset}`);
  
  const stats = {
    totalLeadsInSegment: 0,
    processed: 0,
    inserted: 0,
    updated: 0,
    errors: 0
  };

  try {
    // 1. Buscar leads do segmento
    console.log(`${colors.cyan}🔍 Buscando leads do segmento ${segmentId}...${colors.reset}`);
    const leads = await fetchLeadsFromSegment(segmentId);
    
    if (leads.length === 0) {
      console.log(`${colors.yellow}⚠️  Nenhum lead encontrado no segmento ${segmentId}${colors.reset}`);
      return;
    }
    
    stats.totalLeadsInSegment = leads.length;
    console.log(`${colors.green}✅ Encontrados ${leads.length} leads no segmento${colors.reset}`);
    
    // 2. Processar cada lead (inserção/atualização + enriquecimento)
    console.log(`${colors.blue}🚀 Iniciando sincronização + enriquecimento de ${leads.length} leads...${colors.reset}`);
    console.log();
    
    for (let i = 0; i < leads.length; i++) {
      const lead = leads[i];
      stats.processed++;
      
      const result = await processLeadComplete(lead.id, segmentId, stats);
      
      const actionText = result.success ? result.action : 'erro';
      updateProgress(stats.processed, leads.length, lead.id, actionText);
      
      // Delay entre leads para respeitar rate limit
      if (i < leads.length - 1) {
        await new Promise(resolve => setTimeout(resolve, CONFIG.PAGINATION.delayBetweenLeads));
      }
    }
    
    console.log();
    console.log();
    console.log(`${colors.cyan}============================================================${colors.reset}`);
    console.log(`${colors.green}✅ SINCRONIZAÇÃO + ENRIQUECIMENTO CONCLUÍDA!${colors.reset}`);
    console.log();
    console.log(`${colors.cyan}📊 Estatísticas:${colors.reset}`);
    console.log(`   - Leads no segmento: ${stats.totalLeadsInSegment}`);
    console.log(`   - Leads processados: ${stats.processed}`);
    console.log(`   - Leads inseridos: ${colors.green}${stats.inserted}${colors.reset}`);
    console.log(`   - Leads atualizados: ${colors.blue}${stats.updated}${colors.reset}`);
    console.log(`   - Erros: ${colors.red}${stats.errors}${colors.reset}`);
    console.log(`   - Tempo total: ${colors.blue}${((Date.now() - startTime) / 1000).toFixed(2)}s${colors.reset}`);
    console.log(`   - Taxa de sucesso: ${colors.green}${((stats.inserted + stats.updated) / stats.processed * 100).toFixed(1)}%${colors.reset}`);
    console.log(`${colors.cyan}============================================================${colors.reset}`);
    
  } catch (error) {
    console.error(`${colors.red}❌ Erro na sincronização: ${error.message}${colors.reset}`);
  }
}

// ==================== EXECUÇÃO ====================

const segmentId = process.argv[2];
if (!segmentId) {
  console.error(`${colors.red}❌ Por favor, forneça o ID do segmento como argumento.${colors.reset}`);
  console.log(`${colors.yellow}💡 Uso: node sync-and-enrich-segment.js [ID_DO_SEGMENTO]${colors.reset}`);
  process.exit(1);
}

// Verificar configurações
if (!CONFIG.SPRINTHUB.apiToken || !CONFIG.SUPABASE.url || !CONFIG.SUPABASE.key) {
  console.error(`${colors.red}❌ Erro: Configurações do SprintHub ou Supabase não encontradas${colors.reset}`);
  console.log(`${colors.yellow}⚠️  Verifique as variáveis de ambiente VITE_SPRINTHUB_API_TOKEN, VITE_SUPABASE_URL e VITE_SUPABASE_SERVICE_ROLE_KEY${colors.reset}`);
  process.exit(1);
}

syncAndEnrichSegment(segmentId);

