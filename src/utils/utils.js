// Função para obter data atual no fuso horário de São Paulo
export const getTodayDateSP = () => {
  const now = new Date();
  // Converter para fuso horário de São Paulo (America/Sao_Paulo)
  const spDate = new Date(now.toLocaleString("en-US", {timeZone: "America/Sao_Paulo"}));
  return spDate.toISOString().split('T')[0];
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
  // Usar data atual no fuso horário de São Paulo
  const todaySP = new Date(new Date().toLocaleString("en-US", {timeZone: "America/Sao_Paulo"}));
  const today = todaySP;
  let start, end;
  
  switch (preset) {
    case 'today':
      start = end = today;
      break;
    case 'yesterday':
      start = end = new Date(today.getTime() - 24 * 60 * 60 * 1000);
      break;
    case 'last7Days':
      start = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      end = today;
      break;
    case 'thisMonth':
      start = new Date(today.getFullYear(), today.getMonth(), 1);
      end = today;
      break;
    case 'thisQuarter':
      const quarter = Math.floor(today.getMonth() / 3);
      start = new Date(today.getFullYear(), quarter * 3, 1);
      end = today;
      break;
    case 'thisYear':
      start = new Date(today.getFullYear(), 0, 1);
      end = today;
      break;
    default:
      return { start: null, end: null };
  }
  
  return {
    start: start.toISOString().split('T')[0],
    end: end.toISOString().split('T')[0]
  };
};



