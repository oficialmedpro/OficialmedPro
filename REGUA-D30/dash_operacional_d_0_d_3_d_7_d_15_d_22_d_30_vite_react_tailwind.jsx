import React, { useMemo, useState } from "react";

// ✅ Drop-in para Vite + React (com Tailwind).
// Coloque este arquivo como `src/StageDashboard.tsx` e importe no App.
// Substitua o array `seed` por dados vindos do seu Supabase/SprintHub.

// Tipos básicos
type Etapa = "D0" | "D3" | "D7" | "D15" | "D22" | "D30";

type Risco = "baixo" | "medio" | "alto";

type Contatos = {
  ligacao: boolean;
  whatsapp: boolean;
  email: boolean;
  sms: boolean;
};

type OrigemTag = {
  label: string;
  color: "blue" | "violet" | "amber" | "emerald" | "rose" | "zinc";
};

type HistoricoItem = {
  id: string;
  tipo: "pedido" | "orcamento";
  data: string; // ISO
  descricao: string;
  valor: number;
};

type Cliente = {
  id: string;
  nome: string;
  produto: string;
  ticket: number; // em R$
  vendedor: string;
  telefone: string;
  email: string;
  dataCompra: string; // ISO
  etapa: Etapa;
  ultimoContato?: string; // ISO
  risco: Risco;
  contatos: Contatos;
  motivoNaoRenova?: string;
  origem: OrigemTag; // tag colorida da 1ª origem
  ultimoPedidoValor?: number; // valor do último pedido
  historico: HistoricoItem[]; // pedidos + orçamentos
};

type MetaEtapa = {
  etapa: Etapa;
  metaContatosDia: number; // meta de contatos/dia por vendedor ou por equipe
  slaHoras: number; // prazo para primeiro/novo contato
};

// 🔧 Metas por etapa (exemplo; ajuste conforme sua regra)
const metas: MetaEtapa[] = [
  { etapa: "D0", metaContatosDia: 40, slaHoras: 4 },
  { etapa: "D3", metaContatosDia: 35, slaHoras: 8 },
  { etapa: "D7", metaContatosDia: 30, slaHoras: 12 },
  { etapa: "D15", metaContatosDia: 25, slaHoras: 24 },
  { etapa: "D22", metaContatosDia: 25, slaHoras: 24 },
  { etapa: "D30", metaContatosDia: 50, slaHoras: 12 },
];

// 📋 Tarefas sugeridas por etapa (checklist padrão)
const tarefasPorEtapa: Record<Etapa, string[]> = {
  D0: [
    "Enviar mensagem de boas-vindas",
    "Confirmar recebimento/entrega",
    "Registrar preferências de contato",
  ],
  D3: [
    "Check-in de satisfação inicial",
    "Oferecer ajuda/guia rápido",
    "Apontar benefício relevante",
  ],
  D7: [
    "Enviar dica/conteúdo de uso",
    "Perguntar resultados parciais",
    "Registrar objeções",
  ],
  D15: [
    "Avaliar satisfação (NPS/nota)",
    "Sondar continuidade/renovação",
    "Mapear objeções e oportunidades",
  ],
  D22: [
    "Reforçar valor + bônus",
    "Enviar proposta antec. de renovação",
    "Agendar call curta",
  ],
  D30: [
    "Confirmar renovação/decisão",
    "Resolver objeções finais",
    "Registrar motivo se não renovar",
  ],
};

