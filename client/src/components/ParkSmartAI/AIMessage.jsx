import React from 'react';
import SparkleIcon from './SparkleIcon';

/**
 * AIMessage Component
 * Renders individual user and assistant messages with distinct styling.
 */
const AIMessage = ({ message }) => {
  const isAssistant = message.sender === 'assistant';

  return (
    <div
      className={`parksmart-ai-message ${
        isAssistant ? 'parksmart-ai-message-assistant' : 'parksmart-ai-message-user'
      }`}
    >
      {isAssistant && (
        <div className="parksmart-ai-msg-avatar" aria-hidden="true">
          <SparkleIcon size={14} />
        </div>
      )}
      <div
        className={
          isAssistant
            ? `parksmart-ai-bubble-assistant ${message.isError ? 'parksmart-ai-bubble-error' : ''}`
            : 'parksmart-ai-bubble-user'
        }
      >
        {isAssistant ? (
          message.text.split('\n\n').map((paragraph, idx) => (
            <p key={idx}>{paragraph}</p>
          ))
        ) : (
          <span>{message.text}</span>
        )}
      </div>
    </div>
  );
};

export default AIMessage;
