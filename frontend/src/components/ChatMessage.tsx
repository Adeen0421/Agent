import { useState } from 'react';
import { ChatMessage as ChatMessageType } from '@/lib/api';
import AnimatedFormattedMessage from './AnimatedFormattedMessage';

interface ChatMessageProps {
  message: ChatMessageType;
}

interface FormattedMessageProps {
  content: string;
}

interface CodeBlockProps {
  code: string;
  language?: string;
}

function CodeBlock({ code, language = 'text' }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  return (
    <div className="relative group my-4">
      <div className="flex items-center justify-between bg-gray-800/50 border border-purple-400/20 rounded-t-lg px-4 py-2">
        <span className="text-xs font-medium text-purple-300 uppercase">
          {language}
        </span>
        <button
          onClick={copyToClipboard}
          className="flex items-center gap-1.5 px-2 py-1 text-xs bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 rounded transition-colors"
        >
          {copied ? (
            <>
              <svg className="w-3 h-3 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-green-400">Copied!</span>
            </>
          ) : (
            <>
              <svg className="w-3 h-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <span className="text-gray-300">Copy</span>
            </>
          )}
        </button>
      </div>
      <pre className="bg-gray-900/50 border border-purple-400/20 rounded-b-lg p-4 overflow-x-auto">
        <code className="text-sm text-gray-200 font-mono leading-relaxed whitespace-pre">
          {code}
        </code>
      </pre>
    </div>
  );
}

function FormattedMessage({ content }: FormattedMessageProps) {
  // Detect code blocks first
  const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
  const parts = [];
  let lastIndex = 0;
  let match;

  // Find all code blocks
  while ((match = codeBlockRegex.exec(content)) !== null) {
    // Add text before code block
    if (match.index > lastIndex) {
      parts.push({
        type: 'text',
        content: content.substring(lastIndex, match.index)
      });
    }
    
    // Add code block
    parts.push({
      type: 'code',
      language: match[1] || 'text',
      content: match[2].trim()
    });
    
    lastIndex = match.index + match[0].length;
  }
  
  // Add remaining text
  if (lastIndex < content.length) {
    parts.push({
      type: 'text',
      content: content.substring(lastIndex)
    });
  }
  
  // If no code blocks found, treat entire content as text
  if (parts.length === 0) {
    parts.push({ type: 'text', content });
  }

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
      {parts.map((part, index) => {
        if (part.type === 'code') {
          return (
            <CodeBlock 
              key={index} 
              code={part.content} 
              language={part.language} 
            />
          );
        } else {
          return (
            <div key={index}>
              {formatTextContent(part.content)}
            </div>
          );
        }
      })}
    </div>
  );
}

export default function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user';
  
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-6`}>
      <div className={`flex gap-3 max-w-[80%] ${isUser ? 'flex-row-reverse' : 'flex-row'} items-start`}>
        {/* Avatar */}
        <div className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${
          isUser 
            ? 'bg-gradient-to-br from-purple-500 via-blue-500 to-indigo-600 glow shadow-lg shadow-purple-500/40'
            : 'bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 border border-purple-400/30 shadow-lg shadow-indigo-500/40'
        }`}>
          {isUser ? (
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          ) : (
            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
          )}
        </div>
        
        {/* Message Content */}
        <div className="flex flex-col gap-1">
          <div className="text-xs font-medium text-purple-400/80">
            {isUser ? 'You' : 'Nebula AI'}
          </div>
          <div className={`rounded-2xl px-5 py-4 ${
            isUser
              ? 'bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-600 text-white shadow-xl shadow-purple-500/30'
              : 'glass border border-purple-400/20 text-gray-100 bg-gradient-to-br from-indigo-900/20 to-purple-900/20'
          }`}>
            <div className={`break-words leading-relaxed ${
              isUser ? 'whitespace-pre-wrap' : 'formatted-content'
            }`}>
              {isUser ? (
                message.content
              ) : (
                <AnimatedFormattedMessage content={message.content} speed={10} />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
