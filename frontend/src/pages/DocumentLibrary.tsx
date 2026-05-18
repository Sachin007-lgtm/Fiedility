import React, { useState } from 'react';
import { motion } from 'motion/react';
import Layout from '../components/Layout';

interface Document {
  id: string;
  title: string;
  fundName: string;
  uploadDate: string;
  status: 'complete' | 'processing' | 'error';
}

const MOCK_DOCS: Document[] = [
  { id: '1', title: '2024 Global Macro Strategic Prospectus.pdf', fundName: 'ALFA_GLOBAL_MACRO_01', uploadDate: 'Oct 24, 2023 · 14:22', status: 'complete' },
  { id: '2', title: 'Emerging Markets Growth Fund - Q3 Disclosure', fundName: 'EMG_ALPHA_STABLE', uploadDate: 'Oct 24, 2023 · 16:05', status: 'processing' },
  { id: '3', title: 'Real Estate Opportunity V - Annual Report', fundName: 'RE_OPP_V_LP', uploadDate: 'Oct 23, 2023 · 09:12', status: 'error' },
  { id: '4', title: 'Corporate Bond Yield Advantage Master Fund.docx', fundName: 'CBY_MASTER_04', uploadDate: 'Oct 22, 2023 · 18:45', status: 'complete' },
  { id: '5', title: 'Digital Assets Arbitrage Fund - Governance Charter', fundName: 'DAA_GOVERNANCE_24', uploadDate: 'Oct 22, 2023 · 11:30', status: 'complete' },
  { id: '6', title: 'Infrastructure Debt Fund III - LP Agreement', fundName: 'INFRA_DEBT_III', uploadDate: 'Oct 21, 2023 · 08:55', status: 'complete' },
  { id: '7', title: 'Sovereign Wealth Allocation Report Q4 2023', fundName: 'SOV_WEALTH_Q4', uploadDate: 'Oct 20, 2023 · 15:30', status: 'processing' },
];

const StatusBadge = ({ status }: { status: Document['status'] }) => {
  if (status === 'complete')
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#44e2cd]/10 text-[#44e2cd] text-xs font-bold border border-[#44e2cd]/20">
        <span className="material-symbols-outlined text-[14px]">check_circle</span> Complete
      </span>
    );
  if (status === 'processing')
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#adc6ff]/10 text-[#adc6ff] text-xs font-bold border border-[#adc6ff]/20 animate-pulse">
        <span className="material-symbols-outlined text-[14px]">sync</span> Processing
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-400/10 text-red-400 text-xs font-bold border border-red-400/20">
      <span className="material-symbols-outlined text-[14px]">error</span> Error
    </span>
  );
};

