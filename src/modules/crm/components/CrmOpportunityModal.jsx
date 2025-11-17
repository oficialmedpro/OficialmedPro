/**
 * Modal de Detalhes da Oportunidade
 * 
 * Modal que abre da direita para esquerda mostrando todos os detalhes
 * da oportunidade, com abas das etapas e todas as seções necessárias
 */

import React, { useState, useEffect } from 'react';
import './CrmOpportunityModal.css';
import { X, CheckCircle, XCircle, Settings } from 'lucide-react';
import crmKanbanService from '../services/crmKanbanService';
import { formatCurrency } from '../utils/crmHelpers';

const CrmOpportunityModal = ({ 
  oportunidade, 
  etapas, 
  etapaAtualId,
  vendedorInfo,
  onClose,
  onUpdate 
}) => {
  const [activeTab, setActiveTab] = useState(etapaAtualId || null);
  const [activeContentTab, setActiveContentTab] = useState('historico');
  const [oportunidadeDetalhes, setOportunidadeDetalhes] = useState(oportunidade);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Definir aba ativa como a etapa atual da oportunidade
    // Converter para número para garantir comparação correta
    const etapaAtualNum = etapaAtualId ? Number(etapaAtualId) : null;
    
    if (etapaAtualNum && etapas.length > 0) {
      // Verificar se a etapaAtualId corresponde a alguma etapa
      // Comparar convertendo ambos para número
      const etapaEncontrada = etapas.find(e => Number(e.id_etapa_sprint) === etapaAtualNum);
      
      if (etapaEncontrada) {
        console.log('[CrmOpportunityModal] Etapa encontrada:', {
          etapaAtualId: etapaAtualNum,
          etapaEncontrada: etapaEncontrada.id_etapa_sprint,
          nome: etapaEncontrada.nome_etapa
        });
        setActiveTab(etapaEncontrada.id_etapa_sprint);
      } else {
        console.warn('[CrmOpportunityModal] Etapa não encontrada:', {
          etapaAtualId: etapaAtualNum,
          etapasDisponiveis: etapas.map(e => ({ id: e.id_etapa_sprint, nome: e.nome_etapa }))
        });
        // Se não encontrar, usar a primeira etapa
        if (etapas.length > 0) {
          setActiveTab(etapas[0].id_etapa_sprint);
        }
      }
    } else if (etapas.length > 0) {
      setActiveTab(etapas[0].id_etapa_sprint);
    }
  }, [etapaAtualId, etapas]);

  useEffect(() => {
    // Buscar detalhes completos da oportunidade
    if (oportunidade?.id) {
      loadDetalhes();
    }
  }, [oportunidade?.id]);

  const loadDetalhes = async () => {
    try {
      setLoading(true);
      const detalhes = await crmKanbanService.fetchOportunidadeDetalhes(oportunidade.id);
      setOportunidadeDetalhes(detalhes || oportunidade);
    } catch (error) {
      console.error('Erro ao buscar detalhes:', error);
    } finally {
      setLoading(false);
    }
  };

  // Formatar data
  const formatDate = (dateString) => {
    if (!dateString) return 'Campo não preenchido';
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Obter cor da etapa
  const getEtapaColor = (etapa) => {
    const ordem = etapa?.ordem_etapa || 0;
    const colors = {
      0: '#ef4444', // Vermelho
      1: '#8b5cf6', // Roxo
      2: '#f59e0b', // Laranja
      3: '#8b5cf6', // Roxo
      4: '#fbbf24', // Amarelo
      5: '#10b981', // Verde
      6: '#10b981'  // Verde
    };
    return colors[ordem] || '#8b5cf6';
  };

  return (
    <div className="CrmOpportunityModal-overlay" onClick={onClose}>
      <div 
        className="CrmOpportunityModal-container"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="CrmOpportunityModal-header">
          <div className="CrmOpportunityModal-header-top">
            <div className="CrmOpportunityModal-header-left">
              <h2 className="CrmOpportunityModal-title">
                {oportunidadeDetalhes?.title || 'Sem título'}
              </h2>
            </div>
            
            <div className="CrmOpportunityModal-header-right">
              <button 
                className="CrmOpportunityModal-btn-ganhou"
                onClick={() => {/* TODO: Implementar ganhou */}}
              >
                <CheckCircle size={16} />
                Ganhou
              </button>
              <button 
                className="CrmOpportunityModal-btn-perdeu"
                onClick={() => {/* TODO: Implementar perdeu */}}
              >
                <XCircle size={16} />
                Perdeu
              </button>
              <button 
                className="CrmOpportunityModal-btn-settings"
                onClick={() => {/* TODO: Implementar settings */}}
              >
                <Settings size={18} />
              </button>
            </div>
          </div>
          
          {/* Abas das etapas - abaixo do título */}
          <div className="CrmOpportunityModal-stages">
            {etapas.map((etapa) => {
              // Comparar convertendo ambos para número para garantir match correto
              const etapaIdNum = Number(etapa.id_etapa_sprint);
              const activeTabNum = activeTab ? Number(activeTab) : null;
              const isActive = activeTabNum === etapaIdNum;
              const etapaColor = getEtapaColor(etapa);
              return (
                <button
                  key={etapa.id_etapa_sprint}
                  className={`CrmOpportunityModal-stage-tab ${isActive ? 'active' : ''}`}
                  style={{
                    color: isActive ? etapaColor : undefined,
                    borderBottomColor: isActive ? etapaColor : undefined
                  }}
                  onClick={() => setActiveTab(etapa.id_etapa_sprint)}
                >
                  {etapa.nome_etapa}
                </button>
              );
            })}
          </div>
        </div>
        
        {/* Botão de fechar flutuante */}
        <button 
          className="CrmOpportunityModal-close-btn"
          onClick={onClose}
          title="Fechar"
        >
          <X size={20} />
        </button>

        {/* Content */}
        <div className="CrmOpportunityModal-content">
          <div className="CrmOpportunityModal-left-panel">
            {/* Seção Geral */}
            <div className="CrmOpportunityModal-section">
              <div className="CrmOpportunityModal-section-header">
                <h3>Geral</h3>
                <button className="CrmOpportunityModal-section-settings">
                  <Settings size={14} />
                </button>
              </div>

              {/* Sobre o negócio */}
              <div className="CrmOpportunityModal-subsection">
                <h4>Sobre o negócio</h4>
                <div className="CrmOpportunityModal-field">
                  <label>Valor</label>
                  <div className="CrmOpportunityModal-value">
                    {formatCurrency(oportunidadeDetalhes?.value || 0)}
                  </div>
                </div>
                <div className="CrmOpportunityModal-field">
                  <label>Data de Criação</label>
                  <div className="CrmOpportunityModal-field-value">
                    {formatDate(oportunidadeDetalhes?.create_date)}
                  </div>
                </div>
                <div className="CrmOpportunityModal-field">
                  <label>Data de fechamento esperada</label>
                  <div className="CrmOpportunityModal-field-value">
                    {oportunidadeDetalhes?.expected_close_date 
                      ? formatDate(oportunidadeDetalhes.expected_close_date)
                      : 'Campo não preenchido'}
                  </div>
                </div>
                <div className="CrmOpportunityModal-field">
                  <label>Status</label>
                  <div className="CrmOpportunityModal-status">
                    {oportunidadeDetalhes?.status === 'open' ? 'Aberto' : 
                     oportunidadeDetalhes?.status === 'won' ? 'Ganhou' : 
                     oportunidadeDetalhes?.status === 'lost' ? 'Perdeu' : 'Aberto'}
                  </div>
                </div>
                <div className="CrmOpportunityModal-field">
                  <label>Responsável</label>
                  <div className="CrmOpportunityModal-responsavel">
                    {vendedorInfo?.avatar_url ? (
                      <img 
                        src={vendedorInfo.avatar_url} 
                        alt={vendedorInfo.first_name}
                        className="CrmOpportunityModal-avatar"
                      />
                    ) : (
                      <div className="CrmOpportunityModal-avatar-placeholder">
                        {vendedorInfo?.first_name?.charAt(0) || '?'}
                      </div>
                    )}
                    <span>
                      {vendedorInfo?.first_name && vendedorInfo?.last_name
                        ? `${vendedorInfo.first_name} ${vendedorInfo.last_name}`
                        : vendedorInfo?.first_name || 'Não atribuído'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Contato */}
              <div className="CrmOpportunityModal-subsection">
                <h4>Contato</h4>
                <div className="CrmOpportunityModal-empty-section">
                  Nenhum campo adicionado nessa seção.
                </div>
              </div>

              {/* Social */}
              <div className="CrmOpportunityModal-subsection">
                <h4>Social</h4>
                <div className="CrmOpportunityModal-empty-section">
                  Nenhum campo adicionado nessa seção.
                </div>
              </div>
            </div>
          </div>

          <div className="CrmOpportunityModal-right-panel">
            {/* Tabs de conteúdo */}
            <div className="CrmOpportunityModal-content-tabs">
              <button 
                className={`CrmOpportunityModal-content-tab ${activeContentTab === 'historico' ? 'active' : ''}`}
                onClick={() => setActiveContentTab('historico')}
              >
                Histórico
              </button>
              <button 
                className={`CrmOpportunityModal-content-tab ${activeContentTab === 'comentarios' ? 'active' : ''}`}
                onClick={() => setActiveContentTab('comentarios')}
              >
                Comentários
              </button>
              <button 
                className={`CrmOpportunityModal-content-tab ${activeContentTab === 'tarefas' ? 'active' : ''}`}
                onClick={() => setActiveContentTab('tarefas')}
              >
                Tarefas
              </button>
              <button 
                className={`CrmOpportunityModal-content-tab ${activeContentTab === 'atendimentos' ? 'active' : ''}`}
                onClick={() => setActiveContentTab('atendimentos')}
              >
                Atendimentos
              </button>
              <button 
                className={`CrmOpportunityModal-content-tab ${activeContentTab === 'email' ? 'active' : ''}`}
                onClick={() => setActiveContentTab('email')}
              >
                E-mail
              </button>
              <button 
                className={`CrmOpportunityModal-content-tab ${activeContentTab === 'ligacoes' ? 'active' : ''}`}
                onClick={() => setActiveContentTab('ligacoes')}
              >
                Ligações
              </button>
              <button 
                className={`CrmOpportunityModal-content-tab ${activeContentTab === 'produtos' ? 'active' : ''}`}
                onClick={() => setActiveContentTab('produtos')}
              >
                Produtos e Serviços
              </button>
              <button 
                className={`CrmOpportunityModal-content-tab ${activeContentTab === 'propostas' ? 'active' : ''}`}
                onClick={() => setActiveContentTab('propostas')}
              >
                Propostas
              </button>
            </div>

            {/* Conteúdo da aba ativa */}
            <div className="CrmOpportunityModal-content-area">
              {activeContentTab === 'historico' && (
                <div className="CrmOpportunityModal-history">
                  <div className="CrmOpportunityModal-history-header">
                    <span className="CrmOpportunityModal-history-date">
                      {new Date().toLocaleDateString('pt-BR', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </span>
                    <button className="CrmOpportunityModal-filter-btn">
                      Filtrar
                    </button>
                  </div>
                  
                  {/* Histórico de movimentação */}
                  <div className="CrmOpportunityModal-history-item">
                    <div className="CrmOpportunityModal-history-icon">
                      <div className="CrmOpportunityModal-history-dot"></div>
                    </div>
                    <div className="CrmOpportunityModal-history-content">
                      <div className="CrmOpportunityModal-history-text">
                        Etapa alterada
                      </div>
                      <div className="CrmOpportunityModal-history-details">
                        <span className="CrmOpportunityModal-history-from">REATIVAR</span>
                        <span className="CrmOpportunityModal-history-arrow">→</span>
                        <span className="CrmOpportunityModal-history-to">R60</span>
                      </div>
                    </div>
                    <div className="CrmOpportunityModal-history-meta">
                      <span className="CrmOpportunityModal-history-time">13:58</span>
                      <div className="CrmOpportunityModal-history-user">
                        {vendedorInfo?.avatar_url ? (
                          <img 
                            src={vendedorInfo.avatar_url} 
                            alt={vendedorInfo.first_name}
                            className="CrmOpportunityModal-history-avatar"
                          />
                        ) : (
                          <div className="CrmOpportunityModal-history-avatar-placeholder">
                            {vendedorInfo?.first_name?.charAt(0) || '?'}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeContentTab === 'comentarios' && (
                <div className="CrmOpportunityModal-tab-content">
                  <div className="CrmOpportunityModal-empty-state">
                    Seção de comentários em desenvolvimento
                  </div>
                </div>
              )}

              {activeContentTab === 'tarefas' && (
                <div className="CrmOpportunityModal-tab-content">
                  <div className="CrmOpportunityModal-empty-state">
                    Seção de tarefas em desenvolvimento
                  </div>
                </div>
              )}

              {activeContentTab === 'atendimentos' && (
                <div className="CrmOpportunityModal-tab-content">
                  <div className="CrmOpportunityModal-empty-state">
                    Seção de atendimentos em desenvolvimento
                  </div>
                </div>
              )}

              {activeContentTab === 'email' && (
                <div className="CrmOpportunityModal-tab-content">
                  <div className="CrmOpportunityModal-empty-state">
                    Seção de e-mail em desenvolvimento
                  </div>
                </div>
              )}

              {activeContentTab === 'ligacoes' && (
                <div className="CrmOpportunityModal-tab-content">
                  <div className="CrmOpportunityModal-empty-state">
                    Seção de ligações em desenvolvimento
                  </div>
                </div>
              )}

              {activeContentTab === 'produtos' && (
                <div className="CrmOpportunityModal-tab-content">
                  <div className="CrmOpportunityModal-empty-state">
                    Seção de produtos e serviços em desenvolvimento
                  </div>
                </div>
              )}

              {activeContentTab === 'propostas' && (
                <div className="CrmOpportunityModal-tab-content">
                  <div className="CrmOpportunityModal-empty-state">
                    Seção de propostas em desenvolvimento
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CrmOpportunityModal;

