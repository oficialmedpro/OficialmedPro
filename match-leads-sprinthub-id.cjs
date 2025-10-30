#!/usr/bin/env node

/**
 * 🔗 match-leads-sprinthub-id.cjs | Relaciona tabelas de leads usando múltiplas fontes
 *
 * FONTES DE DADOS:
 * 1. leads_exportados_sprinthub (73k) - Dados COMPLETOS mas SEM id_sprinthub
 * 2. leads (76k) - Tem id (SprintHub) mas dados VAZIOS
 * 3. oportunidade_sprint (41k) - Tem lead_id + email/whatsapp
 *
 * ESTRATÉGIA DE MATCHING:
 * 1. Email exato (case-insensitive)
 * 2. WhatsApp normalizado (remove DDI +55, espaços, caracteres especiais)
 * 3. Telefone normalizado
 *
 * RESULTADO:
 * - Atualiza campo id_sprinthub na tabela leads_exportados_sprinthub
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const CONFIG = {
  SUPABASE: {
    url: process.env.VITE_SUPABASE_URL,
    key: process.env.VITE_SUPABASE_SERVICE_ROLE_KEY
  },
  BATCH_SIZE: 500, // Processa 500 registros por vez
  STATS: {
    totalProcessed: 0,
    matchedByEmail: 0,
    matchedByWhatsApp: 0,
    matchedByPhone: 0,
    notMatched: 0,
    updated: 0,
    errors: 0
  }
};

// Inicializar Supabase
const supabase = createClient(CONFIG.SUPABASE.url, CONFIG.SUPABASE.key, {
  db: { schema: 'api' }
});

// Função para normalizar telefone/whatsapp
// Retorna array com múltiplas variações para maximizar matching
function normalizePhone(phone) {
  if (!phone) return [];

  // Remove todos os caracteres não numéricos
  let cleaned = phone.replace(/\D/g, '');

  const variations = new Set();

  // Variação 1: Número limpo original
  variations.add(cleaned);

  // Variação 2: Remove DDI 55 se presente
  if (cleaned.startsWith('55') && cleaned.length > 11) {
    variations.add(cleaned.substring(2));
  }

  // Variação 3: Remove zero inicial do DDD (011 -> 11)
  if (cleaned.startsWith('0')) {
    variations.add(cleaned.substring(1));
  }

  // Variação 4: Últimos 10 dígitos (número sem DDD)
  if (cleaned.length >= 10) {
    variations.add(cleaned.slice(-10));
  }

  // Variação 5: Últimos 11 dígitos (DDD + número no formato BR)
  if (cleaned.length >= 11) {
    variations.add(cleaned.slice(-11));
  }

  // Variação 6: Últimos 9 dígitos (número celular sem 9 extra)
  if (cleaned.length >= 9) {
    variations.add(cleaned.slice(-9));
  }

  // Remove variações vazias ou muito curtas
  return Array.from(variations).filter(v => v && v.length >= 8);
}

// Função para normalizar email
function normalizeEmail(email) {
  if (!email) return null;
  return email.toLowerCase().trim();
}

// Função para criar índice de lookup das oportunidades
async function buildOpportunityLookup() {
  console.log('📊 Construindo índice de lookup de oportunidades...');

  const { data: opportunities, error } = await supabase
    .from('oportunidade_sprint')
    .select('lead_id, lead_email, lead_whatsapp, lead_firstname')
    .not('lead_id', 'is', null);

  if (error) {
    console.error('❌ Erro ao buscar oportunidades:', error);
    return { byEmail: new Map(), byWhatsApp: new Map(), byPhone: new Map() };
  }

  const byEmail = new Map();
  const byWhatsApp = new Map();
  const byPhone = new Map();

  for (const opp of opportunities) {
    // Índice por email
    if (opp.lead_email) {
      const email = normalizeEmail(opp.lead_email);
      if (!byEmail.has(email)) {
        byEmail.set(email, opp.lead_id);
      }
    }

    // Índice por whatsapp (telefone) - múltiplas variações
    if (opp.lead_whatsapp) {
      const variations = normalizePhone(opp.lead_whatsapp);
      for (const variation of variations) {
        if (!byWhatsApp.has(variation)) {
          byWhatsApp.set(variation, opp.lead_id);
        }
      }
    }
  }

  console.log(`✅ Índice construído:`);
  console.log(`   - ${byEmail.size} emails únicos`);
  console.log(`   - ${byWhatsApp.size} whatsapps únicos`);

  return { byEmail, byWhatsApp, byPhone };
}

// Função para criar índice da tabela leads
async function buildLeadsLookup() {
  console.log('📊 Construindo índice de lookup da tabela leads...');

  const { data: leads, error } = await supabase
    .from('leads')
    .select('id, email, phone, whatsapp');

  if (error) {
    console.error('❌ Erro ao buscar leads:', error);
    return { byEmail: new Map(), byWhatsApp: new Map(), byPhone: new Map() };
  }

  const byEmail = new Map();
  const byWhatsApp = new Map();
  const byPhone = new Map();

  for (const lead of leads) {
    // Índice por email
    if (lead.email) {
      const email = normalizeEmail(lead.email);
      if (!byEmail.has(email)) {
        byEmail.set(email, lead.id);
      }
    }

    // Índice por whatsapp - múltiplas variações
    if (lead.whatsapp) {
      const variations = normalizePhone(lead.whatsapp);
      for (const variation of variations) {
        if (!byWhatsApp.has(variation)) {
          byWhatsApp.set(variation, lead.id);
        }
      }
    }

    // Índice por phone - múltiplas variações
    if (lead.phone) {
      const variations = normalizePhone(lead.phone);
      for (const variation of variations) {
        if (!byPhone.has(variation)) {
          byPhone.set(variation, lead.id);
        }
      }
    }
  }

  console.log(`✅ Índice da tabela leads construído:`);
  console.log(`   - ${byEmail.size} emails únicos`);
  console.log(`   - ${byWhatsApp.size} whatsapps únicos`);
  console.log(`   - ${byPhone.size} phones únicos`);

  return { byEmail, byWhatsApp, byPhone };
}

// Função para processar um lote de leads exportados
async function processBatch(leadsExportados, oppLookup, leadsLookup) {
  const updates = [];

  for (const lead of leadsExportados) {
    CONFIG.STATS.totalProcessed++;

    let matchedId = null;
    let matchMethod = null;

    // Estratégia 1: Match por email nas oportunidades
    if (!matchedId && lead.email) {
      const email = normalizeEmail(lead.email);
      if (oppLookup.byEmail.has(email)) {
        matchedId = oppLookup.byEmail.get(email);
        matchMethod = 'email_opp';
        CONFIG.STATS.matchedByEmail++;
      }
    }

    // Estratégia 2: Match por email na tabela leads
    if (!matchedId && lead.email) {
      const email = normalizeEmail(lead.email);
      if (leadsLookup.byEmail.has(email)) {
        matchedId = leadsLookup.byEmail.get(email);
        matchMethod = 'email_leads';
        CONFIG.STATS.matchedByEmail++;
      }
    }

    // Estratégia 3: Match por whatsapp nas oportunidades (testa todas variações)
    if (!matchedId && lead.whatsapp) {
      const variations = normalizePhone(lead.whatsapp);
      for (const variation of variations) {
        if (oppLookup.byWhatsApp.has(variation)) {
          matchedId = oppLookup.byWhatsApp.get(variation);
          matchMethod = 'whatsapp_opp';
          CONFIG.STATS.matchedByWhatsApp++;
          break;
        }
      }
    }

    // Estratégia 4: Match por whatsapp na tabela leads (testa todas variações)
    if (!matchedId && lead.whatsapp) {
      const variations = normalizePhone(lead.whatsapp);
      for (const variation of variations) {
        if (leadsLookup.byWhatsApp.has(variation)) {
          matchedId = leadsLookup.byWhatsApp.get(variation);
          matchMethod = 'whatsapp_leads';
          CONFIG.STATS.matchedByWhatsApp++;
          break;
        }
      }
    }

    // Estratégia 5: Match por telefone nas oportunidades (testa todas variações)
    if (!matchedId && lead.telefone) {
      const variations = normalizePhone(lead.telefone);
      for (const variation of variations) {
        if (oppLookup.byWhatsApp.has(variation)) {
          matchedId = oppLookup.byWhatsApp.get(variation);
          matchMethod = 'phone_opp';
          CONFIG.STATS.matchedByPhone++;
          break;
        }
      }
    }

    // Estratégia 6: Match por telefone na tabela leads (testa todas variações)
    if (!matchedId && lead.telefone) {
      const variations = normalizePhone(lead.telefone);
      for (const variation of variations) {
        if (leadsLookup.byPhone.has(variation)) {
          matchedId = leadsLookup.byPhone.get(variation);
          matchMethod = 'phone_leads';
          CONFIG.STATS.matchedByPhone++;
          break;
        }
      }
    }

    if (matchedId) {
      updates.push({
        id: lead.id,
        id_sprinthub: matchedId,
        matchMethod
      });
    } else {
      CONFIG.STATS.notMatched++;
    }

    // Log de progresso
    if (CONFIG.STATS.totalProcessed % 1000 === 0) {
      console.log(`⏳ Processados: ${CONFIG.STATS.totalProcessed} | Matched: ${updates.length} | Não matched: ${CONFIG.STATS.notMatched}`);
    }
  }

  return updates;
}

// Função para aplicar updates no Supabase
async function applyUpdates(updates) {
  console.log(`\n💾 Aplicando ${updates.length} atualizações...`);

  for (let i = 0; i < updates.length; i += 100) {
    const batch = updates.slice(i, i + 100);

    for (const update of batch) {
      const { error } = await supabase
        .from('leads_exportados_sprinthub')
        .update({ id_sprinthub: update.id_sprinthub })
        .eq('id', update.id);

      if (error) {
        console.error(`❌ Erro ao atualizar ${update.id}:`, error);
        CONFIG.STATS.errors++;
      } else {
        CONFIG.STATS.updated++;
      }
    }

    console.log(`   Atualizados: ${Math.min(i + 100, updates.length)}/${updates.length}`);
  }
}

// Função principal
async function main() {
  console.log('🚀 Iniciando matching de leads...\n');

  const startTime = Date.now();

  try {
    // 1. Construir índices de lookup
    const oppLookup = await buildOpportunityLookup();
    const leadsLookup = await buildLeadsLookup();

    console.log('\n📥 Buscando leads exportados...');

    // 2. Buscar todos os leads exportados que não têm id_sprinthub
    let offset = 0;
    let hasMore = true;
    const allUpdates = [];

    while (hasMore) {
      const { data: leadsExportados, error } = await supabase
        .from('leads_exportados_sprinthub')
        .select('id, email, whatsapp, telefone')
        .is('id_sprinthub', null)
        .range(offset, offset + CONFIG.BATCH_SIZE - 1);

      if (error) {
        console.error('❌ Erro ao buscar leads exportados:', error);
        break;
      }

      if (!leadsExportados || leadsExportados.length === 0) {
        hasMore = false;
        break;
      }

      // 3. Processar batch
      const updates = await processBatch(leadsExportados, oppLookup, leadsLookup);
      allUpdates.push(...updates);

      offset += CONFIG.BATCH_SIZE;
    }

    // 4. Aplicar updates
    if (allUpdates.length > 0) {
      await applyUpdates(allUpdates);
    }

    // 5. Estatísticas finais
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log('\n' + '='.repeat(60));
    console.log('✅ MATCHING CONCLUÍDO!');
    console.log('='.repeat(60));
    console.log(`⏱️  Tempo total: ${duration}s`);
    console.log(`📊 Total processado: ${CONFIG.STATS.totalProcessed}`);
    console.log(`✅ Matched por email: ${CONFIG.STATS.matchedByEmail}`);
    console.log(`✅ Matched por WhatsApp: ${CONFIG.STATS.matchedByWhatsApp}`);
    console.log(`✅ Matched por telefone: ${CONFIG.STATS.matchedByPhone}`);
    console.log(`❌ Não matched: ${CONFIG.STATS.notMatched}`);
    console.log(`💾 Atualizados com sucesso: ${CONFIG.STATS.updated}`);
    console.log(`❌ Erros: ${CONFIG.STATS.errors}`);
    console.log('='.repeat(60));

    // Taxa de matching
    const matchRate = ((CONFIG.STATS.updated / CONFIG.STATS.totalProcessed) * 100).toFixed(2);
    console.log(`\n📈 Taxa de matching: ${matchRate}%`);

  } catch (error) {
    console.error('❌ Erro fatal:', error);
    process.exit(1);
  }
}

// Executar
main();
