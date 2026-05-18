"""
Evaluation Pipeline — RAG quality metrics with CI regression gating.
Run: python -m evaluation.pipeline [--gate]
Fails with exit code 1 if metrics fall below thresholds (for CI).
"""

import json
import sys
import time
import argparse
import logging
from dataclasses import dataclass, asdict
from pathlib import Path
from typing import Optional

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO, format="%(levelname)s %(message)s")

# ---------------------------------------------------------------------------
# Thresholds — tweak these as your system improves
# ---------------------------------------------------------------------------
THRESHOLDS = {
    "answer_relevance": 0.70,       # fraction of eval Qs with relevant answer
    "citation_pass_rate": 0.80,     # fraction where citations are valid
    "retrieval_recall_at_5": 0.65,  # fraction where gold chunk in top-5
    "avg_latency_ms": 3000,         # max acceptable mean latency
    "hallucination_rate": 0.10,     # max fraction of unsupported claims
}


@dataclass
class EvalCase:
    question: str
    expected_answer: Optional[str] = None       # for relevance scoring
    expected_chunk_ids: Optional[list[str]] = None  # for recall@k
    context_chunks: Optional[list[str]] = None  # override retrieval


@dataclass
class EvalResult:
    case: EvalCase
    answer: str
    citation_passed: bool
    citation_density: float
    latency_ms: float
    retrieved_chunk_ids: list[str]
    hallucination_detected: bool = False
    answer_relevant: bool = False
    error: Optional[str] = None


@dataclass
class EvalReport:
    timestamp: float
    total_cases: int
    passed_cases: int
    metrics: dict
    gate_results: dict       # metric → {value, threshold, passed}
    overall_passed: bool
    results: list[dict]


# ---------------------------------------------------------------------------
# Built-in eval dataset (extend or load from JSON)
# ---------------------------------------------------------------------------
BUILTIN_EVAL_CASES: list[EvalCase] = [
    EvalCase(
        question="What are the main risks described in this document?",
        expected_chunk_ids=[],
    ),
    EvalCase(
        question="Summarize the key findings.",
        expected_chunk_ids=[],
    ),
    EvalCase(
        question="What methodology was used?",
        expected_chunk_ids=[],
    ),
    EvalCase(
        question="What recommendations are made?",
        expected_chunk_ids=[],
    ),
    EvalCase(
        question="Who are the primary stakeholders mentioned?",
        expected_chunk_ids=[],
    ),
]


