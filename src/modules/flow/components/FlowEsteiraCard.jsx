/**
 * Componente Card de Oportunidade na Esteira
 * 
 * Exibe informações do cliente em um card dentro da esteira
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './FlowEsteiraCard.css';
import { formatDate, formatDateTime } from '../utils/flowHelpers';

const FlowEsteiraCard = ({ 
  opportunity, 
  onMove, 
  onVenda, 
  onIncrementTentativas 
}) => {
  const navigate = useNavigate();
  const [showActions, setShowActions] = useState(false);
  const lead = opportunity.lead || {};

  const handleVenda = (e) => {
    e.stopPropagation();
    if (window.confirm('Confirmar venda e processar cliente?')) {
      onVenda(opportunity.id);
    }
  };

  const handleMove = (newEsteira, newEtapa = null) => {
    if (window.confirm(`Mover cliente para ${newEsteira}?`)) {
      onMove(opportunity.id, newEsteira, newEtapa);
    }
  };

  const handleIncrementTentativas = (e) => {
    e.stopPropagation();
    onIncrementTentativas(opportunity.id);
  };

  return (
    <div 
      className="FlowEsteiraCard"
      onClick={() => navigate(`/flow/lead/${opportunity.lead_id}`)}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div className="FlowEsteiraCard-header">
        <h3 className="FlowEsteiraCard-name">
          {lead.firstname && lead.lastname 
            ? `${lead.firstname} ${lead.lastname}` 
            : lead.firstname 
            || lead.lastname 
            || 'Lead sem nome'}
        </h3>
        {showActions && (
          <div className="FlowEsteiraCard-actions" onClick={(e) => e.stopPropagation()}>
            <button
              className="FlowEsteiraCard-action-btn"
              onClick={handleVenda}
              title="Processar Venda"
            >
              ✅
            </button>
            <button
              className="FlowEsteiraCard-action-btn"
              onClick={handleIncrementTentativas}
              title="Incrementar Tentativas"
            >
              ➕
            </button>
          </div>
        )}
      </div>

      <div className="FlowEsteiraCard-content">
        <p className="FlowEsteiraCard-info">
          <span className="FlowEsteiraCard-label">Email:</span>
          {lead.email || '-'}
        </p>
        <p className="FlowEsteiraCard-info">
          <span className="FlowEsteiraCard-label">Telefone:</span>
          {lead.phone || lead.whatsapp || '-'}
        </p>
        {opportunity.etapa && (
          <p className="FlowEsteiraCard-info">
            <span className="FlowEsteiraCard-label">Etapa:</span>
            <span className="FlowEsteiraCard-etapa">{opportunity.etapa.toUpperCase()}</span>
          </p>
        )}
        {opportunity.tentativas > 0 && (
          <p className="FlowEsteiraCard-info">
            <span className="FlowEsteiraCard-label">Tentativas:</span>
            {opportunity.tentativas}
          </p>
        )}
        <p className="FlowEsteiraCard-date">
          {formatDateTime(opportunity.created_at)}
        </p>
      </div>

      {showActions && (
        <div className="FlowEsteiraCard-quick-actions" onClick={(e) => e.stopPropagation()}>
          <button
            className="FlowEsteiraCard-quick-btn"
            onClick={() => handleMove('monitoramento_marketing', 'd30')}
          >
            📊 Monitoramento
          </button>
          <button
            className="FlowEsteiraCard-quick-btn"
            onClick={() => handleMove('reativacao_marketing', 'primeira')}
          >
            🔄 Reativação
          </button>
          <button
            className="FlowEsteiraCard-quick-btn"
            onClick={() => handleMove('ativacao_marketing')}
          >
            🎯 Ativação
          </button>
        </div>
      )}
    </div>
  );
};

export default FlowEsteiraCard;

