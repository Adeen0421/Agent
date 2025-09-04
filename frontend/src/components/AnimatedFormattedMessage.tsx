'use client';

import { useState, useEffect } from 'react';
import CodeBlock from './CodeBlock';

interface AnimatedFormattedMessageProps {
  content: string;
  speed?: number;
}

export default function AnimatedFormattedMessage({ 
  content, 
  speed = 10 
}: AnimatedFormattedMessageProps) {
  const [displayedContent, setDisplayedContent] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    if (currentIndex < content.length) {
      const timer = setTimeout(() => {
        // Stream multiple characters at once for ChatGPT-like speed
        const charsToAdd = Math.min(3, content.length - currentIndex);
        setDisplayedContent(content.substring(0, currentIndex + charsToAdd));
        setCurrentIndex(prev => prev + charsToAdd);
      }, speed);

      return () => clearTimeout(timer);
    } else if (!isComplete) {
      setIsComplete(true);
    }
  }, [currentIndex, content, speed, isComplete]);

  // Reset when content changes
  useEffect(() => {
    setDisplayedContent('');
    setCurrentIndex(0);
    setIsComplete(false);
  }, [content]);

  const formatTextContent = (textContent: string) => {
    const lines = textContent.split('\n');
    const elements = [];
    let i = 0;
    
    const isCodeLine = (line: string) => {
      const trimmed = line.trim();
      return trimmed.match(/^<[^>]+>$|^<!DOCTYPE|^<\w+|^<\/\w+>$|^\{|^\}$|^\w+\s*\{|^\s*\w+:.*[;}]$|^function\s|^const\s|^let\s|^var\s|^import\s|^export\s/);
    };
    
    while (i < lines.length) {
      const line = lines[i];
      const trimmedLine = line.trim();
      
      // Skip empty lines
      if (!trimmedLine) {
        elements.push(<div key={i} className="h-1" />);
        i++;
        continue;
      }
      
      // Check for code blocks (group consecutive code lines)
      if (isCodeLine(line)) {
        const codeLines = [line];
        let j = i + 1;
        
        // Collect consecutive code lines
        while (j < lines.length && (isCodeLine(lines[j]) || lines[j].trim() === '')) {
          codeLines.push(lines[j]);
          j++;
        }
        
        const codeContent = codeLines.join('\n').trim();
        const language = detectLanguage(codeContent);
        
        elements.push(
          <div key={i} className="my-3">
            <CodeBlock code={codeContent} language={language} />
          </div>
        );
        
        i = j;
        continue;
      }
      
      // Main headers (lines with **text:**** pattern)
      if (trimmedLine.includes('**') && (trimmedLine.includes(':**') || trimmedLine.includes('Cars:**'))) {
        const headerText = trimmedLine.replace(/\*\*(.*?):\*\*/g, '$1').replace(/\*\*(.*?)\*\*/g, '$1');
        elements.push(
          <div key={i} className="mt-4 mb-3">
            <h2 className="text-lg font-bold text-purple-200 border-b border-purple-400/30 pb-2">
              {headerText}
            </h2>
          </div>
        );
      }
      // Sub-headers or bold statements (other **text** patterns)
      else if (trimmedLine.includes('**')) {
        const parts = trimmedLine.split(/\*\*(.*?)\*\*/g);
        elements.push(
          <div key={i} className="my-2">
            {parts.map((part, partIndex) => {
              if (partIndex % 2 === 1) {
                return (
                  <span key={partIndex} className="font-semibold text-blue-200">
                    {part}
                  </span>
                );
              }
              return <span key={partIndex} className="text-gray-200">{part}</span>;
            })}
          </div>
        );
      }
      // Bullet points (lines starting with * or - followed by space)
      else if (trimmedLine.match(/^[\*\-]\s+/)) {
        const bulletText = trimmedLine.replace(/^[\*\-]\s+/, '');
        const formattedBullet = bulletText.replace(/\*\*(.*?)\*\*/g, '<span class="font-semibold text-blue-200">$1</span>');
        elements.push(
          <div key={i} className="flex items-start gap-3 ml-2 my-2">
            <div className="w-2 h-2 bg-purple-400 rounded-full mt-2 flex-shrink-0" />
            <div 
              className="text-gray-200 leading-relaxed flex-1" 
              dangerouslySetInnerHTML={{ __html: formattedBullet }}
            />
          </div>
        );
      }
      // Regular paragraphs
      else {
        elements.push(
          <p key={i} className="text-gray-200 leading-relaxed my-1">
            {trimmedLine}
          </p>
        );
      }
      
      i++;
    }
    
    return elements;
  };
  
  const detectLanguage = (code: string) => {
    if (code.includes('<!DOCTYPE') || code.includes('<html') || code.includes('<div') || code.includes('<p>')) return 'html';
    if (code.includes('function') || code.includes('const ') || code.includes('let ') || code.includes('=>')) return 'javascript';
    if (code.includes('def ') || code.includes('import ') || code.includes('print(')) return 'python';
    if (code.includes('#include') || code.includes('int main')) return 'c';
    if (code.includes('public class') || code.includes('public static')) return 'java';
    if (code.includes('{') && code.includes(':') && code.includes(';')) return 'css';
    return 'text';
  };

  return (
    <div className="space-y-2">
      <div>
        {formatTextContent(displayedContent)}
      </div>
      {!isComplete && (
        <div className="flex items-center gap-2">
          <div className="w-1 h-4 bg-purple-400 animate-pulse" />
          <span className="text-purple-400 text-sm animate-pulse">AI is typing...</span>
        </div>
      )}
    </div>
  );
}
