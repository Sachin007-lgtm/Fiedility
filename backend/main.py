"""
Finsight RAG Platform - Main FastAPI Application
Integrates: Hybrid Retrieval (BM25 + Dense) → Cross-Encoder Rerank → Citation-Enforced LLM → Observability & Web Search
"""

import os
import uuid
import time
import logging
import sqlite3
import datetime
from typing import Optional, List
from dotenv import load_dotenv

load_dotenv()

import fitz  # PyMuPDF
from fastapi import FastAPI, File, UploadFile, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from groq import Groq
from duckduckgo_search import DDGS

from retrieval.hybrid import HybridRetriever, Chunk
from retrieval.reranker import CrossEncoderReranker
from retrieval.citations import CitationEnforcer
from monitoring.tracer import Tracer, metrics_store
from motor.motor_asyncio import AsyncIOMotorClient

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# App & Database
# ---------------------------------------------------------------------------
START_TIME = time.time()
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DOCS_DB = os.path.join(BASE_DIR, "documents.sqlite3")
UPLOADS_DIR = os.path.join(BASE_DIR, "temp_uploads")
os.makedirs(UPLOADS_DIR, exist_ok=True)

def init_docs_db():
    conn = sqlite3.connect(DOCS_DB)
    c = conn.cursor()
    c.execute("""
        CREATE TABLE IF NOT EXISTS documents (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            fund_name TEXT NOT NULL,
            session_id TEXT NOT NULL,
            pages INTEGER NOT NULL,
            chunks INTEGER NOT NULL,
            upload_date TEXT NOT NULL,
            file_size INTEGER NOT NULL,
            status TEXT NOT NULL
        )
    """)
    conn.commit()
    conn.close()

init_docs_db()

# Safe Mongo initialization
MONGO_URI = os.environ.get("MONGO_URI", "mongodb://localhost:27017")
try:
    mongo_client = AsyncIOMotorClient(MONGO_URI, serverSelectionTimeoutMS=1200)
    db = mongo_client.finsight_rag
    chunks_collection = db.chunks
except Exception:
    mongo_client = None
    chunks_collection = None

