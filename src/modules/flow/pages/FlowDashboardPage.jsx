/**
 * Página Principal do Flow Dashboard
 * 
 * Exibe visão geral de todas as esteiras com métricas principais
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './FlowDashboardPage.css';
import flowService from '../services/flowService';
import { getAllEsteiras } from '../utils/flowHelpers';
import FlowHeader from '../components/FlowHeader';

const FlowDashboardPage = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [esteiras, setEsteiras] = useState([]);

  useEffect(() => {
    loadEsteirasAndStats();
    
    // Escutar mudanças de unidade
    const handleUnidadeChange = () => {
      loadEsteirasAndStats();
    };
    
    window.addEventListener('flow-unidade-changed', handleUnidadeChange);
    
    return () => {
      window.removeEventListener('flow-unidade-changed', handleUnidadeChange);
    };
  }, []);

  const loadEsteirasAndStats = async () => {
    try {
      setLoading(true);
      
      // Carregar esteiras do banco
      const esteirasData = await getAllEsteiras();
      setEsteiras(esteirasData);
      
      // Carregar estatísticas (com tratamento de erro individual)
      const statsData = {};
      for (const esteira of esteirasData) {
        try {
          const esteiraStats = await flowService.getEsteiraStats(esteira.id);
          statsData[esteira.id] = esteiraStats;
        } catch (err) {
          console.error(`Erro ao carregar stats da esteira ${esteira.id} (${esteira.name}):`, err);
          // Definir stats vazias em caso de erro
          statsData[esteira.id] = { total: 0, byEtapa: {}, funil_id: esteira.id, funil_nome: esteira.name };
        }
      }
      
      setStats(statsData);
    } catch (error) {
      console.error('Erro ao carregar esteiras e estatísticas:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="FlowContainer">
      <FlowHeader />
      <div className="FlowDashboardPage">
      <div className="FlowDashboardPage-header">
        <h1 className="FlowDashboardPage-title">Flow Dashboard</h1>
        <p className="FlowDashboardPage-subtitle">
          Visão geral de todas as esteiras - Clientes sempre em movimento
        </p>
      </div>

      <div className="FlowDashboardPage-content">
        {/* Grupo Compra */}
        <section className="FlowDashboardPage-section">
          <h2 className="FlowDashboardPage-section-title">Compra</h2>
          <div className="FlowDashboardPage-grid">
            {esteiras.length === 0 && !loading && (
              <p style={{ color: '#64748b', padding: '1rem' }}>Nenhuma esteira encontrada. Cadastre funis no banco de dados.</p>
            )}
            {esteiras
              .filter(e => e.type === 'compra')
              .map(esteira => (
                <div 
                  key={esteira.id} 
                  className="FlowDashboardPage-card"
                  style={{ borderLeftColor: esteira.color }}
                  onClick={() => navigate(`/flow/esteiras/${esteira.id}`)}
                >
                  <h3 className="FlowDashboardPage-card-title">{esteira.name}</h3>
                  <p className="FlowDashboardPage-card-value">
                    {loading ? '...' : (stats[esteira.id]?.total || 0)}
                  </p>
                  <p className="FlowDashboardPage-card-label">leads ativos</p>
                </div>
              ))}
          </div>
        </section>

        {/* Grupo Operacional */}
        <section className="FlowDashboardPage-section">
          <h2 className="FlowDashboardPage-section-title">Operacional</h2>
          <div className="FlowDashboardPage-grid">
            {esteiras
              .filter(e => e.type === 'operacional')
              .length === 0 && !loading && (
              <p style={{ color: '#64748b', padding: '1rem' }}>Nenhuma esteira operacional encontrada.</p>
            )}
            {esteiras
              .filter(e => e.type === 'operacional')
              .map(esteira => (
                <div 
                  key={esteira.id} 
                  className="FlowDashboardPage-card"
                  style={{ borderLeftColor: esteira.color }}
                  onClick={() => navigate(`/flow/esteiras/${esteira.id}`)}
                >
                  <h3 className="FlowDashboardPage-card-title">{esteira.name}</h3>
                  <p className="FlowDashboardPage-card-value">
                    {loading ? '...' : (stats[esteira.id]?.total || 0)}
                  </p>
                  <p className="FlowDashboardPage-card-label">leads ativos</p>
                </div>
              ))}
          </div>
        </section>

        {/* Grupo Recompra */}
        <section className="FlowDashboardPage-section">
          <h2 className="FlowDashboardPage-section-title">Recompra</h2>
          <div className="FlowDashboardPage-grid">
            {esteiras
              .filter(e => e.type === 'recompra')
              .length === 0 && !loading && (
              <p style={{ color: '#64748b', padding: '1rem' }}>Nenhuma esteira de recompra encontrada.</p>
            )}
            {esteiras
              .filter(e => e.type === 'recompra')
              .map(esteira => (
                <div 
                  key={esteira.id} 
                  className="FlowDashboardPage-card"
                  style={{ borderLeftColor: esteira.color }}
                  onClick={() => navigate(`/flow/esteiras/${esteira.id}`)}
                >
                  <h3 className="FlowDashboardPage-card-title">{esteira.name}</h3>
                  <p className="FlowDashboardPage-card-value">
                    {loading ? '...' : (stats[esteira.id]?.total || 0)}
                  </p>
                  <p className="FlowDashboardPage-card-label">leads ativos</p>
                </div>
              ))}
          </div>
        </section>

        {/* Grupo Independente */}
        <section className="FlowDashboardPage-section">
          <h2 className="FlowDashboardPage-section-title">Independente</h2>
          <div className="FlowDashboardPage-grid">
            {esteiras
              .filter(e => e.type === 'independente')
              .length === 0 && !loading && (
              <p style={{ color: '#64748b', padding: '1rem' }}>Nenhuma esteira independente encontrada.</p>
            )}
            {esteiras
              .filter(e => e.type === 'independente')
              .map(esteira => (
                <div 
                  key={esteira.id} 
                  className="FlowDashboardPage-card"
                  style={{ borderLeftColor: esteira.color }}
                  onClick={() => navigate(`/flow/esteiras/${esteira.id}`)}
                >
                  <h3 className="FlowDashboardPage-card-title">{esteira.name}</h3>
                  <p className="FlowDashboardPage-card-value">
                    {loading ? '...' : (stats[esteira.id]?.total || 0)}
                  </p>
                  <p className="FlowDashboardPage-card-label">leads ativos</p>
                </div>
              ))}
          </div>
        </section>
      </div>
      </div>
    </div>
  );
};

export default FlowDashboardPage;

