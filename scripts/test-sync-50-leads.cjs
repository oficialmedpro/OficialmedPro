#!/usr/bin/env node

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const CONFIG = {
  SPRINTHUB: {
    baseUrl: process.env.VITE_SPRINTHUB_BASE_URL,
    apiToken: process.env.VITE_SPRINTHUB_API_TOKEN,
    instance: process.env.VITE_SPRINTHUB_INSTANCE,
    DELAY: 1100
  },
  TEST_LIMIT: 50
};

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY,
  { db: { schema: 'api' } }
);

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchLeadFromAPI(leadId) {
  const url = `https://${CONFIG.SPRINTHUB.baseUrl}/leads/${leadId}?i=${CONFIG.SPRINTHUB.instance}&allFields=1&apitoken=${CONFIG.SPRINTHUB.apiToken}`;

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
  return data.data?.lead || null;
}

async function main() {
  console.log('🧪 TESTE: Sincronizando 50 leads da API do SprintHub\n');

  // 1. Buscar 50 lead_ids da oportunidade_sprint
  const { data: oppData } = await supabase
    .from('oportunidade_sprint')
    .select('lead_id')
    .not('lead_id', 'is', null)
    .limit(CONFIG.TEST_LIMIT);

  const uniqueIds = [...new Set(oppData.map(o => o.lead_id))].slice(0, 50);
  console.log(`📋 Testando ${uniqueIds.length} leads\n`);

  let success = 0;
  let errors = 0;
  const results = [];

  for (let i = 0; i < uniqueIds.length; i++) {
    const leadId = uniqueIds[i];

    try {
      const leadData = await fetchLeadFromAPI(leadId);

      if (leadData) {
        const mapped = {
          id: leadData.id,
          firstname: leadData.firstname || null,
          lastname: leadData.lastname || null,
          email: leadData.email || null,
          phone: leadData.phone || null,
          whatsapp: leadData.whatsapp || null,
          mobile: leadData.mobile || null,
          synced_at: new Date().toISOString()
        };

        // Inserir no Supabase
        const { error } = await supabase
          .from('leads')
          .upsert(mapped, { onConflict: 'id' });

        if (error) throw error;

        success++;
        results.push(mapped);

        console.log(`✅ ${i+1}/${uniqueIds.length} | ID: ${leadData.id} | ${leadData.firstname || 'SEM NOME'} | ${leadData.email || 'SEM EMAIL'} | ${leadData.whatsapp || 'SEM WHATSAPP'}`);
      }

      await sleep(CONFIG.SPRINTHUB.DELAY);

    } catch (error) {
      errors++;
      console.log(`❌ ${i+1}/${uniqueIds.length} | Erro lead ${leadId}: ${error.message}`);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('📊 RESULTADO DO TESTE:');
  console.log('='.repeat(60));
  console.log(`✅ Sucesso: ${success}/${uniqueIds.length}`);
  console.log(`❌ Erros: ${errors}`);
  console.log('\n📋 AMOSTRA DOS DADOS (primeiros 10):');

  results.slice(0, 10).forEach((lead, i) => {
    console.log(`\n${i+1}. ID: ${lead.id}`);
    console.log(`   Nome: ${lead.firstname} ${lead.lastname || ''}`);
    console.log(`   Email: ${lead.email || 'N/A'}`);
    console.log(`   WhatsApp: ${lead.whatsapp || 'N/A'}`);
    console.log(`   Phone: ${lead.phone || 'N/A'}`);
  });

  console.log('\n' + '='.repeat(60));

  // Verificar campos preenchidos
  const withName = results.filter(l => l.firstname).length;
  const withEmail = results.filter(l => l.email).length;
  const withWhatsApp = results.filter(l => l.whatsapp).length;
  const withPhone = results.filter(l => l.phone).length;

  console.log('📈 TAXA DE PREENCHIMENTO:');
  console.log(`   Nome: ${withName}/${success} (${((withName/success)*100).toFixed(1)}%)`);
  console.log(`   Email: ${withEmail}/${success} (${((withEmail/success)*100).toFixed(1)}%)`);
  console.log(`   WhatsApp: ${withWhatsApp}/${success} (${((withWhatsApp/success)*100).toFixed(1)}%)`);
  console.log(`   Phone: ${withPhone}/${success} (${((withPhone/success)*100).toFixed(1)}%)`);
  console.log('='.repeat(60));
}

main().catch(console.error);
