/**
 * 📋 MOSTRAR JSON COMPLETO: Respostas do Lead e Oportunidade
 * Para análise detalhada dos campos disponíveis
 */

const SPRINTHUB_CONFIG = {
  baseUrl: 'sprinthub-api-master.sprinthub.app',
  apiToken: '9ad36c85-5858-4960-9935-e73c3698dd0c',
  instance: 'oficialmed'
};

async function showJsonResponses() {
  try {
    console.log('📋 MOSTRANDO JSON COMPLETO DAS RESPOSTAS...');
    console.log('='.repeat(80));

    // ==========================================
    // 1. JSON COMPLETO DO LEAD
    // ==========================================
    console.log('\n👤 JSON COMPLETO DO LEAD:');
    console.log('='.repeat(50));
    
    const leadId = 112795;
    const leadUrl = `https://${SPRINTHUB_CONFIG.baseUrl}/leads/${leadId}?i=${SPRINTHUB_CONFIG.instance}&allFields=1&apitoken=${SPRINTHUB_CONFIG.apiToken}`;
    
    console.log(`📡 URL: ${leadUrl}`);
    
    const leadResponse = await fetch(leadUrl, {
      headers: {
        'Accept': 'application/json'
      }
    });

    if (leadResponse.ok) {
      const leadData = await leadResponse.json();
      console.log('✅ Lead encontrado!');
      console.log('\n📄 JSON COMPLETO DO LEAD:');
      console.log(JSON.stringify(leadData, null, 2));
    } else {
      console.log(`❌ Erro no lead: ${leadResponse.status}`);
    }

    // ==========================================
    // 2. JSON COMPLETO DA OPORTUNIDADE
    // ==========================================
    console.log('\n\n🎯 JSON COMPLETO DA OPORTUNIDADE:');
    console.log('='.repeat(50));
    
    const TARGET_FUNNEL = 6;
    const postData = JSON.stringify({ 
      page: 0, 
      limit: 1, 
      columnId: 232
    });
    
    const opportunityUrl = `https://${SPRINTHUB_CONFIG.baseUrl}/crm/opportunities/${TARGET_FUNNEL}?apitoken=${SPRINTHUB_CONFIG.apiToken}&i=${SPRINTHUB_CONFIG.instance}`;
    
    console.log(`📡 URL: ${opportunityUrl}`);
    console.log(`📡 POST Data: ${postData}`);
    
    const opportunityResponse = await fetch(opportunityUrl, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: postData
    });

    if (opportunityResponse.ok) {
      const opportunityData = await opportunityResponse.json();
      console.log('✅ Oportunidade encontrada!');
      console.log('\n📄 JSON COMPLETO DA OPORTUNIDADE:');
      console.log(JSON.stringify(opportunityData, null, 2));
    } else {
      console.log(`❌ Erro na oportunidade: ${opportunityResponse.status}`);
    }

    // ==========================================
    // 3. BUSCAR OUTROS LEADS COM CAMPOS DIFERENTES
    // ==========================================
    console.log('\n\n🔍 BUSCANDO OUTROS LEADS PARA COMPARAR:');
    console.log('='.repeat(50));
    
    const leadsUrl = `https://${SPRINTHUB_CONFIG.baseUrl}/leads?i=${SPRINTHUB_CONFIG.instance}&page=0&limit=3&apitoken=${SPRINTHUB_CONFIG.apiToken}`;
    
    console.log(`📡 URL: ${leadsUrl}`);
    
    const leadsResponse = await fetch(leadsUrl, {
      headers: {
        'Accept': 'application/json'
      }
    });

    if (leadsResponse.ok) {
      const leadsData = await leadsResponse.json();
      console.log('✅ Lista de leads encontrada!');
      console.log('\n📄 JSON COMPLETO DA LISTA DE LEADS:');
      console.log(JSON.stringify(leadsData, null, 2));
    } else {
      console.log(`❌ Erro na lista de leads: ${leadsResponse.status}`);
    }

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

// Executar
showJsonResponses();



