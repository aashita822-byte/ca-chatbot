# CA Student AI Chatbot Platform

A production-grade, full-stack Chartered Accountancy learning platform with AI-powered chatbot, document management, and analytics dashboard.

## Features

- AI-powered Q&A and Discussion modes for CA topics
- Document management with RAG (Retrieval-Augmented Generation)
- Voice input/output support
- Admin analytics dashboard
- Real-time chat with conversation history
- Bilingual support (English/Hindi)
- Secure authentication and role-based access control

## Tech Stack

**Backend:** FastAPI + Python 3.10+
**Frontend:** React 19 + TypeScript + Vite
**Database:** Supabase (PostgreSQL)
**Vector DB:** Pinecone
**AI Models:** OpenAI GPT-4, text-embedding-3-large, Whisper, TTS

## Quick Start

### Prerequisites
- Node.js 18+
- Python 3.10+
- OpenAI API key
- Pinecone account

### 1. Install Dependencies

**Backend:**
```bash
cd backend
pip install -r requirements.txt
```

**Frontend:**
```bash
npm install
```

### 2. Configure API Keys

Edit `backend/.env`:
```env
OPENAI_API_KEY=your_key_here
PINECONE_API_KEY=your_key_here
PINECONE_ENVIRONMENT=your_env_here
```

### 3. Start Backend
```bash
cd backend
python run.py
```

### 4. Start Frontend
```bash
npm run dev
```

### 5. Access the App

Open http://localhost:3000

**Default admin login:**
- Email: admin@ca.com
- Password: (leave empty)

## Documentation

- **[Quick Start Guide](QUICKSTART.md)** - Get up and running in 5 minutes
- **[Setup Guide](SETUP.md)** - Detailed installation and configuration
- **[Project Summary](PROJECT_SUMMARY.md)** - Architecture and features overview
- **[API Reference](backend/API_REFERENCE.md)** - Complete API documentation
- **[Backend README](backend/README.md)** - Backend-specific details

## Project Structure

```
ca-chatbot-platform/
├── backend/               # FastAPI backend
│   ├── app/
│   │   ├── api/          # API endpoints
│   │   ├── core/         # Config & security
│   │   ├── services/     # Business logic
│   │   └── schemas/      # Data models
│   └── requirements.txt
├── components/           # React components
├── services/            # Frontend services
├── App.tsx              # Main app
└── vite.config.ts       # Vite config
```

## Key Features

### For Students
- Ask CA-related questions
- Get AI-powered explanations
- Hear discussions between AI personas
- Voice input support
- Save chat history

### For Admins
- Upload study documents (PDF, DOC, DOCX)
- Manage knowledge base
- View analytics dashboard
- Monitor user activity
- Track query patterns

## API Endpoints

- `POST /auth/signup` - Create account
- `POST /auth/login` - Login
- `POST /chat/` - Send chat message
- `POST /documents/upload` - Upload document (admin)
- `GET /analytics/stats` - Get dashboard stats (admin)

Full API docs: http://localhost:8000/docs

## Build for Production

```bash
npm run build
```

## License

Educational project for demonstration purposes.
