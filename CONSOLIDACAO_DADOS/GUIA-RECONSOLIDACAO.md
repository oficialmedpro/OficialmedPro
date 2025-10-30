# 🔄 GUIA DE RECONSOLIDAÇÃO DE DADOS

## 📋 Ordem de Execução

Execute os scripts nesta ordem exata no **Supabase SQL Editor**:

---

### **PASSO 1: Atualizar a Função de Consolidação** ✅ (JÁ FEITO)

**Arquivo:** `03-triggers-consolidacao-automatica.sql`

**Status:** ✅ Você já executou este script

**O que faz:**
- Atualiza a função `consolidar_cliente_automatico()` com a nova lógica
- **Sprint/Prime** → SOBRESCREVEM dados (fontes autoritativas)
- **GreatPage/BlackLabs** → APENAS enriquecem vazios

---

### **PASSO 2: Reconsolidar TODOS os Dados Existentes**

**Arquivo:** `reconsolidar-todos-dados.sql`

**⏱️ Tempo estimado:** 5-15 minutos (dependendo do volume)

**O que faz:**
1. Força UPDATE em TODOS os registros do Prime (prioridade)
2. Força UPDATE em TODOS os registros do SprintHub (prioridade)
3. Força UPDATE em TODOS os registros do GreatPage (enriquecimento)
4. Força UPDATE em TODOS os registros do BlackLabs (enriquecimento)

**Resultado esperado:**
```
🔄 INICIANDO RECONSOLIDAÇÃO DE TODOS OS DADOS...
================================================

📊 TOTAL DE REGISTROS:
   - Prime: 37472 clientes
   - SprintHub: XXXX leads
   - GreatPage: XXXX leads
   - BlackLabs: XXXX registros

🔵 ETAPA 1/4: Reconsolidando PRIME CLIENTES...
   ✅ 37472 registros do Prime reconsolidados

🟢 ETAPA 2/4: Reconsolidando SPRINTHUB LEADS...
   ✅ XXXX registros do SprintHub reconsolidados

🟡 ETAPA 3/4: Reconsolidando GREATPAGE LEADS...
   ✅ XXXX registros do GreatPage reconsolidados

🟠 ETAPA 4/4: Reconsolidando BLACKLABS...
   ✅ XXXX registros do BlackLabs reconsolidados

================================================
✅ RECONSOLIDAÇÃO CONCLUÍDA COM SUCESSO!

📊 ESTATÍSTICAS FINAIS DA CLIENTES_MESTRE:
   - Total: XXXXX clientes
   - Com email: XXXX (XX.X%)
   - Com whatsapp: XXXX (XX.X%)
   - Com CPF: XXXX (XX.X%)
```

---

### **PASSO 3: Testar se os Triggers Estão Funcionando**

**Arquivo:** `testar-triggers-funcionando.sql`

**⏱️ Tempo estimado:** < 1 minuto

**O que faz:**
1. Cria um cliente de teste no Prime
2. Verifica se foi consolidado automaticamente
3. Tenta sobrescrever com GreatPage (não deve permitir)
4. Testa atualização no Prime (deve funcionar)
5. Testa enriquecimento de campos vazios (deve funcionar)
6. Remove dados de teste

**Resultado esperado:**
```
🧪 INICIANDO TESTES DOS TRIGGERS...
==================================

📝 TESTE 1: Inserir cliente no PRIME
   ✅ Cliente consolidado automaticamente na clientes_mestre (ID: XXXX)
   ✅ Trigger de INSERT no Prime está FUNCIONANDO

📝 TESTE 2: Tentar sobrescrever com GreatPage (NÃO DEVE PERMITIR)
   ✅ Email do Prime foi PRESERVADO (não sobrescrito por GreatPage)
   ✅ Lógica de prioridade está FUNCIONANDO

📝 TESTE 3: Atualizar dados no PRIME (DEVE SOBRESCREVER)
   ✅ Email foi ATUALIZADO na clientes_mestre
   ✅ Trigger de UPDATE no Prime está FUNCIONANDO

📝 TESTE 4: GreatPage deve ENRIQUECER campos VAZIOS
   ✅ Email foi ENRIQUECIDO pelo GreatPage
   ✅ Lógica de enriquecimento está FUNCIONANDO

🧹 Limpando dados de teste...
   ✅ Dados de teste removidos

==================================
✅ TESTES CONCLUÍDOS!

📋 RESUMO:
   - Triggers estão funcionando
   - Prioridade Prime/Sprint está correta
   - Enriquecimento GreatPage/BlackLabs está correto

🎯 Sistema pronto para uso!
```

---

### **PASSO 4: Verificar Melhoria nos Dados**

**Arquivo:** `query5-comparacao-tabelas.sql` (já existe)

Execute novamente para ver a diferença:

**ANTES da reconsolidação:**
- Telefones: 33,138 → 31,934 (PERDA de 1,204)
- CPFs: 6,981 → 5,706 (PERDA de 1,275)
- Endereços: 7,894 → 7,713 (PERDA de 181)

**DEPOIS da reconsolidação (esperado):**
- Telefones: ≥ 33,138 (SEM perda)
- CPFs: ≥ 6,981 (SEM perda)
- Endereços: ≥ 7,894 (SEM perda)

---

## 🎯 Checklist de Execução

- [ ] **Passo 1:** Atualizar função de consolidação ✅ (JÁ FEITO)
- [ ] **Passo 2:** Executar `reconsolidar-todos-dados.sql`
- [ ] **Passo 3:** Executar `testar-triggers-funcionando.sql`
- [ ] **Passo 4:** Executar `query5-comparacao-tabelas.sql` para validar

---

## ⚠️ IMPORTANTE

- Execute no horário de **menor movimento** (madrugada/manhã cedo)
- A reconsolidação vai disparar todos os triggers
- Pode levar alguns minutos dependendo do volume
- **NÃO INTERROMPA** o processo no meio

---

## 🆘 Em Caso de Erro

Se algo der errado durante a reconsolidação:

1. Anote a mensagem de erro
2. Execute este comando para verificar logs:
   ```sql
   SELECT * FROM pg_stat_activity
   WHERE state != 'idle'
   ORDER BY query_start DESC;
   ```
3. Me envie o erro e vamos corrigir

---

## 📊 Resultado Final Esperado

Após a reconsolidação:

✅ **Emails:** Mantém os +6,829 enriquecidos do GreatPage/BlackLabs
✅ **Telefones:** SEM perda (mantém 33,138 do Prime)
✅ **CPFs:** SEM perda (mantém 6,981 do Prime)
✅ **Endereços:** SEM perda (mantém 7,894 do Prime)
✅ **Sexo:** Mantém os +4,863 enriquecidos

🎯 **Resultado:** Melhor dos dois mundos - dados autoritativos preservados + enriquecimento de outras fontes!
