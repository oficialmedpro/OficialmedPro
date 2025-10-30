// ===== FUNÇÕES DE RENDERIZAÇÃO - REATIVAÇÃO =====
// Cole estas funções dentro do componente ClientesConsolidadosPage
// Antes da função renderTabContent()

const renderDashboardReativacao = () => {
  if (!dashboardReativacaoData) return null;

  return (
    <div className="cc-dashboard-grid">
      <div className="cc-card cc-card-highlight" style={{ gridColumn: 'span 2' }}>
        <h2>📊 Dashboard de Reativação</h2>
        <p style={{marginTop: '10px', fontSize: '14px', opacity: 0.9}}>
          Sistema completo de análise e reativação de clientes
        </p>
      </div>

      <div className="cc-card">
        <h3>👥 Total Clientes Mestre</h3>
        <div className="cc-stat-value-large">{dashboardReativacaoData.total_clientes_mestre?.toLocaleString()}</div>
      </div>

      <div className="cc-card">
        <h3>🏢 Com ID Prime</h3>
        <div className="cc-stat-value-large">{dashboardReativacaoData.total_com_id_prime?.toLocaleString()}</div>
      </div>

      <div className="cc-card cc-card-warning">
        <h3>😴 Total Inativos</h3>
        <div className="cc-stat-value-large">{dashboardReativacaoData.total_inativos?.toLocaleString()}</div>
        <div style={{marginTop: '10px', fontSize: '13px'}}>
          <div>Prime: {dashboardReativacaoData.inativos_prime?.toLocaleString()}</div>
          <div>Fora: {dashboardReativacaoData.inativos_fora_prime?.toLocaleString()}</div>
        </div>
      </div>

      <div className="cc-card cc-card-complete">
        <h3>✅ Total Ativos</h3>
        <div className="cc-stat-value-large">{dashboardReativacaoData.total_ativos?.toLocaleString()}</div>
      </div>

      <div className="cc-card">
        <h3>🔄 Para Reativação (90+ dias)</h3>
        <div className="cc-stat-value-large">{dashboardReativacaoData.para_reativacao?.toLocaleString()}</div>
        <div style={{marginTop: '10px', fontSize: '13px'}}>
          <div>1x: {dashboardReativacaoData.reativacao_1x?.toLocaleString()}</div>
          <div>2x: {dashboardReativacaoData.reativacao_2x?.toLocaleString()}</div>
          <div>3x: {dashboardReativacaoData.reativacao_3x?.toLocaleString()}</div>
          <div>3+: {dashboardReativacaoData.reativacao_3x_plus?.toLocaleString()}</div>
        </div>
      </div>

      <div className="cc-card">
        <h3>👀 Para Monitoramento (0-90 dias)</h3>
        <div className="cc-stat-value-large">{dashboardReativacaoData.total_monitoramento?.toLocaleString()}</div>
        <div style={{marginTop: '10px', fontSize: '13px'}}>
          <div>🟢 1-29: {dashboardReativacaoData.monitoramento_1_29?.toLocaleString()}</div>
          <div>🟡 30-59: {dashboardReativacaoData.monitoramento_30_59?.toLocaleString()}</div>
          <div>🟠 60-90: {dashboardReativacaoData.monitoramento_60_90?.toLocaleString()}</div>
        </div>
      </div>
    </div>
  );
};

