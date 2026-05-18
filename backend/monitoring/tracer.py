"""
Observability Core — Tracing, Latency (p50/p95), Cost-per-request, Quality Metrics.
Uses in-process storage for simplicity; swap Redis/OTEL collector for prod.
"""

import time
import uuid
import statistics
import logging
from contextlib import contextmanager
from dataclasses import dataclass, field
from typing import Optional
from collections import defaultdict, deque

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Pricing (tokens → USD)  — update to match your LLM provider
# ---------------------------------------------------------------------------
COST_PER_1K_INPUT_TOKENS = 0.0001   # Groq Llama-3 approximate
COST_PER_1K_OUTPUT_TOKENS = 0.0002


@dataclass
class Span:
    trace_id: str
    span_id: str
    name: str
    start_ts: float
    end_ts: Optional[float] = None
    attributes: dict = field(default_factory=dict)
    error: Optional[str] = None

    @property
    def duration_ms(self) -> Optional[float]:
        if self.end_ts is None:
            return None
        return (self.end_ts - self.start_ts) * 1000


@dataclass
class RequestTrace:
    trace_id: str
    session_id: str
    query: str
    timestamp: float

    # Latency breakdown (ms)
    retrieval_ms: Optional[float] = None
    rerank_ms: Optional[float] = None
    llm_ms: Optional[float] = None
    total_ms: Optional[float] = None

    # Token usage
    input_tokens: int = 0
    output_tokens: int = 0
    cost_usd: float = 0.0

    # Quality
    num_chunks_retrieved: int = 0
    num_chunks_after_rerank: int = 0
    citation_density: float = 0.0
    citation_passed: bool = False

    # Retrieval debug
    bm25_top_score: Optional[float] = None
    vector_top_score: Optional[float] = None
    rerank_top_score: Optional[float] = None

    spans: list[Span] = field(default_factory=list)
    error: Optional[str] = None


class MetricsStore:
    """
    In-memory ring-buffer for request traces.
    Computes p50/p95 latency, cost totals, and quality aggregates.
    """

    MAX_TRACES = 10_000

    def __init__(self):
        self._traces: deque[RequestTrace] = deque(maxlen=self.MAX_TRACES)
        self._latency_windows: dict[str, deque] = defaultdict(lambda: deque(maxlen=1000))

    def record(self, trace: RequestTrace) -> None:
        self._traces.append(trace)
        if trace.total_ms is not None:
            self._latency_windows["total"].append(trace.total_ms)
        if trace.retrieval_ms is not None:
            self._latency_windows["retrieval"].append(trace.retrieval_ms)
        if trace.rerank_ms is not None:
            self._latency_windows["rerank"].append(trace.rerank_ms)
        if trace.llm_ms is not None:
            self._latency_windows["llm"].append(trace.llm_ms)

    def percentile(self, data: list[float], p: float) -> float:
        if not data:
            return 0.0
        sorted_data = sorted(data)
        idx = (p / 100) * (len(sorted_data) - 1)
        lo, hi = int(idx), min(int(idx) + 1, len(sorted_data) - 1)
        return sorted_data[lo] + (sorted_data[hi] - sorted_data[lo]) * (idx - lo)

    def latency_stats(self, stage: str = "total") -> dict:
        data = list(self._latency_windows.get(stage, []))
        if not data:
            return {"p50": 0, "p95": 0, "mean": 0, "count": 0}
        return {
            "p50": round(self.percentile(data, 50), 1),
            "p95": round(self.percentile(data, 95), 1),
            "mean": round(statistics.mean(data), 1),
            "count": len(data),
        }

    def summary(self) -> dict:
        traces = list(self._traces)
        if not traces:
            return {"total_requests": 0}

        successful = [t for t in traces if t.error is None]
        failed = [t for t in traces if t.error is not None]

        total_cost = sum(t.cost_usd for t in traces)
        citation_densities = [t.citation_density for t in successful if t.citation_density > 0]
        citation_pass_rate = sum(1 for t in successful if t.citation_passed) / max(len(successful), 1)

        return {
            "total_requests": len(traces),
            "successful": len(successful),
            "failed": len(failed),
            "error_rate": round(len(failed) / max(len(traces), 1), 4),
            "latency": {
                "total": self.latency_stats("total"),
                "retrieval": self.latency_stats("retrieval"),
                "rerank": self.latency_stats("rerank"),
                "llm": self.latency_stats("llm"),
            },
            "cost": {
                "total_usd": round(total_cost, 6),
                "avg_per_request_usd": round(total_cost / max(len(traces), 1), 6),
            },
            "quality": {
                "avg_citation_density": round(statistics.mean(citation_densities), 3) if citation_densities else 0,
                "citation_pass_rate": round(citation_pass_rate, 3),
                "avg_chunks_retrieved": round(statistics.mean([t.num_chunks_retrieved for t in successful]) if successful else 0, 1),
                "avg_chunks_after_rerank": round(statistics.mean([t.num_chunks_after_rerank for t in successful]) if successful else 0, 1),
            },
        }

    def recent_traces(self, limit: int = 50) -> list[dict]:
        traces = list(self._traces)[-limit:]
        return [
            {
                "trace_id": t.trace_id,
                "session_id": t.session_id,
                "query": t.query[:80] + ("…" if len(t.query) > 80 else ""),
                "timestamp": t.timestamp,
                "total_ms": t.total_ms,
                "cost_usd": t.cost_usd,
                "citation_density": t.citation_density,
                "citation_passed": t.citation_passed,
                "error": t.error,
            }
            for t in reversed(traces)
        ]


