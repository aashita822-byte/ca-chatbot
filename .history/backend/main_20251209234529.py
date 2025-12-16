# backend/main.py
import io
from datetime import datetime, timedelta
from typing import List, Optional

from fastapi import (
    FastAPI,
    HTTPException,
    Depends,
    UploadFile,
    File,
    Header,
)
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from jose import jwt, JWTError
from passlib.context import CryptContext

from motor.motor_asyncio import AsyncIOMotorClient
import httpx
import pinecone
from pypdf import PdfReader

from config import settings

# ---------- FastAPI app & CORS ----------
app = FastAPI(title="CA RAG Chatbot API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_ORIGIN, "*"],  # relax for demo
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------- DB & external clients ----------
from passlib.context import CryptContext

pwd_context = CryptContext(
    schemes=["pbkdf2_sha256"],
    default="pbkdf2_sha256",
    deprecated="auto",
)


mongo_client = AsyncIOMotorClient(settings.MONGO_URI)
db = mongo_client[settings.MONGO_DB]
users_collection = db["users"]
docs_collection = db["documents"]

pinecone_client = pinecone.Pinecone(api_key=settings.PINECONE_API_KEY)
index = pinecone_client.Index(settings.PINECONE_INDEX)

JWT_EXP_MINUTES = 60 * 24


# ---------- Models ----------
class UserCreate(BaseModel):
    email: str
    password: str
    role: str = "student"  # student or admin


class UserLogin(BaseModel):
    email: str
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserOut(BaseModel):
    email: str
    role: str


class ChatRequest(BaseModel):
    message: str
    history: Optional[List[dict]] = []  # [{role, content}]


class ChatResponse(BaseModel):
    answer: str
    sources: List[dict]


class UploadResult(BaseModel):
    chunks: int
    filename: str


# ---------- Utility functions ----------
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=JWT_EXP_MINUTES))
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(
        to_encode, settings.JWT_SECRET, algorithm=settings.JWT_ALGO
    )
    return encoded_jwt


async def get_user_by_email(email: str):
    return await users_collection.find_one({"email": email})


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


async def get_current_user(authorization: str = Header(None)):
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing Authorization header")
    token = authorization.replace("Bearer ", "").strip()
    try:
        payload = jwt.decode(
            token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGO]
        )
        email: str = payload.get("sub")
        if email is None:
            raise HTTPException(status_code=401, detail="Invalid token payload")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

    user = await get_user_by_email(email)
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user


async def get_current_admin(user=Depends(get_current_user)):
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return user


# ---------- Embedding & LLM ----------
async def embed_texts(texts: List[str]) -> List[List[float]]:
    """Call OpenRouter embeddings for list of texts."""
    url = "https://openrouter.ai/api/v1/embeddings"
    headers = {
        "Authorization": f"Bearer {settings.OPENROUTER_API_KEY}",
        "Content-Type": "application/json",
    }
    payload = {"model": settings.EMBEDDING_MODEL, "input": texts}
    async with httpx.AsyncClient(timeout=60) as client:
        resp = await client.post(url, headers=headers, json=payload)
        resp.raise_for_status()
        data = resp.json()
        return [d["embedding"] for d in data["data"]]


async def embed_single(text: str) -> List[float]:
    embs = await embed_texts([text])
    return embs[0]


async def call_llm(messages: List[dict]) -> str:
    url = "https://openrouter.ai/api/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {settings.OPENROUTER_API_KEY}",
        "Content-Type": "application/json",
    }
    payload = {
        "model": settings.LLM_MODEL,
        "messages": messages,
    }
    async with httpx.AsyncClient(timeout=90) as client:
        resp = await client.post(url, headers=headers, json=payload)
        resp.raise_for_status()
        data = resp.json()
        return data["choices"][0]["message"]["content"]


# ---------- Helpers ----------
def chunk_text(text: str, chunk_size: int = 800, overlap: int = 200) -> List[str]:
    words = text.split()
    chunks = []
    start = 0
    while start < len(words):
        end = min(start + chunk_size, len(words))
        chunk = " ".join(words[start:end])
        chunks.append(chunk)
        if end == len(words):
            break
        start += chunk_size - overlap
    return chunks


