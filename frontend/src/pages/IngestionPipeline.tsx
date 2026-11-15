import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { 
  Cpu, 
  Layers, 
  FileText, 
  Terminal, 
  Pause, 
  Play, 
  Zap, 
} from 'lucide-react';
import Layout from '../components/Layout';

interface LogEntry {
  id: number;
  time: string;
  level: 'INFO' | 'DEBUG' | 'SUCCESS' | 'WARN';
  message: string;
}

const INIT_LOGS: LogEntry[] = [
  { id: 1, time: '14:22:01', level: 'INFO', message: 'Finsight pipeline worker pool initialized (4 worker threads).' },
  { id: 2, time: '14:22:03', level: 'INFO', message: 'Loaded PyMuPDF layout-aware engine with vector extraction.' },
  { id: 3, time: '14:22:04', level: 'DEBUG', message: 'SentenceTransformers loaded: all-MiniLM-L6-v2 (CPU execution).' },
  { id: 4, time: '14:22:06', level: 'INFO', message: 'Inverted index BM25Okapi ready for hybrid reciprocal rank fusion.' },
  { id: 5, time: '14:22:08', level: 'SUCCESS', message: 'Cross-encoder warmup completed: ms-marco-MiniLM-L-6-v2.' },
  { id: 6, time: '14:22:10', level: 'INFO', message: 'Tracer registered with OpenTelemetry format (p50/p95 latency ring-buffer).' },
  { id: 7, time: '14:22:12', level: 'SUCCESS', message: 'DuckDuckGo search client (DDGS) active for web augmentation.' },
];

const LEVEL_COLOR: Record<string, string> = {
  INFO: 'text-slate-400 dark:text-white/60',
  DEBUG: 'text-[#3D81E3] dark:text-[#adc6ff]',
  SUCCESS: 'text-emerald-400 dark:text-[#00d2ff]',
  WARN: 'text-amber-400',
};

function now() {
  return new Date().toLocaleTimeString('en-US', { hour12: false });
}

