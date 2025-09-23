import React, { useState, useEffect } from 'react';
import './RFVOpportunitiesCard.css';

const RFVOpportunitiesCard = ({ 
  selectedSegment, 
  startDate, 
  endDate, 
  selectedFunnel, 
  selectedUnit, 
  selectedSeller, 
  selectedOrigin 
}) => {
  const [segmentOpportunities, setSegmentOpportunities] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoadingOpportunities, setIsLoadingOpportunities] = useState(false);

  // 🔗 Função para gerar link do CRM
  const generateCrmLink = (opportunityId, funnelId) => {
    return `https://oficialmed.sprinthub.app/sh/crm?funnelID=${funnelId}&opportunityID=${opportunityId}`;
  };

  // 🔗 Função para gerar link do perfil do lead
  const generateLeadProfileLink = (leadId) => {
    return `https://oficialmed.sprinthub.app/sh/leads/profile/${leadId}`;
  };

  // 📱 Função para gerar link do WhatsApp
  const generateWhatsAppLink = (phone) => {
    if (!phone) return null;
    // Remove caracteres especiais e adiciona código do Brasil se necessário
    const cleanPhone = phone.replace(/\D/g, '');
    const phoneWithCountryCode = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;
    return `https://wa.me/${phoneWithCountryCode}`;
  };

  // Função para formatar moeda
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value || 0);
  };

  // Carregar oportunidades do segmento
  const loadSegmentOpportunities = async (segmentoId, page = 1) => {
    if (!segmentoId) return;
    
    setIsLoadingOpportunities(true);
    
    try {
      // Importar o serviço RFV
      const { rfvRealService } = await import('../service/rfvRealService');
      
      // Buscar análise RFV para obter os clientes do segmento
      const analysis = await rfvRealService.getRFVAnalysis({
        startDate,
        endDate,
        selectedFunnel,
        selectedUnit,
        selectedSeller,
        selectedOrigin
      });

      console.log('🔧 DEBUG - Segmento selecionado:', segmentoId);
      console.log('🔧 DEBUG - Total de clientes na análise:', analysis.clientes.length);
      
      // Filtrar clientes do segmento selecionado
      const clientesDoSegmento = analysis.clientes.filter(c => c.segmento === segmentoId);
      
      console.log('🔧 DEBUG - Clientes do segmento:', clientesDoSegmento.length);
      console.log('🔧 DEBUG - Amostra de clientes do segmento:', clientesDoSegmento.slice(0, 3));
      
      // Obter lead_ids dos clientes do segmento
      const leadIds = clientesDoSegmento.map(c => c.lead_id);
      
      console.log('🔧 DEBUG - Lead IDs encontrados:', leadIds.length);
      console.log('🔧 DEBUG - Primeiros 5 lead IDs:', leadIds.slice(0, 5));
      
      if (leadIds.length === 0) {
        console.log('⚠️ Nenhum lead_id encontrado para o segmento:', segmentoId);
        setSegmentOpportunities([]);
        setIsLoadingOpportunities(false);
        return;
      }

      // Buscar oportunidades desses clientes
      const { supabase } = await import('../service/supabase');
      
      const itemsPerPage = 20;
      const offset = (page - 1) * itemsPerPage;
      
      // Query simplificada para evitar erro 400
      // Buscar oportunidades com dados do lead já incluídos na tabela
      const { data: oportunidades, error } = await supabase
        .from('oportunidade_sprint')
        .select(`
          id,
          title,
          value,
          create_date,
          gain_date,
          status,
          lead_id,
          user_id,
          funil_id,
          unidade_id,
          lead_firstname,
          lead_lastname,
          lead_whatsapp
        `)
        .in('lead_id', leadIds)
        .eq('archived', 0)
        .order('create_date', { ascending: false })
        .range(offset, offset + itemsPerPage - 1);

      if (error) {
        console.error('❌ Erro ao buscar oportunidades:', error);
        console.error('❌ Detalhes do erro:', error.message);
        console.error('❌ Código do erro:', error.code);
        return;
      }

      console.log('✅ Oportunidades encontradas:', oportunidades?.length || 0);

      setSegmentOpportunities(oportunidades || []);
      setCurrentPage(page);
    } catch (error) {
      console.error('Erro ao carregar oportunidades do segmento:', error);
    } finally {
      setIsLoadingOpportunities(false);
    }
  };

  // Carregar oportunidades quando o segmento mudar
  useEffect(() => {
    if (selectedSegment) {
      setCurrentPage(1);
      loadSegmentOpportunities(selectedSegment.id, 1);
    }
  }, [selectedSegment, startDate, endDate, selectedFunnel, selectedUnit, selectedSeller, selectedOrigin]);

  if (!selectedSegment) {
    return null;
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return '-';
    return d.toLocaleDateString('pt-BR');
  };

  return (
    <div className="rfv-opportunities-card">
      <div className="rfv-opportunities-header">
        <div className="platform-icon rfv-icon">R</div>
        <span className="platform-name">
          Oportunidades - {selectedSegment.nome}
        </span>
      </div>
      
      <div className="rfv-opportunities-info">
        <span className="rfv-opportunities-count">
          {segmentOpportunities.length} oportunidades
        </span>
        <span className="rfv-opportunities-value">
          {formatCurrency(
            segmentOpportunities.reduce((sum, op) => sum + (op.value || 0), 0)
          )}
        </span>
      </div>

      {isLoadingOpportunities ? (
        <div className="rfv-loading-opportunities">
          <div className="rfv-loading-spinner"></div>
          <span>Carregando oportunidades...</span>
        </div>
      ) : (
        <div className="rfv-opportunities-list">
          {segmentOpportunities.length > 0 ? (
            segmentOpportunities.map((oportunidade, index) => {
              const crmLink = generateCrmLink(oportunidade.id, oportunidade.funil_id);
              const leadProfileLink = generateLeadProfileLink(oportunidade.lead_id);
              const whatsappLink = generateWhatsAppLink(oportunidade.lead_whatsapp);
              const nomeCompleto = [
                oportunidade.lead_firstname,
                oportunidade.lead_lastname
              ].filter(Boolean).join(' ') || `Lead ${oportunidade.lead_id}`;
              
              return (
                <div key={oportunidade.id} className="rfv-opportunity-line">
                  <div className="rfv-opportunity-content">
                    <div className="rfv-opportunity-info">
                      {/* ID da Oportunidade - Link para CRM */}
                      <span className="rfv-opportunity-id">
                        {crmLink ? (
                          <a
                            href={crmLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="opportunity-link"
                            onClick={(e) => e.stopPropagation()}
                          >
                            #{oportunidade.id}
                          </a>
                        ) : (
                          `#${oportunidade.id}`
                        )}
                      </span>
                      
                      {/* Nome do Cliente - Link para perfil */}
                      <span className="rfv-opportunity-name">
                        {leadProfileLink ? (
                          <a
                            href={leadProfileLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="lead-link"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {nomeCompleto}
                          </a>
                        ) : (
                          nomeCompleto
                        )}
                      </span>
                      
                      {/* Datas */}
                      <span className="rfv-opportunity-dates">
                        <span className="rfv-date">Criado: {formatDate(oportunidade.create_date)}</span>
                        <span className="rfv-date">Última compra: {formatDate(oportunidade.gain_date)}</span>
                      </span>
                      
                      {/* WhatsApp - Link direto */}
                      <span className="rfv-opportunity-whatsapp">
                        {whatsappLink ? (
                          <a
                            href={whatsappLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="whatsapp-link"
                            onClick={(e) => e.stopPropagation()}
                          >
                            📱 WhatsApp
                          </a>
                        ) : (
                          <span className="no-whatsapp">-</span>
                        )}
                      </span>
                      
                      {/* Valor */}
                      <span className="rfv-opportunity-value">
                        {formatCurrency(oportunidade.value || 0)}
                      </span>
                    </div>
                    
                    <div className="rfv-opportunity-status">
                      <span className={`rfv-status-badge ${oportunidade.status?.toLowerCase()}`}>
                        {oportunidade.status || 'N/A'}
                      </span>
                    </div>
                  </div>
                  
                  {/* Barra de progresso baseada no valor */}
                  <div 
                    className="rfv-opportunity-color-bar" 
                    style={{
                      background: '#10b981',
                      width: `${Math.min(100, (oportunidade.value || 0) / 1000)}%`
                    }}
                  ></div>
                </div>
              );
            })
          ) : (
            <div className="rfv-no-opportunities">
              Nenhuma oportunidade encontrada para este segmento.
            </div>
          )}
        </div>
      )}

      {/* Paginação */}
      {segmentOpportunities.length > 0 && (
        <div className="rfv-pagination-container">
          <div className="rfv-pagination-info">
            Página {currentPage} ({segmentOpportunities.length} oportunidades)
          </div>
          <div className="rfv-pagination-controls">
            <button 
              className="rfv-pagination-btn"
              onClick={() => loadSegmentOpportunities(selectedSegment.id, currentPage - 1)}
              disabled={currentPage === 1}
            >
              ← Anterior
            </button>
            
            <button 
              className="rfv-pagination-btn"
              onClick={() => loadSegmentOpportunities(selectedSegment.id, currentPage + 1)}
              disabled={segmentOpportunities.length < 20}
            >
              Próxima →
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default RFVOpportunitiesCard;

