/**
 * 🔍 TESTE: Verificar campos do Lead no SprintHub
 * Objetivo: Ver se descricao_formula e outros campos estão disponíveis
 */

const SPRINTHUB_BASE_URL = 'sprinthub-api-master.sprinthub.app';
const SPRINTHUB_TOKEN = '9ad36c85-5858-4960-9935-e73c3698dd0c';
const SPRINTHUB_INSTANCE = 'oficialmed';

async function testLeadFields() {
  try {
    console.log('🔍 Testando campos do Lead no SprintHub...');
    
    // Buscar um lead específico para ver todos os campos
    const leadId = 112795; // ID de um lead que sabemos que existe
    
    const url = `https://${SPRINTHUB_BASE_URL}/leads/${leadId}?i=${SPRINTHUB_INSTANCE}&allFields=1&apitoken=${SPRINTHUB_TOKEN}`;
    
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
    const lead = data?.data?.lead;
    
    if (!lead) {
      console.log('❌ Lead não encontrado');
      return;
    }

    console.log('✅ Lead encontrado!');
    console.log('📋 Todos os campos disponíveis:');
    
    // Listar todos os campos do lead
    Object.keys(lead).forEach(key => {
      const value = lead[key];
      const type = typeof value;
      const preview = type === 'string' && value.length > 50 ? 
        value.substring(0, 50) + '...' : 
        value;
      
      console.log(`  ${key}: ${preview} (${type})`);
    });

    // Verificar campos específicos que queremos
    console.log('\n🎯 Campos específicos que procuramos:');
    console.log(`  descricao_formula: ${lead.descricao_formula || 'NÃO ENCONTRADO'}`);
    console.log(`  city: ${lead.city || 'NÃO ENCONTRADO'}`);
    console.log(`  state: ${lead.state || 'NÃO ENCONTRADO'}`);
    console.log(`  email: ${lead.email || 'NÃO ENCONTRADO'}`);
    console.log(`  phone: ${lead.phone || 'NÃO ENCONTRADO'}`);
    console.log(`  whatsapp: ${lead.whatsapp || 'NÃO ENCONTRADO'}`);
    console.log(`  fullname: ${lead.fullname || 'NÃO ENCONTRADO'}`);
    console.log(`  firstname: ${lead.firstname || 'NÃO ENCONTRADO'}`);
    console.log(`  lastname: ${lead.lastname || 'NÃO ENCONTRADO'}`);
    
    // Campos adicionais que podem ser úteis
    console.log('\n💡 Outros campos interessantes:');
    console.log(`  origem: ${lead.origem || 'NÃO ENCONTRADO'}`);
    console.log(`  plataforma: ${lead.plataforma || 'NÃO ENCONTRADO'}`);
    console.log(`  categoria: ${lead.categoria || 'NÃO ENCONTRADO'}`);
    console.log(`  grau_de_interesse: ${lead.grauDeInteresse || 'NÃO ENCONTRADO'}`);
    console.log(`  capital_de_investimento: ${lead.capitalDeInvestimento || 'NÃO ENCONTRADO'}`);
    console.log(`  tipo_de_compra: ${lead.tipoDeCompra || 'NÃO ENCONTRADO'}`);
    console.log(`  data_de_nascimento: ${lead.dataDeNascimento || 'NÃO ENCONTRADO'}`);
    console.log(`  sexo: ${lead.sexo || 'NÃO ENCONTRADO'}`);
    console.log(`  cpf: ${lead.cpf || 'NÃO ENCONTRADO'}`);
    console.log(`  observacao: ${lead.observacao || 'NÃO ENCONTRADO'}`);
    console.log(`  feedback: ${lead.feedback || 'NÃO ENCONTRADO'}`);
    console.log(`  atendente: ${lead.atendente || 'NÃO ENCONTRADO'}`);
    console.log(`  status: ${lead.status || 'NÃO ENCONTRADO'}`);
    console.log(`  createDate: ${lead.createDate || 'NÃO ENCONTRADO'}`);
    
  } catch (error) {
    console.error('❌ Erro ao testar campos do lead:', error);
  }
}

// Executar teste
testLeadFields();






























