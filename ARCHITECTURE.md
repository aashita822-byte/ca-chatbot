# System Architecture - CA Chatbot Platform

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                          CLIENT LAYER                            │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                   React Frontend (Vite)                   │  │
│  │                                                            │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐ │  │
│  │  │   Auth   │  │   Chat   │  │  Admin   │  │  Voice   │ │  │
│  │  │   Pages  │  │    UI    │  │  Panel   │  │ Controls │ │  │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘ │  │
│  │                                                            │  │
│  │  ┌────────────────────────────────────────────────────┐  │  │
│  │  │         Services (API Client Layer)                │  │  │
│  │  │  - apiService.ts      - authService.ts            │  │  │
│  │  │  - geminiService.ts   - vectorDbService.ts        │  │  │
│  │  └────────────────────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────────┬────────────────────────────────────┘
                            │ HTTP/REST (JSON)
                            │ WebSocket (Future)
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│                         API GATEWAY LAYER                        │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              FastAPI Application (main.py)                │  │
│  │                                                            │  │
│  │  - CORS Middleware                                        │  │
│  │  - JWT Authentication                                     │  │
│  │  - Request Validation                                     │  │
│  │  - Error Handling                                         │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────────┬────────────────────────────────────┘
                            │
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│                      API ENDPOINTS LAYER                         │
│                                                                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐       │
│  │   Auth   │  │   Chat   │  │Documents │  │ Analytics│       │
│  │Endpoints │  │Endpoints │  │Endpoints │  │Endpoints │       │
│  └─────┬────┘  └─────┬────┘  └─────┬────┘  └─────┬────┘       │
│        │             │              │              │            │
│  ┌─────┴─────────────┴──────────────┴──────────────┴──────┐   │
│  │                 Voice Endpoints                          │   │
│  └──────────────────────────────────────────────────────────┘   │
└────────────────────────────┬────────────────────────────────────┘
                            │
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│                      BUSINESS LOGIC LAYER                        │
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │   Supabase   │  │    OpenAI    │  │   Pinecone   │         │
│  │   Service    │  │   Service    │  │   Service    │         │
│  │              │  │              │  │              │         │
│  │ - Users      │  │ - Chat       │  │ - Vector     │         │
│  │ - Documents  │  │ - Embeddings │  │   Search     │         │
│  │ - Chats      │  │ - Whisper    │  │ - Upsert     │         │
│  │ - Analytics  │  │ - TTS        │  │ - Delete     │         │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘         │
│         │                 │                  │                  │
│  ┌──────┴─────────────────┴──────────────────┴──────────────┐  │
│  │            Document Processor Service                     │  │
│  │  - PDF Extraction    - DOCX Extraction    - Chunking    │  │
│  └────────────────────────────────────────────────────────────┘  │
└────────────────────────────┬────────────────────────────────────┘
                            │
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│                     EXTERNAL SERVICES LAYER                      │
│                                                                  │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────┐ │
│  │   OpenAI API     │  │  Pinecone API    │  │  Supabase    │ │
│  │                  │  │                  │  │              │ │
│  │ • GPT-4 Turbo    │  │ • Vector Store   │  │ • PostgreSQL │ │
│  │ • Embeddings     │  │ • Similarity     │  │ • Auth       │ │
│  │   (3072-dim)     │  │   Search         │  │ • Storage    │ │
│  │ • Whisper        │  │ • Metadata       │  │ • RLS        │ │
│  │ • TTS            │  │   Filtering      │  │              │ │
│  └──────────────────┘  └──────────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow Diagrams

### 1. User Authentication Flow

```
┌──────────┐
│  User    │
└─────┬────┘
      │ 1. Enter email/password
      ↓
┌──────────────────┐
│   React Form     │
└─────┬────────────┘
      │ 2. Submit credentials
      ↓
┌──────────────────┐
│  Auth Service    │
└─────┬────────────┘
      │ 3. POST /auth/login
      ↓
┌──────────────────┐
│ FastAPI Auth     │
│   Endpoint       │
└─────┬────────────┘
      │ 4. Validate credentials
      ↓
┌──────────────────┐
│ Supabase Service │
└─────┬────────────┘
      │ 5. Query users table
      ↓
┌──────────────────┐
│   Supabase DB    │
└─────┬────────────┘
      │ 6. Return user data
      ↓
┌──────────────────┐
│ Security Service │
└─────┬────────────┘
      │ 7. Generate JWT
      ↓
┌──────────────────┐
│   User + Token   │
│   Returned       │
└──────────────────┘
```

### 2. Chat with RAG Flow

