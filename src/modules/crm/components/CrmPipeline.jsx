/**
 * Componente de Pipeline de Oportunidades
 * 
 * Exibe oportunidades organizadas por estágios do pipeline
 */

import React from 'react';
import './CrmPipeline.css';
import CrmOpportunityCard from './CrmOpportunityCard';
import { groupOpportunitiesByStage } from '../utils/crmHelpers';

const CrmPipeline = ({ opportunities = [], onOpportunityClick }) => {
  const stages = [
    { id: 'prospeccao', label: 'Prospecção', color: '#3498db' },
    { id: 'qualificacao', label: 'Qualificação', color: '#9b59b6' },
    { id: 'proposta', label: 'Proposta', color: '#f39c12' },
    { id: 'negociacao', label: 'Negociação', color: '#e67e22' },
    { id: 'fechado', label: 'Fechado', color: '#27ae60' },
    { id: 'perdido', label: 'Perdido', color: '#e74c3c' }
  ];

  const grouped = groupOpportunitiesByStage(opportunities);

  return (
    <div className="CrmPipeline">
      <div className="CrmPipeline-container">
        {stages.map(stage => {
          const stageOpportunities = grouped[stage.id] || [];
          return (
            <div key={stage.id} className="CrmPipeline-column">
              <div
                className="CrmPipeline-header"
                style={{ borderTopColor: stage.color }}
              >
                <h3 className="CrmPipeline-stage-title">{stage.label}</h3>
                <span className="CrmPipeline-count">{stageOpportunities.length}</span>
              </div>
              <div className="CrmPipeline-opportunities">
                {stageOpportunities.length === 0 ? (
                  <p className="CrmPipeline-empty">Nenhuma oportunidade</p>
                ) : (
                  stageOpportunities.map(opp => (
                    <CrmOpportunityCard
                      key={opp.id}
                      opportunity={opp}
                      onClick={() => onOpportunityClick?.(opp)}
                    />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CrmPipeline;




