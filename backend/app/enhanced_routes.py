from fastapi import APIRouter, HTTPException, Depends, Query
from pydantic import BaseModel, Field, validator
from typing import Dict, List, Optional, Any
import sys
from pathlib import Path
from datetime import datetime

# Add src to path for imports
project_root = Path(__file__).parent.parent.parent
sys.path.append(str(project_root))

try:
    from src.enhanced_agent import EnhancedAgent as RealEnhancedAgent
    enhanced_agent_available = True
    print("✅ Enhanced agent imported successfully")
    
    # Use the real enhanced agent
    EnhancedAgent = RealEnhancedAgent
    
except ImportError as e:
    print(f"❌ Enhanced agent import failed: {e}")
    enhanced_agent_available = False
    
    # Create a dummy class for fallback
    class EnhancedAgent:
        def __init__(self, *args, **kwargs):
            self.session_id = "dummy_session"
            self.user_id = "dummy_user"
            self.memory_manager = type('MockMemoryManager', (), {'is_connected': lambda: False})()
            self.context = {}
            
        def run(self, user_input: str, format_type: str = "markdown"):
            return {
                "response": {"content": f"Enhanced features unavailable. You said: {user_input}"},
                "metadata": {"error": True}
            }
            
        def get_conversation_summary(self):
            return {"turn_count": 0, "storage_type": "unavailable"}
            
        def get_full_history(self, limit: int = 20):
            return []
            
        def update_preferences(self, prefs):
            pass
            
        def clear_conversation(self):
            pass
            
        def get_database_stats(self):
            return {"connected": False, "storage_type": "unavailable"}
            
        def cleanup_old_data(self, days_old: int):
            return 0

router = APIRouter(prefix="/api/v2", tags=["Enhanced Chat"])

# Also create a router for backward compatibility (no prefix)
compat_router = APIRouter(tags=["Backward Compatibility"])

# Global storage for enhanced agents (in production, consider Redis)
enhanced_sessions: Dict[str, EnhancedAgent] = {}

class EnhancedChatMessage(BaseModel):
    message: str = Field(..., min_length=1, max_length=5000, description="User message content")
    format_type: str = Field(default="markdown", description="Response format type")
    user_id: Optional[str] = Field(default="anonymous", description="User identifier")
    context: Optional[Dict[str, Any]] = Field(default=None, description="Additional context")
    
    @validator('format_type')
    def validate_format_type(cls, v):
        allowed_formats = ["markdown", "json", "table"]
        if v not in allowed_formats:
            raise ValueError(f"format_type must be one of: {allowed_formats}")
        return v
    
    @validator('message')
    def validate_message(cls, v):
        if not v.strip():
            raise ValueError("Message cannot be empty or whitespace only")
        return v.strip()

class EnhancedChatResponse(BaseModel):
    response: Dict[str, Any]
    session_id: str
    metadata: Dict[str, Any]

class SessionStats(BaseModel):
    session_id: str
    turn_count: int
    first_message: Optional[str]
    last_message: Optional[str]
    agent_status: str
    storage_type: str
    user_id: str

class UserPreferences(BaseModel):
    response_style: Optional[str] = Field(default="detailed", description="Response style preference")
    technical_level: Optional[str] = Field(default="intermediate", description="Technical complexity level")
    language: Optional[str] = Field(default="english", description="Preferred language")
    domain: Optional[str] = Field(default="general", description="Primary domain of interest")

class DatabaseStats(BaseModel):
    connected: bool
    total_conversations: int
    total_sessions: int
    storage_type: str
    database_size_mb: Optional[float] = None
    index_size_mb: Optional[float] = None

