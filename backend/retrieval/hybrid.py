"""
Hybrid Retrieval: BM25 + Vector Search with score fusion.
Implements Reciprocal Rank Fusion (RRF) to merge rankings from both systems.
"""

import math
import logging
from dataclasses import dataclass, field
from typing import Optional
from collections import defaultdict

import numpy as np
from rank_bm25 import BM25Okapi
from sentence_transformers import SentenceTransformer

logger = logging.getLogger(__name__)


@dataclass
class Chunk:
    id: str
    text: str
    metadata: dict = field(default_factory=dict)
    score: float = 0.0
    bm25_rank: Optional[int] = None
    vector_rank: Optional[int] = None


class HybridRetriever:
    """
    Combines BM25 sparse retrieval with dense vector search.
    Uses Reciprocal Rank Fusion (RRF) for score merging.
    """

    def __init__(
        self,
        embed_model: str = "all-MiniLM-L6-v2",
        rrf_k: int = 60,
        bm25_weight: float = 0.4,
        vector_weight: float = 0.6,
    ):
        self.embedder = SentenceTransformer(embed_model)
        self.rrf_k = rrf_k
        self.bm25_weight = bm25_weight
        self.vector_weight = vector_weight

        # In-memory corpus (keyed by session_id)
        self._corpus: dict[str, list[Chunk]] = defaultdict(list)
        self._bm25_index: dict[str, BM25Okapi] = {}
        self._embeddings: dict[str, np.ndarray] = {}

    # ------------------------------------------------------------------
    # Indexing
    # ------------------------------------------------------------------

    def add_chunks(self, session_id: str, chunks: list[Chunk]) -> None:
        """Index new chunks under a session."""
        self._corpus[session_id].extend(chunks)
        self._rebuild_index(session_id)

    def has_session(self, session_id: str) -> bool:
        """Check if chunks are already loaded in memory."""
        return session_id in self._corpus and len(self._corpus[session_id]) > 0

    def _rebuild_index(self, session_id: str) -> None:
        corpus = self._corpus[session_id]
        tokenized = [c.text.lower().split() for c in corpus]
        self._bm25_index[session_id] = BM25Okapi(tokenized)

        texts = [c.text for c in corpus]
        self._embeddings[session_id] = self.embedder.encode(
            texts, show_progress_bar=False, normalize_embeddings=True
        )
        logger.debug("Rebuilt index for session %s (%d chunks)", session_id, len(corpus))

    # ------------------------------------------------------------------
    # Retrieval
    # ------------------------------------------------------------------

    def retrieve(
        self,
        session_id: str,
        query: str,
        top_k: int = 10,
        fetch_k: int = 30,
    ) -> list[Chunk]:
        """Hybrid retrieve: BM25 + vector → RRF fusion."""
        corpus = self._corpus.get(session_id, [])
        if not corpus:
            logger.warning("No chunks indexed for session %s", session_id)
            return []

        fetch_k = min(fetch_k, len(corpus))

        # ---- BM25 ----
        bm25_scores = self._bm25_index[session_id].get_scores(query.lower().split())
        bm25_ranked = sorted(range(len(bm25_scores)), key=lambda i: bm25_scores[i], reverse=True)

        # ---- Vector ----
        q_emb = self.embedder.encode([query], normalize_embeddings=True)[0]
        sims = self._embeddings[session_id] @ q_emb
        vec_ranked = sorted(range(len(sims)), key=lambda i: sims[i], reverse=True)

        # ---- RRF Fusion ----
        rrf_scores: dict[int, float] = defaultdict(float)
        for rank, idx in enumerate(bm25_ranked[:fetch_k]):
            rrf_scores[idx] += self.bm25_weight / (self.rrf_k + rank + 1)
        for rank, idx in enumerate(vec_ranked[:fetch_k]):
            rrf_scores[idx] += self.vector_weight / (self.rrf_k + rank + 1)

        top_indices = sorted(rrf_scores, key=lambda i: rrf_scores[i], reverse=True)[:top_k]

        results: list[Chunk] = []
        for i, idx in enumerate(top_indices):
            chunk = corpus[idx]
            chunk.score = rrf_scores[idx]
            chunk.bm25_rank = bm25_ranked.index(idx) if idx in bm25_ranked else None
            chunk.vector_rank = vec_ranked.index(idx) if idx in vec_ranked else None
            results.append(chunk)

        return results

    def clear_session(self, session_id: str) -> None:
        self._corpus.pop(session_id, None)
        self._bm25_index.pop(session_id, None)
        self._embeddings.pop(session_id, None)
