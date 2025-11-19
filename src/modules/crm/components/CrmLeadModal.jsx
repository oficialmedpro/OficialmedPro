/**
 * Modal de Detalhes do Lead
 * 
 * Modal que abre da direita para esquerda mostrando todos os detalhes
 * do lead, similar ao modal de oportunidade mas com informações do contato
 */

import React, { useState, useEffect } from 'react';
import './CrmLeadModal.css';
import { X, Headphones, Bell, MoreVertical, Copy, Search, Edit, Settings, Plus, Star, Phone, Mail, MapPin, CheckCircle, TrendingUp, TrendingDown, DollarSign, Calendar, AlertCircle, Grid, User, Building, Wrench } from 'lucide-react';
import crmLeadService from '../services/crmLeadService';
import crmKanbanService from '../services/crmKanbanService';
import { formatCurrency } from '../utils/crmHelpers';

const CrmLeadModal = ({ leadId, onClose }) => {
  const [lead, setLead] = useState(null);
  const [oportunidades, setOportunidades] = useState([]);
  const [activeTab, setActiveTab] = useState('visao-geral');
  const [showMoreTabs, setShowMoreTabs] = useState(false);
  const [loading, setLoading] = useState(true);
  const [responsavelInfo, setResponsavelInfo] = useState(null);

  useEffect(() => {
    if (leadId) {
      loadLeadData();
    }
  }, [leadId]);

  const loadLeadData = async () => {
    try {
      setLoading(true);
      const leadData = await crmLeadService.fetchLeadDetalhes(leadId);
      setLead(leadData);
      
      // Buscar oportunidades do lead
      if (leadData) {
        const opps = await crmLeadService.fetchOportunidadesPorLead(leadId);
        setOportunidades(opps || []);
        
        // Buscar informações do responsável se houver
        if (leadData.owner) {
          const responsavel = await crmKanbanService.fetchVendedorInfo(leadData.owner);
          setResponsavelInfo(responsavel);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar dados do lead:', error);
    } finally {
      setLoading(false);
    }
  };

  // Formatar data
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Calcular totais das oportunidades
  const calcularTotais = () => {
    const ganho = oportunidades
      .filter(opp => opp.status === 'won')
      .reduce((sum, opp) => sum + (parseFloat(opp.value) || 0), 0);
    
    const perdido = oportunidades
      .filter(opp => opp.status === 'lost')
      .reduce((sum, opp) => sum + (parseFloat(opp.value) || 0), 0);
    
    const pendente = oportunidades
      .filter(opp => opp.status === 'open')
      .reduce((sum, opp) => sum + (parseFloat(opp.value) || 0), 0);
    
    return { ganho, perdido, pendente };
  };

  const totais = calcularTotais();
  const nomeCompleto = lead ? `${lead.firstname || ''} ${lead.lastname || ''}`.trim() : '';
  const inicialNome = nomeCompleto ? nomeCompleto.charAt(0).toUpperCase() : '?';

  if (loading) {
    return (
      <div className="CrmLeadModal-overlay" onClick={onClose}>
        <div className="CrmLeadModal-container" onClick={(e) => e.stopPropagation()}>
          <div className="CrmLeadModal-loading">Carregando...</div>
        </div>
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="CrmLeadModal-overlay" onClick={onClose}>
        <div className="CrmLeadModal-container" onClick={(e) => e.stopPropagation()}>
          <div className="CrmLeadModal-error">Lead não encontrado</div>
        </div>
      </div>
    );
  }

  return (
    <div className="CrmLeadModal-overlay" onClick={onClose}>
      <div 
        className="CrmLeadModal-container"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="CrmLeadModal-header">
          <div className="CrmLeadModal-header-top">
            <div className="CrmLeadModal-header-left">
              <button className="CrmLeadModal-close-header" onClick={onClose}>
                <X size={16} />
                Fechar
              </button>
              <h2 className="CrmLeadModal-title">
                Contato #{lead.id}
              </h2>
              <span className="CrmLeadModal-tag">Nenhum</span>
              <button className="CrmLeadModal-copy-link">
                <Copy size={14} />
                Copiar link
              </button>
            </div>
            
            <div className="CrmLeadModal-header-right">
              <button className="CrmLeadModal-btn-atendimento">
                <Headphones size={16} />
                Iniciar Atendimento
              </button>
              <button className="CrmLeadModal-btn-lembreme">
                <Bell size={16} />
                Lembre-me
              </button>
              <button className="CrmLeadModal-btn-more">
                <MoreVertical size={18} />
              </button>
            </div>
          </div>
        </div>
        
        {/* Botão de fechar flutuante */}
        <button 
          className="CrmLeadModal-close-btn"
          onClick={onClose}
          title="Fechar"
        >
          <X size={20} />
        </button>

        {/* Content */}
        <div className="CrmLeadModal-content">
          {/* Left Panel */}
          <div className="CrmLeadModal-left-panel">
            {/* Perfil do Contato */}
            <div className="CrmLeadModal-profile-section">
              {lead.photo_url ? (
                <img 
                  src={lead.photo_url} 
                  alt={nomeCompleto}
                  className="CrmLeadModal-profile-photo"
                />
              ) : (
                <div className="CrmLeadModal-profile-photo-placeholder">
                  {inicialNome}
                </div>
              )}
              <h3 className="CrmLeadModal-profile-name">{nomeCompleto || 'Sem nome'}</h3>
              <div className="CrmLeadModal-profile-points">
                {lead.points || 0} Pontos
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={16} className="CrmLeadModal-star-empty" />
                ))}
              </div>
              
              {/* Telefones */}
              {lead.whatsapp && (
                <div className="CrmLeadModal-contact-item">
                  <Phone size={16} className="CrmLeadModal-contact-icon" />
                  <span>{lead.whatsapp}</span>
                  <CheckCircle size={14} className="CrmLeadModal-check-icon" />
                  <Phone size={16} className="CrmLeadModal-call-icon" />
                </div>
              )}
              {lead.phone && (
                <div className="CrmLeadModal-contact-item">
                  <Phone size={16} className="CrmLeadModal-contact-icon" />
                  <span>{lead.phone}</span>
                  <CheckCircle size={14} className="CrmLeadModal-check-icon" />
                  <Phone size={16} className="CrmLeadModal-call-icon" />
                </div>
              )}
              
              {/* Endereço */}
              {lead.address && (
                <div className="CrmLeadModal-contact-item">
                  <MapPin size={16} className="CrmLeadModal-contact-icon" />
                  <span>
                    {lead.address}
                    {lead.city && `, ${lead.city}`}
                    {lead.state && `, ${lead.state}`}
                    {lead.zipcode && `, ${lead.zipcode}`}
                    {lead.country && `, ${lead.country}`}
                  </span>
                </div>
              )}
            </div>

            {/* Informações Completas */}
            <div className="CrmLeadModal-section">
              <div className="CrmLeadModal-section-header">
                <div>
                  <h3>Informações Completas</h3>
                  <p className="CrmLeadModal-section-subtitle">
                    Os campos customizados do seu contato.
                  </p>
                </div>
                <div className="CrmLeadModal-section-actions">
                  <button className="CrmLeadModal-icon-btn">
                    <Search size={14} />
                  </button>
                  <button className="CrmLeadModal-icon-btn">
                    <Edit size={14} />
                  </button>
                </div>
              </div>

              {/* Pessoal */}
              <div className="CrmLeadModal-collapsible">
                <div className="CrmLeadModal-collapsible-header">
                  <User size={16} />
                  <span>Pessoal</span>
                </div>
                <div className="CrmLeadModal-collapsible-content">
                  {lead.timezone && (
                    <div className="CrmLeadModal-field">
                      <label>Fuso Horário</label>
                      <div className="CrmLeadModal-field-value">{lead.timezone}</div>
                    </div>
                  )}
                  {lead.preferred_locale && (
                    <div className="CrmLeadModal-field">
                      <label>Idioma</label>
                      <div className="CrmLeadModal-field-value">{lead.preferred_locale}</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Principal */}
              <div className="CrmLeadModal-collapsible">
                <div className="CrmLeadModal-collapsible-header">
                  <Grid size={16} />
                  <span>Principal</span>
                </div>
              </div>

              <div className="CrmLeadModal-toggle-section">
                <label className="CrmLeadModal-toggle">
                  <input type="checkbox" />
                  <span>Exibir campos ocultos/vazios</span>
                </label>
              </div>

              <div className="CrmLeadModal-edit-buttons">
                <button className="CrmLeadModal-edit-view-btn">
                  Editar Visualização
                </button>
                <button className="CrmLeadModal-edit-btn">
                  <Edit size={14} />
                  Editar
                </button>
              </div>
            </div>

            {/* Informações da Empresa Principal */}
            <div className="CrmLeadModal-section">
              <div className="CrmLeadModal-section-header">
                <div>
                  <h3>Informações da Empresa Principal</h3>
                  <p className="CrmLeadModal-section-subtitle">
                    Informações da empresa principal do contato.
                  </p>
                </div>
                <button className="CrmLeadModal-icon-btn">
                  <Plus size={14} />
                </button>
              </div>
              <div className="CrmLeadModal-empty-section">
                <div className="CrmLeadModal-field">
                  <label>Nome</label>
                  <div className="CrmLeadModal-field-value">-</div>
                </div>
                <div className="CrmLeadModal-field">
                  <label>Email</label>
                  <div className="CrmLeadModal-field-value">-</div>
                </div>
                <div className="CrmLeadModal-field">
                  <label>Telefone</label>
                  <div className="CrmLeadModal-field-value">-</div>
                </div>
                <div className="CrmLeadModal-field">
                  <label>Endereço</label>
                  <div className="CrmLeadModal-field-value">-</div>
                </div>
              </div>
            </div>

            {/* Dados do Sistema */}
            <div className="CrmLeadModal-section">
              <div className="CrmLeadModal-section-header">
                <h3>Dados do Sistema</h3>
              </div>

              {/* Responsável */}
              {responsavelInfo && (
                <div className="CrmLeadModal-field">
                  <label>Responsável</label>
                  <div className="CrmLeadModal-responsavel">
                    {responsavelInfo.avatar_url ? (
                      <img 
                        src={responsavelInfo.avatar_url} 
                        alt={responsavelInfo.first_name}
                        className="CrmLeadModal-avatar-small"
                      />
                    ) : (
                      <div className="CrmLeadModal-avatar-small-placeholder">
                        {responsavelInfo.first_name?.charAt(0) || '?'}
                      </div>
                    )}
                    <span>
                      {responsavelInfo.first_name && responsavelInfo.last_name
                        ? `${responsavelInfo.first_name} ${responsavelInfo.last_name}`
                        : responsavelInfo.first_name || 'Não atribuído'}
                    </span>
                  </div>
                </div>
              )}

              {/* Tags */}
              <div className="CrmLeadModal-field">
                <label>Tags</label>
                <div className="CrmLeadModal-tags">
                  <span className="CrmLeadModal-tag-item">REATIVAÇÃO</span>
                  <button className="CrmLeadModal-icon-btn-small">
                    <Edit size={12} />
                  </button>
                </div>
              </div>

              {/* Segmentos */}
              <div className="CrmLeadModal-field">
                <label>Segmentos</label>
                <div className="CrmLeadModal-tags">
                  <span className="CrmLeadModal-tag-item">Geral</span>
                  <span className="CrmLeadModal-tag-item">TODOS LEADS COM TAG</span>
                  <span className="CrmLeadModal-tag-item">oficial-ganhos</span>
                  <span className="CrmLeadModal-tag-item">Contatos VIP</span>
                  <span className="CrmLeadModal-tag-item">Contatos Apucarana</span>
                  <span className="CrmLeadModal-tag-item">Tem CPF</span>
                  <span className="CrmLeadModal-tag-item">REATIVAÇÃO 12/11</span>
                  <span className="CrmLeadModal-tag-item">Telefone</span>
                  <span className="CrmLeadModal-tag-item">Whatsapp Válido</span>
                  <button className="CrmLeadModal-icon-btn-small">
                    <Edit size={12} />
                  </button>
                </div>
              </div>

              {/* Permissões de Acesso */}
              <div className="CrmLeadModal-field">
                <label>Permissões de Acesso</label>
                <div className="CrmLeadModal-permissions">
                  <div className="CrmLeadModal-permission-group">
                    <User size={14} />
                    <span>Usuários com Acesso</span>
                  </div>
                  <div className="CrmLeadModal-tags">
                    <span className="CrmLeadModal-tag-item">Isabella Bernardo</span>
                    <span className="CrmLeadModal-tag-item">Gabrielli Henriques</span>
                    <span className="CrmLeadModal-tag-item">Gustavo de Paula</span>
                  </div>
                  
                  <div className="CrmLeadModal-permission-group">
                    <Building size={14} />
                    <span>Departamentos com Acesso</span>
                  </div>
                  <div className="CrmLeadModal-tags">
                    <span className="CrmLeadModal-tag-item CrmLeadModal-tag-department">
                      [1-OFM] MATRIZ - APUCARANA - Franquia
                    </span>
                    <span className="CrmLeadModal-tag-item CrmLeadModal-tag-department">
                      [1-OFM] MATRIZ - APUCARANA - Supervisão Manipulação
                    </span>
                    <span className="CrmLeadModal-tag-item CrmLeadModal-tag-department">
                      [1-OFM] Atendente Farmácia Manipulação
                    </span>
                  </div>
                </div>
              </div>

              <button className="CrmLeadModal-edit-btn-full">
                <Wrench size={14} />
                Editar
              </button>

              {/* Metadados */}
              <div className="CrmLeadModal-metadata">
                <div className="CrmLeadModal-metadata-item">
                  <label>Criado em</label>
                  <span>{formatDate(lead.create_date)}</span>
                </div>
                <div className="CrmLeadModal-metadata-item">
                  <label>Atualizado</label>
                  <span>{formatDate(lead.updated_date)}</span>
                </div>
                <div className="CrmLeadModal-metadata-item">
                  <label>Criado por</label>
                  <span>{lead.created_by_name || lead.created_by || '-'}</span>
                </div>
                <div className="CrmLeadModal-metadata-item">
                  <label>ID Sistema</label>
                  <span>{lead.id}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Panel */}
          <div className="CrmLeadModal-right-panel">
            {/* Tabs de conteúdo */}
            <div className="CrmLeadModal-content-tabs">
              <button 
                className={`CrmLeadModal-content-tab ${activeTab === 'visao-geral' ? 'active' : ''}`}
                onClick={() => setActiveTab('visao-geral')}
              >
                Visão Geral
              </button>
              <button 
                className={`CrmLeadModal-content-tab ${activeTab === 'atendimentos' ? 'active' : ''}`}
                onClick={() => setActiveTab('atendimentos')}
              >
                Atendimentos ({oportunidades.length > 0 ? '3' : '0'})
              </button>
              <button 
                className={`CrmLeadModal-content-tab ${activeTab === 'oportunidades' ? 'active' : ''}`}
                onClick={() => setActiveTab('oportunidades')}
              >
                Oportunidades ({oportunidades.length})
              </button>
              <button 
                className={`CrmLeadModal-content-tab ${activeTab === 'reunioes' ? 'active' : ''}`}
                onClick={() => setActiveTab('reunioes')}
              >
                Reuniões
              </button>
              <button 
                className={`CrmLeadModal-content-tab ${activeTab === 'propostas' ? 'active' : ''}`}
                onClick={() => setActiveTab('propostas')}
              >
                Propostas
              </button>
              <button 
                className={`CrmLeadModal-content-tab ${activeTab === 'faturas' ? 'active' : ''}`}
                onClick={() => setActiveTab('faturas')}
              >
                Faturas
              </button>
              <button 
                className={`CrmLeadModal-content-tab ${activeTab === 'ligacoes' ? 'active' : ''}`}
                onClick={() => setActiveTab('ligacoes')}
              >
                Ligações
              </button>
              <div className="CrmLeadModal-more-tabs">
                <button 
                  className="CrmLeadModal-more-btn"
                  onClick={() => setShowMoreTabs(!showMoreTabs)}
                >
                  <MoreVertical size={16} />
                </button>
                {showMoreTabs && (
                  <div className="CrmLeadModal-more-menu">
                    <button>Estatísticas de Comunicação</button>
                    <button>Tags UTM</button>
                    <button>Dados de Terceiros</button>
                    <button>Formulários Primeira Visita</button>
                    <button>Prescritores/Parceiros/Franqueados</button>
                    <button>Orçamentos</button>
                    <button>Observações</button>
                    <button>Cupons</button>
                    <button>NPS Atendimentos</button>
                    <button>PEDIDOS YAMPI</button>
                    <button>Fretes</button>
                    <button>Históricos Pagamentos</button>
                    <button>Teste Origm</button>
                    <button>pedidos_ignite</button>
                    <button>Disparos</button>
                    <button>Perdas</button>
                  </div>
                )}
              </div>
            </div>

            {/* Conteúdo da aba ativa */}
            <div className="CrmLeadModal-content-area">
              {activeTab === 'visao-geral' && (
                <div className="CrmLeadModal-tab-content">
                  {/* Cards de Resumo */}
                  <div className="CrmLeadModal-summary-cards">
                    <div className="CrmLeadModal-summary-card CrmLeadModal-summary-ganho">
                      <div className="CrmLeadModal-summary-card-header">
                        <TrendingUp size={18} />
                        <span>Total Ganho</span>
                      </div>
                      <div className="CrmLeadModal-summary-card-value">
                        {formatCurrency(totais.ganho)}
                      </div>
                      <div className="CrmLeadModal-summary-card-count">
                        {oportunidades.filter(opp => opp.status === 'won').length} Oportunidade{oportunidades.filter(opp => opp.status === 'won').length !== 1 ? 's' : ''}
                      </div>
                    </div>

                    <div className="CrmLeadModal-summary-card CrmLeadModal-summary-perdido">
                      <div className="CrmLeadModal-summary-card-header">
                        <TrendingDown size={18} />
                        <span>Total Perdido</span>
                      </div>
                      <div className="CrmLeadModal-summary-card-value">
                        {formatCurrency(totais.perdido)}
                      </div>
                      <div className="CrmLeadModal-summary-card-count">
                        {oportunidades.filter(opp => opp.status === 'lost').length} Oportunidade{oportunidades.filter(opp => opp.status === 'lost').length !== 1 ? 's' : ''}
                      </div>
                    </div>

                    <div className="CrmLeadModal-summary-card CrmLeadModal-summary-pendente">
                      <div className="CrmLeadModal-summary-card-header">
                        <DollarSign size={18} />
                        <span>Total Pendente</span>
                      </div>
                      <div className="CrmLeadModal-summary-card-value">
                        {formatCurrency(totais.pendente)}
                      </div>
                      <div className="CrmLeadModal-summary-card-count">
                        {oportunidades.filter(opp => opp.status === 'open').length} Oportunidade{oportunidades.filter(opp => opp.status === 'open').length !== 1 ? 's' : ''}
                      </div>
                    </div>

                    <div className="CrmLeadModal-summary-card CrmLeadModal-summary-reunioes">
                      <div className="CrmLeadModal-summary-card-header">
                        <Calendar size={18} />
                        <span>Reuniões agendadas</span>
                      </div>
                      <div className="CrmLeadModal-summary-card-value">0</div>
                      <div className="CrmLeadModal-summary-card-count">Reuniões</div>
                    </div>

                    <div className="CrmLeadModal-summary-card CrmLeadModal-summary-interacao">
                      <div className="CrmLeadModal-summary-card-header">
                        <AlertCircle size={18} />
                        <span>Última Interação</span>
                      </div>
                      <div className="CrmLeadModal-summary-card-value">-</div>
                    </div>
                  </div>

                  {/* Tarefas */}
                  <div className="CrmLeadModal-section-card">
                    <div className="CrmLeadModal-section-card-header">
                      <h4>Tarefas</h4>
                      <button className="CrmLeadModal-icon-btn">
                        <Plus size={16} />
                      </button>
                    </div>
                    <div className="CrmLeadModal-empty-state">
                      Nenhuma tarefa encontrada.
                    </div>
                  </div>

                  {/* Anotações */}
                  <div className="CrmLeadModal-section-card">
                    <div className="CrmLeadModal-section-card-header">
                      <h4>Anotações</h4>
                      <button className="CrmLeadModal-icon-btn">
                        <Edit size={16} />
                      </button>
                    </div>
                    <div className="CrmLeadModal-empty-state">
                      Nenhuma anotação encontrada.
                    </div>
                  </div>

                  {/* Histórico de Atividades */}
                  <div className="CrmLeadModal-section-card">
                    <div className="CrmLeadModal-section-card-header">
                      <h4>Histórico de Atividades</h4>
                    </div>
                    <input 
                      type="text" 
                      placeholder="Filtrar eventos..." 
                      className="CrmLeadModal-filter-input"
                    />
                    <div className="CrmLeadModal-history-list">
                      {/* Histórico será implementado aqui */}
                      <div className="CrmLeadModal-empty-state">
                        Nenhuma atividade encontrada.
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'atendimentos' && (
                <div className="CrmLeadModal-tab-content">
                  <div className="CrmLeadModal-sub-tabs">
                    <button className="CrmLeadModal-sub-tab active">Todos (3)</button>
                    <button className="CrmLeadModal-sub-tab">Aguardando Atendimento (0)</button>
                    <button className="CrmLeadModal-sub-tab">Em Atendimento (1)</button>
                    <button className="CrmLeadModal-sub-tab">Resolvidos (0)</button>
                    <button className="CrmLeadModal-sub-tab">Arquivados (2)</button>
                  </div>
                  <div className="CrmLeadModal-search-bar">
                    <input 
                      type="text" 
                      placeholder="Pesquisar Atendimentos" 
                      className="CrmLeadModal-search-input"
                    />
                  </div>
                  <div className="CrmLeadModal-empty-state">
                    Seção de atendimentos em desenvolvimento
                  </div>
                </div>
              )}

              {activeTab === 'oportunidades' && (
                <div className="CrmLeadModal-tab-content">
                  <div className="CrmLeadModal-tab-header">
                    <button className="CrmLeadModal-btn-primary">
                      <Plus size={16} />
                      Criar Oportunidade
                    </button>
                    <input 
                      type="text" 
                      placeholder="Pesquisar" 
                      className="CrmLeadModal-search-input"
                    />
                    <button className="CrmLeadModal-icon-btn">
                      <Settings size={16} />
                    </button>
                  </div>
                  <div className="CrmLeadModal-table">
                    <table>
                      <thead>
                        <tr>
                          <th>Nome</th>
                          <th>Status</th>
                          <th>Funil</th>
                          <th>Etapa</th>
                          <th>Valor</th>
                          <th>Responsável</th>
                          <th>Criado em</th>
                        </tr>
                      </thead>
                      <tbody>
                        {oportunidades.length === 0 ? (
                          <tr>
                            <td colSpan="7" className="CrmLeadModal-empty-state">
                              Nenhuma oportunidade encontrada
                            </td>
                          </tr>
                        ) : (
                          oportunidades.map(opp => (
                            <tr key={opp.id}>
                              <td>{opp.title || 'Sem título'}</td>
                              <td>
                                <span className={`CrmLeadModal-status-badge CrmLeadModal-status-${opp.status}`}>
                                  {opp.status === 'open' ? 'Aberto' : 
                                   opp.status === 'won' ? 'Ganho' : 'Perdido'}
                                </span>
                              </td>
                              <td>-</td>
                              <td>-</td>
                              <td>{formatCurrency(opp.value || 0)}</td>
                              <td>-</td>
                              <td>{formatDate(opp.create_date)}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {activeTab === 'reunioes' && (
                <div className="CrmLeadModal-tab-content">
                  <button className="CrmLeadModal-btn-primary">
                    <Calendar size={16} />
                    Nova Reunião
                  </button>
                  <div className="CrmLeadModal-empty-state">
                    Nenhum resultado encontrado
                  </div>
                </div>
              )}

              {activeTab === 'propostas' && (
                <div className="CrmLeadModal-tab-content">
                  <div className="CrmLeadModal-tab-header">
                    <select className="CrmLeadModal-select">
                      <option>Selecione vendedor...</option>
                    </select>
                    <select className="CrmLeadModal-select">
                      <option>Selecione status...</option>
                    </select>
                    <input 
                      type="text" 
                      placeholder="Pesquisar" 
                      className="CrmLeadModal-search-input"
                    />
                    <button className="CrmLeadModal-icon-btn">
                      <Settings size={16} />
                    </button>
                    <button className="CrmLeadModal-btn-primary">
                      <Plus size={16} />
                      Nova Proposta
                    </button>
                  </div>
                  <div className="CrmLeadModal-empty-state">
                    Nenhum resultado encontrado
                  </div>
                </div>
              )}

              {activeTab === 'faturas' && (
                <div className="CrmLeadModal-tab-content">
                  <div className="CrmLeadModal-sub-tabs">
                    <button className="CrmLeadModal-sub-tab active">Todas as faturas</button>
                    <button className="CrmLeadModal-sub-tab">Recorrências</button>
                    <button className="CrmLeadModal-sub-tab">Parcelamentos</button>
                  </div>
                  <div className="CrmLeadModal-tab-header">
                    <select className="CrmLeadModal-select">
                      <option>Selecione vendedor...</option>
                    </select>
                    <select className="CrmLeadModal-select">
                      <option>Selecione status...</option>
                    </select>
                    <input 
                      type="text" 
                      placeholder="Pesquisar" 
                      className="CrmLeadModal-search-input"
                    />
                    <button className="CrmLeadModal-icon-btn">
                      <Settings size={16} />
                    </button>
                    <button className="CrmLeadModal-btn-primary">
                      <Plus size={16} />
                      Nova fatura
                    </button>
                  </div>
                  <div className="CrmLeadModal-empty-state">
                    Nenhum resultado encontrado
                  </div>
                </div>
              )}

              {activeTab === 'ligacoes' && (
                <div className="CrmLeadModal-tab-content">
                  <div className="CrmLeadModal-tab-header">
                    <button className="CrmLeadModal-btn-primary">
                      <Phone size={16} />
                      Fazer Ligação
                    </button>
                    <input 
                      type="text" 
                      placeholder="Pesquisar nome do lead ou número" 
                      className="CrmLeadModal-search-input"
                    />
                    <button className="CrmLeadModal-icon-btn">
                      <Settings size={16} />
                    </button>
                  </div>
                  <div className="CrmLeadModal-empty-state">
                    Nenhuma ligação encontrada!
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

export default CrmLeadModal;



