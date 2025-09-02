import React, { useState, useEffect } from 'react';
import './FilterBar.css';
import { getUnidades, getFunisPorUnidade, getVendedores } from '../service/supabase.js';
import { handleDatePreset } from '../utils/utils.js';

const FilterBar = ({ t, selectedSeller, setSelectedSeller, selectedPeriod, setSelectedPeriod, selectedFunnel, setSelectedFunnel, selectedUnit, setSelectedUnit, startDate, setStartDate, endDate, setEndDate, onUnitFilterChange, onSellerFilterChange, marketData }) => {

  
  // Estado único para controlar qual dropdown está aberto (accordion)
  const [openDropdown, setOpenDropdown] = useState(null);

  // Estado para gerenciar a lista de unidades e seu carregamento
  const [units, setUnits] = useState([]);
  const [loadingUnits, setLoadingUnits] = useState(true);
  
  // Estado para gerenciar a lista de funis e seu carregamento
  const [funnels, setFunnels] = useState([]);
  const [loadingFunnels, setLoadingFunnels] = useState(true);
  
  // Estado para gerenciar a lista de vendedores e seu carregamento
  const [sellers, setSellers] = useState([]);
  const [loadingSellers, setLoadingSellers] = useState(true);

  const periods = [
    { id: 'today', name: 'Hoje' },
    { id: 'yesterday', name: 'Ontem' },
    { id: 'last7Days', name: 'Últimos 7 dias' },
    { id: 'thisMonth', name: 'Este mês' },
    { id: 'thisQuarter', name: 'Este trimestre' },
    { id: 'thisYear', name: 'Este ano' }
  ];

  // Buscar unidades do Supabase ao carregar o componente
  useEffect(() => {
    const fetchUnits = async () => {
      try {
        setLoadingUnits(true);
        const unidadesData = await getUnidades();
        
        // Transformar os dados para o formato esperado pelo componente
        const unidadesFormatted = [
          { id: 'all', name: 'Todas as Unidades', codigo_sprint: 'all' },
          ...unidadesData.map(unidade => ({
            id: unidade.codigo_sprint, // Usar codigo_sprint como ID
            name: unidade.unidade, // Usar campo 'unidade' para exibição
            codigo_sprint: unidade.codigo_sprint
          }))
        ];
        
        setUnits(unidadesFormatted);
        console.log('✅ Unidades carregadas:', unidadesFormatted);
      } catch (error) {
        console.error('❌ Erro ao carregar unidades:', error);
        // Removido fallback estático - apenas erro
        setUnits([]);
      } finally {
        setLoadingUnits(false);
      }
    };

    fetchUnits();
  }, []);

  // 🎯 Buscar funis do Supabase ao carregar o componente
  useEffect(() => {
    const fetchFunnels = async () => {
      try {
        setLoadingFunnels(true);
        const funisData = await getFunisPorUnidade(); // Buscar todos os funis inicialmente
        
        // Transformar os dados para o formato esperado pelo componente
        const funisFormatted = [
          { id: 'all', name: 'Todos os funis', id_funil_sprint: 'all' },
          ...funisData.map(funil => ({
            id: funil.id_funil_sprint, // Usar id_funil_sprint como ID
            name: funil.nome_funil, // Usar campo 'nome_funil' para exibição
            id_funil_sprint: funil.id_funil_sprint,
            unidade: funil.unidade
          }))
        ];
        
        setFunnels(funisFormatted);
        console.log('✅ Funis carregados:', funisFormatted);
      } catch (error) {
        console.error('❌ Erro ao carregar funis:', error);
        setFunnels([]);
      } finally {
        setLoadingFunnels(false);
      }
    };

    fetchFunnels();
  }, []);

  // 🎯 Buscar vendedores do Supabase - APENAS quando unidade específica for selecionada
  useEffect(() => {
    const fetchSellers = async () => {
      try {
        setLoadingSellers(true);
        
        console.log('🔍 DEBUG VENDEDORES:', {
          selectedUnit,
          units,
          selectedUnitData: units.find(u => u.id === selectedUnit)
        });
        
        // Se "Todas as Unidades" ou nenhuma unidade específica selecionada, mostrar apenas padrão
        if (selectedUnit === 'all' || !selectedUnit) {
          console.log('🔍 Nenhuma unidade específica selecionada, mostrando apenas padrão');
          setSellers([{ id: 'all', name: 'Todos os vendedores', id_sprint: 'all' }]);
          return;
        }
        
        // Buscar vendedores apenas da unidade específica selecionada
        console.log('🔍 Parâmetro que será enviado para getVendedores:', selectedUnit);
        
        const vendedoresData = await getVendedores(selectedUnit);
        console.log('🔍 Dados recebidos do getVendedores:', vendedoresData);
        
        // Transformar os dados para o formato esperado pelo componente
        const vendedoresFormatted = [
          { id: 'all', name: 'Todos os vendedores', id_sprint: 'all' },
          ...vendedoresData.map(vendedor => ({
            id: vendedor.id_sprint, // Usar id_sprint como ID
            name: vendedor.nome, // Usar campo 'nome' para exibição
            id_sprint: vendedor.id_sprint,
            id_unidade: vendedor.id_unidade
          }))
        ];
        
        setSellers(vendedoresFormatted);
        console.log(`✅ Vendedores formatados para unidade ${selectedUnit}:`, vendedoresFormatted);
      } catch (error) {
        console.error('❌ Erro ao carregar vendedores:', error);
        // Quando não tiver vendedor, deixar apenas "Todos os vendedores"
        setSellers([{ id: 'all', name: 'Todos os vendedores', id_sprint: 'all' }]);
      } finally {
        setLoadingSellers(false);
      }
    };

    fetchSellers();
  }, [selectedUnit, units]); // Reagir à mudança de unidade selecionada

  // Atualizar horário em tempo real
  useEffect(() => {
    const updateTime = () => {
      const timeElement = document.getElementById('current-time-filterbar');
      if (timeElement) {
        timeElement.textContent = new Date().toLocaleTimeString('pt-BR', { 
          hour: '2-digit', 
          minute: '2-digit' 
        });
      }
    };

    updateTime();
    const timeInterval = setInterval(updateTime, 60000); // Atualizar a cada minuto
    return () => clearInterval(timeInterval);
  }, []);

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

  const handleUnitChange = async (unitId) => {
    setSelectedUnit(unitId);
    setOpenDropdown(null); // Fecha o dropdown
    
    // 🔗 RELAÇÃO CONFIRMADA: unidades.codigo_sprint ↔ oportunidade_sprint.unidade_id
    // Quando uma unidade é selecionada, passamos o codigo_sprint para filtrar oportunidades
    if (onUnitFilterChange) {
      const selectedUnitData = units.find(u => u.id === unitId);
      if (selectedUnitData) {
        // Se for "Todas as Unidades", passa null para não filtrar
        const filterValue = unitId === 'all' ? null : selectedUnitData.codigo_sprint;
        console.log(`🎯 Filtro de unidade aplicado:`, {
          unitName: selectedUnitData.name,
          codigoSprint: selectedUnitData.codigo_sprint,
          filterValue: filterValue,
          message: filterValue ? `Filtrando oportunidades com unidade_id = "${filterValue}"` : 'Mostrando todas as unidades'
        });
        
        // Chama o callback do componente pai para aplicar o filtro
        onUnitFilterChange(filterValue);
      }
    }

    // 🎯 ATUALIZAR FUNIS BASEADO NA UNIDADE SELECIONADA
    try {
      setLoadingFunnels(true);
      const funisData = await getFunisPorUnidade(unitId);
      
      // Transformar os dados para o formato esperado pelo componente
      const funisFormatted = [
        { id: 'all', name: 'Todos os funis', id_funil_sprint: 'all' },
        ...funisData.map(funil => ({
          id: funil.id_funil_sprint, // Usar id_funil_sprint como ID
          name: funil.nome_funil, // Usar campo 'nome_funil' para exibição
          id_funil_sprint: funil.id_funil_sprint,
          unidade: funil.unidade
        }))
      ];
      
      setFunnels(funisFormatted);
      console.log(`🎯 Funis atualizados para unidade ${unitId}:`, funisFormatted);
      
      // Resetar seleção de funil para "Todos os funis"
      setSelectedFunnel('all');
      
    } catch (error) {
      console.error('❌ Erro ao atualizar funis:', error);
      setFunnels([]);
    } finally {
      setLoadingFunnels(false);
    }
    
    // 🎯 Os vendedores serão atualizados automaticamente via useEffect que reage ao selectedUnit
  };

  const handleSellerChange = (sellerId) => {
    setSelectedSeller(sellerId);
    setOpenDropdown(null); // Fecha o dropdown
    
    // 🎯 FILTRO DE VENDEDOR: Aplicar filtro por user_id na tabela oportunidade_sprint
    if (onSellerFilterChange) {
      const selectedSellerData = sellers.find(s => s.id === sellerId);
      if (selectedSellerData) {
        // Se for "Todos os vendedores", passa null para não filtrar
        const filterValue = sellerId === 'all' ? null : selectedSellerData.id_sprint;
        console.log(`🎯 Filtro de vendedor aplicado:`, {
          sellerName: selectedSellerData.name,
          idSprint: selectedSellerData.id_sprint,
          filterValue: filterValue,
          message: filterValue ? `Filtrando oportunidades com user_id = "${filterValue}"` : 'Mostrando todos os vendedores'
        });
        
        // Chama o callback do componente pai para aplicar o filtro
        onSellerFilterChange(filterValue);
      }
    }
    
    console.log(`🎯 Vendedor selecionado:`, {
      sellerId,
      vendedorData: sellers.find(s => s.id === sellerId)
    });
  };

  return (
    <div className="fb-filter-bar">
      {/* Seção Esquerda - Indicadores */}
      <div className="fb-indicators-section">
        {/* Indicadores de mercado */}
        <div className="fb-market-indicators">
          <div className="fb-indicator-item">
            <span className="fb-indicator-label">USD:</span>
            <span className="fb-indicator-value">
              R$ {typeof marketData?.usd === 'number' ? marketData.usd.toFixed(2) : '5.20'}
            </span>
          </div>
          <div className="fb-indicator-item">
            <span className="fb-indicator-label">EUR:</span>
            <span className="fb-indicator-value">
              R$ {typeof marketData?.eur === 'number' ? marketData.eur.toFixed(2) : '5.45'}
            </span>
          </div>
          <div className="fb-indicator-item">
            <span className="fb-indicator-label">IBOV:</span>
            <span className="fb-indicator-value">
              {typeof marketData?.ibov === 'number' ? marketData.ibov.toLocaleString() : '125.432'}
            </span>
          </div>
        </div>

        {/* Data e hora */}
        <div className="fb-datetime-indicators">
          <div className="fb-date-indicator">
            <span className="fb-date-label">Data:</span>
            <span className="fb-date-value">{new Date().toLocaleDateString('pt-BR')}</span>
          </div>
          <div className="fb-time-indicator">
            <span className="fb-time-label">Hora:</span>
            <span className="fb-time-value" id="current-time-filterbar">
              {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        </div>
      </div>

      {/* Seção Direita - Filtros */}
      <div className="fb-filters-section">
        {/* Filtro de Unidades - AGORA EM PRIMEIRO */}
        <div className="fb-filter-group">
          <div className="fb-dropdown-container">
            <button 
              className="fb-dropdown-button"
              onClick={() => toggleDropdown('units')}
            >
              <span>
                {loadingUnits ? 'Carregando...' : 
                  units.find(u => u.id === selectedUnit)?.name || 'Todas as Unidades'
                }
              </span>
              <span className="fb-dropdown-arrow">▼</span>
            </button>
            
            {openDropdown === 'units' && !loadingUnits && (
              <div className="fb-dropdown-menu">
                {units.length === 0 ? (
                  <div className="fb-dropdown-item">Nenhuma unidade encontrada.</div>
                ) : (
                  units.map((unit) => (
                    <div 
                      key={unit.id}
                      className={`fb-dropdown-item ${selectedUnit === unit.id ? 'fb-selected' : ''}`}
                      onClick={() => handleUnitChange(unit.id)}
                    >
                      {unit.name}
                    </div>
                  ))
                )}
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
              disabled={loadingFunnels}
            >
              <span>
                {loadingFunnels ? 'Carregando...' : 
                  funnels.find(f => f.id === selectedFunnel)?.name || 'Todos os funis'
                }
              </span>
              <span className="fb-dropdown-arrow">▼</span>
            </button>
            
            {openDropdown === 'funnels' && !loadingFunnels && (
              <div className="fb-dropdown-menu">
                {funnels.length === 0 ? (
                  <div className="fb-dropdown-item">Nenhum funil encontrado.</div>
                ) : (
                  funnels.map((funnel) => (
                    <div 
                      key={funnel.id}
                      className={`fb-dropdown-item ${selectedFunnel === funnel.id ? 'fb-selected' : ''}`}
                      onClick={() => handleFunnelChange(funnel.id)}
                    >
                      {funnel.name}
                    </div>
                  ))
                )}
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
              disabled={loadingSellers}
            >
              <span>
                {loadingSellers ? 'Carregando...' : 
                  sellers.find(s => s.id === selectedSeller)?.name || 'Todos os vendedores'
                }
              </span>
              <span className="fb-dropdown-arrow">▼</span>
            </button>
            
            {openDropdown === 'sellers' && !loadingSellers && (
              <div className="fb-dropdown-menu">
                {sellers.length === 0 ? (
                  <div className="fb-dropdown-item">Nenhum vendedor encontrado.</div>
                ) : (
                  sellers.map((seller) => (
                    <div 
                      key={seller.id}
                      className={`fb-dropdown-item ${selectedSeller === seller.id ? 'fb-selected' : ''}`}
                      onClick={() => handleSellerChange(seller.id)}
                    >
                      {seller.name}
                    </div>
                  ))
                )}
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
                        // Calcular datas corretas baseado no período selecionado
                        const { start, end } = handleDatePreset(period.id);
                        if (start && end) {
                          setStartDate(start);
                          setEndDate(end);
                          console.log(`📅 Período ${period.name} aplicado:`, { start, end });
                        }
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
                        console.log('🎯 APLICANDO PERÍODO PERSONALIZADO:', { 
                          startDate, 
                          endDate, 
                          startDateType: typeof startDate,
                          endDateType: typeof endDate 
                        });
                        setSelectedPeriod('custom');
                        setOpenDropdown(null);
                        // Força um re-render para garantir que as datas sejam aplicadas
                        console.log(`📅 Período personalizado aplicado: ${startDate} até ${endDate}`);
                      } else {
                        console.log('❌ ERRO: Datas não definidas para período personalizado:', { startDate, endDate });
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
    </div>
  );
};

export default FilterBar;
