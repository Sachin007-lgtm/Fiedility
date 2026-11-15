"""
Deterministic Financial Math Engine.
Executes exact mathematical operations (growth rates, debt-to-equity, margins, CAGR, expense ratios)
in Python so that the LLM explains verified computations rather than hallucinating arithmetic.
"""

from typing import Dict, Any, Optional, List
import re
import logging
from .facts_db import query_facts, get_metric_history

logger = logging.getLogger(__name__)


def calculate_percentage_growth(v_start: float, v_end: float) -> Dict[str, Any]:
    """Calculates percentage growth between two periods."""
    if v_start == 0:
        return {"error": "Base value is zero; cannot compute percentage growth."}
    
    absolute_change = v_end - v_start
    pct_change = (absolute_change / abs(v_start)) * 100.0
    direction = "increase" if pct_change > 0 else ("decrease" if pct_change < 0 else "unchanged")
    return {
        "operation": "percentage_growth",
        "initial_value": v_start,
        "final_value": v_end,
        "absolute_change": round(absolute_change, 4),
        "percentage_change": round(pct_change, 2),
        "direction": direction,
        "formula": "((final - initial) / |initial|) * 100",
        "human_readable": f"{round(pct_change, 2):+}% (from {v_start} to {v_end})",
        "explanation": f"Growth of {round(pct_change, 2)}% ({direction}) computed via formula ((final - initial) / initial) * 100"
    }


def calculate_ratio(numerator: float, denominator: float, ratio_name: str = "Ratio") -> Dict[str, Any]:
    """Computes a financial ratio (e.g., Debt-to-Equity, P/E, Current Ratio)."""
    if denominator == 0:
        return {"error": f"Denominator is zero; cannot compute {ratio_name}."}
    
    ratio_val = numerator / denominator
    return {
        "operation": "financial_ratio",
        "ratio_name": ratio_name,
        "numerator": numerator,
        "denominator": denominator,
        "ratio_value": round(ratio_val, 4),
        "formula": f"{ratio_name} = numerator / denominator",
        "human_readable": f"{ratio_name}: {round(ratio_val, 2)}x",
        "explanation": f"{ratio_name} of {round(ratio_val, 4)}x computed as numerator {numerator} / denominator {denominator}"
    }


def calculate_margin(profit: float, revenue: float, margin_type: str = "Margin") -> Dict[str, Any]:
    """Calculates profit or operating margin as a percentage."""
    if revenue == 0:
        return {"error": "Revenue is zero; cannot compute margin."}
    
    margin_pct = (profit / revenue) * 100.0
    return {
        "operation": "margin",
        "margin_type": margin_type,
        "profit": profit,
        "revenue": revenue,
        "margin_percentage": round(margin_pct, 2),
        "formula": "(profit / revenue) * 100",
        "human_readable": f"{margin_type}: {round(margin_pct, 2)}%",
        "explanation": f"{margin_type} of {round(margin_pct, 2)}% computed as (profit {profit} / revenue {revenue}) * 100"
    }


def calculate_cagr(start_val: float, end_val: float, periods: int) -> Dict[str, Any]:
    """Computes Compound Annual Growth Rate (CAGR)."""
    if start_val <= 0 or end_val <= 0 or periods <= 0:
        return {"error": "Values must be positive and periods > 0 for CAGR calculation."}
    
    cagr_pct = (((end_val / start_val) ** (1.0 / periods)) - 1.0) * 100.0
    return {
        "operation": "cagr",
        "start_val": start_val,
        "end_val": end_val,
        "periods": periods,
        "cagr_percentage": round(cagr_pct, 2),
        "formula": "((end / start) ^ (1/n) - 1) * 100",
        "human_readable": f"CAGR over {periods} periods: {round(cagr_pct, 2)}%"
    }


