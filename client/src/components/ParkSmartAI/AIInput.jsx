import React from 'react';

/**
 * AIInput Component
 * Text input area with send button, Enter to send, Shift+Enter for new line.
 */
const AIInput = ({ value, onChange, onSubmit, inputRef, isLoading = false }) => {
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!isLoading && value && value.trim()) {
        onSubmit();
      }
    }
  };

  const isSubmitDisabled = isLoading || !value || !value.trim();

  return (
    <footer className="parksmart-ai-footer">
      <form
        className="parksmart-ai-input-form"
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit();
        }}
      >
        <textarea
          ref={inputRef}
          rows={1}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask ParkSmart AI..."
          className="parksmart-ai-input"
          aria-label="Ask ParkSmart AI"
        />
        <button
          type="submit"
          disabled={isSubmitDisabled}
          className="parksmart-ai-send-btn"
          aria-label="Send message"
          title="Send message"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
        </button>
      </form>
    </footer>
  );
};

export default AIInput;
