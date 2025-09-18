import React, { useState, useEffect } from 'react';
import './TicketRankingCard.css';
import { getTicketRankingData, getTicketRankingFilterNames } from '../service/ticketRankingService';
import { getDDDRankingData, getDDDRankingFilterNames } from '../service/dddRankingService';

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
  const [activeTab, setActiveTab] = useState('ticket-maior');
  const [ticketData, setTicketData] = useState([]);
  const [purchaseCountData, setPurchaseCountData] = useState([]);
  const [dddData, setDddData] = useState([]);
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

  const clientsPerPage = 10;

  // Função para buscar dados agrupados por DDD
  const fetchDDDRanking = async (page = 1) => {
    try {
      setLoading(true);
      setError(null);

      console.log('🎯 TicketRankingCard: Buscando dados de DDD...', {
        startDate,
        endDate,
        selectedFunnel,
        selectedUnit,
        selectedSeller,
        selectedOrigin,
        page
      });

      const result = await getDDDRankingData(
        startDate,
        endDate,
        selectedFunnel,
        selectedUnit,
        selectedSeller,
        selectedOrigin,
        page,
        clientsPerPage
      );

      setDddData(result.data);
      setPagination(result.pagination);
      console.log('✅ TicketRankingCard: Dados de DDD carregados:', result);

    } catch (error) {
      console.error('❌ TicketRankingCard: Erro ao carregar dados de DDD:', error);
      setError(error.message);
      setDddData([]);
    } finally {
      setLoading(false);
    }
  };

  // Função para buscar dados agrupados por lead_id (número de compras)
  const fetchPurchaseCountRanking = async (page = 1) => {
    try {
      setLoading(true);
      setError(null);

      console.log('🎯 TicketRankingCard: Buscando dados de número de compras...', {
        startDate,
        endDate,
        selectedFunnel,
        selectedUnit,
        selectedSeller,
        selectedOrigin,
        page
      });

      // Buscar TODOS os dados primeiro (sem paginação) para poder agrupar
      let result = await getTicketRankingData(
        startDate,
        endDate,
        selectedFunnel,
        selectedUnit,
        selectedSeller,
        selectedOrigin,
        1, // Sempre página 1 para buscar todos
        1000 // Buscar muitos dados para ter todos os leads
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
          1,
          1000
        );

        console.log('🔄 TicketRankingCard: Tentativa com período expandido:', result);
      }

      // Agrupar dados por lead_id
      const groupedData = {};
      result.data.forEach(opportunity => {
        if (opportunity.leadId) {
          if (!groupedData[opportunity.leadId]) {
            groupedData[opportunity.leadId] = {
              leadId: opportunity.leadId,
              leadName: opportunity.name.split(' | ')[1] || 'Lead sem nome',
              leadCity: opportunity.name.split(' | ')[2] || '',
              leadWhatsapp: opportunity.leadWhatsapp || '',
              totalValue: 0,
              opportunityCount: 0,
              opportunities: []
            };
          }
          groupedData[opportunity.leadId].totalValue += opportunity.ticket;
          groupedData[opportunity.leadId].opportunityCount += 1;
          groupedData[opportunity.leadId].opportunities.push(opportunity);
        }
      });

      // Converter para array e ordenar por quantidade de oportunidades
      const allPurchaseCountArray = Object.values(groupedData)
        .sort((a, b) => b.opportunityCount - a.opportunityCount)
        .map((item, index) => ({
          ...item,
          rank: index + 1,
          progress: 100 // Será calculado baseado na maior quantidade
        }));

      // Calcular progresso baseado na maior quantidade de oportunidades
      if (allPurchaseCountArray.length > 0) {
        const maxCount = allPurchaseCountArray[0].opportunityCount;
        allPurchaseCountArray.forEach(item => {
          item.progress = (item.opportunityCount / maxCount) * 100;
        });
      }

      // Aplicar paginação manualmente
      const startIndex = (page - 1) * clientsPerPage;
      const endIndex = startIndex + clientsPerPage;
      const paginatedData = allPurchaseCountArray.slice(startIndex, endIndex);

      // Atualizar paginação
      const totalPages = Math.ceil(allPurchaseCountArray.length / clientsPerPage);
      setPagination({
        currentPage: page,
        totalPages: totalPages,
        totalItems: allPurchaseCountArray.length,
        pageSize: clientsPerPage,
        hasNext: page < totalPages,
        hasPrev: page > 1
      });

      setPurchaseCountData(paginatedData);
      console.log('✅ TicketRankingCard: Dados de compras carregados:', {
        total: allPurchaseCountArray.length,
        page: page,
        showing: paginatedData.length,
        pagination: { currentPage: page, totalPages, totalItems: allPurchaseCountArray.length }
      });

    } catch (error) {
      console.error('❌ TicketRankingCard: Erro ao carregar dados de compras:', error);
      setError(error.message);
      setPurchaseCountData([]);
    } finally {
      setLoading(false);
    }
  };

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
    if (activeTab === 'ticket-maior') {
      fetchTicketRanking(1);
    } else if (activeTab === 'numero-compras') {
      fetchPurchaseCountRanking(1);
    } else if (activeTab === 'por-ddd') {
      fetchDDDRanking(1);
    }
    fetchFilterNames();
  }, [startDate, endDate, selectedFunnel, selectedUnit, selectedSeller, selectedOrigin, activeTab]);

  // Efeito para buscar dados quando página mudar
  useEffect(() => {
    console.log('🔄 TicketRankingCard: Página alterada para', currentPage);
    if (activeTab === 'ticket-maior') {
      fetchTicketRanking(currentPage);
    } else if (activeTab === 'numero-compras') {
      fetchPurchaseCountRanking(currentPage);
    } else if (activeTab === 'por-ddd') {
      fetchDDDRanking(currentPage);
    }
  }, [currentPage, activeTab]);

  // Função para mudar de página
  const changePage = (page) => {
    console.log('🔄 TicketRankingCard: changePage chamada com página', page);
    if (page >= 1 && page <= pagination.totalPages) {
      setCurrentPage(page);
    }
  };

  // Função para ir para próxima página
  const nextPage = () => {
    console.log('🔄 TicketRankingCard: nextPage chamada, página atual:', currentPage);
    if (pagination.hasNext) {
      setCurrentPage(currentPage + 1);
    }
  };

  // Função para ir para página anterior
  const prevPage = () => {
    console.log('🔄 TicketRankingCard: prevPage chamada, página atual:', currentPage);
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
      <div className="ticket-name-container">
        <span className="ticket-name">
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
        {client.leadWhatsapp && (
          <span className="ticket-whatsapp">
            📱 {client.leadWhatsapp}
          </span>
        )}
      </div>
    );
  };

  // Função para renderizar o nome do lead na aba de número de compras
  const renderLeadName = (lead) => {
    const leadProfileLink = lead.leadId ? generateLeadProfileLink(lead.leadId) : null;

    return (
      <div className="ticket-name-container">
        <span className="ticket-name">
          {leadProfileLink ? (
            <a
              href={leadProfileLink}
              target="_blank"
              rel="noopener noreferrer"
              className="lead-link"
              onClick={(e) => e.stopPropagation()}
            >
              {lead.leadName}
            </a>
          ) : (
            lead.leadName
          )}
          {lead.leadCity && ` | ${lead.leadCity}`}
        </span>
        {lead.leadWhatsapp && (
          <span className="ticket-whatsapp">
            📱 {lead.leadWhatsapp}
          </span>
        )}
      </div>
    );
  };

  // Função para renderizar o nome da região DDD
  const renderDDDName = (ddd) => {
    return (
      <span className="ticket-name">
        <span className="ddd-code">DDD {ddd.ddd}</span>
        <span className="ddd-location"> | {ddd.cidade} - {ddd.estado}</span>
        <span className="ddd-region"> | {ddd.regiao}</span>
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
        <span className="platform-name">Ranking de Oportunidades</span>
      </div>

      {/* Sistema de Abas */}
      <div className="ticket-tabs">
        <button 
          className={`ticket-tab ${activeTab === 'ticket-maior' ? 'active' : ''}`}
          onClick={() => setActiveTab('ticket-maior')}
        >
          Ticket Maior
        </button>
        <button 
          className={`ticket-tab ${activeTab === 'numero-compras' ? 'active' : ''}`}
          onClick={() => setActiveTab('numero-compras')}
        >
          Número de Compras
        </button>
        <button 
          className={`ticket-tab ${activeTab === 'por-ddd' ? 'active' : ''}`}
          onClick={() => setActiveTab('por-ddd')}
        >
          Por DDD
        </button>
      </div>

      <div className="ticket-list">
        {activeTab === 'ticket-maior' ? (
          ticketData.length === 0 ? (
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
          )
        ) : activeTab === 'numero-compras' ? (
          purchaseCountData.length === 0 ? (
            <div className="ticket-empty">
              <p>Nenhum lead encontrado para os filtros selecionados.</p>
            </div>
          ) : (
            purchaseCountData.map((lead) => (
              <div key={lead.leadId} className="ticket-line">
                <div className="ticket-content">
                  <div className="ticket-info">
                    {renderLeadName(lead)}
                    <span className="ticket-value">
                      {lead.opportunityCount} - {formatCurrency(lead.totalValue)}
                    </span>
                  </div>
                  <div className="ticket-rank">
                    <span className="ticket-percent">{lead.rank}º</span>
                  </div>
                </div>
                <div className="ticket-color-bar" style={{background: '#10b981', width: `${lead.progress}%`}}></div>
              </div>
            ))
          )
        ) : (
          dddData.length === 0 ? (
            <div className="ticket-empty">
              <p>Nenhuma região encontrada para os filtros selecionados.</p>
            </div>
          ) : (
            dddData.map((ddd) => (
              <div key={ddd.ddd} className="ticket-line">
                <div className="ticket-content">
                  <div className="ticket-info">
                    {renderDDDName(ddd)}
                    <div className="ticket-metrics">
                      <span className="ticket-value">{formatCurrency(ddd.totalValue)}</span>
                      <span className="ticket-count">{ddd.opportunityCount} oportunidades</span>
                      <span className="ticket-ticket">Ticket médio: {formatCurrency(ddd.ticketMedio)}</span>
                    </div>
                  </div>
                  <div className="ticket-rank">
                    <span className="ticket-percent">{ddd.rank}º</span>
                  </div>
                </div>
                <div className="ticket-color-bar" style={{background: '#10b981', width: `${ddd.progress}%`}}></div>
              </div>
            ))
          )
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