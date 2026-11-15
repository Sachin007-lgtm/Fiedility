import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { motion, AnimatePresence } from 'motion/react';
import {
  Send, Loader2, Plus, MessageSquare,
  Paperclip, Brain, Trash2, X, Globe, Upload,
  Sparkles, FileText, ExternalLink, ChevronRight,
  Zap, RefreshCw, Calculator
} from 'lucide-react';
import Layout from '../components/Layout';

/* ─── Types ─────────────────────────────────────────────── */
interface Citation {
  content?: string;
  fund_name?: string;
  page?: string | number;
  source?: string;
  excerpt?: string;
  url?: string;
  title?: string;
  chunk_id?: string;
}

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  time: string;
  citations?: { internal: Citation[]; web: Citation[] };
  financial_computation?: {
    calculation_type?: string;
    company?: string;
    metric?: string;
    period_1?: string;
    period_2?: string;
    value_1?: number;
    value_2?: number;
    unit?: string;
    result?: any;
    verified_statement?: string;
  };
  traceInfo?: {
    latency_ms?: number;
    cost_usd?: number;
    chunks_retrieved?: number;
    chunks_after_rerank?: number;
  };
}

interface Session {
  id: string;
  title: string;
  fundName?: string;
  messages: Message[];
}

const QUICK_PROMPTS = [
  "What is the management fee and total expense ratio?",
  "What are the principal investment strategies and risks?",
  "Summarize the fund's historical performance vs benchmark",
  "Who is the portfolio manager and how are assets allocated?"
];

