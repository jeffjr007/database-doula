import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import mentorPhoto from "@/assets/mentor-photo.png";

interface MentorAvatarProps {
  size?: "sm" | "md" | "lg" | "xl" | "xxl";
  className?: string;
  showBorder?: boolean;
}

// Preload the image globally when module loads
const preloadedImage = new Image();
preloadedImage.src = mentorPhoto;

// Track global load state
let globalImageLoaded = preloadedImage.complete;
const loadListeners: Array<() => void> = [];

if (!preloadedImage.complete) {
  preloadedImage.onload = () => {
    globalImageLoaded = true;
    loadListeners.forEach(cb => cb());
    loadListeners.length = 0;
  };
}

const sizeClasses = {
  sm: "w-8 h-8",
  md: "w-10 h-10",
  lg: "w-12 h-12",
  xl: "w-16 h-16",
  xxl: "w-24 h-24",
};

export function MentorAvatar({ 
  size = "md", 
  className = "",
  showBorder = true 
}: MentorAvatarProps) {
  const [imageLoaded, setImageLoaded] = useState(globalImageLoaded);

  useEffect(() => {
    if (globalImageLoaded) {
      setImageLoaded(true);
      return;
    }
    
    const handleLoad = () => setImageLoaded(true);
    loadListeners.push(handleLoad);
    
    return () => {
      const idx = loadListeners.indexOf(handleLoad);
      if (idx > -1) loadListeners.splice(idx, 1);
    };
  }, []);

  return (
    <div 
      className={`
        relative rounded-full overflow-hidden flex-shrink-0
        ${sizeClasses[size] || sizeClasses.md}
        ${showBorder ? "border-2 border-primary/30" : ""}
        ${className}
      `}
      style={{ backgroundColor: 'hsl(var(--muted))' }}
    >
      {/* Solid background placeholder - always visible initially */}
      <div 
        className="absolute inset-0 bg-muted flex items-center justify-center"
        style={{ 
          opacity: imageLoaded ? 0 : 1,
          transition: 'opacity 0.2s ease-out'
        }}
      >
        {/* Subtle shimmer effect */}
        <div 
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(90deg, transparent 0%, hsl(var(--primary) / 0.1) 50%, transparent 100%)',
            animation: 'shimmer 1.5s infinite',
          }}
        />
        {/* Circle placeholder */}
        <div className="w-2/5 h-2/5 rounded-full bg-muted-foreground/20" />
      </div>

      {/* Actual image */}
      <img
        src={mentorPhoto}
        alt="Mentor Duarte"
        className="w-full h-full object-cover relative z-10"
        style={{ 
          opacity: imageLoaded ? 1 : 0,
          transition: 'opacity 0.25s ease-out'
        }}
        onLoad={() => {
          globalImageLoaded = true;
          setImageLoaded(true);
        }}
      />
    </div>
  );
}

// Export preload function for eager loading
export function preloadMentorImage() {
  return new Promise<void>((resolve) => {
    if (globalImageLoaded) {
      resolve();
    } else {
      loadListeners.push(resolve);
    }
  });
}
