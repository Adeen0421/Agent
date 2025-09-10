'use client';

interface LoadingScreenProps {
  show: boolean;
}

export default function LoadingScreen({ show }: LoadingScreenProps) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center glass">
      <div className="text-center">
        {/* Animated cosmic logo */}
        <div className="relative mb-8">
          <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-blue-500 via-cyan-500 to-teal-600 flex items-center justify-center glow animate-pulse shadow-2xl shadow-blue-500/50">
            <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
          </div>
          
          {/* Orbiting rings */}
          <div className="absolute inset-0 rounded-full border-2 border-dashed border-blue-400/30 animate-spin" 
               style={{ animationDuration: '4s' }} />
          <div className="absolute inset-2 rounded-full border border-blue-400/20 animate-spin" 
               style={{ animationDuration: '2s', animationDirection: 'reverse' }} />
        </div>

        {/* Loading text */}
        <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-blue-200 via-cyan-200 to-teal-200 bg-clip-text text-transparent glow-text">
          Initializing Ocean
        </h2>
        
        {/* Loading dots */}
        <div className="flex justify-center gap-2 mb-6">
          <div className="typing-dot bg-blue-400" style={{ animationDelay: '0s' }} />
          <div className="typing-dot bg-blue-400" style={{ animationDelay: '0.2s' }} />
          <div className="typing-dot bg-blue-400" style={{ animationDelay: '0.4s' }} />
        </div>
        
        <p className="text-blue-300/80 text-sm font-medium">Connecting to the oceanic intelligence...</p>
      </div>
    </div>
  );
}
