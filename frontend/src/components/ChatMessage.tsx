import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChatMessage as ChatMessageType } from '@/lib/api';
import AnimatedFormattedMessage from './AnimatedFormattedMessage';
import ShareModal from './ShareModal';
import { FaThumbsUp, FaThumbsDown, FaCopy, FaRedo, FaShare } from 'react-icons/fa';

interface ChatMessageProps {
  message: ChatMessageType;
  onTryAgain?: (messageId: string) => void;
  shouldStopAnimation?: boolean;
  onAnimationComplete?: () => void;
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
    <div className="relative group my-6">
      <div className="flex items-center justify-between bg-gradient-to-r from-blue-900/40 to-cyan-900/40 border border-blue-400/30 rounded-t-lg px-4 py-3 code-block-header backdrop-blur-sm">
        <span className="text-xs font-semibold text-cyan-200 uppercase tracking-wide">
          {language}
        </span>
        <button
          onClick={copyToClipboard}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-blue-600/30 hover:bg-blue-600/40 border border-blue-500/40 rounded-md transition-all duration-200 hover:scale-105"
        >
          {copied ? (
            <>
              <svg className="w-3 h-3 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-green-400 font-medium">Copied!</span>
            </>
          ) : (
            <>
              <svg className="w-3 h-3 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <span className="text-gray-200 font-medium">Copy</span>
            </>
          )}
        </button>
      </div>
      <pre className="bg-gradient-to-br from-gray-900/80 to-blue-900/40 border border-blue-400/30 rounded-b-lg p-5 overflow-x-auto code-block-content backdrop-blur-sm">
        <code className="text-sm text-gray-100 font-mono leading-relaxed whitespace-pre">
          {code}
        </code>
      </pre>
    </div>
  );
}

