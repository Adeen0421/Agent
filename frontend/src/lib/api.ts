import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface SessionResponse {
  session_id: string;
  message: string;
}

export interface ChatResponse {
  response: string;
  session_id: string;
}

export interface HistoryResponse {
  history: ChatMessage[];
  session_id: string;
}

export class ApiService {
  static async createSession(): Promise<SessionResponse> {
    const response = await api.post<SessionResponse>('/session/create');
    return response.data;
  }

  static async sendMessage(sessionId: string, message: string): Promise<ChatResponse> {
    const response = await api.post<ChatResponse>(`/chat/${sessionId}`, {
      message,
    });
    return response.data;
  }

  static async getHistory(sessionId: string): Promise<HistoryResponse> {
    const response = await api.get<HistoryResponse>(`/history/${sessionId}`);
    return response.data;
  }

  static async deleteSession(sessionId: string): Promise<void> {
    await api.delete(`/session/${sessionId}`);
  }

  static async healthCheck(): Promise<{ message: string }> {
    const response = await api.get('/');
    return response.data;
  }
}

export default ApiService;
