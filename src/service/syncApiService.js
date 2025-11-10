/**
 * 🌐 Serviço central para acionar a API de sincronização (Sprint Sync).
 * Todas as chamadas para sincronizações devem passar por aqui para evitar
 * acessar diretamente Supabase com credenciais privilegiadas no frontend.
 */

let cachedBaseUrl = null;

function resolveBaseUrl() {
  if (cachedBaseUrl) return cachedBaseUrl;

  let candidate = null;

  if (typeof window !== 'undefined' && window.ENV?.VITE_SYNC_API_URL) {
    candidate = window.ENV.VITE_SYNC_API_URL;
  }

  if (!candidate && typeof import.meta !== 'undefined') {
    candidate = import.meta.env?.VITE_SYNC_API_URL;
  }

  if (candidate) {
    candidate = candidate.trim();
    if (candidate.endsWith('/')) {
      candidate = candidate.slice(0, -1);
    }
  }

  cachedBaseUrl = candidate || null;
  return cachedBaseUrl;
}

function ensureBaseUrl() {
  const baseUrl = resolveBaseUrl();
  if (!baseUrl) {
    throw new Error('VITE_SYNC_API_URL não configurada. Defina a URL da API de sincronização.');
  }
  return baseUrl;
}

async function request(path, options = {}) {
  const baseUrl = ensureBaseUrl();
  const url = `${baseUrl}${path.startsWith('/') ? path : `/${path}`}`;

  const defaultHeaders = {
    'Accept': 'application/json'
  };

  const response = await fetch(url, {
    method: 'GET',
    ...options,
    headers: {
      ...defaultHeaders,
      ...(options.headers || {})
    }
  });

  let payload = null;
  try {
    payload = await response.json();
  } catch (_err) {
    // Ignorar – alguns endpoints podem não retornar JSON.
  }

  const success = payload?.success ?? response.ok;
  if (!success) {
    const errorMessage = payload?.error || payload?.message || `HTTP ${response.status}`;
    const error = new Error(errorMessage);
    error.status = response.status;
    error.payload = payload;
    throw error;
  }

  return payload;
}

export function isSyncApiConfigured() {
  return !!resolveBaseUrl();
}

export function getSyncApiBaseUrl() {
  return resolveBaseUrl();
}

export async function triggerOpportunitiesSync() {
  return request('/oportunidades');
}

export async function triggerLeadsSync() {
  return request('/leads');
}

export async function triggerSegmentsSync() {
  return request('/segmentos');
}

export async function triggerFullSync() {
  return request('/sync/all');
}

export async function getSyncMetrics() {
  return request('/metrics');
}

export default {
  isConfigured: isSyncApiConfigured,
  getBaseUrl: getSyncApiBaseUrl,
  triggerOpportunities: triggerOpportunitiesSync,
  triggerLeads: triggerLeadsSync,
  triggerSegments: triggerSegmentsSync,
  triggerFull: triggerFullSync,
  getMetrics: getSyncMetrics
};

