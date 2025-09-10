export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface ChatResponse {
  message: ChatMessage;
  success: boolean;
  error?: string;
}

export interface SessionResponse {
  session_id: string;
  message: string;
}

export interface ApiChatResponse {
  response: string;
  session_id: string;
}

class ApiService {
  private baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
  private sessionId: string | null = null;
  private currentAbortController: AbortController | null = null;

  async createSession(): Promise<SessionResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/session/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      this.sessionId = data.session_id;
      return data;
    } catch (error) {
      console.error('Error creating session:', error);
      throw error;
    }
  }

  async sendMessage(message: string): Promise<ChatResponse> {
    if (!this.sessionId) {
      throw new Error('No active session. Please create a session first.');
    }

    // Cancel any existing request
    if (this.currentAbortController) {
      this.currentAbortController.abort();
    }

    // Create new abort controller for this request
    this.currentAbortController = new AbortController();

    try {
      const response = await fetch(`${this.baseUrl}/chat/${this.sessionId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message }),
        signal: this.currentAbortController.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Backend response:', data); // Debug log
      
      // Handle different response formats
      let content = '';
      if (typeof data === 'string') {
        content = data;
      } else if (data.response) {
        // Handle both string and object responses
        if (typeof data.response === 'string') {
          content = data.response;
        } else if (data.response.content) {
          content = data.response.content;
        } else {
          content = JSON.stringify(data.response, null, 2);
        }
      } else if (data.message) {
        content = data.message;
      } else if (data.content) {
        content = data.content;
      } else {
        // If it's an object, try to extract meaningful content
        if (data.error) {
          content = `Error: ${data.error}`;
        } else {
          content = JSON.stringify(data, null, 2);
        }
      }
      
      // Clean up any JSON blocks that might be embedded in the content
      content = this.cleanJsonBlocks(content);
      
      // Clear the abort controller since request completed successfully
      this.currentAbortController = null;

      return {
        message: {
          id: Date.now().toString(),
          role: 'assistant',
          content: content,
          timestamp: new Date(),
        },
        success: true,
      };
    } catch (error) {
      console.error('Error sending message:', error);
      
      // Clear the abort controller
      this.currentAbortController = null;
      
      // Check if the error was due to abort
      if (error instanceof Error && error.name === 'AbortError') {
        return {
          message: {
            id: Date.now().toString(),
            role: 'assistant',
            content: 'Request cancelled.',
            timestamp: new Date(),
          },
          success: false,
          error: 'Request was cancelled',
        };
      }
      
      return {
        message: {
          id: Date.now().toString(),
          role: 'assistant',
          content: 'Sorry, I encountered an error. Please try again.',
          timestamp: new Date(),
        },
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  getSessionId(): string | null {
    return this.sessionId;
  }

  clearSession(): void {
    this.sessionId = null;
  }

  cancelCurrentRequest(): void {
    if (this.currentAbortController) {
      this.currentAbortController.abort();
      this.currentAbortController = null;
    }
  }

  private cleanJsonBlocks(content: string): string {
    // Remove JSON code blocks that might be embedded in the response
    // This handles cases where the backend returns content with embedded JSON blocks
    
    // Pattern to match ```json ... ``` blocks
    const jsonBlockPattern = /```json\s*\n?([\s\S]*?)\n?```/g;
    
    // Replace JSON blocks with just the content inside
    let cleaned = content.replace(jsonBlockPattern, (match, jsonContent) => {
      try {
        // Try to parse the JSON and extract meaningful content
        const parsed = JSON.parse(jsonContent.trim());
        if (parsed.response && parsed.response.content) {
          return parsed.response.content;
        } else if (parsed.content) {
          return parsed.content;
        } else if (parsed.message) {
          return parsed.message;
        }
        // If we can't extract meaningful content, return empty string
        return '';
      } catch (e) {
        // If JSON parsing fails, return empty string
        return '';
      }
    });
    
    // Also handle cases where the entire response might be a JSON string
    if (cleaned.trim().startsWith('{') && cleaned.trim().endsWith('}')) {
      try {
        const parsed = JSON.parse(cleaned.trim());
        if (parsed.response && parsed.response.content) {
          return parsed.response.content;
        } else if (parsed.content) {
          return parsed.content;
        } else if (parsed.message) {
          return parsed.message;
        }
      } catch (e) {
        // If parsing fails, return original content
      }
    }
    
    return cleaned;
  }
}

export const apiService = new ApiService();

// Legacy function for backward compatibility
export const sendMessage = async (message: string): Promise<ChatResponse> => {
  return apiService.sendMessage(message);
};
