# 🎯 Sistema de Segmentos Automáticos - Documentação Completa

## 📋 Visão Geral

O sistema de segmentos automáticos permite configurar e executar segmentações de leads de forma automatizada, com integração direta ao Callix para envio de campanhas de marketing.

## 🚀 Funcionalidades Implementadas

### ✅ 1. Botão "Executar Agora" Individual
- **Localização**: Página de Segmentos Automáticos (`/segmentos-automaticos`)
- **Funcionalidade**: Cada segmento possui um botão para execução imediata
- **Feedback**: Mostra status de execução em tempo real
- **Validação**: Verifica se segmento está ativo antes de executar

### ✅ 2. Sistema de Logs Melhorado
- **Monitor Cron Jobs**: Agora inclui logs de segmentos automáticos
- **Indicadores Visuais**: Ícones diferentes para cron jobs (⏰) e segmentos (🎯)
- **Logs Detalhados**: Inclui leads processados, enviados para Callix, tempo de execução
- **Filtros**: Por status (sucesso, erro, executando)

### ✅ 3. Execução Automática na Primeira Configuração
- **Trigger**: Quando um segmento é criado e ativado
- **Cálculo**: Próxima execução baseada na frequência configurada
- **Flexibilidade**: Frequência configurável (padrão: 2 horas)

### ✅ 4. Status Melhorado e Feedback Visual
- **Badges de Status**: Ativo/Inativo com cores e ícones
- **Estatísticas**: Total de leads, enviados para Callix
- **Próxima Execução**: Calculada automaticamente
- **Progresso**: Indicadores visuais de execução

### ✅ 5. API de Execução Imediata
- **Endpoint**: `POST /api/segmentos/executar`
- **Funcionalidades**:
  - Executar segmento específico
  - Executar todos os segmentos ativos
  - Integração com Callix
  - Logs detalhados de execução

## 🏗️ Arquitetura do Sistema

### 📁 Estrutura de Arquivos

```
src/
├── pages/
│   └── SegmentosAutomaticosPage.jsx     # Página principal de segmentos
├── components/
│   └── CronJobMonitor.jsx               # Monitor melhorado com logs de segmentos
├── service/
│   └── segmentoService.js               # Serviço para operações de segmentos
├── documentacao/
│   ├── criar_tabelas_segmentos_automaticos.sql  # Estrutura do banco
│   └── SISTEMA_SEGMENTOS_AUTOMATICOS.md         # Esta documentação
└── api/
    └── segmentos-executar.js            # Endpoint da API
```

### 🗄️ Estrutura do Banco de Dados

#### Tabelas Principais:
1. **`api.segmento_automatico`** - Configurações dos segmentos
2. **`api.segmento_execucao_log`** - Logs de execução
3. **`api.segmento_lead`** - Histórico de leads processados

#### Views:
1. **`api.vw_segmento_status`** - Status dos segmentos
2. **`api.vw_logs_execucao`** - Logs combinados (cron + segmentos)

## 🎮 Como Usar

### 1. Acessar o Sistema
- Navegue para **Ferramentas > Segmentos Automáticos**
- Ou acesse diretamente: `/segmentos-automaticos`

### 2. Configurar um Segmento
1. Clique em **"Novo Segmento Automático"**
2. Preencha os dados:
   - Nome do segmento
   - Chave do segmento (única)
   - Descrição
   - Critérios (JSON)
   - Frequência de execução
   - Integração com Callix (opcional)

### 3. Executar Segmentos
- **Individual**: Clique em "Executar Agora" no segmento desejado
- **Todos**: Use o botão "Executar Todos Agora" no topo da página
- **Automática**: Configure a frequência e deixe executar automaticamente

### 4. Monitorar Execuções
- Acesse **Ferramentas > Monitor Cron Jobs**
- Veja logs detalhados de execução
- Filtre por status ou tipo (cron/segmento)

## 🔧 Configurações Técnicas

