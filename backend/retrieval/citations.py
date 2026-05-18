"""
Citation Enforcement.
Builds prompts that force citation, then validates the LLM's response
to ensure every answer references a source chunk by its ID.
"""

import re
import logging
from dataclasses import dataclass
from typing import Optional

logger = logging.getLogger(__name__)


@dataclass
class Citation:
    chunk_id: str
    page: Optional[int]
    source: str
    excerpt: str        # first 120 chars of the chunk

    def to_dict(self) -> dict:
        return {
            "chunk_id": self.chunk_id,
            "page": self.page,
            "source": self.source,
            "excerpt": self.excerpt,
        }


class CitationEnforcer:
    """
    Wraps context chunks in numbered [SOURCE:N] tags and instructs the LLM
    to cite every factual claim. Parses citations back from the response.
    """

    CITATION_PATTERN = re.compile(r"\[SOURCE:(\d+)\]")

    # Minimum fraction of sentences that must have a citation
    MIN_CITATION_DENSITY = 0.3

    def build_prompt(self, query: str, chunks: list) -> tuple[str, dict[str, any]]:
        """
        Build a citation-enforced prompt.
        Returns (prompt_text, source_map) where source_map maps "N" → chunk.
        """
        source_map: dict[str, any] = {}
        context_lines: list[str] = []

        for i, chunk in enumerate(chunks):
            tag = str(i + 1)
            source_map[tag] = chunk
            page = chunk.metadata.get("page", "?")
            source = chunk.metadata.get("source", "document")
            context_lines.append(
                f"[SOURCE:{tag}] (Page {page}, {source})\n{chunk.text}\n"
            )

        context_block = "\n---\n".join(context_lines)

        prompt = f"""You are a precise research assistant. Answer ONLY using the provided sources.

RULES (strictly enforced):
1. Every factual claim MUST end with its source tag, e.g. [SOURCE:1]
2. If a sentence uses multiple sources, list all: [SOURCE:1][SOURCE:3]
3. If the sources do not contain enough information to answer, say: "The provided documents do not contain sufficient information to answer this question."
4. Never fabricate information. Never answer from general knowledge.
5. Be concise but complete.

=== SOURCES ===
{context_block}

=== QUESTION ===
{query}

=== ANSWER (with inline citations) ==="""

        return prompt, source_map

    def parse_citations(
        self, response: str, source_map: dict[str, any], chunks: list
    ) -> tuple[str, list[Citation]]:
        """
        Extract [SOURCE:N] tags from response and build Citation objects.
        Returns (cleaned_response, citations).
        """
        found_tags = set(self.CITATION_PATTERN.findall(response))
        citations: list[Citation] = []

        chunk_lookup = {str(i + 1): chunk for i, chunk in enumerate(chunks)}

        for tag in sorted(found_tags, key=lambda x: int(x)):
            chunk = chunk_lookup.get(tag)
            if chunk:
                citations.append(
                    Citation(
                        chunk_id=chunk.id,
                        page=chunk.metadata.get("page"),
                        source=chunk.metadata.get("source", "document"),
                        excerpt=chunk.text[:120] + ("…" if len(chunk.text) > 120 else ""),
                    )
                )

        # Quality check: warn if citation density is low
        sentences = [s.strip() for s in re.split(r"[.!?]", response) if len(s.strip()) > 20]
        cited_sentences = [s for s in sentences if self.CITATION_PATTERN.search(s)]
        if sentences:
            density = len(cited_sentences) / len(sentences)
            if density < self.MIN_CITATION_DENSITY:
                logger.warning(
                    "Low citation density: %.0f%% of sentences cited (min %.0f%%)",
                    density * 100,
                    self.MIN_CITATION_DENSITY * 100,
                )

        return response, citations

    def validate(self, response: str, source_map: dict) -> dict:
        """Return a quality report for the citations in this response."""
        found = set(self.CITATION_PATTERN.findall(response))
        valid = {t for t in found if t in source_map}
        invalid = found - valid

        sentences = [s.strip() for s in re.split(r"[.!?]", response) if len(s.strip()) > 20]
        cited = [s for s in sentences if self.CITATION_PATTERN.search(s)]

        return {
            "total_sources_available": len(source_map),
            "sources_cited": len(valid),
            "invalid_citations": list(invalid),
            "sentence_count": len(sentences),
            "cited_sentence_count": len(cited),
            "citation_density": len(cited) / max(len(sentences), 1),
            "passed": len(invalid) == 0 and len(valid) > 0,
        }
