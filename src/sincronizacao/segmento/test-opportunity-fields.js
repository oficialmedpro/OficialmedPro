/**
 * 🔍 TESTE: Verificar campos da Oportunidade no SprintHub
 * Objetivo: Ver se "Descricao da Formula" está disponível
 */

const SPRINTHUB_BASE_URL = 'sprinthub-api-master.sprinthub.app';
const SPRINTHUB_TOKEN = '9ad36c85-5858-4960-9935-e73c3698dd0c';
const SPRINTHUB_INSTANCE = 'oficialmed';

async function testOpportunityFields() {
  try {
    console.log('🔍 Testando campos da Oportunidade no SprintHub...');
    
    // Buscar oportunidades para ver os campos
    const url = `https://${SPRINTHUB_BASE_URL}/opportunities?i=${SPRINTHUB_INSTANCE}&apitoken=${SPRINTHUB_TOKEN}&limit=1`;
    
    console.log(`📡 URL: ${url}`);
    
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Erro ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    const opportunities = data?.data?.opportunities;
    
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
testOpportunityFields();




















