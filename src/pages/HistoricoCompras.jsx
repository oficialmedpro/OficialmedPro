import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '../service/supabase';
import './ClientesConsolidados.css';

const HistoricoCompras = ({ onLogout }) => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const clienteIdPrime = searchParams.get('cliente_id');
  const clienteNome = searchParams.get('nome') || 'Cliente';
  
  const [pedidos, setPedidos] = useState([]);
  const [pedidosDetalhados, setPedidosDetalhados] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [filtroStatus, setFiltroStatus] = useState('all'); // 'all' | 'aprovado' | 'entregue' | 'pendente' | 'nao_aprovado'
  const [expandedPedidos, setExpandedPedidos] = useState(new Set());

  // Carregar histórico de pedidos do cliente
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
      console.log('🔍 Carregando histórico de compras para cliente:', clienteIdPrime);

      // O clienteIdPrime vem de row.id_prime do clientes_mestre
      // No clientes_mestre, id_prime corresponde ao id da tabela prime_clientes
      // Então podemos usar diretamente para buscar em prime_pedidos onde cliente_id = id do prime_clientes
      let clientePrimeId = clienteIdPrime;
      
      // Verificar se existe cliente no prime_clientes com esse ID
      const { data: clienteData, error: clienteError } = await supabase
        .schema('api')
        .from('prime_clientes')
        .select('id, codigo_cliente_original')
        .eq('id', clienteIdPrime)
        .single();
      
      if (!clienteData && !clienteError) {
        // Se não encontrou pelo id, tentar pelo codigo_cliente_original
        const { data: clienteByCodigo } = await supabase
          .schema('api')
          .from('prime_clientes')
          .select('id')
          .eq('codigo_cliente_original', clienteIdPrime)
          .single();
        
        if (clienteByCodigo) {
          clientePrimeId = clienteByCodigo.id;
          console.log('✅ Cliente encontrado pelo código:', clientePrimeId);
        }
      } else if (clienteData) {
        console.log('✅ Cliente encontrado no Prime:', clientePrimeId);
      }

      // Buscar TODOS os pedidos do cliente com dados do cliente usando JOIN
      // Usar select com relacionamentos para buscar dados do cliente também
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

      if (error) {
        console.error('❌ Erro ao buscar pedidos:', error);
        throw error;
      }

      console.log(`✅ ${pedidosData?.length || 0} pedidos encontrados`);
      
      if (!pedidosData || pedidosData.length === 0) {
        console.warn('⚠️ Nenhum pedido encontrado para este cliente');
        setPedidos({ ultimaCompra: [], outrasCompras: [], orcamentos: [] });
        setIsLoading(false);
        return;
      }
      
      // Separar pedidos em categorias:
      // 1. Última compra (aprovada/entregue)
      // 2. Outras compras (aprovadas/entregues)
      // 3. Orçamentos não aprovados
      const pedidosOrdenados = organizarPedidos(pedidosData);
      
      setPedidos(pedidosOrdenados);
      
      // Carregar detalhes (fórmulas e itens) para TODOS os pedidos de uma vez
      console.log('🔍 Iniciando carregamento de fórmulas e itens...');
      await loadDetalhesPedidos(pedidosData);
      
    } catch (error) {
      console.error('❌ Erro ao carregar histórico:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Organizar pedidos: última compra primeiro, depois outras compras, depois orçamentos
  const organizarPedidos = (pedidosLista) => {
    // Separar por status
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

    // Última compra (primeiro pedido aprovado/entregue)
    const ultimaCompra = aprovados.length > 0 ? [aprovados[0]] : [];
    
    // Outras compras (resto dos aprovados)
    const outrasCompras = aprovados.slice(1);
    
    // Orçamentos não aprovados (ordenados por data, mais recente primeiro)
    const orcamentos = naoAprovados.sort((a, b) => {
      const dataA = new Date(a.data_criacao || 0);
      const dataB = new Date(b.data_criacao || 0);
      return dataB - dataA;
    });

    return {
      ultimaCompra,
      outrasCompras,
      orcamentos
    };
  };

  // Carregar detalhes completos (fórmulas e itens) para cada pedido
  const loadDetalhesPedidos = async (pedidosLista) => {
    try {
      if (!pedidosLista || pedidosLista.length === 0) {
        console.warn('⚠️ Nenhum pedido para carregar detalhes');
        return;
      }

      const pedidosIds = pedidosLista.map(p => p.id);
      console.log(`🔍 Carregando detalhes para ${pedidosIds.length} pedidos:`, pedidosIds.slice(0, 5));
      
      // Buscar TODAS as fórmulas E itens de uma vez
      // IMPORTANTE: Usar relacionamento sem !inner para não filtrar fórmulas sem itens
      // Primeiro, tentar buscar pela tabela prime_formulas
      let formulasData = null;
      let formulasError = null;
      
      // Buscar fórmulas usando pedido_id
      const { data: formulasPorId, error: errorPorId } = await supabase
        .schema('api')
        .from('prime_formulas')
        .select(`
          *,
          prime_formulas_itens(*)
        `)
        .in('pedido_id', pedidosIds)
        .order('numero_formula', { ascending: true });
      
      if (!errorPorId && formulasPorId && formulasPorId.length > 0) {
        formulasData = formulasPorId;
        console.log(`✅ ${formulasData.length} fórmulas encontradas por pedido_id`);
      } else {
        // Fallback: buscar também pelo codigo_orcamento_original (caso o relacionamento use isso)
        console.log('⚠️ Não encontrou fórmulas por pedido_id, tentando por codigo_orcamento_original...');
        
        const codigosOrcamento = pedidosLista.map(p => p.codigo_orcamento_original).filter(Boolean);
        
        if (codigosOrcamento.length > 0) {
          const { data: formulasPorCodigo, error: errorPorCodigo } = await supabase
            .schema('api')
            .from('prime_formulas')
            .select(`
              *,
              prime_formulas_itens(*)
            `)
            .in('codigo_orcamento_original', codigosOrcamento)
            .order('numero_formula', { ascending: true });
          
          if (!errorPorCodigo && formulasPorCodigo && formulasPorCodigo.length > 0) {
            formulasData = formulasPorCodigo;
            console.log(`✅ ${formulasData.length} fórmulas encontradas por codigo_orcamento_original`);
          } else {
            formulasError = errorPorCodigo || errorPorId;
            console.warn('⚠️ Nenhuma fórmula encontrada por nenhum método');
          }
        } else {
          formulasError = errorPorId;
        }
      }

      if (formulasError) {
        console.error('❌ Erro ao buscar fórmulas com itens:', formulasError);
        console.error('📋 Detalhes do erro:', {
          message: formulasError.message,
          details: formulasError.details,
          hint: formulasError.hint,
          code: formulasError.code
        });
        
        // Fallback: buscar separadamente se o relacionamento não funcionar
        console.log('⚠️ Tentando buscar separadamente...');
        
        const { data: formulasOnly, error: formulasOnlyError } = await supabase
          .schema('api')
          .from('prime_formulas')
          .select('*')
          .in('pedido_id', pedidosIds)
          .order('numero_formula', { ascending: true });

        if (formulasOnlyError) {
          console.error('❌ Erro ao buscar fórmulas:', formulasOnlyError);
          throw formulasOnlyError;
        }

        console.log(`✅ ${formulasOnly?.length || 0} fórmulas encontradas (sem relacionamento)`);
        
        // Buscar itens separadamente
        const formulasIds = formulasOnly?.map(f => f.id) || [];
        let itensData = [];
        
        if (formulasIds.length > 0) {
          const { data: itensDataResult, error: itensError } = await supabase
            .schema('api')
            .from('prime_formulas_itens')
            .select('*')
            .in('formula_id', formulasIds)
            .order('numero_linha', { ascending: true });

          if (itensError) {
            console.error('❌ Erro ao buscar itens:', itensError);
            throw itensError;
          }

          itensData = itensDataResult || [];
          console.log(`✅ ${itensData.length} itens encontrados`);
          
          // Organizar itens por fórmula manualmente
          const detalhesMap = {};
          pedidosLista.forEach(pedido => {
            // Buscar fórmulas por pedido_id OU codigo_orcamento_original (fallback)
            const pedidoFormulas = formulasOnly?.filter(f => 
              f.pedido_id === pedido.id || 
              f.codigo_orcamento_original === pedido.codigo_orcamento_original
            ) || [];
            
            detalhesMap[pedido.id] = {
              formulas: pedidoFormulas,
              itens: {}
            };
            
            pedidoFormulas.forEach(formula => {
              const formulaItens = itensData.filter(item => item.formula_id === formula.id);
              detalhesMap[pedido.id].itens[formula.id] = formulaItens;
            });
          });
          
          setPedidosDetalhados(prev => ({ ...prev, ...detalhesMap }));
          return;
        }
        
        // Se não há fórmulas, inicializar mapa vazio
        const detalhesMapVazio = {};
        pedidosLista.forEach(pedido => {
          detalhesMapVazio[pedido.id] = { formulas: [], itens: {} };
        });
        setPedidosDetalhados(prev => ({ ...prev, ...detalhesMapVazio }));
        return;
      }

      console.log(`✅ ${formulasData?.length || 0} fórmulas encontradas com relacionamento`);
      console.log('🔍 Exemplo de fórmula com itens:', formulasData?.[0]);
      
      // Os itens já vêm dentro de cada fórmula via relacionamento
      // Acessar via: formula.prime_formulas_itens

      // Inicializar mapa para todos os pedidos (mesmo sem fórmulas)
      const detalhesMap = {};
      
      // Organizar dados por pedido
      // Os itens já vêm dentro de cada fórmula via relacionamento (prime_formulas_itens)
      pedidosLista.forEach(pedido => {
        // Buscar fórmulas por pedido_id OU codigo_orcamento_original (fallback)
        const pedidoFormulas = formulasData?.filter(f => 
          f.pedido_id === pedido.id || 
          f.codigo_orcamento_original === pedido.codigo_orcamento_original
        ) || [];
        
        detalhesMap[pedido.id] = {
          formulas: pedidoFormulas,
          itens: {}
        };
        
        // Organizar itens por fórmula
        // Os itens vêm dentro de formula.prime_formulas_itens (array)
        pedidoFormulas.forEach(formula => {
          // Acessar itens via relacionamento
          const formulaItens = formula.prime_formulas_itens || [];
          
          // Ordenar itens por numero_linha
          formulaItens.sort((a, b) => {
            const linhaA = a.numero_linha || 0;
            const linhaB = b.numero_linha || 0;
            return linhaA - linhaB;
          });
          
          detalhesMap[pedido.id].itens[formula.id] = formulaItens;
          
          if (formulaItens.length > 0) {
            console.log(`📦 Pedido ${pedido.id}, Fórmula #${formula.numero_formula}: ${formulaItens.length} itens encontrados`);
          } else {
            console.log(`⚠️ Pedido ${pedido.id}, Fórmula #${formula.numero_formula}: NENHUM ITEM encontrado (formula_id: ${formula.id})`);
          }
        });
        
        if (pedidoFormulas.length > 0) {
          const totalItens = pedidoFormulas.reduce((acc, f) => {
            const itens = detalhesMap[pedido.id].itens[f.id] || [];
            return acc + itens.length;
          }, 0);
          console.log(`✅ Pedido ${pedido.id}: ${pedidoFormulas.length} fórmula(s) com ${totalItens} itens`);
        } else {
          console.log(`⚠️ Pedido ${pedido.id}: nenhuma fórmula encontrada`);
        }
      });

      console.log(`✅ Detalhes organizados para ${Object.keys(detalhesMap).length} pedidos`);
      setPedidosDetalhados(prev => ({ ...prev, ...detalhesMap }));
      
    } catch (error) {
      console.error('❌ Erro ao carregar detalhes:', error);
      // Inicializar mapa vazio para evitar erros
      const detalhesMap = {};
      pedidosLista?.forEach(pedido => {
        detalhesMap[pedido.id] = {
          formulas: [],
          itens: {}
        };
      });
      setPedidosDetalhados(prev => ({ ...prev, ...detalhesMap }));
    }
  };

  // Filtrar pedidos por status
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

  // Toggle expandir/recolher pedido
  const togglePedido = (pedidoId) => {
    const newExpanded = new Set(expandedPedidos);
    if (newExpanded.has(pedidoId)) {
      newExpanded.delete(pedidoId);
    } else {
      newExpanded.add(pedidoId);
    }
    setExpandedPedidos(newExpanded);
  };

  // Formatar status com cores
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

  // Renderizar detalhes do pedido (fórmulas e itens)
  const renderDetalhesPedido = (pedidoId) => {
    const detalhes = pedidosDetalhados[pedidoId];
    
    // Verificar se está carregando ou se não há detalhes
    if (!detalhes) {
      return <div className="hc-no-details">Carregando detalhes...</div>;
    }
    
    if (!detalhes.formulas || detalhes.formulas.length === 0) {
      return <div className="hc-no-details">Nenhuma fórmula encontrada para este pedido</div>;
    }

    console.log(`🔍 Renderizando detalhes do pedido ${pedidoId}:`, {
      totalFormulas: detalhes.formulas.length,
      formulasComItens: detalhes.formulas.filter(f => detalhes.itens[f.id]?.length > 0).length
    });

    return (
      <div className="hc-pedido-detalhes">
        {detalhes.formulas.map((formula, idx) => {
          const formulaItens = detalhes.itens[formula.id] || [];
          
          return (
            <div key={formula.id || idx} className="hc-formula-card">
              <h4>Fórmula #{formula.numero_formula || idx + 1}</h4>
              
              <div className="hc-formula-info">
                {formula.descricao && formula.descricao.trim() && (
                  <div className="hc-info-row-formula">
                    <strong>Descrição:</strong> 
                    <span>{formula.descricao}</span>
                  </div>
                )}
                {formula.posologia && formula.posologia.trim() && (
                  <div className="hc-info-row-formula">
                    <strong>Posologia:</strong> 
                    <span>{formula.posologia}</span>
                  </div>
                )}
                {formula.valor_formula && (
                  <div className="hc-info-row-formula">
                    <strong>Valor da Fórmula:</strong> 
                    <span>R$ {parseFloat(formula.valor_formula || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </div>
                )}
              </div>
              
              {/* Itens da fórmula */}
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
                        <th>Quant. Cálculo</th>
                        <th>Valor Custo</th>
                        <th>Valor Venda</th>
                        <th>Valor com Desc.</th>
                        <th>Observação</th>
                      </tr>
                    </thead>
                    <tbody>
                      {formulaItens.map((item, itemIdx) => {
                        const valorTotal = item.valor_venda && item.quantidade 
                          ? parseFloat(item.valor_venda) * parseFloat(item.quantidade)
                          : 0;
                        
                        return (
                          <tr key={item.id || itemIdx}>
                            <td>{item.numero_linha || itemIdx + 1}</td>
                            <td>
                              <strong>{item.nome_produto || '—'}</strong>
                              {item.codigo_produto && (
                                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                                  Cód: {item.codigo_produto}
                                </div>
                              )}
                            </td>
                            <td>{item.quantidade ? parseFloat(item.quantidade).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '—'}</td>
                            <td>{item.unidade || '—'}</td>
                            <td>{item.quantidade_calculo ? parseFloat(item.quantidade_calculo).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '—'}</td>
                            <td>{item.valor_custo ? `R$ ${parseFloat(item.valor_custo).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '—'}</td>
                            <td>{item.valor_venda ? `R$ ${parseFloat(item.valor_venda).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '—'}</td>
                            <td>{item.valor_venda_desconto ? `R$ ${parseFloat(item.valor_venda_desconto).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '—'}</td>
                            <td style={{ maxWidth: '200px' }}>{item.observacao || '—'}</td>
                          </tr>
                        );
                      })}
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

  // Renderizar card de pedido
  const renderPedidoCard = (pedido, categoria) => {
    const isExpanded = expandedPedidos.has(pedido.id);
    const detalhes = pedidosDetalhados[pedido.id];
    
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
      <div className="hc-container">
        <div className="hc-loading">Carregando histórico de compras...</div>
      </div>
    );
  }

  const ultimaCompraFiltrada = filtrarPedidos(pedidos.ultimaCompra || []);
  const outrasComprasFiltradas = filtrarPedidos(pedidos.outrasCompras || []);
  const orcamentosFiltrados = filtrarPedidos(pedidos.orcamentos || []);

  return (
    <div className="hc-container">
      <div className="hc-header">
        <button className="hc-btn-back" onClick={() => navigate(-1)}>← Voltar</button>
        <h1>Histórico de Compras - {clienteNome}</h1>
      </div>

      <div className="hc-filters">
        <label>
          <strong>Filtrar por Status:</strong>
          <select 
            value={filtroStatus} 
            onChange={(e) => setFiltroStatus(e.target.value)}
            className="hc-select"
          >
            <option value="all">Todos</option>
            <option value="aprovado">Aprovados</option>
            <option value="entregue">Entregues</option>
            <option value="pendente">Pendentes</option>
            <option value="nao_aprovado">Não Aprovados</option>
          </select>
        </label>
      </div>

      {/* Última Compra */}
      {ultimaCompraFiltrada.length > 0 && (
        <section className="hc-section">
          <h2>📦 Última Compra</h2>
          {ultimaCompraFiltrada.map(pedido => renderPedidoCard(pedido, 'ultima'))}
        </section>
      )}

      {/* Outras Compras */}
      {outrasComprasFiltradas.length > 0 && (
        <section className="hc-section">
          <h2>🛒 Outras Compras ({outrasComprasFiltradas.length})</h2>
          {outrasComprasFiltradas.map(pedido => renderPedidoCard(pedido, 'outras'))}
        </section>
      )}

      {/* Orçamentos Não Aprovados */}
      {orcamentosFiltrados.length > 0 && (
        <section className="hc-section">
          <h2>📋 Orçamentos Não Aprovados ({orcamentosFiltrados.length})</h2>
          {orcamentosFiltrados.map(pedido => renderPedidoCard(pedido, 'orcamentos'))}
        </section>
      )}

      {ultimaCompraFiltrada.length === 0 && outrasComprasFiltradas.length === 0 && orcamentosFiltrados.length === 0 && (
        <div className="hc-empty">Nenhum pedido encontrado com os filtros selecionados.</div>
      )}
    </div>
  );
};

export default HistoricoCompras;

