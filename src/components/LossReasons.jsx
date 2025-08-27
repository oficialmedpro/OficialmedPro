import React, { useState } from 'react';
import './LossReasons.css';

const LossReasons = ({ formatCurrency, t }) => {
  // Dados dos principais motivos de loss - 18 motivos total
  const allLossReasons = [
    { id: 1, reason: 'Preço muito alto', count: 45, percentage: 28.1, rank: 1, progress: 100 },
    { id: 2, reason: 'Prazo de entrega longo', count: 38, percentage: 23.8, rank: 2, progress: 84 },
    { id: 3, reason: 'Falta de garantia', count: 32, percentage: 20.0, rank: 3, progress: 71 },
    { id: 4, reason: 'Concorrência mais barata', count: 28, percentage: 17.5, rank: 4, progress: 62 },
    { id: 5, reason: 'Problemas de qualidade', count: 25, percentage: 15.6, rank: 5, progress: 56 },
    { id: 6, reason: 'Falta de suporte técnico', count: 22, percentage: 13.8, rank: 6, progress: 49 },
    { id: 7, reason: 'Documentação insuficiente', count: 20, percentage: 12.5, rank: 7, progress: 44 },
    { id: 8, reason: 'Processo de compra complexo', count: 18, percentage: 11.3, rank: 8, progress: 40 },
    { id: 9, reason: 'Falta de flexibilidade', count: 16, percentage: 10.0, rank: 9, progress: 36 },
    { id: 10, reason: 'Problemas de comunicação', count: 15, percentage: 9.4, rank: 10, progress: 33 },
    { id: 11, reason: 'Falta de experiência', count: 14, percentage: 8.8, rank: 11, progress: 31 },
    { id: 12, reason: 'Limitações de pagamento', count: 13, percentage: 8.1, rank: 12, progress: 29 },
    { id: 13, reason: 'Falta de inovação', count: 12, percentage: 7.5, rank: 13, progress: 27 },
    { id: 14, reason: 'Problemas de logística', count: 11, percentage: 6.9, rank: 14, progress: 24 },
    { id: 15, reason: 'Falta de personalização', count: 10, percentage: 6.3, rank: 15, progress: 22 },
    { id: 16, reason: 'Problemas de compliance', count: 9, percentage: 5.6, rank: 16, progress: 20 },
    { id: 17, reason: 'Falta de certificações', count: 8, percentage: 5.0, rank: 17, progress: 18 },
    { id: 18, reason: 'Problemas de atendimento', count: 7, percentage: 4.4, rank: 18, progress: 16 }
  ];

  const [currentPage, setCurrentPage] = useState(1);
  const reasonsPerPage = 16;
  const totalPages = Math.ceil(allLossReasons.length / reasonsPerPage);

  // Obter motivos da página atual
  const getCurrentReasons = () => {
    const startIndex = (currentPage - 1) * reasonsPerPage;
    const endIndex = startIndex + reasonsPerPage;
    return allLossReasons.slice(startIndex, endIndex);
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

  return (
    <div className="loss-reasons-card">
      <div className="loss-reasons-header">
        <div className="platform-icon loss-icon">L</div>
        <span className="platform-name">Principais Motivos de Loss</span>
      </div>
      
      <div className="loss-list">
        {getCurrentReasons().map((reason) => (
          <div key={reason.id} className="loss-line">
            <div className="loss-content">
              <div className="loss-info">
                <span className="loss-name">{reason.rank}. {reason.reason}</span>
                <span className="loss-count">{reason.count} ({reason.percentage}%)</span>
              </div>
              <div className="loss-rank">
                <span className="loss-percent">{reason.rank}º</span>
              </div>
            </div>
            <div className="loss-color-bar" style={{background: '#ef4444', width: `${reason.progress}%`}}></div>
          </div>
        ))}
      </div>

      {/* Paginação */}
      {totalPages > 1 && (
        <div className="pagination-container">
          <div className="pagination-info">
            Página {currentPage} de {totalPages} ({allLossReasons.length} motivos)
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

export default LossReasons;
