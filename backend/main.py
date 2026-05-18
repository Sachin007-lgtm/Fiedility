"""
Main FastAPI Application
Integrates: Hybrid Retrieval → Cross-Encoder Rerank → Citation-Enforced LLM → Observability
"""

import os
import uuid
import time
import logging
from typing import Optional
from dotenv import load_dotenv

load_dotenv()

import fitz  # PyMuPDF
from fastapi import FastAPI, File, UploadFile, HTTPException, BackgroundTasks, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from groq import Groq

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
MONGO_URI = os.environ.get("MONGO_URI", "mongodb+srv://sachinsingh9971289015_db_user:6MHLjwEeDol1NqKl@cluster0.z2nik9c.mongodb.net/")
mongo_client = AsyncIOMotorClient(MONGO_URI)
db = mongo_client.fidelity_rag
chunks_collection = db.chunks

app = FastAPI(title="RAG Platform", version="2.0.0")

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
LLM_MODEL = "llama-3.1-8b-instant"


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
    citation_report: dict
    trace_id: str
    latency_ms: float
    cost_usd: float
    chunks_retrieved: int
    chunks_after_rerank: int


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def chunk_text(text: str, source: str, page: int) -> list[Chunk]:
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
                    metadata={"source": source, "page": page},
                )
            )
        start += CHUNK_SIZE - CHUNK_OVERLAP
    return chunks


def count_tokens(text: str) -> int:
    """Rough token estimate: 1 token ≈ 4 chars."""
    return len(text) // 4


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------
@app.get("/health")
def health():
    return {"status": "ok", "version": "2.0.0"}


@app.post("/upload")
async def upload_pdf(file: UploadFile = File(...), session_id: Optional[str] = Form(None)):
    """Ingest a PDF: extract → chunk → index into hybrid retriever."""
    if not file.filename.endswith(".pdf"):
        raise HTTPException(400, "Only PDF files are supported")

    session_id = session_id or str(uuid.uuid4())
    pdf_bytes = await file.read()

    try:
        doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    except Exception as exc:
        raise HTTPException(400, f"Could not parse PDF: {exc}")

    all_chunks: list[Chunk] = []
    for page_num, page in enumerate(doc):
        text = page.get_text()
        if text.strip():
            all_chunks.extend(chunk_text(text, source=file.filename, page=page_num + 1))

    doc.close()

    if not all_chunks:
        raise HTTPException(400, "No extractable text found in PDF")

    # Persist to Mongo
    chunk_docs = [{"session_id": session_id, "id": c.id, "text": c.text, "metadata": c.metadata} for c in all_chunks]
    if chunk_docs:
        await chunks_collection.insert_many(chunk_docs)

    retriever.add_chunks(session_id, all_chunks)
    logger.info("Indexed %d chunks for session %s", len(all_chunks), session_id)

    return {
        "session_id": session_id,
        "filename": file.filename,
        "pages": page_num + 1,
        "chunks_indexed": len(all_chunks),
    }


@app.post("/query", response_model=QueryResponse)
async def query(req: QueryRequest):
    """Full RAG pipeline with hybrid retrieval, reranking, citation enforcement, and tracing."""
    tracer = Tracer(session_id=req.session_id, query=req.query)

    try:
        # ---- Step 0: Ensure chunks are in memory (lazy load from Mongo) ----
        if not retriever.has_session(req.session_id):
            docs = await chunks_collection.find({"session_id": req.session_id}).to_list(length=10000)
            if docs:
                from retrieval.hybrid import Chunk
                db_chunks = [Chunk(id=d["id"], text=d["text"], metadata=d.get("metadata", {})) for d in docs]
                retriever.add_chunks(req.session_id, db_chunks)
                logger.info("Restored %d chunks from MongoDB for session %s", len(db_chunks), req.session_id)

        # ---- Step 1: Hybrid Retrieval ----
        t0 = time.perf_counter()
        with tracer.span("hybrid_retrieval", query=req.query, top_k=TOP_K_RETRIEVE):
            raw_chunks = retriever.retrieve(
                session_id=req.session_id,
                query=req.query,
                top_k=TOP_K_RETRIEVE,
            )
        retrieval_ms = (time.perf_counter() - t0) * 1000

        if not raw_chunks:
            tracer.finish(error="no_chunks")
            raise HTTPException(404, "No relevant content found. Please upload a PDF first.")

        bm25_top = raw_chunks[0].bm25_rank
        vec_top = raw_chunks[0].vector_rank
        tracer.record_retrieval(retrieval_ms, len(raw_chunks), bm25_top, vec_top)

        # ---- Step 2: Cross-Encoder Reranking ----
        t1 = time.perf_counter()
        with tracer.span("cross_encoder_rerank"):
            ranked_chunks = reranker.rerank(query=req.query, chunks=raw_chunks)
        rerank_ms = (time.perf_counter() - t1) * 1000

        top_score = ranked_chunks[0].rerank_score if ranked_chunks else None
        tracer.record_rerank(rerank_ms, len(ranked_chunks), top_score)

        # ---- Step 3: Build Citation-Enforced Prompt ----
        # Convert RankedChunk back to Chunk-like for CitationEnforcer
        class _ChunkProxy:
            def __init__(self, rc):
                self.id = rc.id
                self.text = rc.text
                self.metadata = rc.metadata
                self.score = rc.rerank_score

        proxies = [_ChunkProxy(rc) for rc in ranked_chunks]
        prompt, source_map = citation_enforcer.build_prompt(req.query, proxies)

        # ---- Step 4: LLM Generation ----
        t2 = time.perf_counter()
        with tracer.span("llm_generation", model=LLM_MODEL):
            completion = groq_client.chat.completions.create(
                model=LLM_MODEL,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.1,
                max_tokens=1024,
            )
        llm_ms = (time.perf_counter() - t2) * 1000

        answer = completion.choices[0].message.content
        input_tokens = completion.usage.prompt_tokens
        output_tokens = completion.usage.completion_tokens
        tracer.record_llm(llm_ms, input_tokens, output_tokens)

        # ---- Step 5: Parse & Validate Citations ----
        _, citations = citation_enforcer.parse_citations(answer, source_map, proxies)
        citation_report = citation_enforcer.validate(answer, source_map)
        tracer.record_quality(citation_report)

        trace = tracer.finish()

        return QueryResponse(
            answer=answer,
            citations=[c.to_dict() for c in citations],
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


def rag_query(query: str, session_id: str = "eval") -> dict:
    """Programmatic entry point for the evaluation pipeline."""
    import asyncio
    req = QueryRequest(query=query, session_id=session_id)
    loop = asyncio.new_event_loop()
    try:
        result = loop.run_until_complete(query_endpoint(req))
        return result.dict()
    finally:
        loop.close()

# alias for eval pipeline
query_endpoint = query
