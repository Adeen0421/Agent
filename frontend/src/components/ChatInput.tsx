import { useState, useRef, useEffect } from 'react';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  disabled?: boolean;
}

export default function ChatInput({ onSendMessage, disabled = false }: ChatInputProps) {
  const [message, setMessage] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !disabled) {
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

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [message]);

  return (
    <div className="relative">
      <form onSubmit={handleSubmit}>
        <div className="flex items-stretch gap-3">
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder="Message Nebula AI..."
              disabled={disabled}
              className={`w-full resize-none glass backdrop-blur-xl border rounded-2xl px-5 py-3.5 text-white placeholder-purple-300/40 focus:outline-none transition-all duration-300 min-h-[52px] max-h-32 ${
                isFocused 
                  ? 'border-purple-500/50 shadow-lg shadow-purple-500/20 bg-white/5' 
                  : 'border-purple-400/20 hover:border-purple-400/30'
              } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
              rows={1}
            />
            
            {/* Character counter */}
            {message.length > 0 && (
              <div className="absolute bottom-3 right-3 text-xs text-purple-400/50">
                {message.length}
              </div>
            )}
          </div>
        
        <button
          type="submit"
          disabled={disabled || !message.trim()}
          className={`flex-shrink-0 h-[52px] px-4 rounded-2xl font-medium text-white transition-all duration-300 flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 shadow-md shadow-purple-500/20 ${
            disabled || !message.trim()
              ? 'opacity-50 cursor-not-allowed'
              : 'hover:scale-105 hover:shadow-lg hover:shadow-purple-500/25'
          }`}
        >
          {disabled ? (
            <>
              <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Sending
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
              Send
            </>
          )}
          </button>
        </div>
      </form>
      
      {/* Typing hint - positioned outside form but inside main container */}
      {!isFocused && message.length === 0 && (
        <div className="mt-2 text-xs text-purple-400/60 text-center">
          Press Enter to send, Shift+Enter for new line
        </div>
      )}
    </div>
  );
}
