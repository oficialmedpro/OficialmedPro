#!/usr/bin/env node

/**
 * 🔍 TESTE DA API DE LEADS - BUSCAR JSON COMPLETO
 *
 * Script para testar a API e obter um exemplo completo de lead
 */

import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

const CONFIG = {
  SPRINTHUB: {
    baseUrl: process.env.VITE_SPRINTHUB_BASE_URL || 'sprinthub-api-master.sprinthub.app',
    apiToken: process.env.VITE_SPRINTHUB_API_TOKEN || '9ad36c85-5858-4960-9935-e73c3698dd0c',
    instance: process.env.VITE_SPRINTHUB_INSTANCE || 'oficialmed'
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

async function testLeadsAPI() {
  try {
    console.log(`${colors.cyan}🔍 TESTANDO API DE LEADS${colors.reset}`);
    console.log(`${colors.cyan}========================${colors.reset}`);

    // 1. Primeiro buscar a lista de leads para pegar um ID
    console.log(`${colors.blue}📋 Passo 1: Buscando lista de leads...${colors.reset}`);

    const listUrl = `https://${CONFIG.SPRINTHUB.baseUrl}/leads?i=${CONFIG.SPRINTHUB.instance}&apitoken=${CONFIG.SPRINTHUB.apiToken}&limit=5`;
    console.log(`${colors.yellow}🔗 URL: ${listUrl}${colors.reset}`);

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
    console.log(`${colors.green}✅ Lista obtida com sucesso!${colors.reset}`);
    console.log(`${colors.blue}📊 Total de leads: ${listData.data.total}${colors.reset}`);
    console.log(`${colors.blue}📋 Leads na página: ${listData.data.leads.length}${colors.reset}`);

    // Pegar o ID do primeiro lead
    if (!listData.data.leads || listData.data.leads.length === 0) {
      throw new Error('Nenhum lead encontrado na lista');
    }

    const firstLead = listData.data.leads[0];
    const leadId = firstLead.id;
    console.log(`${colors.magenta}🎯 Selecionado lead ID: ${leadId} (${firstLead.fullname})${colors.reset}`);

    // 2. Buscar detalhes completos do lead
    console.log(`${colors.blue}📋 Passo 2: Buscando detalhes completos do lead ${leadId}...${colors.reset}`);

    const detailUrl = `https://${CONFIG.SPRINTHUB.baseUrl}/leads/${leadId}?i=${CONFIG.SPRINTHUB.instance}&allFields=1&apitoken=${CONFIG.SPRINTHUB.apiToken}`;
    console.log(`${colors.yellow}🔗 URL: ${detailUrl}${colors.reset}`);

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
    console.log(`${colors.green}✅ Detalhes obtidos com sucesso!${colors.reset}`);

    // 3. Mostrar JSON completo
    console.log(`${colors.cyan}${'='.repeat(80)}${colors.reset}`);
    console.log(`${colors.cyan}📄 JSON COMPLETO DO LEAD ID ${leadId}:${colors.reset}`);
    console.log(`${colors.cyan}${'='.repeat(80)}${colors.reset}`);
    console.log(JSON.stringify(detailData, null, 2));
    console.log(`${colors.cyan}${'='.repeat(80)}${colors.reset}`);

    // 4. Listar todos os campos do lead
    if (detailData.data && detailData.data.lead) {
      const lead = detailData.data.lead;
      console.log(`${colors.green}✅ CAMPOS IDENTIFICADOS NO LEAD:${colors.reset}`);
      console.log(`${colors.blue}📋 Total de campos: ${Object.keys(lead).length}${colors.reset}`);

      Object.keys(lead).sort().forEach((field, index) => {
        const value = lead[field];
        const type = Array.isArray(value) ? 'array' : typeof value;
        console.log(`${colors.yellow}  ${(index + 1).toString().padStart(2, '0')}. ${field.padEnd(25)} | ${type.padEnd(10)} | ${JSON.stringify(value).slice(0, 50)}${colors.reset}`);
      });
    }

    console.log(`${colors.green}✅ TESTE CONCLUÍDO COM SUCESSO!${colors.reset}`);

  } catch (error) {
    console.error(`${colors.red}❌ ERRO NO TESTE:${colors.reset}`, error.message);
    console.error(`${colors.red}Stack:${colors.reset}`, error.stack);
  }
}

// Executar teste
testLeadsAPI();