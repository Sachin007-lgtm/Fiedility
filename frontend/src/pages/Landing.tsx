import { useState } from 'react';
import { motion } from 'motion/react';
import { ChevronRight, Menu, Search, Sparkles, Paperclip, MoreHorizontal, Reply, Forward, Archive, Trash2 } from 'lucide-react';

const AppleLogo = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg viewBox="0 0 384 512" fill="currentColor" className={className}>
    <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z" />
  </svg>
);

const LogoMark = ({ className = "w-8 h-8" }: { className?: string }) => (
  <svg viewBox="0 0 256 256" fill="white" className={className}>
    <path d="M 0 128 C 70.692 128 128 185.308 128 256 L 64 256 C 64 220.654 35.346 192 0 192 Z M 256 192 C 220.654 192 192 220.654 192 256 L 128 256 C 128 185.308 185.308 128 256 128 Z M 128 0 C 128 70.692 70.692 128 0 128 L 0 64 C 35.346 64 64 35.346 64 0 Z M 192 0 C 192 35.346 220.654 64 256 64 L 256 128 C 185.308 128 128 70.692 128 0 Z" />
  </svg>
);

const AppleButton = ({ label, full }: { label: string, full?: boolean }) => (
  <button className={`group inline-flex items-center justify-center gap-2 rounded-full bg-white text-black font-medium text-sm px-5 py-3 transition-all hover:bg-white/90 active:scale-[0.98] ${full ? 'w-full' : ''}`}>
    <AppleLogo />
    {label}
    <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-[1px]" />
  </button>
);

const SectionEyebrow = ({ label, tag }: { label: string, tag?: string }) => (
  <div className="flex items-center gap-3">
    <div className="flex items-center gap-2 text-sm font-medium text-white/80">
      <span className="w-1.5 h-1.5 rounded-full bg-white" />
      {label}
    </div>
    {tag && <span className="px-2 py-0.5 rounded-full border border-white/10 text-white/50 text-xs">{tag}</span>}
  </div>
);

