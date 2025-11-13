from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class DocumentBase(BaseModel):
    title: str
    category: Optional[str] = "general"

class DocumentCreate(DocumentBase):
    content: str

class DocumentResponse(DocumentBase):
    id: str
    size: int
    type: str
    uploaded_at: datetime
    uploaded_by: str

    class Config:
        from_attributes = True

class DocumentUpdate(BaseModel):
    title: Optional[str] = None
    category: Optional[str] = None
    content: Optional[str] = None
