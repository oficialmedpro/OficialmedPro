/**
 * Componente Header do Flow
 * 
 * Menu superior fixo com logo, busca, navegação, seletor de unidade e informações do usuário
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FiSearch, FiBarChart2, FiRefreshCw, FiSun, FiMoon, FiChevronDown, FiLogOut, FiUser } from 'react-icons/fi';
import LogoOficialmedFlow from '../../../../icones/oficialmed_flow.svg';
import './FlowHeader.css';

const FlowHeader = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchTerm, setSearchTerm] = useState('');
  const [userData, setUserData] = useState(null);
  const [selectedUnidade, setSelectedUnidade] = useState(() => {
    return localStorage.getItem('flow-unidade') || '[1]';
  });
  const [unidades, setUnidades] = useState([]);
  const [unidadesMap, setUnidadesMap] = useState({});
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showEsteirasMenu, setShowEsteirasMenu] = useState(false);
  const [esteiras, setEsteiras] = useState([]);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('flow-theme');
    if (saved) return saved === 'dark';
    // Padrão dark como no projeto
    return true;
  });

  useEffect(() => {
    // Carregar dados do usuário
    const loadUserData = async () => {
      // Tentar buscar do localStorage (reativacao_userData ou outro)
      const storedUserData = localStorage.getItem('reativacao_userData') || 
                            localStorage.getItem('userData') ||
                            localStorage.getItem('flow_userData');
      
      if (storedUserData) {
        try {
          const parsed = JSON.parse(storedUserData);
          setUserData({
            firstName: parsed.firstName || parsed.first_name || 'Usuário',
            lastName: parsed.lastName || parsed.last_name || '',
            userType: parsed.userType || parsed.userTypeName || 'Usuário'
          });
        } catch (e) {
          console.error('Erro ao carregar dados do usuário:', e);
        }
      }
    };

    loadUserData();

    // Carregar unidades disponíveis com nomes
    const loadUnidades = async () => {
      try {
        const { getSupabaseWithSchema } = await import('../../../service/supabase');
        const supabase = getSupabaseWithSchema('api');
        
        // Buscar unidades da tabela unidades
        const { data: unidadesData, error: unidadesError } = await supabase
          .from('unidades')
          .select('codigo_sprint, nome, cidade')
          .eq('status', 'ativo')
          .order('codigo_sprint');
        
        if (!unidadesError && unidadesData && unidadesData.length > 0) {
          // Criar mapa de unidades
          const map = {};
          unidadesData.forEach(u => {
            map[u.codigo_sprint] = u.nome || u.cidade || u.codigo_sprint;
          });
          setUnidadesMap(map);
          setUnidades(unidadesData.map(u => u.codigo_sprint));
        } else {
          // Fallback: buscar das funis se não houver tabela unidades
          const { data: funisData, error: funisError } = await supabase
            .from('funis')
            .select('unidade')
            .not('unidade', 'is', null)
            .order('unidade');
          
          if (!funisError && funisData) {
            const uniqueUnidades = [...new Set(funisData.map(f => f.unidade))];
            setUnidades(uniqueUnidades);
            // Mapeamento padrão
            const defaultMap = {
              '[1]': 'APUCARANA',
              '[2]': 'BOM JESUS',
              '[4]': 'LONDRINA'
            };
            setUnidadesMap(defaultMap);
          }
        }
      } catch (error) {
        console.error('Erro ao carregar unidades:', error);
        // Fallback com mapeamento padrão
        setUnidades(['[1]', '[2]', '[4]']);
        setUnidadesMap({
          '[1]': 'APUCARANA',
          '[2]': 'BOM JESUS',
          '[4]': 'LONDRINA'
        });
      }
    };

    loadUnidades();

    // Carregar esteiras para o menu
    const loadEsteiras = async () => {
      try {
        const { getAllEsteiras } = await import('../utils/flowHelpers');
        const esteirasData = await getAllEsteiras();
        setEsteiras(esteirasData);
      } catch (error) {
        console.error('Erro ao carregar esteiras:', error);
      }
    };

    loadEsteiras();

    // Fechar dropdowns ao clicar fora
    const handleClickOutside = (event) => {
      if (showUserMenu && !event.target.closest('.FlowHeader-user-menu')) {
        setShowUserMenu(false);
      }
      if (showEsteirasMenu && !event.target.closest('.FlowHeader-esteiras-menu')) {
        setShowEsteirasMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showUserMenu, showEsteirasMenu]);

  useEffect(() => {
    // Aplicar tema baseado na preferência
    const body = document.body;
    const flowContainer = document.querySelector('.FlowContainer');
    
    if (isDarkMode) {
      body.classList.add('flow-dark-mode');
      if (flowContainer) flowContainer.classList.add('flow-dark-mode');
      localStorage.setItem('flow-theme', 'dark');
    } else {
      body.classList.remove('flow-dark-mode');
      if (flowContainer) flowContainer.classList.remove('flow-dark-mode');
      localStorage.setItem('flow-theme', 'light');
    }
  }, [isDarkMode]);

  useEffect(() => {
    // Salvar unidade selecionada
    localStorage.setItem('flow-unidade', selectedUnidade);
    // Disparar evento customizado para atualizar componentes
    window.dispatchEvent(new CustomEvent('flow-unidade-changed', { detail: { unidade: selectedUnidade } }));
    
    // Recarregar esteiras quando a unidade mudar
    const loadEsteiras = async () => {
      try {
        const { getAllEsteiras } = await import('../utils/flowHelpers');
        const esteirasData = await getAllEsteiras();
        setEsteiras(esteirasData);
      } catch (error) {
        console.error('Erro ao carregar esteiras:', error);
      }
    };
    loadEsteiras();
  }, [selectedUnidade]);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;
    
    navigate(`/flow/buscar?q=${encodeURIComponent(searchTerm)}`);
  };

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  const handleLogout = () => {
    localStorage.removeItem('flow-unidade');
    localStorage.removeItem('flow-theme');
    navigate('/');
  };

  return (
    <header className="FlowHeader">
      <div className="FlowHeader-main">
        <div className="FlowHeader-left">
          <div className="FlowHeader-logo" onClick={() => navigate('/flow')}>
            <img src={LogoOficialmedFlow} alt="OficialMed Flow" className="FlowHeader-logo-img" />
          </div>

          <div className="FlowHeader-unidade-selector">
            <select
              className="FlowHeader-unidade-select"
              value={selectedUnidade}
              onChange={(e) => setSelectedUnidade(e.target.value)}
            >
              {unidades.map(unidade => {
                const nomeUnidade = unidadesMap[unidade] || unidade;
                return (
                  <option key={unidade} value={unidade}>
                    {nomeUnidade}
                  </option>
                );
              })}
            </select>
          </div>

          <form className="FlowHeader-search" onSubmit={handleSearch}>
            <FiSearch className="FlowHeader-search-icon" />
            <input
              type="text"
              placeholder="Buscar cliente (CPF, email, telefone)..."
              className="FlowHeader-search-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </form>
        </div>

        <nav className="FlowHeader-nav">
          <button
            className={`FlowHeader-nav-item ${location.pathname === '/flow' ? 'active' : ''}`}
            onClick={() => navigate('/flow')}
          >
            <FiBarChart2 className="FlowHeader-nav-icon" />
            <span>Dashboard</span>
          </button>
          <div className="FlowHeader-esteiras-menu">
            <button
              className={`FlowHeader-nav-item ${location.pathname.startsWith('/flow/esteiras') ? 'active' : ''}`}
              onClick={() => setShowEsteirasMenu(!showEsteirasMenu)}
            >
              <FiRefreshCw className="FlowHeader-nav-icon" />
              <span>Esteiras</span>
              <FiChevronDown className={`FlowHeader-nav-chevron ${showEsteirasMenu ? 'open' : ''}`} />
            </button>
            
            {showEsteirasMenu && (
              <div className="FlowHeader-esteiras-dropdown">
                {/* Grupo Compra */}
                {esteiras.filter(e => e.type === 'compra').length > 0 && (
                  <div className="FlowHeader-esteiras-group">
                    <div className="FlowHeader-esteiras-group-title">Compra</div>
                    {esteiras
                      .filter(e => e.type === 'compra')
                      .map(esteira => (
                        <button
                          key={esteira.id}
                          className="FlowHeader-esteiras-item"
                          onClick={() => {
                            navigate(`/flow/esteiras/${esteira.id}`);
                            setShowEsteirasMenu(false);
                          }}
                        >
                          {esteira.name.replace('[1] ', '')}
                        </button>
                      ))}
                  </div>
                )}

                {/* Grupo Operacional */}
                {esteiras.filter(e => e.type === 'operacional').length > 0 && (
                  <div className="FlowHeader-esteiras-group">
                    <div className="FlowHeader-esteiras-group-title">Operacional</div>
                    {esteiras
                      .filter(e => e.type === 'operacional')
                      .map(esteira => (
                        <button
                          key={esteira.id}
                          className="FlowHeader-esteiras-item"
                          onClick={() => {
                            navigate(`/flow/esteiras/${esteira.id}`);
                            setShowEsteirasMenu(false);
                          }}
                        >
                          {esteira.name.replace('[1] ', '')}
                        </button>
                      ))}
                  </div>
                )}

                {/* Grupo Recompra */}
                {esteiras.filter(e => e.type === 'recompra').length > 0 && (
                  <div className="FlowHeader-esteiras-group">
                    <div className="FlowHeader-esteiras-group-title">Recompra</div>
                    {esteiras
                      .filter(e => e.type === 'recompra')
                      .map(esteira => (
                        <button
                          key={esteira.id}
                          className="FlowHeader-esteiras-item"
                          onClick={() => {
                            navigate(`/flow/esteiras/${esteira.id}`);
                            setShowEsteirasMenu(false);
                          }}
                        >
                          {esteira.name.replace('[1] ', '')}
                        </button>
                      ))}
                  </div>
                )}

                {/* Grupo Independente */}
                {esteiras.filter(e => e.type === 'independente').length > 0 && (
                  <div className="FlowHeader-esteiras-group">
                    <div className="FlowHeader-esteiras-group-title">Independente</div>
                    {esteiras
                      .filter(e => e.type === 'independente')
                      .map(esteira => (
                        <button
                          key={esteira.id}
                          className="FlowHeader-esteiras-item"
                          onClick={() => {
                            navigate(`/flow/esteiras/${esteira.id}`);
                            setShowEsteirasMenu(false);
                          }}
                        >
                          {esteira.name.replace('[1] ', '')}
                        </button>
                      ))}
                  </div>
                )}
              </div>
            )}
          </div>
          
          <button
            className="FlowHeader-theme-toggle"
            onClick={toggleTheme}
            aria-label="Alternar tema"
            title={isDarkMode ? 'Alternar para modo claro' : 'Alternar para modo escuro'}
          >
            {isDarkMode ? (
              <FiSun className="FlowHeader-theme-icon" />
            ) : (
              <FiMoon className="FlowHeader-theme-icon" />
            )}
          </button>
          
          <div className="FlowHeader-user-menu">
            <button
              className="FlowHeader-user-button"
              onClick={() => setShowUserMenu(!showUserMenu)}
            >
              <div className="FlowHeader-user-avatar">
                <FiUser />
              </div>
              <div className="FlowHeader-user-info">
                <span className="FlowHeader-user-name">
                  {userData?.firstName || 'Usuário'} {userData?.lastName || ''}
                </span>
                <span className="FlowHeader-user-type">
                  {userData?.userType || 'Usuário'}
                </span>
              </div>
              <FiChevronDown className={`FlowHeader-user-chevron ${showUserMenu ? 'open' : ''}`} />
            </button>
            
            {showUserMenu && (
              <div className="FlowHeader-user-dropdown">
                <button className="FlowHeader-user-dropdown-item" onClick={handleLogout}>
                  <FiLogOut />
                  <span>Sair</span>
                </button>
              </div>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
};

export default FlowHeader;

