# QuickPoll - Real-Time Opinion Polling Platform

A production-grade, highly secure, real-time polling platform built with FastAPI and Next.js.

## Tech Stack

### Backend
- FastAPI (Python 3.11+) with WebSocket support
- PostgreSQL with proper indexing
- SQLAlchemy ORM
- JWT authentication with HTTP-only cookies
- Rate limiting and security middleware

### Frontend
- Next.js 14 (App Router)
- TypeScript
- shadcn/ui components
- Zustand + React Query for state management
- WebSocket for real-time updates

## Project Structure

```
quickpoll/
├── backend/          # FastAPI backend
│   ├── app/
│   │   ├── models/   # Database models
│   │   ├── schemas/  # Pydantic schemas
│   │   ├── routers/  # API endpoints
│   │   ├── services/ # Business logic
│   │   ├── middleware/ # Security & rate limiting
│   │   └── utils/    # Utilities
│   └── requirements.txt
└── frontend/         # Next.js frontend
    └── src/
```

## 🚀 Quick Start (No Database Setup Needed!)

QuickPoll uses **SQLite by default** for instant local development - no PostgreSQL installation required!

### Option 1: One Command Start (Easiest!)

**macOS/Linux:**
```bash
chmod +x start-local.sh && ./start-local.sh
```

**Windows:**
```bash
start-local.bat
```

The script automatically:
- ✅ Sets up backend with SQLite
- ✅ Sets up frontend
- ✅ Starts both servers
- ✅ Opens in your browser

**Done! Go to http://localhost:3000** 🎉

### Option 2: Manual Setup

**Terminal 1 - Backend:**
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm install
npm run dev
```

**Access:**
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

### Database Options

**SQLite (Default - No Setup!):**
- Perfect for local development and testing
- Database file: `backend/quickpoll.db`
- Already configured in `.env`

**PostgreSQL (Optional - For Production):**
```bash
# Update backend/.env:
DATABASE_URL=postgresql://user:password@localhost:5432/quickpoll
```

See **QUICK_START.md** for detailed instructions!

## Features

- User authentication (register/login)
- Create polls with multiple options
- Real-time voting with WebSocket updates
- Like/unlike polls
- View poll results with live updates
- Delete own polls
- Secure API with rate limiting
- Input validation and sanitization
- SQL injection prevention

## Security Features

- Password hashing with bcrypt
- JWT token authentication
- Rate limiting middleware
- CSRF protection
- Input sanitization
- Security headers (XSS, CSRF, etc.)
- SQL injection prevention

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

### Polls
- `POST /api/polls/` - Create poll
- `GET /api/polls/` - List polls
- `GET /api/polls/{id}` - Get poll details
- `POST /api/polls/{id}/vote` - Vote on poll
- `POST /api/polls/{id}/like` - Toggle like
- `DELETE /api/polls/{id}` - Delete poll

### WebSocket
- `WS /ws/polls/{id}` - Real-time poll updates

## License

MIT
