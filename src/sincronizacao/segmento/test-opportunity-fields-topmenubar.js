/**
 * 🔍 TESTE TOPMENUBAR: Verificar campos da Oportunidade no SprintHub
 * Baseado no código que funciona no TopMenuBar.jsx
 */

const SPRINTHUB_CONFIG = {
  baseUrl: 'sprinthub-api-master.sprinthub.app',
  apiToken: '9ad36c85-5858-4960-9935-e73c3698dd0c',
  instance: 'oficialmed'
};

async function testOpportunityFieldsTopMenuBar() {
  try {
    console.log('🔍 Testando campos da Oportunidade no SprintHub (TOPMENUBAR)...');
    
    // Usar exatamente o mesmo formato do TopMenuBar
    const TARGET_FUNNEL = 6; // Funil 6 como no TopMenuBar
    const postData = JSON.stringify({ 
      page: 0, 
      limit: 5, 
      columnId: 232 // Etapa CADASTRO como no TopMenuBar
    });
    
    const SPRINTHUB_URL = `https://${SPRINTHUB_CONFIG.baseUrl}`;
    const API_TOKEN = SPRINTHUB_CONFIG.apiToken;
    const INSTANCE = SPRINTHUB_CONFIG.instance;
    
    const url = `${SPRINTHUB_URL}/crm/opportunities/${TARGET_FUNNEL}?apitoken=${API_TOKEN}&i=${INSTANCE}`;
    
    console.log(`📡 URL: ${url}`);
    console.log(`📡 POST Data: ${postData}`);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: postData
    });
    
    console.log(`Status: ${response.status}`);
    console.log(`OK: ${response.ok}`);

    if (!response.ok) {
      console.log(`❌ Erro ${response.status}: ${await response.text()}`);
      return;
    }

    const data = await response.json();
    console.log('✅ Resposta recebida!');
    console.log('📋 Estrutura da resposta:', Object.keys(data));
    console.log('📊 Tipo de dados:', Array.isArray(data) ? 'Array' : typeof data);
    console.log('📊 Tamanho:', Array.isArray(data) ? data.length : 'N/A');
    
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
      console.log('❌ Nenhuma oportunidade encontrada na etapa 232');
      
      // Tentar com outras etapas que podem ter oportunidades
      const etapas = [233, 234, 235, 236, 237, 238, 239, 240, 241, 242, 243];
      
      console.log('\n🔄 Tentando outras etapas do funil...');
      
      for (const etapa of etapas) {
        console.log(`\n📡 Testando etapa ${etapa}...`);
        
        const postDataEtapa = JSON.stringify({ 
          page: 0, 
          limit: 5, 
          columnId: etapa 
        });

        const responseEtapa = await fetch(url, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: postDataEtapa
        });
        
        if (responseEtapa.ok) {
          const dataEtapa = await responseEtapa.json();
          
          if (Array.isArray(dataEtapa) && dataEtapa.length > 0) {
            console.log(`✅ Encontradas ${dataEtapa.length} oportunidades na etapa ${etapa}!`);
            
            const opportunity = dataEtapa[0];
            
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
            
            return; // Sucesso, sair do loop
          } else {
            console.log(`❌ Nenhuma oportunidade na etapa ${etapa}`);
          }
        } else {
          console.log(`❌ Erro ${responseEtapa.status} na etapa ${etapa}`);
        }
      }
      
      console.log('\n❌ Nenhuma oportunidade encontrada em nenhuma etapa do Funil 6');
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
    
  } catch (error) {
    console.error('❌ Erro ao testar campos da oportunidade:', error);
  }
}

// Executar teste
testOpportunityFieldsTopMenuBar();




