// 🧪 Mock de clientes (substituir por query do Supabase)
const seed: Cliente[] = [
  {
    id: "c1",
    nome: "João Silva",
    produto: "Plano Ouro",
    ticket: 1490,
    vendedor: "Gabrielli",
    telefone: "+55 43 99999-1111",
    email: "joao@exemplo.com",
    dataCompra: "2025-10-28T12:00:00Z",
    etapa: "D30",
    ultimoContato: "2025-11-10T16:00:00Z",
    risco: "alto",
    contatos: { ligacao: false, whatsapp: true, email: true, sms: false },
    motivoNaoRenova: undefined,
    origem: { label: "Ads Google", color: "blue" },
    ultimoPedidoValor: 1490,
    historico: [
      { id: "h1", tipo: "pedido", data: "2025-10-28T12:00:00Z", descricao: "Assinatura Plano Ouro", valor: 1490 },
      { id: "h2", tipo: "orcamento", data: "2025-10-15T12:00:00Z", descricao: "Upgrade para Plano Diamante", valor: 2450 },
    ],
  },
  {
    id: "c2",
    nome: "Maria Souza",
    produto: "Plano Prata",
    ticket: 890,
    vendedor: "Thalia",
    telefone: "+55 43 98888-2222",
    email: "maria@exemplo.com",
    dataCompra: "2025-10-30T12:00:00Z",
    etapa: "D30",
    ultimoContato: "2025-11-09T13:00:00Z",
    risco: "medio",
    contatos: { ligacao: true, whatsapp: false, email: false, sms: false },
    origem: { label: "Indicação", color: "emerald" },
    ultimoPedidoValor: 890,
    historico: [
      { id: "h3", tipo: "pedido", data: "2025-10-30T12:00:00Z", descricao: "Assinatura Plano Prata", valor: 890 },
    ],
  },
  {
    id: "c3",
    nome: "Carlos Nunes",
    produto: "Plano Diamante",
    ticket: 2450,
    vendedor: "Hagata",
    telefone: "+55 43 97777-3333",
    email: "carlos@exemplo.com",
    dataCompra: "2025-10-15T12:00:00Z",
    etapa: "D30",
    ultimoContato: "2025-11-07T10:00:00Z",
    risco: "alto",
    contatos: { ligacao: false, whatsapp: false, email: false, sms: false },
    origem: { label: "Orgânico", color: "violet" },
    ultimoPedidoValor: 2450,
    historico: [
      { id: "h4", tipo: "orcamento", data: "2025-10-10T12:00:00Z", descricao: "Teste Plano Prata", valor: 890 },
      { id: "h5", tipo: "pedido", data: "2025-10-15T12:00:00Z", descricao: "Assinatura Plano Diamante", valor: 2450 },
    ],
  },
  {
    id: "c4",
    nome: "Bruna Lima",
    produto: "Plano Bronze",
    ticket: 590,
    vendedor: "Gustavo",
    telefone: "+55 43 96666-4444",
    email: "bruna@exemplo.com",
    dataCompra: "2025-11-03T12:00:00Z",
    etapa: "D22",
    ultimoContato: "2025-11-10T09:00:00Z",
    risco: "baixo",
    contatos: { ligacao: true, whatsapp: true, email: false, sms: true },
    origem: { label: "Feira/Eventos", color: "amber" },
    ultimoPedidoValor: 590,
    historico: [
      { id: "h6", tipo: "pedido", data: "2025-11-03T12:00:00Z", descricao: "Assinatura Plano Bronze", valor: 590 },
    ],
  },
];