```
┌──────────┐
│  User    │
└─────┬────┘
      │ 1. Type question
      ↓
┌──────────────────┐
│  Chat Interface  │
└─────┬────────────┘
      │ 2. Send message
      ↓
┌──────────────────┐
│  API Service     │
└─────┬────────────┘
      │ 3. POST /chat/
      ↓
┌──────────────────┐
│ Chat Endpoint    │
└─────┬────────────┘
      │ 4. Check CA relevance
      ↓
┌──────────────────┐
│  OpenAI Service  │
└─────┬────────────┘
      │ 5. Generate embedding
      ↓
┌──────────────────┐
│ Pinecone Service │
└─────┬────────────┘
      │ 6. Similarity search
      ↓
┌──────────────────┐
│  Pinecone API    │
└─────┬────────────┘
      │ 7. Return top 5 matches
      ↓
┌──────────────────┐
│  OpenAI Service  │
└─────┬────────────┘
      │ 8. Generate response
      │    (context + query)
      ↓
┌──────────────────┐
│ Supabase Service │
└─────┬────────────┘
      │ 9. Save chat & analytics
      ↓
┌──────────────────┐
│   Response       │
│   Returned       │
└──────────────────┘
```

### 3. Document Upload Flow

```
┌──────────┐
│  Admin   │
└─────┬────┘
      │ 1. Select file
      ↓
┌──────────────────┐
│  Admin Panel     │
└─────┬────────────┘
      │ 2. Add title & category
      ↓
┌──────────────────┐
│  Vector Service  │
└─────┬────────────┘
      │ 3. POST /documents/upload
      ↓
┌──────────────────┐
│ Documents        │
│ Endpoint         │
└─────┬────────────┘
      │ 4. Validate file
      ↓
┌──────────────────┐
│ Document         │
│ Processor        │
└─────┬────────────┘
      │ 5. Extract text
      │    (PDF/DOCX)
      ↓
┌──────────────────┐
│ Document         │
│ Processor        │
└─────┬────────────┘
      │ 6. Chunk text
      │    (1000 chars, 200 overlap)
      ↓
┌──────────────────┐
│  OpenAI Service  │
└─────┬────────────┘
      │ 7. Generate embeddings
      │    (batch request)
      ↓
┌──────────────────┐
│ Supabase Service │
└─────┬────────────┘
      │ 8. Save document metadata
      ↓
┌──────────────────┐
│ Pinecone Service │
└─────┬────────────┘
      │ 9. Upsert vectors
      │    (with metadata)
      ↓
┌──────────────────┐
│   Success        │
│   Response       │
└──────────────────┘
```

### 4. Voice Input Flow

```
┌──────────┐
│  User    │
└─────┬────┘
      │ 1. Click mic, speak
      ↓
┌──────────────────┐
│  Web Speech API  │
└─────┬────────────┘
      │ 2. Real-time transcription
      ↓
┌──────────────────┐
│  Input Panel     │
└─────┬────────────┘
      │ 3. Display transcript
      ↓
┌──────────────────┐
│  Send to Chat    │
│  (Same as text)  │
└──────────────────┘

Alternative (Backend):
┌──────────┐
│  User    │
└─────┬────┘
      │ 1. Record audio
      ↓
┌──────────────────┐
│  Audio Blob      │
└─────┬────────────┘
      │ 2. POST /voice/transcribe
      ↓
┌──────────────────┐
│ Voice Endpoint   │
└─────┬────────────┘
      │ 3. Send to Whisper
      ↓
┌──────────────────┐
│  OpenAI Whisper  │
└─────┬────────────┘
      │ 4. Return transcript
      ↓
┌──────────────────┐
│  Display & Send  │
└──────────────────┘
```

## Component Architecture

### Frontend Components

```
App.tsx
├── Header.tsx
│   ├── Logo
│   ├── Navigation (Admin only)
│   └── User Menu
├── AuthPage.tsx (not logged in)
│   ├── Login.tsx
│   │   └── Form
│   └── Signup.tsx
│       └── Form
└── Main View (logged in)
    ├── ChatInterface.tsx
    │   ├── MessageList
    │   └── LoadingIndicator
    ├── InputPanel.tsx
    │   ├── StyleSelector
    │   ├── VoiceToggle
    │   ├── TextInput
    │   └── SendButton
    └── AdminPage.tsx (admin only)
        ├── DocumentUpload
        │   ├── FileDropzone
        │   ├── TitleInput
        │   └── CategorySelect
        └── DocumentsList
            └── DocumentItem[]
```

### Backend Services

```
FastAPI App
├── Core
│   ├── Config (settings.py)
│   └── Security (jwt, passwords)
├── Schemas (Pydantic models)
│   ├── User
│   ├── Document
│   └── Chat
├── Services
│   ├── SupabaseService
│   │   ├── create_user()
│   │   ├── get_documents()
│   │   ├── save_chat()
│   │   └── log_analytics()
│   ├── OpenAIService
│   │   ├── create_embedding()
│   │   ├── generate_chat_response()
│   │   ├── generate_discussion()
│   │   ├── transcribe_audio()
│   │   └── generate_speech()
│   ├── PineconeService
│   │   ├── upsert_document()
│   │   ├── search_similar()
│   │   └── delete_document()
│   └── DocumentProcessor
│       ├── extract_text_from_pdf()
│       ├── extract_text_from_docx()
│       └── chunk_text()
└── API Endpoints
    ├── auth/
    ├── chat/
    ├── documents/
    ├── voice/
    └── analytics/
```

## Database Schema

