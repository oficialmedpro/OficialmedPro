#!/usr/bin/env node

/**
 * 🚀 sync-leads-by-id.cjs | Sincroniza leads específicos via API do SprintHub
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const CONFIG = {
  SPRINTHUB: {
    baseUrl: process.env.VITE_SPRINTHUB_BASE_URL,
    apiToken: process.env.VITE_SPRINTHUB_API_TOKEN,
    instance: process.env.VITE_SPRINTHUB_INSTANCE,
    DELAY_BETWEEN_REQUESTS: 1100,
    MAX_RETRIES: 3
  },
  CHECKPOINT_FILE: path.join(__dirname, 'checkpoint-sync-by-id.json'),
  LOG_FILE: path.join(__dirname, 'sync-by-id.log')
};

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY,
  { db: { schema: 'api' } }
);

const stats = {
  total: 0,
  processed: 0,
  success: 0,
  errors: 0,
  skipped: 0,
  startTime: null
};

function log(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}`;
  console.log(logMessage);
  fs.appendFileSync(CONFIG.LOG_FILE, logMessage + '\n');
}

function saveCheckpoint(leadIds, currentIndex) {
  fs.writeFileSync(CONFIG.CHECKPOINT_FILE, JSON.stringify({
    leadIds,
    currentIndex,
    stats,
    lastUpdate: new Date().toISOString()
  }, null, 2));
}

function loadCheckpoint() {
  if (fs.existsSync(CONFIG.CHECKPOINT_FILE)) {
    return JSON.parse(fs.readFileSync(CONFIG.CHECKPOINT_FILE, 'utf-8'));
  }
  return null;
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchLeadFromAPI(leadId, retries = CONFIG.SPRINTHUB.MAX_RETRIES) {
  for (let i = 0; i < retries; i++) {
    try {
      const url = `https://${CONFIG.SPRINTHUB.baseUrl}/leads/${leadId}?i=${CONFIG.SPRINTHUB.instance}&allFields=1&apitoken=${CONFIG.SPRINTHUB.apiToken}`;

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${CONFIG.SPRINTHUB.apiToken}`,
          'apitoken': CONFIG.SPRINTHUB.apiToken
        }
      });

      if (response.status === 401) {
        const errorData = await response.json();
        if (errorData.msg && errorData.msg.includes('too many requests')) {
          log(`⚠️ Rate limit atingido. Aguardando 60 segundos...`);
          await sleep(60000);
          continue;
        }
      }

      if (response.status === 404 || response.status === 400) {
        return null;
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      return data.data?.lead || null;

    } catch (error) {
      if (i === retries - 1) throw error;
      await sleep(2000 * (i + 1));
    }
  }
}

function mapLeadFields(lead) {
  const parseDate = (dateStr) => {
    if (!dateStr) return null;
    try { return new Date(dateStr).toISOString(); } catch { return null; }
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
    synced_at: new Date().toISOString()
  };
}

async function upsertLead(leadData) {
  const { error } = await supabase
    .from('leads')
    .upsert(leadData, { onConflict: 'id' });

  if (error) throw error;
}

async function getAllUniqueLeadIds() {
  log('📥 Buscando lead_ids únicos...');

  let allLeadIds = new Set();
  let offset = 0;
  const limit = 1000;

  while (true) {
    const { data } = await supabase
      .from('oportunidade_sprint')
      .select('lead_id')
      .not('lead_id', 'is', null)
      .range(offset, offset + limit - 1);

    if (!data || data.length === 0) break;
    data.forEach(row => allLeadIds.add(row.lead_id));
    offset += limit;
  }

  const uniqueIds = Array.from(allLeadIds).sort((a, b) => a - b);
  log(`✅ Total: ${uniqueIds.length}`);
  return uniqueIds;
}

async function main() {
  log('🚀 Iniciando sincronização\n');
  stats.startTime = Date.now();

  if (fs.existsSync(CONFIG.LOG_FILE)) fs.unlinkSync(CONFIG.LOG_FILE);

  try {
    let leadIds, currentIndex = 0;
    const checkpoint = loadCheckpoint();

    if (checkpoint) {
      log('📌 Continuando do checkpoint...');
      leadIds = checkpoint.leadIds;
      currentIndex = checkpoint.currentIndex;
      Object.assign(stats, checkpoint.stats);
    } else {
      leadIds = await getAllUniqueLeadIds();
      stats.total = leadIds.length;
      saveCheckpoint(leadIds, 0);
    }

    log(`\n🔄 Processando ${leadIds.length} leads...\n`);

    for (let i = currentIndex; i < leadIds.length; i++) {
      const leadId = leadIds[i];
      stats.processed++;

      try {
        const leadData = await fetchLeadFromAPI(leadId);

        if (leadData) {
          const mapped = mapLeadFields(leadData);
          await upsertLead(mapped);
          stats.success++;

          if (stats.processed % 10 === 0) {
            const progress = ((i / leadIds.length) * 100).toFixed(1);
            const elapsed = ((Date.now() - stats.startTime) / 1000 / 60).toFixed(1);
            log(`⏳ ${progress}% | ${stats.processed}/${leadIds.length} | ✅ ${stats.success} | ❌ ${stats.errors} | ⏱️ ${elapsed}min`);
          }
        } else {
          stats.skipped++;
        }

        if (stats.processed % 100 === 0) {
          saveCheckpoint(leadIds, i + 1);
        }

        await sleep(CONFIG.SPRINTHUB.DELAY_BETWEEN_REQUESTS);

      } catch (error) {
        stats.errors++;
        log(`❌ Erro lead ${leadId}: ${error.message}`);
      }
    }

    const duration = ((Date.now() - stats.startTime) / 1000 / 60).toFixed(2);
    log('\n✅ CONCLUÍDO!');
    log(`⏱️ ${duration}min | ✅ ${stats.success} | ❌ ${stats.errors}`);

    if (fs.existsSync(CONFIG.CHECKPOINT_FILE)) {
      fs.unlinkSync(CONFIG.CHECKPOINT_FILE);
    }

  } catch (error) {
    log(`❌ Erro fatal: ${error.message}`);
    process.exit(1);
  }
}

main();
