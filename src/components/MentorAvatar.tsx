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

preloadedImage.onload = () => {
  globalImageLoaded = true;
  loadListeners.forEach(cb => cb());
  loadListeners.length = 0;
};

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
        ${showBorder ? "border-2 border-primary/30 shadow-lg" : ""}
        ${className}
      `}
    >
      {/* Skeleton placeholder */}
      <motion.div 
        className="absolute inset-0 bg-gradient-to-br from-primary/20 to-primary/5 rounded-full"
        initial={{ opacity: 1 }}
        animate={{ opacity: imageLoaded ? 0 : 1 }}
        transition={{ duration: 0.2 }}
      >
        {/* Animated pulse ring */}
        <motion.div
          className="absolute inset-0 rounded-full border-2 border-primary/30"
          animate={{ 
            scale: [1, 1.1, 1],
            opacity: [0.5, 0.2, 0.5]
          }}
          transition={{ 
            duration: 1.5, 
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        {/* Initial icon placeholder */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-1/3 h-1/3 rounded-full bg-primary/30" />
        </div>
      </motion.div>

      {/* Actual image */}
      <motion.img
        src={mentorPhoto}
        alt="Mentor Duarte"
        className="w-full h-full object-cover relative z-10"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ 
          opacity: imageLoaded ? 1 : 0,
          scale: imageLoaded ? 1 : 0.95
        }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        onLoad={() => setImageLoaded(true)}
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
