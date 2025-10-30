#!/usr/bin/env node

/**
 * Validação e Sincronização FINAL - Garante ID, WhatsApp, Nome e Email
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
    DELAY: 1100
  }
};

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY,
  { db: { schema: 'api' } }
);

const stats = {
  total: 0,
  withWhatsApp: 0,
  withEmail: 0,
  withBoth: 0,
  success: 0,
  errors: 0,
  invalidIds: 0,
  startTime: Date.now()
};

function log(msg) {
  console.log(msg);
  fs.appendFileSync('sync-final.log', msg + '\n');
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchPage(page) {
  const url = `https://${CONFIG.SPRINTHUB.baseUrl}/leads?i=${CONFIG.SPRINTHUB.instance}&page=${page}&limit=${CONFIG.SPRINTHUB.PAGE_LIMIT}&allFields=1&apitoken=${CONFIG.SPRINTHUB.apiToken}`;

  const response = await fetch(url);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);

  const data = await response.json();
  return data.data?.leads || [];
}

function mapLead(lead) {
  // Validar ID numérico
  if (!lead.id || typeof lead.id === 'string' || isNaN(parseInt(lead.id))) {
    stats.invalidIds++;
    return null;
  }

  const mapped = {
    id: parseInt(lead.id),
    firstname: lead.firstname || null,
    lastname: lead.lastname || null,
    email: lead.email || null,
    whatsapp: lead.whatsapp || null,
    phone: lead.phone || null,
    mobile: lead.mobile || null,
    synced_at: new Date().toISOString()
  };

  // Estatísticas
  if (mapped.whatsapp) stats.withWhatsApp++;
  if (mapped.email) stats.withEmail++;
  if (mapped.whatsapp && mapped.email) stats.withBoth++;

  return mapped;
}

async function main() {
  log('🚀 SINCRONIZAÇÃO FINAL - Garantindo ID, WhatsApp, Nome e Email\n');

  if (fs.existsSync('sync-final.log')) fs.unlinkSync('sync-final.log');

  try {
    let page = 1;
    let hasMore = true;

    while (hasMore) {
      log(`📥 Página ${page}...`);
      
      const leadsData = await fetchPage(page);
      if (!leadsData || leadsData.length === 0) break;

      const mapped = leadsData.map(mapLead).filter(l => l !== null);
      stats.total += mapped.length;

      if (mapped.length > 0) {
        const { error } = await supabase
          .from('leads')
          .upsert(mapped, { onConflict: 'id' });

        if (error) {
          log(`❌ Erro: ${error.message}`);
          stats.errors++;
        } else {
          stats.success += mapped.length;
        }

        const elapsed = ((Date.now() - stats.startTime) / 1000 / 60).toFixed(1);
        const rate = (stats.total / (elapsed || 1)).toFixed(0);

        log(`✅ Pág ${page} | ${stats.total} leads | WhatsApp: ${stats.withWhatsApp} | Email: ${stats.withEmail} | ${rate}/min\n`);
      }

      page++;
      await sleep(CONFIG.SPRINTHUB.DELAY);
    }

    const duration = ((Date.now() - stats.startTime) / 1000 / 60).toFixed(2);

    log('\n' + '='.repeat(60));
    log('✅ SINCRONIZAÇÃO CONCLUÍDA!');
    log('='.repeat(60));
    log(`⏱️  Tempo: ${duration} min`);
    log(`📊 Total: ${stats.total} leads`);
    log(`📱 Com WhatsApp: ${stats.withWhatsApp} (${((stats.withWhatsApp/stats.total)*100).toFixed(1)}%)`);
    log(`📧 Com Email: ${stats.withEmail} (${((stats.withEmail/stats.total)*100).toFixed(1)}%)`);
    log(`✅ Salvos: ${stats.success}`);
    log(`⚠️  IDs inválidos ignorados: ${stats.invalidIds}`);
    log('='.repeat(60));

  } catch (error) {
    log(`❌ Erro fatal: ${error.message}`);
    process.exit(1);
  }
}

main();
