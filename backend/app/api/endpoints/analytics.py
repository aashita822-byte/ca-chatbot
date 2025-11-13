from fastapi import APIRouter, HTTPException, status, Depends
from typing import List, Dict, Any
from ...services import supabase_service, pinecone_service
from ...core.security import get_current_admin
from datetime import datetime, timedelta

router = APIRouter(prefix="/analytics", tags=["Analytics"])

@router.get("/queries")
async def get_query_analytics(
    limit: int = 100,
    current_user: dict = Depends(get_current_admin)
):
    try:
        analytics = await supabase_service.get_analytics(limit=limit)
        return analytics
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch analytics: {str(e)}"
        )

@router.get("/stats")
async def get_dashboard_stats(
    current_user: dict = Depends(get_current_admin)
):
    try:
        documents = await supabase_service.get_documents(limit=1000)
        chats = await supabase_service.client.table("chats").select("*").execute()
        users = await supabase_service.client.table("users").select("*").execute()
        analytics = await supabase_service.get_analytics(limit=1000)

        total_documents = len(documents)
        total_chats = len(chats.data) if chats.data else 0
        total_users = len(users.data) if users.data else 0

        avg_response_time = 0
        if analytics:
            response_times = [a["response_time"] for a in analytics if a.get("response_time")]
            if response_times:
                avg_response_time = sum(response_times) / len(response_times)

        most_common_queries = {}
        for item in analytics[:50]:
            query = item.get("query", "").lower()
            most_common_queries[query] = most_common_queries.get(query, 0) + 1

        top_queries = sorted(most_common_queries.items(), key=lambda x: x[1], reverse=True)[:10]

        pinecone_stats = await pinecone_service.get_index_stats()

        return {
            "total_documents": total_documents,
            "total_chats": total_chats,
            "total_users": total_users,
            "avg_response_time": round(avg_response_time, 2),
            "top_queries": [{"query": q, "count": c} for q, c in top_queries],
            "vector_db_stats": pinecone_stats
        }

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch dashboard stats: {str(e)}"
        )

@router.get("/users")
async def get_user_stats(
    current_user: dict = Depends(get_current_admin)
):
    try:
        users = await supabase_service.client.table("users").select("*").execute()

        student_count = sum(1 for u in users.data if u.get("role") == "student")
        admin_count = sum(1 for u in users.data if u.get("role") == "admin")

        recent_users = sorted(
            users.data,
            key=lambda x: x.get("created_at", ""),
            reverse=True
        )[:10]

        return {
            "total_users": len(users.data),
            "students": student_count,
            "admins": admin_count,
            "recent_users": recent_users
        }

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch user stats: {str(e)}"
        )
