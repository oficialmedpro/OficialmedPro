import React, { useState } from 'react';
import './SellerRanking.css';

const SellerRanking = ({ formatCurrency, t }) => {
  // Dados dos vendedores
  const allSellers = [
    {
      id: 1,
      name: 'Gustavo',
      rank: 1,
      total: '156/R$24.000,00',
      totalOpportunities: 270, // Total de oportunidades recebidas
      conversion: '68.2%',
      ticket: 'R$ 15.384',
      lost: '42 (26.9%)',
      open: '8',
      negotiation: '6/R$ 89.000',
      meta: '+20%',
      metaStatus: 'positive',
      progress: 100
    },
    {
      id: 2,
      name: 'Thalia',
      rank: 2,
      total: '134/R$18.500,00',
      totalOpportunities: 245, // Total de oportunidades recebidas
      conversion: '65.7%',
      ticket: 'R$ 13.805',
      lost: '38 (28.4%)',
      open: '12',
      negotiation: '8/R$ 67.500',
      meta: '+8%',
      metaStatus: 'positive',
      progress: 86
    },
    {
      id: 3,
      name: 'Hagata',
      rank: 3,
      total: '118/R$15.800,00',
      totalOpportunities: 220, // Total de oportunidades recebidas
      conversion: '62.7%',
      ticket: 'R$ 13.389',
      lost: '35 (29.7%)',
      open: '10',
      negotiation: '7/R$ 58.200',
      meta: '+2%',
      metaStatus: 'positive',
      progress: 76
    },
    {
      id: 4,
      name: 'Rosana Mirian',
      rank: 4,
      total: '98/R$12.400,00',
      totalOpportunities: 185, // Total de oportunidades recebidas
      conversion: '58.2%',
      ticket: 'R$ 12.653',
      lost: '32 (32.7%)',
      open: '15',
      negotiation: '9/R$ 45.800',
      meta: '-13%',
      metaStatus: 'negative',
      progress: 63
    },
    {
      id: 5,
      name: 'Isabella',
      rank: 5,
      total: '87/R$9.800,00',
      totalOpportunities: 165, // Total de oportunidades recebidas
      conversion: '54.0%',
      ticket: 'R$ 11.264',
      lost: '28 (32.2%)',
      open: '18',
      negotiation: '11/R$ 38.400',
      meta: '-23%',
      metaStatus: 'negative',
      progress: 56
    },
    {
      id: 6,
      name: 'Thiago',
      rank: 6,
      total: '76/R$7.200,00',
      totalOpportunities: 145, // Total de oportunidades recebidas
      conversion: '48.7%',
      ticket: 'R$ 9.473',
      lost: '25 (32.9%)',
      open: '22',
      negotiation: '14/R$ 32.100',
      meta: '-35%',
      metaStatus: 'negative',
      progress: 49
    },
    // Vendedores adicionais para demonstração da paginação
    {
      id: 7,
      name: 'Carlos Silva',
      rank: 7,
      total: '65/R$6.800,00',
      totalOpportunities: 130, // Total de oportunidades recebidas
      conversion: '45.2%',
      ticket: 'R$ 8.923',
      lost: '22 (33.8%)',
      open: '25',
      negotiation: '16/R$ 28.500',
      meta: '-42%',
      metaStatus: 'negative',
      progress: 42
    },
    {
      id: 8,
      name: 'Ana Costa',
      rank: 8,
      total: '58/R$5.900,00',
      totalOpportunities: 120, // Total de oportunidades recebidas
      conversion: '41.8%',
      ticket: 'R$ 8.103',
      lost: '20 (34.5%)',
      open: '28',
      negotiation: '18/R$ 24.200',
      meta: '-48%',
      metaStatus: 'negative',
      progress: 38
    },
    {
      id: 9,
      name: 'Roberto Lima',
      rank: 9,
      total: '52/R$5.200,00',
      totalOpportunities: 110, // Total de oportunidades recebidas
      conversion: '38.5%',
      ticket: 'R$ 7.692',
      lost: '18 (34.6%)',
      open: '30',
      negotiation: '20/R$ 21.800',
      meta: '-52%',
      metaStatus: 'negative',
      progress: 34
    },
    {
      id: 10,
      name: 'Fernanda Santos',
      rank: 10,
      total: '47/R$4.600,00',
      totalOpportunities: 100, // Total de oportunidades recebidas
      conversion: '35.1%',
      ticket: 'R$ 7.234',
      lost: '16 (34.0%)',
      open: '32',
      negotiation: '22/R$ 19.500',
      meta: '-56%',
      metaStatus: 'negative',
      progress: 30
    },
    {
      id: 11,
      name: 'Lucas Oliveira',
      rank: 11,
      total: '42/R$4.100,00',
      totalOpportunities: 95, // Total de oportunidades recebidas
      conversion: '31.8%',
      ticket: 'R$ 6.905',
      lost: '14 (33.3%)',
      open: '35',
      negotiation: '25/R$ 17.200',
      meta: '-60%',
      metaStatus: 'negative',
      progress: 26
    },
    {
      id: 12,
      name: 'Patrícia Alves',
      rank: 12,
      total: '38/R$3.700,00',
      totalOpportunities: 90, // Total de oportunidades recebidas
      conversion: '28.9%',
      ticket: 'R$ 6.579',
      lost: '12 (31.6%)',
      open: '38',
      negotiation: '28/R$ 15.100',
      meta: '-64%',
      metaStatus: 'negative',
      progress: 22
    }
  ];

  const [currentPage, setCurrentPage] = useState(1);
  const sellersPerPage = 6;
  const totalPages = Math.ceil(allSellers.length / sellersPerPage);

  // Obter vendedores da página atual
  const getCurrentSellers = () => {
    const startIndex = (currentPage - 1) * sellersPerPage;
    const endIndex = startIndex + sellersPerPage;
    return allSellers.slice(startIndex, endIndex);
  };

  // Função para mudar de página
  const changePage = (page) => {
    setCurrentPage(page);
  };

  // Função para ir para próxima página
  const nextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  // Função para ir para página anterior
  const prevPage = () => {
    if (currentPage > 1) {
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
    } else if (seller.rank === allSellers.length) {
      return <span className="source-percent last-place">6º</span>;
    } else {
      return <span className="source-percent">{seller.rank}º</span>;
    }
  };

  // Função para renderizar a classe da linha baseada no ranking
  const getRowClass = (seller) => {
    if (seller.rank === 1) return 'source-line medal-gold';
    if (seller.rank === 2) return 'source-line medal-silver';
    if (seller.rank === 3) return 'source-line medal-bronze';
    if (seller.rank === allSellers.length) return 'source-line last-place';
    return 'source-line';
  };

  // Função para renderizar o valor da meta
  const renderMetaValue = (seller) => {
    if (seller.metaStatus === 'positive') {
      return <span className="metric-value meta-positive">⭐ {seller.meta}</span>;
    } else {
      return <span className="metric-value meta-negative">{seller.meta}</span>;
    }
  };

  return (
    <div className="metric-card-main">
      <div className="metric-card-header">
        <div className="platform-icon seller-icon">V</div>
        <span className="platform-name">Ranking de Vendedores</span>
      </div>
      
      <div className="sources-list">
        {getCurrentSellers().map((seller) => (
          <div key={seller.id} className={getRowClass(seller)}>
            <div className="source-content">
              <div className="seller-info">
                <div className="seller-header">
                  <span className="source-name">{seller.rank}. {seller.name}</span>
                  <span className="seller-total">{seller.total}</span>
                </div>
                <div className="seller-metrics">
                  <div className="metric-row">
                    <div className="metric-col">
                      <span className="metric-label">Conversão:</span>
                      <span className="metric-value">{seller.totalOpportunities}/{seller.conversion}</span>
                    </div>
                    <div className="metric-col">
                      <span className="metric-label">Ticket:</span>
                      <span className="metric-value">{seller.ticket}</span>
                    </div>
                  </div>
                  <div className="metric-row">
                    <div className="metric-col">
                      <span className="metric-label">Perdidas:</span>
                      <span className="metric-value">{seller.lost}</span>
                    </div>
                    <div className="metric-col">
                      <span className="metric-label">Abertas:</span>
                      <span className="metric-value">{seller.open}</span>
                    </div>
                  </div>
                  <div className="metric-row">
                    <div className="metric-col">
                      <span className="metric-label">Negociação:</span>
                      <span className="metric-value">{seller.negotiation}</span>
                    </div>
                    <div className="metric-col">
                      <span className="metric-label">Meta:</span>
                      {renderMetaValue(seller)}
                    </div>
                  </div>
                </div>
              </div>
              <div className="seller-rank">
                {renderRankBadge(seller)}
              </div>
            </div>
            <div className="source-color-bar" style={{background: '#10b981', width: `${seller.progress}%`}}></div>
          </div>
        ))}
      </div>

      {/* Paginação */}
      {totalPages > 1 && (
        <div className="pagination-container">
          <div className="pagination-info">
            Página {currentPage} de {totalPages} ({allSellers.length} vendedores)
          </div>
          <div className="pagination-controls">
            <button 
              className="pagination-btn" 
              onClick={prevPage}
              disabled={currentPage === 1}
            >
              ← Anterior
            </button>
            
            <div className="page-numbers">
              {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
                <button
                  key={page}
                  className={`page-btn ${currentPage === page ? 'active' : ''}`}
                  onClick={() => changePage(page)}
                >
                  {page}
                </button>
              ))}
            </div>
            
            <button 
              className="pagination-btn" 
              onClick={nextPage}
              disabled={currentPage === totalPages}
            >
              Próxima →
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SellerRanking;
