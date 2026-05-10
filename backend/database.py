import os
import chromadb
from chromadb.utils import embedding_functions

CHROMA_DATA_PATH = "./chroma_db"
EMBEDDING_MODEL = "all-MiniLM-L6-v2"

# Setup ChromaDB Client
chroma_client = chromadb.PersistentClient(path=CHROMA_DATA_PATH)

# Setup embedding function
sentence_transformer_ef = embedding_functions.SentenceTransformerEmbeddingFunction(model_name=EMBEDDING_MODEL)

def get_collection():
    return chroma_client.get_or_create_collection(
        name="fund_prospectus",
        embedding_function=sentence_transformer_ef
    )
