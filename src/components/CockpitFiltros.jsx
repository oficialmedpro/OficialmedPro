import React from 'react';
import './CockpitFiltros.css';

/**
 * Componente de Filtros para páginas do Cockpit
 * Exibe botões visíveis para filtrar por Funis e Vendedores
 */
const CockpitFiltros = ({ 
  funis = [], 
  vendedores = [], 
  funilSelecionado = null, 
  vendedorSelecionado = null,
  onFunilChange = () => {},
  onVendedorChange = () => {},
  labelFunil = 'Funil',
  labelVendedor = 'Vendedor',
  mostrarTodos = true,
  ocultarVendedor = false
}) => {
  return (
    <div className="cockpit-filtros">
      {/* Filtro de Funis */}
      <div className="cockpit-filtros-grupo">
        <span className="cockpit-filtros-label">{labelFunil}:</span>
        <div className="cockpit-filtros-botoes">
          {mostrarTodos && (
            <button
              className={`cockpit-filtros-botao ${funilSelecionado === null ? 'ativo' : ''}`}
              onClick={() => onFunilChange(null)}
            >
              Todos
            </button>
          )}
          {funis.map((funil) => {
            const funilId = funil.id_funil_sprint || funil.id;
            const funilNome = funil.nome_funil || funil.nome || `Funil ${funilId}`;
            const isAtivo = funilSelecionado === funilId;
            
            return (
              <button
                key={funilId}
                className={`cockpit-filtros-botao ${isAtivo ? 'ativo' : ''}`}
                onClick={() => onFunilChange(funilId)}
              >
                {funilNome}
              </button>
            );
          })}
        </div>
      </div>

      {/* Filtro de Vendedores */}
      {!ocultarVendedor && vendedores.length > 0 && (
        <div className="cockpit-filtros-grupo">
          <span className="cockpit-filtros-label">{labelVendedor}:</span>
          <div className="cockpit-filtros-botoes">
            {mostrarTodos && (
              <button
                className={`cockpit-filtros-botao ${vendedorSelecionado === null ? 'ativo' : ''}`}
                onClick={() => onVendedorChange(null)}
              >
                Todos
              </button>
            )}
            {vendedores.map((vendedor) => {
              const vendedorId = vendedor.id_sprint || vendedor.id;
              const vendedorNome = vendedor.nome || `Vendedor ${vendedorId}`;
              const isAtivo = vendedorSelecionado === vendedorId;
              
              return (
                <button
                  key={vendedorId}
                  className={`cockpit-filtros-botao ${isAtivo ? 'ativo' : ''}`}
                  onClick={() => onVendedorChange(vendedorId)}
                >
                  {vendedorNome}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default CockpitFiltros;

