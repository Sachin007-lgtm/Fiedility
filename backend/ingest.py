import fitz # PyMuPDF
import re
from database import get_collection

def extract_text_from_pdf(file_path: str):
    doc = fitz.open(file_path)
    pages_data = []
    for page_num, page in enumerate(doc):
        text = page.get_text("text")
        if text.strip():
            pages_data.append({"page_num": page_num + 1, "text": text})
    return pages_data

def chunk_text(text: str, chunk_size=512, overlap=64):
    # Approximation using words.
    words = re.split(r'\s+', text)
    chunks = []
    i = 0
    while i < len(words):
        chunk_words = words[i:i + chunk_size]
        chunks.append(" ".join(chunk_words))
        i += (chunk_size - overlap)
        if i >= len(words):
            break
    return chunks

def process_and_ingest_pdf(file_path: str, fund_name: str, session_id: str = None):
    collection = get_collection()
    pages_data = extract_text_from_pdf(file_path)
    
    docs = []
    metadatas = []
    ids = []
    
    chunk_id = 0
    for page in pages_data:
        chunks = chunk_text(page["text"], chunk_size=512, overlap=64)
        for chunk in chunks:
            docs.append(chunk)
            meta = {
                "fund_name": fund_name,
                "page": page["page_num"],
            }
            if session_id:
                meta["session_id"] = session_id
                
            metadatas.append(meta)
            ids.append(f"{fund_name}_{session_id or 'global'}_p{page['page_num']}_c{chunk_id}")
            chunk_id += 1
            
    if docs:
        collection.add(
            documents=docs,
            metadatas=metadatas,
            ids=ids
        )
    return {"status": "success", "chunks_added": len(docs)}
