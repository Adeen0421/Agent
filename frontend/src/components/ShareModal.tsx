'use client';

import { useState, useEffect } from 'react';
import { FaCopy, FaTwitter, FaLinkedin, FaReddit, FaTimes } from 'react-icons/fa';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  messageContent: string;
  messageTitle?: string;
}

export default function ShareModal({ isOpen, onClose, messageContent, messageTitle = "Ocean AI Response" }: ShareModalProps) {
  const [copied, setCopied] = useState(false);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    // Cleanup on unmount
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy link:', error);
    }
  };

  const handleShareToX = () => {
    const text = `Check out this response from Ocean AI: "${messageContent.substring(0, 100)}${messageContent.length > 100 ? '...' : ''}"`;
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(window.location.href)}`;
    window.open(url, '_blank');
  };

  const handleShareToLinkedIn = () => {
    const text = `Check out this response from Ocean AI: "${messageContent.substring(0, 100)}${messageContent.length > 100 ? '...' : ''}"`;
    const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}&summary=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const handleShareToReddit = () => {
    const text = `Check out this response from Ocean AI: "${messageContent.substring(0, 100)}${messageContent.length > 100 ? '...' : ''}"`;
    const url = `https://reddit.com/submit?url=${encodeURIComponent(window.location.href)}&title=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  return (
    <div 
      className="fixed inset-0 bg-black/60 flex items-center justify-center p-4"
      style={{ 
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        zIndex: 999999,
        pointerEvents: 'auto'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full mx-4 transform transition-all duration-200 scale-100">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Share "{messageTitle}"
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-1"
          >
            <FaTimes className="w-5 h-5" />
          </button>
        </div>

        {/* Content Preview */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 via-cyan-500 to-teal-600 flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
            </div>
            <div className="flex-1">
              <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Ocean AI</div>
              <div className="text-gray-900 dark:text-gray-100 text-sm leading-relaxed">
                {messageContent.length > 120 
                  ? `${messageContent.substring(0, 120)}...` 
                  : messageContent
                }
              </div>
            </div>
          </div>
        </div>

        {/* Share Options */}
        <div className="p-6">
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handleCopyLink}
              className="flex flex-col items-center gap-3 p-4 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-all duration-200 group"
            >
              <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-600 group-hover:bg-gray-200 dark:group-hover:bg-gray-500 flex items-center justify-center transition-colors">
                <FaCopy className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              </div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {copied ? 'Copied!' : 'Copy link'}
              </span>
            </button>

            <button
              onClick={handleShareToX}
              className="flex flex-col items-center gap-3 p-4 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-all duration-200 group"
            >
              <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-600 group-hover:bg-gray-200 dark:group-hover:bg-gray-500 flex items-center justify-center transition-colors">
                <FaTwitter className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              </div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">X</span>
            </button>

            <button
              onClick={handleShareToLinkedIn}
              className="flex flex-col items-center gap-3 p-4 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-all duration-200 group"
            >
              <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-600 group-hover:bg-gray-200 dark:group-hover:bg-gray-500 flex items-center justify-center transition-colors">
                <FaLinkedin className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              </div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">LinkedIn</span>
            </button>

            <button
              onClick={handleShareToReddit}
              className="flex flex-col items-center gap-3 p-4 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-all duration-200 group"
            >
              <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-600 group-hover:bg-gray-200 dark:group-hover:bg-gray-500 flex items-center justify-center transition-colors">
                <FaReddit className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              </div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Reddit</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
