import React from 'react';
import { Users, DollarSign, Clock } from 'lucide-react';
import './OrcamentosCards.css';

/**
 * 🎯 ORÇAMENTOS CARDS
 * 
 * Componente que exibe cards com informações de orçamentos por funil
 * Mostra: Total de Orçamento, Quantidade de Oportunidades, Valor Total, TME criação → orçamento, TME última etapa → orçamento
 */
const OrcamentosCards = () => {
  // Dados mockup - serão substituídos por dados reais depois
  const orcamentosData = [
    {
      funil: 'Funil Comercial Apucarana',
      quantidadeOportunidades: 127,
      valorTotal: 127450.00,
      tmeCriacaoOrcamento: { dias: 2, horas: 4, minutos: 15 },
      tmeUltimaEtapaOrcamento: { horas: 6, minutos: 32 },
      origem: 'Qualificação'
    },
    {
      funil: 'Funil Recompra Apucarana',
      quantidadeOportunidades: 89,
      valorTotal: 89730.00,
      tmeCriacaoOrcamento: { dias: 1, horas: 9, minutos: 48 },
      tmeUltimaEtapaOrcamento: { horas: 3, minutos: 21 },
      origem: 'Acolhimento'
    },
    {
      funil: 'Funil Monitoramento Apucarana',
      quantidadeOportunidades: 54,
      valorTotal: 54980.00,
      tmeCriacaoOrcamento: { dias: 3, horas: 2, minutos: 7 },
      tmeUltimaEtapaOrcamento: { horas: 8, minutos: 5 },
      origem: 'Monitoramento'
    },
    {
      funil: 'Funil Reativação Apucarana',
      quantidadeOportunidades: 63,
      valorTotal: 63210.00,
      tmeCriacaoOrcamento: { dias: 4, horas: 5, minutos: 42 },
      tmeUltimaEtapaOrcamento: { horas: 10, minutos: 19 },
      origem: 'Reativação'
    },
    {
      funil: 'Funil Ativação Apucarana',
      quantidadeOportunidades: 38,
      valorTotal: 38560.00,
      tmeCriacaoOrcamento: { dias: 1, horas: 18, minutos: 33 },
      tmeUltimaEtapaOrcamento: { horas: 4, minutos: 47 },
      origem: 'Ativação'
    }
  ];

  // Função para formatar valor em moeda
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  // Função para formatar TME criação → orçamento
  const formatTmeCriacao = (tme) => {
    const parts = [];
    if (tme.dias > 0) parts.push(`${tme.dias}d`);
    if (tme.horas > 0) parts.push(`${tme.horas}h`);
    if (tme.minutos > 0) parts.push(`${tme.minutos}min`);
    return parts.join(' ');
  };

  // Função para formatar TME última etapa → orçamento
  const formatTmeUltimaEtapa = (tme) => {
    const parts = [];
    if (tme.horas > 0) parts.push(`${tme.horas}h`);
    if (tme.minutos > 0) parts.push(`${tme.minutos}min`);
    return parts.join(' ');
  };

  return (
    <div className="orcamentos-cards-container">
      {orcamentosData.map((item, index) => (
        <div key={index} className="orcamento-card">
          <div className="orcamento-card-header">
            <h3 className="orcamento-card-title">Total de Orçamento</h3>
            <p className="orcamento-card-funil">{item.funil}</p>
          </div>

          <div className="orcamento-card-body">
            <div className="orcamento-card-section">
              <div className="orcamento-card-label">
                <Users className="orcamento-card-icon" size={16} />
                Quantidade de oportunidades
              </div>
              <div className="orcamento-card-quantidade">{item.quantidadeOportunidades}</div>
            </div>

            <div className="orcamento-card-section">
              <div className="orcamento-card-label">
                <DollarSign className="orcamento-card-icon" size={16} />
                Valor total
              </div>
              <div className="orcamento-card-value">{formatCurrency(item.valorTotal)}</div>
            </div>

            <div className="orcamento-card-section">
              <div className="orcamento-card-label">
                <Clock className="orcamento-card-icon" size={16} />
                Tempo da etapa criação até o orçamento
              </div>
              <div className="orcamento-card-time">{formatTmeCriacao(item.tmeCriacaoOrcamento)}</div>
            </div>

            <div className="orcamento-card-section">
              <div className="orcamento-card-label">
                <Clock className="orcamento-card-icon" size={16} />
                Tempo da última etapa até o Orçamento
              </div>
              <div className="orcamento-card-time">{formatTmeUltimaEtapa(item.tmeUltimaEtapaOrcamento)}</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default OrcamentosCards;

