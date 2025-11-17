/**
 * Página Kanban de Oportunidades
 * 
 * Exibe oportunidades organizadas por funil e etapa em formato Kanban
 * Seguindo o padrão visual do sistema SprintHub
 */

import React, { useState, useEffect, useRef } from 'react';
import './CrmKanbanPage.css';
import crmKanbanService from '../services/crmKanbanService';
import CrmKanbanBoard from '../components/CrmKanbanBoard';
import { 
  ChevronDown, 
  ArrowUpDown, 
  Info, 
  List, 
  LayoutGrid, 
  Folder, 
  CheckSquare, 
  Filter,
  Plus
} from 'lucide-react';

const CrmKanbanPage = () => {
  const [unidades, setUnidades] = useState([]);
  const [funis, setFunis] = useState([]);
  const [selectedUnidade, setSelectedUnidade] = useState(null);
  const [selectedFunil, setSelectedFunil] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('Aberta');
  const [viewMode, setViewMode] = useState('kanban'); // 'kanban' ou 'lista'

  // Carregar unidades ao montar
  useEffect(() => {
    loadUnidades();
  }, []);

  // Carregar funis quando unidade for selecionada
  useEffect(() => {
    if (selectedUnidade) {
      const unidadeCodigo = selectedUnidade.codigo_sprint || selectedUnidade.unidade;
      console.log('[CrmKanbanPage] Unidade selecionada:', selectedUnidade);
      console.log('[CrmKanbanPage] Código da unidade para buscar funis:', unidadeCodigo);
      loadFunis(unidadeCodigo);
    } else {
      setFunis([]);
      setSelectedFunil(null);
    }
  }, [selectedUnidade]);

  const loadUnidades = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await crmKanbanService.fetchUnidades();
      setUnidades(data);
    } catch (err) {
      setError('Erro ao carregar unidades');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadFunis = async (unidadeId) => {
    try {
      setLoading(true);
      setError(null);
      console.log('[CrmKanbanPage] Buscando funis para unidade:', unidadeId, 'Tipo:', typeof unidadeId);
      const data = await crmKanbanService.fetchFunisPorUnidade(unidadeId);
      console.log('[CrmKanbanPage] Funis encontrados:', data?.length || 0);
      setFunis(data);
      // Se houver apenas um funil, selecionar automaticamente
      if (data.length === 1) {
        setSelectedFunil(data[0]);
      } else {
        setSelectedFunil(null);
      }
    } catch (err) {
      setError('Erro ao carregar funis');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUnidadeChange = (e) => {
    const unidadeId = e.target.value;
    if (unidadeId) {
      const unidade = unidades.find(u => u.id === parseInt(unidadeId));
      setSelectedUnidade(unidade);
      // Resetar funil ao mudar unidade
      setSelectedFunil(null);
      setFunis([]);
    } else {
      setSelectedUnidade(null);
      setSelectedFunil(null);
      setFunis([]);
    }
  };

  const handleFunilChange = (e) => {
    const funilId = e.target.value;
    if (funilId) {
      const funil = funis.find(f => f.id_funil_sprint === parseInt(funilId));
      setSelectedFunil(funil);
    } else {
      setSelectedFunil(null);
    }
  };

  if (loading && unidades.length === 0) {
    return (
      <div className="CrmKanbanPage">
        <div className="CrmKanbanPage-loading">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="CrmKanbanPage">
      {/* Top Navigation Bar */}
      <div className="CrmKanbanPage-topbar">
        <div className="CrmKanbanPage-topbar-left">
          {/* Dropdown de Unidade */}
          <div className="CrmKanbanPage-funil-dropdown">
            <select
              className="CrmKanbanPage-dropdown-select"
              value={selectedUnidade?.id || ''}
              onChange={handleUnidadeChange}
              disabled={loading}
            >
              <option value="">Selecione uma unidade</option>
              {unidades.map(unidade => (
                <option key={unidade.id} value={unidade.id}>
                  {unidade.unidade || unidade.nome || `Unidade ${unidade.id}`}
                </option>
              ))}
            </select>
            <ChevronDown size={14} className="CrmKanbanPage-dropdown-icon" />
          </div>

          {/* Dropdown de Funil */}
          {selectedUnidade && (
            <div className="CrmKanbanPage-funil-dropdown">
              <select
                className="CrmKanbanPage-dropdown-select"
                value={selectedFunil?.id_funil_sprint || ''}
                onChange={handleFunilChange}
                disabled={loading || funis.length === 0}
              >
                <option value="">Selecione um funil</option>
                {funis.map(funil => (
                  <option key={funil.id_funil_sprint} value={funil.id_funil_sprint}>
                    {funil.nome_funil}
                  </option>
                ))}
              </select>
              <ChevronDown size={14} className="CrmKanbanPage-dropdown-icon" />
            </div>
          )}

          {/* Info do usuário */}
          <div className="CrmKanbanPage-user-info">
            <div className="CrmKanbanPage-user-avatar">TP</div>
            <span className="CrmKanbanPage-user-name">Thalia Passos</span>
            <ChevronDown size={14} className="CrmKanbanPage-dropdown-icon" />
          </div>
        </div>

        <div className="CrmKanbanPage-topbar-center">
          <div className="CrmKanbanPage-search-container">
            <input
              type="text"
              placeholder="Título da Oportunidade"
              className="CrmKanbanPage-search-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="CrmKanbanPage-checkboxes">
            <label className="CrmKanbanPage-checkbox-label">
              <input type="checkbox" className="CrmKanbanPage-checkbox" />
              <span>Contato</span>
            </label>
            <label className="CrmKanbanPage-checkbox-label">
              <input type="checkbox" className="CrmKanbanPage-checkbox" />
              <span>Oportunidade</span>
            </label>
          </div>
          <button className="CrmKanbanPage-sort-btn" title="Ordenar">
            <ArrowUpDown size={18} />
          </button>
        </div>

        <div className="CrmKanbanPage-topbar-right">
          <button className="CrmKanbanPage-icon-btn" title="Informações">
            <Info size={18} />
          </button>
          <button className="CrmKanbanPage-new-btn">
            <Plus size={16} style={{ marginRight: '6px' }} />
            Nova oportunidade
          </button>
          <button 
            className={`CrmKanbanPage-view-btn ${viewMode === 'lista' ? 'active' : ''}`}
            onClick={() => setViewMode('lista')}
            title="Visualização em lista"
          >
            <List size={18} />
          </button>
          <button 
            className={`CrmKanbanPage-view-btn ${viewMode === 'kanban' ? 'active' : ''}`}
            onClick={() => setViewMode('kanban')}
            title="Visualização em Kanban"
          >
            <LayoutGrid size={18} />
          </button>
          <button className="CrmKanbanPage-icon-btn" title="Arquivos">
            <Folder size={18} />
          </button>
          <button className="CrmKanbanPage-icon-btn" title="Marcar">
            <CheckSquare size={18} />
          </button>
        </div>
      </div>

      {/* Status Filter Bar */}
      <div className="CrmKanbanPage-filterbar">
        <button 
          className={`CrmKanbanPage-status-btn ${selectedStatus === 'Aberta' ? 'active' : ''}`}
          onClick={() => setSelectedStatus('Aberta')}
        >
          Aberta
        </button>
        <button 
          className={`CrmKanbanPage-status-btn ${selectedStatus === 'Ganha' ? 'active' : ''}`}
          onClick={() => setSelectedStatus('Ganha')}
        >
          Ganha
        </button>
        <button 
          className={`CrmKanbanPage-status-btn ${selectedStatus === 'Perdida' ? 'active' : ''}`}
          onClick={() => setSelectedStatus('Perdida')}
        >
          Perdida
        </button>
        <button 
          className={`CrmKanbanPage-status-btn ${selectedStatus === 'Data de criação' ? 'active' : ''}`}
          onClick={() => setSelectedStatus('Data de criação')}
        >
          Data de criação
        </button>
        <button 
          className={`CrmKanbanPage-status-btn ${selectedStatus === 'Fechamento esperado' ? 'active' : ''}`}
          onClick={() => setSelectedStatus('Fechamento esperado')}
        >
          Fechamento esperado
        </button>
        <button className="CrmKanbanPage-filter-btn">
          <Filter size={16} style={{ marginRight: '6px' }} />
          Filtrar
        </button>
      </div>

      {error && (
        <div className="CrmKanbanPage-error">
          {error}
        </div>
      )}


      {/* Kanban Board */}
      {selectedFunil && viewMode === 'kanban' && (
        <div className="CrmKanbanPage-board-wrapper">
          <CrmKanbanBoard 
            funilId={selectedFunil.id_funil_sprint} 
            searchTerm={searchTerm}
            selectedStatus={selectedStatus}
          />
        </div>
      )}

      {selectedFunil && viewMode === 'lista' && (
        <div className="CrmKanbanPage-empty">
          <p>Visualização em lista será implementada em breve</p>
        </div>
      )}

      {!selectedUnidade && (
        <div className="CrmKanbanPage-empty">
          <p>Selecione uma unidade no menu superior para visualizar os funis</p>
        </div>
      )}

      {selectedUnidade && !selectedFunil && funis.length > 0 && (
        <div className="CrmKanbanPage-empty">
          <p>Selecione um funil no menu superior para visualizar o Kanban</p>
        </div>
      )}

      {selectedUnidade && !selectedFunil && funis.length === 0 && !loading && (
        <div className="CrmKanbanPage-empty">
          <p>Nenhum funil encontrado para esta unidade</p>
        </div>
      )}
    </div>
  );
};

export default CrmKanbanPage;
