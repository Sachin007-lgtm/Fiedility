import { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import Layout from '../components/Layout';

interface SysLog { id: number; time: string; level: 'INFO'|'WARN'|'EXEC'; message: string; }

const INIT_LOGS: SysLog[] = [
  { id:1, time:'14:22:01', level:'INFO', message:'Request processed in 142ms on A100-NODE-12.' },
  { id:2, time:'14:21:58', level:'WARN', message:'High memory pressure on inference_shard_04.' },
  { id:3, time:'14:21:55', level:'INFO', message:"Vector sync completed for 'market_trends' namespace." },
  { id:4, time:'14:21:42', level:'EXEC', message:'Batch re-indexing initiated by SYSTEM_USER.' },
  { id:5, time:'14:21:30', level:'INFO', message:'Load balancer shifted traffic to Region B.' },
  { id:6, time:'14:21:28', level:'INFO', message:'Periodic health check: 212/212 services nominal.' },
];



function now() { return new Date().toLocaleTimeString('en-US',{hour12:false}); }

export default function SystemHealth() {
  const [logs, setLogs] = useState<SysLog[]>(INIT_LOGS);
  const logEnd = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const messages = [
      { level:'INFO' as const, message:'Request completed in 128ms.' },
      { level:'INFO' as const, message:'Vector namespace sync OK.' },
      { level:'WARN' as const, message:'CPU spike on shard_02 — 94%.' },
      { level:'INFO' as const, message:'Auto-scaling group nominal.' },
    ];
    const iv = setInterval(() => {
      const m = messages[Math.floor(Math.random()*messages.length)];
      setLogs(p => [...p.slice(-50), { id:p.length+1, time:now(), ...m }]);
    }, 2500);
    return () => clearInterval(iv);
  }, []);

  useEffect(() => { logEnd.current?.scrollIntoView({behavior:'smooth'}); }, [logs]);



  return (
    <Layout title="System Health">
      <div className="p-4 lg:p-8 max-w-5xl mx-auto space-y-6 pb-24 md:pb-8">
        {/* Header */}
        <div className="flex justify-between items-end mb-4">
          <div>
            <h1 className="text-2xl font-semibold text-white tracking-tight">Cluster Infrastructure</h1>
            <p className="text-white/40 text-sm mt-1">Real-time telemetrics for US-EAST-LLM-04</p>
          </div>
          <span className="flex items-center gap-2 bg-[#44e2cd]/10 text-[#44e2cd] px-3 py-1.5 rounded-full text-xs font-semibold border border-[#44e2cd]/20">
            <span className="w-2 h-2 rounded-full bg-[#44e2cd] animate-pulse" /> LIVE CONNECTED
          </span>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          {/* KPI 1 – Latency */}
          <motion.div initial={{opacity:0,y:16}} animate={{opacity:1,y:0}}
            className="md:col-span-4 rounded-2xl p-5 flex flex-col justify-between bg-[#171717] border border-white/10">
            <div className="flex justify-between items-start mb-4">
              <div>
                <span className="text-[10px] text-white/40 uppercase tracking-widest font-semibold">Inference Latency</span>
                <div className="text-4xl font-mono text-[#adc6ff] mt-2">124<span className="text-base ml-1 text-white/40 font-sans">ms</span></div>
              </div>
              <span className="text-[#44e2cd] text-[11px] font-bold flex items-center bg-[#44e2cd]/10 px-2 py-0.5 rounded border border-[#44e2cd]/20">
                -4.2%
              </span>
            </div>
            <div className="h-16 w-full">
              <svg className="w-full h-full" viewBox="0 0 100 40">
                <defs>
                  <linearGradient id="lg1" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#adc6ff" stopOpacity="0.2" />
                    <stop offset="100%" stopColor="#adc6ff" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path d="M0 35 Q 10 30, 20 32 T 40 10 T 60 25 T 80 15 T 100 20" fill="none" stroke="#adc6ff" strokeWidth="2" />
                <path d="M0 35 Q 10 30, 20 32 T 40 10 T 60 25 T 80 15 T 100 20 V 40 H 0 Z" fill="url(#lg1)" />
              </svg>
            </div>
          </motion.div>

          {/* KPI 2 – Vector Embeddings */}
          <motion.div initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} transition={{delay:0.08}}
            className="md:col-span-4 rounded-2xl p-5 bg-[#171717] border border-white/10">
            <div className="flex justify-between items-start mb-2">
              <div>
                <span className="text-[10px] text-white/40 uppercase tracking-widest font-semibold">Embeddings</span>
                <div className="text-4xl font-mono text-white mt-2">1.42<span className="text-base ml-1 text-white/40 font-sans">B</span></div>
              </div>
            </div>
            <div className="space-y-3 mt-4">
              <div className="flex justify-between text-[11px]">
                <span className="text-white/40">alpha_embeddings_prod</span>
                <span className="text-[#44e2cd] font-bold">ACTIVE</span>
              </div>
              <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                <div className="bg-white/40 h-full w-[68%]" />
              </div>
              <div className="text-[11px] text-white/30">68% of provisioned capacity</div>
            </div>
          </motion.div>

          {/* KPI 3 – GPU Cluster */}
          <motion.div initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} transition={{delay:0.16}}
            className="md:col-span-4 rounded-2xl p-5 flex flex-col justify-between bg-[#171717] border border-white/10">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] text-white/40 uppercase tracking-widest font-semibold">Cluster Load</span>
                <div className="text-4xl font-mono text-white mt-2">92.4%</div>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-1 mt-4">
              {['bg-[#adc6ff]','bg-[#adc6ff]','bg-[#adc6ff]','bg-white/10','bg-[#adc6ff]','bg-[#adc6ff]','bg-red-400 animate-pulse','bg-[#adc6ff]'].map((cls,i)=>(
                <div key={i} className={`h-2 rounded-sm ${cls}`} />
              ))}
            </div>
            <div className="mt-4 flex justify-between items-center text-[11px]">
              <span className="text-red-400 font-semibold flex items-center gap-1">
                Node-07 High Temp
              </span>
              <span className="text-white/30">64 Nodes Online</span>
            </div>
          </motion.div>

          {/* Live system log */}
          <motion.div initial={{opacity:0}} animate={{opacity:1}} transition={{delay:0.25}}
            className="md:col-span-12 rounded-2xl flex flex-col h-[360px] bg-[#171717] border border-white/10">
            <div className="p-4 border-b border-white/[0.06] flex justify-between items-center bg-white/[0.02]">
              <span className="font-bold flex items-center gap-2 text-sm text-white/80">
                Live System Log
              </span>
              <span className="text-[11px] text-white/30">Streaming...</span>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3 font-mono text-[12px]">
              {logs.map(log => (
                <div key={log.id} className="flex gap-4 border-b border-white/[0.03] pb-2 last:border-0">
                  <span className="text-white/30 shrink-0">{log.time}</span>
                  <span className={log.level === 'WARN' ? 'text-red-400' : log.level === 'EXEC' ? 'text-[#adc6ff]' : 'text-[#44e2cd]'}>
                    [{log.level}]
                  </span>
                  <span className="text-white/60">{log.message}</span>
                </div>
              ))}
              <div ref={logEnd} />
            </div>
            <div className="p-3 border-t border-white/[0.06] bg-black/20">
              <div className="flex items-center gap-2 text-white/30 text-[11px]">
                <div className="w-1.5 h-1.5 rounded-full bg-[#44e2cd]" />
                Connected to ALFA-INFRA-STREAM-01
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </Layout>
  );
}
