/**
 * 🧪 TESTE: Disparo direto para o Callix
 * Testando o envio com os campos corretos
 */

const CALLIX_TOKEN = '68b46239-a040-4703-b8e9-c0b25b519e64';
const CALLIX_URL = 'https://oficialmed.callix.com.br/api/v1/campaign_contacts_async';

// Função para remover DDI do telefone (remover 55 do início)
function removerDDI(telefone) {
  try {
    if (!telefone || telefone.trim() === '') {
      return '';
    }
    
    // Remover espaços e caracteres especiais
    let telLimpo = telefone.replace(/\D/g, '');
    
    // Se começa com 55 (DDI do Brasil), remover
    if (telLimpo.startsWith('55')) {
      telLimpo = telLimpo.substring(2);
    }
    
    // Se ainda tem mais de 11 dígitos após remover DDI, pode ser que tenha 55 duplicado
    if (telLimpo.length > 11 && telLimpo.startsWith('55')) {
      telLimpo = telLimpo.substring(2);
    }
    
    return telLimpo;
  } catch (error) {
    console.error('❌ Erro ao remover DDI do telefone:', telefone, error);
    return telefone; // Retornar original em caso de erro
  }
}

// Função para formatar data no formato DD/MM/AAAA
function formatarDataDDMMAAAA(data) {
  try {
    let dataObj;
    
    if (typeof data === 'string') {
      if (data.includes('T')) {
        dataObj = new Date(data);
      } else if (data.includes('-')) {
        dataObj = new Date(data + 'T00:00:00');
      } else if (data.includes('/')) {
        const partes = data.split('/');
        if (partes.length === 3) {
          if (parseInt(partes[0]) <= 12) {
            dataObj = new Date(parseInt(partes[2]), parseInt(partes[1]) - 1, parseInt(partes[0]));
          } else {
            dataObj = new Date(parseInt(partes[2]), parseInt(partes[0]) - 1, parseInt(partes[1]));
          }
        } else {
          return data;
        }
      } else {
        dataObj = new Date(data);
      }
    } else {
      dataObj = data;
    }
    
    if (isNaN(dataObj.getTime())) {
      console.warn('⚠️ Data inválida:', data);
      return '';
    }
    
    const dia = dataObj.getDate().toString().padStart(2, '0');
    const mes = (dataObj.getMonth() + 1).toString().padStart(2, '0');
    const ano = dataObj.getFullYear().toString();
    
    return `${dia}/${mes}/${ano}`;
  } catch (error) {
    console.error('❌ Erro ao formatar data:', data, error);
    return '';
  }
}

