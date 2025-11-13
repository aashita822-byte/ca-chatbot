from openai import OpenAI
from typing import List, Dict, Any, Optional
import base64
from ..core.config import settings

class OpenAIService:
    def __init__(self):
        self.client = OpenAI(api_key=settings.OPENAI_API_KEY)
        self.embedding_model = settings.EMBEDDING_MODEL
        self.chat_model = settings.CHAT_MODEL
        self.tts_model = settings.TTS_MODEL
        self.whisper_model = settings.WHISPER_MODEL

    async def create_embedding(self, text: str) -> List[float]:
        try:
            response = self.client.embeddings.create(
                input=text,
                model=self.embedding_model,
                dimensions=settings.EMBEDDING_DIMENSION
            )
            return response.data[0].embedding
        except Exception as e:
            raise Exception(f"Failed to create embedding: {str(e)}")

    async def create_embeddings_batch(self, texts: List[str]) -> List[List[float]]:
        try:
            response = self.client.embeddings.create(
                input=texts,
                model=self.embedding_model,
                dimensions=settings.EMBEDDING_DIMENSION
            )
            return [item.embedding for item in response.data]
        except Exception as e:
            raise Exception(f"Failed to create batch embeddings: {str(e)}")

    async def generate_chat_response(
        self,
        prompt: str,
        context: str = "",
        system_message: str = None,
        conversation_history: List[Dict[str, str]] = None
    ) -> str:
        try:
            if system_message is None:
                system_message = """You are an expert AI tutor for Chartered Accountancy (CA) students in India.
Your role is to help students understand complex CA concepts, provide detailed explanations, and answer questions
accurately based on the Indian CA curriculum. Be professional, encouraging, and thorough in your responses.
Support both English and Hindi languages when requested."""

            messages = [{"role": "system", "content": system_message}]

            if conversation_history:
                messages.extend(conversation_history[-10:])

            if context:
                user_message = f"Context from knowledge base:\n{context}\n\nUser Question: {prompt}"
            else:
                user_message = prompt

            messages.append({"role": "user", "content": user_message})

            response = self.client.chat.completions.create(
                model=self.chat_model,
                messages=messages,
                temperature=0.7,
                max_tokens=1500
            )

            return response.choices[0].message.content
        except Exception as e:
            raise Exception(f"Failed to generate chat response: {str(e)}")

    async def generate_discussion(self, topic: str, context: str = "") -> List[Dict[str, str]]:
        try:
            system_message = """You are orchestrating a debate between two expert CA professionals:
- Expert CA: A practicing Chartered Accountant with deep theoretical knowledge
- Auditor: An experienced auditor with practical implementation focus

Generate a balanced, insightful discussion exploring different perspectives on the topic.
Each speaker should make 3-4 points. Format the response as a JSON array with objects containing 'speaker' and 'text' fields."""

            prompt = f"Topic: {topic}\n"
            if context:
                prompt += f"\nContext from knowledge base:\n{context}\n"
            prompt += "\nGenerate a constructive debate between Expert CA and Auditor on this topic."

            messages = [
                {"role": "system", "content": system_message},
                {"role": "user", "content": prompt}
            ]

            response = self.client.chat.completions.create(
                model=self.chat_model,
                messages=messages,
                temperature=0.8,
                max_tokens=2000,
                response_format={"type": "json_object"}
            )

            import json
            result = json.loads(response.choices[0].message.content)
            return result.get("discussion", [])
        except Exception as e:
            raise Exception(f"Failed to generate discussion: {str(e)}")

    async def transcribe_audio(self, audio_file_path: str) -> str:
        try:
            with open(audio_file_path, "rb") as audio_file:
                transcript = self.client.audio.transcriptions.create(
                    model=self.whisper_model,
                    file=audio_file
                )
            return transcript.text
        except Exception as e:
            raise Exception(f"Failed to transcribe audio: {str(e)}")

    async def generate_speech(self, text: str, voice: str = "alloy") -> bytes:
        try:
            response = self.client.audio.speech.create(
                model=self.tts_model,
                voice=voice,
                input=text
            )
            return response.content
        except Exception as e:
            raise Exception(f"Failed to generate speech: {str(e)}")

    async def check_ca_relevance(self, query: str) -> bool:
        try:
            system_message = """You are a classifier that determines if a query is related to Chartered Accountancy (CA) topics.
CA topics include: accounting, auditing, taxation, corporate law, financial reporting, IFRS, Indian Accounting Standards,
GST, income tax, company law, ethics, finance, cost accounting, and related subjects.
Respond with only 'true' or 'false'."""

            messages = [
                {"role": "system", "content": system_message},
                {"role": "user", "content": f"Is this query related to CA topics? Query: {query}"}
            ]

            response = self.client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=messages,
                temperature=0.3,
                max_tokens=10
            )

            result = response.choices[0].message.content.strip().lower()
            return result == "true"
        except Exception as e:
            return True

openai_service = OpenAIService()
