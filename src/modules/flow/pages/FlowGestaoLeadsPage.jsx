/**
 * Página de Gestão de Leads
 * 
 * Exibe estatísticas sobre leads e suas oportunidades
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import FlowHeader from '../components/FlowHeader';
import flowService from '../services/flowService';
import { Users, AlertTriangle, CheckCircle2, Mail, XCircle, RefreshCw } from 'lucide-react';
import './FlowGestaoLeadsPage.css';

const FlowGestaoLeadsPage = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await flowService.getGestaoLeadsStats();
      setStats(data);
    } catch (err) {
      console.error('Erro ao carregar estatísticas:', err);
      setError('Erro ao carregar estatísticas de leads');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <>
        <FlowHeader />
        <div className="FlowContainer">
          <div className="FlowGestaoLeadsPage">
            <div className="FlowGestaoLeadsPage-loading">Carregando estatísticas...</div>
          </div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <FlowHeader />
        <div className="FlowContainer">
          <div className="FlowGestaoLeadsPage">
            <div className="FlowGestaoLeadsPage-error">
              <p>{error}</p>
              <button onClick={loadStats} className="FlowGestaoLeadsPage-retry-btn">
                Tentar novamente
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <FlowHeader />
      <div className="FlowContainer">
        <div className="FlowGestaoLeadsPage">
          <div className="FlowGestaoLeadsPage-header">
            <h1 className="FlowGestaoLeadsPage-title">Gestão de Leads</h1>
            <p className="FlowGestaoLeadsPage-subtitle">
              Visão geral dos leads e suas oportunidades
            </p>
          </div>

          <div className="FlowGestaoLeadsPage-content">
            <div className="FlowGestaoLeadsPage-grid">
              {/* Card: Total de Leads */}
              <div className="FlowGestaoLeadsPage-card FlowGestaoLeadsPage-card-total">
                <div className="FlowGestaoLeadsPage-card-icon">
                  <Users className="FlowGestaoLeadsPage-icon" />
                </div>
                <div className="FlowGestaoLeadsPage-card-content">
                  <h3 className="FlowGestaoLeadsPage-card-title">Total de Leads</h3>
                  <p className="FlowGestaoLeadsPage-card-value">
                    {stats?.totalLeads?.toLocaleString('pt-BR') || 0}
                  </p>
                  <p className="FlowGestaoLeadsPage-card-label">leads cadastrados</p>
                </div>
              </div>

              {/* Card: Leads sem Oportunidade Aberta */}
              <div className="FlowGestaoLeadsPage-card FlowGestaoLeadsPage-card-sem-aberta">
                <div className="FlowGestaoLeadsPage-card-icon">
                  <AlertTriangle className="FlowGestaoLeadsPage-icon" />
                </div>
                <div className="FlowGestaoLeadsPage-card-content">
                  <h3 className="FlowGestaoLeadsPage-card-title">Sem Oportunidade Aberta</h3>
                  <p className="FlowGestaoLeadsPage-card-value">
                    {stats?.leadsSemAberta?.toLocaleString('pt-BR') || 0}
                  </p>
                  <p className="FlowGestaoLeadsPage-card-label">
                    leads sem oportunidade ativa em nenhum funil
                  </p>
                </div>
              </div>

              {/* Card: Leads com Oportunidades Ganhas */}
              <div className="FlowGestaoLeadsPage-card FlowGestaoLeadsPage-card-ganhas">
                <div className="FlowGestaoLeadsPage-card-icon">
                  <CheckCircle2 className="FlowGestaoLeadsPage-icon" />
                </div>
                <div className="FlowGestaoLeadsPage-card-content">
                  <h3 className="FlowGestaoLeadsPage-card-title">Oportunidades Ganhas</h3>
                  <p className="FlowGestaoLeadsPage-card-value">
                    {stats?.leadsComGanhas?.toLocaleString('pt-BR') || 0}
                  </p>
                  <p className="FlowGestaoLeadsPage-card-label">
                    leads com pelo menos uma oportunidade ganha
                  </p>
                </div>
              </div>

              {/* Card: Leads sem Nenhuma Oportunidade */}
              <div className="FlowGestaoLeadsPage-card FlowGestaoLeadsPage-card-sem-oportunidade">
                <div className="FlowGestaoLeadsPage-card-icon">
                  <Mail className="FlowGestaoLeadsPage-icon" />
                </div>
                <div className="FlowGestaoLeadsPage-card-content">
                  <h3 className="FlowGestaoLeadsPage-card-title">Sem Nenhuma Oportunidade</h3>
                  <p className="FlowGestaoLeadsPage-card-value">
                    {stats?.leadsSemOportunidade?.toLocaleString('pt-BR') || 0}
                  </p>
                  <p className="FlowGestaoLeadsPage-card-label">
                    leads que nunca tiveram uma oportunidade
                  </p>
                </div>
              </div>

              {/* Card: Leads com Oportunidades Perdidas */}
              <div className="FlowGestaoLeadsPage-card FlowGestaoLeadsPage-card-perdidas">
                <div className="FlowGestaoLeadsPage-card-icon">
                  <XCircle className="FlowGestaoLeadsPage-icon" />
                </div>
                <div className="FlowGestaoLeadsPage-card-content">
                  <h3 className="FlowGestaoLeadsPage-card-title">Oportunidades Perdidas</h3>
                  <p className="FlowGestaoLeadsPage-card-value">
                    {stats?.leadsComPerdidas?.toLocaleString('pt-BR') || 0}
                  </p>
                  <p className="FlowGestaoLeadsPage-card-label">
                    leads com pelo menos uma oportunidade perdida
                  </p>
                </div>
              </div>
            </div>

            {/* Botão de atualizar */}
            <div className="FlowGestaoLeadsPage-actions">
              <button
                onClick={loadStats}
                className="FlowGestaoLeadsPage-refresh-btn"
              >
                <RefreshCw className="FlowGestaoLeadsPage-refresh-icon" />
                <span>Atualizar Estatísticas</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default FlowGestaoLeadsPage;

