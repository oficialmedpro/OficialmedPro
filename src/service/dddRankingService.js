// Configurações do Supabase
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY
const supabaseSchema = import.meta.env.VITE_SUPABASE_SCHEMA || 'api'

/**
 * 🎯 DDD RANKING SERVICE
 * 
 * Service para buscar e processar dados de ranking por DDD
 * Extrai os primeiros 2 dígitos do WhatsApp para agrupar por região
 */

/**
 * Extrai o DDD do número de WhatsApp
 * @param {string} whatsapp - Número do WhatsApp (ex: "554197875788")
 * @returns {string} - DDD (ex: "41")
 */
function extractDDD(whatsapp) {
  if (!whatsapp) return null;
  
  // Remove espaços e caracteres especiais
  const cleanNumber = whatsapp.toString().replace(/\D/g, '');
  
  // Se começar com 55 (código do Brasil), pega os próximos 2 dígitos
  if (cleanNumber.startsWith('55') && cleanNumber.length >= 4) {
    return cleanNumber.substring(2, 4);
  }
  
  // Se não começar com 55, pega os primeiros 2 dígitos
  if (cleanNumber.length >= 2) {
    return cleanNumber.substring(0, 2);
  }
  
  return null;
}

/**
 * Mapeia DDD para região/estado
 * @param {string} ddd - DDD (ex: "41")
 * @returns {object} - { estado: "PR", regiao: "Sul" }
 */
function getDDDInfo(ddd) {
  const dddMap = {
    '11': { estado: 'SP', regiao: 'Sudeste', cidade: 'São Paulo' },
    '12': { estado: 'SP', regiao: 'Sudeste', cidade: 'Vale do Paraíba' },
    '13': { estado: 'SP', regiao: 'Sudeste', cidade: 'Baixada Santista' },
    '14': { estado: 'SP', regiao: 'Sudeste', cidade: 'Bauru' },
    '15': { estado: 'SP', regiao: 'Sudeste', cidade: 'Sorocaba' },
    '16': { estado: 'SP', regiao: 'Sudeste', cidade: 'Ribeirão Preto' },
    '17': { estado: 'SP', regiao: 'Sudeste', cidade: 'São José do Rio Preto' },
    '18': { estado: 'SP', regiao: 'Sudeste', cidade: 'Presidente Prudente' },
    '19': { estado: 'SP', regiao: 'Sudeste', cidade: 'Campinas' },
    '21': { estado: 'RJ', regiao: 'Sudeste', cidade: 'Rio de Janeiro' },
    '22': { estado: 'RJ', regiao: 'Sudeste', cidade: 'Campos dos Goytacazes' },
    '24': { estado: 'RJ', regiao: 'Sudeste', cidade: 'Volta Redonda' },
    '27': { estado: 'ES', regiao: 'Sudeste', cidade: 'Vitória' },
    '28': { estado: 'ES', regiao: 'Sudeste', cidade: 'Cachoeiro de Itapemirim' },
    '31': { estado: 'MG', regiao: 'Sudeste', cidade: 'Belo Horizonte' },
    '32': { estado: 'MG', regiao: 'Sudeste', cidade: 'Juiz de Fora' },
    '33': { estado: 'MG', regiao: 'Sudeste', cidade: 'Governador Valadares' },
    '34': { estado: 'MG', regiao: 'Sudeste', cidade: 'Uberlândia' },
    '35': { estado: 'MG', regiao: 'Sudeste', cidade: 'Poços de Caldas' },
    '37': { estado: 'MG', regiao: 'Sudeste', cidade: 'Divinópolis' },
    '38': { estado: 'MG', regiao: 'Sudeste', cidade: 'Montes Claros' },
    '41': { estado: 'PR', regiao: 'Sul', cidade: 'Curitiba' },
    '42': { estado: 'PR', regiao: 'Sul', cidade: 'Ponta Grossa' },
    '43': { estado: 'PR', regiao: 'Sul', cidade: 'Londrina' },
    '44': { estado: 'PR', regiao: 'Sul', cidade: 'Maringá' },
    '45': { estado: 'PR', regiao: 'Sul', cidade: 'Foz do Iguaçu' },
    '46': { estado: 'PR', regiao: 'Sul', cidade: 'Francisco Beltrão' },
    '47': { estado: 'SC', regiao: 'Sul', cidade: 'Joinville' },
    '48': { estado: 'SC', regiao: 'Sul', cidade: 'Florianópolis' },
    '49': { estado: 'SC', regiao: 'Sul', cidade: 'Chapecó' },
    '51': { estado: 'RS', regiao: 'Sul', cidade: 'Porto Alegre' },
    '53': { estado: 'RS', regiao: 'Sul', cidade: 'Pelotas' },
    '54': { estado: 'RS', regiao: 'Sul', cidade: 'Caxias do Sul' },
    '55': { estado: 'RS', regiao: 'Sul', cidade: 'Santa Maria' },
    '61': { estado: 'DF', regiao: 'Centro-Oeste', cidade: 'Brasília' },
    '62': { estado: 'GO', regiao: 'Centro-Oeste', cidade: 'Goiânia' },
    '63': { estado: 'TO', regiao: 'Norte', cidade: 'Palmas' },
    '64': { estado: 'GO', regiao: 'Centro-Oeste', cidade: 'Rio Verde' },
    '65': { estado: 'MT', regiao: 'Centro-Oeste', cidade: 'Cuiabá' },
    '66': { estado: 'MT', regiao: 'Centro-Oeste', cidade: 'Rondonópolis' },
    '67': { estado: 'MS', regiao: 'Centro-Oeste', cidade: 'Campo Grande' },
    '68': { estado: 'AC', regiao: 'Norte', cidade: 'Rio Branco' },
    '69': { estado: 'RO', regiao: 'Norte', cidade: 'Porto Velho' },
    '71': { estado: 'BA', regiao: 'Nordeste', cidade: 'Salvador' },
    '73': { estado: 'BA', regiao: 'Nordeste', cidade: 'Ilhéus' },
    '74': { estado: 'BA', regiao: 'Nordeste', cidade: 'Juazeiro' },
    '75': { estado: 'BA', regiao: 'Nordeste', cidade: 'Feira de Santana' },
    '77': { estado: 'BA', regiao: 'Nordeste', cidade: 'Barreiras' },
    '79': { estado: 'SE', regiao: 'Nordeste', cidade: 'Aracaju' },
    '81': { estado: 'PE', regiao: 'Nordeste', cidade: 'Recife' },
    '82': { estado: 'AL', regiao: 'Nordeste', cidade: 'Maceió' },
    '83': { estado: 'PB', regiao: 'Nordeste', cidade: 'João Pessoa' },
    '84': { estado: 'RN', regiao: 'Nordeste', cidade: 'Natal' },
    '85': { estado: 'CE', regiao: 'Nordeste', cidade: 'Fortaleza' },
    '86': { estado: 'PI', regiao: 'Nordeste', cidade: 'Teresina' },
    '87': { estado: 'PE', regiao: 'Nordeste', cidade: 'Petrolina' },
    '88': { estado: 'CE', regiao: 'Nordeste', cidade: 'Juazeiro do Norte' },
    '89': { estado: 'PI', regiao: 'Nordeste', cidade: 'Picos' },
    '91': { estado: 'PA', regiao: 'Norte', cidade: 'Belém' },
    '92': { estado: 'AM', regiao: 'Norte', cidade: 'Manaus' },
    '93': { estado: 'PA', regiao: 'Norte', cidade: 'Santarém' },
    '94': { estado: 'PA', regiao: 'Norte', cidade: 'Marabá' },
    '95': { estado: 'RR', regiao: 'Norte', cidade: 'Boa Vista' },
    '96': { estado: 'AP', regiao: 'Norte', cidade: 'Macapá' },
    '97': { estado: 'AM', regiao: 'Norte', cidade: 'Coari' },
    '98': { estado: 'MA', regiao: 'Nordeste', cidade: 'São Luís' },
    '99': { estado: 'MA', regiao: 'Nordeste', cidade: 'Imperatriz' }
  };
  
  return dddMap[ddd] || { estado: 'N/A', regiao: 'N/A', cidade: 'N/A' };
}

