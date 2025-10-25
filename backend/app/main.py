from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .config import settings
from .database import engine, Base
from .routers import auth, polls, websocket
from .middleware.security import SecurityHeadersMiddleware, RateLimitMiddleware

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="QuickPoll API",
    description="Real-time opinion polling platform",
    version="1.0.0"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL, "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Security middleware
app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(RateLimitMiddleware, calls=100, period=60)

# Include routers
app.include_router(auth.router)
app.include_router(polls.router)
app.include_router(websocket.router)

@app.get("/")
async def root():
    return {
        "message": "QuickPoll API",
        "version": "1.0.0",
        "docs": "/docs"
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy"}
