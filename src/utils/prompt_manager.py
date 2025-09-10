from typing import Dict, List, Optional, Any
import json
import re
from datetime import datetime
from dataclasses import dataclass

@dataclass
class PromptConfig:
    max_history: int = 10
    summary_threshold: int = 8
    temperature: float = 0.7
    top_p: float = 0.95
    max_tokens: int = 4096
    
    # Guardrails
    safety_filters: Optional[Dict[str, bool]] = None
    allowed_topics: Optional[List[str]] = None
    restricted_topics: Optional[List[str]] = None
    
    def __post_init__(self):
        if self.safety_filters is None:
            self.safety_filters = {
                "profanity": False,
                "harmful_content": True,
                "spam_detection": False,
                "off_topic": False
            }
        if self.allowed_topics is None:
            self.allowed_topics = ["general", "programming", "analysis", "help", "technology", "science", "automotive", "gaming", "entertainment", "sports", "business", "education", "travel", "food", "health", "lifestyle", "music", "movies", "books", "art", "history", "culture"]
        if self.restricted_topics is None:
            self.restricted_topics = ["illegal", "harmful", "inappropriate", "violence", "hate"]

class GuardrailsFilter:
    """Input/Output safety and topic filters"""
    
    def __init__(self, config: PromptConfig):
        self.config = config
        
        # Harmful content patterns
        self.harmful_patterns = [
            r'\b(hack|crack|pirate|illegal|drugs|violence)\b',
            r'\b(suicide|self.harm|hurt.yourself)\b',
            r'\b(bomb|weapon|attack|terror)\b',
            r'\b(murder|kill|death|poison)\b'
        ]
        
        # Spam patterns - only extremely obvious spam
        self.spam_patterns = [
            r'(.)\1{20,}',  # Only very long repeated characters (20+)
            r'\b(buy now|click here|free money)\b',  # Obvious promotional
        ]
        
        # Off-topic patterns (customize for your domain)
        self.off_topic_patterns = [
            r'\b(weather today|sports scores|celebrities|gossip|astrology)\b'
        ]
        
        # Profanity patterns (basic set)
        self.profanity_patterns = [
            r'\b(fuck|shit|damn|hell|ass|bitch)\b'
        ]
    
    def validate_input(self, user_input: str) -> Dict[str, Any]:
        """Validate user input against guardrails"""
        result = {
            "is_valid": True,
            "reason": "",
            "filtered_content": user_input,
            "warnings": []
        }
        
        # Check for harmful content
        if self.config.safety_filters and self.config.safety_filters.get("harmful_content", True):
            for pattern in self.harmful_patterns:
                if re.search(pattern, user_input.lower()):
                    result["is_valid"] = False
                    result["reason"] = "Content violates safety guidelines. Please ask something else."
                    return result
        
        # Check for spam
        if self.config.safety_filters and self.config.safety_filters.get("spam_detection", True):
            for pattern in self.spam_patterns:
                if re.search(pattern, user_input, re.IGNORECASE):
                    result["is_valid"] = False
                    result["reason"] = "Message appears to be spam or promotional content."
                    return result
        
        # Check for profanity (warning only, not blocking)
        if self.config.safety_filters and self.config.safety_filters.get("profanity", True):
            for pattern in self.profanity_patterns:
                if re.search(pattern, user_input.lower()):
                    result["warnings"].append("Please keep the conversation professional")
        
        # Check for off-topic (warning only)
        if self.config.safety_filters and self.config.safety_filters.get("off_topic", True):
            for pattern in self.off_topic_patterns:
                if re.search(pattern, user_input.lower()):
                    result["warnings"].append("This question might be outside my expertise area")
        
        # Length checks
        if len(user_input.strip()) < 3:
            result["is_valid"] = False
            result["reason"] = "Message is too short. Please provide more details."
            return result
        
        if len(user_input) > 5000:
            result["is_valid"] = False
            result["reason"] = "Message is too long. Please break it into smaller parts."
            return result
        
        return result
    
    def validate_output(self, ai_response: str) -> Dict[str, Any]:
        """Validate AI output for safety"""
        result = {
            "is_valid": True,
            "reason": "",
            "filtered_content": ai_response
        }
        
        # Check AI didn't generate harmful content
        for pattern in self.harmful_patterns:
            if re.search(pattern, ai_response.lower()):
                result["is_valid"] = False
                result["reason"] = "AI response contains unsafe content"
                result["filtered_content"] = "I apologize, but I can't provide that information. Is there something else I can help you with?"
                return result
        
        return result

class ConversationSummarizer:
    """Handles conversation summarization when context gets too long"""
    
    @staticmethod
    def summarize_conversation(history: List[Dict[str, str]], keep_recent: int = 3) -> str:
        """Summarize older conversation history"""
        if len(history) <= keep_recent:
            return ""
        
        # Take messages to summarize (exclude recent ones)
        to_summarize = history[:-keep_recent]
        
        # Create summary
        summary_parts = []
        user_topics = []
        
        for msg in to_summarize:
            role = msg["role"]
            content = msg["content"]
            
            if role == "user":
                # Extract key topics from user messages
                if "how" in content.lower():
                    user_topics.append("asked about procedures")
                elif "what" in content.lower():
                    user_topics.append("asked for definitions")
                elif "why" in content.lower():
                    user_topics.append("asked for explanations")
                else:
                    # Truncate long content
                    short_content = content[:80] + "..." if len(content) > 80 else content
                    user_topics.append(f"discussed {short_content.lower()}")
        
        if user_topics:
            summary = f"Earlier in our conversation, the user {', '.join(user_topics[:3])}"
            if len(user_topics) > 3:
                summary += f" and {len(user_topics) - 3} other topics"
            return summary + "."
        
        return "Earlier conversation covered various topics."

