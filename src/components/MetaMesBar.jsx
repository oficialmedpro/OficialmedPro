import React, { useState, useEffect } from 'react';
import { Target, TrendingUp, DollarSign } from 'lucide-react';
import { getOportunidadesGanhasMetrics } from '../service/oportunidadesGanhasService';
import './MetaMesBar.css';

/**
 * 📊 META DO MÊS BAR
 * 
 * Componente que mostra a meta do mês atual, quanto foi vendido até agora,
 * e quanto falta para bater a meta (em dinheiro e percentual)
 */
const MetaMesBar = ({ 
  startDate, 
  endDate, 
  selectedFunnel, 
  selectedUnit, 
  selectedSeller, 
  selectedOrigin 
}) => {
  const [metaData, setMetaData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Buscar dados da meta do mês (sempre do mês atual, independente do período selecionado)
  useEffect(() => {
    console.log('📊 MetaMesBar useEffect ACIONADO!');
    console.log('Props atuais:', { startDate, endDate, selectedFunnel, selectedUnit, selectedSeller, selectedOrigin });
    
    const fetchMetaData = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log('='.repeat(60));
        console.log('📊 MetaMesBar: Buscando dados da meta do mês...');
        
        // Calcular primeiro e último dia do mês atual
        const hoje = new Date();
        const primeiroDiaMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
        const ultimoDiaMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);
        
        // Formatar datas para o serviço
        const dataInicio = primeiroDiaMes.toISOString().split('T')[0] + 'T00:00:00';
        const dataFim = ultimoDiaMes.toISOString().split('T')[0] + 'T23:59:59';
        
        console.log('🔍 Parâmetros para meta do mês:');
        console.log('  - dataInicio (1º dia do mês):', dataInicio);
        console.log('  - dataFim (último dia do mês):', dataFim);
        console.log('  - selectedFunnel:', selectedFunnel);
        console.log('  - selectedUnit:', selectedUnit);
        console.log('  - selectedSeller:', selectedSeller);
        console.log('  - selectedOrigin:', selectedOrigin);
        console.log('='.repeat(60));
        
        // Buscar dados de oportunidades ganhas para calcular vendas do mês
        const data = await getOportunidadesGanhasMetrics(
          dataInicio, 
          dataFim, 
          selectedFunnel, 
          selectedUnit, 
          selectedSeller, 
          selectedOrigin
        );
        
        // Calcular dados da meta do mês
        const metaCalculada = calcularMetaMes(data);
        setMetaData(metaCalculada);
        console.log('✅ MetaMesBar: Dados da meta carregados:', metaCalculada);
      } catch (error) {
        console.error('❌ MetaMesBar: Erro ao carregar dados da meta:', error);
        setError(error.message);
        setMetaData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchMetaData();
  }, [selectedFunnel, selectedUnit, selectedSeller, selectedOrigin]); // Removido startDate e endDate das dependências

  // Função para calcular a meta do mês
  const calcularMetaMes = (data) => {
    if (!data || !data.totalOportunidadesGanhas) {
      return {
        metaMes: 0,
        vendidoMes: 0,
        faltam: 0,
        percentual: 0,
        percentualTexto: '0%'
      };
    }

    const { meta, value } = data.totalOportunidadesGanhas;
    const metaMes = meta || 0;
    const vendidoMes = value || 0;
    const faltam = Math.max(0, metaMes - vendidoMes);
    const percentual = metaMes > 0 ? (vendidoMes / metaMes) * 100 : 0;
    const percentualTexto = `${Math.round(percentual)}%`;

    return {
      metaMes,
      vendidoMes,
      faltam,
      percentual,
      percentualTexto
    };
  };

  // Formatar valores monetários
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2
    }).format(value);
  };

  if (loading) {
    return (
      <div className="meta-mes-bar">
        <div className="meta-mes-content">
          <div className="meta-mes-loading">
            <div className="meta-mes-spinner"></div>
            <span>Carregando meta do mês...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="meta-mes-bar">
        <div className="meta-mes-content">
          <div className="meta-mes-error">
            <span>❌ Erro ao carregar meta do mês</span>
          </div>
        </div>
      </div>
    );
  }

  if (!metaData) {
    return null;
  }

  return (
    <div className="meta-mes-bar">
      <div className="meta-mes-line"></div>
      <div className="meta-mes-content">
        <div className="meta-mes-icon">
          <Target size={20} />
        </div>
        <div className="meta-mes-info">
          <div className="meta-mes-title">Meta do Mês</div>
          <div className="meta-mes-values">
            <div className="meta-mes-item">
              <span className="meta-mes-label">Meta:</span>
              <span className="meta-mes-value">{formatCurrency(metaData.metaMes)}</span>
            </div>
            <div className="meta-mes-item">
              <span className="meta-mes-label">Vendido:</span>
              <span className="meta-mes-value vendido">{formatCurrency(metaData.vendidoMes)}</span>
            </div>
            <div className="meta-mes-item">
              <span className="meta-mes-label">Faltam:</span>
              <span className="meta-mes-value faltam">{formatCurrency(metaData.faltam)}</span>
            </div>
            <div className="meta-mes-item">
              <span className="meta-mes-label">Progresso:</span>
              <span className="meta-mes-value progresso">{metaData.percentualTexto}</span>
            </div>
          </div>
        </div>
        <div className="meta-mes-progress-bar">
          <div 
            className="meta-mes-progress-fill" 
            style={{ width: `${Math.min(100, metaData.percentual)}%` }}
          ></div>
        </div>
      </div>
      <div className="meta-mes-line"></div>
    </div>
  );
};

export default MetaMesBar;
