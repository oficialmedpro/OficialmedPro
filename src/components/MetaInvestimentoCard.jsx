import React, { useEffect, useState } from 'react'
import { unitMetaService } from '../service/unitMetaService'
import { metaConversaoService } from '../service/metaConversaoService'

/**
 * Card isolado para exibir investimento do Meta
 * Props devem vir do Dashboard/FilterBar: startDate, endDate, selectedFunnel, selectedUnit, selectedSeller
 */
const MetaInvestimentoCard = ({ 
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
        
        console.log('🔍 MetaInvestimentoCard: Iniciando carregamento...')
        console.log('📅 Parâmetros:', { startDate, endDate, selectedUnit, selectedFunnel, selectedSeller })
        
        // Buscar investimento total do Meta usando unitMetaService
        const dateRange = { since: startDate, until: endDate }
        console.log('📊 Buscando métricas do Meta com dateRange:', dateRange)
        
        // Converter selectedUnit para o formato esperado pelo unitMetaService
        let unitCode = selectedUnit
        if (selectedUnit && selectedUnit !== 'all') {
          // Se selectedUnit já tem colchetes, usar como está
          if (selectedUnit.toString().includes('[')) {
            unitCode = selectedUnit
          } else {
            // Se não tem colchetes, adicionar
            unitCode = `[${selectedUnit}]`
          }
        }
        
        console.log('🏢 UnitCode formatado:', unitCode)
        const metaMetrics = await unitMetaService.getCompleteMetaMetrics(dateRange, unitCode)
        console.log('✅ Métricas do Meta carregadas:', metaMetrics)
        
        if (isMounted) setTotal(metaMetrics.totalInvestido)
        
        // Carregar métricas de oportunidades usando o novo metaConversaoService
        try {
          console.log('📊 Buscando métricas de conversão do Meta...')
          console.log('📅 Parâmetros para metaConversaoService:', {
            startDate: startDate || endDate,
            endDate: endDate || startDate,
            selectedFunnel,
            selectedUnit,
            selectedSeller
          })
          
          const conv = await metaConversaoService.getConversaoMetrics(
            startDate || endDate,
            endDate || startDate,
            {
              selectedFunnel,
              selectedUnit,
              selectedSeller
            }
          )
          console.log('✅ Métricas de conversão do Meta carregadas:', conv)
          console.log('🔍 Detalhes das métricas:', {
            totalCriadas: conv.totalCriadas,
            totalGanhas: conv.totalGanhas,
            totalPerdidas: conv.totalPerdidas,
            totalAbertas: conv.totalAbertas,
            totalNegociacao: conv.totalNegociacao,
            totalFollowUp: conv.totalFollowUp,
            valorGanho: conv.valorGanho,
            valorPerda: conv.valorPerda,
            valorNegociacao: conv.valorNegociacao,
            valorFollowUp: conv.valorFollowUp,
            taxaConversao: conv.taxaConversao
          })
          
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
          console.error('❌ Erro ao carregar métricas de conversão do Meta:', e)
          console.error('❌ Stack trace:', e.stack)
          // Manter métricas padrão em caso de erro
        }
      } catch (err) {
        console.error('❌ Erro geral no MetaInvestimentoCard:', err)
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
  console.log('🔍 MetaInvestimentoCard Debug:', {
    loading,
    error,
    total,
    metrics,
    totalNegociacao: metrics.totalNegociacao,
    totalFollowUp: metrics.totalFollowUp,
    valorNegociacao: metrics.valorNegociacao,
    valorFollowUp: metrics.valorFollowUp,
    startDate,
    endDate,
    selectedFunnel,
    selectedUnit,
    selectedSeller
  });

  return (
    <div className="ms-metric-card ms-meta-card">
      <div className="ms-metric-card-header">
        <div className="ms-platform-icon ms-meta-icon">M</div>
        <span className="ms-platform-name">Meta</span>
        <div className="ms-roas-badge">{t?.roas || 'ROAS'} {calcularROAS()}</div>
      </div>

      <div className="ms-metrics-grid">
        {/* Investido */}
        <div className="ms-metric-item-visual">
          <div className="ms-metric-info">
            <span className="ms-metric-label">{t?.invested || 'Investido'}</span>
            <span className="ms-metric-value">
              {loading ? 'Carregando...' : error ? 'Erro' : formatCurrency ? formatCurrency(total * 5.2, 'BRL') : `R$ ${(total * 5.2).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
            </span>
            {/* Período filtrado para debug */}
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
                return formatCurrency ? formatCurrency(custoPorLead * 5.2, 'BRL') : `R$ ${(custoPorLead * 5.2).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
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

export default MetaInvestimentoCard
