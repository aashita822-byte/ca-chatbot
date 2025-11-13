from supabase import create_client, Client
from typing import Optional, List, Dict, Any
from datetime import datetime
from ..core.config import settings

class SupabaseService:
    def __init__(self):
        self.client: Client = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)

    async def create_user(self, name: str, email: str, password_hash: str, role: str = "student") -> Dict[str, Any]:
        data = {
            "name": name,
            "email": email,
            "password_hash": password_hash,
            "role": role,
            "created_at": datetime.utcnow().isoformat()
        }
        result = self.client.table("users").insert(data).execute()
        return result.data[0] if result.data else None

    async def get_user_by_email(self, email: str) -> Optional[Dict[str, Any]]:
        result = self.client.table("users").select("*").eq("email", email).maybeSingle().execute()
        return result.data

    async def get_user_by_id(self, user_id: str) -> Optional[Dict[str, Any]]:
        result = self.client.table("users").select("*").eq("id", user_id).maybeSingle().execute()
        return result.data

    async def create_document(self, title: str, content: str, category: str, size: int,
                             file_type: str, uploaded_by: str) -> Dict[str, Any]:
        data = {
            "title": title,
            "content": content,
            "category": category,
            "size": size,
            "type": file_type,
            "uploaded_by": uploaded_by,
            "uploaded_at": datetime.utcnow().isoformat()
        }
        result = self.client.table("documents").insert(data).execute()
        return result.data[0] if result.data else None

    async def get_documents(self, limit: int = 100, offset: int = 0) -> List[Dict[str, Any]]:
        result = self.client.table("documents").select("*").order("uploaded_at", desc=True).limit(limit).offset(offset).execute()
        return result.data

    async def get_document_by_id(self, doc_id: str) -> Optional[Dict[str, Any]]:
        result = self.client.table("documents").select("*").eq("id", doc_id).maybeSingle().execute()
        return result.data

    async def update_document(self, doc_id: str, updates: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        result = self.client.table("documents").update(updates).eq("id", doc_id).execute()
        return result.data[0] if result.data else None

    async def delete_document(self, doc_id: str) -> bool:
        result = self.client.table("documents").delete().eq("id", doc_id).execute()
        return len(result.data) > 0

    async def save_chat(self, user_id: str, message: str, bot_response: str,
                       mode: str, conversation_id: str) -> Dict[str, Any]:
        data = {
            "user_id": user_id,
            "message": message,
            "bot_response": bot_response,
            "mode": mode,
            "conversation_id": conversation_id,
            "timestamp": datetime.utcnow().isoformat()
        }
        result = self.client.table("chats").insert(data).execute()
        return result.data[0] if result.data else None

    async def get_chat_history(self, user_id: str, limit: int = 50) -> List[Dict[str, Any]]:
        result = self.client.table("chats").select("*").eq("user_id", user_id).order("timestamp", desc=True).limit(limit).execute()
        return result.data

    async def get_conversation_history(self, conversation_id: str, limit: int = 20) -> List[Dict[str, Any]]:
        result = self.client.table("chats").select("*").eq("conversation_id", conversation_id).order("timestamp", desc=False).limit(limit).execute()
        return result.data

    async def log_analytics(self, query: str, response_time: float, feedback: Optional[str] = None) -> Dict[str, Any]:
        data = {
            "query": query,
            "response_time": response_time,
            "feedback": feedback,
            "created_at": datetime.utcnow().isoformat()
        }
        result = self.client.table("analytics").insert(data).execute()
        return result.data[0] if result.data else None

    async def get_analytics(self, limit: int = 100) -> List[Dict[str, Any]]:
        result = self.client.table("analytics").select("*").order("created_at", desc=True).limit(limit).execute()
        return result.data

supabase_service = SupabaseService()
