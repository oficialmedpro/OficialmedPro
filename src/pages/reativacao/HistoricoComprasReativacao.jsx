import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../../service/supabase';
import '../ClientesConsolidados.css';
import ReativacaoMenu from './ReativacaoMenu';
import './ReativacaoBasePage.css';

const HistoricoComprasReativacao = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const previousPathRef = useRef(null);
  
  const clienteIdPrime = searchParams.get('cliente_id');
  const clienteNome = searchParams.get('nome') || 'Cliente';
  
  // Salvar o caminho anterior quando a página carrega
  useEffect(() => {
    const state = location.state;
    if (state && state.from) {
      previousPathRef.current = state.from;
    } else {
      // Tentar recuperar do sessionStorage
      const savedPath = sessionStorage.getItem('reativacao_previous_path');
      if (savedPath) {
        previousPathRef.current = savedPath;
      } else {
        // Se não houver caminho salvo, usar a rota padrão de reativação
        previousPathRef.current = '/reativacao';
      }
    }
  }, [location]);
  
  const [pedidos, setPedidos] = useState([]);
  const [pedidosDetalhados, setPedidosDetalhados] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [filtroStatus, setFiltroStatus] = useState('all');
  const [expandedPedidos, setExpandedPedidos] = useState(new Set());

  useEffect(() => {
    if (!clienteIdPrime) {
      console.error('❌ ID do cliente não fornecido');
      setIsLoading(false);
      return;
    }
    loadHistoricoCompras();
  }, [clienteIdPrime]);

  const loadHistoricoCompras = async () => {
    try {
      setIsLoading(true);
      let clientePrimeId = clienteIdPrime;
      
      const { data: clienteData } = await supabase
        .schema('api')
        .from('prime_clientes')
        .select('id, codigo_cliente_original')
        .eq('id', clienteIdPrime)
        .single();
      
      if (!clienteData) {
        const { data: clienteByCodigo } = await supabase
          .schema('api')
          .from('prime_clientes')
          .select('id')
          .eq('codigo_cliente_original', clienteIdPrime)
          .single();
        
        if (clienteByCodigo) {
          clientePrimeId = clienteByCodigo.id;
        }
      }

      const { data: pedidosData, error } = await supabase
        .schema('api')
        .from('prime_pedidos')
        .select(`
          *,
          prime_clientes!inner(
            id,
            nome,
            email,
            telefone,
            codigo_cliente_original
          )
        `)
        .eq('cliente_id', clientePrimeId)
        .order('data_criacao', { ascending: false });

      if (error) throw error;
      
      if (!pedidosData || pedidosData.length === 0) {
        setPedidos({ ultimaCompra: [], outrasCompras: [], orcamentos: [] });
        setIsLoading(false);
        return;
      }
      
      const pedidosOrdenados = organizarPedidos(pedidosData);
      setPedidos(pedidosOrdenados);
      await loadDetalhesPedidos(pedidosData);
      
    } catch (error) {
      console.error('❌ Erro ao carregar histórico:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const organizarPedidos = (pedidosLista) => {
    const aprovados = pedidosLista.filter(p => 
      p.status_aprovacao === 'APROVADO' || 
      p.status_geral === 'APROVADO' || 
      p.status_entrega === 'ENTREGUE'
    );
    
    const naoAprovados = pedidosLista.filter(p => 
      p.status_aprovacao !== 'APROVADO' && 
      p.status_geral !== 'APROVADO' && 
      p.status_entrega !== 'ENTREGUE'
    );

    const ultimaCompra = aprovados.length > 0 ? [aprovados[0]] : [];
    const outrasCompras = aprovados.slice(1);
    const orcamentos = naoAprovados.sort((a, b) => {
      const dataA = new Date(a.data_criacao || 0);
      const dataB = new Date(b.data_criacao || 0);
      return dataB - dataA;
    });

    return { ultimaCompra, outrasCompras, orcamentos };
  };

  const loadDetalhesPedidos = async (pedidosLista) => {
    try {
      if (!pedidosLista || pedidosLista.length === 0) return;
      const pedidosIds = pedidosLista.map(p => p.id);
      
      const { data: formulasData, error: formulasError } = await supabase
        .schema('api')
        .from('prime_formulas')
        .select(`
          *,
          prime_formulas_itens(*)
        `)
        .in('pedido_id', pedidosIds)
        .order('numero_formula', { ascending: true });
      
      if (formulasError) throw formulasError;

      const detalhesMap = {};
      pedidosLista.forEach(pedido => {
        const pedidoFormulas = formulasData?.filter(f => 
          f.pedido_id === pedido.id || 
          f.codigo_orcamento_original === pedido.codigo_orcamento_original
        ) || [];
        
        detalhesMap[pedido.id] = {
          formulas: pedidoFormulas,
          itens: {}
        };
        
        pedidoFormulas.forEach(formula => {
          const formulaItens = formula.prime_formulas_itens || [];
          formulaItens.sort((a, b) => (a.numero_linha || 0) - (b.numero_linha || 0));
          detalhesMap[pedido.id].itens[formula.id] = formulaItens;
        });
      });

      setPedidosDetalhados(prev => ({ ...prev, ...detalhesMap }));
    } catch (error) {
      console.error('❌ Erro ao carregar detalhes:', error);
      const detalhesMap = {};
      pedidosLista?.forEach(pedido => {
        detalhesMap[pedido.id] = { formulas: [], itens: {} };
      });
      setPedidosDetalhados(prev => ({ ...prev, ...detalhesMap }));
    }
  };

  const filtrarPedidos = (categoria) => {
    if (filtroStatus === 'all') return categoria;
    return categoria.filter(pedido => {
      switch (filtroStatus) {
        case 'aprovado':
          return pedido.status_aprovacao === 'APROVADO' || pedido.status_geral === 'APROVADO';
        case 'entregue':
          return pedido.status_entrega === 'ENTREGUE';
        case 'pendente':
          return pedido.status_aprovacao !== 'APROVADO' && pedido.status_entrega !== 'ENTREGUE' && pedido.status_geral !== 'CANCELADO';
        case 'nao_aprovado':
          return pedido.status_aprovacao !== 'APROVADO';
        default:
          return true;
      }
    });
  };

  const togglePedido = (pedidoId) => {
    const newExpanded = new Set(expandedPedidos);
    if (newExpanded.has(pedidoId)) {
      newExpanded.delete(pedidoId);
    } else {
      newExpanded.add(pedidoId);
    }
    setExpandedPedidos(newExpanded);
  };

  const getStatusBadge = (pedido) => {
    const status = pedido.status_aprovacao || pedido.status_geral || pedido.status_entrega || 'PENDENTE';
    let className = 'hc-status-badge';
    
    if (status === 'APROVADO' || status === 'ENTREGUE') {
      className += ' hc-status-success';
    } else if (status === 'PENDENTE' || status === 'NAO_APROVADO') {
      className += ' hc-status-warning';
    } else {
      className += ' hc-status-error';
    }
    
    return <span className={className}>{status}</span>;
  };

  const renderDetalhesPedido = (pedidoId) => {
    const detalhes = pedidosDetalhados[pedidoId];
    if (!detalhes) return <div className="hc-no-details">Carregando detalhes...</div>;
    if (!detalhes.formulas || detalhes.formulas.length === 0) {
      return <div className="hc-no-details">Nenhuma fórmula encontrada para este pedido</div>;
    }

    return (
      <div className="hc-pedido-detalhes">
        {detalhes.formulas.map((formula, idx) => {
          const formulaItens = detalhes.itens[formula.id] || [];
          const temValorDesconto = formulaItens.some(item => 
            item.valor_venda_desconto && parseFloat(item.valor_venda_desconto) > 0
          );
          const temObservacao = formulaItens.some(item => 
            item.observacao && item.observacao.trim() !== ''
          );
          
          return (
            <div key={formula.id || idx} className="hc-formula-card">
              <h4>Fórmula #{formula.numero_formula || idx + 1}</h4>
              
              <div className="hc-formula-info">
                {formula.descricao && formula.descricao.trim() && (
                  <div className="hc-info-row-formula">
                    <strong>Descrição:</strong> <span>{formula.descricao}</span>
                  </div>
                )}
                {formula.posologia && formula.posologia.trim() && (
                  <div className="hc-info-row-formula">
                    <strong>Posologia:</strong> <span>{formula.posologia}</span>
                  </div>
                )}
                {formula.valor_formula && (
                  <div className="hc-info-row-formula">
                    <strong>Valor da Fórmula:</strong> 
                    <span>R$ {parseFloat(formula.valor_formula || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </div>
                )}
              </div>
              
              {formulaItens.length > 0 ? (
                <div className="hc-itens-table">
                  <h5>Produtos da Fórmula ({formulaItens.length})</h5>
                  <table className="hc-table">
                    <thead>
                      <tr>
                        <th>Linha</th>
                        <th>Produto</th>
                        <th>Quantidade</th>
                        <th>Unidade</th>
                        <th>Valor Venda</th>
                        {temValorDesconto && <th>Valor com Desc.</th>}
                        {temObservacao && <th>Observação</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {formulaItens.map((item, itemIdx) => (
                        <tr key={item.id || itemIdx}>
                          <td>{item.numero_linha || itemIdx + 1}</td>
                          <td>
                            <strong>{item.nome_produto || '—'}</strong>
                            {item.codigo_produto && (
                              <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>
                                Cód: {item.codigo_produto}
                              </div>
                            )}
                          </td>
                          <td>{item.quantidade ? parseFloat(item.quantidade).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '—'}</td>
                          <td>{item.unidade || '—'}</td>
                          <td>{item.valor_venda ? `R$ ${parseFloat(item.valor_venda).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '—'}</td>
                          {temValorDesconto && (
                            <td>
                              {item.valor_venda_desconto && parseFloat(item.valor_venda_desconto) > 0
                                ? `R$ ${parseFloat(item.valor_venda_desconto).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                                : '—'
                              }
                            </td>
                          )}
                          {temObservacao && (
                            <td style={{ maxWidth: '200px' }}>
                              {item.observacao && item.observacao.trim() !== '' ? item.observacao : '—'}
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="hc-no-items">Nenhum item encontrado para esta fórmula</div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const renderPedidoCard = (pedido) => {
    const isExpanded = expandedPedidos.has(pedido.id);
    
    return (
      <div key={pedido.id} className="hc-pedido-card">
        <div className="hc-pedido-header" onClick={() => togglePedido(pedido.id)}>
          <div className="hc-pedido-info">
            <div className="hc-pedido-main">
              <span className="hc-pedido-numero">Pedido #{pedido.codigo_orcamento_original || pedido.id}</span>
              <span className="hc-pedido-data">
                {pedido.data_criacao ? new Date(pedido.data_criacao).toLocaleDateString('pt-BR') : '—'}
              </span>
            </div>
            <div className="hc-pedido-status-row">
              {getStatusBadge(pedido)}
              <span className="hc-pedido-valor">
                R$ {parseFloat(pedido.valor_total || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
          <div className="hc-pedido-toggle">
            {isExpanded ? '▼' : '▶'}
          </div>
        </div>
        
        {isExpanded && (
          <div className="hc-pedido-expanded">
            <div className="hc-pedido-dados">
              <div className="hc-info-row">
                <strong>ID Pedido:</strong> {pedido.id} (Código: {pedido.codigo_orcamento_original || '—'})
              </div>
              <div className="hc-info-row">
                <strong>Data Criação:</strong> {pedido.data_criacao ? new Date(pedido.data_criacao).toLocaleString('pt-BR') : '—'}
              </div>
              {pedido.data_aprovacao && (
                <div className="hc-info-row">
                  <strong>Data Aprovação:</strong> {new Date(pedido.data_aprovacao).toLocaleString('pt-BR')}
                </div>
              )}
              {pedido.data_entrega && (
                <div className="hc-info-row">
                  <strong>Data Entrega:</strong> {new Date(pedido.data_entrega).toLocaleString('pt-BR')}
                </div>
              )}
              <div className="hc-info-row">
                <strong>Status Aprovação:</strong> {pedido.status_aprovacao || '—'}
              </div>
              <div className="hc-info-row">
                <strong>Status Entrega:</strong> {pedido.status_entrega || '—'}
              </div>
              <div className="hc-info-row">
                <strong>Status Geral:</strong> {pedido.status_geral || '—'}
              </div>
              <div className="hc-info-row">
                <strong>Valor Total:</strong> R$ {parseFloat(pedido.valor_total || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
              {pedido.valor_desconto > 0 && (
                <div className="hc-info-row">
                  <strong>Desconto:</strong> R$ {parseFloat(pedido.valor_desconto).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </div>
              )}
              {pedido.valor_final && (
                <div className="hc-info-row">
                  <strong>Valor Final:</strong> R$ {parseFloat(pedido.valor_final).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </div>
              )}
              {pedido.observacoes && (
                <div className="hc-info-row">
                  <strong>Observações:</strong> {pedido.observacoes}
                </div>
              )}
            </div>
            {renderDetalhesPedido(pedido.id)}
          </div>
        )}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="reativacao-dashboard-fullscreen">
        <ReativacaoMenu />
        <div className="reativacao-dashboard-content">
          <div className="hc-loading">Carregando histórico de compras...</div>
        </div>
      </div>
    );
  }

  const ultimaCompraFiltrada = filtrarPedidos(pedidos.ultimaCompra || []);
  const outrasComprasFiltradas = filtrarPedidos(pedidos.outrasCompras || []);
  const orcamentosFiltrados = filtrarPedidos(pedidos.orcamentos || []);

  return (
    <div className="reativacao-dashboard-fullscreen">
      <ReativacaoMenu />
      <div className="reativacao-dashboard-content">
        <div className="hc-container" style={{ 
          width: '100%', 
          minHeight: '100vh', 
          backgroundColor: '#0f172a',
          color: '#e0e7ff',
          margin: 0,
          padding: '30px',
          boxSizing: 'border-box'
        }}>
          <div className="hc-header" style={{ marginBottom: '20px' }}>
            <button 
              className="hc-btn-back" 
              onClick={() => {
                // Tentar voltar para o caminho salvo
                if (previousPathRef.current) {
                  navigate(previousPathRef.current);
                } else {
                  // Se não houver caminho salvo, tentar voltar no histórico
                  if (window.history.length > 1) {
                    navigate(-1);
                  } else {
                    // Se não houver histórico, ir para a rota padrão
                    navigate('/reativacao');
                  }
                }
              }}
              style={{
                padding: '10px 20px',
                backgroundColor: '#334155',
                color: '#e0e7ff',
                border: '1px solid #475569',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = '#475569';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = '#334155';
              }}
            >
              ← Voltar
            </button>
            <h1 style={{ color: '#e0e7ff', marginTop: '20px' }}>Histórico de Compras - {clienteNome}</h1>
          </div>

          <div className="hc-filters" style={{ marginBottom: '20px' }}>
            <label style={{ color: '#e0e7ff', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <strong>Filtrar por Status:</strong>
              <select 
                value={filtroStatus} 
                onChange={(e) => setFiltroStatus(e.target.value)}
                className="hc-select"
                style={{
                  padding: '8px 12px',
                  backgroundColor: '#1e293b',
                  color: '#e0e7ff',
                  border: '1px solid #475569',
                  borderRadius: '6px',
                  fontSize: '14px'
                }}
              >
                <option value="all">Todos</option>
                <option value="aprovado">Aprovados</option>
                <option value="entregue">Entregues</option>
                <option value="pendente">Pendentes</option>
                <option value="nao_aprovado">Não Aprovados</option>
              </select>
            </label>
          </div>

          {ultimaCompraFiltrada.length > 0 && (
            <section className="hc-section" style={{ marginBottom: '30px' }}>
              <h2 style={{ color: '#e0e7ff', marginBottom: '15px' }}>📦 Última Compra</h2>
              {ultimaCompraFiltrada.map(pedido => renderPedidoCard(pedido))}
            </section>
          )}

          {outrasComprasFiltradas.length > 0 && (
            <section className="hc-section" style={{ marginBottom: '30px' }}>
              <h2 style={{ color: '#e0e7ff', marginBottom: '15px' }}>🛒 Outras Compras ({outrasComprasFiltradas.length})</h2>
              {outrasComprasFiltradas.map(pedido => renderPedidoCard(pedido))}
            </section>
          )}

          {orcamentosFiltrados.length > 0 && (
            <section className="hc-section" style={{ marginBottom: '30px' }}>
              <h2 style={{ color: '#e0e7ff', marginBottom: '15px' }}>📋 Orçamentos Não Aprovados ({orcamentosFiltrados.length})</h2>
              {orcamentosFiltrados.map(pedido => renderPedidoCard(pedido))}
            </section>
          )}

          {ultimaCompraFiltrada.length === 0 && outrasComprasFiltradas.length === 0 && orcamentosFiltrados.length === 0 && (
            <div className="hc-empty" style={{ color: '#94a3b8', textAlign: 'center', padding: '40px' }}>
              Nenhum pedido encontrado com os filtros selecionados.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HistoricoComprasReativacao;

