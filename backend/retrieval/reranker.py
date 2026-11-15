"""
Cross-Encoder Reranker.
Uses a cross-encoder model to re-score candidate chunks against the query.
Dramatically improves precision at the top of the result list.
"""

import os
import logging
from dataclasses import dataclass
from typing import Optional

logger = logging.getLogger(__name__)

try:
    from sentence_transformers import CrossEncoder
    _CE_AVAILABLE = True
except ImportError:
    _CE_AVAILABLE = False
    logger.warning("sentence-transformers not installed; reranker disabled")


@dataclass
class RankedChunk:
    id: str
    text: str
    metadata: dict
    retrieval_score: float   # score from hybrid retrieval
    rerank_score: float      # score from cross-encoder
    final_rank: int
    bm25_rank: Optional[int] = None
    vector_rank: Optional[int] = None


class CrossEncoderReranker:
    """
    Wraps a HuggingFace cross-encoder for reranking.
    Default model: ms-marco-MiniLM-L-6-v2 (fast + accurate).
    """

    DEFAULT_MODEL = "cross-encoder/ms-marco-MiniLM-L-6-v2"

    def __init__(self, model_name: str = DEFAULT_MODEL, top_n: int = 5):
        self.top_n = top_n
        self.model_name = model_name
        self._model = None  # lazy-load

    def _load(self):
        if self._model is None:
            enabled = os.environ.get("ENABLE_CROSS_ENCODER", "true").lower() in ("true", "1", "yes")
            if not enabled:
                logger.info("Cross-encoder disabled via ENABLE_CROSS_ENCODER=false (optimized for memory <512MB)")
                return
            if not _CE_AVAILABLE:
                logger.warning("sentence-transformers not available; skipping cross-encoder")
                return
            try:
                import torch
                torch.set_num_threads(1)
            except Exception:
                pass
            logger.info("Loading cross-encoder: %s", self.model_name)
            try:
                self._model = CrossEncoder(self.model_name, max_length=512)
            except Exception as e:
                logger.warning(f"Could not load cross-encoder ({e}); fallback to hybrid RRF scores")
                self._model = None

    def rerank(self, query: str, chunks: list) -> list[RankedChunk]:
        """
        Rerank chunks using cross-encoder scores.
        Falls back to retrieval scores if model unavailable or memory restricted.
        """
        if not chunks:
            return []

        try:
            self._load()
            if self._model is not None:
                pairs = [(query, c.text) for c in chunks]
                scores = self._model.predict(pairs).tolist()
            else:
                scores = [c.score for c in chunks]
        except Exception as exc:
            logger.warning("Reranking bypassed (%s); falling back to hybrid retrieval scores", exc)
            scores = [c.score for c in chunks]

        scored = sorted(zip(scores, chunks), key=lambda x: x[0], reverse=True)

        results: list[RankedChunk] = []
        for rank, (score, chunk) in enumerate(scored[: self.top_n]):
            results.append(
                RankedChunk(
                    id=chunk.id,
                    text=chunk.text,
                    metadata=chunk.metadata,
                    retrieval_score=chunk.score,
                    rerank_score=float(score),
                    final_rank=rank + 1,
                    bm25_rank=chunk.bm25_rank,
                    vector_rank=chunk.vector_rank,
                )
            )

        return results
