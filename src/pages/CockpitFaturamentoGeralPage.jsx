import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './CockpitVendedores.css';
import LogoOficialmed from '../../icones/icone_oficialmed.svg';
import { 
  getFaturamentoMensal,
  getAllFunis,
  getAllVendedores,
  getMetaFaturamentoMensal
} from '../service/supabase';
import { ArrowLeft } from 'lucide-react';
import CockpitFiltros from '../components/CockpitFiltros';

const CockpitFaturamentoGeralPage = ({ onLogout }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [dadosMensais, setDadosMensais] = useState([]); // Array de { ano, mes, dados }
  const [funis, setFunis] = useState([]);
  const [vendedores, setVendedores] = useState([]);
  const [funilSelecionado, setFunilSelecionado] = useState(null);
  const [vendedorSelecionado, setVendedorSelecionado] = useState(null);
  const [anosExibir] = useState([2024, 2025]); // Anos para exibir

  useEffect(() => {
    carregarDados();
  }, [funilSelecionado, vendedorSelecionado]);

  const carregarDados = async () => {
    try {
      setLoading(true);
      
      // Buscar funis e vendedores
      const [funisData, vendedoresData] = await Promise.all([
        getAllFunis(),
        getAllVendedores()
      ]);
      
      setFunis(funisData || []);
      setVendedores(vendedoresData || []);
      
      // Buscar dados dos últimos 12 meses
      const hoje = new Date();
      const anoAtual = hoje.getFullYear();
      const mesAtual = hoje.getMonth() + 1;
      
      const mesesParaBuscar = [];
      for (let i = 11; i >= 0; i--) {
        let ano = anoAtual;
        let mes = mesAtual - i;
        while (mes <= 0) {
          mes += 12;
          ano -= 1;
        }
        mesesParaBuscar.push({ ano, mes });
      }
      
      // Buscar dados de todos os meses
      const dados = await Promise.all(
        mesesParaBuscar.map(({ ano, mes }) =>
          getFaturamentoMensal(ano, mes, funilSelecionado, vendedorSelecionado)
            .then(dados => ({ ano, mes, dados }))
            .catch(error => {
              console.error(`Erro ao buscar dados de ${ano}-${mes}:`, error);
              return { ano, mes, dados: { porFunil: {}, porVendedor: {}, total: { contagem: 0, valorTotal: 0 } } };
            })
        )
      );
      
      // Buscar metas mensais de faturamento
      const metasPromises = mesesParaBuscar.map(({ ano, mes }) => 
        getMetaFaturamentoMensal(ano, mes)
          .then(meta => ({ ano, mes, meta: meta ? meta.valor_meta : null }))
          .catch(() => ({ ano, mes, meta: null }))
      );
      const metasResults = await Promise.all(metasPromises);
      const metasMap = metasResults.reduce((acc, { ano, mes, meta }) => {
        acc[`${ano}-${mes}`] = meta;
        return acc;
      }, {});
      
      // Adicionar metas aos dados
      const dadosComMetas = dados.map(({ ano, mes, dados: dadosMes }) => {
        const metaTotal = metasMap[`${ano}-${mes}`] || 0;
        const realizado = dadosMes.total.valorTotal;
        const gap = metaTotal > 0 ? realizado - metaTotal : null;
        const porcentagemAtingimento = metaTotal > 0 ? (realizado / metaTotal) * 100 : null;
        
        return {
          ano,
          mes,
          dados: dadosMes,
          meta: metaTotal,
          gap,
          porcentagemAtingimento
        };
      });
      
      setDadosMensais(dadosComMetas);
      
    } catch (error) {
      console.error('❌ [CockpitFaturamentoGeral] Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatarMoeda = (valor) => {
    if (valor === null || valor === undefined || valor === '') return 'R$ 0,00';
    const numValor = parseFloat(valor);
    if (isNaN(numValor)) return 'R$ 0,00';
    return `R$ ${numValor.toFixed(2).replace('.', ',')}`;
  };

  const formatarPorcentagem = (valor) => {
    if (valor === null || valor === undefined) return '—';
    const numValor = parseFloat(valor);
    if (isNaN(numValor)) return '—';
    if (numValor % 1 === 0) {
      return `${numValor}%`;
    }
    return `${numValor.toFixed(1).replace('.', ',')}%`;
  };

  const getClassePorPorcentagem = (porcentagem) => {
    if (porcentagem === null || porcentagem === undefined) return '';
    if (porcentagem >= 100) return 'good';
    if (porcentagem >= 81) return 'warning-light';
    if (porcentagem >= 51) return 'warning';
    return 'bad';
  };

  const nomesMeses = [
    'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
    'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
  ];

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
            <h1 className="cockpit-vendedores-titulo">Faturamento Geral</h1>
            <div className="cockpit-vendedores-descricao">
              Comparativo mês a mês - Realizado vs Meta vs Gap
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
          </div>
        </div>

        {/* Filtros */}
        <CockpitFiltros
          funis={funis}
          vendedores={vendedores}
          funilSelecionado={funilSelecionado}
          vendedorSelecionado={vendedorSelecionado}
          onFunilChange={setFunilSelecionado}
          onVendedorChange={setVendedorSelecionado}
          labelFunil="Funil"
          labelVendedor="Vendedor"
          mostrarTodos={true}
        />

        {/* Tabela de Comparativo */}
        <div className="cockpit-vendedores-grid" style={{ gridTemplateColumns: '1fr', marginTop: '24px' }}>
          <div className="cockpit-vendedores-card">
            <div className="cockpit-vendedores-card-header">
              <h3 className="cockpit-vendedores-card-nome">Comparativo Mês a Mês</h3>
            </div>
            
            <div className="cockpit-vendedores-tabela-rondas" style={{ padding: '24px' }}>
              <table style={{ width: '100%' }}>
                <thead>
                  <tr>
                    <th>Mês/Ano</th>
                    <th>Meta</th>
                    <th>Realizado</th>
                    <th>Gap</th>
                    <th>% Atingimento</th>
                  </tr>
                </thead>
                <tbody>
                  {dadosMensais.map((item, index) => (
                    <tr key={`${item.ano}-${item.mes}`}>
                      <td>{nomesMeses[item.mes - 1]}/{item.ano}</td>
                      <td>{formatarMoeda(item.meta)}</td>
                      <td className={getClassePorPorcentagem(item.porcentagemAtingimento)}>
                        {formatarMoeda(item.dados.total.valorTotal)}
                      </td>
                      <td className={item.gap !== null && item.gap < 0 ? 'bad' : item.gap !== null && item.gap > 0 ? 'good' : ''}>
                        {item.gap !== null ? formatarMoeda(item.gap) : '—'}
                      </td>
                      <td className={getClassePorPorcentagem(item.porcentagemAtingimento)}>
                        {formatarPorcentagem(item.porcentagemAtingimento)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CockpitFaturamentoGeralPage;

