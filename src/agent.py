from typing import List, Dict, Any
import os
import time
import random
from google import generativeai
from dotenv import load_dotenv
import pathlib

class SimpleAgent:
    def __init__(self):
        """Initialize the agent with Gemini configuration"""
        # Get absolute path to .env file
        env_path = pathlib.Path(os.path.dirname(os.path.dirname(__file__))) / '.env'
        if not env_path.exists():
            raise ValueError(f"Could not find .env file at {env_path}")
            
        # Load environment variables
        load_dotenv(dotenv_path=env_path)
        
        # Get and validate API key with more detailed error handling
        api_key = os.getenv("GOOGLE_API_KEY")
        if not api_key:
            raise ValueError(
                f"GOOGLE_API_KEY environment variable is not set after loading from {env_path}.\n"
                f"Please ensure the .env file contains: GOOGLE_API_KEY=your_api_key_here"
            )
        
        try:
            # Configure the Gemini API
            generativeai.configure(api_key=api_key)
            
            # Initialize the model with the new gemini-2.0-flash model
            self.model = generativeai.GenerativeModel('gemini-2.0-flash')
            
        except Exception as e:
            raise Exception(f"Failed to initialize Gemini API: {str(e)}")
        
        # Initialize conversation history
        self.history: List[Dict[str, str]] = []
        
        # Maximum history length to maintain context
        self.max_history = 10
    
    def _handle_quota_error(self, error_msg: str) -> str:
        """Handle quota exceeded errors with helpful information"""
        if "429" in error_msg and "quota" in error_msg.lower():
            return (
                "I'm currently experiencing high demand and have reached my usage limits. "
                "This is a free tier limitation. Here are your options:\n\n"
                "1. **Wait a moment** - Try again in about 1 minute\n"
                "2. **Upgrade your plan** - Visit https://ai.google.dev/gemini-api/docs/rate-limits for billing options\n"
                "3. **Use a different API key** - If you have multiple projects\n\n"
                "Free tier limits:\n"
                "- 15 requests per minute\n"
                "- 1,500 requests per day\n"
                "- 32,000 input tokens per minute\n\n"
                "I'll be back to normal shortly!"
            )
        return f"API Error: {error_msg}"
    
    def run(self, user_input: str) -> str:
        """Process user input and return a response"""
        # Add user message to history
        self.history.append({"role": "user", "content": user_input})
        
        max_retries = 3
        base_delay = 2  # seconds
        
        for attempt in range(max_retries):
            try:
                # Create chat using history for context
                chat = self.model.start_chat(history=[
                    {"role": msg["role"], "parts": [msg["content"]]} 
                    for msg in self.history[-self.max_history:]
                ])
                
                # Get response from the model
                response = chat.send_message(user_input)
                response_text = response.text
                
                # Add assistant response to history
                self.history.append({"role": "assistant", "content": response_text})
                
                return response_text
                
            except Exception as e:
                error_msg = str(e)
                
                # Check if it's a quota error
                if "429" in error_msg and "quota" in error_msg.lower():
                    if attempt < max_retries - 1:
                        # Calculate delay with exponential backoff and jitter
                        delay = base_delay * (2 ** attempt) + random.uniform(0, 1)
                        time.sleep(delay)
                        continue
                    else:
                        # Final attempt failed, return helpful error message
                        return self._handle_quota_error(error_msg)
                else:
                    # Non-quota error, raise immediately
                    raise Exception(f"Error communicating with Gemini: {error_msg}\nAPI Key status: {'Set' if os.getenv('GOOGLE_API_KEY') else 'Not Set'}")
        
        # This should never be reached, but just in case
        return "An unexpected error occurred. Please try again."
    
    def get_history(self) -> List[Dict[str, str]]:
        """Return the conversation history"""
        return self.history

def main():
    # Initialize the agent
    agent = SimpleAgent()
    
    # Example task
    task = "What is the capital of France?"
    response = agent.run(task)
    print(f"Task: {task}")
    print(f"Response: {response}")

if __name__ == "__main__":
    main() 