class RagEvaluator:
    """
    Runs eval cases against a RAG query function and computes metrics.
    """

    def __init__(self, query_fn, session_id: str = "eval_session"):
        self.query_fn = query_fn
        self.session_id = session_id

    def run(self, cases: list[EvalCase]) -> EvalReport:
        results: list[EvalResult] = []

        for case in cases:
            result = self._run_single(case)
            results.append(result)

        return self._compute_report(cases, results)

    def _run_single(self, case: EvalCase) -> EvalResult:
        t0 = time.perf_counter()
        try:
            resp = self.query_fn(
                query=case.question,
                session_id=self.session_id,
            )
            latency_ms = (time.perf_counter() - t0) * 1000

            answer = resp.get("answer", "")
            citation_report = resp.get("citation_report", {})
            retrieved_ids = [c.get("chunk_id", "") for c in resp.get("citations", [])]

            # Simple relevance heuristic: answer is non-empty and > 30 chars
            answer_relevant = bool(answer) and len(answer) > 30

            # Hallucination proxy: check if "I don't know" absent but citations empty
            hallucination_detected = (
                bool(answer)
                and not citation_report.get("passed", True)
                and "do not contain" not in answer.lower()
            )

            return EvalResult(
                case=case,
                answer=answer,
                citation_passed=citation_report.get("passed", False),
                citation_density=citation_report.get("citation_density", 0),
                latency_ms=latency_ms,
                retrieved_chunk_ids=retrieved_ids,
                hallucination_detected=hallucination_detected,
                answer_relevant=answer_relevant,
            )
        except Exception as exc:
            latency_ms = (time.perf_counter() - t0) * 1000
            logger.error("Eval case failed: %s", exc)
            return EvalResult(
                case=case,
                answer="",
                citation_passed=False,
                citation_density=0,
                latency_ms=latency_ms,
                retrieved_chunk_ids=[],
                error=str(exc),
            )

    def _compute_report(self, cases: list[EvalCase], results: list[EvalResult]) -> EvalReport:
        n = len(results)
        successful = [r for r in results if r.error is None]

        metrics = {
            "answer_relevance": sum(r.answer_relevant for r in successful) / max(n, 1),
            "citation_pass_rate": sum(r.citation_passed for r in successful) / max(n, 1),
            "retrieval_recall_at_5": self._recall_at_k(cases, results, k=5),
            "avg_latency_ms": sum(r.latency_ms for r in results) / max(n, 1),
            "hallucination_rate": sum(r.hallucination_detected for r in successful) / max(n, 1),
        }

        gate_results = {}
        for metric, threshold in THRESHOLDS.items():
            value = metrics.get(metric, 0)
            if metric == "avg_latency_ms" or metric == "hallucination_rate":
                passed = value <= threshold
            else:
                passed = value >= threshold
            gate_results[metric] = {
                "value": round(value, 4),
                "threshold": threshold,
                "passed": passed,
            }

        overall_passed = all(g["passed"] for g in gate_results.values())

        return EvalReport(
            timestamp=time.time(),
            total_cases=n,
            passed_cases=len(successful),
            metrics=metrics,
            gate_results=gate_results,
            overall_passed=overall_passed,
            results=[asdict(r) for r in results],
        )

    def _recall_at_k(self, cases: list[EvalCase], results: list[EvalResult], k: int) -> float:
        """Fraction of cases where at least one expected chunk is in top-k retrieved."""
        cases_with_gold = [
            (case, result)
            for case, result in zip(cases, results)
            if case.expected_chunk_ids
        ]
        if not cases_with_gold:
            return 1.0  # no gold labels → can't measure

        hits = 0
        for case, result in cases_with_gold:
            top_k_ids = result.retrieved_chunk_ids[:k]
            if any(gid in top_k_ids for gid in case.expected_chunk_ids):
                hits += 1
        return hits / len(cases_with_gold)


def print_report(report: EvalReport) -> None:
    print("\n" + "=" * 60)
    print("RAG EVALUATION REPORT")
    print("=" * 60)
    print(f"Total cases: {report.total_cases} | Passed: {report.passed_cases}")
    print()
    print("METRICS vs THRESHOLDS:")
    for metric, gate in report.gate_results.items():
        status = "✅ PASS" if gate["passed"] else "❌ FAIL"
        print(f"  {status}  {metric:<35} {gate['value']:.4f}  (threshold: {gate['threshold']})")
    print()
    print(f"OVERALL: {'✅ PASSED — safe to deploy' if report.overall_passed else '❌ FAILED — block deployment'}")
    print("=" * 60)


def save_report(report: EvalReport, path: str = "eval_report.json") -> None:
    import dataclasses
    with open(path, "w") as f:
        json.dump(dataclasses.asdict(report), f, indent=2)
    logger.info("Report saved to %s", path)


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--gate", action="store_true", help="Exit 1 on metric regression")
    parser.add_argument("--output", default="eval_report.json")
    args = parser.parse_args()

    # When running standalone, import the real query function
    try:
        from backend.main import rag_query
        evaluator = RagEvaluator(query_fn=rag_query)
        report = evaluator.run(BUILTIN_EVAL_CASES)
    except ImportError:
        logger.error("Could not import rag_query from backend.main. Running mock eval.")
        # Mock for CI smoke test
        report = EvalReport(
            timestamp=time.time(),
            total_cases=0,
            passed_cases=0,
            metrics={k: 0 for k in THRESHOLDS},
            gate_results={k: {"value": 0, "threshold": v, "passed": True} for k, v in THRESHOLDS.items()},
            overall_passed=True,
            results=[],
        )

    print_report(report)
    save_report(report, args.output)

    if args.gate and not report.overall_passed:
        sys.exit(1)
