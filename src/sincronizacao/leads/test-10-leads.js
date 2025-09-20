#!/usr/bin/env node

/**
 * 🧪 TESTE COM 10 LEADS - SCRIPT DE VALIDAÇÃO
 *
 * Script para testar sincronização com apenas 10 leads
 * para validar estrutura e funcionamento antes da sincronização completa
 */

import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

const CONFIG = {
  SPRINTHUB: {
    baseUrl: process.env.VITE_SPRINTHUB_BASE_URL || 'sprinthub-api-master.sprinthub.app',
    apiToken: process.env.VITE_SPRINTHUB_API_TOKEN || '9ad36c85-5858-4960-9935-e73c3698dd0c',
    instance: process.env.VITE_SPRINTHUB_INSTANCE || 'oficialmed'
  },
  SUPABASE: {
    url: process.env.VITE_SUPABASE_URL,
    key: process.env.VITE_SUPABASE_SERVICE_ROLE_KEY
  }
};

// Cores para terminal
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

// Função para mapear campos do lead (TODOS os 79 campos)
function mapLeadFields(lead) {
  // Função auxiliar para converter datas
  const parseDate = (dateStr) => {
    if (!dateStr) return null;
    try {
      return new Date(dateStr).toISOString();
    } catch {
      return null;
    }
  };

  // Função auxiliar para converter datas simples (sem hora)
  const parseDateOnly = (dateStr) => {
    if (!dateStr) return null;
    try {
      const date = new Date(dateStr);
      return date.toISOString().split('T')[0];
    } catch {
      return null;
    }
  };

  return {
    // 🔑 CHAVE PRIMÁRIA
    id: lead.id,

    // 👤 DADOS PESSOAIS BÁSICOS
    firstname: lead.firstname || null,
    lastname: lead.lastname || null,
    email: lead.email || null,
    phone: lead.phone || null,
    whatsapp: lead.whatsapp || null,
    mobile: lead.mobile || null,
    photo_url: lead.photoUrl || null,

    // 📍 ENDEREÇO
    address: lead.address || null,
    city: lead.city || null,
    state: lead.state || null,
    country: lead.country || null,
    zipcode: lead.zipcode || null,
    timezone: lead.timezone || null,
    bairro: lead.bairro || null,
    complemento: lead.complemento || null,
    numero_entrega: lead.numero_entrega || null,
    rua_entrega: lead.rua_entrega || null,

    // 🏢 DADOS COMERCIAIS
    company: lead.company || null,
    points: parseInt(lead.points) || 0,
    owner: lead.owner || null,
    stage: lead.stage || null,
    preferred_locale: lead.preferred_locale || null,

    // 📋 CONTROLE DE ACESSO
    user_access: lead.userAccess ? JSON.stringify(lead.userAccess) : null,
    department_access: lead.departmentAccess ? JSON.stringify(lead.departmentAccess) : null,
    ignore_sub_departments: lead.ignoreSubDepartments || false,

    // 📅 DATAS E CONTROLE
    create_date: parseDate(lead.createDate),
    updated_date: parseDate(lead.updatedDate),
    last_active: parseDate(lead.lastActive),
    created_by: lead.createdBy || null,
    created_by_name: lead.createdByName || null,
    created_by_type: lead.createdByType || null,
    updated_by: lead.updatedBy || null,
    updated_by_name: lead.updatedByName || null,
    synced_at: new Date().toISOString(),

    // 🗂️ DADOS EXTRAS (CAMPOS PERSONALIZADOS)
    archived: lead.archived || false,
    third_party_data: lead.thirdPartyData ? JSON.stringify(lead.thirdPartyData) : null,

    // 💰 FINANCEIRO E INVESTIMENTOS
    capital_de_investimento: lead.capital_de_investimento || null,
    tipo_de_compra: lead.tipo_de_compra || null,
    pedidos_shopify: lead.pedidos_shopify || null,

    // 📊 CLASSIFICAÇÃO E AVALIAÇÃO
    categoria: lead.categoria || null,
    classificacao_google: lead.classificacao_google || null,
    grau_de_interesse: lead.grau_de_interesse || null,
    star_score: lead.star_score || null,
    avaliacao_atendente: lead.avaliacao_atendente || null,
    avaliacao_atendimento: lead.avaliacao_atendimento || null,
    qualificacao_callix: lead.qualificacao_callix || null,

    // 🎯 MARKETING E ORIGEM
    origem: lead.origem || null,
    origem_manipulacao: lead.origem_manipulacao || null,
    lista_de_origem: lead.lista_de_origem || null,
    criativo: lead.criativo || null,
    plataforma: lead.plataforma || null,
    redes_sociais: lead.redes_sociais || null,
    site: lead.site || null,

    // 📞 ATENDIMENTO
    atendente: lead.atendente || null,
    atendente_atual: lead.atendente_atual || null,
    feedback: lead.feedback || null,
    observacao: lead.observacao || null,
    observacoes_do_lead: lead.observacoes_do_lead || null,
    comportamento_da_ia: lead.comportamento_da_ia || null,
    retorno: lead.retorno || null,

    // 🏥 DADOS ESPECÍFICOS (FARMÁCIA/MEDICINA)
    prescritor: lead.prescritor || null,
    produto: lead.produto || null,
    drograria: lead.drograria || null,
    data_recompra: parseDateOnly(lead.data_recompra),
    mes_que_entrou: lead.mes_que_entrou || null,

    // 📄 DOCUMENTOS E IDENTIFICAÇÃO
    cpf: lead.cpf || null,
    rg: lead.rg || null,
    arquivo_receita: lead.arquivo_receita || null,
    id_t56: lead.id_t56 || null,

    // 👥 DADOS PESSOAIS EXTRAS
    empresa: lead.empresa || null,
    sexo: lead.sexo || null,
    data_de_nascimento: parseDateOnly(lead.data_de_nascimento),
    objetivos_do_cliente: lead.objetivos_do_cliente || null,
    perfil_do_cliente: lead.perfil_do_cliente || null,
    recebedor: lead.recebedor || null,

    // 📱 WHATSAPP E INTEGRAÇÕES
    whatsapp_remote_lid: lead.whatsapp_remote_lid || null,

    // 📋 STATUS E CONTROLE
    status: lead.status || null,
    sh_status: lead.sh_status || null,
    data_do_contato: parseDateOnly(lead.data_do_contato)
  };
}

