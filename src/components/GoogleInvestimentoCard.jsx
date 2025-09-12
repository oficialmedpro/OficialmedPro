import React, { useEffect, useState } from 'react'
import { googleInvestimentoService } from '../service/googleInvestimentoService'
import './GoogleInvestimentoCard.css'
import { googleOportunidadesService } from '../service/googleOportunidadesService'
import { googleConversaoService } from '../service/googleConversaoService'
import { debugComparisonService } from '../service/debugComparisonService'

/**
 * Card isolado para exibir investimento do Google
 * Props devem vir do Dashboard/FilterBar: startDate, endDate, selectedFunnel, selectedUnit, selectedSeller
 */
const GoogleInvestimentoCard = ({ 
  t, 
  formatCurrency, 
  startDate, 
  endDate, 
  selectedFunnel, 
  selectedUnit, 
  selectedSeller 
}) => {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [total, setTotal] = useState(0)
  const [metrics, setMetrics] = useState({
    totalGanhas: 0,
    valorGanho: 0,
    totalPerdidas: 0,
    valorPerda: 0,
    totalAbertas: 0,
    taxaConversao: 0,
    totalCriadas: 0
  })

  useEffect(() => {
    let isMounted = true
    const load = async () => {
      try {
        setLoading(true)
        setError(null)
        const result = await googleInvestimentoService.getInvestimentoTotal(startDate, endDate)
        if (isMounted) setTotal(result.total)
        // carregar métricas de oportunidades (novo service dedicado)
        try {
          const conv = await googleConversaoService.getConversaoMetrics(
            startDate || endDate,
            endDate || startDate,
            {
              selectedFunnel,
              selectedUnit,
              selectedSeller
            }
          )
          if (isMounted) setMetrics({
            totalGanhas: conv.totalGanhas,
            valorGanho: conv.valorGanho,
            totalPerdidas: 0,
            valorPerda: 0,
            totalAbertas: 0,
            taxaConversao: conv.taxaConversao,
            totalCriadas: conv.totalCriadas,
          })
        } catch (e) {
          // fallback para service anterior
          const opp = await googleOportunidadesService.getPeriodoMetrics(startDate || endDate, endDate || startDate)
          if (isMounted) setMetrics(opp)
        }
      } catch (err) {
        if (isMounted) setError(err.message || 'Erro ao carregar dados')
      } finally {
        if (isMounted) setLoading(false)
      }
    }
    load()
    return () => { isMounted = false }
  }, [startDate, endDate, selectedFunnel, selectedUnit, selectedSeller])

  // Calcular ROAS: Valor Ganho / Valor Investido
  const calcularROAS = () => {
    if (loading || total === 0) return '—';
    const roas = metrics.valorGanho / total;
    return `${roas.toFixed(2)}x`;
  };

  // Função temporária para debug
  const handleDebugComparison = async () => {
    console.log('🔍 Iniciando debug de comparação...');
    // Pega o selectedOrigin do localStorage ou contexto se disponível
    const selectedOrigin = localStorage.getItem('selectedOrigin') || 'all';
    await debugComparisonService.compareServices(startDate, endDate, selectedOrigin);
  };

  return (
    <div className="gic-card">
      <div className="gic-header">
        <div className="gic-platform-icon">G</div>
        <span className="gic-platform-name">Google</span>
        <div className="gic-roas-badge">{t?.roas || 'ROAS'} {calcularROAS()}</div>
        {/* Botão temporário para debug */}
        <button 
          onClick={handleDebugComparison}
          style={{ 
            position: 'absolute', 
            top: '5px', 
            right: '5px', 
            fontSize: '10px', 
            padding: '2px 4px',
            background: '#ff6b6b',
            color: 'white',
            border: 'none',
            borderRadius: '2px',
            cursor: 'pointer'
          }}
        >
          DEBUG
        </button>
      </div>

      <div className="gic-content">
        {/* Investido */}
        <div className="gic-item">
          <span className="gic-label">{t?.invested || 'Investido'}</span>
          <span className="gic-value">
            {loading ? 'Carregando...' : error ? 'Erro' : formatCurrency ? formatCurrency(total, 'BRL') : `R$ ${total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          </span>
          {/* Período filtrado para debug */}
          <div className="gic-period-info">
            <small style={{ color: '#64748b', fontSize: '10px' }}>
              📅 {(() => {
                const formatDate = (dateStr) => {
                  if (!dateStr) return 'N/A';
                  const [year, month, day] = dateStr.split('-');
                  return `${day}-${month}-${year}`;
                };
                return `${formatDate(startDate)} até ${formatDate(endDate)}`;
              })()}
            </small>
          </div>
          <div className="gic-bar"><div className="gic-fill" style={{ width: '85%' }}></div></div>
        </div>

        {/* Taxa Conversão */}
        <div className="gic-item">
          <span className="gic-label">{t?.conversionRate || 'Taxa Conversão'}</span>
          <span className="gic-value">
            {loading ? '—' : `${metrics.totalCriadas} → ${metrics.totalGanhas} (${metrics.taxaConversao.toFixed(1)}%)`}
          </span>
          <div className="gic-bar"><div className="gic-fill gic-blue" style={{ width: `${Math.min(metrics.taxaConversao, 100)}%` }}></div></div>
        </div>

        {/* Valor Ganho */}
        <div className="gic-item">
          <span className="gic-label">{t?.revenue || 'Valor Ganho'}</span>
          <span className="gic-value">{loading ? '—' : (formatCurrency ? formatCurrency(metrics.valorGanho, 'BRL') : `R$ ${metrics.valorGanho.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`)}</span>
          <div className="gic-bar"><div className="gic-fill gic-green" style={{ width: `${metrics.valorGanho > 0 ? 92 : 0}%` }}></div></div>
        </div>

        {/* Custo por Lead */}
        <div className="gic-item">
          <span className="gic-label">{t?.costPerLead || 'Custo por Lead'}</span>
          <span className="gic-value">
            {loading ? '—' : (() => {
              const custoPorLead = metrics.totalCriadas > 0 ? total / metrics.totalCriadas : 0;
              return formatCurrency ? formatCurrency(custoPorLead, 'BRL') : `R$ ${custoPorLead.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
            })()}
          </span>
          <div className="gic-bar"><div className="gic-fill gic-cyan" style={{ width: `${metrics.totalCriadas > 0 ? Math.min((total / metrics.totalCriadas) / 50 * 100, 100) : 0}%` }}></div></div>
        </div>

        {/* Oportunidades Perdidas */}
        <div className="gic-item">
          <span className="gic-label">{t?.lostOpps || 'Oportunidades Perdidas'}</span>
          <span className="gic-value">{loading ? '—' : metrics.totalPerdidas}</span>
          <div className="gic-bar"><div className="gic-fill gic-amber" style={{ width: `${Math.min(metrics.totalPerdidas, 100)}%` }}></div></div>
        </div>

        {/* Oportunidades Abertas */}
        <div className="gic-item">
          <span className="gic-label">{t?.openOpps || 'Oportunidades Abertas'}</span>
          <span className="gic-value">{loading ? '—' : metrics.totalAbertas}</span>
          <div className="gic-bar"><div className="gic-fill gic-violet" style={{ width: `${Math.min(metrics.totalAbertas * 5, 100)}%` }}></div></div>
        </div>

        {/* Valor Perda */}
        <div className="gic-item">
          <span className="gic-label">{t?.lostValue || 'Valor Perda'}</span>
          <span className="gic-value">{loading ? '—' : (formatCurrency ? formatCurrency(metrics.valorPerda, 'BRL') : `R$ ${metrics.valorPerda.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`)}</span>
          <div className="gic-bar"><div className="gic-fill" style={{ width: `${metrics.valorPerda > 0 ? 57 : 0}%` }}></div></div>
        </div>
      </div>

      {error && <div className="gic-error">⚠️ {error}</div>}
    </div>
  )
}

export default GoogleInvestimentoCard


