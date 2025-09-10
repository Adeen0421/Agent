from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any
import uuid
import sys
import os
from pathlib import Path

# Add the parent directory to Python path to import from src
sys.path.append(str(Path(__file__).parent.parent))
from src.agent import SimpleAgent
from dotenv import load_dotenv

# Import enhanced routes - try to import, if fails, create minimal fallback
try:
    from backend.app.enhanced_routes import router as enhanced_router, compat_router
    enhanced_routes_available = True
except ImportError:
    print("⚠️ Enhanced routes not available, running in basic mode")
    enhanced_routes_available = False
    enhanced_router = None
    compat_router = None

# Load environment variables
load_dotenv()

app = FastAPI(
    title="Nebula AI Agent API", 
    version="2.0.0",
    description="Enhanced AI Agent with MongoDB Memory, Guardrails, and Structured Output"
)

# Include enhanced routes if available
if enhanced_routes_available and enhanced_router and compat_router:
    app.include_router(enhanced_router)  # /api/v2/* routes
    app.include_router(compat_router)    # Backward compatibility routes
    print("✅ Enhanced routes loaded successfully")
    print("✅ Backward compatibility routes enabled")
else:
    print("⚠️ Running in basic mode - enhanced features not available")
    # Don't include enhanced routes when not available to avoid conflicts

# Enable CORS for frontend communication
import os
allowed_origins = [
    "http://localhost:3000", 
    "http://localhost:5173",
    "https://*.vercel.app",  # Vercel preview deployments
    "https://your-app-name.vercel.app"  # Replace with your actual Vercel URL
]

# Add production origins from environment
if os.getenv("FRONTEND_URL"):
    allowed_origins.append(os.getenv("FRONTEND_URL"))

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory storage for sessions (in production, use Redis or database)
sessions: Dict[str, SimpleAgent] = {}

class ChatMessage(BaseModel):
    message: str

class ChatResponse(BaseModel):
    response: str
    session_id: str

class SessionResponse(BaseModel):
    session_id: str
    message: str

class HistoryResponse(BaseModel):
    history: List[Dict[str, str]]
    session_id: str

@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "message": "Nebula AI Agent API is running",
        "version": "2.0.0",
        "features": {
            "basic_chat": "Available at /api/v1",
            "enhanced_chat": "Available at /api/v2", 
            "mongodb_memory": "Persistent conversation storage",
            "guardrails": "Input/output safety filters",
            "structured_prompts": "Enhanced prompt engineering"
        },
        "endpoints": {
            "basic": "/docs (v1 endpoints)",
            "enhanced": "/api/v2/health (enhanced system)"
        }
    }

@app.post("/session/create", response_model=SessionResponse)
async def create_session():
    """Create a new chat session"""
    try:
        session_id = str(uuid.uuid4())
        agent = SimpleAgent()
        sessions[session_id] = agent
        
        return SessionResponse(
            session_id=session_id,
            message="Session created successfully"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create session: {str(e)}")

@app.post("/chat/{session_id}", response_model=ChatResponse)
async def chat(session_id: str, message: ChatMessage):
    """Send a message to the agent and get a response"""
    if session_id not in sessions:
        raise HTTPException(status_code=404, detail="Session not found")
    
    try:
        agent = sessions[session_id]
        response = agent.run(message.message)
        
        return ChatResponse(
            response=response,
            session_id=session_id
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing message: {str(e)}")

@app.get("/history/{session_id}", response_model=HistoryResponse)
async def get_history(session_id: str):
    """Get conversation history for a session"""
    if session_id not in sessions:
        raise HTTPException(status_code=404, detail="Session not found")
    
    agent = sessions[session_id]
    history = agent.get_history()
    
    return HistoryResponse(
        history=history,
        session_id=session_id
    )

@app.delete("/session/{session_id}")
async def delete_session(session_id: str):
    """Delete a chat session"""
    if session_id not in sessions:
        raise HTTPException(status_code=404, detail="Session not found")
    
    del sessions[session_id]
    return {"message": "Session deleted successfully"}

@app.get("/sessions")
async def list_sessions():
    """List all active sessions (for debugging)"""
    return {"sessions": list(sessions.keys()), "count": len(sessions)}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
