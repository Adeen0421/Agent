# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

This is a simple AI agent implementation using Google's Gemini API (specifically the `gemini-2.0-flash` model) with a modern web stack: FastAPI backend and Next.js React frontend. The agent maintains conversation history and provides intelligent responses through a sleek chat interface.

## Key Architecture Components

### Core Agent (`src/agent.py`)
- **SimpleAgent class**: Main agent implementation with conversation history management
- **Gemini Integration**: Uses `google-generativeai` library with the `gemini-2.0-flash` model
- **Error Handling**: Sophisticated retry logic with exponential backoff for API quota issues
- **History Management**: Maintains up to 10 previous messages for context
- **Session Support**: Optional session ID tracking for multi-user scenarios

### FastAPI Backend (`backend/main.py`)
- **REST API**: RESTful endpoints for chat functionality replacing Chainlit
- **Session Management**: In-memory session storage with unique session IDs
- **CORS Support**: Configured for frontend communication
- **Pydantic Models**: Type-safe request/response models
- **Error Handling**: Proper HTTP status codes and error responses

### Next.js Frontend (`frontend/`)
- **React Components**: Modern React components with TypeScript
- **Tailwind CSS**: Utility-first CSS framework for styling
- **Real-time Chat**: Interactive chat interface with loading states
- **API Integration**: Axios-based API communication with the backend
- **Responsive Design**: Mobile-friendly chat interface

### Configuration
- **Environment Variables**: `GOOGLE_API_KEY` required in root `.env` file
- **Frontend Config**: Next.js configuration with API proxy setup
- **Python Config**: Uses `pyproject.toml` for dependencies and `pyrightconfig.json` for type checking

## Development Commands

### Environment Setup
```bash
# Create virtual environment for backend
python -m venv venv

# Activate virtual environment (Windows)
venv\Scripts\activate

# Install Python dependencies
pip install -r requirements.txt

# Install frontend dependencies
cd frontend
npm install
cd ..
```

### Running the Application

#### Option 1: Using the PowerShell Script (Recommended)
```powershell
# Run both backend and frontend
.\run_dev.ps1
```

#### Option 2: Manual Startup
```bash
# Terminal 1: Start FastAPI backend
cd backend
python -m uvicorn main:app --reload --port 8000

# Terminal 2: Start Next.js frontend
cd frontend
npm run dev

# Terminal 3: Run the agent directly (CLI mode, optional)
python src/agent.py
```

### Testing
```bash
# Run API tests
python test_new_api.py

# Run basic unit tests (if pytest is installed)
python -m pytest test_*.py -v
```

### Environment Configuration
- Copy `.env.example` to `.env` (if exists) or create `.env` with:
  ```
  GOOGLE_API_KEY=your_api_key_here
  ```
- API key can be obtained from [Google AI Studio](https://ai.google.dev/)

## Important Implementation Details

### API Integration Pattern
The agent uses the Gemini API with conversation history passed as context. Each new message includes relevant previous messages (up to `max_history=10`) to maintain conversational context.

### Error Handling Strategy
- **Quota Errors**: Implements exponential backoff with jitter for rate limiting
- **API Failures**: Graceful degradation with helpful user messages
- **Configuration Errors**: Clear validation of API keys and environment setup

### Session Management
The Chainlit interface stores agent instances in user sessions, allowing multiple concurrent conversations without interference.

### File Structure
```
├── src/
│   └── agent.py              # Core agent implementation
├── backend/
│   └── main.py              # FastAPI backend server
├── frontend/
│   ├── src/
│   │   ├── app/             # Next.js app directory
│   │   ├── components/      # React components
│   │   └── lib/             # API utilities
│   ├── package.json         # Frontend dependencies
│   └── next.config.js       # Next.js configuration
├── test_new_api.py         # API testing utility
├── requirements.txt        # Python dependencies
├── run_dev.ps1            # Development startup script
└── .env                   # Environment variables (gitignored)
```

## API Endpoints

- `POST /session/create` - Create a new chat session
- `POST /chat/{session_id}` - Send a message and get response
- `GET /history/{session_id}` - Get conversation history
- `DELETE /session/{session_id}` - Delete a session
- `GET /sessions` - List all sessions (debugging)

## Development Notes

- **Modern Stack**: FastAPI backend with Next.js React frontend
- **Type Safety**: TypeScript frontend with Pydantic backend models
- **Session Management**: Each chat gets a unique session ID
- **Real-time UI**: Loading states and error handling in the chat interface
- **API Communication**: RESTful API with proper error handling
- **Responsive Design**: Mobile-friendly chat interface using Tailwind CSS
- **Development Tools**: Hot reload for both backend and frontend