/**
 * Busca dados de ranking por DDD
 */
export async function getDDDRankingData(startDate, endDate, selectedFunnel, selectedUnit, selectedSeller, selectedOrigin, page = 1, pageSize = 20) {
  try {
    console.log('🎯 DDDRankingService: Buscando dados...', {
      startDate, endDate, selectedFunnel, selectedUnit, selectedSeller, selectedOrigin, page, pageSize
    });

    // Construir filtros
    let filters = [];
    
    // Filtro de data
    if (startDate && endDate) {
      filters.push(`gain_date.gte.${startDate}`);
      filters.push(`gain_date.lte.${endDate}`);
    }
    
    // Filtro de funil
    if (selectedFunnel && selectedFunnel !== 'all') {
      filters.push(`funil_id.eq.${selectedFunnel}`);
    }
    
    // Filtro de unidade
    if (selectedUnit && selectedUnit !== 'all') {
      filters.push(`unidade_id.eq.${selectedUnit}`);
    }
    
    // Filtro de vendedor
    if (selectedSeller && selectedSeller !== 'all') {
      filters.push(`user_id.eq.${selectedSeller}`);
    }
    
    // Filtro de origem
    if (selectedOrigin && selectedOrigin !== 'all') {
      filters.push(`origem_oportunidade.eq.${selectedOrigin}`);
    }
    
    // Filtro de status (apenas ganhas)
    filters.push(`status.eq.gain`);
    
    // Filtro de WhatsApp não nulo
    filters.push(`lead_whatsapp.not.is.null`);

    // Construir URL
    const baseUrl = `${supabaseUrl}/rest/v1/oportunidade_sprint`;
    const selectFields = 'id,lead_whatsapp,value,lead_firstname,lead_city,funil_id,unidade_id,user_id,origem_oportunidade,gain_date';
    const filterString = filters.join('&');
    const orderBy = 'gain_date.desc';
    const limit = 1000; // Buscar muitos dados para agrupar
    
    const url = `${baseUrl}?select=${selectFields}&${filterString}&order=${orderBy}&limit=${limit}`;
    
    console.log('🔗 DDDRankingService: URL construída:', url);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'Content-Type': 'application/json',
        'Accept-Profile': supabaseSchema,
        'Content-Profile': supabaseSchema,
        'Prefer': 'return=minimal'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ DDDRankingService: Erro na resposta:', response.status, errorText);
      throw new Error(`Erro na requisição: ${response.status}`);
    }

    const data = await response.json();
    console.log('📊 DDDRankingService: Dados recebidos:', data.length, 'oportunidades');

    // Agrupar por DDD
    const dddGroups = {};
    
    data.forEach(opportunity => {
      const ddd = extractDDD(opportunity.lead_whatsapp);
      if (!ddd) return;
      
      if (!dddGroups[ddd]) {
        const dddInfo = getDDDInfo(ddd);
        dddGroups[ddd] = {
          ddd: ddd,
          estado: dddInfo.estado,
          regiao: dddInfo.regiao,
          cidade: dddInfo.cidade,
          totalValue: 0,
          opportunityCount: 0,
          opportunities: []
        };
      }
      
      dddGroups[ddd].totalValue += opportunity.value || 0;
      dddGroups[ddd].opportunityCount += 1;
      dddGroups[ddd].opportunities.push(opportunity);
    });

    // Converter para array e ordenar por valor total
    const dddArray = Object.values(dddGroups)
      .sort((a, b) => b.totalValue - a.totalValue)
      .map((item, index) => ({
        ...item,
        rank: index + 1,
        ticketMedio: item.totalValue / item.opportunityCount,
        progress: 100 // Será calculado baseado no maior valor
      }));

    // Calcular progresso
    if (dddArray.length > 0) {
      const maxValue = dddArray[0].totalValue;
      dddArray.forEach(item => {
        item.progress = (item.totalValue / maxValue) * 100;
      });
    }

    // Aplicar paginação
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedData = dddArray.slice(startIndex, endIndex);

    const totalPages = Math.ceil(dddArray.length / pageSize);
    const pagination = {
      currentPage: page,
      totalPages: totalPages,
      totalItems: dddArray.length,
      pageSize: pageSize,
      hasNext: page < totalPages,
      hasPrev: page > 1
    };

    console.log('✅ DDDRankingService: Dados processados:', {
      total: dddArray.length,
      page: page,
      showing: paginatedData.length,
      pagination
    });

    return {
      data: paginatedData,
      pagination: pagination
    };

  } catch (error) {
    console.error('❌ DDDRankingService: Erro ao buscar dados:', error);
    throw error;
  }
}