async function test10Leads() {
  try {
    console.log(`${colors.cyan}🧪 TESTE COM 10 LEADS${colors.reset}`);
    console.log(`${colors.cyan}====================${colors.reset}`);
    console.log(`${colors.blue}🎯 Objetivo: Testar sincronização com 10 leads${colors.reset}`);
    console.log('');

    // 1. Buscar lista de leads (apenas 10)
    console.log(`${colors.blue}📋 Passo 1: Buscando 10 leads...${colors.reset}`);

    const listUrl = `https://${CONFIG.SPRINTHUB.baseUrl}/leads?i=${CONFIG.SPRINTHUB.instance}&apitoken=${CONFIG.SPRINTHUB.apiToken}&limit=10`;

    const listResponse = await fetch(listUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${CONFIG.SPRINTHUB.apiToken}`,
        'apitoken': CONFIG.SPRINTHUB.apiToken
      }
    });

    if (!listResponse.ok) {
      throw new Error(`HTTP ${listResponse.status}: ${listResponse.statusText}`);
    }

    const listData = await listResponse.json();
    const leads = listData.data.leads;

    console.log(`${colors.green}✅ ${leads.length} leads obtidos!${colors.reset}`);

    // 2. Para cada lead, buscar detalhes completos e inserir
    console.log(`${colors.blue}📋 Passo 2: Processando leads...${colors.reset}`);

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < leads.length; i++) {
      const leadBasic = leads[i];
      console.log(`${colors.yellow}🔍 ${i + 1}/10 - Processando lead ${leadBasic.id} (${leadBasic.fullname})${colors.reset}`);

      try {
        // Buscar detalhes completos
        const detailUrl = `https://${CONFIG.SPRINTHUB.baseUrl}/leads/${leadBasic.id}?i=${CONFIG.SPRINTHUB.instance}&allFields=1&apitoken=${CONFIG.SPRINTHUB.apiToken}`;

        const detailResponse = await fetch(detailUrl, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': `Bearer ${CONFIG.SPRINTHUB.apiToken}`,
            'apitoken': CONFIG.SPRINTHUB.apiToken
          }
        });

        if (!detailResponse.ok) {
          throw new Error(`HTTP ${detailResponse.status}: ${detailResponse.statusText}`);
        }

        const detailData = await detailResponse.json();
        const leadDetails = detailData.data.lead;

        // Mapear campos
        const mappedData = mapLeadFields(leadDetails);

        // Inserir no Supabase
        const insertUrl = `${CONFIG.SUPABASE.url}/rest/v1/leads`;
        const insertResponse = await fetch(insertUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': `Bearer ${CONFIG.SUPABASE.key}`,
            'apikey': CONFIG.SUPABASE.key,
            'Accept-Profile': 'api',
            'Content-Profile': 'api',
            'Prefer': 'return=representation'
          },
          body: JSON.stringify(mappedData)
        });

        if (insertResponse.ok) {
          successCount++;
          console.log(`${colors.green}  ✅ Lead ${leadBasic.id} inserido com sucesso!${colors.reset}`);
        } else {
          const errorText = await insertResponse.text();
          console.log(`${colors.red}  ❌ Erro ao inserir lead ${leadBasic.id}: ${insertResponse.status} - ${errorText}${colors.reset}`);
          errorCount++;
        }

      } catch (error) {
        console.log(`${colors.red}  ❌ Erro ao processar lead ${leadBasic.id}: ${error.message}${colors.reset}`);
        errorCount++;
      }
    }

    // 3. Relatório final
    console.log(`${colors.cyan}${'='.repeat(50)}${colors.reset}`);
    console.log(`${colors.cyan}📊 RELATÓRIO DO TESTE${colors.reset}`);
    console.log(`${colors.cyan}${'='.repeat(50)}${colors.reset}`);
    console.log(`${colors.blue}📊 Total processados: ${leads.length}${colors.reset}`);
    console.log(`${colors.green}✅ Sucessos: ${successCount}${colors.reset}`);
    console.log(`${colors.red}❌ Erros: ${errorCount}${colors.reset}`);
    console.log(`${colors.blue}📈 Taxa de sucesso: ${((successCount / leads.length) * 100).toFixed(2)}%${colors.reset}`);
    console.log(`${colors.cyan}${'='.repeat(50)}${colors.reset}`);

    if (successCount > 0) {
      console.log(`${colors.green}🎉 TESTE CONCLUÍDO COM SUCESSO!${colors.reset}`);
      console.log(`${colors.blue}🚀 Agora você pode executar a sincronização completa com:${colors.reset}`);
      console.log(`${colors.yellow}   node src/sincronizacao/leads/sync-leads.js${colors.reset}`);
    } else {
      console.log(`${colors.red}❌ TESTE FALHOU - Verifique configurações${colors.reset}`);
    }

  } catch (error) {
    console.error(`${colors.red}❌ ERRO NO TESTE:${colors.reset}`, error.message);
  }
}

// Executar teste
test10Leads();