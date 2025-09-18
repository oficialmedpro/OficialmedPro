import React, { useState, useEffect } from 'react';
import './OrigemRanking.css';
import { origemRankingService } from '../service/origemRankingService';

const OrigemRanking = ({
  formatCurrency,
  t,
  startDate,
  endDate,
  selectedFunnel,
  selectedUnit,
  selectedSeller
}) => {
  const [activeTab, setActiveTab] = useState('faturamento');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState({
    faturamento: [],
    quantidade: [],
    perdas: []
  });

  // Carregar dados quando os parâmetros mudarem
  useEffect(() => {
    loadData();
  }, [startDate, endDate, selectedFunnel, selectedUnit, selectedSeller]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('🔍 OrigemRanking: Carregando dados...', {
        startDate, endDate, selectedFunnel, selectedUnit, selectedSeller
      });

      // Carregar todos os rankings em paralelo
      console.log('🚀 OrigemRanking: Chamando services...');

      const [faturamentoResult, quantidadeResult, perdasResult] = await Promise.all([
        origemRankingService.getOrigemRankingFaturamento(startDate, endDate, selectedFunnel, selectedUnit, selectedSeller),
        origemRankingService.getOrigemRankingQuantidade(startDate, endDate, selectedFunnel, selectedUnit, selectedSeller),
        origemRankingService.getOrigemRankingPerdas(startDate, endDate, selectedFunnel, selectedUnit, selectedSeller)
      ]);

      console.log('📊 OrigemRanking: Resultados dos services:', {
        faturamento: faturamentoResult,
        quantidade: quantidadeResult,
        perdas: perdasResult
      });

      setData({
        faturamento: faturamentoResult.success ? faturamentoResult.data : [],
        quantidade: quantidadeResult.success ? quantidadeResult.data : [],
        perdas: perdasResult.success ? perdasResult.data : []
      });

      console.log('✅ OrigemRanking: Dados carregados', {
        faturamento: faturamentoResult.data?.length || 0,
        quantidade: quantidadeResult.data?.length || 0,
        perdas: perdasResult.data?.length || 0
      });

    } catch (err) {
      console.error('❌ Erro ao carregar dados do OrigemRanking:', err);
      setError(err.message || 'Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  // Função para obter cor da origem
  const getOriginColor = (origem) => {
    const originColors = {
      'Google Ads': '#4285f4',
      'Meta Ads': '#1877f2',
      'Orgânico': '#10b981',
      'WhatsApp': '#25d366',
      'Indicação': '#f59e0b',
      'Prescritor': '#8b5cf6',
      'Franquia': '#ef4444',
      'Campanha': '#06b6d4',
      'Monitoramento': '#f97316',
      'Colaborador': '#3b82f6',
      'Site': '#6366f1',
      'Farmácia Parceira': '#059669'
    };
    return originColors[origem] || '#64748b';
  };

  // Função para obter ícone da origem
  const getOriginIcon = (origem) => {
    const originIcons = {
      'Google Ads': 'G',
      'Meta Ads': 'M',
      'Orgânico': 'O',
      'WhatsApp': 'W',
      'Indicação': 'I',
      'Prescritor': 'P',
      'Franquia': 'F',
      'Campanha': 'C',
      'Monitoramento': 'M',
      'Colaborador': 'C',
      'Site': 'S',
      'Farmácia Parceira': 'F'
    };
    return originIcons[origem] || origem?.charAt(0)?.toUpperCase() || '?';
  };

  const renderFaturamentoRanking = () => {
    if (loading) return <div className="origem-ranking-loading">Carregando...</div>;
    if (error) return <div className="origem-ranking-error">Erro: {error}</div>;
    if (!data.faturamento || data.faturamento.length === 0) return <div className="origem-ranking-empty">Nenhuma origem encontrada</div>;

    const maxValue = data.faturamento[0]?.totalValue || 1;

    return (
      <div className="origem-ranking-list">
        {data.faturamento.map((item, index) => (
          <div key={item.origem} className="origem-ranking-item">
            <div className="origem-ranking-rank">#{index + 1}</div>
            <div
              className="origem-ranking-icon"
              style={{ background: getOriginColor(item.origem) }}
            >
              {getOriginIcon(item.origem)}
            </div>
            <div className="origem-ranking-content">
              <div className="origem-ranking-name">{item.origem}</div>
              <div className="origem-ranking-stats">
                <span className="origem-ranking-count">{item.count} ganhas</span>
                <span className="origem-ranking-value">
                  {formatCurrency ? formatCurrency(item.totalValue, 'BRL') : `R$ ${item.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                </span>
              </div>
              <div className="origem-ranking-bar">
                <div
                  className="origem-ranking-fill faturamento"
                  style={{
                    width: `${Math.min((item.totalValue / maxValue) * 100, 100)}%`
                  }}
                ></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderQuantidadeRanking = () => {
    if (loading) return <div className="origem-ranking-loading">Carregando...</div>;
    if (error) return <div className="origem-ranking-error">Erro: {error}</div>;
    if (!data.quantidade || data.quantidade.length === 0) return <div className="origem-ranking-empty">Nenhuma origem encontrada</div>;

    const maxValue = data.quantidade[0]?.count || 1;

    return (
      <div className="origem-ranking-list">
        {data.quantidade.map((item, index) => (
          <div key={item.origem} className="origem-ranking-item">
            <div className="origem-ranking-rank">#{index + 1}</div>
            <div
              className="origem-ranking-icon"
              style={{ background: getOriginColor(item.origem) }}
            >
              {getOriginIcon(item.origem)}
            </div>
            <div className="origem-ranking-content">
              <div className="origem-ranking-name">{item.origem}</div>
              <div className="origem-ranking-stats">
                <span className="origem-ranking-count">{item.count} criadas</span>
                <span className="origem-ranking-percentage">
                  {item.percentage ? `${item.percentage.toFixed(1)}%` : '0%'}
                </span>
              </div>
              <div className="origem-ranking-bar">
                <div
                  className="origem-ranking-fill quantidade"
                  style={{
                    width: `${Math.min((item.count / maxValue) * 100, 100)}%`
                  }}
                ></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderPerdasRanking = () => {
    if (loading) return <div className="origem-ranking-loading">Carregando...</div>;
    if (error) return <div className="origem-ranking-error">Erro: {error}</div>;
    if (!data.perdas || data.perdas.length === 0) return <div className="origem-ranking-empty">Nenhuma origem encontrada</div>;

    const maxValue = data.perdas[0]?.count || 1;

    return (
      <div className="origem-ranking-list">
        {data.perdas.map((item, index) => (
          <div key={item.origem} className="origem-ranking-item">
            <div className="origem-ranking-rank">#{index + 1}</div>
            <div
              className="origem-ranking-icon"
              style={{ background: getOriginColor(item.origem) }}
            >
              {getOriginIcon(item.origem)}
            </div>
            <div className="origem-ranking-content">
              <div className="origem-ranking-name">{item.origem}</div>
              <div className="origem-ranking-stats">
                <span className="origem-ranking-count">{item.count} perdidas</span>
                <span className="origem-ranking-value">
                  {formatCurrency ? formatCurrency(item.totalValue, 'BRL') : `R$ ${item.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                </span>
              </div>
              <div className="origem-ranking-bar">
                <div
                  className="origem-ranking-fill perdas"
                  style={{
                    width: `${Math.min((item.count / maxValue) * 100, 100)}%`
                  }}
                ></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="origem-ranking-header">
      <div className="origem-ranking-header-content">
        <div className="origem-ranking-title">
          <h3>
            <span className="origem-ranking-icon-main">📊</span>
            Ranking de Origens
          </h3>
          <div className="origem-ranking-subtitle">
            Análise de performance por origem das oportunidades
          </div>
        </div>

        <div className="origem-ranking-tabs">
          <button
            className={`origem-ranking-tab ${activeTab === 'faturamento' ? 'active' : ''}`}
            onClick={() => setActiveTab('faturamento')}
          >
            💰 Faturamento
          </button>
          <button
            className={`origem-ranking-tab ${activeTab === 'quantidade' ? 'active' : ''}`}
            onClick={() => setActiveTab('quantidade')}
          >
            📈 Quantidade
          </button>
          <button
            className={`origem-ranking-tab ${activeTab === 'perdas' ? 'active' : ''}`}
            onClick={() => setActiveTab('perdas')}
          >
            📉 Perdas
          </button>
        </div>
      </div>

      <div className="origem-ranking-content">
        {activeTab === 'faturamento' && renderFaturamentoRanking()}
        {activeTab === 'quantidade' && renderQuantidadeRanking()}
        {activeTab === 'perdas' && renderPerdasRanking()}
      </div>
    </div>
  );
};

export default OrigemRanking;