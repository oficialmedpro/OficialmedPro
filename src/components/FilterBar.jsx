import React, { useState, useEffect } from 'react';
import './FilterBar.css';
import { getUnidades, getFunisPorUnidade } from '../service/supabase.js';

const FilterBar = ({ t, selectedStatus, setSelectedStatus, selectedSeller, setSelectedSeller, selectedPeriod, setSelectedPeriod, selectedFunnel, setSelectedFunnel, selectedUnit, setSelectedUnit, startDate, setStartDate, endDate, setEndDate, onUnitFilterChange, onStatusFilterChange }) => {

  
  // Estado único para controlar qual dropdown está aberto (accordion)
  const [openDropdown, setOpenDropdown] = useState(null);

  // Estado para gerenciar a lista de unidades e seu carregamento
  const [units, setUnits] = useState([]);
  const [loadingUnits, setLoadingUnits] = useState(true);
  
  // Estado para gerenciar a lista de funis e seu carregamento
  const [funnels, setFunnels] = useState([]);
  const [loadingFunnels, setLoadingFunnels] = useState(true);

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
                  
                  // 🎯 FILTRO: Venda → status_orcamento = 'aprovado'
                  if (onStatusFilterChange) {
                    onStatusFilterChange({
                      type: 'sale',
                      field: 'status_orcamento',
                      value: 'aprovado',
                      description: 'Orçamentos aprovados pelo vendedor'
                    });
                  }
                }}
              >
                Venda
              </div>
              <div 
                className={`fb-dropdown-item ${selectedStatus === 'won' ? 'fb-selected' : ''}`}
                onClick={() => {
                  setSelectedStatus('won');
                  setOpenDropdown(null);
                  
                  // 🎯 FILTRO: Ganho → status = 'gain'
                  if (onStatusFilterChange) {
                    onStatusFilterChange({
                      type: 'won',
                      field: 'status',
                      value: 'gain',
                      description: 'Oportunidades ganhas no CRM'
                    });
                  }
                }}
              >
                Ganho
              </div>
              <div 
                className={`fb-dropdown-item ${selectedStatus === 'registered' ? 'fb-selected' : ''}`}
                onClick={() => {
                  setSelectedStatus('registered');
                  setOpenDropdown(null);
                  
                  // 🎯 FILTRO: Cadastro → primecadastro = 1
                  if (onStatusFilterChange) {
                    onStatusFilterChange({
                      type: 'registered',
                      field: 'primecadastro',
                      value: 1,
                      description: 'Clientes cadastrados no ERP'
                    });
                  }
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
