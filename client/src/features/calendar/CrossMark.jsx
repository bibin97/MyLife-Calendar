import React from 'react';
import { motion } from 'framer-motion';

/**
 * Hand-drawn SVG Cross Mark (X)
 * Uses two organic curves with ink-style taper and drawing animation
 */
export default function CrossMark({ color = '#dc2626', animated = true, className = '' }) {
  // SVG path with subtle natural curve representing hand-drawn pen strokes
  // Stroke 1: Top-left to bottom-right
  const stroke1Path = "M 14,14 Q 28,32 50,50";
  // Stroke 2: Top-right to bottom-left
  const stroke2Path = "M 50,14 Q 30,30 14,50";

  return (
    <div className={`absolute inset-0 flex items-center justify-center pointer-events-none p-1 ${className}`}>
      <svg
        viewBox="0 0 64 64"
        className="w-full h-full drop-shadow-sm select-none"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        {/* Stroke 1 */}
        {animated ? (
          <motion.path
            d={stroke1Path}
            stroke={color}
            strokeWidth="5.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0, opacity: 0.2 }}
            animate={{ pathLength: 1, opacity: 0.95 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
          />
        ) : (
          <path
            d={stroke1Path}
            stroke={color}
            strokeWidth="5.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.95"
          />
        )}

        {/* Stroke 2 with slight delay */}
        {animated ? (
          <motion.path
            d={stroke2Path}
            stroke={color}
            strokeWidth="5.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0, opacity: 0.2 }}
            animate={{ pathLength: 1, opacity: 0.95 }}
            transition={{ duration: 0.35, delay: 0.15, ease: "easeOut" }}
          />
        ) : (
          <path
            d={stroke2Path}
            stroke={color}
            strokeWidth="5.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.95"
          />
        )}
      </svg>
    </div>
  );
}