const renderValidacaoIntegridade = () => (
  <div className="cc-dashboard-grid">
    <div className="cc-card cc-card-highlight" style={{ gridColumn: 'span 2' }}>
      <h2>✅ Validação de Integridade</h2>
      <p style={{marginTop: '10px', fontSize: '14px', opacity: 0.9}}>
        Verificação entre prime_clientes e clientes_mestre
      </p>
    </div>

    <div className="cc-card" style={{ gridColumn: 'span 2' }}>
      <div className="cc-table-container">
        <table className="cc-table">
          <thead>
            <tr>
              <th>Métrica</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            {validacaoIntegridadeData.map((row, idx) => (
              <tr key={idx} className={row.total > 0 && row.metrica.includes('SEM') ? 'cc-row-warning' : ''}>
                <td>{row.metrica}</td>
                <td className="value-cell">{row.total?.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </div>
);

const renderInativosPrime = () => (
  <div className="cc-list-container">
    <div className="cc-list-header">
      <h2>😴 Clientes Inativos do Prime</h2>
      <button
        className="cc-btn cc-btn-export"
        onClick={() => exportToCSV('inativos_prime', 'vw_inativos_prime')}
        disabled={isLoading}
      >
        📥 Exportar CSV
      </button>
    </div>

    {renderClientesTable(inativosPrimeData, [
      { header: 'Nome', field: 'nome_completo' },
      { header: 'Email', field: 'email' },
      { header: 'WhatsApp', field: 'whatsapp' },
      { header: 'Telefone', field: 'telefone' },
      { header: 'CPF', field: 'cpf' },
      { 
        header: 'Tem Orçamento', 
        render: (row) => row.tem_historico_orcamento ? '✅ Sim' : '❌ Não'
      },
      {
        header: 'Último Orçamento',
        render: (row) => row.ultimo_orcamento ? new Date(row.ultimo_orcamento).toLocaleDateString('pt-BR') : '-'
      },
      { header: 'Dias Cadastrado', field: 'dias_desde_cadastro' },
      {
        header: 'Qualidade',
        render: (row) => (
          <span className={`cc-quality-badge cc-quality-${row.qualidade_dados >= 80 ? 'high' : row.qualidade_dados >= 60 ? 'medium' : 'low'}`}>
            {row.qualidade_dados}/100
          </span>
        )
      }
    ])}

    {renderPagination()}
  </div>
);

const renderInativosForaPrime = () => (
  <div className="cc-list-container">
    <div className="cc-list-header">
      <h2>🚫 Clientes Inativos Fora do Prime</h2>
      <button
        className="cc-btn cc-btn-export"
        onClick={() => exportToCSV('inativos_fora_prime', 'vw_inativos_fora_prime')}
        disabled={isLoading}
      >
        📥 Exportar CSV
      </button>
    </div>

    {renderClientesTable(inativosForaPrimeData, [
      { header: 'Nome', field: 'nome_completo' },
      { header: 'Email', field: 'email' },
      { header: 'WhatsApp', field: 'whatsapp' },
      { header: 'Telefone', field: 'telefone' },
      { header: 'CPF', field: 'cpf' },
      { header: 'Cidade', field: 'cidade' },
      { header: 'Estado', field: 'estado' },
      { header: 'Origens', render: (row) => row.origem_marcas?.join(', ') || '-' },
      { header: 'Dias Cadastrado', field: 'dias_desde_cadastro' },
      {
        header: 'Qualidade',
        render: (row) => (
          <span className={`cc-quality-badge cc-quality-${row.qualidade_dados >= 80 ? 'high' : row.qualidade_dados >= 60 ? 'medium' : 'low'}`}>
            {row.qualidade_dados}/100
          </span>
        )
      }
    ])}

    {renderPagination()}
  </div>
);

const renderInativosComOrcamento = () => (
  <div className="cc-list-container">
    <div className="cc-list-header">
      <h2>📋 Inativos com Histórico de Orçamento</h2>
      <button
        className="cc-btn cc-btn-export"
        onClick={() => exportToCSV('inativos_com_orcamento', 'vw_inativos_com_orcamento')}
        disabled={isLoading}
      >
        📥 Exportar CSV
      </button>
    </div>

    {renderClientesTable(inativosComOrcamentoData, [
      { header: 'Nome', field: 'nome_completo' },
      { header: 'Email', field: 'email' },
      { header: 'WhatsApp', field: 'whatsapp' },
      { header: 'Total Orçamentos', field: 'total_orcamentos' },
      {
        header: 'Último Orçamento',
        render: (row) => new Date(row.ultimo_orcamento).toLocaleDateString('pt-BR')
      },
      { header: 'Status Histórico', field: 'status_historico' },
      {
        header: 'Qualidade',
        render: (row) => (
          <span className={`cc-quality-badge cc-quality-${row.qualidade_dados >= 80 ? 'high' : row.qualidade_dados >= 60 ? 'medium' : 'low'}`}>
            {row.qualidade_dados}/100
          </span>
        )
      }
    ])}

    {renderPagination()}
  </div>
);

const renderInativosSemOrcamento = () => (
  <div className="cc-list-container">
    <div className="cc-list-header">
      <h2>📭 Inativos sem Histórico de Orçamento</h2>
      <button
        className="cc-btn cc-btn-export"
        onClick={() => exportToCSV('inativos_sem_orcamento', 'vw_inativos_sem_orcamento')}
        disabled={isLoading}
      >
        📥 Exportar CSV
      </button>
    </div>

    {renderClientesTable(inativosSemOrcamentoData, [
      { header: 'Nome', field: 'nome_completo' },
      { header: 'Email', field: 'email' },
      { header: 'WhatsApp', field: 'whatsapp' },
      { header: 'Telefone', field: 'telefone' },
      { header: 'CPF', field: 'cpf' },
      { header: 'Cidade', field: 'cidade' },
      { header: 'Dias Cadastrado', field: 'dias_desde_cadastro' },
      {
        header: 'Qualidade',
        render: (row) => (
          <span className={`cc-quality-badge cc-quality-${row.qualidade_dados >= 80 ? 'high' : row.qualidade_dados >= 60 ? 'medium' : 'low'}`}>
            {row.qualidade_dados}/100
          </span>
        )
      }
    ])}

    {renderPagination()}
  </div>
);

const renderClientesAtivos = () => (
  <div className="cc-list-container">
    <div className="cc-list-header">
      <h2>✅ Clientes Ativos (Já Compraram)</h2>
      <button
        className="cc-btn cc-btn-export"
        onClick={() => exportToCSV('clientes_ativos', 'vw_clientes_ativos')}
        disabled={isLoading}
      >
        📥 Exportar CSV
      </button>
    </div>

    {renderClientesTable(clientesAtivosData, [
      { header: 'Nome', field: 'nome_completo' },
      { header: 'Email', field: 'email' },
      { header: 'WhatsApp', field: 'whatsapp' },
      { header: 'Total Pedidos', field: 'total_pedidos' },
      {
        header: 'Primeira Compra',
        render: (row) => new Date(row.primeira_compra).toLocaleDateString('pt-BR')
      },
      {
        header: 'Última Compra',
        render: (row) => new Date(row.ultima_compra).toLocaleDateString('pt-BR')
      },
      { header: 'Dias Última Compra', field: 'dias_desde_ultima_compra' },
      {
        header: 'Valor Total',
        render: (row) => `R$ ${row.valor_total_compras?.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`
      }
    ])}

    {renderPagination()}
  </div>
);

const renderReativacaoGeral = () => (
  <div className="cc-list-container">
    <div className="cc-list-header">
      <h2>🔄 Para Reativação (90+ dias sem comprar)</h2>
      <button
        className="cc-btn cc-btn-export"
        onClick={() => exportToCSV('para_reativacao', 'vw_para_reativacao')}
        disabled={isLoading}
      >
        📥 Exportar CSV
      </button>
    </div>

    {renderClientesTable(reativacaoGeralData, [
      { header: 'Nome', field: 'nome_completo' },
      { header: 'Email', field: 'email' },
      { header: 'WhatsApp', field: 'whatsapp' },
      { header: 'Frequência', field: 'frequencia_compra' },
      { header: 'Total Pedidos', field: 'total_pedidos' },
      {
        header: 'Última Compra',
        render: (row) => new Date(row.ultima_compra).toLocaleDateString('pt-BR')
      },
      { header: 'Dias Sem Compra', field: 'dias_sem_compra' },
      {
        header: 'Valor Total',
        render: (row) => `R$ ${row.valor_total_compras?.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`
      }
    ])}

    {renderPagination()}
  </div>
);

// As demais funções de renderização seguem o mesmo padrão...
// Para economizar espaço, indico que as funções abaixo devem seguir a estrutura acima:
// - renderReativacao1x()
// - renderReativacao2x()
// - renderReativacao3x()
// - renderReativacao3xPlus()
// - renderMonitoramentoGeral()
// - renderMonitoramento129()
// - renderMonitoramento3059()
// - renderMonitoramento6090()

// ADICIONE ESTES CASES NO renderTabContent():
/*
case 'dashboard-reativacao': return renderDashboardReativacao();
case 'validacao-integridade': return renderValidacaoIntegridade();
case 'inativos-prime': return renderInativosPrime();
case 'inativos-fora-prime': return renderInativosForaPrime();
case 'inativos-com-orcamento': return renderInativosComOrcamento();
case 'inativos-sem-orcamento': return renderInativosSemOrcamento();
case 'clientes-ativos': return renderClientesAtivos();
case 'reativacao-geral': return renderReativacaoGeral();
// ... adicione os demais
*/

