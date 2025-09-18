import React, { useState, useEffect } from 'react';
import './SellerRankingReal.css';
import { getSellerRankingData, getSellerRankingFilterNames } from '../service/sellerRankingService';

/**
 * 🏆 SELLER RANKING REAL
 *
 * Componente para exibir ranking de vendedores por oportunidades ganhas
 * com dados reais do banco, agrupados por user_id e ordenados por quantidade
 */
const SellerRankingReal = ({
  formatCurrency,
  t,
  startDate,
  endDate,
  selectedFunnel,
  selectedUnit,
  selectedSeller,
  selectedOrigin
}) => {
  // Estados do componente
  const [sellerData, setSellerData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [activeTab, setActiveTab] = useState('valor'); // 'valor', 'ticket', 'abertas', 'perdidas'
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 0,
    totalItems: 0,
    pageSize: 8,
    hasNext: false,
    hasPrev: false
  });

  // Estados para nomes dos filtros
  const [filterNames, setFilterNames] = useState({
    funnelName: '',
    unitName: '',
    sellerName: '',
    originName: ''
  });

  const sellersPerPage = 8;

  // Função para buscar dados do ranking
  const fetchSellerRanking = async (page = 1, rankingType = 'valor') => {
    try {
      setLoading(true);
      setError(null);

      console.log('🏆 SellerRankingReal: Buscando dados...', {
        startDate,
        endDate,
        selectedFunnel,
        selectedUnit,
        selectedSeller,
        selectedOrigin,
        page,
        sellersPerPage,
        rankingType
      });

      // Primeira tentativa: com filtros específicos
      let result = await getSellerRankingData(
        startDate,
        endDate,
        selectedFunnel,
        selectedUnit,
        selectedSeller,
        selectedOrigin,
        page,
        sellersPerPage,
        rankingType
      );

      // Se não encontrou dados, tentar com período expandido (últimos 30 dias)
      if (result.pagination.totalItems === 0) {
        console.log('⚠️ SellerRankingReal: Nenhum dado encontrado, expandindo período para 30 dias...');

        const today = new Date();
        const thirtyDaysAgo = new Date(today);
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const expandedStartDate = thirtyDaysAgo.toISOString().split('T')[0];
        const expandedEndDate = today.toISOString().split('T')[0];

        result = await getSellerRankingData(
          expandedStartDate,
          expandedEndDate,
          selectedFunnel,
          selectedUnit,
          selectedSeller,
          selectedOrigin,
          page,
          sellersPerPage,
          rankingType
        );

        console.log('🔄 SellerRankingReal: Tentativa com período expandido:', result);
      }

      setSellerData(result.data);
      setPagination(result.pagination);
      console.log('✅ SellerRankingReal: Dados carregados:', {
        dataLength: result.data.length,
        pagination: result.pagination,
        currentPage: page
      });

    } catch (error) {
      console.error('❌ SellerRankingReal: Erro ao carregar dados:', error);
      setError(error.message);
      setSellerData([]);
    } finally {
      setLoading(false);
    }
  };

  // Função para buscar nomes dos filtros
  const fetchFilterNames = async () => {
    try {
      const names = await getSellerRankingFilterNames(
        selectedFunnel,
        selectedUnit,
        selectedSeller,
        selectedOrigin
      );
      setFilterNames(names);
    } catch (error) {
      console.error('❌ SellerRankingReal: Erro ao buscar nomes dos filtros:', error);
    }
  };

  // Efeito para buscar dados quando filtros mudarem
  useEffect(() => {
    console.log('🔄 SellerRankingReal: Filtros alterados, recarregando dados...');
    setCurrentPage(1); // Reset para primeira página
    fetchSellerRanking(1, activeTab);
    fetchFilterNames();
  }, [startDate, endDate, selectedFunnel, selectedUnit, selectedSeller, selectedOrigin, activeTab]);

  // Efeito para buscar dados quando página mudar
  useEffect(() => {
    fetchSellerRanking(currentPage, activeTab);
  }, [currentPage, activeTab]);

  // Função para mudar de página
  const changePage = (page) => {
    console.log('🔄 SellerRankingReal: Mudando para página:', page, 'de', pagination.totalPages);
    if (page >= 1 && page <= pagination.totalPages) {
      setCurrentPage(page);
    } else {
      console.warn('⚠️ SellerRankingReal: Página inválida:', page);
    }
  };

  // Função para ir para próxima página
  const nextPage = () => {
    console.log('➡️ SellerRankingReal: Próxima página - hasNext:', pagination.hasNext, 'currentPage:', currentPage);
    if (pagination.hasNext) {
      setCurrentPage(currentPage + 1);
    }
  };

  // Função para ir para página anterior
  const prevPage = () => {
    console.log('⬅️ SellerRankingReal: Página anterior - hasPrev:', pagination.hasPrev, 'currentPage:', currentPage);
    if (pagination.hasPrev) {
      setCurrentPage(currentPage - 1);
    }
  };

  // Função para renderizar o badge de ranking
  const renderRankBadge = (seller) => {
    if (seller.rank === 1) {
      return <span className="source-percent medal-gold">1º</span>;
    } else if (seller.rank === 2) {
      return <span className="source-percent medal-silver">2º</span>;
    } else if (seller.rank === 3) {
      return <span className="source-percent medal-bronze">3º</span>;
    } else if (seller.rank === pagination.totalItems) {
      return <span className="source-percent last-place">{seller.rank}º</span>;
    } else {
      return <span className="source-percent">{seller.rank}º</span>;
    }
  };

  // Função para renderizar a classe da linha baseada no ranking
  const getRowClass = (seller) => {
    if (seller.rank === 1) return 'source-line medal-gold';
    if (seller.rank === 2) return 'source-line medal-silver';
    if (seller.rank === 3) return 'source-line medal-bronze';
    if (seller.rank === pagination.totalItems) return 'source-line last-place';
    return 'source-line';
  };

  // Renderizar estado de loading
  if (loading) {
    return (
      <div className="metric-card-main">
        <div className="metric-card-header">
          <div className="platform-icon seller-icon">V</div>
          <span className="platform-name">Ranking de Vendedores</span>
        </div>
        <div className="seller-loading">
          <div className="loading-spinner"></div>
          <p>Carregando ranking...</p>
        </div>
      </div>
    );
  }

  // Renderizar estado de erro
  if (error) {
    return (
      <div className="metric-card-main">
        <div className="metric-card-header">
          <div className="platform-icon seller-icon">V</div>
          <span className="platform-name">Ranking de Vendedores</span>
        </div>
        <div className="seller-error">
          <div className="error-icon">❌</div>
          <div className="error-message">
            <h3>Erro ao carregar ranking</h3>
            <p>{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="metric-card-main">
      <div className="metric-card-header">
        <div className="platform-icon seller-icon">V</div>
        <span className="platform-name">Ranking de Vendedores</span>
      </div>
      
      {/* Abas de ranking */}
      <div className="seller-tabs">
        <button
          className={`seller-tab ${activeTab === 'valor' ? 'active' : ''}`}
          onClick={() => setActiveTab('valor')}
        >
          Por Valor
        </button>
        <button
          className={`seller-tab ${activeTab === 'ticket' ? 'active ticket' : ''}`}
          onClick={() => setActiveTab('ticket')}
        >
          Por Ticket Médio
        </button>
        <button
          className={`seller-tab ${activeTab === 'abertas' ? 'active abertas' : ''}`}
          onClick={() => setActiveTab('abertas')}
        >
          Oportunidades Abertas
        </button>
        <button
          className={`seller-tab ${activeTab === 'perdidas' ? 'active perdidas' : ''}`}
          onClick={() => setActiveTab('perdidas')}
        >
          Oportunidades Perdidas
        </button>
      </div>
      
      <div className="sources-list">
        {sellerData.length === 0 ? (
          <div className="seller-empty">
            <p>Nenhum vendedor encontrado para os filtros selecionados.</p>
          </div>
        ) : (
          sellerData.map((seller) => (
            <div key={seller.userId} className={getRowClass(seller)}>
              <div className="source-content">
                <div className="seller-info">
                  <div className="seller-header">
                    <div className="seller-rank">
                      {renderRankBadge(seller)}
                    </div>
                    <span className="source-name">{seller.name}</span>
                    <span className={`seller-total ${activeTab === 'perdidas' ? 'seller-total-red' : ''}`}>
                      {activeTab === 'ticket' 
                        ? formatCurrency(seller.totalValue / seller.opportunityCount)
                        : formatCurrency(seller.totalValue)
                      }
                    </span>
                  </div>
                  <div className="seller-metrics">
                    <div className="metric-row">
                      <div className="metric-col">
                        <span className="metric-label">Oportunidades:</span>
                        <span className="metric-value">{seller.opportunityCount}</span>
                      </div>
                      <div className="metric-col">
                        <span className="metric-label">
                          {activeTab === 'ticket' ? 'Valor Total:' : 'Ticket Médio:'}
                        </span>
                        <span className="metric-value">
                          {activeTab === 'ticket' 
                            ? formatCurrency(seller.totalValue)
                            : formatCurrency(seller.totalValue / seller.opportunityCount)
                          }
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="source-color-bar" style={{background: '#3b82f6', width: `${seller.progress}%`}}></div>
            </div>
          ))
        )}
      </div>

      {/* Paginação */}
      {pagination.totalPages > 1 && (
        <div className="pagination-container">
          <div className="pagination-info">
            Página {pagination.currentPage} de {pagination.totalPages} ({pagination.totalItems} vendedores)
          </div>
          <div className="pagination-controls">
            <button 
              className="pagination-btn" 
              onClick={prevPage}
              disabled={!pagination.hasPrev}
            >
              ← Anterior
            </button>
            
            <div className="page-numbers">
              {Array.from({ length: Math.min(pagination.totalPages, 10) }, (_, index) => {
                let pageNumber;
                if (pagination.totalPages <= 10) {
                  pageNumber = index + 1;
                } else {
                  const start = Math.max(1, pagination.currentPage - 5);
                  const end = Math.min(pagination.totalPages, start + 9);
                  pageNumber = start + index;
                  if (pageNumber > end) return null;
                }

                return (
                  <button
                    key={pageNumber}
                    className={`page-btn ${pagination.currentPage === pageNumber ? 'active' : ''}`}
                    onClick={() => changePage(pageNumber)}
                  >
                    {pageNumber}
                  </button>
                );
              }).filter(Boolean)}
            </div>
            
            <button 
              className="pagination-btn" 
              onClick={nextPage}
              disabled={!pagination.hasNext}
            >
              Próxima →
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SellerRankingReal;