// 🎛️ Helpers
function formatBRL(n: number) {
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function diffHoursFromNow(iso?: string) {
  if (!iso) return Infinity;
  const diff = Date.now() - new Date(iso).getTime();
  return Math.floor(diff / (1000 * 60 * 60));
}

function riscoBadge(r: Risco) {
  const map: Record<Risco, string> = {
    baixo: "bg-emerald-100 text-emerald-700 border-emerald-200",
    medio: "bg-amber-100 text-amber-700 border-amber-200",
    alto: "bg-rose-100 text-rose-700 border-rose-200",
  };
  return map[r];
}

function origemBadge(o: OrigemTag) {
  const base = "text-xs px-2 py-1 rounded-full border ";
  const palette: Record<OrigemTag["color"], string> = {
    blue: "bg-blue-100 text-blue-700 border-blue-200",
    violet: "bg-violet-100 text-violet-700 border-violet-200",
    amber: "bg-amber-100 text-amber-700 border-amber-200",
    emerald: "bg-emerald-100 text-emerald-700 border-emerald-200",
    rose: "bg-rose-100 text-rose-700 border-rose-200",
    zinc: "bg-zinc-100 text-zinc-700 border-zinc-200",
  };
  return base + palette[o.color];
}

// 🧭 Ícones simples (inline SVG)
const PhoneIcon = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor" aria-hidden>
    <path d="M6.62 10.79a15.53 15.53 0 006.59 6.59l2.2-2.2a1 1 0 011.01-.24 12.3 12.3 0 003.86.62 1 1 0 011 1V20a1 1 0 01-1 1A17 17 0 013 4a1 1 0 011-1h3.44a1 1 0 011 1 12.3 12.3 0 00.62 3.86 1 1 0 01-.24 1.01l-2.2 2.2z"/>
  </svg>
);
const MailIcon = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor" aria-hidden>
    <path d="M20 4H4a2 2 0 00-2 2v12a2 2 0 002 2h16a2 2 0 002-2V6a2 2 0 00-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
  </svg>
);
const WhatsIcon = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor" aria-hidden>
    <path d="M20.52 3.48A11.83 11.83 0 0012.07 0C5.63 0 .4 5.23.4 11.68a11.3 11.3 0 001.53 5.76L0 24l6.77-1.8a11.86 11.86 0 005.86 1.57h.01c6.45 0 11.68-5.23 11.68-11.67a11.6 11.6 0 00-3.8-8.62zm-8.45 18a9.72 9.72 0 01-4.95-1.35l-.35-.21-4.02 1.07 1.07-3.92-.22-.4a9.78 9.78 0 01-1.43-5.1C2.17 6.44 6.61 2 12.06 2c2.63 0 5.11 1.02 6.97 2.88a9.72 9.72 0 012.98 6.93c0 5.45-4.44 9.67-9.94 9.67zm5.61-7.27c-.31-.16-1.87-.92-2.16-1.03-.29-.11-.5-.16-.71.16-.21.31-.82 1.03-1 1.24-.18.21-.37.23-.68.08-.31-.16-1.29-.48-2.46-1.53-.9-.8-1.51-1.78-1.69-2.09-.18-.31-.02-.48.13-.63.13-.13.31-.34.45-.52.15-.18.19-.31.29-.52.1-.21.05-.39-.02-.55-.08-.16-.71-1.71-.97-2.34-.26-.63-.52-.55-.71-.56-.18-.01-.39-.01-.6-.01-.21 0-.55.08-.84.39-.29.31-1.1 1.08-1.1 2.63 0 1.54 1.13 3.02 1.29 3.22.16.21 2.23 3.39 5.4 4.75.76.33 1.36.53 1.83.68.77.24 1.48.21 2.04.13.62-.09 1.87-.77 2.13-1.51.26-.74.26-1.37.18-1.51-.08-.13-.29-.21-.6-.37z"/>
  </svg>
);
const CheckIcon = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor" aria-hidden>
    <path d="M9 16.2l-3.5-3.5L4 14.2l5 5 11-11-1.5-1.5z"/>
  </svg>
);
const SmsIcon = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor" aria-hidden>
    <path d="M2 5a3 3 0 013-3h14a3 3 0 013 3v9a3 3 0 01-3 3H8l-6 5V5z"/>
  </svg>
);