```
┌─────────────────────────┐
│         users           │
├─────────────────────────┤
│ id (uuid) PK            │
│ name (text)             │
│ email (text) UNIQUE     │
│ password_hash (text)    │
│ role (text)             │
│ created_at (timestamptz)│
└───────────┬─────────────┘
            │
            │ 1:N
            ↓
┌─────────────────────────┐
│       documents         │
├─────────────────────────┤
│ id (uuid) PK            │
│ title (text)            │
│ content (text)          │
│ category (text)         │
│ size (int)              │
│ type (text)             │
│ uploaded_by (uuid) FK   │─┐
│ uploaded_at (timestamptz)│ │
└─────────────────────────┘ │
                            │
            ┌───────────────┘
            │
            │ 1:N
            ↓
┌─────────────────────────┐
│         chats           │
├─────────────────────────┤
│ id (uuid) PK            │
│ user_id (uuid) FK       │───┐
│ message (text)          │   │
│ bot_response (text)     │   │
│ mode (text)             │   │
│ conversation_id (uuid)  │   │
│ timestamp (timestamptz) │   │
└─────────────────────────┘   │
                              │
            ┌─────────────────┘
            │
┌─────────────────────────┐
│       analytics         │
├─────────────────────────┤
│ id (uuid) PK            │
│ query (text)            │
│ response_time (float)   │
│ feedback (text)         │
│ created_at (timestamptz)│
└─────────────────────────┘
```

## Security Architecture

### Authentication Flow

```
1. User Login
   ↓
2. Verify Credentials (bcrypt)
   ↓
3. Generate JWT Token
   {
     "sub": "user_id",
     "email": "user@email.com",
     "role": "student|admin",
     "exp": timestamp
   }
   ↓
4. Return Token to Client
   ↓
5. Client Stores Token
   ↓
6. Include Token in Requests
   Authorization: Bearer <token>
   ↓
7. Backend Validates Token
   ↓
8. Extract User Info
   ↓
9. Check Permissions
   ↓
10. Process Request
```

### Row Level Security (RLS)

```
Users Table:
- SELECT: Only own profile
- UPDATE: Only own profile
- INSERT: Anon (signup)

Documents Table:
- SELECT: All authenticated users
- INSERT: Admins only
- UPDATE: Admins only
- DELETE: Admins only

Chats Table:
- SELECT: Own chats or admin
- INSERT: Own chats
- DELETE: None

Analytics Table:
- SELECT: Admins only
- INSERT: Authenticated users
```

## Deployment Architecture

### Development

```
┌─────────────┐
│ Developer   │
│ Machine     │
├─────────────┤
│ Frontend    │ ← npm run dev (port 3000)
│ (Vite)      │
├─────────────┤
│ Backend     │ ← python run.py (port 8000)
│ (FastAPI)   │
└─────────────┘
      ↓
┌─────────────┐
│  External   │
│  Services   │
├─────────────┤
│ OpenAI      │
│ Pinecone    │
│ Supabase    │
└─────────────┘
```

### Production (Recommended)

```
┌─────────────────────────────────┐
│         Load Balancer           │
│       (nginx/CloudFlare)        │
└────────────┬────────────────────┘
             │
      ┌──────┴──────┐
      │             │
┌─────↓─────┐ ┌────↓──────┐
│  Frontend  │ │  Backend  │
│   (CDN)    │ │  (Docker) │
│  Vercel/   │ │  AWS ECS/ │
│  Netlify   │ │  Fly.io   │
└────────────┘ └─────┬─────┘
                     │
      ┌──────────────┼──────────────┐
      │              │              │
┌─────↓─────┐ ┌─────↓─────┐ ┌─────↓─────┐
│  OpenAI   │ │ Pinecone  │ │ Supabase  │
│    API    │ │    API    │ │  Postgres │
└───────────┘ └───────────┘ └───────────┘
```

## Performance Considerations

### Caching Strategy

```
┌──────────────┐
│   Request    │
└──────┬───────┘
       │
       ↓
┌──────────────┐
│  Check Redis │
│   Cache      │
└──────┬───────┘
       │
   Cache Hit? ──Yes──→ Return Cached
       │
       No
       ↓
┌──────────────┐
│   Query      │
│   Service    │
└──────┬───────┘
       │
       ↓
┌──────────────┐
│  Store in    │
│   Cache      │
└──────┬───────┘
       │
       ↓
   Return Result
```

### Rate Limiting (Recommended)

```
Endpoint Type     │ Limit
─────────────────┼──────────────
Authentication    │ 10/minute
Chat              │ 20/minute
Document Upload   │ 5/minute
Analytics         │ 30/minute
Voice Processing  │ 15/minute
```

## Monitoring & Observability

```
Application
    ↓
Logging Layer
    ├── Error Logs → Sentry
    ├── Access Logs → CloudWatch
    └── Audit Logs → Database
    ↓
Metrics Layer
    ├── Response Times → DataDog
    ├── API Usage → Mixpanel
    └── System Health → Grafana
    ↓
Alerting Layer
    ├── Error Rate → PagerDuty
    ├── Downtime → Slack
    └── Cost Threshold → Email
```

---

This architecture is designed to be scalable, maintainable, and secure while providing excellent performance for CA students and administrators.
