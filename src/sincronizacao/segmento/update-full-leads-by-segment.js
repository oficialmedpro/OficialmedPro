#!/usr/bin/env node

/**
 * 🔄 update-full-leads-by-segment.js
 * 
 * Atualiza leads de um segmento com TODOS os campos usando endpoint /leads/{id}?allFields=1
 * 
 * Uso: node update-full-leads-by-segment.js [ID_DO_SEGMENTO]
 * Exemplo: node update-full-leads-by-segment.js 123
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ==================== CONFIGURAÇÃO (baseada nos scripts que funcionam) ====================
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
  DELAY_BETWEEN_LEADS: 500 // 500ms entre cada lead
};

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

const stats = {
  totalLeadsInSegment: 0,
  totalProcessed: 0,
  totalUpdated: 0,
  totalErrors: 0,
  startTime: Date.now()
};

// ==================== FUNÇÕES DE REQUISIÇÃO ====================

async function makeRequest(url, options = {}) {
  try {
    const response = await fetch(url, options);
    let data;
    
    try {
      data = await response.json();
    } catch {
      data = await response.text();
    }

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${JSON.stringify(data)}`);
    }

    return { ok: response.ok, status: response.status, data: data };
  } catch (error) {
    throw new Error(`Request failed: ${error.message}`);
  }
}

// ==================== BUSCAR IDs DO SEGMENTO ====================

async function fetchLeadsIdsFromSegment(segmentId) {
  console.log(`${colors.cyan}🔍 Buscando IDs dos leads do segmento ${segmentId}...${colors.reset}`);
  
  const url = `https://${CONFIG.SPRINTHUB.baseUrl}/leadsfromtype/segment/${segmentId}?i=${CONFIG.SPRINTHUB.instance}&apitoken=${CONFIG.SPRINTHUB.apiToken}`;
  
  const requestBody = {
    page: 0,
    limit: 1000,
    orderByKey: "createDate",
    orderByDirection: "desc",
    showAnon: false,
    search: "",
    query: "{total,leads{id}}",
    showArchived: false,
    additionalFilter: null,
    idOnly: false
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

    if (response.ok && response.data) {
      if (response.data.data && response.data.data.leads) {
        const leadIds = response.data.data.leads.map(lead => lead.id);
        stats.totalLeadsInSegment = response.data.data.total || leadIds.length;
        console.log(`${colors.green}✅ Encontrados ${leadIds.length} leads no segmento${colors.reset}`);
        return leadIds;
      }
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

// ==================== MAPEAMENTO COMPLETO ====================

function mapFullLeadToSupabase(lead, segmentId) {
  const parseDate = (dateStr) => {
    if (!dateStr) return null;
    try {
      const date = new Date(dateStr);
      return isNaN(date.getTime()) ? null : date.toISOString();
    } catch {
      return null;
    }
  };

  const extractIds = (arr) => {
    if (!arr || !Array.isArray(arr)) return null;
    return arr.length > 0 ? arr : null;
  };

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
    numero_entrega: lead.numero_entrega || null,
    rua_entrega: lead.rua_entrega || null,
    company: lead.company || null,
    points: parseInt(lead.points) || 0,
    owner: lead.owner || null,
    stage: lead.stage || null,
    preferred_locale: lead.preferredLocale || null,
    user_access: extractIds(lead.userAccess),
    department_access: extractIds(lead.departmentAccess),
    ignore_sub_departments: lead.ignoreSubDepartments || false,
    create_date: parseDate(lead.createDate),
    updated_date: parseDate(lead.updatedDate),
    last_active: parseDate(lead.lastActive),
    created_by: lead.createdBy || null,
    created_by_name: lead.createdByName || null,
    created_by_type: lead.createdByType || null,
    updated_by: lead.updatedBy || null,
    updated_by_name: lead.updatedByName || null,
    synced_at: new Date().toISOString(),
    archived: lead.archived || false,
    third_party_data: lead.thirdPartyData || null,
    capital_de_investimento: lead.capital_de_investimento || null,
    tipo_de_compra: lead.tipo_de_compra || null,
    pedidos_shopify: lead.pedidos_shopify || null,
    categoria: lead.categoria || null,
    classificacao_google: lead.classificacao_google || null,
    grau_de_interesse: lead.grau_de_interesse || null,
    star_score: lead.star_score || null,
    avaliacao_atendente: lead.avaliacao_atendente || null,
    avaliacao_atendimento: lead.avaliacao_atendimento || null,
    qualificacao_callix: lead.qualificacao_callix || null,
    origem: lead.origem || null,
    origem_manipulacao: lead.origem_manipulacao || null,
    lista_de_origem: lead.lista_de_origem || null,
    criativo: lead.criativo || null,
    plataforma: lead.plataforma || null,
    redes_sociais: lead.redes_sociais || null,
    site: lead.site || null,
    atendente: lead.atendente || null,
    atendente_atual: lead.atendente_atual || null,
    feedback: lead.feedback || null,
    observacao: lead.observacao || null,
    observacoes_do_lead: lead.observacoes_do_lead || null,
    comportamento_da_ia: lead.comportamento_da_ia || null,
    retorno: lead.retorno || null,
    prescritor: lead.prescritor || null,
    produto: lead.produto || null,
    drograria: lead.drograria || null,
    data_recompra: lead.data_recompra ? parseDate(lead.data_recompra)?.split('T')[0] : null,
    mes_que_entrou: lead.mes_que_entrou || null,
    cpf: lead.cpf || null,
    rg: lead.rg || null,
    arquivo_receita: lead.arquivo_receita || null,
    id_t56: lead.id_t56 || null,
    empresa: lead.empresa || null,
    sexo: lead.sexo || null,
    data_de_nascimento: lead.data_de_nascimento ? parseDate(lead.data_de_nascimento)?.split('T')[0] : null,
    objetivos_do_cliente: lead.objetivos_do_cliente || null,
    perfil_do_cliente: lead.perfil_do_cliente || null,
    recebedor: lead.recebedor || null,
    whatsapp_remote_lid: lead.whatsappRemoteLid || null,
    status: lead.status || null,
    sh_status: lead.sh_status || null,
    data_do_contato: lead.data_do_contato ? parseDate(lead.data_do_contato)?.split('T')[0] : null,
    segmento: parseInt(segmentId)
  };
}

// ==================== ATUALIZAR NO SUPABASE (mesma estrutura dos scripts que funcionam) ====================

async function updateLeadInSupabase(leadId, leadData) {
  try {
    const url = `${CONFIG.SUPABASE.url}/rest/v1/leads?id=eq.${leadId}`;
    
    const response = await makeRequest(url, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'apikey': CONFIG.SUPABASE.key,
        'Authorization': `Bearer ${CONFIG.SUPABASE.key}`,
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify(leadData)
    });

    return { success: true };
  } catch (error) {
    return { 
      success: false, 
      error: error.message
    };
  }
}

// ==================== PROGRESS BAR ====================

function showProgress(current, total, extraInfo = '') {
  const percent = Math.round((current / total) * 100);
  const filled = Math.round(percent / 2.5);
  const bar = '█'.repeat(filled) + '░'.repeat(40 - filled);
  process.stdout.write(`\r${colors.cyan}[${bar}] ${percent}% (${current}/${total}) ${extraInfo}${colors.reset}`);
  if (current === total) console.log('');
}

// ==================== PROCESSO PRINCIPAL ====================

async function updateLeadsBySegment(segmentId) {
  console.log(`${colors.cyan}${'='.repeat(60)}${colors.reset}`);
  console.log(`${colors.cyan}📊 ATUALIZAÇÃO COMPLETA - SEGMENTO ${segmentId}${colors.reset}`);
  console.log(`${colors.cyan}${'='.repeat(60)}${colors.reset}\n`);

  // 1. Buscar IDs dos leads
  const leadIds = await fetchLeadsIdsFromSegment(segmentId);
  
  if (leadIds.length === 0) {
    console.log(`${colors.yellow}⚠️  Nenhum lead encontrado no segmento ${segmentId}${colors.reset}`);
    return;
  }

  console.log(`${colors.blue}🚀 Iniciando atualização de ${leadIds.length} leads...${colors.reset}\n`);

  // 2. Processar cada lead
  for (let i = 0; i < leadIds.length; i++) {
    const leadId = leadIds[i];
    
    try {
      const fullLeadData = await fetchFullLeadData(leadId);
      const mappedData = mapFullLeadToSupabase(fullLeadData, segmentId);
      const result = await updateLeadInSupabase(leadId, mappedData);
      
      if (result.success) {
        stats.totalUpdated++;
      } else {
        console.error(`\n${colors.red}❌ Erro ao atualizar lead ${leadId}: ${result.error}${colors.reset}`);
        stats.totalErrors++;
      }
      
      stats.totalProcessed++;
      showProgress(i + 1, leadIds.length, `Lead ID: ${leadId}`);
      
      if (i < leadIds.length - 1) {
        await new Promise(r => setTimeout(r, CONFIG.DELAY_BETWEEN_LEADS));
      }
      
    } catch (error) {
      console.error(`\n${colors.red}❌ Erro ao processar lead ${leadId}: ${error.message}${colors.reset}`);
      stats.totalErrors++;
      stats.totalProcessed++;
      showProgress(i + 1, leadIds.length, `Lead ID: ${leadId} (erro)`);
    }
  }

  // 3. Estatísticas finais
  const elapsedTime = ((Date.now() - stats.startTime) / 1000).toFixed(2);
  
  console.log(`\n${colors.cyan}${'='.repeat(60)}${colors.reset}`);
  console.log(`${colors.green}✅ ATUALIZAÇÃO CONCLUÍDA!${colors.reset}\n`);
  console.log(`${colors.white}📊 Estatísticas:${colors.reset}`);
  console.log(`   - Leads no segmento: ${stats.totalLeadsInSegment}`);
  console.log(`   - Leads processados: ${stats.totalProcessed}`);
  console.log(`   - Leads atualizados: ${colors.green}${stats.totalUpdated}${colors.reset}`);
  console.log(`   - Erros: ${stats.totalErrors > 0 ? colors.red : colors.green}${stats.totalErrors}${colors.reset}`);
  console.log(`   - Tempo total: ${colors.blue}${elapsedTime}s${colors.reset}`);
  console.log(`   - Taxa de sucesso: ${colors.green}${((stats.totalUpdated / stats.totalProcessed) * 100).toFixed(1)}%${colors.reset}`);
  console.log(`${colors.cyan}${'='.repeat(60)}${colors.reset}\n`);
}

// ==================== EXECUÇÃO ====================

const segmentId = process.argv[2];

if (!segmentId) {
  console.error(`${colors.red}❌ Erro: ID do segmento não fornecido${colors.reset}`);
  console.log(`${colors.yellow}Uso: node update-full-leads-by-segment.js [ID_DO_SEGMENTO]${colors.reset}`);
  console.log(`${colors.yellow}Exemplo: node update-full-leads-by-segment.js 123${colors.reset}`);
  process.exit(1);
}

if (!CONFIG.SUPABASE.url || !CONFIG.SUPABASE.key) {
  console.error(`${colors.red}❌ Erro: Configurações do Supabase não encontradas${colors.reset}`);
  console.log(`${colors.yellow}Verifique as variáveis: VITE_SUPABASE_URL e VITE_SUPABASE_SERVICE_ROLE_KEY${colors.reset}`);
  process.exit(1);
}

updateLeadsBySegment(segmentId).catch(error => {
  console.error(`${colors.red}❌ Erro fatal: ${error.message}${colors.reset}`);
  process.exit(1);
});
