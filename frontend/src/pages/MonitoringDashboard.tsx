import { useState, useEffect, useCallback } from "react";
import Layout from "../components/Layout";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

const STAGE_COLORS: Record<string, string> = {
  retrieval: "#adc6ff",
  rerank: "#44e2cd",
  llm: "#ffb4ab",
  total: "#b7c8e1",
};

const STAGE_LABELS: Record<string, string> = {
  retrieval: "Hybrid Retrieval",
  rerank: "Cross-Encoder Rerank",
  llm: "LLM Generation",
  total: "Total (end-to-end)",
};


function CitationGauge({ rate }: { rate: number }) {
  const pct = Math.round(rate * 100);
  const color = pct >= 80 ? "#44e2cd" : pct >= 60 ? "#EF9F27" : "#ffb4ab";
  const r = 42, cx = 54, cy = 54;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  return (
    <div className="flex items-center gap-5">
      <svg width={108} height={108} viewBox="0 0 108 108">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(66,71,84,0.5)" strokeWidth={10} />
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth={10}
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
          transform={`rotate(-90 ${cx} ${cy})`} />
        <text x={cx} y={cy + 6} textAnchor="middle" fontSize={18} fontWeight={700} fill={color}>{pct}%</text>
      </svg>
      <div>
        <div className="text-sm font-semibold text-on-surface">Citation pass rate</div>
        <div className="text-xs text-on-surface-variant mt-1">
          {pct >= 80 ? "✅ Healthy" : pct >= 60 ? "⚠️ Needs attention" : "❌ Below threshold"}
        </div>
        <div className="text-xs text-on-surface-variant/50 mt-1">Target: ≥ 80%</div>
      </div>
    </div>
  );
}

function TraceRow({ trace }: { trace: any }) {
  const [open, setOpen] = useState(false);
  const ms = trace.total_ms ? `${Math.round(trace.total_ms)}ms` : "—";
  const cost = trace.cost_usd ? `$${trace.cost_usd.toFixed(5)}` : "—";
  const statusColor = trace.error ? "text-red-400" : trace.citation_passed ? "text-[#44e2cd]" : "text-yellow-400";
  const statusLabel = trace.error ? "ERROR" : trace.citation_passed ? "PASS" : "WARN";
  return (
    <div className="border-b border-white/5 last:border-0">
      <div
        onClick={() => setOpen(o => !o)}
        className={`grid gap-3 px-4 py-3 cursor-pointer text-sm items-center transition-colors hover:bg-white/[0.04] ${open ? "bg-white/[0.04]" : ""}`}
        style={{ gridTemplateColumns: "1fr 80px 90px 80px 72px" }}
      >
        <span className="text-white/80 truncate">{trace.query}</span>
        <span className="text-white/40 font-mono text-xs">{ms}</span>
        <span className="text-white/40 font-mono text-xs">{cost}</span>
        <span className="text-white/40 font-mono text-xs">
          {trace.citation_density ? `${Math.round(trace.citation_density * 100)}%` : "—"}
        </span>
        <span className={`text-xs font-bold uppercase ${statusColor}`}>{statusLabel}</span>
      </div>
      {open && (
        <div className="px-4 pb-3 bg-black/20 text-xs font-mono space-y-1">
          <div className="text-white/40">Trace ID: <span className="text-[#adc6ff]">{trace.trace_id}</span></div>
          <div className="text-white/40">Session: <span className="text-white/80">{trace.session_id}</span></div>
          {trace.error && <div className="text-red-400">Error: {trace.error}</div>}
        </div>
      )}
    </div>
  );
}

