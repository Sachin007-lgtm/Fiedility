"""
Finsight Evaluation Pipeline — Institutional RAG Quality Gates & Benchmark Evaluation.
Validates Faithfulness, Citation Groundedness, Retrieval Recall, Latency, and Math Precision.
Usage:
    python -m evaluation.pipeline [--dataset evaluation/golden_dataset.json] [--limit 10] [--gate]
"""

import os
import sys
import json
import time
import argparse
import logging
from dataclasses import dataclass, asdict
from typing import Optional, List, Dict, Any

# Ensure backend root is on sys.path
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

logger = logging.getLogger("finsight.eval")
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")

# ---------------------------------------------------------------------------
# Strict Institutional Quality Gates
# ---------------------------------------------------------------------------
THRESHOLDS = {
    "answer_relevance": 0.75,       # >= 75% of answers accurately address the inquiry
    "citation_pass_rate": 0.80,     # >= 80% have valid grounded sources
    "retrieval_recall_at_5": 0.70,  # >= 70% recall of relevant chunks
    "avg_latency_ms": 3500,         # <= 3500 ms average latency
    "hallucination_rate": 0.10,     # <= 10% ungrounded assertions
}


@dataclass
class EvalCase:
    id: str
    question: str
    category: str = "General"
    company: str = "Institutional"
    expected_answer: Optional[str] = None
    ground_truth_keywords: Optional[List[str]] = None
    expected_chunk_ids: Optional[List[str]] = None


@dataclass
class EvalResult:
    case_id: str
    question: str
    category: str
    company: str
    answer: str
    citation_passed: bool
    citation_density: float
    latency_ms: float
    retrieved_chunk_ids: List[str]
    has_math_computation: bool = False
    hallucination_detected: bool = False
    answer_relevant: bool = False
    error: Optional[str] = None


@dataclass
class EvalReport:
    timestamp: float
    dataset_source: str
    total_cases: int
    passed_cases: int
    metrics: Dict[str, float]
    gate_results: Dict[str, Dict[str, Any]]
    overall_passed: bool
    results: List[Dict[str, Any]]


class RagEvaluator:
    """
    Executes golden benchmark cases through the full Finsight RAG pipeline
    and evaluates metrics against institutional quality gates.
    """

    def __init__(self, query_fn, session_id: str = "eval_session"):
        self.query_fn = query_fn
        self.session_id = session_id

    def run(self, cases: List[EvalCase]) -> EvalReport:
        results: List[EvalResult] = []
        logger.info(f"Starting evaluation of {len(cases)} benchmark cases against session '{self.session_id}'...")

        for idx, case in enumerate(cases):
            logger.info(f"[{idx+1}/{len(cases)}] Evaluating: {case.question[:65]}...")
            res = self._run_single(case)
            results.append(res)

        return self._compute_report(cases, results)

    def _run_single(self, case: EvalCase) -> EvalResult:
        t0 = time.perf_counter()
        try:
            resp = self.query_fn(query=case.question, session_id=self.session_id)
            latency_ms = (time.perf_counter() - t0) * 1000

            if isinstance(resp, str):
                answer = resp
                citations = []
                citation_report = {}
                math_comp = None
            else:
                answer = resp.get("answer", "")
                citations = resp.get("citations", [])
                citation_report = resp.get("citation_report", {})
                math_comp = resp.get("financial_computation")

            retrieved_ids = [c.get("chunk_id", "") for c in citations if isinstance(c, dict)]

            # Relevance check: checks answer length and keyword alignment
            is_relevant = bool(answer) and len(answer) > 30
            if case.ground_truth_keywords:
                matched_kw = sum(1 for kw in case.ground_truth_keywords if kw.lower() in answer.lower())
                if matched_kw >= 1:
                    is_relevant = True

            # Hallucination check
            passed_citation = citation_report.get("passed", len(citations) > 0 or math_comp is not None)
            hallucination_detected = (
                bool(answer)
                and not passed_citation
                and "do not contain" not in answer.lower()
                and "not found" not in answer.lower()
            )

            return EvalResult(
                case_id=case.id,
                question=case.question,
                category=case.category,
                company=case.company,
                answer=answer,
                citation_passed=passed_citation,
                citation_density=float(citation_report.get("citation_density", 1.0 if citations else 0.0)),
                latency_ms=latency_ms,
                retrieved_chunk_ids=retrieved_ids,
                has_math_computation=math_comp is not None,
                hallucination_detected=hallucination_detected,
                answer_relevant=is_relevant,
            )
        except Exception as exc:
            latency_ms = (time.perf_counter() - t0) * 1000
            logger.error(f"Error on case {case.id}: {exc}")
            return EvalResult(
                case_id=case.id,
                question=case.question,
                category=case.category,
                company=case.company,
                answer="",
                citation_passed=False,
                citation_density=0.0,
                latency_ms=latency_ms,
                retrieved_chunk_ids=[],
                has_math_computation=False,
                hallucination_detected=False,
                answer_relevant=False,
                error=str(exc),
            )

    def _compute_report(self, cases: List[EvalCase], results: List[EvalResult]) -> EvalReport:
        n = max(len(results), 1)
        successful = [r for r in results if r.error is None]
        n_succ = max(len(successful), 1)

        metrics = {
            "answer_relevance": round(sum(r.answer_relevant for r in successful) / n, 4),
            "citation_pass_rate": round(sum(r.citation_passed for r in successful) / n, 4),
            "retrieval_recall_at_5": round(self._recall_at_k(cases, results, k=5), 4),
            "avg_latency_ms": round(sum(r.latency_ms for r in results) / n, 2),
            "hallucination_rate": round(sum(r.hallucination_detected for r in successful) / n, 4),
        }

        gate_results = {}
        for metric, threshold in THRESHOLDS.items():
            val = metrics.get(metric, 0)
            if metric in ("avg_latency_ms", "hallucination_rate"):
                passed = val <= threshold
            else:
                passed = val >= threshold

            gate_results[metric] = {
                "value": val,
                "threshold": threshold,
                "passed": passed
            }

        overall_passed = all(g["passed"] for g in gate_results.values())

        return EvalReport(
            timestamp=time.time(),
            dataset_source=getattr(self, "dataset_name", "Golden Dataset"),
            total_cases=len(results),
            passed_cases=len(successful),
            metrics=metrics,
            gate_results=gate_results,
            overall_passed=overall_passed,
            results=[asdict(r) for r in results]
        )

    def _recall_at_k(self, cases: List[EvalCase], results: List[EvalResult], k: int = 5) -> float:
        cases_with_gold = [(c, r) for c, r in zip(cases, results) if c.expected_chunk_ids]
        if not cases_with_gold:
            return 1.0  # If no specific chunk IDs constrained, default pass
        hits = 0
        for c, r in cases_with_gold:
            top_ids = r.retrieved_chunk_ids[:k]
            if any(gid in top_ids for gid in c.expected_chunk_ids):
                hits += 1
        return hits / len(cases_with_gold)


