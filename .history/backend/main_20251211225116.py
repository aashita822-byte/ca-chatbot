# backend/main.py
import io
from datetime import datetime, timedelta
from typing import List, Optional, Dict
import re

from fastapi import (
    FastAPI,
    HTTPException,
    Depends,
    UploadFile,
    File,
    Header,
    Form,
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
from typing import Literal

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


class ChatResponse(BaseModel):
    answer: str
    sources: List[dict]


class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str


class ChatRequest(BaseModel):
    message: str
    history: Optional[List[ChatMessage]] = None
    mode: Optional[str] = "qa"  # "qa" | "discussion"


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


def extract_pdf_pages(file_bytes: bytes) -> List[str]:
    """Return a list of raw text per page."""
    reader = PdfReader(io.BytesIO(file_bytes))
    pages: List[str] = []
    for page in reader.pages:
        page_text = page.extract_text() or ""
        pages.append(page_text)
    return pages


def normalize_page_text(text: str) -> str:
    """Clean up page text a bit."""
    # remove extra spaces, keep line breaks
    lines = [re.sub(r"\s+", " ", ln).strip() for ln in text.splitlines()]
    lines = [ln for ln in lines if ln]  # drop empty
    return "\n".join(lines)


def detect_headings_for_page(page_text: str) -> Dict[str, Optional[str]]:
    lines = [ln.strip() for ln in page_text.splitlines() if ln.strip()]
    chapter = None
    topic = None

    for ln in lines:
        lower = ln.lower()
        if chapter is None and (
            lower.startswith("chapter ")
            or lower.startswith("chap. ")
            or lower.startswith("paper ")
            or "paper -" in lower
        ):
            chapter = ln.strip()
            continue

        if topic is None:
            if len(ln) <= 80 and ln.upper() == ln and any(c.isalpha() for c in ln):
                topic = ln.title().strip()

        if chapter and topic:
            break

    return {"chapter": chapter, "topic": topic}


def chunk_text_words(text: str, chunk_size: int = 180, overlap: int = 40) -> List[str]:
    words = text.split()
    chunks: List[str] = []
    start = 0
    n = len(words)
    while start < n:
        end = min(start + chunk_size, n)
        chunk = " ".join(words[start:end])
        if chunk.strip():
            chunks.append(chunk)
        if end == n:
            break
        start = end - overlap
        if start < 0:
            start = 0
    return chunks


def is_basic_ca_question(question: str) -> bool:
    q = question.lower()

    BASIC_CA_KEYWORDS = [
        "ca",
        "chartered accountant",
        "ca final",
        "ca inter",
        "icai",
        "tax",
        "taxation",
        "gst",
        "income tax",
        "audit",
        "accounts",
        "accounting",
        "law",
        "direct tax",
        "indirect tax",
    ]

    return any(keyword in q for keyword in BASIC_CA_KEYWORDS)


async def is_ca_related_question(question: str) -> bool:
    if is_basic_ca_question(question):
        return True

    system = (
        "You are a classifier. Decide if the user question is even loosely "
        "related to Chartered Accountancy in India (ICAI syllabus), accounting, taxation, finance, law, or auditing. "
        "Answer with YES or NO only."
    )

    messages = [
        {"role": "system", "content": system},
        {"role": "user", "content": question},
    ]

    try:
        result = await call_llm(messages)
        return result.strip().upper().startswith("YES")
    except Exception:
        return True


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
    # 0) Gatekeeper: is this a CA question?
    is_ca = await is_ca_related_question(req.message)
    if not is_ca:
        answer = (
            "I’m designed mainly for Indian CA-related topics like accounting, taxation, "
            "law, audit, and CA exams.\n\n"
            "Your question seems a bit outside CA scope. "
            "If you still want help from a CA or exam perspective, "
            "please rephrase the question slightly. 😊"
        )
        return ChatResponse(answer=answer, sources=[])

    # Quick basic-question path: no RAG required
    if is_basic_ca_question(req.message):
        system_prompt = (
            "You are a friendly Indian CA mentor. "
            "Explain the concept clearly in simple terms for a beginner preparing for CA Inter/Final in India. "
            "Use Indian examples where relevant and avoid foreign jurisdiction references."
        )
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": req.message},
        ]
        answer = await call_llm(messages)
        # No external sources for basic conceptual answers (LLM-only)
        return ChatResponse(answer=answer, sources=[{"doc_title": "LLM (no source)", "note": "Conceptual answer generated by the assistant."}])

    # 1) embed query (for RAG)
    query_embedding = await embed_single(req.message)

    # Namespace per course – for now, fixed to CA_FINAL
    namespace = "CA_FINAL"

    # 2) pinecone query
    res = index.query(
        vector=query_embedding,
        top_k=8,
        include_metadata=True,
        namespace=namespace,
    )
    matches = res.get("matches") or []

    if not matches:
        # No relevant context found in index: ask LLM to answer but require it to state 'no direct source'
        system_prompt = (
            "You are a helpful Indian CA tutor. There is no relevant context in the knowledge base "
            "for this question. Answer concisely using your CA knowledge but clearly state that no uploaded source was matched."
        )
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": req.message},
        ]
        answer = await call_llm(messages)
        # Parse will add an LLM marker below; return both
        return ChatResponse(answer=answer, sources=[{"doc_title": "LLM (no source)", "note": "Answer generated without matching uploaded sources."}])

    # 3) build context + structured sources from matches
    context_blocks = []
    sources: List[dict] = []

    # sort by score for better ordering
    matches = sorted(matches, key=lambda m: m.get("score", 0), reverse=True)

    for m in matches:
        meta = m.get("metadata") or {}
        source_file = meta.get("source")
        doc_title = meta.get("doc_title") or source_file
        page_start = meta.get("page_start")
        page_end = meta.get("page_end")
        chapter = meta.get("chapter")
        topic = meta.get("topic")
        chunk_id = meta.get("chunk_id") or m.get("id")

        header_parts = []
        if doc_title:
            header_parts.append(f"Document: {doc_title}")
        if chapter:
            header_parts.append(f"Chapter: {chapter}")
        if topic:
            header_parts.append(f"Topic: {topic}")
        if page_start:
            if page_end and page_end != page_start:
                header_parts.append(f"Pages: {page_start}-{page_end}")
            else:
                header_parts.append(f"Page: {page_start}")

        header = " | ".join(header_parts) if header_parts else "Context chunk"
        text = meta.get("text", "")

        context_blocks.append(f"{header}\n{text}")

        sources.append(
            {
                "id": chunk_id,
                "score": m.get("score"),
                "source": source_file,
                "doc_title": doc_title,
                "page_start": page_start,
                "page_end": page_end,
                "chapter": chapter,
                "topic": topic,
            }
        )

    context_str = "\n\n---\n\n".join(context_blocks)

    # 4) mode-specific system prompt
    if req.mode == "discussion":
        # Discussion mode: enforce strict User A / User B format
        system_prompt = (
            "You are an expert Indian CA tutor for CA Final students. "
            "STRICT OUTPUT FORMAT:\n\n"
            "Provide the answer as a short dialogue between 'User A' and 'User B', alternating lines.\n"
            "Rules:\n"
            "- 4 to 8 lines total, alternating User A / User B.\n"
            "- Each line must be 1-2 short sentences.\n"
            "- Be exam-oriented and factual, using ONLY information present in the Context below.\n"
            "- If the context lacks the answer, include a line saying 'No direct source found' or similar.\n\n"
            "After the dialogue, append a 'Sources Used:' section and list document title, chapter/topic (if available), and page numbers.\n\n"
            f"Context:\n{context_str}"
        )
    else:
        # Q&A mode
        system_prompt = (
            "You are an expert Indian CA tutor for CA Final students. "
            "Provide a structured, exam-oriented answer using ONLY the Context below. "
            "If the exact answer is missing in the context, say you don't know and recommend checking the cited sources.\n\n"
            f"Context:\n{context_str}"
        )

    messages = [{"role": "system", "content": system_prompt}]
    if req.history:
        # convert history ChatMessage objects to dicts
        messages.extend([{"role": h.role, "content": h.content} for h in req.history[-6:]])
    messages.append({"role": "user", "content": req.message})

    # 5) call LLM
    answer = await call_llm(messages)

    # --- Parse 'Sources Used' section from LLM text (if present) and convert to structured sources ---
    parsed_sources: List[dict] = []
    try:
        import re

        m = re.search(r"(?i)Sources Used\\s*:\\s*(.*)$", answer, re.DOTALL)
        sources_text = m.group(1).strip() if m else None

        if sources_text:
            # split into lines and parse
            lines = [ln.strip() for ln in sources_text.splitlines() if ln.strip()]
            for ln in lines:
                if ln.startswith(("-", "•", "*")):
                    ln = ln.lstrip("-•* ").strip()
                parts = [p.strip() for p in ln.split("|") if p.strip()]
                if parts:
                    entry: Dict[str, object] = {}
                    for p in parts:
                        if ":" in p:
                            k, v = p.split(":", 1)
                            key = k.strip().lower().replace(" ", "_")
                            val = v.strip()
                            if key in ("document", "doc", "doc_title", "title"):
                                entry["doc_title"] = val
                            elif key == "chapter":
                                entry["chapter"] = val
                            elif key == "topic":
                                entry["topic"] = val
                            elif key in ("page", "pages"):
                                if "-" in val:
                                    a, b = val.split("-", 1)
                                    entry["page_start"] = int(a.strip()) if a.strip().isdigit() else a.strip()
                                    entry["page_end"] = int(b.strip()) if b.strip().isdigit() else b.strip()
                                else:
                                    entry["page_start"] = int(val) if val.isdigit() else val
                            else:
                                entry[key] = val
                        else:
                            entry.setdefault("note", p)
                    if entry:
                        parsed_sources.append(entry)
                else:
                    parsed_sources.append({"note": ln})
    except Exception:
        parsed_sources = []

    # --- Merge parsed_sources with Pinecone 'sources' (avoid duplicates) ---
    merged_sources = list(sources) if sources else []

    def title_key(s: dict) -> str:
        return str(s.get("doc_title") or s.get("source") or s.get("note") or "")

    for p in parsed_sources:
        p_title = title_key(p)
        dup = False
        for existing in merged_sources:
            if p_title and p_title == title_key(existing):
                # consider page to be extra match check
                if ("page_start" in p and "page_start" in existing and p.get("page_start") == existing.get("page_start")) or (
                    "page_start" not in p and "page_start" not in existing
                ):
                    dup = True
                    break
        if not dup:
            merged_sources.append(p)

    # If still empty, indicate LLM-generated answer with no source
    if not merged_sources:
        merged_sources = [{"doc_title": "LLM (no source provided)", "note": "Assistant generated this answer without citing uploaded sources."}]

    # Return answer and structured sources
    return ChatResponse(answer=answer, sources=merged_sources)

