const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL, 
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY, 
  { db: { schema: 'api' } }
);

async function analyzeLeadsData() {
  try {
    console.log('🔍 Analisando dados dos leads...\n');
    
    // 1. Total de leads
    const { count: totalCount, error: countError } = await supabase
      .from('leads')
      .select('*', { count: 'exact' });
    
    if (countError) {
      console.error('❌ Erro ao contar leads:', countError.message);
      return;
    }
    
    console.log(`📊 Total de leads: ${totalCount}\n`);
    
    // 2. Leads com firstname preenchido
    const { count: firstnameCount, error: firstnameError } = await supabase
      .from('leads')
      .select('*', { count: 'exact' })
      .not('firstname', 'is', null)
      .neq('firstname', '');
    
    if (firstnameError) {
      console.error('❌ Erro ao contar firstname:', firstnameError.message);
    } else {
      console.log(`👤 Leads com firstname: ${firstnameCount} (${((firstnameCount/totalCount)*100).toFixed(1)}%)`);
    }
    
    // 3. Leads com lastname preenchido
    const { count: lastnameCount, error: lastnameError } = await supabase
      .from('leads')
      .select('*', { count: 'exact' })
      .not('lastname', 'is', null)
      .neq('lastname', '');
    
    if (lastnameError) {
      console.error('❌ Erro ao contar lastname:', lastnameError.message);
    } else {
      console.log(`👤 Leads com lastname: ${lastnameCount} (${((lastnameCount/totalCount)*100).toFixed(1)}%)`);
    }
    
    // 4. Leads com whatsapp preenchido
    const { count: whatsappCount, error: whatsappError } = await supabase
      .from('leads')
      .select('*', { count: 'exact' })
      .not('whatsapp', 'is', null)
      .neq('whatsapp', '');
    
    if (whatsappError) {
      console.error('❌ Erro ao contar whatsapp:', whatsappError.message);
    } else {
      console.log(`📱 Leads com whatsapp: ${whatsappCount} (${((whatsappCount/totalCount)*100).toFixed(1)}%)`);
    }
    
    // 5. Leads com phone preenchido
    const { count: phoneCount, error: phoneError } = await supabase
      .from('leads')
      .select('*', { count: 'exact' })
      .not('phone', 'is', null)
      .neq('phone', '');
    
    if (phoneError) {
      console.error('❌ Erro ao contar phone:', phoneError.message);
    } else {
      console.log(`📞 Leads com phone: ${phoneCount} (${((phoneCount/totalCount)*100).toFixed(1)}%)`);
    }
    
    // 6. Leads com email preenchido
    const { count: emailCount, error: emailError } = await supabase
      .from('leads')
      .select('*', { count: 'exact' })
      .not('email', 'is', null)
      .neq('email', '');
    
    if (emailError) {
      console.error('❌ Erro ao contar email:', emailError.message);
    } else {
      console.log(`📧 Leads com email: ${emailCount} (${((emailCount/totalCount)*100).toFixed(1)}%)`);
    }
    
    // 7. Amostra de leads para análise
    console.log('\n🔍 Amostra de 10 leads para análise:');
    const { data: sampleLeads, error: sampleError } = await supabase
      .from('leads')
      .select('id, firstname, lastname, email, phone, whatsapp, mobile, status, origem, create_date')
      .order('id', { ascending: false })
      .limit(10);
    
    if (sampleError) {
      console.error('❌ Erro ao buscar amostra:', sampleError.message);
    } else {
      sampleLeads.forEach((lead, index) => {
        console.log(`\n${index + 1}. ID: ${lead.id}`);
        console.log(`   Nome: "${lead.firstname}" "${lead.lastname}"`);
        console.log(`   Email: "${lead.email}"`);
        console.log(`   Phone: "${lead.phone}"`);
        console.log(`   WhatsApp: "${lead.whatsapp}"`);
        console.log(`   Mobile: "${lead.mobile}"`);
        console.log(`   Status: "${lead.status}"`);
        console.log(`   Origem: "${lead.origem}"`);
        console.log(`   Data: ${lead.create_date}`);
      });
    }
    
    // 8. Verificar campos mais preenchidos
    console.log('\n📈 Análise de campos preenchidos:');
    const fields = ['firstname', 'lastname', 'email', 'phone', 'whatsapp', 'mobile', 'company', 'city', 'state'];
    
    for (const field of fields) {
      const { count, error } = await supabase
        .from('leads')
        .select('*', { count: 'exact' })
        .not(field, 'is', null)
        .neq(field, '');
      
      if (!error) {
        const percentage = ((count/totalCount)*100).toFixed(1);
        console.log(`   ${field}: ${count} (${percentage}%)`);
      }
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

analyzeLeadsData();

