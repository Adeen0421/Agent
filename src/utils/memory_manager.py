from typing import Dict, List, Optional, Any
import json
import os
from datetime import datetime, timedelta
from dataclasses import dataclass, asdict
import uuid
from pymongo import MongoClient, ASCENDING, DESCENDING
from pymongo.errors import ConnectionFailure, ServerSelectionTimeoutError
from dotenv import load_dotenv

@dataclass
class ConversationTurn:
    id: str
    session_id: str
    user_id: str
    user_message: str
    ai_response: str
    timestamp: datetime
    metadata: Optional[Dict[str, Any]] = None
    
    def to_dict(self) -> Dict:
        data = asdict(self)
        data['timestamp'] = self.timestamp.isoformat()
        return data
    
    @classmethod
    def from_dict(cls, data: Dict) -> 'ConversationTurn':
        data['timestamp'] = datetime.fromisoformat(data['timestamp'])
        return cls(**data)

class MongoMemoryManager:
    """MongoDB-based persistent conversation memory manager"""
    
    def __init__(self, connection_string: Optional[str] = None, database_name: str = "ocean_ai"):
        """Initialize MongoDB connection"""
        # Load environment variables if not already loaded
        load_dotenv()
        
        # Get connection string from environment or parameter
        if connection_string is None:
            connection_string = os.getenv("MONGODB_CONNECTION_STRING", "mongodb://localhost:27017/")
        
        self.database_name = database_name
        self.connection_string = connection_string
        
        try:
            # Initialize MongoDB client
            self.client = MongoClient(
                connection_string,
                serverSelectionTimeoutMS=5000,  # 5 second timeout
                connectTimeoutMS=10000,         # 10 second connection timeout
                maxPoolSize=50,                 # Maximum number of connections
                retryWrites=True               # Retry writes on failure
            )
            
            # Test connection
            self.client.admin.command('ping')
            
            # Get database and collections
            self.db = self.client[database_name]
            self.conversations = self.db.conversations
            self.sessions = self.db.sessions
            
            # Create indexes for better performance
            self._create_indexes()
            
            print(f"✅ MongoDB connected successfully to {database_name}")
            
        except (ConnectionFailure, ServerSelectionTimeoutError) as e:
            error_msg = str(e)
            if "actively refused" in error_msg or "10061" in error_msg:
                print("⚠️ MongoDB not running (connection refused).")
            else:
                print(f"❌ MongoDB connection failed: {error_msg}")
            print("🔧 Falling back to in-memory storage...")
            self.client = None
            self.db = None
            self.conversations = None
            self.sessions = None
            
            # Fallback in-memory storage
            self._memory_conversations = []
            self._memory_sessions = {}
    
    def _create_indexes(self):
        """Create MongoDB indexes for better query performance"""
        if self.conversations is None or self.sessions is None:
            return
        
        try:
            # Only create indexes if collections are available
            if self.conversations is not None and self.sessions is not None:
                # Conversations collection indexes
                self.conversations.create_index([("session_id", ASCENDING)])
                self.conversations.create_index([("user_id", ASCENDING)])
                self.conversations.create_index([("timestamp", DESCENDING)])
                self.conversations.create_index([("session_id", ASCENDING), ("timestamp", DESCENDING)])
                
                # Sessions collection indexes
                self.sessions.create_index([("user_id", ASCENDING)])
                self.sessions.create_index([("last_activity", DESCENDING)])
                self.sessions.create_index([("session_id", ASCENDING)], unique=True)
            
            print("📊 MongoDB indexes created successfully")
            
        except Exception as e:
            print(f"⚠️ Warning: Could not create indexes: {str(e)}")
    
    def is_connected(self) -> bool:
        """Check if MongoDB is connected"""
        return self.client is not None
    
    def save_conversation_turn(self, 
                             session_id: str,
                             user_id: str,
                             user_message: str,
                             ai_response: str,
                             metadata: Optional[Dict[str, Any]] = None) -> str:
        """Save a conversation turn to database"""
        turn_id = str(uuid.uuid4())
        turn = ConversationTurn(
            id=turn_id,
            session_id=session_id,
            user_id=user_id,
            user_message=user_message,
            ai_response=ai_response,
            timestamp=datetime.utcnow(),  # Use UTC for consistency
            metadata=metadata or {}
        )
        
        if self.is_connected() and self.conversations is not None:
            try:
                # Save to MongoDB
                self.conversations.insert_one(turn.to_dict())
                
                # Update or create session record
                session_data = {
                    "session_id": session_id,
                    "user_id": user_id,
                    "last_activity": datetime.utcnow(),
                    "session_metadata": {}
                }
                
                if self.sessions is not None:
                    self.sessions.update_one(
                        {"session_id": session_id},
                        {
                            "$set": session_data,
                            "$setOnInsert": {"created_at": datetime.utcnow()}
                        },
                        upsert=True
                    )
                
                return turn_id
                
            except Exception as e:
                print(f"⚠️ MongoDB save failed, using memory fallback: {str(e)}")
                # Fallback to memory
                self._memory_conversations.append(turn.to_dict())
                self._memory_sessions[session_id] = session_data
                return turn_id
        else:
            # Use memory storage
            self._memory_conversations.append(turn.to_dict())
            self._memory_sessions[session_id] = {
                "session_id": session_id,
                "user_id": user_id,
                "last_activity": datetime.utcnow(),
                "created_at": datetime.utcnow(),
                "session_metadata": {}
            }
            return turn_id
    
    def get_conversation_history(self, 
                               session_id: str, 
                               limit: int = 20,
                               offset: int = 0) -> List[Dict[str, str]]:
        """Retrieve conversation history for a session"""
        
        if self.is_connected() and self.conversations is not None:
            try:
                # Query MongoDB
                cursor = self.conversations.find(
                    {"session_id": session_id}
                ).sort("timestamp", DESCENDING).skip(offset).limit(limit)
                
                conversations = list(cursor)
                
            except Exception as e:
                print(f"⚠️ MongoDB query failed, using memory fallback: {str(e)}")
                # Fallback to memory
                conversations = [
                    conv for conv in self._memory_conversations 
                    if conv["session_id"] == session_id
                ]
                conversations = sorted(conversations, key=lambda x: x["timestamp"], reverse=True)
                conversations = conversations[offset:offset+limit]
        else:
            # Use memory storage
            conversations = [
                conv for conv in self._memory_conversations 
                if conv["session_id"] == session_id
            ]
            conversations = sorted(conversations, key=lambda x: x["timestamp"], reverse=True)
            conversations = conversations[offset:offset+limit]
        
        # Convert to conversation format (reverse order for chronological)
        history = []
        for conv in reversed(conversations):
            history.extend([
                {"role": "user", "content": conv["user_message"]},
                {"role": "assistant", "content": conv["ai_response"]}
            ])
        
        return history
    
    def get_session_summary(self, session_id: str) -> Dict[str, Any]:
        """Get summary statistics for a session"""
        
        if self.is_connected() and self.conversations is not None and self.sessions is not None:
            try:
                # Count conversations
                conversation_count = self.conversations.count_documents({"session_id": session_id})
                
                # Get first and last message timestamps
                first_conv = self.conversations.find_one(
                    {"session_id": session_id},
                    sort=[("timestamp", ASCENDING)]
                )
                
                last_conv = self.conversations.find_one(
                    {"session_id": session_id},
                    sort=[("timestamp", DESCENDING)]
                )
                
                # Get session metadata
                session_info = self.sessions.find_one({"session_id": session_id})
                
                return {
                    "session_id": session_id,
                    "turn_count": conversation_count,
                    "first_message": first_conv["timestamp"] if first_conv else None,
                    "last_message": last_conv["timestamp"] if last_conv else None,
                    "created_at": session_info["created_at"] if session_info else None,
                    "user_id": session_info["user_id"] if session_info else "unknown",
                    "storage_type": "mongodb"
                }
                
            except Exception as e:
                print(f"⚠️ MongoDB query failed, using memory fallback: {str(e)}")
                # Fallback to memory
                session_convs = [
                    conv for conv in self._memory_conversations 
                    if conv["session_id"] == session_id
                ]
                
                if session_convs:
                    timestamps = [conv["timestamp"] for conv in session_convs]
                    return {
                        "session_id": session_id,
                        "turn_count": len(session_convs),
                        "first_message": min(timestamps),
                        "last_message": max(timestamps),
                        "storage_type": "memory"
                    }
        else:
            # Use memory storage
            session_convs = [
                conv for conv in self._memory_conversations 
                if conv["session_id"] == session_id
            ]
            
            if session_convs:
                timestamps = [conv["timestamp"] for conv in session_convs]
                return {
                    "session_id": session_id,
                    "turn_count": len(session_convs),
                    "first_message": min(timestamps),
                    "last_message": max(timestamps),
                    "storage_type": "memory"
                }
        
        return {
            "session_id": session_id,
            "turn_count": 0,
            "storage_type": "none"
        }
    
    def get_user_sessions(self, user_id: str, limit: int = 10) -> List[Dict[str, Any]]:
        """Get all sessions for a user"""
        
        if self.is_connected() and self.sessions is not None and self.conversations is not None:
            try:
                cursor = self.sessions.find(
                    {"user_id": user_id}
                ).sort("last_activity", DESCENDING).limit(limit)
                
                sessions = []
                for session in cursor:
                    # Get conversation count for each session
                    conv_count = self.conversations.count_documents(
                        {"session_id": session["session_id"]}
                    )
                    
                    session_info = {
                        "session_id": session["session_id"],
                        "created_at": session.get("created_at"),
                        "last_activity": session["last_activity"],
                        "conversation_count": conv_count,
                        "metadata": session.get("session_metadata", {})
                    }
                    sessions.append(session_info)
                
                return sessions
                
            except Exception as e:
                print(f"⚠️ MongoDB query failed: {str(e)}")
                return []
        else:
            # Use memory storage
            user_sessions = [
                session for session in self._memory_sessions.values()
                if session["user_id"] == user_id
            ]
            
            sessions = []
            for session in user_sessions:
                conv_count = len([
                    conv for conv in self._memory_conversations
                    if conv["session_id"] == session["session_id"]
                ])
                
                sessions.append({
                    "session_id": session["session_id"],
                    "created_at": session.get("created_at"),
                    "last_activity": session["last_activity"],
                    "conversation_count": conv_count
                })
            
            return sorted(sessions, key=lambda x: x["last_activity"], reverse=True)[:limit]
    
    def cleanup_old_sessions(self, days_old: int = 30) -> int:
        """Clean up sessions older than specified days"""
        cutoff_date = datetime.utcnow() - timedelta(days=days_old)
        deleted_count = 0
        
        if self.is_connected() and self.conversations is not None and self.sessions is not None:
            try:
                # Delete old conversations
                conv_result = self.conversations.delete_many({
                    "timestamp": {"$lt": cutoff_date}
                })
                
                # Delete old sessions
                session_result = self.sessions.delete_many({
                    "last_activity": {"$lt": cutoff_date}
                })
                
                deleted_count = conv_result.deleted_count
                print(f"🧹 Cleaned up {deleted_count} old conversation turns and {session_result.deleted_count} sessions")
                
            except Exception as e:
                print(f"⚠️ Cleanup failed: {str(e)}")
        else:
            # Clean memory storage
            initial_count = len(self._memory_conversations)
            self._memory_conversations = [
                conv for conv in self._memory_conversations
                if datetime.fromisoformat(conv["timestamp"]) >= cutoff_date
            ]
            deleted_count = initial_count - len(self._memory_conversations)
            
            # Clean sessions
            self._memory_sessions = {
                k: v for k, v in self._memory_sessions.items()
                if v["last_activity"] >= cutoff_date
            }
        
        return deleted_count
    
    def get_database_stats(self) -> Dict[str, Any]:
        """Get database statistics"""
        if self.is_connected() and self.conversations is not None and self.sessions is not None and self.db is not None:
            try:
                stats = {
                    "connected": True,
                    "database": self.database_name,
                    "total_conversations": self.conversations.estimated_document_count(),
                    "total_sessions": self.sessions.estimated_document_count(),
                    "storage_type": "mongodb"
                }
                
                # Get size information
                db_stats = self.db.command("dbstats")
                stats.update({
                    "database_size_mb": round(db_stats.get("dataSize", 0) / (1024 * 1024), 2),
                    "index_size_mb": round(db_stats.get("indexSize", 0) / (1024 * 1024), 2)
                })
                
                return stats
                
            except Exception as e:
                return {
                    "connected": False,
                    "error": str(e),
                    "storage_type": "mongodb_error"
                }
        else:
            return {
                "connected": False,
                "total_conversations": len(self._memory_conversations),
                "total_sessions": len(self._memory_sessions),
                "storage_type": "memory"
            }
    
    def close_connection(self):
        """Close MongoDB connection"""
        if self.client:
            self.client.close()
            print("🔌 MongoDB connection closed")

# Singleton instance for easy import
_memory_manager_instance = None

def get_memory_manager() -> MongoMemoryManager:
    """Get singleton memory manager instance"""
    global _memory_manager_instance
    if _memory_manager_instance is None:
        _memory_manager_instance = MongoMemoryManager()
    return _memory_manager_instance