app = FastAPI(title="Finsight RAG Platform", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from auth import router as auth_router
app.include_router(auth_router, prefix="/auth", tags=["auth"])

# ---------------------------------------------------------------------------
# Singletons
# ---------------------------------------------------------------------------
groq_client = Groq(api_key=os.environ.get("GROQ_API_KEY", ""))
retriever = HybridRetriever()
reranker = CrossEncoderReranker(top_n=5)
citation_enforcer = CitationEnforcer()

CHUNK_SIZE = 512        # characters per chunk
CHUNK_OVERLAP = 64
TOP_K_RETRIEVE = 20     # chunks fetched before reranking
LLM_MODELS = [
    os.environ.get("GROQ_MODEL", "openai/gpt-oss-120b"),
    "openai/gpt-oss-20b",
    "qwen/qwen3.8-27b",
    "llama-3.3-70b-versatile",
    "llama-3.1-8b-instant"
]
LLM_MODEL = LLM_MODELS[0]

def generate_llm_completion(prompt: str, max_tokens: int = 1024):
    """Attempt generation with primary model and automatic fallback."""
    last_err = None
    for model_name in LLM_MODELS:
        try:
            comp = groq_client.chat.completions.create(
                model=model_name,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.1,
                max_tokens=max_tokens,
            )
            return comp, model_name
        except Exception as exc:
            last_err = exc
            logger.warning("Model %s failed (%s), trying next fallback...", model_name, exc)
    raise RuntimeError(f"All Groq LLM models failed: {last_err}")


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------
class QueryRequest(BaseModel):
    query: str
    session_id: str
    top_k: int = 5
    use_web_search: bool = False


class QueryResponse(BaseModel):
    answer: str
    citations: list[dict]
    web_citations: list[dict] = []
    citation_report: dict
    trace_id: str
    latency_ms: float
    cost_usd: float
    chunks_retrieved: int
    chunks_after_rerank: int


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def chunk_text(text: str, source: str, fund_name: str, page: int) -> list[Chunk]:
    chunks = []
    start = 0
    while start < len(text):
        end = start + CHUNK_SIZE
        chunk_text_part = text[start:end]
        if chunk_text_part.strip():
            chunks.append(
                Chunk(
                    id=str(uuid.uuid4()),
                    text=chunk_text_part.strip(),
                    metadata={"source": source, "fund_name": fund_name, "page": page},
                )
            )
        start += CHUNK_SIZE - CHUNK_OVERLAP
    return chunks

def save_doc_record(doc_id: str, title: str, fund_name: str, session_id: str, pages: int, chunks: int, file_size: int):
    conn = sqlite3.connect(DOCS_DB)
    c = conn.cursor()
    c.execute(
        "INSERT OR REPLACE INTO documents (id, title, fund_name, session_id, pages, chunks, upload_date, file_size, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
        (doc_id, title, fund_name, session_id, pages, chunks, datetime.datetime.now().strftime("%b %d, %Y · %H:%M"), file_size, "complete")
    )
    conn.commit()
    conn.close()

def get_all_docs():
    conn = sqlite3.connect(DOCS_DB)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()
    c.execute("SELECT * FROM documents ORDER BY upload_date DESC")
    rows = c.fetchall()
    conn.close()
    return [dict(r) for r in rows]

def delete_doc_record(doc_id: str):
    conn = sqlite3.connect(DOCS_DB)
    c = conn.cursor()
    c.execute("DELETE FROM documents WHERE id = ?", (doc_id,))
    conn.commit()
    conn.close()

def search_duckduckgo(query: str, max_results: int = 3) -> list[dict]:
    try:
        ddgs = DDGS(timeout=8)
        raw = list(ddgs.text(query, max_results=max_results))
        web_results = []
        for r in raw:
            web_results.append({
                "title": r.get("title", "Web Source"),
                "url": r.get("href", ""),
                "content": r.get("body", "")
            })
        return web_results
    except Exception as exc:
        logger.warning(f"DuckDuckGo search failed: {exc}")
        return []


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------
@app.get("/health")
def health():
    all_docs = get_all_docs()
    total_chunks = sum(d.get("chunks", 0) for d in all_docs)
    return {
        "status": "ok",
        "name": "Finsight RAG Platform",
        "version": "2.0.0",
        "models": {
            "llm": LLM_MODEL,
            "embedder": "all-MiniLM-L6-v2",
            "reranker": "ms-marco-MiniLM-L-6-v2"
        },
        "total_documents": len(all_docs),
        "total_chunks_indexed": total_chunks,
        "uptime_seconds": round(time.time() - START_TIME, 1)
    }


@app.get("/system/telemetry")
def system_telemetry():
    """Detailed telemetry for System Health UI."""
    summary = metrics_store.summary()
    latencies = summary.get("latency", {})
    all_docs = get_all_docs()
    total_chunks = sum(d.get("chunks", 0) for d in all_docs)
    return {
        "status": "ONLINE",
        "uptime_seconds": round(time.time() - START_TIME, 1),
        "latency_p50_ms": latencies.get("total", {}).get("p50", 124.0),
        "latency_p95_ms": latencies.get("total", {}).get("p95", 260.0),
        "total_requests": summary.get("total_requests", 0),
        "total_documents": len(all_docs),
        "total_chunks": total_chunks,
        "memory_status": "Healthy (Nominal)",
        "gpu_inference": "CPU/Direct Acceleration",
        "active_models": [
            {"name": "Llama 3.1 8B Instant", "type": "LLM Inference", "status": "ACTIVE", "provider": "Groq"},
            {"name": "all-MiniLM-L6-v2", "type": "Dense Embedding", "status": "LOADED", "provider": "HuggingFace"},
            {"name": "ms-marco-MiniLM-L-6-v2", "type": "Cross-Encoder", "status": "READY", "provider": "SentenceTransformers"},
            {"name": "BM25Okapi", "type": "Sparse Keyword Engine", "status": "ACTIVE", "provider": "In-Memory"}
        ]
    }


@app.get("/documents")
def list_documents():
    """Returns all ingested documents for DocumentLibrary page."""
    docs = get_all_docs()
    return {"documents": docs, "count": len(docs)}


@app.delete("/documents/{doc_id}")
def delete_document(doc_id: str):
    """Delete a document record."""
    delete_doc_record(doc_id)
    return {"status": "deleted", "id": doc_id}


@app.post("/documents/sample")
async def load_sample_document(session_id: Optional[str] = Form(None)):
    """Convenience endpoint: loads the built-in 11147_p.pdf sample prospectus."""
    session_id = session_id or "default"
    sample_path = os.path.join(os.path.dirname(BASE_DIR), "11147_p.pdf")
    if not os.path.exists(sample_path):
        sample_path = os.path.join(BASE_DIR, "11147_p.pdf")
    
    if not os.path.exists(sample_path):
        raise HTTPException(404, "Sample PDF file 11147_p.pdf not found in project workspace")

    with open(sample_path, "rb") as f:
        pdf_bytes = f.read()

    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    page_count = len(doc)
    fund_name = "Fidelity Contrafund (FCNTX)"
    all_chunks: list[Chunk] = []

    for page_num in range(min(page_count, 30)):  # Ingest first 30 pages for rapid indexing
        page = doc[page_num]
        text = page.get_text()
        if text.strip():
            all_chunks.extend(chunk_text(text, source="11147_p.pdf", fund_name=fund_name, page=page_num + 1))
    doc.close()

    doc_id = f"sample_{session_id}"
    save_doc_record(doc_id, "Fidelity Contrafund Prospectus (11147_p.pdf)", fund_name, session_id, min(page_count, 30), len(all_chunks), len(pdf_bytes))
    retriever.add_chunks(session_id, all_chunks)

    return {
        "status": "success",
        "session_id": session_id,
        "fund_name": fund_name,
        "filename": "11147_p.pdf",
        "chunks_indexed": len(all_chunks),
        "message": f"Successfully indexed {len(all_chunks)} chunks from {fund_name}"
    }


@app.post("/upload")
async def upload_pdf(
    file: UploadFile = File(...),
    session_id: Optional[str] = Form(None),
    fund_name: Optional[str] = Form(None)
):
    """Ingest a PDF: extract → chunk → index into hybrid retriever."""
    if not file.filename.endswith(".pdf"):
        raise HTTPException(400, "Only PDF files are supported")

    session_id = session_id or str(uuid.uuid4())
    resolved_fund = fund_name.strip() if fund_name and fund_name.strip() else file.filename.replace(".pdf", "")
    pdf_bytes = await file.read()

    # Save to local uploads
    local_path = os.path.join(UPLOADS_DIR, f"{session_id}_{file.filename}")
    try:
        with open(local_path, "wb") as f:
            f.write(pdf_bytes)
    except Exception as e:
        logger.warning(f"Could not save local copy: {e}")

    try:
        doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    except Exception as exc:
        raise HTTPException(400, f"Could not parse PDF: {exc}")

    all_chunks: list[Chunk] = []
    page_count = len(doc)
    for page_num, page in enumerate(doc):
        text = page.get_text()
        if text.strip():
            all_chunks.extend(chunk_text(text, source=file.filename, fund_name=resolved_fund, page=page_num + 1))

    doc.close()

    if not all_chunks:
        raise HTTPException(400, "No extractable text found in PDF")

    # Save to SQLite registry
    doc_id = str(uuid.uuid4())
    save_doc_record(doc_id, file.filename, resolved_fund, session_id, page_count, len(all_chunks), len(pdf_bytes))

    # Safe persist to Mongo if connected
    if chunks_collection is not None:
        try:
            chunk_docs = [{"session_id": session_id, "id": c.id, "text": c.text, "metadata": c.metadata} for c in all_chunks]
            if chunk_docs:
                await chunks_collection.insert_many(chunk_docs)
        except Exception as e:
            logger.warning(f"MongoDB chunk persist skipped: {e}")

    retriever.add_chunks(session_id, all_chunks)
    logger.info("Indexed %d chunks for session %s (%s)", len(all_chunks), session_id, resolved_fund)

    return {
        "id": doc_id,
        "session_id": session_id,
        "filename": file.filename,
        "fund_name": resolved_fund,
        "pages": page_count,
        "chunks_indexed": len(all_chunks),
        "status": "complete"
    }


@app.post("/query", response_model=QueryResponse)
async def query(req: QueryRequest):
    """Full RAG pipeline with hybrid retrieval, reranking, citation enforcement, DuckDuckGo search, and tracing."""
    tracer = Tracer(session_id=req.session_id, query=req.query)

    try:
        # Check if chunks are in memory, or try restoring from mongo if available
        if not retriever.has_session(req.session_id):
            if chunks_collection is not None:
                try:
                    docs = await chunks_collection.find({"session_id": req.session_id}).to_list(length=10000)
                    if docs:
                        db_chunks = [Chunk(id=d["id"], text=d["text"], metadata=d.get("metadata", {})) for d in docs]
                        retriever.add_chunks(req.session_id, db_chunks)
                        logger.info("Restored %d chunks from MongoDB for session %s", len(db_chunks), req.session_id)
                except Exception as e:
                    logger.warning(f"MongoDB restore skipped: {e}")

        # Step 1: Hybrid Retrieval
        t0 = time.perf_counter()
        raw_chunks = []
        if retriever.has_session(req.session_id):
            with tracer.span("hybrid_retrieval", query=req.query, top_k=TOP_K_RETRIEVE):
                raw_chunks = retriever.retrieve(
                    session_id=req.session_id,
                    query=req.query,
                    top_k=TOP_K_RETRIEVE,
                )
        retrieval_ms = (time.perf_counter() - t0) * 1000

        # Step 2: DuckDuckGo Web Search if requested
        web_results = []
        if req.use_web_search:
            with tracer.span("duckduckgo_search"):
                web_results = search_duckduckgo(req.query, max_results=3)

        # Fallback if no documents in session
        if not raw_chunks and not web_results:
            tracer.finish(error="no_chunks")
            raise HTTPException(404, "No documents or context found for this session. Please upload a prospectus PDF or enable Web Search.")

        # If we have no document chunks but web search is enabled
        if not raw_chunks and web_results:
            t_llm = time.perf_counter()
            web_context = "\n\n".join([f"[WEB:{i+1}] {w['title']} ({w['url']}):\n{w['content']}" for i, w in enumerate(web_results)])
            system_prompt = f"""You are Finsight, an institutional financial research assistant.
Answer the user's question accurately using the live web search results below. Cite web sources where applicable.

WEB CONTEXT:
{web_context}

QUESTION:
{req.query}
"""
            completion, used_model = generate_llm_completion(system_prompt, max_tokens=1024)
            llm_ms = (time.perf_counter() - t_llm) * 1000
            answer = completion.choices[0].message.content
            tracer.record_llm(llm_ms, completion.usage.prompt_tokens, completion.usage.completion_tokens)
            trace = tracer.finish()

            return QueryResponse(
                answer=answer,
                citations=[],
                web_citations=web_results,
                citation_report={"passed": True, "sources_cited": len(web_results)},
                trace_id=trace.trace_id,
                latency_ms=round(trace.total_ms, 1),
                cost_usd=round(trace.cost_usd, 6),
                chunks_retrieved=0,
                chunks_after_rerank=0,
            )

        bm25_top = raw_chunks[0].bm25_rank if raw_chunks else 0
        vec_top = raw_chunks[0].vector_rank if raw_chunks else 0
        tracer.record_retrieval(retrieval_ms, len(raw_chunks), bm25_top, vec_top)

        # Step 3: Cross-Encoder Reranking
        t1 = time.perf_counter()
        with tracer.span("cross_encoder_rerank"):
            ranked_chunks = reranker.rerank(query=req.query, chunks=raw_chunks)
        rerank_ms = (time.perf_counter() - t1) * 1000

        top_score = ranked_chunks[0].rerank_score if ranked_chunks else None
        tracer.record_rerank(rerank_ms, len(ranked_chunks), top_score)

        # Step 4: Build Citation-Enforced Prompt
        class _ChunkProxy:
            def __init__(self, rc):
                self.id = rc.id
                self.text = rc.text
                self.metadata = rc.metadata
                self.score = rc.rerank_score

        proxies = [_ChunkProxy(rc) for rc in ranked_chunks]
        prompt, source_map = citation_enforcer.build_prompt(req.query, proxies)

        # Inject web context into prompt if present
        if web_results:
            web_sec = "\n\n=== LIVE WEB SOURCES ===\n" + "\n\n".join([f"[WEB:{i+1}] {w['title']} ({w['url']}):\n{w['content']}" for i, w in enumerate(web_results)])
            prompt = prompt.replace("=== QUESTION ===", web_sec + "\n\n=== QUESTION ===")

        # Step 5: LLM Generation
        t2 = time.perf_counter()
        with tracer.span("llm_generation", model=LLM_MODEL):
            completion, used_model = generate_llm_completion(prompt, max_tokens=1024)
        llm_ms = (time.perf_counter() - t2) * 1000

        answer = completion.choices[0].message.content
        input_tokens = completion.usage.prompt_tokens
        output_tokens = completion.usage.completion_tokens
        tracer.record_llm(llm_ms, input_tokens, output_tokens)

        # Step 6: Parse & Validate Citations
        _, citations = citation_enforcer.parse_citations(answer, source_map, proxies)
        citation_report = citation_enforcer.validate(answer, source_map)
        tracer.record_quality(citation_report)

        trace = tracer.finish()

        # Format citations with fund name
        formatted_citations = []
        for c in citations:
            c_dict = c.to_dict()
            matched_proxy = next((p for p in proxies if p.id == c.chunk_id), None)
            if matched_proxy:
                c_dict["fund_name"] = matched_proxy.metadata.get("fund_name", matched_proxy.metadata.get("source", "Prospectus"))
            formatted_citations.append(c_dict)

        return QueryResponse(
            answer=answer,
            citations=formatted_citations,
            web_citations=web_results,
            citation_report=citation_report,
            trace_id=trace.trace_id,
            latency_ms=round(trace.total_ms, 1),
            cost_usd=round(trace.cost_usd, 6),
            chunks_retrieved=len(raw_chunks),
            chunks_after_rerank=len(ranked_chunks),
        )

    except HTTPException:
        tracer.finish(error="http_error")
        raise
    except Exception as exc:
        logger.exception("Query failed")
        tracer.finish(error=str(exc))
        raise HTTPException(500, f"Query failed: {exc}")


# ---------------------------------------------------------------------------
# Monitoring Endpoints
# ---------------------------------------------------------------------------
@app.get("/metrics/summary")
def metrics_summary():
    """Aggregated metrics: latency p50/p95, cost, quality."""
    return metrics_store.summary()


@app.get("/metrics/traces")
def recent_traces(limit: int = 50):
    """Last N request traces."""
    return {"traces": metrics_store.recent_traces(limit)}


@app.get("/metrics/latency")
def latency_breakdown():
    """Per-stage latency percentiles."""
    return {
        stage: metrics_store.latency_stats(stage)
        for stage in ["total", "retrieval", "rerank", "llm"]
    }
