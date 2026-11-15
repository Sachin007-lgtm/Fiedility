"""
Finsight ASGI Root Entrypoint for Render / Cloud Platforms.
Directs ASGI traffic from the repository root directory to backend/main.py.
"""
import sys
import os
import importlib.util

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.join(BASE_DIR, "backend")

# Ensure backend directory is in sys.path
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

backend_main_path = os.path.join(BACKEND_DIR, "main.py")
spec = importlib.util.spec_from_file_location("backend_main_module", backend_main_path)
backend_main = importlib.util.module_from_spec(spec)
sys.modules["backend_main_module"] = backend_main
spec.loader.exec_module(backend_main)

app = backend_main.app

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port)
