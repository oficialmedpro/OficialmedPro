import React, { useEffect, useState } from 'react'
import { googleInvestimentoService } from '../service/googleInvestimentoService'
import './GoogleInvestimentoCard.css'
import { googleOportunidadesService } from '../service/googleOportunidadesService'

/**
 * Card isolado para exibir investimento do Google
 * Props de período devem vir do Dashboard/FilterBar: startDate, endDate
 */
const GoogleInvestimentoCard = ({ t, formatCurrency, startDate, endDate }) => {
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
        // carregar métricas de oportunidades
        const opp = await googleOportunidadesService.getPeriodoMetrics(startDate || endDate, endDate || startDate)
        if (isMounted) setMetrics(opp)
      } catch (err) {
        if (isMounted) setError(err.message || 'Erro ao carregar dados')
      } finally {
        if (isMounted) setLoading(false)
      }
    }
    load()
    return () => { isMounted = false }
  }, [startDate, endDate])

  return (
    <div className="gic-card">
      <div className="gic-header">
        <div className="gic-platform-icon">G</div>
        <span className="gic-platform-name">Google</span>
        <div className="gic-roas-badge">{t?.roas || 'ROAS'} —</div>
      </div>

      <div className="gic-content">
        {/* Investido */}
        <div className="gic-item">
          <span className="gic-label">{t?.invested || 'Investido'}</span>
          <span className="gic-value">
            {loading ? 'Carregando...' : error ? 'Erro' : formatCurrency ? formatCurrency(total, 'BRL') : `R$ ${total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          </span>
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


