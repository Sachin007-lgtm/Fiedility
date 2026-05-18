import os
import datetime
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import bcrypt
import jwt
from motor.motor_asyncio import AsyncIOMotorClient

router = APIRouter()
SECRET_KEY = os.environ.get("JWT_SECRET", "super-secret-fidelity-key")
ALGORITHM = "HS256"

MONGO_URI = os.environ.get("MONGO_URI", "mongodb+srv://sachinsingh9971289015_db_user:6MHLjwEeDol1NqKl@cluster0.z2nik9c.mongodb.net/")
client = AsyncIOMotorClient(MONGO_URI)
db = client.fidelity_rag
users_collection = db.users

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
    expire = datetime.datetime.utcnow() + datetime.timedelta(days=7)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

@router.post("/signup")
async def signup(user: UserSignup):
    existing = await users_collection.find_one({"email": user.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_password = get_password_hash(user.password)
    new_user = {
        "name": user.name,
        "email": user.email,
        "hashed_password": hashed_password,
        "created_at": datetime.datetime.utcnow()
    }
    await users_collection.insert_one(new_user)
    
    token = create_access_token({"sub": user.email, "name": user.name})
    return {"access_token": token, "token_type": "bearer", "name": user.name, "email": user.email}

@router.post("/login")
async def login(user: UserLogin):
    db_user = await users_collection.find_one({"email": user.email})
    if not db_user:
        raise HTTPException(status_code=400, detail="Incorrect email or password")
    
    if not verify_password(user.password, db_user["hashed_password"]):
        raise HTTPException(status_code=400, detail="Incorrect email or password")
    
    token = create_access_token({"sub": user.email, "name": db_user["name"]})
    return {"access_token": token, "token_type": "bearer", "name": db_user["name"], "email": user.email}
