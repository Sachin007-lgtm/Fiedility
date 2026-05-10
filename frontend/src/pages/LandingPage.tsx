import { useState } from 'react';
import { motion } from 'motion/react';
import { ChevronRight, Menu, Search, Sparkles, FileText, Globe, BarChart3, Shield, Layers, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';

const LogoMark = ({ className = "w-8 h-8" }: { className?: string }) => (
  <svg viewBox="0 0 256 256" fill="white" className={className}>
    <path d="M 0 128 C 70.692 128 128 185.308 128 256 L 64 256 C 64 220.654 35.346 192 0 192 Z M 256 192 C 220.654 192 192 220.654 192 256 L 128 256 C 128 185.308 185.308 128 256 128 Z M 128 0 C 128 70.692 70.692 128 0 128 L 0 64 C 35.346 64 64 35.346 64 0 Z M 192 0 C 192 35.346 220.654 64 256 64 L 256 128 C 185.308 128 128 70.692 128 0 Z" />
  </svg>
);

const CTAButton = ({ label, to }: { label: string; to: string }) => (
  <Link to={to}>
    <button className="group inline-flex items-center justify-center gap-2 rounded-full bg-white text-black font-semibold text-sm px-6 py-3.5 transition-all hover:bg-white/90 active:scale-[0.98] shadow-xl shadow-white/10">
      <Sparkles className="w-4 h-4" />
      {label}
      <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
    </button>
  </Link>
);

const Feature = ({ icon: Icon, title, desc, color }: { icon: any; title: string; desc: string; color: string }) => (
  <div className="liquid-glass rounded-2xl p-6 flex flex-col gap-4 hover:bg-white/10 transition-all group">
    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
      <Icon className="w-5 h-5 text-white" />
    </div>
    <div>
      <div className="font-semibold text-white text-sm mb-1">{title}</div>
      <div className="text-white/50 text-sm leading-relaxed">{desc}</div>
    </div>
  </div>
);

const SectionLabel = ({ text }: { text: string }) => (
  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/5 text-white/50 text-xs font-semibold uppercase tracking-widest mb-6">
    <span className="w-1.5 h-1.5 rounded-full bg-brand" />
    {text}
  </div>
);

export default function LandingPage() {
  const [yearly, setYearly] = useState(false);

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#0c0c0c] text-white selection:bg-brand/30">
      {/* Background Video */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <video autoPlay muted playsInline loop className="w-full h-full object-cover pointer-events-none"
          src="/vecteezy_ai-generated-clear-cloudy-sky-seamless-looping-animated-video_35594972.mp4" />
        <div className="absolute inset-0 bg-[#0c0c0c]/70" />
      </div>

      <div className="relative z-10">
        {/* Nav */}
        <motion.nav initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
          className="max-w-6xl mx-auto px-6 py-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <LogoMark className="w-7 h-7" />
            <span className="font-bold text-white text-sm tracking-tight">Fidelity RAG</span>
          </div>
          <div className="hidden md:flex gap-8">
            {['Features', 'How It Works', 'Pricing', 'Docs'].map((item, i) => (
              <motion.a key={item} href={`#${item.toLowerCase().replace(' ', '-')}`}
                initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 + i * 0.05 }}
                className="text-white/60 text-sm font-medium hover:text-white transition-colors">{item}</motion.a>
            ))}
          </div>
          <div className="hidden md:block">
            <CTAButton label="Open Workspace" to="/workspace" />
          </div>
          <button className="md:hidden w-10 h-10 rounded-full border border-white/10 bg-white/5 flex items-center justify-center">
            <Menu className="w-4 h-4" />
          </button>
        </motion.nav>

        {/* Hero */}
        <section className="pt-20 md:pt-32 pb-24 text-center flex flex-col items-center px-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }}>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-brand/30 bg-brand/10 text-brand text-xs font-bold uppercase tracking-widest mb-8">
              <Sparkles className="w-3.5 h-3.5" />
              AI-Powered Fund Research · RAG Pipeline
            </div>
          </motion.div>

          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="text-5xl md:text-7xl font-bold tracking-tight leading-[0.95] max-w-4xl">
            <span className="text-white">Understand any fund.</span>
            <br />
            <span style={{
              backgroundImage: 'linear-gradient(to right, #3D81E3 0%, #A4F4FD 40%, #00d2ff 60%, #3D81E3 100%)',
              backgroundSize: '200% auto',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              color: 'transparent',
              WebkitTextFillColor: 'transparent',
            }}>Instantly. Precisely.</span>
          </motion.h1>

          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="mt-8 text-white/50 max-w-xl text-lg leading-relaxed">
            A RAG pipeline over public fund prospectus PDFs enabling natural language Q&A grounded in
            cited source passages — with live DuckDuckGo web search augmentation.
          </motion.p>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.7 }}
            className="mt-10 flex flex-col sm:flex-row items-center gap-4">
            <CTAButton label="Start Researching" to="/workspace" />
            <a href="#how-it-works" className="flex items-center gap-2 text-white/50 text-sm font-medium hover:text-white transition-colors">
              How it works <ChevronRight className="w-4 h-4" />
            </a>
          </motion.div>

          {/* Tech stack badges */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}
            className="mt-12 flex flex-wrap justify-center gap-2">
            {['Python · FastAPI', 'ChromaDB · Vector Store', 'Sentence Transformers', 'Groq · LLaMA 3', 'DuckDuckGo Search', 'React · TypeScript'].map(t => (
              <span key={t} className="px-3 py-1 rounded-full border border-white/10 bg-white/5 text-white/40 text-xs font-mono">{t}</span>
            ))}
          </motion.div>
        </section>

        {/* Features */}
        <section id="features" className="max-w-6xl mx-auto px-6 py-20 md:py-24">
          <div className="text-center mb-16">
            <SectionLabel text="Capabilities" />
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight">Research-grade fund analysis.<br />
              <span className="text-white/40">At the speed of thought.</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Feature icon={FileText} color="bg-brand/80"
              title="Natural Language Q&A"
              desc="Ask any question about fund prospectuses in plain English. Grounded answers with per-claim citations and page references." />
            <Feature icon={Layers} color="bg-purple-500/80"
              title="Semantic Chunking"
              desc="Smart chunking with fund name, page, and section metadata for precise, auditable source attribution — mirroring analyst workflows." />
            <Feature icon={Shield} color="bg-emerald-500/80"
              title="Explainable Citations"
              desc="Every response includes cosine similarity scores and source passages. No hallucinations. Fully traceable answers." />
            <Feature icon={BarChart3} color="bg-amber-500/80"
              title="Cross-Fund Comparison"
              desc="Compare risk profiles, charges, and investment objectives across multiple funds side-by-side in a single query." />
            <Feature icon={Globe} color="bg-rose-500/80"
              title="Live Web Augmentation"
              desc="DuckDuckGo search integration augments your research with live news, filings, and market data — all cited with source URLs." />
            <Feature icon={Zap} color="bg-cyan-500/80"
              title="Groq-Powered Speed"
              desc="LLaMA 3 inference via Groq delivers sub-second response times even on complex multi-fund queries with full context windows." />
          </div>
        </section>

        {/* How It Works */}
        <section id="how-it-works" className="max-w-6xl mx-auto px-6 py-20 md:py-24 border-t border-white/10">
          <div className="text-center mb-16">
            <SectionLabel text="How It Works" />
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight">From PDF to insight<br />
              <span className="text-white/40">in seconds.</span>
            </h2>
          </div>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { step: '01', title: 'Upload Prospectus', desc: 'Drop any fund PDF. PyMuPDF extracts text with page-level metadata.' },
              { step: '02', title: 'Semantic Chunking', desc: '512-token chunks with 64-token overlap, stored in ChromaDB with fund & page tags.' },
              { step: '03', title: 'Vector Retrieval', desc: 'Your query is embedded by Sentence Transformers. Top-k chunks retrieved by cosine similarity.' },
              { step: '04', title: 'Grounded Answer', desc: 'LLaMA 3 via Groq generates a cited, explainable response. Web results optionally merged.' },
            ].map(({ step, title, desc }) => (
              <div key={step} className="liquid-glass rounded-2xl p-6">
                <div className="text-4xl font-black text-white/10 mb-4">{step}</div>
                <div className="font-semibold text-white text-sm mb-2">{title}</div>
                <div className="text-white/40 text-sm leading-relaxed">{desc}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Demo Inbox Mockup */}
        <section className="max-w-6xl mx-auto px-6 py-12">
          <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="relative rounded-2xl overflow-hidden border border-white/10 bg-[#0e1014]/90 backdrop-blur-2xl">
            <div className="flex items-center h-10 px-4 border-b border-white/10">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#ff5f57]" />
                <div className="w-3 h-3 rounded-full bg-[#febc2e]" />
                <div className="w-3 h-3 rounded-full bg-[#28c840]" />
              </div>
              <div className="flex-1 text-center text-xs text-white/30">Fidelity RAG — Research Workspace</div>
            </div>
            <div className="flex h-64 overflow-hidden">
              <div className="hidden md:flex flex-col w-56 border-r border-white/10 bg-black/30 p-4 gap-2">
                <div className="text-[10px] text-white/30 uppercase tracking-widest mb-2">Sessions</div>
                {['FCNTX Analysis', 'Vanguard vs Fidelity', 'Risk Profile Q3'].map((s, i) => (
                  <div key={s} className={`text-xs px-3 py-2 rounded-lg flex items-center gap-2 ${i === 0 ? 'bg-brand/20 text-white' : 'text-white/40'}`}>
                    <span className="w-1.5 h-1.5 rounded-full bg-current" />{s}
                  </div>
                ))}
              </div>
              <div className="flex-1 flex flex-col p-6 gap-4">
                <div className="flex justify-end">
                  <div className="bg-white/10 rounded-2xl rounded-tr-none px-4 py-3 text-sm text-white max-w-sm">
                    What is the management fee and expense ratio for FCNTX?
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-brand to-[#0B2551] flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-3.5 h-3.5 text-white" />
                  </div>
                  <div className="liquid-glass rounded-2xl rounded-tl-none px-4 py-3 text-sm text-white/80 max-w-md">
                    The management fee for Fidelity Contrafund (FCNTX) is <span className="text-brand font-semibold">0.44%</span> with a total expense ratio of <span className="text-brand font-semibold">0.86%</span>.
                    <div className="mt-2 flex gap-2">
                      <span className="px-2 py-0.5 text-[10px] rounded-full bg-brand/10 border border-brand/20 text-brand">FCNTX · Page 12</span>
                      <span className="px-2 py-0.5 text-[10px] rounded-full bg-white/5 border border-white/10 text-white/40">SEC Filing</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </section>

        {/* Testimonials */}
        <section className="max-w-6xl mx-auto px-6 py-20 md:py-24 border-t border-white/10">
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { text: "Finally an AI tool that actually cites the page number. This replaced our entire prospectus review workflow.", author: "Portfolio Analyst", company: "Hedge Fund, London" },
              { text: "Cross-fund comparison in one query. Comparing five fund's risk profiles used to take a full day.", author: "Fund Manager", company: "Asset Management Firm" },
              { text: "The DuckDuckGo integration is killer — RAG answers grounded in the PDF, augmented with live market data.", author: "Research Associate", company: "Investment Bank" },
            ].map((t, i) => (
              <div key={i} className="liquid-glass rounded-2xl p-6 flex flex-col justify-between">
                <blockquote className="text-sm text-white/70 leading-[1.7]">"{t.text}"</blockquote>
                <figcaption className="mt-6 pt-5 border-t border-white/10">
                  <div className="text-sm font-semibold text-white">{t.author}</div>
                  <div className="text-xs text-white/40 mt-0.5">{t.company}</div>
                </figcaption>
              </div>
            ))}
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" className="max-w-6xl mx-auto px-6 py-20 md:py-24 border-t border-white/10">
          <div className="text-center mb-12">
            <SectionLabel text="Pricing" />
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight">Simple, transparent pricing</h2>
            <div className="mt-4 flex items-center justify-center gap-3">
              <span className="text-sm text-white/50">Monthly</span>
              <button onClick={() => setYearly(!yearly)}
                className={`relative w-10 h-6 rounded-full transition-colors ${yearly ? 'bg-brand' : 'bg-white/10'}`}>
                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${yearly ? 'left-5' : 'left-1'}`} />
              </button>
              <span className="text-sm text-white/50">Yearly <span className="text-brand">(save 20%)</span></span>
            </div>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { name: 'Research', price: yearly ? '$0' : '$0', desc: 'For analysts exploring AI-powered research.', features: ['3 fund prospectuses', '50 queries/month', 'PDF citations', 'Basic semantic search'], cta: 'Start Free' },
              { name: 'Professional', price: yearly ? '$79/y' : '$9/m', desc: 'For fund managers and research teams.', features: ['Unlimited prospectuses', 'Unlimited queries', 'Live DuckDuckGo search', 'Cross-fund comparison', 'Priority Groq inference'], cta: 'Get Pro', pro: true },
              { name: 'Enterprise', price: 'Custom', desc: 'For institutions with custom needs.', features: ['Self-hosted deployment', 'Custom embedding models', 'SSO & audit logs', 'SLA guarantee', 'Dedicated support'], cta: 'Contact Sales' },
            ].map((plan) => (
              <div key={plan.name} className={`relative liquid-glass rounded-2xl p-8 flex flex-col gap-6 ${plan.pro ? 'border-brand/30 ring-1 ring-brand/20' : ''}`}>
                {plan.pro && <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-brand text-white text-[10px] font-bold uppercase tracking-wider">Most Popular</div>}
                <div>
                  <div className="text-xs font-bold text-white/40 uppercase tracking-widest">{plan.name}</div>
                  <div className="text-4xl font-black text-white mt-2">{plan.price}</div>
                  <div className="text-white/40 text-sm mt-2">{plan.desc}</div>
                </div>
                <ul className="space-y-3 flex-1">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-center gap-2 text-sm text-white/70">
                      <div className="w-4 h-4 rounded-full bg-brand/20 flex items-center justify-center flex-shrink-0">
                        <svg width="8" height="6" viewBox="0 0 8 6" fill="none"><path d="M1 3L3 5L7 1" stroke="#3D81E3" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                      </div>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link to="/workspace">
                  <button className={`w-full py-3 rounded-xl font-semibold text-sm transition-all ${plan.pro ? 'bg-brand text-white hover:bg-brand/90 shadow-lg shadow-brand/20' : 'bg-white/5 text-white hover:bg-white/10 border border-white/10'}`}>
                    {plan.cta}
                  </button>
                </Link>
              </div>
            ))}
          </div>
        </section>

        {/* CTA Footer */}
        <section className="max-w-6xl mx-auto px-6 py-20 md:py-28">
          <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="liquid-glass relative overflow-hidden rounded-3xl px-8 py-20 text-center">
            <div className="absolute inset-0 pointer-events-none bg-gradient-to-br from-brand/10 to-transparent" />
            <div className="relative z-10">
              <div className="w-14 h-14 rounded-2xl bg-brand/20 border border-brand/30 flex items-center justify-center mx-auto mb-6">
                <Sparkles className="w-7 h-7 text-brand" />
              </div>
              <h2 className="text-4xl md:text-5xl font-bold tracking-tight">Ready to analyze your funds?</h2>
              <p className="mt-4 text-white/50 max-w-md mx-auto text-base">
                Upload a prospectus PDF and start asking questions in plain English. Grounded, cited, explainable.
              </p>
              <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
                <CTAButton label="Open Research Workspace" to="/workspace" />
              </div>
            </div>
          </motion.div>
        </section>
      </div>
    </div>
  );
}
