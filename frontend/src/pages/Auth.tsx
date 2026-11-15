import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ChevronLeft, ArrowRight, Sparkles } from 'lucide-react';
import ThemeToggle from '../components/ThemeToggle';

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
    setError('');
    setLoading(true);
    try {
      const res = await fetch('http://localhost:8000/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Login failed');
      localStorage.setItem('alfa_token', data.access_token);
      localStorage.setItem('alfa_user', JSON.stringify({ name: data.name, email: data.email }));
      navigate('/workspace');
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('http://localhost:8000/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Signup failed');
      localStorage.setItem('alfa_token', data.access_token);
      localStorage.setItem('alfa_user', JSON.stringify({ name: data.name, email: data.email }));
      navigate('/workspace');
    } catch (err: any) {
      setError(err.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGuestAccess = () => {
    localStorage.setItem('alfa_token', 'guest_demo_token');
    localStorage.setItem('alfa_user', JSON.stringify({ name: 'Guest Analyst', email: 'analyst@finsight.ai' }));
    navigate('/workspace');
  };

  return (
    <div className="relative min-h-screen overflow-hidden dark:bg-[#0c0c0c] bg-slate-50 dark:text-white text-slate-900 flex flex-col justify-center items-center p-4 selection:bg-[#3D81E3]/30 transition-colors duration-250">
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
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] dark:from-transparent dark:via-black/25 dark:to-[#0c0c0e]/85 from-transparent via-white/10 to-slate-100/70 transition-colors duration-300" />
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-b dark:from-[#0c0c0e]/60 dark:via-transparent dark:to-[#0c0c0e]/90 from-white/60 via-transparent to-slate-50/90 transition-colors duration-300" />
      </div>

      {/* Top Bar with Frosted Glass Pills */}
      <div className="fixed top-6 left-6 right-6 flex items-center justify-between z-20 max-w-4xl mx-auto pointer-events-auto">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm dark:text-white text-slate-800 font-semibold px-4 py-2 rounded-full dark:bg-black/40 bg-white/80 backdrop-blur-xl border dark:border-white/15 border-white/60 shadow-lg hover:scale-105 transition-all"
        >
          <ChevronLeft className="w-4 h-4" /> Back to home
        </Link>
        <div className="p-1 rounded-full dark:bg-black/40 bg-white/80 backdrop-blur-xl border dark:border-white/15 border-white/60 shadow-lg">
          <ThemeToggle showLabel className="border-0 bg-transparent shadow-none" />
        </div>
      </div>

      <div className="relative z-10 w-full max-w-[420px] mt-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="liquid-glass rounded-3xl border dark:border-white/15 border-white/70 shadow-2xl relative overflow-hidden group dark:bg-[#111318]/90 bg-white/95 backdrop-blur-2xl"
        >
          {/* Top highlight glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-px bg-gradient-to-r from-transparent via-[#3D81E3] to-transparent opacity-60" />

          <div className="p-6 md:p-8 pb-6">
            <div className="flex flex-col items-center mb-6">
              <div className="w-16 h-16 rounded-[22px] bg-[#050505] shadow-[0_0_25px_rgba(61,129,227,0.35)] border border-white/15 overflow-hidden mb-3 flex items-center justify-center">
                <img
                  src="/logo.png"
                  alt="Finsight Logo"
                  className="w-full h-full object-cover scale-[1.1]"
                  onError={e => { e.currentTarget.style.display = 'none'; }}
                />
              </div>
              <h2 className="text-xl font-bold dark:text-white text-slate-900 tracking-tight">Finsight</h2>
              <p className="text-xs dark:text-white/60 text-slate-500 mt-0.5 font-medium">Institutional Financial Intelligence</p>

              {error && (
                <div className="w-full mt-3 text-red-500 text-xs text-center font-semibold bg-red-500/10 px-3 py-2 rounded-xl border border-red-500/20">
                  {error}
                </div>
              )}
            </div>

            {/* Sliding Container */}
            <div className="relative w-full overflow-hidden">
              <motion.div
                className="flex w-[200%] items-start"
                animate={{ x: isLogin ? '0%' : '-50%' }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              >
                {/* ── Login Form ── */}
                <div className="w-1/2 px-1 flex flex-col">
                  <div className="text-center mb-4">
                    <h1 className="text-base font-bold dark:text-white text-slate-900 mb-0.5">Welcome back</h1>
                    <p className="dark:text-white/50 text-slate-500 text-xs">Enter your analyst credentials.</p>
                  </div>

                  <form onSubmit={handleLoginSubmit} className="space-y-3 flex-1">
                    <div>
                      <label className="block text-[10px] font-bold dark:text-white/70 text-slate-700 uppercase tracking-wider mb-1.5">
                        Email Address
                      </label>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        className="w-full dark:bg-black/30 bg-slate-50 border dark:border-white/10 border-slate-300 rounded-xl px-4 py-2.5 text-sm dark:text-white text-slate-900 dark:placeholder:text-white/30 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#3D81E3]/50 focus:border-transparent transition-all"
                        placeholder="analyst@firm.com"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold dark:text-white/70 text-slate-700 uppercase tracking-wider mb-1.5">
                        Password
                      </label>
                      <input
                        type="password"
                        required
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        className="w-full dark:bg-black/30 bg-slate-50 border dark:border-white/10 border-slate-300 rounded-xl px-4 py-2.5 text-sm dark:text-white text-slate-900 dark:placeholder:text-white/30 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#3D81E3]/50 focus:border-transparent transition-all"
                        placeholder="••••••••"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full mt-2 rounded-xl bg-[#3D81E3] hover:bg-[#2c6ecf] text-white text-xs font-semibold py-3 px-4 flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(61,129,227,0.3)] transition-all active:scale-[0.98] disabled:opacity-50"
                    >
                      {loading ? 'Authenticating...' : 'Sign in to Workspace'}
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </form>

                  <div className="mt-5 text-center text-xs dark:text-white/60 text-slate-500">
                    Don't have an account?{' '}
                    <button
                      type="button"
                      onClick={() => setIsLogin(false)}
                      className="text-[#3D81E3] hover:underline font-bold ml-1"
                    >
                      Create account
                    </button>
                  </div>
                </div>

                {/* ── Signup Form ── */}
                <div className="w-1/2 px-1 flex flex-col">
                  <div className="text-center mb-4">
                    <h1 className="text-base font-bold dark:text-white text-slate-900 mb-0.5">Create Analyst Account</h1>
                    <p className="dark:text-white/50 text-slate-500 text-xs">Start your AI-powered fund research.</p>
                  </div>

                  <form onSubmit={handleSignupSubmit} className="space-y-3 flex-1">
                    <div>
                      <label className="block text-[10px] font-bold dark:text-white/70 text-slate-700 uppercase tracking-wider mb-1.5">
                        Full Name
                      </label>
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={e => setName(e.target.value)}
                        className="w-full dark:bg-black/30 bg-slate-50 border dark:border-white/10 border-slate-300 rounded-xl px-4 py-2.5 text-sm dark:text-white text-slate-900 dark:placeholder:text-white/30 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#3D81E3]/50 focus:border-transparent transition-all"
                        placeholder="Jane Doe"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold dark:text-white/70 text-slate-700 uppercase tracking-wider mb-1.5">
                        Email Address
                      </label>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        className="w-full dark:bg-black/30 bg-slate-50 border dark:border-white/10 border-slate-300 rounded-xl px-4 py-2.5 text-sm dark:text-white text-slate-900 dark:placeholder:text-white/30 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#3D81E3]/50 focus:border-transparent transition-all"
                        placeholder="analyst@firm.com"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold dark:text-white/70 text-slate-700 uppercase tracking-wider mb-1.5">
                        Password
                      </label>
                      <input
                        type="password"
                        required
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        className="w-full dark:bg-black/30 bg-slate-50 border dark:border-white/10 border-slate-300 rounded-xl px-4 py-2.5 text-sm dark:text-white text-slate-900 dark:placeholder:text-white/30 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#3D81E3]/50 focus:border-transparent transition-all"
                        placeholder="••••••••"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full mt-2 rounded-xl bg-[#3D81E3] hover:bg-[#2c6ecf] text-white text-xs font-semibold py-3 px-4 flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(61,129,227,0.3)] transition-all active:scale-[0.98] disabled:opacity-50"
                    >
                      {loading ? 'Creating...' : 'Create Account'}
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </form>

                  <div className="mt-5 text-center text-xs dark:text-white/60 text-slate-500">
                    Already have an account?{' '}
                    <button
                      type="button"
                      onClick={() => setIsLogin(true)}
                      className="text-[#3D81E3] hover:underline font-bold ml-1"
                    >
                      Sign in
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Quick Guest Demo Access */}
            <div className="mt-6 pt-5 border-t dark:border-white/10 border-slate-200 text-center">
              <p className="text-[11px] dark:text-white/50 text-slate-500 mb-2.5 font-medium">Exploring or demoing the platform?</p>
              <button
                type="button"
                onClick={handleGuestAccess}
                className="w-full py-3 px-4 rounded-xl dark:bg-white/[0.06] dark:border-white/15 dark:text-white bg-slate-100 border border-slate-300 text-slate-800 hover:border-[#3D81E3] hover:bg-[#3D81E3]/10 text-xs font-semibold flex items-center justify-center gap-2 transition-all group shadow-sm active:scale-[0.99]"
              >
                <Sparkles className="w-4 h-4 text-[#3D81E3] dark:text-[#00d2ff] group-hover:scale-110 transition-transform" />
                Continue as Guest Analyst (Instant Access)
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
