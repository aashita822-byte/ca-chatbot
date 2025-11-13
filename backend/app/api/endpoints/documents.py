from fastapi import APIRouter, HTTPException, status, Depends, UploadFile, File, Form
from typing import List, Optional
from ...schemas import DocumentResponse, DocumentUpdate
from ...services import supabase_service, openai_service, pinecone_service, document_processor
from ...core.security import get_current_admin
import uuid

router = APIRouter(prefix="/documents", tags=["Documents"])

@router.post("/upload", response_model=DocumentResponse)
async def upload_document(
    file: UploadFile = File(...),
    title: str = Form(...),
    category: str = Form("general"),
    current_user: dict = Depends(get_current_admin)
):
    allowed_types = [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "text/plain"
    ]

    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file type. Please upload PDF, DOC, DOCX, or TXT files."
        )

    if file.size and file.size > 10 * 1024 * 1024:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File size exceeds 10MB limit"
        )

    try:
        file_content = await file.read()
        full_text, chunks = document_processor.process_file(file_content, file.filename)

        if not full_text:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Could not extract text from the document"
            )

        document = await supabase_service.create_document(
            title=title,
            content=full_text,
            category=category,
            size=len(file_content),
            file_type=file.content_type,
            uploaded_by=current_user["sub"]
        )

        if not document:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to save document"
            )

        embeddings = await openai_service.create_embeddings_batch(chunks)

        metadata = {
            "doc_id": document["id"],
            "title": title,
            "category": category
        }

        await pinecone_service.upsert_document(
            doc_id=document["id"],
            chunks=chunks,
            embeddings=embeddings,
            metadata=metadata
        )

        return DocumentResponse(**document)

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process document: {str(e)}"
        )

@router.get("/", response_model=List[DocumentResponse])
async def get_documents(
    limit: int = 100,
    offset: int = 0,
    current_user: dict = Depends(get_current_admin)
):
    try:
        documents = await supabase_service.get_documents(limit=limit, offset=offset)
        return [DocumentResponse(**doc) for doc in documents]
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch documents: {str(e)}"
        )

@router.get("/{doc_id}", response_model=DocumentResponse)
async def get_document(
    doc_id: str,
    current_user: dict = Depends(get_current_admin)
):
    document = await supabase_service.get_document_by_id(doc_id)
    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found"
        )
    return DocumentResponse(**document)

@router.put("/{doc_id}", response_model=DocumentResponse)
async def update_document(
    doc_id: str,
    updates: DocumentUpdate,
    current_user: dict = Depends(get_current_admin)
):
    document = await supabase_service.get_document_by_id(doc_id)
    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found"
        )

    update_data = updates.dict(exclude_unset=True)
    updated_doc = await supabase_service.update_document(doc_id, update_data)

    if not updated_doc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update document"
        )

    return DocumentResponse(**updated_doc)

@router.delete("/{doc_id}")
async def delete_document(
    doc_id: str,
    current_user: dict = Depends(get_current_admin)
):
    document = await supabase_service.get_document_by_id(doc_id)
    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found"
        )

    await pinecone_service.delete_document(doc_id)

    success = await supabase_service.delete_document(doc_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete document"
        )

    return {"message": "Document deleted successfully"}
