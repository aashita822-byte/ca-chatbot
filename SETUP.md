# CA Chatbot Platform - Complete Setup Guide

A production-grade Chartered Accountancy chatbot platform with FastAPI backend, React frontend, OpenAI integration, Pinecone vector search, and Supabase database.

## Architecture Overview

### Backend (FastAPI)
- RESTful API with JWT authentication
- OpenAI GPT-4 for chat responses
- OpenAI text-embedding-3-large for document embeddings (3072 dimensions)
- Pinecone for vector similarity search
- Supabase PostgreSQL for user data, documents, chats, and analytics
- OpenAI Whisper for speech-to-text
- OpenAI TTS for text-to-speech

### Frontend (React + TypeScript)
- Modern React with TypeScript
- Tailwind CSS for styling
- Web Speech API for voice input
- Real-time chat interface
- Admin panel for document management
- Analytics dashboard

## Prerequisites

1. Node.js 18+ and npm
2. Python 3.10+
3. OpenAI API key
4. Pinecone account and API key
5. Supabase project (already configured)

## Backend Setup

### 1. Navigate to backend directory
```bash
cd backend
```

### 2. Install Python dependencies
```bash
pip install -r requirements.txt
```

### 3. Configure environment variables

The `.env` file is already created. You need to update these keys:

```env
OPENAI_API_KEY=your_openai_api_key_here
PINECONE_API_KEY=your_pinecone_api_key_here
PINECONE_ENVIRONMENT=your_pinecone_environment
```

#### Getting OpenAI API Key:
1. Go to https://platform.openai.com/
2. Sign up or log in
3. Navigate to API Keys section
4. Create a new secret key
5. Copy and paste into `.env`

#### Getting Pinecone API Key:
1. Go to https://www.pinecone.io/
2. Sign up for a free account
3. Create a new index named `ca-chatbot-embeddings`
4. Set dimension to 3072
5. Set metric to cosine
6. Copy API key and environment from dashboard
7. Paste into `.env`

### 4. Run the backend server
```bash
python run.py
```

The API will be available at `http://localhost:8000`

API documentation: `http://localhost:8000/docs`

## Frontend Setup

### 1. Navigate to project root
```bash
cd ..
```

### 2. Install dependencies (if not already done)
```bash
npm install
```

### 3. Environment variables

The `.env` file is already configured. Verify it contains:
```env
VITE_API_URL=http://localhost:8000
```

### 4. Run the development server
```bash
npm run dev
```

The app will be available at `http://localhost:3000`

## Database Schema

The database is already set up with these tables:

### users
- id (uuid, primary key)
- name (text)
- email (text, unique)
- password_hash (text, nullable)
- role (student/admin)
- created_at (timestamp)

### documents
- id (uuid, primary key)
- title (text)
- content (text)
- category (text)
- size (integer)
- type (text)
- uploaded_by (uuid, foreign key)
- uploaded_at (timestamp)

### chats
- id (uuid, primary key)
- user_id (uuid, foreign key)
- message (text)
- bot_response (text)
- mode (qa/discussion)
- conversation_id (uuid)
- timestamp (timestamp)

### analytics
- id (uuid, primary key)
- query (text)
- response_time (float)
- feedback (text, nullable)
- created_at (timestamp)

## Default Accounts

### Admin Account
- Email: admin@ca.com
- Password: (No password required in current setup)
- Role: admin

You can create new accounts through the signup page.

## Features

### For Students
1. Text and voice chat with AI tutor
2. Two modes:
   - Q&A Mode: Direct answers to questions
   - Discussion Mode: Debate between two AI personas
3. Context-aware responses using RAG
4. Chat history preservation
5. Bilingual support (English/Hindi)

### For Admins
1. Upload PDF, DOC, DOCX documents
2. Automatic text extraction and chunking
3. Automatic embedding generation and vector storage
4. Document management (view, delete)
5. Analytics dashboard:
   - Total users, documents, chats
   - Average response time
   - Top queries
   - Vector database statistics

## API Endpoints

### Authentication
- POST `/auth/signup` - Create new account
- POST `/auth/login` - Login