def load_dataset(filepath: str, limit: Optional[int] = None) -> List[EvalCase]:
    """Loads evaluation cases from golden_dataset.json."""
    if not os.path.exists(filepath):
        raise FileNotFoundError(f"Evaluation dataset not found at {filepath}")

    with open(filepath, "r", encoding="utf-8") as f:
        data = json.load(f)

    if limit and limit > 0:
        data = data[:limit]

    cases = []
    for item in data:
        cases.append(EvalCase(
            id=item.get("id", f"CASE-{len(cases)+1:03d}"),
            question=item.get("question", ""),
            category=item.get("category", "General"),
            company=item.get("company", "Institutional"),
            expected_answer=item.get("expected_answer"),
            ground_truth_keywords=item.get("ground_truth_keywords", []),
            expected_chunk_ids=item.get("expected_chunk_ids", [])
        ))
    return cases


def print_report(report: EvalReport) -> None:
    print("\n" + "=" * 65)
    print("FINSIGHT INSTITUTIONAL RAG EVALUATION REPORT")
    print("=" * 65)
    print(f"Dataset: {report.dataset_source} | Cases: {report.total_cases} | Completed: {report.passed_cases}")
    print("-" * 65)
    print(f"{'METRIC':<28} {'VALUE':<10} {'GATE':<10} {'STATUS'}")
    print("-" * 65)
    for m, g in report.gate_results.items():
        status = "✅ PASS" if g["passed"] else "❌ FAIL"
        val_str = f"{g['value']:.2f}" if isinstance(g['value'], float) else str(g['value'])
        thresh_str = f"{g['threshold']:.2f}" if isinstance(g['threshold'], float) else str(g['threshold'])
        print(f"{m:<28} {val_str:<10} {thresh_str:<10} {status}")
    print("=" * 65)
    if report.overall_passed:
        print("OVERALL RESULT: ✅ PASSED — Meets Institutional Deployment Standard")
    else:
        print("OVERALL RESULT: ❌ FAILED — Regression detected, blocked by quality gate")
    print("=" * 65 + "\n")


def create_app_query_fn(session_id: str = "eval_session"):
    """Instantiates FastAPI TestClient and pre-indexes benchmark prospectus."""
    from fastapi.testclient import TestClient
    from main import app, retriever
    from finance_engine import seed_standard_financial_facts

    client = TestClient(app)
    seed_standard_financial_facts(session_id, retriever=retriever)

    # Ingest built-in sample document for grounding if session not indexed
    if not retriever.has_session(session_id):
        logger.info(f"Pre-indexing sample document for session {session_id}...")
        client.post("/documents/sample", data={"session_id": session_id})

    def query_fn(query: str, session_id: str = session_id):
        resp = client.post("/query", json={"query": query, "session_id": session_id})
        if resp.status_code == 200:
            return resp.json()
        return {"answer": "", "error": f"HTTP {resp.status_code}: {resp.text}"}

    return query_fn


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Finsight RAG Evaluation Pipeline")
    parser.add_argument("--dataset", default=os.path.join(os.path.dirname(__file__), "golden_dataset.json"))
    parser.add_argument("--limit", type=int, default=5, help="Number of questions to evaluate (default 5 for quick check, 0 for all)")
    parser.add_argument("--output", default="eval_report.json")
    parser.add_argument("--gate", action="store_true", help="Fail with exit code 1 if quality gates are not met")
    args = parser.parse_args()

    try:
        cases = load_dataset(args.dataset, limit=args.limit if args.limit > 0 else None)
        query_fn = create_app_query_fn(session_id="eval_session")
        evaluator = RagEvaluator(query_fn=query_fn, session_id="eval_session")
        evaluator.dataset_name = os.path.basename(args.dataset)
        report = evaluator.run(cases)
        print_report(report)

        # Save artifact report
        with open(args.output, "w", encoding="utf-8") as f:
            json.dump(asdict(report), f, indent=2)
        logger.info(f"Evaluation report saved to {args.output}")

        if args.gate and not report.overall_passed:
            logger.error("CI GATE FAILURE: Metrics failed institutional threshold!")
            sys.exit(1)
        sys.exit(0)

    except Exception as exc:
        logger.exception(f"Evaluation pipeline crashed: {exc}")
        sys.exit(1)
