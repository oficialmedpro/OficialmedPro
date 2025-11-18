## Plano De Segurança – Google Ads & Supabase

### Objetivo
Blindar os tokens do Google Ads e as credenciais do Supabase, eliminando a exposição no front-end e reorganizando o fluxo para que apenas back-end/Edge Functions manipulem secrets. Após a refatoração, gerar novos segredos e reconfigurar EasyPanel/Supabase.

---

### Etapa 1 – Refatoração de Código (Front + Edge Functions)

1. **Supabase config**
   - Remover `supabaseServiceKey` (service role) de `src/config/supabase.js`.
   - Manter apenas `anon key` para o front. A service role fica restrita a back-end/Edge Functions via `Deno.env`.
   - Garantir que `window.ENV` injete somente chaves públicas.

2. **Serviços que usam a service role**
   - Atualizar todos os services/components para chamar APIs autenticadas (Edge Function ou server) em vez de usar REST direto com a service role.
   - Principais arquivos:  
     `src/components/TopMenuBar.jsx`, `src/service/totalOportunidadesService.js`, `src/service/callixService.js`, `src/service/googleAdsApiService.js`, debug pages, etc.
   - Criar endpoints (Edge Functions) específicos quando necessário para evitar lógica sensível no cliente.

3. **Remover utilitários inseguros**
   - `public/test-credentials.html`, `src/components/credenciais_supabase_google.jsx`, scripts que exibem tokens (`update-refresh-token.sql`, backups) → excluir ou mover para repositório privado interno.

4. **Refinar Edge Function do Google Ads**
   - Confirmar que lê credenciais exclusivamente de secrets (`Deno.env`).
   - Adicionar logs mínimos e retornar erros genéricos (não logar token).

5. **Testes locais**
   - Rodar `npm run build` / `npm run dev` para garantir compatibilidade.
   - Exercitar fluxos principais (dashboard, sync) usando chaves “mock” para conferir ausência de service role.

---

### Etapa 2 – Supabase & EasyPanel

1. **Rotacionar chaves**
   - Gerar nova `service_role` key e `anon` key no Supabase.
   - Atualizar `.env` de Edge Functions/EasyPanel com a nova service role.

2. **Migrar secrets do Google Ads**
   - Armazenar `CLIENT_ID`, `CLIENT_SECRET`, `REFRESH_TOKEN`, `DEVELOPER_TOKEN`, `LOGIN_CUSTOMER_ID` somente em `supabase secrets` ou nas variáveis do EasyPanel.
   - Conferir que não existem colunas acessíveis publicamente com esses dados (aplicar RLS ou mover para tabela protegida).

3. **Atualizar RLS**
   - Revisar policies em `api.unidades` e outras tabelas para bloquear leitura de campos sensíveis via `anon` key.
   - Se necessário, criar view com campos públicos e mover dados confidenciais para tabela separada.

4. **Edge Functions**
   - Reimplantar `google-ads-api` após atualizar secrets.
   - Validar `curl https://<project>.supabase.co/functions/v1/google-ads-api/test-connection` com `Authorization: Bearer <nova service role>`.

5. **EasyPanel**
   - Atualizar variáveis de ambiente do container com as novas chaves.
   - Reiniciar a aplicação e confirmar logs sem `invalid_grant`.

---

### Etapa 3 – Rotacionar Tokens Google Ads

1. Executar fluxo OAuth novamente para gerar `refresh_token` novo (com mesmo projeto/client).
2. Atualizar secrets no Supabase/EasyPanel.
3. Testar `POST /renew-refresh-token` da Edge Function para validar que consegue pegar `access_token`.

---

### Etapa 4 – Verificações Finais

1. **Varredura no repositório**
   - Confirmar que nenhum arquivo versionado contém tokens (`git grep <trecho>`).
   - Avaliar histórico e, se necessário, reescrever (BFG/git filter-repo) ou tornar repositório privado.

2. **Teste no ambiente**
   - Acesso ao dashboard em produção → console não deve logar service key.
   - `curl` anônimo para Supabase REST não pode retornar campos `google_*`.
   - Monitorar por 24h se refresh token permanece válido.

---

### Dependências
- Chaves novas do Supabase → fornecidas após refatoração.
- Acesso ao painel Supabase para secrets/RLS (feito pelo time).
- EasyPanel para atualizar variáveis/reimplantar containers.

---

### Status / Próximos Passos
- [x] Refatoração front (service role removido do bundle, variáveis globais atualizadas)
- [x] Limpeza de arquivos inseguros
- [ ] Implementar endpoints/Edge Functions protegidos para fluxos que antes dependiam da service role
- [ ] Checklist de secrets/RLS entregue ao time
- [ ] Rotação de chaves executada
- [ ] Testes pós-implantação validados

> Após concluir cada bloco, atualizar esta lista e anexar novos tokens/URLs de teste conforme necessário.


### Inventário de Operações de Escrita Ainda no Front (10/11/2025)

| Módulo / Fluxo | Arquivos principais | Ações no banco | Observações |
| --- | --- | --- | --- |
| Autenticação e sessões | `src/components/Login.jsx`, `src/service/authService.js` | `select`, `insert`, `update` e `delete` em `api.users`, `api.user_sessions`, `api.access_logs` | Login compara hash com `bcrypt`, gera token e grava sessão/logs direto do navegador. |
| Reativação (exportações e proteção de campos) | `src/pages/reativacao/ReativacaoBasePage.jsx` | `insert` em `api.historico_exportacoes`, `upsert`/`update` em `api.campos_protegidos`, `update` em `api.clientes_mestre`, `select` privilegiado em `api.nome_validado_clientes` | Usa service client para registrar exportações, travar campos e normalizar nomes. Fluxo crítico para tagueamento manual. |
| Monitoramento (exportações) | `src/pages/monitoramento/MonitoramentoBasePage.jsx` | Mesmos padrões do módulo de reativação (`historico_exportacoes`, `campos_protegidos`, `clientes_mestre`) | Telas e componentes derivados compartilham mesmos métodos utilitários. |
| Clientes Consolidados | `src/pages/clientes-consolidados.jsx` | `insert`/`update` em `api.historico_exportacoes`, `api.nome_validado_clientes`, `api.campos_protegidos`, `api.clientes_mestre` | Regras de normalização de nomes, bloqueio de edição e exportações por tag. |
| Segmentos Automáticos | `src/service/autoSegmentsService.js`, `src/service/segmentoService.js`, `src/pages/SegmentosAutomaticosPage.jsx` | `insert`, `update`, `delete` em `api.segmento_automatico`, `api.segmento_execucao_log`, leitura de leads para Callix | Controla cadastros/edições de segmentos e execução manual; envia dados para Edge Function `process-auto-segments`. |
| Metas Comerciais | `src/service/metasService.js` | `insert`, `update` em `api.metas` | CRUD completo de metas ainda roda com anon key. |
| Ferramentas utilitárias | `src/service/insertUnidades.js`, scripts de import | Operações em `api.unidades` e correlatas | Usados pontualmente para carga; precisam virar scripts server-side. |

> Prioridade sugerida: começar por **Autenticação/Sessões**, criar Edge Function de login e gateway de writes; em seguida migrar exportações (Reativação/Monitoramento/Clientes) e, por fim, os módulos de configuração (Segmentos, Metas).



