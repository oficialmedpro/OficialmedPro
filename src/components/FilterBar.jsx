import React, { useState } from 'react';
import './FilterBar.css';

const FilterBar = ({ t, selectedStatus, setSelectedStatus, selectedSeller, setSelectedSeller, selectedPeriod, setSelectedPeriod, selectedFunnel, setSelectedFunnel, selectedUnit, setSelectedUnit, startDate, setStartDate, endDate, setEndDate }) => {

  
  // Estado único para controlar qual dropdown está aberto (accordion)
  const [openDropdown, setOpenDropdown] = useState(null);

  const funnels = [
    { id: 'all', name: 'Todos os funis' },
    { id: 'comercial', name: 'Funil Comercial' },
    { id: 'recompra', name: 'Funil Recompra' }
  ];

  const units = [
    { id: 'all', name: 'Todas as Unidades' },
    { id: 'apucarana', name: 'Unidade Apucarana' },
    { id: 'bomjesus', name: 'Unidade Bom Jesus' },
    { id: 'londrina', name: 'Unidade Londrina' },
    { id: 'maringa', name: 'Unidade Maringá' },
    { id: 'cascavel', name: 'Unidade Cascavel' }
  ];

  const sellers = [
    { id: 'all', name: 'Todos os vendedores' },
    { id: 'joao', name: 'João Silva' },
    { id: 'maria', name: 'Maria Santos' },
    { id: 'pedro', name: 'Pedro Costa' }
  ];

  const periods = [
    { id: 'today', name: 'Hoje' },
    { id: 'yesterday', name: 'Ontem' },
    { id: 'last7Days', name: 'Últimos 7 dias' },
    { id: 'thisMonth', name: 'Este mês' },
    { id: 'thisQuarter', name: 'Este trimestre' },
    { id: 'thisYear', name: 'Este ano' }
  ];

  // Função para alternar dropdowns (accordion)
  const toggleDropdown = (dropdownName) => {
    if (openDropdown === dropdownName) {
      // Se clicar no mesmo dropdown que está aberto, fecha
      setOpenDropdown(null);
    } else {
      // Se clicar em um dropdown diferente, abre ele e fecha os outros
      setOpenDropdown(dropdownName);
    }
  };

  const handleFunnelChange = (funnelId) => {
    setSelectedFunnel(funnelId);
    setOpenDropdown(null); // Fecha o dropdown
  };

  const handleUnitChange = (unitId) => {
    setSelectedUnit(unitId);
    setOpenDropdown(null); // Fecha o dropdown
  };

  const handleSellerChange = (sellerId) => {
    setSelectedSeller(sellerId);
    setOpenDropdown(null); // Fecha o dropdown
  };

  return (
    <div className="fb-filter-bar">
      {/* Filtro de Unidades - AGORA EM PRIMEIRO */}
      <div className="fb-filter-group">
        <div className="fb-dropdown-container">
          <button 
            className="fb-dropdown-button"
            onClick={() => toggleDropdown('units')}
          >
            <span>{units.find(u => u.id === selectedUnit)?.name || 'Todas as Unidades'}</span>
            <span className="fb-dropdown-arrow">▼</span>
          </button>
          
          {openDropdown === 'units' && (
            <div className="fb-dropdown-menu">
              {units.map((unit) => (
                <div 
                  key={unit.id}
                  className={`fb-dropdown-item ${selectedUnit === unit.id ? 'fb-selected' : ''}`}
                  onClick={() => handleUnitChange(unit.id)}
                >
                  {unit.name}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Filtro de Funis - AGORA EM SEGUNDO */}
      <div className="fb-filter-group">
        <div className="fb-dropdown-container">
          <button 
            className="fb-dropdown-button"
            onClick={() => toggleDropdown('funnels')}
          >
            <span>{funnels.find(f => f.id === selectedFunnel)?.name || 'Todos os funis'}</span>
            <span className="fb-dropdown-arrow">▼</span>
          </button>
          
          {openDropdown === 'funnels' && (
            <div className="fb-dropdown-menu">
              {funnels.map((funnel) => (
                <div 
                  key={funnel.id}
                  className={`fb-dropdown-item ${selectedFunnel === funnel.id ? 'fb-selected' : ''}`}
                  onClick={() => handleFunnelChange(funnel.id)}
                >
                  {funnel.name}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Filtro de Status */}
      <div className="fb-filter-group">
        <div className="fb-dropdown-container fb-status-dropdown">
          <button 
            className="fb-dropdown-button"
            onClick={() => toggleDropdown('status')}
          >
            <span>{selectedStatus === 'sale' ? 'Venda' : selectedStatus === 'won' ? 'Ganho' : 'Cadastrado'}</span>
            <span className="fb-dropdown-arrow">▼</span>
          </button>
          
          {openDropdown === 'status' && (
            <div className="fb-dropdown-menu">
              <div 
                className={`fb-dropdown-item ${selectedStatus === 'sale' ? 'fb-selected' : ''}`}
                onClick={() => {
                  setSelectedStatus('sale');
                  setOpenDropdown(null);
                }}
              >
                Venda
              </div>
              <div 
                className={`fb-dropdown-item ${selectedStatus === 'won' ? 'fb-selected' : ''}`}
                onClick={() => {
                  setSelectedStatus('won');
                  setOpenDropdown(null);
                }}
              >
                Ganho
              </div>
              <div 
                className={`fb-dropdown-item ${selectedStatus === 'registered' ? 'fb-selected' : ''}`}
                onClick={() => {
                  setSelectedStatus('registered');
                  setOpenDropdown(null);
                }}
              >
                Cadastrado
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Filtro de Vendedores */}
      <div className="fb-filter-group">
        <div className="fb-dropdown-container">
          <button 
            className="fb-dropdown-button"
            onClick={() => toggleDropdown('sellers')}
          >
            <span>{sellers.find(s => s.id === selectedSeller)?.name || 'Todos os vendedores'}</span>
            <span className="fb-dropdown-arrow">▼</span>
          </button>
          
          {openDropdown === 'sellers' && (
            <div className="fb-dropdown-menu">
              {sellers.map((seller) => (
                <div 
                  key={seller.id}
                  className={`fb-dropdown-item ${selectedSeller === seller.id ? 'fb-selected' : ''}`}
                  onClick={() => handleSellerChange(seller.id)}
                >
                  {seller.name}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Filtro de Período */}
      <div className="fb-filter-group">
        <div className="fb-dropdown-container">
          <button 
            className="fb-dropdown-button"
            onClick={() => toggleDropdown('period')}
          >
            <span>📅 {(() => {
              if (selectedPeriod === 'custom' && startDate && endDate) {
                return 'Período Personalizado';
              }
              const period = periods.find(p => p.id === selectedPeriod);
              return period ? period.name : 'Período';
            })()}</span>
            <span className="fb-dropdown-arrow">▼</span>
          </button>
          
          {openDropdown === 'period' && (
            <div className="fb-dropdown-menu fb-period-menu">
              {/* Opções de período pré-definido */}
              <div className="fb-period-presets">
                <div className="fb-period-section-title">Períodos rápidos</div>
                {periods.map((period) => (
                  <div 
                    key={period.id}
                    className={`fb-dropdown-item ${selectedPeriod === period.id ? 'fb-selected' : ''}`}
                                         onClick={() => {
                       setSelectedPeriod(period.id);
                       // Limpar datas personalizadas quando selecionar período pré-definido
                       setStartDate('');
                       setEndDate('');
                       setOpenDropdown(null);
                     }}
                  >
                    {period.name}
                  </div>
                ))}
              </div>
              
              {/* Separador */}
              <div className="fb-period-separator"></div>
              
              {/* Período personalizado */}
              <div className="fb-period-custom">
                <div className="fb-period-section-title">Período personalizado</div>
                <div className="fb-date-inputs">
                  <div className="fb-date-input-group">
                    <label>Data inicial</label>
                    <input 
                      type="date" 
                      className="fb-date-input"
                      onChange={(e) => setStartDate(e.target.value)}
                      value={startDate}
                    />
                  </div>
                  <div className="fb-date-input-group">
                    <label>Data final</label>
                    <input 
                      type="date" 
                      className="fb-date-input"
                      onChange={(e) => setEndDate(e.target.value)}
                      value={endDate}
                    />
                  </div>
                </div>
                <button 
                  className="fb-apply-period-btn"
                  onClick={() => {
                    if (startDate && endDate) {
                      setSelectedPeriod('custom');
                      setOpenDropdown(null);
                      // Opcional: mostrar mensagem de confirmação
                      console.log(`Período personalizado aplicado: ${startDate} a ${endDate}`);
                    }
                  }}
                  disabled={!startDate || !endDate}
                >
                  Aplicar Período
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FilterBar;