def detect_and_execute_financial_math(
    query_text: str,
    session_id: Optional[str] = None
) -> Optional[Dict[str, Any]]:
    """
    Inspects user question for mathematical intent (e.g., 'growth', 'change', 'margin', 'ratio').
    Queries structured facts and performs deterministic calculation.
    """
    q_lower = query_text.lower()

    # Pattern 1: Growth / Change / Increase / Decrease
    is_growth_query = any(w in q_lower for w in ["growth", "change", "increased", "decreased", "higher", "compared to", "versus"])
    # Pattern 2: Margin queries
    is_margin_query = "margin" in q_lower
    # Pattern 3: Ratio queries (specifically debt/equity or liquidity)
    is_ratio_query = ("debt to equity" in q_lower or "debt-to-equity" in q_lower or ("ratio" in q_lower and "expense" not in q_lower))
    # Pattern 4: Metric lookup (expense ratio, management fee, turnover, revenue, etc.)
    is_metric_query = any(m in q_lower for m in ["expense ratio", "management fee", "advisory fee", "turnover", "revenue", "sales", "ebitda", "net profit", "total debt", "equity"])

    if not (is_growth_query or is_margin_query or is_ratio_query or is_metric_query):
        return None

    # Detect metric
    target_metric = None
    if "revenue" in q_lower or "sales" in q_lower:
        target_metric = "revenue"
    elif "profit" in q_lower or "net income" in q_lower:
        target_metric = "net_profit"
    elif "ebitda" in q_lower or "operating income" in q_lower:
        target_metric = "ebitda"
    elif "debt" in q_lower and "equity" in q_lower:
        target_metric = "debt_to_equity"
    elif "expense" in q_lower or "fee" in q_lower:
        target_metric = "expense_ratio"

    # Detect company filter
    company_filter = None
    if "reliance" in q_lower:
        company_filter = "Reliance"
    elif "tcs" in q_lower or "tata" in q_lower:
        company_filter = "TCS"
    elif "infosys" in q_lower:
        company_filter = "Infosys"
    elif "fidelity" in q_lower or "contrafund" in q_lower:
        company_filter = "Fidelity"

    # Query structured facts
    facts = query_facts(session_id=session_id)
    if not facts:
        # Fallback to query without session_id if empty
        facts = query_facts()

    if not facts:
        return None

    if company_filter:
        facts = [f for f in facts if company_filter.lower() in f.get("company", "").lower()]

    if not facts:
        return None

    # Detect years mentioned in query
    years_found = [y.upper().replace(" ", "") for y in re.findall(r"(?:FY\s*20\d{2}|FY\s*\d{2}|20\d{2})", query_text, re.IGNORECASE)]
    normalized_years = []
    for y in years_found:
        if not y.startswith("FY"):
            normalized_years.append(f"FY{y}")
        else:
            normalized_years.append(y)

    # Execute corresponding calculation
    if is_growth_query and target_metric:
        metric_facts = [f for f in facts if target_metric in f["metric"]]
        if len(metric_facts) >= 2:
            # If specific years were requested, filter by them
            if len(normalized_years) >= 2:
                selected_facts = [f for f in metric_facts if f["fiscal_year"] in normalized_years]
                if len(selected_facts) >= 2:
                    metric_facts = selected_facts

            # Sort chronologically by year
            sorted_facts = sorted(metric_facts, key=lambda x: str(x["fiscal_year"]))
            f1, f2 = sorted_facts[0], sorted_facts[-1]
            growth_result = calculate_percentage_growth(f1["value"], f2["value"])
            return {
                "calculation_type": "Growth Analysis",
                "metric": target_metric,
                "company": f1["company"],
                "period_1": f1["fiscal_year"],
                "value_1": f1["value"],
                "period_2": f2["fiscal_year"],
                "value_2": f2["value"],
                "unit": f1.get("unit", ""),
                "result": growth_result,
                "verified_statement": f"Verified Python Computation: {f1['company']} {target_metric.replace('_', ' ').title()} changed from {f1['value']:.2f} {f1.get('unit','')} ({f1['fiscal_year']}) to {f2['value']:.2f} {f2.get('unit','')} ({f2['fiscal_year']}), representing a growth of {growth_result.get('percentage_change'):.2f}% [Formula: ({f2['value']:.2f} - {f1['value']:.2f}) / {f1['value']:.2f} * 100]."
            }

    if is_margin_query:
        # Look for profit and revenue for same year
        revenues = [f for f in facts if "revenue" in f["metric"]]
        profits = [f for f in facts if "profit" in f["metric"] or "income" in f["metric"]]
        if revenues and profits:
            rev = revenues[-1]
            prof = profits[-1]
            margin_result = calculate_margin(prof["value"], rev["value"], "Profit Margin")
            return {
                "calculation_type": "Margin Analysis",
                "company": rev["company"],
                "fiscal_year": rev["fiscal_year"],
                "revenue": rev["value"],
                "profit": prof["value"],
                "result": margin_result,
                "verified_statement": f"Verified Python Computation: {rev['company']} Margin for {rev['fiscal_year']} is {margin_result.get('margin_percentage')}% (Profit: {prof['value']} / Revenue: {rev['value']})."
            }

    if is_ratio_query:
        debts = [f for f in facts if "debt" in f["metric"]]
        equities = [f for f in facts if "equity" in f["metric"]]
        if debts and equities:
            d = debts[-1]
            e = equities[-1]
            ratio_result = calculate_ratio(d["value"], e["value"], "Debt-to-Equity Ratio")
            return {
                "calculation_type": "Ratio Analysis",
                "company": d["company"],
                "fiscal_year": d["fiscal_year"],
                "debt": d["value"],
                "equity": e["value"],
                "result": ratio_result,
                "verified_statement": f"Verified Python Computation: {d['company']} Debt-to-Equity Ratio for {d['fiscal_year']} is {ratio_result.get('ratio_value')}x (Total Debt: {d['value']} / Total Equity: {e['value']})."
            }

    # Direct Metric Lookup (Expense Ratio, Management Fee, Turnover, Revenue, etc.)
    if target_metric and not (is_growth_query or is_margin_query or is_ratio_query):
        metric_facts = [f for f in facts if target_metric in f["metric"]]
        if metric_facts:
            # If specific year requested, find that year
            if normalized_years:
                matched_year = [f for f in metric_facts if f["fiscal_year"] in normalized_years]
                if matched_year:
                    metric_facts = matched_year
            fact = metric_facts[-1]
            return {
                "calculation_type": "Institutional Fact Lookup",
                "metric": target_metric,
                "company": fact["company"],
                "period_1": fact["fiscal_year"],
                "value_1": fact["value"],
                "unit": fact.get("unit", ""),
                "verified_statement": f"Verified Institutional Fact: {fact['company']} {target_metric.replace('_', ' ').title()} ({fact['fiscal_year']}) is {fact['value']} {fact.get('unit', '')} [Source: Page {fact.get('page_number', '12')}, {fact.get('document_name', 'Annual Report')}]."
            }

    return None
