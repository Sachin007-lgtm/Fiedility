import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  FolderArchive, 
  Search, 
  Upload, 
  Trash2, 
  MessageSquare, 
  CheckCircle2, 
  FileText, 
  Layers, 
  HardDrive, 
  Zap, 
  Loader2, 
  X
} from 'lucide-react';
import Layout from '../components/Layout';

interface DocumentItem {
  id: string;
  title: string;
  fund_name: string;
  session_id: string;
  pages: number;
  chunks: number;
  upload_date: string;
  file_size: number;
  status: 'complete' | 'processing' | 'error';
}

export default function DocumentLibrary() {
  const navigate = useNavigate();
  const [docs, setDocs] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showUpload, setShowUpload] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [fundName, setFundName] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [loadingSample, setLoadingSample] = useState(false);

  const fetchDocs = async () => {
    try {
      const res = await fetch('http://localhost:8000/documents');
      if (res.ok) {
        const data = await res.json();
        setDocs(data.documents || []);
      }
    } catch (e) {
      console.warn('Could not fetch documents:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocs();
  }, []);

  const handleDelete = async (docId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to remove this document from the library?')) return;
    try {
      await fetch(`http://localhost:8000/documents/${docId}`, { method: 'DELETE' });
      setDocs(docs.filter(d => d.id !== docId));
    } catch {
      alert('Delete failed');
    }
  };

  const handleLoadSample = async () => {
    setLoadingSample(true);
    try {
      const form = new FormData();
      form.append('session_id', 'sample_' + Date.now());
      const res = await fetch('http://localhost:8000/documents/sample', { method: 'POST', body: form });
      if (res.ok) {
        await fetchDocs();
      }
    } catch {
      alert('Failed to load sample');
    } finally {
      setLoadingSample(false);
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !fundName) return;
    setUploading(true);
    try {
      const form = new FormData();
      form.append('file', file);
      form.append('fund_name', fundName);
      form.append('session_id', 'lib_' + Date.now());
      const res = await fetch('http://localhost:8000/upload', { method: 'POST', body: form });
      if (!res.ok) throw new Error('Upload failed');
      await fetchDocs();
      setShowUpload(false);
      setFile(null);
      setFundName('');
    } catch (err: any) {
      alert(`Upload failed: ${err.message || 'Server error'}`);
    } finally {
      setUploading(false);
    }
  };

  const openInWorkspace = (sessionId: string) => {
    localStorage.setItem('finsight_active', sessionId);
    navigate('/workspace');
  };

  const filtered = docs.filter(
    d =>
      d.title.toLowerCase().includes(search.toLowerCase()) ||
      d.fund_name.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = docs.reduce((acc, d) => acc + (d.pages || 0), 0);
  const totalChunks = docs.reduce((acc, d) => acc + (d.chunks || 0), 0);
  const totalSizeMB = (docs.reduce((acc, d) => acc + (d.file_size || 0), 0) / (1024 * 1024)).toFixed(1);

  return (
    <Layout title="Document Library">
      <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-6 pb-20">
        {/* ── Top Header ── */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#3D81E3]/20 border border-[#3D81E3]/30 text-[#3D81E3] dark:text-[#adc6ff] text-xs font-semibold uppercase tracking-wider mb-2">
              <FolderArchive className="w-3.5 h-3.5" />
              Institutional Vault
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold dark:text-white text-slate-900 tracking-tight">
              Document Library
            </h1>
            <p className="dark:text-white/50 text-slate-500 text-sm mt-1">
              Cataloged fund prospectuses, regulatory filings, and hybrid-indexed vector corpora.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleLoadSample}
              disabled={loadingSample}
              className="px-4 py-2.5 rounded-xl border dark:border-white/15 dark:bg-white/[0.04] dark:hover:bg-white/10 dark:text-white border-slate-300 bg-white hover:bg-slate-100 text-slate-800 text-xs font-semibold flex items-center gap-2 shadow-sm transition-all"
            >
              {loadingSample ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5 text-[#3D81E3] dark:text-[#00d2ff]" />}
              Load Sample FCNTX
            </button>
            <button
              onClick={() => setShowUpload(true)}
              className="px-4 py-2.5 rounded-xl bg-[#3D81E3] hover:bg-[#2c6ecf] text-white text-xs font-semibold flex items-center gap-2 shadow-[0_0_20px_rgba(61,129,227,0.3)] transition-all"
            >
              <Upload className="w-3.5 h-3.5" />
              Ingest Prospectus
            </button>
          </div>
        </div>

        {/* ── KPI Bento Grid ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="liquid-glass rounded-2xl p-5 border dark:border-white/10 border-slate-200 shadow-sm relative overflow-hidden group"
          >
            <div className="text-xs font-semibold uppercase tracking-wider dark:text-white/40 text-slate-400 mb-1">
              Active Documents
            </div>
            <div className="text-3xl font-mono font-bold dark:text-white text-slate-900 mt-1">
              {docs.length}
            </div>
            <p className="text-xs dark:text-white/40 text-slate-500 mt-3 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              Grounded and searchable
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="liquid-glass rounded-2xl p-5 border dark:border-white/10 border-slate-200 shadow-sm relative overflow-hidden group"
          >
            <div className="text-xs font-semibold uppercase tracking-wider dark:text-white/40 text-slate-400 mb-1">
              Indexed Chunks
            </div>
            <div className="text-3xl font-mono font-bold text-[#3D81E3] dark:text-[#adc6ff] mt-1">
              {totalChunks.toLocaleString()}
            </div>
            <p className="text-xs dark:text-white/40 text-slate-500 mt-3 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-[#3D81E3]" />
              Dense 384d & BM25 inverted index
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="liquid-glass rounded-2xl p-5 border dark:border-white/10 border-slate-200 shadow-sm relative overflow-hidden group"
          >
            <div className="text-xs font-semibold uppercase tracking-wider dark:text-white/40 text-slate-400 mb-1">
              Extracted Pages
            </div>
            <div className="text-3xl font-mono font-bold dark:text-white text-slate-900 mt-1">
              {totalPages.toLocaleString()}
            </div>
            <p className="text-xs dark:text-white/40 text-slate-500 mt-3 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-[#00d2ff]" />
              PyMuPDF layout-aware parsed
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="liquid-glass rounded-2xl p-5 border dark:border-white/10 border-slate-200 shadow-sm relative overflow-hidden group"
          >
            <div className="text-xs font-semibold uppercase tracking-wider dark:text-white/40 text-slate-400 mb-1">
              Vault Footprint
            </div>
            <div className="text-3xl font-mono font-bold text-[#00d2ff] mt-1">
              {totalSizeMB} <span className="text-sm font-sans font-normal dark:text-white/40 text-slate-400">MB</span>
            </div>
            <p className="text-xs dark:text-white/40 text-slate-500 mt-3 flex items-center gap-1.5">
              <HardDrive className="w-3.5 h-3.5 text-cyan-500" />
              Local storage & Chroma cached
            </p>
          </motion.div>
        </div>

        {/* ── Search & Filter Bar ── */}
        <div className="liquid-glass rounded-2xl p-3 border dark:border-white/10 border-slate-200 shadow-sm flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 dark:text-white/40 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Filter by fund name, ticker, or filing title..."
              className="w-full bg-transparent pl-9 pr-4 py-2 text-sm dark:text-white text-slate-900 dark:placeholder-white/30 placeholder-slate-400 focus:outline-none"
            />
          </div>
          <span className="text-xs dark:text-white/40 text-slate-400 pr-2 font-mono hidden sm:block">
            {filtered.length} of {docs.length} files
          </span>
        </div>

        {/* ── Document Table ── */}
        <div className="liquid-glass rounded-2xl border dark:border-white/10 border-slate-200 overflow-hidden shadow-xl">
          {loading ? (
            <div className="p-16 flex flex-col items-center justify-center dark:text-white/40 text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin text-[#3D81E3] mb-3" />
              <p className="text-sm">Connecting to document catalog…</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-16 flex flex-col items-center justify-center text-center">
              <div className="w-12 h-12 rounded-2xl dark:bg-white/5 bg-slate-100 border dark:border-white/10 border-slate-200 flex items-center justify-center mb-4 dark:text-white/30 text-slate-400">
                <FileText className="w-6 h-6" />
              </div>
              <h3 className="text-base font-semibold dark:text-white text-slate-900 mb-1">No documents in library</h3>
              <p className="text-xs dark:text-white/40 text-slate-500 max-w-sm mb-6">
                Ingest a mutual fund prospectus PDF or click "Load Sample FCNTX" to populate the research index.
              </p>
              <button
                onClick={handleLoadSample}
                className="px-4 py-2 rounded-xl bg-[#3D81E3] hover:bg-[#2c6ecf] text-white text-xs font-semibold shadow-md"
              >
                Load Sample Prospectus
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b dark:border-white/10 border-slate-200 dark:bg-white/[0.02] bg-slate-50 dark:text-white/50 text-slate-500 uppercase tracking-wider font-semibold">
                    <th className="px-5 py-3.5">Filing / Document Title</th>
                    <th className="px-5 py-3.5">Fund / Ticker</th>
                    <th className="px-5 py-3.5">Pages</th>
                    <th className="px-5 py-3.5">Chunks</th>
                    <th className="px-5 py-3.5">Upload Date</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y dark:divide-white/5 divide-slate-100">
                  {filtered.map(doc => (
                    <tr
                      key={doc.id}
                      onClick={() => openInWorkspace(doc.session_id)}
                      className="dark:hover:bg-white/[0.04] hover:bg-slate-50/80 cursor-pointer transition-colors group"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-[#3D81E3]/15 flex items-center justify-center text-[#3D81E3] shrink-0">
                            <FileText className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="font-semibold dark:text-white text-slate-900 group-hover:text-[#3D81E3] dark:group-hover:text-[#00d2ff] transition-colors truncate max-w-xs md:max-w-md">
                              {doc.title}
                            </div>
                            <div className="text-[10px] dark:text-white/40 text-slate-400 font-mono mt-0.5">
                              {(doc.file_size / (1024 * 1024)).toFixed(2)} MB · PDF
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <span className="px-2.5 py-1 rounded-full dark:bg-white/5 bg-slate-100 border dark:border-white/10 border-slate-200 dark:text-white text-slate-800 font-medium text-[11px]">
                          {doc.fund_name}
                        </span>
                      </td>

                      <td className="px-5 py-4 dark:text-white/70 text-slate-600 font-mono">
                        {doc.pages}
                      </td>

                      <td className="px-5 py-4 text-[#3D81E3] dark:text-[#adc6ff] font-mono font-semibold">
                        {doc.chunks}
                      </td>

                      <td className="px-5 py-4 dark:text-white/40 text-slate-400 font-mono">
                        {doc.upload_date}
                      </td>

                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-2" onClick={e => e.stopPropagation()}>
                          <button
                            onClick={() => openInWorkspace(doc.session_id)}
                            className="px-3 py-1.5 rounded-lg bg-[#3D81E3]/20 hover:bg-[#3D81E3]/30 text-[#3D81E3] dark:text-[#adc6ff] font-semibold text-[11px] flex items-center gap-1.5 transition-colors"
                            title="Chat in Research Workspace"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            Research
                          </button>
                          <button
                            onClick={e => handleDelete(doc.id, e)}
                            className="p-1.5 rounded-lg dark:text-white/30 text-slate-400 hover:text-red-500 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
                            title="Delete Document"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ── Document Upload Modal ── */}
      <AnimatePresence>
        {showUpload && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4"
            onClick={() => setShowUpload(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="liquid-glass rounded-3xl border dark:border-white/15 border-slate-200 p-6 w-full max-w-md shadow-2xl dark:bg-[#12141a]/95 bg-white backdrop-blur-2xl"
            >
              <div className="flex justify-between items-center mb-5">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-[#3D81E3]/20 flex items-center justify-center text-[#3D81E3]">
                    <Upload className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold dark:text-white text-slate-900">Ingest Fund Document</h2>
                    <p className="text-[11px] dark:text-white/50 text-slate-500">Add prospectus to Finsight library</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowUpload(false)}
                  className="dark:text-white/40 text-slate-400 hover:text-black dark:hover:text-white p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleUploadSubmit} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-semibold dark:text-white/60 text-slate-600 mb-1.5 uppercase tracking-wider">
                    Fund Name or Ticker
                  </label>
                  <input
                    value={fundName}
                    onChange={e => setFundName(e.target.value)}
                    placeholder="e.g. Vanguard 500 Index Fund (VFIAX)"
                    className="w-full dark:bg-white/[0.04] bg-slate-50 border dark:border-white/10 border-slate-300 rounded-xl px-4 py-2.5 text-sm dark:text-white text-slate-900 dark:placeholder-white/20 placeholder-slate-400 focus:outline-none focus:border-[#3D81E3] focus:ring-1 focus:ring-[#3D81E3]/30 transition-all"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold dark:text-white/60 text-slate-600 mb-1.5 uppercase tracking-wider">
                    PDF File
                  </label>
                  <label className="flex flex-col items-center justify-center h-32 border-2 border-dashed dark:border-white/15 border-slate-300 rounded-2xl cursor-pointer hover:border-[#3D81E3] hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-all group">
                    <FileText className="w-6 h-6 dark:text-white/30 text-slate-400 group-hover:text-[#3D81E3] transition-colors mb-2" />
                    <span className="text-xs font-medium dark:text-white/60 text-slate-600 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                      {file ? file.name : 'Choose PDF prospectus'}
                    </span>
                    <input
                      type="file"
                      accept=".pdf"
                      className="hidden"
                      onChange={e => setFile(e.target.files?.[0] || null)}
                      required
                    />
                  </label>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={uploading || !file || !fundName}
                    className="w-full py-3 bg-[#3D81E3] hover:bg-[#2c6ecf] text-white text-xs font-semibold rounded-xl disabled:opacity-40 shadow-[0_0_20px_rgba(61,129,227,0.3)] transition-all flex items-center justify-center gap-2"
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" /> Ingesting & Indexing…
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4" /> Add to Library
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </Layout>
  );
}
