"""
Parsers package for financial document ingestion, OCR, and table extraction.
"""
from .table_parser import extract_page_with_tables, table_to_markdown, detect_heuristic_tables

