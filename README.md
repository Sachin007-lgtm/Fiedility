# ALFA CORE — Institutional RAG Research Platform

> A production-grade, full-stack **Retrieval-Augmented Generation** platform built for institutional financial research. Upload fund prospectuses, ask natural-language questions, and get precise, cited answers powered by a hybrid BM25 + vector retrieval pipeline with cross-encoder reranking and full observability.

---

## ✨ Features

### 🔍 Hybrid RAG Pipeline
- **BM25 + Dense Vector Search** fused via **Reciprocal Rank Fusion (RRF)** for best-of-both precision
- **Cross-Encoder Reranking** — fetches top-20 chunks, reranks to top-5 using `ms-marco-MiniLM-L-6-v2`
- **Citation Enforcement** — every factual claim tagged `[SOURCE:N]`, validated post-generation
- **Web Search Augmentation** — optional DuckDuckGo live web retrieval alongside document context

### 🧠 LLM Generation
- **Groq** inference with `llama3-8b-8192` (fast, cost-efficient)
- Structured, citation-dense prompts with strict hallucination guard-rails
- Deep Think mode for extended reasoning queries

### 📊 Full Observability
- Per-request **distributed tracing** with span breakdown
- **p50 / p95 latency** metrics for each pipeline stage (retrieval → rerank → LLM)
- **Cost-per-request** tracking based on token usage
- **Citation density** and pass-rate quality metrics
- Live monitoring dashboard at `/monitoring`

### 🎨 Institutional UI (ALFA CORE Design System)
- ChatGPT/Claude-style research workspace with typewriter responses
- Document Library with searchable catalog and status badges
- Ingestion Pipeline with live log stream and worker node monitoring
- System Health dashboard with neural topology visualization
- Hover-triggered navigation menu from any page

### ⚙️ CI/CD Pipeline
- GitHub Actions: lint → unit tests → eval gate → build → perf regression check
- Automated PR comments with eval reports
- Hard gates: citation pass rate ≥ 80%, latency ≤ 3000ms

---

## 🏗️ Architecture

```
PDF Upload
    ↓
PyMuPDF extraction → chunking (512 chars, 64 overlap)
    ↓
HybridRetriever.add_chunks()
  ├── BM25Okapi index        (sparse, exact keyword)
  └── SentenceTransformer    (dense, all-MiniLM-L6-v2)
    ↓
Query
    ↓
HybridRetriever.retrieve()  ←  RRF fusion (BM25 × 0.4 + Vector × 0.6)
    ↓  top-20 chunks
CrossEncoderReranker.rerank()  ←  ms-marco-MiniLM-L-6-v2
    ↓  top-5 chunks
CitationEnforcer.build_prompt()  ←  [SOURCE:N] tagging
    ↓
Groq LLM  (llama3-8b-8192)
    ↓
CitationEnforcer.parse_citations() + validate()
    ↓
Tracer.finish() → MetricsStore  ←  p50/p95, cost, quality scores
```

---

## 📁 Project Structure

```
Fiedility Rag/
├── backend/
│   ├── main.py                    # FastAPI app (v2.0) — all endpoints
│   ├── requirements.txt
│   ├── retrieval/
│   │   ├── hybrid.py              # BM25 + vector + RRF fusion
│   │   ├── reranker.py            # Cross-encoder reranking
│   │   └── citations.py           # Citation enforcement + validation
│   ├── monitoring/
│   │   └── tracer.py              # Spans, p50/p95, cost-per-request
│   ├── evaluation/
│   │   └── pipeline.py            # CI eval + regression gate
│   └── tests/
│       └── test_core.py           # Unit tests
│
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── ResearchWorkspace.tsx   # ChatGPT-style chat interface
│   │   │   ├── DocumentLibrary.tsx     # Fund document catalog
│   │   │   ├── IngestionPipeline.tsx   # Live pipeline visualizer
│   │   │   ├── SystemHealth.tsx        # Infrastructure metrics
│   │   │   └── MonitoringDashboard.tsx # RAG observability
│   │   ├── components/
│   │   │   └── Layout.tsx             # Shared TopNav + SideNav
│   │   └── App.tsx
│   ├── tailwind.config.js             # ALFA CORE design tokens
│   └── index.html
│
└── .github/
    └── workflows/
        └── ci.yml                     # Full CI pipeline
```

---

## 🚀 Getting Started