async function testCallixDisparo() {
  try {
    console.log('🧪 TESTANDO DISPARO DIRETO PARA O CALLIX...');
    console.log('='.repeat(60));

    // Dados de teste (simulando 5 leads reais)
    const leadsTeste = [
      {
        id: 96686,
        firstname: 'Ricardo',
        lastname: 'Henrique Raiol dos Santos',
        email: 'raiolsantos3@gmail.com',
        whatsapp: '559198049467',
        city: 'Curitiba',
        state: 'Paraná',
        data_ultima_compra: '01/08/2025',
        observacao: 'Lead de teste para integração',
        descricao_formula: 'Fórmula de teste',
        tipo_de_compra: 'compra_nova',
        objetivos_do_cliente: 'Emagrecimento e saúde'
      },
      {
        id: 112795,
        firstname: 'EDICLEIA RIBEIRO',
        lastname: 'GARCIA',
        email: 'edicleia@gmail.com',
        whatsapp: '5543999100031',
        city: 'São Paulo',
        state: 'SP',
        data_ultima_compra: '15/09/2025',
        observacao: 'Cliente interessada em emagrecimento',
        descricao_formula: 'Fórmula para emagrecimento',
        tipo_de_compra: 'recompra',
        objetivos_do_cliente: 'Perder peso'
      },
      {
        id: 112796,
        firstname: 'MARIA',
        lastname: 'SILVA SANTOS',
        email: 'maria.silva@hotmail.com',
        whatsapp: '5511987654321',
        city: 'Rio de Janeiro',
        state: 'RJ',
        data_ultima_compra: '20/09/2025',
        observacao: 'Nova cliente',
        descricao_formula: 'Fórmula para saúde geral',
        tipo_de_compra: 'compra_nova',
        objetivos_do_cliente: 'Melhorar saúde'
      },
      {
        id: 112797,
        firstname: 'JOÃO',
        lastname: 'PEREIRA COSTA',
        email: 'joao.costa@gmail.com',
        whatsapp: '5585999887766',
        city: 'Fortaleza',
        state: 'CE',
        data_ultima_compra: '25/09/2025',
        observacao: 'Cliente fiel',
        descricao_formula: 'Fórmula personalizada',
        tipo_de_compra: 'recompra',
        objetivos_do_cliente: 'Manter resultados'
      },
      {
        id: 112798,
        firstname: 'ANA',
        lastname: 'OLIVEIRA LIMA',
        email: 'ana.oliveira@yahoo.com',
        whatsapp: '5584988776655',
        city: 'Salvador',
        state: 'BA',
        data_ultima_compra: '30/09/2025',
        observacao: 'Interessada em detox',
        descricao_formula: 'Fórmula detox',
        tipo_de_compra: 'compra_nova',
        objetivos_do_cliente: 'Detox e limpeza'
      }
    ];

    const campaignId = 22; // ID da lista que você configurou

    // Preparar dados dos 5 leads
    const importData = leadsTeste.map(lead => ({
      Nome: lead.firstname,
      Sobrenome: lead.lastname,
      link: `https://oficialmed.sprinthub.app/sh/leads/profile/${lead.id}`,
      email: lead.email,
      telefone: removerDDI(lead.whatsapp),
      cidade: lead.city,
      estado: lead.state,
      'Data-compra': formatarDataDDMMAAAA(lead.data_ultima_compra),
      Observacao: lead.observacao,
      Formula: lead.descricao_formula,
      'tipo-compra': lead.tipo_de_compra,
      'objetivo-cliente': lead.objetivos_do_cliente
    }));

    const payload = {
      data: {
        type: "campaign_contacts_async",
        attributes: {
          remove_duplicated_phones: "true",
          import_data: importData
        },
        relationships: {
          campaign_list: {
            data: {
              type: "campaign_lists",
              id: campaignId
            }
          }
        }
      }
    };

    console.log('📡 Enviando 5 leads para Callix...');
    console.log(`🎯 URL: ${CALLIX_URL}`);
    console.log(`🎯 Campaign ID: ${campaignId}`);
    console.log(`📊 Total de leads: ${importData.length}`);
    
    // Mostrar resumo dos leads
    console.log('\n📋 RESUMO DOS LEADS:');
    importData.forEach((lead, index) => {
      console.log(`${index + 1}. ${lead.Nome} ${lead.Sobrenome} - ${lead.telefone} - ${lead.cidade}/${lead.estado}`);
    });
    
    console.log('\n📋 Payload completo:', JSON.stringify(payload, null, 2));

    const response = await fetch(CALLIX_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CALLIX_TOKEN}`,
        'Content-Type': 'application/vnd.api+json'
      },
      body: JSON.stringify(payload)
    });

    console.log('\n📊 RESPOSTA DO CALLIX:');
    console.log(`Status: ${response.status}`);
    console.log(`OK: ${response.ok}`);

    if (response.ok) {
      const result = await response.json();
      console.log('✅ SUCESSO! Lead enviado para o Callix:');
      console.log(JSON.stringify(result, null, 2));
      
      if (result.data && result.data.id) {
        console.log(`\n🎯 ID do Lead no Callix: ${result.data.id}`);
      }
    } else {
      const errorText = await response.text();
      console.log('❌ ERRO no envio:');
      console.log(errorText);
    }

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

// Executar teste
testCallixDisparo();
