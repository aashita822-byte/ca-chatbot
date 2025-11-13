from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class ChatRequest(BaseModel):
    message: str
    mode: str = "qa"
    language: str = "en"
    conversation_id: Optional[str] = None

class DiscussionPart(BaseModel):
    speaker: str
    text: str

class ChatResponse(BaseModel):
    response: str
    mode: str
    conversation_id: str
    timestamp: datetime
    discussion: Optional[List[DiscussionPart]] = None

class VoiceRequest(BaseModel):
    audio_data: str
    mode: str = "qa"
    language: str = "en"

class TTSRequest(BaseModel):
    text: str
    language: str = "en"

class ChatHistory(BaseModel):
    id: str
    user_id: str
    message: str
    bot_response: str
    mode: str
    timestamp: datetime

    class Config:
        from_attributes = True