@router.post("/session/create", response_model=Dict[str, str])
async def create_enhanced_session(user_id: str = Query(default="anonymous", description="User identifier")):
    """Create a new enhanced session with MongoDB memory and guardrails"""
    try:
        agent = EnhancedAgent(user_id=user_id)
        session_id = agent.session_id
        enhanced_sessions[session_id] = agent
        
        # Get database connection status
        db_connected = agent.memory_manager.is_connected()
        
        return {
            "session_id": session_id,
            "user_id": user_id,
            "message": "Enhanced session created successfully",
            "features": "✅ Memory, ✅ Guardrails, ✅ Structured Output, ✅ Context Management",
            "database_connected": str(db_connected),
            "storage_type": "mongodb" if db_connected else "memory_fallback",
            "created_at": datetime.now().isoformat()
        }
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Failed to create enhanced session: {str(e)}"
        )

@router.post("/chat/{session_id}", response_model=EnhancedChatResponse)
async def enhanced_chat(session_id: str, message: EnhancedChatMessage):
    """Enhanced chat with MongoDB memory, guardrails, and structured output"""
    
    # Get or recreate agent
    if session_id not in enhanced_sessions:
        try:
            # Try to recreate agent from stored session
            agent = EnhancedAgent(session_id=session_id, user_id=message.user_id or "anonymous")
            enhanced_sessions[session_id] = agent
            print(f"🔄 Restored agent for session: {session_id}")
        except Exception as e:
            raise HTTPException(
                status_code=404, 
                detail=f"Session not found and could not be restored: {str(e)}"
            )
    
    agent = enhanced_sessions[session_id]
    
    try:
        # Update agent context if provided
        if message.context:
            agent.context.update(message.context)
        
        # Process message with full enhancement pipeline
        response = agent.run(
            user_input=message.message,
            format_type=message.format_type
        )
        
        # Add enhanced metadata
        enhanced_metadata = {
            "timestamp": response["metadata"].get("timestamp"),
            "format_type": message.format_type,
            "session_info": {
                "session_id": session_id,
                "user_id": agent.user_id,
                "database_connected": agent.memory_manager.is_connected()
            },
            "enhanced_features": {
                "guardrails_active": True,
                "memory_persistent": agent.memory_manager.is_connected(),
                "context_aware": True,
                "structured_output": True,
                "safety_filters": True
            },
            "performance": {
                "processing_time": response["metadata"].get("processing_time"),
                "response_length": len(response["response"]["content"]),
                "warnings_count": len(response["metadata"].get("warnings", []))
            }
        }
        
        return EnhancedChatResponse(
            response=response,
            session_id=session_id,
            metadata=enhanced_metadata
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Error processing enhanced message: {str(e)}"
        )

@router.get("/session/{session_id}/stats", response_model=SessionStats)
async def get_session_stats(session_id: str):
    """Get detailed session statistics and summary"""
    
    agent = None
    
    # Try to get from active sessions first
    if session_id in enhanced_sessions:
        agent = enhanced_sessions[session_id]
    else:
        # Try to create agent to access stored data
        try:
            agent = EnhancedAgent(session_id=session_id)
        except Exception:
            raise HTTPException(status_code=404, detail="Session not found and could not be restored")
    
    try:
        summary = agent.get_conversation_summary()
        
        return SessionStats(
            session_id=session_id,
            turn_count=summary.get("turn_count", 0),
            first_message=summary.get("first_message"),
            last_message=summary.get("last_message"),
            agent_status="active" if session_id in enhanced_sessions else "restored",
            storage_type=summary.get("storage_type", "unknown"),
            user_id=summary.get("user_id", "unknown")
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Error retrieving session stats: {str(e)}"
        )

@router.get("/session/{session_id}/history", response_model=List[Dict[str, str]])
async def get_enhanced_history(
    session_id: str, 
    limit: int = Query(default=20, ge=1, le=100, description="Number of messages to retrieve")
):
    """Get conversation history with enhanced context"""
    
    agent = None
    
    # Try to get from active sessions first
    if session_id in enhanced_sessions:
        agent = enhanced_sessions[session_id]
    else:
        # Try to create agent to access stored data
        try:
            agent = EnhancedAgent(session_id=session_id)
        except Exception:
            raise HTTPException(status_code=404, detail="Session not found")
    
    try:
        history = agent.get_full_history(limit=limit)
        return history
        
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Error retrieving conversation history: {str(e)}"
        )

