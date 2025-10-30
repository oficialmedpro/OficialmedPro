# Próximos Passos - Consolidação de Dados

## Status Atual
- ✅ Tabela `clientes_mestre` criada no Supabase
- ✅ Script de consolidação pronto: `consolidar-clientes.cjs`
- ✅ Todas as fontes mapeadas e verificadas
- 🔄 Sincronização SprintHub em andamento (~84% completo)

---

## Quando o Sync do SprintHub Terminar (100%)

### 1. Verificar Conclusão do Sync

```bash
# Ver últimas linhas do log
tail -20 sync-final.log

# Deve mostrar algo como:
# ✅ SINCRONIZAÇÃO CONCLUÍDA!
# ⏱️  Tempo: XX min
# 📊 Total: 76183 leads
```

### 2. Executar Consolidação Completa

```bash
node consolidar-clientes.cjs
```

**O que o script vai fazer:**
- Processar ~76.000 leads do SprintHub (prioridade ALTA)
- Processar ~27.000 leads do GreatPage (prioridade ALTA)
- Processar ~6.700 leads do BlackLabs (prioridade ALTA)
- Processar ~37.000 clientes do Prime (prioridade BAIXA)
- **Total: ~148.000 registros**

**Tempo estimado:** 15-25 minutos

**Logs:**
- Console: Progresso em tempo real
- Arquivo: `consolidacao.log`

### 3. Acompanhar Execução

O script mostra progresso a cada 500 registros:
```
✅ Sprint: 500 | Total: 500 (450 novos, 50 atualizados)
✅ Sprint: 1000 | Total: 1000 (920 novos, 80 atualizados)
...
```

### 4. Validar Resultados

Após conclusão, verificar:

```bash
# Via SQL no Supabase ou terminal
psql $DATABASE_URL -c "
SELECT
  COUNT(*) as total_clientes,
  COUNT(DISTINCT id_sprinthub) as do_sprint,
  COUNT(DISTINCT id_greatpage) as do_greatpage,
  COUNT(DISTINCT id_blacklabs) as do_blacklabs,
  COUNT(DISTINCT id_prime) as do_prime,
  AVG(qualidade_dados) as qualidade_media
FROM api.clientes_mestre;
"
```

Ou via Node.js:
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
  const { data } = await supabase.from('clientes_mestre').select('*');
  console.log('Total clientes:', data.length);
  console.log('Múltiplas origens:', data.filter(c => c.origem_marcas.length > 1).length);
  console.log('Qualidade média:', (data.reduce((s,c) => s + c.qualidade_dados, 0) / data.length).toFixed(1));
}
stats();
"
```

### 5. Estatísticas Esperadas

**Deduplicação esperada:**
- ~148k registros processados
- ~90-110k clientes únicos consolidados (deduplicação de ~30-40%)
- ~20-30% com múltiplas origens

**Qualidade esperada:**
- Qualidade média: 60-70/100
- Alta qualidade (≥80): 30-40%
- Baixa qualidade (<40): 10-15%

**Campos preenchidos:**
- WhatsApp: 85-90% (SprintHub + outras fontes)
- Email: 40-50% (várias fontes)
- CPF: 50-60% (BlackLabs + Prime + Sprint)
- Nome: 95-98% (todas as fontes)
- Endereço completo: 40-50% (BlackLabs + Prime + Sprint)

---

## Troubleshooting

### Erro: "relation api.clientes_mestre does not exist"
**Solução:** Execute novamente o SQL:
```bash
psql $DATABASE_URL -f CONSOLIDACAO_DADOS/01-criar-tabela-clientes-mestre.sql
```

### Script muito lento
**Normal:** Processar 148k registros com deduplicação leva tempo
**Otimização:** O script já está otimizado com:
- Busca indexada por CPF/email/whatsapp
- Logs a cada 500 registros (não a cada 1)
- Queries otimizadas

### Muitos erros no log
**Verificar:**
1. Conexão com Supabase OK?
2. Service role key correta no .env?
3. Permissões da tabela OK?

### Consolidação parou no meio
**Retomar:**
O script é idempotente (pode rodar múltiplas vezes). Ele vai:
- Atualizar registros existentes
- Pular duplicados
- Continuar de onde parou

Basta rodar novamente:
```bash
node consolidar-clientes.cjs
```

---

## Depois da Consolidação

### Próximas melhorias (futuro):

1. **Sincronização Dinâmica**
   - Criar triggers ou Edge Functions
   - Atualizar `clientes_mestre` automaticamente quando dados mudarem

2. **Dashboard de Qualidade**
   - Visualizar distribuição de qualidade
   - Identificar dados faltantes
   - Monitorar deduplicação

3. **Enriquecimento com Oportunidades**
   - Usar tabela `oportunidade_sprint` para complementar dados
   - Adicionar histórico de compras

4. **Limpeza de Dados**
   - Corrigir nomes ruins do Prime manualmente
   - Validar CPFs
   - Normalizar endereços

---

## Arquivos Importantes

```
minha-pwa/
├── consolidar-clientes.cjs          ← Script principal
├── consolidacao.log                 ← Log da execução
├── CONSOLIDACAO_DADOS/
│   ├── README.md                    ← Documentação completa
│   ├── 01-criar-tabela-clientes-mestre.sql
│   ├── 02-script-consolidacao-template.cjs
│   └── RESUMO_STATUS.md
├── sync-final.log                   ← Log do sync SprintHub
└── PROXIMOS_PASSOS.md              ← Este arquivo
```

---

**Data:** 2025-10-25
**Status:** Aguardando conclusão do sync SprintHub para executar consolidação
