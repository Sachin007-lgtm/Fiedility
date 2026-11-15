import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  MessageSquare, 
  FolderArchive, 
  Activity, 
  Home, 
  Menu, 
  X, 
  LogOut, 
  Sparkles,
  ChevronDown
} from 'lucide-react';
import ThemeToggle from './ThemeToggle';
import { useTheme } from '../context/ThemeContext';

interface LayoutProps {
  children: React.ReactNode;
  mainClassName?: string;
  title?: string;
}

const NAV_ITEMS = [
  { label: 'Research', icon: MessageSquare, path: '/workspace', desc: 'AI Fund Chat' },
  { label: 'Library', icon: FolderArchive, path: '/library', desc: 'Document Catalog' },
  { label: 'Monitoring', icon: Activity, path: '/monitoring', desc: 'RAG Observability & Citations' },
];

export function NavMenu({ theme = 'dark' }: { theme?: 'dark' | 'light' }) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="p-2 rounded-xl transition-all border dark:border-white/10 dark:text-white/70 dark:hover:text-white dark:hover:bg-white/5 dark:bg-[#141416] border-slate-200 text-slate-700 hover:text-black hover:bg-slate-100 bg-white shadow-sm"
        aria-label="Navigation Menu"
      >
        {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-12 w-64 rounded-2xl liquid-glass border dark:border-white/15 border-slate-200 p-2 shadow-2xl z-50 dark:bg-[#12141a]/95 bg-white/95 backdrop-blur-xl"
          >
            <div className="px-3 py-2 border-b dark:border-white/10 border-slate-100 mb-1 flex items-center justify-between">
              <span className="text-[10px] font-bold tracking-widest uppercase dark:text-white/50 text-slate-400">Finsight Platform</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#3D81E3]/20 text-[#3D81E3] dark:text-[#adc6ff] font-mono">v2.0</span>
            </div>
            <div className="space-y-1">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const active = location.pathname === item.path;
                return (
                  <button
                    key={item.path}
                    onClick={() => { setOpen(false); navigate(item.path); }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all ${
                      active 
                        ? 'bg-[#3D81E3]/15 text-[#3D81E3] dark:text-white border border-[#3D81E3]/40' 
                        : 'dark:text-white/70 dark:hover:bg-white/5 dark:hover:text-white text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${active ? 'text-[#3D81E3]' : 'opacity-60'}`} />
                    <div className="flex-1">
                      <div className="text-xs font-semibold">{item.label}</div>
                      <div className="text-[10px] dark:text-white/40 text-slate-400">{item.desc}</div>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="border-t dark:border-white/10 border-slate-100 mt-2 pt-2 space-y-1">
              <ThemeToggle showLabel className="w-full justify-start px-3 py-2 text-xs" />
              <Link
                to="/"
                onClick={() => setOpen(false)}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs dark:text-white/60 dark:hover:text-white dark:hover:bg-white/5 text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <Home className="w-4 h-4 opacity-60" />
                Landing Page
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function Layout({ children, mainClassName, title = 'Finsight' }: LayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const [apiOnline, setApiOnline] = useState<boolean | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);

  // Read stored user
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('alfa_user') || '{}'); }
    catch { return {}; }
  });

  const userName = user?.name || 'Institutional Analyst';
  const userEmail = user?.email || 'analyst@finsight.ai';
  const userInitial = userName.charAt(0).toUpperCase() || 'F';

  // Check backend health
  useEffect(() => {
    fetch('http://localhost:8000/health')
      .then(res => res.ok ? setApiOnline(true) : setApiOnline(false))
      .catch(() => setApiOnline(false));
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('alfa_token');
    localStorage.removeItem('alfa_user');
    setUser({});
    navigate('/auth');
  };

  return (
    <div className="flex flex-col h-screen dark:bg-[#0c0c0e] dark:text-white bg-[#f8fafc] text-slate-900 font-sans overflow-hidden transition-colors duration-250">
      {/* ── Global Header ── */}
      <header className="h-14 flex items-center px-4 lg:px-6 gap-3 border-b dark:border-white/10 border-slate-200/80 dark:bg-[#0c0c0e]/90 bg-white/90 backdrop-blur-xl shrink-0 z-40">
        {/* Brand */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-xl bg-[#050505] shadow-[0_0_15px_rgba(61,129,227,0.3)] border border-white/10 overflow-hidden flex items-center justify-center transition-transform group-hover:scale-105">
            <img 
              src="/logo.png" 
              alt="Finsight Logo" 
              className="w-full h-full object-cover scale-[1.1]" 
              onError={(e) => { e.currentTarget.style.display = 'none'; }} 
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-base dark:text-white text-slate-900 tracking-tight">Finsight</span>
            <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gradient-to-r from-[#3D81E3]/20 to-[#00d2ff]/20 text-[#3D81E3] dark:text-[#adc6ff] border border-[#3D81E3]/30">
              <Sparkles className="w-3 h-3 text-[#3D81E3] dark:text-[#00d2ff]" />
              INSTITUTIONAL
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Tabs */}
        <nav className="hidden md:flex items-center gap-1.5 ml-8 dark:bg-white/[0.03] dark:border-white/10 bg-slate-100 border border-slate-200 rounded-2xl p-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  active
                    ? 'bg-[#3D81E3] text-white shadow-[0_0_15px_rgba(61,129,227,0.4)]'
                    : 'dark:text-white/60 dark:hover:text-white dark:hover:bg-white/5 text-slate-600 hover:text-slate-900 hover:bg-white/80'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${active ? 'text-white' : 'opacity-60'}`} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Right Section */}
        <div className="ml-auto flex items-center gap-2.5">
          {/* Status pill */}
          <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-full dark:bg-white/[0.04] dark:border-white/10 bg-slate-100 border border-slate-200 text-[11px] font-mono">
            <span className={`w-2 h-2 rounded-full ${apiOnline === true ? 'bg-emerald-500 animate-pulse' : apiOnline === false ? 'bg-red-500' : 'bg-yellow-500 animate-pulse'}`} />
            <span className="dark:text-white/60 text-slate-600">
              {apiOnline === true ? 'API Online · 8000' : apiOnline === false ? 'API Offline' : 'Connecting...'}
            </span>
          </div>

          {/* Theme Toggle Button (Light/Dark Switch) */}
          <ThemeToggle />

          {/* User profile dropdown */}
          <div className="relative">
            <button
              onClick={() => setProfileOpen(o => !o)}
              className="flex items-center gap-2 p-1 pl-2 rounded-xl border dark:border-white/10 dark:bg-white/[0.03] border-slate-200 bg-white shadow-sm hover:border-slate-300 dark:hover:border-white/20 transition-all"
            >
              <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-[#3D81E3] to-[#00d2ff] flex items-center justify-center text-xs font-bold text-white shadow-sm">
                {userInitial}
              </div>
              <span className="hidden sm:inline text-xs font-medium dark:text-white/80 text-slate-800 max-w-[100px] truncate">{userName}</span>
              <ChevronDown className="w-3.5 h-3.5 opacity-50" />
            </button>

            <AnimatePresence>
              {profileOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 6, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 6, scale: 0.96 }}
                  className="absolute right-0 top-11 w-56 rounded-2xl liquid-glass border dark:border-white/15 border-slate-200 p-2 shadow-2xl z-50 dark:bg-[#12141a]/95 bg-white/95 backdrop-blur-xl text-slate-800 dark:text-white"
                >
                  <div className="p-3 border-b dark:border-white/10 border-slate-100 mb-1">
                    <p className="text-xs font-bold dark:text-white text-slate-900 truncate">{userName}</p>
                    <p className="text-[11px] dark:text-white/40 text-slate-500 truncate">{userEmail}</p>
                  </div>
                  <Link
                    to="/workspace"
                    onClick={() => setProfileOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs dark:text-white/70 dark:hover:text-white dark:hover:bg-white/5 text-slate-700 hover:bg-slate-100 transition-colors"
                  >
                    <MessageSquare className="w-4 h-4 text-[#3D81E3]" />
                    Research Workspace
                  </Link>
                  <Link
                    to="/"
                    onClick={() => setProfileOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs dark:text-white/70 dark:hover:text-white dark:hover:bg-white/5 text-slate-700 hover:bg-slate-100 transition-colors"
                  >
                    <Home className="w-4 h-4 opacity-60" />
                    Home Page
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-red-500 hover:text-red-600 hover:bg-red-500/10 transition-colors mt-1"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Mobile hamburger menu */}
          <div className="md:hidden">
            <NavMenu theme={theme} />
          </div>
        </div>
      </header>

      {/* ── Main Content Area ── */}
      <main className={`flex-1 overflow-y-auto relative ${mainClassName ?? ''}`}>
        {children}
      </main>
    </div>
  );
}
