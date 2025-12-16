# CA RAG Chatbot

Basic full-stack RAG chatbot for CA students.

## Backend

- Python FastAPI
- MongoDB for users & document metadata
- Pinecone for vector search
- OpenRouter for LLM + embeddings

### Run backend

```bash
cd backend
cp .env.example .env  # fill values
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

## Frontend

- React + Vite + TypeScript

### Run frontend

```bash
cd frontend
cp .env.example .env  # set VITE_API_BASE if needed
npm install
npm run dev
```

Then open http://localhost:5173