/**
 * Busca nomes dos filtros selecionados
 */
export async function getDDDRankingFilterNames(selectedFunnel, selectedUnit, selectedSeller, selectedOrigin) {
  try {
    const names = {};
    
    // Buscar nome do funil
    if (selectedFunnel && selectedFunnel !== 'all') {
      const funnelResponse = await fetch(`${supabaseUrl}/rest/v1/funis?select=nome_funil&id_funil_sprint.eq.${selectedFunnel}`, {
        headers: {
          'apikey': supabaseServiceKey,
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'Accept-Profile': supabaseSchema,
          'Content-Profile': supabaseSchema
        }
      });
      if (funnelResponse.ok) {
        const funnelData = await funnelResponse.json();
        names.funnelName = funnelData[0]?.nome_funil || '';
      }
    }
    
    // Buscar nome da unidade
    if (selectedUnit && selectedUnit !== 'all') {
      const unitResponse = await fetch(`${supabaseUrl}/rest/v1/unidades?select=unidade&codigo_sprint.eq.${selectedUnit}`, {
        headers: {
          'apikey': supabaseServiceKey,
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'Accept-Profile': supabaseSchema,
          'Content-Profile': supabaseSchema
        }
      });
      if (unitResponse.ok) {
        const unitData = await unitResponse.json();
        names.unitName = unitData[0]?.unidade || '';
      }
    }
    
    // Buscar nome do vendedor
    if (selectedSeller && selectedSeller !== 'all') {
      const sellerResponse = await fetch(`${supabaseUrl}/rest/v1/vendedores?select=nome&id_sprint.eq.${selectedSeller}`, {
        headers: {
          'apikey': supabaseServiceKey,
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'Accept-Profile': supabaseSchema,
          'Content-Profile': supabaseSchema
        }
      });
      if (sellerResponse.ok) {
        const sellerData = await sellerResponse.json();
        names.sellerName = sellerData[0]?.nome || '';
      }
    }
    
    // Nome da origem (já é string)
    if (selectedOrigin && selectedOrigin !== 'all') {
      names.originName = selectedOrigin;
    }
    
    return names;
  } catch (error) {
    console.error('❌ DDDRankingService: Erro ao buscar nomes dos filtros:', error);
    return {};
  }
}
