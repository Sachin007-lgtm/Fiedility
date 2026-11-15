"""
Finance Engine package — Structured financial fact storage, deterministic math execution,
and table-aware extraction.
"""

from .facts_db import init_facts_db, insert_fact, query_facts, get_metric_history
from .math_engine import (
    calculate_percentage_growth,
    calculate_ratio,
    calculate_margin,
    calculate_cagr,
    detect_and_execute_financial_math
)
from .fact_extractor import (
    extract_and_store_facts_from_page,
    seed_standard_financial_facts
)

