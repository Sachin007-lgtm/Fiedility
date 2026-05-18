"""Unit tests for hybrid retrieval, reranker, citation enforcer, and tracer."""

import time
import pytest
from retrieval.hybrid import HybridRetriever, Chunk
from retrieval.citations import CitationEnforcer
from monitoring.tracer import Tracer, MetricsStore


# ---------------------------------------------------------------------------
# Hybrid Retriever
# ---------------------------------------------------------------------------
class TestHybridRetriever:
    def setup_method(self):
        self.retriever = HybridRetriever()
        self.session = "test-session"
        chunks = [
            Chunk(id=f"c{i}", text=f"Document chunk {i} about {'machine learning' if i % 2 == 0 else 'data science'}", metadata={"page": i})
            for i in range(10)
        ]
        self.retriever.add_chunks(self.session, chunks)

    def test_returns_results(self):
        results = self.retriever.retrieve(self.session, "machine learning", top_k=5)
        assert len(results) > 0

    def test_top_k_respected(self):
        results = self.retriever.retrieve(self.session, "data", top_k=3)
        assert len(results) <= 3

    def test_empty_session(self):
        results = self.retriever.retrieve("nonexistent", "query")
        assert results == []

    def test_scores_present(self):
        results = self.retriever.retrieve(self.session, "machine learning", top_k=5)
        for r in results:
            assert r.score > 0

    def test_clear_session(self):
        self.retriever.clear_session(self.session)
        results = self.retriever.retrieve(self.session, "machine learning")
        assert results == []


# ---------------------------------------------------------------------------
# Citation Enforcer
# ---------------------------------------------------------------------------
class TestCitationEnforcer:
    def setup_method(self):
        self.enforcer = CitationEnforcer()

    def _make_chunk(self, text, page=1, source="test.pdf"):
        class FakeChunk:
            def __init__(self, t, p, s):
                self.id = "chunk-1"
                self.text = t
                self.metadata = {"page": p, "source": s}
                self.score = 0.9
        return FakeChunk(text, page, source)

    def test_prompt_contains_source_tag(self):
        chunks = [self._make_chunk("Some relevant text.")]
        prompt, source_map = self.enforcer.build_prompt("What is this about?", chunks)
        assert "[SOURCE:1]" in prompt
        assert "1" in source_map

    def test_parse_citations(self):
        chunks = [self._make_chunk("The sky is blue.")]
        _, source_map = self.enforcer.build_prompt("Color?", chunks)
        response = "The sky is blue [SOURCE:1]."
        _, citations = self.enforcer.parse_citations(response, source_map, chunks)
        assert len(citations) == 1

    def test_validate_passes(self):
        chunks = [self._make_chunk("The sky is blue.")]
        _, source_map = self.enforcer.build_prompt("Color?", chunks)
        response = "The sky is blue [SOURCE:1]."
        report = self.enforcer.validate(response, source_map)
        assert report["sources_cited"] == 1
        assert report["invalid_citations"] == []

    def test_validate_catches_invalid(self):
        chunks = [self._make_chunk("The sky is blue.")]
        _, source_map = self.enforcer.build_prompt("Color?", chunks)
        response = "The sky is green [SOURCE:99]."  # 99 doesn't exist
        report = self.enforcer.validate(response, source_map)
        assert "99" in report["invalid_citations"]
        assert not report["passed"]


# ---------------------------------------------------------------------------
# Tracer & MetricsStore
# ---------------------------------------------------------------------------
class TestTracer:
    def test_basic_trace(self):
        tracer = Tracer(session_id="s1", query="test query")
        tracer.record_retrieval(50.0, 10)
        tracer.record_rerank(20.0, 5, top_score=0.85)
        tracer.record_llm(300.0, 200, 100)
        tracer.record_quality({"citation_density": 0.8, "passed": True})
        trace = tracer.finish()

        assert trace.retrieval_ms == 50.0
        assert trace.rerank_ms == 20.0
        assert trace.llm_ms == 300.0
        assert trace.total_ms is not None
        assert trace.total_ms > 0
        assert trace.cost_usd > 0
        assert trace.citation_passed is True

    def test_span_context_manager(self):
        tracer = Tracer(session_id="s2", query="span test")
        with tracer.span("my_span", key="val") as span:
            time.sleep(0.01)
        tracer.finish()
        assert len(tracer.trace.spans) == 1
        assert tracer.trace.spans[0].duration_ms >= 10

    def test_metrics_store_summary(self):
        store = MetricsStore()
        t = Tracer(session_id="s3", query="q")
        t.record_retrieval(40, 8)
        t.record_rerank(15, 4)
        t.record_llm(250, 150, 80)
        t.record_quality({"citation_density": 0.75, "passed": True})
        trace = t.finish()
        store.record(trace)

        summary = store.summary()
        assert summary["total_requests"] == 1
        assert summary["latency"]["total"]["count"] == 1

    def test_percentile_calculation(self):
        store = MetricsStore()
        for i in range(100):
            store._latency_windows["total"].append(float(i))
        stats = store.latency_stats("total")
        assert 48 <= stats["p50"] <= 51
        assert stats["p95"] >= 90
