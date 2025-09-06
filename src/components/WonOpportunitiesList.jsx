import React, { useState, useEffect } from 'react';
import { getThermometerMetrics } from '../service/thermometerService';

const WonOpportunitiesList = ({ selectedDate }) => {
  const [wonOpportunities, setWonOpportunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const [error, setError] = useState(null);

  // Buscar oportunidades ganhas
  useEffect(() => {
    fetchWonOpportunities();
  }, [selectedDate]);

  const fetchWonOpportunities = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // COPIANDO EXATO DO THERMOMETERSERVICE
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
      const supabaseSchema = 'public';
      
      const ontem = '2025-09-05';
      const hoje = '2025-09-06';
      
      // URL EXATA do thermometerService mudando só gain_date para create_date
      const oportunidadesGanhasUrl = `${supabaseUrl}/rest/v1/oportunidade_sprint?select=*&archived=eq.0&status=eq.gain&create_date=gte.${ontem}&create_date=lte.${hoje}T23:59:59`;
      
      console.log('URL:', oportunidadesGanhasUrl);

      const response = await fetch(oportunidadesGanhasUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'apikey': supabaseServiceKey,
          'Accept-Profile': supabaseSchema,
          'Content-Profile': supabaseSchema
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const ganhasData = await response.json();
      console.log(`✅ Oportunidades: ${ganhasData.length}`);
      
      setWonOpportunities(ganhasData);

    } catch (err) {
      console.error('❌ Erro ao buscar oportunidades ganhas:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Formatação de valores
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  // Calcular totais
  const totalValue = wonOpportunities.reduce((sum, opp) => sum + (parseFloat(opp.value) || 0), 0);
  const totalCount = wonOpportunities.length;

  if (loading) {
    return (
      <div className="won-opportunities-list loading">
        <div className="loading-spinner">
          <span>🔍 Carregando oportunidades ganhas...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="won-opportunities-list error">
        <h3>❌ Erro ao carregar dados</h3>
        <p>{error}</p>
        <button onClick={fetchWonOpportunities} className="retry-btn">
          🔄 Tentar novamente
        </button>
      </div>
    );
  }

  return (
    <div className="won-opportunities-list">
      <div className="list-header" onClick={() => setExpanded(!expanded)}>
        <h3>
          🏆 Oportunidades Ganhas (Últimos 30 dias)
          <span className="toggle-icon">{expanded ? '▼' : '▶'}</span>
        </h3>
        <div className="summary">
          <span className="count">{totalCount} oportunidades</span>
          <span className="total-value">{formatCurrency(totalValue)}</span>
        </div>
      </div>

      {expanded && (
        <div className="opportunities-container">
          {totalCount === 0 ? (
            <div className="no-data">
              <p>📝 Nenhuma oportunidade ganha no período selecionado</p>
            </div>
          ) : (
            <div className="opportunities-grid">
              {wonOpportunities.map((opp, index) => (
                <div key={opp.id} className="opportunity-card">
                  <div className="card-header">
                    <span className="opportunity-index">#{index + 1}</span>
                    <span className="opportunity-id">ID: {opp.id}</span>
                  </div>
                  
                  <div className="opportunity-title">
                    <strong>{opp.title || 'Sem título'}</strong>
                  </div>
                  
                  <div className="opportunity-details">
                    <div className="detail-row">
                      <span className="label">💰 Valor:</span>
                      <span className="value">{formatCurrency(opp.value)}</span>
                    </div>
                    
                    <div className="detail-row">
                      <span className="label">🎯 Data Ganho:</span>
                      <span className="value">{formatDate(opp.gain_date)}</span>
                    </div>
                    
                    <div className="detail-row">
                      <span className="label">📅 Data Criação:</span>
                      <span className="value">{formatDate(opp.create_date)}</span>
                    </div>
                    
                    <div className="detail-row">
                      <span className="label">👤 Cliente:</span>
                      <span className="value">{opp.lead_firstname || 'N/A'}</span>
                    </div>
                    
                    <div className="detail-row">
                      <span className="label">📱 WhatsApp:</span>
                      <span className="value">{opp.lead_whatsapp || 'N/A'}</span>
                    </div>
                    
                    <div className="detail-row">
                      <span className="label">🆔 ID:</span>
                      <span className="value">{opp.id}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      
      <style jsx>{`
        .won-opportunities-list {
          background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
          border-radius: 12px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          margin: 20px 0;
          overflow: hidden;
        }
        
        .list-header {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: white;
          padding: 16px 20px;
          cursor: pointer;
          user-select: none;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .list-header:hover {
          background: linear-gradient(135deg, #059669 0%, #047857 100%);
        }
        
        .list-header h3 {
          margin: 0;
          font-size: 18px;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .toggle-icon {
          font-size: 14px;
          transition: transform 0.2s;
        }
        
        .summary {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 4px;
        }
        
        .count {
          font-size: 14px;
          opacity: 0.9;
        }
        
        .total-value {
          font-size: 16px;
          font-weight: bold;
        }
        
        .opportunities-container {
          padding: 20px;
        }
        
        .no-data {
          text-align: center;
          padding: 40px;
          color: #6b7280;
        }
        
        .opportunities-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 16px;
        }
        
        .opportunity-card {
          background: white;
          border-radius: 8px;
          padding: 16px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          border-left: 4px solid #10b981;
        }
        
        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
          font-size: 12px;
          color: #6b7280;
        }
        
        .opportunity-index {
          background: #10b981;
          color: white;
          padding: 2px 6px;
          border-radius: 4px;
          font-weight: bold;
        }
        
        .opportunity-title {
          margin-bottom: 12px;
          font-size: 16px;
          color: #1f2937;
        }
        
        .opportunity-details {
          font-size: 14px;
        }
        
        .detail-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 6px;
          align-items: center;
        }
        
        .label {
          color: #6b7280;
          font-weight: 500;
        }
        
        .value {
          color: #1f2937;
          font-weight: 600;
        }
        
        .loading {
          padding: 40px;
          text-align: center;
        }
        
        .loading-spinner {
          font-size: 16px;
          color: #6b7280;
        }
        
        .error {
          padding: 40px;
          text-align: center;
        }
        
        .error h3 {
          color: #ef4444;
          margin-bottom: 8px;
        }
        
        .retry-btn {
          background: #3b82f6;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 6px;
          cursor: pointer;
          margin-top: 12px;
        }
        
        .retry-btn:hover {
          background: #2563eb;
        }
        
        @media (max-width: 768px) {
          .opportunities-grid {
            grid-template-columns: 1fr;
          }
          
          .list-header {
            padding: 12px 16px;
            flex-direction: column;
            align-items: flex-start;
            gap: 8px;
          }
          
          .summary {
            flex-direction: row;
            align-items: center;
            gap: 16px;
          }
        }
      `}</style>
    </div>
  );
};

export default WonOpportunitiesList;