### Chat
- POST `/chat/` - Send message
- GET `/chat/history` - Get chat history
- GET `/chat/conversation/{id}` - Get specific conversation

### Documents (Admin Only)
- POST `/documents/upload` - Upload document
- GET `/documents/` - List all documents
- GET `/documents/{id}` - Get document details
- PUT `/documents/{id}` - Update document
- DELETE `/documents/{id}` - Delete document

### Voice
- POST `/voice/transcribe` - Transcribe audio
- POST `/voice/tts` - Generate speech

### Analytics (Admin Only)
- GET `/analytics/queries` - Query analytics
- GET `/analytics/stats` - Dashboard statistics
- GET `/analytics/users` - User statistics

## How It Works

### Document Upload Flow
1. Admin uploads PDF/DOC/DOCX file
2. Backend extracts text using PyPDF2/python-docx
3. Text is split into chunks (~1000 chars with 200 char overlap)
4. Each chunk is converted to 3072-dim embedding via OpenAI
5. Embeddings are stored in Pinecone with metadata
6. Document metadata is stored in Supabase

### Chat Flow
1. User sends a query
2. Backend checks if query is CA-related
3. Query is converted to embedding
4. Similar chunks are retrieved from Pinecone (top 5)
5. Chunks with score > 0.7 are used as context
6. OpenAI GPT-4 generates response with context
7. Response is saved to database
8. Analytics are logged

### Discussion Mode
1. User provides a topic
2. Backend retrieves relevant context
3. OpenAI generates a structured debate between two personas
4. Discussion is formatted and returned to frontend
5. Text-to-speech plays each speaker sequentially

## Troubleshooting

### Backend won't start
- Check Python version: `python --version` (should be 3.10+)
- Verify all dependencies are installed: `pip list`
- Check `.env` file has all required variables
- Ensure Supabase connection is working

### Frontend won't connect to backend
- Verify backend is running on port 8000
- Check `VITE_API_URL` in `.env`
- Check browser console for CORS errors
- Ensure no firewall is blocking port 8000

### Pinecone errors
- Verify API key is correct
- Ensure index exists with correct dimensions (3072)
- Check environment matches your Pinecone dashboard
- Verify index name is `ca-chatbot-embeddings`

### OpenAI API errors
- Verify API key is valid
- Check account has credits
- Ensure models (gpt-4-turbo-preview, text-embedding-3-large) are accessible
- Monitor rate limits

### Document upload fails
- Check file size (max 10MB)
- Verify file type (PDF, DOC, DOCX only)
- Ensure you're logged in as admin
- Check backend logs for detailed errors

## Security Notes

1. Change `JWT_SECRET_KEY` in production
2. Use HTTPS in production
3. Implement proper password hashing (bcrypt)
4. Add rate limiting
5. Validate all file uploads
6. Use environment-specific CORS settings
7. Store API keys securely (never commit to git)

## Production Deployment

### Backend
1. Use production WSGI server (gunicorn/uvicorn)
2. Set up reverse proxy (nginx)
3. Use production database
4. Enable HTTPS
5. Configure proper CORS
6. Set up logging and monitoring
7. Use environment variables for secrets

### Frontend
1. Build production bundle: `npm run build`
2. Serve from CDN or static hosting
3. Update `VITE_API_URL` to production backend
4. Enable HTTPS
5. Configure CSP headers

## Cost Estimation

### OpenAI API (per 1000 requests)
- GPT-4 Turbo: ~$0.01-0.03 per request
- Embeddings: ~$0.13 per 1M tokens
- Whisper: ~$0.006 per minute
- TTS: ~$0.015 per 1K characters

### Pinecone
- Free tier: 1 index, 100K vectors
- Paid: Starting at $70/month

### Supabase
- Free tier: 500MB database, 2GB bandwidth
- Paid: Starting at $25/month

## Support

For issues or questions:
1. Check the API documentation at `/docs`
2. Review backend logs
3. Check browser console for frontend errors
4. Verify all API keys are valid
5. Ensure all services are running

## License

This project is for educational purposes.