# ---------- Admin: upload PDF ----------
@app.post("/admin/upload_pdf", response_model=UploadResult)
async def upload_pdf(
    file: UploadFile = File(...),
    # optional extra metadata from admin panel (JSON string)
    metadata: Optional[str] = Form(None),
    admin=Depends(get_current_admin),
):
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF allowed")

    # Parse metadata JSON if provided
    doc_meta: Dict[str, Optional[str]] = {}
    if metadata:
        import json

        try:
            doc_meta = json.loads(metadata)
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid metadata JSON")

    # Set some defaults for CA Final if not provided
    # You can pass these from frontend metadata form as well.
    course = doc_meta.get("course") or "CA_FINAL"
    subject = doc_meta.get("subject") or "Unknown Subject"
    doc_type = doc_meta.get("doc_type") or "study_notes"
    title = doc_meta.get("title") or file.filename
    year = doc_meta.get("year")
    version = doc_meta.get("version") or "v1"
    author = doc_meta.get("author") or "Unknown"

    file_bytes = await file.read()

    # --- Extract per-page text and detect headings ---
    raw_pages = extract_pdf_pages(file_bytes)
    pages = [normalize_page_text(p) for p in raw_pages]

    chunks_for_index = []
    chunk_global_index = 0

    for page_num, page_text in enumerate(pages, start=1):
        if not page_text.strip():
            continue

        heading_info = detect_headings_for_page(page_text)
        chapter_guess = heading_info.get("chapter")
        topic_guess = heading_info.get("topic")

        # chunk this page's text
        page_chunks = chunk_text_words(page_text, chunk_size=180, overlap=40)

        for local_idx, chunk_text in enumerate(page_chunks):
            chunk_id = f"{file.filename}_p{page_num}_c{local_idx}"
            chunks_for_index.append(
                {
                    "id": chunk_id,
                    "text": chunk_text,
                    "page_start": page_num,
                    "page_end": page_num,
                    "chapter": chapter_guess,
                    "topic": topic_guess,
                }
            )
            chunk_global_index += 1

    if not chunks_for_index:
        raise HTTPException(status_code=400, detail="No text extracted from PDF")

    # --- Embed in batches & build vectors ---
    batch_size = 16
    vectors = []
    for i in range(0, len(chunks_for_index), batch_size):
        batch = chunks_for_index[i : i + batch_size]
        texts = [c["text"] for c in batch]
        embeddings = await embed_texts(texts)
        for c, emb in zip(batch, embeddings):
            # Build raw meta
            raw_meta = {
                "text": c["text"],
                "source": file.filename,
                "doc_title": title,
                "course": course,
                "subject": subject,
                "doc_type": doc_type,
                "year": year,
                "version": version,
                "page_start": c["page_start"],
                "page_end": c["page_end"],
                "chapter": c["chapter"],
                "topic": c["topic"],
                "chunk_id": c["id"],
                "uploaded_by": admin["email"],
                "uploaded_at": datetime.utcnow().isoformat(),
                "author": author,
            }

            # Sanitize metadata: remove None values and ensure allowed types
            sanitized_meta: Dict[str, object] = {}
            for k, v in raw_meta.items():
                if v is None:
                    # omit None values entirely (Pinecone doesn't accept null)
                    continue
                # allowed primitive types: str, int, float, bool, or list[str]
                if isinstance(v, (str, int, float, bool)):
                    sanitized_meta[k] = v
                elif isinstance(v, list) and all(isinstance(i, str) for i in v):
                    sanitized_meta[k] = v
                else:
                    # fallback: convert to string (safe representation)
                    try:
                        sanitized_meta[k] = str(v)
                    except Exception:
                        # if conversion somehow fails, skip the field
                        continue

            vectors.append(
                {
                    "id": c["id"],
                    "values": emb,
                    "metadata": sanitized_meta,
                }
            )

    # --- Upsert to Pinecone ---
    namespace = course  # e.g. "CA_FINAL"
    try:
        index.upsert(vectors=vectors, namespace=namespace)
    except Exception as e:
        import traceback

        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Pinecone upsert failed: {str(e)}")

    # --- Store doc-level metadata in Mongo ---
    await docs_collection.insert_one(
        {
            "filename": file.filename,
            "title": title,
            "course": course,
            "subject": subject,
            "doc_type": doc_type,
            "year": year,
            "author": author,
            "version": version,
            "uploaded_by": admin["email"],
            "uploaded_at": datetime.utcnow(),
            "chunks": len(chunks_for_index),
            "namespace": namespace,
        }
    )

    return UploadResult(chunks=len(chunks_for_index), filename=file.filename)


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
