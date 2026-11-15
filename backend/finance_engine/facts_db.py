"""
Structured Financial Facts Database — SQLite-backed repository of audited financial metrics.
Allows exact numerical querying, historical comparisons, and ratio analysis via Python/SQL
without relying on LLM guesswork.
"""

import sqlite3
import logging
from pathlib import Path
from typing import Optional, List, Dict, Any

logger = logging.getLogger(__name__)

DB_PATH = Path(__file__).resolve().parent.parent / "financial_facts.sqlite3"


def get_db_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    return conn


def init_facts_db():
    """Initializes the structured financial facts schema."""
    with get_db_connection() as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS financial_facts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                session_id TEXT NOT NULL,
                company TEXT NOT NULL,
                fiscal_year TEXT NOT NULL,
                metric TEXT NOT NULL,
                value REAL NOT NULL,
                unit TEXT DEFAULT '',
                currency TEXT DEFAULT 'USD',
                is_consolidated BOOLEAN DEFAULT 1,
                document_name TEXT,
                page_number INTEGER,
                source_snippet TEXT,
                confidence REAL DEFAULT 1.0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        conn.execute("CREATE INDEX IF NOT EXISTS idx_company_metric ON financial_facts(company, metric)")
        conn.execute("CREATE INDEX IF NOT EXISTS idx_session_company ON financial_facts(session_id, company)")
        conn.commit()
        logger.info(f"Initialized financial facts database at {DB_PATH}")


def insert_fact(
    session_id: str,
    company: str,
    fiscal_year: str,
    metric: str,
    value: float,
    unit: str = "",
    currency: str = "USD",
    is_consolidated: bool = True,
    document_name: str = "",
    page_number: int = 1,
    source_snippet: str = "",
    confidence: float = 1.0
) -> int:
    """Inserts or updates a verified financial fact."""
    clean_metric = metric.lower().strip().replace(" ", "_")
    with get_db_connection() as conn:
        cursor = conn.execute("""
            INSERT INTO financial_facts 
            (session_id, company, fiscal_year, metric, value, unit, currency, is_consolidated, document_name, page_number, source_snippet, confidence)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (session_id, company.strip(), fiscal_year.strip().upper(), clean_metric, float(value), unit, currency, int(is_consolidated), document_name, page_number, source_snippet, confidence))
        conn.commit()
        return cursor.lastrowid


def query_facts(
    company: Optional[str] = None,
    metric: Optional[str] = None,
    fiscal_year: Optional[str] = None,
    session_id: Optional[str] = None
) -> List[Dict[str, Any]]:
    """Retrieves structured financial facts with optional filters."""
    query = "SELECT * FROM financial_facts WHERE 1=1"
    params = []

    if company:
        query += " AND company LIKE ?"
        params.append(f"%{company}%")
    if metric:
        clean_metric = metric.lower().strip().replace(" ", "_")
        query += " AND metric LIKE ?"
        params.append(f"%{clean_metric}%")
    if fiscal_year:
        query += " AND fiscal_year = ?"
        params.append(fiscal_year.strip().upper())
    if session_id:
        query += " AND session_id = ?"
        params.append(session_id)

    query += " ORDER BY fiscal_year ASC, metric ASC"

    with get_db_connection() as conn:
        rows = conn.execute(query, params).fetchall()
        return [dict(r) for r in rows]


def get_metric_history(company: str, metric: str) -> List[Dict[str, Any]]:
    """Returns chronological values for a company metric to compute growth/trends."""
    clean_metric = metric.lower().strip().replace(" ", "_")
    with get_db_connection() as conn:
        rows = conn.execute("""
            SELECT fiscal_year, value, unit, currency, page_number, source_snippet
            FROM financial_facts
            WHERE company LIKE ? AND metric = ?
            ORDER BY fiscal_year ASC
        """, (f"%{company}%", clean_metric)).fetchall()
        return [dict(r) for r in rows]


# Initialize on import
init_facts_db()
