import React, { useState, useEffect } from 'react';
import './TicketRankingCard.css';
import { getTicketRankingData, getTicketRankingFilterNames } from '../service/ticketRankingService';

/**
 * 🎯 TICKET RANKING CARD
 *
 * Componente para exibir ranking de oportunidades por valor (ticket)
 * com dados reais do banco, ordenados do maior para o menor valor
 */
const TicketRankingCard = ({
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
  const [ticketData, setTicketData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 0,
    totalItems: 0,
    pageSize: 20,
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

  const clientsPerPage = 20;

  // Função para buscar dados do ranking
  const fetchTicketRanking = async (page = 1) => {
    try {
      setLoading(true);
      setError(null);

      console.log('🎯 TicketRankingCard: Buscando dados...', {
        startDate,
        endDate,
        selectedFunnel,
        selectedUnit,
        selectedSeller,
        selectedOrigin,
        page
      });

      // Primeira tentativa: com filtros específicos
      let result = await getTicketRankingData(
        startDate,
        endDate,
        selectedFunnel,
        selectedUnit,
        selectedSeller,
        selectedOrigin,
        page,
        clientsPerPage
      );

      // Se não encontrou dados, tentar com período expandido (últimos 30 dias)
      if (result.pagination.totalItems === 0) {
        console.log('⚠️ TicketRankingCard: Nenhum dado encontrado, expandindo período para 30 dias...');

        const today = new Date();
        const thirtyDaysAgo = new Date(today);
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const expandedStartDate = thirtyDaysAgo.toISOString().split('T')[0];
        const expandedEndDate = today.toISOString().split('T')[0];

        result = await getTicketRankingData(
          expandedStartDate,
          expandedEndDate,
          selectedFunnel,
          selectedUnit,
          selectedSeller,
          selectedOrigin,
          page,
          clientsPerPage
        );

        console.log('🔄 TicketRankingCard: Tentativa com período expandido:', result);
      }

      setTicketData(result.data);
      setPagination(result.pagination);
      console.log('✅ TicketRankingCard: Dados carregados:', result);

    } catch (error) {
      console.error('❌ TicketRankingCard: Erro ao carregar dados:', error);
      setError(error.message);
      setTicketData([]);
    } finally {
      setLoading(false);
    }
  };

  // Função para buscar nomes dos filtros
  const fetchFilterNames = async () => {
    try {
      const names = await getTicketRankingFilterNames(
        selectedFunnel,
        selectedUnit,
        selectedSeller,
        selectedOrigin
      );
      setFilterNames(names);
    } catch (error) {
      console.error('❌ TicketRankingCard: Erro ao buscar nomes dos filtros:', error);
    }
  };

  // Efeito para buscar dados quando filtros mudarem
  useEffect(() => {
    console.log('🔄 TicketRankingCard: Filtros alterados, recarregando dados...');
    setCurrentPage(1); // Reset para primeira página
    fetchTicketRanking(1);
    fetchFilterNames();
  }, [startDate, endDate, selectedFunnel, selectedUnit, selectedSeller, selectedOrigin]);

  // Efeito para buscar dados quando página mudar
  useEffect(() => {
    if (currentPage !== 1) {
      fetchTicketRanking(currentPage);
    }
  }, [currentPage]);

  // Função para mudar de página
  const changePage = (page) => {
    if (page >= 1 && page <= pagination.totalPages) {
      setCurrentPage(page);
    }
  };

  // Função para ir para próxima página
  const nextPage = () => {
    if (pagination.hasNext) {
      setCurrentPage(currentPage + 1);
    }
  };

  // Função para ir para página anterior
  const prevPage = () => {
    if (pagination.hasPrev) {
      setCurrentPage(currentPage - 1);
    }
  };

  // Função para gerar link do CRM
  const generateCrmLink = (opportunityId, funnelId) => {
    return `https://oficialmed.sprinthub.app/sh/crm?funnelID=${funnelId}&opportunityID=${opportunityId}`;
  };

  // Função para gerar link do perfil do lead
  const generateLeadProfileLink = (leadId) => {
    return `https://oficialmed.sprinthub.app/sh/leads/profile/${leadId}`;
  };

  // Função para extrair apenas o ID da oportunidade do nome
  const extractOpportunityId = (client) => {
    return client.id;
  };

  // Função para renderizar o nome com links clicáveis
  const renderClientName = (client) => {
    const parts = client.name.split(' | ');
    const opportunityId = parts[0]; // Primeiro parte é sempre o ID
    const leadName = parts[1]; // Segunda parte é o nome do lead
    const leadCity = parts[2]; // Terceira parte é a cidade

    const crmLink = generateCrmLink(client.id, client.funnelId);
    const leadProfileLink = client.leadId ? generateLeadProfileLink(client.leadId) : null;

    return (
      <span className="ticket-name">
        {client.rank}.
        <a
          href={crmLink}
          target="_blank"
          rel="noopener noreferrer"
          className="opportunity-link"
          onClick={(e) => e.stopPropagation()}
        >
          {opportunityId}
        </a>
        {leadName && (
          <>
            {' | '}
            {leadProfileLink ? (
              <a
                href={leadProfileLink}
                target="_blank"
                rel="noopener noreferrer"
                className="lead-link"
                onClick={(e) => e.stopPropagation()}
              >
                {leadName}
              </a>
            ) : (
              leadName
            )}
          </>
        )}
        {leadCity && ` | ${leadCity}`}
      </span>
    );
  };

  // Função para formatar o período dinâmico
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

    // Fallback: hoje
    return new Date().toLocaleDateString('pt-BR');
  };

  // Renderizar estado de loading
  if (loading) {
    return (
      <div className="ticket-ranking-card">
        <div className="ticket-ranking-header">
          <div className="platform-icon ticket-icon">T</div>
          <span className="platform-name">Ranking por Ticket Maior</span>
        </div>
        <div className="ticket-loading">
          <div className="loading-spinner"></div>
          <p>Carregando ranking...</p>
        </div>
      </div>
    );
  }

  // Renderizar estado de erro
  if (error) {
    return (
      <div className="ticket-ranking-card">
        <div className="ticket-ranking-header">
          <div className="platform-icon ticket-icon">T</div>
          <span className="platform-name">Ranking por Ticket Maior</span>
        </div>
        <div className="ticket-error">
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
    <div className="ticket-ranking-card">
      <div className="ticket-ranking-header">
        <div className="platform-icon ticket-icon">T</div>
        <span className="platform-name">Ranking por Ticket Maior</span>
      </div>

      {/* Seção de Filtros Aplicados */}
      <div className="ticket-applied-filters">
        <div className="ticket-applied-filters-content">
          {/* Funil */}
          <div className="ticket-filter-item">
            <span className="ticket-filter-label">Funil:</span>
            <span className="ticket-filter-value">
              {filterNames.funnelName || (selectedFunnel === 'all' ? 'Todos os Funis' : `Funil ${selectedFunnel}`)}
            </span>
          </div>

          {/* Unidade */}
          <div className="ticket-filter-item">
            <span className="ticket-filter-label">Unidade:</span>
            <span className="ticket-filter-value">
              {selectedUnit === 'all' ? 'Todas as Unidades' : (filterNames.unitName || selectedUnit)}
            </span>
          </div>

          {/* Vendedor */}
          <div className="ticket-filter-item">
            <span className="ticket-filter-label">Vendedor:</span>
            <span className="ticket-filter-value">
              {selectedSeller === 'all' ? 'Todos os Vendedores' : (filterNames.sellerName || selectedSeller)}
            </span>
          </div>

          {/* Origem */}
          <div className="ticket-filter-item">
            <span className="ticket-filter-label">Origem:</span>
            <span className="ticket-filter-value">
              {!selectedOrigin || selectedOrigin === 'all' ? 'Todas as Origens' : (filterNames.originName || selectedOrigin)}
            </span>
          </div>

          {/* Período */}
          <div className="ticket-filter-item">
            <span className="ticket-filter-label">Período:</span>
            <span className="ticket-filter-value">{getDynamicPeriod()}</span>
          </div>
        </div>
      </div>

      <div className="ticket-list">
        {ticketData.length === 0 ? (
          <div className="ticket-empty">
            <p>Nenhuma oportunidade encontrada para os filtros selecionados.</p>
          </div>
        ) : (
          ticketData.map((client) => (
            <div key={client.id} className="ticket-line">
              <div className="ticket-content">
                <div className="ticket-info">
                  {renderClientName(client)}
                  <span className="ticket-value">{formatCurrency(client.ticket)}</span>
                </div>
                <div className="ticket-rank">
                  <span className="ticket-percent">{client.rank}º</span>
                </div>
              </div>
              <div className="ticket-color-bar" style={{background: '#10b981', width: `${client.progress}%`}}></div>
            </div>
          ))
        )}
      </div>

      {/* Paginação */}
      {pagination.totalPages > 1 && (
        <div className="pagination-container">
          <div className="pagination-info">
            Página {pagination.currentPage} de {pagination.totalPages} ({pagination.totalItems} oportunidades)
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
                // Mostrar no máximo 10 páginas ao redor da página atual
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

export default TicketRankingCard;