export default function ResearchWorkspace() {
  const [user] = useState(() => {
    try { return JSON.parse(localStorage.getItem('alfa_user') || '{}'); }
    catch { return {}; }
  });

  /* sessions */
  const [sessions, setSessions] = useState<Session[]>(() => {
    const saved = localStorage.getItem('finsight_sessions') || localStorage.getItem('alfa_sessions');
    if (saved) {
      try { return JSON.parse(saved); } catch {}
    }
    return [{ id: 'default', title: 'New Fund Research', messages: [] }];
  });
  const [activeId, setActiveId] = useState(() => localStorage.getItem('finsight_active') || 'default');
  const activeSession = sessions.find(s => s.id === activeId) || sessions[0] || { id: 'default', title: 'New Fund Research', messages: [] };

  /* ui states */
  const [query, setQuery] = useState('');
  const [querying, setQuerying] = useState(false);
  const [useWebSearch, setUseWebSearch] = useState(false);
  const [deepThink, setDeepThink] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [fundName, setFundName] = useState('');
  const [uploading, setUploading] = useState(false);
  const [loadingSample, setLoadingSample] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  /* persistence */
  useEffect(() => {
    localStorage.setItem('finsight_sessions', JSON.stringify(sessions));
  }, [sessions]);

  useEffect(() => {
    localStorage.setItem('finsight_active', activeId);
  }, [activeId]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeSession.messages, querying]);

  /* auto-resize textarea */
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 160) + 'px';
    }
  }, [query]);

  const newSession = () => {
    const id = Date.now().toString();
    const newSess: Session = { id, title: 'New Fund Research', messages: [] };
    setSessions(p => [newSess, ...p]);
    setActiveId(id);
  };

  const deleteSession = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (sessions.length === 1) {
      setSessions([{ id: Date.now().toString(), title: 'New Fund Research', messages: [] }]);
      setActiveId(sessions[0].id);
      return;
    }
    const filtered = sessions.filter(s => s.id !== id);
    setSessions(filtered);
    if (activeId === id) setActiveId(filtered[0]?.id || 'default');
  };

  /* Upload custom document */
  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !fundName.trim()) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('fund_name', fundName.trim());
      formData.append('session_id', activeId);

      const res = await fetch('http://localhost:8000/upload', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Upload failed');
      }

      setSessions(p => p.map(s => s.id === activeId ? { ...s, fundName: fundName.trim() } : s));
      setShowUpload(false);
      setFile(null);
      setFundName('');

      // Add assistant confirmation message
      const introMsg: Message = {
        id: Date.now().toString(),
        type: 'assistant',
        content: `✅ **Successfully ingested "${fundName.trim()}".**\n\nThe prospectus has been parsed, chunked, and indexed with BM25 and dense vector embeddings into ChromaDB.\n\nAsk me anything about fees, principal risks, portfolio managers, or historical performance!`,
        time: formatTime(),
      };
      setSessions(p => p.map(s => s.id === activeId ? { ...s, messages: [...s.messages, introMsg] } : s));

    } catch (err: any) {
      alert(`Ingestion error: ${err.message || 'Could not connect to backend'}`);
    } finally {
      setUploading(false);
    }
  };

  /* 1-click sample prospectus load */
  const handleLoadSample = async () => {
    setLoadingSample(true);
    try {
      const formData = new FormData();
      formData.append('session_id', activeId);

      const res = await fetch('http://localhost:8000/documents/sample', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        throw new Error('Failed to load sample document');
      }

      const data = await res.json();
      setSessions(p => p.map(s => s.id === activeId ? {
        ...s,
        fundName: data.fund_name,
        title: 'Fidelity Contrafund (FCNTX)'
      } : s));

      const introMsg: Message = {
        id: Date.now().toString(),
        type: 'assistant',
        content: `🎯 **Fidelity Contrafund (FCNTX) prospectus loaded & indexed.**\n\n- **Pages**: ${data.pages}\n- **Indexed Chunks**: ${data.chunks}\n- **Retrieval Engine**: BM25 + Dense ChromaDB + ms-marco Reranker\n\nTry asking: *"What is the management fee and total expense ratio for FCNTX?"* or *"What are the principal investment risks?"*`,
        time: formatTime(),
      };
      setSessions(p => p.map(s => s.id === activeId ? { ...s, messages: [...s.messages, introMsg] } : s));

    } catch (err: any) {
      alert(`Could not load sample: ${err.message}`);
    } finally {
      setLoadingSample(false);
    }
  };

  /* Query Pipeline */
  const send = async (textToSend?: string) => {
    const q = (textToSend || query).trim();
    if (!q || querying) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: q,
      time: formatTime()
    };

    setSessions(p => p.map(s => {
      if (s.id !== activeId) return s;
      const isFirst = s.messages.length === 0;
      return {
        ...s,
        title: isFirst ? q.slice(0, 36) + (q.length > 36 ? '…' : '') : s.title,
        messages: [...s.messages, userMsg]
      };
    }));

    setQuery('');
    setQuerying(true);

    try {
      const res = await fetch('http://localhost:8000/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: q,
          question: q,
          session_id: activeId,
          use_web_search: useWebSearch,
          deep_think: deepThink
        })
      });

      if (!res.ok) {
        throw new Error(`${res.status}`);
      }

      const data = await res.json();

      const internalCitations: Citation[] = (data.citations || []).map((c: any) => ({
        content: c.excerpt || c.content || '',
        fund_name: c.fund_name || c.source || 'Prospectus',
        page: c.page ?? '',
        source: c.source || '',
        excerpt: c.excerpt || c.content || '',
      }));

      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: data.answer,
        time: formatTime(),
        financial_computation: data.financial_computation,
        citations: {
          internal: internalCitations,
          web: data.web_citations || []
        },
        traceInfo: {
          latency_ms: data.latency_ms,
          cost_usd: data.cost_usd,
          chunks_retrieved: data.chunks_retrieved,
          chunks_after_rerank: data.chunks_after_rerank
        },
      };

      setSessions(p => p.map(s => s.id === activeId ? {
        ...s,
        messages: [...s.messages, assistantMsg]
      } : s));

    } catch (err: any) {
      const is404 = err.message === '404';
      setSessions(p => p.map(s => s.id === activeId ? {
        ...s,
        messages: [
          ...s.messages,
          {
            id: Date.now().toString(),
            type: 'assistant',
            content: is404
              ? '⚠️ **No document found for this session.**\n\nPlease upload a fund prospectus PDF using the paperclip button, or click **"Load Sample Prospectus"** above to get started immediately. You can also turn on **Web Search** to answer using live web data.'
              : '⚠️ **Backend query error.** Please ensure the Python FastAPI backend is running on `http://localhost:8000`.',
            time: formatTime()
          }
        ]
      } : s));
    } finally {
      setQuerying(false);
    }
  };

  const isEmpty = activeSession.messages.length === 0;

  return (
    <Layout title="Research Workspace">
      <div className="flex h-full dark:bg-[#0a0c10] bg-slate-50 dark:text-white text-slate-900 overflow-hidden font-sans transition-colors duration-250">
        {/* ── Sidebar ── */}
        <AnimatePresence>
          {sidebarOpen && (
            <motion.aside
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 280, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="h-full flex flex-col dark:bg-[#0f1117] bg-white border-r dark:border-white/10 border-slate-200 shrink-0 select-none overflow-hidden transition-colors duration-250"
            >
              {/* Top Action */}
              <div className="p-4 border-b dark:border-white/10 border-slate-200">
                <button
                  onClick={newSession}
                  className="w-full py-2.5 px-4 rounded-xl bg-[#3D81E3] hover:bg-[#2c6ecf] active:scale-[0.98] text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(61,129,227,0.3)] transition-all"
                >
                  <Plus className="w-4 h-4" />
                  New Research Chat
                </button>
              </div>

              {/* Sessions List */}
              <div className="flex-1 overflow-y-auto p-3 space-y-1">
                <div className="px-2 py-1.5 flex items-center justify-between text-[10px] font-bold tracking-widest uppercase dark:text-white/40 text-slate-400">
                  <span>Sessions</span>
                  <span>{sessions.length}</span>
                </div>

                {sessions.map(s => {
                  const active = s.id === activeId;
                  return (
                    <div key={s.id} className="group relative">
                      <button
                        onClick={() => setActiveId(s.id)}
                        className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-medium transition-all text-left truncate pr-8 ${
                          active
                            ? 'dark:bg-white/10 dark:text-white bg-slate-100 text-slate-900 border dark:border-white/15 border-slate-300 font-semibold shadow-sm'
                            : 'dark:text-white/60 text-slate-600 dark:hover:text-white hover:text-slate-900 dark:hover:bg-white/5 hover:bg-slate-100'
                        }`}
                      >
                        <MessageSquare className={`w-3.5 h-3.5 shrink-0 ${active ? 'text-[#3D81E3]' : 'opacity-50'}`} />
                        <span className="truncate">{s.title}</span>
                      </button>
                      <button
                        onClick={(e) => deleteSession(e, s.id)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg dark:text-white/30 text-slate-400 hover:text-red-500 hover:bg-slate-200 dark:hover:bg-white/5 opacity-0 group-hover:opacity-100 transition-all"
                        title="Delete session"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Quick Document Status */}
              <div className="p-3 border-t dark:border-white/10 border-slate-200 dark:bg-white/[0.02] bg-slate-50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] uppercase font-bold tracking-wider dark:text-white/40 text-slate-400">Active Document</span>
                  <button
                    onClick={() => setShowUpload(true)}
                    className="text-[10px] text-[#3D81E3] hover:underline flex items-center gap-1 font-semibold"
                  >
                    <Upload className="w-3 h-3" /> Ingest
                  </button>
                </div>
                <div className="liquid-glass rounded-xl p-2.5 border dark:border-white/10 border-slate-200 flex items-center gap-2.5 shadow-sm">
                  <div className="w-7 h-7 rounded-lg bg-[#3D81E3]/20 flex items-center justify-center shrink-0">
                    <FileText className="w-3.5 h-3.5 text-[#3D81E3]" />
                  </div>
                  <div className="truncate flex-1">
                    <div className="text-[11px] font-semibold dark:text-white text-slate-900 truncate">
                      {activeSession.fundName || 'No document loaded'}
                    </div>
                    <div className="text-[10px] dark:text-white/40 text-slate-500">
                      {activeSession.fundName ? 'Chroma & BM25 Synced' : 'Click upload to add PDF'}
                    </div>
                  </div>
                </div>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* ── Main Chat Area ── */}
        <div className="flex-1 flex flex-col relative overflow-hidden dark:bg-[#0c0c0e] bg-slate-100/60 transition-colors duration-250">
          {/* Messages or Empty State */}
          <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6">
            {isEmpty ? (
              /* Institutional Empty State */
              <div className="max-w-3xl mx-auto h-full flex flex-col items-center justify-center text-center py-8">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4 }}
                  className="w-full flex flex-col items-center"
                >
                  <div className="w-14 h-14 rounded-2xl bg-[#3D81E3]/20 border border-[#3D81E3]/40 shadow-[0_0_30px_rgba(61,129,227,0.3)] flex items-center justify-center mb-6">
                    <Sparkles className="w-7 h-7 text-[#00d2ff]" />
                  </div>

                  <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight dark:text-white text-slate-900 mb-3">
                    Finsight Research Workspace
                  </h1>
                  <p className="text-sm md:text-base dark:text-white/60 text-slate-600 max-w-xl leading-relaxed mb-8">
                    Institutional-grade Q&A over fund prospectus PDFs. Natural language answers grounded in verified source passages with ms-marco cross-encoder reranking.
                  </p>

                  {/* Actions Box */}
                  <div className="w-full max-w-xl grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                    {/* Upload card */}
                    <div
                      onClick={() => setShowUpload(true)}
                      className="liquid-glass rounded-2xl p-5 border dark:border-white/10 border-slate-200 hover:border-[#3D81E3]/60 cursor-pointer transition-all duration-300 text-left group hover:scale-[1.02] shadow-sm hover:shadow-md"
                    >
                      <div className="w-9 h-9 rounded-xl bg-[#3D81E3]/20 flex items-center justify-center mb-3 text-[#3D81E3]">
                        <Upload className="w-4 h-4" />
                      </div>
                      <div className="font-semibold dark:text-white text-slate-900 text-sm mb-1 group-hover:text-[#3D81E3] transition-colors">
                        Upload Prospectus PDF
                      </div>
                      <div className="text-xs dark:text-white/50 text-slate-500">
                        Parse, chunk, and index your custom mutual fund or ETF filing.
                      </div>
                    </div>

                    {/* Quick sample load card */}
                    <div
                      onClick={handleLoadSample}
                      className="liquid-glass rounded-2xl p-5 border dark:border-white/10 border-slate-200 hover:border-[#00d2ff]/60 cursor-pointer transition-all duration-300 text-left group hover:scale-[1.02] shadow-sm hover:shadow-md"
                    >
                      <div className="w-9 h-9 rounded-xl bg-[#00d2ff]/20 flex items-center justify-center mb-3 text-[#00d2ff]">
                        {loadingSample ? <Loader2 className="w-4 h-4 animate-spin text-[#3D81E3]" /> : <Zap className="w-4 h-4 text-[#3D81E3] dark:text-[#00d2ff]" />}
                      </div>
                      <div className="font-semibold dark:text-white text-slate-900 text-sm mb-1 group-hover:text-[#3D81E3] transition-colors">
                        Load Sample Fund
                      </div>
                      <div className="text-xs dark:text-white/50 text-slate-500">
                        Instant 1-click test with Fidelity Contrafund (FCNTX) prospectus.
                      </div>
                    </div>
                  </div>

                  {/* Suggested Prompts */}
                  <div className="w-full max-w-xl">
                    <p className="text-[11px] font-bold uppercase tracking-widest dark:text-white/40 text-slate-400 mb-3 text-left">
                      Suggested Inquiries
                    </p>
                    <div className="grid grid-cols-1 gap-2">
                      {QUICK_PROMPTS.map((promptText, i) => (
                        <button
                          key={i}
                          onClick={() => send(promptText)}
                          className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl liquid-glass border dark:border-white/10 border-slate-200 hover:border-slate-300 dark:hover:border-white/20 text-xs dark:text-white/80 text-slate-700 hover:text-black dark:hover:text-white transition-all text-left group dark:hover:bg-white/[0.04] hover:bg-white shadow-sm"
                        >
                          <span>{promptText}</span>
                          <ChevronRight className="w-3.5 h-3.5 dark:text-white/40 text-slate-400 group-hover:translate-x-1 group-hover:text-black dark:group-hover:text-white transition-all" />
                        </button>
                      ))}
                    </div>
                  </div>
                </motion.div>
              </div>
            ) : (
              /* Message Stream */
              <div className="max-w-4xl mx-auto space-y-6 pb-4">
                <AnimatePresence initial={false}>
                  {activeSession.messages.map((msg) => (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.25 }}
                      className={`flex gap-3.5 ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      {/* Avatar for Assistant */}
                      {msg.type === 'assistant' && (
                        <div className="w-8 h-8 rounded-xl bg-[#050505] shadow-[0_0_15px_rgba(61,129,227,0.3)] border border-white/15 overflow-hidden flex items-center justify-center shrink-0 mt-1">
                          <img 
                            src="/logo.png" 
                            alt="Finsight" 
                            className="w-full h-full object-cover scale-[1.1]" 
                            onError={(e) => { e.currentTarget.style.display = 'none'; }} 
                          />
                        </div>
                      )}

                      <div className={`flex flex-col gap-2 max-w-[85%] md:max-w-[78%] ${msg.type === 'user' ? 'items-end' : 'items-start'}`}>
                        {/* Message Box */}
                        <div
                          className={`rounded-2xl px-5 py-4 text-sm leading-relaxed shadow-lg ${
                            msg.type === 'user'
                              ? 'bg-gradient-to-r from-[#1d3557] to-[#14213d] text-white border border-[#3D81E3]/40 rounded-tr-none'
                              : 'liquid-glass border dark:border-white/10 border-slate-200 dark:text-white/90 text-slate-800 rounded-tl-none dark:bg-[#12141c]/90 bg-white/95'
                          }`}
                        >
                          {msg.type === 'assistant' ? (
                            <div>
                              {msg.financial_computation && (
                                <div className="mb-3.5 p-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 text-xs shadow-xs">
                                  <div className="flex items-center gap-2 font-semibold mb-1">
                                    <Calculator className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                    <span>{msg.financial_computation.calculation_type || 'Verified Financial Calculation'}</span>
                                    <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 font-mono font-bold tracking-wider">
                                      AUDITED PYTHON MATH
                                    </span>
                                  </div>
                                  <p className="text-[11px] leading-relaxed font-mono opacity-95">
                                    {msg.financial_computation.verified_statement}
                                  </p>
                                </div>
                              )}
                              <div className="prose dark:prose-invert max-w-none text-sm prose-p:leading-relaxed prose-p:my-2 dark:prose-headings:text-white prose-headings:text-slate-900 dark:prose-strong:text-white prose-strong:text-slate-900 prose-code:bg-black/10 dark:prose-code:bg-white/10 dark:prose-code:text-[#00d2ff] prose-code:text-[#3D81E3] prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-xs">
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                  {msg.content.replace(/\[SOURCE:\s*(\d+)\]/gi, '**[Source: $1]**')}
                                </ReactMarkdown>
                              </div>
                            </div>
                          ) : (
                            <p className="whitespace-pre-wrap">{msg.content}</p>
                          )}
                        </div>

                        {/* Telemetry info */}
                        {msg.traceInfo?.latency_ms && (
                          <div className="flex flex-wrap items-center gap-2.5 px-2 text-[10px] font-mono dark:text-white/40 text-slate-500">
                            <span className="flex items-center gap-1 text-[#3D81E3] dark:text-[#00d2ff]">
                              <Zap className="w-3 h-3" />
                              {Math.round(msg.traceInfo.latency_ms)}ms
                            </span>
                            {msg.traceInfo.cost_usd && (
                              <span>${msg.traceInfo.cost_usd.toFixed(5)}</span>
                            )}
                            {msg.traceInfo.chunks_retrieved && (
                              <span>
                                {msg.traceInfo.chunks_after_rerank}/{msg.traceInfo.chunks_retrieved} chunks reranked
                              </span>
                            )}
                          </div>
                        )}

                        {/* Citations Card */}
                        {msg.citations && (msg.citations.internal.length > 0 || msg.citations.web.length > 0) && (
                          <div className="w-full mt-2 space-y-2">
                            {/* Internal PDF Citations */}
                            {msg.citations.internal.length > 0 && (
                              <div className="liquid-glass rounded-xl p-3 border dark:border-white/10 border-slate-200 dark:bg-black/20 bg-slate-50/80 shadow-sm">
                                <div className="text-[10px] font-bold uppercase tracking-wider dark:text-white/50 text-slate-500 mb-2 flex items-center gap-1.5">
                                  <FileText className="w-3 h-3 text-[#3D81E3]" />
                                  Grounded Document Citations ({msg.citations.internal.length})
                                </div>
                                <div className="space-y-1.5">
                                  {msg.citations.internal.map((c, idx) => (
                                    <div key={idx} className="p-2.5 rounded-lg dark:bg-white/[0.03] bg-white border dark:border-white/5 border-slate-200 text-xs shadow-xs">
                                      <div className="flex items-center gap-2 font-semibold text-[#3D81E3] dark:text-[#adc6ff] mb-1">
                                        <span className="px-1.5 py-0.5 rounded bg-[#3D81E3]/15 text-[10px]">
                                          SOURCE {idx + 1}
                                        </span>
                                        <span>{c.fund_name || c.source}</span>
                                        {c.page && (
                                          <span className="dark:text-white/40 text-slate-400 font-mono font-normal">Page {c.page}</span>
                                        )}
                                      </div>
                                      {(c.excerpt || c.content) && (
                                        <p className="dark:text-white/70 text-slate-600 text-[11px] leading-relaxed line-clamp-2">
                                          "{c.excerpt || c.content}"
                                        </p>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Live Web Citations */}
                            {msg.citations.web.length > 0 && (
                              <div className="liquid-glass rounded-xl p-3 border dark:border-white/10 border-slate-200 dark:bg-black/20 bg-slate-50/80 shadow-sm">
                                <div className="text-[10px] font-bold uppercase tracking-wider dark:text-white/50 text-slate-500 mb-2 flex items-center gap-1.5">
                                  <Globe className="w-3 h-3 text-[#00d2ff]" />
                                  Live Web Sources ({msg.citations.web.length})
                                </div>
                                <div className="space-y-1.5">
                                  {msg.citations.web.map((w, idx) => (
                                    <a
                                      key={idx}
                                      href={w.url}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="block p-2.5 rounded-lg dark:bg-white/[0.03] bg-white border dark:border-white/5 border-slate-200 hover:border-[#00d2ff]/40 text-xs transition-colors group shadow-xs"
                                    >
                                      <div className="flex items-center justify-between text-[#00d2ff] font-semibold text-[11px] mb-0.5">
                                        <span className="truncate">{w.title || 'Web Result'}</span>
                                        <ExternalLink className="w-3 h-3 text-slate-400 dark:text-white/40 group-hover:text-[#00d2ff]" />
                                      </div>
                                      {w.content && (
                                        <p className="dark:text-white/60 text-slate-600 text-[11px] line-clamp-1">{w.content}</p>
                                      )}
                                    </a>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        <span className="text-[10px] dark:text-white/30 text-slate-400 px-1">{msg.time}</span>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>

                {/* Thinking Pulse */}
                {querying && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex gap-3">
                    <div className="w-8 h-8 rounded-xl bg-[#3D81E3]/20 border border-[#3D81E3]/30 flex items-center justify-center shrink-0">
                      <Brain className="w-4 h-4 text-[#3D81E3] animate-pulse" />
                    </div>
                    <div className="liquid-glass rounded-2xl p-4 border dark:border-white/10 border-slate-200 dark:bg-[#12141c] bg-white flex items-center gap-3 shadow-md">
                      <div className="flex gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-[#3D81E3] animate-bounce [animation-delay:0ms]" />
                        <span className="w-2 h-2 rounded-full bg-[#00d2ff] animate-bounce [animation-delay:150ms]" />
                        <span className="w-2 h-2 rounded-full bg-[#3D81E3] animate-bounce [animation-delay:300ms]" />
                      </div>
                      <span className="text-xs dark:text-white/60 text-slate-600 font-medium">
                        {useWebSearch ? 'Searching web & reranking fund context…' : 'Reranking candidate chunks with ms-marco…'}
                      </span>
                    </div>
                  </motion.div>
                )}
                <div ref={chatEndRef} />
              </div>
            )}
          </div>

          {/* ── Input Dock ── */}
          <div className="p-4 md:p-6 dark:bg-gradient-to-t dark:from-[#0c0c0e] dark:via-[#0c0c0e]/95 bg-gradient-to-t from-slate-100/90 via-slate-100/80 to-transparent shrink-0">
            <div className="max-w-4xl mx-auto">
              <div className="liquid-glass rounded-2xl border dark:border-white/15 border-slate-300 p-2 focus-within:border-[#3D81E3] focus-within:shadow-[0_0_25px_rgba(61,129,227,0.25)] transition-all dark:bg-[#12141a]/90 bg-white shadow-xl">
                <div className="flex items-end gap-2 px-2 py-1">
                  {/* Paperclip */}
                  <button
                    onClick={() => setShowUpload(true)}
                    className="p-2 dark:text-white/50 text-slate-400 dark:hover:text-white hover:text-slate-800 dark:hover:bg-white/10 hover:bg-slate-100 rounded-xl transition-colors mb-0.5"
                    title="Upload Prospectus PDF"
                  >
                    <Paperclip className="w-5 h-5" />
                  </button>

                  {/* Input area */}
                  <textarea
                    ref={textareaRef}
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        send();
                      }
                    }}
                    placeholder="Ask any question about fund prospectus, fees, risks, or portfolio..."
                    rows={1}
                    className="flex-1 bg-transparent dark:text-white text-slate-900 dark:placeholder-white/30 placeholder-slate-400 resize-none outline-none text-sm py-2 max-h-40 leading-relaxed"
                  />

                  {/* Send Button */}
                  <button
                    onClick={() => send()}
                    disabled={!query.trim() || querying}
                    className="w-9 h-9 rounded-xl bg-[#3D81E3] hover:bg-[#2c6ecf] disabled:opacity-30 disabled:cursor-not-allowed text-white flex items-center justify-center transition-all shadow-[0_0_15px_rgba(61,129,227,0.3)] shrink-0 mb-0.5 active:scale-95"
                  >
                    {querying ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  </button>
                </div>

                {/* Sub-bar toggles */}
                <div className="flex flex-wrap items-center justify-between pt-2 px-3 border-t dark:border-white/5 border-slate-200 text-[11px]">
                  <div className="flex items-center gap-3">
                    {/* Web Search toggle */}
                    <button
                      onClick={() => setUseWebSearch(o => !o)}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-medium transition-all ${
                        useWebSearch
                          ? 'bg-[#00d2ff]/20 text-[#0284c7] dark:text-[#00d2ff] border border-[#00d2ff]/40 shadow-sm'
                          : 'dark:text-white/40 text-slate-500 dark:hover:text-white/70 hover:text-slate-800'
                      }`}
                    >
                      <Globe className="w-3.5 h-3.5" />
                      Live Web Search
                    </button>

                    {/* Deep Research toggle */}
                    <button
                      onClick={() => setDeepThink(o => !o)}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-medium transition-all ${
                        deepThink
                          ? 'bg-[#3D81E3]/20 text-[#3D81E3] dark:text-[#adc6ff] border border-[#3D81E3]/40 shadow-sm'
                          : 'dark:text-white/40 text-slate-500 dark:hover:text-white/70 hover:text-slate-800'
                      }`}
                    >
                      <Brain className="w-3.5 h-3.5" />
                      Deep Research
                    </button>
                  </div>

                  <span className="dark:text-white/30 text-slate-400 text-[10px] hidden sm:block">
                    Enter to send · Shift+Enter for new line
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Document Upload Modal ── */}
      <AnimatePresence>
        {showUpload && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4"
            onClick={() => setShowUpload(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="liquid-glass rounded-3xl border dark:border-white/15 border-slate-200 p-6 w-full max-w-md shadow-2xl dark:bg-[#12141a]/95 bg-white backdrop-blur-2xl"
            >
              <div className="flex justify-between items-center mb-5">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-[#3D81E3]/20 flex items-center justify-center text-[#3D81E3]">
                    <Upload className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold dark:text-white text-slate-900">Ingest Fund Document</h2>
                    <p className="text-[11px] dark:text-white/50 text-slate-500">Supports SEC prospectus filings & fund disclosures</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowUpload(false)}
                  className="dark:text-white/40 text-slate-400 hover:text-black dark:hover:text-white p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleUpload} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-semibold dark:text-white/60 text-slate-600 mb-1.5 uppercase tracking-wider">
                    Fund Name or Ticker
                  </label>
                  <input
                    value={fundName}
                    onChange={e => setFundName(e.target.value)}
                    placeholder="e.g. Fidelity Contrafund (FCNTX)"
                    className="w-full dark:bg-white/[0.04] bg-slate-50 border dark:border-white/10 border-slate-300 rounded-xl px-4 py-2.5 text-sm dark:text-white text-slate-900 dark:placeholder-white/20 placeholder-slate-400 focus:outline-none focus:border-[#3D81E3] focus:ring-1 focus:ring-[#3D81E3]/30 transition-all"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold dark:text-white/60 text-slate-600 mb-1.5 uppercase tracking-wider">
                    PDF Document
                  </label>
                  <label className="flex flex-col items-center justify-center h-32 border-2 border-dashed dark:border-white/15 border-slate-300 rounded-2xl cursor-pointer hover:border-[#3D81E3] hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-all group">
                    <FileText className="w-6 h-6 dark:text-white/30 text-slate-400 group-hover:text-[#3D81E3] transition-colors mb-2" />
                    <span className="text-xs font-medium dark:text-white/60 text-slate-600 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                      {file ? file.name : 'Click to select PDF or drag & drop'}
                    </span>
                    <span className="text-[10px] dark:text-white/30 text-slate-400 mt-1">PyMuPDF text extraction & sentence chunking</span>
                    <input
                      type="file"
                      accept=".pdf"
                      className="hidden"
                      onChange={e => setFile(e.target.files?.[0] || null)}
                      required
                    />
                  </label>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={uploading || !file || !fundName}
                    className="w-full py-3 bg-[#3D81E3] hover:bg-[#2c6ecf] text-white text-xs font-semibold rounded-xl disabled:opacity-40 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(61,129,227,0.3)] transition-all flex items-center justify-center gap-2"
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" /> Ingesting & Embedding Chunks…
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4" /> Start Ingestion Pipeline
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </Layout>
  );
}

function formatTime() {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
