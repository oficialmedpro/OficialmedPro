# Importação de Leads Greatpages para Supabase

Este projeto contém scripts para importar todos os leads das planilhas Greatpages para uma tabela no Supabase.

## 📋 Arquivos Incluídos

- `create_greatpage_leads_table.sql` - SQL para criar a tabela no Supabase
- `import-greatpage-leads.js` - Script principal de importação
- `package-greatpage-import.json` - Dependências do Node.js
- `env-greatpage-example.txt` - Exemplo de configuração do .env
- `setup-greatpage-import.bat` - Script de instalação (Windows)
- `setup-greatpage-import.sh` - Script de instalação (Linux/Mac)

## 🚀 Configuração

### 1. Instalar Dependências

**Windows:**
```bash
setup-greatpage-import.bat
```

**Linux/Mac:**
```bash
chmod +x setup-greatpage-import.sh
./setup-greatpage-import.sh
```

**Ou manualmente:**
```bash
npm install @supabase/supabase-js csv-parser dotenv
```

### 2. Configurar Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto com:

```env
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_ANON_KEY=sua-chave-anonima-aqui
```

### 3. Criar Tabela no Supabase

Execute o SQL `create_greatpage_leads_table.sql` no schema `api` do seu Supabase:

```sql
-- Execute todo o conteúdo do arquivo create_greatpage_leads_table.sql
```

## 📊 Estrutura da Tabela

A tabela `api.greatpage_leads` contém os seguintes campos:

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | BIGSERIAL | Chave primária |
| `nome_completo` | TEXT | Nome completo do lead |
| `email` | TEXT | Email (obrigatório) |
| `telefone` | TEXT | Telefone |
| `politicas_privacidade` | BOOLEAN | Aceitou políticas de privacidade |
| `referral_source` | TEXT | Fonte de tráfego (Google, Facebook, etc.) |
| `dispositivo` | TEXT | Mobile/Desktop |
| `url` | TEXT | URL da landing page |
| `ip_usuario` | TEXT | IP do usuário |
| `data_conversao` | TIMESTAMP | Data da conversão |
| `id_formulario` | TEXT | ID do formulário no Greatpages |
| `pais_usuario` | TEXT | País (padrão: BR) |
| `regiao_usuario` | TEXT | Região |
| `cidade_usuario` | TEXT | Cidade |
| `planilha_tag` | TEXT | Tag da planilha (ex: oms_maringa) |
| `arquivo_origem` | TEXT | Nome do arquivo CSV original |
| `created_at` | TIMESTAMP | Data de criação no banco |
| `updated_at` | TIMESTAMP | Data de atualização |

## 🏷️ Tags das Planilhas

O sistema mapeia automaticamente as pastas para tags:

- `OficialMed Franchising` → `oficialmed_franchising`
- `OficialMed Franchising - Atualizado` → `oficialmed_franchising_atualizado`
- `OMS_Apucarana` → `oms_apucarana`
- `OMS_Curitiba` → `oms_curitiba`
- `OMS_Goiania` → `oms_goiania`
- `OMS_Itapetinga` → `oms_itapetinga`
- `OMS_Maringa` → `oms_maringa`
- `OMS_Ponta_Grossa` → `oms_ponta_grossa`
- `OMS_Rio do Sul` → `oms_rio_do_sul`
- `LP01 - Rio Preto CTA01` → `lp01_rio_preto_cta01`
- `LP01 - Rio Preto CTA02` → `lp01_rio_preto_cta02`
- `LP02 - Rio Preto CTA01` → `lp02_rio_preto_cta01`
- `Facebook` → `facebook`
- `Apucarana_OFM` → `apucarana_ofm`
- `Pedido de Manipulado` → `pedido_manipulado`

## 🔧 Uso

### Importar Todas as Planilhas

```bash
node import-greatpage-leads.js
```

### Importar Pasta Específica

```bash
node import-greatpage-leads.js "OMS_Maringa"
node import-greatpage-leads.js "Facebook"
node import-greatpage-leads.js "OficialMed Franchising"
```

## 📈 Estatísticas

- **Total de leads**: ~23.825 leads
- **Maior volume**: OMS_Apucarana (~9.135 leads)
- **Segundo maior**: OMS_Ponta_Grossa (~8.890 leads)
- **Menor volume**: Facebook (6 leads)

## ⚠️ Observações Importantes

1. **Duplicatas**: O script usa `upsert` com chave única `(email, planilha_tag)` para evitar duplicatas
2. **Validação**: Apenas leads com email válido são importados
3. **Performance**: O script inclui pausas entre inserções para não sobrecarregar o Supabase
4. **Logs**: O script mostra progresso detalhado durante a importação

## 🔍 Consultas Úteis

Após a importação, você pode consultar os dados:

```sql
-- Total de leads por planilha
SELECT planilha_tag, COUNT(*) as total_leads 
FROM api.greatpage_leads 
GROUP BY planilha_tag 
ORDER BY total_leads DESC;

-- Leads por cidade
SELECT cidade_usuario, COUNT(*) as total_leads 
FROM api.greatpage_leads 
WHERE cidade_usuario IS NOT NULL 
GROUP BY cidade_usuario 
ORDER BY total_leads DESC 
LIMIT 20;

-- Leads por fonte de tráfego
SELECT referral_source, COUNT(*) as total_leads 
FROM api.greatpage_leads 
WHERE referral_source IS NOT NULL 
GROUP BY referral_source 
ORDER BY total_leads DESC;

-- Leads por mês
SELECT DATE_TRUNC('month', data_conversao) as mes, COUNT(*) as total_leads 
FROM api.greatpage_leads 
WHERE data_conversao IS NOT NULL 
GROUP BY mes 
ORDER BY mes DESC;
```

## 🐛 Troubleshooting

### Erro de Conexão com Supabase
- Verifique se as variáveis `SUPABASE_URL` e `SUPABASE_ANON_KEY` estão corretas
- Confirme se a tabela foi criada no schema `api`

### Erro de Permissão
- Verifique se a chave anônima tem permissão para inserir na tabela
- Considere usar a chave de service role se necessário

### Arquivo CSV não encontrado
- Verifique se a pasta "Planilha Greatpages" está na raiz do projeto
- Confirme se os arquivos CSV estão nas subpastas corretas


