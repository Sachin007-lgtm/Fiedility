"""
Financial Table & Layout Parser.
Extracts structured tables from PDF pages using PyMuPDF find_tables()
and heuristic multi-column layout detection, converting them into pristine
Markdown tables that preserve financial column/row associations.
"""

import re
import logging
from typing import List, Dict, Any, Tuple
import fitz

logger = logging.getLogger(__name__)


def table_to_markdown(headers: List[str], rows: List[List[str]]) -> str:
    """Converts a header list and row list into a standard Markdown table."""
    if not headers and not rows:
        return ""
    
    # If no headers, create generic col headers
    col_count = len(headers) if headers else (len(rows[0]) if rows else 0)
    if col_count == 0:
        return ""
    
    clean_headers = [str(h or f"Col_{i+1}").replace("\n", " ").strip() for i, h in enumerate(headers)] if headers else [f"Col_{i+1}" for i in range(col_count)]
    
    md_lines = []
    # Header row
    md_lines.append("| " + " | ".join(clean_headers) + " |")
    # Separator row
    md_lines.append("| " + " | ".join(["---"] * len(clean_headers)) + " |")
    
    # Data rows
    for r in rows:
        clean_row = []
        for i in range(len(clean_headers)):
            val = str(r[i]).replace("\n", " ").strip() if i < len(r) and r[i] is not None else ""
            clean_row.append(val)
        md_lines.append("| " + " | ".join(clean_row) + " |")
        
    return "\n".join(md_lines)


def detect_heuristic_tables(text: str) -> List[str]:
    """
    Detects financial text lines formatted with whitespace-separated columns
    (e.g., 'Particulars   FY2024   FY2025' or 'Revenue   1,200   1,450')
    and synthesizes markdown tables when visual PDF lines are absent.
    """
    lines = [line.strip() for line in text.split("\n") if line.strip()]
    table_candidates = []
    current_table_lines = []

    for line in lines:
        # Check if line contains 2 or more columns separated by 2+ spaces or tabs
        parts = [p.strip() for p in re.split(r"\s{2,}|\t+", line) if p.strip()]
        # Check if line looks like a financial row (has text followed by numbers/percentages/dates)
        if len(parts) >= 2 and any(re.search(r"\d", p) for p in parts[1:]):
            current_table_lines.append(parts)
        else:
            if len(current_table_lines) >= 2:
                # We have a candidate table of 2+ rows
                headers = current_table_lines[0]
                rows = current_table_lines[1:]
                table_candidates.append(table_to_markdown(headers, rows))
            current_table_lines = []

    if len(current_table_lines) >= 2:
        headers = current_table_lines[0]
        rows = current_table_lines[1:]
        table_candidates.append(table_to_markdown(headers, rows))

    return table_candidates


def extract_page_with_tables(page: fitz.Page) -> Tuple[str, List[Dict[str, Any]]]:
    """
    Extracts text from a page while detecting and preserving financial tables.
    Returns:
        (page_markdown_text, list_of_extracted_tables)
    """
    extracted_tables = []
    markdown_tables = []
    
    # 1. Try PyMuPDF find_tables (border-based & rectangle-based)
    try:
        tabs = page.find_tables()
        if tabs and tabs.tables:
            for i, tab in enumerate(tabs.tables):
                header_names = tab.header.names if tab.header else []
                extracted_data = tab.extract()
                if extracted_data:
                    # If header wasn't separated, use first row
                    if not header_names and len(extracted_data) > 1:
                        header_names = extracted_data[0]
                        data_rows = extracted_data[1:]
                    else:
                        data_rows = extracted_data
                    
                    md = table_to_markdown(header_names, data_rows)
                    if md:
                        markdown_tables.append(md)
                        extracted_tables.append({
                            "type": "pymupdf_table",
                            "index": i,
                            "headers": header_names,
                            "row_count": len(data_rows),
                            "markdown": md
                        })
    except Exception as exc:
        logger.debug(f"PyMuPDF find_tables skipped: {exc}")

    # 2. Extract standard page text
    raw_text = page.get_text("text")

    # 3. If no PyMuPDF visual tables detected, check heuristic tabular layouts
    if not markdown_tables:
        heuristic_mds = detect_heuristic_tables(raw_text)
        for i, h_md in enumerate(heuristic_mds):
            markdown_tables.append(h_md)
            extracted_tables.append({
                "type": "heuristic_table",
                "index": i,
                "markdown": h_md
            })

    # 4. Synthesize final page text with table annotations
    if markdown_tables:
        table_block = "\n\n### Extracted Financial Tables\n" + "\n\n".join(markdown_tables) + "\n\n"
        final_text = raw_text + table_block
    else:
        final_text = raw_text

    return final_text, extracted_tables
