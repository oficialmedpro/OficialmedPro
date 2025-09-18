import React, { useState } from 'react';
import LossReasonsHeader from '../components/LossReasonsHeader';
import TopMenuBar from '../components/TopMenuBar';

const LossReasonsDebugPage = ({ onLogout }) => {
  const [startDate, setStartDate] = useState('2025-09-01');
  const [endDate, setEndDate] = useState('2025-09-17');
  const [selectedFunnel, setSelectedFunnel] = useState(6);
  const [selectedUnit, setSelectedUnit] = useState('[1]');
  const [selectedSeller, setSelectedSeller] = useState('all');
  const [selectedOrigin, setSelectedOrigin] = useState('all');

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const t = (key) => key; // Função de tradução simples

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
      color: '#f8fafc'
    }}>
      <TopMenuBar onLogout={onLogout} />
      
      <div style={{ padding: '20px' }}>
        <div style={{ 
          background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
          borderRadius: '16px',
          padding: '24px',
          marginBottom: '24px',
          border: '1px solid #475569'
        }}>
          <h1 style={{ 
            color: '#f8fafc', 
            marginBottom: '20px',
            fontSize: '24px',
            fontWeight: '700'
          }}>
            🎯 DEBUG - Loss Reasons Header
          </h1>
          
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
            gap: '16px',
            marginBottom: '20px'
          }}>
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', color: '#94a3b8' }}>
                Data Início:
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px',
                  borderRadius: '8px',
                  border: '1px solid #475569',
                  background: '#1e293b',
                  color: '#f8fafc',
                  fontSize: '14px'
                }}
              />
            </div>
            
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', color: '#94a3b8' }}>
                Data Fim:
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px',
                  borderRadius: '8px',
                  border: '1px solid #475569',
                  background: '#1e293b',
                  color: '#f8fafc',
                  fontSize: '14px'
                }}
              />
            </div>
            
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', color: '#94a3b8' }}>
                Funil:
              </label>
              <select
                value={selectedFunnel}
                onChange={(e) => setSelectedFunnel(parseInt(e.target.value))}
                style={{
                  width: '100%',
                  padding: '8px',
                  borderRadius: '8px',
                  border: '1px solid #475569',
                  background: '#1e293b',
                  color: '#f8fafc',
                  fontSize: '14px'
                }}
              >
                <option value={6}>Funil 6</option>
                <option value={1}>Funil 1</option>
                <option value={2}>Funil 2</option>
              </select>
            </div>
            
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', color: '#94a3b8' }}>
                Unidade:
              </label>
              <select
                value={selectedUnit}
                onChange={(e) => setSelectedUnit(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px',
                  borderRadius: '8px',
                  border: '1px solid #475569',
                  background: '#1e293b',
                  color: '#f8fafc',
                  fontSize: '14px'
                }}
              >
                <option value="[1]">Unidade [1]</option>
                <option value="[2]">Unidade [2]</option>
                <option value="[3]">Unidade [3]</option>
              </select>
            </div>
            
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', color: '#94a3b8' }}>
                Vendedor:
              </label>
              <select
                value={selectedSeller}
                onChange={(e) => setSelectedSeller(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px',
                  borderRadius: '8px',
                  border: '1px solid #475569',
                  background: '#1e293b',
                  color: '#f8fafc',
                  fontSize: '14px'
                }}
              >
                <option value="all">Todos</option>
                <option value="vendedor1">Vendedor 1</option>
                <option value="vendedor2">Vendedor 2</option>
              </select>
            </div>
            
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', color: '#94a3b8' }}>
                Origem:
              </label>
              <select
                value={selectedOrigin}
                onChange={(e) => setSelectedOrigin(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px',
                  borderRadius: '8px',
                  border: '1px solid #475569',
                  background: '#1e293b',
                  color: '#f8fafc',
                  fontSize: '14px'
                }}
              >
                <option value="all">Todas</option>
                <option value="Google Ads">Google Ads</option>
                <option value="Meta Ads">Meta Ads</option>
                <option value="Orgânico">Orgânico</option>
                <option value="WhatsApp">WhatsApp</option>
                <option value="Prescritor">Prescritor</option>
                <option value="Franquia">Franquia</option>
              </select>
            </div>
          </div>
          
          <div style={{ 
            background: '#0f172a',
            padding: '12px',
            borderRadius: '8px',
            fontSize: '12px',
            color: '#94a3b8',
            fontFamily: 'monospace'
          }}>
            <strong>Parâmetros atuais:</strong><br/>
            startDate: {startDate} | endDate: {endDate}<br/>
            selectedFunnel: {selectedFunnel} | selectedUnit: {selectedUnit}<br/>
            selectedSeller: {selectedSeller} | selectedOrigin: {selectedOrigin}
          </div>
        </div>
        
        <div style={{ 
          background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
          borderRadius: '16px',
          padding: '24px',
          border: '1px solid #475569'
        }}>
          <LossReasonsHeader
            formatCurrency={formatCurrency}
            t={t}
            startDate={startDate}
            endDate={endDate}
            selectedFunnel={selectedFunnel}
            selectedUnit={selectedUnit}
            selectedSeller={selectedSeller}
            selectedOrigin={selectedOrigin}
          />
        </div>
      </div>
    </div>
  );
};

export default LossReasonsDebugPage;
