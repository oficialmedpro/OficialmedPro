// Função para obter data atual no fuso horário de São Paulo
export const getTodayDateSP = () => {
  const now = new Date();
  // Converter para fuso horário de São Paulo (America/Sao_Paulo)
  const spDate = new Date(now.toLocaleString("en-US", {timeZone: "America/Sao_Paulo"}));
  return spDate.toISOString().split('T')[0];
};

// Função para converter data local para GMT-3 (São Paulo) para consultas no Supabase
export const convertDateToSaoPauloTZ = (dateString, isEndOfDay = false) => {
  if (!dateString) return '';
  
  // Cria uma data no formato YYYY-MM-DD assumindo timezone de São Paulo
  const date = new Date(dateString + 'T' + (isEndOfDay ? '23:59:59' : '00:00:00'));
  
  // Ajusta para UTC considerando GMT-3 (adiciona 3 horas para compensar)
  const utcDate = new Date(date.getTime() + (3 * 60 * 60 * 1000));
  
  return utcDate.toISOString().replace('.000Z', '');
};

// Função para obter data de início do dia em São Paulo (00:00:00 GMT-3)
export const getStartOfDaySP = (dateString) => {
  return convertDateToSaoPauloTZ(dateString, false);
};

// Função para obter data de fim do dia em São Paulo (23:59:59 GMT-3)  
export const getEndOfDaySP = (dateString) => {
  return convertDateToSaoPauloTZ(dateString, true);
};

// Função para converter valores
export const convertCurrency = (value, fromCurrency = 'BRL', usdRate) => {
  if (fromCurrency === 'USD') return value;
  
  // Remove formatação e converte para número
  const numericValue = parseFloat(value.toString().replace(/[^\d.,]/g, '').replace(',', '.'));
  
  if (isNaN(numericValue)) return value;
  
  // Converte para dólar
  const usdValue = numericValue / usdRate;
  
  return usdValue;
};

// Função para formatar valores baseado no idioma
export const formatCurrency = (value, originalCurrency = 'BRL', currentLanguage, usdRate) => {
  if (currentLanguage === 'pt-BR') {
    // Formata em reais
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  } else {
    // Formata em dólares
    const usdValue = convertCurrency(value, originalCurrency, usdRate);
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(usdValue);
  }
};

// Função para formatar valores grandes (k, M, B)
export const formatLargeNumber = (value, originalCurrency = 'BRL', currentLanguage, usdRate) => {
  if (currentLanguage === 'pt-BR') {
    return value; // Mantém formato original em português
  } else {
    // Converte para dólar e formata
    const usdValue = convertCurrency(value, originalCurrency, usdRate);
    
    if (usdValue >= 1000000000) {
      return `$${(usdValue / 1000000000).toFixed(1)}B`;
    } else if (usdValue >= 1000000) {
      return `$${(usdValue / 1000000).toFixed(1)}M`;
    } else if (usdValue >= 1000) {
      return `$${(usdValue / 1000).toFixed(1)}k`;
    } else {
      return `$${usdValue.toFixed(0)}`;
    }
  }
};

// Função para atualizar dados de mercado
export const updateMarketData = async () => {
  try {
    // Simulação de API - em produção, usar APIs reais como Alpha Vantage, Yahoo Finance, etc.
    const mockData = {
      usd: (Math.random() * (5.30 - 5.10) + 5.10).toFixed(2),
      eur: (Math.random() * (5.60 - 5.40) + 5.40).toFixed(2),
      ibov: Math.floor(Math.random() * (127000 - 124000) + 124000),
      lastUpdate: new Date()
    };
    
    return mockData;
  } catch (error) {
    console.error('Erro ao atualizar dados de mercado:', error);
    return null;
  }
};

// Função para buscar cotação do dólar
export const fetchUsdRate = async () => {
  try {
    // API gratuita para cotação do dólar
    const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
    const data = await response.json();
    
    if (data.rates && data.rates.BRL) {
      return data.rates.BRL;
    }
    return 5.0; // Taxa padrão em caso de erro
  } catch (error) {
    console.log('Erro ao buscar cotação, usando taxa padrão:', error);
    return 5.0; // Taxa padrão em caso de erro
  }
};

// Função para lidar com presets de data
export const handleDatePreset = (preset) => {
  // Função para obter data no fuso de São Paulo (GMT-3)
  const getSaoPauloDate = (offset = 0) => {
    const now = new Date();
    // Criar data no fuso de São Paulo
    const spDate = new Date(now.toLocaleString("en-US", {timeZone: "America/Sao_Paulo"}));
    
    // Adicionar offset em dias se necessário
    if (offset !== 0) {
      spDate.setDate(spDate.getDate() + offset);
    }
    
    // Retornar no formato YYYY-MM-DD
    const year = spDate.getFullYear();
    const month = String(spDate.getMonth() + 1).padStart(2, '0');
    const day = String(spDate.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  };

  const today = getSaoPauloDate(0);
  let start, end;
  
  switch (preset) {
    case 'today':
      start = end = today;
      break;
    case 'yesterday':
      start = end = getSaoPauloDate(-1);
      break;
    case 'last7Days':
      start = getSaoPauloDate(-6);
      end = today;
      break;
    case 'thisMonth':
      const currentDate = new Date();
      const saoPauloOffset = -3 * 60;
      const utc = currentDate.getTime() + (currentDate.getTimezoneOffset() * 60000);
      const saoPauloDate = new Date(utc + (saoPauloOffset * 60000));
      
      const firstDay = new Date(saoPauloDate.getFullYear(), saoPauloDate.getMonth(), 1);
      start = firstDay.toISOString().split('T')[0];
      end = today;
      break;
    case 'thisQuarter':
      const spDate = new Date();
      const spUtc = spDate.getTime() + (spDate.getTimezoneOffset() * 60000);
      const spTime = new Date(spUtc + (-3 * 60 * 60000));
      
      const quarter = Math.floor(spTime.getMonth() / 3);
      const quarterStart = new Date(spTime.getFullYear(), quarter * 3, 1);
      start = quarterStart.toISOString().split('T')[0];
      end = today;
      
      console.log(`📅 TRIMESTRE DEBUG:`, {
        spDate: spDate.toISOString(),
        spTime: spTime.toISOString(),
        month: spTime.getMonth(),
        quarter: quarter,
        quarterStart: quarterStart.toISOString(),
        start: start,
        end: end
      });
      break;
    case 'thisYear':
      const yearDate = new Date();
      const yearUtc = yearDate.getTime() + (yearDate.getTimezoneOffset() * 60000);
      const yearSP = new Date(yearUtc + (-3 * 60 * 60000));
      
      const yearStart = new Date(yearSP.getFullYear(), 0, 1);
      start = yearStart.toISOString().split('T')[0];
      end = today;
      break;
    default:
      return { start: null, end: null };
  }
  
  console.log(`📅 handleDatePreset(${preset}): ${start} - ${end}`);
  
  return {
    start,
    end
  };
};



