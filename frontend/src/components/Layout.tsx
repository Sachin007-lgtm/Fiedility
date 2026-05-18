import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';

interface LayoutProps {
  children: React.ReactNode;
  mainClassName?: string;
  title?: string;
}

interface NavMenuProps {
  theme?: 'dark' | 'light';
}

const NAV_LINKS = [
  { label: 'Dashboard',    icon: '◈', path: '/workspace',  desc: 'Research chat' },
  { label: 'Library',      icon: '⊟', path: '/library',    desc: 'Document catalog' },
  { label: 'Ingestion',    icon: '⊕', path: '/ingestion',  desc: 'Pipeline monitor' },
  { label: 'System Health',icon: '◉', path: '/health',     desc: 'Infrastructure' },
  { label: 'Monitoring',   icon: '◎', path: '/monitoring', desc: 'RAG observability' },
];

function NavMenu({ theme = 'dark' }: NavMenuProps) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const ref = useRef<HTMLDivElement>(null);

  /* close on outside click */
  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} className="relative z-50" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      {/* Three-bar button */}
      <button
        onClick={() => setOpen(o => !o)}
        className={`flex flex-col justify-center items-center gap-[5px] w-8 h-8 rounded-lg transition-all ${
          open 
            ? (theme === 'dark' ? 'bg-white/15 text-white' : 'bg-gray-200 text-gray-800') 
            : (theme === 'dark' ? 'text-white/40 hover:text-white hover:bg-white/10' : 'text-gray-400 hover:text-gray-800 hover:bg-gray-100')
        }`}
        aria-label="Navigation menu"
      >
        <span className={`block h-[1.5px] bg-current rounded-full transition-all duration-200 ${open ? 'w-4 rotate-45 translate-y-[6.5px]' : 'w-4'}`} />
        <span className={`block h-[1.5px] bg-current rounded-full transition-all duration-200 ${open ? 'opacity-0 w-0' : 'w-3'}`} />
        <span className={`block h-[1.5px] bg-current rounded-full transition-all duration-200 ${open ? 'w-4 -rotate-45 -translate-y-[6.5px]' : 'w-4'}`} />
      </button>

      {/* Flyout panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-10 w-64 rounded-2xl overflow-hidden shadow-2xl shadow-black/60"
            style={{ background: 'rgba(20,20,20,0.95)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(20px)' }}
          >
            {/* Header */}
            <div className="px-4 py-3 border-b border-white/[0.06]">
              <p className="text-[10px] font-bold text-white/30 uppercase tracking-[0.15em]">ALFA CORE · Navigation</p>
            </div>

            {/* Links */}
            <div className="p-2 space-y-0.5">
              {NAV_LINKS.map(link => (
                <button
                  key={link.path}
                  onClick={() => { setOpen(false); navigate(link.path); }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left group transition-all hover:bg-white/[0.07]"
                >
                  <span className="text-lg text-[#adc6ff]/50 group-hover:text-[#adc6ff] transition-colors font-mono leading-none w-5 text-center">
                    {link.icon}
                  </span>
                  <div>
                    <p className="text-sm text-white/70 group-hover:text-white font-medium transition-colors leading-tight">{link.label}</p>
                    <p className="text-[10px] text-white/25 group-hover:text-white/40 transition-colors">{link.desc}</p>
                  </div>
                  <span className="ml-auto text-white/20 group-hover:text-white/40 transition-colors text-xs">→</span>
                </button>
              ))}
            </div>

            {/* Footer */}
            <div className="px-4 py-2.5 border-t border-white/[0.06] flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#44e2cd] animate-pulse" />
              <span className="text-[10px] text-white/25">Backend connected · port 8000</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function Layout({ children, mainClassName, title = 'ALFA RAG' }: LayoutProps) {
  return (
    <div className="flex flex-col h-screen bg-[#0d0d0d] text-white font-sans overflow-hidden">
      {/* Top bar */}
      <div className="h-12 flex items-center px-4 gap-3 border-b border-white/[0.06] bg-[#0d0d0d] shrink-0">
        <span className="text-sm font-bold text-white/80 tracking-tight select-none">{title}</span>
        
        <div className="ml-auto flex items-center gap-2">
          <NavMenu />
        </div>
      </div>
      
      {/* Main Content Area */}
      <main className={`flex-1 overflow-y-auto ${mainClassName ?? ''}`}>
        {children}
      </main>
    </div>
  );
}

export { NavMenu };
