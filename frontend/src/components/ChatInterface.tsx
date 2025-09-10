'use client';

import { useState, useRef, useEffect } from 'react';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import { ChatMessage as ChatMessageType, apiService } from '@/lib/api';

export default function ChatInterface() {
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
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
      
      const response = await apiService.createSession();
      setIsInitializing(false);
    } catch (err) {
      setError('Failed to initialize chat session. Please refresh the page.');
      setIsInitializing(false);
      console.error('Failed to create session:', err);
    }
  };

  const handleSendMessage = async (content: string) => {
    if (!apiService.getSessionId()) {
      setError('No active session. Please refresh the page.');
      return;
    }

    // Add user message immediately
    const userMessage: ChatMessageType = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setError(null);

    try {
      const response = await apiService.sendMessage(content);
      if (response.success) {
        setMessages(prev => [...prev, response.message]);
      } else {
        // Handle error case
        const errorMessage: ChatMessageType = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: response.error || 'Sorry, I encountered an error. Please try again.',
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, errorMessage]);
      }
    } catch (error) {
      setError('Failed to send message. Please try again.');
      console.error('Failed to send message:', error);
      
      // Remove the user message that failed to send
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewSession = () => {
    setMessages([]);
    apiService.clearSession();
    setError(null);
    initializeSession();
  };

  const handleTryAgain = async (messageId: string) => {
    // Find the user message that corresponds to this AI response
    const messageIndex = messages.findIndex(msg => msg.id === messageId);
    if (messageIndex === -1) return;
    
    // Find the previous user message
    let userMessageIndex = -1;
    for (let i = messageIndex - 1; i >= 0; i--) {
      if (messages[i].role === 'user') {
        userMessageIndex = i;
        break;
      }
    }
    
    if (userMessageIndex === -1) return;
    
    const userMessage = messages[userMessageIndex];
    
    // Remove the AI response and any subsequent messages
    setMessages(prev => prev.slice(0, messageIndex));
    
    // Regenerate the AI response
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await apiService.sendMessage(userMessage.content);
      if (response.success) {
        setMessages(prev => [...prev, response.message]);
      } else {
        const errorMessage: ChatMessageType = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: response.error || 'Sorry, I encountered an error. Please try again.',
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, errorMessage]);
      }
    } catch (error) {
      setError('Failed to send message. Please try again.');
      console.error('Failed to send message:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isInitializing) {
    return (
      <div className="h-screen flex items-center justify-center bg-black/90">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-blue-600 via-cyan-600 to-teal-600 flex items-center justify-center glow shadow-xl shadow-blue-500/25 animate-pulse">
            <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Initializing Ocean AI</h2>
          <p className="text-blue-300/70">Diving into the deep blue...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-black/90 relative overflow-hidden">
      {/* Deep Ocean Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-black via-blue-900/20 to-cyan-900/10"></div>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900/10 via-transparent to-transparent"></div>
      
      {/* Floating Ocean Particles */}
      <div className="absolute top-20 left-10 w-32 h-32 bg-blue-500/10 rounded-full blur-xl animate-pulse"></div>
      <div className="absolute top-40 right-20 w-24 h-24 bg-cyan-500/10 rounded-full blur-xl animate-pulse" style={{ animationDelay: '2s' }}></div>
      <div className="absolute bottom-40 left-1/4 w-40 h-40 bg-teal-500/10 rounded-full blur-xl animate-pulse" style={{ animationDelay: '4s' }}></div>

      {/* Main Content */}
      <div className="relative z-10 flex flex-col h-screen">
        {/* Navigation Header */}
        <nav className="flex-shrink-0 relative overflow-hidden">
          <div className="relative z-10 px-6 py-3">
            <div className="flex items-center justify-between max-w-none">
              {/* Logo and Brand */}
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500 via-cyan-500 to-teal-600 flex items-center justify-center glow shadow-xl shadow-blue-500/30">
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                    </svg>
                  </div>
                  <div className="absolute inset-0 rounded-xl border-2 border-blue-400/20 animate-spin" style={{ animationDuration: '12s' }} />
                </div>
                <div>
                  <h1 className="text-lg font-bold bg-gradient-to-r from-blue-200 via-cyan-200 to-teal-200 bg-clip-text text-transparent">
                    Ocean Chat
                  </h1>
                  <p className="text-xs text-blue-300/60 font-medium">
                    Where Intelligence Meets the Deep Blue ✨
                  </p>
                </div>
              </div>
              
              {/* Navigation Actions */}
              <div className="flex items-center gap-3">
                <button
                  onClick={handleNewSession}
                  className="px-5 py-2 text-sm font-medium text-white rounded-lg transition-all duration-300 hover:scale-105 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 shadow-md shadow-blue-500/20"
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
          <div className="flex-1 overflow-y-auto px-6 py-3 space-y-6" style={{ scrollbarGutter: 'stable' }}>
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

            {messages.length === 0 && !error && (
              <div className="flex flex-col items-center justify-center min-h-full text-center py-12 max-w-2xl mx-auto">
                {/* Welcome Section */}
                <div className="mb-8">
                  <div className="relative mb-6 inline-block">
                    <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-blue-500/20 via-cyan-500/20 to-teal-500/20 flex items-center justify-center border border-blue-400/20 backdrop-blur-sm">
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-600 via-cyan-600 to-teal-600 flex items-center justify-center glow shadow-xl shadow-blue-500/25">
                        <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                        </svg>
                      </div>
                    </div>
                    {/* Orbiting animation */}
                    <div className="absolute inset-0 border-2 border-dashed border-blue-400/15 rounded-full animate-spin" style={{ animationDuration: '20s' }} />
                    <div className="absolute top-1 left-1/2 w-1.5 h-1.5 bg-blue-400 rounded-full transform -translate-x-1/2 animate-pulse" />
                    <div className="absolute bottom-1 left-1/2 w-1 h-1 bg-blue-400 rounded-full transform -translate-x-1/2 animate-pulse" style={{ animationDelay: '1s' }} />
                  </div>
                  
                  <div className="space-y-2">
                    <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-200 via-cyan-200 to-teal-200 bg-clip-text text-transparent">
                      Welcome to the Deep Blue
                    </h2>
                    <p className="text-base text-blue-300/70 font-medium">
                      Where Intelligence Meets the Ocean Depths ✨
                    </p>
                    <p className="text-gray-400 text-sm leading-relaxed mt-3">
                      Dive into the depths of AI conversations.<br />
                      Experience limitless possibilities in our oceanic interface.
                    </p>
                  </div>
                </div>
                
                {/* Features */}
                <div className="flex flex-wrap justify-center gap-3 text-xs">
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full glass border border-blue-500/15">
                    <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse" />
                    <span className="text-blue-300/80">Ocean AI Core</span>
                  </div>
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full glass border border-cyan-500/15">
                    <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }} />
                    <span className="text-cyan-300/80">Deep Responses</span>
                  </div>
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full glass border border-teal-500/15">
                    <div className="w-1.5 h-1.5 bg-teal-400 rounded-full animate-pulse" style={{ animationDelay: '1s' }} />
                    <span className="text-teal-300/80">Oceanic Possibilities</span>
                  </div>
                </div>
              </div>
            )}

            {/* Messages */}
            {messages.map((message) => (
              <div key={message.id} className="message-enter">
                <ChatMessage message={message} onTryAgain={handleTryAgain} />
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start message-enter">
                <div className="glass rounded-2xl px-6 py-4 max-w-[70%] border border-blue-500/20">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-600 via-blue-600 to-teal-600 flex items-center justify-center shadow-lg shadow-cyan-500/40">
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                      </svg>
                    </div>
                    <span className="text-sm font-medium text-blue-300">Ocean AI</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-blue-400">Thinking</span>
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
        <footer className="flex-shrink-0 relative">
          <div className="relative px-6 pt-8 pb-4">
            <div className="max-w-4xl mx-auto">
              <ChatInput 
                onSendMessage={handleSendMessage} 
                isLoading={isLoading || !apiService.getSessionId()} 
              />
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
