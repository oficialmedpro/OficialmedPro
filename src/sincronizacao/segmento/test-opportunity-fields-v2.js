/**
 * 🔍 TESTE V2: Verificar campos da Oportunidade no SprintHub
 * Objetivo: Ver se "Descricao da Formula" está disponível
 */

const SPRINTHUB_BASE_URL = 'sprinthub-api-master.sprinthub.app';
const SPRINTHUB_TOKEN = '9ad36c85-5858-4960-9935-e73c3698dd0c';
const SPRINTHUB_INSTANCE = 'oficialmed';

async function testOpportunityFieldsV2() {
  try {
    console.log('🔍 Testando campos da Oportunidade no SprintHub (V2)...');
    
    // Tentar diferentes endpoints para oportunidades
    const endpoints = [
      `https://${SPRINTHUB_BASE_URL}/opportunities?i=${SPRINTHUB_INSTANCE}&apitoken=${SPRINTHUB_TOKEN}&limit=1`,
      `https://${SPRINTHUB_BASE_URL}/opportunities?i=${SPRINTHUB_INSTANCE}&apitoken=${SPRINTHUB_TOKEN}`,
      `https://${SPRINTHUB_BASE_URL}/opportunity?i=${SPRINTHUB_INSTANCE}&apitoken=${SPRINTHUB_TOKEN}&limit=1`,
      `https://${SPRINTHUB_BASE_URL}/opportunity?i=${SPRINTHUB_INSTANCE}&apitoken=${SPRINTHUB_TOKEN}`
    ];
    
    for (let i = 0; i < endpoints.length; i++) {
      const url = endpoints[i];
      console.log(`\n📡 Testando endpoint ${i + 1}: ${url}`);
      
      try {
        const response = await fetch(url, {
          headers: {
            'Accept': 'application/json'
          }
        });

        console.log(`Status: ${response.status}`);

        if (!response.ok) {
          console.log(`❌ Erro ${response.status}: ${response.statusText}`);
          continue;
        }

        const data = await response.json();
        console.log('✅ Resposta recebida!');
        console.log('📋 Estrutura da resposta:', Object.keys(data));
        
        // Verificar diferentes estruturas possíveis
        let opportunities = null;
        
        if (data?.data?.opportunities) {
          opportunities = data.data.opportunities;
          console.log('📊 Encontrado em: data.opportunities');
        } else if (data?.data?.opportunity) {
          opportunities = Array.isArray(data.data.opportunity) ? data.data.opportunity : [data.data.opportunity];
          console.log('📊 Encontrado em: data.opportunity');
        } else if (data?.opportunities) {
          opportunities = data.opportunities;
          console.log('📊 Encontrado em: opportunities');
        } else if (data?.opportunity) {
          opportunities = Array.isArray(data.opportunity) ? data.opportunity : [data.opportunity];
          console.log('📊 Encontrado em: opportunity');
        } else {
          console.log('❌ Nenhuma oportunidade encontrada na resposta');
          continue;
        }
        
        if (!opportunities || opportunities.length === 0) {
          console.log('❌ Array de oportunidades vazio');
          continue;
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
        
        return; // Sucesso, sair do loop
        
      } catch (error) {
        console.log(`❌ Erro no endpoint ${i + 1}:`, error.message);
        continue;
      }
    }
    
    console.log('\n❌ Nenhum endpoint de oportunidade funcionou');
    
  } catch (error) {
    console.error('❌ Erro geral ao testar oportunidades:', error);
  }
}

// Executar teste
testOpportunityFieldsV2();

























