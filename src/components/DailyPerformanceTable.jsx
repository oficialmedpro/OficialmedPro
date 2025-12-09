import React, { useState, useEffect } from 'react';
import './DailyPerformanceTable.css';
import { getDailyPerformanceData } from '../service/dailyPerformanceService';
import { supabaseUrl, supabaseAnonKey, supabaseSchema } from '../config/supabase.js';

/**
 * 🎯 DAILY PERFORMANCE TABLE
 * 
 * Tabela de performance diária que mostra métricas por dia do mês
 * Estrutura similar à imagem fornecida com padrão visual da dashboard
 */
const DailyPerformanceTable = ({
  startDate,
  endDate,
  selectedFunnel,
  selectedUnit,
  selectedSeller,
  selectedSellerName,
  selectedOrigin,
  t, // traduções
  title = 'Performance Diária' // título customizado, padrão: Performance Diária
}) => {
  const [dailyData, setDailyData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [summaryData, setSummaryData] = useState(null);

  // Estados para nomes dos filtros (igual ao FunnelChart)
  const [funnelName, setFunnelName] = useState('');
  const [unitName, setUnitName] = useState('');
  const [sellerName, setSellerName] = useState('');
  const [originName, setOriginName] = useState('');

  // ⚡ OTIMIZAÇÃO: Cache para nomes dos filtros
  const filterNamesCache = React.useRef(new Map());

  // ⚡ OTIMIZAÇÃO: Função para buscar nome do funil com cache
  const fetchFunnelName = async (funnelId) => {
    if (!funnelId || funnelId === 'all') {
      setFunnelName('');
      return;
    }

    // Verificar cache primeiro
    const cacheKey = `funil_${funnelId}`;
    if (filterNamesCache.current.has(cacheKey)) {
      console.log('⚡ Cache HIT para funil:', funnelId);
      setFunnelName(filterNamesCache.current.get(cacheKey));
      return;
    }

    try {
      console.log('⚡ Cache MISS para funil:', funnelId, '- buscando...');

      const response = await fetch(`${supabaseUrl}/rest/v1/funis?select=nome_funil&id_funil_sprint=eq.${funnelId}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'apikey': supabaseAnonKey,
          'Accept-Profile': supabaseSchema,
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data && data.length > 0) {
          const nomeFunil = data[0].nome_funil;
          // Salvar no cache
          filterNamesCache.current.set(cacheKey, nomeFunil);
          setFunnelName(nomeFunil);
        } else {
          setFunnelName('');
        }
      } else {
        setFunnelName('');
      }
    } catch (error) {
      console.error('❌ Erro ao buscar nome do funil:', error);
      setFunnelName('');
    }
  };

  // ⚡ OTIMIZAÇÃO: Função para buscar nome da unidade com cache
  const fetchUnitName = async (unitId) => {
    if (!unitId || unitId === 'all') {
      setUnitName('');
      return;
    }

    // Verificar cache primeiro
    const cacheKey = `unidade_${unitId}`;
    if (filterNamesCache.current.has(cacheKey)) {
      console.log('⚡ Cache HIT para unidade:', unitId);
      setUnitName(filterNamesCache.current.get(cacheKey));
      return;
    }

    try {
      console.log('⚡ Cache MISS para unidade:', unitId, '- buscando...');

      const response = await fetch(`${supabaseUrl}/rest/v1/unidades?select=unidade&codigo_sprint=eq.${encodeURIComponent(unitId)}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'apikey': supabaseAnonKey,
          'Accept-Profile': supabaseSchema,
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data && data.length > 0) {
          const nomeUnidade = data[0].unidade;
          // Salvar no cache
          filterNamesCache.current.set(cacheKey, nomeUnidade);
          setUnitName(nomeUnidade);
        } else {
          setUnitName('');
        }
      } else {
        setUnitName('');
      }
    } catch (error) {
      console.error('❌ Erro ao buscar nome da unidade:', error);
      setUnitName('');
    }
  };

  // Função para buscar nome do vendedor
  const fetchSellerName = async (sellerId) => {
    if (!sellerId || sellerId === 'all') {
      setSellerName('');
      return;
    }

    try {

      const response = await fetch(`${supabaseUrl}/rest/v1/vendedores?select=nome&id_sprint=eq.${parseInt(sellerId)}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'apikey': supabaseAnonKey,
          'Accept-Profile': supabaseSchema,
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data && data.length > 0) {
          setSellerName(data[0].nome);
        } else {
          setSellerName('');
        }
      } else {
        setSellerName('');
      }
    } catch (error) {
      console.error('❌ Erro ao buscar nome do vendedor:', error);
      setSellerName('');
    }
  };

  // Função para buscar nome da origem
  const fetchOriginName = async (originId) => {
    if (!originId || originId === 'all') {
      setOriginName('');
      return;
    }

    try {

      const response = await fetch(`${supabaseUrl}/rest/v1/origem_oportunidade?select=nome&id=eq.${originId}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'apikey': supabaseAnonKey,
          'Accept-Profile': supabaseSchema,
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data && data.length > 0) {
          setOriginName(data[0].nome);
        } else {
          setOriginName('');
        }
      } else {
        setOriginName('');
      }
    } catch (error) {
      console.error('❌ Erro ao buscar nome da origem:', error);
      setOriginName('');
    }
  };

  // Função para formatar o período dinâmico (igual ao FunnelChart)
  const getDynamicPeriod = () => {
    if (startDate && endDate) {
      // Usar fuso horário local para formatação
      const [startYear, startMonth, startDay] = startDate.split('-').map(Number);
      const [endYear, endMonth, endDay] = endDate.split('-').map(Number);
      const start = new Date(startYear, startMonth - 1, startDay);
      const end = new Date(endYear, endMonth - 1, endDay);

      // Se for o mesmo dia
      if (startDate === endDate) {
        return start.toLocaleDateString('pt-BR');
      }

      // Se for um período
      return `${start.toLocaleDateString('pt-BR')} - ${end.toLocaleDateString('pt-BR')}`;
    }

    // Fallback: mês atual
    return new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  };

  // useEffects para buscar nomes dos filtros quando mudarem
  useEffect(() => {
    fetchFunnelName(selectedFunnel);
  }, [selectedFunnel]);

  useEffect(() => {
    fetchUnitName(selectedUnit);
  }, [selectedUnit]);

  useEffect(() => {
    fetchSellerName(selectedSeller);
  }, [selectedSeller]);

  useEffect(() => {
    fetchOriginName(selectedOrigin);
  }, [selectedOrigin]);

  // Buscar dados diários
  useEffect(() => {
    console.log('📊 DailyPerformanceTable: Buscando dados diários...');
    console.log('Parâmetros:', { startDate, endDate, selectedFunnel, selectedUnit, selectedSeller, selectedOrigin });
    
    const fetchDailyData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const data = await getDailyPerformanceData(
          startDate, 
          endDate, 
          selectedFunnel, 
          selectedUnit, 
          selectedSeller, 
          selectedOrigin
        );
        
        setDailyData(data.dailyData);
        setSummaryData(data.summaryData);
        console.log('✅ DailyPerformanceTable: Dados carregados:', data);
      } catch (error) {
        console.error('❌ DailyPerformanceTable: Erro ao carregar dados:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDailyData();
  }, [startDate, endDate, selectedFunnel, selectedUnit, selectedSeller, selectedOrigin]);

  // Gerar array de dias baseado no período selecionado
  const generateDaysOfPeriod = () => {
    const today = new Date();
    let periodStart, periodEnd;

    if (startDate && endDate) {
      // Usar período fornecido - forçar timezone local
      const [startYear, startMonth, startDay] = startDate.split('-').map(Number);
      const [endYear, endMonth, endDay] = endDate.split('-').map(Number);
      periodStart = new Date(startYear, startMonth - 1, startDay);
      periodEnd = new Date(endYear, endMonth - 1, endDay);
    } else {
      // Fallback: mês atual
      periodStart = new Date(today.getFullYear(), today.getMonth(), 1);
      periodEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    }

    const days = [];
    const current = new Date(periodStart);

    while (current <= periodEnd) {
      days.push({
        date: new Date(current),
        day: current.getDate(),
        month: current.getMonth() + 1,
        year: current.getFullYear(),
        isToday: current.toDateString() === today.toDateString(),
        isWeekend: current.getDay() === 0 || current.getDay() === 6
      });
      current.setDate(current.getDate() + 1);
    }

    return days;
  };

  const days = generateDaysOfPeriod();

  // Função para calcular porcentagem do realizado em relação à meta
  const calculatePercentage = (realizado, meta) => {
    if (!meta || meta === 0) return 0;
    return Math.min((realizado / meta) * 100, 150); // Limita a 150% para visualização
  };

  // Função para calcular porcentagem do gap
  const calculateGapPercentage = (gap, meta) => {
    if (!meta || meta === 0) return 0;
    return Math.abs((gap / meta) * 100);
  };

  // Função para extrair valor numérico do gap formatado
  const extractGapValue = (gapString) => {
    if (typeof gapString === 'number') return gapString;
    if (typeof gapString !== 'string') return 0;

    // Remove símbolos e extrai o primeiro número
    const match = gapString.match(/^([+-]?)([0-9,\.]+)/);
    if (match) {
      const sign = match[1] === '-' ? -1 : 1;
      const value = parseFloat(match[2].replace(/,/g, ''));
      return sign * value;
    }
    return 0;
  };

  // Função para obter cor baseada na porcentagem
  const getProgressColor = (percentage) => {
    if (percentage >= 100) {
      return '#10b981'; // Verde total para 100%+
    } else if (percentage >= 76) {
      // Gradiente amarelo para verde (76-99%)
      const intensity = (percentage - 76) / 23; // 0 a 1
      return `url(#gradient-yellow-green-${Math.floor(intensity * 10)})`;
    } else if (percentage >= 51) {
      // Gradiente laranja para amarelo (51-75%)
      const intensity = (percentage - 51) / 24; // 0 a 1
      return `url(#gradient-orange-yellow-${Math.floor(intensity * 10)})`;
    } else if (percentage > 0) {
      // Gradiente vermelho para laranja (1-50%)
      const intensity = percentage / 50; // 0 a 1
      return `url(#gradient-red-orange-${Math.floor(intensity * 10)})`;
    } else {
      return '#6b7280'; // Cinza para 0%
    }
  };

  // Função para gerar gradientes SVG
  const generateGradients = () => {
    const gradients = [];
    
    // Gradientes vermelho para laranja (0-50%)
    for (let i = 0; i <= 10; i++) {
      const intensity = i / 10;
      const red = Math.round(239 + (255 - 239) * intensity); // 239 (vermelho) para 255 (laranja)
      const green = Math.round(68 + (165 - 68) * intensity); // 68 para 165
      const blue = Math.round(68 + (0 - 68) * intensity); // 68 para 0
      gradients.push(
        <linearGradient key={`gradient-red-orange-${i}`} id={`gradient-red-orange-${i}`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#ef4444" />
          <stop offset="100%" stopColor={`rgb(${red}, ${green}, ${blue})`} />
        </linearGradient>
      );
    }

    // Gradientes laranja para amarelo (51-75%)
    for (let i = 0; i <= 10; i++) {
      const intensity = i / 10;
      const red = Math.round(255 + (255 - 255) * intensity); // 255 (laranja) para 255 (amarelo)
      const green = Math.round(165 + (234 - 165) * intensity); // 165 para 234
      const blue = Math.round(0 + (179 - 0) * intensity); // 0 para 179
      gradients.push(
        <linearGradient key={`gradient-orange-yellow-${i}`} id={`gradient-orange-yellow-${i}`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#ffa500" />
          <stop offset="100%" stopColor={`rgb(${red}, ${green}, ${blue})`} />
        </linearGradient>
      );
    }

    // Gradientes amarelo para verde (76-99%)
    for (let i = 0; i <= 10; i++) {
      const intensity = i / 10;
      const red = Math.round(255 + (16 - 255) * intensity); // 255 (amarelo) para 16 (verde)
      const green = Math.round(234 + (185 - 234) * intensity); // 234 para 185
      const blue = Math.round(179 + (129 - 179) * intensity); // 179 para 129
      gradients.push(
        <linearGradient key={`gradient-yellow-green-${i}`} id={`gradient-yellow-green-${i}`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#eab308" />
          <stop offset="100%" stopColor={`rgb(${red}, ${green}, ${blue})`} />
        </linearGradient>
      );
    }

    return gradients;
  };

  // Componente Progress Ring para Leads
  const ProgressRing = ({ type, realizado, meta, gap }) => {
    let percentage = 0;
    let strokeColor = '#3b82f6';

    if (type === 'meta') {
      percentage = 100;
      strokeColor = '#6b7280'; // cinza para meta
    } else if (type === 'realizado') {
      percentage = calculatePercentage(realizado, meta);
      strokeColor = getProgressColor(percentage);
    } else if (type === 'gap') {
      const gapValue = extractGapValue(gap);
      percentage = Math.min(calculateGapPercentage(gapValue, meta), 100);
      strokeColor = gapValue > 0 ? '#10b981' : '#ef4444';
    }

    const radius = 14;
    const strokeWidth = 3;
    const normalizedRadius = radius - strokeWidth * 0.5;
    const circumference = normalizedRadius * 2 * Math.PI;
    const strokeDasharray = `${circumference} ${circumference}`;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    return (
      <div className="progress-ring-container">
        <svg width="32" height="32" className="progress-ring">
          <defs>
            {generateGradients()}
          </defs>
          {/* Círculo de fundo */}
          <circle
            stroke="rgba(255,255,255,0.1)"
            fill="transparent"
            strokeWidth={strokeWidth}
            r={normalizedRadius}
            cx="16"
            cy="16"
          />
          {/* Círculo de progresso */}
          <circle
            stroke={strokeColor}
            fill="transparent"
            strokeWidth={strokeWidth}
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            r={normalizedRadius}
            cx="16"
            cy="16"
            style={{
              transition: 'stroke-dashoffset 0.5s ease-in-out'
            }}
          />
        </svg>
      </div>
    );
  };

  // Componente Gauge/Velocímetro para Vendas
  const GaugeChart = ({ type, realizado, meta, gap }) => {
    let percentage = 0;
    let needleColor = '#3b82f6';

    if (type === 'meta') {
      percentage = 100;
      needleColor = '#6b7280';
    } else if (type === 'realizado') {
      percentage = Math.min(calculatePercentage(realizado, meta), 150); // Máximo 150%
      needleColor = percentage >= 100 ? '#10b981' : percentage >= 75 ? '#f59e0b' : '#3b82f6';
    } else if (type === 'gap') {
      const gapValue = extractGapValue(gap);
      percentage = Math.min(calculateGapPercentage(gapValue, meta), 150);
      needleColor = gapValue > 0 ? '#10b981' : '#ef4444';
    }

    // Cálculo do ângulo do ponteiro (semicírculo de 180 graus)
    const angle = (percentage / 100) * 180 - 90; // -90 para começar na esquerda

    return (
      <div className="gauge-container">
        <svg width="32" height="20" className="gauge-chart">
          {/* Arco de fundo */}
          <path
            d="M 4 16 A 12 12 0 0 1 28 16"
            stroke="rgba(255,255,255,0.1)"
            strokeWidth="3"
            fill="none"
          />
          {/* Arco colorido baseado na performance */}
          <path
            d="M 4 16 A 12 12 0 0 1 28 16"
            stroke={percentage >= 100 ? '#10b981' : percentage >= 75 ? '#f59e0b' : '#ef4444'}
            strokeWidth="3"
            fill="none"
            strokeDasharray={`${(percentage / 100) * 37.7} 37.7`}
            style={{ transition: 'stroke-dasharray 0.5s ease-in-out' }}
          />
          {/* Ponteiro */}
          <line
            x1="16"
            y1="16"
            x2={16 + Math.cos((angle * Math.PI) / 180) * 10}
            y2={16 + Math.sin((angle * Math.PI) / 180) * 10}
            stroke={needleColor}
            strokeWidth="2"
            strokeLinecap="round"
            style={{ transition: 'all 0.5s ease-in-out' }}
          />
          {/* Centro do ponteiro */}
          <circle cx="16" cy="16" r="1.5" fill={needleColor} />
        </svg>
      </div>
    );
  };

  // Componente para barra vertical de métrica (mantido para outras colunas)
  const VerticalBar = ({ type, realizado, meta, gap }) => {
    let percentage = 0;
    let barColor = '#3b82f6'; // azul padrão

    if (type === 'meta') {
      percentage = 100; // Meta sempre 100%
      barColor = '#3b82f6';
    } else if (type === 'realizado') {
      percentage = calculatePercentage(realizado, meta);
      barColor = '#3b82f6';
    } else if (type === 'gap') {
      const gapValue = extractGapValue(gap);
      percentage = calculateGapPercentage(gapValue, meta);
      barColor = gapValue > 0 ? '#10b981' : '#ef4444'; // verde se positivo, vermelho se negativo
    }

    return (
      <div className="vertical-bar-container">
        <div
          className="vertical-bar"
          style={{
            height: `${Math.min(percentage / 100 * 50, 50)}px`,
            backgroundColor: barColor
          }}
        />
      </div>
    );
  };

  // Função para obter nome do dia da semana em português abreviado
  const getDayOfWeekShort = (date) => {
    const dayNames = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];
    return dayNames[date.getDay()];
  };

  // Paginação por blocos de 7 dias
  const rowsPerPage = 7;
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(days.length / rowsPerPage));
  const pageStartIndex = (currentPage - 1) * rowsPerPage;
  const pageEndIndex = pageStartIndex + rowsPerPage;
  const pagedDays = days.slice(pageStartIndex, pageEndIndex);

  const goPrev = () => setCurrentPage((p) => Math.max(1, p - 1));
  const goNext = () => setCurrentPage((p) => Math.min(totalPages, p + 1));

  // Função para formatar moeda
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value || 0);
  };

  // Função para formatar percentual
  const formatPercentage = (value) => {
    return `${Math.round(value || 0)}%`;
  };

  // Função para calcular gap
  const calculateGap = (realizado, meta) => {
    return (realizado || 0) - (meta || 0);
  };

  // Função para obter classe CSS do gap
  const getGapClass = (gap) => {
    // Para gaps já formatados como string (faturamento, ticket médio, leads, vendas)
    if (typeof gap === 'string') {
      const trimmedGap = gap.trim();

      if (trimmedGap.startsWith('+')) {
        return 'gap-positive';
      }
      if (trimmedGap.startsWith('-') || trimmedGap.startsWith('−')) {
        return 'gap-negative';
      }
      // Verificar se começa com número positivo sem sinal (ex: "238 (+7%)")
      if (trimmedGap.match(/^\d/)) {
        return 'gap-positive';
      }
      return 'gap-neutral';
    }

    // Para gaps numéricos (conversão)
    if (typeof gap === 'number') {
      if (gap > 0) return 'gap-positive';
      if (gap < 0) return 'gap-negative';
    }

    return 'gap-neutral';
  };

  if (loading) {
    return (
      <div className="daily-performance-table-container">
        <div className="daily-performance-loading">
          <div className="loading-spinner"></div>
          <p>Carregando dados de performance...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="daily-performance-table-container">
        <div className="daily-performance-error">
          <div className="error-icon">❌</div>
          <div className="error-message">
            <h3>Erro ao carregar dados</h3>
            <p>{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="main-chart">
      <div className="daily-performance-table-container">
      <div className="daily-performance-header">
        <h2>{title}</h2>

        {/* Seção de Filtros Aplicados (igual ao FunnelChart) */}
        <div className="fc-applied-filters">
          <div className="fc-applied-filters-content">
            {/* Funil */}
            <div className="fc-filter-item">
              <span className="fc-filter-label">Funil:</span>
              <span className="fc-filter-value">
                {funnelName || (selectedFunnel === 'all' ? 'Todos os Funis' : `Funil ${selectedFunnel}`)}
              </span>
            </div>

            {/* Unidade */}
            <div className="fc-filter-item">
              <span className="fc-filter-label">Unidade:</span>
              <span className="fc-filter-value">
                {selectedUnit === 'all' ? 'Todas as Unidades' : (unitName || selectedUnit)}
              </span>
            </div>

            {/* Vendedor */}
            <div className="fc-filter-item">
              <span className="fc-filter-label">Vendedor:</span>
              <span className="fc-filter-value">
                {selectedSeller === 'all' ? 'Todos os Vendedores' : (sellerName || selectedSeller)}
              </span>
            </div>

            {/* Origem */}
            <div className="fc-filter-item">
              <span className="fc-filter-label">Origem:</span>
              <span className="fc-filter-value">
                {!selectedOrigin || selectedOrigin === 'all' ? 'Todas as Origens' : (originName || selectedOrigin)}
              </span>
            </div>

            {/* Período */}
            <div className="fc-filter-item">
              <span className="fc-filter-label">Período:</span>
              <span className="fc-filter-value">{getDynamicPeriod()}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="daily-performance-table-wrapper">
        <table className="daily-performance-table">
          <colgroup>
            <col style={{ width: '160px' }} />
            {/* Leads */}
            <col style={{ width: '80px' }} />
            <col style={{ width: '80px' }} />
            <col style={{ width: '80px' }} />
            {/* Vendas */}
            <col style={{ width: '80px' }} />
            <col style={{ width: '80px' }} />
            <col style={{ width: '80px' }} />
            {/* Faturamento */}
            <col style={{ width: '140px' }} />
            <col style={{ width: '140px' }} />
            <col style={{ width: '140px' }} />
            {/* Conversão */}
            <col style={{ width: '90px' }} />
            <col style={{ width: '90px' }} />
            <col style={{ width: '90px' }} />
            {/* Ticket Médio */}
            <col style={{ width: '120px' }} />
            <col style={{ width: '120px' }} />
            <col style={{ width: '120px' }} />
          </colgroup>
          <thead>
            <tr className="header-row-groups">
              <th rowSpan="2" className="indicators-column">Indicadores / Data 2025</th>
              <th colSpan="3" className="metric-group metric-leads">Leads</th>
              <th colSpan="3" className="metric-group metric-vendas">N° Vendas</th>
              <th colSpan="3" className="metric-group metric-faturamento">Faturamento</th>
              <th colSpan="3" className="metric-group metric-conversao">Taxa Conversão</th>
              <th colSpan="3" className="metric-group metric-ticket">Ticket Médio</th>
            </tr>
            <tr className="header-row-sub">
              <th className="subheader sub-leads">Realizado</th>
              <th className="subheader sub-leads">Meta</th>
              <th className="subheader sub-leads">Gap</th>
              <th className="subheader sub-vendas">Realizado</th>
              <th className="subheader sub-vendas">Meta</th>
              <th className="subheader sub-vendas">Gap</th>
              <th className="subheader sub-faturamento">Realizado</th>
              <th className="subheader sub-faturamento">Meta</th>
              <th className="subheader sub-faturamento">Gap</th>
              <th className="subheader sub-conversao">Realizado</th>
              <th className="subheader sub-conversao">Meta</th>
              <th className="subheader sub-conversao">Gap</th>
              <th className="subheader sub-ticket">Realizado</th>
              <th className="subheader sub-ticket">Meta</th>
              <th className="subheader sub-ticket">Gap</th>
            </tr>
          </thead>
          <tbody>
            {/* Linha de resumo do mês */}
            {summaryData && (
              <tr className="summary-row">
                <td className="indicators-cell summary-indicator">
                  {(() => {
                    let periodLabel;

                    if (startDate && endDate) {
                      const [startYear, startMonth, startDay] = startDate.split('-').map(Number);
                      const [endYear, endMonth, endDay] = endDate.split('-').map(Number);
                      const startDateObj = new Date(startYear, startMonth - 1, startDay);
                      const endDateObj = new Date(endYear, endMonth - 1, endDay);

                      if (startMonth === endMonth && startYear === endYear) {
                        // Mesmo mês
                        const monthName = startDateObj.toLocaleDateString('pt-BR', { month: 'long' });
                        periodLabel = monthName.charAt(0).toUpperCase() + monthName.slice(1);
                      } else {
                        // Período customizado
                        periodLabel = `${startDateObj.toLocaleDateString('pt-BR', { month: 'short' })} a ${endDateObj.toLocaleDateString('pt-BR', { month: 'short' })}`;
                      }
                    } else {
                      // Mês atual (fallback)
                      const monthName = new Date().toLocaleDateString('pt-BR', { month: 'long' });
                      periodLabel = monthName.charAt(0).toUpperCase() + monthName.slice(1);
                    }

                    return selectedSeller && selectedSeller !== 'all' && selectedSellerName
                      ? (
                          <div>
                            <div>{periodLabel}</div>
                            <div className="seller-name">{selectedSellerName}</div>
                          </div>
                        )
                      : periodLabel;
                  })()}
                </td>
                <td className="metric-cell">
                  <div className="metric-cell-content">
                    <ProgressRing type="realizado" realizado={summaryData.leads.realizado} meta={summaryData.leads.meta} />
                    {summaryData.leads.realizado}
                  </div>
                </td>
                <td className="metric-cell">
                  {summaryData.leads.meta}
                </td>
                <td className={`metric-cell gap-cell ${getGapClass(summaryData.leads.gap)}`}>
                  {summaryData.leads.gap}
                </td>
                <td className="metric-cell">
                  <div className="metric-cell-content">
                    <ProgressRing type="realizado" realizado={summaryData.vendas.realizado} meta={summaryData.vendas.meta} />
                    {summaryData.vendas.realizado}
                  </div>
                </td>
                <td className="metric-cell">
                  {summaryData.vendas.meta}
                </td>
                <td className={`metric-cell gap-cell ${getGapClass(summaryData.vendas.gap)}`}>
                  {summaryData.vendas.gap}
                </td>
                <td className="metric-cell">
                  <div className="metric-cell-content">
                    <ProgressRing type="realizado" realizado={summaryData.faturamento.realizado} meta={summaryData.faturamento.meta} />
                    {formatCurrency(summaryData.faturamento.realizado)}
                  </div>
                </td>
                <td className="metric-cell">
                  {formatCurrency(summaryData.faturamento.meta)}
                </td>
                <td className={`metric-cell gap-cell ${getGapClass(summaryData.faturamento.gap)}`}>
                  {summaryData.faturamento.gap}
                </td>
                <td className="metric-cell">
                  <div className="metric-cell-content">
                    <ProgressRing type="realizado" realizado={summaryData.conversao.realizado} meta={summaryData.conversao.meta} />
                    {formatPercentage(summaryData.conversao.realizado)}
                  </div>
                </td>
                <td className="metric-cell">
                  {formatPercentage(summaryData.conversao.meta)}
                </td>
                <td className={`metric-cell gap-cell ${getGapClass(summaryData.conversao.gap)}`}>
                  {summaryData.conversao.gap > 0 ? '+' : ''}{formatPercentage(summaryData.conversao.gap)}
                </td>
                <td className="metric-cell">
                  <div className="metric-cell-content">
                    <ProgressRing type="realizado" realizado={summaryData.ticketMedio.realizado} meta={summaryData.ticketMedio.meta} />
                    {formatCurrency(summaryData.ticketMedio.realizado)}
                  </div>
                </td>
                <td className="metric-cell">
                  {formatCurrency(summaryData.ticketMedio.meta)}
                </td>
                <td className={`metric-cell gap-cell ${getGapClass(summaryData.ticketMedio.gap)}`}>
                  {summaryData.ticketMedio.gap}
                </td>
              </tr>
            )}

            {/* Linhas dos dias */}
            {pagedDays.map((day, index) => {
              const dayKey = day.date.toLocaleDateString('sv-SE');
              const dayData = dailyData.find(d => {
                const found = d.date === dayKey;
                if (dayKey === '2025-09-16') { // Debug para hoje
                  console.log('🔍 DEBUG HOJE:', {
                    dayKey,
                    searchingFor: dayKey,
                    foundData: found,
                    dailyDataSample: dailyData.slice(0, 3),
                    allDatesInDailyData: dailyData.map(d => d.date)
                  });
                }
                return found;
              }) || {
                leads: { realizado: 0, meta: 0, gap: 0 },
                vendas: { realizado: 0, meta: 0, gap: 0 },
                faturamento: { realizado: 0, meta: 0, gap: 0 },
                conversao: { realizado: 0, meta: 0, gap: 0 },
                ticketMedio: { realizado: 0, meta: 0, gap: 0 }
              };

              return (
                <tr 
                  key={day.date.toISOString()} 
                  className={`day-row ${day.isToday ? 'today-row' : ''} ${day.isWeekend ? 'weekend-row' : ''}`}
                >
                  <td className="indicators-cell day-indicator">
                    <div className="day-date">{day.day.toString().padStart(2, '0')}/{day.month.toString().padStart(2, '0')}/{day.year}</div>
                    <div className="day-week">{getDayOfWeekShort(day.date)}</div>
                  </td>
                  
                  {/* Leads */}
                  <td className="metric-cell">
                    <div className="metric-cell-content">
                      <ProgressRing type="realizado" realizado={dayData.leads.realizado} meta={dayData.leads.meta} />
                      {dayData.leads.realizado}
                    </div>
                  </td>
                  <td className="metric-cell">{dayData.leads.meta}</td>
                  <td className={`metric-cell gap-cell ${getGapClass(dayData.leads.gap)}`}>
                    {dayData.leads.gap}
                  </td>

                  {/* Vendas */}
                  <td className="metric-cell">
                    <div className="metric-cell-content">
                      <ProgressRing type="realizado" realizado={dayData.vendas.realizado} meta={dayData.vendas.meta} />
                      {dayData.vendas.realizado}
                    </div>
                  </td>
                  <td className="metric-cell">{dayData.vendas.meta}</td>
                  <td className={`metric-cell gap-cell ${getGapClass(dayData.vendas.gap)}`}>
                    {dayData.vendas.gap}
                  </td>
                  
                  {/* Faturamento */}
                  <td className="metric-cell">
                    <div className="metric-cell-content">
                      <ProgressRing type="realizado" realizado={dayData.faturamento.realizado} meta={dayData.faturamento.meta} />
                      {formatCurrency(dayData.faturamento.realizado)}
                    </div>
                  </td>
                  <td className="metric-cell">{formatCurrency(dayData.faturamento.meta)}</td>
                  <td className={`metric-cell gap-cell ${getGapClass(dayData.faturamento.gap)}`}>
                    {dayData.faturamento.gap}
                  </td>

                  {/* Taxa Conversão */}
                  <td className="metric-cell">
                    <div className="metric-cell-content">
                      <ProgressRing type="realizado" realizado={dayData.conversao.realizado} meta={dayData.conversao.meta} />
                      {formatPercentage(dayData.conversao.realizado)}
                    </div>
                  </td>
                  <td className="metric-cell">{formatPercentage(dayData.conversao.meta)}</td>
                  <td className={`metric-cell gap-cell ${getGapClass(dayData.conversao.gap)}`}>
                    {dayData.conversao.gap > 0 ? '+' : ''}{formatPercentage(dayData.conversao.gap)}
                  </td>

                  {/* Ticket Médio */}
                  <td className="metric-cell">
                    <div className="metric-cell-content">
                      <ProgressRing type="realizado" realizado={dayData.ticketMedio.realizado} meta={dayData.ticketMedio.meta} />
                      {formatCurrency(dayData.ticketMedio.realizado)}
                    </div>
                  </td>
                  <td className="metric-cell">{formatCurrency(dayData.ticketMedio.meta)}</td>
                  <td className={`metric-cell gap-cell ${getGapClass(dayData.ticketMedio.gap)}`}>
                    {dayData.ticketMedio.gap}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div className="daily-performance-pager">
          <button className="pager-btn" onClick={goPrev} disabled={currentPage <= 1}>« Anterior</button>
          <span className="pager-info">{currentPage} / {totalPages}</span>
          <button className="pager-btn" onClick={goNext} disabled={currentPage >= totalPages}>Próximo »</button>
        </div>
      </div>
      </div>
    </div>
  );
};

export default DailyPerformanceTable;
