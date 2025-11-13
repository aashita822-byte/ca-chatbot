# CA Chatbot Platform - Backend API

Production-grade FastAPI backend for the CA Chatbot Platform with OpenAI integration, Pinecone vector search, and Supabase database.

## Features

- JWT-based authentication
- Document management with automatic embedding generation
- AI-powered Q&A and Discussion modes
- Voice input/output (Whisper & TTS)
- Real-time analytics dashboard
- RAG (Retrieval-Augmented Generation) with Pinecone
- Bilingual support (English/Hindi)

## Setup

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Copy `.env.example` to `.env` and configure:
```bash
cp .env.example .env
```

3. Configure environment variables:
- SUPABASE_URL, SUPABASE_KEY, SUPABASE_SERVICE_ROLE_KEY
- OPENAI_API_KEY
- PINECONE_API_KEY, PINECONE_ENVIRONMENT
- JWT_SECRET_KEY

4. Run the server:
```bash
python run.py
```

API will be available at `http://localhost:8000`

## API Documentation

Interactive API docs: `http://localhost:8000/docs`

## Endpoints

### Authentication
- POST `/auth/signup` - Register new user
- POST `/auth/login` - Login user

### Documents
- POST `/documents/upload` - Upload document (admin only)
- GET `/documents/` - List all documents
- GET `/documents/{id}` - Get document details
- PUT `/documents/{id}` - Update document
- DELETE `/documents/{id}` - Delete document

### Chat
- POST `/chat/` - Send chat message
- GET `/chat/history` - Get user chat history
- GET `/chat/conversation/{id}` - Get specific conversation

### Voice
- POST `/voice/transcribe` - Transcribe audio to text
- POST `/voice/tts` - Convert text to speech

### Analytics
- GET `/analytics/queries` - Get query analytics
- GET `/analytics/stats` - Get dashboard statistics
- GET `/analytics/users` - Get user statistics