# Enhanced master prompt with better structure
MASTER_PROMPT = """You are Nebula AI, an intelligent and helpful assistant with the following capabilities:

## Core Identity & Behavior
- You are knowledgeable, professional, and friendly
- You provide accurate, detailed, and practical responses
- You maintain context across our conversation
- You follow ethical guidelines and safety standards
- You handle complex topics with clarity and precision

## Response Guidelines
- Format: {format_type}
- Maximum response length: {max_tokens} tokens
- Creativity level: {temperature}
- Domain focus: {domain}
- Current time: {current_time}

## Conversation Context
{conversation_context}

## User Information
- Session ID: {session_id}
- User preferences: {user_preferences}
- Primary domain: {domain}

## Content Guidelines
- Allowed topics: {allowed_topics}
- Keep responses appropriate and helpful
- If asked about restricted topics, politely decline and suggest alternatives
- Provide sources when making factual claims
- Admit when you're uncertain about information

## Output Structure for JSON responses
When responding in JSON format, use this structure:
{{
    "response": {{
        "content": "Your detailed response here",
        "format": "{format_type}",
        "confidence": 0.9,
        "topic_category": "detected_category"
    }},
    "metadata": {{
        "sources": ["source1", "source2"],
        "keywords": ["key1", "key2"],
        "requires_followup": false,
        "complexity_level": "beginner|intermediate|advanced"
    }},
    "follow_up": {{
        "suggestions": ["suggestion1", "suggestion2"],
        "clarifications_needed": false,
        "related_topics": ["topic1", "topic2"]
    }}
}}

## Current User Query
{user_input}

Please provide a helpful, accurate, and appropriately formatted response:"""

class PromptManager:
    def __init__(self, config: Optional[PromptConfig] = None):
        self.config = config or PromptConfig()
        self.guardrails = GuardrailsFilter(self.config)
        self.summarizer = ConversationSummarizer()
        self.conversation_history: List[Dict[str, str]] = []
        self.conversation_summary = ""
    
    def build_prompt(self, 
                    user_input: str,
                    format_type: str = "markdown",
                    context: Optional[Dict] = None) -> Dict[str, Any]:
        """Build complete prompt with safety checks and context management"""
        
        # Validate input first
        input_validation = self.guardrails.validate_input(user_input)
        if not input_validation["is_valid"]:
            return {
                "error": True,
                "message": input_validation["reason"],
                "prompt": None,
                "suggestions": [
                    "Please rephrase your question",
                    "Try asking about a different topic",
                    "Make sure your message follows our guidelines"
                ]
            }
        
        # Manage conversation history
        if len(self.conversation_history) > self.config.summary_threshold:
            self.conversation_summary = self.summarizer.summarize_conversation(
                self.conversation_history,
                keep_recent=self.config.max_history
            )
            # Keep only recent messages
            self.conversation_history = self.conversation_history[-self.config.max_history:]
        
        # Build context
        conversation_context = self._format_conversation_context()
        
        # Prepare context variables
        context = context or {}
        prompt_vars = {
            "format_type": format_type,
            "max_tokens": self.config.max_tokens,
            "temperature": self.config.temperature,
            "conversation_context": conversation_context,
            "session_id": context.get("session_id", "unknown"),
            "user_preferences": json.dumps(context.get("user_preferences", {})),
            "domain": context.get("domain", "general"),
            "allowed_topics": ", ".join(self.config.allowed_topics or ["general"]),
            "user_input": user_input,
            "current_time": datetime.now().strftime("%Y-%m-%d %H:%M:%S UTC")
        }
        
        # Build final prompt
        final_prompt = MASTER_PROMPT.format(**prompt_vars)
        
        return {
            "error": False,
            "prompt": final_prompt,
            "warnings": input_validation.get("warnings", []),
            "context": context,
            "estimated_tokens": len(final_prompt.split()) * 1.3  # Rough estimate
        }
    
    def _format_conversation_context(self) -> str:
        """Format conversation history for prompt inclusion"""
        context_parts = []
        
        # Add summary if exists
        if self.conversation_summary:
            context_parts.append(f"Previous context: {self.conversation_summary}")
        
        # Add recent conversation
        if self.conversation_history:
            context_parts.append("Recent conversation:")
            for i, msg in enumerate(self.conversation_history[-6:]):  # Last 6 messages
                role = "User" if msg["role"] == "user" else "Assistant"
                content = msg["content"]
                # Truncate very long messages
                if len(content) > 300:
                    content = content[:300] + "... [truncated]"
                context_parts.append(f"{i+1}. {role}: {content}")
        else:
            context_parts.append("This is the start of a new conversation.")
        
        return "\n".join(context_parts)
    
    def add_to_history(self, user_input: str, ai_response: str):
        """Add interaction to conversation history"""
        self.conversation_history.extend([
            {"role": "user", "content": user_input},
            {"role": "assistant", "content": ai_response}
        ])
    
    def validate_ai_response(self, response: str) -> Dict[str, Any]:
        """Validate AI response before returning to user"""
        return self.guardrails.validate_output(response)
    
    def clear_history(self):
        """Clear conversation history"""
        self.conversation_history = []
        self.conversation_summary = ""
    
    def get_conversation_stats(self) -> Dict[str, Any]:
        """Get statistics about the current conversation"""
        total_messages = len(self.conversation_history)
        user_messages = len([msg for msg in self.conversation_history if msg["role"] == "user"])
        assistant_messages = len([msg for msg in self.conversation_history if msg["role"] == "assistant"])
        
        return {
            "total_messages": total_messages,
            "user_messages": user_messages,
            "assistant_messages": assistant_messages,
            "has_summary": bool(self.conversation_summary),
            "summary_length": len(self.conversation_summary) if self.conversation_summary else 0
        }
