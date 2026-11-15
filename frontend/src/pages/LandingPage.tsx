import { useState } from 'react';
import { motion } from 'motion/react';
import { ChevronRight, Sparkles, FileText, Globe, BarChart3, Shield, Layers, Zap } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import ThemeToggle from '../components/ThemeToggle';

const CTAButton = ({ label, to }: { label: string; to: string }) => (
  <Link to={to}>
    <button className="group inline-flex items-center justify-center gap-2 rounded-full dark:bg-white bg-slate-900 dark:text-black text-white font-semibold text-sm px-6 py-3.5 transition-all hover:opacity-95 hover:scale-[1.02] active:scale-[0.98] shadow-xl dark:shadow-white/20 shadow-slate-900/20">
      <Sparkles className="w-4 h-4 text-[#3D81E3] dark:text-brand" />
      {label}
      <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
    </button>
  </Link>
);

const Feature = ({ icon: Icon, title, desc, color }: { icon: any; title: string; desc: string; color: string }) => (
  <div className="liquid-glass rounded-2xl p-6 flex flex-col gap-4 border border-transparent dark:hover:border-white/40 hover:border-slate-300 dark:hover:shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:shadow-xl hover:scale-105 transition-all duration-300 group">
    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-md ${color}`}>
      <Icon className="w-5 h-5 text-white" />
    </div>
    <div>
      <div className="font-semibold dark:text-white text-slate-900 text-base mb-1 dark:[text-shadow:_0_1px_6px_rgba(0,0,0,0.6)]">{title}</div>
      <div className="dark:text-white/85 text-slate-600 text-sm leading-relaxed">{desc}</div>
    </div>
  </div>
);

const SectionLabel = ({ text }: { text: string }) => (
  <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border dark:border-white/15 border-white/50 dark:bg-black/40 bg-white/80 backdrop-blur-md dark:text-white/80 text-slate-700 text-xs font-semibold uppercase tracking-widest mb-6 shadow-md">
    <span className="w-1.5 h-1.5 rounded-full bg-brand" />
    {text}
  </div>
);

export default function LandingPage() {
  const [yearly, setYearly] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="relative min-h-screen overflow-x-hidden dark:bg-[#0c0c0c] bg-slate-50 dark:text-white text-slate-900 selection:bg-brand/30 transition-colors duration-250">
      {/* ── Background Video with High-Visibility Gradient Atmosphere ── */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <video 
          autoPlay 
          muted 
          playsInline 
          loop 
          className="w-full h-full object-cover pointer-events-none dark:opacity-85 opacity-80 filter dark:brightness-[0.7] dark:contrast-[1.2] dark:saturate-[1.3] brightness-[1.0] contrast-[1.08] saturate-[1.15] transition-all duration-700"
          src="/vecteezy_ai-generated-clear-cloudy-sky-seamless-looping-animated-video_35594972.mp4" 
        />
        {/* Soft Radial Vignette: keeps the center video vivid, softly shades edges */}
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] dark:from-transparent dark:via-black/25 dark:to-[#0c0c0e]/85 from-transparent via-white/10 to-slate-100/70 transition-colors duration-300" />
        {/* Gentle Vertical Gradient for top navbar and bottom reading zones */}
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-b dark:from-[#0c0c0e]/60 dark:via-transparent dark:to-[#0c0c0e]/90 from-white/60 via-transparent to-slate-50/90 transition-colors duration-300" />
      </div>

      <div className="relative z-10">
        {/* ── Floating Frosted Nav ── */}
        <header className="px-4 pt-4">
          <motion.nav 
            initial={{ opacity: 0, y: -10 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.6 }}
            className="max-w-6xl mx-auto px-6 py-3.5 flex items-center justify-between rounded-2xl dark:bg-black/45 bg-white/75 backdrop-blur-xl border dark:border-white/15 border-white/60 shadow-xl"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#050505] shadow-[0_0_15px_rgba(61,129,227,0.35)] border border-white/10 overflow-hidden flex items-center justify-center">
                <img src="/logo.png" alt="Finsight" className="w-full h-full object-cover scale-[1.1]" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
              </div>
              <span className="font-bold dark:text-white text-slate-900 text-lg tracking-tight">Finsight</span>
            </div>

            <div className="hidden md:flex gap-8">
              {['Features', 'How It Works', 'Pricing'].map((item, i) => (
                <motion.a 
                  key={item} 
                  href={`#${item.toLowerCase().replace(' ', '-')}`}
                  initial={{ opacity: 0, y: -10 }} 
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.1 + i * 0.05 }}
                  className="dark:text-white/85 text-slate-700 text-sm font-semibold hover:text-black dark:hover:text-white transition-colors"
                >
                  {item}
                </motion.a>
              ))}
            </div>

            <div className="flex items-center gap-3">
              {/* Theme Toggle Button (Light/Dark single-click) */}
              <ThemeToggle showLabel className="hidden sm:inline-flex shadow-sm" />
              <ThemeToggle className="sm:hidden shadow-sm" />

              <div className="hidden md:block">
                <CTAButton label="Open Workspace" to="/auth" />
              </div>

              <Link to="/auth" className="md:hidden">
                <button className="px-3.5 py-2 rounded-full border dark:border-white/15 border-white/50 dark:bg-white/10 bg-white text-xs font-semibold dark:text-white text-slate-800 flex items-center gap-1.5 shadow-sm">
                  <Sparkles className="w-3.5 h-3.5 text-[#3D81E3]" />
                  Sign In
                </button>
              </Link>
            </div>
          </motion.nav>
        </header>

        {/* ── Hero Section ── */}
        <section className="pt-16 md:pt-24 pb-20 text-center flex flex-col items-center px-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }}>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-brand/40 dark:bg-brand/20 bg-white/80 backdrop-blur-md text-brand text-xs font-bold uppercase tracking-widest mb-8 shadow-md">
              <Sparkles className="w-3.5 h-3.5" />
              AI-Powered Fund Research · RAG Pipeline
            </div>
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="text-5xl md:text-7xl font-extrabold tracking-tight leading-[1.02] max-w-4xl drop-shadow-2xl"
          >
            <span className="dark:text-white text-slate-950 dark:[text-shadow:_0_4px_24px_rgba(0,0,0,0.95),_0_2px_8px_rgba(0,0,0,0.8)] [text-shadow:_0_2px_18px_rgba(255,255,255,1),_0_1px_4px_rgba(255,255,255,0.9)]">
              Understand any fund.
            </span>
            <br />
            <span style={{
              backgroundImage: 'linear-gradient(to right, #3D81E3 0%, #00d2ff 40%, #0284c7 70%, #3D81E3 100%)',
              backgroundSize: '200% auto',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              color: 'transparent',
              WebkitTextFillColor: 'transparent',
              filter: 'drop-shadow(0 4px 18px rgba(61,129,227,0.4))'
            }}>Instantly. Precisely.</span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="mt-8 dark:text-white text-slate-800 max-w-2xl text-lg leading-relaxed font-medium px-6 py-4 rounded-2xl dark:bg-black/40 bg-white/75 backdrop-blur-xl border dark:border-white/10 border-white/60 shadow-xl dark:[text-shadow:_0_1px_10px_rgba(0,0,0,0.85)] [text-shadow:_0_1px_6px_rgba(255,255,255,0.85)]"
          >
            A production RAG pipeline over public fund prospectus PDFs enabling natural language Q&A grounded in
            cited source passages — with live DuckDuckGo web search augmentation.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.7 }}
            className="mt-10 flex flex-col sm:flex-row items-center gap-4"
          >
            <CTAButton label="Start Researching" to="/auth" />
            <a 
              href="#how-it-works" 
              className="flex items-center gap-2 dark:text-white text-slate-800 text-sm font-semibold px-5 py-3.5 rounded-full dark:bg-black/35 bg-white/70 backdrop-blur-md border dark:border-white/10 border-white/50 shadow-md hover:scale-105 transition-all"
            >
              How it works <ChevronRight className="w-4 h-4" />
            </a>
          </motion.div>

          {/* Tech stack badges with glass backdrops */}
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            transition={{ delay: 1 }}
            className="mt-12 flex flex-wrap justify-center gap-2 max-w-4xl"
          >
            {['FastAPI', 'Vite & React', 'ChromaDB', 'BM25 Retrieval', 'ms-marco Cross-Encoder', 'Groq Llama 3.1', 'DuckDuckGo Search', 'Observability & Tracing'].map(t => (
              <span 
                key={t} 
                className="px-3.5 py-1.5 rounded-full border dark:border-white/15 dark:bg-black/40 dark:text-white border-white/50 bg-white/80 text-slate-800 text-xs font-mono font-medium shadow-md backdrop-blur-md"
              >
                {t}
              </span>
            ))}
          </motion.div>
        </section>

        {/* ── Features ── */}
        <section id="features" className="max-w-6xl mx-auto px-6 py-20 md:py-24">
          <div className="text-center mb-16">
            <SectionLabel text="Capabilities" />
            <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight dark:text-white text-slate-900 dark:[text-shadow:_0_3px_20px_rgba(0,0,0,0.85)] [text-shadow:_0_2px_12px_rgba(255,255,255,0.95)]">
              Institutional-grade RAG.<br />
              <span className="dark:text-white/70 text-slate-600">Fully observable architecture.</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Feature icon={Layers} color="bg-brand"
              title="Hybrid Retrieval System"
              desc="Combines dense vector search (ChromaDB) with sparse keyword retrieval (BM25) using Reciprocal Rank Fusion for optimal recall." />
            <Feature icon={Shield} color="bg-purple-600"
              title="Cross-Encoder Reranking"
              desc="Initial document chunks are precision-ranked using the ms-marco cross-encoder model to surface only the most relevant context." />
            <Feature icon={FileText} color="bg-emerald-600"
              title="Strict Citation Enforcement"
              desc="Structured outputs map LLM responses to exact PDF pages and web sources. Zero hallucinations, fully traceable answers." />
            <Feature icon={BarChart3} color="bg-amber-600"
              title="Full-Stack Observability"
              desc="Custom tracing tracks p50/p95 latency, cost-per-request (tokens × price), and generation quality in real-time dashboards." />
            <Feature icon={Globe} color="bg-rose-600"
              title="Live Web Augmentation"
              desc="DuckDuckGo integration seamlessly merges live market data and web results with local document context." />
            <Feature icon={Zap} color="bg-cyan-600"
              title="CI/CD Quality Gates"
              desc="GitHub Actions pipeline configured for regression testing. Evaluates faithfulness and relevance, failing CI if scores drop." />
          </div>
        </section>

        {/* ── How It Works ── */}
        <section id="how-it-works" className="max-w-6xl mx-auto px-6 py-20 md:py-24 border-t dark:border-white/10 border-slate-200">
          <div className="text-center mb-16">
            <SectionLabel text="System Architecture" />
            <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight dark:text-white text-slate-900 dark:[text-shadow:_0_3px_20px_rgba(0,0,0,0.85)] [text-shadow:_0_2px_12px_rgba(255,255,255,0.95)]">
              From raw PDF to insight<br />
              <span className="dark:text-white/70 text-slate-600">in milliseconds.</span>
            </h2>
          </div>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { step: '01', title: 'Data Ingestion', desc: 'PyMuPDF extracts text. Content is chunked and embedded into a session-isolated ChromaDB.' },
              { step: '02', title: 'Hybrid Search', desc: 'Queries trigger parallel BM25 and Vector retrieval, fused together via rank scores.' },
              { step: '03', title: 'Reranking & Tracing', desc: 'ms-marco cross-encoder reranks chunks. OpenTelemetry traces latency and token costs.' },
              { step: '04', title: 'Grounded Answer', desc: 'Groq Llama-3.1 generates a response with strict citations. Quality metrics are recorded.' },
            ].map(({ step, title, desc }) => (
              <div 
                key={step} 
                className="liquid-glass rounded-2xl p-6 border border-transparent dark:hover:border-white/40 hover:border-slate-300 dark:hover:shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:shadow-xl hover:scale-105 transition-all duration-300"
              >
                <div className="text-4xl font-black dark:text-white/30 text-slate-300 mb-4 font-mono">{step}</div>
                <div className="font-semibold dark:text-white text-slate-900 text-base mb-2 dark:[text-shadow:_0_1px_6px_rgba(0,0,0,0.6)]">{title}</div>
                <div className="dark:text-white/85 text-slate-600 text-sm leading-relaxed">{desc}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Demo Inbox Mockup ── */}
        <section className="max-w-6xl mx-auto px-6 py-12">
          <motion.div 
            initial={{ opacity: 0, y: 40 }} 
            whileInView={{ opacity: 1, y: 0 }} 
            viewport={{ once: true }}
            onClick={() => navigate('/auth')}
            className="relative rounded-2xl overflow-hidden border dark:border-white/15 border-slate-300 dark:hover:border-white/40 hover:border-[#3D81E3]/50 shadow-2xl transition-all duration-500 dark:bg-[#0e1014]/90 bg-white/95 backdrop-blur-2xl group hover:scale-[1.01] cursor-pointer"
          >
            <div className="flex items-center h-10 px-4 border-b dark:border-white/10 border-slate-200 dark:bg-black/30 bg-slate-100/90">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#ff5f57]" />
                <div className="w-3 h-3 rounded-full bg-[#febc2e]" />
                <div className="w-3 h-3 rounded-full bg-[#28c840]" />
              </div>
              <div className="flex-1 text-center text-xs dark:text-white/80 text-slate-700 group-hover:text-black dark:group-hover:text-white transition-colors font-semibold">
                Finsight — Research Workspace (Click to Launch)
              </div>
            </div>
            <div className="flex h-64 overflow-hidden">
              <div className="hidden md:flex flex-col w-56 border-r dark:border-white/10 border-slate-200 dark:bg-black/40 bg-slate-50/90 p-4 gap-2">
                <div className="text-[10px] dark:text-white/60 text-slate-500 uppercase tracking-widest mb-2 font-bold">Sessions</div>
                {['FCNTX Analysis', 'Vanguard vs Fidelity', 'Risk Profile Q3'].map((s, i) => (
                  <div 
                    key={s} 
                    className={`text-xs px-3 py-2 rounded-lg flex items-center gap-2 ${
                      i === 0 
                        ? 'bg-brand/20 text-[#3D81E3] font-bold border border-brand/30' 
                        : 'dark:text-white/80 text-slate-700 font-medium'
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-current" />{s}
                  </div>
                ))}
              </div>
              <div className="flex-1 flex flex-col p-6 gap-4 dark:bg-black/20 bg-slate-50/60">
                <div className="flex justify-end">
                  <div className="bg-[#3D81E3] text-white font-medium rounded-2xl rounded-tr-none px-4 py-3 text-sm max-w-sm shadow-md">
                    What is the management fee and expense ratio for FCNTX?
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-brand to-[#0B2551] flex items-center justify-center flex-shrink-0 shadow-sm">
                    <Sparkles className="w-3.5 h-3.5 text-white" />
                  </div>
                  <div className="liquid-glass rounded-2xl rounded-tl-none px-4 py-3 text-sm dark:text-white text-slate-800 max-w-md shadow-md border dark:border-white/10 border-slate-200">
                    The management fee for Fidelity Contrafund (FCNTX) is <span className="text-brand font-bold">0.44%</span> with a total expense ratio of <span className="text-brand font-bold">0.86%</span>.
                    <div className="mt-2.5 flex gap-2">
                      <span className="px-2 py-0.5 text-[10px] rounded-full bg-brand/20 border border-brand/30 text-brand font-bold">FCNTX · Page 12</span>
                      <span className="px-2 py-0.5 text-[10px] rounded-full dark:bg-white/10 bg-slate-200 dark:text-white/80 text-slate-700 font-semibold">SEC Filing</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </section>

        {/* ── Testimonials ── */}
        <section className="max-w-6xl mx-auto px-6 py-20 md:py-24 border-t dark:border-white/10 border-slate-200">
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { text: "Finally an AI tool that actually cites the page number. This replaced our entire prospectus review workflow.", author: "Portfolio Analyst", company: "Hedge Fund, London" },
              { text: "Cross-fund comparison in one query. Comparing five fund's risk profiles used to take a full day.", author: "Fund Manager", company: "Asset Management Firm" },
              { text: "The DuckDuckGo integration is killer — RAG answers grounded in the PDF, augmented with live market data.", author: "Research Associate", company: "Investment Bank" },
            ].map((t, i) => (
              <div 
                key={i} 
                className="liquid-glass rounded-2xl p-6 flex flex-col justify-between border border-transparent dark:hover:border-white/40 hover:border-slate-300 dark:hover:shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:shadow-xl hover:scale-105 transition-all duration-300"
              >
                <blockquote className="text-sm dark:text-white/95 text-slate-700 leading-[1.7] font-medium">"{t.text}"</blockquote>
                <figcaption className="mt-6 pt-5 border-t dark:border-white/10 border-slate-200">
                  <div className="text-base font-bold dark:text-white text-slate-900">{t.author}</div>
                  <div className="text-xs dark:text-white/70 text-slate-500 mt-0.5 font-medium">{t.company}</div>
                </figcaption>
              </div>
            ))}
          </div>
        </section>

        {/* ── Pricing ── */}
        <section id="pricing" className="max-w-6xl mx-auto px-6 py-20 md:py-24 border-t dark:border-white/10 border-slate-200">
          <div className="text-center mb-12">
            <SectionLabel text="Pricing" />
            <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight dark:text-white text-slate-900 dark:[text-shadow:_0_3px_20px_rgba(0,0,0,0.85)] [text-shadow:_0_2px_12px_rgba(255,255,255,0.95)]">
              Simple, transparent pricing
            </h2>
            <div className="mt-4 flex items-center justify-center gap-3">
              <span className="text-sm dark:text-white/90 text-slate-700 font-semibold">Monthly</span>
              <button 
                onClick={() => setYearly(!yearly)}
                className={`relative w-11 h-6 rounded-full transition-colors ${yearly ? 'bg-brand' : 'dark:bg-white/20 bg-slate-300'}`}
              >
                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm transition-all ${yearly ? 'left-6' : 'left-1'}`} />
              </button>
              <span className="text-sm dark:text-white/90 text-slate-700 font-semibold">Yearly <span className="text-brand font-bold">(save 20%)</span></span>
            </div>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { name: 'Research', price: yearly ? '$0' : '$0', desc: 'For analysts exploring AI-powered research.', features: ['3 fund prospectuses', '50 queries/month', 'PDF citations', 'Basic semantic search'], cta: 'Start Free' },
              { name: 'Professional', price: yearly ? '$79/y' : '$9/m', desc: 'For fund managers and research teams.', features: ['Unlimited prospectuses', 'Unlimited queries', 'Live DuckDuckGo search', 'Cross-fund comparison', 'Priority Groq inference'], cta: 'Get Pro', pro: true },
              { name: 'Enterprise', price: 'Custom', desc: 'For institutions with custom needs.', features: ['Self-hosted deployment', 'Custom embedding models', 'SSO & audit logs', 'SLA guarantee', 'Dedicated support'], cta: 'Contact Sales' },
            ].map((plan) => (
              <div 
                key={plan.name} 
                className={`relative liquid-glass rounded-2xl p-8 flex flex-col gap-6 border dark:border-white/10 border-slate-200 dark:hover:border-white/40 hover:border-slate-400 dark:hover:shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:shadow-xl hover:scale-105 transition-all duration-300 ${plan.pro ? 'border-brand/60 ring-2 ring-brand/30 hover:border-brand shadow-xl' : ''}`}
              >
                {plan.pro && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-brand text-white text-[10px] font-bold uppercase tracking-wider shadow-md">
                    Most Popular
                  </div>
                )}
                <div>
                  <div className="text-xs font-bold dark:text-white/70 text-slate-600 uppercase tracking-widest">{plan.name}</div>
                  <div className="text-4xl font-black dark:text-white text-slate-900 mt-2 font-mono">{plan.price}</div>
                  <div className="dark:text-white/85 text-slate-600 text-sm mt-2">{plan.desc}</div>
                </div>
                <ul className="space-y-3 flex-1">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-center gap-2 text-sm dark:text-white/95 text-slate-800 font-medium">
                      <div className="w-4 h-4 rounded-full bg-brand/20 flex items-center justify-center flex-shrink-0">
                        <svg width="8" height="6" viewBox="0 0 8 6" fill="none"><path d="M1 3L3 5L7 1" stroke="#3D81E3" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                      </div>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link to="/auth">
                  <button className={`w-full py-3 rounded-xl font-semibold text-sm transition-all ${plan.pro ? 'bg-brand text-white hover:bg-brand/90 shadow-lg shadow-brand/25' : 'dark:bg-white/10 dark:text-white bg-slate-100 text-slate-800 hover:bg-slate-200 border dark:border-white/10 border-slate-300 shadow-sm'}`}>
                    {plan.cta}
                  </button>
                </Link>
              </div>
            ))}
          </div>
        </section>

        {/* ── CTA Footer ── */}
        <section className="max-w-6xl mx-auto px-6 py-20 md:py-28">
          <motion.div 
            initial={{ opacity: 0, y: 40 }} 
            whileInView={{ opacity: 1, y: 0 }} 
            viewport={{ once: true }}
            className="liquid-glass relative overflow-hidden rounded-3xl px-8 py-20 text-center border dark:border-white/10 border-slate-200 shadow-2xl"
          >
            <div className="absolute inset-0 pointer-events-none bg-gradient-to-br from-brand/15 to-transparent" />
            <div className="relative z-10">
              <div className="w-14 h-14 rounded-2xl bg-brand/20 border border-brand/30 flex items-center justify-center mx-auto mb-6 shadow-md">
                <Sparkles className="w-7 h-7 text-brand" />
              </div>
              <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight dark:text-white text-slate-900 dark:[text-shadow:_0_3px_20px_rgba(0,0,0,0.85)] [text-shadow:_0_2px_12px_rgba(255,255,255,0.95)]">
                Ready to analyze your funds?
              </h2>
              <p className="mt-4 dark:text-white/80 text-slate-600 max-w-md mx-auto text-base font-medium">
                Upload a prospectus PDF and start asking questions in plain English. Grounded, cited, explainable.
              </p>
              <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
                <CTAButton label="Open Research Workspace" to="/auth" />
              </div>
            </div>
          </motion.div>
        </section>
      </div>
    </div>
  );
}
