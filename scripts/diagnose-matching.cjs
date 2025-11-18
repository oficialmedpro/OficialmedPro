#!/usr/bin/env node

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY,
  { db: { schema: 'api' } }
);

function normalizePhone(phone) {
  if (!phone) return [];
  const cleaned = phone.replace(/\D/g, '');
  const variations = new Set();
  variations.add(cleaned);
  if (cleaned.startsWith('55') && cleaned.length > 11) {
    variations.add(cleaned.substring(2));
  }
  if (cleaned.startsWith('0')) {
    variations.add(cleaned.substring(1));
  }
  if (cleaned.length >= 10) variations.add(cleaned.slice(-10));
  if (cleaned.length >= 11) variations.add(cleaned.slice(-11));
  if (cleaned.length >= 9) variations.add(cleaned.slice(-9));
  return Array.from(variations).filter(v => v && v.length >= 8);
}

async function diagnose() {
  console.log('🔍 Diagnóstico de Matching\n');

  // 1. Pegar 10 leads da oportunidade_sprint com email E whatsapp
  const { data: oppLeads } = await supabase
    .from('oportunidade_sprint')
    .select('lead_id, lead_firstname, lead_email, lead_whatsapp')
    .not('lead_id', 'is', null)
    .not('lead_email', 'is', null)
    .not('lead_whatsapp', 'is', null)
    .limit(10);

  console.log(`Testando ${oppLeads.length} leads da oportunidade_sprint:\n`);

  for (const opp of oppLeads) {
    console.log('─'.repeat(60));
    console.log(`Lead ID: ${opp.lead_id}`);
    console.log(`Nome: ${opp.lead_firstname}`);
    console.log(`Email: ${opp.lead_email}`);
    console.log(`WhatsApp: ${opp.lead_whatsapp}`);

    // Tentar encontrar por email
    const { data: byEmail } = await supabase
      .from('leads_exportados_sprinthub')
      .select('id, nome_completo, email, whatsapp, id_sprinthub')
      .ilike('email', opp.lead_email)
      .limit(1);

    if (byEmail && byEmail.length > 0) {
      console.log(`✅ ENCONTRADO por email!`);
      console.log(`   ${byEmail[0].nome_completo} | id_sprinthub: ${byEmail[0].id_sprinthub}`);
    } else {
      console.log(`❌ NÃO encontrado por email`);

      // Tentar por telefone
      const phoneVars = normalizePhone(opp.lead_whatsapp);
      console.log(`   Variações de telefone testadas: ${phoneVars.join(', ')}`);

      let found = false;
      for (const phoneVar of phoneVars) {
        const { data: byPhone } = await supabase
          .from('leads_exportados_sprinthub')
          .select('id, nome_completo, whatsapp, email, id_sprinthub')
          .or(`whatsapp.ilike.%${phoneVar}%,telefone.ilike.%${phoneVar}%`)
          .limit(1);

        if (byPhone && byPhone.length > 0) {
          console.log(`✅ ENCONTRADO por telefone (${phoneVar})!`);
          console.log(`   ${byPhone[0].nome_completo} | whatsapp: ${byPhone[0].whatsapp} | id_sprinthub: ${byPhone[0].id_sprinthub}`);
          found = true;
          break;
        }
      }

      if (!found) {
        console.log(`❌ NÃO encontrado por telefone também`);
      }
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('🎯 Próximos passos sugeridos:');
  console.log('1. Se NÃO encontrou por email: os emails são diferentes');
  console.log('2. Se NÃO encontrou por telefone: os formatos são incompatíveis');
  console.log('3. Pode ser necessário usar a API do SprintHub para pegar');
  console.log('   os dados completos dos 23k leads');
  console.log('='.repeat(60));
}

diagnose().catch(console.error);
