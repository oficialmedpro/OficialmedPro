/**
 * Componente Card do Kanban - Padrão SprintHub
 * 
 * Card individual de oportunidade no Kanban
 * Seguindo exatamente o formato visual da SprintHub
 */

import React from 'react';
import './CrmKanbanCard.css';
import { formatCurrency } from '../utils/crmHelpers';
import { Phone, Mail, MessageCircle, Calendar, Clock, MapPin } from 'lucide-react';

const CrmKanbanCard = ({ oportunidade, etapaId, vendedorInfo, onDragStart, onClick, onLeadClick }) => {
  const handleDragStart = (e) => {
    e.dataTransfer.effectAllowed = 'move';
    if (onDragStart) {
      onDragStart(e);
    }
  };

  const handleClick = (e) => {
    // Não abrir modal se estiver arrastando ou clicando em ícones
    if (e.target.closest('.CrmKanbanCard-action-icon')) {
      return;
    }
    // Se clicar no nome do lead (secondaryName), abrir modal do lead
    if (e.target.closest('.CrmKanbanCard-secondary-name') && onLeadClick && oportunidade.lead_id) {
      e.stopPropagation();
      onLeadClick(oportunidade.lead_id);
      return;
    }
    // Caso contrário, abrir modal da oportunidade
    if (onClick) {
      onClick(oportunidade);
    }
  };

  // Calcular dias desde criação
  const getDaysOld = () => {
    if (!oportunidade.create_date) return '0d';
    const created = new Date(oportunidade.create_date);
    const now = new Date();
    const diffTime = Math.abs(now - created);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return `${diffDays}d`;
  };

  // Nome principal (título da oportunidade)
  const mainName = oportunidade.title || 'Sem título';
  // Nome secundário (nome do lead)
  const secondaryName = oportunidade.lead_firstname || '';

  // Avatar do vendedor ou inicial do lead
  const getAvatarContent = () => {
    // Priorizar foto do vendedor se disponível
    if (vendedorInfo?.avatar_url) {
      return (
        <img 
          src={vendedorInfo.avatar_url} 
          alt={vendedorInfo.first_name || 'Vendedor'}
          className="CrmKanbanCard-avatar-img"
        />
      );
    }
    // Fallback para inicial do lead
    return secondaryName ? secondaryName.charAt(0).toUpperCase() : '?';
  };

  return (
    <div
      className="CrmKanbanCard"
      draggable
      onDragStart={handleDragStart}
      onClick={handleClick}
    >
      {/* Avatar e informações principais */}
      <div className="CrmKanbanCard-main">
        <div className="CrmKanbanCard-avatar">
          {getAvatarContent()}
        </div>
        <div className="CrmKanbanCard-names">
          <div className="CrmKanbanCard-main-name">{mainName}</div>
          {secondaryName && (
            <div 
              className="CrmKanbanCard-secondary-name"
              style={{ cursor: 'pointer', textDecoration: 'underline' }}
              title="Clique para ver detalhes do lead"
            >
              {secondaryName}
            </div>
          )}
        </div>
      </div>

      {/* Informações secundárias */}
      <div className="CrmKanbanCard-meta">
        <span className="CrmKanbanCard-days">Od {getDaysOld()}</span>
        <MapPin size={12} className="CrmKanbanCard-pin-icon" />
      </div>

      {/* Ícones de ação */}
      <div className="CrmKanbanCard-actions">
        <button className="CrmKanbanCard-action-icon" title="Telefone">
          <Phone size={16} />
        </button>
        <button className="CrmKanbanCard-action-icon" title="Email">
          <Mail size={16} />
        </button>
        <button className="CrmKanbanCard-action-icon" title="Chat">
          <MessageCircle size={16} />
        </button>
        <button className="CrmKanbanCard-action-icon CrmKanbanCard-calendar" title="Calendário">
          <Calendar size={16} />
          {Math.random() > 0.7 && (
            <span className="CrmKanbanCard-badge">{Math.floor(Math.random() * 3) + 1}</span>
          )}
        </button>
        <button className="CrmKanbanCard-action-icon" title="Tarefa">
          <Clock size={16} />
        </button>
      </div>

      {/* Valor */}
      <div className="CrmKanbanCard-value-section">
        <span className="CrmKanbanCard-currency">$</span>
        <span className="CrmKanbanCard-value">
          {formatCurrency(oportunidade.value || 0)}
        </span>
      </div>
    </div>
  );
};

export default CrmKanbanCard;
