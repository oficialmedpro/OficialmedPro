import React, { useState } from 'react';
import './TicketRanking.css';

const TicketRanking = ({ formatCurrency, t }) => {
  // Dados dos clientes por ticket maior - Top 50
  const allClients = [
    { id: 1, name: 'Cliente A', ticket: 45000, rank: 1, progress: 100 },
    { id: 2, name: 'Cliente B', ticket: 38500, rank: 2, progress: 86 },
    { id: 3, name: 'Cliente C', ticket: 32000, rank: 3, progress: 71 },
    { id: 4, name: 'Cliente D', ticket: 28500, rank: 4, progress: 63 },
    { id: 5, name: 'Cliente E', ticket: 26500, rank: 5, progress: 59 },
    { id: 6, name: 'Cliente F', ticket: 24500, rank: 6, progress: 54 },
    { id: 7, name: 'Cliente G', ticket: 22500, rank: 7, progress: 50 },
    { id: 8, name: 'Cliente H', ticket: 20500, rank: 8, progress: 46 },
    { id: 9, name: 'Cliente I', ticket: 18500, rank: 9, progress: 41 },
    { id: 10, name: 'Cliente J', ticket: 16500, rank: 10, progress: 37 },
    { id: 11, name: 'Cliente K', ticket: 14500, rank: 11, progress: 32 },
    { id: 12, name: 'Cliente L', ticket: 12500, rank: 12, progress: 28 },
    { id: 13, name: 'Cliente M', ticket: 10500, rank: 13, progress: 23 },
    { id: 14, name: 'Cliente N', ticket: 8500, rank: 14, progress: 19 },
    { id: 15, name: 'Cliente O', ticket: 6500, rank: 15, progress: 14 },
    { id: 16, name: 'Cliente P', ticket: 4500, rank: 16, progress: 10 },
    { id: 17, name: 'Cliente Q', ticket: 4200, rank: 17, progress: 9 },
    { id: 18, name: 'Cliente R', ticket: 4000, rank: 18, progress: 9 },
    { id: 19, name: 'Cliente S', ticket: 3800, rank: 19, progress: 8 },
    { id: 20, name: 'Cliente T', ticket: 3600, rank: 20, progress: 8 },
    { id: 21, name: 'Cliente U', ticket: 3400, rank: 21, progress: 8 },
    { id: 22, name: 'Cliente V', ticket: 3200, rank: 22, progress: 7 },
    { id: 23, name: 'Cliente W', ticket: 3000, rank: 23, progress: 7 },
    { id: 24, name: 'Cliente X', ticket: 2800, rank: 24, progress: 6 },
    { id: 25, name: 'Cliente Y', ticket: 2600, rank: 25, progress: 6 },
    { id: 26, name: 'Cliente Z', ticket: 2400, rank: 26, progress: 5 },
    { id: 27, name: 'Cliente AA', ticket: 2200, rank: 27, progress: 5 },
    { id: 28, name: 'Cliente BB', ticket: 2000, rank: 28, progress: 4 },
    { id: 29, name: 'Cliente CC', ticket: 1800, rank: 29, progress: 4 },
    { id: 30, name: 'Cliente DD', ticket: 1600, rank: 30, progress: 4 },
    { id: 31, name: 'Cliente EE', ticket: 1400, rank: 31, progress: 3 },
    { id: 32, name: 'Cliente FF', ticket: 1200, rank: 32, progress: 3 },
    { id: 33, name: 'Cliente GG', ticket: 1000, rank: 33, progress: 2 },
    { id: 34, name: 'Cliente HH', ticket: 900, rank: 34, progress: 2 },
    { id: 35, name: 'Cliente II', ticket: 800, rank: 35, progress: 2 },
    { id: 36, name: 'Cliente JJ', ticket: 700, rank: 36, progress: 2 },
    { id: 37, name: 'Cliente KK', ticket: 600, rank: 37, progress: 1 },
    { id: 38, name: 'Cliente LL', ticket: 500, rank: 38, progress: 1 },
    { id: 39, name: 'Cliente MM', ticket: 400, rank: 39, progress: 1 },
    { id: 40, name: 'Cliente NN', ticket: 300, rank: 40, progress: 1 },
    { id: 41, name: 'Cliente OO', ticket: 250, rank: 41, progress: 1 },
    { id: 42, name: 'Cliente PP', ticket: 200, rank: 42, progress: 0 },
    { id: 43, name: 'Cliente QQ', ticket: 150, rank: 43, progress: 0 },
    { id: 44, name: 'Cliente RR', ticket: 100, rank: 44, progress: 0 },
    { id: 45, name: 'Cliente SS', ticket: 80, rank: 45, progress: 0 },
    { id: 46, name: 'Cliente TT', ticket: 60, rank: 46, progress: 0 },
    { id: 47, name: 'Cliente UU', ticket: 40, rank: 47, progress: 0 },
    { id: 48, name: 'Cliente VV', ticket: 30, rank: 48, progress: 0 },
    { id: 49, name: 'Cliente WW', ticket: 20, rank: 49, progress: 0 },
    { id: 50, name: 'Cliente XX', ticket: 10, rank: 50, progress: 0 }
  ];

  const [currentPage, setCurrentPage] = useState(1);
  const clientsPerPage = 16;
  const totalPages = Math.ceil(allClients.length / clientsPerPage);

  // Obter clientes da página atual
  const getCurrentClients = () => {
    const startIndex = (currentPage - 1) * clientsPerPage;
    const endIndex = startIndex + clientsPerPage;
    return allClients.slice(startIndex, endIndex);
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
    <div className="ticket-ranking-card">
      <div className="ticket-ranking-header">
        <div className="platform-icon ticket-icon">T</div>
        <span className="platform-name">Ranking por Ticket Maior</span>
      </div>
      
      <div className="ticket-list">
        {getCurrentClients().map((client) => (
          <div key={client.id} className="ticket-line">
            <div className="ticket-content">
              <div className="ticket-info">
                <span className="ticket-name">{client.rank}. {client.name}</span>
                <span className="ticket-value">{formatCurrency(client.ticket)}</span>
              </div>
              <div className="ticket-rank">
                <span className="ticket-percent">{client.rank}º</span>
              </div>
            </div>
            <div className="ticket-color-bar" style={{background: '#10b981', width: `${client.progress}%`}}></div>
          </div>
        ))}
      </div>

      {/* Paginação */}
      {totalPages > 1 && (
        <div className="pagination-container">
          <div className="pagination-info">
            Página {currentPage} de {totalPages} ({allClients.length} clientes)
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

export default TicketRanking;
