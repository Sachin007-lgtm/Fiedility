import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, Upload, FileText, Send, Sparkles, Loader2, 
  BookOpen, Menu, Check, Plus, MessageSquare, 
  Paperclip, Mic, Brain, Trash2, X, Globe
} from 'lucide-react';

interface Citation {
  content: string;
  fund_name: string;
  page: string;
  title?: string;
  url?: string;
}

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  time: string;
  citations?: {
    internal: Citation[];
    web: Citation[];
  };
}

interface Session {
  id: string;
  title: string;
  messages: Message[];
}

const TypewriterMessage = ({ msgId, content, typedRef }: { msgId: string, content: string, typedRef: React.MutableRefObject<Set<string>> }) => {
  const isNew = !typedRef.current.has(msgId);
  const [displayedContent, setDisplayedContent] = useState(isNew ? '' : content);
  
  useEffect(() => {
    if (!isNew) {
      setDisplayedContent(content);
      return;
    }
    typedRef.current.add(msgId);
    
    let index = 0;
    const timer = setInterval(() => {
      index += 3; 
      if (index >= content.length) {
        setDisplayedContent(content);
        clearInterval(timer);
      } else {
        setDisplayedContent(content.substring(0, index));
      }
    }, 15);
    
    return () => clearInterval(timer);
  }, [content, isNew, msgId, typedRef]);

  return (
    <div className="prose prose-invert prose-sm max-w-none prose-p:leading-relaxed prose-pre:bg-white/5 prose-pre:border prose-pre:border-white/10 prose-strong:text-white">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>
        {displayedContent}
      </ReactMarkdown>
    </div>
  );
};