@router.put("/session/{session_id}/preferences", response_model=Dict[str, str])
async def update_user_preferences(session_id: str, preferences: UserPreferences):
    """Update user preferences for the session"""
    
    if session_id not in enhanced_sessions:
        raise HTTPException(status_code=404, detail="Active session not found")
    
    agent = enhanced_sessions[session_id]
    
    try:
        # Convert to dict and filter out None values
        prefs_dict = {k: v for k, v in preferences.dict().items() if v is not None}
        agent.update_preferences(prefs_dict)
        
        return {
            "message": "Preferences updated successfully",
            "session_id": session_id,
            "updated_preferences": str(prefs_dict),
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Error updating preferences: {str(e)}"
        )

@router.delete("/session/{session_id}")
async def delete_enhanced_session(session_id: str):
    """Delete enhanced session from memory (MongoDB history preserved)"""
    
    if session_id in enhanced_sessions:
        # Cleanup agent
        agent = enhanced_sessions[session_id]
        del enhanced_sessions[session_id]
        
        return {
            "message": "Session deleted from memory successfully",
            "note": "Conversation history preserved in MongoDB",
            "session_id": session_id,
            "timestamp": datetime.now().isoformat()
        }
    else:
        raise HTTPException(status_code=404, detail="Active session not found in memory")

@router.post("/session/{session_id}/clear")
async def clear_session_context(session_id: str):
    """Clear session context while keeping persistent history"""
    
    if session_id not in enhanced_sessions:
        raise HTTPException(status_code=404, detail="Active session not found")
    
    agent = enhanced_sessions[session_id]
    
    try:
        agent.clear_conversation()
        
        return {
            "message": "Session context cleared successfully",
            "note": "Full conversation history still available in MongoDB",
            "session_id": session_id,
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Error clearing session context: {str(e)}"
        )

@router.get("/database/stats", response_model=DatabaseStats)
async def get_database_stats():
    """Get MongoDB database statistics"""
    try:
        # Create a temporary agent to access database stats
        temp_agent = EnhancedAgent()
        stats = temp_agent.get_database_stats()
        
        return DatabaseStats(**stats)
        
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Error retrieving database stats: {str(e)}"
        )

@router.post("/database/cleanup")
async def cleanup_old_data(days_old: int = Query(default=30, ge=1, le=365, description="Days old for cleanup")):
    """Clean up conversations older than specified days"""
    try:
        # Create a temporary agent to perform cleanup
        temp_agent = EnhancedAgent()
        deleted_count = temp_agent.cleanup_old_data(days_old)
        
        return {
            "message": f"Database cleanup completed successfully",
            "deleted_conversations": deleted_count,
            "cutoff_days": days_old,
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Error during database cleanup: {str(e)}"
        )

@router.get("/sessions/user/{user_id}")
async def get_user_sessions(
    user_id: str, 
    limit: int = Query(default=10, ge=1, le=50, description="Number of sessions to retrieve")
):
    """Get all sessions for a specific user"""
    try:
        # Create a temporary agent to access user sessions
        temp_agent = EnhancedAgent(user_id=user_id)
        sessions = temp_agent.memory_manager.get_user_sessions(user_id, limit)
        
        return {
            "user_id": user_id,
            "sessions": sessions,
            "total_found": len(sessions),
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Error retrieving user sessions: {str(e)}"
        )

@router.get("/health")
async def health_check():
    """Health check endpoint for the enhanced system"""
    try:
        # Test MongoDB connection
        temp_agent = EnhancedAgent()
        db_stats = temp_agent.get_database_stats()
        
        return {
            "status": "healthy",
            "timestamp": datetime.now().isoformat(),
            "version": "2.0.0",
            "features": {
                "mongodb_memory": db_stats["connected"],
                "guardrails": True,
                "structured_prompts": True,
                "context_management": True,
                "safety_filters": True
            },
            "active_sessions": len(enhanced_sessions),
            "database": {
                "connected": db_stats["connected"],
                "total_conversations": db_stats.get("total_conversations", 0),
                "storage_type": db_stats.get("storage_type", "unknown")
            }
        }
        
    except Exception as e:
        return {
            "status": "degraded",
            "error": str(e),
            "timestamp": datetime.now().isoformat(),
            "active_sessions": len(enhanced_sessions)
        }

