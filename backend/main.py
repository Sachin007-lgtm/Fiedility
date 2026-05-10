from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import shutil
import os

from ingest import process_and_ingest_pdf
from query import generate_response
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="Fund Research Assistant API")

# Setup CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, set to specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class QueryRequest(BaseModel):
    query: str
    session_id: str = None
    use_web_search: bool = False

@app.post("/upload")
async def upload_pdf(
    file: UploadFile = File(...), 
    fund_name: str = Form(...),
    session_id: str = Form(None)
):
    if not file.filename.endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are allowed")
        
    os.makedirs("temp_uploads", exist_ok=True)
    file_path = f"temp_uploads/{file.filename}"
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    try:
        result = process_and_ingest_pdf(file_path, fund_name, session_id=session_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if os.path.exists(file_path):
            os.remove(file_path)
            
    return {"message": f"Successfully ingested {file.filename}", "details": result}

@app.post("/query")
async def query_assistant(request: QueryRequest):
    try:
        response = generate_response(
            query=request.query, 
            session_id=request.session_id, 
            use_web_search=request.use_web_search
        )
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