function FormattedMessage({ content }: FormattedMessageProps) {
  // First, convert literal \n to actual newlines in the content
  const processedContent = content.replace(/\\n/g, '\n');
  
  // Detect code blocks first - handle both normal and escaped backticks
  // Also handle cases where ```language appears on its own line
  const codeBlockRegex = /```(\w+)?\s*\n([\s\S]*?)\n```/g;
  const parts = [];
  let lastIndex = 0;
  let match;


  // Find all code blocks
  while ((match = codeBlockRegex.exec(processedContent)) !== null) {
    // Add text before code block
    if (match.index > lastIndex) {
      parts.push({
        type: 'text',
        content: processedContent.substring(lastIndex, match.index)
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
  if (lastIndex < processedContent.length) {
    parts.push({
      type: 'text',
      content: processedContent.substring(lastIndex)
    });
  }
  
  // If no code blocks found, treat entire content as text
  if (parts.length === 0) {
    parts.push({ type: 'text', content: processedContent });
  }

  const formatTextContent = (textContent: string) => {
    const lines = textContent.split('\n');
    const elements = [];
    let i = 0;
    
    
    
    const isCodeLine = (line: string) => {
      const trimmed = line.trim();
      
      // Don't treat standalone } as code unless it's part of a larger context
      if (trimmed === '}' || trimmed === '{') {
        return false;
      }
      
      
      // Clear programming constructs
      return trimmed.match(
        /^<!DOCTYPE|^<html|^<head>|^<body>|^<\/html>|^<\/head>|^<\/body>|^<script|^<\/script>|^<style|^<\/style>|^function\s+\w+\s*\(|^const\s+\w+\s*=|^let\s+\w+\s*=|^var\s+\w+\s*=|^import\s+.*from|^export\s+(default\s+)?|^class\s+\w+|^interface\s+\w+|^type\s+\w+\s*=|^enum\s+\w+|^if\s*\(.*\)\s*\{|^for\s*\(.*\)\s*\{|^while\s*\(.*\)\s*\{|^switch\s*\(.*\)\s*\{|^document\.getElementById|^window\.|^console\.(log|error|warn)|^\s*\/\/.*|^\s*\/\*|^\s*\*\/|^\s*#include|^\s*#define|^@Component|^@Injectable|^\s*return\s+|^public\s+(class|static)|^private\s+|^protected\s+|\w+\s*\{$|\w+:\s*[\w\-#%]+;?$|^\s*[\w\-]+:\s*[\w\-#%().,\s]+;?\s*$|^<\?php|^\$\w+|^if\s*\(\$|^mail\s*\(|^\$_SERVER|^\$_POST|^strip_tags|^filter_var|^trim\s*\(/
      );
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
      
      // BULLET POINTS - CHECK FIRST BEFORE ANYTHING ELSE
      if (trimmedLine.match(/^[\*\-•]\s+/) || trimmedLine.match(/^\s*[\*\-•]\s+/)) {
        console.log('BULLET DETECTED:', trimmedLine);
        // Remove the bullet character and any leading whitespace
        const bulletText = trimmedLine.replace(/^[\s]*[\*\-•]\s+/, '').trim();
        const formattedBullet = bulletText.replace(/\*\*(.*?)\*\*/g, '<span class="font-semibold text-cyan-200">$1</span>');
        elements.push(
          <div key={i} className="bullet-point">
            <div className="bullet-marker" />
            <div 
              className="bullet-content" 
              dangerouslySetInnerHTML={{ __html: formattedBullet }}
            />
          </div>
        );
        i++;
        continue;
      }
      
      // Check for orphaned ```language lines that should start a code block
      if (trimmedLine.match(/^```\w+$/)) {
        const language = trimmedLine.replace('```', '');
        const codeLines = [];
        let j = i + 1;
        
        // Collect lines until we find closing ```
        while (j < lines.length) {
          const nextLine = lines[j];
          if (nextLine.trim() === '```') {
            break;
          }
          codeLines.push(nextLine);
          j++;
        }
        
        if (codeLines.length > 0) {
          const codeContent = codeLines.join('\n');
          elements.push(
            <div key={i} className="my-3">
              <CodeBlock code={codeContent} language={language} />
            </div>
          );
          i = j + 1; // Skip past the closing ```
          continue;
        }
      }
      
      // Check for code blocks (group consecutive code lines)
      if (isCodeLine(line)) {
        const codeLines = [line];
        let j = i + 1;
        let braceCount = (line.match(/\{/g) || []).length - (line.match(/\}/g) || []).length;
        
        // Collect consecutive code lines and related content
        while (j < lines.length) {
          const nextLine = lines[j];
          const nextTrimmed = nextLine.trim();
          
          // Update brace count
          braceCount += (nextLine.match(/\{/g) || []).length - (nextLine.match(/\}/g) || []).length;
          
          // Include if it's a code line, empty line, or structural elements like } and {
          if (isCodeLine(nextLine) || 
              nextTrimmed === '' ||
              nextTrimmed === '}' || 
              nextTrimmed === '{' ||
              (nextTrimmed.includes(':') && nextTrimmed.includes(';')) ||
              (braceCount > 0 && nextTrimmed.length > 0)) {
            codeLines.push(nextLine);
            j++;
            
            // If we've closed all braces, we might be done with this code block
            if (braceCount === 0 && (nextTrimmed === '}' || nextTrimmed.includes('}'))) {
              // Look ahead to see if there's more related code
              if (j < lines.length && lines[j].trim() !== '' && !isCodeLine(lines[j])) {
                break;
              }
            }
          } else {
            break;
          }
        }
        
        const codeContent = codeLines.join('\n').trim();
        const hasMultipleCodeLines = codeLines.filter(l => isCodeLine(l) || l.trim() === '}' || l.trim() === '{').length >= 2;
        const hasStrongCodeIndicators = codeContent.includes('function') || 
                                       codeContent.includes('<!DOCTYPE') || 
                                       codeContent.includes('<script') ||
                                       codeContent.includes('const ') ||
                                       codeContent.includes('import ') ||
                                       /\w+\s*\{/.test(codeContent) ||
                                       /\w+:\s*[^;]+;/.test(codeContent);
        
        // Simple check - don't treat as code if it contains markdown or looks like explanation
        const looksLikeText = codeContent.includes('**') ||
                             /^[A-Z][a-z\s,]+.*[.!?]/.test(codeContent.split('\n')[0]);
        
        if ((hasMultipleCodeLines || hasStrongCodeIndicators || codeContent.includes('{')) && !looksLikeText) {
          const language = detectLanguage(codeContent);
          
          elements.push(
            <div key={i} className="my-3">
              <CodeBlock code={codeContent} language={language} />
            </div>
          );
          
          i = j;
          continue;
        } else {
          // Treat as regular text if it doesn't meet code block criteria
          elements.push(
            <p key={i} className="text-gray-200 leading-relaxed my-1">
              {trimmedLine}
            </p>
          );
        }
      }
      
      // Main headers (lines with **text:**** pattern or numbered sections)
      else if (trimmedLine.includes('**') && (trimmedLine.includes(':**') || trimmedLine.match(/\*\*\d+\./))) {
        const headerText = trimmedLine.replace(/\*\*(.*?):\*\*/g, '$1').replace(/\*\*(.*?)\*\*/g, '$1');
        elements.push(
          <div key={i} className="mt-6 mb-4">
            <h2 className="text-xl font-bold text-white border-b border-blue-400/40 pb-2 mb-3">
              {headerText}
            </h2>
          </div>
        );
      }
      // Sub-headers or bold statements (other **text** patterns)
      else if (trimmedLine.includes('**')) {
        const parts = trimmedLine.split(/\*\*(.*?)\*\*/g);
        elements.push(
          <div key={i} className="my-3">
            {parts.map((part, partIndex) => {
              if (partIndex % 2 === 1) {
                return (
                  <span key={partIndex} className="font-semibold text-cyan-200">
                    {part}
                  </span>
                );
              }
              return <span key={partIndex} className="text-gray-100">{part}</span>;
            })}
          </div>
        );
      }
      // Numbered lists (lines starting with number followed by period and space) - use bullet logo
      else if (trimmedLine.match(/^\d+\.\s+/)) {
        const numberMatch = trimmedLine.match(/^(\d+)\.\s+(.*)/);
        if (numberMatch) {
          const listText = numberMatch[2];
          const formattedText = listText.replace(/\*\*(.*?)\*\*/g, '<span class="font-semibold text-cyan-200">$1</span>');
          elements.push(
            <div key={i} className="bullet-point">
              <div className="bullet-marker" />
              <div 
                className="bullet-content" 
                dangerouslySetInnerHTML={{ __html: formattedText }}
              />
            </div>
          );
        }
      }
      // Regular paragraphs
      else {
        if (trimmedLine.includes('*')) {
          console.log('REGULAR PARAGRAPH WITH ASTERISK:', trimmedLine);
        }
        elements.push(
          <p key={i} className="text-gray-100 leading-relaxed my-2 text-base">
            {trimmedLine}
          </p>
        );
      }
      
      i++;
    }
    
    return elements;
  };
  
  const detectLanguage = (code: string) => {
    // More comprehensive language detection with priority order
    const lowerCode = code.toLowerCase();
    
    // HTML detection (highest priority for complete documents)
    if (code.includes('<!DOCTYPE') || (code.includes('<html') && code.includes('</html>')) || 
        (code.includes('<head>') && code.includes('<body>'))) return 'html';
    
    // Mixed HTML/CSS/JS detection (for full pages)
    if ((code.includes('<style>') || code.includes('<script>')) && 
        (code.includes('<div') || code.includes('<form') || code.includes('<input'))) return 'html';
    
    // JavaScript detection (before CSS to catch JS with CSS-like syntax)
    if (code.includes('function') || code.includes('const ') || code.includes('let ') || code.includes('=>') ||
        code.includes('document.') || code.includes('addEventListener') || code.includes('getElementById') ||
        code.includes('event.preventDefault') || /\.\w+\(/.test(code)) return 'javascript';
    
    // CSS detection (style blocks, property-value pairs)
    if ((code.includes('{') && code.includes(':') && code.includes(';')) || 
        /\w+\s*:\s*[^;]+;/.test(code) || lowerCode.includes('border-radius') || 
        lowerCode.includes('background-color') || code.includes('px;') ||
        code.includes('margin:') || code.includes('padding:') || code.includes('display:') ||
        lowerCode.includes('font-family') || lowerCode.includes('text-align') ||
        code.includes('color:') || code.includes('width:') || code.includes('height:')) return 'css';
    
    // HTML fragments
    if (code.includes('<div') || code.includes('<p>') || code.includes('<form') || 
        /^<\w+/.test(code.trim()) || /<\/\w+>$/.test(code.trim())) return 'html';
    
    // PHP detection
    if (code.includes('<?php') || code.includes('$_SERVER') || code.includes('$_POST') ||
        /^\$\w+/.test(code) || code.includes('strip_tags') || code.includes('filter_var')) return 'php';
    
    // Python detection
    if (code.includes('def ') || code.includes('import ') || code.includes('print(') || 
        code.includes('elif ') || /^\s*#/.test(code)) return 'python';
    
    // C/C++ detection
    if (code.includes('#include') || code.includes('int main') || code.includes('printf')) return 'c';
    
    // Java detection
    if (code.includes('public class') || code.includes('public static') || code.includes('System.out')) return 'java';
    
    // Shell/Bash detection
    if (code.includes('#!/bin') || /^\$\s/.test(code) || code.includes('echo ')) return 'bash';
    
    // JSON detection - only for actual API/config data
    if (code.trim().startsWith('{') && code.includes('"') && code.includes(':') &&
        (code.includes('"api"') || code.includes('"config"') || code.includes('"schema"'))) return 'json';
    
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

export default function ChatMessage({ message, onTryAgain, shouldStopAnimation = false, onAnimationComplete }: ChatMessageProps) {
  const isUser = message.role === 'user';
  const [copied, setCopied] = useState(false);
  const [liked, setLiked] = useState(false);
  const [disliked, setDisliked] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isAnimationComplete, setIsAnimationComplete] = useState(isUser);

  // Reset animation completion state when message changes
  useEffect(() => {
    setIsAnimationComplete(isUser);
  }, [message.id, isUser]);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const handleLike = () => {
    setLiked(!liked);
    if (disliked) setDisliked(false);
  };

  const handleDislike = () => {
    setDisliked(!disliked);
    if (liked) setLiked(false);
  };

  const handleTryAgain = () => {
    if (onTryAgain) {
      onTryAgain(message.id);
    }
  };

  const handleAnimationComplete = () => {
    setIsAnimationComplete(true);
    onAnimationComplete?.();
  };

  const handleShare = () => {
    setIsShareModalOpen(true);
  };
  
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-6`}>
      <div className={`flex gap-3 max-w-[80%] ${isUser ? 'flex-row-reverse' : 'flex-row'} items-start`}>
        {/* Avatar - positioned to align with the message bubble */}
        <div className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center self-start ${
          isUser 
            ? 'bg-gradient-to-br from-blue-500 via-cyan-500 to-teal-600 glow shadow-lg shadow-blue-500/40 avatar-user'
            : 'bg-gradient-to-br from-cyan-600 via-blue-600 to-teal-600 border border-blue-400/30 shadow-lg shadow-cyan-500/40 avatar-assistant'
        }`} style={{ marginTop: '1.5rem' }}>
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
        <div className="flex flex-col gap-2 min-w-0 flex-1">
          <div className="text-xs font-medium text-blue-300/70">
            {isUser ? 'You' : 'Ocean AI'}
          </div>
          <div className={`rounded-2xl px-6 py-5 ${
            isUser
              ? 'bg-gradient-to-br from-blue-600 via-cyan-600 to-teal-600 text-white shadow-xl shadow-blue-500/30 message-user'
              : 'glass border border-blue-400/30 text-gray-50 bg-gradient-to-br from-blue-900/30 to-cyan-900/30 message-assistant backdrop-blur-xl'
          }`}>
            <div className={`break-words leading-relaxed ${
              isUser ? 'whitespace-pre-wrap' : 'formatted-content'
            }`}>
              {isUser ? (
                message.content
              ) : (
                <AnimatedFormattedMessage 
                  content={message.content} 
                  speed={10} 
                  onComplete={handleAnimationComplete}
                  shouldStop={shouldStopAnimation}
                />
              )}
            </div>
            
            {/* Action buttons for AI responses */}
            {!isUser && isAnimationComplete && (
              <div className="flex items-center gap-0.5 mt-4 pt-3 border-t border-white/10">
                <button
                  onClick={copyToClipboard}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200"
                  title="Copy"
                >
                   {copied ? (
                     <svg className="w-3.5 h-3.5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                     </svg>
                   ) : (
                     <FaCopy className="w-3.5 h-3.5" />
                   )}
                </button>
                
                <button
                  onClick={handleLike}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg transition-all duration-200 ${
                    liked 
                      ? 'text-green-400 bg-green-400/10' 
                      : 'text-gray-400 hover:text-green-400 hover:bg-green-400/10'
                  }`}
                  title="Like"
                >
                   <FaThumbsUp className="w-3.5 h-3.5" />
                </button>
                
                <button
                  onClick={handleDislike}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg transition-all duration-200 ${
                    disliked 
                      ? 'text-red-400 bg-red-400/10' 
                      : 'text-gray-400 hover:text-red-400 hover:bg-red-400/10'
                  }`}
                  title="Dislike"
                >
                   <FaThumbsDown className="w-3.5 h-3.5" />
                </button>
                
                <button
                  onClick={handleTryAgain}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-400 hover:text-blue-400 hover:bg-blue-400/10 rounded-lg transition-all duration-200"
                  title="Try again"
                >
                   <FaRedo className="w-3.5 h-3.5" />
                </button>
                
                <button
                  onClick={handleShare}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-400 hover:text-cyan-400 hover:bg-cyan-400/10 rounded-lg transition-all duration-200"
                  title="Share"
                >
                   <FaShare className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Share Modal - Rendered as Portal */}
      {isShareModalOpen && createPortal(
        <ShareModal
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
          messageContent={message.content}
          messageTitle="Ocean AI Response"
        />,
        document.body
      )}
    </div>
  );
}
