import React, { useEffect, useRef } from 'react';
import SparkleIcon from './SparkleIcon';
import AIMessage from './AIMessage';
import AIQuickActions from './AIQuickActions';
import AIInput from './AIInput';

/**
 * AIChatWindow Component
 * Floating conversational panel for ParkSmart AI shell.
 */
const AIChatWindow = ({
  isOpen,
  onClose,
  messages,
  inputValue,
  onInputChange,
  onSendMessage,
  onSelectQuickAction,
  inputRef,
  isLoading = false
}) => {
  const messagesEndRef = useRef(null);

  // Auto-scroll to latest message
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  // Handle Escape key to close
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef?.current) {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [isOpen, inputRef]);

  return (
    <div
      className={`parksmart-ai-window ${!isOpen ? 'parksmart-ai-window-closed' : ''}`}
      role="dialog"
      aria-label="ParkSmart AI Assistant"
      aria-modal="false"
      aria-hidden={!isOpen}
    >
      {/* Header */}
      <header className="parksmart-ai-header">
        <div className="parksmart-ai-header-left">
          <div className="parksmart-ai-icon-badge" aria-hidden="true">
            <SparkleIcon size={16} />
          </div>
          <div className="parksmart-ai-header-info">
            <span className="parksmart-ai-title">ParkSmart AI</span>
            <span className="parksmart-ai-subtitle">AI Assistant</span>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="parksmart-ai-minimize-btn"
          aria-label="Minimize ParkSmart AI"
          title="Minimize ParkSmart AI"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>
      </header>

      {/* Messages Scroll Area */}
      <div className="parksmart-ai-body" role="log" aria-live="polite">
        {messages.map((msg) => (
          <AIMessage key={msg.id} message={msg} />
        ))}

        {/* Loading / Typing indicator */}
        {isLoading && (
          <div className="parksmart-ai-message parksmart-ai-message-assistant parksmart-ai-typing" aria-label="ParkSmart AI is typing">
            <div className="parksmart-ai-msg-avatar" aria-hidden="true">
              <SparkleIcon size={14} />
            </div>
            <div className="parksmart-ai-bubble-assistant parksmart-ai-bubble-typing">
              <span className="parksmart-ai-dot" />
              <span className="parksmart-ai-dot" />
              <span className="parksmart-ai-dot" />
            </div>
          </div>
        )}

        {/* Quick action shortcuts */}
        <AIQuickActions onSelectAction={onSelectQuickAction} />

        <div ref={messagesEndRef} aria-hidden="true" />
      </div>

      {/* Chat Input */}
      <AIInput
        value={inputValue}
        onChange={onInputChange}
        onSubmit={onSendMessage}
        inputRef={inputRef}
        isLoading={isLoading}
      />
    </div>
  );
};

export default AIChatWindow;
