from fastapi import APIRouter, HTTPException, status, Depends
from typing import List
import uuid
import time
from ...schemas import ChatRequest, ChatResponse, ChatHistory, DiscussionPart
from ...services import supabase_service, openai_service, pinecone_service
from ...core.security import get_current_user

router = APIRouter(prefix="/chat", tags=["Chat"])

@router.post("/", response_model=ChatResponse)
async def chat(
    request: ChatRequest,
    current_user: dict = Depends(get_current_user)
):
    start_time = time.time()

    try:
        is_relevant = await openai_service.check_ca_relevance(request.message)

        if not is_relevant:
            response_text = "I specialize in topics related to Chartered Accountancy. Please ask a question about accounting, tax, audit, or other CA subjects."
            conversation_id = request.conversation_id or str(uuid.uuid4())

            await supabase_service.save_chat(
                user_id=current_user["sub"],
                message=request.message,
                bot_response=response_text,
                mode=request.mode,
                conversation_id=conversation_id
            )

            response_time = time.time() - start_time
            await supabase_service.log_analytics(
                query=request.message,
                response_time=response_time
            )

            return ChatResponse(
                response=response_text,
                mode=request.mode,
                conversation_id=conversation_id,
                timestamp=time.time()
            )

        query_embedding = await openai_service.create_embedding(request.message)

        similar_docs = await pinecone_service.search_similar(
            query_embedding=query_embedding,
            top_k=5
        )

        context = "\n\n".join([doc["text"] for doc in similar_docs if doc["score"] > 0.7])

        conversation_history = []
        if request.conversation_id:
            history = await supabase_service.get_conversation_history(
                conversation_id=request.conversation_id,
                limit=10
            )
            for item in history:
                conversation_history.append({"role": "user", "content": item["message"]})
                conversation_history.append({"role": "assistant", "content": item["bot_response"]})

        conversation_id = request.conversation_id or str(uuid.uuid4())

        if request.mode == "discussion":
            discussion = await openai_service.generate_discussion(
                topic=request.message,
                context=context
            )

            discussion_text = "\n\n".join([
                f"{item['speaker']}: {item['text']}" for item in discussion
            ])

            await supabase_service.save_chat(
                user_id=current_user["sub"],
                message=request.message,
                bot_response=discussion_text,
                mode=request.mode,
                conversation_id=conversation_id
            )

            response_time = time.time() - start_time
            await supabase_service.log_analytics(
                query=request.message,
                response_time=response_time
            )

            return ChatResponse(
                response=discussion_text,
                mode=request.mode,
                conversation_id=conversation_id,
                timestamp=time.time(),
                discussion=[DiscussionPart(**item) for item in discussion]
            )

        else:
            response_text = await openai_service.generate_chat_response(
                prompt=request.message,
                context=context,
                conversation_history=conversation_history
            )

            await supabase_service.save_chat(
                user_id=current_user["sub"],
                message=request.message,
                bot_response=response_text,
                mode=request.mode,
                conversation_id=conversation_id
            )

            response_time = time.time() - start_time
            await supabase_service.log_analytics(
                query=request.message,
                response_time=response_time
            )

            return ChatResponse(
                response=response_text,
                mode=request.mode,
                conversation_id=conversation_id,
                timestamp=time.time()
            )

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate response: {str(e)}"
        )

@router.get("/history", response_model=List[ChatHistory])
async def get_chat_history(
    limit: int = 50,
    current_user: dict = Depends(get_current_user)
):
    try:
        history = await supabase_service.get_chat_history(
            user_id=current_user["sub"],
            limit=limit
        )
        return [ChatHistory(**item) for item in history]
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch chat history: {str(e)}"
        )

@router.get("/conversation/{conversation_id}", response_model=List[ChatHistory])
async def get_conversation(
    conversation_id: str,
    current_user: dict = Depends(get_current_user)
):
    try:
        history = await supabase_service.get_conversation_history(
            conversation_id=conversation_id,
            limit=100
        )
        return [ChatHistory(**item) for item in history]
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch conversation: {str(e)}"
        )
