import React, { useState, useEffect } from 'react';
import './LeadsTable.css';
import { getLeadsBySegment } from '../service/leadsTableService';

const LeadsTable = ({ segmentoId, segmentoNome, onClose }) => {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('all');
  const [error, setError] = useState(null);

  const leadsPerPage = 10;

  useEffect(() => {
    if (segmentoId) {
      loadLeads();
    }
  }, [segmentoId, currentPage, statusFilter]);

  const loadLeads = async () => {
    try {
      setLoading(true);
      setError(null);

      // Buscar leads do segmento usando o serviço
      const data = await getLeadsBySegment(segmentoId, {
        page: currentPage,
        limit: leadsPerPage,
        statusFilter: statusFilter,
        orderBy: 'nome_completo',
        orderDirection: 'asc'
      });

      setLeads(data.leads || []);
      setTotalPages(data.totalPages || 1);

    } catch (err) {
      console.error('Erro ao carregar leads:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusFilter = (status) => {
    setStatusFilter(status);
    setCurrentPage(1); // Reset para primeira página
  };

  const formatWhatsApp = (whatsapp) => {
    if (!whatsapp) return '-';
    // Formatar WhatsApp para exibição
    return whatsapp.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  };

  const formatEmail = (email) => {
    if (!email) return '-';
    // Truncar email longo
    return email.length > 25 ? email.substring(0, 25) + '...' : email;
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      'pending': { text: 'Pendente', class: 'status-pending' },
      'sent': { text: 'Enviado', class: 'status-sent' },
      'contacted': { text: 'Contatado', class: 'status-contacted' },
      'not_contacted': { text: 'Não Contatado', class: 'status-not-contacted' },
      'converted': { text: 'Convertido', class: 'status-converted' },
      'failed': { text: 'Falha', class: 'status-failed' }
    };

    const config = statusConfig[status] || { text: 'Desconhecido', class: 'status-unknown' };
    return <span className={`status-badge ${config.class}`}>{config.text}</span>;
  };

  const openLeadProfile = (leadId) => {
    const url = `https://oficialmed.sprinthub.app/sh/leads/profile/${leadId}`;
    window.open(url, '_blank');
  };

  if (!segmentoId) {
    return (
      <div className="leads-table-container">
        <div className="leads-table-header">
          <h3>Selecione um segmento para ver os leads</h3>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>
      </div>
    );
  }

  return (
    <div className="leads-table-container">
      <div className="leads-table-header">
        <div className="header-left">
          <h3>Leads do Segmento: {segmentoNome}</h3>
          <span className="segment-info">ID: {segmentoId}</span>
        </div>
        <button className="close-btn" onClick={onClose}>✕</button>
      </div>

      {/* Filtros */}
      <div className="leads-table-filters">
        <div className="filter-group">
          <label>Status:</label>
          <select 
            value={statusFilter} 
            onChange={(e) => handleStatusFilter(e.target.value)}
            className="filter-select"
          >
            <option value="all">Todos</option>
            <option value="pending">Pendente</option>
            <option value="sent">Enviado</option>
            <option value="contacted">Contatado</option>
            <option value="not_contacted">Não Contatado</option>
            <option value="converted">Convertido</option>
            <option value="failed">Falha</option>
          </select>
        </div>
        
        <div className="results-info">
          {leads.length > 0 && (
            <span>
              Mostrando {((currentPage - 1) * leadsPerPage) + 1} a {Math.min(currentPage * leadsPerPage, leads.length)} de {leads.length} leads
            </span>
          )}
        </div>
      </div>

      {/* Tabela */}
      <div className="leads-table-wrapper">
        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Carregando leads...</p>
          </div>
        ) : error ? (
          <div className="error-state">
            <p>❌ {error}</p>
            <button onClick={loadLeads} className="retry-btn">Tentar novamente</button>
          </div>
        ) : leads.length === 0 ? (
          <div className="empty-state">
            <p>📭 Nenhum lead encontrado para este segmento</p>
          </div>
        ) : (
          <table className="leads-table">
            <thead>
              <tr>
                <th>Nome</th>
                <th>WhatsApp</th>
                <th>E-mail</th>
                <th>Segmento</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((lead) => (
                <tr key={lead.id} className="lead-row">
                  <td className="lead-name">
                    {lead.nome_completo || 'Sem nome'}
                  </td>
                  <td className="lead-whatsapp">
                    {formatWhatsApp(lead.whatsapp)}
                  </td>
                  <td className="lead-email">
                    {formatEmail(lead.email)}
                  </td>
                  <td className="lead-segment">
                    {lead.nome_segmento || 'N/A'}
                  </td>
                  <td className="lead-status">
                    {getStatusBadge(lead.status_callix)}
                  </td>
                  <td className="lead-actions">
                    <button 
                      className="view-profile-btn"
                      onClick={() => openLeadProfile(lead.lead_id)}
                      title="Ver perfil no SprintHub"
                    >
                      👁️ Ver Perfil
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Paginação */}
      {totalPages > 1 && (
        <div className="leads-table-pagination">
          <button 
            className="pagination-btn"
            onClick={() => setCurrentPage(currentPage - 1)}
            disabled={currentPage === 1}
          >
            ← Anterior
          </button>
          
          <span className="pagination-info">
            Página {currentPage} de {totalPages}
          </span>
          
          <button 
            className="pagination-btn"
            onClick={() => setCurrentPage(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            Próxima →
          </button>
        </div>
      )}
    </div>
  );
};

export default LeadsTable;