export default function DocumentLibrary() {
  const [search, setSearch] = useState('');

  const filtered = MOCK_DOCS.filter(
    (d) =>
      d.title.toLowerCase().includes(search.toLowerCase()) ||
      d.fundName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Layout title="Library">
      <div className="p-4 lg:p-8 max-w-6xl mx-auto space-y-6 pb-24 md:pb-8">
        {/* ── Header ── */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-white tracking-tight">Document Library</h1>
            <p className="text-white/40 mt-1 text-sm">Manage and monitor institutional fund prospectuses and compliance filings.</p>
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-white/40 text-[18px]">search</span>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by title or fund..."
                className="w-full bg-white/[0.04] border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:border-white/30 focus:outline-none transition-all"
              />
            </div>
            <button className="p-2 border border-white/10 rounded-lg text-white/60 hover:bg-white/[0.04] transition-colors">
              <span className="material-symbols-outlined text-[20px]">filter_list</span>
            </button>
          </div>
        </div>

        {/* ── KPI Bento Grid ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Total Documents */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="relative overflow-hidden rounded-2xl p-6 group bg-[#171717] border border-white/10"
          >
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <span className="material-symbols-outlined text-[80px] text-white">description</span>
            </div>
            <div className="relative z-10">
              <p className="text-xs uppercase tracking-widest text-white/40 mb-1 font-semibold">Total Documents</p>
              <div className="flex items-baseline gap-3">
                <span className="text-4xl font-bold text-[#adc6ff] font-mono">12,482</span>
                <span className="text-[#44e2cd] text-xs font-bold flex items-center gap-0.5">
                  <span className="material-symbols-outlined text-[14px]">arrow_upward</span> 12%
                </span>
              </div>
              <p className="text-white/30 text-xs mt-4">Active repositories monitored: 42</p>
            </div>
          </motion.div>

          {/* Ingestion Rate */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="relative overflow-hidden rounded-2xl p-6 group bg-[#171717] border border-white/10"
          >
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <span className="material-symbols-outlined text-[80px] text-white">speed</span>
            </div>
            <div className="relative z-10">
              <p className="text-xs uppercase tracking-widest text-white/40 mb-1 font-semibold">Ingestion Rate</p>
              <div className="flex items-baseline gap-3">
                <span className="text-4xl font-bold text-white font-mono">84.2 <span className="text-base font-normal">MB/s</span></span>
              </div>
              <div className="w-full bg-white/5 h-1.5 rounded-full mt-4 overflow-hidden">
                <div className="bg-[#adc6ff] h-full w-[84%] rounded-full transition-all duration-1000"></div>
              </div>
              <p className="text-white/30 text-xs mt-2">Peak performance today: 112 MB/s</p>
            </div>
          </motion.div>

          {/* Pending Actions */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="relative overflow-hidden rounded-2xl p-6 group bg-[#171717] border border-white/10"
          >
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <span className="material-symbols-outlined text-[80px] text-red-400">notification_important</span>
            </div>
            <div className="relative z-10">
              <p className="text-xs uppercase tracking-widest text-white/40 mb-1 font-semibold">Pending Actions</p>
              <div className="flex items-baseline gap-3">
                <span className="text-4xl font-bold text-red-400 font-mono">24</span>
                <span className="text-white/30 text-xs italic">Critical status</span>
              </div>
              <div className="flex gap-2 mt-4">
                <span className="px-2 py-1 bg-red-400/10 text-red-400 text-[10px] font-bold rounded border border-red-400/20">ERROR: 14</span>
                <span className="px-2 py-1 bg-yellow-400/10 text-yellow-400 text-[10px] font-bold rounded border border-yellow-400/20">MANUAL: 10</span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* ── Main Data Table ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-2xl overflow-hidden border border-white/10 bg-[#171717]"
        >
          <div className="p-4 border-b border-white/10 flex justify-between items-center bg-white/[0.02]">
            <h2 className="text-xs font-bold uppercase tracking-widest text-white/80">Library Catalog</h2>
            <div className="flex gap-2">
              <button className="text-white/40 hover:text-white/80 p-1 transition-colors">
                <span className="material-symbols-outlined text-[20px]">download</span>
              </button>
              <button className="text-white/40 hover:text-white/80 p-1 transition-colors">
                <span className="material-symbols-outlined text-[20px]">more_vert</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white/[0.02] border-b border-white/10">
                  {['Title', 'Fund Name', 'Upload Date', 'Status', 'Actions'].map((h, i) => (
                    <th
                      key={h}
                      className={`px-6 py-4 text-[11px] text-white/40 uppercase tracking-widest font-semibold ${i === 4 ? 'text-right' : ''}`}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filtered.map((doc) => (
                  <motion.tr
                    key={doc.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="hover:bg-white/[0.02] transition-colors group"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <span
                          className={`material-symbols-outlined text-[20px] ${doc.status === 'error' ? 'text-red-400/60' : 'text-[#adc6ff]/60'}`}
                        >
                          {doc.status === 'error' ? 'warning' : 'description'}
                        </span>
                        <span className="text-sm font-semibold text-white/80">{doc.title}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-white/40 text-sm font-mono">{doc.fundName}</td>
                    <td className="px-6 py-4 text-white/40 text-sm">{doc.uploadDate}</td>
                    <td className="px-6 py-4">
                      <StatusBadge status={doc.status} />
                    </td>
                    <td className="px-6 py-4 text-right">
                      {doc.status === 'complete' && (
                        <button className="text-white/40 group-hover:text-white transition-colors text-[11px] font-bold uppercase tracking-widest">
                          View Analysis
                        </button>
                      )}
                      {doc.status === 'error' && (
                        <button className="text-red-400 hover:underline text-[11px] font-bold uppercase tracking-widest">
                          Review Error
                        </button>
                      )}
                      {doc.status === 'processing' && (
                        <span className="material-symbols-outlined text-white/20 text-[20px]">lock</span>
                      )}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="p-4 border-t border-white/10 flex justify-between items-center bg-white/[0.02]">
            <p className="text-white/40 text-xs">Showing 1 to {filtered.length} of 12,482 documents</p>
            <div className="flex gap-2">
              <button className="p-2 border border-white/10 rounded text-white/40 disabled:opacity-30 cursor-not-allowed" disabled>
                <span className="material-symbols-outlined text-[18px]">chevron_left</span>
              </button>
              <button className="p-2 border border-white/10 rounded text-white/80 hover:bg-white/[0.04] transition-colors">
                <span className="material-symbols-outlined text-[18px]">chevron_right</span>
              </button>
            </div>
          </div>
        </motion.div>

        {/* ── Featured Banner ── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="relative h-56 rounded-2xl overflow-hidden border border-white/10 bg-[#171717]"
        >
          {/* Decorative grid */}
          <div
            className="absolute inset-0 opacity-[0.05]"
            style={{
              backgroundImage: 'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)',
              backgroundSize: '40px 40px',
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-90" />
          <div className="absolute bottom-0 left-0 p-8">
            <h3 className="text-2xl font-bold text-white">Automated Regulatory Analysis</h3>
            <p className="text-white/60 max-w-xl mt-2 text-sm">
              Our neural engine is currently processing the latest SEC filings across all active funds. Semantic cross-referencing is 98% complete for the current fiscal quarter.
            </p>
          </div>
          {/* Glowing orb */}
          <div className="absolute top-8 right-12 w-32 h-32 rounded-full bg-[#adc6ff]/10 blur-3xl" />
        </motion.div>
      </div>
    </Layout>
  );
}
