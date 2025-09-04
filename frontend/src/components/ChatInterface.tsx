'use client';

import { useState, useEffect, useRef } from 'react';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import LoadingScreen from './LoadingScreen';
import { ApiService, ChatMessage as ChatMessageType } from '@/lib/api';

export default function ChatInterface() {
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    initializeSession();
  }, []);

  const initializeSession = async () => {
    try {
      setError(null);
      setIsInitializing(true);
      
      // Add a small delay for the loading animation
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const response = await ApiService.createSession();
      setSessionId(response.session_id);
      setIsInitializing(false);
    } catch (err) {
      setError('Failed to initialize chat session. Please refresh the page.');
      setIsInitializing(false);
      console.error('Failed to create session:', err);
    }
  };

  const handleSendMessage = async (message: string) => {
    if (!sessionId) {
      setError('No active session. Please refresh the page.');
      return;
    }

    // Add user message immediately
    const userMessage: ChatMessageType = { role: 'user', content: message };
    setMessages(prev => [...prev, userMessage]);
    
    setIsLoading(true);
    setError(null);

    try {
      const response = await ApiService.sendMessage(sessionId, message);
      
      // Add assistant response
      const assistantMessage: ChatMessageType = { 
        role: 'assistant', 
        content: response.response 
      };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (err) {
      setError('Failed to send message. Please try again.');
      console.error('Failed to send message:', err);
      
      // Remove the user message that failed to send
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewSession = () => {
    setMessages([]);
    setSessionId(null);
    setError(null);
    initializeSession();
  };

  return (
    <>
      <LoadingScreen show={isInitializing} />
      <div className="h-screen flex flex-col">
        {/* Navigation Header */}
        <nav className="flex-shrink-0 glass backdrop-blur-xl border-b border-white/10 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-900/10 via-blue-900/10 to-indigo-900/10" />
          <div className="relative z-10 px-6 py-4">
            <div className="flex items-center justify-between max-w-none">
              {/* Logo and Brand */}
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-purple-500 via-blue-500 to-indigo-600 flex items-center justify-center glow shadow-xl shadow-purple-500/30">
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                    </svg>
                  </div>
                  <div className="absolute inset-0 rounded-xl border-2 border-purple-400/20 animate-spin" style={{ animationDuration: '12s' }} />
                </div>
                <div>
                  <h1 className="text-lg font-bold bg-gradient-to-r from-purple-200 via-blue-200 to-indigo-200 bg-clip-text text-transparent">
                    Nebula Chat
                  </h1>
                  <p className="text-xs text-purple-300/60 font-medium">
                    Where Intelligence Meets Infinity ✨
                  </p>
                </div>
              </div>
              
              {/* Navigation Actions */}
              <div className="flex items-center gap-3">
                <button
                  onClick={handleNewSession}
                  className="px-5 py-2 text-sm font-medium text-white rounded-lg transition-all duration-300 hover:scale-105 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 shadow-md shadow-purple-500/20"
                >
                  <svg className="w-4 h-4 mr-1.5 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  New Chat
                </button>
              </div>
            </div>
          </div>
        </nav>

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* Messages Container */}
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6" style={{ scrollbarGutter: 'stable' }}>
            {messages.length === 0 && !error && (
              <div className="flex flex-col items-center justify-center min-h-full text-center py-12 max-w-2xl mx-auto">
                {/* Welcome Section */}
                <div className="mb-8">
                  <div className="relative mb-6 inline-block">
                    <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-purple-500/20 via-blue-500/20 to-indigo-500/20 flex items-center justify-center border border-purple-400/20 backdrop-blur-sm">
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-600 flex items-center justify-center glow shadow-xl shadow-purple-500/25">
                        <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                        </svg>
                      </div>
                    </div>
                    {/* Orbiting animation */}
                    <div className="absolute inset-0 border-2 border-dashed border-purple-400/15 rounded-full animate-spin" style={{ animationDuration: '20s' }} />
                    <div className="absolute top-1 left-1/2 w-1.5 h-1.5 bg-purple-400 rounded-full transform -translate-x-1/2 animate-pulse" />
                    <div className="absolute bottom-1 left-1/2 w-1 h-1 bg-blue-400 rounded-full transform -translate-x-1/2 animate-pulse" style={{ animationDelay: '1s' }} />
                  </div>
                  
                  <div className="space-y-2">
                    <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-200 via-blue-200 to-indigo-200 bg-clip-text text-transparent">
                      Welcome to the Nebula
                    </h2>
                    <p className="text-base text-purple-300/70 font-medium">
                      Where Intelligence Meets Infinity ✨
                    </p>
                    <p className="text-gray-400 text-sm leading-relaxed mt-3">
                      Embark on a cosmic journey through AI conversations.<br />
                      Experience limitless possibilities in our stellar interface.
                    </p>
                  </div>
                </div>
                
                {/* Features */}
                <div className="flex flex-wrap justify-center gap-3 text-xs">
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full glass border border-purple-500/15">
                    <div className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-pulse" />
                    <span className="text-purple-300/80">Gemini AI Core</span>
                  </div>
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full glass border border-blue-500/15">
                    <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }} />
                    <span className="text-blue-300/80">Quantum Responses</span>
                  </div>
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full glass border border-indigo-500/15">
                    <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-pulse" style={{ animationDelay: '1s' }} />
                    <span className="text-indigo-300/80">Infinite Possibilities</span>
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className="bg-gradient-to-r from-red-900/20 to-red-800/20 border border-red-500/30 text-red-300 px-6 py-4 rounded-xl backdrop-blur-sm mb-6">
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  <div>
                    <strong>Error:</strong> {error}
                  </div>
                </div>
              </div>
            )}

            {/* Messages */}
            {messages.map((message, index) => (
              <div key={index} className="message-enter">
                <ChatMessage message={message} />
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start message-enter">
                <div className="glass rounded-2xl px-6 py-4 max-w-[70%] border border-purple-500/20">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 flex items-center justify-center shadow-lg shadow-indigo-500/40">
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                      </svg>
                    </div>
                    <span className="text-sm font-medium text-purple-300">Nebula AI</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-purple-400">Thinking</span>
                    <div className="typing-indicator">
                      <div className="typing-dot"></div>
                      <div className="typing-dot"></div>
                      <div className="typing-dot"></div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </main>

        {/* Input Section */}
        <footer className="flex-shrink-0 border-t border-white/10 bg-black/20 backdrop-blur-xl">
          <div className="px-6 pt-4 pb-6">
            <div className="max-w-4xl mx-auto">
              <ChatInput 
                onSendMessage={handleSendMessage} 
                disabled={isLoading || !sessionId} 
              />
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
