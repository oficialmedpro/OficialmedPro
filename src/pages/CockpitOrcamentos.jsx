import React, { useEffect, useMemo, useRef, useState } from "react";
import './CockpitOrcamentos.css';
import LogoOficialmed from '../../icones/icone_oficialmed.svg';
import { Sun, Moon, Plus, Minus, SlidersHorizontal } from 'lucide-react';

const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

const fmtMin = (m) => `${Math.round(m)} min`;

const pct = (v) => `${(v * 100).toFixed(1)}%`;

function trendArrow(delta) {
  if (delta > 0.001) return { symbol: "▲", cls: "text-emerald-400" };
  if (delta < -0.001) return { symbol: "▼", cls: "text-rose-400" };
  return { symbol: "•", cls: "text-slate-400" };
}

function metricArrow(delta, goodWhenDown = false) {
  if (Math.abs(delta) < 0.001) return { symbol: "•", cls: "text-slate-400" };
  if (!goodWhenDown) {
    return delta > 0 ? { symbol: "▲", cls: "text-emerald-400" } : { symbol: "▼", cls: "text-rose-400" };
  }
  return delta < 0 ? { symbol: "▼", cls: "text-emerald-400" } : { symbol: "▲", cls: "text-rose-400" };
}

function GlassCard({ className = "", children }) {
  return (
    <div className={"cockpit-orcamentos-glass-card " + className}>
      {children}
    </div>
  );
}

function Pill({ children, tone = "slate" }) {
  const toneMap = {
    slate: "cockpit-orcamentos-pill-slate",
    amber: "cockpit-orcamentos-pill-amber",
    rose: "cockpit-orcamentos-pill-rose",
    emerald: "cockpit-orcamentos-pill-emerald",
    cyan: "cockpit-orcamentos-pill-cyan",
    violet: "cockpit-orcamentos-pill-violet",
    pink: "cockpit-orcamentos-pill-pink",
  };
  return (
    <span className={`cockpit-orcamentos-pill ${toneMap[tone] || toneMap.slate}`}>{children}</span>
  );
}

