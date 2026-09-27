import React from 'react';

/**
 * Custom Four-Point Sparkle Icon for ParkSmart AI
 * Symmetrical 4-point star with smooth bezier curves.
 * Stylized using ParkSmart theme variables or currentColor.
 */
const SparkleIcon = ({ size = 20, className = '', useGradient = false, id = 'ps-sparkle', ...props }) => {
  const gradientId = `ps-ai-sparkle-grad-${id}`;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={useGradient ? `url(#${gradientId})` : 'currentColor'}
      xmlns="http://www.w3.org/2000/svg"
      className={`parksmart-ai-sparkle-svg ${className}`}
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      {useGradient && (
        <defs>
          <linearGradient id={gradientId} x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="var(--parksmart-ai-accent, #6366f1)" />
            <stop offset="50%" stopColor="#8b5cf6" />
            <stop offset="100%" stopColor="#3b82f6" />
          </linearGradient>
        </defs>
      )}
      {/* 
        Symmetrical 4-point star astroid path:
        Top: (12, 2.2), Right: (21.8, 12), Bottom: (12, 21.8), Left: (2.2, 12)
        Curves with smooth inward arcs towards (12, 12)
      */}
      <path
        d="M12 2.2C12 7.6 16.4 12 21.8 12C16.4 12 12 16.4 12 21.8C12 16.4 7.6 12 2.2 12C7.6 12 12 7.6 12 2.2Z"
      />
      {/* Subtle core highlight */}
      <circle cx="12" cy="12" r="1.5" fill="#ffffff" fillOpacity="0.35" />
    </svg>
  );
};

export default SparkleIcon;
