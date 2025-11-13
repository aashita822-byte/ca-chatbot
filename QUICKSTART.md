# Quick Start Guide - CA Chatbot Platform

Get your CA Chatbot Platform running in 5 minutes!

## Prerequisites Check

```bash
# Check Node.js (need 18+)
node --version

# Check Python (need 3.10+)
python --version

# Check npm
npm --version

# Check pip
pip --version
```

## Step 1: Get API Keys

### OpenAI API Key (Required)
1. Visit https://platform.openai.com/api-keys
2. Create new secret key
3. Copy it (you'll need it in Step 3)

### Pinecone API Key (Required)
1. Visit https://www.pinecone.io/
2. Sign up for free account
3. Create new index:
   - Name: `ca-chatbot-embeddings`
   - Dimensions: `3072`
   - Metric: `cosine`
4. Copy API key and environment from dashboard

## Step 2: Install Dependencies

### Backend
```bash
cd backend
pip install -r requirements.txt
```

### Frontend
```bash
cd ..
npm install
```

## Step 3: Configure API Keys

Edit `backend/.env` and add your keys:

```env
OPENAI_API_KEY=sk-your-key-here
PINECONE_API_KEY=your-pinecone-key-here
PINECONE_ENVIRONMENT=us-east-1
```

## Step 4: Start the Backend

```bash
cd backend
python run.py
```

You should see:
```
INFO:     Uvicorn running on http://0.0.0.0:8000
```

## Step 5: Start the Frontend

Open a new terminal:

```bash
npm run dev
```

You should see:
```
VITE ready in XXX ms
Local: http://localhost:3000
```

## Step 6: Access the App

Open your browser and go to: http://localhost:3000

## Step 7: Login

Use the default admin account:
- Email: `admin@ca.com`
- Password: (leave empty, just click Login)

Or create a new student account.

## Step 8: Upload Documents (Admin Only)

1. Switch to "Admin Panel" tab
2. Click "Upload New Document"
3. Drag and drop a PDF/DOC/DOCX file
4. Enter document title and category
5. Click "Upload to Knowledge Base"
6. Wait for processing (may take 30-60 seconds)

## Step 9: Start Chatting

1. Switch back to "Chat" tab
2. Type a CA-related question
3. Choose Q&A or Discussion mode
4. Click send or use voice input

## Common Issues

### Backend won't start
```bash
# Make sure you're in the backend directory
cd backend

# Reinstall dependencies
pip install -r requirements.txt --force-reinstall

# Check for errors in .env file
cat .env
```

### Frontend won't start
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Check environment file
cat .env
```

### Can't connect to backend
```bash
# Check if backend is running
curl http://localhost:8000/health

# Should return: {"status":"healthy"}
```

### Pinecone errors
- Verify index name is exactly `ca-chatbot-embeddings`
- Check dimensions are set to `3072`
- Confirm API key is valid

### OpenAI errors
- Verify API key starts with `sk-`
- Check you have credits in your account
- Ensure GPT-4 access is enabled

## Testing the System

### Test Chat (Q&A Mode)
```
Question: "What is the difference between direct and indirect tax?"
Expected: Detailed answer about direct vs indirect taxation in India
```

### Test Chat (Discussion Mode)
```
Question: "GST implementation in India"
Expected: Debate between Expert CA and Auditor personas
```

### Test Document Upload
1. Download a sample CA document
2. Upload via Admin Panel
3. Check it appears in documents list
4. Ask questions related to the document content

### Test Voice Input
1. Click microphone icon
2. Allow microphone access
3. Speak your question
4. Watch it transcribe in real-time

## Next Steps

1. Read full SETUP.md for detailed configuration
2. Upload your CA study materials
3. Customize the UI (see components/)
4. Add more document categories
5. Explore API documentation at http://localhost:8000/docs

## Production Checklist

Before deploying to production:

- [ ] Change JWT_SECRET_KEY
- [ ] Set up HTTPS
- [ ] Configure production database
- [ ] Set up proper authentication
- [ ] Add rate limiting
- [ ] Enable monitoring
- [ ] Set up backups
- [ ] Configure CDN for frontend
- [ ] Review and update CORS settings
- [ ] Set up error tracking (Sentry, etc.)

## Support

If you encounter issues:

1. Check backend logs in terminal
2. Check browser console (F12)
3. Verify all API keys are correct
4. Ensure all services are running
5. Review SETUP.md for detailed troubleshooting

## API Documentation

Interactive API docs: http://localhost:8000/docs

## Architecture

```
┌─────────────┐
│   React     │ ←→ http://localhost:3000
│  Frontend   │
└──────┬──────┘
       │
       ↓
┌─────────────┐
│   FastAPI   │ ←→ http://localhost:8000
│   Backend   │
└──────┬──────┘
       │
       ├─→ OpenAI (GPT-4, Embeddings, Whisper, TTS)
       ├─→ Pinecone (Vector Search)
       └─→ Supabase (PostgreSQL Database)
```

Enjoy building with CA Chatbot Platform!
