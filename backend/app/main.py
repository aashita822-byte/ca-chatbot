from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .core.config import settings
from .api.endpoints import (
    auth_router,
    documents_router,
    chat_router,
    voice_router,
    analytics_router
)

app = FastAPI(
    title="CA Chatbot Platform API",
    description="Production-grade Chartered Accountancy Chatbot with AI-powered learning",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(documents_router)
app.include_router(chat_router)
app.include_router(voice_router)
app.include_router(analytics_router)

@app.get("/")
async def root():
    return {
        "message": "CA Chatbot Platform API",
        "version": "1.0.0",
        "status": "running"
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy"}