### Variáveis de Ambiente Necessárias
```env
VITE_SUPABASE_URL=sua_url_do_supabase
VITE_SUPABASE_SERVICE_ROLE_KEY=sua_chave_service_role
VITE_CALLIX_API_TOKEN=seu_token_do_callix
```

### Configuração do Callix
- **URL Base**: `https://oficialmed.callix.com.br/api/v1`
- **Endpoint**: `/campaign_contacts_async`
- **Formato**: JSON API v1.0
- **Autenticação**: Bearer Token

## 📊 Exemplo de Uso da API

### Executar Segmento Específico
```javascript
const response = await fetch('/api/segmentos/executar', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    segmento_id: 1,
    executar_agora: true
  })
});

const result = await response.json();
console.log(result);
// {
//   success: true,
//   leads_processados: 150,
//   enviados_callix: 120,
//   tempo_execucao: 45,
//   message: "Segmento executado com sucesso!"
// }
```

### Executar Todos os Segmentos
```javascript
const response = await fetch('/api/segmentos/executar', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    executar_todos: true
  })
});
```

## 🎯 Exemplo de Configuração de Segmento

```json
{
  "nome": "REATIVAÇÃO 13-10",
  "segmento_key": "reativacao_13_10",
  "descricao": "Segmento de reativação de clientes inativos há mais de 13 meses",
  "criterios": {
    "recencia_minima": 13,
    "valor_minimo": 1000,
    "status": "hibernando"
  },
  "ativo": true,
  "frequencia_horas": 2,
  "enviar_callix": true,
  "lista_callix_id": 22
}
```

## 🔄 Fluxo de Execução

1. **Trigger**: Usuário clica "Executar Agora" ou execução automática
2. **Validação**: Verifica se segmento está ativo
3. **Log**: Cria log de execução com status "running"
4. **Busca**: Busca leads baseado nos critérios do segmento
5. **Processamento**: Processa leads encontrados
6. **Callix**: Envia para Callix (se configurado)
7. **Atualização**: Atualiza estatísticas do segmento
8. **Log Final**: Atualiza log com resultado final

## 📈 Monitoramento e Logs

### Tipos de Logs
- **Cron Jobs**: ⏰ Sincronizações automáticas
- **Segmentos**: 🎯 Execuções de segmentos

### Status Possíveis
- **running**: Executando
- **success**: Sucesso
- **error**: Erro

### Informações Registradas
- Tempo de início e fim
- Duração da execução
- Número de leads processados
- Número de leads enviados para Callix
- Mensagens de erro (se houver)
- Detalhes adicionais (JSON)

## 🚨 Tratamento de Erros

### Erros Comuns
1. **Segmento não encontrado**: Verificar se ID existe
2. **Segmento inativo**: Ativar segmento antes de executar
3. **Erro no Callix**: Verificar token e configurações
4. **Rate limit**: Aguardar antes de nova execução

### Logs de Erro
- Todos os erros são registrados nos logs
- Incluem mensagem de erro e detalhes
- Status marcado como "error"
- Timestamp de quando ocorreu o erro

## 🔮 Próximas Melhorias

### Funcionalidades Planejadas
- [ ] Editor visual de critérios de segmento
- [ ] Templates de segmentos pré-configurados
- [ ] Relatórios de performance por segmento
- [ ] Notificações por email/Slack
- [ ] Dashboard de métricas em tempo real
- [ ] A/B testing de segmentos
- [ ] Integração com outras ferramentas de marketing

### Melhorias Técnicas
- [ ] Cache de resultados de segmentos
- [ ] Execução paralela de segmentos
- [ ] Retry automático em caso de erro
- [ ] Métricas de performance detalhadas
- [ ] API de webhooks para integrações

## 📞 Suporte

Para dúvidas ou problemas:
1. Verifique os logs no Monitor Cron Jobs
2. Consulte esta documentação
3. Verifique as configurações do banco de dados
4. Teste a integração com Callix

---

**Sistema implementado com sucesso! 🎉**

Todas as funcionalidades solicitadas foram implementadas e estão prontas para uso.

