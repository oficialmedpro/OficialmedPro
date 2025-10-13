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

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return '-';
    return d.toLocaleDateString('pt-BR');
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
      
      // Obter lead_ids dos clientes do segmento
      const leadIds = clientesDoSegmento.map(c => c.lead_id);
      
      console.log('🔧 DEBUG - Lead IDs encontrados:', leadIds.length);
      
      if (leadIds.length === 0) {
        console.log('⚠️ Nenhum lead_id encontrado para o segmento:', segmentoId);
        setSegmentOpportunities([]);
        setIsLoadingOpportunities(false);
        return;
      }

      // Buscar oportunidades com dados do lead e vendedor
      const { supabase } = await import('../service/supabase');
      
      const itemsPerPage = 20;
      const offset = (page - 1) * itemsPerPage;
      
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
          crm_column,
          lead_firstname,
          lead_lastname,
          lead_whatsapp
        `)
        .in('lead_id', leadIds)
        .eq('archived', 0)
        .eq('status', 'gain') // 🔧 CORREÇÃO: Filtrar apenas oportunidades ganhas
        .order('create_date', { ascending: false })
        .range(offset, offset + itemsPerPage - 1);

      if (error) {
        console.error('❌ Erro ao buscar oportunidades:', error);
        console.error('❌ Detalhes do erro:', error.message);
        console.error('❌ Código do erro:', error.code);
        return;
      }

      console.log('✅ Oportunidades GANHAS encontradas:', oportunidades?.length || 0);
      console.log('🔧 DEBUG - Filtro aplicado: status=gain, archived=0');

      // Buscar nomes dos vendedores usando user_id como id_sprint
      let vendedorBySprintId = {};
      const uniqueUserIds = Array.from(new Set((oportunidades || []).map(op => op.user_id).filter(Boolean)));
      if (uniqueUserIds.length > 0) {
        const { data: vendedores, error: vendError } = await supabase
          .from('vendedores')
          .select('id_sprint, nome')
          .in('id_sprint', uniqueUserIds);
        if (vendError) {
          console.warn('⚠️ Erro ao buscar vendedores:', vendError.message);
        } else {
          vendedorBySprintId = (vendedores || []).reduce((acc, v) => {
            acc[v.id_sprint] = v.nome;
            return acc;
          }, {});
        }
      }

      // Mesclar nome do vendedor
      const oportunidadesComVendedor = (oportunidades || []).map(op => ({
        ...op,
        vendedor_nome: vendedorBySprintId[op.user_id] || '-'
      }));

      setSegmentOpportunities(oportunidadesComVendedor);
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
            <>
              {/* Cabeçalho da tabela */}
              <div className="rfv-table-header">
                <div>ID</div>
                <div>Título</div>
                <div>Nome</div>
                <div>Telefone</div>
                <div>Datas</div>
                <div>WhatsApp</div>
                <div>Vendedor</div>
                <div>Funil ID</div>
                <div>CRM Column</div>
                <div className="rfv-header-value">Valor</div>
                <div className="rfv-header-status">Status</div>
              </div>
              
              {/* Linhas da tabela */}
              {segmentOpportunities.map((oportunidade, index) => {
                const crmLink = generateCrmLink(oportunidade.id, oportunidade.funil_id);
                const leadProfileLink = generateLeadProfileLink(oportunidade.lead_id);
                const whatsappLink = generateWhatsAppLink(oportunidade.lead_whatsapp);
                
                return (
                  <div key={oportunidade.id} className="rfv-opportunity-line">
                    {/* ID da Oportunidade - Link para CRM */}
                    <div className="rfv-opportunity-id">
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
                    </div>
                    
                    {/* Título da Oportunidade */}
                    <div className="rfv-opportunity-title">
                      {oportunidade.title || 'Sem título'}
                    </div>
                    
                    {/* Nome e Sobrenome separados */}
                    <div className="rfv-opportunity-names">
                      <div className="rfv-firstname">{oportunidade.lead_firstname || '-'}</div>
                      <div className="rfv-lastname">{oportunidade.lead_lastname || '-'}</div>
                    </div>
                    
                    {/* Telefone/WhatsApp como texto */}
                    <div className="rfv-opportunity-phone">
                      {oportunidade.lead_whatsapp || '-'}
                    </div>
                    
                    {/* Datas */}
                    <div className="rfv-opportunity-dates">
                      <div className="rfv-date">Criado: {formatDate(oportunidade.create_date)}</div>
                      <div className="rfv-date">Última compra: {formatDate(oportunidade.gain_date)}</div>
                    </div>
                    
                    {/* WhatsApp - Link direto */}
                    <div className="rfv-opportunity-whatsapp">
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
                    </div>
                    
                    {/* Nome do Vendedor */}
                    <div className="rfv-opportunity-vendedor">
                      {oportunidade.vendedor_nome || '-'}
                    </div>
                    
                    {/* Funil ID */}
                    <div className="rfv-opportunity-funil-id">
                      {oportunidade.funil_id || '-'}
                    </div>
                    
                    {/* CRM Column */}
                    <div className="rfv-opportunity-crm-column">
                      {oportunidade.crm_column || '-'}
                    </div>
                    
                    {/* Valor */}
                    <div className="rfv-opportunity-value">
                      {formatCurrency(oportunidade.value || 0)}
                    </div>
                    
                    {/* Status */}
                    <div className="rfv-opportunity-status">
                      <span className={`rfv-status-badge ${oportunidade.status?.toLowerCase()}`}>
                        {oportunidade.status || 'N/A'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </>
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