# ============================================================================
# BACKWARD COMPATIBILITY ROUTES (for existing frontend)
# ============================================================================

class LegacyChatMessage(BaseModel):
    message: str

class LegacyChatResponse(BaseModel):
    response: str
    session_id: str

class LegacySessionResponse(BaseModel):
    session_id: str
    message: str

@compat_router.post("/session/create", response_model=LegacySessionResponse)
async def create_legacy_session():
    """Create a session with enhanced features but legacy response format"""
    try:
        if enhanced_agent_available:
            agent = EnhancedAgent(user_id="frontend_user")
            session_id = agent.session_id
            enhanced_sessions[session_id] = agent
            
            return LegacySessionResponse(
                session_id=session_id,
                message="Enhanced session created successfully"
            )
        else:
            # Fallback to basic session creation
            import uuid
            session_id = str(uuid.uuid4())
            return LegacySessionResponse(
                session_id=session_id,
                message="Basic session created (enhanced features unavailable)"
            )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create session: {str(e)}")

@compat_router.post("/chat/{session_id}", response_model=LegacyChatResponse)
async def legacy_chat(session_id: str, message: LegacyChatMessage):
    """Enhanced chat with legacy response format for frontend compatibility"""
    
    if enhanced_agent_available and session_id in enhanced_sessions:
        try:
            # Use enhanced agent
            agent = enhanced_sessions[session_id]
            
            response = agent.run(
                user_input=message.message,
                format_type="markdown"
            )
            
            # Extract just the content for legacy response
            content = response["response"]["content"]
            
            return LegacyChatResponse(
                response=content,
                session_id=session_id
            )
            
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Enhanced chat error: {str(e)}")
    else:
        # Fallback to basic response
        try:
            # Try to create an enhanced agent on-the-fly
            if enhanced_agent_available:
                agent = EnhancedAgent(session_id=session_id, user_id="frontend_user")
                enhanced_sessions[session_id] = agent
                
                response = agent.run(
                    user_input=message.message,
                    format_type="markdown"
                )
                
                content = response["response"]["content"]
                
                return LegacyChatResponse(
                    response=content,
                    session_id=session_id
                )
            else:
                # Use the basic agent from the main backend
                try:
                    from backend.main import sessions
                    if session_id in sessions:
                        agent = sessions[session_id]
                        response_text = agent.run(message.message)
                        return LegacyChatResponse(
                            response=response_text,
                            session_id=session_id
                        )
                    else:
                        return LegacyChatResponse(
                            response=f"Session {session_id} not found. Please create a new session.",
                            session_id=session_id
                        )
                except Exception as basic_error:
                    return LegacyChatResponse(
                        response=f"I received your message: '{message.message}'. Enhanced features are currently unavailable. Basic agent error: {str(basic_error)}",
                        session_id=session_id
                    )
                
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Fallback chat error: {str(e)}")

@compat_router.get("/history/{session_id}")
async def get_legacy_history(session_id: str):
    """Get conversation history in legacy format"""
    
    if enhanced_agent_available and session_id in enhanced_sessions:
        try:
            agent = enhanced_sessions[session_id]
            history = agent.get_full_history(limit=20)
            
            # Convert to legacy format
            legacy_history = []
            for msg in history:
                legacy_history.append({
                    "role": msg["role"],
                    "content": msg["content"]
                })
            
            return {
                "history": legacy_history,
                "session_id": session_id
            }
            
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"History error: {str(e)}")
    else:
        return {
            "history": [],
            "session_id": session_id
        }
