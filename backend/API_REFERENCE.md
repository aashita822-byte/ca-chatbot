# CA Chatbot Platform - API Reference

Complete API documentation for the CA Chatbot Platform backend.

Base URL: `http://localhost:8000`

## Authentication

All authenticated endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <token>
```

## Response Formats

### Success Response
```json
{
  "data": { ... }
}
```

### Error Response
```json
{
  "detail": "Error message"
}
```

---

## Authentication Endpoints

### POST /auth/signup

Create a new user account.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "optional",
  "role": "student"
}
```

**Response:** 200 OK
```json
{
  "access_token": "eyJhbGc...",
  "token_type": "bearer",
  "user": {
    "id": "uuid",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "student",
    "created_at": "2024-01-01T00:00:00Z"
  }
}
```

**Errors:**
- 400: Email already exists

---

### POST /auth/login

Login to existing account.

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "optional"
}
```

**Response:** 200 OK
```json
{
  "access_token": "eyJhbGc...",
  "token_type": "bearer",
  "user": {
    "id": "uuid",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "student",
    "created_at": "2024-01-01T00:00:00Z"
  }
}
```

**Errors:**
- 401: User not found or incorrect password

---

## Chat Endpoints

### POST /chat/

Send a chat message and get AI response.

**Authentication:** Required

**Request Body:**
```json
{
  "message": "What is GST?",
  "mode": "qa",
  "language": "en",
  "conversation_id": "uuid (optional)"
}
```

**Parameters:**
- `message` (required): User's question or topic
- `mode` (required): Either "qa" or "discussion"
- `language` (optional): "en" or "hi", default "en"
- `conversation_id` (optional): UUID to continue conversation

**Response (Q&A Mode):** 200 OK
```json
{
  "response": "GST (Goods and Services Tax) is...",
  "mode": "qa",
  "conversation_id": "uuid",
  "timestamp": "2024-01-01T00:00:00Z"
}
```

**Response (Discussion Mode):** 200 OK
```json
{
  "response": "Expert CA: ... Auditor: ...",
  "mode": "discussion",
  "conversation_id": "uuid",
  "timestamp": "2024-01-01T00:00:00Z",
  "discussion": [
    {
      "speaker": "Expert CA",
      "text": "First point..."
    },
    {
      "speaker": "Auditor",
      "text": "Counterpoint..."
    }
  ]
}
```

**Errors:**
- 401: Unauthorized
- 500: AI service error

---

### GET /chat/history

Get user's chat history.

**Authentication:** Required

**Query Parameters:**
- `limit` (optional): Number of messages, default 50

**Response:** 200 OK
```json
[
  {
    "id": "uuid",
    "user_id": "uuid",
    "message": "What is GST?",
    "bot_response": "GST is...",
    "mode": "qa",
    "timestamp": "2024-01-01T00:00:00Z"
  }
]
```

---

### GET /chat/conversation/{conversation_id}

Get all messages in a specific conversation.

**Authentication:** Required

**Path Parameters:**
- `conversation_id`: UUID of the conversation

**Response:** 200 OK
```json
[
  {
    "id": "uuid",
    "user_id": "uuid",
    "message": "What is GST?",
    "bot_response": "GST is...",
    "mode": "qa",
    "timestamp": "2024-01-01T00:00:00Z"
  }
]
```

---

## Document Management Endpoints

### POST /documents/upload

Upload a new document to the knowledge base.

**Authentication:** Required (Admin only)

**Request:**
- Content-Type: multipart/form-data
- Fields:
  - `file`: PDF, DOC, or DOCX file (max 10MB)
  - `title`: Document title
  - `category`: Document category

**Response:** 200 OK
```json
{
  "id": "uuid",
  "title": "Financial Reporting Standards",
  "category": "accounting",
  "size": 2097152,
  "type": "application/pdf",
  "uploaded_by": "uuid",
  "uploaded_at": "2024-01-01T00:00:00Z"
}
```

**Errors:**
- 400: Invalid file type or size
- 401: Unauthorized
- 403: Not admin
- 500: Processing error

**Processing Time:** 30-60 seconds depending on document size

---

### GET /documents/

List all documents in the knowledge base.

**Authentication:** Required (Admin only)

**Query Parameters:**
- `limit` (optional): Number of documents, default 100
- `offset` (optional): Pagination offset, default 0

**Response:** 200 OK
```json
[
  {
    "id": "uuid",
    "title": "Financial Reporting Standards",
    "category": "accounting",
    "size": 2097152,
    "type": "application/pdf",
    "uploaded_by": "uuid",
    "uploaded_at": "2024-01-01T00:00:00Z"
  }
]
```

---

### GET /documents/{doc_id}

Get details of a specific document.

**Authentication:** Required (Admin only)

**Path Parameters:**
- `doc_id`: UUID of the document

**Response:** 200 OK
```json
{
  "id": "uuid",
  "title": "Financial Reporting Standards",
  "category": "accounting",
  "size": 2097152,
  "type": "application/pdf",
  "uploaded_by": "uuid",
  "uploaded_at": "2024-01-01T00:00:00Z"
}
```

**Errors:**
- 404: Document not found

---

### PUT /documents/{doc_id}

Update document metadata.

**Authentication:** Required (Admin only)

**Path Parameters:**
- `doc_id`: UUID of the document

**Request Body:**
```json
{
  "title": "Updated Title",
  "category": "updated_category"
}
```

**Response:** 200 OK
```json
{
  "id": "uuid",
  "title": "Updated Title",
  "category": "updated_category",
  "size": 2097152,
  "type": "application/pdf",
  "uploaded_by": "uuid",
  "uploaded_at": "2024-01-01T00:00:00Z"
}
```

---

### DELETE /documents/{doc_id}

Delete a document from the knowledge base.

**Authentication:** Required (Admin only)

**Path Parameters:**
- `doc_id`: UUID of the document

**Response:** 200 OK
```json
{
  "message": "Document deleted successfully"
}
```

**Note:** This also deletes all associated vectors from Pinecone.

---

## Voice Processing Endpoints

### POST /voice/transcribe

Transcribe audio to text using OpenAI Whisper.

**Authentication:** Required

**Request:**
- Content-Type: multipart/form-data
- Fields:
  - `audio`: Audio file (mp3, wav, webm, ogg, m4a)

**Response:** 200 OK
```json
{
  "transcript": "What is the difference between direct and indirect tax?"
}
```

**Errors:**
- 400: Unsupported audio format
- 500: Transcription error

---

### POST /voice/tts

Convert text to speech using OpenAI TTS.

**Authentication:** Required

**Request Body:**
```json
{
  "text": "GST is a comprehensive indirect tax",
  "language": "en"
}
```

**Response:** 200 OK
- Content-Type: audio/mpeg
- Body: MP3 audio stream

**Errors:**
- 500: TTS generation error

---

## Analytics Endpoints

### GET /analytics/queries

Get query analytics data.

**Authentication:** Required (Admin only)

**Query Parameters:**
- `limit` (optional): Number of records, default 100

**Response:** 200 OK
```json
[
  {
    "id": "uuid",
    "query": "What is GST?",
    "response_time": 1.23,
    "feedback": null,
    "created_at": "2024-01-01T00:00:00Z"
  }
]
```

---

### GET /analytics/stats

Get dashboard statistics.

**Authentication:** Required (Admin only)

**Response:** 200 OK
```json
{
  "total_documents": 25,
  "total_chats": 1543,
  "total_users": 89,
  "avg_response_time": 1.45,
  "top_queries": [
    {
      "query": "what is gst",
      "count": 45
    }
  ],
  "vector_db_stats": {
    "total_vectors": 5000,
    "dimension": 3072
  }
}
```

---

### GET /analytics/users

Get user statistics.

**Authentication:** Required (Admin only)

**Response:** 200 OK
```json
{
  "total_users": 89,
  "students": 85,
  "admins": 4,
  "recent_users": [
    {
      "id": "uuid",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "student",
      "created_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

---

## Health Check Endpoints

### GET /

Get API info.

**Authentication:** Not required

**Response:** 200 OK
```json
{
  "message": "CA Chatbot Platform API",
  "version": "1.0.0",
  "status": "running"
}
```

---

### GET /health

Health check endpoint.

**Authentication:** Not required

**Response:** 200 OK
```json
{
  "status": "healthy"
}
```

---

## Rate Limits

Current implementation does not enforce rate limits. In production:
- Authentication: 10 requests/minute
- Chat: 20 requests/minute
- Document upload: 5 requests/minute
- Analytics: 30 requests/minute

## Error Codes

- 400: Bad Request - Invalid input
- 401: Unauthorized - Missing or invalid token
- 403: Forbidden - Insufficient permissions
- 404: Not Found - Resource doesn't exist
- 500: Internal Server Error - Server-side error

## Best Practices

1. **Token Management:**
   - Store tokens securely
   - Refresh before expiration
   - Clear on logout

2. **File Uploads:**
   - Validate file size client-side
   - Show upload progress
   - Handle timeout errors

3. **Chat:**
   - Maintain conversation_id for context
   - Implement retry logic
   - Show loading states

4. **Voice:**
   - Check microphone permissions
   - Provide fallback to text input
   - Handle browser compatibility

## Webhooks (Future)

Planned webhook support for:
- Document processing complete
- Chat analytics events
- User activity alerts

## WebSocket Support (Future)

Planned real-time features:
- Live chat streaming
- Multi-user discussions
- Real-time analytics updates

## SDK Support (Future)

Planned SDK releases:
- Python SDK
- JavaScript/TypeScript SDK
- Mobile SDKs (React Native)
