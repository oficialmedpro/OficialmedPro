import React, { useState, useEffect } from 'react';
import './HourlyPerformanceTable.css';
import { getHourlyPerformanceData } from '../service/hourlyPerformanceService';

/**
 * 🎯 HOURLY PERFORMANCE TABLE
 * 
 * Tabela de performance por hora com estrutura vertical
 * Mostra métricas por rondas comerciais dinâmicas do banco + fechamento
 */
const HourlyPerformanceTable = ({
  startDate,
  endDate,
  selectedFunnel,
  selectedUnit,
  selectedSeller,
  selectedSellerName,
  selectedOrigin,
  t // traduções
}) => {
  const [hourlyData, setHourlyData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [summaryData, setSummaryData] = useState(null);

  // Estados para nomes dos filtros
  const [funnelName, setFunnelName] = useState('');
  const [unitName, setUnitName] = useState('');
  const [sellerName, setSellerName] = useState('');
  const [originName, setOriginName] = useState('');

  // Função para buscar nome do funil
  const fetchFunnelName = async (funnelId) => {
    if (!funnelId || funnelId === 'all') {
      setFunnelName('');
      return;
    }

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
      const supabaseSchema = import.meta.env.VITE_SUPABASE_SCHEMA || 'api';

      const response = await fetch(`${supabaseUrl}/rest/v1/funis?select=nome_funil&id_funil_sprint=eq.${funnelId}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'apikey': supabaseServiceKey,
          'Accept-Profile': supabaseSchema,
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data && data.length > 0) {
          setFunnelName(data[0].nome_funil);
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

  // Função para buscar nome da unidade
  const fetchUnitName = async (unitId) => {
    if (!unitId || unitId === 'all') {
      setUnitName('');
      return;
    }

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
      const supabaseSchema = import.meta.env.VITE_SUPABASE_SCHEMA || 'api';

      const response = await fetch(`${supabaseUrl}/rest/v1/unidades?select=unidade&codigo_sprint=eq.${encodeURIComponent(unitId)}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'apikey': supabaseServiceKey,
          'Accept-Profile': supabaseSchema,
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data && data.length > 0) {
          setUnitName(data[0].unidade);
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
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
      const supabaseSchema = import.meta.env.VITE_SUPABASE_SCHEMA || 'api';

      const response = await fetch(`${supabaseUrl}/rest/v1/vendedores?select=nome&id_sprint=eq.${parseInt(sellerId)}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'apikey': supabaseServiceKey,
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
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
      const supabaseSchema = import.meta.env.VITE_SUPABASE_SCHEMA || 'api';

      const response = await fetch(`${supabaseUrl}/rest/v1/origem_oportunidade?select=nome&id=eq.${originId}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'apikey': supabaseServiceKey,
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

  // Função para formatar o período dinâmico
  const getDynamicPeriod = () => {
    if (startDate && endDate) {
      const [startYear, startMonth, startDay] = startDate.split('-').map(Number);
      const [endYear, endMonth, endDay] = endDate.split('-').map(Number);
      const start = new Date(startYear, startMonth - 1, startDay);
      const end = new Date(endYear, endMonth - 1, endDay);

      if (startDate === endDate) {
        return start.toLocaleDateString('pt-BR');
      }

      return `${start.toLocaleDateString('pt-BR')} - ${end.toLocaleDateString('pt-BR')}`;
    }

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

  // Buscar dados por hora
  useEffect(() => {
    console.log('📊 HourlyPerformanceTable: Buscando dados por hora...');
    console.log('Parâmetros:', { startDate, endDate, selectedFunnel, selectedUnit, selectedSeller, selectedOrigin });
    
    const fetchHourlyData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const data = await getHourlyPerformanceData(
          startDate, 
          endDate, 
          selectedFunnel, 
          selectedUnit, 
          selectedSeller, 
          selectedOrigin
        );
        
        setHourlyData(data.hourlyData);
        setSummaryData(data.summaryData);
        console.log('✅ HourlyPerformanceTable: Dados carregados:', data);
      } catch (error) {
        console.error('❌ HourlyPerformanceTable: Erro ao carregar dados:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchHourlyData();
  }, [startDate, endDate, selectedFunnel, selectedUnit, selectedSeller, selectedOrigin]);

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
      const intensity = (percentage - 76) / 23;
      return `url(#gradient-yellow-green-${Math.floor(intensity * 10)})`;
    } else if (percentage >= 51) {
      const intensity = (percentage - 51) / 24;
      return `url(#gradient-orange-yellow-${Math.floor(intensity * 10)})`;
    } else if (percentage > 0) {
      const intensity = percentage / 50;
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
      const red = Math.round(239 + (255 - 239) * intensity);
      const green = Math.round(68 + (165 - 68) * intensity);
      const blue = Math.round(68 + (0 - 68) * intensity);
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
      const red = Math.round(255 + (255 - 255) * intensity);
      const green = Math.round(165 + (234 - 165) * intensity);
      const blue = Math.round(0 + (179 - 0) * intensity);
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
      const red = Math.round(255 + (16 - 255) * intensity);
      const green = Math.round(234 + (185 - 234) * intensity);
      const blue = Math.round(179 + (129 - 179) * intensity);
      gradients.push(
        <linearGradient key={`gradient-yellow-green-${i}`} id={`gradient-yellow-green-${i}`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#eab308" />
          <stop offset="100%" stopColor={`rgb(${red}, ${green}, ${blue})`} />
        </linearGradient>
      );
    }

    return gradients;
  };

  // Componente Progress Ring simplificado
  const ProgressRing = ({ progress, total, color, size = 20 }) => {
    const percentage = total > 0 ? Math.min((progress / total) * 100, 100) : 0;
    const radius = (size - 4) / 2;
    const circumference = radius * 2 * Math.PI;
    const strokeDasharray = `${circumference} ${circumference}`;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    return (
      <div className="progress-ring-container">
        <svg width={size} height={size} className="progress-ring">
          <circle
            stroke="rgba(255,255,255,0.2)"
            fill="transparent"
            strokeWidth="2"
            r={radius}
            cx={size/2}
            cy={size/2}
          />
          <circle
            stroke={color}
            fill="transparent"
            strokeWidth="2"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            r={radius}
            cx={size/2}
            cy={size/2}
            style={{
              transition: 'stroke-dashoffset 0.5s ease-in-out'
            }}
          />
        </svg>
      </div>
    );
  };

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

  // Função para obter classe CSS do gap
  const getGapClass = (gap) => {
    if (typeof gap === 'string') {
      const trimmedGap = gap.trim();
      if (trimmedGap.startsWith('+')) {
        return 'gap-positive';
      }
      if (trimmedGap.startsWith('-') || trimmedGap.startsWith('−')) {
        return 'gap-negative';
      }
      if (trimmedGap.match(/^\d/)) {
        return 'gap-positive';
      }
      return 'gap-neutral';
    }

    if (typeof gap === 'number') {
      if (gap > 0) return 'gap-positive';
      if (gap < 0) return 'gap-negative';
    }

    return 'gap-neutral';
  };

  // Obter lista de rondas ordenadas
  const getRondasOrdenadas = () => {
    console.log('🔍 HourlyPerformanceTable: hourlyData atual:', hourlyData);
    console.log('🔍 HourlyPerformanceTable: Object.values(hourlyData):', Object.values(hourlyData));
    const rondas = Object.values(hourlyData).filter(data => data.ronda_id !== 'fechamento');
    console.log('🔍 HourlyPerformanceTable: rondas filtradas:', rondas);
    const sorted = rondas.sort((a, b) => a.hora_inicio.localeCompare(b.hora_inicio));
    console.log('🔍 HourlyPerformanceTable: rondas ordenadas:', sorted);
    
    // Verificar estrutura dos dados
    if (sorted.length > 0) {
      console.log('🔍 HourlyPerformanceTable: Primeira ronda:', sorted[0]);
      console.log('🔍 HourlyPerformanceTable: Dados da primeira ronda:', {
        ronda_id: sorted[0].ronda_id,
        hora_inicio: sorted[0].hora_inicio,
        leads: sorted[0].leads,
        vendas: sorted[0].vendas,
        faturamento: sorted[0].faturamento
      });
      
      // Verificar se as propriedades existem
      console.log('🔍 HourlyPerformanceTable: Verificando propriedades:');
      console.log('  - sorted[0].leads:', sorted[0].leads);
      console.log('  - sorted[0].leads?.realizado:', sorted[0].leads?.realizado);
      console.log('  - sorted[0].leads?.meta:', sorted[0].leads?.meta);
      console.log('  - sorted[0].leads?.gap:', sorted[0].leads?.gap);
      
      // Verificar todas as chaves do objeto
      console.log('🔍 HourlyPerformanceTable: Chaves da primeira ronda:', Object.keys(sorted[0]));
    }
    
    return sorted;
  };

  if (loading) {
    return (
      <div className="hourly-performance-table-container">
        <div className="hourly-performance-loading">
          <div className="loading-spinner"></div>
          <p>Carregando dados de performance por hora...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="hourly-performance-table-container">
        <div className="hourly-performance-error">
          <div className="error-icon">❌</div>
          <div className="error-message">
            <h3>Erro ao carregar dados</h3>
            <p>{error}</p>
          </div>
        </div>
      </div>
    );
  }

  const rondasOrdenadas = getRondasOrdenadas();
  const fechamentoData = hourlyData['fechamento'];

  return (
    <div className="hourly-performance-container">
      <div className="hourly-performance-table-container">
        <div className="hourly-performance-header">
          <h2>Performance por Ronda</h2>
        </div>

        <div className="hourly-performance-table-wrapper">
          <table className="hourly-performance-table">
            <thead>
              <tr>
                <th className="indicators-column">Métricas</th>
                {rondasOrdenadas.map((ronda, index) => (
                  <th key={ronda.ronda_id} className="metric-group">
                    {ronda.ronda_nome}
                  </th>
                ))}
                {fechamentoData && (
                  <th className="metric-group sub-closing">
                    Fechamento
                  </th>
                )}
              </tr>
            </thead>
          </table>
        </div>
      </div>
    </div>
  );
};

export default HourlyPerformanceTable;