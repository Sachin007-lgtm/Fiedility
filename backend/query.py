import os
from database import get_collection
from groq import Groq
from ddgs import DDGS

def retrieve_context(query: str, session_id: str = None, k: int = 5):
    collection = get_collection()
    # Check if collection is empty
    if collection.count() == 0:
        return []

    query_params = {
        "query_texts": [query],
        "n_results": min(k, collection.count())
    }

    if session_id:
        query_params["where"] = {"session_id": session_id}

    results = collection.query(**query_params)
    
    # Format the results
    documents = results["documents"][0] if results["documents"] else []
    metadatas = results["metadatas"][0] if results["metadatas"] else []
    
    context_chunks = []
    for doc, meta in zip(documents, metadatas):
        context_chunks.append({
            "content": doc,
            "fund_name": meta.get("fund_name", "Unknown"),
            "page": meta.get("page", "Unknown")
        })
        
    return context_chunks

def search_web(query: str, max_results: int = 3):
    try:
        ddgs = DDGS(timeout=10)
        results = list(ddgs.text(query, max_results=max_results))
        web_context = []
        for res in results:
            web_context.append({
                "content": res.get('body', ''),
                "title": res.get('title', ''),
                "url": res.get('href', '')
            })
        return web_context
    except Exception as e:
        print(f"Web search error: {e}")
        return []

def generate_response(query: str, session_id: str = None, use_web_search: bool = False):
    groq_api_key = os.getenv("GROQ_API_KEY")
    if not groq_api_key:
        raise ValueError("GROQ_API_KEY not set in environment variables")
        
    client = Groq(api_key=groq_api_key)
    
    # 1. Retrieve internal knowledge (filtered by session if provided)
    context_chunks = retrieve_context(query, session_id=session_id, k=5)
    
    # 2. Optionally retrieve web knowledge via DuckDuckGo
    web_chunks = []
    if use_web_search:
        web_chunks = search_web(query, max_results=3)
        
    # 3. Construct prompt
    context_str = "INTERNAL KNOWLEDGE:\n"
    for i, chunk in enumerate(context_chunks):
        context_str += f"--- Chunk {i+1} (Source: {chunk['fund_name']}, Page: {chunk['page']}) ---\n{chunk['content']}\n\n"
        
    if web_chunks:
        context_str += "WEB KNOWLEDGE:\n"
        for i, chunk in enumerate(web_chunks):
             context_str += f"--- Web Result {i+1} (Source: {chunk['title']}, URL: {chunk['url']}) ---\n{chunk['content']}\n\n"

    system_prompt = (
        "You are a helpful Financial Research Assistant. Answer the user's question based on the provided context.\n"
        "If you use information from the context, clearly cite the source (e.g., [Source: Fund Name, Page: X] or [Web: URL]).\n"
        "If the answer is not in the context, say you don't know.\n\n"
        "CONTEXT:\n" + context_str
    )
    
    response = client.chat.completions.create(
        messages=[
            {
                "role": "system",
                "content": system_prompt,
            },
            {
                "role": "user",
                "content": query,
            }
        ],
        model="llama-3.3-70b-versatile", # Groq's current recommended model
        temperature=0.2,
    )
    
    answer = response.choices[0].message.content
    
    return {
        "answer": answer,
        "citations": {
            "internal": context_chunks,
            "web": web_chunks
        }
    }