function Sparkline({ points }) {
  const w = 120;
  const h = 34;
  const max = Math.max(...points, 1);
  const min = Math.min(...points, 0);
  const range = Math.max(1, max - min);
  const d = points
    .map((p, i) => {
      const x = (i / (points.length - 1)) * w;
      const y = h - ((p - min) / range) * h;
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="cockpit-orcamentos-sparkline">
      <path d={d} fill="none" stroke="rgba(148,163,184,.55)" strokeWidth="2" />
      <path d={d} fill="none" stroke="rgba(59,130,246,.55)" strokeWidth="1" />
    </svg>
  );
}

function HealthDial({ score, delta, hist }) {
  const s = clamp(score, 0, 100);
  const d = Math.round(delta);
  const label = s >= 85 ? "Bom" : s >= 70 ? "Ok" : "Ruim";
  const tone = s >= 85 ? "emerald" : s >= 70 ? "amber" : "rose";
  const angle = (s / 100) * 180;
  const w = 140;
  const h = 70;
  const cx = w / 2;
  const cy = h;
  const r = 58;
  const needleLen = 52;
  const rad = (Math.PI * (180 + angle)) / 180;
  const nx = cx + Math.cos(rad) * needleLen;
  const ny = cy + Math.sin(rad) * needleLen;
  return (
    <div className="cockpit-orcamentos-health-dial" title="Health = fila + latência + qualidade + carga clínica">
      <div className="cockpit-orcamentos-health-dial-content">
        <div>
          <div className="cockpit-orcamentos-health-label">Health</div>
          <div className="cockpit-orcamentos-health-value">
            {s}
            <span className={`cockpit-orcamentos-health-delta ${d >= 0 ? "text-emerald-400" : "text-rose-400"}`}>{d >= 0 ? `+${d}` : d}</span>
          </div>
          <div className="cockpit-orcamentos-health-badge"><Pill tone={tone}>{label}</Pill></div>
        </div>
        <div className="cockpit-orcamentos-health-dial-visual">
          <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="cockpit-orcamentos-health-svg">
            <path d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`} stroke="rgba(148,163,184,.25)" strokeWidth="10" fill="none" strokeLinecap="round" />
            <path
              d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
              stroke="rgba(16,185,129,.45)"
              strokeWidth="10"
              fill="none"
              strokeLinecap="round"
              strokeDasharray={`${(angle / 180) * (Math.PI * r)} ${Math.PI * r}`}
            />
            <circle cx={cx} cy={cy} r={6} fill="rgba(255,255,255,.75)" />
            <line x1={cx} y1={cy} x2={nx} y2={ny} stroke="rgba(255,255,255,.85)" strokeWidth={2} />
          </svg>
          <div className="cockpit-orcamentos-health-sparkline">
            <div className="cockpit-orcamentos-health-sparkline-label">tendência</div>
            <Sparkline points={hist} />
          </div>
        </div>
      </div>
    </div>
  );
}

function Tile({ label, value, hint, tone, title, right }) {
  const vTone = tone === "ok" ? "cockpit-orcamentos-tile-value-ok" : tone === "warn" ? "cockpit-orcamentos-tile-value-warn" : tone === "bad" ? "cockpit-orcamentos-tile-value-bad" : "cockpit-orcamentos-tile-value";
  return (
    <div className="cockpit-orcamentos-tile" title={title || ""}>
      <div className="cockpit-orcamentos-tile-header">
        <div className="cockpit-orcamentos-tile-label">{label}</div>
        {right ? <div className="cockpit-orcamentos-tile-right">{right}</div> : null}
      </div>
      <div className={`cockpit-orcamentos-tile-value ${vTone}`}>{value}</div>
      {hint ? <div className="cockpit-orcamentos-tile-hint">{hint}</div> : null}
    </div>
  );
}

const STAGE_TONE = {
  "Em fila": "cyan",
  "Aguardando Farmacêutica": "pink",
  "Aguardando Cliente": "amber",
  "Correção": "rose",
  "Erro": "rose",
  "Orçamento": "cyan",
  "Sem conferência": "rose",
};

function stageTone(stage) {
  return STAGE_TONE[stage] || "slate";
}

function scoreOperator({ feitosHoje, erros, retrabalhoRate, slaMin, targetSlaMin }) {
  const slaPenalty = Math.max(0, (slaMin - targetSlaMin) / targetSlaMin);
  const score = feitosHoje - erros * 2 - retrabalhoRate * 30 - slaPenalty * 10;
  return Math.round(score);
}

export default function CockpitOrcamentos() {
  const targetSlaBudget = 15;
  const targetSlaClinical = 22;
  const roundLabels = ["10h", "12h", "14h", "16h", "18h"];

  const [view, setView] = useState("ops");
  const [dataSelecionada, setDataSelecionada] = useState(() => {
    const hoje = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));
    const ano = hoje.getFullYear();
    const mes = String(hoje.getMonth() + 1).padStart(2, '0');
    const dia = String(hoje.getDate()).padStart(2, '0');
    return `${ano}-${mes}-${dia}`;
  });

  // Controles de tema e fonte
  const [isLightTheme, setIsLightTheme] = useState(() => {
    const saved = localStorage.getItem('cockpit-orcamentos-theme');
    return saved === 'light';
  });
  const [fontSize, setFontSize] = useState(() => {
    const saved = localStorage.getItem('cockpit-orcamentos-font-size');
    return saved || 'md';
  });
  const [showFloatingControls, setShowFloatingControls] = useState(false);
  const floatingControlsRef = useRef(null);

  const [kpis, setKpis] = useState(() => ({
    filaTotal: 32,
    piorCasoParado: 48,
    slaMedioBudget: 11,
    retrabalhoRate: 0.061,
    erros: 4,
    cargaClinica: 10,
    slaClinico: 22,
    healthScore: 89,
    healthDelta: +2,
    trend: {
      filaTotal: 0,
      piorCasoParado: 0,
      slaMedioBudget: 0,
      retrabalhoRate: 0,
      erros: 0,
      cargaClinica: 0,
      slaClinico: 0,
    },
  }));

  const [healthHist, setHealthHist] = useState([84, 86, 85, 88, 89, 90, 89]);

  const [operators, setOperators] = useState(() => [
    { id: "tiago", name: "Tiago", tone: "cyan", emFila: 5, aguardando: 2, feitosHoje: 16, feitosDelta: 0, erros: 1, retrabalhoRate: 0.038, slaMin: 14, slaDelta: 0, clinLoad: 1, semConferencia: 2, spark: [7, 8, 7, 9, 10, 9, 11] },
    { id: "vitor", name: "Vitor", tone: "emerald", emFila: 7, aguardando: 4, feitosHoje: 14, feitosDelta: 0, erros: 2, retrabalhoRate: 0.056, slaMin: 15, slaDelta: 0, clinLoad: 2, semConferencia: 1, spark: [6, 7, 8, 8, 9, 10, 10] },
    { id: "o3", name: "Orçamentista 3", tone: "violet", emFila: 2, aguardando: 3, feitosHoje: 10, feitosDelta: 0, erros: 1, retrabalhoRate: 0.028, slaMin: 16, slaDelta: 0, clinLoad: 2, semConferencia: 3, spark: [5, 5, 6, 6, 7, 7, 8] },
    { id: "pharma", name: "Farmacêutica", tone: "pink", emFila: 4, aguardando: 7, feitosHoje: 23, feitosDelta: 0, erros: 0, retrabalhoRate: 0.125, slaMin: 31, slaDelta: 0, clinLoad: 10, spark: [9, 9, 10, 10, 11, 12, 12] },
  ]);

  const [priorities, setPriorities] = useState(() => [
    { id: "p1", name: "Marcos", stage: "Orçamento", owner: "Tiago", waitMin: 36, tipo: "Compra" },
    { id: "p2", name: "Felipe A", stage: "Aguardando Farmacêutica", owner: "Farmacêutica", waitMin: 32, tipo: "Compra" },
    { id: "p3", name: "Aline", stage: "Aguardando Cliente", owner: "Farmacêutica", waitMin: 41, tipo: "Compra" },
    { id: "p4", name: "Danilo", stage: "Correção", owner: "Orçamentista 3", waitMin: 29, tipo: "Recompra" },
    { id: "p5", name: "Carol", stage: "Sem conferência", owner: "Tiago", waitMin: 27, tipo: "Compra" },
    { id: "p6", name: "Sofia", stage: "Aguardando Farmacêutica", owner: "Vitor", waitMin: 34, tipo: "Recompra" },
    { id: "p7", name: "Rafael", stage: "Em fila", owner: "Vitor", waitMin: 37, tipo: "Compra" },
  ]);

  const [rounds, setRounds] = useState(() => ({
    tiago: { "10h": { feitos: 6, erros: 1, sla: 17 }, "12h": { feitos: 8, erros: 1, sla: 21 }, "14h": { feitos: 5, erros: 2, sla: 18 }, "16h": { feitos: 4, erros: 2, sla: 21 }, "18h": { feitos: 9, erros: 2, sla: 22 } },
    vitor: { "10h": { feitos: 5, erros: 1, sla: 18 }, "12h": { feitos: 8, erros: 1, sla: 20 }, "14h": { feitos: 6, erros: 1, sla: 18 }, "16h": { feitos: 4, erros: 2, sla: 21 }, "18h": { feitos: 7, erros: 2, sla: 22 } },
    o3: { "10h": { feitos: 4, erros: 0, sla: 19 }, "12h": { feitos: 5, erros: 0, sla: 21 }, "14h": { feitos: 2, erros: 1, sla: 20 }, "16h": { feitos: 2, erros: 1, sla: 22 }, "18h": { feitos: 3, erros: 1, sla: 24 } },
    pharma: { "10h": { feitos: 7, erros: 0, sla: 24 }, "12h": { feitos: 10, erros: 0, sla: 26 }, "14h": { feitos: 0, erros: 3, sla: 0 }, "16h": { feitos: 7, erros: 2, sla: 29 }, "18h": { feitos: 17, erros: 2, sla: 31 } },
  }));

  const prevKpisRef = useRef(kpis);

  // Fechar controles ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (floatingControlsRef.current && !floatingControlsRef.current.contains(event.target)) {
        setShowFloatingControls(false);
      }
    };
    if (showFloatingControls) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showFloatingControls]);

  // Aplicar tema
  useEffect(() => {
    const page = document.querySelector('.cockpit-orcamentos-page');
    if (isLightTheme) {
      page?.classList.add('light-theme');
      localStorage.setItem('cockpit-orcamentos-theme', 'light');
    } else {
      page?.classList.remove('light-theme');
      localStorage.setItem('cockpit-orcamentos-theme', 'dark');
    }
  }, [isLightTheme]);

  // Aplicar tamanho de fonte
  useEffect(() => {
    const page = document.querySelector('.cockpit-orcamentos-page');
    if (page) {
      page.classList.remove('font-xs', 'font-sm', 'font-md', 'font-lg', 'font-xl', 'font-xxl', 'font-xxxl', 'font-xxxxl', 'font-xxxxxl');
      page.classList.add(`font-${fontSize}`);
      localStorage.setItem('cockpit-orcamentos-font-size', fontSize);
    }
  }, [fontSize]);

  // Handlers para controles flutuantes
  const toggleTheme = () => {
    setIsLightTheme(!isLightTheme);
  };

  const increaseFontSize = () => {
    const sizes = ['xs', 'sm', 'md', 'lg', 'xl', 'xxl', 'xxxl', 'xxxxl', 'xxxxxl'];
    const currentIndex = sizes.indexOf(fontSize);
    if (currentIndex < sizes.length - 1) {
      setFontSize(sizes[currentIndex + 1]);
    }
  };

  const decreaseFontSize = () => {
    const sizes = ['xs', 'sm', 'md', 'lg', 'xl', 'xxl', 'xxxl', 'xxxxl', 'xxxxxl'];
    const currentIndex = sizes.indexOf(fontSize);
    if (currentIndex > 0) {
      setFontSize(sizes[currentIndex - 1]);
    }
  };

  const computedOperators = useMemo(() => {
    const withScore = operators.map((o) => {
      const isPharma = o.id === "pharma";
      const score = scoreOperator({
        feitosHoje: o.feitosHoje,
        erros: o.erros,
        retrabalhoRate: o.retrabalhoRate,
        slaMin: o.slaMin,
        targetSlaMin: isPharma ? targetSlaClinical : targetSlaBudget,
      });
      return { ...o, score };
    });
    const sorted = [...withScore].sort((a, b) => b.score - a.score);
    const rankMap = new Map(sorted.map((o, idx) => [o.id, idx + 1]));
    return withScore.map((o) => ({ ...o, rank: rankMap.get(o.id) }));
  }, [operators]);

  const headerTrend = {
    fila: trendArrow(kpis.trend.filaTotal),
    parado: trendArrow(-kpis.trend.piorCasoParado),
    sla: trendArrow(-kpis.trend.slaMedioBudget),
    retrabalho: trendArrow(-kpis.trend.retrabalhoRate),
    erros: trendArrow(-kpis.trend.erros),
    clin: trendArrow(-kpis.trend.cargaClinica),
    clinSla: trendArrow(-kpis.trend.slaClinico),
  };

  const compraRecompra = useMemo(() => {
    const compra = priorities.filter((p) => p.tipo === "Compra");
    const recompra = priorities.filter((p) => p.tipo === "Recompra");
    const maxWait = (arr) => (arr.length ? Math.max(...arr.map((x) => x.waitMin)) : 0);
    return {
      compraCount: compra.length,
      compraMax: maxWait(compra),
      recompraCount: recompra.length,
      recompraMax: maxWait(recompra),
    };
  }, [priorities]);

  const orderedRisk = useMemo(() => {
    const score = (p) => p.waitMin + (p.tipo === "Compra" ? 12 : 0);
    return [...priorities].sort((a, b) => score(b) - score(a));
  }, [priorities]);

  const weeklyMonthly = useMemo(() => {
    return {
      week: { feitos: 312, retrabalho: 0.064, erros: 21, sla: 14 },
      month: { feitos: 1218, retrabalho: 0.058, erros: 86, sla: 15 },
    };
  }, []);

  useEffect(() => {
    const t = setInterval(() => {
      setPriorities((prev) => {
        const updated = prev
          .map((p) => ({ ...p, waitMin: clamp(p.waitMin + (Math.random() < 0.65 ? 1 : 0), 0, 240) }))
          .sort((a, b) => b.waitMin - a.waitMin);
        return updated;
      });

      setKpis((prev) => {
        const next = { ...prev };
        const varyInt = (v, amp, min, max) => clamp(v + (Math.random() - 0.5) * amp, min, max);
        const varyPct = (v, amp, min, max) => clamp(v + (Math.random() - 0.5) * amp, min, max);

        next.filaTotal = Math.round(varyInt(prev.filaTotal, 2.2, 10, 120));
        next.piorCasoParado = Math.round(varyInt(prev.piorCasoParado, 3.0, 5, 240));
        next.slaMedioBudget = Math.round(varyInt(prev.slaMedioBudget, 1.2, 5, 60));
        next.retrabalhoRate = varyPct(prev.retrabalhoRate, 0.01, 0.01, 0.35);
        next.erros = Math.round(varyInt(prev.erros, 1.6, 0, 25));
        next.cargaClinica = Math.round(varyInt(prev.cargaClinica, 1.8, 0, 80));
        next.slaClinico = Math.round(varyInt(prev.slaClinico, 1.8, 5, 120));

        let hs = 100;
        hs -= clamp((next.filaTotal - 20) * 0.6, 0, 25);
        hs -= clamp((next.piorCasoParado - 30) * 0.4, 0, 25);
        hs -= clamp(next.retrabalhoRate * 100 * 0.8, 0, 20);
        hs -= clamp(next.erros * 1.5, 0, 15);
        hs -= clamp(next.cargaClinica * 0.8, 0, 15);
        hs -= clamp((next.slaClinico - targetSlaClinical) * 0.5, 0, 15);
        hs = Math.round(clamp(hs, 0, 100));

        next.healthDelta = hs - prev.healthScore;
        next.healthScore = hs;

        const prevK = prevKpisRef.current;
        next.trend = {
          filaTotal: next.filaTotal - prevK.filaTotal,
          piorCasoParado: next.piorCasoParado - prevK.piorCasoParado,
          slaMedioBudget: next.slaMedioBudget - prevK.slaMedioBudget,
          retrabalhoRate: next.retrabalhoRate - prevK.retrabalhoRate,
          erros: next.erros - prevK.erros,
          cargaClinica: next.cargaClinica - prevK.cargaClinica,
          slaClinico: next.slaClinico - prevK.slaClinico,
        };

        prevKpisRef.current = next;
        setHealthHist((h) => [...h.slice(1), hs]);
        return next;
      });

      setOperators((prev) =>
        prev.map((o) => {
          const jitter = (amp) => (Math.random() - 0.5) * amp;
          const isPharma = o.id === "pharma";
          const feitosAdd = Math.random() < (isPharma ? 0.45 : 0.35) ? 1 : 0;
          const newFeitos = Math.round(clamp(o.feitosHoje + feitosAdd, 0, 220));
          const newSla = Math.round(clamp(o.slaMin + jitter(2.0), 5, 120));
          const pushSpark = (arr, value) => [...arr.slice(1), value];

          return {
            ...o,
            emFila: Math.round(clamp(o.emFila + jitter(2.0), 0, 40)),
            aguardando: Math.round(clamp(o.aguardando + jitter(2.4), 0, 40)),
            feitosHoje: newFeitos,
            feitosDelta: newFeitos - o.feitosHoje,
            erros: Math.round(clamp(o.erros + jitter(1.2), 0, 30)),
            retrabalhoRate: clamp(o.retrabalhoRate + jitter(0.02), 0.01, 0.35),
            slaMin: newSla,
            slaDelta: newSla - o.slaMin,
            clinLoad: Math.round(clamp((o.clinLoad ?? 0) + jitter(1.2), 0, 80)),
            semConferencia: isPharma ? undefined : Math.round(clamp((o.semConferencia ?? 0) + jitter(1.0), 0, 25)),
            spark: pushSpark(o.spark, (o.spark[o.spark.length - 1] ?? 8) + (Math.random() < 0.6 ? 1 : 0)),
          };
        })
      );

      setRounds((prev) => {
        const next = JSON.parse(JSON.stringify(prev));
        const ids = ["tiago", "vitor", "o3", "pharma"];
        const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
        const h = pick(roundLabels);
        const id = pick(ids);
        const cell = next[id][h];
        cell.feitos = clamp(cell.feitos + (Math.random() < 0.5 ? 0 : 1), 0, 30);
        cell.erros = clamp(cell.erros + (Math.random() < 0.85 ? 0 : 1), 0, 10);
        if (cell.feitos > 0) cell.sla = clamp(cell.sla + (Math.random() - 0.5) * 2, 8, 45);
        return next;
      });
    }, 1400);

    return () => clearInterval(t);
  }, [roundLabels, targetSlaClinical]);

  const tabs = (
    <div className="cockpit-orcamentos-tabs">
      <button
        onClick={() => setView("ops")}
        className={`cockpit-orcamentos-tab ${view === "ops" ? "active" : ""}`}
      >
        Operação
      </button>
      <button
        onClick={() => setView("rondas")}
        className={`cockpit-orcamentos-tab ${view === "rondas" ? "active" : ""}`}
      >
        Rondas
      </button>
    </div>
  );

  const TopKpis = (
    <GlassCard className="cockpit-orcamentos-top-kpis">
      <div className="cockpit-orcamentos-kpis-grid">
        <div className="cockpit-orcamentos-kpi-item">
          <div className="cockpit-orcamentos-kpi-header">
            <span>Fila total</span>
            <span className={headerTrend.fila.cls}>{headerTrend.fila.symbol}</span>
          </div>
          <div className="cockpit-orcamentos-kpi-value">{kpis.filaTotal}</div>
          <div className="cockpit-orcamentos-kpi-hint">cases</div>
        </div>

        <div className="cockpit-orcamentos-kpi-item">
          <div className="cockpit-orcamentos-kpi-header">
            <span>Tempo parado (max)</span>
            <span className={headerTrend.parado.cls}>{headerTrend.parado.symbol}</span>
          </div>
          <div className="cockpit-orcamentos-kpi-value">{fmtMin(kpis.piorCasoParado)}</div>
          <div className="cockpit-orcamentos-kpi-hint">pior caso</div>
        </div>

        <div className="cockpit-orcamentos-kpi-item">
          <div className="cockpit-orcamentos-kpi-header">
            <span>SLA médio</span>
            <span className={headerTrend.sla.cls}>{headerTrend.sla.symbol}</span>
          </div>
          <div className="cockpit-orcamentos-kpi-value">{fmtMin(kpis.slaMedioBudget)}</div>
          <div className="cockpit-orcamentos-kpi-hint">meta {fmtMin(targetSlaBudget)}</div>
        </div>

        <div className="cockpit-orcamentos-kpi-item">
          <div className="cockpit-orcamentos-kpi-header">
            <span>Retrabalho</span>
            <span className={headerTrend.retrabalho.cls}>{headerTrend.retrabalho.symbol}</span>
          </div>
          <div className="cockpit-orcamentos-kpi-value">{pct(kpis.retrabalhoRate)}</div>
          <div className="cockpit-orcamentos-kpi-hint">qualidade</div>
        </div>

        <div className="cockpit-orcamentos-kpi-item">
          <div className="cockpit-orcamentos-kpi-header">
            <span>Erros</span>
            <span className={headerTrend.erros.cls}>{headerTrend.erros.symbol}</span>
          </div>
          <div className="cockpit-orcamentos-kpi-value">{kpis.erros}</div>
          <div className="cockpit-orcamentos-kpi-hint">falhas</div>
        </div>

        <div className="cockpit-orcamentos-kpi-item">
          <div className="cockpit-orcamentos-kpi-header">
            <span>Carga clínica</span>
            <span className={headerTrend.clin.cls}>{headerTrend.clin.symbol}</span>
          </div>
          <div className="cockpit-orcamentos-kpi-value">{kpis.cargaClinica}</div>
          <div className="cockpit-orcamentos-kpi-hint">dúvidas</div>
        </div>

        <div className="cockpit-orcamentos-kpi-item">
          <div className="cockpit-orcamentos-kpi-header">
            <span>SLA clínico</span>
            <span className={headerTrend.clinSla.cls}>{headerTrend.clinSla.symbol}</span>
          </div>
          <div className="cockpit-orcamentos-kpi-value">{fmtMin(kpis.slaClinico)}</div>
          <div className="cockpit-orcamentos-kpi-hint">meta {fmtMin(targetSlaClinical)}</div>
        </div>

        <HealthDial score={kpis.healthScore} delta={kpis.healthDelta} hist={healthHist} />
      </div>
    </GlassCard>
  );

  const OperatorCards = (
    <div className="cockpit-orcamentos-operators-grid">
      {computedOperators.map((o) => {
        const isPharma = o.id === "pharma";
        const target = isPharma ? targetSlaClinical : targetSlaBudget;
        const badge = o.rank === 1 ? "#1" : o.rank === 2 ? "#2" : o.rank === 3 ? "#3" : "#4";
        const badgeTone = o.rank === 1 ? "amber" : o.rank === 2 ? "slate" : o.rank === 3 ? "slate" : "rose";
        const dotCls = o.tone === "cyan" ? "cockpit-orcamentos-operator-dot-cyan" : o.tone === "emerald" ? "cockpit-orcamentos-operator-dot-emerald" : o.tone === "violet" ? "cockpit-orcamentos-operator-dot-violet" : "cockpit-orcamentos-operator-dot-pink";
        const feitosA = metricArrow(o.feitosDelta, false);
        const slaA = metricArrow(o.slaDelta, true);

        return (
          <GlassCard key={o.id} className="cockpit-orcamentos-operator-card">
            <div className="cockpit-orcamentos-operator-header">
              <div className="cockpit-orcamentos-operator-info">
                <div className={`cockpit-orcamentos-operator-avatar ${dotCls}`}>
                  <div className={`cockpit-orcamentos-operator-dot ${dotCls}`} />
                </div>
                <div>
                  <div className="cockpit-orcamentos-operator-name">{o.name}</div>
                  <div className="cockpit-orcamentos-operator-score">Score {o.score}</div>
                </div>
              </div>
              <div className="cockpit-orcamentos-operator-badges">
                <Sparkline points={o.spark} />
                <Pill tone={badgeTone}>{badge}</Pill>
              </div>
            </div>

            <div className="cockpit-orcamentos-operator-tiles">
              <Tile
                label={isPharma ? "Resolvidas hoje" : "Feitos hoje"}
                value={o.feitosHoje}
                right={<span className={feitosA.cls}>{feitosA.symbol}</span>}
              />
              <Tile
                label="SLA"
                value={fmtMin(o.slaMin)}
                tone={o.slaMin <= target ? "ok" : o.slaMin <= target * 1.4 ? "warn" : "bad"}
                hint={`meta ${fmtMin(target)}`}
                right={<span className={slaA.cls}>{slaA.symbol}</span>}
              />
              <Tile label="Em fila" value={o.emFila} title="Não iniciado" />
              <Tile label="Aguardando" value={o.aguardando} title="Iniciado e travado" />
              <Tile label="Erros" value={o.erros} tone={o.erros > 4 ? "warn" : "ok"} />
              <Tile label="Retrabalho" value={pct(o.retrabalhoRate)} tone={o.retrabalhoRate > 0.08 ? "warn" : "ok"} />
              <Tile label={isPharma ? "Dúvidas" : "Pendências clínicas"} value={o.clinLoad} />
              <Tile label="Sem conferência" value={isPharma ? "—" : (o.semConferencia ?? 0)} tone={!isPharma && (o.semConferencia ?? 0) > 3 ? "warn" : "ok"} />
            </div>
          </GlassCard>
        );
      })}
    </div>
  );

  const Priorities = (
    <GlassCard className="cockpit-orcamentos-priorities">
      <div className="cockpit-orcamentos-priorities-header">
        <div>
          <div className="cockpit-orcamentos-priorities-subtitle">Fila de risco</div>
          <div className="cockpit-orcamentos-priorities-title">Tempo parado + tipo (Compra/Recompra)</div>
        </div>
        <div className="cockpit-orcamentos-priorities-stats">
          <div className="cockpit-orcamentos-priority-stat">
            <div className="cockpit-orcamentos-priority-stat-label">Compra</div>
            <div className="cockpit-orcamentos-priority-stat-value">{compraRecompra.compraCount} • max {fmtMin(compraRecompra.compraMax)}</div>
          </div>
          <div className="cockpit-orcamentos-priority-stat">
            <div className="cockpit-orcamentos-priority-stat-label">Recompra</div>
            <div className="cockpit-orcamentos-priority-stat-value">{compraRecompra.recompraCount} • max {fmtMin(compraRecompra.recompraMax)}</div>
          </div>
          <Pill tone="amber">Compra prioriza</Pill>
        </div>
      </div>

      <div className="cockpit-orcamentos-priorities-table-wrapper">
        <table className="cockpit-orcamentos-priorities-table">
          <thead>
            <tr>
              <th>Lead</th>
              <th>Tipo</th>
              <th>Etapa</th>
              <th>Responsável</th>
              <th>Tempo parado</th>
              <th>SLA</th>
            </tr>
          </thead>
          <tbody>
            {orderedRisk.slice(0, 18).map((p) => {
              const nearSla = p.waitMin >= targetSlaBudget * 1.2;
              const overSla = p.waitMin >= targetSlaBudget * 1.8;
              return (
                <tr key={p.id}>
                  <td className="cockpit-orcamentos-priority-name">{p.name}</td>
                  <td><Pill tone={p.tipo === "Compra" ? "cyan" : "slate"}>{p.tipo}</Pill></td>
                  <td><Pill tone={stageTone(p.stage)}>{p.stage}</Pill></td>
                  <td className="cockpit-orcamentos-priority-owner">{p.owner}</td>
                  <td className={`cockpit-orcamentos-priority-wait ${overSla ? "over" : nearSla ? "near" : "ok"}`}>{fmtMin(p.waitMin)}</td>
                  <td>
                    <Pill tone={overSla ? "rose" : nearSla ? "amber" : "emerald"}>{overSla ? "Estourado" : nearSla ? "Perto" : "Dentro"}</Pill>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="cockpit-orcamentos-priorities-footer">Tela de bumbo: risco e tempo parado primeiro.</div>
    </GlassCard>
  );

  const RondasView = (
    <div className="cockpit-orcamentos-rondas-grid">
      <div className="cockpit-orcamentos-rondas-main">
        <GlassCard className="cockpit-orcamentos-rondas-card">
          <div className="cockpit-orcamentos-rondas-header">
            <div>
              <div className="cockpit-orcamentos-rondas-subtitle">Rondas</div>
              <div className="cockpit-orcamentos-rondas-title">Controle por janela (10h, 12h, 14h, 16h, 18h)</div>
            </div>
            <Pill tone="slate">Diário • Semanal • Mensal</Pill>
          </div>

          <div className="cockpit-orcamentos-rondas-hours">
            {roundLabels.map((h) => {
              const ids = ["tiago", "vitor", "o3", "pharma"];
              const totalFeitos = ids.reduce((acc, id) => acc + rounds[id][h].feitos, 0);
              const totalErros = ids.reduce((acc, id) => acc + rounds[id][h].erros, 0);
              const slaVals = ids.map((id) => rounds[id][h].sla).filter((x) => x > 0);
              const avgSla = slaVals.length ? Math.round(slaVals.reduce((a, b) => a + b, 0) / slaVals.length) : 0;

              return (
                <div key={h} className="cockpit-orcamentos-ronda-hour">
                  <div className="cockpit-orcamentos-ronda-hour-header">
                    <div className="cockpit-orcamentos-ronda-hour-label">{h}</div>
                    <Pill tone="slate">{totalFeitos} feitos</Pill>
                  </div>
                  <div className="cockpit-orcamentos-ronda-hour-details">
                    Erros: <span className="cockpit-orcamentos-ronda-hour-value">{totalErros}</span> • SLA: <span className="cockpit-orcamentos-ronda-hour-value">{avgSla ? fmtMin(avgSla) : "-"}</span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="cockpit-orcamentos-rondas-summary">
            <div className="cockpit-orcamentos-rondas-summary-card">
              <div className="cockpit-orcamentos-rondas-summary-title">Resumo semanal</div>
              <div className="cockpit-orcamentos-rondas-summary-grid">
                <div>
                  <div className="cockpit-orcamentos-rondas-summary-label">Feitos</div>
                  <div className="cockpit-orcamentos-rondas-summary-value">{weeklyMonthly.week.feitos}</div>
                </div>
                <div>
                  <div className="cockpit-orcamentos-rondas-summary-label">SLA</div>
                  <div className="cockpit-orcamentos-rondas-summary-value">{fmtMin(weeklyMonthly.week.sla)}</div>
                </div>
                <div>
                  <div className="cockpit-orcamentos-rondas-summary-label">Erros</div>
                  <div className="cockpit-orcamentos-rondas-summary-value">{weeklyMonthly.week.erros}</div>
                </div>
                <div>
                  <div className="cockpit-orcamentos-rondas-summary-label">Retrabalho</div>
                  <div className="cockpit-orcamentos-rondas-summary-value">{pct(weeklyMonthly.week.retrabalho)}</div>
                </div>
              </div>
            </div>

            <div className="cockpit-orcamentos-rondas-summary-card">
              <div className="cockpit-orcamentos-rondas-summary-title">Resumo mensal</div>
              <div className="cockpit-orcamentos-rondas-summary-grid">
                <div>
                  <div className="cockpit-orcamentos-rondas-summary-label">Feitos</div>
                  <div className="cockpit-orcamentos-rondas-summary-value">{weeklyMonthly.month.feitos}</div>
                </div>
                <div>
                  <div className="cockpit-orcamentos-rondas-summary-label">SLA</div>
                  <div className="cockpit-orcamentos-rondas-summary-value">{fmtMin(weeklyMonthly.month.sla)}</div>
                </div>
                <div>
                  <div className="cockpit-orcamentos-rondas-summary-label">Erros</div>
                  <div className="cockpit-orcamentos-rondas-summary-value">{weeklyMonthly.month.erros}</div>
                </div>
                <div>
                  <div className="cockpit-orcamentos-rondas-summary-label">Retrabalho</div>
                  <div className="cockpit-orcamentos-rondas-summary-value">{pct(weeklyMonthly.month.retrabalho)}</div>
                </div>
              </div>
            </div>
          </div>
        </GlassCard>
      </div>

      <div className="cockpit-orcamentos-rondas-sidebar">
        <GlassCard className="cockpit-orcamentos-rondas-sidebar-card">
          <div className="cockpit-orcamentos-rondas-sidebar-subtitle">Análise (placeholder)</div>
          <div className="cockpit-orcamentos-rondas-sidebar-title">Pontos de atenção</div>
          <div className="cockpit-orcamentos-rondas-sidebar-content">
            <div className="cockpit-orcamentos-rondas-sidebar-item">Compra: responda mais rápido (SLA de risco).</div>
            <div className="cockpit-orcamentos-rondas-sidebar-item">Reduza "Sem conferência" para cortar retrabalho e erro.</div>
            <div className="cockpit-orcamentos-rondas-sidebar-item">SLA clínico impacta diretamente o throughput do setor.</div>
          </div>
        </GlassCard>
      </div>
    </div>
  );

  return (
    <div className="cockpit-orcamentos-page">
      <div className="cockpit-orcamentos-bg-gradient" />
      <div className="cockpit-orcamentos-container">
        <div className="cockpit-orcamentos-header">
          <div className="cockpit-orcamentos-header-left">
            <img src={LogoOficialmed} alt="OficialMed" className="cockpit-orcamentos-logo" />
          </div>
          <div className="cockpit-orcamentos-header-center">
            <h1 className="cockpit-orcamentos-title">Cockpit – Orçamentos</h1>
          </div>
          <div className="cockpit-orcamentos-header-right">
            {tabs}
            <div className="cockpit-orcamentos-date-filter">
              <label htmlFor="data-filtro-orcamentos">Data:</label>
              <input
                id="data-filtro-orcamentos"
                type="date"
                value={dataSelecionada}
                onChange={(e) => setDataSelecionada(e.target.value)}
              />
            </div>
            <div className="cockpit-orcamentos-auto-refresh">Auto-refresh (simulação)</div>
          </div>
        </div>

        <div className="cockpit-orcamentos-content">
          <div className="cockpit-orcamentos-top-section">{TopKpis}</div>

          {view === "ops" ? (
            <>
              <div className="cockpit-orcamentos-operators-section">{OperatorCards}</div>
              <div className="cockpit-orcamentos-priorities-section">{Priorities}</div>
            </>
          ) : (
            <div className="cockpit-orcamentos-rondas-section">{RondasView}</div>
          )}

          <div className="cockpit-orcamentos-footer">Simulação ativa: valores variam automaticamente para demonstrar painel vivo.</div>
        </div>
      </div>

      {/* Controle Flutuante */}
      <div className="cockpit-orcamentos-floating-controls" ref={floatingControlsRef}>
        <button
          className="cockpit-orcamentos-floating-controls-toggle"
          onClick={() => setShowFloatingControls(!showFloatingControls)}
          aria-label="Abrir controles"
        >
          <SlidersHorizontal size={18} />
        </button>
        {showFloatingControls && (
          <div className="cockpit-orcamentos-floating-controls-menu">
            <button
              className="cockpit-orcamentos-floating-controls-option"
              onClick={toggleTheme}
              aria-label={isLightTheme ? 'Alternar para tema escuro' : 'Alternar para tema claro'}
            >
              {isLightTheme ? <Moon size={18} /> : <Sun size={18} />}
            </button>
            <button
              className="cockpit-orcamentos-floating-controls-option"
              onClick={increaseFontSize}
              disabled={fontSize === 'xxxxxl'}
              aria-label="Aumentar tamanho da fonte"
            >
              <Plus size={18} />
            </button>
            <button
              className="cockpit-orcamentos-floating-controls-option"
              onClick={decreaseFontSize}
              disabled={fontSize === 'xs'}
              aria-label="Diminuir tamanho da fonte"
            >
              <Minus size={18} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

