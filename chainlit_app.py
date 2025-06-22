import chainlit as cl
from src.agent import SimpleAgent
import os
from dotenv import load_dotenv
import pathlib

# Get absolute path to .env file
env_path = pathlib.Path(__file__).parent / '.env'
if not env_path.exists():
    raise ValueError(f"Could not find .env file at {env_path}")

# Load environment variables
print(f"Loading environment from: {env_path}")
load_dotenv(dotenv_path=env_path)

@cl.on_chat_start
async def start():
    """Initialize the agent when the chat starts"""
    try:
        # Initialize the agent
        agent = SimpleAgent()
        
        # Store the agent in the user session
        cl.user_session.set("agent", agent)
        
        # Create and send welcome message
        await cl.Message(content="Hello! I'm your AI assistant powered by Gemini. How can I help you today?").send()
    except Exception as e:
        await cl.Message(content=f"Error initializing agent: {str(e)}").send()

@cl.on_message
async def main(message: cl.Message):
    """Handle incoming messages from the user"""
    
    # Get the agent from the user session
    agent = cl.user_session.get("agent")  # type: SimpleAgent | None
    
    if not agent:
        await cl.Message(content="Session error: Agent not initialized. Please refresh the page.").send()
        return
    
    # Get the user's message
    user_message = message.content
    
    try:
        # Get response from the agent
        response = agent.run(user_message)
        
        # Send the response
        await cl.Message(content=response).send()
        
        # Display conversation history (optional)
        history = agent.get_history()
        if len(history) > 2:  # Show history if there are more than 2 messages
            history_text = "\n\nConversation History:\n"
            for i, msg in enumerate(history[-6:], 1):  # Show last 6 messages
                role = "You" if msg["role"] == "user" else "Assistant"
                history_text += f"{i}. {role}: {msg['content']}\n"
            
            await cl.Message(content=history_text).send()
        
    except Exception as e:
        # Handle any errors
        await cl.Message(content=f"Sorry, I encountered an error: {str(e)}").send()

if __name__ == "__main__":
    # This will be handled by Chainlit
    pass 