export default function ResearchWorkspace() {
  // Session State with Persistence
  const [sessions, setSessions] = useState<Session[]>(() => {
    const saved = localStorage.getItem('fidelity_research_sessions');
    if (saved) return JSON.parse(saved);
    return [
      {
        id: 'default',
        title: 'Fidelity Research Bot',
        messages: [
          { 
            id: '1', 
            type: 'assistant', 
            content: 'Welcome to Fidelity RAG. I am ready to analyze your prospectuses and provide deep insights. How can I assist you today?',
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]
      }
    ];
  });
  
  const [activeSessionId, setActiveSessionId] = useState(() => {
    return localStorage.getItem('fidelity_active_session') || 'default';
  });

  const activeSession = sessions.find(s => s.id === activeSessionId) || sessions[0];

  // UI State
  const [query, setQuery] = useState('');
  const [querying, setQuerying] = useState(false);
  const [useWebSearch, setUseWebSearch] = useState(false);
  const [deepThink, setDeepThink] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  // Upload State
  const [file, setFile] = useState<File | null>(null);
  const [fundName, setFundName] = useState('');
  const [uploading, setUploading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const typedMessagesRef = useRef<Set<string>>(new Set(['1'])); // mark default message as typed
  
  // Voice Input State
  const recognitionRef = useRef<any>(null);
  const [isListening, setIsListening] = useState(false);

  // Persistence Effects
  useEffect(() => {
    localStorage.setItem('fidelity_research_sessions', JSON.stringify(sessions));
  }, [sessions]);

  useEffect(() => {
    localStorage.setItem('fidelity_active_session', activeSessionId);
  }, [activeSessionId]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeSession.messages, querying]);

  const createNewSession = () => {
    const newId = Date.now().toString();
    const newSession: Session = {
      id: newId,
      title: 'New Research',
      messages: [
        { 
          id: '1', 
          type: 'assistant', 
          content: 'Hello! I\'m ready for a new research session. What should we analyze?',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]
    };
    setSessions([newSession, ...sessions]);
    setActiveSessionId(newId);
  };

  const toggleVoice = () => {
    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Your browser does not support Voice Input. Try Chrome or Edge.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;

    recognition.onstart = () => setIsListening(true);
    
    recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results)
        .map((result: any) => result[0])
        .map((result: any) => result.transcript)
        .join('');
      setQuery(transcript);
    };

    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);

    recognitionRef.current = recognition;
    recognition.start();
  };

  const deleteSession = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (sessions.length === 1) return;
    const filtered = sessions.filter(s => s.id !== id);
    setSessions(filtered);
    if (activeSessionId === id) {
      setActiveSessionId(filtered[0].id);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !fundName) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('fund_name', fundName);
    formData.append('session_id', activeSessionId);

    try {
      const res = await fetch('http://localhost:8000/upload', {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) throw new Error('Upload failed');
      
      // Update session title to the fund name if it's default
      if (activeSession.title === 'New Research' || activeSession.title === 'Fidelity Research Bot') {
        setSessions(prev => prev.map(s => s.id === activeSessionId ? { ...s, title: `${fundName} Analysis` } : s));
      }

      setShowUploadModal(false);
      setFile(null);
      setFundName('');
      
      // Add a system message about successful ingestion
      const systemMsg: Message = {
        id: Date.now().toString(),
        type: 'assistant',
        content: `Successfully ingested **${fundName}**. You can now ask questions specifically about this prospectus in this session.`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setSessions(prev => prev.map(s => s.id === activeSessionId ? { ...s, messages: [...s.messages, systemMsg] } : s));

    } catch (err) {
      console.error(err);
      alert("Failed to upload prospectus.");
    } finally {
      setUploading(false);
    }
  };

  const handleQuery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || querying) return;

    const fullQuery = deepThink ? `[Deep Research Mode] ${query}` : query;

    const userMessage: Message = { 
      id: Date.now().toString(), 
      type: 'user', 
      content: query,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setSessions(prev => prev.map(s => {
      if (s.id === activeSessionId) {
        let newTitle = s.title;
        if (s.title === 'New Research' || s.title === 'Fidelity Research Bot') {
          newTitle = query.slice(0, 30) + (query.length > 30 ? '...' : '');
        }
        return { 
          ...s, 
          messages: [...s.messages, userMessage],
          title: newTitle
        };
      }
      return s;
    }));
    setQuery('');
    setQuerying(true);

    try {
      const res = await fetch('http://localhost:8000/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          query: fullQuery, 
          session_id: activeSessionId,
          use_web_search: useWebSearch 
        }),
      });
      
      if (!res.ok) throw new Error('Query failed');
      
      const data = await res.json();
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: data.answer,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        citations: data.citations
      };
      
      setSessions(prev => prev.map(s => {
        if (s.id === activeSessionId) {
          return { ...s, messages: [...s.messages, assistantMessage] };
        }
        return s;
      }));
    } catch (err) {
      console.error(err);
      const errorMessage: Message = { 
        id: Date.now().toString(), 
        type: 'assistant', 
        content: 'Sorry, I encountered an error communicating with the backend. Please check your API keys.',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setSessions(prev => prev.map(s => {
        if (s.id === activeSessionId) {
          return { ...s, messages: [...s.messages, errorMessage] };
        }
        return s;
      }));
    } finally {
      setQuerying(false);
    }
  };

  return (
    <div className="flex h-screen bg-[#0c0c0c] text-white overflow-hidden selection:bg-brand/30 font-sans relative">
      
      {/* Floating Menu Toggle (visible when sidebar is closed) */}
      {!sidebarOpen && (
        <button 
          onClick={() => setSidebarOpen(true)}
          className="fixed top-4 left-4 z-30 p-2.5 bg-[#0a0b0d]/90 backdrop-blur-xl border border-white/10 rounded-xl text-white/50 hover:text-white transition-all shadow-xl"
        >
          <Menu className="w-5 h-5" />
        </button>
      )}
      
      {/* Background Video */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <video autoPlay loop muted playsInline className="w-full h-full object-cover opacity-100" src="/vecteezy_ai-generated-clear-cloudy-sky-seamless-looping-animated-video_35594972.mp4" />
      </div>
      <div className="absolute inset-0 z-0 pointer-events-none bg-black/0" />

      {/* Left Sidebar */}
      <motion.div 
        animate={{ width: sidebarOpen ? 280 : 0, opacity: sidebarOpen ? 1 : 0 }}
        className="h-screen bg-[#0a0b0d]/95 backdrop-blur-3xl border-r border-white/[0.07] flex flex-col z-20 overflow-hidden shrink-0"
      >
        <div className="p-4 border-b border-white/10 flex items-center justify-between gap-2">
          <button 
            onClick={() => setSidebarOpen(false)}
            className="p-2 hover:bg-white/5 rounded-lg text-white/30 transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
          <button 
            onClick={createNewSession}
            className="flex-1 flex items-center justify-between gap-2 px-4 py-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-all text-sm font-medium text-white/80 shadow-sm group"
          >
            <div className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              New Research
            </div>
            <Sparkles className="w-4 h-4 text-brand" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-2 py-4 space-y-1">
          <div className="px-3 pb-2 text-[10px] font-bold text-white/30 uppercase tracking-widest">History</div>
          {sessions.map(s => (
            <div key={s.id} className="group relative">
              <button 
                onClick={() => setActiveSessionId(s.id)}
                className={`w-full text-left px-3 py-2.5 rounded-lg text-sm flex items-center gap-3 transition-all pr-10 ${activeSessionId === s.id ? 'bg-white/10 text-white font-semibold' : 'text-white/50 hover:bg-white/5'}`}
              >
                <MessageSquare className={`w-4 h-4 ${activeSessionId === s.id ? 'text-brand' : 'text-white/20'}`} />
                <span className="truncate">{s.title}</span>
              </button>
              <button 
                onClick={(e) => deleteSession(e, s.id)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 opacity-0 group-hover:opacity-100 text-white/20 hover:text-red-400 transition-all rounded-md hover:bg-white/5"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>

        <div className="p-4 border-t border-white/10 bg-black/20 space-y-2">
        </div>
      </motion.div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col relative z-10 overflow-hidden">
        
        {/* Chat History */}
        <div className="flex-1 overflow-y-auto px-4 md:px-0 pt-8 pb-4 scroll-smooth">
          <div className="max-w-3xl mx-auto space-y-8 relative">
            <AnimatePresence mode="popLayout">
              {activeSession.messages.map((msg) => (
                <motion.div 
                  key={msg.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex gap-4 ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.type === 'assistant' && (
                    <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0 relative overflow-hidden group shadow-lg">
                      <div className="absolute inset-0 bg-gradient-to-br from-brand/20 to-transparent animate-pulse" />
                      <Sparkles className="w-4 h-4 text-brand relative z-10" />
                    </div>
                  )}
                  
                  <div className="flex flex-col gap-1.5 max-w-[85%] md:max-w-[75%]">
                    <div className={`rounded-2xl px-5 py-3.5 shadow-2xl border ${
                      msg.type === 'user' 
                        ? 'bg-[#1a1f2e] border-white/10 text-white rounded-tr-none shadow-black/40' 
                        : 'bg-[#0e1218]/95 border-white/[0.08] text-white/90 rounded-tl-none backdrop-blur-xl'
                    }`}>
                      {msg.type === 'user' ? (
                        <div className="text-[14px] leading-relaxed whitespace-pre-wrap">{msg.content}</div>
                      ) : (
                        <TypewriterMessage msgId={msg.id} content={msg.content} typedRef={typedMessagesRef} />
                      )}
                      
                      {/* Citations */}
                      {msg.citations && (
                        <div className="mt-4 pt-4 border-t border-white/10 space-y-3">
                          <div className="text-[9px] font-bold text-white/30 uppercase tracking-[0.2em] flex items-center gap-2">
                            <FileText className="w-3 h-3" /> Source Verification
                          </div>
                          <div className="flex flex-wrap gap-2 mt-2">
                            {msg.citations.internal?.map((cit, idx) => (
                              <div key={`int-${idx}`} className="flex items-center gap-1.5 bg-[#1a1f2e]/80 border border-white/10 rounded-full px-3 py-1 hover:bg-[#252b3d] transition-colors cursor-default" title={cit.content}>
                                <FileText className="w-3 h-3 text-brand/80" />
                                <span className="text-[10px] font-bold text-white/60 uppercase">{cit.fund_name} • P{cit.page}</span>
                              </div>
                            ))}
                            {msg.citations.web?.map((cit, idx) => (
                              <a key={`web-${idx}`} href={cit.url} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 bg-brand/10 border border-brand/20 rounded-full px-3 py-1 hover:bg-brand/20 transition-colors" title={cit.content}>
                                <Globe className="w-3 h-3 text-brand" />
                                <span className="text-[10px] font-bold text-brand uppercase max-w-[150px] truncate">{cit.title}</span>
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    <div className={`text-[9px] text-white/30 font-bold uppercase tracking-widest px-2 flex items-center gap-3 ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                      {msg.time}
                    </div>
                  </div>

                  {msg.type === 'user' && (
                    <div className="w-10 h-10 rounded-full bg-[#1a1f2e] border border-white/10 flex items-center justify-center flex-shrink-0 text-xs font-bold text-white/60">
                      U
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>

            {querying && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-4">
                 <div className="w-10 h-10 rounded-full bg-[#0e1218]/95 border border-white/10 flex items-center justify-center flex-shrink-0">
                    <Loader2 className="w-4 h-4 text-brand animate-spin" />
                  </div>
                  <div className="bg-[#0e1218]/95 border border-white/[0.08] rounded-2xl px-5 py-3.5 text-sm text-white/60 flex items-center gap-3 shadow-2xl backdrop-blur-xl">
                    <Sparkles className="w-4 h-4 text-brand animate-pulse" />
                    Deep Research in progress...
                  </div>
              </motion.div>
            )}
            <div ref={chatEndRef} />
          </div>
        </div>

        {/* Input Area */}
        <div className="px-6 pb-6 pt-2 md:px-10 md:pb-10 md:pt-4 z-10">
          <div className="max-w-3xl mx-auto">
            <form 
              onSubmit={handleQuery} 
              className="relative bg-[#0e1218]/95 backdrop-blur-3xl border border-white/[0.08] rounded-[24px] shadow-2xl p-2 transition-all focus-within:border-brand/30 shadow-black/60"
            >
              <textarea 
                rows={1}
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleQuery(e as any);
                  }
                }}
                placeholder="Analyze fund performance, fees, or strategy..."
                className="w-full bg-transparent border-none rounded-none pl-6 pr-12 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:ring-0 resize-none min-h-[48px] max-h-32"
              />
              <div className="flex items-center justify-between px-3 pb-2 pt-1 border-t border-white/5 mt-1">
                <div className="flex items-center gap-1">
                  <button 
                    type="button" 
                    onClick={() => setShowUploadModal(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full hover:bg-white/5 transition-colors text-[10px] font-bold text-white/30 uppercase tracking-wider"
                  >
                    <Paperclip className="w-3.5 h-3.5" />
                    Attach
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setDeepThink(!deepThink)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all text-[10px] font-bold uppercase tracking-wider ${deepThink ? 'bg-brand/20 text-brand' : 'hover:bg-white/5 text-white/30'}`}
                  >
                    <Brain className="w-3.5 h-3.5" />
                    Deep Think
                  </button>
                  <label className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all text-[10px] font-bold uppercase tracking-wider cursor-pointer ${useWebSearch ? 'bg-brand/20 text-brand' : 'hover:bg-white/5 text-white/30'}`}>
                    <Globe className="w-3.5 h-3.5" />
                    Live Search
                    <input 
                      type="checkbox" 
                      checked={useWebSearch} 
                      onChange={e => setUseWebSearch(e.target.checked)}
                      className="hidden"
                    />
                  </label>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    type="button" 
                    onClick={toggleVoice}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-colors text-[10px] font-bold uppercase tracking-wider ${isListening ? 'bg-red-500/20 text-red-400 animate-pulse' : 'hover:bg-white/5 text-white/30'}`}
                  >
                    <Mic className="w-3.5 h-3.5" />
                    {isListening ? 'Listening...' : 'Voice'}
                  </button>
                  <button 
                    type="submit"
                    disabled={!query.trim() || querying}
                    className="flex items-center gap-2 px-5 py-2 rounded-full bg-brand text-white text-xs font-bold hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-20 shadow-[0_0_15px_rgba(61,129,227,0.3)]"
                  >
                    Analyze
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>

      </div>

      {/* Upload Modal */}
      <AnimatePresence>
        {showUploadModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-xl"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="w-full max-w-md bg-[#0e1014] rounded-3xl shadow-2xl p-8 border border-white/10 relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-brand/5 to-transparent pointer-events-none" />
              <div className="flex items-center justify-between mb-8 relative z-10">
                <h2 className="text-xl font-bold text-white tracking-tight">Ingest Prospectus</h2>
                <button onClick={() => setShowUploadModal(false)} className="text-white/20 hover:text-white transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <form onSubmit={handleUpload} className="space-y-6 relative z-10">
                <div>
                  <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-2 block">Fund Identifier</label>
                  <input 
                    type="text" 
                    value={fundName}
                    onChange={e => setFundName(e.target.value)}
                    placeholder="e.g. Fidelity Contrafund (FCNTX)"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-brand/50 transition-all placeholder:text-white/10"
                    required
                  />
                </div>
                
                <div className="relative group">
                  <input 
                    type="file" 
                    accept=".pdf"
                    onChange={e => setFile(e.target.files?.[0] || null)}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                    required
                  />
                  <div className="w-full bg-white/[0.02] border-2 border-white/5 border-dashed rounded-2xl p-8 text-center group-hover:border-brand/40 group-hover:bg-brand/5 transition-all flex flex-col items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-brand shadow-inner">
                      <Upload className="w-6 h-6" />
                    </div>
                    <div className="text-sm font-medium text-white/40">
                      {file ? <span className="text-brand">{file.name}</span> : 'Drop prospectus PDF here'}
                    </div>
                  </div>
                </div>

                <div className="text-xs text-white/30 bg-white/5 p-3 rounded-lg border border-white/5 italic">
                  Note: This document will be isolated to this specific session context only.
                </div>

                <button 
                  type="submit" 
                  disabled={uploading}
                  className="w-full bg-white text-black font-bold rounded-xl py-4 text-sm flex items-center justify-center gap-2 hover:bg-white/90 transition-all shadow-xl disabled:opacity-50"
                >
                  {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                  {uploading ? 'Processing Research...' : 'Commit to Vector DB'}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
