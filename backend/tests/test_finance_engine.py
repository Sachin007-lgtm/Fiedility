"""
Unit tests for Finsight deterministic Finance Math Engine, Facts Database, and Table Parsers.
"""

import pytest
from finance_engine import (
    init_facts_db,
    insert_fact,
    query_facts,
    get_metric_history,
    calculate_percentage_growth,
    calculate_ratio,
    calculate_margin,
    calculate_cagr,
    detect_and_execute_financial_math,
    seed_standard_financial_facts
)
from parsers.table_parser import table_to_markdown, detect_heuristic_tables


def test_calculate_percentage_growth():
    res = calculate_percentage_growth(1000122.0, 1200450.0)
    assert res["percentage_change"] == pytest.approx(20.03, rel=1e-2)
    assert res["direction"] == "increase"
    assert "formula" in res["explanation"].lower()


def test_calculate_ratio():
    res = calculate_ratio(324000.0, 792000.0, "Debt-to-Equity Ratio")
    assert res["ratio_value"] == pytest.approx(0.4091, rel=1e-2)
    assert res["ratio_name"] == "Debt-to-Equity Ratio"


def test_calculate_margin():
    res = calculate_margin(48500.0, 268540.0, "Net Profit Margin")
    assert res["margin_percentage"] == pytest.approx(18.06, rel=1e-2)
    assert "Net Profit Margin" in res["explanation"]


def test_calculate_cagr():
    res = calculate_cagr(100.0, 200.0, 3)
    assert res["cagr_percentage"] == pytest.approx(25.99, rel=1e-2)
    assert res["periods"] == 3


def test_facts_db_crud():
    init_facts_db()
    session = "test_crud_session"
    insert_fact(
        session_id=session,
        company="Reliance Industries",
        fiscal_year="FY2025",
        metric="ebitda",
        value=178000.0,
        unit="Cr",
        currency="INR",
        confidence=1.0
    )

    facts = query_facts(session_id=session, metric="ebitda")
    assert len(facts) >= 1
    assert facts[0]["value"] == 178000.0
    assert facts[0]["company"] == "Reliance Industries"


def test_detect_and_execute_growth():
    session = "test_math_session"
    init_facts_db()
    seed_standard_financial_facts(session)

    res = detect_and_execute_financial_math(
        "What was the revenue growth of Reliance between FY2024 and FY2025?",
        session_id=session
    )
    assert res is not None
    assert res["calculation_type"] == "Growth Analysis"
    assert "20.03%" in res["verified_statement"]
    assert res["company"] == "Reliance Industries"


def test_detect_and_execute_ratio():
    session = "test_math_session"
    init_facts_db()
    seed_standard_financial_facts(session)

    res = detect_and_execute_financial_math(
        "What is the debt to equity ratio of Reliance?",
        session_id=session
    )
    assert res is not None
    assert res["calculation_type"] == "Ratio Analysis"
    assert "0.4091x" in res["verified_statement"]


def test_table_to_markdown():
    headers = ["Particulars", "FY2024", "FY2025"]
    rows = [["Revenue", "1000", "1200"], ["Profit", "300", "350"]]
    md = table_to_markdown(headers, rows)
    assert "| Particulars | FY2024 | FY2025 |" in md
    assert "| Revenue | 1000 | 1200 |" in md


def test_detect_heuristic_tables():
    raw_text = "Particulars   FY2024   FY2025\nRevenue   1000   1200\nExpenses   700   850\nProfit   300   350"
    tables = detect_heuristic_tables(raw_text)
    assert len(tables) >= 1
    assert "| Particulars | FY2024 | FY2025 |" in tables[0]
