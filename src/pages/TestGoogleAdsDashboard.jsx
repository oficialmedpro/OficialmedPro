import React, { useState } from 'react';
import GoogleAdsDashboard from '../components/anuncios/GoogleAdsDashboard';

const TestGoogleAdsDashboard = () => {
  const [dateRange, setDateRange] = useState({
    since: '2025-10-20',
    until: '2025-10-22'
  });

  const handleDateChange = (field, value) => {
    setDateRange(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div style={{ padding: '20px', backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
      <h1>Teste Dashboard Google Ads</h1>
      
      <div style={{ marginBottom: '20px', padding: '20px', backgroundColor: 'white', borderRadius: '8px' }}>
        <h3>Controles de Teste</h3>
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
          <div>
            <label>Data Início:</label>
            <input
              type="date"
              value={dateRange.since}
              onChange={(e) => handleDateChange('since', e.target.value)}
              style={{ marginLeft: '10px', padding: '5px' }}
            />
          </div>
          <div>
            <label>Data Fim:</label>
            <input
              type="date"
              value={dateRange.until}
              onChange={(e) => handleDateChange('until', e.target.value)}
              style={{ marginLeft: '10px', padding: '5px' }}
            />
          </div>
        </div>
        <p style={{ marginTop: '10px', color: '#666' }}>
          Período selecionado: {dateRange.since} até {dateRange.until}
        </p>
      </div>

      <div style={{ backgroundColor: 'white', borderRadius: '8px', overflow: 'hidden' }}>
        <GoogleAdsDashboard 
          dateRange={dateRange}
          filteredCampaigns={[]}
        />
      </div>
    </div>
  );
};

export default TestGoogleAdsDashboard;
