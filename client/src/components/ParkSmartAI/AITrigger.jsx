import React from 'react';
import SparkleIcon from './SparkleIcon';

/**
 * AITrigger Component
 * Floating 48px circular trigger button with custom 4-point sparkle icon.
 */
const AITrigger = ({ onClick, isOpen }) => {
  if (isOpen) {
    return null;
  }

  return (
    <div className="parksmart-ai-trigger-container">
      <button
        type="button"
        className="parksmart-ai-trigger"
        onClick={onClick}
        aria-label="Open ParkSmart AI"
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        title="Open ParkSmart AI"
      >
        <SparkleIcon size={22} className="parksmart-ai-trigger-icon" />
      </button>
    </div>
  );
};

export default AITrigger;
