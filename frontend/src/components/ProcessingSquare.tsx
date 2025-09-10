'use client';

interface ProcessingSquareProps {
  className?: string;
}

export default function ProcessingSquare({ className = "w-4 h-4" }: ProcessingSquareProps) {
  return (
    <div className={`${className} relative`}>
      {/* Main square */}
      <div className="w-full h-full bg-blue-400 rounded-sm animate-pulse" />
      
      {/* Animated border effect */}
      <div className="absolute inset-0 border-2 border-blue-300 rounded-sm animate-ping opacity-75" />
      
      {/* Subtle glow effect */}
      <div className="absolute inset-0 bg-blue-400/20 rounded-sm blur-sm animate-pulse" />
    </div>
  );
}
