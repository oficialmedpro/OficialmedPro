# CHECKPOINT - Consolidação de Dados

**Data/Hora:** 2025-10-25 13:30 UTC
**Status:** INICIANDO CONSOLIDAÇÃO

---

## O QUE FOI FEITO ATÉ AGORA

### 1. ✅ Sincronização SprintHub COMPLETA
- 76.201 leads sincronizados
- Tempo: 66 minutos
- 84.8% com WhatsApp
- 28.4% com Email

### 2. ✅ Tabela clientes_mestre CRIADA
- SQL executado: `CONSOLIDACAO_DADOS/01-criar-tabela-clientes-mestre.sql`
- Funções auxiliares criadas (normalização, chave única, qualidade)
- Índices criados para performance
- Views criadas para análise

### 3. ✅ Script de Consolidação PRONTO
- Arquivo: `consolidar-clientes.cjs`
- Mapeamentos ajustados para todas as 4 fontes
- Lógica de deduplicação implementada
- Hierarquia de qualidade configurada

---

## O QUE ESTÁ SENDO EXECUTADO AGORA

### Consolidação de ~147.500 registros

**Comando:**
```bash
node consolidar-clientes.cjs
```

**Fontes a processar (em ordem):**

1. **SprintHub (leads)** - 76.201 registros - ALTA prioridade
   - Campos: nome, email, whatsapp, cpf, rg, endereço completo
   - Tempo estimado: 8-10 minutos

2. **GreatPage (greatpage_leads)** - 27.452 registros - ALTA prioridade
   - Campos: nome, email, telefone, cidade, estado
   - Tempo estimado: 3-4 minutos

3. **BlackLabs (blacklabs)** - 6.711 registros - ALTA prioridade
   - Campos: nome, cpf, email, telefone, endereço completo
   - Tempo estimado: 1-2 minutos

4. **Prime (prime_clientes)** - 37.137 registros - BAIXA prioridade
   - Campos: nome (RUIM), cpf, email, telefone, endereço
   - Tratamento especial para nomes ruins
   - Tempo estimado: 4-5 minutos

**TEMPO TOTAL ESTIMADO: 15-25 minutos**

---

## COMO CONTINUAR SE TRAVAR

### Se o script parar no meio:

1. **Verificar onde parou:**
   ```bash
   tail -20 consolidacao.log
   ```

   Procure por linhas como:
   - `✅ Sprint: 5000 | Total: 5000 (4500 novos, 500 atualizados)`
   - `✅ SprintHub concluído: 76201 leads`
   - `📊 Processando leads do GreatPage...`

2. **O script é IDEMPOTENTE** - pode rodar novamente sem problemas:
   ```bash
   node consolidar-clientes.cjs
   ```

   Ele vai:
   - Detectar registros já consolidados
   - Atualizar dados se necessário
   - Continuar de onde parou

3. **Verificar quantos clientes foram consolidados:**
   ```bash
   node -e "
   const { createClient } = require('@supabase/supabase-js');
   require('dotenv').config();
   const supabase = createClient(
     process.env.VITE_SUPABASE_URL,
     process.env.VITE_SUPABASE_SERVICE_ROLE_KEY,
     { db: { schema: 'api' } }
   );
   supabase.from('clientes_mestre').select('count', { count: 'exact', head: true })
     .then(r => console.log('Clientes consolidados:', r.count));
   "
   ```

---

## LOGS E MONITORAMENTO

### Arquivos de Log

- **consolidacao.log** - Log detalhado da consolidação
- **sync-final.log** - Log do sync SprintHub (COMPLETO)

### Monitorar Progresso

```bash
# Ver progresso em tempo real
tail -f consolidacao.log

# Ver últimas 20 linhas
tail -20 consolidacao.log

# Contar erros
grep "❌" consolidacao.log | wc -l
```

### Estatísticas Esperadas

Após conclusão completa:

```bash
node -e "
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY,
  { db: { schema: 'api' } }
);

async function stats() {
  const { data } = await supabase.from('clientes_mestre').select('qualidade_dados, origem_marcas');
  console.log('═══════════════════════════════════════');
  console.log('Total clientes consolidados:', data.length);
  console.log('Múltiplas origens:', data.filter(c => c.origem_marcas.length > 1).length);
  console.log('Qualidade média:', (data.reduce((s,c) => s + c.qualidade_dados, 0) / data.length).toFixed(1) + '/100');
  console.log('Alta qualidade (≥80):', data.filter(c => c.qualidade_dados >= 80).length);
  console.log('═══════════════════════════════════════');
}
stats();
"
```

---

## SE DER ERRO

### Erro: "Cannot find module '@supabase/supabase-js'"
```bash
npm install
```

### Erro: "relation api.clientes_mestre does not exist"
Execute novamente:
```bash
# Via SQL Editor no Supabase
# Copiar e colar: CONSOLIDACAO_DADOS/01-criar-tabela-clientes-mestre.sql
```

### Erro: "timeout" ou "connection refused"
- Problema de conexão com Supabase
- Verificar .env (VITE_SUPABASE_URL e VITE_SUPABASE_SERVICE_ROLE_KEY)
- Verificar internet
- Rodar novamente (script retoma de onde parou)

### Script muito lento
- Normal: processa ~100-150 registros/minuto
- Deduplicação + busca em múltiplos índices leva tempo
- NÃO INTERROMPER - deixar rodar até o fim

---

## APÓS CONCLUSÃO

### Validar Dados

```sql
-- Via Supabase SQL Editor
SELECT
  COUNT(*) as total,
  COUNT(DISTINCT id_sprinthub) as sprint,
  COUNT(DISTINCT id_greatpage) as greatpage,
  COUNT(DISTINCT id_blacklabs) as blacklabs,
  COUNT(DISTINCT id_prime) as prime,
  AVG(qualidade_dados)::INTEGER as qualidade_media
FROM api.clientes_mestre;
```

### Ver Estatísticas por Origem

```sql
SELECT * FROM api.stats_clientes_por_origem;
```

### Ver Clientes de Múltiplas Fontes

```sql
SELECT * FROM api.clientes_mestre_multiplas_fontes LIMIT 10;
```

---

## ARQUIVOS IMPORTANTES

```
minha-pwa/
├── consolidar-clientes.cjs           ← Script principal (EXECUTANDO AGORA)
├── consolidacao.log                  ← Log da execução (CRIANDO AGORA)
├── sync-final.log                    ← Sync SprintHub (COMPLETO)
├── CHECKPOINT_CONSOLIDACAO.md        ← Este arquivo
├── PROXIMOS_PASSOS.md                ← Guia pós-consolidação
└── CONSOLIDACAO_DADOS/
    ├── README.md                     ← Documentação completa
    ├── 01-criar-tabela-clientes-mestre.sql
    ├── 02-script-consolidacao-template.cjs
    └── RESUMO_STATUS.md
```

---

**AÇÃO ATUAL:** Executando `node consolidar-clientes.cjs` em background (ID: f30ee6)
**PROGRESSO:** Monitore via `tail -f consolidacao.log`
**SE TRAVAR:** Rode novamente `node consolidar-clientes.cjs` (é seguro)

**CORREÇÃO FEITA:**
- Erro inicial: coluna `data_nascimento` não existia
- Corrigido para: `data_de_nascimento` (nome correto na tabela leads)
- Script reiniciado com sucesso
