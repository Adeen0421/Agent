# Nebula AI Agent - Implementation Plan

This document outlines the step-by-step plan to recreate the Nebula AI Agent, a full-stack AI chat application with dual-mode operation (Basic & Enhanced) and persistent memory using **Neon (PostgreSQL)**.

## Phase 1: Project Initialization & Environment Setup

### 1.1. Directory Structure
- Create the root project folder.
- Set up the following subdirectories:
  - `backend/app`
  - `frontend`
  - `src/utils`

### 1.2. Backend Environment
- Create `backend/requirements.txt` with dependencies:
  - `fastapi`
  - `uvicorn[standard]`
  - `python-dotenv`
  - `google-generativeai`
  - `psycopg2-binary` (PostgreSQL driver)
  - `pydantic`
- Create a virtual environment and install dependencies.
- Create a `.env` file in the root for:
  - `GOOGLE_API_KEY`
  - `NEON_DATABASE_URL` (Postgres connection string)

### 1.3. Frontend Environment
- Initialize a Next.js 14 project in the `frontend` directory:
  - `npx create-next-app@latest frontend --typescript --tailwind --eslint`
- Install additional frontend dependencies:
  - `react-icons` (or `lucide-react`)
  - `axios` (optional, if not using fetch)

---

## Phase 2: Core Logic & Database (The `src` Directory)

### 2.1. Memory Management (`src/utils/memory_manager.py`)
- Implement `PostgresMemoryManager` class.
- **Features**:
  - Connect to Neon PostgreSQL using `psycopg2`.
  - Initialize Tables if not exist: 
    - `sessions` (id, created_at, metadata)
    - `conversations` (id, session_id, user_message, ai_response, timestamp)
  - Methods: `add_message`, `get_history`, `create_session`.
  - **Fallback**: Implement in-memory storage list if Database connection fails.

### 2.2. Prompt Management (`src/utils/prompt_manager.py`)
- Create `PromptManager` class to structure inputs for the AI.
- Handle context injection (e.g., user preferences, session info).

### 2.3. Agent Implementations
- **Basic Agent (`src/agent.py`)**:
  - Simple class using `google-generativeai`.
  - No persistent memory (just session-based in-memory list).
- **Enhanced Agent (`src/enhanced_agent.py`)**:
  - Inherits or composes `PostgresMemoryManager`.
  - Uses `PromptManager` for advanced queries.
  - Implements conversation history loading from SQL before generation.

---

## Phase 3: Backend API Development (`backend`)

### 3.1. API Schemas & Models
- Define Pydantic models for request/response:
  - `ChatMessage`, `ChatResponse`
  - `SessionResponse`, `HistoryResponse`
  - `EnhancedChatMessage` (includes format type, user ID)

### 3.2. Enhanced Routes (`backend/app/enhanced_routes.py`)
- Create `APIRouter` for `/api/v2`.
- Endpoints:
  - `POST /chat`: Handles structured inputs and enhanced agent logic.
  - `GET /db-stats`: Returns Neon Database health status.

### 3.3. Main Application (`backend/main.py`)
- Initialize FastAPI app.
- Configure CORS (allow `localhost:3000`).
- **Basic Routes**:
  - `POST /session/create`: Generate UUID.
  - `POST /chat/{session_id}`: Basic chat endpoint.
  - `GET /history/{session_id}`: Fetch history.
- **Integration**: Include `enhanced_routes` router.

---

## Phase 4: Frontend Development (`frontend`)

### 4.1. API Service (`frontend/src/lib/api.ts`)
- Create `ApiService` class (singleton pattern).
- Methods:
  - `createSession()`
  - `sendMessage(message, sessionId)`
  - `getHistory(sessionId)`
- Handle error states and network timeouts.

### 4.2. UI Components (`frontend/src/components`)
- **`ChatMessage.tsx`**: Component to render user vs. AI messages (styling bubbles).
- **`ChatInput.tsx`**: Text area with send button and "Enter to send" logic.
- **`ProcessingSquare.tsx`**: Animated loading indicator.
- **`ChatInterface.tsx`**: Main container managing state (`messages`, `isLoading`, `sessionId`).

### 4.3. Main Page (`frontend/src/app/page.tsx`)
- Render `ChatInterface`.
- Apply global layout and styling.

---

## Phase 5: Integration & Testing

### 5.1. Startup Scripts
- Create `start.bat` (Windows) or `start.sh` (Linux/Mac) to run both servers:
  - Backend: `uvicorn backend.main:app --reload --port 8000`
  - Frontend: `npm run dev` (port 3000)

### 5.2. Verification Steps
1. **Environment Check**: Ensure `.env` is loaded.
2. **Backend Health**: Hit `http://localhost:8000/` and check JSON response.
3. **Database Connection**: Check `http://localhost:8000/api/v2/db-stats` (or console logs).
4. **End-to-End Chat**:
   - Open frontend at `http://localhost:3000`.
   - Send a message.
   - Verify response appears.
   - Refresh page (if using Enhanced mode) to see if history persists.
