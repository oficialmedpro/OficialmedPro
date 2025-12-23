import React, { useState, useEffect, useRef } from 'react';
import './CockpitVendedores.css';
import LogoOficialmed from '../../icones/icone_oficialmed.svg';
import { getCockpitVendedoresConfig, getVendedoresPorIds } from '../service/supabase';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, SlidersHorizontal, Sun, Moon, Plus, Minus } from 'lucide-react';
import { getSupabaseConfig } from '../config/supabase.js';

const CockpitTempoJornada = ({ onLogout }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [dataSelecionada, setDataSelecionada] = useState(() => {
    const hoje = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));
    const ano = hoje.getFullYear();
    const mes = String(hoje.getMonth() + 1).padStart(2, '0');
    const dia = String(hoje.getDate()).padStart(2, '0');
    return `${ano}-${mes}-${dia}`;
  });
  const [visualizacao, setVisualizacao] = useState('geral'); // 'geral' ou 'vendedor'
  const [vendedorSelecionado, setVendedorSelecionado] = useState(null);
  const [vendedores, setVendedores] = useState([]);
  const [temposGerais, setTemposGerais] = useState({});
  const [temposPorVendedor, setTemposPorVendedor] = useState({});
  
  // Controles de tema e fonte
  const [isLightTheme, setIsLightTheme] = useState(() => {
    const saved = localStorage.getItem('cockpit-theme');
    return saved === 'light';
  });
  const [fontSize, setFontSize] = useState(() => {
    const saved = localStorage.getItem('cockpit-font-size');
    return saved || 'md';
  });
  const [showFloatingControls, setShowFloatingControls] = useState(false);
  const floatingControlsRef = useRef(null);

  // Mapeamento de funis para campos de data
  const funilParaCampos = {
    6: {
      entrada: 'entrada_compra',
      acolhimento: 'acolhimento_compra',
      qualificado: 'qualificado_compra',
      orcamento: 'orcamento_compra',
      negociacao: 'negociacao_compra',
      followUp: 'follow_up_compra',
      cadastro: 'cadastro_compra'
    },
    14: {
      entrada: 'entrada_recompra',
      acolhimento: 'acolhimento_recompra',
      qualificado: 'qualificado_recompra',
      orcamento: 'orcamento_recompra',
      negociacao: 'negociacao_recompra',
      followUp: 'follow_up_recompra',
      cadastro: 'cadastro_recompra'
    },
    33: {
      entrada: 'entrada_ativacao',
      acolhimento: 'acolhimento_ativacao',
      qualificado: 'qualificado_ativacao',
      orcamento: 'orcamento_ativacao',
      negociacao: 'negociacao_ativacao',
      followUp: 'follow_up_ativacao',
      cadastro: 'cadastro_ativacao'
    },
    41: {
      entrada: 'entrada_monitoramento',
      acolhimento: 'acolhimento_monitoramento',
      qualificado: 'qualificado_monitoramento',
      orcamento: 'orcamento_monitoramento',
      negociacao: 'negociacao_monitoramento',
      followUp: 'follow_up_monitoramento',
      cadastro: 'cadastro_monitoramento'
    },
    38: {
      entrada: 'entrada_reativacao',
      acolhimento: 'acolhimento_reativacao',
      qualificado: 'qualificado_reativacao',
      orcamento: 'orcamento_reativacao',
      negociacao: 'negociacao_reativacao',
      followUp: 'follow_up_reativacao',
      cadastro: 'cadastro_reativacao'
    }
  };

  useEffect(() => {
    const carregarDados = async () => {
      try {
        setLoading(true);
        const configs = await getCockpitVendedoresConfig();
        const configsAtivas = configs.filter(c => c.ativo);
        
        const todosIds = [...new Set(configsAtivas.map(c => c.vendedor_id_sprint))].filter(id => id !== null && id !== undefined);
        const vendedoresData = await getVendedoresPorIds(todosIds);
        setVendedores(vendedoresData);

        // Buscar oportunidades com vendas (tem cadastro ou status='gain')
        const { supabaseUrl, supabaseAnonKey } = getSupabaseConfig();
        
        // Construir query para buscar oportunidades com cadastro ou gain_date
        const funis = [6, 14, 33, 41, 38];
        let todasOportunidades = [];

        for (const funilId of funis) {
          const campos = funilParaCampos[funilId];
          if (!campos) continue;

          const selectFields = `id,user_id,funil_id,${campos.entrada},${campos.acolhimento},${campos.qualificado},${campos.orcamento},${campos.negociacao},${campos.followUp},${campos.cadastro},gain_date,status,value`;

          // Buscar oportunidades com cadastro preenchido OU status='gain'
          const url1 = `${supabaseUrl}/rest/v1/oportunidade_sprint?select=${selectFields}&funil_id=eq.${funilId}&${campos.cadastro}=not.is.null`;
          const url2 = `${supabaseUrl}/rest/v1/oportunidade_sprint?select=${selectFields}&funil_id=eq.${funilId}&status=eq.gain&gain_date=not.is.null`;

          const [res1, res2] = await Promise.all([
            fetch(url1, {
              headers: {
                'Accept': 'application/json',
                'Authorization': `Bearer ${supabaseAnonKey}`,
                'apikey': supabaseAnonKey
              }
            }),
            fetch(url2, {
              headers: {
                'Accept': 'application/json',
                'Authorization': `Bearer ${supabaseAnonKey}`,
                'apikey': supabaseAnonKey
              }
            })
          ]);

          let dados = [];
          if (res1.ok) dados = dados.concat(await res1.json());
          if (res2.ok) {
            const dados2 = await res2.json();
            const ids1 = new Set(dados.map(d => d.id));
            dados = dados.concat(dados2.filter(d => !ids1.has(d.id)));
          }

          dados.forEach(d => {
            d.funil_id = funilId;
            d.campos = campos;
          });

          todasOportunidades = todasOportunidades.concat(dados);
        }

        // Calcular tempos
        const temposGeral = calcularTempos(todasOportunidades);
        setTemposGerais(temposGeral);

        // Calcular tempos por vendedor
        const temposPorVend = {};
        todosIds.forEach(userId => {
          const oppsVendedor = todasOportunidades.filter(o => o.user_id === userId);
          if (oppsVendedor.length > 0) {
            temposPorVend[userId] = calcularTempos(oppsVendedor);
          }
        });
        setTemposPorVendedor(temposPorVend);

      } catch (error) {
        console.error('❌ [CockpitTempoJornada] Erro ao carregar dados:', error);
      } finally {
        setLoading(false);
      }
    };

    carregarDados();
  }, []);

  // Fechar menu ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (floatingControlsRef.current && !floatingControlsRef.current.contains(event.target)) {
        setShowFloatingControls(false);
      }
    };

    if (showFloatingControls) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showFloatingControls]);

  // Aplicar tema
  useEffect(() => {
    const page = document.querySelector('.cockpit-vendedores-page');
    if (isLightTheme) {
      page?.classList.add('light-theme');
      localStorage.setItem('cockpit-theme', 'light');
    } else {
      page?.classList.remove('light-theme');
      localStorage.setItem('cockpit-theme', 'dark');
    }
  }, [isLightTheme]);

  // Aplicar tamanho de fonte
  useEffect(() => {
    const page = document.querySelector('.cockpit-vendedores-page');
    if (page) {
      page.classList.remove('font-xs', 'font-sm', 'font-md', 'font-lg', 'font-xl', 'font-xxl', 'font-xxxl', 'font-xxxxl', 'font-xxxxxl');
      page.classList.add(`font-${fontSize}`);
      localStorage.setItem('cockpit-font-size', fontSize);
    }
  }, [fontSize]);

  // Handlers para controles flutuantes
  const toggleTheme = () => {
    setIsLightTheme(!isLightTheme);
  };

  const increaseFontSize = () => {
    const sizes = ['xs', 'sm', 'md', 'lg', 'xl', 'xxl', 'xxxl', 'xxxxl', 'xxxxxl'];
    const currentIndex = sizes.indexOf(fontSize);
    if (currentIndex < sizes.length - 1) {
      setFontSize(sizes[currentIndex + 1]);
    }
  };

  const decreaseFontSize = () => {
    const sizes = ['xs', 'sm', 'md', 'lg', 'xl', 'xxl', 'xxxl', 'xxxxl', 'xxxxxl'];
    const currentIndex = sizes.indexOf(fontSize);
    if (currentIndex > 0) {
      setFontSize(sizes[currentIndex - 1]);
    }
  };

  const calcularTempos = (oportunidades) => {
    const tempos = {
      entradaAcolhimento: [],
      entradaQualificacao: [],
      qualificacaoOrcamento: [],
      orcamentoNegociacao: [],
      negociacaoFollowUp: [],
      followUpCadastro: [],
      negociacaoCadastro: [],
      entradaCadastro: []
    };

    oportunidades.forEach(opp => {
      const campos = opp.campos || funilParaCampos[opp.funil_id];
      if (!campos) return;

      const entrada = opp[campos.entrada] ? new Date(opp[campos.entrada]) : null;
      const acolhimento = opp[campos.acolhimento] ? new Date(opp[campos.acolhimento]) : null;
      const qualificado = opp[campos.qualificado] ? new Date(opp[campos.qualificado]) : null;
      const orcamento = opp[campos.orcamento] ? new Date(opp[campos.orcamento]) : null;
      const negociacao = opp[campos.negociacao] ? new Date(opp[campos.negociacao]) : null;
      const followUp = opp[campos.followUp] ? new Date(opp[campos.followUp]) : null;
      const cadastro = opp[campos.cadastro] ? new Date(opp[campos.cadastro]) : null;
      const gainDate = opp.gain_date ? new Date(opp.gain_date) : null;
      const dataCadastro = cadastro || gainDate;

      // Entrada → Acolhimento
      if (entrada && acolhimento) {
        const diff = (acolhimento - entrada) / (1000 * 60 * 60); // horas
        if (diff > 0 && diff < 720) tempos.entradaAcolhimento.push(diff); // max 30 dias
      }

      // Entrada → Qualificação
      if (entrada && qualificado) {
        const diff = (qualificado - entrada) / (1000 * 60 * 60);
        if (diff > 0 && diff < 720) tempos.entradaQualificacao.push(diff);
      }

      // Qualificação → Orçamento
      if (qualificado && orcamento) {
        const diff = (orcamento - qualificado) / (1000 * 60 * 60);
        if (diff > 0 && diff < 720) tempos.qualificacaoOrcamento.push(diff);
      }

      // Orçamento → Negociação
      if (orcamento && negociacao) {
        const diff = (negociacao - orcamento) / (1000 * 60 * 60);
        if (diff > 0 && diff < 720) tempos.orcamentoNegociacao.push(diff);
      }

      // Negociação → Follow-up
      if (negociacao && followUp) {
        const diff = (followUp - negociacao) / (1000 * 60 * 60);
        if (diff > 0 && diff < 720) tempos.negociacaoFollowUp.push(diff);
      }

      // Follow-up → Cadastro
      if (followUp && dataCadastro) {
        const diff = (dataCadastro - followUp) / (1000 * 60 * 60);
        if (diff > 0 && diff < 720) tempos.followUpCadastro.push(diff);
      }

      // Negociação → Cadastro
      if (negociacao && dataCadastro) {
        const diff = (dataCadastro - negociacao) / (1000 * 60 * 60);
        if (diff > 0 && diff < 720) tempos.negociacaoCadastro.push(diff);
      }

      // Entrada → Cadastro (jornada completa)
      if (entrada && dataCadastro) {
        const diff = (dataCadastro - entrada) / (1000 * 60 * 60);
        if (diff > 0 && diff < 2160) tempos.entradaCadastro.push(diff); // max 90 dias
      }
    });

    // Calcular médias
    const calcularMedia = (arr) => {
      if (arr.length === 0) return null;
      const soma = arr.reduce((a, b) => a + b, 0);
      return soma / arr.length;
    };

    return {
      entradaAcolhimento: calcularMedia(tempos.entradaAcolhimento),
      entradaQualificacao: calcularMedia(tempos.entradaQualificacao),
      qualificacaoOrcamento: calcularMedia(tempos.qualificacaoOrcamento),
      orcamentoNegociacao: calcularMedia(tempos.orcamentoNegociacao),
      negociacaoFollowUp: calcularMedia(tempos.negociacaoFollowUp),
      followUpCadastro: calcularMedia(tempos.followUpCadastro),
      negociacaoCadastro: calcularMedia(tempos.negociacaoCadastro),
      entradaCadastro: calcularMedia(tempos.entradaCadastro),
      totalOportunidades: oportunidades.length
    };
  };

  const formatarTempo = (horas) => {
    if (!horas || horas === null || horas === undefined) return '—';
    if (horas < 24) return `${horas.toFixed(1).replace('.', ',')}h`;
    const dias = Math.floor(horas / 24);
    const horasRestantes = horas % 24;
    if (horasRestantes < 1) return `${dias}d`;
    return `${dias}d ${horasRestantes.toFixed(0)}h`;
  };

  // Calcular porcentagem de comparação (menor tempo = melhor)
  // Se o vendedor tem menos tempo que o geral, ele está melhor (porcentagem > 100%)
  // Se tem mais tempo, está pior (porcentagem < 100%)
  const calcularPorcentagemComparativo = (tempoVendedor, tempoGeral) => {
    if (!tempoVendedor || !tempoGeral || tempoVendedor === null || tempoGeral === null || tempoGeral === 0) return null;
    // tempoGeral / tempoVendedor * 100
    // Exemplo: geral = 41h, vendedor = 23h → 41/23 * 100 = 178% (melhor)
    // Exemplo: geral = 23h, vendedor = 41h → 23/41 * 100 = 56% (pior)
    const porcentagem = (tempoGeral / tempoVendedor) * 100;
    return porcentagem;
  };

  // Obter classe de cor baseada na porcentagem (invertido - menor tempo = melhor)
  const getClasseTempoComparativo = (porcentagem) => {
    if (porcentagem === null || porcentagem === undefined) return '';
    // >= 100% significa que o vendedor está melhor (tempo menor)
    if (porcentagem >= 100) return 'good'; // Verde - melhor que geral
    if (porcentagem >= 81) return 'warning-light'; // Amarelo claro - próximo do geral
    if (porcentagem >= 51) return 'warning'; // Laranja - pior que geral
    return 'bad'; // Vermelho - muito pior que geral
  };

  const formatarPorcentagemComparativo = (porcentagem) => {
    if (porcentagem === null || porcentagem === undefined) return '—';
    const porcentagemFormatada = porcentagem % 1 === 0 ? porcentagem.toString() : porcentagem.toFixed(1).replace('.', ',');
    return `${porcentagemFormatada}%`;
  };

  const temposExibicao = visualizacao === 'geral' ? temposGerais : (vendedorSelecionado ? temposPorVendedor[vendedorSelecionado] : {});

  // Função auxiliar para renderizar métrica de tempo com comparativo
  const renderizarMetricaTempo = (label, campo, descricao = '') => {
    const tempoExibicao = temposExibicao[campo];
    const tempoGeral = temposGerais[campo];
    const mostrarComparativo = visualizacao === 'vendedor' && tempoGeral && tempoExibicao;

    if (mostrarComparativo) {
      const porcentagem = calcularPorcentagemComparativo(tempoExibicao, tempoGeral);
      const classe = getClasseTempoComparativo(porcentagem);
      return (
        <div className="cockpit-vendedores-metrica">
          <div className="cockpit-vendedores-metrica-label">{label}</div>
          <div className="cockpit-vendedores-metrica-valor">
            <div className="cockpit-vendedores-metrica-row-meta">
              <span className="cockpit-vendedores-metrica-meta-label">Geral:</span>
              <span className="cockpit-vendedores-metrica-meta">{formatarTempo(tempoGeral)}</span>
            </div>
            <div className="cockpit-vendedores-metrica-row-real">
              <span className="cockpit-vendedores-metrica-real-label">Vendedor:</span>
              <span className={`cockpit-vendedores-metrica-real ${classe}`}>
                {formatarTempo(tempoExibicao)}
              </span>
            </div>
            <div className="cockpit-vendedores-metrica-row-diff">
              <span className={`cockpit-vendedores-metrica-variacao ${classe}`}>
                {formatarPorcentagemComparativo(porcentagem)} vs Geral
              </span>
            </div>
          </div>
        </div>
      );
    } else {
      return (
        <div className="cockpit-vendedores-metrica">
          <div className="cockpit-vendedores-metrica-label">{label}</div>
          <div className="cockpit-vendedores-metrica-valor">
            <div className="cockpit-vendedores-metrica-row-real">
              <span className="cockpit-vendedores-metrica-real" style={{ fontSize: '28px' }}>
                {formatarTempo(tempoExibicao)}
              </span>
            </div>
            {descricao && (
              <div className="cockpit-vendedores-metrica-row-diff">
                <span className="cockpit-vendedores-metrica-variacao">{descricao}</span>
              </div>
            )}
          </div>
        </div>
      );
    }
  };

  if (loading) {
    return (
      <div className="cockpit-vendedores-page">
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <div>Carregando...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="cockpit-vendedores-page">
      <div className="cockpit-vendedores-container">
        <div className="cockpit-vendedores-header">
          <div className="cockpit-vendedores-header-left">
            <img src={LogoOficialmed} alt="OficialMed" className="cockpit-vendedores-logo" />
          </div>
          <div className="cockpit-vendedores-header-center">
            <h1 className="cockpit-vendedores-titulo">Tempo da Jornada</h1>
            <div className="cockpit-vendedores-descricao">
              Tempo médio entre as etapas da jornada do cliente
            </div>
          </div>
          <div className="cockpit-vendedores-header-right">
            <button
              className="cockpit-vendedores-header-btn"
              onClick={() => navigate('/cockpit-vendedores')}
            >
              <ArrowLeft size={16} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
              Voltar
            </button>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <button
                className={`cockpit-vendedores-header-btn ${visualizacao === 'geral' ? 'active' : ''}`}
                onClick={() => setVisualizacao('geral')}
              >
                Geral
              </button>
              <button
                className={`cockpit-vendedores-header-btn ${visualizacao === 'vendedor' ? 'active' : ''}`}
                onClick={() => setVisualizacao('vendedor')}
              >
                Por Vendedor
              </button>
            </div>
          </div>
        </div>

        {visualizacao === 'vendedor' && (
          <div style={{ marginBottom: '20px', padding: '0 24px' }}>
            <select
              value={vendedorSelecionado || ''}
              onChange={(e) => setVendedorSelecionado(e.target.value || null)}
              style={{
                padding: '8px 12px',
                backgroundColor: 'var(--card-soft)',
                border: '1px solid var(--border)',
                borderRadius: '6px',
                color: 'var(--text)',
                fontSize: '14px',
                cursor: 'pointer'
              }}
            >
              <option value="">Selecione um vendedor</option>
              {vendedores.map(v => (
                <option key={v.id_sprint} value={v.id_sprint}>
                  {v.nome}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="cockpit-vendedores-grid" style={{ gridTemplateColumns: '1fr' }}>
          <div className="cockpit-vendedores-card">
            <div className="cockpit-vendedores-card-header">
              <h3 className="cockpit-vendedores-card-nome">
                {visualizacao === 'geral' ? 'Tempos Gerais' : (vendedorSelecionado ? vendedores.find(v => v.id_sprint === parseInt(vendedorSelecionado))?.nome || 'Vendedor' : 'Selecione um vendedor')}
              </h3>
            </div>

            <div className="cockpit-vendedores-metricas-gerais" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
              <div className="cockpit-vendedores-metrica">
                <div className="cockpit-vendedores-metrica-label">Jornada Completa</div>
                <div className="cockpit-vendedores-metrica-valor">
                  {visualizacao === 'vendedor' && temposGerais.entradaCadastro && temposExibicao.entradaCadastro ? (
                    <>
                      <div className="cockpit-vendedores-metrica-row-meta">
                        <span className="cockpit-vendedores-metrica-meta-label">Geral:</span>
                        <span className="cockpit-vendedores-metrica-meta">{formatarTempo(temposGerais.entradaCadastro)}</span>
                      </div>
                      <div className="cockpit-vendedores-metrica-row-real">
                        <span className="cockpit-vendedores-metrica-real-label">Vendedor:</span>
                        <span className={`cockpit-vendedores-metrica-real ${getClasseTempoComparativo(calcularPorcentagemComparativo(temposExibicao.entradaCadastro, temposGerais.entradaCadastro))}`}>
                          {formatarTempo(temposExibicao.entradaCadastro)}
                        </span>
                      </div>
                      <div className="cockpit-vendedores-metrica-row-diff">
                        <span className={`cockpit-vendedores-metrica-variacao ${getClasseTempoComparativo(calcularPorcentagemComparativo(temposExibicao.entradaCadastro, temposGerais.entradaCadastro))}`}>
                          {formatarPorcentagemComparativo(calcularPorcentagemComparativo(temposExibicao.entradaCadastro, temposGerais.entradaCadastro))} vs Geral
                        </span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="cockpit-vendedores-metrica-row-real">
                        <span className="cockpit-vendedores-metrica-real" style={{ fontSize: '28px' }}>
                          {formatarTempo(temposExibicao.entradaCadastro)}
                        </span>
                      </div>
                      <div className="cockpit-vendedores-metrica-row-diff">
                        <span className="cockpit-vendedores-metrica-variacao">Entrada → Cadastro</span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {renderizarMetricaTempo('Entrada → Acolhimento', 'entradaAcolhimento')}
              {renderizarMetricaTempo('Entrada → Qualificação', 'entradaQualificacao')}
              {renderizarMetricaTempo('Qualificação → Orçamento', 'qualificacaoOrcamento')}
              {renderizarMetricaTempo('Orçamento → Negociação', 'orcamentoNegociacao')}
              {renderizarMetricaTempo('Negociação → Follow-up', 'negociacaoFollowUp')}
              {renderizarMetricaTempo('Follow-up → Cadastro', 'followUpCadastro')}
              {renderizarMetricaTempo('Negociação → Cadastro', 'negociacaoCadastro')}
            </div>
          </div>
        </div>
      </div>

      {/* Controle Flutuante */}
      <div className="cockpit-vendedores-floating-controls" ref={floatingControlsRef}>
        <button
          className="cockpit-vendedores-floating-controls-toggle"
          onClick={() => setShowFloatingControls(!showFloatingControls)}
          aria-label="Abrir controles"
        >
          <SlidersHorizontal size={18} />
        </button>
        {showFloatingControls && (
          <div className="cockpit-vendedores-floating-controls-menu">
            <button
              className="cockpit-vendedores-floating-controls-option"
              onClick={toggleTheme}
              aria-label={isLightTheme ? 'Alternar para tema escuro' : 'Alternar para tema claro'}
            >
              {isLightTheme ? <Moon size={18} /> : <Sun size={18} />}
            </button>
            <button
              className="cockpit-vendedores-floating-controls-option"
              onClick={increaseFontSize}
              disabled={fontSize === 'xxxxxl'}
              aria-label="Aumentar tamanho da fonte"
            >
              <Plus size={18} />
            </button>
            <button
              className="cockpit-vendedores-floating-controls-option"
              onClick={decreaseFontSize}
              disabled={fontSize === 'xs'}
              aria-label="Diminuir tamanho da fonte"
            >
              <Minus size={18} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CockpitTempoJornada;

