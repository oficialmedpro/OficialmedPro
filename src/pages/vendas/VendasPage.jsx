import React, { useState, useEffect } from 'react';
import './VendasPage.css';
import Acolhimento from './Acolhimento';
import Orcamentista from './Orcamentista';
import VendasAbas from './VendasAbas';
import { getUnidades, getFunisPorUnidade, getVendedores } from '../../service/FilterBarService';

const VendasPage = ({ onLogout }) => {
  const [activeTab, setActiveTab] = useState('acolhimento');
  const [unidades, setUnidades] = useState([]);
  const [funis, setFunis] = useState([]);
  const [vendedores, setVendedores] = useState([]);
  const [unidadeSelecionada, setUnidadeSelecionada] = useState('');
  const [funilSelecionado, setFunilSelecionado] = useState('');
  const [vendedorSelecionado, setVendedorSelecionado] = useState('');
  const [periodo, setPeriodo] = useState('dia');
  const [isLoading, setIsLoading] = useState(true);
  const [role, setRole] = useState('supervisor'); // TODO: buscar do usuário logado

  // Carregar dados iniciais
  useEffect(() => {
    loadInitialData();
  }, []);

  // Carregar funis quando unidade mudar
  useEffect(() => {
    if (unidadeSelecionada) {
      loadFunis(unidadeSelecionada);
    }
  }, [unidadeSelecionada]);

  // Carregar vendedores quando unidade mudar
  useEffect(() => {
    if (unidadeSelecionada) {
      loadVendedores(unidadeSelecionada);
    }
  }, [unidadeSelecionada]);

  const loadInitialData = async () => {
    try {
      setIsLoading(true);
      const unidadesData = await getUnidades();
      setUnidades(unidadesData || []);
      setUnidadeSelecionada(unidadesData?.[0]?.codigo_sprint || '');
    } catch (error) {
      console.error('Erro ao carregar dados iniciais:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadFunis = async (unidadeId) => {
    try {
      const funisData = await getFunisPorUnidade(unidadeId);
      setFunis(funisData || []);
      setFunilSelecionado(funisData?.[0]?.id_funil_sprint || '');
    } catch (error) {
      console.error('Erro ao carregar funis:', error);
    }
  };

  const loadVendedores = async (unidadeId) => {
    try {
      const vendedoresData = await getVendedores(unidadeId);
      setVendedores(vendedoresData || []);
    } catch (error) {
      console.error('Erro ao carregar vendedores:', error);
    }
  };

  const contexto = {
    unidadeId: unidadeSelecionada,
    funilId: funilSelecionado,
    vendedorId: vendedorSelecionado,
    periodo
  };

  return (
    <div className="vendas-container">
      {/* Cabeçalho */}
      <div className="toolbar vendas-toolbar">
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <h1>OficialMedPro – Painel Operacional</h1>
          <span className="pill">
            Período
            <select value={periodo} onChange={(e) => setPeriodo(e.target.value)}>
              <option value="dia">Hoje</option>
              <option value="semana">Esta semana</option>
              <option value="mes">Este mês</option>
            </select>
          </span>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span className="pill">
            Usuário: <strong>Supervisor</strong>
          </span>
          <select value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="supervisor">Supervisor</option>
            <option value="acolhimento">Acolhimento</option>
            <option value="orcamentista">Orçamentista</option>
            <option value="vendas">Vendas</option>
          </select>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs">
        <button 
          className={`tab-btn ${activeTab === 'acolhimento' ? 'active' : ''}`}
          onClick={() => setActiveTab('acolhimento')}
        >
          Acolhimento
        </button>
        <button 
          className={`tab-btn ${activeTab === 'orcamento' ? 'active' : ''}`}
          onClick={() => setActiveTab('orcamento')}
        >
          Orçamentista
        </button>
        <button 
          className={`tab-btn ${activeTab === 'vendas' ? 'active' : ''}`}
          onClick={() => setActiveTab('vendas')}
        >
          Vendas
        </button>
      </div>

      {/* Conteúdo das abas */}
      {isLoading ? (
        <div style={{ textAlign: 'center', padding: 40 }}>
          <div className="loading-spinner"></div>
          <p style={{ marginTop: 16 }}>Carregando dados...</p>
        </div>
      ) : (
        <>
          {activeTab === 'acolhimento' && <Acolhimento contexto={contexto} role={role} />}
          {activeTab === 'orcamento' && <Orcamentista contexto={contexto} role={role} />}
          {activeTab === 'vendas' && <VendasAbas contexto={contexto} role={role} />}
        </>
      )}
    </div>
  );
};

export default VendasPage;