export default function App() {
  const [yearly, setYearly] = useState(false);

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#0c0c0c] text-white selection:bg-brand/30">
      {/* Global Background Video */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <video autoPlay loop muted playsInline className="w-full h-full object-cover pointer-events-none" src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260508_064122_c4750c0e-7476-4b44-94a2-a85a65c63bf2.mp4" />
      </div>

      {/* Vertical guide lines */}
      <div className="hidden md:block pointer-events-none fixed inset-y-0 left-1/2 -translate-x-[calc(50%+36rem)] w-px bg-white/10 z-[5]" />
      <div className="hidden md:block pointer-events-none fixed inset-y-0 left-1/2 translate-x-[calc(-50%+36rem)] w-px bg-white/10 z-[5]" />

      {/* SVG Filters */}
      <svg className="hidden">
        <filter id="c3-noise-root">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch" />
          <feColorMatrix type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.35 0" />
          <feComposite in2="SourceGraphic" operator="in" result="noise" />
          <feBlend in="SourceGraphic" in2="noise" mode="multiply" />
        </filter>
      </svg>

      <div className="relative z-10">
        {/* Section 1 - Navbar */}
        <motion.nav 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="max-w-6xl mx-auto px-6 py-6 flex items-center justify-between"
        >
          <LogoMark />
          <div className="hidden md:flex gap-8">
            {['Solutions', 'Pricing', 'Blog', 'Documentation', 'Careers'].map((item, i) => (
              <motion.a 
                key={item} href="#" 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 + i * 0.05, ease: "easeOut" }}
                className="text-white/70 text-sm font-medium hover:text-white transition-colors"
              >
                {item}
              </motion.a>
            ))}
          </div>
          <div className="hidden md:block">
            <AppleButton label="Try Fidelity" />
          </div>
          <button className="md:hidden w-10 h-10 rounded-full border border-white/10 bg-white/5 flex items-center justify-center">
            <Menu className="w-4 h-4 text-white" />
          </button>
        </motion.nav>

        {/* Section 2 - Hero */}
        <section className="pt-16 md:pt-28 pb-20 text-center flex flex-col items-center px-6">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="text-4xl md:text-7xl font-semibold tracking-tight leading-[0.9]"
          >
            <div className="text-white">Your funds.</div>
            <div 
              className="animate-shiny inline-block"
              style={{
                backgroundImage: 'linear-gradient(to right, #091020 0%, #0B2551 12.5%, #A4F4FD 32.5%, #00d2ff 50%, #0B2551 67.5%, #091020 87.5%, #091020 100%)',
                backgroundSize: '200% auto',
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                color: 'transparent',
                WebkitTextFillColor: 'transparent',
                filter: 'url(#c3-noise-root)'
              }}
            >
              Revitalized
            </div>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="mt-8 text-white/60 max-w-md text-base leading-[1.5]"
          >
            Fidelity RAG is the premier research platform for the current era. It leverages powerful AI to analyze, prioritize, and refine your prospectuses into total clarity.
          </motion.p>
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="mt-8 flex flex-col items-center gap-4"
          >
            <AppleButton label="Try Fidelity RAG" />
            <span className="text-xs text-white/40">Download for Intel / Apple Silicon</span>
          </motion.div>
        </section>

        {/* Section 3 - macOS Menu Bar */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.9 }}
          className="w-full h-10 bg-black/40 backdrop-blur-md border-t border-b border-white/10"
        >
          <div className="max-w-6xl mx-auto px-6 h-full flex items-center justify-between text-xs">
            <div className="flex items-center gap-4">
              <AppleLogo className="w-3.5 h-3.5" />
              <span className="font-bold text-white">Fidelity RAG</span>
              {['File', 'Edit', 'View', 'Go', 'Window', 'Help'].map((item, i) => (
                <span key={item} className={`text-white/80 hover:text-white cursor-default ${i > 2 ? 'hidden sm:inline' : ''} ${i > 3 ? 'hidden md:inline' : ''}`}>
                  {item}
                </span>
              ))}
            </div>
            <div className="flex items-center gap-3 text-white/80">
              <Search className="w-3.5 h-3.5" />
              <span>Wed May 6 1:09 PM</span>
            </div>
          </div>
        </motion.div>

        {/* Section 4 - Inbox Mockup */}
        <motion.section 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.1, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-6xl mx-auto px-6 py-16 md:py-24"
        >
          <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-[#0e1014]/90 backdrop-blur-2xl">
            {/* Title bar */}
            <div className="flex items-center h-10 px-4 border-b border-white/10">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#ff5f57]"></div>
                <div className="w-3 h-3 rounded-full bg-[#febc2e]"></div>
                <div className="w-3 h-3 rounded-full bg-[#28c840]"></div>
              </div>
              <div className="flex-1 text-center text-xs text-white/50">Fidelity RAG — Research</div>
            </div>

            {/* Body */}
            <div className="flex flex-col md:grid md:grid-cols-12 h-[520px]">
              {/* Sidebar */}
              <div className="hidden md:flex flex-col col-span-3 border-r border-white/10 bg-black/30 p-4">
                <button className="flex items-center justify-center gap-2 rounded-lg bg-white text-black text-xs font-semibold px-3 py-2 hover:bg-white/90 transition-colors">
                  <Sparkles className="w-3.5 h-3.5" />
                  Analyze with Fidelity
                </button>
                <div className="mt-6 flex flex-col gap-1">
                  <div className="flex items-center justify-between px-2 py-1.5 rounded-md bg-white/10 text-white text-sm cursor-default">
                    <span>Prospectuses</span>
                    <span className="text-xs">12</span>
                  </div>
                  {['Starred (3)', 'Sent', 'Drafts (2)', 'Archive', 'Trash'].map(item => (
                    <div key={item} className="flex items-center justify-between px-2 py-1.5 rounded-md text-white/60 hover:bg-white/5 hover:text-white text-sm cursor-default transition-colors">
                      <span>{item.split(' ')[0]}</span>
                      {item.includes('(') && <span className="text-xs">{item.match(/\(([^)]+)\)/)?.[1]}</span>}
                    </div>
                  ))}
                </div>
                <div className="mt-8">
                  <div className="px-2 text-[10px] uppercase tracking-widest text-white/40 mb-2">Labels</div>
                  <div className="flex flex-col gap-1">
                    {[
                      { name: 'Equities', color: '#00d2ff' },
                      { name: 'Fixed Income', color: '#A4F4FD' },
                      { name: 'Real Estate', color: '#f59e0b' },
                      { name: 'ETFs', color: '#10b981' }
                    ].map(label => (
                      <div key={label.name} className="flex items-center gap-2 px-2 py-1.5 text-white/60 hover:text-white text-sm cursor-default transition-colors">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: label.color }} />
                        {label.name}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Message list */}
              <div className="flex flex-col col-span-4 border-r border-white/10 overflow-hidden">
                <div className="p-3 border-b border-white/10">
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-white/5 text-white/40 text-sm">
                    <Search className="w-4 h-4" />
                    Search funds
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto overflow-x-hidden">
                  {[
                    { sender: 'Fidelity Contrafund', subject: 'Q3 Factsheet review', snippet: 'The fund outperformed the S&P 500...', time: '9:41 AM', active: true, unread: true },
                    { sender: 'Sophia Chen', subject: 'Re: Yield analysis', snippet: 'Thanks for sending the prospectus...', time: '8:12 AM', active: false, unread: true },
                    { sender: 'Figma', subject: 'Marcus commented on your file', snippet: 'Love the new direction on the landing hero.', time: 'Yesterday', active: false, unread: false },
                    { sender: 'Fidelity', subject: 'Dividend of $12,480.00 posted', snippet: 'Your payout is on its way to your bank...', time: 'Yesterday', active: false, unread: false },
                    { sender: 'SEC.gov', subject: 'Filing ready for FCNTX', snippet: 'Preview is live at sec.gov/edgar...', time: 'Mon', active: false, unread: false },
                    { sender: 'Market', subject: '[nasdaq/aapl] up 2%', snippet: 'david-lim approved your pull request.', time: 'Mon', active: false, unread: false }
                  ].map((msg, i) => (
                    <div key={i} className={`p-4 border-b border-white/5 cursor-pointer ${msg.active ? 'bg-brand/20' : 'hover:bg-white/5'}`}>
                      <div className="flex items-center justify-between mb-1">
                        <div className={`text-sm ${msg.unread ? 'text-white font-semibold' : 'text-white/80'}`}>{msg.sender}</div>
                        <div className="text-xs text-white/40">{msg.time}</div>
                      </div>
                      <div className={`text-sm mb-1 truncate ${msg.unread ? 'text-white/90 font-medium' : 'text-white/70'}`}>{msg.subject}</div>
                      <div className="text-xs text-white/50 truncate">{msg.snippet}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Reader */}
              <div className="hidden md:flex flex-col col-span-5 bg-[#0a0a0a]">
                <div className="h-14 border-b border-white/10 flex items-center justify-between px-4">
                  <div className="flex items-center gap-1">
                    {[Reply, Forward, Archive, Trash2].map((Icon, i) => (
                      <button key={i} className="w-7 h-7 flex items-center justify-center rounded-md text-white/60 hover:bg-white/5 hover:text-white transition-colors">
                        <Icon className="w-4 h-4" />
                      </button>
                    ))}
                  </div>
                  <button className="w-7 h-7 flex items-center justify-center rounded-md text-white/60 hover:bg-white/5 hover:text-white transition-colors">
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex-1 p-6 overflow-y-auto">
                  <h2 className="text-xl font-semibold text-white mb-6">Q3 Factsheet review</h2>
                  <div className="flex items-center gap-3 mb-8">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#00d2ff] to-[#0B2551] flex items-center justify-center text-xs font-bold text-white">F</div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-white">Fidelity Contrafund</span>
                        <span className="text-xs text-white/40">to me · 9:41 AM</span>
                      </div>
                      <div className="mt-1">
                        <span className="px-2 py-0.5 rounded-full border border-white/10 text-white/50 text-[10px] uppercase">Work</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="rounded-lg border border-[#A4F4FD]/20 bg-[#A4F4FD]/5 p-4 mb-6">
                    <div className="flex items-center gap-2 text-[#A4F4FD] text-xs font-semibold mb-2">
                      <Sparkles className="w-3.5 h-3.5" />
                      Summary by Fidelity RAG
                    </div>
                    <div className="text-sm text-[#A4F4FD]/80 leading-relaxed">
                      Your team closed 23 issues, merged 14 PRs, and shipped 2 features. Top contributor: Marcus. No action needed.
                    </div>
                  </div>

                  <div className="space-y-4 text-sm text-white/80 leading-relaxed">
                    <p>Hi team,</p>
                    <p>Here is your weekly digest of everything happening across your projects. This was a strong week with significant progress on the Q3 roadmap.</p>
                    <p>Twenty-three issues were closed, fourteen pull requests were merged, and two customer-facing features went out. The velocity trend continues to climb.</p>
                    <p>Let me know if you would like a deeper breakdown by project or contributor.</p>
                    <p className="text-white/50 pt-2">— The Linear team</p>
                  </div>

                  <div className="mt-8 pt-4 border-t border-white/10 flex items-center gap-2 text-xs text-white/60">
                    <Paperclip className="w-3.5 h-3.5" />
                    digest-may-6.pdf
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.section>

        {/* Section 5 - FeatureTriage */}
        <section className="max-w-6xl mx-auto px-6 py-20 md:py-28">
          <div className="grid md:grid-cols-2 gap-10 md:gap-16 items-start">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
            >
              <SectionEyebrow label="Analysis" tag="AI-native" />
              <h2 className="mt-5 text-3xl md:text-5xl font-semibold tracking-tight leading-[1.02]">
                Analyze your funds <br/> in a single pass.
              </h2>
              <p className="mt-6 text-white/60 text-base leading-[1.6] max-w-md">
                Fidelity reads every document, understands intent, and routes the noise away from the signal. Focus on what moves your portfolio forward — the rest handles itself.
              </p>
              <div className="mt-8 flex flex-wrap gap-2">
                {['Auto-summarize', 'Compare yields', 'Silent updates', 'One-tap citations'].map(chip => (
                  <span key={chip} className="text-xs text-white/70 px-3 py-1.5 rounded-full border border-white/10 bg-white/[0.03]">
                    {chip}
                  </span>
                ))}
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="liquid-glass rounded-2xl p-5"
            >
              <div className="text-xs text-white/50 font-medium mb-4">Today · 42 documents analyzed</div>
              <div className="space-y-3">
                {[
                  { title: 'Priority (4)', color: '#ffffff', items: ['Sophia Chen — Q3 review', 'David Lim — contract signoff'] },
                  { title: 'Follow-up (7)', color: '#e5e5e5', items: ['Marcus — design review', 'Figma — comment thread'] },
                  { title: 'Updates (18)', color: '#a3a3a3', items: ['Vercel — deploy ready', 'GitHub — PR #482 merged'] },
                  { title: 'Archived (13)', color: '#525252', items: ['Stripe payout · Newsletter · Receipts'] },
                ].map((group, i) => (
                  <div key={i} className="liquid-glass rounded-lg p-3">
                    <div className="text-xs font-semibold mb-2" style={{ color: group.color }}>{group.title}</div>
                    <div className="flex flex-col gap-1.5">
                      {group.items.map((item, j) => (
                        <div key={j} className="text-[13px] text-white/70 truncate">{item}</div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        {/* Section 6 - LogoCloud */}
        <section className="max-w-6xl mx-auto px-6 py-16 md:py-20 text-center">
          <div className="text-xs uppercase tracking-widest text-white/40">Trusted by the world's most thoughtful teams</div>
          <div className="mt-10 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-6">
            {['Linear', 'Vercel', 'Figma', 'Stripe', 'Ramp', 'Notion', 'Loom', 'Arc'].map((logo, i) => (
              <motion.div 
                key={logo}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.05 }}
                className="text-sm font-semibold tracking-tight text-white/50 hover:text-white transition-colors cursor-default"
              >
                {logo}
              </motion.div>
            ))}
          </div>
        </section>

        {/* Section 7 - Testimonials */}
        <section className="max-w-6xl mx-auto px-6 py-20 md:py-28 border-t border-white/10">
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { text: "Fidelity RAG gave our leadership team four hours of their week back. It reads like research from the future.", author: "Parker Wilf", role: "Group Product Manager", company: "MERCURY" },
              { text: "The command palette alone has changed how I process messages. I can't imagine going back to a traditional client.", author: "Andrew von Rosenbach", role: "Senior Engineering Program Manager", company: "COHERE" },
              { text: "Analysis that actually understands context. Our team stopped dreading Monday morning inboxes.", author: "Mathies Christensen", role: "Engineering Manager", company: "LUNAR" }
            ].map((t, i) => (
              <div key={i} className="liquid-glass rounded-2xl p-6 flex flex-col justify-between">
                <blockquote className="text-sm text-white/80 leading-[1.6]">"{t.text}"</blockquote>
                <figcaption className="mt-6 pt-5 border-t border-white/10">
                  <div className="text-sm font-semibold">{t.author}</div>
                  <div className="text-xs text-white/50 mt-0.5">{t.role}</div>
                  <div className="text-xs text-white font-semibold tracking-wide uppercase mt-1">{t.company}</div>
                </figcaption>
              </div>
            ))}
          </div>
        </section>

        {/* Section 8 - Pricing */}
        <section className="c3-pricing-section">
          <svg className="hidden">
            <filter id="c3-noise-pricing">
              <feTurbulence type="fractalNoise" baseFrequency="0.5" numOctaves="2" stitchTiles="stitch" />
              <feComponentTransfer><feFuncA type="linear" slope="0.075" /></feComponentTransfer>
              <feComposite in2="SourceGraphic" operator="in" result="noise" />
              <feBlend in="SourceGraphic" in2="noise" mode="overlay" />
            </filter>
          </svg>
          
          <div className="c3-watermark-container">
            <div className="c3-watermark-main" style={{ filter: 'url(#c3-noise-pricing)' }}>
              <span className="c3-watermark-line-1">Your funds.</span>
              <span className="c3-watermark-line-2">Revitalized</span>
            </div>
          </div>

          <div className="c3-toggle-wrap">
            <span className="text-sm text-white/60 font-medium">Yearly</span>
            <button className={`c3-toggle ${yearly ? 'active' : ''}`} onClick={() => setYearly(!yearly)}>
              <div className="c3-toggle-knob" />
            </button>
          </div>

          <div className="c3-grid">
            {/* Free */}
            <div className="c3-card">
              <div className="c3-tier-small">Free</div>
              <div className="c3-tier-large">Free</div>
              <div className="c3-desc">For creators taking their first steps with Fidelity.</div>
              <ul className="c3-list flex-1">
                {['Up to 3 projects in the cloud', 'Image export up to 1080p', 'Basic editing tools', 'Free templates and icons', 'Access via web and mobile app'].map((item, i) => (
                  <li key={i}>
                    <div className="c3-check">
                      <svg width="12" height="9" viewBox="0 0 12 9" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M1 4L4.5 7.5L11 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </div>
                    {item}
                  </li>
                ))}
              </ul>
              <button className="c3-btn">Choose Plan</button>
            </div>

            {/* Standard */}
            <div className="c3-card">
              <div className="c3-tier-small">Standard</div>
              <div className="c3-tier-large">{yearly ? '$99,99/y' : '$9,99/m'}</div>
              <div className="c3-desc">For freelancers and small teams who need more freedom and flexibility.</div>
              <ul className="c3-list flex-1">
                {['Up to 50 projects in the cloud', 'Export up to 4K', 'Advanced editing toolkit', 'Team collaboration (up to 5 members)', 'Access to premium template library'].map((item, i) => (
                  <li key={i}>
                    <div className="c3-check">
                      <svg width="12" height="9" viewBox="0 0 12 9" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M1 4L4.5 7.5L11 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </div>
                    {item}
                  </li>
                ))}
              </ul>
              <button className="c3-btn">Choose Plan</button>
            </div>

            {/* Pro */}
            <div className="c3-card c3-card-pro">
              <div className="c3-tier-small">Pro</div>
              <div className="c3-tier-large">{yearly ? '$199,99/y' : '$19,99/m'}</div>
              <div className="c3-desc">For studios, agencies, and professional creators working with brands.</div>
              <ul className="c3-list flex-1">
                {['Unlimited projects', 'Export up to 8K + animations', 'AI-powered content generation tools', 'Unlimited team members', 'Brand customization'].map((item, i) => (
                  <li key={i}>
                    <div className="c3-check">
                      <svg width="12" height="9" viewBox="0 0 12 9" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M1 4L4.5 7.5L11 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </div>
                    {item}
                  </li>
                ))}
              </ul>
              <button className="c3-btn">Choose Plan</button>
            </div>
          </div>
        </section>

        {/* Section 9 - FinalCTA */}
        <section className="max-w-6xl mx-auto px-6 py-20 md:py-32">
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="liquid-glass relative overflow-hidden rounded-3xl px-8 py-16 md:py-24 text-center"
          >
            <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(600px circle at 50% 0%, rgba(255,255,255,0.15), transparent 70%)', opacity: 0.3 }} />
            <h2 className="text-4xl md:text-6xl font-semibold tracking-tight leading-[1.02]">
              Close the tabs.<br/>Open your day.
            </h2>
            <p className="mt-6 text-white/60 max-w-md mx-auto text-sm leading-[1.6]">
              Join thousands of builders, founders, and operators who treat research like a tool — not an obligation.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <AppleButton label="Download Fidelity" />
              <button className="flex items-center gap-2 rounded-full border border-white/15 text-white text-sm font-medium px-5 py-3 hover:bg-white/5 transition-colors">
                Talk to sales
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        </section>
      </div>
    </div>
  );
}