export default function MonitoringDashboard() {
  const [summary, setSummary] = useState<any>(null);
  const [traces, setTraces] = useState<any[]>([]);
  const [latency, setLatency] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    try {
      setError(null);
      const [sumRes, traceRes, latRes] = await Promise.all([
        fetch(`${API_BASE}/metrics/summary`),
        fetch(`${API_BASE}/metrics/traces?limit=30`),
        fetch(`${API_BASE}/metrics/latency`),
      ]);
      if (sumRes.ok) setSummary(await sumRes.json());
      if (traceRes.ok) setTraces((await traceRes.json()).traces || []);
      if (latRes.ok) setLatency(await latRes.json());
      setLastRefresh(new Date());
    } catch (e) {
      setError("Cannot connect to backend. Make sure the FastAPI server is running on port 8000.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);
  useEffect(() => {
    if (!autoRefresh) return;
    const t = setInterval(fetchAll, 10000);
    return () => clearInterval(t);
  }, [autoRefresh, fetchAll]);

  const q = summary?.quality || {};
  const cost = summary?.cost || {};
  const errorRate = summary?.error_rate != null ? `${(summary.error_rate * 100).toFixed(1)}%` : "—";

  return (
    <Layout title="Monitoring">
      <div className="p-4 lg:p-8 max-w-6xl mx-auto pb-24 md:pb-8 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-2xl font-semibold text-white tracking-tight">RAG Observability</h1>
            <p className="text-white/40 text-sm mt-1">
              Live pipeline metrics — Updated {lastRefresh.toLocaleTimeString()}
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setAutoRefresh(a => !a)}
              className={`px-4 py-2 rounded-lg border text-sm transition-colors ${autoRefresh ? "border-[#adc6ff]/40 text-[#adc6ff] bg-[#adc6ff]/10" : "border-white/20 text-white/40"}`}
            >
              {autoRefresh ? "⏸ Auto-refresh ON" : "▶ Auto-refresh OFF"}
            </button>
            <button
              onClick={fetchAll}
              className="px-4 py-2 rounded-lg border border-white/20 text-white/80 text-sm hover:bg-white/10 transition-colors"
            >
              ↺ Refresh
            </button>
          </div>
        </div>

        {/* Error banner */}
        {error && (
          <div className="bg-red-400/10 border border-red-400/30 rounded-xl p-4 text-red-400 text-sm flex items-center gap-3">
            <span className="material-symbols-outlined text-[20px]">warning</span>
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center h-64 text-on-surface-variant">
            <span className="material-symbols-outlined animate-spin mr-3">sync</span> Loading metrics…
          </div>
        ) : (
          <>
            {/* Summary KPI cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-[#171717] border border-white/10 rounded-2xl p-5 flex flex-col gap-1">
                <span className="text-[10px] text-white/40 uppercase tracking-widest font-semibold">Total Requests</span>
                <span className="text-3xl font-bold font-mono text-white">{summary?.total_requests ?? "—"}</span>
                <span className="text-[11px] text-white/30">{summary?.successful ?? 0} successful</span>
              </div>
              <div className="bg-[#171717] border border-white/10 rounded-2xl p-5 flex flex-col gap-1">
                <span className="text-[10px] text-white/40 uppercase tracking-widest font-semibold">Error Rate</span>
                <span className={`text-3xl font-bold font-mono ${summary?.error_rate > 0.05 ? "text-red-400" : "text-white"}`}>{errorRate}</span>
                <span className="text-[11px] text-white/30">{summary?.failed ?? 0} failed</span>
              </div>
              <div className="bg-[#171717] border border-white/10 rounded-2xl p-5 flex flex-col gap-1">
                <span className="text-[10px] text-white/40 uppercase tracking-widest font-semibold">Total Cost</span>
                <span className="text-3xl font-bold font-mono text-white">${(cost.total_usd ?? 0).toFixed(4)}</span>
                <span className="text-[11px] text-white/30">~${(cost.avg_per_request_usd ?? 0).toFixed(5)} / req</span>
              </div>
              <div className="bg-[#171717] border border-white/10 rounded-2xl p-5 flex flex-col gap-1">
                <span className="text-[10px] text-white/40 uppercase tracking-widest font-semibold">Avg Chunks</span>
                <span className="text-3xl font-bold font-mono text-white">{q.avg_chunks_retrieved ?? "—"}</span>
                <span className="text-[11px] text-white/30">→ {q.avg_chunks_after_rerank ?? "—"} after rerank</span>
              </div>
            </div>

            {/* Latency + Quality */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Latency breakdown */}
              <div className="bg-[#171717] border border-white/10 rounded-2xl p-6">
                <h2 className="text-xs font-bold text-white/60 uppercase tracking-widest mb-5">
                  Latency Breakdown (p50 / p95)
                </h2>
                {latency
                  ? Object.entries(STAGE_COLORS).map(([stage, color]) => {
                      const st = latency[stage] || {};
                      const maxMs = 4000;
                      return (
                        <div key={stage} className="py-3 border-b border-white/5 last:border-0">
                          <div className="flex justify-between text-sm mb-2">
                            <span className="font-medium text-white/80">{STAGE_LABELS[stage] || stage}</span>
                            <span className="text-white/40 font-mono text-xs">
                              p50: <b className="text-white/80">{st.p50 ?? 0}ms</b> &nbsp; p95: <b className="text-white/80">{st.p95 ?? 0}ms</b>
                            </span>
                          </div>
                          <div className="relative h-2 bg-white/5 rounded-full overflow-hidden">
                            <div className="absolute inset-y-0 left-0 rounded-full opacity-60"
                              style={{ width: `${Math.min(((st.p50 ?? 0) / maxMs) * 100, 100)}%`, background: color }} />
                            <div className="absolute inset-y-0 left-0 rounded-full opacity-25"
                              style={{ width: `${Math.min(((st.p95 ?? 0) / maxMs) * 100, 100)}%`, background: color }} />
                          </div>
                        </div>
                      );
                    })
                  : <div className="text-white/40 text-sm">No latency data yet — make a query.</div>}
              </div>

              {/* Quality */}
              <div className="bg-[#171717] border border-white/10 rounded-2xl p-6">
                <h2 className="text-xs font-bold text-white/60 uppercase tracking-widest mb-5">Answer Quality</h2>
                <CitationGauge rate={q.citation_pass_rate ?? 0} />
                <div className="grid grid-cols-2 gap-4 mt-6">
                  <div className="bg-white/[0.02] border border-white/[0.05] rounded-xl p-4">
                    <div className="text-[10px] text-white/40 uppercase tracking-widest mb-1">Citation Density</div>
                    <div className="text-2xl font-bold font-mono text-[#adc6ff]">
                      {q.avg_citation_density != null ? `${Math.round(q.avg_citation_density * 100)}%` : "—"}
                    </div>
                  </div>
                  <div className="bg-white/[0.02] border border-white/[0.05] rounded-xl p-4">
                    <div className="text-[10px] text-white/40 uppercase tracking-widest mb-1">Rerank Compression</div>
                    <div className="text-2xl font-bold font-mono text-[#44e2cd]">
                      {q.avg_chunks_retrieved && q.avg_chunks_after_rerank
                        ? `${Math.round((1 - q.avg_chunks_after_rerank / q.avg_chunks_retrieved) * 100)}%`
                        : "—"}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Traces */}
            <div className="bg-[#171717] border border-white/10 rounded-2xl overflow-hidden">
              <div className="px-5 py-4 border-b border-white/5 flex items-center gap-2">
                <span className="material-symbols-outlined text-white/40 text-[18px]">receipt_long</span>
                <h2 className="text-xs font-bold text-white/60 uppercase tracking-widest">Recent Traces</h2>
                <span className="ml-auto text-[11px] text-white/30">{traces.length} shown</span>
              </div>
              {/* Table header */}
              <div
                className="grid gap-3 px-4 py-2.5 text-[10px] text-white/40 uppercase tracking-widest border-b border-white/5 bg-white/[0.02]"
                style={{ gridTemplateColumns: "1fr 80px 90px 80px 72px" }}
              >
                <span>Query</span><span>Latency</span><span>Cost</span><span>Citations</span><span>Status</span>
              </div>
              {traces.length === 0 ? (
                <div className="p-8 text-center text-white/40 text-sm">
                  No traces yet — send a query to see live data here.
                </div>
              ) : (
                traces.map(t => <TraceRow key={t.trace_id} trace={t} />)
              )}
            </div>

            {/* CI Gates reference */}
            <div className="bg-[#171717] border border-white/10 rounded-2xl p-6">
              <h2 className="text-xs font-bold text-white/60 uppercase tracking-widest mb-4">
                CI Quality Gates
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {[
                  { label: "Answer Relevance", threshold: "≥ 70%", metric: null },
                  { label: "Citation Pass Rate", threshold: "≥ 80%", metric: q.citation_pass_rate != null ? Math.round(q.citation_pass_rate * 100) : null },
                  { label: "Retrieval Recall@5", threshold: "≥ 65%", metric: null },
                  { label: "Avg Latency", threshold: "≤ 3000ms", metric: latency?.total?.mean ? Math.round(latency.total.mean) : null },
                  { label: "Hallucination Rate", threshold: "≤ 10%", metric: null },
                ].map(gate => (
                  <div key={gate.label} className="bg-white/[0.02] border border-white/[0.05] rounded-xl p-3">
                    <div className="text-[10px] text-white/40 uppercase tracking-widest mb-1">{gate.label}</div>
                    <div className="text-sm font-bold text-white/80">{gate.threshold}</div>
                    {gate.metric != null && (
                      <div className="text-xs font-mono mt-1 text-[#44e2cd]">Current: {gate.metric}{gate.label.includes("Latency") ? "ms" : "%"}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}
