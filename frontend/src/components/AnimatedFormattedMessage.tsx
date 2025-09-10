'use client';

import { useState, useEffect } from 'react';
import CodeBlock from './CodeBlock';

interface AnimatedFormattedMessageProps {
  content: string;
  speed?: number;
  onComplete?: () => void;
}

export default function AnimatedFormattedMessage({ 
  content, 
  speed = 10,
  onComplete
}: AnimatedFormattedMessageProps) {
  const [displayedContent, setDisplayedContent] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  // Process content to convert literal \n to actual newlines
  const processedContent = content.replace(/\\n/g, '\n');


  useEffect(() => {
    if (currentIndex < processedContent.length) {
      const timer = setTimeout(() => {
        // Stream multiple characters at once for ChatGPT-like speed
        const charsToAdd = Math.min(3, processedContent.length - currentIndex);
        setDisplayedContent(processedContent.substring(0, currentIndex + charsToAdd));
        setCurrentIndex(prev => prev + charsToAdd);
      }, speed);

      return () => clearTimeout(timer);
    } else if (!isComplete) {
      setIsComplete(true);
      onComplete?.();
    }
  }, [currentIndex, processedContent, speed, isComplete]);

  // Reset when content changes
  useEffect(() => {
    setDisplayedContent('');
    setCurrentIndex(0);
    setIsComplete(false);
  }, [processedContent]);

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
        elements.push(<div key={`empty-${i}`} className="h-1" />);
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
            <div key={`codeblock-${i}`} className="my-3">
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
            <div key={`codeblock2-${i}`} className="my-3">
              <CodeBlock code={codeContent} language={language} />
            </div>
          );
          
          i = j;
          continue;
        } else {
          // Treat as regular text if it doesn't meet code block criteria
          elements.push(
            <p key={`text-${i}`} className="text-gray-200 leading-relaxed my-1">
              {trimmedLine}
            </p>
          );
        }
      }
      
      // BULLET POINTS - CHECK FIRST BEFORE ANYTHING ELSE
      if (trimmedLine.match(/^[\*\-•]\s+/) || trimmedLine.match(/^\s*[\*\-•]\s+/)) {
        console.log('BULLET DETECTED in AnimatedFormattedMessage:', trimmedLine);
        const bulletText = trimmedLine.replace(/^[\s]*[\*\-•]\s+/, '').trim();
        const formattedBullet = bulletText.replace(/\*\*(.*?)\*\*/g, '<span class="font-semibold text-cyan-200">$1</span>');
        elements.push(
          <div key={`bullet-${i}`} className="bullet-point">
            <div className="bullet-marker" />
            <div 
              className="bullet-content" 
              dangerouslySetInnerHTML={{ __html: formattedBullet }}
            />
          </div>
        );
      }
      // Numbered lists (lines starting with number followed by period and space) - use bullet logo
      else if (trimmedLine.match(/^\d+\.\s+/)) {
        console.log('NUMBERED LIST DETECTED in AnimatedFormattedMessage:', trimmedLine);
        const numberMatch = trimmedLine.match(/^(\d+)\.\s+(.*)/);
        if (numberMatch) {
          const listText = numberMatch[2];
          const formattedText = listText.replace(/\*\*(.*?)\*\*/g, '<span class="font-semibold text-cyan-200">$1</span>');
          elements.push(
            <div key={`bullet2-${i}`} className="bullet-point">
              <div className="bullet-marker" />
              <div 
                className="bullet-content" 
                dangerouslySetInnerHTML={{ __html: formattedText }}
              />
            </div>
          );
        }
      }
      // Main headers (lines with **text:**** pattern or numbered sections) - more specific
      else if (trimmedLine.includes('**') && (trimmedLine.includes(':**') || trimmedLine.match(/\*\*\d+\./))) {
        const headerText = trimmedLine.replace(/\*\*(.*?):\*\*/g, '$1').replace(/\*\*(.*?)\*\*/g, '$1');
        elements.push(
          <div key={`header-${i}`} className="mt-4 mb-3">
            <h2 className="text-lg font-bold text-blue-200 border-b border-blue-400/30 pb-2">
              {headerText}
            </h2>
          </div>
        );
      }
      // Sub-headers or bold statements (other **text** patterns)
      else if (trimmedLine.includes('**')) {
        const parts = trimmedLine.split(/\*\*(.*?)\*\*/g);
        elements.push(
          <div key={`bold-${i}`} className="my-2">
            {parts.map((part, partIndex) => {
              if (partIndex % 2 === 1) {
                return (
                  <span key={`bold-part-${i}-${partIndex}`} className="font-semibold text-blue-200">
                    {part}
                  </span>
                );
              }
              return <span key={`text-part-${i}-${partIndex}`} className="text-gray-200">{part}</span>;
            })}
          </div>
        );
      }
      // Regular paragraphs
      else {
        // Check if this line contains a bullet-like pattern that wasn't caught above
        if (trimmedLine.match(/^\s*\*\s+/) || trimmedLine.match(/^\s*-\s+/) || trimmedLine.match(/^\s*•\s+/) || trimmedLine.match(/^\s*\d+\.\s+/)) {
          console.log('FALLBACK BULLET DETECTED:', trimmedLine);
          let bulletText;
          if (trimmedLine.match(/^\s*\d+\.\s+/)) {
            // Handle numbered lists
            const numberMatch = trimmedLine.match(/^\s*(\d+)\.\s+(.*)/);
            if (numberMatch) {
              bulletText = numberMatch[2].trim();
            } else {
              bulletText = trimmedLine.replace(/^\s*\d+\.\s+/, '').trim();
            }
          } else {
            // Handle regular bullets
            bulletText = trimmedLine.replace(/^\s*[\*\-•]\s+/, '').trim();
          }
          const formattedBullet = bulletText.replace(/\*\*(.*?)\*\*/g, '<span class="font-semibold text-cyan-200">$1</span>');
          elements.push(
            <div key={`bullet3-${i}`} className="bullet-point">
              <div className="bullet-marker" />
              <div 
                className="bullet-content" 
                dangerouslySetInnerHTML={{ __html: formattedBullet }}
              />
            </div>
          );
        } else {
          elements.push(
            <p key={`paragraph-${i}`} className="text-gray-200 leading-relaxed my-1 text-base">
              {trimmedLine}
            </p>
          );
        }
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
      <div>
        {formatTextContent(displayedContent)}
      </div>
      {!isComplete && (
        <div className="flex items-center gap-2">
          <div className="w-1 h-4 bg-blue-400 animate-pulse" />
          <span className="text-blue-400 text-sm animate-pulse">AI is typing...</span>
        </div>
      )}
    </div>
  );
}