### Prerequisites
- **Python 3.11+** with a virtual environment
- **Node.js 20+** and npm
- A **Groq API key** → [console.groq.com](https://console.groq.com)

---

### 1 — Backend Setup

```bash
cd backend

# Activate virtual environment
# Windows:
myven\Scripts\activate
# macOS / Linux:
source myven/bin/activate

# Install dependencies
pip install -r requirements.txt

# Set your Groq API key
# Windows PowerShell:
$env:GROQ_API_KEY = "gsk_your_key_here"
# macOS / Linux:
export GROQ_API_KEY="gsk_your_key_here"

# Start the server  (use venv Python explicitly to avoid env conflicts)
myven\Scripts\python.exe -m uvicorn main:app --reload
```

> ⚠️ **Windows note:** Always use `myven\Scripts\python.exe -m uvicorn` instead of bare `uvicorn` to ensure the correct virtual environment Python is used.

The API will be available at **http://localhost:8000**

---

### 2 — Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Create environment file
echo "VITE_API_URL=http://localhost:8000" > .env.local

# Start development server
npm run dev
```

Open **http://localhost:5173** in your browser.

---

## 🌐 API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` | Health check — returns version |
| `POST` | `/upload` | Ingest PDF → chunk → index into hybrid retriever |
| `POST` | `/query` | Full RAG pipeline → returns answer + citations + trace |
| `GET` | `/metrics/summary` | Aggregated stats (requests, cost, quality) |
| `GET` | `/metrics/traces` | Recent request traces (last N) |
| `GET` | `/metrics/latency` | p50/p95 per stage breakdown |

### Example — Upload a PDF

```bash
curl -X POST http://localhost:8000/upload \
  -F "file=@prospectus.pdf" \
  -F "session_id=my-session-01"
```

### Example — Query

```bash
curl -X POST http://localhost:8000/query \
  -H "Content-Type: application/json" \
  -d '{
    "query": "What are the management fees?",
    "session_id": "my-session-01",
    "use_web_search": false
  }'
```

**Response:**
```json
{
  "answer": "The management fee is 1.5% per annum [SOURCE:1]...",
  "citations": [
    { "chunk_id": "...", "page": 12, "source": "prospectus.pdf", "excerpt": "..." }
  ],
  "citation_report": { "passed": true, "citation_density": 0.85, ... },
  "trace_id": "uuid",
  "latency_ms": 1240.5,
  "cost_usd": 0.000312,
  "chunks_retrieved": 20,
  "chunks_after_rerank": 5
}
```

---

## 🖥️ Frontend Pages

| Route | Page | Description |
|-------|------|-------------|
| `/` | Landing Page | Product overview |
| `/workspace` | Research Workspace | Main chat interface |
| `/library` | Document Library | Fund document catalog with status tracking |
| `/ingestion` | Ingestion Pipeline | Real-time vectorization monitor |
| `/health` | System Health | GPU cluster & infrastructure metrics |
| `/monitoring` | RAG Monitoring | Live p50/p95 latency, citation quality, traces |

> 💡 The three-bar (☰) icon in the top-right of the workspace opens a hover navigation menu linking to all pages.

---

## 🧪 Testing & Evaluation

### Run Unit Tests

```bash
cd backend
myven\Scripts\python.exe -m pytest tests/ -v
```

### Run Evaluation Pipeline

```bash
# Print evaluation report
myven\Scripts\python.exe -m evaluation.pipeline

# Gate mode (exits 1 on regression — same as CI)
myven\Scripts\python.exe -m evaluation.pipeline --gate
```

### CI Quality Gates

| Metric | Threshold |
|--------|-----------|
| Answer Relevance | ≥ 70% |
| Citation Pass Rate | ≥ 80% |
| Retrieval Recall@5 | ≥ 65% |
| Avg Latency | ≤ 3000ms |
| Hallucination Rate | ≤ 10% |

---

## ⚙️ Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `GROQ_API_KEY` | ✅ Yes | Groq API key for LLM inference |
| `VITE_API_URL` | No (defaults to `http://localhost:8000`) | Backend URL for frontend |

---

## 🎨 Design System — ALFA CORE

The frontend uses the **Institutional Intelligence** design system:

| Token | Value |
|-------|-------|
| Background | `#10131a` |
| Primary | `#adc6ff` (blue) |
| Secondary | `#44e2cd` (teal) |
| Font | Manrope (UI) · JetBrains Mono (data) |
| Border radius | 4px / 8px / 12px |
| Aesthetic | Glassmorphism · dark mode · high-density terminal |

---

## 🔑 Key Design Decisions

### Hybrid Retrieval (BM25 + Vector)
BM25 excels at exact keyword/ticker matches; dense vector search handles semantic similarity. RRF merges both rankings without needing score normalization. Weights are tunable: `bm25_weight=0.4`, `vector_weight=0.6`.

### Cross-Encoder Reranking
Fetches top-20 candidates, reranks to top-5 — dramatically improves precision. Uses `ms-marco-MiniLM-L-6-v2` (~80MB, fast inference). Gracefully falls back to retrieval scores if the model is unavailable.

### Citation Enforcement
Every chunk is tagged `[SOURCE:N]` before entering the prompt. The LLM is strictly instructed to cite every factual claim. Post-generation validation checks density and detects invalid references before returning to the client.

### Observability
Every request gets a `trace_id` with a full span breakdown. `MetricsStore` holds the last 10K traces in a ring buffer. Cost is computed from token counts using `COST_PER_1K_*` constants (update for your provider pricing).

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **LLM** | Groq · `llama3-8b-8192` |
| **Embeddings** | `sentence-transformers/all-MiniLM-L6-v2` |
| **Reranking** | `cross-encoder/ms-marco-MiniLM-L-6-v2` |
| **Sparse Index** | `rank-bm25` (BM25Okapi) |
| **Vector Store** | ChromaDB |
| **PDF Parsing** | PyMuPDF (fitz) |
| **Web Search** | DuckDuckGo Search |
| **API** | FastAPI · Uvicorn |
| **Frontend** | React 19 · Vite · TypeScript |
| **Styling** | TailwindCSS (ALFA CORE tokens) |
| **Animation** | Framer Motion |
| **CI/CD** | GitHub Actions |

---

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.

---