def extract_pdf_text(file_bytes: bytes) -> str:
    reader = PdfReader(io.BytesIO(file_bytes))
    full_text = ""
    for page in reader.pages:
        page_text = page.extract_text() or ""
        full_text += page_text + "\n"
    return full_text


# ---------- Auth routes ----------
@app.post("/auth/signup", response_model=Token)
async def signup(user: UserCreate):
    existing = await get_user_by_email(user.email)
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    await users_collection.insert_one(
        {
            "email": user.email,
            "password_hash": hash_password(user.password),
            "role": user.role,
            "created_at": datetime.utcnow(),
        }
    )
    token = create_access_token({"sub": user.email})
    return Token(access_token=token)


@app.post("/auth/login", response_model=Token)
async def login(data: UserLogin):
    user = await get_user_by_email(data.email)
    if not user or not verify_password(data.password, user["password_hash"]):
        raise HTTPException(status_code=400, detail="Invalid credentials")
    token = create_access_token({"sub": user["email"]})
    return Token(access_token=token)


@app.get("/auth/me", response_model=UserOut)
async def me(user=Depends(get_current_user)):
    return UserOut(email=user["email"], role=user["role"])


# ---------- Chat (RAG) ----------
@app.post("/chat", response_model=ChatResponse)
async def chat(req: ChatRequest, user=Depends(get_current_user)):
    # 1) embed query
    query_embedding = await embed_single(req.message)

    # 2) pinecone query
    res = index.query(
        vector=query_embedding,
        top_k=5,
        include_metadata=True,
    )

    contexts = []
    sources = []
    for match in res["matches"]:
        meta = match["metadata"]
        contexts.append(meta.get("text", ""))
        sources.append(
            {
                "id": match["id"],
                "score": match.get("score"),
                "source": meta.get("source"),
            }
        )

    context_str = "\n\n---\n\n".join(contexts) if contexts else "No relevant context."

    system_prompt = (
        "You are a helpful tutor for Indian CA students. "
        "Use ONLY the context from CA material below. "
        "If the answer is not present, say you don't know.\n\n"
        f"Context:\n{context_str}"
    )

    messages = [
        {"role": "system", "content": system_prompt},
    ]
    if req.history:
        messages.extend(req.history[-6:])  # keep last few turns
    messages.append({"role": "user", "content": req.message})

    answer = await call_llm(messages)
    return ChatResponse(answer=answer, sources=sources)


# ---------- Admin: upload PDF ----------
@app.post("/admin/upload_pdf", response_model=UploadResult)
async def upload_pdf(
    file: UploadFile = File(...),
    admin=Depends(get_current_admin),
):
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF allowed")

    file_bytes = await file.read()
    text = extract_pdf_text(file_bytes)
    chunks = chunk_text(text)

    if not chunks:
        raise HTTPException(status_code=400, detail="No text extracted from PDF")

    # Embed in batches (avoid too long payload)
    batch_size = 16
    vectors = []
    for i in range(0, len(chunks), batch_size):
        batch_texts = chunks[i : i + batch_size]
        embeddings = await embed_texts(batch_texts)
        for j, (chunk, emb) in enumerate(zip(batch_texts, embeddings)):
            vec_id = f"{file.filename}_{i+j}"
            vectors.append(
                {
                    "id": vec_id,
                    "values": emb,
                    "metadata": {
                        "text": chunk,
                        "source": file.filename,
                        "uploaded_by": admin["email"],
                        "uploaded_at": datetime.utcnow().isoformat(),
                    },
                }
            )

    index.upsert(vectors=vectors)

    # Save doc metadata in Mongo
    await docs_collection.insert_one(
        {
            "filename": file.filename,
            "uploaded_by": admin["email"],
            "uploaded_at": datetime.utcnow(),
            "chunks": len(chunks),
        }
    )

    return UploadResult(chunks=len(chunks), filename=file.filename)


@app.get("/admin/documents")
async def list_documents(admin=Depends(get_current_admin)):
    docs_cursor = docs_collection.find().sort("uploaded_at", -1)
    docs = []
    async for d in docs_cursor:
        d["_id"] = str(d["_id"])
        docs.append(d)
    return docs


@app.get("/health")
async def health():
    return {"status": "ok"}
