/**
 * 🔍 TESTE DETALHADO: Verificar campos da Oportunidade no SprintHub
 * Verificar o objeto 'fields' que pode conter campos personalizados
 */

const SPRINTHUB_CONFIG = {
  baseUrl: 'sprinthub-api-master.sprinthub.app',
  apiToken: '9ad36c85-5858-4960-9935-e73c3698dd0c',
  instance: 'oficialmed'
};

async function testOpportunityFieldsDetailed() {
  try {
    console.log('🔍 Testando campos detalhados da Oportunidade no SprintHub...');
    
    // Usar exatamente o mesmo formato do TopMenuBar
    const TARGET_FUNNEL = 6;
    const postData = JSON.stringify({ 
      page: 0, 
      limit: 1, 
      columnId: 232
    });
    
    const SPRINTHUB_URL = `https://${SPRINTHUB_CONFIG.baseUrl}`;
    const API_TOKEN = SPRINTHUB_CONFIG.apiToken;
    const INSTANCE = SPRINTHUB_CONFIG.instance;
    
    const url = `${SPRINTHUB_URL}/crm/opportunities/${TARGET_FUNNEL}?apitoken=${API_TOKEN}&i=${INSTANCE}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: postData
    });

    if (!response.ok) {
      console.log(`❌ Erro ${response.status}: ${await response.text()}`);
      return;
    }

    const data = await response.json();
    
    if (!Array.isArray(data) || data.length === 0) {
      console.log('❌ Nenhuma oportunidade encontrada');
      return;
    }

    const opportunity = data[0];
    
    console.log('✅ Oportunidade encontrada!');
    console.log('📋 Campos principais:');
    
    // Listar campos principais
    Object.keys(opportunity).forEach(key => {
      if (key !== 'fields' && key !== 'dataLead') {
        const value = opportunity[key];
        const type = typeof value;
        const preview = type === 'string' && value.length > 50 ? 
          value.substring(0, 50) + '...' : 
          value;
        
        console.log(`  ${key}: ${preview} (${type})`);
      }
    });

    // Verificar objeto 'fields' (campos personalizados)
    console.log('\n🔍 Campos personalizados (fields):');
    if (opportunity.fields && typeof opportunity.fields === 'object') {
      Object.keys(opportunity.fields).forEach(key => {
        const value = opportunity.fields[key];
        const type = typeof value;
        const preview = type === 'string' && value.length > 50 ? 
          value.substring(0, 50) + '...' : 
          value;
        
        console.log(`  fields.${key}: ${preview} (${type})`);
      });
    } else {
      console.log('  ❌ Objeto fields não encontrado ou vazio');
    }

    // Verificar objeto 'dataLead' (dados do lead relacionado)
    console.log('\n👤 Dados do Lead (dataLead):');
    if (opportunity.dataLead && typeof opportunity.dataLead === 'object') {
      Object.keys(opportunity.dataLead).forEach(key => {
        const value = opportunity.dataLead[key];
        const type = typeof value;
        const preview = type === 'string' && value.length > 50 ? 
          value.substring(0, 50) + '...' : 
          value;
        
        console.log(`  dataLead.${key}: ${preview} (${type})`);
      });
    } else {
      console.log('  ❌ Objeto dataLead não encontrado ou vazio');
    }

    // Verificar campos específicos que queremos em todos os objetos
    console.log('\n🎯 Buscando campos específicos em todos os objetos:');
    
    const searchFields = [
      'Descricao da Formula',
      'descricao_formula', 
      'descricaoFormula',
      'description',
      'formula_description'
    ];
    
    searchFields.forEach(fieldName => {
      let found = false;
      
      // Buscar no objeto principal
      if (opportunity[fieldName] !== undefined) {
        console.log(`  ✅ ${fieldName}: ${opportunity[fieldName]}`);
        found = true;
      }
      
      // Buscar no objeto fields
      if (opportunity.fields && opportunity.fields[fieldName] !== undefined) {
        console.log(`  ✅ fields.${fieldName}: ${opportunity.fields[fieldName]}`);
        found = true;
      }
      
      // Buscar no objeto dataLead
      if (opportunity.dataLead && opportunity.dataLead[fieldName] !== undefined) {
        console.log(`  ✅ dataLead.${fieldName}: ${opportunity.dataLead[fieldName]}`);
        found = true;
      }
      
      if (!found) {
        console.log(`  ❌ ${fieldName}: NÃO ENCONTRADO`);
      }
    });

    // Buscar por campos que contenham "formula" ou "descricao"
    console.log('\n🔍 Buscando campos que contenham "formula" ou "descricao":');
    
    const allFields = {
      ...opportunity,
      ...(opportunity.fields ? Object.fromEntries(Object.entries(opportunity.fields).map(([k, v]) => [`fields.${k}`, v])) : {}),
      ...(opportunity.dataLead ? Object.fromEntries(Object.entries(opportunity.dataLead).map(([k, v]) => [`dataLead.${k}`, v])) : {})
    };
    
    Object.keys(allFields).forEach(key => {
      if (key.toLowerCase().includes('formula') || key.toLowerCase().includes('descricao') || key.toLowerCase().includes('description')) {
        const value = allFields[key];
        const type = typeof value;
        const preview = type === 'string' && value.length > 50 ? 
          value.substring(0, 50) + '...' : 
          value;
        
        console.log(`  🎯 ${key}: ${preview} (${type})`);
      }
    });
    
  } catch (error) {
    console.error('❌ Erro ao testar campos da oportunidade:', error);
  }
}

// Executar teste
testOpportunityFieldsDetailed();



























