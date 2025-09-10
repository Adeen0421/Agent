'use client';

import { useState } from 'react';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  onStopGeneration?: () => void;
  isLoading: boolean;
}

export default function ChatInput({ onSendMessage, onStopGeneration, isLoading }: ChatInputProps) {
  const [message, setMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !isLoading) {
      onSendMessage(message.trim());
      setMessage('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="flex flex-col gap-1">
      {/* Input container with subtle glow and seamless styling */}
      <div className="relative">
        <form onSubmit={handleSubmit} className="flex gap-3">
          <div className="flex-1 relative">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me anything..."
              className="relative w-full px-6 py-4 pr-14 bg-transparent border border-white/5 rounded-2xl text-white placeholder-gray-400/60 focus:outline-none focus:ring-2 focus:ring-blue-400/30 focus:border-blue-400/20 resize-none transition-all duration-300 hover:border-white/10 shadow-lg shadow-blue-900/30"
              rows={1}
              style={{
                minHeight: '52px',
                maxHeight: '120px',
              }}
            />
            {isLoading ? (
              <button
                type="button"
                onClick={onStopGeneration}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 p-2.5 bg-gradient-to-r from-gray-600 to-gray-500 hover:from-gray-500 hover:to-gray-400 rounded-xl transition-all duration-200 hover:scale-105 shadow-lg shadow-gray-500/25 hover:shadow-gray-500/40"
                title="Stop generation"
              >
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 6h12v12H6z" />
                </svg>
              </button>
            ) : (
              <button
                type="submit"
                disabled={!message.trim() || isLoading}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 p-2.5 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed rounded-xl transition-all duration-200 hover:scale-105 disabled:hover:scale-100 shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40"
              >
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            )}
          </div>
        </form>
      </div>
      
      {/* Disclaimer text with improved styling */}
      <div className="text-xs text-gray-400/50 px-2 text-center leading-relaxed pb-2">
        Ocean AI can make mistakes - Check important info
      </div>
    </div>
  );
}
