import axios from 'axios';
import https from 'https';

// Configuração da API
const API_BASE_URL = 'https://api.cnx.app';
const API_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MzYsIm5hbWUiOiJSZW5hdG8iLCJlbWFpbCI6InJlbmF0b0BvZmljaWFsbWVkLmNvbS5iciIsInBob25lIjoiKzU1MTE5NTQxMzY1NjciLCJ0aW1lem9uZSI6IkFtZXJpY2EvU2FvX1BhdWxvIiwiaWF0IjoxNzI5Mjg1ODQwfQ.sllLJHQHM8oa-P8x-QQm3YBpVFIUVqRDIvUpJL9VhH8';

// Agent HTTPS que ignora certificados SSL problemáticos
const httpsAgent = new https.Agent({
  rejectUnauthorized: false,
  secureProtocol: 'TLSv1_2_method'
});

const investigateLeads = async () => {
  console.log('🔍 INVESTIGANDO LEADS COM ERRO');
  console.log('=====================================');

  // Primeiro, vamos testar se conseguimos acessar a API de listagem
  try {
    console.log('\n🧪 Testando conectividade com API...');
    const testResponse = await axios.get(`${API_BASE_URL}/leads?page=1&per_page=1`, {
      headers: {
        'Authorization': `Bearer ${API_TOKEN}`,
        'Content-Type': 'application/json'
      },
      httpsAgent: httpsAgent,
      timeout: 10000
    });

    console.log('✅ API está acessível');
    console.log(`📊 Total de leads: ${testResponse.data.total || 'N/A'}`);

    if (testResponse.data.data && testResponse.data.data.length > 0) {
      const firstLead = testResponse.data.data[0];
      console.log(`📋 Primeiro lead da página 1: ID ${firstLead.id}`);
    }
  } catch (error) {
    console.log('❌ Erro na conectividade com API:', error.message);
    return;
  }

  // Agora vamos buscar uma página específica onde sabemos que tem erros
  console.log('\n🎯 Buscando página onde há erros (página 60-70)...');

  for (let page = 60; page <= 62; page++) {
    try {
      console.log(`\n📄 Testando página ${page}...`);
      const response = await axios.get(`${API_BASE_URL}/leads?page=${page}&per_page=50`, {
        headers: {
          'Authorization': `Bearer ${API_TOKEN}`,
          'Content-Type': 'application/json'
        },
        httpsAgent: httpsAgent,
        timeout: 10000
      });

      console.log(`✅ Página ${page} acessível - ${response.data.data?.length || 0} leads`);

      if (response.data.data && response.data.data.length > 0) {
        // Pegar alguns leads desta página para análise
        const leadsToAnalyze = response.data.data.slice(0, 3);

        for (const lead of leadsToAnalyze) {
          console.log(`\n📋 Lead ID ${lead.id}:`);
          console.log(`   Nome: "${lead.name || 'N/A'}"`);
          console.log(`   Email: "${lead.email || 'N/A'}"`);
          console.log(`   Telefone: "${lead.phone || 'N/A'}"`);
          console.log(`   Status: "${lead.status || 'N/A'}"`);
          console.log(`   Criado em: "${lead.created_at || 'N/A'}"`);
          console.log(`   Funil ID: "${lead.funnel_id || 'N/A'}"`);
          console.log(`   Vendedor ID: "${lead.seller_id || 'N/A'}"`);

          // Verificar problemas potenciais
          const problems = [];
          if (!lead.name || lead.name.trim() === '' || lead.name === 'null') {
            problems.push('Nome vazio/null');
          }
          if (!lead.email || !lead.email.includes('@') || lead.email === 'null') {
            problems.push('Email inválido');
          }
          if (!lead.created_at || lead.created_at === 'null' || lead.created_at === '') {
            problems.push('Data criação inválida');
          }
          if (lead.phone && (lead.phone.includes('undefined') || lead.phone === 'null')) {
            problems.push('Telefone problemático');
          }

          if (problems.length > 0) {
            console.log(`   ⚠️ Problemas: ${problems.join(', ')}`);
          } else {
            console.log(`   ✅ Lead aparenta estar ok`);
          }
        }
      }
    } catch (error) {
      console.log(`❌ Erro na página ${page}:`, error.message);
    }

    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  // Lista de IDs que falharam (vamos tentar buscar via listagem)
  const failedLeads = [6274, 7232, 7233, 7500, 8000];

  for (const leadId of failedLeads) {
    try {
      console.log(`\n📋 Investigando Lead ID: ${leadId}`);
      console.log('-------------------');

      // Em vez de buscar o lead diretamente, vamos tentar encontrá-lo via listagem
      // Calcular página aproximada (assumindo 50 leads por página)
      const approximatePage = Math.ceil(leadId / 50);

      console.log(`🔍 Tentando encontrar lead ${leadId} na página ${approximatePage}...`);

      const response = await axios.get(`${API_BASE_URL}/leads?page=${approximatePage}&per_page=50`, {
        headers: {
          'Authorization': `Bearer ${API_TOKEN}`,
          'Content-Type': 'application/json'
        },
        httpsAgent: httpsAgent,
        timeout: 10000
      });

      // Procurar o lead específico na página
      const foundLead = response.data.data?.find(l => l.id === leadId);

      if (foundLead) {
        console.log(`✅ Lead ${leadId} encontrado na página ${approximatePage}`);
        console.log(`   Nome: "${foundLead.name || 'N/A'}"`);
        console.log(`   Email: "${foundLead.email || 'N/A'}"`);
        console.log(`   Telefone: "${foundLead.phone || 'N/A'}"`);
        console.log(`   Status: "${foundLead.status || 'N/A'}"`);
        console.log(`   Criado em: "${foundLead.created_at || 'N/A'}"`);

        // Verificar problemas
        const problems = [];
        if (!foundLead.name || foundLead.name.trim() === '' || foundLead.name === 'null') {
          problems.push('Nome vazio/null');
        }
        if (!foundLead.email || !foundLead.email.includes('@') || foundLead.email === 'null') {
          problems.push('Email inválido');
        }
        if (!foundLead.created_at || foundLead.created_at === 'null') {
          problems.push('Data criação inválida');
        }

        if (problems.length > 0) {
          console.log(`   ⚠️ PROBLEMAS ENCONTRADOS: ${problems.join(', ')}`);
        } else {
          console.log(`   ✅ Lead aparenta estar correto`);
        }
      } else {
        console.log(`❌ Lead ${leadId} não encontrado na página ${approximatePage}`);
      }

    } catch (error) {
      console.log(`❌ Erro ao buscar página com lead ${leadId}:`);
      console.log(`   Mensagem: ${error.message}`);
    }

    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log('\n🏁 Investigação concluída!');
};

investigateLeads().catch(console.error);