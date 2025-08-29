import React, { useState, useEffect } from 'react';
import './MetricsSidebar.css';
import { metaAdsService } from '../service/metaAdsService';

const MetricsSidebarMetaAds = ({ formatCurrency, t }) => {
  // Estados para dados do Meta
  const [metaStats, setMetaStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);

  // Carregar dados do Meta Ads
  const loadMetaStats = async () => {
    try {
      setIsLoading(true);
      setError(null);

      console.log('🔄 Carregando estatísticas do Meta Ads...');

      // Verificar se o serviço está configurado
      if (!metaAdsService.isConfigured()) {
        throw new Error('Credenciais do Meta Ads não configuradas');
      }

      // Testar conexão primeiro
      const connectionTest = await metaAdsService.testConnection();
      if (!connectionTest.success) {
        throw new Error(`Falha na conexão: ${connectionTest.error}`);
      }

      // Calcular período (mês atual)
      const today = new Date();
      const since = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
      const until = today.toISOString().split('T')[0];
      
      const dateRange = { since, until };
      console.log('📅 Período:', dateRange);

      // Buscar estatísticas reais
      const stats = await metaAdsService.getMetaStats(dateRange);
      console.log('📊 Estatísticas carregadas:', stats);

      setMetaStats(stats);
      setLastUpdate(new Date());
      
    } catch (error) {
      console.error('❌ Erro ao carregar dados do Meta:', error);
      setError(error.message);
      setMetaStats(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Carregar dados na inicialização
  useEffect(() => {
    loadMetaStats();
  }, []);

  // Função para calcular ROAS baseado nos dados reais
  const calculateROAS = () => {
    if (!metaStats) return 'N/A';
    
    const gastoTotal = metaStats.gastoTotal || 0;
    const totalLeads = metaStats.totalLeads || 0;
    
    // Estimativa de valor por lead (pode ser ajustada)
    const valorEstimadoPorLead = 500; // R$ 500 por lead
    const valorTotalGanho = totalLeads * valorEstimadoPorLead;
    
    if (gastoTotal === 0) return 'N/A';
    
    const roas = valorTotalGanho / gastoTotal;
    return `${roas.toFixed(2)}x`;
  };

  // Função para calcular taxa de conversão
  const calculateConversionRate = () => {
    if (!metaStats) return 'N/A';
    
    const totalLeads = metaStats.totalLeads || 0;
    const totalCampaigns = metaStats.dadosAnuncios?.total || 0;
    
    if (totalCampaigns === 0) return 'N/A';
    
    // Estimativa de impressões baseada no número de campanhas
    const estimativaImpressoes = totalCampaigns * 1000; // 1000 impressões por campanha em média
    const taxaConversao = (totalLeads / estimativaImpressoes) * 100;
    
    return `${estimativaImpressoes.toLocaleString()} → ${totalLeads} (${taxaConversao.toFixed(1)}%)`;
  };

  // Função para calcular valor ganho estimado
  const calculateEstimatedValue = () => {
    if (!metaStats) return 0;
    
    const totalLeads = metaStats.totalLeads || 0;
    const valorEstimadoPorLead = 500; // R$ 500 por lead
    
    return totalLeads * valorEstimadoPorLead;
  };

  // Função para calcular oportunidades perdidas (estimativa)
  const calculateLostOpportunities = () => {
    if (!metaStats) return 0;
    
    const totalLeads = metaStats.totalLeads || 0;
    // Estimativa: 30% dos leads se tornam oportunidades perdidas
    return Math.floor(totalLeads * 0.3);
  };

  // Função para calcular oportunidades abertas (estimativa)
  const calculateOpenOpportunities = () => {
    if (!metaStats) return 0;
    
    const totalLeads = metaStats.totalLeads || 0;
    // Estimativa: 20% dos leads se tornam oportunidades abertas
    return Math.floor(totalLeads * 0.2);
  };

  // Função para calcular valor perdido (estimativa)
  const calculateLostValue = () => {
    if (!metaStats) return 0;
    
    const oportunidadesPerdidas = calculateLostOpportunities();
    const valorEstimadoPorOportunidade = 2000; // R$ 2000 por oportunidade
    
    return oportunidadesPerdidas * valorEstimadoPorOportunidade;
  };

  // Renderizar card de loading
  if (isLoading) {
    return (
      <div className="ms-users-sidebar">
        <div className="ms-users-header">
          <h3>{t?.financialMetrics || 'Métricas Financeiras'}</h3>
        </div>
        <div className="ms-financial-metrics-new">
          <div className="ms-metric-card ms-meta-card">
            <div className="ms-metric-card-header">
              <div className="ms-platform-icon ms-meta-icon">M</div>
              <span className="ms-platform-name">Meta</span>
              <div className="ms-roas-badge ms-roas-good">Carregando...</div>
            </div>
            <div className="ms-metrics-grid">
              <div className="ms-metric-item-visual">
                <div className="ms-metric-info">
                  <span className="ms-metric-label">Carregando dados...</span>
                  <span className="ms-metric-value">🔄</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Renderizar card de erro
  if (error) {
    return (
      <div className="ms-users-sidebar">
        <div className="ms-users-header">
          <h3>{t?.financialMetrics || 'Métricas Financeiras'}</h3>
        </div>
        <div className="ms-financial-metrics-new">
          <div className="ms-metric-card ms-meta-card">
            <div className="ms-metric-card-header">
              <div className="ms-platform-icon ms-meta-icon">M</div>
              <span className="ms-platform-name">Meta</span>
              <div className="ms-roas-badge ms-roas-excellent">Erro</div>
            </div>
            <div className="ms-metrics-grid">
              <div className="ms-metric-item-visual">
                <div className="ms-metric-info">
                  <span className="ms-metric-label">Erro ao carregar</span>
                  <span className="ms-metric-value">❌</span>
                  <button 
                    onClick={loadMetaStats}
                    style={{
                      background: '#3b82f6',
                      color: 'white',
                      border: 'none',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      cursor: 'pointer',
                      marginTop: '4px'
                    }}
                  >
                    Tentar Novamente
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="ms-users-sidebar">
      <div className="ms-users-header">
        <h3>{t?.financialMetrics || 'Métricas Financeiras'}</h3>
        {lastUpdate && (
          <small style={{ color: '#64748b', fontSize: '12px' }}>
            Última atualização: {lastUpdate.toLocaleTimeString('pt-BR')}
          </small>
        )}
      </div>
      
      <div className="ms-financial-metrics-new">
        {/* Google Metrics Card - Mantido igual ao original */}
        <div className="ms-metric-card ms-google-card">
          <div className="ms-metric-card-header">
            <div className="ms-platform-icon ms-google-icon">G</div>
            <span className="ms-platform-name">Google</span>
            <div className="ms-roas-badge ms-roas-excellent">ROAS 3.47x</div>
          </div>
          
          <div className="ms-metrics-grid">
            <div className="ms-metric-item-visual">
              <div className="ms-metric-info">
                <span className="ms-metric-label">Investido</span>
                <span className="ms-metric-value">{formatCurrency(45000, 'BRL')}</span>
                <div className="ms-metric-bar">
                  <div className="ms-metric-fill" style={{width: '85%', background: 'linear-gradient(90deg, #ef4444, #dc2626)'}}></div>
                </div>
              </div>
            </div>

            <div className="ms-metric-item-visual">
              <div className="ms-metric-info">
                <span className="ms-metric-label">Taxa Conversão</span>
                <span className="ms-metric-value">78 → 5 (6.4%)</span>
                <div className="ms-metric-bar">
                  <div className="ms-metric-fill" style={{width: '64%', background: 'linear-gradient(90deg, #3b82f6, #1d4ed8)'}}></div>
                </div>
              </div>
            </div>

            <div className="ms-metric-item-visual">
              <div className="ms-metric-info">
                <span className="ms-metric-label">Valor Ganho</span>
                <span className="ms-metric-value">{formatCurrency(156000, 'BRL')}</span>
                <div className="ms-metric-bar">
                  <div className="ms-metric-fill" style={{width: '92%', background: 'linear-gradient(90deg, #10b981, #059669)'}}></div>
                </div>
              </div>
            </div>

            <div className="ms-metric-item-visual">
              <div className="ms-metric-info">
                <span className="ms-metric-label">Oportunidades Perdidas</span>
                <span className="ms-metric-value">73</span>
                <div className="ms-metric-bar">
                  <div className="ms-metric-fill" style={{width: '73%', background: 'linear-gradient(90deg, #f59e0b, #d97706)'}}></div>
                </div>
              </div>
            </div>

            <div className="ms-metric-item-visual">
              <div className="ms-metric-info">
                <span className="ms-metric-label">Oportunidades Abertas</span>
                <span className="ms-metric-value">12</span>
                <div className="ms-metric-bar">
                  <div className="ms-metric-fill" style={{width: '30%', background: 'linear-gradient(90deg, #8b5cf6, #7c3aed)'}}></div>
                </div>
              </div>
            </div>

            <div className="ms-metric-item-visual">
              <div className="ms-metric-info">
                <span className="ms-metric-label">Valor Perda</span>
                <span className="ms-metric-value">{formatCurrency(89000, 'BRL')}</span>
                <div className="ms-metric-bar">
                  <div className="ms-metric-fill" style={{width: '57%', background: 'linear-gradient(90deg, #ef4444, #dc2626)'}}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Meta Metrics Card - COM DADOS REAIS DA API */}
        <div className="ms-metric-card ms-meta-card">
          <div className="ms-metric-card-header">
            <div className="ms-platform-icon ms-meta-icon">M</div>
            <span className="ms-platform-name">Meta</span>
            <div className="ms-roas-badge ms-roas-good">ROAS {calculateROAS()}</div>
          </div>
          
          <div className="ms-metrics-grid">
            <div className="ms-metric-item-visual">
              <div className="ms-metric-info">
                <span className="ms-metric-label">Investido (Real)</span>
                <span className="ms-metric-value">
                  {metaStats ? formatCurrency(metaStats.gastoTotal || 0, 'BRL') : 'R$ 0,00'}
                </span>
                <div className="ms-metric-bar">
                  <div 
                    className="ms-metric-fill" 
                    style={{
                      width: metaStats && metaStats.gastoTotal > 0 ? '60%' : '0%', 
                      background: 'linear-gradient(90deg, #ef4444, #dc2626)'
                    }}
                  ></div>
                </div>
              </div>
            </div>

            <div className="ms-metric-item-visual">
              <div className="ms-metric-info">
                <span className="ms-metric-label">Taxa Conversão</span>
                <span className="ms-metric-value">{calculateConversionRate()}</span>
                <div className="ms-metric-bar">
                  <div 
                    className="ms-metric-fill" 
                    style={{
                      width: metaStats && metaStats.totalLeads > 0 ? '67%' : '0%', 
                      background: 'linear-gradient(90deg, #3b82f6, #1d4ed8)'
                    }}
                  ></div>
                </div>
              </div>
            </div>

            <div className="ms-metric-item-visual">
              <div className="ms-metric-info">
                <span className="ms-metric-label">Valor Ganho (Estimado)</span>
                <span className="ms-metric-value">{formatCurrency(calculateEstimatedValue(), 'BRL')}</span>
                <div className="ms-metric-bar">
                  <div 
                    className="ms-metric-fill" 
                    style={{
                      width: metaStats && metaStats.totalLeads > 0 ? '63%' : '0%', 
                      background: 'linear-gradient(90deg, #10b981, #059669)'
                    }}
                  ></div>
                </div>
              </div>
            </div>

            <div className="ms-metric-item-visual">
              <div className="ms-metric-info">
                <span className="ms-metric-label">Oportunidades Perdidas</span>
                <span className="ms-metric-value">{calculateLostOpportunities()}</span>
                <div className="ms-metric-bar">
                  <div 
                    className="ms-metric-fill" 
                    style={{
                      width: metaStats && metaStats.totalLeads > 0 ? '42%' : '0%', 
                      background: 'linear-gradient(90deg, #f59e0b, #d97706)'
                    }}
                  ></div>
                </div>
              </div>
            </div>

            <div className="ms-metric-item-visual">
              <div className="ms-metric-info">
                <span className="ms-metric-label">Oportunidades Abertas</span>
                <span className="ms-metric-value">{calculateOpenOpportunities()}</span>
                <div className="ms-metric-bar">
                  <div 
                    className="ms-metric-fill" 
                    style={{
                      width: metaStats && metaStats.totalLeads > 0 ? '20%' : '0%', 
                      background: 'linear-gradient(90deg, #8b5cf6, #7c3aed)'
                    }}
                  ></div>
                </div>
              </div>
            </div>

            <div className="ms-metric-item-visual">
              <div className="ms-metric-info">
                <span className="ms-metric-label">Valor Perda (Estimado)</span>
                <span className="ms-metric-value">{formatCurrency(calculateLostValue(), 'BRL')}</span>
                <div className="ms-metric-bar">
                  <div 
                    className="ms-metric-fill" 
                    style={{
                      width: metaStats && metaStats.totalLeads > 0 ? '43%' : '0%', 
                      background: 'linear-gradient(90deg, #ef4444, #dc2626)'
                    }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Informações adicionais */}
          {metaStats && (
            <div style={{ 
              marginTop: '16px', 
              padding: '12px', 
              background: 'rgba(59, 130, 246, 0.1)', 
              borderRadius: '8px',
              border: '1px solid rgba(59, 130, 246, 0.2)'
            }}>
              <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>
                📊 Dados Reais da API
              </div>
              <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                Campanhas: {metaStats.dadosAnuncios?.total || 0} | 
                Leads: {metaStats.totalLeads || 0} | 
                Custo/Lead: {metaStats.custoMedioPorLead ? formatCurrency(metaStats.custoMedioPorLead, 'BRL') : 'N/A'}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MetricsSidebarMetaAds;
