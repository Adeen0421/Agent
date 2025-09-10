from typing import List, Dict, Any, Optional
import os
import json
import time
import random
from datetime import datetime
from google import generativeai
from dotenv import load_dotenv
import pathlib

from .utils.prompt_manager import PromptManager, PromptConfig
from .utils.memory_manager import MongoMemoryManager

class EnhancedAgent:
    """Enhanced AI Agent with MongoDB memory, guardrails, and structured prompting"""
    
    def __init__(self, session_id: Optional[str] = None, user_id: str = "anonymous"):
        """Initialize enhanced agent with all advanced features"""
        
        # Load environment variables
        env_path = pathlib.Path(os.path.dirname(os.path.dirname(__file__))) / '.env'
        if env_path.exists():
            load_dotenv(dotenv_path=env_path)
        
        # Initialize Gemini API
        api_key = os.getenv("GOOGLE_API_KEY")
        if not api_key:
            raise ValueError(
                "GOOGLE_API_KEY not found in environment variables. "
                "Please ensure your .env file contains: GOOGLE_API_KEY=your_api_key_here"
            )
        
        try:
            generativeai.configure(api_key=api_key)
            self.model = generativeai.GenerativeModel('gemini-2.0-flash')
            print("✅ Gemini API initialized successfully")
        except Exception as e:
            raise Exception(f"Failed to initialize Gemini API: {str(e)}")
        
        # Initialize session info
        self.session_id = session_id or f"session_{datetime.now().strftime('%Y%m%d_%H%M%S_%f')}"
        self.user_id = user_id
        
        # Initialize enhanced components
        self.prompt_manager = PromptManager(PromptConfig())
        self.memory_manager = MongoMemoryManager()
        
        # Load existing conversation history from MongoDB
        self._load_conversation_history()
        
        # Context for prompts
        self.context = {
            "session_id": self.session_id,
            "user_id": self.user_id,
            "domain": "general",
            "user_preferences": {
                "response_style": "detailed",
                "technical_level": "intermediate",
                "language": "english"
            }
        }
        
        print(f"🚀 Enhanced Agent initialized for user: {self.user_id}, session: {self.session_id}")
        if self.memory_manager.is_connected():
            print("✅ MongoDB connected - persistent memory active")
        else:
            print("⚠️ MongoDB not connected - using memory fallback")
    
    def _load_conversation_history(self):
        """Load conversation history from MongoDB"""
        try:
            history = self.memory_manager.get_conversation_history(
                self.session_id, 
                limit=20  # Load last 20 conversation turns
            )
            self.prompt_manager.conversation_history = history
            
            if history:
                print(f"📚 Loaded {len(history)} messages from conversation history")
            
        except Exception as e:
            print(f"⚠️ Could not load conversation history: {str(e)}")
            self.prompt_manager.conversation_history = []
    
    def run(self, user_input: str, format_type: str = "markdown") -> Dict[str, Any]:
        """Process user input with full enhancement pipeline"""
        
        start_time = time.time()
        
        try:
            # Step 1: Build enhanced prompt with guardrails
            print(f"🔍 Processing user input: {user_input[:50]}...")
            
            prompt_result = self.prompt_manager.build_prompt(
                user_input=user_input,
                format_type=format_type,
                context=self.context
            )
            
            # Check for input validation errors
            if prompt_result.get("error"):
                error_response = {
                    "response": {
                        "content": f"I can't process that request: {prompt_result['message']}",
                        "format": format_type,
                        "confidence": 0.0
                    },
                    "metadata": {
                        "error": True,
                        "error_type": "input_validation",
                        "timestamp": datetime.now().isoformat(),
                        "processing_time": time.time() - start_time,
                        "guardrails_triggered": True
                    },
                    "follow_up": {
                        "suggestions": prompt_result.get("suggestions", [
                            "Please rephrase your question",
                            "Try asking something different",
                            "Make sure your message follows our guidelines"
                        ]),
                        "clarifications_needed": True
                    }
                }
                
                # Still save the interaction for learning purposes
                self._save_interaction(
                    user_input, 
                    error_response["response"]["content"],
                    {"error": True, "error_type": "input_validation"}
                )
                
                return error_response
            
            # Step 2: Generate AI response using enhanced prompt
            enhanced_prompt = prompt_result["prompt"]
            warnings = prompt_result.get("warnings", [])
            
            print("🧠 Generating AI response...")
            ai_response = self._generate_response(enhanced_prompt)
            
            # Step 3: Validate AI response
            output_validation = self.prompt_manager.validate_ai_response(ai_response)
            if not output_validation["is_valid"]:
                print("⚠️ AI response failed validation, using filtered content")
                ai_response = output_validation["filtered_content"]
            
            # Step 4: Parse structured response (if JSON format requested)
            processing_time = time.time() - start_time
            
            if format_type == "json":
                try:
                    structured_response = json.loads(ai_response)
                    # Ensure the response has the correct structure
                    if not isinstance(structured_response, dict) or "response" not in structured_response:
                        raise json.JSONDecodeError("Invalid response structure", ai_response, 0)
                        
                except json.JSONDecodeError:
                    print("⚠️ Malformed JSON response, creating structured fallback")
                    structured_response = self._create_structured_fallback(ai_response, format_type, warnings, processing_time)
            else:
                # For markdown/text responses, create structured format
                structured_response = self._create_structured_fallback(ai_response, format_type, warnings, processing_time)
            
            # Step 5: Add metadata and follow-up suggestions
            structured_response["metadata"].update({
                "timestamp": datetime.now().isoformat(),
                "processing_time": processing_time,
                "warnings": warnings,
                "guardrails_active": True,
                "memory_persistent": self.memory_manager.is_connected(),
                "session_id": self.session_id,
                "user_id": self.user_id
            })
            
            # Add intelligent follow-up suggestions
            if not structured_response.get("follow_up", {}).get("suggestions"):
                structured_response["follow_up"]["suggestions"] = self._generate_followup_suggestions(user_input, ai_response)
            
            # Step 6: Save to persistent memory
            try:
                self._save_interaction(
                    user_input, 
                    structured_response["response"]["content"],
                    {
                        "format_type": format_type,
                        "confidence": structured_response["response"].get("confidence", 0.8),
                        "warnings": warnings,
                        "processing_time": processing_time
                    }
                )
            except Exception as save_error:
                print(f"⚠️ Could not save to persistent memory: {str(save_error)}")
            
            # Step 7: Update prompt manager history
            self.prompt_manager.add_to_history(user_input, structured_response["response"]["content"])
            
            print(f"✅ Response generated successfully in {processing_time:.2f}s")
            return structured_response
            
        except Exception as e:
            # Enhanced error handling
            processing_time = time.time() - start_time
            error_response = {
                "response": {
                    "content": f"I apologize, but I encountered an error while processing your request: {str(e)}",
                    "format": format_type,
                    "confidence": 0.0
                },
                "metadata": {
                    "error": True,
                    "error_type": "processing_error",
                    "error_details": str(e),
                    "timestamp": datetime.now().isoformat(),
                    "processing_time": processing_time,
                    "session_id": self.session_id
                },
                "follow_up": {
                    "suggestions": [
                        "Please try your question again",
                        "Try rephrasing your request",
                        "Contact support if the issue persists"
                    ],
                    "clarifications_needed": True
                }
            }
            
            print(f"❌ Error processing request: {str(e)}")
            return error_response
    
    def _generate_response(self, prompt: str) -> str:
        """Generate response from Gemini with retry logic"""
        max_retries = 3
        base_delay = 2  # seconds
        
        for attempt in range(max_retries):
            try:
                # Use the enhanced prompt with the model
                response = self.model.generate_content(prompt)
                return response.text
                
            except Exception as e:
                error_msg = str(e)
                
                # Check if it's a quota/rate limit error
                if "429" in error_msg or "quota" in error_msg.lower() or "rate" in error_msg.lower():
                    if attempt < max_retries - 1:
                        # Exponential backoff with jitter
                        delay = base_delay * (2 ** attempt) + random.uniform(0, 1)
                        print(f"⏳ Rate limit hit, retrying in {delay:.1f}s (attempt {attempt + 1}/{max_retries})")
                        time.sleep(delay)
                        continue
                    else:
                        return "I'm currently experiencing high demand. Please try again in a few moments. This helps me provide the best service to everyone."
                else:
                    # Non-quota error, raise immediately
                    raise Exception(f"Gemini API error: {error_msg}")
        
        # This should never be reached, but just in case
        return "I encountered an unexpected error. Please try again."
    
    def _create_structured_fallback(self, ai_response: str, format_type: str, warnings: List[str], processing_time: float) -> Dict[str, Any]:
        """Create structured response format for non-JSON responses"""
        return {
            "response": {
                "content": ai_response,
                "format": format_type,
                "confidence": 0.85
            },
            "metadata": {
                "sources": [],
                "topic": self._detect_topic(ai_response),
                "requires_followup": self._needs_followup(ai_response),
                "warnings": warnings,
                "processing_time": processing_time,
                "response_length": len(ai_response)
            },
            "follow_up": {
                "suggestions": [],
                "clarifications_needed": False
            }
        }
    
    def _detect_topic(self, response: str) -> str:
        """Simple topic detection based on keywords"""
        response_lower = response.lower()
        
        if any(word in response_lower for word in ["code", "programming", "function", "variable", "syntax"]):
            return "programming"
        elif any(word in response_lower for word in ["data", "analysis", "statistics", "chart", "graph"]):
            return "data_analysis"
        elif any(word in response_lower for word in ["explain", "definition", "meaning", "concept"]):
            return "explanation"
        elif any(word in response_lower for word in ["how", "steps", "process", "method"]):
            return "tutorial"
        else:
            return "general"
    
    def _needs_followup(self, response: str) -> bool:
        """Determine if response might need follow-up questions"""
        followup_indicators = [
            "would you like",
            "do you want",
            "need more",
            "specific",
            "clarify",
            "additional",
            "more details"
        ]
        
        return any(indicator in response.lower() for indicator in followup_indicators)
    
    def _generate_followup_suggestions(self, user_input: str, ai_response: str) -> List[str]:
        """Generate contextual follow-up suggestions"""
        suggestions = []
        
        # Analyze user input for context
        user_lower = user_input.lower()
        response_lower = ai_response.lower()
        
        if "how" in user_lower:
            suggestions.append("Would you like more details about this process?")
            suggestions.append("Do you need examples to illustrate this?")
        elif "what" in user_lower:
            suggestions.append("Would you like to see some examples?")
            suggestions.append("Should I explain any specific part in more detail?")
        elif "why" in user_lower:
            suggestions.append("Would you like to explore alternative approaches?")
            suggestions.append("Do you want to understand the underlying principles?")
        
        # Add suggestions based on response content
        if "code" in response_lower or "programming" in response_lower:
            suggestions.append("Would you like me to explain this code?")
            suggestions.append("Do you need help with implementation?")
        
        # Generic helpful suggestions if none specific
        if len(suggestions) == 0:
            suggestions = [
                "Is there anything specific you'd like me to clarify?",
                "Would you like me to explain any part in more detail?",
                "Do you have any follow-up questions about this topic?"
            ]
        
        return suggestions[:3]  # Limit to 3 suggestions
    
    def _save_interaction(self, user_input: str, ai_response: str, metadata: Dict[str, Any]):
        """Save conversation turn to persistent storage"""
        try:
            self.memory_manager.save_conversation_turn(
                session_id=self.session_id,
                user_id=self.user_id,
                user_message=user_input,
                ai_response=ai_response,
                metadata=metadata
            )
        except Exception as e:
            print(f"⚠️ Failed to save interaction: {str(e)}")
    
    def get_conversation_summary(self) -> Dict[str, Any]:
        """Get conversation summary and statistics"""
        try:
            summary = self.memory_manager.get_session_summary(self.session_id)
            
            # Add current session stats
            prompt_stats = self.prompt_manager.get_conversation_stats()
            summary.update({
                "current_session_messages": prompt_stats["total_messages"],
                "prompt_manager_stats": prompt_stats,
                "context_info": {
                    "domain": self.context.get("domain"),
                    "user_preferences": self.context.get("user_preferences")
                }
            })
            
            return summary
        except Exception as e:
            return {
                "session_id": self.session_id,
                "error": f"Could not retrieve summary: {str(e)}"
            }
    
    def clear_conversation(self):
        """Clear current conversation context"""
        self.prompt_manager.clear_history()
        print("🧹 Session context cleared (persistent history preserved)")
    
    def get_full_history(self, limit: int = 50) -> List[Dict[str, str]]:
        """Get full conversation history from MongoDB"""
        try:
            return self.memory_manager.get_conversation_history(
                self.session_id, 
                limit=limit
            )
        except Exception as e:
            print(f"⚠️ Could not retrieve full history: {str(e)}")
            return self.prompt_manager.conversation_history
    
    def update_preferences(self, preferences: Dict[str, Any]):
        """Update user preferences"""
        self.context["user_preferences"].update(preferences)
        print(f"✅ Updated user preferences: {preferences}")
    
    def get_database_stats(self) -> Dict[str, Any]:
        """Get database statistics"""
        return self.memory_manager.get_database_stats()
    
    def cleanup_old_data(self, days_old: int = 30) -> int:
        """Clean up old conversation data"""
        return self.memory_manager.cleanup_old_sessions(days_old)
    
    def __del__(self):
        """Cleanup when agent is destroyed"""
        try:
            if hasattr(self, 'memory_manager') and self.memory_manager:
                self.memory_manager.close_connection()
        except:
            pass  # Ignore cleanup errors
