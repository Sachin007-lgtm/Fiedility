import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ChevronLeft, ArrowRight } from 'lucide-react';

export default function Auth() {
  const location = useLocation();
  const [isLogin, setIsLogin] = useState(location.pathname === '/signup' ? false : true);
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const res = await fetch('http://localhost:8000/auth/login', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Login failed');
      localStorage.setItem('alfa_token', data.access_token);
      localStorage.setItem('alfa_user', JSON.stringify({ name: data.name, email: data.email }));
      navigate('/workspace');
    } catch (err: any) { setError(err.message); } finally { setLoading(false); }
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const res = await fetch('http://localhost:8000/auth/signup', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Signup failed');
      localStorage.setItem('alfa_token', data.access_token);
      localStorage.setItem('alfa_user', JSON.stringify({ name: data.name, email: data.email }));
      navigate('/workspace');
    } catch (err: any) { setError(err.message); } finally { setLoading(false); }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0c0c0c] text-white flex flex-col justify-center items-center p-4 selection:bg-brand/30">
      {/* Background Video/Glow */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <video autoPlay muted playsInline loop className="w-full h-full object-cover pointer-events-none opacity-50"
          src="/vecteezy_ai-generated-clear-cloudy-sky-seamless-looping-animated-video_35594972.mp4" />
        <div className="absolute inset-0 bg-[#0c0c0c]/80 backdrop-blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-[400px]">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-white/50 hover:text-white mb-6 transition-colors">
          <ChevronLeft className="w-4 h-4" /> Back to home
        </Link>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="liquid-glass rounded-3xl border border-white/10 shadow-2xl relative overflow-hidden group">
          {/* Subtle Glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-px bg-gradient-to-r from-transparent via-brand/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-10" />
          
          <div className="p-6 md:p-8 pb-6">
            <div className="flex flex-col items-center mb-6">
              <div className="w-16 h-16 rounded-[20px] bg-[#050505] shadow-[0_0_20px_rgba(255,255,255,0.2)] border border-white/10 overflow-hidden mb-4 flex items-center justify-center">
                <img src="/logo.png" alt="Logo" className="w-full h-full object-cover scale-[1.1]" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
              </div>
              {error && <div className="text-red-400 text-xs text-center font-medium bg-red-400/10 px-3 py-1.5 rounded-lg border border-red-400/20">{error}</div>}
            </div>

            {/* Sliding Container */}
            <div className="relative w-full overflow-hidden">
              <motion.div 
                className="flex w-[200%] items-start"
                animate={{ x: isLogin ? '0%' : '-50%' }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              >
                {/* Login Form */}
                <div className="w-1/2 px-2 flex flex-col">
                  <div className="text-center mb-4">
                    <h1 className="text-xl font-bold tracking-tight text-white mb-1">Welcome back</h1>
                    <p className="text-white/50 text-xs">Enter your details to access your workspace.</p>
                  </div>
                  <form onSubmit={handleLoginSubmit} className="space-y-3 flex-1">
                    <div>
                      <label className="block text-[10px] font-semibold text-white/60 uppercase tracking-wider mb-1.5">Email</label>
                      <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-transparent transition-all"
                        placeholder="investor@firm.com" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-white/60 uppercase tracking-wider mb-1.5">Password</label>
                      <input type="password" required value={password} onChange={e => setPassword(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-transparent transition-all"
                        placeholder="••••••••" />
                    </div>
                    <div className="flex items-center justify-between mt-2 mb-4 text-xs">
                      <label className="flex items-center gap-2 cursor-pointer text-white/60 hover:text-white transition-colors">
                        <input type="checkbox" className="rounded border-white/10 bg-white/5 text-brand focus:ring-brand/50" />
                        <span>Remember me</span>
                      </label>
                      <a href="#" className="text-brand hover:text-brand/80 transition-colors">Forgot password?</a>
                    </div>
                    <button type="submit" disabled={loading}
                      className="w-full relative group overflow-hidden rounded-xl bg-brand text-white text-sm font-semibold py-2.5 px-4 flex items-center justify-center gap-2 hover:bg-brand/90 transition-all active:scale-[0.98] disabled:opacity-50">
                      {loading ? 'Signing in...' : 'Sign in'}
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </button>
                  </form>
                  <div className="mt-6 text-center text-xs text-white/50">
                    Don't have an account? <button type="button" onClick={() => setIsLogin(false)} className="text-brand hover:text-white transition-colors ml-1">Sign up</button>
                  </div>
                </div>

                {/* Signup Form */}
                <div className="w-1/2 px-2 flex flex-col">
                  <div className="text-center mb-4">
                    <h1 className="text-xl font-bold tracking-tight text-white mb-1">Create an account</h1>
                    <p className="text-white/50 text-xs">Start your AI-powered fund research today.</p>
                  </div>
                  <form onSubmit={handleSignupSubmit} className="space-y-3 flex-1">
                    <div>
                      <label className="block text-[10px] font-semibold text-white/60 uppercase tracking-wider mb-1.5">Full Name</label>
                      <input type="text" required value={name} onChange={e => setName(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-transparent transition-all"
                        placeholder="Jane Doe" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-white/60 uppercase tracking-wider mb-1.5">Email</label>
                      <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-transparent transition-all"
                        placeholder="investor@firm.com" />
                    </div>
                    <div className="mb-4">
                      <label className="block text-[10px] font-semibold text-white/60 uppercase tracking-wider mb-1.5">Password</label>
                      <input type="password" required value={password} onChange={e => setPassword(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-transparent transition-all"
                        placeholder="••••••••" />
                    </div>
                    <button type="submit" disabled={loading}
                      className="w-full relative group overflow-hidden rounded-xl bg-brand text-white text-sm font-semibold py-2.5 px-4 flex items-center justify-center gap-2 hover:bg-brand/90 transition-all active:scale-[0.98] disabled:opacity-50">
                      {loading ? 'Creating...' : 'Create Account'}
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </button>
                  </form>
                  <div className="mt-6 text-center text-xs text-white/50">
                    Already have an account? <button type="button" onClick={() => setIsLogin(true)} className="text-brand hover:text-white transition-colors ml-1">Sign in</button>
                  </div>
                </div>

              </motion.div>
            </div>

            <div className="mt-6 mb-4 flex items-center gap-4 before:h-px before:flex-1 before:bg-white/10 after:h-px after:flex-1 after:bg-white/10">
              <span className="text-[10px] font-medium text-white/30 uppercase tracking-wider">Or continue with</span>
            </div>

            <div className="flex gap-3">
              <button type="button" className="flex-1 rounded-xl bg-white/5 border border-white/10 text-white text-sm font-medium py-2.5 px-4 flex items-center justify-center gap-2 hover:bg-white/10 transition-all">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"/></svg>
                Google
              </button>
              <button type="button" className="flex-1 rounded-xl bg-white/5 border border-white/10 text-white text-sm font-medium py-2.5 px-4 flex items-center justify-center gap-2 hover:bg-white/10 transition-all">
                <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path></svg>
                Github
              </button>
            </div>

          </div>
        </motion.div>
      </div>
    </div>
  );
}
