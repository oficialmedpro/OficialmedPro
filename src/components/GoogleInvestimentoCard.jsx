import React, { useEffect, useState } from 'react'
import { googleInvestimentoService } from '../service/googleInvestimentoService'
import { googleOportunidadesService } from '../service/googleOportunidadesService'
import { googleConversaoService } from '../service/googleConversaoService'

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
  const [registrosInvestimento, setRegistrosInvestimento] = useState(0) // Quantidade de registros de investimento
  const [dataSource, setDataSource] = useState('') // Fonte dos dados: 'database' ou 'google-ads-api'
  const [metrics, setMetrics] = useState({
    totalGanhas: 0,
    valorGanho: 0,
    totalPerdidas: 0,
    valorPerda: 0,
    totalAbertas: 0,
    totalNegociacao: 0,
    totalFollowUp: 0,
    valorNegociacao: 0,
    valorFollowUp: 0,
    taxaConversao: 0,
    totalCriadas: 0
  })

  useEffect(() => {
    let isMounted = true
    const load = async () => {
      try {
        setLoading(true)
        setError(null)
        
          // USAR MODO TEMPO REAL: Busca diretamente da API Google Ads
          const result = await googleInvestimentoService.getInvestimentoRealTime(startDate, endDate)
        
        if (isMounted) {
          setTotal(result.total)
          setRegistrosInvestimento(result.items?.length || 0)
          setDataSource(result.source || 'unknown')
          
          console.log('📊 Fonte dos dados de investimento:', result.source);
        }
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
            totalPerdidas: conv.totalPerdidas,
            valorPerda: conv.valorPerda,
            totalAbertas: conv.totalAbertas,
            totalNegociacao: conv.totalNegociacao,
            totalFollowUp: conv.totalFollowUp,
            valorNegociacao: conv.valorNegociacao,
            valorFollowUp: conv.valorFollowUp,
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

  // Debug: Log das métricas para verificar se os dados estão chegando
  console.log('🔍 GoogleInvestimentoCard Debug:', {
    loading,
    error,
    total: `R$ ${total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
    registrosInvestimento,
    metrics: {
      ganhas: `${metrics.totalGanhas} (R$ ${metrics.valorGanho.toLocaleString('pt-BR', { minimumFractionDigits: 2 })})`,
      perdidas: `${metrics.totalPerdidas} (R$ ${metrics.valorPerda.toLocaleString('pt-BR', { minimumFractionDigits: 2 })})`,
      abertas: metrics.totalAbertas,
      negociacao: `${metrics.totalNegociacao} (R$ ${metrics.valorNegociacao.toLocaleString('pt-BR', { minimumFractionDigits: 2 })})`,
      followUp: `${metrics.totalFollowUp} (R$ ${metrics.valorFollowUp.toLocaleString('pt-BR', { minimumFractionDigits: 2 })})`,
      taxaConversao: `${metrics.taxaConversao.toFixed(1)}%`,
      criadas: metrics.totalCriadas
    },
    periodo: { startDate, endDate },
    filtros: { selectedFunnel, selectedUnit, selectedSeller }
  });


  return (
    <div className="ms-metric-card ms-google-card">
      <div className="ms-metric-card-header">
        <div className="ms-platform-icon ms-google-icon">G</div>
        <span className="ms-platform-name">Google</span>
        <div className="ms-roas-badge">{t?.roas || 'ROAS'} {calcularROAS()}</div>
      </div>

      <div className="ms-metrics-grid">
        {/* Investido */}
        <div className="ms-metric-item-visual">
          <div className="ms-metric-info">
            <span className="ms-metric-label">{t?.invested || 'Investido'}</span>
            <span className="ms-metric-value">
              {loading ? 'Carregando...' : error ? 'Erro' : formatCurrency ? formatCurrency(total, 'BRL') : `R$ ${total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
            </span>
            {/* Período filtrado e quantidade de registros */}
            <small style={{ color: '#64748b', fontSize: '10px' }}>
              📅 {(() => {
                const formatDate = (dateStr) => {
                  if (!dateStr) return 'N/A';
                  const [year, month, day] = dateStr.split('-');
                  return `${day}-${month}-${year}`;
                };
                return `${formatDate(startDate)} até ${formatDate(endDate)}`;
              })()}
              {registrosInvestimento > 0 && ` • ${registrosInvestimento} registro${registrosInvestimento !== 1 ? 's' : ''}`}
              {dataSource && (
                <span style={{ marginLeft: '5px', color: dataSource === 'google-ads-api' ? '#10b981' : '#64748b' }}>
                  {dataSource === 'google-ads-api' ? '🔴 API Tempo Real' : '💾 Banco de Dados'}
                </span>
              )}
            </small>
          </div>
          <div className="ms-metric-bar">
            <div className="ms-metric-fill" style={{ width: '85%', background: 'linear-gradient(90deg, #ef4444, #dc2626)' }}></div>
          </div>
        </div>

        {/* Taxa Conversão */}
        <div className="ms-metric-item-visual">
          <div className="ms-metric-info">
            <span className="ms-metric-label">{t?.conversionRate || 'Taxa Conversão'}</span>
            <span className="ms-metric-value">
              {loading ? '—' : `${metrics.totalCriadas} → ${metrics.totalGanhas} (${metrics.taxaConversao.toFixed(1)}%)`}
            </span>
          </div>
          <div className="ms-metric-bar">
            <div className="ms-metric-fill" style={{ width: `${Math.min(metrics.taxaConversao, 100)}%`, background: 'linear-gradient(90deg, #3b82f6, #1d4ed8)' }}></div>
          </div>
        </div>

        {/* Valor Ganho */}
        <div className="ms-metric-item-visual">
          <div className="ms-metric-info">
            <span className="ms-metric-label">{t?.revenue || 'Valor Ganho'}</span>
            <span className="ms-metric-value">{loading ? '—' : (formatCurrency ? formatCurrency(metrics.valorGanho, 'BRL') : `R$ ${metrics.valorGanho.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`)}</span>
          </div>
          <div className="ms-metric-bar">
            <div className="ms-metric-fill" style={{ width: `${metrics.valorGanho > 0 ? 92 : 0}%`, background: 'linear-gradient(90deg, #10b981, #059669)' }}></div>
          </div>
        </div>

        {/* Custo por Lead */}
        <div className="ms-metric-item-visual">
          <div className="ms-metric-info">
            <span className="ms-metric-label">{t?.costPerLead || 'Custo por Lead'}</span>
            <span className="ms-metric-value">
              {loading ? '—' : (() => {
                const custoPorLead = metrics.totalCriadas > 0 ? total / metrics.totalCriadas : 0;
                return formatCurrency ? formatCurrency(custoPorLead, 'BRL') : `R$ ${custoPorLead.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
              })()}
            </span>
          </div>
          <div className="ms-metric-bar">
            <div className="ms-metric-fill" style={{ width: `${metrics.totalCriadas > 0 ? Math.min((total / metrics.totalCriadas) / 50 * 100, 100) : 0}%`, background: 'linear-gradient(90deg, #06b6d4, #0891b2)' }}></div>
          </div>
        </div>

        {/* Oportunidades Perdidas */}
        <div className="ms-metric-item-visual">
          <div className="ms-metric-info">
            <span className="ms-metric-label">{t?.lostOpps || 'Oportunidades Perdidas'}</span>
            <span className="ms-metric-value">{loading ? '—' : metrics.totalPerdidas}</span>
          </div>
          <div className="ms-metric-bar">
            <div className="ms-metric-fill" style={{ width: `${Math.min(metrics.totalPerdidas, 100)}%`, background: 'linear-gradient(90deg, #f59e0b, #d97706)' }}></div>
          </div>
        </div>

        {/* Valor Perda (logo após Oportunidades Perdidas) */}
        <div className="ms-metric-item-visual">
          <div className="ms-metric-info">
            <span className="ms-metric-label">{t?.lostValue || 'Valor Perda'}</span>
            <span className="ms-metric-value">{loading ? '—' : (formatCurrency ? formatCurrency(metrics.valorPerda, 'BRL') : `R$ ${metrics.valorPerda.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`)}</span>
          </div>
          <div className="ms-metric-bar">
            <div className="ms-metric-fill" style={{ width: `${metrics.valorPerda > 0 ? 57 : 0}%`, background: 'linear-gradient(90deg, #f59e0b, #d97706)' }}></div>
          </div>
        </div>

        {/* Oportunidades Abertas */}
        <div className="ms-metric-item-visual">
          <div className="ms-metric-info">
            <span className="ms-metric-label">{t?.openOpps || 'Oportunidades Abertas'}</span>
            <span className="ms-metric-value">{loading ? '—' : metrics.totalAbertas}</span>
          </div>
          <div className="ms-metric-bar">
            <div className="ms-metric-fill" style={{ width: `${Math.min(metrics.totalAbertas * 5, 100)}%`, background: 'linear-gradient(90deg, #8b5cf6, #7c3aed)' }}></div>
          </div>
        </div>

        {/* Oportunidades em Negociação */}
        <div className="ms-metric-item-visual">
          <div className="ms-metric-info">
            <span className="ms-metric-label">Oportunidades em Negociação</span>
            <span className="ms-metric-value">{loading ? '—' : `${metrics.totalNegociacao} - ${formatCurrency ? formatCurrency(metrics.valorNegociacao, 'BRL') : `R$ ${metrics.valorNegociacao.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}`}</span>
          </div>
          <div className="ms-metric-bar">
            <div className="ms-metric-fill" style={{ width: `${Math.min(metrics.totalNegociacao * 8, 100)}%`, background: 'linear-gradient(90deg, #06b6d4, #0891b2)' }}></div>
          </div>
        </div>

        {/* Oportunidades em Follow-Up */}
        <div className="ms-metric-item-visual">
          <div className="ms-metric-info">
            <span className="ms-metric-label">Oportunidades em Follow-Up</span>
            <span className="ms-metric-value">{loading ? '—' : `${metrics.totalFollowUp} - ${formatCurrency ? formatCurrency(metrics.valorFollowUp, 'BRL') : `R$ ${metrics.valorFollowUp.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}`}</span>
          </div>
          <div className="ms-metric-bar">
            <div className="ms-metric-fill" style={{ width: `${Math.min(metrics.totalFollowUp * 6, 100)}%`, background: 'linear-gradient(90deg, #10b981, #059669)' }}></div>
          </div>
        </div>
      </div>

      {error && <div className="ms-error-message">⚠️ {error}</div>}
    </div>
  )
}

export default GoogleInvestimentoCard


