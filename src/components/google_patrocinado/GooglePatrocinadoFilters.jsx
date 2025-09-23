import React, { useState, useEffect } from 'react';
// Usando ícones Unicode/emoji seguindo o padrão do projeto
import './GooglePatrocinadoFilters.css';

const GooglePatrocinadoFilters = ({
  dateRange,
  onDateRangeChange,
  searchTerm = '',
  onSearchChange,
  selectedAccount = 'all',
  onAccountChange,
  selectedStatus = 'all',
  onStatusChange,
  selectedCampaignType = 'all',
  onCampaignTypeChange,
  accounts = [],
  campaignTypes = [],
  onRefresh,
  isLoading = false,
  className = ''
}) => {
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showAccountDropdown, setShowAccountDropdown] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);
  
  // Estados locais para os inputs de data
  const [localDateRange, setLocalDateRange] = useState({
    since: dateRange?.since || '',
    until: dateRange?.until || ''
  });

  // Presets de data comuns
  const datePresets = [
    {
      label: 'Hoje',
      getValue: () => {
        const today = new Date().toISOString().split('T')[0];
        return { since: today, until: today };
      }
    },
    {
      label: 'Últimos 7 dias',
      getValue: () => {
        const today = new Date();
        const sevenDaysAgo = new Date(today);
        sevenDaysAgo.setDate(today.getDate() - 7);
        return {
          since: sevenDaysAgo.toISOString().split('T')[0],
          until: today.toISOString().split('T')[0]
        };
      }
    },
    {
      label: 'Últimos 30 dias',
      getValue: () => {
        const today = new Date();
        const thirtyDaysAgo = new Date(today);
        thirtyDaysAgo.setDate(today.getDate() - 30);
        return {
          since: thirtyDaysAgo.toISOString().split('T')[0],
          until: today.toISOString().split('T')[0]
        };
      }
    },
    {
      label: 'Este mês',
      getValue: () => {
        const today = new Date();
        const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
        return {
          since: firstDay.toISOString().split('T')[0],
          until: today.toISOString().split('T')[0]
        };
      }
    },
    {
      label: 'Mês passado',
      getValue: () => {
        const today = new Date();
        const firstDayLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        const lastDayLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
        return {
          since: firstDayLastMonth.toISOString().split('T')[0],
          until: lastDayLastMonth.toISOString().split('T')[0]
        };
      }
    }
  ];

  // Status disponíveis
  const statusOptions = [
    { value: 'all', label: 'Todos os Status' },
    { value: 'ENABLED', label: 'Ativas' },
    { value: 'PAUSED', label: 'Pausadas' },
    { value: 'REMOVED', label: 'Removidas' }
  ];

  // Atualizar dateRange local quando props mudarem
  useEffect(() => {
    if (dateRange) {
      setLocalDateRange({
        since: dateRange.since || '',
        until: dateRange.until || ''
      });
    }
  }, [dateRange]);

  // Aplicar preset de data
  const applyDatePreset = (preset) => {
    const newRange = preset.getValue();
    setLocalDateRange(newRange);
    if (onDateRangeChange) {
      onDateRangeChange(newRange);
    }
    setShowDatePicker(false);
  };

  // Aplicar data customizada
  const applyCustomDate = () => {
    if (localDateRange.since && localDateRange.until && onDateRangeChange) {
      onDateRangeChange(localDateRange);
      setShowDatePicker(false);
    }
  };

  // Limpar filtros
  const clearFilters = () => {
    if (onSearchChange) onSearchChange('');
    if (onAccountChange) onAccountChange('all');
    if (onStatusChange) onStatusChange('all');
    if (onCampaignTypeChange) onCampaignTypeChange('all');
  };

  // Fechar dropdowns ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.google-patrocinado-filter-dropdown')) {
        setShowDatePicker(false);
        setShowAccountDropdown(false);
        setShowStatusDropdown(false);
        setShowTypeDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={`google-patrocinado-filters ${className}`}>
      {/* Header dos Filtros */}
      <div className="google-patrocinado-filters-header">
        <div className="google-patrocinado-filters-title">
          <span style={{ fontSize: '20px' }}>🔍</span>
          <h3>Filtros</h3>
        </div>
        <div className="google-patrocinado-filters-actions">
          <button 
            className="google-patrocinado-clear-button"
            onClick={clearFilters}
            title="Limpar filtros"
          >
            <span style={{ fontSize: '16px' }}>✖️</span>
            Limpar
          </button>
          <button 
            className="google-patrocinado-refresh-button"
            onClick={onRefresh}
            disabled={isLoading}
            title="Atualizar dados"
          >
            <span style={{ fontSize: '16px' }} className={isLoading ? 'spinning' : ''}>🔄</span>
            {isLoading ? 'Carregando...' : 'Atualizar'}
          </button>
        </div>
      </div>

      {/* Barra de Filtros */}
      <div className="google-patrocinado-filters-bar">
        {/* Filtro de Data */}
        <div className="google-patrocinado-filter-item google-patrocinado-filter-dropdown">
          <button 
            className="google-patrocinado-filter-button"
            onClick={() => setShowDatePicker(!showDatePicker)}
          >
            <span style={{ fontSize: '16px' }}>📅</span>
            <span>
              {dateRange?.since && dateRange?.until ? 
                `${new Date(dateRange.since).toLocaleDateString('pt-BR')} - ${new Date(dateRange.until).toLocaleDateString('pt-BR')}` :
                'Selecionar período'
              }
            </span>
            <span style={{ fontSize: '16px' }} className={showDatePicker ? 'rotated' : ''}>▼</span>
          </button>
          
          {showDatePicker && (
            <div className="google-patrocinado-dropdown-content google-patrocinado-date-picker">
              <div className="google-patrocinado-date-presets">
                <h4>Presets Rápidos</h4>
                {datePresets.map((preset, index) => (
                  <button
                    key={index}
                    className="google-patrocinado-preset-button"
                    onClick={() => applyDatePreset(preset)}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
              
              <div className="google-patrocinado-date-custom">
                <h4>Período Personalizado</h4>
                <div className="google-patrocinado-date-inputs">
                  <div className="google-patrocinado-date-input-group">
                    <label>Data Inicial</label>
                    <input
                      type="date"
                      value={localDateRange.since}
                      onChange={(e) => setLocalDateRange(prev => ({ ...prev, since: e.target.value }))}
                      className="google-patrocinado-date-input"
                    />
                  </div>
                  <div className="google-patrocinado-date-input-group">
                    <label>Data Final</label>
                    <input
                      type="date"
                      value={localDateRange.until}
                      onChange={(e) => setLocalDateRange(prev => ({ ...prev, until: e.target.value }))}
                      className="google-patrocinado-date-input"
                    />
                  </div>
                </div>
                <button
                  className="google-patrocinado-apply-date-button"
                  onClick={applyCustomDate}
                  disabled={!localDateRange.since || !localDateRange.until}
                >
                  <span style={{ fontSize: '16px' }}>✓</span>
                  Aplicar
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Filtro de Busca */}
        <div className="google-patrocinado-filter-item">
          <div className="google-patrocinado-search-input">
            <span style={{ fontSize: '16px' }}>🔍</span>
            <input
              type="text"
              placeholder="Buscar campanhas..."
              value={searchTerm}
              onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
              className="google-patrocinado-search-field"
            />
            {searchTerm && (
              <button
                className="google-patrocinado-search-clear"
                onClick={() => onSearchChange && onSearchChange('')}
              >
                <span style={{ fontSize: '14px' }}>✖️</span>
              </button>
            )}
          </div>
        </div>

        {/* Filtro de Conta */}
        <div className="google-patrocinado-filter-item google-patrocinado-filter-dropdown">
          <button 
            className="google-patrocinado-filter-button"
            onClick={() => setShowAccountDropdown(!showAccountDropdown)}
          >
            <span>
              {selectedAccount === 'all' ? 
                'Todas as Contas' : 
                accounts.find(acc => acc.key === selectedAccount)?.name || selectedAccount
              }
            </span>
            <span style={{ fontSize: '16px' }} className={showAccountDropdown ? 'rotated' : ''}>▼</span>
          </button>
          
          {showAccountDropdown && (
            <div className="google-patrocinado-dropdown-content">
              <button
                className={`google-patrocinado-dropdown-item ${selectedAccount === 'all' ? 'active' : ''}`}
                onClick={() => {
                  onAccountChange && onAccountChange('all');
                  setShowAccountDropdown(false);
                }}
              >
                Todas as Contas
              </button>
              {accounts.map(account => (
                <button
                  key={account.key}
                  className={`google-patrocinado-dropdown-item ${selectedAccount === account.key ? 'active' : ''}`}
                  onClick={() => {
                    onAccountChange && onAccountChange(account.key);
                    setShowAccountDropdown(false);
                  }}
                >
                  {account.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Filtro de Status */}
        <div className="google-patrocinado-filter-item google-patrocinado-filter-dropdown">
          <button 
            className="google-patrocinado-filter-button"
            onClick={() => setShowStatusDropdown(!showStatusDropdown)}
          >
            <span>
              {statusOptions.find(status => status.value === selectedStatus)?.label || 'Status'}
            </span>
            <span style={{ fontSize: '16px' }} className={showStatusDropdown ? 'rotated' : ''}>▼</span>
          </button>
          
          {showStatusDropdown && (
            <div className="google-patrocinado-dropdown-content">
              {statusOptions.map(status => (
                <button
                  key={status.value}
                  className={`google-patrocinado-dropdown-item ${selectedStatus === status.value ? 'active' : ''}`}
                  onClick={() => {
                    onStatusChange && onStatusChange(status.value);
                    setShowStatusDropdown(false);
                  }}
                >
                  {status.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Filtro de Tipo de Campanha */}
        {campaignTypes.length > 0 && (
          <div className="google-patrocinado-filter-item google-patrocinado-filter-dropdown">
            <button 
              className="google-patrocinado-filter-button"
              onClick={() => setShowTypeDropdown(!showTypeDropdown)}
            >
              <span>
                {selectedCampaignType === 'all' ? 'Todos os Tipos' : selectedCampaignType}
              </span>
              <span style={{ fontSize: '16px' }} className={showTypeDropdown ? 'rotated' : ''}>▼</span>
            </button>
            
            {showTypeDropdown && (
              <div className="google-patrocinado-dropdown-content">
                <button
                  className={`google-patrocinado-dropdown-item ${selectedCampaignType === 'all' ? 'active' : ''}`}
                  onClick={() => {
                    onCampaignTypeChange && onCampaignTypeChange('all');
                    setShowTypeDropdown(false);
                  }}
                >
                  Todos os Tipos
                </button>
                {campaignTypes.map(type => (
                  <button
                    key={type}
                    className={`google-patrocinado-dropdown-item ${selectedCampaignType === type ? 'active' : ''}`}
                    onClick={() => {
                      onCampaignTypeChange && onCampaignTypeChange(type);
                      setShowTypeDropdown(false);
                    }}
                  >
                    {type}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Filtros Ativos */}
      {(searchTerm || selectedAccount !== 'all' || selectedStatus !== 'all' || selectedCampaignType !== 'all') && (
        <div className="google-patrocinado-active-filters">
          <span className="google-patrocinado-active-filters-label">Filtros ativos:</span>
          
          {searchTerm && (
            <div className="google-patrocinado-active-filter-tag">
              <span>Busca: "{searchTerm}"</span>
              <button onClick={() => onSearchChange && onSearchChange('')}>
                <span style={{ fontSize: '12px' }}>✖️</span>
              </button>
            </div>
          )}
          
          {selectedAccount !== 'all' && (
            <div className="google-patrocinado-active-filter-tag">
              <span>Conta: {accounts.find(acc => acc.key === selectedAccount)?.name || selectedAccount}</span>
              <button onClick={() => onAccountChange && onAccountChange('all')}>
                <span style={{ fontSize: '12px' }}>✖️</span>
              </button>
            </div>
          )}
          
          {selectedStatus !== 'all' && (
            <div className="google-patrocinado-active-filter-tag">
              <span>Status: {statusOptions.find(s => s.value === selectedStatus)?.label}</span>
              <button onClick={() => onStatusChange && onStatusChange('all')}>
                <span style={{ fontSize: '12px' }}>✖️</span>
              </button>
            </div>
          )}
          
          {selectedCampaignType !== 'all' && (
            <div className="google-patrocinado-active-filter-tag">
              <span>Tipo: {selectedCampaignType}</span>
              <button onClick={() => onCampaignTypeChange && onCampaignTypeChange('all')}>
                <span style={{ fontSize: '12px' }}>✖️</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default GooglePatrocinadoFilters;