# ---------------------------------------------------------------------------
# Global singleton
# ---------------------------------------------------------------------------
metrics_store = MetricsStore()


class Tracer:
    """Context-manager based tracer that builds RequestTrace objects."""

    def __init__(self, session_id: str, query: str):
        self.trace_id = str(uuid.uuid4())
        self.trace = RequestTrace(
            trace_id=self.trace_id,
            session_id=session_id,
            query=query,
            timestamp=time.time(),
        )
        self._start = time.perf_counter()

    @contextmanager
    def span(self, name: str, **attrs):
        span = Span(
            trace_id=self.trace_id,
            span_id=str(uuid.uuid4()),
            name=name,
            start_ts=time.perf_counter(),
            attributes=attrs,
        )
        try:
            yield span
        except Exception as exc:
            span.error = str(exc)
            raise
        finally:
            span.end_ts = time.perf_counter()
            self.trace.spans.append(span)
            logger.debug("[%s] span=%s duration=%.1fms", self.trace_id, name, span.duration_ms)

    def record_retrieval(self, ms: float, num_chunks: int, bm25_top: float = None, vec_top: float = None):
        self.trace.retrieval_ms = ms
        self.trace.num_chunks_retrieved = num_chunks
        self.trace.bm25_top_score = bm25_top
        self.trace.vector_top_score = vec_top

    def record_rerank(self, ms: float, num_chunks: int, top_score: float = None):
        self.trace.rerank_ms = ms
        self.trace.num_chunks_after_rerank = num_chunks
        self.trace.rerank_top_score = top_score

    def record_llm(self, ms: float, input_tokens: int, output_tokens: int):
        self.trace.llm_ms = ms
        self.trace.input_tokens = input_tokens
        self.trace.output_tokens = output_tokens
        self.trace.cost_usd = (
            input_tokens / 1000 * COST_PER_1K_INPUT_TOKENS
            + output_tokens / 1000 * COST_PER_1K_OUTPUT_TOKENS
        )

    def record_quality(self, citation_report: dict):
        self.trace.citation_density = citation_report.get("citation_density", 0)
        self.trace.citation_passed = citation_report.get("passed", False)

    def finish(self, error: str = None):
        self.trace.total_ms = (time.perf_counter() - self._start) * 1000
        self.trace.error = error
        metrics_store.record(self.trace)
        logger.info(
            "[%s] total=%.1fms cost=$%.6f cited=%s",
            self.trace_id,
            self.trace.total_ms,
            self.trace.cost_usd,
            self.trace.citation_passed,
        )
        return self.trace
