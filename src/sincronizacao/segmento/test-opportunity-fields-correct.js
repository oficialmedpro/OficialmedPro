/**
 * 🔍 TESTE CORRETO: Verificar campos da Oportunidade no SprintHub
 * Baseado nos códigos existentes de sincronização
 */

const SPRINTHUB_BASE_URL = 'sprinthub-api-master.sprinthub.app';
const SPRINTHUB_TOKEN = '9ad36c85-5858-4960-9935-e73c3698dd0c';
const SPRINTHUB_INSTANCE = 'oficialmed';

// Função para fazer requisições POST (como nos códigos existentes)
async function postRequest(url, data) {
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(data)
    });

    let responseData;
    try {
      responseData = await response.json();
    } catch {
      responseData = await response.text();
    }

    return {
      ok: response.ok,
      status: response.status,
      data: responseData
    };
  } catch (error) {
    throw new Error(`Request failed: ${error.message}`);
  }
}

async function testOpportunityFieldsCorrect() {
  try {
    console.log('🔍 Testando campos da Oportunidade no SprintHub (CORRETO)...');
    
    // Usar o endpoint correto baseado nos códigos existentes
    // Formato: /crm/opportunities/{funnelId} com POST
    const funnelId = 6; // Funil 6 (baseado nos códigos)
    
    const postData = {
      page: 0,
      limit: 1,
      columnId: 1 // Primeira etapa do funil
    };

    const url = `https://${SPRINTHUB_BASE_URL}/crm/opportunities/${funnelId}?apitoken=${SPRINTHUB_TOKEN}&i=${SPRINTHUB_INSTANCE}`;
    
    console.log(`📡 URL: ${url}`);
    console.log(`📡 POST Data:`, postData);
    
    const response = await postRequest(url, postData);
    
    console.log(`Status: ${response.status}`);
    console.log(`OK: ${response.ok}`);

    if (!response.ok) {
      console.log(`❌ Erro ${response.status}: ${JSON.stringify(response.data)}`);
      return;
    }

    const data = response.data;
    console.log('✅ Resposta recebida!');
    console.log('📋 Estrutura da resposta:', Object.keys(data));
    
    // Verificar se há oportunidades
    let opportunities = null;
    
    if (Array.isArray(data)) {
      opportunities = data;
      console.log('📊 Dados são array direto');
    } else if (data?.data && Array.isArray(data.data)) {
      opportunities = data.data;
      console.log('📊 Dados em: data');
    } else {
      console.log('❌ Estrutura de dados não reconhecida:', data);
      return;
    }
    
    if (!opportunities || opportunities.length === 0) {
      console.log('❌ Nenhuma oportunidade encontrada');
      return;
    }

    const opportunity = opportunities[0];
    
    console.log('✅ Oportunidade encontrada!');
    console.log('📋 Todos os campos disponíveis:');
    
    // Listar todos os campos da oportunidade
    Object.keys(opportunity).forEach(key => {
      const value = opportunity[key];
      const type = typeof value;
      const preview = type === 'string' && value.length > 50 ? 
        value.substring(0, 50) + '...' : 
        value;
      
      console.log(`  ${key}: ${preview} (${type})`);
    });

    // Verificar campos específicos que queremos
    console.log('\n🎯 Campos específicos que procuramos:');
    console.log(`  Descricao da Formula: ${opportunity['Descricao da Formula'] || 'NÃO ENCONTRADO'}`);
    console.log(`  descricao_formula: ${opportunity.descricao_formula || 'NÃO ENCONTRADO'}`);
    console.log(`  descricaoFormula: ${opportunity.descricaoFormula || 'NÃO ENCONTRADO'}`);
    console.log(`  description: ${opportunity.description || 'NÃO ENCONTRADO'}`);
    console.log(`  formula_description: ${opportunity.formula_description || 'NÃO ENCONTRADO'}`);
    
    // Campos adicionais que podem ser úteis
    console.log('\n💡 Outros campos interessantes:');
    console.log(`  id: ${opportunity.id || 'NÃO ENCONTRADO'}`);
    console.log(`  title: ${opportunity.title || 'NÃO ENCONTRADO'}`);
    console.log(`  name: ${opportunity.name || 'NÃO ENCONTRADO'}`);
    console.log(`  value: ${opportunity.value || 'NÃO ENCONTRADO'}`);
    console.log(`  stage: ${opportunity.stage || 'NÃO ENCONTRADO'}`);
    console.log(`  status: ${opportunity.status || 'NÃO ENCONTRADO'}`);
    console.log(`  lead: ${opportunity.lead ? opportunity.lead.id : 'NÃO ENCONTRADO'}`);
    console.log(`  createDate: ${opportunity.createDate || 'NÃO ENCONTRADO'}`);
    console.log(`  updateDate: ${opportunity.updateDate || 'NÃO ENCONTRADO'}`);
    
  } catch (error) {
    console.error('❌ Erro ao testar campos da oportunidade:', error);
  }
}

// Executar teste
testOpportunityFieldsCorrect();





















