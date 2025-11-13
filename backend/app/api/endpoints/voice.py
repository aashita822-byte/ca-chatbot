from fastapi import APIRouter, HTTPException, status, Depends, UploadFile, File
from fastapi.responses import StreamingResponse
from ...schemas import TTSRequest
from ...services import openai_service
from ...core.security import get_current_user
import tempfile
import os
import io

router = APIRouter(prefix="/voice", tags=["Voice"])

@router.post("/transcribe")
async def transcribe_audio(
    audio: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    try:
        allowed_audio_types = [
            "audio/mpeg",
            "audio/mp3",
            "audio/wav",
            "audio/webm",
            "audio/ogg",
            "audio/m4a"
        ]

        if audio.content_type not in allowed_audio_types:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unsupported audio format: {audio.content_type}"
            )

        with tempfile.NamedTemporaryFile(delete=False, suffix=".webm") as temp_file:
            content = await audio.read()
            temp_file.write(content)
            temp_file_path = temp_file.name

        try:
            transcript = await openai_service.transcribe_audio(temp_file_path)
            return {"transcript": transcript}
        finally:
            if os.path.exists(temp_file_path):
                os.unlink(temp_file_path)

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to transcribe audio: {str(e)}"
        )

@router.post("/tts")
async def text_to_speech(
    request: TTSRequest,
    current_user: dict = Depends(get_current_user)
):
    try:
        voice_map = {
            "en": "alloy",
            "hi": "nova"
        }

        voice = voice_map.get(request.language, "alloy")

        audio_content = await openai_service.generate_speech(
            text=request.text,
            voice=voice
        )

        return StreamingResponse(
            io.BytesIO(audio_content),
            media_type="audio/mpeg",
            headers={
                "Content-Disposition": "attachment; filename=speech.mp3"
            }
        )

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate speech: {str(e)}"
        )