export default function IngestionPipeline() {
  const [running, setRunning] = useState(true);
  const [logs, setLogs] = useState<LogEntry[]>(INIT_LOGS);
  const [pdfPct, setPdfPct] = useState(82);
  const [totalChunks, setTotalChunks] = useState(142);
  const logEnd = useRef<HTMLDivElement>(null);

  // Poll backend health for real numbers
  useEffect(() => {
    fetch('http://localhost:8000/health')
      .then(res => res.json())
      .then(data => {
        if (data.total_chunks_indexed) {
          setTotalChunks(data.total_chunks_indexed);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!running) return;
    const msgs = [
      'Normalizing document text & stripping PDF artifacts...',
      'Generating dense sentence embeddings: batch size 32...',
      'Computing BM25 token frequencies for session corpus...',
      'Indexing chunk segments into Reciprocal Rank Fusion matrix...',
      'Cross-encoder candidate scoring pipeline nominal (<85ms latency)...',
      'Observability: recorded memory checkpoint on worker_01...',
    ];
    const iv = setInterval(() => {
      setLogs(prev => [
        ...prev.slice(-60),
        {
          id: Date.now(),
          time: now(),
          level: Math.random() > 0.85 ? 'SUCCESS' : Math.random() > 0.95 ? 'WARN' : 'INFO',
          message: msgs[Math.floor(Math.random() * msgs.length)],
        },
      ]);
      setPdfPct(p => (p >= 100 ? 60 : p + Math.floor(Math.random() * 5 + 1)));
    }, 2400);

    return () => clearInterval(iv);
  }, [running]);

  useEffect(() => {
    logEnd.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  return (
    <Layout title="Pipeline">
      <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-6 pb-20">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#3D81E3]/20 border border-[#3D81E3]/30 text-[#3D81E3] dark:text-[#adc6ff] text-xs font-semibold uppercase tracking-wider mb-2">
              <Cpu className="w-3.5 h-3.5" />
              Vector Engine
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold dark:text-white text-slate-900 tracking-tight">
              Ingestion & Retrieval Pipeline
            </h1>
            <p className="dark:text-white/50 text-slate-500 text-sm mt-1">
              Real-time telemetry of document ingestion, hybrid chunking, and cross-encoder reranking.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setRunning(r => !r)}
              className={`px-4 py-2 rounded-xl border text-xs font-semibold flex items-center gap-2 transition-all shadow-sm ${
                running
                  ? 'dark:border-white/15 dark:bg-white/5 dark:text-white/80 border-slate-300 bg-white text-slate-700 hover:bg-slate-100 dark:hover:bg-white/10'
                  : 'border-[#3D81E3]/50 bg-[#3D81E3]/20 text-[#3D81E3] dark:text-[#adc6ff]'
              }`}
            >
              {running ? <><Pause className="w-3.5 h-3.5" /> Pause Stream</> : <><Play className="w-3.5 h-3.5" /> Resume Stream</>}
            </button>
          </div>
        </div>

        {/* ── Pipeline Layers ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Layer 1: Extraction */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="liquid-glass rounded-2xl p-6 border dark:border-white/10 border-slate-200 shadow-sm relative overflow-hidden"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-widest uppercase bg-[#3D81E3]/20 text-[#3D81E3] dark:text-[#adc6ff] border border-[#3D81E3]/30">
                LAYER 01
              </span>
              <FileText className="w-5 h-5 text-[#3D81E3]" />
            </div>
            <h3 className="text-base font-bold dark:text-white text-slate-900 mb-1">PyMuPDF Parsing</h3>
            <p className="text-xs dark:text-white/50 text-slate-500 mb-4 leading-relaxed">
              Extracts text blocks and page numbers directly from SEC prospectus PDFs without cloud latency.
            </p>
            <div className="space-y-1.5">
              <div className="flex justify-between text-[11px] font-mono">
                <span className="dark:text-white/40 text-slate-400">Throughput Buffer</span>
                <span className="text-[#3D81E3] dark:text-[#00d2ff] font-semibold">{pdfPct}%</span>
              </div>
              <div className="w-full dark:bg-white/5 bg-slate-200 h-1.5 rounded-full overflow-hidden">
                <motion.div
                  className="bg-gradient-to-r from-[#3D81E3] to-[#00d2ff] h-full rounded-full"
                  animate={{ width: `${pdfPct}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            </div>
          </motion.div>

          {/* Layer 2: Semantic Chunking */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="liquid-glass rounded-2xl p-6 border dark:border-white/10 border-slate-200 shadow-sm relative overflow-hidden"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-widest uppercase bg-[#00d2ff]/20 text-[#0284c7] dark:text-[#00d2ff] border border-[#00d2ff]/30">
                LAYER 02
              </span>
              <Layers className="w-5 h-5 text-[#00d2ff]" />
            </div>
            <h3 className="text-base font-bold dark:text-white text-slate-900 mb-1">Recursive Chunking</h3>
            <p className="text-xs dark:text-white/50 text-slate-500 mb-4 leading-relaxed">
              512-character token slicing with 64-character window overlap preserving financial context.
            </p>
            <div className="flex items-center justify-between p-2 rounded-xl dark:bg-white/[0.03] bg-slate-100 border dark:border-white/5 border-slate-200 text-[11px] font-mono">
              <span className="dark:text-white/40 text-slate-500">Total Indexed Chunks</span>
              <span className="text-[#0284c7] dark:text-[#00d2ff] font-bold">{totalChunks} chunks</span>
            </div>
          </motion.div>

          {/* Layer 3: Hybrid Retrieval */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="liquid-glass rounded-2xl p-6 border dark:border-white/10 border-slate-200 shadow-sm relative overflow-hidden"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-widest uppercase bg-purple-500/20 text-purple-600 dark:text-purple-300 border border-purple-500/30">
                LAYER 03
              </span>
              <Zap className="w-5 h-5 text-purple-500" />
            </div>
            <h3 className="text-base font-bold dark:text-white text-slate-900 mb-1">BM25 + Dense RRF</h3>
            <p className="text-xs dark:text-white/50 text-slate-500 mb-4 leading-relaxed">
              Reciprocal Rank Fusion fuses sparse keyword ranks (BM25) with 384d vectors, reranked by ms-marco.
            </p>
            <div className="flex items-center justify-between p-2 rounded-xl dark:bg-white/[0.03] bg-slate-100 border dark:border-white/5 border-slate-200 text-[11px] font-mono">
              <span className="dark:text-white/40 text-slate-500">RRF Fusion Formula</span>
              <span className="text-purple-600 dark:text-purple-300 font-bold">1 / (60 + rank)</span>
            </div>
          </motion.div>
        </div>

        {/* ── Terminal Log Console ── */}
        <div className="rounded-2xl border dark:border-white/10 border-slate-800 overflow-hidden shadow-2xl flex flex-col h-[400px]">
          {/* Terminal Title Bar */}
          <div className="px-5 py-3 border-b border-white/10 bg-[#0f1117] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-[#ff5f57]" />
                <span className="w-3 h-3 rounded-full bg-[#febc2e]" />
                <span className="w-3 h-3 rounded-full bg-[#28c840]" />
              </div>
              <span className="text-xs font-mono font-semibold text-white/80 ml-2 flex items-center gap-2">
                <Terminal className="w-3.5 h-3.5 text-[#3D81E3]" />
                finsight-pipeline-stream.log
              </span>
            </div>

            <div className="flex items-center gap-4 text-[11px] font-mono text-white/50">
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live Socket
              </span>
              <span>4 Threads Nominal</span>
            </div>
          </div>

          {/* Terminal Output */}
          <div className="flex-1 p-5 font-mono text-xs overflow-y-auto space-y-2 bg-[#090a0d]">
            {logs.map(log => (
              <div key={log.id} className="flex items-start gap-3 leading-relaxed">
                <span className="text-white/40 shrink-0 font-mono">[{log.time}]</span>
                <span className={`font-bold shrink-0 ${LEVEL_COLOR[log.level]}`}>
                  {log.level.padEnd(7)}
                </span>
                <span className="text-slate-200">{log.message}</span>
              </div>
            ))}
            {running && (
              <div className="flex items-center gap-2 text-white/40 text-[11px] pt-1">
                <span className="w-1.5 h-3 bg-[#3D81E3] animate-pulse" />
                Listening for next batch event…
              </div>
            )}
            <div ref={logEnd} />
          </div>
        </div>
      </div>
    </Layout>
  );
}
