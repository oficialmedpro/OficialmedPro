import React, { useState, useEffect } from 'react';
import { getKpisAcolhimento, getMotivosPerda } from '../../service/vendasService';
import './VendasPage.css';

const Acolhimento = ({ contexto, role }) => {
  const [kpis, setKpis] = useState(null);
  const [motivosPerda, setMotivosPerda] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [contexto]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      
      // Buscar KPIs
      const kpisData = await getKpisAcolhimento({
        unidadeId: contexto.unidadeId,
        funilId: contexto.funilId,
        vendedorId: contexto.vendedorId || undefined
      });
      
      setKpis(kpisData || {});
      
      // Buscar motivos de perda
      const motivosData = await getMotivosPerda('acolhimento');
      setMotivosPerda(motivosData || []);
      
    } catch (error) {
      console.error('Erro ao carregar dados de Acolhimento:', error);
      // Mock data em caso de erro
      setKpis({
        entrou: 326,
        naoLidas: 83,
        msgs: 41,
        qualidade: 78,
        telef: 82,
        email: 64,
        cidade: 71,
        intencao: 56,
        taxaEA: 68,
        taxaAQ: 47,
        tEntrada: 31,
        tAcolh: 2.99,
        atrasados: 12,
        emFila: 86
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: 40 }}>
        <div className="loading-spinner"></div>
        <p style={{ marginTop: 16 }}>Carregando Acolhimento...</p>
      </div>
    );
  }

  if (!kpis) {
    return <div className="card">Nenhum dado disponível</div>;
  }

  return (
    <section className="tab card">
      <h2>Acolhimento – Entrada → Acolhimento → Qualificados</h2>
      <div className="hr"></div>

      {/* Grid de 4 colunas */}
      <div className="grid cols-4">
        {/* Card 1: Leads que entraram */}
        <div className="card">
          <h3>Leads que entraram</h3>
          <div className="kpi">
            <span className="big">{kpis.entrou || 0}</span>
            <span className="unit">no período</span>
          </div>
          <div className="chips" style={{ marginTop: 10 }}>
            <span className="chip">Não lidas <strong>{kpis.naoLidas || 0}</strong></span>
            <span className="chip">Mensagens não lidas <strong>{kpis.msgs || 0}</strong></span>
          </div>
        </div>

        {/* Card 2: Metas */}
        <div className="card">
          <h3>Metas (D / S / M)</h3>
          <div className="kpi">
            <span className="big">{kpis.entrou || 0}</span>
            <span className="unit">diário</span>
          </div>
          <div className="progress" style={{ margin: '8px 0 10px' }}>
            <span style={{ width: `${Math.min(100, ((kpis.entrou || 0) / 120) * 100)}%` }}></span>
            <i className="mark" title="Meta diária"></i>
          </div>
          <div className="kpi" style={{ gap: 16 }}>
            <span><strong>212</strong> / 400 <span className="badge warn">semana</span></span>
          </div>
          <div className="progress" style={{ margin: '8px 0 10px' }}>
            <span style={{ width: '53%' }}></span>
          </div>
          <div className="kpi" style={{ gap: 16 }}>
            <span><strong>2.033</strong> / 1.700 <span className="badge ok">mês</span></span>
          </div>
          <div className="progress" style={{ marginTop: 8 }}>
            <span style={{ width: '100%' }}></span>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <button className="tiny supervisor-only">Editar metas</button>
            <span className="note">Botão visível apenas para supervisores.</span>
          </div>
        </div>

        {/* Card 3: Qualidade média */}
        <div className="card">
          <h3>Qualidade média do lead</h3>
          <div className="kpi">
            <span className="big">{kpis.qualidade || 0}</span>
            <span className="unit">/ 100</span>
          </div>
          <div className="chips" style={{ marginTop: 10 }}>
            <span className="chip">Telefone: <strong>{kpis.telef || 0}%</strong></span>
            <span className="chip">E-mail: <strong>{kpis.email || 0}%</strong></span>
            <span className="chip">Cidade: <strong>{kpis.cidade || 0}%</strong></span>
            <span className="chip">Intenção: <strong>{kpis.intencao || 0}%</strong></span>
          </div>
        </div>

        {/* Card 4: Taxas de passagem */}
        <div className="card">
          <h3>Taxas de passagem</h3>
          <div className="kpi">
            <span className="big">{kpis.taxaEA || 0}%</span>
            <span className="unit">Entrada→Acolh.</span>
          </div>
          <div className="bar" style={{ margin: '8px 0 12px' }}>
            <i style={{ width: `${kpis.taxaEA || 0}%` }}></i>
          </div>
          <div className="kpi">
            <span className="big">{kpis.taxaAQ || 0}%</span>
            <span className="unit">Acolh.→Qualificados</span>
          </div>
          <div className="bar">
            <i style={{ width: `${kpis.taxaAQ || 0}%` }}></i>
          </div>
        </div>
      </div>

      {/* Grid de 3 colunas */}
      <div className="grid cols-3" style={{ marginTop: 'var(--grid-gap)' }}>
        {/* Card: Tempo nas etapas */}
        <div className="card">
          <h3>Tempo nas etapas</h3>
          <div className="kpi">
            <span className="big">{kpis.tEntrada || 0}h</span>
            <span className="unit">média em Entrada</span>
          </div>
          <div className="kpi" style={{ marginTop: 6 }}>
            <span className="big">{kpis.tAcolh || 0}h</span>
            <span className="unit">média em Acolhimento</span>
          </div>
          <div className="chips" style={{ marginTop: 10 }}>
            <span className="badge danger">Atrasados: <strong>{kpis.atrasados || 0}</strong></span>
            <span className="badge info">Em fila: <strong>{kpis.emFila || 0}</strong></span>
          </div>
        </div>

        {/* Card: Motivos de perda */}
        <div className="card">
          <h3>Motivos de perda (Entrada→Acolh.)</h3>
          <table className="table">
            <thead>
              <tr>
                <th>Motivo</th>
                <th>%</th>
                <th>Qtd</th>
              </tr>
            </thead>
            <tbody>
              {motivosPerda.length > 0 ? (
                motivosPerda.map((motivo, idx) => (
                  <tr key={idx}>
                    <td>{motivo.motivo || 'Sem motivo'}</td>
                    <td>
                      <div className="bar">
                        <i style={{ width: `${motivo.pct || 0}%` }}></i>
                      </div>
                    </td>
                    <td>{motivo.qtd || 0}</td>
                  </tr>
                ))
              ) : (
                <>
                  <tr><td>Sem contato/NR</td><td><div className="bar"><i style={{ width: '38%' }}></i></div></td><td>124</td></tr>
                  <tr><td>Dados insuficientes</td><td><div className="bar"><i style={{ width: '22%' }}></i></div></td><td>70</td></tr>
                  <tr><td>Sem interesse</td><td><div className="bar"><i style={{ width: '18%' }}></i></div></td><td>55</td></tr>
                  <tr><td>Concorrência</td><td><div className="bar"><i style={{ width: '9%' }}></i></div></td><td>28</td></tr>
                </>
              )}
            </tbody>
          </table>
        </div>

        {/* Card: Fila com mensagens não lidas */}
        <div className="card">
          <h3>Fila com mensagens não lidas</h3>
          <div className="kpi">
            <span className="big">{kpis.naoLidas || 0}</span>
            <span className="unit">conversas</span>
          </div>
          <div className="chips" style={{ marginTop: 10 }}>
            <span className="badge warn">WhatsApp: 41</span>
            <span className="badge info">E-mail: 29</span>
            <span className="badge danger">Chat: 13</span>
          </div>
          <div className="note">Priorize não lidas + maior tempo em Entrada.</div>
        </div>
      </div>
    </section>
  );
};

export default Acolhimento;

