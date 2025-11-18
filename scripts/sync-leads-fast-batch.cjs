#!/usr/bin/env node

/**
 * 🚀 sync-leads-fast-batch.cjs | Sincronização RÁPIDA em lotes
 * 
 * Busca 200 leads por página da API do SprintHub
 * Tempo estimado: ~2 horas para 23k leads
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const CONFIG = {
  SPRINTHUB: {
    baseUrl: process.env.VITE_SPRINTHUB_BASE_URL,
    apiToken: process.env.VITE_SPRINTHUB_API_TOKEN,
    instance: process.env.VITE_SPRINTHUB_INSTANCE,
    PAGE_LIMIT: 200,
    DELAY_BETWEEN_PAGES: 1100
  },
  CHECKPOINT_FILE: 'checkpoint-batch-sync.json'
};

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY,
  { db: { schema: 'api' } }
);

const stats = {
  totalPages: 0,
  processedPages: 0,
  totalLeads: 0,
  success: 0,
  errors: 0,
  startTime: null
};

function log(msg) {
  const ts = new Date().toISOString();
  console.log(`[${ts}] ${msg}`);
  fs.appendFileSync('sync-batch.log', `[${ts}] ${msg}\n`);
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchLeadsPage(page) {
  const url = `https://${CONFIG.SPRINTHUB.baseUrl}/leads?i=${CONFIG.SPRINTHUB.instance}&page=${page}&limit=${CONFIG.SPRINTHUB.PAGE_LIMIT}&allFields=1&apitoken=${CONFIG.SPRINTHUB.apiToken}`;

  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${CONFIG.SPRINTHUB.apiToken}`,
      'apitoken': CONFIG.SPRINTHUB.apiToken
    }
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const data = await response.json();
  return data.data?.leads || [];
}

function mapLead(lead) {
  const parseDate = (d) => {
    if (!d) return null;
    try { return new Date(d).toISOString(); } catch { return null; }
  };

  // Validar ID numérico (ignorar IDs alfanuméricos)
  if (!lead.id || typeof lead.id === 'string' || isNaN(lead.id)) {
    return null;
  }

  return {
    id: parseInt(lead.id),
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
    points: lead.points || 0,
    owner: lead.owner || null,
    stage: lead.stage || null,
    preferred_locale: lead.preferredLocale || null,
    user_access: Array.isArray(lead.userAccess) ? JSON.stringify(lead.userAccess) : '[]',
    department_access: Array.isArray(lead.departmentAccess) ? JSON.stringify(lead.departmentAccess) : '[]',
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
    third_party_data: typeof lead.thirdPartyData === 'object' ? JSON.stringify(lead.thirdPartyData) : '{}',
    cpf: lead.cpf || null,
    rg: lead.rg || null,
    sexo: lead.sexo || null,
    origem: lead.origem || null,
    status: lead.status || null,
    grau_de_interesse: lead.grau_de_interesse || null
  };
}

async function upsertLeads(leads) {
  const { error } = await supabase
    .from('leads')
    .upsert(leads, { onConflict: 'id' });

  if (error) throw error;
}

async function main() {
  log('🚀 Sincronização em LOTES iniciada\n');
  stats.startTime = Date.now();

  if (fs.existsSync('sync-batch.log')) fs.unlinkSync('sync-batch.log');

  try {
    let page = 1;
    let hasMore = true;

    while (hasMore) {
      stats.processedPages++;

      log(`📥 Buscando página ${page}...`);
      const leadsData = await fetchLeadsPage(page);

      if (!leadsData || leadsData.length === 0) {
        hasMore = false;
        break;
      }

      const mapped = leadsData.map(mapLead).filter(l => l !== null);
      stats.totalLeads += mapped.length;

      if (mapped.length === 0) {
        log(`⚠️ Nenhum lead válido na página ${page}, pulando...`);
        page++;
        await sleep(CONFIG.SPRINTHUB.DELAY_BETWEEN_PAGES);
        continue;
      }

      log(`💾 Salvando ${mapped.length} leads...`);
      await upsertLeads(mapped);
      stats.success += mapped.length;

      const elapsed = ((Date.now() - stats.startTime) / 1000 / 60).toFixed(1);
      const rate = (stats.totalLeads / (elapsed || 1)).toFixed(1);

      log(`✅ Página ${page} | Total: ${stats.totalLeads} leads | ⏱️ ${elapsed}min | 📈 ${rate} leads/min\n`);

      // Continua até retornar 0 leads (não para quando < PAGE_LIMIT)
      page++;
      await sleep(CONFIG.SPRINTHUB.DELAY_BETWEEN_PAGES);
    }

    const duration = ((Date.now() - stats.startTime) / 1000 / 60).toFixed(2);

    log('\n' + '='.repeat(60));
    log('✅ SINCRONIZAÇÃO CONCLUÍDA!');
    log('='.repeat(60));
    log(`⏱️  Tempo total: ${duration} minutos`);
    log(`📊 Total de leads: ${stats.totalLeads}`);
    log(`✅ Sucesso: ${stats.success}`);
    log(`❌ Erros: ${stats.errors}`);
    log('='.repeat(60));

  } catch (error) {
    log(`❌ Erro fatal: ${error.message}`);
    console.error(error.stack);
    process.exit(1);
  }
}

main();
