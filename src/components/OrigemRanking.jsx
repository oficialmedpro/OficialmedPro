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
  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = 10;

  // Carregar dados quando os parâmetros mudarem
  useEffect(() => {
    loadData();
  }, [startDate, endDate, selectedFunnel, selectedUnit, selectedSeller]);

  // Resetar página quando mudar a aba
  useEffect(() => {
    setCurrentPage(0);
  }, [activeTab]);

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

  // Função para paginar dados
  const getPaginatedData = (dataArray) => {
    const startIndex = currentPage * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return dataArray.slice(startIndex, endIndex);
  };

  // Função para calcular total de páginas
  const getTotalPages = (dataArray) => {
    return Math.ceil(dataArray.length / itemsPerPage);
  };

  // Funções de navegação
  const handlePrevPage = () => {
    setCurrentPage(prev => Math.max(0, prev - 1));
  };

  const handleNextPage = (totalPages) => {
    setCurrentPage(prev => Math.min(totalPages - 1, prev + 1));
  };

  const renderFaturamentoRanking = () => {
    if (loading) return <div className="origem-ranking-loading">Carregando...</div>;
    if (error) return <div className="origem-ranking-error">Erro: {error}</div>;
    if (!data.faturamento || data.faturamento.length === 0) return <div className="origem-ranking-empty">Nenhuma origem encontrada</div>;

    const paginatedData = getPaginatedData(data.faturamento);
    const totalPages = getTotalPages(data.faturamento);
    const maxValue = data.faturamento[0]?.totalValue || 1;

    return (
      <div className="origem-ranking-container faturamento">
        <div className="origem-ranking-list">
          {paginatedData.map((item, index) => (
          <div key={item.origem} className="loss-reason-item">
            <div className="loss-reason-rank">#{currentPage * itemsPerPage + index + 1}</div>
            <div className="loss-reason-content">
              <div className="loss-reason-name">{item.origem}</div>
              <div className="loss-reason-stats">
                <span className="loss-reason-count">{item.count} ganhas</span>
                <span className="loss-reason-value">
                  {formatCurrency ? formatCurrency(item.totalValue, 'BRL') : `R$ ${item.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                </span>
              </div>
              <div className="loss-reason-bar">
                <div
                  className="loss-reason-fill faturamento"
                  style={{
                    width: `${Math.min((item.totalValue / maxValue) * 100, 100)}%`
                  }}
                ></div>
              </div>
            </div>
          </div>
        ))}
        </div>

        {totalPages > 1 && (
          <div className="origem-ranking-pagination">
            <button
              className="origem-pagination-btn"
              onClick={handlePrevPage}
              disabled={currentPage === 0}
            >
              ← Anterior
            </button>
            <span className="origem-pagination-info">
              Página {currentPage + 1} de {totalPages}
            </span>
            <button
              className="origem-pagination-btn"
              onClick={() => handleNextPage(totalPages)}
              disabled={currentPage === totalPages - 1}
            >
              Próxima →
            </button>
          </div>
        )}
      </div>
    );
  };

  const renderQuantidadeRanking = () => {
    if (loading) return <div className="origem-ranking-loading">Carregando...</div>;
    if (error) return <div className="origem-ranking-error">Erro: {error}</div>;
    if (!data.quantidade || data.quantidade.length === 0) return <div className="origem-ranking-empty">Nenhuma origem encontrada</div>;

    const paginatedData = getPaginatedData(data.quantidade);
    const totalPages = getTotalPages(data.quantidade);
    const maxValue = data.quantidade[0]?.count || 1;

    return (
      <div className="origem-ranking-container quantidade">
        <div className="origem-ranking-list">
          {paginatedData.map((item, index) => (
          <div key={item.origem} className="loss-reason-item">
            <div className="loss-reason-rank">#{currentPage * itemsPerPage + index + 1}</div>
            <div className="loss-reason-content">
              <div className="loss-reason-name">{item.origem}</div>
              <div className="loss-reason-stats">
                <span className="loss-reason-count">{item.count} criadas</span>
                <span className="loss-reason-value">
                  {item.percentage ? `${item.percentage.toFixed(1)}%` : '0%'}
                </span>
              </div>
              <div className="loss-reason-bar">
                <div
                  className="loss-reason-fill quantidade"
                  style={{
                    width: `${Math.min((item.count / maxValue) * 100, 100)}%`
                  }}
                ></div>
              </div>
            </div>
          </div>
        ))}
        </div>

        {totalPages > 1 && (
          <div className="origem-ranking-pagination">
            <button
              className="origem-pagination-btn"
              onClick={handlePrevPage}
              disabled={currentPage === 0}
            >
              ← Anterior
            </button>
            <span className="origem-pagination-info">
              Página {currentPage + 1} de {totalPages}
            </span>
            <button
              className="origem-pagination-btn"
              onClick={() => handleNextPage(totalPages)}
              disabled={currentPage === totalPages - 1}
            >
              Próxima →
            </button>
          </div>
        )}
      </div>
    );
  };

  const renderPerdasRanking = () => {
    if (loading) return <div className="origem-ranking-loading">Carregando...</div>;
    if (error) return <div className="origem-ranking-error">Erro: {error}</div>;
    if (!data.perdas || data.perdas.length === 0) return <div className="origem-ranking-empty">Nenhuma origem encontrada</div>;

    const paginatedData = getPaginatedData(data.perdas);
    const totalPages = getTotalPages(data.perdas);
    const maxValue = data.perdas[0]?.count || 1;

    return (
      <div className="origem-ranking-container perdas">
        <div className="origem-ranking-list">
          {paginatedData.map((item, index) => (
          <div key={item.origem} className="loss-reason-item">
            <div className="loss-reason-rank">#{currentPage * itemsPerPage + index + 1}</div>
            <div className="loss-reason-content">
              <div className="loss-reason-name">{item.origem}</div>
              <div className="loss-reason-stats">
                <span className="loss-reason-count">{item.count} perdidas</span>
                <span className="loss-reason-value">
                  {formatCurrency ? formatCurrency(item.totalValue, 'BRL') : `R$ ${item.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                </span>
              </div>
              <div className="loss-reason-bar">
                <div
                  className="loss-reason-fill perdas"
                  style={{
                    width: `${Math.min((item.count / maxValue) * 100, 100)}%`
                  }}
                ></div>
              </div>
            </div>
          </div>
        ))}
        </div>

        {totalPages > 1 && (
          <div className="origem-ranking-pagination">
            <button
              className="origem-pagination-btn"
              onClick={handlePrevPage}
              disabled={currentPage === 0}
            >
              ← Anterior
            </button>
            <span className="origem-pagination-info">
              Página {currentPage + 1} de {totalPages}
            </span>
            <button
              className="origem-pagination-btn"
              onClick={() => handleNextPage(totalPages)}
              disabled={currentPage === totalPages - 1}
            >
              Próxima →
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="origem-ranking-header">
      <div className="origem-ranking-header-content">
        <div className="origem-ranking-title">
          <h3>
            <span className="origem-ranking-icon-main">O</span>
            Ranking de Origens
          </h3>
          <div className="origem-ranking-subtitle">
            Análise de performance por origem das oportunidades
          </div>
        </div>

        <div className="origem-ranking-tabs">
          <button
            className={`origem-ranking-tab ${activeTab === 'faturamento' ? 'active faturamento' : ''}`}
            onClick={() => setActiveTab('faturamento')}
          >
            Faturamento
          </button>
          <button
            className={`origem-ranking-tab ${activeTab === 'quantidade' ? 'active quantidade' : ''}`}
            onClick={() => setActiveTab('quantidade')}
          >
            Quantidade
          </button>
          <button
            className={`origem-ranking-tab ${activeTab === 'perdas' ? 'active perdas' : ''}`}
            onClick={() => setActiveTab('perdas')}
          >
            Perdas
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