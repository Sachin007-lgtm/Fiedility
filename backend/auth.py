import os
import datetime
import sqlite3
import logging
from dotenv import load_dotenv
load_dotenv()

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import bcrypt
import jwt
from motor.motor_asyncio import AsyncIOMotorClient

logger = logging.getLogger(__name__)

router = APIRouter()
SECRET_KEY = os.environ.get("JWT_SECRET", "super-secret-finsight-key-2026")
ALGORITHM = "HS256"

# SQLite local fallback store
DB_FILE = os.path.join(os.path.dirname(__file__), "users.sqlite3")

def init_sqlite_db():
    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()
    c.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            hashed_password TEXT NOT NULL,
            created_at TEXT NOT NULL
        )
    """)
    conn.commit()
    conn.close()

init_sqlite_db()

# MongoDB client (optional with short timeout)
MONGO_URI = os.environ.get("MONGO_URI", "mongodb://localhost:27017")
try:
    mongo_client = AsyncIOMotorClient(MONGO_URI, serverSelectionTimeoutMS=1500)
    mongo_db = mongo_client.finsight_rag
    users_collection = mongo_db.users
except Exception:
    mongo_client = None
    users_collection = None

class UserSignup(BaseModel):
    name: str
    email: str
    password: str

class UserLogin(BaseModel):
    email: str
    password: str

def verify_password(plain_password: str, hashed_password: str):
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))

def get_password_hash(password: str):
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(days=7)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def get_sqlite_user(email: str):
    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()
    c.execute("SELECT name, email, hashed_password FROM users WHERE email = ?", (email.lower().strip(),))
    row = c.fetchone()
    conn.close()
    if row:
        return {"name": row[0], "email": row[1], "hashed_password": row[2]}
    return None

def save_sqlite_user(name: str, email: str, hashed_password: str):
    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()
    c.execute(
        "INSERT INTO users (name, email, hashed_password, created_at) VALUES (?, ?, ?, ?)",
        (name.strip(), email.lower().strip(), hashed_password, datetime.datetime.now(datetime.timezone.utc).isoformat())
    )
    conn.commit()
    conn.close()

@router.post("/signup")
async def signup(user: UserSignup):
    email_clean = user.email.lower().strip()
    
    # Check SQLite first
    if get_sqlite_user(email_clean):
        raise HTTPException(status_code=400, detail="Email already registered")
        
    hashed_password = get_password_hash(user.password)
    
    # Try Mongo in background/safe mode
    try:
        if users_collection is not None:
            await users_collection.insert_one({
                "name": user.name.strip(),
                "email": email_clean,
                "hashed_password": hashed_password,
                "created_at": datetime.datetime.now(datetime.timezone.utc)
            })
    except Exception as e:
        logger.warning(f"MongoDB signup sync skipped: {e}")

    # Always persist locally to SQLite
    try:
        save_sqlite_user(user.name, email_clean, hashed_password)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Registration failed: {e}")

    token = create_access_token({"sub": email_clean, "name": user.name})
    return {"access_token": token, "token_type": "bearer", "name": user.name, "email": email_clean}

@router.post("/login")
async def login(user: UserLogin):
    email_clean = user.email.lower().strip()
    
    # Demo guest login bypass if entered
    if email_clean == "guest@finsight.ai" or email_clean == "analyst@finsight.ai":
        token = create_access_token({"sub": email_clean, "name": "Guest Analyst"})
        return {"access_token": token, "token_type": "bearer", "name": "Guest Analyst", "email": email_clean}

    # First check SQLite
    db_user = get_sqlite_user(email_clean)
    
    # If not in SQLite, try Mongo
    if not db_user and users_collection is not None:
        try:
            mongo_user = await users_collection.find_one({"email": email_clean})
            if mongo_user:
                db_user = {
                    "name": mongo_user["name"],
                    "email": mongo_user["email"],
                    "hashed_password": mongo_user["hashed_password"]
                }
                # cache into sqlite
                try:
                    save_sqlite_user(db_user["name"], db_user["email"], db_user["hashed_password"])
                except Exception:
                    pass
        except Exception as e:
            logger.warning(f"MongoDB query failed: {e}")

    if not db_user or not verify_password(user.password, db_user["hashed_password"]):
        raise HTTPException(status_code=400, detail="Incorrect email or password")

    token = create_access_token({"sub": email_clean, "name": db_user["name"]})
    return {"access_token": token, "token_type": "bearer", "name": db_user["name"], "email": email_clean}
