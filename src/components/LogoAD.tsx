import React from 'react';
import { cn } from '@/lib/utils';

interface LogoADProps {
  className?: string;
  size?: number;
}

/**
 * SVG version of the AD logo for instant rendering
 * Eliminates loading delay compared to PNG version
 */
export const LogoAD: React.FC<LogoADProps> = ({ className, size = 64 }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("rounded-2xl", className)}
    >
      {/* Background */}
      <rect width="100" height="100" rx="12" fill="#1a1a1a" />
      
      {/* Letter A - left stroke */}
      <path
        d="M22 78C19 78 17 76 17 73L17 55C17 52 19 50 22 50C25 50 27 52 27 55L27 73C27 76 25 78 22 78Z"
        fill="white"
      />
      
      {/* Letter A - main shape */}
      <path
        d="M22 78C19 78 17 76 17 73L39 25C40 23 42 22 44 22C46 22 48 23 49 25L54 34L44 52L34 73C33 76 31 78 28 78L22 78Z"
        fill="white"
      />
      
      {/* Letter A - right diagonal */}
      <path
        d="M44 22C46 22 48 23 49 25L71 65C72 67 71 70 68 71C65 72 62 71 61 68L44 38L44 22Z"
        fill="white"
      />
      
      {/* Orange accent on A */}
      <path
        d="M44 30L44 55L34 73C33 75 31 77 29 77L44 47L54 34L49 25C48 23 46 22 44 22L44 30Z"
        fill="url(#gradient-orange)"
      />
      
      {/* Letter D - main body */}
      <path
        d="M58 25L58 75C58 76 59 77 60 77L72 77C84 77 92 68 92 55L92 47C92 34 84 25 72 25L60 25C59 25 58 26 58 27L58 25Z"
        fill="white"
      />
      
      {/* Letter D - inner cutout */}
      <path
        d="M68 35L72 35C78 35 82 40 82 47L82 55C82 62 78 67 72 67L68 67L68 35Z"
        fill="#1a1a1a"
      />
      
      {/* Orange dot in D */}
      <circle cx="75" cy="51" r="8" fill="url(#gradient-orange)" />
      
      {/* Gradients */}
      <defs>
        <linearGradient id="gradient-orange" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#f5a623" />
          <stop offset="100%" stopColor="#e8871e" />
        </linearGradient>
      </defs>
    </svg>
  );
};

export default LogoAD;
