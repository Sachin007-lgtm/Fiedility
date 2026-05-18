import { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import Layout from '../components/Layout';

interface LogEntry { id: number; time: string; level: 'INFO'|'DEBUG'|'SUCCESS'|'WARN'; message: string; }

const INIT_LOGS: LogEntry[] = [
  { id:1, time:'14:22:01', level:'INFO', message:'Initializing PDF worker pool (size=8)...' },
  { id:2, time:'14:22:03', level:'INFO', message:'Fetching document: s3://vault-01/financial_reports_2024_q3.pdf' },
  { id:3, time:'14:22:04', level:'DEBUG', message:'Page 1-12 parsed. OCR layer detected.' },
  { id:4, time:'14:22:06', level:'INFO', message:'Chunking complete. 142 segments generated.' },
  { id:5, time:'14:22:08', level:'SUCCESS', message:'Batch embedding sent to inference endpoint.' },
  { id:6, time:'14:22:10', level:'INFO', message:"Upserting 142 vectors to ChromaDB collection 'market-v1'." },
  { id:7, time:'14:22:12', level:'WARN', message:'Latency spike detected in ChromaDB upsert (420ms).' },
  { id:8, time:'14:22:15', level:'INFO', message:'Document doc_id_7782 fully ingested.' },
];

const levelColor: Record<string,string> = {
  INFO:'text-white/40', DEBUG:'text-[#adc6ff]',
  SUCCESS:'text-[#44e2cd]', WARN:'text-red-400',
};

const workers = [
  { id:'CORE_W_01', status:'BUSY', cpu:78, task:'PDF_EXTRACTION' },
  { id:'CORE_W_02', status:'BUSY', cpu:92, task:'EMBEDDING_GEN' },
  { id:'CORE_W_03', status:'IDLE', cpu:2,  task:null },
  { id:'CORE_W_04', status:'BUSY', cpu:55, task:'CHUNKING' },
];

function now() { return new Date().toLocaleTimeString('en-US',{hour12:false}); }

export default function IngestionPipeline() {
  const [running, setRunning] = useState(true);
  const [logs, setLogs] = useState<LogEntry[]>(INIT_LOGS);
  const [pdfPct, setPdfPct] = useState(75);
  const logEnd = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!running) return;
    const msgs = [
      'Processing chunk batch...',
      `Embedding latency: ${(Math.random()*30+10).toFixed(0)}ms`,
      `Vector upsert confirmed. Count: ${Math.floor(Math.random()*50+100)}`,
    ];
    const iv = setInterval(() => {
      setLogs(p => [...p.slice(-40), { id:p.length+1, time:now(), level:'INFO', message:msgs[Math.floor(Math.random()*msgs.length)] }]);
      setPdfPct(p => Math.min(100, p + Math.random()*3));
    }, 1800);
    return () => clearInterval(iv);
  }, [running]);

  useEffect(() => { logEnd.current?.scrollIntoView({behavior:'smooth'}); }, [logs]);

  return (
    <Layout title="Pipeline">
      <div className="flex flex-col h-full bg-[#0d0d0d] overflow-hidden">
        <div className="flex justify-between items-center px-6 pt-6 pb-4 border-b border-white/[0.06] shrink-0">
          <div>
            <h1 className="text-2xl font-semibold text-white tracking-tight">Ingestion Pipeline</h1>
            <p className="text-white/40 text-sm mt-1">Real-time visualization of document vectorization.</p>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setRunning(false)} className="bg-[#171717] text-white/80 px-4 py-2 rounded-lg border border-white/10 flex items-center gap-2 hover:bg-white/[0.04] transition-colors text-sm">
              <span className="material-symbols-outlined text-[18px]">pause</span> Pause
            </button>
            <button onClick={() => setRunning(true)} className="bg-white text-black px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-white/90 transition-colors text-sm font-semibold">
              <span className="material-symbols-outlined text-[18px]">play_arrow</span> Resume
            </button>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          <div className="flex-1 flex flex-col p-6 space-y-6 overflow-y-auto">
            {/* Pipeline stages */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 shrink-0">
              {[
                { label:'PDF Loading', icon:'picture_as_pdf', color:'#adc6ff', layer:'01', desc:'Parsing docs and OCR extraction.', content:(
                  <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                    <motion.div className="bg-[#adc6ff] h-full rounded-full" animate={{width:`${pdfPct}%`}} transition={{duration:0.8}} />
                  </div>
                )},
                { label:'Semantic Chunking', icon:'content_cut', color:'#44e2cd', layer:'02', desc:'Recursive splitting with 512 token overlap.', content:(
                  <div className="flex gap-1 justify-center">
                    {[0.2,0.4,0.6,1,0.2].map((o,i) => <div key={i} className="w-5 h-5 bg-[#44e2cd] rounded-sm" style={{opacity:o}} />)}
                  </div>
                )},
                { label:'Embedding', icon:'hub', color:'#adc6ff', layer:'03', desc:'Generating 768d vectors via Sentence-Transformers.', content:(
                  <div className="grid grid-cols-4 gap-2 w-full">
                    {[0.2,0.8,0.4,0.1].map((o,i) => <div key={i} className="h-1 bg-[#adc6ff] rounded-full" style={{opacity:o}} />)}
                  </div>
                )},
              ].map(({ label, icon, color, layer, desc, content }) => (
                <motion.div key={layer} initial={{opacity:0,y:20}} animate={{opacity:1,y:0}}
                  className={`bg-[#171717] border border-white/10 rounded-2xl p-6 relative transition-all`}>
                  <div className="absolute -top-3 left-6 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest" style={{backgroundColor: color, color: '#000'}}>LAYER {layer}</div>
                  <div className="flex flex-col items-center text-center space-y-4">
                    <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{backgroundColor: `${color}1A`, color: color}}>
                      <span className="material-symbols-outlined text-4xl" style={{fontVariationSettings:"'FILL' 1"}}>{icon}</span>
                    </div>
                    <h3 className="text-xl font-bold text-white">{label}</h3>
                    <p className="text-white/40 text-sm">{desc}</p>
                    {content}
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Live log */}
            <div className="flex-1 flex flex-col bg-[#171717] border border-white/10 rounded-2xl overflow-hidden min-h-[240px]">
              <div className="bg-white/[0.02] px-5 py-3 border-b border-white/5 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  {running && <span className="w-2 h-2 rounded-full bg-[#44e2cd] animate-pulse" />}
                  <span className="text-[11px] font-bold uppercase tracking-widest text-white/80">Live Execution Logs</span>
                </div>
                <div className="flex gap-4 text-[11px] text-white/40">
                  <span>Errors: 0</span><span>Warnings: 2</span><span>Throughput: 1.2k tok/s</span>
                </div>
              </div>
              <div className="flex-1 p-5 font-mono text-xs overflow-y-auto space-y-2 bg-black/40">
                {logs.map(log => (
                  <p key={log.id} className={levelColor[log.level]}>
                    <span className="text-[#adc6ff] mr-3">[{log.time}]</span>
                    <span className="mr-2 opacity-70">{log.level}:</span>{log.message}
                  </p>
                ))}
                {running && <p className="flex items-center gap-2 text-white/30 mt-2"><span className="text-[#adc6ff]">[{now()}]</span><span className="w-1.5 h-3 bg-[#adc6ff] animate-pulse" />Awaiting next task...</p>}
                <div ref={logEnd} />
              </div>
            </div>
          </div>

          {/* Worker side panel */}
          <aside className="w-80 bg-[#171717] border-l border-white/[0.06] p-6 flex flex-col space-y-8 overflow-y-auto hidden xl:flex shrink-0">
            <div>
              <h2 className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-4">
                Worker Nodes ({workers.filter(w=>w.status==='BUSY').length}/{workers.length})
              </h2>
              <div className="space-y-3">
                {workers.map(w => (
                  <div key={w.id} className={`p-3 bg-white/[0.02] rounded-lg border-l-4 ${w.status==='BUSY'?'border-[#44e2cd]':'border-white/20'}`}>
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-bold text-sm text-white">{w.id}</span>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${w.status==='BUSY'?'bg-[#44e2cd]/10 text-[#44e2cd]':'bg-white/10 text-white/60'}`}>{w.status}</span>
                    </div>
                    <div className="flex justify-between text-[11px] mb-1.5"><span className="text-white/40">CPU Usage</span><span className="text-white/80">{w.cpu}%</span></div>
                    <div className="w-full bg-white/5 h-1 rounded-full overflow-hidden">
                      <div className={`h-full ${w.status==='BUSY'?'bg-[#44e2cd]':'bg-white/20'}`} style={{width:`${w.cpu}%`}} />
                    </div>
                    {w.task && <div className="text-[11px] text-white/40 mt-2 truncate">Task: {w.task}</div>}
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h2 className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-4">Pipeline Health</h2>
              <div className="space-y-4">
                {[{icon:'speed',label:'Avg. Latency',value:'142ms',color:'text-[#adc6ff]'},{icon:'description',label:'Daily Volume',value:'4.2k Docs',color:'text-[#44e2cd]'}].map(s=>(
                  <div key={s.label} className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-lg bg-white/[0.04] flex items-center justify-center ${s.color}`}>
                      <span className="material-symbols-outlined text-[20px]">{s.icon}</span>
                    </div>
                    <div>
                      <div className="text-[11px] text-white/40">{s.label}</div>
                      <div className="text-xl font-bold text-white">{s.value}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-auto bg-[#adc6ff]/10 p-4 rounded-xl border border-[#adc6ff]/20">
              <h3 className="font-bold text-[#adc6ff] mb-2 flex items-center gap-2 text-sm">
                <span className="material-symbols-outlined text-[18px]">bolt</span> GPU Acceleration
              </h3>
              <p className="text-[11px] text-white/60 leading-relaxed">Running on local GPU via Sentence-Transformers for optimized throughput.</p>
            </div>
          </aside>
        </div>
      </div>
    </Layout>
  );
}