// 🎯 Componentes UI
function TopTabs({ etapa, setEtapa }: { etapa: Etapa; setEtapa: (e: Etapa) => void }) {
  const tabs: Etapa[] = ["D0", "D3", "D7", "D15", "D22", "D30"];
  return (
    <div className="w-full border-b border-zinc-200 bg-white sticky top-0 z-20">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between gap-2 py-3 overflow-x-auto">
          <div className="flex items-center gap-2">
            {tabs.map((t) => (
              <button
                key={t}
                onClick={() => setEtapa(t)}
                className={
                  "px-3 py-2 rounded-xl text-sm font-medium border transition " +
                  (t === etapa
                    ? "bg-zinc-900 text-white border-zinc-900 shadow"
                    : "bg-zinc-50 text-zinc-700 border-zinc-200 hover:bg-zinc-100")
                }
              >
                {t}
              </button>
            ))}
          </div>
          {/* Acesso às outras cadências */}
          <div className="flex items-center gap-2 text-sm">
            <span className="text-zinc-400">funil</span>
            <button className="px-3 py-2 rounded-xl border border-zinc-200 bg-zinc-50 hover:bg-zinc-100">D60</button>
            <button className="px-3 py-2 rounded-xl border border-zinc-200 bg-zinc-50 hover:bg-zinc-100">D90</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Metric({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="p-4 rounded-2xl border border-zinc-200 bg-white shadow-sm">
      <div className="text-xs text-zinc-500">{label}</div>
      <div className="text-2xl font-semibold text-zinc-900">{value}</div>
      {hint && <div className="text-xs text-zinc-500 mt-1">{hint}</div>}
    </div>
  );
}

function StageHeader({ etapa, clientes }: { etapa: Etapa; clientes: Cliente[] }) {
  const meta = metas.find((m) => m.etapa === etapa)!;
  const pendentesContato = clientes.filter((c) => !c.contatos.ligacao || !c.contatos.whatsapp || !c.contatos.email || !c.contatos.sms).length;
  const total = clientes.length;
  const taxaContato = total === 0 ? 0 : Math.round(((total - pendentesContato) / total) * 100);
  const somaTickets = clientes.reduce((acc, c) => acc + c.ticket, 0);

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      <Metric label="Clientes na etapa" value={String(total)} />
      <Metric label="Pendentes de contato" value={String(pendentesContato)} hint={`Meta diária: ${meta.metaContatosDia}`} />
      <Metric label="% contato realizado" value={`${taxaContato}%`} hint={`SLA: até ${meta.slaHoras}h`} />
      <Metric label="Ticket potencial" value={formatBRL(somaTickets)} />
    </div>
  );
}

function Controls({
  sort, setSort,
  filtroRisco, setFiltroRisco,
  busca, setBusca,
}: {
  sort: string; setSort: (s: string) => void;
  filtroRisco: Risco | "todos"; setFiltroRisco: (r: Risco | "todos") => void;
  busca: string; setBusca: (s: string) => void;
}) {
  return (
    <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar por cliente, vendedor, produto..."
          className="w-72 px-3 py-2 rounded-xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-zinc-300"
        />
        <select
          value={filtroRisco}
          onChange={(e) => setFiltroRisco(e.target.value as any)}
          className="px-3 py-2 rounded-xl border border-zinc-200 bg-white"
          title="Filtro por risco"
        >
          <option value="todos">Todos os riscos</option>
          <option value="alto">Risco alto</option>
          <option value="medio">Risco médio</option>
          <option value="baixo">Risco baixo</option>
        </select>
      </div>
      <div className="flex items-center gap-2">
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="px-3 py-2 rounded-xl border border-zinc-200 bg-white"
          title="Ordenação"
        >
          <option value="ticket_desc">Ticket (↓)</option>
          <option value="ticket_asc">Ticket (↑)</option>
          <option value="cliente_az">Cliente (A→Z)</option>
          <option value="ultimo_desc">Último contato (recente)</option>
          <option value="risco_desc">Risco (alto→baixo)</option>
        </select>
        <button
          className="px-3 py-2 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50"
          title="Ação em lote (exemplo)"
          onClick={() => alert("Exemplo: enviar lembretes em lote aos pendentes.")}
        >
          Ações em lote
        </button>
      </div>
    </div>
  );
}

function ClienteCard({ c, onToggleContato, onSetMotivo, onOpenHistorico }: {
  c: Cliente;
  onToggleContato: (id: string, canal: keyof Contatos) => void;
  onSetMotivo: (id: string, motivo: string) => void;
  onOpenHistorico: (cliente: Cliente) => void;
}) {
  const horasDesdeContato = diffHoursFromNow(c.ultimoContato);
  const contactBtn = (active: boolean) =>
    active ? "bg-emerald-600 text-white border-emerald-600" : "bg-zinc-50 text-zinc-700 border-zinc-200";

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm hover:shadow-md transition">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <div className="text-zinc-900 font-semibold text-base">{c.nome}</div>
            <span className={origemBadge(c.origem)} title="Origem do 1º contato">{c.origem.label}</span>
          </div>
          <div className="text-xs text-zinc-500">
            {c.produto} • Ticket: {formatBRL(c.ticket)} • Últ. pedido: {c.ultimoPedidoValor ? formatBRL(c.ultimoPedidoValor) : "—"} • {c.vendedor}
          </div>
        </div>
        <span className={`text-xs px-2 py-1 rounded-full border ${riscoBadge(c.risco)}`}>
          {c.risco.toUpperCase()}
        </span>
      </div>

      <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Contatos */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => onToggleContato(c.id, "ligacao")}
            className={`flex items-center gap-1 px-2 py-1 rounded-lg border text-sm ${contactBtn(c.contatos.ligacao)}`}
            title="Marcar ligação"
          >
            <PhoneIcon /> Ligação
          </button>
          <button
            onClick={() => onToggleContato(c.id, "whatsapp")}
            className={`flex items-center gap-1 px-2 py-1 rounded-lg border text-sm ${contactBtn(c.contatos.whatsapp)}`}
            title="Marcar WhatsApp"
          >
            <WhatsIcon /> Whats
          </button>
          <button
            onClick={() => onToggleContato(c.id, "email")}
            className={`flex items-center gap-1 px-2 py-1 rounded-lg border text-sm ${contactBtn(c.contatos.email)}`}
            title="Marcar e-mail"
          >
            <MailIcon /> E-mail
          </button>
          <button
            onClick={() => onToggleContato(c.id, "sms")}
            className={`flex items-center gap-1 px-2 py-1 rounded-lg border text-sm ${contactBtn(c.contatos.sms)}`}
            title="Marcar SMS"
          >
            <SmsIcon /> SMS
          </button>
        </div>

        {/* Motivo de não renovar */}
        <div>
          <label className="text-xs text-zinc-500">Motivo de não renovar</label>
          <select
            className="w-full mt-1 px-2 py-2 rounded-lg border border-zinc-200 bg-white text-sm"
            value={c.motivoNaoRenova || ""}
            onChange={(e) => onSetMotivo(c.id, e.target.value)}
          >
            <option value="">— Se aplicável —</option>
            <option value="sem-tempo">Sem tempo</option>
            <option value="nao-percebeu-valor">Não percebeu valor</option>
            <option value="mudou-fornecedor">Mudou de fornecedor</option>
            <option value="preco">Preço</option>
            <option value="outro">Outro</option>
          </select>
        </div>

        {/* SLA e último contato */}
        <div className="text-sm flex flex-col justify-center">
          <div className="text-zinc-900">
            Último contato: {c.ultimoContato ? new Date(c.ultimoContato).toLocaleString() : "—"}
          </div>
          <div className={`text-xs ${horasDesdeContato > 24 ? "text-rose-600" : "text-zinc-500"}`}>
            {Number.isFinite(horasDesdeContato) ? `${horasDesdeContato}h atrás` : "Sem registro"}
          </div>
        </div>
      </div>

      {/* Checklist de tarefas por etapa */}
      <div className="mt-4">
        <div className="flex items-center justify-between">
          <div className="text-xs text-zinc-500 mb-2">Tarefas desta etapa</div>
          <button
            onClick={() => onOpenHistorico(c)}
            className="text-sm px-3 py-1.5 rounded-lg border border-zinc-200 bg-zinc-50 hover:bg-zinc-100"
          >
            Ver histórico
          </button>
        </div>
        <ul className="grid md:grid-cols-3 gap-2">
          {tarefasPorEtapa[c.etapa].map((t, idx) => (
            <li key={idx} className="flex items-start gap-2 text-sm">
              <span className="mt-1 inline-flex items-center justify-center w-5 h-5 rounded-md border border-zinc-300">
                <CheckIcon />
              </span>
              <span className="text-zinc-700">{t}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Acessos rápidos */}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <a
          href={`tel:${c.telefone.replace(/[^0-9+]/g, "")}`}
          className="px-3 py-2 rounded-xl border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 text-sm"
        >
          Ligar agora
        </a>
        <a
          href={`mailto:${c.email}`}
          className="px-3 py-2 rounded-xl border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 text-sm"
        >
          Enviar e-mail
        </a>
        <a
          href={`https://wa.me/${c.telefone.replace(/[^0-9]/g, "")}`}
          target="_blank"
          rel="noreferrer"
          className="px-3 py-2 rounded-xl border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 text-sm"
        >
          Abrir WhatsApp
        </a>
      </div>
    </div>
  );
}

function HistoricoModal({ cliente, onClose }: { cliente: Cliente | null; onClose: () => void }) {
  if (!cliente) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-2xl mx-4 rounded-2xl bg-white shadow-xl border border-zinc-200">
        <div className="p-4 border-b border-zinc-200 flex items-center justify-between">
          <div>
            <div className="font-semibold text-zinc-900">Histórico — {cliente.nome}</div>
            <div className="text-xs text-zinc-500">Pedidos e orçamentos</div>
          </div>
          <button className="text-sm px-3 py-1.5 rounded-lg border border-zinc-200 bg-zinc-50 hover:bg-zinc-100" onClick={onClose}>Fechar</button>
        </div>
        <div className="p-4 max-h-[60vh] overflow-y-auto">
          {cliente.historico.length === 0 ? (
            <div className="text-sm text-zinc-500">Sem registros.</div>
          ) : (
            <ul className="space-y-2">
              {cliente.historico
                .sort((a,b)=> new Date(b.data).getTime() - new Date(a.data).getTime())
                .map((h) => (
                <li key={h.id} className="p-3 rounded-xl border border-zinc-200 bg-zinc-50 flex items-center justify-between">
                  <div>
                    <div className="text-xs uppercase tracking-wide text-zinc-500">{h.tipo === 'pedido' ? 'Pedido' : 'Orçamento'}</div>
                    <div className="text-zinc-800 text-sm">{h.descricao}</div>
                    <div className="text-xs text-zinc-500">{new Date(h.data).toLocaleString()}</div>
                  </div>
                  <div className="text-sm font-medium">{formatBRL(h.valor)}</div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

export default function StageDashboard() {
  const [etapa, setEtapa] = useState<Etapa>("D30"); // abre direto no D30 (modo operacional)
  const [sort, setSort] = useState("ticket_desc");
  const [filtroRisco, setFiltroRisco] = useState<Risco | "todos">("todos");
  const [busca, setBusca] = useState("");

  const [clientes, setClientes] = useState<Cliente[]>(seed);
  const [clienteHistorico, setClienteHistorico] = useState<Cliente | null>(null);

  // Filtra clientes da etapa atual
  const daEtapa = useMemo(() => {
    const list = clientes.filter((c) => c.etapa === etapa);
    const filtrado = list.filter((c) => {
      const hay = (s: string) => s.toLowerCase().includes(busca.toLowerCase());
      const matchBusca =
        !busca || hay(c.nome) || hay(c.vendedor) || hay(c.produto) || hay(String(c.ticket));
      const matchRisco = filtroRisco === "todos" ? true : c.risco === filtroRisco;
      return matchBusca && matchRisco;
    });

    return filtrado.sort((a, b) => {
      switch (sort) {
        case "ticket_desc":
          return b.ticket - a.ticket;
        case "ticket_asc":
          return a.ticket - b.ticket;
        case "cliente_az":
          return a.nome.localeCompare(b.nome);
        case "ultimo_desc":
          return new Date(b.ultimoContato || 0).getTime() - new Date(a.ultimoContato || 0).getTime();
        case "risco_desc": {
          const ord: Record<Risco, number> = { alto: 0, medio: 1, baixo: 2 };
          return ord[a.risco] - ord[b.risco];
        }
        default:
          return 0;
      }
    });
  }, [clientes, etapa, sort, filtroRisco, busca]);

  const handleToggleContato = (id: string, canal: keyof Contatos) => {
    setClientes((prev) =>
      prev.map((c) =>
        c.id === id
          ? {
              ...c,
              contatos: { ...c.contatos, [canal]: !c.contatos[canal] },
              ultimoContato: new Date().toISOString(),
            }
          : c
      )
    );
  };

  const handleSetMotivo = (id: string, motivo: string) => {
    setClientes((prev) => prev.map((c) => (c.id === id ? { ...c, motivoNaoRenova: motivo || undefined } : c)));
  };

  return (
    <div className="min-h-screen bg-zinc-100">
      <TopTabs etapa={etapa} setEtapa={setEtapa} />

      <main className="max-w-7xl mx-auto p-4 md:p-6">
        {/* Cabeçalho */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-zinc-900">{etapa} — Operacional</h1>
            <p className="text-sm text-zinc-500">Visualize somente a etapa selecionada e execute ações rápidas por cliente.</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              className="px-3 py-2 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 text-sm"
              onClick={() => alert("Exemplo: exportar CSV da etapa atual.")}
            >
              Exportar CSV
            </button>
            <button
              className="px-3 py-2 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 text-sm"
              onClick={() => alert("Exemplo: atualizar dados do Supabase.")}
            >
              Atualizar dados
            </button>
          </div>
        </div>

        {/* Métricas */}
        <StageHeader etapa={etapa} clientes={daEtapa} />

        {/* Controles */}
        <div className="mt-4">
          <Controls
            sort={sort}
            setSort={setSort}
            filtroRisco={filtroRisco}
            setFiltroRisco={setFiltroRisco}
            busca={busca}
            setBusca={setBusca}
          />
        </div>

        {/* Lista de clientes (Kanban de 1 coluna focado na execução) */}
        <section className="mt-6 grid grid-cols-1 gap-3">
          {daEtapa.length === 0 ? (
            <div className="p-8 text-center rounded-2xl border border-dashed border-zinc-300 text-zinc-500 bg-white">
              Nenhum cliente nesta etapa.
            </div>
          ) : (
            daEtapa.map((c) => (
              <ClienteCard key={c.id} c={c} onToggleContato={handleToggleContato} onSetMotivo={handleSetMotivo} onOpenHistorico={setClienteHistorico} />
            ))
          )}
        </section>

        {/* Rodapé auxiliar */}
        <footer className="mt-10 pb-10 text-center text-xs text-zinc-400">
          Dica: use as abas no topo para alternar entre D0, D3, D7, D15, D22 e D30. Acesse outras cadências em “funil D60 / D90”.
        </footer>
      </main>

      {/* Modal de histórico */}
      <HistoricoModal cliente={clienteHistorico} onClose={() => setClienteHistorico(null)} />
    </div>
  );
}
