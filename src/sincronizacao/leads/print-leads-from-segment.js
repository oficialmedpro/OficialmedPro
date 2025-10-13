#!/usr/bin/env node

/**
 * Script print-leads-from-segment.js
 * Busca leads de um segmento e imprime a resposta da API, crua, no terminal
 * Uso: node print-leads-from-segment.js <SEGMENT_ID>
 */

import dotenv from 'dotenv';
dotenv.config();

const segmentId = process.argv[2];
if (!segmentId) {
  console.error('Informe o ID do segmento. Ex: node print-leads-from-segment.js 123');
  process.exit(1);
}

const fetchLeadsFromSegment = async (page = 0, limit = 100) => {
  const baseUrl = process.env.VITE_SPRINTHUB_BASE_URL || 'sprinthub-api-master.sprinthub.app';
  const apiToken = process.env.VITE_SPRINTHUB_API_TOKEN;
  const instance = process.env.VITE_SPRINTHUB_INSTANCE || 'oficialmed';
  const url = `https://${baseUrl}/leadsfromtype/segment/${segmentId}?i=${instance}`;
  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Authorization': `Bearer ${apiToken}`,
    'apitoken': apiToken
  };
  const body = {
    page,
    limit,
    orderByKey: 'createDate',
    orderByDirection: 'desc',
    showAnon: false,
    search: '',
    query: '{total,leads{id,fullname,photoUrl,email,points,city,state,country,lastActive,archived,owner{completName},companyData{companyname},createDate}}',
    showArchived: false,
    additionalFilter: null,
    idOnly: false
  };
  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(body)
  });
  const raw = await response.text();
  try {
    console.log(JSON.stringify(JSON.parse(raw), null, 2));
  } catch {
    // Não era JSON
    console.log(raw);
  }
}

fetchLeadsFromSegment().catch(e => {console.error(e); process.exit(1);});
