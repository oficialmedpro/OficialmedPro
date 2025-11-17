/**
 * Página de Detalhes do Cliente no Flow
 * 
 * Exibe informações do cliente e sua posição atual no Flow
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './FlowClientePage.css';
import { useFlowCliente } from '../hooks/useFlowCliente';
import FlowHeader from '../components/FlowHeader';
import { formatDate, formatDateTime, getEsteiraInfo } from '../utils/flowHelpers';
import flowService from '../services/flowService';

const FlowClientePage = () => {
  const { leadId } = useParams();
  const navigate = useNavigate();
  const { lead, clienteMestre, primeCliente, oportunidade, history, loading, error } = useFlowCliente(leadId);
  const [moving, setMoving] = useState(false);
  const [esteiraInfo, setEsteiraInfo] = useState(null);

  useEffect(() => {
    const loadEsteiraInfo = async () => {
      if (oportunidade?.funil_id) {
        const info = await getEsteiraInfo(oportunidade.funil_id);
        setEsteiraInfo(info);
      }
    };
    loadEsteiraInfo();
  }, [oportunidade]);

  const handleMoveToEsteira = async (newEsteira, newEtapa = null) => {
    if (!oportunidade) return;
    
    try {
      setMoving(true);
      await flowService.moveToEsteira(oportunidade.id, newEsteira, newEtapa);
      window.location.reload(); // Recarregar para atualizar dados
    } catch (error) {
      console.error('Erro ao mover cliente:', error);
      alert('Erro ao mover cliente para nova esteira');
    } finally {
      setMoving(false);
    }
  };

  const handleProcessVenda = async () => {
    if (!oportunidade) return;
    
    try {
      setMoving(true);
      await flowService.processVenda(oportunidade.id);
      alert('Venda processada! Cliente movido para Laboratório → Logística → Monitoramento');
      window.location.reload();
    } catch (error) {
      console.error('Erro ao processar venda:', error);
      alert('Erro ao processar venda');
    } finally {
      setMoving(false);
    }
  };

  if (loading) {
    return (
      <div className="FlowClientePage">
        <FlowHeader />
        <div className="FlowClientePage-loading">Carregando...</div>
      </div>
    );
  }

  if (error || !lead) {
    return (
      <div className="FlowClientePage">
        <FlowHeader />
        <div className="FlowClientePage-error">
          {error || 'Lead não encontrado'}
        </div>
      </div>
    );
  }

  return (
    <div className="FlowClientePage">
      <FlowHeader />
      
      <div className="FlowClientePage-content">
        <button 
          className="FlowClientePage-back-btn"
          onClick={() => navigate('/flow')}
        >
          ← Voltar
        </button>

        <div className="FlowClientePage-header">
          <div>
            <h1 className="FlowClientePage-title">
              {lead.firstname && lead.lastname 
                ? `${lead.firstname} ${lead.lastname}` 
                : clienteMestre?.nome_completo 
                || lead.firstname 
                || lead.lastname 
                || 'Lead'}
            </h1>
            <p className="FlowClientePage-subtitle">
              {lead.email || clienteMestre?.email} • {lead.phone || lead.whatsapp || clienteMestre?.whatsapp || clienteMestre?.telefone}
              {primeCliente && ' • ✅ Cliente Prime'}
            </p>
          </div>
        </div>

        <div className="FlowClientePage-grid">
          {/* Card de Posição Atual */}
          <div className="FlowClientePage-card">
            <h2 className="FlowClientePage-card-title">Posição Atual no Flow</h2>
            {oportunidade ? (
              <div className="FlowClientePage-esteira-info">
                <div 
                  className="FlowClientePage-esteira-badge"
                  style={{ backgroundColor: esteiraInfo?.color || '#64748b' }}
                >
                  {esteiraInfo?.name || oportunidade?.funil?.nome_funil || 'Sem esteira'}
                </div>
                {oportunidade.etapa && (
                  <p className="FlowClientePage-etapa">Etapa: {oportunidade.etapa.toUpperCase()}</p>
                )}
                <p className="FlowClientePage-tentativas">
                  Tentativas: {oportunidade.tentativas || 0}
                </p>
                <p className="FlowClientePage-date">
                  Entrou em: {formatDateTime(oportunidade.created_at)}
                </p>
              </div>
            ) : (
              <p className="FlowClientePage-no-opportunity">
                Cliente não está em nenhuma esteira ativa
              </p>
            )}
          </div>

          {/* Card de Informações do Cliente */}
          <div className="FlowClientePage-card">
            <h2 className="FlowClientePage-card-title">Informações do Cliente</h2>
            <div className="FlowClientePage-info-list">
              <div className="FlowClientePage-info-item">
                <span className="FlowClientePage-info-label">CPF:</span>
                <span className="FlowClientePage-info-value">{clienteMestre?.cpf || lead.cpf || '-'}</span>
              </div>
              <div className="FlowClientePage-info-item">
                <span className="FlowClientePage-info-label">Email:</span>
                <span className="FlowClientePage-info-value">{lead.email || clienteMestre?.email || '-'}</span>
              </div>
              <div className="FlowClientePage-info-item">
                <span className="FlowClientePage-info-label">Telefone:</span>
                <span className="FlowClientePage-info-value">{lead.phone || lead.whatsapp || clienteMestre?.telefone || clienteMestre?.whatsapp || '-'}</span>
              </div>
              {primeCliente && (
                <div className="FlowClientePage-info-item">
                  <span className="FlowClientePage-info-label">Cliente Prime:</span>
                  <span className="FlowClientePage-info-value">✅ Sim (Código: {primeCliente.codigo_cliente_original})</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Ações Rápidas */}
        {oportunidade && (
          <div className="FlowClientePage-actions">
            <h2 className="FlowClientePage-section-title">Ações Rápidas</h2>
            <div className="FlowClientePage-actions-grid">
              <button
                className="FlowClientePage-action-btn primary"
                onClick={handleProcessVenda}
                disabled={moving}
              >
                ✅ Processar Venda
              </button>
              <button
                className="FlowClientePage-action-btn"
                onClick={() => handleMoveToEsteira('Monitoramento Marketing', 'd30')}
                disabled={moving}
              >
                📊 Monitoramento Marketing
              </button>
              <button
                className="FlowClientePage-action-btn"
                onClick={() => handleMoveToEsteira('Reativação Marketing', 'primeira')}
                disabled={moving}
              >
                🔄 Reativação Marketing
              </button>
              <button
                className="FlowClientePage-action-btn"
                onClick={() => handleMoveToEsteira('Ativação Marketing')}
                disabled={moving}
              >
                🎯 Ativação Marketing
              </button>
            </div>
          </div>
        )}

        {/* Histórico */}
        {history.length > 0 && (
          <div className="FlowClientePage-history">
            <h2 className="FlowClientePage-section-title">Histórico de Movimentações</h2>
            <div className="FlowClientePage-history-list">
              {history.map((item, index) => (
                <div key={item.id || index} className="FlowClientePage-history-item">
                  <div className="FlowClientePage-history-esteira">
                    <span 
                      className="FlowClientePage-history-badge"
                      style={{ backgroundColor: '#64748b' }}
                    >
                      {item.funil?.nome_funil || 'Sem esteira'}
                    </span>
                    {item.etapa && (
                      <span className="FlowClientePage-history-etapa">{item.etapa}</span>
                    )}
                  </div>
                  <div className="FlowClientePage-history-dates">
                    <span>Entrada: {formatDateTime(item.created_at)}</span>
                    {item.closed_at && (
                      <span>Saída: {formatDateTime(item.closed_at)}</span>
                    )}
                    {!item.closed_at && (
                      <span className="FlowClientePage-history-active">Ativo</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FlowClientePage;

