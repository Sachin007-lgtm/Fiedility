import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { motion, AnimatePresence } from 'motion/react';
import {
  Send, Loader2, Plus, MessageSquare,
  Paperclip, Brain, Trash2, X, Globe, Upload, Menu
} from 'lucide-react';

/* ─── Types ─────────────────────────────────────────────── */
interface Citation { content: string; fund_name?: string; page?: string; source?: string; excerpt?: string; url?: string; title?: string; chunk_id?: string; }
interface Message { id: string; type: 'user' | 'assistant'; content: string; time: string; citations?: { internal: Citation[]; web: Citation[] }; traceInfo?: { latency_ms?: number; cost_usd?: number; chunks_retrieved?: number; chunks_after_rerank?: number }; }
interface Session { id: string; title: string; messages: Message[]; }



import { NavMenu } from '../components/Layout';

/* ─── Main Component ─────────────────────────────────────── */
export default function ResearchWorkspace() {
  const [user] = useState(() => {
    try { return JSON.parse(localStorage.getItem('alfa_user') || '{}'); }
    catch { return {}; }
  });
  const userName = user?.name || 'Fidelity Analyst';
  const userEmail = user?.email || 'research@fidelity.com';
  const userInitial = userName.charAt(0).toUpperCase() || 'F';

  /* sessions */
  const [sessions, setSessions] = useState<Session[]>(() => {
    const saved = localStorage.getItem('alfa_sessions');
    if (saved) return JSON.parse(saved);
    return [{ id: 'default', title: 'New conversation', messages: [] }];
  });
  const [activeId, setActiveId] = useState(() => localStorage.getItem('alfa_active') || 'default');
  const activeSession = sessions.find(s => s.id === activeId) || sessions[0];

  /* ui */
  const [query, setQuery] = useState('');
  const [querying, setQuerying] = useState(false);
  const [useWebSearch, setUseWebSearch] = useState(false);
  const [deepThink, setDeepThink] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [fundName, setFundName] = useState('');
  const [uploading, setUploading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);


  /* persist */
  useEffect(() => { localStorage.setItem('alfa_sessions', JSON.stringify(sessions)); }, [sessions]);
  useEffect(() => { localStorage.setItem('alfa_active', activeId); }, [activeId]);
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [activeSession.messages, querying]);

  /* auto-resize textarea */
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight, 200) + 'px';
  }, [query]);

  const newSession = () => {
    const id = Date.now().toString();
    setSessions(p => [{ id, title: 'New conversation', messages: [] }, ...p]);
    setActiveId(id);
  };

  const deleteSession = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (sessions.length === 1) return;
    const filtered = sessions.filter(s => s.id !== id);
    setSessions(filtered);
    if (activeId === id) setActiveId(filtered[0].id);
  };

  const toggleVoice = () => {
    if (isListening) { recognitionRef.current?.stop(); setIsListening(false); return; }
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return alert('Voice not supported in this browser.');
    const r = new SR(); r.continuous = false; r.interimResults = true;
    r.onstart = () => setIsListening(true);
    r.onresult = (e: any) => setQuery(Array.from(e.results).map((x: any) => x[0].transcript).join(''));
    r.onend = () => setIsListening(false);
    recognitionRef.current = r; r.start();
  };
  void toggleVoice; // suppress unused warning — called from voice button if wired up

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !fundName) return;
    setUploading(true);
    const form = new FormData();
    form.append('file', file);
    form.append('fund_name', fundName);
    form.append('session_id', activeId);
    try {
      const res = await fetch('http://localhost:8000/upload', { method: 'POST', body: form });
      if (!res.ok) throw new Error('Upload failed');
      setSessions(p => p.map(s => s.id === activeId ? {
        ...s,
        title: `${fundName} Analysis`,
        messages: [...s.messages, { id: Date.now().toString(), type: 'assistant', content: `✅ **${fundName}** ingested successfully. You can now ask questions about this document.`, time: t() }]
      } : s));
      setShowUpload(false); setFile(null); setFundName('');
    } catch { alert('Upload failed. Is the backend running?'); }
    finally { setUploading(false); }
  };

  const send = async (overrideQuery?: string) => {
    const q = (overrideQuery ?? query).trim();
    if (!q || querying) return;
    const userMsg: Message = { id: Date.now().toString(), type: 'user', content: q, time: t() };
    setSessions(p => p.map(s => s.id === activeId ? {
      ...s,
      title: s.messages.length === 0 ? q.slice(0, 40) + (q.length > 40 ? '…' : '') : s.title,
      messages: [...s.messages, userMsg]
    } : s));
    setQuery(''); setQuerying(true);
    try {
      const res = await fetch('http://localhost:8000/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: deepThink ? `[Deep Research] ${q}` : q, session_id: activeId, use_web_search: useWebSearch }),
      });
      if (res.status === 404) {
        throw new Error('404');
      }
      if (!res.ok) throw new Error();
      const data = await res.json();
      /* normalise citations from new backend format */
      const internal: Citation[] = (data.citations || []).map((c: any) => ({
        content: c.excerpt || c.content || '',
        fund_name: c.source || c.fund_name || '',
        page: c.page ? String(c.page) : c.page_number ? String(c.page_number) : '',
        source: c.source || '',
        excerpt: c.excerpt || '',
      }));
      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(), type: 'assistant', content: data.answer, time: t(),
        citations: { internal, web: data.web_citations || [] },
        traceInfo: { latency_ms: data.latency_ms, cost_usd: data.cost_usd, chunks_retrieved: data.chunks_retrieved, chunks_after_rerank: data.chunks_after_rerank },
      };
      setSessions(p => p.map(s => s.id === activeId ? { ...s, messages: [...s.messages, assistantMsg] } : s));
    } catch (err: any) {
      const is404 = err.message === '404';
      setSessions(p => p.map(s => s.id === activeId ? {
        ...s,
        messages: [...s.messages, { id: Date.now().toString(), type: 'assistant', content: is404 ? '⚠️ No documents found in this session. Please upload a PDF document first using the paperclip icon or Upload Document button.' : '⚠️ Could not reach the backend. Please check the server is running on port 8000.', time: t() }]
      } : s));
    } finally { setQuerying(false); }
  };

  const isEmpty = activeSession.messages.length === 0;

  return (
    <div className="flex h-screen bg-[#1e1e1e] overflow-hidden font-sans">
      {/* ── Sidebar ── */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.aside
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 280, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="h-screen flex flex-col bg-[#1e1e1e] border-r border-white/5 overflow-hidden shrink-0 text-white"
          >
            {/* Logo */}
            <div className="p-5 flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-[#050505] shadow-[0_0_10px_rgba(255,255,255,0.15)] border border-white/10 overflow-hidden flex items-center justify-center">
                <img src="/logo.png" alt="Logo" className="w-full h-full object-cover scale-[1.1]" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
              </div>
              <span className="font-bold text-lg tracking-tight text-white">Fidelity RAG</span>
            </div>

            <div className="px-4 mb-6 mt-2">
              <button onClick={newSession} className="w-full py-3 bg-[#3ea8ff] hover:bg-[#2c91e0] transition-colors rounded-xl font-medium text-white flex items-center justify-center gap-2 shadow-lg shadow-[#3ea8ff]/20">
                <Plus className="w-5 h-5" /> New Chat
              </button>
            </div>

            {/* Sessions */}
            <div className="flex-1 overflow-y-auto px-4 space-y-1">
              <p className="py-2 text-[11px] font-bold text-white/40 uppercase tracking-widest mb-1 mt-2">Today</p>
              {sessions.map(s => (
                <div key={s.id} className="group relative">
                  <button
                    onClick={() => setActiveId(s.id)}
                    className={`w-full text-left px-3 py-3 rounded-xl text-sm font-medium transition-all pr-8 truncate ${activeId === s.id ? 'bg-white/10 text-white' : 'text-white/60 hover:bg-white/5 hover:text-white/90'}`}
                  >
                    <MessageSquare className="w-4 h-4 inline mr-3 opacity-60" />
                    {s.title}
                  </button>
                  <button
                    onClick={e => deleteSession(e, s.id)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 opacity-0 group-hover:opacity-100 text-white/40 hover:text-red-400 transition-all rounded-lg hover:bg-white/5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            {/* User Profile */}
            <div className="p-4 border-t border-white/5 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center relative shrink-0">
                <span className="text-sm font-medium">{userInitial}</span>
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-[#1e1e1e] rounded-full"></div>
              </div>
              <div className="flex flex-col truncate">
                <span className="text-sm font-semibold text-white truncate">{userName}</span>
                <span className="text-xs text-white/50 truncate">{userEmail}</span>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      <div className="flex-1 flex flex-col overflow-hidden relative bg-white rounded-l-[30px] shadow-[-10px_0_30px_rgba(0,0,0,0.5)] m-2 ml-0">

        {/* Top bar */}
        <div className="h-16 flex items-center px-6 gap-4 border-b border-gray-100 shrink-0">
          <button onClick={() => setSidebarOpen(o => !o)} className="p-2 rounded-xl text-gray-400 hover:text-gray-800 hover:bg-gray-100 transition-colors">
            <Menu className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-3 ml-2">
             <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center relative overflow-hidden shrink-0">
                <span className="text-sm font-bold text-gray-500">{userInitial}</span>
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
             </div>
             <div className="flex flex-col hidden sm:flex max-w-[160px]">
                <span className="text-sm font-bold text-gray-800 truncate">{userName}</span>
                <span className="text-[11px] text-gray-500 truncate">{userEmail}</span>
             </div>
          </div>

          <div className="ml-auto flex items-center gap-3">
            <span className="text-[11px] text-gray-400 font-mono hidden sm:block">llama3-8b · hybrid RAG</span>
            <NavMenu theme="light" />
          </div>
        </div>

        {/* Chat area */}
        <div className="flex-1 overflow-y-auto bg-white">
          {isEmpty ? (
            /* Empty state matching image */
            <div className="h-full flex flex-col items-center justify-center px-6">
              <h1 className="text-4xl md:text-5xl font-extrabold text-black mb-10 text-center leading-[1.1] max-w-2xl">
                Please Upload the Documents<br />Before you begin
              </h1>
              <div 
                onClick={() => setShowUpload(true)}
                className="w-full max-w-xl h-56 border-2 border-dashed border-[#3ea8ff]/40 bg-[#f4fbff] rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:bg-[#eaf6ff] hover:border-[#3ea8ff]/60 transition-all shadow-sm"
              >
                <div className="w-14 h-14 rounded-full bg-[#3ea8ff] flex items-center justify-center mb-4 shadow-lg shadow-[#3ea8ff]/30">
                  <Upload className="w-6 h-6 text-white" />
                </div>
                <div className="text-center">
                  <span className="text-gray-500 text-sm font-medium">Drag and Drop Or</span><br/>
                  <span className="text-[#3ea8ff] text-sm font-bold mt-1 inline-block">Browse File</span> <span className="text-gray-500 text-sm font-medium">To Upload Document</span>
                </div>
              </div>
            </div>
          ) : (
            /* Messages */
            <div className="max-w-4xl mx-auto w-full px-6 py-10 space-y-8">
              <AnimatePresence mode="popLayout">
                {activeSession.messages.map(msg => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className={`flex gap-4 ${msg.type === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
                  >
                    {/* Avatar */}
                    {msg.type === 'assistant' ? (
                      <div className="w-10 h-10 rounded-xl bg-[#050505] shadow-[0_0_10px_rgba(255,255,255,0.15)] border border-white/10 overflow-hidden flex items-center justify-center shrink-0 mt-1">
                        <img src="/logo.png" alt="Logo" className="w-full h-full object-cover scale-[1.1]" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center shrink-0 mt-1 overflow-hidden">
                         <span className="text-sm font-bold text-gray-500">{userInitial}</span>
                      </div>
                    )}

                    <div className={`flex flex-col gap-2 max-w-[80%] ${msg.type === 'user' ? 'items-end' : 'items-start'}`}>
                      {/* Bubble */}
                      <div className={`px-5 py-4 rounded-2xl text-base leading-relaxed shadow-sm ${
                        msg.type === 'user'
                          ? 'bg-[#3ea8ff] text-white rounded-tr-sm'
                          : 'bg-white border border-gray-200 text-gray-800 rounded-tl-sm'
                      }`}>
                        {msg.type === 'assistant' ? (
                          <div className="prose prose-slate max-w-none prose-p:leading-[1.65] prose-p:text-[15px] prose-p:text-gray-800 prose-p:my-3 prose-li:my-1 prose-ul:my-3 prose-strong:font-semibold prose-strong:text-gray-900 marker:text-gray-300 prose-code:bg-blue-50 prose-code:text-[#3ea8ff] prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-xs prose-code:font-bold prose-code:before:content-none prose-code:after:content-none">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                              {msg.content.replace(/\(SOURCE:\s*(\d+)\)/gi, '`[$1]`')}
                            </ReactMarkdown>
                          </div>
                        ) : (
                          <p className="text-[15px] leading-[1.6]">{msg.content}</p>
                        )}
                      </div>

                      {/* Trace info */}
                      {msg.traceInfo?.latency_ms && (
                        <div className="flex gap-3 text-[11px] text-gray-400 font-mono px-2">
                          <span>{Math.round(msg.traceInfo.latency_ms)}ms</span>
                          {msg.traceInfo.cost_usd && <span>${msg.traceInfo.cost_usd.toFixed(5)}</span>}
                          {msg.traceInfo.chunks_retrieved && <span>{msg.traceInfo.chunks_after_rerank}/{msg.traceInfo.chunks_retrieved} chunks</span>}
                        </div>
                      )}

                      {/* Citations */}
                      {msg.citations && (msg.citations.internal.length > 0 || msg.citations.web.length > 0) && (
                        <div className="space-y-2 w-full mt-2">
                          {msg.citations.internal.length > 0 && (
                            <div className="space-y-1.5">
                              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest px-1">Sources</p>
                              {msg.citations.internal.map((c, i) => (
                                <div key={i} className="px-4 py-3 rounded-xl bg-gray-50 border border-gray-100 text-sm text-gray-600 shadow-sm">
                                  <span className="text-[#3ea8ff] font-bold mr-2">[{i + 1}]</span>
                                  <span className="font-medium text-gray-800">{c.source || c.fund_name}</span>{c.page ? ` · p.${c.page}` : ''}
                                  {(c.excerpt || c.content) && <p className="mt-2 text-gray-500 text-sm leading-relaxed line-clamp-3">{c.excerpt || c.content}</p>}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      <span className="text-[11px] text-gray-400 font-medium px-2 mt-1">{msg.time}</span>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* Thinking indicator */}
              {querying && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-[#3ea8ff]/10 flex items-center justify-center shrink-0">
                    <Brain className="w-5 h-5 text-[#3ea8ff]" />
                  </div>
                  <div className="px-5 py-4 rounded-2xl rounded-tl-sm bg-gray-50 border border-gray-100 flex items-center gap-2">
                    <span className="w-2 h-2 bg-[#3ea8ff] rounded-full animate-bounce [animation-delay:0ms]" />
                    <span className="w-2 h-2 bg-[#3ea8ff] rounded-full animate-bounce [animation-delay:150ms]" />
                    <span className="w-2 h-2 bg-[#3ea8ff] rounded-full animate-bounce [animation-delay:300ms]" />
                  </div>
                </motion.div>
              )}
              <div ref={chatEndRef} />
            </div>
          )}
        </div>

        {/* ── Input Bar ── */}
        <div className="shrink-0 px-6 pb-6 pt-4 bg-white z-10">
          <div className="max-w-4xl mx-auto">
            {/* Input box */}
            <div className="relative flex items-end gap-3 bg-white border border-gray-200 rounded-2xl px-4 py-3 focus-within:border-[#3ea8ff]/50 focus-within:ring-4 focus-within:ring-[#3ea8ff]/10 transition-all shadow-sm">
              <button onClick={() => setShowUpload(true)} className="p-2 text-gray-400 hover:text-[#3ea8ff] hover:bg-[#3ea8ff]/10 rounded-xl transition-colors mb-0.5 shrink-0">
                <Paperclip className="w-5 h-5" />
              </button>
              <textarea
                ref={textareaRef}
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
                placeholder="Ask a question about the document..."
                rows={1}
                className="flex-1 bg-transparent text-gray-800 placeholder-gray-400 resize-none outline-none text-[15px] leading-relaxed max-h-48 overflow-y-auto py-1.5"
              />
              <div className="flex items-center mb-0.5 shrink-0">
                <button
                  onClick={() => send()}
                  disabled={!query.trim() || querying}
                  className="w-10 h-10 rounded-full bg-[#3ea8ff] text-white flex items-center justify-center disabled:opacity-50 hover:bg-[#2c91e0] transition-colors shadow-md shadow-[#3ea8ff]/20"
                >
                  {querying ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4 ml-0.5" />}
                </button>
              </div>
            </div>
            <div className="flex justify-between items-center mt-3 px-2">
              <p className="text-[11px] text-gray-400 font-medium">Shift+Enter for new line · Enter to send</p>
              <div className="flex gap-3">
                 <button onClick={() => setUseWebSearch(o => !o)} className={`text-[11px] font-bold uppercase flex items-center gap-1 ${useWebSearch ? 'text-[#3ea8ff]' : 'text-gray-400 hover:text-gray-600'}`}>
                   <Globe className="w-3 h-3" /> Web
                 </button>
                 <button onClick={() => setDeepThink(o => !o)} className={`text-[11px] font-bold uppercase flex items-center gap-1 ${deepThink ? 'text-[#3ea8ff]' : 'text-gray-400 hover:text-gray-600'}`}>
                   <Brain className="w-3 h-3" /> Deep
                 </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Upload Modal ── */}
      <AnimatePresence>
        {showUpload && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
            onClick={() => setShowUpload(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="bg-[#171717] border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl"
            >
              <div className="flex justify-between items-center mb-5">
                <h2 className="text-base font-semibold text-white">Upload Document</h2>
                <button onClick={() => setShowUpload(false)} className="text-white/40 hover:text-white transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <form onSubmit={handleUpload} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-white/50 mb-1.5 uppercase tracking-wider">Fund Name</label>
                  <input
                    value={fundName} onChange={e => setFundName(e.target.value)}
                    placeholder="e.g. ALFA_GLOBAL_MACRO_01"
                    className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:border-white/30 transition-colors"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-white/50 mb-1.5 uppercase tracking-wider">PDF File</label>
                  <label className="flex flex-col items-center justify-center h-28 border-2 border-dashed border-white/10 rounded-xl cursor-pointer hover:border-[#adc6ff]/40 transition-colors bg-white/[0.02]">
                    <Upload className="w-5 h-5 text-white/30 mb-1" />
                    <span className="text-xs text-white/40">{file ? file.name : 'Click to choose PDF'}</span>
                    <input type="file" accept=".pdf" className="hidden" onChange={e => setFile(e.target.files?.[0] || null)} required />
                  </label>
                </div>
                <button
                  type="submit" disabled={uploading || !file || !fundName}
                  className="w-full py-2.5 bg-[#adc6ff] text-[#0d0d0d] text-sm font-semibold rounded-xl disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#c4d7ff] transition-all flex items-center justify-center gap-2"
                >
                  {uploading ? <><Loader2 className="w-4 h-4 animate-spin" /> Ingesting…</> : <><Upload className="w-4 h-4" /> Ingest Document</>}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function t() { return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); }
