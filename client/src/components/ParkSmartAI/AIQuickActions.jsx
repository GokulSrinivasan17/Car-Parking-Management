import React from 'react';

/**
 * AIQuickActions Component
 * Renders UI shortcuts for common queries.
 * Populates input field upon click without triggering fake AI answers.
 */
const AIQuickActions = ({ onSelectAction }) => {
  return (
    <div className="parksmart-ai-quick-actions" role="group" aria-label="Suggested quick actions">
      <button
        type="button"
        className="parksmart-ai-action-btn"
        onClick={() => onSelectAction('I want to book a parking slot.')}
        aria-label="Ask to book a parking slot"
      >
        <span>🚗</span>
        <span>Book a parking slot</span>
      </button>

      <button
        type="button"
        className="parksmart-ai-action-btn"
        onClick={() => onSelectAction('I have a question about ParkSmart.')}
        aria-label="Ask questions about ParkSmart"
      >
        <span>❓</span>
        <span>Ask about ParkSmart</span>
      </button>
    </div>
  );
};

export default AIQuickActions;
